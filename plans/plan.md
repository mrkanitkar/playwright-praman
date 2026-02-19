# Praman v1.0 — AI-First SAP UI5 Test Automation Platform

## Architecture & Rebuild Plan

| Property         | Value                                                                     |
| ---------------- | ------------------------------------------------------------------------- |
| **Document ID**  | PRAMAN-ARCH-PLAN-001                                                      |
| **Version**      | 3.0.0                                                                     |
| **Status**       | 🟢 Phase 3 COMPLETE — 1,394 tests, 99 test files, 109 source files, 1 E2E |
| **Author**       | Principal Architect                                                       |
| **Created**      | 2025-02-14                                                                |
| **Last Updated** | 2026-02-19 (Post-Phase 3 Architect Review)                                |

---

## Reference Code Repositories

This architecture plan references source code from the following local repositories (read-only):

| Repository               | Path                                                | Purpose                                                                                  |
| ------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **wdi5** (upstream)      | `/Users/maheshwar/Documents/projects/consult/wdi5/` | WebdriverIO-based SAP UI5 testing framework - architectural reference and pattern source |
| **dhikraft v2.5.0**      | `/Users/maheshwar/Documents/projects/package/`      | Previous Playwright port - capability analysis and migration reference                   |
| **praman v1.0** (target) | `/Users/maheshwar/Documents/projects/mk1/`          | New ground-up implementation - this project                                              |

### Key Source Files

**wdi5** (`/Users/maheshwar/Documents/projects/consult/wdi5/src/`):

- `lib/wdio-ui5-service.ts` - Main service entry point
- `lib/wdi5-control.ts` - Control proxy implementation
- `lib/scripts/` - Browser-side injection scripts
- `lib/wdi5-bridge.ts` - Bridge pattern implementation

**dhikraft v2.5.0** (`/Users/maheshwar/Documents/projects/package/`):

- `src/ui5-control-proxy.ts` (1,829 LOC) - Control proxy with double-proxy pattern
- `src/ui5-handler.ts` (2,318 LOC) - Monolithic handler (target for decomposition)
- `src/dhikraft-fixtures.ts` (2,263 LOC) - All fixtures in one file
- `src/ui5-object.ts` - UI5Object proxy chain
- `src/interaction-strategies/` - Pluggable interaction strategies
- `dist-cjs/` - Compiled package output
- `examples/` - Usage examples
- `skills/` - AI agent skill files

---

## Reference Analysis Documents

Detailed analysis documents supporting architectural decisions are located at:
`/Users/maheshwar/Documents/projects/consult/one/`

| Document                                    | Purpose                                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| `wdi5-dhikraft-gap-analysis.md`             | Comprehensive gap analysis: wdi5 → dhikraft migration coverage (86% ported) |
| `wdi5-dhikraft-mapping.md`                  | Feature-by-feature mapping between frameworks                               |
| `capabilities.md`                           | Capability registry analysis                                                |
| `zodanalysis.md`                            | Zod validation boundary analysis (Decision D6, D7)                          |
| `behavioral-verification-plan.md`           | Golden master testing strategy                                              |
| `behavioral-verification-execution-plan.md` | Behavioral test execution roadmap                                           |
| `behavioral-verification-ui5-demo.md`       | UI5 demo app test scenarios                                                 |
| `skills-architect.md`                       | AI agent skill: Architecture decisions, module boundaries                   |
| `skills-implementer.md`                     | AI agent skill: TypeScript implementation, proxy, bridge                    |
| `skills-playwright-expert.md`               | AI agent skill: Playwright fixtures, selectors, matchers                    |
| `skills-sap-ui5-expert.md`                  | AI agent skill: SAP UI5 controls, FLP, OData, RecordReplay                  |
| `skills-tester.md`                          | AI agent skill: Unit/integration tests, coverage                            |
| `skills-reviewer.md`                        | AI agent skill: PR review, quality gates                                    |
| `skills-security-build.md`                  | AI agent skill: CI/CD, security, build, release                             |
| `skills-team-overview.md`                   | AI agent skill: Team overview, collaboration model                          |
| `dhikraft-sap-planner.agent.md`             | Agent planning template                                                     |
| `setup.md`                                  | Setup and workspace configuration                                           |
| `verifywd.md`                               | Verification documentation                                                  |
| `sap-seed.spec.ts`                          | Example test specification                                                  |

**Note**: These are supplementary analysis documents. The canonical architecture plan is this document.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Gap Analysis Summary](#3-gap-analysis-summary)
4. [Design Decisions Log](#4-design-decisions-log)
5. [Target Architecture](#5-target-architecture)
6. [Module Decomposition](#6-module-decomposition)
7. [Technology Stack](#7-technology-stack)
8. [Configuration & Workspace Strategy](#8-configuration--workspace-strategy)
9. [Quality & Compliance](#9-quality--compliance)
10. [Documentation Strategy](#10-documentation-strategy)
11. [Iteration Plan](#11-iteration-plan)
12. [Appendix A — Wizard Q&A Log](#appendix-a--wizard-qa-log)
13. [Appendix B — Single Package Design Benefits](#appendix-b--single-package-design-benefits)
14. [Appendix C — v2.5.0 Deep Analysis: Proxy Architecture](#appendix-c--v250-deep-analysis-proxy-architecture)
15. [Appendix D — v2.5.0 Carry-Forward Capabilities](#appendix-d--v250-carry-forward-capabilities)
16. [Appendix E — Enhanced Design Decisions (D16–D27)](#appendix-e--enhanced-design-decisions-d16d27)

---

## 1. Executive Summary

This document defines the architecture and implementation plan for **Praman v1.0** — a ground-up rebuild (not a port of dhikraft v2.5.0) of the SAP UI5 test automation plugin for Playwright. Praman v1.0 is designed to be:

- **AI-First**: Native support for AI agents (GitHub Copilot, LLM-based test generators) as first-class consumers alongside human testers.
- **Enterprise-Grade**: Strict TypeScript, comprehensive logging, security hardening, and SAP/Playwright certification readiness.
- **Future-Proof**: Browser scripts decouple from specific UI5 versions; `PlaywrightCompat` layer decouples from Playwright versions. Bridge adapter abstraction was removed in Phase 3 as premature — browser scripts are the correct abstraction boundary.
- **Plug-and-Play**: Single `npm install playwright-praman` — zero-config defaults with progressive disclosure of advanced options.

### Origin

Praman (registered as `playwright-praman` on npm) is a port of [wdi5](https://ui5-community.github.io/wdi5/) (WebdriverIO-based SAP UI5 testing framework) to Playwright, with additional AI/agent features. The previous version was called "dhikraft". v1.0 is a complete ground-up rewrite — new code, new architecture, new name, informed by dhikraft v2.5.0 lessons but not constrained by its codebase.

### Key Architectural Decisions Summary

| #   | Decision                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Single package** (`playwright-praman`) with sub-path exports — not a monorepo                                                   |
| D2  | **Internal fixture composition** — all fixtures in one package, conditionally loaded                                              |
| D3  | ~~**Version-negotiated bridge adapters**~~ — REMOVED Phase 3: adapter was premature abstraction, caused data loss                 |
| D4  | **Hybrid typed proxy** — typed interfaces for top ~20 controls over dynamic Proxy                                                 |
| D5  | **4-layer observability** — Playwright Reporter + pino + OpenTelemetry + AI telemetry                                             |
| D6  | **Boundary validation** — Zod at external boundaries only                                                                         |
| D7  | **Zod-validated config** — `praman.config.ts` with env overrides; Ajv removed                                                     |
| D8  | **Unified error hierarchy** — `PramanError` base with error codes, details, self-healing context                                  |
| D9  | **AI: Mode A + C** — SKILL.md for code-gen; agentic fixture for in-test agents                                                    |
| D10 | **Testing** — migrate + extend existing 65+ tests; GitHub Actions CI                                                              |
| D11 | **No plugin API** in v3.0                                                                                                         |
| D12 | **Docs** — auto-gen SKILL.md + Docusaurus + TypeDoc on GitHub Pages                                                               |
| D13 | **Apache 2.0** license                                                                                                            |
| D14 | **Playwright compat** — `>=1.50.0 <2.0.0` with CI matrix                                                                          |
| D15 | **Security** — dep scanning, secret redaction, SBOM, provenance, static analysis                                                  |
| D16 | **Single unified proxy** — merge double-proxy into one Proxy handler per control                                                  |
| D17 | **Bidirectional proxy conversion** — UI5Object ↔ UI5ControlProxy navigation                                                       |
| D18 | **Integrate or remove ControlDiscoveryFactory** — dead code in v2.5.0                                                             |
| D19 | **Centralized API resolver** — `__praman_getById()` registered globally, used everywhere                                          |
| D20 | **Browser objectMap cleanup** — TTL + WeakRef for browser-side UUID→object storage                                                |
| D21 | **Shared interaction logic** — extract shared fireEvent + bridge accessor across strategies                                       |
| D22 | **Auto-generated method signatures** — replace static 12-control hardcoded signatures                                             |
| D23 | **skipStabilityWait** — global config default + per-selector override                                                             |
| D24 | **exec() with new Function()** — keep with ESLint disable + security documentation                                                |
| D25 | **Visibility preference default** — prefer visible controls, fall back to hidden                                                  |
| D26 | **UI5Object AI introspection** — first-class capability with describe/suggestOperations                                           |
| D27 | **Module size guideline** — ≤300 LOC warning (not blocking) with documented exceptions                                            |
| D28 | **Auth via project dependencies** — Playwright setup project, not globalSetup (BP-PLAYWRIGHT)                                     |
| D29 | **Enhanced error model + AI response envelope** — Google error codes/details + Claude self-healing + consistent AI response shape |

---

## 2. Current State Assessment

### 2.1 wdi5 Architecture (Source of Truth)

**Source**: `/Users/maheshwar/Documents/projects/consult/wdi5/src/`
**Key Files**: `lib/wdio-ui5-service.ts`, `lib/wdi5-control.ts`, `lib/scripts/*.ts`

| Aspect              | Detail                                                           |
| ------------------- | ---------------------------------------------------------------- |
| **Package**         | `wdio-ui5-service` v3.0.8 — single npm package                   |
| **Bridge Pattern**  | `browser.execute()` → `window.bridge` (SAP RecordReplay API)     |
| **Control Proxy**   | Dynamic method attachment via `_attachControlBridge` (1,054 LOC) |
| **Client-Side JS**  | 17 files injected into browser context                           |
| **Auth Strategies** | BTP SAML, Basic, Office365, Custom                               |
| **FE Support**      | Fiori Elements test library (ListReport, ObjectPage)             |
| **Extension Model** | WebdriverIO Service plugin (no user plugin API)                  |
| **Dependencies**    | Minimal: `compare-versions`, `cross-dirname`                     |

### 2.2 Dhikraft v2.5.0 Architecture (Current State)

**Source**: `/Users/maheshwar/Documents/projects/package/src/`
**Distribution**: `/Users/maheshwar/Documents/projects/package/dist-cjs/`
**Key Files**: `ui5-control-proxy.ts`, `ui5-handler.ts`, `dhikraft-fixtures.ts`

| Aspect             | Detail                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Package**        | `dhikraft` v2.5.0 — single npm package                                                                |
| **Bridge Pattern** | `page.evaluate()` + custom selector engine (`ui5=` prefix)                                            |
| **Control Proxy**  | 3-tier discovery: Registry → Direct ID → RecordReplay (1,829 LOC)                                     |
| **Fixtures**       | 32 Playwright test fixtures (all in 1 file: 2,263 LOC)                                                |
| **Auth**           | Global setup + storageState pattern                                                                   |
| **AI Features**    | Intent APIs, vocabulary system, AI service integration, agentic handler, capability/recipe registries |
| **Tests**          | 65+ unit tests, 15+ integration tests (SAP demo apps + cloud), auth tests, smoke tests                |
| **Dependencies**   | `ajv`, `ajv-formats`, `dotenv`, `zod` (unused), `zod-to-json-schema` (unused)                         |

### 2.3 Codebase Metrics (Dhikraft v2.5.0)

| Metric                          | Value                                      | Assessment                  |
| ------------------------------- | ------------------------------------------ | --------------------------- |
| Source files                    | ~80+                                       | High — needs modularization |
| Largest file                    | `ui5-handler.ts` (2,318 LOC)               | 🔴 God object               |
| 2nd largest                     | `dhikraft-fixtures.ts` (2,263 LOC)         | 🔴 Monolithic               |
| 3rd largest                     | `ui5-control-proxy.ts` (1,829 LOC)         | 🟡 Complex but focused      |
| Intent wrappers                 | `intent-wrappers.ts` (1,579 LOC)           | 🟡 Growing                  |
| Bridge injection                | `injection.ts` (1,035 LOC)                 | 🟡 Complex                  |
| Dead dependencies               | Zod + zod-to-json-schema (0 imports)       | 🔴 Waste                    |
| Triple error class              | 3 incompatible `DhikraftError` definitions | 🔴 Architectural debt       |
| Compiled artifacts in test dirs | .js, .d.ts, .map, .bak files               | 🔴 Technical debt           |

---

## 3. Gap Analysis Summary

### 3.1 wdi5 → Praman (formerly dhikraft) Migration Score: **86%**

| Status          | Count | %   | Details                                                          |
| --------------- | ----- | --- | ---------------------------------------------------------------- |
| ✅ Fully Ported | 26    | 59% | Core capabilities working (G5 reclassified from Missing)         |
| 🔄 Redesigned   | 12    | 27% | Adapted to Playwright idioms                                     |
| ⚠️ Partial      | 5     | 11% | WorkZone, webElement access                                      |
| ❌ Missing      | 0     | 0%  | ~~`getSelectorForElement`~~ → now ✅ via `selector-discovery.ts` |
| 🚫 N/A          | 1     | 2%  | WebdriverIO-specific                                             |

### 3.2 Identified Architectural Gaps

| #       | Gap                                                 | Severity        | v3.0 Resolution                                                                           |
| ------- | --------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------- |
| G1      | Monolithic handlers (2,318 LOC)                     | 🔴 High         | Ground-up rewrite with SRP modules (<300 LOC guideline)                                   |
| G2      | Monolithic fixtures (2,263 LOC)                     | 🔴 High         | Split into domain-specific fixture files                                                  |
| G3      | No behavioral tests                                 | 🔴 High         | Golden master behavioral equivalence tests                                                |
| G4      | No plugin/extension API                             | 🟡 Medium       | Deferred to v3.1+ (D11)                                                                   |
| G5      | ~~Missing `getSelectorForElement`~~                 | ~~🟡 Medium~~   | ✅ **Already ported** in `selector-discovery.ts` (530 LOC). v3.0: migrate & enhance       |
| G6      | WorkZone not exposed via fixtures                   | 🟡 Medium       | Expose as fixture                                                                         |
| G7      | No structured logging                               | 🟡 Medium       | pino with child loggers (D5)                                                              |
| G8      | No reporters                                        | 🟡 Medium       | Custom Playwright reporters                                                               |
| G9      | Technical debt (backup files)                       | 🟡 Medium       | Clean slate — ground-up rewrite                                                           |
| G10     | Triple error hierarchy                              | 🔴 High         | Unified `PramanError` (D8)                                                                |
| G11     | Dead dependencies (Zod unused)                      | 🟡 Medium       | Zod used properly at boundaries (D6)                                                      |
| G12     | No version negotiation                              | 🟡 Medium       | Bridge adapters (D3)                                                                      |
| G13     | No Web Component support                            | 🟡 Medium       | WebComponentAdapter in Phase 2 (D3)                                                       |
| G14     | No telemetry/observability                          | 🟢 Low          | OpenTelemetry opt-in (D5)                                                                 |
| **G15** | **Double-proxy pattern redundancy**                 | **🔴 High**     | **Merge to single proxy (D16)**                                                           |
| **G16** | **One-directional cross-proxy (UI5Object→Control)** | **🟡 Medium**   | **Add bidirectional proxy conversion (D17)**                                              |
| **G17** | **ControlDiscoveryFactory not integrated**          | **🔴 High**     | **Integrate or remove dead code (D18)**                                                   |
| **G18** | **Duplicated 3-tier API resolution (6 copies)**     | **🟡 Medium**   | **Centralize in bridge global function (D19)**                                            |
| **G19** | **Browser objectMap has no cleanup**                | **🟡 Medium**   | **Add TTL + WeakRef on browser side (D20)**                                               |
| **G20** | **Interaction strategy code duplication**           | **🟡 Medium**   | **Extract shared bridge accessor + shared fireEvent (D21)**                               |
| **G21** | ~~Static method signatures for only 12 controls~~   | ✅ **RESOLVED** | **D22 COMPLETE — 199 auto-generated interfaces, 4,092 methods**                           |
| **G22** | **No forceSelect / auto-retry on stale**            | **🟢 Low**      | **v2.5.0 has manual renewWebElementReference() — sufficient for dynamic SAP pages (D23)** |

---

## 4. Design Decisions Log

| #   | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Rationale                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Date                                                                                                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| D1  | **Single package** (`playwright-praman`) with sub-path exports (`playwright-praman/ai`, `playwright-praman/intents`, `playwright-praman/vocabulary`, `playwright-praman/fe`, `playwright-praman/reporters`). SRP via directory structure + ESLint import rules — not package boundaries. One version, one build, one install.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Playwright, wdi5, Cypress are all single packages. One coherent plugin = one package. Sub-path exports provide opt-in imports without install fragmentation. ESLint enforces ≤300 LOC per module. Single version, single build, zero workspace overhead.                                                                                                                                                                                                                                                                                     | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D2  | **Internal fixture composition** — All fixtures defined in domain-specific files within one package (`fixtures/core-fixtures.ts`, `fixtures/auth-fixtures.ts`, `fixtures/ai-fixtures.ts`, etc.). Assembled in `src/fixtures/index.ts` via TypeScript `extend()` chain. No runtime package discovery. Heavy fixtures (AI, OTel) use dynamic `import()` — loaded only when the fixture is actually used in a test (BP-CLAUDE: minimal footprint, no unused module loading).                                                                                                                                                                                                                                                                                                                                                                                       | Single package enables static import chain for fixture composition — simple, type-safe, debuggable. No runtime discovery needed. Heavy optional modules lazy-loaded for startup performance.                                                                                                                                                                                                                                                                                                                                                 | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D3  | **Version-negotiated bridge adapters** — Detect UI5 version at runtime, load matching adapter (`ClassicUI5Adapter` for 1.71+/1.84+/1.108+, `WebComponentAdapter` for `@ui5/webcomponents`, `HybridAdapter` for mixed pages). Web Component support in Phase 2 (minimum: no-crash + FLP shell bar interactions). Bridge communication retries use **exponential backoff with jitter** (BP-GOOGLE/SRE: prevents thundering herd on transient failures; max 3 retries, base 200ms, jitter ±50ms).                                                                                                                                                                                                                                                                                                                                                                  | FLP shell already uses `@ui5/webcomponents-fiori` (ShellBar, Avatar). Adapter interface enables future-proofing without bridge rewrites. Graceful degradation for unknown versions. Google SRE recommends exponential backoff + jitter for all inter-process retries.                                                                                                                                                                                                                                                                        | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D4  | **Hybrid typed proxy** — Ship typed TypeScript interfaces for top ~20 controls (`UI5Button`, `UI5Input`, `UI5Table`, `UI5ComboBox`, `UI5GenericTile`, etc.) that delegate to a cleaned-up dynamic `Proxy` underneath. Uncommon controls fall back to untyped dynamic proxy. Typed interfaces auto-generated from SAP UI5 `api.json` metadata.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | IntelliSense + compile-time safety for 95% of use cases; AI agents can introspect available methods; full flexibility retained for edge cases via dynamic fallback.                                                                                                                                                                                                                                                                                                                                                                          | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D5  | **4-layer observability stack** — L1: Playwright Reporter API (test events via `test.step()`). L2: pino structured JSON logging (child loggers per module, correlation IDs, AI-friendly action-result format, error classification). L3: OpenTelemetry opt-in tracing + metrics (spans for bridge/proxy/auth, exporters for Azure Monitor/Jaeger/OTLP). L4: AI Agent Telemetry (capability introspection, deterministic replay log, token-efficient summary mode). pino always-on; OTel zero-overhead when disabled.                                                                                                                                                                                                                                                                                                                                            | Converged best practice from Playwright (event-driven reporters), Microsoft (OTel standard), Google (pino + structured JSON), Anthropic/Claude (action-result, replayable, classifiable), OpenAI (token-efficient, retryable errors).                                                                                                                                                                                                                                                                                                        | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D6  | **Boundary validation principle** — Zod validation at external boundaries only (config, OData responses, LLM output, test data, user selectors in debug mode). Internal TypeScript interfaces remain compile-time contracts — no runtime validation. Browser bridge `as unknown` casts accepted as inherent Playwright constraint.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Zod analysis of v2.5.0: 33 env vars unsafely parsed, 6 OData blind casts, regex-based LLM parsing. Boundaries are high-ROI; internal validation is busywork. Aligns with Google/Microsoft principle: "validate at entry point, trust downstream".                                                                                                                                                                                                                                                                                            | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D7  | **Zod-validated `praman.config.ts`** — Single config file parsed by `PramanConfigSchema` at startup. Typed defaults, env var overrides (`PRAMAN_*`), JSON Schema auto-generated for IDE IntelliSense. Secrets via `.env` + `dotenv` for local dev; Azure Key Vault / HashiCorp Vault adapter (opt-in) via internal `src/auth/` module. Ajv removed entirely — Zod replaces it; `zod-to-json-schema` generates `vocabulary-schema.json` at build time. Net -135 KB dependency.                                                                                                                                                                                                                                                                                                                                                                                   | dhikraft v2.5.0 has Zod+zod-to-json-schema installed with zero imports (dead weight), Ajv used in 1 file only. Single config source of truth eliminates scatter across env/code/playwright.config.                                                                                                                                                                                                                                                                                                                                           | 2025-02-14                                                                                                                                                                                                                                                                                          | 2025-02-14 |
| D8  | **Unified error hierarchy** — Single `PramanError` base class in `src/core/errors/` with subclasses: `ConfigError`, `BridgeError`, `ControlError`, `SelectorError`, `AuthError`, `ODataError`, `NavigationError`, `TimeoutError`, `AIError`, `PluginError`. Each carries: `code` (standardized const enum, e.g. `ERR_BRIDGE_TIMEOUT`, `ERR_CONTROL_NOT_FOUND`), `message`, `attempted` (what action was tried — BP-CLAUDE: gives agent full context), `retryable` (for AI agents), `severity`, `cause` (original error/ZodError), `details: Record<string, unknown>` (BP-GOOGLE: structured context — selector used, timeout value, etc.), `suggestions[]`. **ControlError** adds self-healing fields: `lastKnownSelector`, `availableControls[]`, `suggestedSelector` — enabling AI agents to propose fixes when UI changes (BP-CLAUDE: self-healing context). | dhikraft v2.5.0 has triple `DhikraftError` with incompatible constructors across 3 files. AI agents need `retryable` flag for autonomous recovery. Google API Design Guide mandates structured error details + machine-readable codes. Claude/Anthropic patterns require `attempted` action + self-healing context for autonomous agent recovery.                                                                                                                                                                                            | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D9  | **AI surface: Mode A + C only (no MCP server)** — Mode A: Strengthened SKILL.md + typed API + capability/recipe registries for code-gen agents. Mode C: Hardened `agentic` fixture with Zod-validated LLM output for in-test agent execution. No MCP server — praman remains a Playwright plugin. Intent API: core wrappers + procurement domain as reference; other domains added iteratively. **AI response envelope**: All agentic API responses use consistent shape `{ status: 'success'                                                                                                                                                                                                                                                                                                                                                                   | 'error', data: T, metadata: { duration, retryable, suggestions } }`(BP-CLAUDE: structured output for predictable agent consumption). **Capability registry**: Each entry includes`registryVersion`(agent cache invalidation) and`usage_example`(shows agent exactly how to call it — BP-CLAUDE: tool-use examples). **Agentic checkpoint**: Handler serializes progress`{ currentStep, completedSteps, remainingSteps, state }` so AI agents can resume from last checkpoint on failure (BP-CLAUDE: chain-of-thought incremental execution). | Mode A is proven (dhikraft v2.5.0 primary path). MCP server would conflict with Playwright test lifecycle and duplicate browser management. Anthropic/Claude patterns: consistent response shapes, usage examples per tool, and checkpoint-based resumability improve autonomous agent reliability. | 2025-02-14 |
| D10 | **Testing: Migrate + extend existing tests; GitHub Actions CI** — Rewrite existing 65+ unit tests for new architecture using Vitest. Keep integration tests against SAP public demo apps + SAP public cloud. Add behavioral equivalence tests (golden master pattern). Clean up compiled artifacts. CI via GitHub Actions (Docker-based Playwright, secrets for SAP auth). No local UI5 test app.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | v2.5.0 has solid test foundation. Cleanup + behavioral verification closes the remaining gap.                                                                                                                                                                                                                                                                                                                                                                                                                                                | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D11 | **No plugin/extension API in v3.0** — Users fork or contribute upstream. Custom auth strategy pattern retained. Revisit in v3.1+.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Keeps API surface small and stable for v3.0 launch.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D12 | **Documentation: Auto-generated SKILL.md + Docusaurus + TypeDoc, all on GitHub Pages** — SKILL.md auto-generated from TypeDoc API surface at build time; human-authored sections preserved via merge markers.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Eliminates SKILL.md drift from code. Single hosting platform. Free, CI-integrated.                                                                                                                                                                                                                                                                                                                                                                                                                                                           | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D13 | **Apache 2.0 license** — Single `LICENSE` file at repo root. Consistent with SAP (UI5, CAP) and Playwright ecosystems. Patent grant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Maximum enterprise adoption.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D14 | **Playwright version range with CI matrix** — `peerDependency: "@playwright/test": ">=1.50.0 <2.0.0"`. CI matrix: latest, latest-1, oldest supported. Internal `PlaywrightCompat` abstraction layer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Enterprise SAP teams lag on tooling upgrades. CI matrix catches breakage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D15 | **Security: All measures except CSP compliance** — Dependency scanning (npm audit + Snyk). Secret redaction (pino). Single SBOM (CycloneDX). npm provenance. Static analysis (eslint-plugin-security). CSP deferred to Phase 7.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Enterprise-grade from day one. SBOM required for SAP certification.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | 2025-02-14                                                                                                                                                                                                                                                                                          |
| D16 | **Single unified proxy** — Merge v2.5.0 double-proxy (constructor `createFluentProxy` + factory `new Proxy()`) into one handler. v2.5.0's Proxy#2 duplicates Proxy#1 with less intelligence (both intercept `then/catch/finally`, both handle unknown props). wdi5 has NO double-proxy — single `_attachControlBridge`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Eliminates redundant interception, simplifies debugging, reduces stack depth. Investigation confirmed Proxy#2 is strictly weaker.                                                                                                                                                                                                                                                                                                                                                                                                            | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D17 | **Bidirectional proxy conversion** — v2.5.0 has one-directional chain: UI5ControlProxy→UI5Object (via `callMethod()` returnType 'object') but no reverse (UI5Object→UI5ControlProxy). v3.0 adds `proxy-converter.ts` for ↔ navigation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | AI agents navigating model→view→control need bidirectional traversal. Recursive UI5Object chains already exist in v2.5.0 but dead-end at objects.                                                                                                                                                                                                                                                                                                                                                                                            | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D18 | **Integrate or remove ControlDiscoveryFactory** — v2.5.0 has `control-discovery-factory.ts` (164 LOC) defining 5 strategies with priorities [-1,0,1,2,3] but it is **dead code** — not used by `createControlFinderFunction()` which hardcodes priorities [0,1,2]. Priority numbers misaligned.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Dead code creates confusion. Either integrate into actual finder or remove. v3.0 integrates via `discovery-factory.ts` in bridge/.                                                                                                                                                                                                                                                                                                                                                                                                           | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D19 | **Centralized API resolver** — dhikraft v2.5.0 duplicates 3-tier lookup (`Element.getElementById()` → `ElementRegistry.get()` → `Core.byId()`) 6 times across files. v1.0 registers `window.__praman_getById()` once via injection, all code calls it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | DRY principle. Version-aware (1.108+ uses `ElementRegistry`). Single point to update when UI5 changes.                                                                                                                                                                                                                                                                                                                                                                                                                                       | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D20 | **Browser objectMap cleanup** — v2.5.0 stores UI5Objects in browser `window._objects` Map by UUID with no eviction. In long test runs, this leaks. v3.0 adds TTL + WeakRef in `browser-scripts/object-map.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Prevents memory leaks in enterprise test suites with 100+ test files. Browser-side cleanup pairs with Node-side `ui5-object-cache.ts` TTL.                                                                                                                                                                                                                                                                                                                                                                                                   | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D21 | **Shared interaction logic** — v2.5.0 PlaywrightStrategy and DOMFirstStrategy have identical `fireEvent` implementations (copy-pasted). v3.0 extracts shared logic into `interaction-strategies/shared.ts`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Eliminates maintenance duplication. Changes to fireEvent logic apply everywhere.                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D22 | **Auto-generated method signatures** — ✅ **COMPLETE (Phase 1)**. `scripts/generate-typed-proxies.ts` fetches SAP UI5 `api.json` (v1.136.0) from CDN, generates 199 typed interfaces with 4,092 methods into `src/core/types/controls.ts`. Replaces v2.5.0's 12-control hardcoded signatures. CLI: `npx tsx scripts/generate-typed-proxies.ts [--fresh] [--dry-run] [--version X.Y.Z]`. Pulled forward from Phase 6 during Phase 1.                                                                                                                                                                                                                                                                                                                                                                                                                             | Scales to all UI5 controls. 199 interfaces cover 90% of practically testable controls. Re-run generator to add more or update UI5 version.                                                                                                                                                                                                                                                                                                                                                                                                   | 2026-02-17                                                                                                                                                                                                                                                                                          |
| D23 | **skipStabilityWait as config + override** — dhikraft v2.5.0 has `skipStabilityWait` as per-selector option only. v1.0 adds global config default in `praman.config.ts` + per-selector override. Useful for WalkMe/third-party overlays.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Enterprise SAP pages often have third-party scripts that break `waitForUI5Stable()`. Global config avoids repeating per-selector.                                                                                                                                                                                                                                                                                                                                                                                                            | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D24 | **exec() keeps new Function()** — v2.5.0 serializes user functions via `fn.toString()` + reconstructs with `new Function()`. v3.0 keeps this pattern with ESLint disable + security documentation. No practical alternative for arbitrary function serialization across process boundaries.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `new Function()` is the only way to reconstruct closures from stringified functions in browser context. eslint-plugin-security flags it; ESLint disable + doc comment explains why.                                                                                                                                                                                                                                                                                                                                                          | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D25 | **Visibility preference as default** — v2.5.0 prefers visible UI5 controls, falls back to hidden. v3.0 keeps this as default behavior (configurable via `preferVisibleControls: true` in config). Critical for WalkMe/overlay compatibility.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | SAP FLP with WalkMe creates duplicate hidden controls. Preferring visible matches user intent. Config toggle for edge cases.                                                                                                                                                                                                                                                                                                                                                                                                                 | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D26 | **UI5Object AI introspection as first-class** — v2.5.0's UI5Object has `describe()`, `getAIContext()`, `suggestOperations()`, `getCommonPatterns()`. v3.0 promotes these to first-class capabilities, not hidden utility methods.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | AI-first design requires that agents can introspect any object in the UI5 tree, not just controls. Models, routers, bindings are essential for autonomous testing.                                                                                                                                                                                                                                                                                                                                                                           | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D27 | **Module size ≤300 LOC guideline** — Warning-level quality gate (not blocking). Files exceeding 300 LOC must include a justification comment. Known exceptions: proxy handlers, browser scripts with serialized functions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | v2.5.0 has `ui5-control-proxy.ts` at 1,829 LOC — unmaintainable. Guideline targets clean decomposition while allowing justified exceptions.                                                                                                                                                                                                                                                                                                                                                                                                  | 2025-02-15                                                                                                                                                                                                                                                                                          |
| D28 | **Auth via Playwright project dependencies** — Replace `globalSetup` with a `setup` project in `playwright.config.ts`. Auth runs as a regular test (`auth.setup.ts`), produces `storageState`, dependent projects consume it via `dependencies: ['setup']`. `trace: 'retain-on-failure'` enabled for debugging.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | **BP-PLAYWRIGHT (since v1.31+)**: Project dependencies provide better retry semantics, parallel-safe auth, trace capture for auth failures, and clearer reporting. `globalSetup` runs outside Playwright's test lifecycle — no retries, no traces, no reporters. Google/Microsoft both use this pattern in their Playwright projects.                                                                                                                                                                                                        | 2025-02-15                                                                                                                                                                                                                                                                                          |

---

## 5. Target Architecture

### 5.1 Architecture Overview (Post-Phase 3 — Actual Implementation)

> **Updated**: 2026-02-19 — Reflects actual implemented architecture after Phase 3 simplification.
> Bridge adapter layer (ClassicUI5/WebComponent/Hybrid) was **removed** in Phase 3.
> Evidence: 5 adapter files deleted from `src/bridge/`, confirmed by git status.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Test Author / AI Agent                       │
│  import { test, expect } from 'playwright-praman';                  │
│  import { procurementAPI } from 'playwright-praman/intents';  STUB  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  Layer 5: AI & Intent API           ⚠️  ALL STUBS (4 LOC each)      │
│  Sub-path exports configured but empty:                             │
│  playwright-praman/ai, /intents, /vocabulary, /fe, /reporters       │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 4: Fixtures + Auth + Navigation  ✅ IMPLEMENTED (Phase 3)    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐             │
│  │ Core     │ │ Auth     │ │ Nav      │ │ Stability │             │
│  │ Fixtures │ │ Fixtures │ │ Fixtures │ │ Fixtures  │             │
│  │ (232 LOC)│ │ (162 LOC)│ │ (136 LOC)│ │ (219 LOC) │             │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘             │
│       └──────────┬──┴──────────┬─┘             │                   │
│            mergeTests() assembly               │                   │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  UI5Handler (588 LOC) — 18 methods                       │      │
│  │  control(), controls(), click(), fill(), press(),        │      │
│  │  select(), getText(), getValue(), waitForUI5(),          │      │
│  │  waitFor(), clearCache(), destroy()                      │      │
│  └──────────────────────────┬───────────────────────────────┘      │
│  ┌──────────────────────────┼───────────────────────────────┐      │
│  │  Auth Handler (261 LOC)  │  Shell Handler (102 LOC)      │      │
│  │  6 strategies (BTP SAML, │  Footer Handler (119 LOC)     │      │
│  │  Basic, O365, API, Cert, │  WorkZone module (128 LOC)    │      │
│  │  MultiTenant, Custom)    │  Navigation module (201 LOC)  │      │
│  └──────────────────────────┼───────────────────────────────┘      │
├─────────────────────────────┼───────────────────────────────────────┤
│  Layer 3: Control Proxy + UI5Object  ✅ IMPLEMENTED (Phase 2+3)    │
│  ┌──────────────────────────┼───────────────────────────────┐      │
│  │  control-proxy.ts (653 LOC) — unified proxy handler      │      │
│  │  - Inline return handling (7 types)                       │      │
│  │  - Method forwarder caching                               │      │
│  │  - Sub-proxy creation for aggregations/objects            │      │
│  │  - Fluent chaining support                                │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │  ui5-object.ts (383 LOC) — non-control object proxy      │      │
│  │  UI5ObjectCache (187 LOC) — TTL + LRU eviction            │      │
│  │  discovery.ts (111 LOC) — 3-tier: cache→ID→RecordReplay  │      │
│  │  method-filter.ts (83 LOC) — blacklist enforcement        │      │
│  │  cache.ts (104 LOC) — control proxy cache (RegExp keys)   │      │
│  └──────────────────────────┬───────────────────────────────┘      │
├─────────────────────────────┼───────────────────────────────────────┤
│  Layer 2: Bridge + Browser Scripts  ✅ IMPLEMENTED (Phase 2+3)     │
│  ⚠️  NO adapter layer — proxy calls page.evaluate() DIRECTLY       │
│  ┌──────────────────────────┼───────────────────────────────┐      │
│  │  injection.ts (224 LOC) — lazy bridge injection           │      │
│  │  browser-scripts/ (8 files, 5 active + 3 dead):          │      │
│  │    inject-ui5.ts, find-control.ts, execute-method.ts,    │      │
│  │    get-methods.ts, wait-for-ui5.ts                       │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │  Interaction Strategies (3):                              │      │
│  │    UI5NativeStrategy — fire* → fireTap → DOM click       │      │
│  │    DomFirstStrategy — DOM click + auto-detect input       │      │
│  │    Opa5Strategy — RecordReplay.interactWithControl        │      │
│  └──────────────────────────┬───────────────────────────────┘      │
├─────────────────────────────┼───────────────────────────────────────┤
│  Layer 1.5: Selectors + Matchers  ✅ IMPLEMENTED (Phase 1)         │
│  ┌──────────────────────────┼───────────────────────────────┐      │
│  │  Selector Engine (3 files) — ui5= prefix + parser        │      │
│  │  Custom Matchers (3 files) — 8 matchers, expect.extend() │      │
│  └──────────────────────────┬───────────────────────────────┘      │
├─────────────────────────────┼───────────────────────────────────────┤
│  Layer 1: Core Infrastructure  ✅ IMPLEMENTED (Phase 1)            │
│  ┌─────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌───────┐ ┌────────┐ │
│  │ Config  │ │ Errors │ │ Logger │ │ OTel │ │ Types │ │Compat  │ │
│  │ (Zod)   │ │(10 sub)│ │(pino)  │ │(NoOp)│ │(199IF)│ │(PW ver)│ │
│  └─────────┘ └────────┘ └────────┘ └──────┘ └───────┘ └────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 0: Playwright Test Runner                                    │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  @playwright/test (page, browser, context, expect)        │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 5.1.1 Architecture Metrics (2026-02-19, verified from source)

| Metric            | Value                                                   | Evidence                                 |
| ----------------- | ------------------------------------------------------- | ---------------------------------------- |
| Source files      | 109                                                     | `find src/ -name "*.ts" \| wc -l`        |
| Test files        | 99 (86 unit, 1 E2E, 1 integration, 11 helpers/examples) | `find tests/ -name "*.ts" \| wc -l`      |
| Unit tests        | 1,394 passing                                           | `npm run test:unit`                      |
| Core files        | 42 (38.5%)                                              | `src/core/`                              |
| Bridge files      | 21 (19.3%)                                              | `src/bridge/`                            |
| Auth files        | 13 (11.9%)                                              | `src/auth/`                              |
| Proxy files       | 8 (7.3%)                                                | `src/proxy/`                             |
| Fixture files     | 8 (7.3%)                                                | `src/fixtures/`                          |
| Stub barrels      | 6 (ai, cli, fe, intents, reporters, vocabulary)         | 4 LOC each, empty                        |
| Dead/unwired code | ~950 LOC across 9 files                                 | See Section 5.4.5                        |
| Lint errors       | 0                                                       | `npm run lint`                           |
| Type errors       | 0                                                       | `npm run typecheck`                      |
| Build             | ESM + CJS + DTS, attw 6/6 exports valid                 | `npm run build && npm run check:exports` |

### 5.2 Core Principles (Original vs Actual)

> **Updated**: 2026-02-19 — Annotated with implementation status and lessons learned.

| #   | Principle                   | Original Statement                   | Actual Implementation                                                                                                                                                                    | Status                      |
| --- | --------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | **Separation of Concerns**  | Each module ≤300 LOC; SRP enforced   | 2 justified exceptions: `control-proxy.ts` (653 LOC), `ui5-handler.ts` (588 LOC). Both have documented justification. All other files comply.                                            | ✅ With exceptions          |
| 2   | **AI-First API Surface**    | Every public API for human + AI      | Types exported (199 auto-gen interfaces). AI introspection methods (describe, suggestOperations) NOT YET IMPLEMENTED on UI5Object — still on proxy only.                                 | 🔄 Partial                  |
| 3   | **Progressive Disclosure**  | Zero-config import works             | `import { test } from 'playwright-praman'` works. Sub-path exports (`/ai`, `/intents`, `/vocabulary`, `/fe`, `/reporters`) are **stubs** — configured but empty.                         | ✅ Core, stubs for advanced |
| 4   | **Version Resilience**      | BridgeAdapter decouples UI5 versions | **CHANGED**: Adapter removed in Phase 3. Browser scripts (`inject-ui5.ts`, `find-control.ts`) decouple UI5 versions. `PlaywrightCompat` (8 feature flags) decouples Playwright versions. | ✅ Redesigned               |
| 5   | **Enterprise Compliance**   | Strict TS, pino, SBOM, provenance    | Strict TS ✅, pino logging ✅, SBOM ⏳ (Phase 7), npm provenance ⏳ (Phase 7), Apache 2.0 ✅                                                                                             | 🔄 Partial                  |
| 6   | **Ground-Up Quality**       | No copy-paste from v2.5.0            | All code is new. dhikraft patterns (UI5Handler, proxy, interaction strategies) were **re-implemented** from scratch with functional style, not copy-pasted. E2E test validates parity.   | ✅                          |
| 7   | **Web-First Assertions**    | Custom matchers with auto-retry      | 8 matchers implemented: 5 UI5 + 3 table. Wired into `expect.extend()` in `core-fixtures.ts` `matcherRegistration` worker fixture. E2E test uses custom matchers.                         | ✅                          |
| 8   | **No Fixed Waits**          | `page.waitForTimeout()` banned       | `waitForUI5Stable()` implemented. E2E gold standard test reduced from 21 to 2 `waitForTimeout()` calls (the 2 remaining are polling loop retries).                                       | ✅                          |
| 9   | **Hermetic Unit Tests**     | No network, no SAP systems           | 1,394 unit tests, all hermetic. Bridge mocked via `vi.fn()`. Zero network calls. E2E tests separate project.                                                                             | ✅                          |
| 10  | **Immutable Configuration** | `Readonly<PramanConfig>`             | Config frozen via `Object.freeze()` in `core-fixtures.ts` line 131. Zod schema outputs readonly type.                                                                                    | ✅                          |

### 5.3 Data Flow (Actual Implementation — Post-Phase 3)

> **Updated**: 2026-02-19 — Shows actual call chain verified from source code.

#### 5.3.1 Original Planned Flow (Pre-Phase 3)

```
Test → Fixture → BridgeAdapter (ClassicUI5/WebComponent/Hybrid)
                    ↓
              page.evaluate() via adapter.executeControlMethod()
                    ↓
              dynamic-proxy.ts → return-handler.ts → proxy-converter.ts
```

5 layers, 7 files in proxy chain, adapter abstraction between proxy and page.

#### 5.3.2 Actual Implemented Flow (Post-Phase 3)

```
Test Code
  │
  ├─ ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } })
  │    │
  │    ├─ [Layer 4] UI5Handler.control(selector, options?)
  │    │    ├─ validateSelector(selector)
  │    │    ├─ internalWaitForUI5Stable()
  │    │    │    ├─ ensureBridgeInjected(page)  ← injection.ts (lazy, idempotent)
  │    │    │    └─ page.waitForFunction(stabilityScript)  ← wait-for-ui5.ts
  │    │    ├─ discoverSingleControl(selector)
  │    │    │    ├─ page.evaluate<ControlDiscoveryResult>(findControlScript)  ← find-control.ts
  │    │    │    └─ page.evaluate<string[]>(getMethodsScript)  ← get-methods.ts
  │    │    └─ createControlProxy({ id, controlType, methods, page, strategy })
  │    │         └─ [Layer 3] control-proxy.ts — single unified Proxy handler
  │    │
  │    ├─ .press()
  │    │    ├─ [Layer 3] getOrCreateForwarder('press')
  │    │    ├─ [Layer 2] InteractionStrategy.press(page, controlId)
  │    │    │    ├─ UI5NativeStrategy: firePress() → fireTap() → DOM click (3-step fallback)
  │    │    │    ├─ DomFirstStrategy: DOM Element.click() directly
  │    │    │    └─ Opa5Strategy: RecordReplay.interactWithControl()
  │    │    └─ Returns: same proxy (fluent chaining)
  │    │
  │    └─ .getModel()  →  returnType: 'object'
  │         ├─ [Layer 3] page.evaluate(executeMethodScript, { controlId, method: 'getModel' })
  │         │    └─ execute-method.ts — classifies return into 7 types
  │         ├─ [Layer 3] handleReturn(result) — INLINE in control-proxy.ts
  │         │    ├─ 'result'/'empty'/'none' → return primitive/undefined
  │         │    ├─ 'element'/'newElement' → return same/new control proxy
  │         │    ├─ 'aggregation' → return array of control proxies
  │         │    └─ 'object' → UI5Object.create({ uuid, type, page })
  │         └─ [Layer 3] UI5ObjectCache stores by UUID (TTL + LRU)
  │
  ├─ expect(proxy).toHaveUI5Text('Saved')
  │    └─ [Layer 1.5] Custom matcher: checkUI5Text() → polls via page.evaluate()
  │
  └─ await ui5.waitForUI5()
       └─ [Layer 4] UI5Handler.waitForUI5()
            ├─ ensureBridgeInjected(page)
            └─ page.waitForFunction(stabilityScript)  ← polls getUIDirty() === false
```

Key architectural differences from original plan:

1. **No adapter middleman** — `page.evaluate()` called directly by proxy and handler
2. **Full typed return** — `page.evaluate<ControlDiscoveryResult>()` eliminates `unknown`
3. **Inline return handling** — has full proxy state for sub-proxy creation
4. **Method forwarder caching** — avoids re-creating functions per property access (wdi5 insight)
5. **UI5Handler is the orchestrator** — manages lifecycle: ensureReady → waitForStable → find → getMethods → createProxy

### 5.4 Lessons Learnt — Architecture Simplification (Phase 3 Refactoring)

> **Date**: 2026-02-18
> **Scope**: Removed BridgeAdapter/BridgePage abstraction, consolidated proxy to 2 files
> **Evidence**: Commit history main branch, dhikraft-flow-analysis.md, plan3.md section 15

#### 5.4.1 Architecture Overview — Old vs New

**OLD (Plan.md v2.1.0, Section 5.1):**

```
Test → Fixture → BridgeAdapter (ClassicUI5/WebComponent/Hybrid)
                    ↓
              page.evaluate() via adapter
                    ↓
              dynamic-proxy.ts → return-handler.ts → proxy-converter.ts
```

5 layers, 7 files in proxy chain, adapter abstraction between proxy and page.

**NEW (Post-Simplification):**

```
Test → Fixture → UI5Handler → page.evaluate() directly
                    ↓
              control-proxy.ts (inline return handling + sub-proxy creation)
```

3 layers, 2 files in proxy chain, direct Page usage.

| Aspect              | Old Architecture                                                                           | New Architecture                                      | Rationale                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Page type           | BridgePage (Object.assign wrapper)                                                         | Playwright Page directly                              | BridgePage added no value, just type confusion                                           |
| Adapter layer       | ClassicUI5Adapter (353 LOC) + interface                                                    | REMOVED                                               | Adapter was pure passthrough, caused data loss bug                                       |
| Proxy files         | 5 files (dynamic-proxy, return-handler, proxy-converter, playwright-api, ui5-object-proxy) | 2 files (control-proxy, ui5-object)                   | Consolidation eliminates inter-file data loss                                            |
| Return handling     | Separate return-handler.ts without adapter context                                         | Inline in control-proxy.ts with full state            | CRITICAL: old handler returned raw refs, breaking sub-proxy chains                       |
| Interaction routing | playwright-api.ts (100-method allowlist)                                                   | Explicit press/enterText/select on proxy via strategy | No allowlist maintenance, explicit is better                                             |
| Method execution    | adapter.executeControlMethod() → result.value (STRIPPED)                                   | page.evaluate() → full MethodExecutionResult          | Fixed critical data-loss bug                                                             |
| Handler layer       | No handler (fixture exposed bare proxy)                                                    | UI5Handler class (590 LOC)                            | Matches dhikraft's proven pattern                                                        |
| Discovery           | proxy/discovery.ts (standalone function)                                                   | UI5Handler.discoverSingleControl() (inline)           | Handler manages lifecycle: ensureReady → waitForStable → find → getMethods → createProxy |

#### 5.4.2 Core Principles — Old vs New

| #   | Principle              | Old Interpretation                             | New Interpretation                                                            | Change                                           |
| --- | ---------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------ |
| 4   | Version Resilience     | BridgeAdapter interface decouples UI5 versions | Browser scripts decouple UI5 versions; adapter was wrong abstraction boundary | Adapter removed, scripts remain                  |
| 1   | Separation of Concerns | Adapter = separate concern                     | Adapter was accidental complexity, not essential complexity                   | Fewer files, same concerns                       |
| 6   | Ground-Up Quality      | Each layer independently tested                | Inline return handling tested as unit within proxy                            | Integration > isolation for tightly coupled code |

#### 5.4.3 Data Flow — Old vs New

**OLD Flow (ui5.control → proxy.getText()):**

```
UI5Handler.control(selector)
  → discoverControl(selector, adapter, cache, strategies)
    → adapter.findControl(selector)  ← adapter wraps page.evaluate
      → page.evaluate(findControlScript)
    → createControlProxy({ id, controlType, methods, adapter })
      → proxy.getText() → createMethodForwarder()
        → adapter.executeControlMethod(id, 'getText', [])
          → page.evaluate(executeMethodScript)
          → RETURNS result.value  ← DATA LOSS: returnType/uuids/objectTypes STRIPPED
        → handleBridgeReturn(result)  ← receives stripped data, cannot create sub-proxies
```

**NEW Flow (ui5.control → proxy.getText()):**

```
UI5Handler.control(selector)
  → validateSelector()
  → internalWaitForUI5Stable()
    → ensureBridgeInjected(page)
    → page.waitForFunction(stabilityScript)
  → discoverSingleControl(selector)
    → ensureReady()
    → internalFindControl(selector)
      → page.evaluate<ControlDiscoveryResult>(findControlScript)  ← TYPED return
    → internalGetAvailableMethods(controlId)
      → page.evaluate<string[]>(getMethodsScript)
    → createControlProxy({ id, controlType, methods, page, interactionStrategy })
      → proxy.getText() → getOrCreateForwarder('getText')
        → page.evaluate(executeMethodScript)  ← DIRECT page call
        → handleReturn(result, state)  ← FULL MethodExecutionResult, creates sub-proxies
```

Key differences:

1. No adapter middleman — page.evaluate() is called directly
2. Full typed return — `page.evaluate<ControlDiscoveryResult>()` eliminates `unknown`
3. Inline return handling — has full state for sub-proxy creation
4. Method forwarder caching — avoids re-creating functions per access (wdi5 insight)

#### 5.4.4 Key Lessons

1. **Premature abstraction caused data loss**: The BridgeAdapter was designed for future WebComponent/Hybrid adapters, but it introduced a critical bug where `executeControlMethod()` returned `result.value` instead of the full `MethodExecutionResult`, stripping returnType, uuids, and objectTypes needed for sub-proxy creation.

2. **dhikraft's pattern is proven**: dhikraft's single `UI5ControlProxy` class with `page.evaluate()` directly works because the proxy NEEDS full result context. Praman adopted this pattern with functional style (createControlProxy + closure state instead of class + this).

3. **Adapter boundary was wrong**: The real abstraction boundary in UI5 testing is between browser scripts (which deal with UI5 API differences) and node-side proxy (which deals with Playwright API). The adapter sat between them, adding hops without adding value.

4. **Inline return handling is correct**: Separating return handling into a different file required passing context (page, strategy, methods) through function parameters. Inlining it in control-proxy.ts gives natural access to the proxy's state for creating sub-proxies.

5. **Fewer files, better cohesion**: Going from 5 proxy files to 2 improved cohesion. The return handler, proxy converter, and method forwarder are all tightly coupled to the proxy's state — they belong together.

6. **page.evaluate() serialization is the #1 footgun**: Browser scripts must contain ALL helper functions as inner declarations. Module-level functions, imports, and closures are NOT available in the serialized function body. Unit tests give FALSE POSITIVES for this bug because they run in Node.js where module-level functions ARE accessible. Only E2E tests catch `ReferenceError: fail is not defined` errors.

7. **Fixture assembly pattern works**: `mergeTests(coreTest, authTest, navTest, stabilityTest)` cleanly composes independent fixture files. Worker-scoped fixtures (config, logger, tracer, compat) run once per worker; test-scoped fixtures (ui5, pramanLogger) run per test.

#### 5.4.5 Dead Code & Unwired Infrastructure Inventory

> **Updated**: 2026-02-19 — Verified by grep for imports across all `src/` files.

| File                                                             | LOC      | Status                                                                           | Evidence                                                                    | Recommendation                                          |
| ---------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| `src/core/utils/step-decorator.ts`                               | 79       | **DEAD** — not imported anywhere in `src/`                                       | `grep -r "step-decorator" src/` returns 0 results                           | DELETE or wire into UI5Handler methods                  |
| `src/core/constants/control-types.ts`                            | 163      | **UNWIRED** — no barrel, no imports from `src/`                                  | No `core/constants/index.ts` barrel; not in `core/index.ts`                 | Wire into discovery or DELETE                           |
| `src/core/constants/object-categories.ts`                        | 114      | **UNWIRED** — no barrel, no imports from `src/`                                  | Same: no barrel, no imports                                                 | Wire into UI5Object or DELETE                           |
| `src/core/examples/documentation-example.ts`                     | 254      | **DOCUMENTATION ONLY** — never imported                                          | Example file for developers                                                 | Keep as-is (documentation)                              |
| `src/bridge/browser-scripts/get-version.ts`                      | 47       | **DEAD** — functionality inlined in `inject-ui5.ts`                              | `inject-ui5.ts` has version detection inline; `get-version.ts` not imported | DELETE                                                  |
| `src/bridge/browser-scripts/get-selector.ts`                     | 102      | **DEAD** — not imported by any `src/` file                                       | Tested but not wired into any flow                                          | DELETE or wire into future selector-for-element feature |
| `src/bridge/browser-scripts/object-map.ts`                       | 104      | **DEAD** — cleanup script exists but NEVER CALLED                                | `objectMapCleanup()` exported but not invoked; **memory leak risk**         | Wire cleanup into fixture teardown or DELETE            |
| `src/bridge/api-resolver.ts`                                     | 113      | **DEAD** — not imported in `src/`                                                | Functionality inlined in `inject-ui5.ts`; `api-resolver.ts` is standalone   | DELETE (already inlined)                                |
| `src/core/telemetry/spans.ts`                                    | 87       | **PARTIALLY DEAD** — `createSpanName()` and `spanAttributes` exported but unused | Only `initTelemetry()` consumed from telemetry module                       | Wire spans into handler/proxy or mark as Phase 5        |
| **6 stub barrels** (ai, cli, fe, intents, reporters, vocabulary) | 24 total | **STUBS** — placeholder `export {}` files                                        | Configured in `tsup.config.ts` and package.json exports                     | Keep as scaffolding for future phases                   |

**Total dead/unwired code**: ~950 LOC across 9 files (excluding stubs and documentation example).

**Memory leak risk**: `object-map.ts` defines `objectMapCleanup()` for browser-side `window._objects` Map eviction, but this function is NEVER called. Long-running test suites accumulate UI5 object references in browser memory without cleanup.

#### 5.4.6 Deleted Files (Phase 3 Simplification)

| Deleted File                         | LOC    | Replacement                                      |
| ------------------------------------ | ------ | ------------------------------------------------ |
| `src/bridge/adapter-factory.ts`      | ~80    | N/A — adapters removed                           |
| `src/bridge/adapter.ts`              | ~50    | N/A — interface removed                          |
| `src/bridge/classic-adapter.ts`      | ~353   | `page.evaluate()` called directly from proxy     |
| `src/bridge/hybrid-adapter.ts`       | ~120   | N/A                                              |
| `src/bridge/webcomponent-adapter.ts` | ~80    | N/A                                              |
| `src/proxy/dynamic-proxy.ts`         | ~400   | Replaced by `control-proxy.ts` (653 LOC)         |
| `src/proxy/playwright-api.ts`        | ~150   | Removed — interaction strategies handle directly |
| `src/proxy/proxy-converter.ts`       | ~200   | Inlined in `control-proxy.ts` handleReturn()     |
| `src/proxy/return-handler.ts`        | ~250   | Inlined in `control-proxy.ts` handleReturn()     |
| `src/proxy/ui5-object-proxy.ts`      | ~300   | Replaced by `ui5-object.ts` (383 LOC)            |
| **16 test files + 3 test helpers**   | ~2,000 | Replaced by new test files for new modules       |

**Net result**: ~4,000 LOC removed, ~2,500 LOC added → ~1,500 LOC net reduction.

---

## 6. Module Decomposition

### 6.1 Directory Structure (Actual — 2026-02-19)

> **Updated**: Verified against actual filesystem. Files marked ⚠️ are dead/unwired.
> Files marked 📌 are stubs (4 LOC, `export {}`). Files marked ❌ were in original plan but never created.

```
playwright-praman/
├── package.json                    # Single package: "playwright-praman"
├── tsconfig.json                   # Strict mode, moduleResolution: "node16" (BP-TS)
├── tsup.config.ts                  # Multi-entry build (., /ai, /intents, /vocabulary, /fe, /reporters)
├── eslint.config.mjs               # Flat config + 10 plugins
├── vitest.config.ts                # Unit test config
├── playwright.config.ts            # E2E + integration test config
├── tsdoc.json                      # TSDoc config (extends API Extractor)
├── .env.example                    # Template for SAP credentials
├── LICENSE                         # Apache 2.0
├── README.md
│
├── src/
│   ├── index.ts                    # Main barrel: test, expect, config, errors, logging, bridge, proxy, auth, nav
│   ├── version.ts                  # PACKAGE_NAME + VERSION constants
│   │
│   ├── core/                       # Layer 1 — Core Infrastructure (42 files)
│   │   ├── index.ts                # Core barrel
│   │   ├── config/
│   │   │   ├── schema.ts           # PramanConfigSchema (Zod) → Readonly<PramanConfig>
│   │   │   ├── loader.ts           # loadConfig() — parse, validate, env override, Object.freeze()
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── base.ts             # PramanError base class
│   │   │   ├── codes.ts            # ErrorCode const enum (ERR_BRIDGE_TIMEOUT, etc.)
│   │   │   ├── bridge-error.ts     # ✅ Used by bridge layer
│   │   │   ├── control-error.ts    # ✅ Used by proxy layer — has self-healing fields
│   │   │   ├── config-error.ts     # ✅ Used by config loader
│   │   │   ├── auth-error.ts       # ✅ Used by auth handler
│   │   │   ├── navigation-error.ts # ✅ Used by navigation module
│   │   │   ├── odata-error.ts      # ✅ Available for Phase 4
│   │   │   ├── selector-error.ts   # ✅ Used by selector parser
│   │   │   ├── timeout-error.ts    # ✅ Used by wait helpers
│   │   │   ├── ai-error.ts         # Available for Phase 5
│   │   │   └── index.ts
│   │   ├── logging/
│   │   │   ├── logger.ts           # ✅ pino factory, child loggers — used by fixtures
│   │   │   ├── redaction.ts        # ✅ 14 secret redaction paths
│   │   │   └── index.ts
│   │   ├── telemetry/
│   │   │   ├── otel.ts             # ✅ initTelemetry() — NoOp when disabled
│   │   │   ├── spans.ts            # ⚠️ PARTIALLY DEAD — createSpanName() unused
│   │   │   └── index.ts
│   │   ├── compat/
│   │   │   ├── playwright-compat.ts # ✅ 8 feature flags — used by core-fixtures
│   │   │   ├── path-helpers.ts     # fileURLToPath helper for ESM __dirname
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── control-types.ts    # ⚠️ UNWIRED — 163 LOC, no barrel, no imports
│   │   │   └── object-categories.ts # ⚠️ UNWIRED — 114 LOC, no barrel, no imports
│   │   ├── types/
│   │   │   ├── config.ts           # PramanConfig type definition
│   │   │   ├── selectors.ts        # UI5Selector canonical type
│   │   │   ├── controls.ts         # 199 auto-generated control interfaces (5,802 LOC)
│   │   │   ├── bridge.ts           # Bridge communication types
│   │   │   ├── ui5-types.d.ts      # SAP UI5 global type augmentation
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── wait-helpers.ts     # ✅ waitForUI5Bootstrap, waitForUI5Stable — used by ui5-handler
│   │   │   ├── retry.ts            # ✅ Exponential backoff + jitter — used by auth-handler
│   │   │   ├── step-decorator.ts   # ⚠️ DEAD CODE — 79 LOC, not imported anywhere in src/
│   │   │   ├── version-compare.ts  # ✅ Semver comparison
│   │   │   ├── constants.ts        # ✅ DEFAULT_TIMEOUTS
│   │   │   └── index.ts
│   │   └── examples/
│   │       └── documentation-example.ts  # Documentation only (254 LOC)
│   │
│   ├── bridge/                     # Layer 2 — Bridge + Browser Scripts (21 files)
│   │   ├── index.ts                # Bridge barrel
│   │   ├── injection.ts            # ✅ Lazy bridge injection (224 LOC) — ensureBridgeInjected()
│   │   ├── api-resolver.ts         # ⚠️ DEAD — 113 LOC, functionality inlined in inject-ui5.ts
│   │   ├── method-blacklist.ts     # ✅ 88-item method blacklist
│   │   ├── bridge-types.ts         # Bridge type definitions
│   │   ├── bridge-constants.ts     # BRIDGE_GLOBALS, BRIDGE_TIMEOUTS, XHR_IGNORE_PATTERNS
│   │   ├── interaction-strategies/
│   │   │   ├── strategy.ts         # ✅ InteractionStrategy interface
│   │   │   ├── strategy-factory.ts # ✅ createInteractionStrategy()
│   │   │   ├── ui5-native-strategy.ts # ✅ Default — fire* → fireTap → DOM (3-step fallback)
│   │   │   ├── dom-first-strategy.ts  # ✅ DOM click + auto-detect input
│   │   │   └── opa5-strategy.ts       # ✅ RecordReplay.interactWithControl
│   │   ├── browser-scripts/
│   │   │   ├── inject-ui5.ts       # ✅ Bridge setup — window._ui5Bridge (166 LOC)
│   │   │   ├── find-control.ts     # ✅ Control discovery script (89 LOC)
│   │   │   ├── execute-method.ts   # ✅ Method execution + 7-type return (169 LOC)
│   │   │   ├── get-methods.ts      # ✅ Method introspection (46 LOC)
│   │   │   ├── wait-for-ui5.ts     # ✅ UI5 stability polling (81 LOC)
│   │   │   ├── get-version.ts      # ⚠️ DEAD — 47 LOC, inlined in inject-ui5.ts
│   │   │   ├── get-selector.ts     # ⚠️ DEAD — 102 LOC, not imported
│   │   │   └── object-map.ts       # ⚠️ DEAD — 104 LOC, cleanup never called (MEMORY LEAK RISK)
│   │   │
│   │   │   ❌ NOT CREATED (from original plan):
│   │   │   # interact.ts — interaction inlined in strategies
│   │   │   # shared.ts — shared logic inlined in strategy.ts
│   │   │
│   │   ❌ DELETED (Phase 3 simplification):
│   │   # adapter.ts, classic-adapter.ts, hybrid-adapter.ts
│   │   # webcomponent-adapter.ts, adapter-factory.ts
│   │
│   ├── proxy/                      # Layer 3 — Control Proxy + Object Proxy (8 files)
│   │   ├── index.ts                # Proxy barrel
│   │   ├── control-proxy.ts        # ✅ Unified proxy handler (653 LOC) — justified exception to 300 LOC
│   │   ├── ui5-object.ts           # ✅ Non-control object proxy (383 LOC) — justified exception
│   │   ├── ui5-object-cache.ts     # ✅ TTL + LRU cache (187 LOC) — exported but NOT used internally
│   │   ├── discovery.ts            # ✅ 3-tier control discovery (111 LOC)
│   │   ├── discovery-factory.ts    # ✅ Strategy chain configuration (74 LOC)
│   │   ├── method-filter.ts        # ✅ Blacklist enforcement (83 LOC)
│   │   ├── cache.ts                # ✅ Control proxy cache with RegExp keys (104 LOC)
│   │   │
│   │   ❌ DELETED (Phase 3 simplification):
│   │   # dynamic-proxy.ts, return-handler.ts, proxy-converter.ts
│   │   # playwright-api.ts, ui5-object-proxy.ts
│   │   ❌ NOT CREATED (from original plan):
│   │   # typed/ directory (replaced by auto-gen interfaces in core/types/controls.ts)
│   │   # browser-object-map.ts (dead object-map.ts remains in bridge/)
│   │
│   ├── selectors/                  # Layer 1.5 — Selector Engine (3 files)
│   │   ├── ui5-selector-engine.ts  # ✅ Custom Playwright selector: ui5=...
│   │   ├── selector-parser.ts      # ✅ Parse selector strings → UI5Selector
│   │   └── index.ts
│   │
│   ├── matchers/                   # Layer 1.5 — Custom expect matchers (3 files)
│   │   ├── ui5-matchers.ts         # ✅ 5 matchers: Text, Visible, Enabled, Property, ValueState
│   │   ├── table-matchers.ts       # ✅ 3 matchers: RowCount, CellText, SelectedRows
│   │   └── index.ts
│   │
│   ├── fixtures/                   # Layer 4 — Fixtures (8 files) ✅ IMPLEMENTED
│   │   ├── index.ts                # ✅ mergeTests(coreTest, authTest, navTest, stabilityTest) assembly
│   │   ├── core-fixtures.ts        # ✅ Worker: config, logger, tracer, compat, selectors, matchers
│   │   │                           #    Test: pramanLogger, ui5 (UI5Handler)
│   │   ├── auth-fixtures.ts        # ✅ sapAuth fixture with configurable strategy
│   │   ├── nav-fixtures.ts         # ✅ ui5Navigation fixture (tile, hash, intent nav)
│   │   ├── stability-fixtures.ts   # ✅ Auto UI5 stability + WalkMe/analytics interception
│   │   ├── ui5-handler.ts          # ✅ UI5Handler class — 18 methods (588 LOC)
│   │   ├── shell-handler.ts        # ✅ FLP shell bar operations (102 LOC)
│   │   └── footer-handler.ts       # ✅ Footer bar operations (119 LOC)
│   │   │
│   │   ❌ NOT CREATED (from original plan — deferred to future phases):
│   │   # table-fixtures.ts, odata-fixtures.ts, assertion-fixtures.ts
│   │   # interaction-fixtures.ts, shell-fixtures.ts, workzone-fixtures.ts
│   │   # ai-fixtures.ts, intent-fixtures.ts, vocabulary-fixtures.ts, fe-fixtures.ts
│   │
│   ├── auth/                       # Authentication (13 files) ✅ IMPLEMENTED
│   │   ├── index.ts
│   │   ├── auth-handler.ts         # ✅ SAPAuthHandler (261 LOC) — strategy orchestration
│   │   ├── auth-setup.ts           # ✅ Setup project test file (storageState)
│   │   ├── auth-teardown.ts        # ✅ Session cleanup
│   │   ├── auth-checks.ts          # ✅ FLP/Fiori login detection (180 LOC)
│   │   ├── auth-types.ts           # Auth type definitions
│   │   ├── auth-errors.ts          # Auth-specific errors
│   │   ├── strategies/
│   │   │   ├── index.ts            # Strategy barrel + factory
│   │   │   ├── btp-saml.ts         # ✅ BTP SAML strategy
│   │   │   ├── basic-auth.ts       # ✅ Basic authentication
│   │   │   ├── office365.ts        # ✅ Office 365 / Entra ID
│   │   │   ├── api-auth.ts         # ✅ API key authentication
│   │   │   └── certificate-auth.ts # ✅ Client certificate authentication
│   │   └── multi-tenant.ts         # ✅ Multi-tenant support
│   │
│   ├── modules/                    # UI5 Domain Operations (3 files, mostly planned)
│   │   ├── index.ts                # Module barrel
│   │   ├── navigation.ts           # ✅ Tile, intent, hash navigation (201 LOC)
│   │   └── workzone.ts             # ✅ Dual-frame bridge injection (128 LOC)
│   │   │
│   │   ❌ NOT CREATED (from original plan — Phase 4):
│   │   # table.ts, assertion.ts, element.ts, control.ts
│   │   # date.ts, dialog.ts, odata.ts
│   │
│   ├── ai/index.ts                 # 📌 STUB — 4 LOC
│   ├── cli/index.ts                # 📌 STUB — 4 LOC (NOT in tsup/exports)
│   ├── fe/index.ts                 # 📌 STUB — 4 LOC
│   ├── intents/index.ts            # 📌 STUB — 4 LOC
│   ├── reporters/index.ts          # 📌 STUB — 4 LOC
│   └── vocabulary/index.ts         # 📌 STUB — 4 LOC
│
├── tests/                          # 99 test files
│   ├── unit/                       # 86 unit test files — Vitest, no browser
│   │   ├── core/                   # Config, errors, logging, telemetry, compat, types, utils
│   │   ├── bridge/                 # Injection, strategies, browser scripts
│   │   ├── proxy/                  # Control proxy, UI5Object, cache, discovery
│   │   ├── selectors/              # Selector engine, parser
│   │   ├── auth/                   # Auth handler, checks, strategies
│   │   ├── matchers/               # UI5 + table matchers
│   │   ├── modules/                # Navigation, workzone
│   │   └── fixtures/               # Core, auth, nav, stability, handlers
│   ├── integration/                # 1 integration test file
│   │   └── bridge-smoke.spec.ts    # Partially written (165 LOC, deferred to Phase 7)
│   ├── e2e/                        # 1 E2E test file
│   │   └── sap-cloud/
│   │       └── bom-e2e-gold-standard.spec.ts  # ✅ 6 steps passing (BOM CRUD)
│   ├── example/                    # Example tests for documentation
│   │   └── example-bom-e2e-gold-standard.spec.ts
│   └── helpers/                    # 6 test helpers
│       ├── mock-auth-page.ts       # Auth page mock factory
│       ├── mock-ui5-handler.ts     # UI5Handler mock
│       ├── mock-strategy.ts        # Interaction strategy mock
│       ├── mock-logger.ts          # Logger mock
│       └── ...
│
├── scripts/
│   ├── generate-typed-proxies.ts   # ✅ Implemented (1,266 LOC) — 199 interfaces from api.json
│   ├── generate-capabilities.ts    # ✅ Implemented (430 LOC) — TSDoc @capability extraction
│   ├── setup-ide.ts                # ✅ Implemented (150 LOC) — interactive IDE config wizard
│   ├── generate-skill-md.ts        # 📌 STUB — 4 LOC
│   └── generate-json-schema.ts     # 📌 STUB — 4 LOC
│
├── skills/                         # AI Agent skill files (12 files)
│   └── playwright-praman-sap-testing/
│       ├── skills-architect.md, skills-implementer.md, skills-tdd.md
│       ├── skills-tester.md, skills-playwright-expert.md
│       ├── skills-sap-ui5-expert.md, skills-sap-fiori-consultant.md
│       ├── skills-sap-odata-expert.md, skills-sap-ui5-webcomponents-expert.md
│       ├── skills-reviewer.md, skills-security-build.md
│       └── skills-team-overview.md
│
├── plans/                          # Architecture + phase plans
│   ├── plan.md                     # Master architecture document (this file)
│   ├── plan3.md                    # Phase 3 detailed plan (21 batches)
│   ├── phase1-tracker.md           # Phase 1 tracker (COMPLETE)
│   ├── phase3-tracker.md           # Phase 3 tracker (COMPLETE)
│   └── diagrams/                   # Architecture diagrams
│
├── docs/                           # ❌ Docusaurus NOT YET CREATED (Phase 6)
│   └── documentation-standards.md  # TSDoc standards reference
│
└── .github/
    ├── copilot-instructions.md     # ✅ GitHub Copilot instructions
    └── agents/                     # ✅ Copilot Coding Agent config
```

### 6.2 Sub-Path Exports (package.json)

```jsonc
{
  "name": "playwright-praman",
  "version": "1.0.0",
  "license": "Apache-2.0",
  "type": "module",
  "engines": {
    "node": ">=20", // BP-NODE: Prevents confusing errors on old Node versions
  },
  "files": ["dist"], // BP-NODE: Only publish built output — not tests, docs, scripts
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "exports": {
    ".": {
      "types": { "import": "./dist/index.d.ts", "require": "./dist/index.d.cts" },
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
    },
    "./ai": {
      "types": { "import": "./dist/ai/index.d.ts", "require": "./dist/ai/index.d.cts" },
      "import": "./dist/ai/index.js",
      "require": "./dist/ai/index.cjs",
    },
    "./intents": {
      "types": { "import": "./dist/intents/index.d.ts", "require": "./dist/intents/index.d.cts" },
      "import": "./dist/intents/index.js",
      "require": "./dist/intents/index.cjs",
    },
    "./vocabulary": {
      "types": {
        "import": "./dist/vocabulary/index.d.ts",
        "require": "./dist/vocabulary/index.d.cts",
      },
      "import": "./dist/vocabulary/index.js",
      "require": "./dist/vocabulary/index.cjs",
    },
    "./fe": {
      "types": { "import": "./dist/fe/index.d.ts", "require": "./dist/fe/index.d.cts" },
      "import": "./dist/fe/index.js",
      "require": "./dist/fe/index.cjs",
    },
    "./reporters": {
      "types": {
        "import": "./dist/reporters/index.d.ts",
        "require": "./dist/reporters/index.d.cts",
      },
      "import": "./dist/reporters/index.js",
      "require": "./dist/reporters/index.cjs",
    },
  },
  "peerDependencies": {
    "@playwright/test": ">=1.50.0 <2.0.0",
  },
  "dependencies": {
    "dotenv": "17.3.1",
    "pino": "10.3.1",
    "zod": "4.3.6",
    "zod-to-json-schema": "3.25.1",
  },
  "devDependencies": {
    "pino-pretty": "13.1.3", // BP-NODE: pino-pretty is dev-only (human-readable logs);
    // in CI/prod, pino outputs raw JSON piped externally
  },
  "optionalDependencies": {
    "openai": "6.22.0",
    "@opentelemetry/api": "1.9.0",
    "@opentelemetry/sdk-node": "0.212.0",
  },
}
```

### 6.3 User Experience

```typescript
// Most users — zero-config, full fixtures
import { test, expect } from 'playwright-praman';

test('create purchase order', async ({ page, ui5, navigation }) => {
  await navigation.openTileByTitle('Create Purchase Order');
  const vendorInput = await ui5.input({ id: 'vendorInput' });
  await vendorInput.setValue('V001');
  const saveBtn = await ui5.button({ text: 'Save' });
  await saveBtn.press();
});

// AI features
import { aiService } from 'playwright-praman/ai';

// Business-level intent API
import { procurementAPI } from 'playwright-praman/intents';

// Fiori Elements test library
import { listReport, objectPage } from 'playwright-praman/fe';
```

---

## 7. Technology Stack (Final)

| Category            | Tool/Library                                                                           | Purpose                                          |
| ------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Runtime**         | Node.js ≥ 20                                                                           | Execution environment                            |
| **Test Framework**  | Playwright Test ≥ 1.50.0 <2.0.0                                                        | Test runner + assertions + browser automation    |
| **Language**        | TypeScript 5.x (strict mode, `noUncheckedIndexedAccess`, `moduleResolution: "node16"`) | Type safety + correct ESM resolution             |
| **Build**           | tsup (esbuild-powered)                                                                 | Multi-entry dual ESM + CJS build                 |
| **Linting**         | ESLint 9 (flat config) + 10 lint plugins                                               | Code quality + security + SDL + SonarJS + TSDoc  |
| **Formatting**      | Prettier                                                                               | Consistent formatting                            |
| **Validation**      | Zod 4.x                                                                                | Runtime validation at boundaries                 |
| **Schema Gen**      | zod-to-json-schema                                                                     | Config JSON Schema for IDE IntelliSense          |
| **Logging**         | pino 10.x + pino-pretty                                                                | Structured JSON logging                          |
| **Tracing**         | @opentelemetry/api + sdk-node (optional)                                               | Distributed tracing + metrics                    |
| **Unit Testing**    | Vitest                                                                                 | Fast, TS-native, Playwright-assertion compatible |
| **User Docs**       | Docusaurus 3.x                                                                         | Documentation site                               |
| **API Docs**        | TypeDoc                                                                                | Auto-generated API reference                     |
| **CI/CD**           | GitHub Actions                                                                         | Build, test, lint, deploy, publish               |
| **Package Manager** | npm                                                                                    | Standard, lowest contributor friction            |
| **SBOM**            | @cyclonedx/cyclonedx-npm                                                               | Software Bill of Materials                       |
| **Dep Scanning**    | npm audit + Snyk                                                                       | Vulnerability detection                          |
| **Versioning**      | Conventional Commits + release-please                                                  | Automated changelogs, semver, GitHub release PRs |

### 7.1 What Was Removed from v2.5.0

| Removed                                | Reason                                                      |
| -------------------------------------- | ----------------------------------------------------------- |
| `ajv` + `ajv-formats`                  | Replaced by Zod (D7)                                        |
| `zod` (unused dead dep)                | Replaced by Zod 4 (actually used) (D6, D7)                  |
| `zod-to-json-schema` (unused dead dep) | Replaced by zod-to-json-schema 3.25+ (actually used) (D7)   |
| pnpm                                   | npm is simpler for single package (D1)                      |
| Turborepo                              | Single package — no build orchestrator needed (D1)          |
| Changesets                             | Single package — release-please + conventional commits (D1) |

---

## 8. Configuration & Workspace Strategy

### 8.1 Configuration Model

```typescript
// praman.config.ts — user creates alongside playwright.config.ts
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  // Core
  logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug' | 'verbose'
  ui5WaitTimeout: 30_000, // ms — wait for UI5 readiness
  controlDiscoveryTimeout: 10_000, // ms — wait for control to appear
  interactionStrategy: 'hybrid', // 'playwright' | 'dom-first' | 'opa5' | 'hybrid'
  skipStabilityWait: false, // D23: skip waitForUI5Stable() globally (override per-selector)
  preferVisibleControls: true, // D25: prefer visible controls, fall back to hidden (WalkMe compat)

  // Auth (secrets via .env or vault)
  auth: {
    strategy: 'btp-saml', // 'btp-saml' | 'basic' | 'office365' | 'custom'
    baseUrl: process.env.SAP_CLOUD_BASE_URL!,
  },

  // AI (optional — only if using playwright-praman/ai)
  ai: {
    provider: 'azure-openai', // 'azure-openai' | 'openai'
    temperature: 0.3,
  },

  // Telemetry (opt-in)
  telemetry: {
    openTelemetry: false,
    exporter: 'otlp', // 'otlp' | 'azure-monitor' | 'jaeger'
  },
});
```

```typescript
// playwright.config.ts — project dependencies pattern for auth
// BP-PLAYWRIGHT: Use project dependencies (not globalSetup) for authentication.
// Playwright recommends this since v1.31+ — better parallelization, reporting,
// and retry semantics. The 'setup' project runs first, produces storageState,
// dependent projects consume it.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'sap-tests',
      dependencies: ['setup'], // BP-PLAYWRIGHT: runs after setup completes
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
        trace: 'retain-on-failure', // BP-PLAYWRIGHT: captures trace for failed tests
      },
    },
  ],
  workers: 1,
  fullyParallel: false,
});
```

### 8.2 Environment Variables

All env vars prefixed with `PRAMAN_` (config overrides) or `SAP_` (auth credentials):

| Variable                      | Purpose            | Required            |
| ----------------------------- | ------------------ | ------------------- |
| `SAP_CLOUD_BASE_URL`          | SAP system URL     | Yes                 |
| `SAP_CLOUD_USERNAME`          | Auth username      | Yes                 |
| `SAP_CLOUD_PASSWORD`          | Auth password      | Yes                 |
| `SAP_CLIENT`                  | SAP client number  | No (default: `100`) |
| `SAP_LANGUAGE`                | Language key       | No (default: `EN`)  |
| `PRAMAN_LOG_LEVEL`            | Override log level | No                  |
| `PRAMAN_INTERACTION_STRATEGY` | Override strategy  | No                  |
| `PRAMAN_AI_PROVIDER`          | AI provider        | No                  |
| `PRAMAN_AI_API_KEY`           | AI API key         | Only if using AI    |

### 8.3 Developer Workspace Setup

```bash
# Clone
git clone https://github.com/praman/playwright-praman.git && cd playwright-praman

# Install
npm install

# Build
npm run build              # tsup — produces dist/ with all entry points

# Lint + Type check
npm run lint               # ESLint 9 flat config + security plugin
npm run typecheck          # tsc --noEmit

# Unit tests
npm run test:unit          # Vitest

# Integration tests (requires SAP credentials in .env)
npm run test:integration   # Playwright against SAP demo apps

# Full CI check
npm run ci                 # lint + typecheck + test:unit + build

# Docs
npm run docs:dev           # Docusaurus dev server
npm run docs:api           # TypeDoc generation

# Code generation
npm run generate:proxies   # Typed proxies from SAP api.json
npm run generate:skill     # SKILL.md from TypeDoc output
npm run generate:sbom      # CycloneDX SBOM
npm run generate:schema    # JSON Schema from Zod config
```

---

## 9. Quality & Compliance

### 9.1 Quality Gates

| Gate               | Threshold                                                                                          | Tool                               | CI Enforcement |
| ------------------ | -------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------- |
| Type Safety        | Strict mode, no `any` escape hatches                                                               | `tsc --noEmit`                     | Blocking       |
| Lint               | 0 errors, 0 warnings                                                                               | ESLint 9 + eslint-plugin-security  | Blocking       |
| Unit Test Coverage | Tiered: 100% errors/API, 95% core, 90% global (per-file enforced)                                  | Vitest + @vitest/coverage-v8       | Blocking       |
| Integration Tests  | All pass against SAP demo apps                                                                     | Playwright                         | Blocking       |
| API Documentation  | 100% public symbols have TSDoc **with `@example`**                                                 | TypeDoc `--validation`             | Blocking       |
| Module Size        | ≤ 300 LOC per file (guideline; documented exceptions for browser-evaluated scripts, proxy modules) | Custom ESLint rule                 | Warning        |
| Security           | 0 high/critical vulnerabilities                                                                    | npm audit + Snyk                   | Blocking       |
| Bundle Size        | < 500 KB total dist (excl. optional deps)                                                          | size-limit                         | Warning        |
| Web-First Matchers | All UI5 assertions use auto-retry `expect.extend()`                                                | Custom matchers + Playwright retry | Blocking       |
| Performance        | Bridge injection < 500ms                                                                           | Custom Vitest benchmark            | Warning        |

### 9.2 Best Practice Alignment

Every decision in this plan was verified against official best practices from these sources:

| Source               | Key Practices Adopted                                                                                                                                                                                 | Decision           |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Playwright**       | Web-first assertions via `expect.extend()`; no `page.waitForTimeout()`; project dependencies for auth (not `globalSetup`); `trace: 'retain-on-failure'`; fixture-based DI; custom selector engine API | D28, Principle 7-8 |
| **Node.js**          | ESM-first (`"type": "module"`); `engines` field; `files` field for clean publishes; `pino-pretty` in devDependencies only                                                                             | package.json       |
| **Google**           | `release-please` for automated releases (replaces deprecated `standard-version`); boundary validation; testing pyramid; structured logging; progressive disclosure                                    | D6, D7, Tech Stack |
| **Microsoft**        | OpenTelemetry for observability; TypeScript strict + `moduleResolution: "node16"`; SBOM (CycloneDX); GitHub Actions with pinned action SHAs + minimal permissions; Azure Key Vault adapter            | D5, D15, CI        |
| **Claude/Anthropic** | Errors with `retryable` flag + `suggestions[]` for autonomous recovery; token-efficient summary mode; deterministic replay log; structured JSON capabilities for AI consumption                       | D8, D5-L4, D26     |

### 9.2 Security Measures

| Measure                  | Tool                      | Phase              |
| ------------------------ | ------------------------- | ------------------ |
| Dependency scanning      | npm audit + Snyk          | Phase 1            |
| Secret redaction in logs | pino redaction paths      | Phase 1            |
| Static analysis          | eslint-plugin-security    | Phase 1            |
| SBOM generation          | @cyclonedx/cyclonedx-npm  | Phase 5            |
| npm provenance           | `--provenance` on publish | Phase 5            |
| CSP compliance           | Nonce-based injection     | Phase 7 (deferred) |

### 9.3 Certification Readiness

| Certification        | Key Requirements                                 | v3.0 Approach                                                                      |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------- |
| SAP Partner          | SAP API compliance, no reverse engineering, SBOM | Uses only public SAP APIs (RecordReplay, Element.registry). SBOM per release.      |
| Playwright Community | API compatibility, test coverage, docs           | Follows Playwright fixture/selector patterns. 90%+ coverage. TypeDoc + Docusaurus. |

---

## 10. Documentation Strategy

| Deliverable             | Tool                     | Audience                  | Auto-Generated?                  |
| ----------------------- | ------------------------ | ------------------------- | -------------------------------- |
| User Guide              | Docusaurus               | Testers, developers       | No — human-authored              |
| API Reference           | TypeDoc                  | Developers, AI agents     | Yes — from TSDoc                 |
| SKILL.md                | Custom script            | AI agents (Copilot, etc.) | Partially — API tables generated |
| Migration Guide (v2→v3) | Docusaurus page          | Existing v2.5.0 users     | No — human-authored              |
| Capability Registry     | Generated JSON           | AI agents                 | Yes — from TypeDoc metadata      |
| Recipe Registry         | Generated TS + JSON      | AI agents                 | Yes — from annotated examples    |
| Architecture Decisions  | Markdown (this document) | Architects                | No                               |
| CONTRIBUTING.md         | Markdown                 | Contributors              | No                               |
| CHANGELOG.md            | Markdown                 | All                       | Yes — from conventional commits  |

**Hosting**: GitHub Pages (Docusaurus + TypeDoc), deployed via GitHub Actions.

---

## 11. Iteration Plan

### Phase Overview

| Phase       | Focus                     | Duration | Key Deliverables                                                                                                                                                                                                                                                                                                                                                                     |
| ----------- | ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Phase 0** | Architecture & Design     | 2 weeks  | ✅ COMPLETE. plan.md v2.1.0, npm v1.0.1, 10 ESLint plugins, dual ESM+CJS, 6 AI agents, 8 skill files, CI/CD 3 OS × 3 Node.                                                                                                                                                                                                                                                           |
| **Phase 1** | Core Infrastructure       | 3 weeks  | ✅ COMPLETE. 511 tests, 40 test files, 36 source files, 12 barrels. Config (Zod), errors (10 subclasses), logging (pino+redaction), OTel (NoOp), types (199 auto-gen interfaces, 4,092 methods), PlaywrightCompat, selector engine, matchers, retry, version-compare, step-decorator, wait-helpers. 98.92% stmt coverage. **Auto-gen (D22) pulled forward from Phase 6 — COMPLETE.** |
| **Phase 2** | Bridge + Proxy            | 4 weeks  | ✅ COMPLETE. 929 tests, 73 test files, 35 source files (23 bridge + 12 proxy). ClassicUI5Adapter (full), WebComponentAdapter (stub), HybridAdapter (delegation), 6 browser scripts, 3 interaction strategies, single unified proxy (D16), UI5Object chain (D17), API resolver (D19), discovery factory (D18), object map (D20). 99.18% stmt coverage. INT1/INT2 deferred to Phase 7. |
| **Phase 3** | Fixtures + Auth + Nav     | 3 weeks  | ✅ COMPLETE. 1,394 tests, 99 test files, 109 source files. **Major simplification**: adapter layer removed (5 files), proxy consolidated from 5→2 files. Fixtures: core+auth+nav+stability assembled via mergeTests(). Auth: 6 strategies, SAPAuthHandler, setup project pattern. UI5Handler: 18 methods. E2E gold standard: 6 steps passing against SAP BTP cloud.                  |
| **Phase 4** | Modules + Table + FE      | 3 weeks  | UI5 modules, Fiori Elements (ListReport, ObjectPage), dead code cleanup                                                                                                                                                                                                                                                                                                              |
| **Phase 5** | AI + Intents + Vocabulary | 3 weeks  | LLM service, agentic fixture, registries, intent wrappers, procurement domain, vocabulary                                                                                                                                                                                                                                                                                            |
| **Phase 6** | CLI + Reporters + Docs    | 2 weeks  | CLI, reporters, Docusaurus site, TypeDoc, SKILL.md                                                                                                                                                                                                                                                                                                                                   |
| **Phase 7** | Hardening + Certification | 2 weeks  | SBOM, provenance, behavioral tests, benchmarks, security audit, migration guide                                                                                                                                                                                                                                                                                                      |

**Total estimated duration: 22 weeks (~5.5 months)**

---

### Phase 0 — Architecture & Design (Weeks 1–2) ✅ COMPLETE

| Task                       | Deliverable                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| Finalize architecture plan | `plan.md` v1.0.0                                                                           |
| Scaffold repo              | `package.json`, `tsconfig.json`, `tsup.config.ts`, `eslint.config.mjs`, `vitest.config.ts` |
| Set up GitHub Actions CI   | `ci.yml` — lint + typecheck + test:unit                                                    |
| Create directory structure | All `src/` directories with `index.ts` barrel files                                        |
| Write CONTRIBUTING.md      | Contributor guidelines                                                                     |
| Configure ESLint           | Flat config + security plugin + 300 LOC max rule                                           |

### Phase 1 — Core Infrastructure (Weeks 3–5) ✅ COMPLETE

**Completed**: 2026-02-16 | **Tests**: 511 | **Files**: 36 source + 12 barrels + 40 test files | **Coverage**: 98.92% stmts

| Task                     | Files                                                 | Tests                                                                                                     | Status |
| ------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------ |
| PramanConfigSchema (Zod) | `core/config/schema.ts`, `core/config/loader.ts`      | Config validation, env override, NaN rejection, `Readonly<PramanConfig>` output                           | ✅     |
| Error hierarchy          | `core/errors/*.ts` (10 subclasses + `codes.ts`)       | Error creation, serialization, `retryable` flag, `attempted`, `details`, ControlError self-healing fields | ✅     |
| pino logger              | `core/logging/logger.ts`, `core/logging/redaction.ts` | Child loggers, secret redaction (14 paths incl. OAuth2 tokens)                                            | ✅     |
| OTel setup               | `core/telemetry/otel.ts`, `core/telemetry/spans.ts`   | Zero-overhead when disabled (NoOp pattern)                                                                | ✅     |
| PlaywrightCompat         | `core/compat/playwright-compat.ts`                    | Version detection, 8 feature flags, API normalization                                                     | ✅     |
| Types                    | `core/types/*.ts`                                     | Canonical UI5Selector, PramanConfig, BridgeAdapter, controls (70+ interfaces)                             | ✅     |
| Utils                    | `core/utils/*.ts`                                     | wait-helpers, retry (backoff+jitter), step-decorator, version-compare, constants                          | ✅     |
| Selector engine          | `selectors/*.ts`                                      | Parser + DOM engine registration, DoS protection                                                          | ✅     |
| Custom matchers          | `matchers/*.ts`                                       | 8 check functions (UI5 + table matchers), raw logic for Phase 2 fixture wiring                            | ✅     |

### Phase 2 — Bridge + Proxy (Weeks 6–9) ✅ COMPLETE

**Completed**: 2026-02-17 | **Tests**: 929 | **Files**: 35 source (23 bridge + 12 proxy) + 73 test files | **Coverage**: 99.18% stmts, 96.47% branches, 100% functions

| Task                                 | Files                                                                    | Tests                                                  | Decision | Status |
| ------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------ | -------- | ------ |
| ~~BridgeAdapter interface~~          | ~~`bridge/adapter.ts`~~                                                  | ~~Interface compliance~~ **DELETED in Phase 3**        | ~~D3~~   | ❌     |
| ~~ClassicUI5Adapter~~                | ~~`bridge/classic-adapter.ts`~~                                          | ~~Unit tests~~ **DELETED in Phase 3**                  | ~~D3~~   | ❌     |
| ~~WebComponentAdapter~~              | ~~`bridge/webcomponent-adapter.ts`~~                                     | ~~Stub/fallback~~ **DELETED in Phase 3**               | ~~D3~~   | ❌     |
| ~~HybridAdapter + factory~~          | ~~`bridge/hybrid-adapter.ts`, `bridge/adapter-factory.ts`~~              | ~~Auto-detection~~ **DELETED in Phase 3**              | ~~D3~~   | ❌     |
| Bridge injection                     | `bridge/injection.ts`                                                    | Lazy-only injection (W14)                              | —        | ✅     |
| Centralized API resolver             | `bridge/api-resolver.ts`                                                 | 3-tier chain: ElementRegistry→Core.byId→RecordReplay   | D19      | ✅     |
| Browser object map                   | `bridge/browser-scripts/object-map.ts`                                   | TTL cleanup, no leaks                                  | D20      | ✅     |
| Shared interaction logic             | Inlined into `strategy.ts` (no separate `shared.ts`)                     | Shared fireEvent + bridge accessor                     | D21      | ✅     |
| Interaction strategies               | `bridge/interaction-strategies/ui5-native.ts`, `dom-first.ts`, `opa5.ts` | Strategy parity, factory routing                       | D21      | ✅     |
| Discovery factory + chain (G1)       | `proxy/discovery-factory.ts`, `proxy/discovery.ts`                       | Strategy priorities wired, fallback chain              | D18      | ✅     |
| Single unified proxy                 | `proxy/dynamic-proxy.ts`                                                 | No double-proxy; single handler per control            | D16      | ✅     |
| UI5Object proxy                      | `proxy/ui5-object-proxy.ts`, `proxy/ui5-object-cache.ts`                 | Method forwarding, cache TTL/LRU                       | D17, D20 | ✅     |
| Proxy converter                      | `proxy/proxy-converter.ts`                                               | Bidirectional UI5Object ↔ UI5ControlProxy              | D17      | ✅     |
| Method filter + Playwright API       | `proxy/method-filter.ts`, `proxy/playwright-api.ts`                      | Blocklist filtering, allowlist                         | —        | ✅     |
| Return handler                       | `proxy/return-handler.ts`                                                | Result type routing                                    | —        | ✅     |
| ~~Typed proxies (20 controls)~~      | ~~`proxy/typed/*.ts`~~                                                   | Replaced by auto-gen interfaces (D22, Phase 1)         | D4       | N/A    |
| ~~Auto-generated method signatures~~ | ~~Build-time generator from `api.json`~~                                 | ✅ **DONE in Phase 1** — 199 interfaces, 4,092 methods | D22      | ✅     |
| `getSelectorForElement`              | `bridge/browser-scripts/get-selector.ts`                                 | G5 carry-forward                                       | —        | ✅     |
| Barrel exports                       | `bridge/index.ts`, `proxy/index.ts`, `src/index.ts`                      | Export validation (attw 6/6)                           | —        | ✅     |
| INT1/INT2 integration smoke          | Deferred to Phase 7 (requires real browser + SAP demo apps)              | —                                                      | —        | ⏳     |

### Phase 3 — Fixtures + Auth + Navigation (Weeks 10–12) ✅ COMPLETE

**Completed**: 2026-02-19 | **Tests**: 1,394 | **Files**: 109 source + 99 test | **E2E**: 6/6 steps passing

> **Detailed plan**: [`plans/plan3.md`](plan3.md) — 21 batches, 3 sub-phases
> **Tracker**: [`plans/phase3-tracker.md`](phase3-tracker.md) — 19 agents, 6 waves, all COMPLETE
> **Key decisions**: W1–W14 in plan3.md. D2 (fixture composition), D28 (setup project auth).
> **Critical simplification**: BridgeAdapter layer REMOVED — proxy calls page.evaluate() directly.

| Task                              | Files                                                                 | Tests                                                                       | Status |
| --------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------ |
| ~~G2: Fix proxy stub methods~~    | Replaced by `control-proxy.ts` (653 LOC)                              | Full proxy lifecycle tested                                                 | ✅     |
| ~~Wire orphaned browser scripts~~ | Adapters deleted; `object-map.ts` remains **unwired** (memory leak)   | Scripts tested individually; lifecycle wiring deferred                      | ⚠️     |
| Core fixtures (worker + test)     | `fixtures/core-fixtures.ts` (232 LOC)                                 | Config, logger, tracer, compat, selectors, 8 matchers via expect.extend()   | ✅     |
| Auth strategies (6)               | `auth/strategies/*.ts` (5 files), `auth/multi-tenant.ts`              | BTP SAML, Basic, O365, API, Cert, MultiTenant                               | ✅     |
| Stability fixtures                | `fixtures/stability-fixtures.ts` (219 LOC)                            | WalkMe/analytics interception, auto UI5 stability                           | ✅     |
| Auth handler + setup project      | `auth/auth-handler.ts` (261 LOC), `auth-setup.ts`, `auth-teardown.ts` | D28 pattern: storageState, retry, session management                        | ✅     |
| Auth fixtures                     | `fixtures/auth-fixtures.ts` (162 LOC)                                 | sapAuth fixture with configurable strategy                                  | ✅     |
| Navigation module                 | `modules/navigation.ts` (201 LOC)                                     | Tile, intent, hash, search, back/forward                                    | ✅     |
| Navigation fixtures               | `fixtures/nav-fixtures.ts` (136 LOC)                                  | ui5Navigation fixture                                                       | ✅     |
| WorkZone module                   | `modules/workzone.ts` (128 LOC)                                       | Dual-frame bridge injection, context switching (G6)                         | ✅     |
| UI5Handler                        | `fixtures/ui5-handler.ts` (588 LOC)                                   | 18 methods: control, controls, click, fill, press, etc.                     | ✅     |
| Shell + Footer handlers           | `fixtures/shell-handler.ts` (102), `footer-handler.ts` (119)          | FLP shell bar + footer operations                                           | ✅     |
| Fixture assembly                  | `fixtures/index.ts` (68 LOC)                                          | `mergeTests()` → single `test` + `expect` export                            | ✅     |
| Phase 1 infra wiring (R2)         | All fixture files                                                     | logging ✅, telemetry ✅, retry ✅, wait-helpers ✅, compat ✅, matchers ✅ | ✅     |
| Phase 3 simplification            | 10 files deleted, `control-proxy.ts` replaces proxy chain             | Old tests deleted, new tests cover unified proxy                            | ✅     |
| E2E gold standard                 | `tests/e2e/sap-cloud/bom-e2e-gold-standard.spec.ts`                   | 6 steps: navigate, create BOM, materials (2×), BOM usage, create            | ✅     |

### Phase 4 — Cleanup + Modules + Table + FE (Weeks 13–15)

> **Updated**: 2026-02-19 — Split into Phase 4a (cleanup) and Phase 4b (modules).
> **Prerequisites**: Phase 3 COMPLETE. Adapter layer removed. ~950 LOC dead code identified.
> **Key change**: Web Component support needs different approach (no adapter pattern).

**Phase 4a: Cleanup + Hardening** (all tasks parallelizable)

| Task                       | Files                                                                       | Tests               | Notes                                   |
| -------------------------- | --------------------------------------------------------------------------- | ------------------- | --------------------------------------- |
| DELETE dead code (4 files) | `step-decorator.ts`, `api-resolver.ts`, `get-version.ts`, `get-selector.ts` | Remove orphan tests | ~340 LOC removed                        |
| Wire/DELETE constants      | `control-types.ts`, `object-categories.ts`                                  | —                   | ~277 LOC; wire into discovery or delete |
| Wire object-map cleanup    | `object-map.ts` → fixture teardown                                          | Lifecycle test      | Fix memory leak risk                    |
| Matcher type augmentation  | New `matchers/types.d.ts`                                                   | Type tests          | Type-safe `expect().toHaveUI5Text()`    |
| Create CI/CD               | `.github/workflows/ci.yml`                                                  | —                   | lint + typecheck + test:unit + build    |
| Wire telemetry spans       | `telemetry/spans.ts` → handler/proxy                                        | —                   | OTel spans for bridge/proxy operations  |

**Phase 4b: Modules + Table + FE**

| Task                    | Files                                    | Tests                                     | Notes                                       |
| ----------------------- | ---------------------------------------- | ----------------------------------------- | ------------------------------------------- |
| Table operations        | `modules/table.ts`                       | Get rows, cells, filter, sort, pagination | Uses proxy + `getControlAggregation`        |
| OData handler           | `modules/odata.ts`                       | CRUD with optional Zod schema             | —                                           |
| Dialog helpers          | `modules/dialog.ts`                      | Dialog/popover interactions               | —                                           |
| Date handling           | `modules/date.ts`                        | Date picker, time picker                  | —                                           |
| Fiori Elements          | `fe/list-report.ts`, `fe/object-page.ts` | FE test library                           | Depends on table module                     |
| ~~WebComponentAdapter~~ | ~~N/A~~                                  | —                                         | Adapter pattern removed; needs new approach |
| ~~Registry discovery~~  | ~~N/A~~                                  | —                                         | Evaluate if needed without adapter pattern  |

### Phase 5 — AI + Intents + Vocabulary (Weeks 16–18)

| Task                 | Files                                          | Tests                                                              |
| -------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| LLM service          | `ai/llm-service.ts`, `ai/schemas/*.ts`         | Provider abstraction, Zod responses                                |
| Agentic handler      | `ai/agentic-handler.ts`                        | Autonomous operations, checkpoint serialization                    |
| Capability registry  | `ai/capabilities/*.ts`                         | AI-queryable capabilities with `registryVersion` + `usage_example` |
| Recipe registry      | `ai/recipes/*.ts`                              | AI-queryable examples                                              |
| Core intent wrappers | `intents/core-wrappers.ts`                     | fillField, clickButton, etc.                                       |
| Procurement domain   | `intents/domains/procurement.ts`               | Reference implementation                                           |
| Vocabulary service   | `vocabulary/*.ts`, `vocabulary/domains/*.json` | Fuzzy matching, domain lookup                                      |

### Phase 6 — CLI + Reporters + Docs (Weeks 19–20)

> **Scope reductions from earlier phases** (verified 2026-02-17):
>
> - D22 auto-gen (`scripts/generate-typed-proxies.ts`) — **pulled forward to Phase 1, COMPLETE**
> - `scripts/generate-capabilities.ts` (430 LOC) — **already implemented**, extracts @capability tags
> - `scripts/setup-ide.ts` (150 LOC) — **already implemented**, interactive IDE config wizard
> - `scripts/generate-json-schema.ts` — stub only (4 LOC), needs implementation
> - `scripts/generate-skill-md.ts` — stub only (4 LOC), needs implementation

| Task                       | Files                                   | Tests                    | Status      |
| -------------------------- | --------------------------------------- | ------------------------ | ----------- |
| CLI init                   | `cli/init.ts`                           | Project scaffolding      | —           |
| CLI doctor                 | `cli/doctor.ts`                         | Health check             | —           |
| Compliance reporter        | `reporters/compliance-reporter.ts`      | Praman compliance report | —           |
| OData trace reporter       | `reporters/odata-trace-reporter.ts`     | OData call logging       | —           |
| Docusaurus site            | `docs/`                                 | All user guide pages     | —           |
| TypeDoc generation         | Build script                            | API reference            | —           |
| SKILL.md generation        | `scripts/generate-skill-md.ts`          | AI agent skill file      | Stub exists |
| JSON Schema generation     | `scripts/generate-json-schema.ts`       | Config schema for IDEs   | Stub exists |
| ~~Auto-gen typed proxies~~ | ~~`scripts/generate-typed-proxies.ts`~~ | ~~199 interfaces~~       | ✅ Phase 1  |
| ~~Capability registry~~    | ~~`scripts/generate-capabilities.ts`~~  | ~~TSDoc extraction~~     | ✅ Done     |
| ~~IDE setup wizard~~       | ~~`scripts/setup-ide.ts`~~              | ~~IDE config~~           | ✅ Done     |

### Phase 7 — Hardening + Certification (Weeks 21–22)

> **Deferred items absorbed into Phase 7** (verified 2026-02-17):
>
> - INT1/INT2 integration smoke tests (deferred from Phase 2) — need real browser + SAP demo apps
> - GitHub issue #7 (parent) remains open until INT1/INT2 complete

| Task                           | Deliverable                                                    | Notes                              |
| ------------------------------ | -------------------------------------------------------------- | ---------------------------------- |
| INT1: Bridge integration smoke | `tests/integration/bridge-smoke.spec.ts` against SAP demo apps | Deferred from Phase 2 (batch INT1) |
| INT2: Proxy integration smoke  | `tests/integration/proxy-smoke.spec.ts` + SAP cloud smoke      | Deferred from Phase 2 (batch INT2) |
| SBOM generation                | CycloneDX per release                                          | —                                  |
| npm provenance                 | `--provenance` publish                                         | —                                  |
| Behavioral equivalence tests   | Golden master tests vs. wdi5                                   | —                                  |
| Performance benchmarks         | Bridge injection, control discovery, method call latency       | —                                  |
| Security audit                 | Final Snyk + npm audit review                                  | —                                  |
| Migration guide                | Docusaurus page: v2.5.0 → v3.0                                 | —                                  |
| CSP assessment                 | Document CSP dependency; `respectCSP` config placeholder       | —                                  |

---

### 11.1 Post-Phase 2 Architect Review (2026-02-17)

Full codebase audit against plan.md, plan1.md, plan2.md. Trust source code only.

**Phase 2 Metrics** (verified `npm run test:unit -- --coverage`):

| Metric     | Value                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| Tests      | 929 passing (73 test files)                                                  |
| Statements | 99.18%                                                                       |
| Branches   | 96.47%                                                                       |
| Functions  | 100%                                                                         |
| Lines      | 99.14%                                                                       |
| Lint       | 0 errors, 0 warnings                                                         |
| TypeCheck  | 0 errors                                                                     |
| Build      | ESM + CJS + DTS (attw 6/6)                                                   |
| Source     | 90 files (48 core, 3 sel, 3 mat, 23 bridge, 12 proxy, 9 placeholder barrels) |

#### R1. Layer Hierarchy — CLEAN

No circular dependencies. No upward violations.

```
Core (types, errors, config, logging, telemetry, utils, compat)
  ↓
Selectors & Matchers
  ↓
Bridge (adapters, browser-scripts, interaction-strategies)
  ↓
Proxy (dynamic-proxy, discovery, cache, ui5-object, converter)
```

Verified: core never imports bridge/proxy. Bridge never imports proxy.

#### R2. Phase 1 Consumption — Post-Phase 3 Status

| Phase 1 Module                  | Consumed? | Where Consumed                                             | Status      |
| ------------------------------- | --------- | ---------------------------------------------------------- | ----------- |
| `core/errors/*`                 | ✅ YES    | bridge, proxy, auth, fixtures                              | Phase 2     |
| `core/utils/version-compare`    | ✅ YES    | `bridge/api-resolver.ts` (dead), `inject-ui5.ts` (active)  | Phase 2     |
| `selectors/selector-parser`     | ✅ YES    | `proxy/cache.ts`                                           | Phase 2     |
| `core/config/schema`            | ✅ YES    | bridge, proxy, fixtures                                    | Phase 2     |
| `core/logging`                  | ✅ YES    | `core-fixtures.ts` rootLogger, `ui5-handler.ts`            | Phase 3     |
| `core/telemetry`                | ✅ YES    | `core-fixtures.ts` tracer (NoOp)                           | Phase 3     |
| `core/utils/retry`              | ✅ YES    | `auth/auth-handler.ts`                                     | Phase 3     |
| `core/utils/step-decorator`     | ❌ NO     | **DEAD CODE** — not imported anywhere in src/              | ⚠️ Phase 4a |
| `core/utils/wait-helpers`       | ✅ YES    | `fixtures/ui5-handler.ts`                                  | Phase 3     |
| `core/compat/playwright-compat` | ✅ YES    | `core-fixtures.ts` playwrightCompat fixture                | Phase 3     |
| `selectors/ui5-selector-engine` | ✅ YES    | `core-fixtures.ts` selectorRegistration fixture            | Phase 3     |
| `matchers/*`                    | ✅ YES    | `core-fixtures.ts` matcherRegistration → `expect.extend()` | Phase 3     |

**Result**: 11 of 12 Phase 1 modules consumed. Only `step-decorator.ts` remains unwired (79 LOC dead code).

#### R3. Orphaned Source Files — 7 FOUND (Updated 2026-02-19)

| File                                     | LOC | Status                                                             | Resolution                                      |
| ---------------------------------------- | --- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `bridge/browser-scripts/object-map.ts`   | 104 | ⚠️ Tested but not imported; cleanup never called — **MEMORY LEAK** | Phase 4a: wire cleanup into fixture teardown    |
| `bridge/browser-scripts/get-selector.ts` | 102 | Tested but not imported by any src file                            | Phase 4a: DELETE (functionality not needed yet) |
| `bridge/browser-scripts/get-version.ts`  | 47  | Dead — functionality inlined in inject-ui5.ts                      | Phase 4a: DELETE                                |
| `bridge/api-resolver.ts`                 | 113 | Dead — functionality inlined in inject-ui5.ts                      | Phase 4a: DELETE                                |
| `core/utils/step-decorator.ts`           | 79  | Dead — not imported anywhere in src/                               | Phase 4a: wire into UI5Handler or DELETE        |
| `core/constants/control-types.ts`        | 163 | Unwired — no barrel, no imports                                    | Phase 4a: evaluate + wire or DELETE             |
| `core/constants/object-categories.ts`    | 114 | Unwired — no barrel, no imports                                    | Phase 4a: evaluate + wire or DELETE             |

#### R4. Features Already Implemented for Future Phases (Updated 2026-02-19)

| Feature                           | Planned Phase | Actual Status     | Evidence                                                              |
| --------------------------------- | ------------- | ----------------- | --------------------------------------------------------------------- |
| D22 auto-gen typed proxies        | Phase 6       | ✅ Phase 1        | `scripts/generate-typed-proxies.ts` (1,266 LOC)                       |
| Capability generator              | Unplanned     | ✅ Done           | `scripts/generate-capabilities.ts` (430 LOC)                          |
| IDE setup wizard                  | Unplanned     | ✅ Done           | `scripts/setup-ide.ts` (150 LOC)                                      |
| Bridge smoke tests (INT1 partial) | Phase 2 INT1  | Partially written | `tests/integration/bridge-smoke.spec.ts` (165 LOC)                    |
| E2E gold standard test            | Phase 7       | ✅ Phase 3        | `tests/e2e/sap-cloud/bom-e2e-gold-standard.spec.ts` — 6 steps passing |
| Custom matcher registration       | Phase 3       | ✅ Phase 3        | 8 matchers wired via `expect.extend()` in `core-fixtures.ts`          |
| Auth setup project (D28)          | Phase 3       | ✅ Phase 3        | `auth/auth-setup.ts` + `playwright.config.ts` project dependencies    |
| Fixture assembly (D2)             | Phase 3       | ✅ Phase 3        | `mergeTests(coreTest, authTest, navTest, stabilityTest)`              |

#### R5. Deferred Items Tracking (Updated 2026-02-19)

| Item                             | Original Phase  | Status / Deferred To                                 | GitHub Issue |
| -------------------------------- | --------------- | ---------------------------------------------------- | ------------ |
| INT1 bridge integration smoke    | Phase 2         | ⏳ Phase 7                                           | #7 (parent)  |
| INT2 proxy + SAP cloud smoke     | Phase 2         | ⏳ Phase 7                                           | #7 (parent)  |
| G2 proxy stub methods            | Phase 2         | ✅ RESOLVED Phase 3 — replaced by `control-proxy.ts` | #22          |
| WebComponentAdapter full support | Phase 2 (stub)  | ⏳ Phase 4b (new approach, not adapter)              | —            |
| `registry` discovery strategy    | Phase 2 (no-op) | ⏳ Phase 4b — evaluate if still needed               | —            |
| CSP compliance                   | Phase 2         | ⏳ Phase 7                                           | —            |
| Dead code cleanup (~950 LOC)     | N/A             | ⏳ Phase 4a                                          | —            |
| Object map memory leak           | Phase 2 (D20)   | ⚠️ Phase 4a (HIGH)                                   | —            |
| CI/CD setup                      | Phase 0         | ⚠️ Phase 4a (HIGH)                                   | —            |
| Matcher type augmentation        | Phase 3         | ⏳ Phase 4a                                          | —            |
| `test.step()` wiring             | Phase 1         | ⏳ Phase 4a                                          | —            |

#### R6. Duplicate Scope — NONE CRITICAL

| Check                           | Result                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| D22 listed in Phase 6?          | Resolved — note at line 1109 acknowledges pull-forward              |
| Typed proxies in Phase 2?       | Resolved — marked N/A, replaced by auto-gen                         |
| INT1/INT2 in Phase 7 task list? | **Fixed** — explicitly added to Phase 7 table                       |
| Matchers Phase 1 vs Phase 3     | By design — raw functions (P1) wired into fixtures (P3)             |
| Error classes in later phases   | None planned — all 10 subclasses created in Phase 1                 |
| Config schema extensions        | By design — Zod schema is extensible, Phase 2 added strategy fields |

### 11.2 Post-Phase 3 Architect Review (2026-02-19)

Full codebase audit of 109 source files and 99 test files. Every statement verified against actual code.

**Current Metrics** (verified from source):

| Metric       | Value                                                                          |
| ------------ | ------------------------------------------------------------------------------ |
| Tests        | 1,394 passing (86 unit test files + 1 E2E + 1 integration)                     |
| Source files | 109 (42 core, 3 sel, 3 mat, 21 bridge, 8 proxy, 8 fixtures, 13 auth, 11 other) |
| Lint         | 0 errors, 0 warnings                                                           |
| TypeCheck    | 0 errors                                                                       |
| Build        | ESM + CJS + DTS (attw 6/6 exports valid)                                       |
| E2E          | 1 gold standard test, 6/6 steps passing against SAP BTP cloud                  |

#### R7. Phase 3 Simplification — VALIDATED

| Change                     | Evidence                                                                                                              | Impact                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 5 adapter files deleted    | `git status` shows `D src/bridge/adapter*.ts`, `classic-adapter.ts`, `hybrid-adapter.ts`, `webcomponent-adapter.ts`   | -680 LOC, eliminates data-loss bug          |
| 5 proxy files deleted      | `D src/proxy/dynamic-proxy.ts`, `playwright-api.ts`, `proxy-converter.ts`, `return-handler.ts`, `ui5-object-proxy.ts` | -1,300 LOC, eliminates inter-file data loss |
| 16 test files deleted      | Corresponding test files for deleted source                                                                           | Clean migration, no orphan references       |
| `control-proxy.ts` created | 653 LOC unified handler, inline return handling, 7-type system                                                        | Justified 300 LOC exception                 |
| `ui5-handler.ts` created   | 588 LOC, 18 methods, manages full control lifecycle                                                                   | Justified 300 LOC exception                 |

#### R8. Design Decision Status — Post-Phase 3

| #   | Decision                           | Status                 | Evidence                                                                               |
| --- | ---------------------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| D1  | Single package + sub-path exports  | ✅ ACTIVE              | `package.json` exports, `tsup.config.ts` 6 entries, attw 6/6                           |
| D2  | Internal fixture composition       | ✅ ACTIVE              | `fixtures/index.ts` `mergeTests()` assembly                                            |
| D3  | Version-negotiated bridge adapters | ❌ **REMOVED Phase 3** | Adapter files deleted; proxy calls `page.evaluate()` directly                          |
| D4  | Hybrid typed proxy                 | ✅ ACTIVE (modified)   | 199 auto-gen interfaces (types only); dynamic proxy at runtime via `control-proxy.ts`  |
| D5  | 4-layer observability              | 🔄 PARTIAL             | L1 test.step() not wired; L2 pino ✅; L3 OTel NoOp ✅; L4 AI telemetry ⏳              |
| D6  | Boundary validation (Zod)          | ✅ ACTIVE              | Config boundary validated; bridge `as unknown` accepted                                |
| D7  | Zod-validated config               | ✅ ACTIVE              | `core/config/schema.ts`, `Object.freeze()` in fixture                                  |
| D8  | Unified error hierarchy            | ✅ ACTIVE              | 10 error subclasses in `core/errors/`, all with `retryable`, `suggestions[]`           |
| D9  | AI Mode A + C                      | ⏳ Phase 5             | Stub barrels configured; no implementation                                             |
| D10 | Testing: Vitest + GitHub Actions   | ✅ ACTIVE              | 1,394 Vitest tests; CI not yet configured (no `.github/workflows/ci.yml`)              |
| D11 | No plugin API                      | ✅ ACTIVE              | No extension points exposed                                                            |
| D12 | Auto-gen docs                      | ⏳ Phase 6             | Stubs only                                                                             |
| D13 | Apache 2.0                         | ✅ ACTIVE              | `LICENSE` file                                                                         |
| D14 | Playwright compat range            | ✅ ACTIVE              | `peerDependencies: ">=1.50.0 <2.0.0"`, `PlaywrightCompat` 8 flags                      |
| D15 | Security measures                  | 🔄 PARTIAL             | eslint-plugin-security ✅; npm audit ⏳; SBOM ⏳                                       |
| D16 | Single unified proxy               | ✅ ACTIVE              | `control-proxy.ts` single handler, no double-proxy                                     |
| D17 | Bidirectional proxy conversion     | ✅ ACTIVE (inlined)    | Return handling in `control-proxy.ts` creates sub-proxies for objects/controls         |
| D18 | Discovery factory integrated       | ✅ ACTIVE              | `proxy/discovery-factory.ts` + `proxy/discovery.ts`                                    |
| D19 | Centralized API resolver           | ✅ ACTIVE (inlined)    | `__praman_getById()` registered in `inject-ui5.ts` (not separate `api-resolver.ts`)    |
| D20 | Browser object map cleanup         | ⚠️ **NOT WIRED**       | `object-map.ts` exists but `objectMapCleanup()` never called — memory leak risk        |
| D21 | Shared interaction logic           | ✅ ACTIVE (inlined)    | Shared logic in `strategy.ts` base, not separate `shared.ts`                           |
| D22 | Auto-generated method signatures   | ✅ COMPLETE (Phase 1)  | `scripts/generate-typed-proxies.ts`, 199 interfaces, 4,092 methods                     |
| D23 | skipStabilityWait config           | ✅ ACTIVE              | In `PramanConfigSchema` + per-selector override                                        |
| D24 | exec() with new Function()         | ✅ ACTIVE              | Used in `control-proxy.ts` with ESLint disable                                         |
| D25 | Visibility preference default      | ✅ ACTIVE              | `preferVisibleControls` in config schema                                               |
| D26 | UI5Object AI introspection         | ⏳ NOT IMPLEMENTED     | UI5Object exists but no `describe()`, `suggestOperations()`, `getAIContext()` methods  |
| D27 | Module size ≤300 LOC guideline     | ✅ ACTIVE              | 2 documented exceptions (control-proxy.ts, ui5-handler.ts)                             |
| D28 | Auth via project dependencies      | ✅ ACTIVE              | `auth-setup.ts` produces storageState; `playwright.config.ts` has project dependencies |
| D29 | Enhanced error model + AI envelope | ✅ ERRORS, ⏳ ENVELOPE | Error model complete; AI response envelope not yet needed (Phase 5)                    |

#### R9. Best Practice Gaps Identified

| #     | Gap                                                                  | Severity  | Best Practice Source                             | Recommendation                                              |
| ----- | -------------------------------------------------------------------- | --------- | ------------------------------------------------ | ----------------------------------------------------------- |
| BP-1  | No `test.step()` wrapping in UI5Handler methods                      | 🟡 Medium | Playwright: test.step() for structured reporting | Wire `step-decorator.ts` (currently dead code) into handler |
| BP-2  | Object map cleanup never called — memory leak                        | 🟡 Medium | Google SRE: resource cleanup in lifecycle        | Wire `objectMapCleanup()` into fixture teardown             |
| BP-3  | `UI5ObjectCache` exported but not used internally                    | 🟢 Low    | Google: don't export unused code                 | Either wire into UI5Handler or remove from barrel           |
| BP-4  | No GitHub Actions CI configured                                      | 🔴 High   | Microsoft: CI on every PR                        | Create `.github/workflows/ci.yml`                           |
| BP-5  | `api-resolver.ts` is dead code (inlined in inject-ui5.ts)            | 🟢 Low    | Clean code: remove dead code                     | DELETE file                                                 |
| BP-6  | 3 dead browser scripts (get-version, get-selector, object-map)       | 🟢 Low    | Clean code: remove dead code                     | DELETE or wire                                              |
| BP-7  | No TypeScript declaration augmentation for custom matchers           | 🟡 Medium | Playwright: type-safe expect.extend()            | Add `PlaywrightMatchers` augmentation                       |
| BP-8  | `step-decorator.ts` is dead code                                     | 🟢 Low    | Clean code: remove dead code                     | Wire or DELETE                                              |
| BP-9  | Constants files (`control-types.ts`, `object-categories.ts`) unwired | 🟢 Low    | Clean code: remove dead code                     | Wire or DELETE                                              |
| BP-10 | E2E test has 2 remaining `waitForTimeout()` calls                    | 🟢 Low    | Playwright: no fixed waits                       | Replace with polling-based alternatives                     |

#### R10. Current Implementation vs Original Plan

| Planned Feature              | Plan Section      | Status         | Notes                                                                        |
| ---------------------------- | ----------------- | -------------- | ---------------------------------------------------------------------------- |
| **Core Infrastructure**      | Phase 1           | ✅ COMPLETE    | All modules implemented; 3 files unused (step-decorator, constants×2)        |
| **Bridge Adapters**          | Phase 2/D3        | ❌ **REMOVED** | Adapters caused data-loss bug; replaced by direct `page.evaluate()`          |
| **Browser Scripts**          | Phase 2           | ✅ IMPLEMENTED | 5 of 8 scripts actively used; 3 dead (get-version, get-selector, object-map) |
| **Interaction Strategies**   | Phase 2/D21       | ✅ IMPLEMENTED | 3 strategies, shared base in strategy.ts                                     |
| **Single Unified Proxy**     | Phase 2/D16       | ✅ IMPLEMENTED | `control-proxy.ts` with inline return handling                               |
| **UI5Object + Cache**        | Phase 2/D17       | ✅ IMPLEMENTED | `ui5-object.ts` + `ui5-object-cache.ts`                                      |
| **Discovery Factory**        | Phase 2/D18       | ✅ IMPLEMENTED | `discovery-factory.ts` + `discovery.ts`                                      |
| **Core Fixtures**            | Phase 3           | ✅ IMPLEMENTED | Worker + test scoped, matcher registration wired                             |
| **Auth (6 strategies)**      | Phase 3/D28       | ✅ IMPLEMENTED | Setup project pattern, 6 strategies, SAPAuthHandler                          |
| **Navigation**               | Phase 3           | ✅ IMPLEMENTED | Module + fixture, tile/hash/intent navigation                                |
| **Stability Fixtures**       | Phase 3           | ✅ IMPLEMENTED | WalkMe interception, auto UI5 stability                                      |
| **WorkZone**                 | Phase 3/G6        | ✅ IMPLEMENTED | Dual-frame bridge injection module                                           |
| **Fixture Assembly**         | Phase 3/D2        | ✅ IMPLEMENTED | `mergeTests()` pattern in `fixtures/index.ts`                                |
| **UI5Handler**               | Phase 3           | ✅ IMPLEMENTED | 588 LOC, 18 methods, manages full lifecycle                                  |
| **E2E Validation**           | Phase 3           | ✅ IMPLEMENTED | Gold standard test: 6 steps, SAP BTP cloud                                   |
| **Table Fixtures**           | Phase 3 (planned) | ❌ NOT CREATED | Deferred — table matchers exist but no fixture                               |
| **OData Fixtures**           | Phase 3 (planned) | ❌ NOT CREATED | Deferred to Phase 4                                                          |
| **Assertion Fixtures**       | Phase 3 (planned) | ❌ NOT CREATED | Matchers wired via expect.extend() instead                                   |
| **Interaction Fixtures**     | Phase 3 (planned) | ❌ NOT CREATED | UI5Handler provides interaction methods directly                             |
| **Shell Fixtures**           | Phase 3 (planned) | 🔄 PARTIAL     | `shell-handler.ts` exists but no dedicated fixture                           |
| **Web Component Adapter**    | Phase 4 (planned) | ⏳ DEFERRED    | Adapter pattern removed; WC support needs different approach                 |
| **Typed Proxy directory**    | Phase 2/D4        | ❌ NOT CREATED | 199 auto-gen interfaces in `core/types/controls.ts` instead                  |
| **Proxy Converter**          | Phase 2/D17       | ❌ DELETED     | Functionality inlined in `control-proxy.ts`                                  |
| **Playwright API allowlist** | Phase 2           | ❌ DELETED     | Interaction strategies handle directly                                       |
| **AI Layer**                 | Phase 5           | ⏳ STUB        | Barrel configured, no implementation                                         |
| **Intent API**               | Phase 5           | ⏳ STUB        | Barrel configured, no implementation                                         |
| **Vocabulary**               | Phase 5           | ⏳ STUB        | Barrel configured, no implementation                                         |
| **FE (Fiori Elements)**      | Phase 4           | ⏳ STUB        | Barrel configured, no implementation                                         |
| **Reporters**                | Phase 6           | ⏳ STUB        | Barrel configured, no implementation                                         |
| **CLI**                      | Phase 6           | ⏳ STUB        | Barrel exists but NOT in tsup/exports                                        |
| **Docusaurus**               | Phase 6           | ❌ NOT CREATED | No docs/ site directory                                                      |
| **CI/CD**                    | Phase 0           | ⚠️ MISSING     | No `.github/workflows/ci.yml`                                                |
| **SBOM**                     | Phase 5/7         | ⏳ DEFERRED    | Not yet created                                                              |
| **npm provenance**           | Phase 5/7         | ⏳ DEFERRED    | Not yet published                                                            |

#### R11. Recommended Next Phase Plan (Phase 4 — Revised)

Based on the review, Phase 4 should be split into two sub-phases:

**Phase 4a: Cleanup + Hardening** (prerequisite for all subsequent work)

| Task                                                                                  | Priority  | Dependencies               | Parallelizable?          |
| ------------------------------------------------------------------------------------- | --------- | -------------------------- | ------------------------ |
| DELETE dead code: step-decorator.ts, api-resolver.ts, get-version.ts, get-selector.ts | 🔴 High   | None                       | ✅ Yes (all independent) |
| Wire or DELETE: control-types.ts, object-categories.ts                                | 🟡 Medium | None                       | ✅ Yes                   |
| Wire object-map cleanup into fixture teardown (memory leak fix)                       | 🔴 High   | None                       | ✅ Yes                   |
| Wire step-decorator into UI5Handler (or DELETE)                                       | 🟡 Medium | Depends on DELETE decision | No                       |
| Wire UI5ObjectCache into UI5Handler                                                   | 🟢 Low    | None                       | ✅ Yes                   |
| Add TypeScript matcher type augmentation                                              | 🟡 Medium | None                       | ✅ Yes                   |
| Create `.github/workflows/ci.yml`                                                     | 🔴 High   | None                       | ✅ Yes                   |
| Wire telemetry spans into handler/proxy                                               | 🟢 Low    | None                       | ✅ Yes                   |

**Phase 4b: Modules + Table + FE** (original Phase 4 scope)

| Task                                              | Priority  | Dependencies     | Parallelizable?        |
| ------------------------------------------------- | --------- | ---------------- | ---------------------- |
| Table module (`modules/table.ts`)                 | 🔴 High   | Phase 4a cleanup | ✅ Yes with OData      |
| OData module (`modules/odata.ts`)                 | 🔴 High   | Phase 4a cleanup | ✅ Yes with Table      |
| Dialog helpers (`modules/dialog.ts`)              | 🟡 Medium | Phase 4a cleanup | ✅ Yes                 |
| Date handling (`modules/date.ts`)                 | 🟡 Medium | Phase 4a cleanup | ✅ Yes                 |
| FE ListReport (`fe/list-report.ts`)               | 🟡 Medium | Table module     | No                     |
| FE ObjectPage (`fe/object-page.ts`)               | 🟡 Medium | None             | ✅ Yes with ListReport |
| Web Component support (new approach, not adapter) | 🟡 Medium | Phase 4a cleanup | No                     |

**Dependency graph for parallel execution:**

```
Phase 4a (all independent, run in parallel):
  ├── Agent A: Dead code deletion (4 files)
  ├── Agent B: Wire object-map cleanup + UI5ObjectCache
  ├── Agent C: CI/CD setup (.github/workflows/ci.yml)
  ├── Agent D: Matcher type augmentation
  └── Agent E: Constants/step-decorator decision + wiring

Phase 4b (after 4a gate passes):
  ├── Agent F: Table module + Table fixtures (independent)
  ├── Agent G: OData module (independent)
  ├── Agent H: Dialog + Date modules (independent)
  └── Agent I: FE ListReport + ObjectPage (depends on Table from Agent F)
```

---

## Appendix A — Wizard Q&A Log

| Q#  | Question                           | Answer                                                                                    | Decision      |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------- | ------------- |
| Q1  | Package architecture?              | **Single package** with sub-path exports. One version, one build, one install.            | D1            |
| Q2  | Fixture composition model?         | **Internal composition** — static `test.extend()` chain within single package.            | D2            |
| Q3  | Bridge injection strategy?         | Version-negotiated adapters + Web Components Phase 2                                      | D3            |
| Q4  | Control proxy model?               | Hybrid — typed wrappers over dynamic proxy                                                | D4            |
| Q5  | Logging & observability?           | Full 4-layer stack — pino + OTel + Reporter + AI telemetry                                | D5            |
| Q6  | Configuration model?               | Zod-validated `praman.config.ts` + env override + .env/vault                              | D6, D7        |
| Q7  | AI agent API surface?              | Mode A + C — SKILL.md + agentic fixture. No MCP server.                                   | D9            |
| Q8  | Testing strategy?                  | Migrate + extend existing tests. GitHub Actions CI.                                       | D10           |
| Q9  | Plugin/extension API?              | No plugin API in v3.0.                                                                    | D11           |
| Q10 | Documentation & SKILL.md?          | Auto-gen SKILL.md + Docusaurus + TypeDoc on GitHub Pages.                                 | D12           |
| Q11 | Licensing?                         | Apache 2.0.                                                                               | D13           |
| Q12 | Playwright version strategy?       | Version range with CI matrix + PlaywrightCompat.                                          | D14           |
| Q13 | Security & compliance?             | All measures except CSP compliance (deferred).                                            | D15           |
| Q14 | Carry-forward v2.5.0 capabilities? | A: Document as carry-forward, refactor to best practices (not copy-paste).                | D16–D27       |
| Q15 | exec() serialization approach?     | A: Keep `new Function()` with ESLint disable + security docs.                             | D24           |
| Q16 | Typed proxy strategy?              | C: Typed interfaces for known controls + dynamic proxy + documented 7-type return system. | D4 (enhanced) |
| Q17 | Stale element recovery?            | Manual `renewWebElementReference()` sufficient. No automatic forceSelect.                 | —             |
| Q18 | Visibility preference?             | A: Keep as default behavior, configurable in config.                                      | D25           |
| Q19 | API resolution pattern?            | C: Register `__praman_getById()` globally, used by all code.                              | D19           |
| Q20 | skipStabilityWait config?          | A: Global config default + per-selector override.                                         | D23           |
| Q21 | Module size enforcement?           | B: ≤300 LOC guideline with documented exceptions (not blocking).                          | D27           |
| Q22 | UI5Object→Control proxy?           | Investigate: confirmed one-directional in v2.5.0. v3.0 adds bidirectional.                | D17           |
| Q23 | UI5Object AI introspection?        | A: First-class capability with describe/suggestOperations/getAIContext.                   | D26           |
| Q24 | Double-proxy pattern?              | Both investigated. Proxy#2 redundant. v3.0 merges to single proxy.                        | D16           |
| Q25 | ControlDiscoveryFactory dead code? | Investigation confirmed unused. v3.0 integrates or removes.                               | D18           |

---

## Appendix B — Single Package Design Benefits

The single-package architecture (D1) simplifies multiple downstream decisions:

| Decision | Benefit                                                                                              |
| -------- | ---------------------------------------------------------------------------------------------------- |
| **D1**   | Single package `playwright-praman` with sub-path exports — one version, one build, one install (npm) |
| **D2**   | Internal fixture composition via static `test.extend()` chain — no runtime discovery; type-safe      |
| **D7**   | Vault adapter in `src/auth/` — internal import, no cross-package reference                           |
| **D8**   | Error hierarchy in `src/core/errors/` — no cross-package error imports                               |
| **D10**  | Single test suite — one Vitest config, one Playwright config                                         |
| **D13**  | Apache 2.0 — single LICENSE file                                                                     |
| **D15**  | One SBOM (CycloneDX) for entire package                                                              |

---

## Appendix C — v2.5.0 Deep Analysis: Proxy Architecture

### C.1 Double-Proxy Pattern (FINDING: Redundant)

**v2.5.0** wraps each UI5ControlProxy in **two** nested Proxy objects:

1. **Proxy#1 (Fluent Proxy)** — Created by constructor via `createFluentProxy()`:
   - Intercepts property access, returns `this` for chaining
   - Handles `then/catch/finally` for Promise interop (prevents auto-thenable)
   - Detects known methods (press, setValue, etc.) and unknown methods → forwards to `callMethod()`
   - **File**: `/Users/maheshwar/Documents/projects/package/src/ui5-control-proxy.ts` lines ~1700–1829

2. **Proxy#2 (Factory Proxy)** — Created by static factory `UI5ControlProxy.create()`:
   - Wraps Proxy#1 in another `new Proxy()`
   - Also intercepts `then/catch/finally` (duplicate)
   - Also intercepts unknown props → routes to `callMethod()` (duplicate, less intelligent)
   - **File**: `/Users/maheshwar/Documents/projects/package/src/ui5-control-proxy.ts` lines ~60–120

**wdi5 comparison**: wdi5 has NO double-proxy (see `/Users/maheshwar/Documents/projects/consult/wdi5/src/lib/wdi5-control.ts`). Uses `_attachControlBridge()` to dynamically add methods to the control instance. Single proxy at bridge level only.

**v3.0 Resolution (D16)**: Merge into single `dynamic-proxy.ts` with one handler.

### C.2 UI5Object Cross-Proxy Chain (FINDING: One-Directional)

When a control method returns a non-control object (e.g., `getModel()`, `getRouter()`):

```
UI5ControlProxy.callMethod('getModel')
  → browser: executeControlMethod() detects returnType: 'object'
  → browser: stores object in window._objects[uuid]
  → Node: UI5Object.create({ uuid, type, page })
  → Node: UI5ObjectProxy wraps → AI introspection available
```

**Direction**: Control → Object only. No reverse path (Object → Control).

**Recursive chains**: UI5Object methods can return MORE UI5Objects:

```
control.getModel() → UI5Object(JSONModel)
  → .getProperty('/items') → UI5Object(Array)
    → .getObject() → raw value
```

**v3.0 Resolution (D17)**: `proxy-converter.ts` adds bidirectional conversion.

### C.3 Seven-Type Return Detection System

Browser-side `executeControlMethod()` classifies returns into 7 types:

| Type          | Condition                                         | Node-side Action                |
| ------------- | ------------------------------------------------- | ------------------------------- |
| `empty`       | Method returns `undefined`/`null`                 | Return `undefined`              |
| `result`      | Primitive (string, number, boolean)               | Return raw value                |
| `element`     | `instanceof sap.ui.core.Control` + ID in selector | Return same UI5ControlProxy     |
| `newElement`  | `instanceof sap.ui.core.Control` + different ID   | Create new UI5ControlProxy      |
| `aggregation` | Array of Controls                                 | Return array of UI5ControlProxy |
| `object`      | Non-control SAP object                            | Create UI5Object proxy          |
| `none`        | Exception / unclassified                          | Log warning, return `undefined` |

**wdi5 parity**: Identical 7 types in `/Users/maheshwar/Documents/projects/package/src/executeControlMethod.ts` (lines 148–260).

### C.4 Three-Tier API Resolution (FINDING: 6x Duplicated)

v2.5.0 resolves UI5 controls via a 3-tier fallback chain, **duplicated 6 times** across files:

```javascript
// Tier 1: UI5 1.108+ ElementRegistry
sap.ui.require(['sap/ui/core/ElementRegistry'], (Reg) => Reg.get(id));
// Tier 2: Legacy Core.byId
sap.ui.getCore().byId(id);
// Tier 3: Element.getElementById (deprecated)
sap.ui.core.Element.getElementById(id);
```

**Files containing duplicates**:

- `/Users/maheshwar/Documents/projects/package/src/ui5-control-proxy.ts`
- `/Users/maheshwar/Documents/projects/package/src/ui5-object.ts`
- `/Users/maheshwar/Documents/projects/package/src/control-discovery.ts`
- `/Users/maheshwar/Documents/projects/package/src/interaction-strategies/*.ts`

**v3.0 Resolution (D19)**: Single `api-resolver.ts` injected as `window.__praman_getById()`.

### C.5 ControlDiscoveryFactory (FINDING: Dead Code)

**File**: `/Users/maheshwar/Documents/projects/package/src/control-discovery-factory.ts` (164 LOC)

Defines 5 strategies with priorities:

- Priority -1: Cache
- Priority 0: ElementRegistry
- Priority 1: By ID
- Priority 2: RecordReplay
- Priority 3: By Properties

**Problem**: Not used by `createControlFinderFunction()` in `/Users/maheshwar/Documents/projects/package/src/ui5-control-proxy.ts`, which hardcodes priorities [0, 1, 2]. Priority numbers don't match.

**v3.0 Resolution (D18)**: Integrate into `bridge/browser-scripts/find-control.ts` or remove.

---

## Appendix D — v2.5.0 Carry-Forward Capabilities

The following v2.5.0 capabilities are proven, production-tested features that will be carried forward to v3.0. Per decision Q14/A, they are **refactored to best practices** — not copy-pasted.

| #    | Capability                    | v2.5.0 File                                         | LOC    | v3.0 Target                              | Action                                                            |
| ---- | ----------------------------- | --------------------------------------------------- | ------ | ---------------------------------------- | ----------------------------------------------------------------- |
| CF1  | 3-tier control discovery      | `/package/src/ui5-control-proxy.ts`                 | ~200   | `bridge/browser-scripts/find-control.ts` | Refactor: integrate DiscoveryFactory, centralize API resolver     |
| CF2  | 7-type return system          | `/package/src/ui5-control-proxy.ts`                 | ~180   | `proxy/dynamic-proxy.ts`                 | Refactor: extract to dedicated return handler, document types     |
| CF3  | Visibility-aware matching     | `/package/src/ui5-control-proxy.ts`                 | ~50    | `bridge/browser-scripts/find-control.ts` | Carry forward as configurable default (D25)                       |
| CF4  | RegExp serialization          | `/package/src/ui5-control-proxy.ts`                 | ~30    | `proxy/dynamic-proxy.ts`                 | Carry forward (serialize RegExp in selectors for browser context) |
| CF5  | Interaction strategies        | `/package/src/interaction-strategies/`              | ~1,200 | `bridge/interaction-strategies/`         | Refactor: extract shared fireEvent (D21), keep 3 strategies       |
| CF6  | UI5Object + AI introspection  | `/package/src/ui5-object.ts`, `ui5-object-proxy.ts` | ~1,200 | `proxy/ui5-object-proxy.ts`              | Promote AI methods to first-class (D26), add bidirectional (D17)  |
| CF7  | Object cache (TTL + LRU)      | `/package/src/ui5-object-cache.ts`                  | 408    | `proxy/ui5-object-cache.ts`              | Refactor: add browser-side cleanup pairing (D20)                  |
| CF8  | Selector discovery            | `/package/src/selector-discovery.ts`                | 530    | `bridge/browser-scripts/get-selector.ts` | Carry forward (already production-tested)                         |
| CF9  | exec() function serialization | `/package/src/ui5-control-proxy.ts`                 | ~50    | `proxy/dynamic-proxy.ts`                 | Keep with ESLint disable + security docs (D24)                    |
| CF10 | skipStabilityWait             | `/package/src/ui5-control-proxy.ts`                 | ~10    | Config + proxy                           | Promote to global config + per-selector override (D23)            |

**Total carry-forward**: ~3,858 LOC refactored into ~2,500 LOC (estimated 35% reduction via deduplication + decomposition).

---

## Appendix E — Enhanced Design Decisions (D16–D27)

These decisions were added in v2.0.0 of this plan, based on deep line-by-line analysis of `ui5-control-proxy.ts` (1,829 LOC), cross-referenced with wdi5 source code and dhikraft v2.5.0 supporting files.

### Investigation Method

1. **Full reading**: `/package/src/ui5-control-proxy.ts`, `/wdi5/src/lib/wdi5-control.ts`, `/package/src/executeControlMethod.ts`
2. **Deep investigation**: UI5Object chain (6 files), double-proxy pattern, capabilities system, interaction strategies, ControlDiscoveryFactory
3. **12 wizard questions**: Presented to architect, all answered with specific decisions
4. **Cross-reference**: Every assumption in original plan verified against actual code
5. **Reference documentation**: Analysis documents in `/consult/one/` provide detailed evidence

### Decisions by Category

**Proxy Architecture (D16, D17, D18)**:

- D16: Merge double-proxy — single handler eliminates redundant interception
- D17: Bidirectional proxy conversion — AI agents can traverse Control↔Object
- D18: Dead code removal — ControlDiscoveryFactory either integrated or removed

**Bridge Infrastructure (D19, D20, D21, D22)**:

- D19: `__praman_getById()` — DRY, version-aware, single point of change
- D20: Browser objectMap cleanup — TTL + WeakRef prevents long-run memory leaks
- D21: Shared interaction logic — eliminates fireEvent duplication across strategies
- D22: Auto-generated signatures — ✅ COMPLETE (Phase 1). 199 interfaces, 4,092 methods from SAP UI5 api.json via `scripts/generate-typed-proxies.ts`

**Configuration (D23, D24, D25)**:

- D23: `skipStabilityWait` global+override — enterprise WalkMe/overlay compatibility
- D24: `exec()` + `new Function()` — pragmatic security tradeoff, documented
- D25: Visibility preference default — correct for 95% of SAP FLP use cases

**AI-First (D26, D27, D29)**:

- D26: UI5Object AI introspection — describe(), suggestOperations(), getAIContext()
- D27: Module size guideline — maintainability target, not dogmatic enforcement
- D29: Enhanced error model (Google error codes+details, Claude self-healing ControlError, AI response envelope, capability versioning, agentic checkpoints)

---

_End of Document — Praman v1.0 Architecture & Rebuild Plan v3.0.0 — Post-Phase 3 Architect Review (2026-02-19)_
