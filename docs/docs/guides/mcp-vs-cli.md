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

# MCP vs CLI

Praman supports two first-class approaches for AI-driven SAP test automation: the **MCP server**
(Model Context Protocol) and the **Playwright CLI**. Both produce identical output -- gold-standard
`.spec.ts` files using Praman fixtures. This guide helps you choose the right approach for your
workflow, or use both together.

## Summary Comparison

| Dimension              | MCP                                      | CLI                                     |
| ---------------------- | ---------------------------------------- | --------------------------------------- |
| **Token cost**         | Higher (protocol envelope per tool call) | Lower (compact terminal output)         |
| **Latency per action** | ~50-100ms (WebSocket round-trip)         | ~20-50ms (direct process invocation)    |
| **Setup complexity**   | MCP server config + `.mcp.json`          | `playwright-cli` install only           |
| **IDE support**        | VS Code (native), Claude Code, Copilot   | Any terminal-based agent                |
| **Real-time feedback** | Rich (inline screenshots, DOM snapshots) | File-based (snapshots saved to `.yml`)  |
| **Session management** | Tied to MCP server process lifecycle     | Named persistent sessions (`-s=<name>`) |
| **CI/CD suitability**  | Requires running MCP server              | Native (just shell commands)            |
| **Browser debugging**  | Inspector via MCP (`pauseAtEnd`)         | `--debug=cli` + `attach`                |
| **Batch operations**   | Sequential tool calls                    | Scriptable, parallelizable              |
| **Bridge injection**   | `initScript` in MCP config               | `initScript` in `praman-cli.json`       |
| **Output quality**     | Gold-standard `.spec.ts`                 | Gold-standard `.spec.ts`                |

---

## When to Use MCP

MCP is the better choice when you need rich, interactive feedback during test development.

### Ideal Scenarios

- **Interactive exploration** -- stepping through a Fiori app while the agent narrates controls
- **VS Code integration** -- the Playwright MCP extension provides inline screenshots and DOM views
- **Real-time debugging** -- inspecting page state mid-flow without saving snapshots to disk
- **First-time discovery** -- when you do not know the app structure and want visual feedback
- **Demo and training** -- showing stakeholders how the agent explores and generates tests

### MCP Agent Setup

```json
// .mcp.json
{
  "mcpServers": {
    "playwright-test": {
      "command": "npx",
      "args": ["playwright-mcp", "--config", ".playwright/mcp.config.json"]
    }
  }
}
```

### MCP Agent Commands

| Agent         | Claude Code            | Copilot                 |
| ------------- | ---------------------- | ----------------------- |
| Planner       | `/praman-sap-plan`     | `@praman-sap-planner`   |
| Generator     | `/praman-sap-generate` | `@praman-sap-generator` |
| Healer        | `/praman-sap-heal`     | `@praman-sap-healer`    |
| Full pipeline | `/praman-sap-coverage` | --                      |

### MCP Strengths

- **Inline DOM snapshots** returned directly in the agent conversation
- **Screenshot capture** without saving to disk
- **Playwright Inspector** integration via `pauseAtEnd: true`
- **Native VS Code extension** support with sidebar controls

---

## When to Use CLI

CLI is the better choice when token efficiency, CI/CD integration, or terminal-based workflows
matter.

### Ideal Scenarios

- **Token-sensitive workflows** -- large codebases where every token counts
- **CI/CD pipelines** -- automated test generation and healing in GitHub Actions or Jenkins
- **Terminal-based agents** -- any LLM agent with shell access (not just VS Code)
- **Batch generation** -- running the planner across multiple Fiori apps in sequence
- **Large codebases** -- CLI snapshot files avoid bloating the conversation context
- **Persistent sessions** -- keeping a browser open across multiple agent invocations

### CLI Agent Commands

| Agent         | Claude Code            | Copilot                     |
| ------------- | ---------------------- | --------------------------- |
| Planner CLI   | `/praman-cli-plan`     | `@praman-sap-planner-cli`   |
| Generator CLI | `/praman-cli-generate` | `@praman-sap-generator-cli` |
| Healer CLI    | `/praman-cli-heal`     | `@praman-sap-healer-cli`    |
| Full pipeline | `/praman-cli-coverage` | --                          |

### CLI Strengths

- **30-50% fewer tokens** per agent session compared to MCP
- **Scriptable** -- chain commands in shell scripts for batch operations
- **File-based snapshots** -- agent reads only what it needs, not the full DOM
- **Named sessions** -- `playwright-cli -s=sap` persists across commands
- **No server process** -- no MCP server to start, configure, or keep alive
- **CI-native** -- runs anywhere `npx` works, no WebSocket setup

---

## Using Both Together

MCP and CLI are not mutually exclusive. Many teams use both:

| Phase                     | Approach | Reason                                |
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

### Shared State

Both MCP and CLI agents save auth state in the same format:

```bash
# Save from MCP session
# (agent uses browser_evaluate to call storageState)

# Load in CLI session
playwright-cli state-load sap-auth.json

# Or vice versa -- save from CLI, use in MCP
playwright-cli state-save sap-auth.json
# (MCP agent loads via storageState config)
```

---

## Migration: MCP to CLI

Switching from MCP agents to CLI agents requires minimal changes.

### Step 1: Install CLI Agent Definitions

```bash
npx playwright-praman init-agents --loop=claude
# or
npx playwright-praman init-agents --loop=copilot
```

This installs CLI agent files alongside your existing MCP agents. Both coexist.

### Step 2: Map Commands

| MCP Concept                   | CLI Equivalent                                    |
| ----------------------------- | ------------------------------------------------- |
| `browser_navigate(url)`       | `playwright-cli open <url>`                       |
| `browser_click(selector)`     | `playwright-cli click <ref>`                      |
| `browser_fill(selector, val)` | `playwright-cli fill <ref> "<val>"`               |
| `browser_evaluate(js)`        | `playwright-cli run-code "async page => { ... }"` |
| `browser_snapshot()`          | `playwright-cli snapshot --filename=snap.yml`     |
| `browser_take_screenshot()`   | `playwright-cli screenshot --filename=shot.png`   |
| MCP `pauseAtEnd: true`        | `--debug=cli` + `playwright-cli attach`           |

### Step 3: Update Prompts (Optional)

If you have custom prompts referencing MCP agents, duplicate them for CLI:

```bash
# Copy and adapt
cp .claude/prompts/praman-sap-plan.md .claude/prompts/praman-cli-plan.md
# Edit to reference praman-sap-planner-cli agent instead
```

---

## Migration: CLI to MCP

### Step 1: Install MCP Server

```bash
npm install --save-dev @anthropic-ai/playwright-mcp
```

### Step 2: Configure MCP

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "playwright-test": {
      "command": "npx",
      "args": ["playwright-mcp", "--config", ".playwright/mcp.config.json"]
    }
  }
}
```

### Step 3: Install MCP Agent Definitions

```bash
npx playwright-praman init-agents --loop=claude
npx playwright-praman init-agents --loop=copilot
```

The MCP agents are installed alongside CLI agents. Use `/praman-sap-plan` instead of
`/praman-cli-plan`.

---

## Feature Parity Table

Both MCP and CLI support the full Praman agent pipeline. This table shows detailed feature
coverage:

| Feature                    | MCP     | CLI | Notes                                       |
| -------------------------- | ------- | --- | ------------------------------------------- |
| SAP authentication         | Yes     | Yes | Both use `state-save`/`state-load`          |
| FLP navigation             | Yes     | Yes | `browser_navigate` / `playwright-cli open`  |
| UI5 control discovery      | Yes     | Yes | `browser_evaluate` / `run-code`             |
| Bridge readiness check     | Yes     | Yes | Same `window.__praman_bridge.ready` check   |
| Page snapshots             | Yes     | Yes | Inline (MCP) / file-based (CLI)             |
| Screenshots                | Yes     | Yes | Inline (MCP) / file-based (CLI)             |
| Form fill                  | Yes     | Yes | `browser_fill` / `playwright-cli fill`      |
| Click interactions         | Yes     | Yes | `browser_click` / `playwright-cli click`    |
| Value Help workflows       | Yes     | Yes | Same UI5 bridge patterns                    |
| OData binding extraction   | Yes     | Yes | Same `run-code` / `evaluate` patterns       |
| Named sessions             | No      | Yes | CLI-only: `-s=<name>` for persistent state  |
| Inline DOM in conversation | Yes     | No  | MCP returns DOM directly; CLI saves to file |
| Debug attach               | No      | Yes | CLI-only: `--debug=cli` + `attach`          |
| CI/CD without server       | No      | Yes | CLI runs as plain shell commands            |
| Planner agent              | Yes     | Yes | Identical output format                     |
| Generator agent            | Yes     | Yes | Identical output format                     |
| Healer agent               | Yes     | Yes | Identical debugging approach                |
| Full coverage pipeline     | Yes     | Yes | Both support plan + generate + heal cycle   |
| Custom control support     | Yes     | Yes | Same bridge + `run-code` patterns           |
| Fiori Elements support     | Yes     | Yes | Same SmartField / MDC discovery             |
| Multi-app batch            | Limited | Yes | CLI sessions are independently scriptable   |

---

## Recommendations

| Team Profile                                         | Recommendation     |
| ---------------------------------------------------- | ------------------ |
| VS Code users with Playwright extension              | Start with MCP     |
| Terminal-first developers (vim, tmux, CLI agents)    | Start with CLI     |
| CI/CD-heavy teams automating test generation         | CLI for pipelines  |
| Mixed team with different IDEs                       | CLI (universal)    |
| Teams exploring SAP apps for the first time          | MCP for discovery  |
| Token-constrained environments (rate limits, budget) | CLI                |
| Teams that want both interactive and batch workflows | MCP + CLI together |

---

## Next Steps

- [Playwright CLI Agents](./playwright-cli-agents.md) -- detailed CLI agent usage and customization
- [Running Your Agent](./running-your-agent.md) -- MCP-based agent workflow
- [Agent & IDE Setup](./agent-setup.md) -- installation for all IDEs
