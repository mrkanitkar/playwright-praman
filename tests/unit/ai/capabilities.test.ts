/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for `src/ai/capabilities.ts` — the consumer-facing singleton.
 *
 * @remarks
 * Verifies that the pre-built `capabilities` object delegates correctly
 * to the underlying `CapabilityRegistry` and exposes all parity methods.
 */
import { describe, expect, it, vi } from 'vitest';

// Mock the generated capabilities to keep tests hermetic (empty seed).
vi.mock('#ai/capability-registry.generated.js', () => ({
  GENERATED_CAPABILITIES: [],
}));

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
      id: 'UI5-UI5-900',
      qualifiedName: 'ui5.testSingleton',
      name: 'testSingleton',
      description: 'Test entry for singleton verification',
      category: 'ui5',
      usageExample: 'test()',
      registryVersion: 1,
      priority: 'fixture',
    });

    expect(capabilities.has('testSingleton')).toBe(true);
    expect(capabilities.findByName('testSingleton')).toBeDefined();
    expect(capabilities.listFixtures().some((e) => e.id === 'UI5-UI5-900')).toBe(true);
  });

  it('exposes forControl() method that searches by control type', () => {
    expect(typeof capabilities.forControl).toBe('function');
    const result = capabilities.forControl('sap.m.Button');
    expect(Array.isArray(result)).toBe(true);
  });

  it('exposes describe() method that returns description or undefined', () => {
    expect(typeof capabilities.describe).toBe('function');
    expect(capabilities.describe('nonExistent')).toBeUndefined();
    expect(capabilities.describe('testSingleton')).toBe('Test entry for singleton verification');
  });

  it('exposes getCategories() method returning category names', () => {
    expect(typeof capabilities.getCategories).toBe('function');
    const cats = capabilities.getCategories();
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThan(0);
  });

  it('exposes byCategory() method returning entries for a category', () => {
    expect(typeof capabilities.byCategory).toBe('function');
    const result = capabilities.byCategory('ui5');
    expect(Array.isArray(result)).toBe(true);
    expect(result.some((e) => e.id === 'UI5-UI5-900')).toBe(true);
  });

  it('exposes get() method that looks up by id', () => {
    expect(typeof capabilities.get).toBe('function');
    expect(capabilities.get('UI5-UI5-900')).toBeDefined();
    expect(capabilities.get('nonexistent-id')).toBeUndefined();
  });

  it('exposes forProvider() method returning formatted string', () => {
    expect(typeof capabilities.forProvider).toBe('function');
    const result = capabilities.forProvider('claude');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
