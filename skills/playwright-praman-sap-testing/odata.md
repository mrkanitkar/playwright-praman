# OData Integration Reference

## Table of Contents

1. [Model-Level vs HTTP-Level](#model-level-vs-http-level)
2. [OData Model Operations](#odata-model-operations)
3. [OData HTTP Operations](#odata-http-operations)
4. [ui5.odata Fixture API](#ui5odata-fixture-api)
5. [OData V2 vs V4](#odata-v2-vs-v4)
6. [Intercepting OData Requests](#intercepting-odata-requests)

---

## Model-Level vs HTTP-Level

SAP UI5 apps use OData in two distinct ways. Praman provides separate APIs for each:

| Layer           | What it is                                           | When to use                                            | API                                                        |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| **Model-level** | Reads/writes via sap.ui.model.odata.v2/v4.ODataModel | Access bound data without HTTP calls; read model state | `ui5.odata.readEntity()`, `ui5.odata.getModelData()`       |
| **HTTP-level**  | Direct REST calls to OData service endpoints         | Seed test data, verify persistence, bypass UI          | `ui5.odata.get()`, `ui5.odata.post()`, `ui5.odata.patch()` |

**Key distinction**: Model-level operations are synchronous reads of the UI5 model cache.
HTTP-level operations make actual network requests to the OData service.

---

## OData Model Operations

Model-level operations access the UI5 OData model bound in the current page context.
No network requests — reads from the model cache.

```typescript
import { moduleTest as test } from 'playwright-praman';

test('read bound model data', async ({ ui5 }) => {
  // Read a single entity from the model
  const vendor = await ui5.odata.readEntity('/Suppliers', 'SUP-001');
  // Returns: { Supplier: 'SUP-001', Name1: 'Acme Corp', ... }

  // Read all entities from a collection
  const orders = await ui5.odata.readCollection('/PurchaseOrders');

  // Get the bound context path of a specific control
  const control = await ui5.control({ id: 'vendorForm' });
  const context = await ui5.odata.getBindingContext(control);
  // e.g. '/Suppliers(\'SUP-001\')'

  // Get data from the model at a specific path
  const data = await ui5.odata.getModelData("/Suppliers('SUP-001')/Name1");
  // e.g. 'Acme Corp'
});
```

### Model Path Syntax

```text
OData V2 model paths:
/EntitySet                        — collection
/EntitySet('key')                 — single entity by key
/EntitySet('key')/NavProperty     — navigation property
/EntitySet(KeyProp='val')         — entity by named key

OData V4 model paths:
/EntitySet                        — collection
/EntitySet(key)                   — single entity
/EntitySet(key)/NavProperty       — navigation
```

---

## OData HTTP Operations

HTTP-level operations make direct REST calls. Use for test setup/teardown and
verifying persistence independent of the UI.

```typescript
import { moduleTest as test } from 'playwright-praman';

test('seed data and verify via HTTP', async ({ ui5 }) => {
  const baseUrl = 'https://your-sap-system.com';

  // GET — read entity
  const response = await ui5.odata.get(
    `${baseUrl}/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/PurchaseOrder('4500001234')`,
  );

  // POST — create entity
  const created = await ui5.odata.post(
    `${baseUrl}/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/PurchaseOrderSet`,
    {
      Supplier: 'SUP-001',
      CompanyCode: '1000',
      PurchasingOrganization: '1000',
    },
  );

  // PATCH — update entity (OData V4)
  await ui5.odata.patch(
    `${baseUrl}/sap/opu/odata4/sap/api_purchaseorder/srvd_a2x/sap/PurchaseOrder/0001/PurchaseOrder('4500001234')`,
    { DocumentCurrency: 'USD' },
  );

  // DELETE — remove entity
  await ui5.odata.delete(
    `${baseUrl}/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/PurchaseOrder('4500001234')`,
  );
});
```

### CSRF Token Handling

Praman automatically handles OData V2 CSRF token fetch-and-replay for POST/PATCH/DELETE operations.
No manual token management needed.

```typescript
// CSRF tokens are fetched automatically before write operations
await ui5.odata.post(serviceUrl, payload); // Praman fetches X-CSRF-Token first
```

---

## ui5.odata Fixture API

Full API available on `ui5.odata` from `moduleTest`:

```typescript
interface ODataFixture {
  // Model-level
  readEntity(entitySet: string, key: string): Promise<Record<string, unknown>>;
  readCollection(entitySet: string): Promise<readonly Record<string, unknown>[]>;
  getModelData(path: string): Promise<unknown>;
  getBindingContext(control: UI5ControlBase): Promise<string>;

  // HTTP-level
  get(url: string, params?: Record<string, string>): Promise<unknown>;
  post(url: string, body: unknown): Promise<unknown>;
  patch(url: string, body: unknown): Promise<void>;
  delete(url: string): Promise<void>;
  batch(operations: ODataBatchOperation[]): Promise<unknown[]>;
}
```

---

## OData V2 vs V4

| Feature     | OData V2                                    | OData V4                                           |
| ----------- | ------------------------------------------- | -------------------------------------------------- |
| URL pattern | `/sap/opu/odata/sap/<SERVICE_NAME>/`        | `/sap/opu/odata4/sap/<SERVICE_NAME>/srvd_a2x/sap/` |
| Key format  | `('value')` or `(KeyProp='value')`          | `(value)` or `(KeyProp=value)`                     |
| CSRF token  | Required for writes (`X-CSRF-Token` header) | Required for writes                                |
| Batch       | `$batch` POST with multipart/mixed body     | `$batch` POST with JSON array                      |
| Metadata    | `$metadata` XML                             | `$metadata` XML or JSON                            |
| Expand      | `$expand=NavProp`                           | `$expand=NavProp($select=Field)`                   |

**Detecting which version**: Look at the URL — V4 URLs contain `odata4` or `srvd_a2x`.

---

## Intercepting OData Requests

Use Playwright's `page.route()` to intercept and mock OData calls in tests:

```typescript
import { coreTest as test } from 'playwright-praman';

test('mock OData response', async ({ page, ui5Navigation }) => {
  // Mock a GET request
  await page.route(
    '**/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/PurchaseOrderSet*',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          d: {
            results: [
              { PurchaseOrder: '4500001234', Supplier: 'SUP-001', DocumentCurrency: 'USD' },
            ],
          },
        }),
      });
    },
  );

  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  // The app will see the mocked response
});
```

### Verifying OData Calls Were Made

```typescript
test('verify OData request was sent', async ({ page, ui5Navigation, ui5 }) => {
  const requests: string[] = [];

  page.on('request', (req) => {
    if (req.url().includes('/odata/')) {
      requests.push(req.url());
    }
  });

  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Go' } });
  await ui5.waitForUI5();

  expect(requests.some((url) => url.includes('PurchaseOrderSet'))).toBe(true);
});
```
