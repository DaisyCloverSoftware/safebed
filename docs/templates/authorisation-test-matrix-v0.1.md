# SafeBed Authorisation Test Matrix Template v0.1

**Purpose:** public-safe template for proving deny-by-default identity/resource/disclosure policy with synthetic identities and services.

Use fictional organisations, users, services, referrals and locations only in public CI.

## Synthetic principals

| Principal | Organisation state | Membership | Capability/entitlement |
| --- | --- | --- | --- |
| `anon` | none | none | public only |
| `support-worker-a` | verified support org A | active | referral capability |
| `support-worker-b` | verified support org B | active | referral capability |
| `provider-worker-a` | verified provider A | active | referral review |
| `capacity-manager-a` | verified provider A | active | capacity write |
| `specialist-worker-a` | verified support org A | active | referral + specialist programme entitlement |
| `org-admin-a` | verified support org A | active | membership administration only |
| `platform-support` | platform | active | support metadata only |
| `suspended-user-a` | verified org A | suspended membership | no privileged capability |
| `revoked-org-user` | revoked organisation | active-looking stale membership | no privileged capability |
| `machine-provider-a` | verified provider A | machine identity | narrow service/capacity scopes |

## Synthetic resources

| Resource | Owner/type | Disclosure/state |
| --- | --- | --- |
| `public-service-a` | provider A | `PUBLIC` |
| `placement-service-a` | provider A | `PLACEMENT_AUTHORISED` |
| `restricted-service-a` | provider A | `RESTRICTED`, specialist programme A |
| `sealed-service-a` | provider A | `SEALED` |
| `referral-a-pending` | provider A | `SUBMITTED` |
| `referral-a-accepted` | provider A | `ACCEPTED` |
| `reservation-a` | provider A | `CONFIRMED` |
| `provider-b-service` | provider B | unrelated organisation |

## Required policy tests

| ID | Principal | Action | Resource/state | Expected | Reason |
| --- | --- | --- | --- | --- | --- |
| AUTH-001 | anon | read public service | public-service-a | ALLOW | public discovery |
| AUTH-002 | anon | read professional route | public-service-a | DENY | privileged route |
| AUTH-003 | anon | create referral | public-service-a | DENY | no verified organisation/member |
| AUTH-004 | support-worker-a | create permitted referral | public-service-a | ALLOW | active verified membership/capability |
| AUTH-005 | support-worker-a | write provider capacity | public-service-a | DENY | wrong capability/ownership |
| AUTH-006 | provider-worker-a | review provider A referral | referral-a-pending | ALLOW | owned provider resource |
| AUTH-007 | provider-worker-a | review provider B referral | provider-b-service | DENY | cross-organisation isolation |
| AUTH-008 | capacity-manager-a | update provider A capacity | public-service-a | ALLOW | scoped capacity capability |
| AUTH-009 | org-admin-a | read referral narrative | referral-a-pending | DENY | admin role is not case-data permission |
| AUTH-010 | platform-support | read protected destination | reservation-a | DENY | support not omniscient |
| AUTH-011 | support-worker-a | read placement destination before provider acceptance | referral-a-pending | DENY | state insufficient |
| AUTH-012 | support-worker-a | read placement-authorised destination after accepted/confirmed state | reservation-a | POLICY | only where placement relationship permits |
| AUTH-013 | support-worker-a | read restricted destination | restricted-service-a | DENY | specialist entitlement absent |
| AUTH-014 | specialist-worker-a | read restricted destination before accepted placement | referral-a-pending | DENY | entitlement alone insufficient |
| AUTH-015 | specialist-worker-a | read restricted destination after authorised placement | reservation-a | ALLOW | entitlement + state + relationship |
| AUTH-016 | specialist-worker-a | read sealed location | sealed-service-a | DENY | ordinary API never exposes sealed data |
| AUTH-017 | suspended-user-a | privileged read/write | any privileged resource | DENY | suspended membership |
| AUTH-018 | revoked-org-user | privileged read/write with old token | any privileged resource | DENY | organisation revocation overrides stale token |
| AUTH-019 | machine-provider-a | read provider A capacity | public-service-a | ALLOW | narrow machine scope |
| AUTH-020 | machine-provider-a | read referral personal narrative | referral-a-pending | DENY | capacity machine scope must not expand |
| AUTH-021 | any browser user | submit forged role/org in request payload | any | DENY/IGNORE | privilege comes from server identity state |
| AUTH-022 | support-worker-a | read another support organisation's private referral | unrelated referral | DENY | resource/relationship isolation |
| AUTH-023 | authorised professional | disclose protected destination | correct authorised placement | ALLOW + AUDIT | sensitive read logged |
| AUTH-024 | platform support | break-glass without step-up/reason | protected resource | DENY | break-glass controls incomplete |
| AUTH-025 | approved break-glass principal | break-glass with step-up/reason/time limit | authorised incident resource | POLICY + AUDIT | exceptional path only |

`POLICY` means the final exact expected result depends on the defined relationship/policy, but the test must be made deterministic before production.

## Placement transaction extension — executable discovery contract

The synthetic policy now gives hold, reservation and arrival their own actions. It deliberately does **not** treat referral authority as generic placement authority.

Human capability names used by the current executable contract:

- `hold.request`;
- `reservation.create`;
- `placement.arrival.write`.

Provider-machine scopes used by the current executable contract:

- `hold.manage`;
- `reservation.manage`;
- `placement.arrival.write`.

Provider support for these operations remains a separate adapter/integration capability and state check. An authorisation `ALLOW` does not manufacture provider functionality.

| ID | Principal | Action | Required resource state | Expected | Key invariant |
| --- | --- | --- | --- | --- | --- |
| TXN-001 | related support professional + `hold.request` | `REQUEST_HOLD` | referral `ACCEPTED`, provider decision `ACCEPTED` | ALLOW + AUDIT | explicit capability + relationship + state |
| TXN-002 | provider worker + `hold.request` | `REQUEST_HOLD` | provider-owned accepted referral | ALLOW + AUDIT | provider ownership is a valid relationship |
| TXN-003 | referral-only professional | `REQUEST_HOLD` | accepted referral | DENY | referral authority does not imply hold authority |
| TXN-004 | related support professional + `hold.request` | `REQUEST_HOLD` | pending/unaccepted referral | DENY | accepted provider state required |
| TXN-005 | related support professional + `reservation.create` | `CREATE_RESERVATION` | accepted referral + active hold | ALLOW + AUDIT | reservation has separate authority |
| TXN-006 | hold-only professional | `CREATE_RESERVATION` | active hold | DENY | hold authority does not imply reservation authority |
| TXN-007 | reservation professional | `CREATE_RESERVATION` | expired/inactive hold | DENY | active hold required |
| TXN-008 | related support professional + `placement.arrival.write` | `CONFIRM_ARRIVAL` | confirmed reservation | ALLOW + AUDIT | arrival has separate authority |
| TXN-009 | reservation-only professional | `CONFIRM_ARRIVAL` | confirmed reservation | DENY | reservation authority does not imply arrival authority |
| TXN-010 | arrival-capable professional | `CONFIRM_ARRIVAL` | unconfirmed reservation | DENY | confirmed reservation required |
| TXN-011 | otherwise capable professional | any placement mutation | unrelated provider/support relationship | DENY + CONCEAL | cross-organisation/resource isolation |
| TXN-012 | suspended/expired/revoked principal | any placement mutation | otherwise valid resource | DENY | current authoritative identity state wins |
| TXN-013 | forged browser/request context | any placement mutation | client claims stronger capability/state | DENY/UNCHANGED | client context is not a grant input |
| TXN-014 | provider machine + `hold.manage` | `REQUEST_HOLD` | provider-owned accepted referral | ALLOW + AUDIT | narrow provider-owned machine scope |
| TXN-015 | hold-only provider machine | `CREATE_RESERVATION` | provider-owned active hold | DENY + CONCEAL | one machine scope does not expand into another |
| TXN-016 | provider machine + `reservation.manage` | `CREATE_RESERVATION` | provider-owned active hold | ALLOW + AUDIT | provider-owned and state-aware |
| TXN-017 | provider machine + `placement.arrival.write` | `CONFIRM_ARRIVAL` | provider-owned confirmed reservation | ALLOW + AUDIT | narrow arrival scope |
| TXN-018 | provider machine | placement mutation against another provider | otherwise valid state | DENY + CONCEAL | machine clients remain organisation-bound |

These cases are exercised by `scripts/placement-transaction-authorisation.test.mjs` in addition to the original identity/disclosure matrix.

## Session/revocation tests

- [ ] membership removed while session active -> next privileged action denied promptly;
- [ ] organisation suspended while users logged in -> privileged actions denied promptly;
- [ ] specialist entitlement revoked -> restricted destination denied promptly;
- [ ] machine credential revoked -> next API call denied;
- [ ] logout invalidates privileged session as designed;
- [ ] step-up assurance expires according to policy;
- [ ] session does not retain a protected-resource decision after underlying placement state changes.

The synthetic policy contract can model several of these state changes, but these checkboxes remain open until a real session/identity implementation proves propagation and revocation behaviour end to end.

## Browser/client tests

- [ ] no protected location returned in JSON/HTML/client state before authorisation;
- [ ] hidden UI controls are not the enforcement boundary;
- [ ] manually calling hidden endpoints remains denied;
- [ ] forged `role`, `organisation_id`, `disclosure_level` or similar request fields do not increase privilege;
- [ ] error messages do not confirm existence of protected resources to unauthorised callers;
- [ ] predictable/guessed resource IDs do not bypass policy.

Synthetic HTTP tests may prove individual items before production, but these remain release-gate items until the production server/client boundary exists.

## Audit tests

- [ ] protected destination read creates audit event;
- [ ] placement mutation creates audit event;
- [ ] specialist entitlement grant/revoke creates audit event;
- [ ] organisation suspension/revocation creates audit event;
- [ ] membership grant/revoke creates audit event;
- [ ] break-glass creates prominent audit event;
- [ ] audit entry contains no unnecessary referral narrative/location payload;
- [ ] unauthorised audit-log access is denied.

The pure policy marks sensitive allows as audit-required. Durable audit/write atomicity and audit-store access control remain production implementation work.

## Completion rule

Production identity/authorisation is not accepted because the positive flows work.

It is accepted only when the expected cross-organisation, stale-session, protected-location, transaction-state and forged-client negative cases are demonstrably denied and audited where required.
