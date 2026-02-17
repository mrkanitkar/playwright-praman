/**
 * Tests for `src/auth/strategies/cloud-saml-strategy.ts` — CloudSAML authentication.
 *
 * @remarks
 * Validates SAML-based login flow via SAP Identity Authentication Service,
 * selector fallback chains, redirect handling, cloud URL detection,
 * input validation, and error handling.
 */
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';

import type { AuthStrategy, SAPAuthConfig } from '../../../../src/auth/auth-types.js';
import {
  CloudSAMLAuthStrategy,
  isCloudUrl,
} from '../../../../src/auth/strategies/cloud-saml-strategy.js';
import { AuthError } from '../../../../src/core/errors/auth-error.js';
import { createMockAuthPage } from '../../../helpers/mock-auth-page.js';
import type { MockAuthPage } from '../../../helpers/mock-auth-page.js';

// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Test fixtures use known values
const TEST_PASSWORD = 'test-secret-value';

describe('CloudSAMLAuthStrategy', () => {
  let strategy: CloudSAMLAuthStrategy;
  let page: MockAuthPage;
  let config: Readonly<SAPAuthConfig>;

  beforeEach(() => {
    strategy = new CloudSAMLAuthStrategy();
    page = createMockAuthPage();
    config = {
      url: 'https://my-tenant.s4hana.cloud.sap',
      username: 'user@example.com',
      password: TEST_PASSWORD,
    };
  });

  it('has name "cloud-saml"', () => {
    expect(strategy.name).toBe('cloud-saml');
  });

  it('implements AuthStrategy interface', () => {
    expectTypeOf<CloudSAMLAuthStrategy>().toExtend<AuthStrategy>();
  });

  describe('authenticate', () => {
    it('performs successful SAML login via IAS', async () => {
      await strategy.authenticate(page, config);

      expect(page.goto).toHaveBeenCalledWith(config.url, { timeout: 30_000 });
      expect(page.waitForLoadState).toHaveBeenCalledWith('domcontentloaded', { timeout: 30_000 });
      expect(page.waitForSelector).toHaveBeenCalled();
      expect(page.evaluate).toHaveBeenCalled();
      expect(page.waitForURL).toHaveBeenCalled();
    });

    it('waits for IAS form after redirect', async () => {
      await strategy.authenticate(page, config);

      // Should have waited for IAS username selector
      expect(page.waitForSelector).toHaveBeenCalledWith(
        'input[name="j_username"]',
        expect.objectContaining({ timeout: 30_000 }),
      );
    });

    it('throws AuthError when IAS login form not found (timeout)', async () => {
      page.waitForSelector.mockRejectedValue(new Error('Timeout'));

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.strategy).toBe('cloud-saml');
        expect(authError.message).toContain('email/username');
      }
    });

    it('throws AuthError with suggestions on wrong credentials (redirect fails)', async () => {
      // All selectors succeed but waitForURL (redirect) fails
      page.waitForURL.mockRejectedValue(new Error('Timeout'));

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_TIMEOUT');
        expect(authError.retryable).toBe(true);
        expect(authError.suggestions).toBeDefined();
        expect(authError.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('uses selector fallback chain when primary selector fails', async () => {
      let callCount = 0;
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation requires explicit Promise returns
      page.waitForSelector.mockImplementation((selector: string) => {
        callCount++;
        // Fail on input[name="j_username"] (1st), succeed on #j_username (2nd)
        if (callCount === 1 && selector === 'input[name="j_username"]') {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      await strategy.authenticate(page, config);

      // Should have tried the fallback selector
      expect(page.waitForSelector).toHaveBeenCalledWith(
        '#j_username',
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
        url: 'https://my-tenant.s4hana.cloud.sap',
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
        expect(authError.message).toContain('Username/email');
        expect(authError.retryable).toBe(false);
      }
    });

    it('throws AuthError with empty password', async () => {
      const emptyPasswordConfig: Readonly<SAPAuthConfig> = {
        url: 'https://my-tenant.s4hana.cloud.sap',
        username: 'user@example.com',
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

    it('throws AuthError when shell header not visible after SAML redirect', async () => {
      let waitForSelectorCallCount = 0;
      // eslint-disable-next-line @typescript-eslint/promise-function-async -- mock implementation requires explicit Promise returns
      page.waitForSelector.mockImplementation(() => {
        waitForSelectorCallCount++;
        // First 3 calls succeed (username, password, submit),
        // 4th call (shell header) fails
        if (waitForSelectorCallCount === 4) {
          return Promise.reject(new Error('Timeout'));
        }
        return Promise.resolve(undefined);
      });

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      waitForSelectorCallCount = 0;
      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_TIMEOUT');
        expect(authError.strategy).toBe('cloud-saml');
      }
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when authenticated', async () => {
      page.evaluate
        .mockResolvedValueOnce(true) // isShellVisible
        .mockResolvedValueOnce(false); // isLoginPageVisible

      const result = await strategy.isAuthenticated(page);

      expect(result).toBe(true);
    });

    it('returns false when not authenticated', async () => {
      page.evaluate
        .mockResolvedValueOnce(false) // isShellVisible
        .mockResolvedValueOnce(false); // isLoginPageVisible

      const result = await strategy.isAuthenticated(page);

      expect(result).toBe(false);
    });
  });
});

describe('isCloudUrl', () => {
  it('matches *.cloud.sap URLs', () => {
    expect(isCloudUrl('https://my-tenant.cloud.sap')).toBe(true);
  });

  it('matches *.s4hana.cloud.sap URLs', () => {
    expect(isCloudUrl('https://my-tenant.s4hana.cloud.sap')).toBe(true);
  });

  it('matches *.hana.ondemand.com URLs', () => {
    expect(isCloudUrl('https://my-tenant.hana.ondemand.com')).toBe(true);
  });

  it('matches *.cfapps.*.hana.ondemand.com URLs', () => {
    expect(isCloudUrl('https://app.cfapps.us10.hana.ondemand.com')).toBe(true);
    expect(isCloudUrl('https://app.cfapps.eu10.hana.ondemand.com')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isCloudUrl('https://my-tenant.CLOUD.SAP')).toBe(true);
    expect(isCloudUrl('https://my-tenant.S4HANA.Cloud.Sap')).toBe(true);
  });

  it('does not match non-cloud URLs', () => {
    expect(isCloudUrl('https://sap.local.corp')).toBe(false);
    expect(isCloudUrl('https://sap.example.com')).toBe(false);
    expect(isCloudUrl('https://my-sap-system.internal.net')).toBe(false);
  });

  it('does not match partial domain matches', () => {
    expect(isCloudUrl('https://notcloud.sapx.com')).toBe(false);
  });
});
