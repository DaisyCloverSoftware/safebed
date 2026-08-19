export type DisclosureLevel =
  | "PUBLIC"
  | "VERIFIED_USER"
  | "PLACEMENT_AUTHORISED"
  | "RESTRICTED"
  | "SEALED";

export type AvailabilityState =
  | "AVAILABLE"
  | "LIMITED"
  | "FULL"
  | "MANUAL_CONFIRMATION_REQUIRED"
  | "STALE"
  | "UNKNOWN";

export type MatchState =
  | "SUITABLE"
  | "POSSIBLY_SUITABLE"
  | "NOT_MATCHED"
  | "INSUFFICIENT_INFORMATION";

export type SearchOutcome = "CANDIDATES_FOUND" | "NO_CONFIRMED_PLACEMENT";

export type ActorRole =
  | "PUBLIC"
  | "VERIFIED_PROFESSIONAL"
  | "PROVIDER"
  | "SPECIALIST_AUTHORISED";

export type ReferralStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "DECLINED"
  | "MORE_INFORMATION_REQUIRED"
  | "WITHDRAWN"
  | "EXPIRED";

export type HoldStatus = "ACTIVE" | "RELEASED" | "EXPIRED" | "CONSUMED";
export type ReservationStatus = "CONFIRMED" | "ARRIVED" | "CANCELLED" | "NO_SHOW";

export interface PlacementNeed {
  readonly requiredFor: string;
  readonly householdSize: number;
  readonly childCount?: number;
  readonly wheelchairAccessRequired?: boolean;
  readonly assistanceAnimal?: boolean;
  readonly otherPets?: boolean;
  readonly professionalReferralAvailable?: boolean;
}

export interface ServiceRules {
  readonly minimumHouseholdSize?: number;
  readonly maximumHouseholdSize?: number;
  readonly childrenAllowed?: boolean;
  readonly wheelchairAccessible?: boolean;
  readonly assistanceAnimalsAllowed?: boolean;
  readonly petsAllowed?: boolean;
  readonly professionalReferralRequired?: boolean;
}

export interface PublicService {
  readonly serviceId: string;
  readonly providerId: string;
  readonly name: string;
  readonly publicAreaLabel: string;
  readonly disclosureLevel: DisclosureLevel;
  readonly rules: ServiceRules;
}

export interface ProviderDestination {
  readonly addressText: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly arrivalInstructions?: string;
}

export interface CapacitySnapshot {
  readonly serviceId: string;
  readonly availableUnits: number;
  readonly maximumUnits: number;
  readonly sourceRevision: string;
  readonly sourceUpdatedAt: string;
  readonly observedAt: string;
  readonly freshUntil: string;
  readonly manualConfirmationRequired: boolean;
}

export interface NormalisedAvailability extends CapacitySnapshot {
  readonly state: AvailabilityState;
}

export interface MatchReason {
  readonly code:
    | "HOUSEHOLD_SIZE_UNSUPPORTED"
    | "CHILDREN_UNSUPPORTED"
    | "ACCESSIBILITY_UNKNOWN_OR_UNSUPPORTED"
    | "ASSISTANCE_ANIMAL_UNSUPPORTED"
    | "PET_POLICY_INCOMPATIBLE"
    | "PROFESSIONAL_REFERRAL_REQUIRED"
    | "CAPACITY_UNCONFIRMED";
  readonly message: string;
}

export interface MatchResult {
  readonly service: PublicService;
  readonly matchState: MatchState;
  readonly reasons: readonly MatchReason[];
  readonly availability: NormalisedAvailability;
}

export interface SearchResult {
  readonly outcome: SearchOutcome;
  readonly matches: readonly MatchResult[];
}

export interface Referral {
  readonly referralId: string;
  readonly serviceId: string;
  readonly status: ReferralStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface Hold {
  readonly holdId: string;
  readonly referralId: string;
  readonly serviceId: string;
  readonly status: HoldStatus;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly sourceRevision: string;
}

export interface Reservation {
  readonly reservationId: string;
  readonly referralId: string;
  readonly serviceId: string;
  readonly status: ReservationStatus;
  readonly reservedAt: string;
  readonly destination?: ProviderDestination;
  readonly arrivalConfirmedAt?: string;
}

export interface ProviderAdapter {
  readonly providerId: string;
  listServices(): readonly PublicService[];
  getAvailability(serviceId: string, now: Date): Promise<CapacitySnapshot>;
  submitReferral(serviceId: string, now: Date): Promise<Referral>;
  acceptReferral(referralId: string, now: Date): Promise<Referral>;
  requestHold(input: {
    referralId: string;
    serviceId: string;
    expectedSourceRevision: string;
    idempotencyKey: string;
    requestedSeconds: number;
    now: Date;
  }): Promise<Hold>;
  releaseHold(holdId: string, now: Date): Promise<void>;
  reserve(input: {
    referralId: string;
    holdId: string;
    idempotencyKey: string;
    now: Date;
    canDiscloseDestination: boolean;
  }): Promise<Reservation>;
  confirmArrival(reservationId: string, now: Date): Promise<Reservation>;
}
