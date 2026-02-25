/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Authentication type definitions for SAP systems.
 *
 * @remarks
 * Defines the strategy interface, configuration, and session types
 * used across all authentication strategies (OnPrem, CloudSAML,
 * Office365, API, Certificate, MultiTenant).
 *
 * @module auth
 */

/**
 * Minimal page interface for authentication operations.
 *
 * @remarks
 * Simplified subset of Playwright's `Page` used by auth strategies.
 * Playwright's `Page` satisfies this interface, so it can be passed
 * directly. Simplified method signatures keep auth test mocking simple.
 *
 * @example
 * ```typescript
 * const page: AuthPage = playwrightPage;
 * await page.goto('https://sap.example.com');
 * await page.waitForSelector('#shell-header', { timeout: 30_000 });
 * ```
 */
export interface AuthPage {
  /** Navigate to URL. */
  goto(url: string, options?: Record<string, unknown>): Promise<unknown>;
  /** Get current URL. */
  url(): string;
  /** Wait for a selector to appear. */
  waitForSelector(selector: string, options?: Record<string, unknown>): Promise<unknown>;
  /** Wait for URL to match. */
  waitForURL(
    url: string | RegExp | ((url: URL) => boolean),
    options?: Record<string, unknown>,
  ): Promise<void>;
  /** Wait for page load state. */
  waitForLoadState(state?: string, options?: Record<string, unknown>): Promise<void>;
  /** Wait for a function to return truthy. */
  waitForFunction(
    pageFunction: string | (() => unknown),
    options?: { readonly timeout?: number; readonly polling?: number },
  ): Promise<unknown>;
  /** Evaluate script in page context. */
  evaluate<T = unknown>(
    pageFunction: string | ((...args: never[]) => T),
    arg?: unknown,
  ): Promise<T>;
  /** Get a locator for a selector. */
  locator(selector: string, options?: Record<string, unknown>): unknown;
}

/**
 * Authentication strategy interface.
 *
 * @remarks
 * All authentication strategies (onprem, cloud-saml, office365, api,
 * certificate, multi-tenant) implement this interface to provide a
 * consistent authentication API.
 *
 * @example
 * ```typescript
 * const strategy: AuthStrategy = createOnPremStrategy();
 * await strategy.authenticate(page, config);
 * const loggedIn = await strategy.isAuthenticated(page);
 * ```
 */
export interface AuthStrategy {
  /** Human-readable strategy name (e.g., 'onprem', 'cloud-saml'). */
  readonly name: string;

  /**
   * Authenticate against the SAP system.
   *
   * @param page - Playwright page for browser interactions.
   * @param config - SAP authentication configuration.
   *
   * @example
   * ```typescript
   * await strategy.authenticate(page, config);
   * ```
   */
  authenticate(page: AuthPage, config: Readonly<SAPAuthConfig>): Promise<void>;

  /**
   * Check if the current page session is authenticated.
   *
   * @param page - Playwright page to check.
   * @returns `true` if authenticated (shell header visible).
   *
   * @example
   * ```typescript
   * const isAuth = await strategy.isAuthenticated(page);
   * ```
   */
  isAuthenticated(page: AuthPage): Promise<boolean>;
}

/**
 * SAP system authentication configuration.
 *
 * @remarks
 * Contains all fields needed to authenticate against any SAP system
 * variant (OnPrem, BTP, Cloud SAML, Office365, API, Certificate).
 * Optional fields use `| undefined` due to `exactOptionalPropertyTypes`.
 *
 * @example
 * ```typescript
 * const config: SAPAuthConfig = {
 *   url: 'https://my-sap.example.com',
 *   username: 'admin',
 *   password: 'secret',
 *   client: '100',
 * };
 * ```
 */
export interface SAPAuthConfig {
  /** SAP system URL (e.g., 'https://my-sap.example.com'). */
  readonly url: string;
  /** Username for authentication. */
  readonly username: string;
  /** Password for authentication. */
  readonly password: string;
  /** SAP client number (optional, OnPrem only). */
  readonly client?: string | undefined;
  /** SAP language code (optional, e.g., 'EN'). */
  readonly language?: string | undefined;
  /** Auth strategy name override (auto-detected if not provided). */
  readonly strategy?: string | undefined;
  /** Custom login endpoint path for API-based auth. */
  readonly loginEndpoint?: string | undefined;
  /** Path to client certificate for certificate-based auth. */
  readonly certificatePath?: string | undefined;
  /** Path to client certificate key. */
  readonly certificateKeyPath?: string | undefined;
  /** BTP subdomain for multi-tenant auth. */
  readonly subdomain?: string | undefined;
  /** Whether to click "Stay signed in" on Office365. */
  readonly staySignedIn?: boolean | undefined;
  /** Auth timeout in ms (default from PramanConfig). */
  readonly timeout?: number | undefined;
  /** Path to save storage state for session reuse. */
  readonly storageStatePath?: string | undefined;
}

/**
 * Information about the current authentication session.
 *
 * @remarks
 * Tracks when authentication was performed and whether the session
 * is still considered valid based on timeout configuration.
 *
 * @example
 * ```typescript
 * const session: SessionInfo = {
 *   authenticatedAt: Date.now(),
 *   strategyName: 'onprem',
 *   isValid: true,
 * };
 * ```
 */
export interface SessionInfo {
  /** When authentication was performed. */
  readonly authenticatedAt: number;
  /** Auth strategy used. */
  readonly strategyName: string;
  /** Whether session is still valid (based on timeout). */
  readonly isValid: boolean;
}

/**
 * Valid authentication strategy names.
 *
 * @remarks
 * Union type of all supported authentication strategy identifiers.
 *
 * @example
 * ```typescript
 * const name: AuthStrategyName = 'onprem';
 * ```
 */
export type AuthStrategyName =
  | 'onprem'
  | 'cloud-saml'
  | 'office365'
  | 'api'
  | 'certificate'
  | 'multi-tenant';
