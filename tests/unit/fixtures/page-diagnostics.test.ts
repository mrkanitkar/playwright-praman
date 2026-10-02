/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/page-diagnostics.ts` — UI5 diagnostics capture.
 *
 * @remarks
 * Pins the floor-safety rule from the design review: the three capture methods
 * must be called with NO arguments, because the `filter` option does not exist
 * before Playwright 1.59 and JavaScript silently ignores surplus arguments.
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockChildLogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
vi.mock('#core/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue(mockChildLogger),
}));

const { collectPageDiagnostics, DIAGNOSTIC_CAPS } = await import('#fixtures/page-diagnostics.js');

// ── Mocks ──────────────────────────────────────────────────────────────────

type MockPage = Page & {
  consoleMessages: ReturnType<typeof vi.fn>;
  pageErrors: ReturnType<typeof vi.fn>;
  requests: ReturnType<typeof vi.fn>;
};

function makeConsoleMessage(type: string, text: string): unknown {
  return { type: () => type, text: () => text };
}

function makeRequest(method: string, url: string): unknown {
  return { method: () => method, url: () => url };
}

function createMockPage(overrides: Partial<Record<string, unknown>> = {}): MockPage {
  const page = {
    consoleMessages: vi.fn().mockResolvedValue([makeConsoleMessage('error', 'UI5 binding failed')]),
    pageErrors: vi.fn().mockResolvedValue([new Error('boom')]),
    requests: vi.fn().mockResolvedValue([makeRequest('GET', 'https://sap/odata/$metadata')]),
    ...overrides,
  };
  return page as unknown as MockPage;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('fixtures/page-diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('floor safety', () => {
    // R1 from the design review. The filter option arrives in 1.59; passing it
    // on 1.57 returns everything while the caller believes it got a subset.
    it('calls consoleMessages with no arguments', async () => {
      const page = createMockPage();

      await collectPageDiagnostics(page);

      expect(page.consoleMessages).toHaveBeenCalledWith();
    });

    it('calls pageErrors with no arguments', async () => {
      const page = createMockPage();

      await collectPageDiagnostics(page);

      expect(page.pageErrors).toHaveBeenCalledWith();
    });

    it('calls requests with no arguments', async () => {
      const page = createMockPage();

      await collectPageDiagnostics(page);

      expect(page.requests).toHaveBeenCalledWith();
    });
  });

  describe('capture', () => {
    it('returns console messages with type and text', async () => {
      const page = createMockPage();

      const diag = await collectPageDiagnostics(page);

      expect(diag.consoleMessages).toEqual([{ type: 'error', text: 'UI5 binding failed' }]);
    });

    it('returns page errors as messages', async () => {
      const page = createMockPage();

      const diag = await collectPageDiagnostics(page);

      expect(diag.pageErrors[0]).toContain('boom');
    });

    it('returns requests with method and url', async () => {
      const page = createMockPage();

      const diag = await collectPageDiagnostics(page);

      expect(diag.requests).toEqual([{ method: 'GET', url: 'https://sap/odata/$metadata' }]);
    });

    it('handles a non-Error value thrown as a page error', async () => {
      const page = createMockPage({ pageErrors: vi.fn().mockResolvedValue(['plain string']) });

      const diag = await collectPageDiagnostics(page);

      expect(diag.pageErrors[0]).toContain('plain string');
    });
  });

  // UI5 logs heavily through sap/base/Log, so an uncapped capture would bloat
  // every failure artifact.
  describe('caps', () => {
    it('truncates console messages beyond the cap and says so', async () => {
      const many = Array.from({ length: DIAGNOSTIC_CAPS.consoleMessages + 50 }, (_, i) =>
        makeConsoleMessage('log', `msg ${String(i)}`),
      );
      const page = createMockPage({ consoleMessages: vi.fn().mockResolvedValue(many) });

      const diag = await collectPageDiagnostics(page);

      expect(diag.consoleMessages).toHaveLength(DIAGNOSTIC_CAPS.consoleMessages);
      expect(diag.truncated.consoleMessages).toBe(true);
    });

    it('truncates requests beyond the cap', async () => {
      const many = Array.from({ length: DIAGNOSTIC_CAPS.requests + 10 }, (_, i) =>
        makeRequest('GET', `https://sap/odata/Item(${String(i)})`),
      );
      const page = createMockPage({ requests: vi.fn().mockResolvedValue(many) });

      const diag = await collectPageDiagnostics(page);

      expect(diag.requests).toHaveLength(DIAGNOSTIC_CAPS.requests);
      expect(diag.truncated.requests).toBe(true);
    });

    it('truncates page errors beyond the cap', async () => {
      const many = Array.from(
        { length: DIAGNOSTIC_CAPS.pageErrors + 5 },
        (_, i) => new Error(`e${String(i)}`),
      );
      const page = createMockPage({ pageErrors: vi.fn().mockResolvedValue(many) });

      const diag = await collectPageDiagnostics(page);

      expect(diag.pageErrors).toHaveLength(DIAGNOSTIC_CAPS.pageErrors);
      expect(diag.truncated.pageErrors).toBe(true);
    });

    it('reports nothing truncated when under the caps', async () => {
      const diag = await collectPageDiagnostics(createMockPage());

      expect(diag.truncated).toEqual({
        consoleMessages: false,
        pageErrors: false,
        requests: false,
      });
    });
  });

  // Diagnostics run on a page that has just failed, and may be closed or
  // mid-navigation. One failing source must not lose the other two.
  describe('resilience', () => {
    it('still returns the other sources when consoleMessages throws', async () => {
      const page = createMockPage({
        consoleMessages: vi.fn().mockRejectedValue(new Error('page closed')),
      });

      const diag = await collectPageDiagnostics(page);

      expect(diag.consoleMessages).toEqual([]);
      expect(diag.requests).toHaveLength(1);
    });

    it('still returns the other sources when requests throws', async () => {
      const page = createMockPage({ requests: vi.fn().mockRejectedValue(new Error('detached')) });

      const diag = await collectPageDiagnostics(page);

      expect(diag.requests).toEqual([]);
      expect(diag.consoleMessages).toHaveLength(1);
    });

    it('returns empty diagnostics when the API is missing entirely', async () => {
      // Defensive: a non-Playwright page double, or a future API removal.
      const diag = await collectPageDiagnostics({} as unknown as Page);

      expect(diag.consoleMessages).toEqual([]);
      expect(diag.pageErrors).toEqual([]);
      expect(diag.requests).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('handles a non-Error rejection from a capture source', async () => {
      const page = createMockPage({ requests: vi.fn().mockRejectedValue('detached') });

      const diag = await collectPageDiagnostics(page);

      expect(diag.requests).toEqual([]);
    });

    it('falls back to the message when an error carries no stack', async () => {
      const stackless = new Error('no stack here');
      delete stackless.stack;
      const page = createMockPage({ pageErrors: vi.fn().mockResolvedValue([stackless]) });

      const diag = await collectPageDiagnostics(page);

      expect(diag.pageErrors[0]).toBe('no stack here');
    });

    it('prefers the stack when one is present', async () => {
      const page = createMockPage();

      const diag = await collectPageDiagnostics(page);

      expect(diag.pageErrors[0]).toContain('Error: boom');
    });
  });

  describe('isEmpty', () => {
    it('is true when nothing was captured', async () => {
      const diag = await collectPageDiagnostics({} as unknown as Page);

      expect(diag.isEmpty).toBe(true);
    });

    it('is false when anything was captured', async () => {
      const diag = await collectPageDiagnostics(createMockPage());

      expect(diag.isEmpty).toBe(false);
    });
  });
});
