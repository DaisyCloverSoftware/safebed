# SafeBed Licensing & Governance Options v0.1

**Status:** discovery options paper. No software, documentation or specification licence is selected by this document. This is not legal, charity, tax or accounting advice.

SafeBed has two separate public-good questions:

1. **How is the SafeBed service prevented from creating private profit from welfare?**
2. **What rights do third parties have to copy, modify, implement or operate the published software/specification?**

Those questions should not be collapsed into one licence decision.

---

# 1. Mission requirement

SafeBed's current non-negotiable operating principle is:

> **A vulnerable person's need for welfare or emergency accommodation must not become a private-profit event.**

The operating model therefore rejects:

- user fees for finding emergency accommodation;
- per-referral fees;
- per-placement commission;
- paid search ranking;
- selling personal/referral data;
- affiliate payments tied to welfare placement;
- private distributions derived from SafeBed's welfare activity.

Legitimate operating income may still be needed for:

- staff;
- hosting/infrastructure;
- security;
- safeguarding;
- support;
- accessibility;
- development;
- evaluation;
- appropriate reserves.

The mission rule is about **where value goes and which incentives are allowed**, not pretending the service has zero operating cost.

---

# 2. Important open-source limitation

A genuine Open Source Initiative (OSI) open-source licence cannot simply say:

> “Commercial use is forbidden.”

The Open Source Definition requires no discrimination against fields of endeavour. Restricting use to non-commercial organisations or prohibiting business use would therefore make the licence source-available/non-commercial rather than OSI open source.

This creates a real choice:

## Option A — open source + mission-locked operator

Third parties have ordinary open-source rights, potentially including commercial use, while the official SafeBed service is structurally governed as a public-good/non-profit operation.

## Option B — non-commercial source-available licence

Published source can be inspected/reused only within custom non-commercial limits.

This may align more literally with “nobody should profit from this software”, but should **not** be described as open source and may reduce interoperability/adoption.

## Option C — keep copyright unlicensed until the boundary is decided

This is the current repository position.

Public visibility alone does not create a general open-source licence.

---

# 3. Software licence candidates

## Candidate 1 — GNU AGPL v3

### What it does well

The GNU Affero General Public License is designed for software commonly run as a network service.

A material feature is that if somebody modifies an AGPL program, runs the modified version on a server and lets users interact with it over a network, those users must be offered the corresponding source for that modified version.

For SafeBed this could help prevent a pattern where an organisation:

- takes the public SafeBed server;
- makes private server-side changes;
- offers it as a hosted service;
- never contributes or publishes the modified source.

### What it does **not** do

AGPL does not prohibit commercial use or charging.

It is therefore **not a legal implementation of “nobody may ever profit from SafeBed software.”**

### Interoperability consideration

Strong copyleft may discourage some proprietary vendors from directly incorporating SafeBed code into their products.

That is less problematic if interoperability happens through open APIs/protocols rather than code linking/copying.

### Current assessment

**Strong candidate if the mission rule applies primarily to the official SafeBed operator while the ecosystem remains genuinely open source.**

Not selected yet.

---

## Candidate 2 — Mozilla Public License 2.0

### What it does well

MPL uses file-level copyleft. Modified MPL-covered files generally remain available under MPL, while the licence is designed to permit the covered code to coexist with differently licensed material in a larger work.

This can be attractive for interoperability libraries/adapters intended to be adopted by mixed proprietary/open systems.

### Trade-off

It does not address the network-service source-sharing gap as strongly as AGPL for the complete SafeBed server.

### Current assessment

**Potential candidate for specific interoperability libraries/adapters**, even if the central SafeBed service eventually uses a different licence.

Not selected yet.

---

## Candidate 3 — Apache License 2.0

### What it does well

Apache 2.0 is permissive and includes an express patent licence. It can reduce licence friction for adoption by councils, charities and software vendors.

### Trade-off

A third party can generally make proprietary modifications/derivatives without returning them to SafeBed, subject to the licence's notice/attribution/patent terms.

### Current assessment

**Strong interoperability/adoption option, weak mission/community-source protection.**

Potentially appropriate for small SDKs/reference clients where maximal adoption is more important than copyleft.

Not selected yet.

---

## Candidate 4 — custom non-commercial/source-available licence

### What it could do

A custom licence could attempt to prohibit commercial operation, referral charging or private monetisation.

### Major costs

- it would not be ordinary OSI open source if commercial use is prohibited;
- custom wording creates legal uncertainty;
- councils/vendors may require legal review before touching it;
- interoperability implementations may be deterred;
- “commercial use” is difficult to define cleanly in mixed public/charity/vendor ecosystems;
- a paid contractor helping a charity, a cloud host, a commercial housing-software vendor and a council procurement arrangement all create boundary questions.

### Current assessment

**Do not invent a custom licence casually.**

If an absolute no-commercial-reuse requirement is selected, specialist legal/licensing work is needed and the repository should be described as source-available, not open source.

---

# 4. Specification/documentation licence

The SafeBed protocol/specification has a different interoperability objective from the server software.

A useful public standard should normally be implementable without requiring everybody to copy the SafeBed application.

Potential approaches include:

- a permissive documentation/specification licence such as Creative Commons Attribution 4.0;
- share-alike documentation licensing;
- another standards-friendly licence chosen after legal review.

Do not use a Creative Commons licence as a substitute for an appropriate software licence for source code; Creative Commons itself recommends using established software licences for software.

### Current principle

> **Protocol interoperability should not depend on adopting the SafeBed application.**

The specification licence should therefore be considered separately from application code.

---

# 5. Operating-entity options in England and Wales

SafeBed's public-good rule may be better protected by the structure/governing document of the service operator than by software copyright alone.

## Option A — Charitable Incorporated Organisation (CIO)

A CIO is an incorporated legal structure specifically for charities, registered with the Charity Commission rather than Companies House.

Government guidance states that a CIO can act in its own name and trustees generally have limited/no liability for CIO debts/liabilities.

Potential SafeBed charitable-purpose territory includes recognised purposes such as:

- prevention or relief of poverty;
- advancement of health / saving lives;
- relief of people in need because of financial hardship or other disadvantage.

Actual charitable status depends on properly drafted purposes and public-benefit requirements; it is not automatic merely because SafeBed is well intentioned.

### Strengths for SafeBed

- strongest familiar public-benefit identity of the options considered here;
- charity-specific governance;
- no shareholders expecting returns;
- suitable for grants/donations that require charitable status;
- incorporated legal personality for contracts/staff.

### Questions requiring professional advice

- exact charitable objects and public-benefit formulation;
- trustee/member governance model;
- intellectual-property ownership/licensing;
- relationship with participating public/voluntary/commercial organisations;
- payment/remuneration/conflict rules;
- data-controller/operator responsibilities.

### Current assessment

**Strong candidate if SafeBed is intended to become a standalone charitable public service.**

Not selected yet.

---

## Option B — CIC limited by guarantee

A Community Interest Company (CIC) limited by guarantee is a social-enterprise company structure without shares/dividends.

Current CIC guidance describes the asset lock as a fundamental feature intended to prevent CIC assets, including profits/surpluses, being used for private gain rather than the community purpose.

Government guidance specifically notes that if dividends are not wanted, a CIC limited by guarantee may be the appropriate CIC form.

### Strengths for SafeBed

- explicit community-purpose/social-enterprise structure;
- incorporated company capable of contracting/employing;
- mandatory asset lock;
- no shares/dividends in the limited-by-guarantee model;
- potentially more flexible social-enterprise identity than charity status.

### Trade-offs/questions

- a CIC is not simply interchangeable with charity status;
- grant/funding/tax treatment differs and requires advice;
- governance must still explicitly encode SafeBed's no-referral-profit principles;
- a legal asset lock does not by itself define product ethics, data governance or safeguarding.

### Current assessment

**Strong fallback/alternative where a charity structure is unsuitable but permanent community-purpose/asset-lock protection remains required.**

Not selected yet.

---

# 6. Current working structure hypothesis

Without selecting an entity yet, the strongest public-good pattern appears to be:

```text
MISSION-LOCKED SAFEBED OPERATOR
    |
    +-- operates the welfare service without private distributions
    +-- owns/controls brand, safeguarding policy and production governance
    +-- receives grants/donations/public-service funding where appropriate
    +-- contracts with providers/public bodies
    |
    +-- PUBLIC SOFTWARE / SPECIFICATIONS
           |
           +-- application licence chosen separately
           +-- protocol/specification licence chosen for interoperability
           +-- synthetic public tests
           +-- no live confidential data in the repository
```

This prevents the software licence from being asked to solve governance problems it cannot reliably solve.

---

# 7. Mission-lock requirements for the operator

Whichever incorporated public-good structure is chosen, governing documents/policies should aim to preserve:

- no private distribution of SafeBed welfare surpluses;
- no referral/placement commission;
- no paid ranking;
- no sale of service-user/referral data;
- provider-neutral placement ordering;
- asset transfer only to an appropriate public-benefit/asset-locked destination on dissolution, where legally applicable;
- conflict-of-interest policy;
- transparent annual impact/financial reporting appropriate to structure;
- meaningful safeguarding/data-protection accountability;
- lived-experience influence over service design/governance;
- independence of placement decisions from donors/sponsors;
- ability to suspend integrations that create safeguarding risk.

---

# 8. Trademark / identity separation

Software copyright and project identity are different rights.

Even under an open-source software licence, the official SafeBed name/logo need not automatically become permission for any modified deployment to present itself as the official SafeBed service.

A future trademark/brand policy could help prevent:

- an unsafe fork implying official endorsement;
- a commercial operator claiming to be the official SafeBed network;
- confusion between compatible software and the governed public service.

Brand policy must not be used deceptively to undermine genuine licence rights to the code itself.

---

# 9. Contribution governance

Before accepting substantial external code/specification contributions, SafeBed should decide:

- project licence(s);
- whether contributors use Developer Certificate of Origin (DCO), contributor licence agreement (CLA), or ordinary inbound=outbound licensing;
- who may merge specification changes;
- security disclosure process;
- standards change process;
- how conflicts of interest are declared;
- how a contributor's employer/vendor relationship is disclosed when relevant;
- how backwards compatibility is managed.

Do not require contributors to surrender unnecessary rights merely because the repository is public-good.

---

# 10. Decision matrix

| Goal | AGPL-3.0 | MPL-2.0 | Apache-2.0 | Custom non-commercial |
| --- | --- | --- | --- | --- |
| OSI/open-source model | Yes | Yes | Yes | Usually no |
| Commercial use permitted | Yes | Yes | Yes | Can be prohibited |
| Modified hosted server must offer source | Strong | No equivalent whole-service network rule | No | Custom |
| Proprietary ecosystem integration friction | Higher | Medium/lower | Lowest | Potentially high/uncertain |
| Encourages modifications back to public | Strong for network service | File-level | Weak | Depends |
| Simple/widely understood | High | High | Very high | Low |
| Enforces official operator non-profit | No | No | No | Not reliably by itself |

The last row is the central point: **operator mission lock belongs primarily in governance, not in an ordinary open-source licence.**

---

# 11. Current recommendation — decision not yet final

Do **not** add a licence file yet.

Proceed in this order:

1. define whether the non-profit rule applies only to the official SafeBed operator or is intended to prohibit any third-party commercial use of the code;
2. obtain appropriate charity/CIC/legal advice on the operating structure;
3. decide whether SafeBed should be an independent charitable/public-benefit entity;
4. if genuine open source is desired, compare **AGPL-3.0 for the network service** against a more integration-friendly licence for adapters/SDKs;
5. choose a separate standards/documentation licensing strategy;
6. define trademark/official-service identity rules;
7. only then change the repository from “public but unlicensed” to an explicitly licensed project.

### Working preference if the rule means “the official SafeBed service must never produce private welfare profit”

The current architecture points toward:

- **charitable/public-benefit operating structure (CIO is a strong candidate; CIC limited by guarantee is a strong alternative);**
- **strong-copyleft consideration for the central hosted service (AGPL-3.0);**
- **more adoption-friendly treatment for protocol documentation and potentially small interoperability libraries;**
- **separate official-service/trademark governance.**

This is a design hypothesis, not a final legal decision.

### If the rule instead means “no third party may commercially use the SafeBed code”

Stop describing the intended licence as open source and obtain specialist advice on a source-available/non-commercial licence. Do not bolt a one-line “non-commercial” clause onto an existing open-source licence.

---

# 12. References

- Open Source Definition: https://opensource.org/osd
- GNU — Why the Affero GPL: https://www.gnu.org/licenses/why-affero-gpl.html
- Mozilla Public License 2.0 FAQ: https://www.mozilla.org/en-US/MPL/2.0/FAQ/
- Apache License 2.0: https://www.apache.org/licenses/LICENSE-2.0
- GOV.UK — Set up a charity: structures: https://www.gov.uk/setting-up-charity/structures
- GOV.UK — Charitable purposes: https://www.gov.uk/setting-up-charity/charitable-purposes
- GOV.UK — CIC guidance: https://www.gov.uk/government/publications/community-interest-companies-how-to-form-a-cic
