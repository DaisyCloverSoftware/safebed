# SafeBed Standards Review Pack v0.1

**Status:** public technical review pack. No standards organisation is claimed to have reviewed or endorsed SafeBed.

## 1. What SafeBed is asking reviewers to do

SafeBed is not asking reviewers to approve a product.

We are asking them to challenge a proposed interoperability boundary:

> **Use current UK service-directory standards wherever they already fit; align accommodation-capacity concepts with later HSDS work; keep real-time placement transactions and safeguarding/disclosure explicitly separate unless a suitable standard already exists.**

The review should identify:

- incorrect standards claims;
- fields/entities SafeBed is unnecessarily reinventing;
- UK-profile conventions SafeBed has missed;
- later/forthcoming profile work SafeBed should target;
- concepts that should remain application-specific;
- concepts that may be generally useful enough to propose upstream.

---

# 2. SafeBed's current three-layer model

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

## Layer B — HSDS 3.1+-aligned capacity semantics

SafeBed needs to represent whether usable accommodation capacity is available now and how trustworthy/current that observation is.

The current design aligns the provider-reported capacity concept with later international HSDS `service_capacity` / `unit` semantics where practical.

SafeBed additionally distinguishes:

- authoritative source update time;
- SafeBed observation time;
- SafeBed/provider freshness policy;
- states such as stale, unknown and manual confirmation required.

These additions must not be described as current ORUK 3.0 fields unless the profile actually adopts them.

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

# 3. Why SafeBed needs review before freezing the protocol

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

# 4. Primary review questions

## Version/profile

1. Is ORUK 3.0 still the correct current UK profile baseline for a new implementation starting now?
2. Is there a newer/forthcoming ORUK profile SafeBed should target or design migration toward?
3. Does SafeBed describe the ORUK/HSDS version relationship accurately?

## Capacity

4. Is later HSDS `service_capacity` / `unit` the right conceptual basis for emergency-accommodation capacity?
5. Is equivalent capacity work planned/under consideration for a future UK profile?
6. If a UK-specific capacity profile is useful, should SafeBed propose it upstream rather than expose a long-lived private extension?
7. How should capacity attach to a service/location/unit when different physical units have materially different eligibility/accessibility?

## Freshness

8. Is it correct to keep source `updated` time separate from the time an aggregator last successfully observed the source?
9. Is there an existing Open Referral/HSDS convention for observation/freshness/TTL semantics SafeBed should reuse?
10. Should freshness be expressed as metadata about the feed/observation rather than service capacity itself?

## Identifiers / aggregation

11. What identifier/provenance conventions should an aggregator use when consuming multiple ORUK publishers?
12. How should SafeBed represent the authoritative source and source revision without inventing a conflicting identity model?
13. Are there recommended approaches for deduplicating the same service appearing through multiple publishers?

## Eligibility / access

14. Which current ORUK fields/attributes/taxonomies should SafeBed use for common accommodation eligibility before defining structured extension rules?
15. What is the recommended distinction between eligibility and application/access steps?
16. In particular, does treating **professional referral required** as a pathway/access requirement rather than a suitability rejection fit the standard's intended semantics?
17. How should unknown accessibility information be represented so an aggregator does not accidentally turn missing data into `false` or `true`?

## Transactions

18. Are there existing Open Referral/HSDS or adjacent standards for referral status/placement transactions that SafeBed should investigate?
19. Should `Referral`, `Hold`, `Reservation` and `Arrival` remain application-specific rather than become service-directory extensions?
20. If any are broadly reusable, what is the appropriate process for discussing them upstream?

## Protected information

21. Are there established Open Referral patterns for restricted/private service fields or authorised datasets that should complement SafeBed's application-level disclosure policy?
22. Is SafeBed correct to treat protected-location disclosure as authorisation around standard location data rather than inventing a replacement location schema?

---

# 5. Concrete artefacts for review

Reviewers can focus on these public files:

- `docs/standards-mapping-v0.1.md`
- `docs/standards-claim-register-v0.1.md`
- `docs/safebed-availability-protocol-v0.1.md`
- `api/openapi.yaml`
- `docs/security-privacy-safeguarding-model-v0.1.md`

The synthetic interoperability PR may also help demonstrate intended semantics without requiring any real provider/service-user data.

---

# 6. What SafeBed is **not** asking for

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

# 7. Requested response format

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

# 8. SafeBed review principles

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

# 9. Proposed first standards milestone

The first useful outcome is not “SafeBed standard approved.”

It is:

> **A reviewer familiar with the current UK Open Referral profile agrees that SafeBed's service-data reuse, capacity-version boundary and extension separation are materially accurate — or gives us a concrete correction before we freeze them.**

Until then the protocol remains **v0.1 discovery**.

## Public references

- Open Referral UK developer overview: https://openreferraluk.org/developers/overview
- Open Referral UK API: https://openreferraluk.org/developers/api
- Open Referral UK schemata: https://openreferraluk.org/developers/schemata
- Open Referral UK changelog: https://openreferraluk.org/developers/changelog
- International HSDS schema reference: https://docs.openreferral.org/en/latest/hsds/schema_reference.html
- International HSDS changelog: https://docs.openreferral.org/en/latest/hsds/changelog.html
