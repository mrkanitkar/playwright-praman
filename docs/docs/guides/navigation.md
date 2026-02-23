---
sidebar_position: 13
title: Navigation
---

Praman provides 9 navigation functions via the `ui5Navigation` fixture, plus BTP WorkZone
iframe management via `btpWorkZone`. All navigation uses the FLP's own `hasher` API for
reliable hash-based routing without full page reloads.

## Why Not page.goto()?

SAP Fiori Launchpad uses hash-based routing. Calling `page.goto()` with a new URL triggers a
full page reload, which means:

- UI5 core must re-bootstrap (30-60 seconds on BTP)
- All OData models are re-initialized
- Authentication may need to re-negotiate

Praman's navigation functions use `window.hasher.setHash()` via `page.evaluate()`, which
changes the hash fragment without a page reload. The FLP router handles the transition
in-place.

## Navigation Methods

### navigateToApp

Navigates to an app by its semantic object-action string. This is the most common navigation
method.

```typescript
await ui5Navigation.navigateToApp('PurchaseOrder-manage');
await ui5Navigation.navigateToApp('SalesOrder-create');
await ui5Navigation.navigateToApp('Material-display');
```

### navigateToTile

Clicks an FLP tile by its visible title text. Useful for homepage-based navigation.

```typescript
await ui5Navigation.navigateToTile('Create Purchase Order');
await ui5Navigation.navigateToTile('Manage Sales Orders');
```

### navigateToIntent

Navigates using a semantic object + action + optional parameters. This is the most flexible
method for parameterized navigation.

```typescript
// Basic intent
await ui5Navigation.navigateToIntent('PurchaseOrder', 'create');

// With parameters
await ui5Navigation.navigateToIntent('PurchaseOrder', 'create', {
  plant: '1000',
  purchOrg: '1000',
});

// Produces hash: #PurchaseOrder-create?plant=1000&purchOrg=1000
```

### navigateToHash

Sets the URL hash fragment directly. Useful for deep-linking to specific views or states.

```typescript
await ui5Navigation.navigateToHash("PurchaseOrder-manage&/PurchaseOrders('4500000001')");
await ui5Navigation.navigateToHash('Shell-home');
```

### navigateToHome

Returns to the FLP homepage.

```typescript
await ui5Navigation.navigateToHome();
```

### navigateBack / navigateForward

Browser history navigation.

```typescript
await ui5Navigation.navigateBack();
await ui5Navigation.navigateForward();
```

### searchAndOpenApp

Types a query into the FLP shell search bar and opens the first result.

```typescript
await ui5Navigation.searchAndOpenApp('Purchase Order');
await ui5Navigation.searchAndOpenApp('Vendor Master');
```

### getCurrentHash

Reads the current URL hash fragment. Useful for assertions.

```typescript
const hash = await ui5Navigation.getCurrentHash();
expect(hash).toContain('PurchaseOrder');
expect(hash).toContain('manage');
```

## Auto-Stability After Navigation

Every navigation function calls `waitForUI5Stable()` after changing the hash. This ensures the
target app has fully loaded before the next test step executes.

To skip this wait (e.g., if you have a custom wait):

```typescript
// The waitForStable option is available on navigation methods
await ui5Navigation.navigateToApp('PurchaseOrder-manage');
// Stability wait fires automatically after this call returns
```

## Intent Navigation Patterns

### Simple Navigation

```typescript
test('open purchase order', async ({ ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
});
```

### Parameterized Navigation

```typescript
test('open specific purchase order', async ({ ui5Navigation }) => {
  await ui5Navigation.navigateToIntent('PurchaseOrder', 'display', {
    PurchaseOrder: '4500000001',
  });
});
```

### Multi-Step Navigation

```typescript
test('list report to object page', async ({ ui5Navigation, ui5 }) => {
  // Step 1: Navigate to list report
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // Step 2: Click a row to navigate to object page
  await ui5.click({
    controlType: 'sap.m.ColumnListItem',
    ancestor: { id: 'poTable' },
  });

  // Step 3: Verify we're on the object page
  const hash = await ui5Navigation.getCurrentHash();
  expect(hash).toContain('PurchaseOrders');

  // Step 4: Go back
  await ui5Navigation.navigateBack();
});
```

## BTP WorkZone Iframe Management

SAP BTP WorkZone renders applications inside nested iframes. The `btpWorkZone` fixture handles
frame switching transparently.

### The Frame Structure

```
Outer Frame (WorkZone shell)
  └── Inner Frame (workspace / application)
        └── UI5 Application
```

Without frame management, Playwright targets the outer frame and cannot find UI5 controls
inside the inner workspace frame.

### Using btpWorkZone

```typescript
import { test } from 'playwright-praman';

test('WorkZone navigation', async ({ btpWorkZone, ui5, page }) => {
  // The manager detects the frame structure automatically
  const workspace = btpWorkZone.getWorkspaceFrame();

  // UI5 operations automatically target the correct frame
  await ui5.click({ id: 'saveBtn' });
});
```

### Cross-Frame Operations

When you need to interact with controls in both the outer shell and inner workspace:

```typescript
test('shell + workspace', async ({ btpWorkZone, ui5Shell, ui5 }) => {
  // Shell header is in the outer frame
  await ui5Shell.expectShellHeader();

  // Application controls are in the inner frame
  await ui5.click({ id: 'appButton' });
});
```

## Step Decoration

Every navigation call is wrapped in a Playwright `test.step()` for HTML report visibility:

```
test 'create purchase order'
  ├── ui5Navigation.navigateToApp: PurchaseOrder-create
  ├── ui5.fill: vendorInput
  ├── ui5.click: saveBtn
  └── ui5Navigation.navigateToHome
```

## Complete Example

```typescript
import { test, expect } from 'playwright-praman';

test('end-to-end purchase order workflow', async ({ ui5Navigation, ui5, ui5Shell, ui5Footer }) => {
  // Navigate to create app
  await ui5Navigation.navigateToApp('PurchaseOrder-create');

  // Fill form
  await ui5.fill({ id: 'vendorInput' }, '100001');
  await ui5.select({ id: 'purchOrgSelect' }, '1000');

  // Save via footer
  await ui5Footer.clickSave();

  // Verify navigation to display view
  const hash = await ui5Navigation.getCurrentHash();
  expect(hash).toContain('PurchaseOrder');

  // Navigate home
  await ui5Shell.clickHome();

  // Verify we're on the homepage
  const homeHash = await ui5Navigation.getCurrentHash();
  expect(homeHash).toContain('Shell-home');
});
```
