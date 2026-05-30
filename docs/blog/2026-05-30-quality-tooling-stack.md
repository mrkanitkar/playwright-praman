---
title: '22 quality gates, 21 security rules, and zero warnings: how Praman earns enterprise trust'
authors: [maheshwar]
tags: [praman, open-source, typescript-6, eslint-10]
date: 2026-05-30
description: 'Praman ships with 22 quality tools and 13 ESLint plugins enforced on every commit, push, and CI run — tiered coverage thresholds, 21 security rules, SBOM generation, and a 7-job CI pipeline. Here is every tool, why it exists, and how it protects your SAP test infrastructure.'
keywords:
  - praman quality tooling
  - SAP test automation code quality
  - ESLint SAP Playwright plugin
  - TypeScript strict mode SAP
  - enterprise open source quality
  - playwright-praman security
  - npm package quality gates
  - SAP CI CD pipeline testing
---

# 22 quality gates, 21 security rules, and zero warnings: how Praman earns enterprise trust

When your SAP Center of Excellence evaluates an open-source testing library, the feature list is necessary but not sufficient.
You need to trust the engineering behind it.
Can you hand this dependency to your security team and get sign-off?
Will it still build cleanly in three years when your SAP landscape has moved through five transport cycles?
Does the project have governance, or is it held together by convention and good intentions?

Praman ships with **22 quality tools** and **13 ESLint plugins** enforced on every commit, every push, and every CI run.
Zero warnings allowed. No exceptions.
This post walks through every one of them — with exact versions, configurations, and thresholds from the actual project —
so you can evaluate the engineering standard before you evaluate the feature set.

<!-- truncate -->

## Why quality tooling matters for SAP test automation

SAP landscapes sit in regulated environments. Financial audits, SOX compliance, GxP validation —
the downstream systems that your tests protect are subject to controls that extend upstream to every dependency in the pipeline.
When an auditor asks "how do you ensure the quality of your test automation tooling?", pointing at a README is not sufficient.
You need version-controlled configuration files, enforced thresholds,
and a CI pipeline that rejects non-conforming code before it reaches a release.

Long-term maintenance cost is the second concern. SAP projects run for years, sometimes decades.
A library with weak internal discipline accumulates dead code, inconsistent APIs, and subtle regressions.
That technical debt becomes your maintenance burden the moment you build a test suite on top of it.

Supply chain risk is the third.
A single npm package in your SAP CI pipeline has transitive impact on every app it tests.
You need a Software Bill of Materials, dependency vulnerability scanning, and provenance attestation —
not because it is fashionable, but because your procurement and security teams will ask for it.

Every tool described in this post exists to address one or more of these three concerns.

---

## Static analysis — 13 ESLint plugins, zero warnings

Praman uses **ESLint 10** with the flat config format (`eslint.config.mjs`).
Thirteen plugins provide rules across four categories: language quality, security, documentation, and domain-specific SAP patterns.
The lint target is strict: `--max-warnings=0`. A single warning anywhere in the codebase blocks the commit.

```bash
"lint": "eslint src/ tests/ --max-warnings=0"
```

| Plugin                                   | Category      | Key rules                                                              | What it catches                                |
| ---------------------------------------- | ------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| `typescript-eslint` (strict + stylistic) | Language      | `no-explicit-any`, `strict-boolean-expressions`, `naming-convention`   | Type safety, naming consistency                |
| `eslint-plugin-sonarjs`                  | Language      | `cognitive-complexity` (cap: 15), `no-identical-functions`             | Code smells, excessive complexity              |
| `eslint-plugin-promise`                  | Language      | `prefer-await-to-then`, `always-return`, `catch-or-return`             | Async/await correctness                        |
| `eslint-plugin-unicorn`                  | Language      | `prefer-node-protocol`, `filename-case` (kebab), `no-array-for-each`   | Modern JS idioms                               |
| `eslint-plugin-import-x`                 | Language      | `no-cycle`, `order` (alphabetical), `consistent-type-specifier-style`  | Import hygiene, circular dependency prevention |
| `eslint-plugin-n`                        | Language      | `prefer-promises/fs`, `no-process-exit`, `prefer-global/buffer: never` | Node.js best practices                         |
| `eslint-plugin-security`                 | Security      | 12 OWASP rules (see below)                                             | Injection, timing attacks, unsafe patterns     |
| `@microsoft/eslint-plugin-sdl`           | Security      | 9 SDL rules (see below)                                                | DOM injection, insecure URLs                   |
| `eslint-plugin-tsdoc`                    | Documentation | `tsdoc/syntax: error`                                                  | TSDoc syntax validation                        |
| `eslint-plugin-headers`                  | Documentation | `header-format`                                                        | Apache-2.0 license header on every file        |
| `eslint-plugin-playwright`               | Testing       | `no-wait-for-timeout`, `prefer-web-first-assertions`, `no-page-pause`  | Playwright best practices                      |
| `eslint-config-prettier`                 | Formatting    | (disables conflicting rules)                                           | ESLint/Prettier compatibility                  |
| `praman` (custom plugin)                 | Domain        | `no-deprecated-ui5-globals`, `no-deprecated-ui5-api`                   | SAP UI5 deprecated API usage                   |

Additional enforcement beyond plugins: `max-lines` warns at **300 LOC** per module. `page.waitForTimeout()` is banned via `no-restricted-properties` — a project principle that prevents hard-coded waits in SAP test automation.

### 21 security rules — OWASP + Microsoft SDL

Praman enforces security at two levels.
The **OWASP** plugin (`eslint-plugin-security`) catches Node.js-specific patterns —
`eval()`, `child_process`, timing attacks, unsafe regex, dynamic `require()`.
The **Microsoft SDL** plugin catches DOM and web patterns —
`document.write()`, `.innerHTML`, insecure `http://` URLs, `postMessage('*')`.

| OWASP (`eslint-plugin-security`)        | Level | Microsoft SDL (`@microsoft/eslint-plugin-sdl`) | Level |
| --------------------------------------- | ----- | ---------------------------------------------- | ----- |
| `detect-eval-with-expression`           | error | `no-insecure-url`                              | error |
| `detect-child-process`                  | error | `no-document-write`                            | error |
| `detect-non-literal-require`            | error | `no-inner-html`                                | error |
| `detect-unsafe-regex`                   | error | `no-postmessage-star-origin`                   | error |
| `detect-pseudoRandomBytes`              | error | `no-msapp-exec-unsafe`                         | error |
| `detect-buffer-noassert`                | error | `no-winjs-html-unsafe`                         | error |
| `detect-disable-mustache-escape`        | error | `no-html-method`                               | error |
| `detect-no-csrf-before-method-override` | error | `no-angular-bypass-sanitizer`                  | error |
| `detect-non-literal-fs-filename`        | warn  | `no-cookies`                                   | warn  |
| `detect-non-literal-regexp`             | warn  |                                                |       |
| `detect-object-injection`               | warn  |                                                |       |
| `detect-possible-timing-attacks`        | warn  |                                                |       |

**12 OWASP + 9 Microsoft SDL = 21 security rules**, all enforced on every commit.

### Custom ESLint plugin — SAP UI5 deprecation detection

Praman includes a custom ESLint plugin with two rules: `praman/no-deprecated-ui5-globals` and `praman/no-deprecated-ui5-api`.
These detect usage of deprecated SAP UI5 APIs in the library code itself —
APIs that were removed or replaced across UI5 versions.
Catching these at lint time prevents shipping code that silently breaks on newer SAP systems.

---

## TypeScript strictness — beyond `strict: true`

`strict: true` is table stakes. Praman enables **7 additional strictness flags** that go beyond what the `strict` umbrella covers:

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedSideEffectImports": true,
  },
}
```

| Flag                                 | What it catches                                     | Why it matters                                          |
| ------------------------------------ | --------------------------------------------------- | ------------------------------------------------------- |
| `noUncheckedIndexedAccess`           | Array/map access without `undefined` guard          | Prevents runtime `TypeError` on missing keys            |
| `noImplicitOverride`                 | Overriding a base method without `override` keyword | Makes inheritance explicit and refactor-safe            |
| `noPropertyAccessFromIndexSignature` | Dot notation on dynamic keys                        | Forces bracket notation where types are uncertain       |
| `noFallthroughCasesInSwitch`         | `switch` cases without `break`/`return`             | Eliminates a class of subtle logic bugs                 |
| `forceConsistentCasingInFileNames`   | `import './MyFile'` when file is `myfile.ts`        | Prevents cross-platform build failures (macOS vs Linux) |
| `exactOptionalPropertyTypes`         | `{ x?: string }` accepting `undefined` assignment   | Distinguishes "missing" from "explicitly undefined"     |
| `noUncheckedSideEffectImports`       | `import './polyfill'` without verification          | Audits side-effect-only imports                         |

Two additional module correctness flags — `verbatimModuleSyntax` and `isolatedModules` — ensure the codebase works correctly with both bundlers and direct `tsc` compilation. The CI matrix validates against **TypeScript 5.9.3, 6.0.2, and 7.x** on every push.

---

## Test coverage — tiered thresholds with per-file enforcement

Praman does not use a single global coverage threshold. Instead, it applies a **3-tier model** borrowed from Google and Microsoft testing best practices, where critical code gets stricter coverage requirements:

| Tier       | Scope                                                                      | Statements | Branches | Functions | Lines |
| ---------- | -------------------------------------------------------------------------- | ---------- | -------- | --------- | ----- |
| **Tier 1** | Error classes (`src/core/errors/`)                                         | 100%       | 100%     | 100%      | 100%  |
| **Tier 2** | Core infrastructure (config, logging, telemetry, utils, constants, compat) | 95%        | 90%      | 95%       | 95%   |
| **Tier 3** | All other modules (global minimum)                                         | 90%        | 85%      | 90%       | 90%   |

The critical detail is `perFile: true`.
This means every individual file must meet its tier threshold —
a single 100%-covered utility file cannot mask a 60%-covered module hiding in the same directory.
Coverage is measured by **V8** (engine-level instrumentation, same accuracy as Istanbul)
and reported in five formats: text, lcov, json-summary, json, and html.

```typescript
thresholds: {
  statements: 90,
  branches: 85,
  functions: 90,
  lines: 90,
  perFile: true,
  'src/core/errors/**/*.ts': {
    statements: 100, branches: 100, functions: 100, lines: 100,
  },
  'src/core/config/**/*.ts': {
    statements: 95, branches: 90, functions: 95, lines: 95,
  },
  // ... same 95/90/95/95 for logging, telemetry, utils, constants, compat
}
```

Watermarks are set at **80-95%** (yellow) and **95%+** (green) in the HTML coverage report, giving contributors immediate visual feedback on where they stand.

---

## Git hooks — three gates before code reaches CI

Praman uses **Husky** to enforce three git hooks. Code that fails any gate does not leave the developer's machine.

### pre-commit — lint-staged + strict TypeScript enforcement

The pre-commit hook runs two checks:

1. A script (`check-no-js-in-src.ts`) that **rejects any `.js` files in `src/`**. This is a strict TypeScript project — JavaScript files are a build artifact, never a source file.
2. **lint-staged**, which runs ESLint with auto-fix and Prettier on staged `*.ts` files, Prettier on staged `*.{json,md,yml,yaml}`, and markdownlint on staged `*.md` files.

### pre-push — full validation with main branch protection

The pre-push hook is the heavy gate. It blocks code that is not production-ready:

```bash
# Block direct pushes to main — require PRs
protected_branch="main"
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)
# ... rejects if pushing to main directly ...

# Run full validation with coverage
npm run spellcheck && npm run typecheck && \
  npm run test:unit -- --coverage && npm run build
```

**Direct pushes to `main` are blocked entirely.** Every change must go through a pull request. For all other branches, the hook runs spellcheck, type checking, the full unit test suite with coverage enforcement, and a production build. If any step fails, the push is rejected.

### commit-msg — conventional commits with 11 types and 26 scopes

Every commit message is validated by **commitlint** against the Conventional Commits specification.
The configuration defines **11 allowed types**
(feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert)
and **26 domain-aligned scopes**
(core, bridge, proxy, fixtures, auth, selectors, matchers, modules, fe, ai,
intents, vocabulary, reporters, cli, docs, ci, config, errors, logging,
prompts, telemetry, types, security, deps, release, adapter).

Subject lines are capped at **72 characters**, headers at **100**, and body lines at **200**. This ensures clean `git log` output and readable changelogs generated by release-please.

---

## Bundle size — 12 budgets across 6 entry points

Praman publishes **6 sub-path exports** in both ESM and CJS formats, giving 12 distinct bundles. Each one has an individual size budget enforced by **size-limit**:

| Entry point                    | ESM limit | CJS limit |
| ------------------------------ | --------- | --------- |
| `playwright-praman` (main)     | 200 KB    | 200 KB    |
| `playwright-praman/ai`         | 100 KB    | 100 KB    |
| `playwright-praman/intents`    | 50 KB     | 50 KB     |
| `playwright-praman/vocabulary` | 50 KB     | 50 KB     |
| `playwright-praman/fe`         | 50 KB     | 50 KB     |
| `playwright-praman/reporters`  | 50 KB     | 50 KB     |

**Total budget: 1000 KB** across all 12 bundles.
SAP CI pipelines install this package on every test run, often across sharded Playwright workers.
Bundle bloat compounds — a 10 KB increase in the main bundle means 10 KB per worker, per shard, per pipeline execution.
Per-entry-point budgets prevent any single module from growing unchecked while the overall package stays within budget.

---

## CI pipeline — 7 jobs, 9 OS/Node combinations

Every push and pull request triggers a **7-job CI pipeline** on GitHub Actions:

| Job                  | What it validates                                                      | Matrix                       | Timeout |
| -------------------- | ---------------------------------------------------------------------- | ---------------------------- | ------- |
| **quality**          | ESLint, TypeScript, cspell, Knip (dead code), markdownlint, clean tree | 1 runner                     | 10 min  |
| **unit-tests**       | Vitest with coverage thresholds                                        | 3 OS x 3 Node = **9 combos** | 10 min  |
| **build**            | CJS smoke test, ESM CLI smoke test, size-limit, attw export validation | 3 OS                         | 10 min  |
| **security**         | `npm audit --audit-level=high --omit=dev`                              | 1 runner                     | 5 min   |
| **docs-check**       | TypeDoc generation, Docusaurus build                                   | 1 runner                     | 10 min  |
| **azure-playwright** | Azure Playwright Service integration                                   | 1 runner (label-gated)       | 30 min  |
| **ts-compat**        | Cross-compilation with TS 5.9.3 and TS 6.0.2                           | 2 versions                   | 10 min  |

The **unit-tests** job runs on **ubuntu-latest, windows-latest, and macos-latest** with **Node 22, 24, and 26** — 9 combinations that catch platform-specific and runtime-version-specific failures before they reach users.

The **build** job does more than compile.
It runs a CJS smoke test (`require('./dist/index.cjs')`),
verifies the CLI entry point (`dist/cli/index.js --version`), checks bundle sizes against budgets,
and validates that all 6 sub-path exports resolve correctly for both ESM and CJS consumers
using `@arethetypeswrong/cli`.

Beyond the main CI workflow, the project also runs **CodeQL** weekly with `security-extended` queries, an **install-test** workflow (3 OS x 3 package managers = 9 install combinations), and a **canary release** workflow that publishes to the npm `@next` tag with provenance attestation.

---

## Documentation and spelling

### CSpell with SAP-domain dictionaries

Praman uses **cspell** for spell checking across all TypeScript source files and documentation.
Two custom dictionaries extend the standard English dictionary:
**project-words** (196 terms covering tools, packages, and code identifiers)
and **sap-terms** (120 terms covering SAP, UI5, Fiori, OData, and BTP domain vocabulary).

Content caching is enabled (`.cspell/.cspellcache`) with a content-based strategy, so unchanged files are not re-checked. The configuration also enforces **inclusive language**: exclusionary terms are flagged, with "allowlist", "denylist", "main", and "replica" suggested as alternatives.

### Markdownlint + TypeDoc

**markdownlint-cli2** validates all Markdown files against a custom ruleset that relaxes line length to 300 characters (necessary for wide tables) and allows inline HTML (necessary for complex layouts). The rest of the standard rules are enforced.

**TypeDoc** generates API documentation with `notDocumented: true` validation —
every public export (class, interface, function, enum, type alias, method, accessor) must have TSDoc documentation.
The **docs-verify** pipeline runs **8 automated checks** on every PR:
TypeScript snippet compilation, API signature verification, config default validation,
import path verification, AI-assisted review, SAP UI5 API verification,
code example execution, and cross-reference link validation.

---

## Supply chain security

### CycloneDX SBOM

The project generates a **CycloneDX 1.5** Software Bill of Materials
(`cyclonedx-npm --output-file playwright-praman.sbom.json --spec-version 1.5`).
This is the machine-readable inventory of every direct and transitive dependency,
versioned and formatted per the OWASP SBOM standard.
Enterprise procurement teams evaluating Praman can feed this file directly
into their existing vulnerability scanners and compliance tooling.

### npm audit + CodeQL + provenance

`npm audit --audit-level=high` runs in the CI **security** job on every push. Known vulnerable transitive dependencies are force-upgraded via npm `overrides` in `package.json` (for example, `picomatch@2.3.1` pinned to `2.3.2`, `smol-toml@<1.6.1` pinned to `1.6.1`).

**GitHub CodeQL** runs weekly with the `security-extended` query suite,
performing deep static analysis for vulnerabilities beyond what ESLint rules catch.
Every npm publish includes **provenance attestation**,
allowing consumers to verify the published package was built from the claimed source commit
in the claimed CI environment.

### Knip and attw — dead code and export validation

**Knip** scans the entire project for unused exports, unused dependencies, and unused files. Dead code increases audit surface without providing value — removing it reduces the amount of code that security reviewers need to examine.

**@arethetypeswrong/cli** (`attw`) validates that every entry in the `package.json` `exports` field
resolves correctly for both ESM (`import`) and CJS (`require`) consumers.
This catches the "works in my bundler but fails in yours" type resolution bugs
that are notoriously difficult to debug after publishing.

---

## The full stack at a glance

| #   | Tool                       | Version    | Category        | What it enforces                               |
| --- | -------------------------- | ---------- | --------------- | ---------------------------------------------- |
| 1   | ESLint (+ 13 plugins)      | 10.4.0     | Static analysis | Code quality, security, docs, style            |
| 2   | Prettier                   | 3.8.3      | Formatting      | Consistent code style                          |
| 3   | TypeScript                 | 6.0.3      | Type safety     | Strict type checking (7 flags beyond `strict`) |
| 4   | `@arethetypeswrong/cli`    | 0.18.2     | Type safety     | ESM + CJS export resolution                    |
| 5   | `@microsoft/api-extractor` | 7.58.7     | API surface     | Public API review + `.d.ts` rollup             |
| 6   | Vitest                     | 4.1.7      | Testing         | Unit test execution                            |
| 7   | `@vitest/coverage-v8`      | 4.1.7      | Testing         | Tiered coverage thresholds                     |
| 8   | Playwright                 | 1.60.0     | Testing         | Integration / E2E test execution               |
| 9   | Husky                      | 9.1.7      | Git hooks       | pre-commit, pre-push, commit-msg               |
| 10  | lint-staged                | 17.0.5     | Git hooks       | Staged file linting + formatting               |
| 11  | commitlint                 | 21.0.1     | Git hooks       | Conventional commit validation                 |
| 12  | TypeDoc                    | 0.28.19    | Documentation   | API docs generation + validation               |
| 13  | markdownlint-cli2          | 0.22.1     | Documentation   | Markdown style enforcement                     |
| 14  | cspell                     | 10.0.0     | Documentation   | Spell checking + inclusive language            |
| 15  | typescript-docs-verifier   | 3.0.2      | Documentation   | Doc code example compilation                   |
| 16  | npm audit                  | (built-in) | Security        | Dependency vulnerability scanning              |
| 17  | CodeQL                     | (GitHub)   | Security        | Weekly deep static analysis                    |
| 18  | `@cyclonedx/cyclonedx-npm` | 4.2.1      | Supply chain    | SBOM generation (CycloneDX 1.5)                |
| 19  | Knip                       | 6.14.2     | Dead code       | Unused exports, deps, files                    |
| 20  | size-limit                 | 12.1.0     | Bundle          | Per-entry-point size budgets                   |
| 21  | tsup                       | 8.5.1      | Build           | Dual ESM + CJS output                          |
| 22  | docs-verify pipeline       | (custom)   | Documentation   | 8 automated accuracy checks                    |

---

## What this means for your SAP project

**Auditability.** Every quality gate described in this post is configured in a version-controlled file —
`eslint.config.mjs`, `vitest.config.ts`, `tsconfig.json`, `.commitlintrc.json`, `.size-limit.json`, `cspell.json`.
Your security team can review the exact rules, thresholds, and enforcement levels. Nothing is implicit.

**Predictability.** Zero-warnings means every pull request merges at the same quality bar. There are no "we'll clean that up later" exceptions. Coverage thresholds, bundle budgets, and lint rules are enforced per-file, per-commit, and per-push — not just in CI where failures are easy to ignore.

**Trust signal.** The rigor applied to the library code is the same rigor
that will protect the test infrastructure you build on top of it.
When Praman's own error classes require 100% coverage and its own source files require
license headers and TSDoc documentation,
that standard carries through to the APIs and fixtures you use in your SAP test suites.

If you want to see these configurations firsthand, every file referenced in this post is public in the [GitHub repository](https://github.com/mrkanitkar/playwright-praman). Clone the project and run `npm run ci` locally — you will see every gate in action.

---

_Praman is open-source under the Apache-2.0 license.
[Docs](https://praman.dev) · [npm](https://www.npmjs.com/package/playwright-praman) · [GitHub](https://github.com/mrkanitkar/playwright-praman)_
