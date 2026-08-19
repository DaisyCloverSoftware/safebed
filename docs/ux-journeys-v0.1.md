# SafeBed UX Journeys v0.1

**Status:** discovery UX specification. No production UI is implied.

The primary design objective is not to expose the system's complexity. It is to make the next safe action obvious during a stressful, time-critical situation.

## 1. UX principles

1. **Tonight first.** The primary task is finding an appropriate safe option now.
2. **No account wall for basic discovery.** A person should be able to look for help without first creating a profile.
3. **No false certainty.** Availability freshness is always visible.
4. **No dead ends.** “No confirmed placement” must lead to other appropriate help routes.
5. **Safety-aware disclosure.** The interface must never reveal protected accommodation because a map component expects coordinates.
6. **Progressive questions.** Ask only what is needed to improve the next decision.
7. **Human-readable reasons.** Explain why an option may not match.
8. **Low bandwidth and old devices.** Core flows must remain lightweight.
9. **Accessible by default.** WCAG-aligned semantics, keyboard navigation, large targets and plain language.
10. **Do not require the person needing accommodation to own a phone.** Supporters and professionals can act on their behalf within appropriate rules.

## 2. Journey A — Person seeking somewhere safe

### Entry screen

Primary action:

**Find somewhere safe tonight**

Secondary actions may include:

- I am helping someone else
- I already have a referral/booking
- Other urgent help

Do not lead with registration, provider branding or a complex service directory.

### Location

Offer:

- use my current location;
- enter postcode/town;
- choose an area manually.

Explain location use in plain language.

Do not request continuous/background tracking.

### Minimum matching questions

Start with only questions that materially affect safe placement, for example:

- Are you looking for a place for yourself or a household?
- Are any children with you?
- Do you need step-free/wheelchair access?
- Do you need to stay together as a couple/family?
- Do you have an assistance animal or pet that must stay with you?

Specialist pathways should be offered carefully and without forcing unnecessary disclosure.

### Results

Show list first-class even when a map is available.

Each card should communicate:

- suitability state;
- availability confidence/freshness;
- approximate distance/travel practicality;
- check-in deadline where relevant;
- referral requirement;
- public-safe access information.

Example:

> **Potentially suitable**
>
> 1 place reported available — confirmed 9 minutes ago
>
> Around 1.3 miles away
>
> Professional referral required
>
> Check-in before 23:30

If the exact location is protected, do not place a precise marker on the map.

### Action

Actions should reflect the provider workflow:

- Call service
- Start referral
- Ask a support worker to refer
- Request place
- Get public directions

Never show “Book now” where a provider assessment is still required.

## 3. Journey B — Supporter helping someone

A supporter may be a member of the public, friend, family member or volunteer who does not hold professional privileges.

### Core differences

- allow search on behalf of another person;
- do not expose privileged provider information;
- provide clear hand-off to professional/statutory routes where required;
- allow safe sharing of public information;
- do not let a supporter bypass referral/safeguarding controls.

### Share action

Where safe, support:

- send public service link;
- copy telephone number;
- share public directions;
- hand off to a professional referral route.

Protected addresses must not become shareable until the placement workflow authorises disclosure.

## 4. Journey C — Verified professional

The professional interface optimises for speed without removing accountability.

### Home screen

Primary actions:

- Find a placement
- Active referrals
- Active holds
- Recent placements

### Placement search

A worker may enter structured information from an existing assessment/case system.

SafeBed should encourage referencing an external case rather than copying unnecessary case history.

### Match view

For every candidate show:

- `SUITABLE`, `POSSIBLY_SUITABLE`, `INSUFFICIENT_INFORMATION` or an explained non-match;
- availability and freshness;
- provider workflow;
- disclosed operational information allowed for that role;
- whether a hold is supported;
- likely response/check-in timing.

### Referral

Before submission:

- display only fields required by that provider/pathway;
- identify mandatory vs optional fields;
- allow the worker to review exactly what will be shared;
- avoid free-text when structured data is safer and sufficient.

### Waiting state

Do not use a generic spinner.

Show a state such as:

**Referral submitted — awaiting provider review**

with:

- submitted time;
- provider reference where available;
- expected/known next step;
- safe fallback contact route where appropriate.

### Hold state

Show an explicit countdown/expiry time:

> **Place held until 23:14**
>
> Complete the provider's required steps before the hold expires.

Expiry must be based on server/provider state, not a purely client-side timer.

### Accepted placement

Show:

**Place confirmed**

Then, only at the permitted disclosure level:

- address/destination;
- arrival deadline;
- check-in instructions;
- travel options;
- provider contact route;
- reservation/provider reference.

## 5. Journey D — Accommodation provider

The provider interface should make participating easier than maintaining another spreadsheet/email process.

### Dashboard

Show:

- current reported capacity;
- freshness status;
- pending referrals;
- active holds;
- expected arrivals;
- stale/unconfirmed data warning.

### Minimal capacity control

For a small provider without an API, updating availability should be extremely fast.

Example:

> **Usable spaces tonight: 3**
>
> `[-] 3 [+]`
>
> Last confirmed: just now

If capacity is nuanced, support separate units/categories rather than hiding complexity behind one misleading count.

### Referral review

Show only information needed to assess the referral.

Actions:

- Accept
- Decline
- Request more information

Where possible require a structured decline reason with an optional confidential internal note.

### Hold controls

Providers can:

- grant hold;
- set/shorten expiry within policy;
- release hold;
- convert accepted hold to reservation;
- see conflicting attempts.

## 6. Journey E — Specialist/restricted provider

The UI must support a service that is discoverable without being locatable.

Public view may show:

> **Confidential specialist accommodation**
>
> Potential pathway available
>
> Location protected
>
> Authorised referral required

Professional view may reveal additional operational data without revealing exact location.

Exact destination is shown only when provider policy and placement state authorise it.

## 7. No confirmed placement journey

Never show a blank page or only “0 results”.

Use:

# No confirmed suitable place found right now

Then explain what was checked and what the person can do next.

Possible actions, depending on context and policy:

- local-authority homelessness assistance;
- outreach route;
- specialist pathway;
- call-to-confirm services;
- broaden search radius;
- change a non-safety-critical preference;
- seek professional help with referral.

Do not pressure the person to remove a legitimate safety/accessibility requirement merely to produce a result.

## 8. Map behaviour

Maps are useful for travel, but risky for protected accommodation.

Rules:

- never render precise protected coordinates client-side;
- use area-level/coarse markers where permitted;
- do not hide exact coordinates in HTML/JSON and merely obscure the visual marker;
- support list-only operation;
- after authorised disclosure, allow hand-off to device navigation rather than building a full routing engine initially.

## 9. Availability language

Prefer:

- **Confirmed 6 minutes ago**
- **Recently confirmed**
- **Call to confirm**
- **Availability cannot currently be confirmed**

Avoid:

- **Available** with no freshness context;
- green/red indicators without accessible text;
- claims that the system cannot substantiate.

## 10. Failure/error language

Technical failures should be translated into safe operational meaning.

Instead of:

`503 upstream timeout`

show:

> **We cannot confirm this service's current availability right now.**
>
> Do not travel there based only on the previous availability shown.

Where safe, provide the provider's normal fallback contact route.

## 11. Low connectivity

The PWA may cache public static service information, but must not present cached capacity as current.

When offline:

- clearly label live availability as unavailable;
- retain safe public contact information when policy allows;
- queue no placement transaction unless the server can confirm it safely;
- never fabricate a successful referral/hold from client state.

## 12. Accessibility

At minimum:

- semantic headings/forms;
- full keyboard operation;
- visible focus;
- screen-reader labels;
- large touch targets;
- no colour-only status communication;
- plain-language error text;
- scalable text;
- reduced-motion support;
- map-equivalent list information;
- reasonable operation on narrow/older devices.

## 13. Language and tone

Avoid blame or bureaucratic language.

Prefer:

- “Needs confirmation” over “invalid availability”
- “This service does not match the information entered” over “ineligible person”
- “No confirmed suitable place found” over “no accommodation available” when coverage may be incomplete

Make coverage limitations explicit.

## 14. UX prototype acceptance scenario

A prototype is successful when a test participant can complete this synthetic journey without coaching:

1. Open SafeBed.
2. Start “Find somewhere safe tonight”.
3. Provide a location.
4. Answer only necessary matching questions.
5. Distinguish confirmed availability from unconfirmed availability.
6. Understand why a service may not match.
7. Start the correct referral/contact route.
8. Understand when a place is held vs actually confirmed.
9. Obtain authorised travel information only after confirmation.
10. Recover safely when no confirmed placement exists.

## 15. Core UX invariant

> The interface must never trade away safety, privacy or truthfulness merely to make the flow appear shorter.
