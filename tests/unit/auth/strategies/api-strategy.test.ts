/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/auth/strategies/api-strategy.ts`.
 *
 * @remarks
 * Verifies the API-based headless authentication flow:
 * POST to login endpoint, cookie extraction, error handling.
 *
 * The `evaluate callback coverage` sections exercise the browser-context
 * code inside `page.evaluate()` calls by making the mock invoke the
 * callback with a minimal DOM/fetch stub.
 */
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { AuthStrategy, SAPAuthConfig } from '../../../../src/auth/auth-types.js';
import { APIAuthStrategy } from '../../../../src/auth/strategies/api-strategy.js';
import { AuthError } from '../../../../src/core/errors/auth-error.js';
import { createMockAuthPage } from '../../../helpers/mock-auth-page.js';
import type { MockAuthPage } from '../../../helpers/mock-auth-page.js';

describe('APIAuthStrategy', () => {
  let strategy: APIAuthStrategy;
  let page: MockAuthPage;
  let config: Readonly<SAPAuthConfig>;

  beforeEach(() => {
    strategy = new APIAuthStrategy();
    page = createMockAuthPage();
    config = {
      url: 'https://sap.example.com',
      username: 'admin',
      password: 'secret-test-123',
      client: '100',
      timeout: 5000,
    };
  });

  it('has name "api"', () => {
    expect(strategy.name).toBe('api');
  });

  it('implements AuthStrategy interface', () => {
    expectTypeOf<APIAuthStrategy>().toExtend<AuthStrategy>();
  });

  describe('authenticate', () => {
    it('performs successful API login with cookie extraction', async () => {
      page.evaluate.mockResolvedValueOnce({
        ok: true,
        status: 200,
        cookiesBefore: '',
        cookiesAfter: 'MYSAPSSO2=abc123;',
      });

      await strategy.authenticate(page, config);

      // Should navigate to origin first
      expect(page.goto).toHaveBeenCalledWith(config.url, { timeout: 5000 });
      expect(page.waitForLoadState).toHaveBeenCalledWith('domcontentloaded', { timeout: 5000 });

      // Should have called evaluate for the login POST
      expect(page.evaluate).toHaveBeenCalled();

      // Verify login args
      const loginCallArgs = page.evaluate.mock.calls[0]?.[1] as {
        loginUrl: string;
        username: string;
        client: string | undefined;
      };
      expect(loginCallArgs.loginUrl).toBe('https://sap.example.com/sap/public/bc/sec/login');
      expect(loginCallArgs.username).toBe('admin');
      expect(loginCallArgs.client).toBe('100');

      // Should navigate to SAP URL after login
      expect(page.goto).toHaveBeenCalledTimes(2);
    });

    it('uses custom login endpoint when provided', async () => {
      const configWithEndpoint: Readonly<SAPAuthConfig> = {
        ...config,
        loginEndpoint: '/sap/bc/sec/oauth2/token',
      };

      page.evaluate.mockResolvedValueOnce({
        ok: true,
        status: 200,
        cookiesBefore: '',
        cookiesAfter: 'MYSAPSSO2=xyz;',
      });

      await strategy.authenticate(page, configWithEndpoint);

      const loginCallArgs = page.evaluate.mock.calls[0]?.[1] as {
        loginUrl: string;
      };
      expect(loginCallArgs.loginUrl).toBe('https://sap.example.com/sap/bc/sec/oauth2/token');
    });

    it('throws AuthError when response has no new cookies', async () => {
      page.evaluate.mockResolvedValueOnce({
        ok: true,
        status: 200,
        cookiesBefore: 'existing=cookie',
        cookiesAfter: 'existing=cookie', // same -- no new cookies
      });

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('no new cookies');
        expect(authError.retryable).toBe(false);
      }
    });

    it('throws AuthError with retryable=false for 401 response', async () => {
      page.evaluate.mockResolvedValueOnce({
        ok: false,
        status: 401,
        cookiesBefore: '',
        cookiesAfter: '',
      });

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('401');
        expect(authError.retryable).toBe(false);
        expect(authError.suggestions).toContain('Verify username and password are correct');
      }
    });

    it('throws AuthError with retryable=true for 500 response', async () => {
      page.evaluate.mockResolvedValueOnce({
        ok: false,
        status: 500,
        cookiesBefore: '',
        cookiesAfter: '',
      });

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('500');
        expect(authError.retryable).toBe(true);
        expect(authError.suggestions).toContain('The SAP server encountered an error');
      }
    });

    it('throws AuthError with retryable=false for 403 response', async () => {
      page.evaluate.mockResolvedValueOnce({
        ok: false,
        status: 403,
        cookiesBefore: '',
        cookiesAfter: '',
      });

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('403');
        expect(authError.retryable).toBe(false);
        expect(authError.suggestions).toContain('The user may not have access to this system');
      }
    });

    it('throws AuthError with default suggestions for unexpected status codes', async () => {
      page.evaluate.mockResolvedValueOnce({
        ok: false,
        status: 418,
        cookiesBefore: '',
        cookiesAfter: '',
      });

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('418');
        expect(authError.retryable).toBe(false);
        expect(authError.suggestions).toContain('Unexpected response from login endpoint');
      }
    });

    it('throws AuthError on fetch timeout/network error', async () => {
      page.evaluate.mockRejectedValueOnce(new Error('AbortError: signal is aborted'));

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('API login request failed');
        expect(authError.retryable).toBe(true);
      }
    });

    it('throws AuthError with generic message for non-Error thrown values', async () => {
      page.evaluate.mockRejectedValueOnce('string error');

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('Unknown error');
        expect(authError.retryable).toBe(true);
      }
    });

    it('uses default login endpoint when not specified', async () => {
      const noEndpointConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: 'secret-test',
      };

      page.evaluate.mockResolvedValueOnce({
        ok: true,
        status: 200,
        cookiesBefore: '',
        cookiesAfter: 'SAP_SESSIONID=abc;',
      });

      await strategy.authenticate(page, noEndpointConfig);

      const loginCallArgs = page.evaluate.mock.calls[0]?.[1] as {
        loginUrl: string;
      };
      expect(loginCallArgs.loginUrl).toBe('https://sap.example.com/sap/public/bc/sec/login');
    });

    it('handles URL with trailing slash', async () => {
      const trailingSlashConfig: Readonly<SAPAuthConfig> = {
        ...config,
        url: 'https://sap.example.com/',
      };

      page.evaluate.mockResolvedValueOnce({
        ok: true,
        status: 200,
        cookiesBefore: '',
        cookiesAfter: 'MYSAPSSO2=abc;',
      });

      await strategy.authenticate(page, trailingSlashConfig);

      const loginCallArgs = page.evaluate.mock.calls[0]?.[1] as {
        loginUrl: string;
      };
      // Should NOT have double slashes
      expect(loginCallArgs.loginUrl).toBe('https://sap.example.com/sap/public/bc/sec/login');
    });

    it('handles login endpoint without leading slash', async () => {
      const noSlashEndpointConfig: Readonly<SAPAuthConfig> = {
        ...config,
        loginEndpoint: 'sap/login',
      };

      page.evaluate.mockResolvedValueOnce({
        ok: true,
        status: 200,
        cookiesBefore: '',
        cookiesAfter: 'MYSAPSSO2=abc;',
      });

      await strategy.authenticate(page, noSlashEndpointConfig);

      const loginCallArgs = page.evaluate.mock.calls[0]?.[1] as {
        loginUrl: string;
      };
      expect(loginCallArgs.loginUrl).toBe('https://sap.example.com/sap/login');
    });

    it('uses default timeout when config.timeout is not set', async () => {
      const noTimeoutConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: 'secret-test',
      };

      page.evaluate.mockResolvedValueOnce({
        ok: true,
        status: 200,
        cookiesBefore: '',
        cookiesAfter: 'SAP_SESSIONID=abc;',
      });

      await strategy.authenticate(page, noTimeoutConfig);

      expect(page.goto).toHaveBeenCalledWith('https://sap.example.com', { timeout: 30_000 });
    });

    it('handles config without client field', async () => {
      const noClientConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: 'secret-test',
      };

      page.evaluate.mockResolvedValueOnce({
        ok: true,
        status: 200,
        cookiesBefore: '',
        cookiesAfter: 'SAP_SESSIONID=abc;',
      });

      await strategy.authenticate(page, noClientConfig);

      const loginCallArgs = page.evaluate.mock.calls[0]?.[1] as {
        client: string | undefined;
      };
      expect(loginCallArgs.client).toBeUndefined();
    });

    describe('evaluate callback coverage', () => {
      let origDocument: typeof globalThis.document;
      let origFetch: typeof globalThis.fetch;

      beforeEach(() => {
        origDocument = globalThis.document;
        origFetch = globalThis.fetch;
      });

      afterEach(() => {
        globalThis.document = origDocument;
        globalThis.fetch = origFetch;
      });

      it('executes the login POST via evaluate callback with successful response', async () => {
        let cookieValue = '';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          get cookie() {
            return cookieValue;
          },
          set cookie(val: string) {
            cookieValue = val;
          },
        } as any;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal fetch stub
        globalThis.fetch = vi.fn().mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock returns Promise directly
          () => {
            // Simulate cookie being set after fetch
            cookieValue = 'MYSAPSSO2=fetched;';
            return Promise.resolve({ ok: true, status: 200 });
          },
        ) as any;

        const cbPage = createMockAuthPage();
        let evaluateCallCount = 0;
        cbPage.evaluate.mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock must return Promise directly
          (fn: (...args: never[]) => unknown, arg?: unknown) => {
            evaluateCallCount++;
            // Only invoke the callback for the first evaluate call (performLogin)
            if (evaluateCallCount === 1) {
              const result = (fn as (a: unknown) => unknown)(arg);
              // result is a Promise from the async callback
              return result as Promise<unknown>;
            }
            // Subsequent calls return canned values for isAuthenticated checks
            return Promise.resolve(undefined);
          },
        );

        await strategy.authenticate(cbPage, config);

        expect(cbPage.evaluate).toHaveBeenCalled();
        expect(globalThis.fetch).toHaveBeenCalled();
      });

      it('executes the login POST via evaluate callback without client', async () => {
        let cookieValue = '';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          get cookie() {
            return cookieValue;
          },
          set cookie(val: string) {
            cookieValue = val;
          },
        } as any;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal fetch stub
        globalThis.fetch = vi.fn().mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock returns Promise directly
          () => {
            cookieValue = 'SAP_SESSIONID=abc;';
            return Promise.resolve({ ok: true, status: 200 });
          },
        ) as any;

        const cbPage = createMockAuthPage();
        let evaluateCallCount = 0;
        cbPage.evaluate.mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock must return Promise directly
          (fn: (...args: never[]) => unknown, arg?: unknown) => {
            evaluateCallCount++;
            if (evaluateCallCount === 1) {
              return (fn as (a: unknown) => unknown)(arg) as Promise<unknown>;
            }
            return Promise.resolve(undefined);
          },
        );

        const noClientConfig: Readonly<SAPAuthConfig> = {
          url: 'https://sap.example.com',
          username: 'admin',
          password: 'secret-test',
        };

        await strategy.authenticate(cbPage, noClientConfig);

        expect(cbPage.evaluate).toHaveBeenCalled();
      });

      it('exercises the setTimeout abort callback via fake timers', async () => {
        vi.useFakeTimers();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          get cookie() {
            return '';
          },
        } as any;

        // Create a fetch that respects AbortSignal -- rejects when aborted
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal fetch stub
        globalThis.fetch = vi.fn().mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock returns Promise directly
          (_url: string, options: { signal?: AbortSignal }) =>
            new Promise<never>((_resolve, reject) => {
              if (options.signal !== undefined) {
                options.signal.addEventListener('abort', () => {
                  reject(new Error('AbortError: The operation was aborted'));
                });
              }
            }),
        ) as any;

        const cbPage = createMockAuthPage();
        let evaluateCallCount = 0;
        cbPage.evaluate.mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock must return Promise directly
          (fn: (...args: never[]) => unknown, arg?: unknown) => {
            evaluateCallCount++;
            if (evaluateCallCount === 1) {
              const promise = (fn as (a: unknown) => unknown)(arg) as Promise<unknown>;
              // Advance timers to fire the setTimeout abort callback
              vi.advanceTimersByTime(10_000);
              return promise;
            }
            return Promise.resolve(undefined);
          },
        );

        try {
          await strategy.authenticate(cbPage, config);
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(AuthError);
        }

        vi.useRealTimers();
      });

      it('handles fetch failure in evaluate callback', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          get cookie() {
            return '';
          },
        } as any;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal fetch stub
        globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as any;

        const cbPage = createMockAuthPage();
        let evaluateCallCount = 0;
        cbPage.evaluate.mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock must return Promise directly
          (fn: (...args: never[]) => unknown, arg?: unknown) => {
            evaluateCallCount++;
            if (evaluateCallCount === 1) {
              return (fn as (a: unknown) => unknown)(arg) as Promise<unknown>;
            }
            return Promise.resolve(undefined);
          },
        );

        try {
          await strategy.authenticate(cbPage, config);
          expect.fail('Should have thrown');
        } catch (error) {
          // The error from the callback is caught and re-thrown as AuthError
          // by performLogin's outer catch
          expect(error).toBeInstanceOf(AuthError);
          const authError = error as AuthError;
          expect(authError.message).toContain('API login request failed');
        }
      });
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when shell is visible and no login form', async () => {
      page.evaluate
        .mockResolvedValueOnce(true) // isShellVisible
        .mockResolvedValueOnce(false); // isLoginPageVisible

      const result = await strategy.isAuthenticated(page);

      expect(result).toBe(true);
    });

    it('returns false when shell is not visible', async () => {
      page.evaluate
        .mockResolvedValueOnce(false) // isShellVisible
        .mockResolvedValueOnce(false); // isLoginPageVisible

      const result = await strategy.isAuthenticated(page);

      expect(result).toBe(false);
    });
  });

  describe('AuthError properties', () => {
    it('includes strategy name and loginUrl in error', async () => {
      page.evaluate.mockResolvedValueOnce({
        ok: false,
        status: 403,
        cookiesBefore: '',
        cookiesAfter: '',
      });

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.strategy).toBe('api');
        expect(authError.loginUrl).toBe('https://sap.example.com/sap/public/bc/sec/login');
      }
    });
  });
});
