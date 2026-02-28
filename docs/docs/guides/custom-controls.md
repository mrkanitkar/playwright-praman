---
sidebar_position: 42
title: 'Custom Control Extension'
---

# Custom Control Extension

SAP projects frequently use custom UI5 controls that extend standard controls or create entirely new ones. This guide explains how to interact with custom controls through Praman when they are not part of the built-in type system.

## Finding Custom Controls by Type

Use the `controlType` selector to target custom controls by their fully qualified UI5 class name:

```typescript
import { test, expect } from 'playwright-praman';

test('interact with custom rating control', async ({ ui5 }) => {
  const rating = await ui5.control({
    controlType: 'com.myapp.controls.StarRating',
    properties: { value: 4 },
  });

  await expect(rating).toBeDefined();
});
```

The `controlType` selector searches the UI5 control tree by class name. It works for any control registered with `sap.ui.define`, including third-party and project-specific controls.

## Combining controlType with Properties

When multiple instances of a custom control exist on the page, narrow the match with `properties`:

```typescript
await ui5.control({
  controlType: 'com.myapp.controls.StatusBadge',
  properties: {
    status: 'Critical',
    category: 'Inventory',
  },
});
```

Properties are matched against the control's current property values using the UI5 `getProperty()` API. Property names must match the control's metadata definition exactly.

## Accessing Inner Controls of Composites

Many custom controls are composites that wrap standard UI5 controls internally. For example, a `SmartField` wraps an `Input`, `ComboBox`, or `DatePicker` depending on the OData metadata.

### The SmartField Pattern

`SmartField` is a common source of confusion. Its `getControlType()` returns `sap.ui.comp.smartfield.SmartField`, not the inner control type:

```typescript
import { test, expect } from 'playwright-praman';

test('interact with SmartField inner control', async ({ ui5 }) => {
  await test.step('Set value on SmartField', async () => {
    // Target the SmartField directly -- Praman handles the inner control
    await ui5.fill({ id: 'vendorSmartField' }, 'ACME Corp');
    await ui5.waitForUI5();
  });

  await test.step('Read value from SmartField', async () => {
    const value = await ui5.getValue({ id: 'vendorSmartField' });
    expect(value).toBe('ACME Corp');
  });
});
```

### Accessing the Inner Control Directly

If you need to interact with the inner control specifically (e.g., to check its type or invoke a method not exposed by the wrapper):

```typescript
test('access SmartField inner control type', async ({ ui5, page }) => {
  const innerType = await page.evaluate(() => {
    const sf = sap.ui.getCore().byId('vendorSmartField');
    const inner = sf?.getInnerControls?.()[0];
    return inner?.getMetadata().getName();
  });

  expect(innerType).toBe('sap.m.Input');
});
```

## Extending ControlProxy for Custom Methods

When a custom control has domain-specific methods you call frequently, wrap the interactions in test helper functions:

```typescript
// test-helpers/custom-controls.ts
import type { Page } from '@playwright/test';

export async function setStarRating(page: Page, controlId: string, stars: number) {
  await page.evaluate(
    ({ id, value }) => {
      const control = sap.ui.getCore().byId(id);
      control?.setProperty('value', value);
      control?.fireEvent('change', { value });
    },
    { id: controlId, value: stars },
  );
}
```

Use it in tests:

```typescript
import { test, expect } from 'playwright-praman';
import { setStarRating } from './test-helpers/custom-controls';

test('rate a product', async ({ ui5, page }) => {
  await setStarRating(page, 'productRating', 5);
  await ui5.waitForUI5();
  await expect(ui5.control({ id: 'ratingDisplay' })).toHaveText('5 / 5');
});
```

## Handling Controls with Custom Renderers

Some custom controls override the standard renderer and produce non-standard DOM. When Praman's standard selectors cannot find a visible element, fall back to properties-based selectors:

```typescript
test('interact with custom-rendered control', async ({ ui5 }) => {
  // Instead of relying on DOM structure, use UI5 control tree
  await ui5.click({
    controlType: 'com.myapp.controls.CustomButton',
    properties: { text: 'Submit Order' },
  });
});
```

This approach works because Praman queries the UI5 control tree via the bridge, not the DOM. The control's rendered output does not affect selector resolution.

## Common Pitfalls

- **Assuming inner control type**: A `SmartField` on an Edm.String property wraps `sap.m.Input`, but on an Edm.DateTime it wraps `sap.m.DatePicker`. Always verify against the live system.
- **Using DOM selectors for custom controls**: Custom renderers produce unpredictable DOM. Always prefer `controlType` + `properties` selectors over CSS selectors.
- **Missing fireEvent after setValue**: If your custom control listens for `change` or `liveChange` events, calling `setProperty()` alone may not trigger downstream logic. Use `fireEvent()` explicitly.
- **Namespace typos**: Custom control class names are case-sensitive. `com.myapp.Controls.StatusBadge` (capital C) is different from `com.myapp.controls.StatusBadge`.
