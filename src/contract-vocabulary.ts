import type {
  AvailabilityState,
  DisclosureLevel,
  HoldStatus,
  MatchReason,
  MatchState,
  ProviderIntegrationMode,
  ReferralMode,
  ReferralStatus,
  ReservationMode,
  ReservationStatus,
  SearchOutcome,
} from "./model.ts";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends
  (<T>() => T extends B ? 1 : 2) ? true : false;

type Expect<T extends true> = T;

export const DISCLOSURE_LEVELS = [
  "PUBLIC",
  "VERIFIED_USER",
  "PLACEMENT_AUTHORISED",
  "RESTRICTED",
  "SEALED",
] as const;

export const AVAILABILITY_STATES = [
  "AVAILABLE",
  "LIMITED",
  "FULL",
  "MANUAL_CONFIRMATION_REQUIRED",
  "STALE",
  "UNKNOWN",
] as const;

export const MATCH_STATES = [
  "SUITABLE",
  "POSSIBLY_SUITABLE",
  "NOT_MATCHED",
  "INSUFFICIENT_INFORMATION",
] as const;

export const SEARCH_OUTCOMES = [
  "CANDIDATES_FOUND",
  "NO_CONFIRMED_PLACEMENT",
] as const;

export const PROVIDER_INTEGRATION_MODES = [
  "LIVE_API",
  "READ_ONLY_FEED",
  "SAFEBED_PORTAL",
  "MANUAL_CONFIRMATION",
  "RESTRICTED_SPECIALIST",
] as const;

export const REFERRAL_MODES = [
  "SAFEBED_TRANSACTION",
  "SAFEBED_PORTAL",
  "EXTERNAL_MANUAL",
] as const;

export const RESERVATION_MODES = [
  "SAFEBED_TRANSACTION",
  "SAFEBED_PORTAL",
  "EXTERNAL_MANUAL",
] as const;

export const REFERRAL_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "DECLINED",
  "MORE_INFORMATION_REQUIRED",
  "WITHDRAWN",
  "EXPIRED",
] as const;

export const HOLD_STATUSES = [
  "ACTIVE",
  "RELEASED",
  "EXPIRED",
  "CONSUMED",
] as const;

export const RESERVATION_STATUSES = [
  "CONFIRMED",
  "ARRIVED",
  "CANCELLED",
  "NO_SHOW",
] as const;

export const MATCH_REASON_CODES = [
  "HOUSEHOLD_SIZE_UNSUPPORTED",
  "CHILDREN_UNSUPPORTED",
  "ACCESSIBILITY_UNKNOWN_OR_UNSUPPORTED",
  "ASSISTANCE_ANIMAL_UNSUPPORTED",
  "PET_POLICY_INCOMPATIBLE",
  "PROFESSIONAL_REFERRAL_REQUIRED",
  "CAPACITY_UNCONFIRMED",
] as const;

type _DisclosureVocabularyMatchesModel = Expect<Equal<DisclosureLevel, (typeof DISCLOSURE_LEVELS)[number]>>;
type _AvailabilityVocabularyMatchesModel = Expect<Equal<AvailabilityState, (typeof AVAILABILITY_STATES)[number]>>;
type _MatchVocabularyMatchesModel = Expect<Equal<MatchState, (typeof MATCH_STATES)[number]>>;
type _SearchOutcomeVocabularyMatchesModel = Expect<Equal<SearchOutcome, (typeof SEARCH_OUTCOMES)[number]>>;
type _ProviderModeVocabularyMatchesModel = Expect<Equal<ProviderIntegrationMode, (typeof PROVIDER_INTEGRATION_MODES)[number]>>;
type _ReferralModeVocabularyMatchesModel = Expect<Equal<ReferralMode, (typeof REFERRAL_MODES)[number]>>;
type _ReservationModeVocabularyMatchesModel = Expect<Equal<ReservationMode, (typeof RESERVATION_MODES)[number]>>;
type _ReferralStatusVocabularyMatchesModel = Expect<Equal<ReferralStatus, (typeof REFERRAL_STATUSES)[number]>>;
type _HoldStatusVocabularyMatchesModel = Expect<Equal<HoldStatus, (typeof HOLD_STATUSES)[number]>>;
type _ReservationStatusVocabularyMatchesModel = Expect<Equal<ReservationStatus, (typeof RESERVATION_STATUSES)[number]>>;
type _MatchReasonVocabularyMatchesModel = Expect<Equal<MatchReason["code"], (typeof MATCH_REASON_CODES)[number]>>;
