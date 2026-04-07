/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Authentication strategy factory with URL-based auto-detection.
 *
 * @remarks
 * Provides a factory function {@link createAuthStrategy} that selects
 * the appropriate authentication strategy based on config fields:
 * 1. Explicit `strategy` override (including custom strategies)
 * 2. `certificatePath` present: CertificateAuthStrategy
 * 3. `subdomain` present: MultiTenantAuthStrategy
 * 4. Cloud URL auto-detection: CloudSAMLAuthStrategy
 * 5. Default: OnPremAuthStrategy
 *
 * Custom strategies can be registered with {@link registerAuthStrategy}
 * and cleared with {@link clearCustomStrategies}.
 *
 * @module auth
 */

import type { AuthStrategy, SAPAuthConfig } from './auth-types.js';
import { APIAuthStrategy } from './strategies/api-strategy.js';
import { CertificateAuthStrategy } from './strategies/certificate-strategy.js';
import { CloudSAMLAuthStrategy, isCloudUrl } from './strategies/cloud-saml-strategy.js';
import { MultiTenantAuthStrategy } from './strategies/multi-tenant-strategy.js';
import { Office365AuthStrategy } from './strategies/office365-strategy.js';
import { OnPremAuthStrategy } from './strategies/onprem-strategy.js';

import { AuthError } from '#core/errors/auth-error.js';
import { ErrorCode } from '#core/errors/codes.js';

/** Custom strategy registry for user-defined authentication strategies. */
const customStrategies = new Map<string, AuthStrategy>();

/**
 * Create an authentication strategy based on configuration.
 *
 * @capability sapAuth.login
 *
 * @remarks
 * Follows a priority chain:
 * 1. Explicit `strategy` name (custom registry first, then built-in)
 * 2. `certificatePath` present: CertificateAuthStrategy
 * 3. `subdomain` present: MultiTenantAuthStrategy
 * 4. Cloud URL pattern detected: CloudSAMLAuthStrategy
 * 5. Default: OnPremAuthStrategy
 *
 * @param config - SAP authentication configuration.
 * @returns The selected authentication strategy.
 * @throws {@link AuthError} When an unknown strategy name is specified.
 *
 * @example
 * ```typescript
 * import { createAuthStrategy } from './auth-factory.js';
 *
 * // Auto-detect strategy from URL
 * const strategy = createAuthStrategy({
 *   url: 'https://my-tenant.s4hana.cloud.sap',
 *   username: 'user@example.com',
 *   password: 'secret',
 * });
 * // Returns CloudSAMLAuthStrategy
 * ```
 */
export function createAuthStrategy(config: Readonly<SAPAuthConfig>): AuthStrategy {
  // 1. Explicit strategy override
  if (config.strategy !== undefined && config.strategy !== '') {
    // Check custom registry first
    const custom = customStrategies.get(config.strategy);
    if (custom !== undefined) {
      return custom;
    }

    return createBuiltinStrategy(config.strategy);
  }

  // 2. Certificate present -> CertificateStrategy
  if (config.certificatePath !== undefined && config.certificatePath !== '') {
    return new CertificateAuthStrategy();
  }

  // 3. Subdomain/tenant present -> MultiTenantStrategy
  if (config.subdomain !== undefined && config.subdomain !== '') {
    return new MultiTenantAuthStrategy();
  }

  // 4. Cloud URL auto-detection -> CloudSAMLStrategy
  if (isCloudUrl(config.url)) {
    return new CloudSAMLAuthStrategy();
  }

  // 5. Default -> OnPremStrategy
  return new OnPremAuthStrategy();
}

/**
 * Register a custom authentication strategy.
 *
 * @remarks
 * Registered strategies take priority over built-in strategies when
 * matched by name in {@link createAuthStrategy}. This allows overriding
 * built-in strategies or adding entirely new ones.
 *
 * @param name - Strategy name used in `config.strategy`.
 * @param strategy - The strategy implementation.
 *
 * @example
 * ```typescript
 * import { registerAuthStrategy } from './auth-factory.js';
 *
 * registerAuthStrategy('my-custom', {
 *   name: 'my-custom',
 *   authenticate: async (page, config) => { },
 *   isAuthenticated: async (page) => true,
 * });
 * ```
 */
export function registerAuthStrategy(name: string, strategy: AuthStrategy): void {
  customStrategies.set(name, strategy);
}

/**
 * Clear all registered custom authentication strategies.
 *
 * @remarks
 * Removes all custom strategies from the registry. Useful in tests
 * to reset state between test cases.
 *
 * @example
 * ```typescript
 * import { clearCustomStrategies } from './auth-factory.js';
 *
 * clearCustomStrategies();
 * ```
 */
export function clearCustomStrategies(): void {
  customStrategies.clear();
}

/**
 * Detect the SAP system type based on URL pattern.
 *
 * @param url - SAP system URL to classify.
 * @returns `'cloud'` for SAP Cloud URLs, `'onprem'` for all others.
 *
 * @example
 * ```typescript
 * import { detectSystemType } from './auth-factory.js';
 *
 * detectSystemType('https://my-tenant.s4hana.cloud.sap'); // 'cloud'
 * detectSystemType('https://sap.example.com');            // 'onprem'
 * ```
 */
export function detectSystemType(url: string): 'cloud' | 'onprem' {
  return isCloudUrl(url) ? 'cloud' : 'onprem';
}

/**
 * Create a built-in authentication strategy by name.
 *
 * @param name - The strategy name.
 * @returns The strategy instance.
 * @throws {@link AuthError} When the name is not a known built-in strategy.
 *
 * @example
 * ```typescript
 * const strategy = createBuiltinStrategy('onprem');
 * ```
 */
function createBuiltinStrategy(name: string): AuthStrategy {
  switch (name) {
    case 'onprem':
      return new OnPremAuthStrategy();
    case 'cloud-saml':
      return new CloudSAMLAuthStrategy();
    case 'office365':
      return new Office365AuthStrategy();
    case 'api':
      return new APIAuthStrategy();
    case 'certificate':
      return new CertificateAuthStrategy();
    case 'multi-tenant':
      return new MultiTenantAuthStrategy();
    default:
      throw new AuthError({
        code: ErrorCode.ERR_AUTH_FAILED,
        message: `Unknown auth strategy: ${name}`,
        attempted: `Create auth strategy '${name}'`,
        retryable: false,
        suggestions: [
          'Use a valid strategy name: onprem, cloud-saml, office365, api, certificate, multi-tenant',
          'Or register a custom strategy with registerAuthStrategy()',
        ],
      });
  }
}
