---
title: 'Playwright CLI for SAP Testing'
description: 'Overview of Praman + Playwright CLI integration — a token-efficient alternative to MCP for AI-driven SAP UI5 test automation. Setup, discovery, agents, and debugging.'
sidebar_label: 'Overview'
keywords:
  - playwright cli overview
  - praman cli integration
  - sap test automation cli
  - playwright cli sap ui5
  - token efficient agent testing
---

# Playwright CLI for SAP Testing

The **Playwright CLI** (`@playwright/cli`) is a terminal-based interface for controlling browsers,
designed for AI agent workflows. Praman extends it with SAP UI5-specific capabilities — bridge
injection, control discovery, structured snapshots, and screencast — to create a **token-efficient
alternative** to the MCP-based agent workflow.

Both MCP and CLI are **first-class, coexisting options**. They produce identical gold-standard
`.spec.ts` files using Praman fixtures.

## Why Playwright CLI?

| Benefit                       | Details                                                                    |
| ----------------------------- | -------------------------------------------------------------------------- |
| **30–50% fewer tokens**       | CLI commands are compact strings vs structured JSON-RPC tool calls         |
| **Named persistent sessions** | `-s=sap` keeps browser state across commands — no MCP server lifecycle     |
| **Same output quality**       | Identical `.spec.ts` files with `import { test } from 'playwright-praman'` |
| **Works everywhere**          | Any AI agent with shell access (`Bash` tool) can use CLI commands          |
| **Coexists with MCP**         | Use both in the same project — shared auth state, shared config            |

## How It Works

```text
┌───────────────────────────────────────────────────────────────┐
│                     AI Agent (Claude, Copilot, Cursor)         │
│                                                               │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │ Plan        │ →  │ Generate     │ →  │ Heal            │  │
│  │ CLI session │    │ Validate     │    │ --debug=cli     │  │
│  │ + discovery │    │ live browser │    │ fix selectors   │  │
│  └─────────────┘    └──────────────┘    └─────────────────┘  │
│         │                  │                    │              │
│         ▼                  ▼                    ▼              │
│  test-plan.md       app.spec.ts        app.spec.ts (fixed)   │
└───────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Playwright CLI  +  Praman Bridge       │
│  ─────────────────────────────────────  │
│  open / snapshot / run-code / fill /    │
│  click / state-save / state-load        │
│  + sap.ui.require('sap/ui/core/ElementRegistry')          │
│  + window.__praman_bridge               │
└─────────────────────────────────────────┘
```

1. **Agent opens a CLI session** with the Praman bridge injected via `initScript`
2. **Bridge exposes UI5 controls** — `run-code` calls `sap.ui.require('sap/ui/core/ElementRegistry')` for discovery
3. **Agent generates tests** using Praman fixtures exclusively (`ui5.control()`, `ui5.click()`)
4. **Tests are healed** by attaching to `--debug=cli` sessions and inspecting live page state

## Quick Start

```bash
# 1. Install (CLI agents are included by default)
npm install --save-dev playwright-praman
npx playwright-praman init

# 2. Export the bridge init script
npx playwright-praman bridge-script --output .playwright/praman-bridge.js

# 3. Verify your setup
npx playwright-praman doctor

# 4. Run an agent (Claude Code example)
# /praman-cli-plan
# "Explore the Manage Purchase Orders app and create a test plan"
```

## Guides

Read the guides in this order for a structured learning path, or jump to any topic directly.

### Setup and Configuration

| Guide                                             | What You Will Learn                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| [Playwright CLI Setup](./playwright-cli-setup.md) | Install `@playwright/cli`, configure bridge injection, verify with Quick Test |
| [MCP vs CLI](./mcp-vs-cli.md)                     | Side-by-side comparison — when to use MCP, CLI, or both                       |

### Discovery and Interaction

| Guide                                                  | What You Will Learn                                                                                    |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| [CLI Control Discovery](./playwright-cli-discovery.md) | `run-code` patterns for finding controls by ID, type, property; dialog discovery; V2 vs V4 differences |
| [CLI Iframe Handling](./playwright-cli-iframes.md)     | Bridge auto-injection into SAP iframes, `#sap-ui-static` scanning, cross-origin limitations            |

### AI Agents

| Guide                                          | What You Will Learn                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| [CLI Agents](./playwright-cli-agents.md)       | Three-agent pipeline (Plan, Generate, Heal), slash commands, skill files, IDE setup    |
| [Browser Bind & Screencast](./browser-bind.md) | `PRAMAN_BIND=1` to expose test browser to agents, screencast chapters, frame streaming |

### Reference

| Guide                                                | What You Will Learn                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [CLI Quick Reference](./playwright-cli-reference.md) | Complete command table, `run-code` patterns, session management, auth workflow cheat sheet |

## Key Concepts

### Bridge Injection

The Praman bridge (`window.__praman_bridge`) is a JavaScript module injected into every page via
Playwright's `initScript` mechanism. It provides access to the UI5 runtime — control registry,
property getters, OData model inspection — through a stable API that agents consume via `run-code`.

```bash
# Generate the bridge script
npx playwright-praman bridge-script --output .playwright/praman-bridge.js
```

See [CLI Setup](./playwright-cli-setup.md) for full configuration.

### Pre-Built Discovery Scripts

Praman ships 4 parameter-free `run-code` scripts in `dist/scripts/` for common discovery operations:

```bash
# Discover all controls with types, properties, methods (max 100)
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/discover-all.js)"

# Wait for UI5 stability
playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/wait-for-ui5.js)"
```

See [CLI Quick Reference](./playwright-cli-reference.md) for the full scripts table.

### Skill Files

Praman installs skill files to per-IDE locations so agents auto-discover SAP testing capabilities:

| IDE            | Skill Location                           |
| -------------- | ---------------------------------------- |
| Claude Code    | `.claude/skills/praman-sap-cli/SKILL.md` |
| GitHub Copilot | `.github/skills/praman-sap-cli/SKILL.md` |
| Project root   | `skills/praman-sap-cli/SKILL.md`         |

When an agent receives "Use playwright skills to test SAP app", it finds the skill file,
reads the command reference and discovery patterns, and generates Praman-compliant tests.

See [CLI Agents](./playwright-cli-agents.md) for skill file details.

### Praman CLI Commands

In addition to standard Playwright CLI commands, Praman provides:

| Command                                    | Purpose                                                 |
| ------------------------------------------ | ------------------------------------------------------- |
| `npx playwright-praman bridge-script`      | Export bridge init script for CLI config                |
| `npx playwright-praman snapshot`           | Capture structured SAP UI5 control tree snapshot        |
| `npx playwright-praman doctor`             | Validate complete setup (12 checks)                     |
| `npx playwright-praman capabilities`       | Show capability manifest for agent preflight            |
| `npx playwright-praman verify-spec <file>` | Validate generated .spec.ts against gold-standard rules |

See [CLI Quick Reference](./playwright-cli-reference.md) for full option tables.

### Browser Bind (Playwright 1.59+)

Enable `PRAMAN_BIND=1` to let CLI agents connect to a running test browser:

```bash
PRAMAN_BIND=1 npx playwright test tests/e2e/my-sap-test.spec.ts
```

The test fixture calls `browser.bind('praman-agent')` and logs the endpoint URL.
A CLI agent can then attach to inspect live UI state mid-test.

See [Browser Bind & Screencast](./browser-bind.md) for details.

## Supported IDEs

CLI agents are installed for all detected IDEs during `npx playwright-praman init`:

| IDE            | Agent Format                               | Invocation                         |
| -------------- | ------------------------------------------ | ---------------------------------- |
| Claude Code    | `.claude/agents/praman-sap-*-cli.md`       | `/praman-cli-plan`                 |
| GitHub Copilot | `.github/agents/praman-sap-*-cli.agent.md` | `@praman-sap-planner-cli`          |
| Cursor         | `.cursor/rules/praman-cli.mdc`             | Auto-activates on `.spec.ts` files |
| Jules          | `.jules/praman-setup.md`                   | References CLI commands            |

Pass `--no-cli` to `init` or `init-agents` to skip CLI agent installation.

## Next Steps

- **New to Praman?** Start with [Getting Started](./getting-started.md) and [Agent & IDE Setup](./agent-setup.md)
- **Ready to install?** Go to [Playwright CLI Setup](./playwright-cli-setup.md)
- **Choosing between MCP and CLI?** Read [MCP vs CLI](./mcp-vs-cli.md)
- **Already set up?** Jump to [CLI Agents](./playwright-cli-agents.md) to run your first agent
