/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/odata-trace-fixtures.ts` — OData trace auto-fixture.
 *
 * @remarks
 * Validates that the odataTraceInterceptor fixture correctly registers
 * request/response listeners, captures OData traffic, and attaches
 * trace data to testInfo on teardown.
 *
 * @module fixtures
 */

import type { Buffer } from 'node:buffer';

import { describe, expect, it, vi } from 'vitest';

import { createMockTestExtend } from '../../helpers/mock-playwright-test.js';

// ── Mock Playwright ─────────────────────────────────────────────────

const mockTestExtend = createMockTestExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
  },
}));

// ── Import after mocks ─────────────────────────────────────────────

const { isODataUrl, odataTraceTest } = await import('#fixtures/odata-trace-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

const fixtures = (odataTraceTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

function extractFixtureFn(definition: unknown): (...args: unknown[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: unknown[]) => Promise<void>;
  }
  return definition as (...args: unknown[]) => Promise<void>;
}

function extractFixtureOptions(definition: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(definition) && definition.length > 1) {
    return definition[1] as Record<string, unknown>;
  }
  return undefined;
}

/** Creates a mock page with on/off spies and listener simulation. */
function createMockPage(): {
  page: Record<string, unknown>;
  listeners: Map<string, ((...args: unknown[]) => void)[]>;
  emit: (event: string, ...args: unknown[]) => void;
} {
  const listeners = new Map<string, ((...args: unknown[]) => void)[]>();

  const page = {
    on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      const existing = listeners.get(event) ?? [];
      existing.push(listener);
      listeners.set(event, existing);
    }),
    off: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
      const existing = listeners.get(event) ?? [];
      const filtered = existing.filter((l) => l !== listener);
      listeners.set(event, filtered);
    }),
  };

  const emit = (event: string, ...args: unknown[]): void => {
    const handlers = listeners.get(event) ?? [];
    for (const handler of handlers) {
      handler(...args);
    }
  };

  return { page, listeners, emit };
}

/** Creates a mock Playwright Request object. */
function createMockRequest(method: string, url: string): Record<string, unknown> {
  return {
    method: vi.fn().mockReturnValue(method),
    url: vi.fn().mockReturnValue(url),
  };
}

/** Creates a mock Playwright Response object. */
function createMockResponse(
  request: Record<string, unknown>,
  status: number,
  contentLength?: string,
): Record<string, unknown> {
  const headers: Record<string, string> = {};
  if (contentLength !== undefined) {
    headers['content-length'] = contentLength;
  }
  return {
    request: vi.fn().mockReturnValue(request),
    status: vi.fn().mockReturnValue(status),
    headers: vi.fn().mockReturnValue(headers),
  };
}

function createMockTestInfo(): { attach: ReturnType<typeof vi.fn> } {
  return {
    attach: vi.fn().mockResolvedValue(undefined),
  };
}

/** Config with OData tracing enabled. */
function createEnabledConfig(urlPatterns: string[] = []): Record<string, unknown> {
  return {
    odataTracing: { enabled: true, urlPatterns },
  };
}

/** Config with OData tracing disabled. */
function createDisabledConfig(): Record<string, unknown> {
  return {
    odataTracing: { enabled: false, urlPatterns: [] },
  };
}

// ── Tests ───────────────────────────────────────────────────────────

describe('odata-trace-fixtures declarations', () => {
  it('exports odataTraceTest with odataTraceInterceptor fixture', () => {
    expect(fixtures).toHaveProperty('odataTraceInterceptor');
  });

  it('fixture is declared with auto: true', () => {
    const opts = extractFixtureOptions(fixtures['odataTraceInterceptor']);
    expect(opts).toBeDefined();
    expect(opts?.['auto']).toBe(true);
  });

  it('declares pramanConfig as worker-scoped option placeholder', () => {
    expect(fixtures).toHaveProperty('pramanConfig');
    const definition = fixtures['pramanConfig'];
    expect(Array.isArray(definition)).toBe(true);
    const opts = (definition as unknown[])[1] as Record<string, unknown>;
    expect(opts['option']).toBe(true);
    expect(opts['scope']).toBe('worker');
  });
});

describe('odataTraceInterceptor — disabled', () => {
  it('does nothing when odataTracing config is undefined', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page } = createMockPage();
    const testInfo = createMockTestInfo();

    let useCalled = false;
    const useFn = async (): Promise<void> => {
      useCalled = true;
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: {} }, useFn, testInfo);

    expect(useCalled).toBe(true);
    expect(page['on']).not.toHaveBeenCalled();
    expect(testInfo.attach).not.toHaveBeenCalled();
  });

  it('does nothing when odataTracing.enabled is false', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: createDisabledConfig() }, useFn, testInfo);

    expect(page['on']).not.toHaveBeenCalled();
    expect(testInfo.attach).not.toHaveBeenCalled();
  });
});

describe('odataTraceInterceptor — enabled', () => {
  it('registers request and response listeners on page', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: createEnabledConfig() }, useFn, testInfo);

    expect(page['on']).toHaveBeenCalledWith('request', expect.any(Function));
    expect(page['on']).toHaveBeenCalledWith('response', expect.any(Function));
  });

  it('removes listeners on teardown via page.off()', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: createEnabledConfig() }, useFn, testInfo);

    expect(page['off']).toHaveBeenCalledWith('request', expect.any(Function));
    expect(page['off']).toHaveBeenCalledWith('response', expect.any(Function));
  });

  it('captures OData request with method, url, statusCode, duration, and timestamp', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page, emit } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      // Simulate an OData request/response during test
      const req = createMockRequest('GET', 'https://host/sap/opu/odata/sap/API_PRODUCT/Products');
      emit('request', req);
      const resp = createMockResponse(req, 200, '4096');
      emit('response', resp);
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: createEnabledConfig() }, useFn, testInfo);

    expect(testInfo.attach).toHaveBeenCalledOnce();
    const callArgs = testInfo.attach.mock.calls[0] as unknown[];
    expect(callArgs[0]).toBe('odata-trace');

    const attachOpts = callArgs[1] as { contentType: string; body: Buffer };
    expect(attachOpts.contentType).toBe('application/json');

    const traces = JSON.parse(attachOpts.body.toString('utf8')) as unknown[];
    expect(traces).toHaveLength(1);

    const trace = traces[0] as Record<string, unknown>;
    expect(trace['method']).toBe('GET');
    expect(trace['url']).toBe('https://host/sap/opu/odata/sap/API_PRODUCT/Products');
    expect(trace['statusCode']).toBe(200);
    expect(trace['responseSize']).toBe(4096);
    expect(typeof trace['duration']).toBe('number');
    expect(typeof trace['timestamp']).toBe('string');
  });

  it('ignores non-OData URLs', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page, emit } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      const req = createMockRequest('GET', 'https://host/sap/bc/ui5_ui5/app/index.html');
      emit('request', req);
      const resp = createMockResponse(req, 200, '1024');
      emit('response', resp);
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: createEnabledConfig() }, useFn, testInfo);

    expect(testInfo.attach).not.toHaveBeenCalled();
  });

  it('matches custom URL patterns from config', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page, emit } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      const req = createMockRequest('GET', 'https://host/custom/api/v1/products');
      emit('request', req);
      const resp = createMockResponse(req, 200, '512');
      emit('response', resp);
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: createEnabledConfig(['/custom/api/v1/']) }, useFn, testInfo);

    expect(testInfo.attach).toHaveBeenCalledOnce();
  });

  it('attaches traces even when use() throws (test failure)', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page, emit } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      const req = createMockRequest('POST', 'https://host/sap/opu/odata/sap/SVC/Products');
      emit('request', req);
      const resp = createMockResponse(req, 201, '256');
      emit('response', resp);
      await Promise.resolve();
      throw new Error('Test failure simulation');
    };

    await expect(
      (
        fn as (
          deps: Record<string, unknown>,
          use: () => Promise<void>,
          info: unknown,
        ) => Promise<void>
      )({ page, pramanConfig: createEnabledConfig() }, useFn, testInfo),
    ).rejects.toThrow('Test failure simulation');

    // Traces should still be attached despite the error
    expect(testInfo.attach).toHaveBeenCalledOnce();
  });

  it('does not call testInfo.attach when no OData requests were captured', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: createEnabledConfig() }, useFn, testInfo);

    expect(testInfo.attach).not.toHaveBeenCalled();
  });

  it('handles response without content-length header (defaults to 0)', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page, emit } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      const req = createMockRequest('GET', 'https://host/odata/v4/CatalogService/Products');
      emit('request', req);
      // No content-length header
      const resp = createMockResponse(req, 200);
      emit('response', resp);
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: createEnabledConfig() }, useFn, testInfo);

    expect(testInfo.attach).toHaveBeenCalledOnce();
    const callArgs = testInfo.attach.mock.calls[0] as unknown[];
    const attachOpts = callArgs[1] as { body: Buffer };
    const traces = JSON.parse(attachOpts.body.toString('utf8')) as unknown[];
    const trace = traces[0] as Record<string, unknown>;
    expect(trace['responseSize']).toBe(0);
  });

  it('captures multiple OData requests across different patterns', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page, emit } = createMockPage();
    const testInfo = createMockTestInfo();

    const useFn = async (): Promise<void> => {
      const req1 = createMockRequest('GET', 'https://host/sap/opu/odata/sap/SVC/Products');
      emit('request', req1);
      emit('response', createMockResponse(req1, 200, '100'));

      const req2 = createMockRequest('POST', 'https://host/odata/v4/CatalogService/Orders');
      emit('request', req2);
      emit('response', createMockResponse(req2, 201, '50'));

      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: () => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({ page, pramanConfig: createEnabledConfig() }, useFn, testInfo);

    expect(testInfo.attach).toHaveBeenCalledOnce();
    const callArgs = testInfo.attach.mock.calls[0] as unknown[];
    const attachOpts = callArgs[1] as { body: Buffer };
    const traces = JSON.parse(attachOpts.body.toString('utf8')) as unknown[];
    expect(traces).toHaveLength(2);
  });

  it('does not throw when testInfo.attach fails', async () => {
    const fn = extractFixtureFn(fixtures['odataTraceInterceptor']);
    const { page, emit } = createMockPage();
    const testInfo = {
      attach: vi.fn().mockRejectedValue(new Error('attach failed')),
    };

    const useFn = async (): Promise<void> => {
      const req = createMockRequest('GET', 'https://host/sap/opu/odata/sap/SVC/Products');
      emit('request', req);
      emit('response', createMockResponse(req, 200, '100'));
      await Promise.resolve();
    };

    // Should not throw — attach failure is non-fatal
    await expect(
      (
        fn as (
          deps: Record<string, unknown>,
          use: () => Promise<void>,
          info: unknown,
        ) => Promise<void>
      )({ page, pramanConfig: createEnabledConfig() }, useFn, testInfo),
    ).resolves.toBeUndefined();
  });
});

describe('isODataUrl', () => {
  it('returns true for /sap/opu/odata/ URLs', () => {
    expect(isODataUrl('https://host/sap/opu/odata/sap/API/Products', ['/sap/opu/odata/'])).toBe(
      true,
    );
  });

  it('returns true for /odata/v4/ URLs', () => {
    expect(isODataUrl('https://host/odata/v4/CatalogService/Products', ['/odata/v4/'])).toBe(true);
  });

  it('returns false for non-OData URLs', () => {
    expect(isODataUrl('https://host/api/v1/users', ['/sap/opu/odata/', '/odata/v4/'])).toBe(false);
  });

  it('returns true when URL matches custom pattern', () => {
    expect(isODataUrl('https://host/my-custom-odata/Products', ['/my-custom-odata/'])).toBe(true);
  });

  it('returns false for empty patterns array', () => {
    expect(isODataUrl('https://host/sap/opu/odata/sap/API/Products', [])).toBe(false);
  });
});
