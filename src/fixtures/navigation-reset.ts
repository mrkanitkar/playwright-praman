/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Shared navigation-reset helper for Praman fixtures.
 *
 * @remarks
 * Deduplicates the `framenavigated` listener pattern used across core-fixtures,
 * module-fixtures, and nav-fixtures. After a full-page navigation the injected
 * bridge script is gone, so the injection state must be cleared so the next
 * bridge operation triggers a fresh injection.
 *
 * @module fixtures
 */

import type { Frame, Page } from '@playwright/test';
import type { Logger } from 'pino';

import { resetPageInjection } from '#bridge/injection.js';

/**
 * Attaches a `framenavigated` listener that clears the bridge injection state
 * whenever the **main frame** navigates away.
 *
 * @param page - The Playwright `Page` to listen on.
 * @param logger - Optional pino logger; when supplied a `debug` message is
 *   emitted on each main-frame navigation.
 * @returns A cleanup function that removes the listener.
 *
 * @capability fixtures.attachBridgeNavigationReset
 *
 * @example
 * ```typescript
 * const detach = attachBridgeNavigationReset(page, logger);
 * try {
 *   await use(handler);
 * } finally {
 *   detach();
 * }
 * ```
 */
export function attachBridgeNavigationReset(page: Page, logger?: Logger): () => void {
  const listener = (frame: Frame): void => {
    if (frame === page.mainFrame()) {
      logger?.debug('Main frame navigated — clearing bridge injection state');
      resetPageInjection(page);
    }
  };
  page.on('framenavigated', listener);
  return () => {
    page.off('framenavigated', listener);
  };
}
