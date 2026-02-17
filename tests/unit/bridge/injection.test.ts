/**
 * Tests for `src/bridge/injection.ts`.
 *
 * @remarks
 * Validates the lazy bridge injection engine (W14, W19).
 * Uses mock BridgePage to test Node-side injection logic
 * without browser execution.
 */
import { describe, expect, it, vi } from 'vitest';

import { createMockBridgePage } from '../../helpers/mock-page.js';

import { BRIDGE_TIMEOUTS } from '#bridge/bridge-constants.js';
import {
  ensureBridgeInjected,
  injectBridge,
  isBridgeReady,
  waitForBridgeReady,
} from '#bridge/injection.js';

describe('isBridgeReady', () => {
  it('returns false when bridge not injected', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue(false),
    });
    const result = await isBridgeReady(page);
    expect(result).toBe(false);
  });

  it('returns true when bridge is ready', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue(true),
    });
    const result = await isBridgeReady(page);
    expect(result).toBe(true);
  });

  it('calls page.evaluate to check readiness', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue(false),
    });
    await isBridgeReady(page);
    expect(page.evaluate).toHaveBeenCalledOnce();
  });
});

describe('injectBridge', () => {
  it('calls page.waitForFunction for UI5 availability', async () => {
    const page = createMockBridgePage({
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(undefined),
    });
    await injectBridge(page);
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('calls page.evaluate with injection script', async () => {
    const page = createMockBridgePage({
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(undefined),
    });
    await injectBridge(page);
    expect(page.evaluate).toHaveBeenCalled();
  });

  it('waits for bridge readiness after injection', async () => {
    const page = createMockBridgePage({
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(undefined),
    });
    await injectBridge(page);
    // Should call waitForFunction at least twice:
    // 1. Wait for sap.ui.require
    // 2. Wait for __praman_bridge.ready
    expect(page.waitForFunction).toHaveBeenCalledTimes(2);
  });

  it('uses BRIDGE_TIMEOUTS.INJECTION for timeout', async () => {
    const page = createMockBridgePage({
      waitForFunction: vi.fn().mockResolvedValue(undefined),
      evaluate: vi.fn().mockResolvedValue(undefined),
    });
    await injectBridge(page);
    const firstCall = page.waitForFunction.mock.calls[0] as unknown[];
    expect(firstCall[1]).toEqual(expect.objectContaining({ timeout: BRIDGE_TIMEOUTS.INJECTION }));
  });
});

describe('ensureBridgeInjected', () => {
  it('injects bridge on first call', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue(false),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    await ensureBridgeInjected(page);
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('skips injection on second call', async () => {
    const page = createMockBridgePage({
      evaluate: vi.fn().mockResolvedValue(false),
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    await ensureBridgeInjected(page);
    await ensureBridgeInjected(page);
    // waitForFunction called only for the first injection
    expect(page.waitForFunction).toHaveBeenCalledTimes(2);
  });
});

describe('waitForBridgeReady', () => {
  it('calls page.waitForFunction with readiness check', async () => {
    const page = createMockBridgePage({
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    await waitForBridgeReady(page);
    expect(page.waitForFunction).toHaveBeenCalled();
  });

  it('uses default timeout when not specified', async () => {
    const page = createMockBridgePage({
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    await waitForBridgeReady(page);
    const call = page.waitForFunction.mock.calls[0] as unknown[];
    expect(call[1]).toEqual(expect.objectContaining({ timeout: BRIDGE_TIMEOUTS.INJECTION }));
  });

  it('respects custom timeout parameter', async () => {
    const page = createMockBridgePage({
      waitForFunction: vi.fn().mockResolvedValue(undefined),
    });
    await waitForBridgeReady(page, 5000);
    const call = page.waitForFunction.mock.calls[0] as unknown[];
    expect(call[1]).toEqual(expect.objectContaining({ timeout: 5000 }));
  });
});
