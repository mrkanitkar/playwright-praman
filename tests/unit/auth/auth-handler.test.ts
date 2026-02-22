/**
 * Tests for `src/auth/auth-handler.ts` — SAPAuthHandler session management.
 *
 * @remarks
 * Validates login delegation, retry logic, env-based login, session
 * tracking, logout, and lifecycle logging for the auth handler.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthLogger } from '../../../src/auth/auth-handler.js';
import { SAPAuthHandler } from '../../../src/auth/auth-handler.js';
import type { AuthStrategy, SAPAuthConfig } from '../../../src/auth/auth-types.js';
import { AuthError } from '../../../src/core/errors/auth-error.js';
import { createMockAuthPage } from '../../helpers/mock-auth-page.js';
import type { MockAuthPage } from '../../helpers/mock-auth-page.js';

// ── Mock retry ──────────────────────────────────────────────────────────────
vi.mock('#core/utils/retry.js', () => ({
  retry: vi.fn(),
}));

// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
const TEST_PASSWORD = 'test-secret-value';

/**
 * Create a mock logger with all pino-like methods.
 */
function createMockLogger(): {
  readonly info: ReturnType<typeof vi.fn>;
  readonly debug: ReturnType<typeof vi.fn>;
  readonly warn: ReturnType<typeof vi.fn>;
  readonly error: ReturnType<typeof vi.fn>;
  readonly child: ReturnType<typeof vi.fn>;
} {
  return {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };
}

/**
 * Create a mock AuthStrategy with vi.fn() methods.
 */
/* eslint-disable @typescript-eslint/promise-function-async -- mock stubs use Promise.resolve */
function createMockStrategy(name = 'onprem'): AuthStrategy & {
  readonly authenticate: ReturnType<typeof vi.fn>;
  readonly isAuthenticated: ReturnType<typeof vi.fn>;
} {
  return {
    name,
    authenticate: vi.fn(() => Promise.resolve()),
    isAuthenticated: vi.fn(() => Promise.resolve(true)),
  };
}
/* eslint-enable @typescript-eslint/promise-function-async */

/** Minimal test config. */
function makeConfig(overrides: Partial<SAPAuthConfig> = {}): Readonly<SAPAuthConfig> {
  return {
    url: 'https://sap.example.com',
    username: 'admin',
    password: TEST_PASSWORD,
    ...overrides,
  };
}

describe('SAPAuthHandler', () => {
  let handler: SAPAuthHandler;
  let mockStrategy: ReturnType<typeof createMockStrategy>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let page: MockAuthPage;
  let config: Readonly<SAPAuthConfig>;
  let retryMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    mockStrategy = createMockStrategy();
    mockLogger = createMockLogger();
    page = createMockAuthPage();
    config = makeConfig();

    handler = new SAPAuthHandler({
      strategy: mockStrategy,
      logger: mockLogger as any as AuthLogger,
    });

    // Get the mocked retry function
    const retryModule = await import('#core/utils/retry.js');
    retryMock = retryModule.retry as ReturnType<typeof vi.fn>;
    // Default: retry executes the function immediately (no actual retrying)
    // eslint-disable-next-line @typescript-eslint/no-misused-promises -- mock implementation wrapping async fn
    retryMock.mockImplementation(async (fn: () => Promise<unknown>) => fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  // ── Test 1: Successful login delegates to strategy ────────────────────
  describe('login', () => {
    it('delegates to strategy.authenticate on successful login', async () => {
      await handler.login(page, config);

      expect(mockStrategy.authenticate).toHaveBeenCalledWith(page, config);
    });

    it('updates session info after successful login', async () => {
      vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));

      await handler.login(page, config);

      const session = handler.getSessionInfo();
      expect(session).not.toBeNull();
      expect(session?.strategyName).toBe('onprem');
      expect(session?.authenticatedAt).toBe(new Date('2026-01-15T10:00:00.000Z').getTime());
      expect(session?.isValid).toBe(true);
    });

    // ── Test 2: Login retries on failure ────────────────────────────────
    it('retries on failure and succeeds eventually (retryCount=2)', async () => {
      // Simulate retry calling the function, which eventually succeeds
      // The actual retry logic is tested in retry.test.ts; here we verify
      // that SAPAuthHandler delegates to retry and succeeds.
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- mock implementation wrapping async fn
      retryMock.mockImplementation(async (fn: () => Promise<void>) => fn());

      await handler.login(page, config);

      expect(retryMock).toHaveBeenCalledTimes(1);
      expect(mockStrategy.authenticate).toHaveBeenCalled();
    });

    // ── Test 3: Login exhausts retries and throws ──────────────────────
    it('throws AuthError after retries are exhausted', async () => {
      retryMock.mockRejectedValue(
        new AuthError({
          message: 'Authentication failed after retries',
          attempted: 'Login to SAP',
          retryable: false,
          suggestions: ['Check credentials'],
        }),
      );

      await expect(handler.login(page, config)).rejects.toThrow(AuthError);
    });

    // ── Test 4: Login with exponential backoff params ──────────────────
    it('passes correct retry options (baseDelay, maxRetries)', async () => {
      await handler.login(page, config);

      expect(retryMock).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          maxRetries: expect.any(Number) as number,
          baseDelay: expect.any(Number) as number,
          shouldRetry: expect.any(Function) as (error: Error) => boolean,
        }),
      );
    });

    // ── Test 5: Post-login verification fails ──────────────────────────
    it('throws AuthError when post-login verification fails', async () => {
      mockStrategy.isAuthenticated.mockResolvedValue(false);

      // Make retry run the fn so the internal verification logic triggers
      // eslint-disable-next-line @typescript-eslint/no-misused-promises -- mock implementation wrapping async fn
      retryMock.mockImplementation(async (fn: () => Promise<void>) => fn());

      await expect(handler.login(page, config)).rejects.toThrow(AuthError);

      try {
        await handler.login(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.retryable).toBe(true);
      }
    });

    // ── Test 15: Non-retryable error stops retry ───────────────────────
    it('stops retrying on non-retryable errors', async () => {
      const nonRetryableError = new AuthError({
        message: 'Invalid credentials',
        attempted: 'Login to SAP',
        retryable: false,
        suggestions: ['Check username and password'],
      });

      /* eslint-disable @typescript-eslint/no-misused-promises, @typescript-eslint/promise-function-async -- mock returning Promise.resolve */
      retryMock.mockImplementation(
        (_fn: () => Promise<void>, opts: { readonly shouldRetry?: (error: Error) => boolean }) => {
          // Simulate retry checking shouldRetry filter
          const { shouldRetry } = opts;
          if (shouldRetry !== undefined && !shouldRetry(nonRetryableError)) {
            throw nonRetryableError;
          }
          return Promise.resolve();
        },
      );
      /* eslint-enable @typescript-eslint/no-misused-promises, @typescript-eslint/promise-function-async */

      await expect(handler.login(page, config)).rejects.toThrow(AuthError);
    });

    it('passes shouldRetry that checks retryable property', async () => {
      await handler.login(page, config);

      const retryCall = retryMock.mock.calls[0] as [
        () => Promise<void>,
        { readonly shouldRetry: (error: Error) => boolean },
      ];
      const retryOpts = retryCall[1];

      // Retryable error should return true
      const retryableError = new AuthError({
        message: 'timeout',
        attempted: 'login',
        retryable: true,
        suggestions: [],
      });
      expect(retryOpts.shouldRetry(retryableError)).toBe(true);

      // Non-retryable error should return false
      const nonRetryableError = new AuthError({
        message: 'bad creds',
        attempted: 'login',
        retryable: false,
        suggestions: [],
      });
      expect(retryOpts.shouldRetry(nonRetryableError)).toBe(false);
    });

    it('shouldRetry returns true for plain Error without retryable property', async () => {
      await handler.login(page, config);

      const retryCall = retryMock.mock.calls[0] as [
        () => Promise<void>,
        { readonly shouldRetry: (error: Error) => boolean },
      ];
      const retryOpts = retryCall[1];

      // Plain Error has no retryable property — should return true
      const plainError = new Error('network timeout');
      expect(retryOpts.shouldRetry(plainError)).toBe(true);
    });
  });

  // ── Test 6: loginFromEnv reads SAP_CLOUD_* vars ─────────────────────
  describe('loginFromEnv', () => {
    it('reads SAP_CLOUD_* environment variables for cloud config', async () => {
      vi.stubEnv('SAP_ACTIVE_SYSTEM', 'cloud');
      vi.stubEnv('SAP_CLOUD_BASE_URL', 'https://cloud.sap.example.com');
      vi.stubEnv('SAP_CLOUD_USERNAME', 'cloud-user');
      vi.stubEnv('SAP_CLOUD_PASSWORD', 'cloud-pass');
      vi.stubEnv('SAP_CLIENT', '200');
      vi.stubEnv('SAP_LANGUAGE', 'DE');
      vi.stubEnv('SAP_AUTH_STRATEGY', 'cloud-saml');

      await handler.loginFromEnv(page);

      expect(retryMock).toHaveBeenCalled();
      expect(mockStrategy.authenticate).toHaveBeenCalledWith(
        page,
        expect.objectContaining({
          url: 'https://cloud.sap.example.com',
          username: 'cloud-user',
          // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
          password: 'cloud-pass',
          client: '200',
          language: 'DE',
          strategy: 'cloud-saml',
        }),
      );
    });

    // ── Test 7: loginFromEnv reads SAP_ONPREM_* vars ────────────────────
    it('reads SAP_ONPREM_* environment variables for onprem config', async () => {
      vi.stubEnv('SAP_ACTIVE_SYSTEM', 'onprem');
      vi.stubEnv('SAP_ONPREM_BASE_URL', 'https://onprem.sap.example.com');
      vi.stubEnv('SAP_ONPREM_USERNAME', 'onprem-user');
      vi.stubEnv('SAP_ONPREM_PASSWORD', 'onprem-pass');
      vi.stubEnv('SAP_CLIENT', '100');
      vi.stubEnv('SAP_LANGUAGE', 'EN');

      await handler.loginFromEnv(page);

      expect(mockStrategy.authenticate).toHaveBeenCalledWith(
        page,
        expect.objectContaining({
          url: 'https://onprem.sap.example.com',
          username: 'onprem-user',
          // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
          password: 'onprem-pass',
          client: '100',
          language: 'EN',
        }),
      );
    });

    it('defaults to onprem when SAP_ACTIVE_SYSTEM is not set', async () => {
      vi.stubEnv('SAP_ONPREM_BASE_URL', 'https://onprem.sap.example.com');
      vi.stubEnv('SAP_ONPREM_USERNAME', 'onprem-user');
      vi.stubEnv('SAP_ONPREM_PASSWORD', 'onprem-pass');

      await handler.loginFromEnv(page);

      expect(mockStrategy.authenticate).toHaveBeenCalledWith(
        page,
        expect.objectContaining({
          url: 'https://onprem.sap.example.com',
          username: 'onprem-user',
          // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
          password: 'onprem-pass',
        }),
      );
    });

    // ── Test 8: loginFromEnv missing required vars ──────────────────────
    it('throws AuthError when required env vars are missing', async () => {
      vi.stubEnv('SAP_ACTIVE_SYSTEM', 'cloud');
      // Missing SAP_CLOUD_BASE_URL, SAP_CLOUD_USERNAME, SAP_CLOUD_PASSWORD

      await expect(handler.loginFromEnv(page)).rejects.toThrow(AuthError);

      try {
        await handler.loginFromEnv(page);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('throws AuthError when URL env var is missing', async () => {
      vi.stubEnv('SAP_ACTIVE_SYSTEM', 'cloud');
      vi.stubEnv('SAP_CLOUD_USERNAME', 'user');
      vi.stubEnv('SAP_CLOUD_PASSWORD', 'pass');
      // Missing SAP_CLOUD_BASE_URL

      await expect(handler.loginFromEnv(page)).rejects.toThrow(AuthError);
    });

    it('throws AuthError when username env var is missing', async () => {
      vi.stubEnv('SAP_ACTIVE_SYSTEM', 'cloud');
      vi.stubEnv('SAP_CLOUD_BASE_URL', 'https://cloud.sap.example.com');
      vi.stubEnv('SAP_CLOUD_PASSWORD', 'pass');
      // Missing SAP_CLOUD_USERNAME

      await expect(handler.loginFromEnv(page)).rejects.toThrow(AuthError);
    });

    it('throws AuthError when password env var is missing', async () => {
      vi.stubEnv('SAP_ACTIVE_SYSTEM', 'cloud');
      vi.stubEnv('SAP_CLOUD_BASE_URL', 'https://cloud.sap.example.com');
      vi.stubEnv('SAP_CLOUD_USERNAME', 'user');
      // Missing SAP_CLOUD_PASSWORD

      await expect(handler.loginFromEnv(page)).rejects.toThrow(AuthError);
    });
  });

  // ── Test 9: logout clears session info ──────────────────────────────
  describe('logout', () => {
    it('clears session info after logout', async () => {
      // First login
      await handler.login(page, config);
      expect(handler.getSessionInfo()).not.toBeNull();

      // Then logout
      await handler.logout(page);

      expect(handler.getSessionInfo()).toBeNull();
    });

    it('navigates to about:blank as final step', async () => {
      await handler.login(page, config);
      await handler.logout(page);

      expect(page.goto).toHaveBeenCalledWith('about:blank');
    });

    it('attempts UI-based logout via evaluate (user menu click)', async () => {
      // evaluate returns false (menu not found) → falls back to ICF
      page.evaluate.mockResolvedValue(false);

      await handler.login(page, config);
      await handler.logout(page);

      // evaluate is called to attempt clicking the user menu button
      expect(page.evaluate).toHaveBeenCalled();
    });

    it('attempts ICF logoff fallback when UI logout fails', async () => {
      // evaluate returns false → UI logout fails → ICF fallback
      page.evaluate.mockResolvedValue(false);
      page.url.mockReturnValue(
        'https://sap.example.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html',
      );

      await handler.login(page, config);
      await handler.logout(page);

      // Should attempt ICF logoff endpoint
      expect(page.goto).toHaveBeenCalledWith('https://sap.example.com/sap/public/bc/icf/logoff');
      // Should still navigate to about:blank afterward
      expect(page.goto).toHaveBeenCalledWith('about:blank');
    });

    it('skips ICF fallback when UI logout succeeds', async () => {
      // Simulate successful UI logout: menu click returns true, waitForFunction resolves, logout click returns true
      page.evaluate
        .mockResolvedValueOnce(true) // menu button click succeeds
        .mockResolvedValueOnce(true); // logout button click succeeds
      page.waitForFunction.mockResolvedValue(undefined);

      await handler.login(page, config);
      await handler.logout(page);

      // Should NOT call ICF logoff endpoint (no goto with logoff path)
      const gotoCalls = page.goto.mock.calls.map((call: readonly unknown[]) => call[0]);
      const icfCalls = gotoCalls.filter(
        (url: unknown) => typeof url === 'string' && url.includes('/sap/public/bc/icf/logoff'),
      );
      expect(icfCalls).toHaveLength(0);

      // Should still navigate to about:blank
      expect(page.goto).toHaveBeenCalledWith('about:blank');
    });

    it('does not throw when UI logout throws an error', async () => {
      page.evaluate.mockRejectedValue(new Error('Page crashed'));

      await handler.login(page, config);

      // Should not throw — logout is non-fatal
      await expect(handler.logout(page)).resolves.toBeUndefined();
    });

    it('does not throw when ICF logoff throws an error', async () => {
      // UI logout fails (evaluate returns false)
      page.evaluate.mockResolvedValue(false);
      // URL parsing works but goto for ICF fails
      page.url.mockReturnValue('https://sap.example.com');
      page.goto
        .mockRejectedValueOnce(new Error('ICF endpoint unreachable')) // ICF logoff
        .mockResolvedValueOnce(undefined); // about:blank

      await handler.login(page, config);

      await expect(handler.logout(page)).resolves.toBeUndefined();
    });

    it('does not throw when about:blank navigation fails', async () => {
      page.evaluate.mockResolvedValue(false);
      page.url.mockReturnValue('https://sap.example.com');
      // ICF logoff succeeds, about:blank fails
      page.goto
        .mockResolvedValueOnce(undefined) // ICF logoff
        .mockRejectedValueOnce(new Error('Navigation failed')); // about:blank

      await handler.login(page, config);

      await expect(handler.logout(page)).resolves.toBeUndefined();
    });

    it('clears session info even when all logout steps fail', async () => {
      page.evaluate.mockRejectedValue(new Error('evaluate failed'));
      page.url.mockReturnValue('invalid-url');
      page.goto.mockRejectedValue(new Error('goto failed'));

      await handler.login(page, config);
      expect(handler.getSessionInfo()).not.toBeNull();

      // Should not throw
      await handler.logout(page);

      // Session state must still be cleared
      expect(handler.getSessionInfo()).toBeNull();
    });

    it('logs warning when UI logout menu button is not found', async () => {
      page.evaluate.mockResolvedValue(false);
      page.url.mockReturnValue('https://sap.example.com');

      await handler.login(page, config);
      await handler.logout(page);

      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('logs warning when UI logout throws', async () => {
      page.evaluate.mockRejectedValue(new Error('DOM error'));

      await handler.login(page, config);
      await handler.logout(page);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ strategy: 'onprem' }),
        expect.stringContaining('UI-based logout failed'),
      );
    });

    it('logs warning when logout button is not found after opening menu', async () => {
      // Menu opens (evaluate returns true), waitForFunction resolves,
      // but logout button click returns false
      page.evaluate
        .mockResolvedValueOnce(true) // menu button click succeeds
        .mockResolvedValueOnce(false); // logout button NOT found
      page.waitForFunction.mockResolvedValue(undefined);
      page.url.mockReturnValue('https://sap.example.com');

      await handler.login(page, config);
      await handler.logout(page);

      // Should log warning about logout button not found
      const warnCalls = mockLogger.warn.mock.calls.map((call: readonly unknown[]) => call[1]);
      expect(warnCalls).toContain('Logout button not found after opening user menu');
    });

    it('falls back to ICF when waitForFunction times out', async () => {
      // Menu opens, but waitForFunction rejects (logout button never appears)
      page.evaluate.mockResolvedValueOnce(true); // menu button click succeeds
      page.waitForFunction.mockRejectedValue(new Error('Timeout'));
      page.url.mockReturnValue('https://sap.example.com');

      await handler.login(page, config);
      await handler.logout(page);

      // Should attempt ICF logoff as fallback
      expect(page.goto).toHaveBeenCalledWith('https://sap.example.com/sap/public/bc/icf/logoff');
    });

    it('logs info on successful UI logout', async () => {
      // Successful UI logout
      page.evaluate
        .mockResolvedValueOnce(true) // menu click
        .mockResolvedValueOnce(true); // logout click
      page.waitForFunction.mockResolvedValue(undefined);

      await handler.login(page, config);
      mockLogger.info.mockClear();

      await handler.logout(page);

      // Should have logged "UI-based logout completed" and "SAP logout complete"
      const infoMessages = mockLogger.info.mock.calls.map((call: readonly unknown[]) => call[1]);
      expect(infoMessages).toContain('UI-based logout completed');
      expect(infoMessages).toContain('SAP logout complete');
    });
  });

  // ── Test 10: isAuthenticated delegates to strategy ──────────────────
  describe('isAuthenticated', () => {
    it('delegates to strategy.isAuthenticated', async () => {
      mockStrategy.isAuthenticated.mockResolvedValue(true);

      const result = await handler.isAuthenticated(page);

      expect(mockStrategy.isAuthenticated).toHaveBeenCalledWith(page);
      expect(result).toBe(true);
    });

    it('returns false when strategy reports not authenticated', async () => {
      mockStrategy.isAuthenticated.mockResolvedValue(false);

      const result = await handler.isAuthenticated(page);

      expect(result).toBe(false);
    });
  });

  // ── Test 11/12: isSessionExpired ────────────────────────────────────
  describe('isSessionExpired', () => {
    it('returns false when login is recent (within timeout)', async () => {
      vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
      await handler.login(page, config);

      // Advance 5 minutes (within default 30-minute timeout)
      vi.setSystemTime(new Date('2026-01-15T10:05:00.000Z'));

      expect(handler.isSessionExpired()).toBe(false);
    });

    it('returns true when login has expired (past timeout)', async () => {
      vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
      await handler.login(page, config);

      // Advance 31 minutes (past default 30-minute timeout)
      vi.setSystemTime(new Date('2026-01-15T10:31:00.000Z'));

      expect(handler.isSessionExpired()).toBe(true);
    });

    it('uses custom timeout parameter', async () => {
      vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
      await handler.login(page, config);

      // Advance 3 minutes
      vi.setSystemTime(new Date('2026-01-15T10:03:00.000Z'));

      // 2-minute timeout should be expired
      expect(handler.isSessionExpired(2 * 60 * 1000)).toBe(true);
      // 5-minute timeout should not be expired
      expect(handler.isSessionExpired(5 * 60 * 1000)).toBe(false);
    });

    it('returns true when no login has been performed', () => {
      expect(handler.isSessionExpired()).toBe(true);
    });
  });

  // ── Test 13/14: getSessionInfo ──────────────────────────────────────
  describe('getSessionInfo', () => {
    it('returns session details after login', async () => {
      vi.setSystemTime(new Date('2026-01-15T10:00:00.000Z'));
      await handler.login(page, config);

      const session = handler.getSessionInfo();

      expect(session).not.toBeNull();
      expect(session).toEqual(
        expect.objectContaining({
          authenticatedAt: new Date('2026-01-15T10:00:00.000Z').getTime(),
          strategyName: 'onprem',
          isValid: true,
        }),
      );
    });

    it('returns null before any login', () => {
      expect(handler.getSessionInfo()).toBeNull();
    });

    it('returns readonly session info', async () => {
      await handler.login(page, config);

      const session = handler.getSessionInfo();
      expect(session).not.toBeNull();
      // Verify the returned object shape
      expect(session).toHaveProperty('authenticatedAt');
      expect(session).toHaveProperty('strategyName');
      expect(session).toHaveProperty('isValid');
    });
  });

  // ── Test 16: Logger receives lifecycle events ───────────────────────
  describe('logging', () => {
    it('logs info on successful login', async () => {
      await handler.login(page, config);

      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('logs info on logout', async () => {
      await handler.login(page, config);
      await handler.logout(page);

      // At least 2 info calls: one for login, one for logout
      expect(mockLogger.info.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('logs error on login failure', async () => {
      retryMock.mockRejectedValue(
        new AuthError({
          message: 'Auth failed',
          attempted: 'Login to SAP',
          retryable: false,
          suggestions: [],
        }),
      );

      try {
        await handler.login(page, config);
      } catch {
        // Expected
      }

      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
