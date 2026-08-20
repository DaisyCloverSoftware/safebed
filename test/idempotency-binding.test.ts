import assert from "node:assert/strict";
import test from "node:test";

import {
  createSyntheticProviderProfiles,
  SYNTHETIC_PROFILE_NOW,
  syntheticProfileServices,
} from "../src/synthetic-fixtures.ts";
import {
  CapacityConflictError,
  IdempotencyConflictError,
} from "../src/synthetic-provider.ts";

function liveProvider() {
  const provider = createSyntheticProviderProfiles().find(
    (candidate) => candidate.providerId === syntheticProfileServices.liveApi.providerId,
  );
  if (!provider) throw new Error("Synthetic live provider missing");
  return provider;
}

async function acceptedReferral(provider = liveProvider(), now = SYNTHETIC_PROFILE_NOW) {
  const serviceId = syntheticProfileServices.liveApi.serviceId;
  const submitted = await provider.submitReferral(serviceId, now);
  const referral = await provider.acceptReferral(submitted.referralId, now);
  const capacity = await provider.getAvailability(serviceId, now);
  return { provider, serviceId, referral, capacity };
}

test("exact hold retry returns original hold and does not consume capacity twice", async () => {
  const { provider, serviceId, referral, capacity } = await acceptedReferral();

  const first = await provider.requestHold({
    referralId: referral.referralId,
    serviceId,
    expectedSourceRevision: capacity.sourceRevision,
    idempotencyKey: "hold-idempotency-001",
    requestedSeconds: 300,
    now: SYNTHETIC_PROFILE_NOW,
  });
  const afterFirst = await provider.getAvailability(serviceId, SYNTHETIC_PROFILE_NOW);
  assert.equal(afterFirst.availableUnits, 0);

  const retry = await provider.requestHold({
    referralId: referral.referralId,
    serviceId,
    // A real retry can carry the pre-mutation revision and a different timeout;
    // the idempotency binding takes precedence for the same operation identity.
    expectedSourceRevision: capacity.sourceRevision,
    idempotencyKey: "hold-idempotency-001",
    requestedSeconds: 900,
    now: new Date(SYNTHETIC_PROFILE_NOW.getTime() + 1_000),
  });
  const afterRetry = await provider.getAvailability(serviceId, SYNTHETIC_PROFILE_NOW);

  assert.equal(retry.holdId, first.holdId);
  assert.equal(retry.referralId, first.referralId);
  assert.equal(retry.serviceId, first.serviceId);
  assert.equal(afterRetry.availableUnits, 0);
});

test("hold idempotency key cannot be rebound to a different referral or service", async () => {
  const { provider, serviceId, referral, capacity } = await acceptedReferral();
  await provider.requestHold({
    referralId: referral.referralId,
    serviceId,
    expectedSourceRevision: capacity.sourceRevision,
    idempotencyKey: "hold-idempotency-rebind",
    requestedSeconds: 300,
    now: SYNTHETIC_PROFILE_NOW,
  });

  const submittedTwo = await provider.submitReferral(serviceId, SYNTHETIC_PROFILE_NOW);
  const referralTwo = await provider.acceptReferral(submittedTwo.referralId, SYNTHETIC_PROFILE_NOW);

  await assert.rejects(
    () => provider.requestHold({
      referralId: referralTwo.referralId,
      serviceId,
      expectedSourceRevision: "r2",
      idempotencyKey: "hold-idempotency-rebind",
      requestedSeconds: 300,
      now: SYNTHETIC_PROFILE_NOW,
    }),
    IdempotencyConflictError,
  );

  await assert.rejects(
    () => provider.requestHold({
      referralId: referral.referralId,
      serviceId: "different-synthetic-service",
      expectedSourceRevision: "r2",
      idempotencyKey: "hold-idempotency-rebind",
      requestedSeconds: 300,
      now: SYNTHETIC_PROFILE_NOW,
    }),
    IdempotencyConflictError,
  );
});

test("distinct hold key with stale revision remains a capacity conflict, not idempotency conflict", async () => {
  const { provider, serviceId, referral, capacity } = await acceptedReferral();
  await provider.requestHold({
    referralId: referral.referralId,
    serviceId,
    expectedSourceRevision: capacity.sourceRevision,
    idempotencyKey: "hold-race-first",
    requestedSeconds: 300,
    now: SYNTHETIC_PROFILE_NOW,
  });

  await assert.rejects(
    () => provider.requestHold({
      referralId: referral.referralId,
      serviceId,
      expectedSourceRevision: capacity.sourceRevision,
      idempotencyKey: "hold-race-second",
      requestedSeconds: 300,
      now: SYNTHETIC_PROFILE_NOW,
    }),
    CapacityConflictError,
  );
});

test("exact reservation retry returns the original reservation after the hold is consumed", async () => {
  const { provider, serviceId, referral, capacity } = await acceptedReferral();
  const hold = await provider.requestHold({
    referralId: referral.referralId,
    serviceId,
    expectedSourceRevision: capacity.sourceRevision,
    idempotencyKey: "reservation-seed-hold",
    requestedSeconds: 300,
    now: SYNTHETIC_PROFILE_NOW,
  });

  const first = await provider.reserve({
    referralId: referral.referralId,
    holdId: hold.holdId,
    idempotencyKey: "reservation-idempotency-001",
    now: SYNTHETIC_PROFILE_NOW,
    canDiscloseDestination: false,
  });

  const retry = await provider.reserve({
    referralId: referral.referralId,
    holdId: hold.holdId,
    idempotencyKey: "reservation-idempotency-001",
    now: new Date(SYNTHETIC_PROFILE_NOW.getTime() + 1_000),
    canDiscloseDestination: false,
  });

  assert.equal(retry.reservationId, first.reservationId);
  assert.equal(retry.status, "CONFIRMED");
  assert.equal(retry.destination, undefined);
});

test("reservation idempotency key cannot be rebound to another referral, hold or disclosure decision", async () => {
  const { provider, serviceId, referral, capacity } = await acceptedReferral();
  const hold = await provider.requestHold({
    referralId: referral.referralId,
    serviceId,
    expectedSourceRevision: capacity.sourceRevision,
    idempotencyKey: "reservation-binding-hold",
    requestedSeconds: 300,
    now: SYNTHETIC_PROFILE_NOW,
  });

  await provider.reserve({
    referralId: referral.referralId,
    holdId: hold.holdId,
    idempotencyKey: "reservation-idempotency-rebind",
    now: SYNTHETIC_PROFILE_NOW,
    canDiscloseDestination: false,
  });

  await assert.rejects(
    () => provider.reserve({
      referralId: "different-referral",
      holdId: hold.holdId,
      idempotencyKey: "reservation-idempotency-rebind",
      now: SYNTHETIC_PROFILE_NOW,
      canDiscloseDestination: false,
    }),
    IdempotencyConflictError,
  );

  await assert.rejects(
    () => provider.reserve({
      referralId: referral.referralId,
      holdId: "different-hold",
      idempotencyKey: "reservation-idempotency-rebind",
      now: SYNTHETIC_PROFILE_NOW,
      canDiscloseDestination: false,
    }),
    IdempotencyConflictError,
  );

  await assert.rejects(
    () => provider.reserve({
      referralId: referral.referralId,
      holdId: hold.holdId,
      idempotencyKey: "reservation-idempotency-rebind",
      now: SYNTHETIC_PROFILE_NOW,
      canDiscloseDestination: true,
    }),
    IdempotencyConflictError,
  );
});
