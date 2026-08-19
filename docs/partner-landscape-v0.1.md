# SafeBed Partner Landscape v0.1

**Status:** public discovery map. No organisation listed here is claimed to endorse SafeBed, participate in SafeBed, or have been contacted by SafeBed.

This document identifies organisations whose existing roles, systems or experience are relevant to validating SafeBed's interoperability and safeguarding assumptions.

Only official organisational webpages/public contact routes are listed. Do not add private individuals' contact details, unpublished partner information, confidential system details or outreach correspondence to this public document.

## 1. Homeless Link

### Why relevant

Homeless Link is a high-priority sector discovery conversation because its current services span several parts of the ecosystem SafeBed must understand rather than duplicate:

- **Homeless England** — a national directory of homelessness services in England;
- **In-Form** — homelessness-sector case-management tooling;
- **StreetLink** — rough-sleeper alert/referral pathway to local outreach;
- **CHAIN** — multi-agency rough-sleeping information in London.

SafeBed's questions are not “can we replace these systems?” but:

- Which service-directory information can already be reused?
- Where is accommodation capacity represented today?
- Which referral/status information can safely interoperate?
- Which data should remain in the existing case-management system rather than be copied into SafeBed?
- What would create additional administrative burden for frontline organisations?

### Desired discovery role

**Sector/domain + existing-system discovery**

### Official public routes

- https://homeless.org.uk/about-us/contact-us/
- https://homeless.org.uk/homeless-england/
- https://homeless.org.uk/what-we-do/in-form/
- https://homeless.org.uk/what-we-do/streetlink-and-chain/

---

## 2. Open Referral UK

### Why relevant

Open Referral UK (ORUK) is the current UK service-directory interoperability baseline SafeBed intends to reuse rather than compete with.

The key discovery questions are:

- Is SafeBed mapping current ORUK 3.0 concepts correctly?
- How should SafeBed remain compatible with future UK-profile evolution?
- What is the best way to align capacity concepts with international HSDS 3.1+ without falsely presenting them as current ORUK 3.0 fields?
- Which proposed SafeBed concepts genuinely need a separate placement-transaction layer?
- Should any future capacity/profile work be proposed upstream rather than made SafeBed-specific?

### Desired discovery role

**Standards review**

### Official public routes

- https://openreferraluk.org/developers/
- https://openreferraluk.org/developers/api
- https://openreferraluk.org/info/contact

---

## 3. Street Support Network

### Why relevant

Street Support Network already connects people experiencing homelessness, support services and local networks across participating UK locations.

SafeBed should understand:

- how local service information is currently collected and maintained;
- how local partnerships are formed;
- how service providers experience directory-update burden;
- where live accommodation availability would complement rather than duplicate existing public discovery;
- which local networks might eventually provide a suitable discovery environment.

### Desired discovery role

**Local-network/service-discovery insight**

### Official public routes

- https://www.streetsupport.net/
- https://www.streetsupport.net/about/
- https://www.streetsupport.net/locations/
- https://www.streetsupport.net/resources/

---

## 4. Depaul / Nightstop

### Why relevant

Nightstop is a key precedent for the **hosted accommodation boundary**.

SafeBed explicitly rejects an unrestricted marketplace where arbitrary members of the public list spare rooms for vulnerable people. Nightstop demonstrates a governed model in which emergency accommodation can involve volunteer hosts while assessment, accreditation/training, matching and support sit around the placement.

Discovery should focus on:

- which decisions must remain with the hosting organisation;
- what can safely be represented as “potential hosted capacity”;
- when a host address may be disclosed;
- what a digital system must never bypass;
- how no-shows, host withdrawal, travel and out-of-hours support work operationally.

### Desired discovery role

**Hosted-accommodation safeguarding review**

### Official public routes

- https://www.depaul.org.uk/nightstop/
- https://www.depaul.org.uk/nightstop-faqs/
- https://www.depaul.org.uk/contact-us/

---

## 5. Women's Aid / Routes to Support

### Why relevant

Routes to Support is an especially important precedent for **restricted service and vacancy information**.

It demonstrates that a service can be discoverable within an authorised network while detailed vacancy/referral information is not simply made public. SafeBed should learn from that model rather than assume every available space belongs on a public map.

Discovery should ask at the level of principles and safety design:

- how should protected accommodation appear to unauthorised/public users, if at all?
- how should vacancy information be separated from protected location information?
- what must happen before location/contact disclosure?
- what risks arise from search enumeration or overly precise geographic information?
- which specialist workflows should SafeBed route toward rather than integrate directly?

SafeBed should **not** request confidential refuge data merely to prototype its service.

### Desired discovery role

**Protected-accommodation / specialist safeguarding review**

### Official public routes

- https://womensaid.org.uk/what-we-do/i-work-with-survivors/routes-to-support/
- https://womensaid.org.uk/what-we-do/i-work-with-survivors/dedicated-service-for-professionals/
- https://womensaid.org.uk/what-we-do/i-work-with-survivors/routes-to-support/access-to-routes-to-support/

---

## 6. Groundswell

### Why relevant

SafeBed must not be designed only from the viewpoint of council systems, accommodation providers or developers.

Groundswell places lived experience of homelessness at the centre of its work and uses participation/co-production approaches. A SafeBed workflow needs challenge from people who understand realities such as:

- what information matters when looking for somewhere late at night;
- which questions feel unsafe or unnecessarily intrusive;
- reasons somebody may reasonably reject an offered placement;
- digital exclusion and device/data/battery constraints;
- how “successful placement” differs from “a system returned a result”.

### Desired discovery role

**Lived-experience co-design / participation**

Participation must be meaningful and appropriately supported; it must not be treated as a ceremonial user-testing step.

### Official public routes

- https://groundswell.org.uk/
- https://groundswell.org.uk/participation/
- https://groundswell.org.uk/our-approach-to-research/
- https://groundswell.org.uk/contact/

---

## 7. Centre for Homelessness Impact

### Why relevant

SafeBed should be evaluated on outcomes and operational effect, not only whether the software works.

The Centre for Homelessness Impact works on evidence, evaluation, homelessness data and Test & Learn approaches with public/voluntary-sector delivery organisations.

Potential discovery questions include:

- what should be measured before a pilot starts?
- how do we distinguish faster administration from better outcomes?
- how should failed/no-placement searches be evaluated as evidence of unmet provision?
- what unintended effects should be measured?
- how can a local pilot be designed so it produces useful learning rather than only a product demonstration?

### Desired discovery role

**Evaluation/evidence design**

### Official public routes

- https://www.homelessnessimpact.org/
- https://www.homelessnessimpact.org/how-we-can-help
- https://www.homelessnessimpact.org/test-and-learn
- https://www.homelessnessimpact.org/contact-us

---

## 8. MRI Software / Housing Options / Housing Jigsaw

### Why relevant

MRI's current Housing Options/Housing Jigsaw products are part of the council homelessness/casework landscape SafeBed may encounter.

SafeBed must not assume councils will replace their existing statutory/case-management workflow. Discovery should establish:

- which SafeBed events should be references/links rather than copied case records;
- what supported integration mechanisms exist;
- whether external referral/status data can be exchanged without manual re-entry;
- which system should own each state;
- how local-authority workflow and audit requirements affect a SafeBed adapter.

This is an **integration/architecture conversation**, not a request to expose customer data or reverse-engineer a proprietary system.

### Desired discovery role

**Incumbent council-system interoperability**

### Official public routes

- https://www.mrisoftware.com/uk/solutions/social-housing/housing-options/
- https://www.mrisoftware.com/uk/housing-jigsaw-faqs/
- https://www.mrisoftware.com/uk/contact/

---

## 9. SortStay

### Why relevant

SortStay is a material adjacent product and should not be ignored.

Its current public platform describes a council out-of-hours emergency-accommodation workflow involving:

- structured placement needs;
- live availability;
- suitable options;
- confirmed bookings;
- booking/audit records;
- pre-agreed commercial accommodation inventory.

This overlaps with part of SafeBed's proposed transaction flow.

The discovery question is therefore not “how can SafeBed recreate SortStay?” but:

- which council/commercial-inventory problem is already solved well?
- could SafeBed interoperate with an existing booking source rather than duplicate it?
- where does SafeBed's cross-sector/public-good scope remain different — for example shelters, voluntary services, specialist protected accommodation, accredited hosted accommodation and public/supporter discovery?
- how can SafeBed preserve its no-commission/no-paid-ranking welfare principles when interoperating with commercial accommodation systems?

### Desired discovery role

**Adjacent-platform / interoperability / duplication review**

### Official public route

- https://sortstay.com/

---

## 10. Pilot local authority — role not yet selected

### Why a local authority is required

A credible English pilot needs the relevant local-authority homelessness/housing function because SafeBed must operate alongside statutory homelessness duties, council commissioning/procurement and existing referral/case-management routes.

The first authority should **not** be selected simply because it has the largest rough-sleeping count or the most publicity.

### Desired characteristics

Prefer an area with:

- an identifiable homelessness/housing-options operational owner;
- a genuine out-of-hours placement problem to investigate;
- a manageable but varied local provider network;
- willingness to document the real process rather than only the official process;
- information-governance and safeguarding participation;
- technical/digital willingness to discuss interoperability;
- at least several materially different accommodation workflows;
- interest in evaluation and learning rather than immediate procurement;
- no requirement for SafeBed to ingest live personal data during initial discovery.

### Do not optimise for

- “most beds”;
- “biggest council”;
- fastest route to publicity;
- willingness to skip governance;
- a council that requires SafeBed to replace its entire existing system before discovery can begin.

### Initial public route

Use the selected authority's official homelessness/housing/digital channels only after the authority-selection criteria are documented and reviewed.

No authority is identified as a SafeBed pilot partner in this version.

---

# 11. Provider sample for a local discovery pilot

The first provider sample should be deliberately heterogeneous rather than statistically representative.

Aim to understand approximately five to ten workflows including, if locally available:

- public night shelter;
- commissioned supported accommodation;
- small community/faith/voluntary provider;
- provider using a modern case/property API or platform;
- provider using largely manual/spreadsheet/telephone processes;
- service requiring staff confirmation even when nominal capacity exists;
- specialist/protected service consulted on design without exposing confidential inventory;
- accredited hosted-accommodation scheme where appropriate.

The goal is to challenge the interoperability model, not collect a national bed census.

---

# 12. Contact order

A sensible discovery order is:

## Stage A — Standards and sector challenge

1. Open Referral UK
2. Homeless Link
3. Street Support Network

Purpose: validate that SafeBed is not duplicating existing directory/data work and correct the discovery model before approaching a pilot area.

## Stage B — Safeguarding and lived experience

4. Groundswell or equivalent lived-experience partner
5. Depaul / Nightstop
6. Women's Aid / Routes to Support principles discussion

Purpose: identify unsafe assumptions before a public/professional workflow is treated as settled.

## Stage C — Local operating environment

7. one selected local authority
8. five-to-ten local providers/frontline organisations

Purpose: map the real 10:30pm placement workflow and inventory sources.

## Stage D — Incumbent/adjacent technology

9. relevant case-management vendor(s), such as MRI where present locally
10. adjacent booking/inventory platform(s), such as SortStay where relevant

Purpose: integrate or coexist rather than unnecessarily reproduce working systems.

## Stage E — Evaluation

11. Centre for Homelessness Impact or another appropriate independent evaluation partner

Purpose: establish outcome/baseline methodology before controlled live use.

The exact order should adapt to what discovery reveals.

---

# 13. What SafeBed should not ask for during initial contact

Do not ask for:

- service-user names or cases;
- referral exports;
- protected addresses;
- live refuge vacancy feeds;
- credentials/API keys;
- production database access;
- customer contracts;
- confidential vendor documentation;
- private staff lists;
- immediate procurement;
- endorsement of an unfinished product.

Initial discovery can be useful using process descriptions, synthetic examples and public documentation.

---

# 14. What would count as a successful first conversation

A successful discovery conversation produces one or more of:

- a false assumption corrected;
- an existing standard/system identified for reuse;
- a safeguarding boundary clarified;
- a real workflow/friction point documented;
- an appropriate next organisational role identified;
- confirmation that the problem is already solved in that context;
- a reason not to build a proposed feature;
- willingness to participate in a synthetic process-mapping session.

A sales lead or endorsement is **not** the success criterion.

## Public sources

- Homeless Link: https://homeless.org.uk/
- Open Referral UK: https://openreferraluk.org/
- Street Support Network: https://www.streetsupport.net/
- Depaul / Nightstop: https://www.depaul.org.uk/nightstop/
- Women's Aid / Routes to Support: https://womensaid.org.uk/what-we-do/i-work-with-survivors/routes-to-support/
- Groundswell: https://groundswell.org.uk/
- Centre for Homelessness Impact: https://www.homelessnessimpact.org/
- MRI Housing Options: https://www.mrisoftware.com/uk/solutions/social-housing/housing-options/
- SortStay: https://sortstay.com/
