/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Mocked-module test for `navigateToSectionLink` — verifies the version-gated
 * `getByRole({ description })` path is skipped when the installed Playwright
 * lacks the `description` option.
 *
 * @remarks
 * `vi.mock()` applies module-wide and would interfere with the version-true
 * assertions in `navigation-space.test.ts`, so this lives in a separate file
 * (mirrors `step-decorator-mocked.test.ts`). Forcing `hasFeature` to return
 * `false` exercises the false edge of the `&&` branch in
 * `navigateToSectionLink`, protecting the per-file branch-coverage gate.
 *
 * @module modules
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SpaceNavigationPage } from '../../../src/modules/navigation-space.js';

// Force the version gate OFF before importing the module under test.
vi.mock('#core/compat/index.js', () => ({
  hasFeature: vi.fn().mockReturnValue(false),
}));

// waitForUI5Stable is unrelated to this assertion — stub it out.
vi.mock('#core/utils/wait-helpers.js', () => ({
  waitForUI5Stable: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
}));

// Import AFTER the mocks so they take effect.
const { navigateToSectionLink } = await import('../../../src/modules/navigation-space.js');

function createMockLocator(): { click: ReturnType<typeof vi.fn> } {
  return {
    click: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
  };
}

function createMockPage(): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
  getByText: ReturnType<typeof vi.fn>;
  getByRole: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined),
    waitForFunction: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    getByText: vi.fn().mockReturnValue(createMockLocator()),
    getByRole: vi.fn().mockReturnValue(createMockLocator()),
  };
}

function asPage(mock: ReturnType<typeof createMockPage>): SpaceNavigationPage {
  return mock as unknown as SpaceNavigationPage;
}

describe('navigateToSectionLink — description gate disabled (PW < 1.60)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does NOT forward description when hasFeature returns false', async () => {
    const mockLocator = createMockLocator();
    const page = createMockPage();
    page.getByRole.mockReturnValue(mockLocator);

    await navigateToSectionLink(asPage(page), 'Manage', {
      description: 'Supplier list',
    });

    // description is dropped — getByRole receives only the name
    expect(page.getByRole).toHaveBeenCalledWith('link', { name: 'Manage' });
    expect(mockLocator.click).toHaveBeenCalledTimes(1);
  });
});
