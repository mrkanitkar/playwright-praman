/**
 * Tests for `src/auth/strategies/office365-strategy.ts`.
 *
 * @remarks
 * Verifies the multi-step Office365/Azure AD authentication flow:
 * email entry, Next click, password entry, submit, KMSI prompt handling,
 * and SAP shell verification.
 *
 * The `evaluate callback coverage` sections exercise the browser-context
 * code inside `page.evaluate()` calls by making the mock invoke the
 * callback with a minimal DOM stub.
 */
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { AuthStrategy, SAPAuthConfig } from '../../../../src/auth/auth-types.js';
import { Office365AuthStrategy } from '../../../../src/auth/strategies/office365-strategy.js';
import { AuthError } from '../../../../src/core/errors/auth-error.js';
import { createMockAuthPage } from '../../../helpers/mock-auth-page.js';
import type { MockAuthPage } from '../../../helpers/mock-auth-page.js';

describe('Office365AuthStrategy', () => {
  let strategy: Office365AuthStrategy;
  let page: MockAuthPage;
  let config: Readonly<SAPAuthConfig>;

  beforeEach(() => {
    strategy = new Office365AuthStrategy();
    page = createMockAuthPage();
    config = {
      url: 'https://sap.example.com',
      username: 'user@company.com',
      password: 'secret-test-123', // eslint-disable-line sonarjs/no-hardcoded-passwords -- test fixture
      timeout: 5000,
    };
  });

  it('has name "office365"', () => {
    expect(strategy.name).toBe('office365');
  });

  it('implements AuthStrategy interface', () => {
    expectTypeOf<Office365AuthStrategy>().toExtend<AuthStrategy>();
  });

  describe('authenticate', () => {
    it('performs successful Office365 login flow', async () => {
      await strategy.authenticate(page, config);

      expect(page.goto).toHaveBeenCalledWith(config.url, { timeout: 5000 });
      expect(page.waitForLoadState).toHaveBeenCalledWith('domcontentloaded', { timeout: 5000 });

      // Should have waited for email, Next, password, SignIn, KMSI, shell selectors
      expect(page.waitForSelector).toHaveBeenCalled();

      // Should have called evaluate for form filling
      expect(page.evaluate).toHaveBeenCalled();
    });

    it('fills email then password in separate multi-step form', async () => {
      await strategy.authenticate(page, config);

      // Verify waitForSelector was called for email and password fields
      expect(page.waitForSelector).toHaveBeenCalledWith(
        'input[name="loginfmt"]',
        expect.objectContaining({ timeout: 5000 }),
      );
      expect(page.waitForSelector).toHaveBeenCalledWith(
        'input[name="passwd"]',
        expect.objectContaining({ timeout: 5000 }),
      );

      // Verify evaluate was called for filling fields (check args are objects with selector/value)
      expect(page.evaluate).toHaveBeenCalled();
      const evaluateCalls = page.evaluate.mock.calls;
      expect(evaluateCalls.length).toBeGreaterThanOrEqual(2);
    });

    it('clicks Yes on KMSI when staySignedIn is true', async () => {
      const staySignedInConfig: Readonly<SAPAuthConfig> = {
        ...config,
        staySignedIn: true,
      };

      await strategy.authenticate(page, staySignedInConfig);

      // Should have waited for the Yes button (#idSIButton9)
      expect(page.waitForSelector).toHaveBeenCalledWith(
        '#idSIButton9',
        expect.objectContaining({ timeout: 3000 }),
      );

      // Should have called evaluate to click Yes button
      const evaluateCalls = page.evaluate.mock.calls;
      const kmsiClick = evaluateCalls.find((call) => call[1] === '#idSIButton9');
      expect(kmsiClick).toBeDefined();
    });

    it('clicks No on KMSI when staySignedIn is false', async () => {
      const noStayConfig: Readonly<SAPAuthConfig> = {
        ...config,
        staySignedIn: false,
      };

      await strategy.authenticate(page, noStayConfig);

      // Should have waited for the No button (#idBtn_Back)
      expect(page.waitForSelector).toHaveBeenCalledWith(
        '#idBtn_Back',
        expect.objectContaining({ timeout: 3000 }),
      );
    });

    it('proceeds without error when KMSI prompt does not appear', async () => {
      // KMSI selector times out -- not an error
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation requires explicit Promise returns
      page.waitForSelector.mockImplementation((selector: string) => {
        if (selector === '#idBtn_Back' || selector === '#idSIButton9') {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      // Should not throw
      await strategy.authenticate(page, config);
      expect(page.waitForSelector).toHaveBeenCalled();
    });

    it('throws AuthError when email field not found (timeout)', async () => {
      page.waitForSelector.mockRejectedValue(new Error('Timeout'));

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.strategy).toBe('office365');
        expect(authError.message).toContain('email');
      }
    });

    it('throws AuthError when shell header not found after login (wrong credentials)', async () => {
      // Email, Next, password, SignIn succeed, KMSI fails (ok), shell header fails
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation requires explicit Promise returns
      page.waitForSelector.mockImplementation((selector: string) => {
        // KMSI -- fail silently (expected)
        if (selector === '#idBtn_Back' || selector === '#idSIButton9') {
          return Promise.reject(new Error('Timeout'));
        }
        // Shell header -- fail (this is the error case)
        if (selector === '#shell-header') {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_TIMEOUT');
        expect(authError.strategy).toBe('office365');
        expect(authError.retryable).toBe(true);
      }
    });

    it('uses selector fallback for submit button', async () => {
      await strategy.authenticate(page, config);

      // Verify it tried the SignIn selector
      expect(page.waitForSelector).toHaveBeenCalledWith(
        'input[data-report-event="Signin_Submit"]',
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it('uses default timeout when config.timeout is not set', async () => {
      const noTimeoutConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'user@company.com',
        password: 'secret-test', // eslint-disable-line sonarjs/no-hardcoded-passwords -- test fixture
      };

      await strategy.authenticate(page, noTimeoutConfig);

      expect(page.goto).toHaveBeenCalledWith('https://sap.example.com', { timeout: 30_000 });
    });

    it('throws AuthError when Next button not found', async () => {
      let callCount = 0;
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation
      page.waitForSelector.mockImplementation((selector: string) => {
        callCount++;
        // Email field succeeds (1st), Next button fails (2nd)
        if (callCount === 2 && selector === 'input[type="submit"]') {
          return Promise.reject(new Error('Timeout'));
        }
        // The waitAndClick tries all selectors, all fail
        if (selector === 'input[type="submit"]' && callCount > 1) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      // The waitAndClick for Next has only one selector, so it throws AuthError
      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      callCount = 0;
      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.strategy).toBe('office365');
        expect(authError.message).toContain('Next');
      }
    });

    it('throws AuthError when Sign in button not found', async () => {
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation
      page.waitForSelector.mockImplementation((selector: string) => {
        // Steps 1-3 succeed (email, next, password), step 4 (sign in) fails
        if (selector === 'input[data-report-event="Signin_Submit"]') {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.message).toContain('Sign in');
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

      it('fills email and password fields via evaluate callback', async () => {
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

        // Verify evaluate was called (filling email, clicking next, filling password, clicking sign in, KMSI)
        expect(cbPage.evaluate).toHaveBeenCalled();
        expect(cbPage.evaluate.mock.calls.length).toBeGreaterThanOrEqual(4);
      });

      it('handles null element in waitAndFill callback gracefully', async () => {
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

      it('handles null element in waitAndClick callback gracefully', async () => {
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

      it('handles KMSI click with element present via evaluate callback', async () => {
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

        const staySignedInConfig: Readonly<SAPAuthConfig> = {
          ...config,
          staySignedIn: true,
        };

        await strategy.authenticate(cbPage, staySignedInConfig);

        // Should have invoked evaluate for KMSI click
        const evaluateCalls = cbPage.evaluate.mock.calls;
        const kmsiCall = evaluateCalls.find((call) => call[1] === '#idSIButton9');
        expect(kmsiCall).toBeDefined();
      });

      it('handles KMSI click with null element via evaluate callback', async () => {
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
    it('includes strategy name in error', async () => {
      page.waitForSelector.mockRejectedValue(new Error('Timeout'));

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.strategy).toBe('office365');
      }
    });
  });
});
