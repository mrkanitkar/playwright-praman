/**
 * SAP Seed Test — Authenticated page context for AI agent discovery.
 *
 * IMPORTANT: Auth happens INLINE in this seed, not via setup project.
 * The Playwright MCP server creates its own browser context, so it
 * cannot inherit storageState from a separate auth project.
 *
 * This seed handles:
 * 1. Navigate to SAP system login page
 * 2. Authenticate via sapAuth.login() (inline — NOT setup project)
 * 3. Wait for FLP shell to load
 * 4. Wait for UI5 Core to stabilize
 * 5. Verify readiness (shell visible, controls loaded)
 * 6. Page remains open for agent to take over via MCP tools
 *
 * ## Usage
 *
 * Copy this file to `tests/seeds/sap-seed.spec.ts` in your project.
 * Then set environment variables and run via the Praman SAP agents.
 *
 * ### Required Environment Variables
 *
 * ```bash
 * SAP_CLOUD_BASE_URL=https://your-system.s4hana.cloud.sap/
 * SAP_CLOUD_USERNAME=your-username
 * SAP_CLOUD_PASSWORD=your-password
 * ```
 *
 * ### Optional Environment Variables
 *
 * ```bash
 * SAP_CLIENT=100               # SAP client number (default: system default)
 * SAP_LANGUAGE=EN              # Logon language (default: EN)
 * SAP_AUTH_STRATEGY=form       # Auth strategy: form | basic | oauth
 * ```
 *
 * @intent Provide authenticated SAP page for AI agent discovery.
 * @capability Agent seed, SAP authentication, FLP readiness.
 */
import { test, expect } from 'playwright-praman';

test('sap-seed', async ({ page, ui5, sapAuth }) => {
  const baseUrl = process.env['SAP_CLOUD_BASE_URL'] ?? '';
  const username = process.env['SAP_CLOUD_USERNAME'] ?? '';
  const password = process.env['SAP_CLOUD_PASSWORD'] ?? '';

  // 1. Navigate to SAP system (networkidle for IDP redirect chain)
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });

  // 2. Authenticate INLINE (agent session has no storageState)
  await sapAuth.login(page, {
    url: baseUrl,
    username,
    password,
    client: process.env['SAP_CLIENT'],
    language: process.env['SAP_LANGUAGE'],
    strategy: process.env['SAP_AUTH_STRATEGY'],
  });

  // 3. Wait for UI5 to fully load and stabilize
  await ui5.waitForUI5();

  // 4. Verify FLP is ready
  const isAuth = await sapAuth.isAuthenticated(page);
  expect(isAuth).toBe(true);

  // 5. Page is now ready — pause keeps browser open for MCP agent
  await page.pause();
});
