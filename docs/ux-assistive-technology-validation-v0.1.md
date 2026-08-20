# SafeBed UX assistive-technology validation v0.1

Status: **public-safe validation plan for the synthetic prototype**

This document defines the manual assistive-technology evidence still required before SafeBed issue #5 can be treated as complete.

It is not a claim of WCAG conformance, a completed accessibility audit or evidence that the prototype is suitable for live homelessness use.

All scenarios in this plan use the fictional/synthetic SafeBed prototype only. Do not enter real names, referrals, case information, provider details or protected accommodation information while testing.

## Why manual validation is still required

SafeBed now has automated rendered-browser coverage for keyboard focus, tab behaviour, mobile reflow and fail-safe states, plus Chrome Accessibility Tree assertions for names, descriptions, landmarks, headings, modal focus and hidden content.

Those checks catch important regressions, but they do not reproduce how a person actually experiences a screen reader, speech output, virtual-cursor navigation, rotor/landmark navigation, browser/assistive-technology interaction quirks or cognitive load.

A passing automated accessibility gate therefore means **the tested accessibility contract is intact**, not that SafeBed conforms to WCAG or works well with every assistive technology.

## Evidence record

For every manual session record only public-safe test metadata:

- date;
- operating-system name and exact version;
- browser name and exact version;
- assistive-technology name and exact version;
- input method used (keyboard, touch gestures, switch-equivalent navigation where applicable);
- synthetic route exercised;
- result for each check: `PASS`, `FAIL`, `BLOCKED` or `NOT_TESTED`;
- concise reproduction steps for failures;
- whether the failure prevents understanding, prevents completion, creates a safeguarding risk or is a lower-severity usability issue.

Do not record real user identities, disability/health information or real accommodation/referral details in the repository.

## Minimum representative matrix

The exact software versions must be recorded at test time rather than hard-coded here.

| Environment | Minimum purpose |
| --- | --- |
| Windows + NVDA + Chromium-family browser | Main desktop screen-reader and keyboard journey |
| Windows + NVDA + Firefox | Cross-browser desktop screen-reader behaviour |
| macOS + VoiceOver + Safari | Native macOS/browser accessibility behaviour |
| iOS/iPadOS + VoiceOver + Safari | Touch screen-reader behaviour at narrow/mobile layouts |
| Android + TalkBack + Chromium-family browser | Android touch screen-reader behaviour |

If a combination is unavailable, record it as `BLOCKED` rather than silently treating another combination as equivalent.

## Journey A — public discovery

Start from the first screen as a person seeking somewhere safe.

Required checks:

1. The page title and SafeBed synthetic-prototype context are understandable on first load.
2. The skip link can be reached by keyboard and moves focus to the main content.
3. The four route choices are announced as buttons with concise names; their explanatory descriptions are available without being fused into an unusably long name.
4. Choosing **I need somewhere safe** moves focus to the new screen heading.
5. The location field has an understandable label and can be edited without placeholder-only labelling.
6. Wheelchair and pet requirements are announced as separate checkbox choices with state.
7. Submitting the search moves focus to **Options for tonight**.
8. Results can be navigated efficiently by heading and by button controls.
9. Each repeated result action identifies which synthetic accommodation it belongs to.
10. Availability, suitability and referral requirements remain understandable without relying on colour or map position.
11. A protected specialist result communicates that its location is protected and does not expose an exact destination.
12. **Get referral help** communicates an access pathway rather than making the protected service disappear as an apparent mismatch.

## Journey B — list/map and low-connectivity behaviour

From public results:

1. The List/Map control is identifiable as a two-tab interface.
2. Arrow-key movement between tabs works and the selected tab is announced correctly.
3. The accessible list remains the complete information source; the schematic map does not become required for understanding results.
4. **Simulate connection lost** communicates its changed toggle state.
5. The offline warning is announced without repeatedly trapping or interrupting navigation.
6. Live placement/referral actions become unavailable while offline.
7. Static service information remains navigable.
8. The user can understand that cached/previous capacity must not be treated as current and should not be used as a reason to travel.
9. Restoring the connection communicates the state change and restores appropriate synthetic actions.

## Journey C — modal/referral workflow

Open a result action that produces a dialog.

1. The dialog is announced as a dialog with its current heading as its name.
2. Focus moves into the dialog predictably and lands on the dialog heading/context before action controls.
3. Background content is not navigated as though it were part of the active modal interaction.
4. Escape closes the dialog when supported by the platform/browser combination.
5. Closing returns focus to the exact result action that opened the dialog.
6. Referral submission, provider acceptance, hold and confirmed placement are announced as distinct states rather than one generic “booked” state.
7. A professional role that is not specialist-authorised still does not receive a protected destination after placement confirmation.

## Journey D — provider demonstration

Start from **I provide accommodation**.

1. Focus moves to **Tonight’s synthetic capacity**.
2. The capacity value has an understandable accessible name.
3. Increase/decrease controls identify their purpose and updated values are announced without excessive repetition.
4. **Confirm current availability** communicates the freshness update.
5. Synthetic referral facts are understandable in reading order.
6. Accept and decline are distinct controls.
7. Provider-decision status changes are announced.

## Reflow, zoom and visual-access checks

These checks are required in addition to screen-reader operation:

- 320 CSS-pixel viewport/reflow without two-dimensional page scrolling for ordinary content;
- browser text zoom up to 200% without loss of core controls or meaning;
- page zoom/reflow appropriate to the chosen browser at higher magnification where supported;
- visible keyboard focus on every interactive control;
- content and state remain understandable when colour is not perceived;
- reduced-motion preference does not cause essential information to disappear;
- dark/light colour-scheme behaviour does not hide focus, text or state information.

Automated tests already cover some of these mechanically; the manual session checks whether they remain usable rather than merely measurable.

## Fail criteria

A test is a release-blocking accessibility failure for this prototype tranche if any tested combination shows one or more of the following in a core journey:

- route, form or result controls cannot be reached or operated;
- focus is lost, trapped unexpectedly or moved to hidden content;
- a screen transition is not understandable from focus/context;
- repeated actions have ambiguous names that make the target service unknowable;
- a modal opens without usable context or cannot return the user to the invoking control;
- live/offline availability state cannot be distinguished;
- stale/cached capacity can reasonably be mistaken for confirmed live capacity;
- availability, suitability, referral requirement, hold and confirmed placement collapse into an indistinguishable state;
- protected location information becomes available to an unauthorised/public journey;
- essential information is available only from the schematic map, colour or pointer hover;
- ordinary content requires horizontal page scrolling at the agreed reflow test size;
- a user cannot complete the synthetic core journey with the tested assistive technology.

Lower-severity friction should still be recorded and prioritised, but must not be silently converted into a pass.

## Safeguarding stop conditions

Stop the test and treat the result as a product defect if the synthetic prototype ever:

- implies that it is a live route to emergency accommodation;
- invites entry of real personal/referral data;
- presents unconfirmed capacity as safe to travel to;
- exposes a protected specialist destination to the public/supporter/ordinary-professional journey;
- turns a referral requirement into an unexplained dead end;
- implies that referral submission, provider acceptance or a temporary hold is already a confirmed placement.

## Completion rule for issue #5

Issue #5 should remain open until:

1. the automated synthetic, rendered-browser and Accessibility Tree gates are green on the candidate UX revision;
2. the representative manual matrix above has been executed or any unavailable combination is explicitly recorded as blocked with an agreed substitute/risk decision;
3. release-blocking accessibility defects found by those sessions are fixed and re-tested;
4. a human usability/safeguarding review confirms that the distinctions between service discovery, possible suitability, confirmed capacity, referral, hold and placement are understandable;
5. no real/sensitive data was required to obtain the evidence.

Even after those conditions are met, closing issue #5 would mean the **synthetic prototype acceptance criteria** have been met. It would not certify the future production service as WCAG-conformant or safe for live personal data.