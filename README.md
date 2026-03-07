# playwright-praman

> AI-First SAP UI5 Test Automation Platform for Playwright

[![CI](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/playwright-praman)](https://www.npmjs.com/package/playwright-praman)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/mrkanitkar/playwright-praman)
[![Repomix](https://img.shields.io/badge/Repomix-context-blue?logo=github)](https://github.com/mrkanitkar/playwright-praman/actions/workflows/repomix.yml)
[![Socket Badge](https://badge.socket.dev/npm/package/playwright-praman/1.0.2)](https://socket.dev/npm/package/playwright-praman/overview/1.0.2)
[![Ask AI about Praman](https://img.shields.io/badge/Ask_AI-about_Praman-8B5CF6?logo=openai&logoColor=white)](https://chatgpt.com/?hints=search&temporary-chat=true&q=I%20am%20reading%20the%20Praman%20documentation%20%E2%80%94%20an%20AI-First%20SAP%20UI5%20Test%20Automation%20platform%20for%20Playwright.%20For%20full%20documentation%20context%2C%20read%3A%20https%3A%2F%2Fmrkanitkar.github.io%2Fplaywright-praman%2Fllms-full.txt%0A%0AMy%20question%3A%20)

## What is Praman?

Enterprise Playwright plugin for SAP S/4HANA. Describe your business process — AI agents deliver production-ready test scripts.

Praman extends [Playwright](https://playwright.dev/) with deep SAP UI5 awareness.
It queries controls through the **runtime control registry** — not fragile DOM selectors —
so tests survive UI5 upgrades, theme changes, and custom CSS without breaking.

## When to Use?

When your S/4HANA go-live depends on test quality, not test headcount. One platform — greenfield, brownfield, or bluefield.

## AI-First Design

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

### Install

```bash
npm install playwright-praman
# or
yarn add playwright-praman
# or
pnpm add playwright-praman
```

Only 3 production dependencies: `commander` (MIT), `pino` (MIT), `zod` (MIT).

### Initialize

```bash
npx playwright init-agents --loop=vscode
npx playwright-praman init
```

The initializer validates your environment, installs Chromium, detects your IDE, and scaffolds:
`playwright.config.ts`, `praman.config.ts`, auth setup, gold-standard verification test,
`.env.example`, and IDE-specific AI agent configs.

### Configure SAP Credentials

```bash
cp .env.example .env
```

```bash
SAP_CLOUD_BASE_URL=https://your-sap-system.example.com
SAP_CLOUD_USERNAME=your-username
SAP_CLOUD_PASSWORD=your-password
SAP_AUTH_STRATEGY=btp-saml    # 'btp-saml' | 'basic' | 'office365'
```

> **Never commit `.env`** — it is already in `.gitignore`.

### Verify Setup

```bash
npx playwright test tests/bom-e2e-praman-gold-standard.spec.ts --reporter=line --headed --project=chromium
```

A passing test confirms: Playwright + Chromium installed, SAP credentials valid,
auth session saved, and Praman fixtures interacting with live UI5 controls.

### Generate Tests from Your Business Process

Once your setup is verified, describe your business process or test case in plain language — Praman's AI agents will autonomously generate the test plan and production-ready Playwright test script.

**Using Claude Code:**

```bash
/praman-sap-coverage
```

Then enter your business process, for example:

> "Test creating a purchase order: navigate to ME21N, enter vendor 1000, add material MAT-001 with quantity 10 in plant 1000, and verify the PO is posted successfully."

Praman's **plan → generate → heal** pipeline will:

1. **Plan** — The SAP planner agent explores your live SAP system, discovers UI5 controls, and produces a structured test plan
2. **Generate** — The generator converts the plan into executable Playwright + Praman test code using typed control proxies
3. **Heal** — The healer validates the generated test, fixes any failures, and ensures compliance

The result is a production-ready `.spec.ts` file — no manual test scripting required.

## Example

```typescript
import { test, expect } from 'playwright-praman';

test('SAP Fiori app test', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  await test.step('Find and verify Create button', async () => {
    const btn = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'Create' },
    });
    expect(await btn.getText()).toBe('Create');
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

See the full [Discovery & Interaction Strategies](https://mrkanitkar.github.io/playwright-praman/docs/guides/discovery-and-interaction) guide
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
| Full documentation            | [praman.zestest.in](https://mrkanitkar.github.io/playwright-praman)                                |
| Getting started guide         | [Getting Started](https://mrkanitkar.github.io/playwright-praman/docs/guides/getting-started)      |
| Configuration reference       | [Configuration](https://mrkanitkar.github.io/playwright-praman/docs/guides/configuration)          |
| Authentication (6 strategies) | [Authentication](https://mrkanitkar.github.io/playwright-praman/docs/guides/authentication)        |
| Agent & IDE setup             | [Agent Setup](https://mrkanitkar.github.io/playwright-praman/docs/guides/agent-setup)              |
| Fixtures reference            | [Fixtures](https://mrkanitkar.github.io/playwright-praman/docs/guides/fixtures)                    |
| Error codes (60)              | [Errors](https://mrkanitkar.github.io/playwright-praman/docs/guides/errors)                        |
| API reference                 | [API Docs](https://mrkanitkar.github.io/playwright-praman/docs/api/)                               |
| LLM-friendly docs             | [llms.txt](https://mrkanitkar.github.io/playwright-praman/llms.txt)                                |
| Repomix context (AI agents)   | [Download artifact](https://github.com/mrkanitkar/playwright-praman/actions/workflows/repomix.yml) |

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

Both access the UI5 control registry. Praman adds typed control proxies with IntelliSense,
AI-powered test generation, Fiori Elements page-object helpers,
OData mock/intercept utilities, and 10 UI5-specific Playwright matchers.

## Security

- **npm provenance** — every published version includes a [provenance attestation](https://docs.npmjs.com/generating-provenance-statements)
- **3 production dependencies** — `commander` (MIT), `pino` (MIT), `zod` (MIT)
- **SBOM** — CycloneDX 1.5 generated per release
- **SHA-pinned Actions** — see [SECURITY.md](./SECURITY.md)

## License

[Apache-2.0](./LICENSE)
