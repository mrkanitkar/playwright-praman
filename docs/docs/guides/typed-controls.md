---
title: Typed Control Returns
---

When you call `ui5.control()` with a `controlType` string, Praman narrows the return type to a
control-specific TypeScript interface. Instead of a generic `UI5ControlBase` with 10 base methods,
you get the exact API surface for that control — autocomplete for every getter, setter, and event
method.

This works for **all 199 SAP UI5 control types** that Praman ships typed interfaces for.

## How It Works

```typescript
import { test, expect } from 'playwright-praman';

test('typed control example', async ({ ui5 }) => {
  // Typed: returns UI5Button with getText(), press(), getEnabled(), getIcon(), ...
  const btn = await ui5.control({
    controlType: 'sap.m.Button',
    properties: { text: 'Save' },
  });

  const text = await btn.getText(); // string — full autocomplete
  const enabled = await btn.getEnabled(); // boolean — not `any`
  const icon = await btn.getIcon(); // string

  // Untyped: returns UI5ControlBase (existing behavior, still works)
  const ctrl = await ui5.control({ id: 'myControl' });
  const value = await ctrl.getProperty('value'); // unknown
});
```

When `controlType` is provided as a **string literal** (e.g., `'sap.m.Button'`), TypeScript infers
the specific return type. When only `id` or other selectors are used, the return type falls back to
`UI5ControlBase` — exactly the same behavior as before.

:::tip Zero Runtime Change
This is purely a TypeScript type-level feature. The runtime behavior is identical — the same proxy
object is returned. The difference is that your IDE and AI agents now know the exact methods available.
:::

## Why This Matters

### For Test Automation Engineers

Without typed returns, `ui5.control()` returns `UI5ControlBase` with only 10 base methods visible
in autocomplete. Every control-specific method like `getItems()`, `getSelectedKey()`, or `getRows()`
is hidden behind a `[method: string]: (...args) => Promise<any>` index signature.

With typed returns, you see the **full API surface** — 15 to 40+ methods depending on the control:

| Control Type                        | Methods Available | Examples                                                                |
| ----------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| `sap.m.Button`                      | 20+               | `getText()`, `getIcon()`, `getEnabled()`, `getType()`, `press()`        |
| `sap.m.Input`                       | 30+               | `getValue()`, `getPlaceholder()`, `getValueState()`, `getDescription()` |
| `sap.m.Table`                       | 40+               | `getItems()`, `getColumns()`, `getMode()`, `getHeaderText()`            |
| `sap.m.Select`                      | 25+               | `getSelectedKey()`, `getSelectedItem()`, `getItems()`, `getEnabled()`   |
| `sap.m.Dialog`                      | 25+               | `getTitle()`, `getButtons()`, `getContent()`, `isOpen()`                |
| `sap.ui.comp.smarttable.SmartTable` | 35+               | `getEntitySet()`, `getTable()`, `rebindTable()`                         |
| `sap.ui.comp.smartfield.SmartField` | 25+               | `getValue()`, `getEditable()`, `getEntitySet()`                         |
| `sap.ui.mdc.FilterField`            | 20+               | `getConditions()`, `getOperators()`, `getValueHelp()`                   |

### For AI Agents

AI agents (Claude, Copilot, Cursor, Codex) use TypeScript type information as **grounding data**.
When the type system says `UI5Button` has a `getText()` method that returns `Promise<string>`, the
agent uses that — not hallucinated method names.

Without typed returns, agents see:

```
control: UI5ControlBase
  .getId() → Promise<string>
  .getVisible() → Promise<boolean>
  .getProperty(name) → Promise<unknown>
  ... 7 more base methods
  [method: string]: (...args: any[]) → Promise<any>  ← agents guess from here
```

With typed returns, agents see:

```
btn: UI5Button
  .getText() → Promise<string>
  .getIcon() → Promise<string>
  .getEnabled() → Promise<boolean>
  .getType() → Promise<string>
  .press() → Promise<void>
  .getAriaDescribedBy() → Promise<string[]>
  ... 15+ more typed methods
```

This eliminates an entire class of agent errors — calling methods that don't exist, passing wrong
argument types, or misinterpreting return types.

## Supported Controls

Praman ships typed interfaces for **199 SAP UI5 controls** from the following namespaces:

| Namespace         | Controls | Examples                                                               |
| ----------------- | -------- | ---------------------------------------------------------------------- |
| `sap.m.*`         | 80+      | Button, Input, Table, Dialog, Select, ComboBox, List, Page, Panel, ... |
| `sap.ui.comp.*`   | 15+      | SmartField, SmartTable, SmartFilterBar, SmartChart, SmartForm, ...     |
| `sap.ui.mdc.*`    | 10+      | FilterField, FilterBar, Table, ValueHelp, ...                          |
| `sap.f.*`         | 10+      | DynamicPage, SemanticPage, FlexibleColumnLayout, Avatar, Card, ...     |
| `sap.ui.layout.*` | 5+       | Grid, VerticalLayout, HorizontalLayout, Splitter, ...                  |
| `sap.tnt.*`       | 5+       | NavigationList, SideNavigation, ToolPage, InfoLabel, ...               |
| `sap.ui.table.*`  | 5+       | Table, TreeTable, Column, Row, ...                                     |
| `sap.uxap.*`      | 5+       | ObjectPageLayout, ObjectPageSection, ObjectPageSubSection, ...         |

The full list is available in the [API Reference](/docs/api).

## Usage Patterns

### Button Interactions

```typescript
test('button operations', async ({ ui5 }) => {
  const saveBtn = await ui5.control({
    controlType: 'sap.m.Button',
    properties: { text: 'Save' },
  });

  // All methods are typed — IDE shows autocomplete
  expect(await saveBtn.getEnabled()).toBe(true);
  expect(await saveBtn.getType()).toBe('Emphasized');
  expect(await saveBtn.getIcon()).toBe('sap-icon://save');
  await saveBtn.press();
});
```

### Input Fields

```typescript
test('input field operations', async ({ ui5 }) => {
  const vendorInput = await ui5.control({
    controlType: 'sap.m.Input',
    viewName: 'app.view.Detail',
    properties: { placeholder: 'Enter vendor' },
  });

  // Typed: getValue() returns Promise<string>, not Promise<any>
  const currentValue = await vendorInput.getValue();
  expect(currentValue).toBe('');

  // Typed: getValueState() returns Promise<string>
  const state = await vendorInput.getValueState();
  expect(state).toBe('None');

  await vendorInput.enterText('100001');
});
```

### Table with Items

```typescript
test('table operations', async ({ ui5 }) => {
  const table = await ui5.control({
    controlType: 'sap.m.Table',
    id: /poTable/,
  });

  // Typed: getItems() returns Promise<UI5ControlBase[]>
  const items = await table.getItems();
  expect(items.length).toBeGreaterThan(0);

  // Typed: getMode() returns Promise<string>
  const mode = await table.getMode();
  expect(mode).toBe('SingleSelectMaster');

  // Typed: getHeaderText() returns Promise<string>
  const header = await table.getHeaderText();
  expect(header).toContain('Purchase Orders');
});
```

### Select / ComboBox

```typescript
test('dropdown selection', async ({ ui5 }) => {
  const select = await ui5.control({
    controlType: 'sap.m.Select',
    id: 'purchOrgSelect',
  });

  // Typed: getSelectedKey() returns Promise<string>
  const currentKey = await select.getSelectedKey();
  expect(currentKey).toBe('1000');

  // Typed: getItems() returns Promise<UI5ControlBase[]>
  const options = await select.getItems();
  expect(options.length).toBeGreaterThanOrEqual(3);
});
```

### SmartField (Fiori Elements)

```typescript
test('smart field in object page', async ({ ui5 }) => {
  const smartField = await ui5.control({
    controlType: 'sap.ui.comp.smartfield.SmartField',
    bindingPath: { path: '/CompanyCode' },
  });

  // Typed: getEditable() returns Promise<boolean>
  const editable = await smartField.getEditable();

  // Typed: getValue() returns Promise<string>
  const value = await smartField.getValue();
  expect(value).toBe('1000');
});
```

### SmartTable with Filters

```typescript
test('smart table entity set', async ({ ui5 }) => {
  const smartTable = await ui5.control({
    controlType: 'sap.ui.comp.smarttable.SmartTable',
    id: /listReport/,
  });

  // Typed: getEntitySet() returns Promise<string>
  const entitySet = await smartTable.getEntitySet();
  expect(entitySet).toBe('C_PurchaseOrderItem');

  // Typed: getTable() returns proxied inner table
  const innerTable = await smartTable.getTable();
});
```

### Dialog Handling

```typescript
test('dialog with typed access', async ({ ui5 }) => {
  // Trigger a dialog
  await ui5.click({ id: 'deleteBtn' });

  const dialog = await ui5.control({
    controlType: 'sap.m.Dialog',
    searchOpenDialogs: true,
  });

  // Typed: getTitle() returns Promise<string>
  const title = await dialog.getTitle();
  expect(title).toContain('Confirm');

  // Typed: getButtons() returns Promise<UI5ControlBase[]>
  const buttons = await dialog.getButtons();
  expect(buttons.length).toBe(2);
});
```

### MDC FilterField (S/4HANA Cloud)

```typescript
test('mdc filter field', async ({ ui5 }) => {
  const filterField = await ui5.control({
    controlType: 'sap.ui.mdc.FilterField',
    properties: { label: 'Company Code' },
  });

  // Typed: getConditions() returns Promise<unknown[]>
  const conditions = await filterField.getConditions();
  expect(conditions).toHaveLength(0);

  // Typed: getOperators() returns Promise<string[]>
  const operators = await filterField.getOperators();
  expect(operators).toContain('EQ');
});
```

## Combining with Selectors

Typed returns work with all [selector fields](/docs/guides/selectors) — `id`, `viewName`,
`properties`, `bindingPath`, `ancestor`, `descendant`, and `searchOpenDialogs`. The only
requirement is that `controlType` is present as a string literal:

```typescript
// All of these return typed UI5Input:
await ui5.control({ controlType: 'sap.m.Input', id: 'vendorInput' });
await ui5.control({ controlType: 'sap.m.Input', viewName: 'app.view.Detail' });
await ui5.control({ controlType: 'sap.m.Input', bindingPath: { value: '/Vendor' } });
await ui5.control({ controlType: 'sap.m.Input', ancestor: { id: 'form1' } });
await ui5.control({ controlType: 'sap.m.Input', properties: { placeholder: 'Enter vendor' } });
```

## Importing the Type Map

For advanced use cases (utility functions, generic test helpers), you can import `UI5ControlMap`
directly:

```typescript
import type { UI5ControlMap, UI5ControlBase } from 'playwright-praman';

// Extract a specific control type
type MyButton = UI5ControlMap['sap.m.Button'];
type MyInput = UI5ControlMap['sap.m.Input'];

// Use in generic helpers
async function getButtonText(
  ui5: { control: (s: any) => Promise<UI5ControlBase> },
  text: string,
): Promise<string> {
  const btn = await ui5.control({
    controlType: 'sap.m.Button',
    properties: { text },
  });
  return btn.getText() as Promise<string>;
}
```

## Fallback Behavior

When `controlType` is **not** provided, or is a **dynamic string variable** (not a literal), the
return type is `UI5ControlBase` — the same 10 base methods plus the `[method: string]` index
signature:

```typescript
// Falls back to UI5ControlBase (no controlType)
const ctrl = await ui5.control({ id: 'someControl' });

// Falls back to UI5ControlBase (dynamic string, not literal)
const type = getControlType(); // returns string
const ctrl2 = await ui5.control({ controlType: type });

// To force typing with a dynamic string, use `as const`:
const ctrl3 = await ui5.control({ controlType: 'sap.m.Button' as const });
```

:::info Backwards Compatible
All existing tests continue to work without any changes. The fallback to `UI5ControlBase` ensures
that ID-based selectors, RegExp selectors, and dynamic controlType strings compile and behave
exactly as before.
:::

## Custom / Third-Party Controls

For SAP controls not in the built-in type map (custom controls, partner extensions), the return
type falls back to `UI5ControlBase`. You can still call any method — they just won't have
autocomplete:

```typescript
// Custom control: falls back to UI5ControlBase
const custom = await ui5.control({ controlType: 'com.mycompany.CustomInput' });

// Methods still work at runtime (dynamic proxy), just no autocomplete
const value = await custom.getValue(); // type is Promise<any>
```

## Full Real-World Example

A complete test using typed controls in a SAP Manage Purchase Orders scenario:

```typescript
import { test, expect } from 'playwright-praman';

test('verify purchase order details', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  await test.step('Open first purchase order', async () => {
    const table = await ui5.control({
      controlType: 'sap.m.Table',
      id: /poTable/,
    });
    const items = await table.getItems();
    expect(items.length).toBeGreaterThan(0);

    await ui5.click({
      controlType: 'sap.m.ColumnListItem',
      ancestor: { id: /poTable/ },
    });
  });

  await test.step('Verify header fields', async () => {
    const vendorField = await ui5.control({
      controlType: 'sap.ui.comp.smartfield.SmartField',
      bindingPath: { path: '/Supplier' },
    });
    const vendor = await vendorField.getValue();
    expect(vendor).toBeTruthy();

    const statusField = await ui5.control({
      controlType: 'sap.m.ObjectStatus',
      id: /objectPageHeaderStatus/,
    });
    const status = await statusField.getText();
    expect(['Draft', 'Active', 'Approved']).toContain(status);
  });

  await test.step('Check item table', async () => {
    const itemTable = await ui5.control({
      controlType: 'sap.ui.table.Table',
      id: /itemTable/,
    });
    const rowCount = await itemTable.getVisibleRowCount();
    expect(rowCount).toBeGreaterThan(0);
  });

  await test.step('Edit and save', async () => {
    await ui5.click({
      controlType: 'sap.m.Button',
      properties: { text: 'Edit' },
    });

    await ui5.fill(
      {
        controlType: 'sap.m.Input',
        id: /noteInput/,
      },
      'Updated by automated test',
    );

    const saveBtn = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
    expect(await saveBtn.getEnabled()).toBe(true);
    await saveBtn.press();
  });
});
```
