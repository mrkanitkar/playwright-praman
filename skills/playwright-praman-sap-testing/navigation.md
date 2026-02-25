# FLP Navigation Reference

## Table of Contents

1. [FLP Hash Format](#flp-hash-format)
2. [Navigation Functions](#navigation-functions)
3. [WorkZone Navigation](#workzone-navigation)
4. [navTest Fixture](#navtest-fixture)
5. [Common Semantic Objects](#common-semantic-objects)

---

## FLP Hash Format

SAP Fiori Launchpad (FLP) uses hash-based navigation. All navigation targets follow the pattern:

```text
#SemanticObject-Action?param1=value1&param2=value2
```

Examples:

```text
#PurchaseOrder-manage                           — Manage Purchase Orders
#PurchaseOrder-manage&/PurchaseOrder('4500001')  — Direct deep-link to PO
#SalesOrder-manage?SalesOrder=1000001           — Sales Order with param
#Material-display?Material=MAT001&Plant=1000    — Material display
#Home-Shell                                     — FLP home page
```

---

## Navigation Functions

### navigateToApp(appId, options?)

Navigate to an app by semantic object + action string. Most common method.

```typescript
// Basic navigation
await ui5Navigation.navigateToApp('PurchaseOrder-manage');
await ui5Navigation.navigateToApp('SalesOrder-create');

// With navigation options
await ui5Navigation.navigateToApp('Material-display', {
  timeout: 30_000,
  waitForStable: true,
});
```

### navigateToTile(title, options?)

Navigate by clicking the app tile on the FLP home page. Use for WorkZone where semantic objects are not predictable.

```typescript
await ui5Navigation.navigateToTile('Manage Purchase Orders');
await ui5Navigation.navigateToTile('Create Sales Order');
```

### navigateToIntent(intent, params?, options?)

Navigate with explicit semantic object, action, and parameters. The first argument
is a `NavigationIntent` object with `semanticObject` and `action` fields.

```typescript
await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });
await ui5Navigation.navigateToIntent(
  { semanticObject: 'SalesOrder', action: 'display' },
  { SalesOrder: '1000001' },
);
await ui5Navigation.navigateToIntent(
  { semanticObject: 'Material', action: 'change' },
  { Material: 'MAT001', Plant: '1000' },
);
```

### navigateToHash(hash, options?)

Navigate using a raw FLP hash string. Use for complex deep-links.

```typescript
await ui5Navigation.navigateToHash("#PurchaseOrder-manage&/PurchaseOrder('4500001234')");
await ui5Navigation.navigateToHash('#Shell-home');
```

### navigateToHome(options?)

Navigate to the FLP start page (shell home).

```typescript
await ui5Navigation.navigateToHome();
```

### navigateBack(options?)

Navigate back in browser history (same as browser back button).

```typescript
await ui5Navigation.navigateBack();
```

### navigateForward(options?)

Navigate forward in browser history.

```typescript
await ui5Navigation.navigateForward();
```

### searchAndOpenApp(title, options?)

Use the FLP search bar to find and open an app by its tile title.

```typescript
await ui5Navigation.searchAndOpenApp('Manage Purchase Orders');
await ui5Navigation.searchAndOpenApp('Create Supplier Invoice');
```

### getCurrentHash()

Get the current FLP hash from the URL.

```typescript
const hash = await ui5Navigation.getCurrentHash();
// e.g. '#PurchaseOrder-manage'
```

---

## WorkZone Navigation

For SAP Build WorkZone (formerly SAP Launchpad Service), navigation works through
the `btpWorkZone` fixture that handles the WorkZone frame-based shell.

```typescript
// Note: navTest is exported from src/fixtures/index.ts, not from the main entry.
// The merged `test` from 'playwright-praman' already includes navigation fixtures.
import { test } from 'playwright-praman';

test('navigate in WorkZone', async ({ btpWorkZone, ui5Navigation }) => {
  // Initialize WorkZone navigation (waits for shell to load)
  await btpWorkZone.init();

  // Then use standard navigation functions
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
});
```

**Note**: WorkZone apps run in an iframe. Praman automatically handles frame
switching when navigating between WorkZone shell and embedded app frames.

---

## navTest Fixture

`navTest` is a standalone fixture test object exported from `src/fixtures/nav-fixtures.ts`
that bundles `ui5Navigation` and `btpWorkZone` fixtures. The merged `test` from
`'playwright-praman'` already includes these fixtures, so most users can import
`test` directly.

```typescript
import { test } from 'playwright-praman';

// The merged test already provides ui5 + ui5Navigation fixtures
test('full navigation test', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5.waitForUI5();

  // Now interact with the loaded app
  const title = await ui5.getText({
    controlType: 'sap.m.Title',
    ancestor: { controlType: 'sap.f.DynamicPageTitle' },
  });
});
```

**Composing test objects** — navTest extends coreTest:

```typescript
// navTest = coreTest + navigation fixtures (ui5Navigation, btpWorkZone)
// For standalone use (not re-exported from main entry):
import { navTest } from '#fixtures/nav-fixtures.js'; // internal path alias

// For most tests, use the merged test which includes all fixtures:
import { test, expect } from 'playwright-praman';
```

---

## Common Semantic Objects

| Application              | Semantic Object          | Action    | SAP Transaction Equivalent |
| ------------------------ | ------------------------ | --------- | -------------------------- |
| Manage Purchase Orders   | `PurchaseOrder`          | `manage`  | ME23N                      |
| Create Purchase Order    | `PurchaseOrder`          | `create`  | ME21N                      |
| Manage Sales Orders      | `SalesOrder`             | `manage`  | VA03                       |
| Create Sales Order       | `SalesOrder`             | `create`  | VA01                       |
| Display Material         | `Material`               | `display` | MM60                       |
| Manage Vendors/Suppliers | `BusinessPartner`        | `manage`  | XK03                       |
| Create Supplier Invoice  | `SupplierInvoice`        | `create`  | MIRO                       |
| Display Supplier Invoice | `SupplierInvoice`        | `display` | MIR4                       |
| Manage Goods Receipts    | `GoodsMovement`          | `manage`  | MIGO                       |
| Financial Postings       | `GLAccountLineItems`     | `manage`  | FBL3N                      |
| Cost Center Plan         | `CostCenterPlanningData` | `manage`  | KP06                       |
| Production Order         | `ManufacturingOrder`     | `manage`  | CO03                       |

**Finding semantic objects** for your system:

```typescript
// Get the current hash to discover the semantic object for any app:
await page.goto('https://your-flp.com/#Shell-home');
// Navigate to the app manually, then:
const hash = await ui5Navigation.getCurrentHash();
console.log(hash); // e.g. '#PurchaseOrder-manage'
```
