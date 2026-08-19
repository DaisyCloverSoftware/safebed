export const syntheticServices = [
  {
    id: "live-api",
    name: "Synthetic Riverside Night Shelter",
    area: "Central Exampletown",
    distanceMiles: 0.8,
    disclosure: "PUBLIC",
    availability: { state: "LIMITED", available: 1, freshnessMinutes: 6 },
    capabilities: {
      integrationMode: "LIVE_API",
      referralMode: "SAFEBED_TRANSACTION",
      holdSupported: true,
      reservationMode: "SAFEBED_TRANSACTION",
    },
    rules: { wheelchairAccessible: true, petsAllowed: false, professionalReferralRequired: false },
    checkIn: "23:30",
    publicContact: "Demo contact route",
    map: { kind: "point", x: 38, y: 42 },
    destination: { label: "1 Synthetic Lane, Exampletown" },
  },
  {
    id: "read-only",
    name: "Synthetic Community Hostel",
    area: "North Exampletown",
    distanceMiles: 1.4,
    disclosure: "PUBLIC",
    availability: { state: "AVAILABLE", available: 2, freshnessMinutes: 11 },
    capabilities: {
      integrationMode: "READ_ONLY_FEED",
      referralMode: "EXTERNAL_MANUAL",
      holdSupported: false,
      reservationMode: "EXTERNAL_MANUAL",
    },
    rules: { wheelchairAccessible: true, petsAllowed: false, professionalReferralRequired: false },
    checkIn: "23:00",
    publicContact: "Demo telephone referral route",
    map: { kind: "point", x: 64, y: 28 },
    destination: { label: "2 Synthetic Lane, Exampletown" },
  },
  {
    id: "portal",
    name: "Synthetic Hope House",
    area: "West Exampletown",
    distanceMiles: 1.7,
    disclosure: "PUBLIC",
    availability: { state: "AVAILABLE", available: 3, freshnessMinutes: 4 },
    capabilities: {
      integrationMode: "SAFEBED_PORTAL",
      referralMode: "SAFEBED_PORTAL",
      holdSupported: true,
      reservationMode: "SAFEBED_PORTAL",
    },
    rules: { wheelchairAccessible: false, petsAllowed: true, professionalReferralRequired: false },
    checkIn: "00:00",
    publicContact: "SafeBed portal demo route",
    map: { kind: "point", x: 25, y: 61 },
    destination: { label: "3 Synthetic Lane, Exampletown" },
  },
  {
    id: "manual-confirm",
    name: "Synthetic Overnight Centre",
    area: "South Exampletown",
    distanceMiles: 2.1,
    disclosure: "PUBLIC",
    availability: { state: "MANUAL_CONFIRMATION_REQUIRED", available: 1, freshnessMinutes: 18 },
    capabilities: {
      integrationMode: "MANUAL_CONFIRMATION",
      referralMode: "EXTERNAL_MANUAL",
      holdSupported: false,
      reservationMode: "EXTERNAL_MANUAL",
    },
    rules: { wheelchairAccessible: true, petsAllowed: false, professionalReferralRequired: false },
    checkIn: "22:45",
    publicContact: "Demo call-to-confirm route",
    map: { kind: "point", x: 55, y: 72 },
    destination: { label: "4 Synthetic Lane, Exampletown" },
  },
  {
    id: "restricted",
    name: "Confidential specialist accommodation",
    area: "Exampletown area",
    distanceMiles: null,
    disclosure: "RESTRICTED",
    availability: { state: "LIMITED", available: 1, freshnessMinutes: 8 },
    capabilities: {
      integrationMode: "RESTRICTED_SPECIALIST",
      referralMode: "SAFEBED_TRANSACTION",
      holdSupported: true,
      reservationMode: "SAFEBED_TRANSACTION",
    },
    rules: { wheelchairAccessible: true, petsAllowed: false, professionalReferralRequired: true },
    checkIn: "Provider confirms after referral",
    publicContact: null,
    map: { kind: "region", x: 76, y: 61, radius: 12 },
    destination: null,
  },
];

export function availabilityLabel(service) {
  const { state, freshnessMinutes } = service.availability;
  if (state === "MANUAL_CONFIRMATION_REQUIRED") return "Call to confirm availability";
  if (state === "STALE" || state === "UNKNOWN") return "Availability cannot currently be confirmed";
  if (state === "FULL") return "No current capacity reported";
  const unit = service.availability.available === 1 ? "place" : "places";
  return `${service.availability.available} ${unit} reported — confirmed ${freshnessMinutes} min ago`;
}

export function suitability(service, need) {
  const reasons = [];
  let hardMismatch = false;

  if (need.wheelchairAccessRequired && service.rules.wheelchairAccessible !== true) {
    reasons.push("Wheelchair access is not confirmed for this service");
    hardMismatch = true;
  }
  if (need.hasPet && service.rules.petsAllowed !== true) {
    reasons.push("The service's published pet policy does not match this need");
    hardMismatch = true;
  }
  if (service.rules.professionalReferralRequired && !need.professionalReferralAvailable) {
    reasons.push("A verified professional referral is required");
  }

  return {
    state: hardMismatch ? "NOT_MATCHED" : reasons.length ? "POSSIBLY_SUITABLE" : "SUITABLE",
    reasons,
  };
}

export function nextAction(service, role = "PUBLIC") {
  if (service.availability.state === "MANUAL_CONFIRMATION_REQUIRED") {
    return { code: "CALL_TO_CONFIRM", label: "Call to confirm" };
  }
  if (service.availability.state === "STALE" || service.availability.state === "UNKNOWN") {
    return { code: "CHECK_OTHER_HELP", label: "See other help" };
  }
  if (service.disclosure === "RESTRICTED" && role === "PUBLIC") {
    return { code: "GET_PROFESSIONAL_HELP", label: "Get referral help" };
  }
  if (service.capabilities.referralMode === "EXTERNAL_MANUAL") {
    return { code: "CONTACT_PROVIDER", label: "Contact service" };
  }
  if (service.disclosure === "RESTRICTED") {
    return { code: "START_SPECIALIST_REFERRAL", label: "Start specialist referral" };
  }
  return { code: "START_REFERRAL", label: "Start referral" };
}

export function visibleDestination(service, role, placementState) {
  if (placementState !== "CONFIRMED") return null;
  if (service.disclosure === "SEALED") return null;
  if (service.disclosure === "RESTRICTED") {
    return role === "SPECIALIST_AUTHORISED" ? service.destination : null;
  }
  if (service.disclosure === "PLACEMENT_AUTHORISED") {
    return role === "PUBLIC" ? null : service.destination;
  }
  return service.destination;
}

export function searchSyntheticServices(need) {
  return syntheticServices
    .map((service) => ({ service, match: suitability(service, need) }))
    .sort((left, right) => {
      if (left.match.state !== right.match.state) {
        const rank = { SUITABLE: 0, POSSIBLY_SUITABLE: 1, NOT_MATCHED: 2 };
        return rank[left.match.state] - rank[right.match.state];
      }
      const leftConfirmed = ["AVAILABLE", "LIMITED"].includes(left.service.availability.state) ? 0 : 1;
      const rightConfirmed = ["AVAILABLE", "LIMITED"].includes(right.service.availability.state) ? 0 : 1;
      if (leftConfirmed !== rightConfirmed) return leftConfirmed - rightConfirmed;
      return (left.service.distanceMiles ?? 999) - (right.service.distanceMiles ?? 999);
    });
}
