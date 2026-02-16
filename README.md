# playwright-praman

> AI-First SAP UI5 Test Automation Platform for Playwright

> [!NOTE]
> **Coming soon for actual use.** The package scaffold is published; full functionality is under active development.

[![CI](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/playwright-praman)](https://www.npmjs.com/package/playwright-praman)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

| | Windows | macOS | Linux |
|---|---|---|---|
| Node 20 | ✅ | ✅ | ✅ |
| Node 22 | ✅ | ✅ | ✅ |
| Node 24 | ✅ | ✅ | ✅ |

## Features

- **5-layer architecture**: Core → Bridge → Proxy → Fixtures → AI
- **Dual ESM + CJS** build — works in all Node.js environments
- **Typed UI5 control proxies** — full IntelliSense for SAP controls
- **AI-powered test generation** — intent-based testing with LLM support
- **Cross-platform** — Windows 10/11, macOS, Linux, Docker

## Install

```bash
npm install playwright-praman
```

## Quick Start

```typescript
import { test, expect } from 'playwright-praman';

test('SAP Fiori app navigation', async ({ page, ui5 }) => {
  await test.step('Open tile', async () => {
    const tile = await ui5.control({
      controlType: 'sap.m.GenericTile',
      properties: { header: 'My App' },
    });
    await tile.press();
  });
});
```

## Sub-path Exports

| Export | Description |
|---|---|
| `playwright-praman` | Core fixtures, proxy, bridge |
| `playwright-praman/ai` | AI/LLM service, agentic handler |
| `playwright-praman/intents` | Intent wrappers, registries |
| `playwright-praman/vocabulary` | SAP vocabulary, control mappings |
| `playwright-praman/fe` | SAP Fiori Elements helpers |
| `playwright-praman/reporters` | Custom Playwright reporters |

## Build

```bash
npm run build          # tsup → dist/ (ESM + CJS)
npm run check:exports  # attw export validation
npm run test:unit      # Vitest (hermetic)
npm run ci             # lint + typecheck + test + build
```

## IDE Support

| IDE / Agent | Config |
|---|---|
| VS Code + Copilot | `.github/copilot-instructions.md`, `.vscode/` |
| JetBrains / IntelliJ | `.idea/runConfigurations/`, `.idea/codeStyles/` |
| Cursor | `.cursor/rules/praman.mdc` |
| Google Antigravity | `.antigravity/rules.md` |

## AI Agent Support

| Agent | Config |
|---|---|
| GitHub Copilot | `.github/copilot-instructions.md` |
| Copilot Coding Agents | `.github/agents/` |
| Claude Code | `CLAUDE.md` |
| OpenAI Codex / Jules | `AGENTS.md`, `.jules/setup.md` |
| Cursor | `.cursor/rules/` |

## Azure Playwright (Optional)

For scalable cloud-based test execution, see [Azure Playwright Workspaces](https://github.com/Azure/playwright-workspaces).

```bash
npm install @azure/playwright
```

## Docker

Use the official Playwright image:

```bash
docker run --rm -v $(pwd):/app -w /app mcr.microsoft.com/playwright:v1.52.0-noble npm test
```

## License

[Apache-2.0](./LICENSE)
