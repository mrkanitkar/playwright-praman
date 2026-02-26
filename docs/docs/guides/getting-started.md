---
sidebar_position: 1
title: Getting Started
---

Get up and running with Praman in under 5 minutes.

## Prerequisites

- **Node.js** >= 20
- **Playwright** >= 1.50
- Access to an SAP UI5 / Fiori application

## Installation

```bash
npm install playwright-praman @playwright/test
npx playwright install chromium
```

## Create Configuration

Create `praman.config.ts` in your project root:

```typescript
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  logLevel: 'info',
  ui5WaitTimeout: 30_000,
  controlDiscoveryTimeout: 10_000,
  interactionStrategy: 'ui5-native',
});
```

Create or update `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: process.env.SAP_BASE_URL,
    trace: 'on-first-retry',
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
      name: 'tests',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
      },
    },
  ],
});
```

## Environment Variables

Create a `.env` file (never commit this):

```bash
SAP_BASE_URL=https://your-sap-system.example.com
SAP_ONPREM_USERNAME=your_user
SAP_ONPREM_PASSWORD=your_password
SAP_CLIENT=100
SAP_LANGUAGE=EN
```

## Write Your First Test

Create `tests/first.test.ts`:

```typescript
import { test, expect } from 'playwright-praman';

test('discover a UI5 control', async ({ ui5, ui5Navigation }) => {
  await test.step('Navigate to app', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  });

  await test.step('Find and verify a button', async () => {
    const button = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'Create' },
    });
    const text = await button.getText();
    expect(text).toBe('Create');
  });
});
```

## Run

```bash
npx playwright test
```

Expected output:

```text
Running 1 test using 1 worker

  ✓  tests/first.test.ts:3:1 › discover a UI5 control (12s)

  1 passed (14s)
```

:::tip Why `ui5.control()` instead of `page.locator()`?
SAP UI5 renders controls dynamically — DOM IDs change between versions, themes restructure
elements, and controls nest inside generated wrappers. `ui5.control()` discovers controls through
the **UI5 runtime's own control registry**, which is the stable contract. Your tests survive DOM
restructuring, theme changes, and UI5 version upgrades.
:::

## Import Pattern

Praman uses Playwright's `mergeTests()` to combine all fixtures into a single `test` object:

```typescript
import { test, expect } from 'playwright-praman';

// All fixtures available via destructuring:
test('full access', async ({
  ui5, // Control discovery + interaction
  ui5Navigation, // FLP navigation
  sapAuth, // Authentication
  fe, // Fiori Elements helpers
  pramanAI, // AI page discovery
  intent, // Business domain intents
  ui5Shell, // FLP shell header
  ui5Footer, // Page footer bar
  flpLocks, // SM12 lock management
  flpSettings, // User settings
  testData, // Test data generation
}) => {
  // ...
});
```

## Next Steps

- [Configuration Reference](./configuration) — all config options
- [Authentication Guide](./authentication) — 6 auth strategies
- [Selector Reference](./selectors) — `UI5Selector` fields and examples
- [Fixture Reference](./fixtures) — all 12 fixture modules
- [Error Reference](./errors) — 58 error codes with recovery suggestions
- [Agent & IDE Setup](./agent-setup) — install AI agents, seed files, and IDE configs
