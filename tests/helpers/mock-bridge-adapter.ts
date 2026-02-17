/**
 * Mock BridgeAdapter factory for unit tests.
 *
 * @remarks
 * Creates a fully mocked {@link BridgeAdapter} where every method is a `vi.fn()`.
 * Default return values are safe no-ops (resolved promises returning sensible
 * defaults) so tests only need to override the methods they care about.
 *
 * M12: `vi.fn()` returns undefined by default, NOT throws. This ensures tests
 * that don't exercise a particular method won't fail with unexpected errors.
 *
 * @example
 * ```typescript
 * import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';
 *
 * const adapter = createMockBridgeAdapter();
 * await adapter.init(mockPage);
 * expect(adapter.init).toHaveBeenCalledWith(mockPage);
 * ```
 *
 * @module test-helpers
 */

import { vi } from 'vitest';
import type { Mock } from 'vitest';

import type { BridgeAdapter } from '#bridge/adapter.js';

/**
 * A fully mocked BridgeAdapter where every method is a Vitest mock function.
 *
 * @remarks
 * Extends the real {@link BridgeAdapter} interface so that mock instances
 * are assignable wherever `BridgeAdapter` is expected. Each method is typed
 * as `Mock<BridgeAdapter['method']>` to enable `.mockResolvedValue()`,
 * `.toHaveBeenCalled()`, etc. while preserving type compatibility.
 *
 * @example
 * ```typescript
 * const adapter: MockBridgeAdapter = createMockBridgeAdapter();
 * adapter.findControl.mockResolvedValue({ id: 'btn1', controlType: 'sap.m.Button' });
 * ```
 */
export interface MockBridgeAdapter extends BridgeAdapter {
  // ── Lifecycle ────────────────────────────────────────────────────────
  readonly init: Mock<BridgeAdapter['init']>;
  readonly isReady: Mock<BridgeAdapter['isReady']>;
  readonly destroy: Mock<BridgeAdapter['destroy']>;

  // ── Version detection ────────────────────────────────────────────────
  readonly getUI5Version: Mock<BridgeAdapter['getUI5Version']>;
  readonly isWebComponent: Mock<BridgeAdapter['isWebComponent']>;

  // ── Control discovery ────────────────────────────────────────────────
  readonly findControl: Mock<BridgeAdapter['findControl']>;
  readonly findControls: Mock<BridgeAdapter['findControls']>;

  // ── Control interaction ──────────────────────────────────────────────
  readonly getControlProperty: Mock<BridgeAdapter['getControlProperty']>;
  readonly setControlProperty: Mock<BridgeAdapter['setControlProperty']>;
  readonly getControlAggregation: Mock<BridgeAdapter['getControlAggregation']>;
  readonly executeControlMethod: Mock<BridgeAdapter['executeControlMethod']>;

  // ── UI5 stability ────────────────────────────────────────────────────
  readonly waitForUI5Stable: Mock<BridgeAdapter['waitForUI5Stable']>;

  // ── Object access ────────────────────────────────────────────────────
  readonly getModel: Mock<BridgeAdapter['getModel']>;
  readonly getBindingContext: Mock<BridgeAdapter['getBindingContext']>;

  // ── Introspection (AI-first) ─────────────────────────────────────────
  readonly describeControl: Mock<BridgeAdapter['describeControl']>;
  readonly getAvailableMethods: Mock<BridgeAdapter['getAvailableMethods']>;
  readonly getSelectorForControl: Mock<BridgeAdapter['getSelectorForControl']>;

  // ── Injection management ──────────────────────────────────────────────
  readonly resetInjectionState: Mock<BridgeAdapter['resetInjectionState']>;
}

/**
 * Creates a fully mocked BridgeAdapter with safe default return values.
 *
 * @remarks
 * Every method returns a resolved promise with a sensible default:
 * - Boolean methods resolve to their "happy path" value (`isReady` -\> `true`)
 * - Collection methods resolve to empty arrays
 * - Object methods resolve to `undefined` or empty objects
 * - Void methods resolve to `undefined`
 *
 * Override specific methods via the `overrides` parameter for targeted testing.
 *
 * @param overrides - Optional partial mock overrides for specific test scenarios.
 * @returns A MockBridgeAdapter with all 16 methods stubbed.
 *
 * @example
 * ```typescript
 * import { vi } from 'vitest';
 * import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';
 *
 * // Default mock — all methods return safe defaults
 * const adapter = createMockBridgeAdapter();
 *
 * // With overrides — customize specific methods
 * const customAdapter = createMockBridgeAdapter({
 *   findControl: vi.fn().mockResolvedValue({
 *     id: 'saveBtn',
 *     controlType: 'sap.m.Button',
 *   }),
 *   getUI5Version: vi.fn().mockResolvedValue('1.108.0'),
 * });
 * ```
 */
export function createMockBridgeAdapter(overrides?: Partial<MockBridgeAdapter>): MockBridgeAdapter {
  return {
    // ── Lifecycle ──────────────────────────────────────────────────────
    init: vi.fn<BridgeAdapter['init']>().mockResolvedValue(undefined),
    isReady: vi.fn<BridgeAdapter['isReady']>().mockResolvedValue(true),
    destroy: vi.fn<BridgeAdapter['destroy']>().mockResolvedValue(undefined),

    // ── Version detection ──────────────────────────────────────────────
    getUI5Version: vi.fn<BridgeAdapter['getUI5Version']>().mockResolvedValue('1.120.0'),
    isWebComponent: vi.fn<BridgeAdapter['isWebComponent']>().mockResolvedValue(false),

    // ── Control discovery ──────────────────────────────────────────────
    findControl: vi.fn<BridgeAdapter['findControl']>().mockResolvedValue(null),
    findControls: vi.fn<BridgeAdapter['findControls']>().mockResolvedValue([]),

    // ── Control interaction ────────────────────────────────────────────
    getControlProperty: vi.fn<BridgeAdapter['getControlProperty']>().mockResolvedValue(undefined),
    setControlProperty: vi.fn<BridgeAdapter['setControlProperty']>().mockResolvedValue(undefined),
    getControlAggregation: vi.fn<BridgeAdapter['getControlAggregation']>().mockResolvedValue([]),
    executeControlMethod: vi
      .fn<BridgeAdapter['executeControlMethod']>()
      .mockResolvedValue(undefined),

    // ── UI5 stability ──────────────────────────────────────────────────
    waitForUI5Stable: vi.fn<BridgeAdapter['waitForUI5Stable']>().mockResolvedValue(undefined),

    // ── Object access ──────────────────────────────────────────────────
    getModel: vi.fn<BridgeAdapter['getModel']>().mockResolvedValue(undefined),
    getBindingContext: vi.fn<BridgeAdapter['getBindingContext']>().mockResolvedValue(undefined),

    // ── Introspection (AI-first) ───────────────────────────────────────
    describeControl: vi.fn<BridgeAdapter['describeControl']>().mockResolvedValue({}),
    getAvailableMethods: vi.fn<BridgeAdapter['getAvailableMethods']>().mockResolvedValue([]),
    getSelectorForControl: vi.fn<BridgeAdapter['getSelectorForControl']>().mockResolvedValue(null),

    // ── Injection management ───────────────────────────────────────────
    resetInjectionState: vi.fn<BridgeAdapter['resetInjectionState']>(),

    // Apply overrides last to allow customization
    ...overrides,
  };
}
