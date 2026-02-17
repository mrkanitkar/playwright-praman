# Phase 3 — Implementation Tracker

> **Plan Version**: 1.0.0
> **Status**: **PLANNED**
> **Plan File**: plan3.md (Fixtures + Auth + Navigation Detailed Implementation Plan)
> **Created**: 2026-02-18
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
1. Wave 1 — Foundation (A1, A2, A3) — no dependencies
2. Wave 2 — Core + Auth Strategies (A4, A6, A7) — depends on Wave 1
3. Wave 3 — Test Fixtures + Auth Factory (A5, A8) — depends on Wave 2
   ── Sub-Phase 3.1 Gate: npm run ci ──
4. Wave 4 — Wiring (A9, A10, A11, A12, A15, A16) — depends on Wave 3
5. Wave 5 — Fixture Assembly (A13, A14, A17, A18) — depends on Wave 4
   ── Sub-Phase 3.2 Gate: npm run ci ──
6. Wave 6 — Final Assembly (A19) — depends on all
   ── Sub-Phase 3.3 Gate: npm run ci + npm run check:exports ──
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

| #   | Agent  | Batches   | Description                                                                       | Source LOC | Test LOC | Est. Tokens | Depends | Status |
| --- | ------ | --------- | --------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ |
| 1   | **A1** | B1a + B1b | G2 proxy fix: remove 4 hardcoded stubs + orphan wiring (object-map, get-selector) | ~120       | ~80      | ~32K        | None    | [ ]    |
| 2   | **A2** | TH1       | Test helpers: `mock-auth-page.ts`, `mock-playwright-test.ts`                      | ~120       | —        | ~26K        | None    | [ ]    |
| 3   | **A3** | B2a       | Auth types (`auth-types.ts`) + auth checks (`auth-checks.ts`) + tests             | ~200       | ~200     | ~37K        | None    | [ ]    |

### Wave 2 — Core Fixtures + Auth Strategies (Depends: Wave 1)

| #   | Agent  | Batches   | Description                                                                                                                              | Source LOC | Test LOC | Est. Tokens | Depends | Status |
| --- | ------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ |
| 4   | **A4** | B3a       | Core fixtures — worker-scoped: `pramanConfig`, `rootLogger`, `tracer`, `playwrightCompat`, `selectorRegistration`, `matcherRegistration` | ~200       | ~170     | ~41K        | A2      | [ ]    |
| 5   | **A6** | B2b + B2c | OnPrem + CloudSAML auth strategies + tests                                                                                               | ~450       | ~190     | ~48K        | A3      | [ ]    |
| 6   | **A7** | B2d + B2e | Office365 + API + Certificate auth strategies + tests                                                                                    | ~500       | ~160     | ~48K        | A3      | [ ]    |

### Wave 3 — Test Fixtures + Auth Factory (Depends: Wave 2)

| #   | Agent  | Batches | Description                                                                   | Source LOC | Test LOC | Est. Tokens | Depends | Status |
| --- | ------ | ------- | ----------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ |
| 7   | **A5** | B3b     | Core fixtures — test-scoped: `pramanLogger`, `bridgeAdapter`, `ui5` (initial) | ~250       | ~170     | ~46K        | A4      | [ ]    |
| 8   | **A8** | B2f     | Multi-tenant strategy + `AuthStrategyFactory` + tests                         | ~260       | ~220     | ~44K        | A6, A7  | [ ]    |

**── Sub-Phase 3.1 Gate ──**

```bash
npm run typecheck        # Zero errors
npm run lint             # Zero errors, zero warnings
npm run test:unit        # 929 existing + ~63 new = ~992
npm run build            # tsup succeeds
```

### Wave 4 — Max Parallel Wiring (Depends: Wave 3)

| #   | Agent   | Batches   | Description                                                                                                                                                                       | Source LOC | Test LOC | Est. Tokens | Depends | Status |
| --- | ------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ |
| 9   | **A9**  | B3c       | UI5Handler class: 14 methods (control, controls, click, fill, press, select, check, uncheck, clear, getText, getValue, waitForUI5, waitFor, clearCache, destroy)                  | ~500       | ~280     | ~63K        | A4, A5  | [ ]    |
| 10  | **A10** | B4a       | Stability fixtures: WalkMe/analytics blocking + auto-wait                                                                                                                         | ~180       | ~100     | ~38K        | A5      | [ ]    |
| 11  | **A11** | B5b       | Navigation module: 8 functions (navigateToApp, navigateToTile, navigateToIntent, navigateToHash, navigateToHome, navigateBack, navigateForward, searchAndOpenApp, getCurrentHash) | ~350       | ~210     | ~50K        | A5      | [ ]    |
| 12  | **A12** | B4b + B4c | Auth handler (`SAPAuthHandler`) + auth setup/teardown projects                                                                                                                    | ~380       | ~180     | ~50K        | A8      | [ ]    |
| 13  | **A15** | B5d       | Playwright-API wiring: expand `ControlProxyState`, add interaction routing in get trap                                                                                            | ~200       | ~120     | ~39K        | A5      | [ ]    |
| 14  | **A16** | B6a       | WorkZone module: `BTPWorkZoneManager`, dual-frame bridge injection                                                                                                                | ~320       | ~120     | ~46K        | A5      | [ ]    |

### Wave 5 — Fixture Assembly (Depends: Wave 4)

| #   | Agent   | Batches | Description                                                                         | Source LOC | Test LOC | Est. Tokens | Depends | Status |
| --- | ------- | ------- | ----------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ |
| 15  | **A13** | B5a     | Auth fixtures: `sapAuth` option fixture, session validation                         | ~180       | ~90      | ~38K        | A12, A5 | [ ]    |
| 16  | **A14** | B5c     | Nav fixtures: step-decorated navigation actions                                     | ~280       | ~90      | ~43K        | A11, A5 | [ ]    |
| 17  | **A17** | B3d     | Return handler sub-proxy wiring: wire `proxy-converter.ts` into `return-handler.ts` | ~50        | ~110     | ~34K        | A9      | [ ]    |
| 18  | **A18** | B6c     | Shell header + footer bar handlers                                                  | ~250       | ~150     | ~41K        | A9      | [ ]    |

**── Sub-Phase 3.2 Gate ──**

```bash
npm run ci               # Full pipeline (lint + typecheck + test + build)
```

### Wave 6 — Final Assembly (Depends: All)

| #   | Agent   | Batches  | Description                                                                        | Source LOC | Test LOC | Est. Tokens | Depends | Status |
| --- | ------- | -------- | ---------------------------------------------------------------------------------- | ---------- | -------- | ----------- | ------- | ------ |
| 19  | **A19** | B7 + B6b | Assembly: `fixtures/index.ts`, barrel updates, nav WZ wiring, CI + attw validation | ~240       | ~80      | ~48K        | All     | [ ]    |

**── Sub-Phase 3.3 Gate ──**

```bash
npm run ci               # Full pipeline
npm run check:exports    # attw validates all 6 sub-path exports
```

**Total: 19 agents** (5 merges from 24 original batches + 1 spare agent for retry/hotfix)

---

## Dependency Graph (DAG)

```text
Wave 1:  A1, A2, A3                              [3 agents — no deps]
Wave 2:  A4←A2, A6←A3, A7←A3                    [3 agents — after Wave 1]
Wave 3:  A5←A4, A8←A6+A7                        [2 agents — after Wave 2]
         ── Sub-Phase 3.1 Gate ──
Wave 4:  A9←A4+A5, A10←A5, A11←A5,             [6 agents — max parallel]
         A12←A8, A15←A5, A16←A5
Wave 5:  A13←A12+A5, A14←A11+A5,               [4 agents — after Wave 4]
         A17←A9, A18←A9
         ── Sub-Phase 3.2 Gate ──
Wave 6:  A19←ALL                                 [1 agent — assembly]
         ── Sub-Phase 3.3 Gate ──
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
| A9 (UI5Handler)    | `max-lines: 300` exceeded (~500 LOC)                   | Document exception or split into handler + helper       |
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

| Gate | After Wave       | Additional Checks                                                                       |
| ---- | ---------------- | --------------------------------------------------------------------------------------- |
| 3.1  | Wave 3 (A5, A8)  | Tier 2 coverage for `src/auth/strategies/**` (95/90/95/95)                              |
| 3.2  | Wave 5 (A13-A18) | Tier 2 for `src/auth/**`, Tier 3 for `src/fixtures/**` + `src/modules/**` (90/85/90/90) |
| 3.3  | Wave 6 (A19)     | Global ≥ 95% statements. `npm run check:exports` validates all 6 sub-path exports.      |

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
| `handleBridgeReturn()`            | A17 (B3d — modifies)      |
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

| Sub-Phase              | Agents | Done  | Remaining | %      |
| ---------------------- | ------ | ----- | --------- | ------ |
| 3.1 Foundation (W1-W3) | 8      | 0     | 8         | 0%     |
| 3.2 Wiring (W4-W5)     | 10     | 0     | 10        | 0%     |
| 3.3 Assembly (W6)      | 1      | 0     | 1         | 0%     |
| **Total**              | **19** | **0** | **19**    | **0%** |

### Metrics (updated after each wave)

| Metric        | Value                                |
| ------------- | ------------------------------------ |
| Test files    | 73 (Phase 2 baseline)                |
| Tests passing | 929 (Phase 2 baseline)               |
| Lint errors   | 0                                    |
| Type errors   | 0                                    |
| Export check  | 6/6 sub-path exports valid (attw)    |
| Build output  | (TBD after Wave 6)                   |
| Coverage      | 99.18% statements (Phase 2 baseline) |

---

## Tracked Issues

| #   | Issue                              | Resolve In        | Status |
| --- | ---------------------------------- | ----------------- | ------ |
| #22 | G2: Remove 4 hardcoded proxy stubs | A1 (B1a)          | [ ]    |
| #23 | Phase 3 Parent Issue               | A19 (Wave 6)      | [ ]    |
| #24 | Sub-Phase 3.1: Foundation          | A8 (Wave 3 gate)  | [ ]    |
| #25 | Sub-Phase 3.2: Wiring + Auth Setup | A18 (Wave 5 gate) | [ ]    |
| #26 | Sub-Phase 3.3: Assembly            | A19 (Wave 6 gate) | [ ]    |
