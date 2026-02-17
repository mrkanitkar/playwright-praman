h# Phase 2 — Implementation Tracker

> **Plan Version**: 2.3.0
> **Plan File**: plan2.md (Bridge + Proxy Detailed Implementation Plan)
> **Created**: 2026-02-17
> **Strategy**: TDD (RED-GREEN-REFACTOR), Max 3 parallel agents, 20x plan
> **Branch**: main (direct commits, Husky hooks enabled)
> **Quality Gate**: Full `npm run ci` after every wave
> **Predecessor**: Phase 1 — 511 tests, 40 test files, 61 source files, 98.92% coverage
>
> **GitHub Issues**:
>
> - [#7 Phase 2 Parent](https://github.com/mrkanitkar/playwright-praman/issues/7)
> - [#8 Sub-Phase 2.0](https://github.com/mrkanitkar/playwright-praman/issues/8) | [#9 Sub-Phase 2.1](https://github.com/mrkanitkar/playwright-praman/issues/9) | [#10 Sub-Phase 2.2](https://github.com/mrkanitkar/playwright-praman/issues/10) | [#11 Sub-Phase 2.3](https://github.com/mrkanitkar/playwright-praman/issues/11)
> - Critical: [#12 C1-BridgePage](https://github.com/mrkanitkar/playwright-praman/issues/12) | [#13 C3-ReturnType](https://github.com/mrkanitkar/playwright-praman/issues/13)
> - Bridge: [#15 B12-Types](https://github.com/mrkanitkar/playwright-praman/issues/15) | [#16 B13-Scripts](https://github.com/mrkanitkar/playwright-praman/issues/16) | [#17 B14-B15](https://github.com/mrkanitkar/playwright-praman/issues/17) | [#18 B16-Adapters](https://github.com/mrkanitkar/playwright-praman/issues/18)
> - Proxy: [#14 H2-PlaywrightAPI](https://github.com/mrkanitkar/playwright-praman/issues/14) | [#20 B17-B19](https://github.com/mrkanitkar/playwright-praman/issues/20)
> - Integration: [#19 INT1](https://github.com/mrkanitkar/playwright-praman/issues/19) | [#21 INT2](https://github.com/mrkanitkar/playwright-praman/issues/21)

---

## Implementation Order

```
1. Sub-Phase 2.0 — Pre-Phase 2 Config Changes (Appendix C)
2. Sub-Phase 2.0 — Critical Type Fixes (Appendix B: C1-C3)
3. Sub-Phase 2.1 — Bridge Foundation (Sections 6.1-6.13)
4. Sub-Phase 2.2 — Proxy Layer (Sections 7.1-7.7)
5. Sub-Phase 2.3 — Integration + Barrels (Section 8)
```

---

## Token Budget Estimate

### 20x Plan Budget

| Metric                      | Value           |
| --------------------------- | --------------- |
| Token budget per 5hr window | ~1,760,000      |
| Max parallel agents         | 3               |
| Total batches               | 42              |
| Estimated sessions          | 3-4 sessions    |
| Estimated total tokens      | ~180,000 output |

### Token Estimates Per Batch

Each batch is sized to fit safely within Claude's context window:

- **Input context**: ~50K tokens (plan + existing code + instructions)
- **Max output per batch**: ~6K tokens (source + test combined)
- **Safety margin**: 30% buffer for retries/lint fixes
- **Max batches per session**: ~12-15

---

## Sub-Phase 2.0 — Pre-Phase 2 Config Changes

> **Scope**: Appendix C (strategy config) + Appendix B critical items (C1-C3)
> **Purpose**: Update config layer before bridge implementation begins

### Legend

- **Status**: `[ ]` pending, `[~]` in progress, `[x]` complete, `[!]` blocked
- **Est. Out**: approximate output tokens per batch
- **Depends**: batch IDs that must complete first

### Config Strategy Changes (Appendix C)

| #   | Batch | Files                                                                            | Est. Out | Depends | Status |
| --- | ----- | -------------------------------------------------------------------------------- | -------- | ------- | ------ |
| 1   | C-B1a | Update `tests/unit/core/types/config.types.test.ts` (RED)                        | ~800     | —       | [x]    |
| 2   | C-B1b | Update `tests/unit/core/config/schema.test.ts` (RED)                             | ~1,200   | —       | [x]    |
| 3   | C-B1c | Update `src/core/config/schema.ts` (GREEN — add enums + opa5)                    | ~1,000   | C-B1a   | [x]    |
| 4   | C-B1d | Update `src/core/types/config.ts` + `types/index.ts` + `config/index.ts` (GREEN) | ~600     | C-B1c   | [x]    |
| 5   | C-B1e | VERIFY GREEN: `npm run typecheck && npm run test:unit && npm run lint`           | —        | C-B1d   | [x]    |
| 6   | C-B2a | Update `tests/unit/core/config/loader.test.ts` (RED)                             | ~800     | C-B1e   | [x]    |
| 7   | C-B2b | Update `src/core/config/loader.ts` (GREEN — string-array type)                   | ~400     | C-B2a   | [x]    |
| 8   | C-B2c | VERIFY GREEN: `npm run ci`                                                       | —        | C-B2b   | [x]    |

### Critical Type Fixes (Appendix B: C1-C3)

| #   | Batch | Files                                                                      | Est. Out | Depends | Status |
| --- | ----- | -------------------------------------------------------------------------- | -------- | ------- | ------ |
| 9   | PRE-1 | Extend `BridgePage` — add `evaluate<TResult,TArg>()` + `waitForFunction()` | ~600     | C-B2c   | [x]    |
| 10  | PRE-2 | Update `tests/helpers/mock-page.ts` — match new `BridgePage`               | ~400     | PRE-1   | [x]    |
| 11  | PRE-3 | Add `'unknown'` to `BridgeReturnType` in `bridge.ts` + update test         | ~300     | PRE-1   | [x]    |
| 12  | PRE-4 | GATE: `npm run ci` — **Sub-Phase 2.0 COMPLETE**                            | —        | PRE-3   | [x]    |

**Sub-Phase 2.0 Total**: 12 batches, ~6,100 output tokens

---

## Sub-Phase 2.1 — Bridge Foundation

> **Scope**: Sections 6.1-6.13 — types, constants, browser scripts, injection, strategies, adapters
> **Duration**: Week 1-2

### Test Helpers

| #   | Batch | Files                                                | Est. Out | Depends | Status |
| --- | ----- | ---------------------------------------------------- | -------- | ------- | ------ |
| 13  | TH4   | `tests/helpers/mock-browser-context.ts`              | ~400     | PRE-4   | [ ]    |
| 14  | TH5   | `tests/helpers/mock-ui5-control.ts`                  | ~500     | PRE-4   | [ ]    |
| 15  | TH6   | `tests/helpers/browser-script-tester.ts` (vm.Script) | ~400     | PRE-4   | [ ]    |

### Bridge Types & Constants (B12)

| #   | Batch | Files                                                         | Est. Out | Depends | Status |
| --- | ----- | ------------------------------------------------------------- | -------- | ------- | ------ |
| 16  | B12a  | `src/bridge/method-blacklist.ts` + test (47 active items)     | ~1,500   | TH6     | [ ]    |
| 17  | B12b  | `src/bridge/bridge-constants.ts` + test                       | ~600     | PRE-4   | [ ]    |
| 18  | B12c  | `src/bridge/bridge-types.ts` + test (type-only, expectTypeOf) | ~800     | PRE-4   | [ ]    |

### Browser Scripts (B13)

| #   | Batch | Files                                             | Est. Out | Depends    | Status |
| --- | ----- | ------------------------------------------------- | -------- | ---------- | ------ |
| 19  | B13a  | `bridge/browser-scripts/get-version.ts` + test    | ~500     | TH6        | [ ]    |
| 20  | B13b  | `bridge/browser-scripts/object-map.ts` + test     | ~800     | TH6        | [ ]    |
| 21  | B13c  | `bridge/browser-scripts/inject-ui5.ts` + test     | ~2,500   | B13a, B13b | [ ]    |
| 22  | B13d  | `bridge/browser-scripts/find-control.ts` + test   | ~2,000   | B13c, B12a | [ ]    |
| 23  | B13e  | `bridge/browser-scripts/execute-method.ts` + test | ~1,800   | B13c       | [ ]    |
| 24  | B13f  | `bridge/browser-scripts/get-selector.ts` + test   | ~600     | B13c       | [ ]    |

### Injection & API Resolution (B14)

| #   | Batch | Files                                         | Est. Out | Depends    | Status |
| --- | ----- | --------------------------------------------- | -------- | ---------- | ------ |
| 25  | B14a  | `bridge/api-resolver.ts` + test               | ~800     | B12b       | [ ]    |
| 26  | B14b  | `bridge/injection.ts` + test (lazy-only, W14) | ~1,200   | B13c, B14a | [ ]    |

### Interaction Strategies (B15)

| #   | Batch | Files                                                             | Est. Out | Depends          | Status |
| --- | ----- | ----------------------------------------------------------------- | -------- | ---------------- | ------ |
| 27  | B15a  | `bridge/interaction-strategies/strategy.ts` + `shared.ts` + tests | ~1,000   | B12b             | [ ]    |
| 28  | B15b  | `bridge/interaction-strategies/ui5-native-strategy.ts` + test     | ~1,000   | B15a             | [ ]    |
| 29  | B15c  | `bridge/interaction-strategies/dom-first-strategy.ts` + test      | ~1,000   | B15a             | [ ]    |
| 30  | B15d  | `bridge/interaction-strategies/opa5-strategy.ts` + test           | ~800     | B15a             | [ ]    |
| 31  | B15e  | `bridge/interaction-strategies/strategy-factory.ts` + test        | ~500     | B15b, B15c, B15d | [ ]    |

### Adapters (B16)

| #   | Batch | Files                                                      | Est. Out | Depends                | Status |
| --- | ----- | ---------------------------------------------------------- | -------- | ---------------------- | ------ |
| 32  | B16a  | `bridge/classic-adapter.ts` + test (primary, 95%+ usage)   | ~3,000   | B14b, B15e, B13d, B13e | [ ]    |
| 33  | B16b  | `bridge/webcomponent-adapter.ts` + test (stub/fallback)    | ~800     | B12b                   | [ ]    |
| 34  | B16c  | `bridge/hybrid-adapter.ts` + test (auto-detect delegation) | ~1,000   | B16a, B16b             | [ ]    |
| 35  | B16d  | `bridge/adapter-factory.ts` + test                         | ~600     | B16c                   | [ ]    |

### Integration Smoke (INT1)

| #   | Batch | Files                                                                         | Est. Out | Depends | Status |
| --- | ----- | ----------------------------------------------------------------------------- | -------- | ------- | ------ |
| 36  | INT1  | `tests/integration/bridge-smoke.spec.ts` + `playwright.integration.config.ts` | ~1,500   | B16d    | [ ]    |

**Sub-Phase 2.1 Gate**: `npm run ci && npm run test:integration:demo`

**Sub-Phase 2.1 Total**: 24 batches (TH4-TH6 + B12-B16 + INT1), ~24,300 output tokens

---

## Sub-Phase 2.2 — Proxy Layer

> **Scope**: Sections 7.1-7.7 — dynamic proxy, return handler, UI5Object, discovery, cache
> **Duration**: Week 2-3

### Proxy Core (B17)

| #   | Batch | Files                                                        | Est. Out | Depends    | Status |
| --- | ----- | ------------------------------------------------------------ | -------- | ---------- | ------ |
| 37  | B17a  | `proxy/method-filter.ts` + `proxy/playwright-api.ts` + tests | ~1,000   | B12a       | [ ]    |
| 38  | B17b  | `proxy/return-handler.ts` + test                             | ~1,000   | B12b, TH5  | [ ]    |
| 39  | B17c  | `proxy/dynamic-proxy.ts` + test (20 test cases)              | ~2,000   | B17a, B17b | [ ]    |

### UI5Object (B18)

| #   | Batch | Files                                                 | Est. Out | Depends    | Status |
| --- | ----- | ----------------------------------------------------- | -------- | ---------- | ------ |
| 40  | B18a  | `proxy/ui5-object.ts` + test                          | ~1,200   | B12b, TH5  | [ ]    |
| 41  | B18b  | `proxy/ui5-object-proxy.ts` + test                    | ~800     | B18a       | [ ]    |
| 42  | B18c  | `proxy/ui5-object-cache.ts` + test (TTL + LRU)        | ~1,000   | B18a       | [ ]    |
| 43  | B18d  | `proxy/proxy-converter.ts` + test (bidirectional D17) | ~800     | B18b, B17c | [ ]    |

### Discovery & Cache (B19)

| #   | Batch | Files                                      | Est. Out | Depends          | Status |
| --- | ----- | ------------------------------------------ | -------- | ---------------- | ------ |
| 44  | B19a  | `proxy/cache.ts` + test (LRU, RegExp keys) | ~800     | B12b             | [ ]    |
| 45  | B19b  | `proxy/discovery-factory.ts` + test        | ~600     | B12b             | [ ]    |
| 46  | B19c  | `proxy/discovery.ts` + test (orchestrator) | ~800     | B19a, B19b, B16a | [ ]    |

### Integration Smoke (INT2)

| #   | Batch | Files                                                               | Est. Out | Depends    | Status |
| --- | ----- | ------------------------------------------------------------------- | -------- | ---------- | ------ |
| 47  | INT2  | `tests/integration/proxy-smoke.spec.ts` + `sap-cloud-smoke.spec.ts` | ~1,500   | B19c, B18d | [ ]    |

**Sub-Phase 2.2 Gate**: `npm run ci && npm run test:integration:demo`

**Sub-Phase 2.2 Total**: 12 batches (B17-B19 + INT2), ~11,500 output tokens

---

## Sub-Phase 2.3 — Integration + Barrels

> **Scope**: Section 8 — barrel files, main entry update, final validation
> **Duration**: Week 4

| #   | Batch | Files                                                              | Est. Out | Depends    | Status |
| --- | ----- | ------------------------------------------------------------------ | -------- | ---------- | ------ |
| 48  | B21a  | `bridge/index.ts` barrel + test                                    | ~400     | B16d       | [ ]    |
| 49  | B21b  | `proxy/index.ts` barrel + test                                     | ~400     | B19c, B18d | [ ]    |
| 50  | B21c  | `src/index.ts` update + `npm run check:exports` + **PHASE 2 GATE** | ~400     | B21a, B21b | [ ]    |

**Sub-Phase 2.3 Gate**: `npm run ci && npm run check:exports`

**Sub-Phase 2.3 Total**: 3 batches, ~1,200 output tokens

---

## Wave Execution Plan (Max 3 Parallel Agents)

```
Wave 1  (start):        C-B1a, C-B1b                                 [2 parallel — RED tests]
Wave 2  (after C-B1a):  C-B1c, C-B1d, C-B1e                          [sequential — GREEN code]
Wave 3  (after C-B1e):  C-B2a, C-B2b, C-B2c                          [sequential — loader RED/GREEN]
Wave 4  (after C-B2c):  PRE-1, PRE-2, PRE-3, PRE-4                   [sequential — critical fixes]
────────────────────────── SUB-PHASE 2.0 GATE ──────────────────────────
Wave 5  (start 2.1):    TH4, TH5, TH6, B12b                          [3 parallel + 1]
Wave 6  (after TH6):    B12a, B12c, B13a, B13b                        [3 parallel]
Wave 7  (after B13a/b): B13c, B14a, B15a                              [3 parallel]
Wave 8  (after B13c):   B13d, B13e, B13f, B14b                        [3 parallel]
Wave 9  (after B15a):   B15b, B15c, B15d                              [3 parallel]
Wave 10 (after B15b-d): B15e, B16b, B17a                              [3 parallel]
Wave 11 (after B15e):   B16a, B17b                                    [2 parallel]
Wave 12 (after B16a):   B16c, B18a, B19a, B19b                        [3 parallel]
Wave 13 (after B16c):   B16d, B18b, B18c                              [3 parallel]
Wave 14 (after B16d):   INT1, B17c                                    [2 parallel]
────────────────────────── SUB-PHASE 2.1 GATE ──────────────────────────
Wave 15 (after B17c):   B18d, B19c                                    [2 parallel]
Wave 16 (after B19c):   INT2, B21a, B21b                              [3 parallel]
────────────────────────── SUB-PHASE 2.2 GATE ──────────────────────────
Wave 17 (final):        B21c                                          [1 — final gate]
────────────────────────── PHASE 2 GATE (FINAL) ────────────────────────
```

### Critical Path

```
C-B1a → C-B1c → C-B1d → C-B1e → PRE-1 → TH6 → B13a → B13c → B13d → B16a → B16c → B16d → INT1 → B19c → B21b → B21c
                                                                                                                (16 steps)
```

### Session Planning

| Session | Waves | Batches | Est. Output |
| ------- | ----- | ------- | ----------- |
| 1       | 1-7   | 22      | ~14,000     |
| 2       | 8-12  | 17      | ~14,500     |
| 3       | 13-16 | 11      | ~8,500      |
| 4       | 17    | 1       | ~400        |

**Total**: ~50 batches, ~43,100 output tokens, 3-4 sessions

---

## Dependency Graph (DAG)

```text
Sub-Phase 2.0:
  C-B1a ──┐
  C-B1b ──┤
          ├→ C-B1c → C-B1d → C-B1e → C-B2a → C-B2b → C-B2c
                                                           │
                              PRE-1 → PRE-2 → PRE-3 → PRE-4 ← C-B2c
                                                           │
Sub-Phase 2.1:                                             │
  TH4 ←───────────────────────────────────────────────── PRE-4
  TH5 ←───────────────────────────────────────────────── PRE-4
  TH6 ←───────────────────────────────────────────────── PRE-4
  B12b ←──────────────────────────────────────────────── PRE-4
  B12a ← TH6
  B12c ← PRE-4
  B13a ← TH6
  B13b ← TH6
  B13c ← B13a, B13b
  B13d ← B13c, B12a
  B13e ← B13c
  B13f ← B13c
  B14a ← B12b
  B14b ← B13c, B14a
  B15a ← B12b
  B15b ← B15a
  B15c ← B15a
  B15d ← B15a
  B15e ← B15b, B15c, B15d
  B16a ← B14b, B15e, B13d, B13e
  B16b ← B12b
  B16c ← B16a, B16b
  B16d ← B16c
  INT1 ← B16d

Sub-Phase 2.2:
  B17a ← B12a
  B17b ← B12b, TH5
  B17c ← B17a, B17b
  B18a ← B12b, TH5
  B18b ← B18a
  B18c ← B18a
  B18d ← B18b, B17c
  B19a ← B12b
  B19b ← B12b
  B19c ← B19a, B19b, B16a
  INT2 ← B19c, B18d

Sub-Phase 2.3:
  B21a ← B16d
  B21b ← B19c, B18d
  B21c ← B21a, B21b
```

---

## Quality Gates

### Per-Batch Gate (every batch)

```bash
npm run ci          # lint + typecheck + test:unit + build
git add <files>
git commit -m "feat(scope): description (batch-id)"
```

### Sub-Phase Gates

| Gate | After Batch | Additional Checks                                                  |
| ---- | ----------- | ------------------------------------------------------------------ |
| 2.0  | PRE-4       | All config strategy changes verified. ~67 affected tests pass.     |
| 2.1  | INT1        | `npm run test:integration:demo` (bridge smoke against UI5 demos)   |
| 2.2  | INT2        | `npm run test:integration:demo` + `test:integration:sap` (if .env) |
| 2.3  | B21c        | `npm run check:exports` — attw validates all export maps           |

### Coverage Requirements

| Tier       | Scope                | Stmts | Branches | Functions | Lines |
| ---------- | -------------------- | ----- | -------- | --------- | ----- |
| **Tier 2** | `src/bridge/**/*.ts` | 95%   | 90%      | 95%       | 95%   |
| **Tier 2** | `src/proxy/**/*.ts`  | 95%   | 90%      | 95%       | 95%   |
| **Tier 3** | Global               | 90%   | 85%      | 90%       | 90%   |

---

## Impact Analysis

| Metric            | Before Phase 2 | After Phase 2 | Delta   |
| ----------------- | -------------- | ------------- | ------- |
| Source files      | 61             | ~94           | +33     |
| Test files        | 45             | ~82           | +37     |
| Unit test cases   | 511            | ~809          | +298    |
| Integration tests | 0              | ~30           | +30     |
| Est. dist/ size   | ~80 KB         | ~220 KB       | +140 KB |
| npm dependencies  | 0 new          | 0 new         | 0       |

---

## Tracked Issues

| #   | Issue                                                      | Resolve In | Batch | Status |
| --- | ---------------------------------------------------------- | ---------- | ----- | ------ |
| C1  | Extend `BridgePage` with `evaluate<TResult,TArg>` overload | Pre-Phase  | PRE-1 | [x]    |
| C2  | `MethodExecutionResult<T>` vs `BridgeResult<T>` gap        | Bridge     | B16a  | [ ]    |
| C3  | Add `'unknown'` to `BridgeReturnType`                      | Pre-Phase  | PRE-3 | [x]    |
| H1  | Delete `proxy/typed/` (redundant — auto-gen exists)        | N/A        | —     | [x]    |
| H2  | Add `proxy/playwright-api.ts` allowlist                    | Proxy      | B17a  | [ ]    |
| H3  | Browser script syntax validation (`vm.Script`)             | Helpers    | TH6   | [ ]    |
| H4  | `page.evaluate()` serialization boundary docs              | Bridge     | B16a  | [ ]    |
| M1  | Split `inject-ui5.ts` into composable snippets             | Bridge     | B13c  | [ ]    |
| M4  | Proxy cache invalidation on navigation                     | Proxy      | B19a  | [ ]    |
| M5  | Merge XHR patterns with `ignoreAutoWaitUrls`               | Bridge     | B12b  | [ ]    |
| M6  | Input validation on controlId/methodName                   | Bridge     | B16a  | [ ]    |
| M9  | Drop `WeakRef`, use TTL-only cleanup                       | Bridge     | B13b  | [ ]    |

---

## Progress Summary

| Sub-Phase                    | Batches | Done   | Remaining | %        |
| ---------------------------- | ------- | ------ | --------- | -------- |
| 2.0 Pre-Phase Config + Fixes | 12      | 12     | 0         | **100%** |
| 2.1 Bridge Foundation        | 24      | 0      | 24        | 0%       |
| 2.2 Proxy Layer              | 12      | 0      | 12        | 0%       |
| 2.3 Integration + Barrels    | 3       | 0      | 3         | 0%       |
| **Total**                    | **51**  | **12** | **39**    | **24%**  |

### Commit Message Convention

```text
feat(config): add strategy enums + opa5 sub-schema (C-B1c)
test(config): update strategy config type tests (C-B1a)
feat(bridge): add method blacklist with 47 items (B12a)
feat(bridge): add inject-ui5 browser script (B13c)
feat(bridge): add ClassicUI5Adapter (B16a)
feat(proxy): add dynamic proxy handler (B17c)
test(integration): add bridge smoke tests (INT1)
chore(barrels): wire bridge + proxy barrels (B21a, B21b)
chore(phase2): final gate — Phase 2 COMPLETE (B21c)
```
