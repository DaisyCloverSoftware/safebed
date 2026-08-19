# SafeBed Open Referral Standards Review Request v0.1

**Use:** public-safe first-contact/review request for the Open Referral UK standards community or another appropriate standards reviewer.

This template contains no private recipient data. Do not add personal contact details, confidential correspondence or unpublished organisational information to the public repository.

---

## Subject / heading

**SafeBed discovery review — ORUK 3.0 service data and HSDS 3.1+ accommodation capacity alignment**

## Introduction

SafeBed is a public-good discovery project exploring whether emergency-accommodation providers can safely expose sufficiently current capacity and placement pathways without replacing the systems they already use.

Before freezing a protocol, we want to make sure we are not creating another incompatible service-data format.

Our current working model is:

1. **Open Referral UK 3.0** for current UK service-directory interoperability;
2. later international **HSDS 3.1+ capacity concepts** as the direction for available/maximum capacity semantics where the current published UK profile does not expose them;
3. a clearly separate **SafeBed placement layer** for freshness policy, suitability/access matching, referrals, time-limited holds, reservations and protected disclosure.

We are explicitly **not** claiming those SafeBed transaction endpoints are current ORUK endpoints.

## What we would value review on

The most useful challenge would be whether:

- ORUK 3.0 is still the right baseline for a new UK implementation;
- our ORUK entity/field mappings are appropriate;
- our understanding of HSDS 3.1+ `service_capacity` / `unit` is accurate;
- capacity/freshness work should target an existing or forthcoming UK profile rather than a SafeBed extension;
- source update time should remain distinct from an aggregator observation/freshness policy;
- identifiers/provenance are being handled in a standards-friendly way;
- eligibility vs application/referral requirements are being separated correctly;
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

SafeBed remains pre-development/discovery and synthetic-data-only for this work. The purpose of asking now is to make standards corrections while the model is still cheap to change.

Thank you for any technical direction or correction you are able to provide.
