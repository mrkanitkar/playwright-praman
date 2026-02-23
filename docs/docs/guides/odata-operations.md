---
sidebar_position: 14
title: OData Operations
---

Praman provides two approaches to OData data access: **model operations** (browser-side, via
`ui5.odata`) and **HTTP operations** (server-side, via `ui5.odata`). This page covers both,
including V2 vs V4 differences and the ODataTraceReporter.

## Two Approaches

| Approach             | Access Path                  | Use Case                                  |
| -------------------- | ---------------------------- | ----------------------------------------- |
| **Model operations** | Browser-side UI5 model       | Reading data the UI already loaded        |
| **HTTP operations**  | Direct HTTP to OData service | CRUD operations, test data setup/teardown |

## Model Operations (Browser-Side)

Model operations query the UI5 OData model that is already loaded in the browser. No additional
HTTP requests are made — you are reading the same data the UI5 application is displaying.

### getModelData

Reads data at any model path. Returns the full object tree.

```typescript
const orders = await ui5.odata.getModelData('/PurchaseOrders');
console.log(orders.length); // Number of loaded POs

const singlePO = await ui5.odata.getModelData("/PurchaseOrders('4500000001')");
console.log(singlePO.Vendor); // '100001'
```

### getModelProperty

Reads a single property value from the model.

```typescript
const vendor = await ui5.odata.getModelProperty("/PurchaseOrders('4500000001')/Vendor");
const amount = await ui5.odata.getModelProperty("/PurchaseOrders('4500000001')/NetAmount");
```

### getEntityCount

Counts entities in a set. Reads from the model, not from $count.

```typescript
const count = await ui5.odata.getEntityCount('/PurchaseOrders');
expect(count).toBeGreaterThan(0);
```

### waitForODataLoad

Polls the model until data is available at the given path. Useful after navigation when
OData requests are still in flight.

```typescript
await ui5.odata.waitForODataLoad('/PurchaseOrders');
// Data is now available
const orders = await ui5.odata.getModelData('/PurchaseOrders');
```

Default timeout: 15 seconds. Polling interval: 100ms.

### hasPendingChanges

Checks if the model has unsaved changes (dirty state).

```typescript
await ui5.fill({ id: 'vendorInput' }, '100002');
const dirty = await ui5.odata.hasPendingChanges();
expect(dirty).toBe(true);

await ui5.click({ id: 'saveBtn' });
const clean = await ui5.odata.hasPendingChanges();
expect(clean).toBe(false);
```

### fetchCSRFToken

Fetches a CSRF token from an OData service URL. Needed for write operations via HTTP.

```typescript
const token = await ui5.odata.fetchCSRFToken('/sap/opu/odata/sap/API_PO_SRV');
// Use token in custom HTTP requests
```

### Named Model Support

By default, model operations query the component's default model. To query a named model:

```typescript
const data = await ui5.odata.getModelData('/Products', { modelName: 'productModel' });
```

## HTTP Operations (Server-Side)

HTTP operations perform direct OData CRUD operations against the service endpoint using
Playwright's request context. These are independent of the browser — useful for test data
setup, teardown, and backend verification.

### queryEntities

Performs an HTTP GET with OData query parameters.

```typescript
const orders = await ui5.odata.queryEntities('/sap/opu/odata/sap/API_PO_SRV', 'PurchaseOrders', {
  filter: "Status eq 'A'",
  select: 'PONumber,Vendor,Amount',
  expand: 'Items',
  orderby: 'PONumber desc',
  top: 10,
  skip: 0,
});
```

### createEntity

Performs an HTTP POST with automatic CSRF token management.

```typescript
const newPO = await ui5.odata.createEntity('/sap/opu/odata/sap/API_PO_SRV', 'PurchaseOrders', {
  Vendor: '100001',
  PurchOrg: '1000',
  CompanyCode: '1000',
  Items: [{ Material: 'MAT-001', Quantity: 10, Unit: 'EA' }],
});
console.log(newPO.PONumber); // Server-generated PO number
```

### updateEntity

Performs an HTTP PATCH with CSRF token and optional ETag for optimistic concurrency.

```typescript
await ui5.odata.updateEntity('/sap/opu/odata/sap/API_PO_SRV', 'PurchaseOrders', "'4500000001'", {
  Status: 'B',
  Note: 'Updated by test',
});
```

### deleteEntity

Performs an HTTP DELETE with CSRF token.

```typescript
await ui5.odata.deleteEntity('/sap/opu/odata/sap/API_PO_SRV', 'PurchaseOrders', "'4500000001'");
```

### callFunctionImport

Calls an OData function import (action).

```typescript
const result = await ui5.odata.callFunctionImport('/sap/opu/odata/sap/API_PO_SRV', 'ApprovePO', {
  PONumber: '4500000001',
});
```

## OData V2 vs V4 Differences

| Aspect             | OData V2                                            | OData V4                                   |
| ------------------ | --------------------------------------------------- | ------------------------------------------ |
| **Model class**    | `sap.ui.model.odata.v2.ODataModel`                  | `sap.ui.model.odata.v4.ODataModel`         |
| **URL convention** | `/sap/opu/odata/sap/SERVICE_SRV`                    | `/sap/opu/odata4/sap/SERVICE/srvd_a2x/...` |
| **Batch**          | `$batch` with changesets                            | `$batch` with JSON:API format              |
| **CSRF token**     | Fetched via HEAD request with `X-CSRF-Token: Fetch` | Same mechanism                             |
| **Deep insert**    | Supported via navigation properties                 | Supported natively                         |
| **Filter syntax**  | `$filter=Status eq 'A'`                             | `$filter=Status eq 'A'` (same)             |

Praman's model operations work with both V2 and V4 models transparently — the model class
handles the protocol differences. HTTP operations use the URL conventions of your service.

## OData Trace Reporter

The `ODataTraceReporter` captures all OData HTTP requests during test runs and generates a
performance trace. See the [Reporters](./reporters.md) guide for configuration.

The trace output includes per-entity-set statistics:

```json
{
  "entitySets": {
    "PurchaseOrders": {
      "GET": { "count": 12, "avgDuration": 340, "maxDuration": 1200, "errors": 0 },
      "POST": { "count": 2, "avgDuration": 890, "maxDuration": 1100, "errors": 0 },
      "PATCH": { "count": 1, "avgDuration": 450, "maxDuration": 450, "errors": 0 }
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

## Complete Example

```typescript
import { test, expect } from 'playwright-praman';

test('verify OData model state after form edit', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // Wait for initial data load
  await ui5.odata.waitForODataLoad('/PurchaseOrders');

  // Read model data
  const orders = await ui5.odata.getModelData('/PurchaseOrders');
  expect(orders.length).toBeGreaterThan(0);

  // Navigate to first PO
  await ui5.click({
    controlType: 'sap.m.ColumnListItem',
    ancestor: { id: 'poTable' },
  });

  // Edit a field
  await ui5.click({ id: 'editBtn' });
  await ui5.fill({ id: 'noteField' }, 'Test note');

  // Verify model has pending changes
  const dirty = await ui5.odata.hasPendingChanges();
  expect(dirty).toBe(true);

  // Save
  await ui5.click({ id: 'saveBtn' });

  // Verify model is clean
  const clean = await ui5.odata.hasPendingChanges();
  expect(clean).toBe(false);
});

test('seed and cleanup test data via HTTP', async ({ ui5 }) => {
  // Setup: create test PO via direct HTTP
  const po = await ui5.odata.createEntity('/sap/opu/odata/sap/API_PO_SRV', 'PurchaseOrders', {
    Vendor: '100001',
    PurchOrg: '1000',
    CompanyCode: '1000',
  });

  // ... run test steps ...

  // Cleanup: delete the test PO
  await ui5.odata.deleteEntity(
    '/sap/opu/odata/sap/API_PO_SRV',
    'PurchaseOrders',
    `'${po.PONumber}'`,
  );
});
```
