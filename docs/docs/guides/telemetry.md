---
sidebar_label: 'Telemetry Setup'
sidebar_position: 56
title: Telemetry Setup
description: 'Enable OpenTelemetry tracing and metrics in playwright-praman for distributed observability of SAP UI5 test execution.'
keywords:
  - playwright praman telemetry
  - opentelemetry sap testing
  - jaeger playwright
  - azure monitor playwright
  - test observability
---

# Telemetry Setup

Praman includes full OpenTelemetry (OTel) tracing and metrics for distributed observability of SAP UI5 test execution.

**Telemetry is disabled by default with zero overhead.** When disabled, all operations use lightweight NoOp wrappers — no OTel SDK is loaded, no network calls are made. Enable it only when you need end-to-end visibility.

## Quick Start

Get spans flowing to a local Jaeger instance in under 2 minutes:

```bash
# 1. Install OTel dependencies (one-time)
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http

# 2. Start Jaeger
docker compose -f docs/docker-compose.otel.yml up -d

# 3. Run tests with telemetry enabled
PRAMAN_TELEMETRY_ENABLED=true \
PRAMAN_TELEMETRY_ENDPOINT=http://localhost:4318 \
npx playwright test

# 4. View spans in Jaeger UI
open http://localhost:16686
```

## Enabling and Disabling

### Via environment variables

```bash
# Enable tracing
PRAMAN_TELEMETRY_ENABLED=true
PRAMAN_TELEMETRY_ENDPOINT=http://localhost:4318

# Also enable metrics
PRAMAN_TELEMETRY_METRICS_ENABLED=true

# Disable (default)
PRAMAN_TELEMETRY_ENABLED=false
```

### Via config file

```typescript
// praman.config.ts
export default {
  telemetry: {
    openTelemetry: true,
    endpoint: 'http://localhost:4318',
    metrics: true,
    exporter: 'otlp',
    serviceName: 'my-sap-tests',
  },
};
```

Environment variables override config file values. If neither is set, telemetry stays disabled.

## Configuration Reference

### Environment Variables

| Variable                             | Type    | Default             | Description                                       |
| ------------------------------------ | ------- | ------------------- | ------------------------------------------------- |
| `PRAMAN_TELEMETRY_ENABLED`           | boolean | `false`             | Enable OpenTelemetry tracing                      |
| `PRAMAN_TELEMETRY_ENDPOINT`          | string  | —                   | OTLP/Jaeger collector URL (required when enabled) |
| `PRAMAN_TELEMETRY_SERVICE_NAME`      | string  | `playwright-praman` | Service name in spans                             |
| `PRAMAN_TELEMETRY_EXPORTER`          | string  | `otlp`              | Exporter: `otlp`, `jaeger`, `azure-monitor`       |
| `PRAMAN_TELEMETRY_PROTOCOL`          | string  | `http`              | Transport: `http` or `grpc`                       |
| `PRAMAN_TELEMETRY_METRICS_ENABLED`   | boolean | `false`             | Enable metric counters and histograms             |
| `PRAMAN_TELEMETRY_BATCH_TIMEOUT`     | number  | `5000`              | Span batch export timeout (ms)                    |
| `PRAMAN_TELEMETRY_MAX_QUEUE_SIZE`    | number  | `2048`              | Max queued spans before dropping                  |
| `PRAMAN_TELEMETRY_CONNECTION_STRING` | string  | —                   | Azure Monitor connection string                   |

### Config File Fields

| Field                | Type                                    | Default               | Description                                   |
| -------------------- | --------------------------------------- | --------------------- | --------------------------------------------- |
| `openTelemetry`      | `boolean`                               | `false`               | Enable tracing                                |
| `exporter`           | `'otlp' \| 'jaeger' \| 'azure-monitor'` | `'otlp'`              | Trace exporter                                |
| `endpoint`           | `string` (URL)                          | —                     | Collector endpoint (required for OTLP/Jaeger) |
| `serviceName`        | `string`                                | `'playwright-praman'` | Service name in spans                         |
| `protocol`           | `'http' \| 'grpc'`                      | `'http'`              | Transport protocol                            |
| `metrics`            | `boolean`                               | `false`               | Enable metrics                                |
| `batchTimeout`       | `number`                                | `5000`                | Batch export timeout (ms)                     |
| `maxQueueSize`       | `number`                                | `2048`                | Max span queue size                           |
| `resourceAttributes` | `Record<string, string>`                | `{}`                  | Additional OTel resource attributes           |
| `connectionString`   | `string`                                | —                     | Azure Monitor connection string               |

## Exporter Setup

### OTLP (default)

Works with any OTLP-compatible collector: Jaeger, Grafana Tempo, Honeycomb, Datadog, etc.

```bash
PRAMAN_TELEMETRY_ENABLED=true
PRAMAN_TELEMETRY_ENDPOINT=http://localhost:4318    # OTLP HTTP port
PRAMAN_TELEMETRY_EXPORTER=otlp
```

**No authentication required** for local collectors. For hosted services, configure auth via the collector's own environment variables (e.g., `OTEL_EXPORTER_OTLP_HEADERS`).

### Jaeger

Jaeger accepts OTLP natively (since Jaeger 1.35+). Uses the same OTLP exporter under the hood.

```bash
PRAMAN_TELEMETRY_ENABLED=true
PRAMAN_TELEMETRY_ENDPOINT=http://localhost:4318
PRAMAN_TELEMETRY_EXPORTER=jaeger
```

For local development, use the included Docker Compose:

```bash
docker compose -f docs/docker-compose.otel.yml up -d
# Jaeger UI: http://localhost:16686
# OTLP receiver: http://localhost:4318
```

### Azure Monitor

Azure Monitor uses a **connection string** (not a URL endpoint). Find it in the Azure Portal:

**Azure Portal** > **Application Insights** > your resource > **Properties** > **Connection String**

The format is: `InstrumentationKey=<guid>;IngestionEndpoint=https://<region>.in.applicationinsights.azure.com`

```bash
PRAMAN_TELEMETRY_ENABLED=true
PRAMAN_TELEMETRY_EXPORTER=azure-monitor
PRAMAN_TELEMETRY_CONNECTION_STRING="InstrumentationKey=abc-123-def;IngestionEndpoint=https://eastus.in.applicationinsights.azure.com"
```

Or in config:

```typescript
export default {
  telemetry: {
    openTelemetry: true,
    exporter: 'azure-monitor',
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
};
```

:::warning
The Azure Monitor exporter (`@azure/monitor-opentelemetry-exporter`) is currently in **beta**. Pin your version and test upgrades carefully.
:::

## Dependency Matrix

Only install the packages you need:

| Feature                     | Required packages                                                                        |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| **Tracing (OTLP/Jaeger)**   | `@opentelemetry/api` `@opentelemetry/sdk-node` `@opentelemetry/exporter-trace-otlp-http` |
| **Tracing (Azure Monitor)** | `@opentelemetry/api` `@opentelemetry/sdk-node` `@azure/monitor-opentelemetry-exporter`   |
| **Metrics (OTLP)**          | Above + `@opentelemetry/sdk-metrics` `@opentelemetry/exporter-metrics-otlp-http`         |
| **Metrics (Azure Monitor)** | Above + `@opentelemetry/sdk-metrics` `@azure/monitor-opentelemetry-exporter`             |

All packages are **optional peer dependencies** — they are not installed with `npm install playwright-praman`. Install them only when enabling telemetry.

```bash
# Tracing only (most common)
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http

# Tracing + Metrics
npm install @opentelemetry/api @opentelemetry/sdk-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/sdk-metrics @opentelemetry/exporter-metrics-otlp-http
```

## Metrics

When `metrics: true`, Praman records these instruments:

### Counters

| Metric                     | Description                        |
| -------------------------- | ---------------------------------- |
| `praman.test.pass`         | Tests passed                       |
| `praman.test.fail`         | Tests failed (including timed out) |
| `praman.test.skip`         | Tests skipped                      |
| `praman.control.discovery` | Control discovery attempts         |
| `praman.bridge.injection`  | Bridge injection attempts          |

### Histograms

| Metric                              | Unit | Description                       |
| ----------------------------------- | ---- | --------------------------------- |
| `praman.test.duration`              | ms   | Test execution duration           |
| `praman.control.discovery.duration` | ms   | Control discovery duration        |
| `praman.bridge.evaluation.duration` | ms   | Bridge `page.evaluate()` duration |

Metrics are recorded in both the **fixture layer** (discovery, bridge) and the **OTel reporter** (test pass/fail/skip/duration).

## OTel Reporter

The `OTelReporter` is a Playwright reporter that emits spans for the test lifecycle. It runs in the reporter process (separate from test workers).

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [
    [
      'playwright-praman/reporters',
      {
        otel: true,
        endpoint: 'http://localhost:4318',
      },
    ],
  ],
});
```

The reporter creates nested spans:

```text
test.run ("should create purchase order")
  hook: "auth.setup"
  fixture: "ui5"
  test.step: "Fill header fields"
    pw:api: "locator.click"
    expect: "expect.toBeVisible"
  test.step: "Save document"
```

Each span includes attributes: `praman.test.title`, `praman.test.file`, `praman.step.category`, `praman.step.title`.

## Performance

| State                  | Overhead                                                                 |
| ---------------------- | ------------------------------------------------------------------------ |
| **Disabled** (default) | Zero — NoOp wrappers are empty functions, no SDK loaded                  |
| **Tracing enabled**    | ~50-100ms SDK init (once), microseconds per span, batched network export |
| **Metrics enabled**    | Negligible — in-memory counters flushed periodically                     |
| **Reporter enabled**   | Minimal — spans created per test/step in reporter process                |

Telemetry does **not** affect test execution timing. Span export is batched and asynchronous — it happens in the background after spans are created.

To tune for large test suites, adjust `batchTimeout` and `maxQueueSize`:

```bash
PRAMAN_TELEMETRY_BATCH_TIMEOUT=10000    # 10s batch window
PRAMAN_TELEMETRY_MAX_QUEUE_SIZE=4096    # larger queue
```

## Troubleshooting

### `ERR_TELEMETRY_PEER_DEP_MISSING`

**Cause:** Telemetry is enabled but required OTel packages are not installed.

**Fix:** Install the missing package shown in the error message:

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http
```

### `ERR_TELEMETRY_INIT_FAILED`

**Cause:** OTel SDK failed to initialize (e.g., invalid configuration, unreachable endpoint).

**Fix:**

- Verify the endpoint URL is correct and reachable: `curl http://localhost:4318/v1/traces`
- Check that the collector is running: `docker ps`
- Ensure `PRAMAN_TELEMETRY_ENDPOINT` is a valid URL

### `ERR_TELEMETRY_EXPORTER_FAILED`

**Cause:** The trace or metric exporter failed to initialize.

**Fix:**

- For OTLP: verify the endpoint URL
- For Azure Monitor: verify the connection string format (`InstrumentationKey=...;IngestionEndpoint=...`)
- Check that the correct exporter package is installed

### `ERR_TELEMETRY_SHUTDOWN_FAILED`

**Cause:** OTel SDK failed to flush and shut down cleanly.

**Fix:** Usually transient — pending exports timed out. Increase `batchTimeout` if this happens frequently.

### `ERR_TELEMETRY_METRICS_INIT_FAILED`

**Cause:** Metric SDK initialization failed.

**Fix:** Ensure `@opentelemetry/sdk-metrics` is installed and the exporter is configured correctly.

### Validation error: endpoint required

**Cause:** `openTelemetry: true` is set but no endpoint (or connectionString for Azure) is provided.

**Fix:** Add the endpoint:

```bash
PRAMAN_TELEMETRY_ENDPOINT=http://localhost:4318
# or for Azure Monitor:
PRAMAN_TELEMETRY_CONNECTION_STRING="InstrumentationKey=..."
```

### No spans appearing in Jaeger

1. Verify Jaeger is running: `docker ps | grep jaeger`
2. Check that `COLLECTOR_OTLP_ENABLED=true` is set (included in `docker-compose.otel.yml`)
3. Verify the endpoint port is 4318 (HTTP), not 4317 (gRPC)
4. Check Praman logs for telemetry initialization messages: `PRAMAN_LOG_LEVEL=debug`
