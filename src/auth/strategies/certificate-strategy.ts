/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Client certificate (PKI/SSL) authentication strategy for SAP systems.
 *
 * @remarks
 * Authenticates using a client certificate that is pre-configured at the
 * Playwright browser context level (`clientCertificates`). This strategy
 * validates that certificate files exist, navigates to the SAP URL, and
 * waits for the shell header. No form interaction is needed because the
 * browser presents the certificate automatically during the TLS handshake.
 *
 * @example
 * ```typescript
 * import { CertificateAuthStrategy } from './certificate-strategy.js';
 *
 * const strategy = new CertificateAuthStrategy();
 * await strategy.authenticate(page, config);
 * ```
 *
 * @module auth
 */

import { existsSync } from 'node:fs';

import { isAuthenticated } from '../auth-checks.js';
import type { AuthPage, AuthStrategy, SAPAuthConfig } from '../auth-types.js';

import { AuthError } from '#core/errors/auth-error.js';

/** Default timeout in milliseconds for shell header to appear. */
const DEFAULT_TIMEOUT = 30_000;

/** Shell header selector indicating successful login. */
const SHELL_HEADER_SELECTOR = '#shell-header';

/**
 * Client certificate (PKI/SSL) authentication strategy.
 *
 * @remarks
 * Relies on Playwright's `clientCertificates` browser context option
 * to present the certificate during TLS handshake. This strategy only
 * validates paths, navigates, and waits for the SAP shell.
 *
 * @example
 * ```typescript
 * const strategy = new CertificateAuthStrategy();
 * await strategy.authenticate(page, {
 *   url: 'https://my-sap.example.com',
 *   username: 'certuser',
 *   password: '',
 *   certificatePath: '/certs/client.pem',
 *   certificateKeyPath: '/certs/client-key.pem',
 * });
 * ```
 */
export class CertificateAuthStrategy implements AuthStrategy {
  /** {@inheritDoc AuthStrategy.name} */
  readonly name = 'certificate' as const;

  /**
   * Authenticate via client certificate.
   *
   * @param page - AuthPage for browser interactions.
   * @param config - SAP authentication configuration with certificate paths.
   * @throws {@link AuthError} When certificate files are missing or shell is not found.
   *
   * @example
   * ```typescript
   * await strategy.authenticate(page, config);
   * ```
   */
  async authenticate(page: AuthPage, config: Readonly<SAPAuthConfig>): Promise<void> {
    const timeout = config.timeout ?? DEFAULT_TIMEOUT;

    // Step 1: Validate certificate file paths are provided and exist
    validateCertificateConfig(config);

    // Step 2: Navigate to SAP URL (certificate is sent automatically by browser)
    await page.goto(config.url, { timeout });
    await page.waitForLoadState('domcontentloaded', { timeout });

    // Step 3: Wait for SAP shell header (no form interaction needed)
    try {
      await page.waitForSelector(SHELL_HEADER_SELECTOR, { timeout });
    } catch (error: unknown) {
      throw new AuthError({
        code: 'ERR_AUTH_FAILED',
        message: 'SAP shell not found after certificate authentication',
        attempted: `Authenticate to ${config.url} via client certificate`,
        retryable: false,
        strategy: 'certificate',
        loginUrl: config.url,
        suggestions: [
          'Verify the client certificate is accepted by the SAP server',
          'Check that the certificate is not expired or revoked',
          'Ensure Playwright browser context has clientCertificates configured',
          'Verify the SAP system is configured for X.509 certificate auth',
        ],
        ...(error instanceof Error ? { cause: error } : {}),
      });
    }
  }

  /**
   * Check if the current page is authenticated.
   *
   * @param page - AuthPage to check.
   * @returns `true` if the SAP shell is visible and no login form is present.
   *
   * @example
   * ```typescript
   * const loggedIn = await strategy.isAuthenticated(page);
   * ```
   */
  async isAuthenticated(page: AuthPage): Promise<boolean> {
    return isAuthenticated(page);
  }
}

/**
 * Validate that certificate file paths are provided and exist on disk.
 *
 * @param config - SAP authentication configuration.
 * @throws {@link AuthError} When certificate paths are missing or files don't exist.
 *
 * @example
 * ```typescript
 * validateCertificateConfig(config); // throws if paths are invalid
 * ```
 */
function validateCertificateConfig(config: Readonly<SAPAuthConfig>): void {
  if (config.certificatePath === undefined || config.certificatePath === '') {
    throw new AuthError({
      code: 'ERR_AUTH_FAILED',
      message: 'Certificate path is required for certificate authentication',
      attempted: 'Validate certificate configuration',
      retryable: false,
      strategy: 'certificate',
      suggestions: [
        'Provide certificatePath in the auth configuration',
        'The path should point to a PEM or PFX certificate file',
      ],
    });
  }

  if (config.certificateKeyPath === undefined || config.certificateKeyPath === '') {
    throw new AuthError({
      code: 'ERR_AUTH_FAILED',
      message: 'Certificate key path is required for certificate authentication',
      attempted: 'Validate certificate configuration',
      retryable: false,
      strategy: 'certificate',
      suggestions: [
        'Provide certificateKeyPath in the auth configuration',
        'The path should point to the private key file for the certificate',
      ],
    });
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths from user config
  if (!existsSync(config.certificatePath)) {
    throw new AuthError({
      code: 'ERR_AUTH_FAILED',
      message: `Certificate file not found: ${config.certificatePath}`,
      attempted: `Read certificate file: ${config.certificatePath}`,
      retryable: false,
      strategy: 'certificate',
      suggestions: [
        'Verify the certificate file path is correct',
        'Check file permissions',
        'Ensure the certificate file has not been moved or deleted',
      ],
    });
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths from user config
  if (!existsSync(config.certificateKeyPath)) {
    throw new AuthError({
      code: 'ERR_AUTH_FAILED',
      message: `Certificate key file not found: ${config.certificateKeyPath}`,
      attempted: `Read certificate key file: ${config.certificateKeyPath}`,
      retryable: false,
      strategy: 'certificate',
      suggestions: [
        'Verify the certificate key file path is correct',
        'Check file permissions',
        'Ensure the key file has not been moved or deleted',
      ],
    });
  }
}
