/**
 * Tests for `src/proxy/index.ts` barrel.
 *
 * @remarks
 * Validates that all public proxy module exports are accessible
 * through the barrel file.
 */
import { describe, expect, it } from 'vitest';

import * as proxy from '#proxy/index.js';

describe('proxy barrel', () => {
  // ── Control proxy ──────────────────────────────────────────────────
  it('exports createControlProxy', () => {
    expect(proxy.createControlProxy).toBeTypeOf('function');
  });

  // ── UI5 Object ─────────────────────────────────────────────────────
  it('exports UI5Object', () => {
    expect(proxy.UI5Object).toBeTypeOf('function');
  });

  it('exports createUI5ObjectProxy', () => {
    expect(proxy.createUI5ObjectProxy).toBeTypeOf('function');
  });

  it('exports UI5ObjectCache', () => {
    expect(proxy.UI5ObjectCache).toBeTypeOf('function');
  });

  // ── Cache & discovery ──────────────────────────────────────────────
  it('exports ControlProxyCache', () => {
    expect(proxy.ControlProxyCache).toBeTypeOf('function');
  });

  it('exports discoverControl', () => {
    expect(proxy.discoverControl).toBeTypeOf('function');
  });

  it('exports getDiscoveryPriorities', () => {
    expect(proxy.getDiscoveryPriorities).toBeTypeOf('function');
  });

  // ── Method filter & Playwright API ─────────────────────────────────
  it('exports isMethodAllowed', () => {
    expect(proxy.isMethodAllowed).toBeTypeOf('function');
  });

  it('exports extractAllowedMethods', () => {
    expect(proxy.extractAllowedMethods).toBeTypeOf('function');
  });

  it('exports PLAYWRIGHT_API_METHODS', () => {
    expect(proxy.PLAYWRIGHT_API_METHODS).toBeInstanceOf(Set);
  });

  it('exports isPlaywrightMethod', () => {
    expect(proxy.isPlaywrightMethod).toBeTypeOf('function');
  });

  it('exports routeToInteractionStrategy', () => {
    expect(proxy.routeToInteractionStrategy).toBeTypeOf('function');
  });

  it('exports cssEscapeId', () => {
    expect(proxy.cssEscapeId).toBeTypeOf('function');
  });

  // ── Return handler ─────────────────────────────────────────────────
  it('exports handleBridgeReturn', () => {
    expect(proxy.handleBridgeReturn).toBeTypeOf('function');
  });

  // ── Proxy converter ────────────────────────────────────────────────
  it('exports isControlResult', () => {
    expect(proxy.isControlResult).toBeTypeOf('function');
  });

  it('exports convertToControlProxy', () => {
    expect(proxy.convertToControlProxy).toBeTypeOf('function');
  });

  it('exports convertToObjectProxy', () => {
    expect(proxy.convertToObjectProxy).toBeTypeOf('function');
  });
});
