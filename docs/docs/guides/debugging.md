---
sidebar_position: 28
title: 'Debugging & Troubleshooting'
---

# Debugging & Troubleshooting

This guide covers Praman's debugging tools, log configuration, trace viewer integration, and solutions to common issues.

## Pino Log Levels

Praman uses [pino](https://github.com/pinojs/pino) for structured JSON logging with child loggers per module and correlation IDs.

### Configuring Log Levels

```typescript
// praman.config.ts
export default {
  logLevel: 'debug', // 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
};
```

Or via environment variable:

```bash
PRAMAN_LOG_LEVEL=debug npx playwright test
```

### Log Level Guide

| Level   | Use When                                             |
| ------- | ---------------------------------------------------- |
| `fatal` | Production -- only unrecoverable errors              |
| `error` | Default -- errors and failures only                  |
| `warn`  | Investigating intermittent issues                    |
| `info`  | Monitoring test execution flow                       |
| `debug` | Developing or debugging bridge/proxy issues          |
| `trace` | Full diagnostic output including serialized payloads |

### Creating Module Loggers

```typescript
import { createLogger } from '#core/logging/index.js';

const logger = createLogger('my-module');
logger.info({ selector }, 'Finding control');
logger.debug({ result }, 'Control found');
logger.error({ err }, 'Control not found');
```

### Secret Redaction

Pino is configured with redaction paths to prevent secrets from appearing in logs:

```typescript
import { REDACTION_PATHS } from '#core/logging/index.js';

// Redacted paths include:
// - password, apiKey, token, secret, authorization
// - Nested paths: *.password, config.ai.apiKey, etc.
```

## Playwright Trace Viewer

Enable trace capture in `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    trace: 'retain-on-failure', // or 'on' for all tests
  },
});
```

### Viewing Traces

```bash
# After a test failure
npx playwright show-trace test-results/my-test/trace.zip

# Or open the HTML report which includes traces
npx playwright show-report
```

### Trace Viewer Limitations with Bridge page.evaluate()

The Playwright trace viewer has limitations when debugging bridge operations:

1. **page.evaluate() calls appear as opaque steps.** The trace shows that `page.evaluate()` was called but does not show the JavaScript executed inside the browser context.

2. **Bridge injection is not visible.** The bridge setup script runs via `page.evaluate()` or `addInitScript()`, which appear as single steps without internal detail.

3. **UI5 control state is not captured.** The trace viewer captures DOM snapshots but not UI5's in-memory control tree, bindings, or model data.

**Workaround: Use test.step() for visibility**

Praman wraps operations in `test.step()` calls that appear in the trace timeline:

```typescript
await test.step('Click submit button', async () => {
  await ui5.click({ id: 'submitBtn' });
});
```

**Workaround: Enable debug logging**

Set `PRAMAN_LOG_LEVEL=debug` to get detailed bridge communication logs alongside the trace.

## OpenTelemetry Integration

Praman includes an OpenTelemetry (OTel) tracing layer for distributed observability:

```typescript
import { initTelemetry, getNoOpTracer } from '#core/telemetry/index.js';
import { createSpanName, spanAttributes } from '#core/telemetry/index.js';
```

### 4-Layer Observability Stack

| Layer | Tool                    | Purpose                                        |
| ----- | ----------------------- | ---------------------------------------------- |
| L1    | Playwright Reporter API | Test events via `test.step()`                  |
| L2    | pino structured logging | JSON logs with correlation IDs                 |
| L3    | OpenTelemetry (opt-in)  | Spans for bridge/proxy/auth operations         |
| L4    | AI Agent Telemetry      | Capability introspection, deterministic replay |

### OTel Configuration

OTel is zero-overhead when disabled (NoOp tracer). To enable:

```typescript
// praman.config.ts
export default {
  telemetry: {
    enabled: true,
    serviceName: 'praman-tests',
    exporter: 'otlp', // or 'jaeger', 'azure-monitor'
    endpoint: 'http://localhost:4317',
  },
};
```

Spans are created for key operations:

```
praman.bridge.inject (bridge injection)
  praman.bridge.evaluate (page.evaluate call)
praman.proxy.findControl (control discovery)
  praman.proxy.executeMethod (method invocation)
praman.auth.login (authentication)
```

## Error Introspection: toUserMessage() and toAIContext()

Every `PramanError` provides two introspection methods:

### toUserMessage()

Human-readable error summary for terminal output:

```typescript
try {
  await ui5.click({ id: 'nonExistentBtn' });
} catch (error) {
  if (error instanceof PramanError) {
    console.error(error.toUserMessage());
    // Output:
    // [ERR_CONTROL_NOT_FOUND] Control not found: nonExistentBtn
    // Attempted: Find control with selector: {"id":"nonExistentBtn"}
    // Suggestions:
    //   - Verify the control ID exists in the UI5 view
    //   - Check if the page has fully loaded (waitForUI5Stable)
    //   - Try using controlType + properties instead of ID
  }
}
```

### toAIContext()

Machine-readable structured context for AI agents:

```typescript
const context = error.toAIContext();
// {
//   code: 'ERR_CONTROL_NOT_FOUND',
//   message: 'Control not found: nonExistentBtn',
//   attempted: 'Find control with selector: {"id":"nonExistentBtn"}',
//   retryable: true,
//   severity: 'error',
//   details: { selector: { id: 'nonExistentBtn' }, timeout: 30000 },
//   suggestions: ['Verify the control ID exists...', ...],
//   timestamp: '2026-02-23T10:30:00.000Z',
// }
```

### toJSON()

Full serialization for logging and persistence:

```typescript
const serialized = error.toJSON();
// Includes all fields from toAIContext() plus stack trace
```

## Common Issues and Resolutions

### Bridge Injection Timeout

**Symptom:** `BridgeError: ERR_BRIDGE_TIMEOUT` during test startup.

**Causes and fixes:**

- The page is not a UI5 application. Verify the URL loads a page with `sap.ui.require`.
- UI5 is loading slowly. Increase `controlDiscoveryTimeout` in config.
- A CSP (Content Security Policy) blocks `page.evaluate()`. Check browser console for CSP violations.

```typescript
// Increase timeout
export default {
  controlDiscoveryTimeout: 60_000, // 60 seconds
};
```

### Control Not Found

**Symptom:** `ControlError: ERR_CONTROL_NOT_FOUND`

**Causes and fixes:**

- The control has not rendered yet. Add `await ui5.waitForUI5()` before the operation.
- The control ID is wrong. Use the UI5 Diagnostics tool (`Ctrl+Alt+Shift+S` in the browser) to inspect control IDs.
- The control is inside a different frame (WorkZone). Ensure the page reference points to the correct frame.
- The control is hidden. Check `preferVisibleControls` config setting.

### Stale Object Reference

**Symptom:** `Error: Object not found for UUID: xxx-xxx`

**Causes and fixes:**

- The browser-side object was evicted by TTL cleanup. Reduce test step duration or increase TTL.
- A page navigation invalidated the object map. Re-discover the object after navigation.

```typescript
// After navigation, objects from the previous page are gone
await page.goto('/newPage');
await ui5.waitForUI5();
// Re-discover objects on the new page
const model = await ui5.control({ id: 'myControl' });
```

### Stability Wait Hanging

**Symptom:** Test hangs on `waitForUI5Stable()`.

**Causes and fixes:**

- A third-party overlay (WalkMe, analytics) keeps sending HTTP requests. Use `skipStabilityWait`:

```typescript
// Global config
export default {
  skipStabilityWait: true,
};

// Per-selector override
await ui5.click({ id: 'submitBtn' }, { skipStabilityWait: true });
```

### Auth Failures

**Symptom:** `AuthError: ERR_AUTH_FAILED`

**Causes and fixes:**

- Credentials are expired or wrong. Check `SAP_CLOUD_USERNAME` and `SAP_CLOUD_PASSWORD` env vars.
- The auth strategy does not match the system. SAP BTP uses SAML; on-premise may use Basic auth.
- Storage state is stale. Delete `.auth/` directory and re-run:

```bash
rm -rf .auth/
npx playwright test --project=setup
```

### page.evaluate() ReferenceError

**Symptom:** `ReferenceError: functionName is not defined` in browser console.

**Cause:** A module-level helper function was referenced inside `page.evaluate()`. Only inner functions are serialized.

**Fix:** Move the helper function inside the `page.evaluate()` callback. See the [Bridge Internals](./bridge-internals.md) guide for the detailed explanation of this serialization constraint.

## Debug Checklist

When a test fails, follow this diagnostic sequence:

1. **Read the error message.** Praman errors include `code`, `attempted`, and `suggestions[]`.
2. **Check the Playwright trace.** Run `npx playwright show-report` and open the trace for the failed test.
3. **Enable debug logging.** Set `PRAMAN_LOG_LEVEL=debug` and re-run the test.
4. **Inspect UI5 diagnostics.** Open the app in a browser and press `Ctrl+Alt+Shift+S` to see the UI5 control tree.
5. **Verify bridge injection.** In the browser console, check `window.__praman_bridge.ready` and `window.__praman_bridge.ui5Version`.
6. **Check the frame.** For WorkZone apps, ensure you are operating on the app frame, not the shell frame.
7. **Review OData traces.** If using the OData trace reporter, check `odata-trace.json` for failed HTTP calls.
