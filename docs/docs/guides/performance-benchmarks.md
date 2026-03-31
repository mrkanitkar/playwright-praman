---
title: Performance Benchmarks
---

# Performance Benchmarks (PERF-BENCH)

Performance targets, measurement methodology, and regression detection for Praman's core
operations. Every bridge call, discovery operation, and proxy interaction has a baseline
budget. CI enforces these budgets to prevent performance regressions.

## Baseline Targets

| Operation             | Target    | Measured At                            |
| --------------------- | --------- | -------------------------------------- |
| Bridge injection      | < 500 ms  | `page.evaluate()` for UI5 bridge setup |
| Control discovery     | < 200 ms  | Single control lookup by ID            |
| Method call (proxy)   | < 100 ms  | `control.getValue()` round-trip        |
| Proxy creation        | < 50 ms   | `new Proxy()` wrapper instantiation    |
| Stability convergence | < 2000 ms | `waitForUI5Stable()` full cycle        |

These targets represent p95 values on a standard CI runner (GitHub Actions `ubuntu-latest`,
4 vCPU, 16 GB RAM). Local development machines may see faster times. SAP system latency
(network round-trip to the actual backend) is excluded -- these measure only the Praman
framework overhead.

### Why These Numbers

- **Bridge injection (500 ms)**: The bridge injects ~2 KB of JavaScript via `page.evaluate()`.
  500 ms accounts for CDP round-trip, V8 compilation, and UI5 runtime handshake. First
  injection is slower than subsequent calls because V8 must compile the script.

- **Control discovery (200 ms)**: Discovery uses a multi-strategy chain (cache hit, direct ID
  lookup, RecordReplay, registry scan). Cache hits resolve in < 10 ms. The 200 ms budget
  covers a cold registry scan -- the worst case.

- **Method call (100 ms)**: Each proxy method call serializes arguments, executes
  `page.evaluate()`, and deserializes the result. 100 ms covers the CDP round-trip plus UI5
  control method execution.

- **Proxy creation (50 ms)**: Creating a JavaScript `Proxy` object is a pure Node.js operation
  with no browser round-trip. The 50 ms budget covers type resolution, method blacklist
  validation, and handler setup.

- **Stability convergence (2000 ms)**: `waitForUI5Stable()` polls the UI5 runtime for pending
  requests, timeouts, and animations. 2000 ms is the maximum wait before the three-tier
  timeout ladder escalates. Most stable pages converge in < 500 ms.

## Unit Benchmarks with Vitest

Vitest includes a built-in `bench()` function for microbenchmarks. Use it for operations that
do not require a browser (proxy creation, serialization, config parsing).

:::info[Contributor Only]
The benchmarks below use internal path aliases (`#proxy/*`, `#bridge/*`) that are only available when developing Praman itself. They are not accessible to end users of the `playwright-praman` package.
:::

```typescript
// tests/benchmarks/proxy-creation.bench.ts
import { bench, describe } from 'vitest';
import { createControlProxy } from '#proxy/control-proxy.js';

describe('proxy creation', () => {
  bench(
    'create proxy from discovery result',
    () => {
      createControlProxy({
        id: '__xmlview0--saveBtn',
        controlType: 'sap.m.Button',
        methods: ['getText', 'getEnabled', 'firePress'],
        page: mockPage,
        interactionStrategy: defaultStrategy,
      });
    },
    {
      time: 2000, // Run for 2 seconds
      iterations: 100, // Minimum 100 iterations
      warmupTime: 500, // 500ms warmup
    },
  );

  bench(
    'create proxy with method blacklist lookup',
    () => {
      createControlProxy({
        id: '__xmlview0--mainTable',
        controlType: 'sap.m.Table',
        methods: ['getItems', 'getMode', 'getSelectedItem'],
        page: mockPage,
        interactionStrategy: defaultStrategy,
      });
    },
    {
      time: 2000,
      iterations: 100,
      warmupTime: 500,
    },
  );
});
```

Run benchmarks:

```bash
npx vitest bench tests/benchmarks/
```

Output:

```
 ✓ proxy creation
   name                                     hz       min       max      mean      p75      p99
   create proxy from discovery result   45,230    0.018ms   0.052ms  0.022ms  0.023ms  0.045ms
   create proxy with method blacklist   38,100    0.021ms   0.061ms  0.026ms  0.028ms  0.055ms
```

### Benchmark Patterns for JSON Operations

```typescript
// tests/benchmarks/json-operations.bench.ts
import { bench, describe } from 'vitest';

describe('JSON serialization', () => {
  const complexSelector = {
    controlType: 'sap.m.Input',
    viewName: 'myApp.view.Detail',
    properties: { placeholder: 'Enter vendor name' },
    ancestor: { controlType: 'sap.m.VBox' },
  };

  bench('serialize complex selector', () => {
    JSON.stringify(complexSelector);
  });

  bench('parse bridge result with nested objects', () => {
    JSON.parse(
      JSON.stringify({
        controlId: '__xmlview0--input1',
        controlType: 'sap.m.Input',
        properties: {
          value: 'Vendor 1000',
          placeholder: 'Enter vendor name',
          valueState: 'None',
          enabled: true,
          editable: true,
        },
      }),
    );
  });
});
```

## E2E Performance Measurement with Playwright Traces

For operations that require a browser (bridge injection, discovery, stability), use
Playwright's `performance.now()` markers inside `page.evaluate()`.

```typescript
// tests/benchmarks/bridge-injection.spec.ts
import { test, expect } from 'playwright-praman';

test.describe('performance: bridge injection', () => {
  test('bridge injection completes within 500ms', async ({ page, ui5 }) => {
    const timing = await test.step('measure bridge injection', async () => {
      const start = performance.now();

      // Force bridge re-injection by navigating to a new page
      await page.goto(process.env['SAP_URL']!);
      // The ui5 fixture auto-injects the bridge on first access
      await ui5.waitForUI5Stable();

      return performance.now() - start;
    });

    expect(timing).toBeLessThan(500);
  });

  test('control discovery completes within 200ms', async ({ ui5 }) => {
    const timing = await test.step('measure discovery', async () => {
      const start = performance.now();
      await ui5.control({ id: /saveBtn/ });
      return performance.now() - start;
    });

    expect(timing).toBeLessThan(200);
  });

  test('proxy method call completes within 100ms', async ({ ui5 }) => {
    const control = await ui5.control({ id: /saveBtn/ });

    const timing = await test.step('measure method call', async () => {
      const start = performance.now();
      await control.getText();
      return performance.now() - start;
    });

    expect(timing).toBeLessThan(100);
  });
});
```

### Measuring Stability Convergence

```typescript
test('stability convergence within 2000ms on idle page', async ({ ui5 }) => {
  const timing = await test.step('measure stability wait', async () => {
    const start = performance.now();
    await ui5.waitForUI5Stable();
    return performance.now() - start;
  });

  // On an idle page, stability should converge much faster than the budget
  expect(timing).toBeLessThan(2000);

  // Track the actual timing for trend analysis
  test.info().annotations.push({
    type: 'perfMetric',
    description: `stability_convergence_ms:${Math.round(timing)}`,
  });
});
```

## Regression Detection

### Threshold Rule: 2x Baseline Fails CI

Any metric exceeding 2x its baseline target causes a CI failure. This catches regressions
while allowing for normal variance.

| Operation             | Baseline | Regression Threshold (2x) |
| --------------------- | -------- | ------------------------- |
| Bridge injection      | 500 ms   | 1000 ms                   |
| Control discovery     | 200 ms   | 400 ms                    |
| Method call           | 100 ms   | 200 ms                    |
| Proxy creation        | 50 ms    | 100 ms                    |
| Stability convergence | 2000 ms  | 4000 ms                   |

### CI Configuration

```yaml
# .github/workflows/perf.yml
name: Performance Regression

on:
  pull_request:
    paths:
      - 'src/bridge/**'
      - 'src/proxy/**'
      - 'src/core/stability/**'

jobs:
  benchmarks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: npm ci

      - name: Run unit benchmarks
        run: npx vitest bench tests/benchmarks/ --reporter=json --outputFile=bench-results.json

      - name: Check regression thresholds
        run: node scripts/check-bench-regression.js bench-results.json
```

### Regression Check Script

```typescript
// scripts/check-bench-regression.ts
import { readFileSync } from 'node:fs';

interface BenchResult {
  name: string;
  mean: number; // milliseconds
}

const THRESHOLDS: Record<string, number> = {
  'bridge injection': 1000,
  'control discovery': 400,
  'method call': 200,
  'proxy creation': 100,
  'stability convergence': 4000,
};

const resultsFile = process.argv[2];
if (!resultsFile) {
  console.error('Usage: node check-bench-regression.js <results.json>');
  process.exit(1);
}

const results: BenchResult[] = JSON.parse(readFileSync(resultsFile, 'utf-8'));
let failed = false;

for (const result of results) {
  const threshold = THRESHOLDS[result.name];
  if (threshold && result.mean > threshold) {
    console.error(
      `REGRESSION: "${result.name}" mean=${result.mean.toFixed(1)}ms exceeds 2x threshold=${threshold}ms`,
    );
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log('All benchmarks within 2x regression threshold.');
}
```

## Tracking Performance Over Time

Use Playwright's annotation system to emit performance metrics that can be extracted from
JUnit XML or JSON reporter output for trend dashboards.

```typescript
test.afterEach(async ({}, testInfo) => {
  // Emit performance annotations for CI extraction
  for (const annotation of testInfo.annotations) {
    if (annotation.type === 'perfMetric' && annotation.description) {
      const [name, value] = annotation.description.split(':');
      // These appear in JUnit XML <property> elements and JSON report annotations
      console.log(`::notice title=perf::${name}=${value}`);
    }
  }
});
```

## Summary

| Aspect          | Tool                     | When                                           |
| --------------- | ------------------------ | ---------------------------------------------- |
| Microbenchmarks | `vitest bench`           | Pure Node.js operations (proxy, serialization) |
| E2E timing      | Playwright + `expect()`  | Browser operations (injection, discovery)      |
| Regression gate | CI script + 2x threshold | Every PR touching bridge/proxy/stability       |
| Trend tracking  | Annotations + dashboard  | Ongoing, extracted from JUnit/JSON reports     |
