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

/** Internal: Request options. */
interface RequestOptions {
  headers?: Record<string, string> | undefined;
  data?: unknown;
  timeout?: number | undefined;
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

/** Builds an OData query string from query options. */
function buildQueryString(options?: ODataQueryOptions): string {
  const params: string[] = [];

  if (options?.filter !== undefined) params.push(`$filter=${options.filter}`);
  if (options?.select !== undefined) params.push(`$select=${options.select}`);
  if (options?.expand !== undefined) params.push(`$expand=${options.expand}`);
  if (options?.orderby !== undefined) params.push(`$orderby=${options.orderby}`);
  if (options?.top !== undefined) params.push(`$top=${String(options.top)}`);
  if (options?.skip !== undefined) params.push(`$skip=${String(options.skip)}`);

  return params.length > 0 ? `?${params.join('&')}` : '';
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
    timeout: options?.timeout,
  });

  const status = response.status();
  assertSuccessStatus(status, url, operation);
  return parseResponse<TData>(response);
}

/**
 * Updates an existing entity via HTTP PATCH.
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
    timeout: options?.timeout,
  });

  const status = response.status();
  assertSuccessStatus(status, url, operation);
  return parseResponse<TData>(response);
}

/**
 * Deletes an entity via HTTP DELETE.
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
    timeout: options?.timeout,
  });

  const status = response.status();
  assertSuccessStatus(status, url, operation);
}

/**
 * Calls an OData function import via HTTP.
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

  const queryParts: string[] = [];
  if (params !== undefined) {
    for (const [key, value] of Object.entries(params)) {
      queryParts.push(`${key}=${String(value)}`);
    }
  }
  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
  const url = `${serviceUrl}/${functionName}${queryString}`;

  let response: APIResponse;

  if (method === 'GET') {
    const headers = buildHeaders(options);
    response = await page.request.get(url, {
      headers,
      timeout: options?.timeout,
    });
  } else {
    const token = requireCsrfToken(options, operation);
    const headers = buildHeaders({ ...options, csrfToken: token });
    response = await page.request.post(url, {
      headers,
      timeout: options?.timeout,
    });
  }

  const status = response.status();
  assertSuccessStatus(status, url, operation);
  return parseResponse<TData>(response);
}

/**
 * Queries an entity set via HTTP GET with OData system query options.
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
  const queryString = buildQueryString(options);
  const url = `${serviceUrl}/${entitySet}${queryString}`;
  const headers = buildHeaders(options);

  const response = await page.request.get(url, {
    headers,
    timeout: options?.timeout,
  });

  const status = response.status();
  assertSuccessStatus(status, url, operation);

  const raw = (await response.json()) as Record<string, unknown>;
  const headersMap = response.headers();
  const etag = headersMap['etag'];

  // Parse OData V2 (d.results) or V4 (value) response format
  let entities: readonly TData[];
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
