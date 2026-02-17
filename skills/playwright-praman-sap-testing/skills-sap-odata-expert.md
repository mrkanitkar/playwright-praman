# Skill File: SAP OData & Gateway Expert Agent

## Praman v1.0 — AI-First SAP UI5 Test Automation Platform

| Property            | Value                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| **Role**            | SAP OData & Gateway Expert — Service Testing & Data Integration              |
| **Skill ID**        | PRAMAN-SKILL-SAP-ODATA-EXPERT-001                                            |
| **Version**         | 1.0.0                                                                        |
| **Authority Level** | Domain — final authority on OData protocol, SAP Gateway, and data validation |
| **Parent Docs**     | plan.md (D3, D19), skills-sap-ui5-expert.md, skills-sap-fiori-consultant.md  |

---

## 1. Role Definition

You are the **SAP OData & Gateway Expert** for Praman v1.0. You specialize in the data layer that powers every SAP Fiori application. You have deep expertise in:

1. **OData V2 Protocol** — entity sets, navigation properties, function imports, deep entities, batch, $expand/$filter
2. **OData V4 Protocol** — bound/unbound actions, $apply aggregation, $compute, draft handling, side effects
3. **SAP Gateway (SEGW)** — service registration, MPC/DPC classes, annotations, entity type mapping
4. **CAP (Cloud Application Programming Model)** — CDS models, service handlers, draft orchestration
5. **SAP Fiori OData Annotations** — UI.LineItem, UI.HeaderInfo, UI.FieldGroup, UI.DataField
6. **OData Model Binding in UI5** — JSONModel, ODataModel v2/v4, property/list/context binding
7. **CSRF Token Management** — X-CSRF-Token fetch, cookie-based session, token refresh patterns
8. **$batch Protocol** — changeset boundaries, atomicity, error handling within batch
9. **OData Error Response Format** — SAP-specific error structures, BAPI messages, message classes
10. **MockServer & CAP Mock** — hermetic test data, in-memory simulation, fixture data

You advise on how OData services interact with UI5 and how to validate data flows in Praman tests. You DO:

- Design OData request/response validation patterns
- Define mock strategies for OData services (route interception, MockServer, CAP mock)
- Specify $batch validation patterns
- Guide CSRF token handling in test automation
- Map OData annotations to expected UI rendering
- Review OData-related test patterns for protocol correctness
- Define performance test patterns for OData (payload size, pagination, $expand depth)

---

## 2. OData Protocol Deep Knowledge

### 2.1 OData V2 — Request/Response Anatomy

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                      ODATA V2 REQUEST LIFECYCLE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. METADATA REQUEST (once per model initialization)                    │
│     GET /sap/opu/odata/sap/API_PURCHASEORDER_SRV/$metadata             │
│     → Returns: EDMX document (entity types, associations, function imports)│
│                                                                         │
│  2. CSRF TOKEN FETCH (before any modifying request)                     │
│     HEAD /sap/opu/odata/sap/API_PURCHASEORDER_SRV/                     │
│     Headers: X-CSRF-Token: Fetch                                        │
│     ← Returns: X-CSRF-Token: <token-value>, Set-Cookie: sap-contextid  │
│                                                                         │
│  3. ENTITY READ (single entity by key)                                  │
│     GET /sap/opu/odata/sap/API_PURCHASEORDER_SRV/A_PurchaseOrder('123')│
│     Optional: $expand=to_PurchaseOrderItem&$select=PurchaseOrder,Supplier│
│     ← Returns: { d: { PurchaseOrder: '123', Supplier: 'ACME' } }       │
│                                                                         │
│  4. COLLECTION READ (entity set with filters)                           │
│     GET .../A_PurchaseOrder?$filter=Supplier eq 'ACME'&$top=20&$skip=0 │
│     ← Returns: { d: { results: [...], __count: '42' } }                │
│                                                                         │
│  5. ENTITY CREATE (POST)                                                │
│     POST .../A_PurchaseOrder                                            │
│     Headers: X-CSRF-Token: <token>, Content-Type: application/json      │
│     Body: { PurchaseOrder: '', Supplier: 'ACME', ... }                  │
│     ← Returns: { d: { PurchaseOrder: '456', ... } } (201 Created)      │
│                                                                         │
│  6. ENTITY UPDATE (PUT/MERGE)                                           │
│     MERGE .../A_PurchaseOrder('123')                                    │
│     Headers: X-CSRF-Token, If-Match: W/"datetimeoffset'...'"           │
│     Body: { Supplier: 'NewSupplier' } (partial update with MERGE)       │
│     ← Returns: 204 No Content                                          │
│                                                                         │
│  7. ENTITY DELETE                                                       │
│     DELETE .../A_PurchaseOrder('123')                                   │
│     Headers: X-CSRF-Token, If-Match: *                                  │
│     ← Returns: 204 No Content                                          │
│                                                                         │
│  8. FUNCTION IMPORT (action)                                            │
│     POST .../Release?PurchaseOrder='123'                                │
│     ← Returns: { d: { PurchaseOrder: '123', Status: 'Released' } }     │
│                                                                         │
│  9. $BATCH (multiple operations in single HTTP request)                 │
│     POST .../API_PURCHASEORDER_SRV/$batch                               │
│     Content-Type: multipart/mixed; boundary=batch_xxx                   │
│     Body: multiple changesets with individual operations                 │
│     ← Returns: multipart response with individual status codes          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 OData V4 — Key Differences from V2

| Feature           | OData V2                          | OData V4                                   |
| ----------------- | --------------------------------- | ------------------------------------------ |
| **JSON format**   | `{ d: { results: [...] } }`       | `{ value: [...] }` (no `d` wrapper)        |
| **Create**        | `model.create(path, data)`        | `listBinding.create(data)` → Promise       |
| **Update**        | `model.update(path, data)`        | Context-based `setProperty()` + auto-PATCH |
| **Batch**         | Explicit `submitChanges()`        | Auto-batch with `$auto` group ID           |
| **Deep Create**   | POST with nested `to_Items: [..]` | POST with `@odata.bind` or inline          |
| **Draft**         | Custom implementation             | Built-in `DraftRoot` + `DraftNode`         |
| **Aggregation**   | Not native                        | `$apply=groupby((...),aggregate(...))`     |
| **Bound Actions** | Function Import (global)          | `POST .../Entity(...)/Action`              |
| **Side Effects**  | Manual refresh                    | `SideEffects` annotation → auto-refresh    |
| **$count**        | `$inlinecount=allpages`           | `$count=true` (boolean in URL)             |
| **Null handling** | Omitted in response               | Explicit `null` in response                |
| **ETag**          | `If-Match` header                 | `If-Match` header (same, different format) |
| **Metadata**      | EDMX/XML                          | `$metadata` returns CSDL JSON or XML       |

### 2.3 Draft Protocol (OData V4 with Fiori Elements)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    DRAFT LIFECYCLE (OData V4)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CREATE FLOW:                                                           │
│  1. POST .../Entity → creates draft instance (IsActiveEntity=false)     │
│  2. User fills fields → auto-PATCH to draft (implicit save)            │
│  3. POST .../Entity(...)/draftActivate → activates draft                │
│     ← Returns: active entity (IsActiveEntity=true)                      │
│                                                                         │
│  EDIT FLOW:                                                             │
│  1. POST .../Entity(key,IsActiveEntity=true)/draftEdit                  │
│     ← Returns: draft copy (IsActiveEntity=false)                        │
│  2. User edits fields → auto-PATCH to draft                            │
│  3. POST .../draftActivate → merges changes to active entity            │
│                                                                         │
│  DISCARD:                                                               │
│  1. DELETE .../Entity(key,IsActiveEntity=false)                         │
│     Deletes draft, active entity unchanged                              │
│                                                                         │
│  DRAFT LOCK:                                                            │
│  - While draft exists, other users see "locked by <user>"              │
│  - DraftAdministrativeData provides lock info                           │
│  - Session timeout → draft preserved (30 min default)                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. OData Validation Patterns for Praman

### 3.1 Metadata Validation

```typescript
// Pattern: Validate service metadata is accessible and correct
test('should load OData service metadata', async ({ page, ui5 }) => {
  await test.step('Verify metadata loaded', async () => {
    const metadata = await page.evaluate(() => {
      const model = sap.ui.getCore().getModel();
      const metaModel = model.getMetaModel();
      return {
        loaded: metaModel.isLoaded(),
        entitySets: Object.keys(metaModel.getObject('/') || {}),
      };
    });

    expect(metadata.loaded).toBe(true);
    expect(metadata.entitySets).toContain('PurchaseOrderSet');
  });
});
```

### 3.2 Request Payload Validation

```typescript
// Pattern: Validate OData requests sent by the UI
test('should send correct filter in OData request', async ({ page, ui5 }) => {
  const capturedRequests: string[] = [];

  await page.route('**/odata/**', async (route) => {
    const url = route.request().url();
    if (url.includes('$filter')) {
      capturedRequests.push(url);
    }
    await route.continue();
  });

  await test.step('Apply filter in SmartFilterBar', async () => {
    const comboBox = await ui5.control({
      controlType: 'sap.m.ComboBox',
      id: /statusFilter/,
    });
    await comboBox.setSelectedKey('A');

    const goBtn = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'Go' },
    });
    await goBtn.press();
    await ui5.waitForUI5Stable();
  });

  await test.step('Validate $filter parameter', async () => {
    expect(capturedRequests.length).toBeGreaterThan(0);
    const filterUrl = capturedRequests[0];
    expect(filterUrl).toContain("$filter=Status%20eq%20'A'");
  });
});
```

### 3.3 Batch Request Validation

```typescript
// Pattern: Validate $batch operations
test('should send batch request on bulk save', async ({ page, ui5 }) => {
  const batchRequests: Array<{ method: string; body: string | null }> = [];

  await page.route('**/$batch', async (route) => {
    const body = route.request().postData();
    batchRequests.push({
      method: route.request().method(),
      body,
    });
    await route.continue();
  });

  await test.step('Perform bulk edit and save', async () => {
    // ... edit multiple items
    await ui5.waitForUI5Stable();
  });

  await test.step('Validate batch request structure', async () => {
    expect(batchRequests.length).toBeGreaterThan(0);
    const batchBody = batchRequests[0]?.body ?? '';
    // V2 batch uses multipart/mixed
    expect(batchBody).toContain('Content-Type: application/http');
    // Should contain PATCH or MERGE operations
    expect(batchBody).toMatch(/PATCH|MERGE/);
  });
});
```

### 3.4 Error Response Handling

```typescript
// Pattern: Validate UI behavior on OData error
test('should display BAPI error message from OData response', async ({ page, ui5 }) => {
  // Simulate SAP Gateway error format
  await page.route('**/A_PurchaseOrder', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: {
            code: '/IWBEP/CM_MGW_RT/029',
            message: {
              lang: 'en',
              value: 'Error while creating purchase order',
            },
            innererror: {
              errordetails: [
                {
                  code: 'MM/001',
                  message: 'Material MAT999 does not exist',
                  severity: 'error',
                  target: 'Material',
                },
                {
                  code: 'MM/002',
                  message: 'Quantity must be greater than 0',
                  severity: 'error',
                  target: 'Quantity',
                },
              ],
            },
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  await test.step('Trigger save → should show error', async () => {
    // ... fill form and save
    await ui5.waitForUI5Stable();
  });

  await test.step('Verify error messages displayed', async () => {
    // SAP UI5 shows errors in MessageView or MessageDialog
    const messageBtn = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { icon: 'sap-icon://message-popup' },
    });
    // Message button shows error count
    expect(messageBtn).toBeDefined();
  });
});
```

---

## 4. OData Model Interaction in Browser Context

### 4.1 Reading Data from UI5 Models

```typescript
// Pattern: Access OData model data from browser context
async function getModelData(page: Page, modelName: string, path: string): Promise<unknown> {
  return page.evaluate(
    ({ model, entityPath }) => {
      const oModel = model ? sap.ui.getCore().getModel(model) : sap.ui.getCore().getModel();

      if (!oModel) {
        return { error: `Model '${model}' not found` };
      }

      // V2: synchronous getProperty
      if (typeof oModel.getProperty === 'function') {
        return oModel.getProperty(entityPath);
      }

      return { error: 'Cannot read model data' };
    },
    { model: modelName, entityPath: path },
  );
}
```

### 4.2 OData V4 Context Binding

```typescript
// Pattern: Read from OData V4 context binding (Fiori Elements pattern)
async function getV4ContextData(page: Page, bindingPath: string): Promise<unknown> {
  return page.evaluate(
    ({ path }) => {
      // In Fiori Elements, the ObjectPage has a context binding
      const view = sap.ui.getCore().byId(document.querySelector('[data-sap-ui-area]')?.id ?? '');
      if (!view) return { error: 'View not found' };

      const binding = view.getObjectBinding?.() ?? view.getBindingContext?.();
      if (!binding) return { error: 'No binding context' };

      return binding.getObject(path);
    },
    { path: bindingPath },
  );
}
```

### 4.3 Pending Changes Detection

```typescript
// Pattern: Check for unsaved changes (draft indicator)
async function hasPendingChanges(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const model = sap.ui.getCore().getModel();
    if (!model) return false;

    // OData V2
    if (typeof model.hasPendingChanges === 'function') {
      return model.hasPendingChanges();
    }

    // OData V4
    if (typeof model.hasPendingChanges === 'function') {
      return model.hasPendingChanges();
    }

    return false;
  });
}
```

---

## 5. SAP Gateway Error Taxonomy

### 5.1 Error Code Categories

| Code Prefix       | Source                | Example                                         |
| ----------------- | --------------------- | ----------------------------------------------- |
| `/IWBEP/CM_MGW_*` | SAP Gateway runtime   | `/IWBEP/CM_MGW_RT/029` — entity creation error  |
| `/IWBEP/CX_MGW_*` | SAP Gateway exception | `/IWBEP/CX_MGW_BUSI_EXCEPTION` — business error |
| `BAPI/*`          | BAPI return messages  | `BAPI/001` — general BAPI error                 |
| `MM/*`            | Materials Management  | `MM/001` — material does not exist              |
| `SD/*`            | Sales & Distribution  | `SD/001` — credit limit exceeded                |
| `FI/*`            | Financial Accounting  | `FI/001` — posting period not open              |
| `SY/*`            | SAP System messages   | `SY/530` — authorization check failed           |
| Custom            | Z-namespace           | `ZCUSTOM/001` — custom validation error         |

### 5.2 SAP Error Response Structures

```typescript
// OData V2 error format
interface ODataV2Error {
  error: {
    code: string;
    message: {
      lang: string;
      value: string;
    };
    innererror: {
      application: { component_id: string; service_namespace: string };
      transactionid: string;
      timestamp: string;
      Error_Resolution: { SAP_Transaction: string; SAP_Note: string };
      errordetails: Array<{
        code: string;
        message: string;
        propertyref: string;
        severity: 'error' | 'warning' | 'info';
        target: string;
      }>;
    };
  };
}

// OData V4 error format
interface ODataV4Error {
  error: {
    code: string;
    message: string;
    target?: string;
    details?: Array<{
      code: string;
      message: string;
      target?: string;
      '@Common.numericSeverity'?: number; // 1=success, 2=info, 3=warning, 4=error
    }>;
  };
}
```

---

## 6. SAP OData Vocabulary System — Metadata-Driven UI

### VERIFIED: SAP OData provides rich metadata about UI controls for business flows

**Source**: [github.com/SAP/odata-vocabularies](https://github.com/SAP/odata-vocabularies) (official SAP repository)
**Namespace prefix**: `com.sap.vocabularies.<Name>.v1`

SAP maintains **18+ formal OData vocabularies** that extend the OASIS OData standard.
These vocabularies contain **annotations** — metadata declarations attached to OData entity types,
entity sets, properties, and actions — that tell Fiori Elements UIs **exactly which controls to render,
what data to display, how to lay out pages, which fields are filterable/sortable, and which actions
are available**. This is SAP's metadata-driven approach: the backend service defines not just the data
model but also the UI semantics, and Fiori Elements interprets these annotations to generate the UI
at runtime without writing custom UI code.

**This is fundamental for Praman test automation**: by reading OData annotations, Praman can
predict which controls should exist, their labels, visibility, and behavior — enabling
annotation-driven test generation and validation.

### 6.1 SAP OData Vocabulary Catalog (18+ Vocabularies)

| Vocabulary        | Namespace                               | Purpose for Test Automation                                       |
| ----------------- | --------------------------------------- | ----------------------------------------------------------------- |
| **UI**            | `com.sap.vocabularies.UI.v1`            | **PRIMARY**: Maps OData entities to UI controls and layouts       |
| **Common**        | `com.sap.vocabularies.Common.v1`        | Labels, value lists (F4), field control, semantic objects, drafts |
| **Communication** | `com.sap.vocabularies.Communication.v1` | Contact cards, addresses, phone/email rendering                   |
| **Analytics**     | `com.sap.vocabularies.Analytics.v1`     | Analytical queries, measures, dimensions for charts               |
| **HTML5**         | `com.sap.vocabularies.HTML5.v1`         | CSS defaults, responsive table behavior, column width             |
| **Capabilities**  | `Org.OData.Capabilities.V1`             | CRUD restrictions → button visibility (Create/Edit/Delete)        |
| **DirectEdit**    | `com.sap.vocabularies.DirectEdit.v1`    | In-place editing behavior                                         |
| **Hierarchy**     | `com.sap.vocabularies.Hierarchy.v1`     | Tree table rendering, recursive hierarchies                       |
| **PersonalData**  | `com.sap.vocabularies.PersonalData.v1`  | GDPR-relevant: field sensitivity levels                           |
| **Session**       | `com.sap.vocabularies.Session.v1`       | Sticky session handling for draft-like patterns                   |
| **CodeList**      | `com.sap.vocabularies.CodeList.v1`      | Standard code values (currencies, units, countries)               |
| **PDF**           | `com.sap.vocabularies.PDF.v1`           | PDF output configuration                                          |
| **Offline**       | `com.sap.vocabularies.Offline.v1`       | Offline capability metadata                                       |

### 6.2 UI Vocabulary — The Control Metadata Layer (85+ Terms)

The **UI Vocabulary** (`com.sap.vocabularies.UI.v1`) is the most critical for test automation.
It contains ~85 terms across 1200+ lines that define how OData entity data maps to UI controls.

#### 6.2.1 Page Layout Annotations → Control Structure

| UI Vocabulary Term                | Fiori Elements Control                  | What Praman Should Validate                      |
| --------------------------------- | --------------------------------------- | ------------------------------------------------ |
| `UI.HeaderInfo`                   | ObjectPage header (title, subtitle)     | Header title/description text + entity type name |
| `UI.HeaderFacets`                 | ObjectPage header facets                | Header micro charts, KPIs, status indicators     |
| `UI.Facets`                       | ObjectPage sections & subsections       | Section labels, order, and nested content        |
| `UI.CollectionFacet`              | Section grouping container              | Grouped facets rendered as subsections           |
| `UI.ReferenceFacet`               | Section referencing LineItem/FieldGroup | Target annotation resolved to correct control    |
| `UI.Identification`               | Object identification fields            | Fields identifying the business object           |
| `UI.FieldGroup`                   | Form field groups in sections           | Grouped fields with label, correct field order   |
| `UI.LineItem`                     | Table columns (List Report / sub-table) | Column count, headers, order match annotation    |
| `UI.SelectionFields`              | Filter bar fields                       | Filter bar contains annotated properties         |
| `UI.Chart`                        | Chart visualization                     | Chart type, measures, dimensions match           |
| `UI.DataPoint`                    | KPI / micro chart / progress bar        | Value, target, trend, criticality color          |
| `UI.KPI`                          | KPI card / tile                         | Selection + DataPoint + drill-down               |
| `UI.PresentationVariant`          | Sort order, grouping, visualizations    | Default sort, initial grouping, max items        |
| `UI.SelectionVariant`             | Predefined filter combinations          | Parameters and select options                    |
| `UI.SelectionPresentationVariant` | Combined filter + display config        | Bundled selection + presentation                 |

#### 6.2.2 Field-Level Annotations → Control Properties

| UI Vocabulary Term                     | Effect on UI Control                  | Test Validation Pattern                         |
| -------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| `UI.DataField`                         | Simple value display in table/form    | Property value rendered as text/link            |
| `UI.DataFieldForAnnotation`            | Complex field (chart, contact, etc.)  | Embedded chart/micro chart/contact card         |
| `UI.DataFieldForAction`                | Action button in table row/header     | Button visible with correct label               |
| `UI.DataFieldForIntentBasedNavigation` | Navigation link (cross-app)           | Link rendered, semantic object mapping correct  |
| `UI.DataFieldWithUrl`                  | Hyperlink field                       | URL navigation works                            |
| `UI.Hidden`                            | Field/facet not rendered              | Element absent from DOM                         |
| `UI.HiddenFilter`                      | Property hidden from filter bar       | Not in filter bar but in table columns          |
| `UI.CreateHidden`                      | Dynamic Create button visibility      | Create button shown/hidden based on context     |
| `UI.UpdateHidden`                      | Dynamic Edit button visibility        | Edit button shown/hidden based on context       |
| `UI.DeleteHidden`                      | Dynamic Delete button visibility      | Delete button shown/hidden based on context     |
| `UI.Importance`                        | Field priority (High/Medium/Low)      | High-importance fields visible on small screens |
| `UI.MultiLineText`                     | Multi-line text area instead of input | TextArea control rendered (not Input)           |
| `UI.TextArrangement`                   | Code/text display order               | TextFirst, TextLast, TextOnly, TextSeparate     |
| `UI.IsImageURL`                        | Image rendered from URL               | Avatar/Image control shows image                |
| `UI.Placeholder`                       | Input placeholder text                | Placeholder text matches annotation             |

#### 6.2.3 Criticality & Semantic Coloring

| Criticality Value | Semantic Color | Typical Business Meaning                 |
| ----------------- | -------------- | ---------------------------------------- |
| `0` (Neutral)     | Grey           | Inactive, Open, In Progress              |
| `1` (Negative)    | Red            | Error, Attention, Overdue, Alert         |
| `2` (Critical)    | Orange         | Warning, Needs Review                    |
| `3` (Positive)    | Green          | Completed, Available, On Track, Approved |

Criticality can be:

- **Static** (`UI.Criticality` → fixed value from service)
- **Calculated** (`UI.CriticalityCalculation` → client calculates from thresholds)
- **Per-DataField** (`DataField.Criticality` → applied to individual field)

#### 6.2.4 Chart Types in UI Vocabulary (38 Types)

The UI vocabulary defines 38 chart types for `UI.Chart` annotations:
Column, ColumnStacked, Bar, BarStacked, Area, Line, LineDual, Combination,
Pie, Donut, Scatter, Bubble, Radar, HeatMap, TreeMap, Waterfall, Bullet, etc.

Each chart annotation specifies: `ChartType`, `Measures[]`, `Dimensions[]`,
`MeasureAttributes[]`, `DimensionAttributes[]`, and optional `AxisScaling`.

#### 6.2.5 DataField Type Hierarchy

```text
DataFieldAbstract (base — Label, Criticality, IconUrl)
├── DataField (Value: PrimitiveType)
│   ├── DataFieldWithAction (Value + Action trigger)
│   ├── DataFieldWithIntentBasedNavigation (Value + SemanticObject navigation)
│   ├── DataFieldWithNavigationPath (Value + navigation property link)
│   ├── DataFieldWithUrl (Value + URL hyperlink)
│   └── DataFieldWithActionGroup (Value + action collection)
├── DataFieldForAnnotation (Target → Chart/DataPoint/FieldGroup/Contact)
├── DataFieldForAction (Action button, not tied to data value)
│   └── DataFieldForIntentBasedNavigation (Semantic Object navigation button)
└── DataFieldForActionGroup (Collection of action buttons)
```

### 6.3 Common Vocabulary — Data Semantics & Value Help

The **Common Vocabulary** (`com.sap.vocabularies.Common.v1`) provides cross-cutting terms
used by all SAP OData services:

| Common Term                       | Purpose                                              | Test Impact                                         |
| --------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `Common.Label`                    | Human-readable property label                        | Verify UI labels match annotation                   |
| `Common.Text`                     | Descriptive text for code values                     | Code→text resolution (e.g., "US" → "United States") |
| `Common.TextArrangement`          | How code+text are displayed                          | TextFirst, TextLast, TextOnly, TextSeparate         |
| `Common.ValueList`                | Value help (F4) configuration                        | Value help dialog opens with correct columns        |
| `Common.ValueListWithFixedValues` | Dropdown instead of F4 dialog                        | Dropdown rendered (not dialog)                      |
| `Common.ValueListMapping`         | Maps local→value list properties                     | Correct filtering and filling from selection        |
| `Common.FieldControl`             | Mandatory(7)/Optional(3)/ReadOnly(1)/Inapplicable(0) | Required field asterisk, disabled state             |
| `Common.SemanticObject`           | Cross-app navigation target                          | Navigation link resolves correctly                  |
| `Common.SemanticKey`              | Business-meaningful key (vs technical key)           | Displayed as entity identifier                      |
| `Common.SideEffects`              | Auto-refresh after property changes                  | Related fields refresh after user input             |
| `Common.DraftRoot`                | Identifies draft-enabled entity root                 | Draft editing lifecycle works                       |
| `Common.IsNaturalPerson`          | GDPR: entity represents a person                     | Privacy-relevant data handling                      |
| `Common.Masked`                   | Sensitive data (masked by default)                   | Field shows masked value, reveals on demand         |
| `Common.FilterDefaultValue`       | Default filter value                                 | Filter bar pre-populated with defaults              |
| `Common.SortOrder`                | Default sort criteria                                | List sorted correctly on initial load               |

### 6.4 Annotation Flow: Backend → Metadata → UI Controls

```text
┌──────────────────────────────────────────────────────────────────────┐
│              ANNOTATION-DRIVEN UI RENDERING PIPELINE                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CDS MODEL (Backend / CAP)                                        │
│     annotate SalesOrder with @UI: {                                  │
│       HeaderInfo: { TypeName: 'Sales Order',                         │
│                     Title: { Value: SalesOrderID },                  │
│                     Description: { Value: CustomerName } },          │
│       LineItem: [                                                    │
│         { Value: SalesOrderID, Label: 'Order' },                    │
│         { Value: GrossAmount, Criticality: StatusCriticality },     │
│         { $Type: 'UI.DataFieldForAction', Action: 'approve' }       │
│       ],                                                             │
│       SelectionFields: [ CustomerID, Status, OrderDate ]             │
│     };                                                               │
│                          ↓                                           │
│  2. ODATA $metadata + annotation files                               │
│     GET /sap/opu/odata/v4/API_SALES_ORDER/$metadata                 │
│     → Returns EDMX with inline annotations or                       │
│     → References external annotation XML files                      │
│     → UI5 also supports separate annotation files (annotations.xml)  │
│                          ↓                                           │
│  3. FIORI ELEMENTS TEMPLATE INTERPRETS ANNOTATIONS                   │
│     ListReport reads: UI.LineItem → renders sap.m.Table columns      │
│                        UI.SelectionFields → renders filter bar       │
│                        UI.Chart → renders sap.viz.ui5.controls.VizFrame│
│     ObjectPage reads: UI.HeaderInfo → renders ObjectPageHeader       │
│                        UI.Facets → renders ObjectPageSection[]       │
│                        UI.FieldGroup → renders SimpleForm fields     │
│                          ↓                                           │
│  4. RENDERED UI CONTROLS (what Praman tests)                         │
│     sap.m.Table with N columns matching UI.LineItem[N]               │
│     sap.m.ObjectHeader with title from HeaderInfo.Title.Value        │
│     sap.uxap.ObjectPageSection[] matching UI.Facets[]                │
│     sap.m.Button[] for UI.DataFieldForAction entries                 │
│     Filter bar with sap.ui.comp.filterbar.FilterBar fields           │
│                                                                      │
│  ✅ PRAMAN CAN: Read $metadata annotations → predict expected UI     │
│  ✅ PRAMAN CAN: Compare rendered controls vs annotation expectations │
│  ✅ PRAMAN CAN: Auto-generate test assertions from annotations       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.5 Annotation Sources (Where Annotations Come From)

| Source                           | OData V2                                      | OData V4                                  |
| -------------------------------- | --------------------------------------------- | ----------------------------------------- |
| Inline `$metadata`               | `sap:label`, `sap:filterable`, etc.           | Full CSDL annotations in `$metadata`      |
| Separate annotation file         | `annotations.xml` referenced in manifest.json | `$metadata` references + annotation files |
| CDS annotations (CAP/ABAP CDS)   | Transformed to V2 `sap:*` attributes          | Emitted as proper OData V4 annotations    |
| SEGW annotations (Gateway)       | MPC_EXT annotation model                      | N/A (SEGW is V2-only)                     |
| Local annotation files (UI5 app) | `manifest.json` → `sap.app.dataSources`       | `manifest.json` → `sap.app.dataSources`   |

**Binding syntax in UI5** for metadata annotations:

```xml
<!-- Bind to a metadata annotation value -->
<Text text="{/#Product/Name/@com.sap.vocabularies.Common.v1.Label}" />
<!-- Shorthand for sap: namespace (V2 only) -->
<Text text="{/#Product/Name/@sap:label}" />
```

### 6.6 Key Annotations for Test Validation (Quick Reference)

| Annotation                        | Purpose                                 | Test Validation                         |
| --------------------------------- | --------------------------------------- | --------------------------------------- |
| `UI.LineItem`                     | Table columns in List Report            | Verify columns match annotation order   |
| `UI.HeaderInfo`                   | Object Page header (title, description) | Verify header fields rendered correctly |
| `UI.FieldGroup`                   | Grouped fields in Object Page sections  | Verify field grouping and labels        |
| `UI.SelectionFields`              | Filter bar fields in List Report        | Verify filter fields available          |
| `UI.DataField`                    | Individual field rendering              | Verify field type and format            |
| `UI.Identification`               | Actions in Object Page header           | Verify action buttons visible           |
| `UI.Facets`                       | Page sections and subsections           | Verify section existence and order      |
| `UI.Chart`                        | Chart visualization                     | Verify chart type, measures, dimensions |
| `UI.DataPoint`                    | KPI / micro chart / status indicator    | Verify value, criticality color         |
| `UI.Criticality`                  | Semantic coloring (red/orange/green)    | Verify ObjectStatus color matches       |
| `UI.Hidden`                       | Conditionally hidden fields/facets      | Verify element absent from DOM          |
| `UI.CreateHidden`                 | Dynamic Create button visibility        | Verify Create button shown/hidden       |
| `UI.TextArrangement`              | Code/text display format                | Verify TextFirst/TextLast/TextOnly      |
| `UI.Importance`                   | Field priority (High/Medium/Low)        | High fields visible on narrow screens   |
| `Common.Label`                    | Field labels                            | Verify labels match annotation          |
| `Common.ValueList`                | Value help configuration                | Verify F4 help opens with correct data  |
| `Common.FieldControl`             | Mandatory/ReadOnly/Inapplicable         | Verify asterisk, disabled state         |
| `Common.SideEffects`              | Auto-refresh after changes              | Verify related fields refresh on change |
| `Capabilities.InsertRestrictions` | Create permission                       | Verify Create button visibility         |
| `Capabilities.UpdateRestrictions` | Edit permission                         | Verify Edit button visibility           |
| `Capabilities.DeleteRestrictions` | Delete permission                       | Verify Delete button visibility         |

### 6.7 Annotation-Driven Test Generation

```typescript
// Pattern: Generate test assertions from OData annotations
// This is a Phase 6+ concept for AI-driven test generation

interface AnnotationBasedAssertion {
  annotation: string;
  expectedBehavior: string;
  controlType: string;
  testPattern: string;
}

const ANNOTATION_TEST_MAP: AnnotationBasedAssertion[] = [
  {
    annotation: 'UI.LineItem',
    expectedBehavior: 'Table columns rendered in annotation order',
    controlType: 'sap.m.Table',
    testPattern: 'verify column count and headers match annotation',
  },
  {
    annotation: 'UI.HeaderInfo',
    expectedBehavior: 'ObjectPage header shows TypeName, Title, Description',
    controlType: 'sap.uxap.ObjectPageHeader',
    testPattern: 'verify header title text matches HeaderInfo.Title.Value',
  },
  {
    annotation: 'UI.SelectionFields',
    expectedBehavior: 'Filter bar contains annotated properties',
    controlType: 'sap.ui.comp.filterbar.FilterBar',
    testPattern: 'verify filter fields match SelectionFields array',
  },
  {
    annotation: 'UI.Facets',
    expectedBehavior: 'ObjectPage sections match facet definitions',
    controlType: 'sap.uxap.ObjectPageSection',
    testPattern: 'verify section count and labels match Facets array',
  },
  {
    annotation: 'UI.Chart',
    expectedBehavior: 'Chart rendered with correct type and measures',
    controlType: 'sap.viz.ui5.controls.VizFrame',
    testPattern: 'verify chart type, measure count, dimension count',
  },
  {
    annotation: 'UI.DataPoint/Criticality',
    expectedBehavior: 'Status indicator shows correct semantic color',
    controlType: 'sap.m.ObjectStatus',
    testPattern: 'verify status state (Error/Warning/Success) matches criticality',
  },
  {
    annotation: 'Common.ValueList',
    expectedBehavior: 'Value help dialog opens with correct columns',
    controlType: 'sap.ui.comp.valuehelpdialog.ValueHelpDialog',
    testPattern: 'trigger F4, verify columns from ValueList parameters',
  },
  {
    annotation: 'Common.FieldControl/Mandatory',
    expectedBehavior: 'Required field shows asterisk, validation on empty',
    controlType: 'sap.m.Input',
    testPattern: 'verify required property true, submit empty → error',
  },
  {
    annotation: 'Capabilities.InsertRestrictions/Insertable',
    expectedBehavior: 'Create button visible when Insertable=true',
    controlType: 'sap.m.Button',
    testPattern: 'find button with text "Create" and verify visibility',
  },
];
```

### 6.8 Praman Metadata-Driven Testing Strategy

```text
┌──────────────────────────────────────────────────────────────────────┐
│          PRAMAN ANNOTATION-AWARE TEST AUTOMATION                     │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Phase 1-3 (Current): Manual annotation knowledge in test scripts    │
│    → Developer writes: expect(columns).toHaveCount(5)                │
│    → Based on reading UI.LineItem in $metadata manually              │
│                                                                      │
│  Phase 4-5 (Planned): Bridge reads $metadata annotations             │
│    → Praman fetches and parses $metadata at test setup               │
│    → Bridge exposes: getAnnotations(entityType, term)                │
│    → Tests validate: UI matches annotation expectations              │
│                                                                      │
│  Phase 6+ (AI-Driven): Automatic test generation from annotations    │
│    → AI reads $metadata + annotations                                │
│    → Generates test assertions for every UI.LineItem column          │
│    → Generates test assertions for every UI.Facet section            │
│    → Validates Criticality colors match business rules               │
│    → Detects annotation changes → suggests test updates              │
│                                                                      │
│  KEY INSIGHT: In Fiori Elements apps, the annotation IS the spec.    │
│  If annotations say UI.LineItem has 5 columns, the table MUST have   │
│  5 columns. Any deviation is a bug.                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Performance Testing Patterns

### 7.1 OData Response Time Validation

```typescript
// Pattern: Measure and validate OData response times
test('should load entity set within performance budget', async ({ page, ui5 }) => {
  const timings: Array<{ url: string; duration: number }> = [];

  await page.route('**/odata/**', async (route) => {
    const start = Date.now();
    await route.continue();
    timings.push({
      url: route.request().url(),
      duration: Date.now() - start,
    });
  });

  await test.step('Load list report data', async () => {
    await page.goto(`${BASE_URL}#PurchaseOrder-manage`);
    await ui5.waitForUI5Stable();
  });

  await test.step('Validate response times', async () => {
    for (const timing of timings) {
      // OData requests should complete within 3 seconds
      expect(timing.duration).toBeLessThan(3000);
    }
  });
});
```

### 7.2 Payload Size Validation

```typescript
// Pattern: Validate OData response payload sizes
test('should not return oversized OData responses', async ({ page }) => {
  const payloads: Array<{ url: string; size: number }> = [];

  page.on('response', async (response) => {
    if (response.url().includes('/odata/')) {
      const body = await response.body();
      payloads.push({ url: response.url(), size: body.length });
    }
  });

  await page.goto(`${BASE_URL}#PurchaseOrder-manage`);

  // Validate no single response exceeds 1MB
  for (const payload of payloads) {
    expect(payload.size).toBeLessThan(1_048_576); // 1MB
  }
});
```

---

## 8. CSRF Token Test Patterns

### 8.1 Token Lifecycle Validation

```typescript
// Pattern: Verify CSRF token is fetched before write operations
test('should fetch CSRF token before POST', async ({ page, ui5 }) => {
  const tokenRequests: Array<{ method: string; headers: Record<string, string> }> = [];
  const writeRequests: Array<{ method: string; headers: Record<string, string> }> = [];

  await page.route('**/odata/**', async (route) => {
    const headers = route.request().headers();
    const method = route.request().method();

    if (headers['x-csrf-token'] === 'Fetch') {
      tokenRequests.push({ method, headers });
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE', 'MERGE'].includes(method)) {
      writeRequests.push({ method, headers });
    }

    await route.continue();
  });

  await test.step('Perform a write operation', async () => {
    // ... trigger save
    await ui5.waitForUI5Stable();
  });

  await test.step('Verify CSRF token fetch preceded write', async () => {
    expect(tokenRequests.length).toBeGreaterThan(0);
    // Every write request must include the CSRF token
    for (const req of writeRequests) {
      expect(req.headers['x-csrf-token']).toBeDefined();
      expect(req.headers['x-csrf-token']).not.toBe('Fetch');
    }
  });
});
```

---

## 9. Advisory Checklist

When advising on OData-related test patterns:

- [ ] OData version? (V2 or V4 — different request/response formats)
- [ ] Draft-enabled? (affects create/edit/discard flow)
- [ ] $batch used? (need to validate multipart structure)
- [ ] CSRF token handling? (required for write operations)
- [ ] Deep entity creation? (nested entities in single POST)
- [ ] Function imports / bound actions? (action-style operations)
- [ ] $expand depth? (performance implications)
- [ ] Optimistic concurrency? (ETag / If-Match validation)
- [ ] Error message format? (V2 innererror vs V4 details)
- [ ] Annotation-driven UI? (Fiori Elements → predictable from annotations)
- [ ] CAP or SEGW service? (affects mock strategy)
- [ ] Side effects? (auto-refresh after field changes)
- [ ] Pagination? ($top/$skip vs server-driven paging)
- [ ] What is the maximum expected payload size?

---

## 10. Collaboration with Other Agents

| Interaction                   | My Role                                          | Their Role                          |
| ----------------------------- | ------------------------------------------------ | ----------------------------------- |
| With **SAP UI5 Expert**       | I define OData protocol behavior                 | They implement browser-side scripts |
| With **SAP Fiori Consultant** | I detail the data layer                          | They define E2E business scenarios  |
| With **Implementer**          | I specify OData patterns to support              | They build the bridge/proxy code    |
| With **Tester**               | I define mock strategies and validation patterns | They write the test infrastructure  |
| With **Playwright Expert**    | I define network interception patterns           | They map to Playwright APIs         |
| With **Architect**            | I define OData module requirements               | They design the module structure    |

---

## End of Skill File — SAP OData & Gateway Expert Agent v1.0.0
