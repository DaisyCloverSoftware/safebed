import { createServer } from "node:http";

import { Action, Decision, Disclosure, authorise } from "../authorisation/policy.mjs";
import {
  createSyntheticProviderProfiles,
  SYNTHETIC_PROFILE_NOW,
  syntheticProfileServices,
} from "../../src/synthetic-fixtures.ts";
import {
  ProviderUnavailableError,
  UnsupportedProviderCapabilityError,
} from "../../src/synthetic-provider.ts";

const MAX_JSON_BODY_BYTES = 4 * 1024;
const REQUEST_TIMEOUT_MS = 10_000;
const HEADERS_TIMEOUT_MS = 5_000;
const KEEP_ALIVE_TIMEOUT_MS = 5_000;
const MAX_HEADERS_COUNT = 64;
const MAX_REQUESTS_PER_SOCKET = 100;
const REFERRAL_FIELDS = new Set(["providerId", "serviceId"]);

// Synthetic policy metadata only. Real provider/referrer policy must come from
// verified provider configuration rather than being inferred from a UI role.
const permittedReferrersByService = new Map([
  [syntheticProfileServices.liveApi.serviceId, ["support-a", "support-b"]],
  [syntheticProfileServices.readOnlyFeed.serviceId, ["support-a"]],
  [syntheticProfileServices.portal.serviceId, ["support-a"]],
  [syntheticProfileServices.manualConfirmation.serviceId, ["support-a"]],
  [syntheticProfileServices.restrictedSpecialist.serviceId, ["specialist-support-a"]],
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

function validateReferralInput(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  if (keys.length !== 2 || keys.some((key) => !REFERRAL_FIELDS.has(key))) {
    return false;
  }
  return typeof value.providerId === "string"
    && value.providerId.length >= 1
    && value.providerId.length <= 200
    && typeof value.serviceId === "string"
    && value.serviceId.length >= 1
    && value.serviceId.length <= 200;
}

function providerAndService(providers, providerId, serviceId) {
  const provider = providers.find((candidate) => candidate.providerId === providerId);
  if (!provider) return undefined;
  const service = provider.listServices().find((candidate) => candidate.serviceId === serviceId);
  if (!service) return undefined;
  return { provider, service };
}

function referralPolicyResource(service) {
  return Object.freeze({
    id: service.serviceId,
    providerOrganisationId: service.providerId,
    disclosure: service.disclosureLevel === "PUBLIC" ? Disclosure.PUBLIC : Disclosure.PLACEMENT_AUTHORISED,
    permittedReferrerOrganisationIds: permittedReferrersByService.get(service.serviceId) ?? [],
  });
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

/**
 * Synthetic protected referral transport.
 *
 * `principal` and `auditSink` are injected by trusted server construction in
 * this harness. Request headers/cookies/query/body never select authority.
 */
export function createSyntheticProtectedReferralApi({
  principal,
  auditSink,
  now = SYNTHETIC_PROFILE_NOW,
} = {}) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError("Protected referral API requires a valid fixed Date.");
  }
  if (typeof auditSink !== "function") {
    throw new TypeError("Protected referral API requires an injected audit sink.");
  }

  const providers = createSyntheticProviderProfiles();

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://synthetic.invalid");
      if (url.pathname !== "/v1/referrals") {
        problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
        return;
      }

      if (request.method !== "POST") {
        problem(
          response,
          405,
          "VALIDATION_FAILED",
          "HTTP method not allowed for this protected operation.",
          { allow: "POST" },
        );
        return;
      }

      if (url.search !== "") {
        problem(response, 400, "VALIDATION_FAILED", "Referral query parameters are not accepted.");
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
      if (!validateReferralInput(input)) {
        problem(response, 400, "VALIDATION_FAILED", "Referral request must contain only providerId and serviceId.");
        return;
      }

      const target = providerAndService(providers, input.providerId, input.serviceId);
      if (!target) {
        problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
        return;
      }

      const policyResource = referralPolicyResource(target.service);
      const decision = authorise({
        principal,
        action: Action.CREATE_REFERRAL,
        resource: policyResource,
        now: now.getTime(),
      });

      if (decision.decision !== Decision.ALLOW) {
        policyProblem(response, decision);
        return;
      }
      if (!decision.audit) {
        throw new Error("Protected referral allow decision must require audit.");
      }

      let referral;
      try {
        referral = await target.provider.submitReferral(target.service.serviceId, now);
      } catch (error) {
        if (error instanceof UnsupportedProviderCapabilityError) {
          problem(
            response,
            409,
            "UNSUPPORTED_PROVIDER_CAPABILITY",
            "This provider does not support SafeBed referral transactions.",
          );
          return;
        }
        if (error instanceof ProviderUnavailableError) {
          problem(response, 503, "PROVIDER_UNAVAILABLE", "The authoritative provider source is unavailable.");
          return;
        }
        throw error;
      }

      // Minimal audit event: identifiers/action/result only, no referral narrative
      // or destination data. A production implementation needs durable atomicity.
      await auditSink(Object.freeze({
        event: "REFERRAL_CREATED",
        action: Action.CREATE_REFERRAL,
        principalId: principal?.id ?? "unknown",
        organisationId: principal?.organisation?.id ?? null,
        providerId: target.provider.providerId,
        serviceId: target.service.serviceId,
        referralId: referral.referralId,
        policyReason: decision.reason,
        at: now.toISOString(),
      }));

      sendJson(response, 201, referral);
    } catch {
      problem(response, 500, "PROVIDER_UNAVAILABLE", "Synthetic protected referral service could not complete the request.");
    }
  });

  server.requestTimeout = REQUEST_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.maxHeadersCount = MAX_HEADERS_COUNT;
  server.maxRequestsPerSocket = MAX_REQUESTS_PER_SOCKET;

  return server;
}
