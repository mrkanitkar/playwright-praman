---
sidebar_position: 0
title: Examples Overview
---

# Examples

Complete, runnable Praman test examples demonstrating real SAP UI5 test patterns.

Each example is a self-contained Playwright spec file that you can copy into your project and adapt.

## Prerequisites

All examples assume:

- Praman is installed (`npm install -D playwright-praman @playwright/test`)
- Authentication is handled via a [setup project](/docs/guides/authentication)
- `storageState` is configured in `playwright.config.ts`
- Environment variables (`SAP_BASE_URL`, `SAP_USERNAME`, `SAP_PASSWORD`) are set

## Available Examples

| Example                                                     | What It Demonstrates                                                      |
| ----------------------------------------------------------- | ------------------------------------------------------------------------- |
| [Auth Setup](/docs/examples/auth-setup)                     | OnPrem, BTP SAML, and Office 365 authentication strategies                |
| [Basic Test](/docs/examples/basic-test)                     | Control discovery by type and property, `ui5.press()`                     |
| [Dialog Handling](/docs/examples/dialog-handling)           | Open, interact, confirm, and dismiss SAP UI5 dialogs                      |
| [Table Operations](/docs/examples/table-operations)         | SmartTable rows, OData binding, `getContextByIndex()`                     |
| [Hybrid Login](/docs/examples/hybrid-login)                 | Playwright native for login + Praman UI5 for app testing                  |
| [Gold Standard BOM E2E](/docs/examples/gold-standard-bom)   | Full end-to-end BOM flow with value helps, dropdowns, and form submission |
| [BTP Multi-Tenant Auth](/docs/examples/btp-multi-tenant)    | BTP Work Zone multi-tenant auth, tenant switching, session isolation      |
| [OData CRUD Operations](/docs/examples/odata-crud)          | OData V4 read, create, update, delete with CSRF tokens and model state    |
| [Fiori Elements](/docs/examples/fiori-elements)             | List Report filter/search, Object Page edit/save, variant management      |
| [Intent API](/docs/examples/intent-api)                     | Business-oriented intents: `fillField`, `clickButton`, domain functions   |
| [Vocabulary Discovery](/docs/examples/vocabulary-discovery) | Fuzzy term matching, domain loading, selector resolution, autocomplete    |

## Running Examples

```bash
# Copy an example into your test directory
cp node_modules/playwright-praman/examples/basic-test.spec.ts tests/

# Run it
npx playwright test tests/basic-test.spec.ts --headed
```

## Key Patterns

Every example follows Praman's mandatory patterns:

1. **Single import**: `import { test, expect } from 'playwright-praman'`
2. **Praman fixtures for all UI5 elements** -- never `page.click('#__...')`
3. **`test.step()`** for structured reporting
4. **`searchOpenDialogs: true`** for controls inside dialogs
5. **`ui5.fill()`** (or `setValue()` + `fireChange()` + `waitForUI5()`) for inputs
