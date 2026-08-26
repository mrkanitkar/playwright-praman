# Control Interaction Patterns (CLI)

## Table of Contents

1. [Critical Warnings](#critical-warnings)
2. [Set Value + Fire Change + Wait for UI5](#set-value--fire-change--wait-for-ui5)
3. [Press Button](#press-button)
4. [Select from Dropdown](#select-from-dropdown)
5. [Check and Uncheck](#check-and-uncheck)
6. [Wait for UI5 Stable](#wait-for-ui5-stable)
7. [Execute Action in iframe Context](#execute-action-in-iframe-context)

---

## Critical Warnings

> **`console.log()` is invisible** -- inside `run-code`, `console.log()` output is silently swallowed. Always use `return` to produce output.

> **`snapshot` must use `--filename` flag** -- for agent workflows, always pass `--filename=snap.yml` to get a file reference (~200 tokens) instead of inlining the full YAML.

> **Every input must follow the three-step pattern**: `setValue()` + `fireChange()` + wait for UI5 stable. Skipping `fireChange()` means the UI5 framework never processes the value, and downstream bindings, validations, and OData requests will not trigger.

---

## Set Value + Fire Change + Wait for UI5

This is the fundamental SAP input pattern. All three steps are mandatory for the value to be recognized by the UI5 framework and OData model.

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, value}) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setValue(value);
    ctrl.fireChange({ value });
  }, { id: 'materialInput', value: 'MAT-001' });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Input set and UI5 stable';
}"
```

**Why all three steps**:

| Step                    | Purpose                                                             | What breaks if skipped                                                             |
| ----------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `setValue(value)`       | Sets the control's internal value                                   | Nothing appears in the input field                                                 |
| `fireChange({ value })` | Notifies the UI5 framework that the value changed                   | OData model not updated, validations not triggered, dependent fields not refreshed |
| Wait for UI5 stable     | Waits for all async processing (rendering, OData calls) to complete | Subsequent actions may execute before the value is fully processed                 |

**SmartField variant** -- SmartFields wrap an inner control; target the SmartField ID directly:

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, value}) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setValue(value);
    ctrl.fireChange({ value });
  }, { id: 'smartFieldVendor', value: 'SUP-100' });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'SmartField set and UI5 stable';
}"
```

---

## Press Button

Trigger a button press via `firePress()`. This is equivalent to a user clicking the button.

```bash
playwright-cli run-code "async page => {
  await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) throw new Error('Button not found: ' + id);
    if (!ctrl.getEnabled?.()) throw new Error('Button is disabled: ' + id);
    ctrl.firePress();
  }, 'saveButton');
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Button pressed and UI5 stable';
}"
```

**Find button by text first** (when ID is unknown):

```bash
playwright-cli run-code "async page => {
  await page.evaluate((btnText) => {
    const b = window.__praman_bridge;
    let target = null;
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl?.getMetadata().getName().includes('Button') && ctrl.getText?.() === btnText) {
        target = ctrl;
      }
    });
    if (!target) throw new Error('Button not found with text: ' + btnText);
    target.firePress();
  }, 'Save');
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Button pressed';
}"
```

---

## Select from Dropdown

For `sap.m.Select` and `sap.m.ComboBox`, use `setSelectedKey()` + `fireChange()`.

### sap.m.Select

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, key}) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setSelectedKey(key);
    ctrl.fireChange({ selectedItem: ctrl.getSelectedItem() });
  }, { id: 'companyCodeSelect', key: '1000' });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Dropdown selection applied';
}"
```

### sap.m.ComboBox

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, key}) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setSelectedKey(key);
    ctrl.setValue(ctrl.getSelectedItem()?.getText() ?? key);
    ctrl.fireChange({ value: ctrl.getValue() });
    ctrl.fireSelectionChange({ selectedItem: ctrl.getSelectedItem() });
  }, { id: 'plantComboBox', key: '1000' });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'ComboBox selection applied';
}"
```

### Read current selection

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    return {
      selectedKey: ctrl.getSelectedKey?.(),
      selectedText: ctrl.getSelectedItem()?.getText?.(),
      allKeys: ctrl.getItems?.()?.map(i => ({ key: i.getKey(), text: i.getText() }))
    };
  }, 'companyCodeSelect');
}"
```

---

## Check and Uncheck

For `sap.m.CheckBox`, use `setSelected()` + `fireSelect()`.

### Set checkbox state

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, selected}) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setSelected(selected);
    ctrl.fireSelect({ selected });
  }, { id: 'activeCheckBox', selected: true });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Checkbox set';
}"
```

### Toggle checkbox (flip current state)

```bash
playwright-cli run-code "async page => {
  await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    const newState = !ctrl.getSelected();
    ctrl.setSelected(newState);
    ctrl.fireSelect({ selected: newState });
  }, 'activeCheckBox');
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Checkbox toggled';
}"
```

### RadioButton

```bash
playwright-cli run-code "async page => {
  await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setSelected(true);
    ctrl.fireSelect({ selected: true });
  }, 'priorityRadioHigh');
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'RadioButton selected';
}"
```

### Switch

```bash
playwright-cli run-code "async page => {
  await page.evaluate(({id, state}) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setState(state);
    ctrl.fireChange({ state });
  }, { id: 'notificationSwitch', state: true });
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Switch toggled';
}"
```

---

## Wait for UI5 Stable

After any interaction, wait for the UI5 framework to finish processing. This is the standard polling pattern.

### Basic wait (recommended for most interactions)

```bash
playwright-cli run-code "async page => {
  await page.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'UI5 stable';
}"
```

### Extended wait (after OData calls or heavy operations)

```bash
playwright-cli run-code "async page => {
  await page.waitForFunction(() => {
    try {
      const core = sap.ui.getCore();
      const notDirty = !core.getUIDirty?.();
      const noPendingRequests = !sap.ui.getCore().getModel?.()?.hasPendingRequests?.();
      return notDirty && (noPendingRequests ?? true);
    } catch { return true; }
  }, { timeout: 60000 });
  return 'UI5 stable and OData idle';
}"
```

### When to increase the timeout

| Scenario                              | Recommended Timeout |
| ------------------------------------- | ------------------- |
| Simple button press / checkbox toggle | `30000` (30s)       |
| OData create / update / delete        | `60000` (60s)       |
| Navigation to a new view              | `60000` (60s)       |
| Complex batch operations              | `120000` (120s)     |

---

## Execute Action in iframe Context

When the SAP app runs inside an iframe (FLP, WorkZone), all interactions must target the correct frame.

### Interact with a control in an iframe

```bash
playwright-cli run-code "async page => {
  const appFrame = page.frames().find(f => f.url().includes('/sap/'));
  if (!appFrame) return { error: 'SAP app frame not found' };
  await appFrame.evaluate(({id, value}) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.setValue(value);
    ctrl.fireChange({ value });
  }, { id: 'materialInput', value: 'MAT-001' });
  await appFrame.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Input set in iframe';
}"
```

### Press a button in an iframe

```bash
playwright-cli run-code "async page => {
  const appFrame = page.frames().find(f => f.url().includes('/sap/'));
  if (!appFrame) return { error: 'SAP app frame not found' };
  await appFrame.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    ctrl.firePress();
  }, 'saveButton');
  await appFrame.waitForFunction(() => {
    try { return !sap.ui.getCore().getUIDirty?.(); } catch { return true; }
  }, { timeout: 30000 });
  return 'Button pressed in iframe';
}"
```

**Important**: The `waitForFunction` must also target the frame (`appFrame.waitForFunction`), not the top-level page. UI5's `sap.ui.getCore()` is only available in the frame where UI5 is loaded.
