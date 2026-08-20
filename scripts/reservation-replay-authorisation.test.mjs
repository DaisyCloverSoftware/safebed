import assert from "node:assert/strict";
import { Action, Decision } from "../prototype/authorisation/policy.mjs";
import { authorisePlacementTransaction } from "../prototype/authorisation/placement-policy.mjs";

const NOW = Date.parse("2030-01-15T10:00:00Z");

function human({ id, organisationId, capabilities = [], status = "ACTIVE" }) {
  return Object.freeze({
    id,
    kind: "HUMAN",
    identityStatus: "ACTIVE",
    organisation: { id: organisationId, verificationStatus: "VERIFIED" },
    membership: {
      organisationId,
      status,
      validFrom: "2029-01-01T00:00:00Z",
      validUntil: "2031-01-01T00:00:00Z",
    },
    capabilities,
    entitlements: [],
    authentication: {},
  });
}

function machine({ id, organisationId, scopes = [] }) {
  return Object.freeze({
    id,
    kind: "MACHINE",
    status: "ACTIVE",
    organisation: { id: organisationId, verificationStatus: "VERIFIED" },
    scopes,
  });
}

const supportReservation = human({
  id: "support-reservation-a",
  organisationId: "support-a",
  capabilities: ["reservation.create"],
});
const supportNoReservation = human({
  id: "support-no-reservation-a",
  organisationId: "support-a",
  capabilities: ["hold.request"],
});
const suspendedSupport = human({
  id: "support-suspended-a",
  organisationId: "support-a",
  capabilities: ["reservation.create"],
  status: "SUSPENDED",
});
const providerMachine = machine({
  id: "provider-machine-a",
  organisationId: "provider-a",
  scopes: ["reservation.manage"],
});
const providerMachineWrongScope = machine({
  id: "provider-machine-hold-only-a",
  organisationId: "provider-a",
  scopes: ["hold.manage"],
});

const consumedHold = Object.freeze({
  id: "hold-a-consumed",
  providerOrganisationId: "provider-a",
  authorisedOrganisationIds: ["support-a"],
  referralState: "ACCEPTED",
  providerDecision: "ACCEPTED",
  holdState: "CONSUMED",
});

const exactConfirmedReplay = Object.freeze({
  ...consumedHold,
  idempotentReplay: true,
  reservationState: "CONFIRMED",
});

function decide(principal, resource, context = {}) {
  return authorisePlacementTransaction({
    principal,
    action: Action.CREATE_RESERVATION,
    resource,
    context,
    now: NOW,
  });
}

let checks = 0;
function expect(principal, resource, expected, options = {}) {
  checks += 1;
  const actual = decide(principal, resource, options.context);
  assert.equal(actual.decision, expected, actual.reason);
  if (options.reason !== undefined) assert.equal(actual.reason, options.reason);
  if (options.audit !== undefined) assert.equal(actual.audit, options.audit);
  if (options.conceal !== undefined) assert.equal(actual.conceal, options.conceal);
  return actual;
}

// Normal consumed-hold request remains denied.
expect(supportReservation, consumedHold, Decision.DENY, {
  reason: "reservation_requires_active_hold",
});

// Server-authoritative exact replay of an existing confirmed reservation is allowed and audited.
expect(supportReservation, exactConfirmedReplay, Decision.ALLOW, {
  reason: "reservation_idempotent_replay",
  audit: true,
});

// The same create request may still be replayed after the reservation has advanced to ARRIVED.
expect(supportReservation, { ...exactConfirmedReplay, reservationState: "ARRIVED" }, Decision.ALLOW, {
  reason: "reservation_idempotent_replay",
  audit: true,
});

// Replay marker is insufficient without the exact accepted/existing-reservation state.
expect(supportReservation, { ...exactConfirmedReplay, reservationState: "CANCELLED" }, Decision.DENY, {
  reason: "reservation_requires_active_hold",
});
expect(supportReservation, { ...exactConfirmedReplay, referralState: "SUBMITTED" }, Decision.DENY, {
  reason: "reservation_requires_active_hold",
});
expect(supportReservation, { ...exactConfirmedReplay, providerDecision: "PENDING" }, Decision.DENY, {
  reason: "reservation_requires_active_hold",
});

// Base capability/membership/relationship checks must still pass before replay can be upgraded.
expect(supportNoReservation, exactConfirmedReplay, Decision.DENY, {
  reason: "reservation_create_capability_missing",
});
expect(suspendedSupport, exactConfirmedReplay, Decision.DENY, {
  reason: "membership_not_active",
});
expect(supportReservation, {
  ...exactConfirmedReplay,
  providerOrganisationId: "provider-b",
  authorisedOrganisationIds: ["support-b"],
}, Decision.DENY, {
  reason: "reservation_relationship_missing",
  conceal: true,
});

// Request/browser context cannot forge replay state into the server-authoritative resource.
expect(supportReservation, consumedHold, Decision.DENY, {
  reason: "reservation_requires_active_hold",
  context: {
    clientSupplied: {
      idempotentReplay: true,
      reservationState: "CONFIRMED",
      holdState: "ACTIVE",
    },
  },
});

// Provider machine replay remains provider-owned and requires the reservation scope.
expect(providerMachine, {
  ...exactConfirmedReplay,
  authorisedOrganisationIds: [],
}, Decision.ALLOW, {
  reason: "reservation_idempotent_replay",
  audit: true,
});
expect(providerMachineWrongScope, {
  ...exactConfirmedReplay,
  authorisedOrganisationIds: [],
}, Decision.DENY, {
  reason: "machine_scope_not_permitted",
  conceal: true,
});
expect(providerMachine, {
  ...exactConfirmedReplay,
  providerOrganisationId: "provider-b",
  authorisedOrganisationIds: [],
}, Decision.DENY, {
  reason: "machine_cross_organisation",
  conceal: true,
});

console.log(`SafeBed reservation replay authorisation contract passed: ${checks} checks`);
