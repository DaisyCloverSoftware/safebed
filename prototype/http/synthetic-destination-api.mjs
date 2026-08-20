import { createServer } from "node:http";

import { Action, Decision, authorise } from "../authorisation/policy.mjs";
import {
  createSyntheticProviderProfiles,
  SYNTHETIC_PROFILE_NOW,
  syntheticProfileServices,
} from "../../src/synthetic-fixtures.ts";
import {
  CapacityConflictError,
  ProviderUnavailableError,
  UnsupportedProviderCapabilityError,
} from "../../src/synthetic-provider.ts";

const REQUEST_TIMEOUT_MS = 10_000;
const HEADERS_TIMEOUT_MS = 5_000;
const KEEP_ALIVE_TIMEOUT_MS = 5_000;
const MAX_HEADERS_COUNT = 64;
const MAX_REQUESTS_PER_SOCKET = 100;
const SPECIALIST_PROGRAMME_ID = "synthetic-specialist-programme-a";

function responseHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
    "cross-origin-resource-policy": "same-origin",
    "x-frame-options": "DENY",
    "permissions-policy": "geolocation=(), camera=(), microphone=(), payment=(), usb=()",
  };
}

function sendJson(response, status, value, extraHeaders = {}) {
  const body = `${JSON.stringify(value)}\n`;
  response.writeHead(status, {
    ...responseHeaders(),
    ...extraHeaders,
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

function problem(response, status, code, message, extraHeaders = {}) {
  sendJson(response, status, { code, message }, extraHeaders);
}

function boundedString(value, minimum = 1, maximum = 200) {
  return typeof value === "string" && value.length >= minimum && value.length <= maximum;
}

function resolveProfile(profile) {
  const service = syntheticProfileServices[profile];
  if (!service) throw new TypeError(`Unknown synthetic destination profile: ${profile}`);
  return service;
}

function currentDate(clock) {
  const value = clock();
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new TypeError("Synthetic destination clock must return a valid Date.");
  }
  return new Date(value.getTime());
}

function destinationPolicyProblem(response, decision) {
  // A caller who already passed relationship/entitlement checks but needs a
  // fresh assurance ceremony must be able to discover that reauthentication is
  // required. Unrelated protected-resource denials remain concealed.
  if (decision.decision === Decision.REAUTHENTICATION_REQUIRED) {
    problem(response, 403, "REAUTHENTICATION_REQUIRED", "Recent strong authentication is required before this destination can be disclosed.");
    return;
  }
  if (decision.decision === Decision.ADDITIONAL_APPROVAL_REQUIRED) {
    problem(response, 403, "FORBIDDEN", "Additional approval is required for this operation.");
    return;
  }
  if (decision.conceal) {
    problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
    return;
  }
  problem(response, 403, "FORBIDDEN", "This operation is not permitted.");
}

async function seedReservation(provider, service, now) {
  if (
    provider.capabilities.referralMode === "EXTERNAL_MANUAL"
    || !provider.capabilities.holdSupported
    || provider.capabilities.reservationMode === "EXTERNAL_MANUAL"
  ) {
    throw new UnsupportedProviderCapabilityError("Synthetic destination profile must support transactional placement seeding.");
  }

  const referral = await provider.submitReferral(service.serviceId, now);
  const accepted = await provider.acceptReferral(referral.referralId, now);
  const availability = await provider.getAvailability(service.serviceId, now);
  const hold = await provider.requestHold({
    referralId: accepted.referralId,
    serviceId: service.serviceId,
    expectedSourceRevision: availability.sourceRevision,
    idempotencyKey: `destination-seed-hold-${service.serviceId}`,
    requestedSeconds: 300,
    now,
  });
  return provider.reserve({
    referralId: accepted.referralId,
    holdId: hold.holdId,
    idempotencyKey: `destination-seed-reservation-${service.serviceId}`,
    now,
    // Seeded placement still proves that reservation creation itself does not
    // disclose a destination. The dedicated read below is the only disclosure.
    canDiscloseDestination: false,
  });
}

function providerProblem(response, error) {
  if (error instanceof ProviderUnavailableError) {
    problem(response, 503, "PROVIDER_UNAVAILABLE", "The authoritative provider source is unavailable.");
    return true;
  }
  if (error instanceof CapacityConflictError) {
    problem(response, 409, "CAPACITY_CONFLICT", "Synthetic placement seeding could not obtain current provider capacity.");
    return true;
  }
  if (error instanceof UnsupportedProviderCapabilityError) {
    problem(response, 409, "UNSUPPORTED_PROVIDER_CAPABILITY", "This synthetic profile cannot seed the requested placement.");
    return true;
  }
  return false;
}

/**
 * Synthetic protected-destination transport.
 *
 * Identity and placement relationship/state are supplied by trusted functions
 * and are re-read for every request. No browser/request field can grant itself
 * a role, organisation, entitlement, relationship, disclosure class or step-up.
 */
export async function createSyntheticDestinationApi({
  principalSource,
  stateSource,
  auditSink,
  profile = "liveApi",
  clock = () => SYNTHETIC_PROFILE_NOW,
} = {}) {
  if (typeof principalSource !== "function") {
    throw new TypeError("Synthetic destination API requires a server-side principalSource.");
  }
  if (stateSource !== undefined && typeof stateSource !== "function") {
    throw new TypeError("Synthetic destination API stateSource must be a function when supplied.");
  }
  if (typeof auditSink !== "function") {
    throw new TypeError("Synthetic destination API requires an injected audit sink.");
  }

  const service = resolveProfile(profile);
  if (!["PLACEMENT_AUTHORISED", "RESTRICTED", "SEALED"].includes(service.disclosureLevel)) {
    throw new TypeError("Synthetic destination profile must use a protected disclosure class.");
  }

  const providers = createSyntheticProviderProfiles();
  const provider = providers.find((candidate) => candidate.providerId === service.providerId);
  if (!provider) throw new Error("Synthetic destination provider is missing.");

  const seedNow = currentDate(clock);
  const seededReservation = await seedReservation(provider, service, seedNow);
  if ("destination" in seededReservation) {
    throw new Error("Destination seeding must not disclose a destination through reservation creation.");
  }

  const defaultState = Object.freeze({
    authorisedOrganisationIds: Object.freeze(["support-a"]),
    placementState: "CONFIRMED",
    providerDecision: "ACCEPTED",
    programmeId: service.disclosureLevel === "RESTRICTED" ? SPECIALIST_PROGRAMME_ID : undefined,
  });

  function readState() {
    const supplied = stateSource?.() ?? {};
    const authorisedOrganisationIds = supplied.authorisedOrganisationIds ?? defaultState.authorisedOrganisationIds;
    if (!Array.isArray(authorisedOrganisationIds) || authorisedOrganisationIds.some((id) => !boundedString(id))) {
      throw new TypeError("Synthetic destination state contains invalid authorisedOrganisationIds.");
    }
    return Object.freeze({
      authorisedOrganisationIds: Object.freeze([...authorisedOrganisationIds]),
      placementState: supplied.placementState ?? defaultState.placementState,
      providerDecision: supplied.providerDecision ?? defaultState.providerDecision,
      programmeId: supplied.programmeId ?? defaultState.programmeId,
    });
  }

  const fixture = Object.freeze({
    profile,
    providerId: provider.providerId,
    serviceId: service.serviceId,
    reservationId: seededReservation.reservationId,
    disclosureLevel: service.disclosureLevel,
    programmeId: defaultState.programmeId,
  });

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://synthetic.invalid");
      const match = /^\/v1\/placements\/([^/]+)\/destination$/.exec(url.pathname);
      if (!match) {
        problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
        return;
      }
      if (request.method !== "GET") {
        problem(response, 405, "VALIDATION_FAILED", "HTTP method not allowed for this protected operation.", { allow: "GET" });
        return;
      }
      if (url.search !== "") {
        problem(response, 400, "VALIDATION_FAILED", "Destination query parameters are not accepted.");
        return;
      }

      let reservationId;
      try {
        reservationId = decodeURIComponent(match[1]);
      } catch {
        problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
        return;
      }
      if (!boundedString(reservationId) || reservationId !== fixture.reservationId) {
        problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
        return;
      }

      let reservation;
      try {
        reservation = provider.lookupReservation(reservationId);
      } catch (error) {
        if (providerProblem(response, error)) return;
        throw error;
      }
      if (!reservation) {
        problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
        return;
      }

      const state = readState();
      const principal = principalSource();
      const resource = Object.freeze({
        id: reservation.reservationId,
        providerOrganisationId: provider.providerId,
        authorisedOrganisationIds: state.authorisedOrganisationIds,
        disclosure: service.disclosureLevel,
        placementState: state.placementState,
        providerDecision: state.providerDecision,
        ...(state.programmeId ? { programmeId: state.programmeId } : {}),
      });
      const now = currentDate(clock);
      const decision = authorise({
        principal,
        action: Action.READ_DESTINATION,
        resource,
        now: now.getTime(),
      });
      if (decision.decision !== Decision.ALLOW) {
        destinationPolicyProblem(response, decision);
        return;
      }
      if (!decision.audit) {
        throw new Error("Protected destination allow decision must require audit.");
      }

      let destination;
      try {
        destination = provider.lookupDestinationForReservation(reservationId);
      } catch (error) {
        if (providerProblem(response, error)) return;
        throw error;
      }
      if (!destination) {
        problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
        return;
      }

      await auditSink(Object.freeze({
        event: "DESTINATION_READ",
        action: Action.READ_DESTINATION,
        principalId: principal?.id ?? "unknown",
        organisationId: principal?.organisation?.id ?? null,
        providerId: provider.providerId,
        serviceId: service.serviceId,
        reservationId: reservation.reservationId,
        disclosure: service.disclosureLevel,
        policyReason: decision.reason,
        at: now.toISOString(),
      }));

      sendJson(response, 200, Object.freeze({
        reservationId: reservation.reservationId,
        destination,
      }));
    } catch {
      problem(response, 500, "PROVIDER_UNAVAILABLE", "Synthetic destination service could not complete the request.");
    }
  });

  server.requestTimeout = REQUEST_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.maxHeadersCount = MAX_HEADERS_COUNT;
  server.maxRequestsPerSocket = MAX_REQUESTS_PER_SOCKET;

  return Object.freeze({ server, fixture });
}

export const SYNTHETIC_DESTINATION_SPECIALIST_PROGRAMME_ID = SPECIALIST_PROGRAMME_ID;
