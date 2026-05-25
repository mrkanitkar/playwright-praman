---
title: Reporters
---

Praman ships three custom Playwright reporters: **ComplianceReporter** for measuring Praman
adoption across your test suite, **ODataTraceReporter** for capturing OData HTTP request
performance data, and **ControlTreeReporter** for recording UI5 control tree snapshots during
test runs.

## ComplianceReporter

Tracks whether test steps use Praman abstractions (`ui5.click()`, `ui5Navigation.*`) versus
raw Playwright calls (`page.click()`, `page.fill()`). Generates a compliance report with
per-test and aggregate statistics.

### Configuration

<!-- docs-verify:no-run -->

```typescript
// playwright.config.ts
import { ComplianceReporter } from 'playwright-praman/reporters';

export default {
  reporter: [['html'], [ComplianceReporter, { outputDir: 'reports' }]],
};
```

### Output

The reporter writes `compliance-report.json` to the configured `outputDir`:

```json
{
  "summary": {
    "totalTests": 45,
    "compliantTests": 38,
    "rawPlaywrightTests": 3,
    "mixedTests": 4,
    "compliancePercentage": 84.4
  },
  "tests": [
    {
      "title": "create purchase order",
      "file": "tests/procurement/create-po.spec.ts",
      "status": "compliant",
      "pramanSteps": 12,
      "rawSteps": 0
    },
    {
      "title": "legacy login flow",
      "file": "tests/auth/login.spec.ts",
      "status": "raw-playwright",
      "pramanSteps": 0,
      "rawSteps": 5
    },
    {
      "title": "mixed operations",
      "file": "tests/mixed/hybrid.spec.ts",
      "status": "mixed",
      "pramanSteps": 8,
      "rawSteps": 2
    }
  ]
}
```

### Test Status Categories

| Status           | Meaning                                      |
| ---------------- | -------------------------------------------- |
| `compliant`      | All steps use Praman abstractions            |
| `raw-playwright` | All steps use raw Playwright calls           |
| `mixed`          | Some Praman steps, some raw Playwright steps |

### Step Detection

The reporter recognizes 50+ Praman step prefixes to classify steps:

- `UI5Handler >` — core control operations
- `ui5.table.` — table operations
- `ui5.dialog.` — dialog operations
- `ui5.date.` — date/time operations
- `ui5.odata.` — OData operations
- `ui5Navigation.` — navigation operations
- `sapAuth.` — authentication operations
- `fe.listReport.` / `fe.objectPage.` — Fiori Elements helpers
- `pramanAI.` — AI operations
- `intent.` — domain intent operations

Any step not matching these prefixes is classified as a raw Playwright step.

### Use Case: Migration Tracking

If your team is migrating from raw Playwright to Praman, run the ComplianceReporter in CI to
track progress:

<!-- docs-verify:no-run -->

```typescript
// CI assertion (optional)
import report from './reports/compliance-report.json';

if (report.summary.compliancePercentage < 80) {
  console.warn(`Compliance at ${report.summary.compliancePercentage}% — target is 80%`);
}
```

## ODataTraceReporter

Captures OData HTTP request traces from test runs, providing per-entity-set statistics including
call counts, durations, and error rates.

### Configuration

<!-- docs-verify:no-run -->

```typescript
// playwright.config.ts
import { ODataTraceReporter } from 'playwright-praman/reporters';

export default {
  reporter: [['html'], [ODataTraceReporter, { outputDir: 'reports' }]],
};
```

### Output

The reporter writes `odata-trace.json` to the configured `outputDir`:

```json
{
  "traces": [
    {
      "method": "GET",
      "url": "/sap/opu/odata/sap/API_PO_SRV/PurchaseOrders?$top=20&$filter=Status eq 'A'",
      "entitySet": "PurchaseOrders",
      "queryParams": {
        "$top": "20",
        "$filter": "Status eq 'A'"
      },
      "status": 200,
      "duration": 340,
      "size": 12480,
      "isBatch": false
    }
  ],
  "aggregates": {
    "PurchaseOrders": {
      "GET": { "count": 12, "avgDuration": 340, "maxDuration": 1200, "errors": 0 },
      "POST": { "count": 2, "avgDuration": 890, "maxDuration": 1100, "errors": 0 }
    },
    "Vendors": {
      "GET": { "count": 3, "avgDuration": 120, "maxDuration": 200, "errors": 0 }
    }
  },
  "totalRequests": 18,
  "totalErrors": 0,
  "totalDuration": 8400
}
```

### URL Parsing

The reporter automatically extracts entity set names and query parameters from OData URLs:

| URL Pattern                                          | Extracted Entity Set |
| ---------------------------------------------------- | -------------------- |
| `/sap/opu/odata/sap/SRV/PurchaseOrders`              | `PurchaseOrders`     |
| `/sap/opu/odata/sap/SRV/PurchaseOrders('123')`       | `PurchaseOrders`     |
| `/sap/opu/odata/sap/SRV/PurchaseOrders('123')/Items` | `Items`              |
| `/sap/opu/odata/sap/SRV/$batch`                      | `$batch`             |

### Use Case: Performance Analysis

Identify slow or frequently called entity sets:

```typescript
import trace from './reports/odata-trace.json';

// Find entity sets with high error rates
for (const [entitySet, methods] of Object.entries(trace.aggregates)) {
  for (const [method, stats] of Object.entries(methods)) {
    if (stats.errors > 0) {
      console.warn(`${method} ${entitySet}: ${stats.errors} errors out of ${stats.count} calls`);
    }
    if (stats.avgDuration > 1000) {
      console.warn(`${method} ${entitySet}: avg ${stats.avgDuration}ms — consider optimization`);
    }
  }
}
```

## Using Both Reporters Together

Both reporters can run alongside Playwright's built-in reporters:

<!-- docs-verify:no-run -->

```typescript
// playwright.config.ts
import { ComplianceReporter, ODataTraceReporter } from 'playwright-praman/reporters';

export default {
  reporter: [
    ['html'],
    ['json', { outputFile: 'reports/results.json' }],
    [ComplianceReporter, { outputDir: 'reports' }],
    [ODataTraceReporter, { outputDir: 'reports' }],
  ],
};
```

After a test run, the `reports/` directory contains:

```text
reports/
  ├── compliance-report.json   ← Praman adoption metrics
  ├── odata-trace.json         ← OData performance data
  └── results.json             ← Playwright test results
```

## Reporter Lifecycle

Both reporters implement Playwright's `Reporter` interface:

- `onBegin()` — initialization, create output directory
- `onTestEnd()` — process test steps and attachments
- `onError()` — capture worker-level errors _(ODataTraceReporter only, Playwright 1.60+)_
- `onEnd()` — aggregate data, write JSON output

They run passively alongside tests — no test code changes are needed. Add them to
`playwright.config.ts` and they start collecting data on the next test run.

### ODataTraceReporter: onError Hook

:::note Added in v1.3.0
:::

The OData trace reporter implements Playwright's `onError(error, workerInfo)` hook
to capture worker-level errors — runtime failures or fixture teardown errors that occur
outside individual test boundaries.

When triggered, the reporter logs the error at `debug` level with worker context:

```json
{
  "err": "TypeError: Cannot read properties of undefined",
  "workerIndex": 0,
  "parallelIndex": 2
}
```

The `workerInfo` parameter (containing `workerIndex` and `parallelIndex`) is available
on Playwright 1.60+. On older versions the hook still fires but `workerInfo` is `undefined`.

This is useful for diagnosing errors that don't surface in individual test results —
for example, a shared fixture that fails during teardown after all tests in a worker
have completed.
