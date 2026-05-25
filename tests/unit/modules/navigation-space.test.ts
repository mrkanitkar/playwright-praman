/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/modules/navigation-space.ts` -- FLP Space and Section navigation.
 *
 * @remarks
 * Verifies navigateToSpace and navigateToSectionLink functions that use
 * Playwright-native DOM interaction (getByText, getByRole) because
 * sap.m.IconTabFilter has no press/firePress methods.
 *
 * Uses mock page objects to avoid real browser dependencies.
 *
 * @module modules
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SpaceNavigationPage } from '../../../src/modules/navigation-space.js';

import { NavigationError } from '#core/errors/navigation-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

// Mock waitForUI5Stable before importing navigation functions
vi.mock('#core/utils/wait-helpers.js', () => ({
  waitForUI5Stable: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
}));

// Import the mock so we can inspect calls
const { waitForUI5Stable } = await import('#core/utils/wait-helpers.js');

// Import navigation functions under test
const { navigateToSpace, navigateToSectionLink } =
  await import('../../../src/modules/navigation-space.js');

/**
 * Creates a mock locator with a click method.
 */
function createMockLocator(): {
  click: ReturnType<typeof vi.fn>;
} {
  return {
    click: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
  };
}

/**
 * Creates a minimal mock of Playwright's Page object for testing Space/Section navigation.
 *
 * @remarks
 * Includes `getByText()` and `getByRole()` — Playwright-native locators
 * used by navigateToSpace and navigateToSectionLink.
 */
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

/**
 * Casts a mock page to SpaceNavigationPage for type-safe function calls.
 */
function asPage(mock: ReturnType<typeof createMockPage>): SpaceNavigationPage {
  return mock as unknown as SpaceNavigationPage;
}

describe('navigation-space module', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('navigateToSpace', () => {
    it('calls page.getByText().click() with exact match by default', async () => {
      const mockLocator = createMockLocator();
      const page = createMockPage();
      page.getByText.mockReturnValue(mockLocator);

      await navigateToSpace(asPage(page), 'Procurement');

      expect(page.getByText).toHaveBeenCalledWith('Procurement', { exact: true });
      expect(mockLocator.click).toHaveBeenCalledTimes(1);
      expect(mockLocator.click).toHaveBeenCalledWith({
        timeout: DEFAULT_TIMEOUTS.UI5_WAIT,
      });
    });

    it('waits for UI5 stability after clicking the space tab', async () => {
      const page = createMockPage();

      await navigateToSpace(asPage(page), 'Procurement');

      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
      expect(waitForUI5Stable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ timeout: DEFAULT_TIMEOUTS.UI5_WAIT }),
      );
    });

    it('passes exact: false when specified in options', async () => {
      const mockLocator = createMockLocator();
      const page = createMockPage();
      page.getByText.mockReturnValue(mockLocator);

      await navigateToSpace(asPage(page), 'Procure', { exact: false });

      expect(page.getByText).toHaveBeenCalledWith('Procure', { exact: false });
      expect(mockLocator.click).toHaveBeenCalledTimes(1);
    });

    it('passes custom timeout to click and stability wait', async () => {
      const mockLocator = createMockLocator();
      const page = createMockPage();
      page.getByText.mockReturnValue(mockLocator);

      await navigateToSpace(asPage(page), 'Procurement', { timeout: 15_000 });

      expect(mockLocator.click).toHaveBeenCalledWith({ timeout: 15_000 });
      expect(waitForUI5Stable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ timeout: 15_000 }),
      );
    });

    it('skips stability wait when waitForStable is false', async () => {
      const page = createMockPage();

      await navigateToSpace(asPage(page), 'Procurement', { waitForStable: false });

      expect(waitForUI5Stable).not.toHaveBeenCalled();
    });

    it('throws NavigationError when spaceTitle is empty', async () => {
      const page = createMockPage();

      await expect(navigateToSpace(asPage(page), '')).rejects.toThrow(NavigationError);
    });

    it('throws NavigationError when spaceTitle is whitespace-only', async () => {
      const page = createMockPage();

      await expect(navigateToSpace(asPage(page), '   ')).rejects.toThrow(NavigationError);
    });

    it('sets retryable to false for empty spaceTitle error', async () => {
      const page = createMockPage();

      try {
        await navigateToSpace(asPage(page), '');
      } catch (error) {
        expect(error).toBeInstanceOf(NavigationError);
        expect((error as NavigationError).retryable).toBe(false);
      }
    });
  });

  describe('navigateToSectionLink', () => {
    it('calls page.getByRole("link").click() with the link name', async () => {
      const mockLocator = createMockLocator();
      const page = createMockPage();
      page.getByRole.mockReturnValue(mockLocator);

      await navigateToSectionLink(asPage(page), 'Purchase Orders');

      expect(page.getByRole).toHaveBeenCalledWith('link', { name: 'Purchase Orders' });
      expect(mockLocator.click).toHaveBeenCalledTimes(1);
      expect(mockLocator.click).toHaveBeenCalledWith({
        timeout: DEFAULT_TIMEOUTS.UI5_WAIT,
      });
    });

    it('forwards description to getByRole when provided (PW 1.60+)', async () => {
      const mockLocator = createMockLocator();
      const page = createMockPage();
      page.getByRole.mockReturnValue(mockLocator);

      await navigateToSectionLink(asPage(page), 'Manage', {
        description: 'Supplier list',
      });

      expect(page.getByRole).toHaveBeenCalledWith('link', {
        name: 'Manage',
        description: 'Supplier list',
      });
      expect(mockLocator.click).toHaveBeenCalledTimes(1);
    });

    it('waits for UI5 stability after clicking the section link', async () => {
      const page = createMockPage();

      await navigateToSectionLink(asPage(page), 'Purchase Orders');

      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
      expect(waitForUI5Stable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ timeout: DEFAULT_TIMEOUTS.UI5_WAIT }),
      );
    });

    it('passes custom timeout to click and stability wait', async () => {
      const mockLocator = createMockLocator();
      const page = createMockPage();
      page.getByRole.mockReturnValue(mockLocator);

      await navigateToSectionLink(asPage(page), 'Manage Suppliers', { timeout: 10_000 });

      expect(mockLocator.click).toHaveBeenCalledWith({ timeout: 10_000 });
      expect(waitForUI5Stable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ timeout: 10_000 }),
      );
    });

    it('skips stability wait when waitForStable is false', async () => {
      const page = createMockPage();

      await navigateToSectionLink(asPage(page), 'Purchase Orders', { waitForStable: false });

      expect(waitForUI5Stable).not.toHaveBeenCalled();
    });

    it('throws NavigationError when linkName is empty', async () => {
      const page = createMockPage();

      await expect(navigateToSectionLink(asPage(page), '')).rejects.toThrow(NavigationError);
    });

    it('throws NavigationError when linkName is whitespace-only', async () => {
      const page = createMockPage();

      await expect(navigateToSectionLink(asPage(page), '  ')).rejects.toThrow(NavigationError);
    });

    it('sets retryable to false for empty linkName error', async () => {
      const page = createMockPage();

      try {
        await navigateToSectionLink(asPage(page), '');
      } catch (error) {
        expect(error).toBeInstanceOf(NavigationError);
        expect((error as NavigationError).retryable).toBe(false);
      }
    });
  });

  describe('stability wait behavior', () => {
    it('navigateToSpace calls waitForUI5Stable by default', async () => {
      const page = createMockPage();

      await navigateToSpace(asPage(page), 'Test Space');

      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });

    it('navigateToSectionLink calls waitForUI5Stable by default', async () => {
      const page = createMockPage();

      await navigateToSectionLink(asPage(page), 'Test Link');

      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });

    it('uses default timeout when none specified', async () => {
      const page = createMockPage();

      await navigateToSpace(asPage(page), 'Default Timeout Space');

      expect(waitForUI5Stable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ timeout: DEFAULT_TIMEOUTS.UI5_WAIT }),
      );
    });
  });
});
