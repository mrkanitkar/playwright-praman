/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Complete SAP Authentication Setup for Praman.
 *
 * @remarks
 * Copied into your project as `tests/auth.setup.ts` by `npx playwright-praman init`. Configure
 * it in `playwright.config.ts` as a setup project. This file handles:
 *
 * - SAP system login (OnPrem, BTP Cloud SAML, or Office 365)
 * - Session/cookie storage for reuse across all test files
 * - Environment-variable-driven configuration
 *
 * No modifications needed beyond setting environment variables.
 *
 * @example
 * ```bash
 * # Required environment variables (set in .env.test or CI secrets):
 * SAP_CLOUD_BASE_URL=https://your-sap-system.example.com
 * SAP_CLOUD_USERNAME=TEST_USER
 * SAP_CLOUD_PASSWORD=<your-password>
 * SAP_AUTH_STRATEGY=btp-saml   # 'basic' | 'btp-saml' | 'office365'
 * SAP_CLIENT=100               # OnPrem only, optional
 * SAP_LANGUAGE=EN               # Optional, default EN
 * ```
 */

// ---------------------------------------------------------------------------
// Step 1: Imports
// ---------------------------------------------------------------------------

import { join } from 'node:path';
import process from 'node:process';

import { test as setup } from '@playwright/test';

// ---------------------------------------------------------------------------
// Step 2: Configuration
// ---------------------------------------------------------------------------

/** Path where the authenticated browser state (cookies/storage) is saved. */
const AUTH_STATE_PATH = join(process.cwd(), '.auth', 'sap-state.json');

/**
 * Read a required environment variable or throw a clear error.
 *
 * @param name - Environment variable name.
 * @returns The environment variable value.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Set it in your .env file or CI secrets.',
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// Step 3: Auth Setup Project
// ---------------------------------------------------------------------------

/**
 * Playwright setup project that authenticates once and saves the session.
 *
 * Configure in playwright.config.ts:
 * ```typescript
 * import { defineConfig, devices } from '@playwright/test';
 *
 * export default defineConfig({
 *   projects: [
 *     // Auth setup — runs first, saves session to .auth/sap-state.json
 *     {
 *       name: 'auth-setup',
 *       testMatch: '**\/auth.setup.ts',
 *     },
 *     // Main test project — reuses saved session
 *     {
 *       name: 'chromium',
 *       use: {
 *         ...devices['Desktop Chrome'],
 *         storageState: '.auth/sap-state.json',
 *       },
 *       dependencies: ['auth-setup'],
 *       testIgnore: '**\/auth.setup.ts',
 *     },
 *   ],
 * });
 * ```
 */
setup('SAP authentication', async ({ page, context }) => {
  // ---- Read config from environment ----
  const baseUrl = requireEnv('SAP_CLOUD_BASE_URL');
  const username = requireEnv('SAP_CLOUD_USERNAME');
  const password = requireEnv('SAP_CLOUD_PASSWORD');
  const strategy = process.env['SAP_AUTH_STRATEGY'] ?? 'btp-saml';
  const client = process.env['SAP_CLIENT'] ?? '100';
  const language = process.env['SAP_LANGUAGE'] ?? 'EN';

  // ---- Navigate to SAP system ----
  // The login strategy determines which URL and form to use.
  if (strategy === 'basic') {
    // ------------------------------------------------------------------
    // OnPrem SAP NetWeaver: standard username/password login form
    // ------------------------------------------------------------------
    const loginUrl =
      `${baseUrl}/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html` +
      `?sap-client=${client}&sap-language=${language}`;

    await page.goto(loginUrl);

    // Fill the SAP logon form fields using native Playwright locators
    // (auth pages are NOT UI5 — they are plain HTML forms)
    await page.locator('#sap-user, input[name="sap-user"]').fill(username);
    await page.locator('#sap-password, input[name="sap-password"]').fill(password);

    // Submit the form
    await page.locator('#LOGON_BUTTON, button[type="submit"], input[type="submit"]').click();

    // Wait for the Fiori Launchpad shell header to appear (login complete)
    await page.waitForSelector('#shell-header, .sapUshellShellHead', {
      timeout: 30_000,
    });
  } else if (strategy === 'btp-saml') {
    // ------------------------------------------------------------------
    // BTP Cloud Foundry / SAP IAS: SAML2 redirect login
    // ------------------------------------------------------------------
    await page.goto(baseUrl);

    // IAS redirects to its own login page — wait for the form
    await page.waitForSelector('input[name="j_username"], input[name="email"], #logOnFormEmail', {
      timeout: 30_000,
    });

    // Fill IAS login form
    const emailField = page.locator(
      'input[name="j_username"], input[name="email"], #logOnFormEmail',
    );
    await emailField.fill(username);

    const passwordField = page.locator(
      'input[name="j_password"], input[name="password"], #logOnFormPassword',
    );
    await passwordField.fill(password);

    // Click Log On
    await page.locator('button[type="submit"], #logOnFormSubmit, input[type="submit"]').click();

    // Wait for redirect back to the app (SAML RelayState)
    // Use regex instead of glob — glob ** does not match hash fragments (#Shell-home)
    await page.waitForURL(new RegExp(`^${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), {
      timeout: 60_000,
    });

    // Wait for the Fiori Launchpad shell header
    await page.waitForSelector('#shell-header, .sapUshellShellHead', {
      timeout: 30_000,
    });
  } else if (strategy === 'office365') {
    // ------------------------------------------------------------------
    // Microsoft Entra ID (Azure AD) / Office 365 SSO
    // ------------------------------------------------------------------
    await page.goto(baseUrl);

    // Microsoft login redirects to login.microsoftonline.com
    await page.waitForURL('**/login.microsoftonline.com/**', {
      timeout: 30_000,
    });

    // Enter email
    await page.locator('input[type="email"]').fill(username);
    await page.locator('input[type="submit"], #idSIButton9').click();

    // Enter password
    await page.waitForSelector('input[type="password"]', { timeout: 15_000 });
    await page.locator('input[type="password"]').fill(password);
    await page.locator('input[type="submit"], #idSIButton9').click();

    // Handle "Stay signed in?" prompt (if it appears)
    const staySignedIn = page.locator('#idSIButton9, input[type="submit"]');
    const staySignedInVisible = await staySignedIn.isVisible().catch(() => false);
    if (staySignedInVisible) {
      await staySignedIn.click();
    }

    // Wait for redirect back to SAP and shell header
    await page.waitForSelector('#shell-header, .sapUshellShellHead', {
      timeout: 60_000,
    });
  } else {
    throw new Error(
      `Unknown auth strategy: "${strategy}". ` + 'Supported: "basic", "btp-saml", "office365".',
    );
  }

  // ---- Save authenticated state ----
  // This file is reused by all test projects via storageState config.
  await context.storageState({ path: AUTH_STATE_PATH });
});

// ---------------------------------------------------------------------------
// Optional: Auth Teardown (copy to tests/auth-teardown.ts if needed)
// ---------------------------------------------------------------------------
//
// import { test as teardown } from '@playwright/test';
//
// teardown('SAP logout', async ({ page }) => {
//   // Navigate to SAP ICF logoff endpoint to invalidate server session
//   await page.goto(
//     `${process.env['SAP_CLOUD_BASE_URL']}/sap/public/bc/icf/logoff`,
//   );
//   // Clear browser cookies
//   await page.context().clearCookies();
// });
