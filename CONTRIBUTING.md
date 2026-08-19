# Contributing to SafeBed

SafeBed is in early discovery. Public scrutiny is welcome, but safety and privacy take priority over speed.

## Before contributing

Please read:

- `README.md`
- `SECURITY.md`
- `docs/security-privacy-safeguarding-model-v0.1.md`

## Never submit real sensitive data

Do not put any of the following in an issue, pull request, commit, fixture, screenshot, log or attachment:

- real service-user names or identifying information;
- real referral/case records;
- protected accommodation addresses or coordinates;
- confidential provider procedures or non-public contacts;
- credentials, tokens, secrets or production configuration;
- production database contents;
- sensitive support/safeguarding information;
- information supplied by an organisation in confidence.

Use synthetic examples only.

## Security vulnerabilities

Do not report vulnerabilities that could expose people, protected locations or privileged systems in a public issue. Follow `SECURITY.md` and use GitHub private vulnerability reporting / Security Advisories where available.

## Current contribution status

The repository is publicly visible, but an explicit software/specification licence and long-term contribution governance model have not yet been selected.

Until that work is complete:

- discussion and review feedback are welcome;
- small corrective/documentation pull requests may be considered;
- substantive code/specification contribution policy is provisional;
- do not assume public visibility grants reuse rights beyond applicable law and GitHub's platform terms.

See the public governance/licensing backlog issue for the decision still required.

## Design expectations

Contributions should preserve these invariants:

- provider remains authoritative for inventory and admission decisions;
- stale data is never presented as confirmed live availability;
- protected locations are not leaked to unauthorised clients;
- anonymous/minimised discovery is preferred;
- SafeBed does not become an unrestricted private-host marketplace;
- automated matching must be inspectable and must not replace provider safeguarding judgement;
- no referral commission, placement fee or paid ranking is introduced;
- accessibility and low-connectivity behaviour are core requirements;
- failures degrade safely and leave an appropriate manual/fallback route where possible.

## Issues

Public issues should be safe to publish permanently.

If the useful context cannot be shared without revealing confidential or identifying information, do not paste it into GitHub. Record only a non-sensitive description of the work item and move sensitive evidence to an appropriate private governance channel when one exists.
