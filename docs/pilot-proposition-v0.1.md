# SafeBed Emergency Accommodation Interoperability Pilot v0.1

**Status:** proposal for discovery and sandbox validation.

## 1. The problem

When somebody needs somewhere safe to sleep tonight, information about suitable accommodation can be fragmented across councils, outreach teams, charities, shelters, specialist services, case-management systems, spreadsheets and telephone calls.

The operational question is:

> Which suitable place genuinely has capacity now, can this person access it, and what needs to happen to get them there safely?

SafeBed proposes to test whether that question can be answered more reliably without asking providers to replace the systems they already use.

## 2. What SafeBed is

SafeBed is a proposed real-time emergency-accommodation discovery, referral and interoperability layer.

Where provider workflows permit it, SafeBed aims to support:

`DISCOVER -> MATCH -> CONFIRM -> REFER -> HOLD -> RESERVE -> ARRIVE`

## 3. What SafeBed is not

SafeBed is not:

- a homelessness CRM replacement;
- a replacement for council statutory systems;
- an unrestricted private-host marketplace;
- a commercial accommodation broker;
- a paid referral network;
- a system that autonomously makes safeguarding or admission decisions.

## 4. Public-good commitment

SafeBed is a welfare project.

- People seeking help will not be charged to use SafeBed.
- Frontline workers will not pay per referral.
- Providers will not pay per placement.
- There will be no referral commission.
- There will be no paid search ranking.
- Personal information will not be sold or commercially exploited.

Operational funding may be necessary for a sustainable service, but the placement of a vulnerable person is not a monetisation event.

## 5. Standards-first approach

SafeBed intends to build on Open Referral UK / HSDS for service and capacity data.

This matters because the pilot should test interoperability rather than require organisations to adopt a new proprietary service-directory format.

SafeBed's proposed contribution is the transactional and safeguarding layer around existing service data: freshness, suitability, disclosure, referrals, holds, reservations and arrival.

## 6. Pilot question

The first pilot asks one deliberately narrow question:

> Can several materially different emergency-accommodation providers safely expose sufficiently current availability through a common interface without replacing their existing systems?

If yes, the next question is:

> Can an authorised worker complete a safe referral and receive a provider-confirmed placement through that network?

## 7. Desired pilot participants

A useful pilot area would include:

### One local authority

To provide statutory context, local operating knowledge, commissioning perspective and relevant system ownership.

### Five to ten accommodation providers

Preferably representing different accommodation models and technical maturity.

### One or two frontline/outreach organisations

To test the workflow from the perspective of people actually trying to secure a placement at short notice.

### A specialist safeguarding partner

To challenge assumptions around protected accommodation and high-risk referrals.

### Lived-experience participation

To ensure the workflow is shaped by the realities of homelessness rather than only by organisational process.

### Relevant technology vendors

Where existing provider or council systems require vendor-supported integration.

## 8. Phase 1 — Discovery

No live service-user information is required.

For each participating organisation SafeBed maps:

- current placement workflow;
- availability source of truth;
- eligibility/suitability rules;
- referral process;
- after-hours process;
- safeguarding constraints;
- disclosure restrictions;
- existing technical systems;
- duplicate administration and avoidable friction.

The output is a shared current-state model and integration classification.

## 9. Phase 2 — Inventory sandbox

Providers expose or manually maintain live or representative capacity data without processing real referrals.

SafeBed proves it can represent:

- available;
- limited;
- full;
- unknown;
- stale;
- confirmation-required

across materially different providers.

Synthetic personas are used to test suitability matching.

## 10. Phase 3 — Referral sandbox

Synthetic referrals exercise:

`SEARCH -> MATCH -> REFERRAL -> PROVIDER DECISION -> HOLD -> RESERVATION`

The goal is to prove workflow and concurrency before vulnerable-person personal data is introduced.

## 11. Phase 4 — Controlled operational trial

This phase only proceeds after appropriate:

- safeguarding approval;
- data-protection assessment;
- information-governance agreement;
- provider agreement;
- access-control design;
- incident and escalation procedures;
- lived-experience review.

A tightly controlled group of authorised workers then uses SafeBed inside existing operational procedures.

Provider admission and safeguarding decisions remain intact.

## 12. Technical participation options

A provider should not need to replace its current system.

Initial integration options are:

1. existing API + webhooks;
2. vendor-supported integration;
3. secure read/polling feed;
4. structured import/export;
5. lightweight SafeBed provider portal;
6. discovery-only listing where live availability cannot yet be exposed safely.

## 13. Safeguarding and disclosure

Not all accommodation information can be public.

SafeBed will support at least:

- `PUBLIC`
- `VERIFIED_USER`
- `PLACEMENT_AUTHORISED`
- `RESTRICTED`
- `SEALED`

This allows specialist accommodation to participate without exposing protected locations or contacts.

## 14. Hosted accommodation

SafeBed will not directly connect vulnerable people with arbitrary individuals offering spare rooms.

Hosted accommodation may participate only through an organisation responsible for appropriate host vetting, guest assessment, matching, safeguarding and ongoing support.

## 15. What the pilot measures

The pilot should establish baselines before final targets are set.

Candidate measures include:

- percentage of participating capacity with known freshness;
- percentage of displayed availability subsequently confirmed;
- search-to-placement time;
- repeated/duplicate data entry;
- stale listings intercepted;
- attempted concurrency conflicts;
- referral decision time;
- acceptance/decline reason patterns;
- searches with no suitable placement;
- after-hours effectiveness;
- provider administrative burden;
- user-reported ease of use;
- safeguarding/privacy incidents caused by the system.

A successful pilot must produce **zero unauthorised disclosure of protected accommodation information**.

## 16. Failed searches are useful evidence

A search with no suitable result can reveal provision gaps when aggregated safely.

Examples may include shortages in:

- accessible accommodation;
- family units;
- couple-friendly provision;
- pet-compatible provision;
- age-specific provision;
- specialist support;
- geographic coverage;
- after-hours access.

This data must be aggregated and de-identified before it is used for planning or reporting.

## 17. What SafeBed initially asks of a council

At discovery stage, the request is not procurement and does not require production adoption.

We seek:

- access to appropriate operational staff;
- help identifying a small provider group;
- safeguarding/information-governance participation;
- permission to document the current process;
- technical discussion with relevant system owners;
- feedback on the interoperability model.

Only after discovery should either party decide whether an operational trial is justified.

## 18. What SafeBed initially asks of providers

- Show how the real placement process works.
- Identify the authoritative availability source.
- Explain which information must remain protected.
- Identify duplicate work and delays.
- Help test a common availability model.
- Challenge unsafe or unrealistic assumptions.

Providers retain control over admission decisions.

## 19. Governance required before live use

Before real-person operational use the pilot needs, at minimum:

- named safeguarding ownership;
- named information-governance ownership;
- DPIA and appropriate legal-basis analysis;
- provider/data-sharing agreements;
- role/access policy;
- disclosure policy;
- retention policy;
- audit policy;
- security incident process;
- safeguarding incident process;
- escalation and service-continuity process.

Technical readiness alone is insufficient.

## 20. Target demonstration

A successful controlled pilot should eventually demonstrate:

> An authorised worker is supporting someone who needs somewhere safe tonight.
>
> SafeBed finds participating services, excludes clearly unsuitable options, identifies one with current usable capacity, sends a referral, receives provider acceptance, places a time-limited hold where supported, provides authorised travel information, and records arrival.
>
> The provider's own system remains its source of truth. No protected information is disclosed incorrectly. Nobody pays SafeBed for the referral.

## 21. Initial proposition

SafeBed is looking for one area willing to investigate the problem rigorously, not for immediate national adoption.

The pilot question is:

> Can we make it materially easier to find a genuinely available, suitable and safe place for somebody tonight without making frontline organisations maintain yet another disconnected system?

If that can be proven locally, openly and safely, there is a credible foundation for wider interoperability.

## References

- Open Referral UK: https://openreferraluk.org/
- HSDS schema reference: https://docs.openreferral.org/en/latest/hsds/schema_reference.html
- National Plan to End Homelessness: https://www.gov.uk/government/publications/a-national-plan-to-end-homelessness
