# SafeBed Live-Use Gate Register Template v0.1

**Use:** public-safe status register for a bounded SafeBed pilot or live processing arrangement.

This register records **status and non-sensitive rationale only**. It is not the place to paste confidential agreements, personal contacts, protected locations, credentials, real referral examples, security evidence or sensitive DPIA content.

## Status values

- `NOT_STARTED`
- `IN_PROGRESS`
- `PASS`
- `BLOCKED`
- `NOT_APPLICABLE` — requires a recorded reason

## Pilot/processing scope

| Field | Value |
| --- | --- |
| Public pilot identifier | `TBD` |
| Scope/version | `TBD` |
| Planned live start | `TBD` |
| Planned live end/review | `TBD` |
| Public description | `TBD` |
| Gate register owner (role, not private contact) | `TBD` |
| Last reviewed | `TBD` |

Do not put private contact details or confidential partner information in this public template.

## Gate register

| Gate | Status | Public-safe rationale / next step | Private evidence reference (non-sensitive ID only) | Review date |
| --- | --- | --- | --- | --- |
| 0 — Accountable operating arrangement | `NOT_STARTED` | Named accountable organisations/roles required before live data. | `—` | `TBD` |
| 1 — Data-flow inventory | `NOT_STARTED` | Exact live systems/data flows not yet defined. | `—` | `TBD` |
| 2 — Controller / processor roles | `NOT_STARTED` | Requires actual partner/processing arrangements. | `—` | `TBD` |
| 3 — Lawful basis / Article 9 condition | `NOT_STARTED` | Requires reviewed purpose and data categories for the real pilot. | `—` | `TBD` |
| 4 — DPIA | `NOT_STARTED` | Complete before likely-high-risk live processing. | `—` | `TBD` |
| 5 — Sharing / processing agreements | `NOT_STARTED` | Agreements follow role and data-flow analysis. | `—` | `TBD` |
| 6 — Data minimisation / progressive disclosure | `IN_PROGRESS` | Discovery architecture already prefers anonymous/minimised search; real field set still requires partner validation. | `PUBLIC-DESIGN` | `TBD` |
| 7 — Retention / deletion / anonymisation | `NOT_STARTED` | Do not invent durations without real purposes/legal/operational requirements. | `—` | `TBD` |
| 8 — Transparency / individual rights | `NOT_STARTED` | Requires real controller roles and flows. | `—` | `TBD` |
| 9 — Production identity / authorisation | `NOT_STARTED` | Synthetic `ActorRole` is not production identity. | `ISSUE-9` | `TBD` |
| 10 — Safeguarding / protected accommodation | `IN_PROGRESS` | Core disclosure/hosting principles defined; real safeguarding owner/workflow approval still required. | `PUBLIC-DESIGN` | `TBD` |
| 11 — Security / incident readiness | `IN_PROGRESS` | Threat model exists; production security testing and incident exercise not complete. | `PUBLIC-DESIGN` | `TBD` |
| 12 — Availability integrity / manual fallback | `IN_PROGRESS` | Synthetic sandbox proves stale/outage/concurrency behaviour; real integrations not yet validated. | `PR-8` | `TBD` |
| 13 — Synthetic-to-live transition | `NOT_STARTED` | No real provider adapter is authorised yet. | `—` | `TBD` |
| 14 — Controlled pilot sign-off | `NOT_STARTED` | Final go/no-go occurs only after applicable gates pass. | `—` | `TBD` |

## Rules for marking `PASS`

A gate may be marked `PASS` only when:

1. its scope is defined for this exact pilot/processing arrangement;
2. an accountable role/organisation has reviewed it;
3. required evidence exists;
4. unresolved issues do not contradict a SafeBed stop condition;
5. the public status does not expose confidential evidence.

`PASS` must not mean:

- “the code exists”;
- “we intend to do it later”;
- “a similar organisation did this elsewhere”;
- “the synthetic test passed” when the gate requires a real agreement/decision;
- “the evidence was put in a public issue”.

## `BLOCKED` entry format

When a gate is blocked, record only what is safe to publish:

| Field | Example |
| --- | --- |
| Gate | `4 — DPIA` |
| Status | `BLOCKED` |
| Public reason | `Residual-risk decision requires accountable information-governance review.` |
| Needed to unblock | `Named reviewer and documented decision.` |
| Sensitive detail location | `PRIVATE-EVIDENCE-ID` |

Do not describe a protected service, individual case or exploitable security weakness merely to explain the block publicly.

## Review triggers

Re-open relevant gates when there is a material change such as:

- new provider/integration;
- new data category;
- new referral field;
- new use of health/special-category data;
- new identity/authorisation model;
- new protected-accommodation workflow;
- new processor/sub-processor;
- change in retention purpose;
- significant legal/regulatory guidance change;
- security/safeguarding incident;
- major product change affecting matching, disclosure or automated decisions;
- move from pilot to wider rollout.

## Go/no-go summary

Before live referral processing, complete:

| Decision | Value |
| --- | --- |
| All applicable mandatory gates passed? | `NO` |
| Any unresolved stop condition? | `YES — governance not yet complete` |
| Live personal/referral data authorised? | `NO — synthetic only` |
| Protected-location disclosure authorised? | `NO — synthetic only` |
| Final go/no-go decision | `NO-GO` |

The initial template is intentionally `NO-GO`. A real pilot must earn a different decision through evidence and accountable sign-off.
