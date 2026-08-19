# SafeBed Pilot Discovery Pack v0.1

**Status:** public discovery material. No live pilot is authorised by this document.

SafeBed is exploring whether different emergency-accommodation providers can safely expose sufficiently current availability through a common interface without replacing their existing systems.

The discovery stage is deliberately **pre-procurement, synthetic-data-first and non-committal**.

The immediate objective is to learn whether the proposed model survives contact with real frontline workflows.

---

# 1. Discovery question

The first question is deliberately narrow:

> **Can several materially different emergency-accommodation providers safely expose sufficiently current availability through a common interface without replacing their existing systems?**

Only if that is viable does the next question become:

> **Can an authorised worker safely complete a referral and receive a provider-confirmed placement through the same network?**

A national public application is not the first deliverable.

---

# 2. What SafeBed is testing

Discovery is intended to test assumptions about:

- where current usable capacity is actually recorded;
- who is authoritative for that capacity;
- how quickly information becomes stale;
- whether an apparently empty bed is genuinely usable;
- how referral and acceptance work after hours;
- what information a provider actually needs;
- which suitability criteria can be structured;
- which decisions require human judgement;
- whether time-limited holds are possible;
- how double allocation is prevented;
- how protected accommodation must be represented;
- what existing software already does well;
- where duplicate administration currently occurs;
- whether a common interface would remove or add work.

---

# 3. What discovery is not

Initial discovery is **not**:

- procurement;
- a request to buy SafeBed;
- an offer of a production service;
- a request for live referral data;
- a request for protected addresses;
- a request for database access;
- a request for API credentials;
- a replacement-system migration;
- an attempt to bypass provider safeguarding;
- a request for endorsement.

An organisation can make discovery valuable simply by demonstrating that one of SafeBed's assumptions is wrong.

---

# 4. Discovery phases

## Phase A — standards and sector challenge

Purpose:

- validate the ORUK/HSDS mapping;
- identify existing data sources/workflows;
- find obvious duplication;
- challenge terminology and sector assumptions.

Likely organisation types:

- service-directory/sector infrastructure;
- homelessness-system specialists;
- open-standards specialists.

No service-user data is required.

### Exit condition

SafeBed can describe its proposed interoperability boundary without falsely claiming to replace or extend an existing system/standard that already solves the problem.

---

## Phase B — safeguarding and lived-experience challenge

Purpose:

- identify unsafe information/disclosure assumptions;
- understand digital exclusion;
- test what people actually need late at night;
- challenge intrusive/unnecessary matching questions;
- establish protected-host/refuge boundaries;
- identify reasons an apparently suitable placement may be unacceptable or unsafe.

Likely participants:

- lived-experience/co-production organisation;
- safeguarding specialist;
- hosted-accommodation specialist;
- protected/specialist accommodation expertise.

No protected location or live client information is required.

### Exit condition

The discovery workflow and data questions have been challenged by people other than system owners/developers.

---

## Phase C — local operating discovery

Select **one local area**.

Map the real current process with:

- local-authority homelessness/housing operations;
- information governance;
- safeguarding;
- digital/system ownership;
- frontline/outreach organisations;
- approximately five to ten materially different accommodation providers.

The core exercise is:

> Imagine it is 10:30pm tonight and you have exactly one usable place remaining. A legitimate worker has someone who may need it. Show us every step from first contact until the person arrives or the referral fails.

Capture:

- systems;
- calls/messages;
- forms;
- decisions;
- eligibility checks;
- safeguarding checks;
- duplicate entry;
- waiting;
- after-hours differences;
- availability changes;
- no-shows/failed arrivals;
- fallback routes.

### Exit condition

SafeBed has a current-state process map and source-of-truth map across materially different providers without ingesting real referrals.

---

## Phase D — synthetic interoperability validation

Build/test adapters using synthetic data that reproduce the discovered provider behaviours.

Required synthetic integration classes should include, where discovery confirms them:

- live/transactional API;
- read-only availability feed;
- SafeBed-managed lightweight portal;
- manual-confirmation provider;
- restricted/specialist workflow.

The public repository already contains a synthetic sandbox demonstrating these categories as hypotheses. Real discovery must validate or replace them.

### Exit condition

Synthetic tests represent the real local workflow accurately enough for providers/frontline staff to recognise it.

---

## Phase E — governance decision

Only now decide whether a controlled real-data pilot is justified.

Use the SafeBed live-use governance gates covering:

- accountable operator;
- data-flow inventory;
- controller/processor roles;
- lawful basis / special-category condition where relevant;
- DPIA;
- sharing/processing agreements;
- retention;
- transparency/rights;
- identity/authorisation;
- safeguarding;
- security;
- manual fallback;
- operational go/no-go.

### Exit condition

Either:

- **NO-GO** — discovery stops/changes direction; or
- **GO TO CONTROLLED PILOT** — applicable governance gates explicitly pass for the bounded live scope.

Software completion alone cannot produce this decision.

---

# 5. Local-authority selection criteria

Do not choose a pilot authority based only on headline homelessness numbers.

Score candidate areas against the qualities below.

## Essential

- willing homelessness/housing operational owner;
- willingness to expose the real current process for discovery;
- information-governance participation;
- safeguarding participation;
- existing provider network that can produce at least several different workflows;
- ability to identify relevant system owners/vendors;
- no requirement to use live personal data during initial discovery;
- willingness to preserve existing statutory/provider decisions.

## Desirable

- meaningful out-of-hours placement challenge;
- mix of large/small/manual/digital providers;
- experience of partnership/data-sharing work;
- digital/interoperability interest;
- local frontline/outreach participation;
- willingness to establish baseline measures before a trial;
- existing use of open service-data approaches.

## Negative signals

Do not favour an area because it offers:

- publicity without operational engagement;
- a request to launch nationally before local discovery;
- pressure to skip DPIA/safeguarding work;
- access to real data before purpose/governance is defined;
- only one homogeneous provider workflow;
- an expectation that SafeBed becomes the sole case-management system.

---

# 6. Provider sample design

A useful sample is intentionally heterogeneous.

Aim for approximately 5–10 provider/workflow examples, such as:

1. public night shelter;
2. council-commissioned supported accommodation;
3. small voluntary/community/faith provider;
4. provider using a modern housing/case-management platform;
5. provider relying substantially on telephone/email/spreadsheet/manual process;
6. provider where capacity always requires staff confirmation;
7. specialist/protected accommodation contributor to safeguarding design;
8. accredited hosted-accommodation scheme if available locally.

The sample is not intended to estimate national supply.

It is intended to break the interoperability model early.

---

# 7. Roles needed from a pilot area

Try to include roles rather than only senior sponsors.

## Local authority

- homelessness/housing-options operational lead;
- frontline/out-of-hours worker;
- commissioning/provider-management perspective;
- safeguarding lead/representative;
- information-governance/data-protection representative;
- digital/integration/system owner.

## Providers

- night/frontline worker;
- referral/assessment worker;
- accommodation manager;
- safeguarding responsibility;
- system/data administrator where present.

## Frontline/referral partners

- outreach/support worker;
- organisation that frequently seeks emergency placements;
- relevant specialist referral expertise.

## Co-design/evaluation

- people with lived experience through an appropriate participation model;
- evaluation/evidence expertise.

Do not require all roles in every meeting. The key is that discovery cannot be defined only by management or only by IT.

---

# 8. 90-minute workflow discovery session

## 0–10 min — boundary

Explain:

- SafeBed's hypothesis;
- this is discovery, not procurement;
- no real client data is required;
- provider remains authoritative;
- protected/confidential details should not be shared in a public setting/repository.

## 10–35 min — the 10:30pm walkthrough

Prompt:

> It is 10:30pm tonight. You have one genuinely usable place. Somebody who may be appropriate needs accommodation. Show us exactly what happens.

Capture every action/hand-off.

## 35–50 min — availability/source of truth

Ask:

- where is usable capacity stored?
- how current is it?
- what makes an empty unit unusable?
- who can change/confirm it?
- what happens after a hold, cancellation or no-show?

## 50–65 min — referral/safeguarding

Ask:

- who may refer?
- what must be known before assessment?
- what can be delayed?
- which criteria can be structured?
- which require human discussion?
- when may an address/contact be disclosed?

## 65–75 min — systems/duplication

Ask:

- which applications/spreadsheets/inboxes/forms are touched?
- where is information entered twice?
- what API/export/import capability already exists?
- what action would staff refuse to duplicate in another system?

## 75–85 min — failure story

Prompt:

> Without identifying anybody, describe a recent situation where a person plausibly could have been placed but the placement failed or took far too long.

Identify process rather than blame.

## 85–90 min — single biggest improvement

Ask:

> If one thing could be removed from the current process that makes finding someone somewhere safe tonight unnecessarily difficult, what would it be?

The answer may not be software.

---

# 9. Discovery artefacts

Produce public-safe or private artefacts according to sensitivity.

## Public-safe

Possible public outputs:

- generic integration class;
- anonymised process pattern;
- standards gap;
- synthetic adapter/test;
- non-sensitive friction theme;
- protocol change;
- public backlog item.

## Private/governed

Keep outside the public repository:

- named private contacts;
- provider-confidential workflows;
- protected locations;
- contracts/pricing supplied in confidence;
- real client/referral information;
- detailed data-flow diagrams revealing protected services;
- credentials;
- security architecture supplied in confidence;
- raw meeting notes containing personal/sensitive information.

Public issues may reference private evidence by a non-sensitive identifier where needed.

---

# 10. Provider discovery classification

After discovery assign a provisional integration class.

### A — Native transactional integration

Reliable provider/vendor API can support the required current-capacity and transaction semantics.

### B — Read integration

Capacity can be read electronically but referral/reservation remains in an existing external workflow.

### C — Structured exchange

Safe structured import/export exists, but no suitable live transactional interface.

### D — SafeBed provider portal

No suitable integration exists; a minimal provider-controlled interface could safely maintain the required availability/referral states.

### E — Manual confirmation / contact only

SafeBed may show service information or a potential route, but cannot safely represent capacity as immediately usable without staff confirmation.

### F — Restricted/specialist pathway

Participation requires controlled disclosure and/or specialist workflow that must not be modelled as an ordinary public listing.

### G — Discovery only / do not integrate yet

Safe live availability cannot currently be represented without creating unacceptable operational/safeguarding risk.

The current synthetic implementation uses a smaller technical capability taxonomy. Real discovery may require changing it.

---

# 11. What to measure before changing anything

Establish baselines before SafeBed is introduced.

Candidate baseline measures:

- time from first search/referral attempt to confirmed placement;
- number of providers contacted per successful placement;
- proportion of apparent capacity that proves usable;
- number of repeated data-entry steps;
- percentage of referrals needing clarification;
- common decline/failure reasons;
- after-hours response time;
- no-show/failed-arrival handling;
- number of journeys made to unconfirmed/unavailable accommodation;
- frontline confidence in availability information;
- proportion of searches with no appropriate provision.

Do not turn measurement into surveillance. Use the minimum data needed and design evaluation governance before live collection.

---

# 12. Discovery success criteria

Initial discovery is successful if SafeBed can answer, with evidence:

1. Where does usable capacity come from?
2. How does capacity become stale?
3. Which workflows support electronic transactions and which do not?
4. Which provider decision remains human/authoritative?
5. What information can safely be public?
6. What information requires professional/placement/specialist authorisation?
7. What existing system should SafeBed integrate with rather than duplicate?
8. What additional administration would SafeBed accidentally create?
9. What commonly prevents a same-night placement?
10. Does a bounded synthetic interoperability pilot still make sense?

---

# 13. Stop / redesign conditions

Discovery should pause or substantially redesign the proposal if it establishes that:

- providers cannot reliably know usable capacity at all;
- representing availability would create a false-safety risk greater than the current manual process;
- the common workflow requires SafeBed to bypass provider safeguarding/admission decisions;
- protected services cannot participate without unacceptable disclosure risk;
- SafeBed necessarily requires duplicating entire client case records;
- the core problem is already comprehensively solved by an existing interoperable platform;
- providers would incur significant new duplicate administration with little operational benefit;
- there is no accountable organisation able to run a safe controlled pilot.

Finding one of these is a useful discovery result, not a failed software project.

---

# 14. Initial contact proposition

Use a short, non-sales proposition:

> SafeBed is exploring whether emergency-accommodation providers can safely share sufficiently current availability without replacing the systems they already use.
>
> We are not asking for procurement, real client data or protected accommodation information. We want to understand the real same-night placement workflow, identify what already works, and test whether an open interoperability approach could remove duplicate effort without weakening safeguarding.
>
> The first exercise uses synthetic examples only.

---

# 15. First-contact success

A good first meeting ends with:

- better questions;
- corrected assumptions;
- identified systems/workflows;
- a clear reason to continue or stop;
- possibly permission to run a synthetic process-mapping workshop.

It does **not** need to end with:

- procurement;
- a memorandum of understanding;
- access to live data;
- a production integration;
- public endorsement.

---

# 16. Relationship to SafeBed governance

The discovery pack does not override `live-use-governance-gates-v0.1.md`.

Until the applicable live-use gates explicitly pass for a bounded pilot:

> **Synthetic data only.**
