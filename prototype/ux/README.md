# SafeBed Synthetic UX Prototype v0.1

This directory contains a dependency-free, fictional UX prototype for early workflow review.

It is **not connected to real accommodation data** and must not be used to submit real personal/referral information.

## Review locally

Serve the repository with any basic static web server and open `prototype/ux/` in a browser.

For example, from the repository root with Python available:

```sh
python3 -m http.server 8080
```

Then open the local path for `prototype/ux/` through that server.

Do not deploy this prototype as a real service. It has no production authentication, backend, data protection controls or real provider integrations.

## Journeys included

### Person seeking somewhere safe

- no account wall;
- location input;
- progressive wheelchair/pet questions;
- synthetic suitability/availability results;
- list and schematic map;
- no-result fallback panel;
- offline fail-safe demonstration.

### Supporter helping someone

Uses the same public-safe result surface. Protected specialist accommodation remains non-locatable and routes toward referral help rather than disclosing a destination.

### Verified professional demonstration

- provider capability-aware actions;
- synthetic referral submission;
- provider acceptance;
- time-limited-hold concept;
- confirmed-placement state;
- restricted destination remains protected for the ordinary professional role in this prototype.

The role itself is only a UI demo state and is **not authentication**.

### Accommodation provider demonstration

- lightweight available-space control;
- freshness confirmation;
- synthetic referral review;
- accept/decline demonstration.

## Map safety

The map is intentionally schematic and non-geographic.

Public synthetic services use arbitrary visual marker positions. The restricted specialist service receives only a coarse `region` shape and has no destination object in the browser fixture.

This is deliberate: a future real map must not receive protected exact coordinates and merely hide them visually.

## Offline behaviour

Use **Simulate connection lost** on the results screen.

The prototype then:

- labels live availability as unconfirmed;
- disables live placement actions;
- keeps cached/static service information visible;
- warns not to travel based on a previous capacity count.

## Accessibility evidence

The prototype has two dependency-free rendered Chrome regression layers in addition to the synthetic model tests.

`node scripts/browser-ux-smoke.mjs` exercises the visible interaction contract, including:

- focus transfer between views;
- search/result flow;
- protected-specialist behaviour;
- List/Map keyboard operation;
- offline fail-safe behaviour;
- dialog interaction;
- provider controls;
- narrow-viewport overflow.

`node scripts/browser-ux-a11y.mjs` inspects Chrome's rendered Accessibility Tree and exercises:

- skip link and main-landmark exposure;
- concise route-button names with separate descriptions;
- heading level and screen-transition focus;
- service-specific names for repeated result actions;
- offline toggle state;
- dialog name, focus entry and focus restoration;
- provider capacity accessible naming;
- hidden-view exclusion from the accessibility tree;
- 320px reflow;
- reduced-motion behaviour.

These automated checks are regression evidence, **not a WCAG-conformance claim and not a substitute for real screen-reader use**.

The remaining manual assistive-technology acceptance plan is documented in [`../../docs/ux-assistive-technology-validation-v0.1.md`](../../docs/ux-assistive-technology-validation-v0.1.md). It defines representative NVDA, VoiceOver and TalkBack coverage, core synthetic journeys, failure criteria and safeguarding stop conditions.

## Important limitations

This prototype does not yet prove:

- WCAG conformance;
- acceptable screen-reader behaviour across the representative manual assistive-technology matrix;
- browser compatibility beyond the automated tested browser plus future manual matrix;
- real map/navigation integration;
- production identity/authorisation;
- protected-location security against browser/network inspection in a deployed app;
- mobile performance on low-end devices;
- live provider workflow usability.

Issue #5 should remain open until the documented manual assistive-technology and human usability/safeguarding validation has been completed and release-blocking findings have been re-tested.

## Public repository rule

Keep all prototype data fictional. Never add real service-user data, referral exports, protected accommodation locations, confidential provider information, credentials or private operational details.
