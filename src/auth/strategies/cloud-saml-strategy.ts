/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * CloudSAML authentication strategy for SAP Cloud systems via IAS.
 *
 * @remarks
 * Handles SAML-based login through SAP Identity Authentication Service
 * (accounts.cloud.sap). Navigates to the SAP Cloud URL, follows the
 * redirect to IAS, fills the login form, and waits for the SAML
 * redirect back to the SAP Cloud domain.
 *
 * @module auth
 */

import { isAuthenticated } from '../auth-checks.js';
import type { AuthPage, AuthStrategy, SAPAuthConfig } from '../auth-types.js';

import { AuthError } from '#core/errors/auth-error.js';

/** Default auth timeout in milliseconds. */
const DEFAULT_AUTH_TIMEOUT = 60_000;

/** Strategy name constant to avoid duplicate string literals. */
const STRATEGY_NAME = 'cloud-saml';

/**
 * URL patterns that identify SAP Cloud systems.
 *
 * @remarks
 * Used by {@link isCloudUrl} to auto-detect cloud systems.
 */
const CLOUD_URL_PATTERNS: readonly RegExp[] = [
  /\.cloud\.sap(?:[/?#]|$)/iu,
  /\.s4hana\.cloud\.sap(?:[/?#]|$)/iu,
  /\.hana\.ondemand\.com(?:[/?#]|$)/iu,
  /\.cfapps\..*\.hana\.ondemand\.com(?:[/?#]|$)/iu,
];

/** IAS email/username field selector chain (classic + modern IAS forms). */
const IAS_USERNAME_SELECTORS = [
  'input[name="j_username"]',
  '#j_username',
  'input[name="email"]',
  'input[type="email"]',
  'input[name="loginfmt"]',
] as const;

/** IAS password field selector chain (classic + modern IAS forms). */
const IAS_PASSWORD_SELECTORS = [
  'input[name="j_password"]',
  '#j_password',
  'input[name="password"]',
  'input[type="password"]',
] as const;

/** IAS "Continue" button selectors for two-step login (username → Continue → password). */
const IAS_CONTINUE_SELECTORS = [
  'button:has-text("Continue")',
  'input[type="submit"][value="Continue"]',
  'button[type="submit"]',
] as const;

/** IAS submit button selector chain (classic + modern IAS forms). */
const IAS_SUBMIT_SELECTORS = ['#logOnFormSubmit', 'button[type="submit"]', 'form button'] as const;

/** Shell header selector indicating successful login. */
const SHELL_HEADER_SELECTOR = '#shell-header';

/**
 * Check if a URL matches known SAP Cloud URL patterns.
 *
 * @param url - URL string to check.
 * @returns `true` if the URL matches a known SAP Cloud pattern.
 *
 * @example
 * ```typescript
 * isCloudUrl('https://my-tenant.s4hana.cloud.sap'); // true
 * isCloudUrl('https://sap.local.corp'); // false
 * ```
 */
export function isCloudUrl(url: string): boolean {
  return CLOUD_URL_PATTERNS.some((pattern) => pattern.test(url));
}

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
 * await fillWithFallback(page, ['#field1', '#field2'], 'value', 'email', 30000);
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
    message: `IAS login form field not found: ${fieldName}`,
    attempted: `Find ${fieldName} field using selectors: ${selectors.join(', ')}`,
    retryable: false,
    strategy: STRATEGY_NAME,
    suggestions: [
      'Verify the SAP IAS login page is accessible',
      'Check if the SAML redirect completed successfully',
      `Ensure the ${fieldName} field is present on the IAS form`,
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
      // Use page.click() instead of page.evaluate(querySelector) because
      // Playwright pseudo-selectors like :has-text() are not valid CSS.
      await page.click(selector);
      return;
    } catch {
      // Selector not found, try next
    }
  }

  throw new AuthError({
    code: 'ERR_AUTH_FAILED',
    message: `IAS submit button not found: ${buttonName}`,
    attempted: `Find ${buttonName} button using selectors: ${selectors.join(', ')}`,
    retryable: false,
    strategy: STRATEGY_NAME,
    suggestions: [
      'Verify the IAS login page has a submit button',
      'Check if the IAS login page structure has changed',
    ],
  });
}

/**
 * CloudSAML authentication strategy for SAP Cloud via IAS.
 *
 * @remarks
 * Handles the full SAML authentication flow:
 * 1. Navigate to SAP Cloud URL
 * 2. Follow redirect to SAP Identity Authentication Service (IAS)
 * 3. Fill IAS login form (email/username + password)
 * 4. Submit and wait for SAML redirect back to SAP Cloud
 * 5. Verify shell header is visible
 *
 * @example
 * ```typescript
 * import { CloudSAMLAuthStrategy } from './strategies/cloud-saml-strategy.js';
 *
 * const strategy = new CloudSAMLAuthStrategy();
 * await strategy.authenticate(page, {
 *   url: 'https://my-tenant.s4hana.cloud.sap',
 *   username: 'user@example.com',
 *   password: 'secret',
 * });
 * ```
 */
export class CloudSAMLAuthStrategy implements AuthStrategy {
  /** {@inheritDoc AuthStrategy.name} */
  readonly name = 'cloud-saml' as const;

  /**
   * Authenticate against a SAP Cloud system via IAS SAML flow.
   *
   * @param page - Playwright page for browser interactions.
   * @param config - SAP authentication configuration.
   *
   * @example
   * ```typescript
   * const strategy = new CloudSAMLAuthStrategy();
   * await strategy.authenticate(page, config);
   * ```
   */
  async authenticate(page: AuthPage, config: Readonly<SAPAuthConfig>): Promise<void> {
    if (config.username === '') {
      throw new AuthError({
        code: 'ERR_AUTH_FAILED',
        message: 'Username/email is required for CloudSAML authentication',
        attempted: 'Validate CloudSAML auth credentials',
        retryable: false,
        strategy: STRATEGY_NAME,
        loginUrl: config.url,
        suggestions: ['Provide a non-empty username or email in the auth configuration'],
      });
    }

    if (config.password === '') {
      throw new AuthError({
        code: 'ERR_AUTH_FAILED',
        message: 'Password is required for CloudSAML authentication',
        attempted: 'Validate CloudSAML auth credentials',
        retryable: false,
        strategy: STRATEGY_NAME,
        loginUrl: config.url,
        suggestions: ['Provide a non-empty password in the auth configuration'],
      });
    }

    const timeout = config.timeout ?? DEFAULT_AUTH_TIMEOUT;

    // Navigate to SAP Cloud URL — this triggers SAML redirect to IAS
    await page.goto(config.url, { timeout });
    await page.waitForLoadState('domcontentloaded', { timeout });

    // Wait for IAS login form to appear (after SAML redirect)
    await fillWithFallback(
      page,
      IAS_USERNAME_SELECTORS,
      config.username,
      'email/username',
      timeout,
    );

    // Handle two-step IAS login: username → Continue → password → submit
    // Modern SAP IAS shows username first, then password after clicking "Continue".
    // Try to find the password field first (classic single-page form).
    // If not found within 3s, click the "Continue" button and wait for password.
    const SHORT_PROBE_TIMEOUT = 1000;
    let passwordVisible = false;
    for (const sel of IAS_PASSWORD_SELECTORS) {
      try {
        await page.waitForSelector(sel, { timeout: SHORT_PROBE_TIMEOUT });
        passwordVisible = true;
        break;
      } catch {
        // Not found yet
      }
    }

    if (!passwordVisible) {
      // Two-step flow: click "Continue" to reveal the password field
      await clickWithFallback(page, IAS_CONTINUE_SELECTORS, 'continue', timeout);
    }

    // Fill password (now visible after Continue or on classic single-page form)
    await fillWithFallback(page, IAS_PASSWORD_SELECTORS, config.password, 'password', timeout);

    // Click submit
    await clickWithFallback(page, IAS_SUBMIT_SELECTORS, 'submit', timeout);

    // Wait for SAML redirect back to SAP Cloud domain
    try {
      const cloudDomain = new URL(config.url).hostname;
      await page.waitForURL((url: URL) => url.hostname === cloudDomain, { timeout });
    } catch {
      throw new AuthError({
        code: 'ERR_AUTH_TIMEOUT',
        message: 'SAML redirect back to SAP Cloud domain did not complete',
        attempted: `Wait for redirect back to ${config.url} after IAS form submission`,
        retryable: true,
        strategy: STRATEGY_NAME,
        loginUrl: config.url,
        suggestions: [
          'Verify the IAS credentials are correct',
          'Check if the SAML configuration is valid',
          'Ensure the SAP Cloud system is accessible',
          'Increase the auth timeout for slow network conditions',
        ],
      });
    }

    // Wait for shell header (indicates successful login)
    try {
      await page.waitForSelector(SHELL_HEADER_SELECTOR, { timeout });
    } catch {
      throw new AuthError({
        code: 'ERR_AUTH_TIMEOUT',
        message: 'Shell header not visible after SAML login — authentication may have failed',
        attempted: `Wait for shell header (${SHELL_HEADER_SELECTOR}) after SAML redirect`,
        retryable: true,
        strategy: STRATEGY_NAME,
        loginUrl: config.url,
        suggestions: [
          'Verify the username/email and password are correct',
          'Check if the SAP Cloud system is accessible',
          'Increase the auth timeout if the system is slow',
          'Verify the SAML trust configuration between IAS and SAP Cloud',
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
