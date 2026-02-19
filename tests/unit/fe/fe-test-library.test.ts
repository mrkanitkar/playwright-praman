/**
 * Tests for `src/fe/fe-test-library.ts` — FE Test Library facade.
 *
 * @remarks
 * Verifies initialization, Proxy+Queue execution, method call capture,
 * WorkZone detection, and error handling for the OPA5 Given/When/Then pattern.
 *
 * Mock strategy:
 * - Mock `FETestLibraryPage` with `evaluate()` and `locator().count()`
 * - Script results are controlled via `evaluate` mock return values
 *
 * @module fe
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { FETestLibraryPage } from '../../../src/fe/fe-test-library.js';
import type { TestLibraryConfig, ProxyMethodCall } from '../../../src/fe/types.js';

import { BridgeError } from '#core/errors/bridge-error.js';

// Import module under test
const { initializeFETestLibrary, FETestLibraryInstance } =
  await import('../../../src/fe/fe-test-library.js');

/**
 * Creates a mock page that stubs evaluate() and locator().count().
 */
function createMockPage(overrides?: {
  loadResult?: { type: string; message: string };
  initResult?: readonly [string, string];
  addResult?: { type: string; message?: string };
  execResult?: { type: string; feLogs?: readonly string[]; message?: string };
  detectResult?: { isWorkZone: boolean; hasShell: boolean; hasIframe: boolean };
  includeDetect?: boolean;
}): {
  evaluate: ReturnType<typeof vi.fn>;
  locator: ReturnType<typeof vi.fn>;
} {
  const loadResult = overrides?.loadResult ?? { type: 'success', message: 'loaded' };
  const initResult = overrides?.initResult ?? (['success', 'initialized'] as const);
  const addResult = overrides?.addResult ?? { type: 'success', message: 'added' };
  const execResult = overrides?.execResult ?? {
    type: 'success',
    feLogs: ['log1', 'log2'],
    message: 'done',
  };

  const evaluateFn = vi.fn<(...args: unknown[]) => Promise<unknown>>();

  // Init phase: load + init (always present)
  evaluateFn.mockResolvedValueOnce(loadResult);
  evaluateFn.mockResolvedValueOnce(initResult);

  // Optional detect call (only when detectWorkZone option is used)
  if (overrides?.includeDetect === true) {
    const detectResult = overrides.detectResult ?? {
      isWorkZone: false,
      hasShell: false,
      hasIframe: false,
    };
    evaluateFn.mockResolvedValueOnce(detectResult);
  }

  // Execute phase: add-to-queue + empty-queue
  evaluateFn.mockResolvedValueOnce(addResult);
  evaluateFn.mockResolvedValueOnce(execResult);

  return {
    evaluate: evaluateFn,
    locator: vi.fn().mockReturnValue({
      count: vi.fn<() => Promise<number>>().mockResolvedValue(0),
    }),
  };
}

/** Casts a mock page to FETestLibraryPage. */
function asPage(mock: ReturnType<typeof createMockPage>): FETestLibraryPage {
  return mock as unknown as FETestLibraryPage;
}

/** Standard config for tests. */
const VALID_CONFIG: TestLibraryConfig = {
  onTheMainPage: {
    ListReport: {
      appId: 'test.app',
      componentId: 'testComp',
      entitySet: 'Products',
    },
  },
};

/** Helper to invoke a When proxy call inside execute(). */
function invokeWhenProxy(scope: { Given: unknown; When: unknown; Then: unknown }): void {
  const whenProxy = scope.When as Record<string, (...args: unknown[]) => unknown>;
  const targetFn = whenProxy['onTheMainPage'];
  if (targetFn !== undefined) {
    targetFn();
  }
}

describe('initializeFETestLibrary', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns an FETestLibraryInstance on success', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    expect(instance).toBeInstanceOf(FETestLibraryInstance);
    expect(instance.isInitialized).toBe(true);
  });

  it('throws BridgeError when config is empty object', async () => {
    const page = createMockPage();
    const emptyConfig: TestLibraryConfig = {};

    await expect(initializeFETestLibrary(asPage(page), emptyConfig)).rejects.toThrow(BridgeError);
    await expect(initializeFETestLibrary(asPage(page), emptyConfig)).rejects.toThrow(
      'at least one page object',
    );
  });

  it('throws BridgeError when config is null-like', async () => {
    const page = createMockPage();

    await expect(initializeFETestLibrary(asPage(page), null as never)).rejects.toThrow(BridgeError);
  });

  it('throws BridgeError when load script fails', async () => {
    const page = createMockPage({
      loadResult: { type: 'error', message: 'Module not found' },
    });

    await expect(initializeFETestLibrary(asPage(page), VALID_CONFIG)).rejects.toThrow(
      'Failed to load FE test libraries',
    );
  });

  it('throws BridgeError when init script fails', async () => {
    const page = createMockPage({
      initResult: ['error', 'Unknown FE class: Bogus'],
    });

    await expect(initializeFETestLibrary(asPage(page), VALID_CONFIG)).rejects.toThrow(
      'Failed to initialize OPA5',
    );
  });

  it('calls evaluate with load script as first call', async () => {
    const page = createMockPage();
    await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    // First call: load libraries
    expect(page.evaluate).toHaveBeenNthCalledWith(1, expect.stringContaining('fe_bridge'));
  });

  it('calls evaluate with init script and config as second call', async () => {
    const page = createMockPage();
    await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    // Second call: init OPA with config
    expect(page.evaluate).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('createPageObjects'),
      VALID_CONFIG,
    );
  });

  it('detects WorkZone when detectWorkZone option is true', async () => {
    const page = createMockPage({
      includeDetect: true,
      detectResult: { isWorkZone: true, hasShell: true, hasIframe: true },
    });
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG, {
      detectWorkZone: true,
    });

    expect(instance.getShellInstance()).toEqual({
      isWorkZone: true,
      hasShell: true,
      hasIframe: true,
    });
  });

  it('does not detect WorkZone when detectWorkZone option is false', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG, {
      detectWorkZone: false,
    });

    expect(instance.getShellInstance()).toBeUndefined();
  });

  it('does not set WorkZone when detection returns isWorkZone false', async () => {
    const page = createMockPage({
      includeDetect: true,
      detectResult: { isWorkZone: false, hasShell: false, hasIframe: false },
    });
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG, {
      detectWorkZone: true,
    });

    expect(instance.getShellInstance()).toBeUndefined();
  });

  it('throws BridgeError with fallback message when load script error has no message', async () => {
    const page = createMockPage({
      loadResult: { type: 'error', message: '' },
    });

    await expect(initializeFETestLibrary(asPage(page), VALID_CONFIG)).rejects.toThrow(
      'Failed to load FE test libraries',
    );
  });
});

describe('FETestLibraryInstance.execute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('captures method calls from Given/When/Then proxies', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await instance.execute(invokeWhenProxy);

    const history: readonly ProxyMethodCall[] = instance.getMethodCallHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]?.type).toBe('When');
  });

  it('calls add-to-queue script via page.evaluate', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await instance.execute(invokeWhenProxy);

    // After init (2 calls), execute makes 2 more calls: add-to-queue + empty-queue
    expect(page.evaluate).toHaveBeenCalledTimes(4);
    // Third call should be add-to-queue
    expect(page.evaluate).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('scopeMap'),
      expect.any(Array),
    );
  });

  it('calls empty-queue script via page.evaluate', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await instance.execute(invokeWhenProxy);

    // Fourth call should be empty-queue
    expect(page.evaluate).toHaveBeenNthCalledWith(4, expect.stringContaining('emptyQueue'));
  });

  it('returns feLogs from queue execution', async () => {
    const page = createMockPage({
      execResult: {
        type: 'success',
        feLogs: ['Assertion passed: filter applied'],
        message: 'done',
      },
    });
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    const logs = await instance.execute(invokeWhenProxy);

    expect(logs).toEqual(['Assertion passed: filter applied']);
  });

  it('throws BridgeError when not initialized', async () => {
    const page = createMockPage();
    const uninitializedInstance = new FETestLibraryInstance(asPage(page), VALID_CONFIG, false);

    await expect(
      uninitializedInstance.execute(() => {
        /* noop */
      }),
    ).rejects.toThrow(BridgeError);
    await expect(
      uninitializedInstance.execute(() => {
        /* noop */
      }),
    ).rejects.toThrow('not initialized');
  });

  it('throws BridgeError when add-to-queue fails', async () => {
    const page = createMockPage({
      addResult: { type: 'error', message: 'Method not found: onBogus' },
    });
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await expect(instance.execute(invokeWhenProxy)).rejects.toThrow('queue add failed');
  });

  it('throws BridgeError with fallback message when add-to-queue fails without message', async () => {
    const page = createMockPage({
      addResult: { type: 'error' },
    });
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await expect(instance.execute(invokeWhenProxy)).rejects.toThrow('Unknown error');
  });

  it('throws BridgeError when empty-queue execution fails', async () => {
    const page = createMockPage({
      execResult: { type: 'error', message: 'OPA5 assertion failed' },
    });
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await expect(instance.execute(invokeWhenProxy)).rejects.toThrow('queue execution failed');
  });

  it('throws BridgeError with fallback message when empty-queue fails without message', async () => {
    const page = createMockPage({
      execResult: { type: 'error' },
    });
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await expect(instance.execute(invokeWhenProxy)).rejects.toThrow('Unknown error');
  });

  it('returns empty array when feLogs is undefined (fallback)', async () => {
    const page = createMockPage({
      execResult: { type: 'success' },
    });
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    const logs = await instance.execute(invokeWhenProxy);
    expect(logs).toEqual([]);
  });
});

describe('FETestLibraryInstance.getPageKeys', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns config page keys', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    const keys = instance.getPageKeys();

    expect(keys).toEqual(['onTheMainPage']);
  });
});

describe('FETestLibraryInstance.getMethodCallHistory', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns captured calls after execute', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await instance.execute(invokeWhenProxy);

    const history = instance.getMethodCallHistory();
    expect(history.length).toBeGreaterThan(0);
  });

  it('returns empty array before any execute call', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    const history = instance.getMethodCallHistory();
    expect(history).toEqual([]);
  });
});

describe('FETestLibraryInstance.getShellInstance', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns undefined when no WorkZone detected', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    const shell = instance.getShellInstance();

    expect(shell).toBeUndefined();
  });

  it('returns WorkZone detection info after toShell()', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    instance.toShell();
    const shell = instance.getShellInstance();

    expect(shell).toEqual({ isWorkZone: true, hasShell: true, hasIframe: true });
  });
});

describe('FETestLibraryInstance.toShell / toApp', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('toShell() sets WorkZone detected to true', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    instance.toShell();

    expect(instance.getShellInstance()).toBeDefined();
  });

  it('toApp() sets WorkZone detected to false', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    instance.toShell();
    expect(instance.getShellInstance()).toBeDefined();

    instance.toApp();
    expect(instance.getShellInstance()).toBeUndefined();
  });

  it('setWorkZoneDetected(true) enables shell instance', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    instance.setWorkZoneDetected(true);
    expect(instance.getShellInstance()).toBeDefined();

    instance.setWorkZoneDetected(false);
    expect(instance.getShellInstance()).toBeUndefined();
  });
});

describe('Proxy captures', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('captures chained method calls with arguments', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await instance.execute((scope) => {
      // Simulate: When.onTheMainPage.onFilterBar().iChangeSearchField('test')
      const whenProxy = scope.When as Record<string, unknown>;
      const chain = whenProxy['onTheMainPage'] as Record<string, unknown> | undefined;
      const filterBarFn = chain?.['onFilterBar'] as
        | ((...args: unknown[]) => Record<string, unknown>)
        | undefined;
      const filterBar = filterBarFn?.();
      const searchFn = filterBar?.['iChangeSearchField'] as
        | ((...args: unknown[]) => unknown)
        | undefined;
      searchFn?.('test');
    });

    const history = instance.getMethodCallHistory();
    expect(history.length).toBeGreaterThan(0);

    const call = history[history.length - 1];
    expect(call?.type).toBe('When');
    expect(call?.target).toBe('onTheMainPage');
    // Should have captured method names from the chain
    const methodNames = call?.methods.map((m) => m.name);
    expect(methodNames).toContain('onFilterBar');
    expect(methodNames).toContain('iChangeSearchField');
  });

  it('captures .and accessor chains', async () => {
    const page = createMockPage();
    const instance = await initializeFETestLibrary(asPage(page), VALID_CONFIG);

    await instance.execute((scope) => {
      // Simulate: Then.onTheMainPage.onTable().iCheckRows(5).and.iCheckTitle('Products')
      const thenProxy = scope.Then as Record<string, unknown>;
      const chain = thenProxy['onTheMainPage'] as Record<string, unknown> | undefined;
      const tableFn = chain?.['onTable'] as
        | ((...args: unknown[]) => Record<string, unknown>)
        | undefined;
      const table = tableFn?.();
      const checkRowsFn = table?.['iCheckRows'] as
        | ((...args: unknown[]) => Record<string, unknown>)
        | undefined;
      const afterCheck = checkRowsFn?.(5);
      const andChain = afterCheck?.['and'] as Record<string, unknown> | undefined;
      const titleFn = andChain?.['iCheckTitle'] as ((...args: unknown[]) => unknown) | undefined;
      titleFn?.('Products');
    });

    const history = instance.getMethodCallHistory();
    expect(history.length).toBeGreaterThan(0);

    const call = history[history.length - 1];
    expect(call?.type).toBe('Then');
    // Should contain 'and' accessor in the chain
    const methodNames = call?.methods.map((m) => m.name);
    expect(methodNames).toContain('and');
    // The 'and' entry should be marked as accessor
    const andEntry = call?.methods.find((m) => m.name === 'and');
    expect(andEntry?.accessor).toBe(true);
  });
});
