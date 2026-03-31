/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for `src/ai/context-builder.ts`.
 *
 * @remarks
 * The `bulk-discovery` module is mocked at the module level so that
 * `discoverPage` can be controlled independently of its real implementation.
 * The `vi.mock()` call is hoisted before any imports by Vitest's hoisting
 * mechanism, ensuring the mock is active when the module under test is loaded.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// IMPORTANT: vi.mock must appear before the import of the module under test.
vi.mock('../../../src/ai/bulk-discovery.js', () => ({
  discoverPage: vi.fn(),
}));

import { discoverPage } from '../../../src/ai/bulk-discovery.js';
import { buildPageContext } from '../../../src/ai/context-builder.js';
import type { AiResponse, PageContext } from '../../../src/ai/types.js';

// ── Typed mock ───────────────────────────────────────────────────────────────

const mockDiscoverPage = vi.mocked(discoverPage);

// ── Fixtures ────────────────────────────────────────────────────────────────

const basePageContext: PageContext = {
  url: 'https://my.fiori.app/',
  controls: [],
  buttons: [],
  formFields: [],
  tables: [],
  navigationElements: [],
  timestamp: new Date().toISOString(),
};

const successResponse: AiResponse<PageContext> = {
  status: 'success',
  data: basePageContext,
  metadata: {
    duration: 42,
    retryable: false,
    suggestions: [],
  },
};

const errorResponse: AiResponse<PageContext> = {
  status: 'error',
  data: undefined,
  error: {
    code: 'ERR_AI_CONTEXT_BUILD_FAILED',
    message: 'Evaluate failed',
  },
  metadata: {
    duration: 10,
    retryable: true,
    suggestions: ['Try again after waitForUI5Stable()'],
  },
};

interface MinimalConfig {
  logLevel: 'info';
  ui5WaitTimeout: number;
  controlDiscoveryTimeout: number;
  interactionStrategy: 'ui5-native';
  discoveryStrategies: ['direct-id', 'recordreplay'];
  skipStabilityWait: boolean;
  preferVisibleControls: boolean;
  ignoreAutoWaitUrls: string[];
  defaultMatchSubclasses: boolean;
}

function makeMinimalConfig(
  overrides: Partial<{ controlDiscoveryTimeout: number }> = {},
): MinimalConfig {
  return {
    logLevel: 'info' as const,
    ui5WaitTimeout: 30_000,
    controlDiscoveryTimeout: overrides.controlDiscoveryTimeout ?? 10_000,
    interactionStrategy: 'ui5-native' as const,
    discoveryStrategies: ['direct-id', 'recordreplay'] as ['direct-id', 'recordreplay'],
    skipStabilityWait: false,
    preferVisibleControls: true,
    ignoreAutoWaitUrls: [] as string[],
    defaultMatchSubclasses: false,
  };
}

interface MockPage {
  evaluate: ReturnType<typeof vi.fn>;
  url?: ReturnType<typeof vi.fn>;
}

function makeMockPage(
  evaluateResult: string | (() => Promise<string | undefined>) = '1.120.0',
): MockPage {
  if (typeof evaluateResult === 'function') {
    return { evaluate: vi.fn().mockImplementation(evaluateResult) };
  }
  return { evaluate: vi.fn().mockResolvedValue(evaluateResult) };
}

function makeRejectingMockPage(): MockPage {
  return {
    evaluate: vi.fn().mockRejectedValue(new Error('context destroyed')),
  };
}

function makeUndefinedMockPage(): MockPage {
  return {
    evaluate: vi.fn().mockResolvedValue(undefined),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('buildPageContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. Success path ──────────────────────────────────────────────────────

  it('returns success with PageContext when discovery succeeds', async () => {
    mockDiscoverPage.mockResolvedValue(successResponse);
    const page = makeMockPage('1.120.0');
    const config = makeMinimalConfig();

    const result = await buildPageContext(page as never, config);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.url).toBe('https://my.fiori.app/');
      expect(result.data.controls).toEqual([]);
    }
  });

  // ── 2. ui5Version enrichment ─────────────────────────────────────────────

  it('enriches PageContext with ui5Version when browser evaluate returns it', async () => {
    mockDiscoverPage.mockResolvedValue(successResponse);
    const page = makeMockPage('1.120.0');
    const config = makeMinimalConfig();

    const result = await buildPageContext(page as never, config);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.ui5Version).toBe('1.120.0');
    }
  });

  // ── 3. ui5Version omitted when browser evaluate fails ───────────────────

  it('omits ui5Version when browser evaluate rejects', async () => {
    mockDiscoverPage.mockResolvedValue(successResponse);
    const page = makeRejectingMockPage();
    const config = makeMinimalConfig();

    const result = await buildPageContext(page as never, config);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect('ui5Version' in result.data).toBe(false);
    }
  });

  it('omits ui5Version when browser evaluate returns undefined', async () => {
    mockDiscoverPage.mockResolvedValue(successResponse);
    const page = makeUndefinedMockPage();
    const config = makeMinimalConfig();

    const result = await buildPageContext(page as never, config);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect('ui5Version' in result.data).toBe(false);
    }
  });

  // ── 4. Error passthrough ─────────────────────────────────────────────────

  it('passes error response through when discoverPage returns error status', async () => {
    mockDiscoverPage.mockResolvedValue(errorResponse);
    const page = makeMockPage('1.120.0');
    const config = makeMinimalConfig();

    const result = await buildPageContext(page as never, config);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.code).toBe('ERR_AI_CONTEXT_BUILD_FAILED');
      expect(result.error.message).toBe('Evaluate failed');
    }
  });

  // ── 5. Timeout forwarded to discoverPage ─────────────────────────────────

  it('calls discoverPage with controlDiscoveryTimeout from config', async () => {
    mockDiscoverPage.mockResolvedValue(successResponse);
    const page = makeMockPage('1.120.0');
    const config = makeMinimalConfig({ controlDiscoveryTimeout: 15_000 });

    await buildPageContext(page as never, config);

    expect(mockDiscoverPage).toHaveBeenCalledWith(
      page,
      expect.objectContaining({ timeout: 15_000 }),
    );
  });

  it('calls discoverPage with default timeout when config uses default', async () => {
    mockDiscoverPage.mockResolvedValue(successResponse);
    const page = makeMockPage('1.120.0');
    const config = makeMinimalConfig({ controlDiscoveryTimeout: 10_000 });

    await buildPageContext(page as never, config);

    expect(mockDiscoverPage).toHaveBeenCalledWith(
      page,
      expect.objectContaining({ timeout: 10_000 }),
    );
  });

  // ── 6. Metadata preserved ────────────────────────────────────────────────

  it('preserves metadata from discoverPage in the returned response', async () => {
    mockDiscoverPage.mockResolvedValue(successResponse);
    const page = makeMockPage('1.120.0');
    const config = makeMinimalConfig();

    const result = await buildPageContext(page as never, config);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.metadata.duration).toBe(42);
      expect(result.metadata.retryable).toBe(false);
    }
  });

  // ── 7. enrichObjectCategory — unknown controlType (passthrough) ────────

  it('returns controls unchanged when controlType maps to unknown category', async () => {
    const unknownControl = {
      id: 'btn1',
      controlType: 'sap.m.Button',
      category: 'interactive' as const,
      visible: true,
      text: 'Save',
    };
    const contextWithControls: PageContext = {
      ...basePageContext,
      controls: [unknownControl],
      buttons: [unknownControl],
    };
    const responseWithControls: AiResponse<PageContext> = {
      status: 'success',
      data: contextWithControls,
      metadata: { duration: 42, retryable: false, suggestions: [] },
    };
    mockDiscoverPage.mockResolvedValue(responseWithControls);
    const page = makeMockPage('1.120.0');
    const config = makeMinimalConfig();

    const result = await buildPageContext(page as never, config);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      // sap.m.Button maps to 'unknown' — control should pass through without objectCategory
      expect(result.data.controls[0]).toEqual(unknownControl);
      expect(result.data.buttons[0]).toEqual(unknownControl);
      expect(result.data.controls[0]).not.toHaveProperty('objectCategory');
    }
  });

  // ── 8. enrichObjectCategory — known controlType (enriched) ─────────────

  it('enriches controls with objectCategory when controlType maps to a known category', async () => {
    const routerControl = {
      id: 'router1',
      controlType: 'sap.ui.core.routing.Router',
      category: 'unknown' as const,
      visible: false,
    };
    const modelControl = {
      id: 'model1',
      controlType: 'sap.ui.model.json.JSONModel',
      category: 'unknown' as const,
      visible: false,
    };
    const contextWithKnown: PageContext = {
      ...basePageContext,
      controls: [routerControl],
      formFields: [modelControl],
    };
    const responseWithKnown: AiResponse<PageContext> = {
      status: 'success',
      data: contextWithKnown,
      metadata: { duration: 50, retryable: false, suggestions: [] },
    };
    mockDiscoverPage.mockResolvedValue(responseWithKnown);
    const page = makeMockPage('1.120.0');
    const config = makeMinimalConfig();

    const result = await buildPageContext(page as never, config);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls[0]).toEqual({
        ...routerControl,
        objectCategory: 'router',
      });
      expect(result.data.formFields[0]).toEqual({
        ...modelControl,
        objectCategory: 'model',
      });
    }
  });

  // ── 9. enrichObjectCategory — all array fields are enriched ────────────

  it('enriches controls across all discovery arrays (tables, navigationElements)', async () => {
    const bindingControl = {
      id: 'binding1',
      controlType: 'sap.ui.model.odata.v4.ODataListBinding',
      category: 'unknown' as const,
      visible: false,
    };
    const componentControl = {
      id: 'comp1',
      controlType: 'sap.ui.core.UIComponent',
      category: 'unknown' as const,
      visible: false,
    };
    const contextAllArrays: PageContext = {
      ...basePageContext,
      tables: [bindingControl],
      navigationElements: [componentControl],
    };
    const responseAllArrays: AiResponse<PageContext> = {
      status: 'success',
      data: contextAllArrays,
      metadata: { duration: 55, retryable: false, suggestions: [] },
    };
    mockDiscoverPage.mockResolvedValue(responseAllArrays);
    const page = makeMockPage('1.120.0');
    const config = makeMinimalConfig();

    const result = await buildPageContext(page as never, config);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.tables[0]).toEqual({
        ...bindingControl,
        objectCategory: 'binding',
      });
      expect(result.data.navigationElements[0]).toEqual({
        ...componentControl,
        objectCategory: 'component',
      });
    }
  });
});
