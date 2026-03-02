---
sidebar_position: 1
slug: /
title: Praman
---

**AI-First SAP UI5 Test Automation Plugin for Playwright.**

Praman extends Playwright with deep SAP UI5 awareness — typed control proxies, UI5 stability
synchronization, FLP navigation, and AI-powered test generation.

## Get Started in 4 Steps

**1. Install**

```bash
npm install playwright-praman
```

First install resolves Playwright and other dependencies — allow 1-2 minutes.

**2. Initialize**

```bash
npx playwright init-agents --loop=vscode
npx playwright-praman init
```

Validates your environment, installs Chromium, detects your IDE, and scaffolds config files, auth setup, and a gold-standard verification test.

**3. Configure SAP Credentials**

```bash
cp .env.example .env
# Edit .env with your SAP_CLOUD_BASE_URL, SAP_CLOUD_USERNAME, SAP_CLOUD_PASSWORD
```

**4. Verify**

```bash
npx playwright test tests/bom-e2e-praman-gold-standard.spec.ts --reporter=line --headed --project=chromium
```

A passing test confirms your setup is complete. See the full [Getting Started](./guides/getting-started.md) guide for a detailed walkthrough.

```typescript
import { test, expect } from 'playwright-praman';

test('discover a UI5 control', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  const button = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create' } });
  const text = await button.getText();
  expect(text).toBe('Create');
});
```

## Documentation

- [Getting Started](./guides/getting-started.md) — install, configure, write your first test
- [Configuration Reference](./guides/configuration.md) — all config options with defaults
- [Authentication Guide](./guides/authentication.md) — 6 SAP auth strategies
- [Selector Reference](./guides/selectors.md) — `UI5Selector` fields and examples
- [Fixture Reference](./guides/fixtures.md) — all 12 fixture modules
- [Error Reference](./guides/errors.md) — 60 error codes with recovery suggestions
- [Feature Inventory](./guides/capabilities.md) — complete feature overview
- [Agent & IDE Setup](./guides/agent-setup.md) — AI agents, seed file, and IDE configs installed by `init`

API documentation is auto-generated from source code TSDoc comments — see the **API Reference** in the navbar.

## LLM-Friendly Docs

Praman publishes documentation in the [llmstxt.org](https://llmstxt.org) standard for AI agents, RAG pipelines, and LLM tools:

| File                                                                                            | Content                                    |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------ |
| [`llms.txt`](https://mrkanitkar.github.io/playwright-praman/llms.txt)                           | Link index — all docs with descriptions    |
| [`llms-full.txt`](https://mrkanitkar.github.io/playwright-praman/llms-full.txt)                 | Complete documentation in a single file    |
| [`llms-quickstart.txt`](https://mrkanitkar.github.io/playwright-praman/llms-quickstart.txt)     | Setup, fixtures, selectors, matchers       |
| [`llms-sap-testing.txt`](https://mrkanitkar.github.io/playwright-praman/llms-sap-testing.txt)   | Auth, FLP, OData, Fiori Elements, cookbook |
| [`llms-migration.txt`](https://mrkanitkar.github.io/playwright-praman/llms-migration.txt)       | Migration from Playwright, wdi5, Tosca     |
| [`llms-architecture.txt`](https://mrkanitkar.github.io/playwright-praman/llms-architecture.txt) | Architecture, bridge, proxy, ADRs          |

These files are regenerated on every build and deployed alongside the site.
