import assert from "node:assert/strict";
import test from "node:test";

import { createSyntheticDiscoveryApi } from "../prototype/http/synthetic-discovery-api.mjs";
import {
  SYNTHETIC_PROFILE_NOW,
  syntheticProfileServices,
} from "../src/synthetic-fixtures.ts";

async function withApi(callback: (baseUrl: string) => Promise<void>) {
  const server = createSyntheticDiscoveryApi({ now: SYNTHETIC_PROFILE_NOW });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Synthetic HTTP server has no TCP address");

  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
}

function assertSafeHeaders(response: Response) {
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/);
}

test("GET /v1/services/search returns five public-safe synthetic service records", async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/services/search`);
    assert.equal(response.status, 200);
    assertSafeHeaders(response);

    const body = await response.json();
    assert.equal(body.services.length, 5);

    const modes = new Set(body.services.map((item) => item.providerCapabilities.integrationMode));
    assert.deepEqual(modes, new Set([
      "LIVE_API",
      "READ_ONLY_FEED",
      "SAFEBED_PORTAL",
      "MANUAL_CONFIRMATION",
      "RESTRICTED_SPECIALIST",
    ]));

    const serialized = JSON.stringify(body);
    for (const forbidden of [
      "Synthetic Lane",
      '"destination"',
      '"addressText"',
      '"latitude"',
      '"longitude"',
      '"arrivalInstructions"',
    ]) {
      assert.equal(serialized.includes(forbidden), false, `Public HTTP discovery leaked ${forbidden}`);
    }
  });
});

test("public-safe area filter is bounded and does not add geospatial semantics", async () => {
  await withApi(async (baseUrl) => {
    const matching = await fetch(`${baseUrl}/v1/services/search?area=Synthetic%20test`);
    assert.equal(matching.status, 200);
    assert.equal((await matching.json()).services.length, 5);

    const empty = await fetch(`${baseUrl}/v1/services/search?area=Nowhere`);
    assert.equal(empty.status, 200);
    assert.deepEqual(await empty.json(), { services: [] });

    const duplicate = await fetch(`${baseUrl}/v1/services/search?area=a&area=b`);
    assert.equal(duplicate.status, 400);
    assert.deepEqual(await duplicate.json(), {
      code: "VALIDATION_FAILED",
      message: "Invalid public-safe area query.",
    });
  });
});

test("POST /v1/matches preserves professional-referral-required as a pathway", async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/matches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requiredFor: "2026-08-19",
        householdSize: 1,
        professionalReferralAvailable: false,
      }),
    });
    assert.equal(response.status, 200);
    assertSafeHeaders(response);

    const body = await response.json();
    assert.equal(body.outcome, "CANDIDATES_FOUND");

    const specialist = body.matches.find(
      (item) => item.service.serviceId === syntheticProfileServices.restrictedSpecialist.serviceId,
    );
    assert.ok(specialist);
    assert.equal(specialist.matchState, "POSSIBLY_SUITABLE");
    assert.ok(specialist.reasons.some((reason) => reason.code === "PROFESSIONAL_REFERRAL_REQUIRED"));
    assert.equal("destination" in specialist.service, false);
  });
});

test("HTTP match response keeps manual-confirmation capacity unconfirmed and read-only feed non-bookable", async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/matches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requiredFor: "2026-08-19",
        householdSize: 1,
        professionalReferralAvailable: true,
      }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();

    const manual = body.matches.find(
      (item) => item.service.serviceId === syntheticProfileServices.manualConfirmation.serviceId,
    );
    assert.ok(manual);
    assert.equal(manual.availability.availableUnits, 1);
    assert.equal(manual.availability.state, "MANUAL_CONFIRMATION_REQUIRED");

    const readOnly = body.matches.find(
      (item) => item.service.serviceId === syntheticProfileServices.readOnlyFeed.serviceId,
    );
    assert.ok(readOnly);
    assert.equal(readOnly.availability.state, "AVAILABLE");
    assert.deepEqual(readOnly.providerCapabilities, {
      integrationMode: "READ_ONLY_FEED",
      referralMode: "EXTERNAL_MANUAL",
      holdSupported: false,
      reservationMode: "EXTERNAL_MANUAL",
    });
  });
});

test("GET availability returns the same normalised provider-authoritative state over HTTP", async () => {
  await withApi(async (baseUrl) => {
    const serviceId = syntheticProfileServices.liveApi.serviceId;
    const response = await fetch(`${baseUrl}/v1/services/${serviceId}/availability`);
    assert.equal(response.status, 200);
    assertSafeHeaders(response);

    const body = await response.json();
    assert.equal(body.serviceId, serviceId);
    assert.equal(body.availableUnits, 1);
    assert.equal(body.state, "LIMITED");
    assert.ok(body.sourceRevision);
    assert.equal(body.observedAt, SYNTHETIC_PROFILE_NOW.toISOString());
  });
});

test("unknown resource/path errors are bounded and do not echo guessed identifiers", async () => {
  await withApi(async (baseUrl) => {
    const guessedId = "guessed-sensitive-looking-service";
    const response = await fetch(`${baseUrl}/v1/services/${guessedId}/availability`);
    assert.equal(response.status, 404);
    const body = await response.json();
    assert.deepEqual(body, {
      code: "NOT_FOUND",
      message: "Resource not found or intentionally not disclosed.",
    });
    assert.equal(JSON.stringify(body).includes(guessedId), false);

    const unknownPath = await fetch(`${baseUrl}/v1/not-a-route`);
    assert.equal(unknownPath.status, 404);
    assert.deepEqual(await unknownPath.json(), body);
  });
});

test("placement need rejects malformed, extra and privilege-like client fields", async () => {
  await withApi(async (baseUrl) => {
    const malformed = await fetch(`${baseUrl}/v1/matches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).code, "VALIDATION_FAILED");

    for (const extra of ["freeTextNarrative", "actorRole", "disclosureLevel", "canDiscloseDestination"]) {
      const response = await fetch(`${baseUrl}/v1/matches`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requiredFor: "2026-08-19",
          householdSize: 1,
          [extra]: "forged-or-unneeded",
        }),
      });
      assert.equal(response.status, 400, `Expected ${extra} to be rejected`);
      assert.equal((await response.json()).code, "VALIDATION_FAILED");
    }
  });
});

test("placement need request body is explicitly bounded", async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/matches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requiredFor: "2026-08-19",
        householdSize: 1,
        freeTextNarrative: "x".repeat(20 * 1024),
      }),
    });
    assert.equal(response.status, 400);
    assert.equal((await response.json()).code, "VALIDATION_FAILED");
  });
});

test("transaction HTTP routes remain deliberately unexposed", async () => {
  await withApi(async (baseUrl) => {
    for (const path of ["/v1/referrals", "/v1/holds", "/v1/reservations", "/v1/placements/demo/arrival"]) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      assert.equal(response.status, 404, `${path} must not be exposed by public synthetic HTTP adapter`);
      assert.deepEqual(await response.json(), {
        code: "NOT_FOUND",
        message: "Resource not found or intentionally not disclosed.",
      });
    }
  });
});
