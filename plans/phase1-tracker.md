# Phase 1 — Implementation Tracker

> **Plan Version**: 1.5.0
> **Created**: 2026-02-16
> **Strategy**: TDD (RED-GREEN-REFACTOR), Max 2 parallel agents, Max5 budget
> **Branch**: main (direct commits, Husky hooks enabled)
> **Quality Gate**: Full `npm run ci` after every batch

---

## Wizard Decisions (Implementation Session)

| #   | Decision            | Value                                               |
| --- | ------------------- | --------------------------------------------------- |
| W1  | Claude Code plan    | Max5 (~88K tokens/5hr window)                       |
| W2  | Branch strategy     | Direct to main                                      |
| W3  | Baseline            | Commit all planning files first                     |
| W4  | Max parallel agents | 2                                                   |
| W5  | Batch size          | ~100 LOC source + ~80 LOC tests (~2K tokens output) |
| W6  | Tracker format      | Markdown + GitHub Issues                            |
| W7  | Quality gates       | Full `npm run ci` after every batch                 |
| W8  | Git hooks           | All enabled (pre-commit + commit-msg + pre-push)    |

---

## Token Budget Estimate

### Per-Batch Cost (Max5 Plan)

| Component                   | Tokens (est.)     |
| --------------------------- | ----------------- |
| Read plan section + context | ~3,000 input      |
| Read existing files         | ~1,500 input      |
| Write test file             | ~1,200 output     |
| Write source file           | ~1,500 output     |
| Run npm run ci              | ~800 output       |
| Git commit + push           | ~400 output       |
| **Total per batch**         | **~8,400 tokens** |

### Session Planning

| Metric                           | Value            |
| -------------------------------- | ---------------- |
| Token budget per 5hr window      | ~88,000          |
| Tokens per batch (avg)           | ~8,400           |
| Batches per session (sequential) | ~10              |
| Batches per session (2 parallel) | ~7-8             |
| Total batches                    | 45               |
| **Estimated sessions**           | **5-6 sessions** |
| **Estimated total tokens**       | **~378,000**     |

### Cost Estimate (Max5 plan = $100/mo)

Sessions are spread across the 5-hour rolling window. At ~7 batches per
session with 2 parallel agents, Phase 1 requires ~6 sessions over ~3 days
of focused work.

---

## Batch Definitions (45 Batches)

### Legend

- **Status**: `[ ]` pending, `[~]` in progress, `[x]` complete, `[!]` blocked
- **Est. Tokens**: approximate output tokens per batch
- **Depends**: batch IDs that must complete first
- **CI**: every batch runs `npm run ci` after completion

### Sub-Phase 1.1 — Foundation (Batches B1-B14, TH1, TH3)

#### Types (B1-B7)

| #   | Batch | Files                                                                                                 | Est. Out | Depends       | Status |
| --- | ----- | ----------------------------------------------------------------------------------------------------- | -------- | ------------- | ------ |
| 1   | B1a   | `src/version.ts` + `src/core/types/config.ts`                                                         | ~800     | None          | [x]    |
| 2   | B1a-t | `tests/unit/core/types/config.types.test.ts`                                                          | ~600     | B1a           | [x]    |
| 3   | B1b   | `src/core/types/selectors.ts` + `src/core/types/bridge.ts` + `src/core/types/validation.ts`           | ~1,000   | None          | [x]    |
| 4   | B1b-t | `tests/unit/core/types/selectors.types.test.ts` + `bridge.types.test.ts` + `validation.types.test.ts` | ~800     | B1b           | [x]    |
| 5   | B1c   | `src/core/types/controls.ts` — UI5ControlBase + sap.m Input (25 interfaces)                           | ~2,000   | None          | [x]    |
| 6   | B1d   | `src/core/types/controls.ts` — sap.m Display + Indicators + Tiles (19 interfaces)                     | ~1,600   | B1c           | [x]    |
| 7   | B1e   | `src/core/types/controls.ts` — sap.m List + Dialog + Navigation (35 interfaces)                       | ~2,500   | B1d           | [x]    |
| 8   | B1f   | `src/core/types/controls.ts` — sap.m Container + other libs + unions + map (34 interfaces)            | ~2,200   | B1e           | [x]    |
| 9   | B1f-t | `tests/unit/core/types/controls.types.test.ts`                                                        | ~700     | B1f           | [x]    |
| 10  | B1g   | `src/core/types/ui5-types.d.ts` + `src/core/types/index.ts` barrel                                    | ~600     | B1a, B1b, B1f | [x]    |

#### Errors (B2a-B2h, TH3)

| #   | Batch | Files                                                                              | Est. Out | Depends  | Status |
| --- | ----- | ---------------------------------------------------------------------------------- | -------- | -------- | ------ |
| 11  | B2a   | `src/core/errors/codes.ts` + `tests/unit/core/errors/codes.test.ts`                | ~600     | B1a      | [x]    |
| 12  | B2b   | `src/core/errors/base.ts`                                                          | ~1,500   | B2a      | [x]    |
| 13  | B2b-t | `tests/unit/core/errors/base.test.ts`                                              | ~1,200   | B2b      | [x]    |
| 14  | TH3   | `tests/helpers/error-test-runner.ts`                                               | ~600     | B2b      | [x]    |
| 15  | B2c   | `src/core/errors/config-error.ts` + test                                           | ~1,200   | B2b, TH3 | [x]    |
| 16  | B2d   | `src/core/errors/bridge-error.ts` + `control-error.ts` + tests                     | ~1,800   | B2b, TH3 | [x]    |
| 17  | B2e   | `src/core/errors/auth-error.ts` + `navigation-error.ts` + `odata-error.ts` + tests | ~2,000   | B2b, TH3 | [x]    |
| 18  | B2f   | `src/core/errors/selector-error.ts` + `timeout-error.ts` + tests                   | ~1,500   | B2b, TH3 | [x]    |
| 19  | B2g   | `src/core/errors/ai-error.ts` + `plugin-error.ts` + tests                          | ~1,500   | B2b, TH3 | [x]    |
| 20  | B2h   | `src/core/errors/index.ts` barrel                                                  | ~400     | B2c-B2g  | [x]    |

#### Config (B3a-B3d, TH1)

| #   | Batch | Files                                                      | Est. Out | Depends       | Status |
| --- | ----- | ---------------------------------------------------------- | -------- | ------------- | ------ |
| 21  | B3a   | `src/core/config/schema.ts`                                | ~1,500   | B1a           | [ ]    |
| 22  | B3a-t | `tests/unit/core/config/schema.test.ts`                    | ~1,200   | B3a           | [ ]    |
| 23  | TH1   | `tests/helpers/mock-config.ts` + `mock-page.ts`            | ~800     | B3a           | [ ]    |
| 24  | B3b   | `src/core/config/loader.ts`                                | ~1,500   | B3a, B2a      | [ ]    |
| 25  | B3b-t | `tests/unit/core/config/loader.test.ts`                    | ~1,000   | B3b, TH1      | [ ]    |
| 26  | B3c   | `src/core/config/index.ts` barrel + **SUB-PHASE 1.1 GATE** | ~400     | B3a, B3b, B2h | [ ]    |

### Sub-Phase 1.2 — Infrastructure (Batches B4-B7)

#### Logging (B4a-B4c)

| #   | Batch | Files                                  | Est. Out | Depends  | Status |
| --- | ----- | -------------------------------------- | -------- | -------- | ------ |
| 27  | B4a   | `src/core/logging/redaction.ts` + test | ~1,200   | B3c, TH1 | [ ]    |
| 28  | B4b   | `src/core/logging/logger.ts` + test    | ~1,500   | B4a      | [ ]    |
| 29  | B4c   | `src/core/logging/index.ts` barrel     | ~300     | B4b      | [ ]    |

#### Telemetry (B5a-B5c)

| #   | Batch | Files                                | Est. Out | Depends | Status |
| --- | ----- | ------------------------------------ | -------- | ------- | ------ |
| 30  | B5a   | `src/core/telemetry/otel.ts` + test  | ~1,500   | B3c     | [ ]    |
| 31  | B5b   | `src/core/telemetry/spans.ts` + test | ~1,200   | B5a     | [ ]    |
| 32  | B5c   | `src/core/telemetry/index.ts` barrel | ~300     | B5b     | [ ]    |

#### Utils (B6a-B6e)

| #   | Batch | Files                                                             | Est. Out | Depends  | Status |
| --- | ----- | ----------------------------------------------------------------- | -------- | -------- | ------ |
| 33  | B6a   | `src/core/utils/constants.ts` + test                              | ~1,000   | B3c      | [ ]    |
| 34  | B6b   | `src/core/utils/wait-helpers.ts` + test                           | ~1,500   | B6a, TH1 | [ ]    |
| 35  | B6c   | `src/core/utils/retry.ts` + test                                  | ~1,500   | B2a      | [ ]    |
| 36  | B6d   | `src/core/utils/step-decorator.ts` + `version-compare.ts` + tests | ~1,800   | B2a      | [ ]    |
| 37  | B6e   | `src/core/utils/index.ts` barrel                                  | ~400     | B6a-B6d  | [ ]    |

#### Compat (B7a-B7b)

| #   | Batch | Files                                                                             | Est. Out | Depends            | Status |
| --- | ----- | --------------------------------------------------------------------------------- | -------- | ------------------ | ------ |
| 38  | B7a   | `src/core/compat/playwright-compat.ts` + test                                     | ~1,500   | B1a, B6d           | [ ]    |
| 39  | B7b   | `src/core/compat/index.ts` + `src/core/index.ts` barrels + **SUB-PHASE 1.2 GATE** | ~600     | B4c, B5c, B6e, B7a | [ ]    |

### Sub-Phase 1.3 — Playwright Integration (Batches B8-B11)

| #   | Batch | Files                                                   | Est. Out | Depends  | Status |
| --- | ----- | ------------------------------------------------------- | -------- | -------- | ------ |
| 40  | B8a   | `src/bridge/adapter.ts` + test + barrel                 | ~1,200   | B1a      | [ ]    |
| 41  | TH2   | `tests/helpers/mock-bridge-adapter.ts`                  | ~700     | B8a      | [ ]    |
| 42  | B9a   | `src/selectors/selector-parser.ts` + test               | ~2,000   | B1a, B2a | [ ]    |
| 43  | B9b   | `src/selectors/ui5-selector-engine.ts` + test + barrel  | ~1,500   | B9a      | [ ]    |
| 44  | B10a  | `src/matchers/ui5-matchers.ts` + test                   | ~2,000   | TH2      | [ ]    |
| 45  | B10b  | `src/matchers/table-matchers.ts` + test + barrel        | ~1,500   | TH2      | [ ]    |
| 46  | B11   | `src/index.ts` update + final barrel + **PHASE 1 GATE** | ~600     | All      | [ ]    |

**Total: 46 batches** (39 code + 4 test-only + 3 test helpers)

---

## Dependency Graph (DAG)

```text
Wave 1:  B1a, B1b, B1c                           [3 → use 2 agents]
Wave 2:  B1a-t, B1b-t, B1d, B2a, B3a, B8a        [after B1a/B1b]
Wave 3:  B1e, B2b, B3a-t, TH1, B9a               [after B2a/B3a]
Wave 4:  B1f, TH3, B2b-t, B3b                     [after B2b/B3a]
Wave 5:  B1f-t, B2c, B2d, B3b-t, TH2, B6c, B6d   [after TH3/B3b/B8a]
Wave 6:  B1g, B2e, B2f, B2g, B9b                  [after B1f/B2c]
Wave 7:  B2h, B10a, B10b                           [after B2g/TH2]
Wave 8:  B3c (GATE 1.1)                            [after B3b + B2h]
Wave 9:  B4a, B5a, B6a, B6b                        [after B3c + TH1]
Wave 10: B4b, B5b                                  [after B4a/B5a]
Wave 11: B4c, B5c, B6e                             [after B4b/B5b/B6d]
Wave 12: B7a                                       [after B6d + B1a]
Wave 13: B7b (GATE 1.2)                            [after B4c+B5c+B6e+B7a]
Wave 14: B11 (GATE 1.3 — FINAL)                    [after ALL]
```

**Critical Path** (longest sequential chain — 8 steps):

```text
B1a → B3a → B3b → B3c → B4a → B4b → B4c → B7b → B11
```

**With Max 2 Parallel Agents**, execution plan per session:

| Session | Batches (est.) | Agent 1                         | Agent 2                         |
| ------- | -------------- | ------------------------------- | ------------------------------- |
| 1       | 8-10           | B1a → B1a-t → B2a → B2b → B2b-t | B1b → B1b-t → B1c → B1d         |
| 2       | 8-10           | TH3 → B2c → B2d → B2e → B2f     | B1e → B1f → B1f-t → B3a → B3a-t |
| 3       | 8-10           | B2g → B2h → B3b → B3b-t → B3c   | TH1 → B1g → B8a → TH2 → B9a     |
| 4       | 8-10           | B4a → B4b → B4c → B5a → B5b     | B6a → B6b → B6c → B6d → B9b     |
| 5       | 8-10           | B5c → B6e → B7a → B7b           | B10a → B10b → B11               |

Estimated total: ~5 sessions x ~88K tokens = ~440K tokens.

---

## Quality Gates

### Per-Batch Gate (every batch)

```bash
npm run ci          # lint + typecheck + test:unit + build
git add <files>
git commit -m "feat(scope): description"   # Husky: lint-staged + commitlint
git push            # Husky: typecheck + test:unit --coverage + build
```

### Sub-Phase Gates (3 total)

| Gate | After Batch | Additional Checks                                                                    |
| ---- | ----------- | ------------------------------------------------------------------------------------ |
| 1.1  | B3c         | Set Tier 1 coverage (100%) for `src/core/errors/**`, Tier 2 for `src/core/config/**` |
| 1.2  | B7b         | Set Tier 2 coverage (95/90/95/95) for all `src/core/**`                              |
| 1.3  | B11         | Set Tier 3 coverage (90/85/90/90) globally. Run `npm run check:exports`.             |

### Commit Message Convention

```text
feat(types): add PramanConfig and literal unions (B1a)
test(types): add config type-level tests (B1a-t)
feat(errors): add error codes and base class (B2a, B2b)
test(errors): add base error test suite (B2b-t)
feat(config): add Zod schema and config loader (B3a, B3b)
chore(config): wire barrel + sub-phase 1.1 gate (B3c)
```

---

## Progress Summary

| Sub-Phase          | Batches | Done   | Remaining | %       |
| ------------------ | ------- | ------ | --------- | ------- |
| 1.1 Foundation     | 26      | 20     | 6         | 77%     |
| 1.2 Infrastructure | 13      | 0      | 13        | 0%      |
| 1.3 Playwright     | 7       | 0      | 7         | 0%      |
| **Total**          | **46**  | **20** | **26**    | **43%** |

---

## Tracked Issues (resolve during implementation)

| #   | Issue                                                              | Resolve In | Status |
| --- | ------------------------------------------------------------------ | ---------- | ------ |
| H3  | Mock bridge adapter typed interface                                | TH2        | [ ]    |
| H4  | "retry() is for infrastructure only" TSDoc                         | B6c        | [ ]    |
| H5  | TSDoc `@example` tag in quality gate                               | B11        | [ ]    |
| M1  | Selector parser depth limit                                        | B9a        | [ ]    |
| M2  | OTel exporter-specific validation                                  | B5a        | [ ]    |
| M3  | WalkMe pattern disclaimer in constants                             | B6a        | [ ]    |
| M4  | Config loader: `{}` input populates all defaults                   | B3b-t      | [ ]    |
| M5  | Matcher error code for null control                                | B10a       | [ ]    |
| M6  | RecordReplay minimum UI5 version docs                              | B8a        | [ ]    |
| M7  | `skipStabilityWait` precedence (per-call > selectors > top)        | B6b        | [ ]    |
| M8  | Deduplicate `controlDiscoveryTimeout` / `selectors.defaultTimeout` | B3a        | [ ]    |
| M9  | schema.test.ts: enumerate remaining 10 test cases                  | B3a-t      | [ ]    |
| M10 | loader.test.ts: enumerate remaining 3 test cases                   | B3b-t      | [ ]    |
| M11 | pino mock: use `vi.mock('pino')` inline                            | B4b        | [ ]    |
| M12 | mock-bridge vi.fn() returns undefined, not throws                  | TH2        | [ ]    |
| M13 | Move `serializeSelectorForBrowser()` from selectors.ts to parser   | B9a        | [ ]    |
| V15 | Selector parser edge cases (Unicode, `=` in values)                | B9a        | [ ]    |
| V16 | `waitForUI5Bootstrap` default timeout in signature                 | B6b        | [ ]    |
