/**
 * UUID-keyed cache for UI5Object instances with TTL and LRU eviction.
 *
 * @remarks
 * Stores non-control UI5 objects (models, bindings, etc.) by their bridge-
 * assigned UUID. Supports TTL-based expiration and LRU eviction when
 * the maximum size is exceeded.
 *
 * @example
 * ```typescript
 * import { UI5ObjectCache } from '#proxy/ui5-object-cache.js';
 *
 * const cache = new UI5ObjectCache({ ttlMs: 300_000, maxSize: 100 });
 * cache.set('uuid-1', modelObject);
 * const obj = cache.get('uuid-1');
 * cache.cleanup(); // removes expired entries
 * ```
 *
 * @module proxy
 */

import type { UI5Object } from './ui5-object.js';

/** Default TTL in milliseconds (5 minutes). */
const DEFAULT_TTL_MS = 300_000;
/** Default maximum cache size. */
const DEFAULT_MAX_SIZE = 200;

/**
 * Cache entry with timestamp for TTL-based expiration.
 */
interface CacheEntry {
  readonly object: UI5Object;
  readonly storedAt: number;
}

/**
 * Configuration options for UI5ObjectCache.
 */
export interface UI5ObjectCacheOptions {
  /** Time-to-live in milliseconds. Defaults to 300,000 (5 minutes). */
  readonly ttlMs?: number;
  /** Maximum number of entries. Defaults to 200. */
  readonly maxSize?: number;
}

/**
 * Cache for UI5Object instances with TTL and LRU eviction.
 *
 * @example
 * ```typescript
 * const cache = new UI5ObjectCache({ ttlMs: 60_000, maxSize: 50 });
 * cache.set('uuid-1', object);
 * const hit = cache.get('uuid-1');
 * const removed = cache.cleanup();
 * ```
 */
export class UI5ObjectCache {
  private readonly entries = new Map<string, CacheEntry>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  /**
   * Creates a new UI5ObjectCache.
   *
   * @param options - Cache configuration.
   *
   * @example
   * ```typescript
   * const cache = new UI5ObjectCache({ ttlMs: 60_000 });
   * ```
   */
  constructor(options?: UI5ObjectCacheOptions) {
    this.ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
    this.maxSize = options?.maxSize ?? DEFAULT_MAX_SIZE;
  }

  /** Number of cached entries. */
  get size(): number {
    return this.entries.size;
  }

  /**
   * Gets a cached UI5Object by UUID.
   *
   * @param uuid - The object UUID.
   * @returns The cached object, or `undefined` on miss.
   *
   * @example
   * ```typescript
   * const obj = cache.get('uuid-1');
   * ```
   */
  get(uuid: string): UI5Object | undefined {
    const entry = this.entries.get(uuid);
    return entry?.object;
  }

  /**
   * Stores a UI5Object by UUID.
   *
   * @param uuid - The object UUID.
   * @param object - The UI5Object to cache.
   *
   * @example
   * ```typescript
   * cache.set('uuid-1', object);
   * ```
   */
  set(uuid: string, object: UI5Object): void {
    this.entries.delete(uuid);
    this.entries.set(uuid, { object, storedAt: Date.now() });
    this.evictIfNeeded();
  }

  /**
   * Deletes a cached entry by UUID.
   *
   * @param uuid - The UUID to remove.
   * @returns `true` if an entry was removed.
   *
   * @example
   * ```typescript
   * cache.delete('uuid-1');
   * ```
   */
  delete(uuid: string): boolean {
    return this.entries.delete(uuid);
  }

  /**
   * Removes all expired entries.
   *
   * @returns The number of entries removed.
   *
   * @example
   * ```typescript
   * const removed = cache.cleanup();
   * ```
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [uuid, entry] of this.entries) {
      if (now - entry.storedAt > this.ttlMs) {
        this.entries.delete(uuid);
        removed++;
      }
    }
    return removed;
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
    this.entries.clear();
  }

  /** Evicts the oldest entry if cache exceeds maxSize. */
  private evictIfNeeded(): void {
    while (this.entries.size > this.maxSize) {
      const oldestKey = this.entries.keys().next();
      if (oldestKey.done !== true) {
        this.entries.delete(oldestKey.value);
      }
    }
  }
}
