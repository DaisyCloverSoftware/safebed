# SafeBed Dependency & CI Security Policy v0.1

**Status:** discovery/development policy for the public repository. Production deployment will require additional software-supply-chain review appropriate to its final architecture.

SafeBed operates in a welfare/safeguarding context. A compromised build dependency or CI workflow could become a route to protected data or production credentials later, so dependency control is part of the security model rather than only developer housekeeping.

## 1. Current principle

Prefer the smallest practical dependency surface.

Every new dependency should answer:

- What problem does it solve that the platform/runtime cannot reasonably solve itself?
- Is it maintained and appropriate for a high-risk public service?
- Does it add runtime privileges, network access, parsing risk or install-time execution?
- Can a smaller/narrower dependency or standard API solve the same problem?
- Will adding it make updates or incident response materially harder?

The current synthetic sandbox deliberately has only a TypeScript development dependency and uses Node's built-in test runner.

## 2. Exact direct versions

Direct npm dependencies/devDependencies must use exact versions rather than ranges.

Accepted example:

```json
"typescript": "7.0.2"
```

Not accepted without changing this policy:

```json
"typescript": "^7.0.2"
```

Dependabot/update PRs should therefore make the version change explicit in review.

## 3. Lockfile

`package-lock.json` is committed and is part of the reviewed source state.

CI installs using:

```sh
npm ci --ignore-scripts --no-audit --no-fund
```

This means ordinary validation:

- requires package.json and the lockfile to agree;
- installs the locked dependency graph;
- does not silently update the lockfile;
- does not run dependency lifecycle/install scripts.

Lockfile changes must be reviewed with dependency changes rather than regenerated casually.

## 4. Registry integrity

The repository's lock-policy check requires registry-resolved packages to carry integrity metadata in the npm lockfile.

The policy checker also rejects a resolved dependency declaring an install lifecycle script.

This is intentionally strict while SafeBed's dependency graph is small.

If a future dependency genuinely requires an install script:

1. do not simply remove the check;
2. document the package and script behaviour;
3. review the script/source and why it is necessary;
4. define the narrowest explicit exception/allowlist;
5. add a regression proving unrelated packages with install scripts remain blocked;
6. record the decision in the PR/security review.

## 5. CI permissions

Normal validation workflows should use the minimum GitHub token permissions required.

Current validation uses:

```yaml
permissions:
  contents: read
```

Ordinary pull-request tests must not receive write credentials or production/service secrets.

Checkout credentials are not persisted in the normal validation job.

Any temporary write-capable maintenance workflow must be:

- narrowly scoped;
- same-repository only where applicable;
- justified in review;
- removed immediately after its one-time task.

A permanent workflow must not inherit a temporary bootstrap's write permissions.

## 6. GitHub Actions

Third-party/GitHub Actions used by workflows must be referenced by immutable full commit SHA, with the human-readable release/version recorded as a comment where useful.

Do not replace a full SHA with a mutable major tag such as `@v4` merely for convenience.

Dependabot is configured to propose GitHub Actions updates so pinned SHAs can still receive reviewed updates.

## 7. Dependency maintenance

Dependabot is configured for weekly review of:

- npm dependencies;
- GitHub Actions.

An automated update PR is a proposed change, not an instruction to auto-merge blindly.

Before merge, dependency updates should pass:

- lock policy;
- synthetic regression tests;
- type checking;
- any relevant security/behavioural review.

## 8. Dependency-review questions

For a new runtime dependency, reviewers should consider:

- project/repository ownership and maintenance history;
- release/update cadence;
- transitive dependency size;
- known vulnerabilities/advisories;
- install/lifecycle scripts;
- native binaries/prebuilt downloads;
- postinstall network access;
- licence compatibility;
- ability to process untrusted input;
- access to filesystem/network/environment/secrets;
- whether it will execute in privileged backend code;
- whether the functionality belongs in an existing platform/standard instead.

A package being popular is not sufficient review.

## 9. No public secrets/private registries

The public repository and public CI must not contain:

- registry tokens;
- production API credentials;
- private registry URLs/configuration;
- provider credentials;
- internal runner/network details;
- `.npmrc` files containing credentials;
- copied production environment files.

If a future build legitimately needs a private package, its design requires a separate security/governance decision rather than adding credentials to ordinary public PR CI.

## 10. Cache policy

Dependency caching is currently disabled in the synthetic sandbox CI.

This keeps the early supply-chain path simple and avoids introducing cache trust/poisoning questions while the dependency graph is tiny.

If caching becomes operationally useful later, document:

- trusted writers/readers;
- cache key inputs;
- behaviour for fork/untrusted pull requests;
- whether executable dependency content is restored;
- invalidation/security response.

## 11. Vulnerability response

Potential dependency vulnerabilities follow `SECURITY.md` when the details could expose SafeBed users, protected locations, privileged systems or a production exploitation path.

Public dependency update/advisory discussion is appropriate only when doing so does not create a sensitive exploitation disclosure.

For material dependency vulnerabilities:

- assess whether the package/code path is actually used;
- identify affected SafeBed versions/environments;
- patch/update/remove as appropriate;
- rerun security/regression evidence;
- consider credential/session rotation if compromise is plausible;
- record the public-safe outcome without publishing harmful sensitive detail.

## 12. Build reproducibility acceptance

The current Node/TypeScript sandbox dependency gate is considered satisfied only when a clean GitHub Actions checkout can:

1. install with `npm ci --ignore-scripts` from the committed lockfile;
2. pass `npm run lockfile:check`;
3. pass the full synthetic regression suite;
4. pass strict TypeScript checking;
5. do so with read-only repository permission and no private secrets.

## 13. Production expansion trigger

Revisit this policy before SafeBed adds any of the following:

- web framework/server framework;
- database driver/ORM;
- authentication/OIDC library;
- cryptography library;
- mapping/geospatial dependency;
- file/document parser;
- templating system handling user/provider content;
- background job/queue system;
- observability agent;
- native binary;
- production container build/publish pipeline.

At that point consider stronger automated dependency review, SBOM/provenance and signed/reproducible build controls appropriate to the deployment platform.
