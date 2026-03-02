---
sidebar_position: 3
title: Agent & IDE Setup
---

# Agent & IDE Setup

`npx playwright-praman init` scaffolds your project and, based on the IDEs it detects,
automatically installs AI agent definitions, seed files, and IDE configuration.

## Prerequisites

| Requirement           | Version                                                          |
| --------------------- | ---------------------------------------------------------------- |
| Node.js               | `>=20`                                                           |
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
npx playwright init-agents --loop=vscode
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

| URL                                        | Content                                  | Use Case                         |
| ------------------------------------------ | ---------------------------------------- | -------------------------------- |
| `/playwright-praman/llms.txt`              | Link index with descriptions             | Discovery — find the right doc   |
| `/playwright-praman/llms-full.txt`         | All 63 docs in one file                  | Full context for general agents  |
| `/playwright-praman/llms-quickstart.txt`   | Setup, fixtures, selectors, matchers     | Onboarding and first test        |
| `/playwright-praman/llms-sap-testing.txt`  | Auth, FLP, OData, FE, cookbook, examples | SAP test planning and generation |
| `/playwright-praman/llms-migration.txt`    | Playwright, wdi5, Tosca migration        | Migration assistants             |
| `/playwright-praman/llms-architecture.txt` | Architecture, bridge, proxy, ADRs        | Architecture decisions           |

### Pointing agents to llms.txt

Add to your agent instructions (CLAUDE.md, `.cursorrules`, copilot-instructions.md):

```markdown
## Praman Documentation

For Praman API and usage, fetch the appropriate llms.txt file:

- General: https://mrkanitkar.github.io/playwright-praman/llms-full.txt
- SAP testing: https://mrkanitkar.github.io/playwright-praman/llms-sap-testing.txt
- Quick start: https://mrkanitkar.github.io/playwright-praman/llms-quickstart.txt
```

Agents with web access (Claude Code `WebFetch`, Copilot `@fetch`) can retrieve these at runtime. Agents without web access can use the locally built files from `docs/build/`.

## Cross-Platform Notes

- All file operations use `node:path` — no hardcoded `/` or `\` separators
- Works on Windows 10/11, macOS, and Linux
- `.auth/` uses `.gitignore` patterns — add `.auth/` to your `.gitignore`
- The seed file uses `SAP_CLOUD_BASE_URL` (not `SAP_BASE_URL`) — check your `.env`
