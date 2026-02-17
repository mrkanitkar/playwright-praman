/**
 * Tests for `src/proxy/ui5-object-cache.ts`.
 *
 * @remarks
 * Validates UUID-keyed cache for UI5Object instances with TTL + LRU.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockBridgePage } from '../../helpers/mock-page.js';

import { UI5ObjectCache } from '#proxy/ui5-object-cache.js';
import { UI5Object } from '#proxy/ui5-object.js';

function createTestObject(uuid: string, type = 'sap.ui.model.json.JSONModel'): UI5Object {
  return UI5Object.create({ uuid, type, page: createMockBridgePage() });
}

describe('UI5ObjectCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores and retrieves by UUID', () => {
    const cache = new UI5ObjectCache();
    const obj = createTestObject('uuid-1');
    cache.set('uuid-1', obj);
    expect(cache.get('uuid-1')).toBe(obj);
  });

  it('returns undefined for cache miss', () => {
    const cache = new UI5ObjectCache();
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('tracks size correctly', () => {
    const cache = new UI5ObjectCache();
    expect(cache.size).toBe(0);
    cache.set('a', createTestObject('a'));
    expect(cache.size).toBe(1);
    cache.set('b', createTestObject('b'));
    expect(cache.size).toBe(2);
  });

  it('deletes entries', () => {
    const cache = new UI5ObjectCache();
    cache.set('a', createTestObject('a'));
    expect(cache.delete('a')).toBe(true);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('delete returns false for missing entry', () => {
    const cache = new UI5ObjectCache();
    expect(cache.delete('nope')).toBe(false);
  });

  it('cleanup removes expired entries', () => {
    const cache = new UI5ObjectCache({ ttlMs: 1000 });
    cache.set('a', createTestObject('a'));
    cache.set('b', createTestObject('b'));
    vi.advanceTimersByTime(1500);
    const removed = cache.cleanup();
    expect(removed).toBe(2);
    expect(cache.size).toBe(0);
  });

  it('cleanup keeps non-expired entries', () => {
    const cache = new UI5ObjectCache({ ttlMs: 5000 });
    cache.set('a', createTestObject('a'));
    vi.advanceTimersByTime(1000);
    cache.set('b', createTestObject('b'));
    vi.advanceTimersByTime(4500);
    const removed = cache.cleanup();
    expect(removed).toBe(1); // 'a' expired, 'b' still valid
    expect(cache.get('b')).toBeDefined();
  });

  it('evicts oldest when maxSize exceeded', () => {
    const cache = new UI5ObjectCache({ maxSize: 2 });
    cache.set('a', createTestObject('a'));
    cache.set('b', createTestObject('b'));
    cache.set('c', createTestObject('c'));
    expect(cache.size).toBe(2);
    expect(cache.get('a')).toBeUndefined();
  });

  it('clear removes all entries', () => {
    const cache = new UI5ObjectCache();
    cache.set('a', createTestObject('a'));
    cache.set('b', createTestObject('b'));
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
