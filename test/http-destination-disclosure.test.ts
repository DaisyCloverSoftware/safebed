import assert from "node:assert/strict";
import test from "node:test";

import {
  createSyntheticDestinationApi,
  SYNTHETIC_DESTINATION_SPECIALIST_PROGRAMME_ID,
} from "../prototype/http/synthetic-destination-api.mjs";
import { SYNTHETIC_PROFILE_NOW } from "../src/synthetic-fixtures.ts";

function human({
  id,
  organisationId = "support-a",
  capabilities = ["destination.read"],
  membershipStatus = "ACTIVE",
  verificationStatus = "VERIFIED",
  entitlements = [],
  phishingResistantAt,
}: {
  id: string;
  organisationId?: string;
  capabilities?: string[];
  membershipStatus?: string;
  verificationStatus?: string;
  entitlements?: Array<Record<string, unknown>>;
  phishingResistantAt?: string;
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
    entitlements,
    authentication: phishingResistantAt ? { phishingResistantAt } : {},
  });
}

function specialist({
  id = "specialist-a",
  entitlementStatus = "ACTIVE",
  entitlementValidUntil = "2027-01-01T00:00:00Z",
  phishingResistantAt = "2026-08-19T20:55:00.000Z",
}: {
  id?: string;
  entitlementStatus?: string;
  entitlementValidUntil?: string;
  phishingResistantAt?: string;
} = {}) {
  return human({
    id,
    capabilities: ["destination.read"],
    entitlements: [{
      programmeId: SYNTHETIC_DESTINATION_SPECIALIST_PROGRAMME_ID,
      status: entitlementStatus,
      validFrom: "2026-01-01T00:00:00Z",
      validUntil: entitlementValidUntil,
    }],
    phishingResistantAt,
  });
}

const destinationReader = human({ id: "destination-reader-a" });
const placementOnly = human({
  id: "placement-worker-a",
  capabilities: ["hold.request", "reservation.create", "placement.arrival.write"],
});
const anonymous = Object.freeze({ id: "anonymous", kind: "ANONYMOUS" });
const providerMachine = Object.freeze({
  id: "provider-machine-a",
  kind: "MACHINE",
  status: "ACTIVE",
  organisation: { id: "synthetic-live-api", verificationStatus: "VERIFIED" },
  scopes: ["reservation.manage", "placement.arrival.write"],
});

interface MutableTrustedState {
  authorisedOrganisationIds?: string[];
  placementState?: string;
  providerDecision?: string;
  programmeId?: string;
}

async function withDestinationApi(
  options: {
    profile?: string;
    principal?: unknown;
    principalSource?: () => unknown;
    state?: MutableTrustedState;
    stateSource?: () => MutableTrustedState;
    clock?: () => Date;
  },
  callback: (input: {
    baseUrl: string;
    fixture: any;
    auditEvents: any[];
  }) => Promise<void>,
) {
  const auditEvents: any[] = [];
  const principalSource = options.principalSource ?? (() => options.principal ?? destinationReader);
  const stateSource = options.stateSource ?? (options.state ? () => options.state! : undefined);

  const { server, fixture } = await createSyntheticDestinationApi({
    principalSource,
    stateSource,
    auditSink: async (event: unknown) => auditEvents.push(event),
    profile: options.profile ?? "liveApi",
    clock: options.clock ?? (() => SYNTHETIC_PROFILE_NOW),
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Destination HTTP server has no TCP address");

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

function destinationUrl(baseUrl: string, reservationId: string) {
  return `${baseUrl}/v1/placements/${encodeURIComponent(reservationId)}/destination`;
}

function assertNoDestinationLeak(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const forbidden of ["Synthetic Lane", "addressText", "latitude", "longitude", "arrivalInstructions"]) {
    assert.equal(serialized.includes(forbidden), false, `Protected denial/audit leaked ${forbidden}`);
  }
}

test("placement-authorised destination is disclosed only by the separate read endpoint and is audited minimally", async () => {
  await withDestinationApi({}, async ({ baseUrl, fixture, auditEvents }) => {
    assert.equal(fixture.disclosureLevel, "PLACEMENT_AUTHORISED");

    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");

    const body = await response.json();
    assert.equal(body.reservationId, fixture.reservationId);
    assert.equal(typeof body.destination.addressText, "string");
    assert.equal(typeof body.destination.latitude, "number");
    assert.equal(typeof body.destination.longitude, "number");

    assert.equal(auditEvents.length, 1);
    const event = auditEvents[0];
    assert.equal(event.event, "DESTINATION_READ");
    assert.equal(event.action, "READ_DESTINATION");
    assert.equal(event.reservationId, fixture.reservationId);
    assert.equal(event.policyReason, "placement_authorised_destination");
    assertNoDestinationLeak(event);
  });
});

test("placement mutation capability alone is not destination authority", async () => {
  await withDestinationApi({ principal: placementOnly }, async ({ baseUrl, fixture, auditEvents }) => {
    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(body.code, "NOT_FOUND");
    assertNoDestinationLeak(body);
    assert.deepEqual(auditEvents, []);
  });
});

test("wrong placement relationship is concealed", async () => {
  await withDestinationApi({
    principal: human({ id: "destination-reader-b", organisationId: "support-b" }),
  }, async ({ baseUrl, fixture, auditEvents }) => {
    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(response.status, 404);
    assertNoDestinationLeak(await response.json());
    assert.deepEqual(auditEvents, []);
  });
});

test("trusted placement state is re-read on every request and revokes a previously successful destination read", async () => {
  const state: MutableTrustedState = {
    authorisedOrganisationIds: ["support-a"],
    placementState: "CONFIRMED",
    providerDecision: "ACCEPTED",
  };

  await withDestinationApi({ state }, async ({ baseUrl, fixture, auditEvents }) => {
    const first = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(first.status, 200);

    state.placementState = "CANCELLED";
    const revoked = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(revoked.status, 404);
    assertNoDestinationLeak(await revoked.json());

    state.placementState = "CONFIRMED";
    state.authorisedOrganisationIds = [];
    const relationshipRemoved = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(relationshipRemoved.status, 404);
    assertNoDestinationLeak(await relationshipRemoved.json());

    assert.equal(auditEvents.length, 1, "Only the successful destination read should be audited in this synthetic tranche");
  });
});

test("trusted principal state is re-read on every request and membership/org revocation takes effect immediately", async () => {
  let currentPrincipal: unknown = destinationReader;
  await withDestinationApi({ principalSource: () => currentPrincipal }, async ({ baseUrl, fixture, auditEvents }) => {
    const first = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(first.status, 200);

    currentPrincipal = human({
      id: "destination-reader-a",
      membershipStatus: "SUSPENDED",
    });
    const suspended = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(suspended.status, 403);
    assertNoDestinationLeak(await suspended.json());

    currentPrincipal = human({
      id: "destination-reader-a",
      verificationStatus: "REVOKED",
    });
    const revokedOrg = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(revokedOrg.status, 403);
    assertNoDestinationLeak(await revokedOrg.json());

    assert.equal(auditEvents.length, 1);
  });
});

test("restricted specialist destination requires entitlement, relationship, accepted state and recent strong authentication", async () => {
  await withDestinationApi({
    profile: "restrictedSpecialist",
    principal: specialist(),
  }, async ({ baseUrl, fixture, auditEvents }) => {
    assert.equal(fixture.disclosureLevel, "RESTRICTED");
    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.match(body.destination.addressText, /Synthetic Lane/);
    assert.equal(auditEvents.length, 1);
    assert.equal(auditEvents[0].policyReason, "restricted_destination_entitlement_state_and_step_up");
    assertNoDestinationLeak(auditEvents[0]);
  });
});

test("restricted specialist with stale step-up gets explicit reauthentication requirement without destination data", async () => {
  await withDestinationApi({
    profile: "restrictedSpecialist",
    principal: specialist({ phishingResistantAt: "2026-08-19T20:30:00.000Z" }),
  }, async ({ baseUrl, fixture, auditEvents }) => {
    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.deepEqual(body, {
      code: "REAUTHENTICATION_REQUIRED",
      message: "Recent strong authentication is required before this destination can be disclosed.",
    });
    assertNoDestinationLeak(body);
    assert.deepEqual(auditEvents, []);
  });
});

test("restricted entitlement revocation/expiry takes effect on the next read", async () => {
  let currentPrincipal: unknown = specialist();
  await withDestinationApi({
    profile: "restrictedSpecialist",
    principalSource: () => currentPrincipal,
  }, async ({ baseUrl, fixture, auditEvents }) => {
    const first = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(first.status, 200);

    currentPrincipal = specialist({ entitlementStatus: "REVOKED" });
    const revoked = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(revoked.status, 404);
    assertNoDestinationLeak(await revoked.json());

    currentPrincipal = specialist({ entitlementValidUntil: "2026-08-19T20:59:59.000Z" });
    const expired = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(expired.status, 404);
    assertNoDestinationLeak(await expired.json());

    assert.equal(auditEvents.length, 1);
  });
});

test("recent step-up without specialist entitlement is concealed", async () => {
  await withDestinationApi({
    profile: "restrictedSpecialist",
    principal: human({
      id: "recent-no-entitlement",
      capabilities: ["destination.read"],
      phishingResistantAt: "2026-08-19T20:55:00.000Z",
    }),
  }, async ({ baseUrl, fixture, auditEvents }) => {
    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(response.status, 404);
    assertNoDestinationLeak(await response.json());
    assert.deepEqual(auditEvents, []);
  });
});

test("sealed destination is never returned by the ordinary destination endpoint", async () => {
  await withDestinationApi({
    profile: "portal",
    principal: specialist(),
  }, async ({ baseUrl, fixture, auditEvents }) => {
    assert.equal(fixture.disclosureLevel, "SEALED");
    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(response.status, 404);
    assertNoDestinationLeak(await response.json());
    assert.deepEqual(auditEvents, []);
  });
});

test("anonymous and provider-machine callers cannot use the ordinary human destination-disclosure path", async () => {
  await withDestinationApi({ principal: anonymous }, async ({ baseUrl, fixture }) => {
    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(response.status, 403);
    assertNoDestinationLeak(await response.json());
  });

  await withDestinationApi({ principal: providerMachine }, async ({ baseUrl, fixture }) => {
    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId));
    assert.equal(response.status, 404);
    assertNoDestinationLeak(await response.json());
  });
});

test("forged headers and query parameters cannot create destination authority", async () => {
  await withDestinationApi({ principal: placementOnly }, async ({ baseUrl, fixture, auditEvents }) => {
    const forgedHeaders = await fetch(destinationUrl(baseUrl, fixture.reservationId), {
      headers: {
        "x-safebed-role": "SPECIALIST_ADMIN",
        "x-safebed-organisation": "support-a",
        "x-safebed-capabilities": "destination.read",
        "x-safebed-entitlement": SYNTHETIC_DESTINATION_SPECIALIST_PROGRAMME_ID,
      },
    });
    assert.equal(forgedHeaders.status, 404);
    assertNoDestinationLeak(await forgedHeaders.json());

    const query = await fetch(`${destinationUrl(baseUrl, fixture.reservationId)}?role=admin&includeAddress=true`);
    assert.equal(query.status, 400);
    assertNoDestinationLeak(await query.json());
    assert.deepEqual(auditEvents, []);
  });
});

test("guessed reservation IDs do not reveal existence or destination data", async () => {
  await withDestinationApi({}, async ({ baseUrl, auditEvents }) => {
    const guessed = "guessed-protected-reservation";
    const response = await fetch(destinationUrl(baseUrl, guessed));
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.equal(JSON.stringify(body).includes(guessed), false);
    assertNoDestinationLeak(body);
    assert.deepEqual(auditEvents, []);
  });
});

test("destination endpoint rejects wrong methods and has no permissive CORS", async () => {
  await withDestinationApi({}, async ({ baseUrl, fixture }) => {
    const response = await fetch(destinationUrl(baseUrl, fixture.reservationId), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET");
    assert.equal(response.headers.get("access-control-allow-origin"), null);
    assertNoDestinationLeak(await response.json());
  });
});

test("destination server requires dynamic trusted principal and audit sources", async () => {
  await assert.rejects(
    () => createSyntheticDestinationApi({ auditSink: async () => {} }),
    /principalSource/,
  );
  await assert.rejects(
    () => createSyntheticDestinationApi({ principalSource: () => destinationReader }),
    /audit sink/,
  );
});
