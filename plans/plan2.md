# Phase 2 — Bridge + Proxy: Detailed Implementation Plan

> **Version**: 2.1.0 (revised 2026-02-16 — code-verified corrections in Appendix A)
> **Status**: Implementation-Ready — Chief Architect review complete + wdi5 code audit
> **Parent**: plan.md v2.1.0 (Phase 1 COMPLETE)
> **Duration**: 4 weeks (3 sub-phases)
> **Approach**: TDD (tests first)
> **Predecessor**: Phase 1 — 511 tests, 40 test files, 36 source files, 98.92% coverage

---

## Table of Contents

1. [Decision Log](#1-decision-log)
2. [Sub-Phase Breakdown](#2-sub-phase-breakdown)
3. [Dependency Graph](#3-dependency-graph)
4. [Architecture Overview](#4-architecture-overview)
5. [End-to-End Data Flow](#5-end-to-end-data-flow)
6. [Sub-Phase 2.1 — Bridge Foundation](#6-sub-phase-21--bridge-foundation)
7. [Sub-Phase 2.2 — Proxy Layer](#7-sub-phase-22--proxy-layer)
8. [Sub-Phase 2.3 — Integration + Barrels](#8-sub-phase-23--integration--barrels)
9. [Complete File Inventory](#9-complete-file-inventory)
10. [Test Plan](#10-test-plan)
11. [Impact Analysis](#11-impact-analysis)
12. [Quality Gates Per Sub-Phase](#12-quality-gates-per-sub-phase)
13. [Risk Register](#13-risk-register)
14. [Implementation Batching](#14-implementation-batching)
15. [SAP UI5 API Reference](#15-sap-ui5-api-reference)
16. [Summary](#16-summary)

---

## 1. Decision Log

These decisions were made during Phase 2 planning and are **binding** for implementation.

| #   | Question                           | Decision                                                                                                                                                                                                              | Rationale                                                                                                                                           |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Which adapter ships first?         | **ClassicUI5Adapter** — covers 95%+ of SAP FLP use cases                                                                                                                                                              | RecordReplay + Element.registry are available in all target UI5 versions (1.71+)                                                                    |
| W2  | WebComponent adapter scope?        | **Stub only** — Phase 2 defines interface + no-crash fallback for FLP ShellBar                                                                                                                                        | Full @ui5/webcomponents support deferred to Phase 3+ per plan.md D3                                                                                 |
| W3  | HybridAdapter scope?               | **Auto-detect per element** — delegates to Classic or WebComponent adapter                                                                                                                                            | Enables mixed FLP pages where shell uses web-components but app uses classic UI5                                                                    |
| W4  | Proxy pattern?                     | **Single unified Proxy** per control (D16) — NO double-proxy from dhikraft v2.5.0                                                                                                                                     | wdi5 uses `.bind()` not Proxy (see A.2); Praman uses Proxy for dynamic method interception — cleaner than pre-binding all methods at discovery time |
| W5  | Object proxy approach?             | **UUID-based persistence** with TTL cleanup — `window.__praman_objectMap`                                                                                                                                             | Proven pattern from both wdi5 and dhikraft; prevents memory leaks in long runs                                                                      |
| W6  | Method filtering?                  | **Hybrid**: dhikraft 88-item blocklist + wdi5 dynamic rules (`_` prefix, `Render` filter, 5 explicit exclusions)                                                                                                      | See Appendix A.1 — wdi5 uses 5-item filter + 2 rules, NOT 88-item list. Praman combines both for maximum safety                                     |
| W7  | Interaction strategies?            | **3 strategies**: playwright-native (default), dom-first, opa5-recordreplay                                                                                                                                           | Same as dhikraft v2.5.0; strategy selection via PramanConfig                                                                                        |
| W8  | Browser script format?             | **Serialized string functions** for `page.evaluate()` + `addInitScript()`                                                                                                                                             | Playwright constraint: browser scripts must be serializable                                                                                         |
| W9  | Discovery priority chain?          | **2-tier**: RecordReplay.findDOMElementByControlSelector (primary) → getById fallback (ID-only selectors)                                                                                                             | wdi5 uses RecordReplay ONLY (see A.3). 5-level chain was dhikraft-specific. Registry iteration / property matching deferred to Phase 3+             |
| W10 | Typed proxy generation?            | ~~Manual interfaces for top 20 controls in Phase 2; auto-gen in Phase 6~~ → **D22 COMPLETE**: Auto-gen pulled forward to Phase 1. 199 interfaces, 4,092 methods generated from api.json. Phase 2 uses these directly. | Original plan superseded. `scripts/generate-typed-proxies.ts` operational.                                                                          |
| W11 | Development approach?              | **TDD** (tests first) — Red-Green-Refactor for every module                                                                                                                                                           | Proven in Phase 1 (511 tests); non-negotiable                                                                                                       |
| W12 | RegExp serialization?              | Serialize via `{ source, flags }` pair; reconstruct in browser with `new RegExp()`                                                                                                                                    | Phase 1 `serializeSelectorForBrowser()` already handles this                                                                                        |
| W13 | Error handling in browser scripts? | **Try-catch → BridgeResult envelope** — all browser errors wrapped, never thrown raw                                                                                                                                  | Consistent with Phase 1 `BridgeResult<T>` type contract                                                                                             |

---

## 2. Sub-Phase Breakdown

```
Phase 2 — Bridge + Proxy (4 weeks)
├── Sub-Phase 2.1 — Bridge Foundation (Week 1-2)
│   ├── Bridge types & constants
│   │   ├── method-blacklist.ts (88 items, wdi5 parity)
│   │   ├── bridge-types.ts (browser-side type augmentations)
│   │   └── bridge-constants.ts (timeouts, XHR patterns, globals)
│   ├── Browser scripts
│   │   ├── inject-ui5.ts (RecordReplay attach, __praman namespace setup)
│   │   ├── find-control.ts (5-level discovery chain)
│   │   ├── execute-method.ts (method call + 7-type return detection)
│   │   ├── get-version.ts (UI5 version detection)
│   │   ├── object-map.ts (UUID storage + TTL cleanup)
│   │   └── get-selector.ts (reverse selector engineering)
│   ├── Injection engine
│   │   └── injection.ts (eager + late injection, idempotent)
│   ├── API resolver
│   │   └── api-resolver.ts (3-tier: Element.getElementById → Registry → Core.byId)
│   ├── Interaction strategies
│   │   ├── strategy.ts (InteractionStrategy interface)
│   │   ├── shared.ts (shared fireEvent + bridge accessor)
│   │   ├── playwright-strategy.ts (fire* methods, default)
│   │   ├── dom-first-strategy.ts (DOM clicks + UI5 fallback)
│   │   ├── opa5-strategy.ts (RecordReplay.interactWithControl)
│   │   └── strategy-factory.ts (config-driven selection)
│   └── Adapters
│       ├── classic-adapter.ts (ClassicUI5Adapter — full implementation)
│       ├── webcomponent-adapter.ts (WebComponentAdapter — stub/fallback)
│       ├── hybrid-adapter.ts (HybridAdapter — auto-detect delegation)
│       └── adapter-factory.ts (version-negotiated creation)
│
├── Sub-Phase 2.2 — Proxy Layer (Week 2-3)
│   ├── Dynamic proxy
│   │   ├── dynamic-proxy.ts (single unified Proxy handler)
│   │   ├── return-handler.ts (7-type return router)
│   │   └── method-filter.ts (blacklist enforcement)
│   ├── UI5Object proxy
│   │   ├── ui5-object.ts (UI5Object class, method forwarding)
│   │   ├── ui5-object-proxy.ts (Proxy wrapper for non-control objects)
│   │   └── ui5-object-cache.ts (UUID cache with TTL + LRU)
│   ├── Proxy converter
│   │   └── proxy-converter.ts (bidirectional Control ↔ Object)
│   ├── Discovery integration
│   │   ├── discovery.ts (3-tier Node-side orchestrator)
│   │   └── discovery-factory.ts (5-strategy selection)
│   ├── Control proxy cache
│   │   └── cache.ts (LRU, RegExp-safe keys)
│   └── Typed control interfaces (top 20)
│       ├── ui5-button.ts, ui5-input.ts, ui5-table.ts, ...
│       └── typed/index.ts (barrel)
│
└── Sub-Phase 2.3 — Integration + Barrels (Week 4)
    ├── Bridge barrel (bridge/index.ts)
    ├── Proxy barrel (proxy/index.ts)
    ├── Main barrel update (src/index.ts)
    └── Integration validation
```

---

## 3. Dependency Graph

```
                    ┌───────────────────────┐
                    │  Phase 1: core/*      │  ← COMPLETE (types, errors,
                    │  selectors/*, matchers│     config, logging, compat,
                    │  tests/helpers/       │     utils, mock-bridge)
                    └───────────┬───────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
  ┌──────▼──────┐     ┌────────▼────────┐    ┌────────▼────────┐
  │ bridge/     │     │ bridge/browser- │    │ bridge/         │
  │ types &     │     │ scripts/        │    │ interaction-    │
  │ constants   │     │ (inject, find,  │    │ strategies/     │
  └──────┬──────┘     │  execute, etc.) │    │ (3 strategies)  │
         │            └────────┬────────┘    └────────┬────────┘
         │                     │                      │
         │            ┌────────▼────────┐             │
         │            │ bridge/         │             │
         │            │ injection.ts    │◄────────────┘
         │            │ api-resolver.ts │
         │            └────────┬────────┘
         │                     │
         └─────────┬───────────┘
                   │
          ┌────────▼────────┐
          │ bridge/adapters │
          │ (classic,       │
          │  webcomp, hybrid│
          │  adapter-factory│
          └────────┬────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
┌───▼────┐  ┌─────▼─────┐  ┌────▼──────┐
│proxy/  │  │proxy/     │  │proxy/     │
│dynamic │  │ui5-object │  │discovery  │
│-proxy  │  │(object,   │  │(discovery,│
│return- │  │ cache,    │  │ factory)  │
│handler │  │ proxy)    │  └───────────┘
│method- │  └─────┬─────┘
│filter  │        │
└───┬────┘  ┌─────▼──────┐
    │       │proxy/      │
    │       │converter   │
    │       │cache       │
    │       └────────────┘
    │
┌───▼────────────────┐
│proxy/typed/        │
│(20 typed wrappers) │
└────────────────────┘
```

### Dependency Rules

- `bridge/types`, `bridge/constants` → imports from `#core/types`, `#core/errors` only
- `bridge/browser-scripts/*` → ZERO Node imports (browser context, string serialized)
- `bridge/injection.ts` → imports `bridge/browser-scripts/*`, `#core/logging`
- `bridge/api-resolver.ts` → imports `bridge/types`, `#core/utils/version-compare`
- `bridge/interaction-strategies/*` → imports `bridge/types`, `#core/types`
- `bridge/adapters/*` → imports all bridge sub-modules, `#core/*`
- `proxy/*` → imports `#bridge/*`, `#core/*` (proxy depends on bridge, never reverse)
- `proxy/typed/*` → imports `proxy/dynamic-proxy`, `#core/types/controls`

**Layer rule**: `bridge/` NEVER imports from `proxy/`. `proxy/` imports from `bridge/`.

---

## 4. Architecture Overview

### 4.1 Revised Proxy Architecture (D16: Single Unified Proxy)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Test Code (Node.js)                              │
│  const button = await ui5.button({ text: 'Save' });                │
│  await button.press();                                              │
│  const text = await button.getText();                               │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│  Layer 3: SINGLE UNIFIED PROXY (dynamic-proxy.ts)                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  new Proxy(controlState, {                                    │  │
│  │    get(target, prop) {                                        │  │
│  │      if (prop === 'then') return undefined;  // anti-thenable │  │
│  │      if (BLACKLIST.has(prop)) throw ControlError;             │  │
│  │      if (typed[prop]) return typed[prop];    // typed wrapper │  │
│  │      return (...args) => executeControlMethod(prop, args);    │  │
│  │    }                                                          │  │
│  │  })                                                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Return Handler (return-handler.ts):                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  switch (returnType) {                                       │   │
│  │    'empty'      → return undefined                           │   │
│  │    'result'     → return primitive value                     │   │
│  │    'element'    → return this (same proxy, chaining)         │   │
│  │    'newElement' → create new UI5ControlProxy(id)             │   │
│  │    'aggregation'→ return UI5ControlProxy[]                   │   │
│  │    'object'     → wrap in UI5Object(uuid) + cache            │   │
│  │    'none'       → log warning, return undefined              │   │
│  │  }                                                           │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────┐
│  Layer 2: BRIDGE ADAPTER (BridgeAdapter interface)                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  ClassicUI5Adapter                                            │  │
│  │  ├─ init(page): inject bridge + attach RecordReplay           │  │
│  │  ├─ findControl(selector): discovery chain → UI5ControlBase   │  │
│  │  ├─ executeControlMethod(id, method, args): BridgeResult<T>   │  │
│  │  ├─ waitForUI5Stable(): RecordReplay.waitForUI5()             │  │
│  │  └─ getAvailableMethods(id): prototype traversal + blacklist  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Injection Engine (injection.ts):                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Eager: context.addInitScript(bridgeCode)  — before page load │  │
│  │  Late:  page.evaluate(bridgeCode)          — after page load  │  │
│  │  Idempotent: checks window.__praman_bridge before injecting   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Interaction Strategies (strategy pattern):                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ playwright-  │ │ dom-first    │ │ opa5-record  │               │
│  │ native       │ │ (DOM clicks  │ │ replay       │               │
│  │ (fire* API)  │ │ + UI5 fall.) │ │ (SAP OPA5)   │               │
│  │ DEFAULT      │ │              │ │              │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ page.evaluate()
┌─────────────────────────────────▼───────────────────────────────────┐
│  BROWSER CONTEXT (JavaScript / SAP UI5)                             │
│                                                                     │
│  window.__praman_bridge = {                                         │
│    version: '1.0.0',                                                │
│    ui5Version: '1.120.0',                                           │
│    ready: true,                                                     │
│    RecordReplay: sap.ui.test.RecordReplay,                          │
│    Element: sap.ui.core.Element,                                    │
│    Log: sap.base.Log,                                               │
│    objectMap: Map<UUID, UI5Object>,                                 │
│    getById: (id) => modernResolverChain(id),                        │
│    saveObject: (obj) => UUID,                                       │
│    getObject: (uuid) => obj,                                        │
│    utils: { isPrimitive, collapseObject, getCircularReplacer }      │
│  }                                                                  │
│                                                                     │
│  API Resolution Chain (D19):                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ 1. Element.getElementById(id)    [UI5 ≥ 1.119, RECOMMENDED] │   │
│  │ 2. ElementRegistry.get(id)       [UI5 ≥ 1.120, alternative] │   │
│  │ 3. Core.byId(id)                 [LEGACY, deprecated 1.118] │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Control Discovery Chain (W9 — revised per Appendix A.3):           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Tier 0: Node-side cache (LRU, skip browser round-trip)       │   │
│  │ Tier 1: RecordReplay.findDOMElementByControlSelector()       │   │
│  │         (PRIMARY — handles all selector types, wdi5-proven)  │   │
│  │ Tier 2: Direct getById(id) fallback for ID-only selectors    │   │
│  │         (Element.getElementById → Registry → Core.byId)      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 UI5Object Proxy Chain (D17: Bidirectional)

```
┌──────────────────────────────────────────────────────────────┐
│  UI5ControlProxy (button)                                     │
│  await button.getModel('userData')                            │
│       │                                                       │
│       ▼ executeControlMethod → returnType: 'object'           │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Browser: stores object in __praman_bridge.objectMap     │   │
│  │ Returns: { uuid: 'obj-abc123', type: 'JSONModel' }     │   │
│  └────────────────────────────┬───────────────────────────┘   │
│                               ▼                               │
│  UI5Object.create({ uuid, type, page })                       │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ UI5ObjectProxy wraps → method calls forwarded via UUID  │   │
│  │  .getData()        → 'result'  → raw data               │   │
│  │  .getProperty('/') → 'result'  → value                  │   │
│  │  .methodCall()     → 'object'  → detect Control type    │   │
│  │       │                                                 │   │
│  │       ▼ proxy-converter.ts detects Control               │   │
│  │  Return UI5ControlProxy (bidirectional D17)              │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
│  Cache: UI5ObjectCache (TTL 5min + LRU 1000 entries)          │
│  Browser: objectMap TTL cleanup on idle                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. End-to-End Data Flow

### 5.1 Control Discovery Flow

```
TEST CODE: const button = await ui5.button({ text: 'Save' });

1. Parse selector string → UI5Selector (Phase 1: selector-parser.ts)
2. Check proxy cache (proxy/cache.ts) → cache miss
3. Call adapter.findControl(selector)
   ├─ ClassicUI5Adapter.findControl()
   │  ├─ page.evaluate(findControlScript, serializedSelector)
   │  │   ┌─── BROWSER CONTEXT ───────────────────────────────┐
   │  │   │ 1. await bridge.waitForUI5(options)  [ALWAYS]     │
   │  │   │ 2. createMatcher(selector)  [regex + version]     │
   │  │   │ 3. RecordReplay.findDOMElementByControlSelector() │
   │  │   │ 4. getUI5CtlForWebObj(dom)  [version-split A.7]  │
   │  │   │ 5. Extract methods via prototype traversal         │
   │  │   │    → filter: _prefix, Render, 5 explicit exclusions│
   │  │   │ 6. Return { id, controlType, methods[], domElement}│
   │  │   └───────────────────────────────────────────────────┘
   │  └─ Return { id, controlType, methods[] }
4. Create UI5ControlProxy via dynamic-proxy.ts
   ├─ Proxy handler intercepts all property access
   ├─ Bind typed methods (getText, press, setValue, etc.)
   └─ Store in proxy cache
5. Return typed proxy to test code
```

### 5.2 Method Execution Flow

```
TEST CODE: await button.press();

1. Proxy get trap intercepts 'press'
2. Method not in BLACKLIST → proceed
3. InteractionStrategy selected (default: playwright-native)
4. PlaywrightStrategy.interact(page, controlId, 'press', [])
   ├─ page.evaluate(interactionScript, { id, method: 'press' })
   │   ┌─── BROWSER CONTEXT ──────────────────────────────────┐
   │   │ 1. const control = __praman_bridge.getById('saveBtn') │
   │   │ 2. if (control.firePress) control.firePress()          │
   │   │    else fallback to DOM click                          │
   │   │ 3. Return { success: true, duration: 45 }             │
   │   └───────────────────────────────────────────────────────┘
5. Return handler: 'element' type → return same proxy (chaining)
```

### 5.3 Object Return Flow

```
TEST CODE: const model = await button.getModel('userData');

1. Proxy intercepts 'getModel'
2. executeControlMethod('saveBtn', 'getModel', ['userData'])
   ├─ page.evaluate(executeMethodScript, args)
   │   ┌─── BROWSER CONTEXT ──────────────────────────────────┐
   │   │ 1. control = __praman_bridge.getById('saveBtn')       │
   │   │ 2. result = control.getModel('userData')               │
   │   │ 3. Detect: result has getMetadata() → is UI5 object   │
   │   │ 4. uuid = __praman_bridge.saveObject(result)           │
   │   │ 5. Return { returnType: 'object', uuid, type: 'Model'}│
   │   └───────────────────────────────────────────────────────┘
3. Return handler: 'object' type
   ├─ Check UI5ObjectCache → miss
   ├─ UI5Object.create({ uuid, type, page })
   ├─ Wrap in UI5ObjectProxy
   ├─ Store in cache (TTL 5min)
   └─ Return proxy
4. Test code: await model.getData()
   ├─ UI5ObjectProxy intercepts 'getData'
   └─ page.evaluate(objectMethodScript, { uuid, method: 'getData' })
```

---

## 6. Sub-Phase 2.1 — Bridge Foundation

### 6.1 Module: bridge/method-blacklist.ts

**Purpose**: 88-item method blacklist preventing dangerous UI5 internal method calls. wdi5 parity.

```typescript
export const METHOD_BLACKLIST: ReadonlySet<string> = new Set([
  // wdi5 bridge methods (5)
  '$',
  'getAggregation',
  'constructor',
  'fireEvent',
  'init',
  // Event methods (8)
  'fireValidateFieldGroup',
  'attachEvent',
  'detachEvent',
  'attachBrowserEvent',
  'detachBrowserEvent',
  'attachValidateFieldGroup',
  'detachValidateFieldGroup',
  'getEventingParent',
  // ... (full 88 items in implementation)
]) as ReadonlySet<string>;

export function isBlacklisted(methodName: string): boolean;
export function filterMethods(methods: readonly string[]): readonly string[];
```

**Estimated LOC**: ~120
**Tests**: 12 test cases

| #   | Test Case                         | Expected                                       |
| --- | --------------------------------- | ---------------------------------------------- |
| 1   | Contains all 88 wdi5-parity items | `METHOD_BLACKLIST.size === 88`                 |
| 2   | Blocks `constructor`              | `isBlacklisted('constructor') === true`        |
| 3   | Blocks internal `_` methods       | `isBlacklisted('_getBindingContext') === true` |
| 4   | Allows `getText`                  | `isBlacklisted('getText') === false`           |
| 5   | Allows `getProperty`              | `isBlacklisted('getProperty') === false`       |
| 6   | Allows `getId`                    | `isBlacklisted('getId') === false`             |
| 7   | Allows `firePress`                | `isBlacklisted('firePress') === false`         |
| 8   | filterMethods removes blacklisted | Array filtered correctly                       |
| 9   | filterMethods preserves order     | Non-blacklisted methods in original order      |
| 10  | Blacklist is frozen (immutable)   | Attempt to add throws or no-ops                |
| 11  | Blocks `rerender` (rendering)     | `isBlacklisted('rerender') === true`           |
| 12  | Blocks `clone` (lifecycle)        | `isBlacklisted('clone') === true`              |

### 6.2 Module: bridge/bridge-constants.ts

**Purpose**: Shared constants for bridge timeouts, XHR ignore patterns, global namespace names.

```typescript
export const BRIDGE_GLOBALS = {
  NAMESPACE: '__praman_bridge',
  READY_FLAG: '__praman_ready',
  OBJECT_MAP: '__praman_objectMap',
} as const;

export const BRIDGE_TIMEOUTS = {
  INJECTION: 30_000,
  CONTROL_FIND: 10_000,
  UI5_STABLE: 30_000,
  POLLING_INTERVAL: 100,
  OBJECT_TTL: 300_000, // 5 minutes
} as const;

export const XHR_IGNORE_PATTERNS: readonly string[] = [
  'walkme',
  'pendo',
  'analytics',
  'tracking',
  'hotjar',
  'fullstory',
  'sentry',
  'newrelic',
  'dynatrace',
  'appdynamics',
  'datadog',
  // ... (18 total patterns from dhikraft)
];
```

**Estimated LOC**: ~80
**Tests**: 5 test cases (constants validation, freeze checks)

### 6.3 Module: bridge/bridge-types.ts

**Purpose**: Browser-side type definitions for the `__praman_bridge` window namespace.

```typescript
export interface PramanBridge {
  readonly version: string;
  readonly ui5Version: string;
  readonly ready: boolean;
  readonly injectedAt: number;
  readonly injectionMethod: 'eager' | 'late';
  readonly RecordReplay: unknown;
  readonly Element: unknown;
  readonly Log: unknown;
  readonly objectMap: Map<string, unknown>;
  getById(id: string): unknown;
  saveObject(obj: unknown, type?: string): string;
  getObject(uuid: string): unknown;
  deleteObject(uuid: string): boolean;
  readonly utils: PramanBridgeUtils;
}

export interface ControlDiscoveryResult {
  readonly id: string;
  readonly controlType: string;
  readonly methods: readonly string[];
  readonly domId: string | null;
  readonly visible: boolean;
}

export interface MethodExecutionResult<T = unknown> {
  readonly success: boolean;
  readonly returnType: BridgeReturnType;
  readonly value?: T;
  readonly uuid?: string;
  readonly objectType?: string;
  readonly uuids?: readonly string[];
  readonly objectTypes?: readonly string[];
  readonly isArray?: boolean;
  readonly error?: string;
  readonly duration: number;
}
```

**Estimated LOC**: ~100
**Tests**: Type-only tests (8 cases, `expectTypeOf`)

### 6.4 Module: bridge/browser-scripts/inject-ui5.ts

**Purpose**: Bridge injection script that attaches RecordReplay, sets up `__praman_bridge` namespace, loads SAP modules.

**Key Design Decisions**:

- Loads 10 SAP modules via `sap.ui.require()` (same as wdi5 `injectUI5.ts`)
- Sets up helper functions: `getUI5CtlForWebObj`, `createMatcher`, `retrieveControlMethods`
- Idempotent: checks `window.__praman_bridge` before injecting
- Version-aware matcher creation (declarative for UI5 ≥ 1.72, instance-based fallback)

```typescript
export function createBridgeInjectionScript(): string;
```

**Estimated LOC**: ~250 (string template with browser-side JS)
**Tests**: 15 test cases

| #   | Test Case                           | Expected                                          |
| --- | ----------------------------------- | ------------------------------------------------- |
| 1   | Returns non-empty string            | `typeof result === 'string' && result.length > 0` |
| 2   | Contains `__praman_bridge` setup    | String includes namespace assignment              |
| 3   | Contains `sap.ui.require` call      | Loads RecordReplay and other modules              |
| 4   | Contains idempotency check          | Checks existing bridge before overwriting         |
| 5   | Contains version detection          | Reads `sap.ui.version` or `VersionInfo`           |
| 6   | Contains objectMap initialization   | Sets up `Map` for UUID storage                    |
| 7   | Contains `getById` resolver         | Modern → legacy fallback chain                    |
| 8   | Contains `saveObject` function      | UUID generation + map storage                     |
| 9   | Contains `getObject` function       | Map lookup by UUID                                |
| 10  | Contains `deleteObject` function    | Map cleanup                                       |
| 11  | Contains `isPrimitive` helper       | Type check for serialization                      |
| 12  | Contains `collapseObject` helper    | Prototype chain flattening                        |
| 13  | Contains error handling             | Try-catch with structured errors                  |
| 14  | Contains `getUI5CtlForWebObj`       | DOM→Control conversion                            |
| 15  | Contains circular reference handler | `getCircularReplacer` function                    |

### 6.5 Module: bridge/browser-scripts/find-control.ts

**Purpose**: Browser-side control discovery via RecordReplay (primary) + getById fallback (revised per A.3).

```typescript
export function createFindControlScript(): string;
export function createFindAllControlsScript(): string;
```

**Estimated LOC**: ~200
**Tests**: 18 test cases (script generation, selector handling, priority chain)

### 6.6 Module: bridge/browser-scripts/execute-method.ts

**Purpose**: Browser-side method execution with 7-type return detection.

```typescript
export function createExecuteMethodScript(): string;
export function createExecuteObjectMethodScript(): string;
```

**Key Design**: Implements the 7-type return detection system:

1. `empty` — `undefined`/`null` return
2. `result` — primitive (string, number, boolean)
3. `element` — same control returned (setter chaining)
4. `newElement` — different control (getParent, etc.)
5. `aggregation` — array of controls (getItems, getRows)
6. `object` — non-control UI5 object (getModel, getRouter)
7. `none` — unclassified (warning logged)

**Estimated LOC**: ~180
**Tests**: 14 test cases (one per return type + edge cases)

### 6.7 Module: bridge/browser-scripts/get-version.ts

**Purpose**: UI5 version detection script.

```typescript
export function createGetVersionScript(): string;
```

**Estimated LOC**: ~40
**Tests**: 5 test cases

### 6.8 Module: bridge/browser-scripts/object-map.ts

**Purpose**: Browser-side UUID→object storage with TTL cleanup.

```typescript
export function createObjectMapScript(): string;
export function createObjectCleanupScript(): string;
```

**Key Design (D20)**: Objects stored with timestamp; cleanup sweeps objects older than `BRIDGE_TIMEOUTS.OBJECT_TTL`. Uses `WeakRef` where available for GC-friendly storage.

**Estimated LOC**: ~80
**Tests**: 8 test cases (storage, retrieval, TTL expiry, cleanup)

### 6.9 Module: bridge/browser-scripts/get-selector.ts

**Purpose**: Reverse selector engineering — generate selector from DOM element (G5 carry-forward).

```typescript
export function createGetSelectorScript(): string;
```

**Estimated LOC**: ~60
**Tests**: 6 test cases

### 6.10 Module: bridge/injection.ts

**Purpose**: Node-side injection engine — manages eager (addInitScript) and late (page.evaluate) bridge injection.

```typescript
export async function injectBridge(page: BridgePage, method: 'eager' | 'late'): Promise<void>;
export async function ensureBridgeInjected(page: BridgePage): Promise<void>;
export async function isBridgeReady(page: BridgePage): Promise<boolean>;
export async function waitForBridgeReady(page: BridgePage, timeout?: number): Promise<void>;
```

**Estimated LOC**: ~120
**Tests**: 12 test cases

### 6.11 Module: bridge/api-resolver.ts

**Purpose**: Centralized 3-tier API resolution chain (D19). Single `__praman_getById()` registered globally.

```typescript
export function createApiResolverScript(): string;
export function getApiResolverPriority(ui5Version: string): readonly string[];
```

**Estimated LOC**: ~80
**Tests**: 10 test cases (version-based priority, fallback chain)

### 6.12 Module: bridge/interaction-strategies/

**6 files**: `strategy.ts`, `shared.ts`, `playwright-strategy.ts`, `dom-first-strategy.ts`, `opa5-strategy.ts`, `strategy-factory.ts`

```typescript
// strategy.ts
export interface InteractionStrategy {
  readonly name: string;
  interact(
    page: BridgePage,
    controlId: string,
    action: string,
    args: readonly unknown[],
  ): Promise<unknown>;
  setText(page: BridgePage, controlId: string, text: string): Promise<void>;
  press(page: BridgePage, controlId: string): Promise<void>;
}

// strategy-factory.ts
export function createInteractionStrategy(config: Readonly<PramanConfig>): InteractionStrategy;
```

**Estimated LOC**: ~400 total (6 files)
**Tests**: 25 test cases (per strategy: press, setText, fallback; factory selection)

### 6.13 Module: bridge/adapters/

**4 files**: `classic-adapter.ts`, `webcomponent-adapter.ts`, `hybrid-adapter.ts`, `adapter-factory.ts`

```typescript
// classic-adapter.ts — PRIMARY adapter (95%+ of use cases)
export class ClassicUI5Adapter implements BridgeAdapter {
  async init(page: BridgePage): Promise<void>;
  async findControl(selector: UI5Selector): Promise<UI5ControlBase | null>;
  async executeControlMethod(
    controlId: string,
    methodName: string,
    args: readonly unknown[],
  ): Promise<unknown>;
  async waitForUI5Stable(timeout?: number): Promise<void>;
  // ... all 16 BridgeAdapter methods
}

// adapter-factory.ts
export async function createAdapter(
  page: BridgePage,
  config: Readonly<PramanConfig>,
): Promise<BridgeAdapter>;
```

**Estimated LOC**: ~500 total (4 files)
**Tests**: 35 test cases (lifecycle, discovery, method execution, error paths, version detection)

---

## 7. Sub-Phase 2.2 — Proxy Layer

### 7.1 Module: proxy/dynamic-proxy.ts

**Purpose**: Single unified Proxy handler for UI5 controls (D16). Replaces dhikraft's double-proxy.

```typescript
export interface ControlProxyState {
  readonly id: string;
  readonly controlType: string;
  readonly methods: ReadonlySet<string>;
  readonly adapter: BridgeAdapter;
  readonly strategy: InteractionStrategy;
}

export function createControlProxy(state: ControlProxyState): UI5ControlBase;
```

**Key Design**:

- Single `new Proxy()` with one handler — NO nested proxy
- `get` trap: checks blacklist → typed methods → dynamic forwarding
- `then`/`catch`/`finally` return `undefined` (anti-thenable, prevents auto-await issues)
- Fluent chaining: methods returning `void` return the proxy itself

**Estimated LOC**: ~150
**Tests**: 20 test cases

| #   | Test Case                                  | Expected                               |
| --- | ------------------------------------------ | -------------------------------------- |
| 1   | Proxy intercepts property access           | `typeof proxy.getText === 'function'`  |
| 2   | Anti-thenable: `then` returns undefined    | `proxy.then === undefined`             |
| 3   | Anti-thenable: `catch` returns undefined   | `proxy.catch === undefined`            |
| 4   | Blacklisted method throws ControlError     | `proxy.constructor` throws             |
| 5   | Known method calls executeControlMethod    | Adapter called with correct args       |
| 6   | Unknown method forwards dynamically        | Adapter called for arbitrary method    |
| 7   | Return type 'result' returns value         | `await proxy.getText() === 'Save'`     |
| 8   | Return type 'element' returns proxy        | Same proxy reference returned          |
| 9   | Return type 'newElement' creates new proxy | Different proxy returned               |
| 10  | Return type 'aggregation' returns array    | `Array.isArray(result) === true`       |
| 11  | Return type 'object' creates UI5Object     | UI5Object proxy returned               |
| 12  | Return type 'empty' returns undefined      | `result === undefined`                 |
| 13  | Return type 'none' logs warning            | Logger called                          |
| 14  | getId() returns control ID                 | Direct property access                 |
| 15  | getControlType() returns type string       | Direct property access                 |
| 16  | Proxy is not extensible                    | `Object.isExtensible(proxy) === false` |
| 17  | Multiple method calls in sequence          | All resolve correctly                  |
| 18  | Error propagation from adapter             | BridgeError thrown                     |
| 19  | Proxy toString() returns meaningful string | `[UI5Control sap.m.Button#saveBtn]`    |
| 20  | Symbol.toPrimitive handled                 | No crash on implicit conversion        |

### 7.2 Module: proxy/return-handler.ts

**Purpose**: Routes bridge call results to appropriate proxy creation based on 7-type discriminant.

```typescript
export function handleBridgeReturn(
  result: MethodExecutionResult,
  currentProxy: UI5ControlBase,
  adapter: BridgeAdapter,
  strategy: InteractionStrategy,
  cache: UI5ObjectCache,
): unknown;
```

**Estimated LOC**: ~100
**Tests**: 10 test cases (one per return type + edge cases)

### 7.3 Module: proxy/method-filter.ts

**Purpose**: Method blacklist enforcement + prototype-based method extraction.

```typescript
export function extractAllowedMethods(allMethods: readonly string[]): readonly string[];
export function isMethodAllowed(methodName: string): boolean;
```

**Estimated LOC**: ~50
**Tests**: 8 test cases

### 7.4 Module: proxy/ui5-object.ts + ui5-object-proxy.ts + ui5-object-cache.ts

**Purpose**: UI5Object representation, proxy wrapper, and UUID-based cache (D17, D20).

```typescript
// ui5-object.ts
export class UI5Object {
  readonly uuid: string;
  readonly type: string;
  static create(params: { uuid: string; type: string; page: BridgePage }): UI5Object;
  async executeMethod(methodName: string, args: readonly unknown[]): Promise<unknown>;
}

// ui5-object-proxy.ts
export function createUI5ObjectProxy(object: UI5Object): unknown;

// ui5-object-cache.ts
export class UI5ObjectCache {
  get(uuid: string): UI5Object | undefined;
  set(uuid: string, object: UI5Object): void;
  cleanup(): number; // Returns count of expired entries
  readonly size: number;
}
```

**Estimated LOC**: ~300 total (3 files)
**Tests**: 25 test cases (creation, method forwarding, cache TTL, LRU eviction, cleanup)

### 7.5 Module: proxy/proxy-converter.ts

**Purpose**: Bidirectional conversion between UI5ControlProxy and UI5Object (D17).

```typescript
export function isControlResult(result: MethodExecutionResult): boolean;
export function convertToControlProxy(
  objectResult: MethodExecutionResult,
  adapter: BridgeAdapter,
): UI5ControlBase;
export function convertToObjectProxy(
  controlResult: MethodExecutionResult,
  page: BridgePage,
): UI5Object;
```

**Estimated LOC**: ~80
**Tests**: 10 test cases (detect control, convert both directions, edge cases)

### 7.6 Module: proxy/discovery.ts + proxy/discovery-factory.ts

**Purpose**: Node-side control discovery orchestration with 2-tier selection (revised per A.3).

```typescript
// discovery.ts
export async function discoverControl(
  selector: UI5Selector,
  adapter: BridgeAdapter,
  cache: ControlProxyCache,
): Promise<UI5ControlBase | null>;

// discovery-factory.ts
export type DiscoveryStrategy = 'cache' | 'recordreplay' | 'direct-id';
export function getDiscoveryPriorities(selector: UI5Selector): readonly DiscoveryStrategy[];
```

**Estimated LOC**: ~120 total
**Tests**: 12 test cases (cache hit/miss, RecordReplay primary, getById fallback for ID-only selectors)

### 7.7 Module: proxy/cache.ts

**Purpose**: Control proxy cache with LRU eviction and RegExp-safe keys.

```typescript
export class ControlProxyCache {
  get(selector: UI5Selector): UI5ControlBase | undefined;
  set(selector: UI5Selector, proxy: UI5ControlBase): void;
  invalidate(selector: UI5Selector): boolean;
  clear(): void;
  readonly size: number;
}
```

**Key Design**: Selector keys serialized via `serializeUI5Selector()` from Phase 1; RegExp properties converted to `{ source, flags }` for stable hashing.

**Estimated LOC**: ~80
**Tests**: 10 test cases (cache hit/miss, LRU eviction, RegExp keys, invalidation)

### 7.8 Module: proxy/typed/ (20 typed control wrappers)

**Purpose**: Typed TypeScript interfaces for top 20 UI5 controls that delegate to dynamic proxy (D4).

Files: `ui5-button.ts`, `ui5-input.ts`, `ui5-table.ts`, `ui5-combobox.ts`, `ui5-select.ts`, `ui5-checkbox.ts`, `ui5-radio-button.ts`, `ui5-text-area.ts`, `ui5-date-picker.ts`, `ui5-generic-tile.ts`, `ui5-list.ts`, `ui5-icon-tab-bar.ts`, `ui5-dialog.ts`, `ui5-message-strip.ts`, `ui5-smart-table.ts`, `ui5-smart-filter-bar.ts`, `ui5-dynamic-page.ts`, `ui5-overflow-toolbar.ts`, `ui5-multi-input.ts`, `typed/index.ts`

```typescript
// Example: ui5-button.ts
export function createTypedButton(proxy: UI5ControlBase): UI5Button {
  return {
    ...proxy,
    press: () => proxy.executeControlMethod('firePress', []),
    getText: () => proxy.getControlProperty('text') as Promise<string>,
    getEnabled: () => proxy.getControlProperty('enabled') as Promise<boolean>,
    // ... typed methods specific to sap.m.Button
  };
}
```

**Estimated LOC**: ~600 total (20 files × ~30 LOC each)
**Tests**: 20 test cases (one per control type, verifying typed method signatures)

---

## 8. Sub-Phase 2.3 — Integration + Barrels

### 8.1 Bridge Barrel (bridge/index.ts)

```typescript
export type { BridgeAdapter, BridgePage } from './adapter.js';
export { ClassicUI5Adapter } from './classic-adapter.js';
export { WebComponentAdapter } from './webcomponent-adapter.js';
export { HybridAdapter } from './hybrid-adapter.js';
export { createAdapter } from './adapter-factory.js';
export { ensureBridgeInjected, isBridgeReady, waitForBridgeReady } from './injection.js';
export type { InteractionStrategy } from './interaction-strategies/strategy.js';
export { createInteractionStrategy } from './interaction-strategies/strategy-factory.js';
export { METHOD_BLACKLIST, isBlacklisted } from './method-blacklist.js';
export { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS, XHR_IGNORE_PATTERNS } from './bridge-constants.js';
```

### 8.2 Proxy Barrel (proxy/index.ts)

```typescript
export { createControlProxy } from './dynamic-proxy.js';
export { UI5Object } from './ui5-object.js';
export { createUI5ObjectProxy } from './ui5-object-proxy.js';
export { UI5ObjectCache } from './ui5-object-cache.js';
export { ControlProxyCache } from './cache.js';
export { discoverControl } from './discovery.js';
export type { DiscoveryStrategy } from './discovery-factory.js';
```

### 8.3 Main Entry Update (src/index.ts)

Add re-exports from bridge and proxy barrels for the public API.

---

## 9. Complete File Inventory

### 9.1 Source Files

| #         | File Path                                                  | Module | LOC Est.   | Sub-Phase |
| --------- | ---------------------------------------------------------- | ------ | ---------- | --------- |
| 1         | `src/bridge/method-blacklist.ts`                           | Bridge | 120        | 2.1       |
| 2         | `src/bridge/bridge-constants.ts`                           | Bridge | 80         | 2.1       |
| 3         | `src/bridge/bridge-types.ts`                               | Bridge | 100        | 2.1       |
| 4         | `src/bridge/browser-scripts/inject-ui5.ts`                 | Bridge | 250        | 2.1       |
| 5         | `src/bridge/browser-scripts/find-control.ts`               | Bridge | 200        | 2.1       |
| 6         | `src/bridge/browser-scripts/execute-method.ts`             | Bridge | 180        | 2.1       |
| 7         | `src/bridge/browser-scripts/get-version.ts`                | Bridge | 40         | 2.1       |
| 8         | `src/bridge/browser-scripts/object-map.ts`                 | Bridge | 80         | 2.1       |
| 9         | `src/bridge/browser-scripts/get-selector.ts`               | Bridge | 60         | 2.1       |
| 10        | `src/bridge/injection.ts`                                  | Bridge | 120        | 2.1       |
| 11        | `src/bridge/api-resolver.ts`                               | Bridge | 80         | 2.1       |
| 12        | `src/bridge/interaction-strategies/strategy.ts`            | Bridge | 30         | 2.1       |
| 13        | `src/bridge/interaction-strategies/shared.ts`              | Bridge | 80         | 2.1       |
| 14        | `src/bridge/interaction-strategies/playwright-strategy.ts` | Bridge | 100        | 2.1       |
| 15        | `src/bridge/interaction-strategies/dom-first-strategy.ts`  | Bridge | 100        | 2.1       |
| 16        | `src/bridge/interaction-strategies/opa5-strategy.ts`       | Bridge | 100        | 2.1       |
| 17        | `src/bridge/interaction-strategies/strategy-factory.ts`    | Bridge | 50         | 2.1       |
| 18        | `src/bridge/classic-adapter.ts`                            | Bridge | 250        | 2.1       |
| 19        | `src/bridge/webcomponent-adapter.ts`                       | Bridge | 80         | 2.1       |
| 20        | `src/bridge/hybrid-adapter.ts`                             | Bridge | 100        | 2.1       |
| 21        | `src/bridge/adapter-factory.ts`                            | Bridge | 60         | 2.1       |
| 22        | `src/proxy/dynamic-proxy.ts`                               | Proxy  | 150        | 2.2       |
| 23        | `src/proxy/return-handler.ts`                              | Proxy  | 100        | 2.2       |
| 24        | `src/proxy/method-filter.ts`                               | Proxy  | 50         | 2.2       |
| 25        | `src/proxy/ui5-object.ts`                                  | Proxy  | 120        | 2.2       |
| 26        | `src/proxy/ui5-object-proxy.ts`                            | Proxy  | 80         | 2.2       |
| 27        | `src/proxy/ui5-object-cache.ts`                            | Proxy  | 100        | 2.2       |
| 28        | `src/proxy/proxy-converter.ts`                             | Proxy  | 80         | 2.2       |
| 29        | `src/proxy/discovery.ts`                                   | Proxy  | 80         | 2.2       |
| 30        | `src/proxy/discovery-factory.ts`                           | Proxy  | 70         | 2.2       |
| 31        | `src/proxy/cache.ts`                                       | Proxy  | 80         | 2.2       |
| 32-51     | `src/proxy/typed/ui5-*.ts` (20 files)                      | Proxy  | 600        | 2.2       |
| 52        | `src/proxy/typed/index.ts`                                 | Proxy  | 30         | 2.2       |
| **Total** | **52 new source files**                                    |        | **~3,830** |           |

### 9.2 Test Files

| #         | Test File Path                                                         | Tests Est. |
| --------- | ---------------------------------------------------------------------- | ---------- |
| 1         | `tests/unit/bridge/method-blacklist.test.ts`                           | 12         |
| 2         | `tests/unit/bridge/bridge-constants.test.ts`                           | 5          |
| 3         | `tests/unit/bridge/bridge-types.test.ts`                               | 8          |
| 4         | `tests/unit/bridge/browser-scripts/inject-ui5.test.ts`                 | 15         |
| 5         | `tests/unit/bridge/browser-scripts/find-control.test.ts`               | 18         |
| 6         | `tests/unit/bridge/browser-scripts/execute-method.test.ts`             | 14         |
| 7         | `tests/unit/bridge/browser-scripts/get-version.test.ts`                | 5          |
| 8         | `tests/unit/bridge/browser-scripts/object-map.test.ts`                 | 8          |
| 9         | `tests/unit/bridge/browser-scripts/get-selector.test.ts`               | 6          |
| 10        | `tests/unit/bridge/injection.test.ts`                                  | 12         |
| 11        | `tests/unit/bridge/api-resolver.test.ts`                               | 10         |
| 12        | `tests/unit/bridge/interaction-strategies/shared.test.ts`              | 8          |
| 13        | `tests/unit/bridge/interaction-strategies/playwright-strategy.test.ts` | 10         |
| 14        | `tests/unit/bridge/interaction-strategies/dom-first-strategy.test.ts`  | 10         |
| 15        | `tests/unit/bridge/interaction-strategies/opa5-strategy.test.ts`       | 8          |
| 16        | `tests/unit/bridge/interaction-strategies/strategy-factory.test.ts`    | 6          |
| 17        | `tests/unit/bridge/classic-adapter.test.ts`                            | 20         |
| 18        | `tests/unit/bridge/webcomponent-adapter.test.ts`                       | 8          |
| 19        | `tests/unit/bridge/hybrid-adapter.test.ts`                             | 10         |
| 20        | `tests/unit/bridge/adapter-factory.test.ts`                            | 8          |
| 21        | `tests/unit/proxy/dynamic-proxy.test.ts`                               | 20         |
| 22        | `tests/unit/proxy/return-handler.test.ts`                              | 10         |
| 23        | `tests/unit/proxy/method-filter.test.ts`                               | 8          |
| 24        | `tests/unit/proxy/ui5-object.test.ts`                                  | 12         |
| 25        | `tests/unit/proxy/ui5-object-proxy.test.ts`                            | 10         |
| 26        | `tests/unit/proxy/ui5-object-cache.test.ts`                            | 12         |
| 27        | `tests/unit/proxy/proxy-converter.test.ts`                             | 10         |
| 28        | `tests/unit/proxy/discovery.test.ts`                                   | 10         |
| 29        | `tests/unit/proxy/discovery-factory.test.ts`                           | 8          |
| 30        | `tests/unit/proxy/cache.test.ts`                                       | 10         |
| 31        | `tests/unit/proxy/typed/typed-controls.test.ts`                        | 20         |
| 32        | `tests/unit/bridge/index.test.ts`                                      | 3          |
| 33        | `tests/unit/proxy/index.test.ts`                                       | 3          |
| **Total** | **33 test files**                                                      | **~338**   |

### 9.3 Test Helpers (New)

| #   | File Path                                | Purpose                                          | Batch |
| --- | ---------------------------------------- | ------------------------------------------------ | ----- |
| 1   | `tests/helpers/mock-page.ts`             | Already exists from Phase 1                      | —     |
| 2   | `tests/helpers/mock-bridge-adapter.ts`   | Already exists from Phase 1                      | —     |
| 3   | `tests/helpers/mock-browser-context.ts`  | Mock browser evaluate/addInitScript              | TH4   |
| 4   | `tests/helpers/mock-ui5-control.ts`      | Mock UI5 control with methods                    | TH5   |
| 5   | `tests/helpers/browser-script-tester.ts` | Test helper for browser script string validation | TH6   |

---

## 10. Test Plan

### 10.1 Testing Strategy

- **Browser scripts**: Test the script **generation** (string output validation), NOT browser execution (that's integration testing in Phase 7)
- **Adapters**: Test against `MockBridgePage` (Phase 1 `mock-page.ts`) — verify `evaluate()` is called with correct scripts
- **Proxy**: Test against `MockBridgeAdapter` (Phase 1 `mock-bridge-adapter.ts`) — verify method forwarding
- **ALL tests are hermetic**: No browser, no SAP, no network

### 10.2 Coverage Tiers

| Tier       | Scope                              | Stmts | Branches | Functions | Lines |
| ---------- | ---------------------------------- | ----- | -------- | --------- | ----- |
| **Tier 2** | `src/bridge/**/*.ts`               | 95%   | 90%      | 95%       | 95%   |
| **Tier 2** | `src/proxy/**/*.ts` (excl. typed/) | 95%   | 90%      | 95%       | 95%   |
| **Tier 3** | `src/proxy/typed/**/*.ts`          | 90%   | 85%      | 90%       | 90%   |

### 10.3 TDD Protocol

Same as Phase 1:

```
1. Write test file FIRST (imports reference non-existent modules)
2. Run npm run test:unit -- <test-file> → verify RED
3. Write source file to make tests pass
4. Run npm run test:unit -- <test-file> → verify GREEN
5. Run npm run typecheck + npm run lint
6. If RED phase shows PASS immediately → test is wrong, rewrite
```

---

## 11. Impact Analysis

### 11.1 Files Modified (Existing)

| File                  | Change                            | Risk |
| --------------------- | --------------------------------- | ---- |
| `src/bridge/index.ts` | Full barrel re-exports (was stub) | Low  |
| `src/proxy/index.ts`  | Full barrel re-exports (was stub) | Low  |
| `src/index.ts`        | Add bridge + proxy re-exports     | Low  |

### 11.2 Build Impact

| Metric          | Before Phase 2              | After Phase 2                 | Delta       |
| --------------- | --------------------------- | ----------------------------- | ----------- |
| Source files    | 48 (36 source + 12 barrels) | ~100 (52 new + 48 existing)   | +52         |
| Test files      | 40                          | ~73 (33 new + 40 existing)    | +33         |
| Test count      | 511                         | ~849 (338 new + 511 existing) | +338        |
| Est. dist/ size | ~80 KB                      | ~200-250 KB                   | +120-170 KB |
| Build time      | ~3-4s                       | ~5-7s                         | +2-3s       |
| Test time       | ~5-8s                       | ~10-15s                       | +5-7s       |

### 11.3 Breaking Changes

**None.** Phase 2 is additive — existing Phase 1 exports remain unchanged.

### 11.4 Dependency Impact

No new npm dependencies. Bridge adapters use only:

- `@playwright/test` (peer dependency) — `page.evaluate()`, `context.addInitScript()`
- Phase 1 infrastructure — types, errors, config, logging, utils

---

## 12. Quality Gates Per Sub-Phase

### 12.1 Sub-Phase 2.1 Gate (Bridge Foundation)

```bash
npm run typecheck        # Zero errors
npm run lint             # Zero errors, zero warnings
npm run test:unit        # All tests pass (504 existing + new bridge tests)
npm run build            # tsup succeeds
npm run ci               # Full pipeline green
```

**Coverage check**:

- `src/bridge/**/*.ts` → 95/90/95/95 (Tier 2)

### 12.2 Sub-Phase 2.2 Gate (Proxy Layer)

```bash
npm run ci               # Full pipeline green
```

**Coverage check**:

- `src/bridge/**/*.ts` → 95/90/95/95 (Tier 2)
- `src/proxy/**/*.ts` (excl. typed/) → 95/90/95/95 (Tier 2)
- `src/proxy/typed/**/*.ts` → 90/85/90/90 (Tier 3)

### 12.3 Sub-Phase 2.3 Gate (Integration)

```bash
npm run ci               # Full pipeline green
npm run check:exports    # attw validates all export maps
```

**Coverage check**: All Phase 2 files meet tier thresholds.

---

## 13. Risk Register

| #   | Risk                                          | Prob.  | Impact | Mitigation                                                                                                                  |
| --- | --------------------------------------------- | ------ | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| R1  | Browser scripts hard to unit test             | High   | Medium | Test string generation only; browser execution tested in Phase 7 integration                                                |
| R2  | UI5 version detection fails silently          | Medium | High   | Fallback to minimum supported version; warn in logs                                                                         |
| R3  | RecordReplay not available (UI5 < 1.94)       | Low    | High   | ClassicAdapter checks version in `init()`; throws `BridgeError.ERR_BRIDGE_VERSION`                                          |
| R4  | objectMap memory leak in long test runs       | Medium | Medium | TTL cleanup (5min) + explicit `destroy()` on adapter teardown                                                               |
| R5  | Typed proxy interfaces drift from UI5 API     | Medium | Low    | MITIGATED: Auto-gen from api.json COMPLETE (Phase 1). Re-run `scripts/generate-typed-proxies.ts --version X.Y.Z` to update. |
| R6  | RegExp serialization edge cases               | Low    | Medium | Phase 1 `serializeSelectorForBrowser()` already handles; add fuzz tests in Phase 7                                          |
| R7  | Double-proxy removal breaks chaining          | Low    | High   | wdi5 proves single proxy works; comprehensive chaining tests                                                                |
| R8  | Interaction strategy fallback cascading       | Medium | Medium | Each strategy has explicit fallback; logged with pino                                                                       |
| R9  | Browser script size exceeds Playwright limits | Low    | Low    | Monitor injected script size; split if > 100KB                                                                              |
| R10 | Proxy `get` trap performance overhead         | Low    | Low    | Benchmark in Phase 7; blacklist check is O(1) via Set                                                                       |

---

## 14. Implementation Batching

### 14.1 Batch Schedule

| Batch    | Files                                                                           | Est. LOC | Depends On             |
| -------- | ------------------------------------------------------------------------------- | -------- | ---------------------- |
| **TH4**  | `tests/helpers/mock-browser-context.ts`                                         | 60       | —                      |
| **TH5**  | `tests/helpers/mock-ui5-control.ts`                                             | 80       | —                      |
| **TH6**  | `tests/helpers/browser-script-tester.ts`                                        | 50       | —                      |
| **B12a** | `bridge/method-blacklist.ts` + test                                             | 200      | TH6                    |
| **B12b** | `bridge/bridge-constants.ts` + `bridge/bridge-types.ts` + tests                 | 250      | —                      |
| **B13a** | `bridge/browser-scripts/get-version.ts` + test                                  | 80       | TH6                    |
| **B13b** | `bridge/browser-scripts/object-map.ts` + test                                   | 140      | TH6                    |
| **B13c** | `bridge/browser-scripts/inject-ui5.ts` + test                                   | 400      | B13a, B13b, TH6        |
| **B13d** | `bridge/browser-scripts/find-control.ts` + test                                 | 350      | B13c, B12a             |
| **B13e** | `bridge/browser-scripts/execute-method.ts` + test                               | 300      | B13c                   |
| **B13f** | `bridge/browser-scripts/get-selector.ts` + test                                 | 100      | B13c                   |
| **B14a** | `bridge/api-resolver.ts` + test                                                 | 140      | B12b                   |
| **B14b** | `bridge/injection.ts` + test                                                    | 200      | B13c, B14a             |
| **B15a** | `bridge/interaction-strategies/strategy.ts` + `shared.ts` + tests               | 180      | B12b                   |
| **B15b** | `bridge/interaction-strategies/playwright-strategy.ts` + test                   | 160      | B15a                   |
| **B15c** | `bridge/interaction-strategies/dom-first-strategy.ts` + test                    | 160      | B15a                   |
| **B15d** | `bridge/interaction-strategies/opa5-strategy.ts` + test                         | 150      | B15a                   |
| **B15e** | `bridge/interaction-strategies/strategy-factory.ts` + test                      | 80       | B15b, B15c, B15d       |
| **B16a** | `bridge/classic-adapter.ts` + test                                              | 400      | B14b, B15e, B13d, B13e |
| **B16b** | `bridge/webcomponent-adapter.ts` + test                                         | 120      | B12b                   |
| **B16c** | `bridge/hybrid-adapter.ts` + test                                               | 160      | B16a, B16b             |
| **B16d** | `bridge/adapter-factory.ts` + test                                              | 100      | B16c                   |
| **B17a** | `proxy/method-filter.ts` + test                                                 | 80       | B12a                   |
| **B17b** | `proxy/return-handler.ts` + test                                                | 160      | B12b, TH5              |
| **B17c** | `proxy/dynamic-proxy.ts` + test                                                 | 280      | B17a, B17b             |
| **B18a** | `proxy/ui5-object.ts` + test                                                    | 180      | B12b, TH5              |
| **B18b** | `proxy/ui5-object-proxy.ts` + test                                              | 140      | B18a                   |
| **B18c** | `proxy/ui5-object-cache.ts` + test                                              | 160      | B18a                   |
| **B18d** | `proxy/proxy-converter.ts` + test                                               | 130      | B18b, B17c             |
| **B19a** | `proxy/cache.ts` + test                                                         | 130      | B12b                   |
| **B19b** | `proxy/discovery-factory.ts` + test                                             | 100      | B12b                   |
| **B19c** | `proxy/discovery.ts` + test                                                     | 130      | B19a, B19b, B16a       |
| **B20a** | `proxy/typed/ui5-button.ts` .. `ui5-table.ts` (5 controls) + test               | 200      | B17c                   |
| **B20b** | `proxy/typed/ui5-input.ts` .. `ui5-dialog.ts` (5 controls) + test               | 200      | B17c                   |
| **B20c** | `proxy/typed/ui5-list.ts` .. `ui5-smart-table.ts` (5 controls) + test           | 200      | B17c                   |
| **B20d** | `proxy/typed/ui5-dynamic-page.ts` .. `ui5-multi-input.ts` (5 controls) + barrel | 200      | B17c                   |
| **B21a** | Bridge barrel (`bridge/index.ts`) + test                                        | 40       | B16d                   |
| **B21b** | Proxy barrel (`proxy/index.ts`) + test                                          | 40       | B19c, B20d             |
| **B21c** | Main barrel update (`src/index.ts`) + final CI gate                             | 20       | B21a, B21b             |

**Total batches**: 38 (3 helpers + 35 implementation)

### 14.2 Parallel Agent Delivery Schedule

```
Wave 1 (start):      TH4, TH5, TH6, B12b                    [4 parallel]
Wave 2 (after TH6):  B12a, B13a, B13b                        [3 parallel]
Wave 3 (after B13a): B13c, B14a, B15a                        [3 parallel]
Wave 4 (after B13c): B13d, B13e, B13f, B14b                  [4 parallel]
Wave 5 (after B15a): B15b, B15c, B15d, B17a                  [4 parallel]
Wave 6 (after all):  B15e, B16a, B16b, B17b                  [4 parallel]
Wave 7:              B16c, B17c, B18a, B19a, B19b             [5 parallel]
Wave 8:              B16d, B18b, B18c, B19c                   [4 parallel]
Wave 9:              B18d, B20a, B20b, B20c, B20d             [5 parallel]
Wave 10:             B21a, B21b                               [2 parallel]
Wave 11 (final):     B21c                                     [1 — final gate]
```

### 14.3 Critical Path

```
TH6 → B13a → B13c → B13d → B16a → B19c → B21b → B21c  (8 steps)
```

### 14.4 Batching Rules

1. Each batch produces compilable code (`tsc` passes)
2. Test files ship WITH source files in same batch (TDD)
3. Barrel files updated at end of sub-module
4. Max ~250 LOC total per batch (source + tests)
5. CI gate runs at sub-phase end (B16d, B21b, B21c)
6. Test helpers (TH4, TH5, TH6) ship before code that needs them
7. Browser script batches: test the **string generation**, not execution

---

## 15. SAP UI5 API Reference

### 15.1 Core APIs Used by Bridge

| API                                                  | UI5 Version               | Usage in Praman                          |
| ---------------------------------------------------- | ------------------------- | ---------------------------------------- |
| `Element.getElementById(id)`                         | ≥ 1.119                   | Primary control lookup (Priority 1)      |
| `ElementRegistry.get(id)`                            | ≥ 1.120                   | Alternative lookup (Priority 2)          |
| `Core.byId(id)`                                      | Legacy (deprecated 1.118) | Fallback (Priority 3)                    |
| `Element.registry.all()`                             | ≥ 1.120                   | Registry iteration for selector matching |
| `Element.closestTo(dom)`                             | ≥ 1.108                   | DOM→Control conversion                   |
| `sap.ui.test.RecordReplay`                           | ≥ 1.94                    | Discovery + interaction + stability      |
| `RecordReplay.findDOMElementByControlSelector()`     | ≥ 1.94                    | Selector-based discovery                 |
| `RecordReplay.findAllDOMElementsByControlSelector()` | ≥ 1.94                    | Batch discovery                          |
| `RecordReplay.interactWithControl()`                 | ≥ 1.94                    | OPA5-style interactions                  |
| `RecordReplay.waitForUI5()`                          | ≥ 1.94                    | UI5 stability check                      |
| `sap.ui.VersionInfo.load()`                          | All                       | Version detection                        |
| `sap.base.Log`                                       | All                       | Browser-side logging                     |
| `control.getMetadata().getName()`                    | All                       | Control type detection                   |
| `control.getAggregation()`                           | All                       | Child traversal                          |
| `control.firePress()` / `fireSelect()` / `fireTap()` | All                       | UI5 event methods                        |
| `control.getDomRef()`                                | All                       | DOM reference for fallback clicks        |

### 15.2 SAP UI5 Testing Matchers

| Matcher              | Usage                           | UI5 Version |
| -------------------- | ------------------------------- | ----------- |
| `Properties`         | Match by property values        | All         |
| `BindingPath`        | Match by model binding path     | All         |
| `I18NText`           | Match by i18n key/bundle        | All         |
| `Ancestor`           | Match by parent control         | All         |
| `LabelFor`           | Match by associated label       | All         |
| Declarative matchers | Object-based matcher definition | ≥ 1.72      |

---

## 16. Summary

| Metric                         | Value                                                                         |
| ------------------------------ | ----------------------------------------------------------------------------- |
| **New source files**           | 52                                                                            |
| **New test files**             | 33                                                                            |
| **New test helpers**           | 3                                                                             |
| **Total estimated source LOC** | ~3,830                                                                        |
| **Total estimated test cases** | ~338                                                                          |
| **New npm dependencies**       | 0                                                                             |
| **Breaking changes**           | 0                                                                             |
| **Sub-phases**                 | 3 (Bridge Foundation → Proxy Layer → Integration)                             |
| **Quality gates**              | Per sub-phase (`npm run ci` + coverage checks)                                |
| **Implementation batches**     | 38 (3 helpers + 35 implementation)                                            |
| **Max parallel agents**        | 5                                                                             |
| **Critical path**              | 8 steps (TH6 → B13a → B13c → B13d → B16a → B19c → B21b → B21c)                |
| **Risk items**                 | 10 (all mitigated)                                                            |
| **Decisions (binding)**        | 13 (W1–W13)                                                                   |
| **SAP UI5 APIs used**          | 16 core APIs + 5 testing matchers                                             |
| **Design decisions resolved**  | D3, D4, D16, D17, D18, D19, D20, D21, D22 (D22 already COMPLETE from Phase 1) |

---

> **Next step**: Approve this plan → Begin Sub-Phase 2.1 implementation
> (TDD: tests first for Bridge types, constants, browser scripts).

---

## Appendix A — Code-Verified Corrections (2026-02-16)

After line-by-line review of ALL wdi5 source files (33 files, 8,878 LOC), the following corrections and clarifications apply. Decisions W1–W13 remain valid but several implementation details were based on agent summaries that diverged from the actual code.

### A.1 Method Filtering (W6 Correction)

**Previous claim**: "88-item blacklist (wdi5 parity)"

**Code truth** (wdi5 `injectUI5.ts:485-523`): wdi5 uses a **5-item explicit filter** + **2 dynamic rules**:

```javascript
// 5 explicit exclusions
const aFilterFunctions = ['$', 'getAggregation', 'constructor', 'fireEvent', 'init'];

// 2 dynamic rules
if (item.startsWith('_')) return false; // Private methods
if (item.indexOf('Render') !== -1) return false; // Render-related
```

The 88-item list is from **dhikraft `constants.ts`**, not wdi5. wdi5's approach is simpler: traverse the prototype chain with `Object.getOwnPropertyNames()`, keep only functions, filter with the above rules.

**Revised decision**: Praman will use a **hybrid approach**:

- wdi5's dynamic rules (`_` prefix filter, `Render` filter) as first pass
- dhikraft's 88-item blacklist as safety net for known-dangerous methods
- Export both `METHOD_BLACKLIST` (static set) and `filterMethods()` (dynamic rules) from `method-blacklist.ts`
- `retrieveControlMethods()` browser-side helper uses wdi5's prototype traversal pattern

### A.2 Proxy Architecture (W4 Clarification)

**Previous claim**: "wdi5 has zero double-proxy"

**Code truth**: wdi5 uses **zero ES6 Proxy per control instance**. The method attachment pattern is:

```typescript
// wdi5-control.ts:697-708 — direct method binding, NOT Proxy
private _attachControlBridge(sReplFunctionNames?: string[]): void {
  sReplFunctionNames.forEach((sMethodName) => {
    this[sMethodName] = this._executeControlMethod.bind(this, sMethodName, this._webElement)
  })
}
```

The **only** ES6 Proxy in wdi5 is the fluent API wrapper on `browser.asControl()` (wdi5-bridge.ts:635-690):

```typescript
// Proxy used ONLY for async method chaining, not per-control
function makeFluent(target) {
  const handler = {
    get(_, prop) {
      /* chains .then() on the Promise */
    },
    apply(_, thisArg, args) {
      /* Reflect.apply on resolved target */
    },
  };
  return new Proxy(function () {}, handler);
}
```

**Impact on Praman**: Our plan to use `new Proxy()` per control is valid and arguably better (intercepting unknown methods dynamically), but the rationale should be "Praman uses Proxy for dynamic method interception" not "following wdi5 pattern". wdi5 pre-binds known methods at discovery time; Praman intercepts at call time.

### A.3 Control Discovery (W9 Correction)

**Previous claim**: "5-level: Cache → Registry → Direct ID → RecordReplay → Properties"

**Code truth** (wdi5 `getControl.ts:84-134`): wdi5 uses **exactly one discovery mechanism**:

```javascript
// ONLY discovery path in wdi5:
controlSelector.selector = window.wdi5.createMatcher(controlSelector.selector);
domElement = await window.bridge.findDOMElementByControlSelector(controlSelector);
const ui5Control = window.wdi5.getUI5CtlForWebObj(domElement);
```

There is **no** registry iteration, **no** direct ID lookup, **no** property matching fallback. wdi5 delegates ALL discovery to `RecordReplay.findDOMElementByControlSelector()`.

The 5-level priority chain is from **dhikraft's `control-discovery-factory.ts`**.

**Revised decision**: Praman will use a **2-tier** discovery for Phase 2:

- **Primary**: `RecordReplay.findDOMElementByControlSelector()` (wdi5-proven, handles all selector types)
- **Fallback**: Direct `getById()` chain (for ID-only selectors, faster path)
- Registry iteration and property matching are dhikraft-specific optimizations — defer to Phase 3+ if needed

### A.4 Return Types (Correction)

**Previous claim**: "7-type return detection"

**Code truth** (wdi5 `executeControlMethod.ts:107-216`): wdi5 has **8 return types**:

| Type              | Condition                                    | Node.js Handling               |
| ----------------- | -------------------------------------------- | ------------------------------ |
| `empty`           | Array result with length 0                   | Return empty array             |
| `aggregation`     | Array where items have `.getParent`          | Map to `{id}` array            |
| `result` (array)  | Non-control array                            | Return as-is                   |
| `element`         | `focus()` returns undefined, or same control | Return `this` (chaining)       |
| `result` (scalar) | `isPrimitive(result) === true`               | Return value                   |
| `object`          | Object, not Control, not Item                | UUID + collapse + serialize    |
| `newElement`      | Control with different `getId()`             | Wrap in new `{id}`             |
| `unknown`         | Instance check fails (else branch)           | Status 1, unknown type         |
| `none`            | `result === undefined \|\| null`             | Status 1, method doesn't exist |

Our Phase 1 `BridgeReturnType` has 7 values (missing `unknown`). **Action**: Add `'unknown'` to `BridgeReturnType` union OR map wdi5's `unknown` → `none`.

### A.5 Every Browser Operation Waits for UI5 First

**Code truth**: Every single browser-side function in wdi5 calls `await window.bridge.waitForUI5(options)` as its FIRST line:

- `getControl.ts:105` — waitForUI5 before findDOMElementByControlSelector
- `executeControlMethod.ts:97` — waitForUI5 before method execution
- `allControls.ts:98` — waitForUI5 before findAllDOMElements
- `_getAggregation.ts:71` — waitForUI5 before getAggregation
- `fireEvent.ts:107` — waitForUI5 before fireEvent
- `interactWithControl.ts:87` — waitForUI5 before interactWithControl
- `executeObjectMethod.ts:89` — waitForUI5 before object method execution
- `getObject.ts:75` — waitForUI5 before object retrieval

**Impact**: Praman bridge scripts must follow this pattern. The stability wait is NOT optional, NOT configurable per-call in wdi5 (except `_skipWaitForUI5` internal flag for chained aggregation retrieval).

### A.6 Aggregation Special Cases

**Code truth** (wdi5 `injectUI5.ts:731-755`): Three control types have special aggregation handling:

```javascript
window.wdi5.createControlIdMap = (aControls, controlType = '') => {
  return aControls.map((element) => {
    if (
      (controlType === 'sap.m.ComboBox' || controlType === 'sap.m.MultiComboBox') &&
      element.data('InputWithSuggestionsListItem')
    ) {
      return { id: element.data('InputWithSuggestionsListItem').getId() };
    } else if (controlType === 'sap.m.PlanningCalendar') {
      return { id: `${element.getId()}-CLI` };
    } else {
      return { id: element.getId() };
    }
  });
};
```

**Impact**: `execute-method.ts` browser script must include this special-case logic.

### A.7 DOM-to-Control Conversion is Version-Split

**Code truth** (wdi5 `injectUI5.ts:442-449`):

```javascript
window.wdi5.getUI5CtlForWebObj = (ui5Control) => {
  if (window.compareVersions?.compare(window.wdi5.ui5Version, '1.108.0', '>')) {
    return UI5ElementRef.closestTo(ui5Control); // Modern API
  } else {
    return jQuery(ui5Control).control(0); // Legacy API
  }
};
```

**Impact**: Since Praman targets UI5 ≥ 1.71, we need BOTH paths. The bridge injection script must handle this version split.

### A.8 Browser Script Architecture

**Previous claim**: "Serialized string functions for `page.evaluate()` + `addInitScript()`"

**Code truth**: wdi5 uses two patterns:

1. **Injection script** (`injectUI5.ts`): One large function passed to `browser.execute()`. Sets up `window.bridge`, `window.wdi5` namespace. This is equivalent to Playwright's `page.evaluate()`.
2. **Per-operation scripts** (`getControl.ts`, `executeControlMethod.ts`, etc.): Named functions passed to `browser.execute()` with arguments. Each is a separate file.

For Playwright:

- **`addInitScript()`** accepts a string or function — used for eager injection (before page load)
- **`page.evaluate(fn, arg)`** accepts a function + serializable args — used for per-operation calls

**Revised approach**: Browser scripts should be actual functions (not string templates) for type safety. Only the injection script for `addInitScript()` needs string serialization.

### A.9 Selector Matcher Version Handling

**Code truth** (wdi5 `injectUI5.ts:303-411`): The `createMatcher()` function handles:

1. **RegExp ID**: `/pattern/flags` strings → `new RegExp(source, flags)` in browser
2. **RegExp properties.text**: Same conversion for text property matching
3. **Binding path fix**: For UI5 < 1.81, named model paths need double leading `/`
4. **Version < 1.72**: Matchers must be manually instantiated (BindingPath, Properties, I18NText, LabelFor, Ancestor)
5. **Version ≥ 1.72**: Declarative matchers (properties passed through as-is)

**Impact**: Since Praman targets UI5 ≥ 1.71, we need BOTH paths initially. The `createMatcher()` equivalent in Praman's injection script must handle the version < 1.72 case.

### A.10 wdi5's Actual Architecture Stack

```
┌──────────────────────────────────────────────────────┐
│ TEST CODE                                             │
│ browser.asControl({selector}).getText()               │
│                                                       │
│ Proxy (fluent API wrapper, wdi5-bridge.ts:635-690)   │
│ makeFluent() → async chain via Proxy get/apply traps │
└───────────────────────┬──────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────┐
│ browser._asControl(selector)                          │
│ → new WDI5Control({browser}).init(selector)           │
│                                                       │
│ WDI5Control (wdi5-control.ts, 1053 LOC)              │
│ ├─ init() → clientSide_getControl() [browser.exec]   │
│ ├─ _attachControlBridge(methods[]) → .bind() each    │
│ ├─ control.getText() → _executeControlMethod()       │
│ │   → clientSide_executeControlMethod() [browser.exec]│
│ ├─ Return dispatch: switch(returnType)                │
│ │   result → value, element → this, aggregation → []  │
│ │   newElement → new WDI5Control, object → WDI5Object │
│ └─ Cache: browser._controls[key]                      │
└───────────────────────┬──────────────────────────────┘
                        │ browser.execute(fn, args)
┌───────────────────────▼──────────────────────────────┐
│ BROWSER CONTEXT                                       │
│                                                       │
│ window.bridge = sap.ui.test.RecordReplay             │
│ window.wdi5 = {                                       │
│   isInitialized, objectMap, ui5Version, Log,          │
│   saveObject(), createMatcher(), getUI5CtlForWebObj(),│
│   retrieveControlMethods(), collapseObject(),         │
│   getCircularReplacer(), removeEmptyElements(),       │
│   isPrimitive(), createControlIdMap(), createControlId│
│ }                                                     │
│                                                       │
│ Key flow per operation:                               │
│ 1. await bridge.waitForUI5(options)     [stability]   │
│ 2. wdi5.createMatcher(selector)         [selector]    │
│ 3. bridge.findDOMElementByControlSelector() [find]    │
│ 4. wdi5.getUI5CtlForWebObj(dom)         [DOM→UI5]    │
│ 5. control[method].apply(control, args) [execute]     │
│ 6. Detect return type → serialize       [return]      │
└──────────────────────────────────────────────────────┘
```

### A.11 WDI5Object Pattern

**Code truth** (wdi5-object.ts): Identical `.bind()` pattern as WDI5Control:

```typescript
private _attachObjectMethods(sReplFunctionNames: string[]): void {
  sReplFunctionNames.forEach(async (sMethodName) => {
    this[sMethodName] = await this._excuteObjectMethod.bind(this, sMethodName, this._uuid)
  })
}
```

Object methods are forwarded via `clientSide_executeObjectMethod()` which:

1. Looks up object by UUID in `window.wdi5.objectMap[uuid]`
2. Detects async/sync: checks `constructor.name === "AsyncFunction"`
3. Returns `result` (primitive) or `object` (new UUID + methods + collapsed data)

### A.12 WebdriverIO API Allowlist

**Code truth** (wdioApi.ts): wdi5 has a 193-item allowlist of WebdriverIO method names. When a method is called on WDI5Control:

- If in allowlist → forwarded to WebdriverIO element directly
- If NOT in allowlist → sent to UI5 bridge via `_executeControlMethod()`

**Praman equivalent**: Since we use Playwright (not WebdriverIO), we need a similar **Playwright API allowlist** to distinguish Playwright Locator methods from UI5 control methods. Methods like `click()`, `fill()`, `isVisible()` etc. should route to Playwright, not to the bridge.

---

### Summary of Changes Required

| #    | Change                                                                   | Priority | Impact                        |
| ---- | ------------------------------------------------------------------------ | -------- | ----------------------------- |
| A.1  | Clarify method filtering: hybrid dhikraft blacklist + wdi5 dynamic rules | High     | method-blacklist.ts design    |
| A.2  | Correct proxy rationale: wdi5 uses .bind(), not Proxy per control        | Low      | Documentation only            |
| A.3  | Simplify discovery to 2-tier (RecordReplay primary + getById fallback)   | High     | find-control.ts, discovery.ts |
| A.4  | Add 'unknown' return type or map to 'none'                               | Medium   | bridge.ts type update         |
| A.5  | Mandate waitForUI5 before every browser operation                        | High     | All browser scripts           |
| A.6  | Add ComboBox/MultiComboBox/PlanningCalendar aggregation special cases    | Medium   | execute-method.ts             |
| A.7  | Include version-split DOM-to-Control conversion                          | High     | inject-ui5.ts                 |
| A.8  | Use actual functions for page.evaluate, strings only for addInitScript   | Medium   | Browser script format         |
| A.9  | Include version < 1.72 matcher instantiation path                        | Medium   | inject-ui5.ts                 |
| A.10 | Document actual wdi5 stack accurately                                    | Low      | Architecture docs             |
| A.11 | Match WDI5Object's UUID + bind() pattern                                 | Medium   | ui5-object.ts                 |
| A.12 | Add Playwright API allowlist (equivalent to wdi5's wdioApi.ts)           | High     | New: proxy/playwright-api.ts  |

---

## Appendix B — Principal Architect Review (2026-02-17)

> **Reviewer**: Principal Architect (independent)
> **Verdict**: APPROVED WITH CONDITIONS — 3 Critical, 6 High, 9 Medium, 5 Low
> **Source verification**: wdi5 v3.0.8 at `/consult/wdi5`, dhikraft v2.5.0 at `/package`
> **All Appendix A claims**: 11/12 VERIFIED exact, 1 partially (A.12 count: 198 not 193)

### B.1 New Binding Decisions (W14–W19)

These decisions supersede or amend W6–W8 based on review findings.

| #   | Question                        | Decision                                                                                       | Rationale                                                                                                        |
| --- | ------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| W14 | Bridge injection method?        | **Lazy-only via `page.evaluate()`** — NO `addInitScript()`, NO eager injection                 | Page is `about:blank` at fixture init. UI5 not available until after navigation. Same pattern as dhikraft v2.5.0 |
| W15 | Strategy naming?                | **`ui5-native`** (default), **`dom-first`**, **`opa5`**                                        | "playwright-native" was misleading — strategy calls `fire*` via bridge, not Playwright input simulation          |
| W16 | Typed proxy wrappers?           | **DELETE `proxy/typed/` plan** — use auto-generated interfaces from `controls.ts` directly     | D22 auto-gen COMPLETE in Phase 1. 20 hand-written wrappers = redundant second source of truth                    |
| W17 | Playwright API routing?         | **Add `proxy/playwright-api.ts`** with Playwright Locator method allowlist                     | Without allowlist, `proxy.click()` routes to bridge instead of Playwright. Equivalent to wdi5's wdioApi.ts       |
| W18 | Integration testing?            | **Real SAP testing at each sub-phase gate** — SAP S/4HANA Cloud + UI5 demo apps                | Phase 7 too late for first browser test. Front-load highest-risk validation to Sub-Phase 2.1                     |
| W19 | Adapter initialization pattern? | **Lazy init via `ensureInitialized()`** — every public method auto-injects bridge if not ready | Fixture creates adapter at `about:blank`. Bridge injected on first UI5 operation after user navigates to SAP app |

### B.2 Corrections to Existing Decisions

**W6 (Method blacklist count)**: dhikraft constants.ts has **47 active items** + 44 commented = 91 total (not "88"). wdi5 uses 5 + 2 rules. `METHOD_BLACKLIST.size` test should assert 47 (active dhikraft set).

**W7 (Strategy names)**: Superseded by W15. Update `InteractionStrategy` type in `schema.ts`: `'ui5-native' | 'dom-first' | 'opa5' | 'hybrid'`.

**W8 (Browser script format)**: Superseded by W14. Remove `addInitScript()` reference. All scripts via `page.evaluate()` only.

**A.12 (wdioApi count)**: Actual count is **198 items** (not 193). May vary by wdi5 version.

### B.3 Critical Findings — Pre-Implementation Required

#### C1. Extend `BridgePage` interface

Current `BridgePage` (Phase 1) only has `evaluate<T>(fn): Promise<T>`. Phase 2 needs:

- `evaluate<R, Arg>(fn: (arg: Arg) => R, arg: Arg): Promise<R>` — pass serializable args to browser
- `waitForFunction(fn, options?): Promise<void>` — for polling operations (UI5 stable, bridge ready)

`BridgeContext` with `addInitScript()` is **NOT needed** (W14: lazy-only injection).

**Action**: Update `src/core/types/bridge.ts` and `tests/helpers/mock-page.ts` before Phase 2 starts.

#### C2. `MethodExecutionResult<T>` vs `BridgeResult<T>` gap

The proxy layer needs `returnType` discriminant for return-type routing, but `BridgeAdapter.executeControlMethod()` returns `Promise<unknown>`. Options:

1. Change return to `Promise<BridgeResult<MethodExecutionResult>>`
2. Add internal `executeControlMethodRaw()` that returns the rich type

**Action**: Resolve type contract before B16a (ClassicAdapter).

#### C3. Add `'unknown'` to `BridgeReturnType`

wdi5 has 8 return types. Phase 1 has 7 (missing `'unknown'`). `'unknown'` (instance check failed) differs from `'none'` (undefined/null).

**Action**: One-line change in `src/core/types/bridge.ts`.

### B.4 High Findings — Fix During Implementation

#### H1. Delete `proxy/typed/` (20 files)

Auto-generated `controls.ts` already has 201 interfaces. Hand-written wrappers = dual source of truth.
**Removes**: 20 source files, 600 LOC, batches B20a-B20d, 20 test cases.
**Replace**: Cast dynamic proxy to auto-generated interface based on `controlType`.

#### H2. Add `proxy/playwright-api.ts`

Export `PLAYWRIGHT_API_METHODS: ReadonlySet<string>` containing Playwright Locator methods (`click`, `fill`, `isVisible`, `isEnabled`, `textContent`, etc.). Proxy `get` trap checks this BEFORE blacklist.
**Add to**: File inventory, batch B17a, test plan.

#### H3. Browser script syntax validation

Enhance TH6 (`browser-script-tester.ts`) with `vm.Script` validation — zero new deps:

```typescript
import vm from 'node:vm';
new vm.Script(generatedScript); // Throws SyntaxError if invalid
```

#### H4. `page.evaluate()` serialization boundary

Document in `ClassicUI5Adapter`: `findControl` internally gets a `ControlDiscoveryResult` POJO via evaluate, then constructs the proxy. `BridgeAdapter.findControl()` returning `UI5ControlBase` is the public API contract.

#### H5. Timeout handling — use Playwright native (DOWNGRADED from HIGH to LOW)

No custom `withBridgeTimeout()` needed. Use:

- `page.waitForFunction(fn, { timeout })` for polling operations
- Test-level timeout for quick `page.evaluate()` calls

#### H6. Integration smoke tests at each gate (UPGRADED to include real SAP)

See Section B.6 below.

### B.5 Lazy Adapter Initialization Pattern (W19)

Based on dhikraft `dhikraft-fixtures.ts:781-794` (verified):

```
Playwright fixture created → page is about:blank
  → test navigates to SAP app (page.goto)
    → first ui5 operation (click, getText, etc.)
      → adapter.ensureInitialized()
        → waitForFunction: window.sap?.ui?.require exists
        → evaluate: createBridgeInjectionScript()
        → waitForFunction: window.__praman_bridge?.ready
      → actual operation executes
```

**ClassicUI5Adapter pattern**:

```typescript
class ClassicUI5Adapter implements BridgeAdapter {
  private initialized = false;

  async init(page: BridgePage): Promise<void> {
    // Called lazily, NOT from fixture
    await page.waitForFunction(() => window.sap?.ui?.require !== undefined, {
      timeout: BRIDGE_TIMEOUTS.INJECTION,
    });
    await page.evaluate(createBridgeInjectionScript());
    await page.waitForFunction(() => window.__praman_bridge?.ready === true, {
      timeout: BRIDGE_TIMEOUTS.INJECTION,
    });
    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) await this.init(this.page);
  }

  async findControl(selector: UI5Selector): Promise<UI5ControlBase | null> {
    await this.ensureInitialized(); // lazy!
    // ... actual find
  }
  // Every public method calls ensureInitialized()
}
```

**injection.ts simplifies**: Single path only. Remove `'eager' | 'late'` parameter. Remove `PramanBridge.injectionMethod` field.

### B.6 Integration Test Strategy (W18)

#### Test Targets

**Tier 1 — SAP S/4HANA Public Cloud** (credentials in `.env`):

- Real OData V4 services, real authentication
- Tests enterprise patterns: Fiori Elements, Smart Controls, FLP navigation
- Run at Sub-Phase 2.1 and 2.2 gates

**Tier 2 — SAP UI5 Demo Apps** (no auth required, mock OData):

- `https://ui5.sap.com/test-resources/sap/m/demokit/cart/webapp/index.html` — Shopping Cart (richest control variety)
- `https://ui5.sap.com/test-resources/sap/m/demokit/orderbrowser/webapp/test/mockServer.html` — Browse Orders (master-detail + FlexibleColumnLayout)
- `https://ui5.sap.com/test-resources/sap/m/demokit/worklist/webapp/test/mockServer.html` — Worklist (table-centric)
- `https://ui5.sap.com/test-resources/sap/tnt/demokit/toolpageapp/webapp/index.html` — Shop Admin (ToolPage + side nav)

**Tier 3 — Individual Control Pages** (no auth, single control deep testing):

- `https://ui5.sap.com/test-resources/sap/m/Button.html`
- `https://ui5.sap.com/test-resources/sap/m/Input.html`
- `https://ui5.sap.com/test-resources/sap/m/Table.html`
- `https://ui5.sap.com/test-resources/sap/m/ComboBox.html`
- `https://ui5.sap.com/test-resources/sap/m/Dialog.html`
- (200+ control pages available at `test-resources/sap/m/{Control}.html`)

#### Test Files

```
tests/integration/
├── bridge-smoke.spec.ts          ← Sub-Phase 2.1 gate
├── proxy-smoke.spec.ts           ← Sub-Phase 2.2 gate
├── sap-cloud-smoke.spec.ts       ← Sub-Phase 2.2 gate (requires .env)
└── playwright.integration.config.ts
```

#### Sub-Phase 2.1 Gate: `bridge-smoke.spec.ts` (~12 tests, against UI5 demo apps)

| #   | Test                                            | Target App  | Validates                                |
| --- | ----------------------------------------------- | ----------- | ---------------------------------------- |
| 1   | Navigate to Shopping Cart, page loads           | Cart        | Playwright + UI5 demo connectivity       |
| 2   | Inject bridge, `__praman_bridge.ready === true` | Cart        | injection.ts with real UI5               |
| 3   | Detect UI5 version                              | Cart        | get-version.ts returns valid semver      |
| 4   | `waitForUI5()` resolves                         | Cart        | RecordReplay.waitForUI5 available        |
| 5   | Find control by ID via RecordReplay             | Worklist    | find-control.ts + discovery chain        |
| 6   | Find control by type + properties               | Cart        | Matcher creation, selector serialization |
| 7   | Execute `getText()` on found control            | Cart        | execute-method.ts + return type 'result' |
| 8   | Execute setter, verify chaining                 | Button.html | Return type 'element' (same proxy)       |
| 9   | Get aggregation (table items)                   | Worklist    | Return type 'aggregation'                |
| 10  | Get model, verify object UUID                   | Cart        | Return type 'object' + objectMap         |
| 11  | Find non-existent control                       | Cart        | BridgeError with correct error code      |
| 12  | Bridge idempotent re-injection                  | Cart        | Second inject is no-op                   |

#### Sub-Phase 2.2 Gate: `proxy-smoke.spec.ts` (~10 tests)

| #   | Test                                      | Target App    | Validates                                 |
| --- | ----------------------------------------- | ------------- | ----------------------------------------- |
| 1   | `createControlProxy()` → method call      | Cart          | Full proxy → adapter → browser round-trip |
| 2   | Proxy anti-thenable (`then` is undefined) | Cart          | No auto-await issues                      |
| 3   | Blacklisted method throws `ControlError`  | Button.html   | Method filter in real flow                |
| 4   | Object return → UI5Object → method call   | Cart          | Full object proxy chain                   |
| 5   | Discovery cache hit on second find        | Cart          | Cache with real selectors                 |
| 6   | Interaction: press a button (ui5-native)  | Button.html   | Real UI5 event firing                     |
| 7   | Interaction: fill input (dom-first)       | Input.html    | DOM interaction + UI5 fallback            |
| 8   | Error path: find non-existent control     | Cart          | BridgeError with code                     |
| 9   | Table: get rows aggregation               | Table.html    | Aggregation return type with real data    |
| 10  | ComboBox: special aggregation handling    | ComboBox.html | A.6 ComboBox special case                 |

#### Sub-Phase 2.2 Gate: `sap-cloud-smoke.spec.ts` (~8 tests, requires `.env`)

| #   | Test                                    | Validates                              |
| --- | --------------------------------------- | -------------------------------------- |
| 1   | Authenticate to SAP S/4HANA Cloud       | Auth flow with real credentials        |
| 2   | Navigate to FLP, detect UI5 version     | Real FLP with production UI5           |
| 3   | Find control in Fiori app               | Discovery against real app             |
| 4   | Execute method on real control          | Bridge execution in production context |
| 5   | Get OData model from control            | Object proxy with real OData model     |
| 6   | Interaction strategy on real button     | ui5-native strategy in production      |
| 7   | Navigate between apps                   | FLP cross-app navigation               |
| 8   | Verify cache invalidation on navigation | Proxy cache clears on app switch       |

**npm scripts**:

```json
"test:integration": "playwright test --config playwright.integration.config.ts",
"test:integration:demo": "playwright test --config playwright.integration.config.ts --grep @demo",
"test:integration:sap": "playwright test --config playwright.integration.config.ts --grep @sap-cloud"
```

### B.7 Revised File Inventory (Section 9 amendments)

**Files REMOVED from plan** (H1: delete proxy/typed/):

- ~~`src/proxy/typed/ui5-button.ts` .. `ui5-multi-input.ts` (20 files)~~
- ~~`src/proxy/typed/index.ts`~~
- ~~`tests/unit/proxy/typed/typed-controls.test.ts`~~

**Files ADDED to plan**:

- `src/proxy/playwright-api.ts` — Playwright Locator method allowlist (H2)
- `tests/unit/proxy/playwright-api.test.ts` — Tests for allowlist
- `tests/integration/bridge-smoke.spec.ts` — Integration smoke (Sub-Phase 2.1)
- `tests/integration/proxy-smoke.spec.ts` — Integration smoke (Sub-Phase 2.2)
- `tests/integration/sap-cloud-smoke.spec.ts` — SAP Cloud smoke (Sub-Phase 2.2)
- `tests/integration/playwright.integration.config.ts` — Integration config

**Net effect**: -21 source files, +2 source files, +4 test files = **33 source files** (was 52), **37 test files** (was 33)

### B.8 Revised Batch Schedule Amendments

**Batches REMOVED**: B20a, B20b, B20c, B20d (proxy/typed/ wrappers)

**Batches MODIFIED**:

- B17a: Add `proxy/playwright-api.ts` alongside `method-filter.ts`

**Batches ADDED**:

- **INT1**: `tests/integration/bridge-smoke.spec.ts` + `playwright.integration.config.ts` — runs after B16d (Sub-Phase 2.1 gate)
- **INT2**: `tests/integration/proxy-smoke.spec.ts` + `sap-cloud-smoke.spec.ts` — runs after B21b (Sub-Phase 2.2 gate)

**Revised critical path**:

```
TH6 → B13a → B13c → B13d → B16a → B16d → INT1 → B19c → B21b → INT2 → B21c
```

### B.9 Revised Quality Gates

#### Sub-Phase 2.1 Gate (amended)

```bash
npm run typecheck        # Zero errors
npm run lint             # Zero errors, zero warnings
npm run test:unit        # All tests pass
npm run build            # tsup succeeds
npm run test:integration:demo  # Bridge smoke tests pass against UI5 demo apps
```

#### Sub-Phase 2.2 Gate (amended)

```bash
npm run ci               # Full pipeline green
npm run test:integration:demo  # Proxy smoke tests pass
npm run test:integration:sap   # SAP Cloud smoke tests pass (if .env configured)
```

#### Sub-Phase 2.3 Gate (unchanged)

```bash
npm run ci               # Full pipeline green
npm run check:exports    # attw validates all export maps
```

### B.10 Medium/Low Findings (implement during development)

| ID  | Finding                                           | Resolution                                                                            |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| M1  | `inject-ui5.ts` packs 5+ concerns into 250 LOC    | Split into composable snippet builders, test each independently                       |
| M4  | Proxy cache stale after navigation                | Register `page.on('framenavigated')` listener in adapter to call `cache.clear()`      |
| M5  | `XHR_IGNORE_PATTERNS` not merged with user config | Add `getXhrIgnorePatterns(config)` that merges built-in + `config.ignoreAutoWaitUrls` |
| M6  | No input validation on controlId/methodName       | Validate format before `page.evaluate()` — defense-in-depth                           |
| M7  | `classic-adapter.ts` 16 methods — monitor SRP     | Keep method bodies thin (max ~15 LOC). Extract helpers if they grow                   |
| M8  | `method-filter.ts` overlaps `method-blacklist.ts` | Ensure delegation, zero redundant logic                                               |
| M9  | `WeakRef` for object storage unreliable           | Drop `WeakRef`, use TTL-only cleanup                                                  |
| L1  | No `AbortController` cancellation                 | Phase 3+ enhancement                                                                  |
| L2  | No OpenTelemetry instrumentation                  | Phase 4+, but design span boundaries now                                              |
| L3  | `UI5Object` returns `Promise<unknown>`            | Correct trade-off, add clear TSDoc                                                    |
| L5  | No CSP compliance                                 | Phase 7 per plan.md                                                                   |

### B.11 Revised Impact Analysis

| Metric            | Before (v2.1.0) | After (v2.2.0) | Delta  |
| ----------------- | --------------- | -------------- | ------ |
| Source files      | 52 new          | 33 new         | -19    |
| Test files        | 33 new          | 37 new         | +4     |
| Unit test cases   | ~338            | ~298           | -40    |
| Integration tests | 0               | ~30            | +30    |
| Est. dist/ size   | ~200-250 KB     | ~180-220 KB    | -20 KB |
| Batches           | 38              | 36             | -2     |

### B.12 Source Code Verification Summary

| Claim                              | Source                         | Status                     |
| ---------------------------------- | ------------------------------ | -------------------------- |
| A.1: wdi5 5-item filter + 2 rules  | injectUI5.ts:485-523           | **VERIFIED**               |
| A.2: wdi5 .bind() not Proxy        | wdi5-control.ts:697-708        | **VERIFIED**               |
| A.3: RecordReplay only discovery   | getControl.ts:84-134           | **VERIFIED**               |
| A.4: 8 return types                | executeControlMethod.ts:94-229 | **VERIFIED**               |
| A.5: waitForUI5 before every op    | All 8 browser files            | **VERIFIED**               |
| A.6: 3 aggregation special cases   | injectUI5.ts:731-755           | **VERIFIED**               |
| A.7: closestTo vs jQuery split     | injectUI5.ts:442-449           | **VERIFIED**               |
| A.8: Two browser script patterns   | Multiple files                 | **VERIFIED**               |
| A.9: Matcher version handling      | injectUI5.ts:303-411           | **VERIFIED**               |
| A.10: Architecture stack           | All source files               | **VERIFIED**               |
| A.11: WDI5Object .bind() pattern   | wdi5-object.ts:222-236         | **VERIFIED**               |
| A.12: wdioApi allowlist            | wdioApi.ts                     | **PARTIAL** (198, not 193) |
| dhikraft: method blacklist count   | constants.ts:25-146            | **47 active** (not 88)     |
| dhikraft: 3 interaction strategies | interaction-strategies/        | **VERIFIED**               |
| dhikraft: 5-level discovery        | control-discovery-factory.ts   | **VERIFIED**               |
| dhikraft: lazy fixture injection   | dhikraft-fixtures.ts:781-794   | **VERIFIED**               |

---

> **Plan version**: 2.2.0 (revised 2026-02-17 — Architect Review + integration testing)
> **Status**: APPROVED WITH CONDITIONS — all critical items have clear resolution paths
> **Next step**: Resolve C1-C3 (pre-Phase-2 type changes), then begin Sub-Phase 2.1
