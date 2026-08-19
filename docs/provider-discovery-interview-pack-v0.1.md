# SafeBed Provider Discovery & Interview Pack v0.1

**Purpose:** understand the real emergency-placement workflow before asking a provider to integrate.

The central question is:

> How does a person actually get from needing somewhere safe tonight to occupying one of your spaces?

This is discovery, not a sales exercise. Do not collect identifiable service-user information during these interviews.

## 1. Who should attend

Where possible include several operational perspectives:

- frontline/night worker;
- referral or assessment worker;
- accommodation manager;
- safeguarding lead;
- data/system administrator;
- technical/integration contact;
- commissioner where relevant.

## 2. Opening statement

Explain that SafeBed is investigating whether emergency-accommodation providers can safely share sufficiently current availability without replacing their existing systems.

Make clear that:

- the provider keeps control of admission decisions;
- no client data is required for discovery;
- the goal is to reduce duplicate work;
- safety and protected information take priority over convenience.

## 3. The 10:30pm exercise

Ask:

> Imagine it is 10:30pm tonight and you have exactly one usable place remaining. A legitimate worker has someone who may need it. Please show us, step by step, what happens from first contact until either the person arrives or the referral fails.

Record every:

- role/person involved;
- system opened;
- telephone call;
- form;
- spreadsheet;
- email/message;
- eligibility check;
- safeguarding assessment;
- decision;
- hand-off;
- duplicated entry;
- delay;
- confirmation.

Do not accept “they make a referral” as a complete process description.

## 4. Inventory questions

Ask:

- How do you know how many usable spaces are available right now?
- Where is that information stored?
- Who can change it?
- Is occupancy linked automatically?
- How often is the number updated?
- Can a nominally empty room be unusable?
- Can staffing, maintenance or safeguarding reduce usable capacity?
- Does capacity change after office hours?
- Are different units suitable for different cohorts?
- What happens after a no-show?
- When does a held/reserved place return to availability?
- How often is the displayed count wrong?

Identify the authoritative source of truth.

## 5. Availability confidence

Ask:

> If your system says one place is free, how confident are you that somebody who meets your criteria can actually use it tonight?

Classify the answer initially as:

- `CERTAIN`
- `USUALLY_CORRECT`
- `STAFF_CONFIRMATION_REQUIRED`
- `LOW_CONFIDENCE`

Then document why.

## 6. Referral workflow

Determine:

- who may refer;
- whether self-referral is possible;
- whether public referrals are accepted;
- whether professional/council referrals differ;
- required referral information;
- optional information;
- assessment steps;
- who decides acceptance;
- expected decision time;
- out-of-hours process;
- emergency exceptions;
- whether acceptance can be provisional.

## 7. Suitability and eligibility

Explore real constraints, including where relevant:

- age;
- household composition;
- children;
- couples;
- accessibility;
- pets/assistance animals;
- service area;
- funding/commissioning rules;
- check-in deadline;
- staffing;
- support requirements;
- safeguarding;
- specialist pathways;
- compatibility with the current environment/residents.

For each rule ask:

> Can this safely be represented as a structured criterion, or does it require human judgement?

## 8. Declines

Ask:

- What are the common reasons for declining a referral?
- Which reasons may safely be returned to the referrer?
- Which reasons must remain provider-internal?
- Can reasons be represented as structured codes?

This is important for both immediate user feedback and aggregate evidence about unmet need.

## 9. Holds and double booking

Ask:

- Can a place be temporarily held?
- Who may request a hold?
- Maximum hold duration?
- What releases it?
- Is the hold represented in the current system?
- What prevents two workers receiving confirmation for the same final place?
- What happens when a person does not arrive?

If holds are not supported, document the current concurrency process.

## 10. Address and information disclosure

For each service/location determine whether the address and contact details may be:

- public;
- visible to verified professionals;
- disclosed only after accepted placement;
- restricted to specialist networks;
- never exposed via ordinary APIs.

Ask:

- Can an approximate area be public?
- When may the exact address be disclosed?
- Can a supporter receive directions?
- Can directions be sent to the guest?
- Are any telephone/email routes protected?
- Are there safety instructions attached to disclosure?

## 11. Hosted/private accommodation

Where hosted accommodation exists, ask:

- who vets hosts;
- who trains hosts;
- who assesses guests;
- who performs the match;
- who can see the host address;
- what support exists overnight;
- what happens if the host withdraws;
- how transport is handled;
- how incidents are managed.

Do not model private hosting as an unrestricted public listing.

## 12. Existing technology

Record every system involved, including manual ones.

For each capture:

- product/system name;
- purpose;
- operational owner;
- vendor where applicable;
- API availability;
- webhook/event capability;
- export/import capability;
- authentication mechanism;
- data owner/controller context;
- contract/integration restrictions;
- technical support route.

Examples may include case-management platforms, housing systems, CRM products, spreadsheets, shared inboxes, forms and paper records.

A spreadsheet is still architecture if staff rely on it.

## 13. Duplicate administration

Ask:

> What information do you enter or update more than once?

Identify:

- repeated service-directory updates;
- duplicate referral entry;
- repeated capacity/void updates;
- commissioner returns;
- repeated emails/calls caused by lack of shared status.

A good SafeBed integration should remove work rather than add another mandatory screen.

## 14. After-hours reality

Ask frontline staff directly:

> What breaks after normal office hours?

Explore:

- unanswered inboxes;
- approval dependencies;
- unavailable managers;
- limited system access;
- transport;
- staffing;
- unexpected late capacity changes;
- no-shows;
- lack of decision authority.

SafeBed is intended to solve “tonight”, so daytime-only workflows are insufficient.

## 15. Failure scenario

Ask:

> Think of a recent case where somebody plausibly could have been accommodated but the placement did not happen. Without identifying the person, what stopped it?

Look for:

- stale availability;
- unknown capacity elsewhere;
- referral delays;
- unsuitable service information;
- transport failures;
- eligibility misunderstandings;
- out-of-hours gaps;
- duplicated/manual steps.

Translate recurring failures into candidate system requirements.

## 16. Data protection

Determine:

- what personal information is required before acceptance;
- what can be deferred until after acceptance;
- what special-category or otherwise highly sensitive data may be involved;
- who may see each category;
- retention requirements;
- existing DPIAs and data-sharing agreements;
- existing controller/processor roles.

Initial integration validation should use synthetic referrals wherever possible.

## 17. Safeguarding

Ask:

- who owns safeguarding decisions;
- what blocks a referral immediately;
- which concerns require live human discussion;
- what must never be public;
- what the out-of-hours escalation route is;
- how incidents are reported;
- which placements must never be direct-booked automatically;
- what must happen before protected-location disclosure.

## 18. Integration classification

Assign one initial class after discovery:

### A — Native integration
Reliable API/webhook support for required operations.

### B — Read integration
Availability can be read electronically; transactions remain manual.

### C — Structured exchange
Safe import/export exists but no usable transactional API.

### D — SafeBed portal
Provider maintains availability/referrals directly through a lightweight SafeBed interface.

### E — Discovery only
The provider can be listed/contacted, but live availability cannot yet be represented safely.

Class A is not required for participation.

## 19. Pilot readiness gate

A provider is ready for inventory-pilot work when SafeBed can answer:

1. What constitutes usable capacity?
2. Which system/person is authoritative?
3. How can SafeBed obtain or receive updates?
4. How quickly can the information become unsafe/stale?
5. Which suitability rules can be structured?
6. What information may be disclosed at each trust level?
7. Who owns operational and safeguarding decisions?
8. Who handles integration failures?

## 20. Stop conditions

Pause integration if:

- nobody can identify authoritative capacity;
- sharing availability would expose a protected location;
- admission authority is unclear;
- SafeBed would bypass a required safeguarding process;
- integration makes information less reliable;
- no accountable operational owner exists.

A provider may remain discoverable while these issues are resolved.

## 21. Outputs from each interview

Produce:

- current-state process map;
- inventory/source-of-truth map;
- data-flow map;
- disclosure classification;
- integration class (A–E);
- friction/duplication log;
- safeguarding constraints;
- minimum pilot backlog.

## 22. Final question

Always finish with:

> If SafeBed could remove one thing that currently makes finding someone a safe place tonight unnecessarily difficult, what would you choose?

Do not assume the answer will be software.
