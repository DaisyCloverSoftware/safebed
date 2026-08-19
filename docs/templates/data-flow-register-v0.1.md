# SafeBed Data Flow Register Template v0.1

**Use:** document the exact systems/organisations/data categories involved in a bounded SafeBed pilot before live processing begins.

This public template must not contain real service-user information, protected accommodation details, credentials, private contact details or sensitive infrastructure information.

## Flow identifier

| Field | Value |
| --- | --- |
| Flow ID | `TBD` |
| Public description | `TBD` |
| Pilot/scope ID | `TBD` |
| Status | `PROPOSED` |
| Last reviewed | `TBD` |
| Accountable owner role | `TBD` |

## Parties and systems

| Question | Answer |
| --- | --- |
| Source organisation/system | `TBD` |
| Receiving organisation/system | `TBD` |
| Further recipient/processor | `TBD` |
| Authoritative source | `TBD` |
| Transport/integration class | `TBD` |
| Manual fallback | `TBD` |

Use public organisational/system descriptions only where this template is committed publicly. Keep private technical/security details in the governed evidence store.

## Purpose

### Precise purpose

`TBD`

### What decision/action fails if this flow does not exist?

`TBD`

### Could SafeBed keep only a reference/status instead of copying the data?

`TBD`

## Data categories

Mark only what this exact flow needs.

- [ ] public service-directory data
- [ ] operational provider/contact data
- [ ] capacity/availability data
- [ ] temporary matching requirements
- [ ] identifiable referral data
- [ ] health/special-category data
- [ ] criminal-offence data
- [ ] protected accommodation/location data
- [ ] authentication/organisation membership data
- [ ] security/audit metadata
- [ ] aggregate/de-identified evaluation data
- [ ] other — describe minimally

### Specific fields / field-register references

`TBD`

Do not paste example real-person values.

## Data protection roles

| Question | Answer |
| --- | --- |
| Source role (controller/processor/etc.) | `TBD` |
| Receiver role | `TBD` |
| Joint-controller arrangement? | `TBD` |
| Processor/sub-processor arrangement? | `TBD` |
| Role decision evidence reference | `TBD` |

## Lawful processing

| Question | Answer |
| --- | --- |
| Article 6 lawful basis | `TBD` |
| Article 9 condition if required | `TBD` |
| DPA 2018/Schedule 1 requirement if applicable | `TBD` |
| Other legal power/duty relevant to organisation | `TBD` |
| DPIA scope/reference | `TBD` |

Do not complete this section from a software developer's guess. It requires accountable review for the actual organisation/purpose.

## Disclosure / access

| Question | Answer |
| --- | --- |
| SafeBed disclosure class | `TBD` |
| Permitted human roles/relationships | `TBD` |
| Permitted machine scope | `TBD` |
| Placement/referral state required | `TBD` |
| Step-up/specialist entitlement required | `TBD` |
| Privileged read audited? | `TBD` |

## Lifecycle

| Question | Answer |
| --- | --- |
| Data enters SafeBed at stage | `TBD` |
| Data is authoritative until | `TBD` |
| Retention trigger | `TBD` |
| Deletion/anonymisation action | `TBD` |
| Retention-policy reference | `TBD` |
| Backup/cache/log copies considered | `TBD` |

## Security / safeguarding

### Main misuse or disclosure risk

`TBD`

### Main integrity/availability risk

`TBD`

### Safeguarding consequence of a mistake

`TBD`

### Controls

`TBD`

### Incident/fallback route

`TBD`

## Accuracy / reconciliation

For capacity/referral status flows answer:

- How does SafeBed know the source is current?
- What timestamp/revision is authoritative?
- What happens if the provider becomes unreachable?
- What happens if SafeBed is unsure whether a write succeeded?
- How is duplicate/replayed write prevented?
- Who resolves disagreement between SafeBed and the source system?

`TBD`

## Individual-rights / transparency implications

- Which privacy notice covers this flow?
- Which party handles correction/access requests?
- How is a correction propagated where data was shared?
- Can an individual reasonably understand that this sharing occurs?

`TBD`

## Agreements

| Requirement | Status/reference |
| --- | --- |
| Data-sharing agreement if required | `TBD` |
| Processor terms if required | `TBD` |
| Provider integration agreement | `TBD` |
| Safeguarding approval | `TBD` |
| Information-governance approval | `TBD` |

Use non-sensitive evidence IDs in the public register; do not commit signed/confidential agreements.

## Decision

Choose one:

- `NOT_READY`
- `SYNTHETIC_ONLY`
- `APPROVED_FOR_BOUNDED_LIVE_PILOT`
- `SUSPENDED`
- `RETIRED`

**Current decision:** `SYNTHETIC_ONLY`

### Public-safe rationale

`TBD`

### Review trigger/date

`TBD`
