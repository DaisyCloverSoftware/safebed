import { createServer } from "node:http";

import { Action, Decision } from "../authorisation/policy.mjs";
import { authorisePlacementTransaction } from "../authorisation/placement-policy.mjs";
import {
  createSyntheticProviderProfiles,
  SYNTHETIC_PROFILE_NOW,
  syntheticProfileServices,
} from "../../src/synthetic-fixtures.ts";
import {
  CapacityConflictError,
  IdempotencyConflictError,
  InvalidProviderTransitionError,
  ProviderUnavailableError,
  UnsupportedProviderCapabilityError,
} from "../../src/synthetic-provider.ts";

const MAX_JSON_BODY_BYTES = 8 * 1024;
const REQUEST_TIMEOUT_MS = 10_000;
const HEADERS_TIMEOUT_MS = 5_000;
const KEEP_ALIVE_TIMEOUT_MS = 5_000;
const MAX_HEADERS_COUNT = 64;
const MAX_REQUESTS_PER_SOCKET = 100;

const HOLD_FIELDS = new Set([
  "providerId",
  "referralId",
  "serviceId",
  "expectedSourceRevision",
  "idempotencyKey",
  "requestedSeconds",
]);
const RESERVATION_FIELDS = new Set([
  "providerId",
  "serviceId",
  "referralId",
  "holdId",
  "idempotencyKey",
]);

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

function isJsonMediaType(value) {
  if (typeof value !== "string") return false;
  const mediaType = value.split(";", 1)[0].trim().toLowerCase();
  return mediaType === "application/json"
    || (mediaType.startsWith("application/") && mediaType.endsWith("+json"));
}

function plainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function boundedString(value, minimum = 1, maximum = 200) {
  return typeof value === "string" && value.length >= minimum && value.length <= maximum;
}

async function readJson(request) {
  const declaredLength = request.headers["content-length"];
  if (declaredLength !== undefined) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0 || length > MAX_JSON_BODY_BYTES) {
      throw new Error("INVALID_BODY");
    }
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_JSON_BODY_BYTES) throw new Error("INVALID_BODY");
    chunks.push(buffer);
  }
  if (chunks.length === 0) throw new Error("INVALID_BODY");

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("INVALID_BODY");
  }
}

function validateExactFields(value, fields) {
  if (!plainObject(value)) return false;
  const keys = Object.keys(value);
  return keys.length === fields.size && keys.every((key) => fields.has(key));
}

function validateHoldInput(value) {
  return validateExactFields(value, HOLD_FIELDS)
    && boundedString(value.providerId)
    && boundedString(value.referralId)
    && boundedString(value.serviceId)
    && boundedString(value.expectedSourceRevision)
    && boundedString(value.idempotencyKey, 8, 200)
    && Number.isInteger(value.requestedSeconds)
    && value.requestedSeconds >= 60
    && value.requestedSeconds <= 1800;
}

function validateReservationInput(value) {
  return validateExactFields(value, RESERVATION_FIELDS)
    && boundedString(value.providerId)
    && boundedString(value.serviceId)
    && boundedString(value.referralId)
    && boundedString(value.holdId)
    && boundedString(value.idempotencyKey, 8, 200);
}

function policyProblem(response, decision) {
  if (decision.conceal) {
    problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
    return;
  }
  if (decision.decision === Decision.REAUTHENTICATION_REQUIRED) {
    problem(response, 403, "FORBIDDEN", "Additional authentication is required for this operation.");
    return;
  }
  if (decision.decision === Decision.ADDITIONAL_APPROVAL_REQUIRED) {
    problem(response, 403, "FORBIDDEN", "Additional approval is required for this operation.");
    return;
  }
  problem(response, 403, "FORBIDDEN", "This operation is not permitted.");
}

function providerProblem(response, error) {
  if (error instanceof IdempotencyConflictError) {
    problem(response, 409, "IDEMPOTENCY_CONFLICT", "The idempotency key is already bound to a different transaction.");
    return true;
  }
  if (error instanceof CapacityConflictError) {
    problem(response, 409, "CAPACITY_CONFLICT", "Current provider capacity or hold state changed before this transaction completed.");
    return true;
  }
  if (error instanceof UnsupportedProviderCapabilityError) {
    problem(response, 409, "UNSUPPORTED_PROVIDER_CAPABILITY", "This provider does not support the requested SafeBed transaction.");
    return true;
  }
  if (error instanceof InvalidProviderTransitionError) {
    problem(response, 409, "INVALID_TRANSITION", "The requested transaction is not valid from the current provider state.");
    return true;
  }
  if (error instanceof ProviderUnavailableError) {
    problem(response, 503, "PROVIDER_UNAVAILABLE", "The authoritative provider source is unavailable.");
    return true;
  }
  return false;
}

function resolveProfile(profile) {
  const service = syntheticProfileServices[profile];
  if (!service) throw new TypeError(`Unknown synthetic placement profile: ${profile}`);
  return service;
}

function currentDate(clock) {
  const value = clock();
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new TypeError("Synthetic placement transaction clock must return a valid Date.");
  }
  return new Date(value.getTime());
}

function referralPolicyState(fixture, provider) {
  return Object.freeze({
    id: fixture.referralId,
    providerOrganisationId: provider.providerId,
    authorisedOrganisationIds: fixture.authorisedOrganisationIds,
    referralState: fixture.referralStatus,
    providerDecision: fixture.referralStatus === "ACCEPTED" ? "ACCEPTED" : "PENDING",
  });
}

function holdPolicyState(fixture, provider, hold, replayReservation) {
  return Object.freeze({
    ...referralPolicyState(fixture, provider),
    id: hold.holdId,
    holdState: hold.status,
    ...(replayReservation ? {
      idempotentReplay: true,
      reservationState: replayReservation.status,
    } : {}),
  });
}

function reservationPolicyState(fixture, provider, reservation) {
  return Object.freeze({
    ...referralPolicyState(fixture, provider),
    id: reservation.reservationId,
    reservationState: reservation.status,
  });
}

async function audit(auditSink, fixture, provider, principal, decision, event, identifiers, now) {
  if (!decision.audit) throw new Error("Protected placement allow decision must require audit.");
  await auditSink(Object.freeze({
    event,
    action: identifiers.action,
    principalId: principal?.id ?? "unknown",
    organisationId: principal?.organisation?.id ?? null,
    providerId: provider.providerId,
    serviceId: fixture.serviceId,
    referralId: fixture.referralId,
    ...(identifiers.holdId ? { holdId: identifiers.holdId } : {}),
    ...(identifiers.reservationId ? { reservationId: identifiers.reservationId } : {}),
    policyReason: decision.reason,
    at: now.toISOString(),
  }));
}

/**
 * Synthetic placement transaction transport.
 *
 * The fixture, principal, organisation relationship, clock and audit sink are
 * injected by trusted server/test construction. Request data never chooses
 * authority or protected destination disclosure.
 */
export async function createSyntheticPlacementTransactionApi({
  principal,
  auditSink,
  profile = "liveApi",
  authorisedOrganisationIds = ["support-a"],
  referralStatus = "ACCEPTED",
  clock = () => SYNTHETIC_PROFILE_NOW,
} = {}) {
  if (typeof auditSink !== "function") {
    throw new TypeError("Synthetic placement transaction API requires an injected audit sink.");
  }
  if (!Array.isArray(authorisedOrganisationIds) || authorisedOrganisationIds.some((id) => !boundedString(id))) {
    throw new TypeError("Synthetic placement transaction API requires bounded authorised organisation IDs.");
  }
  if (referralStatus !== "ACCEPTED" && referralStatus !== "SUBMITTED") {
    throw new TypeError("Synthetic placement fixture referralStatus must be ACCEPTED or SUBMITTED.");
  }

  const service = resolveProfile(profile);
  const providers = createSyntheticProviderProfiles();
  const provider = providers.find((candidate) => candidate.providerId === service.providerId);
  if (!provider) throw new Error("Synthetic placement fixture provider is missing.");

  const seedNow = currentDate(clock);
  let referral;
  if (provider.capabilities.referralMode === "EXTERNAL_MANUAL") {
    referral = Object.freeze({
      referralId: `synthetic-external-${profile}-referral`,
      serviceId: service.serviceId,
      status: referralStatus,
      createdAt: seedNow.toISOString(),
      updatedAt: seedNow.toISOString(),
    });
  } else {
    referral = await provider.submitReferral(service.serviceId, seedNow);
    if (referralStatus === "ACCEPTED") referral = await provider.acceptReferral(referral.referralId, seedNow);
  }

  const availability = await provider.getAvailability(service.serviceId, seedNow);
  const fixture = Object.freeze({
    profile,
    providerId: provider.providerId,
    serviceId: service.serviceId,
    referralId: referral.referralId,
    referralStatus: referral.status,
    sourceRevision: availability.sourceRevision,
    authorisedOrganisationIds: Object.freeze([...authorisedOrganisationIds]),
  });

  const holds = new Map();
  const reservations = new Map();

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://synthetic.invalid");
      const now = currentDate(clock);

      if (url.pathname === "/v1/holds") {
        if (request.method !== "POST") {
          problem(response, 405, "VALIDATION_FAILED", "HTTP method not allowed for this protected operation.", { allow: "POST" });
          return;
        }
        if (url.search !== "") {
          problem(response, 400, "VALIDATION_FAILED", "Hold query parameters are not accepted.");
          return;
        }
        if (!isJsonMediaType(request.headers["content-type"])) {
          problem(response, 400, "VALIDATION_FAILED", "A JSON request media type is required.");
          return;
        }

        let input;
        try {
          input = await readJson(request);
        } catch {
          problem(response, 400, "VALIDATION_FAILED", "Invalid JSON request body.");
          return;
        }
        if (!validateHoldInput(input)) {
          problem(response, 400, "VALIDATION_FAILED", "Hold request does not match the v0.2 transaction contract.");
          return;
        }
        if (
          input.providerId !== fixture.providerId
          || input.serviceId !== fixture.serviceId
          || input.referralId !== fixture.referralId
        ) {
          problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
          return;
        }

        const decision = authorisePlacementTransaction({
          principal,
          action: Action.REQUEST_HOLD,
          resource: referralPolicyState(fixture, provider),
          now: now.getTime(),
        });
        if (decision.decision !== Decision.ALLOW) {
          policyProblem(response, decision);
          return;
        }

        let hold;
        try {
          hold = await provider.requestHold({
            referralId: input.referralId,
            serviceId: input.serviceId,
            expectedSourceRevision: input.expectedSourceRevision,
            idempotencyKey: input.idempotencyKey,
            requestedSeconds: input.requestedSeconds,
            now,
          });
        } catch (error) {
          if (providerProblem(response, error)) return;
          throw error;
        }

        holds.set(hold.holdId, hold);
        await audit(auditSink, fixture, provider, principal, decision, "HOLD_GRANTED", {
          action: Action.REQUEST_HOLD,
          holdId: hold.holdId,
        }, now);
        sendJson(response, 201, hold);
        return;
      }

      if (url.pathname === "/v1/reservations") {
        if (request.method !== "POST") {
          problem(response, 405, "VALIDATION_FAILED", "HTTP method not allowed for this protected operation.", { allow: "POST" });
          return;
        }
        if (url.search !== "") {
          problem(response, 400, "VALIDATION_FAILED", "Reservation query parameters are not accepted.");
          return;
        }
        if (!isJsonMediaType(request.headers["content-type"])) {
          problem(response, 400, "VALIDATION_FAILED", "A JSON request media type is required.");
          return;
        }

        let input;
        try {
          input = await readJson(request);
        } catch {
          problem(response, 400, "VALIDATION_FAILED", "Invalid JSON request body.");
          return;
        }
        if (!validateReservationInput(input)) {
          problem(response, 400, "VALIDATION_FAILED", "Reservation request does not match the v0.2 transaction contract.");
          return;
        }
        if (
          input.providerId !== fixture.providerId
          || input.serviceId !== fixture.serviceId
          || input.referralId !== fixture.referralId
        ) {
          problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
          return;
        }

        const hold = holds.get(input.holdId);
        if (!hold || hold.referralId !== fixture.referralId || hold.serviceId !== fixture.serviceId) {
          problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
          return;
        }

        // Force the provider to apply authoritative hold-expiry/capacity timing
        // before policy sees the hold object. The stored hold is the same object
        // returned by the synthetic provider and reflects expiry/consumption.
        try {
          await provider.getAvailability(fixture.serviceId, now);
        } catch (error) {
          if (providerProblem(response, error)) return;
          throw error;
        }

        let decision = authorisePlacementTransaction({
          principal,
          action: Action.CREATE_RESERVATION,
          resource: holdPolicyState(fixture, provider, hold),
          now: now.getTime(),
        });

        let replayReservation;
        if (
          decision.decision === Decision.DENY
          && decision.reason === "reservation_requires_active_hold"
        ) {
          try {
            replayReservation = provider.lookupReservationByIdempotency({
              referralId: input.referralId,
              holdId: input.holdId,
              idempotencyKey: input.idempotencyKey,
              canDiscloseDestination: false,
            });
          } catch (error) {
            if (providerProblem(response, error)) return;
            throw error;
          }

          if (replayReservation) {
            decision = authorisePlacementTransaction({
              principal,
              action: Action.CREATE_RESERVATION,
              resource: holdPolicyState(fixture, provider, hold, replayReservation),
              now: now.getTime(),
            });
          }
        }

        if (decision.decision !== Decision.ALLOW) {
          policyProblem(response, decision);
          return;
        }

        let reservation;
        try {
          reservation = await provider.reserve({
            referralId: input.referralId,
            holdId: input.holdId,
            idempotencyKey: input.idempotencyKey,
            now,
            // Placement mutation authority is not destination-disclosure authority.
            canDiscloseDestination: false,
          });
        } catch (error) {
          if (providerProblem(response, error)) return;
          throw error;
        }

        reservations.set(reservation.reservationId, reservation);
        await audit(auditSink, fixture, provider, principal, decision,
          replayReservation ? "RESERVATION_REPLAYED" : "RESERVATION_CONFIRMED", {
            action: Action.CREATE_RESERVATION,
            holdId: input.holdId,
            reservationId: reservation.reservationId,
          }, now);
        sendJson(response, 201, reservation);
        return;
      }

      const arrivalMatch = /^\/v1\/placements\/([^/]+)\/arrival$/.exec(url.pathname);
      if (arrivalMatch) {
        if (request.method !== "POST") {
          problem(response, 405, "VALIDATION_FAILED", "HTTP method not allowed for this protected operation.", { allow: "POST" });
          return;
        }
        if (url.search !== "") {
          problem(response, 400, "VALIDATION_FAILED", "Arrival query parameters are not accepted.");
          return;
        }
        if ((request.headers["content-length"] ?? "0") !== "0") {
          problem(response, 400, "VALIDATION_FAILED", "Arrival confirmation does not accept a request body.");
          return;
        }

        let reservationId;
        try {
          reservationId = decodeURIComponent(arrivalMatch[1]);
        } catch {
          problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
          return;
        }
        if (!boundedString(reservationId, 1, 200)) {
          problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
          return;
        }

        const reservation = reservations.get(reservationId);
        if (!reservation) {
          problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
          return;
        }

        const decision = authorisePlacementTransaction({
          principal,
          action: Action.CONFIRM_ARRIVAL,
          resource: reservationPolicyState(fixture, provider, reservation),
          now: now.getTime(),
        });
        if (decision.decision !== Decision.ALLOW) {
          policyProblem(response, decision);
          return;
        }

        let arrived;
        try {
          arrived = await provider.confirmArrival(reservationId, now);
        } catch (error) {
          if (providerProblem(response, error)) return;
          throw error;
        }

        reservations.set(arrived.reservationId, arrived);
        await audit(auditSink, fixture, provider, principal, decision, "ARRIVAL_CONFIRMED", {
          action: Action.CONFIRM_ARRIVAL,
          reservationId: arrived.reservationId,
        }, now);
        sendJson(response, 200, arrived);
        return;
      }

      problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
    } catch {
      problem(response, 500, "PROVIDER_UNAVAILABLE", "Synthetic placement transaction service could not complete the request.");
    }
  });

  server.requestTimeout = REQUEST_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.maxHeadersCount = MAX_HEADERS_COUNT;
  server.maxRequestsPerSocket = MAX_REQUESTS_PER_SOCKET;

  return Object.freeze({ server, fixture });
}
