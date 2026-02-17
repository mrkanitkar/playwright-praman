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

import type { BridgePage } from '#bridge/adapter.js';

/**
 * Extended page interface for authentication operations.
 *
 * @remarks
 * Extends `BridgePage` with navigation and DOM interaction methods
 * required by auth strategies (goto, url, waitForSelector, waitForURL,
 * waitForLoadState). These methods are available on Playwright's `Page`
 * but not on the minimal `BridgePage` interface. Auth strategies need
 * navigation capabilities that pure bridge operations do not.
 *
 * @example
 * ```typescript
 * const page: AuthPage = playwrightPage; // Playwright Page satisfies AuthPage
 * await page.goto('https://sap.example.com');
 * await page.waitForSelector('#shell-header', { timeout: 30_000 });
 * ```
 */
export interface AuthPage extends BridgePage {
  /** Navigate to the given URL. */
  goto(url: string, options?: { readonly timeout?: number }): Promise<unknown>;
  /** Return the current page URL. */
  url(): string;
  /** Wait for a CSS selector to appear in the DOM. */
  waitForSelector(
    selector: string,
    options?: { readonly timeout?: number; readonly state?: string },
  ): Promise<unknown>;
  /** Wait for the page URL to match the given pattern. */
  waitForURL(
    url: string | RegExp | ((url: URL) => boolean),
    options?: { readonly timeout?: number },
  ): Promise<void>;
  /** Wait for a specific load state (e.g., 'networkidle', 'domcontentloaded'). */
  waitForLoadState(
    state?: 'load' | 'domcontentloaded' | 'networkidle',
    options?: { readonly timeout?: number },
  ): Promise<void>;
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
  isAuthenticated(page: BridgePage): Promise<boolean>;
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
