---
title: 'Playwright CLI Quick Reference'
description: 'Complete command reference for Playwright CLI used with Praman SAP UI5 testing. Commands, patterns, session management, and auth workflows.'
sidebar_label: 'CLI Quick Reference'
keywords:
  - playwright cli reference
  - playwright cli commands
  - praman cli sap testing
  - playwright npx commands
---

# Playwright CLI Quick Reference

This page is a compact reference for every Playwright CLI command used with Praman SAP UI5 testing. For setup and conceptual guides, see [CLI Setup](./playwright-cli-setup.md).

---

## Command Reference

| Command                                    | Description                                             |
| ------------------------------------------ | ------------------------------------------------------- |
| `npx playwright open <url>`                | Launch browser and navigate to URL                      |
| `npx playwright goto <url>`                | Navigate the current page to a new URL                  |
| `npx playwright snapshot`                  | Capture an accessibility snapshot of the current page   |
| `npx playwright run-code <js>`             | Execute JavaScript in the browser context               |
| `npx playwright fill <selector> <value>`   | Fill an input field with a value                        |
| `npx playwright click <selector>`          | Click an element on the page                            |
| `npx playwright hover <selector>`          | Hover over an element                                   |
| `npx playwright type <selector> <text>`    | Type text character-by-character into an element        |
| `npx playwright press <selector> <key>`    | Press a keyboard key on an element                      |
| `npx playwright select <selector> <value>` | Select an option from a dropdown                        |
| `npx playwright screenshot`                | Capture a screenshot of the current page                |
| `npx playwright state-save <name>`         | Save browser state (cookies, storage) to a file         |
| `npx playwright state-load <name>`         | Restore browser state from a saved file                 |
| `npx playwright close`                     | Close the browser                                       |
| `npx playwright delete-data`               | Delete all saved browser state data                     |
| `npx playwright-praman bridge-script`      | Export bridge init script for CLI config                |
| `npx playwright-praman snapshot`           | Capture structured SAP UI5 control tree snapshot        |
| `npx playwright-praman doctor`             | Validate CLI setup (includes 4 CLI-specific checks)     |
| `npx playwright-praman capabilities`       | Show machine-readable capability manifest for agents    |
| `npx playwright-praman verify-spec <file>` | Verify a generated .spec.ts against gold-standard rules |

---

## `run-code` Patterns

`run-code` is the most important command for SAP UI5 testing. It executes arbitrary JavaScript in the browser and returns the result.

### Check if UI5 Bridge Is Available

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => typeof sap !== 'undefined' && typeof sap.ui !== 'undefined');
}"
```

### Discover Controls by Type

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const controls = Object.values(sap.ui.require('sap/ui/core/ElementRegistry').all()).filter(
      el => el.getMetadata().getName() === 'sap.m.Input'
    );
    return controls.map(c => ({ id: c.getId(), value: c.getValue?.() }));
  });
}"
```

### setValue + fireChange + waitForUI5

This is the **mandatory three-step pattern** for setting input values in SAP UI5:

```bash
playwright-cli run-code "async page => {
  await page.evaluate(([id, val]) => {
    const control = sap.ui.getCore().byId(id);
    control.setValue(val);
    control.fireChange({ value: val });
  }, ['myInputId', 'NewValue']);
  return 'done';
}"
```

After setting a value, always wait for UI5 stability:

```bash
playwright-cli run-code "async page => {
  return await page.waitForFunction(() => {
    return !sap.ui.core.BusyIndicator.oPopup?.isOpen?.() &&
      window.__praman_bridge?.ready === true;
  }, { timeout: 5000 });
}"
```

### Read a Control Property

```bash
playwright-cli run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = sap.ui.getCore().byId(id);
    return ctrl?.getText?.() ?? ctrl?.getValue?.() ?? 'not found';
  }, 'productTitle');
}"
```

### List All Controls in a View

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    return Object.values(sap.ui.require('sap/ui/core/ElementRegistry').all()).slice(0, 50).map(c => ({
      id: c.getId(),
      type: c.getMetadata().getName()
    }));
  });
}"
```

---

## `eval` Quick Checks

`eval` executes a single expression and returns the result. Unlike `run-code`, it runs directly in the page context without a `page` parameter.

**CRITICAL:** `eval` requires a function wrapper `() => expr`. Bare expressions fail silently.

```bash
# ✅ CORRECT — function wrapper
playwright-cli eval "() => window.__praman_bridge?.ready"

# ❌ WRONG — bare expression (fails silently)
playwright-cli eval "window.__praman_bridge?.ready"
```

### Common `eval` Patterns

```bash
# Bridge readiness check
playwright-cli eval "() => window.__praman_bridge ? window.__praman_bridge.ready : false"

# UI5 version
playwright-cli eval "() => typeof sap !== 'undefined' ? sap.ui.version : 'UI5 not loaded'"

# Control count
playwright-cli eval "() => Object.keys(sap.ui.require('sap/ui/core/ElementRegistry').all()).length"

# Single control text
playwright-cli eval "() => sap.ui.getCore().byId('myButton')?.getText()"
```

Use `eval` for quick one-liner checks. Use `run-code` for multi-step operations that need `page.evaluate()`, `page.waitForFunction()`, or multiple sequential browser calls.

---

## Pre-Built Discovery Scripts

Praman ships 4 parameter-free scripts in `node_modules/playwright-praman/dist/scripts/` for common operations. Use them with `run-code` and shell substitution:

| Script               | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `discover-all.js`    | All controls with types, methods (max 100) |
| `wait-for-ui5.js`    | Poll for UI5 stability                     |
| `bridge-status.js`   | Bridge readiness diagnostics               |
| `dialog-controls.js` | Controls inside open dialogs               |

### Usage

```bash
# Discover all controls with methods
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/discover-all.js)"

# Wait for UI5 stability
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/wait-for-ui5.js)"

# Bridge diagnostics
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/bridge-status.js)"

# Dialog controls
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/dialog-controls.js)"
```

:::note Windows users
The `$(cat ...)` syntax is Bash-only. On Windows PowerShell, use:

```powershell
$script = Get-Content node_modules/playwright-praman/dist/scripts/discover-all.js -Raw
playwright-cli -s=sap run-code $script
```

:::

---

## Snapshot Best Practices

Snapshots capture an accessibility tree of the current page, which AI agents use for control discovery.

### Always Use `--filename`

```bash
# Good — saves to a file the agent can reference later
npx playwright snapshot --filename=login-page.yaml

# Bad — output goes to stdout and may be truncated or lost
npx playwright snapshot
```

:::warning `--filename` is mandatory for agent workflows
Without `--filename`, the snapshot output goes to stdout. In agent loops, stdout may be truncated, rate-limited, or invisible to the agent. Always save to a file.
:::

### Control Snapshot Depth

Large SAP pages can produce enormous snapshots. Use `--depth` to limit the tree:

```bash
# Shallow snapshot — top-level controls only
npx playwright snapshot --filename=overview.yaml --depth=3

# Deep snapshot — full control tree (use sparingly)
npx playwright snapshot --filename=full-detail.yaml --depth=10
```

### Snapshot a Specific Element

Use an element reference (CSS selector) to snapshot only part of the page:

```bash
npx playwright snapshot --filename=dialog.yaml --selector="[role='dialog']"
```

---

## Session Management

Sessions allow you to persist browser state across multiple CLI invocations — critical for SAP login flows.

### Named Sessions

```bash
# Start a named session
npx playwright open https://my-sap-system.example.com -s=sap-dev

# Subsequent commands reuse the same browser
npx playwright goto https://my-sap-system.example.com/app -s=sap-dev
npx playwright snapshot --filename=app.yaml -s=sap-dev
```

### Persistent Sessions

Persistent sessions survive browser closes and reuse saved state:

```bash
# Start a persistent session (state is saved automatically)
npx playwright open https://my-sap-system.example.com --persistent -s=sap-auth

# Close and reopen — session state is restored
npx playwright close -s=sap-auth
npx playwright open https://my-sap-system.example.com --persistent -s=sap-auth
```

### Clean Up Sessions

```bash
# Close a specific session
npx playwright close -s=sap-dev

# Delete all saved session data
npx playwright delete-data
```

---

## Auth Workflow

SAP systems require authentication before any testing. The CLI auth workflow uses `fill`, `click`, and `state-save` to capture login state.

### Step 1: Log In

```bash
# Open the SAP system
npx playwright open https://my-sap-system.example.com -s=sap-auth

# Fill credentials
npx playwright fill "#USERNAME_FIELD" "test-user" -s=sap-auth
npx playwright fill "#PASSWORD_FIELD" "test-password" -s=sap-auth

# Click login
npx playwright click "#LOGIN_BUTTON" -s=sap-auth
```

### Step 2: Save Auth State

After login succeeds and the launchpad loads:

```bash
npx playwright state-save sap-auth-state -s=sap-auth
```

### Step 3: Restore Auth State in Future Sessions

```bash
npx playwright open https://my-sap-system.example.com -s=sap-test
npx playwright state-load sap-auth-state -s=sap-test

# Now navigate directly to the app — no login required
npx playwright goto https://my-sap-system.example.com/app#PurchaseOrder-manage -s=sap-test
```

### Automate Auth in Agent Loops

For agents, save the auth flow as a script:

```bash
#!/usr/bin/env bash
# auth-sap.sh — run once, then reuse state
npx playwright open "$SAP_CLOUD_BASE_URL" -s=auth
npx playwright fill "#USERNAME_FIELD" "$SAP_CLOUD_USERNAME" -s=auth
npx playwright fill "#PASSWORD_FIELD" "$SAP_CLOUD_PASSWORD" -s=auth
npx playwright click "#LOGIN_BUTTON" -s=auth
# Wait for FLP to load
npx playwright run-code "async page => { return await page.evaluate(() => document.title.includes('Home')); }" -s=auth
npx playwright state-save sap-auth -s=auth
npx playwright close -s=auth
```

---

## Critical Warnings

### `console.log` Output Is Invisible

```bash
# BAD — console.log output is NOT returned to the CLI caller
playwright-cli run-code "async page => { console.log('hello'); return true; }"
# Only 'true' is returned. The 'hello' is lost.
```

Always use `return` to pass data back:

```bash
# GOOD — return the value you need
playwright-cli run-code "async page => { return await page.evaluate(() => someData); }"
```

### `--filename` Is Mandatory for Snapshots

As noted above, without `--filename` the snapshot output may never reach the agent. Always save to a file.

### `return` Is the Only Way to Get Data Back

`run-code` returns the value of the last `return` statement. There is no other channel:

```bash
# Returns the string 'found'
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const el = document.querySelector('#foo');
    return el ? 'found' : 'missing';
  });
}"
```

### SAP iFrame Considerations

SAP Fiori Launchpad often renders apps inside iframes. CLI commands target the top frame by default. Use `run-code` to access iframe content:

```bash
playwright-cli run-code "async page => {
  return await page.evaluate(() => {
    const iframe = document.querySelector('iframe#application-frame');
    const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
    return iframeDoc?.title ?? 'no iframe found';
  });
}"
```

For detailed iframe handling, see [CLI iFrame Guide](./playwright-cli-iframes.md).

### Timeout Defaults

CLI commands have a default timeout of 30 seconds. For slow SAP systems, some operations may need longer waits implemented via `run-code`
with explicit `Promise` + `setTimeout` patterns rather than relying on the default timeout.

---

## Quick Cheat Sheet

```text
# Auth flow
open → fill → click → state-save → close
state-load → goto app → snapshot → run-code

# Discovery flow
open → state-load → goto app → snapshot --filename=X
run-code "sap.ui.core.Element.registry.filter(...)"

# Interaction flow
run-code "sap.ui.getCore().byId('X').setValue('Y')"
run-code "sap.ui.getCore().byId('X').fireChange({value:'Y'})"
snapshot --filename=after.yaml

# Session management
-s=name        → named session
--persistent   → survives close
state-save     → save cookies/storage
state-load     → restore cookies/storage
delete-data    → clean slate
```

---

## Praman-Specific Commands

These commands extend the Playwright CLI with SAP UI5-specific features:

### `bridge-script`

Exports the Praman UI5 bridge injection script. Use this instead of hardcoding the `node_modules` path:

```bash
# Print to stdout
npx playwright-praman bridge-script

# Write to file for CLI config
npx playwright-praman bridge-script --output .playwright/praman-bridge.js
```

Then reference the output file in your CLI config:

```json
{
  "browser": {
    "initScript": {
      "path": ".playwright/praman-bridge.js"
    }
  }
}
```

### `snapshot`

Captures a structured view of all UI5 controls from a running CLI session. Unlike `playwright snapshot` (which captures an accessibility tree),
`praman snapshot` returns control IDs, types, properties, and OData bindings:

```bash
# JSON output (default)
npx playwright-praman snapshot

# Table format for quick inspection
npx playwright-praman snapshot --format table

# Filter by control type
npx playwright-praman snapshot --filter sap.m.Button

# Limit results and save to file
npx playwright-praman snapshot --depth 50 --output snapshot.json

# YAML format from a named session
npx playwright-praman snapshot --session mySession --format yaml
```

| Option             | Default   | Description                            |
| ------------------ | --------- | -------------------------------------- |
| `--session <name>` | `pwtest`  | Playwright session name to connect to  |
| `--output <path>`  | stdout    | Write snapshot to file                 |
| `--format <fmt>`   | `json`    | Output format: `json`, `yaml`, `table` |
| `--depth <n>`      | `0` (all) | Maximum number of controls to return   |
| `--filter <type>`  | —         | Filter by control type prefix          |

Example table output:

```bash
npx playwright-praman snapshot --format table --filter sap.m.Input
```

Output:

```text
┌──────────────────────┬──────────────┬─────────┬───────────┐
│ ID                   │ Type         │ Visible │ Value     │
├──────────────────────┼──────────────┼─────────┼───────────┤
│ app--nameInput       │ sap.m.Input  │ true    │ ACME Corp │
│ app--qtyInput        │ sap.m.Input  │ true    │ 100       │
└──────────────────────┴──────────────┴─────────┴───────────┘
```

### `doctor`

Validates your complete Praman + CLI setup:

```bash
npx playwright-praman doctor
```

```text
✓ @playwright/test        installed
✓ Playwright version      v1.60.0
✓ SAP_CLOUD_BASE_URL      set
✓ @playwright/cli         installed
✓ praman-cli.config.json  found
✓ initScript paths        valid
✓ CLI agent files         found
```

### `capabilities` — Capability Manifest

Returns a machine-readable manifest of all CLI capabilities for agent preflight:

```bash
# JSON output (default)
npx playwright-praman capabilities

# Compact agent-friendly format
npx playwright-praman capabilities --agent

# Table format for human review
npx playwright-praman capabilities --format table
```

| Option           | Default | Description                             |
| ---------------- | ------- | --------------------------------------- |
| `--format <fmt>` | `json`  | Output format: `json`, `table`, `agent` |
| `--agent`        | —       | Shortcut for `--format=agent`           |

Example agent output:

```text
Praman v1.1.2 — 13 capabilities

UI5-DISC-001 [run-code] Enumerate all UI5 controls with types, properties, and methods (max 100) (script: discover-all.js)
UI5-DISC-002 [run-code] Filter controls by sap.ui type name (e.g. sap.m.Input)
UI5-DISC-003 [run-code] Find controls inside open SAP dialogs, grouped by dialog (script: dialog-controls.js)
UI5-INSP-001 [run-code] Get full metadata, methods, bindings for one control by ID
UI5-ACT-001 [run-code] Mandatory three-step pattern: setValue + fireChange + waitForUI5
UI5-ACT-002 [run-code] Trigger firePress on a sap.m.Button control
UI5-NAV-001 [run-code] Navigate via Fiori Launchpad cross-app navigation
UI5-STB-001 [run-code] Poll for UI5 stability (bridge ready, BusyIndicator inactive, no pending XHR) (script: wait-for-ui5.js)
UI5-STB-002 [run-code] Quick bridge diagnostics: version, readiness, control count (script: bridge-status.js)
UI5-GEN-001 [offline] Generate a Praman test.step() block from discovered control info
UI5-GEN-002 [offline] Generate the IDS constant object from discovered control IDs
UI5-GEN-003 [offline] Validate a generated .spec.ts against gold-standard rules
UI5-GEN-004 [offline] Retrieve the full capability manifest (this command)
```

### `verify-spec` — Spec Compliance Check

Validates a generated `.spec.ts` file against gold-standard rules:

```bash
npx playwright-praman verify-spec tests/e2e/my-app.spec.ts
```

Checks performed:

| Check           | What It Validates                                         |
| --------------- | --------------------------------------------------------- |
| Import check    | Uses `import { test, expect } from 'playwright-praman'`   |
| IDS pattern     | Has a `const IDS = { ... }` object for control IDs        |
| test.step usage | Uses `test.step()` for multi-step flows                   |
| Banned patterns | No `page.waitForTimeout()` or `page.click('#__...')`      |
| TSDoc header    | Has a compliance header with `@status` or `@version` tags |
| ESLint          | Passes ESLint lint check                                  |

Exit code is `1` if any check fails.

```bash
# Run on all generated specs
npx playwright-praman verify-spec tests/e2e/sap-cloud/*.spec.ts
```

---

## Next Steps

- [CLI Setup Guide](./playwright-cli-setup.md) — install and configure the CLI
- [CLI Discovery Guide](./playwright-cli-discovery.md) — discover SAP controls with the CLI
- [CLI iFrame Guide](./playwright-cli-iframes.md) — handle SAP iframes
- [CLI Agents Guide](./playwright-cli-agents.md) — build agent loops with the CLI
- [MCP vs CLI](./mcp-vs-cli.md) — choose between MCP and CLI
- [Browser Bind & Screencast](./browser-bind.md) — expose test browser to CLI agents
