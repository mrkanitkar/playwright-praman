# Table, Dialog & Date Picker Operations (CLI)

## Table of Contents

1. [Critical Warnings](#critical-warnings)
2. [Table Row Count](#table-row-count)
3. [Table Cell Values](#table-cell-values)
4. [Table Row Selection](#table-row-selection)
5. [Table Data Export](#table-data-export)
6. [Dialog Confirm and Dismiss](#dialog-confirm-and-dismiss)
7. [Wait for Dialog](#wait-for-dialog)
8. [Date Picker](#date-picker)
9. [Date Range Picker](#date-range-picker)
10. [MessageBox Handling](#messagebox-handling)

---

## Critical Warnings

> **`console.log()` is invisible** -- inside `run-code`, `console.log()` output is silently swallowed. Always use `return` to produce output.

> **`snapshot` must use `--filename` flag** -- for agent workflows, always pass `--filename=snap.yml` to get a file reference (~200 tokens) instead of inlining the full YAML.

> **Dialogs render in `#sap-ui-static`** -- dialog controls are NOT in the main view tree. You must scan `document.getElementById('sap-ui-static')` to find them.

---

## Table Row Count

Get the number of rows currently rendered in a table.

### sap.m.Table (Responsive Table)

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Table not found', id };
    const items = ctrl.getItems();
    return { tableId: id, rowCount: items.length };
  }, 'ordersTable');
}"
```

### sap.ui.table.Table (Grid Table)

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Table not found', id };
    const binding = ctrl.getBinding('rows');
    return {
      tableId: id,
      visibleRowCount: ctrl.getVisibleRowCount(),
      totalRowCount: binding?.getLength() ?? 'unknown'
    };
  }, 'gridTable');
}"
```

---

## Table Cell Values

Read cell values from a table row.

### sap.m.Table -- read cells from a specific row

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(({id, rowIndex}) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Table not found', id };
    const items = ctrl.getItems();
    if (rowIndex >= items.length) return { error: 'Row index out of range', rowIndex, total: items.length };
    const row = items[rowIndex];
    const cells = row.getCells();
    return cells.map((cell, i) => ({
      column: i,
      type: cell.getMetadata().getName(),
      text: cell.getText?.() ?? cell.getValue?.() ?? cell.getTitle?.() ?? null
    }));
  }, { id: 'ordersTable', rowIndex: 0 });
}"
```

### sap.ui.table.Table -- read cells from a specific row

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(({id, rowIndex}) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Table not found', id };
    const rows = ctrl.getRows();
    if (rowIndex >= rows.length) return { error: 'Row index out of range' };
    const row = rows[rowIndex];
    const cells = row.getCells();
    return cells.map((cell, i) => ({
      column: i,
      type: cell.getMetadata().getName(),
      text: cell.getText?.() ?? cell.getValue?.() ?? null
    }));
  }, { id: 'gridTable', rowIndex: 0 });
}"
```

---

## Table Row Selection

Select a row in a table programmatically.

### sap.m.Table -- select by index

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, rowIndex}) => {
    const ctrl = window.__praman_bridge.getById(id);
    const items = ctrl.getItems();
    if (rowIndex >= items.length) throw new Error('Row index out of range');
    ctrl.setSelectedItem(items[rowIndex], true);
    ctrl.fireSelectionChange({ listItem: items[rowIndex], selected: true });
  }, { id: 'ordersTable', rowIndex: 0 });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Row selected';
}"
```

### sap.ui.table.Table -- select by index

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, rowIndex}) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setSelectedIndex(rowIndex);
    ctrl.fireRowSelectionChange({ rowIndex, rowContext: ctrl.getContextByIndex(rowIndex) });
  }, { id: 'gridTable', rowIndex: 0 });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Row selected';
}"
```

---

## Table Data Export

Export all visible table rows as a JSON array.

### sap.m.Table -- full data export

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Table not found', id };
    const columns = ctrl.getColumns().map(col => {
      const header = col.getHeader();
      return header?.getText?.() ?? header?.getTitle?.() ?? 'Column';
    });
    const rows = ctrl.getItems().map(item => {
      const cells = item.getCells();
      const row = {};
      cells.forEach((cell, i) => {
        row[columns[i] ?? ('col_' + i)] = cell.getText?.() ?? cell.getValue?.() ?? null;
      });
      return row;
    });
    return { columns, rowCount: rows.length, rows: rows.slice(0, 100) };
  }, 'ordersTable');
}"
```

### sap.ui.table.Table -- full data export

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'Table not found', id };
    const columns = ctrl.getColumns().map(col => col.getLabel()?.getText?.() ?? 'Column');
    const rows = ctrl.getRows().map(row => {
      const cells = row.getCells();
      const rowData = {};
      cells.forEach((cell, i) => {
        rowData[columns[i] ?? ('col_' + i)] = cell.getText?.() ?? cell.getValue?.() ?? null;
      });
      return rowData;
    });
    return { columns, rowCount: rows.length, rows: rows.slice(0, 100) };
  }, 'gridTable');
}"
```

**Note**: Results are capped at 100 rows. Adjust `.slice(0, 100)` as needed. For very large tables, read the OData binding length first and paginate.

---

## Dialog Confirm and Dismiss

Find buttons in the `#sap-ui-static` area and press them to confirm or dismiss dialogs.

### Confirm dialog (press OK / Yes / Save / Confirm)

```bash
playwright-cli run-code "async page => {
  await page.evaluate((confirmTexts) => {
    const staticArea = document.getElementById('sap-ui-static');
    if (!staticArea) throw new Error('No static area found');
    const b = window.__praman_bridge;
    let confirmed = false;
    staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (!ctrl) return;
      const name = ctrl.getMetadata().getName();
      if (!name.includes('Button')) return;
      const text = ctrl.getText?.() ?? '';
      if (confirmTexts.includes(text) && ctrl.getVisible?.() && ctrl.getEnabled?.()) {
        ctrl.firePress();
        confirmed = true;
      }
    });
    if (!confirmed) throw new Error('No confirm button found in dialog');
  }, ['OK', 'Yes', 'Save', 'Confirm', 'Accept', 'Submit']);
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Dialog confirmed';
}"
```

### Dismiss dialog (press Cancel / No / Close)

```bash
playwright-cli run-code "async page => {
  await page.evaluate((dismissTexts) => {
    const staticArea = document.getElementById('sap-ui-static');
    if (!staticArea) throw new Error('No static area found');
    const b = window.__praman_bridge;
    let dismissed = false;
    staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (!ctrl) return;
      const name = ctrl.getMetadata().getName();
      if (!name.includes('Button')) return;
      const text = ctrl.getText?.() ?? '';
      if (dismissTexts.includes(text) && ctrl.getVisible?.() && ctrl.getEnabled?.()) {
        ctrl.firePress();
        dismissed = true;
      }
    });
    if (!dismissed) throw new Error('No dismiss button found in dialog');
  }, ['Cancel', 'No', 'Close', 'Dismiss', 'Abort']);
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Dialog dismissed';
}"
```

### Press a specific dialog button by exact text

```bash
playwright-cli run-code "async page => {
  await page.evaluate((btnText) => {
    const staticArea = document.getElementById('sap-ui-static');
    if (!staticArea) throw new Error('No static area found');
    const b = window.__praman_bridge;
    let pressed = false;
    staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (!ctrl) return;
      if (ctrl.getMetadata().getName().includes('Button') && ctrl.getText?.() === btnText) {
        ctrl.firePress();
        pressed = true;
      }
    });
    if (!pressed) throw new Error('Button not found in dialog: ' + btnText);
  }, 'Delete');
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Dialog button pressed';
}"
```

---

## Wait for Dialog

Poll for a dialog to appear before interacting with it.

### Wait for any dialog to open

```bash
playwright-cli run-code "async page => {
  const start = Date.now();
  while (Date.now() - start < 10000) {
    const found = await page.evaluate(() => {
      const staticArea = document.getElementById('sap-ui-static');
      if (!staticArea) return null;
      const b = window.__praman_bridge;
      const dialogs = [];
      staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
        const ctrl = b.getById(el.getAttribute('data-sap-ui'));
        if (!ctrl) return;
        const name = ctrl.getMetadata().getName();
        if ((name === 'sap.m.Dialog' || name === 'sap.m.Popover') && ctrl.isOpen?.()) {
          dialogs.push({
            id: ctrl.getId(),
            type: name,
            title: ctrl.getTitle?.()
          });
        }
      });
      return dialogs.length > 0 ? dialogs : null;
    });
    if (found) return found;
    await new Promise(r => setTimeout(r, 250));
  }
  return { error: 'No dialog appeared within 10s timeout' };
}"
```

### Wait for a dialog with a specific title

```bash
playwright-cli run-code "async page => {
  const start = Date.now();
  while (Date.now() - start < 15000) {
    const found = await page.evaluate((expectedTitle) => {
      const staticArea = document.getElementById('sap-ui-static');
      if (!staticArea) return null;
      const b = window.__praman_bridge;
      let match = null;
      staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
        const ctrl = b.getById(el.getAttribute('data-sap-ui'));
        if (!ctrl) return;
        const name = ctrl.getMetadata().getName();
        if (name === 'sap.m.Dialog' && ctrl.isOpen?.() && ctrl.getTitle?.() === expectedTitle) {
          match = { id: ctrl.getId(), title: ctrl.getTitle() };
        }
      });
      return match;
    }, 'Confirm Deletion');
    if (found) return found;
    await new Promise(r => setTimeout(r, 250));
  }
  return { error: 'Dialog with expected title not found within 15s' };
}"
```

---

## Date Picker

Set and read date picker values. Always use `setValue()` + `fireChange()` -- the same three-step pattern as other inputs.

### Set a date

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, value}) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) throw new Error('DatePicker not found: ' + id);
    ctrl.setValue(value);
    ctrl.fireChange({ value, valid: true });
  }, { id: 'deliveryDatePicker', value: '2024-03-15' });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Date set';
}"
```

### Read a date

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'DatePicker not found', id };
    return {
      value: ctrl.getValue(),
      dateValue: ctrl.getDateValue()?.toISOString() ?? null,
      displayFormat: ctrl.getDisplayFormat?.() ?? null,
      valueFormat: ctrl.getValueFormat?.() ?? null
    };
  }, 'deliveryDatePicker');
}"
```

### Date format guidance

| Format       | Example      | When to Use                                      |
| ------------ | ------------ | ------------------------------------------------ |
| ISO 8601     | `2024-03-15` | When `valueFormat` is `yyyy-MM-dd` (most common) |
| US locale    | `03/15/2024` | When `displayFormat` is `MM/dd/yyyy`             |
| EU locale    | `15.03.2024` | When `displayFormat` is `dd.MM.yyyy`             |
| SAP internal | `20240315`   | When `valueFormat` is `yyyyMMdd` (ABAP date)     |

**Best practice**: Read the `valueFormat` first to determine the correct format string, then use that format for `setValue()`.

---

## Date Range Picker

Set start and end dates on a `sap.m.DateRangePicker`.

### Set date range

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, start, end}) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) throw new Error('DateRangePicker not found: ' + id);
    ctrl.setValue(start + ' - ' + end);
    ctrl.setDateValue(new Date(start));
    ctrl.setSecondDateValue(new Date(end));
    ctrl.fireChange({ value: ctrl.getValue(), valid: true });
  }, { id: 'dateRangePicker', start: '2024-01-01', end: '2024-03-31' });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Date range set';
}"
```

### Read date range

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'DateRangePicker not found', id };
    return {
      value: ctrl.getValue(),
      startDate: ctrl.getDateValue()?.toISOString() ?? null,
      endDate: ctrl.getSecondDateValue()?.toISOString() ?? null
    };
  }, 'dateRangePicker');
}"
```

---

## MessageBox Handling

SAP `sap.m.MessageBox` creates standard confirm/alert/warning dialogs. These also render in `#sap-ui-static`.

### Detect and identify a MessageBox

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const staticArea = document.getElementById('sap-ui-static');
    if (!staticArea) return { error: 'No static area' };
    const b = window.__praman_bridge;
    const messageBoxes = [];
    staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (!ctrl) return;
      const name = ctrl.getMetadata().getName();
      if (name === 'sap.m.Dialog' && ctrl.isOpen?.()) {
        const buttons = [];
        (ctrl.getButtons?.() ?? []).forEach(btn => {
          buttons.push({ text: btn.getText?.(), type: btn.getType?.(), enabled: btn.getEnabled?.() });
        });
        messageBoxes.push({
          id: ctrl.getId(),
          title: ctrl.getTitle?.(),
          type: ctrl.getType?.(),
          state: ctrl.getState?.(),
          content: ctrl.getContent?.()?.map(c => c.getText?.())?.filter(Boolean),
          buttons
        });
      }
    });
    return messageBoxes.length > 0 ? messageBoxes : { noMessageBox: true };
  });
}"
```

### Confirm a MessageBox (press OK / Yes)

```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    const staticArea = document.getElementById('sap-ui-static');
    const b = window.__praman_bridge;
    staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (!ctrl) return;
      if (ctrl.getMetadata().getName() === 'sap.m.Dialog' && ctrl.isOpen?.()) {
        const okBtn = (ctrl.getButtons?.() ?? []).find(btn =>
          ['OK', 'Yes', 'Confirm'].includes(btn.getText?.())
        );
        if (okBtn) okBtn.firePress();
      }
    });
  });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'MessageBox confirmed';
}"
```

### Dismiss a MessageBox (press Cancel / No)

```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    const staticArea = document.getElementById('sap-ui-static');
    const b = window.__praman_bridge;
    staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (!ctrl) return;
      if (ctrl.getMetadata().getName() === 'sap.m.Dialog' && ctrl.isOpen?.()) {
        const cancelBtn = (ctrl.getButtons?.() ?? []).find(btn =>
          ['Cancel', 'No', 'Close'].includes(btn.getText?.())
        );
        if (cancelBtn) cancelBtn.firePress();
      }
    });
  });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'MessageBox dismissed';
}"
```
