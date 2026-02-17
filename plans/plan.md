# Praman v1.0 — AI-First SAP UI5 Test Automation Platform

## Architecture & Rebuild Plan

| Property         | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| **Document ID**  | PRAMAN-ARCH-PLAN-001                                            |
| **Version**      | 2.1.0                                                           |
| **Status**       | 🟢 Phase 1 COMPLETE — 511 tests, 40 test files, 36 source files |
| **Author**       | Principal Architect                                             |
| **Created**      | 2025-02-14                                                      |
| **Last Updated** | 2026-02-16                                                      |

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
- **Future-Proof**: Bridge adapters decouple from specific Playwright/UI5 versions; Web Component support designed in from day one.
- **Plug-and-Play**: Single `npm install playwright-praman` — zero-config defaults with progressive disclosure of advanced options.

### Origin

Praman (registered as `playwright-praman` on npm) is a port of [wdi5](https://ui5-community.github.io/wdi5/) (WebdriverIO-based SAP UI5 testing framework) to Playwright, with additional AI/agent features. The previous version was called "dhikraft". v1.0 is a complete ground-up rewrite — new code, new architecture, new name, informed by dhikraft v2.5.0 lessons but not constrained by its codebase.

### Key Architectural Decisions Summary

| #   | Decision                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Single package** (`playwright-praman`) with sub-path exports — not a monorepo                                                   |
| D2  | **Internal fixture composition** — all fixtures in one package, conditionally loaded                                              |
| D3  | **Version-negotiated bridge adapters** — Classic UI5 + WebComponent + Hybrid                                                      |
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

### 5.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Test Author / AI Agent                       │
│  import { test, expect } from 'playwright-praman';                  │
│  import { procurementAPI } from 'playwright-praman/intents';        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────────┐
│  Layer 5: AI & Intent API                   (playwright-praman/ai,  │
│  ┌──────────────┐ ┌──────────────┐          playwright-praman/      │
│  │ SKILL.md     │ │ Agentic      │          intents, vocabulary)    │
│  │ Capabilities │ │ Fixture      │                                  │
│  │ Recipes      │ │ LLM Service  │                                  │
│  └──────────────┘ └──────────────┘                                  │
│  ┌──────────────┐ ┌──────────────┐                                  │
│  │ Intent       │ │ Vocabulary   │                                  │
│  │ Wrappers     │ │ Matcher      │                                  │
│  └──────────────┘ └──────────────┘                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 4: Domain Fixtures                   (playwright-praman)      │
│  ┌──────────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌─────────────┐      │
│  │ Auth     │ │ Nav    │ │ Table│ │ OData  │ │ FE          │      │
│  │ Fixture  │ │Fixture │ │Fixtu │ │Fixture │ │ Fixture     │      │
│  └──────────┘ └────────┘ └──────┘ └────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 3: Typed Control Proxy + UI5Object Proxy                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  UI5Button │ UI5Input │ UI5Table │ UI5ComboBox │ ...     │      │
│  │  (typed interfaces — auto-generated from api.json)       │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │  Dynamic Proxy (single unified handler per control)       │      │
│  ├──────────────────────────────────────────────────────────┤      │
│  │  UI5Object Proxy (Models, Routers, Bindings, etc.)       │      │
│  │  ┌────────────┐ ┌────────────┐ ┌───────────────────┐    │      │
│  │  │ AI Intro-  │ │ Object     │ │ Proxy Converter   │    │      │
│  │  │ spection   │ │ Cache+TTL  │ │ (Ctrl↔Object)     │    │      │
│  │  └────────────┘ └────────────┘ └───────────────────┘    │      │
│  └──────────────────────────────────────────────────────────┘      │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 2: Bridge Adapters                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ ClassicUI5   │ │ WebComponent │ │ Hybrid       │               │
│  │ Adapter      │ │ Adapter      │ │ Adapter      │               │
│  │ (RecordReplay│ │ (Shadow DOM  │ │ (auto-detect │               │
│  │  + Registry) │ │  + Custom El)│ │  per element)│               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 1: Core Infrastructure                                       │
│  ┌─────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌───────┐ ┌────────┐ │
│  │ Config  │ │ Errors │ │ Logger │ │ OTel │ │ Types │ │Compat  │ │
│  │ (Zod)   │ │(unified)│ │(pino) │ │(opt) │ │      │ │(PW ver)│ │
│  └─────────┘ └────────┘ └────────┘ └──────┘ └───────┘ └────────┘ │
├─────────────────────────────────────────────────────────────────────┤
│  Layer 0: Playwright Test Runner                                    │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  @playwright/test (page, browser, context, expect)        │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Core Principles

1. **Separation of Concerns** — Each module ≤300 LOC; SRP enforced via ESLint import rules
2. **AI-First API Surface** — Every public API designed for both human and AI consumption; typed interfaces with TSDoc
3. **Progressive Disclosure** — `import { test } from 'playwright-praman'` works with zero config; advanced features via sub-path exports
4. **Version Resilience** — `BridgeAdapter` interface decouples from UI5 versions; `PlaywrightCompat` layer decouples from Playwright versions
5. **Enterprise Compliance** — Strict TypeScript, pino logging, SBOM, npm provenance, Apache 2.0
6. **Ground-Up Quality** — No copy-paste from v2.5.0; every line is new, tested, documented
7. **Web-First Assertions** — All UI5 assertions use Playwright's auto-retry mechanism via `expect.extend()`. Custom matchers (`toHaveUI5Text`, `toBeUI5Visible`, `toHaveUI5Property`) poll the control until timeout — never snapshot-then-assert. _(Playwright best practice: web-first assertions eliminate flakiness from async rendering.)_
8. **No Fixed Waits** — `page.waitForTimeout()` is **banned** for UI5 interactions. Use `waitForUI5Stable()` (polling-based) or Playwright auto-retry assertions instead. _(Playwright best practice: fixed waits are the #1 cause of flaky tests.)_
9. **Hermetic Unit Tests** — All unit tests run without network, SAP systems, or external services. Bridge interactions are mocked via typed test doubles. Integration tests use real SAP systems; unit tests never do. _(Google Testing Blog: hermetic tests are deterministic, fast, and parallelizable.)_
10. **Immutable Configuration** — After Zod validation, the config object is `Readonly<PramanConfig>` — no runtime mutation. Overrides use spread operators, never direct assignment. _(Google TypeScript Style Guide: prefer `readonly` for properties that should not be reassigned.)_

### 5.3 Data Flow

```
Test Code
  │
  ├─ ui5.button({ text: 'Save' })
  │    │
  │    ├─ [Layer 3] UI5Button typed proxy
  │    │    │
  │    │    ├─ [Layer 2] HybridAdapter.findControl(selector)
  │    │    │    │
  │    │    │    ├─ Detects: is this Classic UI5 or Web Component?
  │    │    │    │
  │    │    │    ├─ Classic: page.evaluate(() => __praman_getById(id))
  │    │    │    │    └─ API resolver: ElementRegistry.get() → Core.byId() → RecordReplay
  │    │    │    └─ WebComp: page.locator('ui5-button[text="Save"]')
  │    │    │
  │    │    └─ Returns: typed UI5Button proxy (single unified Proxy handler)
  │    │
  │    ├─ .press()
  │    │    │
  │    │    ├─ [Layer 2] Adapter executes interaction (via InteractionStrategy)
  │    │    ├─ [Layer 1] pino logs { action: 'press', control: 'Button', dur: 45 }
  │    │    ├─ [Layer 1] OTel span (if enabled)
  │    │    └─ [Layer 0] Playwright test.step('Press Save button')
  │    │
  │    └─ .getModel()  →  returnType: 'object'
  │         │
  │         ├─ [Layer 2] Browser stores object in __praman_objectMap[uuid]
  │         ├─ [Layer 3] UI5Object.create({ uuid, type: 'sap.ui.model.json.JSONModel', page })
  │         ├─ [Layer 3] UI5Object Proxy wraps → AI introspection available
  │         │    ├─ .describe()  →  AI-friendly object summary
  │         │    ├─ .getProperty('/path')  →  recursive UI5Object or value
  │         │    └─ .methodCall()  →  proxy-converter detects Control → returns UI5ControlProxy
  │         └─ [Layer 3] Object cache (TTL + LRU) stores proxy for reuse
  │
  └─ expect(messageStrip).toHaveText('Saved')
       └─ [Layer 0] Playwright assertion
```

---

## 6. Module Decomposition

### 6.1 Directory Structure

```
playwright-praman/
├── package.json                    # Single package: "playwright-praman"
├── tsconfig.json                   # Strict mode, moduleResolution: "node16" (BP-TS)
├── tsup.config.ts                  # Multi-entry build (., /ai, /intents, /vocabulary, /fe, /reporters)
├── eslint.config.mjs               # Flat config + eslint-plugin-security
├── vitest.config.ts                # Unit test config
├── playwright.config.ts            # Integration test config
├── .env.example                    # Template for SAP credentials
├── LICENSE                         # Apache 2.0
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
│
├── src/
│   ├── index.ts                    # Main entry: export { test, expect, defineConfig }
│   │                               # BP-GOOGLE: barrel files export public API only — no deep re-exports that create circular deps
│   │
│   ├── core/                       # Layer 1 — Core Infrastructure
│   │   ├── config/
│   │   │   ├── schema.ts           # PramanConfigSchema (Zod) — returns Readonly<PramanConfig> (BP-GOOGLE)
│   │   │   ├── loader.ts           # loadConfig() — parse, validate, env override
│   │   │   └── index.ts
│   │   ├── errors/
│   │   │   ├── base.ts             # PramanError base class
│   │   │   ├── codes.ts            # BP-GOOGLE: const enum of all error codes (ERR_BRIDGE_TIMEOUT, etc.)
│   │   │   ├── bridge-error.ts
│   │   │   ├── control-error.ts    # BP-CLAUDE: adds lastKnownSelector, availableControls[], suggestedSelector
│   │   │   ├── config-error.ts     # ConfigError (wraps ZodError)
│   │   │   ├── auth-error.ts
│   │   │   ├── navigation-error.ts
│   │   │   ├── odata-error.ts
│   │   │   ├── selector-error.ts
│   │   │   ├── timeout-error.ts
│   │   │   ├── ai-error.ts
│   │   │   └── index.ts
│   │   ├── logging/
│   │   │   ├── logger.ts           # pino instance factory, child loggers
│   │   │   ├── redaction.ts        # Secret field redaction paths
│   │   │   └── index.ts
│   │   ├── telemetry/
│   │   │   ├── otel.ts             # OpenTelemetry (opt-in, no-op when disabled)
│   │   │   ├── spans.ts            # Span helpers
│   │   │   └── index.ts
│   │   ├── compat/
│   │   │   ├── playwright-compat.ts # Version differences abstraction
│   │   │   └── index.ts
│   │   ├── types/
│   │   │   ├── config.ts           # PramanConfig (z.infer<typeof Schema>)
│   │   │   ├── selectors.ts        # UI5Selector (one canonical definition)
│   │   │   ├── controls.ts         # UI5Control base types
│   │   │   ├── ui5-types.d.ts      # SAP UI5 global type augmentation
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── wait-helpers.ts     # UI5 readiness, polling, retries
│   │       ├── retry.ts            # BP-GOOGLE/SRE: exponential backoff + jitter helper
│   │       ├── step-decorator.ts   # test.step() wrapper
│   │       ├── version-compare.ts  # Semver comparison
│   │       └── index.ts
│   │
│   ├── bridge/                     # Layer 2 — Bridge Adapters
│   │   ├── adapter.ts              # BridgeAdapter interface
│   │   ├── classic-adapter.ts      # ClassicUI5Adapter (RecordReplay, Registry)
│   │   ├── webcomponent-adapter.ts # WebComponentAdapter (Shadow DOM, Custom Elements)
│   │   ├── hybrid-adapter.ts       # HybridAdapter (auto-detect per element)
│   │   ├── adapter-factory.ts      # Create adapter from detected UI5 version
│   │   ├── injection.ts            # Browser-side script injection (eager + late)
│   │   ├── api-resolver.ts         # Centralized 3-tier API chain (registered as __praman_getById)
│   │   ├── method-blacklist.ts     # 88-item method blacklist (wdi5 parity)
│   │   ├── interaction-strategies/ # Pluggable interaction strategies
│   │   │   ├── strategy.ts         # InteractionStrategy interface
│   │   │   ├── playwright.ts       # PlaywrightStrategy (default v3.0: fire* methods)
│   │   │   ├── dom-first.ts        # DOMFirstStrategy (DOM clicks + auto-detect input types)
│   │   │   ├── opa5.ts             # OPA5Strategy (RecordReplay.interactWithControl)
│   │   │   ├── shared.ts           # Shared bridge accessor + shared fireEvent logic
│   │   │   └── factory.ts          # InteractionStrategyFactory
│   │   ├── browser-scripts/        # Scripts for page.evaluate()
│   │   │   ├── inject-ui5.ts       # Setup window._ui5Bridge
│   │   │   ├── find-control.ts     # Control lookup (integrated with discovery-factory)
│   │   │   ├── interact.ts         # Control interaction
│   │   │   ├── get-version.ts      # UI5 version detection
│   │   │   ├── get-selector.ts     # Reverse selector engineering (migrated from selector-discovery.ts)
│   │   │   └── object-map.ts       # Browser-side UUID→object storage with TTL cleanup
│   │   └── index.ts
│   │
│   ├── proxy/                      # Layer 3 — Typed Control Proxy + Object Proxy
│   │   ├── dynamic-proxy.ts        # Single unified Proxy handler (merged fluent + method interception)
│   │   ├── ui5-object-proxy.ts     # UI5Object proxy for non-control objects (Models, Routers, Bindings)
│   │   ├── ui5-object-cache.ts     # UUID-based cache with TTL + LRU eviction
│   │   ├── browser-object-map.ts   # Browser-side object storage lifecycle (cleanup/WeakRef)
│   │   ├── proxy-converter.ts      # Bidirectional: UI5Object ↔ UI5ControlProxy conversion
│   │   ├── typed/                  # Auto-generated typed interfaces
│   │   │   ├── ui5-button.ts
│   │   │   ├── ui5-input.ts
│   │   │   ├── ui5-table.ts
│   │   │   ├── ui5-combobox.ts
│   │   │   ├── ui5-select.ts
│   │   │   ├── ui5-checkbox.ts
│   │   │   ├── ui5-radio-button.ts
│   │   │   ├── ui5-text-area.ts
│   │   │   ├── ui5-date-picker.ts
│   │   │   ├── ui5-generic-tile.ts
│   │   │   ├── ui5-list.ts
│   │   │   ├── ui5-icon-tab-bar.ts
│   │   │   ├── ui5-dialog.ts
│   │   │   ├── ui5-message-strip.ts
│   │   │   ├── ui5-smart-table.ts
│   │   │   ├── ui5-smart-filter-bar.ts
│   │   │   ├── ui5-dynamic-page.ts
│   │   │   ├── ui5-overflow-toolbar.ts
│   │   │   ├── ui5-multi-input.ts
│   │   │   └── index.ts
│   │   ├── cache.ts                # Control proxy cache (LRU, RegExp-safe keys)
│   │   ├── discovery.ts            # 3-tier: registry → ID → RecordReplay (integrated with factory)
│   │   ├── discovery-factory.ts    # Control discovery strategy selection (5 strategies)
│   │   └── index.ts
│   │
│   ├── selectors/                  # Selector Engine
│   │   ├── ui5-selector-engine.ts  # Custom Playwright selector: ui5=...
│   │   ├── selector-parser.ts      # Parse selector strings → UI5Selector
│   │   └── index.ts
│   │
│   ├── matchers/                   # Custom expect matchers (BP-PLAYWRIGHT: web-first)
│   │   ├── ui5-matchers.ts         # toHaveUI5Text, toBeUI5Visible, toHaveUI5Property
│   │   ├── table-matchers.ts       # toHaveUI5RowCount, toHaveUI5CellText
│   │   └── index.ts               # expect.extend() registration
│   │
│   ├── fixtures/                   # Layer 4 — Fixtures (assembled here)
│   │   ├── core-fixtures.ts        # ui5, config, page enhancements
│   │   ├── auth-fixtures.ts        # sapAuth, auth
│   │   ├── navigation-fixtures.ts  # navigation, ui5Navigation
│   │   ├── table-fixtures.ts       # ui5Table
│   │   ├── odata-fixtures.ts       # odata
│   │   ├── assertion-fixtures.ts   # ui5Assertion
│   │   ├── interaction-fixtures.ts # ui5Interact
│   │   ├── shell-fixtures.ts       # ui5Shell
│   │   ├── workzone-fixtures.ts    # workzone (G6)
│   │   ├── ai-fixtures.ts          # aiService, agentic
│   │   ├── intent-fixtures.ts      # intentWrappers, procurementAPI
│   │   ├── vocabulary-fixtures.ts  # vocabulary
│   │   ├── fe-fixtures.ts          # fioriElements
│   │   └── index.ts               # Assembles all via test.extend() chain
│   │
│   ├── auth/                       # Authentication
│   │   ├── auth.setup.ts           # BP-PLAYWRIGHT: Setup project test file (produces storageState)
│   │   ├── global-teardown.ts
│   │   ├── strategies/
│   │   │   ├── base.ts             # AuthStrategy interface
│   │   │   ├── btp-saml.ts
│   │   │   ├── basic.ts
│   │   │   ├── office365.ts
│   │   │   └── custom.ts
│   │   ├── auth-handler.ts
│   │   └── index.ts
│   │
│   ├── modules/                    # UI5 Domain Operations
│   │   ├── navigation.ts
│   │   ├── table.ts
│   │   ├── assertion.ts
│   │   ├── element.ts
│   │   ├── control.ts
│   │   ├── date.ts
│   │   ├── dialog.ts
│   │   ├── odata.ts                # OData V2/V4 CRUD (optional Zod schema)
│   │   └── index.ts
│   │
│   ├── fe/                         # Fiori Elements (playwright-praman/fe)
│   │   ├── list-report.ts
│   │   ├── object-page.ts
│   │   └── index.ts
│   │
│   ├── ai/                         # AI Layer (playwright-praman/ai)
│   │   ├── llm-service.ts          # LLM provider abstraction
│   │   ├── method-discovery.ts     # AI-driven method discovery
│   │   ├── recommendation.ts
│   │   ├── agentic-handler.ts      # Autonomous multi-step operations
│   │   ├── capabilities/
│   │   │   ├── registry.ts
│   │   │   └── generated.ts        # Auto-generated
│   │   ├── recipes/
│   │   │   ├── registry.ts
│   │   │   └── generated.ts        # Auto-generated
│   │   ├── schemas/                # Zod schemas for LLM response validation
│   │   │   ├── method-discovery.ts
│   │   │   └── recommendation.ts
│   │   └── index.ts
│   │
│   ├── intents/                    # Intent API (playwright-praman/intents)
│   │   ├── core-wrappers.ts        # fillField, clickButton, etc.
│   │   ├── operation-catalog.ts
│   │   ├── domains/
│   │   │   └── procurement.ts      # Reference implementation
│   │   └── index.ts
│   │
│   ├── vocabulary/                 # Vocabulary System (playwright-praman/vocabulary)
│   │   ├── service.ts
│   │   ├── matcher.ts              # Fuzzy matcher
│   │   ├── loader.ts
│   │   ├── schema.ts               # Vocabulary Zod schema (replaces Ajv)
│   │   ├── domains/
│   │   │   ├── procurement.json
│   │   │   ├── sales.json
│   │   │   ├── finance.json
│   │   │   ├── manufacturing.json
│   │   │   ├── master-data.json
│   │   │   └── common.json
│   │   └── index.ts
│   │
│   ├── reporters/                  # Reporters (playwright-praman/reporters)
│   │   ├── compliance-reporter.ts
│   │   ├── odata-trace-reporter.ts
│   │   └── index.ts
│   │
│   └── cli/                        # CLI (npx playwright-praman init|doctor)
│       ├── init.ts
│       ├── doctor.ts
│       ├── validator.ts
│       └── index.ts
│
├── tests/
│   ├── unit/                       # Vitest — no browser
│   │   ├── core/
│   │   ├── bridge/
│   │   ├── proxy/
│   │   ├── selectors/
│   │   ├── auth/
│   │   ├── modules/
│   │   ├── ai/
│   │   ├── intents/
│   │   └── vocabulary/
│   ├── integration/                # Playwright against SAP demo apps
│   │   ├── bridge/
│   │   ├── proxy/
│   │   ├── auth/
│   │   ├── table/
│   │   ├── navigation/
│   │   └── behavioral/            # Golden master equivalence
│   └── e2e/                        # Full SAP cloud scenarios
│       └── sap-cloud/
│
├── scripts/
│   ├── generate-typed-proxies.ts   # From SAP api.json
│   ├── generate-skill-md.ts        # From TypeDoc output
│   ├── generate-sbom.ts            # CycloneDX
│   └── generate-json-schema.ts     # Config JSON Schema from Zod
│
├── docs/                           # Docusaurus site
│   ├── docusaurus.config.ts
│   ├── docs/
│   │   ├── getting-started.md
│   │   ├── configuration.md
│   │   ├── ui5-controls.md
│   │   ├── authentication.md
│   │   ├── fiori-elements.md
│   │   ├── ai-integration.md
│   │   ├── intent-api.md
│   │   ├── migration-v2-to-v3.md
│   │   └── architecture.md
│   └── blog/
│
├── skills/                         # AI Agent skill files
│   └── playwright-praman-sap-testing/
│       ├── SKILL.md
│       ├── ai-quick-reference.md
│       └── examples.ts
│
└── .github/
    ├── workflows/
    │   ├── ci.yml                  # lint + typecheck + test:unit + build
    │   │                           # BP-MICROSOFT: pin action versions to SHA, minimal permissions
    │   ├── release.yml             # npm publish with provenance (via release-please)
    │   └── docs.yml                # Docusaurus + TypeDoc → GitHub Pages
    ├── copilot-instructions.md
    └── CODEOWNERS
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
| **Phase 3** | Fixtures + Auth + Nav     | 3 weeks  | All fixtures assembled, global setup, auth strategies, FLP navigation, WorkZone                                                                                                                                                                                                                                                                                                      |
| **Phase 4** | Modules + Table + FE      | 3 weeks  | UI5 modules, Fiori Elements (ListReport, ObjectPage)                                                                                                                                                                                                                                                                                                                                 |
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
| BridgeAdapter interface              | `bridge/adapter.ts`                                                      | Interface compliance                                   | D3       | ✅     |
| ClassicUI5Adapter                    | `bridge/classic-adapter.ts`, `bridge/browser-scripts/*.ts`               | Unit tests (integration deferred to Phase 7)           | D3       | ✅     |
| WebComponentAdapter                  | `bridge/webcomponent-adapter.ts`                                         | Stub/fallback unit tests                               | D3       | ✅     |
| HybridAdapter + factory              | `bridge/hybrid-adapter.ts`, `bridge/adapter-factory.ts`                  | Auto-detection tests                                   | D3       | ✅     |
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

### Phase 3 — Fixtures + Auth + Navigation (Weeks 10–12)

> **Detailed plan**: [`plans/plan3.md`](plan3.md) — 20 batches, 3 sub-phases, ~2,530 LOC, ~115 tests
>
> **Sub-phases**: 3.1 Foundation → 3.2 Wiring+Auth → 3.3 WorkZone+Assembly
> **Key decisions**: W1–W14 in plan3.md. D2 (fixture composition), D28 (setup project auth).

| Task                          | Files                                                                 | Tests                                                  | Status |
| ----------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ | ------ |
| G2: Fix proxy stub methods    | `proxy/dynamic-proxy.ts`                                              | Bridge round-trips for getBindingInfo, getDomRef, etc. | ⏳     |
| Wire orphaned browser scripts | `bridge/classic-adapter.ts`, `bridge/adapter.ts`                      | Object map lifecycle, selector extraction (R3)         | ⏳     |
| Core fixtures (worker + test) | `fixtures/core-fixtures.ts`                                           | Config, logger, tracer, compat, selectors, matchers    | ⏳     |
| Auth strategies (6)           | `auth/strategies/*.ts`, `auth/auth-factory.ts`, `auth/auth-checks.ts` | OnPrem, CloudSAML, Office365, API, Cert, MultiTenant   | ⏳     |
| Stability fixtures            | `fixtures/stability-fixtures.ts`                                      | WalkMe/analytics interception, auto UI5 stability      | ⏳     |
| Auth handler + setup project  | `auth/auth-handler.ts`, `auth/auth.setup.ts`, `auth/auth.teardown.ts` | D28 pattern: storageState, retry, session management   | ⏳     |
| Auth fixtures                 | `fixtures/auth-fixtures.ts`                                           | sapAuth fixture with fixture options                   | ⏳     |
| Navigation module             | `modules/navigation.ts`                                               | Tile, intent, hash, search, back/forward               | ⏳     |
| Navigation fixtures           | `fixtures/nav-fixtures.ts`                                            | Step-decorated nav API, WorkZone stub                  | ⏳     |
| WorkZone module               | `modules/workzone.ts`                                                 | Dual-frame bridge injection, context switching (G6)    | ⏳     |
| Fixture assembly              | `fixtures/index.ts`                                                   | `mergeTests()` chain → single `test` + `expect` export | ⏳     |
| Phase 1 infra wiring (R2)     | All fixture + auth + nav files                                        | 8/8 unconsumed modules consumed in fixture lifecycle   | ⏳     |

### Phase 4 — Modules + Table + FE (Weeks 13–15)

> **Prerequisites from Phase 2 Review** (2026-02-17):
>
> WebComponentAdapter is a stub (Phase 2). Full `@ui5/webcomponents` support needed here
> for hybrid apps that mix classic UI5 controls with Web Components.
> `registry` discovery strategy is a no-op placeholder — implement or remove.
> All modules consume the proxy layer (discoverControl → proxy → adapter).

| Task                            | Files                                    | Tests                                         | Notes                                             |
| ------------------------------- | ---------------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| WebComponentAdapter full impl   | `bridge/webcomponent-adapter.ts`         | Shadow DOM traversal, `@ui5/webcomponents`    | Upgrade Phase 2 stub to real adapter              |
| HybridAdapter element detection | `bridge/hybrid-adapter.ts`               | Per-element classic vs WC routing             | Phase 2 delegates all to classic; add real detect |
| Registry discovery strategy     | `proxy/discovery.ts`                     | `registry` strategy implementation or removal | Currently a no-op (Phase 3+ placeholder)          |
| Table operations                | `modules/table.ts`                       | Get rows, cells, filter, sort, pagination     | Uses proxy + `getControlAggregation`              |
| Assertions                      | `modules/assertion.ts`                   | UI5-specific assertions                       | Wraps raw matchers from Phase 1                   |
| Element operations              | `modules/element.ts`                     | Existence, visibility, properties             | —                                                 |
| Control operations              | `modules/control.ts`                     | Properties, aggregations, bindings            | —                                                 |
| Date handling                   | `modules/date.ts`                        | Date picker, time picker                      | —                                                 |
| Dialog helpers                  | `modules/dialog.ts`                      | Dialog/popover interactions                   | —                                                 |
| OData handler                   | `modules/odata.ts`                       | CRUD with optional Zod schema                 | —                                                 |
| Fiori Elements                  | `fe/list-report.ts`, `fe/object-page.ts` | FE test library                               | —                                                 |

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

**Current Metrics** (verified `npm run test:unit -- --coverage`):

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

#### R2. Phase 1 Consumption in Phase 2 — PARTIAL (by design)

| Phase 1 Module                  | Consumed by Phase 2?                                   | Deferred To |
| ------------------------------- | ------------------------------------------------------ | ----------- |
| `core/errors/*`                 | YES — ControlError, BridgeError used in bridge + proxy | —           |
| `core/utils/version-compare`    | YES — used in `bridge/api-resolver.ts`                 | —           |
| `selectors/selector-parser`     | YES — `serializeUI5Selector` used in `proxy/cache.ts`  | —           |
| `core/config/schema`            | YES — types used across bridge + proxy                 | —           |
| `core/logging`                  | NO — exported but not used internally                  | Phase 3     |
| `core/telemetry`                | NO — exported but not used internally                  | Phase 3     |
| `core/utils/retry`              | NO — exported but not used internally                  | Phase 3     |
| `core/utils/step-decorator`     | NO — not even in main barrel                           | Phase 3     |
| `core/utils/wait-helpers`       | NO — exported at top level only                        | Phase 3     |
| `core/compat/playwright-compat` | NO — exported but not used internally                  | Phase 3     |
| `selectors/ui5-selector-engine` | NO — exported, awaiting fixture registration           | Phase 3     |
| `matchers/*`                    | NO — exported, awaiting `expect.extend()`              | Phase 3     |

**Action**: Phase 3 must wire all 8 unconsumed modules into fixtures.

#### R3. Orphaned Source Files — 2 FOUND

| File                                     | Status                                                        | Resolution                                                 |
| ---------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| `bridge/browser-scripts/object-map.ts`   | Tested but not imported by any src file, not in bridge barrel | Phase 3: wire into classic-adapter or fixture lifecycle    |
| `bridge/browser-scripts/get-selector.ts` | Tested but not imported by any src file, not in bridge barrel | Phase 3: wire into adapter for reverse selector extraction |

#### R4. Features Already Implemented for Future Phases

| Feature                           | Planned Phase | Actual Status     | Evidence                                           |
| --------------------------------- | ------------- | ----------------- | -------------------------------------------------- |
| D22 auto-gen typed proxies        | Phase 6       | ✅ Phase 1        | `scripts/generate-typed-proxies.ts` (1,266 LOC)    |
| Capability generator              | Unplanned     | ✅ Done           | `scripts/generate-capabilities.ts` (430 LOC)       |
| IDE setup wizard                  | Unplanned     | ✅ Done           | `scripts/setup-ide.ts` (150 LOC)                   |
| Bridge smoke tests (INT1 partial) | Phase 2 INT1  | Partially written | `tests/integration/bridge-smoke.spec.ts` (165 LOC) |

#### R5. Deferred Items Tracking

| Item                             | Original Phase  | Deferred To | GitHub Issue |
| -------------------------------- | --------------- | ----------- | ------------ |
| INT1 bridge integration smoke    | Phase 2         | Phase 7     | #7 (parent)  |
| INT2 proxy + SAP cloud smoke     | Phase 2         | Phase 7     | #7 (parent)  |
| G2 proxy stub methods            | Phase 2         | Phase 3     | #22          |
| WebComponentAdapter full support | Phase 2 (stub)  | Phase 4     | —            |
| `registry` discovery strategy    | Phase 2 (no-op) | Phase 4     | —            |
| CSP compliance                   | Phase 2         | Phase 7     | —            |

#### R6. Duplicate Scope — NONE CRITICAL

| Check                           | Result                                                              |
| ------------------------------- | ------------------------------------------------------------------- |
| D22 listed in Phase 6?          | Resolved — note at line 1109 acknowledges pull-forward              |
| Typed proxies in Phase 2?       | Resolved — marked N/A, replaced by auto-gen                         |
| INT1/INT2 in Phase 7 task list? | **Fixed** — explicitly added to Phase 7 table                       |
| Matchers Phase 1 vs Phase 3     | By design — raw functions (P1) wired into fixtures (P3)             |
| Error classes in later phases   | None planned — all 10 subclasses created in Phase 1                 |
| Config schema extensions        | By design — Zod schema is extensible, Phase 2 added strategy fields |

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

_End of Document — Praman v1.0 Architecture & Rebuild Plan v2.0.0 Enhanced — Post-Proxy Deep Analysis_
