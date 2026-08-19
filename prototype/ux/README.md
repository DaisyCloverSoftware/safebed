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

## Important limitations

This prototype does not yet prove:

- WCAG conformance;
- screen-reader behaviour across assistive technologies;
- browser compatibility;
- real map/navigation integration;
- production identity/authorisation;
- protected-location security against browser/network inspection in a deployed app;
- mobile performance on low-end devices;
- live provider workflow usability.

Those require dedicated browser/accessibility testing and co-design before issue #5 can be considered complete.

## Public repository rule

Keep all prototype data fictional. Never add real service-user data, referral exports, protected accommodation locations, confidential provider information, credentials or private operational details.
