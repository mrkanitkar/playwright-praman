/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Test data fixtures -- Playwright fixture wrapping TestDataHandler.
 *
 * @ai
 * @aiContext Provides `testData` fixture for template-based data generation (uuid, timestamp placeholders),
 * JSON persistence, and automatic cleanup on teardown.
 *
 * @remarks
 * Provides a `testData` fixture that creates a {@link TestDataHandler}
 * scoped to the test's output directory. On teardown, all persisted
 * test data files are automatically cleaned up.
 *
 * @example
 * ```typescript
 * import { testDataTest } from '#fixtures/test-data-fixtures.js';
 *
 * testDataTest('generate and persist order', async ({ testData }) => {
 *   const order = testData.generate({ id: '{{uuid}}' });
 *   await testData.save('order.json', order);
 * });
 * ```
 *
 * @module fixtures
 */

import { join } from 'node:path';

import { test as base } from '@playwright/test';

import { TestDataHandler } from './test-data-handler.js';

// ── Public fixture types ─────────────────────────────────────────────────

/**
 * Fixture types for the test data handler.
 *
 * @example
 * ```typescript
 * import type { TestDataFixtures } from '#fixtures/test-data-fixtures.js';
 * ```
 */
export interface TestDataFixtures {
  /** Test data generation, persistence, and cleanup handler. */
  testData: TestDataHandler;
}

// ── Fixture definition ───────────────────────────────────────────────────

/**
 * Playwright test object extended with a test data fixture.
 *
 * @remarks
 * The `testData` fixture is scoped per-test. On teardown it calls
 * {@link TestDataHandler.cleanup | cleanup()} to remove all persisted files.
 *
 * @capability testData.generate
 *
 * @example
 * ```typescript
 * testDataTest('save and load', async ({ testData }) => {
 *   await testData.save('data.json', { key: 'value' });
 *   const loaded = await testData.load<{ key: string }>('data.json');
 * });
 * ```
 */
export const testDataTest = base.extend<TestDataFixtures>({
  // eslint-disable-next-line no-empty-pattern -- Playwright fixture pattern: ({}, use) is required when no deps
  testData: async ({}, use, testInfo) => {
    const baseDir = join(testInfo.outputDir, 'test-data');
    const handler = new TestDataHandler({ baseDir });

    await use(handler);

    // Auto-cleanup on teardown
    await handler.cleanup();
  },
});
