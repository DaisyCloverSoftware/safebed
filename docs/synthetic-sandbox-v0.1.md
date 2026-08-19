# Synthetic Interoperability Sandbox v0.1

**Status:** non-production discovery harness using fictional services, destinations and provider behaviours only.

The sandbox exists to prove SafeBed's core invariants before any real provider integration or service-user data is introduced.

## Why multiple provider profiles matter

A provider exposing a current capacity number does not necessarily support electronic referral, holds or reservations.

SafeBed must represent what an integration can actually do so that a client never turns a read-only feed into a misleading **Book now** experience.

The sandbox therefore models capabilities separately from availability.

## Provider capabilities

Each adapter exposes:

- `integrationMode`
- `referralMode`
- `holdSupported`
- `reservationMode`

These capabilities are returned with SafeBed match results so a future UX can choose the correct next action.

For example, current capacity from a read-only feed may still be useful, but the action should be equivalent to **Contact provider / follow external referral route**, not **Reserve**.

## Five synthetic profiles

### 1. `LIVE_API`

Represents a provider with a transactional integration.

Synthetic behaviour:

- capacity can be read with a revision token;
- SafeBed referral transaction supported;
- time-limited hold supported;
- reservation transaction supported;
- provider remains authoritative for capacity.

### 2. `READ_ONLY_FEED`

Represents a provider whose current availability can be read electronically but whose referral/placement workflow remains outside SafeBed.

Synthetic behaviour:

- capacity can be `AVAILABLE`/`LIMITED`;
- referral mode is `EXTERNAL_MANUAL`;
- SafeBed hold is not supported;
- reservation mode is `EXTERNAL_MANUAL`;
- attempts to invoke unsupported SafeBed transactions fail explicitly.

This profile proves that **live availability does not imply bookability**.

### 3. `SAFEBED_PORTAL`

Represents a smaller provider without a suitable external API that participates through a SafeBed-operated provider interface.

Synthetic behaviour:

- capacity is maintained through the SafeBed-facing adapter/portal workflow;
- referral workflow can be performed through the portal;
- hold can be supported;
- reservation can be confirmed through the portal.

This lets a provider participate without pretending it has an API or replacing its wider case-management system.

### 4. `MANUAL_CONFIRMATION`

Represents a provider where a nominal capacity number is insufficient to claim that a usable place is available.

Synthetic behaviour:

- a numeric capacity may exist;
- SafeBed normalises the state to `MANUAL_CONFIRMATION_REQUIRED`;
- it is not counted as a confirmed placement candidate;
- referral/reservation remains external/manual in the current fixture.

This proves that **a non-zero count is not automatically a safe live bed claim**.

### 5. `RESTRICTED_SPECIALIST`

Represents a protected specialist accommodation workflow.

Synthetic behaviour:

- the service can be discoverable;
- exact destination data is absent from discovery results;
- referral/hold/reservation transactions can be represented;
- a normal verified-professional role does not receive the restricted destination;
- destination disclosure is governed separately by the synthetic specialist-authorisation policy.

The current role model is a test fixture only; production identity and authorisation are tracked separately.

## Safety invariants currently covered

The combined regression suite covers:

- fresh capacity;
- stale capacity;
- provider outage;
- suitability separate from availability;
- last-space race conflict;
- idempotent hold retries;
- hold expiry restoring provider capacity;
- protected destination absent from discovery;
- role/policy-derived destination disclosure;
- five explicit integration modes;
- read-only feed refusing unsupported referral transactions;
- portal provider supporting transactions without claiming an external API;
- manual-confirmation capacity not becoming a confirmed candidate;
- restricted specialist workflow remaining protected.

## Deliberate limitations

The sandbox is not:

- a production API server;
- an identity provider;
- a database design;
- a case-management system;
- a real provider adapter;
- a DPIA or legal assessment;
- evidence that a specific real provider supports any capability.

## Public-data rule

All examples and fixtures must remain fictional.

Do not replace synthetic fixtures with real referral exports, protected addresses, provider credentials, confidential operating procedures, production logs or service-user information.

## Current acceptance direction

Before any real integration is attempted, SafeBed should be able to demonstrate that these materially different provider behaviours coexist without:

- duplicating authoritative inventory;
- creating fake booking capability;
- presenting stale/manual-confirmation capacity as live;
- leaking protected destinations;
- double allocating the final unit.
