import type {
  CapacitySnapshot,
  Hold,
  ProviderAdapter,
  ProviderDestination,
  PublicService,
  Referral,
  Reservation,
} from "./model.ts";

export class CapacityConflictError extends Error {
  constructor(message = "The requested capacity is no longer available.") {
    super(message);
    this.name = "CapacityConflictError";
  }
}

export class ProviderUnavailableError extends Error {
  constructor(message = "The provider source is unavailable.") {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

export class InvalidProviderTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidProviderTransitionError";
  }
}

interface SyntheticServiceConfig {
  readonly service: PublicService;
  readonly availableUnits: number;
  readonly maximumUnits: number;
  readonly sourceUpdatedAt: string;
  readonly ttlSeconds: number;
  readonly manualConfirmationRequired?: boolean;
  readonly destination?: ProviderDestination;
}

interface MutableCapacity {
  availableUnits: number;
  maximumUnits: number;
  revision: number;
  sourceUpdatedAt: string;
  ttlSeconds: number;
  manualConfirmationRequired: boolean;
}

interface MutableHold extends Hold {
  status: "ACTIVE" | "RELEASED" | "EXPIRED" | "CONSUMED";
}

interface MutableReservation extends Reservation {
  status: "CONFIRMED" | "ARRIVED" | "CANCELLED" | "NO_SHOW";
}

export class SyntheticProviderAdapter implements ProviderAdapter {
  readonly providerId: string;
  #services = new Map<string, PublicService>();
  #capacities = new Map<string, MutableCapacity>();
  #destinations = new Map<string, ProviderDestination>();
  #referrals = new Map<string, Referral>();
  #holds = new Map<string, MutableHold>();
  #reservations = new Map<string, MutableReservation>();
  #holdByIdempotencyKey = new Map<string, string>();
  #reservationByIdempotencyKey = new Map<string, string>();
  #online = true;

  constructor(providerId: string, services: readonly SyntheticServiceConfig[]) {
    this.providerId = providerId;
    for (const config of services) {
      if (config.service.providerId !== providerId) {
        throw new Error("Synthetic service providerId must match adapter providerId.");
      }
      this.#services.set(config.service.serviceId, config.service);
      this.#capacities.set(config.service.serviceId, {
        availableUnits: config.availableUnits,
        maximumUnits: config.maximumUnits,
        revision: 1,
        sourceUpdatedAt: config.sourceUpdatedAt,
        ttlSeconds: config.ttlSeconds,
        manualConfirmationRequired: config.manualConfirmationRequired ?? false,
      });
      if (config.destination) {
        this.#destinations.set(config.service.serviceId, config.destination);
      }
    }
  }

  setOnline(online: boolean): void {
    this.#online = online;
  }

  setSourceUpdatedAt(serviceId: string, sourceUpdatedAt: string): void {
    const capacity = this.#capacity(serviceId);
    capacity.sourceUpdatedAt = sourceUpdatedAt;
    capacity.revision += 1;
  }

  listServices(): readonly PublicService[] {
    return [...this.#services.values()];
  }

  async getAvailability(serviceId: string, now: Date): Promise<CapacitySnapshot> {
    this.#assertOnline();
    this.#expireHolds(now);
    const capacity = this.#capacity(serviceId);
    return this.#snapshot(serviceId, capacity, now);
  }

  async submitReferral(serviceId: string, now: Date): Promise<Referral> {
    this.#assertOnline();
    this.#service(serviceId);
    const timestamp = now.toISOString();
    const referral: Referral = {
      referralId: globalThis.crypto.randomUUID(),
      serviceId,
      status: "SUBMITTED",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.#referrals.set(referral.referralId, referral);
    return referral;
  }

  async acceptReferral(referralId: string, now: Date): Promise<Referral> {
    this.#assertOnline();
    const existing = this.#referral(referralId);
    if (existing.status !== "SUBMITTED" && existing.status !== "UNDER_REVIEW") {
      throw new InvalidProviderTransitionError(`Cannot accept referral in state ${existing.status}.`);
    }
    const updated: Referral = { ...existing, status: "ACCEPTED", updatedAt: now.toISOString() };
    this.#referrals.set(referralId, updated);
    return updated;
  }

  async requestHold(input: {
    referralId: string;
    serviceId: string;
    expectedSourceRevision: string;
    idempotencyKey: string;
    requestedSeconds: number;
    now: Date;
  }): Promise<Hold> {
    this.#assertOnline();
    this.#expireHolds(input.now);

    const existingHoldId = this.#holdByIdempotencyKey.get(input.idempotencyKey);
    if (existingHoldId) {
      return this.#holds.get(existingHoldId)!;
    }

    const referral = this.#referral(input.referralId);
    if (referral.status !== "ACCEPTED") {
      throw new InvalidProviderTransitionError("A referral must be accepted before a hold is granted.");
    }
    if (referral.serviceId !== input.serviceId) {
      throw new InvalidProviderTransitionError("Referral does not belong to the requested service.");
    }

    const capacity = this.#capacity(input.serviceId);
    const currentRevision = this.#revision(capacity);
    if (currentRevision !== input.expectedSourceRevision || capacity.availableUnits < 1) {
      throw new CapacityConflictError();
    }

    capacity.availableUnits -= 1;
    capacity.revision += 1;
    capacity.sourceUpdatedAt = input.now.toISOString();

    const durationSeconds = Math.max(60, Math.min(input.requestedSeconds, 1800));
    const hold: MutableHold = {
      holdId: globalThis.crypto.randomUUID(),
      referralId: input.referralId,
      serviceId: input.serviceId,
      status: "ACTIVE",
      createdAt: input.now.toISOString(),
      expiresAt: new Date(input.now.getTime() + durationSeconds * 1000).toISOString(),
      sourceRevision: this.#revision(capacity),
    };
    this.#holds.set(hold.holdId, hold);
    this.#holdByIdempotencyKey.set(input.idempotencyKey, hold.holdId);
    return hold;
  }

  async releaseHold(holdId: string, now: Date): Promise<void> {
    this.#assertOnline();
    this.#expireHolds(now);
    const hold = this.#holds.get(holdId);
    if (!hold || hold.status !== "ACTIVE") return;
    this.#restoreCapacity(hold.serviceId, now);
    hold.status = "RELEASED";
  }

  async reserve(input: {
    referralId: string;
    holdId: string;
    idempotencyKey: string;
    now: Date;
    canDiscloseDestination: boolean;
  }): Promise<Reservation> {
    this.#assertOnline();
    this.#expireHolds(input.now);

    const existingReservationId = this.#reservationByIdempotencyKey.get(input.idempotencyKey);
    if (existingReservationId) {
      return this.#reservations.get(existingReservationId)!;
    }

    const referral = this.#referral(input.referralId);
    if (referral.status !== "ACCEPTED") {
      throw new InvalidProviderTransitionError("Referral must be accepted before reservation.");
    }

    const hold = this.#holds.get(input.holdId);
    if (!hold || hold.status !== "ACTIVE" || hold.referralId !== input.referralId) {
      throw new CapacityConflictError("The hold is no longer active.");
    }

    hold.status = "CONSUMED";
    const service = this.#service(hold.serviceId);
    const destination = this.#destinations.get(service.serviceId);
    const reservation: MutableReservation = {
      reservationId: globalThis.crypto.randomUUID(),
      referralId: input.referralId,
      serviceId: service.serviceId,
      status: "CONFIRMED",
      reservedAt: input.now.toISOString(),
      ...(input.canDiscloseDestination && destination ? { destination } : {}),
    };
    this.#reservations.set(reservation.reservationId, reservation);
    this.#reservationByIdempotencyKey.set(input.idempotencyKey, reservation.reservationId);
    return reservation;
  }

  async confirmArrival(reservationId: string, now: Date): Promise<Reservation> {
    this.#assertOnline();
    const reservation = this.#reservations.get(reservationId);
    if (!reservation) throw new InvalidProviderTransitionError("Reservation not found.");
    if (reservation.status !== "CONFIRMED") {
      throw new InvalidProviderTransitionError(`Cannot confirm arrival in state ${reservation.status}.`);
    }
    const updated: MutableReservation = {
      ...reservation,
      status: "ARRIVED",
      arrivalConfirmedAt: now.toISOString(),
    };
    this.#reservations.set(reservationId, updated);
    return updated;
  }

  #assertOnline(): void {
    if (!this.#online) throw new ProviderUnavailableError();
  }

  #service(serviceId: string): PublicService {
    const service = this.#services.get(serviceId);
    if (!service) throw new Error(`Unknown service: ${serviceId}`);
    return service;
  }

  #capacity(serviceId: string): MutableCapacity {
    const capacity = this.#capacities.get(serviceId);
    if (!capacity) throw new Error(`Unknown capacity: ${serviceId}`);
    return capacity;
  }

  #referral(referralId: string): Referral {
    const referral = this.#referrals.get(referralId);
    if (!referral) throw new InvalidProviderTransitionError("Referral not found.");
    return referral;
  }

  #revision(capacity: MutableCapacity): string {
    return `r${capacity.revision}`;
  }

  #snapshot(serviceId: string, capacity: MutableCapacity, now: Date): CapacitySnapshot {
    const updated = new Date(capacity.sourceUpdatedAt);
    return {
      serviceId,
      availableUnits: capacity.availableUnits,
      maximumUnits: capacity.maximumUnits,
      sourceRevision: this.#revision(capacity),
      sourceUpdatedAt: capacity.sourceUpdatedAt,
      observedAt: now.toISOString(),
      freshUntil: new Date(updated.getTime() + capacity.ttlSeconds * 1000).toISOString(),
      manualConfirmationRequired: capacity.manualConfirmationRequired,
    };
  }

  #expireHolds(now: Date): void {
    for (const hold of this.#holds.values()) {
      if (hold.status === "ACTIVE" && new Date(hold.expiresAt).getTime() <= now.getTime()) {
        this.#restoreCapacity(hold.serviceId, now);
        hold.status = "EXPIRED";
      }
    }
  }

  #restoreCapacity(serviceId: string, now: Date): void {
    const capacity = this.#capacity(serviceId);
    capacity.availableUnits = Math.min(capacity.availableUnits + 1, capacity.maximumUnits);
    capacity.revision += 1;
    capacity.sourceUpdatedAt = now.toISOString();
  }
}
