---
title: 'MCP vs CLI'
description: 'Choosing between MCP and Playwright CLI for Praman SAP test automation. Comparison of token cost, latency, IDE support, and use cases.'
sidebar_label: 'MCP vs CLI'
keywords:
  - mcp vs cli playwright
  - playwright mcp server
  - playwright cli agents
  - sap test automation comparison
  - token efficient testing
---

# MCP vs CLI: Choosing Your Agent Interface

Praman supports two first-class approaches for AI-driven SAP test automation: the **MCP server**
(Model Context Protocol) and the **Playwright CLI**. The CLI is built into Playwright 1.59+ (includes
browsers). The MCP server requires a separate install: `npm install @playwright/mcp`. Both produce
identical gold-standard `.spec.ts` files using Praman fixtures.

This guide helps you choose the right approach -- or use both together.

## At a Glance

| Dimension              | MCP                                      | CLI                                      |
| ---------------------- | ---------------------------------------- | ---------------------------------------- |
| **Included in**        | `@playwright/mcp` (separate install)     | Playwright 1.59+ (built-in)              |
| **Token cost**         | Higher (protocol envelope per tool call) | Lower (compact terminal output)          |
| **Latency per action** | \~50--100 ms (WebSocket round-trip)      | \~20--50 ms (direct process invocation)  |
| **Setup**              | Add `.mcp.json` to project root          | Add `praman-cli.config.json`             |
| **IDE support**        | VS Code (native), Claude Code, Copilot   | Any terminal-based agent                 |
| **Real-time feedback** | Rich (inline screenshots, DOM snapshots) | File-based (snapshots saved to `.yml`)   |
| **Session management** | Tied to MCP server process lifecycle     | Named persistent sessions (`-s=<name>`)  |
| **CI/CD suitability**  | Needs running MCP server                 | Native (just shell commands)             |
| **Batch operations**   | Sequential tool calls                    | Scriptable, parallelizable               |
| **Bridge injection**   | `initScript` in MCP config               | `initScript` in `praman-cli.config.json` |
| **Output quality**     | Gold-standard `.spec.ts`                 | Gold-standard `.spec.ts`                 |

:::tip CLI is built in, MCP is a separate package
The Playwright CLI is built into Playwright 1.59+ -- nothing extra to install. The MCP server
requires a separate package: `npm install @playwright/mcp`. Once installed, just choose your config.
:::

## Agent Naming Convention

Each Praman agent ships as two files -- one for MCP and one for CLI. The `-cli` suffix tells you
which interface the agent uses:

| Agent File                          | Type | Requires              |
| ----------------------------------- | ---- | --------------------- |
| `praman-sap-planner.agent.md`       | MCP  | `@playwright/mcp`     |
| `praman-sap-planner-cli.agent.md`   | CLI  | Built into Playwright |
| `praman-sap-generator.agent.md`     | MCP  | `@playwright/mcp`     |
| `praman-sap-generator-cli.agent.md` | CLI  | Built into Playwright |
| `praman-sap-healer.agent.md`        | MCP  | `@playwright/mcp`     |
| `praman-sap-healer-cli.agent.md`    | CLI  | Built into Playwright |

:::info Naming rule
Files with `-cli` suffix = CLI agent (no MCP server needed). Files without `-cli` = MCP agent.
:::

---

## Option A: MCP

MCP gives agents rich, interactive feedback -- inline screenshots, DOM snapshots returned directly in
the conversation, and native IDE integration.

### When MCP Shines

- **Interactive exploration** -- stepping through a Fiori app while the agent narrates controls
- **VS Code / Copilot integration** -- the Playwright MCP extension provides inline screenshots and
  DOM views in the sidebar
- **Real-time debugging** -- inspecting page state mid-flow without saving snapshots to disk
- **First-time discovery** -- when you don't know the app structure and want visual feedback
- **Demo and training** -- showing stakeholders how the agent explores and generates tests

### MCP Setup

First, install the MCP server package (it is not included in Playwright core):

```bash
npm install @playwright/mcp
```

Then add `.mcp.json` to your project root:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp", "--caps", "vision"]
    }
  }
}
```

### MCP Agents

| Agent         | Claude Code            | Copilot                 |
| ------------- | ---------------------- | ----------------------- |
| Planner       | `/praman-sap-plan`     | `@praman-sap-planner`   |
| Generator     | `/praman-sap-generate` | `@praman-sap-generator` |
| Healer        | `/praman-sap-heal`     | `@praman-sap-healer`    |
| Full pipeline | `/praman-sap-coverage` | --                      |

---

## Option B: Playwright CLI

The CLI gives agents direct shell access to browser automation -- lower token overhead, scriptable
commands, and native CI/CD integration.

### When CLI Shines

- **Token-sensitive workflows** -- large codebases where every token counts
- **CI/CD pipelines** -- automated test generation and healing in GitHub Actions or Jenkins
- **Terminal-based agents** -- any LLM agent with shell access (not just VS Code)
- **Batch generation** -- running the planner across multiple Fiori apps in sequence
- **Large codebases** -- CLI snapshot files avoid bloating the conversation context
- **Persistent sessions** -- keeping a browser open across multiple agent invocations

### CLI Setup

Create `.playwright/praman-cli.config.json` in your project:

```json
{
  "browser": {
    "browserName": "chromium",
    "initScript": ["./node_modules/playwright-praman/dist/browser/praman-bridge-init.js"]
  },
  "timeouts": {
    "navigation": 30000,
    "action": 10000
  }
}
```

### CLI Agents

| Agent         | Claude Code            | Copilot                     |
| ------------- | ---------------------- | --------------------------- |
| Planner CLI   | `/praman-cli-plan`     | `@praman-sap-planner-cli`   |
| Generator CLI | `/praman-cli-generate` | `@praman-sap-generator-cli` |
| Healer CLI    | `/praman-cli-heal`     | `@praman-sap-healer-cli`    |
| Full pipeline | `/praman-cli-coverage` | --                          |

### CLI Strengths

- **30--50% fewer tokens** per agent session compared to MCP
- **Scriptable** -- chain commands in shell scripts for batch operations
- **File-based snapshots** -- agent reads only what it needs, not the full DOM
- **Named sessions** -- `playwright-cli -s=sap` persists across commands
- **CI-native** -- runs anywhere `npx` works, no WebSocket setup

---

## Using Both Together

MCP and CLI are not mutually exclusive. Many teams use both depending on the task:

| Phase                     | Approach | Why                                   |
| ------------------------- | -------- | ------------------------------------- |
| **Initial exploration**   | MCP      | Rich visual feedback for unknown apps |
| **Test generation**       | CLI      | Token-efficient batch generation      |
| **Interactive debugging** | MCP      | Real-time page inspection             |
| **CI/CD healing**         | CLI      | Automated fix-and-retry in pipelines  |
| **Demo to stakeholders**  | MCP      | Visual, interactive agent session     |
| **Nightly regression**    | CLI      | Batch heal across entire test suite   |

### Example: MCP for Discovery, CLI for Generation

```bash
# Step 1: Use MCP planner to explore the app interactively
# (in VS Code with Playwright MCP extension)
# /praman-sap-plan "Explore the Manage Purchase Orders app"

# Step 2: Switch to CLI for token-efficient generation
# /praman-cli-generate "Generate tests from tests/plans/purchase-order-plan.md"

# Step 3: Run in CI with CLI healer
npx playwright test tests/e2e/purchase-order.spec.ts || true
# /praman-cli-heal "Fix tests/e2e/purchase-order.spec.ts"
```

---

## Feature Parity

Both approaches support the full Praman agent pipeline:

| Feature                    | MCP | CLI | Notes                                        |
| -------------------------- | --- | --- | -------------------------------------------- |
| SAP authentication         | Yes | Yes | Both use `storageState` for auth persistence |
| FLP navigation             | Yes | Yes | `browser_navigate` / `playwright-cli open`   |
| UI5 control discovery      | Yes | Yes | `browser_evaluate` / `run-code`              |
| Bridge readiness check     | Yes | Yes | Same `window.__praman_bridge.ready` check    |
| Page snapshots             | Yes | Yes | Inline (MCP) / file-based (CLI)              |
| Screenshots                | Yes | Yes | Inline (MCP) / file-based (CLI)              |
| Form fill + click          | Yes | Yes | `browser_fill` / `playwright-cli fill`       |
| Value Help workflows       | Yes | Yes | Same UI5 bridge patterns                     |
| OData binding extraction   | Yes | Yes | Same `run-code` / `evaluate` patterns        |
| Named sessions             | No  | Yes | CLI-only: `-s=<name>` for persistent state   |
| Inline DOM in conversation | Yes | No  | MCP returns DOM directly; CLI saves to file  |
| CI/CD without server       | No  | Yes | CLI runs as plain shell commands             |
| Planner agent              | Yes | Yes | Identical output format                      |
| Generator agent            | Yes | Yes | Identical output format                      |
| Healer agent               | Yes | Yes | Identical debugging approach                 |
| Full coverage pipeline     | Yes | Yes | Both support plan + generate + heal cycle    |
| Custom control support     | Yes | Yes | Same bridge + `run-code` patterns            |
| Fiori Elements support     | Yes | Yes | Same SmartField / MDC discovery              |
| Spec compliance check      | No  | Yes | `npx playwright-praman verify-spec <file>`   |
| Capability manifest        | No  | Yes | `npx playwright-praman capabilities --agent` |

---

## Recommendations

| Team Profile                                         | Start With         |
| ---------------------------------------------------- | ------------------ |
| VS Code users with Playwright extension              | MCP                |
| Terminal-first developers (vim, tmux, CLI agents)    | CLI                |
| CI/CD-heavy teams automating test generation         | CLI for pipelines  |
| Mixed team with different IDEs                       | CLI (universal)    |
| Teams exploring SAP apps for the first time          | MCP for discovery  |
| Token-constrained environments (rate limits, budget) | CLI                |
| Teams that want both interactive and batch workflows | MCP + CLI together |

---

## Installing Agent Definitions

Both MCP and CLI agent definitions are installed via the same command:

```bash
# Install agents (CLI agents included by default)
npx playwright-praman init-agents --loop=claude

# Skip CLI agents
npx playwright-praman init-agents --loop=claude --no-cli

# Auto-detect IDE and install
npx playwright-praman init-agents
```

CLI agent definitions are installed by default alongside MCP agents. Pass `--no-cli` to skip them.
Both sets coexist -- you can switch between `/praman-sap-plan` (MCP) and `/praman-cli-plan` (CLI)
at any time.

---

## Next Steps

- [Playwright CLI Setup](./playwright-cli-setup.md) -- detailed CLI configuration
- [Playwright CLI Agents](./playwright-cli-agents.md) -- CLI agent usage and customization
- [Running Your Agent](./running-your-agent.md) -- MCP-based agent workflow
- [Agent & IDE Setup](./agent-setup.md) -- installation for all IDEs
