# SafeBed

**Find somewhere safe tonight.**

SafeBed is a public-good project exploring a safe, real-time interoperability layer for emergency accommodation.

The problem is simple to state but difficult to solve: when someone needs somewhere safe to sleep tonight, information about suitable accommodation may be spread across councils, charities, shelters, outreach teams, specialist services, case-management systems and manual processes.

SafeBed aims to help authorised people answer:

> Which suitable place genuinely has capacity now, can this person access it, and what needs to happen to get them there safely?

## Principles

- **Public good, not private profit.** No person should be charged to find emergency accommodation through SafeBed, and the platform must not earn referral or placement commissions.
- **Safety before convenience.** Safeguarding and controlled disclosure are core architecture, not optional features.
- **Integrate, do not replace.** Providers should keep their existing case-management and accommodation systems wherever possible.
- **Standards first.** SafeBed intends to build on Open Referral UK / HSDS rather than create an incompatible service-directory format.
- **Provider remains source of truth.** SafeBed must not invent or maintain a competing bed count.
- **Anonymous discovery where possible.** Personal information should only be collected when genuinely required for referral or placement.
- **No unrestricted private-host marketplace.** Hosted accommodation should only enter the network through an appropriately governed and safeguarded host organisation.
- **No paid ranking.** Search results must be ordered by suitability, confirmed availability and practical access — never by payment.
- **Fail safely.** Stale or unreachable availability must never be presented as confirmed.
- **No smartphone required.** The service should support people through supporters, professionals and alternative access routes as well as a mobile interface.

## Current stage

SafeBed is in **pre-development discovery**. The immediate work is to validate the interoperability, safeguarding and operational model before building a production application.

The first technical target is intentionally narrow:

> Can several materially different emergency-accommodation providers safely expose sufficiently current availability through a common interface without replacing their existing systems?

## Standards direction

SafeBed is being designed to interoperate with **Open Referral UK (ORUK)** for current UK service-directory data and to align its availability model with the wider **Human Services Data Specification (HSDS)**. The current UK profile is ORUK 3.0. International HSDS 3.1 introduced `service_capacity`, including available/maximum units and an update timestamp; that capacity object is not currently part of the published ORUK 3.0 profile. SafeBed therefore treats real-time accommodation availability and placement transactions as a carefully defined extension/profile layer while preserving ORUK-compatible service discovery.

Useful references:

- Open Referral UK: https://openreferraluk.org/
- HSDS schema reference: https://docs.openreferral.org/en/latest/hsds/schema_reference.html
- UK Government homelessness strategy: https://www.gov.uk/government/publications/a-national-plan-to-end-homelessness
- ICO guidance on special-category data: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/special-category-data/

## Repository status

This repository is public because interoperability work benefits from scrutiny and open discussion. It must not contain confidential provider information, identifiable service-user information, protected accommodation locations, credentials or private operational material.

Detailed discovery documents will be added under `docs/`.
