/**
 * Tests for `src/bridge/index.ts` barrel.
 *
 * @remarks
 * Validates that all public bridge module exports are accessible
 * through the barrel file.
 */
import { describe, expect, it } from 'vitest';

import * as bridge from '#bridge/index.js';

describe('bridge barrel', () => {
  // ── Adapter types & factory ────────────────────────────────────────
  it('exports createBridgeAdapter', () => {
    expect(bridge.createBridgeAdapter).toBeTypeOf('function');
  });

  it('exports ClassicUI5Adapter', () => {
    expect(bridge.ClassicUI5Adapter).toBeTypeOf('function');
  });

  it('exports HybridAdapter', () => {
    expect(bridge.HybridAdapter).toBeTypeOf('function');
  });

  it('exports WebComponentAdapter', () => {
    expect(bridge.WebComponentAdapter).toBeTypeOf('function');
  });

  // ── Injection ──────────────────────────────────────────────────────
  it('exports isBridgeReady', () => {
    expect(bridge.isBridgeReady).toBeTypeOf('function');
  });

  it('exports injectBridge', () => {
    expect(bridge.injectBridge).toBeTypeOf('function');
  });

  it('exports ensureBridgeInjected', () => {
    expect(bridge.ensureBridgeInjected).toBeTypeOf('function');
  });

  it('exports waitForBridgeReady', () => {
    expect(bridge.waitForBridgeReady).toBeTypeOf('function');
  });

  // ── Interaction strategies ─────────────────────────────────────────
  it('exports createInteractionStrategy', () => {
    expect(bridge.createInteractionStrategy).toBeTypeOf('function');
  });

  it('exports UI5NativeStrategy', () => {
    expect(bridge.UI5NativeStrategy).toBeTypeOf('function');
  });

  it('exports DomFirstStrategy', () => {
    expect(bridge.DomFirstStrategy).toBeTypeOf('function');
  });

  it('exports Opa5Strategy', () => {
    expect(bridge.Opa5Strategy).toBeTypeOf('function');
  });

  // ── Method blacklist ───────────────────────────────────────────────
  it('exports METHOD_BLACKLIST', () => {
    expect(bridge.METHOD_BLACKLIST).toBeInstanceOf(Set);
  });

  it('exports isBlacklisted', () => {
    expect(bridge.isBlacklisted).toBeTypeOf('function');
  });

  // ── Bridge constants ──────────────────────────────────────────────
  it('exports BRIDGE_GLOBALS', () => {
    expect(bridge.BRIDGE_GLOBALS).toBeDefined();
    expect(bridge.BRIDGE_GLOBALS.NAMESPACE).toBeTypeOf('string');
  });

  it('exports BRIDGE_TIMEOUTS', () => {
    expect(bridge.BRIDGE_TIMEOUTS).toBeDefined();
  });

  it('exports XHR_IGNORE_PATTERNS', () => {
    expect(bridge.XHR_IGNORE_PATTERNS).toBeInstanceOf(Array);
  });
});
