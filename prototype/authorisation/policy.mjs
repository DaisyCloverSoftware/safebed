export const Decision = Object.freeze({
  ALLOW: "ALLOW",
  DENY: "DENY",
  REAUTHENTICATION_REQUIRED: "REAUTHENTICATION_REQUIRED",
  ADDITIONAL_APPROVAL_REQUIRED: "ADDITIONAL_APPROVAL_REQUIRED",
});

export const Action = Object.freeze({
  READ_PUBLIC_SERVICE: "READ_PUBLIC_SERVICE",
  READ_PROFESSIONAL_ROUTE: "READ_PROFESSIONAL_ROUTE",
  CREATE_REFERRAL: "CREATE_REFERRAL",
  REVIEW_REFERRAL: "REVIEW_REFERRAL",
  UPDATE_CAPACITY: "UPDATE_CAPACITY",
  READ_CAPACITY: "READ_CAPACITY",
  READ_REFERRAL_NARRATIVE: "READ_REFERRAL_NARRATIVE",
  READ_DESTINATION: "READ_DESTINATION",
  ADMINISTER_MEMBERSHIP: "ADMINISTER_MEMBERSHIP",
  BREAK_GLASS_READ: "BREAK_GLASS_READ",
});

export const Disclosure = Object.freeze({
  PUBLIC: "PUBLIC",
  PLACEMENT_AUTHORISED: "PLACEMENT_AUTHORISED",
  RESTRICTED: "RESTRICTED",
  SEALED: "SEALED",
});

const privilegedActions = new Set([
  Action.READ_PROFESSIONAL_ROUTE,
  Action.CREATE_REFERRAL,
  Action.REVIEW_REFERRAL,
  Action.UPDATE_CAPACITY,
  Action.READ_CAPACITY,
  Action.READ_REFERRAL_NARRATIVE,
  Action.READ_DESTINATION,
  Action.ADMINISTER_MEMBERSHIP,
  Action.BREAK_GLASS_READ,
]);

const sensitiveAuditActions = new Set([
  Action.CREATE_REFERRAL,
  Action.REVIEW_REFERRAL,
  Action.UPDATE_CAPACITY,
  Action.READ_REFERRAL_NARRATIVE,
  Action.READ_DESTINATION,
  Action.ADMINISTER_MEMBERSHIP,
  Action.BREAK_GLASS_READ,
]);

function result(decision, reason, { audit = false, conceal = false } = {}) {
  return Object.freeze({ decision, reason, audit, conceal });
}

function deny(reason, options) {
  return result(Decision.DENY, reason, options);
}

function allow(reason, action) {
  return result(Decision.ALLOW, reason, { audit: sensitiveAuditActions.has(action) });
}

function isActiveHuman(principal) {
  return principal?.kind === "HUMAN" && principal.identityStatus === "ACTIVE";
}

function isActiveMachine(principal) {
  return principal?.kind === "MACHINE" && principal.status === "ACTIVE";
}

function hasActiveOrganisation(principal) {
  return principal?.organisation?.verificationStatus === "VERIFIED";
}

function hasActiveMembership(principal, now) {
  const membership = principal?.membership;
  if (!membership || membership.status !== "ACTIVE") return false;
  if (membership.validFrom && Date.parse(membership.validFrom) > now) return false;
  if (membership.validUntil && Date.parse(membership.validUntil) <= now) return false;
  return true;
}

function hasCapability(principal, capability) {
  return principal?.capabilities?.includes(capability) === true;
}

function hasMachineScope(principal, scope) {
  return principal?.scopes?.includes(scope) === true;
}

function ownsProviderResource(principal, resource) {
  return Boolean(
    principal?.organisation?.id &&
    resource?.providerOrganisationId &&
    principal.organisation.id === resource.providerOrganisationId,
  );
}

function hasPlacementRelationship(principal, resource) {
  const organisationId = principal?.organisation?.id;
  if (!organisationId) return false;
  return resource?.authorisedOrganisationIds?.includes(organisationId) === true;
}

function hasActiveProgrammeEntitlement(principal, programmeId, now) {
  if (!programmeId) return false;
  return principal?.entitlements?.some((entitlement) => {
    if (entitlement.programmeId !== programmeId || entitlement.status !== "ACTIVE") return false;
    if (entitlement.validFrom && Date.parse(entitlement.validFrom) > now) return false;
    if (entitlement.validUntil && Date.parse(entitlement.validUntil) <= now) return false;
    return true;
  }) === true;
}

function placementIsAuthorised(resource) {
  return resource?.placementState === "CONFIRMED" || resource?.placementState === "DESTINATION_AUTHORISED";
}

function specialistPlacementIsAuthorised(resource) {
  return placementIsAuthorised(resource) && resource?.providerDecision === "ACCEPTED";
}

function assuranceIsRecent(principal, now, maximumAgeMs = 10 * 60 * 1000) {
  const at = Date.parse(principal?.authentication?.phishingResistantAt ?? "");
  return Number.isFinite(at) && now - at >= 0 && now - at <= maximumAgeMs;
}

function validBreakGlass(context, now) {
  const grant = context?.breakGlass;
  if (!grant?.active || !grant.reason || !grant.incidentId) return false;
  const expiresAt = Date.parse(grant.expiresAt ?? "");
  return Number.isFinite(expiresAt) && expiresAt > now;
}

/**
 * Synthetic executable policy contract.
 *
 * This is deliberately not a production authorisation engine. It exists to make
 * the architecture's negative cases executable before a real IdP/policy system
 * is selected. Browser/request supplied role, organisation and disclosure
 * claims are intentionally not inputs to any granting rule.
 */
export function authorise({ principal, action, resource = {}, context = {}, now = Date.now() }) {
  if (!Object.values(Action).includes(action)) return deny("unknown_action");

  if (action === Action.READ_PUBLIC_SERVICE && resource.disclosure === Disclosure.PUBLIC) {
    return allow("public_discovery", action);
  }

  if (!privilegedActions.has(action)) return deny("deny_by_default");

  if (principal?.kind === "MACHINE") {
    if (!isActiveMachine(principal)) return deny("machine_not_active");
    if (!hasActiveOrganisation(principal)) return deny("organisation_not_verified");
    if (!ownsProviderResource(principal, resource)) return deny("machine_cross_organisation");

    if (action === Action.READ_CAPACITY && hasMachineScope(principal, "capacity.read")) {
      return allow("machine_capacity_read_scope", action);
    }
    if (action === Action.UPDATE_CAPACITY && hasMachineScope(principal, "capacity.write")) {
      return allow("machine_capacity_write_scope", action);
    }
    if (action === Action.REVIEW_REFERRAL && hasMachineScope(principal, "referral.status.write")) {
      return allow("machine_referral_status_scope", action);
    }
    return deny("machine_scope_not_permitted", { conceal: true });
  }

  if (!isActiveHuman(principal)) return deny("human_identity_not_active");
  if (!hasActiveOrganisation(principal)) return deny("organisation_not_verified");
  if (!hasActiveMembership(principal, now)) return deny("membership_not_active");

  switch (action) {
    case Action.READ_PROFESSIONAL_ROUTE:
      return hasCapability(principal, "referral.create") || hasCapability(principal, "referral.review")
        ? allow("professional_route_capability", action)
        : deny("professional_route_capability_missing");

    case Action.CREATE_REFERRAL:
      if (!hasCapability(principal, "referral.create")) return deny("referral_create_capability_missing");
      if (resource.permittedReferrerOrganisationIds?.includes(principal.organisation.id) !== true) {
        return deny("organisation_not_permitted_to_refer", { conceal: true });
      }
      return allow("referral_create_permitted", action);

    case Action.REVIEW_REFERRAL:
      if (!hasCapability(principal, "referral.review")) return deny("referral_review_capability_missing");
      return ownsProviderResource(principal, resource)
        ? allow("provider_owns_referral", action)
        : deny("cross_organisation_referral", { conceal: true });

    case Action.UPDATE_CAPACITY:
      if (!hasCapability(principal, "capacity.write")) return deny("capacity_write_capability_missing");
      return ownsProviderResource(principal, resource)
        ? allow("provider_capacity_scope", action)
        : deny("cross_organisation_capacity", { conceal: true });

    case Action.READ_CAPACITY:
      if (!hasCapability(principal, "capacity.read") && !hasCapability(principal, "capacity.write")) {
        return deny("capacity_read_capability_missing");
      }
      return ownsProviderResource(principal, resource)
        ? allow("provider_capacity_read_scope", action)
        : deny("cross_organisation_capacity", { conceal: true });

    case Action.READ_REFERRAL_NARRATIVE:
      if (!hasCapability(principal, "referral.read")) return deny("referral_read_capability_missing");
      if (ownsProviderResource(principal, resource) || hasPlacementRelationship(principal, resource)) {
        return allow("referral_relationship_permitted", action);
      }
      return deny("referral_relationship_missing", { conceal: true });

    case Action.ADMINISTER_MEMBERSHIP:
      if (!hasCapability(principal, "membership.admin")) return deny("membership_admin_capability_missing");
      if (resource.organisationId !== principal.organisation.id) {
        return deny("cross_organisation_membership_admin", { conceal: true });
      }
      if (!assuranceIsRecent(principal, now)) {
        return result(Decision.REAUTHENTICATION_REQUIRED, "recent_phishing_resistant_auth_required");
      }
      return allow("membership_admin_permitted", action);

    case Action.READ_DESTINATION: {
      if (resource.disclosure === Disclosure.SEALED) {
        return deny("sealed_destination_not_exposed_by_ordinary_api", { conceal: true });
      }
      if (resource.disclosure === Disclosure.PUBLIC) return allow("public_destination", action);
      if (!hasCapability(principal, "destination.read")) {
        return deny("destination_read_capability_missing", { conceal: true });
      }
      if (!hasPlacementRelationship(principal, resource)) {
        return deny("placement_relationship_missing", { conceal: true });
      }
      if (!placementIsAuthorised(resource)) {
        return deny("placement_state_not_authorised", { conceal: true });
      }
      if (resource.disclosure === Disclosure.PLACEMENT_AUTHORISED) {
        return allow("placement_authorised_destination", action);
      }
      if (resource.disclosure === Disclosure.RESTRICTED) {
        if (!hasActiveProgrammeEntitlement(principal, resource.programmeId, now)) {
          return deny("specialist_entitlement_missing", { conceal: true });
        }
        if (!specialistPlacementIsAuthorised(resource)) {
          return deny("specialist_placement_not_authorised", { conceal: true });
        }
        if (!assuranceIsRecent(principal, now)) {
          return result(Decision.REAUTHENTICATION_REQUIRED, "restricted_destination_step_up_required", {
            audit: false,
            conceal: true,
          });
        }
        return allow("restricted_destination_entitlement_state_and_step_up", action);
      }
      return deny("unknown_disclosure_class", { conceal: true });
    }

    case Action.BREAK_GLASS_READ:
      if (!hasCapability(principal, "break_glass")) return deny("break_glass_capability_missing", { conceal: true });
      if (!validBreakGlass(context, now)) {
        return result(Decision.ADDITIONAL_APPROVAL_REQUIRED, "break_glass_grant_missing_or_expired", {
          audit: true,
          conceal: true,
        });
      }
      if (!assuranceIsRecent(principal, now, 5 * 60 * 1000)) {
        return result(Decision.REAUTHENTICATION_REQUIRED, "break_glass_step_up_required", {
          audit: true,
          conceal: true,
        });
      }
      return allow("time_limited_break_glass", action);

    default:
      return deny("deny_by_default");
  }
}
