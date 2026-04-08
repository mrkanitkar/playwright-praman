---
title: Configuration Reference
description: 'Complete Praman configuration reference. Zod-validated config schema with defaults for SAP UI5 test automation, auth strategies, and bridge settings.'
keywords:
  - praman configuration
  - playwright sap config
  - sap ui5 test automation setup
  - playwright-praman
---

Praman uses a Zod-validated configuration system. All fields have defaults — an empty `{}` is valid.

## Config File

Create `praman.config.ts` in your project root:

```typescript
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  logLevel: 'info',
  ui5WaitTimeout: 30_000,
  controlDiscoveryTimeout: 10_000,
  interactionStrategy: 'ui5-native',
  discoveryStrategies: ['direct-id', 'recordreplay'],
  auth: {
    strategy: 'basic',
    baseUrl: process.env.SAP_CLOUD_BASE_URL!,
    username: process.env.SAP_CLOUD_USERNAME!,
    password: process.env.SAP_CLOUD_PASSWORD!,
    client: '100',
    language: 'EN',
  },
  ai: {
    provider: 'azure-openai',
    apiKey: process.env.AZURE_OPENAI_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deployment: 'gpt-4o',
  },
  telemetry: {
    openTelemetry: true,
    exporter: 'otlp',
    endpoint: 'http://localhost:4318',
    serviceName: 'sap-e2e-tests',
    metrics: true,
  },
});
```

## Top-Level Options

| Field                     | Type                                                  | Default                         | Description                                          |
| ------------------------- | ----------------------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| `logLevel`                | `'error' \| 'warn' \| 'info' \| 'debug' \| 'verbose'` | `'info'`                        | Pino log level                                       |
| `ui5WaitTimeout`          | `number`                                              | `30_000`                        | Max ms to wait for UI5 stability                     |
| `controlDiscoveryTimeout` | `number`                                              | `10_000`                        | Max ms for control discovery                         |
| `interactionStrategy`     | `'ui5-native' \| 'dom-first' \| 'opa5'`               | `'ui5-native'`                  | How to interact with controls                        |
| `discoveryStrategies`     | `string[]`                                            | `['direct-id', 'recordreplay']` | Ordered strategy chain                               |
| `skipStabilityWait`       | `boolean`                                             | `false`                         | Skip `waitForUI5Stable()`, use brief DOM settle      |
| `preferVisibleControls`   | `boolean`                                             | `true`                          | Prefer visible controls over hidden ones             |
| `ignoreAutoWaitUrls`      | `string[]`                                            | `[]`                            | Additional URL patterns to block (WalkMe, analytics) |

## Auth Sub-Schema

| Field      | Type                                               | Default    | Description             |
| ---------- | -------------------------------------------------- | ---------- | ----------------------- |
| `strategy` | `'btp-saml' \| 'basic' \| 'office365' \| 'custom'` | `'basic'`  | Authentication strategy |
| `baseUrl`  | `string` (URL)                                     | _required_ | SAP system base URL     |
| `username` | `string`                                           | —          | Login username          |
| `password` | `string`                                           | —          | Login password          |
| `client`   | `string`                                           | `'100'`    | SAP client number       |
| `language` | `string`                                           | `'EN'`     | SAP logon language      |

## AI Sub-Schema

| Field             | Type                                        | Default          | Description                                          |
| ----------------- | ------------------------------------------- | ---------------- | ---------------------------------------------------- |
| `provider`        | `'azure-openai' \| 'openai' \| 'anthropic'` | `'azure-openai'` | LLM provider                                         |
| `apiKey`          | `string`                                    | —                | OpenAI / Azure OpenAI API key                        |
| `anthropicApiKey` | `string`                                    | —                | Anthropic API key (separate for security)            |
| `model`           | `string`                                    | —                | Model name (e.g., `'gpt-4o'`, `'claude-sonnet-4-6'`) |
| `temperature`     | `number`                                    | `0.3`            | LLM temperature (0-2)                                |
| `maxTokens`       | `number`                                    | —                | Max tokens per response                              |
| `endpoint`        | `string` (URL)                              | —                | Azure OpenAI resource endpoint                       |
| `deployment`      | `string`                                    | —                | Azure OpenAI deployment name                         |
| `apiVersion`      | `string`                                    | —                | Azure API version                                    |

## Telemetry Sub-Schema

Telemetry is disabled by default with zero overhead. See [Telemetry Setup](./telemetry) for the full guide.

| Field                | Type                                    | Default               | Description                                          |
| -------------------- | --------------------------------------- | --------------------- | ---------------------------------------------------- |
| `openTelemetry`      | `boolean`                               | `false`               | Enable OpenTelemetry tracing                         |
| `exporter`           | `'otlp' \| 'azure-monitor' \| 'jaeger'` | `'otlp'`              | Trace exporter                                       |
| `endpoint`           | `string` (URL)                          | —                     | OTLP/Jaeger endpoint URL (required when enabled)     |
| `serviceName`        | `string`                                | `'playwright-praman'` | Service name in traces                               |
| `protocol`           | `'http' \| 'grpc'`                      | `'http'`              | OTel transport protocol                              |
| `metrics`            | `boolean`                               | `false`               | Enable metric counters and histograms                |
| `batchTimeout`       | `number`                                | `5000`                | Span batch export timeout (ms)                       |
| `maxQueueSize`       | `number`                                | `2048`                | Max queued spans before dropping                     |
| `resourceAttributes` | `Record<string, string>`                | `{}`                  | Additional OTel resource attributes                  |
| `connectionString`   | `string`                                | —                     | Azure Monitor connection string (required for Azure) |

## Selectors Sub-Schema

| Field                   | Type      | Default  | Description                       |
| ----------------------- | --------- | -------- | --------------------------------- |
| `defaultTimeout`        | `number`  | `10_000` | Default selector timeout (ms)     |
| `preferVisibleControls` | `boolean` | `true`   | Prefer visible controls           |
| `skipStabilityWait`     | `boolean` | `false`  | Skip stability wait for selectors |

## OPA5 Sub-Schema

| Field                | Type      | Default | Description                   |
| -------------------- | --------- | ------- | ----------------------------- |
| `interactionTimeout` | `number`  | `5_000` | OPA5 interaction timeout (ms) |
| `autoWait`           | `boolean` | `true`  | Auto-wait for OPA5 readiness  |
| `debug`              | `boolean` | `false` | Enable OPA5 debug mode        |

## Timeout Precedence

When multiple timeout values could apply, Praman uses this precedence (highest first):

1. **Per-call options** — `ui5.control({ id: 'x' }, { timeout: 5000 })`
2. **Top-level config** — `controlDiscoveryTimeout: 10000`
3. **Selectors section** — `selectors.defaultTimeout: 10000` (fallback if top-level not set)
4. **Built-in default** — 10,000ms

We recommend using only `controlDiscoveryTimeout` at the top level.
`selectors.defaultTimeout` exists for backward compatibility and will be
removed in a future major version.

For details on the 3-tier stability wait system, see
[Stability & Timing](./stability-timing.md).

## Environment Variable Overrides

Top-level config fields can be overridden via environment variables:

| Environment Variable               | Config Field              |
| ---------------------------------- | ------------------------- |
| `PRAMAN_LOG_LEVEL`                 | `logLevel`                |
| `PRAMAN_UI5_WAIT_TIMEOUT`          | `ui5WaitTimeout`          |
| `PRAMAN_CONTROL_DISCOVERY_TIMEOUT` | `controlDiscoveryTimeout` |
| `PRAMAN_INTERACTION_STRATEGY`      | `interactionStrategy`     |
| `PRAMAN_SKIP_STABILITY_WAIT`       | `skipStabilityWait`       |

**General config precedence** (highest to lowest):

1. Per-call options (e.g., `ui5.control({ ... }, { timeout: 5000 })`)
2. Environment variable overrides
3. Top-level config
4. Schema defaults

## Complete `playwright.config.ts` Example

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [
    ['html', { open: 'never' }],
    ['playwright-praman/reporters', { type: 'compliance', outputDir: 'reports' }],
  ],
  use: {
    baseURL: process.env.SAP_CLOUD_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth-setup\.ts/,
      teardown: 'teardown',
    },
    {
      name: 'teardown',
      testMatch: /auth-teardown\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
      },
    },
  ],
});
```

## Validation

Config is validated with Zod at load time. Invalid config fails fast:

<!-- docs-verify:no-run -->

```typescript
import { loadConfig } from 'playwright-praman';

const config = await loadConfig();
// Throws ConfigError with ERR_CONFIG_INVALID if schema fails
// Returns Readonly<PramanConfig> — deeply frozen, mutation throws
```
