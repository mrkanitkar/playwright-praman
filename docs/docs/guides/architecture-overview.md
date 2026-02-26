---
sidebar_position: 21
title: 'Architecture Overview'
---

# Architecture Overview

Praman v1.0 is a ground-up rebuild of the SAP UI5 test automation plugin for Playwright. It ships as a single npm package (`playwright-praman`) with sub-path exports, organized into a strict 5-layer architecture.

## 5-Layer Architecture

```
+---------------------------------------------------------------------+
|                     Test Author / AI Agent                           |
|  import { test, expect } from 'playwright-praman';                  |
|  import { procurement } from 'playwright-praman/intents';           |
+-----------------------------------+---------------------------------+
                                    |
+-----------------------------------v---------------------------------+
|  Layer 5: AI & Intent API                                           |
|  Sub-path exports:                                                  |
|  playwright-praman/ai, /intents, /vocabulary, /fe, /reporters       |
+---------------------------------------------------------------------+
|  Layer 4: Fixtures + Auth + Navigation                              |
|  core-fixtures | auth-fixtures | nav-fixtures | stability-fixtures  |
|  UI5Handler (16 methods) | Auth Handler (6 strategies)              |
|  Shell Handler | Footer Handler | WorkZone module                   |
+---------------------------------------------------------------------+
|  Layer 3: Control Proxy + UI5Object                                 |
|  control-proxy.ts (unified proxy handler)                           |
|  ui5-object.ts | UI5ObjectCache (TTL + LRU)                        |
|  discovery.ts (3-tier: cache -> ID -> RecordReplay)                 |
+---------------------------------------------------------------------+
|  Layer 2: Bridge + Browser Scripts                                  |
|  injection.ts (lazy bridge injection)                               |
|  browser-scripts/ (inject-ui5, find-control, execute-method, etc.)  |
|  Interaction Strategies: UI5Native, DomFirst, Opa5                  |
+---------------------------------------------------------------------+
|  Layer 1: Core Infrastructure                                       |
|  Config (Zod) | Errors (13 subclasses) | Logger (pino)              |
|  Telemetry (OTel) | Types (199 typed interfaces) | Compat (PW ver) |
+---------------------------------------------------------------------+
|  Layer 0: Playwright Test Runner                                    |
|  @playwright/test (page, browser, context, expect)                  |
+---------------------------------------------------------------------+
```

## Layer Dependency Rules

The architecture enforces a strict **downward-only dependency rule**:

- Lower layers NEVER import from higher layers.
- Layer 1 (Core) has zero internal dependencies beyond Node.js builtins.
- Layer 2 (Bridge) imports only from Layer 1.
- Layer 3 (Proxy) imports from Layers 1 and 2.
- Layer 4 (Fixtures) imports from Layers 1, 2, and 3.
- Layer 5 (AI/Intents) imports from Layers 1-4.

This is enforced at compile time via TypeScript path aliases (`#core/*`, `#bridge/*`, `#proxy/*`, `#fixtures/*`) and ESLint import rules.

:::info[Internal Source Code]
The path aliases below (`#core/*`, `#bridge/*`, `#proxy/*`) are internal to Praman's source code and are not available to end users. They enforce layer boundaries during development.
:::

```typescript
// Allowed: Layer 3 imports from Layer 1
import { ErrorCode } from '#core/errors/codes.js';

// Allowed: Layer 3 imports from Layer 2
import { ensureBridgeInjected } from '#bridge/injection.js';

// FORBIDDEN: Layer 1 importing from Layer 3
// import { ControlProxy } from '#proxy/control-proxy.js'; // compile error
```

## Sub-Path Exports

Praman ships 6 sub-path exports, each targeting a specific concern:

| Sub-Path Export                | Purpose                     | Key Modules                                        |
| ------------------------------ | --------------------------- | -------------------------------------------------- |
| `playwright-praman`            | Core fixtures, expect, test | Fixtures, selectors, matchers                      |
| `playwright-praman/ai`         | AI agent integration        | CapabilityRegistry, RecipeRegistry, AgenticHandler |
| `playwright-praman/intents`    | SAP domain intent APIs      | Core wrappers, 5 domain namespaces                 |
| `playwright-praman/vocabulary` | Business term resolution    | VocabularyService, fuzzy matcher                   |
| `playwright-praman/fe`         | Fiori Elements helpers      | ListReport, ObjectPage, FE tables                  |
| `playwright-praman/reporters`  | Custom Playwright reporters | ComplianceReporter, ODataTraceReporter             |

Each export provides both ESM and CJS outputs:

```json
{
  "./ai": {
    "types": {
      "import": "./dist/ai/index.d.ts",
      "require": "./dist/ai/index.d.cts"
    },
    "import": "./dist/ai/index.js",
    "require": "./dist/ai/index.cjs"
  }
}
```

All exports are validated by `@arethetypeswrong/cli` (attw) in CI.

## Design Decisions Summary (D1-D29)

The architecture is guided by 29 documented design decisions:

| #   | Decision                                                                 | Category      |
| --- | ------------------------------------------------------------------------ | ------------- |
| D1  | Single package with sub-path exports (not monorepo)                      | Packaging     |
| D2  | Internal fixture composition via `extend()` chain                        | Fixtures      |
| D3  | ~~Version-negotiated bridge adapters~~ (REMOVED Phase 3)                 | Bridge        |
| D4  | Hybrid typed proxy: 199 typed interfaces + dynamic fallback              | Proxy         |
| D5  | 4-layer observability: Reporter + pino + OTel + AI telemetry             | Observability |
| D6  | Zod validation at external boundaries only                               | Validation    |
| D7  | Zod-validated `praman.config.ts` with env overrides                      | Config        |
| D8  | Unified `PramanError` hierarchy with 13 subclasses                       | Errors        |
| D9  | AI Mode A (SKILL.md) + Mode C (agentic fixture)                          | AI            |
| D10 | Vitest unit tests + Playwright integration tests                         | Testing       |
| D11 | No plugin API in v1.0                                                    | Extension     |
| D12 | Auto-generated SKILL.md + Docusaurus + TypeDoc                           | Docs          |
| D13 | Apache 2.0 license                                                       | Legal         |
| D14 | Playwright `>=1.50.0 <2.0.0` with CI matrix                              | Compat        |
| D15 | Security: dep scanning, secret redaction, SBOM, provenance               | Security      |
| D16 | Single unified proxy (no double-proxy)                                   | Proxy         |
| D17 | Bidirectional proxy conversion (`UI5Object` &lt;-&gt; `UI5ControlProxy`) | Proxy         |
| D18 | Integrated discovery factory (removed dead code)                         | Discovery     |
| D19 | Centralized `__praman_getById()` (3-tier API resolution)                 | Bridge        |
| D20 | Browser objectMap with TTL + cleanup                                     | Memory        |
| D21 | Shared interaction logic across strategies                               | Interactions  |
| D22 | Auto-generated method signatures (199 interfaces, 4,092 methods)         | Types         |
| D23 | `skipStabilityWait` as global config + per-selector override             | Stability     |
| D24 | `exec()` with `new Function()` + security documentation                  | Security      |
| D25 | Visibility preference default (prefer visible controls)                  | Discovery     |
| D26 | UI5Object AI introspection as first-class capability                     | AI            |
| D27 | Module size &lt;= 300 LOC guideline (with documented exceptions)         | Quality       |
| D28 | Auth via Playwright project dependencies (not globalSetup)               | Auth          |
| D29 | Enhanced error model + AI response envelope                              | AI/Errors     |

## Module Decomposition Rationale

The predecessor (dhikraft v2.5.0) suffered from monolithic files:

| File                   | LOC   | Problem                                  |
| ---------------------- | ----- | ---------------------------------------- |
| `ui5-handler.ts`       | 2,318 | God object handling all UI5 operations   |
| `dhikraft-fixtures.ts` | 2,263 | All 32 fixtures in one file              |
| `ui5-control-proxy.ts` | 1,829 | Double-proxy with redundant interception |

Praman v1.0 decomposes these into focused modules following SRP (Single Responsibility Principle):

**Fixtures** are split by domain:

- `core-fixtures.ts` -- UI5 control operations
- `auth-fixtures.ts` -- Authentication strategies
- `nav-fixtures.ts` -- Navigation and routing
- `stability-fixtures.ts` -- Wait conditions and stability checks
- `ai-fixtures.ts` -- AI agent fixtures
- `fe-fixtures.ts` -- Fiori Elements fixtures
- `intent-fixtures.ts` -- Intent API fixtures

**UI5Handler** was decomposed from a 2,318 LOC god object into:

- `ui5-handler.ts` (588 LOC) -- 16 core methods
- `shell-handler.ts` (102 LOC) -- FLP shell operations
- `footer-handler.ts` (119 LOC) -- Footer bar operations
- Navigation module (201 LOC) -- Route and hash navigation

**Control proxy** was simplified from a double-proxy pattern (1,829 LOC) into:

- `control-proxy.ts` (653 LOC) -- Unified single proxy handler
- `ui5-object.ts` (383 LOC) -- Non-control object proxy
- `discovery.ts` (111 LOC) -- 3-tier control discovery
- `cache.ts` (104 LOC) -- Proxy cache with RegExp keys

Every module targets &lt;= 300 LOC. Exceptions are documented with justification comments.

## Codebase Metrics

| Metric                   | Value                       |
| ------------------------ | --------------------------- |
| Source files             | 182                         |
| Source LOC               | ~29,000                     |
| Public functions         | 208                         |
| Test files               | 109                         |
| Unit tests               | ~2,000 passing              |
| Typed control interfaces | 199 (4,092 methods)         |
| Error subclasses         | 13                          |
| Coverage                 | >98% (per-file enforcement) |
| Lint errors              | 0                           |
| Type errors              | 0                           |
| ESM + CJS dual build     | Validated by attw           |
