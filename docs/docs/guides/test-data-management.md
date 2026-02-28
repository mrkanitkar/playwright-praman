---
sidebar_position: 30
title: 'Test Data Management'
---

# Test Data Management

Reliable SAP UI5 tests require predictable, isolated test data. Praman provides a `TestDataHandler` fixture for generating templated data, persisting it for cross-step reuse, and cleaning it up automatically on teardown.

## TestDataHandler Fixture

The `testData` fixture is available in every Praman test. It generates data from templates using placeholder tokens that are replaced at runtime:

- `{{uuid}}` -- a unique identifier (via `node:crypto.randomUUID()`)
- `{{timestamp}}` -- an ISO-8601 timestamp at generation time

```typescript
import { test, expect } from 'playwright-praman';

test('create a purchase order with unique data', async ({ ui5, testData }) => {
  const order = testData.generate({
    orderId: 'PO-{{uuid}}',
    description: 'Test order created at {{timestamp}}',
    amount: 1500,
  });

  await test.step('Fill order form', async () => {
    await ui5.fill({ id: 'orderIdInput' }, order.orderId);
    await ui5.fill({ id: 'descriptionInput' }, order.description);
  });

  await test.step('Verify order was created', async () => {
    await expect(ui5.control({ id: 'orderIdDisplay' })).toHaveText(order.orderId);
  });
});
```

## Persisting and Loading Data

For multi-step tests that span navigation or page reloads, persist generated data to disk and reload it later:

```typescript
test('create and verify order across pages', async ({ ui5, testData }) => {
  const order = testData.generate({ id: '{{uuid}}', vendor: 'ACME-{{uuid}}' });

  await test.step('Save order data for later steps', async () => {
    await testData.save('order.json', order);
  });

  // ... navigate to a different page ...

  await test.step('Load order data on verification page', async () => {
    const saved = await testData.load<{ id: string; vendor: string }>('order.json');
    await expect(ui5.control({ id: 'vendorDisplay' })).toHaveText(saved.vendor);
  });
});
```

## Automatic Cleanup

The `testData` fixture tracks all files created via `save()`. On test teardown, call `cleanup()` to remove them:

```typescript
test('data files are cleaned up after test', async ({ testData }) => {
  const item = testData.generate({ sku: 'SKU-{{uuid}}' });
  await testData.save('item.json', item);
  // cleanup() is called automatically during fixture teardown
});
```

If you manage `TestDataHandler` manually (outside fixtures), call `cleanup()` explicitly in your teardown logic.

## Data Isolation Across Parallel Workers

When running tests in parallel with multiple Playwright workers, each worker gets its own `testData` instance with an isolated `baseDir`. This prevents file collisions:

```typescript
// praman.config.ts
export default {
  testData: {
    baseDir: './test-data', // Each worker appends its workerIndex
  },
};
```

Use `{{uuid}}` tokens in entity identifiers to avoid collisions at the SAP backend level as well. Two parallel workers creating a purchase order with the same ID will cause OData conflicts.

## OData Entity Creation for Test Setup

For integration tests against a live SAP system, create test entities via OData before exercising the UI:

```typescript
import { test, expect } from 'playwright-praman';

test('edit an existing order', async ({ ui5, page, testData }) => {
  const order = testData.generate({ OrderID: '{{uuid}}', Status: 'Draft' });

  await test.step('Create test entity via OData', async () => {
    const response = await page.request.post('/sap/opu/odata/sap/ORDER_SRV/Orders', {
      data: order,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.ok()).toBe(true);
  });

  await test.step('Navigate to order and edit', async () => {
    await page.goto(`/app#/Orders/${order.OrderID}`);
    await ui5.waitForUI5();
    await ui5.fill({ id: 'statusField' }, 'Approved');
    await ui5.click({ id: 'saveBtn' });
  });
});
```

## Factory Patterns

For complex entity structures, create reusable factory functions:

```typescript
function createOrderTemplate(overrides: Record<string, unknown> = {}) {
  return {
    OrderID: '{{uuid}}',
    CreatedAt: '{{timestamp}}',
    Status: 'Draft',
    Currency: 'USD',
    Items: [{ ItemID: '{{uuid}}', Quantity: 1 }],
    ...overrides,
  };
}

test('order with custom status', async ({ testData }) => {
  const order = testData.generate(createOrderTemplate({ Status: 'Approved' }));
  // order.Status === 'Approved', order.OrderID === 'a1b2c3d4-...'
});
```

## Common Pitfalls

- **Hardcoded IDs in parallel runs**: Always use `{{uuid}}` for entity identifiers. Static IDs like `"TEST-001"` cause conflicts when workers hit the same SAP backend.
- **Stale persisted files**: If a previous test run crashed before cleanup, leftover files in `baseDir` can confuse subsequent runs. Use a CI step to clear the test-data directory before each run.
- **OData entity cleanup**: The `testData.cleanup()` method removes local files only. For OData entities created on the server, implement a `test.afterAll()` hook that sends DELETE requests.
- **Template nesting**: Placeholders work recursively in nested objects and arrays, but only on string values. A numeric field like `amount: 100` passes through unchanged.
