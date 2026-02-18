/**
 * Tests for `src/modules/workzone.ts` — BTP WorkZone dual-frame bridge injection.
 *
 * @remarks
 * Verifies WorkZone environment detection, dual bridge injection,
 * frame switching, app navigation, readiness checks, and edge cases.
 *
 * Mock strategy:
 * - Mock `Page` with `frameLocator()`, `frame()`, `frames()`, `evaluate()`, `mainFrame()`
 * - Mock `FrameLocator` — returns mock locators
 * - Mock `Frame` with `evaluate()`, `url()`
 * - Mock `BridgeAdapter` with `init()`, `resetInjectionState()`
 * - Mock `ensureBridgeInjected()` from `#bridge/injection.js`
 * - Mock `waitForUI5Stable()` from `#core/utils/wait-helpers.js`
 *
 * @module modules
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WorkZoneAdapter, WorkZonePage } from '../../../src/modules/workzone.js';

import { NavigationError } from '#core/errors/navigation-error.js';

// Mock bridge injection before importing module under test
vi.mock('#bridge/injection.js', () => ({
  ensureBridgeInjected: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
}));

vi.mock('#core/utils/wait-helpers.js', () => ({
  waitForUI5Stable: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
}));

// Import mocks for inspection — must be after vi.mock
const { ensureBridgeInjected } = await import('#bridge/injection.js');
const { waitForUI5Stable } = await import('#core/utils/wait-helpers.js');

// Import module under test — must be after vi.mock
const { createWorkZoneManager } = await import('../../../src/modules/workzone.js');

/**
 * Creates a mock Frame with evaluate, waitForFunction, and url methods.
 */
function createMockFrame(options?: { url?: string }): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
  url: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined),
    waitForFunction: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    url: vi
      .fn<() => string>()
      .mockReturnValue(options?.url ?? 'https://example.com/application/content'),
  };
}

/**
 * Creates a mock FrameLocator with locator method.
 */
function createMockFrameLocator(): { locator: ReturnType<typeof vi.fn> } {
  return {
    locator: vi.fn().mockReturnValue({
      click: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
      isVisible: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
    }),
  };
}

/**
 * Creates a mock BridgeAdapter with init and resetInjectionState methods.
 */
function createMockAdapter(): {
  init: ReturnType<typeof vi.fn>;
  resetInjectionState: ReturnType<typeof vi.fn>;
} {
  return {
    init: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    resetInjectionState: vi.fn<() => void>().mockReturnValue(undefined),
  };
}

/** Casts a mock adapter to WorkZoneAdapter. */
function asAdapter(mock: ReturnType<typeof createMockAdapter>): WorkZoneAdapter {
  return mock as unknown as WorkZoneAdapter;
}

/**
 * Creates a minimal mock of Playwright's Page for WorkZone testing.
 */
function createMockPage(options?: {
  isWorkZone?: boolean;
  appFrameUrl?: string;
  frames?: ReturnType<typeof createMockFrame>[];
}): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
  frameLocator: ReturnType<typeof vi.fn>;
  frame: ReturnType<typeof vi.fn>;
  frames: ReturnType<typeof vi.fn>;
  mainFrame: ReturnType<typeof vi.fn>;
} {
  const isWorkZone = options?.isWorkZone ?? true;
  const appFrameUrl = options?.appFrameUrl ?? 'https://example.com/application/content';

  const appFrame = createMockFrame({ url: appFrameUrl });
  const shellFrame = createMockFrame({ url: 'https://example.com/shell' });

  const allFrames = options?.frames ?? [shellFrame, appFrame];

  const mockFrameLocator = createMockFrameLocator();

  return {
    evaluate: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(isWorkZone),
    waitForFunction: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
    frameLocator: vi.fn().mockReturnValue(mockFrameLocator),
    frame: vi.fn().mockReturnValue(isWorkZone ? appFrame : null),
    frames: vi.fn().mockReturnValue([...allFrames]),
    mainFrame: vi.fn().mockReturnValue(shellFrame),
  };
}

/** Casts a mock page to WorkZonePage. */
function asPage(mock: ReturnType<typeof createMockPage>): WorkZonePage {
  return mock as unknown as WorkZonePage;
}

describe('createWorkZoneManager', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('detect', () => {
    it('returns true when page has WorkZone shell iframe', async () => {
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const result = await manager.detect();

      expect(result).toBe(true);
      expect(page.evaluate).toHaveBeenCalledTimes(1);
    });

    it('returns false for standard FLP without WorkZone', async () => {
      const page = createMockPage({ isWorkZone: false });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const result = await manager.detect();

      expect(result).toBe(false);
    });
  });

  describe('enableDualBridge', () => {
    it('injects bridge in both main frame and app iframe', async () => {
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      await manager.enableDualBridge();

      // Bridge should be injected for main frame (page) and app frame
      expect(ensureBridgeInjected).toHaveBeenCalled();
      // The app frame evaluate should also have been called for injection
      const allFrames = page.frames.mock.results[0]?.value as
        | ReturnType<typeof createMockFrame>[]
        | undefined;
      const appFrame = allFrames?.[1];
      expect(appFrame).toBeDefined();
      expect(appFrame?.evaluate).toHaveBeenCalled();
    });
  });

  describe('switchToApp', () => {
    it('returns FrameLocator for the app iframe', () => {
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const frameLocator = manager.switchToApp();

      expect(page.frameLocator).toHaveBeenCalled();
      expect(frameLocator).toBeDefined();
      expect(frameLocator).toHaveProperty('locator');
    });
  });

  describe('switchToShell', () => {
    it('returns page reference for shell frame context', () => {
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const result = manager.switchToShell();

      expect(result).toBe(asPage(page));
    });
  });

  describe('getAppFrameForEval', () => {
    it('returns Frame object for script execution in app iframe', () => {
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const frame = manager.getAppFrameForEval();

      expect(frame).toBeDefined();
      expect(frame).toHaveProperty('evaluate');
      expect(frame).toHaveProperty('url');
    });
  });

  describe('navigateToApp', () => {
    it('navigates to app via shell-level evaluate and waits for iframe', async () => {
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      await manager.navigateToApp('PurchaseOrder-manage');

      // Shell-level navigation via page evaluate
      expect(page.evaluate).toHaveBeenCalled();
      // Adapter injection state should be reset after navigation
      expect(adapter.resetInjectionState).toHaveBeenCalled();
    });

    it('throws NavigationError when appId is empty', async () => {
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      await expect(manager.navigateToApp('')).rejects.toThrow(NavigationError);
    });
  });

  describe('getCurrentApp', () => {
    it('returns semantic object string for current app', async () => {
      const page = createMockPage({ isWorkZone: true });
      page.evaluate.mockResolvedValue('PurchaseOrder-manage');
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const result = await manager.getCurrentApp();

      expect(result).toBe('PurchaseOrder-manage');
      expect(page.evaluate).toHaveBeenCalled();
    });

    it('returns null when no app is active', async () => {
      const page = createMockPage({ isWorkZone: true });
      page.evaluate.mockResolvedValue(null);
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const result = await manager.getCurrentApp();

      expect(result).toBeNull();
    });
  });

  describe('isAppReady', () => {
    it('waits for UI5 stable in app iframe and returns true', async () => {
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const result = await manager.isAppReady();

      expect(result).toBe(true);
      expect(waitForUI5Stable).toHaveBeenCalled();
    });

    it('returns false when UI5 stability check times out', async () => {
      vi.mocked(waitForUI5Stable).mockRejectedValueOnce(new Error('Timed out'));
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const result = await manager.isAppReady(1000);

      expect(result).toBe(false);
    });
  });

  describe('dual bridge after app navigation', () => {
    it('re-injects bridges in both frames after navigating to a new app', async () => {
      const page = createMockPage({ isWorkZone: true });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      await manager.navigateToApp('SalesOrder-display');
      await manager.enableDualBridge();

      // ensureBridgeInjected should be called for re-injection
      expect(ensureBridgeInjected).toHaveBeenCalled();
      // Adapter should have been reset for new injection
      expect(adapter.resetInjectionState).toHaveBeenCalled();
    });
  });

  describe('multiple iframe detection', () => {
    it('selects the correct application iframe from multiple iframes', () => {
      const otherFrame = createMockFrame({ url: 'https://example.com/other' });
      const appFrame = createMockFrame({ url: 'https://example.com/application/content' });
      const analyticsFrame = createMockFrame({ url: 'https://analytics.example.com/track' });
      const page = createMockPage({
        isWorkZone: true,
        frames: [otherFrame, appFrame, analyticsFrame],
      });
      const adapter = createMockAdapter();
      const manager = createWorkZoneManager(asPage(page), asAdapter(adapter));

      const frame = manager.getAppFrameForEval();

      // Should return the frame whose URL contains 'application'
      expect(frame).toBe(appFrame);
    });
  });
});
