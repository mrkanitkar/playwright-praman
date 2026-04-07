---
title: Selector Reference
description: 'UI5Selector reference for Praman. Find SAP UI5 controls by controlType, id, properties, bindingPath, ancestor, and descendant selectors.'
keywords:
  - playwright custom selector sap ui5
  - sap ui5 control selector
  - praman selectors
  - sap ui5 test automation
---

# Selector Reference

:::info[In this guide]

- Choose the right selector fields for your use case
- Find controls by ID, type, properties, binding path, and ancestry
- Scope selectors to views and dialogs
- Use the CSS-style `ui5=` locator syntax as an alternative
- Avoid brittle DOM-based selectors

:::

Selectors are the primary way to find UI5 controls on a page. Praman uses `UI5Selector` objects
that query the UI5 runtime's control registry — not the DOM.

:::warning[Common mistake]
Do not use DOM IDs (e.g., `#__xmlview0--btn1`) as selectors. UI5 generates these IDs at
runtime and they change across views, components, and UI5 versions. Always use the control's
stable ID or other semantic selector fields.

```typescript
// Wrong — brittle runtime-generated DOM ID
await ui5.control({ id: '__xmlview0--btn1' });

// Correct — stable application ID
await ui5.control({ id: 'saveBtn' });

// Better — semantic selector resilient to ID changes
await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'Save' },
});
```

:::

:::info Locator Syntax
You can also find controls using CSS-style syntax with `page.locator('ui5=...')`.
This returns a standard Playwright `Locator` and supports combinators, label matching,
and positional pseudo-classes. See [Finding Controls with Locators](./locator-selector-syntax.md).
:::

## UI5Selector Fields

| Field               | Type                      | Description                                                                                                                                                                   |
| ------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `controlType`       | `string`                  | Fully qualified UI5 type (e.g., `'sap.m.Button'`). When provided as a string literal, [narrows the return type](/docs/guides/typed-controls) to a control-specific interface. |
| `id`                | `string \| RegExp`        | Control ID or pattern                                                                                                                                                         |
| `viewName`          | `string`                  | Owning view name for scoped discovery                                                                                                                                         |
| `viewId`            | `string`                  | Owning view ID for scoped discovery                                                                                                                                           |
| `properties`        | `Record<string, unknown>` | Property matchers (key-value pairs)                                                                                                                                           |
| `bindingPath`       | `Record<string, string>`  | OData binding path matchers                                                                                                                                                   |
| `i18NText`          | `Record<string, string>`  | i18n text matchers (translated values)                                                                                                                                        |
| `ancestor`          | `UI5Selector`             | Parent control must match this selector                                                                                                                                       |
| `descendant`        | `UI5Selector`             | Child control must match this selector                                                                                                                                        |
| `interaction`       | `UI5Interaction`          | Sub-control targeting (idSuffix, domChildWith)                                                                                                                                |
| `searchOpenDialogs` | `boolean`                 | Also search controls inside open dialogs                                                                                                                                      |

All fields are optional. At least one must be provided.

### Which selector fields do I need?

Use this decision tree to pick the most resilient selector for your situation:

```text
Do you know the control's stable ID?
  ├── YES → Is the ID unique across all views?
  │          ├── YES → Use { id: 'myId' }
  │          └── NO  → Add viewName: { id: 'myId', viewName: 'app.view.Detail' }
  │
  └── NO  → Do you know the OData binding path?
             ├── YES → Use { controlType, bindingPath }
             │         (most resilient — survives ID refactoring)
             │
             └── NO  → Do you know a unique property value?
                        ├── YES → Use { controlType, properties }
                        │         e.g., { controlType: 'sap.m.Button', properties: { text: 'Save' } }
                        │
                        └── NO  → Is the control inside a specific parent?
                                   ├── YES → Use { controlType, ancestor }
                                   └── NO  → Use { controlType, viewName }
```

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

:::tip Typed Returns
When you use `controlType` with `ui5.control()` (singular), the return type narrows to the specific
typed interface (e.g., `UI5Button`). See [Typed Control Returns](/docs/guides/typed-controls) for
full details and examples.
:::

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

Praman registers a `ui5=` custom selector engine with Playwright, enabling usage in
`page.locator()`. Two formats are supported:

### JSON Format

Pass a `UI5Selector` object as a JSON string:

```typescript
const locator = page.locator('ui5={"controlType":"sap.m.Button","properties":{"text":"Save"}}');
await locator.click();
```

### CSS Format

Use CSS-like syntax to match controls by type, ID, and properties:

```typescript
page.locator("ui5=sap.m.Button[text='Save']");
page.locator('ui5=sap.m.Input:labeled("Vendor")');
page.locator('ui5=sap.m.InputBase::subclass');
```

For the complete CSS and XPath syntax reference, see
[Finding Controls with Locators](./locator-selector-syntax.md).

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

## FAQ

<details>
<summary>Can I use a RegExp for the id field?</summary>

Yes. RegExp IDs are useful when the control ID includes a view prefix that may change:

```typescript
await ui5.control({ id: /vendorInput/ });
```

This matches any control whose ID contains `vendorInput`, such as
`myApp--detailView--vendorInput`. RegExp selectors are more resilient than exact ID strings
but less precise — ensure the pattern is specific enough to match only one control.

</details>

<details>
<summary>When should I use bindingPath instead of properties?</summary>

Use `bindingPath` when you want to find a control by its OData model binding rather than its
displayed value. This is more resilient because binding paths are defined in the XML view and
do not change with i18n translations or user data. For example,
`{ bindingPath: { value: '/PurchaseOrder/Vendor' } }` finds the vendor input regardless of
what text it currently displays.

</details>

<details>
<summary>How do I find controls inside a dialog?</summary>

Add `searchOpenDialogs: true` to your selector. Without this flag, the discovery engine only
searches the main view's control tree and skips controls rendered in overlay dialogs.

```typescript
await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'Confirm' },
  searchOpenDialogs: true,
});
```

</details>

<details>
<summary>What is the difference between ancestor and descendant?</summary>

`ancestor` scopes the search to controls that have a matching parent higher in the tree.
`descendant` finds controls that contain a matching child. Use `ancestor` when you know the
parent container (e.g., find an Input inside a specific Table). Use `descendant` when you
know the child content (e.g., find a Form that contains a specific Input).

</details>

:::tip[Next steps]

- **[Finding Controls with Locators →](./locator-selector-syntax.md)** — CSS-style `ui5=` selector syntax for `page.locator()`
- **[Control Interactions →](./control-interactions.md)** — Click, fill, and read controls after finding them
- **[Typed Control Returns →](./typed-controls.md)** — Get full autocomplete when using `controlType`
- **[Discovery and Interaction Strategies →](./discovery-and-interaction.md)** — How the multi-strategy discovery chain works

:::
