# SafeBed Data Field & Minimisation Register v0.1

**Status:** discovery privacy-design register using synthetic concepts only. This is not a completed Record of Processing Activities, DPIA, privacy notice, retention schedule or authority to process live personal data.

The purpose of this register is to prevent the API/UI from accumulating personal fields simply because they might be useful someday.

Core rule:

> **A field does not enter SafeBed until a defined stage has a defined purpose that genuinely requires it.**

A real pilot must re-review every field against its lawful basis, Article 9 condition where applicable, provider workflow, controller/processor roles and retention decision.

---

# 1. Data-stage model

SafeBed should distinguish at least these stages:

1. `PUBLIC_DISCOVERY`
2. `TEMPORARY_MATCHING`
3. `REFERRAL_DRAFT`
4. `REFERRAL_SUBMITTED`
5. `PROVIDER_ASSESSMENT`
6. `HOLD_RESERVATION`
7. `ARRIVAL_PLACEMENT`
8. `POST_TRANSACTION`
9. `SECURITY_AUDIT`
10. `AGGREGATE_EVALUATION`

A later-stage field must not automatically be pulled forward into an earlier stage.

---

# 2. Public discovery — no identity required

Public discovery should operate without identifying the person seeking accommodation wherever practical.

| Field/concept | Default status | Purpose | Storage direction | Notes |
| --- | --- | --- | --- | --- |
| Search location / town / postcode | `MINIMISE` | Find geographically practical services | Prefer request/session-only | Do not create routine location history. |
| Device GPS coordinate | `OPTIONAL_EPHEMERAL` | Nearby search when user chooses location access | Prefer transient | Request browser/device permission only when needed; do not silently background-track. |
| Search radius | `NON_PERSONAL` | Control geographic search | May be transient UI state | Can be derived/defaulted. |
| Required night/date | `MINIMUM_REQUIRED` | Match availability for the correct period | Temporary | Same-night is core use case. |
| Account/user identity | `NOT_REQUIRED` | — | Do not collect | Public help must not require registration. |
| Name | `NOT_REQUIRED` | — | Do not collect | No need merely to ask whether help exists. |
| Email/telephone | `NOT_REQUIRED` | — | Do not collect | Can be requested later only for a specific hand-off where necessary. |
| Date of birth | `NOT_REQUIRED` | — | Do not collect | General discovery should use only the minimum age-band/eligibility fact if genuinely needed. |
| NHS number / NI number / government identifier | `PROHIBITED_FOR_DISCOVERY` | — | Do not collect | No service-discovery purpose. |
| Free-text personal story | `AVOID` | — | Do not collect | High risk of unnecessary sensitive data. |

---

# 3. Temporary matching profile (`PlacementNeed`)

Matching should ask for facts that materially change which provider/pathway is potentially usable.

The profile should be temporary and should not become a universal case record.

| Field/concept | Default status | Why it may be needed | Preferred representation |
| --- | --- | --- | --- |
| Household size | `ALLOW` | Find sufficient accommodation capacity | Small integer |
| Adults / children count | `ALLOW_WHEN_RELEVANT` | Family/unit eligibility | Counts, not identities |
| Age band / statutory pathway flag | `ALLOW_WHEN_RELEVANT` | Some services are age-specific; under-18 pathway is materially different | Minimum categorical value; avoid exact DOB until provider/statutory process requires it |
| Wheelchair-accessible accommodation required | `ALLOW` | Avoid unsafe/impossible travel/placement | Boolean/structured requirement |
| Other essential accessibility requirement | `ALLOW_MINIMISED` | Match usable accommodation | Structured where possible; avoid medical diagnosis where functional need is sufficient |
| Assistance animal | `ALLOW` | Accommodation access requirement | Boolean |
| Other pet | `ALLOW` | Can materially affect placement | Boolean/type only if needed |
| Couple needs joint placement | `ALLOW_WHEN_RELEVANT` | Match appropriate unit | Boolean |
| Family unit required | `ALLOW_WHEN_RELEVANT` | Match room/unit type | Boolean |
| Professional referral available | `ALLOW` | Determines access route, not personal worth/suitability | Boolean/pathway state |
| Specialist pathway required | `HIGH_SENSITIVITY_MINIMISE` | May be needed to route to appropriate protected process | Prefer coarse pathway code; do not expose underlying narrative/diagnosis to search clients |
| Health diagnosis | `AVOID_AT_MATCHING` | Usually more information than needed | Ask for functional/support requirement instead unless provider process demonstrably requires diagnosis later |
| Medication list | `AVOID_AT_MATCHING` | Not general service discovery | Provider/clinical process only if necessary and lawful |
| Criminal-history narrative | `AVOID_AT_MATCHING` | High-risk/sensitive and not general discovery data | Provider/statutory process only where genuinely required and lawful |
| Immigration-status narrative | `AVOID_AT_MATCHING` | General narrative unnecessary | Use only the narrow eligibility/funding fact required by an accountable provider/statutory workflow, with legal review |
| Domestic-abuse narrative | `DO_NOT_COLLECT_IN_GENERAL_MATCHING` | Could create serious safety risk | Route to protected specialist workflow using minimum pathway signal |
| Precise sleeping location history | `PROHIBITED_BY_DEFAULT` | Not required to find tonight's option | Do not build tracking history |

### Matching principle

Where a functional requirement is enough, do **not** ask for the medical/social explanation behind it.

Example:

> Ask **“Do you need step-free/wheelchair-accessible accommodation?”**

rather than:

> **“What medical condition causes your mobility problem?”**

---

# 4. Referral draft

Personal data starts only when a real referral process requires it.

Referral fields should be **provider/pathway specific**, not a giant global SafeBed form collecting every field any provider has ever requested.

Potential categories:

| Category | Default direction | Rule |
| --- | --- | --- |
| Person name | `ONLY_IF_PROVIDER_PROCESS_REQUIRES` | Do not require globally before referral. |
| Contact method | `ONLY_IF_NEEDED_FOR_THIS_HANDOFF` | Prefer person-controlled contact where safe. |
| Referring worker identity | `VERIFIED_SERVER_SIDE` | Derive from authenticated session/organisation, not user-entered role text. |
| Existing case/reference ID | `PREFER_REFERENCE_OVER_COPY` | Link to authoritative case system where possible instead of duplicating the whole case. |
| Provider-required structured eligibility facts | `MINIMISE` | Only the fields required for this service/pathway. |
| Free-text referral narrative | `STRONGLY_LIMIT` | Structured fields preferred; free text has high risk of excess sensitive data. |
| Documents/attachments | `NOT_IN_V0.1_BY_DEFAULT` | High data/security complexity; require explicit future use case/governance. |
| Consent/preferences relevant to referral | `RECORD_WHERE_REQUIRED` | Do not confuse a user-facing agreement with the legal basis for all processing. |

Before a field becomes mandatory, provider discovery should be able to explain **what decision cannot be made without it**.

---

# 5. Submitted referral / provider assessment

Once a referral is submitted:

- disclose only to the provider/authorised pathway that needs it;
- maintain a clear authoritative source/reference;
- separate provider-private assessment notes from information that must flow back to the referrer;
- use structured status/reason codes where practical;
- avoid copying whole case-management records into SafeBed;
- do not expose one provider's referral to another provider merely because the same person is searching elsewhere.

## Provider decision data

Potential SafeBed transaction fields:

- referral ID;
- provider/source reference;
- submitted/updated timestamps;
- status;
- structured decline/more-information reason where safe;
- minimal operational message;
- actor/organisation responsible for decision.

Avoid storing detailed safeguarding narratives in SafeBed when the provider's authoritative case system already owns them and SafeBed only needs a status/result.

---

# 6. Hold / reservation

A hold/reservation needs transaction identity, not a copy of the person's life history.

Minimum conceptual data:

- hold/reservation ID;
- provider/service/capacity reference;
- referral reference;
- source revision/concurrency token where needed;
- created/expires/reserved timestamps;
- status;
- authorised actors/organisations;
- arrival deadline where required.

Do not duplicate personal referral fields into the hold record merely for convenience.

---

# 7. Protected destination

Protected location data requires its own lifecycle and policy.

Possible fields:

- provider destination ID;
- address/coordinate/instructions held by the authorised provider/service layer;
- disclosure classification;
- permitted placement/referral relationship;
- disclosure event/audit reference.

Rules:

- do not send an exact protected address/coordinate to the public browser and merely hide it in CSS;
- do not put protected addresses in public/service-discovery caches;
- do not put addresses in push/SMS notification previews by default;
- do not include protected destination data in ordinary analytics/error logs;
- do not make platform support omniscient;
- disclose only after server-side identity/organisation/resource/state policy permits it.

A `RESTRICTED` result can be useful without exposing the destination.

---

# 8. Arrival / placement state

SafeBed should confirm operational arrival without creating surveillance.

Preferred methods:

- provider staff confirms arrival;
- authorised worker confirms according to provider workflow;
- provider integration posts an arrival/status event.

Avoid:

- continuous phone tracking;
- background geofencing merely to prove arrival;
- storing a journey trail;
- requiring a vulnerable person to keep location services enabled.

Potential data:

- reservation/placement ID;
- arrived/not-arrived status;
- authorised confirmation actor/source;
- event time;
- minimal no-show/cancellation state.

---

# 9. Contact / notification data

Contact information is purpose-specific.

Potential purposes include:

- send a secure placement hand-off;
- notify a referring worker of provider decision;
- provider needs a callback route.

Rules:

- collect only the contact channel needed for that purpose;
- do not make marketing consent part of welfare access;
- no marketing/advertising use of service-user contact data;
- protected destination should not appear in lock-screen notification text by default;
- secure links should expire and require appropriate authorisation for sensitive content;
- avoid persistent account creation solely to send one same-night hand-off.

---

# 10. Authentication / professional identity data

Privileged identity information belongs to the production identity model, not referral forms.

SafeBed may need:

- stable IdP subject ID;
- identity issuer;
- SafeBed internal subject ID;
- active/suspended/revoked state;
- organisation membership;
- roles/capabilities;
- specialist programme entitlement;
- authentication assurance/MFA state needed for policy;
- security/revocation timestamps.

Avoid copying:

- whole staff directories;
- unnecessary HR data;
- identity-verification documents into the application database;
- passwords if federated identity can remove the need for SafeBed password storage.

---

# 11. Provider/service data

Most public provider/service-directory data is not service-user personal data, but some provider information can still be sensitive.

Classify separately:

## Public

- public organisation/service name;
- public contact route;
- public service description;
- public location where safe;
- published opening/access information.

## Operational/verified

- professional referral contacts;
- current capacity feed;
- internal provider identifiers;
- integration capability;
- service update/provenance metadata.

## Restricted

- protected service contact;
- protected address/coordinate;
- host identity/address;
- sensitive operational instructions;
- confidential eligibility/safeguarding notes.

Provider data classification must not assume “not client data” means “safe to publish”.

---

# 12. Audit data

Audit should prove sensitive actions without becoming a second copy of the sensitive payload.

Prefer:

- actor/subject ID;
- organisation ID;
- action;
- resource ID/type;
- timestamp;
- result (`ALLOW`/`DENY` etc.);
- reason/policy identifier;
- security context needed for investigation.

Avoid:

- full referral narrative;
- full protected address;
- health information;
- authentication secrets/tokens;
- request/response body dumps.

Sensitive reads (for example protected destination disclosure) should be auditable even though they do not modify a record.

---

# 13. Application / infrastructure logs

Default logs should not contain:

- referral bodies;
- query strings carrying sensitive search/referral fields;
- protected addresses/coordinates;
- access/refresh tokens;
- session cookies;
- identity-provider assertions;
- uploaded documents;
- provider credentials;
- raw SQL rows containing personal data.

Use request/correlation IDs, route names, status codes and non-sensitive error categories instead.

A debug mode that logs full bodies is not acceptable in production merely because it is convenient during an incident.

---

# 14. Aggregate evaluation / unmet demand

SafeBed may be valuable for understanding unmet provision, but analytics must not become a reason to retain identifiable referral history indefinitely.

Prefer aggregate/de-identified measures such as:

- searches with no suitable option by broad area/time/category;
- stale/unconfirmed capacity rates;
- referral outcomes;
- broad structured reason codes;
- time-to-confirmation distributions;
- provider integration reliability;
- broad unmet accessibility/household need categories.

Before publishing small-area/specialist statistics, assess re-identification risk, particularly where counts are low or service categories are sensitive.

Pseudonymised data may still be personal data and must not be treated as anonymous automatically.

---

# 15. Fields SafeBed should resist by default

The following require a strong explicit use case before being added:

- profile photo;
- scanned identity document;
- full medical history;
- medication history;
- full criminal history;
- full immigration history;
- detailed trauma/abuse narrative;
- precise historic rough-sleeping locations;
- continuous GPS history;
- social-media accounts;
- financial/bank details;
- advertising identifiers;
- behavioural profiling;
- contacts/address-book access;
- biometric data;
- voice recordings;
- unrestricted attachments;
- universal free-text “notes about person” field.

The fact another upstream system holds one of these does not mean SafeBed should copy it.

---

# 16. API review rule

Every PR adding a personal/referral field should answer in public-safe terms:

1. **Stage:** At which data stage does it first appear?
2. **Purpose:** What precise SafeBed/provider action requires it?
3. **Minimum:** Could a less identifying/sensitive representation work?
4. **Source:** Who is authoritative for it?
5. **Recipients:** Which roles/organisations can access it?
6. **Retention:** What event ends the need to keep it?
7. **Logging:** How is accidental logging prevented?
8. **Special category:** Does it change Article 9 / DPIA considerations?
9. **Alternative:** Could SafeBed keep only a reference/status instead?
10. **Test:** Is there a regression proving it is absent from earlier/public stages?

A feature PR should not be approved with “we might need it later” as the purpose.

---

# 17. Current discovery acceptance

For synthetic development, this register is sufficient to constrain field design.

For real pilot use, it is **not complete** until:

- real provider-required fields are discovered;
- controller/processor roles are established;
- lawful basis and Article 9 condition are reviewed where relevant;
- DPIA is completed;
- retention/deletion periods are agreed;
- data-sharing/processing agreements reflect the fields;
- privacy/transparency material is produced;
- live API implementation proves public-stage omission and protected-field authorisation.

Until those gates pass:

> **Synthetic data only.**
