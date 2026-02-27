---
sidebar_position: 49
title: 'Parallel Execution & Sharding'
---

# Parallel Execution & Sharding

Running SAP UI5 tests in parallel dramatically reduces feedback time. This guide covers Playwright's parallelization model, SAP-specific considerations for auth and locking, and CI sharding strategies.

## Enabling Parallel Execution

Playwright supports parallelism at two levels: across test files (workers) and within a file (fullyParallel). Enable both in your config:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 4 : undefined, // undefined = half CPU cores
});
```

With `fullyParallel: true`, individual `test()` blocks within the same file can run concurrently. Without it, tests in a single file run sequentially while different files run in parallel across workers.

## Worker Isolation with Auth State

Each Playwright worker is an independent Node.js process. For SAP tests, share authentication state across workers using Playwright's `storageState` mechanism:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'sap-tests',
      dependencies: ['auth-setup'],
      use: {
        storageState: '.auth/user.json',
      },
    },
  ],
});
```

The `auth-setup` project runs once before all workers. Each worker then reuses the saved cookies and session tokens without re-authenticating.

## SAP Fiori Launchpad Lock Considerations

SAP systems enforce object-level locking. When two parallel workers attempt to edit the same business object (e.g., a sales order), one will encounter an SAP lock error (`ENQUEUE_CONFLICT`).

Strategies to avoid lock conflicts:

- **Unique test data per worker**: Generate unique entity IDs with `{{uuid}}` so workers never edit the same object.
- **Read-only vs. write tests**: Separate display-only tests from edit tests into different projects. Run edit tests with `workers: 1`.
- **Dedicated test data pools**: Assign each worker its own pre-created entities using `workerIndex`:

```typescript
import { test } from 'playwright-praman';

test('edit order assigned to this worker', async ({ ui5 }, testInfo) => {
  const orderPool = ['ORD-001', 'ORD-002', 'ORD-003', 'ORD-004'];
  const myOrder = orderPool[testInfo.workerIndex % orderPool.length];

  await ui5.navigate(`/app#/Orders/${myOrder}`);
  await ui5.waitForUI5();
});
```

## Praman Bridge in Parallel Workers

The Praman bridge is injected per-page, not per-worker. Each worker creates its own browser context and page, so bridge injection is fully independent. No special configuration is needed for the bridge in parallel mode.

One consideration: if `controlDiscoveryTimeout` is too low and the SAP system is under load from multiple workers, increase it:

```typescript
export default {
  controlDiscoveryTimeout: 45_000, // 45 seconds under parallel load
};
```

## CI Sharding with GitHub Actions

Playwright's built-in sharding distributes test files across multiple CI jobs:

```yaml
# .github/workflows/test.yml
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test --shard=${{ matrix.shard }}/4
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: results-shard-${{ matrix.shard }}
          path: test-results/
```

## Auth Setup for Sharded Runs

When using sharding, every shard must have access to auth state. Use `globalSetup` instead of project dependencies so each shard runs its own login:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  globalSetup: './global-setup.ts', // runs once per shard
});
```

## Common Pitfalls

- **Too many workers against SAP**: SAP systems have session limits. If you see `ERR_AUTH_FAILED` errors in parallel runs, reduce `workers` or use more test accounts.
- **Shared mutable state**: Never store test state in module-level variables. Each worker is a separate process, so module state is not shared. Use `testData.save()` and `testData.load()` for cross-step persistence.
- **FLP tile cache**: The Fiori Launchpad caches tile data per session. Parallel workers reusing the same `storageState` share the same FLP cache, which is generally safe for read operations.
- **Shard imbalance**: Playwright distributes by file, not by test count. If one file has 50 tests and others have 5, sharding will be uneven. Keep test files roughly equal in size.
