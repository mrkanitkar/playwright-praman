/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Hybrid Login Test -- Playwright Native Login + Praman UI5 App Testing.
 *
 * @remarks
 * This example demonstrates the **auto-fallback** pattern: use Playwright
 * native locators for non-UI5 pages (login forms, IDP redirects) and
 * seamlessly switch to Praman UI5 fixtures once inside the SAP application.
 *
 * Key patterns shown:
 *
 * 1. **Playwright native** for the login form (HTML, not UI5)
 * 2. **Praman `ui5` fixture** for the Fiori Launchpad and app controls
 * 3. No special configuration needed -- Praman auto-detects UI5 pages
 *
 * When to use each approach:
 * - Login page / IDP redirect: `page.locator()`, `page.fill()`, `page.click()`
 * - SAP Fiori Launchpad tiles: `ui5.control()`, `ui5.press()`
 * - SAP app controls (Input, Table, Dialog): `ui5.control()`, `ui5.fill()`
 *
 * @example
 * ```bash
 * npx playwright test examples/hybrid-login.spec.ts
 * ```
 */

import { test, expect } from 'playwright-praman';

test.describe('Hybrid Login Flow', () => {
  test('login with Playwright native, then test with Praman', async ({ page, ui5 }) => {
    // ================================================================
    // PHASE 1: Playwright Native -- Login Form (NOT UI5)
    // ================================================================
    await test.step('Login via SAP IAS (Playwright native)', async () => {
      // Navigate to the SAP system -- this triggers an IDP redirect
      await page.goto(process.env['SAP_CLOUD_BASE_URL']!);

      // The IAS login form is plain HTML -- use Playwright locators
      await page.waitForSelector('input[name="j_username"], input[name="email"]', {
        timeout: 30_000,
      });

      // Fill credentials using Playwright native (NOT ui5.fill -- this is not a UI5 control)
      await page.locator('input[name="j_username"], input[name="email"]').fill(
        process.env['SAP_CLOUD_USERNAME']!,
      );
      await page.locator('input[name="j_password"], input[name="password"]').fill(
        process.env['SAP_CLOUD_PASSWORD']!,
      );

      // Submit the form
      await page.locator('button[type="submit"], #logOnFormSubmit').click();

      // Wait for redirect back to SAP Fiori Launchpad
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

      // Press the tile using Praman (fires UI5 press event + waitForUI5)
      await ui5.press({
        controlType: 'sap.m.GenericTile',
        properties: { header: 'Purchase Orders' },
      });
      await ui5.waitForUI5();
    });

    await test.step('Interact with app controls (Praman UI5)', async () => {
      // Inside the app -- all controls are UI5, use Praman fixtures
      const searchField = await ui5.control({
        controlType: 'sap.m.SearchField',
      });

      const controlType = await searchField.getControlType();
      expect(controlType).toBe('sap.m.SearchField');

      // Use ui5.fill() for UI5 Input controls -- atomic setValue + fireChange + waitForUI5
      await ui5.fill(
        { controlType: 'sap.m.SearchField' },
        'PO-12345',
      );
      await ui5.waitForUI5();
    });
  });
});
