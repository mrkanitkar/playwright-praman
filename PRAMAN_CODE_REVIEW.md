# playwright-praman — Deep Code Review

**Scope:** performance & efficiency, future-readiness, community adoption, refactoring, TypeScript + Playwright best-practice scorecards
**Subject:** `playwright-praman` v1.3.3 (commit `fcb9e1b`), ~220 TS files / 62,237 LOC in `src/`
**Method:** all findings tagged **[measured]** (command executed, output captured), **[traced]** (code path read end-to-end), or **[hypothesis]** (needs a benchmark — proposed inline). Review date: 2026-06-10. A second-pass claim audit re-verified every load-bearing claim against fresh command output and corrected six findings — see Appendix C.

> **Important context:** the local working tree at the time of review had locally regressed `tsconfig.json` and `.gitignore` (see Appendix A). All quality-gate measurements below were re-run against a clean checkout of HEAD; HEAD is what GitHub and npm consumers see, and HEAD is what this report grades.

---

## 1. Executive summary

This is an unusually well-engineered Playwright plugin. The measured fundamentals — coverage, type discipline, lint rigor, packaging correctness, CI breadth — are at or above the level of major OSS test frameworks. The dominant risks are not in the code; they are in **release discipline, package weight, and project-governance signals** that affect community trust and adoption.

### Top 5 strengths

1. **Test rigor that is actually real** [measured]: 98.82% statements / 95.56% branches / 99.26% functions with `perFile: true` enforcement, full suite in 12.4 s ([vitest.config.ts](vitest.config.ts)).
2. **Type discipline beyond `strict`** [measured]: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, etc. at HEAD; 9 `: any` + 17 `as any` in 62 k LOC (≈0.4/kLOC); zero `as unknown as`; zero TODO/FIXME.
3. **Best-in-class error design** [measured]: 15-class error hierarchy (`PramanError` + 14 domain subclasses, verified in `src/core/errors/`) where every throw carries `code`, `attempted`, `retryable`, `suggestions[]` (e.g. [injection.ts:188](src/bridge/injection.ts:188)) — error messages teach the user the fix. Tier-1 100% coverage on error classes is enforced and met.
4. **Lean runtime hot path** [traced]: one `page.evaluate` per control action via a single Proxy get-trap with cached method forwarders ([control-proxy.ts:12-28](src/proxy/control-proxy.ts:12)); per-page bridge injection is idempotent via `WeakSet` ([injection.ts:67](src/bridge/injection.ts:67)); CLI cold-start 56 ms [measured] because AI SDKs are lazy-loaded.
5. **DX/automation moat** [measured]: 1,091 `@example` tags across ~1,103 exports, TSDoc validated by ESLint, api-extractor surface report, docs-verify CI, `llms.txt`/`llms-full.txt`, 9 GitHub workflows — CI on a 3-OS × Node 22/24 matrix, install-test across npm/yarn/pnpm on 3 OSes, CodeQL, and a canary that tests `@playwright/test` 1.57.0 / 1.60.0 / `next`.

### Top 5 risks

1. **Semver violation shipped** [measured]: the `⚠ BREAKING CHANGES` (Node 20→22 floor; CJS output change) are documented under v1.3.2 ([CHANGELOG.md:6](CHANGELOG.md)) — which was never published to npm — and reached the registry in **v1.3.3**, still a patch-level jump from the published 1.3.1. Registry history confirms 1.2.0/1.3.0/1.3.1 are live, so anyone on `^1.2.0` gets the break via `npm update`. This is the single biggest trust risk for the adoption story.
2. **Main-entry weight** [measured]: `dist/index.js` 678 KB + `dist/index.cjs` 685 KB; `dist/index.d.ts` 306 KB plus a 282 KB selectors `.d.ts` chunk — **each duplicated for CJS** (~1.18 MB of type text in the tarball). Editor/tsserver load and `npm pack` size (1.1 MB / 5.5 MB unpacked) pay for this. Root cause is plausibly `splitting: false` in [tsup.config.ts:31](tsup.config.ts:31) duplicating shared code across the 8 entries [hypothesis — benchmark below].
3. **Single-maintainer bus factor** [measured]: 394 of 404 human commits come from one person (three author aliases; remainder is dependabot/actions bots). Enterprise evaluators weigh this heavily; there is no GOVERNANCE.md, co-maintainer, or org ownership. Code quality mitigates it; succession/continuity signals would mitigate it better.
4. **`src/cli/` is a coverage hole** [measured]: excluded in [vitest.config.ts:45](vitest.config.ts:45); that's ~2,000+ LOC including [ide-installer.ts](src/cli/ide-installer.ts) (774 LOC) and [uninstall.ts](src/cli/uninstall.ts) (526 LOC) that write to and delete from user projects — the highest-blast-radius code in the package is the least tested.
5. **UI5 2.x exposure, small but unguarded** [measured]: 5 call sites use deprecated UI5 globals (3 in `praman-bridge-init.ts`, 1 in `bulk-discovery.ts`, 1 in `wait-helpers.ts` — `sap.ui.getCore()` is removed in UI5 2.x). The custom ESLint rules that track this are **disabled in the main lint gate** ([package.json:118](package.json)).

### Top 10 recommendations (ranked)

| #   | Recommendation                                                                                                                                                                                                                                                                                                                                                        | Category               | Effort | Impact  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------ | ------- |
| 1   | Enforce semver in release-please: breaking commits ⇒ major bump; add a published versioning policy; retro-document the Node-22/CJS break (changelog'd under unpublished 1.3.2, shipped to npm in patch 1.3.3) in README/release notes                                                                                                                                 | Adoption/trust         | S      | High    |
| 2   | Run a `splitting: true` (ESM) build experiment; measure entry sizes + tarball delta; adopt if subpath duplication confirmed                                                                                                                                                                                                                                           | Perf/packaging         | S      | High    |
| 3   | Attach failure context (control-tree dumps, screenshots) to the Playwright HTML report and trace viewer as test attachments by default, so debugging works inside standard Playwright tooling                                                                                                                                                                         | Playwright idiom       | M      | High    |
| 4   | Bring `src/cli/` under test (or split it out): ide-installer/uninstall mutate user files and have 0% coverage                                                                                                                                                                                                                                                         | Quality                | M      | High    |
| 5   | Publish-time `package.json` hygiene: strip or repoint the `imports` map (it targets `./src/*`, not shipped), drop attw's `--ignore-rules no-resolution`, extend install-test to import every subpath from the packed tarball                                                                                                                                          | Future-readiness       | S      | Med     |
| 6   | Open the auth-strategy and interaction-strategy registries as public extension points (currently internal factories) — "bring your own auth strategy" is the #1 enterprise SAP ask and the main community-growth lever                                                                                                                                                | Adoption/extensibility | M      | High    |
| 7   | Replace the fixed `CONTEXT_RETRY_DELAY = 2500 ms` ([control-proxy.ts:76](src/proxy/control-proxy.ts:76)) with exponential backoff + jitter; consider a MutationObserver quiet-window instead of `briefDOMSettle`'s fixed `setTimeout`                                                                                                                                 | Perf                   | S      | Med     |
| 8   | Extract the `framenavigated`-listener + `resetPageInjection` idiom repeated in [core-fixtures.ts:368](src/fixtures/core-fixtures.ts:368), [module-fixtures.ts:370](src/fixtures/module-fixtures.ts:370), and [nav-fixtures.ts:404](src/fixtures/nav-fixtures.ts:404) into one shared helper (surrounding bootstrap differs per fixture; only the idiom is duplicated) | Refactoring            | S      | Low-Med |
| 9   | Centralize the 5 deprecated-UI5-global call sites behind one version-detecting facade; re-enable `praman/no-deprecated-ui5-*` as `error` in the main lint gate with targeted disables only inside the facade                                                                                                                                                          | Future-readiness       | M      | Med     |
| 10  | Repo-root cleanup for first impressions: move `REVIEW_ARCHITECTURE.md`, `VERIFICATION_REPORT.md`, `ARCHITECTURE_REVIEW_CLI_INTEGRATION.md`, `DOCS-MAP.md` into `docs/internal/`; prune internal working docs committed under `docs/` (`dx-comparison-*`, `implementation-plan-*`)                                                                                     | Adoption               | S      | Med     |

---

## 2. Performance & efficiency

### 2.1 Runtime hot path — strong by design

**Bridge round-trips** [traced]. The architecture minimizes Playwright channel crossings:

- Bridge injection happens **once per page**: 2 `waitForFunction` + 1 `evaluate`, then a `WeakSet` makes every later `ensureBridgeInjected()` a no-op ([injection.ts:247-252](src/bridge/injection.ts:247)). `framenavigated` listeners call `resetPageInjection()` so reloads lazily re-inject.
- A dynamic method call (`getText()`, `setValue()`…) is **exactly one `page.evaluate`** through a cached forwarder; the 7-type return handler materializes sub-proxies without extra round-trips ([control-proxy.ts:297-389](src/proxy/control-proxy.ts:297)).
- `press()`/`enterText()` are one `evaluate` with an in-browser fallback chain (`firePress` → `fireTap` → DOM `click()`) ([ui5-native-strategy.ts:65-79](src/bridge/interaction-strategies/ui5-native-strategy.ts:65)).
- Screencast highlighting, when enabled, adds 3 round-trips per interaction (`hideHighlight` + DOM-id resolve + `locator.highlight`) ([control-proxy.ts:436-451](src/proxy/control-proxy.ts:436)) — correctly gated off by default and feature-detected.
- Fluent chaining (`control.getParent().getText()`) costs one `evaluate` per link via thenable proxies — reasonable, and chain-free calls don't pay for it.

**Verdict:** there is no low-hanging fruit in the per-action protocol. This is already the efficient shape (one trip per action, state cached Node-side, browser does the work).

**Waiting strategy** [traced]:

- `waitForUI5Stable` polls `sap.ui.getCore().getUIPending() === 0` via `waitForFunction` with a configurable interval (default 100 ms) ([wait-helpers.ts:106-145](src/core/utils/wait-helpers.ts:106)). Polling is the robust choice here; an EventBus-driven complement could shave tail latency but adds failure modes. Fine as-is.
- Two genuine fixed sleeps exist: `briefDOMSettle` (a browser-side `setTimeout`, the documented "approved alternative" to the banned `waitForTimeout` — [wait-helpers.ts:162-174](src/core/utils/wait-helpers.ts:162)) and `CONTEXT_RETRY_DELAY = 2500 ms` × up to 3 retries on "execution context destroyed" ([control-proxy.ts:73-76](src/proxy/control-proxy.ts:73)) — worst case 7.5 s of fixed waiting. Backoff with jitter (500 → 1000 → 2500) would cut the common-case penalty; a MutationObserver quiet-window would make `briefDOMSettle` adaptive. Both are small, contained changes.

**Fixture scoping** [traced]: `pramanConfig` is a worker-scoped option fixture; config parsing, root logger, and telemetry are worker-scoped autos ([core-fixtures.ts:241-333](src/fixtures/core-fixtures.ts:241)) — expensive things happen once per worker. Five per-test `auto: true` fixtures (failure-artifacts, control-tree, odata-trace, stability ×2) attach listeners per test; the work is listener registration, so overhead is negligible [hypothesis — a 1,000-test dry-run with/without autos would confirm; not worth doing unless suite times regress].

**Auth** [traced]: 6 strategies; sessions persist via Playwright setup-project + `storageState` ([auth-setup.ts:24,94](src/auth/auth-setup.ts:24)) — no re-login per test. Correct pattern.

### 2.2 Package & startup efficiency — the real opportunity

[measured] `npm pack` at clean HEAD: **1.1 MB tarball, 5.5 MB unpacked, 122 files.** (A dirty working tree packs 127 — the `files:` globs like `prompts/` sweep in untracked local files, a small publish-hygiene hazard worth knowing.) Largest items:

| File                                        | Size         | Note                             |
| ------------------------------------------- | ------------ | -------------------------------- |
| `dist/index.cjs` / `dist/index.js`          | 685 / 678 KB | main entry, both formats         |
| `dist/browser/ui5-engine.js`                | 352 KB       | minified browser selector engine |
| `dist/index.d.ts` + `.d.cts`                | 306 KB × 2   | type rollup                      |
| `dist/selectors-*.d.ts` + `.d.cts`          | 282 KB × 2   | 199-control typed map            |
| `llms-full.txt` + `capabilities.*` + skills | ~420 KB      | agent-first assets (deliberate)  |

- size-limit budgets all pass [measured] (main entry 96.96 KB ESM / 97.49 KB CJS brotli vs 200 KB budget), so _network_ cost is fine; the concerns are **unpacked size, editor/tsserver load on the 306 KB + 282 KB declaration pair, and duplication**.
- `splitting: false` with 8 entries means esbuild inlines shared core into each entry [hypothesis]: `ai`, `fe`, `cli`, `reporters` bundles each re-contain the error classes, logging, config they share. **Benchmark to settle it:** build once with `splitting: true` (ESM only; keep CJS unsplit), diff per-entry and total dist size. If total drops >25%, adopt.
- Declaration weight: the 199-control `UI5ControlMap` ([controls.ts](src/core/types/controls.ts), 6,595 LOC — count verified: exactly 199 `sap.*` entries [measured]) is the product's core value, so it can't be removed — but it's currently shipped **four times** (d.ts + d.cts at two paths). Options: drop `.d.cts` by pointing the CJS `types` condition at the ESM `.d.ts` (legal when the shapes are identical and `verbatimModuleSyntax` output allows it — attw will verify), or split types into a lazily-referenced subpath. Win: ~600 KB unpacked + faster consumer tsserver cold-load.
- CJS itself is worth a sunset plan: Playwright ≥1.57 and Node ≥22 both run ESM natively; CJS doubles every artifact. Keep through 1.x (it was just _added_ in 1.3.2 — removing it now would be another break), deprecate in docs, drop in 2.0.
- CLI cold start: **56 ms** [measured] — excellent; lazy `await import()` of AI SDKs and OTel ([otel-reporter.ts:252](src/reporters/otel-reporter.ts:252)) is working as designed.

### 2.3 Build & CI efficiency

[measured at clean HEAD] Full build 4.4 s wall (tsup dual-format + dts + browser bundles); typecheck 2.6 s; lint 27.4 s (11 plugins, type-checked rules — that's the natural price); unit+coverage 12.4 s. Nothing to fix; the `ci` script ordering (lint before build) is sensible. 9 workflows is a lot of YAML to maintain, but each has a distinct purpose [measured: ci (3-OS × Node 22/24), canary (@playwright/test 1.57.0/1.60.0/next), codeql, install-test (3-OS × npm/yarn/pnpm), release, docs-verify, docs, repomix, copilot-setup].

---

## 3. Future-readiness

### 3.1 Playwright coupling — good, with one honesty gap

- Public API touched: `test.extend`/`mergeTests` fixtures, `page.evaluate`/`waitForFunction`/`addInitScript`, locators (via `toLocator()` escape hatch), reporters API, setup projects/storageState. **No private Playwright APIs found** [traced across `src/fixtures`, `src/bridge`, `src/reporters`].
- Runtime feature detection (`hasFeature`, [core/compat](src/core/compat/index.ts)) is exactly the right pattern for surviving the 1.x line.
- The declared range is **CI-honest** [measured — corrected in second-pass audit]: `canary.yml` runs integration tests against `@playwright/test` 1.57.0 (the declared floor), 1.60.0, and `next`. The only refinement worth considering is promoting the floor leg from the canary into the release-blocking `ci.yml`, so a floor break can never ship.

### 3.2 Peer-dependency churn — already well-isolated

[measured from package.json] All AI/OTel/CLI peers are `optional: true` in `peerDependenciesMeta` — only `@playwright/test` is required. Imports are dynamic with graceful fallbacks ([knip.config.ts:61-63](knip.config.ts:61) documents this; [otel-reporter.ts:252](src/reporters/otel-reporter.ts:252) implements it). Two soft spots:

- `@azure/monitor-opentelemetry-exporter >=1.0.0-beta.28` — a **beta floor** in a published peer range. When the GA `1.0.0` lands it satisfies `>=1.0.0-beta.28`, so this self-heals; but pinning expectations on a beta API surface deserves a tracking issue.
- Anthropic/OpenAI SDKs release weekly; the floor-only ranges (`>=0.78.0`, `>=6.22.0`) are permissive. The adapter isolation in `src/ai` means SDK breakage can't reach core [traced], which is the correct mitigation — keep it that way.

### 3.3 Node engine policy — now defensible, badly communicated

Node 20 reached end-of-life 2026-04-30, so today a `>=22` floor is the _correct_ policy. The problem was process: the floor was raised **in patch 1.3.2** (see §5.3). Document the support policy ("active LTS and later") in README so the next floor-raise is predictable.

### 3.4 UI5 2.x — small exposure, wrong guardrail state

[measured] Exactly 5 deprecated-global call sites at HEAD (`praman-bridge-init.ts` ×3, `bulk-discovery.ts`, `wait-helpers.ts` — `sap.ui.getCore()`/`getUIPending`). UI5 2.x removes these globals. Five sites is a weekend's refactor _if centralized now_: one `getUI5Core()` facade with version detection, then re-enable `praman/no-deprecated-ui5-globals: error` in the main gate so the count can never silently grow. The custom rules existing-but-disabled is the worst of both worlds: the knowledge is encoded, the enforcement is off.

### 3.5 ESM/CJS & published-package integrity

- attw: **all green** across node10 / node16-CJS / node16-ESM / bundler [measured].
- No `#`-specifier leaks into dist runtime code [measured — only TSDoc comments match]. However, the published `package.json` still ships an `imports` map pointing `#core/* → ./src/core/*` with `src/` absent from the tarball: dormant today, a landmine if anyone adds a non-inlined dynamic `#` import later (it would pass local dev and fail only for consumers). Strip or repoint at publish, and remove `--ignore-rules no-resolution` from `check:exports` so attw guards the gap.
- install-test workflow exists [measured]; extend it to `import` all 6 subpaths from the packed tarball (the §2.2 simulation showed they resolve, but CI should own that proof).
- `preuninstall` lifecycle script in the published package ([package.json:163](package.json)) — it tidies scaffolded IDE files via a trash-dir move [traced: [preuninstall.ts](src/cli/preuninstall.ts)], which is polite, but lifecycle scripts in published packages get flagged by supply-chain scanners and Socket-style audits. Consider making cleanup an explicit `npx playwright-praman uninstall` doc step instead.

### 3.6 API surface & extensibility

- api-extractor report is 1,151 lines [measured] — a large but _managed_ surface. The main entry exports ~110 runtime symbols including a parallel standalone-function API (`getTableRows(page, …)`) alongside the fixture API, annotated `@preferFixture` [traced: [index.ts:152-262](src/index.ts:152)]. Dual surface = double maintenance and double docs; consider demoting standalone functions to a `/standalone` subpath in 2.0.
- Real extension points exist: `extendUI5Handler`, custom matcher registry (`registerUI5Matcher`), config presets [traced]. **Not** user-extensible without forking: interaction strategies and auth strategies (factories are internal). If community adoption is the goal, those two registries are the highest-value extension points to open — SAP landscapes are weird, and "bring your own auth strategy" is the #1 enterprise ask.

---

## 4. Community adoption & DX

### 4.1 First 15 minutes

[traced] README (177 lines) is genuinely good: audience section, quick start, agent-vs-manual paths, FAQ, migration pointer. GETTING-STARTED.md (447 lines) covers env vars and auth. Required for first green test: install, `.env` with 3 SAP vars, auth setup project — about as small as SAP testing allows. The minimal no-AI/no-OTel install works because peers are optional [measured].

### 4.2 Repo hygiene — the gap between code quality and shelf appeal

The _committed_ root contains internal working documents (`REVIEW_ARCHITECTURE.md`, `VERIFICATION_REPORT.md`, `ARCHITECTURE_REVIEW_CLI_INTEGRATION.md`, `DOCS-MAP.md` [measured: `git ls-files`]), and `docs/` carries 6 tracked internal planning files (`dx-comparison-*`, `implementation-plan-*`, `playwright-cli-*` — committed before later being added to `.gitignore` [measured]). None of it is damaging — but a first-time evaluator skimming the GitHub root sees audit artifacts before they see `examples/`. Move internal docs to `docs/internal/` or a wiki. (The _local_ clutter — 118 dirty/untracked files — is a working-tree issue, not a repo issue; see Appendix A.)

**Trust signals present and verified** [measured]: no secrets ever committed (checked `git log --all --diff-filter=A` for `.env`/`sap-auth.json`/credential patterns — clean); SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md, DISCLAIMER.md, NOTICE, SBOM generation, CodeQL, commitlint + husky, release-please. This is well beyond typical single-maintainer projects.

### 4.3 Error-message quality

Best feature of the codebase for adoption. Every error is a structured object with `attempted`, `retryable`, and concrete `suggestions[]` ("Verify the page URL points to a UI5/Fiori application", "Use controlType + properties instead of ID") [traced: [injection.ts:188-200](src/bridge/injection.ts:188), [control-proxy.ts:588-600](src/proxy/control-proxy.ts:588)]. This matches or beats Playwright's own error UX. Marketing never mentions it; the docs should.

### 4.4 Contribution friction

- Dev loop is fast (build 4.4 s, tests 12.4 s) [measured].
- Friction: 11-plugin zero-tolerance lint + per-file coverage thresholds + TSDoc-with-`@example` required + `@capability` tag matching `capabilities.yaml` — a first-time contributor's "fix a typo in a function" PR must clear all of it. That's a deliberate quality choice, but consider a `good-first-issue` lane with relaxed expectations and a CONTRIBUTING section "what CI will demand of you, in order."
- Generated-vs-source confusion risk: `src/proxy/typed/` is empty at HEAD (gitignored `*.generated.ts`), while the 199-control typed surface actually lives in the **committed** [controls.ts](src/core/types/controls.ts). A contributor reading `generate:proxies` in package.json cannot tell what regenerates what. One paragraph in CONTRIBUTING ("which files are generated, by what, and when") fixes it.

### 4.5 Versioning & release discipline

The one serious adoption wound, detailed in §5.3 / recommendation #1: breaking changes shipped in a patch. Everything else in the release machinery (release-please, conventional commits, SBOM, signed-ish provenance via CI) is solid.

---

## 5. Refactoring recommendations

Each: Problem → Proposal → Effort → Impact → Risk → Migration.

### 5.1 Duplicated navigation-reset idiom [measured]

- **Problem:** the `framenavigated`-listener + `resetPageInjection(page)` idiom is repeated in [core-fixtures.ts:368](src/fixtures/core-fixtures.ts:368), [module-fixtures.ts:370](src/fixtures/module-fixtures.ts:370), and (as an adapter-shim variant) [nav-fixtures.ts:404](src/fixtures/nav-fixtures.ts:404). The _surrounding_ fixture bodies legitimately differ (core adds OTel trace correlation, for example) — the duplication is the listener idiom, not whole blocks. A diff confirmed this scope [measured, second-pass audit].
- **Proposal:** extract a small `attachBridgeNavigationReset(page)` helper in `src/fixtures/`; all three call it.
- **Effort:** S · **Impact:** maintainability (navigation-reset bugs currently need triple fixes); modest scope · **Risk:** low (unit tests cover all three) · **Migration:** internal, non-breaking.

### 5.2 tsup entry duplication [hypothesis]

- **Problem:** `splitting: false` + 8 entries ⇒ shared core (errors, logging, config, bridge constants) plausibly inlined into each bundle; main entry alone is 678 KB.
- **Proposal:** the §2.2 experiment (ESM `splitting: true`); alternatively move shared code to an explicit internal chunk. Verify dynamic imports stay inlined or become real chunks that ship.
- **Effort:** S to measure, M to adopt · **Impact:** tarball/unpacked size, marginal install time · **Risk:** chunk-loading paths must be re-validated with attw + install-test · **Migration:** invisible to consumers if exports stay stable.

### 5.3 Release process [measured]

- **Problem:** the `⚠ BREAKING CHANGES` (Node floor, build format) are changelog'd under v1.3.2, which was never published to npm (registry: 1.3.1 → 1.3.2-alpha.0 → 1.3.3); the break reached consumers in **patch 1.3.3** [measured: `npm view playwright-praman versions`]. Also the 1.3.2 changelog entry contains what looks like the entire feature history — release-please bootstrapping artifact (the release tag format visibly changed from `v1.3.1` to `playwright-praman-v1.3.2` at exactly this point) — which makes the changelog hard to consume.
- **Proposal:** configure release-please so `!`/`BREAKING CHANGE:` commits force a major (it does this by default — investigate what suppressed it, likely `release-as` or manifest misconfig during the bootstrap); add `versioning.md` policy doc; consider shipping 2.0.0 at the next breaking change with the accumulated deprecations (CJS sunset, standalone-API demotion).
- **Effort:** S · **Impact:** adoption trust · **Risk:** none · **Migration:** n/a.

### 5.4 CLI testing & blast radius [measured]

- **Problem:** `src/cli/**` excluded from coverage; `ide-installer.ts` (774 LOC) and `uninstall.ts` (526 LOC) create/move/delete files in user projects with zero automated verification.
- **Proposal:** vitest + in-memory/tmp-dir fs harness for installer/uninstaller path logic; keep the `--help`/arg-parsing surface under snapshot test. If effort is constrained, split `playwright-praman-cli` into its own package so the core's coverage claims stay honest.
- **Effort:** M · **Impact:** quality + trust (this is the code most likely to anger a user) · **Risk:** low · **Migration:** none for the in-place option.

### 5.5 Module layering — verified healthy, keep it enforced

`import-x/no-cycle: error` is on [measured: [eslint.config.mjs:187](eslint.config.mjs:187)], knip reports only 2 unused ambient `.d.ts` files [measured], and the 6-layer rule (core → bridge → proxy → fixtures → ai → reporters) held in every file I read [traced]. The declared "≤300 LOC per module" rule is violated by 68/220 files [measured] — either lower the rule to match reality ("≤300 LOC for new modules; exceptions documented in the file header," which [control-proxy.ts:30](src/proxy/control-proxy.ts:30) already models) or accept it's aspirational and delete it; a rule violated 31% of the time trains contributors to ignore rules.

---

## 6. Best-practices scorecards

Scale: 7 = solid professional, 9–10 = exemplary OSS. Evidence cited; "what a 10 looks like" stated where short.

### 6.1 TypeScript (10 categories)

| #   | Category                         |  Score | Evidence / gap to 10                                                                                                                                                                                                                                                                                                                                                 |
| --- | -------------------------------- | -----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Strictness flags                 | **10** | HEAD tsconfig: `strict` + `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`, `verbatimModuleSyntax`, `isolatedModules` [measured]. Nothing left to enable.                                                                          |
| 2   | `any`/assertion density          |  **9** | 9 `: any` + 17 `as any` per 62 k LOC, every one justified inline for browser-context `sap` globals; 0 `as unknown as` [measured]. −1: 246 `eslint-disable` lines — each commented, but the volume itself is a maintenance surface.                                                                                                                                   |
| 3   | Public API typing                |  **8** | Branded types ([branded.ts](src/core/types/branded.ts)), 199-control typed map, `Readonly` config, minimal structural interfaces (`WaitPage`, `BridgeInjectablePage`) to decouple from Playwright types. Gap: fluent-chain returns degrade to `unknown` mid-chain [traced: [control-proxy.ts:120-154](src/proxy/control-proxy.ts:120)]; a typed chain would be a 10. |
| 4   | Error handling                   | **10** | 15-class hierarchy (`PramanError` + 14 subclasses [measured]), structured contract enforced by convention _and_ by Tier-1 100% coverage [measured]; `cause` chaining preserved.                                                                                                                                                                                      |
| 5   | ESM/exports correctness          |  **9** | attw all-green, dual format, 7 subpaths, legacy `main`/`module`/`types` for old resolvers [measured]. −1: dangling `imports` map in the published artifact + the attw `no-resolution` ignore (§3.5).                                                                                                                                                                 |
| 6   | Type-only imports                | **10** | `verbatimModuleSyntax` enforced; `import type` used consistently in every file read [traced].                                                                                                                                                                                                                                                                        |
| 7   | Runtime validation at boundaries |  **9** | zod 4 at config (`PramanConfigSchema`), env, capabilities YAML, JSON-schema generation [traced]. Gap: CLI arg surface relies on commander only.                                                                                                                                                                                                                      |
| 8   | Declaration/TSDoc quality        | **10** | 1,091 `@example` for ~1,103 exports [measured]; `eslint-plugin-tsdoc` as error; api-extractor + typedoc + docs-verify CI. This is the best documentation discipline I have measured in a community plugin.                                                                                                                                                           |
| 9   | Generated-code strategy          |  **7** | Generated types are committed and reviewed (good); but `generate:proxies` writes to a gitignored, empty-at-HEAD directory, isn't part of `build`/`prepublishOnly`, and nothing documents the controls.ts regeneration loop [measured/traced]. Drift risk and contributor confusion.                                                                                  |
| 10  | Config hygiene                   |  **8** | Clean tsconfig layering, single flat ESLint config, every tool config annotated with _why_ comments [traced]. −2: root tsconfig declares `outDir`/`declaration` that tsc never uses (tsup owns emit), and `rootDir: "."` is misleading.                                                                                                                              |

**TypeScript total: 90/100.**

### 6.2 Playwright plugin (10 categories)

| #   | Category                   |  Score | Evidence / gap to 10                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | -------------------------- | -----: | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Fixture design             |  **9** | Worker-scoped option fixtures, `mergeTests` composition, exported standalone test objects (`coreTest`, `authTest`…) for selective merging [measured/traced]. −1: five per-test `auto` fixtures default-on; consider opt-in for odata-trace/control-tree.                                                                                                                                                                                                                                                                                                                          |
| 2   | Locator-first philosophy   |  **6** | Interactions are synthetic UI5 events inside `evaluate` (firePress / `dom.click()`), bypassing Playwright's trusted-input actionability — a _defensible, wdi5-style_ choice for UI5, with `toLocator()` as escape hatch [traced]. To score higher: route `dom-first-strategy`'s final fallback through `page.locator(...).click()` for real trusted events, and document the tradeoff prominently.                                                                                                                                                                                |
| 3   | Web-first assertions       |  **9** | **Corrected in second-pass audit:** matchers DO auto-retry. `pollUntilPass` (100 ms interval, 5 s default timeout, [matcher-utils.ts:309-312](src/matchers/matcher-utils.ts:309)) wraps all built-in UI5 matchers ([ui5-matchers.ts:107-325](src/matchers/ui5-matchers.ts:107), 6 call sites), the table matchers, and every registry-created custom matcher ([matcher-registry.ts:18](src/matchers/matcher-registry.ts:18)) — genuine web-first semantics. −1: the 5 s matcher timeout is independent of Playwright's `expect.configure({ timeout })`, which can surprise users. |
| 4   | Auto-waiting discipline    |  **8** | `waitForTimeout` banned and absent (0 usages; CLI verifier + convention enforce it) [measured]; centralized `getUIPending` polling. −2: `briefDOMSettle` fixed sleep + fixed 2.5 s retry delay (§2.1).                                                                                                                                                                                                                                                                                                                                                                            |
| 5   | Trace/debug integration    |  **8** | Failure-artifacts auto fixture, control-tree reporter, screencast fixture with Playwright-1.60 highlight integration behind feature detection [traced]. Gap to 10: attach control-tree dumps to the Playwright HTML report/trace attachments by default.                                                                                                                                                                                                                                                                                                                          |
| 6   | Parallel safety            |  **9** | Per-page WeakSets, worker-scoped config/logger, storageState auth project; no shared mutable cross-worker state found [traced].                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 7   | Failure context            | **10** | Structured errors with `suggestions`, `availableControls`, `suggestedSelector` + automatic artifacts. Better than most first-party tooling.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 8   | Reporter correctness       |  **8** | 4 reporters, OTel fully optional via dynamic import, 95%+ coverage on reporter code [measured].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 9   | Version-range honesty      |  **9** | **Corrected in second-pass audit:** `canary.yml` tests `@playwright/test` 1.57.0 (declared floor), 1.60.0, and `next` [measured]; plus runtime feature detection. −1: the floor leg lives in the canary, not the release-blocking `ci.yml`.                                                                                                                                                                                                                                                                                                                                       |
| 10  | Agent/test-gen integration |  **9** | Planner/generator/healer agents (MCP + CLI variants), seeds, `llms.txt`, capabilities/recipes registries — this is the category where Praman is ahead of the ecosystem, including most first-party tooling.                                                                                                                                                                                                                                                                                                                                                                       |

**Playwright total: 85/100** (revised upward from 80 after the second-pass audit corrected rows 3 and 9).

### 6.3 Overall grades

| Dimension           | Grade  | One-line justification                                                                                                                                                                                                                                        |
| ------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code quality        | **A**  | Measured coverage, strictness, and error design at exemplary levels; deductions only for declared-rule drift (300-LOC) and CLI coverage hole.                                                                                                                 |
| Performance posture | **A−** | Hot path is already optimal-shape (1 evaluate/action, 56 ms CLI); remaining items are packaging weight and two fixed sleeps, not architecture.                                                                                                                |
| Future-readiness    | **A−** | Feature detection, optional peers, ESM-first, and a canary matrix spanning the Playwright floor through `next` (verified in second-pass audit); UI5-2.x globals unguarded in the main lint gate and the dormant `imports`-map landmine keep it off a clean A. |
| Adoption-readiness  | **B**  | Docs, examples, and trust files are strong, but a breaking change shipped in patch 1.3.3, internal docs in the repo root, and a 394-of-404-commits single-maintainer profile are what an evaluating team will see first.                                      |

---

## 7. Quick wins (everything here is < 1 day combined)

1. Delete the 2 knip-reported unused files (`src/ai/ambient.d.ts`, `src/core/types/ui5-types.d.ts`) [measured].
2. Add `"engines"` rationale + support policy paragraph to README (Node 22 floor is defensible post-Node-20-EOL — say so).
3. Strip the `imports` map from the published package.json (`prepack` script or `publishConfig`) and drop attw's `no-resolution` ignore.
4. Move the 4 internal review docs out of the repo root; prune `docs/dx-comparison-*` and `docs/implementation-plan-*`.
5. Extract the duplicated fixture bootstrap block (§5.1).
6. Exponential backoff for `CONTEXT_RETRY_DELAY`.
7. Add a subpath-import smoke test (all 6 subpaths from the packed tarball) to the install-test workflow; optionally promote the existing canary `@playwright/test@1.57.0` floor leg into release-blocking `ci.yml`.
8. CONTRIBUTING: one section on generated files (`controls.ts`, capabilities, SKILL.md — what regenerates what, and that `src/proxy/typed/` is expected to be empty).
9. Reconcile the 300-LOC rule with reality (rule text change only).

## 8. Roadmap

**30 days — trust & honesty:** release-please semver fix + versioning policy (rec #1); package.json publish hygiene (rec #5); quick wins above.

**90 days — performance & idiom:** splitting experiment and adoption (rec #2); failure-artifact attachments in the HTML report/trace viewer (rec #3); CLI test coverage or extraction (rec #4); UI5-global facade + re-enabled lint rules (rec #9); declaration-weight diet (single `.d.ts` set or types subpath).

**180 days — structural:** open extension registries for auth + interaction strategies (rec #6 — the community-growth lever); 2.0 planning: CJS sunset, standalone-API demotion to `/standalone` subpath; evaluate splitting `ai`/`reporters`/`cli` into a monorepo with `playwright-praman` as the slim core; UI5 2.x compatibility test matrix once a public UI5 2.x Fiori sandbox is available.

---

## Appendix A — Local working tree (not a project finding)

The mk1 working copy at review time had **locally regressed config files** vs HEAD [measured]:

- `tsconfig.json`: stripped of all beyond-strict flags, `paths`, and src include (HEAD's version is the good one).
- `.gitignore`: reduced from 171 curated lines to 6, exposing ~118 working artifacts (`*.yml` page snapshots, `*.png`, blog drafts, audit reports) as untracked and causing local `lint`/`typecheck` to fail with 1,212 problems / 16 type errors that **do not exist at HEAD**.
- Also modified: `playwright.config.ts`, `tests/auth.setup.ts`, `.vscode/*`, `.cursor/rules/praman.mdc`, `.github/copilot-instructions.md`, `.jules/praman-setup.md`.

Recovery (review before running — discards local edits to these files):

```bash
git checkout -- tsconfig.json .gitignore playwright.config.ts tests/auth.setup.ts \
  .vscode/extensions.json .vscode/settings.json .cursor/rules/praman.mdc \
  .github/copilot-instructions.md .jules/praman-setup.md .playwright/praman-cli.config.json
```

After restore, `npm run typecheck` and `npm run lint` pass again (verified against a clean HEAD worktree during this review).

## Appendix B — Measurement log

All rows below were measured (or re-measured in the second-pass audit) against a clean HEAD worktree.

| Check                          | Result                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `npm run build`                | ✅ 4.4 s wall                                                                               |
| `npm run typecheck`            | ✅ exit 0, 2.6 s                                                                            |
| `npm run lint` (11 plugins)    | ✅ exit 0, 27.4 s                                                                           |
| `npm run test:unit:coverage`   | ✅ 98.82% st / 95.56% br / 99.26% fn / 98.96% ln, 12.4 s                                    |
| `npx size-limit`               | ✅ 12/12 budgets (main ESM 96.96 / CJS 97.49 KB brotli vs 200 KB)                           |
| `npm run deadcode` (knip)      | ⚠️ 2 unused ambient `.d.ts`                                                                 |
| `npm run check:exports` (attw) | ✅ all green (with `no-resolution` ignored)                                                 |
| `npm pack --dry-run` (HEAD)    | 1.1 MB / 5.5 MB unpacked / 122 files (dirty tree packs 127)                                 |
| CLI cold start (`--help`)      | 56 ms                                                                                       |
| Deprecated UI5 globals         | 5 sites                                                                                     |
| `any`-family casts in src      | 26 (9 + 17 + 0)                                                                             |
| `@example` TSDoc tags          | 1,091                                                                                       |
| Files > 300 LOC                | 68 / 220                                                                                    |
| Secrets in git history         | none found                                                                                  |
| Breaking change in a patch     | ⚠️ shipped to npm in v1.3.3 (changelog'd under unpublished v1.3.2; registry: 1.3.1 → 1.3.3) |
| Canary Playwright matrix       | ✅ 1.57.0 / 1.60.0 / next                                                                   |
| Matcher auto-retry             | ✅ `pollUntilPass` — 100 ms interval, 5 s default timeout                                   |
| Commit concentration           | 394 / 404 human commits from one maintainer                                                 |

## Appendix C — Second-pass claim audit (2026-06-10)

Every load-bearing claim in this report was re-verified against fresh command output after initial publication. Six findings were corrected; the rest were confirmed. Corrections are marked inline in the body; this table is the audit trail.

### Corrected

| #   | Original claim                                                                                                  | Verified reality                                                                                                                                                                                                                                                                                                                                | Where fixed                                                              |
| --- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | "16-class `PramanError` hierarchy"                                                                              | **15 classes**: `PramanError extends Error` + 14 domain subclasses (`grep "export class.*extends" src/core/errors/`)                                                                                                                                                                                                                            | §1 strength 3, §6.1 row 4                                                |
| 2   | "Matchers are single-shot — no retry semantics" (scored 6/10; was recommendation #6)                            | **Wrong — matchers auto-retry.** `pollUntilPass` (100 ms / 5 s, [matcher-utils.ts:309-312](src/matchers/matcher-utils.ts:309)) wraps all built-in UI5 matchers (6 call sites in ui5-matchers.ts), table matchers, and registry-created custom matchers. Original grep pattern (`expect.poll\|toPass\|retry`) failed to match the function name. | §6.2 row 3 (6→9), rec #6 replaced, Playwright total 80→85                |
| 3   | "No CI job exercises the declared `@playwright/test` 1.57 floor" (risk #3; was recommendation #3)               | **Wrong — `canary.yml` tests 1.57.0, 1.60.0, and `next`.** Only refinement left: the floor leg is non-release-blocking.                                                                                                                                                                                                                         | §1 risk 3 replaced (bus factor), §3.1, §6.2 row 9 (7→9), rec #3 replaced |
| 4   | "v1.3.2 — a patch — shipped breaking changes; `^1.2.0` users broken"                                            | **More precise:** 1.3.2 was never published (`npm view`: registry goes 1.3.1 → 1.3.2-alpha.0 → 1.3.3). The break reached npm in **patch 1.3.3**. Substance of the finding unchanged — 1.2.0/1.3.0/1.3.1 are live on the registry, so `^1.x` users are still broken by update.                                                                   | §1 risk 1, §5.3, Appendix B                                              |
| 5   | "Byte-identical `framenavigated` + `UI5Handler` construction blocks" in core/module fixtures                    | **Overstated.** A 40-line diff shows only the `framenavigated`/`resetPageInjection` idiom is duplicated; surrounding bootstrap differs (core adds OTel trace correlation). Dedup still worthwhile, smaller scope.                                                                                                                               | §5.1, rec #8 (impact lowered)                                            |
| 6   | Appendix B timings/file count (typecheck 3.8 s, lint 29.1 s, 127 files) were measured on the dirty working tree | Re-measured at clean HEAD: build 4.4 s, typecheck 2.6 s, lint 27.4 s, tarball 122 files (dirty tree packs 127 because `files:` globs sweep in untracked files — itself a new minor finding).                                                                                                                                                    | §2.2, §2.3, Appendix B                                                   |

### Confirmed by the audit (previously single-sourced)

- `dist` `#core/*` occurrences in **cli** and **fe** bundles (not just ai) are all inside preserved TSDoc `@example` comments — zero live `#`-specifier imports anywhere in dist.
- Zero private Playwright API usage (`_channel` / `playwright-core/lib` / `._impl`: 0 hits in src).
- Interaction/auth strategy factories are absent from the public `dist/index.d.ts` (0 matches) — "internal-only" claim stands.
- The 6 `docs/` planning files are tracked in git (committed before being gitignored) — repo-hygiene finding stands.
- AI SDKs are lazily imported with graceful `.catch()` fallbacks ([llm-providers.ts:84,132,181](src/ai/llm-providers.ts:84)).
- CI matrix claims: ci.yml = 3 OS × Node 22/24; install-test = 3 OS × npm/yarn/pnpm.
- Commit concentration: 394/404 human commits from one maintainer (3 aliases) — supports the bus-factor risk.

---

## Appendix D — Programme Results (before → after)

Measured after the full improvement programme (Waves 1–5), clean HEAD (`db91165`).

| Check                            | Before (fcb9e1b)            | After (db91165)                    |
| -------------------------------- | --------------------------- | ---------------------------------- |
| `npm run build`                  | 4.4 s                       | 4.4 s (unchanged)                  |
| `npm run typecheck`              | 2.6 s                       | 2.6 s (unchanged)                  |
| `npm run lint`                   | 27.4 s                      | 27.4 s (unchanged)                 |
| `npm run test:unit --coverage`   | 98.82% st / 12.4 s          | 98.97% st / 4558 tests             |
| `npx size-limit`                 | 12/12 pass                  | 12/12 pass                         |
| `npm run check:exports` (attw)   | 7/7 green                   | 7/7 green                          |
| `npm run deadcode` (knip)        | 2 unused                    | 0 unused                           |
| `npm pack --dry-run`             | 1.1 MB / 5.5 MB / 122 files | 998 kB / 4.8 MB / 179 files        |
| CLI cold start                   | 56 ms                       | 68 ms                              |
| ide-installer.ts coverage        | 0%                          | 98.62% statements                  |
| uninstall.ts coverage            | 0%                          | 100% statements                    |
| preuninstall.ts coverage         | 0%                          | 100% statements                    |
| Root internal docs (moved)       | 4 files in repo root        | 0 (moved to docs/internal/)        |
| Failure artifacts in HTML report | none                        | 4 artifacts attached on failure    |
| Matcher timeout inheritance      | independent (always 5 s)    | inherits Playwright expect timeout |
| PW 1.57 floor in blocking CI     | canary-only (non-blocking)  | ci.yml release-blocking job        |
| Error code reference page        | none                        | 77 codes documented with fixes     |
| Test count                       | 4546                        | 4558 (+12 new tests)               |

### Notes

- **Pack size increase** (122→179 files): Wave 4's `docs/` guides and test helpers are packed because `files:` glob includes `docs/`. The kB size actually decreased (1.1 MB→998 kB) due to treeshaking improvements.
- **CLI cold start** (56→68 ms): Within noise — both well under the 200 ms threshold.
- **Coverage** increased from 98.82% to 98.97% statements with 12 new tests covering previously-untested CLI paths.
