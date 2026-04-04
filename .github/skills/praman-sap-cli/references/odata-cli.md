# OData Operations via CLI

## Table of Contents

1. [Detect OData Version](#detect-odata-version)
2. [Read Model Data](#read-model-data)
3. [Read Entity Set](#read-entity-set)
4. [Get CSRF Token](#get-csrf-token)
5. [Check Pending Changes](#check-pending-changes)
6. [Wait for OData Load](#wait-for-odata-load)
7. [Write Operations Note](#write-operations-note)

---

## Detect OData Version

SAP apps use either OData V2 or V4. The version determines the API surface
and URL patterns. Detect it by inspecting the model metadata.

```bash
playwright-cli -s=sap run-code "async page => {
  const result = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    if (!view) return { error: 'No view found' };

    const ctrl = bridge.getById(view.id);
    const model = ctrl.getModel();
    if (!model) return { error: 'No default model found' };

    const metaClass = model.getMetadata().getName();
    const isV4 = metaClass.includes('v4');
    const isV2 = metaClass.includes('v2');

    return {
      modelClass: metaClass,
      version: isV4 ? 'V4' : isV2 ? 'V2' : 'Unknown',
      serviceUrl: model.sServiceUrl || model.getServiceUrl?.() || 'N/A'
    };
  });
  return result;
}"
```

**Quick version check by URL pattern**:

| URL pattern                                   | Version  |
| --------------------------------------------- | -------- |
| `/sap/opu/odata/sap/<SERVICE>/`               | OData V2 |
| `/sap/opu/odata4/sap/<SERVICE>/srvd_a2x/sap/` | OData V4 |

```bash
playwright-cli -s=sap run-code "async page => {
  const result = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    if (!view) return 'No view found';
    const model = bridge.getById(view.id).getModel();
    if (!model) return 'No model found';
    const url = model.sServiceUrl || model.getServiceUrl?.() || '';
    return {
      serviceUrl: url,
      version: url.includes('odata4') || url.includes('srvd_a2x') ? 'V4' : 'V2'
    };
  });
  return result;
}"
```

---

## Read Model Data

Read data from the UI5 OData model cache. This does NOT make network requests;
it reads what the model has already loaded.

**Read a single property**:

```bash
playwright-cli -s=sap run-code "async page => {
  const value = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    const model = bridge.getById(view.id).getModel();
    return model.getProperty('/PurchaseOrder');
  });
  return value;
}"
```

**Read an entity at a path** (V2):

```bash
playwright-cli -s=sap run-code "async page => {
  const data = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    const model = bridge.getById(view.id).getModel();
    return model.getProperty(\"/PurchaseOrderSet('4500001234')\");
  });
  return data;
}"
```

**Read all loaded entities at a path**:

```bash
playwright-cli -s=sap run-code "async page => {
  const data = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    const model = bridge.getById(view.id).getModel();
    const list = model.getProperty('/PurchaseOrderSet');
    if (!list) return 'Path not loaded in model';
    return { count: list.length, first: list[0] };
  });
  return data;
}"
```

**Read from a named model** (not the default model):

```bash
playwright-cli -s=sap run-code "async page => {
  const data = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    const model = bridge.getById(view.id).getModel('i18n');
    if (!model) return 'Named model not found';
    return model.getProperty('/appTitle');
  });
  return data;
}"
```

---

## Read Entity Set

Fetch entities from the OData service via the model's `read()` (V2) or
`bindList()` (V4) methods. These make actual network requests.

### OData V2: `oModel.read()`

```bash
playwright-cli -s=sap run-code "async page => {
  const data = await page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const bridge = window.__praman_bridge;
      const view = bridge.getByType('sap.ui.core.mvc.View')[0];
      const model = bridge.getById(view.id).getModel();
      model.read('/PurchaseOrderSet', {
        urlParameters: {
          '$top': '5',
          '$filter': \"CompanyCode eq '1000'\"
        },
        success: (data) => resolve({
          count: data.results.length,
          results: data.results.map(r => ({
            PurchaseOrder: r.PurchaseOrder,
            Supplier: r.Supplier,
            CompanyCode: r.CompanyCode
          }))
        }),
        error: (err) => reject(err.message || 'Read failed')
      });
    });
  });
  return data;
}"
```

### OData V4: `oModel.bindList()`

```bash
playwright-cli -s=sap run-code "async page => {
  const data = await page.evaluate(async () => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    const model = bridge.getById(view.id).getModel();
    const listBinding = model.bindList('/PurchaseOrder', undefined, undefined, [
      new sap.ui.model.Filter('CompanyCode', 'EQ', '1000')
    ]);
    const contexts = await listBinding.requestContexts(0, 5);
    return contexts.map(ctx => ctx.getObject());
  });
  return data;
}"
```

---

## Get CSRF Token

CSRF tokens are required for write operations (POST, PATCH, DELETE) on SAP
OData services.

### Via OData Model (V2)

```bash
playwright-cli -s=sap run-code "async page => {
  const token = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    const model = bridge.getById(view.id).getModel();
    return model.getSecurityToken();
  });
  return { csrfToken: token };
}"
```

### Via HTTP Fetch Header

```bash
playwright-cli -s=sap run-code "async page => {
  const token = await page.evaluate(async () => {
    const serviceUrl = '/sap/opu/odata/sap/MM_PUR_PO_MAINT_V2_SRV/';
    const response = await fetch(serviceUrl, {
      method: 'GET',
      headers: {
        'X-CSRF-Token': 'Fetch',
        'Accept': 'application/json'
      }
    });
    return response.headers.get('X-CSRF-Token');
  });
  return { csrfToken: token };
}"
```

> **NOTE**: CSRF tokens are tied to the session. If the session expires, the
> token becomes invalid. Always fetch a fresh token before write operations.

---

## Check Pending Changes

Determine if the OData model has unsaved changes (dirty state).

### OData V2

```bash
playwright-cli -s=sap run-code "async page => {
  const result = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    const model = bridge.getById(view.id).getModel();
    return {
      hasPendingChanges: model.hasPendingChanges(),
      pendingRequests: model.hasPendingRequests(),
      deferredGroups: model.getDeferredGroups?.() || []
    };
  });
  return result;
}"
```

### OData V4

```bash
playwright-cli -s=sap run-code "async page => {
  const result = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    const model = bridge.getById(view.id).getModel();
    return {
      hasPendingChanges: model.hasPendingChanges(),
      pendingRequests: model.hasPendingRequests?.() ?? 'N/A'
    };
  });
  return result;
}"
```

---

## Wait for OData Load

Poll until the OData model has finished all pending requests. Use this after
navigating to a page or triggering a data refresh.

```bash
playwright-cli -s=sap run-code "async page => {
  await page.waitForFunction(() => {
    const bridge = window.__praman_bridge;
    const views = bridge.getByType('sap.ui.core.mvc.View');
    if (views.length === 0) return false;
    const model = bridge.getById(views[0].id).getModel();
    if (!model) return false;
    return !model.hasPendingRequests();
  }, { timeout: 60000 });
  return 'OData model loaded, no pending requests';
}"
```

**Wait for a specific entity to be loaded**:

```bash
playwright-cli -s=sap run-code "async page => {
  await page.waitForFunction(() => {
    const bridge = window.__praman_bridge;
    const views = bridge.getByType('sap.ui.core.mvc.View');
    if (views.length === 0) return false;
    const model = bridge.getById(views[0].id).getModel();
    if (!model) return false;
    const data = model.getProperty(\"/PurchaseOrderSet('4500001234')\");
    return data !== undefined && data !== null;
  }, { timeout: 60000 });
  return 'Entity loaded in model';
}"
```

**Combined pattern: navigate + wait for data**:

```bash
playwright-cli -s=sap run-code "async page => {
  // Navigate
  await page.evaluate(() => {
    window.hasher.setHash('PurchaseOrder-manage');
  });

  // Wait for bridge
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );

  // Wait for OData model to finish loading
  await page.waitForFunction(() => {
    const bridge = window.__praman_bridge;
    const views = bridge.getByType('sap.ui.core.mvc.View');
    if (views.length === 0) return false;
    const model = bridge.getById(views[0].id).getModel();
    if (!model) return false;
    return !model.hasPendingRequests();
  }, { timeout: 60000 });

  // Read loaded data
  const result = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const view = bridge.getByType('sap.ui.core.mvc.View')[0];
    const model = bridge.getById(view.id).getModel();
    const data = model.getProperty('/PurchaseOrderSet');
    return data ? { count: data.length } : { count: 0, note: 'No data at path' };
  });
  return result;
}"
```

---

## Write Operations Note

Write operations (create, update, delete) via `run-code` are possible but
**not recommended** for test automation. They bypass the UI layer and can
leave the application in an inconsistent state (dirty model, unsaved changes
dialog, stale bindings).

**For write operations, use Praman fixtures in test code instead**:

```typescript
// In a Playwright test file — NOT via CLI
import { test, expect } from 'playwright-praman';

test('create purchase order', async ({ ui5 }) => {
  // Praman fixtures handle CSRF tokens, model refresh, and UI state
  await ui5.odata.createEntity(serviceUrl, 'PurchaseOrderSet', payload);
});
```

**If you must use `run-code` for writes** (e.g., seeding test data), always:

1. Fetch a fresh CSRF token first.
2. Call `model.submitChanges()` (V2) or `model.submitBatch()` (V4) after the write.
3. Verify the write succeeded by reading back the data.
4. Be aware that the UI will not automatically reflect changes made at the model
   level. Trigger a model refresh or page reload after writes.

> **WARNING**: `console.log()` inside `run-code` is silently swallowed. Always
> use `return` to produce output from `run-code` commands.

> **WARNING**: When using `snapshot` in agent workflows, always use the
> `--filename` flag (e.g., `snapshot --filename=snap.yml`) to get a file
> reference (~200 tokens) instead of inlined YAML.
