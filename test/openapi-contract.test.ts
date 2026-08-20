import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  AVAILABILITY_STATES,
  DISCLOSURE_LEVELS,
  HOLD_STATUSES,
  MATCH_REASON_CODES,
  MATCH_STATES,
  PROVIDER_INTEGRATION_MODES,
  REFERRAL_MODES,
  REFERRAL_STATUSES,
  RESERVATION_MODES,
  RESERVATION_STATUSES,
  SEARCH_OUTCOMES,
} from "../src/contract-vocabulary.ts";
import { SafeBedSandbox } from "../src/safebed.ts";
import {
  createSyntheticProviderProfiles,
  SYNTHETIC_PROFILE_NOW,
  syntheticProfileServices,
} from "../src/synthetic-fixtures.ts";

const specification = JSON.parse(
  await readFile(new URL("../api/openapi.v0.2.json", import.meta.url), "utf8"),
);
const schemas = specification.components?.schemas;
assert.ok(schemas, "OpenAPI v0.2 must define components.schemas");

function schema(name) {
  const value = schemas[name];
  assert.ok(value, `Missing OpenAPI schema ${name}`);
  return value;
}

function resolveLocalReference(reference) {
  assert.match(reference, /^#\//, `Only local OpenAPI references are permitted in discovery contract: ${reference}`);
  return reference
    .slice(2)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((current, segment) => current?.[segment], specification);
}

function visit(value, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (typeof value.$ref === "string") {
    assert.ok(resolveLocalReference(value.$ref), `Unresolved OpenAPI reference at ${path}: ${value.$ref}`);
  }
  for (const [key, child] of Object.entries(value)) visit(child, `${path}.${key}`);
}

const enumContracts = new Map([
  ["DisclosureLevel", DISCLOSURE_LEVELS],
  ["AvailabilityState", AVAILABILITY_STATES],
  ["MatchState", MATCH_STATES],
  ["SearchOutcome", SEARCH_OUTCOMES],
  ["ProviderIntegrationMode", PROVIDER_INTEGRATION_MODES],
  ["ReferralMode", REFERRAL_MODES],
  ["ReservationMode", RESERVATION_MODES],
  ["ReferralStatus", REFERRAL_STATUSES],
  ["HoldStatus", HOLD_STATUSES],
  ["ReservationStatus", RESERVATION_STATUSES],
  ["MatchReasonCode", MATCH_REASON_CODES],
]);

test("OpenAPI v0.2 is self-contained and every local reference resolves", () => {
  assert.equal(specification.openapi, "3.1.0");
  assert.equal(specification.info?.version, "0.2.0-discovery");
  visit(specification);
});

test("OpenAPI enums exactly match the executable sandbox vocabulary", () => {
  for (const [name, expected] of enumContracts) {
    assert.deepEqual(schema(name).enum, [...expected], `${name} drifted between OpenAPI and the sandbox model`);
  }
});

test("all five synthetic integration modes are represented by executable provider fixtures", () => {
  const actual = createSyntheticProviderProfiles()
    .map((provider) => provider.capabilities.integrationMode)
    .sort();
  assert.deepEqual(actual, [...PROVIDER_INTEGRATION_MODES].sort());
});

test("MatchResult exposes provider capabilities independently from availability", () => {
  const match = schema("MatchResult");
  assert.ok(match.required.includes("providerCapabilities"));
  assert.equal(match.properties.providerCapabilities.$ref, "#/components/schemas/ProviderCapabilities");
  assert.equal(match.properties.availability.$ref, "#/components/schemas/NormalisedAvailability");
});

test("professional referral requirement remains a pathway rather than a hard mismatch", async () => {
  const sandbox = new SafeBedSandbox(createSyntheticProviderProfiles());
  const result = await sandbox.search({
    requiredFor: "2026-08-19",
    householdSize: 1,
    professionalReferralAvailable: false,
  }, SYNTHETIC_PROFILE_NOW);

  const specialist = result.matches.find(
    (match) => match.service.serviceId === syntheticProfileServices.restrictedSpecialist.serviceId,
  );
  assert.ok(specialist, "Restricted specialist fixture must remain discoverable");
  assert.equal(specialist.matchState, "POSSIBLY_SUITABLE");
  assert.ok(
    specialist.reasons.some((reason) => reason.code === "PROFESSIONAL_REFERRAL_REQUIRED"),
    "Specialist pathway must explain that professional referral is required",
  );
});

test("manual-confirmation capacity cannot masquerade as confirmed live availability", async () => {
  const sandbox = new SafeBedSandbox(createSyntheticProviderProfiles());
  const result = await sandbox.search({
    requiredFor: "2026-08-19",
    householdSize: 1,
    professionalReferralAvailable: true,
  }, SYNTHETIC_PROFILE_NOW);

  const manual = result.matches.find(
    (match) => match.service.serviceId === syntheticProfileServices.manualConfirmation.serviceId,
  );
  assert.ok(manual);
  assert.equal(manual.availability.availableUnits, 1);
  assert.equal(manual.availability.state, "MANUAL_CONFIRMATION_REQUIRED");
  assert.ok(manual.reasons.some((reason) => reason.code === "CAPACITY_UNCONFIRMED"));
});

test("public service contract and fixtures contain no exact destination fields", () => {
  const publicService = schema("PublicService");
  assert.equal(publicService.additionalProperties, false);

  const forbiddenFields = [
    "destination",
    "address",
    "addressText",
    "latitude",
    "longitude",
    "coordinates",
    "arrivalInstructions",
  ];
  for (const field of forbiddenFields) {
    assert.equal(field in publicService.properties, false, `PublicService must not expose ${field}`);
  }

  for (const provider of createSyntheticProviderProfiles()) {
    for (const service of provider.listServices()) {
      for (const field of forbiddenFields) {
        assert.equal(field in service, false, `Public fixture ${service.serviceId} leaked ${field}`);
      }
    }
  }
});

test("reservation request cannot grant its own disclosure privilege", () => {
  const request = schema("CreateReservationRequest");
  assert.equal(request.additionalProperties, false);

  const forbiddenPrivilegeFields = [
    "actorRole",
    "role",
    "organisationId",
    "isProfessional",
    "isSpecialist",
    "disclosureLevel",
    "canDiscloseDestination",
    "includeAddress",
  ];
  for (const field of forbiddenPrivilegeFields) {
    assert.equal(field in request.properties, false, `Reservation input must not accept caller privilege field ${field}`);
  }
});

test("destination is an optional authorised reservation-response concept only", () => {
  const reservation = schema("Reservation");
  assert.equal(reservation.properties.destination.$ref, "#/components/schemas/ProviderDestination");
  assert.equal(reservation.required.includes("destination"), false);

  const discoveryItem = schema("ServiceDiscoveryItem");
  assert.equal(discoveryItem.properties.service.$ref, "#/components/schemas/PublicService");
  assert.equal(JSON.stringify(discoveryItem).includes("ProviderDestination"), false);
});

test("provider capability metadata prevents live feed from implying booking support", () => {
  const readOnly = createSyntheticProviderProfiles().find(
    (provider) => provider.capabilities.integrationMode === "READ_ONLY_FEED",
  );
  assert.ok(readOnly);
  assert.equal(readOnly.capabilities.holdSupported, false);
  assert.equal(readOnly.capabilities.referralMode, "EXTERNAL_MANUAL");
  assert.equal(readOnly.capabilities.reservationMode, "EXTERNAL_MANUAL");
});

test("OpenAPI evidence labels distinguish tested semantics from future HTTP shapes", () => {
  const expected = new Map([
    ["GET /v1/services/search", "contract-only"],
    ["POST /v1/matches", "semantic-flow-tested"],
    ["GET /v1/services/{service_id}/availability", "semantic-flow-tested"],
    ["POST /v1/referrals", "semantic-flow-tested-minimal"],
    ["GET /v1/referrals/{referral_id}", "state-modeled-http-not-implemented"],
    ["POST /v1/holds", "semantic-flow-tested"],
    ["DELETE /v1/holds/{hold_id}", "adapter-modeled-http-not-implemented"],
    ["POST /v1/reservations", "semantic-flow-tested"],
    ["POST /v1/placements/{reservation_id}/arrival", "semantic-flow-tested"],
  ]);

  for (const [operation, evidence] of expected) {
    const separator = operation.indexOf(" ");
    const method = operation.slice(0, separator).toLowerCase();
    const path = operation.slice(separator + 1);
    assert.equal(
      specification.paths?.[path]?.[method]?.["x-safebed-sandbox-evidence"],
      evidence,
      `${operation} evidence label drifted`,
    );
  }
});
