# Master Action List -- Praman v1.0 Audit Remediation

**Audit Date:** 2026-02-27
**Last Updated:** 2026-02-27
**Source:** Consolidated from Parts 1-5 of the Praman comprehensive audit
**Status Key:** Open | In Progress | Done | Closed (Already Exists)

---

## Priority Definitions

| Priority | Meaning                                          | Target              |
| -------- | ------------------------------------------------ | ------------------- |
| **P0**   | Blocker -- prevents production use               | Immediate           |
| **P1**   | Must-fix -- significant impact on AI agent UX    | Before next release |
| **P2**   | Should-fix -- improves quality, reduces friction | Within 2 releases   |
| **P3**   | Nice-to-have -- polish and completeness          | Backlog             |
| **P4**   | Future -- post-GA enhancements                   | Next major version  |

---

## Summary

| Priority  | Total  | Done   | Closed | Open (Code) | Open (Doc) |
| --------- | ------ | ------ | ------ | ----------- | ---------- |
| P0        | 0      | --     | --     | --          | --         |
| P1        | 6      | 4      | 1      | 1           | 0          |
| P2        | 14     | 8      | 3      | 1           | 2          |
| P3        | 15     | 10     | 1      | 4           | 0          |
| P4        | 6      | 3      | 0      | 3           | 0          |
| **Total** | **41** | **25** | **5**  | **9**       | **2**      |

**25 Done + 5 Closed = 30 resolved. 11 remaining (9 code + 2 doc).**

---

## P1 -- Must Fix (6 items)

### ACT-001: Build `praman-mcp-server` package

- **Source:** Part 4 (Framework Integration), 4.1
- **Finding:** Path B (runtime orchestration) for all agentic frameworks is blocked by the absence of an MCP server.
- **Action:** Implement `praman-mcp-server` as a separate npm package. See [MCP-WRAPPER-ROADMAP.md](MCP-WRAPPER-ROADMAP.md).
- **Effort:** 4-6 weeks
- **Impact:** Unlocks runtime orchestration for all 5 external agentic frameworks simultaneously
- **Status:** **Open (Code)**

### ACT-002: Add custom matchers section to AGENTS.md

- **Source:** Part 2 (Operability), 2.2.10
- **Action:** Add a "Custom Matchers" section to AGENTS.md with signature, parameters, and one example per matcher.
- **Status:** **Done** -- Added 10 matchers with signatures, examples, and usage notes to AGENTS.md

### ACT-003: Document `btpWorkZone` fixture in AGENTS.md

- **Source:** Part 2 (Operability), 2.4.5
- **Action:** (a) Add `btpWorkZone` to AGENTS.md fixture table. (b) Add BTP multi-tenant example.
- **Status:** **Done** -- (a) Row added to AGENTS.md fixture table. (b) `examples/btp-multi-tenant.spec.ts` + `docs/docs/examples/btp-multi-tenant.md` created.

### ACT-004: Add OData CRUD Docusaurus example

- **Source:** Part 5 (Documentation), GAP-E1
- **Action:** Add `examples/odata-crud.ts` and corresponding Docusaurus example page.
- **Status:** **Done** -- `examples/odata-crud.spec.ts` (277 lines) + `docs/docs/examples/odata-crud.md` (200 lines) created.

### ACT-005: Add Fiori Elements Docusaurus example

- **Source:** Part 5 (Documentation), GAP-E2
- **Action:** Add `examples/fiori-elements.ts` with List Report and Object Page patterns.
- **Status:** **Done** -- `examples/fiori-elements.spec.ts` (270 lines) + `docs/docs/examples/fiori-elements.md` (190 lines) created.

### ACT-006: Create Troubleshooting & FAQ guide

- **Source:** Part 5 (Documentation), GAP-G1
- **Action:** Create `docs/guides/troubleshooting.md`.
- **Status:** **Closed (Already Exists)** -- `docs/docs/guides/debugging.md` (313 lines) already covers troubleshooting, error codes, and FAQ patterns.

---

## P2 -- Should Fix (14 items)

### ACT-007: Add Azure Playwright config section

- **Source:** Part 2 (Operability), 2.4.8
- **Action:** Add section to docs confirming bridge works in Azure cloud browsers with config example.
- **Status:** **Done** -- Added "Praman-Specific Azure Playwright Configuration" section (~56 lines) to `docs/docs/guides/docker-cicd.md`.

### ACT-008: Document fixture composition chain

- **Source:** Part 2 (Operability), 2.5.4
- **Action:** Add fixture composition diagram and `test.extend()` chaining rules to CONTRIBUTING.md.
- **Status:** **Closed (Already Exists)** -- `docs/docs/guides/fixture-composition.md` (184 lines) already covers the mergeTests() chain, dependency tree, and extension patterns.

### ACT-009: Document bridge adapter contract

- **Source:** Part 2 (Operability), 2.5.5
- **Action:** Add `BridgeAdapter` interface specification and serialization requirements.
- **Status:** **Closed (Already Exists)** -- `docs/docs/guides/bridge-internals.md` (230 lines) already documents the bridge adapter contract, serialization rules, and injection lifecycle.

### ACT-010: Add Intent API example

- **Source:** Part 5 (Documentation), GAP-E3
- **Action:** Add `examples/intent-api.ts` with fill/assert/click patterns.
- **Status:** **Done** -- `examples/intent-api.spec.ts` (322 lines) + `docs/docs/examples/intent-api.md` (216 lines) created.

### ACT-011: Add Vocabulary discovery example

- **Source:** Part 5 (Documentation), GAP-E4
- **Action:** Add `examples/vocabulary.ts` showing vocabulary loading and fuzzy matching.
- **Status:** **Done** -- `examples/vocabulary-discovery.spec.ts` (284 lines) + `docs/docs/examples/vocabulary-discovery.md` (206 lines) created.

### ACT-012: Add Reporter configuration example

- **Source:** Part 5 (Documentation), GAP-E5
- **Action:** Add `examples/reporters.ts` showing reporter setup.
- **Status:** **Closed (Already Exists)** -- `docs/docs/guides/reporters.md` (224 lines) already covers all reporter configuration with inline examples.

### ACT-013: Add multi-tenant auth example

- **Source:** Part 5 (Documentation), GAP-E6
- **Action:** Add `examples/btp-multi-tenant.ts` with tenant switching and session isolation.
- **Status:** **Done** -- Covered by ACT-003(b). `examples/btp-multi-tenant.spec.ts` (220 lines) + `docs/docs/examples/btp-multi-tenant.md` (151 lines).

### ACT-014: Add Smart Controls example

- **Source:** Part 5 (Documentation), GAP-E7
- **Action:** Add `examples/smart-controls.ts`.
- **Status:** **Closed (Already Exists)** -- `docs/docs/guides/sap-control-cookbook.md` (477 lines) already has SmartField, SmartTable, SmartForm, and inner control extraction examples.

### ACT-015: Create Test Data Management guide

- **Source:** Part 5 (Documentation), GAP-G2
- **Action:** Create `docs/guides/test-data-management.md`.
- **Status:** **Done** -- `docs/docs/guides/test-data-management.md` (142 lines) created with testData fixture, OData entity creation, and cleanup patterns.

### ACT-016: Create Parallel Execution & Sharding guide

- **Source:** Part 5 (Documentation), GAP-G3
- **Action:** Create `docs/guides/parallel-execution.md`.
- **Status:** **Done** -- `docs/docs/guides/parallel-execution.md` (128 lines) created with fullyParallel config, worker isolation, and shard-based CI setup.

### ACT-017: Set `onBrokenLinks` to `throw`

- **Source:** Part 5 (Documentation), GAP-I2
- **Action:** Set `onBrokenLinks: 'throw'` in `docusaurus.config.ts`.
- **Status:** **Done** -- Changed from `'warn'` to `'throw'`.

### ACT-018: Verify search functionality

- **Source:** Part 5 (Documentation), GAP-I3
- **Action:** Verify search works for key queries. Fix indexing if needed.
- **Status:** **Done** -- Verified: `@easyops-cn/docusaurus-search-local` active with `indexDocs: true`, `indexPages: true`, 5MB search-index.json generated. No changes needed.

### ACT-019: Fix baseUrl mismatch in Docusaurus

- **Source:** Part 5 (Documentation), GAP-I1
- **Action:** Verify `baseUrl` matches deployment URL.
- **Status:** **Done** -- Verified: `baseUrl: '/playwright-praman/'` correctly matches GitHub Pages URL `praman.zestest.in`. No changes needed.

### ACT-020: Auto-generate OpenAI function-calling schemas from Zod

- **Source:** Part 4 (Framework Integration), Priority 4
- **Action:** Use `zod-to-json-schema` to generate function-calling schemas. Ship as `./schemas/` export.
- **Effort:** 1 week
- **Status:** **Open (Code)**

---

## P3 -- Nice to Have (15 items)

### ACT-021: Replace ~10 type assertions with runtime guards

- **Source:** Part 1 (Implementation), 1.1.4
- **Action:** Identify the 10 candidates and replace with runtime checks.
- **Effort:** 4 hours
- **Status:** **Open (Code)**

### ACT-022: Remove dead exports `MAX_CONTEXT_CHARS` and `MAX_CONTEXT_CONTROLS`

- **Source:** Codebase exploration
- **Action:** Remove unused exports or add consumers.
- **Effort:** 15 minutes
- **Status:** **Open (Code)**

### ACT-023: Create Custom Control Extension guide

- **Source:** Part 5 (Documentation), GAP-G4
- **Action:** Create `docs/guides/custom-controls.md`.
- **Status:** **Done** -- `docs/docs/guides/custom-controls.md` (140 lines) created.

### ACT-024: Create Localization & i18n Testing guide

- **Source:** Part 5 (Documentation), GAP-G5
- **Action:** Create `docs/guides/i18n-testing.md`.
- **Status:** **Done** -- `docs/docs/guides/i18n-testing.md` (153 lines) created.

### ACT-025: Create Security Testing Patterns guide

- **Source:** Part 5 (Documentation), GAP-G6
- **Action:** Create `docs/guides/security-testing.md`.
- **Status:** **Done** -- `docs/docs/guides/security-testing.md` (147 lines) created.

### ACT-026: Create WebSocket & Real-Time Testing guide

- **Source:** Part 5 (Documentation), GAP-G7
- **Action:** Create `docs/guides/websocket-testing.md`.
- **Status:** **Done** -- `docs/docs/guides/websocket-testing.md` (146 lines) created.

### ACT-027: Add ADR: Dual ESM+CJS Decision

- **Source:** Part 5 (Documentation), GAP-A1
- **Action:** Write ADR documenting why dual ESM+CJS output was chosen.
- **Status:** **Done** -- `docs/docs/decisions/adr-dual-esm-cjs.md` (108 lines) created.

### ACT-028: Add ADR: Bridge Injection Strategy

- **Source:** Part 5 (Documentation), GAP-A2
- **Action:** Write ADR documenting bridge injection via `page.evaluate()` vs alternatives.
- **Status:** **Done** -- `docs/docs/decisions/adr-bridge-injection.md` (114 lines) created.

### ACT-029: Add Changelog page to Docusaurus

- **Source:** Part 5 (Documentation), GAP-P1
- **Action:** Add CHANGELOG.md as a Docusaurus page.
- **Status:** **Done** -- `docs/docs/changelog.md` (43 lines) created and added to sidebar.

### ACT-030: Add Security Policy page to Docusaurus

- **Source:** Part 5 (Documentation), GAP-P2
- **Action:** Add SECURITY.md as a Docusaurus page.
- **Status:** **Done** -- `docs/docs/security.md` (89 lines) created and added to sidebar.

### ACT-031: Enable doc versioning

- **Source:** Part 5 (Documentation), GAP-I4
- **Action:** Configure Docusaurus versioning for v1.x.
- **Status:** **Done** -- Added `lastVersion: 'current'` and `versions: { current: { label: '1.x', badge: true } }` to docusaurus.config.ts.

### ACT-032: Verify sitemap generation

- **Source:** Part 5 (Documentation), GAP-I5
- **Action:** Verify `sitemap.xml` is generated.
- **Status:** **Done** -- Verified: `@docusaurus/plugin-sitemap` active via classic preset. No changes needed.

### ACT-033: Add persistent AgenticCheckpoint storage

- **Source:** Part 4 (Framework Integration), 4.7
- **Action:** Add file-based checkpoint save/restore for long-running agentic sessions.
- **Effort:** 1 week
- **Status:** **Open (Code)**

### ACT-034: Add LLM retry logic with exponential backoff

- **Source:** Part 4 (Framework Integration), 4.7
- **Action:** Add exponential backoff + jitter to provider call functions.
- **Effort:** 2 days
- **Status:** **Open (Code)**

### ACT-035: Add streaming support for LLM calls

- **Source:** Part 4 (Framework Integration), 4.7
- **Action:** Add streaming option to `callAnthropic()` and `callOpenAI()` providers.
- **Effort:** 3 days
- **Status:** **Open (Code)**

---

## P4 -- Future / Post-GA (6 items)

### ACT-036: Add ADR: Proxy Pattern

- **Source:** Part 5 (Documentation), GAP-A3
- **Action:** Write ADR for JavaScript Proxy-based ControlProxy pattern.
- **Status:** **Done** -- `docs/docs/decisions/adr-proxy-pattern.md` (118 lines) created.

### ACT-037: Add ADR: Fixture Composition

- **Source:** Part 5 (Documentation), GAP-A4
- **Action:** Write ADR for mergeTests() fixture composition pattern.
- **Status:** **Done** -- `docs/docs/decisions/adr-fixture-composition.md` (131 lines) created.

### ACT-038: Enable Docusaurus blog

- **Source:** Part 5 (Documentation), GAP-P3
- **Action:** Enable blog plugin for release announcements.
- **Status:** **Done** -- Blog config added to docusaurus.config.ts, navbar Blog item added, `blog/2026-02-27-v1-release.md` welcome post created.

### ACT-039: Add dynamic token budget management

- **Source:** Part 4 (Framework Integration), 4.7
- **Action:** Add token counting and dynamic budget allocation per model.
- **Effort:** 1 week
- **Status:** **Open (Code)**

### ACT-040: OpenTelemetry real SDK initialization

- **Source:** Part 1 (Implementation), 1.6 (deferred by design)
- **Action:** Initialize real OpenTelemetry SDK with span export to configured endpoint.
- **Effort:** 1 week
- **Status:** **Open (Code)** (tracked as M2)

### ACT-041: Config file loading via `import()`

- **Source:** Part 1 (Implementation), 1.3 (deferred by design)
- **Action:** Add `praman.config.ts` file loading via dynamic `import()`.
- **Effort:** 3 days
- **Status:** **Open (Code)** (tracked as M2)

---

## Effort Summary (Remaining Only)

| Priority  | Remaining  | Type | Estimated Effort        |
| --------- | ---------- | ---- | ----------------------- |
| P1        | 1          | Code | ~4-6 weeks (MCP server) |
| P2        | 1          | Code | ~1 week                 |
| P2        | 0          | Doc  | --                      |
| P3        | 4          | Code | ~2-3 weeks              |
| P4        | 3          | Code | ~2-3 weeks              |
| **Total** | **9 code** |      | **~9-13 weeks**         |

---

## Integration Verification

All documentation files have been verified as integrated with Docusaurus:

| System                        | Status     | Details                                                          |
| ----------------------------- | ---------- | ---------------------------------------------------------------- |
| Sidebar (guides)              | Integrated | `autogenerated` dirName picks up all 6 new guides                |
| Sidebar (examples)            | Integrated | `autogenerated` dirName picks up all 5 new examples              |
| Sidebar (decisions)           | Integrated | `autogenerated` dirName picks up all 4 new ADRs                  |
| Sidebar (changelog, security) | Integrated | Explicitly added to `docsSidebar` array                          |
| llms.txt / llms-full.txt      | Integrated | 6 new guides + changelog + security added to `includeOrder`      |
| llms-quickstart.txt           | Integrated | 6 new guides added to `includePatterns` (18 docs total)          |
| llms-sap-testing.txt          | Integrated | 5 new examples added to `includePatterns` (25 docs total)        |
| llms-architecture.txt         | Integrated | New ADRs auto-included via `decisions/*` pattern (17 docs total) |
| Blog                          | Integrated | Blog config enabled, navbar item added, welcome post created     |
| Search                        | Integrated | Local search indexes all new pages (80 total docs)               |
| Build validation              | Passed     | `npm run build` succeeds with `onBrokenLinks: 'throw'`           |

---

_Generated from the Praman v1.0 Comprehensive Audit by Claude Opus 4.6 on 2026-02-27._
_Updated with documentation remediation results on 2026-02-27._
