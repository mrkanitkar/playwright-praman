---
title: Agent & IDE Setup
---

# Agent & IDE Setup

`npx playwright-praman init` scaffolds your project and, based on the IDEs it detects,
automatically installs AI agent definitions, seed files, and IDE configuration.

## Prerequisites

| Requirement           | Version                                                          |
| --------------------- | ---------------------------------------------------------------- |
| Node.js               | `>=22`                                                           |
| `@playwright/test`    | `>=1.57.0 <2.0.0` (peer dependency)                              |
| `@playwright/cli`     | `>=0.1.3` (peer dependency, auto-installed by `init`)            |
| SAP UI5 / Fiori app   | Any cloud or on-premise instance                                 |
| Environment variables | `SAP_CLOUD_BASE_URL`, `SAP_CLOUD_USERNAME`, `SAP_CLOUD_PASSWORD` |

:::warning Playwright 1.59+ MCP Server
Starting with Playwright 1.59, the MCP server is no longer bundled with Playwright. Install it separately:

```bash
npm install @playwright/mcp
```

CLI agents (`-cli` suffix) do **not** require the MCP server — they use `@playwright/cli` which is built into Playwright.
:::

Install the package — `init` will handle the rest:

```bash
npm install --save-dev playwright-praman
npx playwright-praman init
```

`init` automatically installs `@playwright/test`, `@playwright/cli`, and `dotenv` if they are missing,
then runs `npx playwright install chromium` to ensure the browser binary is present.
You do not need to install those packages manually.

## What `init` Installs

Run in your project root:

```bash
# MCP + CLI agents (default)
npx playwright-praman init

# MCP agents only (opt out of CLI agents)
npx playwright-praman init --no-cli
```

`init` installs both **MCP-based agents** and **Playwright CLI–based agents** for every detected
IDE by default. Both agent sets coexist — you can switch between them at any time.
Pass `--no-cli` to install MCP agents only. See [MCP vs CLI](./mcp-vs-cli.md) for guidance.

### Base scaffold (always)

| Path                   | Description              |
| ---------------------- | ------------------------ |
| `playwright.config.ts` | Playwright configuration |
| `praman.config.ts`     | Praman configuration     |
| `tsconfig.json`        | TypeScript configuration |
| `tests/`               | Test directory           |
| `tests/e2e/`           | E2E test directory       |
| `.auth/`               | Auth state storage       |

### Claude Code (detected via `CLAUDE.md` or `.claude/`)

#### MCP agents (default)

| Path                                     | Description                         |
| ---------------------------------------- | ----------------------------------- |
| `.claude/agents/praman-sap-planner.md`   | SAP UI5 test planner agent          |
| `.claude/agents/praman-sap-generator.md` | Praman-compliant test generator     |
| `.claude/agents/praman-sap-healer.md`    | Failing test fixer                  |
| `.claude/prompts/praman-sap-plan.md`     | Plan slash command                  |
| `.claude/prompts/praman-sap-generate.md` | Generate slash command              |
| `.claude/prompts/praman-sap-heal.md`     | Heal slash command                  |
| `.claude/prompts/praman-sap-coverage.md` | Full coverage pipeline              |
| `tests/seeds/sap-seed.spec.ts`           | Authenticated seed for AI discovery |

After `init`, append the Praman section to your `CLAUDE.md`:

```bash
cat node_modules/playwright-praman/docs/user-integration/claude-md-appendable.md >> CLAUDE.md
```

#### CLI agents (installed by default)

Installed by default with `init` or `init-agents --loop=claude`. Pass `--no-cli` to skip:

| Path                                         | Description                           |
| -------------------------------------------- | ------------------------------------- |
| `.claude/agents/praman-sap-planner-cli.md`   | SAP UI5 test planner — Playwright CLI |
| `.claude/agents/praman-sap-generator-cli.md` | Test generator — Playwright CLI       |
| `.claude/agents/praman-sap-healer-cli.md`    | Failing test fixer — Playwright CLI   |
| `.claude/prompts/praman-cli-plan.md`         | `/praman-cli-plan` slash command      |
| `.claude/prompts/praman-cli-generate.md`     | `/praman-cli-generate` slash command  |
| `.claude/prompts/praman-cli-heal.md`         | `/praman-cli-heal` slash command      |
| `.claude/prompts/praman-cli-coverage.md`     | Full coverage pipeline (CLI)          |

### VS Code (detected via `.vscode/` directory or `TERM_PROGRAM=vscode`)

| Path                           | Description                           |
| ------------------------------ | ------------------------------------- |
| `.vscode/settings.json`        | Playwright + TypeScript settings      |
| `.vscode/extensions.json`      | Recommended extensions                |
| `.vscode/praman.code-snippets` | `praman-test`, `praman-step` snippets |

### Cursor (detected via `.cursor/` or `.cursorrc`)

#### MCP agents (default)

| Path                       | Description                |
| -------------------------- | -------------------------- |
| `.cursor/rules/praman.mdc` | Praman rules for Cursor AI |

Append the full rules to your Cursor config:

```bash
cat node_modules/playwright-praman/docs/user-integration/cursor-rules-appendable.mdc >> .cursorrules
```

#### CLI agents (installed by default)

Installed by default with `init` or `init-agents --loop=cursor`. Pass `--no-cli` to skip:

| Path                           | Description                    |
| ------------------------------ | ------------------------------ |
| `.cursor/rules/praman-cli.mdc` | Praman CLI rules for Cursor AI |

### Jules (detected via `.jules/`)

| Path                     | Description                         |
| ------------------------ | ----------------------------------- |
| `.jules/praman-setup.md` | Praman setup instructions for Jules |

### GitHub Copilot (detected via `.github/copilot-instructions.md` or `.github/agents/`)

#### MCP agents (default)

| Path                                           | Description                        |
| ---------------------------------------------- | ---------------------------------- |
| `.github/agents/praman-sap-planner.agent.md`   | SAP UI5 test planner Copilot agent |
| `.github/agents/praman-sap-generator.agent.md` | Praman-compliant test generator    |
| `.github/agents/praman-sap-healer.agent.md`    | Failing test fixer                 |

After `init`, append the Praman section to your `.github/copilot-instructions.md`:

```bash
cat node_modules/playwright-praman/docs/user-integration/copilot-instructions-appendable.md >> .github/copilot-instructions.md
```

#### CLI agents (installed by default)

Installed by default with `init` or `init-agents --loop=copilot`. Pass `--no-cli` to skip:

| Path                                               | Description                           |
| -------------------------------------------------- | ------------------------------------- |
| `.github/agents/praman-sap-planner-cli.agent.md`   | SAP UI5 test planner — Playwright CLI |
| `.github/agents/praman-sap-generator-cli.agent.md` | Test generator — Playwright CLI       |
| `.github/agents/praman-sap-healer-cli.agent.md`    | Failing test fixer — Playwright CLI   |

## Install Agents Only (`init-agents`)

If you already have a Praman project and just need to install or update agent definitions
for a specific IDE, use `init-agents` instead of the full `init`:

```bash
# MCP + CLI agents (default) for a specific IDE
npx playwright-praman init-agents --loop=vscode
npx playwright-praman init-agents --loop=claude
npx playwright-praman init-agents --loop=opencode
npx playwright-praman init-agents --loop=cursor
npx playwright-praman init-agents --loop=jules
npx playwright-praman init-agents --loop=copilot

# MCP agents only — skip CLI agents
npx playwright-praman init-agents --loop=claude  --no-cli
npx playwright-praman init-agents --loop=copilot --no-cli
npx playwright-praman init-agents --loop=cursor  --no-cli

# Auto-detect all IDEs (includes CLI agents by default)
npx playwright-praman init-agents
```

This mirrors Playwright's own `npx playwright init-agents --loop=<ide>` command.

:::info VS Code + GitHub Copilot CLI agents
VS Code Copilot reads agent files from `.github/agents/`. Use `--loop=copilot` — not
`--loop=vscode` — to install CLI agents there. `--loop=vscode` only installs IDE settings
(snippets, extensions, `settings.json`) and has no CLI agent files.
:::

| Flag             | Description                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `--loop=<ide>`   | Target IDE: `vscode`, `claude`, `cursor`, `jules`, `opencode`, `copilot`, or `detect` (auto) |
| `--no-cli`       | Skip Playwright CLI–based agents (MCP agents only)                                           |
| `--force`        | Overwrite existing agent files                                                               |
| `--target <dir>` | Target directory (default: current directory)                                                |

**What it does:**

- Installs only agent definitions, seed files, skills, and prompts for the specified IDE
- Skips environment validation, npm install, and config scaffolding
- Safe to re-run — skips existing files unless `--force` is used
- Auto-detects IDEs when no `--loop` is specified

**When to use `init-agents` instead of `init`:**

- You switched IDEs (e.g., started using Claude Code after initial setup)
- You want to add agents for a second IDE without re-scaffolding
- After a Praman upgrade, to get updated agent definitions
- In CI/CD pipelines that only need agent files

## Re-running on an Existing Project

`init` can be run in an existing project. When the project directory already exists,
`init` skips the base scaffold and only installs IDE files that are missing:

```bash
# Existing project — only installs missing agent/IDE files
npx playwright-praman init

# Overwrite all files (including existing agents and configs)
npx playwright-praman init --force
```

## IDE Detection Logic

`init` detects IDEs in this order. Multiple IDEs can be active simultaneously:

| IDE                | Detection Method                                                        |
| ------------------ | ----------------------------------------------------------------------- |
| **VS Code**        | `.vscode/` directory exists, OR `TERM_PROGRAM=vscode` env var           |
| **Claude Code**    | `CLAUDE.md` file exists in project root                                 |
| **Cursor**         | `.cursor/` directory or `.cursorrc` file exists                         |
| **Jules**          | `.jules/` directory exists                                              |
| **OpenCode**       | `.opencode/` directory exists                                           |
| **GitHub Copilot** | `.github/copilot-instructions.md` or `.github/agents/` directory exists |

## Manual Installation

If `init` was run before IDE tools were set up, install files manually:

### Claude Code

```bash
# MCP agents (default)
mkdir -p .claude/agents .claude/prompts tests/seeds

cp node_modules/playwright-praman/agents/claude/praman-sap-planner.md .claude/agents/
cp node_modules/playwright-praman/agents/claude/praman-sap-generator.md .claude/agents/
cp node_modules/playwright-praman/agents/claude/praman-sap-healer.md .claude/agents/

cp node_modules/playwright-praman/agents/claude/prompts/praman-sap-plan.md .claude/prompts/
cp node_modules/playwright-praman/agents/claude/prompts/praman-sap-generate.md .claude/prompts/
cp node_modules/playwright-praman/agents/claude/prompts/praman-sap-heal.md .claude/prompts/
cp node_modules/playwright-praman/agents/claude/prompts/praman-sap-coverage.md .claude/prompts/

cp node_modules/playwright-praman/seeds/sap-seed.spec.ts tests/seeds/

# Append to CLAUDE.md
cat node_modules/playwright-praman/docs/user-integration/claude-md-appendable.md >> CLAUDE.md

# CLI agents (installed by default — pass --no-cli to skip)
cp node_modules/playwright-praman/agents/claude/praman-sap-planner-cli.md .claude/agents/
cp node_modules/playwright-praman/agents/claude/praman-sap-generator-cli.md .claude/agents/
cp node_modules/playwright-praman/agents/claude/praman-sap-healer-cli.md .claude/agents/

cp node_modules/playwright-praman/agents/claude/prompts/praman-cli-plan.md .claude/prompts/
cp node_modules/playwright-praman/agents/claude/prompts/praman-cli-generate.md .claude/prompts/
cp node_modules/playwright-praman/agents/claude/prompts/praman-cli-heal.md .claude/prompts/
cp node_modules/playwright-praman/agents/claude/prompts/praman-cli-coverage.md .claude/prompts/
```

### VS Code

```bash
mkdir -p .vscode

# Install recommended settings and extensions
# (or run: npx playwright-praman init --force)
```

### Cursor

```bash
# MCP agents (default)
mkdir -p .cursor/rules
cp node_modules/playwright-praman/docs/user-integration/cursor-rules-appendable.mdc .cursor/rules/praman.mdc
cat node_modules/playwright-praman/docs/user-integration/cursor-rules-appendable.mdc >> .cursorrules

# CLI agents (installed by default — pass --no-cli to skip)
cp node_modules/playwright-praman/docs/user-integration/praman-cli.mdc .cursor/rules/praman-cli.mdc
```

### GitHub Copilot

```bash
# MCP agents (default)
mkdir -p .github/agents

cp node_modules/playwright-praman/agents/copilot/praman-sap-planner.agent.md .github/agents/
cp node_modules/playwright-praman/agents/copilot/praman-sap-generator.agent.md .github/agents/
cp node_modules/playwright-praman/agents/copilot/praman-sap-healer.agent.md .github/agents/

# Append to copilot-instructions.md
cat node_modules/playwright-praman/docs/user-integration/copilot-instructions-appendable.md >> .github/copilot-instructions.md

# CLI agents (installed by default — pass --no-cli to skip)
cp node_modules/playwright-praman/agents/copilot/praman-sap-planner-cli.agent.md .github/agents/
cp node_modules/playwright-praman/agents/copilot/praman-sap-generator-cli.agent.md .github/agents/
cp node_modules/playwright-praman/agents/copilot/praman-sap-healer-cli.agent.md .github/agents/
```

## Skill Files

### MCP Skill Files

MCP skill files are **not copied** into your project. All Praman agents read them directly from the installed package:

```text
node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md
```

This ensures agents always use the current installed version without any stale copies.

### CLI Skill Files

CLI skill files **are copied** into your project by `init` (or `init-agents`). This enables per-IDE auto-discovery:

| Location                                 | Purpose                              |
| ---------------------------------------- | ------------------------------------ |
| `skills/praman-sap-cli/SKILL.md`         | Project root — agent PREFLIGHT reads |
| `.claude/skills/praman-sap-cli/SKILL.md` | Claude Code auto-discovery           |
| `.github/skills/praman-sap-cli/SKILL.md` | GitHub Copilot auto-discovery        |

Each skill directory includes a `references/` subdirectory with:

- `sap-test-generation.md` — gold-standard test template
- `screenshot-patterns.md` — dual screenshot pattern
- `debug-cli.md` — `--debug=cli` workflow
- `trace-cli.md` — trace viewer usage

Pass `--no-cli` to skip CLI skill installation.

## The Seed File

`tests/seeds/sap-seed.spec.ts` is the entry point for AI agent SAP discovery.
It uses **raw Playwright only** (no Praman fixtures) to authenticate against a live SAP system
and keep the browser open for the MCP server.

Required environment variables:

```bash
SAP_CLOUD_BASE_URL=https://your-system.s4hana.cloud.sap/
SAP_CLOUD_USERNAME=your-user
SAP_CLOUD_PASSWORD=your-password
```

Run the seed to open an authenticated browser session:

```bash
npx playwright test tests/seeds/sap-seed.spec.ts --project=agent-seed-test
```

The seed waits up to 20 minutes, polls for UI5 readiness, then keeps the browser open
via `pauseAtEnd: true` for MCP-connected agents to use.

## Available Agents

:::info Naming Convention

- Files **with** a `-cli` suffix (e.g., `praman-sap-planner-cli`) are **CLI agents** — they use `@playwright/cli` and do **not** need the MCP server.
- Files **without** a `-cli` suffix (e.g., `praman-sap-planner`) are **MCP agents** — they require `@playwright/mcp` (install separately on Playwright 1.59+).
  :::

### Claude Code — MCP agents

After setup, `.claude/agents/` contains these MCP-based Praman SAP agents:

| Agent                  | Slash Command          | Purpose                                             |
| ---------------------- | ---------------------- | --------------------------------------------------- |
| `praman-sap-planner`   | `/praman-sap-plan`     | Explore live SAP app, produce test plan + seed spec |
| `praman-sap-generator` | `/praman-sap-generate` | Generate 100% Praman-compliant tests from plan      |
| `praman-sap-healer`    | `/praman-sap-heal`     | Fix failing tests, enforce compliance               |

```text
/praman-sap-coverage
"Run full test coverage for the Purchase Order Fiori app"
```

### Claude Code — CLI agents

Installed by default. Use these when token efficiency matters or the MCP server is unavailable:

| Agent                      | Slash Command          | Purpose                                        |
| -------------------------- | ---------------------- | ---------------------------------------------- |
| `praman-sap-planner-cli`   | `/praman-cli-plan`     | Explore live SAP app via CLI — token-efficient |
| `praman-sap-generator-cli` | `/praman-cli-generate` | Generate Praman tests from plan via CLI        |
| `praman-sap-healer-cli`    | `/praman-cli-heal`     | Fix failing tests via CLI                      |

```text
/praman-cli-coverage
"Run full test coverage for the Purchase Order Fiori app"
```

### GitHub Copilot — MCP agents

After setup, `.github/agents/` contains these MCP-based Copilot coding agents:

| Agent file                      | Copilot Mention         | Purpose                                             |
| ------------------------------- | ----------------------- | --------------------------------------------------- |
| `praman-sap-planner.agent.md`   | `@praman-sap-planner`   | Explore live SAP app, produce test plan + seed spec |
| `praman-sap-generator.agent.md` | `@praman-sap-generator` | Generate 100% Praman-compliant tests from plan      |
| `praman-sap-healer.agent.md`    | `@praman-sap-healer`    | Fix failing tests, enforce compliance               |

### GitHub Copilot — CLI agents

Installed by default. Copilot coding agents that invoke `npx @playwright/cli` commands:

| Agent file                          | Copilot Mention             | Purpose                                        |
| ----------------------------------- | --------------------------- | ---------------------------------------------- |
| `praman-sap-planner-cli.agent.md`   | `@praman-sap-planner-cli`   | Explore live SAP app via CLI — token-efficient |
| `praman-sap-generator-cli.agent.md` | `@praman-sap-generator-cli` | Generate Praman tests from plan via CLI        |
| `praman-sap-healer-cli.agent.md`    | `@praman-sap-healer-cli`    | Fix failing tests via CLI                      |

## LLM-Friendly Documentation (llms.txt)

Praman publishes its documentation in the [llmstxt.org](https://llmstxt.org) standard. AI agents can fetch these files directly for context:

| URL                      | Content                                  | Use Case                         |
| ------------------------ | ---------------------------------------- | -------------------------------- |
| `/llms.txt`              | Link index with descriptions             | Discovery — find the right doc   |
| `/llms-full.txt`         | All 63 docs in one file                  | Full context for general agents  |
| `/llms-quickstart.txt`   | Setup, fixtures, selectors, matchers     | Onboarding and first test        |
| `/llms-sap-testing.txt`  | Auth, FLP, OData, FE, cookbook, examples | SAP test planning and generation |
| `/llms-migration.txt`    | Playwright, wdi5, Tosca migration        | Migration assistants             |
| `/llms-architecture.txt` | Architecture, bridge, proxy, ADRs        | Architecture decisions           |

### Pointing agents to llms.txt

Add to your agent instructions (CLAUDE.md, `.cursorrules`, copilot-instructions.md):

```markdown
## Praman Documentation

For Praman API and usage, fetch the appropriate llms.txt file:

- General: https://praman.dev/llms-full.txt
- SAP testing: https://praman.dev/llms-sap-testing.txt
- Quick start: https://praman.dev/llms-quickstart.txt
```

Agents with web access (Claude Code `WebFetch`, Copilot `@fetch`) can retrieve these at runtime. Agents without web access can use the locally built files from `docs/build/`.

## IDE Configuration

The sections below cover manual IDE configuration. If `init` already scaffolded your
IDE files, use these as a reference for customization.

### VS Code Extensions

| Extension                | ID                         | Purpose                                        |
| ------------------------ | -------------------------- | ---------------------------------------------- |
| ESLint                   | `dbaeumer.vscode-eslint`   | Lint TypeScript with Praman's 11-plugin config |
| Playwright Test          | `ms-playwright.playwright` | Run/debug tests, view traces                   |
| TypeScript               | Built-in                   | TypeScript language support                    |
| Vitest                   | `vitest.explorer`          | Run unit tests from sidebar                    |
| Pretty TypeScript Errors | `yoavbls.pretty-ts-errors` | Readable type error messages                   |
| Error Lens               | `usernamehw.errorlens`     | Inline error/warning display                   |
| GitLens                  | `eamodio.gitlens`          | Git blame, history, compare                    |

Install via CLI:

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension ms-playwright.playwright
code --install-extension vitest.explorer
code --install-extension yoavbls.pretty-ts-errors
code --install-extension usernamehw.errorlens
```

### VS Code Settings

Create or update `.vscode/settings.json` in your test project:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "editor.defaultFormatter": "dbaeumer.vscode-eslint",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "eslint.validate": ["typescript"],
  "testing.defaultGutterClickAction": "debug",
  "playwright.reuseBrowser": true,
  "playwright.showTrace": true
}
```

### Debugging Praman Tests

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Current Test File",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "${relativeFile}", "--headed", "--workers=1"],
      "console": "integratedTerminal",
      "env": {
        "PWDEBUG": "1",
        "SAP_BASE_URL": "https://your-sap-system.example.com",
        "SAP_USERNAME": "your-user",
        "SAP_PASSWORD": "your-password"
      }
    },
    {
      "name": "Debug Specific Test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/playwright",
      "args": ["test", "${relativeFile}", "--headed", "--workers=1", "-g", "${selectedText}"],
      "console": "integratedTerminal",
      "env": {
        "PWDEBUG": "1"
      }
    },
    {
      "name": "Debug Unit Tests (Vitest)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["run", "${relativeFile}"],
      "console": "integratedTerminal"
    }
  ]
}
```

### Playwright Inspector

Set `PWDEBUG=1` to launch the Playwright Inspector:

```bash
PWDEBUG=1 npx playwright test tests/my-test.spec.ts --headed --workers=1
```

The Inspector lets you:

- Step through test actions one at a time
- Inspect the UI5 control tree in the browser
- View selectors and their matches
- Record new actions

### Playwright Trace Viewer

After a test run, open the trace:

```bash
npx playwright show-trace test-results/my-test/trace.zip
```

The Trace Viewer shows:

- Action timeline with screenshots
- Network requests (OData calls)
- Console logs
- DOM snapshots at each step

### Environment Variables

Create a `.env` file in your project root (add to `.gitignore`):

```bash
# .env
SAP_BASE_URL=https://your-sap-system.example.com
SAP_USERNAME=test-user
SAP_PASSWORD=test-password
SAP_CLIENT=100
SAP_LANGUAGE=EN
```

Load `.env` in your Playwright config:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { config } from 'dotenv';

config(); // Load .env file

export default defineConfig({
  use: {
    baseURL: process.env.SAP_BASE_URL,
  },
});
```

### Code Snippets

Add Praman-specific code snippets to `.vscode/praman.code-snippets`:

```json
{
  "Praman Test": {
    "prefix": "ptest",
    "scope": "typescript",
    "body": [
      "import { test, expect } from 'playwright-praman';",
      "",
      "test.describe('$1', () => {",
      "  test('$2', async ({ ui5, ui5Navigation }) => {",
      "    await test.step('$3', async () => {",
      "      $0",
      "    });",
      "  });",
      "});"
    ],
    "description": "Praman test with fixtures"
  },
  "Praman Step": {
    "prefix": "pstep",
    "scope": "typescript",
    "body": ["await test.step('$1', async () => {", "  $0", "});"],
    "description": "Praman test step"
  },
  "UI5 Control Selector": {
    "prefix": "pcontrol",
    "scope": "typescript",
    "body": [
      "const ${1:control} = await ui5.control({",
      "  controlType: '${2:sap.m.Button}',",
      "  ${3:properties: { text: '$4' \\}},",
      "});"
    ],
    "description": "UI5 control selector"
  },
  "UI5 Click": {
    "prefix": "pclick",
    "scope": "typescript",
    "body": [
      "await ui5.click({",
      "  controlType: '${1:sap.m.Button}',",
      "  properties: { text: '$2' },",
      "});"
    ],
    "description": "UI5 click action"
  },
  "UI5 Fill": {
    "prefix": "pfill",
    "scope": "typescript",
    "body": [
      "await ui5.fill(",
      "  { controlType: '${1:sap.m.Input}', id: /${2:fieldId}/ },",
      "  '${3:value}'",
      ");"
    ],
    "description": "UI5 fill input"
  }
}
```

### JetBrains IDEs (WebStorm/IntelliJ)

1. Go to **Settings > Plugins > Marketplace**, search for "Playwright" and install
2. Go to **Run > Edit Configurations**, add a **Node.js** configuration:
   - **JavaScript file**: `node_modules/.bin/playwright`
   - **Application parameters**: `test tests/my-test.spec.ts --headed --workers=1`
   - **Environment variables**: `PWDEBUG=1;SAP_BASE_URL=...`
3. JetBrains IDEs resolve `tsconfig.json` paths automatically — no additional configuration needed

### IDE Troubleshooting

| Problem                                | Solution                                                          |
| -------------------------------------- | ----------------------------------------------------------------- |
| ESLint not finding config              | Set `eslint.workingDirectories` in VS Code settings               |
| Path aliases not resolving             | Verify `tsconfig.json` is in the project root                     |
| Playwright extension not finding tests | Set `playwright.testMatch` pattern in settings                    |
| Debugger not hitting breakpoints       | Use `--workers=1` to disable parallelism                          |
| TypeScript errors in node_modules      | Add `"skipLibCheck": true` to tsconfig                            |
| Slow IntelliSense                      | Exclude `node_modules`, `dist`, `test-results` in `tsconfig.json` |

## CLI Agents (Alternative to MCP)

The Playwright CLI is a token-efficient alternative to the MCP server for AI agent workflows.
Instead of running a persistent MCP server, agents invoke `npx @playwright/cli` commands
directly. Both approaches are first-class and can coexist in the same project.

CLI agents are installed by default. Opt out with `--no-cli`:

```bash
# During initial setup (CLI agents included by default)
npx playwright-praman init

# Opt out of CLI agents
npx playwright-praman init --no-cli

# Or later, per IDE (CLI agents included by default)
npx playwright-praman init-agents --loop=claude
npx playwright-praman init-agents --loop=copilot
npx playwright-praman init-agents --loop=cursor

# Auto-detect all IDEs
npx playwright-praman init-agents

# Opt out of CLI agents per IDE
npx playwright-praman init-agents --loop=claude  --no-cli
npx playwright-praman init-agents --loop=copilot --no-cli
npx playwright-praman init-agents --loop=cursor  --no-cli
```

CLI agents use commands (`open`, `snapshot`, `run-code`, `state-save`) instead of MCP tool
calls, using 30–50% fewer tokens per agent session.

For full setup instructions, see the [Playwright CLI Setup Guide](./playwright-cli-setup.md).
For a detailed comparison, see [MCP vs CLI](./mcp-vs-cli.md).

## Validating Your Setup

Run `praman doctor` to verify your complete setup including CLI-specific checks:

```bash
npx playwright-praman doctor
```

The doctor command validates 12 checks across three categories:

| Category            | Checks                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Core**            | `@playwright/test` installed, version >= 1.57.0, env vars configured                   |
| **Configuration**   | `playwright.config.ts`, `praman.config.ts` exist                                       |
| **CLI (if active)** | `@playwright/cli` installed, `praman-cli.config.json`, `initScript` paths, agent files |

:::tip Fix issues automatically
Most `doctor` failures include a `suggestion` field with the exact command to run.
:::

---

## Cross-Platform Notes

- All file operations use `node:path` — no hardcoded `/` or `\` separators
- Works on Windows 10/11, macOS, and Linux
- `.auth/` uses `.gitignore` patterns — add `.auth/` to your `.gitignore`
- The seed file uses `SAP_CLOUD_BASE_URL` (not `SAP_BASE_URL`) — check your `.env`
