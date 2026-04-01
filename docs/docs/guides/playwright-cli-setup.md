---
title: Playwright CLI Setup
description: 'Set up Praman with the Playwright CLI — a token-efficient alternative to MCP for AI agent browser automation.'
sidebar_label: Playwright CLI Setup
---

# Playwright CLI Setup

The **Playwright CLI** (`@playwright/cli`) is a command-line interface for controlling browsers
from your terminal. It provides the same browser automation capabilities as the
[MCP server](./agent-setup.md), but communicates through stdin/stdout instead of a JSON-RPC
protocol. This makes it a **token-efficient alternative** — each command is a single shell
invocation rather than a structured tool call, which reduces context window usage in AI agent
conversations.

Both MCP and CLI are **first-class, coexisting options** in Praman. Choose whichever fits
your workflow, or use both side by side.

## Prerequisites

| Requirement         | Version                                  |
| ------------------- | ---------------------------------------- |
| Node.js             | `>=22`                                   |
| `@playwright/test`  | `>=1.57.0 <2.0.0`                        |
| `playwright-praman` | Latest                                   |
| `@playwright/cli`   | Latest (installed globally or via `npx`) |

Ensure you have already completed the base Praman setup:

```bash
npm install --save-dev playwright-praman @playwright/test
npx playwright install
```

## Install the Playwright CLI

Install globally for persistent access:

```bash
npm install -g @playwright/cli@latest
```

Or run on-demand with `npx` (no global install required):

```bash
npx @playwright/cli --help
```

Verify the installation:

```bash
npx @playwright/cli --version
```

## Bridge Configuration

Praman's UI5 bridge must be injected into the browser so the CLI can discover and interact
with SAP UI5 controls. Create a configuration file that tells the CLI to load the bridge
init script on every page navigation.

Create `.playwright/praman-cli.config.json` in your project root:

```json
{
  "browser": {
    "type": "chromium",
    "launchOptions": {
      "headless": false
    },
    "initScript": {
      "path": "node_modules/playwright-praman/dist/bridge/init-script.js"
    }
  },
  "baseURL": "${SAP_CLOUD_BASE_URL}",
  "storageState": ".auth/sap-session.json"
}
```

| Field                   | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `browser.type`          | Browser engine (`chromium`, `firefox`, `webkit`)       |
| `browser.launchOptions` | Playwright launch options (headed mode for debugging)  |
| `browser.initScript`    | Praman bridge script — injected into every page        |
| `baseURL`               | SAP system base URL (reads from env var)               |
| `storageState`          | Reuse authenticated session from `tests/auth.setup.ts` |

:::tip Auth session reuse
Run `npx playwright test tests/auth.setup.ts` once to save a session to `.auth/sap-session.json`.
The CLI will reuse this session, so you do not need to log in again.
:::

## Quick Test

Verify that the bridge is loaded and the CLI can discover UI5 controls.

### 1. Open a browser

```bash
npx @playwright/cli open --config .playwright/praman-cli.config.json "$SAP_CLOUD_BASE_URL"
```

This launches Chromium with the Praman bridge injected and navigates to your SAP system.

### 2. Verify bridge readiness

In a separate terminal, or after the browser is open, run:

```bash
npx @playwright/cli evaluate --config .playwright/praman-cli.config.json \
  "window.__praman_bridge__ !== undefined"
```

Expected output: `true`. This confirms the bridge init script was injected successfully.

### 3. Discover a control

```bash
npx @playwright/cli evaluate --config .playwright/praman-cli.config.json \
  "window.__praman_bridge__.findControl({ controlType: 'sap.m.Button' })"
```

This returns the first `sap.m.Button` control found on the page. If you see a JSON object
with control metadata, the bridge is working correctly.

### 4. Close the browser

```bash
npx @playwright/cli close
```

## Agent Setup with CLI

Praman's `init-agents` command supports a `--cli` flag that configures agents to use the
Playwright CLI instead of (or in addition to) MCP:

```bash
npx playwright-praman init-agents --loop=claude --cli
```

This installs agent definitions that reference CLI commands instead of MCP tool calls.
The agents will use `npx @playwright/cli` commands to interact with the browser.

| Flag           | Description                                              |
| -------------- | -------------------------------------------------------- |
| `--loop=<ide>` | Target IDE: `claude`, `vscode`, `cursor`, `copilot`, etc |
| `--cli`        | Configure agents for Playwright CLI (instead of MCP)     |
| `--force`      | Overwrite existing agent files                           |

## MCP vs CLI Comparison

Both approaches give agents full browser control. The difference is in the communication
protocol and token efficiency.

| Aspect                  | MCP (JSON-RPC)                              | CLI (stdin/stdout)                                |
| ----------------------- | ------------------------------------------- | ------------------------------------------------- |
| **Communication**       | JSON-RPC over stdio                         | Shell commands via stdin/stdout                   |
| **Token cost per call** | Higher (structured JSON request + response) | Lower (single command string + text output)       |
| **Setup**               | `.mcp.json` with `playwright-test` server   | `.playwright/praman-cli.config.json`              |
| **Browser lifecycle**   | Managed by MCP server                       | Managed by CLI process                            |
| **Agent integration**   | Native tool calls (Claude, Copilot, Cursor) | Shell execution (`Bash` tool, terminal)           |
| **Best for**            | IDEs with native MCP support                | Token-constrained agents, CI pipelines, scripting |
| **Parallel sessions**   | One browser per MCP server                  | Multiple CLI processes                            |
| **Bridge injection**    | Automatic via Praman MCP config             | Via `initScript` in CLI config                    |

### Example: Discovering a Button

**MCP approach** (tool call):

```json
{
  "tool": "browser_evaluate",
  "arguments": {
    "expression": "window.__praman_bridge__.findControl({ controlType: 'sap.m.Button', properties: { text: 'Create' } })"
  }
}
```

**CLI approach** (shell command):

```bash
npx @playwright/cli evaluate "window.__praman_bridge__.findControl({ controlType: 'sap.m.Button', properties: { text: 'Create' } })"
```

Both return the same result. The CLI version uses fewer tokens because there is no JSON
wrapper around the command.

### Example: Clicking a Control

**MCP approach**:

```json
{
  "tool": "browser_click",
  "arguments": {
    "element": "Create BOM button",
    "ref": "s1e45"
  }
}
```

**CLI approach**:

```bash
npx @playwright/cli click --ref "s1e45"
```

### Example: Taking a Screenshot

**MCP approach**:

```json
{
  "tool": "browser_take_screenshot"
}
```

**CLI approach**:

```bash
npx @playwright/cli screenshot --path screenshot.png
```

## Using MCP and CLI Together

You can use both MCP and CLI in the same project. A typical pattern:

- **MCP** for interactive agent sessions (planning, discovery, healing) where the IDE
  manages the browser lifecycle
- **CLI** for scripted automation, CI pipelines, and token-constrained batch operations

Both share the same `.auth/` session storage and `praman.config.ts` settings.

## Troubleshooting

| Symptom                                    | Likely Cause                        | Fix                                                              |
| ------------------------------------------ | ----------------------------------- | ---------------------------------------------------------------- |
| `command not found: playwright`            | CLI not installed                   | Run `npm install -g @playwright/cli@latest` or use `npx`         |
| `__praman_bridge__ is undefined`           | Bridge init script not loaded       | Verify `initScript.path` in `.playwright/praman-cli.config.json` |
| `ERR_BRIDGE_TIMEOUT`                       | Page is not a UI5 app               | Verify `baseURL` points to a Fiori Launchpad URL                 |
| Browser opens but no SAP login             | Missing or expired auth session     | Re-run `npx playwright test tests/auth.setup.ts`                 |
| `storageState` file not found              | Auth setup not run yet              | Run auth setup first: `npx playwright test tests/auth.setup.ts`  |
| CLI hangs after `open`                     | Browser waiting for interaction     | Use a separate terminal for subsequent CLI commands              |
| `initScript` path resolves to missing file | Package not installed or wrong path | Run `npm install` and verify the path exists                     |
| `ERR_CONTROL_NOT_FOUND`                    | Control not on current page         | Navigate to the correct page first, then retry discovery         |
| Permission denied on global install        | npm global directory permissions    | Use `npx @playwright/cli` instead of global install              |

### Verifying the Init Script Path

If the bridge is not loading, verify the init script exists:

```bash
ls node_modules/playwright-praman/dist/bridge/init-script.js
```

If the file does not exist, reinstall the package:

```bash
npm install --save-dev playwright-praman
```

### Debugging Bridge Injection

To confirm the bridge is injected, open the browser console (F12) and type:

```javascript
typeof window.__praman_bridge__;
```

If this returns `"undefined"`, the init script path in your config is incorrect. If it
returns `"object"`, the bridge is loaded and ready.

## Next Steps

| Topic                     | Documentation                                 |
| ------------------------- | --------------------------------------------- |
| Agent & IDE setup (MCP)   | [Agent Setup](./agent-setup.md)               |
| Running your first agent  | [Running Your Agent](./running-your-agent.md) |
| Authentication strategies | [Authentication](./authentication.md)         |
| Configuration reference   | [Configuration](./configuration.md)           |
| Selectors reference       | [Selectors](./selectors.md)                   |
