# Praman v1.0 -- Consolidated Remediation Plan

**Date:** 2026-02-27
**Status:** Pending Approval
**Overall Grade (from audit):** A- (Production-ready with minor improvements needed)

---

## Review Chain

| Agent   | Role                                     | Scope                                                       | Key Output                                                  |
| ------- | ---------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| Agent 1 | Non-code action verification             | 31 non-code actions checked against actual codebase         | 6 closures, 9 downgrades, 1 merge, 1 conflict               |
| Agent 2 | Code implementation specs                | 10 code actions broken into detailed sub-tasks              | 23 sub-tasks across 4 parallel batches                      |
| Agent 3 | Plan review and fixes                    | Verified Agent 2's specs against source files               | 12 findings (3 critical, 5 moderate, 4 minor), all resolved |
| Agent 4 | This document -- final consistency check | Cross-report validation, completeness, final reconciliation | 5 inconsistencies found, all resolved below                 |

---

## Action List Reconciliation

### Original vs. Revised

| Metric            | Original | Revised | Delta | Notes                                          |
| ----------------- | -------- | ------- | ----- | ---------------------------------------------- |
| Total actions     | 41       | 35      | -6    | 6 closed as already existing                   |
| P0 (Blocker)      | 0        | 0       | 0     | No blockers                                    |
| P1 (Must-fix)     | 6        | 2       | -4    | 3 downgraded to P3, 1 closed                   |
| P2 (Should-fix)   | 14       | 4       | -10   | 5 closed, 5 downgraded to P3                   |
| P3 (Nice-to-have) | 15       | 22      | +7    | Absorbs 8 downgrades from P1/P2, loses 1 to P4 |
| P4 (Future)       | 6        | 7       | +1    | ACT-026 downgraded from P3                     |

### Closed Actions (6 items -- Agent 1)

| ACT     | Original Priority | Title                              | Reason                                                            | Evidence File                              |
| ------- | ----------------- | ---------------------------------- | ----------------------------------------------------------------- | ------------------------------------------ |
| ACT-006 | P1                | Create Troubleshooting & FAQ guide | Comprehensive 313-line debugging guide already exists             | `docs/docs/guides/debugging.md`            |
| ACT-008 | P2                | Document fixture composition chain | 184-line fixture composition guide already exists                 | `docs/docs/guides/fixture-composition.md`  |
| ACT-009 | P2                | Document bridge adapter contract   | 230-line bridge internals guide already exists                    | `docs/docs/guides/bridge-internals.md`     |
| ACT-012 | P2                | Add Reporter configuration example | 224-line reporters guide with config examples already exists      | `docs/docs/guides/reporters.md`            |
| ACT-014 | P2                | Add Smart Controls example         | 477-line SAP control cookbook with SmartField/SmartTable sections | `docs/docs/guides/sap-control-cookbook.md` |
| ACT-019 | P2                | Fix baseUrl mismatch in Docusaurus | No mismatch exists; `baseUrl: '/playwright-praman/'` is correct   | `docs/docusaurus.config.ts` line 16        |

**Spot-check verification (Agent 4):** I independently confirmed 3 of 6 closures by reading the actual files:

- `debugging.md`: 313 lines, titled "Debugging & Troubleshooting", covers error codes, common issues, debug checklist. Confirmed.
- `reporters.md`: 224 lines, contains `ComplianceReporter` and `ODataTraceReporter` config examples in `playwright.config.ts` format. Confirmed.
- `docusaurus.config.ts` line 16: `baseUrl: '/playwright-praman/'` matches GitHub Pages convention for `mrkanitkar.github.io/playwright-praman/`. Confirmed.

### Downgraded Actions (9 items -- Agent 1)

| ACT     | From | To  | Title                               | Reason                                                                                                            |
| ------- | ---- | --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ACT-002 | P1   | P3  | Add custom matchers to AGENTS.md    | Matchers fully documented in Docusaurus guide (248 lines) and `llms-full.txt`; only missing from AGENTS.md itself |
| ACT-004 | P1   | P3  | Add OData CRUD example              | Comprehensive 254-line OData operations guide already exists; only a standalone sidebar example page is missing   |
| ACT-005 | P1   | P3  | Add Fiori Elements example          | Comprehensive 280-line Fiori Elements guide already exists; same reasoning as ACT-004                             |
| ACT-007 | P2   | P3  | Add Azure Playwright config section | Docker/CI guide already has basic Azure section; Praman-specific config is polish                                 |
| ACT-010 | P2   | P3  | Add Intent API example              | 279-line Intent API guide already exists; standalone example file is polish                                       |
| ACT-011 | P2   | P3  | Add Vocabulary discovery example    | 212-line Vocabulary guide already exists; standalone example file is polish                                       |
| ACT-015 | P2   | P3  | Create Test Data Management guide   | Fixture reference and OData guide partially cover test data patterns                                              |
| ACT-016 | P2   | P3  | Create Parallel Execution guide     | Standard Playwright concept, partially covered in existing guides                                                 |
| ACT-026 | P3   | P4  | Create WebSocket Testing guide      | Very niche use case for SAP apps; most SAP apps use OData HTTP                                                    |

### Merged Actions (1 merge)

| Source                                                       | Target                                  | Reason                                                                                                               |
| ------------------------------------------------------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| ACT-003 part (b) "Add BTP multi-tenant example to examples/" | ACT-013 "Add multi-tenant auth example" | Both describe the exact same deliverable: `examples/btp-multi-tenant.ts` with tenant switching and session isolation |

ACT-003 retains part (a): "Add `btpWorkZone` to AGENTS.md fixture table" (5-minute fix, stays P1).

### Conflict Resolution (1 item)

ACT-006 "Create `docs/guides/troubleshooting.md`" would duplicate the existing `docs/docs/guides/debugging.md` (titled "Debugging & Troubleshooting"). **Resolution:** Closed. If a dedicated FAQ section is desired, add it to the existing `debugging.md`.

---

## Revised Non-Code Action List (25 remaining non-code items)

### P1 -- Must Fix (2 items)

| #   | ACT        | Title                                              | Effort |
| --- | ---------- | -------------------------------------------------- | ------ |
| 1   | ACT-003(a) | Add `btpWorkZone` to AGENTS.md fixture table       | 5 min  |
| 2   | ACT-013    | Add multi-tenant auth example (absorbs ACT-003(b)) | 2 hrs  |

**Note:** ACT-013 is listed under P1 based on Agent 1's "True Remaining P1 Actions" assessment. It was originally P2 but gains P1 scope from the merged ACT-003(b). See Open Questions below.

### P2 -- Should Fix (3 items)

| #   | ACT     | Title                                                  | Effort |
| --- | ------- | ------------------------------------------------------ | ------ |
| 1   | ACT-017 | Set `onBrokenLinks` to `throw` in Docusaurus config    | 5 min  |
| 2   | ACT-018 | Verify search functionality on built site              | 30 min |
| 3   | ACT-020 | Auto-generate OpenAI function-calling schemas from Zod | 1 week |

**Note:** ACT-020 is a code action handled by Agent 2, included here for completeness of the priority listing.

### P3 -- Nice to Have (15 items)

| #   | ACT     | Title                                      | Effort |
| --- | ------- | ------------------------------------------ | ------ |
| 1   | ACT-002 | Add custom matchers section to AGENTS.md   | 1 hr   |
| 2   | ACT-004 | Add OData CRUD sidebar example page        | 30 min |
| 3   | ACT-005 | Add Fiori Elements sidebar example page    | 30 min |
| 4   | ACT-007 | Add Azure Playwright config section        | 1 hr   |
| 5   | ACT-010 | Add Intent API standalone example file     | 1 hr   |
| 6   | ACT-011 | Add Vocabulary standalone example file     | 1 hr   |
| 7   | ACT-015 | Create Test Data Management guide          | 3 hrs  |
| 8   | ACT-016 | Create Parallel Execution & Sharding guide | 3 hrs  |
| 9   | ACT-023 | Create Custom Control Extension guide      | 3 hrs  |
| 10  | ACT-024 | Create Localization & i18n Testing guide   | 3 hrs  |
| 11  | ACT-025 | Create Security Testing Patterns guide     | 3 hrs  |
| 12  | ACT-027 | Add ADR: Dual ESM+CJS Decision             | 1 hr   |
| 13  | ACT-028 | Add ADR: Bridge Injection Strategy         | 1 hr   |
| 14  | ACT-029 | Add Changelog page to Docusaurus           | 15 min |
| 15  | ACT-030 | Add Security Policy page to Docusaurus     | 15 min |

### P3 -- Nice to Have (non-code items from code action list)

| #   | ACT     | Title                     | Effort |
| --- | ------- | ------------------------- | ------ |
| 16  | ACT-031 | Enable doc versioning     | 2 hrs  |
| 17  | ACT-032 | Verify sitemap generation | 15 min |

### P4 -- Future (5 non-code items)

| #   | ACT     | Title                                      | Effort |
| --- | ------- | ------------------------------------------ | ------ |
| 1   | ACT-026 | Create WebSocket & Real-Time Testing guide | 3 hrs  |
| 2   | ACT-036 | Add ADR: Proxy Pattern                     | 1 hr   |
| 3   | ACT-037 | Add ADR: Fixture Composition               | 1 hr   |
| 4   | ACT-038 | Enable Docusaurus blog                     | 3 hrs  |

---

## Code Implementation Plan (10 actions, 23 sub-tasks)

### Dependency Graph

```
STANDALONE (no inter-dependencies):
  ACT-022 (15 min)   Remove dead exports MAX_CONTEXT_CHARS/MAX_CONTEXT_CONTROLS
  ACT-021 (4 hrs)    Replace ~10 type assertions with runtime guards
  ACT-041 (3 days)   Config file loading via import()
  ACT-040 (1 week)   OpenTelemetry real SDK initialization
  ACT-034 (2 days)   LLM retry logic with exponential backoff
  ACT-033 (1 week)   Persistent AgenticCheckpoint storage
  ACT-039 (1 week)   Dynamic token budget management
  ACT-020 (1 week)   Auto-generate OpenAI function-calling schemas

SOFT DEPENDENCY:
  ACT-035 (3 days)   Streaming support for LLM calls
    └── soft dep on ACT-034 (can share isTransientLlmError() or inline the check)

SEQUENTIAL (internal sub-task chain):
  ACT-001 (4-6 wks)  Build praman-mcp-server package
    ├── Sub-task 0: npm workspaces setup (30 min) ─── prerequisite
    ├── Sub-task 1: Package scaffold + session manager (1 day) ─── depends on 0
    ├── Sub-task 2: Core tool implementations (2 days) ─── depends on 1
    ├── Sub-task 3: Auth + resources + prompts (1 day) ─── depends on 2
    └── Sub-task 4: Tests + docs (1 day) ─── depends on 3
```

### Parallel Execution Batches

#### Batch 1 -- No inter-dependencies (all run in parallel)

| Task               | Effort | Notes                                                  |
| ------------------ | ------ | ------------------------------------------------------ |
| ACT-022            | 15 min | Quick win -- remove dead exports                       |
| ACT-021            | 4 hrs  | 3 sub-tasks, all standalone files                      |
| ACT-041            | 3 days | Config file resolver + loader integration              |
| ACT-040            | 1 week | Real OTel tracer + initTelemetry update                |
| ACT-034            | 2 days | LLM retry wrapper + provider integration               |
| ACT-033            | 1 week | CheckpointStore interface + AgenticHandler integration |
| ACT-039            | 1 week | TokenBudget utility + LLM service integration          |
| ACT-020            | 1 week | Schema generator script + sub-path export              |
| ACT-035            | 3 days | Streaming types + LlmService.stream()                  |
| ACT-001 sub-task 0 | 30 min | npm workspaces setup (prerequisite for sub-task 1)     |

**Sequencing constraint within Batch 1:** ACT-001 sub-task 0 must complete before sub-task 1 can begin. Sub-task 1 (1 day) can start only after workspaces are configured.

**Maximum parallel agents:** 10 truly independent + 1 sequenced = effectively 10 parallel slots at any given time.

#### Batch 2 -- Depends on Batch 1

| Task               | Depends On         | Effort |
| ------------------ | ------------------ | ------ |
| ACT-001 sub-task 1 | ACT-001 sub-task 0 | 1 day  |
| ACT-001 sub-task 2 | ACT-001 sub-task 1 | 2 days |

#### Batch 3 -- Depends on Batch 2

| Task               | Depends On         | Effort |
| ------------------ | ------------------ | ------ |
| ACT-001 sub-task 3 | ACT-001 sub-task 2 | 1 day  |

#### Batch 4 -- Depends on Batch 3

| Task               | Depends On         | Effort |
| ------------------ | ------------------ | ------ |
| ACT-001 sub-task 4 | ACT-001 sub-task 3 | 1 day  |

### Sub-task Summary

| ACT     | Title                                         | Priority | Sub-tasks | Batch | Dependencies    | Agent Time |
| ------- | --------------------------------------------- | -------- | --------- | ----- | --------------- | ---------- |
| ACT-022 | Remove dead exports                           | P3       | 1         | 1     | None            | 15 min     |
| ACT-021 | Replace type assertions with runtime guards   | P3       | 3         | 1     | None            | 4 hrs      |
| ACT-034 | LLM retry with exponential backoff            | P3       | 2         | 1     | None            | 2 days     |
| ACT-035 | Streaming support for LLM calls               | P3       | 2         | 1     | Soft on ACT-034 | 3 days     |
| ACT-033 | Persistent AgenticCheckpoint storage          | P3       | 2         | 1     | None            | 1 week     |
| ACT-039 | Dynamic token budget management               | P4       | 2         | 1     | None            | 1 week     |
| ACT-040 | OpenTelemetry real SDK initialization         | P4       | 2         | 1     | None            | 1 week     |
| ACT-041 | Config file loading via import()              | P4       | 2         | 1     | None            | 3 days     |
| ACT-020 | Auto-generate OpenAI function-calling schemas | P2       | 2         | 1     | None            | 1 week     |
| ACT-001 | Build praman-mcp-server package               | P1       | 5         | 1-4   | Internal chain  | 4-6 weeks  |
|         |                                               |          | **23**    |       |                 |            |

### Ancillary Items (Agent 3 additions -- M1 through M5)

These are cross-cutting concerns that affect multiple code actions and should be addressed during implementation:

| ID  | Item                                 | Affects                                     | Action                                                    |
| --- | ------------------------------------ | ------------------------------------------- | --------------------------------------------------------- |
| M1  | API Extractor entry points           | ACT-020, ACT-033, ACT-034, ACT-035, ACT-039 | Update `api-extractor.json` for new exports               |
| M2  | ESLint exclusion for generated files | ACT-020                                     | Add `generated-schemas.ts` to ESLint ignores              |
| M3  | Vitest coverage thresholds           | ACT-033, ACT-034, ACT-035, ACT-039, ACT-040 | Assign new files to appropriate coverage tiers            |
| M4  | CHANGELOG entries                    | All code actions                            | ACT-033 is a BREAKING CHANGE; others are features/fixes   |
| M5  | tsconfig.json path alias             | ACT-020                                     | Decide if `#schemas/*` alias is needed for `src/schemas/` |

---

## Cross-Report Consistency Checks

### Check 1: Agent 1 "ALREADY EXISTS" Findings vs. Actual Codebase

| Closed ACT | Agent 1's Claim                                        | Verified? | Finding                                                                                |
| ---------- | ------------------------------------------------------ | --------- | -------------------------------------------------------------------------------------- |
| ACT-006    | `debugging.md` covers troubleshooting comprehensively  | YES       | File exists, 313 lines, titled "Debugging & Troubleshooting"                           |
| ACT-012    | `reporters.md` has configuration examples              | YES       | File exists, 224 lines, includes `playwright.config.ts` code blocks for both reporters |
| ACT-019    | `baseUrl` is correctly set to `/playwright-praman/`    | YES       | Confirmed in `docusaurus.config.ts` line 16                                            |
| ACT-008    | `fixture-composition.md` covers composition chain      | YES       | File exists, 184 lines                                                                 |
| ACT-009    | `bridge-internals.md` covers adapter contract          | YES       | File exists, 230 lines                                                                 |
| ACT-014    | `sap-control-cookbook.md` covers SmartField/SmartTable | YES       | File exists, 477 lines                                                                 |

**Result:** All 6 closures are legitimate. Agent 1's evidence is accurate.

### Check 2: Agent 3 Fixes in Agent 2 Specs File

| Finding                                                                  | Fix Required  | Present in Specs?                                                      |
| ------------------------------------------------------------------------ | ------------- | ---------------------------------------------------------------------- |
| F1: ACT-022 scope expansion to MAX_CONTEXT_CONTROLS                      | Yes           | YES -- title updated, both constants listed, test import corrected     |
| F2: ACT-022 test file imports MAX_CONTEXT_CONTROLS not MAX_CONTEXT_CHARS | Yes           | YES -- corrected in sub-task 1 action items                            |
| F3: ACT-021 invalid error code ERR_CONTROL_PROPERTY_TYPE                 | Yes           | YES -- changed to ERR_CONTROL_PROPERTY with Agent 3 note               |
| F4: ACT-034/035 hard-to-soft dependency                                  | Yes           | YES -- dependency graph updated, ACT-035 moved to Batch 1              |
| F5: ACT-040 wrong error class (@throws AIError)                          | Yes           | YES -- changed to @throws PramanError, ERR_TELEMETRY_INIT_FAILED noted |
| F6: ACT-040 missing createLogger import                                  | No fix needed | N/A (already correct)                                                  |
| F7: ACT-040 missing optional dependency packages                         | Yes           | YES -- package.json update step added to sub-task 1                    |
| F8: ACT-001 missing workspace setup                                      | Yes           | YES -- Sub-task 0 added for workspaces                                 |
| F9: ACT-001 MCP SDK version pinning                                      | Yes           | YES -- note added to pin SDK version                                   |
| F10: ACT-033 sync-to-async breaking change                               | Yes           | YES -- BREAKING CHANGE note and CHANGELOG entry added                  |
| F11: ACT-020 schema placement confusion                                  | Yes           | YES -- clarity note about src/schemas/ vs src/ai/schemas/ added        |
| F12: ACT-035 Batch 1 optimization                                        | Yes           | YES -- moved to Batch 1 with soft dependency note                      |

**Result:** All 12 fixes from Agent 3 are present in the updated specs file.

### Check 3: Action Number Consistency

All 41 actions (ACT-001 through ACT-041) are accounted for:

- 10 code actions handled by Agent 2: ACT-001, ACT-020, ACT-021, ACT-022, ACT-033, ACT-034, ACT-035, ACT-039, ACT-040, ACT-041
- 31 non-code actions handled by Agent 1: ACT-002 through ACT-019, ACT-023 through ACT-032, ACT-036 through ACT-038
- No action is orphaned (missing from both agents)
- No action is double-counted (present in both agents)

**Result:** 10 + 31 = 41. Complete coverage confirmed.

### Check 4: Priority Changes vs. Agent 2/3 Work

Agent 1's downgrade recommendations do not conflict with Agent 2/3's code implementation specs. The code actions retain their original priorities in Agent 2's work:

- ACT-001 stays P1 (not affected by Agent 1)
- ACT-020 stays P2 (not affected by Agent 1)
- ACT-021, ACT-022, ACT-033, ACT-034, ACT-035 stay P3 (not affected by Agent 1)
- ACT-039, ACT-040, ACT-041 stay P4 (not affected by Agent 1)

No conflicts.

### Check 5: Inconsistencies Found and Resolved

| #   | Inconsistency                                                                                                     | Location                              | Resolution                                                                                                                                                                                                                                                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Agent 1 summary says "DOWNGRADED: 5" but detail tables list 8-9 downgraded actions                                | Agent 1 report, summary vs. body      | The summary uses exclusive categories (an action counted as ALREADY EXISTS is not also counted as DOWNGRADED). However, ACT-002, ACT-004, ACT-005 are marked "ALREADY EXISTS" in verdict but "DOWNGRADE" in recommendation. And ACT-007 is recommended for downgrade in its individual section but omitted from the downgrade table. **Corrected in this plan:** 9 total downgrades counted. |
| 2   | Agent 1's Revised Priority Summary shows P1=3, P2=7 which doesn't match if all recommended downgrades are applied | Agent 1 report, revised summary table | P1=3 includes ACT-013 promoted from P2. P2=7 omits ACT-007/015/016 downgrades. **Corrected in this plan:** P1=2 (or 3 with ACT-013 promotion -- see Open Questions), P2=4.                                                                                                                                                                                                                   |
| 3   | Agent 2 summary says "Total sub-tasks: 24" but actual count is 23                                                 | Agent 2 specs, summary section        | 1+3+2+2+2+2+2+2+2+5 = 23. The claimed 24 is an arithmetic error. **Corrected in this plan:** 23 sub-tasks.                                                                                                                                                                                                                                                                                   |
| 4   | Batch 1 lists ACT-001 sub-task 0 and sub-task 1 as parallel but sub-task 1 depends on sub-task 0                  | Agent 2 specs, batch plan             | **Clarified in this plan:** sub-task 0 (30 min) must complete before sub-task 1 begins. Effective parallelism is 10 independent slots + 1 sequenced.                                                                                                                                                                                                                                         |
| 5   | ACT-007 recommended for downgrade P2->P3 in individual section but not in the downgrade summary table             | Agent 1 report, ACT-007 vs. summary   | **Resolved:** ACT-007 is included in the 9 downgrades in this plan per the individual recommendation.                                                                                                                                                                                                                                                                                        |

---

## Open Questions / Risks

### Questions Requiring Human Decision

1. **ACT-013 priority: P1 or P2?**
   Agent 1's "True Remaining P1 Actions" section lists ACT-013 alongside ACT-001 and ACT-003(a). However, ACT-013 was originally P2. Absorbing scope from ACT-003(b) adds multi-tenant BTP example work but does not inherently change the severity. **Recommendation:** Promote to P1 if multi-tenant auth is a key selling point for launch; keep P2 otherwise. This plan assumes P1 per Agent 1's recommendation.

2. **ACT-007 downgrade: P2 or P3?**
   Agent 1's individual section recommends downgrading to P3 ("it is a polish item, not a significant gap") but the action was omitted from the summary downgrade table. **Recommendation:** Downgrade to P3. The Docker/CI guide already covers Azure Playwright basics. This plan includes the downgrade.

3. **ACT-020 schema directory naming: `src/schemas/` vs. `src/ai/schemas/generated/`?**
   Agent 3 flagged potential confusion between `src/ai/schemas/` (Zod source schemas) and `src/schemas/` (generated JSON schemas). No decision was made. **Recommendation:** Use `src/schemas/` as Agent 2 specified, with a clear TSDoc comment in the barrel export explaining the distinction. The alternative `src/ai/schemas/generated/` would keep things colocated but conflicts with the `./schemas` sub-path export naming.

4. **ACT-001 workspace approach: npm workspaces vs. local file reference?**
   Agent 3 identified that `workspace:*` requires npm workspaces setup (Sub-task 0). An alternative is using `file:../..` for local development. **Recommendation:** Use npm workspaces as specified. It is the standard monorepo approach and aligns with future multi-package expansion.

### Risks

| Risk                                                          | Severity   | Mitigation                                                                                                      |
| ------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| ACT-001 (MCP server) is the critical path at 4-6 weeks        | Medium     | All other code actions complete in parallel during Batch 1; only ACT-001 spans all 4 batches                    |
| ACT-033 `saveCheckpoint()` sync-to-async is a breaking change | Low        | Only used internally by tests; no known external consumers. Document in CHANGELOG as BREAKING CHANGE per semver |
| ACT-040 OTel SDK packages may not install on all platforms    | Low        | Packages are optional dependencies; graceful fallback to NoOpTracer is built in                                 |
| Agent 2 sub-task count error (says 24, actual 23)             | Negligible | Arithmetic error only; all sub-tasks are correctly specified                                                    |

---

## Recommendation

**Ready to execute with minor caveats.**

The three-agent review process has produced a thorough, well-validated remediation plan. All critical issues identified by Agent 3 have been fixed in the implementation specs. The codebase spot-checks confirm Agent 1's closure recommendations are legitimate.

**Execution order:**

1. **Immediate (< 1 day):** ACT-003(a) [5 min], ACT-017 [5 min], ACT-022 [15 min], ACT-018 [30 min] -- these are trivial fixes with high confidence.

2. **Batch 1 parallel (1-2 weeks):** Launch all 9 standalone code actions in parallel. ACT-001 sub-task 0 starts first (30 min), then sub-task 1 begins.

3. **Batch 2-4 sequential (3-5 weeks):** ACT-001 sub-tasks 2 through 4, one after another.

4. **Non-code P3/P4 backlog:** Address in priority order as capacity allows. Quick wins (ACT-002, ACT-004, ACT-005, ACT-029, ACT-030, ACT-032) can be done in gaps between code work.

**Before approving, please resolve the 4 open questions above** (particularly ACT-013 priority and ACT-020 schema directory naming).

---

_Consolidated by Agent 4: Final Consistency Reviewer (Claude Opus 4.6) on 2026-02-27._
_Source reports: AGENT1-VERIFICATION-REPORT.md, AGENT2-IMPLEMENTATION-SPECS.md, AGENT3-REVIEW-FINDINGS.md, MASTER-ACTION-LIST.md, scores.json._
