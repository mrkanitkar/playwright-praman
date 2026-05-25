/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for the OData Trace Reporter.
 *
 * @module test-reporters
 */

import { Buffer } from 'node:buffer';
import { join } from 'node:path';

import type { Reporter, TestError, WorkerInfo } from '@playwright/test/reporter';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ODataTraceReport } from '../../../src/reporters/odata-trace-reporter.js';
import {
  extractEntitySet,
  ODataTraceReporter,
  parseODataQueryParams,
} from '../../../src/reporters/odata-trace-reporter.js';
import {
  createMockFullResult,
  createMockTestCase,
  createMockTestResult,
} from '../../helpers/mock-playwright-reporter.js';

// ── Mock node:fs/promises ────────────────────────────────────────────────────

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

/** Creates a Buffer from a JSON value, simulating an attachment body. */
function toAttachmentBody(data: unknown): Buffer {
  return Buffer.from(JSON.stringify(data), 'utf8');
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ODataTraceReporter', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('implements the Playwright Reporter interface', () => {
    const reporter = new ODataTraceReporter();
    // Verify structural conformance to the Reporter interface
    const asReporter: Reporter = reporter;
    expect(typeof asReporter.onTestEnd).toBe('function');
    expect(typeof asReporter.onEnd).toBe('function');
    expect(typeof asReporter.printsToStdio).toBe('function');
  });

  it('printsToStdio returns false', () => {
    const reporter = new ODataTraceReporter();
    expect(reporter.printsToStdio()).toBe(false);
  });

  it('handles test with no OData attachments (empty report)', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'no odata test' });
    const result = createMockTestResult();

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    expect(writeFile).toHaveBeenCalledOnce();
    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;

    expect(report.totalRequests).toBe(0);
    expect(report.traces).toEqual([]);
    expect(report.entityStats).toEqual([]);
  });

  it('extracts OData traces from buffer-based attachments', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'product list test' });
    const result = createMockTestResult();

    result.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: toAttachmentBody([
        {
          method: 'GET',
          url: '/sap/opu/odata/sap/API_PRODUCT/A_Product?$top=10&$filter=Price gt 100',
          statusCode: 200,
          duration: 150,
          responseSize: 4096,
          timestamp: '2026-01-15T10:30:00.000Z',
        },
      ]),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;

    expect(report.totalRequests).toBe(1);
    expect(report.traces).toHaveLength(1);

    const trace = report.traces[0];
    expect(trace?.testTitle).toBe('product list test');
    expect(trace?.method).toBe('GET');
    expect(trace?.entitySet).toBe('A_Product');
    expect(trace?.queryParams.top).toBe(10);
    expect(trace?.queryParams.filter).toBe('Price gt 100');
    expect(trace?.statusCode).toBe(200);
    expect(trace?.isBatch).toBe(false);
    expect(trace?.isMetadata).toBe(false);
  });

  it('ignores attachments that are not JSON or do not contain "odata" in name', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'unrelated test' });
    const result = createMockTestResult();

    // Non-JSON attachment
    result.attachments.push({
      name: 'odata-screenshot',
      contentType: 'image/png',
      body: Buffer.from('fake-image'),
    });

    // JSON but name does not contain "odata"
    result.attachments.push({
      name: 'api-trace',
      contentType: 'application/json',
      body: toAttachmentBody({ method: 'GET', url: '/api/test' }),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;
    expect(report.totalRequests).toBe(0);
  });

  it('handles batch requests ($batch URL)', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'batch test' });
    const result = createMockTestResult();

    result.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: toAttachmentBody({
        method: 'POST',
        url: '/sap/opu/odata/sap/API_BUSINESS_PARTNER/$batch',
        statusCode: 202,
        duration: 300,
        responseSize: 8192,
      }),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;

    expect(report.traces).toHaveLength(1);
    const trace = report.traces[0];
    expect(trace?.isBatch).toBe(true);
    expect(trace?.isMetadata).toBe(false);
    expect(trace?.entitySet).toBeNull();
  });

  it('handles metadata requests ($metadata URL)', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'metadata test' });
    const result = createMockTestResult();

    result.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: toAttachmentBody({
        method: 'GET',
        url: '/sap/opu/odata/sap/API_PRODUCT/$metadata',
        statusCode: 200,
        duration: 50,
        responseSize: 102_400,
      }),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;

    expect(report.traces).toHaveLength(1);
    const trace = report.traces[0];
    expect(trace?.isMetadata).toBe(true);
    expect(trace?.isBatch).toBe(false);
    expect(trace?.entitySet).toBeNull();
  });

  it('aggregates stats per entity set', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });

    // Two GET requests and one POST to A_Product
    const testCase1 = createMockTestCase({ title: 'test1' });
    const result1 = createMockTestResult();
    result1.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: toAttachmentBody([
        {
          method: 'GET',
          url: '/odata/v4/catalog/A_Product?$top=5',
          statusCode: 200,
          duration: 100,
          responseSize: 1024,
        },
        {
          method: 'GET',
          url: '/odata/v4/catalog/A_Product?$skip=5',
          statusCode: 200,
          duration: 200,
          responseSize: 2048,
        },
        {
          method: 'POST',
          url: '/odata/v4/catalog/A_Product',
          statusCode: 500,
          duration: 400,
          responseSize: 512,
        },
      ]),
    });
    reporter.onTestEnd(testCase1, result1);

    // One GET to Orders
    const testCase2 = createMockTestCase({ title: 'test2' });
    const result2 = createMockTestResult();
    result2.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: toAttachmentBody({
        method: 'GET',
        url: '/odata/v4/catalog/Orders',
        statusCode: 200,
        duration: 80,
        responseSize: 512,
      }),
    });
    reporter.onTestEnd(testCase2, result2);

    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;

    expect(report.totalRequests).toBe(4);
    expect(report.entityStats).toHaveLength(2);

    const productStats = report.entityStats.find((s) => s.entitySet === 'A_Product');
    expect(productStats).toBeDefined();
    expect(productStats?.totalCalls).toBe(3);
    expect(productStats?.avgDuration).toBe(233); // Math.round((100+200+400)/3)
    expect(productStats?.maxDuration).toBe(400);
    expect(productStats?.errorCount).toBe(1); // 500 status
    expect(productStats?.byMethod).toEqual({ GET: 2, POST: 1 });

    const orderStats = report.entityStats.find((s) => s.entitySet === 'Orders');
    expect(orderStats).toBeDefined();
    expect(orderStats?.totalCalls).toBe(1);
    expect(orderStats?.errorCount).toBe(0);
  });

  it('writes JSON output to the configured output directory on onEnd', async () => {
    const { mkdir, writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: '/custom/reports' });
    await reporter.onEnd(createMockFullResult());

    expect(mkdir).toHaveBeenCalledWith('/custom/reports', { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(
      join('/custom/reports', 'odata-trace.json'),
      expect.any(String),
      'utf8',
    );
  });

  it('defaults outputDir to test-results when no options provided', async () => {
    const { mkdir } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter();
    await reporter.onEnd(createMockFullResult());

    expect(mkdir).toHaveBeenCalledWith('test-results', { recursive: true });
  });

  it('silently skips malformed JSON in attachment body', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'bad json test' });
    const result = createMockTestResult();

    result.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: Buffer.from('not valid json{{{', 'utf8'),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;
    expect(report.totalRequests).toBe(0);
  });

  it('skips entries that lack required method and url fields', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'partial data test' });
    const result = createMockTestResult();

    result.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: toAttachmentBody([
        { statusCode: 200 }, // Missing method and url
        { method: 'GET' }, // Missing url
        { url: '/odata/v4/catalog/Products' }, // Missing method
        { method: 'GET', url: '/odata/v4/catalog/Products', statusCode: 200, duration: 100 }, // Valid
      ]),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;
    expect(report.totalRequests).toBe(1);
  });

  it('skips file-based attachments (body is undefined)', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'file attachment test' });
    const result = createMockTestResult();

    // File-based attachment: has path but no body
    result.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      path: './test-results/odata-trace.json',
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;
    expect(report.totalRequests).toBe(0);
  });

  it('defaults optional entry fields when only method and url are present', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'minimal entry test' });
    const result = createMockTestResult();

    result.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: toAttachmentBody({
        method: 'GET',
        url: '/odata/v4/catalog/Products',
        // No statusCode, duration, responseSize, or timestamp
      }),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;
    expect(report.totalRequests).toBe(1);

    const trace = report.traces[0];
    expect(trace?.statusCode).toBe(0);
    expect(trace?.duration).toBe(0);
    expect(trace?.responseSize).toBe(0);
    expect(trace?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('handles non-object entries in attachment array', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ODataTraceReporter({ outputDir: './reports/odata' });
    const testCase = createMockTestCase({ title: 'non-object entries test' });
    const result = createMockTestResult();

    result.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: toAttachmentBody([
        null,
        42,
        'a string',
        { method: 'GET', url: '/odata/v4/catalog/Products', statusCode: 200, duration: 50 },
      ]),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const writtenContent = (writeFile as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as string;
    const report = JSON.parse(writtenContent) as ODataTraceReport;
    expect(report.totalRequests).toBe(1);
  });
});

describe('extractEntitySet', () => {
  it('extracts entity set from SAP OData URL', () => {
    expect(extractEntitySet('/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner')).toBe(
      'A_BusinessPartner',
    );
  });

  it('extracts entity set from OData V4 URL', () => {
    expect(extractEntitySet('/odata/v4/catalog/Products')).toBe('Products');
  });

  it('removes key predicates from entity set', () => {
    expect(extractEntitySet("/odata/v4/catalog/Products('123')")).toBe('Products');
  });

  it('returns null for $metadata URL', () => {
    expect(extractEntitySet('/sap/opu/odata/sap/API_PRODUCT/$metadata')).toBeNull();
  });

  it('returns null for $batch URL', () => {
    expect(extractEntitySet('/sap/opu/odata/sap/API_PRODUCT/$batch')).toBeNull();
  });

  it('strips query parameters before extraction', () => {
    expect(extractEntitySet('/odata/v4/catalog/Products?$top=10&$filter=Price gt 100')).toBe(
      'Products',
    );
  });

  it('returns null for empty URL', () => {
    expect(extractEntitySet('')).toBeNull();
  });
});

describe('parseODataQueryParams', () => {
  it('parses $filter parameter', () => {
    const params = parseODataQueryParams('/Products?$filter=Price gt 100');
    expect(params.filter).toBe('Price gt 100');
  });

  it('parses $expand parameter', () => {
    const params = parseODataQueryParams('/Products?$expand=Supplier');
    expect(params.expand).toBe('Supplier');
  });

  it('parses $orderby parameter', () => {
    const params = parseODataQueryParams('/Products?$orderby=Name asc');
    expect(params.orderby).toBe('Name asc');
  });

  it('parses $top parameter as number', () => {
    const params = parseODataQueryParams('/Products?$top=10');
    expect(params.top).toBe(10);
  });

  it('parses $skip parameter as number', () => {
    const params = parseODataQueryParams('/Products?$skip=20');
    expect(params.skip).toBe(20);
  });

  it('parses $select parameter', () => {
    const params = parseODataQueryParams('/Products?$select=Name,Price');
    expect(params.select).toBe('Name,Price');
  });

  it('parses multiple OData query params from a single URL', () => {
    const params = parseODataQueryParams(
      '/Products?$filter=Price gt 10&$top=5&$expand=Category&$select=Name',
    );
    expect(params.filter).toBe('Price gt 10');
    expect(params.top).toBe(5);
    expect(params.expand).toBe('Category');
    expect(params.select).toBe('Name');
  });

  it('returns empty object for URL without OData query params', () => {
    const params = parseODataQueryParams('/Products');
    expect(params).toEqual({});
  });
});

describe('ODataTraceReporter.onError', () => {
  it('does not throw with workerInfo', () => {
    const reporter = new ODataTraceReporter();
    const error: TestError = { message: 'boom' };
    const workerInfo = { workerIndex: 2, parallelIndex: 1 } as unknown as WorkerInfo;
    expect(() => {
      reporter.onError(error, workerInfo);
    }).not.toThrow();
  });

  it('does not throw when workerInfo is undefined (pre-1.60)', () => {
    const reporter = new ODataTraceReporter();
    const error: TestError = { message: 'boom' };
    expect(() => {
      reporter.onError(error);
    }).not.toThrow();
  });
});
