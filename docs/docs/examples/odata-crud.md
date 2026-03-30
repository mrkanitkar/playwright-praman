---
sidebar_position: 8
title: OData CRUD Operations
---

# OData CRUD Operations

Demonstrates the full OData lifecycle using Praman's `ui5.odata` fixture: model operations (browser-side reads), HTTP operations (direct CRUD), CSRF token handling, and test data lifecycle management.

## Two Approaches

| Approach             | Access Path                  | Use Case                                  |
| -------------------- | ---------------------------- | ----------------------------------------- |
| **Model operations** | Browser-side UI5 model       | Reading data the UI already loaded        |
| **HTTP operations**  | Direct HTTP to OData service | CRUD operations, test data setup/teardown |

## Source

```typescript
import { test, expect } from 'playwright-praman';

const SERVICE_URL = '/sap/opu/odata4/sap/API_PURCHASEORDER_2/srvd_a2x/sap/purchaseorder/0002';

test.describe('OData CRUD Operations', () => {
  let createdPONumber: string;

  test('read entities via browser-side model operations', async ({ page, ui5, ui5Navigation }) => {
    await test.step('Navigate to Purchase Order app', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-manage');
      await ui5.waitForUI5();
    });

    await test.step('Wait for OData model to load', async () => {
      await ui5.odata.waitForLoad();
    });

    await test.step('Read entity collection from model', async () => {
      const orders = await ui5.odata.getModelData('/PurchaseOrders');
      expect(orders.length).toBeGreaterThan(0);
    });

    await test.step('Read single property from model', async () => {
      const vendor = await ui5.odata.getModelProperty("/PurchaseOrders('4500000001')/Vendor");
      expect(vendor).toBeTruthy();
    });

    await test.step('Count entities in model', async () => {
      const count = await ui5.odata.getEntityCount('/PurchaseOrders');
      expect(count).toBeGreaterThan(0);
    });
  });

  test('query entities via direct HTTP operations', async ({ ui5 }) => {
    await test.step('Query with filters and sorting', async () => {
      const orders = await ui5.odata.queryEntities(SERVICE_URL, 'PurchaseOrders', {
        filter: "CompanyCode eq '1000'",
        select: 'PurchaseOrder,Vendor,CompanyCode,PurchaseOrderDate',
        orderby: 'PurchaseOrder desc',
        top: 5,
      });
      expect(orders.length).toBeGreaterThan(0);
      expect(orders.length).toBeLessThanOrEqual(5);
    });

    await test.step('Query with expand for navigation properties', async () => {
      const orders = await ui5.odata.queryEntities(SERVICE_URL, 'PurchaseOrders', {
        filter: "PurchaseOrder eq '4500000001'",
        select: 'PurchaseOrder,Vendor',
        expand: 'Items',
        top: 1,
      });
      expect(orders.length).toBe(1);
    });
  });

  test('create, update, and delete entity via HTTP', async ({ ui5 }) => {
    await test.step('Create a new Purchase Order', async () => {
      const newPO = await ui5.odata.createEntity(SERVICE_URL, 'PurchaseOrders', {
        Vendor: '100001',
        PurchasingOrganization: '1000',
        PurchasingGroup: '001',
        CompanyCode: '1000',
        DocumentCurrency: 'EUR',
        Items: [
          {
            Material: 'MAT-TEST-001',
            OrderQuantity: 10,
            PurchaseOrderQuantityUnit: 'EA',
            NetPriceAmount: 25.0,
            Plant: '1000',
          },
        ],
      });
      createdPONumber = String(newPO.PurchaseOrder);
      expect(createdPONumber).toBeTruthy();
    });

    await test.step('Update the created Purchase Order', async () => {
      await ui5.odata.updateEntity(SERVICE_URL, 'PurchaseOrders', `'${createdPONumber}'`, {
        PurchaseOrderNote: 'Updated by Praman E2E test',
      });

      // Verify by reading back
      const updated = await ui5.odata.queryEntities(SERVICE_URL, 'PurchaseOrders', {
        filter: `PurchaseOrder eq '${createdPONumber}'`,
        select: 'PurchaseOrder,PurchaseOrderNote',
        top: 1,
      });
      expect(updated[0].PurchaseOrderNote).toBe('Updated by Praman E2E test');
    });

    await test.step('Delete the test Purchase Order', async () => {
      await ui5.odata.deleteEntity(SERVICE_URL, 'PurchaseOrders', `'${createdPONumber}'`);

      const remaining = await ui5.odata.queryEntities(SERVICE_URL, 'PurchaseOrders', {
        filter: `PurchaseOrder eq '${createdPONumber}'`,
        top: 1,
      });
      expect(remaining.length).toBe(0);
    });
  });

  test('verify model dirty state during form editing', async ({ ui5, ui5Navigation }) => {
    await test.step('Navigate to Purchase Order detail', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-manage');
      await ui5.waitForUI5();
      await ui5.odata.waitForLoad();

      await ui5.press({
        controlType: 'sap.m.ColumnListItem',
        ancestor: { controlType: 'sap.m.Table' },
      });
      await ui5.waitForUI5();
    });

    await test.step('Enter edit mode and verify pending changes', async () => {
      await ui5.press({ id: 'editBtn' });
      await ui5.waitForUI5();

      const cleanBefore = await ui5.odata.hasPendingChanges();
      expect(cleanBefore).toBe(false);

      await ui5.fill({ id: 'noteField' }, 'Test pending changes');
      await ui5.waitForUI5();

      const dirty = await ui5.odata.hasPendingChanges();
      expect(dirty).toBe(true);
    });

    await test.step('Cancel edit and verify model is clean', async () => {
      await ui5.press({
        controlType: 'sap.m.Button',
        properties: { text: 'Cancel' },
      });

      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.Button',
          properties: { text: 'Discard' },
          searchOpenDialogs: true,
        });
      }).toPass({ timeout: 5000, intervals: [1000] });

      await ui5.waitForUI5();
      const cleanAfter = await ui5.odata.hasPendingChanges();
      expect(cleanAfter).toBe(false);
    });
  });
});
```

## Key Concepts

- **`ui5.odata.getModelData(path)`** -- reads from the browser-side UI5 OData model (no extra HTTP requests)
- **`ui5.odata.getModelProperty(path)`** -- reads a single property value from the model
- **`ui5.odata.getEntityCount(path)`** -- counts entities loaded in the model
- **`ui5.odata.waitForLoad()`** -- polls until OData data is available (15s default timeout)
- **`ui5.odata.queryEntities(url, set, opts)`** -- HTTP GET with `$filter`, `$select`, `$expand`, `$orderby`, `$top`
- **`ui5.odata.createEntity(url, set, data)`** -- HTTP POST with automatic CSRF token
- **`ui5.odata.updateEntity(url, set, key, data)`** -- HTTP PATCH with CSRF token
- **`ui5.odata.deleteEntity(url, set, key)`** -- HTTP DELETE with CSRF token
- **`ui5.odata.hasPendingChanges()`** -- checks if the model has unsaved edits (dirty state)
- **`ui5.odata.fetchCSRFToken(url)`** -- manually fetches a CSRF token for custom requests

## Test Data Lifecycle

A common pattern for CRUD tests:

1. **Create** test data via `createEntity()` in the test setup
2. **Verify** via UI interactions or model reads
3. **Cleanup** via `deleteEntity()` in the test teardown

This keeps tests hermetic and avoids polluting the system with stale test data.
