/**
 * SAPAuthHandler — session management, retry, and state tracking.
 *
 * @remarks
 * Orchestrates authentication lifecycle: login with retry, env-based login,
 * logout, session expiry tracking, and authentication verification.
 * Uses `retry()` from core utils for exponential backoff on transient failures.
 *
 * @example
 * ```typescript
 * import { SAPAuthHandler } from './auth-handler.js';
 *
 * const handler = new SAPAuthHandler({ strategy, logger });
 * await handler.login(page, config);
 * ```
 *
 * @module auth
 */

import process from 'node:process';

import type { AuthPage, AuthStrategy, SAPAuthConfig, SessionInfo } from './auth-types.js';

import { AuthError } from '#core/errors/auth-error.js';
import { retry } from '#core/utils/retry.js';
import { ui5Step } from '#core/utils/step-decorator.js';

/**
 * Minimal logger interface for auth handler lifecycle events.
 *
 * @remarks
 * Uses a subset of pino's Logger API — `info()` and `error()` — to avoid
 * tight coupling to the full pino type. Any pino Logger instance satisfies
 * this interface.
 *
 * @example
 * ```typescript
 * const logger: AuthLogger = createLogger('auth');
 * ```
 */
export interface AuthLogger {
  /** Log informational messages. */
  info(...args: readonly unknown[]): void;
  /** Log error messages. */
  error(...args: readonly unknown[]): void;
}

/** Default session timeout: 30 minutes. */
const DEFAULT_SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/** Default retry base delay for login attempts. */
const DEFAULT_LOGIN_BASE_DELAY = 1000;

/** Default max retries for login attempts. */
const DEFAULT_LOGIN_MAX_RETRIES = 2;

/**
 * Options for constructing a SAPAuthHandler.
 *
 * @example
 * ```typescript
 * const options: SAPAuthHandlerOptions = { strategy, logger };
 * ```
 */
export interface SAPAuthHandlerOptions {
  /** Authentication strategy to delegate to. */
  readonly strategy: AuthStrategy;
  /** Logger instance for lifecycle events. */
  readonly logger: AuthLogger;
}

/**
 * Manages SAP authentication lifecycle with retry and session tracking.
 *
 * @example
 * ```typescript
 * const handler = new SAPAuthHandler({ strategy, logger });
 * await handler.login(page, config);
 * const isAuth = await handler.isAuthenticated(page);
 * ```
 */
export class SAPAuthHandler {
  private readonly strategy: AuthStrategy;
  private readonly logger: AuthLogger;
  private sessionInfo: SessionInfo | null = null;
  private loginTimestamp: number | null = null;

  constructor(options: SAPAuthHandlerOptions) {
    this.strategy = options.strategy;
    this.logger = options.logger;
  }

  /**
   * Login to SAP system with retry logic.
   *
   * @remarks
   * Delegates to the configured strategy's `authenticate()` method,
   * wrapped in `retry()` for exponential backoff. After authentication,
   * verifies the session via `strategy.isAuthenticated()`.
   *
   * @param page - Playwright page for browser interactions.
   * @param config - SAP authentication configuration.
   * @throws {@link AuthError} When authentication fails after all retries.
   *
   * @example
   * ```typescript
   * await handler.login(page, config);
   * ```
   */
  @ui5Step
  async login(page: AuthPage, config: Readonly<SAPAuthConfig>): Promise<void> {
    this.logger.info({ strategy: this.strategy.name, url: config.url }, 'Starting SAP login');

    try {
      await retry(
        async () => {
          await this.strategy.authenticate(page, config);

          const isAuth = await this.strategy.isAuthenticated(page);
          if (!isAuth) {
            throw new AuthError({
              message: 'Post-login verification failed: not authenticated',
              attempted: `Verify authentication after login to ${config.url}`,
              retryable: true,
              strategy: this.strategy.name,
              loginUrl: config.url,
              suggestions: [
                'Check if credentials are correct',
                'Verify the SAP system is reachable',
                'Check if the login page has changed',
              ],
            });
          }
        },
        {
          maxRetries: DEFAULT_LOGIN_MAX_RETRIES,
          baseDelay: DEFAULT_LOGIN_BASE_DELAY,
          shouldRetry: (error: Error) => {
            if ('retryable' in error && typeof error.retryable === 'boolean') {
              return error.retryable;
            }
            return true;
          },
        },
      );

      this.loginTimestamp = Date.now();
      this.sessionInfo = {
        authenticatedAt: this.loginTimestamp,
        strategyName: this.strategy.name,
        isValid: true,
      };

      this.logger.info({ strategy: this.strategy.name }, 'SAP login successful');
    } catch (error: unknown) {
      this.logger.error({ strategy: this.strategy.name, error }, 'SAP login failed');
      throw error;
    }
  }

  /**
   * Login to SAP system using environment variables.
   *
   * @remarks
   * Reads `SAP_ACTIVE_SYSTEM` (defaults to `'onprem'`) to determine
   * which set of env vars to use:
   * - `cloud`: `SAP_CLOUD_BASE_URL`, `SAP_CLOUD_USERNAME`, `SAP_CLOUD_PASSWORD`
   * - `onprem`: `SAP_ONPREM_BASE_URL`, `SAP_ONPREM_USERNAME`, `SAP_ONPREM_PASSWORD`
   *
   * Common optional vars: `SAP_CLIENT`, `SAP_LANGUAGE`, `SAP_AUTH_STRATEGY`.
   *
   * @param page - Playwright page for browser interactions.
   * @throws {@link AuthError} When required environment variables are missing.
   *
   * @example
   * ```typescript
   * // Set env vars: SAP_ACTIVE_SYSTEM=cloud SAP_CLOUD_BASE_URL=... etc.
   * await handler.loginFromEnv(page);
   * ```
   */
  @ui5Step
  async loginFromEnv(page: AuthPage): Promise<void> {
    const config = this.buildConfigFromEnv();
    await this.login(page, config);
  }

  /**
   * Logout and clear session state.
   *
   * @remarks
   * Navigates to a blank page and clears internal session tracking.
   *
   * @param page - Playwright page for browser interactions.
   *
   * @example
   * ```typescript
   * await handler.logout(page);
   * ```
   */
  @ui5Step
  async logout(page: AuthPage): Promise<void> {
    this.logger.info({ strategy: this.strategy.name }, 'Logging out of SAP');

    // Navigate to a blank page to clear browser state
    await page.goto('about:blank');

    this.sessionInfo = null;
    this.loginTimestamp = null;

    this.logger.info({ strategy: this.strategy.name }, 'SAP logout complete');
  }

  /**
   * Check if the current page is authenticated.
   *
   * @param page - Playwright page to check.
   * @returns `true` if authenticated.
   *
   * @example
   * ```typescript
   * const isAuth = await handler.isAuthenticated(page);
   * ```
   */
  @ui5Step
  async isAuthenticated(page: AuthPage): Promise<boolean> {
    return this.strategy.isAuthenticated(page);
  }

  /**
   * Check if the current session has expired.
   *
   * @param timeoutMs - Session timeout in milliseconds (default: 30 min).
   * @returns `true` if session is expired or no login has occurred.
   *
   * @example
   * ```typescript
   * if (handler.isSessionExpired()) {
   *   await handler.login(page, config);
   * }
   * ```
   */
  isSessionExpired(timeoutMs?: number): boolean {
    if (this.loginTimestamp === null) {
      return true;
    }

    const timeout = timeoutMs ?? DEFAULT_SESSION_TIMEOUT_MS;
    const elapsed = Date.now() - this.loginTimestamp;

    return elapsed > timeout;
  }

  /**
   * Get current session information.
   *
   * @returns Session info or `null` if not logged in.
   *
   * @example
   * ```typescript
   * const session = handler.getSessionInfo();
   * if (session) console.log(session.strategyName);
   * ```
   */
  getSessionInfo(): Readonly<SessionInfo> | null {
    return this.sessionInfo;
  }

  /**
   * Build SAPAuthConfig from environment variables.
   *
   * @returns Validated auth config from env vars.
   * @throws {@link AuthError} When required env vars are missing.
   */
  private buildConfigFromEnv(): Readonly<SAPAuthConfig> {
    const activeSystem = process.env['SAP_ACTIVE_SYSTEM'] ?? 'onprem';
    const isCloud = activeSystem === 'cloud';

    const urlKey = isCloud ? 'SAP_CLOUD_BASE_URL' : 'SAP_ONPREM_BASE_URL';
    const userKey = isCloud ? 'SAP_CLOUD_USERNAME' : 'SAP_ONPREM_USERNAME';
    const passKey = isCloud ? 'SAP_CLOUD_PASSWORD' : 'SAP_ONPREM_PASSWORD';

    // eslint-disable-next-line security/detect-object-injection -- urlKey is a controlled string literal
    const url = process.env[urlKey] ?? '';
    // eslint-disable-next-line security/detect-object-injection -- userKey is a controlled string literal
    const username = process.env[userKey] ?? '';
    // eslint-disable-next-line security/detect-object-injection -- passKey is a controlled string literal
    const password = process.env[passKey] ?? '';

    const missing: string[] = [];
    if (url === '') missing.push(urlKey);
    if (username === '') missing.push(userKey);
    // eslint-disable-next-line security/detect-possible-timing-attacks -- not comparing secrets
    if (password === '') missing.push(passKey);

    if (missing.length > 0) {
      throw new AuthError({
        message: `Missing required environment variables: ${missing.join(', ')}`,
        attempted: `Build auth config from environment for ${activeSystem} system`,
        retryable: false,
        suggestions: [
          `Set the following env vars: ${missing.join(', ')}`,
          'Check your .env file or CI/CD secrets configuration',
          'See documentation for required environment variables',
        ],
      });
    }

    return {
      url,
      username,
      password,
      client: process.env['SAP_CLIENT'],
      language: process.env['SAP_LANGUAGE'],
      strategy: process.env['SAP_AUTH_STRATEGY'],
    };
  }
}
