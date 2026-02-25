/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/auth/strategies/certificate-strategy.ts`.
 *
 * @remarks
 * Verifies client certificate authentication: file validation,
 * navigation, shell header detection, and no form interaction.
 */
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import type { AuthStrategy, SAPAuthConfig } from '../../../../src/auth/auth-types.js';
import { CertificateAuthStrategy } from '../../../../src/auth/strategies/certificate-strategy.js';
import { AuthError } from '../../../../src/core/errors/auth-error.js';
import { createMockAuthPage } from '../../../helpers/mock-auth-page.js';
import type { MockAuthPage } from '../../../helpers/mock-auth-page.js';

vi.mock('node:fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
}));

const { existsSync } = await import('node:fs');
const mockExistsSync = vi.mocked(existsSync);

describe('CertificateAuthStrategy', () => {
  let strategy: CertificateAuthStrategy;
  let page: MockAuthPage;
  let config: Readonly<SAPAuthConfig>;

  beforeEach(() => {
    strategy = new CertificateAuthStrategy();
    page = createMockAuthPage();
    config = {
      url: 'https://sap.example.com',
      username: 'certuser',
      password: '',
      certificatePath: '/certs/client.pem',
      certificateKeyPath: '/certs/client-key.pem',
      timeout: 5000,
    };
    mockExistsSync.mockReturnValue(true);
  });

  it('has name "certificate"', () => {
    expect(strategy.name).toBe('certificate');
  });

  it('implements AuthStrategy interface', () => {
    expectTypeOf<CertificateAuthStrategy>().toExtend<AuthStrategy>();
  });

  describe('authenticate', () => {
    it('completes certificate login: navigate then wait for shell', async () => {
      await strategy.authenticate(page, config);

      // Verify navigation
      expect(page.goto).toHaveBeenCalledWith(config.url, { timeout: 5000 });
      expect(page.waitForLoadState).toHaveBeenCalledWith('domcontentloaded', { timeout: 5000 });

      // Verify shell header wait
      expect(page.waitForSelector).toHaveBeenCalledWith(
        '#shell-header',
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it('throws AuthError when certificate file is not found', async () => {
      mockExistsSync.mockImplementation((filePath: unknown) => filePath !== '/certs/client.pem');

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('Certificate file not found');
        expect(authError.retryable).toBe(false);
      }
    });

    it('throws AuthError when certificate key file is not found', async () => {
      mockExistsSync.mockImplementation(
        (filePath: unknown) => filePath !== '/certs/client-key.pem',
      );

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('Certificate key file not found');
        expect(authError.retryable).toBe(false);
      }
    });

    it('throws AuthError when shell not found (certificate rejected)', async () => {
      page.waitForSelector.mockRejectedValue(new Error('Timeout'));

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('SAP shell not found');
        expect(authError.retryable).toBe(false);
        expect(authError.strategy).toBe('certificate');
      }
    });

    it('does not perform any form fill or click interactions', async () => {
      await strategy.authenticate(page, config);

      // Only goto, waitForLoadState, waitForSelector are called
      expect(page.goto).toHaveBeenCalledTimes(1);
      expect(page.waitForLoadState).toHaveBeenCalledTimes(1);
      expect(page.waitForSelector).toHaveBeenCalledTimes(1);

      // No evaluate calls (certificate strategy does no form interaction)
      expect(page.evaluate).not.toHaveBeenCalled();
    });

    it('throws AuthError when certificatePath is missing', async () => {
      const configNoCert: Readonly<SAPAuthConfig> = {
        ...config,
        certificatePath: undefined,
      };

      try {
        await strategy.authenticate(page, configNoCert);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('Certificate path is required');
        expect(authError.retryable).toBe(false);
      }
    });

    it('throws AuthError when certificateKeyPath is missing', async () => {
      const configNoKey: Readonly<SAPAuthConfig> = {
        ...config,
        certificateKeyPath: undefined,
      };

      try {
        await strategy.authenticate(page, configNoKey);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.message).toContain('Certificate key path is required');
        expect(authError.retryable).toBe(false);
      }
    });

    it('uses default timeout when config.timeout is not set', async () => {
      const noTimeoutConfig: Readonly<SAPAuthConfig> = {
        url: 'https://sap.example.com',
        username: 'certuser',
        password: '',
        certificatePath: '/certs/client.pem',
        certificateKeyPath: '/certs/client-key.pem',
      };

      await strategy.authenticate(page, noTimeoutConfig);

      expect(page.goto).toHaveBeenCalledWith('https://sap.example.com', { timeout: 30_000 });
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
      mockExistsSync.mockReturnValue(false);

      try {
        await strategy.authenticate(page, config);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.strategy).toBe('certificate');
      }
    });
  });
});
