# playwright-praman

> AI-First SAP UI5 Test Automation Platform for Playwright

[![CI](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/playwright-praman)](https://www.npmjs.com/package/playwright-praman)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)

|         | Windows | macOS | Linux |
| ------- | ------- | ----- | ----- |
| Node 20 | ✅      | ✅    | ✅    |
| Node 22 | ✅      | ✅    | ✅    |
| Node 24 | ✅      | ✅    | ✅    |

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

## Usage Examples

### Table Operations with Auto-Retry Matchers

```typescript
import { test, expect } from 'playwright-praman';

test('verify purchase order table', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  await test.step('Check table data', async () => {
    const rows = await ui5.table.getRows('poTable');
    expect(rows.length).toBeGreaterThan(0);
    await expect(page).toHaveUI5RowCount('poTable', 5);
    await expect(page).toHaveUI5CellText('poTable', 0, 1, 'Active');
  });

  await test.step('Filter and sort', async () => {
    await ui5.table.filterByColumn('poTable', 0, 'Active');
    await ui5.table.sortByColumn('poTable', 1);
  });
});
```

### OData CRUD Operations

```typescript
import { test, expect } from 'playwright-praman';

test('OData model and HTTP access', async ({ ui5 }) => {
  await test.step('Read model data', async () => {
    const vendor = await ui5.odata.getModelProperty('/PurchaseOrders(0)/Vendor');
    expect(vendor).toBe('100001');
    const dirty = await ui5.odata.hasPendingChanges();
    expect(dirty).toBe(false);
  });

  await test.step('HTTP query', async () => {
    const orders = await ui5.odata.queryEntities(
      '/sap/opu/odata/sap/API_PO_SRV',
      'PurchaseOrders',
      { filter: "Status eq 'A'", top: 10 },
    );
    expect(orders.length).toBeGreaterThan(0);
  });
});
```

### Auth + Navigation Flow

```typescript
import { test, expect } from 'playwright-praman';

test('authenticated navigation', async ({ ui5Navigation, ui5Shell }) => {
  // storageState from setup project handles authentication

  await test.step('Navigate via FLP', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-manage');
    await ui5Shell.expectShellHeader();
  });

  await test.step('Intent-based navigation', async () => {
    await ui5Navigation.navigateToIntent('PurchaseOrder', 'create', {
      plant: '1000',
    });
    const hash = await ui5Navigation.getCurrentHash();
    expect(hash).toContain('PurchaseOrder');
  });

  await test.step('Return home', async () => {
    await ui5Navigation.navigateToHome();
  });
});
```

### AI-Powered Test Generation

```typescript
import { test } from 'playwright-praman';

test('AI-assisted test discovery', async ({ pramanAI, page }) => {
  await test.step('Discover page controls', async () => {
    const context = await pramanAI.discoverPage({ interactiveOnly: true });
    if (context.status === 'success') {
      console.log(`Found ${context.data.controls.length} interactive controls`);
    }
  });

  await test.step('Generate test from description', async () => {
    const result = await pramanAI.agentic.generateTest(
      'Create a purchase order for vendor 100001 with material MAT-001',
      page,
    );
    if (result.status === 'success') {
      console.log(result.data.code); // Generated TypeScript test
    }
  });
});
```

## Sub-path Exports

| Export                         | Description                      |
| ------------------------------ | -------------------------------- |
| `playwright-praman`            | Core fixtures, proxy, bridge     |
| `playwright-praman/ai`         | AI/LLM service, agentic handler  |
| `playwright-praman/intents`    | Intent wrappers, registries      |
| `playwright-praman/vocabulary` | SAP vocabulary, control mappings |
| `playwright-praman/fe`         | SAP Fiori Elements helpers       |
| `playwright-praman/reporters`  | Custom Playwright reporters      |

## TypeScript Configuration

For full type resolution of sub-path exports, use `moduleResolution: "node16"` or
`"bundler"` in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16"
  }
}
```

Each sub-path export provides separate `.d.ts` (ESM) and `.d.cts` (CJS) type
declarations via conditional `"types"` in the package exports map.

## Build

```bash
npm run build          # tsup → dist/ (ESM + CJS)
npm run check:exports  # attw export validation
npm run test:unit      # Vitest (hermetic)
npm run ci             # lint + typecheck + test + build
```

> **Note:** The published npm package includes `src/` (TypeScript source) alongside
> compiled `dist/` output. This enables source-map debugging in consuming projects
> and provides context for AI-assisted test generation agents.

## IDE Support

| IDE / Agent          | Config                                          |
| -------------------- | ----------------------------------------------- |
| VS Code + Copilot    | `.github/copilot-instructions.md`, `.vscode/`   |
| JetBrains / IntelliJ | `.idea/runConfigurations/`, `.idea/codeStyles/` |
| Cursor               | `.cursor/rules/praman.mdc`                      |
| Google Antigravity   | `.antigravity/rules.md`                         |

## AI Agent Support

| Agent                 | Config                            |
| --------------------- | --------------------------------- |
| GitHub Copilot        | `.github/copilot-instructions.md` |
| Copilot Coding Agents | `.github/agents/`                 |
| Claude Code           | `CLAUDE.md`                       |
| OpenAI Codex / Jules  | `AGENTS.md`, `.jules/setup.md`    |
| Cursor                | `.cursor/rules/`                  |

## Azure Playwright (Optional)

For scalable cloud-based test execution, see [Azure Playwright Workspaces](https://github.com/Azure/playwright-workspaces).

```bash
npm install @azure/playwright
```

## Docker

Use the official Playwright image:

```bash
docker run --rm -v $(pwd):/app -w /app mcr.microsoft.com/playwright:v1.58.2-noble npm test
```

## Supply Chain Security

- **npm provenance** — every published version includes a [provenance attestation](https://docs.npmjs.com/generating-provenance-statements)
- **SBOM** — CycloneDX 1.5 Software Bill of Materials generated per release
- **SHA-pinned Actions** — all GitHub Actions use commit SHA references, not mutable tags
- **2 production dependencies** — `pino` (MIT) and `zod` (MIT) only
- **Security policy** — see [SECURITY.md](./SECURITY.md)

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

[Apache-2.0](./LICENSE)
