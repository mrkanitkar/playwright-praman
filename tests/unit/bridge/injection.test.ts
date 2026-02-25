/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/injection.ts`.
 *
 * @remarks
 * Validates the lazy and eager bridge injection engine (W14, W19).
 * Uses mock Page/BrowserContext to test Node-side injection logic
 * without browser execution.
 */
import type { BrowserContext, Page } from '@playwright/test';
import { describe, expect, it, vi } from 'vitest';

import { BRIDGE_TIMEOUTS } from '#bridge/bridge-constants.js';
import {
  ensureBridgeInjected,
  injectBridge,
  injectBridgeEager,
  isBridgeReady,
  resetPageInjection,
  waitForBridgeReady,
} from '#bridge/injection.js';

describe('isBridgeReady', () => {
  it('returns false when bridge not injected', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(false);
    const page = {
      evaluate: evaluateFn,
      waitForFunction: vi.fn(),
    } as unknown as Page;
    const result = await isBridgeReady(page);
    expect(result).toBe(false);
  });

  it('returns true when bridge is ready', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(true);
    const page = {
      evaluate: evaluateFn,
      waitForFunction: vi.fn(),
    } as unknown as Page;
    const result = await isBridgeReady(page);
    expect(result).toBe(true);
  });

  it('calls page.evaluate to check readiness', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(false);
    const page = {
      evaluate: evaluateFn,
      waitForFunction: vi.fn(),
    } as unknown as Page;
    await isBridgeReady(page);
    expect(evaluateFn).toHaveBeenCalledOnce();
  });
});

describe('injectBridge', () => {
  it('calls page.waitForFunction for UI5 availability', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      waitForFunction: waitForFunctionFn,
      evaluate: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    await injectBridge(page);
    expect(waitForFunctionFn).toHaveBeenCalled();
  });

  it('calls page.evaluate with injection script', async () => {
    const evaluateFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      evaluate: evaluateFn,
    } as unknown as Page;
    await injectBridge(page);
    expect(evaluateFn).toHaveBeenCalled();
  });

  it('waits for bridge readiness after injection', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      waitForFunction: waitForFunctionFn,
      evaluate: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    await injectBridge(page);
    // Should call waitForFunction at least twice:
    // 1. Wait for sap.ui.require
    // 2. Wait for __praman_bridge.ready
    expect(waitForFunctionFn).toHaveBeenCalledTimes(2);
  });

  it('uses BRIDGE_TIMEOUTS.INJECTION for timeout', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      waitForFunction: waitForFunctionFn,
      evaluate: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    await injectBridge(page);
    const firstCall = waitForFunctionFn.mock.calls[0] as unknown[];
    expect(firstCall[1]).toEqual(expect.objectContaining({ timeout: BRIDGE_TIMEOUTS.INJECTION }));
  });
});

describe('ensureBridgeInjected', () => {
  it('injects bridge on first call', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      evaluate: vi.fn().mockResolvedValue(false),
      waitForFunction: waitForFunctionFn,
    } as unknown as Page;
    await ensureBridgeInjected(page);
    expect(waitForFunctionFn).toHaveBeenCalled();
  });

  it('skips injection on second call', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      evaluate: vi.fn().mockResolvedValue(false),
      waitForFunction: waitForFunctionFn,
    } as unknown as Page;
    await ensureBridgeInjected(page);
    await ensureBridgeInjected(page);
    // waitForFunction called only for the first injection
    expect(waitForFunctionFn).toHaveBeenCalledTimes(2);
  });
});

describe('waitForBridgeReady', () => {
  it('calls page.waitForFunction with readiness check', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      evaluate: vi.fn(),
      waitForFunction: waitForFunctionFn,
    } as unknown as Page;
    await waitForBridgeReady(page);
    expect(waitForFunctionFn).toHaveBeenCalled();
  });

  it('uses default timeout when not specified', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      evaluate: vi.fn(),
      waitForFunction: waitForFunctionFn,
    } as unknown as Page;
    await waitForBridgeReady(page);
    const call = waitForFunctionFn.mock.calls[0] as unknown[];
    expect(call[1]).toEqual(expect.objectContaining({ timeout: BRIDGE_TIMEOUTS.INJECTION }));
  });

  it('respects custom timeout parameter', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      evaluate: vi.fn(),
      waitForFunction: waitForFunctionFn,
    } as unknown as Page;
    await waitForBridgeReady(page, 5000);
    const call = waitForFunctionFn.mock.calls[0] as unknown[];
    expect(call[1]).toEqual(expect.objectContaining({ timeout: 5000 }));
  });
});

describe('resetPageInjection', () => {
  it('clears injection tracking so re-injection occurs', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForFunction: waitForFunctionFn,
    } as unknown as Page;
    // First injection
    await ensureBridgeInjected(page);
    const callsAfterFirst = waitForFunctionFn.mock.calls.length;

    // Second call without reset — should skip injection
    await ensureBridgeInjected(page);
    expect(waitForFunctionFn.mock.calls).toHaveLength(callsAfterFirst);

    // Reset and call again — should re-inject
    resetPageInjection(page);
    await ensureBridgeInjected(page);
    expect(waitForFunctionFn.mock.calls.length).toBeGreaterThan(callsAfterFirst);
  });

  it('is a no-op on a page that was never injected', () => {
    const page = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;
    // Should not throw
    expect(() => {
      resetPageInjection(page);
    }).not.toThrow();
  });

  it('allows re-injection after reset', async () => {
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForFunction: waitForFunctionFn,
    } as unknown as Page;
    await ensureBridgeInjected(page);
    resetPageInjection(page);
    await ensureBridgeInjected(page);
    // waitForFunction called 4 times: 2 for first inject, 2 for re-inject
    expect(waitForFunctionFn).toHaveBeenCalledTimes(4);
  });
});

describe('injectBridgeEager', () => {
  it('calls addInitScript on a Page target', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page);

    expect(addInitScriptFn).toHaveBeenCalledOnce();
  });

  it('calls addInitScript on a BrowserContext target', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const context = {
      addInitScript: addInitScriptFn,
    } as unknown as BrowserContext;

    await injectBridgeEager(context);

    expect(addInitScriptFn).toHaveBeenCalledOnce();
  });

  it('includes the bridge injection script in the eager script', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page);

    const scriptArg = addInitScriptFn.mock.calls[0]?.[0] as string;
    // Should contain bridge namespace from the injection script
    expect(scriptArg).toContain('__praman_bridge');
    expect(scriptArg).toContain('__praman_ready');
  });

  it('includes the polling/waiting logic for sap.ui.require', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page);

    const scriptArg = addInitScriptFn.mock.calls[0]?.[0] as string;
    // Should contain the polling wrapper
    expect(scriptArg).toContain('waitForUI5AndInject');
    expect(scriptArg).toContain('tryInject');
    expect(scriptArg).toContain('sap.ui.require');
    expect(scriptArg).toContain('setTimeout');
  });

  it('uses BRIDGE_TIMEOUTS.POLLING_INTERVAL for retry delay', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page);

    const scriptArg = addInitScriptFn.mock.calls[0]?.[0] as string;
    expect(scriptArg).toContain(
      `setTimeout(tryInject, ${String(BRIDGE_TIMEOUTS.POLLING_INTERVAL)})`,
    );
  });

  it('includes a Date.now() wall-clock timeout guard', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page);

    const scriptArg = addInitScriptFn.mock.calls[0]?.[0] as string;
    expect(scriptArg).toContain('Date.now()');
    expect(scriptArg).toContain('deadline');
  });

  it('uses BRIDGE_TIMEOUTS.INJECTION as the timeout deadline', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page);

    const scriptArg = addInitScriptFn.mock.calls[0]?.[0] as string;
    expect(scriptArg).toContain(`Date.now() + ${String(BRIDGE_TIMEOUTS.INJECTION)}`);
  });

  it('emits console.warn on timeout', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page);

    const scriptArg = addInitScriptFn.mock.calls[0]?.[0] as string;
    expect(scriptArg).toContain('console.warn');
    expect(scriptArg).toContain('[praman] Eager bridge injection timed out');
  });

  it('stops polling after deadline is reached (no further setTimeout)', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page);

    const scriptArg = addInitScriptFn.mock.calls[0]?.[0] as string;
    // The timeout branch should warn and NOT call setTimeout
    // Verify structure: else if (Date.now() > deadline) { console.warn... } else { setTimeout... }
    expect(scriptArg).toMatch(/Date\.now\(\)\s*>\s*deadline/);
    expect(scriptArg).toMatch(/else\s+if\s*\(Date\.now\(\)\s*>\s*deadline\)/);
  });

  it('is idempotent — skips injection on second call for same target', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page);
    await injectBridgeEager(page);

    expect(addInitScriptFn).toHaveBeenCalledOnce();
  });

  it('injects separately for different targets', async () => {
    const addInitScriptFn1 = vi.fn().mockResolvedValue(undefined);
    const addInitScriptFn2 = vi.fn().mockResolvedValue(undefined);

    const page1 = {
      addInitScript: addInitScriptFn1,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    const page2 = {
      addInitScript: addInitScriptFn2,
      evaluate: vi.fn(),
      waitForFunction: vi.fn(),
    } as unknown as Page;

    await injectBridgeEager(page1);
    await injectBridgeEager(page2);

    expect(addInitScriptFn1).toHaveBeenCalledOnce();
    expect(addInitScriptFn2).toHaveBeenCalledOnce();
  });
});

describe('eager and lazy injection interaction', () => {
  it('ensureBridgeInjected still performs lazy injection after eager injection', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const evaluateFn = vi.fn().mockResolvedValue(undefined);

    const page = {
      addInitScript: addInitScriptFn,
      evaluate: evaluateFn,
      waitForFunction: waitForFunctionFn,
    } as unknown as Page;

    // Eager injection first
    await injectBridgeEager(page);
    expect(addInitScriptFn).toHaveBeenCalledOnce();

    // Lazy injection via ensureBridgeInjected — should still run
    // because eager and lazy tracking are separate
    await ensureBridgeInjected(page);
    expect(waitForFunctionFn).toHaveBeenCalled();
  });

  it('eager injection does not interfere with lazy injection tracking', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const waitForFunctionFn = vi.fn().mockResolvedValue(undefined);
    const evaluateFn = vi.fn().mockResolvedValue(undefined);

    const page = {
      addInitScript: addInitScriptFn,
      evaluate: evaluateFn,
      waitForFunction: waitForFunctionFn,
    } as unknown as Page;

    // Eager injection
    await injectBridgeEager(page);

    // Lazy injection — first call should inject
    await ensureBridgeInjected(page);
    const callsAfterFirst = waitForFunctionFn.mock.calls.length;

    // Second lazy call — should skip (tracked by injectedPages)
    await ensureBridgeInjected(page);
    expect(waitForFunctionFn.mock.calls).toHaveLength(callsAfterFirst);
  });

  it('resetPageInjection does not affect eager injection tracking', async () => {
    const addInitScriptFn = vi.fn().mockResolvedValue(undefined);
    const page = {
      addInitScript: addInitScriptFn,
      evaluate: vi.fn().mockResolvedValue(undefined),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    } as unknown as Page;

    await injectBridgeEager(page);
    resetPageInjection(page);

    // Eager injection should still be tracked as done
    await injectBridgeEager(page);
    expect(addInitScriptFn).toHaveBeenCalledOnce();
  });
});
