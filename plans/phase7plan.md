# Phase 7 — Documentation + Hardening + Deferred: Detailed Implementation Plan

> **Version**: 1.4.0
> **Status**: 📋 PLANNED — 2026-02-23 (v1.4.0 incorporates 6-agent review feedback + source code audit + 4-agent consistency audit)
> **Parent**: plan.md v4.0.0 (Phase 6.1 COMPLETE)
> **Duration**: ~20 weeks sequential, ~17 weeks parallel (6 sub-phases) — reduced from 23 weeks after source code audit
> **Approach**: Code-fixes-first, then docs (auto-generated where possible), then hardening
> **Predecessor**: Phase 6.1 — All 31 parity code items COMPLETE, 48 items deferred here + 19 agent operability items + items from AI Readiness Report + Persona Assessment Report
> **Audit**: v1.4.0 incorporates source code audit (2026-02-23) — 12 items verified complete, 2 items determined unnecessary, 8 items scope-reduced, AO-008 merged into AO-001. See Appendix E/F.
> **Cross-References**: AI Readiness Report (2026-02-21), Persona Assessment Report (2026-02-21), Master Action List, Onboarding Roadmap

---

## Table of Contents

1. [Decision Log (Wizard Answers)](#1-decision-log-wizard-answers)
2. [Sub-Phase Breakdown](#2-sub-phase-breakdown)
3. [Dependency Graph](#3-dependency-graph)
4. [Phase Entry Criteria](#4-phase-entry-criteria)
5. [Sub-Phase 7.0 — Priority Bug Fixes & Code Changes](#5-sub-phase-70--priority-bug-fixes--code-changes)
6. [Sub-Phase 7.1 — Minimum Viable Documentation (Tier 0)](#6-sub-phase-71--minimum-viable-documentation-tier-0)
7. [Sub-Phase 7.2 — Core Guides + Adoption Docs (Tier 1 + Tier 2)](#7-sub-phase-72--core-guides--adoption-docs-tier-1--tier-2)
8. [Sub-Phase 7.3 — Architecture Hardening + Integration Tests](#8-sub-phase-73--architecture-hardening--integration-tests)
9. [Sub-Phase 7.4 — Advanced Documentation + AI/SAP Ecosystem (Tier 3 + Tier 4)](#9-sub-phase-74--advanced-documentation--aisap-ecosystem-tier-3--tier-4)
10. [Sub-Phase 7.5 — Release Hardening + Certification](#10-sub-phase-75--release-hardening--certification)
11. [Complete Item Inventory](#11-complete-item-inventory)
12. [Test Plan](#12-test-plan)
13. [Impact Analysis](#13-impact-analysis)
14. [Quality Gates Per Sub-Phase](#14-quality-gates-per-sub-phase)
15. [Risk Register](#15-risk-register)
16. [Effort Summary](#16-effort-summary)
17. [Agent Review Enhancements](#17-agent-review-enhancements)
18. [Implementation Batches & Dependency Map](#18-implementation-batches--dependency-map)

- [Appendix A: Removed / Conditionally Deferred Items](#appendix-a-removed--conditionally-deferred-items)
- [Appendix B: Items Completed in Earlier Phases](#appendix-b-items-completed-in-earlier-phases-not-in-phase-7)
- [Appendix C: Design Decision Status Post-Phase 7](#appendix-c-design-decision-status-post-phase-7)
- [Appendix E: Items Verified Complete (Pre-Phase 7 Audit)](#appendix-e-items-verified-complete-pre-phase-7-audit)
- [Appendix F: Items Determined Unnecessary](#appendix-f-items-determined-unnecessary)

---

## 1. Decision Log (Wizard Answers)

These decisions are **binding** for Phase 7 implementation.

| #   | Question                    | Decision                                  | Rationale                                                                                                                                          |
| --- | --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Phase 7 scope               | 5 sub-phases (docs → hardening → release) | Documentation is highest-impact for adoption. Code hardening deferred items are lower priority (Playwright handles most natively).                 |
| W2  | Documentation framework     | Docusaurus v3                             | React-based, MDX support, versioning, search, TypeDoc integration. Industry standard for JS/TS projects.                                           |
| W3  | API reference generation    | TypeDoc or API Extractor → Docusaurus     | Auto-generated from TSDoc comments. Fix current 404 on docs site.                                                                                  |
| W4  | Documentation priority      | Tier 0 first (6 pages, 6 days)            | Without Getting Started + Config + Auth + Error + Selector + Fixture docs, adoption = 0.                                                           |
| W5  | Integration test strategy   | Real browser + SAP demo apps              | INT1/INT2 need actual SAP system. Use SAP Fiori demo apps (publicly accessible) or local CAP mock.                                                 |
| W6  | Architecture deferred items | Evaluate before implementing              | P4-013 (dry-run), P4-016 (circuit breaker), P4-018 (graceful shutdown) — all may be unnecessary given Playwright's built-in capabilities.          |
| W7  | Product decisions           | Data-driven after first adopters          | P5-PD-001/002/003 require real-world usage data. Set up telemetry/feedback to inform these decisions.                                              |
| W8  | WebComponent support        | New approach (not adapter pattern)        | D3 adapter was removed in Phase 3. WebComponent support needs Shadow DOM piercing via Playwright's native `>>` combinator, not a separate adapter. |
| W9  | Cloud ALM integration       | Reporter output format first              | Start with Cloud ALM-compatible JUnit/xUnit output format. Full API integration requires SAP partnership (5+ days, deferred until demand exists).  |
| W10 | SAP Codegen extension       | Wait for stable Playwright Codegen API    | Playwright Codegen extension points are evolving. Build post-processing tooling first, full extension when API stabilizes.                         |

---

## 2. Sub-Phase Breakdown

```text
Phase 7.0 — Priority Bug Fixes & Code Changes (Weeks 1–2)
├── BF-003: Expose Capabilities API — verify 3 additional methods needed (10 exist)
├── BF-004: Expose Recipes API — evaluate 7 potentially new methods (7 of 14 exist)
├── BF-005: Fix `fireSelect` in press chain (SegmentedButton/RadioButton broken)
├── BF-007: Fix silent error swallowing in strategies (false positives)
├── BF-009: Restore server-side logout (server session left dangling)
├── BF-010: Fix vocabulary normalization special chars
├── BF-011: Re-add UI5 minimum version check
├── BF-012: Refactor matchers for web-first auto-retry (expect.toPass pattern) [NEW]
├── BF-013: Fix gold standard test — remove banned patterns [NEW]
├── BF-014: Audit test.step() decoration across fixture public methods [NEW]
├── [REMOVED: BF-001, BF-002, BF-006, BF-008 — verified complete/unnecessary in audit]
└── Milestone: all critical/high bugs fixed, API surface complete, matchers auto-retry, `npm run ci` passes

Phase 7.1 — Minimum Viable Documentation (Weeks 3–4)
├── Docusaurus site scaffold
├── Tier 0: 6 essential pages (Getting Started, Config, Auth, Errors, Selectors, Fixtures)
├── Deployment fixes (API Reference 404, playwright.config.ts example)
├── P3-036: README usage examples (4 examples + examples/ directory)
├── NOTE: All doc pages auto-generated from TSDoc/Zod schema where possible
└── Milestone: docs site deploys, 6 pages live, API reference resolves

Phase 7.2 — Core Guides + Adoption Docs (Weeks 5–8)
├── Tier 1: 8 core guide pages (Composition, Interactions, Proxy, Strategies, Matchers, Nav, OData, Reporters)
├── Tier 2: 5 adoption/migration pages (wdi5, Vanilla PW, SAP Testers, Tosca, Capabilities)
├── Product decisions (PD-001, PD-002, PD-003)
├── NOTE: Config/Error references (auto-generated in 7.1) are foundational for 7.2 guides
└── Milestone: 19 pages live (6 from 7.1 + 13 new), all migration guides complete

Phase 7.3 — Architecture Hardening + Integration Tests (Weeks 9–13)
├── INT1: Bridge integration smoke tests (deferred from Phase 2)
├── INT2: Proxy + SAP cloud smoke tests (deferred from Phase 2)
├── P4-013: Evaluate dry-run/preview capability
├── P4-016: Evaluate circuit breaker pattern
├── P4-018: Evaluate graceful shutdown handling
├── WebComponent support (new approach, >> combinator specifics)
├── Registry discovery strategy evaluation (clarified scope vs Tier 2 scan)
├── D26: UI5Object AI introspection (describe, suggestOperations, getAIContext)
├── D5-L4: AI telemetry completion
├── AO-001..AO-010: Agent operability hardening (9 active items, AO-008 merged into AO-001)
│   ├── .d.ts navigability + .claudeignore (AO-001+AO-008 merged), stack trace cleanup (cross-platform guard), lifecycle hooks (5 events + leak tests)
│   ├── Template literal types (2 new types, reduced scope), exhaustive switches, branded types
│   ├── Type assertion reduction (5 instances, REFACTOR)
│   └── Auto-pagination (mock OData V2/V4 shapes), server-side HTTP client (error codes + mock strategy)
├── AI-002, AI-006: AI Readiness improvements (remaining 2 items)
│   ├── capabilities.forAI({ provider }) — expose on singleton + evaluate provider naming
│   └── Audit/reduce 55 `any` type occurrences (REFACTOR — typecheck verification only)
├── CQ-003: Code quality — @example block cleanup in 2-3 CLI files (minimal)
├── [REMOVED: D20-VERIFY, AI-001, AI-003, AI-004, AI-005, CQ-001, CQ-002 — verified complete/unnecessary in audit]
└── Milestone: integration tests pass, architecture decisions documented, AO + AI items complete

Phase 7.4 — Advanced Documentation + AI/SAP Ecosystem (Weeks 15–19)
├── Tier 3: 8 advanced topic pages (Architecture, Bridge, AI, FE, Intent, Vocabulary, Docker, Debug)
├── Tier 4: 5 reference pages (API Reference, Business Process Examples, SAP Cookbook, TX Mapping, Gold Standard)
│   └── P3-030: Add Purchase-to-Pay cross-process E2E tutorial (Agent 6 #49)
├── P5 docs: Accessibility, OData mocking, component testing, cross-browser, SAP Activate, upgrade testing, Best Practice import
│   └── P5-025: Visual regression docs with toHaveScreenshot() SAP specifics [NEW]
├── P5-004: SAP-aware Codegen support (evaluate + document) — move earlier per Tosca priority
├── P5-017..P5-020: SAP enterprise items (4 items)
│   ├── Pre-delivered test automates, intelligent test scoping
│   └── Custom test recording (page.evaluate serialization constraints), test data framework (LIFO cleanup + error handling)
├── LP-001..LP-007: Lower-priority code items (from Persona Assessment)
│   ├── Backward-compatibility fixture aliases
│   ├── Re-implement FLP error classes (18 errors enumerated)
│   ├── Global setup/teardown sub-path exports (attw validation)
│   ├── Handler facade classes / fixture migration path (fixture mapping table)
│   ├── Document config-based timeout configuration (LP-005 — converted to doc item)
│   ├── Config migrator CLI (npx playwright-praman migrate-config) — dhikraft config shape + sample I/O
│   └── Compatibility layer sub-path (playwright-praman/compat/dhikraft)
├── [REMOVED: LP-008, AI-007 — verified complete in audit]
├── DOC-001: IDE/VS Code setup guide for non-developers (expanded to 1.5 days)
├── DOC-002: Concept glossary page with Tosca equivalents for EVERY term
├── NOTE: API Reference auto-generated via TypeDoc/API Extractor from TSDoc
├── NOTE: Business Process Examples and SAP Cookbook auto-generated from recipe templates where possible
└── Milestone: 23 doc pages complete, all 12 code items complete, all P5 docs done, lower-priority code items complete

Phase 7.5 — Release Hardening + Certification (Weeks 20–22)
├── [REMOVED: NPM-PROV — verified complete in audit, --provenance flag already at release.yml:55]
├── Performance benchmarks (bridge injection, discovery, method call latency) — baseline numbers + regression thresholds
├── Security audit (final Snyk + npm audit)
├── CSP compliance assessment + documentation
├── P5-010: SAP Cloud ALM integration (JUnit schema version specified, reporter format compatibility)
├── Behavioral equivalence tests (golden master pattern) — 8+ wdi5 parity scenarios, comparison methodology
├── P5-021..P5-024: Cloud ALM extended integration (4 items)
│   ├── Test plan orchestration (annotation mechanism details), hybrid test execution
│   └── Requirements traceability, multi-tool integration
└── Milestone: npm publish with provenance, all audits pass, GitHub issue #7 closed
```

---

## 3. Dependency Graph

```text
              ┌──────────────────────────┐
              │ Phase 7.0: Bug Fixes     │  ← No dependencies, highest priority
              │ (Code changes first)     │
              └──────────┬───────────────┘
                         │
              ┌──────────▼───────────────┐
              │ Phase 7.1: MVP Docs      │  ← Depends on 7.0 (bugs fixed before documenting)
              │ (Docusaurus + Tier 0)    │
              └──────────┬───────────────┘
                         │
            ┌────────────┼────────────────┐
            │            │                │
   ┌────────▼────────┐  ┌─────▼──────────┐     │
   │ Phase 7.2:      │  │ Phase 7.3:     │     │
   │ Core + Adoption │  │ Hardening +    │     │
   │ Docs (Tier 1+2) │  │ Integration +  │     │
   │                 │  │ AI Readiness   │     │
   └────────┬────────┘  └─────┬──────────┘     │
            │                 │                │
            └───────┬─────────┘                │
                    │                          │
            ┌───────▼───────┐                  │
            │ Phase 7.4:    │ ◄────────────────┘
            │ Advanced Docs │
            │ + LP code     │
            │ (Tier 3+4)   │
            └───────┬───────┘
                    │
            ┌───────▼───────┐
            │ Phase 7.5:    │
            │ Release       │
            │ Hardening     │
            └───────────────┘
```

**Dependency Rules:**

- 7.0 is independent — starts immediately, all code changes before documentation
- 7.1 depends on 7.0 (bugs must be fixed before documenting behavior)
- 7.2 depends on 7.1 (Docusaurus scaffold must exist)
- 7.3 is independent of 7.2 (code hardening can run in parallel with docs)
- 7.4 depends on 7.1 (docs scaffold) + partially on 7.3 (architecture docs reference hardening decisions)
- 7.5 depends on 7.3 (integration tests must pass before release hardening)

---

## 4. Phase Entry Criteria

All criteria met as of 2026-02-22:

| Criterion                         | Status | Evidence                                       |
| --------------------------------- | ------ | ---------------------------------------------- |
| Phase 6.1 all code items complete | ✅     | 31/31 items done, all tests passing            |
| `npm run ci` passes               | ✅     | lint + typecheck + test:unit + build all green |
| 0 lint errors, 0 warnings         | ✅     | ESLint 10-plugin configuration                 |
| 0 TypeScript errors               | ✅     | `tsc --noEmit` clean                           |
| Coverage thresholds met           | ✅     | 98.91% stmts, per-file enforcement             |
| Build output valid                | ✅     | attw 6/6 sub-path exports resolve correctly    |
| Agent operability score ≥80%      | ✅     | 84.5% combined (155.5 / 184) per REPORT.md     |
| No P0 or P1 items outstanding     | ✅     | All critical/high items completed in Phase 6.1 |

---

## 5. Sub-Phase 7.0 — Priority Bug Fixes & Code Changes

**Scope**: Critical and high-priority code fixes identified by Persona Assessment Report and AI Readiness Report. All code changes BEFORE documentation. (4 items removed by audit — see Appendix E/F)
**Duration**: 2 weeks (8 working days)
**Gate**: All critical/high bugs fixed, API surface complete, `npm run ci` passes
**Source**: Master Action List items #7, #8, #14–16, #31–33, #37–38; AI Readiness Report §3.2, §4.2

### Rationale

Code changes must precede documentation. Documenting broken or incomplete behavior wastes effort — fix first, then document correct behavior. Items are ordered by severity (Critical → High → Medium).

### Critical Priority (Blocking Adoption)

#### 5.1 BF-001: ~~Remove "Coming soon" from README~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** No "Coming soon" text exists in README.md. See Appendix E for audit evidence.

#### 5.2 BF-002: ~~Wire `ui5=` Selector Engine at Runtime~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** Already registered in `selectorRegistration` auto-fixture at core-fixtures.ts:172-187, with idempotency handling. See Appendix E for audit evidence.

#### 5.3 BF-003: Expose Capabilities API from Main Entry — SCOPE REDUCED

| Field      | Value                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | BF-003                                                                                                                                                                                                                                                  |
| Source     | master-action-list #7, persona P1 + P3 (Critical), GAP-C1                                                                                                                                                                                               |
| Effort     | 1 day (reduced from 2 — 10 methods already exist)                                                                                                                                                                                                       |
| Outline    | Capabilities API is exported with 10 methods. 3 additional methods needed: `forControl()`, `describe()`, `getCategories()`. Verify if these are new features or already covered by existing alternatives (`find()`, `getStatistics()`, `findByName()`). |
| File       | `src/index.ts`, `src/ai/capabilities/`                                                                                                                                                                                                                  |
| Test File  | `tests/unit/ai/capabilities/index.test.ts`                                                                                                                                                                                                              |
| Acceptance | All needed capability methods importable from `'playwright-praman'` or `'playwright-praman/ai'`. Unit test verifies each method is callable.                                                                                                            |
| Audit Note | Pre-audit: 10 methods already exported. Remaining work is evaluation + at most 3 new methods.                                                                                                                                                           |

#### 5.4 BF-004: Expose Recipes API from Main Entry — SCOPE REDUCED

| Field      | Value                                                                                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | BF-004                                                                                                                                                                                                                                      |
| Source     | master-action-list #8, persona P1 + P3 (Critical), GAP-C2                                                                                                                                                                                   |
| Effort     | 1 day (reduced from 2 — 7 of 14 methods already exist)                                                                                                                                                                                      |
| Outline    | Recipes API is exported with 7 methods. Remaining methods to evaluate: `forCapability`, `forProcess`, `list`, `find`, `has`, `getSteps`, `validate`, `describe`, `getCategories`, `forDomain`, `toJSON` (7 of 14 exist, 7 potentially new). |
| File       | `src/index.ts`, `src/ai/recipes/`                                                                                                                                                                                                           |
| Test File  | `tests/unit/ai/recipes/index.test.ts`                                                                                                                                                                                                       |
| Acceptance | All needed recipe methods importable from `'playwright-praman'` or `'playwright-praman/ai'`. Unit test verifies each method is callable.                                                                                                    |
| Audit Note | Pre-audit: 7 methods already exported. Remaining work is evaluation + implementation of needed new methods.                                                                                                                                 |

### High Priority (Significant Friction)

#### 5.5 BF-005: Fix `fireSelect` in Press Chain

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | BF-005                                                                                                                                                                                                                                                                                                                                                                                                           |
| Source     | master-action-list #14, persona P3 (High), GAP-C6                                                                                                                                                                                                                                                                                                                                                                |
| Effort     | 0.5 day                                                                                                                                                                                                                                                                                                                                                                                                          |
| Outline    | `press()` no longer fires `fireSelect` after `firePress`, breaking `SegmentedButton` and `RadioButton` interactions. Restore the `fireSelect` call in the press chain for controls that require it. Affected controls: `sap.m.SegmentedButton`, `sap.m.RadioButton`, `sap.m.Select`, `sap.m.ComboBox`. Note: OPA5 strategy uses PRESS interaction type, but SegmentedButton/RadioButton need SELECT interaction. |
| File       | `src/bridge/interaction-strategies/`                                                                                                                                                                                                                                                                                                                                                                             |
| Test File  | `tests/unit/bridge/interaction-strategies/press-chain.test.ts`                                                                                                                                                                                                                                                                                                                                                   |
| Mock       | Mock `page.evaluate()` to verify `fireSelect` is called after `firePress` for qualifying controls. Use `vi.fn()` typed mocks.                                                                                                                                                                                                                                                                                    |
| Acceptance | `press()` on SegmentedButton and RadioButton triggers selection. Unit test covers all 4 affected controls. RED phase: demonstrate bug with failing test first.                                                                                                                                                                                                                                                   |

#### 5.6 BF-006: ~~Add Eager Injection Timeout Guard~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** Deadline check exists at injection.ts:62-74. Console.warn on timeout is appropriate for browser-context addInitScript (cannot throw Node errors from browser context). Structured BridgeError not feasible from browser context. See Appendix E for audit evidence.

#### 5.7 BF-007: Fix Silent Error Swallowing in Strategies

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | BF-007                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Source     | master-action-list #16, persona P1 + P3 (High), GAP-C7                                                                                                                                                                                                                                                                                                                                                                     |
| Effort     | 0.5 day                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Outline    | Interaction strategies return `{success: false, error?: string}` instead of throwing errors. Tests pass when they should fail (false positives). Affected strategies: `PlaywrightStrategy`, `DomFirstStrategy`, `OPA5Strategy`. Current shape: `{ success: boolean; error?: string; value?: unknown }`. Must throw `InteractionError` (extends `PramanError`) with code `ERR_INTERACTION_FAILED` when `success === false`. |
| File       | `src/bridge/interaction-strategies/`                                                                                                                                                                                                                                                                                                                                                                                       |
| Test File  | `tests/unit/bridge/interaction-strategies/*.test.ts`                                                                                                                                                                                                                                                                                                                                                                       |
| Acceptance | Failed strategy operations throw `InteractionError`. Unit tests verify error propagation for all 3 strategies. RED phase: demonstrate false positive with failing test first.                                                                                                                                                                                                                                              |

#### 5.8 BF-008: ~~Fix Retry Utility `maxAttempts=1` Bug~~ — DETERMINED UNNECESSARY

> **Moved to Appendix F.** The code uses `maxRetries` not `maxAttempts`. Loop `for (let attempt = 0; attempt <= maxRetries; attempt++)` is mathematically correct. `maxRetries=0` means 1 attempt. No bug exists. See Appendix F for full explanation.

### Medium Priority (Quality of Life)

#### 5.9 BF-009: Restore Server-Side Logout

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | BF-009                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Source     | master-action-list #37, persona P1 + P2 (Medium), GAP-M4                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Effort     | 0.5 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Outline    | praman navigates to `about:blank` instead of server logout URL during cleanup. This leaves server sessions dangling (ICM sessions, IAS sessions). Restore server-side logout call before navigation. Auth strategies needing server logout: `BasicAuth` (`/sap/public/bc/icf/logoff`), `FormAuth` (`/sap/public/bc/icf/logoff`), `SamlAuth` (IDP-specific logout URL from config), `OAuth2Auth` (token revocation endpoint). `CertificateAuth` and `CustomAuth` are exempt (no server session). |
| File       | `src/fixtures/auth-fixtures.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Test File  | `tests/unit/fixtures/auth-fixtures.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Mock       | Mock `page.goto()` to verify logout URL is navigated. Mock `page.route()` to intercept logout request.                                                                                                                                                                                                                                                                                                                                                                                          |
| Acceptance | Auth cleanup calls strategy-specific server logout URL before navigating to `about:blank`. Unit test verifies logout request for BasicAuth, FormAuth, SamlAuth, OAuth2Auth.                                                                                                                                                                                                                                                                                                                     |

#### 5.10 BF-010: Fix Vocabulary Normalization Special Characters

| Field      | Value                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | BF-010                                                                                                                                                                                                                                                 |
| Source     | master-action-list #32, persona P3 (Medium), GAP-M5                                                                                                                                                                                                    |
| Effort     | 0.25 day                                                                                                                                                                                                                                               |
| Outline    | Special characters are not removed during vocabulary normalization, causing synonym matching failures for terms with hyphens, underscores, or dots. Normalization spec: strip `-`, `_`, `.`, `/`, `\`, `:`, convert to lowercase, collapse whitespace. |
| File       | `src/vocabulary/`                                                                                                                                                                                                                                      |
| Test File  | `tests/unit/vocabulary/normalization.test.ts`                                                                                                                                                                                                          |
| Test Data  | SAP terms: `"Purchase-Order"` -> `"purchaseorder"`, `"G/L_Account"` -> `"glaccount"`, `"sap.m.Button"` -> `"sapmbutton"`, `"Cost-Center:1000"` -> `"costcenter1000"`, `"MM-PUR"` -> `"mmpur"`                                                          |
| Acceptance | Normalization strips all listed special characters. Unit test with 5+ hyphenated/dotted SAP terms passes. RED phase: demonstrate bug with failing test first.                                                                                          |

#### 5.11 BF-011: Re-add UI5 Minimum Version Check

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | BF-011                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Source     | master-action-list #33, persona P3 (Medium), GAP-M1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Effort     | 0.5 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Outline    | UI5 minimum version check was removed in rewrite. Tests may silently fail on old SAP systems (UI5 < 1.96). Re-add version detection and emit a warning via `logger.warn()` when running against unsupported UI5 versions. **Note**: `src/bridge/stability.ts` does not exist — either create it or add to an existing bridge module (e.g., `injection.ts` or `bridge-adapter.ts`). Version detection approach: call `sap.ui.getCore().getConfiguration().getVersion().toString()` via `page.evaluate()`, parse with semver comparison. Specify minimum supported UI5 API dependencies: `sap.ui.getCore()` (available since 1.0), `getVersion()` (available since 1.0). |
| File       | `src/bridge/version-check.ts` (new) or `src/bridge/injection.ts` (extend)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Test File  | `tests/unit/bridge/version-check.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Mock       | Mock `page.evaluate()` to return version strings: `"1.96.0"` (pass), `"1.84.0"` (warn), `"1.120.0"` (pass), `undefined` (warn).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Acceptance | Bridge logs warning when UI5 version < 1.96. Unit test verifies detection for supported, unsupported, and missing version cases.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

#### 5.12 BF-012: Refactor Matchers for Web-First Auto-Retry

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | BF-012                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Source     | Agent Review: Agent 2 A1, Agent 3 A3 (Critical — multiple agents flagged)                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Priority   | **1 (Critical code task)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Outline    | All 10 custom matchers (5 UI5 + 3 table + 2 FE) lack Playwright's web-first auto-retry behavior. They execute once and fail, unlike built-in matchers (`toBeVisible()`, `toHaveText()`) which auto-retry until timeout. Refactor all 10 matchers to use `expect(async () => { ... }).toPass({ timeout })` wrapper pattern internally, so consumers get auto-retry without knowing about `toPass()`. This is the **single most impactful Playwright best-practice gap** in the current codebase. |
| File       | `src/matchers/ui5-matchers.ts`, `src/matchers/table-matchers.ts`, `src/matchers/matcher-utils.ts`                                                                                                                                                                                                                                                                                                                                                                                               |
| Test File  | `tests/unit/matchers/ui5-matchers.test.ts`, `tests/unit/matchers/table-matchers.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                        |
| Deps       | None — can be done in parallel with other BF items                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Acceptance | (1) All 10 matchers auto-retry until timeout. (2) Existing matcher tests still pass. (3) New test verifies retry behavior (matcher succeeds on 2nd poll). (4) Matcher API clarified: receives controlId string (not Locator).                                                                                                                                                                                                                                                                   |

#### 5.13 BF-013: Fix Gold Standard Test — Remove Banned Patterns

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | BF-013                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Source     | Agent Review: Agent 2 A2 + A3 (Critical — violates Rules 5 + 6)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Priority   | **1 (Critical code task)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Outline    | The gold standard E2E test (`tests/e2e/sap-cloud/bom-e2e-gold-standard.spec.ts` and `tests/example/example-bom-e2e-gold-standard.spec.ts`) uses banned patterns: (a) 20+ instances of `page.waitForTimeout()` — violates Principle 8 / Rule 6, (b) 40+ instances of `console.log()` — violates Rule 5 (use pino logger). Replace `page.waitForTimeout()` with `ui5Stability.waitForUI5Stable()` or Playwright auto-waiting. Replace `console.log()` with `logger.info()` or `test.step()` annotations. |
| File       | `tests/e2e/sap-cloud/bom-e2e-gold-standard.spec.ts`, `tests/example/example-bom-e2e-gold-standard.spec.ts`                                                                                                                                                                                                                                                                                                                                                                                             |
| Deps       | None                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Acceptance | (1) Zero `page.waitForTimeout()` calls in gold standard files. (2) Zero `console.log()` calls in gold standard files. (3) Test still passes against SAP BTP app.                                                                                                                                                                                                                                                                                                                                       |

#### 5.14 BF-014: Audit `test.step()` Decoration Across Fixture Public Methods

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | BF-014                                                                                                                                                                                                                                                                                                                                                                              |
| Source     | Agent Review: Agent 2 B3 (Significant)                                                                                                                                                                                                                                                                                                                                              |
| Priority   | **1 (Code task)**                                                                                                                                                                                                                                                                                                                                                                   |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                               |
| Outline    | Audit all fixture public methods across `src/fixtures/*.ts` and `src/modules/*.ts` to ensure `test.step()` decoration via `@ui5Step` decorator or `withStep()` wrapper. Phase 6 wired step-decorator to 5 handlers, but new handlers/modules added in Phase 6.1 may be missing decoration. Every user-facing fixture method must appear in Playwright trace viewer as a named step. |
| File       | `src/fixtures/*.ts`, `src/modules/*.ts`                                                                                                                                                                                                                                                                                                                                             |
| Test File  | N/A — verification via `grep` audit + manual trace viewer inspection                                                                                                                                                                                                                                                                                                                |
| Deps       | None                                                                                                                                                                                                                                                                                                                                                                                |
| Acceptance | (1) Every public fixture method decorated with `test.step()`. (2) Audit checklist produced showing method → step mapping. (3) Missing decorations added.                                                                                                                                                                                                                            |

**Sub-Phase 7.0 Totals**: 10 items, 8.25 days (was 14 items, 12.85 days — 4 items verified complete/unnecessary in audit, 2 items scope-reduced)

---

## 6. Sub-Phase 7.1 — Minimum Viable Documentation (Tier 0)

**Scope**: Docusaurus scaffold + 6 essential pages + 2 deployment fixes
**Duration**: 2 weeks (8 working days)
**Gate**: Docs site deploys to GitHub Pages, 6 pages accessible, API reference resolves
**NOTE**: All documentation pages MUST be auto-generated from source where possible:

- Config Reference: auto-generated from Zod schema (`src/core/config/schema.ts`)
- Error Reference: auto-generated from `src/core/errors/codes.ts`
- Fixture Reference: auto-generated from `mergeTests()` source and TSDoc
- API Reference: auto-generated via TypeDoc from TSDoc comments

### 6.0 Docusaurus Site Scaffold

**Purpose**: Create the documentation site infrastructure using Docusaurus v3.

| Task                              | Deliverable                                    | Effort   |
| --------------------------------- | ---------------------------------------------- | -------- |
| Initialize Docusaurus v3 project  | `docs/` directory with config, sidebars, theme | 0.5 day  |
| Configure GitHub Pages deployment | Update `.github/workflows/docs.yml`            | 0.5 day  |
| Set up search (Algolia or local)  | Search integration in docusaurus.config.js     | 0.25 day |
| Configure TypeDoc plugin          | Auto-generate API reference from TSDoc         | 0.25 day |

**Subtotal**: 1.5 days

### 6.1 P3-001: Getting Started

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-001                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Source     | docusaurus-plan #1, master-action-list #1                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Outline    | Prerequisites (Node.js ≥20, Playwright ≥1.50), `npm install playwright-praman`, create `playwright.config.ts`, create `first.test.ts`, run with `npx playwright test`, interpret results. Include expected terminal output. **Must include**: (a) "Why `ui5.control()` instead of `page.locator()`?" callout box — explain that SAP UI5 renders controls dynamically, IDs change between versions, and the UI5 control tree is the stable contract. (b) Show `mergeTests()` import pattern. (c) Include `.env.example` with `SAP_BASE_URL`, `SAP_USERNAME`, `SAP_PASSWORD` placeholders. |
| Acceptance | Page renders, code snippets are copy-pasteable and correct, E2E doc test passes. "Why not Locators?" callout present.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### 6.2 P3-002: Configuration Reference

| Field      | Value                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-002                                                                                                                                                                                                                    |
| Source     | docusaurus-plan #2, master-action-list #4                                                                                                                                                                                 |
| Effort     | 1 day                                                                                                                                                                                                                     |
| Outline    | All `PramanConfig` fields from Zod schema. Table: field name, type, default, description. Complete `playwright.config.ts` example. Config option interactions documented (absorbed P5-016). `PRAMAN_*` env var overrides. |
| Deps       | P3-035 (complete playwright.config.ts example — merged here)                                                                                                                                                              |
| Acceptance | Every config field documented, example validates with `defineConfig()`                                                                                                                                                    |

### 6.3 P3-003: Authentication Guide

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-003                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Source     | docusaurus-plan #3, master-action-list #19                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Outline    | All 6 strategies: BasicAuth, FormAuth, SamlAuth, CertificateAuth, OAuth2Auth, CustomAuth. Config for each. `storageState` reuse pattern. Setup project dependency pattern (D28). BTP WorkZone iframe auth. **Must include**: (a) Complete `storageState` + `globalSetup` + `projects` pattern showing auth setup project → test projects dependency chain. (b) Show `test.step('Authenticate')` annotation within auth flow. (c) Example `playwright.config.ts` with `{ name: 'setup', testMatch: /auth\.setup\.ts/ }` project and `{ name: 'tests', dependencies: ['setup'] }`. |
| Acceptance | Each strategy has config example + working test example. storageState pattern with projects shown end-to-end.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### 6.4 P3-004: Error Reference

| Field      | Value                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-004                                                                                                                                                                                                  |
| Source     | docusaurus-plan #4, master-action-list #22                                                                                                                                                              |
| Effort     | 1 day                                                                                                                                                                                                   |
| Outline    | Table of all 43 error codes by category (ERR*BRIDGE*_, ERR*CONTROL*_, ERR*CONFIG*_, ERR*AUTH*_, ERR*NAV*_, ERR*FLP*_, etc.). Each: code, class, description, causes, fix suggestions, `retryable` flag. |
| Acceptance | Every error code from `core/errors/codes.ts` documented, `toUserMessage()` examples shown                                                                                                               |

### 6.5 P3-005: Selector Reference

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-005                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Source     | docusaurus-plan #5, master-action-list #13                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Outline    | `UI5Selector` fields. `ui5=` engine syntax. 10+ examples with common SAP controls. Selector string format: `ui5=sap.m.Button#saveBtn[text=Save]`. Property matching, viewName scoping, RegExp IDs, ancestor/descendant, interaction suffixes. **Must include**: SAP control type cheat sheet — table of 15+ common SAP controls with their `controlType` string, typical selectors, and common property matchers (e.g., `sap.m.Button` -> `{ text: 'Save' }`, `sap.m.Input` -> `{ value: '...' }`, `sap.ui.comp.smartfield.SmartField` -> note about inner control wrapping). |
| Acceptance | All selector fields documented, 10+ runnable examples, control type cheat sheet with 15+ controls                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### 6.6 P3-006: Fixture Reference

| Field      | Value                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | P3-006                                                                                                                                                                                                                                           |
| Source     | docusaurus-plan #6                                                                                                                                                                                                                               |
| Effort     | 1 day                                                                                                                                                                                                                                            |
| Outline    | All fixtures from `mergeTests()`: `ui5`, `sapAuth`, `ui5Navigation`, `ui5Stability`, `pramanConfig`, `pramanAI`, `intent`, `fe`, `ui5Shell`, `ui5Footer`, `flpLocks`, `flpSettings`, `testData`. Name, scope (worker/test), type, usage example. |
| Acceptance | Every fixture documented with import path and usage example                                                                                                                                                                                      |

### 6.7 P3-034: Fix API Reference 404

| Field      | Value                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------ |
| ID         | P3-034                                                                                                       |
| Source     | docusaurus-plan deployment section, master-action-list #2                                                    |
| Effort     | 0.5 day                                                                                                      |
| Outline    | Generate API docs via TypeDoc. Add to Docusaurus config as `/api` route. Add CI step to `docs.yml` workflow. |
| Acceptance | `/api` route resolves, TypeDoc output renders correctly                                                      |

### 6.8 P3-035: Complete playwright.config.ts Example

| Field      | Value                                                                                                                                |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | P3-035                                                                                                                               |
| Source     | master-action-list #6                                                                                                                |
| Effort     | 0.5 day                                                                                                                              |
| Outline    | Complete configuration example showing all features: `defineConfig()`, auth setup project, `mergeTests()`, reporters, env overrides. |
| Note       | Merged into P3-002 content, but listed separately for tracking                                                                       |
| Acceptance | Example is syntactically valid, demonstrates all major config options                                                                |

### 6.9 P3-036: README Usage Examples

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-036                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Source     | agent-operability A1.6 (FRICTION)                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Outline    | Add 4 usage examples to README.md: (a) OData CRUD operations, (b) Table operations with matchers (demonstrate auto-retry matchers from BF-012), (c) Auth + Navigation flow, (d) AI-powered test generation. Create `examples/` directory with runnable sample projects. Each example should be self-contained and demonstrate a distinct capability of praman. **Must include**: `.env.example` file and `playwright.config.example.ts` shipped in examples directory (not just in docs). |
| Deps       | BF-012 (matchers auto-retry — example (b) demonstrates this feature)                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Acceptance | README has 4+ code examples beyond Quick Start, `examples/` directory contains runnable project(s), `.env.example` and config example included                                                                                                                                                                                                                                                                                                                                            |

**Sub-Phase 7.1 Totals**: 10 items, 9.5 days (9 items + 1 infrastructure scaffold)

---

## 7. Sub-Phase 7.2 — Core Guides + Adoption Docs (Tier 1 + Tier 2)

**Scope**: 8 core guide pages + 5 adoption/migration pages + 3 product decisions
**Duration**: 4 weeks (16 working days)
**Gate**: 13 new doc pages live, all migration guides complete, product decisions documented

### Tier 1: Core Guides (8 pages)

#### 7.1 P3-007: Fixture Composition with mergeTests()

| Field      | Value                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-007                                                                                                                                                          |
| Source     | docusaurus-plan #7, master-action-list #24                                                                                                                      |
| Effort     | 2 days                                                                                                                                                          |
| Outline    | Modular architecture. Composing `coreTest` + `authTest`. Tree-shaking. Custom fixtures. `test.extend()` chain. Why `mergeTests()` over monolithic fixture file. |
| Acceptance | Code examples compile, fixture composition pattern clear                                                                                                        |

#### 7.2 P3-008: UI5 Control Interactions

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-008                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Source     | docusaurus-plan #8                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Outline    | `ui5.click()`, `ui5.fill()`, `ui5.press()`, `ui5.select()`, `ui5.getText()`, etc. Signature, parameters, return type, example per method. **Must include**: Auto-waiting behavior section explaining how praman's `waitForUI5Stable()` differs from Playwright's native auto-waiting. Praman waits for UI5 rendering pipeline + pending OData requests + setTimeout queue; Playwright waits for DOM stability. Document which operations auto-wait and which require explicit `ui5Stability.waitForUI5Stable()`. |
| Acceptance | Every UI5Handler public method documented with example. Auto-waiting behavior section present.                                                                                                                                                                                                                                                                                                                                                                                                                   |

#### 7.3 P3-009: Control Proxy Pattern

| Field      | Value                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------ | ------ |
| ID         | P3-009                                                                                                                                                                                                                                                                                                                                                |
| Source     | docusaurus-plan #9, master-action-list #27                                                                                                                                                                                                                                                                                                            |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                                                |
| Outline    | How `createControlProxy()` works. Proxy get trap routing (8 steps). Method forwarding, blacklist, caching. 7-type return system. **Must include**: `WDI5Control` vs `UI5ControlBase` comparison table showing: property access pattern, method invocation, aggregation traversal, return types, error handling, async behavior. Table format: Feature | wdi5 | praman | Notes. |
| Acceptance | Proxy internals explained, diagram of get trap flow, WDI5Control comparison table present                                                                                                                                                                                                                                                             |

#### 7.4 P3-010: Interaction Strategies

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-010                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Source     | docusaurus-plan #10                                                                                                                                                                                                                                                                                                                                                                                                               |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Outline    | `playwright` (UI5-native) vs `dom-first` vs `opa5`. When to use each. Strategy factory. Shared interaction logic (D21). `fireEvent` fallback chain. **Must include**: (a) Default strategy rationale — why `playwright` is the default and when to override. (b) `expect.poll()` integration example showing strategy result polling for eventual consistency. (c) Retry pattern with `toPass()` for flaky strategy interactions. |
| Acceptance | Decision tree for choosing strategy, each strategy with example, default strategy rationale documented                                                                                                                                                                                                                                                                                                                            |

#### 7.5 P3-011: Custom Matchers

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-011                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Source     | docusaurus-plan #11                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Outline    | All 10 matchers (5 UI5 + 3 table + 2 FE) with examples. Async behavior. `toPass()` retry pattern. Error message preview. How to write custom matchers. **Must include**: (a) Prominent note that praman matchers now auto-retry (after BF-012), explaining how this works internally via `toPass()` wrapper. (b) `expect.poll()` integration example for custom polling assertions. (c) Comparison with Playwright built-in matchers to set expectations. (d) Note: matcher receives controlId string, not Locator — clarify API surface. |
| Deps       | BF-012 (matchers refactored for auto-retry — must be complete before documenting)                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Acceptance | Every matcher documented, retry behavior explained, `expect.poll()` example included                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

#### 7.6 P3-012: Navigation

| Field      | Value                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-012                                                                                                                    |
| Source     | docusaurus-plan #12                                                                                                       |
| Effort     | 1 day                                                                                                                     |
| Outline    | `ui5Navigation.navigateToApp()`, hash navigation, intent navigation, FLP tile navigation, BTP WorkZone iframe management. |
| Acceptance | Each navigation method documented with SAP-specific example                                                               |

#### 7.7 P3-013: OData Operations

| Field      | Value                                                                                                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-013                                                                                                                          |
| Source     | docusaurus-plan #13, master-action-list #26                                                                                     |
| Effort     | 2 days                                                                                                                          |
| Outline    | Model operations via `ui5.odata`. HTTP operations. ODataTraceReporter. V2 vs V4 differences. Batch operations. Error responses. |
| Acceptance | OData V2 and V4 examples, reporter configuration shown                                                                          |

#### 7.8 P3-014: Reporters

| Field      | Value                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-014                                                                                                                  |
| Source     | docusaurus-plan #14                                                                                                     |
| Effort     | 1 day                                                                                                                   |
| Outline    | `ComplianceReporter`, `ODataTraceReporter`. Config in `playwright.config.ts`. Output format. Custom reporter extension. |
| Acceptance | Both reporters configured and output shown                                                                              |

**Tier 1 Subtotal**: 8 pages, 12 days

### Tier 2: Adoption & Onboarding Guides (5 pages)

#### 7.9 P3-016: Migration from wdi5

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-016                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Source     | docusaurus-plan #16, master-action-list #20                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Effort     | 3 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Outline    | `browser.asControl()` -> `ui5.control()`. Config mapping (wdio.conf -> playwright.config). OPA5 journey -> Playwright `test.step()`. Side-by-side code examples. **Must include**: (a) Detailed wdi5 selector field mapping table covering all 12+ fields: `selector` (wrapper `{ selector: { ... } }` removal warning), `controlType`, `id`, `properties`, `aggregation`, `ancestor`, `descendant`, `interaction` (idSuffix, pressAction), `viewName`, `viewId`, `searchOpenDialogs`, `bindingPath` (shape difference: wdi5 `{modelName, propertyPath}` vs praman `Record<string, string>`). (b) `labelFor` selector note: missing from praman `UI5Selector` type — document as known gap with workaround. (c) "New in praman vs wdi5" section highlighting praman-only features (AI, intents, typed proxies, matchers). |
| Acceptance | Complete 12+ field mapping table, wrapper removal warning, bindingPath shape difference documented, runnable before/after examples                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

#### 7.10 P3-017: Migration from Vanilla Playwright

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | P3-017                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Source     | docusaurus-plan #17                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Outline    | When to use `page.locator()` vs `ui5.control()`. Auto-waiting differences. Mixing Playwright and SAP fixtures. Progressive enhancement. **Must include**: (a) Hybrid PW+praman test as first-class example — show same test using pure Playwright locators vs praman selectors, highlighting the stability benefits. (b) Parallel execution guidance: `fullyParallel` config, worker-scoped fixtures, shared auth state via `storageState`. (c) Note effort estimate: 2 days (medium — Playwright developers need less hand-holding than SAP testers). |
| Acceptance | Decision matrix for locator vs control, hybrid test example, parallel execution guidance                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

#### 7.11 P3-018: Playwright Primer for SAP Testers

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-018                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Source     | docusaurus-plan #18, master-action-list #12                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Effort     | 3 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Outline    | Playwright basics for testers from SAP (Tosca/CBTA/manual/wdi5) backgrounds. `async/await`, fixtures, `test.step()`, assertions. No Playwright experience assumed. **Audience clarification**: targets 3 sub-audiences: (a) CBTA with scripting experience — focus on code patterns, (b) Tosca zero-code users — focus on concept mapping, (c) manual testers — focus on fundamentals. **Must include**: prerequisite learning path for zero-programming personas (VS Code basics, terminal basics, Node.js installation). wdi5 users also need this primer since wdi5 uses WebDriverIO, not Playwright. |
| Acceptance | SAP tester with no JS experience can follow tutorial end-to-end. Three audience tracks clearly marked.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

#### 7.12 P3-019: From Tosca to Playwright-Praman

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | P3-019                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Source     | docusaurus-plan #19, master-action-list #28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Effort     | 4 days (expanded from 3 — Agent 5 feedback: severely underspecified)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Outline    | Comprehensive concept mapping — **25-row table minimum** (not 4). Must cover: Tosca test case -> `test()`, Tosca module -> fixture, Tosca parameters -> parameterization, Tosca verification -> `expect()`, Tosca TestCase folder -> `describe()`, Tosca ExecutionList -> `playwright.config.ts projects`, Tosca Buffer -> `const`/`let`, Tosca Library -> `import`, Tosca Steering parameter -> `test.use()`, Tosca TDS (Test Data Service) -> `testData` fixture, Tosca Commander -> Git + VS Code, Tosca Execution -> `npx playwright test`, Tosca Report -> HTML reporter, Tosca TestEvent -> `test.step()`, Tosca Recovery -> `test.afterEach()`, Tosca Checkpoint -> `expect()` assertion, Tosca ActionMode Verify -> `toHaveUI5Property()`, Tosca ActionMode Input -> `ui5.fill()`, Tosca ActionMode Select -> `ui5.select()`, Tosca Wizard -> Codegen (P5-004), Tosca TestConfiguration -> `playwright.config.ts`, Tosca LogicalName -> `UI5Selector`, Tosca Module attribute -> selector property, Tosca Reusable StepBlock -> page object / fixture, Tosca ScratchBook -> `.env` file. **Must include**: Intent API to SAP transaction code mapping callout (e.g., ME21N -> `procurement.createPurchaseOrder()`). Team workflow transition from Tosca Commander to Git not addressed — add sidebar note. |
| Acceptance | 25-row concept mapping table, side-by-side examples, team workflow transition note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

#### 7.13 P3-020: Capabilities & Recipes Guide

| Field      | Value                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P3-020                                                                                                                                                                       |
| Source     | docusaurus-plan #20, master-action-list #30                                                                                                                                  |
| Effort     | 2 days                                                                                                                                                                       |
| Outline    | Discover capabilities via `capabilities.list()`. Select recipes via `recipes.forCapability()`. AI agent usage with `capabilities.forAI()`. Recipe metadata (role, priority). |
| Acceptance | Capability discovery flow documented, recipe selection example                                                                                                               |

**Tier 2 Subtotal**: 5 pages, 14 days

### Product Decisions (3 items)

#### 7.14 P5-PD-001: Evaluate SAP_ACTIVE_SYSTEM Default

| Field      | Value                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| ID         | P5-PD-001                                                                                                      |
| Source     | Phase 6.1 product decisions                                                                                    |
| Effort     | 0.5 day                                                                                                        |
| Decision   | Evaluate whether `SAP_ACTIVE_SYSTEM` should default to `'onprem'` or `'cloud'`                                 |
| Approach   | Analyze deployment patterns of target users. If >50% use BTP, default to `'cloud'`. Otherwise keep `'onprem'`. |
| Acceptance | Decision documented with rationale, config default updated if needed                                           |

#### 7.15 P5-PD-002: Evaluate Session Timeout

| Field      | Value                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-PD-002                                                                                                                    |
| Source     | Phase 6.1 product decisions                                                                                                  |
| Effort     | 0.5 day                                                                                                                      |
| Decision   | Evaluate whether session timeout should be 1800s (30 min) or 3600s (60 min)                                                  |
| Approach   | Benchmark typical SAP test suite durations. If avg suite > 25 min, use 3600s. Consider SAP server-side ICM timeout defaults. |
| Acceptance | Decision documented with rationale, config default updated if needed                                                         |

#### 7.16 P5-PD-003: Evaluate Synonym Scoring Penalty

| Field      | Value                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------- |
| ID         | P5-PD-003                                                                                             |
| Source     | Phase 6.1 product decisions                                                                           |
| Effort     | 0.5 day                                                                                               |
| Decision   | Evaluate whether synonym matching penalty should be 1.0 (no penalty) or 0.9x (10% penalty)            |
| Approach   | Test vocabulary matching accuracy with 50+ SAP terms. Measure false positive rate with both settings. |
| Acceptance | Decision documented with test results, scoring parameter updated if needed                            |

**Product Decisions Subtotal**: 3 items, 1.5 days

**Sub-Phase 7.2 Totals**: 16 items, 27.5 days

---

## 8. Sub-Phase 7.3 — Architecture Hardening + Integration Tests + AI Readiness

**Scope**: Integration tests, deferred architecture items, WebComponent evaluation, design decision completion
**Duration**: 5 weeks (20 working days)
**Gate**: INT1/INT2 pass against SAP demo apps, architecture decisions documented, GitHub issue #7 closed

### 8.1 INT1: Bridge Integration Smoke Tests

| Field      | Value                                                                                                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | INT1                                                                                                                                                                                                                                                                                                                         |
| Source     | Phase 2 deferred, GitHub issue #7 (parent)                                                                                                                                                                                                                                                                                   |
| Effort     | 3 days                                                                                                                                                                                                                                                                                                                       |
| File       | `tests/integration/bridge-smoke.spec.ts` (165 LOC partially written)                                                                                                                                                                                                                                                         |
| Outline    | Complete the partially-written bridge smoke tests. Test against SAP Fiori demo apps (publicly accessible). Verify: bridge injection, `waitForUI5Ready()`, control discovery via selector engine, property retrieval, method invocation.                                                                                      |
| SAP Apps   | Primary: SAP Fiori Demo Kit (`https://sapui5.hana.ondemand.com/test-resources/sap/m/demokit/`). Fallback: local CAP mock server with `ui5 serve`.                                                                                                                                                                            |
| PW Config  | `tests/integration/playwright.config.ts` with: `baseURL` from env, `timeout: 60000`, `retries: 1`, `use: { trace: 'on-first-retry' }`. Worker-scoped fixtures for bridge injection.                                                                                                                                          |
| Test Cases | (1) Bridge injects successfully (timing: <500ms). (2) `ui5=` selectors resolve controls. (3) Properties retrieved correctly (string, boolean, number types). (4) Methods execute without error (press, getText). (5) Error path: invalid selector returns typed error. (6) Timing bound: all operations complete within 10s. |
| Deps       | SAP demo app URL (publicly accessible). Prereq: ui5= selector engine (verified complete, Appendix E).                                                                                                                                                                                                                        |
| Acceptance | All 6 test cases pass. Assertion inventory: >=10 assertions across test cases.                                                                                                                                                                                                                                               |

### 8.2 INT2: Proxy + SAP Cloud Smoke Tests

| Field      | Value                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | INT2                                                                                                                                                                                                                                                                                                                                                    |
| Source     | Phase 2 deferred, GitHub issue #7 (parent)                                                                                                                                                                                                                                                                                                              |
| Effort     | 3 days                                                                                                                                                                                                                                                                                                                                                  |
| File       | `tests/integration/proxy-smoke.spec.ts` (new)                                                                                                                                                                                                                                                                                                           |
| Outline    | Full proxy + SAP cloud verification. Test against SAP BTP demo app (same as E2E gold standard). Verify: typed proxy creation, aggregation traversal, UI5Object proxy chain, model access, return type handling (all 7 types).                                                                                                                           |
| SAP Apps   | Primary: SAP BTP BOM Maintenance app (same as gold standard). Secondary: SAP Fiori Reference Apps on BTP trial. For BTP WorkZone testing: verify iframe auth handling.                                                                                                                                                                                  |
| PW Config  | Same integration config as INT1. Auth via `storageState` from setup project. `page.route()` OData mocking as fallback for offline CI.                                                                                                                                                                                                                   |
| Test Cases | (1) Typed proxy resolves from `ui5.control()`. (2) Aggregation returns sub-proxies (table rows). (3) UI5Object model access works (`getProperty`, `setProperty`). (4) All 7 return types handled (empty, result, element, newElement, aggregation, object, none). (5) Error path: proxy method on disposed control. (6) BTP WorkZone iframe navigation. |
| Deps       | SAP BTP app URL, auth credentials. INT1 (bridge must work first).                                                                                                                                                                                                                                                                                       |
| Acceptance | All 6 test cases pass. Assertion inventory: >=12 assertions across test cases.                                                                                                                                                                                                                                                                          |

### 8.3 P4-013: Evaluate Dry-Run/Preview Capability

| Field      | Value                                                                                                                                                                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P4-013                                                                                                                                                                                                                                                                                                      |
| Source     | agent-operability A5.29 (both plugins FAIL)                                                                                                                                                                                                                                                                 |
| Effort     | 1 day (evaluation) + 5 days (implementation, if justified)                                                                                                                                                                                                                                                  |
| Outline    | Evaluate whether dry-run capability is feasible given Playwright's test runner model. Options: (a) `--dry-run` flag intercepting Playwright runner (brittle), (b) parallel execution model (high risk), (c) test listing via `--list` + action preview via logging (low risk). Recommend option (c) if any. |
| Acceptance | Decision documented as ADR. If implemented: `--dry-run` outputs planned actions without executing.                                                                                                                                                                                                          |

### 8.4 P4-016: Evaluate Circuit Breaker Pattern

| Field      | Value                                                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P4-016                                                                                                                                                                                                                                                                    |
| Source     | agent-operability B8.10 (Partial)                                                                                                                                                                                                                                         |
| Effort     | 1 day (evaluation) + 2–3 days (implementation, if justified)                                                                                                                                                                                                              |
| Outline    | Evaluate whether circuit breaker adds value beyond Playwright's built-in `retries` and test timeout. Criteria: (1) Are there real-world scenarios of repeated failures to same SAP system? (2) Does Playwright's retry mechanism suffice? (3) What's the complexity cost? |
| Acceptance | Decision documented as ADR. If implemented: circuit opens after N failures, half-open probe after timeout.                                                                                                                                                                |

### 8.5 P4-018: Evaluate Graceful Shutdown Handling

| Field      | Value                                                                                                                                                                                                                         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P4-018                                                                                                                                                                                                                        |
| Source     | agent-operability B2.4 (Partial for both)                                                                                                                                                                                     |
| Effort     | 1 day (evaluation) + 1–2 days (implementation, if justified)                                                                                                                                                                  |
| Outline    | Evaluate whether explicit signal handlers (SIGINT/SIGTERM) add value beyond Playwright's native shutdown. Verify that fixture teardown (`use()` finally blocks) runs correctly during Playwright shutdown. Document findings. |
| Acceptance | Decision documented as ADR. If implemented: signal handlers registered, pending ops cancelled via AbortController.                                                                                                            |

### 8.6 WebComponent Support Evaluation

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | WC-EVAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Source     | Phase 2 deferred, D3 removal in Phase 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Effort     | 3 days (evaluation + prototype)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Outline    | Evaluate SAP UI5 Web Components support via new approach (not adapter pattern). Options: (a) Playwright `>>` shadow DOM combinator for piercing Shadow DOM — specifics: `page.locator('ui5-button >> text=Save')` chains through shadow roots, `page.locator('ui5-input >> input')` accesses inner native input. (b) Custom selector engine extension for `ui5wc=` prefix. (c) Hybrid approach with detection. Prototype the most promising approach. **Note**: `>>` combinator pierces one shadow root level; for deeply nested WC (e.g., `ui5-table >> ui5-table-row >> ui5-table-cell`), multiple `>>` are needed. |
| Acceptance | Decision documented as ADR. Prototype demonstrates at least: button click, input fill, select value in Web Component context.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

### 8.7 Registry Discovery Strategy Evaluation

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | REG-EVAL                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Source     | Phase 2 deferred (registry was no-op in v2.5.0)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Outline    | Evaluate if `registry` discovery strategy adds value beyond the current 3-tier discovery (Registry -> ID -> RecordReplay). In dhikraft v2.5.0, registry was a no-op. Determine if SAP UI5's `sap.ui.core.Element.registry` API offers advantages over `sap.ui.getCore().byId()`. **Scope clarification**: this evaluates the Tier 1 "Registry" slot in the 3-tier discovery chain, NOT the Tier 2 `bulk-discovery.ts` registry scan that already exists. The Tier 2 scan enumerates all controls; this Tier 1 slot is about resolving a single control by ID via registry API. |
| Acceptance | Decision documented. Either implement registry strategy or formally remove from discovery-factory.ts with code cleanup.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

### 8.8 D26: UI5Object AI Introspection

| Field      | Value                                                                                                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | D26                                                                                                                                                                                                                                                                                                                          |
| Source     | Design Decision D26, plan.md R8 review (⏳ NOT IMPLEMENTED)                                                                                                                                                                                                                                                                  |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                       |
| Outline    | Add AI introspection methods to UI5Object: `describe()` (returns human-readable description), `suggestOperations()` (returns available operations with parameters), `getAIContext()` (returns structured context for AI agents). These enable AI agents to discover what they can do with a UI5 model/router/binding object. |
| Acceptance | (1) `describe()` returns readable text. (2) `suggestOperations()` returns typed operation list. (3) `getAIContext()` returns AI-consumable JSON. (4) Unit tests cover all 3 methods.                                                                                                                                         |

### 8.9 D20 Verification: ~~Object Map Cleanup~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** Wired in core-fixtures.ts:246-254 and module-fixtures.ts:350. See Appendix E for audit evidence.

### 8.10 D5 Completion: L4 AI Telemetry

| Field      | Value                                                                                                                                                                                                                                      |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | D5-L4                                                                                                                                                                                                                                      |
| Source     | plan.md R8 review (D5 marked 🔄 PARTIAL — L4 AI telemetry ⏳)                                                                                                                                                                              |
| Effort     | 1 day                                                                                                                                                                                                                                      |
| Outline    | Complete the 4-layer observability stack. L1 `test.step()` ✅ (Phase 6). L2 pino ✅. L3 OTel ✅. L4 AI telemetry — add token usage tracking, response latency, model selection metrics to AI handler operations via OTel spans/attributes. |
| Acceptance | AI handler operations emit OTel spans with token/latency/model attributes.                                                                                                                                                                 |

### Agent Operability Hardening (10 items)

Items identified by Agent Operability Report (2026-02-21) that require code changes to move from FRICTION/PARTIAL to PASS/FOLLOWS.

#### 8.11 AO-001: .d.ts Navigability + .claudeignore Update

| Field      | Value                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | AO-001 (merged with AO-008)                                                                                                                                                                                                                                                                                                                       |
| Source     | agent-operability A1.5 (FRICTION), B6.2 (PARTIAL)                                                                                                                                                                                                                                                                                                 |
| Effort     | 0.5 day                                                                                                                                                                                                                                                                                                                                           |
| Outline    | Add `src/core/types/controls.ts` to `.claudeignore` (5,802-line generated file pollutes AI agent context). Add a concise API surface summary comment header in `src/index.ts` listing major export categories with cross-references to sub-path entry files. (Absorbs former AO-008 scope — both items targeted the same `.claudeignore` update.) |
| Acceptance | `.claudeignore` excludes controls.ts, `src/index.ts` header comment lists all 6 export areas with sub-path pointers                                                                                                                                                                                                                               |

#### 8.12 AO-002: Stack Trace Cleanup

| Field      | Value                                                                                                                                                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | AO-002                                                                                                                                                                                                                                                                                                                           |
| Source     | agent-operability A4.25 (FRICTION)                                                                                                                                                                                                                                                                                               |
| Effort     | 0.5 day                                                                                                                                                                                                                                                                                                                          |
| Outline    | Add `Error.captureStackTrace(this, this.constructor)` to PramanError constructor (guarded by `typeof Error.captureStackTrace === 'function'` for cross-platform — `captureStackTrace` is V8-specific, not available in Firefox/Safari). This strips internal framework frames from stack traces, making them point to user code. |
| File       | `src/core/errors/base.ts`                                                                                                                                                                                                                                                                                                        |
| Test File  | `tests/unit/core/errors/base.test.ts`                                                                                                                                                                                                                                                                                            |
| Test Spec  | Verify stack trace starts at caller site. Cross-platform guard: test that non-V8 environments (where `captureStackTrace` is undefined) still produce valid error objects without crashing.                                                                                                                                       |
| Acceptance | Stack traces from PramanError subclasses start at user call site, not inside error constructor. Unit test verifies stack filtering and cross-platform guard.                                                                                                                                                                     |

#### 8.13 AO-003: Lifecycle Hooks

| Field          | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID             | AO-003                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Source         | agent-operability A8.46 (FRICTION)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Effort         | 3 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Outline        | Add `PramanHooks` typed EventEmitter with lifecycle events: `beforeControl`, `afterControl`, `beforeNavigation`, `afterNavigation`, `onError`. Wire into core-fixtures as an opt-in fixture (`pramanHooks`). Consumers can subscribe to events without modifying source. Uses Node.js `EventEmitter` with typed event map.                                                                                                                                                                                                                                          |
| Files          | `src/core/hooks.ts` (new), `src/fixtures/core-fixtures.ts` (wire hooks fixture)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Test File      | `tests/unit/core/hooks.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Test Scenarios | Per event: (1) `beforeControl` — fires with selector context before `ui5.control()`. (2) `afterControl` — fires with result after successful control op. (3) `beforeNavigation` — fires with URL/intent before nav. (4) `afterNavigation` — fires after nav complete. (5) `onError` — fires with PramanError on any failure. **Additional**: (6) Listener leak test — verify no MaxListenersExceededWarning when adding 11+ listeners. (7) Async listener test — verify async callbacks are awaited. (8) Consumer example: custom logging hook that writes to file. |
| Coverage       | Tier 2 (core infrastructure) — add to `vitest.config.ts` coverage thresholds.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Acceptance     | (1) `pramanHooks.on('beforeControl', cb)` fires before control operations. (2) Events include relevant context (selector, result, error). (3) Unit tests cover all 5 events + leak + async scenarios. (4) Documentation example shows custom logging hook.                                                                                                                                                                                                                                                                                                          |

#### 8.14 AO-004: Template Literal Types — SCOPE REDUCED

| Field      | Value                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | AO-004                                                                                                                                                                                                                                           |
| Source     | agent-operability B3.6 (PARTIAL)                                                                                                                                                                                                                 |
| Effort     | 0.5 day                                                                                                                                                                                                                                          |
| Outline    | `UI5ControlTypeName` (`sap.${string}`) already exists. Remaining: add `ODataPath = '/${string}'` and `SemanticObjectAction = '${string}-${string}'`. Reduce scope to 2 new types, not 3. Update relevant function signatures to use these types. |
| File       | `src/core/types/selectors.ts`, `src/core/types/branded.ts`                                                                                                                                                                                       |
| Test File  | `tests/unit/core/types/template-literals.types.test.ts` (type-level test using `*.types.test.ts` naming convention)                                                                                                                              |
| Test Spec  | Use `expectTypeOf<'sap.m.Button'>().toExtend<UI5ControlType>()` pattern (not deprecated `toMatchTypeOf`). Verify: valid strings accepted, invalid strings rejected at compile time.                                                              |
| Acceptance | TypeScript compiler catches invalid OData path and semantic object strings. Type-level test file passes.                                                                                                                                         |
| Audit Note | `UI5ControlTypeName` as `sap.${string}` already exists — only 2 new types needed.                                                                                                                                                                |

#### 8.15 AO-005: Exhaustive Switch Audit

| Field      | Value                                                                                                                                                                                                                                                                                    |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | AO-005                                                                                                                                                                                                                                                                                   |
| Source     | agent-operability B3.8 (PARTIAL)                                                                                                                                                                                                                                                         |
| Effort     | 0.5 day                                                                                                                                                                                                                                                                                  |
| Outline    | Audit all `switch` statements across `src/`. Add `default: assertNever(x)` exhaustive check to every switch on discriminated union types. `assertNever` utility already exists at `src/core/utils/assert-never.ts`. Currently only one switch (`src/core/config/loader.ts:103`) uses it. |
| Acceptance | Every switch on a union/enum type has exhaustive default, `npm run typecheck` passes                                                                                                                                                                                                     |

#### 8.16 AO-006: Branded Types Expansion

| Field      | Value                                                                                                                                                                                                                                                                                                |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | AO-006                                                                                                                                                                                                                                                                                               |
| Source     | agent-operability B3.9 (PARTIAL)                                                                                                                                                                                                                                                                     |
| Effort     | 0.5 day                                                                                                                                                                                                                                                                                              |
| Outline    | Expand branded types beyond current 5 (`ControlId`, `ViewName`, `BindingPath`, `SemanticObject`, `EntitySetName`). Add: `CSSSelector` (CSS selector strings), `XPathSelector` (XPath expressions), `ODataUrl` (OData service base URL), `AppId` (Fiori app ID). Add corresponding factory functions. |
| File       | `src/core/types/branded.ts`                                                                                                                                                                                                                                                                          |
| Acceptance | New branded types exported from main entry, factory functions documented with `@example`                                                                                                                                                                                                             |

#### 8.17 AO-007: Type Assertion Reduction — SCOPE REDUCED

| Field      | Value                                                                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | AO-007                                                                                                                                                                                                                                                                                           |
| Source     | agent-operability B3.11 (PARTIAL)                                                                                                                                                                                                                                                                |
| Effort     | 1 day                                                                                                                                                                                                                                                                                            |
| Outline    | Add `SapWindow` and `HasherWindow` global type augmentations in an ambient declaration file to eliminate `window as unknown as SapWindow`/`HasherWindow` patterns (currently 5 instances, reduced from originally estimated 8). Use `declare global { interface Window { sap?: ... } }` pattern. |
| File       | `src/core/types/sap-globals.d.ts` (new ambient declaration)                                                                                                                                                                                                                                      |
| Type       | **REFACTOR** — no new tests needed. Verification: `npm run typecheck` + `npm run test:unit` (existing tests must still pass). No RED phase.                                                                                                                                                      |
| Acceptance | All `as unknown as SapWindow` patterns replaced with direct `window.sap` access, `npm run typecheck` passes, existing tests pass                                                                                                                                                                 |
| Audit Note | Instance count reduced from 8 to 5 after source code audit. Still needed but smaller scope.                                                                                                                                                                                                      |

#### 8.18 ~~AO-008: .claudeignore Update~~ — MERGED INTO AO-001

> **Merged into AO-001** (Section 8.11). Both items targeted the same `.claudeignore` update for `src/core/types/controls.ts`. Scope absorbed into AO-001 to eliminate duplication.

#### 8.19 AO-009: Auto-Pagination

| Field      | Value                                                                                                                                                                                                                                                                                          |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | AO-009                                                                                                                                                                                                                                                                                         |
| Source     | agent-operability B8.4 (PARTIAL)                                                                                                                                                                                                                                                               |
| Effort     | 1 day                                                                                                                                                                                                                                                                                          |
| Outline    | Add `queryAllEntities()` helper in `src/modules/odata-http.ts` that auto-paginates OData responses. Supports `$skiptoken`-based server-driven paging (OData V4) and `$skip+$top` client-driven paging (OData V2). Returns async iterable or collected array. Respects `maxPages` safety limit. |
| File       | `src/modules/odata-http.ts`                                                                                                                                                                                                                                                                    |
| Test File  | `tests/unit/modules/odata-http.test.ts`                                                                                                                                                                                                                                                        |
| Mock       | Use `vi.fn()` mocks (not msw). Mock OData V4 response shape: `{ value: [...], "@odata.nextLink": "...?$skiptoken=abc" }`. Mock OData V2 response shape: `{ d: { results: [...], __next: "...?$skip=20&$top=20" } }`. Mock empty final page (no nextLink). Mock maxPages exceeded.              |
| Coverage   | Tier 3 (modules) — add to `vitest.config.ts` if new file.                                                                                                                                                                                                                                      |
| Acceptance | (1) Auto-paginates V4 `$skiptoken` responses. (2) Falls back to `$skip+$top` loop. (3) `maxPages` limit prevents infinite loops. (4) Unit tests with mocked V2 and V4 response shapes.                                                                                                         |

#### 8.20 AO-010: Server-Side HTTP Client

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | AO-010                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Source     | agent-operability B8.7 (PARTIAL)                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Outline    | Add `createHttpClient()` wrapper around Node.js `fetch` for server-side OData calls (not through browser). Features: configurable timeout via `AbortController`, automatic retry via existing `retry()` utility, proper error wrapping as `ODataError`, JSON parsing with validation. Used for direct OData service calls outside Playwright browser context. Error codes: `ERR_HTTP_TIMEOUT`, `ERR_HTTP_NETWORK`, `ERR_HTTP_STATUS` (4xx/5xx), `ERR_HTTP_PARSE` (invalid JSON). |
| File       | `src/modules/http-client.ts` (new)                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Test File  | `tests/unit/modules/http-client.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Mock       | Use `vi.fn()` to mock global `fetch` (not msw). Mock scenarios: success, timeout (AbortError), network error, 4xx response, 5xx response, invalid JSON body.                                                                                                                                                                                                                                                                                                                     |
| Deps       | `src/core/utils/retry.ts` (existing retry utility)                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Coverage   | Tier 3 (modules) — add to `vitest.config.ts` coverage thresholds for new file.                                                                                                                                                                                                                                                                                                                                                                                                   |
| Acceptance | (1) `createHttpClient()` returns typed client. (2) Timeout via AbortController. (3) Retry with backoff. (4) ODataError on failure with correct error code. (5) Unit tests with mocked fetch covering all 6 scenarios.                                                                                                                                                                                                                                                            |

### AI Readiness Improvements (2 remaining items — 4 verified complete in audit)

Items identified by AI Readiness Assessment Report (2026-02-21) to improve praman's AI-readiness score from 38.9/40 → 39.5+/40. After source code audit, AI-001, AI-003, AI-004, AI-005 were verified as already implemented (see Appendix E).

#### 8.21 AI-001: ~~Recipe Metadata System~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** RecipeRole, RecipePriority, selectByRole(), selectByPriority(), selectByCategory() all exist and are exported. See Appendix E for audit evidence.

#### 8.22 AI-002: Provider-Specific Capability Formatting — SCOPE REDUCED

| Field      | Value                                                                                                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | AI-002                                                                                                                                                                                                |
| Source     | AI Readiness Report §5.1.3, dhikraft `capabilities.forAI({ provider })` pattern                                                                                                                       |
| Effort     | 0.5 day (reduced from 1 — forProvider() already exists on CapabilityRegistry)                                                                                                                         |
| Outline    | `forProvider()` exists on CapabilityRegistry (line 259) with claude/openai/gemini support. Remaining: (1) expose on `capabilities` singleton, (2) evaluate if 'anthropic' should be 'claude' or both. |
| File       | `src/ai/capabilities/`                                                                                                                                                                                |
| Acceptance | `capabilities.forAI({ provider: 'claude' })` accessible via singleton. Provider naming decision documented.                                                                                           |
| Audit Note | Core implementation exists. Remaining work is wiring to public API and naming evaluation.                                                                                                             |

#### 8.23 AI-003: ~~Standalone Discovery API (`ui5.inspect`)~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** inspect() method fully implemented at ui5-handler.ts:600-671 with @ui5Step decoration. See Appendix E for audit evidence.

#### 8.24 AI-004: ~~Add `@ai` TSDoc Tags to Public Fixture Methods~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** 65+ @ai tags already applied across all fixture files. See Appendix E for audit evidence.

#### 8.25 AI-005: ~~Verify/Add Jitter in Retry Utility~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** Math.random() jitter at retry.ts:73, enabled by default. See Appendix E for audit evidence.

#### 8.26 AI-006: Audit/Reduce `any` Type Occurrences

| Field      | Value                                                                                                                                                                                                                                                                                                                               |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | AI-006                                                                                                                                                                                                                                                                                                                              |
| Source     | AI Readiness Report §3.2, §4.2 (55 `any` occurrences identified)                                                                                                                                                                                                                                                                    |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                              |
| Outline    | Audit all 55 `any` type occurrences across the codebase. For `page.evaluate()` return values, replace with explicit return type annotations. For third-party API boundaries, replace with `unknown` + type assertion after validation. Target: reduce from 55 to ≤20. All remaining `any` must have `eslint-disable` justification. |
| File       | Multiple files across `src/`                                                                                                                                                                                                                                                                                                        |
| Type       | **REFACTOR** — no new tests needed. Verification: `npm run typecheck` + `npm run test:unit` (existing tests must still pass). No RED phase.                                                                                                                                                                                         |
| Acceptance | `any` count reduced to ≤20. All remaining have justification comments. `npm run typecheck` passes. Existing tests pass.                                                                                                                                                                                                             |

### Code Quality Improvements (1 remaining item — CQ-001 unnecessary, CQ-002 verified complete)

Items identified by AI Readiness Assessment Report for code quality improvements. After source code audit, CQ-001 was determined unnecessary (flags don't exist in rewrite) and CQ-002 was verified complete (separators exist). See Appendix E/F.

#### 8.27 CQ-001: ~~Replace Boolean Flags in table.ts~~ — DETERMINED UNNECESSARY

> **Moved to Appendix F.** The flags `includeHeaders`, `returnRawValues`, `waitForData`, `scrollToRow` do NOT exist in the current ground-up rewrite. Only `skipStabilityWait?: boolean` exists, which is clear and unambiguous. No refactoring needed. See Appendix F for full explanation.

#### 8.28 CQ-002: ~~Add Section Separators to dialog.ts~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** Three section separators already exist in dialog.ts. See Appendix E for audit evidence.

#### 8.29 CQ-003: Replace `console.log` in TSDoc `@example` Blocks — SCOPE REDUCED

| Field      | Value                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | CQ-003                                                                                                                                                     |
| Source     | AI Readiness Report §3.5 (Debuggability gap)                                                                                                               |
| Effort     | 0.1 day (reduced from 0.5 — only 2-3 files in src/cli/ need cleanup)                                                                                       |
| Outline    | Console.log in CLI files is appropriate for terminal output. Scope reduced to just @example block cleanup in 2-3 CLI files. Minimal effort.                |
| File       | 2-3 files in `src/cli/`                                                                                                                                    |
| Acceptance | @example blocks in CLI files use appropriate output methods.                                                                                               |
| Audit Note | Original estimate of 24 files was based on pre-rewrite codebase. Console.log in @example blocks of non-CLI code is acceptable for demonstrating API usage. |

**Sub-Phase 7.3 Totals**: 21 items, 28.1–38.1 days (was 29 items, 35.75–43.75 days — 7 items verified complete/unnecessary in audit, 2 items scope-reduced, AO-008 merged into AO-001). Note: range reflects P4-013 total 1-6d, P4-016 total 1-4d, P4-018 total 1-3d (eval-only vs eval+implementation).

---

## 9. Sub-Phase 7.4 — Advanced Documentation + AI/SAP Ecosystem (Tier 3 + Tier 4)

**Scope**: 8 advanced topic pages + 5 reference pages + 7 P5 doc items + Codegen evaluation + lower-priority code items
**Duration**: 5 weeks (21 working days)
**Gate**: All 23 documentation pages complete (13 Tier 3+4 + 8 P5 docs + DOC-001 + DOC-002), all P5 doc items done, lower-priority code items complete
**NOTE**: API Reference auto-generated via TypeDoc/API Extractor. Business Process Examples auto-generated from recipe templates where possible.

### Tier 3: Advanced Topics (8 pages)

#### 9.1 P3-021: Architecture Overview

| Field   | Value                                                                                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P3-021                                                                                                                                                               |
| Source  | docusaurus-plan #21                                                                                                                                                  |
| Effort  | 2 days                                                                                                                                                               |
| Outline | 5-layer diagram: Core → Bridge → Proxy → Fixtures → AI. Layer dependency rules. Sub-path exports. Design decisions summary (D1–D29). Module decomposition rationale. |

#### 9.2 P3-022: Bridge Internals

| Field   | Value                                                                                                                                                                                                                              |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P3-022                                                                                                                                                                                                                             |
| Source  | docusaurus-plan #22                                                                                                                                                                                                                |
| Effort  | 2 days                                                                                                                                                                                                                             |
| Outline | Bridge injection via `page.evaluate()`. Serialization constraints (fn.toString()). Stability checks (`waitForUI5Stable`). Frame navigation (WorkZone dual-frame). `__praman_getById()` resolver (D19). Object map lifecycle (D20). |

#### 9.3 P3-023: AI Integration

| Field   | Value                                                                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID      | P3-023                                                                                                                                                                                           |
| Source  | docusaurus-plan #23                                                                                                                                                                              |
| Effort  | 2 days                                                                                                                                                                                           |
| Outline | `AiResponse<T>` envelope. Provider abstraction (Azure OpenAI, OpenAI, Anthropic). `AgenticCheckpoint`. `toAIContext()`. Token-aware metadata. SKILL.md generation. Capability/recipe registries. |

#### 9.4 P3-024: Fiori Elements (FE) Testing

| Field   | Value                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID      | P3-024                                                                                                                                                                                                                                                                                                                                                                                                 |
| Source  | docusaurus-plan #24, master-action-list #25                                                                                                                                                                                                                                                                                                                                                            |
| Effort  | 2 days                                                                                                                                                                                                                                                                                                                                                                                                 |
| Outline | `playwright-praman/fe` sub-path. ListReport, ObjectPage. Table operations. Given/When/Then proxy. FE browser scripts. FE test library integration. **Must include**: Queue drain semantics clarification — explain whether FE operations use per-action flush (each action waits for UI5 stable) or batch flush (queue multiple actions, flush once). Document the chosen approach and its trade-offs. |

#### 9.5 P3-025: Intent API

| Field   | Value                                                                                                                                                                                              |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P3-025                                                                                                                                                                                             |
| Source  | docusaurus-plan #25, master-action-list #30                                                                                                                                                        |
| Effort  | 2 days                                                                                                                                                                                             |
| Outline | `playwright-praman/intents` sub-path. Core wrappers. 5 domain intent APIs: procurement (MM), sales (SD), finance (FI), manufacturing (PP), master data (MD). Intent resolution, parameter mapping. |

#### 9.6 P3-026: Vocabulary System

| Field   | Value                                                                                                                                              |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P3-026                                                                                                                                             |
| Source  | docusaurus-plan #26                                                                                                                                |
| Effort  | 1 day                                                                                                                                              |
| Outline | `playwright-praman/vocabulary` sub-path. 6 SAP domain JSON files. Normalization. Synonym matching (fuzzy). Custom vocabularies. Scoring algorithm. |

#### 9.7 P3-027: Docker & CI/CD

| Field   | Value                                                                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P3-027                                                                                                                                              |
| Source  | docusaurus-plan #27, master-action-list #23                                                                                                         |
| Effort  | 1 day                                                                                                                                               |
| Outline | Dockerfile for running tests. GitHub Actions YAML with 3-OS matrix. `npm run ci` breakdown. Docker Compose for local SAP mock. Artifact management. |

#### 9.8 P3-028: Debugging & Troubleshooting

| Field   | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P3-028                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Source  | docusaurus-plan #28                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Effort  | 2 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Outline | Pino log levels (`PRAMAN_LOG_LEVEL`). Playwright trace viewer. OpenTelemetry integration. `toUserMessage()`. `toAIContext()`. Common issues and resolutions. Diagnostic checklist. **Must include**: (a) Trace viewer limitations with praman: bridge `page.evaluate()` calls appear as opaque "evaluate" entries in trace; document how to correlate with pino logs via timestamps. (b) Log level mapping note: `verbose` maps to pino `debug` level (not `trace`). (c) Video recording config for SAP apps: recommend `video: 'on-first-retry'` (not `'on'`) to avoid large artifacts. |

**Tier 3 Subtotal**: 8 pages, 14 days

### Tier 4: Reference & Examples (5 pages)

#### 9.9 P3-029: API Reference (Auto-Generated)

| Field   | Value                                                                                                                                              |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P3-029                                                                                                                                             |
| Source  | docusaurus-plan #29, master-action-list #2                                                                                                         |
| Effort  | 3 days                                                                                                                                             |
| Outline | TypeDoc or API Extractor output deployed to `/api` route. All 6 sub-path exports documented. Cross-references between modules. Search integration. |

#### 9.10 P3-030: Business Process Examples

| Field   | Value                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P3-030                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Source  | docusaurus-plan #30, master-action-list #29, Agent 6 #49 (cross-process chain)                                                                                                                                                                                                                                                                                                                                                          |
| Effort  | 6 days (expanded from 5 — added cross-process E2E tutorial)                                                                                                                                                                                                                                                                                                                                                                             |
| Outline | Purchase Order (ME21N/Fiori), Sales Order (VA01/Fiori), Journal Entry (FB50/Fiori), Production Order (CO01/Fiori). Complete runnable tests for each. **Added**: Purchase-to-Pay (P2P) cross-process E2E tutorial — end-to-end chain: Purchase Requisition -> Purchase Order -> Goods Receipt -> Invoice Receipt -> Payment. Demonstrates `test.step()` for multi-process flow, shared test data across steps, cleanup in reverse order. |
| Deps    | P3-018 (Playwright Primer), P3-008 (Interactions)                                                                                                                                                                                                                                                                                                                                                                                       |

#### 9.11 P3-031: SAP Control Cookbook

| Field   | Value                                                                                                                                                                                                                                                                                                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P3-031                                                                                                                                                                                                                                                                                                   |
| Source  | docusaurus-plan #31                                                                                                                                                                                                                                                                                      |
| Effort  | 6 days (expanded from 5 — added 5 additional controls)                                                                                                                                                                                                                                                   |
| Outline | SmartField, SmartTable, SmartFilterBar, OverflowToolbar, IconTabBar, ObjectPageLayout. **Added per wdi5 persona**: ComboBox, MultiComboBox, MultiInput, Select, DatePicker. For each: description, typical use case, selector example, interaction example, common pitfalls. Total: 11 controls covered. |

#### 9.12 P3-032: SAP Transaction Mapping

| Field   | Value                                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ID      | P3-032                                                                                                                         |
| Source  | docusaurus-plan #32, master-action-list #48                                                                                    |
| Effort  | 3 days                                                                                                                         |
| Outline | 50+ SAP transaction codes → Fiori apps → praman fixtures and intents. Searchable table. Links to relevant documentation pages. |

#### 9.13 P3-033: Gold Standard Test Pattern

| Field     | Value                                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID        | P3-033                                                                                                                                                                                           |
| Source    | docusaurus-plan #33                                                                                                                                                                              |
| Effort    | 2 days                                                                                                                                                                                           |
| Outline   | Complete example test demonstrating all best practices: `test.step()`, fixtures, selectors, matchers, error handling, auth, navigation, data cleanup. Reference implementation for all personas. |
| Reference | `tests/e2e/sap-cloud/bom-e2e-gold-standard.spec.ts` (existing, 6 steps)                                                                                                                          |

**Tier 4 Subtotal**: 5 pages, 20 days

### P5 Documentation Items (8 items)

#### 9.14 P5-005: Accessibility Testing with @axe-core/playwright

| Field   | Value                                                                                                                                                                                                 |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P5-005                                                                                                                                                                                                |
| Source  | agent-operability B5.10 (Partial)                                                                                                                                                                     |
| Effort  | 0.5 day                                                                                                                                                                                               |
| Outline | Documentation page covering `@axe-core/playwright` usage with SAP apps. ARIA roles in UI5 controls. Known SAP UI5 accessibility considerations. No custom code — use `@axe-core/playwright` directly. |

#### 9.15 P5-006: SAP Activate Methodology Alignment

| Field   | Value                                                                                                                                                                     |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P5-006                                                                                                                                                                    |
| Source  | agent-operability B12.1 (Partial)                                                                                                                                         |
| Effort  | 2 days                                                                                                                                                                    |
| Deps    | P3-030 (Business Process Examples)                                                                                                                                        |
| Outline | Map praman test patterns to SAP Activate phases (Discover, Prepare, Explore, Realize, Deploy, Run). Test strategy per phase. Which fixtures/features apply at each stage. |

#### 9.16 P5-007: POST Upgrade Test Readiness

| Field   | Value                                                                                                                                            |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID      | P5-007                                                                                                                                           |
| Source  | agent-operability B12.4 (Partial)                                                                                                                |
| Effort  | 1 day                                                                                                                                            |
| Outline | Guide for using praman in SAP upgrade validation. Config presets for upgrade testing. Regression test suite design. Version comparison patterns. |

#### 9.17 P5-011: OData Mocking with page.route()

| Field   | Value                                                                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P5-011                                                                                                                                                                                      |
| Source  | agent-operability B9.9 (Partial)                                                                                                                                                            |
| Effort  | 1 day                                                                                                                                                                                       |
| Outline | Playwright `page.route()` for OData mocking. Examples: entity set, single entity, error responses, `$batch`. CAP mock server integration for complex scenarios. No custom mock server code. |

#### 9.18 P5-012: Component Testing with webServer

| Field   | Value                                                                                                                                                             |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID      | P5-012                                                                                                                                                            |
| Source  | agent-operability B9.12 (Partial)                                                                                                                                 |
| Effort  | 1 day                                                                                                                                                             |
| Outline | Playwright `webServer` config with `ui5 serve`. Minimal HTML bootstrapper for isolated UI5 component testing without FLP. Example `playwright.config.ts` snippet. |

#### 9.19 P5-013: Cross-Browser SAP Testing Patterns

| Field   | Value                                                                                                                                                                                      |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID      | P5-013                                                                                                                                                                                     |
| Source  | agent-operability B11.9 (Partial)                                                                                                                                                          |
| Effort  | 0.5 day                                                                                                                                                                                    |
| Outline | Playwright `projects` config for multi-browser. Known SAP UI5 cross-browser rendering differences. Browser-specific workarounds. No custom code — use Playwright's built-in multi-browser. |

#### 9.20 P5-015: SAP Best Practice Content Import

| Field   | Value                                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| ID      | P5-015                                                                                                                               |
| Source  | agent-operability B13.6 (Partial)                                                                                                    |
| Effort  | 2 days                                                                                                                               |
| Outline | Documentation and tooling for importing SAP Best Practice Explorer test scope definitions. Mapping test scope to praman test suites. |

#### 9.20a P5-025: Visual Regression Testing with SAP Apps <!-- numbered 9.20a to preserve stable section refs after late addition -->

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | P5-025                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Source     | Agent Review: Agent 6 #4 (missing from master action list)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Outline    | Documentation page covering `toHaveScreenshot()` usage with SAP UI5 apps. SAP-specific considerations: (a) UI5 theme variations (Quartz Light, Quartz Dark, Morning Horizon) affect screenshots. (b) Locale-dependent rendering (dates, numbers, text direction). (c) Recommended `maxDiffPixels` thresholds for SAP apps (UI5 renders with subpixel differences across runs). (d) Masking dynamic content (timestamps, user names, generated IDs) via `mask` option. (e) Full-page vs component screenshots. No custom code — use Playwright's built-in `toHaveScreenshot()`. |
| Acceptance | Documentation page with SAP-specific screenshot testing guidance. 3+ examples with mask configurations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

**P5 Docs Subtotal**: 8 items, 9 days

### P5 Complex Items (1 item in this sub-phase)

#### 9.21 P5-004: SAP-Aware Playwright Codegen

| Field      | Value                                                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-004 (merged with P5-009)                                                                                                                                                                                                                                            |
| Source     | agent-operability B11.2 (Partial)                                                                                                                                                                                                                                      |
| Effort     | 3–5 days                                                                                                                                                                                                                                                               |
| Deps       | P3-018 (Playwright Primer)                                                                                                                                                                                                                                             |
| Outline    | Evaluate Playwright Codegen extension API stability. Phase 1: Build post-processing script that converts recorded `page.locator()` calls to `ui5=` selectors. Phase 2 (future): Full Codegen extension when API stabilizes. Document usage for Tosca-background users. |
| Acceptance | Post-processing script converts 80%+ of common SAP control selectors correctly.                                                                                                                                                                                        |

### P5 SAP Enterprise Items (4 items)

Items identified by Agent Operability Report (2026-02-21) for SAP S/4HANA test automation best practices.

#### 9.22 P5-017: Pre-Delivered Test Automates

| Field      | Value                                                                                                                                                                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | P5-017                                                                                                                                                                                                                                                                                                       |
| Source     | agent-operability B12.2 (PARTIAL)                                                                                                                                                                                                                                                                            |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                       |
| Outline    | Ship pre-built recipe templates for standard SAP business processes: Purchase Order (MM), Sales Order (SD), Journal Entry (FI). Each recipe includes: Given/When/Then steps, required fixtures, expected controls, OData entity sets. Recipes are loaded via `RecipeRegistry` and discoverable by AI agents. |
| Deps       | P3-030 (Business Process Examples)                                                                                                                                                                                                                                                                           |
| Acceptance | (1) 3+ pre-built recipes in `src/ai/recipes/`. (2) `recipes.forProcess('purchase-order')` returns valid recipe. (3) Each recipe has complete step definitions.                                                                                                                                               |

#### 9.23 P5-018: Intelligent Test Scoping

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-018                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Source     | agent-operability B12.5 (PARTIAL)                                                                                                                                                                                                                                                                                                                                                                                         |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Outline    | Documentation page covering intelligent test scoping strategies: (a) ATC change impact analysis integration for identifying affected test suites, (b) tag-based test selection using Playwright `--grep` with recipe/capability tags, (c) dependency graph analysis for determining which tests to re-run after code changes. No custom code — leverage Playwright's built-in `--grep`, `--project`, and tag annotations. |
| Acceptance | Documentation page with 3 scoping strategies, each with runnable example                                                                                                                                                                                                                                                                                                                                                  |

#### 9.24 P5-019: Custom Test Recording

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-019                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Source     | agent-operability B12.6 (PARTIAL)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Effort     | 3 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Deps       | P5-004 (SAP-Aware Codegen — evaluation), INT1 (bridge must work for recorder injection)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Outline    | Browser-side test recorder that captures UI5 control interactions and generates praman test code. Approach: inject recorder script via `page.evaluate()` that hooks into UI5 event delegation (`sap.ui.core.Element.prototype.fireEvent`). Captured events are translated to `ui5=` selectors and praman API calls. Output: `.spec.ts` file with `test.step()` structure. **CRITICAL**: `page.evaluate()` serialization constraint — ALL helper functions MUST be inner function declarations inside the evaluated function. Module-level functions, imports, closures are NOT serialized. Unit tests give FALSE POSITIVES for this (they run in Node.js where module-level functions ARE accessible). See MEMORY.md for details. |
| Acceptance | (1) Recorder captures button press, input fill, select, navigation. (2) Generated code uses `ui5=` selectors. (3) Generated test compiles and runs. (4) Browser script verified with integration test (not just unit test).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

#### 9.25 P5-020: Test Data Framework Enhancement

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-020                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Source     | agent-operability B12.8 (PARTIAL), Agent 5 #3 (TDM gap)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Effort     | 3 days (expanded from 2 — Agent 5 feedback: TDM gap understated)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Outline    | Enhance existing `TestDataHandler` (`src/fixtures/test-data-handler.ts`) with: (a) entity graph builder for creating related test data (e.g., vendor + purchase order + line items in one call), (b) cleanup strategies (LIFO reverse deletion — test that cleanup order is strictly LIFO, soft delete, archive), (c) data snapshot/restore for test isolation, (d) error handling: partial cleanup failure should not abort remaining cleanup — collect errors and report all at end. **Tosca TDM gap note**: data reservation, data aging, synthetic generation, and Excel/CSV import are out of scope for v1.0 but documented as future roadmap items. |
| File       | `src/fixtures/test-data-handler.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Test File  | `tests/unit/fixtures/test-data-handler.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Test Spec  | (1) Graph creation with dependencies. (2) LIFO cleanup order test (entity C created last, deleted first). (3) Partial cleanup failure: if entity B delete fails, entity A delete still attempted. (4) Empty graph cleanup is no-op.                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Acceptance | (1) `testData.createGraph(...)` creates related entities. (2) `testData.cleanup()` removes in LIFO order. (3) Partial failure handled gracefully. (4) Unit tests cover all 4 scenarios.                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

**P5 SAP Enterprise Subtotal**: 4 items, 9 days

### Lower-Priority Code Items (7 remaining items — LP-008 verified complete in audit)

Items from Persona Assessment Report (lower priority) that improve migration, compatibility, and API completeness.

#### 9.26 LP-001: Backward-Compatibility Fixture Aliases

| Field      | Value                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | LP-001                                                                                                                                                                                          |
| Source     | master-action-list #39, persona P1 + P3 (Low)                                                                                                                                                   |
| Effort     | 0.5 day                                                                                                                                                                                         |
| Outline    | Add `auth`, `navigation`, `ui5Assert`, `ui5Interact` fixture aliases in praman for dhikraft users transitioning. Aliases delegate to the praman equivalents (`sapAuth`, `ui5Navigation`, etc.). |
| File       | `src/fixtures/compat-fixtures.ts` (new)                                                                                                                                                         |
| Acceptance | Old fixture names work via aliases. Unit test verifies alias resolution.                                                                                                                        |

#### 9.27 LP-002: Re-Implement FLP Error Classes

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | LP-002                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Source     | master-action-list #41, persona P3 (Low)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Outline    | Add 18 FLP-specific error codes under the `PramanError` hierarchy. Error codes: (1) `ERR_FLP_LOCK_CONFLICT`, (2) `ERR_FLP_LOCK_ACQUIRE_TIMEOUT`, (3) `ERR_FLP_LOCK_RELEASE_FAILED`, (4) `ERR_FLP_SETTINGS_READ`, (5) `ERR_FLP_SETTINGS_WRITE`, (6) `ERR_FLP_SETTINGS_SCHEMA`, (7) `ERR_FLP_TILE_NOT_FOUND`, (8) `ERR_FLP_TILE_NAVIGATION`, (9) `ERR_FLP_TILE_DISABLED`, (10) `ERR_FLP_SEARCH_TIMEOUT`, (11) `ERR_FLP_SEARCH_NO_RESULTS`, (12) `ERR_FLP_CROSS_NAV_FAILED`, (13) `ERR_FLP_CROSS_NAV_TARGET_MISSING`, (14) `ERR_FLP_INTENT_RESOLUTION`, (15) `ERR_FLP_SHELL_NOT_LOADED`, (16) `ERR_FLP_PERSONALIZATION`, (17) `ERR_FLP_ROLE_SWITCH`, (18) `ERR_FLP_IFRAME_TIMEOUT`. Each with proper `retryable` flag and `suggestions[]`. |
| File       | `src/core/errors/flp-error.ts` (new)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Test File  | `tests/unit/core/errors/flp-error.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Coverage   | Tier 1 (error classes) — 100% coverage required per coverage strategy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Acceptance | All 18 FLP error codes implemented as `PramanError` subclasses. Each has unique error code. Unit tests verify hierarchy + `retryable` + `suggestions`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

#### 9.28 LP-003: Global Setup/Teardown Sub-Path Exports

| Field      | Value                                                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID         | LP-003                                                                                                                                                       |
| Source     | master-action-list #45, persona P1 + P3 (Low), GAP-C4                                                                                                        |
| Effort     | 0.5 day                                                                                                                                                      |
| Outline    | Either add global setup/teardown sub-path exports or document the Playwright-native equivalent using `globalSetup`/`globalTeardown` config + `storageState`. |
| File       | `src/index.ts` or documentation only                                                                                                                         |
| Acceptance | Global setup/teardown use case documented or exported.                                                                                                       |

#### 9.29 LP-004: Handler Facade Classes

| Field      | Value                                                                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | LP-004                                                                                                                                                                                                   |
| Source     | master-action-list #46, persona P1 + P3 (Low), GAP-C3                                                                                                                                                    |
| Effort     | 2 days                                                                                                                                                                                                   |
| Outline    | Create handler facade classes or document the fixture migration path from handler classes to fixture destructuring. Helps users who expect class-based handler patterns (e.g., `new AuthHandler(page)`). |
| File       | `src/compat/` or documentation only                                                                                                                                                                      |
| Acceptance | Facade classes or migration documentation available.                                                                                                                                                     |

#### 9.30 LP-005: Document Timeout Configuration — CONVERTED TO DOC ITEM

| Field      | Value                                                                                                                                                           |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | LP-005                                                                                                                                                          |
| Source     | master-action-list #47, persona P1 + P3 (Low), GAP-M8                                                                                                           |
| Effort     | 0.25 day (reduced from 0.5 — converted from code item to documentation item)                                                                                    |
| Outline    | `DEFAULT_TIMEOUTS` already exported. Remaining: document config-based timeout configuration as the equivalent of `configureTimeouts()`. No code changes needed. |
| File       | Documentation only                                                                                                                                              |
| Acceptance | Timeout configuration documented with examples showing Zod config equivalent.                                                                                   |
| Audit Note | `DEFAULT_TIMEOUTS` is already exported. `configureTimeouts()` is not needed — Zod config schema is the intended mechanism.                                      |

#### 9.31 LP-006: Config Migrator CLI

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | LP-006                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Source     | master-action-list #36, persona P1 + P2 + P3 (Medium)                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Outline    | Build `npx playwright-praman migrate-config dhikraft.config.ts` CLI that reads flat dhikraft config and outputs nested Zod-validated praman config. dhikraft config shape (input): `{ baseUrl: string, user: string, password: string, logLevel: string, strategy: string, timeout: number, ... }` (flat object). praman config shape (output): `{ auth: { strategy: ..., credentials: { ... } }, bridge: { strategy: ... }, logging: { level: ... }, timeouts: { ... } }` (nested Zod schema). |
| File       | `src/cli/migrate-config.ts` (new)                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Test File  | `tests/unit/cli/migrate-config.test.ts`                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Note       | Future: wdi5 config migrator (wdio.conf.ts -> playwright.config.ts) — note as roadmap item but out of scope for LP-006.                                                                                                                                                                                                                                                                                                                                                                         |
| Acceptance | CLI converts a dhikraft config to praman format. Unit test with sample input/output pair.                                                                                                                                                                                                                                                                                                                                                                                                       |

#### 9.32 LP-007: Compatibility Layer Sub-Path

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | LP-007                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Source     | master-action-list #50, persona P1 + P3 (Low)                                                                                                                                                                                                                                                                                                                                                                                          |
| Effort     | 3 days                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Outline    | Create `playwright-praman/compat/dhikraft` re-export facade. Allows `import { test } from 'playwright-praman/compat/dhikraft'` with backward-compatible fixture destructuring. Fixture mapping table: `auth` -> `sapAuth`, `navigation` -> `ui5Navigation`, `ui5Assert` -> `ui5` (assertion subset), `ui5Interact` -> `ui5` (interaction subset), `dhikraftConfig` -> `pramanConfig`, `browser` -> N/A (Playwright provides directly). |
| File       | `src/compat/dhikraft/index.ts` (new)                                                                                                                                                                                                                                                                                                                                                                                                   |
| Note       | Adding a new sub-path export requires: (1) `package.json` exports field update, (2) `tsup.config.ts` entry point, (3) attw validation (`npm run check:exports`) to verify resolution. Currently 6 sub-path exports; this adds a 7th.                                                                                                                                                                                                   |
| Acceptance | Import from compat path works. Fixture names match dhikraft conventions. `npm run check:exports` passes with 7/7 exports.                                                                                                                                                                                                                                                                                                              |

#### 9.33 LP-008: ~~Generate JSON Schema from TypeScript Types~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** Script exists at scripts/generate-json-schema.ts, npm script at package.json:107. See Appendix E for audit evidence.

### Additional Code Item (0 remaining — AI-007 verified complete in audit)

#### 9.34 AI-007: ~~Configure API Extractor for `.api.md` Reports~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** Configured at api-extractor.json, script at package.json:98, output in temp/. See Appendix E for audit evidence.

### Additional Documentation Items (2 items)

#### 9.35 DOC-001: IDE/VS Code Setup Guide for Non-Developers

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | DOC-001                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Source     | onboarding-roadmap (Tariq persona gap), persona-2-tosca                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Effort     | 1.5 days (expanded from 0.5 — Agent 5 feedback: non-developers need significantly more detail)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Outline    | Step-by-step guide for setting up VS Code for praman development. **Expanded scope**: (a) VS Code download/install for Windows/macOS/Linux. (b) Which extensions to install: Playwright Test for VS Code, ESLint, TypeScript + JavaScript, Git Lens. (c) Workspace settings (`.vscode/settings.json` template). (d) Debugging configuration (`.vscode/launch.json` for Playwright). (e) Terminal basics: cd, npm, npx, environment variables. (f) Git basics: clone, branch, commit, push (enough for team collaboration). (g) Node.js/npm installation walkthrough. Screenshots for each step. Targets non-developer persona (Tariq). |
| Acceptance | Page exists in docs. 10+ screenshots included. Non-developer with no prior coding experience can follow instructions end-to-end.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

#### 9.36 DOC-002: Concept Glossary Page

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------- | ---------------- |
| ID         | DOC-002                                                                                                                                                                                                                                                                                                                                                                                                                |
| Source     | onboarding-roadmap (Tariq persona gap), docusaurus-plan-praman persona content                                                                                                                                                                                                                                                                                                                                         |
| Effort     | 1 day (expanded from 0.5 — every term must have Tosca equivalent)                                                                                                                                                                                                                                                                                                                                                      |
| Outline    | Define key concepts in SAP-domain language: fixture, locator, selector, page object, assertion, hook, worker, browser context, test.step(), mergeTests(), storageState, auto-waiting, bridge, proxy, control, intent, recipe, capability, reporter, trace. Each with 1-sentence definition and **Tosca equivalent for EVERY term** (not "where applicable"). Also include wdi5 equivalent where relevant. Format: Term | Definition | Tosca Equivalent | wdi5 Equivalent. |
| Acceptance | Glossary page with 20+ terms. Each term has definition, Tosca equivalent, and wdi5 equivalent (where applicable).                                                                                                                                                                                                                                                                                                      |

**LP Code Items Subtotal**: 7 items, 10.25 days (LP-008 verified complete — see Appendix E)
**Additional Code Item Subtotal**: 0 items, 0 days (AI-007 verified complete — see Appendix E)
**Additional Doc Items Subtotal**: 2 items, 2.5 days

**Sub-Phase 7.4 Totals**: 35 items, 67.75–69.75 days (was 37 items, 71–73 days — 2 items verified complete in audit, 1 item scope-reduced)

---

## 10. Sub-Phase 7.5 — Release Hardening + Certification

**Scope**: Performance benchmarks, security audit, CSP, Cloud ALM, behavioral tests (npm provenance verified complete — see Appendix E)
**Duration**: 3 weeks (12 working days)
**Gate**: npm publish with provenance succeeds, all audits pass, performance baselines established, GitHub issue #7 closed

### 10.1 ~~npm Provenance~~ — VERIFIED COMPLETE

> **Moved to Appendix E.** --provenance flag already at release.yml:55. See Appendix E for audit evidence.

### 10.2 Performance Benchmarks

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | PERF-BENCH                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Source     | plan.md Phase 7 table                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Effort     | 3 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Outline    | Establish performance baselines for: (1) Bridge injection latency (<500ms target). (2) Control discovery latency (by strategy). (3) Method call round-trip. (4) Proxy creation overhead. (5) `waitForUI5Stable()` convergence time. Use Vitest `bench()` for unit benchmarks, Playwright trace timing API (`trace.startChunk()` / `trace.stopChunk()`) for E2E. **Baseline targets** (initial — adjust after measurement): injection <500ms, discovery <200ms, method call <100ms, proxy creation <50ms, stability convergence <2000ms. **Regression thresholds**: fail CI if any metric exceeds 2x baseline (relative comparison, not absolute — avoids CI runner variance). Use dedicated CI runner or statistical approach (median of 5 runs). |
| Acceptance | Baseline numbers documented for all 5 metrics, regression detection CI step added with 2x threshold                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### 10.3 Security Audit

| Field      | Value                                                                                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | SEC-AUDIT                                                                                                                                                                                                                                                               |
| Source     | D15, plan.md Phase 7 table                                                                                                                                                                                                                                              |
| Effort     | 2 days                                                                                                                                                                                                                                                                  |
| Outline    | Final security review: (1) `npm audit` clean. (2) Snyk scan (0 high/critical). (3) SBOM review (CycloneDX). (4) Secret redaction verification (pino). (5) `eslint-plugin-security` + `@microsoft/eslint-plugin-sdl` clean. (6) `new Function()` usage documented (D24). |
| Acceptance | `npm audit` returns 0 vulnerabilities, Snyk scan clean, SBOM generated                                                                                                                                                                                                  |

### 10.4 CSP Compliance Assessment

| Field      | Value                                                                                                                                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | CSP-ASSESS                                                                                                                                                                                                                                                        |
| Source     | Phase 2 deferred, plan.md §9.2                                                                                                                                                                                                                                    |
| Effort     | 1 day                                                                                                                                                                                                                                                             |
| Outline    | Document CSP implications of `page.evaluate()` bridge injection. Note `respectCSP` config placeholder for future nonce-based injection. CSP is a **documentation** item, not an implementation item — Playwright's `page.evaluate()` bypasses page CSP by design. |
| Acceptance | CSP implications documented, `respectCSP` config placeholder documented                                                                                                                                                                                           |

### 10.5 P5-010: SAP Cloud ALM Integration

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-010 (merged with P5-014)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Source     | agent-operability B13.5 (FAIL — only FAIL item for praman)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Effort     | 5+ days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Outline    | Phase 1: Output JUnit/xUnit XML compatible with Cloud ALM Test Automation API import. **JUnit schema**: use JUnit 5 XML format (not JUnit 4) — Cloud ALM requires `<testsuites>` root element with `<testsuite>` children containing `<testcase>` elements. Custom properties via `<properties><property name="..." value="..."/></properties>` for SAP-specific metadata. Phase 2 (future, requires SAP partnership): Direct API integration with Cloud ALM. Also covers process-linked test case metadata (B13.1). Start with reporter format compatibility. **Cloud ALM timeline**: direct API integration requires SAP partnership (estimated 3-6 months after initial adoption). |
| Acceptance | (1) Reporter generates JUnit 5 XML compatible with Cloud ALM import. (2) Import documented with step-by-step. (3) Process ID metadata linkable via test annotations.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

### 10.6 Behavioral Equivalence Tests (Golden Master)

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | BEHAV-EQ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Source     | plan.md Phase 7 table, behavioral-verification-plan.md                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Effort     | 3 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Outline    | Golden master tests verifying praman behavioral parity with wdi5 for core operations. **Comparison methodology**: run both frameworks against same SAP demo app, capture output as JSON snapshots, diff results field-by-field. Document intentional divergences vs bugs.                                                                                                                                                                                                                                                 |
| Scenarios  | 8 specific wdi5 parity scenarios: (1) Control discovery by ID — same control found. (2) Control discovery by type+properties — same result set. (3) Property access (getText, getValue) — identical return values. (4) Method invocation (press, fireEvent) — same side effects. (5) Aggregation traversal (getItems, getRows) — same child count and order. (6) Navigation (hash-based) — same URL after nav. (7) Auth flow (BasicAuth) — same login result. (8) Error handling — equivalent error for invalid selector. |
| Deps       | INT1, INT2 (integration tests must pass first)                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Acceptance | All 8 parity scenarios tested. Golden master snapshots captured. Behavioral differences documented with rationale.                                                                                                                                                                                                                                                                                                                                                                                                        |

### Cloud ALM Extended Integration (4 items)

Items identified by Agent Operability Report (2026-02-21) for SAP Cloud ALM best practices.

#### 10.7 P5-021: Test Plan Orchestration

| Field      | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-021                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Source     | agent-operability B13.3 (PARTIAL)                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Outline    | Add test suite orchestrator that maps Playwright test suites to Cloud ALM test plans. **Annotation mechanism**: use Playwright's `test.info().annotations` API — `test.info().annotations.push({ type: 'testPlanId', description: 'TP-001' })`. Annotations are extracted by ComplianceReporter during `onTestEnd()` hook. Alternatively, use `test.describe` title convention: `describe('[TP-001] Purchase Order Tests', ...)`. Cloud ALM import via JUnit XML with custom `<property>` elements. |
| Deps       | P5-010 (Cloud ALM Integration -- reporter format)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Acceptance | (1) Test annotations map to Cloud ALM test plan structure. (2) ComplianceReporter outputs test plan metadata. (3) Documentation shows annotation -> Cloud ALM mapping.                                                                                                                                                                                                                                                                                                                              |

#### 10.8 P5-022: Hybrid Test Execution

| Field      | Value                                                                                                                                                                                                                                                                                                            |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-022                                                                                                                                                                                                                                                                                                           |
| Source     | agent-operability B13.4 (PARTIAL)                                                                                                                                                                                                                                                                                |
| Effort     | 1 day                                                                                                                                                                                                                                                                                                            |
| Outline    | Documentation and configuration patterns for mixed manual+automated test execution via Cloud ALM. Approach: mark tests as `@manual` or `@automated` in annotations. Manual tests generate step-by-step checklists from `test.step()` descriptions. Automated results feed back to Cloud ALM via reporter output. |
| Deps       | P5-021 (Test Plan Orchestration)                                                                                                                                                                                                                                                                                 |
| Acceptance | Documentation page with hybrid test plan example, annotation syntax documented                                                                                                                                                                                                                                   |

#### 10.9 P5-023: Requirements Traceability

| Field      | Value                                                                                                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-023                                                                                                                                                                                                                                                        |
| Source     | agent-operability B13.7 (PARTIAL)                                                                                                                                                                                                                             |
| Effort     | 1 day                                                                                                                                                                                                                                                         |
| Outline    | Add requirement ID annotations (`@requirementId`) to test files, mapped to Cloud ALM requirements. ComplianceReporter includes requirement traceability matrix in output. Traceability report shows: requirement → test case → last result → coverage status. |
| Deps       | P5-010 (Cloud ALM Integration)                                                                                                                                                                                                                                |
| Acceptance | (1) `@requirementId('REQ-001')` annotation works in test files. (2) ComplianceReporter outputs traceability matrix. (3) Documentation shows traceability flow.                                                                                                |

#### 10.10 P5-024: Multi-Tool Integration

| Field      | Value                                                                                                                                                                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID         | P5-024                                                                                                                                                                                                                                                                                                                  |
| Source     | agent-operability B13.9 (PARTIAL)                                                                                                                                                                                                                                                                                       |
| Effort     | 2 days                                                                                                                                                                                                                                                                                                                  |
| Outline    | Documentation and adapter patterns for integrating praman test results with third-party test management tools: Tricentis qTest, TestRail, Xray for Jira. Approach: custom Playwright reporters that output tool-specific formats (qTest JSON, TestRail CSV, Xray JSON). Provide reporter base class for easy extension. |
| Acceptance | (1) Documentation covers 3 tool integrations. (2) Reporter base class with extension example. (3) At least one adapter fully implemented (TestRail recommended — simplest API).                                                                                                                                         |

**Cloud ALM Extended Subtotal**: 4 items, 6 days

**Sub-Phase 7.5 Totals**: 9 items, 20.0+ days (was 10 items, 20.5+ days — 1 item verified complete in audit)

---

## 11. Complete Item Inventory

### 11.1 Items by Source (Traceability)

| Source                     | Items                                                                                                  | Count   | Audit Adj.     |
| -------------------------- | ------------------------------------------------------------------------------------------------------ | ------- | -------------- |
| Bug fixes (Persona Report) | BF-003..BF-005, BF-007, BF-009..BF-011 (BF-001, BF-002, BF-006 verified complete; BF-008 unnecessary)  | 7       | -4             |
| Bug fixes (Agent Review)   | BF-012 (matchers), BF-013 (gold standard), BF-014 (test.step audit)                                    | 3       | —              |
| P3: Documentation          | P3-001 through P3-036 (P3-015 conditionally deferred)                                                  | 34      | —              |
| P4: Architecture deferred  | P4-013, P4-016, P4-018                                                                                 | 3       | —              |
| P5: Docs deferred          | P5-005, P5-006, P5-007, P5-011, P5-012, P5-013, P5-015, P5-018, P5-025                                 | 9       | —              |
| P5: Complex deferred       | P5-004, P5-010                                                                                         | 2       | —              |
| P5: SAP enterprise         | P5-017, P5-019, P5-020                                                                                 | 3       | —              |
| P5: Cloud ALM extended     | P5-021, P5-022, P5-023, P5-024                                                                         | 4       | —              |
| P5: Product decisions      | P5-PD-001, P5-PD-002, P5-PD-003                                                                        | 3       | —              |
| Phase 2 deferred           | INT1, INT2                                                                                             | 2       | —              |
| Design decisions           | D5-L4, D26 (D20-VERIFY verified complete)                                                              | 2       | -1             |
| Phase 2 deferred (arch)    | WC-EVAL, REG-EVAL                                                                                      | 2       | —              |
| Agent operability          | AO-001 through AO-010 (AO-008 merged into AO-001)                                                      | 9       | —              |
| AI readiness               | AI-002, AI-006 (AI-001, AI-003, AI-004, AI-005, AI-007 verified complete)                              | 2       | -5             |
| Code quality               | CQ-003 (CQ-001 unnecessary; CQ-002 verified complete)                                                  | 1       | -2             |
| Lower-priority code        | LP-001 through LP-007 (LP-008 verified complete)                                                       | 7       | -1             |
| Additional docs            | DOC-001, DOC-002                                                                                       | 2       | —              |
| Release hardening          | PERF-BENCH, SEC-AUDIT, CSP-ASSESS, BEHAV-EQ (NPM-PROV verified complete)                               | 4       | -1             |
| Infrastructure             | Docusaurus scaffold (executed during 7.1)                                                              | 1       | —              |
| **Total (Active)**         |                                                                                                        | **100** | **-15**        |
| _Verified complete_        | _BF-001, BF-002, BF-006, AI-001, AI-003, AI-004, AI-005, AI-007, CQ-002, D20-VERIFY, LP-008, NPM-PROV_ | _12_    | _→ Appendix E_ |
| _Determined unnecessary_   | _BF-008, CQ-001_                                                                                       | _2_     | _→ Appendix F_ |

### 11.2 Items by Sub-Phase

| Sub-Phase | Scope                                       | Items   | Effort (days)   | Audit Change                                  |
| --------- | ------------------------------------------- | ------- | --------------- | --------------------------------------------- |
| 7.0       | Priority Bug Fixes & Code Changes           | 10      | 8.25            | -4 items, -3.35d                              |
| 7.1       | MVP Docs (Tier 0) + scaffold                | 9+1     | 9.5             | Scaffold (1.5d) counted in Infrastructure     |
| 7.2       | Core + Adoption Docs (Tier 1+2)             | 16      | 27.5            | —                                             |
| 7.3       | Architecture Hardening + AI Readiness       | 21      | 28.1–38.1       | -7 items, -7.4d, AO-008 merged into AO-001    |
| 7.4       | Advanced Docs + AI/SAP + LP Code (Tier 3+4) | 35      | 67.75–69.75     | -2 items, -3.25d                              |
| 7.5       | Release Hardening                           | 9       | 20.0+           | -1 item, -0.5d                                |
| **Total** |                                             | **100** | **161.1–173.1** | **-15 items, -14.5d (includes AO-008 merge)** |

### 11.3 Items by Type

| Type                   | Count   | Effort (days)   | Notes                                                                             |
| ---------------------- | ------- | --------------- | --------------------------------------------------------------------------------- |
| Priority bug fixes     | 10      | 8.25            | BF-003..BF-005, BF-007, BF-009..BF-014 (4 removed by audit)                       |
| Documentation pages    | 36      | 69.5            | Docusaurus Tier 0-4 + P3-036 + DOC-001 + DOC-002 (expanded estimates)             |
| P5 doc items           | 9       | 10              | Docs-only, no code (added P5-025 visual regression)                               |
| Deployment fixes       | 2       | 1               | P3-034, P3-035                                                                    |
| Integration tests      | 2       | 6               | INT1, INT2 (require real SAP system)                                              |
| Architecture evaluate  | 5       | 4-6             | P4-013/016/018, WC-EVAL, REG-EVAL (evaluate-then-decide)                          |
| Architecture implement | 2       | 3               | D26, D5-L4                                                                        |
| Architecture verify    | 0       | 0               | D20-VERIFY verified complete in audit                                             |
| Agent operability      | 9       | 9.5             | AO-001..AO-010 (AO-008 merged into AO-001; TypeScript, errors, hooks, pagination) |
| AI readiness           | 2       | 2.5             | AI-002 (scope-reduced), AI-006 (5 items verified complete in audit)               |
| Code quality           | 1       | 0.1             | CQ-003 only (CQ-001 unnecessary, CQ-002 verified complete)                        |
| Lower-priority code    | 7       | 10.25           | LP-001..LP-007 (LP-008 verified complete, LP-005 scope-reduced)                   |
| Product decisions      | 3       | 1.5             | P5-PD-001/002/003                                                                 |
| Complex features       | 4       | 15-17+          | P5-004, P5-010, P5-019, P5-020 (expanded)                                         |
| Cloud ALM extended     | 4       | 6               | P5-021/022/023/024                                                                |
| SAP enterprise         | 1       | 2               | P5-017                                                                            |
| Release hardening      | 3       | 6               | PERF-BENCH, SEC-AUDIT, CSP-ASSESS (NPM-PROV verified complete)                    |
| Behavioral tests       | 1       | 3               | Golden master (8 wdi5 parity scenarios)                                           |
| Infrastructure         | 1       | 1.5             | Docusaurus scaffold                                                               |
| **Total (Active)**     | **100** | **161.1–173.1** | **15 items moved to Appendix E/F (includes AO-008 merge)**                        |

### 11.4 Cross-Reference: Agent Operability Report Gaps

Items that directly address remaining ❌ FAIL or ⚠️ PARTIAL scores from the Agent Operability Report:

| Report Item | Score   | Phase 7 Item                | Expected Improvement                                 |
| ----------- | ------- | --------------------------- | ---------------------------------------------------- |
| A1.5        | ⚠️      | AO-001                      | .d.ts navigability improvement                       |
| A1.6        | ⚠️      | P3-036                      | README usage examples                                |
| A2.11       | ⚠️      | P3-002                      | Config option interactions (already in P3-002 scope) |
| A4.25       | ⚠️      | AO-002                      | Stack traces point to user code                      |
| A5.29       | ❌ FAIL | P4-013                      | Dry-run evaluation → PASS or documented limitation   |
| A8.46       | ⚠️      | AO-003                      | Lifecycle hooks for plugin extensibility             |
| B2.4        | ⚠️      | P4-018                      | Graceful shutdown evaluation                         |
| B3.6        | ⚠️      | AO-004                      | Template literal types expansion                     |
| B3.8        | ⚠️      | AO-005                      | Exhaustive switch handling audit                     |
| B3.9        | ⚠️      | AO-006                      | Branded types expansion                              |
| B3.11       | ⚠️      | AO-007                      | Type assertion reduction via global augmentation     |
| B5.10       | ⚠️      | P5-005                      | Accessibility documentation                          |
| B6.2        | ⚠️      | AO-001 (merged from AO-008) | .claudeignore update for controls.ts                 |
| B8.4        | ⚠️      | AO-009                      | Auto-pagination for OData queries                    |
| B8.7        | ⚠️      | AO-010                      | Server-side HTTP client wrapper                      |
| B8.10       | ⚠️      | P4-016                      | Circuit breaker evaluation                           |
| B9.8        | ⚠️      | P3-030                      | Journey-structured business process examples         |
| B9.9        | ⚠️      | P5-011                      | OData mocking documentation                          |
| B9.12       | ⚠️      | P5-012                      | Component testing documentation                      |
| B11.2       | ⚠️      | P5-004                      | SAP Codegen support                                  |
| B11.9       | ⚠️      | P5-013                      | Cross-browser documentation                          |
| B12.1       | ⚠️      | P5-006                      | SAP Activate alignment                               |
| B12.2       | ⚠️      | P5-017                      | Pre-delivered test automates                         |
| B12.4       | ⚠️      | P5-007                      | Upgrade test readiness                               |
| B12.5       | ⚠️      | P5-018                      | Intelligent test scoping documentation               |
| B12.6       | ⚠️      | P5-019                      | Custom test recording                                |
| B12.8       | ⚠️      | P5-020                      | Test data framework enhancement                      |
| B13.1       | ⚠️      | P5-010                      | Cloud ALM process-linked test cases                  |
| B13.3       | ⚠️      | P5-021                      | Test plan orchestration                              |
| B13.4       | ⚠️      | P5-022                      | Hybrid test execution                                |
| B13.5       | ❌ FAIL | P5-010                      | Cloud ALM Test Automation API                        |
| B13.6       | ⚠️      | P5-015                      | Best Practice content import                         |
| B13.7       | ⚠️      | P5-023                      | Requirements traceability                            |
| B13.9       | ⚠️      | P5-024                      | Multi-tool integration                               |

**Target**: Improve combined score from 84.5% → 95%+ after Phase 7 completion (all 34 gaps addressed).

---

## 12. Test Plan

### 12.1 Documentation Tests

| Test Type               | What                                                      | Tool                    |
| ----------------------- | --------------------------------------------------------- | ----------------------- |
| Link validation         | All internal/external links resolve                       | `remark-validate-links` |
| Code snippet validation | All code blocks compile/run                               | Custom doc test script  |
| Config example validity | All `playwright.config.ts` examples pass `defineConfig()` | Vitest snapshot tests   |
| Spelling                | No typos in documentation                                 | `cspell`                |
| Accessibility           | Docs site passes Lighthouse accessibility audit           | Lighthouse CI           |

### 12.2 Integration Tests

| Test Type              | What                                        | Tool                      |
| ---------------------- | ------------------------------------------- | ------------------------- |
| INT1 bridge smoke      | Bridge injection + control discovery        | Playwright + SAP demo app |
| INT2 proxy smoke       | Proxy creation + aggregation + model access | Playwright + SAP BTP app  |
| Behavioral equivalence | Golden master vs wdi5                       | Playwright + SAP demo app |

### 12.3 Performance Tests

| Test Type         | What                          | Tool                    |
| ----------------- | ----------------------------- | ----------------------- |
| Bridge injection  | Injection latency < 500ms     | Vitest `bench()`        |
| Control discovery | Discovery latency by strategy | Vitest `bench()`        |
| Method round-trip | Method call latency           | Playwright trace timing |
| Proxy creation    | Proxy overhead vs direct call | Vitest `bench()`        |

### 12.4 Security Tests

| Test Type        | What                            | Tool                       |
| ---------------- | ------------------------------- | -------------------------- |
| Dependency audit | 0 high/critical vulnerabilities | `npm audit`, Snyk          |
| Static analysis  | 0 security rule violations      | `eslint-plugin-security`   |
| Secret redaction | Passwords/tokens not in logs    | Pino redaction test        |
| SBOM generation  | CycloneDX SBOM valid            | `@cyclonedx/cyclonedx-npm` |

---

## 13. Impact Analysis

### 13.1 Impact on Existing Code

| Area         | Impact  | Details                                                                                                                          |
| ------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Source code  | Medium  | D26, D5-L4, P4-013/016/018 (if implemented), WC-EVAL, AO-001..010 (10 agent operability items), P5-017/019/020 touch source code |
| Test files   | Medium  | INT1/INT2 complete existing stubs, behavioral tests are new files                                                                |
| Build output | None    | No changes to tsup config or sub-path exports                                                                                    |
| Dependencies | Low     | Docusaurus (devDep only), possibly `@axe-core/playwright` (devDep)                                                               |
| CI/CD        | Low     | Add doc deployment step, provenance flag, benchmark CI step                                                                      |
| Package.json | Minimal | Add doc scripts, devDependencies for Docusaurus                                                                                  |

### 13.2 Risk to Existing Functionality

| Risk                                   | Likelihood | Mitigation                                                    |
| -------------------------------------- | ---------- | ------------------------------------------------------------- |
| P4-013/016/018 break existing behavior | Low        | Evaluate-first approach; implement only if clearly beneficial |
| WC support introduces regressions      | Low        | Prototype in separate branch; no merge without full tests     |
| D26 changes UI5Object public API       | Medium     | Additive-only (new methods); no changes to existing methods   |
| Documentation examples become stale    | Medium     | Automated code snippet validation in CI                       |

---

## 14. Quality Gates Per Sub-Phase

### Gate 7.0: Priority Bug Fixes & Code Changes

- [x] BF-001: "Coming soon" removed from README — **VERIFIED COMPLETE (audit)**
- [x] BF-002: `ui5=` selector engine wired and functional — **VERIFIED COMPLETE (audit)**
- [ ] BF-003/004: Capabilities and Recipes APIs — verify/add remaining methods (scope reduced)
- [ ] BF-005: fireSelect in press chain fixed
- [x] BF-006: Injection timeout guard — **VERIFIED COMPLETE (audit)**
- [ ] BF-007: Strategy error swallowing fixed
- [x] BF-008: Retry boundary bug — **NOT A BUG (audit)**
- [ ] BF-009..BF-011: All medium-priority fixes done (logout, vocab normalization, version check)
- [ ] BF-012: All 10 matchers refactored for web-first auto-retry via `toPass()` pattern
- [ ] BF-013: Gold standard test files contain zero `page.waitForTimeout()` and zero `console.log()`
- [ ] BF-014: All fixture public methods decorated with `test.step()`
- [ ] `npm run ci` passes (lint + typecheck + test:unit + build)
- [ ] Coverage thresholds still met
- [ ] All bug fixes have RED-phase regression test (failing test demonstrates bug before fix)

### Gate 7.1: MVP Documentation (Minimum Viable for Adoption)

- [ ] Docusaurus site builds without errors
- [ ] 6 Tier 0 pages accessible at deployed URL
- [ ] API reference (`/api`) resolves (no 404)
- [ ] All code snippets in docs are syntactically valid
- [ ] "Why not Locators?" explanation present in P3-001
- [ ] `.env.example` and `playwright.config.example.ts` present in examples/
- [ ] `npm run ci` still passes (no regressions)
- [ ] **MVP Gate**: After 7.1, praman is minimally adoptable — a developer can install, configure, write a test, and run it using only the docs site

### Gate 7.2: Core + Adoption Documentation

- [ ] 13 additional pages (8 Tier 1 + 5 Tier 2) accessible
- [ ] All migration guide code examples compile
- [ ] 3 product decisions documented with rationale
- [ ] `npm run ci` still passes

### Gate 7.3: Architecture Hardening

- [ ] INT1 smoke test passes against SAP demo app
- [ ] INT2 smoke test passes against SAP BTP app
- [ ] GitHub issue #7 closeable (INT1/INT2 complete)
- [ ] P4-013/016/018 decisions documented as ADRs
- [ ] WC-EVAL and REG-EVAL decisions documented
- [ ] D26 implemented with unit tests (if decided to implement)
- [ ] D5-L4 AI telemetry spans emitting
- [x] D20 cleanup verified wired — **VERIFIED COMPLETE (audit)**
- [ ] AO-001..AO-010 agent operability items complete (TypeScript, errors, hooks, pagination)
- [x] AI-001: Recipe metadata — **VERIFIED COMPLETE (audit)**
- [ ] AI-002: Provider formatting — expose on singleton (scope reduced)
- [x] AI-003: ui5.inspect — **VERIFIED COMPLETE (audit)**
- [x] AI-004: @ai TSDoc tags — **VERIFIED COMPLETE (audit)**
- [x] AI-005: Retry jitter — **VERIFIED COMPLETE (audit)**
- [ ] AI-006: `any` type audit
- [x] CQ-001: Boolean flags in table.ts — **NOT NEEDED (audit)**
- [x] CQ-002: Section separators in dialog.ts — **VERIFIED COMPLETE (audit)**
- [ ] CQ-003: @example block cleanup in CLI files (scope reduced)
- [ ] `npm run ci` still passes, coverage thresholds met

### Gate 7.4: Advanced Documentation + LP Code

- [ ] All 23 documentation pages complete and deployed (13 Tier 3+4 + 8 P5 docs + DOC-001 + DOC-002), all 12 code items complete
- [ ] All P5 doc items (8) written (P5-005, P5-006, P5-007, P5-011, P5-012, P5-013, P5-015, P5-025)
- [ ] P5-004 Codegen evaluation complete
- [ ] P5-017..P5-020 SAP enterprise items complete
- [ ] Business process examples (P3-030) runnable
- [ ] SAP Control Cookbook (P3-031) covers all 11 controls (6 original + 5 added per wdi5 persona)
- [ ] LP-001..LP-007 lower-priority code items complete (LP-008 verified complete in audit)
- [x] AI-007 API Extractor configured and generating reports — **VERIFIED COMPLETE (audit)**
- [x] LP-008 JSON Schema generation — **VERIFIED COMPLETE (audit)**
- [ ] `npm run ci` still passes

### Gate 7.5: Release Hardening

- [x] `npm publish --provenance` succeeds in CI — **VERIFIED COMPLETE (audit, release.yml:55)**
- [ ] Performance baselines documented (5 metrics)
- [ ] `npm audit` returns 0 vulnerabilities
- [ ] Snyk scan clean (0 high/critical)
- [ ] CSP implications documented
- [ ] Cloud ALM-compatible output format verified
- [ ] P5-021..P5-024 Cloud ALM extended integration items complete
- [ ] Behavioral equivalence tests pass
- [ ] GitHub issue #7 CLOSED
- [ ] `npm run ci` still passes

---

## 15. Risk Register

| #   | Risk                                          | Likelihood | Impact    | Mitigation                                                                         |
| --- | --------------------------------------------- | ---------- | --------- | ---------------------------------------------------------------------------------- |
| R1  | SAP demo apps unavailable for INT1/INT2       | Medium     | 🔴 High   | Use CAP local mock server as fallback; document both approaches                    |
| R2  | Docusaurus v3 breaking changes                | Low        | 🟡 Medium | Pin exact version in devDependencies                                               |
| R3  | Playwright Codegen API changes (P5-004)       | Medium     | 🟡 Medium | Build post-processing tool first (less API-dependent); defer full extension        |
| R4  | Cloud ALM API access requires SAP partnership | High       | 🟡 Medium | Start with reporter format compatibility (no API needed); defer direct integration |
| R5  | WebComponent approach fails                   | Medium     | 🟡 Medium | Playwright `>>` combinator is stable; worst case is manual Shadow DOM traversal    |
| R6  | Documentation becomes stale quickly           | Medium     | 🟡 Medium | Automated code snippet tests in CI; doc update checklist in PR template            |
| R7  | Performance benchmarks flaky in CI            | Medium     | 🟢 Low    | Use relative comparisons (not absolute thresholds); run on dedicated runner        |
| R8  | P4-013 dry-run infeasible with Playwright     | High       | 🟢 Low    | Document as known limitation; suggest `--list` + verbose logging as workaround     |
| R9  | Scope creep from 100 active items             | Medium     | 🟡 Medium | Strict sub-phase gates; defer items to Phase 8 if needed                           |
| R10 | Golden master tests diverge from wdi5         | Low        | 🟢 Low    | Expected — document behavioral differences, don't force parity                     |

---

## 16. Effort Summary

### 16.1 By Sub-Phase

| Sub-Phase | Description                                 | Items   | Effort (days)   | Duration (weeks)           | Audit Change                                  |
| --------- | ------------------------------------------- | ------- | --------------- | -------------------------- | --------------------------------------------- |
| 7.0       | Priority Bug Fixes & Code Changes           | 10      | 8.25            | 2                          | -4 items, -3.35d                              |
| 7.1       | MVP Docs (Tier 0) + scaffold                | 9+1     | 9.5             | 2                          | Scaffold (1.5d) in Infrastructure             |
| 7.2       | Core + Adoption Docs (Tier 1+2)             | 16      | 27.5            | 4                          | —                                             |
| 7.3       | Architecture Hardening + AI Readiness       | 21      | 28.1–38.1       | 5                          | -7 items, -7.4d, AO-008 merged                |
| 7.4       | Advanced Docs + AI/SAP + LP Code (Tier 3+4) | 35      | 67.75–69.75     | 5                          | -2 items, -3.25d                              |
| 7.5       | Release Hardening                           | 9       | 20.0+           | 3                          | -1 item, -0.5d                                |
| **Total** |                                             | **100** | **161.1–173.1** | **~20 seq / ~17 parallel** | **-15 items, -14.5d (includes AO-008 merge)** |

### 16.2 By Work Type

| Work Type           | Items   | Effort (days)   | % of Total |
| ------------------- | ------- | --------------- | ---------- |
| Priority bug fixes  | 10      | 8.25            | 5%         |
| Documentation       | 45      | 80.5            | 49%        |
| Infrastructure      | 1       | 1.5             | 1%         |
| Architecture (code) | 7       | 6-11            | 5%         |
| Agent operability   | 9       | 9.5             | 6%         |
| AI readiness        | 2       | 2.5             | 2%         |
| Code quality        | 1       | 0.1             | <1%        |
| Lower-priority code | 7       | 10.25           | 6%         |
| Integration tests   | 2       | 6               | 4%         |
| Behavioral tests    | 1       | 3               | 2%         |
| Release hardening   | 3       | 6               | 4%         |
| Complex features    | 4       | 15-17+          | 10%        |
| Cloud ALM extended  | 4       | 6               | 4%         |
| Product decisions   | 3       | 1.5             | 1%         |
| **Total (Active)**  | **100** | **161.1–173.1** | **100%**   |

### 16.3 Parallelization Opportunities

| Parallel Track A           | Parallel Track B            | Savings |
| -------------------------- | --------------------------- | ------- |
| 7.0 Bug fixes (code)       | —                           | —       |
| 7.1 Docs scaffold + Tier 0 | —                           | —       |
| 7.2 Tier 1+2 docs          | 7.3 Architecture hardening  | 4 weeks |
| 7.4 Tier 3+4 docs          | 7.3 remaining (if overflow) | 1 week  |

**With parallelization, effective duration: ~17 weeks** (instead of ~20 sequential).

### 16.4 Comparison to Previous Phases

| Phase       | Items   | Source LOC | Test LOC   | Duration                                   | Focus                                           |
| ----------- | ------- | ---------- | ---------- | ------------------------------------------ | ----------------------------------------------- |
| Phase 1     | 9       | 11,365     | ~11,000    | 3 weeks                                    | Core infrastructure                             |
| Phase 2     | 23      | 4,999      | ~5,000     | 3 weeks                                    | Bridge + Proxy                                  |
| Phase 3     | 17      | 5,160      | ~5,000     | 3 weeks                                    | Fixtures + Auth                                 |
| Phase 4     | 20      | 7,386      | ~6,848     | 3 weeks                                    | Domain modules                                  |
| Phase 5     | 30+     | ~2,397     | ~4,000     | 3 weeks                                    | AI + Intents                                    |
| Phase 6     | 15+     | ~1,000     | ~1,200     | 3 weeks                                    | CLI + Reporters                                 |
| Phase 6.1   | 31      | ~1,500     | ~1,500     | 2 weeks                                    | Parity remediation                              |
| **Phase 7** | **100** | **~5,000** | **~5,000** | **~20 weeks (seq) / ~17 weeks (parallel)** | **Bug Fixes + Docs + Hardening + AI Readiness** |

---

## 18. Implementation Batches & Dependency Map

### 18.1 Batch Overview

| Batch | Name                          | Items | Effort       | Parallel Effective | Depends On   |
| ----- | ----------------------------- | ----- | ------------ | ------------------ | ------------ |
| 1     | Priority Bug Fixes (CODE)     | 10    | 8.25d        | 4-5d               | None         |
| 2     | Product Decisions + Scaffold  | 4     | 3d           | 1.5d               | Batch 1      |
| 3     | Tier 0 MVP Docs               | 9     | 8d           | 3d                 | Batch 2      |
| 4     | Architecture Hardening (CODE) | 21    | 28.1-38.1d   | 12d                | Batch 1      |
| 5     | Tier 1+2 Docs                 | 16    | 27.5d        | 14d                | Batch 3      |
| 6     | Advanced Docs + LP Code       | 35    | 67.75-69.75d | 18-20d             | Batches 4, 5 |
| 7     | Release Hardening             | 9     | 20+d         | 9d                 | Batch 4      |

### 18.2 Critical Path

```text
BF-* (8.25d) → SCAFFOLD (1.5d) → P3-018 (3d) → P5-004 (3-5d) → P5-019 (3d) = ~22d minimum
```

Alternative through integration tests:

```text
BF-* (8.25d) → INT1 (3d) → INT2 (3d) → BEHAV-EQ (3d) = ~17.25d
```

### 18.3 Parallelization Strategy

- **Batches 4 + 5 run in parallel** (saves ~4 weeks)
  - Track A: Architecture hardening code (Batch 4)
  - Track B: Documentation writing (Batch 5)
- **Batches 6 + 7 partially overlap**
  - Batch 7 can start once Batch 4 INT tests complete
  - Batch 6 continues with docs + LP code in parallel

### 18.4 Batch Details

#### Batch 1: Priority Bug Fixes (CODE) — 10 items, 8.25d

All items are independent and fully parallelizable within this batch.

| Sub-batch             | Items                                        | Effort | Dependencies | Notes                                   |
| --------------------- | -------------------------------------------- | ------ | ------------ | --------------------------------------- |
| 1A: Critical API      | BF-003 (1d), BF-004 (1d)                     | 2d     | None         | Expose Capabilities + Recipes APIs      |
| 1B: Interaction Fixes | BF-005 (0.5d), BF-007 (0.5d)                 | 1d     | None         | fireSelect + error swallowing           |
| 1C: Matcher Refactor  | BF-012 (2d)                                  | 2d     | None         | Web-first auto-retry (highest impact)   |
| 1D: Quality Fixes     | BF-009 (0.5d), BF-010 (0.25d), BF-011 (0.5d) | 1.25d  | None         | Logout, vocab, version check            |
| 1E: Gold Standard     | BF-013 (1d), BF-014 (1d)                     | 2d     | None         | Remove banned patterns, test.step audit |

**Parallel effective**: 1A + 1B + 1C + 1D + 1E can run on 5 parallel tracks = ~2d wall-clock.

#### Batch 2: Product Decisions + Scaffold — 4 items, 3d

| Sub-batch     | Items                                                | Effort | Dependencies | Notes                                               |
| ------------- | ---------------------------------------------------- | ------ | ------------ | --------------------------------------------------- |
| 2A: Scaffold  | DOCS-SCAFFOLD (1.5d)                                 | 1.5d   | Batch 1      | Docusaurus + GitHub Pages + TypeDoc                 |
| 2B: Decisions | P5-PD-001 (0.5d), P5-PD-002 (0.5d), P5-PD-003 (0.5d) | 1.5d   | Batch 1      | SAP_ACTIVE_SYSTEM, session timeout, synonym scoring |

**Parallel effective**: 2A + 2B run in parallel = ~1.5d wall-clock.

#### Batch 3: Tier 0 MVP Docs — 9 items, 8d

All 6 Tier 0 pages are independent and parallelizable. Deployment fixes and README examples depend on content.

| Sub-batch            | Items                                                           | Effort | Dependencies       | Notes                                              |
| -------------------- | --------------------------------------------------------------- | ------ | ------------------ | -------------------------------------------------- |
| 3A: Core Pages       | P3-001 (1d), P3-003 (1d), P3-004 (1d), P3-005 (1d), P3-006 (1d) | 5d     | Batch 2 (scaffold) | Getting Started, Auth, Errors, Selectors, Fixtures |
| 3B: Config + Example | P3-002 (1d), P3-035 (0.5d)                                      | 1.5d   | Batch 2 (scaffold) | Config ref (absorbs P3-035 content)                |
| 3C: Deployment       | P3-034 (0.5d)                                                   | 0.5d   | Batch 2 (scaffold) | API Reference 404 fix                              |
| 3D: README           | P3-036 (1d)                                                     | 1d     | BF-012 (Batch 1C)  | Usage examples (demonstrates auto-retry matchers)  |

**Parallel effective**: 3A + 3B + 3C + 3D all parallel = ~1-1.5d wall-clock per page, ~3d total.

#### Batch 4: Architecture Hardening (CODE) — 21 items, 28.1-38.1d

Items split into 5 sub-batches with internal dependencies.

| Sub-batch                          | Items                                                                                                                         | Effort | Dependencies         | Notes                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------- | ----------------------------------------------------------------------------- |
| 4A: Integration Tests (sequential) | INT1 (3d), INT2 (3d)                                                                                                          | 6d     | Batch 1 (bugs fixed) | INT2 depends on INT1; both need SAP demo apps                                 |
| 4B: Evaluations (parallel)         | P4-013 (1-6d), P4-016 (1-4d), P4-018 (1-3d), WC-EVAL (3d), REG-EVAL (1d)                                                      | 7-17d  | Batch 1              | All evaluations independent; each produces ADR                                |
| 4C: Design Decisions (parallel)    | D26 (2d), D5-L4 (1d)                                                                                                          | 3d     | Batch 1              | UI5Object AI introspection + telemetry                                        |
| 4D: Agent Operability (parallel)   | AO-001 (0.5d), AO-002 (0.5d), AO-003 (3d), AO-004 (0.5d), AO-005 (0.5d), AO-006 (0.5d), AO-007 (1d), AO-009 (1d), AO-010 (2d) | 9.5d   | Batch 1              | 9 items (AO-008 merged into AO-001); all independent except AO-003 is largest |
| 4E: AI + Code Quality (parallel)   | AI-002 (0.5d), AI-006 (2d), CQ-003 (0.1d)                                                                                     | 2.6d   | Batch 1              | Provider formatting, any-type audit, example cleanup                          |

**Parallel effective**: 4A is sequential (6d); 4B + 4C + 4D + 4E run in parallel alongside 4A = ~12d wall-clock.

#### Batch 5: Tier 1+2 Docs — 16 items, 27.5d

| Sub-batch              | Items                                                                                                  | Effort | Dependencies                                                   | Notes                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------ | ------ | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 5A: Tier 1 Core Guides | P3-007 (2d), P3-008 (2d), P3-009 (2d), P3-010 (1d), P3-011 (1d), P3-012 (1d), P3-013 (2d), P3-014 (1d) | 12d    | Batch 3 (scaffold); P3-011 depends on BF-012 (Batch 1C)        | 8 core guide pages; all parallelizable except P3-011 needs matchers done |
| 5B: Tier 2 Adoption    | P3-016 (3d), P3-017 (2d), P3-018 (3d), P3-019 (4d), P3-020 (2d)                                        | 14d    | Batch 3 (scaffold); P3-020 depends on BF-003/BF-004 (Batch 1A) | 5 migration/adoption guides; all parallelizable                          |
| 5C: Product Decisions  | (included in Batch 2)                                                                                  | —      | —                                                              | PD items moved to Batch 2 for earlier resolution                         |

**Parallel effective**: 5A + 5B run in parallel = ~14d wall-clock (bounded by P3-019 at 4d + overhead).

#### Batch 6: Advanced Docs + LP Code — 35 items, 67.75-69.75d

| Sub-batch                   | Items                                                                                                      | Effort | Dependencies                                                                 | Notes                                            |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| 6A: Tier 3 Pages            | P3-021 (2d), P3-022 (2d), P3-023 (2d), P3-024 (2d), P3-025 (2d), P3-026 (1d), P3-027 (1d), P3-028 (2d)     | 14d    | Batches 4+5; P3-028 depends on AO-003 (lifecycle hooks)                      | 8 advanced topic pages                           |
| 6B: Tier 4 References       | P3-029 (3d), P3-030 (6d), P3-031 (6d), P3-032 (3d), P3-033 (2d)                                            | 20d    | Batch 5 (P3-030 deps P3-018, P3-008)                                         | 5 reference pages; P3-030/031 are largest        |
| 6C: P5 Doc Items            | P5-005 (0.5d), P5-006 (2d), P5-007 (1d), P5-011 (1d), P5-012 (1d), P5-013 (0.5d), P5-015 (2d), P5-025 (1d) | 9d     | Batch 5; P5-006 deps P3-030                                                  | 8 documentation pages                            |
| 6D: P5 Complex + Enterprise | P5-004 (3-5d), P5-017 (2d), P5-019 (3d), P5-020 (3d)                                                       | 11-13d | P5-004 deps P3-018; P5-019 deps P5-004 + INT1 (Batch 4A); P5-017 deps P3-030 | Codegen, recording, test data, pre-built recipes |
| 6E: LP Code Items           | LP-001 (0.5d), LP-002 (2d), LP-003 (0.5d), LP-004 (2d), LP-005 (0.25d), LP-006 (2d), LP-007 (3d)           | 10.25d | Batch 4 (code hardening decisions inform compat)                             | 7 lower-priority code items                      |
| 6F: Additional Docs         | DOC-001 (1.5d), DOC-002 (1d)                                                                               | 2.5d   | Batch 5                                                                      | IDE setup guide + glossary                       |

**Parallel effective**: 6A-6F have significant parallelization potential; wall-clock ~18-20d.

#### Batch 7: Release Hardening — 9 items, 20+d

| Sub-batch            | Items                                                            | Effort | Dependencies                                               | Notes                                                                     |
| -------------------- | ---------------------------------------------------------------- | ------ | ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| 7A: Benchmarks       | PERF-BENCH (3d)                                                  | 3d     | INT1/INT2 (Batch 4A)                                       | Bridge/discovery/proxy performance baselines                              |
| 7B: Security         | SEC-AUDIT (2d), CSP-ASSESS (1d)                                  | 3d     | Batch 4 (code changes finalized)                           | npm audit, Snyk, CSP documentation                                        |
| 7C: Cloud ALM Chain  | P5-010 (5+d), P5-021 (2d), P5-022 (1d), P5-023 (1d), P5-024 (2d) | 11+d   | P5-021 deps P5-010; P5-022 deps P5-021; P5-023 deps P5-010 | Sequential chain: reporter format → orchestration → hybrid → traceability |
| 7D: Behavioral Tests | BEHAV-EQ (3d)                                                    | 3d     | INT1/INT2 (Batch 4A)                                       | Golden master: 8 wdi5 parity scenarios                                    |

**Parallel effective**: 7A + 7B + 7D can run in parallel with 7C starting = ~9d wall-clock.

### 18.5 Code Tasks Priority Matrix

All CODE items ranked by priority with inter-dependencies:

**Priority 1 (Critical — blocks everything):**

| Item            | Effort | Blocks         | Rationale                                                                |
| --------------- | ------ | -------------- | ------------------------------------------------------------------------ |
| BF-012          | 2d     | P3-011, P3-036 | Matchers auto-retry — single most impactful Playwright best-practice gap |
| BF-005 + BF-007 | 1d     | P3-008, P3-010 | Interaction fixes — broken press chain and false positives               |
| BF-003 + BF-004 | 2d     | P3-020         | API exposure — Capabilities and Recipes APIs incomplete                  |

**Priority 2 (High — blocks integration):**

| Item   | Effort | Blocks                             | Rationale                                                            |
| ------ | ------ | ---------------------------------- | -------------------------------------------------------------------- |
| INT1   | 3d     | INT2, BEHAV-EQ, PERF-BENCH, P5-019 | Bridge integration smoke tests — foundation for all integration work |
| INT2   | 3d     | BEHAV-EQ, PERF-BENCH               | Proxy + SAP cloud smoke tests                                        |
| AO-003 | 3d     | P3-028                             | Lifecycle hooks — enables plugin extensibility, docs depend on this  |

**Priority 3 (Medium — standalone):**

| Item     | Effort | Blocks | Rationale                                               |
| -------- | ------ | ------ | ------------------------------------------------------- |
| AO-001   | 0.5d   | —      | .d.ts navigability + .claudeignore (merged with AO-008) |
| AO-002   | 0.5d   | —      | Stack trace cleanup                                     |
| AO-004   | 0.5d   | —      | Template literal types                                  |
| AO-005   | 0.5d   | —      | Exhaustive switch audit                                 |
| AO-006   | 0.5d   | —      | Branded types expansion                                 |
| AO-007   | 1d     | —      | Type assertion reduction (REFACTOR)                     |
| AO-009   | 1d     | —      | Auto-pagination                                         |
| AO-010   | 2d     | —      | Server-side HTTP client                                 |
| D26      | 2d     | —      | UI5Object AI introspection                              |
| D5-L4    | 1d     | —      | AI telemetry completion                                 |
| WC-EVAL  | 3d     | —      | WebComponent support evaluation                         |
| REG-EVAL | 1d     | —      | Registry discovery strategy evaluation                  |
| AI-002   | 0.5d   | —      | Provider-specific capability formatting                 |
| AI-006   | 2d     | —      | any-type audit (REFACTOR)                               |
| CQ-003   | 0.1d   | —      | @example block cleanup                                  |
| BF-009   | 0.5d   | —      | Server-side logout                                      |
| BF-010   | 0.25d  | —      | Vocabulary normalization                                |
| BF-011   | 0.5d   | —      | UI5 minimum version check                               |
| BF-013   | 1d     | P3-033 | Gold standard test cleanup                              |
| BF-014   | 1d     | P3-028 | test.step() audit                                       |

**Priority 4 (Lower — LP code):**

| Item   | Effort | Blocks | Rationale                                  |
| ------ | ------ | ------ | ------------------------------------------ |
| LP-001 | 0.5d   | —      | Backward-compatibility fixture aliases     |
| LP-002 | 2d     | —      | FLP error classes (18 errors)              |
| LP-003 | 0.5d   | —      | Global setup/teardown exports              |
| LP-004 | 2d     | —      | Handler facade classes                     |
| LP-005 | 0.25d  | —      | Timeout config documentation               |
| LP-006 | 2d     | —      | Config migrator CLI                        |
| LP-007 | 3d     | —      | Compatibility layer sub-path               |
| P5-004 | 3-5d   | P5-019 | SAP-aware Codegen                          |
| P5-017 | 2d     | —      | Pre-delivered test automates               |
| P5-019 | 3d     | —      | Custom test recording (deps: P5-004, INT1) |
| P5-020 | 3d     | —      | Test data framework enhancement            |

**Priority 5 (Release):**

| Item       | Effort | Blocks         | Rationale                                      |
| ---------- | ------ | -------------- | ---------------------------------------------- |
| PERF-BENCH | 3d     | —              | Performance benchmarks (deps: INT1/INT2)       |
| BEHAV-EQ   | 3d     | —              | Behavioral equivalence tests (deps: INT1/INT2) |
| SEC-AUDIT  | 2d     | —              | Security audit                                 |
| CSP-ASSESS | 1d     | —              | CSP compliance assessment                      |
| P5-010     | 5+d    | P5-021, P5-023 | Cloud ALM integration                          |
| P5-021     | 2d     | P5-022         | Test plan orchestration                        |
| P5-022     | 1d     | —              | Hybrid test execution                          |
| P5-023     | 1d     | —              | Requirements traceability                      |
| P5-024     | 2d     | —              | Multi-tool integration                         |

### 18.6 Dependency Visualization

```text
Batch 1 (BF-*) ─────────┬──────────────────────────────────────┐
   │                     │                                      │
   ▼                     ▼                                      │
Batch 2 (PD+Scaffold)   Batch 4 (Architecture CODE)            │
   │                     │  ├─ 4A: INT1 → INT2 (sequential)    │
   ▼                     │  ├─ 4B: Evaluations (parallel)      │
Batch 3 (Tier 0 Docs)   │  ├─ 4C: Design decisions (parallel) │
   │                     │  ├─ 4D: AO items (parallel)         │
   ▼                     │  └─ 4E: AI+CQ (parallel)            │
Batch 5 (Tier 1+2 Docs) │                                      │
   │                     │                                      │
   └────────┬────────────┘                                      │
            │                                                   │
            ▼                                                   │
     Batch 6 (Advanced Docs + LP Code) ◄────────────────────────┘
            │
            ▼
     Batch 7 (Release Hardening)
         ├─ 7A: PERF-BENCH (deps 4A)
         ├─ 7B: SEC-AUDIT + CSP (deps Batch 4)
         ├─ 7C: Cloud ALM chain (P5-010 → P5-021 → P5-022/023/024)
         └─ 7D: BEHAV-EQ (deps 4A)
```

**Key insight**: Batches 4 and 5 run in parallel (code hardening + docs writing), saving ~4 weeks. Batch 7 can start as soon as Batch 4A (integration tests) completes, overlapping with Batch 6.

---

## Appendix A: Removed / Conditionally Deferred Items

### Removed (NOT included in Phase 7)

| ID     | Title            | Reason Removed             |
| ------ | ---------------- | -------------------------- |
| P4-017 | (merged/removed) | Absorbed into another item |

### Conditionally Deferred (Trigger-Based Re-Inclusion)

| ID     | Title                   | Current Status         | Trigger Condition                                                                                                                                                                                            |
| ------ | ----------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P3-015 | Migration from dhikraft | Conditionally deferred | Re-include if: (a) any dhikraft user requests migration guidance, OR (b) dhikraft reaches 10+ npm downloads/week, OR (c) LP-006 config migrator or LP-007 compat layer generates demand. Review at Gate 7.4. |

---

## Appendix B: Items Completed in Earlier Phases (Not in Phase 7)

These items were originally planned for Phase 7 but were completed earlier:

| Item                      | Completed In | Notes                                                                                                              |
| ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------ |
| Step-decorator wiring     | Phase 6      | `@ui5Step` + `withStep()` wired to 5 handlers                                                                      |
| CI/CD workflows           | Phase 6      | 4 workflows: ci.yml, docs.yml, release.yml, copilot-setup-steps.yml                                                |
| Telemetry spans           | Phase 6      | `telemetry/spans.ts` wired to handlers                                                                             |
| SBOM generation           | Phase 6      | `scripts/generate-sbom.ts` (CycloneDX)                                                                             |
| Object map cleanup        | Phase 5      | Wired into fixture teardown (Batch A3) — **confirmed by audit** (core-fixtures.ts:246-254, module-fixtures.ts:350) |
| Matcher type augmentation | Phase 5      | `PlaywrightMatchers` augmentation (Batch A2)                                                                       |
| Dead code cleanup         | Phase 5/6    | api-resolver, get-version, get-selector deleted                                                                    |

---

## Appendix C: Design Decision Status Post-Phase 7

Expected status of all 29 design decisions after Phase 7 completion:

| Decision | Status After Phase 7                                                  |
| -------- | --------------------------------------------------------------------- |
| D1–D4    | ✅ ACTIVE (no change)                                                 |
| D5       | ✅ COMPLETE (L4 AI telemetry added in 7.3)                            |
| D6–D11   | ✅ ACTIVE (no change)                                                 |
| D12      | ✅ COMPLETE (Docusaurus + TypeDoc in 7.1/7.4)                         |
| D13–D14  | ✅ ACTIVE (no change)                                                 |
| D15      | ✅ COMPLETE (security audit + provenance in 7.5)                      |
| D16–D19  | ✅ ACTIVE (no change)                                                 |
| D20      | ✅ VERIFIED (cleanup confirmed by pre-Phase 7 audit — see Appendix E) |
| D21–D25  | ✅ ACTIVE (no change)                                                 |
| D26      | ✅ COMPLETE (AI introspection in 7.3)                                 |
| D27–D28  | ✅ ACTIVE (no change)                                                 |
| D29      | ✅ COMPLETE (AI envelope if needed)                                   |

---

## Appendix E: Items Verified Complete (Pre-Phase 7 Audit)

> **Source**: Source code audit conducted 2026-02-23 against actual codebase
> **Items verified**: 12
> **Total effort saved**: 9.6 days

These items were originally planned for Phase 7 but were verified as already implemented during a source code audit. They are preserved here for traceability.

| ID         | Original Title                                 | Evidence                                                                                                                                                                                                                         | Original Effort |
| ---------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| BF-001     | Remove "Coming soon" from README               | No such text exists in README.md                                                                                                                                                                                                 | 0.1 day         |
| BF-002     | Wire `ui5=` selector engine at runtime         | Already registered in `selectorRegistration` auto-fixture at core-fixtures.ts:172-187, with idempotency handling                                                                                                                 | 0.5 day         |
| BF-006     | Add eager injection timeout guard              | Deadline check exists at injection.ts:62-74. Console.warn on timeout is appropriate for browser-context addInitScript (cannot throw Node errors from browser context). Structured BridgeError not feasible from browser context. | 0.5 day         |
| AI-001     | Recipe metadata system                         | RecipeRole, RecipePriority, selectByRole(), selectByPriority(), selectByCategory() all exist and are exported                                                                                                                    | 2 days          |
| AI-003     | Standalone discovery API (`ui5.inspect`)       | inspect() method fully implemented at ui5-handler.ts:600-671 with @ui5Step decoration                                                                                                                                            | 1 day           |
| AI-004     | Add `@ai` TSDoc tags to public fixture methods | 65+ @ai tags already applied across all fixture files                                                                                                                                                                            | 1 day           |
| AI-005     | Verify/add jitter in retry utility             | Math.random() jitter at retry.ts:73, enabled by default                                                                                                                                                                          | 0.25 day        |
| AI-007     | Configure API Extractor for `.api.md` reports  | Configured at api-extractor.json, script at package.json:98, output in temp/                                                                                                                                                     | 1 day           |
| CQ-002     | Add section separators to dialog.ts            | Three section separators already exist in dialog.ts                                                                                                                                                                              | 0.25 day        |
| D20-VERIFY | Object map cleanup verification                | Wired in core-fixtures.ts:246-254 and module-fixtures.ts:350                                                                                                                                                                     | 0.5 day         |
| LP-008     | Generate JSON Schema from TypeScript types     | Script exists at scripts/generate-json-schema.ts, npm script at package.json:107                                                                                                                                                 | 2 days          |
| NPM-PROV   | npm provenance (`--provenance` on publish)     | --provenance flag at release.yml:55                                                                                                                                                                                              | 0.5 day         |

---

## Appendix F: Items Determined Unnecessary

> **Source**: Source code audit conducted 2026-02-23 against actual codebase
> **Items determined unnecessary**: 2
> **Total effort saved**: 1.75 days

These items were originally planned for Phase 7 but were determined unnecessary during a source code audit. The underlying assumptions were incorrect for the ground-up rewrite.

| ID     | Original Title                        | Reason Unnecessary                                                                                                                                                                                                                                                                                                                                       | Original Effort |
| ------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| BF-008 | Fix retry utility `maxAttempts=1` bug | The code uses `maxRetries` not `maxAttempts`. Loop `for (let attempt = 0; attempt <= maxRetries; attempt++)` is mathematically correct. `maxRetries=0` means 1 attempt, `maxRetries=1` means 2 attempts. No bug exists. The plan's terminology (`maxAttempts`) does not match the actual implementation (`maxRetries`), which led to a false bug report. | 0.25 day        |
| CQ-001 | Replace boolean flags in table.ts     | The flags `includeHeaders`, `returnRawValues`, `waitForData`, `scrollToRow` do NOT exist in the current ground-up rewrite. These were dhikraft v2.5.0 flags. Only `skipStabilityWait?: boolean` exists in the current `table.ts`, which is clear and unambiguous. No refactoring needed.                                                                 | 1.5 days        |

---

## 17. Agent Review Enhancements

> **Source**: 6-agent review conducted 2026-02-23 (TDD Expert, Playwright Expert, Playwright Persona, wdi5 Persona, Tosca Persona, Senior Architect)
> **Total feedback items received**: 108 (37 + 16 + 18 + 16 + 14 + 7)
> **Deduplicated actionable items**: 72 (36 duplicates removed across agents)
> **Items resulting in plan changes**: 65
> **New code items added**: 4 (BF-012, BF-013, BF-014, P5-025)
> **Existing items expanded**: 38
> **Architectural confirmation**: Senior Architect confirmed all 5 layers covered, dependency directions correct, integration points well-defined

### 17.1 Sub-Phase 7.0 Changes

| Change                                                                                                                           | Source Agent(s)                             | Impact                       |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------- |
| BF-002: Added test boundary specs (unit vs integration, idempotency, error paths), scope clarification                           | TDD Expert A1, Playwright Expert A4         | Expanded acceptance criteria |
| BF-003: Enumerated all 8 capability methods explicitly                                                                           | TDD Expert A2                               | Clarity                      |
| BF-004: Enumerated all 14 recipe methods explicitly                                                                              | TDD Expert A3                               | Clarity                      |
| BF-005: Added mock strategy for `page.evaluate()`, expanded control list to 4 controls, OPA5 SELECT interaction note             | TDD Expert A4, wdi5 Persona H2              | Test spec + correctness      |
| BF-006: Added error code `ERR_BRIDGE_INJECTION_TIMEOUT`, `retryable: false`, `vi.useFakeTimers()` mock strategy                  | TDD Expert A5                               | Error details                |
| BF-007: Added error class details, affected strategies list, current `{success: false}` shape                                    | TDD Expert A6                               | Error details                |
| BF-008: Added terminology clarification (`maxAttempts` vs `maxRetries`), pre-check for existing coverage, PW retries distinction | TDD Expert A7, Playwright Persona D4        | Correctness                  |
| BF-009: Added auth strategies needing server logout, logout URL patterns, mock approach                                          | TDD Expert A8                               | Test spec                    |
| BF-010: Added normalization character spec and 5 test data examples                                                              | TDD Expert A9                               | Test data                    |
| BF-011: Noted `stability.ts` does not exist, specified version detection approach and UI5 API dependencies                       | TDD Expert A10, wdi5 Persona M4             | Correctness                  |
| **NEW** BF-012: Refactor all 10 matchers for web-first auto-retry via `toPass()` pattern                                         | Playwright Expert A1, Playwright Persona A3 | **Critical code task**       |
| **NEW** BF-013: Fix gold standard test — remove `page.waitForTimeout()` and `console.log()`                                      | Playwright Expert A2 + A3                   | **Critical code task**       |
| **NEW** BF-014: Audit `test.step()` decoration across all fixture public methods                                                 | Playwright Expert B3                        | **Code task**                |
| All bug fixes: Added RED-phase regression test requirement                                                                       | TDD Expert E4                               | Test strategy                |
| All code items: Added explicit test file paths                                                                                   | TDD Expert E1                               | Traceability                 |

### 17.2 Sub-Phase 7.1 Changes

| Change                                                                                        | Source Agent(s)                              | Impact                 |
| --------------------------------------------------------------------------------------------- | -------------------------------------------- | ---------------------- |
| P3-001: Added "Why not Locators?" explanation callout, `.env.example`, `mergeTests()` pattern | Playwright Persona A1, Playwright Persona A4 | Adoption-critical      |
| P3-003: Added `storageState` + `globalSetup` + `projects` pattern end-to-end                  | Playwright Persona C5                        | Best practice          |
| P3-005: Added SAP control type cheat sheet with 15+ controls                                  | Playwright Persona C1                        | Developer productivity |
| P3-036: Added `.env.example` and `playwright.config.example.ts` to examples                   | Playwright Persona A4                        | Adoption               |
| Gate 7.1: Added MVP Gate definition — minimum viable for adoption                             | Playwright Persona D3                        | Quality gate           |

### 17.3 Sub-Phase 7.2 Changes

| Change                                                                                                                                                                              | Source Agent(s)                                  | Impact                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| P3-008: Added auto-waiting behavior section (praman vs Playwright native)                                                                                                           | Senior Architect #2                              | Documentation completeness                      |
| P3-009: Added WDI5Control vs UI5ControlBase comparison table                                                                                                                        | wdi5 Persona H1                                  | wdi5 migration                                  |
| P3-010: Added default strategy rationale, `expect.poll()` example, retry pattern                                                                                                    | Senior Architect #3, wdi5 Persona L2             | Documentation completeness                      |
| P3-011: Added auto-retry note (post BF-012), `expect.poll()` example, matcher API clarification                                                                                     | Playwright Expert B1, Senior Architect #3        | Documentation completeness                      |
| P3-016: Expanded with 12+ field wdi5 selector mapping table, `{ selector: {...} }` wrapper removal warning, `bindingPath` shape difference, `labelFor` gap, "New in praman" section | wdi5 Persona C1 + C2 + C3 + H5 + L3              | **Major expansion**                             |
| P3-017: Added hybrid PW+praman test, parallel execution guidance                                                                                                                    | Playwright Persona B1 + C4, Playwright Expert B4 | Best practice                                   |
| P3-018: Expanded audience to 3 sub-tracks (CBTA scripting, Tosca zero-code, manual), added prerequisite learning path, wdi5 note                                                    | Tosca Persona #2, wdi5 Persona H4                | Audience clarity                                |
| P3-019: Expanded from 4-row to 25-row concept mapping, added team workflow Git transition, intent-to-TX mapping callout                                                             | Tosca Persona #1 (Critical)                      | **Major expansion** — effort increased 3d -> 4d |
| P3-020: No changes (already well-specified)                                                                                                                                         | —                                                | —                                               |

### 17.4 Sub-Phase 7.3 Changes

| Change                                                                                                                                                                 | Source Agent(s)                                                                  | Impact                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| INT1/INT2: Added SAP app URLs, Playwright config details, test case lists, assertion inventories, timing bounds, `page.route()` OData mocking fallback                 | TDD Expert B1, Playwright Expert B2 + B6, Playwright Persona B3, wdi5 Persona M5 | **Major expansion**                                          |
| AO-002: Added cross-platform guard test spec (V8-specific `captureStackTrace`)                                                                                         | TDD Expert B2                                                                    | Test correctness                                             |
| AO-003: Added per-event test scenarios, listener leak test, async listener test                                                                                        | TDD Expert B3                                                                    | Test completeness                                            |
| AO-004: Added `expectTypeOf()` pattern, `*.types.test.ts` naming convention                                                                                            | TDD Expert B4                                                                    | Test approach                                                |
| AO-007: Clarified as REFACTOR — no new tests, typecheck+existing tests only                                                                                            | TDD Expert B5                                                                    | Reduced effort                                               |
| AO-009: Added mock OData V2/V4 response shapes                                                                                                                         | TDD Expert B6                                                                    | Test spec                                                    |
| AO-010: Added error codes (`ERR_HTTP_TIMEOUT`, etc.) and mock strategy (vi.fn, not msw)                                                                                | TDD Expert B7                                                                    | Error details                                                |
| AI-001: Added discriminated union details and compile-time type test (later moved to Appendix E by source code audit)                                                  | TDD Expert B8                                                                    | Type safety                                                  |
| AI-003: Added bridge mock approach and output shape definition                                                                                                         | TDD Expert B9                                                                    | Test spec                                                    |
| AI-006: Clarified as REFACTOR — typecheck verification only, no RED phase                                                                                              | TDD Expert B10                                                                   | Reduced effort                                               |
| CQ-001: Added migration plan requirement, existing test update list, noted public API change (later moved to Appendix F — determined unnecessary by source code audit) | TDD Expert B11                                                                   | **Breaking change management** — effort increased 1d -> 1.5d |
| WC-EVAL: Added `>>` combinator specifics with examples                                                                                                                 | Playwright Expert B5                                                             | Technical detail                                             |
| REG-EVAL: Clarified scope vs existing Tier 2 registry scan                                                                                                             | wdi5 Persona M1                                                                  | Scope clarity                                                |
| New modules: Added coverage tier assignment note for `vitest.config.ts`                                                                                                | TDD Expert E2                                                                    | Coverage                                                     |

### 17.5 Sub-Phase 7.4 Changes

| Change                                                                                                      | Source Agent(s)                                                  | Impact                                            |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| P3-024: Added queue drain semantics clarification                                                           | wdi5 Persona H3                                                  | Technical clarity                                 |
| P3-028: Added trace viewer limitations, `verbose` -> `debug` log level mapping, video config recommendation | Playwright Expert C4, Playwright Persona B4, Senior Architect #5 | Documentation completeness                        |
| P3-030: Added Purchase-to-Pay cross-process E2E tutorial                                                    | Senior Architect #1                                              | New content — effort increased 5d -> 6d           |
| P3-031: Added ComboBox, MultiComboBox, MultiInput, Select, DatePicker                                       | wdi5 Persona M3                                                  | 5 additional controls — effort increased 5d -> 6d |
| P5-019: Added `page.evaluate()` serialization constraint warning                                            | TDD Expert C4                                                    | Critical correctness                              |
| P5-020: Expanded with LIFO cleanup test, error handling for partial failure, Tosca TDM gap note             | TDD Expert C5, Tosca Persona #3                                  | Effort increased 2d -> 3d                         |
| **NEW** P5-025: Visual regression testing with `toHaveScreenshot()` SAP specifics                           | Senior Architect #4                                              | **New doc item**                                  |
| LP-002: Enumerated all 18 FLP error codes                                                                   | TDD Expert C1                                                    | Completeness                                      |
| LP-006: Added dhikraft config shape and sample I/O, wdi5 migrator future note                               | TDD Expert C2, wdi5 Persona L1                                   | Clarity                                           |
| LP-007: Added fixture mapping table and attw validation note                                                | TDD Expert C3                                                    | Completeness                                      |
| DOC-001: Expanded scope for non-developers — effort increased 0.5d -> 1.5d                                  | Tosca Persona #5                                                 | **Major expansion**                               |
| DOC-002: Required Tosca equivalent for EVERY term — effort increased 0.5d -> 1d                             | Tosca Persona #6                                                 | Completeness                                      |
| P5-004: Noted Tosca persona priority (most important deferred item for them)                                | Tosca Persona #4                                                 | Priority awareness                                |
| P3-032: Noted intent API to TX code mapping should appear earlier                                           | Tosca Persona #7                                                 | Priority awareness                                |

### 17.6 Sub-Phase 7.5 Changes

| Change                                                                                        | Source Agent(s)                 | Impact                |
| --------------------------------------------------------------------------------------------- | ------------------------------- | --------------------- |
| PERF-BENCH: Added baseline target numbers, 2x regression threshold, statistical approach note | TDD Expert D1                   | Measurability         |
| BEHAV-EQ: Added comparison methodology and 8 specific wdi5 parity scenarios                   | TDD Expert D2, wdi5 Persona M2  | Test completeness     |
| P5-010: Added JUnit 5 schema version, Cloud ALM timeline note                                 | TDD Expert D3, Tosca Persona #8 | Technical detail      |
| P5-021: Added annotation mechanism details (Playwright `test.info().annotations` API)         | TDD Expert D4                   | Implementation detail |

### 17.7 Cross-Cutting Changes

| Change                                                                                     | Source Agent(s)       | Impact               |
| ------------------------------------------------------------------------------------------ | --------------------- | -------------------- |
| All code items: Require explicit test file paths                                           | TDD Expert E1         | Traceability         |
| New modules: Require coverage tier assignment in `vitest.config.ts`                        | TDD Expert E2         | Coverage enforcement |
| Bug fixes: Require RED-phase regression test (failing test demonstrates bug)               | TDD Expert E4         | TDD discipline       |
| All browser scripts: Reminder about `page.evaluate()` serialization constraints            | TDD Expert E7         | Correctness          |
| P3-015 (dhikraft migration): Moved from "Removed" to "Conditionally Deferred" with trigger | Senior Architect #6   | Flexibility          |
| `ui5.waitFor(selector)` convenience API: Noted for evaluation (not added to plan)          | Senior Architect #7   | Future consideration |
| `requestInterceptor` auto-fixture opt-out: Not documented — add to P3-006                  | Playwright Persona B2 | Documentation gap    |
| `expect(control)` typing story: Add to P3-011 matchers doc                                 | Playwright Persona C2 | Documentation gap    |
| SAP GUI testing: Known limitation — never mentioned, add sidebar note to P3-018            | Tosca Persona #13     | Expectation setting  |
| Onboarding timeline estimates per persona: Add to P3-018/019 intros                        | Tosca Persona #14     | User guidance        |
| Visual reporting dashboard: Not planned — document as future roadmap item                  | Tosca Persona #12     | Expectation setting  |
| Excel/CSV data input: Out of scope for v1.0 — documented in P5-020 as future               | Tosca Persona #9      | Expectation setting  |

### 17.8 Items NOT Incorporated (With Rationale)

| Feedback                                                     | Agent               | Rationale for Not Including                                                                                                    |
| ------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `ui5.waitFor(selector)` convenience API                      | Senior Architect #7 | Evaluate during 7.3 — may conflict with auto-waiting philosophy. Noted but not planned.                                        |
| `labelFor` added to UI5Selector type                         | wdi5 Persona H5     | Documented as known gap in P3-016 with workaround. Adding to type requires bridge changes — defer to Phase 8 if demand exists. |
| Full Playwright Codegen extension (not just post-processing) | Tosca Persona #4    | Codegen extension API is unstable (W10 decision). Post-processing script is Phase 7 scope.                                     |
| SAP GUI testing support                                      | Tosca Persona #13   | Out of scope — praman is a web testing tool. SAP GUI requires different tooling (Scripting API).                               |
| Cloud ALM direct API integration                             | Tosca Persona #8    | Requires SAP partnership (R4 risk). Reporter format compatibility is Phase 7 scope.                                            |

### 17.9 Dependency Map for New Code Items

```text
BF-012 (matchers auto-retry)
  └── P3-011 (matchers docs) depends on BF-012

BF-013 (gold standard cleanup)
  └── P3-033 (gold standard docs) depends on BF-013

BF-014 (test.step audit)
  └── P3-028 (debugging docs) references step visibility

BF-005 (fireSelect fix)
  └── BF-007 (strategy error throwing) — both touch interaction-strategies/

CQ-001 (table.ts discriminated unions) — REMOVED (audit: flags don't exist in rewrite; moved to Appendix F)
  └── No downstream dependencies affected

LP-007 (compat sub-path)
  └── package.json exports (7th sub-path)
  └── attw validation must pass with 7/7
```
