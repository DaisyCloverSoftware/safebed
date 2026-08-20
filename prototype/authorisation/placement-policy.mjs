import { Action, Decision, authorise } from "./policy.mjs";

/**
 * Placement-transaction policy composition.
 *
 * Normal hold/reservation/arrival authority is evaluated by the canonical
 * deny-by-default policy. The only additional case handled here is an exact
 * idempotent reservation replay after the original hold has already been
 * consumed.
 *
 * `resource.idempotentReplay` and reservation state are trusted only as
 * server-authoritative resource state. Request/browser supplied values belong
 * in context.clientSupplied and are intentionally ignored by this contract.
 */
export function authorisePlacementTransaction(input) {
  const base = authorise(input);

  if (
    input?.action !== Action.CREATE_RESERVATION
    || base.decision !== Decision.DENY
    || base.reason !== "reservation_requires_active_hold"
  ) {
    return base;
  }

  const resource = input?.resource ?? {};
  const existingReservation =
    resource.reservationState === "CONFIRMED"
    || resource.reservationState === "ARRIVED";
  const replayIsProviderProven =
    resource.idempotentReplay === true
    && resource.referralState === "ACCEPTED"
    && resource.providerDecision === "ACCEPTED"
    && existingReservation;

  if (!replayIsProviderProven) return base;

  return Object.freeze({
    decision: Decision.ALLOW,
    reason: "reservation_idempotent_replay",
    audit: true,
    conceal: false,
  });
}
