/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/ai/agentic-prompts.ts` — LLM prompt builders.
 *
 * @remarks
 * Uses mocked CapabilityRegistry and RecipeRegistry to exercise all branches
 * in buildSystemPrompt and buildUserPrompt (context truncation, controls
 * truncation, namespace grouping, single-segment names).
 *
 * @module ai
 */

import { describe, expect, it, vi } from 'vitest';

// Mock generated data to keep tests hermetic.
vi.mock('#ai/capability-registry.generated.js', () => ({
  GENERATED_CAPABILITIES: [],
}));
vi.mock('#ai/recipe-registry.generated.js', () => ({
  GENERATED_RECIPES: [],
}));

import { buildSystemPrompt, buildUserPrompt, MAX_CONTEXT_CONTROLS } from '#ai/agentic-prompts.js';
import { CapabilityRegistry } from '#ai/capability-registry.js';
import { RecipeRegistry } from '#ai/recipe-registry.js';
import type { PageContext } from '#ai/types.js';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeCapabilityRegistry(
  entries: { qualifiedName: string; name: string; description: string; priority: string }[],
): CapabilityRegistry {
  const registry = new CapabilityRegistry();
  const listSpy = vi.spyOn(registry, 'list');
  listSpy.mockReturnValue(
    entries.map((e, i) => ({
      id: `UI5-TEST-${String(i).padStart(3, '0')}`,
      qualifiedName: e.qualifiedName,
      name: e.name,
      description: e.description,
      priority: e.priority as 'fixture' | 'namespace',
      category: 'ui5' as const,
      usageExample: `await ${e.qualifiedName}();`,
      registryVersion: 1 as const,
    })),
  );
  return registry;
}

function makeRecipeRegistry(recipes: { pattern: string }[]): RecipeRegistry {
  const registry = new RecipeRegistry();
  const topSpy = vi.spyOn(registry, 'getTopRecipes');
  topSpy.mockReturnValue(
    recipes.map((r, i) => ({
      id: `recipe-test-${String(i)}`,
      name: 'test recipe',
      description: 'A test recipe for unit testing',
      domain: 'testing',
      priority: 'essential' as const,
      capabilities: ['UI5-TEST-001'],
      pattern: r.pattern,
    })),
  );
  return registry;
}

function makePageContext(controlCount: number): PageContext {
  return {
    url: 'https://example.com/fiori',
    ui5Version: '1.120.0',
    controls: Array.from({ length: controlCount }, (_, i) => ({
      id: `ctrl-${String(i)}`,
      controlType: 'sap.m.Button',
      category: 'interactive' as const,
      visible: true,
    })),
    formFields: [],
    buttons: [],
    tables: [],
    navigationElements: [],
    timestamp: '2026-01-01T00:00:00Z',
  };
}

// ── buildSystemPrompt ─────────────────────────────────────────────────────

describe('buildSystemPrompt', () => {
  it('includes capability entries grouped by namespace', () => {
    const caps = makeCapabilityRegistry([
      {
        qualifiedName: 'ui5.table.getRows',
        name: 'getRows',
        description: 'Get rows',
        priority: 'fixture',
      },
      {
        qualifiedName: 'ui5.table.clickRow',
        name: 'clickRow',
        description: 'Click row',
        priority: 'namespace',
      },
      {
        qualifiedName: 'ui5.dialog.confirm',
        name: 'confirm',
        description: 'Confirm dialog',
        priority: 'fixture',
      },
    ]);
    const recipes = makeRecipeRegistry([{ pattern: 'await ui5.table.getRows("t1");' }]);

    const result = buildSystemPrompt(caps, recipes);

    expect(result).toContain('## ui5.table');
    expect(result).toContain('## ui5.dialog');
    expect(result).toContain('ui5.table.getRows: Get rows');
    expect(result).toContain('ui5.table.clickRow: Click row');
    expect(result).toContain('ui5.dialog.confirm: Confirm dialog');
  });

  it('filters out non-fixture/namespace priority entries', () => {
    const caps = makeCapabilityRegistry([
      {
        qualifiedName: 'ui5.control',
        name: 'control',
        description: 'Find control',
        priority: 'fixture',
      },
      {
        qualifiedName: 'internal.debug',
        name: 'debug',
        description: 'Debug helper',
        priority: 'internal',
      },
    ]);
    const recipes = makeRecipeRegistry([]);

    const result = buildSystemPrompt(caps, recipes);

    expect(result).toContain('ui5.control: Find control');
    expect(result).not.toContain('internal.debug');
  });

  it('handles single-segment qualifiedName without namespace prefix', () => {
    const caps = makeCapabilityRegistry([
      {
        qualifiedName: 'standalone',
        name: 'standalone',
        description: 'No namespace',
        priority: 'fixture',
      },
    ]);
    const recipes = makeRecipeRegistry([]);

    const result = buildSystemPrompt(caps, recipes);

    expect(result).toContain('## standalone');
    expect(result).toContain('standalone: No namespace');
  });

  it('includes recipe patterns', () => {
    const caps = makeCapabilityRegistry([]);
    const recipes = makeRecipeRegistry([
      { pattern: 'await ui5.table.getRows("t1");' },
      { pattern: 'await ui5.dialog.confirm();' },
    ]);

    const result = buildSystemPrompt(caps, recipes);

    expect(result).toContain('await ui5.table.getRows("t1");');
    expect(result).toContain('await ui5.dialog.confirm();');
  });

  it('includes generation rules', () => {
    const caps = makeCapabilityRegistry([]);
    const recipes = makeRecipeRegistry([]);

    const result = buildSystemPrompt(caps, recipes);

    expect(result).toContain("Import from 'playwright-praman'");
    expect(result).toContain('Use async/await');
    expect(result).toContain('Respond with JSON');
  });
});

// ── buildUserPrompt ───────────────────────────────────────────────────────

describe('buildUserPrompt', () => {
  it('includes page context JSON and scenario', () => {
    const ctx = makePageContext(2);
    const result = buildUserPrompt(ctx, 'Create a purchase order');

    expect(result).toContain('Page context:');
    expect(result).toContain('"url": "https://example.com/fiori"');
    expect(result).toContain('Create a purchase order');
    expect(result).toContain('Respond with JSON');
  });

  it('truncates controls beyond MAX_CONTEXT_CONTROLS', () => {
    const ctx = makePageContext(MAX_CONTEXT_CONTROLS + 50);
    const result = buildUserPrompt(ctx, 'Test scenario');

    // Should contain exactly MAX_CONTEXT_CONTROLS entries
    const idMatches = result.match(/"id":\s*"ctrl-/g) ?? [];
    expect(idMatches.length).toBeGreaterThan(0);
    expect(idMatches.length).toBeLessThanOrEqual(MAX_CONTEXT_CONTROLS);

    // Original context should not have been mutated
    expect(ctx.controls).toHaveLength(MAX_CONTEXT_CONTROLS + 50);
  });

  it('truncates JSON beyond MAX_CONTEXT_CHARS', () => {
    // Create a context with enough controls to exceed MAX_CONTEXT_CHARS
    // Each control JSON is ~100 chars, so we need ~500+ to exceed 50k
    const ctx = makePageContext(MAX_CONTEXT_CONTROLS);
    // Override controls with large payloads to force char truncation
    const largeCtx: PageContext = {
      ...ctx,
      controls: Array.from({ length: MAX_CONTEXT_CONTROLS }, (_, i) => ({
        id: `ctrl-${'x'.repeat(200)}-${String(i)}`,
        controlType: 'sap.m.Button' + 'x'.repeat(200),
        category: 'interactive' as const,
        visible: true,
      })),
    };

    const result = buildUserPrompt(largeCtx, 'Test');

    expect(result).toContain('... (truncated)');
  });

  it('does not truncate small contexts', () => {
    const ctx = makePageContext(3);
    const result = buildUserPrompt(ctx, 'Small test');

    expect(result).not.toContain('... (truncated)');
    expect(result).toContain('ctrl-0');
    expect(result).toContain('ctrl-1');
    expect(result).toContain('ctrl-2');
  });
});
