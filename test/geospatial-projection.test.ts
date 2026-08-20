import assert from "node:assert/strict";
import test from "node:test";

import {
  authorisedRoutingMode,
  projectForPublicMap,
  publicDistanceMiles,
  UnsafePublicProjectionError,
} from "../src/geospatial-projection.ts";

const protectedDestination = {
  addressText: "91 Fictional Protected Way, Exampletown",
  latitude: 52.123456,
  longitude: -0.654321,
  arrivalInstructions: "Synthetic protected destination only.",
};

const restrictedLocation = {
  serviceId: "synthetic-restricted-location",
  disclosureLevel: "RESTRICTED",
  publicAreaLabel: "Exampletown north area",
  exactDestination: protectedDestination,
  safePublicProjection: {
    kind: "SAFE_AREA",
    areaId: "synthetic-safe-area-north",
    label: "Exampletown north area",
  },
  externalRoutingPolicy: "PROVIDER_CONTROLLED_ONLY",
} as const;

test("restricted exact destination never appears in the anonymous public map projection", () => {
  const projection = projectForPublicMap(restrictedLocation);
  assert.deepEqual(projection, {
    kind: "SAFE_AREA",
    areaId: "synthetic-safe-area-north",
    label: "Exampletown north area",
  });

  const serialized = JSON.stringify(projection);
  assert.equal(serialized.includes(protectedDestination.addressText), false);
  assert.equal(serialized.includes(String(protectedDestination.latitude)), false);
  assert.equal(serialized.includes(String(protectedDestination.longitude)), false);
  assert.equal(serialized.includes(protectedDestination.arrivalInstructions), false);
});

test("protected services fail closed if configuration tries to expose a public exact point", () => {
  assert.throws(
    () => projectForPublicMap({
      ...restrictedLocation,
      safePublicProjection: {
        kind: "PUBLIC_POINT",
        latitude: protectedDestination.latitude,
        longitude: protectedDestination.longitude,
        label: "Unsafe synthetic point",
      },
    }),
    UnsafePublicProjectionError,
  );
});

test("sealed service never exposes ordinary client geometry even when configured with a safe area", () => {
  const projection = projectForPublicMap({
    ...restrictedLocation,
    serviceId: "synthetic-sealed-location",
    disclosureLevel: "SEALED",
  });
  assert.deepEqual(projection, {
    kind: "NO_GEOMETRY",
    label: "Exampletown north area",
  });
});

test("public distance is derived only from browser-safe PUBLIC_POINT geometry", () => {
  const origin = { latitude: 52.1, longitude: -0.6 };
  assert.equal(publicDistanceMiles(origin, projectForPublicMap(restrictedLocation)), undefined);

  const publicProjection = projectForPublicMap({
    serviceId: "synthetic-public-location",
    disclosureLevel: "PUBLIC",
    publicAreaLabel: "Exampletown centre",
    exactDestination: {
      addressText: "1 Fictional Public Street, Exampletown",
      latitude: 52.11,
      longitude: -0.61,
    },
    safePublicProjection: {
      kind: "PUBLIC_POINT",
      latitude: 52.11,
      longitude: -0.61,
      label: "Synthetic public shelter",
    },
    externalRoutingPolicy: "EXTERNAL_ALLOWED",
  });

  const distance = publicDistanceMiles(origin, publicProjection);
  assert.equal(typeof distance, "number");
  assert.ok(distance > 0);
});

test("external navigation remains a separate disclosure decision", () => {
  assert.equal(authorisedRoutingMode(restrictedLocation, false), "NONE");
  assert.equal(authorisedRoutingMode(restrictedLocation, true), "PROVIDER_CONTROLLED");

  const publicLocation = {
    serviceId: "synthetic-public-location",
    disclosureLevel: "PUBLIC",
    publicAreaLabel: "Exampletown centre",
    exactDestination: {
      addressText: "1 Fictional Public Street, Exampletown",
      latitude: 52.11,
      longitude: -0.61,
    },
    safePublicProjection: {
      kind: "PUBLIC_POINT",
      latitude: 52.11,
      longitude: -0.61,
      label: "Synthetic public shelter",
    },
    externalRoutingPolicy: "EXTERNAL_ALLOWED",
  } as const;

  assert.equal(authorisedRoutingMode(publicLocation, false), "NONE");
  assert.equal(authorisedRoutingMode(publicLocation, true), "EXTERNAL_ALLOWED");
});

test("sealed destination cannot enter ordinary client routing even after a positive disclosure flag", () => {
  assert.equal(authorisedRoutingMode({
    ...restrictedLocation,
    disclosureLevel: "SEALED",
    externalRoutingPolicy: "EXTERNAL_ALLOWED",
  }, true), "NONE");
});

test("NO_CLIENT_ROUTE policy remains no-route after destination authorisation", () => {
  assert.equal(authorisedRoutingMode({
    ...restrictedLocation,
    disclosureLevel: "PLACEMENT_AUTHORISED",
    externalRoutingPolicy: "NO_CLIENT_ROUTE",
  }, true), "NONE");
});
