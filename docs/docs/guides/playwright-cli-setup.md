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
    "browserName": "chromium",
    "launchOptions": {
      "headless": false,
      "channel": "chromium"
    },
    "initScript": ["./node_modules/playwright-praman/dist/browser/praman-bridge-init.js"]
  }
}
```

| Field                           | Purpose                                                    |
| ------------------------------- | ---------------------------------------------------------- |
| `browser.browserName`           | Browser engine (`chromium`, `firefox`, `webkit`)           |
| `browser.launchOptions`         | Playwright launch options (headed mode, channel selection) |
| `browser.launchOptions.channel` | Set to `"chromium"` to use Playwright's bundled browser    |
| `browser.initScript`            | Praman bridge script — injected into every page via CDP    |

:::tip Auth session reuse
To reuse an authenticated session, run `npx playwright test tests/auth.setup.ts` once to
save a session to `.auth/sap-session.json`, then load it with the CLI:

```bash
npx @playwright/cli state-load .auth/sap-session.json
```

:::

## Quick Test

Verify that the bridge is loaded and the CLI can discover UI5 controls.

### 1. Open a browser

```bash
npx @playwright/cli open --config .playwright/praman-cli.config.json "$SAP_CLOUD_BASE_URL"
```

This launches Playwright's bundled Chromium with the Praman bridge injected and navigates to
your SAP system. The `--config` flag is only needed on the `open` command — subsequent
commands connect to the running session automatically.

### 2. Verify bridge readiness

In a **separate terminal**, run:

```bash
npx @playwright/cli eval "() => window.__praman_bridge !== undefined"
```

Expected output: `true`. This confirms the bridge init script was injected successfully.

:::note `eval` syntax
The `eval` command requires a function wrapper: `"() => expression"`, not a bare expression.
:::

### 3. Discover a control

```bash
npx @playwright/cli eval "() => {
  const reg = sap.ui.require('sap/ui/core/ElementRegistry').all();
  const btn = Object.values(reg).find(c => c.getMetadata().getName() === 'sap.m.Button');
  return btn ? { id: btn.getId(), text: btn.getText ? btn.getText() : '' } : null;
}"
```

This returns the first `sap.m.Button` control found on the page. If you see a JSON object
with control metadata, the bridge is working correctly.

For more complex discovery, use `run-code` with the pre-built scripts:

```bash
npx @playwright/cli run-code "$(cat node_modules/playwright-praman/dist/scripts/discover-all.js)"
```

### 4. Close the browser

```bash
npx @playwright/cli close
```

## Agent Setup with CLI

Praman's `init-agents` command installs CLI-based agent definitions by default. Use
`--no-cli` to skip them if you only want MCP-based agents:

```bash
# Claude Code (CLI agents installed by default)
npx playwright-praman init-agents --loop=claude

# GitHub Copilot — also covers VS Code Copilot (.github/agents/)
npx playwright-praman init-agents --loop=copilot

# Cursor
npx playwright-praman init-agents --loop=cursor

# Auto-detect all IDEs
npx playwright-praman init-agents

# Skip CLI agents (MCP agents only)
npx playwright-praman init-agents --loop=claude --no-cli
```

This installs agent definitions that reference `npx @playwright/cli` commands instead of
MCP tool calls.

:::note VS Code vs GitHub Copilot
VS Code Copilot reads agents from `.github/agents/`. Use `--loop=copilot` (not `--loop=vscode`)
to install CLI agents there. `--loop=vscode` installs VS Code IDE settings only (snippets,
extensions, settings.json) — it has no CLI agent files.
:::

| Flag           | Description                                                              |
| -------------- | ------------------------------------------------------------------------ |
| `--loop=<ide>` | Target IDE: `claude`, `copilot`, `cursor`, `jules`, `opencode`, `vscode` |
| `--no-cli`     | Skip Playwright CLI agent definitions (installed by default)             |
| `--force`      | Overwrite existing agent files                                           |

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
    "expression": "window.__praman_bridge.findControl({ controlType: 'sap.m.Button', properties: { text: 'Create' } })"
  }
}
```

**CLI approach** (shell command):

```bash
npx @playwright/cli eval "() => window.__praman_bridge.findControl({ controlType: 'sap.m.Button', properties: { text: 'Create' } })"
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
npx @playwright/cli click "Create BOM button"
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
npx @playwright/cli screenshot screenshot.png
```

## Using MCP and CLI Together

You can use both MCP and CLI in the same project. A typical pattern:

- **MCP** for interactive agent sessions (planning, discovery, healing) where the IDE
  manages the browser lifecycle
- **CLI** for scripted automation, CI pipelines, and token-constrained batch operations

Both share the same `.auth/` session storage and `praman.config.ts` settings.

## Troubleshooting

| Symptom                                    | Likely Cause                        | Fix                                                                      |
| ------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------------ |
| `command not found: playwright`            | CLI not installed                   | Run `npm install -g @playwright/cli@latest` or use `npx`                 |
| `__praman_bridge is undefined`             | Bridge init script not loaded       | Verify `initScript` path in `.playwright/praman-cli.config.json`         |
| `ERR_BRIDGE_TIMEOUT`                       | Page is not a UI5 app               | Verify the URL passed to `open` points to a Fiori Launchpad              |
| Browser opens but no SAP login             | Missing or expired auth session     | Re-run `npx playwright test tests/auth.setup.ts`                         |
| `storageState` file not found              | Auth setup not run yet              | Run auth setup first: `npx playwright test tests/auth.setup.ts`          |
| CLI hangs after `open`                     | Browser waiting for interaction     | Use a separate terminal for subsequent CLI commands                      |
| `initScript` path resolves to missing file | Package not installed or wrong path | Run `npm install` and verify `dist/browser/praman-bridge-init.js` exists |
| `ERR_CONTROL_NOT_FOUND`                    | Control not on current page         | Navigate to the correct page first, then retry discovery                 |
| Permission denied on global install        | npm global directory permissions    | Use `npx @playwright/cli` instead of global install                      |

### Verifying the Init Script Path

If the bridge is not loading, verify the init script exists:

```bash
ls node_modules/playwright-praman/dist/browser/praman-bridge-init.js
```

If the file does not exist, reinstall the package:

```bash
npm install --save-dev playwright-praman
```

### Debugging Bridge Injection

To confirm the bridge is injected, open the browser console (F12) and type:

```javascript
typeof window.__praman_bridge;
```

If this returns `"undefined"`, the `initScript` path in your config is incorrect. If it
returns `"object"`, the bridge is loaded and ready.

## Next Steps

| Topic                     | Documentation                                 |
| ------------------------- | --------------------------------------------- |
| Agent & IDE setup (MCP)   | [Agent Setup](./agent-setup.md)               |
| Running your first agent  | [Running Your Agent](./running-your-agent.md) |
| Authentication strategies | [Authentication](./authentication.md)         |
| Configuration reference   | [Configuration](./configuration.md)           |
| Selectors reference       | [Selectors](./selectors.md)                   |
