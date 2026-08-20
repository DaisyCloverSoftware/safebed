# SafeBed Geospatial Provider Evaluation Template v0.1

**Purpose:** compare future mapping, geocoding, routing or geographic-data options against SafeBed's public-good, privacy, safeguarding, accessibility and operational requirements **before** selecting a production provider.

This is a public-safe template. Do not put API keys, contract terms supplied in confidence, private contacts, protected locations, real user search coordinates or private infrastructure information in this file/repository.

A candidate can be:

- a hosted API/service;
- an open dataset plus SafeBed-side processing;
- a self-hosted component;
- a hybrid/proxy architecture;
- different providers for maps, geocoding and routing.

Do not assume one vendor must provide every function.

---

## 1. Candidate record

| Field | Value |
| --- | --- |
| Candidate/product |  |
| Function assessed | map / tiles / geocoding / routing / geographic dataset / other |
| Evaluation date |  |
| Public documentation reviewed |  |
| Deployment model | hosted / self-hosted / hybrid |
| Proposed SafeBed use |  |
| Reviewer | public role/team only; no private contact data |

---

# 2. Stop-gate questions

A `YES` to any unacceptable condition below blocks selection until the design changes.

| Stop condition | Yes/No | Evidence / mitigation |
| --- | --- | --- |
| Requires protected exact destination in an unauthorised browser |  |  |
| Requires protected exact destination to be sent to the candidate when policy forbids that disclosure |  |  |
| Requires exact user/search-origin retention beyond the SafeBed purpose |  |  |
| Cannot prevent sensitive coordinates/address/referral state entering telemetry/analytics/session replay |  |  |
| Requires secret production credential embedded in a public browser/client |  |  |
| Cannot support an architecture where restricted/sealed routing remains provider controlled |  |  |
| Licensing/terms conflict with required SafeBed operation |  |  |
| No acceptable data-processing/governance route for intended personal-location processing |  |  |
| Product cannot be used accessibly without the visual map |  |  |
| Failure/outage would force SafeBed to present stale capacity as live |  |  |

If a stop condition cannot be resolved, reject the candidate for that SafeBed use.

---

# 3. Data-flow inventory

For each call from SafeBed/client to the candidate, record the **actual fields leaving the SafeBed trust boundary**.

| Flow | Sender | Receiver | Data sent | Precision | Purpose | Retention known? | Protected data possible? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Example: area geocode | SafeBed server | candidate | synthetic town name | area | resolve search area | TBD | no |

Explicitly check for:

- IP address;
- account/application identifier;
- device/browser identifiers;
- precise origin coordinate;
- postcode/address text;
- protected destination coordinate/address;
- map viewport/bounds;
- route start/end;
- referral/placement IDs;
- telemetry/event payload;
- query strings/referrers.

---

# 4. Protected-location compatibility

Score each capability independently.

### Public points

Can the candidate render/route ordinary public service locations without creating unnecessary user tracking?

Assessment:

`PASS / PASS WITH CONTROLS / FAIL / UNKNOWN`

Evidence:

---

### Safe coarse areas

Can SafeBed display a provider-approved `SAFE_AREA` without sending the underlying protected exact point?

Assessment:

`PASS / PASS WITH CONTROLS / FAIL / UNKNOWN`

Evidence:

---

### Placement-authorised destinations

Can SafeBed keep the destination server-side until authorisation and disclose/rout it only after policy permits?

Assessment:

`PASS / PASS WITH CONTROLS / FAIL / UNKNOWN`

Evidence:

---

### Restricted specialist destinations

Can external routing be disabled while provider-controlled instructions/meeting points remain possible?

Assessment:

`PASS / PASS WITH CONTROLS / FAIL / UNKNOWN`

Evidence:

---

### Sealed destinations

Can SafeBed operate without ever sending the sealed destination to this component/client?

Assessment:

`PASS / PASS WITH CONTROLS / FAIL / UNKNOWN`

Evidence:

---

# 5. Search-origin privacy

| Question | Assessment / evidence |
| --- | --- |
| Can town/area search work without precise device location? |  |
| Can precise device location remain optional? |  |
| Can SafeBed reduce precision before making the external call? |  |
| Is a local/offline geographic dataset possible for some lookups? |  |
| Does the service log raw queries/coordinates? |  |
| What is the documented retention period? |  |
| Can telemetry/logging be disabled or contractually controlled? |  |
| Are requests associated with a long-lived user/application identifier? |  |
| Can searches be made server-side rather than exposing vendor credentials/client telemetry? |  |

---

# 6. Tile/map request privacy

Record:

- tile protocol/type;
- what viewport/bounds/zoom information is observable by provider;
- whether requests include application/user identifiers;
- browser third-party cookies/storage behaviour;
- telemetry defaults;
- ability to self-host/proxy/cache under the licence;
- attribution requirements;
- whether map rendering can work using only SafeBed's `PUBLIC_POINT` / `SAFE_AREA` projections.

**Required conclusion:** protected internal exact destinations do not influence third-party tile requests unless that destination has been explicitly authorised for that third party.

---

# 7. Routing/privacy behaviour

| Use case | Candidate supported? | SafeBed policy outcome |
| --- | --- | --- |
| Public destination directions |  |  |
| Placement-authorised ordinary destination |  |  |
| Restricted provider-controlled hand-off |  | external routing must be avoidable |
| Sealed destination |  | candidate must not receive destination |
| Walking |  |  |
| Public transport |  |  |
| Driving |  |  |
| Low-connectivity hand-off |  |  |

Also record whether route queries/waypoints are retained, used for product improvement, associated with identifiers, or shared with subprocessors.

---

# 8. Accessibility

A candidate map cannot replace the complete SafeBed list/workflow.

Evaluate:

- keyboard operation;
- zoom/reflow interaction;
- screen-reader impact;
- focus behaviour;
- reduced-motion compatibility;
- marker/route information not conveyed by colour alone;
- ability for SafeBed to provide equivalent non-map actions;
- touch target behaviour;
- compatibility with narrow/low-end mobile devices.

Result:

`PASS / PASS WITH CONTROLS / FAIL / UNKNOWN`

Required manual testing:

---

# 9. Low-bandwidth / resilience

| Requirement | Assessment |
| --- | --- |
| Reasonable payload size on weak mobile data |  |
| Graceful map failure while list remains useful |  |
| Geocoding outage fallback |  |
| Routing outage fallback |  |
| Static/public metadata usable without map provider |  |
| Does not force stale capacity to be shown as live |  |
| Cache behaviour can exclude protected destinations |  |

---

# 10. Security

Evaluate:

- browser/API credential model;
- key restriction/rotation;
- server-side credential use where appropriate;
- Content Security Policy compatibility;
- subresource integrity/asset provenance where applicable;
- third-party script requirement;
- telemetry/analytics dependencies;
- vulnerability/update process;
- request signing/abuse controls where relevant;
- cache/CDN exposure;
- sensitive error/log payload behaviour.

No production secret should be committed to the SafeBed public repository to demonstrate this section.

---

# 11. Data protection / governance

Before live precise-origin or protected-destination processing, capture in the private governance channel:

- controller/processor role;
- DPA/subprocessor information;
- processing locations/transfers;
- retention/deletion commitments;
- lawful-purpose/DPIA integration;
- security measures;
- incident notification terms;
- individual-rights implications;
- ability to suppress unnecessary processing/telemetry.

Public repository result should state only the non-confidential outcome/gate status where appropriate.

---

# 12. Licensing / sustainability

Record from current public/contractual material:

- licence/terms relevant to use;
- attribution requirements;
- tile/data caching restrictions;
- derived-data restrictions;
- rate limits;
- availability/SLA where relevant;
- predictable cost model at public-service scale;
- free/public-benefit/non-profit programmes if applicable;
- self-host/proxy rights;
- export/migration path;
- vendor lock-in implications.

Funding/cost matters because SafeBed must remain sustainable, but **price does not override safeguarding/privacy stop conditions**.

---

# 13. Operational fit

Score 0–5 where useful:

| Dimension | Score | Notes |
| --- | ---: | --- |
| Protected-location safety |  |  |
| Search-origin privacy |  |  |
| Accessibility |  |  |
| UK geography quality |  |  |
| Walking/transit/driving coverage |  |  |
| Weak-signal usability |  |  |
| Reliability/operability |  |  |
| Integration complexity |  |  |
| Security/provenance |  |  |
| Data-governance fit |  |  |
| Licensing |  |  |
| Long-term public-service sustainability |  |  |
| Exit/migration feasibility |  |  |

A high total score cannot compensate for a failed safeguarding stop gate.

---

# 14. Decision

Choose one:

- `REJECT`
- `RESEARCH FURTHER`
- `SYNTHETIC PROTOTYPE ONLY`
- `CONTROLLED PILOT CANDIDATE`
- `APPROVED FOR DEFINED USE` — requires the relevant governance/security/safeguarding gates outside this template.

Defined SafeBed use:

Decision rationale:

Outstanding risks:

Required controls:

Review/expiry date:

---

# 15. Reassessment triggers

Re-evaluate if:

- provider terms/privacy/telemetry change;
- SafeBed begins sending more precise origin data;
- protected destinations become involved;
- new third-party SDK/scripts are introduced;
- routing mode changes;
- caching/analytics architecture changes;
- a material security incident occurs;
- pricing/licence changes threaten service sustainability;
- a safer open/self-hosted/hosted option becomes practical;
- DPIA/safeguarding review changes the permitted data flow.
