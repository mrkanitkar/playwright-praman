/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * OnPrem authentication strategy for SAP on-premise systems.
 *
 * @remarks
 * Performs form-based login against SAP NetWeaver / ABAP systems
 * with selector fallback chains for different SAP UI5 versions.
 * Uses `page.evaluate()` for all DOM interactions to work with
 * the minimal `AuthPage` interface.
 *
 * @module auth
 */

import { isAuthenticated } from '../auth-checks.js';
import type { AuthPage, AuthStrategy, SAPAuthConfig } from '../auth-types.js';

import { AuthError } from '#core/errors/auth-error.js';

/** Default auth timeout in milliseconds. */
const DEFAULT_AUTH_TIMEOUT = 30_000;

/** Strategy name constant to avoid duplicate string literals. */
const STRATEGY_NAME = 'onprem';

/** Username field selector chain (ordered by priority). */
const USERNAME_SELECTORS = ['#USERNAME_FIELD-inner', 'input[name="sap-user"]'] as const;

/** Password field selector chain (ordered by priority). */
const PASSWORD_SELECTORS = ['#PASSWORD_FIELD-inner', 'input[name="sap-password"]'] as const;

/** Client field selector chain. */
const CLIENT_SELECTORS = ['#CLIENT_FIELD-inner', 'input[name="sap-client"]'] as const;

/** Language field selector chain. */
const LANGUAGE_SELECTORS = ['input[name="sap-language"]'] as const;

/** Submit button selector chain. */
const SUBMIT_SELECTORS = ['#LOGIN_LINK', 'button[type="submit"]'] as const;

/** Shell header selector indicating successful login. */
const SHELL_HEADER_SELECTOR = '#shell-header';

/**
 * Fill a form field using a selector fallback chain via page.evaluate().
 *
 * @param page - Page to evaluate against.
 * @param selectors - Ordered list of CSS selectors to try.
 * @param value - Value to fill into the field.
 * @param fieldName - Human-readable field name for error messages.
 * @param timeout - Timeout in ms to wait for a selector to appear.
 *
 * @example
 * ```typescript
 * await fillWithFallback(page, ['#field1', '#field2'], 'value', 'username', 30000);
 * ```
 */
async function fillWithFallback(
  page: AuthPage,
  selectors: readonly string[],
  value: string,
  fieldName: string,
  timeout: number,
): Promise<void> {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout });

      await page.evaluate(
        (args: { selector: string; value: string }) => {
          const element = document.querySelector<HTMLInputElement>(args.selector);
          if (element !== null) {
            element.value = args.value;
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
          }
        },
        { selector, value },
      );
      return;
    } catch {
      // Selector not found, try next
    }
  }

  throw new AuthError({
    code: 'ERR_AUTH_FAILED',
    message: `Login form field not found: ${fieldName}`,
    attempted: `Find ${fieldName} field using selectors: ${selectors.join(', ')}`,
    retryable: false,
    strategy: STRATEGY_NAME,
    suggestions: [
      `Verify the SAP login page contains a ${fieldName} field`,
      'Check if the page has fully loaded before authentication',
      'Ensure the SAP system URL is correct',
    ],
  });
}

/**
 * Click a button using a selector fallback chain via page.evaluate().
 *
 * @param page - Page to evaluate against.
 * @param selectors - Ordered list of CSS selectors to try.
 * @param buttonName - Human-readable button name for error messages.
 * @param timeout - Timeout in ms to wait for a selector to appear.
 *
 * @example
 * ```typescript
 * await clickWithFallback(page, ['#btn1', '#btn2'], 'submit', 30000);
 * ```
 */
async function clickWithFallback(
  page: AuthPage,
  selectors: readonly string[],
  buttonName: string,
  timeout: number,
): Promise<void> {
  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout });

      await page.evaluate((sel: string) => {
        const element = document.querySelector<HTMLElement>(sel);
        if (element !== null) {
          element.click();
        }
      }, selector);
      return;
    } catch {
      // Selector not found, try next
    }
  }

  throw new AuthError({
    code: 'ERR_AUTH_FAILED',
    message: `Login button not found: ${buttonName}`,
    attempted: `Find ${buttonName} button using selectors: ${selectors.join(', ')}`,
    retryable: false,
    strategy: STRATEGY_NAME,
    suggestions: [
      'Verify the SAP login page has a submit button',
      'Check if the login page structure matches expected SAP format',
    ],
  });
}

/**
 * OnPrem authentication strategy for SAP on-premise systems.
 *
 * @remarks
 * Handles form-based login with selector fallback chains for
 * different SAP UI5 versions and system configurations. Supports
 * optional client and language fields.
 *
 * @example
 * ```typescript
 * import { OnPremAuthStrategy } from './strategies/onprem-strategy.js';
 *
 * const strategy = new OnPremAuthStrategy();
 * await strategy.authenticate(page, {
 *   url: 'https://sap.example.com',
 *   username: 'admin',
 *   password: 'secret',
 *   client: '100',
 * });
 * ```
 */
export class OnPremAuthStrategy implements AuthStrategy {
  /** {@inheritDoc AuthStrategy.name} */
  readonly name = 'onprem' as const;

  /**
   * Authenticate against an on-premise SAP system.
   *
   * @param page - Playwright page for browser interactions.
   * @param config - SAP authentication configuration.
   *
   * @example
   * ```typescript
   * const strategy = new OnPremAuthStrategy();
   * await strategy.authenticate(page, config);
   * ```
   */
  async authenticate(page: AuthPage, config: Readonly<SAPAuthConfig>): Promise<void> {
    if (config.username === '') {
      throw new AuthError({
        code: 'ERR_AUTH_FAILED',
        message: 'Username is required for OnPrem authentication',
        attempted: 'Validate OnPrem auth credentials',
        retryable: false,
        strategy: STRATEGY_NAME,
        loginUrl: config.url,
        suggestions: ['Provide a non-empty username in the auth configuration'],
      });
    }

    if (config.password === '') {
      throw new AuthError({
        code: 'ERR_AUTH_FAILED',
        message: 'Password is required for OnPrem authentication',
        attempted: 'Validate OnPrem auth credentials',
        retryable: false,
        strategy: STRATEGY_NAME,
        loginUrl: config.url,
        suggestions: ['Provide a non-empty password in the auth configuration'],
      });
    }

    const timeout = config.timeout ?? DEFAULT_AUTH_TIMEOUT;

    await page.goto(config.url, { timeout });
    await page.waitForLoadState('domcontentloaded', { timeout });

    // Fill username
    await fillWithFallback(page, USERNAME_SELECTORS, config.username, 'username', timeout);

    // Fill password
    await fillWithFallback(page, PASSWORD_SELECTORS, config.password, 'password', timeout);

    // Fill optional client field
    if (config.client !== undefined && config.client !== '') {
      try {
        await fillWithFallback(page, CLIENT_SELECTORS, config.client, 'client', 3_000);
      } catch {
        // Client field is optional — ignore if not found
      }
    }

    // Fill optional language field
    if (config.language !== undefined && config.language !== '') {
      try {
        await fillWithFallback(page, LANGUAGE_SELECTORS, config.language, 'language', 3_000);
      } catch {
        // Language field is optional — ignore if not found
      }
    }

    // Click submit
    await clickWithFallback(page, SUBMIT_SELECTORS, 'submit', timeout);

    // Wait for shell header (indicates successful login)
    try {
      await page.waitForSelector(SHELL_HEADER_SELECTOR, { timeout });
    } catch {
      throw new AuthError({
        code: 'ERR_AUTH_TIMEOUT',
        message: 'Shell header not visible after login — authentication may have failed',
        attempted: `Wait for shell header (${SHELL_HEADER_SELECTOR}) after form submission`,
        retryable: true,
        strategy: STRATEGY_NAME,
        loginUrl: config.url,
        suggestions: [
          'Verify the username and password are correct',
          'Check if the SAP system is accessible',
          'Increase the auth timeout if the system is slow',
          'Verify the SAP client number if required',
        ],
      });
    }
  }

  /**
   * Check if the current page is authenticated.
   *
   * @param page - Playwright page to check.
   * @returns `true` if the shell header is visible and no login form is present.
   *
   * @example
   * ```typescript
   * const isAuth = await strategy.isAuthenticated(page);
   * ```
   */
  async isAuthenticated(page: AuthPage): Promise<boolean> {
    return isAuthenticated(page);
  }
}
