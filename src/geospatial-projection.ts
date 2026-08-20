import type { DisclosureLevel, ProviderDestination } from "./model.ts";

export type PublicMapProjection =
  | {
      readonly kind: "PUBLIC_POINT";
      readonly latitude: number;
      readonly longitude: number;
      readonly label: string;
    }
  | {
      readonly kind: "SAFE_AREA";
      readonly areaId: string;
      readonly label: string;
    }
  | {
      readonly kind: "NO_GEOMETRY";
      readonly label: string;
    };

export type ExternalRoutingPolicy =
  | "EXTERNAL_ALLOWED"
  | "PROVIDER_CONTROLLED_ONLY"
  | "NO_CLIENT_ROUTE";

export type AuthorisedRoutingMode =
  | "EXTERNAL_ALLOWED"
  | "PROVIDER_CONTROLLED"
  | "NONE";

export interface InternalServiceLocation {
  readonly serviceId: string;
  readonly disclosureLevel: DisclosureLevel;
  readonly publicAreaLabel: string;
  readonly exactDestination?: ProviderDestination;
  readonly safePublicProjection?: PublicMapProjection;
  readonly externalRoutingPolicy: ExternalRoutingPolicy;
}

export interface SearchOrigin {
  readonly latitude: number;
  readonly longitude: number;
}

export class UnsafePublicProjectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafePublicProjectionError";
  }
}

function cloneProjection(projection: PublicMapProjection): PublicMapProjection {
  if (projection.kind === "PUBLIC_POINT") return { ...projection };
  if (projection.kind === "SAFE_AREA") return { ...projection };
  return { ...projection };
}

/**
 * Derive the only geometry an anonymous/public browser may receive.
 *
 * For non-PUBLIC services an exact point is never accepted as a public
 * projection, even if a caller accidentally supplied one in configuration.
 * Protected services must use an explicitly approved SAFE_AREA or no geometry.
 * SEALED services always project to no geometry through the ordinary client path.
 */
export function projectForPublicMap(location: InternalServiceLocation): PublicMapProjection {
  const projection = location.safePublicProjection;

  if (location.disclosureLevel === "SEALED") {
    return { kind: "NO_GEOMETRY", label: location.publicAreaLabel };
  }

  if (location.disclosureLevel === "PUBLIC") {
    return projection
      ? cloneProjection(projection)
      : { kind: "NO_GEOMETRY", label: location.publicAreaLabel };
  }

  if (!projection) return { kind: "NO_GEOMETRY", label: location.publicAreaLabel };

  if (projection.kind === "PUBLIC_POINT") {
    throw new UnsafePublicProjectionError(
      `Protected service ${location.serviceId} cannot expose PUBLIC_POINT geometry`,
    );
  }

  return cloneProjection(projection);
}

/**
 * Public numeric distance is available only when the browser-safe projection
 * itself is a public point. SafeBed never derives public distance from an
 * internal protected exactDestination.
 */
export function publicDistanceMiles(
  origin: SearchOrigin,
  projection: PublicMapProjection,
): number | undefined {
  if (projection.kind !== "PUBLIC_POINT") return undefined;

  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusMiles = 3958.7613;
  const lat1 = radians(origin.latitude);
  const lat2 = radians(projection.latitude);
  const deltaLat = lat2 - lat1;
  const deltaLon = radians(projection.longitude - origin.longitude);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const distance = 2 * earthRadiusMiles * Math.asin(Math.min(1, Math.sqrt(a)));

  // Public display precision is a product decision; this synthetic helper uses
  // one decimal place and is intentionally unavailable for protected geometry.
  return Math.round(distance * 10) / 10;
}

/**
 * External navigation is a separate disclosure decision after an exact
 * destination has been authorised. SEALED data never enters ordinary client
 * routing, and restricted/provider-controlled policy can forbid third-party
 * navigation even after the human placement is authorised.
 */
export function authorisedRoutingMode(
  location: InternalServiceLocation,
  destinationDisclosureAllowed: boolean,
): AuthorisedRoutingMode {
  if (!destinationDisclosureAllowed || !location.exactDestination) return "NONE";
  if (location.disclosureLevel === "SEALED") return "NONE";

  if (location.externalRoutingPolicy === "EXTERNAL_ALLOWED") return "EXTERNAL_ALLOWED";
  if (location.externalRoutingPolicy === "PROVIDER_CONTROLLED_ONLY") return "PROVIDER_CONTROLLED";
  return "NONE";
}
