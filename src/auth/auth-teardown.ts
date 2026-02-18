/**
 * Playwright teardown project file for SAP authentication cleanup.
 *
 * @remarks
 * This file is used as a Playwright teardown project to clean up
 * stored authentication state after all tests complete. It removes
 * the `.auth/` directory that was created by the auth setup project.
 *
 * Configure in `playwright.config.ts`:
 * ```typescript
 * projects: [
 *   { name: 'setup', testMatch: /auth-setup\.ts/, teardown: 'teardown' },
 *   { name: 'teardown', testMatch: /auth-teardown\.ts/ },
 * ]
 * ```
 *
 * @example
 * ```typescript
 * // Referenced in playwright.config.ts as a teardown project
 * ```
 *
 * @module auth
 */

import { rmSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import { test as teardown } from '@playwright/test';

teardown('SAP auth cleanup', () => {
  const authDir = join(process.cwd(), '.auth');

  rmSync(authDir, { recursive: true, force: true });
});
