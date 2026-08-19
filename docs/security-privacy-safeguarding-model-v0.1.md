# SafeBed Security, Privacy & Safeguarding Model v0.1

**Status:** discovery threat model. This document is not a completed DPIA, legal assessment or production security sign-off.

SafeBed handles a high-risk context: people may be homeless, fleeing harm, experiencing acute vulnerability, or seeking confidential specialist accommodation. Security controls must therefore be designed around consequences to people, not only consequences to systems.

## 1. Primary safety goals

SafeBed must protect against:

1. disclosure of protected accommodation locations;
2. unauthorised access to personal/referral information;
3. stalking, targeting or coercion through location/search data;
4. false or stale availability sending someone to an unusable/unsafe destination;
5. double booking of scarce capacity;
6. impersonation of professionals/providers;
7. malicious or unvetted accommodation listings;
8. bypass of required safeguarding assessment;
9. excessive collection or retention of vulnerable-person data;
10. denial of service at a time-critical point;
11. unsafe automated decision-making;
12. misuse of aggregate demand data to re-identify individuals or protected services.

## 2. Data classes

### Class 0 — Public service data

Examples:

- public service name;
- public address;
- general opening hours;
- public contact information;
- public eligibility descriptions.

### Class 1 — Operational availability

Examples:

- capacity state;
- freshness timestamp;
- non-sensitive unit information.

This may still require access controls for some services.

### Class 2 — Verified-professional information

Examples:

- professional referral routes;
- detailed admission criteria;
- non-public operational contact details.

### Class 3 — Personal/referral data

Examples:

- identifying information;
- household information;
- referral narrative;
- support requirements.

### Class 4 — Highly sensitive/restricted data

Examples:

- protected accommodation location;
- sensitive safeguarding information;
- health or other special-category data where processed;
- sealed specialist-service contact details.

Each field, not merely each record, should be capable of carrying a disclosure policy.

## 3. Trust boundaries

Treat these as separate trust zones:

- anonymous/public client;
- authenticated supporter/public account if introduced;
- verified professional client;
- provider portal;
- specialist restricted workflow;
- SafeBed API/service layer;
- integration adapter;
- provider/council source system;
- audit/security telemetry;
- support/administration tooling.

A compromise in one zone must not automatically grant access to another.

## 4. Threat actors

Design for misuse by:

- opportunistic attackers;
- stalkers/abusers seeking a protected person;
- malicious people posing as accommodation providers;
- compromised professional accounts;
- insiders abusing legitimate access;
- automated scrapers enumerating services or capacity;
- attackers causing false availability or denial of service;
- well-intentioned users accidentally disclosing sensitive information.

## 5. Protected-location enumeration

### Threat

An attacker repeatedly searches or varies coordinates/criteria to infer a protected refuge or hosted-placement address.

### Required controls

- never return exact protected coordinates before authorised disclosure;
- avoid stable identifiers that allow cross-query correlation where unnecessary;
- consider coarse geographic presentation for restricted services;
- rate-limit enumeration patterns;
- detect suspicious repeated probing;
- separate public service identity from restricted placement location;
- prevent map tiles/client payloads from containing hidden precise coordinates;
- audit restricted-location access.

Security review must inspect client bundles/network payloads, not only what is visually rendered.

## 6. Professional-account takeover

### Threat

A compromised account can see privileged availability, referrals or protected locations.

### Required controls

- MFA for privileged accounts;
- organisation verification;
- least-privilege roles;
- short-lived privileged sessions where practical;
- device/session revocation;
- access anomaly monitoring;
- immediate organisation offboarding capability;
- high-risk action reauthentication where justified;
- audit of protected-resource reads, not only writes.

## 7. Fake provider / malicious listing

### Threat

A malicious actor lists a private address and attempts to lure vulnerable people.

### Required controls

- no self-service public provider verification;
- organisation-level due diligence;
- explicit provider status;
- accredited-hosting-organisation model for private homes;
- no direct arbitrary private-host marketplace;
- controlled activation of accommodation inventory;
- documented suspension/revocation process.

## 8. Stale availability

### Threat

A technically valid but old record is presented as a current bed.

### Required controls

- preserve source update timestamp;
- `fresh_until`/TTL semantics;
- explicit `STALE`/`MANUAL_CONFIRMATION_REQUIRED` states;
- fail closed on source outage;
- visible freshness wording;
- provider-specific freshness policy;
- telemetry for stale-feed frequency.

## 9. Double booking / race conditions

### Threat

Two workers are told the same last space is theirs.

### Required controls

- idempotency keys;
- atomic/optimistic concurrency control;
- source-system revision token where supported;
- explicit hold expiry;
- conflict response rather than duplicate success;
- reconciliation after adapter/provider errors.

## 10. Excessive data collection

### Threat

The system becomes a shadow homelessness case-management database.

### Required controls

- anonymous service discovery by default;
- progressive disclosure/questions;
- explicit purpose for each referral field;
- reference existing case identifiers rather than duplicating full records where possible;
- retention schedule per data class;
- deletion/anonymisation workflow;
- prevent logs/traces from capturing full request bodies by default.

## 11. Location tracking

### Threat

Device location history is retained or can be reconstructed.

### Required controls

- request location only when needed for a search;
- do not continuously track;
- do not use background location for routine operation;
- avoid storing precise search coordinates unless necessary and justified;
- avoid using device telemetry to infer arrival where provider confirmation works;
- aggregate analytics spatially where possible.

## 12. Unsafe automation

### Threat

A rules engine or AI rejects people, conceals options or fabricates suitability.

### Required controls

- deterministic, inspectable provider criteria for hard filters;
- machine-readable reasons for exclusions;
- distinguish `NOT_MATCHED` from `DECLINED_BY_PROVIDER`;
- never represent an AI judgement as provider policy;
- require human/provider decision for safeguarding-sensitive admission;
- test for discriminatory proxy rules;
- maintain an appeal/alternative pathway when no match is returned.

## 13. Disclosure escalation

A protected address may move through disclosure states only after an authorised event.

Example:

`RESTRICTED -> PLACEMENT_AUTHORISED`

must require:

- authenticated authorised actor;
- valid referral/placement state;
- provider-controlled permission;
- audit event;
- appropriate expiry/revocation behaviour.

An API client must not be able to request a higher disclosure level merely by setting a parameter.

## 14. Logging and observability

SafeBed needs strong observability without leaking sensitive data.

Default logs should contain:

- request/correlation ID;
- service/operation name;
- response class/status;
- latency;
- authenticated principal ID where appropriate;
- non-sensitive provider/system identifiers where justified.

Default logs should avoid:

- names;
- free-text referral narratives;
- protected addresses;
- health/safeguarding details;
- precise device locations;
- access tokens or credentials.

Use explicit security audit storage for justified privileged events.

## 15. Secrets and integration credentials

- never store credentials in repository content;
- use managed secret storage in deployed environments;
- separate credentials per integration/environment;
- rotate credentials;
- minimise scopes;
- do not expose provider tokens to browser clients;
- audit administrative secret access where platform capabilities allow.

## 16. Public repository safety

This public repository must never contain:

- real service-user data;
- real referral payloads containing personal information;
- protected accommodation addresses;
- confidential provider operating procedures;
- provider credentials/tokens;
- private contact lists;
- production database dumps;
- internal infrastructure access details.

Examples and fixtures must be synthetic.

## 17. Data-protection work required before live use

Before processing real referrals, SafeBed requires formal assessment of:

- controller/processor roles;
- Article 6 lawful basis;
- Article 9 condition where special-category data is processed;
- Data Protection Act 2018 requirements;
- DPIA;
- data-sharing agreements;
- retention/deletion policy;
- subject-rights handling;
- breach response;
- international transfer position if any service crosses jurisdictions.

The ICO notes that special-category processing requires both an Article 6 lawful basis and an Article 9 condition, and high-risk processing requires a DPIA.

## 18. Availability and resilience

Because SafeBed may be used late at night during an urgent placement attempt:

- provider fallback contact routes should remain available where safe;
- availability source outages must degrade explicitly;
- transactional retries must be idempotent;
- recovery procedures must reconcile uncertain holds/reservations;
- critical workflows should have clear manual fallback;
- disaster recovery must prioritise correctness over showing stale inventory.

## 19. Security gates before controlled trial

Before Phase 4 live use:

- threat model reviewed with safeguarding expertise;
- DPIA completed/approved;
- penetration/security testing completed for the trial scope;
- authentication/MFA tested;
- role/disclosure tests automated;
- protected-location leakage test passed;
- audit logging tested;
- incident runbook exercised;
- backup/recovery tested where stateful data exists;
- synthetic end-to-end placement tests passed;
- provider-source outage tests passed;
- concurrency/double-booking tests passed.

## 20. Non-negotiable invariant

> A SafeBed feature is not successful if it makes a vulnerable person or accommodation provider less safe, even when it makes placement faster.

## References

- ICO special-category data guidance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/special-category-data/
- ICO DPIA guidance: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/
