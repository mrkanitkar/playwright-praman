/**
 * Tests for `src/core/errors/odata-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { ODataError } from '#core/errors/odata-error.js';

describe('ODataError', () => {
  runBaseErrorTests(
    ODataError,
    {
      message: 'OData request failed',
      attempted: 'Fetch purchase orders',
    },
    {
      expectedName: 'ODataError',
      expectedDefaultCode: ErrorCode.ERR_ODATA_REQUEST_FAILED,
      expectedDefaultRetryable: true,
    },
  );

  it('extends PramanError', () => {
    const error = new ODataError({
      message: 'OData failed',
      attempted: 'Fetch data',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new ODataError({
      code: ErrorCode.ERR_ODATA_CSRF,
      message: 'CSRF token expired',
      attempted: 'Submit POST request',
    });
    expect(error.code).toBe(ErrorCode.ERR_ODATA_CSRF);
  });

  it('stores statusCode from options', () => {
    const error = new ODataError({
      message: 'OData failed',
      attempted: 'Fetch data',
      statusCode: 403,
    });
    expect(error.statusCode).toBe(403);
  });

  it('stores requestUrl from options', () => {
    const error = new ODataError({
      message: 'OData failed',
      attempted: 'Fetch data',
      requestUrl: '/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/PurchaseOrder',
    });
    expect(error.requestUrl).toBe('/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/PurchaseOrder');
  });

  it('stores entitySet from options', () => {
    const error = new ODataError({
      message: 'OData failed',
      attempted: 'Fetch data',
      entitySet: 'PurchaseOrder',
    });
    expect(error.entitySet).toBe('PurchaseOrder');
  });

  it('includes subclass fields in toJSON()', () => {
    const error = new ODataError({
      message: 'OData failed',
      attempted: 'Fetch data',
      statusCode: 500,
      requestUrl: '/sap/opu/odata/sap/SRV/Entity',
      entitySet: 'Entity',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('statusCode', 500);
    expect(json).toHaveProperty('requestUrl');
    expect(json).toHaveProperty('entitySet', 'Entity');
  });
});
