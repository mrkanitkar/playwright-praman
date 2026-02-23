/**
 * UI5 minimum version check — warns when running against unsupported versions.
 *
 * @remarks
 * Detects the running UI5 version via {@link createGetVersionScript} and
 * compares against the minimum supported version (1.96). Emits a warning
 * via the provided logger when the version is below minimum or undetectable.
 *
 * @module bridge
 */

import type { Page } from '@playwright/test';
import type { Logger } from 'pino';

import { createGetVersionScript } from './browser-scripts/get-version.js';

import { isAtLeast } from '#core/utils/version-compare.js';

/** Minimum supported UI5 version. */
const MINIMUM_UI5_VERSION = '1.96.0';

/**
 * Check the running UI5 version and warn if below minimum.
 *
 * @param page - Playwright page with UI5 loaded.
 * @param logger - Pino logger instance for emitting warnings.
 * @returns The detected UI5 version string.
 *
 * @example
 * ```typescript
 * const version = await checkUI5Version(page, log);
 * // Logs warning if version < 1.96.0
 * ```
 */
export async function checkUI5Version(page: Page, logger: Logger): Promise<string> {
  const script = createGetVersionScript();
  const version: string = await page.evaluate(script);

  if (version === '0.0.0') {
    logger.warn('UI5 version could not be detected — some features may not work correctly');
    return version;
  }

  if (!isAtLeast(version, MINIMUM_UI5_VERSION)) {
    logger.warn(
      { detected: version, minimum: MINIMUM_UI5_VERSION },
      `UI5 version ${version} is below minimum supported version ${MINIMUM_UI5_VERSION}`,
    );
  }

  return version;
}
