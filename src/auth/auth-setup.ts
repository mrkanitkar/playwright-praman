/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Playwright setup project file for SAP authentication.
 *
 * @remarks
 * This file is used as a Playwright setup project (`testProject.setup`)
 * to perform authentication once and save the browser storage state
 * for reuse across all test projects. It reads configuration from
 * environment variables and delegates to the auth handler.
 *
 * Configure in `playwright.config.ts`:
 * ```typescript
 * projects: [
 *   { name: 'setup', testMatch: /auth-setup\.ts/, teardown: 'teardown' },
 *   { name: 'teardown', testMatch: /auth-teardown\.ts/ },
 *   { name: 'tests', dependencies: ['setup'], use: { storageState: '.auth/sap-session.json' } },
 * ]
 * ```
 *
 * @example
 * ```typescript
 * // Referenced in playwright.config.ts as a setup project
 * // Environment variables: SAP_ACTIVE_SYSTEM, SAP_CLOUD_BASE_URL, etc.
 * ```
 *
 * @module auth
 */

import { join } from 'node:path';
import process from 'node:process';

import { test as setup } from '@playwright/test';

import type { AuthPage } from './auth-types.js';

const authFile = join(process.cwd(), '.auth', 'sap-session.json');

setup('SAP authentication', async ({ page, context }) => {
  // Dynamic imports to avoid bundling the full auth module at import time
  const { SAPAuthHandler } = await import('./auth-handler.js');
  const { createAuthStrategy } = await import('./auth-factory.js');
  const { createLogger } = await import('#core/logging/index.js');

  const logger = createLogger('auth-setup');

  // Build config from environment to detect the strategy
  const activeSystem = process.env['SAP_ACTIVE_SYSTEM'] ?? 'onprem';
  const isCloud = activeSystem === 'cloud';
  const url = isCloud
    ? (process.env['SAP_CLOUD_BASE_URL'] ?? '')
    : (process.env['SAP_ONPREM_BASE_URL'] ?? '');

  const strategy = createAuthStrategy({
    url,
    username: '',
    password: '',
    strategy: process.env['SAP_AUTH_STRATEGY'],
  });

  const handler = new SAPAuthHandler({ strategy, logger });

  // Build config from env and authenticate directly
  // Note: We call login() with a full config instead of loginFromEnv()
  // because loginFromEnv reads env vars internally, which we've already
  // read above. Both paths are equivalent.
  const username = isCloud
    ? (process.env['SAP_CLOUD_USERNAME'] ?? '')
    : (process.env['SAP_ONPREM_USERNAME'] ?? '');
  const password = isCloud
    ? (process.env['SAP_CLOUD_PASSWORD'] ?? '')
    : (process.env['SAP_ONPREM_PASSWORD'] ?? '');

  // Playwright's Page is a structural superset of AuthPage.
  const authPage: AuthPage = page;

  await handler.login(authPage, {
    url,
    username,
    password,
    client: process.env['SAP_CLIENT'],
    language: process.env['SAP_LANGUAGE'],
    strategy: process.env['SAP_AUTH_STRATEGY'],
  });

  // Save authenticated state for reuse by test projects
  await context.storageState({ path: authFile });
});
