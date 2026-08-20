import assert from "node:assert/strict";
import test from "node:test";

import { createSyntheticProtectedReferralApi } from "../prototype/http/synthetic-protected-referral-api.mjs";
import {
  SYNTHETIC_PROFILE_NOW,
  syntheticProfileServices,
} from "../src/synthetic-fixtures.ts";

const activeMembership = (organisationId: string, overrides = {}) => ({
  organisationId,
  status: "ACTIVE",
  validFrom: "2026-01-01T00:00:00Z",
  validUntil: "2027-01-01T00:00:00Z",
  ...overrides,
});

const human = ({
  id,
  organisationId,
  capabilities = [],
  membership = {},
  verificationStatus = "VERIFIED",
}: {
  id: string;
  organisationId: string;
  capabilities?: string[];
  membership?: Record<string, unknown>;
  verificationStatus?: string;
}) => ({
  id,
  kind: "HUMAN",
  identityStatus: "ACTIVE",
  organisation: { id: organisationId, verificationStatus },
  membership: activeMembership(organisationId, membership),
  capabilities,
  entitlements: [],
  authentication: {},
});

const anonymous = Object.freeze({ id: "anon", kind: "ANONYMOUS" });
const supportA = human({
  id: "support-worker-a",
  organisationId: "support-a",
  capabilities: ["referral.create"],
});
const supportC = human({
  id: "support-worker-c",
  organisationId: "support-c",
  capabilities: ["referral.create"],
});
const suspendedSupportA = human({
  id: "suspended-support-a",
  organisationId: "support-a",
  capabilities: ["referral.create"],
  membership: { status: "SUSPENDED" },
});
const revokedOrganisationSupportA = human({
  id: "revoked-org-support-a",
  organisationId: "support-a",
  capabilities: ["referral.create"],
  verificationStatus: "REVOKED",
});

async function withProtectedApi(
  principal: unknown,
  callback: (input: { baseUrl: string; auditEvents: unknown[] }) => Promise<void>,
) {
  const auditEvents: unknown[] = [];
  const server = createSyntheticProtectedReferralApi({
    principal,
    now: SYNTHETIC_PROFILE_NOW,
    auditSink: async (event: unknown) => {
      auditEvents.push(event);
    },
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Protected synthetic server has no TCP address");

  try {
    await callback({ baseUrl: `http://127.0.0.1:${address.port}`, auditEvents });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

function referralBody(service: { providerId: string; serviceId: string }) {
  return JSON.stringify({ providerId: service.providerId, serviceId: service.serviceId });
}

async function postReferral(baseUrl: string, service = syntheticProfileServices.liveApi, init: RequestInit = {}) {
  return fetch(`${baseUrl}/v1/referrals`, {
    ...init,
    method: "POST",
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    body: init.body ?? referralBody(service),
  });
}

test("protected referral server refuses to exist without an injected audit sink", () => {
  assert.throws(
    () => createSyntheticProtectedReferralApi({ principal: supportA, now: SYNTHETIC_PROFILE_NOW }),
    /requires an injected audit sink/,
  );
});

test("permitted verified support worker can create provider-authoritative referral with minimal audit", async () => {
  await withProtectedApi(supportA, async ({ baseUrl, auditEvents }) => {
    const response = await postReferral(baseUrl);
    assert.equal(response.status, 201);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("access-control-allow-origin"), null);

    const referral = await response.json();
    assert.equal(referral.serviceId, syntheticProfileServices.liveApi.serviceId);
    assert.equal(referral.status, "SUBMITTED");
    assert.equal(referral.createdAt, SYNTHETIC_PROFILE_NOW.toISOString());
    assert.equal(referral.updatedAt, SYNTHETIC_PROFILE_NOW.toISOString());
    assert.equal(typeof referral.referralId, "string");
    assert.equal("destination" in referral, false);
    assert.equal("narrative" in referral, false);

    assert.equal(auditEvents.length, 1);
    const event = auditEvents[0] as Record<string, unknown>;
    assert.deepEqual(Object.keys(event).sort(), [
      "action",
      "at",
      "event",
      "organisationId",
      "policyReason",
      "principalId",
      "providerId",
      "referralId",
      "serviceId",
    ].sort());
    assert.equal(event.event, "REFERRAL_CREATED");
    assert.equal(event.principalId, "support-worker-a");
    assert.equal(event.organisationId, "support-a");
    assert.equal(event.policyReason, "referral_create_permitted");
  });
});

test("anonymous, suspended and revoked callers are denied before provider mutation", async () => {
  for (const principal of [anonymous, suspendedSupportA, revokedOrganisationSupportA]) {
    await withProtectedApi(principal, async ({ baseUrl, auditEvents }) => {
      const response = await postReferral(baseUrl);
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), {
        code: "FORBIDDEN",
        message: "This operation is not permitted.",
      });
      assert.deepEqual(auditEvents, []);
    });
  }
});

test("unpermitted referrer organisation is concealed rather than confirming provider policy", async () => {
  await withProtectedApi(supportC, async ({ baseUrl, auditEvents }) => {
    const response = await postReferral(baseUrl);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      code: "NOT_FOUND",
      message: "Resource not found or intentionally not disclosed.",
    });
    assert.deepEqual(auditEvents, []);
  });
});

test("forged privilege headers cannot elevate the server-injected anonymous principal", async () => {
  await withProtectedApi(anonymous, async ({ baseUrl, auditEvents }) => {
    const response = await postReferral(baseUrl, syntheticProfileServices.liveApi, {
      headers: {
        "x-safebed-role": "SPECIALIST_ADMIN",
        "x-safebed-organisation": "support-a",
        "x-safebed-capabilities": "referral.create",
      },
    });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).code, "FORBIDDEN");
    assert.deepEqual(auditEvents, []);
  });
});

test("request body cannot supply role, organisation or capabilities", async () => {
  await withProtectedApi(anonymous, async ({ baseUrl, auditEvents }) => {
    for (const forgedField of ["actorRole", "organisationId", "capabilities", "disclosureLevel"]) {
      const response = await fetch(`${baseUrl}/v1/referrals`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerId: syntheticProfileServices.liveApi.providerId,
          serviceId: syntheticProfileServices.liveApi.serviceId,
          [forgedField]: "forged",
        }),
      });
      assert.equal(response.status, 400, `${forgedField} must not be accepted`);
      assert.deepEqual(await response.json(), {
        code: "VALIDATION_FAILED",
        message: "Referral request must contain only providerId and serviceId.",
      });
    }
    assert.deepEqual(auditEvents, []);
  });
});

test("provider capability is evaluated after authorisation and read-only feed remains non-transactional", async () => {
  await withProtectedApi(supportA, async ({ baseUrl, auditEvents }) => {
    const response = await postReferral(baseUrl, syntheticProfileServices.readOnlyFeed);
    assert.equal(response.status, 409);
    assert.deepEqual(await response.json(), {
      code: "UNSUPPORTED_PROVIDER_CAPABILITY",
      message: "This provider does not support SafeBed referral transactions.",
    });
    assert.deepEqual(auditEvents, []);
  });
});

test("unknown provider/service and protected specialist policy do not leak through referral HTTP", async () => {
  await withProtectedApi(supportA, async ({ baseUrl, auditEvents }) => {
    const unknown = await fetch(`${baseUrl}/v1/referrals`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId: "unknown-provider", serviceId: "guessed-protected-service" }),
    });
    assert.equal(unknown.status, 404);
    const unknownBody = await unknown.json();
    assert.equal(JSON.stringify(unknownBody).includes("guessed-protected-service"), false);

    const specialist = await postReferral(baseUrl, syntheticProfileServices.restrictedSpecialist);
    assert.equal(specialist.status, 404);
    assert.deepEqual(await specialist.json(), {
      code: "NOT_FOUND",
      message: "Resource not found or intentionally not disclosed.",
    });
    assert.deepEqual(auditEvents, []);
  });
});

test("protected referral transport remains narrow: query params and other transaction routes are unexposed", async () => {
  await withProtectedApi(supportA, async ({ baseUrl }) => {
    const query = await fetch(`${baseUrl}/v1/referrals?role=admin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: referralBody(syntheticProfileServices.liveApi),
    });
    assert.equal(query.status, 400);

    for (const path of ["/v1/holds", "/v1/reservations", "/v1/placements/demo/arrival"]) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      assert.equal(response.status, 404);
      assert.equal(response.headers.get("allow"), null);
      assert.deepEqual(await response.json(), {
        code: "NOT_FOUND",
        message: "Resource not found or intentionally not disclosed.",
      });
    }
  });
});
