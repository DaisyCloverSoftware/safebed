## Summary

<!-- Describe the public-safe change and why it is needed. -->

## Safety and privacy checklist

- [ ] This PR contains **no real service-user/referral data**.
- [ ] This PR contains **no protected accommodation address or precise protected coordinates**.
- [ ] This PR contains **no credentials, tokens, secrets or production database content**.
- [ ] This PR contains **no confidential provider procedures, contacts or information supplied in confidence**.
- [ ] Any examples, fixtures, screenshots and logs are synthetic/public-safe.
- [ ] Security vulnerabilities with sensitive exploitation details have been reported privately rather than described here.

## SafeBed invariants

Where relevant:

- [ ] The provider remains authoritative for inventory/admission decisions.
- [ ] Stale or unreachable availability is not presented as confirmed.
- [ ] Protected-location disclosure is enforced server-side, not merely hidden visually.
- [ ] Personal information is minimised and only requested when necessary.
- [ ] Matching outcomes are explainable and do not replace required human safeguarding decisions.
- [ ] No paid ranking, referral commission or placement fee is introduced.
- [ ] Failure paths degrade safely.
- [ ] Accessibility and low-connectivity behaviour have been considered.

## Validation

<!-- Describe tests/review performed. Do not paste sensitive logs or production data. -->
