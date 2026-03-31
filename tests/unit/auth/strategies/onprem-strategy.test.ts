/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/auth/strategies/onprem-strategy.ts` — OnPrem authentication.
 *
 * @remarks
 * Validates form-based login flow, selector fallback chains,
 * input validation, and error handling for on-premise SAP systems.
 *
 * The `evaluate callback coverage` sections exercise the browser-context
 * code inside `page.evaluate()` calls by making the mock invoke the
 * callback with a minimal DOM stub.
 */
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { AuthStrategy, SAPAuthConfig } from '../../../../src/auth/auth-types.js';
import { OnPremAuthStrategy } from '../../../../src/auth/strategies/onprem-strategy.js';
import { AuthError } from '../../../../src/core/errors/auth-error.js';
import { createMockAuthPage } from '../../../helpers/mock-auth-page.js';
import type { MockAuthPage } from '../../../helpers/mock-auth-page.js';

const TEST_PASSWORD = 'test-secret-value';

describe('OnPremAuthStrategy', () => {
  let strategy: OnPremAuthStrategy;
  let page: MockAuthPage;
  let config: Readonly<SAPAuthConfig>;

  beforeEach(() => {
    strategy = new OnPremAuthStrategy();
    page = createMockAuthPage();
    config = {
      url: 'https://sap.example.com',
      username: 'admin',
      password: TEST_PASSWORD,
      client: '100',
      language: 'EN',
    };
  });

  it('has name "onprem"', () => {
    expect(strategy.name).toBe('onprem');
  });

  it('implements AuthStrategy interface', () => {
    expectTypeOf<OnPremAuthStrategy>().toExtend<AuthStrategy>();
  });

  describe('authenticate', () => {
    it('performs successful login with all fields', async () => {
      await strategy.authenticate(page, config);

      expect(page.goto).toHaveBeenCalledWith(config.url, { timeout: 30_000 });
      expect(page.waitForLoadState).toHaveBeenCalledWith('domcontentloaded', { timeout: 30_000 });

      // Should have waited for username, password, client, language, submit, and shell header selectors
      expect(page.waitForSelector).toHaveBeenCalled();

      // Should have called evaluate for form filling
      expect(page.evaluate).toHaveBeenCalled();
    });

    it('performs successful login without client field', async () => {
      const noClientConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: TEST_PASSWORD,
      };

      await strategy.authenticate(page, noClientConfig);

      expect(page.goto).toHaveBeenCalledWith(noClientConfig.url, { timeout: 30_000 });
      expect(page.evaluate).toHaveBeenCalled();
    });

    it('performs successful login without language field', async () => {
      const noLangConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: TEST_PASSWORD,
        client: '100',
      };

      await strategy.authenticate(page, noLangConfig);

      expect(page.goto).toHaveBeenCalledWith(noLangConfig.url, { timeout: 30_000 });
    });

    it('skips client field when client is empty string', async () => {
      const emptyClientConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: TEST_PASSWORD,
        client: '',
      };

      await strategy.authenticate(page, emptyClientConfig);

      expect(page.goto).toHaveBeenCalledWith(emptyClientConfig.url, { timeout: 30_000 });
    });

    it('skips language field when language is empty string', async () => {
      const emptyLangConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: TEST_PASSWORD,
        language: '',
      };

      await strategy.authenticate(page, emptyLangConfig);

      expect(page.goto).toHaveBeenCalledWith(emptyLangConfig.url, { timeout: 30_000 });
    });

    it('throws AuthError when login form username field not found', async () => {
      page.waitForSelector.mockRejectedValue(new Error('Timeout'));

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.strategy).toBe('onprem');
        expect(authError.message).toContain('username');
      }
    });

    it('throws AuthError when shell header not visible after login (wrong credentials)', async () => {
      let callCount = 0;
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation requires explicit Promise returns
      page.waitForSelector.mockImplementation(() => {
        callCount++;
        // Fail on the shell header wait (last call after submit)
        // Username, password, client, language, submit succeed; shell header fails
        if (callCount === 6) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      callCount = 0;
      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_TIMEOUT');
        expect(authError.strategy).toBe('onprem');
        expect(authError.retryable).toBe(true);
      }
    });

    it('uses selector fallback chain when primary selector fails', async () => {
      let callCount = 0;
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation requires explicit Promise returns
      page.waitForSelector.mockImplementation((selector: string) => {
        callCount++;
        // Fail on #USERNAME_FIELD-inner (1st), succeed on input[name="sap-user"] (2nd)
        if (callCount === 1 && selector === '#USERNAME_FIELD-inner') {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      await strategy.authenticate(page, config);

      // Should have tried the fallback selector
      expect(page.waitForSelector).toHaveBeenCalledWith(
        'input[name="sap-user"]',
        expect.objectContaining({ timeout: 30_000 }),
      );
    });

    it('uses custom timeout from config', async () => {
      const customTimeoutConfig: Readonly<SAPAuthConfig> = {
        ...config,
        timeout: 60_000,
      };

      await strategy.authenticate(page, customTimeoutConfig);

      expect(page.goto).toHaveBeenCalledWith(config.url, { timeout: 60_000 });
    });

    it('throws AuthError with empty username', async () => {
      const emptyUsernameConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: '',
        password: TEST_PASSWORD,
      };

      await expect(strategy.authenticate(page, emptyUsernameConfig)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, emptyUsernameConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.message).toContain('Username');
        expect(authError.retryable).toBe(false);
      }
    });

    it('throws AuthError with empty password', async () => {
      const emptyPasswordConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: '',
      };

      await expect(strategy.authenticate(page, emptyPasswordConfig)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, emptyPasswordConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.message).toContain('Password');
        expect(authError.retryable).toBe(false);
      }
    });

    it('continues when optional client field is not found', async () => {
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation requires explicit Promise returns
      page.waitForSelector.mockImplementation((selector: string) => {
        // Client selectors fail
        if (selector === '#CLIENT_FIELD-inner' || selector === 'input[name="sap-client"]') {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      // Should not throw even though client field is missing
      await strategy.authenticate(page, config);
      expect(page.goto).toHaveBeenCalled();
    });

    it('continues when optional language field is not found', async () => {
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation requires explicit Promise returns
      page.waitForSelector.mockImplementation((selector: string) => {
        // Language selector fails
        if (selector === 'input[name="sap-language"]') {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      // Should not throw even though language field is missing
      await strategy.authenticate(page, config);
      expect(page.goto).toHaveBeenCalled();
    });

    it('throws AuthError when submit button not found', async () => {
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation
      page.waitForSelector.mockImplementation((selector: string) => {
        // Submit selectors fail
        if (selector === '#LOGIN_LINK' || selector === 'button[type="submit"]') {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      // With client and language in config, client/language fill also calls
      // fillWithFallback which may catch. Let's use config without optional fields.
      const basicConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: TEST_PASSWORD,
      };

      await expect(strategy.authenticate(page, basicConfig)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, basicConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.message).toContain('submit');
      }
    });

    describe('evaluate callback coverage', () => {
      let origDocument: typeof globalThis.document;

      beforeEach(() => {
        origDocument = globalThis.document;
      });

      afterEach(() => {
        globalThis.document = origDocument;
      });

      it('fills all form fields via evaluate callback', async () => {
        const mockElement = {
          value: '',
          click: vi.fn(),
          dispatchEvent: vi.fn(),
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(mockElement),
        } as any;

        const cbPage = createMockAuthPage();
        cbPage.evaluate.mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock must return Promise directly
          (fn: (...args: never[]) => unknown, arg?: unknown) => {
            const result = (fn as (a: unknown) => unknown)(arg);
            return Promise.resolve(result);
          },
        );

        await strategy.authenticate(cbPage, config);

        // Should have called evaluate for username, password, client, language, submit
        expect(cbPage.evaluate).toHaveBeenCalled();
        expect(cbPage.evaluate.mock.calls.length).toBeGreaterThanOrEqual(5);
      });

      it('handles null element in fillWithFallback callback gracefully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(null),
        } as any;

        const cbPage = createMockAuthPage();
        cbPage.evaluate.mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock must return Promise directly
          (fn: (...args: never[]) => unknown, arg?: unknown) => {
            const result = (fn as (a: unknown) => unknown)(arg);
            return Promise.resolve(result);
          },
        );

        await strategy.authenticate(cbPage, config);

        expect(cbPage.evaluate).toHaveBeenCalled();
      });

      it('handles null element in clickWithFallback callback gracefully', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- minimal DOM stub
        globalThis.document = {
          querySelector: vi.fn().mockReturnValue(null),
        } as any;

        const cbPage = createMockAuthPage();
        cbPage.evaluate.mockImplementation(
          // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock must return Promise directly
          (fn: (...args: never[]) => unknown, arg?: unknown) => {
            const result = (fn as (a: unknown) => unknown)(arg);
            return Promise.resolve(result);
          },
        );

        const basicConfig: Readonly<SAPAuthConfig> = {
          url: 'https://sap.example.com',
          username: 'admin',
          password: TEST_PASSWORD,
        };

        await strategy.authenticate(cbPage, basicConfig);

        expect(cbPage.evaluate).toHaveBeenCalled();
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

    it('returns false when login form is still visible', async () => {
      page.evaluate
        .mockResolvedValueOnce(true) // isShellVisible
        .mockResolvedValueOnce(true); // isLoginPageVisible

      const result = await strategy.isAuthenticated(page);

      expect(result).toBe(false);
    });
  });
});
