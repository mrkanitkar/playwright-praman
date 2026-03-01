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

## When to Use Praman vs Native Playwright

Use this decision tree to determine the right API for each element:

```text
Is the element on the page?
  |
  +-- Is it a UI5 control? (sap.m.*, sap.ui.*, sap.ui.comp.*)
  |     |
  |     +-- YES --> Use Praman: ui5.control(), ui5.press(), ui5.fill()
  |     |
  |     +-- NOT SURE --> Check with ui5.control({ controlType: '...' })
  |           |
  |           +-- Found --> Use Praman fixtures
  |           +-- Not found --> Use Playwright native (page.locator())
  |
  +-- Is it a login form or IDP redirect page?
  |     |
  |     +-- YES --> Use Playwright native: page.locator(), page.fill()
  |                 (Auth pages are plain HTML, not UI5)
  |
  +-- Is it a standard HTML element on a UI5 page?
  |     |
  |     +-- YES --> Use Playwright native: page.locator()
  |                 (e.g., FLP space tabs, custom HTML fragments)
  |
  +-- Is it a hybrid page (UI5 + non-UI5)?
        |
        +-- YES --> Use both! See examples/hybrid-login.spec.ts
                    Playwright native for HTML, Praman for UI5 controls
```

### Quick Reference

| Scenario                         | API                                            | Example                                                                          |
| -------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------- |
| UI5 Button, Input, Table, Dialog | `ui5.control()`, `ui5.press()`, `ui5.fill()`   | `await ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Save' } })` |
| UI5 SmartField / SmartTable      | `ui5.control()` + proxy methods                | `const table = await smartTable.getTable()`                                      |
| Controls inside dialogs          | `ui5.control()` with `searchOpenDialogs: true` | `await ui5.control({ id: 'myDialog--field', searchOpenDialogs: true })`          |
| SAP login form (HTML)            | `page.locator()`, `page.fill()`                | `await page.locator('#sap-user').fill(username)`                                 |
| IDP redirect (IAS, Azure AD)     | `page.locator()`, `page.fill()`                | `await page.locator('input[name="email"]').fill(email)`                          |
| FLP space tabs                   | `page.getByText()`                             | `await page.getByText('My Space', { exact: true }).click()`                      |
| Page title verification          | `expect(page).toHaveTitle()`                   | `await expect(page).toHaveTitle(/Home/)`                                         |

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
      // Use test.info() annotations instead of console.log (Praman rule #5)
      test.info().annotations.push({
        type: 'info',
        description: `Found ${context.data.controls.length} interactive controls`,
      });
    }
  });

  await test.step('Generate test from description', async () => {
    const result = await pramanAI.agentic.generateTest(
      'Create a purchase order for vendor 100001 with material MAT-001',
      page,
    );
    if (result.status === 'success') {
      // Generated TypeScript test code is available in result.data.code
      expect(result.data.code).toBeTruthy();
    }
  });
});
```

## Examples

Runnable example files are in the [`examples/`](./examples/) directory:

| Example                                                                                   | Description                                                   |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`basic-test.spec.ts`](./examples/basic-test.spec.ts)                                     | Minimal UI5 control discovery test                            |
| [`hybrid-login.spec.ts`](./examples/hybrid-login.spec.ts)                                 | Playwright native login + Praman UI5 app test (auto-fallback) |
| [`table-operations.spec.ts`](./examples/table-operations.spec.ts)                         | Table `getRows()`, OData binding, `getContextByIndex()`       |
| [`dialog-handling.spec.ts`](./examples/dialog-handling.spec.ts)                           | `searchOpenDialogs`, dialog open/close, value help            |
| [`auth-setup.ts`](./examples/auth-setup.ts)                                               | Complete SAP authentication setup (OnPrem, BTP, Office 365)   |
| [`bom-e2e-praman-gold-standard.spec.ts`](./examples/bom-e2e-praman-gold-standard.spec.ts) | Full BOM end-to-end test (gold standard reference)            |

```bash
# Run a specific example
npx playwright test examples/basic-test.spec.ts
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

## LLM-Friendly Documentation (llms.txt)

Praman publishes its documentation in the [llmstxt.org](https://llmstxt.org) standard. AI agents and RAG pipelines can fetch these files directly:

| File                                                                                            | Content                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [`llms.txt`](https://mrkanitkar.github.io/playwright-praman/llms.txt)                           | Link index — all docs with descriptions    |
| [`llms-full.txt`](https://mrkanitkar.github.io/playwright-praman/llms-full.txt)                 | Complete documentation in a single file    |
| [`llms-quickstart.txt`](https://mrkanitkar.github.io/playwright-praman/llms-quickstart.txt)     | Setup, fixtures, selectors, matchers       |
| [`llms-sap-testing.txt`](https://mrkanitkar.github.io/playwright-praman/llms-sap-testing.txt)   | Auth, FLP, OData, Fiori Elements, cookbook |
| [`llms-migration.txt`](https://mrkanitkar.github.io/playwright-praman/llms-migration.txt)       | Migration from Playwright, wdi5, Tosca     |
| [`llms-architecture.txt`](https://mrkanitkar.github.io/playwright-praman/llms-architecture.txt) | Architecture, bridge, proxy, ADRs          |

Add to your agent instructions (CLAUDE.md, `.cursorrules`, `copilot-instructions.md`):

```markdown
For Praman docs: https://mrkanitkar.github.io/playwright-praman/llms-full.txt
For SAP testing: https://mrkanitkar.github.io/playwright-praman/llms-sap-testing.txt
```

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

## Troubleshooting

### Common Error Codes

**`ERR_BRIDGE_TIMEOUT`** -- Page is not a UI5 application, or UI5 has not finished loading.

- Verify the URL points to a UI5/Fiori app.
- Add `await page.waitForLoadState('domcontentloaded')` before the first `ui5.*` call.
- Check if the page uses a non-standard UI5 bootstrap.

**`ERR_BRIDGE_INJECTION`** -- The UI5 bridge script could not be injected.

- Check for Content Security Policy (CSP) headers blocking inline scripts.
- Ensure the page has loaded before calling `ui5.control()`.

**`ERR_CONTROL_NOT_FOUND`** -- No UI5 control matches the given selector.

- Verify the control ID or `controlType` + `properties` combination.
- Use `searchOpenDialogs: true` if the control is inside a dialog.
- Check that `ui5.waitForUI5()` was called after navigation.

**`ERR_CONTROL_NOT_INTERACTABLE`** -- Control found but not interactive.

- Check `getEnabled()` and `getVisible()` before interacting.
- Wait for async operations to complete with `ui5.waitForUI5()`.

**`ERR_TIMEOUT_UI5_STABLE`** -- UI5 did not reach a stable state within the timeout.

- SAP apps with continuous polling (e.g., FLP home) may never reach idle.
- Use `expect().toPass()` with custom intervals instead.
- Increase the timeout for slow systems.

### Enable Debug Logging

Praman uses [pino](https://github.com/pinojs/pino) for structured logging. Set the
`LOG_LEVEL` environment variable to enable verbose output:

```bash
# Show all debug messages
LOG_LEVEL=debug npx playwright test

# Show only warnings and errors
LOG_LEVEL=warn npx playwright test
```

### Minimal playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // SAP apps need longer timeouts
  expect: { timeout: 30_000 },

  projects: [
    // Auth setup -- runs first, saves session
    {
      name: 'auth',
      testMatch: '**/auth-setup.ts',
    },
    // Main tests -- reuse saved session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
        baseURL: process.env.SAP_BASE_URL,
      },
      dependencies: ['auth'],
    },
  ],
});
```

## CI/CD Setup

### GitHub Actions

```yaml
name: SAP UI5 Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
```

### Azure DevOps

```yaml
trigger:
  - main

pool:
  vmImage: ubuntu-latest

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '20.x'
  - script: npm ci
  - script: npx playwright install --with-deps chromium
  - script: npx playwright test
```

### Environment Variables

| Variable                    | Required | Description                                    |
| --------------------------- | -------- | ---------------------------------------------- |
| `SAP_CLOUD_BASE_URL`        | Yes      | SAP BTP or on-premise base URL                 |
| `SAP_CLOUD_USERNAME`        | Yes      | SAP login username                             |
| `SAP_CLOUD_PASSWORD`        | Yes      | SAP login password                             |
| `SAP_CLIENT`                | No       | SAP client number                              |
| `PRAMAN_SKIP_VERSION_CHECK` | No       | Set to `true` to skip Playwright version check |

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

[Apache-2.0](./LICENSE)
