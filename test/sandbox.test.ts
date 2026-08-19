import test from "node:test";
import assert from "node:assert/strict";
import { SafeBedSandbox } from "../src/safebed.ts";
import {
  CapacityConflictError,
  SyntheticProviderAdapter,
} from "../src/synthetic-provider.ts";
import type { PublicService } from "../src/model.ts";

const baseNow = new Date("2026-08-19T21:00:00.000Z");

function service(overrides: Partial<PublicService> = {}): PublicService {
  return {
    serviceId: "11111111-1111-4111-8111-111111111111",
    providerId: "provider-a",
    name: "Synthetic Night Shelter",
    publicAreaLabel: "Example district",
    disclosureLevel: "PUBLIC",
    rules: {
      maximumHouseholdSize: 1,
      childrenAllowed: false,
      wheelchairAccessible: true,
      assistanceAnimalsAllowed: true,
      petsAllowed: false,
      professionalReferralRequired: false,
    },
    ...overrides,
  };
}

function provider(options: {
  availableUnits?: number;
  sourceUpdatedAt?: string;
  ttlSeconds?: number;
  manualConfirmationRequired?: boolean;
  service?: PublicService;
} = {}): SyntheticProviderAdapter {
  const configuredService = options.service ?? service();
  return new SyntheticProviderAdapter(configuredService.providerId, [
    {
      service: configuredService,
      availableUnits: options.availableUnits ?? 1,
      maximumUnits: 2,
      sourceUpdatedAt: options.sourceUpdatedAt ?? baseNow.toISOString(),
      ttlSeconds: options.ttlSeconds ?? 900,
      manualConfirmationRequired: options.manualConfirmationRequired,
      destination: {
        addressText: "1 Synthetic Way, Exampletown",
        latitude: 52.0001,
        longitude: -0.1001,
        arrivalInstructions: "Synthetic test destination only.",
      },
    },
  ]);
}

const singleAdultNeed = {
  requiredFor: "2026-08-19",
  householdSize: 1,
  childCount: 0,
  wheelchairAccessRequired: false,
  assistanceAnimal: false,
  otherPets: false,
  professionalReferralAvailable: true,
} as const;

test("fresh provider capacity is surfaced with an explicit freshness state", async () => {
  const adapter = provider({ availableUnits: 2 });
  const result = await new SafeBedSandbox([adapter]).search(singleAdultNeed, baseNow);

  assert.equal(result.outcome, "CANDIDATES_FOUND");
  assert.equal(result.matches[0]?.availability.state, "AVAILABLE");
  assert.equal(result.matches[0]?.matchState, "SUITABLE");
});

test("stale capacity is never presented as confirmed availability", async () => {
  const adapter = provider({
    availableUnits: 2,
    sourceUpdatedAt: "2026-08-19T20:00:00.000Z",
    ttlSeconds: 300,
  });
  const result = await new SafeBedSandbox([adapter]).search(singleAdultNeed, baseNow);

  assert.equal(result.outcome, "NO_CONFIRMED_PLACEMENT");
  assert.equal(result.matches[0]?.availability.state, "STALE");
  assert.ok(result.matches[0]?.reasons.some((reason) => reason.code === "CAPACITY_UNCONFIRMED"));
});

test("provider outage degrades to UNKNOWN rather than reusing previous capacity", async () => {
  const adapter = provider({ availableUnits: 2 });
  adapter.setOnline(false);
  const result = await new SafeBedSandbox([adapter]).search(singleAdultNeed, baseNow);

  assert.equal(result.outcome, "NO_CONFIRMED_PLACEMENT");
  assert.equal(result.matches[0]?.availability.state, "UNKNOWN");
});

test("published suitability rules remain distinct from availability", async () => {
  const adapter = provider({ availableUnits: 2 });
  const result = await new SafeBedSandbox([adapter]).search(
    { ...singleAdultNeed, householdSize: 2 },
    baseNow,
  );

  assert.equal(result.matches[0]?.availability.state, "AVAILABLE");
  assert.equal(result.matches[0]?.matchState, "NOT_MATCHED");
  assert.ok(result.matches[0]?.reasons.some((reason) => reason.code === "HOUSEHOLD_SIZE_UNSUPPORTED"));
});

test("the final space can only be held once when two workers race on the same revision", async () => {
  const adapter = provider({ availableUnits: 1 });
  const sandbox = new SafeBedSandbox([adapter]);
  const search = await sandbox.search(singleAdultNeed, baseNow);
  const revision = search.matches[0]!.availability.sourceRevision;

  const referralA = await sandbox.submitAndAccept("provider-a", service().serviceId, baseNow);
  const referralB = await sandbox.submitAndAccept("provider-a", service().serviceId, baseNow);

  const holdA = await sandbox.requestHold({
    providerId: "provider-a",
    referralId: referralA.referralId,
    serviceId: service().serviceId,
    expectedSourceRevision: revision,
    idempotencyKey: "hold-worker-a",
    requestedSeconds: 600,
    now: baseNow,
  });
  assert.equal(holdA.status, "ACTIVE");

  await assert.rejects(
    sandbox.requestHold({
      providerId: "provider-a",
      referralId: referralB.referralId,
      serviceId: service().serviceId,
      expectedSourceRevision: revision,
      idempotencyKey: "hold-worker-b",
      requestedSeconds: 600,
      now: baseNow,
    }),
    CapacityConflictError,
  );
});

test("idempotent hold retry returns the same hold without consuming another unit", async () => {
  const adapter = provider({ availableUnits: 2 });
  const sandbox = new SafeBedSandbox([adapter]);
  const search = await sandbox.search(singleAdultNeed, baseNow);
  const referral = await sandbox.submitAndAccept("provider-a", service().serviceId, baseNow);

  const input = {
    providerId: "provider-a",
    referralId: referral.referralId,
    serviceId: service().serviceId,
    expectedSourceRevision: search.matches[0]!.availability.sourceRevision,
    idempotencyKey: "same-hold-request",
    requestedSeconds: 600,
    now: baseNow,
  } as const;

  const first = await sandbox.requestHold(input);
  const second = await sandbox.requestHold(input);
  assert.equal(first.holdId, second.holdId);

  const after = await adapter.getAvailability(service().serviceId, baseNow);
  assert.equal(after.availableUnits, 1);
});

test("expired holds restore provider-owned capacity", async () => {
  const adapter = provider({ availableUnits: 1 });
  const sandbox = new SafeBedSandbox([adapter]);
  const search = await sandbox.search(singleAdultNeed, baseNow);
  const referral = await sandbox.submitAndAccept("provider-a", service().serviceId, baseNow);

  await sandbox.requestHold({
    providerId: "provider-a",
    referralId: referral.referralId,
    serviceId: service().serviceId,
    expectedSourceRevision: search.matches[0]!.availability.sourceRevision,
    idempotencyKey: "expiring-hold",
    requestedSeconds: 60,
    now: baseNow,
  });

  const later = new Date(baseNow.getTime() + 61_000);
  const restored = await adapter.getAvailability(service().serviceId, later);
  assert.equal(restored.availableUnits, 1);
});

test("protected destination is not present in discovery and is disclosed only when authorised at reservation", async () => {
  const restricted = service({
    disclosureLevel: "RESTRICTED",
    name: "Confidential Synthetic Service",
    publicAreaLabel: "Example region",
  });
  const adapter = provider({ availableUnits: 1, service: restricted });
  const sandbox = new SafeBedSandbox([adapter]);
  const search = await sandbox.search(singleAdultNeed, baseNow);

  assert.equal("destination" in search.matches[0]!.service, false);
  const referral = await sandbox.submitAndAccept("provider-a", restricted.serviceId, baseNow);
  const hold = await sandbox.requestHold({
    providerId: "provider-a",
    referralId: referral.referralId,
    serviceId: restricted.serviceId,
    expectedSourceRevision: search.matches[0]!.availability.sourceRevision,
    idempotencyKey: "restricted-hold",
    requestedSeconds: 600,
    now: baseNow,
  });

  const hidden = await sandbox.reserve({
    providerId: "provider-a",
    serviceId: restricted.serviceId,
    referralId: referral.referralId,
    holdId: hold.holdId,
    idempotencyKey: "restricted-reservation-hidden",
    actorRole: "VERIFIED_PROFESSIONAL",
    now: baseNow,
  });
  assert.equal(hidden.destination, undefined);
});

test("accepted held placement can disclose destination only in authorised reservation response", async () => {
  const adapter = provider({ availableUnits: 1 });
  const sandbox = new SafeBedSandbox([adapter]);
  const search = await sandbox.search(singleAdultNeed, baseNow);
  const referral = await sandbox.submitAndAccept("provider-a", service().serviceId, baseNow);
  const hold = await sandbox.requestHold({
    providerId: "provider-a",
    referralId: referral.referralId,
    serviceId: service().serviceId,
    expectedSourceRevision: search.matches[0]!.availability.sourceRevision,
    idempotencyKey: "authorised-hold",
    requestedSeconds: 600,
    now: baseNow,
  });

  const reservation = await sandbox.reserve({
    providerId: "provider-a",
    serviceId: service().serviceId,
    referralId: referral.referralId,
    holdId: hold.holdId,
    idempotencyKey: "authorised-reservation",
    actorRole: "VERIFIED_PROFESSIONAL",
    now: baseNow,
  });

  assert.equal(reservation.status, "CONFIRMED");
  assert.equal(reservation.destination?.addressText, "1 Synthetic Way, Exampletown");
});

test("restricted destination is disclosed only to a specialist-authorised role after reservation", async () => {
  const restricted = service({
    disclosureLevel: "RESTRICTED",
    name: "Restricted Synthetic Service",
    publicAreaLabel: "Example region",
  });
  const adapter = provider({ availableUnits: 1, service: restricted });
  const sandbox = new SafeBedSandbox([adapter]);
  const search = await sandbox.search(singleAdultNeed, baseNow);
  const referral = await sandbox.submitAndAccept("provider-a", restricted.serviceId, baseNow);
  const hold = await sandbox.requestHold({
    providerId: "provider-a",
    referralId: referral.referralId,
    serviceId: restricted.serviceId,
    expectedSourceRevision: search.matches[0]!.availability.sourceRevision,
    idempotencyKey: "specialist-hold",
    requestedSeconds: 600,
    now: baseNow,
  });

  const reservation = await sandbox.reserve({
    providerId: "provider-a",
    serviceId: restricted.serviceId,
    referralId: referral.referralId,
    holdId: hold.holdId,
    idempotencyKey: "specialist-reservation",
    actorRole: "SPECIALIST_AUTHORISED",
    now: baseNow,
  });

  assert.equal(reservation.destination?.addressText, "1 Synthetic Way, Exampletown");
});
