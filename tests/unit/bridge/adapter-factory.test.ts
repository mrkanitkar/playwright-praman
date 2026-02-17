/**
 * Tests for `src/bridge/adapter-factory.ts`.
 *
 * @remarks
 * Validates the factory function that creates the appropriate
 * BridgeAdapter based on configuration.
 */
import { describe, expect, it } from 'vitest';

import { createBridgeAdapter } from '#bridge/adapter-factory.js';
import { ClassicUI5Adapter } from '#bridge/classic-adapter.js';
import { HybridAdapter } from '#bridge/hybrid-adapter.js';
import { WebComponentAdapter } from '#bridge/webcomponent-adapter.js';

describe('createBridgeAdapter', () => {
  it('creates ClassicUI5Adapter by default', () => {
    const adapter = createBridgeAdapter();
    expect(adapter).toBeInstanceOf(ClassicUI5Adapter);
  });

  it('creates ClassicUI5Adapter for "classic" mode', () => {
    const adapter = createBridgeAdapter({ mode: 'classic' });
    expect(adapter).toBeInstanceOf(ClassicUI5Adapter);
  });

  it('creates WebComponentAdapter for "webcomponent" mode', () => {
    const adapter = createBridgeAdapter({ mode: 'webcomponent' });
    expect(adapter).toBeInstanceOf(WebComponentAdapter);
  });

  it('creates HybridAdapter for "hybrid" mode', () => {
    const adapter = createBridgeAdapter({ mode: 'hybrid' });
    expect(adapter).toBeInstanceOf(HybridAdapter);
  });

  it('creates ClassicUI5Adapter for unknown mode', () => {
    const adapter = createBridgeAdapter({ mode: 'unknown' as 'classic' });
    expect(adapter).toBeInstanceOf(ClassicUI5Adapter);
  });
});
