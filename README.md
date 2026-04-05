# playwright-praman

> Agent-First SAP UI5 Test Automation Plugin for Playwright
>
> ⭐ If Praman saves you time, [star the repo](https://github.com/mrkanitkar/playwright-praman) — it helps others find it.

[![CI](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/playwright-praman)](https://www.npmjs.com/package/playwright-praman)
[![npm downloads](https://img.shields.io/npm/dw/playwright-praman)](https://www.npmjs.com/package/playwright-praman)
[![GitHub stars](https://img.shields.io/github/stars/mrkanitkar/playwright-praman)](https://github.com/mrkanitkar/playwright-praman)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22-brightgreen)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/mrkanitkar/playwright-praman)
[![Ask AI about Praman](https://img.shields.io/badge/Ask_AI-about_Praman-8B5CF6?logo=openai&logoColor=white)](https://chatgpt.com/?hints=search&temporary-chat=true&q=I%20am%20reading%20the%20Praman%20documentation%20%E2%80%94%20an%20Agent-First%20SAP%20UI5%20Test%20Automation%20Plugin%20for%20Playwright.%20For%20full%20documentation%20context%2C%20read%3A%20https%3A%2F%2Fpraman.dev%2Fllms-full.txt%0A%0AMy%20question%3A%20)
[![bundle size](https://img.shields.io/bundlephobia/minzip/playwright-praman)](https://bundlephobia.com/package/playwright-praman)

Praman extends [Playwright](https://playwright.dev/) with deep SAP UI5 awareness — querying controls through
the **UI5 runtime registry**, not fragile DOM selectors, so tests survive upgrades and theme changes.
Describe your business process; AI agents deliver production-ready test scripts.

> **[Comparing SAP test automation tools →](https://mrkanitkar.github.io/playwright-praman/blog/2026/04/02/sap-test-automation-comparison)**

## Who is Praman for?

| Stakeholder                                                | Value                                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **SAP test engineers**                                     | Write reliable E2E tests for any S/4HANA or Fiori app in minutes — no DOM hunting, no fragile selectors  |
| **QA teams**                                               | Replace manual SAP test scripting with AI-generated, self-healing Playwright tests purpose-built for UI5 |
| **AI coding agents** (Claude Code, Copilot, Cursor, Jules) | Generate production-ready SAP tests from a business process description, no source code or specs needed  |
| **Program leads & delivery managers**                      | Ship SAP go-lives with deployment evidence — not manual sign-off and hope                                |

## Quick Start

```bash
npm install playwright-praman
npx playwright-praman init
```

`init` scaffolds config, installs Chromium, and sets up AI agent definitions for your IDE.

```bash
cp .env.example .env
# Add SAP_CLOUD_BASE_URL, SAP_CLOUD_USERNAME, SAP_CLOUD_PASSWORD
```

→ [Getting Started guide](https://praman.dev/docs/guides/getting-started)

## Two Ways to Test

### Option A — AI Agents (recommended)

Describe your business process. Praman's **plan → generate → heal** pipeline does the rest.

```bash
# In Claude Code, Copilot, or Cursor:
/praman-sap-coverage
# "Test creating a purchase order with vendor 1000, material MAT-001, quantity 10"
```

| Agent         | What it does                                           |
| ------------- | ------------------------------------------------------ |
| **Planner**   | Explores your live SAP system and produces a test plan |
| **Generator** | Converts the plan into typed Playwright + Praman code  |
| **Healer**    | Runs the test, fixes failures, repeats until green     |

| Interface          | Transport            | Install                      | Best For                                   |
| ------------------ | -------------------- | ---------------------------- | ------------------------------------------ |
| **Playwright MCP** | WebSocket (JSON-RPC) | `@playwright/mcp` (separate) | Interactive exploration, VS Code / Copilot |
| **Playwright CLI** | stdin/stdout         | Built into Playwright 1.59+  | CI/CD, token-efficient, any terminal agent |

Agent files with a `-cli` suffix use Playwright CLI; files without use Playwright MCP.

→ [Agent & IDE Setup](https://praman.dev/docs/guides/agent-setup) · [MCP vs CLI](https://praman.dev/docs/guides/mcp-vs-cli) · [CLI Agents Guide](https://praman.dev/docs/guides/playwright-cli-agents)

### Option B — Write Tests Manually

```typescript
import { test, expect } from 'playwright-praman';

test('create purchase order', async ({ page, ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToTile('Purchase Orders');
  await ui5.waitForUI5();

  const createBtn = await ui5.control({
    controlType: 'sap.m.Button',
    properties: { text: 'Create' },
  });
  await createBtn.press();
  await ui5.waitForUI5();
});
```

Fixtures available: `ui5`, `ui5Navigation`, `sapAuth`, `fe`, `ui5.table`, `ui5.dialog`,
`ui5.odata`, `intent`, `pramanAI`, `testData`, `controlTree`, `shellFooter`, `flpLocks`.

→ [Fixture Reference](https://praman.dev/docs/guides/fixtures) · [Selector Reference](https://praman.dev/docs/guides/selectors) · [Examples](./examples/)

## What You Can Do with Praman

- **Test any SAP UI5 control** — 199 control types covered (`sap.m`, `sap.ui.table`, `sap.ui.comp`, `sap.uxap`, `sap.f`, `sap.ui.mdc`)
- **Write tests with full IntelliSense** — typed control proxies, no DOM digging, no guessing selectors
- **Never write `waitForTimeout()` again** — UI5 stability sync handles all timing automatically
- **Authenticate with any SAP system** — BTP SAML, Basic Auth, Office 365, Client Certificate, Custom IDP, Manual
- **Verify your backend** — mock, intercept, and assert OData V2/V4 requests with tracing reports
- **Test Fiori Elements apps without boilerplate** — List Report, Object Page, and Overview Page helpers included
- **Assert SAP state natively** — 10 UI5-specific matchers extend Playwright's `expect()`
- **Express tests in business language** — Vocabulary & Intent API maps SAP field names to selectors automatically
- **Run anywhere** — Windows, macOS, Linux · Node.js 22+ · TypeScript 5.x & 6.x

→ [Full capability reference](https://praman.dev/docs)

## Documentation

| Topic                              | Link                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------- |
| Full documentation                 | [praman.dev](https://praman.dev)                                       |
| Getting started                    | [Getting Started](https://praman.dev/docs/guides/getting-started)      |
| Configuration                      | [Configuration](https://praman.dev/docs/guides/configuration)          |
| Authentication                     | [Authentication](https://praman.dev/docs/guides/authentication)        |
| Agent & IDE setup                  | [Agent Setup](https://praman.dev/docs/guides/agent-setup)              |
| Fixtures reference                 | [Fixtures](https://praman.dev/docs/guides/fixtures)                    |
| Discovery & interaction strategies | [Strategies](https://praman.dev/docs/guides/discovery-and-interaction) |
| Vocabulary system                  | [Vocabulary](https://praman.dev/docs/guides/vocabulary-system)         |
| Intent API                         | [Intents](https://praman.dev/docs/guides/intent-api)                   |
| OData tracing                      | [OData Tracing](https://praman.dev/docs/guides/odata-tracing)          |
| Error codes                        | [Errors](https://praman.dev/docs/guides/errors)                        |
| API reference                      | [API Docs](https://praman.dev/docs/api/)                               |
| LLM-friendly docs                  | [llms.txt](https://praman.dev/llms.txt)                                |

## Migrating from Another Tool?

- [From wdi5](https://praman.dev/docs/guides/migration-from-wdi5)
- [From Tricentis Tosca](https://praman.dev/docs/guides/migration-from-tosca)
- [From Selenium WebDriver](https://praman.dev/docs/guides/migration-from-selenium)
- [From raw Playwright](https://praman.dev/docs/guides/migration-from-playwright)

## FAQ

**Do I need SAP source code?** No — Praman uses the public UI5 runtime API (`sap.ui.getCore()`).

**Does it work with existing Playwright tests?** Yes — Praman extends Playwright. Mix `ui5` fixtures
with native `page.click()` in the same file.

**Which SAP systems are supported?** S/4HANA (cloud and on-premise), BTP, Fiori Launchpad,
SAPUI5, and OpenUI5 — both Fiori Elements and freestyle apps.

→ [Full FAQ](https://praman.dev/docs/faq)

## Security

- 3 production dependencies (`commander`, `pino`, `zod` — all MIT)
- npm provenance attestation on every release
- SHA-pinned GitHub Actions · CycloneDX SBOM per release

→ [SECURITY.md](./SECURITY.md)

## Support

If Praman saves you time, please [⭐ star the repo](https://github.com/mrkanitkar/playwright-praman).

## License

[Apache-2.0](./LICENSE)
