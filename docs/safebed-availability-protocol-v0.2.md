# SafeBed Availability Protocol v0.2

**Status:** executable-aligned discovery specification using synthetic data only.

SafeBed Availability Protocol (SAP) v0.2 reconciles the public protocol language with the current synthetic interoperability sandbox.

It is not a deployed production API, an Open Referral UK profile, a completed safeguarding policy or authority to process live referral data.

The accommodation provider/integration remains authoritative for capacity and admission decisions.

---

# 1. Version boundary

SafeBed currently uses three deliberately separate layers:

## Layer A — ORUK 3.0-compatible service discovery

Reuse current Open Referral UK concepts for ordinary service-directory information where they fit.

SafeBed should not create another provider/service/location directory merely to support placement.

## Layer B — HSDS 3.1+-aligned capacity semantics

Later international HSDS capacity concepts provide a useful direction for `available`, `maximum`, update time and capacity unit semantics.

Those later capacity concepts are **not described as current ORUK 3.0 API fields**.

## Layer C — SafeBed placement/safeguarding layer

SafeBed-specific discovery concepts currently include:

- source observation/freshness policy;
- suitability/access-pathway matching;
- provider integration capability;
- referrals;
- provider decision;
- time-limited holds;
- reservations;
- arrival confirmation;
- protected disclosure policy.

The protocol remains open to correction through the standards-review work before any production schema freeze.

---

# 2. Fundamental flow

The tested synthetic flow is:

```text
SEARCH / DISCOVERY
      ↓
MATCH
      ↓
REFERRAL
      ↓
PROVIDER ACCEPTANCE
      ↓
HOLD (where supported)
      ↓
RESERVATION
      ↓
DESTINATION DISCLOSURE (only if policy permits)
      ↓
ARRIVAL CONFIRMATION
```

Each arrow is conditional.

A client must not infer that because one stage exists the next one is supported.

---

# 3. Provider authority

SafeBed does **not** own a competing authoritative bed count.

For each integration:

- provider/source capacity remains authoritative;
- SafeBed retains source revision/provenance where available;
- SafeBed may normalise the provider state for searching/display;
- SafeBed may request a hold/reservation only through capabilities the provider actually supports;
- disagreement between SafeBed and the provider resolves in favour of the authoritative provider state;
- an uncertain write is reconciled rather than blindly retried as a new transaction.

---

# 4. Availability state

v0.2 normalised availability states are:

- `AVAILABLE`
- `LIMITED`
- `FULL`
- `MANUAL_CONFIRMATION_REQUIRED`
- `STALE`
- `UNKNOWN`

## Why `CLOSED` is not a capacity state in v0.2

Provider opening/check-in schedules are service-access information rather than the same thing as a numeric capacity observation.

A service can theoretically have nominal physical capacity but be unavailable for admission because its access window has closed.

Therefore v0.2 keeps **schedule/access state separate from capacity confidence** rather than overloading one availability enum.

This may evolve after standards/provider review.

---

# 5. Freshness

Every capacity observation should preserve distinct timestamps/concepts:

- `sourceUpdatedAt` — when the provider/authoritative source says the capacity record changed/was updated;
- `observedAt` — when SafeBed successfully observed the source;
- `freshUntil` — when the observation ceases to be sufficiently current under the provider/integration freshness policy;
- `sourceRevision` — revision/concurrency token where available.

SafeBed must never rewrite `sourceUpdatedAt` merely because it polled the same stale value again.

If the freshness window expires:

`AVAILABLE` / `LIMITED`

becomes:

`STALE`

until a new authoritative observation occurs.

If the provider cannot be reached and SafeBed cannot establish current state:

`UNKNOWN`

is safer than replaying an old positive count as live.

---

# 6. Manual-confirmation providers

Some providers may expose or maintain a nominal non-zero count while staff confirmation is still required before anybody should travel or be told a place is usable.

Such capacity becomes:

`MANUAL_CONFIRMATION_REQUIRED`

rather than `AVAILABLE`.

A non-zero number is therefore **not automatically a live bed claim**.

---

# 7. Provider capabilities

v0.2 makes provider capability first-class alongside match/availability results.

A provider advertises:

```text
integrationMode
referralMode
holdSupported
reservationMode
```

## `integrationMode`

Synthetic discovery values:

- `LIVE_API`
- `READ_ONLY_FEED`
- `SAFEBED_PORTAL`
- `MANUAL_CONFIRMATION`
- `RESTRICTED_SPECIALIST`

These are discovery abstractions and must be validated against real provider workflows before becoming a frozen production taxonomy.

## `referralMode`

- `SAFEBED_TRANSACTION`
- `SAFEBED_PORTAL`
- `EXTERNAL_MANUAL`

## `reservationMode`

- `SAFEBED_TRANSACTION`
- `SAFEBED_PORTAL`
- `EXTERNAL_MANUAL`

## Key invariant

> **Live availability does not imply SafeBed bookability.**

Example:

A `READ_ONLY_FEED` may report two current spaces while:

- `referralMode = EXTERNAL_MANUAL`
- `holdSupported = false`
- `reservationMode = EXTERNAL_MANUAL`

The correct UX action is then a provider/referral contact route — **not Reserve**.

---

# 8. Service discovery safety

The public-safe service model contains concepts such as:

- service ID;
- provider/source ID;
- public name;
- public area label;
- disclosure classification;
- published service rules;
- provider capability metadata.

It must not contain an exact protected destination merely because the UI intends to hide it.

Protected destination data is a different resource disclosed later under policy.

---

# 9. Disclosure levels

Current discovery classes:

- `PUBLIC`
- `VERIFIED_USER`
- `PLACEMENT_AUTHORISED`
- `RESTRICTED`
- `SEALED`

These are **SafeBed application authorisation classifications**, not replacement ORUK location types.

## Public

May be returned to unauthenticated/public discovery where provider policy allows.

## Verified user

Requires an appropriate verified identity/organisation context.

## Placement authorised

Requires the correct referral/placement relationship and provider-authorised state.

## Restricted

Requires additional specialist/programme entitlement/policy as well as the correct placement state.

## Sealed

Ordinary SafeBed client APIs do not disclose the location. A separate specialist provider-to-provider process may be required.

---

# 10. Placement need

The current synthetic `PlacementNeed` is intentionally small:

- `requiredFor`
- `householdSize`
- optional child count;
- wheelchair-access requirement;
- assistance-animal requirement;
- other-pet requirement;
- whether a professional referral pathway is already available.

It is **not** a complete homelessness case record.

Future fields must pass the data-minimisation register before being added.

---

# 11. Match state

v0.2 match states are:

- `SUITABLE`
- `POSSIBLY_SUITABLE`
- `NOT_MATCHED`
- `INSUFFICIENT_INFORMATION`

These states describe structured matching/access confidence — not a judgement of a person's worth.

## Hard mismatch examples

Current synthetic examples include:

- household size outside published provider limits;
- children not supported by the service;
- required wheelchair access not confirmed/supported;
- assistance animal not supported under the published rule;
- pet-policy incompatibility.

## Pathway / uncertainty examples

Current synthetic examples include:

- `PROFESSIONAL_REFERRAL_REQUIRED`
- `CAPACITY_UNCONFIRMED`

A professional-referral requirement is **not itself a hard rejection**.

A public search may therefore return:

```text
matchState = POSSIBLY_SUITABLE
reason = PROFESSIONAL_REFERRAL_REQUIRED
next action = Get referral help
```

This preserves a potentially valid pathway rather than making protected/specialist accommodation disappear from discovery.

---

# 12. Search outcome

Current outcomes:

- `CANDIDATES_FOUND`
- `NO_CONFIRMED_PLACEMENT`

`NO_CONFIRMED_PLACEMENT` must never become a blank “0 results” dead end.

A real product must route toward appropriate manual/statutory/specialist help based on the situation.

---

# 13. Referral

Referral states:

- `SUBMITTED`
- `UNDER_REVIEW`
- `ACCEPTED`
- `DECLINED`
- `MORE_INFORMATION_REQUIRED`
- `WITHDRAWN`
- `EXPIRED`

The provider owns the acceptance decision.

## v0.2 data-minimisation decision

The public v0.2 API does **not** define one universal personal referral body.

The contract only proves the transaction identity (`providerId`, `serviceId`) while real provider-specific referral fields remain gated by:

- workflow discovery;
- lawful-purpose review;
- DPIA/data flows;
- data minimisation;
- retention;
- provider-specific necessity.

This prevents early API design from quietly becoming a universal shadow case-management record.

---

# 14. Hold

Where supported, a hold is provider-authorised and time limited.

Core fields:

- hold ID;
- referral ID;
- service ID;
- status;
- created time;
- expiry time;
- source revision.

Hold states:

- `ACTIVE`
- `RELEASED`
- `EXPIRED`
- `CONSUMED`

## Concurrency

A hold request carries:

- `expectedSourceRevision`
- `idempotencyKey`

If the final unit has already changed/been consumed, the provider adapter returns a capacity conflict rather than allowing a second success.

Repeated delivery of the same idempotent request must not create duplicate holds.

---

# 15. Reservation

Reservation states:

- `CONFIRMED`
- `ARRIVED`
- `CANCELLED`
- `NO_SHOW`

A confirmed reservation may still omit the destination if the current caller is not authorised to receive it.

## Critical v0.2 security correction

The public API reservation request must **not** accept fields such as:

- `actorRole`
- `isProfessional`
- `disclosureLevel`
- `canDiscloseDestination`
- `isSpecialist`

Production privilege must be derived server-side from the production identity/authorisation model.

The synthetic sandbox may pass a role into an in-process test harness solely to exercise the policy outcome. That is not the future HTTP trust boundary.

---

# 16. Destination disclosure

A destination is a separately protected resource.

Public discovery responses never contain the protected exact destination.

A destination may be returned after reservation only where server-side policy establishes the required combination of:

- authenticated identity;
- active organisation membership;
- verified organisation;
- permitted capability/role;
- resource/referral relationship;
- provider-authorised placement state;
- specialist/programme entitlement where required;
- authentication assurance/step-up where policy requires it.

Viewing a protected destination must be auditable.

---

# 17. Arrival

SafeBed records provider/authorised arrival state without routine device surveillance.

Preferred confirmation sources include:

- provider worker;
- authorised support worker under provider policy;
- provider system/integration.

v0.2 does not require:

- continuous phone GPS;
- geofencing;
- background location permission;
- stored travel/location history.

---

# 18. Contract endpoints and sandbox evidence

The v0.2 OpenAPI contract distinguishes a future HTTP shape from what the in-process synthetic sandbox actually exercises.

| Operation | v0.2 status |
| --- | --- |
| `GET /v1/services/search` | contract only; real geospatial search not implemented |
| `POST /v1/matches` | semantic behaviour exercised |
| `GET /v1/services/{id}/availability` | semantic behaviour exercised |
| `POST /v1/referrals` | minimal semantic flow exercised |
| `GET /v1/referrals/{id}` | state model exists; HTTP read not implemented |
| `POST /v1/holds` | semantic behaviour exercised |
| `DELETE /v1/holds/{id}` | adapter behaviour exists; HTTP route not implemented |
| `POST /v1/reservations` | semantic behaviour exercised |
| `POST /v1/placements/{reservation_id}/arrival` | semantic behaviour exercised |

No endpoint in this table should be described as a deployed public SafeBed API today.

---

# 19. Geospatial/navigation scope

The v0.2 protocol deliberately does not freeze geospatial API semantics yet.

The synthetic UX uses a non-geographic schematic map only.

Future geospatial work must separately address:

- approximate/public vs exact/protected coordinates;
- geocoding privacy;
- routing provider/tile licensing and terms;
- avoiding protected coordinate leakage to browser/tile/analytics services;
- walking/public-transport/vehicle hand-off;
- low-data/weak-signal behaviour;
- no routine location history.

Until that architecture is reviewed, `GET /v1/services/search` carries only a deliberately vague public-safe area query in the discovery contract.

---

# 20. Error/failure behaviour

Important error classes include:

- validation failure;
- forbidden access;
- intentionally non-disclosed/not-found resource;
- provider unavailable;
- capacity/revision conflict;
- unsupported provider capability;
- invalid provider/placement state transition.

Failure must not leak protected-resource existence or protected destination data through detailed error messages.

---

# 21. v0.1 → v0.2 changes

v0.2 specifically corrects/clarifies:

1. provider capability is first-class and independent from capacity;
2. `POSSIBLY_SUITABLE` is explicitly represented;
3. `PROFESSIONAL_REFERRAL_REQUIRED` is a pathway/access reason rather than automatic hard rejection;
4. manual-confirmation capacity is not live capacity;
5. public service records never carry protected exact destinations;
6. reservation HTTP input cannot grant its own disclosure privilege;
7. service schedule/closed state is separated from capacity confidence;
8. referral payload is intentionally minimal until provider/data-governance discovery defines real fields;
9. OpenAPI operations state whether their semantics are tested or are only future HTTP contract shapes;
10. geospatial search/navigation is deliberately left unfrozen pending privacy/licensing architecture.

---

# 22. v0.2 acceptance criterion

The contract is internally aligned when automated tests can prove at least:

- OpenAPI enums match the executable sandbox state vocabulary;
- all five synthetic provider integration modes are representable;
- `MatchResult` includes `providerCapabilities`;
- professional-referral-required remains representable as a non-hard pathway;
- `PublicService` cannot contain destination/address/coordinates;
- the reservation request cannot contain caller-controlled privilege fields;
- destination exists only as an optional authorised reservation response concept;
- the synthetic end-to-end placement regressions still pass unchanged.

This internal alignment does **not** replace external ORUK/HSDS review or live provider validation.
