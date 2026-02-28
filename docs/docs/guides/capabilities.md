---
sidebar_position: 39
title: Feature Inventory
---

Complete feature inventory for Praman v1.0. Each entry documents what the feature does, why it matters,
its API, implicit behaviors, and source files.

:::tip
For the auto-generated API reference from TSDoc comments, see the **API Reference** in the navbar.
This page provides a higher-level feature overview with usage examples and context.
:::

## Overview

| Metric                   | Count |
| ------------------------ | ----- |
| **Public Functions**     | 120+  |
| **Public Types**         | 100+  |
| **Error Codes**          | 58    |
| **Fixture Modules**      | 12    |
| **Custom Matchers**      | 10    |
| **UI5 Control Types**    | 199   |
| **Auth Strategies**      | 6     |
| **SAP Business Domains** | 5     |
| **Sub-Path Exports**     | 6     |

For the full detailed inventory with API examples, source files, and implicit behaviors,
see the [capabilities document](https://github.com/mrkanitkar/playwright-praman/blob/main/plans/capabilities.md).

## Core Playwright Extensions

### UI5 Control Discovery

Discovers SAP UI5 controls using a multi-strategy chain (cache, direct-ID, RecordReplay, registry scan) and returns a typed proxy for interaction. Eliminates brittle CSS/XPath selectors.

```typescript
const btn = await ui5.control({ id: 'saveBtn' });
const input = await ui5.control({
  controlType: 'sap.m.Input',
  properties: { placeholder: 'Enter vendor' },
});
```

### Control Proxy (Typed Method Forwarding)

Wraps discovered controls in a JavaScript Proxy that routes method calls through `page.evaluate()` with automatic type detection and method blacklisting.

```typescript
const control = await ui5.control({ id: 'myInput' });
await control.press();
await control.enterText('Hello');
const value = await control.getValue();
```

### Three Interaction Strategies

- **UI5-native** (default): `firePress()` / `fireTap()` / DOM click fallback
- **DOM-first**: DOM click first, UI5 event fallback
- **OPA5**: SAP RecordReplay API

### 10 Custom UI5 Matchers

Extends `expect()` with UI5-specific assertions: `toHaveUI5Text`, `toBeUI5Visible`, `toBeUI5Enabled`, `toHaveUI5Property`, `toHaveUI5ValueState`, `toHaveUI5Binding`, `toBeUI5ControlType`, `toHaveUI5RowCount`, `toHaveUI5CellText`, `toHaveUI5SelectedRows`.

## SAP UI5 Control Support

- **199 typed control definitions** covering all major categories
- **Table operations** for 6 table variants (sap.m.Table, sap.ui.table.Table, TreeTable, AnalyticalTable, SmartTable, mdc.Table)
- **Dialog management** for 10+ dialog types
- **Date/time picker** operations with locale awareness

## UI5 Lifecycle & Synchronization

- **Automatic stability wait** — three-tier: bootstrap (60s) / stable (15s) / DOM settle (500ms)
- **Request interception** — blocks WalkMe, Google Analytics, Qualtrics
- **Retry with exponential backoff** — infrastructure-level retry with jitter

## Fixtures & Test Abstractions

- **12 fixture modules** merged via `mergeTests()`
- **6 authentication strategies**: basic, BTP SAML, Office 365, API, certificate, multi-tenant
- **9 FLP navigation functions**: app, tile, intent, hash, home, back, forward, search, getCurrentHash
- **FLP shell & footer** interaction
- **SM12 lock management** with auto-cleanup
- **User settings** reader (language, date format, timezone)
- **Test data generation** with UUID/timestamp substitution

## OData / API Automation

- **Model-level access** — read data from UI5 OData models in the browser
- **HTTP-level CRUD** — direct OData operations with CSRF token management

## AI & Agent Enablement

- **Page discovery** — structured `PageContext` for AI agents
- **Capability registry** — machine-readable API catalog for prompt engineering
- **Recipe registry** — reusable test pattern library
- **Agentic handler** — autonomous test generation from natural language
- **LLM abstraction** — provider-agnostic (Claude, OpenAI, Azure OpenAI)
- **Vocabulary service** — business term to UI5 selector resolution

## Configuration & Extensibility

- **Zod-validated config** with environment variable overrides
- **14 error classes, 58 error codes** with `retryable` flag and `suggestions[]`
- **Structured logging** with secret redaction
- **OpenTelemetry integration** for distributed tracing
- **Playwright step decoration** for rich HTML reports

## Domain-Specific Features

- **Fiori Elements helpers** — List Report + Object Page APIs
- **5 SAP domain intents** — Procurement, Sales, Finance, Manufacturing, Master Data
- **Compliance reporter** — tracks Praman vs raw Playwright usage
- **OData trace reporter** — per-entity-set performance statistics
- **CLI tools** — `init` (scaffold + IDE agent installation), `doctor`, `uninstall`
- **AI agents** — 3 Claude Code SAP agents (planner, generator, healer) installed by `init`
- **Seed file** — authenticated SAP browser session for AI discovery (`tests/seeds/sap-seed.spec.ts`)
