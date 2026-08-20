# SafeBed Standards Review Pack v0.1

**Status:** public technical review pack. No standards organisation is claimed to have reviewed or endorsed SafeBed.

## 1. What SafeBed is asking reviewers to do

SafeBed is not asking reviewers to approve a product.

We are asking them to challenge a proposed interoperability boundary:

> **Use the current UK service-directory profile wherever it already fits; align accommodation-capacity concepts with the current international HSDS model; keep real-time placement transactions and safeguarding/disclosure explicitly separate unless a suitable standard already exists.**

The review should identify:

- incorrect standards claims;
- fields/entities SafeBed is unnecessarily reinventing;
- UK-profile conventions SafeBed has missed;
- later/forthcoming profile work SafeBed should target;
- concepts that should remain application-specific;
- concepts that may be generally useful enough to propose upstream.

---

# 2. Version position checked 20 August 2026

SafeBed's current reading of the published standards is:

- **Open Referral UK 3.0** remains the current/latest published UK profile and therefore the SafeBed UK service-directory baseline.
- The international HSDS standard has advanced beyond 3.1; the upstream changelog/specification currently records **3.2.3**.
- `service_capacity`, `unit`, and `service.capacities` were introduced internationally in **HSDS 3.1** and remain present in the current 3.2.x schema.
- The current published ORUK 3.0 profile does not expose `service_capacity` as a UK-profile entity/endpoint.

This is a version boundary, not an endorsement. SafeBed still needs external confirmation that this is the right migration/alignment direction for a new UK implementation.

Primary references:

- https://openreferraluk.org/about/50-governance
- https://openreferraluk.org/developers/api
- https://openreferraluk.org/developers/schemata
- https://docs.openreferral.org/en/latest/hsds/changelog.html
- https://docs.openreferral.org/en/latest/hsds/schema_reference.html
- https://github.com/openreferral/specification

---

# 3. SafeBed's current three-layer model

## Layer A — ORUK 3.0-compatible service discovery

Use current Open Referral UK concepts for ordinary service information such as:

- organisations;
- services;
- locations/service-at-location relationships;
- schedules;
- service areas;
- contacts;
- accessibility;
- general eligibility/application information;
- taxonomies/attributes.

SafeBed should consume/preserve authoritative identifiers and source provenance where possible rather than build a parallel national directory.

## Layer B — current-HSDS-informed capacity semantics

SafeBed needs to represent whether usable accommodation capacity is available now and how trustworthy/current that observation is.

The provider-reported capacity concept should align, where practical, with international HSDS `service_capacity` / `unit`: concepts introduced in 3.1 and retained in the current 3.2.x international line.

SafeBed additionally distinguishes:

- authoritative source update time;
- SafeBed observation time;
- SafeBed/provider freshness policy;
- states such as stale, unknown and manual confirmation required.

These additions must not be described as current ORUK 3.0 fields unless the UK profile actually adopts them.

## Layer C — SafeBed placement/safeguarding layer

SafeBed currently treats the following as explicit application/transaction concepts:

- temporary placement need;
- suitability/pathway matching;
- provider integration capability;
- referral;
- provider decision;
- time-limited hold;
- reservation;
- arrival confirmation;
- protected disclosure policy.

SafeBed does not currently claim these are ORUK 3.0 endpoints.

---

# 4. Protected-information boundary

Current ORUK guidance is especially relevant to SafeBed's safeguarding model.

ORUK describes its normal feed as open service-directory data and says information that should not be public must be excluded from the open feed. Its examples explicitly include sensitive location information such as the location of a refuge. ORUK's compliance guidance also recognises that private/confidential information may instead be provided through separately secured APIs.

SafeBed therefore currently interprets the standards boundary as:

- public/anonymous discovery must never receive an exact protected destination merely so the UI can hide it;
- a protected service may still expose enough public-safe information to explain that an access/referral pathway exists;
- exact destination disclosure, if legitimately required later, belongs behind an authorised workflow;
- SafeBed's role/disclosure classes are an application policy, not an ORUK-defined schema or role model;
- where an exact location is authorised, SafeBed should prefer the standard location representation rather than inventing a second incompatible address model.

Primary references:

- https://openreferraluk.org/developers/data-sharing
- https://openreferraluk.org/developers/compliance

This interpretation is still an explicit external-review question before production schema freeze.

---

# 5. Why SafeBed needs review before freezing the protocol

The most damaging standards failure would not be a syntax error.

It would be building a bespoke model that appears reasonable, gains local adoption, and later turns out to duplicate or conflict with an existing/upcoming UK standard.

External review should therefore happen **before**:

- a production provider API is frozen;
- councils/providers are asked to implement a SafeBed-specific capacity feed;
- the specification is presented as a stable public standard;
- migration commitments are made;
- real integrations accumulate around avoidable extension fields.

Synthetic implementation can continue while this review is open because it can still change cheaply.

---

# 6. Primary review questions

## Version/profile

1. Is ORUK 3.0 still the correct current UK profile baseline for a new implementation starting now?
2. Is there a newer/forthcoming ORUK profile SafeBed should target or design migration toward?
3. Does SafeBed describe the ORUK 3.0 / international HSDS 3.2.x relationship accurately?
4. Should SafeBed pin a specific international 3.2.x version for capacity conformance tests, or treat the model as guidance until a UK profile adopts it?

## Capacity

5. Is current international HSDS `service_capacity` / `unit` the right conceptual basis for emergency-accommodation capacity?
6. Is equivalent capacity work planned/under consideration for a future UK profile?
7. If a UK-specific capacity profile is useful, should SafeBed propose it upstream rather than expose a long-lived private extension?
8. How should capacity attach to a service/location/unit when different physical units have materially different eligibility/accessibility?

## Freshness

9. Is it correct to keep source `updated` time separate from the time an aggregator last successfully observed the source?
10. Is there an existing Open Referral/HSDS convention for observation/freshness/TTL semantics SafeBed should reuse?
11. Should freshness be expressed as metadata about the feed/observation rather than service capacity itself?

## Identifiers / aggregation

12. What identifier/provenance conventions should an aggregator use when consuming multiple ORUK publishers?
13. How should SafeBed represent the authoritative source and source revision without inventing a conflicting identity model?
14. Are there recommended approaches for deduplicating the same service appearing through multiple publishers?

## Eligibility / access

15. Which current ORUK fields/attributes/taxonomies should SafeBed use for common accommodation eligibility before defining structured extension rules?
16. What is the recommended distinction between eligibility and application/access steps?
17. In particular, does treating **professional referral required** as a pathway/access requirement rather than a suitability rejection fit the standard's intended semantics?
18. How should unknown accessibility information be represented so an aggregator does not accidentally turn missing data into `false` or `true`?

## Transactions

19. Are there existing Open Referral/HSDS or adjacent standards for referral status/placement transactions that SafeBed should investigate?
20. Should `Referral`, `Hold`, `Reservation` and `Arrival` remain application-specific rather than become service-directory extensions?
21. If any are broadly reusable, what is the appropriate process for discussing them upstream?

## Protected information

22. Is excluding exact sensitive destinations from an anonymous ORUK-compatible dataset the correct application of the current ORUK privacy guidance for emergency accommodation?
23. Are there established ORUK/Open Referral patterns for partner-only or authorised datasets that SafeBed should reuse before creating its own disclosure transport?
24. Is SafeBed correct to treat disclosure authorisation as a policy around standard location data rather than inventing a replacement location schema?

---

# 7. Concrete artefacts for review

Reviewers can focus on these public files:

- `docs/standards-mapping-v0.1.md`
- `docs/standards-claim-register-v0.1.md`
- `docs/safebed-availability-protocol-v0.1.md`
- `api/openapi.yaml`
- `docs/security-privacy-safeguarding-model-v0.1.md`

The synthetic interoperability PR may also help demonstrate intended semantics without requiring any real provider/service-user data.

---

# 8. What SafeBed is **not** asking for

A standards review does not require:

- access to live provider data;
- protected accommodation information;
- real referral examples;
- credentials;
- vendor-confidential API documentation;
- approval of SafeBed's safeguarding model;
- endorsement of the project;
- a commitment to accept a SafeBed extension upstream.

The useful outcome may simply be:

> “This field already exists; use it.”

or:

> “Do not standardise this transaction here.”

Both are successful review outcomes.

---

# 9. Requested response format

For each material issue, SafeBed would benefit from:

### Claim / mapping

Which SafeBed claim or mapping is being reviewed?

### Assessment

Choose one where useful:

- `CORRECT`
- `CORRECT WITH CLARIFICATION`
- `CHANGE REQUIRED`
- `EXISTING STANDARD SHOULD BE REUSED`
- `FUTURE PROFILE WORK RELEVANT`
- `APPLICATION-SPECIFIC — DO NOT STANDARDISE HERE`
- `NEEDS WIDER STANDARDS DISCUSSION`

### Reason / source

What standard/profile text or practice should SafeBed follow?

### Suggested change

What should SafeBed change in its mapping/protocol/API?

This structure is optional; reviewers can respond in whatever format is practical.

---

# 10. SafeBed review principles

When responding to standards feedback, SafeBed should:

- prefer upstream/current standard semantics over local convenience;
- avoid claiming endorsement from an informal review;
- preserve review history where a significant claim changes;
- update docs/API/tests together;
- distinguish a standards correction from a product/safeguarding decision;
- keep version-specific statements explicit;
- avoid blocking synthetic discovery on questions that can safely remain provisional;
- stop production schema freeze if a core interoperability claim is unresolved.

---

# 11. Proposed first standards milestone

The first useful outcome is not “SafeBed standard approved.”

It is:

> **A reviewer familiar with the current UK Open Referral profile agrees that SafeBed's service-data reuse, current international capacity alignment, protected-location boundary and extension separation are materially accurate — or gives us a concrete correction before we freeze them.**

Until then the protocol remains **v0.1 discovery**.

## Public references

- Open Referral UK governance/version position: https://openreferraluk.org/about/50-governance
- Open Referral UK developer overview: https://openreferraluk.org/developers/overview
- Open Referral UK API: https://openreferraluk.org/developers/api
- Open Referral UK schemata: https://openreferraluk.org/developers/schemata
- Open Referral UK changelog: https://openreferraluk.org/developers/changelog
- Open Referral UK data sharing/privacy: https://openreferraluk.org/developers/data-sharing
- Open Referral UK compliance criteria: https://openreferraluk.org/developers/compliance
- International HSDS schema reference: https://docs.openreferral.org/en/latest/hsds/schema_reference.html
- International HSDS changelog: https://docs.openreferral.org/en/latest/hsds/changelog.html
- International HSDS specification repository: https://github.com/openreferral/specification
