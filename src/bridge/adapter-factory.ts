/**
 * Factory for creating bridge adapters based on configuration.
 *
 * @remarks
 * Creates the appropriate BridgeAdapter implementation based on the
 * configured adapter mode: classic (default), webcomponent, or hybrid.
 *
 * @module bridge
 */

import type { BridgeAdapter } from './adapter.js';
import { ClassicUI5Adapter } from './classic-adapter.js';
import { HybridAdapter } from './hybrid-adapter.js';
import { WebComponentAdapter } from './webcomponent-adapter.js';

/**
 * Adapter mode selection.
 */
export type AdapterMode = 'classic' | 'webcomponent' | 'hybrid';

/**
 * Options for creating a bridge adapter.
 */
export interface AdapterFactoryOptions {
  /** Adapter mode (default: 'classic'). */
  readonly mode?: AdapterMode;
}

/**
 * Creates a BridgeAdapter instance based on configuration.
 *
 * @param options - Optional factory options with adapter mode.
 * @returns A concrete BridgeAdapter implementation (not yet initialized).
 *
 * @example
 * ```typescript
 * const adapter = createBridgeAdapter({ mode: 'classic' });
 * await adapter.init(page);
 * ```
 */
export function createBridgeAdapter(options?: AdapterFactoryOptions): BridgeAdapter {
  const mode = options?.mode;
  switch (mode) {
    case 'webcomponent':
      return new WebComponentAdapter();
    case 'hybrid':
      return new HybridAdapter();
    case 'classic':
    case undefined:
    default:
      return new ClassicUI5Adapter();
  }
}
