import test from "node:test";
import assert from "node:assert/strict";
import { SafeBedSandbox } from "../src/safebed.ts";
import {
  createSyntheticProviderProfiles,
  syntheticProfileServices,
  SYNTHETIC_PROFILE_NOW,
} from "../src/synthetic-fixtures.ts";

const singleAdultNeed = {
  requiredFor: "2026-08-19",
  householdSize: 1,
  childCount: 0,
  wheelchairAccessRequired: false,
  assistanceAnimal: false,
  otherPets: false,
  professionalReferralAvailable: true,
} as const;

test("live API profile completes SEARCH -> MATCH -> REFERRAL -> ACCEPT -> HOLD -> RESERVATION -> ARRIVAL", async () => {
  const providers = createSyntheticProviderProfiles();
  const liveApi = providers.find((candidate) => candidate.providerId === "synthetic-live-api")!;
  const sandbox = new SafeBedSandbox([liveApi]);
  const service = syntheticProfileServices.liveApi;

  const search = await sandbox.search(singleAdultNeed, SYNTHETIC_PROFILE_NOW);
  assert.equal(search.outcome, "CANDIDATES_FOUND");
  const match = search.matches[0]!;
  assert.equal(match.matchState, "SUITABLE");
  assert.equal(match.availability.state, "LIMITED");

  const referral = await sandbox.submitAndAccept(
    liveApi.providerId,
    service.serviceId,
    SYNTHETIC_PROFILE_NOW,
  );
  assert.equal(referral.status, "ACCEPTED");

  const hold = await sandbox.requestHold({
    providerId: liveApi.providerId,
    referralId: referral.referralId,
    serviceId: service.serviceId,
    expectedSourceRevision: match.availability.sourceRevision,
    idempotencyKey: "full-flow-hold",
    requestedSeconds: 600,
    now: SYNTHETIC_PROFILE_NOW,
  });
  assert.equal(hold.status, "ACTIVE");

  const reservation = await sandbox.reserve({
    providerId: liveApi.providerId,
    serviceId: service.serviceId,
    referralId: referral.referralId,
    holdId: hold.holdId,
    idempotencyKey: "full-flow-reservation",
    actorRole: "VERIFIED_PROFESSIONAL",
    now: SYNTHETIC_PROFILE_NOW,
  });
  assert.equal(reservation.status, "CONFIRMED");
  assert.equal(reservation.destination?.addressText, "1 Synthetic Lane, Exampletown");

  const arrivedAt = new Date(SYNTHETIC_PROFILE_NOW.getTime() + 20 * 60 * 1000);
  const arrived = await sandbox.confirmArrival(liveApi.providerId, reservation.reservationId, arrivedAt);
  assert.equal(arrived.status, "ARRIVED");
  assert.equal(arrived.arrivalConfirmedAt, arrivedAt.toISOString());
}
);
