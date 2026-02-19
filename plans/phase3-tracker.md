# Phase 3 — Implementation Tracker

> **Plan Version**: 1.0.0
> **Status**: **COMPLETE**
> **Plan File**: plan3.md (Fixtures + Auth + Navigation Detailed Implementation Plan)
> **Created**: 2026-02-18
> **Completed**: 2026-02-18
> **Strategy**: TDD (RED-GREEN-REFACTOR), Max 6 parallel agents, 19 agents total
> **Branch**: main (direct commits, Husky hooks enabled)
> **Quality Gate**: Full `npm run ci` after every wave
> **Predecessor**: Phase 2 — 929 tests, 73 test files, 35 source files, 99.18% stmt coverage
>
> **GitHub Issues**:
>
> - [#23 Phase 3 Parent](https://github.com/mrkanitkar/playwright-praman/issues/23)
> - [#24 Sub-Phase 3.1](https://github.com/mrkanitkar/playwright-praman/issues/24) | [#25 Sub-Phase 3.2](https://github.com/mrkanitkar/playwright-praman/issues/25) | [#26 Sub-Phase 3.3](https://github.com/mrkanitkar/playwright-praman/issues/26)
> - Related: [#22 G2 Proxy Stubs](https://github.com/mrkanitkar/playwright-praman/issues/22) (resolved by A1/B1a)

---

## Implementation Order

```
1. Wave 1 — Foundation (A1, A2, A3) — no dependencies           ✅ COMPLETE
2. Wave 2 — Core + Auth Strategies (A4, A6, A7) — depends on Wave 1  ✅ COMPLETE
3. Wave 3 — Test Fixtures + Auth Factory (A5, A8) — depends on Wave 2  ✅ COMPLETE
   ── Sub-Phase 3.1 Gate: npm run ci ── ✅ PASSED
4. Wave 4 — Wiring (A9, A10, A11, A12, A15, A16) — depends on Wave 3  ✅ COMPLETE
5. Wave 5 — Fixture Assembly (A13, A14, A17, A18) — depends on Wave 4  ✅ COMPLETE
   ── Sub-Phase 3.2 Gate: npm run ci ── ✅ PASSED
6. Wave 6 — Final Assembly (A19) — depends on all                ✅ COMPLETE
   ── Sub-Phase 3.3 Gate: npm run ci + npm run check:exports ── ✅ PASSED
```

---

## Token Budget Estimate

### 19-Agent Budget

| Metric                     | Value          |
| -------------------------- | -------------- |
| Total agents               | 19 (+ 1 spare) |
| Max parallel per wave      | 6 (Wave 4)     |
| Total input tokens         | ~501K          |
| Total output tokens        | ~311K          |
| **Estimated total tokens** | **~812K**      |
| Largest agent (A9)         | ~63K           |
| Smallest agent (A2)        | ~26K           |
| Average per agent          | ~43K           |
| Safety margin              | 67% headroom   |

### Wave Token Distribution

| Wave | Agents | Combined Tokens | Cumulative |
| ---- | ------ | --------------- | ---------- |
| 1    | 3      | ~95K            | ~95K       |
| 2    | 3      | ~137K           | ~232K      |
| 3    | 2      | ~90K            | ~322K      |
| 4    | 6      | ~286K           | ~608K      |
| 5    | 4      | ~156K           | ~764K      |
| 6    | 1      | ~48K            | ~812K      |

---

## Agent Definitions (19 Agents)

### Legend

- **Status**: `[ ]` pending, `[~]` in progress, `[x]` complete, `[!]` blocked
- **Est. Tokens**: approximate total tokens (input + output) per agent
- **Depends**: agent IDs that must complete first
- **CI**: every agent runs `npm run lint -- --max-warnings 0 && npm run typecheck && npm run test:unit -- --run <files>` after completion

### Wave 1 — Foundation (No Dependencies)

| #   | Agent  | Batches   | Description                                                                       | Source LOC | Test LOC | Est. Tokens | Depends | Status | Commit  |
| --- | ------ | --------- | --------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ | ------- |
| 1   | **A1** | B1a + B1b | G2 proxy fix: remove 4 hardcoded stubs + orphan wiring (object-map, get-selector) | ~120       | ~80      | ~32K        | None    | [x]    | f9ad371 |
| 2   | **A2** | TH1       | Test helpers: `mock-auth-page.ts`, `mock-playwright-test.ts`                      | ~120       | —        | ~26K        | None    | [x]    | a9ea2f1 |
| 3   | **A3** | B2a       | Auth types (`auth-types.ts`) + auth checks (`auth-checks.ts`) + tests             | ~200       | ~200     | ~37K        | None    | [x]    | 5ca0b8f |

### Wave 2 — Core Fixtures + Auth Strategies (Depends: Wave 1)

| #   | Agent  | Batches   | Description                                                                                                                              | Source LOC | Test LOC | Est. Tokens | Depends | Status | Commit  |
| --- | ------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ | ------- |
| 4   | **A4** | B3a       | Core fixtures — worker-scoped: `pramanConfig`, `rootLogger`, `tracer`, `playwrightCompat`, `selectorRegistration`, `matcherRegistration` | ~200       | ~170     | ~41K        | A2      | [x]    | 23506f3 |
| 5   | **A6** | B2b + B2c | OnPrem + CloudSAML auth strategies + tests                                                                                               | ~450       | ~190     | ~48K        | A3      | [x]    | 0137522 |
| 6   | **A7** | B2d + B2e | Office365 + API + Certificate auth strategies + tests                                                                                    | ~500       | ~160     | ~48K        | A3      | [x]    | 7c547ad |

### Wave 3 — Test Fixtures + Auth Factory (Depends: Wave 2)

| #   | Agent  | Batches | Description                                                                   | Source LOC | Test LOC | Est. Tokens | Depends | Status | Commit  |
| --- | ------ | ------- | ----------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ | ------- |
| 7   | **A5** | B3b     | Core fixtures — test-scoped: `pramanLogger`, `bridgeAdapter`, `ui5` (initial) | ~250       | ~170     | ~46K        | A4      | [x]    | 32355cc |
| 8   | **A8** | B2f     | Multi-tenant strategy + `createAuthStrategy` factory + tests                  | ~260       | ~220     | ~44K        | A6, A7  | [x]    | 22870f6 |

**-- Sub-Phase 3.1 Gate -- PASSED**

```
npm run typecheck   ✅ Zero errors
npm run lint        ✅ Zero errors, zero warnings
npm run test:unit   ✅ 1105 tests passing
npm run build       ✅ tsup succeeds
```

### Wave 4 — Max Parallel Wiring (Depends: Wave 3)

| #   | Agent   | Batches   | Description                                                                                                                                                                       | Source LOC | Test LOC | Est. Tokens | Depends | Status | Commit  |
| --- | ------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ | ------- |
| 9   | **A9**  | B3c       | UI5Handler class: 14 methods (control, controls, click, fill, press, select, check, uncheck, clear, getText, getValue, waitForUI5, waitFor, clearCache, destroy)                  | ~421       | ~280     | ~63K        | A4, A5  | [x]    | 767771b |
| 10  | **A10** | B4a       | Stability fixtures: WalkMe/analytics blocking + auto-wait                                                                                                                         | ~180       | ~100     | ~38K        | A5      | [x]    | 57a0bf3 |
| 11  | **A11** | B5b       | Navigation module: 9 functions (navigateToApp, navigateToTile, navigateToIntent, navigateToHash, navigateToHome, navigateBack, navigateForward, searchAndOpenApp, getCurrentHash) | ~311       | ~210     | ~50K        | A5      | [x]    | 8129ffd |
| 12  | **A12** | B4b + B4c | Auth handler (`SAPAuthHandler`) + auth setup/teardown projects                                                                                                                    | ~312       | ~180     | ~50K        | A8      | [x]    | f3247de |
| 13  | **A15** | B5d       | Playwright-API wiring: expand `ControlProxyState`, add interaction routing in get trap                                                                                            | ~200       | ~120     | ~39K        | A5      | [x]    | 9c8abbe |
| 14  | **A16** | B6a       | WorkZone module: `BTPWorkZoneManager`, dual-frame bridge injection                                                                                                                | ~241       | ~120     | ~46K        | A5      | [x]    | 0824a80 |

### Wave 5 — Fixture Assembly (Depends: Wave 4)

| #   | Agent   | Batches | Description                                                                         | Source LOC | Test LOC | Est. Tokens | Depends | Status | Commit  |
| --- | ------- | ------- | ----------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ | ------- |
| 15  | **A13** | B5a     | Auth fixtures: `sapAuth` option fixture, session validation                         | ~180       | ~90      | ~38K        | A12, A5 | [x]    | 1caca38 |
| 16  | **A14** | B5c     | Nav fixtures: step-decorated navigation actions                                     | ~280       | ~90      | ~43K        | A11, A5 | [x]    | ec363da |
| 17  | **A17** | B3d     | Return handler sub-proxy wiring: wire `proxy-converter.ts` into `return-handler.ts` | ~50        | ~110     | ~34K        | A9      | [x]    | d713f87 |
| 18  | **A18** | B6c     | Shell header + footer bar handlers                                                  | ~250       | ~150     | ~41K        | A9      | [x]    | 7c0aba9 |

**-- Sub-Phase 3.2 Gate -- PASSED**

```
npm run ci          ✅ Full pipeline (lint + typecheck + test + build)
```

### Wave 6 — Final Assembly (Depends: All)

| #   | Agent   | Batches  | Description                                                                        | Source LOC | Test LOC | Est. Tokens | Depends | Status | Commit  |
| --- | ------- | -------- | ---------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ | ------- |
| 19  | **A19** | B7 + B6b | Assembly: `fixtures/index.ts`, barrel updates, nav WZ wiring, CI + attw validation | ~240       | ~80      | ~48K        | All     | [x]    | cf46eeb |

**-- Sub-Phase 3.3 Gate -- PASSED**

```
npm run ci              ✅ Full pipeline
npm run check:exports   ✅ 6/6 sub-path exports valid (attw)
```

**Total: 19 agents** (5 merges from 24 original batches + 1 spare agent for retry/hotfix)

---

## Dependency Graph (DAG)

```text
Wave 1:  A1, A2, A3                              [3 agents — no deps]        ✅
Wave 2:  A4←A2, A6←A3, A7←A3                    [3 agents — after Wave 1]   ✅
Wave 3:  A5←A4, A8←A6+A7                        [2 agents — after Wave 2]   ✅
         ── Sub-Phase 3.1 Gate ── ✅
Wave 4:  A9←A4+A5, A10←A5, A11←A5,             [6 agents — max parallel]   ✅
         A12←A8, A15←A5, A16←A5
Wave 5:  A13←A12+A5, A14←A11+A5,               [4 agents — after Wave 4]   ✅
         A17←A9, A18←A9
         ── Sub-Phase 3.2 Gate ── ✅
Wave 6:  A19←ALL                                 [1 agent — assembly]        ✅
         ── Sub-Phase 3.3 Gate ── ✅
```

**Critical Path** (longest sequential chain — 6 steps):

```text
A2(TH1) → A4(B3a) → A5(B3b) → A11(B5b) → A14(B5c) → A19(B7+B6b)
Wave 1     Wave 2     Wave 3     Wave 4      Wave 5      Wave 6
```

Secondary chains:

- Auth: A3→A6→A8→A12→A13→A19 (6 steps)
- Handler: A2→A4→A5→A9→A17→A19 (6 steps)

---

## Agent Merge Details

| Merge | Original Batches | Agent | Rationale                                                      |
| ----- | ---------------- | ----- | -------------------------------------------------------------- |
| 1     | B1a + B1b        | A1    | Both Level 0 (no deps), both modify proxy/bridge files         |
| 2     | B2b + B2c        | A6    | Both depend on B2a, same auth strategy pattern (form login)    |
| 3     | B2d + B2e        | A7    | Both depend on B2a, same auth strategy pattern (token-based)   |
| 4     | B4b + B4c        | A12   | Sequential chain (B4c depends on B4b), same auth domain        |
| 5     | B7 + B6b         | A19   | B6b is tiny (40 LOC), A19 already touches all fixtures/barrels |

---

## ESLint Compatibility — Per-Agent Risk Matrix

| Agent              | Key ESLint Risk                                        | Mitigation                                              |
| ------------------ | ------------------------------------------------------ | ------------------------------------------------------- |
| A1 (G2 fix)        | `switch-exhaustiveness-check` after stub removal       | Ensure fallthrough to method forwarder covers all cases |
| A6/A7 (auth)       | `sonarjs/cognitive-complexity: 15` for login flows     | Extract `fillLoginForm()`, `waitForRedirect()` helpers  |
| A9 (UI5Handler)    | `max-lines: 300` exceeded (~421 LOC)                   | Document exception or split into handler + helper       |
| A11 (navigation)   | `security/detect-non-literal-regexp` for hash patterns | Inline disable with comment                             |
| A12 (auth handler) | `strict-boolean-expressions` for session checks        | Use explicit `=== null`, `=== undefined` checks         |
| A15 (proxy wiring) | `no-unsafe-assignment` for dynamic proxy               | Use type-safe proxy state expansion                     |
| A16 (WorkZone)     | `@microsoft/sdl/no-inner-html` for bridge injection    | Use `evaluate()` not innerHTML                          |

---

## Quality Gates

### Per-Agent Gate (every agent, every commit)

```bash
npm run lint -- --max-warnings 0    # Zero errors, zero warnings
npm run typecheck                    # tsc --noEmit passes
npm run test:unit -- --run <files>   # Only affected tests
```

### Sub-Phase Gates (3 total)

| Gate | After Wave       | Additional Checks                                                                       | Status |
| ---- | ---------------- | --------------------------------------------------------------------------------------- | ------ |
| 3.1  | Wave 3 (A5, A8)  | Tier 2 coverage for `src/auth/strategies/**` (95/90/95/95)                              | PASSED |
| 3.2  | Wave 5 (A13-A18) | Tier 2 for `src/auth/**`, Tier 3 for `src/fixtures/**` + `src/modules/**` (90/85/90/90) | PASSED |
| 3.3  | Wave 6 (A19)     | Global >= 95% statements. `npm run check:exports` validates all 6 sub-path exports.     | PASSED |

### Commit Message Convention

```text
feat(proxy): remove G2 hardcoded stubs (A1/B1a)
test(auth): add auth-types + auth-checks tests (A3/B2a)
feat(fixtures): add worker-scoped core fixtures (A4/B3a)
feat(auth): add OnPrem + CloudSAML strategies (A6/B2b+B2c)
chore(fixtures): wire assembly + barrels + CI gate (A19/B7)
```

---

## Phase 1 API Cross-Reference

> Every Phase 1 API consumed by Phase 3. Zero duplicates confirmed.

| Phase 1 API                       | Phase 3 Agent Consumer(s) |
| --------------------------------- | ------------------------- |
| `createBridgeAdapter()`           | A4 (B3a)                  |
| `discoverControl()`               | A9 (B3c)                  |
| `createControlProxy()`            | A17 (B3d)                 |
| `ControlProxyCache`               | A9 (B3c)                  |
| `handleBridgeReturn()`            | A17 (B3d -- modifies)     |
| `convertToControlProxy()`         | A17 (B3d)                 |
| `convertToObjectProxy()`          | A17 (B3d)                 |
| `waitForUI5Stable()`              | A9, A10, A11, A16         |
| `waitForUI5Bootstrap()`           | A4, A11                   |
| `createInteractionStrategy()`     | A15 (B5d)                 |
| `ensureBridgeInjected()`          | A4, A16                   |
| `createLogger()`                  | All agents                |
| `defineConfig()` / `loadConfig()` | A4 (B3a)                  |
| `PramanError` subclasses          | All agents                |
| `DEFAULT_TIMEOUTS`                | A9, A10, A11              |
| `retry()`                         | A12 (B4b)                 |
| `getPlaywrightFeatures()`         | A4 (B3a)                  |

---

## Progress Summary

| Sub-Phase              | Agents | Done   | Remaining | %        |
| ---------------------- | ------ | ------ | --------- | -------- |
| 3.1 Foundation (W1-W3) | 8      | 8      | 0         | 100%     |
| 3.2 Wiring (W4-W5)     | 10     | 10     | 0         | 100%     |
| 3.3 Assembly (W6)      | 1      | 1      | 0         | 100%     |
| **Total**              | **19** | **19** | **0**     | **100%** |

### Metrics (final)

| Metric        | Value                             |
| ------------- | --------------------------------- |
| Test files    | 96                                |
| Tests passing | 1333                              |
| Lint errors   | 0                                 |
| Type errors   | 0                                 |
| Export check  | 6/6 sub-path exports valid (attw) |
| Build output  | ESM + CJS (tsup)                  |
| Commits       | 21 Phase 3 commits                |

### Commit Log (Phase 3)

| Commit  | Agent | Description                                                |
| ------- | ----- | ---------------------------------------------------------- |
| a9ea2f1 | A2    | test(fixtures): add mock-auth-page + mock-playwright-test  |
| f9ad371 | A1    | feat(proxy+bridge): remove G2 stubs, wire scripts          |
| 5ca0b8f | A3    | feat(auth): add auth types + auth-checks                   |
| 23506f3 | A4    | feat(fixtures): add worker-scoped core fixtures            |
| 0137522 | A6    | feat(auth): add OnPrem + CloudSAML auth strategies         |
| 7c547ad | A7    | feat(auth): add O365 + API + Certificate strategies        |
| 32355cc | A5    | feat(fixtures): add test-scoped core fixtures              |
| 22870f6 | A8    | feat(auth): add multi-tenant strategy + auth factory       |
| 767771b | A9    | feat(fixtures): add UI5Handler with TDD                    |
| 57a0bf3 | A10   | feat(fixtures): add stability fixtures with TDD            |
| 8129ffd | A11   | feat(modules): add navigation module with TDD              |
| f3247de | A12   | feat(auth): add auth handler + setup/teardown with TDD     |
| 9c8abbe | A15   | feat(proxy): wire Playwright API routing with TDD          |
| 0824a80 | A16   | feat(modules): add WorkZone module with TDD                |
| 1caca38 | A13   | feat(fixtures): add auth fixtures with TDD                 |
| ec363da | A14   | feat(fixtures): add nav fixtures with TDD                  |
| d713f87 | A17   | feat(proxy): wire sub-proxy creation in return handler     |
| 7c0aba9 | A18   | feat(fixtures): add shell + footer handlers with TDD       |
| cf46eeb | A19   | feat(fixtures): assemble merged test+expect via mergeTests |
| 2bef86a | fix   | fix(lint): move eslint-disable + fix mock type             |

---

## Tracked Issues

| #   | Issue                              | Resolve In        | Status |
| --- | ---------------------------------- | ----------------- | ------ |
| #22 | G2: Remove 4 hardcoded proxy stubs | A1 (B1a)          | [x]    |
| #23 | Phase 3 Parent Issue               | A19 (Wave 6)      | [x]    |
| #24 | Sub-Phase 3.1: Foundation          | A8 (Wave 3 gate)  | [x]    |
| #25 | Sub-Phase 3.2: Wiring + Auth Setup | A18 (Wave 5 gate) | [x]    |
| #26 | Sub-Phase 3.3: Assembly            | A19 (Wave 6 gate) | [x]    |

## Implementation Notes

### Deviations from Plan

1. **Auth factory**: Plan specified `AuthStrategyFactory` class; implementation uses `createAuthStrategy()` functional pattern (preferred per CLAUDE.md)
2. **Assembly file**: Plan specified separate `fixtures/assembly.ts`; implementation inlines assembly in `fixtures/index.ts` (simpler)
3. **UI5Handler LOC**: Plan estimated ~500 LOC; actual is 421 LOC (within tolerance, still exceeds 300 LOC guideline)
4. **Navigation functions**: 9 implemented (plan said 8 + getCurrentHash separately)
