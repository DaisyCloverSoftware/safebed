import type { ProviderCapabilities, PublicService } from "./model.ts";
import { SyntheticProviderAdapter } from "./synthetic-provider.ts";

export const SYNTHETIC_PROFILE_NOW = new Date("2026-08-19T21:00:00.000Z");

function capabilities(
  integrationMode: ProviderCapabilities["integrationMode"],
  referralMode: ProviderCapabilities["referralMode"],
  holdSupported: boolean,
  reservationMode: ProviderCapabilities["reservationMode"],
): ProviderCapabilities {
  return { integrationMode, referralMode, holdSupported, reservationMode };
}

function service(input: {
  serviceId: string;
  providerId: string;
  name: string;
  disclosureLevel?: PublicService["disclosureLevel"];
  professionalReferralRequired?: boolean;
}): PublicService {
  return {
    serviceId: input.serviceId,
    providerId: input.providerId,
    name: input.name,
    publicAreaLabel: "Synthetic test district",
    disclosureLevel: input.disclosureLevel ?? "PUBLIC",
    rules: {
      maximumHouseholdSize: 1,
      childrenAllowed: false,
      wheelchairAccessible: true,
      assistanceAnimalsAllowed: true,
      petsAllowed: false,
      professionalReferralRequired: input.professionalReferralRequired ?? false,
    },
  };
}

export const syntheticProfileServices = {
  liveApi: service({
    serviceId: "10000000-0000-4000-8000-000000000001",
    providerId: "synthetic-live-api",
    name: "Synthetic Live API Shelter",
    disclosureLevel: "PLACEMENT_AUTHORISED",
  }),
  readOnlyFeed: service({
    serviceId: "10000000-0000-4000-8000-000000000002",
    providerId: "synthetic-read-only",
    name: "Synthetic Read-only Feed Shelter",
  }),
  portal: service({
    serviceId: "10000000-0000-4000-8000-000000000003",
    providerId: "synthetic-portal",
    name: "Synthetic Portal-managed Shelter",
    disclosureLevel: "SEALED",
  }),
  manualConfirmation: service({
    serviceId: "10000000-0000-4000-8000-000000000004",
    providerId: "synthetic-manual-confirm",
    name: "Synthetic Manual-confirmation Shelter",
  }),
  restrictedSpecialist: service({
    serviceId: "10000000-0000-4000-8000-000000000005",
    providerId: "synthetic-restricted",
    name: "Confidential Synthetic Specialist Service",
    disclosureLevel: "RESTRICTED",
    professionalReferralRequired: true,
  }),
} as const;

function destination(index: number) {
  return {
    addressText: `${index} Synthetic Lane, Exampletown`,
    latitude: 52 + index / 10000,
    longitude: -0.1 - index / 10000,
    arrivalInstructions: "Synthetic test destination only.",
  };
}

export function createSyntheticProviderProfiles(): readonly SyntheticProviderAdapter[] {
  const sourceUpdatedAt = SYNTHETIC_PROFILE_NOW.toISOString();

  return [
    new SyntheticProviderAdapter(
      syntheticProfileServices.liveApi.providerId,
      [{
        service: syntheticProfileServices.liveApi,
        availableUnits: 1,
        maximumUnits: 2,
        sourceUpdatedAt,
        ttlSeconds: 900,
        destination: destination(1),
      }],
      capabilities("LIVE_API", "SAFEBED_TRANSACTION", true, "SAFEBED_TRANSACTION"),
    ),
    new SyntheticProviderAdapter(
      syntheticProfileServices.readOnlyFeed.providerId,
      [{
        service: syntheticProfileServices.readOnlyFeed,
        availableUnits: 2,
        maximumUnits: 4,
        sourceUpdatedAt,
        ttlSeconds: 900,
        destination: destination(2),
      }],
      capabilities("READ_ONLY_FEED", "EXTERNAL_MANUAL", false, "EXTERNAL_MANUAL"),
    ),
    new SyntheticProviderAdapter(
      syntheticProfileServices.portal.providerId,
      [{
        service: syntheticProfileServices.portal,
        availableUnits: 3,
        maximumUnits: 5,
        sourceUpdatedAt,
        ttlSeconds: 900,
        destination: destination(3),
      }],
      capabilities("SAFEBED_PORTAL", "SAFEBED_PORTAL", true, "SAFEBED_PORTAL"),
    ),
    new SyntheticProviderAdapter(
      syntheticProfileServices.manualConfirmation.providerId,
      [{
        service: syntheticProfileServices.manualConfirmation,
        availableUnits: 1,
        maximumUnits: 2,
        sourceUpdatedAt,
        ttlSeconds: 900,
        manualConfirmationRequired: true,
        destination: destination(4),
      }],
      capabilities("MANUAL_CONFIRMATION", "EXTERNAL_MANUAL", false, "EXTERNAL_MANUAL"),
    ),
    new SyntheticProviderAdapter(
      syntheticProfileServices.restrictedSpecialist.providerId,
      [{
        service: syntheticProfileServices.restrictedSpecialist,
        availableUnits: 1,
        maximumUnits: 1,
        sourceUpdatedAt,
        ttlSeconds: 900,
        destination: destination(5),
      }],
      capabilities("RESTRICTED_SPECIALIST", "SAFEBED_TRANSACTION", true, "SAFEBED_TRANSACTION"),
    ),
  ];
}
