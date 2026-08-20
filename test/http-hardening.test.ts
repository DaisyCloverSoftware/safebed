import assert from "node:assert/strict";
import test from "node:test";

import { createSyntheticDiscoveryApi } from "../prototype/http/synthetic-discovery-api.mjs";
import { SYNTHETIC_PROFILE_NOW } from "../src/synthetic-fixtures.ts";

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

test("synthetic discovery server has explicit connection/request limits", () => {
  const server = createSyntheticDiscoveryApi({ now: SYNTHETIC_PROFILE_NOW });
  assert.equal(server.requestTimeout, 10_000);
  assert.equal(server.headersTimeout, 5_000);
  assert.equal(server.keepAliveTimeout, 5_000);
  assert.equal(server.maxHeadersCount, 64);
  assert.equal(server.maxRequestsPerSocket, 100);
});

test("public discovery responses use conservative browser/cross-origin headers", async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/services/search`, {
      headers: { origin: "https://unrelated.synthetic.invalid" },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("cross-origin-resource-policy"), "same-origin");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.match(response.headers.get("content-security-policy") ?? "", /default-src 'none'/);
    assert.match(response.headers.get("permissions-policy") ?? "", /geolocation=\(\)/);
    assert.equal(response.headers.get("access-control-allow-origin"), null);
  });
});

test("search rejects unknown query parameters instead of silently expanding collection", async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/services/search?area=Exampletown&latitude=52.1`);
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      code: "VALIDATION_FAILED",
      message: "Invalid public-safe area query.",
    });
  });
});

test("matches requires a JSON media type and accepts structured +json", async () => {
  await withApi(async (baseUrl) => {
    const body = JSON.stringify({ requiredFor: "2026-08-19", householdSize: 1 });

    const missing = await fetch(`${baseUrl}/v1/matches`, {
      method: "POST",
      body,
    });
    assert.equal(missing.status, 400);
    assert.deepEqual(await missing.json(), {
      code: "VALIDATION_FAILED",
      message: "A JSON request media type is required.",
    });

    const wrong = await fetch(`${baseUrl}/v1/matches`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body,
    });
    assert.equal(wrong.status, 400);

    const vendorJson = await fetch(`${baseUrl}/v1/matches`, {
      method: "POST",
      headers: { "content-type": "application/vnd.safebed.synthetic+json; charset=utf-8" },
      body,
    });
    assert.equal(vendorJson.status, 200);
  });
});

test("known public endpoints return explicit 405 without exposing transaction routes", async () => {
  await withApi(async (baseUrl) => {
    const searchPost = await fetch(`${baseUrl}/v1/services/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    assert.equal(searchPost.status, 405);
    assert.equal(searchPost.headers.get("allow"), "GET");

    const matchesGet = await fetch(`${baseUrl}/v1/matches`);
    assert.equal(matchesGet.status, 405);
    assert.equal(matchesGet.headers.get("allow"), "POST");

    const transactionOptions = await fetch(`${baseUrl}/v1/referrals`, { method: "OPTIONS" });
    assert.equal(transactionOptions.status, 404);
    assert.equal(transactionOptions.headers.get("allow"), null);
    assert.equal(transactionOptions.headers.get("access-control-allow-origin"), null);
    assert.deepEqual(await transactionOptions.json(), {
      code: "NOT_FOUND",
      message: "Resource not found or intentionally not disclosed.",
    });
  });
});

test("oversized declared match body is rejected through the same bounded validation surface", async () => {
  await withApi(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/v1/matches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requiredFor: "2026-08-19",
        householdSize: 1,
        extra: "x".repeat(20 * 1024),
      }),
    });

    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      code: "VALIDATION_FAILED",
      message: "Invalid JSON request body.",
    });
  });
});
