---
sidebar_position: 1
slug: /
title: Praman
---

**AI-First SAP UI5 Test Automation Plugin for Playwright.**

Praman extends Playwright with deep SAP UI5 awareness — typed control proxies, UI5 stability
synchronization, FLP navigation, and AI-powered test generation.

## Get Started

```bash
npm install playwright-praman
npx playwright-praman init
```

That's it. `init` handles everything — Chromium, configs, SAP credentials, IDE detection, and AI agent installation. Then generate tests:

```bash
/praman-sap-coverage
# Then enter: "Test creating a purchase order with vendor 1000, material MAT-001, quantity 10"
```

The **plan → generate → heal** pipeline runs 3 agents autonomously:

| Agent         | What it does                                                                |
| ------------- | --------------------------------------------------------------------------- |
| **Planner**   | Explores your live SAP system, discovers UI5 controls, produces a test plan |
| **Generator** | Converts the plan into Playwright + Praman code with typed control proxies  |
| **Healer**    | Runs the test, fixes failures, ensures compliance — repeats until green     |

The result is a production-ready `.spec.ts` file — no manual test scripting required.

See the full [Getting Started](./guides/getting-started.md) guide for details and [Running Your Agent](./guides/running-your-agent.md) for prompt templates.

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

**Setup & Onboarding**

- [Getting Started](./guides/getting-started.md) — install, configure, write your first test
- [Authentication Guide](./guides/authentication.md) — 6 SAP auth strategies
- [Agent & IDE Setup](./guides/agent-setup.md) — AI agents, seed file, and IDE configs installed by `init`

**Your Background** — start from what you already know:
[From Playwright](./guides/migration-from-playwright.md) | [From Selenium](./guides/migration-from-selenium.md) | [From wdi5](./guides/migration-from-wdi5.md) | [From Tosca](./guides/migration-from-tosca.md) | [For Business Analysts](./guides/sap-business-analyst-guide.md)

**Core References**

- [Configuration Reference](./guides/configuration.md) — all config options with defaults
- [Fixture Reference](./guides/fixtures.md) — all 12 fixture modules
- [Selector Reference](./guides/selectors.md) — `UI5Selector` fields and examples
- [Error Reference](./guides/errors.md) — 60 error codes with recovery suggestions
- [Feature Inventory](./guides/capabilities.md) — complete feature overview

> **Not sure where to start?** Visit the [Personas](/personas) page to find your role-specific entry point.

API documentation is auto-generated from source code TSDoc comments — see the **API Reference** in the navbar.

## LLM-Friendly Docs

Praman publishes documentation in the [llmstxt.org](https://llmstxt.org) standard for AI agents, RAG pipelines, and LLM tools:

| File                                                                | Content                                    |
| ------------------------------------------------------------------- | ------------------------------------------ |
| [`llms.txt`](https://praman.dev/llms.txt)                           | Link index — all docs with descriptions    |
| [`llms-full.txt`](https://praman.dev/llms-full.txt)                 | Complete documentation in a single file    |
| [`llms-quickstart.txt`](https://praman.dev/llms-quickstart.txt)     | Setup, fixtures, selectors, matchers       |
| [`llms-sap-testing.txt`](https://praman.dev/llms-sap-testing.txt)   | Auth, FLP, OData, Fiori Elements, cookbook |
| [`llms-migration.txt`](https://praman.dev/llms-migration.txt)       | Migration from Playwright, wdi5, Tosca     |
| [`llms-architecture.txt`](https://praman.dev/llms-architecture.txt) | Architecture, bridge, proxy, ADRs          |

These files are regenerated on every build and deployed alongside the site.
