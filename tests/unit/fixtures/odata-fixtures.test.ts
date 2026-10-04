/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/odata-fixtures.ts`.
 *
 * @remarks
 * Verifies that `odataTest` is a valid Playwright fixture extension and
 * that `ODataFixtures` exposes the `odata` key. The fixture delegates to
 * `createODataFixture` from module-fixtures, which is tested separately.
 *
 * @module fixtures
 */

import { describe, expect, expectTypeOf, it, vi } from 'vitest';

vi.mock('@playwright/test', () => ({
  test: {
    extend: vi.fn().mockImplementation((fixtures: Record<string, unknown>) => ({
      extend: vi.fn(),
      _fixtureDefinitions: fixtures,
    })),
  },
}));

vi.mock('../../../src/fixtures/module-fixtures.js', () => ({
  createODataFixture: vi.fn().mockReturnValue({
    getModelData: vi.fn(),
    getModelProperty: vi.fn(),
    waitForLoad: vi.fn(),
    fetchCSRFToken: vi.fn(),
    getEntityCount: vi.fn(),
    hasPendingChanges: vi.fn(),
    createEntity: vi.fn(),
    updateEntity: vi.fn(),
    deleteEntity: vi.fn(),
    queryEntities: vi.fn(),
    callFunctionImport: vi.fn(),
  }),
}));

import { createODataFixture } from '../../../src/fixtures/module-fixtures.js';
import type { ODataFixtures } from '../../../src/fixtures/odata-fixtures.js';

const mockCreateODataFixture = vi.mocked(createODataFixture);

describe('odata-fixtures', () => {
  it('odataTest is a valid Playwright fixture extension', async () => {
    const { odataTest } = await import('../../../src/fixtures/odata-fixtures.js');
    expect(odataTest).toBeDefined();
    expect(typeof odataTest.extend).toBe('function');
  });

  it('defines an odata fixture key', async () => {
    const { odataTest } = await import('../../../src/fixtures/odata-fixtures.js');
    const defs = (odataTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
      ._fixtureDefinitions;
    expect(defs).toHaveProperty('odata');
  });

  it('ODataFixtures type has odata property', () => {
    expectTypeOf<ODataFixtures>().toHaveProperty('odata');
  });

  it('fixture body calls createODataFixture with page', async () => {
    mockCreateODataFixture.mockClear();
    const { odataTest } = await import('../../../src/fixtures/odata-fixtures.js');
    const defs = (odataTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
      ._fixtureDefinitions;
    const fn = defs['odata'] as (
      deps: Record<string, unknown>,
      use: (v: unknown) => Promise<void>,
    ) => Promise<void>;

    const fakePage = { goto: vi.fn() };
    let captured: unknown;
    await fn({ page: fakePage }, async (value) => {
      captured = value;
      await Promise.resolve();
    });

    expect(mockCreateODataFixture).toHaveBeenCalledOnce();
    expect(mockCreateODataFixture).toHaveBeenCalledWith(fakePage);
    expect(captured).toBeDefined();
  });
});
