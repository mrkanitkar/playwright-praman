---
sidebar_position: 11
title: 'ADR: JavaScript Proxy for ControlProxy'
---

# ADR: JavaScript Proxy Pattern for ControlProxy (ACT-036)

| Property     | Value                                                                             |
| ------------ | --------------------------------------------------------------------------------- |
| **Decision** | Use ES6 Proxy with a get trap to intercept property access and dispatch to bridge |
| **Status**   | ACCEPTED                                                                          |
| **Date**     | 2025-10-01                                                                        |

## Context

SAP UI5 has over 700 control types with 5,000+ methods across the public API. When a test
discovers a control at runtime (e.g., `ui5.control({ id: 'saveBtn' })`), the returned object
must support calling any of that control's methods -- `getText()`, `getEnabled()`, `press()`,
`getItems()`, etc. -- without knowing the control type at compile time.

The challenge is providing a typed, ergonomic API that:

1. Covers every possible UI5 control method without explicit wrappers
2. Dispatches method calls through the bridge (`page.evaluate()`) to the browser
3. Supports fluent chaining: `await proxy.getParent().getText()`
4. Returns appropriate JavaScript types for primitive, control, and aggregation results
5. Handles UI5's 7 return value categories (primitive, control, aggregation, binding, etc.)

## Decision

Use JavaScript's ES6 `Proxy` with a `get` trap that intercepts property access on the
control proxy object. When a method is accessed (e.g., `proxy.getText`), the trap returns
a forwarder function that dispatches the call through the bridge via `page.evaluate()`.

```typescript
const proxy = createControlProxy({
  id: 'saveBtn',
  controlType: 'sap.m.Button',
  methods: new Set(['getText', 'press']),
  page: playwrightPage,
  interactionStrategy: strategy,
});

// proxy.getText is intercepted by the get trap
// Returns a function that calls page.evaluate() with the method name
const text = await proxy.getText();

// Fluent chaining -- getParent() returns a new ControlProxy
const parentText = await proxy.getParent().getText();
```

The get trap routes property access in priority order:

1. Symbol handling (`Symbol.toPrimitive`, `Symbol.toStringTag`)
2. Anti-thenable (`then`/`catch`/`finally` return `undefined` to prevent accidental await)
3. Direct properties (`id`, `controlType`)
4. Built-in overrides (`getId`, `getControlType`, `getAggregation`)
5. `toString` / `toJSON`
6. Explicit interaction methods (`press`, `enterText`, `select`)
7. Blacklist check (throws `ControlError` for dangerous methods)
8. Dynamic method forwarder (cached per method name, returns chainable result)

Method forwarder functions are cached per method name to avoid recreating closures on
every property access.

## Alternatives Considered

### Code generation from UI5 metadata

Generate a TypeScript class for each of the 700+ control types with explicit method
signatures. Rejected because it would produce ~50 MB of generated code, require
regeneration on every UI5 version update, and create import overhead even for unused
control types.

### Wrapper class per control type

Create manual wrapper classes (e.g., `ButtonProxy`, `TableProxy`) with typed methods.
Rejected because it requires writing and maintaining hundreds of classes, and any new
UI5 control or custom control would need a new wrapper before it could be tested.

### String-based API

Use a generic `control.invoke('getText')` method instead of direct property access.
Rejected because it sacrifices IDE autocompletion, TypeScript type inference, and
readability. Fluent chaining (`control.getParent().getText()`) would be impossible.

## Consequences

### Positive

- **Zero boilerplate**: Any UI5 control method works immediately, including custom controls
  and methods added in future UI5 versions
- **TypeScript generics**: `createControlProxy<sap.m.Button>(...)` provides type inference
  for known control types while falling back to dynamic dispatch for unknown types
- **Fluent chaining**: `await proxy.getParent().getText()` reads naturally and matches
  UI5's own API style
- **Cached forwarders**: Method functions are created once per method name and reused,
  avoiding per-call allocation overhead
- **7-type return handler**: The inline return handler creates sub-proxies for control
  and aggregation results, enabling deep chaining

### Negative

- **Non-serializable**: Proxy objects cannot be passed across process boundaries (e.g.,
  to MCP tool calls or `page.evaluate()`). They are Node.js-only handles to browser-side
  controls
- **Debugging complexity**: Stack traces through Proxy traps are harder to read.
  `console.log(proxy)` shows the Proxy wrapper, not the underlying control state
- **Error handling in traps**: The get trap must carefully handle every possible property
  access pattern (Symbols, `then`, `toJSON`, etc.) to avoid subtle bugs
- **File size exception**: `control-proxy.ts` exceeds the 300 LOC limit because browser
  scripts for introspection must be co-located (they cannot reference Node-side imports)

## References

- [`src/proxy/control-proxy.ts`](https://github.com/nicolo-ribaudo/praman/blob/main/src/proxy/control-proxy.ts) -- ControlProxy implementation
- [MDN Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) -- ES6 Proxy specification
- [UI5 API Reference](https://ui5.sap.com/#/api) -- 700+ control types
