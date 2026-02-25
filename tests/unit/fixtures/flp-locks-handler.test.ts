/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/flp-locks-handler.ts` -- FLPLocksHandler class.
 *
 * @remarks
 * FLPLocksHandler manages SAP SM12 lock entries via OData HTTP requests.
 * Provides getLockEntries, getNumberOfLockEntries, deleteAllLockEntries,
 * and cleanup (non-fatal teardown).
 *
 * Mock strategy: vi.mock() for logger and step-decorator, inline vi.fn() for page.request.
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FLPError } from '#core/errors/flp-error.js';

// ── Mock logger ────────────────────────────────────────────────────────
const mockChildLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockCreateLogger = vi.fn().mockReturnValue(mockChildLogger);

vi.mock('#core/logging/logger.js', () => ({
  createLogger: mockCreateLogger,
}));

// ── Mock step decorator (no-op passthrough) ────────────────────────────
vi.mock('#core/utils/step-decorator.js', () => ({
  ui5Step: (target: unknown) => target,
}));

// ── Import after mocks ─────────────────────────────────────────────────
const { FLPLocksHandler } = await import('#fixtures/flp-locks-handler.js');

// ── Helper: create mock page with request methods ──────────────────────

interface MockApiResponse {
  status: () => number;
  json: () => Promise<unknown>;
  headers: () => Record<string, string>;
  ok: () => boolean;
}

function createMockResponse(
  statusCode: number,
  data: unknown,
  headers: Record<string, string> = {},
): MockApiResponse {
  return {
    status: () => statusCode,
    // eslint-disable-next-line @typescript-eslint/require-await
    json: async () => data,
    headers: () => headers,
    ok: () => statusCode >= 200 && statusCode < 300,
  };
}

function createMockPage(): Page & {
  request: {
    get: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    head: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
} {
  return {
    request: {
      get: vi.fn(),
      delete: vi.fn(),
      head: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      put: vi.fn(),
    },
  } as unknown as Page & {
    request: {
      get: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      head: ReturnType<typeof vi.fn>;
      post: ReturnType<typeof vi.fn>;
      patch: ReturnType<typeof vi.fn>;
      put: ReturnType<typeof vi.fn>;
    };
  };
}

// ── Sample OData response data ─────────────────────────────────────────

const SAMPLE_ENTRIES = {
  d: {
    results: [
      {
        LockObject: 'MARA',
        LockOwner: 'TESTUSER01',
        LockMode: 'E',
        Timestamp: '2024-01-15T10:30:00Z',
      },
      {
        LockObject: 'VBAK',
        LockOwner: 'TESTUSER01',
        LockMode: 'S',
        Timestamp: '2024-01-15T11:00:00Z',
      },
    ],
  },
};

const EMPTY_ENTRIES = { d: { results: [] } };

// ── Tests ───────────────────────────────────────────────────────────────

describe('FLPLocksHandler', () => {
  let page: ReturnType<typeof createMockPage>;
  let handler: InstanceType<typeof FLPLocksHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    page = createMockPage();
    handler = new FLPLocksHandler({ page: page as unknown as Page });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 1: Constructor
  // ═══════════════════════════════════════════════════════════════════════

  describe('constructor', () => {
    it('creates with default serviceUrl and timeout', () => {
      expect(mockCreateLogger).toHaveBeenCalledWith('flp-locks');
      // Handler created without errors — defaults applied internally
      expect(handler).toBeDefined();
    });

    it('accepts custom serviceUrl and timeout', () => {
      const custom = new FLPLocksHandler({
        page: page as unknown as Page,
        serviceUrl: '/custom/odata/svc',
        timeout: 5000,
      });
      expect(custom).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 2: getLockEntries
  // ═══════════════════════════════════════════════════════════════════════

  describe('getLockEntries()', () => {
    it('queries correct URL without filter and returns parsed entries', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));

      const entries = await handler.getLockEntries();

      expect(page.request.get).toHaveBeenCalledWith(
        '/sap/opu/odata/sap/SM12_SRV/LockEntries',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
          timeout: 10_000,
        }),
      );
      expect(entries).toHaveLength(2);
      expect(entries[0]).toStrictEqual({
        lockObject: 'MARA',
        lockOwner: 'TESTUSER01',
        lockMode: 'E',
        timestamp: '2024-01-15T10:30:00Z',
      });
      expect(entries[1]).toStrictEqual({
        lockObject: 'VBAK',
        lockOwner: 'TESTUSER01',
        lockMode: 'S',
        timestamp: '2024-01-15T11:00:00Z',
      });
    });

    it('adds $filter query param when username is provided', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));

      await handler.getLockEntries('TESTUSER01');

      expect(page.request.get).toHaveBeenCalledWith(
        "/sap/opu/odata/sap/SM12_SRV/LockEntries?$filter=LockOwner eq 'TESTUSER01'",
        expect.objectContaining({
          headers: { Accept: 'application/json' },
        }),
      );
    });

    it('handles response with missing optional fields', async () => {
      const partialData = {
        d: {
          results: [{ LockObject: 'MARA' }],
        },
      };
      page.request.get.mockResolvedValue(createMockResponse(200, partialData));

      const entries = await handler.getLockEntries();

      expect(entries).toHaveLength(1);
      expect(entries[0]).toStrictEqual({
        lockObject: 'MARA',
        lockOwner: '',
        lockMode: '',
        timestamp: '',
      });
    });

    it('handles response with missing d.results gracefully', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, {}));

      const entries = await handler.getLockEntries();

      expect(entries).toHaveLength(0);
    });

    it('throws FLPError with ERR_FLP_API_UNAVAILABLE on 404', async () => {
      page.request.get.mockResolvedValue(createMockResponse(404, {}));

      await expect(handler.getLockEntries()).rejects.toThrow(FLPError);

      try {
        await handler.getLockEntries();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(FLPError);
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_API_UNAVAILABLE');
        expect(flpError.flpService).toBe('SM12_SRV');
        expect(flpError.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('throws FLPError with ERR_FLP_API_UNAVAILABLE on 500', async () => {
      page.request.get.mockResolvedValue(createMockResponse(500, {}));

      await expect(handler.getLockEntries()).rejects.toThrow(FLPError);

      try {
        await handler.getLockEntries();
      } catch (error: unknown) {
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_API_UNAVAILABLE');
      }
    });

    it('throws FLPError with ERR_FLP_PERMISSION_DENIED on 403', async () => {
      page.request.get.mockResolvedValue(createMockResponse(403, {}));

      await expect(handler.getLockEntries()).rejects.toThrow(FLPError);

      try {
        await handler.getLockEntries();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(FLPError);
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_PERMISSION_DENIED');
        expect(flpError.flpService).toBe('SM12_SRV');
      }
    });

    it('throws FLPError with ERR_FLP_OPERATION_TIMEOUT on timeout error', async () => {
      page.request.get.mockRejectedValue(new Error('Request timeout exceeded'));

      await expect(handler.getLockEntries()).rejects.toThrow(FLPError);

      try {
        await handler.getLockEntries();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(FLPError);
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_OPERATION_TIMEOUT');
      }
    });

    it('throws FLPError with ERR_FLP_API_UNAVAILABLE on generic connection error', async () => {
      page.request.get.mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(handler.getLockEntries()).rejects.toThrow(FLPError);

      try {
        await handler.getLockEntries();
      } catch (error: unknown) {
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_API_UNAVAILABLE');
        expect(flpError.message).toContain('ECONNREFUSED');
      }
    });

    it('re-throws FLPError without wrapping', async () => {
      const originalError = new FLPError({
        code: 'ERR_FLP_PERMISSION_DENIED',
        message: 'Original error',
        attempted: 'test',
      });
      page.request.get.mockRejectedValue(originalError);

      await expect(handler.getLockEntries()).rejects.toBe(originalError);
    });

    it('tracks lock keys for later cleanup', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));

      await handler.getLockEntries();

      // Call cleanup to verify tracked keys exist — setup head/delete mocks
      page.request.head.mockResolvedValue(
        createMockResponse(200, {}, { 'x-csrf-token': 'token123' }),
      );
      page.request.delete.mockResolvedValue(createMockResponse(204, {}));

      await handler.cleanup();

      // Should have attempted delete for both tracked entries
      expect(page.request.delete).toHaveBeenCalledTimes(2);
    });

    it('does not duplicate tracked lock keys on repeated calls', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));

      // Call twice with same entries
      await handler.getLockEntries();
      await handler.getLockEntries();

      page.request.head.mockResolvedValue(
        createMockResponse(200, {}, { 'x-csrf-token': 'token123' }),
      );
      page.request.delete.mockResolvedValue(createMockResponse(204, {}));

      await handler.cleanup();

      // Should still only delete 2 unique keys
      expect(page.request.delete).toHaveBeenCalledTimes(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 3: getNumberOfLockEntries
  // ═══════════════════════════════════════════════════════════════════════

  describe('getNumberOfLockEntries()', () => {
    it('returns count of lock entries', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));

      const count = await handler.getNumberOfLockEntries();

      expect(count).toBe(2);
    });

    it('returns 0 when no entries exist', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, EMPTY_ENTRIES));

      const count = await handler.getNumberOfLockEntries();

      expect(count).toBe(0);
    });

    it('passes username filter through to getLockEntries', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));

      await handler.getNumberOfLockEntries('TESTUSER01');

      expect(page.request.get).toHaveBeenCalledWith(
        expect.stringContaining("$filter=LockOwner eq 'TESTUSER01'"),
        expect.anything(),
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 4: deleteAllLockEntries
  // ═══════════════════════════════════════════════════════════════════════

  describe('deleteAllLockEntries()', () => {
    it('fetches CSRF token via HEAD and deletes each entry', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      page.request.head.mockResolvedValue(
        createMockResponse(200, {}, { 'x-csrf-token': 'csrf-abc-123' }),
      );
      page.request.delete.mockResolvedValue(createMockResponse(204, {}));

      const deleted = await handler.deleteAllLockEntries('TESTUSER01');

      expect(deleted).toBe(2);

      // Verify HEAD request for CSRF token
      expect(page.request.head).toHaveBeenCalledWith(
        '/sap/opu/odata/sap/SM12_SRV',
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          headers: expect.objectContaining({
            'X-CSRF-Token': 'Fetch',
          }),
        }),
      );

      // Verify DELETE requests with CSRF token
      expect(page.request.delete).toHaveBeenCalledTimes(2);
      expect(page.request.delete).toHaveBeenCalledWith(
        "/sap/opu/odata/sap/SM12_SRV/LockEntries(LockObject='MARA',LockOwner='TESTUSER01')",
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          headers: expect.objectContaining({
            'X-CSRF-Token': 'csrf-abc-123',
          }),
        }),
      );
      expect(page.request.delete).toHaveBeenCalledWith(
        "/sap/opu/odata/sap/SM12_SRV/LockEntries(LockObject='VBAK',LockOwner='TESTUSER01')",
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          headers: expect.objectContaining({
            'X-CSRF-Token': 'csrf-abc-123',
          }),
        }),
      );
    });

    it('returns 0 and makes no delete calls when no entries exist', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, EMPTY_ENTRIES));

      const deleted = await handler.deleteAllLockEntries();

      expect(deleted).toBe(0);
      expect(page.request.head).not.toHaveBeenCalled();
      expect(page.request.delete).not.toHaveBeenCalled();
    });

    it('throws FLPError with ERR_FLP_PERMISSION_DENIED on 403 during delete', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      page.request.head.mockResolvedValue(createMockResponse(200, {}, { 'x-csrf-token': 'token' }));
      page.request.delete.mockResolvedValue(createMockResponse(403, {}));

      await expect(handler.deleteAllLockEntries()).rejects.toThrow(FLPError);

      try {
        // Reset mocks for second call
        page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
        page.request.head.mockResolvedValue(
          createMockResponse(200, {}, { 'x-csrf-token': 'token' }),
        );
        page.request.delete.mockResolvedValue(createMockResponse(403, {}));
        await handler.deleteAllLockEntries();
      } catch (error: unknown) {
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_PERMISSION_DENIED');
      }
    });

    it('throws FLPError with ERR_FLP_API_UNAVAILABLE on 500 during delete', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      page.request.head.mockResolvedValue(createMockResponse(200, {}, { 'x-csrf-token': 'token' }));
      page.request.delete.mockResolvedValue(createMockResponse(500, {}));

      await expect(handler.deleteAllLockEntries()).rejects.toThrow(FLPError);

      try {
        page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
        page.request.head.mockResolvedValue(
          createMockResponse(200, {}, { 'x-csrf-token': 'token' }),
        );
        page.request.delete.mockResolvedValue(createMockResponse(500, {}));
        await handler.deleteAllLockEntries();
      } catch (error: unknown) {
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_API_UNAVAILABLE');
      }
    });

    it('uses custom serviceUrl when provided', async () => {
      const customHandler = new FLPLocksHandler({
        page: page as unknown as Page,
        serviceUrl: '/custom/SM12',
      });

      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      page.request.head.mockResolvedValue(createMockResponse(200, {}, { 'x-csrf-token': 'token' }));
      page.request.delete.mockResolvedValue(createMockResponse(204, {}));

      await customHandler.deleteAllLockEntries();

      expect(page.request.get).toHaveBeenCalledWith('/custom/SM12/LockEntries', expect.anything());
      expect(page.request.head).toHaveBeenCalledWith('/custom/SM12', expect.anything());
    });

    it('handles empty CSRF token with warning log', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      page.request.head.mockResolvedValue(createMockResponse(200, {}, {}));
      page.request.delete.mockResolvedValue(createMockResponse(204, {}));

      await handler.deleteAllLockEntries();

      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        'CSRF token response was empty, using empty token',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 5: cleanup
  // ═══════════════════════════════════════════════════════════════════════

  describe('cleanup()', () => {
    it('does nothing when no tracked keys exist', async () => {
      await handler.cleanup();

      expect(page.request.head).not.toHaveBeenCalled();
      expect(page.request.delete).not.toHaveBeenCalled();
      expect(mockChildLogger.debug).toHaveBeenCalledWith('No tracked lock keys to clean up');
    });

    it('deletes tracked keys in reverse order', async () => {
      // First, populate tracked keys via getLockEntries
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      await handler.getLockEntries();

      // Setup cleanup mocks
      page.request.head.mockResolvedValue(
        createMockResponse(200, {}, { 'x-csrf-token': 'cleanup-token' }),
      );
      page.request.delete.mockResolvedValue(createMockResponse(204, {}));

      await handler.cleanup();

      expect(page.request.delete).toHaveBeenCalledTimes(2);

      // Verify reverse order: VBAK first, then MARA
      const deleteUrls = page.request.delete.mock.calls.map((call: unknown[]) => call[0] as string);
      expect(deleteUrls[0]).toContain('VBAK');
      expect(deleteUrls[1]).toContain('MARA');
    });

    it('logs warning and continues on partial delete failure', async () => {
      // Populate tracked keys
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      await handler.getLockEntries();

      // Setup: CSRF OK, first delete fails, second succeeds
      page.request.head.mockResolvedValue(createMockResponse(200, {}, { 'x-csrf-token': 'token' }));
      page.request.delete
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(createMockResponse(204, {}));

      // Cleanup should not throw
      await expect(handler.cleanup()).resolves.toBeUndefined();

      // Both deletes should have been attempted
      expect(page.request.delete).toHaveBeenCalledTimes(2);

      // Warning logged for the failed delete
      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Network error' }),
        'Failed to delete lock entry during cleanup',
      );
    });

    it('handles CSRF token fetch failure gracefully during cleanup', async () => {
      // Populate tracked keys
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      await handler.getLockEntries();

      // CSRF token fetch fails
      page.request.head.mockRejectedValue(new Error('Connection refused'));

      // Cleanup should not throw
      await expect(handler.cleanup()).resolves.toBeUndefined();

      // No deletes attempted since CSRF failed
      expect(page.request.delete).not.toHaveBeenCalled();

      // Warning logged
      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Connection refused' }),
        'Failed to fetch CSRF token during cleanup',
      );
    });

    it('clears tracked keys after cleanup attempt', async () => {
      // Populate tracked keys
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      await handler.getLockEntries();

      // Setup cleanup mocks
      page.request.head.mockResolvedValue(createMockResponse(200, {}, { 'x-csrf-token': 'token' }));
      page.request.delete.mockResolvedValue(createMockResponse(204, {}));

      await handler.cleanup();
      expect(page.request.delete).toHaveBeenCalledTimes(2);

      // Clear mocks and call cleanup again — should be no-op
      vi.clearAllMocks();
      await handler.cleanup();
      expect(page.request.delete).not.toHaveBeenCalled();
    });

    it('handles non-Error thrown during CSRF fetch', async () => {
      // Populate tracked keys
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      await handler.getLockEntries();

      // CSRF throws a string instead of Error
      page.request.head.mockRejectedValue('string error');

      await expect(handler.cleanup()).resolves.toBeUndefined();

      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'string error' }),
        'Failed to fetch CSRF token during cleanup',
      );
    });

    it('handles non-Error thrown during delete in cleanup', async () => {
      // Populate tracked keys
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));
      await handler.getLockEntries();

      page.request.head.mockResolvedValue(createMockResponse(200, {}, { 'x-csrf-token': 'token' }));
      // Throw a string instead of Error
      page.request.delete
        .mockRejectedValueOnce('not an error object')
        .mockResolvedValueOnce(createMockResponse(204, {}));

      await expect(handler.cleanup()).resolves.toBeUndefined();

      expect(mockChildLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'not an error object' }),
        'Failed to delete lock entry during cleanup',
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 6: Timeout error handling
  // ═══════════════════════════════════════════════════════════════════════

  describe('timeout error handling', () => {
    it('maps Timeout (uppercase T) errors to ERR_FLP_OPERATION_TIMEOUT', async () => {
      page.request.get.mockRejectedValue(new Error('Timeout: 10000ms exceeded'));

      await expect(handler.getLockEntries()).rejects.toThrow(FLPError);

      try {
        await handler.getLockEntries();
      } catch (error: unknown) {
        const flpError = error as FLPError;
        expect(flpError.code).toBe('ERR_FLP_OPERATION_TIMEOUT');
      }
    });

    it('uses custom timeout value in requests', async () => {
      const customHandler = new FLPLocksHandler({
        page: page as unknown as Page,
        timeout: 5000,
      });
      page.request.get.mockResolvedValue(createMockResponse(200, EMPTY_ENTRIES));

      await customHandler.getLockEntries();

      expect(page.request.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ timeout: 5000 }),
      );
    });

    it('includes timeout value in error message', async () => {
      const customHandler = new FLPLocksHandler({
        page: page as unknown as Page,
        timeout: 3000,
      });
      page.request.get.mockRejectedValue(new Error('Request timeout'));

      try {
        await customHandler.getLockEntries();
      } catch (error: unknown) {
        const flpError = error as FLPError;
        expect(flpError.message).toContain('3000');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 7: Logger
  // ═══════════════════════════════════════════════════════════════════════

  describe('logging', () => {
    it('creates a child logger with module name "flp-locks"', () => {
      expect(mockCreateLogger).toHaveBeenCalledWith('flp-locks');
    });

    it('logs debug message when querying entries', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, EMPTY_ENTRIES));

      await handler.getLockEntries('SOMEONE');

      expect(mockChildLogger.debug).toHaveBeenCalledWith(
        { username: 'SOMEONE' },
        'Querying SM12 lock entries',
      );
    });

    it('logs info message with entry count after retrieval', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, SAMPLE_ENTRIES));

      await handler.getLockEntries();

      expect(mockChildLogger.info).toHaveBeenCalledWith(
        { count: 2, username: undefined },
        'Retrieved lock entries',
      );
    });

    it('logs info when no entries to delete', async () => {
      page.request.get.mockResolvedValue(createMockResponse(200, EMPTY_ENTRIES));

      await handler.deleteAllLockEntries('USER1');

      expect(mockChildLogger.info).toHaveBeenCalledWith(
        { username: 'USER1' },
        'No lock entries to delete',
      );
    });
  });
});
