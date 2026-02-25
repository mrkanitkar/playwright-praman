/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/modules/odata.ts` — OData model-level operations.
 *
 * @remarks
 * Verifies model data retrieval, property access, OData load waiting,
 * CSRF token fetching, entity count, and pending changes detection.
 *
 * Mock strategy:
 * - Mock `ODataPage` with `evaluate()` and `waitForFunction()`
 * - Mock `ODataCSRFPage` extending `ODataPage` with `request.head()`
 * - No bridge mocking needed — OData module uses pure string scripts
 *
 * @module modules
 */
import { describe, expect, it, vi } from 'vitest';

import type { ODataCSRFPage, ODataPage } from '../../../src/modules/odata.js';

import { ODataError } from '#core/errors/odata-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';

const {
  getModelData,
  getModelProperty,
  waitForODataLoad,
  fetchCSRFToken,
  getEntityCount,
  hasPendingChanges,
} = await import('../../../src/modules/odata.js');

/**
 * Creates a mock ODataPage with configurable evaluate and waitForFunction.
 */
function createMockPage(evaluateResult?: unknown): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(evaluateResult),
    waitForFunction: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined),
  };
}

/** Casts a mock to ODataPage. */
function asPage(mock: ReturnType<typeof createMockPage>): ODataPage {
  return mock as unknown as ODataPage;
}

/**
 * Creates a mock ODataCSRFPage with request.head support.
 */
function createMockCSRFPage(options?: {
  status?: number;
  headers?: Record<string, string>;
  headThrows?: boolean;
}): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
  request: {
    head: ReturnType<typeof vi.fn>;
  };
} {
  const status = options?.status ?? 200;
  const headers = options?.headers ?? { 'x-csrf-token': 'test-token-abc' };

  const headFn =
    options?.headThrows === true
      ? vi
          .fn<(...args: unknown[]) => Promise<unknown>>()
          .mockRejectedValue(new Error('Network error'))
      : vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({
          status: () => status,
          headers: () => headers,
        });

  return {
    evaluate: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined),
    waitForFunction: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined),
    request: { head: headFn },
  };
}

/** Casts a mock to ODataCSRFPage. */
function asCSRFPage(mock: ReturnType<typeof createMockCSRFPage>): ODataCSRFPage {
  return mock as unknown as ODataCSRFPage;
}

describe('OData module', () => {
  // ── getModelData ──────────────────────────────────────────────────────

  describe('getModelData', () => {
    it('returns array data from default model', async () => {
      const products = [{ Name: 'Widget A' }, { Name: 'Widget B' }];
      const mock = createMockPage({ __data: products });
      const result = await getModelData(asPage(mock), '/Products');

      expect(result).toEqual(products);
      expect(mock.evaluate).toHaveBeenCalledTimes(1);
    });

    it('returns single entity data', async () => {
      const entity = { Name: 'Widget A', Price: 42 };
      const mock = createMockPage({ __data: entity });
      const result = await getModelData(asPage(mock), '/Products(1)');

      expect(result).toEqual(entity);
    });

    it('uses named model when modelName is provided', async () => {
      const mock = createMockPage({ __data: [] });
      await getModelData(asPage(mock), '/Items', { modelName: 'catalog' });

      const script = mock.evaluate.mock.calls[0]?.[0] as string;
      expect(script).toContain('"catalog"');
    });

    it('uses default (unnamed) model when modelName is omitted', async () => {
      const mock = createMockPage({ __data: [] });
      await getModelData(asPage(mock), '/Items');

      const script = mock.evaluate.mock.calls[0]?.[0] as string;
      expect(script).toContain('undefined');
      expect(script).not.toContain('"undefined"');
    });

    it('throws ODataError when model returns an error', async () => {
      const mock = createMockPage({ __error: 'Model not found' });

      await expect(getModelData(asPage(mock), '/BadPath')).rejects.toThrow(ODataError);

      await expect(getModelData(asPage(mock), '/BadPath')).rejects.toThrow(
        /Failed to get model data/,
      );
    });

    it('throws ODataError for invalid path not starting with "/"', async () => {
      const mock = createMockPage({ __data: [] });

      await expect(getModelData(asPage(mock), 'Products')).rejects.toThrow(ODataError);

      await expect(getModelData(asPage(mock), 'Products')).rejects.toThrow(/must start with/);
    });
  });

  // ── getModelProperty ──────────────────────────────────────────────────

  describe('getModelProperty', () => {
    it('reads a property value from the model', async () => {
      const mock = createMockPage({ __value: 'Widget A' });
      const result = await getModelProperty(asPage(mock), '/Products(1)/Name');

      expect(result).toBe('Widget A');
      expect(mock.evaluate).toHaveBeenCalledTimes(1);
    });

    it('returns undefined for a missing property', async () => {
      const mock = createMockPage({ __value: undefined });
      const result = await getModelProperty(asPage(mock), '/Products(1)/Missing');

      expect(result).toBeUndefined();
    });
  });

  // ── waitForODataLoad ──────────────────────────────────────────────────

  describe('waitForODataLoad', () => {
    it('resolves when data is loaded', async () => {
      const mock = createMockPage();

      await expect(waitForODataLoad(asPage(mock))).resolves.toBeUndefined();
      expect(mock.waitForFunction).toHaveBeenCalledTimes(1);
    });

    it('passes polling interval to waitForFunction', async () => {
      const mock = createMockPage();
      await waitForODataLoad(asPage(mock), { polling: 250 });

      const callArgs = mock.waitForFunction.mock.calls[0] as unknown[];
      const opts = callArgs[2] as { timeout: number; polling: number };
      expect(opts.polling).toBe(250);
    });

    it('throws TimeoutError when data does not load in time', async () => {
      const mock = createMockPage();
      mock.waitForFunction.mockRejectedValue(new Error('Timeout 5000ms exceeded'));

      await expect(waitForODataLoad(asPage(mock), { timeout: 5000 })).rejects.toThrow(TimeoutError);

      await expect(waitForODataLoad(asPage(mock), { timeout: 5000 })).rejects.toThrow(/timed out/);
    });

    it('uses custom timeout value', async () => {
      const mock = createMockPage();
      await waitForODataLoad(asPage(mock), { timeout: 20_000 });

      const callArgs = mock.waitForFunction.mock.calls[0] as unknown[];
      const opts = callArgs[2] as { timeout: number; polling: number };
      expect(opts.timeout).toBe(20_000);
    });

    it('includes bindingPath in the predicate script', async () => {
      const mock = createMockPage();
      await waitForODataLoad(asPage(mock), { bindingPath: '/Orders' });

      const script = mock.waitForFunction.mock.calls[0]?.[0] as string;
      expect(script).toContain('/Orders');
    });
  });

  // ── fetchCSRFToken ────────────────────────────────────────────────────

  describe('fetchCSRFToken', () => {
    it('returns token and serviceUrl on success', async () => {
      const mock = createMockCSRFPage({
        status: 200,
        headers: { 'x-csrf-token': 'my-csrf-token-123' },
      });

      const result = await fetchCSRFToken(asCSRFPage(mock), '/sap/opu/odata/sap/API_PRODUCT_SRV/');

      expect(result.token).toBe('my-csrf-token-123');
      expect(result.serviceUrl).toBe('/sap/opu/odata/sap/API_PRODUCT_SRV/');
      expect(mock.request.head).toHaveBeenCalledWith('/sap/opu/odata/sap/API_PRODUCT_SRV/', {
        headers: { 'X-CSRF-Token': 'Fetch' },
      });
    });

    it('throws ODataError on 403 Forbidden response', async () => {
      const mock = createMockCSRFPage({
        status: 403,
        headers: {},
      });

      await expect(fetchCSRFToken(asCSRFPage(mock), '/sap/opu/odata/sap/SVC/')).rejects.toThrow(
        ODataError,
      );

      try {
        await fetchCSRFToken(asCSRFPage(mock), '/sap/opu/odata/sap/SVC/');
      } catch (error: unknown) {
        const odataError = error as ODataError;
        expect(odataError.statusCode).toBe(403);
        expect(odataError.code).toBe('ERR_ODATA_CSRF');
      }
    });

    it('throws ODataError when token header is empty', async () => {
      const mock = createMockCSRFPage({
        status: 200,
        headers: {},
      });

      await expect(fetchCSRFToken(asCSRFPage(mock), '/sap/opu/odata/sap/SVC/')).rejects.toThrow(
        ODataError,
      );

      await expect(fetchCSRFToken(asCSRFPage(mock), '/sap/opu/odata/sap/SVC/')).rejects.toThrow(
        /not found in response headers/,
      );
    });

    it('includes serviceUrl in error details on failure', async () => {
      const mock = createMockCSRFPage({ headThrows: true });
      const serviceUrl = '/sap/opu/odata/sap/BROKEN_SVC/';

      try {
        await fetchCSRFToken(asCSRFPage(mock), serviceUrl);
      } catch (error: unknown) {
        const odataError = error as ODataError;
        expect(odataError.requestUrl).toBe(serviceUrl);
        expect(odataError.code).toBe('ERR_ODATA_CSRF');
      }
    });
  });

  // ── getEntityCount ────────────────────────────────────────────────────

  describe('getEntityCount', () => {
    it('returns the count of entities', async () => {
      const mock = createMockPage(5);
      const count = await getEntityCount(asPage(mock), '/Products');

      expect(count).toBe(5);
      expect(mock.evaluate).toHaveBeenCalledTimes(1);
    });

    it('returns 0 when no entities exist', async () => {
      const mock = createMockPage(0);
      const count = await getEntityCount(asPage(mock), '/EmptySet');

      expect(count).toBe(0);
    });

    it('uses named model when modelName is provided', async () => {
      const mock = createMockPage(3);
      await getEntityCount(asPage(mock), '/Items', { modelName: 'inventory' });

      const script = mock.evaluate.mock.calls[0]?.[0] as string;
      expect(script).toContain('"inventory"');
    });
  });

  // ── hasPendingChanges ─────────────────────────────────────────────────

  describe('hasPendingChanges', () => {
    it('returns true when model has unsaved changes', async () => {
      const mock = createMockPage(true);
      const dirty = await hasPendingChanges(asPage(mock));

      expect(dirty).toBe(true);
    });

    it('returns false when model is clean', async () => {
      const mock = createMockPage(false);
      const dirty = await hasPendingChanges(asPage(mock));

      expect(dirty).toBe(false);
    });
  });

  // ── Logging and telemetry (lightweight) ───────────────────────────────

  describe('function safety', () => {
    it('does not throw on valid getModelData input', async () => {
      const mock = createMockPage({ __data: [] });

      await expect(getModelData(asPage(mock), '/Valid')).resolves.toBeDefined();
    });

    it('does not throw on valid hasPendingChanges input', async () => {
      const mock = createMockPage(false);

      await expect(hasPendingChanges(asPage(mock))).resolves.toBe(false);
    });
  });
});
