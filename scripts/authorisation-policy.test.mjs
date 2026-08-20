import assert from "node:assert/strict";
import { Action, Decision, Disclosure, authorise } from "../prototype/authorisation/policy.mjs";

const NOW = Date.parse("2030-01-15T10:00:00Z");
const recentStepUp = "2030-01-15T09:55:00Z";
const staleStepUp = "2030-01-15T09:30:00Z";

const verifiedOrganisation = (id) => ({ id, verificationStatus: "VERIFIED" });
const activeMembership = (organisationId, overrides = {}) => ({
  organisationId,
  status: "ACTIVE",
  validFrom: "2029-01-01T00:00:00Z",
  validUntil: "2031-01-01T00:00:00Z",
  ...overrides,
});

const human = ({ id, organisationId, capabilities = [], entitlements = [], membership = {}, authentication = {} }) => ({
  id,
  kind: "HUMAN",
  identityStatus: "ACTIVE",
  organisation: verifiedOrganisation(organisationId),
  membership: activeMembership(organisationId, membership),
  capabilities,
  entitlements,
  authentication,
});

const anon = Object.freeze({ id: "anon", kind: "ANONYMOUS" });

const supportA = human({
  id: "support-worker-a",
  organisationId: "support-a",
  capabilities: ["referral.create", "referral.read", "destination.read"],
});

const supportB = human({
  id: "support-worker-b",
  organisationId: "support-b",
  capabilities: ["referral.create", "referral.read", "destination.read"],
});

const providerWorkerA = human({
  id: "provider-worker-a",
  organisationId: "provider-a",
  capabilities: ["referral.review", "referral.read", "destination.read"],
});

const capacityManagerA = human({
  id: "capacity-manager-a",
  organisationId: "provider-a",
  capabilities: ["capacity.read", "capacity.write"],
});

const specialistA = human({
  id: "specialist-worker-a",
  organisationId: "support-a",
  capabilities: ["referral.create", "referral.read", "destination.read"],
  entitlements: [{
    programmeId: "specialist-programme-a",
    status: "ACTIVE",
    validFrom: "2029-01-01T00:00:00Z",
    validUntil: "2031-01-01T00:00:00Z",
  }],
  authentication: { phishingResistantAt: recentStepUp },
});

const specialistWithoutStepUp = {
  ...specialistA,
  id: "specialist-without-recent-step-up",
  authentication: { phishingResistantAt: staleStepUp },
};

const specialistExpiredEntitlement = {
  ...specialistA,
  id: "specialist-expired-entitlement",
  entitlements: [{
    programmeId: "specialist-programme-a",
    status: "ACTIVE",
    validUntil: "2029-12-31T23:59:59Z",
  }],
};

const orgAdminA = human({
  id: "org-admin-a",
  organisationId: "support-a",
  capabilities: ["membership.admin"],
  authentication: { phishingResistantAt: recentStepUp },
});

const orgAdminStaleStepUp = {
  ...orgAdminA,
  id: "org-admin-stale-step-up",
  authentication: { phishingResistantAt: staleStepUp },
};

const platformSupport = human({
  id: "platform-support",
  organisationId: "platform",
  capabilities: ["support.metadata"],
});

const securityOperator = human({
  id: "security-operator",
  organisationId: "platform",
  capabilities: ["break_glass"],
  authentication: { phishingResistantAt: "2030-01-15T09:58:00Z" },
});

const suspendedUserA = human({
  id: "suspended-user-a",
  organisationId: "support-a",
  capabilities: ["referral.create", "destination.read"],
  membership: { status: "SUSPENDED" },
});

const expiredMembershipA = human({
  id: "expired-membership-a",
  organisationId: "support-a",
  capabilities: ["referral.create", "destination.read"],
  membership: { validUntil: "2030-01-15T09:59:59Z" },
});

const revokedOrgUser = {
  ...human({
    id: "revoked-org-user",
    organisationId: "support-a",
    capabilities: ["referral.create", "destination.read"],
  }),
  organisation: { id: "support-a", verificationStatus: "REVOKED" },
};

const suspendedIdentity = {
  ...supportA,
  id: "suspended-identity",
  identityStatus: "SUSPENDED",
};

const machineProviderA = Object.freeze({
  id: "machine-provider-a",
  kind: "MACHINE",
  status: "ACTIVE",
  organisation: verifiedOrganisation("provider-a"),
  scopes: ["capacity.read", "capacity.write"],
});

const machineReferralStatusA = Object.freeze({
  id: "machine-referral-status-a",
  kind: "MACHINE",
  status: "ACTIVE",
  organisation: verifiedOrganisation("provider-a"),
  scopes: ["referral.status.write"],
});

const revokedMachineA = Object.freeze({
  ...machineProviderA,
  id: "revoked-machine-a",
  status: "REVOKED",
});

const publicServiceA = Object.freeze({
  id: "public-service-a",
  providerOrganisationId: "provider-a",
  disclosure: Disclosure.PUBLIC,
  permittedReferrerOrganisationIds: ["support-a", "support-b"],
});

const publicServiceB = Object.freeze({
  id: "public-service-b",
  providerOrganisationId: "provider-b",
  disclosure: Disclosure.PUBLIC,
  permittedReferrerOrganisationIds: ["support-b"],
});

const referralAPending = Object.freeze({
  id: "referral-a-pending",
  providerOrganisationId: "provider-a",
  disclosure: Disclosure.PLACEMENT_AUTHORISED,
  placementState: "REFERRAL_SUBMITTED",
  providerDecision: "PENDING",
  authorisedOrganisationIds: ["support-a"],
});

const referralBPending = Object.freeze({
  id: "referral-b-pending",
  providerOrganisationId: "provider-b",
  disclosure: Disclosure.PLACEMENT_AUTHORISED,
  placementState: "REFERRAL_SUBMITTED",
  providerDecision: "PENDING",
  authorisedOrganisationIds: ["support-b"],
});

const reservationA = Object.freeze({
  id: "reservation-a",
  providerOrganisationId: "provider-a",
  disclosure: Disclosure.PLACEMENT_AUTHORISED,
  placementState: "CONFIRMED",
  providerDecision: "ACCEPTED",
  authorisedOrganisationIds: ["support-a"],
});

const restrictedPendingA = Object.freeze({
  ...reservationA,
  id: "restricted-pending-a",
  disclosure: Disclosure.RESTRICTED,
  programmeId: "specialist-programme-a",
  placementState: "REFERRAL_SUBMITTED",
  providerDecision: "PENDING",
});

const restrictedConfirmedA = Object.freeze({
  ...reservationA,
  id: "restricted-confirmed-a",
  disclosure: Disclosure.RESTRICTED,
  programmeId: "specialist-programme-a",
});

const sealedA = Object.freeze({
  ...reservationA,
  id: "sealed-a",
  disclosure: Disclosure.SEALED,
});

const membershipResourceA = Object.freeze({ organisationId: "support-a" });
const membershipResourceB = Object.freeze({ organisationId: "support-b" });

function decide(principal, action, resource, context = {}) {
  return authorise({ principal, action, resource, context, now: NOW });
}

function expectDecision(id, principal, action, resource, expected, options = {}) {
  const actual = decide(principal, action, resource, options.context);
  assert.equal(actual.decision, expected, `${id}: ${actual.reason}`);
  if (options.audit !== undefined) assert.equal(actual.audit, options.audit, `${id}: audit mismatch`);
  if (options.conceal !== undefined) assert.equal(actual.conceal, options.conceal, `${id}: conceal mismatch`);
  return actual;
}

const matrix = [
  ["AUTH-001", anon, Action.READ_PUBLIC_SERVICE, publicServiceA, Decision.ALLOW],
  ["AUTH-002", anon, Action.READ_PROFESSIONAL_ROUTE, publicServiceA, Decision.DENY],
  ["AUTH-003", anon, Action.CREATE_REFERRAL, publicServiceA, Decision.DENY],
  ["AUTH-004", supportA, Action.CREATE_REFERRAL, publicServiceA, Decision.ALLOW],
  ["AUTH-005", supportA, Action.UPDATE_CAPACITY, publicServiceA, Decision.DENY],
  ["AUTH-006", providerWorkerA, Action.REVIEW_REFERRAL, referralAPending, Decision.ALLOW],
  ["AUTH-007", providerWorkerA, Action.REVIEW_REFERRAL, referralBPending, Decision.DENY],
  ["AUTH-008", capacityManagerA, Action.UPDATE_CAPACITY, publicServiceA, Decision.ALLOW],
  ["AUTH-009", orgAdminA, Action.READ_REFERRAL_NARRATIVE, referralAPending, Decision.DENY],
  ["AUTH-010", platformSupport, Action.READ_DESTINATION, reservationA, Decision.DENY],
  ["AUTH-011", supportA, Action.READ_DESTINATION, referralAPending, Decision.DENY],
  ["AUTH-012", supportA, Action.READ_DESTINATION, reservationA, Decision.ALLOW],
  ["AUTH-013", supportA, Action.READ_DESTINATION, restrictedConfirmedA, Decision.DENY],
  ["AUTH-014", specialistA, Action.READ_DESTINATION, restrictedPendingA, Decision.DENY],
  ["AUTH-015", specialistA, Action.READ_DESTINATION, restrictedConfirmedA, Decision.ALLOW],
  ["AUTH-016", specialistA, Action.READ_DESTINATION, sealedA, Decision.DENY],
  ["AUTH-017", suspendedUserA, Action.CREATE_REFERRAL, publicServiceA, Decision.DENY],
  ["AUTH-018", revokedOrgUser, Action.CREATE_REFERRAL, publicServiceA, Decision.DENY],
  ["AUTH-019", machineProviderA, Action.READ_CAPACITY, publicServiceA, Decision.ALLOW],
  ["AUTH-020", machineProviderA, Action.READ_REFERRAL_NARRATIVE, referralAPending, Decision.DENY],
  ["AUTH-022", supportA, Action.READ_REFERRAL_NARRATIVE, referralBPending, Decision.DENY],
  ["AUTH-023", supportA, Action.READ_DESTINATION, reservationA, Decision.ALLOW],
  ["AUTH-024", platformSupport, Action.BREAK_GLASS_READ, restrictedConfirmedA, Decision.DENY],
];

for (const [id, principal, action, resource, expected] of matrix) {
  const options = id === "AUTH-023" ? { audit: true } : {};
  expectDecision(id, principal, action, resource, expected, options);
}

// AUTH-021 — request/browser supplied privilege is not part of the grant model.
const forgedAnonymous = decide(anon, Action.READ_DESTINATION, restrictedConfirmedA, {
  clientSupplied: {
    role: "SPECIALIST_ADMIN",
    organisationId: "provider-a",
    disclosure: Disclosure.PUBLIC,
    authenticated: true,
  },
});
assert.equal(forgedAnonymous.decision, Decision.DENY, "AUTH-021a forged anonymous claims must not grant access");

const forgedSupportProvider = decide(supportA, Action.UPDATE_CAPACITY, publicServiceA, {
  clientSupplied: {
    role: "PROVIDER_CAPACITY_MANAGER",
    organisationId: "provider-a",
  },
});
assert.equal(forgedSupportProvider.decision, Decision.DENY, "AUTH-021b forged provider claims must not grant capacity writes");

// Specialist entitlement alone is insufficient; state, relationship and recent step-up are all independently required.
assert.equal(
  decide(specialistExpiredEntitlement, Action.READ_DESTINATION, restrictedConfirmedA).decision,
  Decision.DENY,
  "expired specialist entitlement must be denied",
);
assert.equal(
  decide(specialistWithoutStepUp, Action.READ_DESTINATION, restrictedConfirmedA).decision,
  Decision.REAUTHENTICATION_REQUIRED,
  "restricted destination requires recent phishing-resistant authentication",
);
assert.equal(
  decide(specialistA, Action.READ_DESTINATION, { ...restrictedConfirmedA, authorisedOrganisationIds: ["support-b"] }).decision,
  Decision.DENY,
  "specialist entitlement must not bypass placement relationship",
);

// Session/revocation checks are evaluated from current authoritative state, not stale token appearance.
assert.equal(decide(expiredMembershipA, Action.CREATE_REFERRAL, publicServiceA).decision, Decision.DENY);
assert.equal(decide(suspendedIdentity, Action.CREATE_REFERRAL, publicServiceA).decision, Decision.DENY);
assert.equal(decide(revokedMachineA, Action.READ_CAPACITY, publicServiceA).decision, Decision.DENY);

// Provider and machine identities remain organisation-bound.
assert.equal(decide(capacityManagerA, Action.UPDATE_CAPACITY, publicServiceB).decision, Decision.DENY);
assert.equal(decide(machineProviderA, Action.READ_CAPACITY, publicServiceB).decision, Decision.DENY);
assert.equal(decide(machineReferralStatusA, Action.REVIEW_REFERRAL, referralAPending).decision, Decision.ALLOW);
assert.equal(decide(machineReferralStatusA, Action.READ_REFERRAL_NARRATIVE, referralAPending).decision, Decision.DENY);

// Organisation admin is explicitly not case-data authority and membership changes require recent step-up.
assert.equal(decide(orgAdminA, Action.ADMINISTER_MEMBERSHIP, membershipResourceA).decision, Decision.ALLOW);
assert.equal(decide(orgAdminA, Action.ADMINISTER_MEMBERSHIP, membershipResourceB).decision, Decision.DENY);
assert.equal(decide(orgAdminStaleStepUp, Action.ADMINISTER_MEMBERSHIP, membershipResourceA).decision, Decision.REAUTHENTICATION_REQUIRED);

// Break-glass is exceptional: capability + bounded incident grant + very recent phishing-resistant step-up.
const noGrant = decide(securityOperator, Action.BREAK_GLASS_READ, restrictedConfirmedA);
assert.equal(noGrant.decision, Decision.ADDITIONAL_APPROVAL_REQUIRED);
assert.equal(noGrant.audit, true);

const activeGrant = {
  breakGlass: {
    active: true,
    reason: "Synthetic incident investigation",
    incidentId: "synthetic-incident-001",
    expiresAt: "2030-01-15T10:10:00Z",
  },
};
const breakGlassAllowed = decide(securityOperator, Action.BREAK_GLASS_READ, restrictedConfirmedA, activeGrant);
assert.equal(breakGlassAllowed.decision, Decision.ALLOW);
assert.equal(breakGlassAllowed.audit, true);

const expiredGrant = {
  breakGlass: {
    ...activeGrant.breakGlass,
    expiresAt: "2030-01-15T09:59:59Z",
  },
};
assert.equal(
  decide(securityOperator, Action.BREAK_GLASS_READ, restrictedConfirmedA, expiredGrant).decision,
  Decision.ADDITIONAL_APPROVAL_REQUIRED,
);

const staleBreakGlassOperator = {
  ...securityOperator,
  authentication: { phishingResistantAt: staleStepUp },
};
assert.equal(
  decide(staleBreakGlassOperator, Action.BREAK_GLASS_READ, restrictedConfirmedA, activeGrant).decision,
  Decision.REAUTHENTICATION_REQUIRED,
);

// Protected-resource denial uses a conceal signal so an API adapter can avoid confirming resource existence.
assert.equal(decide(supportB, Action.READ_DESTINATION, restrictedConfirmedA).conceal, true);
assert.equal(decide(providerWorkerA, Action.REVIEW_REFERRAL, referralBPending).conceal, true);

// Unknown actions fail closed rather than falling through to a role-based allow.
assert.equal(
  authorise({ principal: specialistA, action: "DO_EVERYTHING", resource: restrictedConfirmedA, now: NOW }).decision,
  Decision.DENY,
);

console.log(`SafeBed synthetic authorisation policy contract passed: ${matrix.length + 22} assertions across positive and deny-by-default cases.`);
