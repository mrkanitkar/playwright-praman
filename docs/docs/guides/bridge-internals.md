---
title: 'Bridge Internals'
---

# Bridge Internals

:::info[Contributor Only]
This page documents Praman's internal bridge architecture. The APIs shown here use internal path aliases (`#bridge/*`) and are not accessible to end users of the `playwright-praman` package. This content is intended for contributors and plugin developers.
:::

The bridge is the communication layer between Praman's Node.js test code and the SAP UI5 framework running in the browser. Understanding its internals is essential for debugging and extending Praman.

## Bridge Injection via page.evaluate()

Praman injects a bridge namespace (`window.__praman_bridge`) into the browser context using Playwright's `page.evaluate()`. The bridge provides:

- UI5 module references (RecordReplay, Element, Log)
- Version detection (`sap.ui.version`)
- Object map for non-control storage (UUID-keyed)
- `getById()` with 3-tier API resolution (Decision D19)
- Helper functions: `isPrimitive`, `saveObject`, `getObject`, `deleteObject`

### Injection Modes

Praman supports two injection strategies:

**Lazy injection** (default): Triggered on first UI5 operation via `ensureBridgeInjected()`.

```typescript
// Every proxy and handler method calls this before browser operations
await ensureBridgeInjected(page);
```

**Eager injection**: Registered via `addInitScript()` before any page loads. Useful for auth flows where the bridge must be ready before the first navigation.

```typescript
import { injectBridgeEager } from '#bridge/injection.js';

// Inject before any navigation (recommended for auth flows)
await injectBridgeEager(page);
await page.goto('https://sap-system.example.com/app');
// Bridge is already available when UI5 loads
```

### Injection Lifecycle

1. Wait for UI5 framework availability (`sap.ui.require` exists)
2. Execute bridge injection script (creates `window.__praman_bridge`)
3. Wait for bridge readiness (`window.__praman_ready === true`)

Injection tracking uses `WeakSet<Page>` to avoid memory leaks. After page navigation invalidates the bridge, call `resetPageInjection(page)` so the next operation re-injects.

```typescript
import { resetPageInjection } from '#bridge/injection.js';

// After navigation invalidates the bridge
resetPageInjection(page);
// Next ensureBridgeInjected() call will re-inject
```

## Serialization Constraints

**This is the single most critical concept for anyone working on bridge code.**

`page.evaluate()` serializes ONLY the function body via `fn.toString()`. This has profound implications:

- Module-level functions are NOT included in the serialized output.
- Imports and closures are NOT available inside `page.evaluate()`.
- TypeScript types (imports, `as` casts, type aliases) are fine -- they are erased at compile time.

### The Inner Function Rule

ALL helper functions MUST be declared as inner function declarations inside the evaluated function:

```typescript
// CORRECT: helper is an inner function
await page.evaluate(() => {
  function getControlById(id: string) {
    // This function IS available in the browser context
    return sap.ui.getCore().byId(id);
  }
  return getControlById('myButton');
});

// WRONG: helper is a module-level function
function getControlById(id: string) {
  return sap.ui.getCore().byId(id);
}

await page.evaluate(() => {
  // ReferenceError: getControlById is not defined
  return getControlById('myButton');
});
```

### Why Unit Tests Give False Positives

Unit tests run in Node.js where module-level functions ARE accessible via closure. This means a unit test will pass even when the code would fail in the browser:

```typescript
// This module-level function is accessible in Node.js tests...
function helperFn() {
  return 'works';
}

// ...so this test PASSES in Vitest but the code FAILS in the browser
it('should work', () => {
  const fn = () => helperFn();
  expect(fn()).toBe('works'); // PASSES in Node.js
});

// In the browser, page.evaluate(() => helperFn()) throws ReferenceError
```

If you see `sonarjs/no-identical-functions` warnings about duplicate inner functions, suppress them with an ESLint disable comment. The duplication is intentional and required.

### String-Based Scripts

For complex browser operations, Praman uses string-based scripts instead of arrow functions. This avoids serialization issues entirely:

```typescript
// Bridge injection uses string evaluation
const script = createBridgeInjectionScript(); // returns a string
await page.evaluate(script);

// Find-control and execute-method also use strings
const findScript = createFindControlScript(selector);
const result = await page.evaluate(findScript);
```

## 3-Tier API Resolution (D19)

The bridge provides a centralized `getById()` function that resolves UI5 control IDs using three fallback tiers:

```
Tier 1: Element.getElementById()     (UI5 1.108+)
Tier 2: ElementRegistry.get()         (UI5 1.84+)
Tier 3: sap.ui.getCore().byId()      (All versions)
```

This is registered once during injection. All browser scripts call `bridge.getById()` instead of duplicating the lookup logic (which was a problem in dhikraft v2.5.0 where 6 files had independent copies).

## Frame Navigation (WorkZone Dual-Frame)

SAP BTP WorkZone (formerly Fiori Launchpad as a Service) renders applications inside nested iframes. Praman handles this transparently:

```
+----------------------------------+
| Shell Frame (WorkZone chrome)    |
|  +----------------------------+  |
|  | App Frame (Fiori app)      |  |
|  |  UI5 controls live here    |  |
|  +----------------------------+  |
+----------------------------------+
```

The bridge must be injected into the **app frame**, not the shell frame. Praman's fixture layer automatically detects the WorkZone dual-frame layout and targets the correct frame for bridge injection and control operations.

After frame navigation (e.g., navigating between Fiori Launchpad tiles), the bridge state in the previous frame is invalidated. The injection tracking resets and re-injects on the next operation.

## Object Map Lifecycle

Non-control UI5 objects (Models, BindingContexts, Routers, etc.) cannot be serialized across the `page.evaluate()` boundary. Praman stores them in a browser-side Map keyed by UUID:

```typescript
// Browser side: save an object reference
const uuid = bridge.saveObject(myModel, 'model');
// Returns: 'a1b2c3d4-...'

// Node side: reference the object by UUID in subsequent calls
await page.evaluate((uuid) => bridge.getObject(uuid).getProperty('/Name'), uuid);
```

### TTL-Based Cleanup (D20)

To prevent memory leaks in long test runs, objects are stored with timestamps:

```javascript
bridge.objectMap.set(uuid, {
  value: obj,
  type: type || 'unknown',
  storedAt: Date.now(),
});
```

A cleanup function evicts entries older than the configured TTL. This pairs with the Node-side `UI5ObjectCache` (TTL + LRU eviction) to keep both sides in sync.

## Stability Checks

Before performing control operations, Praman waits for UI5 to reach a stable (idle) state:

```typescript
// waitForUI5Stable checks these conditions:
// 1. No pending HTTP requests
// 2. No pending timeouts
// 3. No pending UI5 rendering updates
// 4. RecordReplay is available and idle

await page.waitForFunction(waitForUI5StableScript, { timeout });
```

The `skipStabilityWait` option (D23) can be configured globally or per-selector for pages with third-party overlays (like WalkMe) that interfere with stability detection.

## Browser Scripts

The `src/bridge/browser-scripts/` directory contains the scripts executed in the browser context:

| Script                     | Purpose                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `inject-ui5.ts`            | Core bridge initialization, module references, version detection |
| `find-control.ts`          | UI5 control discovery by selector                                |
| `execute-method.ts`        | Remote method invocation on UI5 controls                         |
| `get-selector.ts`          | Reverse lookup: DOM element to UI5 selector                      |
| `get-version.ts`           | UI5 version detection                                            |
| `inspect-control.ts`       | Control metadata introspection for AI                            |
| `object-map.ts`            | UUID-keyed non-control object storage with TTL                   |
| `find-control-matchers.ts` | Property matcher generation for selectors                        |

## Interaction Strategies

Praman provides three strategies for interacting with UI5 controls:

| Strategy            | Approach                                 | Best For                                           |
| ------------------- | ---------------------------------------- | -------------------------------------------------- |
| `UI5NativeStrategy` | `fire*` events -> `fireTap` -> DOM click | Standard UI5 controls, most reliable               |
| `DomFirstStrategy`  | DOM click + auto-detect input type       | Controls with custom renderers                     |
| `Opa5Strategy`      | `RecordReplay.interactWithControl`       | Complex controls needing SAP's own interaction API |

The strategy factory selects the appropriate strategy based on configuration and control type.
