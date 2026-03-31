/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/auth/strategies/multi-tenant-strategy.ts` — multi-tenant authentication.
 *
 * @remarks
 * Validates tenant URL building, delegation to CloudSAML/OnPrem strategies,
 * subdomain validation, and isAuthenticated delegation.
 */
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';

import type { AuthStrategy, SAPAuthConfig } from '../../../../src/auth/auth-types.js';
import {
  MultiTenantAuthStrategy,
  buildTenantUrl,
} from '../../../../src/auth/strategies/multi-tenant-strategy.js';
import { AuthError } from '../../../../src/core/errors/auth-error.js';
import { createMockAuthPage } from '../../../helpers/mock-auth-page.js';
import type { MockAuthPage } from '../../../helpers/mock-auth-page.js';

const TEST_PASSWORD = 'test-secret-value';

describe('MultiTenantAuthStrategy', () => {
  let strategy: MultiTenantAuthStrategy;
  let page: MockAuthPage;

  beforeEach(() => {
    strategy = new MultiTenantAuthStrategy();
    page = createMockAuthPage();
  });

  it('has name "multi-tenant"', () => {
    expect(strategy.name).toBe('multi-tenant');
  });

  it('implements AuthStrategy interface', () => {
    expectTypeOf<MultiTenantAuthStrategy>().toExtend<AuthStrategy>();
  });

  describe('authenticate', () => {
    it('resolves tenant URL and delegates to CloudSAML for cloud URLs', async () => {
      const config: Readonly<SAPAuthConfig> = {
        url: 'https://base.s4hana.cloud.sap',
        username: 'user@example.com',
        password: TEST_PASSWORD,
        subdomain: 'my-tenant',
      };

      await strategy.authenticate(page, config);

      // Should have navigated to the tenant URL with subdomain prepended
      const gotoCall = page.goto.mock.calls[0] as [string, { timeout: number }];
      expect(gotoCall[0]).toBe('https://my-tenant.base.s4hana.cloud.sap');
    });

    it('resolves tenant URL and delegates to OnPrem for non-cloud URLs', async () => {
      const config: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: TEST_PASSWORD,
        subdomain: '100',
      };

      await strategy.authenticate(page, config);

      // Should have navigated to the URL with sap-client param
      const gotoCall = page.goto.mock.calls[0] as [string, { timeout: number }];
      expect(gotoCall[0]).toBe('https://sap.example.com/?sap-client=100');
    });

    it('delegates to CloudSAML strategy for cloud URLs', async () => {
      const config: Readonly<SAPAuthConfig> = {
        url: 'https://base.cloud.sap',
        username: 'user@example.com',
        password: TEST_PASSWORD,
        subdomain: 'tenant1',
      };

      await strategy.authenticate(page, config);

      // CloudSAML strategy calls waitForURL for redirect verification
      expect(page.waitForURL).toHaveBeenCalled();
    });

    it('delegates to OnPrem strategy for non-cloud URLs', async () => {
      const config: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'admin',
        password: TEST_PASSWORD,
        subdomain: '200',
      };

      await strategy.authenticate(page, config);

      // OnPrem strategy does NOT call waitForURL (no SAML redirect)
      expect(page.waitForURL).not.toHaveBeenCalled();
      // But it does navigate and fill the form
      expect(page.goto).toHaveBeenCalled();
      expect(page.waitForLoadState).toHaveBeenCalled();
    });

    it('throws AuthError when subdomain is missing (undefined)', async () => {
      const config: Readonly<SAPAuthConfig> = {
        url: 'https://base.cloud.sap',
        username: 'user@example.com',
        password: TEST_PASSWORD,
      };

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.message).toContain('Subdomain');
        expect(authError.retryable).toBe(false);
        expect(authError.strategy).toBe('multi-tenant');
        expect(authError.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('throws AuthError when subdomain is empty string', async () => {
      const config: Readonly<SAPAuthConfig> = {
        url: 'https://base.cloud.sap',
        username: 'user@example.com',
        password: TEST_PASSWORD,
        subdomain: '',
      };

      await expect(strategy.authenticate(page, config)).rejects.toThrow(AuthError);

      try {
        await strategy.authenticate(page, config);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.message).toContain('Subdomain');
      }
    });
  });

  describe('isAuthenticated', () => {
    it('delegates to auth-checks isAuthenticated', async () => {
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

describe('buildTenantUrl', () => {
  it('inserts subdomain for cloud URLs', () => {
    const result = buildTenantUrl('https://base.cloud.sap', 'my-tenant');
    expect(result).toBe('https://my-tenant.base.cloud.sap');
  });

  it('inserts subdomain for s4hana cloud URLs', () => {
    const result = buildTenantUrl('https://base.s4hana.cloud.sap', 'tenant1');
    expect(result).toBe('https://tenant1.base.s4hana.cloud.sap');
  });

  it('appends sap-client for on-prem URLs', () => {
    const result = buildTenantUrl('https://sap.example.com', '100');
    expect(result).toBe('https://sap.example.com/?sap-client=100');
  });

  it('preserves existing path in on-prem URLs', () => {
    const result = buildTenantUrl('https://sap.example.com/sap/bc/gui', '200');
    expect(result).toBe('https://sap.example.com/sap/bc/gui?sap-client=200');
  });

  it('preserves existing query params in on-prem URLs', () => {
    const result = buildTenantUrl('https://sap.example.com?lang=EN', '100');
    // URL constructor normalizes query params
    const url = new URL(result);
    expect(url.searchParams.get('sap-client')).toBe('100');
    expect(url.searchParams.get('lang')).toBe('EN');
  });
});
