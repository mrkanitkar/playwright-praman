/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/proxy/cache.ts`.
 *
 * @remarks
 * Validates the ControlProxyCache with LRU eviction and RegExp-safe keys.
 */
import { describe, expect, it } from 'vitest';

import { createMockUI5Control } from '../../helpers/mock-ui5-control.js';

import { ControlProxyCache } from '#proxy/cache.js';

describe('ControlProxyCache', () => {
  it('stores and retrieves by selector', () => {
    const cache = new ControlProxyCache();
    const control = createMockUI5Control({ id: 'btn1', controlType: 'sap.m.Button' });
    const selector = { id: 'btn1' };
    cache.set(selector, control);
    expect(cache.get(selector)).toBe(control);
  });

  it('returns undefined for cache miss', () => {
    const cache = new ControlProxyCache();
    expect(cache.get({ id: 'nonexistent' })).toBeUndefined();
  });

  it('tracks size correctly', () => {
    const cache = new ControlProxyCache();
    expect(cache.size).toBe(0);
    cache.set({ id: 'a' }, createMockUI5Control({ id: 'a' }));
    expect(cache.size).toBe(1);
    cache.set({ id: 'b' }, createMockUI5Control({ id: 'b' }));
    expect(cache.size).toBe(2);
  });

  it('invalidates a cached entry', () => {
    const cache = new ControlProxyCache();
    const selector = { id: 'btn1' };
    cache.set(selector, createMockUI5Control({ id: 'btn1' }));
    expect(cache.invalidate(selector)).toBe(true);
    expect(cache.get(selector)).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('invalidate returns false for missing entry', () => {
    const cache = new ControlProxyCache();
    expect(cache.invalidate({ id: 'nope' })).toBe(false);
  });

  it('clears all entries', () => {
    const cache = new ControlProxyCache();
    cache.set({ id: 'a' }, createMockUI5Control({ id: 'a' }));
    cache.set({ id: 'b' }, createMockUI5Control({ id: 'b' }));
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get({ id: 'a' })).toBeUndefined();
  });

  it('handles RegExp id selectors', () => {
    const cache = new ControlProxyCache();
    const selector = { id: /btn\d+/ };
    const control = createMockUI5Control({ id: 'btn1' });
    cache.set(selector, control);
    expect(cache.get(selector)).toBe(control);
  });

  it('handles controlType-only selectors', () => {
    const cache = new ControlProxyCache();
    const selector = { controlType: 'sap.m.Button' };
    const control = createMockUI5Control();
    cache.set(selector, control);
    expect(cache.get(selector)).toBe(control);
  });

  it('evicts oldest entry when maxSize exceeded', () => {
    const cache = new ControlProxyCache(2);
    cache.set({ id: 'a' }, createMockUI5Control({ id: 'a' }));
    cache.set({ id: 'b' }, createMockUI5Control({ id: 'b' }));
    cache.set({ id: 'c' }, createMockUI5Control({ id: 'c' }));
    expect(cache.size).toBe(2);
    expect(cache.get({ id: 'a' })).toBeUndefined();
    expect(cache.get({ id: 'b' })).toBeDefined();
    expect(cache.get({ id: 'c' })).toBeDefined();
  });

  it('evicts down to maxSize when multiple entries exceed limit', () => {
    const cache = new ControlProxyCache(1);
    cache.set({ id: 'a' }, createMockUI5Control({ id: 'a' }));
    cache.set({ id: 'b' }, createMockUI5Control({ id: 'b' }));
    expect(cache.size).toBe(1);
    expect(cache.get({ id: 'a' })).toBeUndefined();
    expect(cache.get({ id: 'b' })).toBeDefined();
  });

  it('overwrites existing entry with same selector', () => {
    const cache = new ControlProxyCache();
    const selectorA = { id: 'btn1' };
    const selectorB = { id: 'btn1' };
    const old = createMockUI5Control({ id: 'btn1' });
    const updated = createMockUI5Control({ id: 'btn1', controlType: 'sap.m.ToggleButton' });
    cache.set(selectorA, old);
    cache.set(selectorB, updated);
    expect(cache.size).toBe(1);
    expect(cache.get(selectorA)).toBe(updated);
  });
});
