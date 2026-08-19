# Security Policy

SafeBed is intended for a high-risk welfare context. Please handle suspected vulnerabilities carefully.

## Reporting a vulnerability

**Do not open a public GitHub issue** for a vulnerability that could expose:

- personal or referral information;
- protected accommodation locations;
- privileged provider information;
- authentication or access-control weaknesses;
- credentials, tokens or secrets;
- a method for manipulating availability, holds or reservations;
- information that could help target a vulnerable person or accommodation provider.

Use the repository's **GitHub private vulnerability reporting / Security Advisory** facility where available.

If private reporting is temporarily unavailable, do not publish exploit details in a public issue or discussion. A non-sensitive public issue may be used only to say that a private security contact route is needed, without including vulnerability details.

## Public repository safety

Never commit or attach:

- real service-user data;
- real referral payloads containing personal information;
- protected accommodation addresses;
- confidential provider procedures;
- credentials or access tokens;
- production database contents;
- private operational contact lists;
- sensitive logs or screenshots.

Use synthetic fixtures and examples only.

## Security posture

SafeBed is currently in discovery/pre-development. Nothing in this repository should be treated as a production security guarantee.

Before controlled live use, the project expects formal threat modelling, DPIA/information-governance work, authentication and disclosure testing, protected-location leakage testing, concurrency testing, security review and appropriate penetration testing for the deployed scope.
