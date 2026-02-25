/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * API-based headless authentication strategy for SAP systems.
 *
 * @remarks
 * Performs authentication without browser UI interaction by making
 * a POST request from the browser context, extracting cookies from
 * the response, and setting them on the page. Uses `page.evaluate()`
 * with `fetch()` to POST credentials directly.
 *
 * @example
 * ```typescript
 * import { APIAuthStrategy } from './api-strategy.js';
 *
 * const strategy = new APIAuthStrategy();
 * await strategy.authenticate(page, config);
 * ```
 *
 * @module auth
 */

import { isAuthenticated } from '../auth-checks.js';
import type { AuthPage, AuthStrategy, SAPAuthConfig } from '../auth-types.js';

import { AuthError } from '#core/errors/auth-error.js';

/** Default login endpoint path. */
const DEFAULT_LOGIN_ENDPOINT = '/sap/public/bc/sec/login';

/** Default timeout in milliseconds for the API request. */
const DEFAULT_TIMEOUT = 30_000;

/** Result shape returned from the browser-side fetch call. */
interface FetchLoginResult {
  readonly ok: boolean;
  readonly status: number;
  readonly cookiesBefore: string;
  readonly cookiesAfter: string;
}

/**
 * API-based headless authentication strategy.
 *
 * @remarks
 * Uses `page.evaluate()` with `fetch()` to POST credentials directly
 * to the SAP login endpoint from within the browser context. Cookies
 * are set automatically by the browser on successful login.
 *
 * @example
 * ```typescript
 * const strategy = new APIAuthStrategy();
 * await strategy.authenticate(page, {
 *   url: 'https://my-sap.example.com',
 *   username: 'admin',
 *   password: 'secret',
 *   client: '100',
 * });
 * ```
 */
export class APIAuthStrategy implements AuthStrategy {
  /** {@inheritDoc AuthStrategy.name} */
  readonly name = 'api' as const;

  /**
   * Authenticate via API POST to the SAP login endpoint.
   *
   * @param page - AuthPage for browser interactions.
   * @param config - SAP authentication configuration.
   * @throws {@link AuthError} When API login fails or cookies are not set.
   *
   * @example
   * ```typescript
   * await strategy.authenticate(page, config);
   * ```
   */
  async authenticate(page: AuthPage, config: Readonly<SAPAuthConfig>): Promise<void> {
    const loginEndpoint = config.loginEndpoint ?? DEFAULT_LOGIN_ENDPOINT;
    const loginUrl = buildLoginUrl(config.url, loginEndpoint);
    const timeout = config.timeout ?? DEFAULT_TIMEOUT;

    // Navigate to origin first so cookies can be set on the correct domain
    await page.goto(config.url, { timeout });
    await page.waitForLoadState('domcontentloaded', { timeout });

    // Perform the login POST from within the browser context
    const result = await performLogin(page, loginUrl, config, timeout);

    if (!result.ok) {
      throw new AuthError({
        code: 'ERR_AUTH_FAILED',
        message: `API login failed with status ${String(result.status)}`,
        attempted: `POST credentials to ${loginUrl}`,
        retryable: result.status >= 500,
        strategy: 'api',
        loginUrl,
        suggestions: getFailureSuggestions(result.status),
      });
    }

    // Verify cookies were set by comparing before/after
    if (result.cookiesAfter === result.cookiesBefore) {
      throw new AuthError({
        code: 'ERR_AUTH_FAILED',
        message: 'API login succeeded but no new cookies were set',
        attempted: `Extract session cookies from ${loginUrl}`,
        retryable: false,
        strategy: 'api',
        loginUrl,
        suggestions: [
          'Check if the login endpoint returns Set-Cookie headers',
          'Verify the endpoint URL is correct',
          'Try a different login endpoint (e.g., /sap/bc/sec/oauth2/token)',
        ],
      });
    }

    // Navigate to the SAP URL to load the application with cookies
    await page.goto(config.url, { timeout });
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
 * Build the full login URL from base URL and endpoint path.
 *
 * @param baseUrl - SAP system base URL.
 * @param endpoint - Login endpoint path.
 * @returns Full login URL.
 *
 * @example
 * ```typescript
 * buildLoginUrl('https://sap.example.com/', '/sap/login');
 * // 'https://sap.example.com/sap/login'
 * ```
 */
function buildLoginUrl(baseUrl: string, endpoint: string): string {
  const base = baseUrl.replace(/\/$/u, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

/**
 * Perform the login POST request from within the browser context.
 *
 * @param page - AuthPage instance.
 * @param loginUrl - Full login URL.
 * @param config - Auth configuration with credentials.
 * @param timeout - Request timeout in milliseconds.
 * @returns Fetch result with status and cookie information.
 *
 * @example
 * ```typescript
 * const result = await performLogin(page, url, config, 30000);
 * ```
 */
async function performLogin(
  page: AuthPage,
  loginUrl: string,
  config: Readonly<SAPAuthConfig>,
  timeout: number,
): Promise<FetchLoginResult> {
  try {
    return await page.evaluate(
      /* eslint-disable @microsoft/sdl/no-cookies, n/no-unsupported-features/node-builtins */
      async (args: {
        loginUrl: string;
        username: string;
        password: string;
        client: string | undefined;
        timeout: number;
      }) => {
        const cookiesBefore = document.cookie;
        const body = new URLSearchParams();
        body.append('j_username', args.username);
        body.append('j_password', args.password);
        if (args.client !== undefined) {
          body.append('sap-client', args.client);
        }

        const controller = new AbortController();
        const timer = setTimeout(() => {
          controller.abort();
        }, args.timeout);

        try {
          const response = await fetch(args.loginUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body.toString(),
            credentials: 'include',
            signal: controller.signal,
          });
          clearTimeout(timer);
          return {
            ok: response.ok,
            status: response.status,
            cookiesBefore,
            cookiesAfter: document.cookie,
          };
        } catch (fetchError: unknown) {
          clearTimeout(timer);
          throw fetchError;
        }
      },
      /* eslint-enable @microsoft/sdl/no-cookies, n/no-unsupported-features/node-builtins */
      {
        loginUrl,
        username: config.username,
        password: config.password,
        client: config.client,
        timeout,
      },
    );
  } catch (error: unknown) {
    throw new AuthError({
      code: 'ERR_AUTH_FAILED',
      message: `API login request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      attempted: `POST credentials to ${loginUrl}`,
      retryable: true,
      strategy: 'api',
      loginUrl,
      suggestions: [
        'Check network connectivity to the SAP system',
        'Verify the login endpoint is correct',
        'Ensure CORS is configured if cross-origin',
      ],
      ...(error instanceof Error ? { cause: error } : {}),
    });
  }
}

/**
 * Get failure suggestions based on HTTP status code.
 *
 * @param status - HTTP response status code.
 * @returns Array of recovery suggestions.
 *
 * @example
 * ```typescript
 * getFailureSuggestions(401);
 * // ['Verify username and password are correct', ...]
 * ```
 */
function getFailureSuggestions(status: number): readonly string[] {
  if (status === 401) {
    return [
      'Verify username and password are correct',
      'Check if the SAP client number is required',
      'Ensure the user account is not locked',
    ];
  }
  if (status === 403) {
    return [
      'The user may not have access to this system',
      'Check SAP authorization roles',
      'Verify the login endpoint allows API access',
    ];
  }
  if (status >= 500) {
    return [
      'The SAP server encountered an error',
      'Try again later',
      'Check SAP system logs for details',
    ];
  }
  return [
    'Unexpected response from login endpoint',
    'Verify the login URL is correct',
    'Check SAP system configuration',
  ];
}
