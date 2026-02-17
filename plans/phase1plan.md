# Phase 1 — Core Infrastructure: Detailed Implementation Plan

> **Version**: 1.5.0
> **Status**: ✅ COMPLETE — 2026-02-16 | 511 tests, 40 test files, 36 source files, 12 barrels, 98.92% stmt coverage
> **Parent**: plan.md v2.1.0 (Phase 0 COMPLETE)
> **Duration**: 3 weeks (3 sub-phases)
> **Approach**: TDD (tests first)
> **Predecessor**: Phase 0 scaffold (npm v1.0.1, 22 empty barrel modules)

---

## Table of Contents

1. [Decision Log (Wizard Answers)](#1-decision-log-wizard-answers)
2. [Sub-Phase Breakdown](#2-sub-phase-breakdown)
3. [Dependency Graph](#3-dependency-graph)
4. [Design Flow](#4-design-flow)
5. [Sub-Phase 1.1 — Foundation (Types + Config + Errors)](#5-sub-phase-11--foundation)
6. [Sub-Phase 1.2 — Infrastructure (Logging + OTel + Compat + Utils)](#6-sub-phase-12--infrastructure)
7. [Sub-Phase 1.3 — Playwright Integration (Selectors + Matchers + BridgeAdapter Interface)](#7-sub-phase-13--playwright-integration)
8. [Complete File Inventory](#8-complete-file-inventory)
9. [Test Plan](#9-test-plan)
10. [Impact Analysis](#10-impact-analysis)
11. [Quality Gates Per Sub-Phase](#11-quality-gates-per-sub-phase)
12. [Risk Register](#12-risk-register)
13. [Barrel File Updates](#13-barrel-file-updates)
14. [Main Entry Point Updates](#14-main-entry-point-updates)
15. [API References](#15-api-references)
16. [Implementation Batching (AI Agent Response Limits)](#16-implementation-batching-ai-agent-response-limits)
17. [Review Findings](#17-review-findings)

---

## 1. Decision Log (Wizard Answers)

These decisions were made during the planning wizard and are **binding** for Phase 1 implementation.

| #   | Question                | Decision                            | Rationale                                                                                                                           |
| --- | ----------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Phase 1 scope           | All 9 modules                       | Config, Errors, Logging, OTel, Compat, Types, Utils, Selectors, Matchers — full Phase 1 per plan.md                                 |
| W2  | Config format           | TypeScript + JSON + env overrides   | `praman.config.ts` (primary) + `praman.config.json` (fallback for CI). `PRAMAN_*` env vars override specific fields.                |
| W3  | Error classes           | All 10 upfront                      | Full hierarchy from day 1. All unit-testable without external dependencies. Consistent error codes across all phases.               |
| W4  | Selector engine         | Parser + Playwright registration    | Full end-to-end: parse `ui5=controlType:sap.m.Button#id[prop=val]` + register with `playwright.selectors.register()`.               |
| W5  | Matcher design          | Interface + mock bridge             | Define `BridgeAdapter` interface. Matchers call the interface. Tests use mock adapter. Real bridge plugged in Phase 2.              |
| W6  | OTel depth              | Full span helpers                   | Lazy SDK loading + span creation/nesting + decorators. Zero-overhead when OTel packages not installed.                              |
| W7  | Compat scope            | Version detect + API normalization  | Detect Playwright version at runtime. Normalize known API differences. Typed helpers abstract version-specific calls.               |
| W8  | Retry strategy          | Playwright-native + UI5 stability   | Lean on Playwright auto-wait. Build: `waitForUI5Stable()` via `page.waitForFunction()` + lightweight `retry()` for non-PW async.    |
| W9  | BridgeAdapter interface | Define in Phase 1 (types only)      | Full interface in `src/bridge/adapter.ts`. No implementation. Matchers and selectors code against the interface.                    |
| W10 | Development approach    | TDD (tests first)                   | Write tests defining expected behavior, then implement to pass. Guarantees coverage from start.                                     |
| W11 | Sub-phases              | 3 sub-phases with milestones        | P1.1 Foundation → P1.2 Infrastructure → P1.3 Playwright Integration. Each has a CI gate.                                            |
| W12 | Control types           | Full type catalog (all 20 controls) | Define all 20 control type interfaces as type-only files. IDE autocompletion from day 1. Phase 2 implements proxy handlers.         |
| W13 | Config fields           | Full schema, optional later fields  | Complete `PramanConfigSchema` with ALL fields. Later-phase fields optional with defaults. No breaking changes when Phase 2+ begins. |

---

## 2. Sub-Phase Breakdown

```text
Phase 1.1 — Foundation (Week 1)
├── core/types/     → Canonical type definitions (20 controls, config, selectors)
├── core/config/    → Zod schema + loader (TS + JSON + env)
├── core/errors/    → PramanError base + 10 subclasses + error codes
└── Milestone: npm run ci passes, 100% coverage on errors

Phase 1.2 — Infrastructure (Week 2)
├── core/logging/   → pino logger factory + secret redaction
├── core/telemetry/ → OTel init + span helpers + decorators
├── core/compat/    → Playwright version detect + API normalization
├── core/utils/     → waitForUI5Stable, retry, step-decorator, version-compare
└── Milestone: npm run ci passes, all core/ modules covered

Phase 1.3 — Playwright Integration (Week 3)
├── bridge/adapter.ts        → BridgeAdapter interface (types only)
├── selectors/               → UI5 selector parser + Playwright registration
├── matchers/                → Custom expect matchers (web-first, auto-retry)
└── Milestone: npm run ci passes, full Phase 1 complete
```

---

## 3. Dependency Graph

```text
                    ┌──────────────┐
                    │ core/types/  │  ← NO dependencies (pure type definitions)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
      ┌───────▼──────┐  ┌─▼──────────┐ │
      │ core/config/ │  │core/errors/ │ │
      │  (uses Zod)  │  │ (uses types)│ │
      └───────┬──────┘  └─────┬───────┘ │
              │               │          │
              ├───────┬───────┤          │
              │       │       │          │
     ┌────────▼──┐ ┌──▼──────▼──┐ ┌─────▼──────────┐
     │core/      │ │core/       │ │core/compat/     │
     │logging/   │ │telemetry/  │ │(PW version +    │
     │(needs cfg)│ │(needs cfg) │ │ path-helpers)   │
     └────────┬──┘ └──┬────────┘ └─────┬───────────┘
              │       │                │
              └───────┼────────────────┘
                      │
              ┌───────▼───────┐
              │  core/utils/  │  ← uses config, errors, logging, compat
              └───────┬───────┘
                      │
         ┌────────────┼────────────────┐
         │            │                │
  ┌──────▼──────┐ ┌───▼──────────┐ ┌──▼──────────────┐
  │bridge/      │ │selectors/    │ │matchers/         │
  │adapter.ts   │ │(parser +     │ │(web-first        │
  │(interface   │ │ registration)│ │ expect.extend()) │
  │ only)       │ └──────────────┘ └──────────────────┘
  └─────────────┘
```

**Dependency Rules (Enforced)**:

- `core/types/` → imports NOTHING from project (only `zod` for schema types). Does NOT re-export from `core/config/`.
- `core/config/` → imports from `core/types/` only. Exports `PramanConfig` (Zod-derived) directly.
- `core/errors/` → imports from `core/types/` only
- `core/logging/` → imports from `core/config/`, `core/types/`
- `core/telemetry/` → imports from `core/config/`, `core/types/`, `core/logging/`
- `core/compat/` → imports from `core/types/`, `core/errors/base.js`, `core/utils/version-compare.js` (+ `@playwright/test` as peer)
- `core/utils/` → imports from `core/config/`, `core/errors/`, `core/logging/`, `core/compat/`, `core/types/`
- `bridge/adapter.ts` → imports from `core/types/` only (interface definition)
- `selectors/` → imports from `core/types/`, `core/errors/`, `core/config/`
- `matchers/` → imports from `core/types/`, `core/errors/`, `bridge/adapter.ts` (interface only)

---

## 4. Design Flow

### 4.1 Config Loading Flow

```text
User writes praman.config.ts (or .json)
         │
         ▼
┌─────────────────────────────┐
│  loadConfig(options?)       │
│  ├─ 1. Resolve config file  │
│  │   ├─ CLI --config flag   │
│  │   ├─ praman.config.ts    │  ← dynamic import() for TS
│  │   ├─ praman.config.json  │  ← JSON.parse() for JSON
│  │   └─ {} (empty default)  │
│  │                          │
│  ├─ 2. Apply env overrides  │
│  │   ├─ PRAMAN_LOG_LEVEL    │
│  │   ├─ PRAMAN_*            │
│  │   └─ SAP_* (auth only)   │
│  │                          │
│  ├─ 3. Validate with Zod    │
│  │   ├─ PramanConfigSchema  │
│  │   │   .safeParse(merged) │
│  │   ├─ success → freeze    │
│  │   └─ failure → ConfigError│
│  │       with Zod issues    │
│  │                          │
│  └─ 4. Return Readonly<     │
│       PramanConfig>         │
└─────────────────────────────┘
         │
         ▼
  Frozen, immutable config object
  used by all modules via DI
```

### 4.2 Error Creation Flow

```text
Module detects error condition
         │
         ▼
┌──────────────────────────────────────┐
│  throw new ControlError({            │
│    code: 'ERR_CONTROL_NOT_FOUND',    │  ← from ErrorCode enum
│    message: 'Control not found',     │
│    attempted: 'Find by ID: myBtn',   │  ← what was tried
│    retryable: true,                  │  ← SRE: can caller retry?
│    details: { selector, timeout },   │  ← structured context
│    suggestions: [                    │  ← AI/human recovery hints
│      'Check control ID exists',      │
│      'Wait for page load',           │
│    ],                                │
│  })                                  │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  PramanError (base class)            │
│  ├─ extends Error                    │
│  ├─ readonly code: ErrorCode         │
│  ├─ readonly attempted: string       │
│  ├─ readonly retryable: boolean      │
│  ├─ readonly details: Record<...>    │
│  ├─ readonly suggestions: string[]   │
│  ├─ readonly timestamp: string       │
│  ├─ toJSON(): SerializedError        │  ← structured serialization
│  └─ toUserMessage(): string          │  ← human-friendly format
└──────────────────────────────────────┘
```

### 4.3 Logger Flow

```text
Module needs logging
         │
         ▼
┌──────────────────────────────────────┐
│  import { createLogger }             │
│    from '#core/logging/logger.js';   │
│                                      │
│  const log = createLogger('config'); │
│  // Creates pino child logger with:  │
│  //   { module: 'config' }           │
│  //   Inherits level from config     │
│  //   Inherits redaction paths       │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Root pino instance (singleton)      │
│  ├─ level: from PramanConfig         │
│  ├─ transport: pino-pretty (dev)     │
│  │            raw JSON (prod/CI)     │
│  ├─ redact:                          │
│  │   ├─ '*.password'                 │
│  │   ├─ '*.token'                    │
│  │   ├─ '*.apiKey'                   │
│  │   ├─ '*.secret'                   │
│  │   ├─ '*.authorization'            │
│  │   └─ '*.cookie'                   │
│  └─ formatters:                      │
│      ├─ level: (label) => label      │
│      └─ bindings: (bindings) => ...  │
└──────────────────────────────────────┘
```

### 4.4 OpenTelemetry Flow

```text
Application startup
         │
         ▼
┌──────────────────────────────────────┐
│  initTelemetry(config)               │
│  ├─ 1. Check config.telemetry.       │
│  │      openTelemetry === true       │
│  │   └─ false? → return NoOpTracer   │
│  │                                   │
│  ├─ 2. Lazy import @opentelemetry/*  │
│  │   ├─ try dynamic import()         │
│  │   ├─ success → create real SDK    │
│  │   └─ not installed? → NoOpTracer  │
│  │       + warn log                  │
│  │                                   │
│  ├─ 3. Configure exporter            │
│  │   ├─ 'otlp' → OTLPTraceExporter  │
│  │   ├─ 'jaeger' → JaegerExporter   │
│  │   └─ 'azure-monitor' → Azure     │
│  │                                   │
│  └─ 4. Return TracerWrapper          │
│      ├─ startSpan(name, attrs)       │
│      ├─ withSpan(name, fn)           │  ← wraps fn in span
│      ├─ recordException(span, err)   │
│      └─ shutdown()                   │
└──────────────────────────────────────┘
```

### 4.5 Selector Engine Flow

```text
Test code: page.locator('ui5=sap.m.Button#saveBtn[text=Save]')
         │
         ▼
┌──────────────────────────────────────┐
│  Playwright calls registered engine  │
│  ui5SelectorEngine.query(root, sel)  │
│         │                            │
│         ▼                            │
│  ┌─ parseUI5Selector(sel) ──────┐   │
│  │  Input: "sap.m.Button#saveBtn│   │
│  │         [text=Save]"          │   │
│  │                               │   │
│  │  Output: UI5Selector {        │   │
│  │    controlType: 'sap.m.Button'│   │
│  │    id: 'saveBtn',             │   │
│  │    properties: {text: 'Save'},│   │
│  │    viewName?: string,         │   │
│  │    interaction?: {...}        │   │
│  │  }                            │   │
│  └───────────────────────────────┘   │
│         │                            │
│         ▼                            │
│  ┌─ query(root, parsed) ────────┐   │
│  │  Phase 1: DOM fallback via    │   │
│  │    root.querySelector() with  │   │
│  │    [data-sap-ui] attributes   │   │
│  │  Phase 2+: calls BridgeAdapter│   │
│  │    to resolve via UI5 registry│   │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### 4.6 Custom Matcher Flow

**Critical Playwright constraint**: Custom matchers added via `expect.extend()` are
**NOT** automatically retried by Playwright. Only built-in matchers (`toBeVisible`,
`toHaveText`, etc.) auto-retry. Custom matchers must explicitly implement retry using
`expect(async () => {...}).toPass({ timeout })` — the Playwright-recommended pattern
for web-first custom assertions.

**Note**: `toPass()` timeout defaults to **0** (no retry). Matchers MUST pass an
explicit timeout, typically from the user-provided `options.timeout` or the config default.

```text
Test code: await expect(control).toHaveUI5Text('Saved')
         │
         ▼
┌──────────────────────────────────────┐
│  toHaveUI5Text(locator, expected)    │
│  ├─ 1. Get BridgeAdapter instance    │
│  │      (from module-level store)    │
│  │                                   │
│  ├─ 2. Wrap assertion in toPass()    │
│  │   await expect(async () => {      │
│  │     const actual = await adapter  │
│  │       .getControlProperty(        │
│  │         locator, 'text');         │
│  │     expect(actual).toBe(expected);│
│  │   }).toPass({                     │
│  │     timeout: options?.timeout     │
│  │       ?? DEFAULT_TIMEOUTS         │
│  │           .CONTROL_DISCOVERY,     │
│  │     intervals: [100, 250, 500,    │
│  │       1000],                      │
│  │   });                             │
│  │                                   │
│  ├─ 3. On success → { pass: true }   │
│  │   On timeout → { pass: false,     │
│  │     message: diff, actual,        │
│  │     expected }                    │
│  │                                   │
│  └─ 4. toPass() handles the retry    │
│         loop (NOT Playwright core)   │
└──────────────────────────────────────┘

Key: Matchers are STATELESS functions.
     toPass() handles the retry loop (explicit, not automatic).
     BridgeAdapter is injected (mock in Phase 1 tests).
     toPass() timeout defaults to 0 — always pass explicit timeout.
```

### 4.7 Playwright Compat Flow

```text
Module needs Playwright API
         │
         ▼
┌──────────────────────────────────────┐
│  import { getPlaywrightVersion,      │
│    hasFeature, assertMinVersion }    │
│    from '#core/compat/               │
│          playwright-compat.js';      │
│                                      │
│  ┌─ getPlaywrightVersion() ───────┐ │
│  │  1. import('@playwright/test')  │ │
│  │  2. Read package.json version   │ │
│  │  3. Parse semver                │ │
│  │  4. Return { major, minor,      │ │
│  │     patch, raw }                │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌─ hasFeature(feature) ──────────┐ │
│  │  Returns boolean for feature    │ │
│  │  availability by version        │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## 5. Sub-Phase 1.1 — Foundation

**Scope**: Types + Config + Errors
**Gate**: `npm run ci` passes. 100% coverage on `core/errors/`. All types compile.

### 5.1 Module: core/types/

Canonical type definitions used across all layers. **Type-only files — no runtime code except Zod schemas.**

#### 5.1.1 File: `src/core/types/config.ts`

**Purpose**: TypeScript types for the validated config object. Literal union types are
defined here (no Zod dependency). The `PramanConfig` type is derived from the Zod
schema in `core/config/schema.ts` via `z.output<>` — **single source of truth**.

**Design Decision**: Literal union types (`LogLevel`, `AuthStrategy`, etc.) are defined
in this file and imported by both the Zod schema and consumers. This avoids duplicating
string literals while keeping `core/types/` free of Zod imports.

```typescript
// ── Literal union types (no Zod dependency) ──────────────────────
// These are imported by core/config/schema.ts to build the Zod schema.
// Consumers import them from here for type annotations.

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';

export type InteractionStrategy = 'playwright' | 'dom-first' | 'opa5' | 'hybrid';

export type AuthStrategy = 'btp-saml' | 'basic' | 'office365' | 'custom';

export type AIProvider = 'azure-openai' | 'openai';

export type TelemetryExporter = 'otlp' | 'azure-monitor' | 'jaeger';

// ── PramanConfig — derived from Zod schema (SINGLE SOURCE OF TRUTH) ─
// The actual PramanConfig type is generated by Zod's z.output<> in schema.ts.
// PramanConfig is exported from core/config/schema.js, NOT re-exported here.
// This avoids circular dependency: core/types/ → core/config/ → core/types/.
//
// Flow: config.ts (this file) defines literal unions (LogLevel, AuthStrategy, etc.)
//       → schema.ts imports literal values from HERE → defines PramanConfigSchema
//       → schema.ts exports PramanConfig = z.output<typeof PramanConfigSchema>
//       → consumers import PramanConfig from '#core/config/schema.js' or '#core/config/index.js'
//
// DO NOT re-export PramanConfig from this file — that creates a circular dependency.

// ── Sub-config access ────────────────────────────────────────────────
// There are NO separate AuthConfig/AIConfig/TelemetryConfig types.
// Use indexed access: PramanConfig['auth'], PramanConfig['ai'], etc.
```

**Estimated LOC**: ~40
**Tests**: Type-check only (no runtime code)

> **Important**: `PramanConfig` is NOT manually maintained as an interface.
> It is `z.output<typeof PramanConfigSchema>` — any schema change automatically
> updates the TypeScript type. Consumers import from `core/types/config.js`.

#### 5.1.2 File: `src/core/types/selectors.ts`

**Purpose**: Canonical `UI5Selector` definition — the ONE type used everywhere for selector representation.

```typescript
export interface UI5Selector {
  readonly controlType?: string; // e.g., 'sap.m.Button'
  readonly id?: string | RegExp; // control ID or pattern
  readonly viewName?: string; // owning view
  readonly viewId?: string; // view ID
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly bindingPath?: Readonly<Record<string, string>>;
  readonly i18NText?: Readonly<Record<string, string>>;
  readonly ancestor?: UI5Selector; // recursive ancestor match
  readonly descendant?: UI5Selector; // recursive descendant match
  readonly interaction?: UI5Interaction;
  readonly searchOpenDialogs?: boolean;
}

/**
 * Serializable selector for transport to browser context via page.evaluate().
 * RegExp is NOT JSON-serializable — serialized as { source, flags } object.
 * Used by selector engine's browser-side query() method.
 */
export interface SerializedUI5Selector {
  readonly controlType?: string;
  readonly id?: string | { readonly source: string; readonly flags: string };
  readonly viewName?: string;
  readonly viewId?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
  readonly searchOpenDialogs?: boolean;
}

export function serializeSelectorForBrowser(selector: UI5Selector): SerializedUI5Selector;
export function deserializeRegExpId(
  id: string | { source: string; flags: string },
): string | RegExp;

export interface UI5Interaction {
  readonly idSuffix?: string;
  readonly domChildWith?: Readonly<Record<string, string>>;
}

// Selector string format: "ui5=sap.m.Button#id[prop=val]"
export type UI5SelectorString = `ui5=${string}`;
```

**Estimated LOC**: ~65 (includes SerializedUI5Selector + serialization helpers)
**Tests**: Type-check only + 2 serialization test cases (RegExp round-trip)

#### 5.1.3 File: `src/core/types/controls.ts`

**Purpose**: Base control types + full typed control catalog (60+ interfaces).

**LOC exception**: Type-only files are allowed up to 2000 LOC. This file is estimated
at ~1,850 LOC containing pure type definitions — no runtime code. Justified because:
splitting 60+ tightly related control interfaces across files creates circular import
risk and hurts IDE discoverability.

**Source**: Control list derived from dhikraft (142 controls, field-tested in production
SAP BTP systems) and wdi5 (50+ controls). Covers 95%+ of real SAP Fiori applications.

This file contains:

- `UI5ControlBase` — base interface all controls extend
- **60+ typed control interfaces** organized by UI5 library
- `UI5ControlMap` — discriminated union mapping controlType strings to interfaces
- `UI5PropertyMap` — property definitions per control type
- `InteractiveControlType` / `ContainerControlType` — string literal unions (from dhikraft constants)

```typescript
// ═══════════════════════════════════════════════════════════════════
// Base interface all UI5 controls share
// ═══════════════════════════════════════════════════════════════════

export interface UI5ControlBase {
  readonly controlType: string;
  readonly id: string;

  // Common methods (return types are Promises — resolved via bridge)
  getId(): Promise<string>;
  getControlType(): Promise<string>;
  getProperty(name: string): Promise<unknown>;
  setProperty(name: string, value: unknown): Promise<void>;
  getAggregation(name: string): Promise<readonly UI5ControlBase[]>;
  getBindingInfo(name: string): Promise<unknown>;
  getDomRef(): Promise<string | null>;
  isVisible(): Promise<boolean>;
  isEnabled(): Promise<boolean>;
  isBound(propertyName: string): Promise<boolean>;
  getModel(name?: string): Promise<unknown>;
  getView(): Promise<unknown>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.m — Mobile/Core Library (~89 controls)
// Source: dhikraft INTERACTIVE_CONTROL_TYPES + field-tested controls
// ═══════════════════════════════════════════════════════════════════

// ── Input Controls ──────────────────────────────────────────────
export interface UI5Button extends UI5ControlBase {
  readonly controlType: 'sap.m.Button';
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getIcon(): Promise<string>;
  getType(): Promise<string>;
  press(): Promise<void>;
}

export interface UI5Input extends UI5ControlBase {
  readonly controlType: 'sap.m.Input';
  getValue(): Promise<string>;
  getPlaceholder(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getEditable(): Promise<boolean>;
  getValueState(): Promise<string>;
  getValueStateText(): Promise<string>;
  getDescription(): Promise<string>;
  setValue(value: string): Promise<void>;
}

export interface UI5CheckBox extends UI5ControlBase {
  readonly controlType: 'sap.m.CheckBox';
  getSelected(): Promise<boolean>;
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setSelected(selected: boolean): Promise<void>;
}

export interface UI5RadioButton extends UI5ControlBase {
  readonly controlType: 'sap.m.RadioButton';
  getSelected(): Promise<boolean>;
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
}

export interface UI5ComboBox extends UI5ControlBase {
  readonly controlType: 'sap.m.ComboBox';
  getValue(): Promise<string>;
  getSelectedKey(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
  setSelectedKey(key: string): Promise<void>;
}

export interface UI5MultiComboBox extends UI5ControlBase {
  readonly controlType: 'sap.m.MultiComboBox';
  getSelectedKeys(): Promise<readonly string[]>;
  getEnabled(): Promise<boolean>;
  setSelectedKeys(keys: readonly string[]): Promise<void>;
}

export interface UI5Select extends UI5ControlBase {
  readonly controlType: 'sap.m.Select';
  getSelectedKey(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setSelectedKey(key: string): Promise<void>;
}

export interface UI5TextArea extends UI5ControlBase {
  readonly controlType: 'sap.m.TextArea';
  getValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getEditable(): Promise<boolean>;
  getRows(): Promise<number>;
  setValue(value: string): Promise<void>;
}

export interface UI5DatePicker extends UI5ControlBase {
  readonly controlType: 'sap.m.DatePicker';
  getValue(): Promise<string>;
  getDateValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

export interface UI5DateTimePicker extends UI5ControlBase {
  readonly controlType: 'sap.m.DateTimePicker';
  getValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

export interface UI5SearchField extends UI5ControlBase {
  readonly controlType: 'sap.m.SearchField';
  getValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

export interface UI5MultiInput extends UI5ControlBase {
  readonly controlType: 'sap.m.MultiInput';
  getValue(): Promise<string>;
  getTokens(): Promise<readonly UI5ControlBase[]>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

export interface UI5Switch extends UI5ControlBase {
  readonly controlType: 'sap.m.Switch';
  getState(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  setState(state: boolean): Promise<void>;
}

export interface UI5StepInput extends UI5ControlBase {
  readonly controlType: 'sap.m.StepInput';
  getValue(): Promise<number>;
  getMin(): Promise<number>;
  getMax(): Promise<number>;
  getEnabled(): Promise<boolean>;
  setValue(value: number): Promise<void>;
}

export interface UI5SegmentedButton extends UI5ControlBase {
  readonly controlType: 'sap.m.SegmentedButton';
  getSelectedKey(): Promise<string>;
  setSelectedKey(key: string): Promise<void>;
}

export interface UI5Slider extends UI5ControlBase {
  readonly controlType: 'sap.m.Slider';
  getValue(): Promise<number>;
  getMin(): Promise<number>;
  getMax(): Promise<number>;
  setValue(value: number): Promise<void>;
}

export interface UI5ToggleButton extends UI5ControlBase {
  readonly controlType: 'sap.m.ToggleButton';
  getPressed(): Promise<boolean>;
  getText(): Promise<string>;
  press(): Promise<void>;
}

export interface UI5MenuButton extends UI5ControlBase {
  readonly controlType: 'sap.m.MenuButton';
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
}

export interface UI5SplitButton extends UI5ControlBase {
  readonly controlType: 'sap.m.SplitButton';
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getIcon(): Promise<string>;
}

export interface UI5TimePicker extends UI5ControlBase {
  readonly controlType: 'sap.m.TimePicker';
  getValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

export interface UI5RangeSlider extends UI5ControlBase {
  readonly controlType: 'sap.m.RangeSlider';
  getValue(): Promise<number>;
  getValue2(): Promise<number>;
  getMin(): Promise<number>;
  getMax(): Promise<number>;
  setValue(value: number): Promise<void>;
  setValue2(value: number): Promise<void>;
}

export interface UI5Token extends UI5ControlBase {
  readonly controlType: 'sap.m.Token';
  getText(): Promise<string>;
  getKey(): Promise<string>;
  getEditable(): Promise<boolean>;
}

export interface UI5MaskInput extends UI5ControlBase {
  readonly controlType: 'sap.m.MaskInput';
  getValue(): Promise<string>;
  getMask(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

export interface UI5UploadSet extends UI5ControlBase {
  readonly controlType: 'sap.m.upload.UploadSet';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getInstantUpload(): Promise<boolean>;
}

// ── Display Controls ────────────────────────────────────────────
export interface UI5Text extends UI5ControlBase {
  readonly controlType: 'sap.m.Text';
  getText(): Promise<string>;
}

export interface UI5Label extends UI5ControlBase {
  readonly controlType: 'sap.m.Label';
  getText(): Promise<string>;
  getRequired(): Promise<boolean>;
}

export interface UI5Link extends UI5ControlBase {
  readonly controlType: 'sap.m.Link';
  getText(): Promise<string>;
  getHref(): Promise<string>;
  getEnabled(): Promise<boolean>;
  press(): Promise<void>;
}

export interface UI5Title extends UI5ControlBase {
  readonly controlType: 'sap.m.Title';
  getText(): Promise<string>;
  getLevel(): Promise<string>;
}

export interface UI5MessageStrip extends UI5ControlBase {
  readonly controlType: 'sap.m.MessageStrip';
  getText(): Promise<string>;
  getType(): Promise<string>;
  getShowIcon(): Promise<boolean>;
}

export interface UI5ObjectStatus extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectStatus';
  getText(): Promise<string>;
  getState(): Promise<string>;
  getTitle(): Promise<string>;
}

export interface UI5ObjectIdentifier extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectIdentifier';
  getTitle(): Promise<string>;
  getText(): Promise<string>;
}

export interface UI5ObjectHeader extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectHeader';
  getTitle(): Promise<string>;
  getNumber(): Promise<string>;
}

export interface UI5GenericTile extends UI5ControlBase {
  readonly controlType: 'sap.m.GenericTile';
  getHeader(): Promise<string>;
  getSubheader(): Promise<string>;
  getState(): Promise<string>;
  press(): Promise<void>;
}

export interface UI5ObjectAttribute extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectAttribute';
  getTitle(): Promise<string>;
  getText(): Promise<string>;
  getActive(): Promise<boolean>;
}

export interface UI5Image extends UI5ControlBase {
  readonly controlType: 'sap.m.Image';
  getSrc(): Promise<string>;
  getAlt(): Promise<string>;
  getWidth(): Promise<string>;
  getHeight(): Promise<string>;
}

export interface UI5Icon extends UI5ControlBase {
  readonly controlType: 'sap.m.Icon';
  getSrc(): Promise<string>;
  getColor(): Promise<string>;
  getSize(): Promise<string>;
  press(): Promise<void>;
}

export interface UI5ProgressIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.ProgressIndicator';
  getPercentValue(): Promise<number>;
  getDisplayValue(): Promise<string>;
  getState(): Promise<string>;
}

export interface UI5RatingIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.RatingIndicator';
  getValue(): Promise<number>;
  getMaxValue(): Promise<number>;
  getEnabled(): Promise<boolean>;
  setValue(value: number): Promise<void>;
}

export interface UI5BusyIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.BusyIndicator';
  getText(): Promise<string>;
  getSize(): Promise<string>;
}

export interface UI5Avatar extends UI5ControlBase {
  readonly controlType: 'sap.m.Avatar';
  getSrc(): Promise<string>;
  getInitials(): Promise<string>;
  getDisplaySize(): Promise<string>;
  press(): Promise<void>;
}

// ── Tile Controls ───────────────────────────────────────────────
export interface UI5StandardTile extends UI5ControlBase {
  readonly controlType: 'sap.m.StandardTile';
  getTitle(): Promise<string>;
  getInfo(): Promise<string>;
  getIcon(): Promise<string>;
  press(): Promise<void>;
}

export interface UI5CustomTile extends UI5ControlBase {
  readonly controlType: 'sap.m.CustomTile';
  getContent(): Promise<UI5ControlBase>;
  press(): Promise<void>;
}

// ── List/Table Controls ─────────────────────────────────────────
export interface UI5ListItemBase extends UI5ControlBase {
  readonly controlType: 'sap.m.ListItemBase';
  getType(): Promise<string>;
  getSelected(): Promise<boolean>;
  getHighlight(): Promise<string>;
}

export interface UI5List extends UI5ControlBase {
  readonly controlType: 'sap.m.List';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
  getHeaderText(): Promise<string>;
}

export interface UI5Table extends UI5ControlBase {
  readonly controlType: 'sap.m.Table';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
  getHeaderText(): Promise<string>;
}

export interface UI5StandardListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.StandardListItem';
  getTitle(): Promise<string>;
  getDescription(): Promise<string>;
  getInfo(): Promise<string>;
}

export interface UI5ColumnListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.ColumnListItem';
  getCells(): Promise<readonly UI5ControlBase[]>;
  getSelected(): Promise<boolean>;
}

export interface UI5CustomListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.CustomListItem';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getSelected(): Promise<boolean>;
}

export interface UI5InputListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.InputListItem';
  getLabel(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5ActionListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.ActionListItem';
  getText(): Promise<string>;
}

export interface UI5NotificationListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.NotificationListItem';
  getTitle(): Promise<string>;
  getDescription(): Promise<string>;
  getPriority(): Promise<string>;
  getUnread(): Promise<boolean>;
}

export interface UI5FeedListItemAction extends UI5ControlBase {
  readonly controlType: 'sap.m.FeedListItemAction';
  getText(): Promise<string>;
  getIcon(): Promise<string>;
  getKey(): Promise<string>;
}

export interface UI5Tree extends UI5ControlBase {
  readonly controlType: 'sap.m.Tree';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

// ── Dialog/Overlay Controls ─────────────────────────────────────
export interface UI5Dialog extends UI5ControlBase {
  readonly controlType: 'sap.m.Dialog';
  getTitle(): Promise<string>;
  getState(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getButtons(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5Popover extends UI5ControlBase {
  readonly controlType: 'sap.m.Popover';
  getTitle(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5ResponsivePopover extends UI5ControlBase {
  readonly controlType: 'sap.m.ResponsivePopover';
  getTitle(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5MessagePopover extends UI5ControlBase {
  readonly controlType: 'sap.m.MessagePopover';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5ActionSheet extends UI5ControlBase {
  readonly controlType: 'sap.m.ActionSheet';
  getTitle(): Promise<string>;
  getButtons(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5QuickView extends UI5ControlBase {
  readonly controlType: 'sap.m.QuickView';
  getPages(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5BusyDialog extends UI5ControlBase {
  readonly controlType: 'sap.m.BusyDialog';
  getTitle(): Promise<string>;
  getText(): Promise<string>;
}

export interface UI5SelectDialog extends UI5ControlBase {
  readonly controlType: 'sap.m.SelectDialog';
  getTitle(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5TableSelectDialog extends UI5ControlBase {
  readonly controlType: 'sap.m.TableSelectDialog';
  getTitle(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5ViewSettingsDialog extends UI5ControlBase {
  readonly controlType: 'sap.m.ViewSettingsDialog';
  getTitle(): Promise<string>;
  getSelectedSortItem(): Promise<string>;
  getSelectedGroupItem(): Promise<string>;
}

export interface UI5MessagePage extends UI5ControlBase {
  readonly controlType: 'sap.m.MessagePage';
  getText(): Promise<string>;
  getDescription(): Promise<string>;
  getIcon(): Promise<string>;
}

// ── Navigation Controls ─────────────────────────────────────────
export interface UI5Page extends UI5ControlBase {
  readonly controlType: 'sap.m.Page';
  getTitle(): Promise<string>;
  getShowNavButton(): Promise<boolean>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getFooter(): Promise<UI5ControlBase>;
}

export interface UI5IconTabBar extends UI5ControlBase {
  readonly controlType: 'sap.m.IconTabBar';
  getSelectedKey(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  setSelectedKey(key: string): Promise<void>;
}

export interface UI5IconTabFilter extends UI5ControlBase {
  readonly controlType: 'sap.m.IconTabFilter';
  getKey(): Promise<string>;
  getText(): Promise<string>;
  getCount(): Promise<string>;
  getIcon(): Promise<string>;
}

export interface UI5PlanningCalendar extends UI5ControlBase {
  readonly controlType: 'sap.m.PlanningCalendar';
  getRows(): Promise<readonly UI5ControlBase[]>;
  getStartDate(): Promise<string>;
  getViewKey(): Promise<string>;
  setViewKey(key: string): Promise<void>;
}

export interface UI5Menu extends UI5ControlBase {
  readonly controlType: 'sap.m.Menu';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getTitle(): Promise<string>;
}

export interface UI5MenuItem extends UI5ControlBase {
  readonly controlType: 'sap.m.MenuItem';
  getText(): Promise<string>;
  getIcon(): Promise<string>;
  getEnabled(): Promise<boolean>;
}

export interface UI5UploadCollection extends UI5ControlBase {
  readonly controlType: 'sap.m.UploadCollection';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getInstantUpload(): Promise<boolean>;
}

export interface UI5FacetFilterList extends UI5ControlBase {
  readonly controlType: 'sap.m.FacetFilterList';
  getTitle(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedKeys(): Promise<Record<string, string>>;
}

export interface UI5SelectList extends UI5ControlBase {
  readonly controlType: 'sap.m.SelectList';
  getSelectedKey(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  setSelectedKey(key: string): Promise<void>;
}

export interface UI5OverflowToolbar extends UI5ControlBase {
  readonly controlType: 'sap.m.OverflowToolbar';
  getContent(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5Bar extends UI5ControlBase {
  readonly controlType: 'sap.m.Bar';
  getContentLeft(): Promise<readonly UI5ControlBase[]>;
  getContentMiddle(): Promise<readonly UI5ControlBase[]>;
  getContentRight(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5Toolbar extends UI5ControlBase {
  readonly controlType: 'sap.m.Toolbar';
  getContent(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5Panel extends UI5ControlBase {
  readonly controlType: 'sap.m.Panel';
  getHeaderText(): Promise<string>;
  getExpanded(): Promise<boolean>;
  getContent(): Promise<readonly UI5ControlBase[]>;
}

// ── Container/Shell Controls ────────────────────────────────────
export interface UI5App extends UI5ControlBase {
  readonly controlType: 'sap.m.App';
  getPages(): Promise<readonly UI5ControlBase[]>;
  getCurrentPage(): Promise<UI5ControlBase>;
}

export interface UI5Shell extends UI5ControlBase {
  readonly controlType: 'sap.m.Shell';
  getApp(): Promise<UI5ControlBase>;
  getTitle(): Promise<string>;
}

export interface UI5SplitApp extends UI5ControlBase {
  readonly controlType: 'sap.m.SplitApp';
  getMasterPages(): Promise<readonly UI5ControlBase[]>;
  getDetailPages(): Promise<readonly UI5ControlBase[]>;
  getCurrentMasterPage(): Promise<UI5ControlBase>;
  getCurrentDetailPage(): Promise<UI5ControlBase>;
}

export interface UI5SplitContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.SplitContainer';
  getMasterPages(): Promise<readonly UI5ControlBase[]>;
  getDetailPages(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5NavContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.NavContainer';
  getPages(): Promise<readonly UI5ControlBase[]>;
  getCurrentPage(): Promise<UI5ControlBase>;
}

export interface UI5Carousel extends UI5ControlBase {
  readonly controlType: 'sap.m.Carousel';
  getPages(): Promise<readonly UI5ControlBase[]>;
  getActivePage(): Promise<string>;
}

export interface UI5VBox extends UI5ControlBase {
  readonly controlType: 'sap.m.VBox';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5HBox extends UI5ControlBase {
  readonly controlType: 'sap.m.HBox';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5FlexBox extends UI5ControlBase {
  readonly controlType: 'sap.m.FlexBox';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getDirection(): Promise<string>;
}

export interface UI5ScrollContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.ScrollContainer';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getHorizontal(): Promise<boolean>;
  getVertical(): Promise<boolean>;
}

export interface UI5TabContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.TabContainer';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedItem(): Promise<string>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.ui.table — Advanced Data Table Library (3 controls)
// ═══════════════════════════════════════════════════════════════════

export interface UI5GridTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.table.Table';
  getRows(): Promise<readonly UI5ControlBase[]>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getSelectedIndices(): Promise<readonly number[]>;
  getRowCount(): Promise<number>;
  getVisibleRowCount(): Promise<number>;
}

export interface UI5TreeTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.table.TreeTable';
  getRows(): Promise<readonly UI5ControlBase[]>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getSelectedIndices(): Promise<readonly number[]>;
  expand(rowIndex: number): Promise<void>;
  collapse(rowIndex: number): Promise<void>;
}

export interface UI5AnalyticalTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.table.AnalyticalTable';
  getRows(): Promise<readonly UI5ControlBase[]>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getSelectedIndices(): Promise<readonly number[]>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.ui.comp — Smart Controls (4 controls)
// ═══════════════════════════════════════════════════════════════════

export interface UI5SmartTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smarttable.SmartTable';
  getEntitySet(): Promise<string>;
  getTable(): Promise<UI5ControlBase>;
  getToolbar(): Promise<UI5ControlBase>;
}

export interface UI5SmartFilterBar extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar';
  getFilterItems(): Promise<readonly UI5ControlBase[]>;
  getEntitySet(): Promise<string>;
  search(): Promise<void>;
}

export interface UI5SmartForm extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartform.SmartForm';
  getGroups(): Promise<readonly UI5ControlBase[]>;
  getEditable(): Promise<boolean>;
}

export interface UI5FilterBar extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.filterbar.FilterBar';
  getFilterItems(): Promise<readonly UI5ControlBase[]>;
  search(): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.f — Fiori Design Controls (4 controls)
// ═══════════════════════════════════════════════════════════════════

export interface UI5DynamicPage extends UI5ControlBase {
  readonly controlType: 'sap.f.DynamicPage';
  getTitle(): Promise<UI5ControlBase>;
  getHeader(): Promise<UI5ControlBase>;
  getContent(): Promise<UI5ControlBase>;
}

export interface UI5FlexibleColumnLayout extends UI5ControlBase {
  readonly controlType: 'sap.f.FlexibleColumnLayout';
  getLayout(): Promise<string>;
  getBeginColumnPages(): Promise<readonly UI5ControlBase[]>;
  getMidColumnPages(): Promise<readonly UI5ControlBase[]>;
  getEndColumnPages(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5ShellBar extends UI5ControlBase {
  readonly controlType: 'sap.f.ShellBar';
  getTitle(): Promise<string>;
  getSecondTitle(): Promise<string>;
  getShowNavButton(): Promise<boolean>;
}

export interface UI5GridContainer extends UI5ControlBase {
  readonly controlType: 'sap.f.GridContainer';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.uxap — Object Page (1 control)
// ═══════════════════════════════════════════════════════════════════

export interface UI5ObjectPageLayout extends UI5ControlBase {
  readonly controlType: 'sap.uxap.ObjectPageLayout';
  getSections(): Promise<readonly UI5ControlBase[]>;
  getHeaderTitle(): Promise<UI5ControlBase>;
  getHeaderContent(): Promise<readonly UI5ControlBase[]>;
  getSelectedSection(): Promise<string>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.ui.layout — Layout Controls (6 controls)
// ═══════════════════════════════════════════════════════════════════

export interface UI5SimpleForm extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.form.SimpleForm';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getEditable(): Promise<boolean>;
  getTitle(): Promise<string>;
}

export interface UI5Form extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.form.Form';
  getFormContainers(): Promise<readonly UI5ControlBase[]>;
  getEditable(): Promise<boolean>;
}

export interface UI5Grid extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.Grid';
  getContent(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5HorizontalLayout extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.HorizontalLayout';
  getContent(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5VerticalLayout extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.VerticalLayout';
  getContent(): Promise<readonly UI5ControlBase[]>;
}

export interface UI5LayoutPanel extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.Panel';
  getHeaderText(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getExpanded(): Promise<boolean>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.ui.unified — Unified Controls (2 controls)
// ═══════════════════════════════════════════════════════════════════

export interface UI5FileUploader extends UI5ControlBase {
  readonly controlType: 'sap.ui.unified.FileUploader';
  getValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getUploadUrl(): Promise<string>;
}

export interface UI5Calendar extends UI5ControlBase {
  readonly controlType: 'sap.ui.unified.Calendar';
  getSelectedDates(): Promise<readonly UI5ControlBase[]>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.tnt — Tool Navigation Controls (1 control)
// ═══════════════════════════════════════════════════════════════════

export interface UI5SideNavigation extends UI5ControlBase {
  readonly controlType: 'sap.tnt.SideNavigation';
  getExpanded(): Promise<boolean>;
  getSelectedKey(): Promise<string>;
  getItem(): Promise<UI5ControlBase>;
  getFixedItem(): Promise<UI5ControlBase>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.ui.webc — Web Components (wdi5 source, 3 controls)
// ═══════════════════════════════════════════════════════════════════

export interface UI5WebCButton extends UI5ControlBase {
  readonly controlType: 'sap.ui.webc.main.Button';
  getText(): Promise<string>;
  getDesign(): Promise<string>;
  press(): Promise<void>;
}

export interface UI5WebCInput extends UI5ControlBase {
  readonly controlType: 'sap.ui.webc.main.Input';
  getValue(): Promise<string>;
  getPlaceholder(): Promise<string>;
  setValue(value: string): Promise<void>;
}

export interface UI5WebCList extends UI5ControlBase {
  readonly controlType: 'sap.ui.webc.main.List';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

// ═══════════════════════════════════════════════════════════════════
// sap.ui.mdc — Metadata-Driven Controls (wdi5 source, 1 control)
// ═══════════════════════════════════════════════════════════════════

export interface UI5MdcTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.mdc.Table';
  getRows(): Promise<readonly UI5ControlBase[]>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getType(): Promise<string>;
  getThreshold(): Promise<number>;
}

// ═══════════════════════════════════════════════════════════════════
// Control Type Unions (from dhikraft constants.ts)
// ═══════════════════════════════════════════════════════════════════

/** Controls that accept user interaction (dhikraft constants.ts: 34 types) */
export type InteractiveControlType =
  | 'sap.m.Button'
  | 'sap.m.Input'
  | 'sap.m.SearchField'
  | 'sap.m.Select'
  | 'sap.m.ComboBox'
  | 'sap.m.MultiComboBox'
  | 'sap.m.CheckBox'
  | 'sap.m.RadioButton'
  | 'sap.m.Switch'
  | 'sap.m.Link'
  | 'sap.m.DatePicker'
  | 'sap.m.TimePicker'
  | 'sap.m.DateTimePicker'
  | 'sap.m.TextArea'
  | 'sap.m.StepInput'
  | 'sap.m.Slider'
  | 'sap.m.RangeSlider'
  | 'sap.m.SegmentedButton'
  | 'sap.m.ToggleButton'
  | 'sap.m.MenuButton'
  | 'sap.m.SplitButton'
  | 'sap.ui.unified.FileUploader'
  | 'sap.m.upload.UploadSet'
  | 'sap.m.GenericTile'
  | 'sap.m.StandardTile'
  | 'sap.m.CustomTile'
  | 'sap.m.IconTabFilter'
  | 'sap.m.Token'
  | 'sap.m.ListItemBase'
  | 'sap.m.StandardListItem'
  | 'sap.m.CustomListItem'
  | 'sap.m.InputListItem'
  | 'sap.m.ActionListItem'
  | 'sap.m.ColumnListItem';

/** Controls that contain other controls (dhikraft constants.ts: 28 types) */
export type ContainerControlType =
  | 'sap.m.Page'
  | 'sap.m.App'
  | 'sap.m.Shell'
  | 'sap.m.SplitApp'
  | 'sap.m.SplitContainer'
  | 'sap.m.NavContainer'
  | 'sap.m.Carousel'
  | 'sap.m.Panel'
  | 'sap.m.VBox'
  | 'sap.m.HBox'
  | 'sap.m.FlexBox'
  | 'sap.m.ScrollContainer'
  | 'sap.m.Dialog'
  | 'sap.m.Popover'
  | 'sap.m.ResponsivePopover'
  | 'sap.m.MessagePopover'
  | 'sap.m.ActionSheet'
  | 'sap.m.QuickView'
  | 'sap.m.List'
  | 'sap.m.Table'
  | 'sap.m.Tree'
  | 'sap.ui.table.Table'
  | 'sap.ui.table.TreeTable'
  | 'sap.ui.table.AnalyticalTable'
  | 'sap.f.GridContainer'
  | 'sap.f.DynamicPage'
  | 'sap.f.FlexibleColumnLayout'
  | 'sap.uxap.ObjectPageLayout';

// ═══════════════════════════════════════════════════════════════════
// Discriminated union map (all 113 controls)
// ═══════════════════════════════════════════════════════════════════

export interface UI5ControlMap {
  // sap.m — Input Controls (25)
  'sap.m.Button': UI5Button;
  'sap.m.Input': UI5Input;
  'sap.m.CheckBox': UI5CheckBox;
  'sap.m.RadioButton': UI5RadioButton;
  'sap.m.ComboBox': UI5ComboBox;
  'sap.m.MultiComboBox': UI5MultiComboBox;
  'sap.m.Select': UI5Select;
  'sap.m.TextArea': UI5TextArea;
  'sap.m.DatePicker': UI5DatePicker;
  'sap.m.TimePicker': UI5TimePicker;
  'sap.m.DateTimePicker': UI5DateTimePicker;
  'sap.m.SearchField': UI5SearchField;
  'sap.m.MultiInput': UI5MultiInput;
  'sap.m.Switch': UI5Switch;
  'sap.m.StepInput': UI5StepInput;
  'sap.m.SegmentedButton': UI5SegmentedButton;
  'sap.m.Slider': UI5Slider;
  'sap.m.RangeSlider': UI5RangeSlider;
  'sap.m.ToggleButton': UI5ToggleButton;
  'sap.m.MenuButton': UI5MenuButton;
  'sap.m.SplitButton': UI5SplitButton;
  'sap.m.Token': UI5Token;
  'sap.m.MaskInput': UI5MaskInput;
  'sap.m.Link': UI5Link;
  'sap.m.upload.UploadSet': UI5UploadSet;
  // sap.m — Display Controls (14)
  'sap.m.Text': UI5Text;
  'sap.m.Label': UI5Label;
  'sap.m.Title': UI5Title;
  'sap.m.MessageStrip': UI5MessageStrip;
  'sap.m.ObjectStatus': UI5ObjectStatus;
  'sap.m.ObjectIdentifier': UI5ObjectIdentifier;
  'sap.m.ObjectHeader': UI5ObjectHeader;
  'sap.m.ObjectAttribute': UI5ObjectAttribute;
  'sap.m.GenericTile': UI5GenericTile;
  'sap.m.StandardTile': UI5StandardTile;
  'sap.m.CustomTile': UI5CustomTile;
  'sap.m.Avatar': UI5Avatar;
  'sap.m.Image': UI5Image;
  'sap.m.Icon': UI5Icon;
  // sap.m — Indicator Controls (3)
  'sap.m.ProgressIndicator': UI5ProgressIndicator;
  'sap.m.RatingIndicator': UI5RatingIndicator;
  'sap.m.BusyIndicator': UI5BusyIndicator;
  // sap.m — List/Table Controls (11)
  'sap.m.ListItemBase': UI5ListItemBase;
  'sap.m.List': UI5List;
  'sap.m.Table': UI5Table;
  'sap.m.StandardListItem': UI5StandardListItem;
  'sap.m.ColumnListItem': UI5ColumnListItem;
  'sap.m.CustomListItem': UI5CustomListItem;
  'sap.m.InputListItem': UI5InputListItem;
  'sap.m.ActionListItem': UI5ActionListItem;
  'sap.m.NotificationListItem': UI5NotificationListItem;
  'sap.m.FeedListItemAction': UI5FeedListItemAction;
  'sap.m.Tree': UI5Tree;
  // sap.m — Dialog/Overlay Controls (11)
  'sap.m.Dialog': UI5Dialog;
  'sap.m.Popover': UI5Popover;
  'sap.m.ResponsivePopover': UI5ResponsivePopover;
  'sap.m.MessagePopover': UI5MessagePopover;
  'sap.m.ActionSheet': UI5ActionSheet;
  'sap.m.QuickView': UI5QuickView;
  'sap.m.BusyDialog': UI5BusyDialog;
  'sap.m.SelectDialog': UI5SelectDialog;
  'sap.m.TableSelectDialog': UI5TableSelectDialog;
  'sap.m.ViewSettingsDialog': UI5ViewSettingsDialog;
  'sap.m.MessagePage': UI5MessagePage;
  // sap.m — Navigation/Toolbar Controls (13)
  'sap.m.Page': UI5Page;
  'sap.m.IconTabBar': UI5IconTabBar;
  'sap.m.IconTabFilter': UI5IconTabFilter;
  'sap.m.PlanningCalendar': UI5PlanningCalendar;
  'sap.m.Menu': UI5Menu;
  'sap.m.MenuItem': UI5MenuItem;
  'sap.m.UploadCollection': UI5UploadCollection;
  'sap.m.FacetFilterList': UI5FacetFilterList;
  'sap.m.SelectList': UI5SelectList;
  'sap.m.OverflowToolbar': UI5OverflowToolbar;
  'sap.m.Bar': UI5Bar;
  'sap.m.Toolbar': UI5Toolbar;
  'sap.m.TabContainer': UI5TabContainer;
  // sap.m — Container Controls (11)
  'sap.m.Panel': UI5Panel;
  'sap.m.App': UI5App;
  'sap.m.Shell': UI5Shell;
  'sap.m.SplitApp': UI5SplitApp;
  'sap.m.SplitContainer': UI5SplitContainer;
  'sap.m.NavContainer': UI5NavContainer;
  'sap.m.Carousel': UI5Carousel;
  'sap.m.VBox': UI5VBox;
  'sap.m.HBox': UI5HBox;
  'sap.m.FlexBox': UI5FlexBox;
  'sap.m.ScrollContainer': UI5ScrollContainer;
  // sap.ui.table (3)
  'sap.ui.table.Table': UI5GridTable;
  'sap.ui.table.TreeTable': UI5TreeTable;
  'sap.ui.table.AnalyticalTable': UI5AnalyticalTable;
  // sap.ui.comp (4)
  'sap.ui.comp.smarttable.SmartTable': UI5SmartTable;
  'sap.ui.comp.smartfilterbar.SmartFilterBar': UI5SmartFilterBar;
  'sap.ui.comp.smartform.SmartForm': UI5SmartForm;
  'sap.ui.comp.filterbar.FilterBar': UI5FilterBar;
  // sap.f (4)
  'sap.f.DynamicPage': UI5DynamicPage;
  'sap.f.FlexibleColumnLayout': UI5FlexibleColumnLayout;
  'sap.f.ShellBar': UI5ShellBar;
  'sap.f.GridContainer': UI5GridContainer;
  // sap.uxap (1)
  'sap.uxap.ObjectPageLayout': UI5ObjectPageLayout;
  // sap.ui.layout (6)
  'sap.ui.layout.form.SimpleForm': UI5SimpleForm;
  'sap.ui.layout.form.Form': UI5Form;
  'sap.ui.layout.Grid': UI5Grid;
  'sap.ui.layout.HorizontalLayout': UI5HorizontalLayout;
  'sap.ui.layout.VerticalLayout': UI5VerticalLayout;
  'sap.ui.layout.Panel': UI5LayoutPanel;
  // sap.ui.unified (2)
  'sap.ui.unified.FileUploader': UI5FileUploader;
  'sap.ui.unified.Calendar': UI5Calendar;
  // sap.tnt (1)
  'sap.tnt.SideNavigation': UI5SideNavigation;
  // sap.ui.mdc (1)
  'sap.ui.mdc.Table': UI5MdcTable;
  // sap.ui.webc (3)
  'sap.ui.webc.main.Button': UI5WebCButton;
  'sap.ui.webc.main.Input': UI5WebCInput;
  'sap.ui.webc.main.List': UI5WebCList;
}

/** Utility type: get typed interface for a control type string */
export type UI5ControlFor<T extends keyof UI5ControlMap> = UI5ControlMap[T];
```

**Estimated LOC**: ~1,850 (type-only file, 2000 LOC max allowed)
**Controls**: 113 control interfaces across 11 UI5 libraries (sap.m, sap.ui.table, sap.ui.comp, sap.f, sap.uxap, sap.ui.layout, sap.ui.unified, sap.tnt, sap.ui.mdc, sap.ui.webc, sap.m.upload)
**Tests**: Type-check only. Unit test verifies UI5ControlMap is complete and all keys are valid.

#### 5.1.4 File: `src/core/types/ui5-types.d.ts`

**Purpose**: Ambient type declarations for SAP UI5 global objects (`window.sap`).

```typescript
// Global type augmentation for SAP UI5 runtime
// These types represent what exists in the browser context
// Used by browser-scripts in Phase 2

declare global {
  interface Window {
    sap?: {
      ui?: {
        getCore(): UI5Core;
        require(modules: string[], callback: (...args: unknown[]) => void): void;
        version?: { version: string };
      };
    };
  }
}

interface UI5Element {
  getId(): string;
  getMetadata(): UI5Metadata;
  getDomRef(): HTMLElement | null;
  destroy(): void;
}

interface UI5Metadata {
  getName(): string;
  getElementName(): string;
  getAllProperties(): Record<string, unknown>;
  getAllAggregations(): Record<string, unknown>;
  getAllAssociations(): Record<string, unknown>;
  getAllEvents(): Record<string, unknown>;
}

interface UI5Core {
  byId(id: string): UI5Element | undefined;
  getUIPending(): boolean;
  getConfiguration(): unknown;
  getLoadedLibraries(): Record<string, unknown>;
}

interface UI5RecordReplay {
  findDOMElementByControlSelector(selector: object): Promise<HTMLElement | null>;
  findAllDOMElementsByControlSelector(selector: object): Promise<HTMLElement[]>;
  waitForUI5(options?: { timeout?: number; interval?: number }): Promise<void>;
}
```

**Estimated LOC**: ~80
**Tests**: Type-check only

#### 5.1.5 File: `src/version.ts`

**Purpose**: Single source of truth for package version. Used by telemetry, user-agent, and error reporting.

```typescript
/**
 * Package version — kept in sync with package.json via build script.
 * @remarks Read at runtime by telemetry (service.version) and user-agent headers.
 */
export const VERSION = '1.0.1' as const;

export const PACKAGE_NAME = 'playwright-praman' as const;
```

**Estimated LOC**: ~10
**Tests**: 1 test case (VERSION matches semver pattern)

#### 5.1.6 File: `src/core/types/validation.ts`

**Purpose**: Zod-decoupled validation types used by error classes. Prevents `core/errors/` from importing `zod` directly (dependency rule: errors imports from `core/types/` only).

```typescript
/**
 * Framework-agnostic validation issue.
 * Wraps Zod's ZodIssue shape without importing zod.
 * Used by ConfigError to report schema validation failures.
 */
export interface ValidationIssue {
  readonly path: readonly (string | number)[];
  readonly message: string;
  readonly code: string;
}
```

**Estimated LOC**: ~15
**Tests**: Type-check only

#### 5.1.7 File: `src/core/types/bridge.ts`

**Purpose**: Types shared between bridge and other layers (return types, method descriptors).

```typescript
export type BridgeReturnType =
  | 'empty' // void
  | 'result' // primitive value
  | 'element' // DOM element handle
  | 'newElement' // newly created element
  | 'aggregation' // array of controls
  | 'object' // non-control UI5 object
  | 'none'; // no return expected

export interface BridgeMethodDescriptor {
  readonly name: string;
  readonly args: readonly unknown[];
  readonly returnType: BridgeReturnType;
}

export interface BridgeResult<T = unknown> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly duration: number;
}
```

**Estimated LOC**: ~40
**Tests**: Type-check only

### 5.2 Module: core/config/

#### 5.2.1 File: `src/core/config/schema.ts`

**Purpose**: Zod schema defining the complete Praman configuration. Single source of truth.

**Key Design Decisions**:

- Full schema with ALL fields (W13) — later-phase fields optional with defaults
- `z.object().strict()` — rejects unknown fields
- Coercion for env var strings → numbers/booleans
- NaN rejection on numeric fields
- Default values for every optional field

```typescript
import { z } from 'zod';

export const PramanConfigSchema = z
  .object({
    // Core (Phase 1)
    logLevel: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
    ui5WaitTimeout: z.number().int().positive().finite().default(30_000),
    controlDiscoveryTimeout: z.number().int().positive().finite().default(10_000),
    interactionStrategy: z.enum(['playwright', 'dom-first', 'opa5', 'hybrid']).default('hybrid'),
    skipStabilityWait: z.boolean().default(false),
    preferVisibleControls: z.boolean().default(true),
    ignoreAutoWaitUrls: z.array(z.string()).default([]), // WalkMe/analytics patterns (dhikraft D25)

    // Auth (Phase 3 — optional here)
    auth: z
      .object({
        strategy: z.enum(['btp-saml', 'basic', 'office365', 'custom']).default('basic'),
        baseUrl: z.string().url(),
        username: z.string().optional(),
        password: z.string().optional(),
        client: z.string().default('100'),
        language: z.string().default('EN'),
      })
      .optional(),

    // AI (Phase 5 — optional here)
    ai: z
      .object({
        provider: z.enum(['azure-openai', 'openai']).default('azure-openai'),
        apiKey: z.string().optional(),
        model: z.string().optional(),
        temperature: z.number().min(0).max(2).default(0.3),
        maxTokens: z.number().int().positive().optional(),
      })
      .optional(),

    // Telemetry (Phase 1)
    telemetry: z
      .object({
        openTelemetry: z.boolean().default(false),
        exporter: z.enum(['otlp', 'azure-monitor', 'jaeger']).default('otlp'),
        endpoint: z.string().url().optional(),
        serviceName: z.string().default('playwright-praman'),
      })
      .optional(),

    // Selectors (Phase 1)
    selectors: z
      .object({
        defaultTimeout: z.number().int().positive().default(10_000),
        preferVisibleControls: z.boolean().default(true),
        skipStabilityWait: z.boolean().default(false),
      })
      .optional(),
  })
  .strict();

// ── Derived types (SINGLE SOURCE OF TRUTH) ────────────────────────
// PramanConfig is the validated, frozen output type.
// PramanConfigInput is the user-facing input type (pre-defaults).
export type PramanConfig = z.output<typeof PramanConfigSchema>;
export type PramanConfigInput = z.input<typeof PramanConfigSchema>;
```

**Estimated LOC**: ~80
**Tests**: ~20 test cases

> **Note**: `PramanConfig` is derived from the Zod schema via `z.output<>`.
> Do NOT create a manual `interface PramanConfig`. The type is re-exported
> from `core/types/config.ts` for consumer convenience.

**Unit Tests** (`tests/unit/core/config/schema.test.ts`):

| Test Case                  | Input                              | Expected                  |
| -------------------------- | ---------------------------------- | ------------------------- |
| Valid minimal config       | `{}`                               | All defaults applied      |
| Valid full config          | All fields                         | Parsed correctly          |
| Invalid logLevel           | `{ logLevel: 'invalid' }`          | Zod error                 |
| Invalid timeout (NaN)      | `{ ui5WaitTimeout: NaN }`          | Zod error (`.finite()`)   |
| Invalid timeout (negative) | `{ ui5WaitTimeout: -1 }`           | Zod error (`.positive()`) |
| Invalid timeout (float)    | `{ ui5WaitTimeout: 1.5 }`          | Zod error (`.int()`)      |
| Invalid URL in auth        | `{ auth: { baseUrl: 'not-url' } }` | Zod error                 |
| Unknown field rejected     | `{ unknown: true }`                | Zod error (`.strict()`)   |
| Temperature bounds         | `{ ai: { temperature: 3 } }`       | Zod error (`.max(2)`)     |
| Default values correct     | `{}`                               | Assert each default       |

#### 5.2.2 File: `src/core/config/loader.ts`

**Purpose**: Load config from TS file, JSON file, or defaults. Apply env overrides. Validate. Freeze.

**Key Design Decisions**:

- Resolution order: CLI flag → `praman.config.ts` → `praman.config.json` → `{}` defaults
- Dynamic `import()` for TypeScript config files
- `JSON.parse()` for JSON config files
- Env var mapping: `PRAMAN_LOG_LEVEL` → `logLevel`, etc.
- Returns `Readonly<PramanConfig>` (frozen with `Object.freeze`)

```typescript
import { readFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { PramanConfigSchema } from './schema.js';
import type { PramanConfig, PramanConfigInput } from '#core/types/config.js';
import { ConfigError } from '#core/errors/config-error.js';

export interface LoadConfigOptions {
  readonly configPath?: string; // explicit path override
  readonly cwd?: string; // working directory (default: process.cwd())
}

export async function loadConfig(options?: LoadConfigOptions): Promise<Readonly<PramanConfig>>;

/** Type helper for IDE autocomplete. Returns input unchanged. */
export function defineConfig(input: PramanConfigInput): PramanConfigInput;
```

**Estimated LOC**: ~120
**Tests**: ~15 test cases

**Unit Tests** (`tests/unit/core/config/loader.test.ts`):

| Test Case                  | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| Load from TS file          | Mock `import()` returning config object               |
| Load from JSON file        | Mock `fs.readFile` returning JSON string              |
| Fallback to defaults       | No config file found → returns defaults               |
| Env override logLevel      | Set `PRAMAN_LOG_LEVEL=debug` → overrides              |
| Env override timeout       | Set `PRAMAN_UI5_WAIT_TIMEOUT=5000` → overrides        |
| Explicit configPath        | `{ configPath: '/custom/path.ts' }` → loads that file |
| Config file not found      | Non-existent path → falls back to defaults            |
| Invalid config file        | TS file throws → ConfigError                          |
| Frozen output              | Result is deeply frozen (Object.isFrozen)             |
| defineConfig passthrough   | Returns input unchanged (type helper)                 |
| Config resolution priority | CLI > TS file > JSON file > defaults                  |
| SAP\_\* env vars to auth   | `SAP_CLOUD_BASE_URL` → `auth.baseUrl`                 |

**Complete Env Var Mapping** (documented for users + AI agents):

| Env Variable                       | Maps To                   | Type         |
| ---------------------------------- | ------------------------- | ------------ |
| `PRAMAN_LOG_LEVEL`                 | `logLevel`                | enum         |
| `PRAMAN_UI5_WAIT_TIMEOUT`          | `ui5WaitTimeout`          | number       |
| `PRAMAN_CONTROL_DISCOVERY_TIMEOUT` | `controlDiscoveryTimeout` | number       |
| `PRAMAN_INTERACTION_STRATEGY`      | `interactionStrategy`     | enum         |
| `PRAMAN_SKIP_STABILITY_WAIT`       | `skipStabilityWait`       | boolean      |
| `PRAMAN_PREFER_VISIBLE`            | `preferVisibleControls`   | boolean      |
| `SAP_CLOUD_BASE_URL`               | `auth.baseUrl`            | string (URL) |
| `SAP_USERNAME`                     | `auth.username`           | string       |
| `SAP_PASSWORD`                     | `auth.password`           | string       |
| `SAP_CLIENT`                       | `auth.client`             | string       |
| `SAP_LANGUAGE`                     | `auth.language`           | string       |
| `PRAMAN_AUTH_STRATEGY`             | `auth.strategy`           | enum         |
| `PRAMAN_OTEL_ENABLED`              | `telemetry.openTelemetry` | boolean      |
| `PRAMAN_OTEL_EXPORTER`             | `telemetry.exporter`      | enum         |
| `PRAMAN_OTEL_ENDPOINT`             | `telemetry.endpoint`      | string (URL) |
| `PRAMAN_AI_PROVIDER`               | `ai.provider`             | enum         |
| `PRAMAN_AI_API_KEY`                | `ai.apiKey`               | string       |

#### 5.2.3 File: `src/core/config/index.ts` (barrel update)

```typescript
export { PramanConfigSchema } from './schema.js';
export type { PramanConfigInput } from './schema.js';
export { loadConfig, defineConfig } from './loader.js';
```

### 5.3 Module: core/errors/

#### 5.3.1 File: `src/core/errors/codes.ts`

**Purpose**: Centralized error code constants. Single source of truth for all error codes.

```typescript
export const ErrorCode = {
  // Config errors (1xx)
  ERR_CONFIG_INVALID: 'ERR_CONFIG_INVALID',
  ERR_CONFIG_NOT_FOUND: 'ERR_CONFIG_NOT_FOUND',
  ERR_CONFIG_PARSE: 'ERR_CONFIG_PARSE',

  // Bridge errors (2xx)
  ERR_BRIDGE_TIMEOUT: 'ERR_BRIDGE_TIMEOUT',
  ERR_BRIDGE_INJECTION: 'ERR_BRIDGE_INJECTION',
  ERR_BRIDGE_NOT_READY: 'ERR_BRIDGE_NOT_READY',
  ERR_BRIDGE_VERSION: 'ERR_BRIDGE_VERSION',

  // Control errors (3xx)
  ERR_CONTROL_NOT_FOUND: 'ERR_CONTROL_NOT_FOUND',
  ERR_CONTROL_NOT_VISIBLE: 'ERR_CONTROL_NOT_VISIBLE',
  ERR_CONTROL_NOT_ENABLED: 'ERR_CONTROL_NOT_ENABLED',
  ERR_CONTROL_NOT_INTERACTABLE: 'ERR_CONTROL_NOT_INTERACTABLE',
  ERR_CONTROL_PROPERTY: 'ERR_CONTROL_PROPERTY',
  ERR_CONTROL_AGGREGATION: 'ERR_CONTROL_AGGREGATION',

  // Auth errors (4xx)
  ERR_AUTH_FAILED: 'ERR_AUTH_FAILED',
  ERR_AUTH_TIMEOUT: 'ERR_AUTH_TIMEOUT',
  ERR_AUTH_SESSION_EXPIRED: 'ERR_AUTH_SESSION_EXPIRED',
  ERR_AUTH_STRATEGY_INVALID: 'ERR_AUTH_STRATEGY_INVALID',

  // Navigation errors (5xx)
  ERR_NAV_TILE_NOT_FOUND: 'ERR_NAV_TILE_NOT_FOUND',
  ERR_NAV_ROUTE_FAILED: 'ERR_NAV_ROUTE_FAILED',
  ERR_NAV_TIMEOUT: 'ERR_NAV_TIMEOUT',

  // OData errors (6xx)
  ERR_ODATA_REQUEST_FAILED: 'ERR_ODATA_REQUEST_FAILED',
  ERR_ODATA_PARSE: 'ERR_ODATA_PARSE',
  ERR_ODATA_CSRF: 'ERR_ODATA_CSRF',

  // Selector errors (7xx)
  ERR_SELECTOR_INVALID: 'ERR_SELECTOR_INVALID',
  ERR_SELECTOR_AMBIGUOUS: 'ERR_SELECTOR_AMBIGUOUS',
  ERR_SELECTOR_PARSE: 'ERR_SELECTOR_PARSE',

  // Timeout errors (8xx)
  ERR_TIMEOUT_UI5_STABLE: 'ERR_TIMEOUT_UI5_STABLE',
  ERR_TIMEOUT_CONTROL_DISCOVERY: 'ERR_TIMEOUT_CONTROL_DISCOVERY',
  ERR_TIMEOUT_OPERATION: 'ERR_TIMEOUT_OPERATION',

  // AI errors (9xx)
  ERR_AI_PROVIDER_UNAVAILABLE: 'ERR_AI_PROVIDER_UNAVAILABLE',
  ERR_AI_RESPONSE_INVALID: 'ERR_AI_RESPONSE_INVALID',
  ERR_AI_TOKEN_LIMIT: 'ERR_AI_TOKEN_LIMIT',
  ERR_AI_RATE_LIMITED: 'ERR_AI_RATE_LIMITED',

  // Plugin errors (10xx)
  ERR_PLUGIN_LOAD: 'ERR_PLUGIN_LOAD',
  ERR_PLUGIN_INIT: 'ERR_PLUGIN_INIT',
  ERR_PLUGIN_INCOMPATIBLE: 'ERR_PLUGIN_INCOMPATIBLE',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
```

**Estimated LOC**: ~60
**Tests**: 1 test verifying all codes are unique strings

#### 5.3.2 File: `src/core/errors/base.ts`

**Purpose**: `PramanError` base class that all error subclasses extend.

```typescript
export interface PramanErrorOptions {
  readonly code: ErrorCode;
  readonly message: string;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity?: 'error' | 'warning' | 'info';
  readonly details?: Readonly<Record<string, unknown>>;
  readonly suggestions?: readonly string[];
  readonly cause?: Error;
}

export class PramanError extends Error {
  readonly code: ErrorCode;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity: 'error' | 'warning' | 'info';
  readonly details: Readonly<Record<string, unknown>>;
  readonly suggestions: readonly string[];
  readonly timestamp: string;

  constructor(options: PramanErrorOptions);
  toJSON(): SerializedPramanError;
  toUserMessage(): string;

  /**
   * AI-first introspection method (D29: AI response envelope).
   * Returns structured context for AI agents to reason about the error.
   * Consistent shape across all error subclasses.
   */
  toAIContext(): AIErrorContext;
}

export interface AIErrorContext {
  readonly code: ErrorCode;
  readonly message: string;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity: string;
  readonly suggestions: readonly string[];
  readonly details: Readonly<Record<string, unknown>>;
  readonly timestamp: string;
}

export interface SerializedPramanError {
  readonly name: string;
  readonly code: ErrorCode;
  readonly message: string;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity: string;
  readonly details: Record<string, unknown>;
  readonly suggestions: readonly string[];
  readonly timestamp: string;
  readonly stack?: string;
}
```

**`toJSON()` Output Template** (exact shape — tests assert these fields):

```typescript
{
  name: 'PramanError',        // or subclass name: 'ConfigError', etc.
  code: 'ERR_CONFIG_INVALID', // ErrorCode string
  message: 'Config invalid',  // error.message
  attempted: 'Load config',   // what was tried
  retryable: false,           // can caller retry?
  severity: 'error',          // 'error' | 'warning' | 'info'
  details: { ... },           // structured context (default: {})
  suggestions: ['...'],       // recovery hints (default: [])
  timestamp: '2026-01-15T10:30:00.000Z',  // ISO 8601
  stack: 'PramanError: Config invalid\n  at ...',  // always included
  // Subclass fields merged at top level:
  // ConfigError adds: validationErrors, configPath
  // ControlError adds: lastKnownSelector, availableControls, suggestedSelector
  // etc.
}
```

**`toUserMessage()` Output Template** (exact format — tests assert this string):

```text
[ERR_CONFIG_INVALID] Config invalid

  Attempted: Load config from praman.config.ts
  Severity:  error
  Retryable: no

  Suggestions:
    1. Check config file syntax
    2. Run 'npx praman validate-config'

  Details:
    configPath: /app/praman.config.ts
```

Rules: code in brackets, message on first line, blank line, indented sections.
"Retryable" shows "yes"/"no" (not true/false). Suggestions numbered.
Details section only shown if `Object.keys(details).length > 0`.
Subclass-specific fields included in Details section.

**`toAIContext()` Output Template** (same as `toJSON()` minus `stack` + `name`):

```typescript
{
  code: 'ERR_CONFIG_INVALID',
  message: 'Config invalid',
  attempted: 'Load config',
  retryable: false,
  severity: 'error',
  details: { ... },
  suggestions: ['...'],
  timestamp: '2026-01-15T10:30:00.000Z',
}
```

**Estimated LOC**: ~100
**Tests**: ~16 test cases (100% coverage required — Tier 1)

**Unit Tests** (`tests/unit/core/errors/base.test.ts`):

| Test Case                                | Description                            |
| ---------------------------------------- | -------------------------------------- |
| Creates with all options                 | All fields populated correctly         |
| Creates with minimal options             | Required fields only, defaults applied |
| Extends Error                            | `instanceof Error` is true             |
| Has correct name                         | `error.name === 'PramanError'`         |
| Has timestamp                            | ISO 8601 format                        |
| toJSON() serializes all fields           | Complete JSON representation           |
| toJSON() includes stack                  | Stack trace present                    |
| toUserMessage() formats nicely           | Human-readable format                  |
| Suggestions default to empty array       | No suggestions → `[]`                  |
| Details default to empty object          | No details → `{}`                      |
| Severity defaults to 'error'             | No severity → `'error'`                |
| Cause is preserved                       | `error.cause` matches input            |
| Error is readonly                        | Properties cannot be reassigned        |
| Error code type-safe                     | Only valid ErrorCode values accepted   |
| toAIContext() returns structured context | All AI-relevant fields present         |
| toAIContext() matches toJSON() shape     | Consistent with serialized form        |

#### 5.3.3 Files: 10 Error Subclasses

Each subclass follows the same pattern. I'll detail `ConfigError` and `ControlError` (the most complex); others follow the same template.

**File: `src/core/errors/config-error.ts`**

```typescript
export interface ConfigErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_CONFIG_INVALID
    | typeof ErrorCode.ERR_CONFIG_NOT_FOUND
    | typeof ErrorCode.ERR_CONFIG_PARSE;
  readonly validationErrors?: readonly ValidationIssue[]; // Zod-decoupled (see core/types/validation.ts)
  readonly configPath?: string;
}

export class ConfigError extends PramanError {
  readonly validationErrors: readonly ValidationIssue[];
  readonly configPath?: string;

  constructor(options: ConfigErrorOptions);
}
```

**Estimated LOC per subclass**: ~30-50

**Unit Tests** (`tests/unit/core/errors/config-error.test.ts`):

| #   | Test Case                                 | Input                                                                                        | Expected                                |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------- |
| 1   | Base behavior (10 tests)                  | `runBaseErrorTests(ConfigError, ...)`                                                        | All 10 pass                             |
| 2   | validationErrors preserved                | `{ validationErrors: [{ path: ['logLevel'], message: '...', code: 'invalid_enum_value' }] }` | Array matches                           |
| 3   | validationErrors defaults to empty        | No validationErrors field                                                                    | `error.validationErrors` is `[]`        |
| 4   | configPath preserved                      | `{ configPath: '/app/praman.config.ts' }`                                                    | Matches                                 |
| 5   | toJSON includes validationErrors          | With Zod-like issues                                                                         | JSON has `validationErrors` array       |
| 6   | toUserMessage includes validation details | Multiple issues                                                                              | Message lists each issue path + message |
| 7   | NOT_FOUND code                            | `{ code: 'ERR_CONFIG_NOT_FOUND' }`                                                           | Code matches                            |
| 8   | PARSE code                                | `{ code: 'ERR_CONFIG_PARSE' }`                                                               | Code matches                            |

Total: 10 (shared) + 8 (specific) = 18 tests

**File: `src/core/errors/control-error.ts`** (most complex — has self-healing fields)

```typescript
export interface ControlErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_CONTROL_NOT_FOUND
    | typeof ErrorCode.ERR_CONTROL_NOT_VISIBLE
    | typeof ErrorCode.ERR_CONTROL_NOT_ENABLED
    | typeof ErrorCode.ERR_CONTROL_NOT_INTERACTABLE
    | typeof ErrorCode.ERR_CONTROL_PROPERTY
    | typeof ErrorCode.ERR_CONTROL_AGGREGATION;
  // Self-healing fields (BP-CLAUDE: AI agent recovery)
  readonly lastKnownSelector?: UI5Selector;
  readonly availableControls?: readonly string[];
  readonly suggestedSelector?: UI5Selector;
}

export class ControlError extends PramanError {
  readonly lastKnownSelector?: UI5Selector;
  readonly availableControls: readonly string[];
  readonly suggestedSelector?: UI5Selector;

  constructor(options: ControlErrorOptions);
}
```

**Unit Tests** (`tests/unit/core/errors/control-error.test.ts`):

| #   | Test Case                           | Input                                     | Expected                          |
| --- | ----------------------------------- | ----------------------------------------- | --------------------------------- |
| 1   | Base behavior (10 tests)            | `runBaseErrorTests(ControlError, ...)`    | All 10 pass                       |
| 2   | lastKnownSelector preserved         | `{ lastKnownSelector: { id: 'oldBtn' } }` | Deep equals                       |
| 3   | availableControls preserved         | `{ availableControls: ['btn1', 'btn2'] }` | Array matches                     |
| 4   | availableControls defaults to empty | No field                                  | `error.availableControls` is `[]` |
| 5   | suggestedSelector preserved         | `{ suggestedSelector: { id: 'btn1' } }`   | Deep equals                       |
| 6   | toJSON includes self-healing fields | All 3 fields set                          | JSON has all 3                    |
| 7   | toAIContext includes self-healing   | All 3 fields set                          | AI context has all 3 in details   |
| 8   | NOT_VISIBLE code                    | `{ code: 'ERR_CONTROL_NOT_VISIBLE' }`     | Code matches                      |

Total: 10 (shared) + 8 (specific) = 18 tests

**Complete list of 10 subclass files** (ConfigError and ControlError detailed above;
remaining 8 below):

**File: `src/core/errors/bridge-error.ts`**

```typescript
export interface BridgeErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_BRIDGE_TIMEOUT
    | typeof ErrorCode.ERR_BRIDGE_INJECTION
    | typeof ErrorCode.ERR_BRIDGE_NOT_READY
    | typeof ErrorCode.ERR_BRIDGE_VERSION;
  readonly ui5Version?: string;
  readonly adapterType?: string;
}

export class BridgeError extends PramanError {
  readonly ui5Version?: string;
  readonly adapterType?: string;
  constructor(options: BridgeErrorOptions);
}
```

**Unit Tests** (`tests/unit/core/errors/bridge-error.test.ts`):

| #   | Test Case                        | Input                                 | Expected                                    |
| --- | -------------------------------- | ------------------------------------- | ------------------------------------------- |
| 1   | Base behavior (10 tests)         | `runBaseErrorTests(BridgeError, ...)` | All 10 pass                                 |
| 2   | ui5Version preserved             | `{ ui5Version: '1.120.0' }`           | `error.ui5Version === '1.120.0'`            |
| 3   | adapterType preserved            | `{ adapterType: 'record-replay' }`    | `error.adapterType === 'record-replay'`     |
| 4   | toJSON includes ui5Version       | Full options                          | `JSON.parse(...).ui5Version === '1.120.0'`  |
| 5   | toAIContext includes adapterType | Full options                          | `toAIContext().details.adapterType` present |

Total: 10 (shared) + 5 (specific) = 15 tests

**File: `src/core/errors/auth-error.ts`**

```typescript
export interface AuthErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_AUTH_FAILED
    | typeof ErrorCode.ERR_AUTH_TIMEOUT
    | typeof ErrorCode.ERR_AUTH_SESSION_EXPIRED
    | typeof ErrorCode.ERR_AUTH_STRATEGY_INVALID;
  readonly strategy?: string;
  readonly loginUrl?: string;
}

export class AuthError extends PramanError {
  readonly strategy?: string;
  readonly loginUrl?: string;
  constructor(options: AuthErrorOptions);
}
```

**Unit Tests** (`tests/unit/core/errors/auth-error.test.ts`):

| #   | Test Case                          | Input                                                   | Expected                           |
| --- | ---------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| 1   | Base behavior (10 tests)           | `runBaseErrorTests(AuthError, ...)`                     | All 10 pass                        |
| 2   | strategy preserved                 | `{ strategy: 'btp-saml' }`                              | `error.strategy === 'btp-saml'`    |
| 3   | loginUrl preserved                 | `{ loginUrl: 'https://...' }`                           | `error.loginUrl` matches           |
| 4   | toJSON includes strategy           | Full options                                            | `JSON.parse(...).strategy` present |
| 5   | session expired retryable override | `{ code: 'ERR_AUTH_SESSION_EXPIRED', retryable: true }` | `error.retryable === true`         |

Total: 10 (shared) + 5 (specific) = 15 tests

**File: `src/core/errors/navigation-error.ts`**

```typescript
export interface NavigationErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_NAV_TILE_NOT_FOUND
    | typeof ErrorCode.ERR_NAV_ROUTE_FAILED
    | typeof ErrorCode.ERR_NAV_TIMEOUT;
  readonly targetUrl?: string;
  readonly currentUrl?: string;
}

export class NavigationError extends PramanError {
  readonly targetUrl?: string;
  readonly currentUrl?: string;
  constructor(options: NavigationErrorOptions);
}
```

**Unit Tests** (`tests/unit/core/errors/navigation-error.test.ts`):

| #   | Test Case                         | Input                                     | Expected                   |
| --- | --------------------------------- | ----------------------------------------- | -------------------------- |
| 1   | Base behavior (10 tests)          | `runBaseErrorTests(NavigationError, ...)` | All 10 pass                |
| 2   | targetUrl preserved               | `{ targetUrl: '/app#PO-create' }`         | `error.targetUrl` matches  |
| 3   | currentUrl preserved              | `{ currentUrl: '/app#home' }`             | `error.currentUrl` matches |
| 4   | toUserMessage includes URLs       | Both URLs set                             | Message contains both URLs |
| 5   | toJSON includes navigation fields | Full options                              | Both URLs in JSON          |

Total: 10 (shared) + 5 (specific) = 15 tests

**File: `src/core/errors/odata-error.ts`**

```typescript
export interface ODataErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_ODATA_REQUEST_FAILED
    | typeof ErrorCode.ERR_ODATA_PARSE
    | typeof ErrorCode.ERR_ODATA_CSRF;
  readonly statusCode?: number;
  readonly requestUrl?: string;
  readonly entitySet?: string;
}

export class ODataError extends PramanError {
  readonly statusCode?: number;
  readonly requestUrl?: string;
  readonly entitySet?: string;
  constructor(options: ODataErrorOptions);
}
```

**Unit Tests** (`tests/unit/core/errors/odata-error.test.ts`):

| #   | Test Case                | Input                                  | Expected                          |
| --- | ------------------------ | -------------------------------------- | --------------------------------- |
| 1   | Base behavior (10 tests) | `runBaseErrorTests(ODataError, ...)`   | All 10 pass                       |
| 2   | statusCode preserved     | `{ statusCode: 403 }`                  | `error.statusCode === 403`        |
| 3   | requestUrl preserved     | `{ requestUrl: '/sap/opu/odata/...' }` | Matches                           |
| 4   | entitySet preserved      | `{ entitySet: 'PurchaseOrders' }`      | Matches                           |
| 5   | CSRF error code          | `{ code: 'ERR_ODATA_CSRF' }`           | `error.code === 'ERR_ODATA_CSRF'` |

Total: 10 (shared) + 5 (specific) = 15 tests

**File: `src/core/errors/selector-error.ts`**

```typescript
export interface SelectorErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_SELECTOR_INVALID
    | typeof ErrorCode.ERR_SELECTOR_AMBIGUOUS
    | typeof ErrorCode.ERR_SELECTOR_PARSE;
  readonly selectorString?: string;
  readonly parsedSelector?: UI5Selector;
}

export class SelectorError extends PramanError {
  readonly selectorString?: string;
  readonly parsedSelector?: UI5Selector;
  constructor(options: SelectorErrorOptions);
}
```

**Unit Tests** (`tests/unit/core/errors/selector-error.test.ts`):

| #   | Test Case                       | Input                                                 | Expected                                     |
| --- | ------------------------------- | ----------------------------------------------------- | -------------------------------------------- |
| 1   | Base behavior (10 tests)        | `runBaseErrorTests(SelectorError, ...)`               | All 10 pass                                  |
| 2   | selectorString preserved        | `{ selectorString: 'ui5=sap.m.Button#x' }`            | Matches                                      |
| 3   | parsedSelector preserved        | `{ parsedSelector: { controlType: 'sap.m.Button' } }` | Matches                                      |
| 4   | ambiguous code                  | `{ code: 'ERR_SELECTOR_AMBIGUOUS' }`                  | Code matches                                 |
| 5   | suggestions include syntax help | Default options                                       | Suggestions contain selector syntax guidance |

Total: 10 (shared) + 5 (specific) = 15 tests

**File: `src/core/errors/timeout-error.ts`**

```typescript
export interface TimeoutErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_TIMEOUT_UI5_STABLE
    | typeof ErrorCode.ERR_TIMEOUT_CONTROL_DISCOVERY
    | typeof ErrorCode.ERR_TIMEOUT_OPERATION;
  readonly timeoutMs: number; // configured timeout
  readonly elapsed?: number; // actual elapsed time
}

export class TimeoutError extends PramanError {
  readonly timeoutMs: number;
  readonly elapsed?: number;
  constructor(options: TimeoutErrorOptions);
}
```

**Unit Tests** (`tests/unit/core/errors/timeout-error.test.ts`):

| #   | Test Case                             | Input                                  | Expected                            |
| --- | ------------------------------------- | -------------------------------------- | ----------------------------------- |
| 1   | Base behavior (10 tests)              | `runBaseErrorTests(TimeoutError, ...)` | All 10 pass                         |
| 2   | timeoutMs required and preserved      | `{ timeoutMs: 5000 }`                  | `error.timeoutMs === 5000`          |
| 3   | elapsed preserved                     | `{ elapsed: 5200 }`                    | `error.elapsed === 5200`            |
| 4   | elapsed undefined when not provided   | `{ timeoutMs: 5000 }` only             | `error.elapsed === undefined`       |
| 5   | toUserMessage includes timeout values | `{ timeoutMs: 5000, elapsed: 5200 }`   | Message shows "5000ms" and "5200ms" |
| 6   | UI5 stable code                       | `{ code: 'ERR_TIMEOUT_UI5_STABLE' }`   | Code matches                        |

Total: 10 (shared) + 6 (specific) = 16 tests

**File: `src/core/errors/ai-error.ts`**

```typescript
export interface AIErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_AI_PROVIDER_UNAVAILABLE
    | typeof ErrorCode.ERR_AI_RESPONSE_INVALID
    | typeof ErrorCode.ERR_AI_TOKEN_LIMIT
    | typeof ErrorCode.ERR_AI_RATE_LIMITED;
  readonly provider?: string;
  readonly model?: string;
  readonly tokenUsage?: {
    readonly prompt: number;
    readonly completion: number;
    readonly total: number;
  };
}

export class AIError extends PramanError {
  readonly provider?: string;
  readonly model?: string;
  readonly tokenUsage?: {
    readonly prompt: number;
    readonly completion: number;
    readonly total: number;
  };
  constructor(options: AIErrorOptions);
}
```

**Unit Tests** (`tests/unit/core/errors/ai-error.test.ts`):

| #   | Test Case                       | Input                                                         | Expected             |
| --- | ------------------------------- | ------------------------------------------------------------- | -------------------- |
| 1   | Base behavior (10 tests)        | `runBaseErrorTests(AIError, ...)`                             | All 10 pass          |
| 2   | provider preserved              | `{ provider: 'azure-openai' }`                                | Matches              |
| 3   | model preserved                 | `{ model: 'gpt-4o' }`                                         | Matches              |
| 4   | tokenUsage preserved            | `{ tokenUsage: { prompt: 100, completion: 50, total: 150 } }` | All 3 fields match   |
| 5   | rate limited code               | `{ code: 'ERR_AI_RATE_LIMITED' }`                             | Code matches         |
| 6   | rate limited retryable override | `{ code: 'ERR_AI_RATE_LIMITED', retryable: true }`            | `retryable === true` |

Total: 10 (shared) + 6 (specific) = 16 tests

**File: `src/core/errors/plugin-error.ts`**

```typescript
export interface PluginErrorOptions extends Omit<PramanErrorOptions, 'code'> {
  readonly code?:
    | typeof ErrorCode.ERR_PLUGIN_LOAD
    | typeof ErrorCode.ERR_PLUGIN_INIT
    | typeof ErrorCode.ERR_PLUGIN_INCOMPATIBLE;
  readonly pluginName: string;
  readonly pluginVersion?: string;
}

export class PluginError extends PramanError {
  readonly pluginName: string;
  readonly pluginVersion?: string;
  constructor(options: PluginErrorOptions);
}
```

**Unit Tests** (`tests/unit/core/errors/plugin-error.test.ts`):

| #   | Test Case                         | Input                                 | Expected                             |
| --- | --------------------------------- | ------------------------------------- | ------------------------------------ |
| 1   | Base behavior (10 tests)          | `runBaseErrorTests(PluginError, ...)` | All 10 pass                          |
| 2   | pluginName required and preserved | `{ pluginName: 'my-plugin' }`         | Matches                              |
| 3   | pluginVersion preserved           | `{ pluginVersion: '2.0.0' }`          | Matches                              |
| 4   | toJSON includes pluginName        | Full options                          | `JSON.parse(...).pluginName` present |
| 5   | incompatible code                 | `{ code: 'ERR_PLUGIN_INCOMPATIBLE' }` | Code matches                         |

Total: 10 (shared) + 5 (specific) = 15 tests

**Summary Table**:

| File                  | Class           | Error Codes     | Special Fields                                          | Tests |
| --------------------- | --------------- | --------------- | ------------------------------------------------------- | ----- |
| `config-error.ts`     | ConfigError     | ERR*CONFIG*\*   | validationErrors, configPath                            | 8     |
| `bridge-error.ts`     | BridgeError     | ERR*BRIDGE*\*   | ui5Version, adapterType                                 | 5     |
| `control-error.ts`    | ControlError    | ERR*CONTROL*\*  | lastKnownSelector, availableControls, suggestedSelector | 8     |
| `auth-error.ts`       | AuthError       | ERR*AUTH*\*     | strategy, loginUrl                                      | 5     |
| `navigation-error.ts` | NavigationError | ERR*NAV*\*      | targetUrl, currentUrl                                   | 5     |
| `odata-error.ts`      | ODataError      | ERR*ODATA*\*    | statusCode, requestUrl, entitySet                       | 5     |
| `selector-error.ts`   | SelectorError   | ERR*SELECTOR*\* | selectorString, parsedSelector                          | 5     |
| `timeout-error.ts`    | TimeoutError    | ERR*TIMEOUT*\*  | timeoutMs, elapsed                                      | 6     |
| `ai-error.ts`         | AIError         | ERR*AI*\*       | provider, model, tokenUsage                             | 6     |
| `plugin-error.ts`     | PluginError     | ERR*PLUGIN*\*   | pluginName, pluginVersion                               | 5     |

**Error Subclass `retryable` Defaults**:

Each subclass makes `retryable` optional in its Options interface and applies a
sensible default in the constructor. Callers can always override.

| Subclass        | Default `retryable` | Rationale                                             |
| --------------- | ------------------- | ----------------------------------------------------- |
| ConfigError     | `false`             | Config errors are deterministic — retrying won't help |
| BridgeError     | `true`              | Bridge may recover after page navigation/reload       |
| ControlError    | `true`              | Control may appear after UI5 stabilizes               |
| AuthError       | `false`             | Auth failures need credential/config fix              |
| NavigationError | `true`              | Navigation may succeed after brief wait               |
| ODataError      | `true`              | Network transient errors are retryable                |
| SelectorError   | `false`             | Selector syntax errors are deterministic              |
| TimeoutError    | `true`              | Operation may succeed with longer timeout             |
| AIError         | `true`              | API rate limits / transient failures                  |
| PluginError     | `false`             | Plugin load/init errors need config fix               |

**Error Subclass Default `code` Values**:

| Subclass        | Default `code`                | When no code provided     |
| --------------- | ----------------------------- | ------------------------- |
| ConfigError     | `ERR_CONFIG_INVALID`          | Most common config error  |
| BridgeError     | `ERR_BRIDGE_NOT_READY`        | Bridge not initialized    |
| ControlError    | `ERR_CONTROL_NOT_FOUND`       | Control discovery failure |
| AuthError       | `ERR_AUTH_FAILED`             | Generic auth failure      |
| NavigationError | `ERR_NAV_ROUTE_FAILED`        | Route not reached         |
| ODataError      | `ERR_ODATA_REQUEST_FAILED`    | Request failure           |
| SelectorError   | `ERR_SELECTOR_INVALID`        | Malformed selector        |
| TimeoutError    | `ERR_TIMEOUT_OPERATION`       | Generic timeout           |
| AIError         | `ERR_AI_PROVIDER_UNAVAILABLE` | Provider not reachable    |
| PluginError     | `ERR_PLUGIN_LOAD`             | Plugin couldn't load      |

**Total Estimated LOC for errors/**: ~500
**Total Tests**: ~177 (100% coverage — Tier 1, includes 10 shared base tests × 10 subclasses via helper)

---

## 6. Sub-Phase 1.2 — Infrastructure

**Scope**: Logging + OTel + Compat + Utils
**Gate**: `npm run ci` passes. 95%+ coverage on all `core/` modules.

### 6.1 Module: core/logging/

#### 6.1.1 File: `src/core/logging/redaction.ts`

**Purpose**: Define paths for secret redaction in pino logs.

```typescript
export const REDACTION_PATHS: readonly string[] = [
  '*.password',
  '*.token',
  '*.apiKey',
  '*.secret',
  '*.authorization',
  '*.cookie',
  '*.sessionId',
  '*.credentials',
  'auth.password',
  'auth.token',
  'config.ai.apiKey',
];

export function createRedactConfig(): { paths: readonly string[]; censor: string };
```

**Estimated LOC**: ~30
**Tests**: 5 test cases

**Unit Tests** (`tests/unit/core/logging/redaction.test.ts`):

| #   | Test Case                                | Input                         | Expected                                                 |
| --- | ---------------------------------------- | ----------------------------- | -------------------------------------------------------- |
| 1   | REDACTION_PATHS has minimum entries      | `REDACTION_PATHS`             | `.length >= 10`                                          |
| 2   | All paths are valid pino redact format   | Each path                     | Matches `*.(name)` or `path.to.field` pattern            |
| 3   | createRedactConfig returns correct shape | `createRedactConfig()`        | Has `paths` (array) and `censor` (string)                |
| 4   | Censor string is `[Redacted]`            | `createRedactConfig().censor` | `=== '[Redacted]'`                                       |
| 5   | Known sensitive fields covered           | REDACTION_PATHS               | Contains `*.password`, `*.token`, `*.apiKey`, `*.secret` |

#### 6.1.2 File: `src/core/logging/logger.ts`

**Purpose**: pino logger factory. Creates root logger + child logger factory.

```typescript
export interface LoggerOptions {
  readonly level?: LogLevel; // default: config.logLevel, fallback: 'info'
  readonly prettyPrint?: boolean; // default: true when NODE_ENV !== 'production' and CI is unset
  readonly redact?: boolean; // default: true (always redact secrets)
}

export function createRootLogger(config: Readonly<PramanConfig>): pino.Logger;
export function createLogger(module: string, parentLogger?: pino.Logger): pino.Logger;

/** Returns a cached root logger instance. Creates with defaults on first call. */
export function getDefaultLogger(): pino.Logger;
```

**Estimated LOC**: ~80
**Tests**: 10 test cases

**Unit Tests** (`tests/unit/core/logging/logger.test.ts`):

| Test Case                           | Description                                 |
| ----------------------------------- | ------------------------------------------- |
| Creates root logger                 | Returns pino instance                       |
| Respects log level from config      | `info` level → debug messages not logged    |
| Creates child logger                | Has module binding                          |
| Default logger works without config | Falls back to 'info'                        |
| Redaction removes passwords         | Log `{ password: 'secret' }` → `[Redacted]` |
| Pretty print in dev                 | When enabled, uses pino-pretty transport    |
| JSON output in prod                 | No pretty → raw JSON                        |
| Child logger inherits level         | Parent level propagates                     |
| Multiple child loggers independent  | Different module bindings                   |
| Logger is singleton-safe            | Multiple calls return same root             |

### 6.2 Module: core/telemetry/

#### 6.2.1 File: `src/core/telemetry/otel.ts`

**Purpose**: Initialize OpenTelemetry with lazy loading. Zero-overhead when disabled.

```typescript
export interface TracerWrapper {
  startSpan(name: string, attributes?: Record<string, string>): SpanWrapper;
  withSpan<T>(name: string, fn: () => Promise<T>): Promise<T>;
  recordException(span: SpanWrapper, error: Error): void;
  shutdown(): Promise<void>;
}

export interface SpanWrapper {
  end(): void;
  setAttribute(key: string, value: string | number | boolean): void;
  setStatus(code: 'ok' | 'error', message?: string): void;
  addEvent(name: string, attributes?: Record<string, string>): void;
}

export function initTelemetry(config: Readonly<PramanConfig>): Promise<TracerWrapper>;
export function getNoOpTracer(): TracerWrapper;
```

**Estimated LOC**: ~100
**Tests**: 10 test cases

**Mock Strategy**: Use `vi.doMock` for dynamic `import('@opentelemetry/api')`.
Mock the OTel SDK classes (`NodeTracerProvider`, `SimpleSpanProcessor`) as vi.fn()
constructors. For "not installed" tests, make `vi.doMock` reject with
`ERR_MODULE_NOT_FOUND`. For "installed" tests, return mock SDK objects.

**Unit Tests** (`tests/unit/core/telemetry/otel.test.ts`):

| #   | Test Case                              | Input                                    | Expected                                                              |
| --- | -------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| 1   | Disabled returns NoOpTracer            | `config.telemetry.openTelemetry: false`  | `getNoOpTracer()` returned                                            |
| 2   | NoOpTracer.startSpan is no-op          | Call `startSpan('test')`                 | Returns SpanWrapper, no errors                                        |
| 3   | NoOpTracer.withSpan executes fn        | `withSpan('test', () => 42)`             | Returns 42, no span created                                           |
| 4   | OTel not installed → NoOpTracer        | `vi.doMock` rejects import               | NoOpTracer returned + warning logged                                  |
| 5   | Enabled + installed → real tracer      | Mock OTel SDK available                  | TracerWrapper with real methods                                       |
| 6   | withSpan wraps function                | Mock span, call wrapped fn               | `span.end()` called after fn                                          |
| 7   | withSpan records exception on throw    | fn throws Error                          | `span.recordException()` called, error re-thrown, `span.end()` called |
| 8   | shutdown is idempotent                 | Call `shutdown()` twice                  | No throw on second call                                               |
| 9   | Span attributes set correctly          | `startSpan('test', { key: 'val' })`      | `span.setAttribute('key', 'val')` called                              |
| 10  | Partial OTel install (api without sdk) | `@opentelemetry/api` exists, sdk doesn't | NoOpTracer + specific warning                                         |

#### 6.2.2 File: `src/core/telemetry/spans.ts`

**Purpose**: Convenience span helpers and decorators for common operations.

```typescript
/**
 * Decorator for auto-tracing method calls. Returns no-op decorator in Phase 1.
 * Phase 2 wires it to the active TracerWrapper.
 */
export function traceOperation(name: string): MethodDecorator;

/** Build standardized span name: 'praman.<module>.<operation>' */
export function createSpanName(module: string, operation: string): string;

/**
 * Extract OTel-standard attributes from a UI5Selector.
 * Returns: { 'ui5.controlType': string, 'ui5.id': string, 'ui5.viewName': string }
 */
export function spanAttributes(selector?: UI5Selector): Record<string, string>;
```

**Estimated LOC**: ~60
**Tests**: 7 test cases

**Unit Tests** (`tests/unit/core/telemetry/spans.test.ts`):

| #   | Test Case                              | Input                                                         | Expected                                                  |
| --- | -------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------- |
| 1   | traceOperation returns no-op decorator | `@traceOperation('test')`                                     | Method executes normally, no span                         |
| 2   | createSpanName format                  | `createSpanName('config', 'load')`                            | `'praman.config.load'`                                    |
| 3   | createSpanName with special chars      | `createSpanName('selector', 'parse')`                         | `'praman.selector.parse'`                                 |
| 4   | spanAttributes from selector           | `spanAttributes({ controlType: 'sap.m.Button', id: 'btn1' })` | `{ 'ui5.controlType': 'sap.m.Button', 'ui5.id': 'btn1' }` |
| 5   | spanAttributes with empty selector     | `spanAttributes({})`                                          | Empty object `{}`                                         |
| 6   | spanAttributes with undefined          | `spanAttributes(undefined)`                                   | Empty object `{}`                                         |
| 7   | spanAttributes skips undefined fields  | `spanAttributes({ controlType: 'sap.m.Button' })`             | Only `ui5.controlType`, no `ui5.id`                       |

### 6.3 Module: core/compat/

#### 6.3.1 File: `src/core/compat/playwright-compat.ts`

**Purpose**: Detect Playwright version and normalize API differences.

```typescript
import { createRequire } from 'node:module';
import { parseSemVer, isAtLeast } from '#core/utils/version-compare.js';
import { PramanError } from '#core/errors/base.js';

// Note: @playwright/test does NOT export `version` directly (verified 1.58.2).
// Use createRequire to read @playwright/test/package.json for the version string.
// Do NOT: import { version } from '@playwright/test'; // This does not exist.

export interface PlaywrightVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly raw: string;
}

export interface PlaywrightFeatures {
  readonly hasRouteFromHAR: boolean; // 1.23+
  readonly hasScreenshotCaret: boolean; // 1.36+
  readonly hasClockAPI: boolean; // 1.45+
  readonly hasAriaSnapshot: boolean; // 1.49+
  readonly hasCustomExpect: boolean; // 1.44+ (expect.extend)
  readonly hasLocatorAssertions: boolean; // 1.20+
  readonly hasFilterLocator: boolean; // 1.22+
  readonly hasBoxedStep: boolean; // 1.38+ (test.step with box option)
}

export function getPlaywrightVersion(): PlaywrightVersion;
export function getPlaywrightFeatures(): PlaywrightFeatures;
export function hasFeature(feature: keyof PlaywrightFeatures): boolean;
export function assertMinVersion(minVersion: string): void;
```

**Estimated LOC**: ~100
**Tests**: 12 test cases

**Mock Strategy**: Mock `createRequire` via `vi.mock('node:module')` to return a
mock `require` that returns `{ version: '1.58.2' }` when called with
`'@playwright/test/package.json'`. For "missing" tests, make it throw.

**Unit Tests** (`tests/unit/core/compat/playwright-compat.test.ts`):

| #   | Test Case                       | Input / Mock                            | Expected                                                              |
| --- | ------------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| 1   | Parses version correctly        | Mock version `'1.58.2'`                 | `{ major: 1, minor: 58, patch: 2, raw: '1.58.2' }`                    |
| 2   | Features for 1.50.0             | Mock version `'1.50.0'`                 | `hasRouteFromHAR: true`, `hasClockAPI: true`, `hasAriaSnapshot: true` |
| 3   | Features for 1.58.0             | Mock version `'1.58.0'`                 | All features `true` (latest tested)                                   |
| 4   | Features for 1.19.0 (below all) | Mock version `'1.19.0'`                 | All features `false`                                                  |
| 5   | assertMinVersion passes         | Current `'1.58.2'`, min `'1.50.0'`      | No throw                                                              |
| 6   | assertMinVersion throws         | Current `'1.45.0'`, min `'1.50.0'`      | Throws PramanError                                                    |
| 7   | assertMinVersion error message  | Current `'1.45.0'`, min `'1.50.0'`      | Message includes both versions                                        |
| 8   | hasFeature known feature        | `hasFeature('hasClockAPI')`             | Boolean based on version                                              |
| 9   | Missing Playwright gracefully   | `createRequire` throws MODULE_NOT_FOUND | Returns fallback or throws descriptive error                          |
| 10  | Version comparison: same major  | `'1.50.0'` vs `'1.50.1'`                | Correctly handles patch difference                                    |
| 11  | Version comparison: major diff  | `'1.58.0'` vs `'2.0.0'`                 | Correctly detects major change                                        |
| 12  | Version with prerelease         | `'1.50.0-beta.1'`                       | Parses without error, prerelease stored                               |

**Note**: `path-helpers.ts` already exists from Phase 0 (132 LOC, fully implemented). No changes needed.

### 6.4 Module: core/utils/

#### 6.4.1 File: `src/core/utils/wait-helpers.ts`

**Purpose**: UI5 stability wait using Playwright-native `page.waitForFunction()` with WalkMe-aware bypass.

**Key Design Decision (W8)**: Lean on Playwright's native auto-wait for DOM
interactions/assertions. Build a layered stability system inspired by dhikraft's
"more careful" approach and wdi5's RecordReplay integration.

**Learnings from wdi5**:

- `RecordReplay.waitForUI5()` is the core stability API
  (polls autowaiter, default timeout 15s, interval 400ms)
- `waitForUI5` is called before EVERY control operation
- Per-selector `_skipWaitForUI5` flag allows bypassing
- XHR/Fetch patching to exclude long-polling URLs from autowaiter

**Learnings from dhikraft (the "more careful" approach)**:

- Pre-configured WalkMe URL patterns as first-class constants
- Two-method WalkMe bypass: `skipStabilityWait` flag OR fine-grained `ignoreAutoWaitUrls`
- When `skipStabilityWait=true`: brief 500ms DOM settle (not zero!) then direct registry access
- Visibility-aware control finding: prefer visible, fall back to hidden (overlays)
- Configuration stacking: global → handler → per-selector override

**Phase 1 Implementation — 3-tier stability**:

```typescript
import type { Page } from '@playwright/test';
import { TimeoutError } from '#core/errors/timeout-error.js';
import { DEFAULT_TIMEOUTS } from './constants.js';

export interface WaitForUI5StableOptions {
  readonly timeout?: number; // default: config.ui5WaitTimeout (30_000ms). Fallback: DEFAULT_TIMEOUTS.UI5_WAIT (15_000ms) if no config.
  readonly polling?: number; // default: 100ms
  readonly message?: string; // custom timeout error message
  readonly skipStabilityWait?: boolean; // per-call override (dhikraft pattern)
  readonly ignoreAutoWaitUrls?: readonly string[]; // per-call URL ignore patterns
}

/**
 * Tier 1: Full UI5 stability wait via page.waitForFunction().
 * Checks both sap.ui.getCore().getUIPending() AND RecordReplay autowaiter
 * (when available). Respects ignoreAutoWaitUrls for WalkMe compatibility.
 *
 * If skipStabilityWait is true, falls through to briefDOMSettle() instead.
 */
export async function waitForUI5Stable(
  page: Page,
  options?: WaitForUI5StableOptions,
): Promise<void>;

/**
 * Tier 2: Brief DOM settle (500ms) — used when skipStabilityWait=true.
 * Inspired by dhikraft: even when skipping full stability, don't rush
 * into action. Waits for two animation frames to ensure DOM is settled.
 */
export async function briefDOMSettle(
  page: Page,
  durationMs?: number, // default: 500
): Promise<void>;

/**
 * Tier 3: Wait for UI5 bootstrap to complete (initial page load).
 * Polls for window.sap.ui.getCore existence, then waits for
 * core libraries to load. Used once per page navigation.
 */
export async function waitForUI5Bootstrap(
  page: Page,
  options?: { timeout?: number },
): Promise<void>;
```

**Estimated LOC**: ~120
**Tests**: 15 test cases (mock `page.waitForFunction()`)

**Unit Tests** (`tests/unit/core/utils/wait-helpers.test.ts`):

| Test Case                                              | Description                             |
| ------------------------------------------------------ | --------------------------------------- |
| waitForUI5Stable: UI5 ready immediately                | page.waitForFunction resolves instantly |
| waitForUI5Stable: polls until ready                    | Multiple checks before stable           |
| waitForUI5Stable: timeout throws TimeoutError          | Exceeds timeout → structured error      |
| waitForUI5Stable: respects custom timeout              | Options override default                |
| waitForUI5Stable: skipStabilityWait → briefDOMSettle   | Falls through to brief wait             |
| waitForUI5Stable: ignoreAutoWaitUrls passed to browser | URLs propagated correctly               |
| briefDOMSettle: waits specified duration               | 500ms default, configurable             |
| briefDOMSettle: custom duration                        | 250ms override works                    |
| waitForUI5Bootstrap: sap.ui exists                     | Resolves immediately                    |
| waitForUI5Bootstrap: polls for sap.ui                  | Multiple checks                         |
| waitForUI5Bootstrap: timeout throws                    | Exceeds timeout                         |
| waitForUI5Bootstrap: checks core libraries             | Verifies getCore() exists               |
| Per-call options override global config                | Selector-level override works           |
| Config stacking: global → per-call                     | Per-call takes precedence               |
| Missing page argument throws                           | Null page → PramanError                 |

#### 6.4.1a File: `src/core/utils/constants.ts` (NEW)

**Purpose**: Shared constants including pre-configured WalkMe URL patterns.

**Inspired by dhikraft**: `/src/lib/ui5-bridge/constants.ts` lines 155-183.

```typescript
/**
 * Default URL patterns to exclude from UI5 autowaiter.
 * These are long-polling, analytics, and overlay services that
 * prevent UI5 from reporting "stable" state.
 *
 * @remarks
 * WalkMe is the primary offender in SAP BTP environments.
 * These patterns are pre-configured so users don't need to discover
 * them. Additional patterns can be added via config.ignoreAutoWaitUrls.
 *
 * Source: dhikraft v2.5.0 constants.ts (field-tested in production SAP systems)
 */
export const WALKME_DEFAULT_PATTERNS: readonly string[] = [
  'walkme\\.com',
  'walkme\\.cloud\\.sap',
  'walkmeusercontent\\.com',
  'cdn\\.walkme\\.com',
  'ec\\.walkme\\.com',
  'papi\\.walkme\\.com',
] as const;

export const ANALYTICS_DEFAULT_PATTERNS: readonly string[] = [
  'analytics\\.google',
  'googletagmanager\\.com',
  'siteintercept\\.qualtrics\\.com',
  'launchdarkly\\.com',
] as const;

export const DEFAULT_IGNORE_PATTERNS: readonly string[] = [
  ...WALKME_DEFAULT_PATTERNS,
  ...ANALYTICS_DEFAULT_PATTERNS,
] as const;

/** Default timeouts (aligned with dhikraft/wdi5 field-tested values) */
export const DEFAULT_TIMEOUTS = {
  UI5_WAIT: 15_000, // wdi5 default: 15s, dhikraft: 15s
  CONTROL_DISCOVERY: 10_000, // Control find timeout
  UI5_BOOTSTRAP: 60_000, // Initial UI5 load (dhikraft: 60s)
  DOM_SETTLE: 500, // Brief DOM settle (dhikraft: 500ms)
  POLLING_INTERVAL: 100, // Wait loop polling (dhikraft: 100ms)
  CACHE_TTL: 5_000, // Control cache TTL (dhikraft: 5s)
} as const;
```

**Estimated LOC**: ~50
**Tests**: 5 test cases

**Unit Tests** (`tests/unit/core/utils/constants.test.ts`):

| #   | Test Case                          | Input                         | Expected                                       |
| --- | ---------------------------------- | ----------------------------- | ---------------------------------------------- |
| 1   | WALKME patterns are valid regex    | Each pattern                  | `new RegExp(pattern)` doesn't throw            |
| 2   | ANALYTICS patterns are valid regex | Each pattern                  | `new RegExp(pattern)` doesn't throw            |
| 3   | DEFAULT_IGNORE combines both       | `DEFAULT_IGNORE_PATTERNS`     | `.length === WALKME.length + ANALYTICS.length` |
| 4   | All timeouts are positive integers | Each `DEFAULT_TIMEOUTS` value | `> 0` and `Number.isInteger()`                 |
| 5   | Known WalkMe URLs matched          | `'cdn.walkme.com/script.js'`  | Matched by at least one pattern                |

#### 6.4.2 File: `src/core/utils/retry.ts`

**Purpose**: Lightweight retry for non-Playwright async operations (config loading, OTel init, etc.). NOT for UI interactions — those use Playwright's native auto-retry.

```typescript
export interface RetryOptions {
  readonly maxRetries?: number; // default: 3
  readonly baseDelay?: number; // default: 100ms
  readonly maxDelay?: number; // default: 5000ms
  readonly jitter?: boolean; // default: true (Google SRE)
  readonly signal?: AbortSignal; // cancellation support
  readonly shouldRetry?: (error: Error, attempt: number) => boolean;
}

export async function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;

// Utility: calculate delay with exponential backoff + jitter
export function calculateBackoff(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitter: boolean,
): number;
```

**Estimated LOC**: ~70
**Tests**: 12 test cases

**Unit Tests** (`tests/unit/core/utils/retry.test.ts`):

| Test Case                        | Description                                   |
| -------------------------------- | --------------------------------------------- |
| Succeeds on first try            | No retries needed                             |
| Retries on failure then succeeds | Fails 2x, succeeds 3rd                        |
| Exhausts retries → throws        | All attempts fail → last error thrown         |
| Exponential backoff timing       | Delay doubles each attempt                    |
| Jitter adds randomness           | Delay varies between attempts                 |
| Max delay capped                 | Never exceeds maxDelay                        |
| AbortSignal cancels              | Signal aborted → stops retrying               |
| Custom shouldRetry filter        | Only retries specific errors                  |
| Zero maxRetries                  | Throws immediately on failure                 |
| Default options work             | All defaults applied correctly                |
| calculateBackoff math            | Verify formula: base \* 2^attempt + jitter    |
| Non-retryable error skips retry  | `shouldRetry` returns false → immediate throw |

#### 6.4.3 File: `src/core/utils/step-decorator.ts`

**Purpose**: Wrapper around Playwright's `test.step()` for structured step reporting.
Gracefully degrades when called outside a test context (e.g., standalone scripts).

```typescript
import { test } from '@playwright/test';

/**
 * Wraps `fn` in a Playwright `test.step()` for structured trace/report output.
 * If called outside a Playwright test context, executes `fn` directly (no-op wrapper).
 * Errors from `fn` are propagated — step marks itself as failed.
 *
 * @param stepName - Human-readable step name (shown in Playwright trace/report)
 * @param fn - Async function to execute inside the step
 * @returns The return value of `fn`
 */
export async function withStep<T>(stepName: string, fn: () => Promise<T>): Promise<T>;

/**
 * Build a standardized step name: "module > action: target"
 * Example: createStepName('selector', 'parse', 'ui5=sap.m.Button#save')
 *          → 'selector > parse: ui5=sap.m.Button#save'
 */
export function createStepName(module: string, action: string, target?: string): string;
```

**Estimated LOC**: ~40
**Tests**: 7 test cases

**Unit Tests** (`tests/unit/core/utils/step-decorator.test.ts`):

| #   | Test Case                               | Input                                                     | Expected                               |
| --- | --------------------------------------- | --------------------------------------------------------- | -------------------------------------- |
| 1   | withStep executes fn and returns result | `withStep('test', async () => 42)`                        | Returns `42`                           |
| 2   | withStep propagates errors              | `withStep('test', async () => { throw new Error('x') })`  | Throws `Error('x')`                    |
| 3   | createStepName without target           | `createStepName('selector', 'parse')`                     | `'selector > parse'`                   |
| 4   | createStepName with target              | `createStepName('selector', 'parse', 'ui5=sap.m.Button')` | `'selector > parse: ui5=sap.m.Button'` |
| 5   | createStepName empty target             | `createStepName('selector', 'parse', '')`                 | `'selector > parse'` (no colon)        |
| 6   | withStep outside test context           | No Playwright test context                                | Executes fn directly (no error)        |
| 7   | withStep async error preserves stack    | fn throws PramanError                                     | Error stack intact                     |

#### 6.4.4 File: `src/core/utils/version-compare.ts`

**Purpose**: Semver comparison utilities for Playwright and UI5 version checks.

```typescript
export interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: string;
}

export function parseSemVer(version: string): SemVer; // throws PramanError on invalid input
export function compareSemVer(a: SemVer, b: SemVer): -1 | 0 | 1;

/**
 * Check if version satisfies a simple range expression.
 * Supported formats: '>=1.50.0', '>=1.50.0 <2.0.0', '^1.50.0', '~1.50.0'
 * NOT a full npm semver implementation — covers Playwright/UI5 version checks only.
 */
export function satisfiesRange(version: SemVer, range: string): boolean;
export function isAtLeast(version: string, minimum: string): boolean;
```

**Estimated LOC**: ~70
**Tests**: 18 test cases

**Unit Tests** (`tests/unit/core/utils/version-compare.test.ts`):

| #   | Test Case                    | Function         | Input                       | Expected                            |
| --- | ---------------------------- | ---------------- | --------------------------- | ----------------------------------- |
| 1   | Parse valid version          | `parseSemVer`    | `'1.50.0'`                  | `{ major: 1, minor: 50, patch: 0 }` |
| 2   | Parse with prerelease        | `parseSemVer`    | `'1.50.0-beta.1'`           | `{ ..., prerelease: 'beta.1' }`     |
| 3   | Parse invalid string         | `parseSemVer`    | `'not-a-version'`           | Throws PramanError                  |
| 4   | Parse empty string           | `parseSemVer`    | `''`                        | Throws PramanError                  |
| 5   | Parse partial version        | `parseSemVer`    | `'1.50'`                    | Throws PramanError (need all 3)     |
| 6   | Compare: a < b               | `compareSemVer`  | `1.49.0` vs `1.50.0`        | `-1`                                |
| 7   | Compare: a === b             | `compareSemVer`  | `1.50.0` vs `1.50.0`        | `0`                                 |
| 8   | Compare: a > b               | `compareSemVer`  | `1.51.0` vs `1.50.0`        | `1`                                 |
| 9   | Compare: major difference    | `compareSemVer`  | `2.0.0` vs `1.99.99`        | `1`                                 |
| 10  | Compare: patch difference    | `compareSemVer`  | `1.50.0` vs `1.50.1`        | `-1`                                |
| 11  | Range: >= passes             | `satisfiesRange` | `1.50.0`, `>=1.50.0`        | `true`                              |
| 12  | Range: >= fails              | `satisfiesRange` | `1.49.9`, `>=1.50.0`        | `false`                             |
| 13  | Range: ^ passes (minor bump) | `satisfiesRange` | `1.50.1`, `^1.50.0`         | `true`                              |
| 14  | Range: ^ fails (major bump)  | `satisfiesRange` | `2.0.0`, `^1.50.0`          | `false`                             |
| 15  | Range: ~ passes (patch bump) | `satisfiesRange` | `1.50.9`, `~1.50.0`         | `true`                              |
| 16  | Range: ~ fails (minor bump)  | `satisfiesRange` | `1.51.0`, `~1.50.0`         | `false`                             |
| 17  | Range: compound              | `satisfiesRange` | `1.55.0`, `>=1.50.0 <2.0.0` | `true`                              |
| 18  | isAtLeast shorthand          | `isAtLeast`      | `'1.58.2'`, `'1.50.0'`      | `true`                              |

---

## 7. Sub-Phase 1.3 — Playwright Integration

**Scope**: BridgeAdapter interface + Selectors + Matchers
**Gate**: `npm run ci` passes. Full Phase 1 coverage met. Build succeeds.

### 7.1 Module: bridge/adapter.ts (Interface Only)

**Purpose**: Define the `BridgeAdapter` interface that all bridge implementations (Phase 2) will implement. Phase 1 only defines the interface — no implementation.

```typescript
export interface BridgeAdapter {
  // Lifecycle
  init(page: Page): Promise<void>;
  isReady(): Promise<boolean>;
  destroy(): Promise<void>;

  // Version detection
  getUI5Version(): Promise<string>;
  isWebComponent(): Promise<boolean>;

  // Control discovery
  findControl(selector: UI5Selector): Promise<UI5ControlBase | null>;
  findControls(selector: UI5Selector): Promise<readonly UI5ControlBase[]>;

  // Control interaction
  getControlProperty(controlId: string, propertyName: string): Promise<unknown>;
  setControlProperty(controlId: string, propertyName: string, value: unknown): Promise<void>;
  getControlAggregation(
    controlId: string,
    aggregationName: string,
  ): Promise<readonly UI5ControlBase[]>;
  executeControlMethod(
    controlId: string,
    methodName: string,
    args: readonly unknown[],
  ): Promise<unknown>;

  // UI5 stability
  waitForUI5Stable(timeout?: number): Promise<void>;

  // Object access
  getModel(controlId: string, modelName?: string): Promise<unknown>;
  getBindingContext(controlId: string, modelName?: string): Promise<unknown>;

  // Introspection (AI-first)
  describeControl(controlId: string): Promise<Record<string, unknown>>;
  getAvailableMethods(controlId: string): Promise<readonly string[]>;
}
```

**Estimated LOC**: ~80
**Tests**: 3 test cases (type verification, mock adapter satisfies interface)

### 7.2 Module: selectors/

#### 7.2.1 File: `src/selectors/selector-parser.ts`

**Purpose**: Parse UI5 selector strings into structured `UI5Selector` objects.

**Selector Syntax**:

```text
ui5=controlType#id[prop1=val1][prop2=val2]
ui5=sap.m.Button#saveBtn[text=Save]
ui5=#myId                                    (ID-only)
ui5=sap.m.Input[placeholder=Enter name]      (type + property)
ui5=sap.m.Table > sap.m.ColumnListItem       (ancestor)
```

```typescript
export function parseUI5Selector(selectorString: string): UI5Selector;
export function serializeUI5Selector(selector: UI5Selector): string;
export function validateUI5Selector(selector: UI5Selector): readonly string[]; // returns validation errors
export function isUI5SelectorString(value: string): value is UI5SelectorString;
```

**Estimated LOC**: ~120
**Tests**: 29 test cases

**Unit Tests** (`tests/unit/selectors/selector-parser.test.ts`):

| Test Case                          | Description                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| Parse type only                    | `ui5=sap.m.Button` → `{ controlType: 'sap.m.Button' }`                                   |
| Parse ID only                      | `ui5=#myId` → `{ id: 'myId' }`                                                           |
| Parse type + ID                    | `ui5=sap.m.Button#saveBtn` → both fields                                                 |
| Parse single property              | `ui5=sap.m.Input[placeholder=Name]` → property parsed                                    |
| Parse multiple properties          | `[text=Save][enabled=true]` → multiple properties                                        |
| Parse type + ID + properties       | Full combination                                                                         |
| Parse RegExp ID                    | `ui5=#/pattern/` → `{ id: /pattern/ }`                                                   |
| Parse ancestor selector            | `ui5=sap.m.Table > sap.m.Button` → ancestor field                                        |
| Parse viewName                     | `ui5=sap.m.Button{viewName=Main}` → viewName field                                       |
| Serialize round-trip               | parse → serialize → parse === original                                                   |
| Invalid: empty string              | Throws SelectorError                                                                     |
| Invalid: missing ui5= prefix       | Throws SelectorError                                                                     |
| Invalid: malformed brackets        | Throws SelectorError                                                                     |
| Invalid: empty controlType         | Throws SelectorError                                                                     |
| Validate: missing both type and ID | Returns validation error                                                                 |
| isUI5SelectorString: valid         | Returns true                                                                             |
| isUI5SelectorString: invalid       | Returns false                                                                            |
| Whitespace handling                | Trims and normalizes                                                                     |
| Special characters in values       | Escaped brackets, quotes                                                                 |
| Boolean property coercion          | `[enabled=true]` → boolean true                                                          |
| RegExp ID serialization            | `{ id: /pattern/i }` → `{ id: { source: 'pattern', flags: 'i' } }` for browser transport |
| RegExp ID deserialization          | `{ source: 'pattern', flags: 'i' }` → `/pattern/i`                                       |
| Empty property value               | `ui5=sap.m.Input[placeholder=]` → `{ properties: { placeholder: '' } }`                  |
| Nested brackets in value           | `ui5=sap.m.Button[text=[Save\]]` → SelectorError (brackets must be escaped)              |
| Unicode in property value          | `ui5=sap.m.Label[text=日本語]` → parses correctly to Unicode string                      |
| Multiple `=` in value              | `ui5=sap.m.Input[url=https://sap.com]` → `{ url: 'https://sap.com' }` (first `=` splits) |
| Leading/trailing spaces in ID      | `ui5=# myId` → trimmed to `{ id: 'myId' }`                                               |
| Very long selector (10KB)          | 10,000 char string → SelectorError `ERR_SELECTOR_INVALID` (length limit)                 |
| Recursive ancestor depth >10       | `a > b > c > ... > k` (11 levels) → SelectorError (max depth 10)                         |
| Empty content after prefix         | `ui5=` → SelectorError (no selector content)                                             |
| Property-only selector             | `ui5=[text=Save]` → `{ properties: { text: 'Save' } }` (valid, no type/ID)               |

#### 7.2.2 File: `src/selectors/ui5-selector-engine.ts`

**Purpose**: Register a custom Playwright selector engine for `ui5=...` selectors.

````typescript
import { parseUI5Selector } from './selector-parser.js';

export interface UI5SelectorEngine {
  /**
   * Phase 1: DOM fallback — queries [data-sap-ui] + [id*=controlId] attributes.
   * Phase 2: Delegates to BridgeAdapter.findControl() for full UI5 registry access.
   */
  query(root: HTMLElement, selector: string): HTMLElement | null;
  queryAll(root: HTMLElement, selector: string): HTMLElement[];
}

export function createUI5SelectorEngine(): UI5SelectorEngine;

/**
 * Register the ui5= selector engine with Playwright.
 * Imports `selectors` from `@playwright/test` directly (peer dependency).
 * Uses `selectors.register('ui5', { content: ... })` with the engine script.
 *
 * Must be called ONCE per worker — typically in a worker-scoped auto fixture:
 * ```typescript
 * _selectorEngine: [async ({}, use) => {
 *   await registerUI5SelectorEngine();
 *   await use(undefined);
 * }, { scope: 'worker', auto: true }],
 * ```
 */
export async function registerUI5SelectorEngine(): Promise<void>;
````

**Phase 1 DOM Query Strategy**: When no BridgeAdapter is available, `query()` falls back
to DOM attribute matching: `root.querySelector('[data-sap-ui="${id}"]')` for ID-based
selectors, `root.querySelectorAll('[data-sap-ui-type="${controlType}"]')` for type-based.
This provides basic functionality for non-bridge scenarios and integration test scaffolding.

**RegExp ID Handling**: `RegExp` values in `UI5Selector.id` are NOT JSON-serializable.
The selector engine script receives a serialized selector where RegExp IDs are represented
as `{ source: string, flags: string }`. The browser-side `query()` method reconstructs
the RegExp via `new RegExp(id.source, id.flags)` for attribute matching. Use
`serializeSelectorForBrowser()` from `selectors.ts` before passing to `page.evaluate()`.

**Estimated LOC**: ~80
**Tests**: 8 test cases

### 7.3 Module: matchers/

#### 7.3.1 File: `src/matchers/ui5-matchers.ts`

**Purpose**: Custom Playwright matchers that use `expect.extend()` for web-first auto-retry assertions.

**Key Design Decision (W5)**: Matchers call `BridgeAdapter` interface. Phase 1 tests use a mock adapter.

**Matcher–Adapter Lifecycle (Playwright constraint)**:

`expect.extend()` registers matchers globally and should be called once per worker.
But the `BridgeAdapter` is only available after fixture setup. Solution: **module-level
adapter store** with setter function.

```typescript
// Module-level adapter store (set by fixture, read by matchers)
let _adapter: BridgeAdapter | null = null;

export function setMatcherAdapter(adapter: BridgeAdapter): void {
  _adapter = adapter;
}

// Matchers close over the module variable, not a parameter
const matchers = {
  async toHaveUI5Text(this: ExpectMatcherState, received: Locator, expected: string, options?) {
    if (!_adapter) throw new PramanError({ code: 'ERR_BRIDGE_NOT_READY', ... });
    // ... use _adapter
  }
};
```

Registration happens once per worker (in a worker-scoped auto fixture):

```typescript
// In fixture assembly (Phase 2)
const test = base.extend({
  _matchers: [
    async ({ _adapter }, use) => {
      setMatcherAdapter(_adapter);
      registerUI5Matchers();
      await use(undefined);
    },
    { scope: 'worker', auto: true },
  ],
});
```

For Phase 1 unit tests, `createUI5Matchers(adapter)` creates closured matchers
for direct testing without the module store. Both patterns coexist.

```typescript
export interface UI5Matchers {
  toHaveUI5Text(expected: string | RegExp, options?: { timeout?: number }): Promise<void>;
  toBeUI5Visible(options?: { timeout?: number }): Promise<void>;
  toBeUI5Enabled(options?: { timeout?: number }): Promise<void>;
  toHaveUI5Property(name: string, expected: unknown, options?: { timeout?: number }): Promise<void>;
  toHaveUI5ValueState(expected: string, options?: { timeout?: number }): Promise<void>;
}

// MatcherFunction: Playwright's expect.extend() matcher signature.
// Import: import type { ExpectMatcherState } from '@playwright/test';
// Each matcher receives (this: ExpectMatcherState, receiver: any, ...args).
//
// Verified against @playwright/test 1.58.2 MatcherReturnType:
//   - pass, message: REQUIRED
//   - name, expected, actual, log, timeout: OPTIONAL
type MatcherFunction = (
  this: ExpectMatcherState,
  received: Locator,
  ...args: unknown[]
) => Promise<{
  readonly pass: boolean;
  readonly message: () => string;
  readonly name?: string; // shown in error reports
  readonly expected?: unknown; // shown in error diff
  readonly actual?: unknown; // shown in error diff
  readonly log?: readonly string[]; // additional context lines
  readonly timeout?: number; // timeout used (for reporting)
}>;

export function createUI5Matchers(adapter: BridgeAdapter): Record<string, MatcherFunction>;

/** Register matchers globally via expect.extend(). Uses module-level adapter store. */
export function registerUI5Matchers(): void;

/** Set the adapter instance for matchers (called by fixture). */
export function setMatcherAdapter(adapter: BridgeAdapter): void;
```

**Web-first retry pattern** (used inside every matcher):

```typescript
// Every matcher wraps its assertion in toPass() for auto-retry
async toHaveUI5Text(this: ExpectMatcherState, received: Locator, expected: string, options?) {
  let actual = '';
  try {
    await expect(async () => {
      actual = await adapter.getControlProperty(controlId, 'text') as string;
      expect(actual).toBe(expected);
    }).toPass({
      timeout: options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY,  // toPass defaults to 0!
      intervals: [100, 250, 500, 1000],
    });
    return { pass: true, message: () => `...`, name: 'toHaveUI5Text', expected, actual };
  } catch {
    return { pass: false, message: () => `...`, name: 'toHaveUI5Text', expected, actual };
  }
}
```

**Estimated LOC**: ~150 (increased from 120 due to toPass wrapper + adapter store)
**Tests**: 22 test cases

**Unit Tests** (`tests/unit/matchers/ui5-matchers.test.ts`):

| Test Case                                 | Description                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------- |
| toHaveUI5Text matches exact               | adapter returns 'Save' → pass                                                    |
| toHaveUI5Text matches regex               | adapter returns 'Save Draft' → `/Save/` pass                                     |
| toHaveUI5Text fails on mismatch           | adapter returns 'Cancel' → fail with diff                                        |
| toBeUI5Visible passes                     | adapter.isVisible → true                                                         |
| toBeUI5Visible fails                      | adapter.isVisible → false                                                        |
| toBeUI5Enabled passes                     | adapter.isEnabled → true                                                         |
| toHaveUI5Property matches                 | adapter.getProperty → correct value                                              |
| toHaveUI5Property fails                   | adapter.getProperty → wrong value                                                |
| toHaveUI5ValueState matches               | adapter.getProperty('valueState') → 'Error'                                      |
| Error message includes actual/expected    | Diff in message                                                                  |
| Error message includes control info       | Control ID/type in message                                                       |
| Matcher receives correct adapter          | Mock adapter called with right args                                              |
| Custom timeout passed through             | Options.timeout propagated to toPass()                                           |
| Default timeout when no options           | Uses DEFAULT_TIMEOUTS.CONTROL_DISCOVERY (toPass defaults to 0!)                  |
| Null control handled                      | Graceful error, not crash                                                        |
| Matcher uses toPass() for retry           | Wraps assertion in expect(async () => {...}).toPass()                            |
| Matcher function shape correct            | Returns { pass, message } required; name, expected, actual, log optional         |
| Adapter throws during property access     | `getControlProperty` rejects → matcher returns `{ pass: false }` with error info |
| Adapter returns undefined                 | `getControlProperty` → `undefined` → fail with "actual: undefined" in message    |
| toPass() intervals respected              | Custom `intervals: [50, 100]` → adapter called at those intervals                |
| Negated matcher works                     | `expect(control).not.toHaveUI5Text('Save')` → passes when text is 'Cancel'       |
| Matcher without adapter set               | `_adapter` is `null` → throws PramanError `ERR_BRIDGE_NOT_READY`                 |
| Concurrent matchers on different controls | Two `toHaveUI5Text` running in parallel → both resolve independently             |
| RegExp matching in toHaveUI5Text          | `toHaveUI5Text(/Save.*Draft/)` → matches 'Save as Draft'                         |

#### 7.3.2 File: `src/matchers/table-matchers.ts`

**Purpose**: Table-specific matchers for `sap.m.Table` and `sap.ui.table.Table`.

```typescript
export interface UI5TableMatchers {
  toHaveUI5RowCount(expected: number, options?: { timeout?: number }): Promise<void>;
  toHaveUI5CellText(row: number, column: number, expected: string | RegExp): Promise<void>;
  toHaveUI5SelectedRows(expected: number): Promise<void>;
}

export function createTableMatchers(adapter: BridgeAdapter): Record<string, MatcherFunction>;
```

**Estimated LOC**: ~80
**Tests**: 8 test cases

#### 7.3.3 File: `src/matchers/index.ts` (barrel + registration)

**Purpose**: Register all custom matchers with Playwright's `expect.extend()`.

```typescript
import { expect as baseExpect } from '@playwright/test';
import { createUI5Matchers } from './ui5-matchers.js';
import { createTableMatchers } from './table-matchers.js';

export { registerUI5Matchers, setMatcherAdapter } from './ui5-matchers.js';
export { type UI5Matchers } from './ui5-matchers.js';
export { type UI5TableMatchers } from './table-matchers.js';
```

**Estimated LOC**: ~30
**Tests**: 3 test cases (registration works, matchers available)

---

## 8. Complete File Inventory

### 8.1 Source Files (New)

| #   | File Path                              | Module    | LOC Est. | Phase |
| --- | -------------------------------------- | --------- | -------- | ----- |
| 1   | `src/core/types/config.ts`             | Types     | 40       | 1.1   |
| 2   | `src/core/types/selectors.ts`          | Types     | 65       | 1.1   |
| 3   | `src/core/types/controls.ts`           | Types     | 1,850    | 1.1   |
| 4   | `src/core/types/ui5-types.d.ts`        | Types     | 60       | 1.1   |
| 5   | `src/core/types/validation.ts`         | Types     | 15       | 1.1   |
| 6   | `src/core/types/bridge.ts`             | Types     | 40       | 1.1   |
| 7   | `src/version.ts`                       | Root      | 10       | 1.1   |
| 8   | `src/core/config/schema.ts`            | Config    | 80       | 1.1   |
| 9   | `src/core/config/loader.ts`            | Config    | 120      | 1.1   |
| 10  | `src/core/errors/codes.ts`             | Errors    | 60       | 1.1   |
| 11  | `src/core/errors/base.ts`              | Errors    | 100      | 1.1   |
| 12  | `src/core/errors/config-error.ts`      | Errors    | 40       | 1.1   |
| 13  | `src/core/errors/bridge-error.ts`      | Errors    | 35       | 1.1   |
| 14  | `src/core/errors/control-error.ts`     | Errors    | 50       | 1.1   |
| 15  | `src/core/errors/auth-error.ts`        | Errors    | 35       | 1.1   |
| 16  | `src/core/errors/navigation-error.ts`  | Errors    | 35       | 1.1   |
| 17  | `src/core/errors/odata-error.ts`       | Errors    | 35       | 1.1   |
| 18  | `src/core/errors/selector-error.ts`    | Errors    | 35       | 1.1   |
| 19  | `src/core/errors/timeout-error.ts`     | Errors    | 35       | 1.1   |
| 20  | `src/core/errors/ai-error.ts`          | Errors    | 35       | 1.1   |
| 21  | `src/core/errors/plugin-error.ts`      | Errors    | 35       | 1.1   |
| 22  | `src/core/logging/redaction.ts`        | Logging   | 30       | 1.2   |
| 23  | `src/core/logging/logger.ts`           | Logging   | 80       | 1.2   |
| 24  | `src/core/telemetry/otel.ts`           | OTel      | 100      | 1.2   |
| 25  | `src/core/telemetry/spans.ts`          | OTel      | 60       | 1.2   |
| 26  | `src/core/compat/playwright-compat.ts` | Compat    | 100      | 1.2   |
| 27  | `src/core/utils/constants.ts`          | Utils     | 50       | 1.2   |
| 28  | `src/core/utils/wait-helpers.ts`       | Utils     | 120      | 1.2   |
| 29  | `src/core/utils/retry.ts`              | Utils     | 70       | 1.2   |
| 30  | `src/core/utils/step-decorator.ts`     | Utils     | 40       | 1.2   |
| 31  | `src/core/utils/version-compare.ts`    | Utils     | 70       | 1.2   |
| 32  | `src/bridge/adapter.ts`                | Bridge    | 80       | 1.3   |
| 33  | `src/selectors/selector-parser.ts`     | Selectors | 120      | 1.3   |
| 34  | `src/selectors/ui5-selector-engine.ts` | Selectors | 80       | 1.3   |
| 35  | `src/matchers/ui5-matchers.ts`         | Matchers  | 150      | 1.3   |
| 36  | `src/matchers/table-matchers.ts`       | Matchers  | 80       | 1.3   |

**Total new source files: 36**
**Total estimated LOC: ~4,210** (was ~4,165 before PW review — matchers +30, selectors +15)
**Average LOC per file: ~117** (controls.ts is ~1,850 LOC — approved exception for type-only file, max 2,000 LOC)

### 8.2 Test Files (New)

| #   | Test File Path                                     | Tests Est. |
| --- | -------------------------------------------------- | ---------- |
| 1   | `tests/unit/core/types/config.types.test.ts`       | 6          |
| 2   | `tests/unit/core/types/selectors.types.test.ts`    | 5          |
| 3   | `tests/unit/core/types/controls.types.test.ts`     | 7          |
| 4   | `tests/unit/core/types/bridge.types.test.ts`       | 4          |
| 5   | `tests/unit/core/types/validation.types.test.ts`   | 2          |
| 6   | `tests/unit/core/config/schema.test.ts`            | 20         |
| 7   | `tests/unit/core/config/loader.test.ts`            | 15         |
| 8   | `tests/unit/core/errors/codes.test.ts`             | 3          |
| 9   | `tests/unit/core/errors/base.test.ts`              | 16         |
| 10  | `tests/unit/core/errors/config-error.test.ts`      | 18         |
| 11  | `tests/unit/core/errors/bridge-error.test.ts`      | 15         |
| 12  | `tests/unit/core/errors/control-error.test.ts`     | 18         |
| 13  | `tests/unit/core/errors/auth-error.test.ts`        | 15         |
| 14  | `tests/unit/core/errors/navigation-error.test.ts`  | 15         |
| 15  | `tests/unit/core/errors/odata-error.test.ts`       | 15         |
| 16  | `tests/unit/core/errors/selector-error.test.ts`    | 15         |
| 17  | `tests/unit/core/errors/timeout-error.test.ts`     | 16         |
| 18  | `tests/unit/core/errors/ai-error.test.ts`          | 16         |
| 19  | `tests/unit/core/errors/plugin-error.test.ts`      | 15         |
| 20  | `tests/unit/core/logging/redaction.test.ts`        | 5          |
| 21  | `tests/unit/core/logging/logger.test.ts`           | 10         |
| 22  | `tests/unit/core/telemetry/otel.test.ts`           | 10         |
| 23  | `tests/unit/core/telemetry/spans.test.ts`          | 7          |
| 24  | `tests/unit/core/compat/playwright-compat.test.ts` | 12         |
| 25  | `tests/unit/core/utils/constants.test.ts`          | 5          |
| 26  | `tests/unit/core/utils/wait-helpers.test.ts`       | 15         |
| 27  | `tests/unit/core/utils/retry.test.ts`              | 12         |
| 28  | `tests/unit/core/utils/step-decorator.test.ts`     | 7          |
| 29  | `tests/unit/core/utils/version-compare.test.ts`    | 18         |
| 30  | `tests/unit/bridge/adapter.test.ts`                | 3          |
| 31  | `tests/unit/selectors/selector-parser.test.ts`     | 31         |
| 32  | `tests/unit/selectors/ui5-selector-engine.test.ts` | 8          |
| 33  | `tests/unit/matchers/ui5-matchers.test.ts`         | 24         |
| 34  | `tests/unit/matchers/table-matchers.test.ts`       | 8          |
| 35  | `tests/unit/matchers/index.test.ts`                | 3          |

**Total new test files: 35** (30 unit + 5 type-level)
**Total estimated test cases: ~414** (390 unit + 24 type-level)

### 8.3 Test Helper Files (New)

| #   | File Path                              | Purpose                                         | Batch |
| --- | -------------------------------------- | ----------------------------------------------- | ----- |
| 1   | `tests/helpers/mock-bridge-adapter.ts` | Typed mock of BridgeAdapter interface           | TH2   |
| 2   | `tests/helpers/mock-config.ts`         | Factory for creating test PramanConfig objects  | TH1   |
| 3   | `tests/helpers/mock-page.ts`           | Typed mock of Playwright Page for unit tests    | TH1   |
| 4   | `tests/helpers/error-test-runner.ts`   | Shared base-behavior tests for error subclasses | TH3   |

#### 8.3.1 `tests/helpers/mock-config.ts` — Config Factory

````typescript
import type { PramanConfig } from '#core/types/config.js';

/**
 * Create a test PramanConfig with sensible defaults.
 * Override any field via deep merge.
 *
 * @example
 * ```typescript
 * const config = createMockConfig({ logLevel: 'debug' });
 * const config2 = createMockConfig({ auth: { strategy: 'btp-saml', baseUrl: 'https://sap.example.com' } });
 * ```
 */
export function createMockConfig(overrides?: DeepPartial<PramanConfig>): Readonly<PramanConfig>;

/** Default test config values (all fields populated) */
export const DEFAULT_TEST_CONFIG: Readonly<PramanConfig>;

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };
````

**Default values**: `logLevel: 'info'`, `ui5WaitTimeout: 30_000`,
`controlDiscoveryTimeout: 10_000`, `interactionStrategy: 'hybrid'`,
`skipStabilityWait: false`, `preferVisibleControls: true`.
Output is `Object.freeze`-d (matches production behavior).

#### 8.3.2 `tests/helpers/mock-page.ts` — Page Mock

````typescript
import type { Page } from '@playwright/test';
import { vi } from 'vitest';

/**
 * Create a typed partial mock of Playwright's Page object.
 * Only mocks methods used by Phase 1 modules.
 *
 * @example
 * ```typescript
 * const page = createMockPage();
 * page.waitForFunction.mockResolvedValue(undefined);
 * await waitForUI5Stable(page);
 * expect(page.waitForFunction).toHaveBeenCalledOnce();
 * ```
 */
export function createMockPage(overrides?: Partial<Record<keyof Page, unknown>>): MockPage;

export interface MockPage {
  waitForFunction: ReturnType<typeof vi.fn>;
  evaluate: ReturnType<typeof vi.fn>;
  addInitScript: ReturnType<typeof vi.fn>;
  locator: ReturnType<typeof vi.fn>;
  goto: ReturnType<typeof vi.fn>;
  url: ReturnType<typeof vi.fn>;
}
````

#### 8.3.3 `tests/helpers/mock-bridge-adapter.ts` — Bridge Mock

````typescript
import type { BridgeAdapter } from '#bridge/adapter.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import { vi } from 'vitest';

/**
 * Create a typed mock of BridgeAdapter. Every method is a vi.fn()
 * that can be individually configured.
 *
 * @example
 * ```typescript
 * const adapter = createMockBridgeAdapter({
 *   getControlProperty: vi.fn().mockResolvedValue('Save'),
 * });
 * ```
 */
export function createMockBridgeAdapter(
  overrides?: Partial<Record<keyof BridgeAdapter, unknown>>,
): MockBridgeAdapter;

export type MockBridgeAdapter = {
  [K in keyof BridgeAdapter]: ReturnType<typeof vi.fn>;
};

/** Default mock control for test assertions */
export const MOCK_CONTROL: Readonly<UI5ControlBase>;
````

**Default behavior**: All methods return `vi.fn()` with no implementation
(throws if called without explicit mock). Callers configure per-test.

#### 8.3.4 `tests/helpers/error-test-runner.ts` — Shared Error Tests

````typescript
import { describe, it, expect } from 'vitest';
import { PramanError } from '#core/errors/base.js';

/**
 * Run standard base-behavior tests for any PramanError subclass.
 * Call inside the subclass's describe() block.
 *
 * Tests the following 10 behaviors:
 * 1. instanceof SubclassError (direct)
 * 2. instanceof PramanError (inherited)
 * 3. instanceof Error (inherited)
 * 4. error.name === SubclassName
 * 5. Default error code applied
 * 6. Default retryable applied
 * 7. toJSON() includes all base fields + subclass fields
 * 8. toAIContext() includes all fields (no stack)
 * 9. toUserMessage() produces formatted string
 * 10. Properties are readonly (Object.isFrozen or assignment fails)
 *
 * @example
 * ```typescript
 * describe('ConfigError', () => {
 *   runBaseErrorTests(ConfigError, {
 *     message: 'test config error',
 *     attempted: 'load config',
 *     // subclass-specific fields:
 *     configPath: '/app/praman.config.ts',
 *   }, {
 *     expectedName: 'ConfigError',
 *     expectedDefaultCode: 'ERR_CONFIG_INVALID',
 *     expectedDefaultRetryable: false,
 *   });
 *
 *   // Subclass-specific tests below...
 * });
 * ```
 */
export function runBaseErrorTests<T extends PramanError>(
  ErrorClass: new (options: Record<string, unknown>) => T,
  sampleOptions: Record<string, unknown>,
  expectations: {
    expectedName: string;
    expectedDefaultCode: string;
    expectedDefaultRetryable: boolean;
  },
): void;
````

### 8.4 Barrel File Updates (Existing)

| #   | File                          | Changes                                             |
| --- | ----------------------------- | --------------------------------------------------- |
| 1   | `src/core/types/index.ts`     | Re-export config, selectors, controls, bridge types |
| 2   | `src/core/config/index.ts`    | Re-export schema, loader, defineConfig              |
| 3   | `src/core/errors/index.ts`    | Re-export all error classes + codes                 |
| 4   | `src/core/logging/index.ts`   | Re-export logger, createLogger                      |
| 5   | `src/core/telemetry/index.ts` | Re-export otel, spans                               |
| 6   | `src/core/compat/index.ts`    | Add playwright-compat exports                       |
| 7   | `src/core/utils/index.ts`     | Re-export all utils                                 |
| 8   | `src/core/index.ts`           | Re-export all core sub-modules                      |
| 9   | `src/bridge/index.ts`         | Re-export adapter interface                         |
| 10  | `src/selectors/index.ts`      | Re-export parser + engine                           |
| 11  | `src/matchers/index.ts`       | Register matchers + re-export types                 |
| 12  | `src/index.ts`                | Add defineConfig export, update VERSION             |

---

## 9. Test Plan

### 9.1 Testing Strategy: TDD (W10)

For each module, the implementation sequence is:

1. **Write test file** defining expected behavior
2. **Run tests** — all fail (red)
3. **Implement source file** to pass tests
4. **Run tests** — all pass (green)
5. **Refactor** if needed (tests must still pass)
6. **Run `npm run ci`** — full validation

### 9.2 Coverage Targets

| Tier       | Scope                                           | Statements | Branches | Functions | Lines |
| ---------- | ----------------------------------------------- | ---------- | -------- | --------- | ----- |
| **Tier 1** | `src/core/errors/**/*.ts`                       | 100%       | 100%     | 100%      | 100%  |
| **Tier 2** | `src/core/**/*.ts`                              | 95%        | 90%      | 95%       | 95%   |
| **Tier 3** | `src/selectors/**/*.ts`, `src/matchers/**/*.ts` | 90%        | 85%      | 90%       | 90%   |

**Per-file enforcement**: `perFile: true` in vitest coverage config (CLAUDE.md requirement).
No single file can hide behind project averages. Each `.ts` file must individually meet its tier threshold.

### 9.3 Test Categories

| Category         | Framework             | Files                           | Count |
| ---------------- | --------------------- | ------------------------------- | ----- |
| Unit tests       | Vitest                | `tests/unit/**/*.test.ts`       | ~390  |
| Type-level tests | Vitest + expectTypeOf | `tests/unit/**/*.types.test.ts` | 24    |
| Type checks      | tsc --noEmit          | all `.ts` files                 | N/A   |
| Lint             | ESLint                | all `.ts` files                 | N/A   |
| Build            | tsup                  | dist/ output                    | N/A   |

### 9.4 Mock Strategy

- **BridgeAdapter**: Full mock in `tests/helpers/mock-bridge-adapter.ts`
- **pino**: Mock transport for testing log output
- **Page**: Mock `page.waitForFunction()`, `page.evaluate()` calls
- **OTel SDK**: Mock dynamic `import()` responses
- **File system**: Mock `fs.readFile`, `fs.stat` for config loader
- **process.env**: Vitest `vi.stubEnv()` for env override tests

### 9.5 Type-Level Tests (Vitest `expectTypeOf`)

Type-only files have no runtime behavior but MUST be tested for type correctness.
Use Vitest's `expectTypeOf` and `assertType` to catch type regressions that
`tsc --noEmit` alone misses (e.g., a missing key in `UI5ControlMap` won't fail
`tsc` but will fail an exhaustiveness test).

#### `tests/unit/core/types/config.types.test.ts`

| #   | Test Case                                      | Assertion                                                                        |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | PramanConfig is exported                       | `expectTypeOf<PramanConfig>().toBeObject()`                                      |
| 2   | PramanConfig.logLevel is LogLevel union        | `expectTypeOf<PramanConfig['logLevel']>().toEqualTypeOf<LogLevel>()`             |
| 3   | PramanConfig has all required top-level fields | Assert keys exist: `logLevel`, `ui5WaitTimeout`, `controlDiscoveryTimeout`, etc. |
| 4   | PramanConfig optional sections typed           | `expectTypeOf<PramanConfig['auth']>()` includes `strategy`, `baseUrl`            |
| 5   | PramanConfigInput allows partial               | `assertType<PramanConfigInput>({})` compiles                                     |
| 6   | Readonly enforced                              | `expectTypeOf<PramanConfig>().toMatchTypeOf<Readonly<PramanConfig>>()`           |

#### `tests/unit/core/types/selectors.types.test.ts`

| #   | Test Case                                          | Assertion                                                                          |
| --- | -------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | UI5Selector has all fields                         | `controlType`, `id`, `viewName`, `properties`, etc.                                |
| 2   | UI5Selector.id accepts string or RegExp            | `expectTypeOf<UI5Selector['id']>().toEqualTypeOf<string \| RegExp \| undefined>()` |
| 3   | SerializedUI5Selector.id accepts serialized RegExp | `string \| { source: string; flags: string } \| undefined`                         |
| 4   | UI5SelectorString is template literal              | `expectTypeOf<UI5SelectorString>().toMatchTypeOf<\`ui5=\${string}\`>()`            |
| 5   | UI5Interaction has idSuffix and domChildWith       | Fields typed correctly                                                             |

#### `tests/unit/core/types/controls.types.test.ts`

| #   | Test Case                                      | Assertion                                                                  |
| --- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | UI5ControlMap has all 113 keys                 | Count keys of `UI5ControlMap`                                              |
| 2   | UI5ControlFor resolves correctly               | `expectTypeOf<UI5ControlFor<'sap.m.Button'>>().toEqualTypeOf<UI5Button>()` |
| 3   | UI5ControlFor resolves UI5Input                | `expectTypeOf<UI5ControlFor<'sap.m.Input'>>().toEqualTypeOf<UI5Input>()`   |
| 4   | All controls extend UI5ControlBase             | Each interface has `getId()`, `getControlType()`                           |
| 5   | InteractiveControlType is string literal union | Contains `'sap.m.Button'`, `'sap.m.Input'`, etc.                           |
| 6   | ContainerControlType is string literal union   | Contains `'sap.m.Page'`, `'sap.m.Dialog'`, etc.                            |
| 7   | UI5Button has press() method                   | `expectTypeOf<UI5Button['press']>().toEqualTypeOf<() => Promise<void>>()`  |

#### `tests/unit/core/types/bridge.types.test.ts`

| #   | Test Case                                         | Assertion                                               |
| --- | ------------------------------------------------- | ------------------------------------------------------- |
| 1   | BridgeReturnType is string literal union          | Contains `'empty'`, `'result'`, `'element'`, etc.       |
| 2   | BridgeMethodDescriptor has name, args, returnType | All 3 fields typed                                      |
| 3   | BridgeResult is generic                           | `BridgeResult<string>` has `data?: string`              |
| 4   | BridgeResult.success is boolean                   | `expectTypeOf<BridgeResult['success']>().toBeBoolean()` |

#### `tests/unit/core/types/validation.types.test.ts`

| #   | Test Case                               | Assertion                       |
| --- | --------------------------------------- | ------------------------------- |
| 1   | ValidationIssue has path, message, code | All 3 fields typed              |
| 2   | ValidationIssue.path is readonly array  | `readonly (string \| number)[]` |

**Total type-level test cases**: 24 across 5 test files.

---

## 10. Impact Analysis

### 10.1 Files Modified (Existing)

| File                          | Change                                    | Risk                |
| ----------------------------- | ----------------------------------------- | ------------------- |
| `src/index.ts`                | Add `defineConfig` export, update VERSION | Low — additive only |
| `src/core/index.ts`           | Update barrel re-exports                  | Low — additive only |
| `src/core/types/index.ts`     | Update barrel re-exports                  | Low — additive only |
| `src/core/config/index.ts`    | Update barrel re-exports                  | Low — additive only |
| `src/core/errors/index.ts`    | Update barrel re-exports                  | Low — additive only |
| `src/core/logging/index.ts`   | Update barrel re-exports                  | Low — additive only |
| `src/core/telemetry/index.ts` | Update barrel re-exports                  | Low — additive only |
| `src/core/compat/index.ts`    | Add playwright-compat re-export           | Low — additive only |
| `src/core/utils/index.ts`     | Update barrel re-exports                  | Low — additive only |
| `src/bridge/index.ts`         | Add adapter interface re-export           | Low — additive only |
| `src/selectors/index.ts`      | Update barrel re-exports                  | Low — additive only |
| `src/matchers/index.ts`       | Add matcher registration + re-exports     | Low — additive only |

### 10.2 Files NOT Modified

| File                       | Reason                                                           |
| -------------------------- | ---------------------------------------------------------------- |
| `package.json`             | No new dependencies needed (zod, pino, dotenv already installed) |
| `tsconfig.json`            | Path aliases already configured                                  |
| `tsup.config.ts`           | Entry points already configured                                  |
| `eslint.config.mjs`        | Already configured for all 10 plugins                            |
| `vitest.config.ts`         | Coverage config already set (thresholds at 0 for scaffold)       |
| `.github/workflows/ci.yml` | Already runs lint + typecheck + test:unit + build                |
| `.husky/pre-push`          | Already runs coverage                                            |

### 10.3 Build Impact

| Metric               | Before Phase 1            | After Phase 1                                              | Delta     |
| -------------------- | ------------------------- | ---------------------------------------------------------- | --------- |
| Source files         | 25 (22 empty barrels + 3) | 61 (36 new + 25 existing)                                  | +36       |
| Test files           | 4                         | 39 (35 new + 4 existing)                                   | +35       |
| Test helpers         | 0                         | 4 (mock-config, mock-page, mock-bridge, error-test-runner) | +4        |
| Estimated dist/ size | ~5 KB                     | ~50-80 KB                                                  | +45-75 KB |
| Test count           | 4 smoke tests             | ~414 tests                                                 | +410      |
| Build time           | ~2s                       | ~3-4s                                                      | +1-2s     |
| Test time            | ~1s                       | ~5-8s                                                      | +4-7s     |

### 10.4 Breaking Changes

**None.** Phase 1 is purely additive:

- Existing `test`, `expect`, `VERSION` exports remain unchanged
- New `defineConfig` export added (non-breaking)
- All new modules are new files — no existing code modified except barrel files

### 10.5 Dependency Impact

No new npm dependencies needed. Already installed:

- `zod` 4.3.6 — for config schema
- `pino` 10.3.1 — for logging
- `dotenv` 17.3.1 — for env file loading
- `@opentelemetry/api` 1.9.0 + `@opentelemetry/sdk-node` 0.212.0 — optional OTel
- `@playwright/test` 1.58.2 — peer dependency (selectors, matchers, compat)

---

## 11. Quality Gates Per Sub-Phase

### 11.1 Sub-Phase 1.1 Gate (Foundation)

```bash
# All must pass before proceeding to 1.2
npm run typecheck        # Zero errors
npm run lint             # Zero errors, zero warnings
npm run test:unit        # All tests pass
npm run build            # tsup succeeds
npm run ci               # Full pipeline green
```

**Coverage check**:

- `src/core/errors/**/*.ts` → 100% statements, branches, functions, lines
- `src/core/config/**/*.ts` → 95% statements, 90% branches, 95% functions, 95% lines
- `src/core/types/**/*.ts` → type-check only (no runtime code to cover)

### 11.2 Sub-Phase 1.2 Gate (Infrastructure)

```bash
npm run ci               # Full pipeline green
```

**Coverage check**:

- All `src/core/**/*.ts` → meets Tier 2 targets (95/90/95/95)
- `src/core/errors/**/*.ts` → still 100%

### 11.3 Sub-Phase 1.3 Gate (Playwright Integration)

```bash
npm run ci               # Full pipeline green
npm run check:exports    # attw validates all export maps
```

**Coverage check**:

- `src/core/errors/**/*.ts` → 100% (Tier 1)
- `src/core/**/*.ts` → 95/90/95/95 (Tier 2)
- `src/selectors/**/*.ts` → 90/85/90/90 (Tier 3)
- `src/matchers/**/*.ts` → 90/85/90/90 (Tier 3)

---

## 12. Risk Register

| #   | Risk                                          | Probability | Impact | Mitigation                                                                                    |
| --- | --------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------------------------------- |
| R1  | Controls type file exceeds 300 LOC            | High        | Low    | Document as justified exception (20 interfaces require ~280 LOC). Split into 4 files if >300. |
| R2  | Zod 4 schema changes                          | Low         | Medium | Pin `zod: 4.3.6` in package.json. Test with `.safeParse()` always.                            |
| R3  | OTel lazy loading fails on some Node versions | Low         | Low    | NoOpTracer fallback. Warning log. Tests verify fallback path.                                 |
| R4  | Selector parser edge cases                    | Medium      | Medium | Extensive test suite (20 cases). Fuzzing in Phase 7.                                          |
| R5  | Playwright version detection breaks           | Low         | Medium | Fallback to minimum supported version. Integration test in CI matrix.                         |
| R6  | Matcher expect.extend() API changes           | Low         | High   | Pin @playwright/test peer dep to `>=1.50.0 <2.0.0`. Test with matrix.                         |
| R7  | Config loader dynamic import fails in CJS     | Medium      | Medium | tsup `shims: true` handles this. Integration test validates CJS + ESM load.                   |
| R8  | Type-only files not tree-shaken               | Low         | Low    | tsup `treeshake: true` already configured. Verify with size-limit check.                      |

---

## 13. Barrel File Updates

Each barrel file update follows the pattern: add re-exports for new modules, keep existing exports.

### 13.1 `src/core/types/index.ts`

```typescript
export type {
  LogLevel,
  InteractionStrategy,
  AuthStrategy,
  AIProvider,
  TelemetryExporter,
} from './config.js';
export type { PramanConfig, PramanConfigInput } from '../config/schema.js'; // PramanConfig lives in config/schema, NOT types/config
export type { UI5Selector, UI5Interaction, UI5SelectorString } from './selectors.js';
export type {
  UI5ControlBase,
  UI5Button,
  UI5Input,
  UI5Table,
  UI5ControlMap /* ...all 20 */,
} from './controls.js';
export type { BridgeReturnType, BridgeMethodDescriptor, BridgeResult } from './bridge.js';
```

### 13.2 `src/core/errors/index.ts`

```typescript
export { ErrorCode } from './codes.js';
export type { ErrorCode as ErrorCodeType } from './codes.js';
export { PramanError } from './base.js';
export type { PramanErrorOptions, SerializedPramanError, AIErrorContext } from './base.js';
export { ConfigError } from './config-error.js';
export { BridgeError } from './bridge-error.js';
export { ControlError } from './control-error.js';
export { AuthError } from './auth-error.js';
export { NavigationError } from './navigation-error.js';
export { ODataError } from './odata-error.js';
export { SelectorError } from './selector-error.js';
export { TimeoutError } from './timeout-error.js';
export { AIError } from './ai-error.js';
export { PluginError } from './plugin-error.js';
```

### 13.3 `src/core/config/index.ts`

```typescript
export { PramanConfigSchema } from './schema.js';
export type { PramanConfigInput } from './schema.js';
export { loadConfig, defineConfig } from './loader.js';
```

### 13.4 `src/core/logging/index.ts`

```typescript
export { createRootLogger, createLogger, getDefaultLogger } from './logger.js';
export { REDACTION_PATHS, createRedactConfig } from './redaction.js';
```

### 13.5 `src/core/telemetry/index.ts`

```typescript
export { initTelemetry, getNoOpTracer } from './otel.js';
export type { TracerWrapper, SpanWrapper } from './otel.js';
export { traceOperation, createSpanName, spanAttributes } from './spans.js';
```

### 13.6 `src/core/compat/index.ts`

```typescript
// Existing exports
export {
  getModuleDirname,
  getModuleFilename,
  resolveFromPackageRoot,
  joinPath,
  PATH_SEPARATOR,
} from './path-helpers.js';

// New Phase 1 exports
export {
  getPlaywrightVersion,
  getPlaywrightFeatures,
  hasFeature,
  assertMinVersion,
} from './playwright-compat.js';
export type { PlaywrightVersion, PlaywrightFeatures } from './playwright-compat.js';
```

### 13.7 `src/core/utils/index.ts`

```typescript
export { waitForUI5Stable, waitForUI5Bootstrap, briefDOMSettle } from './wait-helpers.js';
export type { WaitForUI5StableOptions } from './wait-helpers.js';
export {
  WALKME_DEFAULT_PATTERNS,
  ANALYTICS_DEFAULT_PATTERNS,
  DEFAULT_IGNORE_PATTERNS,
  DEFAULT_TIMEOUTS,
} from './constants.js';
export { retry, calculateBackoff } from './retry.js';
export type { RetryOptions } from './retry.js';
export { withStep, createStepName } from './step-decorator.js';
export { parseSemVer, compareSemVer, satisfiesRange, isAtLeast } from './version-compare.js';
export type { SemVer } from './version-compare.js';
```

---

## 14. Main Entry Point Updates

### 14.1 `src/index.ts` (updated)

```typescript
/**
 * Praman v1.0 — AI-First SAP UI5 Test Automation Platform for Playwright.
 *
 * @packageDocumentation
 */
export { test, expect } from '@playwright/test';
export { defineConfig, loadConfig } from './core/config/index.js';
export { VERSION, PACKAGE_NAME } from './version.js';

// Re-export error base class as VALUE (not `export type`) — consumers need instanceof
export { PramanError } from './core/errors/index.js';

// Re-export types for consumers
export type { PramanConfig, UI5Selector } from './core/types/index.js';
export type {
  PramanErrorOptions,
  SerializedPramanError,
  AIErrorContext,
} from './core/errors/index.js';
```

---

## Summary

| Metric                          | Value                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------- |
| **New source files**            | 36 (actual)                                                                  |
| **New test files**              | 40 (actual, includes 4 helpers)                                              |
| **Barrel file updates**         | 12 (actual)                                                                  |
| **Total source LOC**            | ~4,200 (actual)                                                              |
| **Total test cases**            | 511 (actual — exceeded ~414 estimate)                                        |
| **Statement coverage**          | 98.92% (actual — exceeds all tier thresholds)                                |
| **New npm dependencies**        | 0                                                                            |
| **Breaking changes**            | 0                                                                            |
| **Sub-phases**                  | 3 (Foundation → Infrastructure → Playwright Integration) — all COMPLETE      |
| **Quality gates**               | Per-batch (`npm run ci` after every batch) — all passed                      |
| **Implementation batches**      | 46 (completed)                                                               |
| **Max parallel agents**         | 3 (upgraded from 2 after 20x plan)                                           |
| **Critical path**               | 8 steps (B1a → B3a → B3b → B3c → B4a → B4b → B7c → B11) — all complete       |
| **Risk items**                  | 8 (all mitigated and resolved)                                               |
| **Review findings (v1.1–v1.5)** | 14 critical (all resolved), 27 high (all resolved), 35 medium (all resolved) |
| **Completion date**             | 2026-02-16                                                                   |

---

## 15. API References

### SAP UI5 Official API Documentation

| Namespace                  | URL                                                  | Relevance                                                  |
| -------------------------- | ---------------------------------------------------- | ---------------------------------------------------------- |
| `sap.m` (all controls)     | <https://ui5.sap.com/#/api/sap.m>                    | Primary control library — 89 controls in our catalog       |
| `sap.ui.test`              | <https://ui5.sap.com/#/api/sap.ui.test>              | RecordReplay API, OPA5, matchers — bridge foundation       |
| `sap.ui.test.RecordReplay` | <https://ui5.sap.com/#/api/sap.ui.test.RecordReplay> | Core bridge mechanism (findDOMElementByControlSelector)    |
| `sap.ui.table`             | <https://ui5.sap.com/#/api/sap.ui.table>             | Grid/Tree/Analytical table controls                        |
| `sap.ui.comp`              | <https://ui5.sap.com/#/api/sap.ui.comp>              | Smart controls (SmartTable, SmartFilterBar, SmartForm)     |
| `sap.f`                    | <https://ui5.sap.com/#/api/sap.f>                    | Fiori design (DynamicPage, FlexibleColumnLayout, ShellBar) |
| `sap.uxap`                 | <https://ui5.sap.com/#/api/sap.uxap>                 | Object Page layout                                         |
| `sap.ui.layout`            | <https://ui5.sap.com/#/api/sap.ui.layout>            | Layout controls (Form, SimpleForm, Grid)                   |
| `sap.ui.unified`           | <https://ui5.sap.com/#/api/sap.ui.unified>           | FileUploader, Calendar                                     |
| `sap.tnt`                  | <https://ui5.sap.com/#/api/sap.tnt>                  | Tool Navigation (SideNavigation)                           |
| `sap.ui.mdc`               | <https://ui5.sap.com/#/api/sap.ui.mdc>               | Metadata-Driven Controls (MDC Table)                       |
| `sap.ui.webc`              | <https://ui5.sap.com/#/api/sap.ui.webc.main>         | Web Components (Button, Input, List)                       |
| `sap.ui.core.Element`      | <https://ui5.sap.com/#/api/sap.ui.core.Element>      | Base class for all UI5 controls                            |

### Predecessor Source Code References

| Source                  | Path                                                         | Used For                                                                                                      |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| dhikraft 2.5 constants  | `consult/dhikraft_src/src/lib/ui5-bridge/constants.ts`       | INTERACTIVE_CONTROL_TYPES (34), CONTAINER_CONTROL_TYPES (28), METHOD_BLOCKLIST, XHR_IGNORE_PATTERNS, Timeouts |
| dhikraft 2.5 handler    | `consult/dhikraft_src/src/handlers/ui5-handler.ts`           | Display/message controls, dialog types, WalkMe handling                                                       |
| dhikraft 2.5 intent API | `consult/dhikraft_src/src/intent-api/ui5-intent-wrappers.ts` | Additional control references, interaction patterns                                                           |
| wdi5 bridge             | `consult/wdi5/src/client-side-js/`                           | RecordReplay injection, control method bridging                                                               |
| wdi5 types              | `consult/wdi5/src/types/wdi5.types.ts`                       | Generic control proxy patterns                                                                                |

### Playwright Documentation References

| Topic                     | URL                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------ |
| Actionability (auto-wait) | <https://playwright.dev/docs/actionability>                                          |
| Web-first assertions      | <https://playwright.dev/docs/test-assertions>                                        |
| Best practices            | <https://playwright.dev/docs/best-practices>                                         |
| Custom selectors          | <https://playwright.dev/docs/extensibility>                                          |
| expect.extend()           | <https://playwright.dev/docs/test-assertions#add-custom-matchers-using-expectextend> |

---

## 16. Implementation Batching (AI Agent Response Limits)

AI coding agents (Claude Code, Copilot, Codex) have response length limits (~4,000 tokens
per code block). Large files MUST be broken into implementation batches. Each batch is
a single agent turn that produces a complete, compilable increment.

### 16.1 Sub-Phase 1.1 — Foundation Batches

| Batch   | Files                                                                                                                                   | Est. Tokens | Depends On |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **B1a** | `src/version.ts`, `src/core/types/config.ts`, `src/core/types/selectors.ts`, `src/core/types/bridge.ts`, `src/core/types/validation.ts` | ~1,200      | None       |
| **B1b** | `src/core/types/controls.ts` — UI5ControlBase + sap.m Input (25 interfaces)                                                             | ~2,500      | None       |
| **B1c** | `src/core/types/controls.ts` — sap.m Display + Indicators + Tiles (19 interfaces)                                                       | ~2,000      | B1b        |
| **B1d** | `src/core/types/controls.ts` — sap.m List + Dialog + Navigation (35 interfaces)                                                         | ~3,500      | B1c        |
| **B1e** | `src/core/types/controls.ts` — sap.m Container + all other libraries + unions + map (34 interfaces + types)                             | ~3,000      | B1d        |
| **B1f** | `src/core/types/ui5-types.d.ts`, `src/core/types/index.ts` barrel                                                                       | ~500        | B1a-e      |
| **B2a** | `src/core/errors/codes.ts`, `src/core/errors/base.ts` + test files                                                                      | ~2,500      | B1a        |
| **B2b** | `src/core/errors/config-error.ts`, `bridge-error.ts`, `control-error.ts` + tests                                                        | ~2,500      | B2a, TH3   |
| **B2c** | `src/core/errors/auth-error.ts` through `plugin-error.ts` (7 files) + tests                                                             | ~3,000      | B2a, TH3   |
| **B2d** | `src/core/errors/index.ts` barrel                                                                                                       | ~300        | B2b, B2c   |
| **B3a** | `src/core/config/schema.ts` + test file                                                                                                 | ~2,000      | B1a        |
| **B3b** | `src/core/config/loader.ts` + test file                                                                                                 | ~2,500      | B3a, B2a   |
| **B3c** | `src/core/config/index.ts` barrel, run `npm run ci` gate                                                                                | ~300        | B3a, B3b   |
| **TH1** | `tests/helpers/mock-config.ts` + `mock-page.ts`                                                                                         | ~800        | B3a        |
| **TH3** | `tests/helpers/error-test-runner.ts`                                                                                                    | ~400        | B2a        |

> **Change from v1.1.0**: B3a no longer depends on B2a — schema.ts imports `z` from zod,
> not from errors. B3b (loader) depends on B2a because it throws ConfigError.
> TH1 (test helpers) split out of B10a and moved earlier — mock-config needed by B4a,
> mock-page needed by B7a. TH3 (error test runner) ships after B2a so that B2b/B2c
> tests can use `runBaseErrorTests()` shared helper.

### 16.2 Sub-Phase 1.2 — Infrastructure Batches

| Batch   | Files                                                                          | Est. Tokens | Depends On             |
| ------- | ------------------------------------------------------------------------------ | ----------- | ---------------------- |
| **B4a** | `src/core/logging/redaction.ts` + `logger.ts` + tests                          | ~2,500      | B3c, TH1               |
| **B4b** | `src/core/logging/index.ts` barrel                                             | ~200        | B4a                    |
| **B5a** | `src/core/telemetry/otel.ts` + `spans.ts` + tests                              | ~3,000      | B3c                    |
| **B5b** | `src/core/telemetry/index.ts` barrel                                           | ~200        | B5a                    |
| **B6**  | `src/core/compat/playwright-compat.ts` + tests + barrel update                 | ~2,500      | B1a, B7b               |
| **B7a** | `src/core/utils/constants.ts` + `wait-helpers.ts` + tests                      | ~3,000      | B3c, TH1               |
| **B7b** | `src/core/utils/retry.ts` + `step-decorator.ts` + `version-compare.ts` + tests | ~3,000      | B2a                    |
| **B7c** | `src/core/utils/index.ts` + `src/core/index.ts` barrels, run `npm run ci` gate | ~500        | B4b, B5b, B6, B7a, B7b |

> **Change from v1.1.0**: B5a no longer depends on B4a — OTel accepts optional logger param.
> B7a no longer depends on B4a — wait-helpers accepts optional logger param.
> B6 depends on B7b (version-compare) instead of duplicating semver parsing.
> This unlocks B4a, B5a, B7a, B7b to run in parallel after B3c.

### 16.3 Sub-Phase 1.3 — Playwright Integration Batches

| Batch    | Files                                                                              | Est. Tokens | Depends On |
| -------- | ---------------------------------------------------------------------------------- | ----------- | ---------- |
| **B8**   | `src/bridge/adapter.ts` + test + `src/bridge/index.ts`                             | ~1,500      | B1a        |
| **TH2**  | `tests/helpers/mock-bridge-adapter.ts`                                             | ~700        | B8         |
| **B9a**  | `src/selectors/selector-parser.ts` + test                                          | ~3,000      | B1a, B2a   |
| **B9b**  | `src/selectors/ui5-selector-engine.ts` + test + barrel                             | ~2,000      | B9a        |
| **B10b** | `src/matchers/ui5-matchers.ts` + test                                              | ~2,500      | TH2        |
| **B10c** | `src/matchers/table-matchers.ts` + test + `index.ts`                               | ~2,000      | TH2        |
| **B11**  | `src/index.ts` update, final barrel wiring, `npm run ci` + `npm run check:exports` | ~500        | All        |

Total: **30 batches** across 3 sub-phases (27 code + 3 test helpers).

### 16.4 Parallel Agent Delivery Schedule

Batches with NO dependency on each other can be assigned to **separate agents**.
Maximum parallelism: **5 agents** (Wave 3).

```text
Wave 1 (start):     B1a, B1b                          [2 agents]
Wave 2 (after B1a): B2a, B3a, B8                      [3 agents]  (B1c continues)
Wave 2b (after B2a): TH3                              [1 agent]   (quick — ~400 tokens)
Wave 3 (after TH3): B2b, B2c, B7b, B9a, TH1          [5 agents]  (B1d, B3b continue)
Wave 4 (after B3c): B4a, B5a, B7a (parallel!)         [3 agents]  (B9b, TH2 continue)
Wave 5 (after TH2): B10b, B10c, B6                    [3 agents]  (B4b, B5b continue)
Wave 6 (after all):  B7c, B11                          [2 agents → sequential]
```

**Critical Path** (longest sequential chain):

```text
B1a → B3a → B3b → B3c → B4a → B4b → B7c → B11  (8 steps)
```

> **Improvement over v1.1.0**: Critical path reduced from 10 steps to 8 steps (20% faster)
> by fixing false dependencies (B3a on B2a, B5a/B7a on B4a).

### 16.5 Batching Rules

1. **Each batch MUST produce compilable code** — `npm run typecheck` passes after each batch
2. **Test files ship WITH source files** in the same batch (TDD)
3. **Barrel files** are updated at end of each sub-module (not per-file)
4. **controls.ts** is split into 4 batches (B1b-B1e) — each batch adds a section and is independently valid
5. **CI gate** runs at end of each sub-phase (B3c, B7c, B11) — not every batch
6. **Max code block per batch**: ~150 LOC source + ~100 LOC tests = ~250 LOC total
7. **If a batch exceeds 4,000 tokens**: split further into sub-batches (e.g., B2c can become B2c1 + B2c2)
8. **Test helpers** ship as separate batches (TH1, TH2, TH3) before the code that needs them
9. **Parallel agents**: batches in the same wave can be assigned to independent agents
10. **TDD Batch Protocol**: Within each batch, the agent MUST follow this sequence:
    - Write test file FIRST (imports will reference non-existent modules)
    - Run `npm run test:unit -- <test-file>` — verify RED (test fails due to missing module)
    - Write source file to make tests pass
    - Run `npm run test:unit -- <test-file>` — verify GREEN (all tests pass)
    - Run `npm run typecheck` + `npm run lint` — verify no regressions
    - If RED phase shows test PASSES immediately → test is wrong, rewrite it
11. **Coverage thresholds**: Update `vitest.config.ts` at sub-phase gates only:
    - **B3c gate**: Set Tier 1 (100%) for `src/core/errors/**`, Tier 2 (95/90/95/95) for `src/core/config/**`
    - **B7c gate**: Set Tier 2 (95/90/95/95) for all `src/core/**`
    - **B11 gate**: Set Tier 3 (90/85/90/90) globally for `src/selectors/**`, `src/matchers/**`

---

## 17. Review Findings

### 17.1 v1.1.0 Review (Principal Architect) — All Resolved

| #   | Severity | Issue                                       | Resolution                                          |
| --- | -------- | ------------------------------------------- | --------------------------------------------------- |
| C1  | CRITICAL | Missing `toAIContext()` on PramanError      | Added `toAIContext()` + `AIErrorContext` to base.ts |
| C2  | CRITICAL | Missing `version.ts` from inventory         | Added to file inventory                             |
| C3  | CRITICAL | Control count 114 → actual 113              | Fixed count in map comment + inventory              |
| C4  | CRITICAL | No batch/chunking guidance                  | Added Section 16 with batches                       |
| C5  | CRITICAL | ConfigError imports zod (violates dep rule) | Created `ValidationIssue` wrapper type              |
| H1  | HIGH     | No per-file coverage enforcement            | Added `perFile: true` to quality gates              |
| H2  | HIGH     | Incomplete SAP\_\* env var mapping          | Added 17-row mapping table                          |
| H6  | HIGH     | constants.ts offset numbering (25a)         | Re-numbered inventory                               |

### 17.2 v1.2.0 Review (Architect + Engineer) — All Resolved

| #   | Severity | Issue                                                        | Resolution                                                                    |
| --- | -------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| V3  | CRITICAL | `PramanConfig` dual source of truth (manual interface + Zod) | Derive from `z.output<>`, re-export from `config.ts`                          |
| V1  | CRITICAL | `ui5-types.d.ts` ends with `// ...` — incomplete             | Added `UI5Element`, `UI5Metadata`, `UI5RecordReplay`                          |
| V2  | CRITICAL | `PlaywrightFeatures` ends with `// ...` — incomplete         | Listed all 8 feature flags with version ranges                                |
| S1  | HIGH     | `playwright-compat.ts` and `version-compare.ts` SRP overlap  | Relaxed dep rule: compat imports from utils                                   |
| V4  | HIGH     | 8/10 error subclasses missing constructor signatures         | Added full specs for all 8 remaining subclasses                               |
| V5  | HIGH     | `resolveSelector()` ghost function in design flow            | Replaced with `query()` method, documented DOM strategy                       |
| V6  | HIGH     | `MatcherFunction` type undefined                             | Added type definition with `ExpectMatcherState` import                        |
| V7  | HIGH     | `version.ts` content unspecified                             | Added code block with `VERSION` + `PACKAGE_NAME`                              |
| V8  | HIGH     | `export type { PramanError }` breaks `instanceof`            | Changed to value export                                                       |
| P1  | HIGH     | B3a falsely depends on B2a (schema has no error imports)     | Moved B2a dependency to B3b only                                              |
| P2  | HIGH     | Test helpers (B10a) needed earlier                           | Split into TH1 (mock-config/page) + TH2 (mock-bridge)                         |
| P3  | HIGH     | Logging coupling blocks B5a and B7a parallelism              | Removed B4a dependency, accept optional logger                                |
| V9  | MEDIUM   | Error table says `zodErrors`, code says `validationErrors`   | Fixed table to `validationErrors`                                             |
| V10 | MEDIUM   | `traceOperation` is dead code in Phase 1                     | Documented as no-op decorator, Phase 2 wires it                               |
| V11 | MEDIUM   | 22/36 files missing import lists                             | Added imports to 6 key files (loader, wait-helpers, compat, engine, matchers) |
| V12 | MEDIUM   | `satisfiesRange` range format unspecified                    | Specified: `>=`, `^`, `~`, range expressions                                  |
| V13 | MEDIUM   | `step-decorator.ts` behavior unspecified                     | Added TSDoc, test table, graceful degradation spec                            |
| V14 | MEDIUM   | Logger dev vs prod detection unspecified                     | Added: `NODE_ENV !== 'production' && !CI`                                     |
| P4  | MEDIUM   | Critical path 10 steps, reducible to 7                       | Reorganized with Wave schedule (Section 16.4)                                 |
| D1  | MEDIUM   | H7 (`no-cycle` ESLint rule) — already exists                 | Verified: `import-x/no-cycle: 'error'` in eslint.config.mjs                   |

### 17.3 Tracked for Implementation (resolve during TDD)

| #   | Severity | Issue                                                     | When to Resolve |
| --- | -------- | --------------------------------------------------------- | --------------- |
| H3  | HIGH     | Mock bridge adapter needs typed interface                 | Batch TH2       |
| H4  | HIGH     | Add "retry() is for infrastructure only" TSDoc warning    | Batch B7b       |
| H5  | HIGH     | TSDoc `@example` tag in quality gate                      | Batch B11       |
| M1  | MEDIUM   | Selector parser depth limit for recursive selectors       | Batch B9a       |
| M2  | MEDIUM   | OTel exporter-specific validation (jaeger needs endpoint) | Batch B5a       |
| M3  | MEDIUM   | WalkMe pattern disclaimer in constants                    | Batch B7a       |
| M4  | MEDIUM   | Config loader: test `{}` input populates all defaults     | Batch B3b       |
| M5  | MEDIUM   | Matcher error code for null control                       | Batch B10b      |
| M6  | MEDIUM   | RecordReplay minimum UI5 version docs                     | Batch B8        |
| V15 | MEDIUM   | Selector parser edge cases (`=` in values, Unicode)       | Batch B9a       |
| V16 | MEDIUM   | `waitForUI5Bootstrap` default timeout not in signature    | Batch B7a       |

### 17.4 v1.3.0 Review (Playwright Expert) — All Resolved

Verified against `@playwright/test` 1.58.2 installed type definitions.

| #   | Severity | Issue                                                                                | Resolution                                                                                  |
| --- | -------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| PW1 | CRITICAL | Custom matchers do NOT auto-retry — Section 4.6 said "Playwright retries if !pass"   | Added `expect(async () => {...}).toPass({ timeout })` pattern to matcher flow and impl spec |
| PW2 | HIGH     | `MatcherFunction` return type wrong (name/expected/actual were required)             | Fixed to match Playwright `MatcherReturnType`: pass+message required, rest optional         |
| PW3 | HIGH     | `UI5Selector.id` RegExp not JSON-serializable for `page.evaluate()`                  | Added `SerializedUI5Selector` with `{ source, flags }` + serialize/deserialize helpers      |
| PW4 | HIGH     | Matcher adapter injection conflicts with `expect.extend()` lifecycle                 | Added module-level adapter store + worker-scoped auto fixture spec                          |
| PW5 | MEDIUM   | `registerUI5SelectorEngine(playwright)` — unnecessary DI of entire playwright module | Changed to no-arg function that imports `selectors` directly                                |
| PW6 | MEDIUM   | `@playwright/test` does NOT export `version` (verified 1.58.2)                       | Added code comment: use `createRequire` to read `package.json`, not `import { version }`    |
| PW7 | MEDIUM   | `toPass()` timeout defaults to 0, not global expect timeout                          | Added explicit timeout passing to all matchers + test case for default timeout behavior     |
| PW8 | MEDIUM   | Selector engine registration timing unspecified                                      | Added TSDoc with worker-scoped auto fixture example to `registerUI5SelectorEngine()`        |

**Playwright Best Practice Verification Checklist**:

- [x] Web-first assertions: matchers use `toPass()` for auto-retry (PW1 fix)
- [x] No `page.waitForTimeout()`: `briefDOMSettle` uses browser-side `requestAnimationFrame` (Principle 8)
- [x] `test.step()` integration: `withStep()` wrapper with graceful degradation outside test context
- [x] Project dependencies auth pattern: documented in skills-playwright-expert.md Section 5
- [x] `selectors.register()` called once per worker via auto fixture (PW5/PW8 fix)
- [x] Custom matchers return correct `MatcherReturnType` shape (PW2 fix)
- [x] `page.evaluate()` receives only JSON-serializable args (PW3 fix: RegExp serialized)
- [x] Compat layer detects version via `createRequire` (PW6 fix: no direct export available)
- [x] `retain-on-failure` trace config recommended for CI
- [x] Forbidden patterns documented: `page.waitForTimeout`, `page.$()`, `globalSetup` for auth

### 17.5 v1.4.0 Review (TDD Expert) — All Resolved

Systematic review of all test specifications for implementation readiness. 14 wizard questions asked and resolved.

| #   | Severity | Issue                                                                                 | Resolution                                                                                       |
| --- | -------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| T1  | HIGH     | ~60% test cases under-specified (one-line descriptions, no Input/Expected)            | Expanded ALL test tables with full Input/Expected/Assertion columns (~395 total)                 |
| T2  | HIGH     | No type-level tests for 7 type-only files                                             | Added 5 `expectTypeOf` test files (30 tests) using Vitest `expectTypeOf`                         |
| T3  | HIGH     | 10 base behavior tests × 10 error subclasses = 100 copy-paste tests                   | Created shared `runBaseErrorTests()` helper (TH3 batch) — DRY 100 assertions                     |
| T4  | HIGH     | `toJSON()` and `toUserMessage()` output shapes undefined — tests can't assert         | Added exact output templates with field order and format                                         |
| T5  | HIGH     | Error subclass `retryable` defaults ambiguous — tests assumed but plan didn't specify | Added retryable defaults table (10 rows) + default code values table (10 rows)                   |
| T6  | HIGH     | TDD cycle violated: tests and source shipped in same batch without RED verification   | Added TDD Batch Protocol (rule 10): test-first, verify RED, then source, verify GREEN            |
| T7  | MEDIUM   | Mock helper specs incomplete — only file paths listed, no APIs                        | Added full typed APIs for all 4 helpers (mock-config, mock-page, mock-bridge, error-test-runner) |
| T8  | MEDIUM   | Selector parser missing edge cases (Unicode, nested brackets, depth limit)            | Added 9 edge cases (20→29 total tests)                                                           |
| T9  | MEDIUM   | Matchers missing error paths (adapter throws, undefined, concurrent)                  | Added 7 error/edge cases (15→22 total tests)                                                     |
| T10 | MEDIUM   | version-compare had only 10 test cases, insufficient for boundary coverage            | Expanded to 18 tests with full Input/Expected table                                              |
| T11 | MEDIUM   | OTel lazy import mock strategy unspecified — tests would need vi.doMock               | Added brief mock strategy notes (`vi.doMock` for dynamic `import()`)                             |
| T12 | MEDIUM   | Coverage thresholds had no update schedule — when to enforce Tier 1/2/3               | Added coverage gate schedule: Tier 1 at B3c, Tier 2 at B7c, Tier 3 at B11                        |
| T13 | MEDIUM   | error-test-runner.ts in TH1 batch but depends on B2a error classes (wrong deps)       | Created separate TH3 batch, updated B2b/B2c to depend on TH3                                     |
| T14 | MEDIUM   | Test file inventory count stale after expansions                                      | Updated: 35 files + 4 helpers, ~395 test cases, 30 batches                                       |

**TDD Readiness Verification Checklist**:

- [x] Every test case has Input + Expected (no ambiguity)
- [x] All mock helpers fully specified with typed APIs
- [x] Type-only files have `expectTypeOf` test specs
- [x] Error subclass defaults documented (retryable + code)
- [x] Shared test runner prevents 100+ copy-paste tests
- [x] TDD Batch Protocol enforces RED-before-GREEN
- [x] Coverage gates scheduled at sub-phase boundaries
- [x] Edge cases added for parsers, matchers, and comparators
- [x] Mock strategy specified for each module (vi.mock, vi.spyOn, vi.doMock)
- [x] All counts reconciled: 35 test files, 4 helpers, ~414 tests, ~45 batches

### 17.6 v1.5.0 Review (PA + Implementation Engineer — Final Consistency) — All Resolved

Full three-agent parallel consistency audit across all 4,200+ lines. LSP verified (vtsls), CI baseline green.

| #   | Severity | Issue                                                                                         | Resolution                                                                                         |
| --- | -------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| C6  | CRITICAL | `core/types/config.ts` re-exports from `core/config/schema.ts` — circular dep                 | Removed re-export. Types barrel imports `PramanConfig` from `core/config/schema.js`                |
| C7  | CRITICAL | `core/errors/index.ts` barrel missing `AIErrorContext` export                                 | Added `AIErrorContext` to barrel re-exports                                                        |
| C8  | CRITICAL | `registerUI5Matchers` conflicting signatures (no-arg vs `adapter` param)                      | Fixed barrel to re-export from `ui5-matchers.js` — no-arg + `setMatcherAdapter()` is canonical     |
| C9  | CRITICAL | `ui5WaitTimeout` default: schema=30s, constant=15s, comment=15s                               | Fixed: config default=30s (authoritative), constant=15s (fallback when no config), comment updated |
| C10 | CRITICAL | Critical path stated 7 steps, actual is 8 (via B4a→B4b→B7c)                                   | Fixed to 8 steps: `B1a→B3a→B3b→B3c→B4a→B4b→B7c→B11`                                                |
| H10 | HIGH     | `AuthConfig`, `AIConfig`, `TelemetryConfig`, `SelectorConfig` phantom exports — never defined | Removed from types barrel. Use `PramanConfig['auth']` etc.                                         |
| H11 | HIGH     | `compat` imports from `core/errors/base.js` but dep rules didn't allow it                     | Added `core/errors/base.js` to compat dependency rule                                              |
| H12 | HIGH     | `normalizeScreenshotOptions` ghost function in design flow                                    | Removed from design flow (Phase 2 feature)                                                         |
| H13 | HIGH     | Source file count 33 in impact analysis vs 36 in inventory                                    | Fixed to 36                                                                                        |
| H14 | HIGH     | Error test count ~115 vs actual ~177                                                          | Fixed to ~177                                                                                      |
| H15 | HIGH     | Type-level tests claimed 30, actual sum is 24                                                 | Fixed to 24                                                                                        |
| H16 | HIGH     | Test totals ~395 vs actual ~414 (inventory sums to 414)                                       | Fixed: inventory corrected (selectors 31, matchers 24), total ~414                                 |
| H17 | HIGH     | Test file breakdown 31+4 should be 30+5                                                       | Fixed to 30 unit + 5 type-level                                                                    |
| M7  | MEDIUM   | `skipStabilityWait` in 3 locations — no precedence documented                                 | Tracked: resolve in B7a (per-call > config.selectors > config top-level)                           |
| M8  | MEDIUM   | `controlDiscoveryTimeout` vs `selectors.defaultTimeout` overlap                               | Tracked: resolve in B3a (deduplicate in schema)                                                    |
| M9  | MEDIUM   | schema.test.ts: only 10 of 20 test cases enumerated                                           | Tracked: implementer fills remaining during TDD                                                    |
| M10 | MEDIUM   | loader.test.ts: only 12 of 15 test cases enumerated                                           | Tracked: implementer fills remaining during TDD                                                    |
| M11 | MEDIUM   | pino mock helper unspecified                                                                  | Tracked: add `vi.mock('pino')` inline in B4a tests                                                 |
| M12 | MEDIUM   | mock-bridge-adapter says "throws" but vi.fn() returns undefined                               | Tracked: fix in TH2 — use `vi.fn().mockRejectedValue()` or explicit throw                          |
| M13 | MEDIUM   | `selectors.ts` has runtime helpers in "type-only" file                                        | Tracked: move `serializeSelectorForBrowser()` to selector-parser.ts in B9a                         |
| M14 | MEDIUM   | LOC total ~4,210 claimed vs ~4,060 actual                                                     | Fixed to ~4,060                                                                                    |

**Implementation Constraint Updates (Max5 plan)**:

- [x] Batch count increased: 30 → ~45 (smaller batches for Max5 token budget)
- [x] Max parallelism reduced: 5 → 2 (Max5 constraint)
- [x] Quality gates: every batch runs full `npm run ci`
- [x] Commits: direct to main, Husky hooks enabled
- [x] Tracker: Markdown + GitHub Issues

---

> **Phase 1 COMPLETE** — 2026-02-16
> 511 tests passing | 40 test files | 36 source files | 12 barrels | 98.92% statement coverage
> ESLint: 0 errors, 0 warnings | TypeCheck: 0 errors | Build: ESM + CJS dual output validated
> **Next step**: Phase 2 — Bridge Adapters
