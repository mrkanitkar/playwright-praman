---
sidebar_position: 46
title: 'Lifecycle Hook Extensibility'
description: "Extend praman's test lifecycle using Playwright-native patterns"
---

## Overview

Praman leverages Playwright's built-in extensibility mechanisms rather than a custom event emitter or plugin system.
This guide covers how to extend praman's test lifecycle using Playwright-native patterns.

## 1. Request Interception with `page.route()`

Intercept, modify, or mock HTTP requests at the network level.

```typescript
import { test } from 'playwright-praman';

test('mock OData response', async ({ page }) => {
  // Intercept OData entity set requests
  await page.route('**/sap/opu/odata/sap/API_BUSINESS_PARTNER/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        d: { results: [{ BusinessPartner: 'BP001', BusinessPartnerName: 'Test Inc.' }] },
      }),
    });
  });

  // Test runs with mocked data
  await page.goto('/app#BusinessPartner-manage');
});
```

Praman's built-in `requestInterceptor` fixture uses this pattern to block WalkMe and analytics requests automatically.

## 2. Fixture Setup/Teardown with `use()`

Playwright fixtures provide deterministic setup and teardown via the `use()` callback. Code before `use()` is setup; code after is teardown (guaranteed to run, even on failure).

```typescript
import { test as base } from 'playwright-praman';

const test = base.extend({
  // Custom fixture with setup and teardown
  testOrder: async ({ page, ui5 }, use) => {
    // SETUP: create test data
    const orderId = await createTestOrder(page);

    // Pass to test
    await use(orderId);

    // TEARDOWN: always runs, even if test fails
    await deleteTestOrder(page, orderId);
  },
});

test('verify order', async ({ testOrder }) => {
  // testOrder contains the created order ID
});
```

## 3. Browser Event Listeners with `page.on()`

React to browser events like navigation, console messages, or dialog prompts.

```typescript
import { test } from 'playwright-praman';

test('track navigation events', async ({ page }) => {
  const navigations: string[] = [];

  // Listen for main frame navigations
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      navigations.push(frame.url());
    }
  });

  // Listen for console errors from UI5
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.warn(`UI5 console error: ${msg.text()}`);
    }
  });

  await page.goto('/app#PurchaseOrder-manage');
});
```

Praman's `ui5Stability` fixture uses this pattern to call `waitForUI5Stable()` on main frame navigations.

## 4. Test Hooks with `beforeEach` / `afterEach`

Standard Playwright hooks for cross-cutting concerns.

```typescript
import { test } from 'playwright-praman';

test.beforeEach(async ({ page }) => {
  // Runs before every test — e.g., ensure clean state
  await page.evaluate(() => {
    sessionStorage.clear();
  });
});

test.afterEach(async ({ page }, testInfo) => {
  // Runs after every test — e.g., capture screenshot on failure
  if (testInfo.status !== testInfo.expectedStatus) {
    await page.screenshot({ path: `screenshots/${testInfo.title}.png` });
  }
});
```

## 5. Step Instrumentation with `test.step()`

Group operations into named steps for Playwright trace viewer and HTML reporter.

```typescript
import { test, expect } from 'playwright-praman';

test('create purchase order', async ({ page, ui5 }) => {
  await test.step('Navigate to PO creation', async () => {
    await page.goto('/app#PurchaseOrder-manage');
  });

  await test.step('Fill header data', async () => {
    await ui5.fill({ id: 'supplierInput' }, 'Supplier A');
    await ui5.fill({ id: 'companyCodeInput' }, '1000');
  });

  await test.step('Verify creation', async () => {
    await expect(page.locator('ui5=sap.m.MessageToast')).toBeVisible();
  });
});
```

Praman's `@ui5Step` decorator uses `test.step({ box: true })` to automatically wrap handler methods in trace-visible steps with internal stack frames filtered.

## Combining Patterns

These patterns compose naturally. A typical SAP test fixture combines all four:

```typescript
import { test as base, expect } from 'playwright-praman';

const test = base.extend({
  sapApp: async ({ page, ui5 }, use) => {
    // SETUP: Mock slow service, navigate, wait
    await page.route('**/slow-analytics/**', (route) => route.abort());

    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        // Log navigation for debugging
      }
    });

    await page.goto('/app#MyApp-display');
    await use({ page, ui5 });

    // TEARDOWN: Clean up test data
  },
});
```

## Why No Custom Event System?

Playwright's fixture model, `page.route()`, `page.on()`, and `test.step()` together cover every lifecycle hook scenario. A custom event emitter would:

- Duplicate Playwright's built-in capabilities
- Add maintenance burden and API surface
- Require documentation for a non-standard pattern
- Confuse users familiar with Playwright's patterns

Praman follows Playwright's philosophy: use the platform's native extensibility rather than building framework-specific abstractions.
