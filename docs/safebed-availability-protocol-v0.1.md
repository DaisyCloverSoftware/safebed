# SafeBed Availability Protocol v0.1

**Status:** discovery specification; not production-ready.

The SafeBed Availability Protocol (SAP) is an Open Referral UK / HSDS-aligned emergency-accommodation profile and transactional layer. It is intended to connect existing provider and council systems, not replace them.

## 1. Core transaction

SafeBed models the path:

`NEED -> DISCOVERY -> SUITABILITY -> AVAILABILITY -> REFERRAL -> HOLD -> PROVIDER DECISION -> RESERVATION -> ARRIVAL`

Not every provider supports every stage. The provider remains authoritative for admission decisions and inventory.

## 2. Standards foundation

The current UK profile is **Open Referral UK (ORUK) 3.0**. It provides the present UK interoperability baseline for service-directory concepts such as organisations, services, service locations, schedules and related service information.

International **HSDS 3.1** subsequently introduced `service_capacity` and `unit`. `service_capacity` supports:

- available capacity;
- maximum capacity;
- an update timestamp;
- a human-readable description of the capacity represented;
- a unit describing what is being counted.

The published ORUK 3.0 profile does **not currently include `service_capacity`**. SafeBed should therefore:

1. reuse ORUK 3.0-compatible structures for current UK service discovery;
2. align its capacity representation with the HSDS 3.1+ `service_capacity` model where practical;
3. document SafeBed-only placement transactions separately rather than implying they are part of ORUK;
4. participate in standards/profile discussion before proposing any SafeBed-specific extension for wider adoption.

SafeBed therefore does **not** define a competing service directory. Its additional concern is trustworthy, time-sensitive emergency-accommodation availability plus placement transactions that a general directory does not currently standardise in the UK profile.

## 3. Provider source of truth

SafeBed shall never create an independent authoritative bed count.

Each availability record must retain:

- `source_system`;
- `source_record_id` where available;
- `source_revision` or equivalent concurrency token where available;
- `observed_at`;
- provider-supplied update timestamp;
- `fresh_until`.

If the source cannot be reached, SafeBed must fail closed and show availability as unconfirmed rather than reusing stale data as live.

## 4. Normalised availability states

SafeBed normalises provider information to:

- `AVAILABLE`
- `LIMITED`
- `FULL`
- `HELD`
- `RESERVATION_PENDING`
- `CLOSED`
- `MANUAL_CONFIRMATION_REQUIRED`
- `STALE`
- `UNKNOWN`

`HELD` and `RESERVATION_PENDING` are transaction states. They must not overwrite the provider's underlying inventory model.

## 5. Freshness

Every provider/integration must define or accept a maximum age for availability information.

The client should communicate confidence explicitly, for example:

- **Confirmed 8 minutes ago**
- **Last checked 43 minutes ago**
- **Availability needs confirmation**

The interface must never imply stronger certainty than the underlying source provides.

## 6. Capacity units

Examples include:

- `BED`
- `ROOM`
- `FAMILY_UNIT`
- `HOST_PLACEMENT`
- `ACCESSIBLE_UNIT`
- `EMERGENCY_SPACE`

Adapters may translate richer provider-specific inventory into these interoperable units without forcing the provider to change its internal model.

Where a SafeBed capacity can be represented cleanly by the HSDS 3.1+ `unit` and `service_capacity` structures, that mapping should be preferred over inventing an incompatible shape.

## 7. PlacementNeed

Anonymous discovery should be possible. A temporary `PlacementNeed` may contain only what is necessary to find potentially suitable services, for example:

- approximate/current location;
- required date/night;
- household composition;
- accessibility requirements;
- whether children are present;
- whether a joint/couple placement is required;
- assistance animal or pet constraints;
- specialist pathway requirement;
- check-in/travel constraints;
- referral capability.

Sensitive information must be requested progressively and only where needed.

## 8. Suitability

Availability and suitability are separate.

A matching service may return:

- `SUITABLE`
- `POSSIBLY_SUITABLE`
- `NOT_MATCHED`
- `INSUFFICIENT_INFORMATION`

Structured reasons may include:

- `AGE_OUTSIDE_SERVICE_RANGE`
- `HOUSEHOLD_TYPE_UNSUPPORTED`
- `FAMILY_UNIT_UNAVAILABLE`
- `ACCESSIBILITY_UNKNOWN`
- `PROFESSIONAL_REFERRAL_REQUIRED`
- `CHECK_IN_DEADLINE_PASSED`
- `PET_POLICY_INCOMPATIBLE`
- `SERVICE_AREA_RESTRICTION`
- `CAPACITY_UNCONFIRMED`
- `SPECIALIST_ASSESSMENT_REQUIRED`

SafeBed may apply explicit provider rules, but it must not use opaque automated scoring to decide that a person is undeserving of accommodation. Final admission decisions remain attributable to the provider.

## 9. Result ordering

Results should be ordered primarily by:

1. suitability;
2. confirmed availability;
3. ability to access the placement tonight;
4. travel practicality.

Results must never be ranked according to payment, sponsorship or referral commission.

## 10. Disclosure classes

Every sensitive location/data field should support a disclosure class:

- `PUBLIC` — safe for anonymous discovery;
- `VERIFIED_USER` — available only to approved authenticated organisations/users;
- `PLACEMENT_AUTHORISED` — released only after a provider-approved placement step;
- `RESTRICTED` — available only through a specialist authorised workflow;
- `SEALED` — never returned through normal client APIs.

Protected accommodation must be designed around controlled disclosure from the outset.

## 11. Hosted accommodation

SafeBed shall not provide an unrestricted spare-room marketplace.

The expected model is:

`HOST -> ACCREDITED HOSTING ORGANISATION -> SAFEBED`

The hosting organisation is responsible for host vetting, training, guest assessment, safeguarding, matching and support. The host address is not public inventory.

## 12. Referral states

A referral may move through:

`DRAFT -> SUBMITTED -> UNDER_REVIEW`

and then one of:

- `ACCEPTED`
- `DECLINED`
- `MORE_INFORMATION_REQUIRED`
- `WITHDRAWN`
- `EXPIRED`

Decline reasons should be structured where safe and useful, while allowing confidential provider notes outside the public/referrer-visible response.

## 13. Holds

Where supported, a provider may grant a short-lived hold:

`AVAILABLE -> HELD`

A hold should contain:

- `hold_id`;
- provider/capacity reference;
- related referral identifier;
- creation time;
- expiry time;
- status.

The provider controls maximum hold duration and remains authoritative.

## 14. Concurrency

Mutable placement operations should support:

- idempotency keys;
- optimistic/atomic concurrency control;
- provider revision tokens where possible;
- explicit conflict responses.

If two workers attempt to obtain the final space, the losing request must receive a conflict rather than a second confirmation.

Recommended semantic response:

`409 CAPACITY_CONFLICT`

## 15. Reservation and arrival

A provider-approved reservation records, at minimum:

- SafeBed reservation identifier;
- provider reference;
- related referral/placement identifiers;
- confirmation time;
- arrival deadline where relevant;
- state.

Arrival should normally be confirmed by the provider or an authorised worker. SafeBed should not routinely track the person's device to infer movement or arrival.

## 16. Initial API surface

Proposed capability-oriented endpoints:

- `GET /v1/services/search`
- `GET /v1/services/{service_id}/availability`
- `POST /v1/matches`
- `POST /v1/referrals`
- `GET /v1/referrals/{id}`
- `POST /v1/holds`
- `DELETE /v1/holds/{id}`
- `POST /v1/reservations`
- `POST /v1/placements/{id}/arrival`

These are SafeBed discovery endpoints, not claims about the current ORUK API. An OpenAPI contract defines their provisional representations separately.

## 17. Integration classes

Preferred integration order:

1. provider API + webhooks;
2. supported vendor integration;
3. secure polling/read integration;
4. structured import/export;
5. SafeBed provider portal.

A small provider without an API should still be able to participate safely.

## 18. Webhook event families

Candidate SafeBed events:

- `capacity.changed`
- `referral.created`
- `referral.updated`
- `hold.created`
- `hold.expired`
- `reservation.confirmed`
- `reservation.cancelled`
- `placement.arrived`

Events should carry identifiers and the minimum necessary data rather than duplicating a person's case record.

## 19. Trust levels

Initial trust levels:

- anonymous/public discovery;
- authenticated public user where useful;
- verified professional;
- provider user;
- specialist authorised user;
- machine-to-machine integration.

Privileged access must be role-based and auditable.

## 20. Audit

Privileged actions should record:

- actor/service identity;
- organisation identity where relevant;
- action;
- resource;
- timestamp;
- result;
- justification/context where required.

Audit data must itself be minimised and protected.

## 21. No-bed response

`0` is not an adequate user journey.

When no suitable confirmed placement exists, SafeBed should return `NO_CONFIRMED_PLACEMENT` plus appropriate non-placement escalation routes, such as local-authority homelessness assistance, outreach or specialist pathways.

## 22. Public-good constraint

SafeBed transactions have no SafeBed referral fee, placement commission, affiliate payment or paid ranking field.

Operational funding and sustainability are governance concerns; a vulnerable person's placement is not a monetisation event.

## 23. v0.1 validation target

Before live personal data is processed, SafeBed should prove with synthetic personas that five materially different providers can expose or maintain trustworthy availability and complete the sandbox flow:

`SEARCH -> MATCH -> REFERRAL -> HOLD -> PROVIDER DECISION -> RESERVATION`

## References

- Open Referral UK current profile/API: https://openreferraluk.org/developers/api
- ORUK technical overview: https://openreferraluk.org/developers/overview
- ORUK changelog: https://openreferraluk.org/developers/changelog
- HSDS schema reference: https://docs.openreferral.org/en/latest/hsds/schema_reference.html
- HSDS changelog: https://docs.openreferral.org/en/latest/hsds/changelog.html
