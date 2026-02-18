/**
 * Tests for `src/modules/navigation.ts` -- FLP navigation functions.
 *
 * @remarks
 * Verifies all nine navigation functions: navigateToApp, navigateToTile,
 * navigateToIntent, navigateToHash, navigateToHome, navigateBack,
 * navigateForward, searchAndOpenApp, and getCurrentHash.
 *
 * Uses mock page objects to avoid real browser dependencies.
 * Mock strategy: page with evaluate, goBack, goForward, locator methods.
 *
 * @module modules
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { NavigationPage } from '../../../src/modules/navigation.js';

import { NavigationError } from '#core/errors/navigation-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

// Mock waitForUI5Stable before importing navigation functions
vi.mock('#core/utils/wait-helpers.js', () => ({
  waitForUI5Stable: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
}));

// Import the mock so we can inspect calls
const { waitForUI5Stable } = await import('#core/utils/wait-helpers.js');

// Import navigation functions under test
const {
  navigateToApp,
  navigateToTile,
  navigateToIntent,
  navigateToHash,
  navigateToHome,
  navigateBack,
  navigateForward,
  searchAndOpenApp,
  getCurrentHash,
} = await import('../../../src/modules/navigation.js');

/**
 * Creates a mock locator with click, fill, and isVisible methods.
 */
function createMockLocator(options?: { visible?: boolean }): {
  click: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  isVisible: ReturnType<typeof vi.fn>;
} {
  return {
    click: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    fill: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    isVisible: vi.fn<() => Promise<boolean>>().mockResolvedValue(options?.visible ?? true),
  };
}

/**
 * Creates a minimal mock of Playwright's Page object for testing navigation.
 */
function createMockPage(): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
  goBack: ReturnType<typeof vi.fn>;
  goForward: ReturnType<typeof vi.fn>;
  locator: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined),
    waitForFunction: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    goBack: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    goForward: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    locator: vi.fn().mockReturnValue(createMockLocator()),
  };
}

/**
 * Casts a mock page to NavigationPage for type-safe function calls.
 */
function asPage(mock: ReturnType<typeof createMockPage>): NavigationPage {
  return mock as unknown as NavigationPage;
}

/**
 * Gets the second argument (hash) from the first call to page.evaluate.
 *
 * @param page - Mock page object.
 * @returns The hash string passed as second argument.
 */
function getEvaluateHashArg(page: ReturnType<typeof createMockPage>): unknown {
  expect(page.evaluate).toHaveBeenCalledTimes(1);
  const firstCall = page.evaluate.mock.calls[0] as unknown[];
  return firstCall[1];
}

describe('navigation module', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('navigateToApp', () => {
    it('sets hash via page.evaluate using ushell hasher and calls stability wait', async () => {
      const page = createMockPage();

      await navigateToApp(asPage(page), 'PurchaseOrder-manage');

      expect(page.evaluate).toHaveBeenCalledTimes(1);
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });

    it('throws NavigationError when appId is empty', async () => {
      const page = createMockPage();

      await expect(navigateToApp(asPage(page), '')).rejects.toThrow(NavigationError);
    });

    it('passes custom timeout to stability wait', async () => {
      const page = createMockPage();

      await navigateToApp(asPage(page), 'PurchaseOrder-manage', { timeout: 5000 });

      expect(waitForUI5Stable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ timeout: 5000 }),
      );
    });
  });

  describe('navigateToTile', () => {
    it('finds tile by title and clicks it, then waits for stability', async () => {
      const mockLocator = createMockLocator();
      const page = createMockPage();
      page.locator.mockReturnValue(mockLocator);

      await navigateToTile(asPage(page), 'Purchase Orders');

      expect(page.locator).toHaveBeenCalled();
      expect(mockLocator.click).toHaveBeenCalledTimes(1);
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });

    it('throws NavigationError when tile is not visible', async () => {
      const mockLocator = createMockLocator({ visible: false });
      const page = createMockPage();
      page.locator.mockReturnValue(mockLocator);

      await expect(navigateToTile(asPage(page), 'Nonexistent Tile')).rejects.toThrow(
        NavigationError,
      );
    });
  });

  describe('navigateToIntent', () => {
    it('builds hash with semantic object and action, sets via evaluate', async () => {
      const page = createMockPage();

      await navigateToIntent(asPage(page), { semanticObject: 'PurchaseOrder', action: 'manage' });

      const hash = getEvaluateHashArg(page);
      expect(hash).toContain('PurchaseOrder-manage');
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });

    it('includes params in hash when provided', async () => {
      const page = createMockPage();

      await navigateToIntent(
        asPage(page),
        { semanticObject: 'PurchaseOrder', action: 'manage' },
        { company: 'SAP', year: '2024' },
      );

      const hash = getEvaluateHashArg(page) as string;
      expect(hash).toContain('PurchaseOrder-manage');
      expect(hash).toContain('company=SAP');
      expect(hash).toContain('year=2024');
    });

    it('builds hash without params when params object is empty', async () => {
      const page = createMockPage();

      await navigateToIntent(
        asPage(page),
        { semanticObject: 'PurchaseOrder', action: 'manage' },
        {},
      );

      const hash = getEvaluateHashArg(page);
      expect(hash).toBe('PurchaseOrder-manage');
    });
  });

  describe('navigateToHash', () => {
    it('sets hash directly via page.evaluate', async () => {
      const page = createMockPage();

      await navigateToHash(asPage(page), 'Shell-home');

      const hash = getEvaluateHashArg(page);
      expect(hash).toBe('Shell-home');
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });

    it('handles hash with special characters', async () => {
      const page = createMockPage();

      await navigateToHash(asPage(page), 'App-view&/detail/123?query=test%20value');

      const hash = getEvaluateHashArg(page);
      expect(hash).toBe('App-view&/detail/123?query=test%20value');
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigateToHome', () => {
    it('navigates to Shell-home hash and waits for stability', async () => {
      const page = createMockPage();

      await navigateToHome(asPage(page));

      const hash = getEvaluateHashArg(page);
      expect(hash).toBe('Shell-home');
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigateBack', () => {
    it('calls page.goBack and waits for stability', async () => {
      const page = createMockPage();

      await navigateBack(asPage(page));

      expect(page.goBack).toHaveBeenCalledTimes(1);
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });
  });

  describe('navigateForward', () => {
    it('calls page.goForward and waits for stability', async () => {
      const page = createMockPage();

      await navigateForward(asPage(page));

      expect(page.goForward).toHaveBeenCalledTimes(1);
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });
  });

  describe('searchAndOpenApp', () => {
    it('fills search bar and clicks app tile result', async () => {
      const searchLocator = createMockLocator();
      const tileLocator = createMockLocator();
      const page = createMockPage();
      // First call returns search field, second returns tile result
      page.locator.mockReturnValueOnce(searchLocator).mockReturnValueOnce(tileLocator);

      await searchAndOpenApp(asPage(page), 'Purchase Orders');

      expect(searchLocator.fill).toHaveBeenCalledWith('Purchase Orders');
      expect(tileLocator.click).toHaveBeenCalledTimes(1);
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCurrentHash', () => {
    it('returns current hash from page.evaluate', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue('PurchaseOrder-manage');

      const result = await getCurrentHash(asPage(page));

      expect(result).toBe('PurchaseOrder-manage');
      expect(page.evaluate).toHaveBeenCalledTimes(1);
    });

    it('does NOT call waitForUI5Stable', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue('Shell-home');

      await getCurrentHash(asPage(page));

      expect(waitForUI5Stable).not.toHaveBeenCalled();
    });
  });

  describe('stability wait behavior', () => {
    it('all nav functions call waitForUI5Stable by default', async () => {
      const page = createMockPage();
      const mockLocator = createMockLocator();
      page.locator.mockReturnValue(mockLocator);

      await navigateToHome(asPage(page));
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
      vi.mocked(waitForUI5Stable).mockClear();

      await navigateBack(asPage(page));
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
      vi.mocked(waitForUI5Stable).mockClear();

      await navigateForward(asPage(page));
      expect(waitForUI5Stable).toHaveBeenCalledTimes(1);
    });

    it('skips stability wait when waitForStable is false', async () => {
      const page = createMockPage();

      await navigateToApp(asPage(page), 'SomeApp-display', { waitForStable: false });

      expect(waitForUI5Stable).not.toHaveBeenCalled();
    });

    it('passes custom timeout to stability wait via options', async () => {
      const page = createMockPage();

      await navigateToHome(asPage(page), { timeout: 20_000 });

      expect(waitForUI5Stable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ timeout: 20_000 }),
      );
    });

    it('uses default timeout when none specified', async () => {
      const page = createMockPage();

      await navigateToHome(asPage(page));

      expect(waitForUI5Stable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ timeout: DEFAULT_TIMEOUTS.UI5_WAIT }),
      );
    });
  });
});
