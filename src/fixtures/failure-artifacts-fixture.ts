/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Failure artifacts fixture — auto-captures diagnostic artifacts on test failure.
 *
 * @ai
 * @aiContext Auto-enabled fixture that captures screenshot, UI5 control tree,
 * page context, and PramanError suggestions when a test fails. Artifacts appear
 * in the Playwright HTML reporter and trace viewer alongside other test attachments.
 *
 * @remarks
 * Provides one auto test-scoped fixture:
 * - `failureArtifactsCapture` — checks `testInfo.status !== testInfo.expectedStatus`
 *   on teardown and, when the test has failed, attaches:
 *   1. Screenshot (PNG) as `'failure-screenshot'`
 *   2. UI5 control tree snapshot (JSON) as `'failure-control-tree'`
 *   3. Page URL and title (JSON) as `'failure-context'`
 *   4. PramanError suggestions (text) as `'praman-failure-suggestions'`
 *
 * All capture logic is wrapped in try/catch — failure artifacts NEVER cause
 * secondary test failures. If capture itself fails, a debug log is emitted.
 *
 * The fixture is enabled by default. Set `captureFailureArtifacts: false` in
 * config or `PRAMAN_CAPTURE_FAILURE_ARTIFACTS=false` env var to disable.
 *
 * Dependencies from coreTest (via mergeTests):
 * - `page` — Playwright built-in
 * - `pramanConfig` — from coreTest worker fixtures
 *
 * @example
 * ```typescript
 * // No setup needed — included in the merged `test` export.
 * // Artifacts are attached automatically on any test failure.
 * import { test } from 'playwright-praman';
 *
 * test('my test', async ({ ui5 }) => {
 *   // If this test fails, screenshot + control tree are auto-attached
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Disable failure artifact capture via config
 * import { defineConfig } from 'playwright-praman';
 *
 * export default defineConfig({
 *   captureFailureArtifacts: false,
 * });
 * ```
 *
 * @module fixtures
 */

import { Buffer } from 'node:buffer';

import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

import { createControlTreeScript } from '#bridge/browser-scripts/control-tree.js';
import type { PramanConfig } from '#core/config/index.js';
import { createLogger } from '#core/logging/index.js';

// ── Types ────────────────────────────────────────────────────────────

/**
 * Failure artifacts fixture types.
 *
 * @remarks
 * The fixture is `void` because it is an auto side-effect fixture.
 *
 * @example
 * ```typescript
 * import type { FailureArtifactsFixtures } from '#fixtures/failure-artifacts-fixture.js';
 * ```
 */
export interface FailureArtifactsFixtures {
  /** Captures diagnostic artifacts on test failure and attaches them to test info. */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Playwright fixtures use void for side-effect-only fixtures
  failureArtifactsCapture: void;
}

/**
 * Dependency fixture types required by failure artifacts fixtures.
 *
 * @remarks
 * These come from coreTest via mergeTests and are declared here
 * as `{ option: true }` placeholders (PW-MERGE-1 pattern) so
 * they don't collide with the real definitions in coreTest.
 */
export interface FailureArtifactsDeps {
  /** Validated, frozen Praman configuration (from coreTest). */
  pramanConfig: Readonly<PramanConfig>;
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Pattern to match PramanError `Suggestions:` blocks in error messages. */
const SUGGESTIONS_PATTERN = /Suggestions:\n([\s\S]*?)(?:\n\n|$)/;

/**
 * Extracts suggestions text from Playwright TestInfo error objects.
 *
 * @remarks
 * PramanError serializes its `suggestions[]` array into the error message
 * using the format `Suggestions:\n bullet 1\n bullet 2`. This function
 * extracts those blocks from all errors and returns them as trimmed strings.
 *
 * @param errors - Array of TestInfo error objects (with optional `message`)
 * @returns Array of extracted suggestion text blocks (may be empty)
 */
function extractSuggestionsFromErrors(errors: readonly { message?: string }[]): string[] {
  const suggestions: string[] = [];
  for (const error of errors) {
    const message = error.message;
    if (message === undefined || message === '') {
      continue;
    }
    const captured = SUGGESTIONS_PATTERN.exec(message)?.[1];
    if (captured !== undefined) {
      suggestions.push(captured.trim());
    }
  }
  return suggestions;
}

// ── Fixture ──────────────────────────────────────────────────────────

/**
 * Failure artifacts test object with automatic diagnostic capture on test failure.
 *
 * @remarks
 * Extends `@playwright/test` base with one auto test-scoped fixture:
 *
 * `failureArtifactsCapture` — on teardown, checks whether the test failed.
 * If so, captures a full-page screenshot, the UI5 control tree, and page
 * metadata (URL + title) as Playwright test attachments.
 *
 * All capture operations are individually try/catch-wrapped so that a
 * failure in one (e.g., page already closed) does not prevent the others
 * from running, and NEVER causes a secondary test failure.
 *
 * @example
 * ```typescript
 * import { failureArtifactsTest } from '#fixtures/failure-artifacts-fixture.js';
 *
 * failureArtifactsTest('page loads with failure capture', async ({ page }) => {
 *   // failureArtifactsCapture is auto-active
 * });
 * ```
 */
export const failureArtifactsTest = base.extend<FailureArtifactsFixtures, FailureArtifactsDeps>({
  // Placeholder — provided by coreTest via mergeTests (PW-MERGE-1)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  pramanConfig: [undefined!, { option: true, scope: 'worker' }],

  failureArtifactsCapture: [
    async (
      { page, pramanConfig }: { page: Page; pramanConfig: Readonly<PramanConfig> },
      use,
      testInfo,
    ) => {
      await use();

      // Check if capture is explicitly disabled via config.
      // When captureFailureArtifacts is undefined (standalone usage without loadConfig),
      // default to enabled. Zod schema defaults to true in production.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare -- explicit false check needed: undefined means "use default (enabled)"
      if (pramanConfig.captureFailureArtifacts === false) {
        return;
      }

      // Only capture on failure (status !== expectedStatus)
      if (testInfo.status === testInfo.expectedStatus) {
        return;
      }

      const log = createLogger('failure-artifacts');

      // 1. Screenshot capture
      try {
        const screenshot = await page.screenshot({ fullPage: true });
        await testInfo.attach('failure-screenshot', {
          contentType: 'image/png',
          body: screenshot,
        });
        log.debug('Failure screenshot attached to test artifacts');
      } catch (screenshotError: unknown) {
        log.debug({ err: screenshotError }, 'Failure screenshot capture failed (non-fatal)');
      }

      // 2. UI5 control tree capture
      try {
        const script = createControlTreeScript({ maxDepth: 10, maxControls: 5_000 });
        const snapshot: unknown = await page.evaluate(script);

        if (snapshot !== null && snapshot !== undefined) {
          await testInfo.attach('failure-control-tree', {
            contentType: 'application/json',
            body: Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8'),
          });
          log.debug('Failure control tree attached to test artifacts');
        }
      } catch (treeError: unknown) {
        log.debug({ err: treeError }, 'Failure control tree capture failed (non-fatal)');
      }

      // 3. Page context (URL + title)
      try {
        const context = {
          url: page.url(),
          title: await page.title(),
          capturedAt: new Date().toISOString(),
        };
        await testInfo.attach('failure-context', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(context, null, 2), 'utf8'),
        });
        log.debug('Failure page context attached to test artifacts');
      } catch (contextError: unknown) {
        log.debug({ err: contextError }, 'Failure page context capture failed (non-fatal)');
      }

      // 4. PramanError suggestions extraction
      try {
        const suggestions = extractSuggestionsFromErrors(testInfo.errors);
        if (suggestions.length > 0) {
          await testInfo.attach('praman-failure-suggestions', {
            contentType: 'text/plain',
            body: Buffer.from(suggestions.join('\n\n---\n\n'), 'utf8'),
          });
          log.debug('Failure suggestions attached to test artifacts');
        }
      } catch (suggestionsError: unknown) {
        log.debug({ err: suggestionsError }, 'Failure suggestions capture failed (non-fatal)');
      }
    },
    { auto: true },
  ],
});
