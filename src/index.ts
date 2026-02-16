/**
 * Praman v1.0 — AI-First SAP UI5 Test Automation Platform for Playwright.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('create purchase order', async ({ page, ui5, navigation }) => {
 *   await navigation.openTileByTitle('Create Purchase Order');
 *   const input = await ui5.control({ id: 'vendorInput' });
 *   await input.setValue('V001');
 * });
 * ```
 */
export { test, expect } from '@playwright/test';
// Config module will be exported when implemented
// export { defineConfig } from './core/config/index.js';

/**
 * Praman library version.
 *
 * @example
 * ```typescript
 * import { VERSION } from 'playwright-praman';
 * console.log(VERSION);
 * ```
 */
export const VERSION = '1.0.0-dev' as const;
