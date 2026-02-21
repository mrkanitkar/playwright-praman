/**
 * Unit tests for `src/ai/capabilities.ts` — the consumer-facing singleton.
 *
 * @remarks
 * Verifies that the pre-built `capabilities` object delegates correctly
 * to the underlying `CapabilityRegistry` and exposes all parity methods.
 */
import { describe, expect, it } from 'vitest';

import { capabilities } from '#ai/capabilities.js';

// ── Tests ──────────────────────────────────────────────────────────────────

describe('capabilities singleton', () => {
  it('exposes list() method', () => {
    expect(typeof capabilities.list).toBe('function');
    expect(Array.isArray(capabilities.list())).toBe(true);
  });

  it('exposes listByPriority() method', () => {
    expect(typeof capabilities.listByPriority).toBe('function');
    expect(Array.isArray(capabilities.listByPriority('fixture'))).toBe(true);
  });

  it('exposes listFixtures() method', () => {
    expect(typeof capabilities.listFixtures).toBe('function');
    expect(Array.isArray(capabilities.listFixtures())).toBe(true);
  });

  it('exposes has() method', () => {
    expect(typeof capabilities.has).toBe('function');
    expect(capabilities.has('nonExistent')).toBe(false);
  });

  it('exposes find() method', () => {
    expect(typeof capabilities.find).toBe('function');
    expect(Array.isArray(capabilities.find('test'))).toBe(true);
  });

  it('exposes findByName() method', () => {
    expect(typeof capabilities.findByName).toBe('function');
    expect(capabilities.findByName('nonExistent')).toBeUndefined();
  });

  it('exposes getStatistics() method', () => {
    expect(typeof capabilities.getStatistics).toBe('function');
    const stats = capabilities.getStatistics();
    expect(stats).toHaveProperty('totalMethods');
    expect(stats).toHaveProperty('categories');
    expect(stats).toHaveProperty('generatedAt');
    expect(stats).toHaveProperty('version');
    expect(stats).toHaveProperty('byPriority');
  });

  it('exposes toJSON() method', () => {
    expect(typeof capabilities.toJSON).toBe('function');
    const json = capabilities.toJSON();
    expect(json).toHaveProperty('name', 'playwright-praman');
    expect(json).toHaveProperty('version');
    expect(json).toHaveProperty('fixtures');
    expect(json).toHaveProperty('methods');
  });

  it('exposes forAI() method', () => {
    expect(typeof capabilities.forAI).toBe('function');
    const ai = capabilities.forAI();
    expect(ai).toHaveProperty('name', 'playwright-praman');
    expect(ai).toHaveProperty('fixtures');
    expect(ai).toHaveProperty('methods');
  });

  it('exposes the underlying registry for advanced usage', () => {
    expect(capabilities.registry).toBeDefined();
    expect(typeof capabilities.registry.register).toBe('function');
  });

  it('delegates register via the exposed registry', () => {
    // Register a test entry via the exposed registry
    capabilities.registry.register({
      id: 'test-singleton-entry',
      name: 'testSingleton',
      description: 'Test entry for singleton verification',
      category: 'test',
      usage_example: 'test()',
      registryVersion: 1,
      priority: 'fixture',
    });

    expect(capabilities.has('testSingleton')).toBe(true);
    expect(capabilities.findByName('testSingleton')).toBeDefined();
    expect(capabilities.listFixtures().some((e) => e.id === 'test-singleton-entry')).toBe(true);
  });
});
