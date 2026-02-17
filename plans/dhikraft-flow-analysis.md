# dhikraft End-to-End Flow Analysis & Praman Parity Blueprint

> Date: 2026-02-17
> Method: Source-level trace of dhikraft gold standard BOM test
> Evidence: `/Users/maheshwar/Documents/projects/package/src/`
> Purpose: Document exact dhikraft behavior for Praman parity + improvements

---

## Table of Contents

1. [Gold Standard Test Flow](#1-gold-standard-test-flow)
2. [dhikraft Architecture: Complete Execution Chain](#2-dhikraft-architecture-complete-execution-chain)
3. [Layer-by-Layer Breakdown](#3-layer-by-layer-breakdown)
4. [7-Type Return Detection System](#4-7-type-return-detection-system)
5. [Interaction Strategy System](#5-interaction-strategy-system)
6. [UI5Object System (Non-Control Proxies)](#6-ui5object-system-non-control-proxies)
7. [Praman vs dhikraft: Side-by-Side Comparison](#7-praman-vs-dhikraft-side-by-side-comparison)
8. [Gap Analysis: What Praman Must Match](#8-gap-analysis-what-praman-must-match)
9. [Praman Architectural Improvements](#9-praman-architectural-improvements)
10. [Implementation Recommendations](#10-implementation-recommendations)

---

## 1. Gold Standard Test Flow

Source: `package/examples/gold-standards/bom-e2e-gold-standard.spec.ts`

The gold standard BOM test demonstrates **every critical path** in dhikraft:

```
import { test, expect } from 'dhikraft';

test('Complete BOM Flow', async ({ page, ui5 }) => {
    // 1. Navigate
    await page.goto(url);

    // 2. Discover by controlType + properties
    const bomTab = await ui5.control({
        controlType: 'sap.m.IconTabFilter',
        properties: { text: 'Bills Of Material' }
    });
    await bomTab.press();                         // InteractionStrategy.press()

    // 3. Discover by ID
    const field = await ui5.control({ id: 'createBOMFragment--material' });
    const type = await field.getControlType();    // Built-in property

    // 4. Aggregation traversal (getTable → getRows → getBindingContext)
    const smartTable = await ui5.control({ id: '...-table' });
    const innerTable = await smartTable.getTable();       // element return → proxy
    const rows = await innerTable.getRows();              // aggregation → proxy[]
    const ctx = await rows[0].getBindingContext();         // object → UI5Object
    const data = await ctx.getObject();                   // result → plain object

    // 5. ComboBox item iteration
    const combo = await ui5.control({ id: '...-comboBoxEdit' });
    const items = await combo.getItems();                 // aggregation → proxy[]
    for (const item of items) {
        const key = await item.getKey();                  // result → string
        const text = await item.getText();                // result → string
    }

    // 6. Direct method calls
    await combo.open();                                   // void method
    await combo.setSelectedKey('1');                      // setter
    await combo.fireChange({ value: '1' });               // event firing
    await combo.close();                                  // void method

    // 7. Property access
    const val = await materialInput.getValue();           // result → string
    const enabled = await createBtn.getEnabled();         // result → boolean
});
```

### API Surface Used in Gold Standard

| Method                     | Category             | Return Type      | Count |
| -------------------------- | -------------------- | ---------------- | ----- |
| `ui5.control(selector)`    | Discovery            | UI5Control proxy | 20+   |
| `.press()`                 | Interaction          | void             | 5     |
| `.getProperty(name)`       | Property             | primitive        | 8     |
| `.getControlType()`        | Built-in             | string           | 3     |
| `.setValue(val)`           | Property             | void             | 2     |
| `.fireChange(params)`      | Event                | void             | 3     |
| `.getTable()`              | Method → element     | proxy            | 2     |
| `.getRows()`               | Method → aggregation | proxy[]          | 2     |
| `.getBindingContext()`     | Method → object      | UI5Object        | 2     |
| `.getObject()`             | UI5Object method     | plain object     | 2     |
| `.getItems()`              | Method → aggregation | proxy[]          | 2     |
| `.getKey()` / `.getText()` | Item method → result | string           | 6     |
| `.open()` / `.close()`     | Method               | void             | 4     |
| `.isOpen()`                | Method → result      | boolean          | 4     |
| `.setSelectedKey(key)`     | Method               | void             | 1     |
| `.getSelectedKey()`        | Method → result      | string           | 2     |
| `.getEnabled()`            | Property             | boolean          | 3     |
| `.getVisible()`            | Property             | boolean          | 1     |

---

## 2. dhikraft Architecture: Complete Execution Chain

```
┌─ TEST FILE ─────────────────────────────────────────────────────────────┐
│  import { test, expect } from 'dhikraft';                               │
│  test('...', async ({ page, ui5 }) => { ... })                          │
└────────────────────────┬────────────────────────────────────────────────┘
                         │ Playwright fixture DI
                         ▼
┌─ FIXTURE LAYER (dhikraft-fixtures.ts:756-826) ──────────────────────────┐
│  ui5 = new UI5Handler(page, config)                                     │
│    + ui5.navigation    = createNavigationWrapper(page)                  │
│    + ui5.navigationBar = new UI5NavigationBarHandler(page)              │
│    + ui5.footerBar     = new UI5FooterBarHandler(page)                  │
│    + ui5.assertion     = createAssertionWrapper(page)                   │
│  after test: handler.destroy()                                          │
└────────────────────────┬────────────────────────────────────────────────┘
                         │ ui5.control(selector)
                         ▼
┌─ HANDLER LAYER (ui5-handler.ts:359-396) ────────────────────────────────┐
│  1. Cache lookup (selector → serialized key → WeakRef<proxy>)           │
│  2. cache miss → createControlProxy(selector)                           │
│     → new UI5ControlProxy({ page, selector, config, skipStabilityWait })│
│     → proxy.initialize()                                                │
│  3. Cache store and return                                              │
└────────────────────────┬────────────────────────────────────────────────┘
                         │ proxy.initialize()
                         ▼
┌─ PROXY INIT (ui5-control-proxy.ts:632-662) ─────────────────────────────┐
│  1. waitForUI5Stable(page)    ◄── AUTO-WAIT (unless skipStabilityWait)  │
│  2. page.evaluate(controlFinderFunction, serializedSelector)            │
│     ┌── BROWSER: 3-PRIORITY DISCOVERY CHAIN ───────────────────┐       │
│     │  P0: Registry search (iterate Element.registry)          │       │
│     │  P1: Direct ID lookup (3-API fallback chain)             │       │
│     │  P2: RecordReplay.findDOMElementByControlSelector()      │       │
│     └──────────────────────────────────────────────────────────┘       │
│  3. this.controlId = result.controlId                                   │
│  4. return createFluentProxy(this)  ◄── JS Proxy wrapping               │
└────────────────────────┬────────────────────────────────────────────────┘
                         │ proxy.someMethod(...args)
                         ▼
┌─ FLUENT PROXY GET TRAP (ui5-control-proxy.ts:1723-1765) ────────────────┐
│  if (prop in target) → bound class method                               │
│  else → async (...args) => target.callMethod(prop, ...args)             │
│     │                                                                    │
│     ▼                                                                    │
│  callMethod() → page.evaluate(method execution + 7-type detection)      │
│     │                                                                    │
│     ▼                                                                    │
│  Node-side switch:                                                       │
│    'aggregation' → Promise.all(refs.map(→ new UI5ControlProxy))         │
│    'element'     → new UI5ControlProxy(controlRef)                      │
│    'newElement'  → new UI5ControlProxy(controlRef)                      │
│    'object'      → UI5Object.create({ uuid, type, page })              │
│    'result'      → raw value                                            │
│    'empty'       → []                                                    │
│    'none'        → null                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Layer-by-Layer Breakdown

### 3.1 Fixture Registration

**File:** `fixtures/dhikraft-fixtures.ts:651, 756-826`

```typescript
export const test = base.extend<DhikraftFixtures, WorkerFixtures>({
  // ...
  ui5: async ({ page, config }, use) => {
    const handler = new UI5Handler(page, {
      enableCache: true,
      cacheTTL: UI5_CACHE_TTL_MS,
      debug: config.logLevel === 'debug' || config.logLevel === 'verbose',
      interactionConfig,
    });

    // Compose helper properties onto handler
    const extendedHandler = handler as typeof handler & Record<string, unknown>;
    extendedHandler.navigation = createNavigationWrapper(page);
    extendedHandler.navigationBar = new UI5NavigationBarHandler(page);
    extendedHandler.footerBar = new UI5FooterBarHandler(page);
    extendedHandler.assertion = createAssertionWrapper(page);

    await use(extendedHandler);
    handler.destroy();
  },
});
```

**Key insight:** `UI5Handler` is NOT exported from main entry `'dhikraft'`. Consumers
only interact through fixtures. The handler is internal machinery.

### 3.2 UI5Handler.control() — Discovery Entry Point

**File:** `handlers/ui5-handler.ts:359-396`

```typescript
async control(selector: UI5Selector): Promise<UI5Control> {
    // 1. Auto-initialize
    if (!this.initialized) await this.initialize();

    // 2. Normalize selector (wdi5 compatibility)
    let actualSelector = ('selector' in selector) ? selector.selector : selector;

    // 3. Cache-first
    if (this.cache) {
        const key = serializeSelectorForCacheKey(actualSelector);
        const cached = this.cache.get(key);
        if (cached) return cached;

        const proxy = await this.createControlProxy(actualSelector);
        this.cache.set(key, proxy);
        return proxy;
    }

    return this.createControlProxy(actualSelector);
}
```

### 3.3 UI5ControlProxy — Constructor & Initialize

**File:** `lib/ui5-control-proxy.ts:562-662`

```typescript
constructor(options) {
    this.page = options.page;
    this.selector = options.selector;
    this.skipStabilityWait = options.skipStabilityWait || false;

    // Select interaction strategy
    this.strategy = InteractionStrategyFactory.create(options.config);

    // Wrap in fluent proxy
    return this.createFluentProxy();
}

async initialize(): Promise<string> {
    // AUTO-WAIT: UI5 stability check before discovery
    if (!this.skipStabilityWait) {
        await waitForUI5Stable(this.page);  // ← CRITICAL
    }

    // Browser-side control discovery
    const serializedSelector = this.serializeSelector(this.selector);
    const result = await this.page.evaluate(
        controlFinderFunction,
        serializedSelector,
    );

    this.controlId = result.controlId;
    return result.controlId;
}
```

### 3.4 Browser-Side Control Discovery — 3-Priority Chain

**File:** `lib/ui5-control-proxy.ts:116-497`

| Priority | Method           | When Used                                       | Performance |
| -------- | ---------------- | ----------------------------------------------- | ----------- |
| **0**    | Registry search  | Always first — iterate `Element.registry.all()` | ~5-50ms     |
| **1**    | Direct ID lookup | If P0 fails and selector has string `id`        | ~1ms        |
| **2**    | RecordReplay API | If P0+P1 fail, complex selectors                | ~50-200ms   |

**Direct ID Lookup — 3-API Fallback Chain:**

```
Element.getElementById()     (UI5 ≥ 1.119) — modern
    ↓ fallback
ElementRegistry.get()         (UI5 ≥ 1.120) — alternative
    ↓ fallback
Core.byId()                   (legacy, deprecated ≥ 1.118)
```

---

## 4. 7-Type Return Detection System

**File:** `lib/ui5-control-proxy.ts:1256-1409` (browser-side)
**File:** `lib/ui5-control-proxy.ts:1411-1466` (Node-side processing)

### 4.1 Browser-Side Detection Logic

```
method result
    │
    ├─ Array.isArray && length === 0 ────────────── TYPE 1: 'empty' → []
    │
    ├─ Array.isArray && items[0].getId exists ───── TYPE 2: 'aggregation' → controlRef[]
    │     (each item: { controlType, controlId })
    │
    ├─ Array.isArray && items are primitives ────── TYPE 3: 'result' (array)
    │
    ├─ typeof !== 'object' || null ──────────────── TYPE 3: 'result' (primitive)
    │
    ├─ has getId() + in registry ────────────────── TYPE 4: 'element' (existing control)
    │
    ├─ has getId() + NOT in registry ────────────── TYPE 5: 'newElement' (created control)
    │
    ├─ typeof === 'object' && serializable ──────── TYPE 3: 'result' (object)
    │
    ├─ typeof === 'object' && NOT serializable ──── TYPE 6: 'object' (UUID stored)
    │
    └─ everything else ──────────────────────────── TYPE 7: 'none' → null
```

### 4.2 Node-Side Processing

| Type            | Browser Returns                                                        | Node Processing                                | Test Usage                               |
| --------------- | ---------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------- |
| **empty**       | `{ returnType: 'empty', value: [] }`                                   | Return `[]`                                    | `.getItems()` on empty list              |
| **aggregation** | `{ returnType: 'aggregation', value: [{controlType, controlId},...] }` | `Promise.all(refs.map(→ new UI5ControlProxy))` | `.getRows()`, `.getItems()`              |
| **result**      | `{ returnType: 'result', value: primitive/object }`                    | Return directly                                | `.getText()`, `.getValue()`, `.isOpen()` |
| **element**     | `{ returnType: 'element', value: {controlType, controlId} }`           | `new UI5ControlProxy(ref)`                     | `.getTable()`, `.getParent()`            |
| **newElement**  | `{ returnType: 'newElement', value: {controlType, controlId} }`        | `new UI5ControlProxy(ref)`                     | `.clone()`                               |
| **object**      | `{ returnType: 'object', value: {_uuid, _type} }`                      | `UI5Object.create({ uuid, type, page })`       | `.getBindingContext()`                   |
| **none**        | `{ returnType: 'none', value: null }`                                  | Return `null`                                  | void methods                             |

### 4.3 Gold Standard Usage of Each Type

```typescript
// TYPE 2 (aggregation): getRows() → array of proxy
const rows = await innerTable.getRows(); // proxy[]
for (const row of rows) {
  // Each row IS a full proxy — can call any method

  // TYPE 6 (object): getBindingContext() → UI5Object proxy
  const ctx = await row.getBindingContext(); // UI5Object

  // TYPE 3 (result): getObject() on UI5Object → serializable data
  const data = await ctx.getObject(); // { Material: 'M-100', Plant: '1000' }
}

// TYPE 4 (element): getTable() → single proxy
const innerTable = await smartTable.getTable(); // proxy for sap.ui.table.Table

// TYPE 2 (aggregation): getItems() → array of proxy
const items = await combo.getItems(); // proxy[]
for (const item of items) {
  const key = await item.getKey(); // TYPE 3 (result) → string
  const text = await item.getText(); // TYPE 3 (result) → string
}
```

---

## 5. Interaction Strategy System

### 5.1 Strategy Interface

**File:** `lib/interaction-strategies/base-strategy.ts`

```typescript
interface InteractionStrategy {
  press(page, controlId, options?): Promise<void>;
  enterText(page, controlId, text, options?): Promise<void>;
  fireEvent(page, controlId, eventName, params?): Promise<void>;
}
```

### 5.2 Three Strategies

| Strategy               | Name                | Default Since | Approach                                    | Speed  |
| ---------------------- | ------------------- | ------------- | ------------------------------------------- | ------ |
| **PlaywrightStrategy** | `playwright-native` | v2.5.0        | `fire*()` methods first, DOM click fallback | ~50ms  |
| **DOMFirstStrategy**   | `dom-first`         | v1.0          | DOM events first, UI5 fallback              | ~100ms |
| **OPA5Strategy**       | `opa5-recordreplay` | v2.0          | SAP RecordReplay API                        | ~200ms |

### 5.3 PlaywrightStrategy.press() — Default Path

```
control.firePress?  ─── YES ──→ call firePress()     ← sap.m.Button
         │
         NO
         ▼
control.fireSelect? ─── YES ──→ call fireSelect()    ← sap.m.CheckBox
         │
         NO
         ▼
control.fireTap?    ─── YES ──→ call fireTap()        ← sap.m.Link
         │
         NO
         ▼
getDomRef()         ─── DOM ──→ Playwright DOM click   ← fallback
```

### 5.4 Strategy Selection

**File:** `lib/interaction-strategies/factory.ts:107-124`

```typescript
static create(config?: InteractionConfig): InteractionStrategy {
    switch (config?.interactionStrategy) {
        case 'dom-first':           return new DOMFirstStrategy();
        case 'opa5-recordreplay':   return new OPA5Strategy(config?.opa5);
        case 'playwright-native':   // fallthrough
        default:                    return new PlaywrightStrategy();
    }
}
```

---

## 6. UI5Object System (Non-Control Proxies)

### 6.1 When UI5Object is Created

Non-serializable objects returned by bridge method calls:

- `getBindingContext()` → returns `sap.ui.model.Context`
- `getModel()` → returns `sap.ui.model.Model`
- `getRouter()` → returns `sap.ui.core.routing.Router`
- Any method returning a complex object that fails `JSON.stringify()`

### 6.2 Flow: Control Method → UI5Object → Data

```
proxy.getBindingContext()
    │
    ▼ callMethod() in browser
    JSON.stringify() fails → bridge.saveObject(result) → UUID
    return { returnType: 'object', value: { _uuid, _type } }
    │
    ▼ Node-side processing
    UI5Object.create({ uuid, type, page })
    → createUI5ObjectProxy(instance)
    → Proxy with get trap → method forwarding
    │
    ▼ proxy.getObject()
    page.evaluate() → bridge.getObject(uuid) → obj.getObject() → serializable data
    → returned to test as plain JavaScript object
```

### 6.3 dhikraft UI5Object (657 LOC)

- Full class with UUID-keyed cache (`UI5ObjectCache`)
- Method cache (`Set<string>`) loaded via `loadMethods()`
- `create()` factory → `loadMethods()` → `createUI5ObjectProxy(instance)`
- Proxy handler: intercepts get, has, ownKeys, getOwnPropertyDescriptor
- Browser execution: `executeObjectMethodInBrowser()` with nested return type detection

### 6.4 Praman UI5Object (119 LOC) — Simpler, Same Pattern

- Lightweight class with `uuid`, `type`, `page`
- `create()` factory (synchronous — no method preloading)
- `executeMethod()` forwards to browser via `page.evaluate()`
- Separate `createUI5ObjectProxy()` with same anti-thenable pattern

---

## 7. Praman vs dhikraft: Side-by-Side Comparison

### 7.1 Architecture Overview

| Aspect              | dhikraft                                                  | Praman                                                             |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| **Proxy model**     | Double proxy: class + fluent Proxy wrapper                | Single unified Proxy (D16)                                         |
| **Entry point**     | `UI5Handler.control(selector)`                            | `discoverControl(selector, adapter, cache, strategies)`            |
| **Control state**   | Instance: `this.page`, `this.controlId`, `this.strategy`  | Closure: `ControlProxyState { id, controlType, methods, adapter }` |
| **Method dispatch** | `callMethod()` on class instance                          | `createMethodForwarder()` → `adapter.executeControlMethod()`       |
| **Return handling** | In-class callMethod() with 7-type switch                  | `handleBridgeReturn()` separate function                           |
| **Object proxy**    | `UI5Object` (657 LOC) + `UI5ObjectProxy` (507 LOC)        | `UI5Object` (119 LOC) + `UI5ObjectProxy` (65 LOC)                  |
| **Strategies**      | 3 full strategies with `PressOptions`, `EnterTextOptions` | 3 strategies matching dhikraft                                     |
| **Auto-wait**       | `waitForUI5Stable()` before `initialize()`                | NOT wired (exists in code, not called)                             |

### 7.2 Proxy Get Trap Comparison

**dhikraft (fluent proxy createFluentProxy):**

```
get(target, prop) →
  1. Anti-thenable (then/catch/finally → undefined)
  2. Class method (prop in target → bind and return)
  3. Dynamic → callMethod(prop, ...args) → 7-type processing
```

**Praman (dynamic-proxy.ts createControlProxy):**

```
get(_target, prop) →
  1. Symbol handling (Symbol.toPrimitive → toString)
  2. Anti-thenable (then/catch/finally → undefined)
  3. Direct properties (id, controlType → state values)
  4. Built-in methods (getId, getProperty, etc. → resolved locally)
  5. String helpers (toString, toJSON)
  6. Blacklist check (isBlacklisted → throw ControlError)
  7. Dynamic → createMethodForwarder(state, prop)
```

### 7.3 Method Execution Comparison

**dhikraft — callMethod() (in-process, class-based):**

```typescript
async callMethod(methodName, ...args) {
    // 1. Initialize if needed
    // 2. page.evaluate() — calls method + 7-type detection IN BROWSER
    // 3. Node-side switch — wraps results in proxies
    //    aggregation → Promise.all(map(→ new UI5ControlProxy))
    //    element → new UI5ControlProxy
    //    object → UI5Object.create()
    //    result → raw value
}
```

**Praman — createMethodForwarder() (functional, adapter-based):**

```typescript
function createMethodForwarder(state, methodName) {
  return async (...args) => {
    const result = await state.adapter.executeControlMethod(state.id, methodName, args);
    return handleBridgeReturn(result); // ← CRITICAL: does NOT create sub-proxies
  };
}
```

### 7.4 Return Handler Comparison

| Return Type     | dhikraft (callMethod)                          | Praman (handleBridgeReturn)                                       |
| --------------- | ---------------------------------------------- | ----------------------------------------------------------------- |
| **aggregation** | `Promise.all(refs.map(→ new UI5ControlProxy))` | Returns `AggregationItemRef[]` (UUID + type) — **NO sub-proxies** |
| **element**     | `new UI5ControlProxy(ref)`                     | Returns raw `result.value` — **NO sub-proxy**                     |
| **newElement**  | `new UI5ControlProxy(ref)`                     | Returns raw `result.value` — **NO sub-proxy**                     |
| **object**      | `UI5Object.create({ uuid, type, page })`       | Returns `ObjectRef { uuid, objectType }` — **NO UI5Object proxy** |
| **result**      | Direct return                                  | Direct return ✅                                                  |
| **empty**       | `[]`                                           | `undefined` ⚠️                                                    |
| **none**        | `null`                                         | `undefined` ✅                                                    |

---

## 8. Gap Analysis: What Praman Must Match

### 8.1 CRITICAL: Return Type Sub-Proxy Creation

**The #1 gap.** Praman's `handleBridgeReturn()` returns raw references instead of
creating sub-proxies. This breaks the gold standard's core pattern:

```typescript
// Gold standard REQUIRES this to work:
const innerTable = await smartTable.getTable(); // MUST return a proxy
const rows = await innerTable.getRows(); // MUST return proxy[]
const ctx = await rows[0].getBindingContext(); // MUST return UI5Object proxy
const data = await ctx.getObject(); // MUST return plain data
```

**Current Praman behavior:**

```typescript
const innerTable = await smartTable.getTable();
// Returns { id: '...', controlType: '...' } — a plain object, NOT a proxy
// innerTable.getRows() → TypeError: not a function
```

**Fix required:** `handleBridgeReturn()` must:

1. Accept `adapter` + `page` parameters (or be refactored)
2. For `aggregation` → create proxy array via `createControlProxy()` for each ref
3. For `element`/`newElement` → create single proxy via `createControlProxy()`
4. For `object` → create `UI5Object` + wrap in `createUI5ObjectProxy()`

**Note:** Praman already has `proxy-converter.ts` with `convertToControlProxy()` and
`convertToObjectProxy()` — but these are NOT called from `handleBridgeReturn()`.

### 8.2 CRITICAL: Auto-Wait Before Discovery

**dhikraft:** `waitForUI5Stable(page)` is called inside `initialize()` before every
control discovery.

**Praman:** `discoverControl()` in `discovery.ts` does NOT call `waitForUI5Stable()`.
The method exists on the adapter (`adapter.waitForUI5Stable()`) but is never invoked
in the discovery flow.

### 8.3 CRITICAL: Missing UI5Handler Convenience Layer

The gold standard uses `ui5.control(selector)` which is `UI5Handler.control()`.
Praman has no equivalent handler class. The `discoverControl()` function requires
explicit `adapter`, `cache`, and `strategies` parameters.

**Praman needs:** A `UI5Handler` class (or equivalent) that:

1. Receives `page` + `config` from fixture
2. Holds references to adapter, cache, and strategies
3. Exposes `control(selector): Promise<UI5ControlBase>` as primary API
4. Calls `waitForUI5Stable()` before discovery
5. Manages proxy lifecycle and caching

### 8.4 IMPORTANT: Interaction Strategy Not Wired to Proxy

**dhikraft:** Each `UI5ControlProxy` holds a reference to its `InteractionStrategy`.
Methods like `press()`, `enterText()`, `fireEvent()` delegate to the strategy.

**Praman:** The proxy's `ControlProxyState` has no strategy reference. All method calls
go through the generic `adapter.executeControlMethod()` path. The 3 interaction
strategies exist but are not connected to the proxy flow.

### 8.5 IMPORTANT: fireEvent Not in Interaction Strategy Interface

**dhikraft** strategy interface: `press()`, `enterText()`, `fireEvent()`

**Praman** strategy interface: `press()`, `enterText()`, `select()` — has `select()`
instead of `fireEvent()`. The gold standard calls `.fireChange()` which requires
`fireEvent()` capability.

### 8.6 Browser Script: Return Type Detection Differences

**dhikraft `callMethod()` browser-side:**

- Validates method exists via `retrieveControlMethods(control)`
- Handles aggregation with ComboBox/PlanningCalendar special cases
- Detects element vs newElement via registry lookup (3-API fallback chain)
- Non-serializable objects → `bridge.saveObject()` → UUID

**Praman `createExecuteMethodScript()` browser-side:**

- Validates method exists via `typeof ctrl[methodName] === 'function'`
- Handles aggregation with ComboBox/PlanningCalendar special cases ✅
- Detects element vs newElement via identity check (`result === ctrl`) ⚠️
- Non-serializable objects → `bridge.saveObject()` → UUID ✅
- **Missing:** element/newElement detection for DIFFERENT controls

**Specific difference in element detection:**

dhikraft:

```javascript
// Checks if result has getId() + matches registry entry
if (existing === methodInvocationResult) → 'element'
else → 'newElement'
```

Praman:

```javascript
// Only checks if result IS the same control (setter chaining)
if (result === ctrl) → 'element'
// Separate check for controls with getId + getParent
if (result.getId && result.getParent) → 'newElement'
```

This means Praman correctly detects self-returns and new elements, but the
element detection (existing control returned by e.g. `getTable()`) goes to
`newElement` path instead. Functionally equivalent but less precise.

### 8.7 Minor: Empty Return Handling

**dhikraft:** `'empty'` type returns `[]`
**Praman:** `'empty'` type returns `undefined` in `handleBridgeReturn()`

Should return `[]` for consistency with gold standard patterns like:

```typescript
const items = await combo.getItems(); // Should be [] not undefined when empty
```

---

## 9. Praman Architectural Improvements

### 9.1 What Praman Does Better

| Feature              | dhikraft                         | Praman                                         | Improvement                    |
| -------------------- | -------------------------------- | ---------------------------------------------- | ------------------------------ |
| **Proxy model**      | 2317 LOC class + Proxy wrapper   | 189 LOC pure Proxy (D16)                       | 12x smaller, no class overhead |
| **Method blacklist** | Separate blacklist file          | `isBlacklisted()` integrated in get trap       | Cleaner composition            |
| **Type safety**      | `UI5Control` interface (runtime) | 199 typed control interfaces (compile-time)    | Full IDE autocomplete          |
| **Browser scripts**  | Inline strings in class methods  | Separate `browser-scripts/` module             | Testable, cacheable            |
| **Bridge injection** | `_ui5Bridge` global              | `__praman_bridge` with UUID objectMap          | Namespaced, no collisions      |
| **Error handling**   | Generic `Error` throws           | Typed `ControlError`, `BridgeError` with codes | AI-parseable errors            |
| **Discovery**        | Single file, 3-priority chain    | `discovery.ts` + `discovery-factory.ts`        | Configurable chain             |
| **Config**           | Runtime object                   | Zod-validated, `Readonly<PramanConfig>`        | Type-safe, immutable           |

### 9.2 Praman's Better Architecture for Return Handling

The separation of `handleBridgeReturn()` from the proxy is actually better design.
The fix should NOT merge them back — instead, evolve `handleBridgeReturn()` into a
richer return processor that creates sub-proxies:

```typescript
// PROPOSED: Enhanced return handler (functional, not class-based)
export function handleBridgeReturn(
  result: MethodExecutionResult,
  context: ReturnHandlerContext,
): Promise<unknown> | unknown {
  // ... same switch but with sub-proxy creation
}

interface ReturnHandlerContext {
  readonly adapter: BridgeAdapter;
  readonly page: BridgePage;
  readonly methods: ReadonlySet<string>; // for child proxy creation
}
```

### 9.3 Praman's Better Architecture for UI5Handler

Instead of dhikraft's monolithic 2317 LOC class, Praman should compose:

```typescript
// Functional composition (Praman way)
export function createUI5Handler(page: BridgePage, config: PramanConfig) {
  const adapter = createAdapter(config);
  const cache = new ControlProxyCache();
  const strategies = config.discoveryStrategies;

  return {
    control: (selector) => discoverControl(selector, adapter, cache, strategies),
    controls: (selector) => discoverControls(selector, adapter, cache, strategies),
    waitForUI5: () => adapter.waitForUI5Stable(),
    // ... other convenience methods
  };
}
```

---

## 10. Implementation Recommendations

### 10.1 Priority Order (based on gold standard usage)

| Priority | Gap                                 | Impact                                  | Effort  |
| -------- | ----------------------------------- | --------------------------------------- | ------- |
| **P0**   | Return handler sub-proxy creation   | Blocks ALL aggregation/element patterns | Medium  |
| **P0**   | Auto-wait before discovery          | Flaky tests without it                  | Small   |
| **P1**   | UI5Handler convenience layer        | Consumer API usability                  | Medium  |
| **P1**   | Wire interaction strategy to proxy  | press/enterText routing                 | Small   |
| **P2**   | fireEvent in strategy interface     | Custom event support                    | Small   |
| **P2**   | Empty return → `[]` not `undefined` | Array pattern consistency               | Trivial |
| **P3**   | Element vs newElement precision     | Debugging clarity only                  | Small   |

### 10.2 Files to Modify

| File                                            | Change                                          | Size         |
| ----------------------------------------------- | ----------------------------------------------- | ------------ |
| `src/proxy/return-handler.ts`                   | Add context param, create sub-proxies           | +40 LOC      |
| `src/proxy/dynamic-proxy.ts`                    | Pass context to `handleBridgeReturn`            | +5 LOC       |
| `src/proxy/discovery.ts`                        | Add `waitForUI5Stable()` before discovery       | +3 LOC       |
| **NEW** `src/fixtures/ui5-handler.ts`           | Handler class composing adapter+cache+discovery | ~200 LOC     |
| `src/bridge/interaction-strategies/strategy.ts` | Add `fireEvent()` to interface                  | +5 LOC       |
| All 3 strategy files                            | Add `fireEvent()` implementation                | +15 LOC each |

### 10.3 Test Coverage Required

| Test                                        | Validates                                    |
| ------------------------------------------- | -------------------------------------------- |
| Return handler: aggregation → proxy array   | Gold standard `.getRows()` pattern           |
| Return handler: element → proxy             | Gold standard `.getTable()` pattern          |
| Return handler: object → UI5Object proxy    | Gold standard `.getBindingContext()` pattern |
| Discovery: auto-wait called before find     | UI5 stability before search                  |
| UI5Handler.control(): cache hit             | Performance                                  |
| UI5Handler.control(): cache miss → discover | End-to-end                                   |
| Strategy: fireEvent routing                 | `.fireChange()` support                      |

---

## Appendix A: File Reference

### dhikraft Source Files

| File                                                | LOC       | Purpose                                      |
| --------------------------------------------------- | --------- | -------------------------------------------- |
| `fixtures/dhikraft-fixtures.ts`                     | ~2400     | Fixture registration, composition            |
| `handlers/ui5-handler.ts`                           | ~2300     | UI5Handler class (discovery, cache, methods) |
| `lib/ui5-control-proxy.ts`                          | ~1800     | Control proxy class + callMethod + 7-type    |
| `lib/ui5-object.ts`                                 | ~650      | UI5Object for non-control objects            |
| `lib/ui5-object-proxy.ts`                           | ~500      | Proxy wrapper for UI5Object                  |
| `lib/interaction-strategies/playwright-strategy.ts` | ~280      | Default strategy                             |
| `lib/interaction-strategies/dom-first-strategy.ts`  | ~630      | DOM-first strategy                           |
| `lib/interaction-strategies/opa5-strategy.ts`       | ~350      | OPA5 strategy                                |
| `lib/interaction-strategies/factory.ts`             | ~180      | Strategy factory                             |
| `lib/interaction-strategies/base-strategy.ts`       | ~110      | Strategy interface                           |
| **Total**                                           | **~9200** |                                              |

### Praman Source Files (Equivalent)

| File                                                   | LOC       | Purpose                         |
| ------------------------------------------------------ | --------- | ------------------------------- |
| `proxy/dynamic-proxy.ts`                               | 189       | Single unified proxy (D16)      |
| `proxy/return-handler.ts`                              | 114       | Return type routing             |
| `proxy/proxy-converter.ts`                             | 92        | Control/object proxy conversion |
| `proxy/ui5-object.ts`                                  | 119       | UI5Object (lightweight)         |
| `proxy/ui5-object-proxy.ts`                            | 65        | UI5Object proxy wrapper         |
| `proxy/discovery.ts`                                   | 127       | Discovery orchestration         |
| `proxy/discovery-factory.ts`                           | ~60       | Priority chain builder          |
| `proxy/cache.ts`                                       | ~80       | Control proxy cache             |
| `bridge/classic-adapter.ts`                            | 310       | Primary adapter                 |
| `bridge/injection.ts`                                  | 113       | Bridge injection                |
| `bridge/browser-scripts/execute-method.ts`             | 262       | Browser scripts (7-type)        |
| `bridge/interaction-strategies/strategy.ts`            | 56        | Strategy interface              |
| `bridge/interaction-strategies/ui5-native-strategy.ts` | 87        | Default strategy                |
| `bridge/interaction-strategies/dom-first-strategy.ts`  | 91        | DOM-first strategy              |
| `bridge/interaction-strategies/opa5-strategy.ts`       | 134       | OPA5 strategy                   |
| `bridge/interaction-strategies/strategy-factory.ts`    | 42        | Strategy factory                |
| **Total**                                              | **~1941** | **4.7x smaller than dhikraft**  |

### LOC Comparison

- dhikraft equivalent functionality: **~9,200 LOC**
- Praman equivalent functionality: **~1,941 LOC**
- Ratio: **4.7x smaller** with better separation of concerns
- Estimated additions for full parity: **~250 LOC** (return handler + UI5Handler + strategy wiring)
- Final estimated: **~2,200 LOC** — still **4.2x smaller** than dhikraft
