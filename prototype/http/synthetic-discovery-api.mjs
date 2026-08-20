import { createServer } from "node:http";

import { SafeBedSandbox } from "../../src/safebed.ts";
import {
  createSyntheticProviderProfiles,
  SYNTHETIC_PROFILE_NOW,
} from "../../src/synthetic-fixtures.ts";

const MAX_JSON_BODY_BYTES = 16 * 1024;
const MAX_SERVICE_ID_LENGTH = 200;
const REQUEST_TIMEOUT_MS = 10_000;
const HEADERS_TIMEOUT_MS = 5_000;
const KEEP_ALIVE_TIMEOUT_MS = 5_000;
const MAX_HEADERS_COUNT = 64;
const MAX_REQUESTS_PER_SOCKET = 100;

const PLACEMENT_NEED_FIELDS = new Set([
  "requiredFor",
  "householdSize",
  "childCount",
  "wheelchairAccessRequired",
  "assistanceAnimal",
  "otherPets",
  "professionalReferralAvailable",
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

function methodNotAllowed(response, allow) {
  problem(
    response,
    405,
    "VALIDATION_FAILED",
    "HTTP method not allowed for this public discovery operation.",
    { allow },
  );
}

function isJsonMediaType(value) {
  if (typeof value !== "string") return false;
  const mediaType = value.split(";", 1)[0].trim().toLowerCase();
  return mediaType === "application/json"
    || (mediaType.startsWith("application/") && mediaType.endsWith("+json"));
}

function hasOversizedDeclaredBody(request) {
  const raw = request.headers["content-length"];
  if (raw === undefined) return false;
  const value = Number(raw);
  return !Number.isSafeInteger(value) || value < 0 || value > MAX_JSON_BODY_BYTES;
}

async function readJson(request) {
  if (hasOversizedDeclaredBody(request)) {
    throw new Error("REQUEST_TOO_LARGE");
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_JSON_BODY_BYTES) {
      throw new Error("REQUEST_TOO_LARGE");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) throw new Error("EMPTY_JSON_BODY");

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function validatePlacementNeed(value) {
  if (!isPlainObject(value)) return "Request body must be a JSON object.";

  for (const key of Object.keys(value)) {
    if (!PLACEMENT_NEED_FIELDS.has(key)) {
      return `Unknown placement-need field: ${key}`;
    }
  }

  if (!isValidDateOnly(value.requiredFor)) {
    return "requiredFor must be a valid YYYY-MM-DD date.";
  }

  if (!Number.isInteger(value.householdSize) || value.householdSize < 1 || value.householdSize > 50) {
    return "householdSize must be an integer between 1 and 50.";
  }

  if (
    value.childCount !== undefined
    && (!Number.isInteger(value.childCount) || value.childCount < 0 || value.childCount > 50)
  ) {
    return "childCount must be an integer between 0 and 50 when supplied.";
  }

  for (const field of [
    "wheelchairAccessRequired",
    "assistanceAnimal",
    "otherPets",
    "professionalReferralAvailable",
  ]) {
    if (value[field] !== undefined && typeof value[field] !== "boolean") {
      return `${field} must be boolean when supplied.`;
    }
  }

  return undefined;
}

function publicServices(sandbox, area) {
  const services = sandbox.listPublicServices();
  if (!area) return services;
  const needle = area.toLocaleLowerCase("en-GB");
  return services.filter(({ service }) =>
    service.publicAreaLabel.toLocaleLowerCase("en-GB").includes(needle),
  );
}

function hasOnlyAreaQuery(url) {
  return [...url.searchParams.keys()].every((key) => key === "area");
}

export function createSyntheticDiscoveryApi({ now = SYNTHETIC_PROFILE_NOW } = {}) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError("Synthetic discovery API requires a valid fixed Date.");
  }

  const sandbox = new SafeBedSandbox(createSyntheticProviderProfiles());

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://synthetic.invalid");

      if (url.pathname === "/v1/services/search") {
        if (request.method !== "GET") {
          methodNotAllowed(response, "GET");
          return;
        }

        const areas = url.searchParams.getAll("area");
        if (
          !hasOnlyAreaQuery(url)
          || areas.length > 1
          || (areas[0]?.length ?? 0) > 200
        ) {
          problem(response, 400, "VALIDATION_FAILED", "Invalid public-safe area query.");
          return;
        }

        sendJson(response, 200, { services: publicServices(sandbox, areas[0]?.trim()) });
        return;
      }

      if (url.pathname === "/v1/matches") {
        if (request.method !== "POST") {
          methodNotAllowed(response, "POST");
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

        const validationError = validatePlacementNeed(input);
        if (validationError) {
          problem(response, 400, "VALIDATION_FAILED", validationError);
          return;
        }

        sendJson(response, 200, await sandbox.search(input, now));
        return;
      }

      const availabilityMatch = /^\/v1\/services\/([^/]+)\/availability$/.exec(url.pathname);
      if (availabilityMatch) {
        if (request.method !== "GET") {
          methodNotAllowed(response, "GET");
          return;
        }

        let serviceId;
        try {
          serviceId = decodeURIComponent(availabilityMatch[1]);
        } catch {
          problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
          return;
        }

        if (serviceId.length < 1 || serviceId.length > MAX_SERVICE_ID_LENGTH) {
          problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
          return;
        }

        try {
          sendJson(response, 200, await sandbox.getAvailability(serviceId, now));
        } catch (error) {
          if (error instanceof Error && error.message.startsWith("Unknown service:")) {
            problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
            return;
          }
          throw error;
        }
        return;
      }

      // Transaction routes intentionally fall through here. Do not advertise
      // methods or auth semantics for privileged endpoints not yet exposed.
      problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
    } catch {
      problem(response, 500, "PROVIDER_UNAVAILABLE", "Synthetic discovery service could not complete the request.");
    }
  });

  server.requestTimeout = REQUEST_TIMEOUT_MS;
  server.headersTimeout = HEADERS_TIMEOUT_MS;
  server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
  server.maxHeadersCount = MAX_HEADERS_COUNT;
  server.maxRequestsPerSocket = MAX_REQUESTS_PER_SOCKET;

  return server;
}
