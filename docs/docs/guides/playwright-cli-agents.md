---
title: 'Praman CLI Agents for Playwright CLI'
description: 'Praman CLI Agents — three AI agent definitions built on the Playwright CLI for token-efficient SAP UI5 test automation. Claude Code, GitHub Copilot, and Cursor support.'
sidebar_label: 'CLI Agents'
keywords:
  - praman cli agents
  - playwright cli agents
  - sap test automation cli
  - claude code sap testing
  - copilot sap agents
  - token efficient test generation
---

# Praman CLI Agents for Playwright CLI

Praman ships three **Praman CLI Agents** — AI agent definitions built on the **Playwright CLI** —
as a token-efficient alternative to the MCP-based agents. Both MCP and Praman CLI Agents are
first-class, coexisting options. Praman CLI Agents produce identical output (gold-standard
`.spec.ts` files) while consuming significantly fewer tokens per interaction.

## Overview

| Agent             | Claude Code                | GitHub Copilot              | Purpose                            |
| ----------------- | -------------------------- | --------------------------- | ---------------------------------- |
| **Planner CLI**   | `praman-sap-planner-cli`   | `@praman-sap-planner-cli`   | Explore live SAP app, produce plan |
| **Generator CLI** | `praman-sap-generator-cli` | `@praman-sap-generator-cli` | Convert plan to Praman test code   |
| **Healer CLI**    | `praman-sap-healer-cli`    | `@praman-sap-healer-cli`    | Debug and fix failing tests        |

All three agents read the CLI skill file at `skills/praman-sap-cli/SKILL.md` for command reference,
bridge patterns, and discovery snippets.

---

## How Praman CLI Agents Differ from MCP Agents

MCP agents drive the browser through Playwright's MCP server (`browser_click`, `browser_fill`,
`browser_snapshot`). Praman CLI Agents use the same Playwright browser but interact through
terminal commands (`run-code`, `snapshot`, `fill`, `click`).

| Aspect               | MCP Agents                              | Praman CLI Agents                           |
| -------------------- | --------------------------------------- | ------------------------------------------- |
| **Browser control**  | MCP tool calls (`browser_click`, etc.)  | `playwright-cli` commands via `Bash`        |
| **Token cost**       | Higher (MCP protocol overhead per call) | Lower (compact CLI output)                  |
| **Snapshot format**  | Returned inline in MCP response         | Saved to `.yml` file, read with `Read` tool |
| **Session model**    | Tied to MCP server process              | Named persistent sessions (`-s=sap`)        |
| **Bridge injection** | Via `initScript` in MCP config          | Via `initScript` in `praman-cli.json`       |
| **Discovery**        | `browser_evaluate` with JS              | `run-code` with async `page =>` functions   |
| **Output format**    | Identical `.spec.ts` files              | Identical `.spec.ts` files                  |

The key insight: `run-code` replaces `browser_evaluate`, `snapshot --filename` replaces
`browser_snapshot`, and named sessions (`-s=sap`) replace MCP's persistent browser context.

---

## Installation

CLI agent definitions are installed automatically when you run `init` or `init-agents`:

```bash
# Full scaffold (includes CLI agents if Playwright CLI is detected)
npx playwright-praman init

# Install agents only for a specific IDE
npx playwright-praman init-agents --loop=claude
npx playwright-praman init-agents --loop=copilot
npx playwright-praman init-agents --loop=cursor
```

### Installed Files

**Claude Code** (`.claude/agents/`):

```text
.claude/agents/praman-sap-planner-cli.md
.claude/agents/praman-sap-generator-cli.md
.claude/agents/praman-sap-healer-cli.md
```

**GitHub Copilot** (`.github/agents/`):

```text
.github/agents/praman-sap-planner-cli.agent.md
.github/agents/praman-sap-generator-cli.agent.md
.github/agents/praman-sap-healer-cli.agent.md
```

**Cursor** (`.cursor/rules/`):

```text
.cursor/rules/praman-cli.mdc
```

### Skill Files

CLI agents read the praman skill file for command reference, bridge patterns, and discovery snippets. `init` installs skill files to per-IDE locations for auto-discovery:

| IDE            | Skill Location                           | Discovery Mechanism                  |
| -------------- | ---------------------------------------- | ------------------------------------ |
| Claude Code    | `.claude/skills/praman-sap-cli/SKILL.md` | Claude Code auto-discovers skills    |
| GitHub Copilot | `.github/skills/praman-sap-cli/SKILL.md` | Copilot reads `.github/skills/`      |
| Project root   | `skills/praman-sap-cli/SKILL.md`         | Agent MANDATORY PREFLIGHT reads this |

Each skill directory also includes a `references/` subdirectory with additional context:

- `sap-test-generation.md` — gold-standard code template and forbidden patterns
- `screenshot-patterns.md` — dual screenshot pattern (assertions vs error evidence)
- `debug-cli.md` — `--debug=cli` workflow reference
- `trace-cli.md` — `npx playwright trace` usage

---

## Claude Code Usage

### Slash Commands

Claude Code agents are invoked via slash commands. The CLI variants mirror the MCP commands:

| MCP Command            | CLI Command            | Description                      |
| ---------------------- | ---------------------- | -------------------------------- |
| `/praman-sap-plan`     | `/praman-cli-plan`     | Plan tests via CLI discovery     |
| `/praman-sap-generate` | `/praman-cli-generate` | Generate tests via CLI session   |
| `/praman-sap-heal`     | `/praman-cli-heal`     | Heal failing tests via CLI debug |
| `/praman-sap-coverage` | `/praman-cli-coverage` | Full pipeline: plan + gen + heal |

### Example: Planning a Test

```text
/praman-cli-plan
"Explore the Manage Purchase Orders Fiori app and create a test plan
for creating a new purchase order with 2 line items"
```

The planner agent will:

1. Open the SAP system in a persistent CLI session
2. Authenticate using saved state or credentials
3. Navigate to the Fiori app via FLP
4. Discover UI5 controls using `run-code` with `sap.ui.core.ElementRegistry`
5. Capture page snapshots at each step
6. Write a test plan and gold-standard `.spec.ts` file

### Example: Full Coverage Pipeline

```text
/praman-cli-coverage
"Generate complete test coverage for the Material Master (MM01) transaction"
```

This runs the planner, generator, and healer in sequence until all tests pass.

---

## GitHub Copilot Usage

### Agent Mode

In GitHub Copilot Agent Mode, invoke CLI agents by mentioning them:

```text
@praman-sap-planner-cli Explore the Manage Sales Orders app and produce a test plan
```

```text
@praman-sap-generator-cli Generate tests from tests/plans/sales-order-plan.md
```

```text
@praman-sap-healer-cli Fix the failing test in tests/e2e/sales-order.spec.ts
```

### Agent Definitions

The Copilot agent files follow the `.agent.md` convention and declare the `playwright-cli` tool:

```text
.github/agents/praman-sap-planner-cli.agent.md
.github/agents/praman-sap-generator-cli.agent.md
.github/agents/praman-sap-healer-cli.agent.md
```

Each agent reads the skill file from the installed package for command reference and patterns.

---

## Cursor Usage

### Auto-Activation

The `.cursor/rules/praman-cli.mdc` file auto-activates for `.spec.ts` and `.test.ts` files:

```yaml
---
description: Praman CLI patterns for SAP UI5 test automation
globs:
  - '**/*.spec.ts'
  - '**/*.test.ts'
alwaysApply: false
---
```

When editing a Praman test file, Cursor automatically loads CLI bridge patterns, discovery
snippets, and the `run-code` command reference.

### Manual Installation

If Cursor was not detected during `init`, install manually:

```bash
mkdir -p .cursor/rules
cp node_modules/playwright-praman/docs/user-integration/praman-cli.mdc .cursor/rules/
```

---

## Agent Workflow: Plan, Generate, Heal

The three Praman CLI Agents form a pipeline that produces production-ready tests:

```text
┌─────────────────────────────────────────────────────────┐
│  1. PLAN         2. GENERATE       3. HEAL              │
│                                                         │
│  Planner CLI     Generator CLI     Healer CLI           │
│  opens browser   reads plan        runs test with       │
│  discovers UI5   validates live    --debug=cli           │
│  writes plan     writes .spec.ts   fixes failures       │
│                                                         │
│  Output:         Output:           Output:              │
│  test-plan.md    app.spec.ts       app.spec.ts (fixed)  │
└─────────────────────────────────────────────────────────┘
```

### Step 1: Plan

The planner opens a persistent CLI session, authenticates, navigates the SAP app, and discovers
all UI5 controls. It produces a structured test plan with control IDs, types, and bindings.

```bash
# What the planner does internally:
playwright-cli -s=sap open "$SAP_CLOUD_BASE_URL" --persistent
playwright-cli -s=sap state-load sap-auth.json
playwright-cli -s=sap snapshot --filename=flp-snapshot.yml
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(() => {
    const registry = sap.ui.core.ElementRegistry.all();
    return Object.keys(registry).map(id => ({
      id, type: registry[id].getMetadata().getName()
    }));
  });
}"
```

### Step 2: Generate

The generator reads the plan, opens a CLI session to validate each step against the live app,
and produces a `.spec.ts` file using Praman fixtures exclusively.

### Step 3: Heal

The healer runs the generated test with `--debug=cli`, attaches to the debug session, inspects
page state at the failure point, and fixes selectors, timing, or logic issues.

```bash
# What the healer does internally:
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e/app.spec.ts --debug=cli &
playwright-cli attach tw-<session>
playwright-cli snapshot --filename=failure-state.yml
```

---

## CLI Command Reference

These are the core `playwright-cli` commands used by all three Praman CLI Agents:

| Command                                  | Purpose                            |
| ---------------------------------------- | ---------------------------------- |
| `playwright-cli open <url>`              | Open URL in default browser        |
| `playwright-cli -s=<name> open <url>`    | Open with named persistent session |
| `playwright-cli snapshot --filename=<f>` | Save page structure to YAML        |
| `playwright-cli run-code "<code>"`       | Execute async JS with `page`       |
| `playwright-cli fill <ref> "<value>"`    | Fill input by snapshot reference   |
| `playwright-cli click <ref>`             | Click element by snapshot ref      |
| `playwright-cli state-save <file>.json`  | Save browser/auth state            |
| `playwright-cli state-load <file>.json`  | Restore browser/auth state         |
| `playwright-cli close`                   | Close browser                      |

:::warning console.log() is invisible
Inside `run-code`, only `return` produces output visible to the agent. Never use `console.log()`
for discovery results -- always `return` values.
:::

---

## Praman CLI Commands

In addition to `playwright-cli` commands, Praman provides its own CLI commands for bridge and snapshot operations:

### `bridge-script` — Export Bridge Init Script

Exports the Praman bridge injection script for use with `playwright-cli` `initScript` configuration:

```bash
# Print to stdout
npx playwright-praman bridge-script

# Write to file
npx playwright-praman bridge-script --output .playwright/praman-bridge.js
```

Use this to generate the bridge script without manually locating it in `node_modules`:

```json
{
  "browser": {
    "initScript": {
      "path": ".playwright/praman-bridge.js"
    }
  }
}
```

### `snapshot` — SAP UI5 Control Tree Snapshot

Captures a structured snapshot of all UI5 controls from a running Playwright CLI session:

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

### `doctor` — Validate CLI Setup

The `praman doctor` command now includes CLI-specific checks:

```bash
npx playwright-praman doctor
```

| Check                    | What It Validates                                              |
| ------------------------ | -------------------------------------------------------------- |
| `@playwright/cli`        | CLI package is installed in `node_modules`                     |
| `praman-cli.config.json` | CLI config exists at `.playwright/praman-cli.config.json`      |
| `initScript paths`       | All `initScript` paths in the config resolve to existing files |
| `CLI agent files`        | At least one CLI agent definition exists for detected IDEs     |

### `capabilities` — Capability Manifest

Returns a machine-readable manifest of all Praman CLI capabilities. Agents use this as a preflight check to learn what discovery, interaction, and generation operations are available:

```bash
# JSON output (default)
npx playwright-praman capabilities

# Compact agent-friendly format
npx playwright-praman capabilities --agent

# Table format
npx playwright-praman capabilities --format table
```

The planner agent runs `npx playwright-praman capabilities --agent` at the start of every session to discover available operations before opening a browser.

### `verify-spec` — Spec Compliance Check

Validates a generated `.spec.ts` file against gold-standard rules. The generator and healer agents run this after producing or fixing test files:

```bash
npx playwright-praman verify-spec tests/e2e/my-app.spec.ts
```

Checks: correct imports, IDS constant, test.step usage, no banned patterns (`page.waitForTimeout`, `page.click('#__...')`), TSDoc header, and ESLint compliance. Exit code `1` on failure.

---

## Customizing Agent Behavior

### Modify Agent Instructions

Edit the agent definition files directly to customize behavior:

```bash
# Claude Code
vim .claude/agents/praman-sap-planner-cli.md

# GitHub Copilot
vim .github/agents/praman-sap-planner-cli.agent.md
```

Common customizations:

- **Add domain-specific rules**: Append business validation rules or naming conventions
- **Change the model**: Update the `model:` frontmatter field (e.g., `sonnet` to `opus`)
- **Add custom discovery patterns**: Extend the control discovery snippets for custom controls
- **Restrict scope**: Add constraints like "only test controls in the `sap.m` namespace"

### Custom CLI Configuration

Create a `praman-cli.json` to configure the CLI browser session:

```json
{
  "browser": {
    "initScript": ["./node_modules/playwright-praman/dist/browser/praman-bridge-init.js"],
    "viewport": { "width": 1920, "height": 1080 }
  }
}
```

Pass it to the CLI:

```bash
playwright-cli open https://my-sap-system.example.com --config=.playwright/praman-cli.config.json
```

### Browser Bind (Playwright 1.59+)

Enable `PRAMAN_BIND=1` to expose the test browser to CLI agents during test execution:

```bash
PRAMAN_BIND=1 npx playwright test tests/e2e/my-sap-test.spec.ts
```

The test fixture calls `browser.bind('praman-agent')` and logs the endpoint URL. A CLI agent can then attach to the running test browser to inspect live UI state. See [Browser Bind & Screencast](./browser-bind.md) for details.

### Environment Variables

CLI agents use the same environment variables as MCP agents:

```bash
SAP_CLOUD_BASE_URL=https://your-system.s4hana.cloud.sap/
SAP_CLOUD_USERNAME=your-sap-user
SAP_CLOUD_PASSWORD=your-sap-password
```

---

## Troubleshooting

| Problem                        | Solution                                                         |
| ------------------------------ | ---------------------------------------------------------------- |
| Bridge not ready               | Check `initScript` path in `praman-cli.json`                     |
| `run-code` returns nothing     | Use `return` instead of `console.log()`                          |
| Session not found              | Use `-s=<name>` consistently across commands                     |
| Auth state expired             | Re-authenticate and `state-save` a fresh state file              |
| Agent generates raw Playwright | Verify SKILL.md is readable at `skills/praman-sap-cli/SKILL.md`  |
| Snapshot too large             | Always use `--filename` to save to file instead of inline output |

## Next Steps

- [MCP vs CLI](./mcp-vs-cli.md) -- choosing between the two approaches
- [Running Your Agent](./running-your-agent.md) -- the MCP-based agent workflow
- [Agent & IDE Setup](./agent-setup.md) -- full installation and IDE configuration
