/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type {
  DocUnderTest,
  SharedContext,
  UI5ControlMetadata,
  UI5Property,
  UI5Method,
  UI5Event,
  UI5Aggregation,
} from '../../../scripts/docs-verify/lib/types.js';

// Mock the fetcher module before importing check8
vi.mock('../../../scripts/docs-verify/lib/ui5-api-fetcher.js', () => ({
  fetchUi5ControlMetadata: vi.fn(),
}));

// Import after mock setup
const { check8SapUi5Api } =
  await import('../../../scripts/docs-verify/checks/check8-sap-ui5-api.js');
const { fetchUi5ControlMetadata } =
  await import('../../../scripts/docs-verify/lib/ui5-api-fetcher.js');

const mockedFetch = vi.mocked(fetchUi5ControlMetadata);

function makeDoc(content: string, overrides?: Partial<DocUnderTest>): DocUnderTest {
  return {
    filePath: 'docs/docs/guides/test.md',
    shortName: 'guides/test.md',
    content,
    frontmatter: {},
    mappedSourceFiles: [],
    ...overrides,
  };
}

function makeContext(): SharedContext {
  return {
    apiSurface: new Map(),
    configDefaults: new Map(),
    claimTestResults: new Map(),
    testIndex: { files: new Map() },
    exampleTestMap: [],
    vitestResults: new Map(),
    ui5ApiCache: new Map(),
    changedFiles: [],
  };
}

function makeMetadata(overrides?: Partial<UI5ControlMetadata>): UI5ControlMetadata {
  return {
    name: 'sap.m.Button',
    kind: 'class',
    properties: new Map<string, UI5Property>([
      ['text', { name: 'text', type: 'string' }],
      ['enabled', { name: 'enabled', type: 'boolean' }],
      ['icon', { name: 'icon', type: 'sap.ui.core.URI' }],
    ]),
    methods: new Map<string, UI5Method>([
      ['getText', { name: 'getText', returnType: 'string' }],
      ['setText', { name: 'setText' }],
      ['firePress', { name: 'firePress' }],
    ]),
    events: new Map<string, UI5Event>([['press', { name: 'press' }]]),
    aggregations: new Map<string, UI5Aggregation>([
      ['tooltip', { name: 'tooltip', type: 'sap.ui.core.TooltipBase' }],
    ]),
    ...overrides,
  };
}

describe('check8-sap-ui5-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should skip when no SAP UI5 references found', async () => {
    const doc = makeDoc('# Getting Started\n\nThis is a basic guide.');
    const ctx = makeContext();

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.status).toBe('skip');
    expect(result.skipReason).toContain('No SAP UI5 references');
  });

  it('should pass for valid control type', async () => {
    const doc = makeDoc("Use controlType: 'sap.m.Button' to find buttons.");
    const ctx = makeContext();
    mockedFetch.mockResolvedValue(makeMetadata());

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
  });

  it('should error for non-existent control type', async () => {
    const doc = makeDoc("Use controlType: 'sap.m.FancyWidget' to find fancy widgets.");
    const ctx = makeContext();
    mockedFetch.mockResolvedValue(undefined);

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toContain('Unknown SAP UI5 control type');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.message).toContain('sap.m.FancyWidget');
  });

  it('should error for wrong property name with suggestion', async () => {
    const doc = makeDoc(`controlType: 'sap.m.Button'\nproperties: { txet: 'Click me' }`);
    const ctx = makeContext();
    mockedFetch.mockResolvedValue(makeMetadata());

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toContain("Unknown property 'txet'");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.suggestion).toContain('text');
  });

  it('should warn for deprecated control', async () => {
    const doc = makeDoc("Use controlType: 'sap.m.Button' for buttons.");
    const ctx = makeContext();
    mockedFetch.mockResolvedValue(
      makeMetadata({
        deprecated: { since: '1.100', text: 'Use sap.m.NewButton instead' },
      }),
    );

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.status).toBe('warn');
    expect(result.warnings).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.warnings[0]!.message).toContain('Deprecated control');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.warnings[0]!.message).toContain('1.100');
  });

  it('should warn when property is actually an aggregation', async () => {
    const doc = makeDoc(`controlType: 'sap.m.Button'\nproperties: { tooltip: 'Help text' }`);
    const ctx = makeContext();
    mockedFetch.mockResolvedValue(makeMetadata());

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.status).toBe('warn');
    expect(result.warnings).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.warnings[0]!.message).toContain('aggregation');
  });

  it('should skip on network error (not fail)', async () => {
    const doc = makeDoc("Use controlType: 'sap.m.Button' for buttons.");
    const ctx = makeContext();
    mockedFetch.mockRejectedValue(new Error('Network timeout'));

    const result = await check8SapUi5Api.run(doc, ctx);

    // Should not have errors — network issues are skipped
    expect(result.errors).toHaveLength(0);
  });

  it('should error for unknown method with suggestion', async () => {
    const doc = makeDoc(`controlType: 'sap.m.Button'\ncall .getTxet()`);
    const ctx = makeContext();
    mockedFetch.mockResolvedValue(makeMetadata());

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors.some((e) => e.message.includes("Unknown method 'getTxet'"))).toBe(true);
    expect(result.errors.some((e) => e.suggestion?.includes('getText') === true)).toBe(true);
  });

  it('should error for unknown event', async () => {
    const doc = makeDoc(`controlType: 'sap.m.Button'\nfires 'clicked' event`);
    const ctx = makeContext();
    mockedFetch.mockResolvedValue(makeMetadata());

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors.some((e) => e.message.includes("Unknown event 'clicked'"))).toBe(true);
  });

  it('should use context cache for repeated control types', async () => {
    const doc = makeDoc("Use controlType: 'sap.m.Button' for buttons.");
    const ctx = makeContext();
    const metadata = makeMetadata();
    // Pre-populate cache
    ctx.ui5ApiCache.set('sap.m.Button', metadata);

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.status).toBe('pass');
    // fetchUi5ControlMetadata should NOT be called since cache was used
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('should warn for deprecated property', async () => {
    const doc = makeDoc(`controlType: 'sap.m.Button'\nproperties: { text: 'Click' }`);
    const ctx = makeContext();
    const meta = makeMetadata();
    const textProp = meta.properties.get('text');
    if (textProp !== undefined) textProp.deprecated = { since: '1.110' };
    mockedFetch.mockResolvedValue(meta);

    const result = await check8SapUi5Api.run(doc, ctx);

    expect(result.warnings.some((w) => w.message.includes('Deprecated property'))).toBe(true);
  });
});
