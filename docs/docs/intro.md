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
npm install playwright-praman @playwright/test
npx playwright install
```

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
- [Error Reference](./guides/errors.md) — 58 error codes with recovery suggestions
- [Feature Inventory](./guides/capabilities.md) — complete feature overview
- [Agent & IDE Setup](./guides/agent-setup.md) — AI agents, seed file, and IDE configs installed by `init`

API documentation is auto-generated from source code TSDoc comments — see the **API Reference** in the navbar.
