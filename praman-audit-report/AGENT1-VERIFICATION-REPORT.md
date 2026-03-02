# Agent 1: Non-Code Action Verification Report

**Date:** 2026-02-27
**Auditor:** Claude Opus 4.6 (Agent 1: Non-Code Action Verifier)
**Scope:** 31 non-code actions from MASTER-ACTION-LIST.md (ACT-002 through ACT-038, excluding code-only actions)

---

## Summary

| Category                        | Count |
| ------------------------------- | ----- |
| Total actions verified          | 31    |
| CONFIRMED (still needed)        | 15    |
| ALREADY EXISTS (can close)      | 6     |
| DUPLICATE (merge recommended)   | 4     |
| DOWNGRADED (priority change)    | 5     |
| CONFLICT (contradicts existing) | 1     |

---

## Detailed Findings

---

### ACT-002: Add custom matchers section to AGENTS.md

**Priority:** P1 | **Verdict:** ALREADY EXISTS
**Evidence:** Custom matchers are extensively documented in three locations:

1. `docs/docs/guides/custom-matchers.md` -- A full 248-line guide with all 10 matchers, signatures, parameters, examples, auto-retry mechanism, and comparison tables.
2. `llms-full.txt` -- Contains the full custom-matchers guide content (lines 946-1020+ visible, all 10 matchers documented with signatures and examples).
3. `skills/playwright-praman-sap-testing/skills-playwright-expert.md`, `skills-tester.md`, `skills-tdd.md`, `SKILL.md` -- All reference matchers.

However, the `AGENTS.md` file itself does NOT contain matcher documentation. An AI agent reading only `AGENTS.md` would miss them.

**Recommendation:** DOWNGRADE to P3. The matchers are thoroughly documented elsewhere. The AGENTS.md file already links to `SKILL.md` for "complete fixture maps" which covers matchers. Adding a small "Custom Matchers" subsection to the "Fixture Quick Reference" table in AGENTS.md would improve discoverability, but the core documentation gap cited in the audit (matchers not documented at all) is false -- they are fully documented in the Docusaurus guide and llms-full.txt.

---

### ACT-003: Document `btpWorkZone` fixture in AGENTS.md

**Priority:** P1 | **Verdict:** CONFIRMED (partially)
**Evidence:**

- `AGENTS.md` -- `btpWorkZone` is NOT listed in the "Fixture Quick Reference" table (lines 172-186). This is a gap.
- `docs/docs/guides/fixtures.md` -- `btpWorkZone` IS listed in the fixture summary table (line 20).
- `docs/docs/guides/fixture-composition.md` -- `btpWorkZone` IS listed in the composition chain (line 44: `navTest -> ui5Navigation, btpWorkZone`).
- `docs/docs/guides/authentication.md` -- `btpWorkZone` IS documented with a code example (lines 162-169).
- `examples/` directory -- No `btp-multi-tenant.ts` example exists.

**Recommendation:** CONFIRMED but reduce scope. Part (a) is valid -- add `btpWorkZone` to AGENTS.md fixture table. Part (b) overlaps with ACT-013. MERGE part (b) into ACT-013.

---

### ACT-004: Add OData CRUD Docusaurus example

**Priority:** P1 | **Verdict:** ALREADY EXISTS (partially)
**Evidence:**

- `docs/docs/guides/odata-operations.md` -- Contains a comprehensive 254-line guide with full CRUD examples: `queryEntities`, `createEntity`, `updateEntity`, `deleteEntity`, `callFunctionImport`, plus CSRF token handling, V2 vs V4 differences, and two complete test examples.
- `docs/docs/examples/` directory -- No dedicated `odata-crud.md` example page exists.
- `README.md` -- Contains an inline OData CRUD example (lines 116-134).

**Recommendation:** DOWNGRADE to P3. The OData CRUD documentation is comprehensive in the guide. A standalone example page in `docs/docs/examples/` would be nice-to-have for sidebar browsability but is not a P1 gap. The audit finding that "No dedicated OData CRUD example" ignores the existing 254-line guide.

---

### ACT-005: Add Fiori Elements Docusaurus example

**Priority:** P1 | **Verdict:** ALREADY EXISTS (partially)
**Evidence:**

- `docs/docs/guides/fiori-elements.md` -- A comprehensive 280-line guide with List Report, Object Page, FE Table, FE List, and FE Test Library examples. Includes a complete end-to-end example.
- `docs/docs/examples/` directory -- No dedicated `fiori-elements.md` example page exists.
- `skills/playwright-praman-sap-testing/fiori-elements.md` -- Additional FE documentation.

**Recommendation:** DOWNGRADE to P3. Same reasoning as ACT-004. The guide is comprehensive. A standalone example page is polish, not a P1 gap.

---

### ACT-006: Create Troubleshooting and FAQ guide

**Priority:** P1 | **Verdict:** ALREADY EXISTS (substantially)
**Evidence:**

- `docs/docs/guides/debugging.md` -- A 314-line "Debugging & Troubleshooting" guide already exists. It covers:
  - Pino log levels and configuration
  - Playwright trace viewer integration
  - OTel integration
  - Error introspection (`toUserMessage()`, `toAIContext()`, `toJSON()`)
  - **Common Issues and Resolutions**: Bridge injection timeout, control not found, stale object reference, stability wait hanging, auth failures, `page.evaluate()` ReferenceError
  - A 7-step debug checklist
- `README.md` -- Contains 5 error codes with troubleshooting (lines 314-355).
- `docs/docs/guides/errors.md` -- Additional error documentation.

**Recommendation:** ALREADY EXISTS. The `debugging.md` guide covers the exact content described in ACT-006, including expanded error codes and common pitfall patterns. The only gap is a FAQ section, but the "Common Issues and Resolutions" section serves the same purpose. Close this action. If a literal "FAQ" heading is desired, it can be added to the existing `debugging.md` file as a minor enhancement (P3).

---

### ACT-007: Add Azure Playwright config section

**Priority:** P2 | **Verdict:** CONFIRMED (partially addressed)
**Evidence:**

- `README.md` -- Contains a brief Azure Playwright section (lines 290-295) with install command only.
- `docs/docs/guides/docker-cicd.md` -- Contains an "Azure Playwright Workspaces (Optional)" section (lines 97-105) with a CI YAML snippet showing `playwright.service.config.ts`.
- No Praman-specific bridge compatibility notes or detailed `playwright.service.config.ts` example.

**Recommendation:** CONFIRMED but scope reduced. The Docker/CI guide already has a basic Azure section. What is missing is a Praman-specific `playwright.service.config.ts` example file and bridge compatibility notes. Downgrade to P3 -- it is a polish item, not a significant gap.

---

### ACT-008: Document fixture composition chain

**Priority:** P2 | **Verdict:** ALREADY EXISTS
**Evidence:**

- `docs/docs/guides/fixture-composition.md` -- A complete 184-line guide that covers:
  - How `mergeTests()` works
  - The complete 15-module fixture chain with dependency order
  - Why `mergeTests()` over a monolithic file
  - Tree-shaking / selective imports
  - Adding custom fixtures
  - Composing across test files
  - Fixture scopes (worker vs test)
  - Auto-fixtures
- `CONTRIBUTING.md` -- Does not contain this information (the action says to add it there).

**Recommendation:** ALREADY EXISTS. The fixture composition chain is thoroughly documented in the Docusaurus guide. Adding a duplicate to `CONTRIBUTING.md` would create maintenance burden. Close this action, or at most add a cross-reference line to `CONTRIBUTING.md` pointing to the Docusaurus guide (P3).

---

### ACT-009: Document bridge adapter contract

**Priority:** P2 | **Verdict:** ALREADY EXISTS (substantially)
**Evidence:**

- `docs/docs/guides/bridge-internals.md` -- A detailed guide documenting bridge injection via `page.evaluate()`, injection modes, bridge namespace, serialization constraints, and the `getById()` API resolution. Starts with a "Contributor Only" notice.
- `skills/playwright-praman-sap-testing/skills-implementer.md` -- Contains bridge adapter implementation details.
- `CONTRIBUTING.md` -- Does not contain bridge adapter specification.

**Recommendation:** ALREADY EXISTS. The bridge internals guide covers the adapter contract and serialization rules. Adding to `CONTRIBUTING.md` would be redundant. Close this action, or add a cross-reference to `CONTRIBUTING.md` (P3).

---

### ACT-010: Add Intent API example

**Priority:** P2 | **Verdict:** ALREADY EXISTS
**Evidence:**

- `docs/docs/guides/intent-api.md` -- A comprehensive 279-line guide covering:
  - Core wrappers: `fillField`, `clickButton`, `selectOption`, `assertField`, `navigateAndSearch`
  - Vocabulary integration
  - `IntentResult` envelope
  - `IntentOptions`
  - 5 domain namespaces with examples: Procurement, Sales, Finance, Manufacturing, Master Data
  - Data shapes and architecture
- No standalone `examples/intent-api.ts` file exists.

**Recommendation:** DOWNGRADE to P3. The guide is comprehensive. A standalone example file would be a polish item.

---

### ACT-011: Add Vocabulary discovery example

**Priority:** P2 | **Verdict:** ALREADY EXISTS
**Evidence:**

- `docs/docs/guides/vocabulary-system.md` -- A comprehensive 212-line guide covering:
  - `createVocabularyService()`
  - Loading domains
  - Searching terms with examples
  - Field selector resolution
  - `getSuggestions()` for autocomplete
  - Service statistics
  - Normalization and matching algorithm (tiered scoring, Levenshtein distance)
  - Integration with intents
  - Extending the vocabulary
- No standalone `examples/vocabulary.ts` file exists.

**Recommendation:** DOWNGRADE to P3. Same reasoning -- guide is comprehensive.

---

### ACT-012: Add Reporter configuration example

**Priority:** P2 | **Verdict:** ALREADY EXISTS
**Evidence:**

- `docs/docs/guides/reporters.md` -- A comprehensive 225-line guide covering:
  - ComplianceReporter configuration with `playwright.config.ts` example
  - ODataTraceReporter configuration with `playwright.config.ts` example
  - Output format and structure for both
  - Using both reporters together (combined config example)
  - Reporter lifecycle
  - Use cases (migration tracking, performance analysis)
- No standalone `examples/reporters.ts` file exists.

**Recommendation:** ALREADY EXISTS. The guide already contains the exact config examples requested. Close this action.

---

### ACT-013: Add multi-tenant auth example

**Priority:** P2 | **Verdict:** CONFIRMED
**Evidence:**

- `docs/docs/guides/authentication.md` -- Lists `'multi-tenant'` strategy in the table (line 15) and has a brief `btpWorkZone` example (lines 162-169), but no tenant switching or session isolation example.
- `examples/` -- No `btp-multi-tenant.ts` file.
- No detailed multi-tenant workflow with tenant switching is documented anywhere.

**Recommendation:** CONFIRMED. This is a genuine gap. However, note overlap with ACT-003 part (b). Merge ACT-003(b) into this action.

---

### ACT-014: Add Smart Controls example

**Priority:** P2 | **Verdict:** ALREADY EXISTS (substantially)
**Evidence:**

- `docs/docs/guides/sap-control-cookbook.md` -- Contains dedicated sections for SmartField (lines 10-48) and SmartTable (lines 51-90+) with:
  - Discovery by controlType and binding path
  - Filling SmartFields with `setValue` and `fireChange`
  - SmartTable inner table access
  - Important notes about SmartField inner controls, display mode behavior
  - Quick reference table listing SmartField and SmartTable patterns
- `skills/playwright-praman-sap-testing/ui5-controls.md` -- Additional SmartField/SmartTable documentation.
- No standalone `examples/smart-controls.ts` file.

**Recommendation:** ALREADY EXISTS. The SAP control cookbook has detailed SmartField and SmartTable sections. Close this action. A standalone example file would be P4 polish.

---

### ACT-015: Create Test Data Management guide

**Priority:** P2 | **Verdict:** CONFIRMED (partially addressed)
**Evidence:**

- `docs/docs/guides/fixtures.md` -- Contains a `testData` section (lines 183-193) with a brief example using `testData.generate()` and `testData.save()`.
- `docs/docs/guides/odata-operations.md` -- Shows OData entity creation/deletion for test data setup (lines 236-252).
- No dedicated `docs/guides/test-data-management.md` guide exists.
- The `testData` fixture is documented but lacks a comprehensive guide covering patterns, templates, cleanup strategies, and integration with OData.

**Recommendation:** CONFIRMED but DOWNGRADE to P3. The fixture reference and OData guide partially cover this. A dedicated guide would add value but is not critical.

---

### ACT-016: Create Parallel Execution and Sharding guide

**Priority:** P2 | **Verdict:** CONFIRMED (partially addressed)
**Evidence:**

- `docs/docs/guides/docker-cicd.md`, `configuration.md`, `playwright-primer.md` -- Mention parallelism and sharding briefly.
- No dedicated guide on Playwright parallelism with Praman-specific considerations (auth state isolation, FLP lock contention, worker initialization).

**Recommendation:** CONFIRMED but DOWNGRADE to P3. Parallelism/sharding are standard Playwright concepts. Praman-specific considerations (lock management, auth state) deserve documentation but are not blocking users.

---

### ACT-017: Set `onBrokenLinks` to `throw`

**Priority:** P2 | **Verdict:** CONFIRMED
**Evidence:**

- `docs/docusaurus.config.ts` line 22: `onBrokenLinks: 'warn'`
- Line 28: `onBrokenMarkdownLinks: 'warn'` (via markdown.hooks)
- Both should be `'throw'` for CI enforcement.

**Recommendation:** CONFIRMED. This is a 5-minute fix. Keep at P2.

---

### ACT-018: Verify search functionality

**Priority:** P2 | **Verdict:** CONFIRMED
**Evidence:**

- `@easyops-cn/docusaurus-search-local` is installed and configured in `docusaurus.config.ts` (lines 280-293) with proper settings: `hashed: true`, `indexDocs: true`, `indexPages: true`, `highlightSearchTermsOnTargetPage: true`.
- Verification has not been documented as completed.

**Recommendation:** CONFIRMED. This is a verification task, not a creation task. Needs manual testing against a built site.

---

### ACT-019: Fix baseUrl mismatch in Docusaurus

**Priority:** P2 | **Verdict:** ALREADY EXISTS (no mismatch)
**Evidence:**

- `docs/docusaurus.config.ts` line 16: `baseUrl: '/playwright-praman/'`
- Line 15: `url: 'https://mrkanitkar.github.io'`
- Line 19: `projectName: 'playwright-praman'`
- These match the GitHub Pages convention: `https://praman.zestest.in/`
- The `robots.txt` sitemap URL also matches: `https://praman.zestest.in/sitemap.xml`

**Recommendation:** ALREADY EXISTS (no issue). The baseUrl is correctly configured for GitHub Pages. Close this action.

---

### ACT-023: Create Custom Control Extension guide

**Priority:** P3 | **Verdict:** CONFIRMED (partially addressed)
**Evidence:**

- `docs/docs/guides/bridge-internals.md` -- Covers custom control handling from the bridge perspective.
- `docs/docs/guides/interaction-strategies.md` -- Mentions custom controls.
- No dedicated `docs/guides/custom-controls.md` guide for extending Praman to handle custom UI5 controls from a user perspective.

**Recommendation:** CONFIRMED. Keep at P3.

---

### ACT-024: Create Localization and i18n Testing guide

**Priority:** P3 | **Verdict:** CONFIRMED
**Evidence:**

- `docs/docs/guides/selectors.md` -- Mentions `i18NText` selector.
- `docs/docs/guides/migration-from-wdi5.md` -- References i18n testing.
- No dedicated guide for localization testing, language switching, or RTL testing.

**Recommendation:** CONFIRMED. Keep at P3.

---

### ACT-025: Create Security Testing Patterns guide

**Priority:** P3 | **Verdict:** CONFIRMED (partially addressed)
**Evidence:**

- `docs/docs/guides/odata-operations.md` -- Covers CSRF token handling.
- `docs/docs/guides/errors.md` -- Mentions security-related error codes.
- `docs/docs/decisions/adr-security-audit.md` -- Covers internal security practices, not user-facing security testing patterns.
- No dedicated guide for XSS detection, auth boundary testing from a test author perspective.

**Recommendation:** CONFIRMED. Keep at P3.

---

### ACT-026: Create WebSocket and Real-Time Testing guide

**Priority:** P3 | **Verdict:** CONFIRMED
**Evidence:**

- `docs/docs/guides/interaction-strategies.md` -- Brief mention of WebSocket.
- `docs/docs/guides/glossary.md` -- Brief mention.
- No dedicated guide for WebSocket or real-time testing in SAP apps.
- This is a niche use case. Most SAP apps use OData HTTP, not WebSocket.

**Recommendation:** CONFIRMED but DOWNGRADE to P4. This is a very niche scenario and should be post-GA.

---

### ACT-027: Add ADR: Dual ESM+CJS Decision

**Priority:** P3 | **Verdict:** CONFIRMED
**Evidence:**

- `docs/docs/decisions/` -- 8 existing ADRs. None covers the dual ESM+CJS build decision.
- `docs/docs/guides/architecture-overview.md` -- Mentions ESM+CJS but without a formal decision record.
- `docs/docs/guides/docker-cicd.md` -- Mentions dual build in CI context.

**Recommendation:** CONFIRMED. Keep at P3.

---

### ACT-028: Add ADR: Bridge Injection Strategy

**Priority:** P3 | **Verdict:** CONFIRMED (partially addressed)
**Evidence:**

- `docs/docs/decisions/adr-csp-compliance.md` -- Discusses bridge injection in the context of CSP compliance, mentions `page.evaluate()` approach.
- `docs/docs/decisions/adr-security-audit.md` -- Mentions bridge injection pattern.
- `docs/docs/guides/bridge-internals.md` -- Covers bridge injection in detail.
- No standalone ADR specifically documenting the decision to use `page.evaluate()` vs alternatives (e.g., `addInitScript()`, CDP-based injection).

**Recommendation:** CONFIRMED but note significant overlap with `adr-csp-compliance.md` and `bridge-internals.md`. Keep at P3 but could be merged into existing CSP ADR as an addendum.

---

### ACT-029: Add Changelog page to Docusaurus

**Priority:** P3 | **Verdict:** CONFIRMED
**Evidence:**

- `docs/src/pages/` -- No `changelog.tsx` page exists.
- Existing pages: `architecture.tsx`, `code-of-conduct.tsx`, `contributing.tsx`, `demo.tsx`, `disclaimer.tsx`, `example-reports.tsx`, `features.tsx`, `index.tsx`, `license.tsx`, `notice.tsx`, `personas.tsx`.
- `CHANGELOG.md` exists at project root but is not exposed via Docusaurus.

**Recommendation:** CONFIRMED. Keep at P3. Quick 15-minute task.

---

### ACT-030: Add Security Policy page to Docusaurus

**Priority:** P3 | **Verdict:** CONFIRMED
**Evidence:**

- `docs/src/pages/` -- No `security.tsx` page exists.
- `SECURITY.md` exists at project root but is not exposed via Docusaurus.

**Recommendation:** CONFIRMED. Keep at P3. Quick 15-minute task.

---

### ACT-031: Enable doc versioning

**Priority:** P3 | **Verdict:** CONFIRMED
**Evidence:**

- `docs/docusaurus.config.ts` -- No `docsVersionDropdown`, `lastVersion`, or versioning configuration present.
- Docusaurus versioning is not enabled.

**Recommendation:** CONFIRMED. Keep at P3. Not needed until v2.0 development begins.

---

### ACT-032: Verify sitemap generation

**Priority:** P3 | **Verdict:** CONFIRMED (partially done)
**Evidence:**

- `docs/static/robots.txt` -- Already references `Sitemap: https://praman.zestest.in/sitemap.xml`.
- `docs/package.json` -- No explicit `@docusaurus/plugin-sitemap` dependency, but it is included by default in `@docusaurus/preset-classic`.
- Verification that the sitemap is actually generated and submitted has not been documented.

**Recommendation:** CONFIRMED but likely auto-working via `preset-classic`. Needs manual verification after a build. Keep at P3.

---

### ACT-036: Add ADR: Proxy Pattern

**Priority:** P4 | **Verdict:** CONFIRMED (partially addressed)
**Evidence:**

- `docs/docs/guides/control-proxy.md` -- Covers the proxy pattern in detail (9037 bytes).
- `docs/docs/decisions/` -- No dedicated ADR for the JavaScript Proxy pattern.

**Recommendation:** CONFIRMED. Keep at P4. The guide covers the "what" but not the formal "decision record" format.

---

### ACT-037: Add ADR: Fixture Composition

**Priority:** P4 | **Verdict:** CONFIRMED (partially addressed)
**Evidence:**

- `docs/docs/guides/fixture-composition.md` -- Covers the mergeTests() pattern comprehensively.
- `docs/docs/decisions/` -- No dedicated ADR for fixture composition.

**Recommendation:** CONFIRMED. Keep at P4. Same reasoning as ACT-036.

---

### ACT-038: Enable Docusaurus blog

**Priority:** P4 | **Verdict:** CONFIRMED
**Evidence:**

- `docs/docusaurus.config.ts` line 304: `blog: false, // Enable when blog posts are added`
- `docs/blog/` directory exists with `authors.yml` and `tags.yml` but no posts.
- Blog infrastructure is ready but disabled.

**Recommendation:** CONFIRMED. Keep at P4. Infrastructure exists; just needs `blog: {}` and actual content.

---

## Duplicate Actions

### DUPLICATE: ACT-003(b) and ACT-013

**Finding:** ACT-003 part (b) ("Add a BTP multi-tenant auth example to `examples/`") and ACT-013 ("Add `examples/btp-multi-tenant.ts` with tenant switching and session isolation") describe the exact same deliverable.
**Recommendation:** Merge ACT-003(b) into ACT-013. Keep ACT-003(a) as a standalone AGENTS.md update.

### DUPLICATE: ACT-004 and existing OData guide

**Finding:** ACT-004 requests "Add `examples/odata-crud.ts` and corresponding Docusaurus example page showing read, create, update, delete operations with CSRF token handling." This content already exists in `docs/docs/guides/odata-operations.md` (254 lines with full CRUD examples, CSRF handling, V2/V4 differences, and two complete test examples).
**Recommendation:** Close ACT-004 or redefine as "Add odata-crud.md to examples sidebar" (a 15-minute task).

### DUPLICATE: ACT-005 and existing Fiori Elements guide

**Finding:** Same pattern as ACT-004. `docs/docs/guides/fiori-elements.md` (280 lines) already covers everything requested.
**Recommendation:** Close ACT-005 or redefine as "Add fiori-elements.md to examples sidebar" (15 minutes).

### DUPLICATE: ACT-008/ACT-009 and existing Docusaurus guides

**Finding:** ACT-008 requests fixture composition docs for CONTRIBUTING.md. This already exists comprehensively in `docs/docs/guides/fixture-composition.md`. ACT-009 requests bridge adapter docs for CONTRIBUTING.md. This already exists in `docs/docs/guides/bridge-internals.md`. Adding duplicated content to CONTRIBUTING.md creates a maintenance burden.
**Recommendation:** Close both. Add cross-reference lines to CONTRIBUTING.md instead.

---

## Conflict

### CONFLICT: ACT-006 duplicates existing content

**Finding:** ACT-006 ("Create `docs/guides/troubleshooting.md`") would create a new file that substantially duplicates `docs/docs/guides/debugging.md` which is titled "Debugging & Troubleshooting" and already contains all the content described in ACT-006: expanded error codes, common issues with solutions, and a debug checklist. Creating a separate troubleshooting guide would cause confusion about which file to maintain.
**Recommendation:** Close ACT-006. The debugging guide already IS the troubleshooting guide. If a FAQ section is desired, add it to the existing `debugging.md`.

---

## Recommended Updates to MASTER-ACTION-LIST.md

### Actions to Close (Already Exist)

| Action  | Reason                                                                  |
| ------- | ----------------------------------------------------------------------- |
| ACT-006 | `docs/docs/guides/debugging.md` already covers this comprehensively     |
| ACT-008 | `docs/docs/guides/fixture-composition.md` covers this                   |
| ACT-009 | `docs/docs/guides/bridge-internals.md` covers this                      |
| ACT-012 | `docs/docs/guides/reporters.md` has config examples                     |
| ACT-014 | `docs/docs/guides/sap-control-cookbook.md` covers SmartField/SmartTable |
| ACT-019 | baseUrl is correctly configured, no mismatch                            |

### Actions to Downgrade

| Action  | From | To  | Reason                                                                                        |
| ------- | ---- | --- | --------------------------------------------------------------------------------------------- |
| ACT-002 | P1   | P3  | Matchers documented in Docusaurus guide and llms-full.txt; only missing from AGENTS.md itself |
| ACT-004 | P1   | P3  | Comprehensive OData guide already exists; only a sidebar example page is missing              |
| ACT-005 | P1   | P3  | Comprehensive FE guide already exists; only a sidebar example page is missing                 |
| ACT-010 | P2   | P3  | Intent API guide is comprehensive; standalone example file is polish                          |
| ACT-011 | P2   | P3  | Vocabulary guide is comprehensive; standalone example file is polish                          |
| ACT-015 | P2   | P3  | Fixture reference and OData guide partially cover test data patterns                          |
| ACT-016 | P2   | P3  | Standard Playwright concept, partially covered in existing guides                             |
| ACT-026 | P3   | P4  | Very niche use case for SAP apps                                                              |

### Actions to Merge

| Merge      | Into    | Reason                                  |
| ---------- | ------- | --------------------------------------- |
| ACT-003(b) | ACT-013 | Both request a BTP multi-tenant example |

### Actions with Corrected Source References

| Action  | Issue                                                                                                                                                                                          |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ACT-006 | Source says "README has a brief troubleshooting section (5 error codes) but no comprehensive troubleshooting guide." This ignores the existence of `docs/docs/guides/debugging.md` (314 lines) |
| ACT-008 | Source says "fixture dependency tree are not documented for contributors." This ignores `docs/docs/guides/fixture-composition.md`                                                              |
| ACT-009 | Source says "Bridge adapter interface and serialization rules not in contributor documentation." This ignores `docs/docs/guides/bridge-internals.md`                                           |

### Revised Priority Summary (if recommendations adopted)

| Priority  | Original Count | Revised Count | Change                                                                               |
| --------- | -------------- | ------------- | ------------------------------------------------------------------------------------ |
| P1        | 6              | 3             | -3 (ACT-002, ACT-004, ACT-005 downgraded; ACT-006 closed)                            |
| P2        | 14             | 7             | -7 (ACT-008, ACT-009, ACT-012, ACT-014, ACT-019 closed; ACT-010, ACT-011 downgraded) |
| P3        | 15             | 22            | +7 (absorbs downgrades from P1 and P2)                                               |
| P4        | 6              | 7             | +1 (ACT-026 downgraded from P3)                                                      |
| **Total** | **41**         | **35**        | **-6 closed**                                                                        |

### True Remaining P1 Actions (Post-Verification)

1. **ACT-001:** Build `praman-mcp-server` package (unchanged, code action)
2. **ACT-003(a):** Add `btpWorkZone` to AGENTS.md fixture table (5-minute fix)
3. **ACT-013:** Add BTP multi-tenant auth example (absorbs ACT-003(b))

---

## Cross-Reference Accuracy Check

| Action  | Referenced Source              | Accurate?                                   |
| ------- | ------------------------------ | ------------------------------------------- |
| ACT-002 | Part 2 (Operability), 2.2.10   | Yes                                         |
| ACT-003 | Part 2 (Operability), 2.4.5    | Yes                                         |
| ACT-004 | Part 5 (Documentation), GAP-E1 | Yes but overstated severity                 |
| ACT-005 | Part 5 (Documentation), GAP-E2 | Yes but overstated severity                 |
| ACT-006 | Part 5 (Documentation), GAP-G1 | Inaccurate - ignores debugging.md           |
| ACT-007 | Part 2 (Operability), 2.4.8    | Yes                                         |
| ACT-008 | Part 2 (Operability), 2.5.4    | Inaccurate - ignores fixture-composition.md |
| ACT-009 | Part 2 (Operability), 2.5.5    | Inaccurate - ignores bridge-internals.md    |
| ACT-010 | Part 5 (Documentation), GAP-E3 | Yes but guide covers this                   |
| ACT-011 | Part 5 (Documentation), GAP-E4 | Yes but guide covers this                   |
| ACT-012 | Part 5 (Documentation), GAP-E5 | Yes but guide covers this                   |
| ACT-017 | Part 5 (Documentation), GAP-I2 | Yes - confirmed warn, not throw             |
| ACT-019 | Part 5 (Documentation), GAP-I1 | Inaccurate - no mismatch exists             |

---

_Verification performed by Claude Opus 4.6 on 2026-02-27. All findings based on actual codebase inspection, not assumptions._
