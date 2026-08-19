import test from "node:test";
import assert from "node:assert/strict";
import { SafeBedSandbox } from "../src/safebed.ts";
import {
  createSyntheticProviderProfiles,
  syntheticProfileServices,
  SYNTHETIC_PROFILE_NOW,
} from "../src/synthetic-fixtures.ts";
import { UnsupportedProviderCapabilityError } from "../src/synthetic-provider.ts";

const singleAdultNeed = {
  requiredFor: "2026-08-19",
  householdSize: 1,
  childCount: 0,
  wheelchairAccessRequired: false,
  assistanceAnimal: false,
  otherPets: false,
  professionalReferralAvailable: true,
} as const;

test("five materially different provider integration profiles are represented explicitly", async () => {
  const providers = createSyntheticProviderProfiles();
  const result = await new SafeBedSandbox(providers).search(singleAdultNeed, SYNTHETIC_PROFILE_NOW);

  assert.equal(result.matches.length, 5);
  const modes = new Set(result.matches.map((match) => match.providerCapabilities.integrationMode));
  assert.deepEqual(
    modes,
    new Set([
      "LIVE_API",
      "READ_ONLY_FEED",
      "SAFEBED_PORTAL",
      "MANUAL_CONFIRMATION",
      "RESTRICTED_SPECIALIST",
    ]),
  );
});

test("read-only feed can expose confirmed capacity without pretending SafeBed can refer, hold or reserve", async () => {
  const providers = createSyntheticProviderProfiles();
  const readOnly = providers.find((candidate) => candidate.providerId === "synthetic-read-only")!;
  const sandbox = new SafeBedSandbox([readOnly]);
  const result = await sandbox.search(singleAdultNeed, SYNTHETIC_PROFILE_NOW);
  const match = result.matches[0]!;

  assert.equal(result.outcome, "CANDIDATES_FOUND");
  assert.equal(match.availability.state, "AVAILABLE");
  assert.equal(match.providerCapabilities.referralMode, "EXTERNAL_MANUAL");
  assert.equal(match.providerCapabilities.holdSupported, false);
  assert.equal(match.providerCapabilities.reservationMode, "EXTERNAL_MANUAL");

  await assert.rejects(
    sandbox.submitAndAccept(
      readOnly.providerId,
      syntheticProfileServices.readOnlyFeed.serviceId,
      SYNTHETIC_PROFILE_NOW,
    ),
    UnsupportedProviderCapabilityError,
  );
});

test("portal-managed provider supports SafeBed transactions without claiming an external API", async () => {
  const providers = createSyntheticProviderProfiles();
  const portal = providers.find((candidate) => candidate.providerId === "synthetic-portal")!;
  const sandbox = new SafeBedSandbox([portal]);
  const result = await sandbox.search(singleAdultNeed, SYNTHETIC_PROFILE_NOW);
  const match = result.matches[0]!;

  assert.equal(match.providerCapabilities.integrationMode, "SAFEBED_PORTAL");
  assert.equal(match.providerCapabilities.referralMode, "SAFEBED_PORTAL");
  assert.equal(match.providerCapabilities.holdSupported, true);

  const referral = await sandbox.submitAndAccept(
    portal.providerId,
    syntheticProfileServices.portal.serviceId,
    SYNTHETIC_PROFILE_NOW,
  );
  const hold = await sandbox.requestHold({
    providerId: portal.providerId,
    referralId: referral.referralId,
    serviceId: syntheticProfileServices.portal.serviceId,
    expectedSourceRevision: match.availability.sourceRevision,
    idempotencyKey: "portal-hold",
    requestedSeconds: 600,
    now: SYNTHETIC_PROFILE_NOW,
  });

  assert.equal(hold.status, "ACTIVE");
});

test("manual-confirmation provider is never promoted to confirmed placement from a nominal count alone", async () => {
  const providers = createSyntheticProviderProfiles();
  const manual = providers.find((candidate) => candidate.providerId === "synthetic-manual-confirm")!;
  const result = await new SafeBedSandbox([manual]).search(singleAdultNeed, SYNTHETIC_PROFILE_NOW);

  assert.equal(result.outcome, "NO_CONFIRMED_PLACEMENT");
  assert.equal(result.matches[0]?.availability.state, "MANUAL_CONFIRMATION_REQUIRED");
  assert.ok(result.matches[0]?.reasons.some((reason) => reason.code === "CAPACITY_UNCONFIRMED"));
});

test("restricted specialist profile is discoverable without exposing its destination or weakening its workflow metadata", async () => {
  const providers = createSyntheticProviderProfiles();
  const restricted = providers.find((candidate) => candidate.providerId === "synthetic-restricted")!;
  const sandbox = new SafeBedSandbox([restricted]);
  const result = await sandbox.search(singleAdultNeed, SYNTHETIC_PROFILE_NOW);
  const match = result.matches[0]!;

  assert.equal(match.service.disclosureLevel, "RESTRICTED");
  assert.equal(match.providerCapabilities.integrationMode, "RESTRICTED_SPECIALIST");
  assert.equal("destination" in match.service, false);
  assert.equal(match.matchState, "SUITABLE");

  const referral = await sandbox.submitAndAccept(
    restricted.providerId,
    syntheticProfileServices.restrictedSpecialist.serviceId,
    SYNTHETIC_PROFILE_NOW,
  );
  const hold = await sandbox.requestHold({
    providerId: restricted.providerId,
    referralId: referral.referralId,
    serviceId: syntheticProfileServices.restrictedSpecialist.serviceId,
    expectedSourceRevision: match.availability.sourceRevision,
    idempotencyKey: "profile-restricted-hold",
    requestedSeconds: 600,
    now: SYNTHETIC_PROFILE_NOW,
  });
  const ordinary = await sandbox.reserve({
    providerId: restricted.providerId,
    serviceId: syntheticProfileServices.restrictedSpecialist.serviceId,
    referralId: referral.referralId,
    holdId: hold.holdId,
    idempotencyKey: "profile-restricted-reservation",
    actorRole: "VERIFIED_PROFESSIONAL",
    now: SYNTHETIC_PROFILE_NOW,
  });

  assert.equal(ordinary.destination, undefined);
});
