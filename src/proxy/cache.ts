/**
 * Control proxy cache with LRU eviction and RegExp-safe keys.
 *
 * @remarks
 * Caches discovered control proxies by their serialized selector key.
 * Uses `serializeUI5Selector()` from Phase 1 for stable hashing —
 * RegExp `id` values are converted to `{ source, flags }` for reproducible keys.
 *
 * @example
 * ```typescript
 * import { ControlProxyCache } from '#proxy/cache.js';
 *
 * const cache = new ControlProxyCache(100);
 * cache.set({ id: 'btn1' }, proxy);
 * const hit = cache.get({ id: 'btn1' });
 * ```
 *
 * @module proxy
 */

import { serializeUI5Selector } from '../selectors/selector-parser.js';

import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';

/** Default maximum cache size. */
const DEFAULT_MAX_SIZE = 200;

/**
 * LRU cache for control proxies keyed by serialized selectors.
 *
 * @example
 * ```typescript
 * const cache = new ControlProxyCache(50);
 * cache.set(selector, proxy);
 * cache.get(selector); // proxy or undefined
 * ```
 */
export class ControlProxyCache {
  private readonly cache = new Map<string, UI5ControlBase>();
  private readonly maxSize: number;

  /**
   * Creates a new cache with the given maximum size.
   *
   * @param maxSize - Maximum number of entries before LRU eviction. Defaults to 200.
   *
   * @example
   * ```typescript
   * const cache = new ControlProxyCache(100);
   * ```
   */
  constructor(maxSize: number = DEFAULT_MAX_SIZE) {
    this.maxSize = maxSize;
  }

  /** Number of cached entries. */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Gets a cached proxy for the given selector.
   *
   * @param selector - The UI5Selector to look up.
   * @returns The cached proxy, or `undefined` on miss.
   *
   * @example
   * ```typescript
   * const proxy = cache.get({ id: 'btn1' });
   * ```
   */
  get(selector: UI5Selector): UI5ControlBase | undefined {
    const key = serializeUI5Selector(selector);
    return this.cache.get(key);
  }

  /**
   * Stores a proxy for the given selector.
   *
   * @param selector - The selector key.
   * @param proxy - The control proxy to cache.
   *
   * @example
   * ```typescript
   * cache.set({ id: 'btn1' }, proxy);
   * ```
   */
  set(selector: UI5Selector, proxy: UI5ControlBase): void {
    const key = serializeUI5Selector(selector);
    // Delete first to reset insertion order (LRU)
    this.cache.delete(key);
    this.cache.set(key, proxy);
    this.evictIfNeeded();
  }

  /**
   * Removes a cached entry for the given selector.
   *
   * @param selector - The selector to invalidate.
   * @returns `true` if an entry was removed, `false` otherwise.
   *
   * @example
   * ```typescript
   * cache.invalidate({ id: 'btn1' }); // true if was cached
   * ```
   */
  invalidate(selector: UI5Selector): boolean {
    const key = serializeUI5Selector(selector);
    return this.cache.delete(key);
  }

  /**
   * Removes all cached entries.
   *
   * @example
   * ```typescript
   * cache.clear();
   * ```
   */
  clear(): void {
    this.cache.clear();
  }

  /** Evicts the oldest entry if cache exceeds maxSize. */
  private evictIfNeeded(): void {
    while (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next();
      if (oldestKey.done !== true) {
        this.cache.delete(oldestKey.value);
      }
    }
  }
}
