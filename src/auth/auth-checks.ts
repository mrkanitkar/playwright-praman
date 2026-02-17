/**
 * Authentication status check functions.
 *
 * @remarks
 * Pure check functions that detect authentication state by examining
 * the page DOM. Used by auth strategies and fixtures to verify
 * login status without performing authentication.
 *
 * @module auth
 */

import type { BridgePage } from '#bridge/adapter.js';

/**
 * Check if the SAP Fiori shell header is visible.
 *
 * @param page - Playwright page to check.
 * @returns `true` if the shell header element exists and is visible.
 *
 * @example
 * ```typescript
 * const shellVisible = await isShellVisible(page);
 * ```
 */
export async function isShellVisible(page: BridgePage): Promise<boolean> {
  try {
    return await page.evaluate(() => {
      const shellHeader =
        document.querySelector('#shell-header') ?? document.querySelector('.sapUshellShellHead');
      if (shellHeader === null) {
        return false;
      }
      const style = window.getComputedStyle(shellHeader);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  } catch {
    return false;
  }
}

/**
 * Check if the SAP user menu/avatar button is visible.
 *
 * @param page - Playwright page to check.
 * @returns `true` if the user menu button exists and is visible.
 *
 * @example
 * ```typescript
 * const menuVisible = await isUserMenuVisible(page);
 * ```
 */
export async function isUserMenuVisible(page: BridgePage): Promise<boolean> {
  try {
    return await page.evaluate(() => {
      const userMenu =
        document.querySelector('#meAreaHeaderButton') ??
        document.querySelector('.sapUshellMeAreaHeaderButton');
      if (userMenu === null) {
        return false;
      }
      const style = window.getComputedStyle(userMenu);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  } catch {
    return false;
  }
}

/**
 * Check if the UI5 framework is loaded on the page.
 *
 * @param page - Playwright page to check.
 * @returns `true` if `sap.ui.require` is available.
 *
 * @example
 * ```typescript
 * const ui5Ready = await isUI5Loaded(page);
 * ```
 */
export async function isUI5Loaded(page: BridgePage): Promise<boolean> {
  try {
    return await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison */
      return (
        typeof sap !== 'undefined' && sap.ui !== undefined && typeof sap.ui.require === 'function'
      );
      /* eslint-enable @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison */
    });
  } catch {
    return false;
  }
}

/**
 * Check if any SAP login form is visible on the page.
 *
 * @remarks
 * Detects common login form selectors across SAP authentication methods:
 * - OnPrem: `#USERNAME_FIELD-inner`, `input[name="sap-user"]`
 * - Cloud SAML: `#j_username`, `input[name="j_username"]`
 * - Office365: `input[name="loginfmt"]`
 *
 * @param page - Playwright page to check.
 * @returns `true` if any login form element is found.
 *
 * @example
 * ```typescript
 * const hasLoginForm = await isLoginPageVisible(page);
 * ```
 */
export async function isLoginPageVisible(page: BridgePage): Promise<boolean> {
  try {
    return await page.evaluate(() => {
      const loginSelectors = [
        '#USERNAME_FIELD-inner',
        'input[name="sap-user"]',
        '#j_username',
        'input[name="j_username"]',
        'input[name="loginfmt"]',
      ];
      return loginSelectors.some((selector) => document.querySelector(selector) !== null);
    });
  } catch {
    return false;
  }
}

/**
 * Composite authentication check.
 *
 * @remarks
 * Returns `true` only when the shell header is visible AND no login
 * form is detected. This guards against edge cases where the shell
 * briefly renders before a re-authentication redirect.
 *
 * @param page - Playwright page to check.
 * @returns `true` if authenticated (shell visible, no login form).
 *
 * @example
 * ```typescript
 * const loggedIn = await isAuthenticated(page);
 * if (!loggedIn) {
 *   await strategy.authenticate(page, config);
 * }
 * ```
 */
export async function isAuthenticated(page: BridgePage): Promise<boolean> {
  try {
    const shellVisible = await isShellVisible(page);
    if (!shellVisible) {
      return false;
    }
    const loginVisible = await isLoginPageVisible(page);
    return !loginVisible;
  } catch {
    return false;
  }
}
