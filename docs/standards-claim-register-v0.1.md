# SafeBed ORUK / HSDS Standards Claim Register v0.1

**Status:** public discovery register. Claims below are internal SafeBed interpretations of public standards documentation and remain subject to external review by the relevant standards community.

This register exists to prevent standards language from quietly drifting into stronger claims than SafeBed can support.

## Status values

- `PUBLIC_DOC_VERIFIED` — checked against the cited current public documentation.
- `INTERNAL_MAPPING` — SafeBed design interpretation, not a standards-community endorsement.
- `EXTERNAL_REVIEW_REQUIRED` — should be confirmed with Open Referral UK / relevant maintainers before being treated as stable interoperability guidance.
- `SUPERSEDED` — no longer current; preserve the history rather than silently rewriting it.

## Version baseline

SafeBed's current UK service-data baseline is **Open Referral UK (ORUK) 3.0**.

SafeBed also refers to later international **Human Services Data Specification (HSDS)** concepts where they address a relevant need that the current published ORUK 3.0 profile does not expose.

The most important current example is capacity: international HSDS 3.1 introduced `service_capacity` and `unit` concepts, while the current published ORUK 3.0 profile does not expose `service_capacity` as part of its UK API/profile.

SafeBed must therefore never write as though its capacity/placement layer is already a standard ORUK 3.0 endpoint.

---

# Claims

## STD-001 — ORUK 3.0 is the current SafeBed UK baseline

**Claim:** SafeBed should treat Open Referral UK 3.0 as the current published UK profile/baseline for interoperable service-directory data.

**Status:** `PUBLIC_DOC_VERIFIED` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** service discovery should prefer ORUK-compatible concepts rather than defining a duplicate provider/service/location directory.

**Public sources:**

- https://openreferraluk.org/developers/overview
- https://openreferraluk.org/developers/api
- https://openreferraluk.org/developers/changelog

**External review question:** Is ORUK 3.0 still the correct profile/version for a new UK implementation beginning discovery now, and is there a newer profile transition SafeBed should plan for?

---

## STD-002 — Reuse ORUK service-directory entities

**Claim:** SafeBed should reuse current ORUK concepts for ordinary service-directory information where they fit, including organisation/service/location-related data, service schedules, service areas, contacts, accessibility, application process, eligibility descriptions and taxonomy/attributes.

**Status:** `INTERNAL_MAPPING` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** SafeBed service discovery is a profile/consumer of existing service data where possible, not a new master directory format.

**Public sources:**

- https://openreferraluk.org/developers/schemata
- https://openreferraluk.org/developers/api

**External review questions:**

- Are the specific mappings in `docs/standards-mapping-v0.1.md` appropriate for emergency accommodation?
- Are there UK conventions/taxonomies SafeBed should use for accommodation/service eligibility rather than inventing local fields?

---

## STD-003 — International HSDS 3.1 added capacity concepts

**Claim:** International HSDS 3.1 introduced `service_capacity` and `unit` concepts suitable for describing available/maximum service capacity and its update time/unit.

**Status:** `PUBLIC_DOC_VERIFIED` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** SafeBed should align accommodation capacity semantics with the later HSDS model where practical rather than invent a structurally incompatible count.

**Public sources:**

- https://docs.openreferral.org/en/latest/hsds/changelog.html
- https://docs.openreferral.org/en/latest/hsds/schema_reference.html

**External review questions:**

- Is alignment with HSDS 3.1+ `service_capacity` the right direction for a UK emergency-accommodation profile today?
- Is equivalent capacity work already planned for a future ORUK profile?
- Should SafeBed participate in upstream/profile work instead of maintaining a long-lived local extension?

---

## STD-004 — `service_capacity` is not currently an ORUK 3.0 API claim

**Claim:** SafeBed must not describe `service_capacity` as though it is currently exposed by the published ORUK 3.0 API/profile.

**Status:** `PUBLIC_DOC_VERIFIED` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** public documentation uses language such as:

- **ORUK 3.0-compatible service discovery**;
- **HSDS 3.1+-aligned capacity semantics**;
- **SafeBed placement transaction/disclosure layer**.

It does not call the SafeBed capacity endpoint an ORUK endpoint.

**Public sources:**

- https://openreferraluk.org/developers/api
- https://openreferraluk.org/developers/schemata
- https://docs.openreferral.org/en/latest/hsds/changelog.html

**External review question:** Is this version boundary described accurately enough for implementers?

---

## STD-005 — Provider update time is not the same as SafeBed observation freshness

**Claim:** A source capacity update timestamp and SafeBed's observation/freshness state answer different questions.

**Status:** `INTERNAL_MAPPING` + `EXTERNAL_REVIEW_REQUIRED`

SafeBed currently distinguishes conceptually:

- provider/source `updated` time — when the authoritative capacity record changed/was updated;
- `observed_at` — when SafeBed successfully observed the authoritative source;
- `fresh_until` — the latest time that observation may be treated as sufficiently current under the provider/integration policy.

**SafeBed consequence:** SafeBed never rewrites the source timestamp to make a stale observation look newer.

**External review questions:**

- Is this separation consistent with intended HSDS capacity semantics?
- Is there an existing standards pattern SafeBed should reuse for observation/freshness metadata?

---

## STD-006 — Availability is not equivalent to SafeBed transaction capability

**Claim:** A provider exposing current capacity does not imply that SafeBed can submit referrals, place holds or create reservations through that integration.

**Status:** `INTERNAL_MAPPING`

**SafeBed consequence:** SafeBed separately models provider/integration capabilities such as read-only availability, external/manual referral, portal-managed workflow, hold support and reservation support.

This is intentionally a SafeBed transaction concern rather than a claim about ORUK service data.

**External review question:** Is there an existing Open Referral/HSDS access/application pattern SafeBed should reference more strongly before defining additional capability metadata?

---

## STD-007 — Referrals, holds, reservations and arrival are not claimed as ORUK 3.0 endpoints

**Claim:** SafeBed's proposed placement transaction resources are SafeBed-specific discovery concepts unless/until equivalent semantics are adopted through an appropriate standard/profile.

**Status:** `INTERNAL_MAPPING` + `EXTERNAL_REVIEW_REQUIRED`

Current SafeBed transaction concepts include:

- `PlacementNeed`;
- match/suitability result;
- `Referral`;
- `Hold`;
- `Reservation`;
- `Placement` / arrival confirmation.

**SafeBed consequence:** transaction endpoints live in a separate SafeBed API namespace and are not labelled ORUK endpoints.

**External review questions:**

- Are there adjacent Open Referral/HSDS standards efforts SafeBed should reuse?
- Which concepts, if any, would be useful as future interoperable extensions rather than application-specific transactions?

---

## STD-008 — Protected-location disclosure is an authorisation policy, not a replacement location schema

**Claim:** SafeBed can reuse standard service/location information while independently deciding whether a particular caller may receive particular fields.

**Status:** `INTERNAL_MAPPING`

SafeBed disclosure classes currently include:

- `PUBLIC`;
- `VERIFIED_USER`;
- `PLACEMENT_AUTHORISED`;
- `RESTRICTED`;
- `SEALED`.

**SafeBed consequence:** disclosure policy wraps/filters standard location/service data. SafeBed is not proposing that these classes replace ORUK's location representation.

**External review question:** Are there existing Open Referral privacy/access patterns SafeBed should align with or document alongside this application-level policy?

---

## STD-009 — Missing/unknown accessibility data must not become “accessible”

**Claim:** SafeBed should reuse published accessibility information where present, but absence/unknown data must not be interpreted as confirmed accessibility.

**Status:** `INTERNAL_MAPPING`

**SafeBed consequence:** a placement requiring a particular accessibility feature may remain `INSUFFICIENT_INFORMATION` / potentially unsuitable until the provider can confirm it.

**External review question:** Are there recommended ORUK conventions for expressing unknown vs false accessibility information that SafeBed should apply consistently?

---

## STD-010 — General eligibility text and hard placement rules must remain distinguishable

**Claim:** SafeBed should reuse ORUK service eligibility/application information, but some emergency-placement decisions require more structured and time-sensitive provider rules.

**Status:** `INTERNAL_MAPPING` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** structured SafeBed matching rules must remain traceable to provider policy; they must not silently reinterpret narrative eligibility or become opaque automated rejection criteria.

**External review questions:**

- Which ORUK attributes/taxonomies should represent common eligibility dimensions before SafeBed adds a custom field?
- How should application/referral requirements be represented so “professional referral required” remains an access pathway rather than a hard suitability rejection?

---

## STD-011 — Identifiers should preserve authoritative upstream identity

**Claim:** SafeBed should preserve authoritative provider/ORUK identifiers where available instead of creating unnecessary duplicate service identities.

**Status:** `INTERNAL_MAPPING` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** an adapter should retain source identifiers/provenance and map them into SafeBed references rather than inventing a parallel master record without need.

**External review questions:**

- What identifier/provenance conventions are recommended for aggregators consuming multiple ORUK publishers?
- Are there preferred approaches for source record identity/version tracking?

---

## STD-012 — SafeBed should remain implementable without the official SafeBed application

**Claim:** If the capacity/profile work proves generally useful, the interoperability specification should be implementable independently of the SafeBed application.

**Status:** `INTERNAL_MAPPING` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** the long-term protocol/specification should not unnecessarily encode one vendor/operator's database or UI assumptions.

**External review question:** Which contribution/profile process would make this useful upstream rather than creating another bespoke UK homelessness data silo?

---

# Claim-change rule

When external review changes a claim:

1. do not silently rewrite history;
2. mark the previous interpretation `SUPERSEDED` where materially necessary;
3. identify the new source/review outcome;
4. update the standards mapping, protocol and OpenAPI together;
5. add/adjust synthetic tests if the change affects executable semantics;
6. avoid claiming endorsement beyond what was actually reviewed.

---

# Current overall status

SafeBed's current standards position is internally coherent enough for synthetic discovery work, but **not frozen**.

The next standards milestone is an external technical review focused on:

- the ORUK 3.0 baseline;
- the HSDS 3.1+ capacity alignment;
- source/update/freshness semantics;
- identifiers/provenance;
- eligibility/access mapping;
- whether any proposed capacity/profile concepts should move upstream;
- which transaction concepts should remain application-specific.

Until that review occurs, wording should remain:

> **ORUK-compatible / HSDS-aligned / SafeBed-specific where explicitly identified.**
