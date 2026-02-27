---
sidebar_position: 5
title: Hybrid Login
---

# Hybrid Login Flow

Demonstrates the **auto-fallback** pattern: use Playwright native locators for non-UI5 pages (login forms, IDP redirects) and seamlessly switch to Praman UI5 fixtures once inside the SAP application.

## When to Use Each Approach

| Page Type                               | Approach                                        | Why                           |
| --------------------------------------- | ----------------------------------------------- | ----------------------------- |
| Login page / IDP redirect               | `page.locator()`, `page.fill()`, `page.click()` | These are plain HTML, not UI5 |
| SAP Fiori Launchpad tiles               | `ui5.control()`, `ui5.press()`                  | UI5 controls with dynamic IDs |
| SAP app controls (Input, Table, Dialog) | `ui5.control()`, `ui5.fill()`                   | UI5 controls with event model |

## Source

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Hybrid Login Flow', () => {
  test('login with Playwright native, then test with Praman', async ({ page, ui5 }) => {
    // ================================================================
    // PHASE 1: Playwright Native -- Login Form (NOT UI5)
    // ================================================================
    await test.step('Login via SAP IAS (Playwright native)', async () => {
      await page.goto(process.env['SAP_BASE_URL']!);

      // IAS login form is plain HTML -- use Playwright locators
      await page.waitForSelector('input[name="j_username"], input[name="email"]', {
        timeout: 30_000,
      });

      await page
        .locator('input[name="j_username"], input[name="email"]')
        .fill(process.env['SAP_USERNAME']!);
      await page
        .locator('input[name="j_password"], input[name="password"]')
        .fill(process.env['SAP_PASSWORD']!);

      await page.locator('button[type="submit"], #logOnFormSubmit').click();
      await expect(page).toHaveTitle(/Home/, { timeout: 60_000 });
    });

    // ================================================================
    // PHASE 2: Praman UI5 Fixtures -- SAP Application (UI5)
    // ================================================================
    await test.step('Navigate FLP tile (Praman UI5)', async () => {
      // Now on the Fiori Launchpad -- switch to Praman fixtures.
      // The bridge is injected automatically on the first ui5.* call.
      const tile = await ui5.control({
        controlType: 'sap.m.GenericTile',
        properties: { header: 'Purchase Orders' },
      });

      const header = await tile.getProperty('header');
      expect(header).toBe('Purchase Orders');

      await ui5.press({
        controlType: 'sap.m.GenericTile',
        properties: { header: 'Purchase Orders' },
      });
      await ui5.waitForUI5();
    });

    await test.step('Interact with app controls (Praman UI5)', async () => {
      const searchField = await ui5.control({
        controlType: 'sap.m.SearchField',
      });

      const controlType = await searchField.getControlType();
      expect(controlType).toBe('sap.m.SearchField');

      await ui5.fill({ controlType: 'sap.m.SearchField' }, 'PO-12345');
      await ui5.waitForUI5();
    });
  });
});
```

## Key Concepts

- **No special configuration** -- Praman auto-detects UI5 pages and injects the bridge on first `ui5.*` call
- **Playwright native for non-UI5** -- login pages, IDP redirects, and static HTML forms
- **Praman fixtures for UI5** -- all SAP Fiori controls inside the application
- **Seamless transition** -- both approaches work in the same test, same `page` object
