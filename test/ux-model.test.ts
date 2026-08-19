import test from "node:test";
import assert from "node:assert/strict";
import {
  nextAction,
  searchSyntheticServices,
  syntheticServices,
  visibleDestination,
} from "../prototype/ux/model.js";

function byId(id) {
  return syntheticServices.find((service) => service.id === id);
}

test("read-only availability produces a contact action rather than fake booking controls", () => {
  const service = byId("read-only");
  assert.ok(service);
  assert.equal(nextAction(service, "VERIFIED_PROFESSIONAL").code, "CONTACT_PROVIDER");
  assert.equal(service.capabilities.holdSupported, false);
  assert.equal(service.capabilities.reservationMode, "EXTERNAL_MANUAL");
});

test("manual-confirmation availability requires confirmation rather than a placement action", () => {
  const service = byId("manual-confirm");
  assert.ok(service);
  assert.equal(nextAction(service, "VERIFIED_PROFESSIONAL").code, "CALL_TO_CONFIRM");
});

test("restricted specialist service is discoverable to public flow without an exact destination", () => {
  const service = byId("restricted");
  assert.ok(service);
  assert.equal(service.disclosure, "RESTRICTED");
  assert.equal(service.destination, null);
  assert.equal(service.map.kind, "region");
  assert.equal(nextAction(service, "PUBLIC").code, "GET_PROFESSIONAL_HELP");
  assert.equal(visibleDestination(service, "VERIFIED_PROFESSIONAL", "CONFIRMED"), null);
});

test("confirmed public synthetic placement can expose its synthetic destination after the correct state", () => {
  const service = byId("live-api");
  assert.ok(service);
  assert.equal(visibleDestination(service, "PUBLIC", "PENDING"), null);
  assert.deepEqual(visibleDestination(service, "PUBLIC", "CONFIRMED"), {
    label: "1 Synthetic Lane, Exampletown",
  });
});

test("a search with incompatible accessibility and pet requirements can produce no suitable services", () => {
  const results = searchSyntheticServices({
    wheelchairAccessRequired: true,
    hasPet: true,
    professionalReferralAvailable: true,
  });
  assert.equal(results.filter(({ match }) => match.state === "SUITABLE").length, 0);
});
