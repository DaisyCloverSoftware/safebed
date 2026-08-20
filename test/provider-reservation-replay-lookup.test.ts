import assert from "node:assert/strict";
import test from "node:test";

import {
  createSyntheticProviderProfiles,
  SYNTHETIC_PROFILE_NOW,
  syntheticProfileServices,
} from "../src/synthetic-fixtures.ts";
import { IdempotencyConflictError } from "../src/synthetic-provider.ts";

test("provider replay lookup owns exact reservation identity and current state", async () => {
  const provider = createSyntheticProviderProfiles().find(
    (candidate) => candidate.providerId === syntheticProfileServices.liveApi.providerId,
  );
  assert.ok(provider);

  const serviceId = syntheticProfileServices.liveApi.serviceId;
  const referral = await provider.submitReferral(serviceId, SYNTHETIC_PROFILE_NOW);
  const accepted = await provider.acceptReferral(referral.referralId, SYNTHETIC_PROFILE_NOW);
  const availability = await provider.getAvailability(serviceId, SYNTHETIC_PROFILE_NOW);
  const hold = await provider.requestHold({
    referralId: accepted.referralId,
    serviceId,
    expectedSourceRevision: availability.sourceRevision,
    idempotencyKey: "provider-replay-hold-key",
    requestedSeconds: 300,
    now: SYNTHETIC_PROFILE_NOW,
  });

  assert.equal(provider.lookupReservationByIdempotency({
    referralId: accepted.referralId,
    holdId: hold.holdId,
    idempotencyKey: "provider-replay-reservation-key",
    canDiscloseDestination: false,
  }), undefined);

  const reservation = await provider.reserve({
    referralId: accepted.referralId,
    holdId: hold.holdId,
    idempotencyKey: "provider-replay-reservation-key",
    now: SYNTHETIC_PROFILE_NOW,
    canDiscloseDestination: false,
  });

  const confirmed = provider.lookupReservationByIdempotency({
    referralId: accepted.referralId,
    holdId: hold.holdId,
    idempotencyKey: "provider-replay-reservation-key",
    canDiscloseDestination: false,
  });
  assert.ok(confirmed);
  assert.equal(confirmed.reservationId, reservation.reservationId);
  assert.equal(confirmed.status, "CONFIRMED");
  assert.equal("destination" in confirmed, false);

  const arrived = await provider.confirmArrival(reservation.reservationId, SYNTHETIC_PROFILE_NOW);
  assert.equal(arrived.status, "ARRIVED");

  const replayAfterArrival = provider.lookupReservationByIdempotency({
    referralId: accepted.referralId,
    holdId: hold.holdId,
    idempotencyKey: "provider-replay-reservation-key",
    canDiscloseDestination: false,
  });
  assert.ok(replayAfterArrival);
  assert.equal(replayAfterArrival.reservationId, reservation.reservationId);
  assert.equal(replayAfterArrival.status, "ARRIVED");

  assert.throws(
    () => provider.lookupReservationByIdempotency({
      referralId: accepted.referralId,
      holdId: "different-hold",
      idempotencyKey: "provider-replay-reservation-key",
      canDiscloseDestination: false,
    }),
    IdempotencyConflictError,
  );
  assert.throws(
    () => provider.lookupReservationByIdempotency({
      referralId: accepted.referralId,
      holdId: hold.holdId,
      idempotencyKey: "provider-replay-reservation-key",
      canDiscloseDestination: true,
    }),
    IdempotencyConflictError,
  );
});
