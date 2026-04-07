/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * HTTP-level OData CRUD operations using Playwright's `page.request` API.
 *
 * @remarks
 * Complements the model-level `odata.ts` for scenarios where direct HTTP
 * interaction is needed (entity creation, update, deletion, function imports,
 * and entity set querying). Write operations (POST/PATCH/DELETE) require a
 * CSRF token obtained via `fetchCSRFToken()` from `odata.ts`.
 *
 * @example
 * ```typescript
 * import { createEntity, queryEntities } from '../modules/odata-http.js';
 * import { fetchCSRFToken } from '../modules/odata.js';
 *
 * const { token } = await fetchCSRFToken(page, serviceUrl);
 * await createEntity(page, serviceUrl, 'Products', { Name: 'A' }, { csrfToken: token });
 * const result = await queryEntities(page, serviceUrl, 'Products', { filter: "Price gt 10" });
 * ```
 *
 * @module modules
 */

import { ErrorCode } from '#core/errors/codes.js';
import { ODataError } from '#core/errors/odata-error.js';

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Options for HTTP-level OData operations.
 *
 * @example
 * ```typescript
 * const opts: ODataHttpOptions = {
 *   timeout: 10_000,
 *   csrfToken: 'abc123',
 *   headers: { 'sap-client': '100' },
 * };
 * ```
 */
export interface ODataHttpOptions {
  /** Timeout in ms for the HTTP request. */
  readonly timeout?: number;
  /** CSRF token for write operations (POST/PATCH/DELETE). */
  readonly csrfToken?: string;
  /** Additional custom headers to include in the request. */
  readonly headers?: Readonly<Record<string, string>>;
}

/**
 * Query options for entity set retrieval.
 *
 * @example
 * ```typescript
 * const opts: ODataQueryOptions = {
 *   filter: "Price gt 10",
 *   select: "Name,Price",
 *   top: 20,
 *   skip: 0,
 * };
 * ```
 */
export interface ODataQueryOptions extends ODataHttpOptions {
  /** OData $filter expression. */
  readonly filter?: string;
  /** OData $select expression (comma-separated property names). */
  readonly select?: string;
  /** OData $expand expression (comma-separated navigation properties). */
  readonly expand?: string;
  /** OData $orderby expression. */
  readonly orderby?: string;
  /** OData $top value (maximum number of entities to return). */
  readonly top?: number;
  /** OData $skip value (number of entities to skip). */
  readonly skip?: number;
}

/**
 * Result of an OData HTTP operation.
 *
 * @example
 * ```typescript
 * const result: ODataHttpResult<Product> = {
 *   status: 200,
 *   data: { Name: 'Widget', Price: 42 },
 *   etag: 'W/"abc123"',
 * };
 * ```
 */
export interface ODataHttpResult<TData = unknown> {
  /** HTTP status code of the response. */
  readonly status: number;
  /** Parsed response data. */
  readonly data: TData;
  /** ETag header value, if present. */
  readonly etag?: string;
}

/** Internal: Playwright API response shape. */
interface APIResponse {
  status(): number;
  json(): Promise<unknown>;
  headers(): Record<string, string>;
}

/** Internal: Request options (mirrors Playwright's APIRequestContext options). */
interface RequestOptions {
  headers?: Record<string, string>;
  data?: unknown;
  timeout?: number;
  params?: Record<string, string | number | boolean>;
}

/**
 * Minimal page interface for HTTP OData operations (P20).
 *
 * @example
 * ```typescript
 * const page: ODataHttpPage = {
 *   evaluate: async (script) => ({}),
 *   request: {
 *     get: async (url, opts) => ({ status: () => 200, json: async () => ({}), headers: () => ({}) }),
 *     post: async (url, opts) => ({ status: () => 201, json: async () => ({}), headers: () => ({}) }),
 *     patch: async (url, opts) => ({ status: () => 200, json: async () => ({}), headers: () => ({}) }),
 *     delete: async (url, opts) => ({ status: () => 204, json: async () => ({}), headers: () => ({}) }),
 *     put: async (url, opts) => ({ status: () => 200, json: async () => ({}), headers: () => ({}) }),
 *     head: async (url, opts) => ({ status: () => 200, json: async () => ({}), headers: () => ({}) }),
 *   },
 * };
 * ```
 */
export interface ODataHttpPage {
  /** Evaluates a script in the browser context. */
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  /** Playwright APIRequestContext for making HTTP requests. */
  request: {
    /** Sends a GET request. */
    get(url: string, options?: RequestOptions): Promise<APIResponse>;
    /** Sends a POST request. */
    post(url: string, options?: RequestOptions): Promise<APIResponse>;
    /** Sends a PATCH request. */
    patch(url: string, options?: RequestOptions): Promise<APIResponse>;
    /** Sends a DELETE request. */
    delete(url: string, options?: RequestOptions): Promise<APIResponse>;
    /** Sends a PUT request. */
    put(url: string, options?: RequestOptions): Promise<APIResponse>;
    /** Sends a HEAD request. */
    head(url: string, options?: RequestOptions): Promise<APIResponse>;
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Throws ERR_ODATA_CSRF if CSRF token is missing for a write operation. */
function requireCsrfToken(options: ODataHttpOptions | undefined, operation: string): string {
  const token = options?.csrfToken;
  if (token === undefined || token.length === 0) {
    throw new ODataError({
      code: ErrorCode.ERR_ODATA_CSRF,
      message: `CSRF token is required for ${operation}`,
      attempted: operation,
      retryable: false,
      suggestions: [
        'Fetch a CSRF token using fetchCSRFToken() before calling this operation',
        'Pass the token via options.csrfToken',
      ],
    });
  }
  return token;
}

/** Builds standard OData JSON headers, merging CSRF token and custom headers. */
function buildHeaders(options?: ODataHttpOptions): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (options?.csrfToken !== undefined && options.csrfToken.length > 0) {
    headers['X-CSRF-Token'] = options.csrfToken;
  }

  if (options?.headers !== undefined) {
    Object.assign(headers, options.headers);
  }

  return headers;
}

/** Builds an OData query params object for Playwright's `params` option. */
function buildQueryParams(
  options?: ODataQueryOptions,
): Record<string, string | number> | undefined {
  const params: Record<string, string | number> = {};

  if (options?.filter !== undefined) params['$filter'] = options.filter;
  if (options?.select !== undefined) params['$select'] = options.select;
  if (options?.expand !== undefined) params['$expand'] = options.expand;
  if (options?.orderby !== undefined) params['$orderby'] = options.orderby;
  if (options?.top !== undefined) params['$top'] = options.top;
  if (options?.skip !== undefined) params['$skip'] = options.skip;

  return Object.keys(params).length > 0 ? params : undefined;
}

/** Extracts status, data, and etag from an APIResponse. */
async function parseResponse<TData>(response: APIResponse): Promise<ODataHttpResult<TData>> {
  const status = response.status();
  const data = (await response.json()) as TData;
  const headers = response.headers();
  const etag = headers['etag'];

  return etag !== undefined ? { status, data, etag } : { status, data };
}

/** Throws ERR_ODATA_REQUEST_FAILED for non-success HTTP status codes. */
function assertSuccessStatus(status: number, url: string, operation: string): void {
  if (status >= 400) {
    throw new ODataError({
      code: ErrorCode.ERR_ODATA_REQUEST_FAILED,
      message: `OData HTTP request failed with status ${String(status)}: ${operation}`,
      attempted: operation,
      retryable: status >= 500,
      statusCode: status,
      requestUrl: url,
      suggestions: [
        'Verify the OData service URL is correct',
        'Check if the entity set name is valid',
        'Ensure the user has sufficient authorization',
      ],
    });
  }
}

// ── Public functions ──────────────────────────────────────────────────────────

/**
 * Creates a new entity via HTTP POST.
 *
 * @capability ui5.odata.createEntity
 * @intent Create a new OData entity by sending a POST request to the service.
 * @guarantee On success, the entity is created and the response contains the created entity data with HTTP 201 status.
 * @ai
 * @aiContext Uses Playwright's request API to POST directly to the OData service.
 * Requires a CSRF token obtained via fetchCSRFToken(). Supports both OData V2 and V4 response formats.
 * @sapModule sap.ui.model.odata.v2.ODataModel — HTTP-level entity creation
 * @businessContext Create new business entities (e.g., purchase orders, products) via direct HTTP POST.
 *
 * @param page - Playwright Page with request API.
 * @param serviceUrl - OData service root URL.
 * @param entitySet - Name of the entity set.
 * @param data - Entity data to create.
 * @param options - HTTP options including required CSRF token.
 * @returns The created entity with HTTP status and optional ETag.
 * @throws ODataError with `ERR_ODATA_CSRF` if CSRF token is missing.
 * @throws ODataError with `ERR_ODATA_REQUEST_FAILED` on HTTP error.
 *
 * @example
 * ```typescript
 * const result = await createEntity(page, '/sap/opu/odata/sap/SVC/', 'Products', {
 *   Name: 'Widget',
 *   Price: 42,
 * }, { csrfToken: token });
 * ```
 */
export async function createEntity<TData = unknown>(
  page: ODataHttpPage,
  serviceUrl: string,
  entitySet: string,
  data: unknown,
  options?: ODataHttpOptions,
): Promise<ODataHttpResult<TData>> {
  const operation = `createEntity('${entitySet}')`;
  const token = requireCsrfToken(options, operation);
  const url = `${serviceUrl}/${entitySet}`;
  const headers = buildHeaders({ ...options, csrfToken: token });

  const response = await page.request.post(url, {
    headers,
    data,
    ...(options?.timeout !== undefined && { timeout: options.timeout }),
  });

  const status = response.status();
  assertSuccessStatus(status, url, operation);
  return parseResponse<TData>(response);
}

/**
 * Updates an existing entity via HTTP PATCH.
 *
 * @capability ui5.odata.updateEntity
 * @intent Update an existing OData entity by sending a PATCH request with partial data.
 * @guarantee On success, the entity is updated and the response contains the updated entity data.
 * @ai
 * @aiContext Uses Playwright's request API to PATCH the entity. Only changed fields need to be provided.
 * Requires a CSRF token. ETag is returned for optimistic concurrency control.
 * @sapModule sap.ui.model.odata.v2.ODataModel — HTTP-level entity update
 * @businessContext Update existing business entities (e.g., change PO quantity, update product price).
 *
 * @param page - Playwright Page with request API.
 * @param serviceUrl - OData service root URL.
 * @param entitySet - Name of the entity set.
 * @param key - Entity key including parentheses, e.g. `"('123')"`.
 * @param data - Partial entity data to update.
 * @param options - HTTP options including required CSRF token.
 * @returns The updated entity with HTTP status and optional ETag.
 * @throws ODataError with `ERR_ODATA_CSRF` if CSRF token is missing.
 * @throws ODataError with `ERR_ODATA_REQUEST_FAILED` on HTTP error.
 *
 * @example
 * ```typescript
 * const result = await updateEntity(page, '/sap/opu/odata/sap/SVC/', 'Products', "('123')", {
 *   Price: 50,
 * }, { csrfToken: token });
 * ```
 */
export async function updateEntity<TData = unknown>(
  page: ODataHttpPage,
  serviceUrl: string,
  entitySet: string,
  key: string,
  data: unknown,
  options?: ODataHttpOptions,
): Promise<ODataHttpResult<TData>> {
  const operation = `updateEntity('${entitySet}${key}')`;
  const token = requireCsrfToken(options, operation);
  const url = `${serviceUrl}/${entitySet}${key}`;
  const headers = buildHeaders({ ...options, csrfToken: token });

  const response = await page.request.patch(url, {
    headers,
    data,
    ...(options?.timeout !== undefined && { timeout: options.timeout }),
  });

  const status = response.status();
  assertSuccessStatus(status, url, operation);
  return parseResponse<TData>(response);
}

/**
 * Deletes an entity via HTTP DELETE.
 *
 * @capability ui5.odata.deleteEntity
 * @intent Remove an OData entity by sending a DELETE request to the service.
 * @guarantee On success, the entity is deleted and the HTTP response status is 2xx.
 * @ai
 * @aiContext Uses Playwright's request API to DELETE the entity. Requires a CSRF token.
 * No response body is returned on successful deletion.
 * @sapModule sap.ui.model.odata.v2.ODataModel — HTTP-level entity deletion
 * @businessContext Delete business entities (e.g., cancel draft documents, remove test data).
 *
 * @param page - Playwright Page with request API.
 * @param serviceUrl - OData service root URL.
 * @param entitySet - Name of the entity set.
 * @param key - Entity key including parentheses, e.g. `"('123')"`.
 * @param options - HTTP options including required CSRF token.
 * @throws ODataError with `ERR_ODATA_CSRF` if CSRF token is missing.
 * @throws ODataError with `ERR_ODATA_REQUEST_FAILED` on HTTP error.
 *
 * @example
 * ```typescript
 * await deleteEntity(page, '/sap/opu/odata/sap/SVC/', 'Products', "('123')", {
 *   csrfToken: token,
 * });
 * ```
 */
export async function deleteEntity(
  page: ODataHttpPage,
  serviceUrl: string,
  entitySet: string,
  key: string,
  options?: ODataHttpOptions,
): Promise<void> {
  const operation = `deleteEntity('${entitySet}${key}')`;
  const token = requireCsrfToken(options, operation);
  const url = `${serviceUrl}/${entitySet}${key}`;
  const headers = buildHeaders({ ...options, csrfToken: token });

  const response = await page.request.delete(url, {
    headers,
    ...(options?.timeout !== undefined && { timeout: options.timeout }),
  });

  const status = response.status();
  assertSuccessStatus(status, url, operation);
}

/**
 * Calls an OData function import via HTTP.
 *
 * @capability ui5.odata.callFunctionImport
 * @intent Invoke an OData function import with parameters via HTTP GET or POST.
 * @guarantee On success, the function import is executed and the response contains the result data.
 * @ai
 * @aiContext Sends GET or POST to the function import URL. GET does not require a CSRF token;
 * POST requires one. Parameters are passed as URL query parameters.
 * @sapModule sap.ui.model.odata.v2.ODataModel — HTTP-level function import invocation
 * @businessContext Execute server-side business logic (e.g., CalculatePrice, ReleaseOrder, CheckAvailability).
 *
 * @param page - Playwright Page with request API.
 * @param serviceUrl - OData service root URL.
 * @param functionName - Name of the function import.
 * @param params - Parameters for the function import.
 * @param method - HTTP method ('GET' or 'POST'). Defaults to 'POST'.
 * @param options - HTTP options (CSRF token required for POST).
 * @returns The function import result with HTTP status.
 * @throws ODataError with `ERR_ODATA_CSRF` if POST and CSRF token missing.
 * @throws ODataError with `ERR_ODATA_REQUEST_FAILED` on HTTP error.
 *
 * @example
 * ```typescript
 * const result = await callFunctionImport(page, '/sap/opu/odata/sap/SVC/', 'CalculatePrice', {
 *   ProductID: "'123'",
 *   Quantity: 5,
 * }, 'GET');
 * ```
 */
export async function callFunctionImport<TData = unknown>(
  page: ODataHttpPage,
  serviceUrl: string,
  functionName: string,
  params?: Readonly<Record<string, unknown>>,
  method: 'GET' | 'POST' = 'POST',
  options?: ODataHttpOptions,
): Promise<ODataHttpResult<TData>> {
  const operation = `callFunctionImport('${functionName}')`;
  const url = `${serviceUrl}/${functionName}`;

  // Convert params to Playwright's native params format
  let requestParams: Record<string, string | number | boolean> | undefined;
  if (params !== undefined) {
    requestParams = {};
    for (const [key, value] of Object.entries(params)) {
      // eslint-disable-next-line security/detect-object-injection -- key is from OData function import params, not user input
      requestParams[key] =
        typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
          ? value
          : String(value);
    }
  }

  let response: APIResponse;

  if (method === 'GET') {
    const headers = buildHeaders(options);
    response = await page.request.get(url, {
      headers,
      ...(requestParams !== undefined && { params: requestParams }),
      ...(options?.timeout !== undefined && { timeout: options.timeout }),
    });
  } else {
    const token = requireCsrfToken(options, operation);
    const headers = buildHeaders({ ...options, csrfToken: token });
    response = await page.request.post(url, {
      headers,
      ...(requestParams !== undefined && { params: requestParams }),
      ...(options?.timeout !== undefined && { timeout: options.timeout }),
    });
  }

  const status = response.status();
  assertSuccessStatus(status, url, operation);
  return parseResponse<TData>(response);
}

/**
 * Queries an entity set via HTTP GET with OData system query options.
 *
 * @capability ui5.odata.queryEntities
 * @intent Read a collection of OData entities with optional filtering, sorting, and paging.
 * @guarantee On success, returns an array of entities matching the query with HTTP status.
 * @ai
 * @aiContext Uses Playwright's request API to GET the entity set with OData query parameters.
 * Supports $filter, $select, $expand, $orderby, $top, $skip. Parses both V2 (d.results) and V4 (value) formats.
 * @sapModule sap.ui.model.odata.v2.ODataModel, sap.ui.model.odata.v4.ODataModel
 * @businessContext Query business entities for test data verification or setup (e.g., find products by price, list open POs).
 *
 * @param page - Playwright Page with request API.
 * @param serviceUrl - OData service root URL.
 * @param entitySet - Name of the entity set to query.
 * @param options - Query options including $filter, $select, $expand, $orderby, $top, $skip.
 * @returns Array of entities with HTTP status.
 *
 * @example
 * ```typescript
 * const result = await queryEntities(page, '/sap/opu/odata/sap/SVC/', 'Products', {
 *   filter: "Price gt 10",
 *   select: "Name,Price",
 *   top: 20,
 * });
 * ```
 */
export async function queryEntities<TData = unknown>(
  page: ODataHttpPage,
  serviceUrl: string,
  entitySet: string,
  options?: ODataQueryOptions,
): Promise<ODataHttpResult<readonly TData[]>> {
  const operation = `queryEntities('${entitySet}')`;
  const url = `${serviceUrl}/${entitySet}`;
  const headers = buildHeaders(options);
  const params = buildQueryParams(options);

  const response = await page.request.get(url, {
    headers,
    ...(params !== undefined && { params }),
    ...(options?.timeout !== undefined && { timeout: options.timeout }),
  });

  const status = response.status();
  assertSuccessStatus(status, url, operation);

  // Type assertion: response.json() returns unknown; OData responses are always JSON objects
  const raw = (await response.json()) as Record<string, unknown>;
  const headersMap = response.headers();
  const etag = headersMap['etag'];

  // Parse OData V2 (d.results) or V4 (value) response format
  let entities: readonly TData[];
  // Type assertions: OData V2 wraps in d.results, V4 uses value — both are arrays of entity records
  const dProperty = raw['d'] as Record<string, unknown> | undefined;
  if (dProperty !== undefined && Array.isArray(dProperty['results'])) {
    entities = dProperty['results'] as readonly TData[];
  } else if (Array.isArray(raw['value'])) {
    entities = raw['value'] as readonly TData[];
  } else {
    entities = [];
  }

  return etag !== undefined ? { status, data: entities, etag } : { status, data: entities };
}
