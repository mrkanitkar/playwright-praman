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

  // ── Method filter ──────────────────────────────────────────────────
  it('exports isMethodAllowed', () => {
    expect(proxy.isMethodAllowed).toBeTypeOf('function');
  });

  it('exports extractAllowedMethods', () => {
    expect(proxy.extractAllowedMethods).toBeTypeOf('function');
  });
});
