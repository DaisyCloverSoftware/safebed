import { createServer } from "node:http";

import { SafeBedSandbox } from "../../src/safebed.ts";
import {
  createSyntheticProviderProfiles,
  SYNTHETIC_PROFILE_NOW,
} from "../../src/synthetic-fixtures.ts";

const MAX_JSON_BODY_BYTES = 16 * 1024;
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
  };
}

function sendJson(response, status, value) {
  const body = `${JSON.stringify(value)}\n`;
  response.writeHead(status, {
    ...responseHeaders(),
    "content-length": Buffer.byteLength(body),
  });
  response.end(body);
}

function problem(response, status, code, message) {
  sendJson(response, status, { code, message });
}

async function readJson(request) {
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

export function createSyntheticDiscoveryApi({ now = SYNTHETIC_PROFILE_NOW } = {}) {
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new TypeError("Synthetic discovery API requires a valid fixed Date.");
  }

  const sandbox = new SafeBedSandbox(createSyntheticProviderProfiles());

  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://synthetic.invalid");

      if (request.method === "GET" && url.pathname === "/v1/services/search") {
        const areas = url.searchParams.getAll("area");
        if (areas.length > 1 || (areas[0]?.length ?? 0) > 200) {
          problem(response, 400, "VALIDATION_FAILED", "Invalid public-safe area query.");
          return;
        }

        sendJson(response, 200, { services: publicServices(sandbox, areas[0]?.trim()) });
        return;
      }

      if (request.method === "POST" && url.pathname === "/v1/matches") {
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

      if (request.method === "GET") {
        const match = /^\/v1\/services\/([^/]+)\/availability$/.exec(url.pathname);
        if (match) {
          let serviceId;
          try {
            serviceId = decodeURIComponent(match[1]);
          } catch {
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
      }

      problem(response, 404, "NOT_FOUND", "Resource not found or intentionally not disclosed.");
    } catch {
      problem(response, 500, "PROVIDER_UNAVAILABLE", "Synthetic discovery service could not complete the request.");
    }
  });
}
