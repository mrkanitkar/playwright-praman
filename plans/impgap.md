# Implementation Gap Analysis: Praman vs dhikraft Bridge/Proxy

## Executive Summary

This document identifies **every functional gap** between Praman v1.0 and dhikraft v2.5.0 in the bridge, proxy, and discovery layers. The analysis covers the complete flow: discovery → method execution → return handling → sub-proxy creation → chained method calls.

**Root cause of E2E failures**: Praman uses **string-form** `page.evaluate(script)` everywhere, while dhikraft uses **function-form** `page.evaluate(fn, args)` for all method execution and discovery. String-form evaluation is fundamentally less resilient to SAP execution context destruction.

---

## File Mapping

| Capability              | dhikraft                                      | Praman                                                   | Gap?             |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------- | ---------------- |
| Control proxy           | `lib/ui5-control-proxy.ts` (1,829 LOC)        | `src/proxy/control-proxy.ts` (347 LOC)                   | YES              |
| Object proxy handler    | `lib/ui5-object-proxy.ts` (507 LOC)           | Inline in `ui5-object.ts` toProxy()                      | YES              |
| UI5Object class         | `lib/ui5-object.ts` (682 LOC)                 | `src/proxy/ui5-object.ts` (209 LOC)                      | YES              |
| Browser scripts         | Inline in control-proxy callMethod()          | `src/bridge/browser-scripts/execute-method.ts` (271 LOC) | Partial          |
| Discovery scripts       | Inline in createControlFinderFunction()       | `src/bridge/browser-scripts/find-control.ts` (234 LOC)   | YES              |
| Bridge injection        | `lib/ui5-bridge/injection.ts` (1,035 LOC)     | `src/bridge/injection.ts` (133 LOC)                      | YES              |
| Browser helpers         | `lib/ui5-bridge/browser-helpers.ts` (725 LOC) | N/A                                                      | MISSING          |
| Constants/blacklist     | `lib/ui5-bridge/constants.ts` (313 LOC)       | `src/bridge/method-blacklist.ts` (159 LOC)               | YES              |
| Interaction strategies  | `lib/interaction-strategies/` (3 files)       | `src/bridge/interaction-strategies/` (3 files)           | Partial          |
| Selector parser         | `lib/ui5-selector-parser.ts`                  | N/A                                                      | MISSING          |
| Object cache            | `lib/ui5-object-cache.ts`                     | `src/proxy/ui5-object-cache.ts`                          | OK               |
| Config/schema           | N/A (hardcoded)                               | `src/core/config/schema.ts` (162 LOC)                    | Praman advantage |
| Discovery orchestration | Inline in control-proxy                       | `src/proxy/discovery.ts` + `discovery-factory.ts`        | Praman advantage |

**LOC comparison**: dhikraft proxy+bridge layer = ~5,091 LOC. Praman = ~1,459 LOC. **Praman is 71% smaller**, partly due to missing features and partly due to config-driven architecture vs hardcoded logic.

---

## Config-Driven Discovery Architecture (Praman Advantage)

Praman's discovery is governed by the Zod schema (`src/core/config/schema.ts`):

```typescript
discoveryStrategies: z
  .array(z.enum(['direct-id', 'recordreplay', 'registry']))
  .min(1)
  .default(['direct-id', 'recordreplay']),  // ← DEFAULT: no 'registry'

preferVisibleControls: z.boolean().default(true),
skipStabilityWait: z.boolean().default(false),
ignoreAutoWaitUrls: z.array(z.string()).default([]),
controlDiscoveryTimeout: z.number().int().positive().default(10_000),
interactionStrategy: z.enum(['ui5-native', 'dom-first', 'opa5']).default('ui5-native'),
```

**Key design decisions**:

- `'registry'` strategy exists in the enum but is **deliberately deferred to Phase 3** — `tryStrategy()` in `discovery.ts:77` returns `null` for it
- `discovery-factory.ts:76` **promotes `direct-id` to first** for ID-only selectors regardless of config order
- `preferVisibleControls` config exists but is **NOT wired** to the browser script (see GAP-21)
- `ignoreAutoWaitUrls` IS wired — consumed in `stability-fixtures.ts:102` (Playwright-side, not XHR-level)
- `skipStabilityWait` IS wired — consumed in `stability-fixtures.ts:119` and `wait-helpers.ts:99`
- Env var overrides: `PRAMAN_DISCOVERY_STRATEGIES`, `PRAMAN_PREFER_VISIBLE`, `PRAMAN_SKIP_STABILITY_WAIT`

**Two parallel discovery paths** (consistency risk):

| Path   | File                                     | Used By                                        |
| ------ | ---------------------------------------- | ---------------------------------------------- |
| Path A | `discovery.ts:discoverControl()`         | External callers, fixtures via `ui5.control()` |
| Path B | `ui5-handler.ts:discoverSingleControl()` | UI5Handler internal                            |

Path A uses `getDiscoveryPriorities()` for smart ordering. Path B does its own inline loop. Changes to one must be mirrored in the other.

---

## GAP SEVERITY CLASSIFICATION

| Severity           | Meaning                                          | Count |
| ------------------ | ------------------------------------------------ | ----- |
| **P0-BLOCKER**     | Prevents E2E test execution                      | 1     |
| **P1-CRITICAL**    | Causes method calls to fail or return wrong data | 6     |
| **P2-IMPORTANT**   | Missing functionality that limits test scenarios | 9     |
| **P3-ENHANCEMENT** | Missing convenience features                     | 3     |
| **VERIFIED-OK**    | Investigated — not a real gap                    | 1     |

**Total: 19 actionable gaps** (GAP-05 merged into GAP-01, GAP-17 verified as not a gap).

### Reviewer Changelog

- GAP-05 merged into GAP-01 (80% overlap — both cover function-form conversion for UI5Object)
- GAP-17 removed → VERIFIED-OK (Praman `bridge.getById()` already has 3-step chain at `inject-ui5.ts:108-133`)
- GAP-02 downgraded P0→P1 (config deliberately defers `'registry'`; partial scan exists in Tier 2)
- GAP-03 downgraded P0→P1 (root cause is GAP-01; generic forwarder works once context is stable)
- GAP-07 downgraded P1→P2 (informational differences; fix = do GAP-01 + minor alignment)
- GAP-09 corrected (bridge HAS `utils.retrieveControlMethods`, `bridge.Element` ref, and full `getById` chain)
- GAP-06 split into "clear errors" vs "design decisions" for blacklist removals
- GAP-21 added (preferVisibleControls config not wired to browser script)

---

## P0-BLOCKER GAPS

### GAP-01: String-form vs Function-form page.evaluate

**Impact**: ROOT CAUSE of "Execution context destroyed" errors on deep proxy chains.

**dhikraft** (`ui5-control-proxy.ts:1226`):

```typescript
// FUNCTION FORM — args serialized by Playwright CDP protocol
const methodResult = await this.page.evaluate(
  ({ controlId, methodName, args }) => {
    // All logic runs inside the function body
    const bridge = (window as any)._ui5Bridge;
    const control = bridge.Element.registry.get(controlId);
    // ... 7-type return detection inline
  },
  { controlId: this.controlId, methodName, args }, // ← args passed via CDP
);
```

**Praman** (`control-proxy.ts:289-296`):

```typescript
// STRING FORM — entire script is a string evaluated via Runtime.evaluate
const script = buildExecuteScript(state.id, methodName, args);
const result = (await state.page.evaluate(script)) as MethodExecutionResult;
```

**Why this matters**:

- String-form uses CDP `Runtime.evaluate` — executes in the "current" execution context
- Function-form uses CDP `Runtime.callFunctionOn` — Playwright internally handles context tracking
- When SAP destroys a context (IAS refresh, WalkMe, FLP analytics), string-form fails immediately; function-form has Playwright's built-in retry/context-tracking
- Our retry logic (3 attempts, 2.5s delay) doesn't help because the context destruction is caused by the _next_ background operation, not a transient glitch

**Fix**: Rewrite `control-proxy.ts` forwarder and `ui5-object.ts` executeMethod to use function-form page.evaluate. The browser-side logic currently in `execute-method.ts` IIFE strings must move into TypeScript functions that can be passed to `page.evaluate(fn, args)`.

**Includes merged GAP-05**: UI5Object's `executeMethod` also needs function-form + enhanced return detection:

- Array-of-UI5-controls detection (dhikraft handles `getRows()` returning UI5 objects)
- Promise detection
- `returnedObjectUuid`/`returnedObjectUuids` return shape for sub-proxy creation

**Files to change**:

- `src/proxy/control-proxy.ts` — forwarder function
- `src/proxy/ui5-object.ts` — executeMethod
- `src/bridge/browser-scripts/execute-method.ts` — may need to convert to function-form helpers or remove entirely
- `src/proxy/discovery.ts` — also uses string-form for discovery scripts

**Consumer impact** (every fixture and matcher depends on control-proxy.ts):

| Consumer       | File                             | Impact                                      |
| -------------- | -------------------------------- | ------------------------------------------- |
| Core fixtures  | `src/fixtures/core-fixtures.ts`  | Creates control proxies via `ui5.control()` |
| Nav fixtures   | `src/fixtures/nav-fixtures.ts`   | Navigates via proxy methods                 |
| Shell handler  | `src/fixtures/shell-handler.ts`  | Shell bar interactions                      |
| Footer handler | `src/fixtures/footer-handler.ts` | Footer interactions                         |
| UI5 handler    | `src/fixtures/ui5-handler.ts`    | UI5 operations, also has own discovery path |
| UI5 matchers   | `src/matchers/ui5-matchers.ts`   | Assertions on proxy values                  |
| Table matchers | `src/matchers/table-matchers.ts` | Table row assertions                        |

---

## P1-CRITICAL GAPS

### GAP-02: Control Discovery — Incomplete Registry Matching

**Severity**: P1-CRITICAL (downgraded from P0 — config deliberately defers full `'registry'` strategy to Phase 3; partial scan exists)

**Impact**: Controls not found when ID is view-prefixed or when controlType+properties selector is used.

**dhikraft** (`ui5-control-proxy.ts:237-392`):

```
PRIORITY 0: Registry Search (broad scan — runs first, iterates all registered controls)
  - Iterates ALL controls via Element.registry.all()
  - Matches controlType, id (string or RegExp), properties, viewId, viewName,
    bindingPath, aggregationName, i18nKey
  - Prefers visible controls over hidden (WalkMe compatibility)
  - Falls back to first hidden match if no visible match

PRIORITY 1: Direct ID Lookup (DEFAULT — standard approach for ID-based lookups)
  - Runs when Registry Search finds no match + exact string ID provided
  - getControlById() internal fallback chain:
    DEFAULT: Element.getElementById() (UI5 1.119+ modern primary API)
    FALLBACK 1: ElementRegistry.get() (UI5 1.120+ alternative)
    FALLBACK 2: sap.ui.getCore().byId() (LEGACY — deprecated since 1.118)
  - Verifies controlType match if specified

PRIORITY 2: RecordReplay (when both fail + complex selector)
  - findDOMElementByControlSelector() → getControlById() to convert DOM → control
```

**Praman** (`find-control.ts:101-163`, governed by `discoveryStrategies` config):

```
Default config: ['direct-id', 'recordreplay'] — NO 'registry'
'registry' exists in Zod enum but tryStrategy() returns null (Phase 3 placeholder)

Browser-side tiers (ALL run for both 'direct-id' and 'recordreplay' strategies):
  Tier 1: Direct ID lookup via bridge.getById() — full 3-step modern API chain
  Tier 2: Registry scan for partial ID match (endsWith '--' + selectorId)
  Tier 3: RecordReplay → Element.closestTo() or jQuery.control()
```

**What exists in Praman**:

- Tier 2 registry scan (partial — `endsWith` matching only)
- 3-step `getById()` chain (Element.getElementById → ElementRegistry.get → Core.byId)
- Config infrastructure for `'registry'` strategy (Zod enum + env var)

**Missing in Praman**:

1. **Full property matching** in registry scan — only does `endsWith`, not controlType/properties/viewName
2. **RegExp ID matching** — dhikraft supports `id: /pattern/` selectors
3. **Property matching** — dhikraft checks `getXxx()` for each property in selector
4. **viewId/viewName matching** — dhikraft traverses parent chain for view resolution
5. **bindingPath matching** — dhikraft checks `getBinding('value')` or `getBinding('text')`
6. **aggregationName matching** — dhikraft checks parent's aggregation contains control
7. **i18nKey matching** — dhikraft resolves i18n key via resource bundle
8. **Visibility preference** — `preferVisibleControls: true` config exists but is NOT wired to browser script (see GAP-21)

**Fix**: Enhance Tier 2 in `find-control.ts` with full property matching. Wire `'registry'` in `tryStrategy()`. Pass `preferVisibleControls` from config to browser script.

---

### GAP-03: UI5Object Explicit Methods (getBindingContext, getProperty, setProperty)

**Severity**: P1-CRITICAL (downgraded from P0 — root cause of test failure is GAP-01, not missing handler)

**Impact**: `getBindingContext()` via proxy relies on generic forwarder → works correctly if GAP-01 is fixed (returns `'object'` type → `handleObjectReturn` → UI5Object proxy). Explicit handlers improve robustness and type safety.

**Conflict resolution**: GAP-07 item 4 notes Praman correctly routes BindingContext to `'object'` type (since BindingContext has `getId()` but is NOT an Element, Praman's fallthrough to `saveObject` is actually better than dhikraft's `newElement` classification). The generic forwarder path works. Explicit methods add:

- Type-safe return types instead of `unknown`
- Known `sap.ui.model.Context` type tag on created UI5Object
- Direct documentation for test authors

**dhikraft** (`ui5-object-proxy.ts:74-101`):

```typescript
const NON_PROXIED_PROPERTIES = new Set([
  'then',
  'catch',
  'finally',
  'constructor',
  'prototype',
  '__proto__',
  'toJSON',
  'toString',
  'valueOf',
  'Symbol.toStringTag',
  'Symbol.iterator',
  // UI5Object own methods — handled by class directly
  'uuid',
  'type',
  'page',
  'methodCache',
  'executeMethod',
  'getMethods',
  'describe',
  'getAIContext',
  'getMetadata',
  'destroy',
  'isDestroyed',
  'getProperty',
  'setProperty',
  'getBindingContext', // ← CRITICAL: explicit handler
]);
```

**dhikraft** (`ui5-object.ts:400-414`):

```typescript
public async getBindingContext(modelName?: string):
  Promise<(UI5Object & Record<string, unknown>) | undefined> {
  const result = await this.executeMethod('getBindingContext', [modelName]);
  if (result.returnedObjectUuid) {
    return UI5Object.create({
      uuid: result.returnedObjectUuid,
      type: result.returnedObjectType || 'sap.ui.model.Context',
      page: this.page,
    });
  }
  return undefined;
}
```

**Praman** (`ui5-object.ts:184`):

```typescript
// getBindingContext falls through to generic forwarder:
return async (...args: unknown[]): Promise<unknown> => this.executeMethod(prop, args);
```

**Fix**: Add `getBindingContext`, `getProperty`, `setProperty`, `getMetadata`, `destroy` as explicit methods on `UI5Object` class. Add matching entries to the proxy's anti-forwarding set.

---

### GAP-04: UI5Object.create() is Synchronous (No Method Loading)

**dhikraft** (`ui5-object.ts:146-173`):

```typescript
public static async create(options): Promise<UI5Object & Record<string, unknown>> {
  // Validate UUID
  // Check/update cache
  const instance = new UI5Object(options);
  await instance.loadMethods();  // ← loads methods from browser
  return createUI5ObjectProxy(instance);  // ← returns fully-initialized proxy
}
```

**Praman** (`ui5-object.ts:79-81`):

```typescript
static create(params: UI5ObjectCreateParams): UI5Object {
  return new UI5Object(params);  // ← synchronous, no method loading
}
```

**Impact**: Praman's UI5Object proxies don't know their available methods. The `has` trap in dhikraft's proxy checks `target.methodCache.has(prop)` — without loaded methods, property existence checks fail.

**Fix**: Make `UI5Object.create()` async. Add `loadMethods()` that calls `getObjectMethodsFromBrowser()`. Return proxied instance.

**Async migration impact** (callers that must add `await`):

| Caller                           | File:Line                     | Change                                                            |
| -------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| handleReturn 'object' case       | `control-proxy.ts:191`        | `await UI5Object.create()` — handleReturn already async via proxy |
| handleObjectReturn 'object' case | `ui5-object.ts:133`           | `await UI5Object.create()` — handleObjectReturn becomes async     |
| 20+ test call sites              | `ui5-object.test.ts`          | All `UI5Object.create()` calls need `await`                       |
| 1 test helper                    | `ui5-object-cache.test.ts:22` | Need `await`                                                      |

---

### GAP-06: Blacklist Delta — dhikraft 47 vs Praman 52 Items

**dhikraft** (`constants.ts:25-146`): 47 active items + 2 dynamic patterns (`_prefix`, `Render` suffix)
Note: File header says "88-item list" but that counts commented-out ALLOWED items. Only 47 are active.

**Praman** (`method-blacklist.ts:40-104`): 52 explicit items + 2 dynamic patterns (`_prefix`, `Render` suffix)
Note: Praman actually has MORE items — it blocks 34 items dhikraft does not (see below).

**Shared items**: 18 (in both blacklists)

**Missing from Praman** (29 items in dhikraft but not in Praman — ADD these):

```
Aggregation manipulation:
  setAggregation, addAggregation, removeAggregation, removeAllAggregation,
  insertAggregation, indexOfAggregation, destroyAggregation, validateAggregation,
  propagateProperties, findAggregatedObjects

Association methods:
  getAssociation, setAssociation, addAssociation, removeAssociation, removeAllAssociation

Property validation:
  validateProperty

Rendering extras:
  removeDelegate, addDelegate

Lifecycle extras:
  applySettings

State methods:
  isActive, isDestroyStarted

Internal methods (explicit for clarity — also caught by _ prefix rule):
  _getBindingContext, _setBindingContext, _getPropertiesToPropagate,
  _callMethodInManagedObject, _observeChanges, _propagateProperties

Debug:
  inspect, data
```

**Items in Praman that dhikraft ALLOWS — split by category**:

_Clear errors (REMOVE — these are standard APIs test authors need):_

```
destroy          → lifecycle control (needed for cleanup in tests)
getMetadata      → essential for control inspection and type checking
getInterface     → interface access
```

_Design decisions (EVALUATE — could go either way):_

```
getLayoutData / setLayoutData       → layout info (rarely needed in tests)
getBusy / setBusy                   → UI state (useful for wait assertions)
getBusyIndicatorDelay / setBusyIndicatorDelay → UI config (rarely needed)
getFieldGroupIds / setFieldGroupIds → field groups (rarely needed)
getTooltip / setTooltip             → tooltip access (useful for a11y tests)
getCustomData / addCustomData / removeCustomData → custom data (useful for data-driven tests)
getIdForLabel                       → accessibility (useful for a11y tests)
getAccessibilityInfo                → accessibility (useful for a11y tests)
```

**Praman extras — good practice additions NOT in dhikraft** (16 items, keep these):

```
Lifecycle hooks (6): onInit, onExit, onBeforeShow, onAfterShow, onBeforeHide, onAfterHide
Rendering (4):       onBeforeRendering, onAfterRendering, getRenderer, render
                     (also caught by dhikraft's Render suffix rule)
Binding mutation (6): bindElement, unbindElement, bindAggregation,
                      unbindAggregation, bindProperty, unbindProperty
```

**Fix**: Add 29 missing items (23 truly new + 6 underscore items for explicitness). Remove 3 clear errors. Evaluate remaining 15 design decisions based on E2E test needs.

---

### GAP-08: Sub-Proxy Creation on Aggregation/Element Returns

**Depends on**: GAP-04 (async UI5Object.create for 'object' case)

**dhikraft** (`ui5-control-proxy.ts:1417-1466`):

```typescript
case 'aggregation':
  return Promise.all(
    controlRefs.map(async (ref) => {
      return createUI5ControlProxy(this.page, {
        controlType: ref.controlType,
        id: ref.controlId,
      }, this.timeout, this.skipStabilityWait);
      // ↑ FULL discovery + initialization
    })
  );
case 'element':
  return createUI5ControlProxy(this.page, { ... }, this.timeout, this.skipStabilityWait);
case 'object':
  return UI5Object.create({ uuid, type, page });  // ← async, loads methods
```

**Praman** (`control-proxy.ts:153-193`):

```typescript
case 'aggregation':
  return controlIds.map((id, idx) => {
    return createControlProxy({ id, controlType, methods: new Set(), page, interactionStrategy });
    // ↑ BARE proxy — no discovery, no method loading, no initialization
  });
case 'object':
  const obj = UI5Object.create({ uuid, type, page });  // ← sync, no method loading
  return obj.toProxy();
```

**Missing in Praman**:

1. Sub-proxies from aggregation returns are **bare** — no method lists, no discovery validation
2. Sub-proxies don't propagate timeout or stability-wait settings
3. UI5Object sub-proxies are created synchronously (no method loading) — fixed by GAP-04
4. `Promise.all()` for parallel initialization of aggregation items

**Fix**: Bare proxies work for method forwarding since methods go through `page.evaluate()` anyway. The `methods` Set is informational only. Primary fix is GAP-01 (function-form evaluate) + GAP-04 (async UI5Object.create). Consider adding `skipStabilityWait` propagation when config support is wired.

---

### GAP-09: Bridge Injection — Missing Eager Injection

**dhikraft** (`injection.ts:475-494`):

```typescript
export async function injectUI5Bridge(target: BrowserContext | Page, options = {}): Promise<void> {
  // Eager injection via addInitScript
  await target.addInitScript(getBrowserHelpersCode());
  await target.addInitScript(createEagerBridgeCode(logLevel));
  // ↑ Bridge available BEFORE UI5 loads — polls for sap.ui.getCore
}
```

**dhikraft bridge shape** (`injection.ts:710-877`):

- `retrieveControlMethods(control)` — method filtering on bridge
- `saveObject(obj)` / `getObject(uuid)` / `deleteObject(uuid)` — object storage
- `objectMap: new Map()` — direct objectMap access
- `utils.isPrimitive()` / `utils.getUI5CtlForWebObj()` / `utils.createControlIdMap()`
- `findAllControls(selector)` — bulk discovery
- `waitForUI5()` / `isStable()` — stability checking
- `enumerateControls()` / `inspectControl()` / `buildControlTree()` / `getAllControlTypes()`
- SAP module refs: `Log`, `RecordReplay`, `Control`, `BindingPath`, `I18NText`, `Properties`, `Ancestor`, `LabelFor`, `Element`, `VersionInfo`

**Praman** (`injection.ts:56-73`, `inject-ui5.ts:41-195`):

- Late injection only (page.evaluate) — deliberate design (W14)
- Bridge shape includes: `getById()` (3-step chain), `isPrimitive()`, `saveObject()`/`getObject()`/`deleteObject()`, `objectMap`, `RecordReplay`, `Element`, `Log` (via sap.ui.require)
- ~~No `retrieveControlMethods()` on bridge~~ **CORRECTED**: EXISTS at `inject-ui5.ts:140` as `bridge.utils.retrieveControlMethods()`
- ~~No `Element.registry` direct access~~ **CORRECTED**: `bridge.Element` is set at `inject-ui5.ts:176`
- `ignoreAutoWaitUrls` handled Playwright-side via `stability-fixtures.ts:102` (different approach than XHR patching)

**Actually missing**:

1. **Eager injection** via `addInitScript` — critical for pages where UI5 loads before test code runs
2. **Browser-side XHR patching** for WalkMe/analytics bypass (Praman uses Playwright-side URL filtering instead — different approach, not necessarily inferior)
3. **Stability helpers on bridge** — `waitForUI5()`, `isStable()` (Praman handles this at fixture level)
4. **Control introspection** — `inspectControl()`, `enumerateControls()`, `buildControlTree()`
5. **Extra SAP module refs** — `BindingPath`, `I18NText`, `Properties`, `Ancestor`, `LabelFor`, `VersionInfo`

**Fix**: Add eager injection support via `addInitScript` as alternative to late injection. Add missing SAP module refs to bridge. Control introspection is P2/Phase 5.

---

## P2-IMPORTANT GAPS

### GAP-07: callMethod 7-Type Return Detection — Browser-Side Differences

**Severity**: P2-IMPORTANT (downgraded from P1 — differences are informational; primary fix is GAP-01)

**dhikraft** (`ui5-control-proxy.ts:1254-1408`) — inline in `callMethod`:

```
TYPE 1: empty → Array.isArray && length === 0
TYPE 2: aggregation → Array with items that have getId()
TYPE 3: result → typeof !== 'object' || null (primitives)
TYPE 4: element → has getId(), found in registry, result === existing
TYPE 5: newElement → has getId(), NOT same as registry entry
TYPE 6: object → typeof === 'object', try JSON.stringify:
        - Serializable → return as 'result'
        - Not serializable → saveObject, return UUID as 'object'
TYPE 7: none → fallthrough
```

**Praman** (`execute-method.ts:79-177`) — in IIFE string:

```
none → undefined/null
empty → Array.isArray && length === 0
aggregation → Array with items that have getParent()
result → isPrimitive() helper
element → result === ctrl
newElement → has getId() AND getParent() AND exists in registry
object → saveObject (does NOT try JSON.stringify first)
```

**Key Differences**:

1. **Aggregation detection**: dhikraft checks `getId()`, Praman checks `getParent()` — both valid but different coverage
2. **element vs newElement**: dhikraft checks `existing === methodInvocationResult` (identity), Praman checks if registry has ID (existence). dhikraft's approach is more correct.
3. **Object serializability**: dhikraft tries `JSON.stringify()` first — if serializable, returns as `'result'` (avoids UUID overhead). Praman always stores as UUID. Praman's approach is safer (avoids blocking main thread) but loses the optimization for simple serializable objects.
4. **newElement fallthrough**: dhikraft returns `newElement` for ANY object with `getId()`, even if not in registry. Praman falls through to `saveObject()` if not in registry — this means non-Element ManagedObjects get stored as 'object' instead of 'newElement'. **This is actually BETTER for Praman** because BindingContext has `getId()` but is NOT an Element.

**Fix**: Minor alignment after GAP-01 is done. The newElement fallthrough difference is a Praman advantage — preserve it.

---

### GAP-10: Fluent Proxy (Method Chaining)

**dhikraft** (`ui5-control-proxy.ts:1723-1765`):

```typescript
createFluentProxy(): UI5ControlProxy {
  return new Proxy(this, {
    get: (target, prop) => {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      if (prop in target) { /* bind and return */ }
      // Forward unknown methods through callMethod → 7-type handler
      return async (...args) => {
        const result = await target.callMethod(prop, ...args);
        // If result is UI5ControlProxy, return for chaining
        // If result is array of proxies, return array
        return result;
      };
    }
  });
}
```

**Praman**: No fluent proxy. `createControlProxy()` returns a flat proxy with get trap but no method chaining awareness.

**Impact**: Cannot do `await control.getParent().getText()` — must do:

```typescript
const parent = await control.getParent();
const text = await parent.getText();
```

**Fix**: Add fluent proxy support in `createControlProxy()` — when return value is another proxy, enable chaining.

---

### GAP-11: UI5Object.executeArrayMethod

**dhikraft** (`ui5-object.ts:430-461`):

```typescript
public async executeArrayMethod<T>(methodName: string, args?: unknown[]):
  Promise<(UI5Object & Record<string, unknown>)[]> {
  const result = await executeObjectMethodInBrowser(this.page, this.uuid, methodName, args);
  if (result.returnedObjectUuids && result.returnedObjectTypes) {
    return Promise.all(result.returnedObjectUuids.map((uuid, i) =>
      UI5Object.create({ uuid, type: result.returnedObjectTypes[i], page: this.page })
    ));
  }
  return [];
}
```

**Praman**: No equivalent. Object proxy doesn't distinguish single-object vs array-of-objects returns.

**Fix**: Either add `executeArrayMethod` to `UI5Object`, or handle array-of-objects in `handleObjectReturn()`.

---

### GAP-12: Control Proxy — exec() Method

**dhikraft** (`ui5-control-proxy.ts:1663-1709`):

```typescript
async exec<T>(fn: (control: unknown, ...args: unknown[]) => T, ...args: unknown[]): Promise<T> {
  return await this.page.evaluate(
    ({ controlId, fnString, args }) => {
      const control = bridge.Element.registry.get(controlId);
      const fn = new Function('control', ...argNames, `return (${fnString})(control, ...)`);
      return fn(control, ...args);
    },
    { controlId: this.controlId, fnString: fn.toString(), args }
  );
}
```

**Praman**: No equivalent.

**Impact**: Cannot execute arbitrary code on controls. Useful for: extracting multiple properties at once, complex DOM interactions, custom event handling.

---

### GAP-13: renewWebElementReference (Stale Element Recovery)

**dhikraft** (`ui5-control-proxy.ts:1199-1206`):

```typescript
async renewWebElementReference(): Promise<void> {
  const newControlId = await this.initialize();
}
```

**Praman**: No equivalent. If a control's DOM is refreshed, the proxy becomes stale.

---

### GAP-14: Selector Parser

**dhikraft**: Has `lib/ui5-selector-parser.ts` that converts string selectors to structured `UI5Selector` objects.

```typescript
const control = await createUI5ControlProxy(page, 'sap.m.Button#submitBtn');
// Parses to: { controlType: 'sap.m.Button', id: 'submitBtn' }
```

**Praman**: No selector parser. Selectors must be structured objects.

---

### GAP-15: skipStabilityWait Propagation to Sub-Proxies

**dhikraft**: `skipStabilityWait` flag propagated to ALL sub-proxies created from method returns (aggregation, element, newElement).

**Praman**: `skipStabilityWait` config EXISTS and is consumed at fixture level (`stability-fixtures.ts:119`, `wait-helpers.ts:99`). What's missing is propagation through sub-proxies — when a control method returns a sub-proxy, the stability-wait setting is not carried over.

---

### GAP-16: getControlMetadata / getControlInfoFull / retrieveMembers

**dhikraft** has rich control introspection:

- `getControlMetadata()` — returns className, properties, aggregations, events
- `getControlInfoFull()` — returns id, controlType, 220+ methods, properties, aggregations, events
- `retrieveMembers()` — walks prototype chain with blacklist filtering (via bridge.retrieveControlMethods)
- `getControlType()` — returns fully qualified type name
- `getControlInterfaces()` — returns interface names
- `getControlProperties()` — returns property metadata
- `getControlEvents()` — returns event names

**Praman**: Only has `getId()`, `getControlType()` as built-in overrides. Bridge has `utils.retrieveControlMethods()` but no proxy-level introspection wrappers.

---

### GAP-21: preferVisibleControls Config Not Wired (NEW)

**Impact**: Config option `preferVisibleControls: true` (default) is defined in the Zod schema and has an env var mapping (`PRAMAN_PREFER_VISIBLE`), but the value is **never passed** to the browser-side discovery script.

**Config path**: `schema.ts:136` → `loader.ts:61` → `core-fixtures.ts:198` (passes to UI5Handler) → BUT `find-control.ts` browser script has no `preferVisibleControls` parameter.

**dhikraft** (`ui5-control-proxy.ts:384-391`): Prefers visible controls, falls back to first hidden match. This is hardcoded in the browser script, not config-driven.

**Fix**: Pass `preferVisibleControls` from config through `discoverControl()` → `tryStrategy()` → browser script arguments. Add visibility checking in `find-control.ts` Tier 2 registry scan.

---

## P3-ENHANCEMENT GAPS

### GAP-18: Interactive Control Types / Container Control Types Lists

**dhikraft** (`constants.ts:239-312`): Exports `INTERACTIVE_CONTROL_TYPES` (34 types) and `CONTAINER_CONTROL_TYPES` (27 types) for bulk discovery filtering.

**Praman**: No equivalent lists.

---

### GAP-19: Object Category Detection

**dhikraft** (`types/ui5-object-types.ts`): `detectCategory(type)` classifies objects into categories (model, router, controller, binding, etc.) for AI context generation.

**Praman**: No category detection.

---

### GAP-20: AI Context Methods on UI5Object

**dhikraft**: `describe()`, `getAIContext()`, `suggestOperations()`, `getCommonPatterns()`, `getDocumentationLinks()`, `getExamples()`.

**Praman**: No AI context methods (planned for Phase 4).

---

## VERIFIED-OK (Not a Gap)

### ~~GAP-17~~: Modern UI5 API Resolution Chain

**Status**: VERIFIED — Praman already implements the full 3-step chain.

Praman's `bridge.getById()` at `inject-ui5.ts:108-133` implements:

1. `Element.getElementById()` — DEFAULT modern primary API (line 112)
2. `ElementRegistry.get()` — FALLBACK alternative (line 117)
3. `sap.ui.getCore().byId()` — LEGACY FALLBACK (line 122)

This matches dhikraft's `getControlById()` chain exactly. No action needed.

---

## Cross-Gap Dependency Graph

```
GAP-01 (function-form evaluate) ← SOLE P0 BLOCKER
  ├── GAP-03 depends (context destruction is root cause of getBindingContext failure)
  ├── GAP-07 depends (main fix IS GAP-01; differences are minor)
  ├── GAP-08 depends (sub-proxy methods fail due to string-form)
  └── GAP-11 depends (array return detection needs function-form)

GAP-04 (async UI5Object.create)
  ├── GAP-08 partially depends (UI5Object sub-proxies get method loading)
  └── GAP-11 depends (executeArrayMethod needs loaded methods)

GAP-02 (registry matching) ← independent
GAP-06 (blacklist alignment) ← independent
GAP-09 (eager injection) ← independent
GAP-21 (preferVisibleControls wiring) ← independent, related to GAP-02

GAP-10..16 ← all independent of each other
GAP-18..20 ← Phase 7 enhancements (P3)
```

---

## Critical Fix Priority Order

Based on E2E test requirements and dependency graph:

### Phase 1: Unblock E2E (GAP-01 only — sole P0)

1. **GAP-01**: Convert `control-proxy.ts` forwarder to function-form page.evaluate
2. **GAP-01**: Convert `ui5-object.ts` executeMethod to function-form page.evaluate
3. **GAP-01**: Convert `discovery.ts` to function-form page.evaluate

### Phase 2: Blacklist Alignment (GAP-06 — independent, low risk)

4. **GAP-06**: Add 29 missing blacklist items
5. **GAP-06**: Remove 3 clear errors (destroy, getMetadata, getInterface)
6. **GAP-06**: Evaluate 15 design-decision items

### Phase 3: UI5Object Robustness (GAP-03 + GAP-04)

7. **GAP-03**: Add explicit getBindingContext/getProperty/setProperty on UI5Object
8. **GAP-04**: Make UI5Object.create() async with method loading (22+ call site migration)

### Phase 4: Discovery Enhancement (GAP-02 + GAP-21)

9. **GAP-02**: Enhance Tier 2 registry scan with full property/controlType matching
10. **GAP-21**: Wire preferVisibleControls config to browser script
11. **GAP-02**: Implement 'registry' strategy in tryStrategy()

### Phase 5: Bridge Infrastructure (GAP-09)

12. **GAP-09**: Eager injection via addInitScript
13. **GAP-09**: Add missing SAP module refs to bridge

### Phase 6: Convenience Features (GAP-07 through GAP-16)

14. **GAP-07**: Minor return-detection alignment (after GAP-01)
15. **GAP-10**: Fluent proxy (method chaining)
16. **GAP-12**: exec() for arbitrary code execution
17. **GAP-13**: renewWebElementReference
18. **GAP-11**: executeArrayMethod on UI5Object
19. **GAP-08**: Sub-proxy initialization improvements
20. **GAP-14**: Selector parser
21. **GAP-16**: Control introspection methods
22. **GAP-15**: skipStabilityWait propagation to sub-proxies

### Phase 7: P3 Enhancements (GAP-18 through GAP-20)

23. **GAP-18**: Interactive/Container control type lists
24. **GAP-19**: Object category detection
25. **GAP-20**: AI context methods on UI5Object (Phase 4 AI layer)

---

## E2E Flow Trace: Where Praman Drops the Ball

The gold standard E2E test exercises this flow:

```
Step 1: ui5.control({ id: 'smartTable' }) → ControlProxy
  ✓ Discovery works (direct ID via bridge.getById — full 3-step chain)
  ✓ Method execution works (getText, getControlType)

Step 2: smartTable.getTable() → sub-ControlProxy
  ✓ Returns 'newElement' → createControlProxy({ id, controlType })
  ✓ Sub-proxy methods work (getControlType)

Step 3: innerTable.getRows() → ControlProxy[]
  ✓ Returns 'aggregation' → array of bare proxies
  ✗ row.getBindingContext() → FAILS (GAP-01: string-form evaluate, context destroyed)

Step 4: row.getBindingContext() → UI5Object proxy
  ✗ Never reached due to Step 3 failure
  Would work via generic forwarder (GAP-07 confirms Praman's 'object' routing is correct)
  GAP-03 explicit handler improves robustness but is not required for correctness

Step 5: context.getObject() → plain data
  ✗ Never reached
  Would work via generic forwarder → 'result' return type
```

**Root cause**: GAP-01 (string-form evaluate) → context destruction → retry fails → test aborts.

**Fix**: GAP-01 (function-form) alone unblocks the full chain. GAP-03 adds robustness. GAP-04 adds method introspection.

---

## Appendix A: Method Blacklist Delta

### Items in dhikraft but NOT in Praman (ADD these — 29 items):

```
Aggregation manipulation (10):
  setAggregation, addAggregation, removeAggregation, removeAllAggregation,
  insertAggregation, indexOfAggregation, destroyAggregation, validateAggregation,
  propagateProperties, findAggregatedObjects

Association methods (5):
  getAssociation, setAssociation, addAssociation, removeAssociation, removeAllAssociation

Property validation (1):
  validateProperty

Rendering extras (2):
  removeDelegate, addDelegate

Lifecycle extras (1):
  applySettings

State methods (2):
  isActive, isDestroyStarted

Internal methods — explicit for clarity, also caught by _ prefix rule (6):
  _getBindingContext, _setBindingContext, _getPropertiesToPropagate,
  _callMethodInManagedObject, _observeChanges, _propagateProperties

Debug (2):
  inspect, data
```

Note: The 6 underscore-prefixed items are already caught by the dynamic `_` prefix rule. Adding them explicitly is for documentation clarity and defense-in-depth.

### Items in Praman but NOT in dhikraft — Clear Errors (REMOVE — 3 items):

```
destroy          → standard lifecycle method, needed for test cleanup
getMetadata      → essential for control inspection and type checking
getInterface     → interface access, standard API
```

### Items in Praman but NOT in dhikraft — Design Decisions (EVALUATE — 15 items):

```
getLayoutData / setLayoutData       → layout info (rarely needed in tests)
getBusy / setBusy                   → UI state (useful for wait assertions)
getBusyIndicatorDelay / setBusyIndicatorDelay → UI config (rarely needed)
getFieldGroupIds / setFieldGroupIds → field groups (rarely needed)
getTooltip / setTooltip             → tooltip access (useful for a11y tests)
getCustomData / addCustomData / removeCustomData → custom data (useful for data-driven)
getIdForLabel                       → accessibility (useful for a11y tests)
getAccessibilityInfo                → accessibility (useful for a11y tests)
```

Recommendation: Unblock `getBusy/setBusy`, `getTooltip/setTooltip`, `getCustomData` (commonly needed in E2E tests). Keep blocking `getLayoutData/setLayoutData`, `getBusyIndicatorDelay/setBusyIndicatorDelay`, `getFieldGroupIds/setFieldGroupIds` (rarely needed, internal-facing).

---

## Appendix B: Dual Discovery Path Detail

Two independent code paths consume `discoveryStrategies`. Both must stay in sync:

**Path A** — `src/proxy/discovery.ts:105`:

```
discoverControl() → getDiscoveryPriorities() → tryStrategy() per strategy
  - Promotes 'direct-id' for ID-only selectors
  - Uses createFindControlScript() browser IIFE
```

**Path B** — `src/fixtures/ui5-handler.ts:548`:

```
discoverSingleControl() → inline loop over this.discoveryStrategies
  - Direct 'direct-id' / 'recordreplay' branching
  - Uses internalFindControl() which evaluates the same browser script
```

**Risk**: If `'registry'` strategy is wired in Path A but not Path B (or vice versa), discovery behavior diverges depending on which fixture method is called.

**Recommendation**: Consolidate to a single discovery orchestration path, or add integration test that verifies both paths produce identical results for the same selector.
