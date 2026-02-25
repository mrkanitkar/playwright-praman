/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/modules/odata-http.ts` — HTTP-level OData CRUD operations.
 *
 * @remarks
 * Verifies entity creation, update, deletion, function imports, and entity
 * set querying via Playwright's `page.request` API.
 *
 * Mock strategy:
 * - Mock `ODataHttpPage` with `request.get()`, `.post()`, `.patch()`, `.delete()`
 * - No browser or bridge mocking needed — HTTP operations only
 *
 * @module modules
 */
import { describe, expect, it, vi } from 'vitest';

import type { ODataHttpPage } from '../../../src/modules/odata-http.js';

import { ODataError } from '#core/errors/odata-error.js';

const { createEntity, updateEntity, deleteEntity, callFunctionImport, queryEntities } =
  await import('../../../src/modules/odata-http.js');

/** Default service URL used across tests. */
const SERVICE_URL = '/sap/opu/odata/sap/API_PRODUCT_SRV';

/**
 * Creates a mock API response with configurable status, data, and etag.
 */
function createMockResponse(
  status: number,
  data: unknown,
  etag?: string,
): {
  status: () => number;
  json: () => Promise<unknown>;
  headers: () => Record<string, string>;
} {
  return {
    status: () => status,
    json: async () => await Promise.resolve(data),
    headers: () => (etag !== undefined ? { etag } : {}),
  };
}

/**
 * Creates a mock ODataHttpPage with all request methods stubbed.
 */
function createMockPage(): {
  evaluate: ReturnType<typeof vi.fn>;
  request: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    patch: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    head: ReturnType<typeof vi.fn>;
  };
} {
  return {
    evaluate: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined),
    request: {
      get: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
      post: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
      patch: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
      delete: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
      put: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
      head: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
    },
  };
}

/** Casts a mock to ODataHttpPage. */
function asPage(mock: ReturnType<typeof createMockPage>): ODataHttpPage {
  return mock as unknown as ODataHttpPage;
}

describe('OData HTTP module', () => {
  // ── createEntity ──────────────────────────────────────────────────────────

  describe('createEntity', () => {
    it('POSTs to the correct URL', async () => {
      const mock = createMockPage();
      const responseData = { Name: 'Widget A', ProductID: '001' };
      mock.request.post.mockResolvedValue(createMockResponse(201, responseData));

      await createEntity(
        asPage(mock),
        SERVICE_URL,
        'Products',
        { Name: 'Widget A' },
        {
          csrfToken: 'abc123',
        },
      );

      const callArgs = mock.request.post.mock.calls[0] as unknown[];
      expect(callArgs[0]).toBe(`${SERVICE_URL}/Products`);
    });

    it('includes CSRF token in request headers', async () => {
      const mock = createMockPage();
      mock.request.post.mockResolvedValue(createMockResponse(201, {}));

      await createEntity(
        asPage(mock),
        SERVICE_URL,
        'Products',
        { Name: 'A' },
        {
          csrfToken: 'abc123',
        },
      );

      const callArgs = mock.request.post.mock.calls[0] as unknown[];
      const opts = callArgs[1] as { headers: Record<string, string> };
      expect(opts.headers['X-CSRF-Token']).toBe('abc123');
    });

    it('returns created entity with status and data', async () => {
      const mock = createMockPage();
      const responseData = { Name: 'Widget A', ProductID: '001' };
      mock.request.post.mockResolvedValue(createMockResponse(201, responseData, 'W/"etag1"'));

      const result = await createEntity(
        asPage(mock),
        SERVICE_URL,
        'Products',
        { Name: 'Widget A' },
        {
          csrfToken: 'token',
        },
      );

      expect(result.status).toBe(201);
      expect(result.data).toEqual(responseData);
      expect(result.etag).toBe('W/"etag1"');
    });

    it('throws ERR_ODATA_REQUEST_FAILED on 400 response', async () => {
      const mock = createMockPage();
      mock.request.post.mockResolvedValue(createMockResponse(400, { error: 'Bad request' }));

      await expect(
        createEntity(asPage(mock), SERVICE_URL, 'Products', { Name: '' }, { csrfToken: 'token' }),
      ).rejects.toThrow(ODataError);

      try {
        await createEntity(
          asPage(mock),
          SERVICE_URL,
          'Products',
          { Name: '' },
          { csrfToken: 'token' },
        );
      } catch (error: unknown) {
        const odataError = error as ODataError;
        expect(odataError.code).toBe('ERR_ODATA_REQUEST_FAILED');
        expect(odataError.statusCode).toBe(400);
      }
    });

    it('throws ERR_ODATA_CSRF when CSRF token is missing', async () => {
      const mock = createMockPage();

      await expect(
        createEntity(asPage(mock), SERVICE_URL, 'Products', { Name: 'A' }),
      ).rejects.toThrow(ODataError);

      try {
        await createEntity(asPage(mock), SERVICE_URL, 'Products', { Name: 'A' });
      } catch (error: unknown) {
        const odataError = error as ODataError;
        expect(odataError.code).toBe('ERR_ODATA_CSRF');
      }
    });
  });

  // ── updateEntity ──────────────────────────────────────────────────────────

  describe('updateEntity', () => {
    it('PATCHes with the correct entity key URL', async () => {
      const mock = createMockPage();
      mock.request.patch.mockResolvedValue(createMockResponse(200, { Name: 'Updated' }));

      await updateEntity(
        asPage(mock),
        SERVICE_URL,
        'Products',
        "('123')",
        { Name: 'Updated' },
        {
          csrfToken: 'token',
        },
      );

      const callArgs = mock.request.patch.mock.calls[0] as unknown[];
      expect(callArgs[0]).toBe(`${SERVICE_URL}/Products('123')`);
    });

    it('returns updated entity data', async () => {
      const mock = createMockPage();
      const responseData = { Name: 'Updated', Price: 50 };
      mock.request.patch.mockResolvedValue(createMockResponse(200, responseData));

      const result = await updateEntity(
        asPage(mock),
        SERVICE_URL,
        'Products',
        "('123')",
        { Price: 50 },
        { csrfToken: 'token' },
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual(responseData);
    });

    it('throws ERR_ODATA_REQUEST_FAILED on 404 response', async () => {
      const mock = createMockPage();
      mock.request.patch.mockResolvedValue(createMockResponse(404, { error: 'Not found' }));

      await expect(
        updateEntity(
          asPage(mock),
          SERVICE_URL,
          'Products',
          "('999')",
          { Name: 'X' },
          { csrfToken: 'token' },
        ),
      ).rejects.toThrow(ODataError);

      try {
        await updateEntity(
          asPage(mock),
          SERVICE_URL,
          'Products',
          "('999')",
          { Name: 'X' },
          { csrfToken: 'token' },
        );
      } catch (error: unknown) {
        const odataError = error as ODataError;
        expect(odataError.code).toBe('ERR_ODATA_REQUEST_FAILED');
        expect(odataError.statusCode).toBe(404);
      }
    });
  });

  // ── deleteEntity ──────────────────────────────────────────────────────────

  describe('deleteEntity', () => {
    it('sends DELETE with the correct entity key URL', async () => {
      const mock = createMockPage();
      mock.request.delete.mockResolvedValue(createMockResponse(204, {}));

      await deleteEntity(asPage(mock), SERVICE_URL, 'Products', "('123')", { csrfToken: 'token' });

      const callArgs = mock.request.delete.mock.calls[0] as unknown[];
      expect(callArgs[0]).toBe(`${SERVICE_URL}/Products('123')`);
    });

    it('succeeds with 204 No Content', async () => {
      const mock = createMockPage();
      mock.request.delete.mockResolvedValue(createMockResponse(204, {}));

      await expect(
        deleteEntity(asPage(mock), SERVICE_URL, 'Products', "('123')", { csrfToken: 'token' }),
      ).resolves.toBeUndefined();
    });

    it('throws ERR_ODATA_REQUEST_FAILED on server error', async () => {
      const mock = createMockPage();
      mock.request.delete.mockResolvedValue(
        createMockResponse(500, { error: 'Internal server error' }),
      );

      await expect(
        deleteEntity(asPage(mock), SERVICE_URL, 'Products', "('123')", { csrfToken: 'token' }),
      ).rejects.toThrow(ODataError);

      try {
        await deleteEntity(asPage(mock), SERVICE_URL, 'Products', "('123')", {
          csrfToken: 'token',
        });
      } catch (error: unknown) {
        const odataError = error as ODataError;
        expect(odataError.code).toBe('ERR_ODATA_REQUEST_FAILED');
        expect(odataError.statusCode).toBe(500);
        expect(odataError.retryable).toBe(true);
      }
    });
  });

  // ── callFunctionImport ────────────────────────────────────────────────────

  describe('callFunctionImport', () => {
    it('POSTs by default', async () => {
      const mock = createMockPage();
      mock.request.post.mockResolvedValue(createMockResponse(200, { result: 42 }));

      await callFunctionImport(asPage(mock), SERVICE_URL, 'Calculate', undefined, 'POST', {
        csrfToken: 'token',
      });

      expect(mock.request.post).toHaveBeenCalledTimes(1);
      const callArgs = mock.request.post.mock.calls[0] as unknown[];
      expect(callArgs[0]).toBe(`${SERVICE_URL}/Calculate`);
    });

    it('sends GET when method is specified as GET', async () => {
      const mock = createMockPage();
      mock.request.get.mockResolvedValue(createMockResponse(200, { result: 42 }));

      await callFunctionImport(
        asPage(mock),
        SERVICE_URL,
        'GetPrice',
        { ProductID: "'123'" },
        'GET',
      );

      expect(mock.request.get).toHaveBeenCalledTimes(1);
      expect(mock.request.post).not.toHaveBeenCalled();
    });

    it('includes params in the URL query string', async () => {
      const mock = createMockPage();
      mock.request.get.mockResolvedValue(createMockResponse(200, { result: 42 }));

      await callFunctionImport(
        asPage(mock),
        SERVICE_URL,
        'GetPrice',
        { ProductID: "'123'", Quantity: 5 },
        'GET',
      );

      const callArgs = mock.request.get.mock.calls[0] as unknown[];
      const url = callArgs[0] as string;
      expect(url).toContain('ProductID=');
      expect(url).toContain('Quantity=5');
    });

    it('returns function import result', async () => {
      const mock = createMockPage();
      const responseData = { CalculatedPrice: 99.5 };
      mock.request.post.mockResolvedValue(createMockResponse(200, responseData));

      const result = await callFunctionImport(
        asPage(mock),
        SERVICE_URL,
        'Calculate',
        undefined,
        'POST',
        { csrfToken: 'token' },
      );

      expect(result.status).toBe(200);
      expect(result.data).toEqual(responseData);
    });
  });

  // ── queryEntities ─────────────────────────────────────────────────────────

  describe('queryEntities', () => {
    it('sends GET with $filter in the URL', async () => {
      const mock = createMockPage();
      mock.request.get.mockResolvedValue(createMockResponse(200, { value: [] }));

      await queryEntities(asPage(mock), SERVICE_URL, 'Products', {
        filter: 'Price gt 10',
      });

      const callArgs = mock.request.get.mock.calls[0] as unknown[];
      const url = callArgs[0] as string;
      expect(url).toContain('$filter=Price gt 10');
    });

    it('builds full query string with all OData params', async () => {
      const mock = createMockPage();
      mock.request.get.mockResolvedValue(createMockResponse(200, { value: [] }));

      await queryEntities(asPage(mock), SERVICE_URL, 'Products', {
        filter: 'Price gt 10',
        select: 'Name,Price',
        expand: 'Category',
        orderby: 'Price desc',
        top: 20,
        skip: 10,
      });

      const callArgs = mock.request.get.mock.calls[0] as unknown[];
      const url = callArgs[0] as string;
      expect(url).toContain('$filter=Price gt 10');
      expect(url).toContain('$select=Name,Price');
      expect(url).toContain('$expand=Category');
      expect(url).toContain('$orderby=Price desc');
      expect(url).toContain('$top=20');
      expect(url).toContain('$skip=10');
    });

    it('returns parsed entities from OData V4 response format', async () => {
      const mock = createMockPage();
      const entities = [
        { Name: 'Widget A', Price: 15 },
        { Name: 'Widget B', Price: 25 },
        { Name: 'Widget C', Price: 35 },
      ];
      mock.request.get.mockResolvedValue(createMockResponse(200, { value: entities }));

      const result = await queryEntities(asPage(mock), SERVICE_URL, 'Products');

      expect(result.status).toBe(200);
      expect(result.data).toHaveLength(3);
      expect(result.data).toEqual(entities);
    });

    it('handles empty result set', async () => {
      const mock = createMockPage();
      mock.request.get.mockResolvedValue(createMockResponse(200, { value: [] }));

      const result = await queryEntities(asPage(mock), SERVICE_URL, 'Products', {
        filter: 'Price gt 99999',
      });

      expect(result.data).toEqual([]);
      expect(result.data).toHaveLength(0);
    });

    it('sends $top only when skip is not provided', async () => {
      const mock = createMockPage();
      mock.request.get.mockResolvedValue(createMockResponse(200, { value: [] }));

      await queryEntities(asPage(mock), SERVICE_URL, 'Products', { top: 5 });

      const callArgs = mock.request.get.mock.calls[0] as unknown[];
      const url = callArgs[0] as string;
      expect(url).toContain('$top=5');
      expect(url).not.toContain('$skip');
    });

    it('sends $skip only when top is not provided', async () => {
      const mock = createMockPage();
      mock.request.get.mockResolvedValue(createMockResponse(200, { value: [] }));

      await queryEntities(asPage(mock), SERVICE_URL, 'Products', { skip: 20 });

      const callArgs = mock.request.get.mock.calls[0] as unknown[];
      const url = callArgs[0] as string;
      expect(url).toContain('$skip=20');
      expect(url).not.toContain('$top');
    });

    it('sends both $skip and $top for pagination', async () => {
      const mock = createMockPage();
      const entities = [{ Name: 'Widget B', Price: 25 }];
      mock.request.get.mockResolvedValue(createMockResponse(200, { value: entities }));

      const result = await queryEntities(asPage(mock), SERVICE_URL, 'Products', {
        skip: 10,
        top: 5,
      });

      const callArgs = mock.request.get.mock.calls[0] as unknown[];
      const url = callArgs[0] as string;
      expect(url).toContain('$skip=10');
      expect(url).toContain('$top=5');
      expect(result.data).toHaveLength(1);
    });

    it('parses OData V2 response format (d.results) with pagination options', async () => {
      const mock = createMockPage();
      const entities = [{ Name: 'V2 Entity', Price: 42 }];
      mock.request.get.mockResolvedValue(createMockResponse(200, { d: { results: entities } }));

      const result = await queryEntities(asPage(mock), SERVICE_URL, 'Products', {
        top: 10,
        skip: 0,
      });

      expect(result.status).toBe(200);
      expect(result.data).toEqual(entities);
    });

    it('generates no query string when no options are provided', async () => {
      const mock = createMockPage();
      mock.request.get.mockResolvedValue(createMockResponse(200, { value: [] }));

      await queryEntities(asPage(mock), SERVICE_URL, 'Products');

      const callArgs = mock.request.get.mock.calls[0] as unknown[];
      const url = callArgs[0] as string;
      expect(url).toBe(`${SERVICE_URL}/Products`);
      expect(url).not.toContain('?');
    });
  });

  // ── Cross-cutting: Headers ────────────────────────────────────────────────

  describe('header handling', () => {
    it('includes Content-Type and Accept headers in all operations', async () => {
      const mock = createMockPage();
      mock.request.post.mockResolvedValue(createMockResponse(201, {}));
      mock.request.get.mockResolvedValue(createMockResponse(200, { value: [] }));

      // POST (createEntity)
      await createEntity(
        asPage(mock),
        SERVICE_URL,
        'Products',
        { Name: 'A' },
        { csrfToken: 'token' },
      );
      const postArgs = mock.request.post.mock.calls[0] as unknown[];
      const postOpts = postArgs[1] as { headers: Record<string, string> };
      expect(postOpts.headers['Content-Type']).toBe('application/json');
      expect(postOpts.headers['Accept']).toBe('application/json');

      // GET (queryEntities)
      await queryEntities(asPage(mock), SERVICE_URL, 'Products');
      const getArgs = mock.request.get.mock.calls[0] as unknown[];
      const getOpts = getArgs[1] as { headers: Record<string, string> };
      expect(getOpts.headers['Content-Type']).toBe('application/json');
      expect(getOpts.headers['Accept']).toBe('application/json');
    });
  });
});
