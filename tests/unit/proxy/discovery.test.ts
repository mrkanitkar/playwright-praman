/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/proxy/discovery.ts`.
 *
 * @remarks
 * Validates node-side control discovery orchestration with strategy chain.
 * Uses function-form page.evaluate() and interaction strategy (no adapter).
 */
import type { Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import type { ControlDiscoveryResult } from '#bridge/bridge-types.js';
import type { InteractionStrategy } from '#bridge/interaction-strategies/strategy.js';
import { ControlError } from '#core/errors/control-error.js';
import { ControlProxyCache } from '#proxy/cache.js';
import { discoverControl } from '#proxy/discovery.js';

// Mock ensureBridgeInjected to be a no-op in tests
vi.mock('#bridge/injection.js', () => ({
  ensureBridgeInjected: vi.fn().mockResolvedValue(undefined),
}));

// Mock browserFindControl — discovery.ts now uses function-form evaluate
vi.mock('#bridge/browser-scripts/find-control-fn.js', () => ({
  browserFindControl: vi.fn(),
}));

/** Creates a minimal mock Page for testing. */
function createMockPage(overrides?: Partial<Record<string, unknown>>): Page {
  return {
    evaluate: vi.fn(),
    waitForFunction: vi.fn(),
    ...overrides,
  } as unknown as Page;
}

/** Creates a minimal mock InteractionStrategy for testing. */
function createMockStrategy(): InteractionStrategy {
  return {
    name: 'test',
    press: vi.fn(),
    enterText: vi.fn(),
    select: vi.fn(),
  };
}

/** Creates a successful ControlDiscoveryResult. */
function createDiscoveryResult(
  overrides?: Partial<ControlDiscoveryResult>,
): ControlDiscoveryResult {
  return {
    id: 'btn1',
    controlType: 'sap.m.Button',
    methods: ['getText', 'getEnabled'],
    domId: 'btn1',
    visible: true,
    ...overrides,
  };
}

/** Creates an empty (not-found) ControlDiscoveryResult. */
function createEmptyResult(): ControlDiscoveryResult {
  return {
    id: '',
    controlType: 'unknown',
    methods: [],
    domId: null,
    visible: false,
  };
}

describe('discoverControl', () => {
  it('returns proxy from cache on hit', async () => {
    const evaluateFn = vi.fn();
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    // Pre-populate cache with a mock entry
    const selector = { id: 'btn1' };
    const mockProxy = { id: 'btn1', controlType: 'sap.m.Button' };
    cache.set(selector, mockProxy as never);
    const result = await discoverControl(selector, page, strategy, cache, ['recordreplay']);
    expect(result).toBeDefined();
    expect(result.id).toBe('btn1');
    // page.evaluate should NOT have been called (cache hit)
    expect(evaluateFn).not.toHaveBeenCalled();
  });

  it('falls through to page.evaluate on cache miss', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createDiscoveryResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    const result = await discoverControl({ id: 'btn1' }, page, strategy, cache, [
      'recordreplay',
      'direct-id',
    ]);
    expect(result).toBeDefined();
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('throws ControlError with ERR_CONTROL_NOT_FOUND when all strategies fail', async () => {
    const page = createMockPage({
      evaluate: vi.fn().mockResolvedValue(createEmptyResult()),
    });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();

    try {
      await discoverControl({ id: 'nonexistent' }, page, strategy, cache, ['recordreplay']);
      expect.fail('Expected discoverControl to throw ControlError');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlError = error as ControlError;
      expect(controlError.code).toBe('ERR_CONTROL_NOT_FOUND');
      expect(controlError.retryable).toBe(true);
      expect(controlError.suggestions.length).toBeGreaterThan(0);
    }
  });

  it('ControlError includes retryable=true and suggestions array', async () => {
    const page = createMockPage({
      evaluate: vi.fn().mockResolvedValue(createEmptyResult()),
    });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();

    try {
      await discoverControl({ controlType: 'sap.m.Button' }, page, strategy, cache, [
        'recordreplay',
      ]);
      expect.fail('Expected discoverControl to throw ControlError');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlError = error as ControlError;
      expect(controlError.retryable).toBe(true);
      expect(controlError.suggestions).toEqual(
        expect.arrayContaining([expect.stringContaining('control ID')]),
      );
    }
  });

  it('ControlError message includes attempted strategies', async () => {
    const page = createMockPage({
      evaluate: vi.fn().mockResolvedValue(createEmptyResult()),
    });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();

    try {
      await discoverControl({ id: 'btn1', controlType: 'sap.m.Button' }, page, strategy, cache, [
        'direct-id',
        'recordreplay',
      ]);
      expect.fail('Expected discoverControl to throw ControlError');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(ControlError);
      const controlError = error as ControlError;
      expect(controlError.message).toContain('direct-id');
      expect(controlError.message).toContain('recordreplay');
      expect(controlError.message).toContain('2 discovery strategies');
      expect(controlError.details).toEqual(
        expect.objectContaining({
          attemptedStrategies: ['direct-id', 'recordreplay'],
        }),
      );
      expect(controlError.suggestions).toEqual(
        expect.arrayContaining([expect.stringContaining('Strategies attempted')]),
      );
    }
  });

  it('caches discovered proxy for subsequent lookups', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createDiscoveryResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    const selector = { id: 'btn1' };
    await discoverControl(selector, page, strategy, cache, ['recordreplay']);
    // Second call should hit cache
    const result2 = await discoverControl(selector, page, strategy, cache, ['recordreplay']);
    expect(result2).toBeDefined();
    // page.evaluate called only once (second was a cache hit)
    expect(evaluateFn).toHaveBeenCalledTimes(1);
  });

  // ── Strategy chain (G1) ────────────────────────────────────────────

  it('direct-id strategy passes id-only selector via function-form', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createDiscoveryResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    const selector = { id: 'btn1', controlType: 'sap.m.Button', properties: { text: 'Save' } };
    await discoverControl(selector, page, strategy, cache, ['direct-id']);
    expect(evaluateFn).toHaveBeenCalledTimes(1);
    // Function-form: page.evaluate receives (fn, args) not a string
    const [fn, args] = evaluateFn.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(typeof fn).toBe('function');
    // direct-id strips to id-only selector + includes preferVisibleControls
    expect(args).toEqual({
      selector: { id: 'btn1' },
      bridgeNs: '__praman_bridge',
      preferVisibleControls: true,
    });
  });

  it('recordreplay strategy passes full selector via function-form', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createEmptyResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    const selector = { controlType: 'sap.m.Button', properties: { text: 'Save' } };
    // discoverControl now throws when all strategies fail; we still want to assert the call args
    try {
      await discoverControl(selector, page, strategy, cache, ['recordreplay']);
    } catch {
      // Expected ControlError -- verified in separate test
    }
    expect(evaluateFn).toHaveBeenCalledTimes(1);
    const [fn, args] = evaluateFn.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(typeof fn).toBe('function');
    expect(args).toEqual(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest expect.objectContaining returns any
        selector: expect.objectContaining({ controlType: 'sap.m.Button' }),
        bridgeNs: '__praman_bridge',
      }),
    );
  });

  it('falls back to next strategy when first returns null', async () => {
    const evaluateFn = vi
      .fn()
      .mockResolvedValueOnce(createEmptyResult()) // direct-id fails
      .mockResolvedValueOnce(createDiscoveryResult()); // recordreplay succeeds
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    const selector = { id: 'btn1', controlType: 'sap.m.Button' };
    const result = await discoverControl(selector, page, strategy, cache, [
      'direct-id',
      'recordreplay',
    ]);
    expect(result).toBeDefined();
    expect(evaluateFn).toHaveBeenCalledTimes(2);
  });

  it('skips direct-id strategy when selector has no id', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createDiscoveryResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    const selector = { controlType: 'sap.m.Button', properties: { text: 'Save' } };
    await discoverControl(selector, page, strategy, cache, ['direct-id', 'recordreplay']);
    // direct-id skipped (no id), only recordreplay called
    expect(evaluateFn).toHaveBeenCalledTimes(1);
    const [, args] = evaluateFn.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(args).toEqual(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest expect.objectContaining returns any
        selector: expect.objectContaining({ controlType: 'sap.m.Button' }),
      }),
    );
  });

  it('registry strategy calls page.evaluate with forceRegistryScan', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createDiscoveryResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    await discoverControl({ controlType: 'sap.m.Button' }, page, strategy, cache, ['registry']);
    expect(evaluateFn).toHaveBeenCalledTimes(1);
    const [, args] = evaluateFn.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(args).toEqual(
      expect.objectContaining({
        forceRegistryScan: true,
        bridgeNs: '__praman_bridge',
      }),
    );
  });

  it('registry strategy passes full selector to browser', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createDiscoveryResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    const selector = { controlType: 'sap.m.Button', properties: { text: 'Save' } };
    await discoverControl(selector, page, strategy, cache, ['registry']);
    const [, args] = evaluateFn.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(args).toEqual(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- vitest expect.objectContaining returns any
        selector: expect.objectContaining({ controlType: 'sap.m.Button' }),
      }),
    );
  });

  it('stops at first successful strategy', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createDiscoveryResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    await discoverControl({ id: 'btn1' }, page, strategy, cache, ['direct-id', 'recordreplay']);
    // direct-id succeeds, recordreplay should not be attempted
    expect(evaluateFn).toHaveBeenCalledTimes(1);
  });

  // ── GAP-21: preferVisibleControls ───────────────────────────────────

  it('passes preferVisibleControls=true by default', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createDiscoveryResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    await discoverControl({ id: 'btn1' }, page, strategy, cache, ['direct-id']);
    const [, args] = evaluateFn.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(args).toEqual(
      expect.objectContaining({
        preferVisibleControls: true,
      }),
    );
  });

  it('passes preferVisibleControls=false when explicitly set', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(createDiscoveryResult());
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    await discoverControl({ id: 'btn1' }, page, strategy, cache, ['direct-id'], false);
    const [, args] = evaluateFn.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(args).toEqual(
      expect.objectContaining({
        preferVisibleControls: false,
      }),
    );
  });

  it('passes preferVisibleControls through to all strategies', async () => {
    const evaluateFn = vi
      .fn()
      .mockResolvedValueOnce(createEmptyResult()) // direct-id fails
      .mockResolvedValueOnce(createDiscoveryResult()); // recordreplay succeeds
    const page = createMockPage({ evaluate: evaluateFn });
    const strategy = createMockStrategy();
    const cache = new ControlProxyCache();
    await discoverControl(
      { id: 'btn1', controlType: 'sap.m.Button' },
      page,
      strategy,
      cache,
      ['direct-id', 'recordreplay'],
      false,
    );
    // Both calls should have preferVisibleControls: false
    for (const call of evaluateFn.mock.calls) {
      const [, args] = call as [unknown, Record<string, unknown>];
      expect(args).toEqual(
        expect.objectContaining({
          preferVisibleControls: false,
        }),
      );
    }
  });
});
