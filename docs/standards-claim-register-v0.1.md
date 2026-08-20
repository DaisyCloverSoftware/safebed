# SafeBed ORUK / HSDS Standards Claim Register v0.1

**Status:** public discovery register. Claims below are SafeBed interpretations of public standards documentation and remain subject to external review by the relevant standards community.

This register exists to prevent standards language from quietly drifting into stronger claims than SafeBed can support.

## Status values

- `PUBLIC_DOC_VERIFIED` — checked against the cited current public documentation.
- `INTERNAL_MAPPING` — SafeBed design interpretation, not a standards-community endorsement.
- `EXTERNAL_REVIEW_REQUIRED` — should be confirmed with Open Referral UK / relevant maintainers before being treated as stable interoperability guidance.
- `SUPERSEDED` — no longer current; preserve the history rather than silently rewriting it.

## Version baseline

SafeBed's current UK service-data baseline is **Open Referral UK (ORUK) 3.0**.

As checked on 20 August 2026, ORUK's own developer material still presents **3.0 as the current/latest UK profile**. The international Human Services Data Specification has continued independently and is now on the **3.2.x line (3.2.3 current in the upstream specification repository/changelog at this review point)**.

International HSDS **3.1 introduced** `service_capacity`, `unit`, and the `service.capacities` relationship. Those concepts remain present in the current 3.2.x international schema. The current published ORUK 3.0 API/profile does not expose `service_capacity` as a UK-profile entity/endpoint.

SafeBed must therefore never write as though its capacity/placement layer is already a standard ORUK 3.0 endpoint. When version precision matters, the preferred wording is:

> **ORUK 3.0-compatible service discovery; capacity semantics based on HSDS concepts introduced in 3.1 and retained in the current international 3.2.x line; SafeBed-specific transaction/disclosure behaviour where explicitly identified.**

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
- https://openreferraluk.org/about/50-governance

**External review question:** Is ORUK 3.0 still the correct profile/version for a new UK implementation beginning discovery now, and is there a newer UK profile transition SafeBed should plan for?

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

## STD-003 — HSDS 3.1 introduced capacity; the current international line is newer

**Claim:** International HSDS 3.1 introduced `service_capacity` and `unit` concepts suitable for describing available/maximum service capacity and its update time/unit. Those concepts remain in the current 3.2.x international schema; the upstream changelog currently records 3.2.3.

**Status:** `PUBLIC_DOC_VERIFIED` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** SafeBed should align accommodation capacity semantics with the current international HSDS capacity model where practical rather than invent a structurally incompatible count. Documentation should say that capacity was **introduced in 3.1**, not imply 3.1 is still the latest international version.

**Public sources:**

- https://docs.openreferral.org/en/latest/hsds/changelog.html
- https://docs.openreferral.org/en/latest/hsds/schema_reference.html
- https://github.com/openreferral/specification

**External review questions:**

- Is alignment with the current international `service_capacity` model the right direction for a UK emergency-accommodation profile today?
- Is equivalent capacity work already planned for a future ORUK profile?
- Should SafeBed participate in upstream/profile work instead of maintaining a long-lived local extension?
- Should SafeBed target a particular international 3.2.x point version for conformance testing, or treat the model as guidance until a UK profile adopts it?

---

## STD-004 — `service_capacity` is not currently an ORUK 3.0 API claim

**Claim:** SafeBed must not describe `service_capacity` as though it is currently exposed by the published ORUK 3.0 API/profile.

**Status:** `PUBLIC_DOC_VERIFIED` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** public documentation uses language such as:

- **ORUK 3.0-compatible service discovery**;
- **capacity semantics based on HSDS `service_capacity` / `unit`, introduced in 3.1 and retained in current international 3.2.x**;
- **SafeBed placement transaction/disclosure layer**.

It does not call the SafeBed capacity endpoint an ORUK endpoint.

**Public sources:**

- https://openreferraluk.org/developers/api
- https://openreferraluk.org/developers/schemata
- https://docs.openreferral.org/en/latest/hsds/changelog.html

**External review question:** Is this UK-profile/international-version boundary described accurately enough for implementers?

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

## STD-008 — ORUK open-feed privacy supports withholding sensitive locations; SafeBed authorisation remains application-specific

**Claim:** ORUK's current data-sharing guidance says sensitive information that should not be public — explicitly including the location of a refuge — must not be exposed in an open ORUK feed. ORUK compliance guidance also distinguishes open service information from private/confidential information that may require separately secured APIs.

**Status:** `PUBLIC_DOC_VERIFIED` + `INTERNAL_MAPPING` + `EXTERNAL_REVIEW_REQUIRED`

**SafeBed consequence:** SafeBed must not solve protected-location disclosure by publishing an exact sensitive destination into an anonymous/open service feed and merely hiding it in the UI. A public SafeBed/ORUK-compatible discovery record may identify an access pathway without carrying an unauthorised exact destination.

SafeBed's disclosure classes currently include:

- `PUBLIC`;
- `VERIFIED_USER`;
- `PLACEMENT_AUTHORISED`;
- `RESTRICTED`;
- `SEALED`.

Those classes are **SafeBed authorisation policy**, not an ORUK schema extension or a claim that ORUK defines these roles. Where an authorised workflow later needs an exact standard location object, disclosure policy may wrap/filter that standard representation rather than inventing a replacement location schema.

**Public sources:**

- https://openreferraluk.org/developers/data-sharing
- https://openreferraluk.org/developers/compliance

**External review questions:**

- Is excluding the exact sensitive location from the public ORUK-compatible dataset the correct interpretation for protected emergency accommodation?
- Are there established ORUK/Open Referral patterns for partner-only or authorised datasets that SafeBed should reuse before defining its own disclosure transport?
- When exact location data is legitimately disclosed after authorisation, is reusing the standard location representation appropriate?

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

- the ORUK 3.0 baseline and UK profile release path;
- capacity concepts introduced in HSDS 3.1 and retained in current international 3.2.x;
- source/update/freshness semantics;
- identifiers/provenance;
- eligibility/access mapping;
- ORUK's open-feed privacy boundary and protected/sensitive location handling;
- whether any proposed capacity/profile concepts should move upstream;
- which transaction concepts should remain application-specific.

Until that review occurs, wording should remain:

> **ORUK-compatible / current-HSDS-informed / SafeBed-specific where explicitly identified.**
