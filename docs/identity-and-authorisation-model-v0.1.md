# SafeBed Identity & Authorisation Model v0.1

**Status:** production-direction discovery model. Not a deployed identity system, security sign-off or permission to process live protected data.

The synthetic sandbox uses simple `ActorRole` values to test disclosure behaviour. Those values are intentionally **not** a production authentication or authorisation architecture.

Production SafeBed needs to answer two different questions:

1. **Who/what is this caller, and which verified organisation are they acting for?**
2. **May this caller perform this specific action on this specific resource in this specific placement state?**

Authentication answers the first. Server-side authorisation answers the second.

---

# 1. Non-negotiable rules

1. **Deny by default.** No privileged capability exists merely because a client sends a role/scope field.
2. **No browser-controlled privilege.** The browser may request an action; it may not grant itself a disclosure level.
3. **Organisation membership matters.** A person's identity alone does not prove they are currently authorised to act for a council/provider/support organisation.
4. **Protected accommodation needs resource/state-aware policy.** “Professional user” is too broad.
5. **Machine clients are separate identities.** Provider APIs must not reuse human user sessions/credentials.
6. **Rapid revocation is a product requirement.** A compromised person or organisation must be removable quickly.
7. **Privileged reads are auditable.** Viewing a protected destination can be as sensitive as changing a referral.
8. **Support/admin is not omniscient by default.** Platform operators should not automatically see protected referrals/locations.
9. **Identity data is minimised.** SafeBed should not become an employee-directory copy or store identity evidence it does not need.
10. **Synthetic public tests remain synthetic.** No real staff lists/credentials/provider membership data belongs in the public repository.

---

# 2. Standards direction

SafeBed should use established authentication/security protocols rather than invent its own credential system.

## Human authentication

Preferred direction:

- **OpenID Connect (OIDC)** for authentication/federation;
- OAuth 2.0 Authorization Code flow with **PKCE** for interactive clients;
- no OAuth implicit flow;
- strong redirect/issuer/audience/state/nonce validation;
- short-lived sessions/tokens appropriate to risk;
- step-up authentication for especially sensitive actions where justified.

RFC 9700 is the current OAuth 2.0 Security Best Current Practice and should be treated as a baseline for deployed OAuth/OIDC configuration.

## MFA / phishing resistance

Privileged SafeBed access should require MFA.

Prefer phishing-resistant cryptographic authenticators, for example WebAuthn/passkey-based authentication, where the selected identity provider and users support it.

A deployment may need transitional fallback factors for accessibility/operational reasons, but fallback must not silently reduce the protection of the most sensitive workflows.

## Machine authentication

Machine-to-machine integrations should use separate OAuth/API client identities and explicit scopes, not shared human credentials.

For higher-risk integrations consider sender-constrained credentials/tokens (for example mTLS or an appropriate proof-of-possession mechanism) where infrastructure/vendor support makes this practical.

Exact production mechanisms remain an implementation/security-design decision.

---

# 3. Identity objects

## `IdentitySubject`

Represents a human identity established by an approved identity provider.

Minimum conceptual fields:

- `subject_id` — SafeBed internal stable identifier;
- `issuer` — trusted identity-provider identifier;
- `external_subject` — stable OIDC `sub` or equivalent;
- `status` — `ACTIVE`, `SUSPENDED`, `REVOKED`;
- `created_at`;
- `last_security_review_at` where needed.

Do **not** use email address as the permanent identity key.

Email may change or be reassigned. Use the provider's stable subject identifier.

## `Organisation`

Represents the entity for which a caller acts.

Conceptual fields:

- `organisation_id`;
- `public_name`;
- `organisation_type`;
- `verification_status`;
- `verified_at`;
- `review_at`;
- `suspended_at` / `revoked_at` where applicable.

Example organisation types may include:

- local authority;
- accommodation provider;
- outreach/support organisation;
- specialist referral organisation;
- accredited hosting organisation;
- system/integration provider.

Type alone grants no permission.

## `OrganisationMembership`

Represents a person's current authority to act for an organisation.

Fields may include:

- `subject_id`;
- `organisation_id`;
- `status`;
- `role_set`;
- `valid_from`;
- `valid_until` where appropriate;
- `granted_by` / provenance;
- `review_at`.

Membership revocation must take effect promptly.

## `ProgrammeEntitlement`

Some permissions must be more specific than organisation role.

For example, access to a restricted specialist accommodation network may require an explicit entitlement issued/approved for that programme/pathway.

Conceptual fields:

- `subject_id` and/or `organisation_id`;
- `programme_id`;
- `entitlement_type`;
- `status`;
- `valid_until`;
- `issuer/provenance`.

This prevents a generic “verified professional” role from becoming a universal key to every protected service.

## `MachineClient`

Represents an API/integration identity.

Fields may include:

- `client_id`;
- `organisation_id`;
- `integration_id`;
- approved scopes;
- credential/key identifier;
- status;
- rotation/review metadata.

Machine clients cannot inherit interactive human privileges implicitly.

---

# 4. Organisation verification

A verified email/domain is useful evidence but is **not sufficient by itself** to create a trusted SafeBed organisation.

SafeBed needs a documented organisation-verification process appropriate to risk.

Possible evidence sources may include, where relevant:

- official public-sector identity;
- registered charity/company/CIC information;
- commissioning/contracting relationship;
- recognised provider/network accreditation;
- specialist-network approval;
- direct verification through an accountable organisational representative.

Do not collect an oversized bundle of identity documents “just in case”. Record the result/provenance required for verification and keep sensitive verification evidence in an appropriate private system.

## Organisation states

- `PENDING`
- `VERIFIED`
- `SUSPENDED`
- `REVOKED`
- `EXPIRED_REVIEW_REQUIRED`

A `SUSPENDED` or `REVOKED` organisation must lose privileged access promptly even if individual user sessions/tokens were previously valid.

---

# 5. Human role model

Roles are coarse capability groupings, not the final authorisation decision.

Possible roles include:

## Public / anonymous

No organisational trust.

Can access public-safe service discovery only.

## Verified support professional

A current member of a verified support/referral organisation.

May receive professional referral routes and create referrals only where both provider policy and organisation permissions allow it.

Does **not** automatically receive restricted destinations.

## Provider referral worker

Current member of the provider organisation.

May review referrals for services owned/managed by that provider, subject to local role restrictions.

## Provider capacity manager

May update/confirm capacity for authorised service/unit scopes.

Need not automatically access full referral narratives.

## Provider safeguarding/decision role

May perform provider-specific assessment/decision actions requiring additional authority.

## Specialist authorised professional

This should normally be implemented as an ordinary verified role **plus an explicit specialist programme entitlement**, not as one global SafeBed super-role.

## Organisation administrator

May invite/remove memberships or manage permitted organisational configuration.

Does not automatically receive referral/protected-location data.

## SafeBed support operator

Platform-support role with minimal ordinary access.

Support workflows should prefer metadata/diagnostic identifiers rather than full referral content.

## SafeBed security administrator

Security/identity administration separated from routine provider/client data where practical.

---

# 6. Authorisation model

SafeBed should use resource/action/context policy, not simple UI role checks.

A policy decision should consider at least:

```text
SUBJECT
+ authenticated identity status
+ organisation membership
+ organisation verification status
+ role/capability
+ specialist/programme entitlement

ACTION
+ search
+ read professional service data
+ create referral
+ review referral
+ request hold
+ confirm reservation
+ disclose destination
+ manage capacity
+ administer membership

RESOURCE
+ provider organisation
+ service
+ referral
+ hold/reservation/placement
+ disclosure classification

STATE
+ referral state
+ placement state
+ provider decision
+ hold validity
+ current service/integration state

CONTEXT
+ authentication assurance / step-up state
+ client type
+ risk/security flags
```

Result:

- `ALLOW`
- `DENY`
- `REAUTHENTICATION_REQUIRED`
- `ADDITIONAL_APPROVAL_REQUIRED`

The UI should render only permitted actions for usability, but **the server must enforce the policy independently**.

---

# 7. Disclosure policy examples

## Public location

Action:

`READ_LOCATION`

Resource:

`disclosure_level = PUBLIC`

Outcome:

Anonymous/public access may be allowed according to service policy.

## Placement-authorised location

Require, at minimum:

- authenticated active subject;
- active membership of permitted organisation;
- valid referral/placement relationship;
- provider accepted/authorised placement state;
- caller permitted to receive destination;
- destination disclosure event logged.

A query parameter such as `?include_address=true` cannot satisfy these requirements.

## Restricted specialist location

Additionally require:

- active specialist programme entitlement;
- programme/provider authorisation;
- correct placement state;
- any required step-up authentication;
- audit event.

## Sealed location

Ordinary SafeBed API returns no location even to general admins.

A specialist provider-to-provider workflow outside ordinary API disclosure may be required.

---

# 8. Role/disclosure matrix — initial hypothesis

`✓` means potentially permitted subject to resource/state policy, **not unconditional access**.

| Action/data | Public | Verified professional | Provider worker | Specialist-entitled professional | Org admin | Platform support |
| --- | --- | --- | --- | --- | --- | --- |
| Public service discovery | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Professional referral route | — | ✓ | ✓ | ✓ | — | — |
| Submit permitted referral | — | ✓ | provider-specific | ✓ | — | — |
| Review provider referral | — | — | ✓ | provider-specific | — | — |
| Update provider capacity | — | — | role-specific | role-specific | — | — |
| Placement-authorised destination | — | policy/state | policy/state | policy/state | — | — by default |
| Restricted specialist destination | — | — | provider-specific | ✓ with entitlement/state | — | — by default |
| Organisation membership admin | — | — | — | — | ✓ | security-admin only |

A production matrix must be generated/tested from the actual policy implementation.

---

# 9. Privileged authentication requirements

## Baseline

All privileged human roles:

- MFA required;
- secure session lifecycle;
- account/session revocation;
- no shared accounts;
- recovery process with fraud/takeover protections.

## Stronger actions

Consider requiring recent/step-up phishing-resistant authentication for actions such as:

- first disclosure of a restricted protected location;
- organisation admin/security changes;
- specialist entitlement management;
- break-glass access;
- key/credential management.

The exact assurance level should be determined by the threat model and user accessibility/operational constraints.

---

# 10. Browser/session architecture direction

For the SafeBed web application, prefer a design that minimises powerful bearer tokens exposed to browser JavaScript.

A **backend-for-frontend (BFF)** or equivalent server-managed session can:

- keep OAuth access/refresh tokens server-side;
- expose a narrowly scoped secure session cookie to the browser;
- use `Secure`, `HttpOnly` and appropriate `SameSite` protections;
- centralise token refresh/revocation;
- reduce damage from browser token theft.

Exact architecture requires implementation review; this document does not mandate one framework/product.

If a public/native client directly performs OAuth, use Authorization Code + PKCE and follow current OAuth security BCP rather than older implicit patterns.

---

# 11. Session and token requirements

Production policy should define:

- token/session lifetime;
- idle timeout;
- absolute timeout;
- refresh-token behaviour where used;
- revocation triggers;
- session/device list;
- organisation revocation propagation;
- step-up lifetime;
- CSRF protection for cookie sessions;
- audience/issuer validation;
- replay protection as appropriate.

Sensitive actions must not rely on a week-old cached authorisation snapshot when organisation membership or placement state has changed.

---

# 12. Machine integration scopes

Possible narrow scopes include:

- `service.read`
- `capacity.read`
- `capacity.write`
- `referral.receive`
- `referral.status.write`
- `hold.manage`
- `reservation.manage`
- `placement.arrival.write`

Do not issue a generic `admin` scope to provider integrations.

Machine-client policy should additionally bind access to:

- organisation;
- specific services/integration;
- permitted direction of data flow;
- environment;
- credential/key status.

---

# 13. Offboarding and revocation

Revocation is a core safeguarding control.

## User leaves organisation

Organisation admin or verified workflow removes/suspends membership.

Expected effect:

- no new privileged actions;
- active privileged sessions/tokens revoked or rendered ineffective promptly;
- specialist entitlements removed where tied to membership;
- audit event recorded.

## Organisation loses trust

Set organisation `SUSPENDED`/`REVOKED`.

Expected effect:

- privileged human access blocked;
- machine integrations blocked;
- new referrals/holds prevented;
- existing live placements handled through documented continuity/safeguarding process rather than blindly deleted;
- audit/security event raised.

## Credential compromise

Support immediate:

- user-session revocation;
- authenticator reset workflow;
- machine credential/key revocation;
- investigation/audit preservation;
- protected-location exposure assessment where relevant.

---

# 14. Break-glass access

Avoid ordinary platform-admin omniscience.

If emergency support access to restricted data is genuinely required, implement an explicit break-glass mechanism with:

- narrowly defined permitted roles;
- stated reason/ticket/incident context;
- step-up authentication;
- time-limited grant;
- prominent audit event;
- post-event review/notification where policy permits;
- no bulk browsing.

Break-glass is not a substitute for correct ordinary permissions.

---

# 15. Audit requirements

Record privileged security events such as:

- successful/failed privileged authentication;
- MFA/authenticator changes;
- organisation verification/suspension/revocation;
- membership grant/revoke;
- specialist entitlement grant/revoke;
- machine credential lifecycle;
- protected-resource read;
- protected destination disclosure;
- referral/hold/reservation mutation;
- break-glass action;
- administrative policy/configuration change.

Avoid placing sensitive payloads in the audit log when an identifier/action/result is sufficient.

Audit access itself requires authorisation.

---

# 16. Organisation onboarding flow

Suggested high-level workflow:

```text
APPLICATION / INVITATION
      ↓
ORGANISATION VERIFICATION
      ↓
NAMED ORGANISATION ADMIN(S)
      ↓
MEMBERSHIP INVITATION
      ↓
OIDC IDENTITY + MFA
      ↓
ROLE/CAPABILITY GRANT
      ↓
OPTIONAL SPECIALIST ENTITLEMENT
      ↓
PERIODIC REVIEW
```

No stage should require public GitHub disclosure of private verification evidence.

---

# 17. Authorisation test strategy

Before controlled live use, automated tests should cover the policy matrix.

Required negative tests include:

- public user requests professional endpoint -> denied;
- verified professional requests provider capacity write -> denied;
- professional guesses restricted service ID -> no protected data;
- organisation admin requests referral narrative -> denied unless separately authorised;
- platform support requests protected destination -> denied by default;
- specialist user without active entitlement -> denied;
- correct entitlement but referral not accepted -> destination denied;
- accepted placement + correct entitlement -> allowed where policy permits;
- suspended membership with old session -> denied;
- suspended organisation with valid token -> denied;
- revoked machine credential -> denied;
- browser supplies forged role/organisation header/field -> ignored/denied;
- service belonging to another provider -> provider worker denied;
- expired hold -> reservation denied;
- break-glass without step-up/reason -> denied.

Positive tests must be paired with nearby negative tests; “happy-path works” is not sufficient authorisation evidence.

---

# 18. Security/privacy tests

Before a protected-location pilot:

- inspect browser network responses/client state for hidden addresses/coordinates;
- inspect error objects/logs for protected data leakage;
- test IDOR/BOLA-style resource access across organisations/referrals;
- test stale role/membership caches;
- test logout/revocation;
- test passwordless/MFA recovery abuse paths;
- test organisation-admin invitation abuse;
- test specialist entitlement removal;
- test machine scope isolation;
- test support/admin tooling;
- test audit completeness for protected reads.

---

# 19. Synthetic model transition

The existing synthetic sandbox values:

- `PUBLIC`
- `VERIFIED_PROFESSIONAL`
- `PROVIDER`
- `SPECIALIST_AUTHORISED`

remain useful **test labels**, but production code should not accept them directly from requests.

A production request should derive an effective policy context from authenticated identity/session and server-side records.

Conceptually:

```text
OIDC SUBJECT
   + ACTIVE ORGANISATION MEMBERSHIP
   + VERIFIED ORGANISATION
   + ROLE/CAPABILITY
   + OPTIONAL PROGRAMME ENTITLEMENT
   + RESOURCE OWNERSHIP
   + PLACEMENT STATE
   + AUTHENTICATION ASSURANCE
   ↓
SERVER POLICY DECISION
   ↓
ALLOW / DENY / STEP-UP / ADDITIONAL APPROVAL
```

---

# 20. Production identity acceptance gate

Issue #9 should not be considered complete until a production implementation demonstrates:

- trusted OIDC authentication;
- MFA for privileged users;
- phishing-resistant option/step-up policy appropriate to risk;
- verified organisations;
- membership lifecycle;
- separate specialist entitlements;
- machine identities/scopes;
- deny-by-default server authorisation;
- organisation/resource isolation tests;
- protected-location disclosure tests;
- rapid person/organisation/client revocation;
- privileged-read audit;
- support/admin least privilege;
- incident/recovery process.

Only then can the synthetic `ActorRole` concept be considered safely replaced.

---

# 21. References

- OpenID Connect Core 1.0: https://openid.net/specs/openid-connect-core-1_0.html
- RFC 9700 — Best Current Practice for OAuth 2.0 Security: https://www.rfc-editor.org/rfc/rfc9700.html
- W3C Web Authentication Level 3: https://www.w3.org/TR/webauthn-3/
- NIST SP 800-63B-4 — Authentication and Authenticator Management: https://pages.nist.gov/800-63-4/sp800-63b.html
