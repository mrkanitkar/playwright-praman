# UI5 Control Type to Method Lookup

## Table of Contents

1. [Critical Warnings](#critical-warnings)
2. [How to Use This Reference](#how-to-use-this-reference)
3. [Input Controls](#input-controls)
4. [Button Controls](#button-controls)
5. [Selection Controls](#selection-controls)
6. [Display Controls](#display-controls)
7. [Container Controls](#container-controls)
8. [Table Controls](#table-controls)
9. [Date and Time Controls](#date-and-time-controls)
10. [Smart Controls](#smart-controls)
11. [MDC Controls](#mdc-controls)
12. [Fiori Elements Controls](#fiori-elements-controls)
13. [Runtime Method Discovery](#runtime-method-discovery)

---

## Critical Warnings

> **`console.log()` is invisible** -- inside `run-code`, `console.log()` output is silently swallowed. Always use `return` to produce output.

> **`snapshot` must use `--filename` flag** -- for agent workflows, always pass `--filename=snap.yml` to get a file reference (~200 tokens) instead of inlining the full YAML.

> **Not all methods exist on every instance** -- always use optional chaining (`ctrl.getText?.()`) to avoid runtime errors when a method is not available on a specific control variant.

---

## How to Use This Reference

Each table below maps a UI5 control type to its key methods, organized by:

- **Read Methods** -- retrieve current state (safe, no side effects)
- **Write Methods** -- change control state programmatically
- **Event Methods** -- fire events to simulate user interaction (triggers UI5 framework processing)

**Standard interaction pattern for all writable controls**:

```
1. Write method:  ctrl.setValue(v)         -- set the new value
2. Event method:  ctrl.fireChange({value}) -- notify UI5 the value changed
3. Wait:          waitForFunction(...)     -- wait for UI5 to finish processing
```

---

## Input Controls

| Control Type        | Read Methods                                                                                                | Write Methods | Event Methods                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------------- |
| `sap.m.Input`       | `getValue()`, `getPlaceholder()`, `getEditable()`, `getEnabled()`, `getValueState()`, `getValueStateText()` | `setValue(v)` | `fireChange({value})`, `fireLiveChange({value})`, `fireSubmit({value})`      |
| `sap.m.TextArea`    | `getValue()`, `getRows()`, `getMaxLength()`, `getEditable()`                                                | `setValue(v)` | `fireChange({value})`, `fireLiveChange({value})`                             |
| `sap.m.SearchField` | `getValue()`, `getPlaceholder()`, `getEnabled()`                                                            | `setValue(v)` | `fireSearch({query})`, `fireLiveChange({newValue})`                          |
| `sap.m.MaskInput`   | `getValue()`, `getMask()`, `getPlaceholder()`                                                               | `setValue(v)` | `fireChange({value})`                                                        |
| `sap.m.StepInput`   | `getValue()`, `getMin()`, `getMax()`, `getStep()`                                                           | `setValue(n)` | `fireChange({value})`                                                        |
| `sap.m.MultiInput`  | `getValue()`, `getTokens()`, `getEditable()`                                                                | `setValue(v)` | `fireChange({value})`, `fireTokenUpdate({type, addedTokens, removedTokens})` |

---

## Button Controls

| Control Type            | Read Methods                                                          | Write Methods       | Event Methods                     |
| ----------------------- | --------------------------------------------------------------------- | ------------------- | --------------------------------- |
| `sap.m.Button`          | `getText()`, `getIcon()`, `getEnabled()`, `getType()`, `getVisible()` | --                  | `firePress()`                     |
| `sap.m.ToggleButton`    | `getText()`, `getPressed()`, `getEnabled()`                           | `setPressed(b)`     | `firePress({pressed})`            |
| `sap.m.MenuButton`      | `getText()`, `getButtonMode()`, `getEnabled()`                        | --                  | `fireDefaultAction()`             |
| `sap.m.SegmentedButton` | `getSelectedKey()`, `getItems()`, `getEnabled()`                      | `setSelectedKey(k)` | `fireSelectionChange({item})`     |
| `sap.m.SplitButton`     | `getText()`, `getEnabled()`                                           | --                  | `firePress()`, `fireArrowPress()` |
| `sap.m.Link`            | `getText()`, `getHref()`, `getEnabled()`                              | --                  | `firePress()`                     |

---

## Selection Controls

| Control Type             | Read Methods                                                            | Write Methods                      | Event Methods                                                                          |
| ------------------------ | ----------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------- |
| `sap.m.Select`           | `getSelectedKey()`, `getSelectedItem()`, `getItems()`, `getEnabled()`   | `setSelectedKey(k)`                | `fireChange({selectedItem})`                                                           |
| `sap.m.ComboBox`         | `getSelectedKey()`, `getValue()`, `getItems()`, `getEnabled()`          | `setSelectedKey(k)`, `setValue(v)` | `fireChange({value})`, `fireSelectionChange({selectedItem})`                           |
| `sap.m.MultiComboBox`    | `getSelectedKeys()`, `getSelectedItems()`, `getItems()`                 | `setSelectedKeys(keys[])`          | `fireSelectionChange({changedItem, selected})`, `fireSelectionFinish({selectedItems})` |
| `sap.m.CheckBox`         | `getSelected()`, `getText()`, `getEnabled()`, `getEditable()`           | `setSelected(b)`                   | `fireSelect({selected})`                                                               |
| `sap.m.RadioButton`      | `getSelected()`, `getText()`, `getEnabled()`, `getGroupName()`          | `setSelected(b)`                   | `fireSelect({selected})`                                                               |
| `sap.m.RadioButtonGroup` | `getSelectedIndex()`, `getSelectedButton()`, `getButtons()`             | `setSelectedIndex(i)`              | `fireSelect({selectedIndex})`                                                          |
| `sap.m.Switch`           | `getState()`, `getEnabled()`, `getCustomTextOn()`, `getCustomTextOff()` | `setState(b)`                      | `fireChange({state})`                                                                  |

---

## Display Controls

| Control Type             | Read Methods                                                    | Write Methods                     | Event Methods      |
| ------------------------ | --------------------------------------------------------------- | --------------------------------- | ------------------ |
| `sap.m.Text`             | `getText()`, `getMaxLines()`, `getVisible()`                    | `setText(s)`                      | --                 |
| `sap.m.Label`            | `getText()`, `getRequired()`, `getVisible()`                    | `setText(s)`                      | --                 |
| `sap.m.Title`            | `getText()`, `getLevel()`, `getVisible()`                       | `setText(s)`                      | --                 |
| `sap.m.ObjectStatus`     | `getText()`, `getState()`, `getIcon()`, `getVisible()`          | `setText(s)`, `setState(s)`       | --                 |
| `sap.m.ObjectNumber`     | `getNumber()`, `getUnit()`, `getState()`                        | `setNumber(s)`, `setUnit(s)`      | --                 |
| `sap.m.ObjectIdentifier` | `getTitle()`, `getText()`, `getTitleActive()`                   | `setTitle(s)`, `setText(s)`       | `fireTitlePress()` |
| `sap.m.MessageStrip`     | `getText()`, `getType()`, `getShowCloseButton()`                | `setText(s)`, `setType(t)`        | `fireClose()`      |
| `sap.ui.core.Icon`       | `getSrc()`, `getColor()`, `getVisible()`                        | --                                | `firePress()`      |
| `sap.m.GenericTile`      | `getHeader()`, `getSubheader()`, `getState()`, `getFrameType()` | `setHeader(s)`, `setSubheader(s)` | `firePress()`      |
| `sap.m.ObjectAttribute`  | `getText()`, `getTitle()`, `getActive()`                        | `setText(s)`                      | `firePress()`      |

---

## Container Controls

| Control Type                | Read Methods                                                                        | Write Methods            | Event Methods                         |
| --------------------------- | ----------------------------------------------------------------------------------- | ------------------------ | ------------------------------------- |
| `sap.m.Dialog`              | `getTitle()`, `isOpen()`, `getContent()`, `getButtons()`, `getType()`, `getState()` | `setTitle(s)`            | `fireAfterOpen()`, `fireAfterClose()` |
| `sap.m.Popover`             | `getTitle()`, `isOpen()`, `getContent()`                                            | `setTitle(s)`            | `fireAfterOpen()`, `fireAfterClose()` |
| `sap.m.Panel`               | `getHeaderText()`, `getExpanded()`, `getContent()`                                  | `setExpanded(b)`         | `fireExpand({expand})`                |
| `sap.m.Page`                | `getTitle()`, `getShowHeader()`, `getContent()`                                     | `setTitle(s)`            | --                                    |
| `sap.f.DynamicPage`         | `getTitle()`, `getContent()`, `getHeaderExpanded()`                                 | `setHeaderExpanded(b)`   | --                                    |
| `sap.uxap.ObjectPageLayout` | `getSections()`, `getSelectedSection()`, `getHeaderTitle()`                         | `setSelectedSection(id)` | `fireSectionChange({section})`        |
| `sap.m.IconTabBar`          | `getSelectedKey()`, `getItems()`                                                    | `setSelectedKey(k)`      | `fireSelect({key, item})`             |
| `sap.m.TabContainer`        | `getSelectedItem()`, `getItems()`                                                   | `setSelectedItem(item)`  | `fireItemSelect({item})`              |

---

## Table Controls

| Control Type                        | Read Methods                                                                                    | Write Methods                                           | Event Methods                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `sap.m.Table`                       | `getItems()`, `getColumns()`, `getMode()`, `getSelectedItems()`, `getGrowing()`                 | `setSelectedItem(item, b)`                              | `fireSelectionChange({listItem, selected})`, `fireItemPress({listItem})`       |
| `sap.m.ColumnListItem`              | `getCells()`, `getSelected()`, `getType()`                                                      | `setSelected(b)`                                        | `firePress()`                                                                  |
| `sap.ui.table.Table`                | `getRows()`, `getColumns()`, `getVisibleRowCount()`, `getSelectedIndex()`, `getBinding('rows')` | `setSelectedIndex(i)`, `addSelectionInterval(from, to)` | `fireRowSelectionChange({rowIndex})`, `fireCellClick({rowIndex, columnIndex})` |
| `sap.ui.table.AnalyticalTable`      | Same as `sap.ui.table.Table` + `getGroupedColumns()`                                            | Same as `sap.ui.table.Table`                            | Same as `sap.ui.table.Table`                                                   |
| `sap.ui.table.TreeTable`            | Same as `sap.ui.table.Table` + `isExpanded(i)`                                                  | `expand(i)`, `collapse(i)`                              | `fireToggleOpenState({rowIndex, expanded})`                                    |
| `sap.ui.comp.smarttable.SmartTable` | `getTable()`, `getEntitySet()`, `getSmartFilterId()`, `getTableType()`                          | `rebindTable()`                                         | `fireDataReceived()`                                                           |
| `sap.m.List`                        | `getItems()`, `getMode()`, `getSelectedItems()`                                                 | `setSelectedItem(item, b)`                              | `fireSelectionChange({listItem, selected})`, `fireItemPress({listItem})`       |

---

## Date and Time Controls

| Control Type            | Read Methods                                                                             | Write Methods                                             | Event Methods                |
| ----------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------- |
| `sap.m.DatePicker`      | `getValue()`, `getDateValue()`, `getDisplayFormat()`, `getValueFormat()`, `getEnabled()` | `setValue(s)`, `setDateValue(d)`                          | `fireChange({value, valid})` |
| `sap.m.DateRangePicker` | `getValue()`, `getDateValue()`, `getSecondDateValue()`, `getDisplayFormat()`             | `setValue(s)`, `setDateValue(d)`, `setSecondDateValue(d)` | `fireChange({value, valid})` |
| `sap.m.TimePicker`      | `getValue()`, `getDateValue()`, `getDisplayFormat()`                                     | `setValue(s)`, `setDateValue(d)`                          | `fireChange({value, valid})` |
| `sap.m.DateTimePicker`  | `getValue()`, `getDateValue()`, `getDisplayFormat()`                                     | `setValue(s)`, `setDateValue(d)`                          | `fireChange({value, valid})` |

---

## Smart Controls

These controls auto-generate UI based on OData metadata. They wrap standard `sap.m` controls internally.

| Control Type                                  | Read Methods                                                                          | Write Methods        | Event Methods                        |
| --------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------- | ------------------------------------ |
| `sap.ui.comp.smartfield.SmartField`           | `getValue()`, `getEditable()`, `getVisible()`, `getEntitySet()`, `getConfiguration()` | `setValue(v)`        | `fireChange({value})`                |
| `sap.ui.comp.smartform.SmartForm`             | `getGroups()`, `getEditable()`, `getEntitySet()`                                      | `setEditable(b)`     | --                                   |
| `sap.ui.comp.smartfilterbar.SmartFilterBar`   | `getFilters()`, `getBasicSearchFieldName()`, `getEntitySet()`                         | `setFilterData(obj)` | `fireSearch()`, `fireFilterChange()` |
| `sap.ui.comp.smarttable.SmartTable`           | See [Table Controls](#table-controls)                                                 | `rebindTable()`      | `fireDataReceived()`                 |
| `sap.ui.comp.smartchart.SmartChart`           | `getChart()`, `getEntitySet()`                                                        | --                   | `fireDataReceived()`                 |
| `sap.ui.comp.valuehelpdialog.ValueHelpDialog` | `getTitle()`, `getTable()`, `isOpen()`                                                | --                   | `fireOk({tokens})`, `fireCancel()`   |

**SmartField interaction pattern** -- always target the SmartField, not its inner control:

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, value}) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setValue(value);
    ctrl.fireChange({ value });
  }, { id: 'smartFieldVendorName', value: 'Acme Corp' });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'SmartField set';
}"
```

---

## MDC Controls

Modern SAP UI5 MDC (Model-Driven Controls) used in SAP Fiori elements V4 apps.

| Control Type                 | Read Methods                                     | Write Methods        | Event Methods                          |
| ---------------------------- | ------------------------------------------------ | -------------------- | -------------------------------------- |
| `sap.ui.mdc.Field`           | `getValue()`, `getEditMode()`, `getConditions()` | `setValue(v)`        | `fireChange({value})`                  |
| `sap.ui.mdc.FilterBar`       | `getConditions()`, `getFilterItems()`            | `setConditions(obj)` | `fireSearch()`, `fireFiltersChanged()` |
| `sap.ui.mdc.Table`           | `getType()`, `getRowBinding()`, `getColumns()`   | --                   | `fireRowPress({bindingContext})`       |
| `sap.ui.mdc.ValueHelp`       | `isOpen()`                                       | --                   | `fireSelect({conditions})`             |
| `sap.ui.mdc.MultiValueField` | `getItems()`, `getConditions()`                  | --                   | `fireChange({items})`                  |

---

## Fiori Elements Controls

High-level controls used in SAP Fiori elements (List Report, Object Page, etc.).

| Control Type                     | Read Methods                            | Write Methods        | Event Methods  |
| -------------------------------- | --------------------------------------- | -------------------- | -------------- |
| `sap.fe.core.controls.FilterBar` | `getConditions()`, `getFilterItems()`   | `setConditions(obj)` | `fireSearch()` |
| `sap.fe.macros.table.TableAPI`   | `getContent()`, `getSelectedContexts()` | --                   | --             |
| `sap.fe.macros.chart.ChartAPI`   | `getContent()`                          | --                   | --             |

**Note**: Fiori elements apps often generate control IDs dynamically. Use `controlType` + `ancestor` selectors rather than relying on IDs.

---

## Runtime Method Discovery

When you encounter an unfamiliar control, discover its available methods at runtime.

### List all getter methods on a control

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Control not found', id };
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(ctrl))
      .filter(m => m.startsWith('get') && typeof ctrl[m] === 'function')
      .sort();
    return {
      type: ctrl.getMetadata().getName(),
      getterCount: methods.length,
      getters: methods.slice(0, 50)
    };
  }, 'unknownControlId');
}"
```

### List all fire\* event methods on a control

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Control not found', id };
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(ctrl))
      .filter(m => m.startsWith('fire') && typeof ctrl[m] === 'function')
      .sort();
    return {
      type: ctrl.getMetadata().getName(),
      eventCount: methods.length,
      events: methods
    };
  }, 'unknownControlId');
}"
```

### List all setter methods on a control

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Control not found', id };
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(ctrl))
      .filter(m => m.startsWith('set') && typeof ctrl[m] === 'function')
      .sort();
    return {
      type: ctrl.getMetadata().getName(),
      setterCount: methods.length,
      setters: methods.slice(0, 50)
    };
  }, 'unknownControlId');
}"
```

### Full method inventory (getters + setters + events)

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Control not found', id };
    const proto = Object.getPrototypeOf(ctrl);
    const all = Object.getOwnPropertyNames(proto).filter(m => typeof ctrl[m] === 'function');
    return {
      type: ctrl.getMetadata().getName(),
      getters: all.filter(m => m.startsWith('get')).sort(),
      setters: all.filter(m => m.startsWith('set')).sort(),
      events: all.filter(m => m.startsWith('fire')).sort(),
      other: all.filter(m => !m.startsWith('get') && !m.startsWith('set') && !m.startsWith('fire')).sort().slice(0, 20)
    };
  }, 'unknownControlId');
}"
```
