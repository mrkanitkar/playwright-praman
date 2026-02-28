---
sidebar_position: 10
title: Control Proxy Pattern
---

Every UI5 control discovered by Praman is wrapped in a JavaScript `Proxy` that routes method
calls through Playwright's `page.evaluate()` to the real browser-side control. This page
explains how the proxy works, what it can do, and how it compares to wdi5.

## How createControlProxy() Works

When you call `ui5.control()`, Praman:

1. Discovers the control in the browser (via the multi-strategy chain)
2. Stores the control's ID as a reference
3. Returns a JavaScript `Proxy` object that intercepts all property access

```typescript
const button = await ui5.control({ id: 'saveBtn' });
// `button` is a Proxy, not the actual UI5 control
```

:::tip Typed Returns
When you provide `controlType` as a string literal, the proxy is typed to the specific control
interface — e.g., `UI5Button` instead of `UI5ControlBase`. See [Typed Control Returns](/docs/guides/typed-controls).
:::

When you call a method on the proxy (e.g., `button.getText()`), the proxy's `get` trap:

1. Checks if the method is a **built-in safe method** (press, enterText, select, etc.)
2. Checks if the method is **blacklisted** (lifecycle/internal methods)
3. If neither, forwards the call to the browser via `page.evaluate()`

```
Node.js                          Browser
───────                          ───────
button.getText()
  → Proxy get trap
    → method forwarder
      → page.evaluate(fn, controlId)
                                   → sap.ui.getCore().byId(controlId)
                                     → control.getText()
                                       → return 'Save'
      ← result: 'Save'
```

## The 7-Type Return System

When a method executes in the browser, the result is classified into one of 7 types:

| Return Type             | Example                               | Proxy Behavior              |
| ----------------------- | ------------------------------------- | --------------------------- |
| **Primitive**           | `string`, `number`, `boolean`, `null` | Returned directly           |
| **Plain object**        | `{ key: 'val' }`                      | Returned as-is (serialized) |
| **Array of primitives** | `['a', 'b']`                          | Returned as-is              |
| **UI5 element**         | Single control reference              | Wrapped in a new proxy      |
| **Array of elements**   | Aggregation result                    | Array of new proxies        |
| **undefined**           | Setter return / void                  | Returns `undefined`         |
| **Non-serializable**    | Circular refs, DOM nodes              | Throws `ControlError`       |

This means you can chain proxy calls to navigate the control tree:

```typescript
const table = await ui5.control({ id: 'poTable' });
const items = await table.getItems(); // Array of proxied controls
const firstItem = items[0];
const cells = await firstItem.getCells(); // Array of proxied controls
const text = await cells[2].getText(); // 'Active'
```

## Built-In Safe Methods

These methods have dedicated implementations with proper event firing and fallback logic:

| Method                 | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `press()`              | Fires press/tap event via interaction strategy                    |
| `enterText(value)`     | Sets value + fires liveChange + change events                     |
| `select(key)`          | Selects item by key or text                                       |
| `getAggregation(name)` | Returns aggregation as proxied control array                      |
| `exec(fn, ...args)`    | Executes an arbitrary function on the browser-side control        |
| `getControlMetadata()` | Returns control metadata (type, properties, aggregations, events) |
| `getControlInfoFull()` | Returns full control introspection data                           |
| `retrieveMembers()`    | Returns all public members of the control                         |

## The Method Blacklist

Praman blocks 71 static methods and 2 dynamic rules to prevent dangerous operations:

```typescript
// These throw ControlError with code 'ERR_METHOD_BLACKLISTED':
await button.destroy(); // Lifecycle method
await button.rerender(); // Rendering internal
await button.setParent(other); // Tree manipulation
await button.placeAt('container'); // DOM manipulation
```

The blacklist includes:

- **Lifecycle methods** — `destroy`, `init`, `exit`, `onBeforeRendering`, `onAfterRendering`
- **Internal methods** — `_*` (any method starting with underscore)
- **Tree manipulation** — `setParent`, `insertAggregation`, `removeAllAggregation`
- **Rendering** — `rerender`, `invalidate`, `placeAt`
- **DOM access** — `getDomRef`, `$` (returns non-serializable DOM nodes)

When a blacklisted method is called, the error includes suggestions for safe alternatives.

## Custom Function Execution

For edge cases where you need browser-side logic that no proxy method covers, use `exec()`:

```typescript
const control = await ui5.control({ id: 'mySmartField' });

// Execute arbitrary function on the browser-side control
const customData = await control.exec((ctrl) => {
  const innerControl = ctrl.getInnerControls()[0];
  return {
    type: innerControl.getMetadata().getName(),
    value: innerControl.getValue(),
  };
});
```

The function passed to `exec()` runs inside `page.evaluate()` — it has access to the browser
environment and the UI5 control as its first argument. Additional arguments are serialized
and passed through.

## Anti-Thenable Guard

JavaScript's `await` operator checks for a `then` property on any object. If a UI5 control
happens to have a `then` method or property, `await proxy` would accidentally consume it.

Praman's proxy includes an anti-thenable guard:

```typescript
// The proxy intercepts 'then' access and returns undefined
// This prevents accidental Promise consumption:
const control = await ui5.control({ id: 'myControl' });
// Without the guard, this second await would break:
const text = await control.getText();
```

## Control Introspection

Use introspection methods to understand a control's capabilities at runtime:

```typescript
const control = await ui5.control({ id: 'unknownControl' });

// Full metadata
const meta = await control.getControlMetadata();
console.log(meta.controlType); // 'sap.m.Input'
console.log(meta.properties); // ['value', 'placeholder', 'enabled', ...]
console.log(meta.aggregations); // ['tooltip', 'customData', ...]
console.log(meta.events); // ['change', 'liveChange', ...]

// All public members
const members = await control.retrieveMembers();
console.log(members.methods); // ['getValue', 'setValue', 'getEnabled', ...]
```

## Comparison: wdi5 WDI5Control vs Praman UI5ControlBase

| Aspect               | wdi5 WDI5Control               | Praman UI5ControlBase                                                            |
| -------------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| **Proxy mechanism**  | Class with `getProperty(name)` | ES Proxy with `get` trap                                                         |
| **Method calls**     | `control.getProperty('value')` | `control.getValue()` (direct)                                                    |
| **Return handling**  | Manual unwrapping              | Auto-detect 7 return types                                                       |
| **Blacklist**        | Partial (small list)           | 71 static + 2 dynamic rules                                                      |
| **Chaining**         | Limited, must re-wrap          | Automatic proxy wrapping                                                         |
| **Type safety**      | Partial TypeScript             | Full TypeScript with [199 typed control interfaces](/docs/guides/typed-controls) |
| **Introspection**    | Basic                          | `getControlMetadata()`, `retrieveMembers()`, `getControlInfoFull()`              |
| **Custom execution** | `executeMethod()`              | `exec(fn, ...args)`                                                              |
| **Step decoration**  | None                           | Every call wrapped in `test.step()`                                              |
| **Caching**          | None                           | LRU cache (200 entries, 5s TTL)                                                  |

The key difference: wdi5 uses a class-based approach where you call generic methods like
`getProperty('value')`. Praman uses an ES Proxy where you call `getValue()` directly — matching
the UI5 API surface exactly.

## Performance Considerations

- **Proxy creation is cheap** — the proxy is a thin wrapper around a control ID string
- **Method calls cross the process boundary** — each call to the proxy invokes `page.evaluate()`,
  which is a round-trip to the browser. Batch operations when possible.
- **Caching** — repeated `ui5.control()` calls with the same selector hit the LRU cache (200
  entries, 5s TTL), returning the existing proxy without re-discovery
- **Aggregation results** — `getItems()` on a table with 1000 rows returns 1000 proxies. Use
  `ui5.table.getRows()` for bulk data access instead.
