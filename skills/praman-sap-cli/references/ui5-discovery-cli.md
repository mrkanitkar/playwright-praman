# Control Discovery Patterns (CLI)

## Table of Contents

1. [Critical Warnings](#critical-warnings)
2. [Single Control by ID](#single-control-by-id)
3. [Page Inventory](#page-inventory)
4. [Filter by Control Type](#filter-by-control-type)
5. [Filter by Properties](#filter-by-properties)
6. [Dynamic Control Polling](#dynamic-control-polling)
7. [Dialog and Popover Discovery](#dialog-and-popover-discovery)
8. [iframe Frame Listing](#iframe-frame-listing)
9. [Discover Controls in Specific iframe](#discover-controls-in-specific-iframe)

---

## Critical Warnings

> **`console.log()` is invisible** -- inside `run-code`, `console.log()` output is silently swallowed. Always use `return` to produce output.

> **`snapshot` must use `--filename` flag** -- for agent workflows, always pass `--filename=snap.yml` to get a file reference (~200 tokens) instead of inlining the full YAML.

---

## Single Control by ID

Look up a single control by its stable DOM ID using `bridge.getById()`. This queries `sap.ui.core.ElementRegistry.get()` live at call time (not a snapshot).

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

**When to use**: You know the exact control ID from the DOM or from a previous inventory scan.

---

## Page Inventory

Discover all UI5 controls currently rendered on the page by scanning `[data-sap-ui]` attributes.

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

**Notes**:

- Results are capped at 50 to avoid massive output. Adjust `.slice(0, 50)` as needed.
- Hidden controls are included -- check `visible` to filter.
- This returns a live snapshot of the current DOM, not cached data.

---

## Filter by Control Type

Narrow the page inventory to controls matching a specific UI5 type (e.g., `Button`, `Input`, `Table`).

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

**Common type filters**:

| Filter String  | Matches                                                             |
| -------------- | ------------------------------------------------------------------- |
| `'Button'`     | `sap.m.Button`, `sap.m.ToggleButton`, `sap.m.MenuButton`            |
| `'Input'`      | `sap.m.Input`, `sap.m.MaskInput`                                    |
| `'Table'`      | `sap.m.Table`, `sap.ui.table.Table`, `sap.ui.table.AnalyticalTable` |
| `'Select'`     | `sap.m.Select`, `sap.m.MultiComboBox`                               |
| `'SmartField'` | `sap.ui.comp.smartfield.SmartField`                                 |
| `'DatePicker'` | `sap.m.DatePicker`, `sap.m.DateRangePicker`                         |

Use an exact match (`ctrl.getMetadata().getName() === 'sap.m.Button'`) when you need precision.

---

## Filter by Properties

Narrow discovery by runtime property values such as `getText()`, `getValue()`, or `getVisible()`.

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
- Combine type + property filters for precision: check `getName().includes('Button')` AND `getText() === 'Save'`.
- Filter by `getEnabled?.()` to find only actionable controls.

---

## Dynamic Control Polling

Wait for a control to appear and become visible. This is the critical pattern for controls that render asynchronously (after OData responses, lazy-loaded fragments, or navigation transitions).

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

**When to use**:

- After navigation to a new view
- After triggering an OData create/update that opens a detail page
- After pressing a button that opens a dialog or popover
- After applying a filter that reloads table data

**Parameters to adjust**:

- `10000` -- total timeout in milliseconds (increase for slow OData calls)
- `250` -- polling interval in milliseconds (do not go below 100ms)
- `'confirmButton'` -- replace with your target control ID

---

## Dialog and Popover Discovery

Dialogs and popovers render in the `#sap-ui-static` container, which is outside the main app view tree. You must scan this area specifically to find dialog controls.

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

**Key facts**:

- `#sap-ui-static` is the SAP standard container for popups, dialogs, message boxes, and popovers.
- Controls found here include dialog buttons (OK, Cancel, Close), dialog titles, and form fields rendered inside dialogs.
- Always check this area when a button press does not produce visible results in the main view -- a dialog may have opened.
- Use `ctrl.getTitle?.()` for `sap.m.Dialog` instances (they have `getTitle()`, not `getText()`).

---

## iframe Frame Listing

SAP Fiori Launchpad (FLP) and SAP Build WorkZone run apps inside iframes. This pattern lists all frames and checks which ones have the bridge injected and UI5 loaded.

```bash
playwright-cli run-code "async page => {
  const frames = page.frames();
  const results = [];
  for (const frame of frames) {
    try {
      const info = await frame.evaluate(() => ({
        url: window.location.href,
        hasBridge: !!(window.__praman_bridge),
        bridgeReady: !!(window.__praman_bridge?.ready),
        hasUI5: typeof sap !== 'undefined'
      }));
      results.push({ name: frame.name(), ...info });
    } catch (e) {
      results.push({ name: frame.name(), error: 'cross-origin or detached' });
    }
  }
  return results;
}"
```

**Interpreting results**:

| Field                                 | Meaning                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `hasBridge: true, bridgeReady: true`  | Bridge is injected and ready -- this frame can be queried             |
| `hasBridge: true, bridgeReady: false` | Bridge is injected but not yet initialized                            |
| `hasUI5: true, hasBridge: false`      | UI5 app frame but bridge was not injected (check `initScript` config) |
| `error: 'cross-origin or detached'`   | Frame is cross-origin or has been removed from the DOM                |

**Common frame patterns**:

| Frame URL Pattern  | Description                      |
| ------------------ | -------------------------------- |
| `/sap/bc/ui5_ui5/` | ABAP-hosted Fiori app            |
| `/sap/bc/ui2/flp`  | Fiori Launchpad shell            |
| `/cp.portal/`      | SAP Build WorkZone shell         |
| `about:blank`      | Empty placeholder frame (ignore) |

---

## Discover Controls in Specific iframe

Once you know which frame contains your SAP app (from the frame listing above), target it directly for control discovery.

```bash
playwright-cli run-code "async page => {
  const appFrame = page.frames().find(f => f.url().includes('/sap/'));
  if (!appFrame) return { error: 'SAP app frame not found' };
  return await appFrame.evaluate(() => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { bridgeReady: false };
    const controls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl?.getVisible?.()) controls.push({
        id: ctrl.getId(),
        type: ctrl.getMetadata().getName(),
        text: ctrl.getText?.()
      });
    });
    return { bridgeReady: true, count: controls.length, controls: controls.slice(0, 30) };
  });
}"
```

**Tips**:

- Replace `'/sap/'` with a more specific URL fragment if multiple SAP frames exist (e.g., `'/sap/bc/ui5_ui5/sap/mm_pur_po_maint/'`).
- Use `frame.name()` instead of URL matching if the frame has a known name attribute.
- All interaction patterns in this reference (set value, press button, etc.) work identically on a frame -- just replace `page.evaluate(...)` with `appFrame.evaluate(...)`.
- The bridge must be injected into the frame via `initScript` (CDP `addScriptToEvaluateOnNewDocument` auto-injects into all same-origin frames).
