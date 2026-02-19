/**
 * FE Test Library facade — OPA5 Given/When/Then pattern execution.
 *
 * @remarks
 * Provides a stateful class (P1 exception for stateful managers) that uses
 * Proxy + Queue + Deferred Execution to capture OPA5 method calls from
 * Given/When/Then chains, inject them into the browser, and execute
 * the OPA5 queue. This is the Node.js-side orchestrator for the browser-side
 * FE test library scripts in `fe-browser-scripts.ts`.
 *
 * @module fe
 */

import {
  FE_LOAD_LIBRARIES_SCRIPT,
  FE_INIT_OPA_SCRIPT,
  FE_ADD_TO_QUEUE_SCRIPT,
  FE_EMPTY_QUEUE_SCRIPT,
  FE_DETECT_WORKZONE_SCRIPT,
} from './fe-browser-scripts.js';
import type { TestLibraryConfig, ProxyMethodCall, FETestLibraryResponse } from './types.js';

import { BridgeError } from '#core/errors/bridge-error.js';
import { ErrorCode } from '#core/errors/codes.js';

/**
 * Minimal page interface required by the FE Test Library.
 *
 * @remarks
 * Abstracts Playwright's `Page` to the subset needed for script injection
 * and WorkZone detection. This allows unit testing with lightweight mocks.
 *
 * @example
 * ```typescript
 * const page: FETestLibraryPage = playwrightPage;
 * await initializeFETestLibrary(page, config);
 * ```
 */
export interface FETestLibraryPage {
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  locator(selector: string): { count(): Promise<number> };
}

/**
 * Options for initializing the FE Test Library.
 *
 * @example
 * ```typescript
 * const options: FETestLibraryOptions = {
 *   detectWorkZone: true,
 *   timeout: 30_000,
 *   pollingInterval: 500,
 * };
 * ```
 */
export interface FETestLibraryOptions {
  readonly detectWorkZone?: boolean;
  readonly timeout?: number;
  readonly pollingInterval?: number;
}

/** Fallback message when browser script returns no error details. */
const UNKNOWN_ERROR_MESSAGE = 'Unknown error';

/** WorkZone detection result from the browser-side script. */
interface WorkZoneDetection {
  readonly isWorkZone: boolean;
  readonly hasShell: boolean;
  readonly hasIframe: boolean;
}

/**
 * Creates a scope proxy that captures Given/When/Then method call chains.
 *
 * @remarks
 * Uses JavaScript `Proxy` to intercept property access and function calls,
 * building up a `ProxyMethodCall` for each chained expression. Supports
 * `.and` accessor chains for OPA5 fluent API patterns.
 *
 * A single shared mutable `methods` array per target is used so that
 * all chain continuations (`.onFilterBar().iChangeSearchField('x')`)
 * accumulate into the same captured call entry.
 *
 * @param type - The OPA5 scope type: 'Given', 'When', or 'Then'
 * @param methodCalls - Array to push captured calls into
 * @returns A Proxy that captures all method call chains
 *
 * @example
 * ```typescript
 * const calls: ProxyMethodCall[] = [];
 * const When = createScopeProxy('When', calls);
 * When.onTheMainPage.onFilterBar().iChangeSearchField('x');
 * // calls[0] = { type: 'When', target: 'onTheMainPage', methods: [...] }
 * ```
 */
function createScopeProxy(
  type: 'Given' | 'When' | 'Then',
  methodCalls: ProxyMethodCall[],
): unknown {
  /**
   * Creates a chain proxy that records methods on a specific target page.
   * Uses a shared mutable `methods` array so all chain continuations
   * accumulate into the same entry.
   */
  function createChainProxy(
    target: string,
    methods: { name: string; args?: readonly unknown[]; accessor?: boolean }[],
  ): unknown {
    // Flush the current chain state into methodCalls
    flushCall(type, target, methods, methodCalls);

    return new Proxy(
      function noop() {
        /* empty */
      },
      {
        get(_obj: unknown, prop: string | symbol): unknown {
          if (typeof prop === 'symbol') return undefined;
          methods.push({ name: prop, accessor: true });
          flushCall(type, target, methods, methodCalls);
          return createChainProxy(target, methods);
        },
        apply(_obj: unknown, _thisArg: unknown, argArray: unknown[]): unknown {
          // Replace last accessor entry with a function call entry
          const lastEntry = methods[methods.length - 1];
          if (lastEntry !== undefined) {
            const entry: { name: string; args?: readonly unknown[]; accessor?: boolean } = {
              name: lastEntry.name,
              accessor: false,
            };
            if (argArray.length > 0) {
              entry.args = argArray;
            }
            methods[methods.length - 1] = entry;
          }
          flushCall(type, target, methods, methodCalls);
          return createChainProxy(target, methods);
        },
      },
    );
  }

  // Top-level proxy: captures the page target (e.g., `onTheMainPage`)
  return new Proxy(Object.create(null) as Record<string, unknown>, {
    get(_obj: unknown, prop: string | symbol): unknown {
      if (typeof prop === 'symbol') return undefined;
      // Each target page gets its own shared mutable methods array
      const methods: { name: string; args?: readonly unknown[]; accessor?: boolean }[] = [];
      return createChainProxy(prop, methods);
    },
  });
}

/**
 * Flushes a captured method call chain into the collection.
 *
 * @remarks
 * Removes any previously captured call for the same type+target
 * to avoid duplicates during chain building, then pushes the current
 * snapshot (frozen copy) of the methods array.
 */
function flushCall(
  type: 'Given' | 'When' | 'Then',
  target: string,
  methods: { name: string; args?: readonly unknown[]; accessor?: boolean }[],
  methodCalls: ProxyMethodCall[],
): void {
  // Remove existing entry for same type+target (overwrite with latest chain)
  const existingIndex = methodCalls.findIndex(
    (call) => call.type === type && call.target === target,
  );
  if (existingIndex >= 0) {
    methodCalls.splice(existingIndex, 1);
  }
  methodCalls.push({
    type,
    target,
    methods: methods.map((m) => ({ ...m })),
  });
}

/**
 * Stateful FE Test Library instance for OPA5 test execution.
 *
 * @remarks
 * Created exclusively by {@link initializeFETestLibrary}. Manages the
 * lifecycle of OPA5 page objects and provides the `execute()` method
 * for running Given/When/Then chains against the browser.
 *
 * P1 exception: This is a stateful class (manages initialized state,
 * WorkZone detection, and method call history).
 *
 * @example
 * ```typescript
 * const fe = await initializeFETestLibrary(page, config);
 * const logs = await fe.execute(({ Given, When, Then }) => {
 *   When.onTheMainPage.onFilterBar().iChangeSearchField('test');
 *   Then.onTheMainPage.onFilterBar().iCheckSearchField('test');
 * });
 * ```
 */
export class FETestLibraryInstance {
  private readonly page: FETestLibraryPage;
  private readonly frozenConfig: Readonly<TestLibraryConfig>;
  private readonly initialized: boolean;
  private workZoneDetected: boolean;
  private lastMethodCalls: readonly ProxyMethodCall[];

  /** @internal Use {@link initializeFETestLibrary} to create instances. */
  constructor(page: FETestLibraryPage, config: TestLibraryConfig, initialized: boolean) {
    this.page = page;
    this.frozenConfig = Object.freeze({ ...config });
    this.initialized = initialized;
    this.workZoneDetected = false;
    this.lastMethodCalls = [];
  }

  /**
   * The frozen test library configuration.
   *
   * @example
   * ```typescript
   * const cfg = fe.config;
   * ```
   */
  get config(): Readonly<TestLibraryConfig> {
    return this.frozenConfig;
  }

  /**
   * Whether the FE test library has been initialized.
   *
   * @example
   * ```typescript
   * if (fe.isInitialized) { ... }
   * ```
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Executes a Given/When/Then chain against the browser OPA5 queue.
   *
   * @param fn - Function receiving Given/When/Then proxy objects
   * @returns Array of OPA5 assertion log messages
   *
   * @example
   * ```typescript
   * const logs = await fe.execute(({ Given, When, Then }) => {
   *   When.onTheMainPage.onFilterBar().iChangeSearchField('test');
   * });
   * ```
   */
  async execute(
    fn: (scope: { Given: unknown; When: unknown; Then: unknown }) => void,
  ): Promise<readonly string[]> {
    if (!this.initialized) {
      throw new BridgeError({
        code: ErrorCode.ERR_BRIDGE_NOT_READY,
        message: 'FE Test Library is not initialized',
        attempted: 'Execute OPA5 Given/When/Then chain',
        suggestions: ['Call initializeFETestLibrary() before execute()'],
      });
    }

    const methodCalls: ProxyMethodCall[] = [];
    const Given = createScopeProxy('Given', methodCalls);
    const When = createScopeProxy('When', methodCalls);
    const Then = createScopeProxy('Then', methodCalls);

    fn({ Given, When, Then });

    this.lastMethodCalls = [...methodCalls];

    const addResult = await this.page.evaluate<FETestLibraryResponse>(
      FE_ADD_TO_QUEUE_SCRIPT,
      methodCalls,
    );
    if (addResult.type === 'error') {
      throw new BridgeError({
        code: ErrorCode.ERR_BRIDGE_EXECUTION,
        message: `FE queue add failed: ${addResult.message ?? UNKNOWN_ERROR_MESSAGE}`,
        attempted: 'Add method calls to OPA5 queue',
        suggestions: ['Verify page objects are configured correctly'],
      });
    }

    const execResult = await this.page.evaluate<FETestLibraryResponse>(FE_EMPTY_QUEUE_SCRIPT);
    if (execResult.type === 'error') {
      throw new BridgeError({
        code: ErrorCode.ERR_BRIDGE_EXECUTION,
        message: `FE queue execution failed: ${execResult.message ?? UNKNOWN_ERROR_MESSAGE}`,
        attempted: 'Execute OPA5 queue',
        suggestions: [
          'Check that OPA5 assertions are valid',
          'Verify the application state matches expectations',
        ],
      });
    }

    return execResult.feLogs ?? [];
  }

  /**
   * Returns the configured page object keys.
   *
   * @returns Array of page keys (e.g., `['onTheMainPage', 'onTheDetailPage']`)
   *
   * @example
   * ```typescript
   * const keys = fe.getPageKeys(); // ['onTheMainPage']
   * ```
   */
  getPageKeys(): readonly string[] {
    return Object.keys(this.frozenConfig);
  }

  /**
   * Returns the method calls captured during the last `execute()` invocation.
   *
   * @returns Captured proxy method calls, or empty array if never executed
   *
   * @example
   * ```typescript
   * await fe.execute(({ When }) => { When.onTheMainPage.onTable().iSelectRow(0); });
   * const history = fe.getMethodCallHistory();
   * ```
   */
  getMethodCallHistory(): readonly ProxyMethodCall[] {
    return this.lastMethodCalls;
  }

  /**
   * Returns the shell instance if WorkZone was detected, otherwise undefined.
   *
   * @returns Shell detection info or undefined
   *
   * @example
   * ```typescript
   * const shell = fe.getShellInstance();
   * if (shell) { ... }
   * ```
   */
  getShellInstance(): WorkZoneDetection | undefined {
    if (!this.workZoneDetected) return undefined;
    return { isWorkZone: true, hasShell: true, hasIframe: true };
  }

  /**
   * Switches context to the shell frame (WorkZone only).
   *
   * @example
   * ```typescript
   * fe.toShell();
   * ```
   */
  toShell(): void {
    this.workZoneDetected = true;
  }

  /**
   * Switches context to the application frame (WorkZone only).
   *
   * @example
   * ```typescript
   * fe.toApp();
   * ```
   */
  toApp(): void {
    this.workZoneDetected = false;
  }

  /** @internal Marks WorkZone as detected. */
  setWorkZoneDetected(detected: boolean): void {
    this.workZoneDetected = detected;
  }
}

/**
 * Factory function to initialize the FE Test Library.
 *
 * @remarks
 * Injects browser-side scripts to load SAP FE test libraries and initialize
 * OPA5 page objects. Optionally detects BTP WorkZone environment.
 *
 * @param page - Playwright Page (or compatible mock)
 * @param config - FE test library page object configuration
 * @param options - Optional initialization settings
 * @returns Initialized FETestLibraryInstance
 *
 * @example
 * ```typescript
 * const fe = await initializeFETestLibrary(page, {
 *   onTheMainPage: {
 *     ListReport: { appId: 'my.app', componentId: 'comp', entitySet: 'Items' },
 *   },
 * });
 * ```
 */
export async function initializeFETestLibrary(
  page: FETestLibraryPage,
  config: TestLibraryConfig,
  options?: FETestLibraryOptions,
): Promise<FETestLibraryInstance> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, sonarjs/different-types-comparison -- runtime guard for JS callers
  if (config === null || config === undefined || Object.keys(config).length === 0) {
    throw new BridgeError({
      code: ErrorCode.ERR_BRIDGE_INJECTION,
      message: 'FE Test Library config must have at least one page object',
      attempted: 'Initialize FE Test Library with config',
      retryable: false,
      suggestions: [
        'Provide at least one page key (onTheMainPage, onTheDetailPage, or onTheShell)',
      ],
    });
  }

  // Step 1: Load FE test libraries
  const loadResult = await page.evaluate<FETestLibraryResponse>(FE_LOAD_LIBRARIES_SCRIPT);
  if (loadResult.type === 'error') {
    throw new BridgeError({
      code: ErrorCode.ERR_BRIDGE_INJECTION,
      message: `Failed to load FE test libraries: ${loadResult.message ?? UNKNOWN_ERROR_MESSAGE}`,
      attempted: 'Load SAP FE test libraries via sap.ui.require',
      suggestions: [
        'Ensure UI5 runtime is loaded (version >= 1.100)',
        'Check that sap/fe/test modules are available',
      ],
    });
  }

  // Step 2: Initialize OPA5 page objects
  const initResult = await page.evaluate<readonly [string, string]>(FE_INIT_OPA_SCRIPT, config);
  if (initResult[0] === 'error') {
    throw new BridgeError({
      code: ErrorCode.ERR_BRIDGE_EXECUTION,
      message: `Failed to initialize OPA5: ${initResult[1]}`,
      attempted: 'Initialize OPA5 page objects with config',
      suggestions: [
        'Verify appId and componentId values are correct',
        'Check that entitySet exists in the OData service',
      ],
    });
  }

  const instance = new FETestLibraryInstance(page, config, true);

  // Step 3: Optionally detect WorkZone
  if (options?.detectWorkZone === true) {
    const detection = await page.evaluate<WorkZoneDetection>(FE_DETECT_WORKZONE_SCRIPT);
    instance.setWorkZoneDetected(detection.isWorkZone);
  }

  return instance;
}
