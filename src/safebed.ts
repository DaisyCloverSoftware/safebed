import type {
  ActorRole,
  MatchReason,
  MatchResult,
  NormalisedAvailability,
  PlacementNeed,
  ProviderAdapter,
  ProviderCapabilities,
  PublicService,
  Referral,
  Reservation,
  SearchResult,
  Hold,
} from "./model.ts";
import { ProviderUnavailableError } from "./synthetic-provider.ts";

export interface PublicServiceDiscoveryItem {
  readonly service: PublicService;
  readonly providerCapabilities: ProviderCapabilities;
}

export class SafeBedSandbox {
  #providers: readonly ProviderAdapter[];

  constructor(providers: readonly ProviderAdapter[]) {
    this.#providers = providers;
  }

  listPublicServices(): readonly PublicServiceDiscoveryItem[] {
    return this.#providers.flatMap((provider) =>
      provider.listServices().map((service) => ({
        service,
        providerCapabilities: provider.capabilities,
      })),
    );
  }

  async getAvailability(serviceId: string, now = new Date()): Promise<NormalisedAvailability> {
    const provider = this.#providerForService(serviceId);
    return this.#availability(provider, serviceId, now);
  }

  async search(need: PlacementNeed, now = new Date()): Promise<SearchResult> {
    const matches: MatchResult[] = [];
    for (const provider of this.#providers) {
      for (const service of provider.listServices()) {
        const availability = await this.#availability(provider, service.serviceId, now);
        matches.push(this.#match(service, provider.capabilities, need, availability));
      }
    }

    matches.sort((left, right) => this.#rank(left) - this.#rank(right));
    const confirmedCandidate = matches.some(
      (match) =>
        (match.matchState === "SUITABLE" || match.matchState === "POSSIBLY_SUITABLE") &&
        (match.availability.state === "AVAILABLE" || match.availability.state === "LIMITED"),
    );

    return {
      outcome: confirmedCandidate ? "CANDIDATES_FOUND" : "NO_CONFIRMED_PLACEMENT",
      matches,
    };
  }

  async submitAndAccept(providerId: string, serviceId: string, now = new Date()): Promise<Referral> {
    const provider = this.#provider(providerId);
    const referral = await provider.submitReferral(serviceId, now);
    return provider.acceptReferral(referral.referralId, now);
  }

  async requestHold(input: {
    providerId: string;
    referralId: string;
    serviceId: string;
    expectedSourceRevision: string;
    idempotencyKey: string;
    requestedSeconds: number;
    now?: Date;
  }): Promise<Hold> {
    const provider = this.#provider(input.providerId);
    return provider.requestHold({
      referralId: input.referralId,
      serviceId: input.serviceId,
      expectedSourceRevision: input.expectedSourceRevision,
      idempotencyKey: input.idempotencyKey,
      requestedSeconds: input.requestedSeconds,
      now: input.now ?? new Date(),
    });
  }

  async reserve(input: {
    providerId: string;
    serviceId: string;
    referralId: string;
    holdId: string;
    idempotencyKey: string;
    actorRole: ActorRole;
    now?: Date;
  }): Promise<Reservation> {
    const provider = this.#provider(input.providerId);
    const service = this.#service(provider, input.serviceId);
    return provider.reserve({
      referralId: input.referralId,
      holdId: input.holdId,
      idempotencyKey: input.idempotencyKey,
      now: input.now ?? new Date(),
      canDiscloseDestination: this.#canDiscloseDestination(service, input.actorRole),
    });
  }

  async confirmArrival(providerId: string, reservationId: string, now = new Date()): Promise<Reservation> {
    return this.#provider(providerId).confirmArrival(reservationId, now);
  }

  #provider(providerId: string): ProviderAdapter {
    const provider = this.#providers.find((candidate) => candidate.providerId === providerId);
    if (!provider) throw new Error(`Unknown provider: ${providerId}`);
    return provider;
  }

  #providerForService(serviceId: string): ProviderAdapter {
    const provider = this.#providers.find((candidate) =>
      candidate.listServices().some((service) => service.serviceId === serviceId),
    );
    if (!provider) throw new Error(`Unknown service: ${serviceId}`);
    return provider;
  }

  #service(provider: ProviderAdapter, serviceId: string): PublicService {
    const service = provider.listServices().find((candidate) => candidate.serviceId === serviceId);
    if (!service) throw new Error(`Unknown service: ${serviceId}`);
    return service;
  }

  #canDiscloseDestination(service: PublicService, actorRole: ActorRole): boolean {
    if (service.disclosureLevel === "SEALED") return false;
    if (service.disclosureLevel === "RESTRICTED") return actorRole === "SPECIALIST_AUTHORISED";
    if (service.disclosureLevel === "PLACEMENT_AUTHORISED") {
      return actorRole === "VERIFIED_PROFESSIONAL" || actorRole === "PROVIDER" || actorRole === "SPECIALIST_AUTHORISED";
    }
    if (service.disclosureLevel === "VERIFIED_USER") return actorRole !== "PUBLIC";
    return true;
  }

  async #availability(
    provider: ProviderAdapter,
    serviceId: string,
    now: Date,
  ): Promise<NormalisedAvailability> {
    try {
      const snapshot = await provider.getAvailability(serviceId, now);
      const freshUntil = new Date(snapshot.freshUntil).getTime();
      let state: NormalisedAvailability["state"];
      if (freshUntil < now.getTime()) state = "STALE";
      else if (snapshot.manualConfirmationRequired) state = "MANUAL_CONFIRMATION_REQUIRED";
      else if (snapshot.availableUnits < 1) state = "FULL";
      else if (snapshot.availableUnits === 1) state = "LIMITED";
      else state = "AVAILABLE";
      return { ...snapshot, state };
    } catch (error) {
      if (!(error instanceof ProviderUnavailableError)) throw error;
      return {
        serviceId,
        availableUnits: 0,
        maximumUnits: 0,
        sourceRevision: "unavailable",
        sourceUpdatedAt: now.toISOString(),
        observedAt: now.toISOString(),
        freshUntil: now.toISOString(),
        manualConfirmationRequired: true,
        state: "UNKNOWN",
      };
    }
  }

  #match(
    service: PublicService,
    providerCapabilities: ProviderCapabilities,
    need: PlacementNeed,
    availability: NormalisedAvailability,
  ): MatchResult {
    const reasons: MatchReason[] = [];
    const rules = service.rules;

    if (
      (rules.minimumHouseholdSize !== undefined && need.householdSize < rules.minimumHouseholdSize) ||
      (rules.maximumHouseholdSize !== undefined && need.householdSize > rules.maximumHouseholdSize)
    ) {
      reasons.push({ code: "HOUSEHOLD_SIZE_UNSUPPORTED", message: "Household size does not match this service's published criteria." });
    }
    if ((need.childCount ?? 0) > 0 && rules.childrenAllowed === false) {
      reasons.push({ code: "CHILDREN_UNSUPPORTED", message: "This service does not accept households with children under its published criteria." });
    }
    if (need.wheelchairAccessRequired && rules.wheelchairAccessible !== true) {
      reasons.push({ code: "ACCESSIBILITY_UNKNOWN_OR_UNSUPPORTED", message: "Required wheelchair accessibility is not confirmed for this service." });
    }
    if (need.assistanceAnimal && rules.assistanceAnimalsAllowed === false) {
      reasons.push({ code: "ASSISTANCE_ANIMAL_UNSUPPORTED", message: "This service's published criteria do not support the required assistance animal." });
    }
    if (need.otherPets && rules.petsAllowed === false) {
      reasons.push({ code: "PET_POLICY_INCOMPATIBLE", message: "This service's published pet policy does not match the need entered." });
    }
    if (rules.professionalReferralRequired && !need.professionalReferralAvailable) {
      reasons.push({ code: "PROFESSIONAL_REFERRAL_REQUIRED", message: "A verified professional referral is required for this service." });
    }
    if (
      availability.state === "STALE" ||
      availability.state === "UNKNOWN" ||
      availability.state === "MANUAL_CONFIRMATION_REQUIRED"
    ) {
      reasons.push({ code: "CAPACITY_UNCONFIRMED", message: "Current usable capacity cannot be treated as confirmed." });
    }

    const pathwayReasons = new Set<MatchReason["code"]>([
      "CAPACITY_UNCONFIRMED",
      "PROFESSIONAL_REFERRAL_REQUIRED",
    ]);
    const hardMismatch = reasons.some((reason) => !pathwayReasons.has(reason.code));
    const matchState = hardMismatch
      ? "NOT_MATCHED"
      : reasons.length > 0
        ? "POSSIBLY_SUITABLE"
        : "SUITABLE";

    return { service, providerCapabilities, matchState, reasons, availability };
  }

  #rank(match: MatchResult): number {
    const matchRank = {
      SUITABLE: 0,
      POSSIBLY_SUITABLE: 10,
      INSUFFICIENT_INFORMATION: 20,
      NOT_MATCHED: 30,
    }[match.matchState];
    const availabilityRank = {
      AVAILABLE: 0,
      LIMITED: 1,
      MANUAL_CONFIRMATION_REQUIRED: 5,
      FULL: 10,
      STALE: 20,
      UNKNOWN: 30,
    }[match.availability.state];
    return matchRank + availabilityRank;
  }
}
