---
title: Control Discovery via Playwright CLI
description: Discover SAP UI5 controls using the Playwright CLI and the Praman bridge — single lookups, bulk enumeration, property inspection, dialog discovery, OData detection, and polling patterns.
sidebar_label: CLI Control Discovery
---

# Control Discovery via Playwright CLI

The Playwright CLI provides direct, low-level access to SAP UI5 controls through the
Praman bridge (`window.__praman_bridge`). This guide covers every discovery pattern
you need — from looking up a single control by ID to polling for asynchronously
rendered controls.

All examples use `run-code`, which executes an `async page => { ... }` function in
the browser context. **Two critical rules apply to every `run-code` call:**

1. **`console.log()` is invisible** — output is silently swallowed. Always use `return`.
2. **`snapshot` requires `--filename`** — always pass `--filename=snap.yml` to get a
   compact file reference (~200 tokens) instead of inlined YAML.

## Prerequisites

- Playwright CLI session running against a live SAP system
- Praman bridge injected via `initScript` (see [CLI Iframe Guide](./playwright-cli-iframes.md)
  for injection details)
- SAP UI5 application fully loaded in the browser

## Bridge Readiness Check

Before running any discovery command, verify the bridge is initialized and the UI5
runtime is available.

### Quick status check

```bash
playwright-cli run-code "async page => {
  return {
    bridgeExists: typeof window.__praman_bridge !== 'undefined',
    bridgeReady: !!(window.__praman_bridge && window.__praman_bridge.ready),
    ui5Version: typeof sap !== 'undefined' ? sap.ui.version : 'UI5 not loaded'
  };
}"
```

Expected output when everything is healthy:

```json
{
  "bridgeExists": true,
  "bridgeReady": true,
  "ui5Version": "1.120.4"
}
```

### Wait for readiness (with timeout)

On slow SAP systems, UI5 can take minutes to fully initialize. Use `waitForFunction`
to block until the bridge signals readiness:

```bash
playwright-cli run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Bridge ready: UI5 v' + await page.evaluate(() => sap.ui.version);
}"
```

The 300-second timeout accounts for cold-start scenarios on SAP S/4HANA Cloud
and BTP systems.

## Single Control Discovery by ID

Look up a single control using its stable DOM ID via `bridge.getById()`. This calls
`sap.ui.core.ElementRegistry.get()` live — it reflects the current DOM state, not
a cached snapshot.

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const ctrl = b.getById(id);
    if (!ctrl) return { error: 'Control not found', id };
    return {
      id: ctrl.getId(),
      type: ctrl.getMetadata().getName(),
      visible: ctrl.getVisible?.() ?? null,
      text: ctrl.getText?.() ?? null,
      value: ctrl.getValue?.() ?? null
    };
  }, 'myControlId');
}"
```

**When to use**: You know the exact control ID from the DOM, from a previous
inventory scan, or from the UI5 view XML source.

Expected output:

```json
{
  "id": "myControlId",
  "type": "sap.m.Button",
  "visible": true,
  "text": "Save",
  "value": null
}
```

## Bulk Control Enumeration

### Full page inventory

Discover all UI5 controls currently rendered on the page by scanning `[data-sap-ui]`
attributes:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const controls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl) {
        controls.push({
          id: ctrl.getId(),
          type: ctrl.getMetadata().getName(),
          visible: ctrl.getVisible?.() ?? null,
          text: ctrl.getText?.() ?? null,
          value: ctrl.getValue?.() ?? null
        });
      }
    });
    return { count: controls.length, controls: controls.slice(0, 50) };
  });
}"
```

Results are capped at 50 to keep output manageable. Adjust `.slice(0, 50)` as needed.
Hidden controls are included — check the `visible` field to filter.

### Filter by control type

Narrow the inventory to controls matching a specific UI5 type:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((typeName) => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const controls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl && ctrl.getMetadata().getName().includes(typeName)) {
        controls.push({
          id: ctrl.getId(),
          type: ctrl.getMetadata().getName(),
          visible: ctrl.getVisible?.() ?? null,
          text: ctrl.getText?.() ?? null
        });
      }
    });
    return { count: controls.length, controls: controls.slice(0, 30) };
  }, 'Button');
}"
```

Common type filters:

| Filter String  | Matches                                                             |
| -------------- | ------------------------------------------------------------------- |
| `'Button'`     | `sap.m.Button`, `sap.m.ToggleButton`, `sap.m.MenuButton`            |
| `'Input'`      | `sap.m.Input`, `sap.m.MaskInput`                                    |
| `'Table'`      | `sap.m.Table`, `sap.ui.table.Table`, `sap.ui.table.AnalyticalTable` |
| `'Select'`     | `sap.m.Select`, `sap.m.MultiComboBox`                               |
| `'SmartField'` | `sap.ui.comp.smartfield.SmartField`                                 |
| `'DatePicker'` | `sap.m.DatePicker`, `sap.m.DateRangePicker`                         |

For exact matches, replace `.includes(typeName)` with
`ctrl.getMetadata().getName() === 'sap.m.Button'`.

### Filter by ID prefix

SAP-generated IDs often share a common prefix per view. Use this to scope discovery
to a specific view or section:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((prefix) => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const controls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const id = el.getAttribute('data-sap-ui');
      if (id && id.startsWith(prefix)) {
        const ctrl = b.getById(id);
        if (ctrl) {
          controls.push({
            id: ctrl.getId(),
            type: ctrl.getMetadata().getName(),
            visible: ctrl.getVisible?.() ?? null,
            text: ctrl.getText?.() ?? null
          });
        }
      }
    });
    return { count: controls.length, controls: controls.slice(0, 30) };
  }, 'app--PODetail--');
}"
```

## Control Property Inspection

After discovering a control, inspect its runtime properties. UI5 controls expose
getter methods like `getValue()`, `getText()`, `getVisible()`, and `getEnabled()`.

### Common property getters

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const ctrl = b.getById(id);
    if (!ctrl) return { error: 'Control not found', id };
    return {
      id: ctrl.getId(),
      type: ctrl.getMetadata().getName(),
      text: ctrl.getText?.() ?? null,
      value: ctrl.getValue?.() ?? null,
      visible: ctrl.getVisible?.() ?? null,
      enabled: ctrl.getEnabled?.() ?? null,
      editable: ctrl.getEditable?.() ?? null,
      selected: ctrl.getSelected?.() ?? null,
      selectedKey: ctrl.getSelectedKey?.() ?? null,
      title: ctrl.getTitle?.() ?? null,
      placeholder: ctrl.getPlaceholder?.() ?? null
    };
  }, 'myInputField');
}"
```

### Filter visible controls by property value

Find all visible controls that match specific property criteria:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const controls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (!ctrl) return;
      const text = ctrl.getText?.() ?? '';
      const value = ctrl.getValue?.() ?? '';
      const visible = ctrl.getVisible?.();
      if (visible && (text.includes('Save') || value.includes('MAT-'))) {
        controls.push({
          id: ctrl.getId(),
          type: ctrl.getMetadata().getName(),
          text, value
        });
      }
    });
    return controls;
  });
}"
```

**Tips**:

- Use `.includes()` for partial matches (e.g., localized text fragments).
- Combine type + property filters for precision: check `getName().includes('Button')`
  AND `getText() === 'Save'`.
- Filter by `getEnabled?.()` to find only actionable controls.

## Dialog Control Discovery

Dialogs and popovers render in the `#sap-ui-static` container, which sits **outside**
the main app view tree. Standard `[data-sap-ui]` scans on `document` will find them,
but if you need to specifically target dialog controls, scan `#sap-ui-static` directly.

### Discover all dialog controls

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    const staticArea = document.getElementById('sap-ui-static');
    if (!staticArea) return { error: 'No static area found' };
    const controls = [];
    staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl?.getVisible?.()) controls.push({
        id: ctrl.getId(),
        type: ctrl.getMetadata().getName(),
        text: ctrl.getText?.() ?? ctrl.getTitle?.(),
        inDialog: true
      });
    });
    return controls.slice(0, 30);
  });
}"
```

### Key facts about `#sap-ui-static`

- This is the SAP standard container for popups, dialogs, message boxes, and popovers.
- Controls found here include dialog buttons (OK, Cancel, Close), dialog titles, and
  form fields rendered inside dialogs.
- Always check this area when a button press does not produce visible results in the
  main view — a dialog may have opened.
- Use `ctrl.getTitle?.()` for `sap.m.Dialog` instances (they use `getTitle()`,
  not `getText()`).

### Using `searchOpenDialogs: true`

When using Praman's fixture API (not raw CLI), the `searchOpenDialogs` option
automatically scans `#sap-ui-static`:

```typescript
// In Praman fixture tests — automatically scans dialog area
const okButton = await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'OK' },
  searchOpenDialogs: true,
});
```

In raw CLI discovery, you replicate this by explicitly targeting `#sap-ui-static`
as shown above.

## V2 vs V4 Control Differences

SAP Fiori apps built on OData V2 and OData V4 use different control libraries and
patterns. Understanding these differences helps you target the correct controls.

### Control library differences

| Aspect     | OData V2 (Smart Controls)                     | OData V4 (MDC / Fiori Elements V4) |
| ---------- | --------------------------------------------- | ---------------------------------- |
| Table      | `sap.ui.comp.smarttable.SmartTable`           | `sap.ui.mdc.Table`                 |
| Filter Bar | `sap.ui.comp.smartfilterbar.SmartFilterBar`   | `sap.ui.mdc.FilterBar`             |
| Field      | `sap.ui.comp.smartfield.SmartField`           | `sap.ui.mdc.Field`                 |
| Form       | `sap.ui.comp.smartform.SmartForm`             | `sap.ui.mdc.Form` or `sap.uxap.*`  |
| Value Help | `sap.ui.comp.valuehelpdialog.ValueHelpDialog` | `sap.ui.mdc.ValueHelp`             |
| ID pattern | Often `SmartTable-` prefixed                  | Often `fe::table::` prefixed       |

### Detecting the OData model version

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    if (typeof sap === 'undefined') return { error: 'UI5 not loaded' };
    const core = sap.ui.getCore();
    const component = core.getComponent(
      Object.keys(core.mComponents || {})[0]
    );
    if (!component) return { error: 'No component found' };
    const manifest = component.getManifest?.();
    const dataSources = manifest?.['sap.app']?.dataSources ?? {};
    const models = manifest?.['sap.ui5']?.models ?? {};
    const result = {};
    for (const [name, config] of Object.entries(models)) {
      const ds = dataSources[config.dataSource];
      if (ds) {
        result[name] = {
          type: ds.type,
          uri: ds.uri,
          odataVersion: ds.settings?.odataVersion ?? 'V2 (default)'
        };
      }
    }
    return result;
  });
}"
```

Expected output:

```json
{
  "": {
    "type": "OData",
    "uri": "/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/",
    "odataVersion": "V2 (default)"
  }
}
```

### Discovery strategy by OData version

**V2 apps**: Look for `SmartTable`, `SmartFilterBar`, `SmartField` controls. Filter
by type string `'Smart'`:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const controls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl && ctrl.getMetadata().getName().includes('Smart')) {
        controls.push({
          id: ctrl.getId(),
          type: ctrl.getMetadata().getName()
        });
      }
    });
    return controls.slice(0, 20);
  });
}"
```

**V4 apps**: Look for `sap.ui.mdc.*` and `sap.fe.*` controls. Filter by `'mdc'`
or `'fe'`:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const controls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (!ctrl) return;
      const name = ctrl.getMetadata().getName();
      if (name.includes('mdc') || name.includes('.fe.')) {
        controls.push({ id: ctrl.getId(), type: name });
      }
    });
    return controls.slice(0, 20);
  });
}"
```

## OData Model Detection

Beyond the manifest-based approach above, you can detect OData models at runtime
by inspecting the component's model bindings:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    if (typeof sap === 'undefined') return { error: 'UI5 not loaded' };
    const models = {};
    const core = sap.ui.getCore();
    const allModels = core.oModels || {};
    for (const [name, model] of Object.entries(allModels)) {
      models[name] = {
        className: model.getMetadata().getName(),
        serviceUrl: model.sServiceUrl ?? model.getServiceUrl?.() ?? null,
        isV4: model.getMetadata().getName().includes('v4')
      };
    }
    return models;
  });
}"
```

This shows all registered OData models, their service URLs, and whether they are
V2 or V4 instances.

## Dynamic Control Polling

Controls that render asynchronously — after OData responses, lazy-loaded fragments,
or navigation transitions — require polling. This is the standard pattern:

```bash
playwright-cli run-code "async page => {
  const start = Date.now();
  while (Date.now() - start < 10000) {
    const found = await page.evaluate((id) => {
      const b = window.__praman_bridge;
      if (!b?.ready) return null;
      const ctrl = b.getById(id);
      if (!ctrl) return null;
      return {
        id: ctrl.getId(),
        type: ctrl.getMetadata().getName(),
        visible: ctrl.getVisible?.()
      };
    }, 'confirmButton');
    if (found?.visible) return found;
    await new Promise(r => setTimeout(r, 250));
  }
  return { error: 'Control not found within 10s timeout' };
}"
```

### When to use polling

- After navigation to a new view
- After triggering an OData create/update that opens a detail page
- After pressing a button that opens a dialog or popover
- After applying a filter that reloads table data

### Parameters to adjust

| Parameter        | Default           | Guidance                                            |
| ---------------- | ----------------- | --------------------------------------------------- |
| Total timeout    | `10000`ms         | Increase for slow OData calls (e.g., `30000`)       |
| Polling interval | `250`ms           | Do not go below `100`ms to avoid excessive CPU load |
| Target ID        | `'confirmButton'` | Replace with your target control ID                 |

### Polling for a control by type + text

When you do not know the exact ID, poll by type and text instead:

```bash
playwright-cli run-code "async page => {
  const start = Date.now();
  while (Date.now() - start < 15000) {
    const found = await page.evaluate((targetText) => {
      const b = window.__praman_bridge;
      if (!b?.ready) return null;
      let match = null;
      document.querySelectorAll('[data-sap-ui]').forEach(el => {
        const ctrl = b.getById(el.getAttribute('data-sap-ui'));
        if (!ctrl) return;
        if (
          ctrl.getMetadata().getName().includes('Button') &&
          ctrl.getText?.() === targetText &&
          ctrl.getVisible?.()
        ) {
          match = {
            id: ctrl.getId(),
            type: ctrl.getMetadata().getName(),
            text: ctrl.getText()
          };
        }
      });
      return match;
    }, 'Confirm');
    if (found) return found;
    await new Promise(r => setTimeout(r, 250));
  }
  return { error: 'Button with text \"Confirm\" not found within 15s' };
}"
```

## Complete Working Examples

### Example 1: Discover all buttons on a Purchase Order page

```bash
playwright-cli run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 60000 }
  );
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    const buttons = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl && ctrl.getMetadata().getName().includes('Button') && ctrl.getVisible?.()) {
        buttons.push({
          id: ctrl.getId(),
          type: ctrl.getMetadata().getName(),
          text: ctrl.getText?.() ?? '(no text)',
          enabled: ctrl.getEnabled?.() ?? null
        });
      }
    });
    return { count: buttons.length, buttons };
  });
}"
```

Expected output:

```json
{
  "count": 8,
  "buttons": [
    { "id": "app--PODetail--editBtn", "type": "sap.m.Button", "text": "Edit", "enabled": true },
    { "id": "app--PODetail--deleteBtn", "type": "sap.m.Button", "text": "Delete", "enabled": true },
    { "id": "app--PODetail--copyBtn", "type": "sap.m.Button", "text": "Copy", "enabled": false },
    { "id": "app--PODetail--postBtn", "type": "sap.m.Button", "text": "Post", "enabled": true }
  ]
}
```

### Example 2: Inspect a SmartTable and its column count

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const controls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (!ctrl) return;
      const name = ctrl.getMetadata().getName();
      if (name.includes('Table')) {
        controls.push({
          id: ctrl.getId(),
          type: name,
          visible: ctrl.getVisible?.() ?? null,
          rowCount: ctrl.getItems?.()?.length ?? ctrl.getRows?.()?.length ?? null
        });
      }
    });
    return controls;
  });
}"
```

### Example 3: Full discovery pipeline (readiness + inventory + snapshot)

Run these three commands in sequence for a complete picture of a page:

**Step 1** — Verify bridge:

```bash
playwright-cli run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 60000 }
  );
  return 'Bridge ready';
}"
```

**Step 2** — Inventory all visible controls:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    const summary = {};
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl?.getVisible?.()) {
        const type = ctrl.getMetadata().getName();
        summary[type] = (summary[type] || 0) + 1;
      }
    });
    return { totalTypes: Object.keys(summary).length, summary };
  });
}"
```

**Step 3** — Save a page snapshot for agent consumption:

```bash
playwright-cli snapshot --filename=snap.yml
```

The snapshot file (~200 tokens) provides a structural reference that agents can
consume without reading the full DOM.

## Pre-Built Discovery Scripts

Praman ships 4 parameter-free scripts in `node_modules/playwright-praman/dist/scripts/` for the most common operations. These avoid composing inline `run-code` for standard tasks:

| Script               | Purpose                                          | Returns                                                    |
| -------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| `discover-all.js`    | All controls with IDs, types, methods (max 100)  | `{ total, showing, controls: [...] }`                      |
| `wait-for-ui5.js`    | Poll for UI5 stability (30s timeout, 500ms poll) | `{ stable: boolean, elapsed: number }`                     |
| `bridge-status.js`   | Bridge readiness diagnostics                     | `{ ready, ui5Version, bridgeVersion, controlCount, ... }`  |
| `dialog-controls.js` | Controls inside open dialogs, grouped by dialog  | `{ dialogs: [...], totalControls: number }`                |

### Usage

```bash
# Discover all controls (includes methods via bridge.utils.retrieveControlMethods)
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/discover-all.js)"

# Wait for UI5 stability before running other discovery
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/wait-for-ui5.js)"

# Check bridge status
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/bridge-status.js)"

# Find controls in open dialogs
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/dialog-controls.js)"
```

These scripts use the `async page => { ... }` contract required by `run-code`. They are shell-safe (no `"`, backtick, or `$` in the script content) and return only JSON-serializable values.

For parameterized operations (inspecting a specific control, filtering by type), use the inline `run-code` patterns shown above — pre-built scripts cannot accept parameters because `run-code` only exposes `page` in scope.

## Troubleshooting

| Symptom                              | Cause                               | Solution                                                               |
| ------------------------------------ | ----------------------------------- | ---------------------------------------------------------------------- |
| `{ error: 'Bridge not ready' }`      | UI5 still loading                   | Use `waitForFunction` with a longer timeout                            |
| `{ error: 'Control not found', id }` | ID does not exist                   | Run a page inventory to find the correct ID                            |
| Empty results from inventory         | Page is not a UI5 app               | Check `typeof sap !== 'undefined'` first                               |
| Dialog controls not found            | Not scanning `#sap-ui-static`       | Use the dialog discovery pattern                                       |
| Controls appear but `visible: false` | Controls are rendered but hidden    | Filter by `ctrl.getVisible?.()` in your query                          |
| Polling times out                    | Control renders later than expected | Increase the timeout or check if a different event triggers the render |

## Related Guides

- [CLI Iframe Guide](./playwright-cli-iframes.md) — handling iframes in SAP apps
- [Discovery and Interaction Strategies](./discovery-and-interaction.md) — Praman fixture-based discovery
- [Selectors](./selectors.md) — UI5 selector syntax reference
- [Agent & IDE Setup](./agent-setup.md) — initial project setup
