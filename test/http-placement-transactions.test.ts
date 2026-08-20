import assert from "node:assert/strict";
import test from "node:test";

import { createSyntheticPlacementTransactionApi } from "../prototype/http/synthetic-placement-transaction-api.mjs";
import { SYNTHETIC_PROFILE_NOW } from "../src/synthetic-fixtures.ts";

function human({
  id,
  organisationId,
  capabilities = [],
  membershipStatus = "ACTIVE",
  verificationStatus = "VERIFIED",
}: {
  id: string;
  organisationId: string;
  capabilities?: string[];
  membershipStatus?: string;
  verificationStatus?: string;
}) {
  return Object.freeze({
    id,
    kind: "HUMAN",
    identityStatus: "ACTIVE",
    organisation: { id: organisationId, verificationStatus },
    membership: {
      organisationId,
      status: membershipStatus,
      validFrom: "2026-01-01T00:00:00Z",
      validUntil: "2027-01-01T00:00:00Z",
    },
    capabilities,
    entitlements: [],
    authentication: {},
  });
}

function machine({ id, organisationId, scopes = [] }: {
  id: string;
  organisationId: string;
  scopes?: string[];
}) {
  return Object.freeze({
    id,
    kind: "MACHINE",
    status: "ACTIVE",
    organisation: { id: organisationId, verificationStatus: "VERIFIED" },
    scopes,
  });
}

const supportAll = human({
  id: "support-placement-a",
  organisationId: "support-a",
  capabilities: ["hold.request", "reservation.create", "placement.arrival.write"],
});
const referralOnly = human({
  id: "referral-only-a",
  organisationId: "support-a",
  capabilities: ["referral.create"],
});
const holdOnly = human({
  id: "hold-only-a",
  organisationId: "support-a",
  capabilities: ["hold.request"],
});
const holdAndReservation = human({
  id: "hold-reservation-a",
  organisationId: "support-a",
  capabilities: ["hold.request", "reservation.create"],
});
const supportB = human({
  id: "support-placement-b",
  organisationId: "support-b",
  capabilities: ["hold.request", "reservation.create", "placement.arrival.write"],
});
const suspendedSupport = human({
  id: "support-placement-suspended",
  organisationId: "support-a",
  capabilities: ["hold.request", "reservation.create", "placement.arrival.write"],
  membershipStatus: "SUSPENDED",
});
const anonymous = Object.freeze({ id: "anon", kind: "ANONYMOUS" });

interface HarnessOptions {
  principal?: unknown;
  profile?: string;
  authorisedOrganisationIds?: string[];
  referralStatus?: "ACCEPTED" | "SUBMITTED";
  clock?: () => Date;
}

async function withApi(
  options: HarnessOptions,
  callback: (input: { baseUrl: string; fixture: any; auditEvents: any[] }) => Promise<void>,
) {
  const auditEvents: any[] = [];
  const { server, fixture } = await createSyntheticPlacementTransactionApi({
    principal: options.principal ?? supportAll,
    profile: options.profile ?? "liveApi",
    authorisedOrganisationIds: options.authorisedOrganisationIds ?? ["support-a"],
    referralStatus: options.referralStatus ?? "ACCEPTED",
    clock: options.clock ?? (() => SYNTHETIC_PROFILE_NOW),
    auditSink: async (event: unknown) => auditEvents.push(event),
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Placement HTTP server has no TCP address");

  try {
    await callback({
      baseUrl: `http://127.0.0.1:${address.port}`,
      fixture,
      auditEvents,
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

function holdBody(fixture: any, overrides: Record<string, unknown> = {}) {
  return {
    providerId: fixture.providerId,
    referralId: fixture.referralId,
    serviceId: fixture.serviceId,
    expectedSourceRevision: fixture.sourceRevision,
    idempotencyKey: "hold-key-0001",
    requestedSeconds: 300,
    ...overrides,
  };
}

async function postJson(baseUrl: string, path: string, body: unknown, headers: Record<string, string> = {}) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function createHold(baseUrl: string, fixture: any, overrides: Record<string, unknown> = {}) {
  return postJson(baseUrl, "/v1/holds", holdBody(fixture, overrides));
}

function reservationBody(fixture: any, hold: any, overrides: Record<string, unknown> = {}) {
  return {
    providerId: fixture.providerId,
    serviceId: fixture.serviceId,
    referralId: fixture.referralId,
    holdId: hold.holdId,
    idempotencyKey: "reservation-key-0001",
    ...overrides,
  };
}

test("authorised HTTP flow reaches ARRIVED and exact reservation replay remains destination-free", async () => {
  await withApi({}, async ({ baseUrl, fixture, auditEvents }) => {
    const holdResponse = await createHold(baseUrl, fixture);
    assert.equal(holdResponse.status, 201);
    const hold = await holdResponse.json();
    assert.equal(hold.status, "ACTIVE");

    const reservationResponse = await postJson(baseUrl, "/v1/reservations", reservationBody(fixture, hold));
    assert.equal(reservationResponse.status, 201);
    const reservation = await reservationResponse.json();
    assert.equal(reservation.status, "CONFIRMED");
    assert.equal("destination" in reservation, false);
    const reservationSerialized = JSON.stringify(reservation);
    for (const forbidden of ["Synthetic Lane", "addressText", "latitude", "longitude", "arrivalInstructions"]) {
      assert.equal(reservationSerialized.includes(forbidden), false, `Reservation leaked ${forbidden}`);
    }

    const arrivalResponse = await fetch(`${baseUrl}/v1/placements/${encodeURIComponent(reservation.reservationId)}/arrival`, {
      method: "POST",
    });
    assert.equal(arrivalResponse.status, 200);
    const arrived = await arrivalResponse.json();
    assert.equal(arrived.status, "ARRIVED");
    assert.equal("destination" in arrived, false);

    // Same create operation may be replayed after ARRIVED because replay identity
    // comes from the trusted transaction ledger and provider idempotency binding.
    const replayResponse = await postJson(baseUrl, "/v1/reservations", reservationBody(fixture, hold));
    assert.equal(replayResponse.status, 201);
    const replay = await replayResponse.json();
    assert.equal(replay.reservationId, reservation.reservationId);
    assert.equal(replay.status, "ARRIVED");
    assert.equal("destination" in replay, false);

    assert.deepEqual(auditEvents.map((event) => event.event), [
      "HOLD_GRANTED",
      "RESERVATION_CONFIRMED",
      "ARRIVAL_CONFIRMED",
      "RESERVATION_REPLAYED",
    ]);
    const auditSerialized = JSON.stringify(auditEvents);
    for (const forbidden of ["Synthetic Lane", "addressText", "latitude", "longitude", "arrivalInstructions", "narrative"]) {
      assert.equal(auditSerialized.includes(forbidden), false, `Audit leaked ${forbidden}`);
    }
  });
});

test("placement capabilities remain separate at the HTTP boundary", async () => {
  await withApi({ principal: referralOnly }, async ({ baseUrl, fixture, auditEvents }) => {
    const response = await createHold(baseUrl, fixture);
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, "FORBIDDEN");
    assert.deepEqual(auditEvents, []);
  });

  await withApi({ principal: holdOnly }, async ({ baseUrl, fixture, auditEvents }) => {
    const holdResponse = await createHold(baseUrl, fixture);
    assert.equal(holdResponse.status, 201);
    const hold = await holdResponse.json();

    const reservationResponse = await postJson(baseUrl, "/v1/reservations", reservationBody(fixture, hold));
    assert.equal(reservationResponse.status, 403);
    assert.equal((await reservationResponse.json()).code, "FORBIDDEN");
    assert.equal(auditEvents.length, 1);
  });

  await withApi({ principal: holdAndReservation }, async ({ baseUrl, fixture, auditEvents }) => {
    const holdResponse = await createHold(baseUrl, fixture);
    const hold = await holdResponse.json();
    const reservationResponse = await postJson(baseUrl, "/v1/reservations", reservationBody(fixture, hold));
    const reservation = await reservationResponse.json();

    const arrival = await fetch(`${baseUrl}/v1/placements/${reservation.reservationId}/arrival`, { method: "POST" });
    assert.equal(arrival.status, 403);
    assert.equal((await arrival.json()).code, "FORBIDDEN");
    assert.equal(auditEvents.length, 2);
  });
});

test("pending referral and expired hold fail before provider placement mutation", async () => {
  await withApi({ referralStatus: "SUBMITTED" }, async ({ baseUrl, fixture, auditEvents }) => {
    const response = await createHold(baseUrl, fixture);
    assert.equal(response.status, 403);
    assert.deepEqual(auditEvents, []);
  });

  let now = new Date(SYNTHETIC_PROFILE_NOW);
  await withApi({ clock: () => now }, async ({ baseUrl, fixture, auditEvents }) => {
    const holdResponse = await createHold(baseUrl, fixture, { requestedSeconds: 60 });
    assert.equal(holdResponse.status, 201);
    const hold = await holdResponse.json();

    now = new Date(SYNTHETIC_PROFILE_NOW.getTime() + 61_000);
    const reservation = await postJson(baseUrl, "/v1/reservations", reservationBody(fixture, hold));
    assert.equal(reservation.status, 403);
    assert.equal((await reservation.json()).code, "FORBIDDEN");
    assert.equal(auditEvents.length, 1);
  });
});

test("cross-organisation, suspended and anonymous callers cannot forge placement authority", async () => {
  for (const principal of [supportB, suspendedSupport, anonymous]) {
    await withApi({ principal }, async ({ baseUrl, fixture, auditEvents }) => {
      const response = await createHold(baseUrl, fixture, {}, {
        // @ts-expect-error helper call is intentionally overwritten below in forged-header test
      } as any);
      assert.ok([403, 404].includes(response.status));
      assert.deepEqual(auditEvents, []);
    });
  }

  await withApi({ principal: anonymous }, async ({ baseUrl, fixture, auditEvents }) => {
    const response = await postJson(baseUrl, "/v1/holds", holdBody(fixture), {
      "x-safebed-role": "TRANSACTION_ADMIN",
      "x-safebed-organisation": "support-a",
      "x-safebed-capabilities": "hold.request,reservation.create,placement.arrival.write",
    });
    assert.equal(response.status, 403);
    assert.deepEqual(auditEvents, []);
  });

  await withApi({}, async ({ baseUrl, fixture, auditEvents }) => {
    for (const forgedField of ["actorRole", "organisationId", "capabilities", "holdState", "idempotentReplay"]) {
      const response = await postJson(baseUrl, "/v1/holds", {
        ...holdBody(fixture),
        [forgedField]: "forged",
      });
      assert.equal(response.status, 400, `${forgedField} must be rejected`);
    }
    assert.deepEqual(auditEvents, []);
  });
});

test("final-space races stay capacity conflicts and exact hold retry does not consume twice", async () => {
  await withApi({}, async ({ baseUrl, fixture, auditEvents }) => {
    const firstResponse = await createHold(baseUrl, fixture);
    assert.equal(firstResponse.status, 201);
    const first = await firstResponse.json();

    const retryResponse = await createHold(baseUrl, fixture);
    assert.equal(retryResponse.status, 201);
    const retry = await retryResponse.json();
    assert.equal(retry.holdId, first.holdId);

    const secondKey = await createHold(baseUrl, fixture, {
      expectedSourceRevision: first.sourceRevision,
      idempotencyKey: "hold-key-0002",
    });
    assert.equal(secondKey.status, 409);
    assert.equal((await secondKey.json()).code, "CAPACITY_CONFLICT");
    assert.equal(auditEvents.length, 2, "initial hold and exact replay are each audited");
  });
});

test("reservation idempotency conflict is explicit and does not return the unrelated reservation", async () => {
  await withApi({ profile: "portal" }, async ({ baseUrl, fixture }) => {
    const holdOneResponse = await createHold(baseUrl, fixture, { idempotencyKey: "hold-key-portal-1" });
    const holdOne = await holdOneResponse.json();
    const holdTwoResponse = await createHold(baseUrl, fixture, {
      expectedSourceRevision: holdOne.sourceRevision,
      idempotencyKey: "hold-key-portal-2",
    });
    const holdTwo = await holdTwoResponse.json();
    assert.equal(holdTwoResponse.status, 201);

    const firstReservationResponse = await postJson(baseUrl, "/v1/reservations", reservationBody(fixture, holdOne, {
      idempotencyKey: "reservation-shared-key",
    }));
    assert.equal(firstReservationResponse.status, 201);
    const firstReservation = await firstReservationResponse.json();

    const conflict = await postJson(baseUrl, "/v1/reservations", reservationBody(fixture, holdTwo, {
      idempotencyKey: "reservation-shared-key",
    }));
    assert.equal(conflict.status, 409);
    const body = await conflict.json();
    assert.deepEqual(body, {
      code: "IDEMPOTENCY_CONFLICT",
      message: "The idempotency key is already bound to a different transaction.",
    });
    assert.equal(JSON.stringify(body).includes(firstReservation.reservationId), false);
  });
});

test("provider capability is still authoritative after authorisation", async () => {
  await withApi({ profile: "readOnlyFeed" }, async ({ baseUrl, fixture, auditEvents }) => {
    const response = await createHold(baseUrl, fixture);
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {
      code: "UNSUPPORTED_PROVIDER_CAPABILITY",
      message: "This provider does not support the requested SafeBed transaction.",
    });
    assert.deepEqual(auditEvents, []);
  });
});

test("provider-owned machine scopes can complete placement but cannot cross provider ownership", async () => {
  const providerMachine = machine({
    id: "synthetic-live-placement-machine",
    organisationId: "synthetic-live-api",
    scopes: ["hold.manage", "reservation.manage", "placement.arrival.write"],
  });
  await withApi({ principal: providerMachine, authorisedOrganisationIds: [] }, async ({ baseUrl, fixture, auditEvents }) => {
    const holdResponse = await createHold(baseUrl, fixture);
    assert.equal(holdResponse.status, 201);
    const hold = await holdResponse.json();
    const reservationResponse = await postJson(baseUrl, "/v1/reservations", reservationBody(fixture, hold));
    assert.equal(reservationResponse.status, 201);
    const reservation = await reservationResponse.json();
    const arrival = await fetch(`${baseUrl}/v1/placements/${reservation.reservationId}/arrival`, { method: "POST" });
    assert.equal(arrival.status, 200);
    assert.equal(auditEvents.length, 3);
  });

  const wrongProviderMachine = machine({
    id: "synthetic-other-placement-machine",
    organisationId: "synthetic-other-provider",
    scopes: ["hold.manage", "reservation.manage", "placement.arrival.write"],
  });
  await withApi({ principal: wrongProviderMachine, authorisedOrganisationIds: [] }, async ({ baseUrl, fixture }) => {
    const response = await createHold(baseUrl, fixture);
    assert.equal(response.status, 404);
  });
});

test("unknown transaction identifiers and request-body privilege fields do not disclose protected state", async () => {
  await withApi({}, async ({ baseUrl, fixture, auditEvents }) => {
    const unknownHold = await postJson(baseUrl, "/v1/reservations", {
      providerId: fixture.providerId,
      serviceId: fixture.serviceId,
      referralId: fixture.referralId,
      holdId: "guessed-protected-hold",
      idempotencyKey: "reservation-unknown-key",
    });
    assert.equal(unknownHold.status, 404);
    const unknownBody = await unknownHold.json();
    assert.equal(JSON.stringify(unknownBody).includes("guessed-protected-hold"), false);

    const unknownArrival = await fetch(`${baseUrl}/v1/placements/guessed-protected-reservation/arrival`, { method: "POST" });
    assert.equal(unknownArrival.status, 404);
    assert.equal(JSON.stringify(await unknownArrival.json()).includes("guessed-protected-reservation"), false);

    const forgedReservation = await postJson(baseUrl, "/v1/reservations", {
      providerId: fixture.providerId,
      serviceId: fixture.serviceId,
      referralId: fixture.referralId,
      holdId: "anything",
      idempotencyKey: "reservation-forged-key",
      canDiscloseDestination: true,
    });
    assert.equal(forgedReservation.status, 400);
    assert.deepEqual(auditEvents, []);
  });
});

test("placement transaction server cannot be constructed without an audit sink", async () => {
  await assert.rejects(
    () => createSyntheticPlacementTransactionApi({ principal: supportAll }),
    /requires an injected audit sink/,
  );
});
