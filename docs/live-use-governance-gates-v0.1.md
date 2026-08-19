# SafeBed Live-Use Governance Gates v0.1

**Status:** public discovery framework. This is not legal advice, a completed DPIA, a data-sharing agreement, or authority to process live personal data.

SafeBed is intended for a high-risk welfare context. It may eventually process personal information about people experiencing homelessness and, where necessary for a referral, information that could include health or other special-category data. It may also mediate access to protected accommodation information.

For that reason, **production-like functionality is not the same thing as permission to use real data**.

The project may continue to develop with synthetic data while the gates below remain open. Real referral data, protected locations and live provider credentials must not enter SafeBed until the relevant gates are explicitly satisfied for the specific pilot/processing arrangement.

## 1. Current legal-guidance caveat

UK data-protection law and ICO guidance must be checked again at the point of live deployment.

As of this discovery version, ICO guidance is being updated following the Data (Use and Access) Act 2026. SafeBed must therefore avoid freezing a 2026 interpretation into code or policy without current professional review.

Current authoritative starting points include:

- ICO data protection principles;
- ICO controller/processor guidance;
- ICO special-category data guidance;
- ICO DPIA guidance;
- ICO Data Sharing Code of Practice.

## 2. Governing rule

Before a real processing activity starts, SafeBed must be able to answer:

> Who is responsible, why is this data being processed, what is the minimum data required, who may receive it, how is it protected, how long is it retained, and what happens when something goes wrong?

If any answer is materially unclear, the activity remains synthetic or is paused.

---

# Gate 0 — Accountable operating arrangement

Before live data is introduced, identify the organisation(s) accountable for the pilot/service.

Record at minimum:

- service owner;
- data-protection/accountability owner;
- safeguarding owner;
- security/incident owner;
- operational service owner;
- provider relationship owner;
- out-of-hours escalation owner;
- decision authority for pausing the service.

The final legal/organisational structure is tracked separately. SafeBed must not assume that a software repository, developer or technical contributor is automatically the legal service operator.

**Pass condition:** named accountable organisations and roles exist for the proposed live scope.

---

# Gate 1 — Data-flow inventory

Create a data-flow map for the exact live pilot.

For each flow record:

- source organisation/system;
- receiving organisation/system;
- purpose;
- categories of data;
- whether personal data is involved;
- whether special-category or criminal-offence data is involved;
- whether precise/protected location data is involved;
- whether the flow is one-way or reciprocal;
- API/manual/portal transport mechanism;
- storage locations;
- onward recipients/processors;
- retention/deletion event;
- fallback/manual route.

Separate at least:

1. public service-directory data;
2. live/operational capacity data;
3. temporary matching information;
4. identifiable referral data;
5. protected destination information;
6. audit/security events;
7. de-identified/aggregate service-planning data.

**Pass condition:** no live data category or system flow is materially undocumented.

---

# Gate 2 — Controller / processor roles

Controller/processor status must be determined from the real arrangement, not from a generic SafeBed label.

For every organisation/integration determine whether it is acting as:

- independent controller;
- joint controller;
- controller using SafeBed as processor;
- processor/sub-processor;
- different roles for different processing purposes.

The ICO describes controllers as organisations that determine the purposes and means of processing, while processors act on a controller's documented instructions. Data sharing between controllers and controller-to-processor processing require different governance arrangements.

Do not assume SafeBed is always “just a processor”. Features such as independent analytics, retention choices, matching purposes or disclosure decisions can affect the role analysis.

**Pass condition:** roles are documented for each material processing purpose and reflected in appropriate agreements/notices.

---

# Gate 3 — Lawful basis and special-category condition

For each processing purpose identify and document a valid Article 6 lawful basis before processing starts.

Where special-category data is processed, identify separately:

- the Article 6 lawful basis; and
- an applicable Article 9 condition;
- any relevant Data Protection Act 2018 / Schedule 1 requirements where applicable;
- any additional safeguards/policy documents required by the selected condition.

Do **not** assume that consent is automatically the correct basis simply because SafeBed helps a vulnerable person. The appropriate basis depends on the actual organisation, purpose and circumstances and requires proper assessment.

Do not collect health/safeguarding information merely because it might be useful later.

**Pass condition:** every live processing purpose has a documented, reviewed basis/condition where required.

---

# Gate 4 — DPIA

A DPIA must be completed before a live processing activity that is likely to result in high risk to individuals.

SafeBed should treat a DPIA as a mandatory pre-live project gate because the envisaged service may combine factors such as:

- vulnerable people;
- location/context information;
- potentially special-category data;
- service-access/matching decisions;
- multiple organisations sharing information;
- protected accommodation;
- new interoperability technology.

The DPIA should describe:

- purpose and scope;
- necessity and proportionality;
- data flows;
- affected people;
- risks and severity/likelihood;
- technical controls;
- organisational/safeguarding controls;
- alternatives considered;
- residual risk;
- consultation/co-design undertaken;
- approval/sign-off;
- review trigger/date.

If high residual risk cannot be reduced appropriately, the live processing must not begin merely because the software is ready.

**Pass condition:** DPIA approved for the exact pilot scope with acceptable residual risk and review ownership.

---

# Gate 5 — Data-sharing and processing agreements

For controller-to-controller sharing, document the arrangement in an appropriate data-sharing agreement or equivalent governance instrument.

The agreement should address, as applicable:

- purpose of sharing;
- participating controllers;
- lawful basis/legal power;
- data categories;
- special-category conditions;
- access restrictions;
- accuracy/correction;
- retention/deletion;
- individual rights;
- security;
- onward disclosure;
- breach/incident handling;
- termination/withdrawal;
- responsibilities and contact routes.

Where an organisation is acting as a processor, put the required controller-processor contract terms and documented instructions in place.

**Pass condition:** agreements match the actual technical/data flows and are signed/approved before live sharing.

---

# Gate 6 — Data minimisation and progressive disclosure

SafeBed must justify every personal/referral field.

For each field ask:

1. What precise purpose requires it?
2. Is it required at discovery, referral, provider assessment, reservation, or only later?
3. Can an existing authoritative case reference be used instead of copying the data?
4. Can the field be structured rather than unnecessary free text?
5. Which roles can see it?
6. When can it be deleted/anonymised?

Default design:

- anonymous service discovery;
- temporary/minimised `PlacementNeed`;
- provider-specific referral fields only when referral starts;
- protected destination only after authorised placement state;
- no routine device location history;
- no universal shadow homelessness case record.

**Pass condition:** each live personal-data field has a documented necessity and lifecycle.

---

# Gate 7 — Retention, deletion and anonymisation

Do not invent a single “SafeBed retention period” for every record type.

The ICO storage-limitation principle requires personal data not to be kept longer than needed for the stated purpose, with retention periods justified and reviewed.

Define a retention matrix covering at least:

| Record/data class | Purpose | Identifiable? | Retention trigger | Deletion/anonymisation action | Owner |
| --- | --- | --- | --- | --- | --- |
| Temporary search/matching state | Find candidate services | Minimise/avoid | Search/session end or short operational need | Delete/expire | TBD |
| Referral transaction | Provider placement workflow | Usually yes | Purpose/legal/operational rule | Delete or retain under justified schedule | TBD |
| Hold/reservation state | Prevent duplicate allocation / placement | May link to referral | Transaction completion + justified period | Delete/minimise | TBD |
| Protected destination disclosure audit | Safety/accountability | Actor/resource identifiers | Security/governance schedule | Delete/anonymise under policy | TBD |
| Security audit | Detect/investigate misuse | Usually actor identifiers | Security/legal schedule | Delete/anonymise | TBD |
| Aggregate unmet-demand statistics | Service planning/evaluation | Should be de-identified | Defined analysis purpose | Aggregate/anonymise | TBD |

`TBD` is deliberate: durations must come from the real legal/operational purpose, not from a software guess.

Pseudonymised data may still be personal data and must not be treated as automatically outside retention obligations.

**Pass condition:** documented retention schedule, deletion/anonymisation mechanisms and review process exist before live data is retained.

---

# Gate 8 — Transparency and individual rights

Before live use, provide clear and accessible privacy/transparency information appropriate to each user journey.

It should explain, as applicable:

- who is using/controlling the information;
- what is collected;
- why;
- who receives it;
- how long it is kept;
- whether provision is required/optional;
- relevant rights;
- how to ask questions or exercise rights;
- how complaints are handled;
- where automated/structured matching is used and what it does/not do.

Design operational procedures for:

- subject access;
- rectification;
- erasure where applicable;
- restriction/objection where applicable;
- handling requests when multiple organisations hold/shared the data.

A data-sharing agreement may allocate operational tasks, but participating controllers remain responsible for their own compliance.

**Pass condition:** notices and rights-handling procedures are tested against the real data flow.

---

# Gate 9 — Identity, organisation verification and authorisation

Production identity is tracked in a dedicated work item and must be complete before privileged live access.

At minimum require:

- verified organisations;
- MFA for privileged users;
- least privilege;
- deny-by-default authorisation;
- rapid revocation/offboarding;
- machine identities separated from human identities;
- protected-resource read auditing;
- destination disclosure based on verified identity + organisation + policy + placement state;
- no browser/client parameter capable of elevating disclosure rights.

The sandbox `ActorRole` values are not production authentication.

**Pass condition:** role/disclosure matrix and revocation/security tests pass for the pilot identities.

---

# Gate 10 — Safeguarding and protected-accommodation review

Technical privacy controls do not replace safeguarding governance.

Before live use identify:

- safeguarding lead;
- referral/assessment boundaries;
- services that must never be direct-booked;
- protected-location disclosure rules;
- specialist referral escalation;
- out-of-hours escalation;
- incident reporting;
- provider/host suspension route;
- circumstances requiring human discussion rather than automated workflow;
- young-person/child pathway boundaries.

For hosted/private-home accommodation:

- no unrestricted direct host listing;
- accredited/governed host organisation required;
- host vetting/training/risk process remains outside/above the marketplace layer;
- SafeBed does not bypass the hosting organisation's assessment or matching.

**Pass condition:** safeguarding owner approves the live workflows and stop/escalation routes.

---

# Gate 11 — Security and incident readiness

Before live data:

- threat model reviewed;
- security testing completed for pilot scope;
- privileged authentication tested;
- protected-location leakage testing completed;
- audit logging verified;
- secrets/credentials held outside the public repository;
- backup/recovery tested where applicable;
- dependency/supply-chain controls completed for production dependencies;
- incident severity/escalation runbook established;
- personal-data breach assessment/notification route established;
- safeguarding incident and cyber incident routes cross-reference each other where needed.

A breach involving a protected location can be a safeguarding incident even if the technical data volume is small.

**Pass condition:** incident exercise demonstrates that the service can detect, contain, revoke and escalate a realistic high-risk event.

---

# Gate 12 — Availability integrity and manual fallback

Because SafeBed may be used during urgent same-night placement:

- provider remains authoritative for capacity;
- stale/unreachable feed becomes unconfirmed;
- uncertain transaction state is reconciled before retrying blindly;
- holds/reservations are idempotent where electronically supported;
- read-only integrations do not expose fake booking controls;
- provider fallback contact route remains available where safe;
- outage does not silently reuse old capacity as current.

**Pass condition:** outage, stale-data, conflict and recovery exercises pass for each live integration class.

---

# Gate 13 — Synthetic-to-live transition

A synthetic integration may become a live pilot integration only after:

- provider workflow discovery completed;
- source of truth identified;
- integration capability classified;
- disclosure classification approved;
- test fixtures remain synthetic in public CI;
- live credentials are supplied through an approved secret channel;
- data flow is included in the DPIA;
- agreements/roles are resolved;
- provider operational owner signs off;
- rollback/manual fallback is documented.

No production-derived data is required in public CI.

**Pass condition:** live adapter configuration is separately approved without replacing synthetic public test fixtures.

---

# Gate 14 — Controlled operational pilot sign-off

Before the first real referral, hold, reservation or protected-location disclosure, hold a formal pilot readiness review.

Required sign-off areas:

- operational owner;
- provider(s);
- safeguarding;
- data protection / information governance;
- security;
- technical/integration owner;
- lived-experience/co-design review where appropriate;
- pilot evaluation owner.

Confirm:

- exact start/end/scope;
- participating organisations;
- authorised user group;
- support hours;
- incident contacts;
- stop conditions;
- manual fallback;
- evaluation measures;
- post-pilot data handling.

**Pass condition:** explicit go/no-go decision recorded for the bounded pilot.

---

# Immediate stop conditions

Pause/deny live processing if any of the following is true:

- controller/processor responsibility is materially disputed or unknown;
- lawful basis / Article 9 condition is unresolved where required;
- DPIA identifies unacceptable unresolved high risk;
- protected addresses can reach an unauthorised client/browser payload;
- no accountable safeguarding owner exists;
- provider source-of-truth cannot be established;
- SafeBed could double-allocate scarce capacity without provider reconciliation;
- identity/organisation revocation cannot be performed promptly;
- live credentials or sensitive evidence would need to be placed in the public repository;
- no safe fallback exists for a time-critical provider outage;
- a provider integration requires bypassing an essential assessment/safeguarding step.

---

# Evidence register

Keep a lightweight governance register recording whether each gate is:

- `NOT_STARTED`
- `IN_PROGRESS`
- `PASS`
- `BLOCKED`
- `NOT_APPLICABLE` (with reason)

The public repository may track **gate status and non-sensitive principles**.

Do **not** publish confidential evidence merely to prove a gate passed. Private evidence may include:

- signed agreements;
- named private contacts;
- detailed DPIA threat scenarios containing protected operational information;
- provider security architecture;
- credentials;
- live data maps containing protected locations;
- incident evidence;
- real referral examples.

Public status should reference private evidence by a non-sensitive identifier where governance requires traceability.

---

# Definition of “ready for live data”

SafeBed is not ready for live personal/referral data simply because its software passes CI.

It is ready only when the exact processing arrangement has passed the relevant governance gates and has a named organisation willing and able to take responsibility for operating it safely.

Until then:

> **Synthetic data only.**

## References

- ICO — Data protection principles: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/
- ICO — Data minimisation: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/data-minimisation/
- ICO — Storage limitation: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/
- ICO — Controllers and processors: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/controllers-and-processors/controllers-and-processors/
- ICO — Special-category data: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/special-category-data/
- ICO — DPIAs: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/
- ICO — Data Sharing Code of Practice: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/data-sharing-a-code-of-practice/
