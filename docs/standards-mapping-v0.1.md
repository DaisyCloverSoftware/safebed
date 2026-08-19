# SafeBed Standards Mapping v0.1

**Status:** discovery mapping. This document distinguishes current Open Referral UK support from SafeBed-specific and newer international HSDS concepts.

## 1. Version baseline

SafeBed's current UK interoperability baseline is **Open Referral UK (ORUK) 3.0**.

ORUK 3.0 is a UK profile of the international Human Services Data Specification (HSDS). Its published API exposes the UK-profile endpoints for service-directory interoperability.

International HSDS evolved after the ORUK 3.0 profile was published. In particular, **HSDS 3.1 introduced `service_capacity` and `unit`**. These objects are present in current international HSDS documentation but are **not currently part of the published ORUK 3.0 profile**.

SafeBed must not describe a SafeBed extension as if it were already part of ORUK.

## 2. Mapping rule

For every SafeBed concept use this precedence:

1. **ORUK 3.0 field/entity** where the current UK profile already models the concept.
2. **Later international HSDS field/entity** where it cleanly models a SafeBed requirement and a UK-profile extension has not yet adopted it.
3. **SafeBed-specific extension** only when neither standard provides the required placement semantics.

Every SafeBed-specific extension should have a documented interoperability rationale.

## 3. Service discovery mapping

| SafeBed concept | Standards source | SafeBed treatment |
| --- | --- | --- |
| Provider organisation | ORUK 3.0 `organization` | Reuse directly where source provides ORUK-compatible data. |
| Emergency accommodation service | ORUK 3.0 `service` | Reuse as the public/service identity. Do not create a parallel service record when an authoritative ORUK identifier exists. |
| Service at physical/virtual location | ORUK 3.0 `service_at_location` + `location` | Reuse for public-safe location/service relationships. Protected destination rules remain a SafeBed policy layer. |
| Address | ORUK 3.0 `address` nested through location structures | Reuse only when disclosure policy allows the address to be returned. |
| Accessibility | ORUK 3.0 `accessibility` | Reuse published accessibility data; absence must not be interpreted as confirmed accessibility. |
| Opening/check-in availability window | ORUK 3.0 `schedule` plus SafeBed placement rules | Reuse service schedules for ordinary opening information. Placement-specific latest-arrival/check-in deadlines may require SafeBed transactional metadata. |
| Geographic service coverage | ORUK 3.0 `service_area` | Reuse for ordinary coverage/eligibility geography where applicable. |
| Service age constraints | ORUK 3.0 service `minimum_age` / `maximum_age` | Reuse rather than duplicate. |
| General eligibility narrative | ORUK 3.0 service `eligibility_description` | Reuse for human-readable criteria. Structured SafeBed hard-match rules must remain traceable to provider policy. |
| Application/referral instructions | ORUK 3.0 service `application_process` | Reuse for ordinary service access instructions. SafeBed referral transactions are additional workflow state. |
| Waiting-time information | ORUK 3.0 service `wait_time` | Reuse when meaningful; do not confuse expected waiting time with live capacity. |
| Contact/phone | ORUK 3.0 `contact` / `phone` | Reuse only at the disclosure level permitted for the caller. |
| Classification/taxonomy | ORUK 3.0 `taxonomy`, `taxonomy_term`, `attribute` | Prefer standard classifications over free-text SafeBed-only labels where suitable taxonomies exist. |

## 4. Capacity mapping

| SafeBed concept | Standards source | SafeBed treatment |
| --- | --- | --- |
| Capacity object identity | HSDS 3.1+ `service_capacity.id` | Align where a source/provider can expose a stable capacity object. |
| Service link | HSDS 3.1+ `service_capacity.service_id` | Preserve authoritative service linkage. |
| Available unit count | HSDS 3.1+ `service_capacity.available` | Map provider-reported usable capacity when a numeric count is meaningful. |
| Maximum unit count | HSDS 3.1+ `service_capacity.maximum` | Reuse where provider has meaningful maximum capacity. |
| Capacity description | HSDS 3.1+ `service_capacity.description` | Describe what the capacity represents. |
| Source update timestamp | HSDS 3.1+ `service_capacity.updated` | Preserve the source's update/change time. |
| Unit of capacity | HSDS 3.1+ `unit` | Align concepts such as bed/room/unit where practical. Do not force a provider's richer internal inventory into a misleading count. |
| Observation time | SafeBed extension | `observed_at`: when SafeBed successfully observed the authoritative source. This is distinct from provider `updated`. |
| Freshness deadline | SafeBed extension | `fresh_until`: latest time SafeBed may treat the observation as current under provider/integration policy. |
| Source revision/concurrency token | SafeBed extension / source-native | Preserve provider ETag/version/revision where available to detect races. |
| `STALE` state | SafeBed extension | Derived when the observation is older than permitted freshness. Never overwrite provider source data. |
| `MANUAL_CONFIRMATION_REQUIRED` | SafeBed extension | Represents a provider workflow where a number/feed is insufficient for a safe live placement claim. |

## 5. Why `updated` is not enough

HSDS `service_capacity.updated` answers:

> When did the source capacity record last change/update?

SafeBed additionally needs to know:

> When did SafeBed last successfully observe the authoritative source, and until when may that observation safely be treated as current?

Therefore:

- `source_updated_at` maps to HSDS `service_capacity.updated` where used;
- `observed_at` is a SafeBed integration observation;
- `fresh_until` is a SafeBed/provider freshness-policy result.

These timestamps must not be conflated.

## 6. Suitability mapping

SafeBed should derive structured matching from explicit provider/service rules, reusing ORUK information wherever it is sufficiently structured.

Examples:

- age -> ORUK `minimum_age` / `maximum_age`;
- accessibility -> ORUK `accessibility`;
- service geography -> ORUK `service_area`;
- ordinary access/referral description -> ORUK `application_process`;
- general eligibility text -> ORUK `eligibility_description`;
- classification -> ORUK taxonomy/attributes.

SafeBed-specific structured constraints are justified only where current source/standard data cannot express a placement-critical rule safely enough.

A SafeBed non-match is not a provider rejection. The system must distinguish:

- rule-based `NOT_MATCHED`;
- `INSUFFICIENT_INFORMATION`;
- provider `DECLINED` referral decision.

## 7. Location and disclosure mapping

ORUK/HSDS location data describes service locations. SafeBed additionally has to decide whether a particular caller may receive a particular location field.

SafeBed disclosure policy therefore wraps standard location data with states such as:

- `PUBLIC`;
- `VERIFIED_USER`;
- `PLACEMENT_AUTHORISED`;
- `RESTRICTED`;
- `SEALED`.

This is a **SafeBed authorisation policy**, not a proposed replacement for the ORUK location model.

A protected location must be filtered before the response reaches an unauthorised client. Hiding a marker visually while returning precise coordinates in JSON/HTML is prohibited.

## 8. Transaction concepts without current ORUK equivalents

The following are currently SafeBed placement-transaction concepts rather than claims about the ORUK 3.0 API:

### `PlacementNeed`

A temporary, minimised request describing what is needed to find suitable options.

### `MatchResult`

An explainable comparison between published/structured provider criteria and the temporary placement need.

### `Referral`

A transactional submission to the provider's admission workflow.

### `Hold`

A provider-authorised, time-limited claim against capacity while required placement steps are completed.

### `Reservation`

Provider-confirmed allocation/placement state.

### `Arrival`

Provider/authorised-worker confirmation that the placement was reached.

These concepts should remain separate from ORUK service-directory endpoints unless future standards work adopts equivalent semantics.

## 9. API coexistence model

A SafeBed implementation may need to consume an ORUK publisher's standard API while exposing separate SafeBed transaction endpoints.

For example:

**ORUK source**

- `/services`
- `/services/{id}`
- `/organizations`
- `/organizations/{id}`
- `/service_at_locations`
- `/service_at_locations/{id}`
- taxonomy endpoints

**SafeBed transaction layer**

- `/v1/services/{service_id}/availability`
- `/v1/matches`
- `/v1/referrals`
- `/v1/holds`
- `/v1/reservations`
- `/v1/placements/{placement_id}/arrival`

SafeBed must not label the second group as ORUK endpoints.

## 10. Upstream/profile strategy

Before treating the SafeBed availability profile as a stable public standard:

1. validate the mapping with Open Referral UK maintainers/community;
2. confirm whether a UK profile update is planned for later HSDS capacity entities;
3. prefer upstream-compatible semantics where possible;
4. document any remaining SafeBed-specific fields;
5. avoid extending standard entities merely for convenience;
6. keep transaction state separable from general service-directory data.

## 11. Current implementation impact

The discovery OpenAPI and synthetic sandbox should therefore use this terminology:

- **ORUK-compatible/aligned service discovery**;
- **HSDS 3.1+ aligned capacity representation**;
- **SafeBed-specific placement transactions and disclosure policy**.

They should not claim `service_capacity`, holds, reservations or referrals are currently part of ORUK 3.0.

## 12. References

- ORUK current API/profile: https://openreferraluk.org/developers/api
- ORUK data model: https://openreferraluk.org/developers/schemata
- ORUK OpenAPI specification: https://openreferraluk.org/developers/specifications
- ORUK changelog: https://openreferraluk.org/developers/changelog
- HSDS schema reference: https://docs.openreferral.org/en/latest/hsds/schema_reference.html
- HSDS changelog: https://docs.openreferral.org/en/latest/hsds/changelog.html
