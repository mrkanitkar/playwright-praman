/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * SAP Seed Test — Authenticated page context for AI agent discovery.
 *
 * Uses raw Playwright only (`@playwright/test`) with NO Praman fixtures.
 * This ensures MCP compatibility: the Playwright MCP server creates its own
 * browser context, so fixture-based auth (sapAuth) and UI5 bridge (ui5) are
 * unavailable. Instead, authentication is performed inline via `page.$()` +
 * `fill()` + `click()`, and UI5 readiness is verified with a multi-method
 * control-count polling loop using `page.evaluate()`.
 *
 * This seed handles:
 * 1. Validate required SAP_CLOUD_BASE_URL environment variable
 * 2. Navigate to SAP system (domcontentloaded for IDP redirect chain)
 * 3. Detect whether login form or FLP shell is already present
 * 4. Authenticate via raw Playwright DOM interactions if needed
 * 5. Wait for UI5 Core to become available (up to 5 minutes)
 * 6. Poll for UI5 control count via three fallback methods (up to 30 attempts)
 * 7. Verify FLP readiness (version, control count, tile count)
 * 8. Page remains open — MCP `pauseAtEnd: true` keeps browser alive for agent
 *
 * @intent Provide authenticated SAP page for AI agent discovery.
 * @capability Agent seed, SAP authentication, FLP readiness.
 */
/* eslint-disable n/prefer-global/process, playwright/no-conditional-in-test, playwright/no-element-handle */
import { test, expect } from '@playwright/test';

// Set test timeout to 20 minutes for long SAP operations
test.setTimeout(20 * 60 * 1000);

// Environment variables for SAP connection
const SAP_URL = process.env['SAP_CLOUD_BASE_URL'] ?? '';
const SAP_USER = process.env['SAP_CLOUD_USERNAME'] ?? '';
const SAP_PASS = process.env['SAP_CLOUD_PASSWORD'] ?? '';

if (SAP_URL === '') {
  throw new Error('SAP_CLOUD_BASE_URL env var is required. Set it in .env or environment.');
}

test.describe('SAP Agent Seed', () => {
  test('sap-seed', async ({ page }) => {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Navigate to SAP Fiori Launchpad
    // ═══════════════════════════════════════════════════════════════
    await page.goto(SAP_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Handle Authentication (raw Playwright — no fixtures)
    // ═══════════════════════════════════════════════════════════════
    // Wait for either a login form or the FLP shell to appear
    await page
      .waitForSelector(
        'input[name="j_username"], #USERNAME_FIELD, #logOnForm, #shell-header, .sapUshellShellHead',
        { timeout: 30_000 },
      )
      .catch(() => {
        /* No login form or shell detected yet — continue */
      });

    // Check if login is needed (IDP redirect or login form present)
    const needsLogin = await page.evaluate(() => {
      return (
        document.querySelector('input[name="j_username"]') !== null ||
        document.querySelector('#USERNAME_FIELD') !== null ||
        document.querySelector('#logOnForm') !== null ||
        location.hostname === 'accounts.sap.com' ||
        location.hostname.endsWith('.accounts.sap.com')
      );
    });

    if (needsLogin && SAP_USER !== '' && SAP_PASS !== '') {
      // Find username and password fields via multiple SAP IAS/IDP selectors
      const usernameField = await page.$(
        'input[name="j_username"], #USERNAME_FIELD, input[name="username"]',
      );
      const passwordField = await page.$(
        'input[name="j_password"], #PASSWORD_FIELD, input[name="password"]',
      );

      if (usernameField !== null && passwordField !== null) {
        await usernameField.fill(SAP_USER);
        await passwordField.fill(SAP_PASS);

        // Find and click the login/submit button
        const loginBtn = await page.$('button[type="submit"], input[type="submit"], #LOGIN_LINK');
        if (loginBtn !== null) {
          await loginBtn.click();
          await page.waitForNavigation({ timeout: 30_000 }).catch(() => {
            /* Navigation may have already completed */
          });
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Wait for UI5 Core to Become Available
    // ═══════════════════════════════════════════════════════════════
    await page.waitForFunction(
      () => {
        return (
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          window.sap &&
          window.sap.ui &&
          window.sap.ui.getCore &&
          typeof window.sap.ui.getCore === 'function'
        );
      },
      { timeout: 300_000 },
    ); // 5 minutes — SAP systems can be slow

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: UI5 Readiness — Multi-Method Control Count Loop
    // ═══════════════════════════════════════════════════════════════
    // Poll up to 30 attempts (30 x 5s = 2.5 minutes max) using three
    // fallback methods to count loaded UI5 controls. Break as soon as
    // the count exceeds 20, which indicates FLP is usable.
    let controlCount = 0;
    for (let attempt = 0; attempt < 30; attempt++) {
      controlCount = await page.evaluate(() => {
        try {
          const core = window.sap.ui.getCore();

          // Method 1: core.mElements — internal but reliable in most UI5 versions
          if (core.mElements) {
            return Object.keys(core.mElements).length;
          }

          // Method 2: Element.registry.all() — modern control enumeration (UI5 >= 1.67)
          const registry = (window as any).sap?.ui?.core?.Element?.registry
            ?? (window as any).sap?.ui?.core?.ElementRegistry;
          const allControls = registry?.all ? Object.values(registry.all()) : [];
          if (allControls.length > 0) {
            return allControls.length;
          }

          // Method 3: DOM count — SAP UI5 elements with data attributes or ID prefix
          const sapElements = document.querySelectorAll('[data-sap-ui], [id^="__"]');
          return sapElements.length;
        } catch {
          // Fallback: just count SAP DOM elements
          const sapElements = document.querySelectorAll('[data-sap-ui], [id^="__"], .sapUiBody *');
          return Math.min(sapElements.length, 1000); // Cap to avoid huge counts
        }
      });

      // Once we have enough controls, FLP is usable
      if (controlCount > 20) {
        break;
      }

      // Wait 5 seconds between attempts
      // eslint-disable-next-line playwright/no-wait-for-timeout
      await page.waitForTimeout(5_000);
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Verify FLP is Ready
    // ═══════════════════════════════════════════════════════════════
    const flpStatus = await page.evaluate(() => {
      const core = window.sap?.ui?.getCore?.();

      let totalControls = 0;
      let tileCount = 0;

      if (core) {
        // Method 1: Try mElements
        if (core.mElements && Object.keys(core.mElements).length > 0) {
          const elements = core.mElements;
          totalControls = Object.keys(elements).length;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          Object.values(elements).forEach((ctrl: unknown) => {
            const control = ctrl as {
              getMetadata?: () => { getName?: () => string };
            };
            const type = control.getMetadata?.()?.getName?.() ?? '';
            if (type.includes('Tile') || type.includes('GenericTile')) {
              tileCount++;
            }
          });
        } else {
          // Method 2: Element.registry.all() — modern control enumeration (UI5 >= 1.67)
          const reg = (window as any).sap?.ui?.core?.Element?.registry
            ?? (window as any).sap?.ui?.core?.ElementRegistry;
          const allControls = reg?.all ? Object.values(reg.all()) as unknown[] : [];
          if (allControls.length > 0) {
            totalControls = allControls.length;
            allControls.forEach((ctrl: unknown) => {
              const control = ctrl as {
                getMetadata?: () => { getName?: () => string };
              };
              const type = control.getMetadata?.()?.getName?.() ?? '';
              if (type.includes('Tile') || type.includes('GenericTile')) {
                tileCount++;
              }
            });
          } else {
            // Method 3: Fallback to DOM counting
            totalControls = document.querySelectorAll('[data-sap-ui], [id^="__"]').length;
            tileCount = document.querySelectorAll(
              '[class*="sapUshellTile"], [class*="GenericTile"]',
            ).length;
          }
        }
      } else {
        // No core available — use DOM
        totalControls = document.querySelectorAll('[data-sap-ui], [id^="__"]').length;
        tileCount = document.querySelectorAll(
          '[class*="sapUshellTile"], [class*="GenericTile"]',
        ).length;
      }

      return {
        ready: true,
        ui5Version: window.sap?.ui?.version ?? 'unknown',
        totalControls,
        tileCount,
        url: location.href,
        hash: location.hash,
      };
    });

    // Verify UI5 is loaded and controls are present
    expect(flpStatus.ui5Version).toBeTruthy();
    expect(flpStatus.totalControls).toBeGreaterThan(0);

    // ═══════════════════════════════════════════════════════════════
    // DONE — MCP `pauseAtEnd: true` keeps the browser open.
    // Do NOT call page.pause() here: it opens the Playwright Inspector
    // UI which blocks the MCP server from issuing further commands.
    // The MCP server's pauseAtEnd configuration handles keeping the
    // browser alive for agent discovery without blocking.
    // ═══════════════════════════════════════════════════════════════
  });
});
