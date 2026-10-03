/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Fixture exposing native browser dialog diagnostics.
 *
 * @remarks
 * Installs in **detect-only** mode: it attaches `dialogclosed` and nothing
 * else, so Playwright keeps auto-dismissing dialogs exactly as it would
 * without Praman. Merely having the fixture changes no behaviour — which is
 * the only safe default, because attaching a `dialog` listener makes the
 * listener responsible for every dialog and one left unanswered freezes the
 * page.
 *
 * A test that wants dialogs *answered* opts in explicitly via
 * `nativeDialogs.register(...)`.
 *
 * Records are attached to the test as `native-dialogs` JSON when any dialog
 * was seen, so a silently auto-dismissed `beforeunload` — the SAP
 * unsaved-changes warning — shows up in the report instead of vanishing.
 *
 * @example
 * ```typescript
 * nativeDialogTest('navigating away does not strand unsaved changes',
 *   async ({ page, nativeDialogs }) => {
 *     await page.goto('/app#/edit');
 *     await page.goto('/app#/list');
 *     // nativeDialogs.records lists any beforeunload the browser raised
 *   });
 * ```
 *
 * @module fixtures
 */

import { Buffer } from 'node:buffer';

import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

import { NativeDialogHandler } from './native-dialog-handler.js';

import { createLogger } from '#core/logging/logger.js';

/**
 * Fixtures contributed by {@link nativeDialogTest}.
 *
 * @example
 * ```typescript
 * const fixtures: NativeDialogFixtures = { nativeDialogs: handler };
 * ```
 */
export interface NativeDialogFixtures {
  /** Records native dialogs; can be given rules to answer them. */
  nativeDialogs: NativeDialogHandler;
}

/**
 * Test object providing the `nativeDialogs` fixture.
 *
 * @remarks
 * Not `auto: true`. An auto fixture would attach `dialogclosed` to every test
 * whether or not it cares, and while that is behaviour-neutral it is still
 * work and noise a test never asked for. Depend on `nativeDialogs` to get it.
 *
 * @example
 * ```typescript
 * import { nativeDialogTest } from 'playwright-praman';
 *
 * nativeDialogTest('sees the confirm', async ({ nativeDialogs }) => {
 *   // ...
 * });
 * ```
 */
export const nativeDialogTest = base.extend<NativeDialogFixtures>({
  nativeDialogs: async ({ page }: { page: Page }, use, testInfo) => {
    const log = createLogger('native-dialog-fixture');
    const handler = new NativeDialogHandler({ page });

    // Detect-only: observes, never answers, so auto-dismissal is untouched.
    handler.observe();

    await use(handler);

    if (handler.records.length > 0) {
      try {
        await testInfo.attach('native-dialogs', {
          contentType: 'application/json',
          body: Buffer.from(JSON.stringify(handler.records, null, 2), 'utf8'),
        });
      } catch (error: unknown) {
        // Diagnostics are a convenience; never fail a test because of them.
        log.debug({ err: error }, 'Native dialog attachment failed (non-fatal)');
      }
    }

    handler.dispose();
  },
});
