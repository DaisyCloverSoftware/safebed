# SafeBed Open Referral Standards Review Request v0.1

**Use:** public-safe first-contact/review request for the Open Referral UK standards community or another appropriate standards reviewer.

This template contains no private recipient data. Do not add personal contact details, confidential correspondence or unpublished organisational information to the public repository.

---

## Subject / heading

**SafeBed discovery review — ORUK 3.0 service data, current HSDS capacity and protected-location boundaries**

## Introduction

SafeBed is a public-good discovery project exploring whether emergency-accommodation providers can safely expose sufficiently current capacity and placement pathways without replacing the systems they already use.

Before freezing a protocol, we want to make sure we are not creating another incompatible service-data format.

Our current working model, checked against the public standards material on 20 August 2026, is:

1. **Open Referral UK 3.0** remains the current published UK profile and is our service-directory interoperability baseline;
2. international HSDS has progressed to the **3.2.x line (currently 3.2.3 upstream)**, while `service_capacity` / `unit` were introduced in HSDS 3.1 and remain the direction we are using for available/maximum capacity semantics where the current UK profile does not expose them;
3. ORUK's own privacy guidance says sensitive information such as the location of a refuge must not be exposed in an open feed, so SafeBed keeps public-safe discovery separate from authorised exact-destination disclosure;
4. a clearly separate **SafeBed placement layer** handles observation freshness, suitability/access matching, referrals, time-limited holds, reservations and application-level disclosure authorisation.

We are explicitly **not** claiming that SafeBed transaction endpoints, freshness fields or disclosure roles are current ORUK endpoints/fields.

## What we would value review on

The most useful challenge would be whether:

- ORUK 3.0 is still the right baseline for a new UK implementation;
- there is a forthcoming UK profile/version transition we should design toward now;
- our ORUK entity/field mappings are appropriate;
- our understanding of the current international `service_capacity` / `unit` model is accurate;
- we should pin a particular HSDS 3.2.x version for conformance tests or treat the capacity model as guidance until the UK profile adopts it;
- capacity/freshness work should target an existing or forthcoming UK profile rather than a SafeBed extension;
- source update time should remain distinct from an aggregator observation/freshness policy;
- identifiers/provenance are being handled in a standards-friendly way;
- eligibility vs application/referral requirements are being separated correctly;
- excluding an exact protected destination from anonymous/open service data is the right interpretation of ORUK's current privacy guidance;
- there is an established partner-only/authorised-data pattern we should reuse before defining a SafeBed disclosure transport;
- any of our transaction concepts already have a standards home we have missed;
- any proposed concept would be more useful upstream than SafeBed-specific.

## Public review artefacts

The relevant public repository material is:

- `docs/standards-claim-register-v0.1.md`
- `docs/standards-mapping-v0.1.md`
- `docs/safebed-availability-protocol-v0.1.md`
- `api/openapi.yaml`

Repository:

https://github.com/DaisyCloverSoftware/safebed

## Primary public references used for this request

- https://openreferraluk.org/about/50-governance
- https://openreferraluk.org/developers/api
- https://openreferraluk.org/developers/schemata
- https://openreferraluk.org/developers/data-sharing
- https://openreferraluk.org/developers/compliance
- https://docs.openreferral.org/en/latest/hsds/schema_reference.html
- https://docs.openreferral.org/en/latest/hsds/changelog.html
- https://github.com/openreferral/specification

## What we are not requesting

This review does not require:

- endorsement of SafeBed;
- acceptance of a new standard;
- live homelessness/referral data;
- provider credentials;
- protected accommodation information;
- access to confidential systems.

A response that says **“this already exists; use X instead”** would be extremely useful.

## Current status

SafeBed remains discovery-stage and synthetic-data-only for this work. The purpose of asking now is to make standards corrections while the model is still cheap to change.

Thank you for any technical direction or correction you are able to provide.
