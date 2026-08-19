# SafeBed API contracts

SafeBed is still in **discovery / synthetic-data-only** development. This directory contains public contract artefacts, not a deployed production API.

## Current executable-aligned discovery contract

**`openapi.v0.2.json`** is the current contract aligned with the synthetic interoperability sandbox.

It is JSON-form OpenAPI 3.1 so the repository can parse and regression-test the contract with Node itself without introducing a YAML/parser dependency.

The v0.2 contract makes several boundaries explicit:

- `POSSIBLY_SUITABLE` is a real match state;
- `PROFESSIONAL_REFERRAL_REQUIRED` is an access/pathway reason rather than automatically a hard suitability rejection;
- provider transaction capability is independent of live capacity;
- read-only and manual-confirmation integrations do not become fake booking integrations;
- stale/unreachable capacity is not treated as live;
- a reservation request cannot submit `actorRole`, `disclosureLevel` or `canDiscloseDestination` to grant itself access;
- protected destination data is absent from `PublicService` and may be returned only after server-side disclosure policy permits it;
- the current repository sandbox models/exercises state semantics but does **not** expose an HTTP server.

## Historical v0.1 contract

`openapi.yaml` is retained as the earlier discovery contract for review/history while v0.2 is being validated.

Do not add new implementation assumptions to v0.1. New contract work should target v0.2 or a later explicitly versioned file.

## Standards boundary

Current SafeBed wording is deliberately version-specific:

1. **Open Referral UK 3.0-compatible service discovery**;
2. **HSDS 3.1+-aligned capacity semantics** where later international capacity concepts are useful but are not part of the currently published ORUK 3.0 profile;
3. **SafeBed-specific placement/safeguarding layer** for freshness policy, matching/access pathways, integration capabilities, referrals, holds, reservations, arrival and protected disclosure.

SafeBed does not claim that its placement endpoints are current ORUK endpoints.

## Authentication / authorisation

The v0.2 contract does not pretend a production authentication system already exists.

Privileged operations carry `x-safebed-authz` notes describing the intended server-side boundary. Production identity/organisation verification is designed separately and must derive privilege from verified identity, organisation membership, resource/state policy and any specialist entitlement.

A public HTTP request must never be able to elevate itself by supplying a role/disclosure field.

## Personal data

The v0.2 referral request deliberately does **not** define one giant universal personal referral payload.

Real provider-specific fields remain gated by:

- provider workflow discovery;
- the data-minimisation register;
- DPIA/data-flow governance;
- controller/processor and lawful-processing decisions;
- retention/deletion decisions.

Until those live-use gates pass:

> **Synthetic data only.**
