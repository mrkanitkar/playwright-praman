/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * OData module for model-level OData operations through UI5's model layer.
 *
 * @remarks
 * Pure-function module. All browser-context code uses string scripts via
 * `page.evaluate()`. Provides model data access, entity counts, CSRF token
 * fetching, and pending change detection.
 *
 * @example
 * ```typescript
 * import { getModelData, fetchCSRFToken } from '../modules/odata.js';
 *
 * const data = await getModelData(page, '/Products');
 * const csrf = await fetchCSRFToken(page, '/sap/opu/odata/sap/API_PRODUCT_SRV/');
 * ```
 *
 * @module modules
 */

import { ErrorCode } from '#core/errors/codes.js';
import { ODataError } from '#core/errors/odata-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import type { ODataEntityPath } from '#core/types/index.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

/**
 * Options for OData model operations.
 *
 * @example
 * ```typescript
 * const opts: ODataOptions = { timeout: 10_000, modelName: 'myModel' };
 * ```
 */
export interface ODataOptions {
  /** Timeout in ms for the operation. Defaults to `DEFAULT_TIMEOUTS.UI5_WAIT`. */
  readonly timeout?: number;
  /** Named OData model. Omit or pass `undefined` for the default (unnamed) model. */
  readonly modelName?: string;
}

/**
 * Options for waiting on OData data load completion.
 *
 * @example
 * ```typescript
 * const opts: WaitForODataLoadOptions = {
 *   timeout: 15_000,
 *   bindingPath: '/Products',
 *   polling: 200,
 * };
 * ```
 */
export interface WaitForODataLoadOptions extends ODataOptions {
  /** Binding path to check for loaded data (must start with `/`). */
  readonly bindingPath?: ODataEntityPath;
  /** Polling interval in ms. Defaults to `DEFAULT_TIMEOUTS.POLLING_INTERVAL`. */
  readonly polling?: number;
}

/**
 * Result of a CSRF token fetch operation.
 *
 * @example
 * ```typescript
 * const result: CSRFTokenResult = {
 *   token: 'abc123',
 *   serviceUrl: '/sap/opu/odata/sap/API_PRODUCT_SRV/',
 * };
 * ```
 */
export interface CSRFTokenResult {
  /** The fetched CSRF token value. */
  readonly token: string;
  /** The OData service URL from which the token was fetched. */
  readonly serviceUrl: string;
}

/**
 * Minimal page interface for OData operations requiring evaluate and waitForFunction.
 *
 * @example
 * ```typescript
 * const page: ODataPage = {
 *   evaluate: async (script) => ({}),
 *   waitForFunction: async (script) => ({}),
 * };
 * ```
 */
export interface ODataPage {
  /** Evaluates a string script in the browser context. */
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  /** Waits for a browser-side predicate to become truthy. */
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

/**
 * Extended page interface for CSRF token operations requiring HTTP request support.
 *
 * @example
 * ```typescript
 * const page: ODataCSRFPage = {
 *   evaluate: async (script) => ({}),
 *   waitForFunction: async (script) => ({}),
 *   request: {
 *     head: async (url) => ({ status: () => 200, headers: () => ({}) }),
 *   },
 * };
 * ```
 */
export interface ODataCSRFPage extends ODataPage {
  /** Playwright APIRequestContext for making HTTP requests. */
  request: {
    /** Sends a HEAD request to the given URL. */
    head(
      url: string,
      options?: { headers?: Record<string, string> },
    ): Promise<{
      status(): number;
      headers(): Record<string, string>;
    }>;
  };
}

/** Validates that a path string starts with '/'. */
function validatePath(path: string, operation: string): void {
  if (!path.startsWith('/')) {
    throw new ODataError({
      code: ErrorCode.ERR_ODATA_PARSE,
      message: `Invalid OData path: "${path}" — must start with '/'`,
      attempted: operation,
      retryable: false,
      suggestions: [
        'Ensure the path starts with "/" (e.g., "/Products")',
        'Check the OData model binding paths in the UI5 view',
      ],
    });
  }
}

/** Builds the model name argument for browser scripts. */
function modelArg(modelName: string | undefined): string {
  return modelName === undefined ? 'undefined' : JSON.stringify(modelName);
}

/**
 * Retrieves data from a UI5 OData model at the given path.
 *
 * @intent Read data from the UI5 OData model at a specific binding path.
 * @ai
 * @aiContext Accesses the component's OData model via getData() or getProperty().
 * Path must start with '/'. Use modelName option for named models.
 * @sapModule sap.ui.model.odata.v2.ODataModel, sap.ui.model.odata.v4.ODataModel
 * @businessContext Read OData entity data from the UI5 model layer for data-level assertions.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param path - OData model path (must start with '/').
 * @param options - OData options (timeout, modelName).
 * @returns The data at the given path (array, object, or primitive).
 * @throws ODataError if path is invalid or model/data not found.
 *
 * @example
 * ```typescript
 * const products = await getModelData(page, '/Products');
 * const single = await getModelData(page, '/Products(1)', { modelName: 'catalog' });
 * ```
 */
export async function getModelData(
  page: ODataPage,
  path: string,
  options?: ODataOptions,
): Promise<unknown> {
  validatePath(path, `getModelData('${path}')`);

  const script = `(function() {
    try {
      var core = sap.ui.getCore();
      var component = core.getComponent && core.getComponent(
        Object.keys(core.mObjects && core.mObjects.component || {})[0]
      );
      var model = component
        ? component.getModel(${modelArg(options?.modelName)})
        : core.getModel && core.getModel(${modelArg(options?.modelName)});
      if (!model) return { __error: 'Model not found' };
      var data = model.getData ? model.getData(${JSON.stringify(path)}) : model.getProperty(${JSON.stringify(path)});
      return { __data: data };
    } catch (e) {
      return { __error: e.message || String(e) };
    }
  })()`;

  const result = await page.evaluate<{ __data?: unknown; __error?: string }>(script);

  if (result.__error !== undefined) {
    throw new ODataError({
      code: ErrorCode.ERR_ODATA_REQUEST_FAILED,
      message: `Failed to get model data at path "${path}": ${result.__error}`,
      attempted: `getModelData('${path}')`,
      retryable: true,
      suggestions: [
        'Verify the OData model path exists',
        'Check if the model has loaded data (waitForODataLoad)',
        'Ensure the correct model name is specified',
      ],
    });
  }

  return result.__data;
}

/**
 * Reads a single property from a UI5 OData model.
 *
 * @intent Read a specific property value from the OData model.
 * @ai
 * @aiContext Uses model.getProperty() for single-value reads. More efficient than getModelData()
 * when only one property is needed.
 * @sapModule sap.ui.model.odata.v2.ODataModel, sap.ui.model.odata.v4.ODataModel
 * @businessContext Read individual entity properties for targeted assertions.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param path - OData model property path (must start with '/').
 * @param options - OData options (timeout, modelName).
 * @returns The property value, or `undefined` if not found.
 *
 * @example
 * ```typescript
 * const name = await getModelProperty(page, '/Products(1)/Name');
 * ```
 */
export async function getModelProperty(
  page: ODataPage,
  path: string,
  options?: ODataOptions,
): Promise<unknown> {
  validatePath(path, `getModelProperty('${path}')`);

  const script = `(function() {
    try {
      var core = sap.ui.getCore();
      var component = core.getComponent && core.getComponent(
        Object.keys(core.mObjects && core.mObjects.component || {})[0]
      );
      var model = component
        ? component.getModel(${modelArg(options?.modelName)})
        : core.getModel && core.getModel(${modelArg(options?.modelName)});
      if (!model) return { __error: 'Model not found' };
      var value = model.getProperty(${JSON.stringify(path)});
      return { __value: value };
    } catch (e) {
      return { __error: e.message || String(e) };
    }
  })()`;

  const result = await page.evaluate<{ __value?: unknown; __error?: string }>(script);

  if (result.__error !== undefined) {
    throw new ODataError({
      code: ErrorCode.ERR_ODATA_REQUEST_FAILED,
      message: `Failed to get model property at path "${path}": ${result.__error}`,
      attempted: `getModelProperty('${path}')`,
      retryable: true,
      suggestions: [
        'Verify the property path exists in the OData model',
        'Ensure the model has loaded data',
      ],
    });
  }

  return result.__value;
}

/**
 * Waits for OData data to load by polling a binding path.
 *
 * @intent Wait until OData data is loaded at a specific binding path.
 * @guarantee On success, the model has non-null data at the specified path.
 * @prerequisite An OData model must be configured on the component.
 * @ai
 * @aiContext Polls the model until getData() returns non-empty data or timeout.
 * Use after navigation or filter changes to wait for backend response.
 * @sapModule sap.ui.model.odata.v2.ODataModel, sap.ui.model.odata.v4.ODataModel
 * @businessContext Wait for SAP backend data to load before asserting on table or form content.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Wait options (timeout, polling, bindingPath, modelName).
 * @throws TimeoutError if data does not load within the timeout.
 *
 * @example
 * ```typescript
 * await waitForODataLoad(page, { bindingPath: '/Products', timeout: 10_000 });
 * ```
 */
export async function waitForODataLoad(
  page: ODataPage,
  options?: WaitForODataLoadOptions,
): Promise<void> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_WAIT;
  const polling = options?.polling ?? DEFAULT_TIMEOUTS.POLLING_INTERVAL;
  const bindingPath = options?.bindingPath ?? '/';
  const modelNameValue = modelArg(options?.modelName);

  const predicate = `(function() {
    try {
      var core = sap.ui.getCore();
      var component = core.getComponent && core.getComponent(
        Object.keys(core.mObjects && core.mObjects.component || {})[0]
      );
      var model = component
        ? component.getModel(${modelNameValue})
        : core.getModel && core.getModel(${modelNameValue});
      if (!model) return false;
      var data = model.getData ? model.getData(${JSON.stringify(bindingPath)}) : model.getProperty(${JSON.stringify(bindingPath)});
      if (Array.isArray(data)) return data.length > 0;
      return data !== undefined && data !== null;
    } catch (e) {
      return false;
    }
  })()`;

  try {
    await page.waitForFunction(predicate, undefined, { timeout, polling });
  } catch {
    throw new TimeoutError({
      code: ErrorCode.ERR_TIMEOUT_OPERATION,
      message: `OData load timed out after ${String(timeout)}ms`,
      attempted: `waitForODataLoad(bindingPath: '${bindingPath}')`,
      timeoutMs: timeout,
      suggestions: [
        'Increase the timeout value',
        'Verify the OData service is responding',
        'Check the binding path is correct',
      ],
    });
  }
}

/**
 * Fetches a CSRF token from an OData service using a HEAD request.
 *
 * @intent Fetch a CSRF token for subsequent write operations (POST/PATCH/DELETE).
 * @guarantee On success, returns a valid CSRF token string.
 * @prerequisite The user session must be authenticated against the OData service.
 * @ai
 * @aiContext Sends HEAD request with 'X-CSRF-Token: Fetch' header. Required before any
 * write operation in SAP OData services. Token is typically valid for the session duration.
 * @sapModule sap.ui.model.odata.v2.ODataModel — CSRF token handling
 * @businessContext Obtain CSRF token for secure write operations against SAP OData services.
 *
 * @param page - Playwright Page with request API (or compatible subset).
 * @param serviceUrl - The OData service root URL.
 * @returns The CSRF token and service URL.
 * @throws ODataError if the token cannot be fetched.
 *
 * @example
 * ```typescript
 * const { token } = await fetchCSRFToken(page, '/sap/opu/odata/sap/API_PRODUCT_SRV/');
 * ```
 */
export async function fetchCSRFToken(
  page: ODataCSRFPage,
  serviceUrl: string,
): Promise<CSRFTokenResult> {
  let response: { status(): number; headers(): Record<string, string> };

  try {
    response = await page.request.head(serviceUrl, {
      headers: { 'X-CSRF-Token': 'Fetch' },
    });
  } catch (error: unknown) {
    throw new ODataError({
      code: ErrorCode.ERR_ODATA_CSRF,
      message: `CSRF token fetch failed for "${serviceUrl}": ${error instanceof Error ? error.message : String(error)}`,
      attempted: `fetchCSRFToken('${serviceUrl}')`,
      retryable: true,
      requestUrl: serviceUrl,
      suggestions: [
        'Verify the OData service URL is correct',
        'Check if the user session is authenticated',
      ],
    });
  }

  const status = response.status();
  if (status === 403) {
    throw new ODataError({
      code: ErrorCode.ERR_ODATA_CSRF,
      message: `CSRF token fetch returned 403 Forbidden for "${serviceUrl}"`,
      attempted: `fetchCSRFToken('${serviceUrl}')`,
      retryable: false,
      statusCode: 403,
      requestUrl: serviceUrl,
      suggestions: [
        'Ensure the user session is authenticated',
        'Check if CSRF protection is enabled on the service',
      ],
    });
  }

  const headers = response.headers();
  const token = headers['x-csrf-token'] ?? '';

  if (token.length === 0) {
    throw new ODataError({
      code: ErrorCode.ERR_ODATA_CSRF,
      message: `CSRF token not found in response headers for "${serviceUrl}"`,
      attempted: `fetchCSRFToken('${serviceUrl}')`,
      retryable: true,
      requestUrl: serviceUrl,
      suggestions: [
        'Verify the service supports CSRF tokens',
        'Check that the X-CSRF-Token header is included in the response',
      ],
    });
  }

  return { token, serviceUrl };
}

/**
 * Reads the number of entities in a binding from the UI5 model.
 *
 * @intent Count the number of entities at a specific OData model path.
 * @ai
 * @aiContext Returns array length from getData() at the path. Returns 0 if not an array.
 * @sapModule sap.ui.model.odata.v2.ODataModel, sap.ui.model.odata.v4.ODataModel
 * @businessContext Verify expected entity counts in list bindings.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param path - OData model path (must start with '/').
 * @param options - OData options (timeout, modelName).
 * @returns The entity count (0 if no data or not an array).
 *
 * @example
 * ```typescript
 * const count = await getEntityCount(page, '/Products');
 * ```
 */
export async function getEntityCount(
  page: ODataPage,
  path: string,
  options?: ODataOptions,
): Promise<number> {
  validatePath(path, `getEntityCount('${path}')`);

  const script = `(function() {
    try {
      var core = sap.ui.getCore();
      var component = core.getComponent && core.getComponent(
        Object.keys(core.mObjects && core.mObjects.component || {})[0]
      );
      var model = component
        ? component.getModel(${modelArg(options?.modelName)})
        : core.getModel && core.getModel(${modelArg(options?.modelName)});
      if (!model) return 0;
      var data = model.getData ? model.getData(${JSON.stringify(path)}) : model.getProperty(${JSON.stringify(path)});
      return Array.isArray(data) ? data.length : 0;
    } catch (e) {
      return 0;
    }
  })()`;

  return page.evaluate<number>(script);
}

/**
 * Checks whether the UI5 OData model has unsaved (pending) changes.
 *
 * @intent Check if the OData model has unsaved changes (dirty state).
 * @ai
 * @aiContext Calls model.hasPendingChanges(). Useful to verify before navigating away or
 * to assert that edits have been properly saved.
 * @sapModule sap.ui.model.odata.v2.ODataModel, sap.ui.model.odata.v4.ODataModel
 * @businessContext Detect unsaved changes before navigation to prevent data loss warnings.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - OData options (modelName).
 * @returns `true` if the model has pending changes, `false` otherwise.
 *
 * @example
 * ```typescript
 * const dirty = await hasPendingChanges(page);
 * if (dirty) {
 *   logger.warn('Model has unsaved changes');
 * }
 * ```
 */
export async function hasPendingChanges(page: ODataPage, options?: ODataOptions): Promise<boolean> {
  const script = `(function() {
    try {
      var core = sap.ui.getCore();
      var component = core.getComponent && core.getComponent(
        Object.keys(core.mObjects && core.mObjects.component || {})[0]
      );
      var model = component
        ? component.getModel(${modelArg(options?.modelName)})
        : core.getModel && core.getModel(${modelArg(options?.modelName)});
      if (!model || !model.hasPendingChanges) return false;
      return model.hasPendingChanges();
    } catch (e) {
      return false;
    }
  })()`;

  return page.evaluate<boolean>(script);
}
