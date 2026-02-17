/**
 * Tests for `src/auth/strategies/api-strategy.ts`.
 *
 * @remarks
 * Verifies the API-based headless authentication flow:
 * POST to login endpoint, cookie extraction, error handling.
 */
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';

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
      password: 'secret-test-123', // eslint-disable-line sonarjs/no-hardcoded-passwords -- test fixture
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

    it('uses default login endpoint when not specified', async () => {
      const noEndpointConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: 'secret-test', // eslint-disable-line sonarjs/no-hardcoded-passwords -- test fixture
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
