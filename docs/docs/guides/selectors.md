---
sidebar_position: 4
title: Selector Reference
---

Selectors are the primary way to find UI5 controls on a page. Praman uses `UI5Selector` objects
that query the UI5 runtime's control registry — not the DOM.

## UI5Selector Fields

| Field               | Type                      | Description                                       |
| ------------------- | ------------------------- | ------------------------------------------------- |
| `controlType`       | `string`                  | Fully qualified UI5 type (e.g., `'sap.m.Button'`) |
| `id`                | `string \| RegExp`        | Control ID or pattern                             |
| `viewName`          | `string`                  | Owning view name for scoped discovery             |
| `viewId`            | `string`                  | Owning view ID for scoped discovery               |
| `properties`        | `Record<string, unknown>` | Property matchers (key-value pairs)               |
| `bindingPath`       | `Record<string, string>`  | OData binding path matchers                       |
| `i18NText`          | `Record<string, string>`  | i18n text matchers (translated values)            |
| `ancestor`          | `UI5Selector`             | Parent control must match this selector           |
| `descendant`        | `UI5Selector`             | Child control must match this selector            |
| `interaction`       | `UI5Interaction`          | Sub-control targeting (idSuffix, domChildWith)    |
| `searchOpenDialogs` | `boolean`                 | Also search controls inside open dialogs          |

All fields are optional. At least one must be provided.

## Examples

### By ID

```typescript
const button = await ui5.control({ id: 'saveBtn' });
```

### By ID with RegExp

```typescript
const button = await ui5.control({ id: /submit/i });
```

### By Control Type

```typescript
const buttons = await ui5.controls({ controlType: 'sap.m.Button' });
```

### By Type + Properties

```typescript
const input = await ui5.control({
  controlType: 'sap.m.Input',
  properties: { placeholder: 'Enter vendor' },
});
```

### Scoped to View

```typescript
const field = await ui5.control({
  controlType: 'sap.m.Input',
  viewName: 'myApp.view.Detail',
  properties: { value: '' },
});
```

### By Binding Path

```typescript
const field = await ui5.control({
  controlType: 'sap.m.Input',
  bindingPath: { value: '/PurchaseOrder/Vendor' },
});
```

### With Ancestor

```typescript
const cellInput = await ui5.control({
  controlType: 'sap.m.Input',
  ancestor: {
    controlType: 'sap.m.Table',
    id: 'poTable',
  },
});
```

### With Descendant

```typescript
const form = await ui5.control({
  controlType: 'sap.ui.layout.form.SimpleForm',
  descendant: {
    controlType: 'sap.m.Input',
    properties: { placeholder: 'Vendor' },
  },
});
```

### Interaction Sub-Targeting

```typescript
// Target the arrow button inside a ComboBox
const combo = await ui5.control({
  controlType: 'sap.m.ComboBox',
  id: 'countrySelect',
  interaction: { idSuffix: 'arrow' },
});
```

### Search Inside Dialogs

```typescript
const dialogButton = await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'OK' },
  searchOpenDialogs: true,
});
```

## Selector String Format

Praman registers a `ui5=` custom selector engine with Playwright, enabling usage in `page.locator()`:

```typescript
const locator = page.locator('ui5={"controlType":"sap.m.Button","properties":{"text":"Save"}}');
await locator.click();
```

## Control Type Cheat Sheet

| Control        | `controlType`                               | Common Properties                             |
| -------------- | ------------------------------------------- | --------------------------------------------- |
| Button         | `sap.m.Button`                              | `text`, `icon`, `type`, `enabled`             |
| Input          | `sap.m.Input`                               | `value`, `placeholder`, `enabled`, `editable` |
| Text           | `sap.m.Text`                                | `text`                                        |
| Label          | `sap.m.Label`                               | `text`, `required`                            |
| Select         | `sap.m.Select`                              | `selectedKey`                                 |
| ComboBox       | `sap.m.ComboBox`                            | `value`, `selectedKey`                        |
| CheckBox       | `sap.m.CheckBox`                            | `selected`, `text`                            |
| DatePicker     | `sap.m.DatePicker`                          | `value`, `dateValue`                          |
| TextArea       | `sap.m.TextArea`                            | `value`, `rows`                               |
| Link           | `sap.m.Link`                                | `text`, `href`                                |
| GenericTile    | `sap.m.GenericTile`                         | `header`, `subheader`                         |
| Table          | `sap.m.Table`                               | `headerText`                                  |
| SmartField     | `sap.ui.comp.smartfield.SmartField`         | `value`, `editable`                           |
| SmartTable     | `sap.ui.comp.smarttable.SmartTable`         | `entitySet`, `useTablePersonalisation`        |
| SmartFilterBar | `sap.ui.comp.smartfilterbar.SmartFilterBar` | `entitySet`                                   |

:::note SmartField Inner Controls
`SmartField` wraps inner controls (Input, ComboBox, etc.). `getControlType()` returns
`sap.ui.comp.smartfield.SmartField`, not the inner control type. Use `properties` matching
to target by value rather than relying on the inner control type.
:::

## Discovery Strategies

Praman uses a multi-strategy chain for control discovery:

1. **LRU Cache** (200 entries, 5s TTL) — instant for repeat lookups
2. **Direct ID** — `sap.ui.getCore().byId(id)` for exact ID matches
3. **RecordReplay** — SAP's RecordReplay API (requires UI5 >= 1.94)
4. **Registry Scan** — full `ElementRegistry` scan as fallback

Configure the strategy chain:

```typescript
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  discoveryStrategies: ['direct-id', 'recordreplay'],
});
```
