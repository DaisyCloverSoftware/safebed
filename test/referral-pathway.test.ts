import test from "node:test";
import assert from "node:assert/strict";
import { SafeBedSandbox } from "../src/safebed.ts";
import {
  createSyntheticProviderProfiles,
  syntheticProfileServices,
  SYNTHETIC_PROFILE_NOW,
} from "../src/synthetic-fixtures.ts";

const publicNeedWithoutProfessionalReferral = {
  requiredFor: "2026-08-19",
  householdSize: 1,
  childCount: 0,
  wheelchairAccessRequired: false,
  assistanceAnimal: false,
  otherPets: false,
  professionalReferralAvailable: false,
} as const;

test("professional-referral requirement remains a discoverable pathway rather than a hard suitability rejection", async () => {
  const provider = createSyntheticProviderProfiles().find(
    (candidate) => candidate.providerId === syntheticProfileServices.restrictedSpecialist.providerId,
  )!;
  const result = await new SafeBedSandbox([provider]).search(
    publicNeedWithoutProfessionalReferral,
    SYNTHETIC_PROFILE_NOW,
  );

  assert.equal(result.outcome, "CANDIDATES_FOUND");
  assert.equal(result.matches[0]?.matchState, "POSSIBLY_SUITABLE");
  assert.equal(result.matches[0]?.availability.state, "LIMITED");
  assert.ok(
    result.matches[0]?.reasons.some((reason) => reason.code === "PROFESSIONAL_REFERRAL_REQUIRED"),
  );
});
