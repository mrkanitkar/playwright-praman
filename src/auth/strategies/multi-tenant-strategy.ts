/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Multi-tenant SAP BTP authentication strategy.
 *
 * @remarks
 * Handles multi-tenant SAP BTP authentication where the tenant ID
 * (subdomain) determines the authentication endpoint. Builds a
 * tenant-specific URL and delegates to either CloudSAML or OnPrem
 * strategy based on the URL pattern.
 *
 * @module auth
 */

import type { AuthPage, AuthStrategy, SAPAuthConfig } from '../auth-types.js';

import { CloudSAMLAuthStrategy, isCloudUrl } from './cloud-saml-strategy.js';
import { OnPremAuthStrategy } from './onprem-strategy.js';

import { AuthError } from '#core/errors/auth-error.js';

/** Strategy name constant to avoid duplicate string literals. */
const STRATEGY_NAME = 'multi-tenant';

/**
 * Build a tenant-specific URL by inserting the subdomain.
 *
 * @remarks
 * For cloud URLs: inserts subdomain as first segment of the hostname
 * (e.g., `https://base.cloud.sap` becomes `https://subdomain.base.cloud.sap`).
 *
 * For on-prem URLs: appends `sap-client` query parameter using the
 * subdomain as the SAP client number.
 *
 * @param baseUrl - The base SAP system URL.
 * @param subdomain - The tenant subdomain or SAP client identifier.
 * @returns The tenant-specific URL.
 *
 * @example
 * ```typescript
 * buildTenantUrl('https://base.cloud.sap', 'my-tenant');
 * // 'https://my-tenant.base.cloud.sap'
 *
 * buildTenantUrl('https://sap.example.com', '100');
 * // 'https://sap.example.com?sap-client=100'
 * ```
 */
export function buildTenantUrl(baseUrl: string, subdomain: string): string {
  const url = new URL(baseUrl);

  if (isCloudUrl(baseUrl)) {
    // Cloud URL: insert subdomain as first segment of hostname
    url.hostname = `${subdomain}.${url.hostname}`;
    return url.toString().replace(/\/$/u, '');
  }

  // On-prem URL: append sap-client query parameter
  url.searchParams.set('sap-client', subdomain);
  return url.toString();
}

/**
 * Multi-tenant SAP BTP authentication strategy.
 *
 * @remarks
 * Validates that a subdomain/tenant identifier is provided, builds a
 * tenant-specific URL, and delegates to the appropriate underlying
 * strategy (CloudSAML for cloud URLs, OnPrem for on-premise URLs).
 *
 * @example
 * ```typescript
 * import { MultiTenantAuthStrategy } from './strategies/multi-tenant-strategy.js';
 *
 * const strategy = new MultiTenantAuthStrategy();
 * await strategy.authenticate(page, {
 *   url: 'https://base.s4hana.cloud.sap',
 *   username: 'user@example.com',
 *   password: 'secret',
 *   subdomain: 'my-tenant',
 * });
 * ```
 */
export class MultiTenantAuthStrategy implements AuthStrategy {
  /** {@inheritDoc AuthStrategy.name} */
  readonly name = 'multi-tenant' as const;

  /**
   * Authenticate against a multi-tenant SAP system.
   *
   * @param page - Playwright page for browser interactions.
   * @param config - SAP authentication configuration with `subdomain`.
   * @throws {@link AuthError} When subdomain is missing or authentication fails.
   *
   * @example
   * ```typescript
   * const strategy = new MultiTenantAuthStrategy();
   * await strategy.authenticate(page, config);
   * ```
   */
  async authenticate(page: AuthPage, config: Readonly<SAPAuthConfig>): Promise<void> {
    const subdomain = config.subdomain;
    if (subdomain === undefined || subdomain === '') {
      throw new AuthError({
        code: 'ERR_AUTH_FAILED',
        message: 'Subdomain is required for multi-tenant authentication',
        attempted: 'Validate multi-tenant auth configuration',
        retryable: false,
        strategy: STRATEGY_NAME,
        suggestions: [
          'Provide a subdomain in the auth configuration (e.g., subdomain: "my-tenant")',
        ],
      });
    }

    // Build tenant URL by inserting subdomain
    const tenantUrl = buildTenantUrl(config.url, subdomain);

    // Create modified config with tenant URL
    const tenantConfig: Readonly<SAPAuthConfig> = { ...config, url: tenantUrl };

    // Delegate to appropriate strategy based on URL type
    const delegateStrategy: AuthStrategy = isCloudUrl(tenantUrl)
      ? new CloudSAMLAuthStrategy()
      : new OnPremAuthStrategy();

    await delegateStrategy.authenticate(page, tenantConfig);
  }

  /**
   * Check if the current page is authenticated.
   *
   * @param page - Playwright page to check.
   * @returns `true` if the shell header is visible and no login form is present.
   *
   * @example
   * ```typescript
   * const isAuth = await strategy.isAuthenticated(page);
   * ```
   */
  async isAuthenticated(page: AuthPage): Promise<boolean> {
    const { isAuthenticated } = await import('../auth-checks.js');
    return isAuthenticated(page);
  }
}
