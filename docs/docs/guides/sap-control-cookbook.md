---
sidebar_position: 30
title: SAP Control Cookbook
---

A practical reference for interacting with the most common SAP UI5 controls in Praman tests.
Each control includes its fully qualified type, recommended selectors, interaction examples,
and known pitfalls.

## SmartField

`sap.ui.comp.smartfield.SmartField`

SmartField is a metadata-driven wrapper that renders different inner controls (Input, ComboBox,
DatePicker, etc.) based on OData annotations. It appears throughout SAP Fiori Elements apps.

### Selector

```typescript
// By ID
const field = await ui5.control({
  controlType: 'sap.ui.comp.smartfield.SmartField',
  id: /CompanyCode/,
});

// By binding path (most reliable for SmartFields)
const field = await ui5.control({
  controlType: 'sap.ui.comp.smartfield.SmartField',
  bindingPath: { path: '/CompanyCode' },
});
```

### Interaction

```typescript
await ui5.fill({ controlType: 'sap.ui.comp.smartfield.SmartField', id: /CompanyCode/ }, '1000');

// Read current value
const value = await field.getProperty('value');
```

### Pitfalls

- `getControlType()` returns `sap.ui.comp.smartfield.SmartField`, **not** the inner control type
  (e.g., not `sap.m.Input`). Do not selector-match by the inner type.
- SmartField in **display mode** renders as `sap.m.Text` — calling `fill()` will fail. Check
  the `editable` property first.
- Value help dialogs opened by SmartField have a different control tree. Use `searchOpenDialogs: true`
  to find controls inside them.

## SmartTable

`sap.ui.comp.smarttable.SmartTable`

Metadata-driven table that auto-generates columns from OData annotations. Used in most Fiori
Elements List Report pages.

### Selector

```typescript
const table = await ui5.control({
  controlType: 'sap.ui.comp.smarttable.SmartTable',
  id: /LineItemsSmartTable/,
});
```

### Interaction

```typescript
// Get row count
const rowCount = await table.getProperty('count');

// Click a specific row (inner table is sap.ui.table.Table or sap.m.Table)
const rows = await ui5.controls({
  controlType: 'sap.m.ColumnListItem',
  ancestor: { controlType: 'sap.ui.comp.smarttable.SmartTable', id: /LineItemsSmartTable/ },
});
await rows[0].click();

// Trigger table personalization
await ui5.click({
  controlType: 'sap.m.OverflowToolbarButton',
  properties: { icon: 'sap-icon://action-settings' },
  ancestor: { controlType: 'sap.ui.comp.smarttable.SmartTable', id: /LineItemsSmartTable/ },
});
```

### Pitfalls

- SmartTable wraps either `sap.m.Table` (responsive) or `sap.ui.table.Table` (grid). Row
  selectors differ by inner table type.
- Row counts may reflect only loaded rows if server-side paging is active. Use `growing`
  property to check.
- Column visibility depends on table personalization variant — test data may not be visible
  in default columns.

## SmartFilterBar

`sap.ui.comp.smartfilterbar.SmartFilterBar`

Renders filter fields from OData annotations. The main filter bar in Fiori Elements List Reports.

### Selector

```typescript
const filterBar = await ui5.control({
  controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar',
  id: /listReportFilter/,
});
```

### Interaction

```typescript
// Set a filter value
await ui5.fill(
  {
    controlType: 'sap.ui.comp.smartfield.SmartField',
    ancestor: { controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar' },
    id: /CompanyCode/,
  },
  '1000',
);

// Click Go / Search
await ui5.click({
  controlType: 'sap.m.Button',
  properties: { text: 'Go' },
  ancestor: { controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar' },
});

// Expand filters (Adapt Filters dialog)
await ui5.click({
  controlType: 'sap.m.Button',
  properties: { text: 'Adapt Filters' },
  ancestor: { controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar' },
});
```

### Pitfalls

- Filter fields may not be visible by default. Use "Adapt Filters" to add fields before setting values.
- SmartFilterBar auto-triggers search on initial load with default variant — your filter values
  may be overwritten.
- Date range filters require `sap.m.DateRangeSelection` interaction, not simple `fill()`.

## OverflowToolbar

`sap.m.OverflowToolbar`

Toolbar that collapses items into an overflow popover when space is limited.

### Selector

```typescript
const toolbar = await ui5.control({
  controlType: 'sap.m.OverflowToolbar',
  id: /headerToolbar/,
});
```

### Interaction

```typescript
// Click a visible toolbar button
await ui5.click({
  controlType: 'sap.m.Button',
  properties: { text: 'Edit' },
  ancestor: { controlType: 'sap.m.OverflowToolbar', id: /headerToolbar/ },
});

// Click button that may be in overflow
await ui5.click({
  controlType: 'sap.m.OverflowToolbarButton',
  properties: { text: 'Delete' },
  ancestor: { controlType: 'sap.m.OverflowToolbar', id: /headerToolbar/ },
});
```

### Pitfalls

- Overflowed buttons are in a separate popover — use `searchOpenDialogs: true` if the button
  is in the overflow area.
- `sap.m.OverflowToolbarButton` vs `sap.m.Button` — buttons in overflow toolbars may use either
  type depending on configuration.

## IconTabBar

`sap.m.IconTabBar`

Tab strip used for section navigation in Object Pages and detail views.

### Selector

```typescript
const tabBar = await ui5.control({
  controlType: 'sap.m.IconTabBar',
  id: /detailTabBar/,
});
```

### Interaction

```typescript
// Switch to a specific tab by key
await ui5.click({
  controlType: 'sap.m.IconTabFilter',
  properties: { key: 'items' },
  ancestor: { controlType: 'sap.m.IconTabBar', id: /detailTabBar/ },
});

// Switch by text
await ui5.click({
  controlType: 'sap.m.IconTabFilter',
  properties: { text: 'Line Items' },
});
```

### Pitfalls

- Tab content is lazy-loaded by default. After switching tabs, wait for the content to render
  before interacting with controls inside it.
- Icon-only tabs have no `text` property — use `key` or `icon` to select them.

## ObjectPageLayout

`sap.uxap.ObjectPageLayout`

The layout container for Fiori Elements Object Pages. Contains header, sections, and subsections.

### Selector

```typescript
const objectPage = await ui5.control({
  controlType: 'sap.uxap.ObjectPageLayout',
});
```

### Interaction

```typescript
// Scroll to a specific section
await ui5.click({
  controlType: 'sap.m.Button',
  properties: { text: 'General Information' },
  ancestor: { controlType: 'sap.uxap.AnchorBar' },
});

// Toggle header (collapse/expand)
await ui5.click({
  controlType: 'sap.m.Button',
  id: /expandHeaderBtn/,
});

// Access a subsection
const section = await ui5.control({
  controlType: 'sap.uxap.ObjectPageSection',
  properties: { title: 'Pricing' },
});
```

### Pitfalls

- Sections use lazy loading — controls in non-visible sections may not exist in the control
  tree until scrolled to.
- Header facets are in `sap.uxap.ObjectPageHeaderContent`, not in the main sections.
- `sap.uxap.AnchorBar` is the internal navigation bar — section names there may differ from
  actual section titles.

## ComboBox

`sap.m.ComboBox`

Single-selection dropdown with type-ahead filtering.

### Selector

```typescript
const combo = await ui5.control({
  controlType: 'sap.m.ComboBox',
  id: /countryCombo/,
});
```

### Interaction

```typescript
// Type and select
await ui5.fill({ controlType: 'sap.m.ComboBox', id: /countryCombo/ }, 'Germany');

// Open dropdown and select by item key
await ui5.click({ controlType: 'sap.m.ComboBox', id: /countryCombo/ });
await ui5.click({
  controlType: 'sap.ui.core.ListItem',
  properties: { key: 'DE' },
  searchOpenDialogs: true,
});
```

### Pitfalls

- `fill()` triggers type-ahead but may not select the item. Verify with `getProperty('selectedKey')`.
- Dropdown items are rendered in a popup — use `searchOpenDialogs: true` to find them.

## MultiComboBox

`sap.m.MultiComboBox`

Multi-selection dropdown with token display.

### Selector

```typescript
const multi = await ui5.control({
  controlType: 'sap.m.MultiComboBox',
  id: /plantsMultiCombo/,
});
```

### Interaction

```typescript
// Select multiple items
await ui5.click({ controlType: 'sap.m.MultiComboBox', id: /plantsMultiCombo/ });
await ui5.click({
  controlType: 'sap.ui.core.ListItem',
  properties: { text: 'Plant 1000' },
  searchOpenDialogs: true,
});
await ui5.click({
  controlType: 'sap.ui.core.ListItem',
  properties: { text: 'Plant 2000' },
  searchOpenDialogs: true,
});

// Close dropdown
await ui5.click({ controlType: 'sap.m.MultiComboBox', id: /plantsMultiCombo/ });

// Read selected keys
const selectedKeys = await multi.getProperty('selectedKeys');
```

### Pitfalls

- Each click toggles an item. Clicking an already-selected item deselects it.
- Tokens may overflow and show "N More" — use `getProperty('selectedKeys')` to verify
  selections instead of counting visible tokens.

## MultiInput

`sap.m.MultiInput`

Text input with tokenizer for multiple values and optional value help.

### Selector

```typescript
const multiInput = await ui5.control({
  controlType: 'sap.m.MultiInput',
  id: /materialMultiInput/,
});
```

### Interaction

```typescript
// Add tokens by typing
await ui5.fill({ controlType: 'sap.m.MultiInput', id: /materialMultiInput/ }, 'MAT-001');
// Press Enter to confirm token (use keyboard interaction)
await multiInput.pressKey('Enter');

// Open value help dialog
await ui5.click({
  controlType: 'sap.ui.core.Icon',
  properties: { src: 'sap-icon://value-help' },
  ancestor: { controlType: 'sap.m.MultiInput', id: /materialMultiInput/ },
});
```

### Pitfalls

- Tokens require Enter key press to be committed — `fill()` alone is not sufficient.
- Value help button is a separate `sap.ui.core.Icon` control, not part of the MultiInput control.
- Removing tokens requires clicking the token's delete icon, not clearing the input.

## Select

`sap.m.Select`

Simple dropdown with no type-ahead (unlike ComboBox).

### Selector

```typescript
const select = await ui5.control({
  controlType: 'sap.m.Select',
  id: /currencySelect/,
});
```

### Interaction

```typescript
// Open and select an item
await ui5.click({ controlType: 'sap.m.Select', id: /currencySelect/ });
await ui5.click({
  controlType: 'sap.ui.core.ListItem',
  properties: { key: 'USD' },
  searchOpenDialogs: true,
});

// Direct selection via key (no UI interaction)
const currentKey = await select.getProperty('selectedKey');
```

### Pitfalls

- `sap.m.Select` does not support type-ahead. Use `click()` to open, then click the item.
- List items in the dropdown popup are `sap.ui.core.ListItem`, not `sap.m.StandardListItem`.

## DatePicker

`sap.m.DatePicker`

Date input with calendar popup.

### Selector

```typescript
const datePicker = await ui5.control({
  controlType: 'sap.m.DatePicker',
  id: /deliveryDatePicker/,
});
```

### Interaction

```typescript
// Fill directly with a date string (preferred approach)
await ui5.fill({ controlType: 'sap.m.DatePicker', id: /deliveryDatePicker/ }, '2025-03-15');

// Open calendar and select a date
await ui5.click({
  controlType: 'sap.ui.core.Icon',
  properties: { src: 'sap-icon://appointment-2' },
  ancestor: { controlType: 'sap.m.DatePicker', id: /deliveryDatePicker/ },
});
// Select day from calendar popup
await ui5.click({
  controlType: 'sap.ui.unified.calendar.DatesRow',
  searchOpenDialogs: true,
});
```

### Pitfalls

- Date format depends on user locale settings. Always use ISO format (`YYYY-MM-DD`) with
  `fill()` — Praman normalizes it to the configured locale.
- `sap.m.DateRangeSelection` is a separate control type for date ranges. Do not confuse it
  with `sap.m.DatePicker`.
- Calendar popup controls are in `sap.ui.unified.calendar` namespace — different from `sap.m`.

## Quick Reference Table

| Control          | Type                                        | Primary Selector Strategy | Key Method                   |
| ---------------- | ------------------------------------------- | ------------------------- | ---------------------------- |
| SmartField       | `sap.ui.comp.smartfield.SmartField`         | `bindingPath`             | `fill()`                     |
| SmartTable       | `sap.ui.comp.smarttable.SmartTable`         | `id`                      | `getProperty('count')`       |
| SmartFilterBar   | `sap.ui.comp.smartfilterbar.SmartFilterBar` | `id`                      | `fill()` on child fields     |
| OverflowToolbar  | `sap.m.OverflowToolbar`                     | `id`                      | `click()` on child buttons   |
| IconTabBar       | `sap.m.IconTabBar`                          | `id`                      | `click()` on `IconTabFilter` |
| ObjectPageLayout | `sap.uxap.ObjectPageLayout`                 | singleton (one per page)  | scroll to section            |
| ComboBox         | `sap.m.ComboBox`                            | `id`                      | `fill()` or click + select   |
| MultiComboBox    | `sap.m.MultiComboBox`                       | `id`                      | click to toggle items        |
| MultiInput       | `sap.m.MultiInput`                          | `id`                      | `fill()` + Enter key         |
| Select           | `sap.m.Select`                              | `id`                      | click + select item          |
| DatePicker       | `sap.m.DatePicker`                          | `id`                      | `fill()` with ISO date       |
