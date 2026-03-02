# playwright-praman

> AI-First SAP UI5 Test Automation Platform for Playwright

[![CI](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mrkanitkar/playwright-praman/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/playwright-praman)](https://www.npmjs.com/package/playwright-praman)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://github.com/mrkanitkar/playwright-praman)

Praman extends [Playwright](https://playwright.dev/) with deep SAP UI5 awareness — typed control proxies,
UI5 stability synchronization, Fiori Launchpad navigation, and AI-powered test generation.
Write reliable end-to-end tests for SAP Fiori apps in minutes, not days.

## Why Praman?

- **SAP-native control access** — interact with UI5 controls through the runtime registry, not fragile DOM selectors
- **AI-powered test generation** — describe what to test in business terms, get production-ready Playwright tests
- **Works with your IDE** — first-class support for Claude Code, GitHub Copilot, Cursor, VS Code, and Jules
- **Typed control proxies** — full IntelliSense and autocomplete for SAP controls
- **Zero lock-in** — standard Playwright underneath, mix Praman fixtures with native Playwright freely

## Getting Started

### Step 1: Install

```bash
npm install playwright-praman
```

First install may take 1-2 minutes — npm resolves `@playwright/test` (peer dependency) plus 3 direct dependencies (`commander`, `pino`, `zod`) and 4 optional peer dependencies for AI and observability.

### Step 2: Initialize Project

First, initialize Playwright's agent loop for your IDE:

```bash
npx playwright init-agents --loop=vscode
```

Then, run the Praman initializer:

```bash
npx playwright-praman init
```

This validates your environment, installs Chromium, detects your IDE, and scaffolds everything you need:
`playwright.config.ts`, `praman.config.ts`, auth setup, gold-standard verification test, `.env.example`,
and IDE-specific AI agent configs.

### Step 3: Configure SAP Credentials

```bash
cp .env.example .env
```

Edit `.env` with your SAP system details:

```bash
SAP_CLOUD_BASE_URL=https://your-sap-system.example.com
SAP_CLOUD_USERNAME=your-username
SAP_CLOUD_PASSWORD=your-password
SAP_AUTH_STRATEGY=btp-saml    # 'btp-saml' | 'basic' | 'office365'
SAP_CLIENT=100                # OnPrem only
```

> **Never commit `.env`** — it is already in `.gitignore`.

### Step 4: Verify Setup

```bash
npx playwright test tests/bom-e2e-praman-gold-standard.spec.ts --reporter=line --headed --project=chromium
```

Expected output:

```text
Running 1 test using 1 worker

  ✓  tests/bom-e2e-praman-gold-standard.spec.ts › BOM End-to-End Flow › Complete BOM Flow (60-120s)

  1 passed
```

A passing test confirms: Playwright + Chromium installed, SAP credentials valid, auth session saved, and Praman fixtures interacting with live UI5 controls.

## Quick Example

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

## Documentation

| Topic                         | Link                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| Full getting started guide    | [Getting Started](https://praman.zestest.in/docs/guides/getting-started)           |
| Configuration reference       | [Configuration](https://praman.zestest.in/docs/guides/configuration)               |
| Authentication (6 strategies) | [Authentication](https://praman.zestest.in/docs/guides/authentication)             |
| Agent & IDE setup             | [Agent Setup](https://praman.zestest.in/docs/guides/agent-setup)                   |
| Fixtures reference            | [Fixtures](https://praman.zestest.in/docs/guides/fixtures)                         |
| Error codes (60)              | [Errors](https://praman.zestest.in/docs/guides/errors)                             |
| Azure Playwright Workspaces   | [Cloud Testing](https://praman.zestest.in/docs/guides/azure-playwright-workspaces) |
| Docker & CI/CD                | [CI/CD Guide](https://praman.zestest.in/docs/guides/docker-cicd)                   |
| API reference                 | [API Docs](https://praman.zestest.in/docs/api/)                                    |
| LLM-friendly docs             | [llms.txt](https://praman.zestest.in/llms.txt)                                     |

## Sub-path Exports

| Export                         | Description                      |
| ------------------------------ | -------------------------------- |
| `playwright-praman`            | Core fixtures, proxy, bridge     |
| `playwright-praman/ai`         | AI/LLM service, agentic handler  |
| `playwright-praman/intents`    | Intent wrappers, registries      |
| `playwright-praman/vocabulary` | SAP vocabulary, control mappings |
| `playwright-praman/fe`         | SAP Fiori Elements helpers       |
| `playwright-praman/reporters`  | Custom Playwright reporters      |

## Security

- **npm provenance** — every published version includes a [provenance attestation](https://docs.npmjs.com/generating-provenance-statements)
- **3 production dependencies** — `commander` (MIT), `pino` (MIT), `zod` (MIT)
- **SBOM** — CycloneDX 1.5 generated per release
- **SHA-pinned Actions** — see [SECURITY.md](./SECURITY.md)

## License

[Apache-2.0](./LICENSE)
