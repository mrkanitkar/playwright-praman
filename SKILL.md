---
name: playwright-praman-sap-testing
description: >
  Playwright plugin for SAP UI5 test automation. Provides fixtures for UI5 control
  discovery, SAP authentication (BTP SAML, Basic, Office365), FLP navigation,
  OData V2/V4 data access, Fiori Elements testing (ListReport, ObjectPage), AI-powered
  test generation, and business intent APIs (Procurement MM, Sales SD, FI, PP). Use when
  testing SAP Fiori applications, Fiori Elements apps, or any SAP UI5 application
  with Playwright. Import from 'playwright-praman'.
---

# SAP UI5 Test Automation with Praman

Praman is a Playwright plugin for SAP UI5 applications. It bridges Playwright's
web-first approach with SAP's UI5 framework, providing stable selectors, SAP auth
strategies, FLP navigation, and AI-driven test generation.

## Quick Start

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { defineConfig as definePramanConfig } from 'playwright-praman';

export default defineConfig({
  use: {
    praman: definePramanConfig({
      auth: { strategy: 'basic', baseUrl: 'https://your-sap-system.example.com' },
    }),
  },
});

// my.test.ts
import { test, expect } from 'playwright-praman';

test('create purchase order', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5.fill({ id: 'vendorInput' }, 'SUP-001');
  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
  await expect(ui5.waitForUI5()).resolves.toBeUndefined();
});
```

## When to Use Praman vs Native Playwright

| Element Type                | Use                | Example                                                                          |
| --------------------------- | ------------------ | -------------------------------------------------------------------------------- |
| UI5 Button (`sap.m.Button`) | `ui5.click()`      | `await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } })` |
| UI5 Input (`sap.m.Input`)   | `ui5.fill()`       | `await ui5.fill({ id: 'vendorInput' }, 'SUP-001')`                               |
| UI5 Select (`sap.m.Select`) | `ui5.select()`     | `await ui5.select({ id: 'companyCode' }, '1000')`                                |
| UI5 Table (`sap.m.Table`)   | `ui5.table.*`      | `await ui5.table.getRows('tableId')`                                             |
| UI5 Dialog                  | `ui5.dialog.*`     | `await ui5.dialog.confirm()`                                                     |
| UI5 Date Picker             | `ui5.date.*`       | `await ui5.date.setDate('datePickerId', '2024-01-15')`                           |
| Plain HTML button           | Playwright native  | `await page.locator('button#submit').click()`                                    |
| Non-UI5 elements            | Playwright native  | `await page.locator('.custom-element').isVisible()`                              |
| Browser navigation (URL)    | Playwright native  | `await page.goto(url)`                                                           |
| FLP app navigation          | `ui5Navigation.*`  | `await ui5Navigation.navigateToApp('PurchaseOrder-manage')`                      |
| Wait for UI5 rendering      | `ui5.waitForUI5()` | `await ui5.waitForUI5()`                                                         |
| Wait for network            | Playwright native  | `await page.waitForLoadState('networkidle')`                                     |
| OData model read            | `ui5.odata.*`      | `await ui5.odata.readEntity('/Suppliers', 'SUP-001')`                            |

## Fixture Map

| Fixture         | Import via                 | Purpose                                         |
| --------------- | -------------------------- | ----------------------------------------------- |
| `ui5`           | `coreTest` or `moduleTest` | UI5 control discovery + interaction             |
| `ui5Navigation` | `navTest`                  | FLP / WorkZone navigation                       |
| `ui5.table`     | `moduleTest`               | Table operations (read, select rows)            |
| `ui5.dialog`    | `moduleTest`               | Dialog confirm/dismiss                          |
| `ui5.date`      | `moduleTest`               | Date picker interactions                        |
| `ui5.odata`     | `moduleTest`               | OData model + HTTP operations                   |
| `pramanAI`      | `aiTest`                   | AI-powered test generation (Phase 5)            |
| `intent`        | `intentTest`               | Business intent APIs — MM, SD, FI, PP (Phase 5) |

```typescript
import { coreTest as test } from 'playwright-praman'; // ui5 only
import { moduleTest as test } from 'playwright-praman'; // ui5 + table/dialog/date/odata
import { navTest as test } from 'playwright-praman'; // ui5 + navigation
```

## SAP Control Type Namespace Reference

```text
sap.m.*          — Mobile-first controls (Button, Input, Select, Table, List, Dialog)
sap.ui.table.*   — Grid Table (classic desktop table — higher density)
sap.ui.comp.*    — Smart controls (SmartField, SmartTable, SmartFilterBar)
sap.ui.core.*    — Core framework (Icon, HTML, View)
sap.f.*          — Fiori controls (DynamicPage, FlexibleColumnLayout, Card)
sap.tnt.*        — Tools and Navigation Theme (NavigationList, SideNavigation)
sap.uxap.*       — UX AP Patterns (ObjectPage, ObjectPageSection)
```

**SmartField note**: `SmartField` wraps an inner control. `getControlType()` returns
`sap.ui.comp.smartfield.SmartField` — NOT the inner `sap.m.Input` or `sap.m.ComboBox`.
Always use the outer SmartField type in selectors.

## Auth Strategy Selection

```text
SAP System Type       → Strategy
─────────────────────────────────────────────────────
OnPrem + LDAP/AD      → 'basic' (username/password form)
OnPrem + SAML2        → 'btp-saml' (redirect flow)
BTP Cloud Foundry     → 'btp-saml' (BTP IAS redirect)
Office 365 / Azure AD → 'office365' (Microsoft SSO)
API / Service Account → custom (APIAuthStrategy)
Multi-tenant          → custom (MultiTenantAuthStrategy)
Certificate / mTLS    → custom (CertificateAuthStrategy)
```

```typescript
// playwright.config.ts — with auth storage
export default defineConfig({
  projects: [
    {
      name: 'auth',
      testMatch: '**/auth-setup.ts',
    },
    {
      name: 'tests',
      dependencies: ['auth'],
      use: { storageState: '.auth/session.json' },
    },
  ],
});
```

See [authentication.md](skills/playwright-praman-sap-testing/authentication.md) for all 6 strategies.

## FLP Semantic Object Hash Format

FLP navigation hashes follow the pattern: `#SemanticObject-Action?param=value`

```typescript
// Navigate to standard apps
await ui5Navigation.navigateToApp('PurchaseOrder-manage'); // ME23N equivalent
await ui5Navigation.navigateToApp('SalesOrder-manage'); // VA03 equivalent
await ui5Navigation.navigateToApp('Material-display'); // MM60 equivalent

// Navigate by tile title (for WorkZone)
await ui5Navigation.navigateToTile('Manage Purchase Orders');

// Navigate with intent parameters
await ui5Navigation.navigateToIntent('PurchaseOrder', 'manage', {
  PurchaseOrder: '4500001234',
});

// Navigate by raw hash
await ui5Navigation.navigateToHash("#PurchaseOrder-manage&/PurchaseOrder('4500001234')");
```

## UI5 Selector Guide

```typescript
// By stable ID (fastest — use when you control the app)
await ui5.control({ id: 'submitButton' });

// By control type + text (stable across locales — preferred for buttons)
await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } });

// By control type + binding path (stable across UI changes)
await ui5.control({ controlType: 'sap.m.Input', bindingPath: { path: '/Vendor' } });

// Scoped by ancestor (avoids false matches in complex layouts)
await ui5.control({
  controlType: 'sap.m.Input',
  ancestor: { id: 'vendorForm' },
});

// Multiple controls
const rows = await ui5.controls({ controlType: 'sap.m.ColumnListItem' });
```

## Domain Reference Files

| Domain            | File                                                                                        | Contents                                                 |
| ----------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| UI5 Controls      | [ui5-controls.md](skills/playwright-praman-sap-testing/ui5-controls.md)                     | Selector syntax, 199 control types, interaction patterns |
| Authentication    | [authentication.md](skills/playwright-praman-sap-testing/authentication.md)                 | 6 auth strategies, SAP deployment types                  |
| Navigation        | [navigation.md](skills/playwright-praman-sap-testing/navigation.md)                         | FLP hashes, 9 navigation functions, WorkZone             |
| Fiori Elements    | [fiori-elements.md](skills/playwright-praman-sap-testing/fiori-elements.md)                 | ListReport, ObjectPage, SmartTable, FilterBar            |
| Table/Dialog/Date | [table-dialog-date.md](skills/playwright-praman-sap-testing/table-dialog-date.md)           | 6 table variants, dialog patterns, date formats          |
| OData             | [odata.md](skills/playwright-praman-sap-testing/odata.md)                                   | OData V2/V4, model vs HTTP, batch requests               |
| AI Capabilities   | [ai-capabilities.md](skills/playwright-praman-sap-testing/ai-capabilities.md)               | AI test generation, intent APIs, vocabulary              |
| Capabilities      | [capabilities-reference.md](skills/playwright-praman-sap-testing/capabilities-reference.md) | Auto-generated full capability manifest                  |
