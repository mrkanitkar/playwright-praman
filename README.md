# playwright-praman

> Agent-First SAP UI5 Test Automation Plugin for Playwright

[![CI](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/playwright-praman)](https://www.npmjs.com/package/playwright-praman)
[![npm downloads](https://img.shields.io/npm/dw/playwright-praman)](https://www.npmjs.com/package/playwright-praman)
[![GitHub stars](https://img.shields.io/github/stars/mrkanitkar/playwright-praman)](https://github.com/mrkanitkar/playwright-praman)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/mrkanitkar/playwright-praman)
[![Repomix](https://img.shields.io/badge/Repomix-context-blue?logo=github)](https://github.com/mrkanitkar/playwright-praman/actions/workflows/repomix.yml)
[![Socket Badge](https://badge.socket.dev/npm/package/playwright-praman)](https://socket.dev/npm/package/playwright-praman)
[![Ask AI about Praman](https://img.shields.io/badge/Ask_AI-about_Praman-8B5CF6?logo=openai&logoColor=white)](https://chatgpt.com/?hints=search&temporary-chat=true&q=I%20am%20reading%20the%20Praman%20documentation%20%E2%80%94%20an%20Agent-First%20SAP%20UI5%20Test%20Automation%20Plugin%20for%20Playwright.%20For%20full%20documentation%20context%2C%20read%3A%20https%3A%2F%2Fpraman.dev%2Fllms-full.txt%0A%0AMy%20question%3A%20)
[![npm trends](https://img.shields.io/npm/dm/playwright-praman?label=monthly%20downloads)](https://npmtrends.com/playwright-praman-vs-playwright-sap-vs-wdio-ui5-service)
[![bundle size](https://img.shields.io/bundlephobia/minzip/playwright-praman)](https://bundlephobia.com/package/playwright-praman)

## What is Praman?

Enterprise Playwright plugin for SAP S/4HANA. Describe your business process — AI agents deliver production-ready test scripts.

Praman extends [Playwright](https://playwright.dev/) with deep SAP UI5 awareness.
It queries controls through the **runtime control registry** — not fragile DOM selectors —
so tests survive UI5 upgrades, theme changes, and custom CSS without breaking.

## When to Use?

- **SAP RISE & Public Cloud migration** — validate every Fiori app before and after cutover
- **Frequent upgrade cycles** — quarterly UI5 patches, feature packs, and S/4HANA updates need continuous regression
- **No documentation** — AI agents discover controls from your live system, no specs required
- **Cost reduction** — replace manual test scripting with autonomous agent-generated tests
- **Agentic automation** — build a complete plan → generate → heal pipeline with zero human scripting
- **Greenfield, brownfield, or bluefield** — one plugin covers every S/4HANA deployment model

## Agent-First Design

Business analysts define the process. AI agents — Claude, Copilot, Jules — generate the tests. No scripting required.

## Who is Praman for?

- **CXOs & Program Leads** — go-live confidence backed by deployment evidence, not hope
- **SAP test engineers** — reliable E2E tests for S/4HANA, Fiori, and BTP apps in minutes
- **AI coding agents** (Claude Code, GitHub Copilot, Cursor, Jules) — generate tests from business descriptions
- **QA teams** — agentic AI power for Playwright, purpose-built for SAP UI5-native testing

## Key Capabilities

| Capability                | Details                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| **61 UI5 control types**  | Covers `sap.m`, `sap.ui.table`, `sap.ui.comp`, `sap.uxap`, `sap.f`, `sap.ui.mdc` |
| **Typed control proxies** | Full IntelliSense and autocomplete for every SAP control                         |
| **UI5 stability sync**    | Automatic waiting — no `page.waitForTimeout()` needed                            |
| **FLP navigation**        | Navigate to any Fiori Launchpad app by semantic object + action                  |
| **6 auth strategies**     | BTP SAML, Basic Auth, Office 365, Client Certificate, Custom IDP, Manual         |
| **OData V2/V4**           | Mock, intercept, and assert OData requests                                       |
| **Fiori Elements**        | Page-object helpers for List Report, Object Page, Overview Page                  |
| **10 UI5 matchers**       | Playwright-native `expect()` extended with UI5-specific assertions               |
| **AI test generation**    | Describe tests in business language, get production-ready Playwright code        |
| **Cross-platform**        | Windows, macOS, Linux — Node.js 20+                                              |

## Quick Start

```bash
npm install playwright-praman
npx playwright-praman init
```

That's it. `init` validates your environment, installs Chromium, scaffolds config files, detects your IDE, and installs AI agent definitions.

```bash
# Set your SAP credentials
cp .env.example .env
# Edit .env with your SAP_CLOUD_BASE_URL, SAP_CLOUD_USERNAME, SAP_CLOUD_PASSWORD
```

Two paths to get started — choose your workflow:

### Path A: Generate Tests with AI Agents (recommended)

Describe your business process — Praman's **plan → generate → heal** pipeline does the rest:

```bash
/praman-sap-coverage
# Then enter: "Test creating a purchase order with vendor 1000, material MAT-001, quantity 10"
```

| Agent         | What it does                                                                  |
| ------------- | ----------------------------------------------------------------------------- |
| **Planner**   | Explores your live SAP system, discovers UI5 controls, produces a test plan   |
| **Generator** | Converts the plan into executable Playwright + Praman code with typed proxies |
| **Healer**    | Runs the test, fixes failures, ensures compliance — repeats until green       |

The result is a **production-ready `.spec.ts` file** — no manual scripting required. Works with Claude Code, GitHub Copilot, Cursor, and Jules.

Need agents for a different IDE? Mirrors Playwright's `init-agents`:

```bash
npx playwright-praman init-agents --loop=vscode
npx playwright-praman init-agents --loop=claude
npx playwright-praman init-agents --loop=cursor
```

> Guides: [Getting Started](https://praman.dev/docs/guides/getting-started)
> · [Agent & IDE Setup](https://praman.dev/docs/guides/agent-setup)
> · [Running Your Agent](https://praman.dev/docs/guides/running-your-agent)

### Path B: Write Tests Manually

Prefer writing tests by hand? Use Praman fixtures directly:

```typescript
import { test, expect } from 'playwright-praman';

test('open Fiori app', async ({ page, ui5 }) => {
  await page.goto(process.env['SAP_CLOUD_BASE_URL']!);
  await ui5.waitForUI5();

  const tile = await ui5.control({
    controlType: 'sap.m.GenericTile',
    properties: { header: 'My App' },
  });
  expect(await tile.getControlType()).toBe('sap.m.GenericTile');
});
```

```bash
npx playwright test --project=chromium --headed
```

> See the [Fixture Reference](https://praman.dev/docs/guides/fixtures) and [Selector Reference](https://praman.dev/docs/guides/selectors) for the full API.

## Example

### Prompt Template — AI Agent Test Generation

Describe your SAP business process as a prompt. Praman's AI agents (Claude Code, Copilot, Cursor, Jules) turn it into a production-ready test script.

```text
Goal: Create SAP test case and test script

1. Use praman SAP planner agent:
   .github/agents/praman-sap-planner.agent.md

2. Login using credentials in .env file and use Chrome in headed mode.
   Do not use sub-agents.

3. Ensure you use UI5 query and capture UI5 methods at each step.
   Use UI5 methods for all control interactions.

4. Use seed file: tests/seeds/sap-seed.spec.ts

5. Here is the test case:

   Login to SAP and ensure you are on the landing page.

   Step 1: Navigate to Maintain Bill of Material app and click Create BOM
     - expect: Create BOM dialog opens with all fields visible

   Step 2: Select Material via Value Help — pick a valid material
     - expect: Material field is populated with selected material

   Step 3: Select Plant via Value Help — pick plant matching the material
     - expect: Plant field is populated with selected plant

   Step 4: Select BOM Usage "Production (1)" from dropdown
     - expect: BOM Usage field shows "Production (1)"

   Step 5: Verify all required fields are filled before submission
     - expect: Material field has a value
     - expect: BOM Usage field has value "Production (1)"
     - expect: Valid From date is set
     - expect: Create BOM button is enabled

   Step 6: Click "Create BOM" submit button in dialog footer
     - expect: If valid combination — dialog closes, BOM created,
       user returns to list report
     - expect: If invalid combination — error message dialog appears

   Step 7: If error occurs, close error dialog and cancel
     - expect: Error dialog closes
     - expect: Create BOM dialog closes
     - expect: User returns to list report

Output:
  - Test plan: specs/
  - Test script: tests/e2e/sap-cloud/
```

The agent explores your live SAP system, discovers UI5 controls via `sap.ui.getCore()`, and generates a `.spec.ts` file using Praman fixtures — no manual scripting required.

### What You Get

The pipeline produces two artifacts:

1. **Test plan** (`specs/*.plan.md`) — structured Markdown with app overview, discovered controls, step-by-step scenarios, and expected outcomes
2. **Test script** (`tests/e2e/*.spec.ts`) — production-ready Playwright + Praman code generated from the plan

#### Sample Test Plan (excerpt)

```markdown
# BOM Create Flow — Test Plan

## Application Overview

SAP S/4HANA Cloud - Maintain Bill of Material (Version 2).
Fiori Elements V4 List Report with Create BOM dialog.
UI5 Version: 1.142.4. Controls use MDC field types.

## Test Scenarios

### 1. Navigate to Maintain BOM app from FLP

1. Click on 'Maintain Bill Of Material (Version 2)' tile
   - expect: Page navigates to #MaterialBOM-maintainMaterialBOM
   - expect: Filter bar is visible with fields: Material, Plant, BOM Usage
   - expect: 'Create BOM' button is visible and enabled
```

#### Sample Test Script

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Maintain BOM — Create Flow', () => {
  test('Create BOM end-to-end', async ({ page, ui5, ui5Navigation }) => {
    await test.step('Step 1: Navigate to app', async () => {
      await ui5Navigation.navigateToTile('Maintain Bill of Material');
      await ui5.waitForUI5();
    });

    await test.step('Step 2: Open Create BOM dialog', async () => {
      const createBtn = await ui5.control({
        controlType: 'sap.m.Button',
        properties: { text: 'Create' },
      });
      await createBtn.press();
      await ui5.waitForUI5();
    });

    await test.step('Step 3: Fill Material via Value Help', async () => {
      const materialField = await ui5.control({
        id: 'materialInput',
        searchOpenDialogs: true,
      });
      await materialField.setValue('MAT-001');
      await materialField.fireChange({ value: 'MAT-001' });
      await ui5.waitForUI5();
      expect(await materialField.getValue()).toBeTruthy();
    });
  });
});
```

More examples in the [`examples/`](./examples/) directory.

## How Praman Works

Praman uses a **6-layer architecture**:

1. **Core Infrastructure** — error system, logging (pino), config (zod), path helpers
2. **Bridge Adapters** — inject JavaScript into the browser to query the UI5 runtime control registry
3. **Typed Proxy** — TypeScript proxies for each UI5 control type with full IntelliSense
4. **Fixtures** — Playwright test fixtures (`ui5`, `ui5Navigation`, `ui5Table`, `ui5Auth`, etc.)
5. **AI Layer** — LLM integration for agentic test generation from business-language descriptions
6. **Reporters** — Custom Playwright reporters for compliance evidence and OData trace

Lower layers never import from higher layers. The bridge communicates with UI5's `sap.ui.getCore()` and OData model APIs directly in the browser context.

## Discovery & Interaction Strategies

Praman uses two configurable strategy systems — **discovery** (how controls are found) and **interaction** (how actions are performed). Both use priority chains with automatic fallbacks.

### 3 Discovery Strategies

| Strategy       | How It Works                                                    | Best For                         |
| -------------- | --------------------------------------------------------------- | -------------------------------- |
| `direct-id`    | Single ID lookup via `sap.ui.core.Element.registry`             | Known stable IDs — fastest path  |
| `recordreplay` | SAP `RecordReplay` API (UI5 >= 1.94) with full selector support | Complex selectors, standard apps |
| `registry`     | Full registry scan matching type, properties, bindings          | Dynamic controls, fallback       |

Praman runs strategies in priority order and stops at the first match. ID-only selectors automatically promote `direct-id` to first position.

### 3 Interaction Strategies

| Strategy     | Approach                                                    | Best For                                      |
| ------------ | ----------------------------------------------------------- | --------------------------------------------- |
| `ui5-native` | Direct UI5 event firing (`firePress`, `setValue`) — default | Standard Fiori apps (broadest fallback)       |
| `dom-first`  | DOM events first, UI5 fallback                              | Custom composites, Web Components, Shadow DOM |
| `opa5`       | SAP `RecordReplay.interactWithControl()` (UI5 >= 1.94)      | SAP compliance audits, OPA5 migration         |

Each strategy includes a built-in fallback chain — no single strategy needs to handle every control type alone.

### Configuration

```bash
# Environment variables — override per test run
PRAMAN_INTERACTION_STRATEGY=dom-first npx playwright test
PRAMAN_DISCOVERY_STRATEGIES=direct-id,recordreplay,registry npx playwright test
```

See the full [Discovery & Interaction Strategies](https://praman.dev/docs/guides/discovery-and-interaction) guide
for decision matrices, fallback chain diagrams, and recommended configurations by app type.

## Sub-path Exports

| Export                         | Description                      |
| ------------------------------ | -------------------------------- |
| `playwright-praman`            | Core fixtures, proxy, bridge     |
| `playwright-praman/ai`         | AI/LLM service, agentic handler  |
| `playwright-praman/intents`    | Intent wrappers, registries      |
| `playwright-praman/vocabulary` | SAP vocabulary, control mappings |
| `playwright-praman/fe`         | SAP Fiori Elements helpers       |
| `playwright-praman/reporters`  | Custom Playwright reporters      |

## Documentation

| Topic                         | Link                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Full documentation            | [praman.dev](https://praman.dev)                                                                   |
| Getting started guide         | [Getting Started](https://praman.dev/docs/guides/getting-started)                                  |
| Configuration reference       | [Configuration](https://praman.dev/docs/guides/configuration)                                      |
| Authentication (6 strategies) | [Authentication](https://praman.dev/docs/guides/authentication)                                    |
| Agent & IDE setup             | [Agent Setup](https://praman.dev/docs/guides/agent-setup)                                          |
| Fixtures reference            | [Fixtures](https://praman.dev/docs/guides/fixtures)                                                |
| Error codes (60)              | [Errors](https://praman.dev/docs/guides/errors)                                                    |
| API reference                 | [API Docs](https://praman.dev/docs/api/)                                                           |
| LLM-friendly docs             | [llms.txt](https://praman.dev/llms.txt)                                                            |
| Repomix context (AI agents)   | [Download artifact](https://github.com/mrkanitkar/playwright-praman/actions/workflows/repomix.yml) |

## Migrating to Praman

Already using another SAP testing tool? Step-by-step migration guides:

- [**From wdi5**](https://praman.dev/docs/guides/migration-from-wdi5) — API mapping from `browser.asControl()` to `ui5.control()`, selector conversion, fixture equivalents
- [**From Tricentis Tosca**](https://praman.dev/docs/guides/migration-from-tosca) — module-to-fixture mapping, open-source cost comparison
- [**From Selenium WebDriver**](https://praman.dev/docs/guides/migration-from-selenium) — WebDriver to Playwright patterns, locator strategy migration
- [**From raw Playwright**](https://praman.dev/docs/guides/migration-from-playwright) — add UI5 awareness to existing Playwright tests

## Frequently Asked Questions

### What SAP systems does Praman support?

Praman supports SAP S/4HANA (on-premise and cloud), SAP BTP applications,
SAP Fiori Launchpad, and any web application built with SAPUI5 or OpenUI5.
It works with both SAP Fiori Elements and custom UI5 freestyle apps.

### Do I need access to SAP source code?

No. Praman interacts with UI5 controls through the public runtime API (`sap.ui.getCore()`).
It queries the control registry at runtime, so you only need browser access to the application.

### Can I use Praman with existing Playwright tests?

Yes. Praman extends Playwright — it does not replace it. You can mix Praman fixtures
(`ui5`, `ui5Navigation`, `ui5Table`) with native Playwright APIs
(`page.click()`, `page.locator()`) in the same test file.

### How does AI test generation work?

Praman integrates with AI coding agents (Claude Code, GitHub Copilot, Cursor, Jules).
You describe what to test in business language
(e.g., "test creating a purchase order with approval workflow"),
and the agent generates production-ready Playwright tests using Praman fixtures.
The generated tests use typed control proxies — not brittle selectors.

### How does Praman compare to wdi5?

Both access the UI5 control registry. Praman is built on Playwright (faster, parallel, modern tooling),
while wdi5 uses WebdriverIO. Praman adds typed control proxies with IntelliSense,
AI-powered test generation, Fiori Elements page-object helpers,
OData V2/V4 mock/intercept utilities, and 10 UI5-specific Playwright matchers.

## Support

If Praman saves you time, please [star the repo](https://github.com/mrkanitkar/playwright-praman) — it helps others discover the project.

## Security

- **npm provenance** — every published version includes a [provenance attestation](https://docs.npmjs.com/generating-provenance-statements)
- **3 production dependencies** — `commander` (MIT), `pino` (MIT), `zod` (MIT)
- **SBOM** — CycloneDX 1.5 generated per release
- **SHA-pinned Actions** — see [SECURITY.md](./SECURITY.md)

## License

[Apache-2.0](./LICENSE)
