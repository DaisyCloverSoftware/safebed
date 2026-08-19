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

## Session/revocation tests

- [ ] membership removed while session active -> next privileged action denied promptly;
- [ ] organisation suspended while users logged in -> privileged actions denied promptly;
- [ ] specialist entitlement revoked -> restricted destination denied promptly;
- [ ] machine credential revoked -> next API call denied;
- [ ] logout invalidates privileged session as designed;
- [ ] step-up assurance expires according to policy;
- [ ] session does not retain a protected-resource decision after underlying placement state changes.

## Browser/client tests

- [ ] no protected location returned in JSON/HTML/client state before authorisation;
- [ ] hidden UI controls are not the enforcement boundary;
- [ ] manually calling hidden endpoints remains denied;
- [ ] forged `role`, `organisation_id`, `disclosure_level` or similar request fields do not increase privilege;
- [ ] error messages do not confirm existence of protected resources to unauthorised callers;
- [ ] predictable/guessed resource IDs do not bypass policy.

## Audit tests

- [ ] protected destination read creates audit event;
- [ ] specialist entitlement grant/revoke creates audit event;
- [ ] organisation suspension/revocation creates audit event;
- [ ] membership grant/revoke creates audit event;
- [ ] break-glass creates prominent audit event;
- [ ] audit entry contains no unnecessary referral narrative/location payload;
- [ ] unauthorised audit-log access is denied.

## Completion rule

Production identity/authorisation is not accepted because the positive flows work.

It is accepted only when the expected cross-organisation, stale-session, protected-location and forged-client negative cases are demonstrably denied and audited where required.
