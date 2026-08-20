import assert from "node:assert/strict";
import { Action, Decision, authorise } from "../prototype/authorisation/policy.mjs";

const NOW = Date.parse("2030-01-15T10:00:00Z");

const organisation = (id, verificationStatus = "VERIFIED") => ({ id, verificationStatus });
const membership = (organisationId, overrides = {}) => ({
  organisationId,
  status: "ACTIVE",
  validFrom: "2029-01-01T00:00:00Z",
  validUntil: "2031-01-01T00:00:00Z",
  ...overrides,
});

function human({
  id,
  organisationId,
  capabilities = [],
  membershipOverrides = {},
  verificationStatus = "VERIFIED",
}) {
  return Object.freeze({
    id,
    kind: "HUMAN",
    identityStatus: "ACTIVE",
    organisation: organisation(organisationId, verificationStatus),
    membership: membership(organisationId, membershipOverrides),
    capabilities,
    entitlements: [],
    authentication: {},
  });
}

function machine({ id, organisationId, scopes = [], status = "ACTIVE" }) {
  return Object.freeze({
    id,
    kind: "MACHINE",
    status,
    organisation: organisation(organisationId),
    scopes,
  });
}

const supportAll = human({
  id: "support-transaction-a",
  organisationId: "support-a",
  capabilities: ["hold.request", "reservation.create", "placement.arrival.write"],
});
const providerAll = human({
  id: "provider-transaction-a",
  organisationId: "provider-a",
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
const reservationOnly = human({
  id: "reservation-only-a",
  organisationId: "support-a",
  capabilities: ["reservation.create"],
});
const arrivalOnly = human({
  id: "arrival-only-a",
  organisationId: "support-a",
  capabilities: ["placement.arrival.write"],
});
const suspendedSupport = human({
  id: "suspended-support-a",
  organisationId: "support-a",
  capabilities: ["hold.request", "reservation.create", "placement.arrival.write"],
  membershipOverrides: { status: "SUSPENDED" },
});
const expiredSupport = human({
  id: "expired-support-a",
  organisationId: "support-a",
  capabilities: ["hold.request", "reservation.create", "placement.arrival.write"],
  membershipOverrides: { validUntil: "2030-01-15T09:59:59Z" },
});
const revokedOrganisationSupport = human({
  id: "revoked-org-support-a",
  organisationId: "support-a",
  capabilities: ["hold.request", "reservation.create", "placement.arrival.write"],
  verificationStatus: "REVOKED",
});

const providerMachineAll = machine({
  id: "provider-machine-a",
  organisationId: "provider-a",
  scopes: ["hold.manage", "reservation.manage", "placement.arrival.write"],
});
const providerMachineHoldOnly = machine({
  id: "provider-machine-hold-a",
  organisationId: "provider-a",
  scopes: ["hold.manage"],
});
const revokedProviderMachine = machine({
  id: "revoked-provider-machine-a",
  organisationId: "provider-a",
  scopes: ["hold.manage", "reservation.manage", "placement.arrival.write"],
  status: "REVOKED",
});

const acceptedReferral = Object.freeze({
  id: "referral-a-accepted",
  providerOrganisationId: "provider-a",
  authorisedOrganisationIds: ["support-a"],
  referralState: "ACCEPTED",
  providerDecision: "ACCEPTED",
});

const pendingReferral = Object.freeze({
  ...acceptedReferral,
  id: "referral-a-pending",
  referralState: "SUBMITTED",
  providerDecision: "PENDING",
});

const activeHold = Object.freeze({
  ...acceptedReferral,
  id: "hold-a-active",
  holdState: "ACTIVE",
});

const expiredHold = Object.freeze({
  ...acceptedReferral,
  id: "hold-a-expired",
  holdState: "EXPIRED",
});

const confirmedReservation = Object.freeze({
  ...activeHold,
  id: "reservation-a-confirmed",
  reservationState: "CONFIRMED",
});

const pendingReservation = Object.freeze({
  ...activeHold,
  id: "reservation-a-pending",
  reservationState: "PENDING",
});

const providerOwnedAcceptedReferral = Object.freeze({
  ...acceptedReferral,
  id: "provider-owned-referral-a",
  authorisedOrganisationIds: [],
});
const providerOwnedActiveHold = Object.freeze({
  ...activeHold,
  id: "provider-owned-hold-a",
  authorisedOrganisationIds: [],
});
const providerOwnedConfirmedReservation = Object.freeze({
  ...confirmedReservation,
  id: "provider-owned-reservation-a",
  authorisedOrganisationIds: [],
});

const unrelatedProviderResource = Object.freeze({
  ...confirmedReservation,
  id: "provider-b-placement",
  providerOrganisationId: "provider-b",
  authorisedOrganisationIds: ["support-b"],
});

function decide(principal, action, resource, context = {}) {
  return authorise({ principal, action, resource, context, now: NOW });
}

function expect(principal, action, resource, expected, { audit, conceal, reason, context } = {}) {
  const actual = decide(principal, action, resource, context);
  assert.equal(actual.decision, expected, `${action}: ${actual.reason}`);
  if (audit !== undefined) assert.equal(actual.audit, audit, `${action}: audit mismatch`);
  if (conceal !== undefined) assert.equal(actual.conceal, conceal, `${action}: conceal mismatch`);
  if (reason !== undefined) assert.equal(actual.reason, reason, `${action}: reason mismatch`);
  return actual;
}

let checks = 0;
function checked(...args) {
  checks += 1;
  return expect(...args);
}

// Explicit human capabilities + relationship + state.
checked(supportAll, Action.REQUEST_HOLD, acceptedReferral, Decision.ALLOW, {
  audit: true,
  reason: "hold_request_permitted",
});
checked(supportAll, Action.CREATE_RESERVATION, activeHold, Decision.ALLOW, {
  audit: true,
  reason: "reservation_create_permitted",
});
checked(supportAll, Action.CONFIRM_ARRIVAL, confirmedReservation, Decision.ALLOW, {
  audit: true,
  reason: "arrival_confirmation_permitted",
});

// Provider-owned human resources do not require a support-organisation relationship.
checked(providerAll, Action.REQUEST_HOLD, providerOwnedAcceptedReferral, Decision.ALLOW, { audit: true });
checked(providerAll, Action.CREATE_RESERVATION, providerOwnedActiveHold, Decision.ALLOW, { audit: true });
checked(providerAll, Action.CONFIRM_ARRIVAL, providerOwnedConfirmedReservation, Decision.ALLOW, { audit: true });

// Capabilities are separate; earlier-stage authority does not automatically escalate.
checked(referralOnly, Action.REQUEST_HOLD, acceptedReferral, Decision.DENY, {
  reason: "hold_request_capability_missing",
});
checked(holdOnly, Action.CREATE_RESERVATION, activeHold, Decision.DENY, {
  reason: "reservation_create_capability_missing",
});
checked(reservationOnly, Action.CONFIRM_ARRIVAL, confirmedReservation, Decision.DENY, {
  reason: "arrival_write_capability_missing",
});
checked(arrivalOnly, Action.REQUEST_HOLD, acceptedReferral, Decision.DENY);

// Transaction state is independently required.
checked(supportAll, Action.REQUEST_HOLD, pendingReferral, Decision.DENY, {
  reason: "hold_requires_accepted_referral",
});
checked(supportAll, Action.CREATE_RESERVATION, expiredHold, Decision.DENY, {
  reason: "reservation_requires_active_hold",
});
checked(supportAll, Action.CONFIRM_ARRIVAL, pendingReservation, Decision.DENY, {
  reason: "arrival_requires_confirmed_reservation",
});

// Relationship isolation is fail-closed and concealed.
checked(supportAll, Action.REQUEST_HOLD, unrelatedProviderResource, Decision.DENY, {
  conceal: true,
  reason: "hold_relationship_missing",
});
checked(supportAll, Action.CREATE_RESERVATION, unrelatedProviderResource, Decision.DENY, {
  conceal: true,
  reason: "reservation_relationship_missing",
});
checked(supportAll, Action.CONFIRM_ARRIVAL, unrelatedProviderResource, Decision.DENY, {
  conceal: true,
  reason: "arrival_relationship_missing",
});

// Current authoritative identity/org/membership state overrides stale-looking capability grants.
for (const principal of [suspendedSupport, expiredSupport, revokedOrganisationSupport]) {
  checked(principal, Action.REQUEST_HOLD, acceptedReferral, Decision.DENY);
  checked(principal, Action.CREATE_RESERVATION, activeHold, Decision.DENY);
  checked(principal, Action.CONFIRM_ARRIVAL, confirmedReservation, Decision.DENY);
}

// Browser/request context cannot forge capabilities or relationship.
checked(referralOnly, Action.REQUEST_HOLD, acceptedReferral, Decision.DENY, {
  context: {
    clientSupplied: {
      role: "TRANSACTION_ADMIN",
      capabilities: ["hold.request", "reservation.create", "placement.arrival.write"],
      organisationId: "provider-a",
      holdState: "ACTIVE",
      reservationState: "CONFIRMED",
    },
  },
});
checked(supportAll, Action.CREATE_RESERVATION, expiredHold, Decision.DENY, {
  context: { clientSupplied: { holdState: "ACTIVE" } },
});

// Narrow machine scopes remain provider-owned and state-aware.
checked(providerMachineAll, Action.REQUEST_HOLD, providerOwnedAcceptedReferral, Decision.ALLOW, { audit: true });
checked(providerMachineAll, Action.CREATE_RESERVATION, providerOwnedActiveHold, Decision.ALLOW, { audit: true });
checked(providerMachineAll, Action.CONFIRM_ARRIVAL, providerOwnedConfirmedReservation, Decision.ALLOW, { audit: true });
checked(providerMachineHoldOnly, Action.REQUEST_HOLD, providerOwnedAcceptedReferral, Decision.ALLOW, { audit: true });
checked(providerMachineHoldOnly, Action.CREATE_RESERVATION, providerOwnedActiveHold, Decision.DENY, {
  conceal: true,
  reason: "machine_scope_not_permitted",
});
checked(providerMachineAll, Action.CREATE_RESERVATION, expiredHold, Decision.DENY, {
  reason: "reservation_requires_active_hold",
});
checked(providerMachineAll, Action.CONFIRM_ARRIVAL, pendingReservation, Decision.DENY, {
  reason: "arrival_requires_confirmed_reservation",
});
checked(providerMachineAll, Action.REQUEST_HOLD, unrelatedProviderResource, Decision.DENY, {
  conceal: true,
  reason: "machine_cross_organisation",
});
checked(revokedProviderMachine, Action.REQUEST_HOLD, providerOwnedAcceptedReferral, Decision.DENY, {
  reason: "machine_not_active",
});

console.log(`SafeBed placement transaction authorisation contract passed: ${checks} checks`);
