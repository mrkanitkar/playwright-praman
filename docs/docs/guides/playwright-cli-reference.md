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

| Command                                    | Description                                           |
| ------------------------------------------ | ----------------------------------------------------- |
| `npx playwright open <url>`                | Launch browser and navigate to URL                    |
| `npx playwright goto <url>`                | Navigate the current page to a new URL                |
| `npx playwright snapshot`                  | Capture an accessibility snapshot of the current page |
| `npx playwright run-code <js>`             | Execute JavaScript in the browser context             |
| `npx playwright fill <selector> <value>`   | Fill an input field with a value                      |
| `npx playwright click <selector>`          | Click an element on the page                          |
| `npx playwright hover <selector>`          | Hover over an element                                 |
| `npx playwright type <selector> <text>`    | Type text character-by-character into an element      |
| `npx playwright press <selector> <key>`    | Press a keyboard key on an element                    |
| `npx playwright select <selector> <value>` | Select an option from a dropdown                      |
| `npx playwright screenshot`                | Capture a screenshot of the current page              |
| `npx playwright state-save <name>`         | Save browser state (cookies, storage) to a file       |
| `npx playwright state-load <name>`         | Restore browser state from a saved file               |
| `npx playwright close`                     | Close the browser                                     |
| `npx playwright delete-data`               | Delete all saved browser state data                   |

---

## `run-code` Patterns

`run-code` is the most important command for SAP UI5 testing. It executes arbitrary JavaScript in the browser and returns the result.

### Check if UI5 Bridge Is Available

```bash
npx playwright run-code "return typeof sap !== 'undefined' && typeof sap.ui !== 'undefined'"
```

### Discover Controls by Type

```bash
npx playwright run-code "
  const controls = sap.ui.core.Element.registry.filter(
    el => el.getMetadata().getName() === 'sap.m.Input'
  );
  return controls.map(c => ({ id: c.getId(), value: c.getValue?.() }));
"
```

### setValue + fireChange + waitForUI5

This is the **mandatory three-step pattern** for setting input values in SAP UI5:

```bash
npx playwright run-code "
  const control = sap.ui.getCore().byId('myInputId');
  control.setValue('NewValue');
  control.fireChange({ value: 'NewValue' });
  return 'done';
"
```

After setting a value, always wait for UI5 stability:

```bash
npx playwright run-code "
  return new Promise(resolve => {
    sap.ui.getCore().attachEvent('UIUpdated', () => resolve(true));
    setTimeout(() => resolve(false), 5000);
  });
"
```

### Read a Control Property

```bash
npx playwright run-code "
  const ctrl = sap.ui.getCore().byId('productTitle');
  return ctrl?.getText?.() ?? ctrl?.getValue?.() ?? 'not found';
"
```

### List All Controls in a View

```bash
npx playwright run-code "
  const all = sap.ui.core.Element.registry.filter(() => true);
  return all.slice(0, 50).map(c => ({
    id: c.getId(),
    type: c.getMetadata().getName()
  }));
"
```

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
npx playwright run-code "return document.title.includes('Home')" -s=auth
npx playwright state-save sap-auth -s=auth
npx playwright close -s=auth
```

---

## Critical Warnings

### `console.log` Output Is Invisible

```bash
# BAD — console.log output is NOT returned to the CLI caller
npx playwright run-code "console.log('hello'); return true;"
# Only 'true' is returned. The 'hello' is lost.
```

Always use `return` to pass data back:

```bash
# GOOD — return the value you need
npx playwright run-code "return JSON.stringify(someData);"
```

### `--filename` Is Mandatory for Snapshots

As noted above, without `--filename` the snapshot output may never reach the agent. Always save to a file.

### `return` Is the Only Way to Get Data Back

`run-code` returns the value of the last `return` statement. There is no other channel:

```bash
# Returns the string 'found'
npx playwright run-code "const el = document.querySelector('#foo'); return el ? 'found' : 'missing';"
```

### SAP iFrame Considerations

SAP Fiori Launchpad often renders apps inside iframes. CLI commands target the top frame by default. Use `run-code` to access iframe content:

```bash
npx playwright run-code "
  const iframe = document.querySelector('iframe#application-frame');
  const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
  return iframeDoc?.title ?? 'no iframe found';
"
```

For detailed iframe handling, see [CLI iFrame Guide](./playwright-cli-iframes.md).

### Timeout Defaults

CLI commands have a default timeout of 30 seconds. For slow SAP systems, some operations may need longer waits implemented via `run-code` with explicit `Promise` + `setTimeout` patterns rather than relying on the default timeout.

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

## Next Steps

- [CLI Setup Guide](./playwright-cli-setup.md) — install and configure the CLI
- [CLI Discovery Guide](./playwright-cli-discovery.md) — discover SAP controls with the CLI
- [CLI iFrame Guide](./playwright-cli-iframes.md) — handle SAP iframes
- [CLI Agents Guide](./playwright-cli-agents.md) — build agent loops with the CLI
- [MCP vs CLI](./mcp-vs-cli.md) — choose between MCP and CLI
