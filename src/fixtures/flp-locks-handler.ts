/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * FLP Locks handler -- manages SAP SM12 lock entries for test isolation.
 *
 * @ai
 * @aiContext Manages SAP SM12 lock entries via OData (SM12_SRV). Query, count, delete lock entries
 * by username. Auto-cleanup tracks and releases locks in reverse order during teardown.
 *
 * @remarks
 * Uses HTTP OData requests via `page.request` to query and delete lock entries
 * from the SM12_SRV OData service. Provides auto-cleanup teardown that releases
 * all tracked locks in reverse order.
 *
 * @example
 * ```typescript
 * const locks = new FLPLocksHandler({ page });
 * const entries = await locks.getLockEntries('TESTUSER');
 * await locks.deleteAllLockEntries('TESTUSER');
 * ```
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import type { Logger } from 'pino';

import { ErrorCode } from '#core/errors/codes.js';
import { FLPError } from '#core/errors/flp-error.js';
import { createLogger } from '#core/logging/logger.js';
import { ui5Step } from '#core/utils/step-decorator.js';

/**
 * Options for constructing an FLPLocksHandler.
 *
 * @example
 * ```typescript
 * const options: FLPLocksHandlerOptions = {
 *   page,
 *   serviceUrl: '/sap/opu/odata/sap/SM12_SRV',
 *   timeout: 10_000,
 * };
 * ```
 */
export interface FLPLocksHandlerOptions {
  readonly page: Page;
  /** SM12 OData service path. Defaults to '/sap/opu/odata/sap/SM12_SRV'. */
  readonly serviceUrl?: string;
  /** Timeout for OData requests in ms. Defaults to 10000. */
  readonly timeout?: number;
}

/**
 * Represents a single SM12 lock entry returned by the OData service.
 *
 * @example
 * ```typescript
 * const entry: LockEntry = {
 *   lockObject: 'MARA',
 *   lockOwner: 'TESTUSER01',
 *   lockMode: 'E',
 *   timestamp: '2024-01-15T10:30:00Z',
 * };
 * ```
 */
export interface LockEntry {
  readonly lockObject: string;
  readonly lockOwner: string;
  readonly lockMode: string;
  readonly timestamp: string;
}

/** Default SM12 OData service path. */
const DEFAULT_SERVICE_URL = '/sap/opu/odata/sap/SM12_SRV';

/** Default timeout for OData requests in ms. */
const DEFAULT_TIMEOUT = 10_000;

/**
 * Shape of a single lock entry in the OData JSON response.
 */
interface ODataLockEntry {
  readonly LockObject?: string;
  readonly LockOwner?: string;
  readonly LockMode?: string;
  readonly Timestamp?: string;
}

/**
 * Shape of the OData JSON response body for lock entries.
 */
interface ODataLockResponse {
  readonly d?: {
    readonly results?: readonly ODataLockEntry[];
  };
}

/**
 * FLP Locks handler for managing SAP SM12 lock entries.
 *
 * @remarks
 * Provides methods to query lock entries, count them, delete them, and
 * auto-cleanup tracked entries during teardown. All public methods are
 * decorated with `@ui5Step` for Playwright trace/report integration.
 *
 * @capability flpLocks.getLockEntries
 *
 * @example
 * ```typescript
 * const locks = new FLPLocksHandler({ page });
 * const count = await locks.getNumberOfLockEntries('TESTUSER');
 * await locks.deleteAllLockEntries('TESTUSER');
 * await locks.cleanup();
 * ```
 */
export class FLPLocksHandler {
  private readonly page: Page;
  private readonly serviceUrl: string;
  private readonly timeout: number;
  private readonly log: Logger;
  private readonly trackedLockKeys: string[];

  constructor(options: FLPLocksHandlerOptions) {
    this.page = options.page;
    this.serviceUrl = options.serviceUrl ?? DEFAULT_SERVICE_URL;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this.log = createLogger('flp-locks');
    this.trackedLockKeys = [];
  }

  /**
   * Queries SM12 lock entries from the OData service.
   *
   * @param username - Optional username to filter lock entries by LockOwner.
   * @returns Array of parsed lock entries.
   * @throws FLPError with ERR_FLP_API_UNAVAILABLE on 404 or connection error.
   * @throws FLPError with ERR_FLP_PERMISSION_DENIED on 403.
   * @throws FLPError with ERR_FLP_OPERATION_TIMEOUT on timeout.
   *
   * @example
   * ```typescript
   * const entries = await locks.getLockEntries('TESTUSER');
   * ```
   */
  @ui5Step
  async getLockEntries(username?: string): Promise<readonly LockEntry[]> {
    this.log.debug({ username }, 'Querying SM12 lock entries');

    let url = `${this.serviceUrl}/LockEntries`;
    if (username !== undefined) {
      url += `?$filter=LockOwner eq '${username}'`;
    }

    const response = await this.executeGet(url);
    const data = (await response.json()) as ODataLockResponse;

    const results = data.d?.results ?? [];
    const entries: LockEntry[] = results.map((entry) => ({
      lockObject: entry.LockObject ?? '',
      lockOwner: entry.LockOwner ?? '',
      lockMode: entry.LockMode ?? '',
      timestamp: entry.Timestamp ?? '',
    }));

    // Track lock keys for cleanup
    for (const entry of entries) {
      const key = `${entry.lockObject}:${entry.lockOwner}`;
      if (!this.trackedLockKeys.includes(key)) {
        this.trackedLockKeys.push(key);
      }
    }

    this.log.info({ count: entries.length, username }, 'Retrieved lock entries');
    return entries;
  }

  /**
   * Returns the number of SM12 lock entries.
   *
   * @param username - Optional username to filter by LockOwner.
   * @returns Number of lock entries found.
   *
   * @example
   * ```typescript
   * const count = await locks.getNumberOfLockEntries('TESTUSER');
   * ```
   */
  @ui5Step
  async getNumberOfLockEntries(username?: string): Promise<number> {
    const entries = await this.getLockEntries(username);
    return entries.length;
  }

  /**
   * Deletes all SM12 lock entries, optionally filtered by username.
   *
   * @remarks
   * Fetches a CSRF token via HEAD request, then deletes each entry individually.
   *
   * @param username - Optional username to filter entries to delete.
   * @returns Number of entries deleted.
   * @throws FLPError with ERR_FLP_API_UNAVAILABLE on 404 or connection error.
   * @throws FLPError with ERR_FLP_PERMISSION_DENIED on 403.
   *
   * @example
   * ```typescript
   * const deleted = await locks.deleteAllLockEntries('TESTUSER');
   * ```
   */
  @ui5Step
  async deleteAllLockEntries(username?: string): Promise<number> {
    const entries = await this.getLockEntries(username);

    if (entries.length === 0) {
      this.log.info({ username }, 'No lock entries to delete');
      return 0;
    }

    const csrfToken = await this.fetchCsrfToken();

    for (const entry of entries) {
      const deleteUrl = `${this.serviceUrl}/LockEntries(LockObject='${entry.lockObject}',LockOwner='${entry.lockOwner}')`;
      await this.executeDelete(deleteUrl, csrfToken);
    }

    this.log.info({ count: entries.length, username }, 'Deleted lock entries');
    return entries.length;
  }

  /**
   * Non-fatal teardown: deletes tracked lock keys in reverse order.
   *
   * @remarks
   * Logs warnings on failure but does not throw. Safe to call in
   * `afterEach` / `afterAll` hooks.
   *
   * @example
   * ```typescript
   * await locks.cleanup();
   * ```
   */
  @ui5Step
  async cleanup(): Promise<void> {
    if (this.trackedLockKeys.length === 0) {
      this.log.debug('No tracked lock keys to clean up');
      return;
    }

    this.log.info({ count: this.trackedLockKeys.length }, 'Cleaning up tracked lock entries');

    let csrfToken: string | undefined;
    try {
      csrfToken = await this.fetchCsrfToken();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.log.warn({ error: message }, 'Failed to fetch CSRF token during cleanup');
      return;
    }

    // Delete in reverse order
    const reversedKeys = [...this.trackedLockKeys].reverse();
    for (const key of reversedKeys) {
      const parts = key.split(':');
      const lockObject = parts[0] ?? '';
      const lockOwner = parts[1] ?? '';
      const deleteUrl = `${this.serviceUrl}/LockEntries(LockObject='${lockObject}',LockOwner='${lockOwner}')`;
      try {
        await this.executeDelete(deleteUrl, csrfToken);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.log.warn({ key, error: message }, 'Failed to delete lock entry during cleanup');
      }
    }

    // Clear tracked keys after cleanup attempt
    this.trackedLockKeys.length = 0;
  }

  /**
   * Executes a GET request against the OData service.
   */
  private async executeGet(url: string): Promise<{ json(): Promise<unknown>; status(): number }> {
    try {
      const response = await this.page.request.get(url, {
        headers: { Accept: 'application/json' },
        timeout: this.timeout,
      });

      const status = response.status();

      if (status === 403) {
        throw new FLPError({
          code: ErrorCode.ERR_FLP_PERMISSION_DENIED,
          message: `Permission denied when accessing ${url}`,
          attempted: `GET ${url}`,
          retryable: false,
          flpService: 'SM12_SRV',
          suggestions: [
            'Verify the user has authorization for SM12 lock management',
            'Check SAP role assignments for the test user',
          ],
        });
      }

      if (status === 404 || status >= 500) {
        throw new FLPError({
          code: ErrorCode.ERR_FLP_API_UNAVAILABLE,
          message: `SM12_SRV service unavailable (HTTP ${String(status)})`,
          attempted: `GET ${url}`,
          retryable: true,
          flpService: 'SM12_SRV',
          suggestions: [
            'Verify the SM12_SRV OData service is activated in the SAP system',
            'Check the service URL path is correct',
          ],
        });
      }

      return response;
    } catch (error: unknown) {
      if (error instanceof FLPError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);

      if (message.includes('timeout') || message.includes('Timeout')) {
        throw new FLPError({
          code: ErrorCode.ERR_FLP_OPERATION_TIMEOUT,
          message: `Request timed out after ${String(this.timeout)}ms: ${url}`,
          attempted: `GET ${url}`,
          retryable: true,
          flpService: 'SM12_SRV',
          suggestions: [
            'Increase the timeout value in FLPLocksHandlerOptions',
            'Check network connectivity to the SAP system',
          ],
        });
      }

      throw new FLPError({
        code: ErrorCode.ERR_FLP_API_UNAVAILABLE,
        message: `Failed to connect to SM12_SRV: ${message}`,
        attempted: `GET ${url}`,
        retryable: true,
        flpService: 'SM12_SRV',
        suggestions: ['Verify the SAP system is reachable', 'Check the service URL configuration'],
      });
    }
  }

  /**
   * Fetches a CSRF token via HEAD request.
   */
  private async fetchCsrfToken(): Promise<string> {
    const response = await this.page.request.head(this.serviceUrl, {
      headers: {
        'X-CSRF-Token': 'Fetch',
        Accept: 'application/json',
      },
      timeout: this.timeout,
    });

    const token = response.headers()['x-csrf-token'] ?? '';

    if (token.length === 0) {
      this.log.warn('CSRF token response was empty, using empty token');
    }

    return token;
  }

  /**
   * Executes a DELETE request with CSRF token.
   */
  private async executeDelete(url: string, csrfToken: string): Promise<void> {
    const response = await this.page.request.delete(url, {
      headers: {
        'X-CSRF-Token': csrfToken,
        Accept: 'application/json',
      },
      timeout: this.timeout,
    });

    const status = response.status();

    if (status === 403) {
      throw new FLPError({
        code: ErrorCode.ERR_FLP_PERMISSION_DENIED,
        message: `Permission denied when deleting lock entry: ${url}`,
        attempted: `DELETE ${url}`,
        retryable: false,
        flpService: 'SM12_SRV',
        suggestions: [
          'Verify the user has authorization to delete SM12 lock entries',
          'Check if the CSRF token is valid',
        ],
      });
    }

    if (status === 404 || status >= 500) {
      throw new FLPError({
        code: ErrorCode.ERR_FLP_API_UNAVAILABLE,
        message: `Failed to delete lock entry (HTTP ${String(status)}): ${url}`,
        attempted: `DELETE ${url}`,
        retryable: true,
        flpService: 'SM12_SRV',
        suggestions: [
          'The lock entry may have already been released',
          'Verify the SM12_SRV service is available',
        ],
      });
    }
  }
}
