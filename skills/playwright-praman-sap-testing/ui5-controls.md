# UI5 Controls Reference

## Table of Contents

1. [Selector Syntax](#selector-syntax)
2. [Core Interaction Methods](#core-interaction-methods)
3. [Common Control Types](#common-control-types)
4. [Custom Matchers](#custom-matchers)
5. [Selector Strategy Guide](#selector-strategy-guide)

---

## Selector Syntax

```typescript
interface UI5Selector {
  id?: string; // Stable DOM ID (fastest)
  controlType?: string; // e.g. 'sap.m.Button'
  properties?: Record<string, unknown>; // e.g. { text: 'Save', enabled: true }
  bindingPath?: {
    // OData binding context
    path: string; // e.g. '/Vendor'
    propertyPath?: string; // e.g. 'Name1'
  };
  ancestor?: UI5Selector; // Scoped search (avoids false matches)
  descendant?: UI5Selector; // Content filter
}
```

**Priority order** (most to least reliable):

1. `{ id: 'stable-id' }` — fastest; use when you control the app
2. `{ controlType: 'sap.m.Button', properties: { text: 'Save' } }` — stable across UI changes
3. `{ controlType: '...', bindingPath: { path: '/Vendor' } }` — semantic; locale-independent
4. `{ controlType: '...', ancestor: { id: 'formId' } }` — scoped; avoids duplicate matches

---

## Core Interaction Methods

### ui5.control(selector)

Discover a single control. Throws if not found or multiple matches.

```typescript
const btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
const input = await ui5.control({ id: 'vendorInput' });
```

### ui5.controls(selector)

Discover multiple controls. Returns empty array (not error) if none found.

```typescript
const rows = await ui5.controls({ controlType: 'sap.m.ColumnListItem' });
const buttons = await ui5.controls({
  controlType: 'sap.m.Button',
  ancestor: { id: 'toolbar' },
});
```

### ui5.click(selector)

Click a UI5 control (uses UI5 press event, not DOM click).

```typescript
await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
await ui5.click({ id: 'deleteButton' });
```

### ui5.fill(selector, value)

Fill an input control with text. Works with `sap.m.Input`, `sap.m.TextArea`, `sap.m.SearchField`.

```typescript
await ui5.fill({ id: 'vendorInput' }, 'SUP-001');
await ui5.fill({ controlType: 'sap.m.SearchField' }, 'Purchase Order');
```

### ui5.press(selector)

Trigger a button press (same as click but semantic for buttons).

```typescript
await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Confirm' } });
```

### ui5.select(selector, key)

Select an item by key in a `sap.m.Select` or `sap.m.ComboBox`.

```typescript
await ui5.select({ id: 'companyCode' }, '1000');
await ui5.select({ controlType: 'sap.m.Select', ancestor: { id: 'header' } }, 'USD');
```

### ui5.getText(selector)

Get the text/value of a control.

```typescript
const text = await ui5.getText({ id: 'statusText' });
const value = await ui5.getValue({ id: 'amountInput' });
```

### ui5.waitForUI5(timeout?)

Wait for UI5 to finish all pending rendering and async operations.

```typescript
await ui5.waitForUI5(); // default timeout from config
await ui5.waitForUI5(15_000); // custom timeout in ms
```

---

## Common Control Types

### Buttons

| Control Type                        | Description                | Properties                                            |
| ----------------------------------- | -------------------------- | ----------------------------------------------------- |
| `sap.m.Button`                      | Standard button            | `text`, `icon`, `type` (Emphasized/Transparent/Ghost) |
| `sap.m.ToggleButton`                | Toggle button              | `text`, `pressed`                                     |
| `sap.m.MenuButton`                  | Button with dropdown       | `text`, `buttonMode`                                  |
| `sap.ui.comp.smartfield.SmartField` | Smart field button variant | (see SmartField note)                                 |

### Inputs

| Control Type                        | Description               | Properties                           |
| ----------------------------------- | ------------------------- | ------------------------------------ |
| `sap.m.Input`                       | Text input                | `value`, `placeholder`, `editable`   |
| `sap.m.TextArea`                    | Multi-line text           | `value`, `rows`                      |
| `sap.m.SearchField`                 | Search input              | `value`, `placeholder`               |
| `sap.m.DatePicker`                  | Date input                | `value` (string), `dateValue` (Date) |
| `sap.m.TimePicker`                  | Time input                | `value`                              |
| `sap.m.MaskInput`                   | Masked text input         | `value`, `mask`                      |
| `sap.ui.comp.smartfield.SmartField` | Context-aware smart input | (wraps inner control)                |

### Selection

| Control Type          | Description        | Key Property           |
| --------------------- | ------------------ | ---------------------- |
| `sap.m.Select`        | Dropdown select    | `selectedKey`          |
| `sap.m.ComboBox`      | Combo box          | `selectedKey`, `value` |
| `sap.m.MultiComboBox` | Multi-select combo | `selectedKeys[]`       |
| `sap.m.CheckBox`      | Checkbox           | `selected`             |
| `sap.m.RadioButton`   | Radio button       | `selected`             |
| `sap.m.Switch`        | Toggle switch      | `state` (boolean)      |

### Display

| Control Type         | Description               |
| -------------------- | ------------------------- |
| `sap.m.Text`         | Static text               |
| `sap.m.Label`        | Form label                |
| `sap.m.Title`        | Section title             |
| `sap.m.ObjectStatus` | Status with icon and text |
| `sap.m.MessageStrip` | Inline notification       |
| `sap.ui.core.Icon`   | Icon display              |

### Containers

| Control Type          | Description          |
| --------------------- | -------------------- |
| `sap.m.Panel`         | Collapsible panel    |
| `sap.m.Dialog`        | Modal dialog         |
| `sap.m.Popover`       | Popup/popover        |
| `sap.m.Page`          | Page container       |
| `sap.f.DynamicPage`   | Fiori 3 dynamic page |
| `sap.uxap.ObjectPage` | Object page layout   |

### SmartField Note

`SmartField` wraps an inner control determined by OData metadata:

```typescript
// ❌ Wrong — SmartField wraps the actual control:
await ui5.control({ controlType: 'sap.m.Input', ancestor: { id: 'smartForm' } });

// ✅ Correct — target the SmartField directly:
await ui5.control({
  controlType: 'sap.ui.comp.smartfield.SmartField',
  ancestor: { id: 'smartForm' },
});

// Or target by binding path (most stable):
await ui5.control({
  controlType: 'sap.ui.comp.smartfield.SmartField',
  bindingPath: { path: '/Vendor', propertyPath: 'Name1' },
});
```

---

## Custom Matchers

```typescript
// Verify control text
await expect(control).toHaveUI5Text('Save');

// Verify control is visible
await expect(control).toBeUI5Visible();

// Verify control is enabled
await expect(control).toBeUI5Enabled();

// Verify a property value
await expect(control).toHaveUI5Property('type', 'Emphasized');

// Verify value state (Error, Warning, Success, None)
await expect(control).toHaveUI5ValueState('Error');

// Verify OData binding path
await expect(control).toHaveUI5Binding('/Vendor/Name1');

// Verify control type
await expect(control).toBeUI5ControlType('sap.m.Button');

// Verify table cell text
await expect(control).toHaveUI5CellText(0, 1, 'Active');

// Verify table row count
await expect(control).toHaveUI5RowCount(5);

// Verify selected rows (by index)
await expect(control).toHaveUI5SelectedRows([0, 2]);
```

---

## Selector Strategy Guide

```text
Scenario                           → Best Selector
───────────────────────────────────────────────────────────────
Button with known stable ID        → { id: 'saveBtn' }
Button with visible text           → { controlType: 'sap.m.Button', properties: { text: 'Save' } }
Input bound to OData property      → { controlType: 'sap.m.Input', bindingPath: { path: '/Vendor', propertyPath: 'Name1' } }
Input in a specific form           → { controlType: 'sap.m.Input', ancestor: { id: 'vendorForm' } }
First matching control             → ui5.control() — throws if multiple found
All matching controls              → ui5.controls() — returns array
Control in table row N             → ui5.controls() then index, or ancestor: { controlType: 'sap.m.ColumnListItem' }
```
