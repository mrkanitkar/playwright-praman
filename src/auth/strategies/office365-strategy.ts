/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Office365 / Azure AD authentication strategy for SAP systems.
 *
 * @remarks
 * Handles the multi-step Microsoft Office 365 login flow:
 * navigate to SAP URL, redirect to `login.microsoftonline.com`,
 * fill email, click Next, fill password, submit, handle KMSI prompt,
 * wait for SAML redirect back to SAP shell.
 *
 * Uses `AuthPage` methods (goto, waitForSelector, evaluate) matching
 * the patterns established by OnPrem and CloudSAML strategies.
 *
 * @example
 * ```typescript
 * import { Office365AuthStrategy } from './office365-strategy.js';
 *
 * const strategy = new Office365AuthStrategy();
 * await strategy.authenticate(page, config);
 * ```
 *
 * @module auth
 */

import { isAuthenticated } from '../auth-checks.js';
import type { AuthPage, AuthStrategy, SAPAuthConfig } from '../auth-types.js';

import { AuthError } from '#core/errors/auth-error.js';

/** Default timeout in milliseconds for each login step. */
const DEFAULT_AUTH_TIMEOUT = 30_000;

/** Short timeout in milliseconds for the optional KMSI prompt. */
const KMSI_TIMEOUT = 3000;

/** Office365 email field selector. */
const EMAIL_SELECTOR = 'input[name="loginfmt"]';

/** Office365 secret field selector. */
const O365_SECRET_FIELD_SELECTOR = 'input[name="passwd"]';

/** Office365 Next/Submit button selector chain. */
const NEXT_SELECTORS = ['input[type="submit"]'] as const;

/** Office365 Sign In submit button selector. */
const SIGNIN_SELECTOR = 'input[data-report-event="Signin_Submit"]';

/** KMSI "Yes" button selector (Stay signed in). */
const KMSI_YES_SELECTOR = '#idSIButton9';

/** KMSI "No" button selector (Don't stay signed in). */
const KMSI_NO_SELECTOR = '#idBtn_Back';

/** Shell header selector indicating successful login. */
const SHELL_HEADER_SELECTOR = '#shell-header';

/**
 * Microsoft Office 365 / Azure AD authentication strategy.
 *
 * @remarks
 * Implements the multi-step Office 365 login flow used by SAP BTP
 * systems configured with Azure AD as the identity provider.
 *
 * @example
 * ```typescript
 * const strategy = new Office365AuthStrategy();
 * await strategy.authenticate(page, {
 *   url: 'https://my-sap.example.com',
 *   username: 'user@company.com',
 *   password: 'secret',
 *   staySignedIn: false,
 * });
 * ```
 */
export class Office365AuthStrategy implements AuthStrategy {
  /** {@inheritDoc AuthStrategy.name} */
  readonly name = 'office365' as const;

  /**
   * Authenticate via Office 365 / Azure AD multi-step login.
   *
   * @param page - AuthPage for browser interactions.
   * @param config - SAP authentication configuration.
   * @throws {@link AuthError} When login form is not found or credentials are rejected.
   *
   * @example
   * ```typescript
   * await strategy.authenticate(page, config);
   * ```
   */
  async authenticate(page: AuthPage, config: Readonly<SAPAuthConfig>): Promise<void> {
    const timeout = config.timeout ?? DEFAULT_AUTH_TIMEOUT;

    // Step 1: Navigate to SAP URL (triggers Azure AD redirect)
    await page.goto(config.url, { timeout });
    await page.waitForLoadState('domcontentloaded', { timeout });

    // Step 2: Wait for email field and fill it
    await waitAndFill(page, EMAIL_SELECTOR, config.username, 'email', timeout);

    // Step 3: Click Next button
    await waitAndClick(page, NEXT_SELECTORS, 'Next', timeout);

    // Step 4: Wait for password field and fill it
    await waitAndFill(page, O365_SECRET_FIELD_SELECTOR, config.password, 'password', timeout);

    // Step 5: Click Sign in submit button
    await waitAndClick(page, [SIGNIN_SELECTOR], 'Sign in', timeout);

    // Step 6: Handle "Stay signed in?" (KMSI) prompt -- may not appear
    await handleKmsiPrompt(page, config.staySignedIn ?? false);

    // Step 7: Wait for SAP shell header (authentication complete)
    try {
      await page.waitForSelector(SHELL_HEADER_SELECTOR, { timeout });
    } catch {
      throw new AuthError({
        code: 'ERR_AUTH_TIMEOUT',
        message: 'SAP shell header not found after Office365 authentication',
        attempted: 'Wait for SAP Fiori Launchpad shell after SAML redirect',
        retryable: true,
        strategy: 'office365',
        loginUrl: config.url,
        suggestions: [
          'Verify SAML redirect from Azure AD completed successfully',
          'Check if Office365 credentials were accepted',
          'Increase the authentication timeout',
        ],
      });
    }
  }

  /**
   * Check if the current page is authenticated.
   *
   * @param page - AuthPage to check.
   * @returns `true` if the SAP shell is visible and no login form is present.
   *
   * @example
   * ```typescript
   * const loggedIn = await strategy.isAuthenticated(page);
   * ```
   */
  async isAuthenticated(page: AuthPage): Promise<boolean> {
    return isAuthenticated(page);
  }
}

/**
 * Wait for a selector and fill the field with a value.
 *
 * @param page - AuthPage instance.
 * @param selector - CSS selector of the input field.
 * @param value - Value to fill.
 * @param fieldName - Human-readable field name for error messages.
 * @param timeout - Timeout in milliseconds.
 *
 * @example
 * ```typescript
 * await waitAndFill(page, 'input[name="loginfmt"]', 'user@co.com', 'email', 30000);
 * ```
 */
async function waitAndFill(
  page: AuthPage,
  selector: string,
  value: string,
  fieldName: string,
  timeout: number,
): Promise<void> {
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
  } catch {
    throw new AuthError({
      code: 'ERR_AUTH_FAILED',
      message: `Office365 login form field not found: ${fieldName}`,
      attempted: `Fill Office365 login field: ${selector}`,
      retryable: true,
      strategy: 'office365',
      suggestions: [
        'Verify the page redirected to login.microsoftonline.com',
        'Check if the Azure AD tenant is configured correctly',
        'The login page structure may have changed',
      ],
    });
  }
}

/**
 * Wait for a selector from a fallback chain and click it.
 *
 * @param page - AuthPage instance.
 * @param selectors - Ordered list of CSS selectors to try.
 * @param buttonName - Human-readable button name for error messages.
 * @param timeout - Timeout in milliseconds.
 *
 * @example
 * ```typescript
 * await waitAndClick(page, ['input[type="submit"]'], 'Next', 30000);
 * ```
 */
async function waitAndClick(
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
    message: `Office365 button not found: ${buttonName}`,
    attempted: `Click Office365 ${buttonName} button using selectors: ${selectors.join(', ')}`,
    retryable: true,
    strategy: 'office365',
    suggestions: [
      'Verify the page redirected to login.microsoftonline.com',
      'Check if the Azure AD login page structure has changed',
    ],
  });
}

/**
 * Handle the "Stay signed in?" (KMSI) prompt if it appears.
 *
 * @param page - AuthPage instance.
 * @param staySignedIn - Whether to click "Yes" or "No".
 *
 * @example
 * ```typescript
 * await handleKmsiPrompt(page, true);
 * ```
 */
async function handleKmsiPrompt(page: AuthPage, staySignedIn: boolean): Promise<void> {
  const kmsiSelector = staySignedIn ? KMSI_YES_SELECTOR : KMSI_NO_SELECTOR;

  try {
    await page.waitForSelector(kmsiSelector, { timeout: KMSI_TIMEOUT });

    await page.evaluate((sel: string) => {
      const element = document.querySelector<HTMLElement>(sel);
      if (element !== null) {
        element.click();
      }
    }, kmsiSelector);
  } catch {
    // KMSI prompt did not appear -- this is expected and not an error
  }
}
