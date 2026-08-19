# SafeBed Licensing & Governance Decision Record Template v0.1

**Status:** decision template. Completing this file does not replace legal/charity advice where required.

Use this record before adding a `LICENSE` file or establishing the production operating entity.

## Decision scope

| Field | Value |
| --- | --- |
| Decision ID | `TBD` |
| Decision date | `TBD` |
| Status | `PROPOSED` |
| Review date | `TBD` |
| Accountable role/board | `TBD` |

Do not add private individual details or confidential legal advice to the public record.

---

# 1. Mission interpretation

Choose and justify one:

### A — Official-service non-profit rule

> The governed official SafeBed service must not generate/distribute private profit from welfare, but ordinary open-source rights may allow third parties to use the software commercially.

`Selected: YES / NO / TBD`

### B — Absolute non-commercial code rule

> No third party should be permitted to use SafeBed software commercially.

`Selected: YES / NO / TBD`

If B is selected, record explicitly that the project is choosing a **source-available/non-commercial** licensing direction rather than describing the code as OSI open source.

### Rationale

`TBD`

---

# 2. Operating entity

Candidate:

- `CIO`
- `CIC_LIMITED_BY_GUARANTEE`
- `OTHER`
- `NOT_YET_DETERMINED`

`Selected: TBD`

## Required reasoning

- How is private distribution prevented?
- How is the public/community purpose protected?
- Who owns/operates the production service?
- Who owns or controls the software/IP/trademark?
- How are safeguarding/data-controller responsibilities assigned?
- What happens to assets/IP on dissolution?
- What funding sources must the structure be able to receive?
- What conflicts/remuneration rules require professional advice?

### Public rationale

`TBD`

### Private advice/evidence reference

`TBD — non-sensitive identifier only`

---

# 3. Central application/server licence

Candidates currently under review:

- `AGPL-3.0`
- `MPL-2.0`
- `APACHE-2.0`
- `CUSTOM_SOURCE_AVAILABLE`
- `OTHER`
- `NO_LICENCE_YET`

`Selected: NO_LICENCE_YET`

## Questions

- Must hosted modifications be offered back as source?
- Is proprietary integration by code incorporation expected or should interoperability occur only through APIs?
- Is commercial third-party use allowed under the mission interpretation?
- What patent protections are needed?
- How important is licence familiarity to councils/charities/vendors?
- Will this licence discourage useful contribution or create unacceptable proprietary forks?

### Rationale

`TBD`

---

# 4. Adapter / SDK licence

An adapter/SDK may have different adoption requirements from the central hosted service.

Candidates:

- same as central application;
- MPL-2.0;
- Apache-2.0;
- other.

`Selected: TBD`

### Rationale

`TBD`

---

# 5. Protocol/specification licence

The interoperability specification should be implementable independently of the official SafeBed application.

Candidates:

- `CC-BY-4.0` or other suitable documentation/specification licence;
- share-alike documentation licence;
- another standards-friendly licence following review.

`Selected: TBD`

### Rationale

`TBD`

---

# 6. Trademark / official-service identity

Decide:

- whether SafeBed name/logo are protected separately from software copyright;
- what a compatible fork/deployment may call itself;
- how an unsafe/unofficial deployment is prevented from implying official endorsement;
- what compatibility claims are permitted;
- who controls the official trademark/identity.

`Policy status: TBD`

---

# 7. Contribution model

Choose one or document another:

- ordinary inbound=outbound contribution under project licence;
- Developer Certificate of Origin (DCO);
- Contributor Licence Agreement (CLA);
- mixed model for code/specification.

`Selected: TBD`

## Questions

- Is copyright assignment necessary? Default should be **no** unless there is a strong reason.
- Does the operator need relicensing authority?
- How are employer/vendor contributions handled?
- How are patents handled?
- What contributor metadata may be stored publicly?

---

# 8. Mission-lock governance controls

Check that the governing documents/policies address, where applicable:

- [ ] no referral commission;
- [ ] no placement commission;
- [ ] no paid search ranking;
- [ ] no sale of personal/referral data;
- [ ] no private distribution of SafeBed welfare surpluses;
- [ ] conflicts of interest;
- [ ] donor/sponsor independence from placement decisions;
- [ ] asset-lock/dissolution destination as appropriate to legal form;
- [ ] public-benefit/community-purpose reporting;
- [ ] safeguarding accountability;
- [ ] data-protection accountability;
- [ ] lived-experience participation in governance/design;
- [ ] ability to suspend unsafe providers/integrations;
- [ ] transparency around material commercial/vendor relationships.

---

# 9. Decision test

Before marking the decision `ACCEPTED`, answer:

### Can the official SafeBed service legally distribute welfare-derived profit to private owners?

Expected: **No.**

Actual: `TBD`

### Can a provider pay SafeBed to rank above a more suitable placement?

Expected: **No.**

Actual: `TBD`

### Can SafeBed sell service-user/referral data?

Expected: **No.**

Actual: `TBD`

### If an open-source licence is chosen, does the public description admit that third-party commercial use may still be permitted?

Expected: **Yes — be accurate about the licence.**

Actual: `TBD`

### If commercial code use is prohibited, has SafeBed stopped describing that licence as open source?

Expected: **Yes.**

Actual: `TBD`

### Is the interoperability specification usable without adopting the official SafeBed application?

Expected: **Yes.**

Actual: `TBD`

---

# 10. Decision

## Selected structure

`TBD`

## Selected application licence

`NO_LICENCE_YET`

## Selected adapter/SDK licence

`TBD`

## Selected specification/documentation licence

`TBD`

## Selected contribution model

`TBD`

## Trademark/identity policy

`TBD`

## Public rationale

`TBD`

## Professional review completed

`NO / TBD`

## Effective date

`TBD`

---

# 11. Current default while undecided

Until this decision is accepted:

- repository remains publicly visible but not generally licensed for reuse;
- do not add an OSI/open-source badge;
- do not describe the repository as open source;
- do not accept substantial contributions without considering rights/licensing implications;
- continue synthetic/public-safe review and design work;
- preserve the no-private-profit welfare operating principle separately from the eventual code licence.
