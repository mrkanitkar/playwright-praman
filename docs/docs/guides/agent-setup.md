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
| SAP UI5 / Fiori app   | Any cloud or on-premise instance                                 |
| Environment variables | `SAP_CLOUD_BASE_URL`, `SAP_CLOUD_USERNAME`, `SAP_CLOUD_PASSWORD` |

Install the package and browser binaries:

```bash
npm install --save-dev playwright-praman @playwright/test
npx playwright install
```

Praman does **not** auto-install Playwright browsers. Run `npx playwright install` once after installation.

## What `init` Installs

Run in your project root:

```bash
npx playwright-praman init
```

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

### VS Code (detected via `.vscode/` directory or `TERM_PROGRAM=vscode`)

| Path                           | Description                           |
| ------------------------------ | ------------------------------------- |
| `.vscode/settings.json`        | Playwright + TypeScript settings      |
| `.vscode/extensions.json`      | Recommended extensions                |
| `.vscode/praman.code-snippets` | `praman-test`, `praman-step` snippets |

### Cursor (detected via `.cursor/` or `.cursorrc`)

| Path                       | Description                |
| -------------------------- | -------------------------- |
| `.cursor/rules/praman.mdc` | Praman rules for Cursor AI |

Append the full rules to your Cursor config:

```bash
cat node_modules/playwright-praman/docs/user-integration/cursor-rules-appendable.mdc >> .cursorrules
```

### Jules (detected via `.jules/`)

| Path                     | Description                         |
| ------------------------ | ----------------------------------- |
| `.jules/praman-setup.md` | Praman setup instructions for Jules |

### GitHub Copilot (detected via `.github/copilot-instructions.md` or `.github/agents/`)

| Path                                           | Description                        |
| ---------------------------------------------- | ---------------------------------- |
| `.github/agents/praman-sap-planner.agent.md`   | SAP UI5 test planner Copilot agent |
| `.github/agents/praman-sap-generator.agent.md` | Praman-compliant test generator    |
| `.github/agents/praman-sap-healer.agent.md`    | Failing test fixer                 |

After `init`, append the Praman section to your `.github/copilot-instructions.md`:

```bash
cat node_modules/playwright-praman/docs/user-integration/copilot-instructions-appendable.md >> .github/copilot-instructions.md
```

## Install Agents Only (`init-agents`)

If you already have a Praman project and just need to install or update agent definitions
for a specific IDE, use `init-agents` instead of the full `init`:

```bash
npx playwright-praman init-agents --loop=vscode
npx playwright-praman init-agents --loop=claude
npx playwright-praman init-agents --loop=opencode
npx playwright-praman init-agents --loop=cursor
npx playwright-praman init-agents --loop=jules
npx playwright-praman init-agents --loop=copilot
```

This mirrors Playwright's own `npx playwright init-agents --loop=<ide>` command.

| Flag             | Description                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `--loop=<ide>`   | Target IDE: `vscode`, `claude`, `cursor`, `jules`, `opencode`, `copilot`, or `detect` (auto) |
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
# Install agents
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
```

### VS Code

```bash
mkdir -p .vscode

# Install recommended settings and extensions
# (or run: npx playwright-praman init --force)
```

### Cursor

```bash
mkdir -p .cursor/rules
cp node_modules/playwright-praman/docs/user-integration/cursor-rules-appendable.mdc .cursor/rules/praman.mdc
cat node_modules/playwright-praman/docs/user-integration/cursor-rules-appendable.mdc >> .cursorrules
```

### GitHub Copilot

```bash
mkdir -p .github/agents

cp node_modules/playwright-praman/agents/copilot/praman-sap-planner.agent.md .github/agents/
cp node_modules/playwright-praman/agents/copilot/praman-sap-generator.agent.md .github/agents/
cp node_modules/playwright-praman/agents/copilot/praman-sap-healer.agent.md .github/agents/

# Append to copilot-instructions.md
cat node_modules/playwright-praman/docs/user-integration/copilot-instructions-appendable.md >> .github/copilot-instructions.md
```

## Skill Files

The skill files (SKILL.md and supporting references) are **not copied** into your project.
All Praman agents read them directly from the installed package:

```text
node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md
node_modules/playwright-praman/skills/playwright-praman-sap-testing/ai-quick-reference.md
```

This ensures agents always use the current installed version without any stale copies.

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

## Available Agents (Claude Code)

After setup, `.claude/agents/` contains 3 Praman SAP agents:

| Agent                  | Slash Command          | Purpose                                             |
| ---------------------- | ---------------------- | --------------------------------------------------- |
| `praman-sap-planner`   | `/praman-sap-plan`     | Explore live SAP app, produce test plan + seed spec |
| `praman-sap-generator` | `/praman-sap-generate` | Generate 100% Praman-compliant tests from plan      |
| `praman-sap-healer`    | `/praman-sap-heal`     | Fix failing tests, enforce compliance               |

Use the coverage prompt to run the full pipeline:

```text
/praman-sap-coverage
"Run full test coverage for the Purchase Order Fiori app"
```

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

## Cross-Platform Notes

- All file operations use `node:path` — no hardcoded `/` or `\` separators
- Works on Windows 10/11, macOS, and Linux
- `.auth/` uses `.gitignore` patterns — add `.auth/` to your `.gitignore`
- The seed file uses `SAP_CLOUD_BASE_URL` (not `SAP_BASE_URL`) — check your `.env`
