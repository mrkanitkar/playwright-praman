# SAP UI5 Test Automation via Playwright CLI

**Package**: `playwright-praman` v1.1.2
**CLI Requirement**: `@playwright/cli` v0.1.3+ and `playwright` v1.59+
**Purpose**: Discover SAP UI5 controls, debug Praman tests, and automate SAP Fiori workflows using the Playwright CLI. Agents use CLI commands for live discovery, then produce Praman fixture code as output.

---

## Setup: Create Config File

Create `.playwright/praman-cli.config.json` in your project root:

```bash
mkdir -p .playwright
cat > .playwright/praman-cli.config.json << 'PRAMAN_EOF'
{
  "browser": {
    "browserName": "chromium",
    "initScript": ["./node_modules/playwright-praman/dist/browser/praman-bridge-init.js"]
  },
  "timeouts": {
    "navigation": 120000
  }
}
PRAMAN_EOF
```

> **Without `--config`:** Browser opens fine, page loads fine, but `window.__praman_bridge` is `undefined`. All discovery scripts will fail.

---

## eval vs run-code

| Use         | Command    | Syntax                                                      |
| ----------- | ---------- | ----------------------------------------------------------- |
| Quick check | `eval`     | `playwright-cli eval "() => window.__praman_bridge?.ready"` |
| Multi-step  | `run-code` | `playwright-cli run-code "async page => { ... }"`           |

**CRITICAL:** `eval` requires a function wrapper `() => expr`. Bare expressions will fail.

```bash
# ✅ CORRECT
playwright-cli eval "() => window.__praman_bridge?.ready"

# ❌ WRONG — fails silently
playwright-cli eval "window.__praman_bridge?.ready"
```

**`run-code` rules:**

- Only `page` is in scope — no `process.env`, no `require()`
- `console.log()` is invisible — always use `return` to get data
- Return ONLY serializable values: strings, numbers, booleans, null, plain objects, arrays
- Do NOT return: functions, DOM nodes, Symbols, circular references

---

## Discover Controls with Methods

### Pre-built Script (recommended)

```bash
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/discover-all.js)"
```

Returns up to 100 controls with IDs, types, properties, and method names.

### Inline Alternative

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    if (!bridge || !bridge.ready) return { error: 'Bridge not ready' };
    return Object.values(sap.ui.core.ElementRegistry.all()).slice(0, 100).map(c => ({
      id: c.getId(),
      type: c.getMetadata().getName(),
      methods: bridge.utils.retrieveControlMethods(c.getId())
    }));
  });
}"
```

---

## Inspect Single Control

Replace `CONTROL_ID` with target ID:

```bash
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate((id) => {
    const b = window.__praman_bridge;
    const c = b.getById(id);
    if (!c) return { error: 'Not found: ' + id };
    const m = c.getMetadata();
    return {
      id: c.getId(),
      type: m.getName(),
      methods: b.utils.retrieveControlMethods(id),
      properties: { text: c.getText?.(), value: c.getValue?.(), enabled: c.getEnabled?.() },
      bindings: Object.keys(c.getBindingInfo ? c.mBindingInfos || {} : {})
    };
  }, 'CONTROL_ID');
}"
```

---

## Pre-Built Scripts

Shipped in `node_modules/playwright-praman/dist/scripts/`:

| Script               | Purpose                             | Parameterized |
| -------------------- | ----------------------------------- | :-----------: |
| `discover-all.js`    | All controls with methods (max 100) |      No       |
| `wait-for-ui5.js`    | Poll for UI5 stability              |      No       |
| `bridge-status.js`   | Bridge readiness diagnostics        |      No       |
| `dialog-controls.js` | Controls inside open dialogs        |      No       |

Usage: `playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/SCRIPT.js)"`

> If script not found, use inline `run-code` patterns above as fallback.

---

## Quick Start

```bash
# 1. Open SAP app in browser (--config is MANDATORY for bridge injection)
playwright-cli open https://my-sap-system.example.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html --config=.playwright/praman-cli.config.json

# 2. Authenticate (fill credentials, click login)
playwright-cli fill e3 "SAP_USERNAME"
playwright-cli fill e5 "SAP_PASSWORD"
playwright-cli click e7

# 3. Save auth state for reuse
playwright-cli state-save sap-auth.json

# 4. Wait for bridge readiness
playwright-cli run-code "async page => {
  const maxWait = 30000;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const ready = await page.evaluate(() => window.__praman_bridge?.ready);
    if (ready) return { bridgeReady: true, elapsed: Date.now() - start };
    await page.waitForTimeout(500);
  }
  return { bridgeReady: false, elapsed: maxWait };
}"

# 5. Discover controls on current page
playwright-cli run-code "async page => {
  const controls = await page.evaluate(() => {
    const registry = sap.ui.core.ElementRegistry.all();
    return Object.keys(registry).slice(0, 20).map(id => ({
      id,
      type: registry[id].getMetadata().getName()
    }));
  });
  return controls;
}"

# 6. Close browser when done
playwright-cli close
```

---

## Prerequisites

1. **Node.js** v18+ installed
2. **Playwright CLI** installed globally or locally:
   ```bash
   npm install -g @playwright/cli@latest
   # or use npx
   npx playwright-cli --version
   ```
3. **playwright-praman** installed in the project:
   ```bash
   npm install playwright-praman
   ```
4. **Config file** (optional): `playwright-cli open --config=.playwright/praman-cli.config.json`
   - Format: `{ "browser": { "initScript": ["./praman-bridge.js"] } }`
   - `initScript` uses CDP `addScriptToEvaluateOnNewDocument` and auto-injects into all same-origin frames
5. **Sessions**: Use `playwright-cli -s=sap open` for persistent browser sessions across CLI invocations

---

## Bridge Readiness Check

The Praman bridge injects as `window.__praman_bridge`. Always verify readiness before discovery.

```bash
playwright-cli run-code "async page => {
  const maxWait = 30000;
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    const ready = await page.evaluate(() => window.__praman_bridge?.ready);
    if (ready) return { bridgeReady: true, elapsed: Date.now() - start };
    await page.waitForTimeout(500);
  }
  return { bridgeReady: false, elapsed: maxWait };
}"
```

Expected output:

```
### Result
{"bridgeReady":true,"elapsed":1523}
```

If `bridgeReady` is `false`, verify that the `initScript` is configured and the page has fully loaded.

---

## Core Patterns

### Control Discovery via `run-code`

Use `bridge.getById()` which queries `sap.ui.core.ElementRegistry.get()` LIVE (not a snapshot):

```bash
playwright-cli run-code "async page => {
  const control = await page.evaluate(() => {
    const ctrl = sap.ui.core.ElementRegistry.get('materialInput');
    if (!ctrl) return null;
    return {
      id: ctrl.getId(),
      type: ctrl.getMetadata().getName(),
      value: ctrl.getValue?.() ?? null,
      visible: ctrl.getVisible?.() ?? null
    };
  });
  return control;
}"
```

### Bulk Control Discovery

```bash
playwright-cli run-code "async page => {
  const controls = await page.evaluate(() => {
    const registry = sap.ui.core.ElementRegistry.all();
    return Object.keys(registry).map(id => {
      const ctrl = registry[id];
      const meta = ctrl.getMetadata().getName();
      return { id, type: meta };
    }).filter(c =>
      c.type.startsWith('sap.m.') ||
      c.type.startsWith('sap.ui.comp.') ||
      c.type.startsWith('sap.ui.mdc.')
    );
  });
  return { count: controls.length, controls: controls.slice(0, 50) };
}"
```

### Control Interaction: setValue + fireChange + waitForUI5

For every input interaction, the three-step pattern is mandatory:

```bash
playwright-cli run-code "async page => {
  await page.evaluate(() => {
    const input = sap.ui.core.ElementRegistry.get('materialInput');
    input.setValue('MAT-001');
    input.fireChange({ value: 'MAT-001' });
  });
  // Wait for UI5 stability
  await page.evaluate(() => {
    return new Promise(resolve => {
      sap.ui.getCore().attachEvent('UIUpdated', function handler() {
        sap.ui.getCore().detachEvent('UIUpdated', handler);
        resolve(true);
      });
      setTimeout(() => resolve(false), 5000);
    });
  });
  return { filled: true };
}"
```

### FLP Navigation via Hasher

```bash
playwright-cli run-code "async page => {
  await page.evaluate((hash) => {
    sap.ushell.Container.getServiceAsync('CrossApplicationNavigation').then(nav => {
      const hasher = sap.ushell.Container.getService('ShellNavigation').hashChanger;
      hasher.setHash(hash);
    });
  }, 'PurchaseOrder-manage');
  return { navigated: true };
}"
```

### Authentication: Fill, Click, Save State

```bash
# Fill login form using snapshot refs
playwright-cli snapshot
playwright-cli fill e3 "SAP_USERNAME"
playwright-cli fill e5 "SAP_PASSWORD"
playwright-cli click e7

# Wait for FLP to load, then save
playwright-cli state-save sap-auth.json

# Restore in future sessions
playwright-cli state-load sap-auth.json
```

---

## CRITICAL WARNINGS

> **WARNING: `console.log()` is INVISIBLE in `run-code`**
>
> The `run-code` callback receives `page` as the ONLY variable in scope.
> `console.log()` output is SILENTLY SWALLOWED. You MUST use `return` to
> produce output. Only the `return` value appears in the CLI response.
>
> ```bash
> # WRONG - produces no output
> playwright-cli run-code "async page => { console.log('hello'); }"
>
> # CORRECT - value appears after ### Result
> playwright-cli run-code "async page => { return 'hello'; }"
> ```

> **WARNING: `snapshot` MUST use `--filename` for agents**
>
> Without `--filename`, `snapshot` inlines the full YAML into the response,
> consuming thousands of tokens. Always use `--filename` to get a compact
> file reference (~200 tokens).
>
> ```bash
> # WRONG - inlines full YAML (huge)
> playwright-cli snapshot
>
> # CORRECT - returns file reference
> playwright-cli snapshot --filename=snap.yml
> ```

> **WARNING: `run-code` output format**
>
> - Return value appears after `### Result\n` as single-line JSON
> - VOID (no return) produces NO Result section
> - Errors produce `### Error` section
> - `page` is the ONLY variable in scope -- no `browser`, no `context`

> **WARNING: `initScript` scope**
>
> `initScript` files configured under `browser.initScript` are injected via
> CDP `addScriptToEvaluateOnNewDocument`. They run in ALL same-origin frames
> automatically. You do not need to inject them per-frame.

---

## Agent Output Format

Agents use the CLI for live discovery and debugging. The final output is always
**Praman fixture code**, not CLI commands:

```typescript
/**
 * Purchase Order E2E Gold Standard Test
 *
 * COMPLIANCE: 100% Praman fixture-only
 * Generated by: praman-sap-cli agent
 * Controls discovered: 14
 * Forbidden Pattern Scan: PASSED
 */
import { test, expect } from 'playwright-praman';

test.describe('Purchase Order E2E Tests', () => {
  test('Create PO Flow - Single Session', async ({
    page,
    ui5,
    ui5Navigation,
    ui5Footer,
    intent,
  }) => {
    await test.step('Navigate to PO App', async () => {
      await ui5Navigation.navigateToTile('Create Purchase Order');
      await ui5.waitForUI5();
    });

    await test.step('Fill PO Header', async () => {
      const vendorInput = await ui5.control({ id: 'vendorInput' });
      await vendorInput.setValue('VENDOR-001');
      await vendorInput.fireChange({ value: 'VENDOR-001' });
      await ui5.waitForUI5();
    });

    await test.step('Save and Verify', async () => {
      await ui5Footer.clickSave();
      await ui5.dialog.confirm();
      await intent.core.assertField('Status', 'Created');
    });
  });
});
```

**Mandatory rules for generated code:**

1. `import { test, expect } from 'playwright-praman'` ONLY
2. Praman fixtures for ALL UI5 elements -- NEVER `page.click('#__...')`
3. Playwright native ONLY for verified non-UI5 elements
4. Auth in seed -- NEVER `sapAuth.login()` in test body
5. `setValue()` + `fireChange()` + `waitForUI5()` for every input
6. `searchOpenDialogs: true` for dialog controls
7. TSDoc compliance header in every generated test

---

## Fixture Levels and Dialog Fallback Patterns

### `ui5.dialog` requires Praman import

The `ui5.dialog.*` methods (`confirm`, `dismiss`, `waitFor`, etc.) are provided by the
Praman fixture system. They require importing `test` from `playwright-praman`, NOT from
`@playwright/test`:

```typescript
// CORRECT -- ui5.dialog is available
import { test, expect } from 'playwright-praman';

// WRONG -- ui5.dialog will be undefined
import { test, expect } from '@playwright/test';
```

If `ui5.dialog` is `undefined` at runtime, the test is using the wrong import.

### Fallback: Dialog button via `searchOpenDialogs`

When `ui5.dialog` methods are unavailable or the dialog uses non-standard buttons,
use `ui5.control()` with `searchOpenDialogs: true` and the exact V4 FE button ID:

```typescript
// V4 FE dialog button ID pattern:
// fe::APD_::${SRVD}.${ActionName}::Action::Ok
const okBtn = await ui5.control({
  id: 'fe::APD_::ns.service.CreateAction::Action::Ok',
  searchOpenDialogs: true,
});
await okBtn.press();
await ui5.waitForUI5();
```

The `searchOpenDialogs: true` option scans the static area for controls inside open
dialogs, ensuring the control is found even when it is outside the normal DOM tree.

---

## FLP Navigation Patterns

Different FLP layouts require different navigation methods. Choose the correct one
based on the target element type:

| Method                           | Target Element        | Use When                          |
| -------------------------------- | --------------------- | --------------------------------- |
| `navigateToSpace('Space Name')`  | `sap.m.IconTabFilter` | FLP Space Tab navigation          |
| `navigateToSectionLink('App')`   | Section link (role)   | Section link within a Space       |
| `navigateToTile('Tile Header')`  | `sap.m.GenericTile`   | GenericTile layout (classic FLP)  |
| `navigateToApp('SemObj-action')` | Hash-based intent     | Direct semantic object navigation |

### Space Tab navigation

`sap.m.IconTabFilter` has no `press()` or `firePress()` methods in the UI5 API.
`navigateToSpace()` uses a Playwright native DOM click internally because the
IconTabFilter control does not expose a programmatic activation method:

```typescript
await test.step('Navigate to Space', async () => {
  await ui5Navigation.navigateToSpace('My Workspace');
  await ui5.waitForUI5();
});
```

### Section link navigation

`navigateToSectionLink()` uses Playwright role-based locators to click links within
the current FLP section:

```typescript
await test.step('Open App from Section', async () => {
  await ui5Navigation.navigateToSectionLink('Manage Purchase Orders');
  await ui5.waitForUI5();
});
```

### GenericTile navigation

`navigateToTile()` only works for `sap.m.GenericTile` layouts. It will fail if the
FLP uses Spaces with section links instead of tiles:

```typescript
await test.step('Open App from Tile', async () => {
  await ui5Navigation.navigateToTile('Create Purchase Order');
  await ui5.waitForUI5();
});
```

### Hash-based navigation

`navigateToApp()` bypasses the FLP shell entirely and navigates by semantic object
and action hash:

```typescript
await test.step('Navigate by Intent', async () => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5.waitForUI5();
});
```

---

## Reference Documents

Detailed patterns and advanced usage are in the `references/` directory:

| Reference File                                                    | Topic                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------- |
| [praman-bridge-setup.md](references/praman-bridge-setup.md)       | Bridge injection, initScript config, readiness checks      |
| [sap-auth-cli.md](references/sap-auth-cli.md)                     | SAP authentication patterns, state-save/load, SSO          |
| [ui5-discovery-cli.md](references/ui5-discovery-cli.md)           | Control discovery, ElementRegistry, bulk enumeration       |
| [ui5-interaction-cli.md](references/ui5-interaction-cli.md)       | setValue/fireChange, press, select, checkbox, date pickers |
| [flp-navigation-cli.md](references/flp-navigation-cli.md)         | FLP hasher, tile navigation, cross-app navigation          |
| [table-dialog-date-cli.md](references/table-dialog-date-cli.md)   | Table rows, dialog handling, date/time pickers             |
| [odata-cli.md](references/odata-cli.md)                           | OData V2/V4 model inspection, CSRF tokens, entity CRUD     |
| [praman-test-debug-cli.md](references/praman-test-debug-cli.md)   | Test debugging, tracing, console, network inspection       |
| [control-type-reference.md](references/control-type-reference.md) | Control type to Praman method mapping (V2 and V4)          |

---

## Session Management for SAP

SAP workflows often span multiple steps. Use named sessions to persist browser state:

```bash
# Start a named session with persistent profile
playwright-cli -s=sap open https://sap-system.example.com --persistent --config=.playwright/praman-cli.config.json

# Work across multiple CLI invocations
playwright-cli -s=sap fill e3 "user"
playwright-cli -s=sap click e7
playwright-cli -s=sap state-save sap-auth.json

# Restore session later
playwright-cli -s=sap open --persistent
playwright-cli -s=sap state-load sap-auth.json

# Clean up
playwright-cli -s=sap close
playwright-cli -s=sap delete-data
```

---

## Snapshot Best Practices

```bash
# Full page snapshot saved to file (agent-friendly)
playwright-cli snapshot --filename=flp-home.yml

# Snapshot a specific element by ref
playwright-cli snapshot e34

# Limit depth for large SAP pages
playwright-cli snapshot --depth=4

# Snapshot + filename for workflow checkpoints
playwright-cli snapshot --filename=after-login.yml
playwright-cli snapshot --filename=after-fill.yml
playwright-cli snapshot --filename=after-save.yml
```

---

## Troubleshooting

| Symptom                       | Cause                                  | Fix                                                                    |
| ----------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| `bridge not ready`            | Missing `--config` flag                | Add `--config=.playwright/praman-cli.config.json` to `open` command    |
| `eval` returns nothing        | Bare expression (no wrapper)           | Wrap in `() => expr`: `playwright-cli eval "() => expr"`               |
| `console.log` invisible       | `run-code` captures return, not stdout | Use `return` instead of `console.log`                                  |
| `snapshot` filename error     | Missing `--filename`                   | Use `playwright-cli screenshot --filename=step-01.png`                 |
| 0 controls found              | Page not fully loaded                  | Run `wait-for-ui5.js` script first                                     |
| `$(cat ...)` fails on Windows | Bash-only syntax                       | Use PowerShell: `playwright-cli run-code (Get-Content script.js -Raw)` |
| Token overflow                | Too many controls                      | Discovery scripts cap at 100; use type filter for targeted queries     |
