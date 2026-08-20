# SafeBed synthetic authorisation policy contract

This directory contains an **executable discovery contract**, not a production identity or authorisation service.

Its purpose is to turn the most important negative security assumptions in `docs/identity-and-authorisation-model-v0.1.md` into deterministic tests before SafeBed selects an identity provider or processes any real protected data.

## What the contract proves

The pure policy function in `policy.mjs` evaluates synthetic server-authoritative-style inputs including:

- human identity status;
- organisation verification state;
- active membership and expiry;
- explicit capabilities;
- machine-client scopes;
- provider/resource ownership;
- placement/referral relationship;
- disclosure class;
- provider/placement state;
- specialist programme entitlement;
- authentication assurance recency;
- bounded break-glass context.

It fails closed for unknown actions and does not use client-supplied `role`, `organisation_id`, `disclosure_level` or similar request fields as authority.

The synthetic regression is run with:

```sh
node scripts/authorisation-policy.test.mjs
```

## Deliberate non-features

This contract does **not**:

- authenticate a person;
- validate an OIDC token;
- select or configure an identity provider;
- create sessions/cookies;
- persist memberships or entitlements;
- implement a production policy engine;
- write a durable audit log;
- provide real break-glass access;
- contain real organisation/user/provider data;
- disclose any real or protected accommodation location.

A later production implementation may use a different language or policy engine. The important requirement is that the same security boundaries remain executable and are re-proven against the deployed server-side enforcement path.

## Safety rule

Only fictional/synthetic principals, organisations, services, placements and incident identifiers belong in this public contract.
