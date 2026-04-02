# run-code Patterns Reference

Complete `run-code` patterns for SAP UI5 testing via Playwright CLI.

---

## 1. Bridge Operations

### Check Bridge Readiness

```bash
playwright-cli -s=sap eval "() => window.__praman_bridge ? window.__praman_bridge.ready : false"
```

### Get Bridge Version

```bash
playwright-cli -s=sap eval "() => window.__praman_bridge ? window.__praman_bridge.version : 'not loaded'"
```

### Full Bridge Status (Pre-Built Script)

```bash
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/bridge-status.js)"
```

Returns: `{ ready, ui5Version, bridgeVersion, objectMapSize, hasRecordReplay, controlCount, timestamp }`

---

## 2. Control Discovery

### Discover All Controls (Pre-Built Script)

```bash
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/discover-all.js)"
```

Returns up to 100 controls with IDs, types, properties, and method names.

### Discover by Type

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate((typeName) => {
    return sap.ui.core.Element.registry.filter(
      e => e.getMetadata().getName() === typeName
    ).map(c => ({ id: c.getId(), type: c.getMetadata().getName() }));
  }, 'sap.m.Input');
}"
```

### Discover Dialog Controls (Pre-Built Script)

```bash
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/dialog-controls.js)"
```

Returns controls grouped by dialog element.

### Discover with Methods

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(() => {
    var bridge = window.__praman_bridge;
    if (!bridge || !bridge.ready) return { error: 'Bridge not ready' };
    return Object.values(sap.ui.core.ElementRegistry.all()).slice(0, 50).map(function(c) {
      var id = c.getId();
      return {
        id: id,
        type: c.getMetadata().getName(),
        methods: bridge.utils.retrieveControlMethods(id)
      };
    });
  });
}"
```

---

## 3. Control Introspection

### Single Control Metadata

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(function(id) {
    var b = window.__praman_bridge;
    var c = b.getById(id);
    if (!c) return { error: 'Not found: ' + id };
    var m = c.getMetadata();
    return {
      id: c.getId(),
      type: m.getName(),
      methods: b.utils.retrieveControlMethods(id),
      properties: {
        text: c.getText ? c.getText() : undefined,
        value: c.getValue ? c.getValue() : undefined,
        enabled: c.getEnabled ? c.getEnabled() : undefined,
        visible: c.getVisible ? c.getVisible() : undefined
      }
    };
  }, 'CONTROL_ID');
}"
```

### Control Bindings

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(function(id) {
    var c = sap.ui.getCore().byId(id);
    if (!c) return { error: 'Not found' };
    var infos = c.mBindingInfos || {};
    return Object.keys(infos).map(function(prop) {
      var info = infos[prop];
      return {
        property: prop,
        path: info.binding ? info.binding.getPath() : info.parts ? info.parts[0].path : 'unknown'
      };
    });
  }, 'CONTROL_ID');
}"
```

---

## 4. Control Interaction

### Press Button

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(function(id) {
    var btn = sap.ui.getCore().byId(id);
    if (!btn) return { error: 'Button not found' };
    btn.firePress();
    return 'pressed';
  }, 'BUTTON_ID');
}"
```

### setValue + fireChange (Mandatory Three-Step Pattern)

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(function(args) {
    var c = sap.ui.getCore().byId(args[0]);
    if (!c) return { error: 'Control not found' };
    c.setValue(args[1]);
    c.fireChange({ value: args[1] });
    return 'done';
  }, ['CONTROL_ID', 'NEW_VALUE']);
}"
```

### Select ComboBox Item

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(function(args) {
    var combo = sap.ui.getCore().byId(args[0]);
    var items = combo.getItems();
    var target = items.find(function(i) { return i.getText() === args[1]; });
    if (!target) return { error: 'Item not found: ' + args[1] };
    combo.setSelectedItem(target);
    combo.fireSelectionChange({ selectedItem: target });
    return 'selected: ' + target.getText();
  }, ['COMBO_ID', 'ITEM_TEXT']);
}"
```

### Toggle Checkbox

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(function(id) {
    var cb = sap.ui.getCore().byId(id);
    var current = cb.getSelected();
    cb.setSelected(!current);
    cb.fireSelect({ selected: !current });
    return 'toggled to ' + String(!current);
  }, 'CHECKBOX_ID');
}"
```

---

## 5. Navigation

### FLP Tile Navigation via Hasher

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(function(hash) {
    window.location.hash = hash;
    return 'navigated to ' + hash;
  }, '#PurchaseOrder-manage');
}"
```

### Cross-App Navigation

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(function(target) {
    sap.ushell.Container.getServiceAsync('CrossApplicationNavigation').then(function(nav) {
      nav.toExternal({ target: { semanticObject: target[0], action: target[1] } });
    });
    return 'navigating';
  }, ['PurchaseOrder', 'manage']);
}"
```

---

## 6. UI5 Stability

### Wait for UI5 (Pre-Built Script)

```bash
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/wait-for-ui5.js)"
```

Returns: `{ stable: boolean, elapsed: number, pendingRequests: number }`

### Quick UI5 Stable Check

```bash
playwright-cli -s=sap eval "() => {
  var bi = sap.ui.core.BusyIndicator;
  return { busy: bi ? bi.isActive() : false };
}"
```

---

## 7. Error Handling

### Detect Error Dialog

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(function() {
    var dialogs = sap.ui.core.Element.registry.filter(function(e) {
      return e.getMetadata().getName() === 'sap.m.Dialog' && e.isOpen();
    });
    return dialogs.map(function(d) {
      return { id: d.getId(), title: d.getTitle(), type: d.getType() };
    });
  });
}"
```

---

## 8. Pre-Built Scripts Reference

| Script | File | Purpose |
|--------|------|---------|
| Discover All | `dist/scripts/discover-all.js` | All controls with methods (max 100) |
| Wait for UI5 | `dist/scripts/wait-for-ui5.js` | Poll for UI5 stability |
| Bridge Status | `dist/scripts/bridge-status.js` | Quick diagnostics |
| Dialog Controls | `dist/scripts/dialog-controls.js` | Controls inside open dialogs |

Usage pattern:

```bash
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/SCRIPT_NAME.js)"
```

---

## 9. Return Value Constraints

`run-code` returns ONLY the value from the last `return` statement.

**Allowed return types:**
- Strings, numbers, booleans, null
- Plain objects (no class instances)
- Arrays of the above

**NOT allowed (will fail silently or throw):**
- Functions
- DOM nodes / elements
- Symbols
- Circular references
- Undefined (returns nothing)

---

## 10. Shell Escaping Notes

### Linux / macOS

```bash
# Use $() for pre-built scripts
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/discover-all.js)"

# Use single quotes for inline scripts with double quotes inside
playwright-cli -s=sap run-code 'async page => { return "hello"; }'
```

### Windows PowerShell

```powershell
# Read file content and pass to run-code
$script = Get-Content node_modules/playwright-praman/dist/scripts/discover-all.js -Raw
playwright-cli -s=sap run-code $script

# Inline scripts — use backtick for escaping
playwright-cli -s=sap run-code "async page => { return 'hello'; }"
```

### Windows CMD

```cmd
:: Read file into variable
set /p SCRIPT=<node_modules\playwright-praman\dist\scripts\discover-all.js
playwright-cli -s=sap run-code "%SCRIPT%"
```
