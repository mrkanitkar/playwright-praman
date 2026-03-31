/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/auth/auth-factory.ts` — auth strategy factory.
 *
 * @remarks
 * Validates strategy creation by explicit name, auto-detection from
 * config fields (certificate, subdomain, cloud URL), custom strategy
 * registration, priority chain, and error handling.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearCustomStrategies,
  createAuthStrategy,
  detectSystemType,
  registerAuthStrategy,
} from '../../../src/auth/auth-factory.js';
import type { AuthStrategy, SAPAuthConfig } from '../../../src/auth/auth-types.js';
import { APIAuthStrategy } from '../../../src/auth/strategies/api-strategy.js';
import { CertificateAuthStrategy } from '../../../src/auth/strategies/certificate-strategy.js';
import { CloudSAMLAuthStrategy } from '../../../src/auth/strategies/cloud-saml-strategy.js';
import { MultiTenantAuthStrategy } from '../../../src/auth/strategies/multi-tenant-strategy.js';
import { Office365AuthStrategy } from '../../../src/auth/strategies/office365-strategy.js';
import { OnPremAuthStrategy } from '../../../src/auth/strategies/onprem-strategy.js';
import { AuthError } from '../../../src/core/errors/auth-error.js';

const TEST_PASSWORD = 'test-secret-value';

/**
 * Create a minimal mock AuthStrategy for testing the factory registry.
 *
 * @param name - Strategy name.
 * @returns Mock AuthStrategy instance.
 */
/* eslint-disable @typescript-eslint/promise-function-async -- mock stubs use Promise.resolve */
function createMockStrategy(name: string): AuthStrategy {
  return {
    name,
    authenticate: () => Promise.resolve(),
    isAuthenticated: () => Promise.resolve(true),
  };
}
/* eslint-enable @typescript-eslint/promise-function-async */

/** Helper to create a minimal SAPAuthConfig for testing. */
function makeConfig(overrides: Partial<SAPAuthConfig> = {}): Readonly<SAPAuthConfig> {
  return {
    url: 'https://sap.example.com',
    username: 'admin',
    password: TEST_PASSWORD,
    ...overrides,
  };
}

describe('createAuthStrategy', () => {
  beforeEach(() => {
    clearCustomStrategies();
  });

  describe('explicit strategy override', () => {
    it('returns OnPremAuthStrategy for strategy "onprem"', () => {
      const strategy = createAuthStrategy(makeConfig({ strategy: 'onprem' }));
      expect(strategy).toBeInstanceOf(OnPremAuthStrategy);
      expect(strategy.name).toBe('onprem');
    });

    it('returns CloudSAMLAuthStrategy for strategy "cloud-saml"', () => {
      const strategy = createAuthStrategy(makeConfig({ strategy: 'cloud-saml' }));
      expect(strategy).toBeInstanceOf(CloudSAMLAuthStrategy);
      expect(strategy.name).toBe('cloud-saml');
    });

    it('returns Office365AuthStrategy for strategy "office365"', () => {
      const strategy = createAuthStrategy(makeConfig({ strategy: 'office365' }));
      expect(strategy).toBeInstanceOf(Office365AuthStrategy);
      expect(strategy.name).toBe('office365');
    });

    it('returns APIAuthStrategy for strategy "api"', () => {
      const strategy = createAuthStrategy(makeConfig({ strategy: 'api' }));
      expect(strategy).toBeInstanceOf(APIAuthStrategy);
      expect(strategy.name).toBe('api');
    });

    it('returns CertificateAuthStrategy for strategy "certificate"', () => {
      const strategy = createAuthStrategy(makeConfig({ strategy: 'certificate' }));
      expect(strategy).toBeInstanceOf(CertificateAuthStrategy);
      expect(strategy.name).toBe('certificate');
    });

    it('returns MultiTenantAuthStrategy for strategy "multi-tenant"', () => {
      const strategy = createAuthStrategy(makeConfig({ strategy: 'multi-tenant' }));
      expect(strategy).toBeInstanceOf(MultiTenantAuthStrategy);
      expect(strategy.name).toBe('multi-tenant');
    });
  });

  describe('auto-detection from config fields', () => {
    it('returns CertificateAuthStrategy when certificatePath is set', () => {
      const strategy = createAuthStrategy(makeConfig({ certificatePath: '/path/to/cert.pem' }));
      expect(strategy).toBeInstanceOf(CertificateAuthStrategy);
    });

    it('returns MultiTenantAuthStrategy when subdomain is set', () => {
      const strategy = createAuthStrategy(makeConfig({ subdomain: 'my-tenant' }));
      expect(strategy).toBeInstanceOf(MultiTenantAuthStrategy);
    });

    it('returns CloudSAMLAuthStrategy for cloud URLs', () => {
      const strategy = createAuthStrategy(
        makeConfig({ url: 'https://my-tenant.s4hana.cloud.sap' }),
      );
      expect(strategy).toBeInstanceOf(CloudSAMLAuthStrategy);
    });

    it('returns OnPremAuthStrategy as default for non-cloud URLs', () => {
      const strategy = createAuthStrategy(makeConfig({ url: 'https://sap.example.com' }));
      expect(strategy).toBeInstanceOf(OnPremAuthStrategy);
    });
  });

  describe('priority chain', () => {
    it('explicit strategy takes highest priority', () => {
      // Config has certificate + subdomain + cloud URL, but explicit strategy wins
      const strategy = createAuthStrategy(
        makeConfig({
          strategy: 'onprem',
          certificatePath: '/path/to/cert.pem',
          subdomain: 'my-tenant',
          url: 'https://base.cloud.sap',
        }),
      );
      expect(strategy).toBeInstanceOf(OnPremAuthStrategy);
    });

    it('certificate takes priority over subdomain and URL', () => {
      const strategy = createAuthStrategy(
        makeConfig({
          certificatePath: '/path/to/cert.pem',
          subdomain: 'my-tenant',
          url: 'https://base.cloud.sap',
        }),
      );
      expect(strategy).toBeInstanceOf(CertificateAuthStrategy);
    });

    it('subdomain takes priority over URL detection', () => {
      const strategy = createAuthStrategy(
        makeConfig({
          subdomain: 'my-tenant',
          url: 'https://base.cloud.sap',
        }),
      );
      expect(strategy).toBeInstanceOf(MultiTenantAuthStrategy);
    });
  });

  describe('custom strategy registration', () => {
    it('returns registered custom strategy', () => {
      const customStrategy = createMockStrategy('my-custom');

      registerAuthStrategy('my-custom', customStrategy);

      const strategy = createAuthStrategy(makeConfig({ strategy: 'my-custom' }));
      expect(strategy).toBe(customStrategy);
      expect(strategy.name).toBe('my-custom');
    });

    it('custom strategy overrides built-in strategy', () => {
      const customOnPrem = createMockStrategy('custom-onprem');

      registerAuthStrategy('onprem', customOnPrem);

      const strategy = createAuthStrategy(makeConfig({ strategy: 'onprem' }));
      expect(strategy).toBe(customOnPrem);
      expect(strategy.name).toBe('custom-onprem');
    });

    it('clearCustomStrategies removes all registered strategies', () => {
      const customStrategy = createMockStrategy('temporary');

      registerAuthStrategy('temporary', customStrategy);

      // Verify it was registered
      const before = createAuthStrategy(makeConfig({ strategy: 'temporary' }));
      expect(before).toBe(customStrategy);

      // Clear and verify it's gone
      clearCustomStrategies();
      expect(() => createAuthStrategy(makeConfig({ strategy: 'temporary' }))).toThrow(AuthError);
    });
  });

  describe('error handling', () => {
    it('throws AuthError for unknown strategy name', () => {
      expect(() => createAuthStrategy(makeConfig({ strategy: 'nonexistent' }))).toThrow(AuthError);

      try {
        createAuthStrategy(makeConfig({ strategy: 'nonexistent' }));
      } catch (error) {
        expect(error).toBeInstanceOf(AuthError);
        const authError = error as AuthError;
        expect(authError.code).toBe('ERR_AUTH_FAILED');
        expect(authError.message).toContain('nonexistent');
        expect(authError.retryable).toBe(false);
        expect(authError.suggestions.length).toBeGreaterThan(0);
        expect(authError.suggestions).toContain(
          'Use a valid strategy name: onprem, cloud-saml, office365, api, certificate, multi-tenant',
        );
      }
    });
  });
});

describe('detectSystemType', () => {
  it('returns "cloud" for SAP Cloud URLs', () => {
    expect(detectSystemType('https://my-tenant.s4hana.cloud.sap')).toBe('cloud');
    expect(detectSystemType('https://app.hana.ondemand.com')).toBe('cloud');
    expect(detectSystemType('https://my.cloud.sap')).toBe('cloud');
  });

  it('returns "onprem" for non-cloud URLs', () => {
    expect(detectSystemType('https://sap.example.com')).toBe('onprem');
    expect(detectSystemType('https://my-sap.internal.net')).toBe('onprem');
    expect(detectSystemType('https://localhost:8080')).toBe('onprem');
  });
});
