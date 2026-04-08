---
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

:::info[Contributor Only]
The `createLogger` and `REDACTION_PATHS` APIs use internal path aliases (`#core/*`) and are only available when developing Praman itself.
End users control logging via the `PRAMAN_LOG_LEVEL` environment variable.
:::

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

#### Workaround: Use test.step() for visibility

Praman wraps operations in `test.step()` calls that appear in the trace timeline:

```typescript
await test.step('Click submit button', async () => {
  await ui5.click({ id: 'submitBtn' });
});
```

#### Workaround: Enable debug logging

Set `PRAMAN_LOG_LEVEL=debug` to get detailed bridge communication logs alongside the trace.

## OpenTelemetry Integration

Praman includes an OpenTelemetry (OTel) tracing layer for distributed observability.

:::info[Contributor Only]
The telemetry APIs below use internal path aliases (`#core/*`) and are only available when developing Praman itself. End users enable OTel via configuration (see below).
:::

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

```text
praman.bridge.inject (bridge injection)
  praman.bridge.evaluate (page.evaluate call)
praman.proxy.findControl (control discovery)
  praman.proxy.executeMethod (method invocation)
praman.auth.login (authentication)
```

## OData Request Tracing

Praman includes automatic OData network request capture that feeds the `ODataTraceReporter`. When enabled, every browser-level OData request
(XHR/fetch) is recorded with method, URL, status code, duration, and response size — no manual instrumentation needed.

### Enable automatic tracing

```typescript
// praman.config.ts
export default {
  odataTracing: {
    enabled: true,
    // Optional: add custom URL patterns beyond the defaults
    urlPatterns: ['/my-custom-service/'],
  },
};
```

Default URL patterns: `/sap/opu/odata/`, `/sap/opu/odata4/`, `/odata/v2/`, `/odata/v4/`.

### Add the reporter

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [['list'], ['playwright-praman/reporters', { outputDir: 'test-results' }]],
});
```

After the test run, find `test-results/odata-trace.json` containing:

- **Per-entity-set stats**: total calls, avg/max duration, error count, method breakdown
- **Individual traces**: every captured request with full metadata

### Reading the report

```json
{
  "totalRequests": 42,
  "totalDuration": 6300,
  "entityStats": [
    {
      "entitySet": "A_Product",
      "totalCalls": 30,
      "avgDuration": 120,
      "maxDuration": 450,
      "errorCount": 0,
      "byMethod": { "GET": 28, "POST": 2 }
    }
  ]
}
```

Use this to identify slow entity sets, excessive request counts, or high error rates.

### Manual tracing (advanced)

If you need to trace requests in specific tests without enabling the auto-fixture globally, attach trace data manually:

```typescript
import { test } from 'playwright-praman';

test('trace OData calls', async ({ page }, testInfo) => {
  const traces: { method: string; url: string; statusCode: number; duration: number }[] = [];
  const pending = new Map<object, number>();

  page.on('request', (req) => {
    if (req.url().includes('/sap/opu/odata/')) {
      pending.set(req, Date.now());
    }
  });

  page.on('response', (resp) => {
    const start = pending.get(resp.request());
    if (start !== undefined) {
      pending.delete(resp.request());
      traces.push({
        method: resp.request().method(),
        url: resp.request().url(),
        statusCode: resp.status(),
        duration: Date.now() - start,
      });
    }
  });

  // ... your test steps ...

  await testInfo.attach('odata-trace', {
    contentType: 'application/json',
    body: Buffer.from(JSON.stringify(traces)),
  });
});
```

:::tip
The auto-fixture does exactly this for you. Prefer `odataTracing: { enabled: true }` over manual tracing.
:::

### Scope limitation

Auto-tracing captures **browser-level traffic** (XHR/fetch from the SAP Fiori app running in the browser). Node-level `page.request.*` API calls
(used by `ui5.odata.createEntity()`, `ui5.odata.queryEntities()`, etc.) operate outside the browser and are not captured by the auto-fixture.

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

## Environment Variables

Praman and its examples rely on environment variables for SAP system credentials. Set them before running tests:

```bash
# .env or .env.test (gitignored — never commit credentials)
SAP_BASE_URL=https://your-sap-system.example.com
SAP_CLOUD_BASE_URL=https://your-sap-system.example.com   # alias used by seed files
SAP_CLOUD_USERNAME=your-username
SAP_CLOUD_PASSWORD=your-password
SAP_AUTH_STRATEGY=basic       # 'basic' | 'btp-saml' | 'office365'
SAP_CLIENT=100                # optional, OnPrem only
SAP_LANGUAGE=EN               # optional, default: EN
PRAMAN_LOG_LEVEL=info         # optional: 'error' | 'warn' | 'info' | 'debug' | 'trace'

# ── Praman auth config overrides ────────────────────────────────────
# PRAMAN_AUTH_BASE_URL=https://your-sap-system.example.com
# PRAMAN_AUTH_STRATEGY=basic
# PRAMAN_AUTH_USERNAME=your-username
# PRAMAN_AUTH_PASSWORD=your-password
# PRAMAN_AUTH_CLIENT=100
# PRAMAN_AUTH_LANGUAGE=EN

# ── Praman AI config overrides ──────────────────────────────────────
# PRAMAN_AI_PROVIDER=openai          # 'openai' | 'azure' | 'anthropic'
# PRAMAN_AI_API_KEY=sk-...
# PRAMAN_AI_MODEL=gpt-4o
# PRAMAN_AI_TEMPERATURE=0.3
# PRAMAN_AI_ENDPOINT=https://your-azure.openai.azure.com
# PRAMAN_AI_DEPLOYMENT=your-deployment
# PRAMAN_AI_API_VERSION=2024-02-01
# PRAMAN_AI_ANTHROPIC_API_KEY=sk-ant-...

# ── Praman telemetry overrides ──────────────────────────────────────
# PRAMAN_TELEMETRY_ENABLED=true
# PRAMAN_TELEMETRY_ENDPOINT=http://localhost:4318
# PRAMAN_TELEMETRY_SERVICE_NAME=praman-tests

# ── Praman OData tracing ───────────────────────────────────────────
# PRAMAN_ODATA_TRACING_ENABLED=true
```

### Loading .env files

Playwright does not load `.env` files automatically. Use one of these approaches:

```bash
# Option 1: dotenv-cli (recommended)
npm install -D dotenv-cli
npx dotenv -e .env -- npx playwright test

# Option 2: export in shell
export SAP_BASE_URL=https://your-sap-system.example.com
export SAP_CLOUD_USERNAME=testuser
export SAP_CLOUD_PASSWORD=secret
npx playwright test

# Option 3: inline (CI / one-off)
SAP_BASE_URL=https://host SAP_CLOUD_USERNAME=user SAP_CLOUD_PASSWORD=pw npx playwright test
```

### CI/CD secrets

In GitHub Actions, store credentials as repository secrets and pass them as environment variables:

```yaml
env:
  SAP_BASE_URL: ${{ secrets.SAP_BASE_URL }}
  SAP_CLOUD_USERNAME: ${{ secrets.SAP_CLOUD_USERNAME }}
  SAP_CLOUD_PASSWORD: ${{ secrets.SAP_CLOUD_PASSWORD }}
```

See the [Docker & CI/CD guide](./docker-cicd.md) for full pipeline examples.

## Troubleshooting Quick Reference

| Symptom                    | Error Code                 | Likely Cause                                       | Jump To                                                        |
| -------------------------- | -------------------------- | -------------------------------------------------- | -------------------------------------------------------------- |
| Bridge timeout on startup  | `ERR_BRIDGE_TIMEOUT`       | Page is not a UI5 app, or UI5 loading slowly       | [Bridge Injection Timeout](#bridge-injection-timeout)          |
| Control not found          | `ERR_CONTROL_NOT_FOUND`    | Wrong ID, control not rendered, wrong frame        | [Control Not Found](#control-not-found)                        |
| Stale object reference     | `ERR_BRIDGE_EXECUTION`     | Navigation invalidated the object map              | [Stale Object Reference](#stale-object-reference)              |
| Test hangs indefinitely    | `ERR_TIMEOUT_UI5_STABLE`   | Third-party scripts (WalkMe) block stability       | [Stability Wait Hanging](#stability-wait-hanging)              |
| Login fails                | `ERR_AUTH_FAILED`          | Wrong credentials, expired session, wrong strategy | [Auth Failures](#auth-failures)                                |
| ReferenceError in evaluate | —                          | Helper function not serialized into browser        | [page.evaluate() ReferenceError](#pageevaluate-referenceerror) |
| OData 403/404              | `ERR_ODATA_REQUEST_FAILED` | Missing CSRF token, wrong service URL              | [OData Request Tracing](#odata-request-tracing)                |
| Empty env var errors       | —                          | `.env` not loaded or variable not set              | [Environment Variables](#environment-variables)                |

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
