/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * OData CRUD Operations Example -- read, create, update, delete with CSRF tokens.
 *
 * @remarks
 * This example demonstrates the full OData lifecycle using Praman's `ui5.odata` fixture:
 *
 * 1. **Model operations** -- read data from the browser-side UI5 OData model
 * 2. **HTTP operations** -- perform direct CRUD against OData endpoints
 * 3. **CSRF token handling** -- automatic token management for write operations
 * 4. **Test data lifecycle** -- create test data, verify via UI, clean up afterward
 * 5. **V4 query parameters** -- `$filter`, `$select`, `$expand`, `$orderby`
 *
 * The example uses a Purchase Order OData V4 service as a realistic SAP scenario.
 *
 * Prerequisites:
 * - Authentication handled via setup project (see {@link auth-setup.ts})
 * - OData V4 service endpoint accessible (e.g., `/sap/opu/odata4/sap/API_PURCHASEORDER_2/`)
 * - User has create/update/delete authorization for PurchaseOrder entity set
 *
 * @example
 * ```bash
 * npx playwright test examples/odata-crud.spec.ts
 * ```
 */

import { test, expect } from 'playwright-praman';

const SERVICE_URL = '/sap/opu/odata4/sap/API_PURCHASEORDER_2/srvd_a2x/sap/purchaseorder/0002';

test.describe('OData CRUD Operations', () => {
  /** Stores the PO number created during the test for cleanup */
  let createdPONumber: string;

  test('read entities via browser-side model operations', async ({ page, ui5, ui5Navigation }) => {
    await test.step('Navigate to Purchase Order app', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-manage');
      await ui5.waitForUI5();
    });

    await test.step('Wait for OData model to load', async () => {
      // waitForODataLoad polls until data is available at the model path
      await ui5.odata.waitForODataLoad('/PurchaseOrders');
    });

    await test.step('Read entity collection from model', async () => {
      // getModelData reads from the browser-side UI5 OData model
      // No additional HTTP requests -- reads what the UI already loaded
      const orders = (await ui5.odata.getModelData('/PurchaseOrders')) as unknown[];
      expect(orders.length).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'info',
        description: `Model contains ${orders.length} purchase orders`,
      });
    });

    await test.step('Read single property from model', async () => {
      // getModelProperty reads a specific property value
      const vendor = await ui5.odata.getModelProperty("/PurchaseOrders('4500000001')/Vendor");
      expect(vendor).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `First PO vendor: ${String(vendor)}`,
      });
    });

    await test.step('Count entities in model', async () => {
      // getEntityCount reads the loaded count from the model
      const count = await ui5.odata.getEntityCount('/PurchaseOrders');
      expect(count).toBeGreaterThan(0);
    });
  });

  test('query entities via direct HTTP operations', async ({ ui5 }) => {
    await test.step('Query with filters and sorting', async () => {
      // queryEntities performs a direct HTTP GET with OData query parameters
      const orders = (await ui5.odata.queryEntities(SERVICE_URL, 'PurchaseOrders', {
        filter: "CompanyCode eq '1000'",
        select: 'PurchaseOrder,Vendor,CompanyCode,PurchaseOrderDate',
        orderby: 'PurchaseOrder desc',
        top: 5,
      })) as unknown[];

      expect(orders.length).toBeGreaterThan(0);
      expect(orders.length).toBeLessThanOrEqual(5);

      test.info().annotations.push({
        type: 'info',
        description: `Queried ${orders.length} POs for CompanyCode 1000`,
      });
    });

    await test.step('Query with expand for navigation properties', async () => {
      // $expand fetches related entities in a single request
      const orders = (await ui5.odata.queryEntities(SERVICE_URL, 'PurchaseOrders', {
        filter: "PurchaseOrder eq '4500000001'",
        select: 'PurchaseOrder,Vendor',
        expand: 'Items',
        top: 1,
      })) as Array<Record<string, unknown>>;

      expect(orders.length).toBe(1);
      const items = orders[0]!['Items'] as unknown[];
      expect(items).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `PO 4500000001 has ${items.length} line items`,
      });
    });
  });

  test('create, update, and delete entity via HTTP', async ({ ui5 }) => {
    await test.step('Fetch CSRF token', async () => {
      // CSRF token is required for all write operations (POST, PATCH, DELETE)
      // createEntity/updateEntity/deleteEntity handle this automatically,
      // but you can also fetch it manually for custom requests
      const token = await ui5.odata.fetchCSRFToken(SERVICE_URL);
      expect(token).toBeTruthy();
      expect(token.length).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'info',
        description: 'CSRF token fetched successfully',
      });
    });

    await test.step('Create a new Purchase Order', async () => {
      // createEntity performs an HTTP POST with automatic CSRF token management
      const newPO = (await ui5.odata.createEntity(SERVICE_URL, 'PurchaseOrders', {
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
      })) as Record<string, unknown>;

      expect(newPO['PurchaseOrder']).toBeTruthy();
      createdPONumber = String(newPO['PurchaseOrder']);

      test.info().annotations.push({
        type: 'info',
        description: `Created PO: ${createdPONumber}`,
      });
    });

    await test.step('Update the created Purchase Order', async () => {
      // updateEntity performs an HTTP PATCH with CSRF token
      await ui5.odata.updateEntity(SERVICE_URL, 'PurchaseOrders', `'${createdPONumber}'`, {
        PurchaseOrderNote: 'Updated by Praman E2E test',
      });

      // Verify the update by reading back
      const updated = (await ui5.odata.queryEntities(SERVICE_URL, 'PurchaseOrders', {
        filter: `PurchaseOrder eq '${createdPONumber}'`,
        select: 'PurchaseOrder,PurchaseOrderNote',
        top: 1,
      })) as Array<Record<string, unknown>>;

      expect(updated.length).toBe(1);
      expect(updated[0]!['PurchaseOrderNote']).toBe('Updated by Praman E2E test');

      test.info().annotations.push({
        type: 'info',
        description: `Updated PO ${createdPONumber} note field`,
      });
    });

    await test.step('Delete the test Purchase Order', async () => {
      // deleteEntity performs an HTTP DELETE with CSRF token
      await ui5.odata.deleteEntity(SERVICE_URL, 'PurchaseOrders', `'${createdPONumber}'`);

      // Verify deletion
      const remaining = (await ui5.odata.queryEntities(SERVICE_URL, 'PurchaseOrders', {
        filter: `PurchaseOrder eq '${createdPONumber}'`,
        top: 1,
      })) as unknown[];

      expect(remaining.length).toBe(0);

      test.info().annotations.push({
        type: 'info',
        description: `Deleted PO ${createdPONumber}`,
      });
    });
  });

  test('verify model dirty state during form editing', async ({ ui5, ui5Navigation }) => {
    await test.step('Navigate to Purchase Order detail', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-manage');
      await ui5.waitForUI5();
      await ui5.odata.waitForODataLoad('/PurchaseOrders');

      // Click the first list item to navigate to detail
      await ui5.press({
        controlType: 'sap.m.ColumnListItem',
        ancestor: { controlType: 'sap.m.Table' },
      });
      await ui5.waitForUI5();
    });

    await test.step('Enter edit mode and verify pending changes', async () => {
      // Click edit button
      await ui5.press({ id: 'editBtn' });
      await ui5.waitForUI5();

      // Model should be clean before edits
      const cleanBefore = await ui5.odata.hasPendingChanges();
      expect(cleanBefore).toBe(false);

      // Edit a field
      await ui5.fill({ id: 'noteField' }, 'Test pending changes');
      await ui5.waitForUI5();

      // Model should now have pending changes
      const dirty = await ui5.odata.hasPendingChanges();
      expect(dirty).toBe(true);

      test.info().annotations.push({
        type: 'info',
        description: 'Model correctly reports pending changes after edit',
      });
    });

    await test.step('Cancel edit and verify model is clean', async () => {
      // Cancel discards pending changes
      await ui5.press({
        controlType: 'sap.m.Button',
        properties: { text: 'Cancel' },
      });

      // Confirm the cancellation dialog if it appears
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
