---
sidebar_position: 10
title: 'ADR: Bridge Injection Strategy'
---

# ADR: Bridge Injection Strategy (ACT-028)

| Property     | Value                                                                |
| ------------ | -------------------------------------------------------------------- |
| **Decision** | Use `page.evaluate()` with serialized self-contained function bodies |
| **Status**   | ACCEPTED                                                             |
| **Date**     | 2025-09-20                                                           |

## Context

Praman must communicate between two runtime environments:

1. **Node.js** (Playwright test runner) -- where test logic, assertions, and fixtures run
2. **Browser** (SAP UI5 application) -- where `sap.ui.getCore()`, `sap.ui.test.RecordReplay`,
   and all UI5 controls live

The bridge must inject JavaScript into the browser that can:

- Resolve UI5 controls via `sap.ui.core.Element.getElementById()` (3-tier API resolution)
- Execute methods on discovered controls (getter/setter/action)
- Return serializable results back to Node.js
- Handle UI5 version differences (1.x vs 2.x API splits)

The injection must be idempotent (safe to call multiple times), must not conflict with
the SAP application's own scripts, and must work across Chromium, Firefox, and WebKit.

## Decision

Use Playwright's `page.evaluate()` API to inject self-contained JavaScript functions into
the browser context. The bridge initializes a `window.__praman_bridge` namespace with
UI5 module references, version detection, and helper functions.

Two injection modes are supported:

- **Lazy** (default): `page.evaluate(script)` on first UI5 operation via `ensureBridgeInjected()`
- **Eager**: `page.addInitScript(script)` before page load, with a poller that waits for
  `sap.ui.require` to become available

All browser-side functions are serialized as strings or self-contained function bodies.
They cannot reference Node.js imports, closures, or module-level variables.

```typescript
// Node-side: function is serialized, only its body is sent to the browser
await page.evaluate(
  ({ controlId }) => {
    // This runs in the browser -- no access to Node.js scope
    const el = window.__praman_bridge.getById(controlId);
    return el?.getMetadata().getName();
  },
  { controlId: 'myButton' },
);
```

## Alternatives Considered

### Chrome DevTools Protocol (CDP) directly

Bypass Playwright and use CDP's `Runtime.evaluate` directly. Rejected because it only
works on Chromium-based browsers, breaking Firefox and WebKit support. It also bypasses
Playwright's auto-waiting and error handling, creating a parallel execution path.

### Browser extension

Inject a browser extension that communicates with the test runner via native messaging
or WebSocket. Rejected because extensions require installation (enterprise security
policies often block this), differ across browsers, and add deployment complexity.

### Service Worker / Web Worker

Use a Service Worker to intercept and proxy UI5 API calls. Rejected because Service
Workers operate at the network layer and cannot access the DOM or `window.sap` globals.
Web Workers have the same limitation -- they run in an isolated scope without DOM access.

### Shared memory / SharedArrayBuffer

Use `SharedArrayBuffer` for zero-copy communication between test and app contexts.
Rejected because `SharedArrayBuffer` requires `Cross-Origin-Isolation` headers
(`Cross-Origin-Embedder-Policy: require-corp`), which SAP systems do not set.

## Consequences

### Positive

- **Playwright-native**: Uses the official `page.evaluate()` API, benefiting from
  Playwright's serialization, error handling, and cross-browser compatibility
- **No extra dependencies**: No WebSocket servers, browser extensions, or CDP clients
- **No CSP issues**: Unlike `new Function()` or inline `<script>` injection, `page.evaluate()`
  bypasses Content Security Policy because it runs in Playwright's isolated context
- **Idempotent**: The bridge checks `window.__praman_ready` before re-injecting
- **Version-aware**: 3-tier API resolution handles UI5 1.x and 2.x transparently

### Negative

- **Functions must be self-contained**: No closures, no module imports, no references to
  Node.js scope. This forces code duplication between browser scripts (suppressed via
  `sonarjs/no-identical-functions` eslint-disable)
- **Type safety is limited**: Browser-side code runs as plain JavaScript strings; TypeScript
  types are erased at compile time. Type errors in browser scripts are caught only at runtime
- **Serialization overhead**: Every call crosses the process boundary via JSON serialization.
  Complex return values (aggregations with 100+ items) incur measurable overhead
- **Unit tests give false positives**: Node.js unit tests can access module-level functions
  that would fail in the browser. Integration tests are required to catch serialization bugs

## References

- [`src/bridge/injection.ts`](https://github.com/nicolo-ribaudo/praman/blob/main/src/bridge/injection.ts) -- Node-side injection engine
- [`src/bridge/browser-scripts/inject-ui5.ts`](https://github.com/nicolo-ribaudo/praman/blob/main/src/bridge/browser-scripts/inject-ui5.ts) -- core bridge script
- [Playwright `page.evaluate()` docs](https://playwright.dev/docs/evaluating) -- official API reference
- CLAUDE.md serialization pattern -- `page.evaluate()` serialization rules
