#!/usr/bin/env tsx
/**
 * Generate capability and recipe registries from YAML master data.
 *
 * @remarks
 * Reads `capabilities.yaml` and `recipes.yaml`, validates via Zod schemas,
 * and writes 4 output files:
 *
 * 1. `src/ai/capability-registry.generated.ts`
 * 2. `src/ai/recipe-registry.generated.ts`
 * 3. `docs/capabilities.md`
 * 4. `skills/playwright-praman-sap-testing/capabilities-reference.md`
 *
 * @see capabilities.yaml
 * @see recipes.yaml
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { CapabilitiesYamlSchema } from '../src/ai/schemas/capability.schema.js';
import { RecipesYamlSchema } from '../src/ai/schemas/recipe.schema.js';
import type { CapabilityEntry } from '../src/ai/schemas/capability.schema.js';
import type { CapabilitiesYaml } from '../src/ai/schemas/capability.schema.js';
import type { RecipeEntry } from '../src/ai/schemas/recipe.schema.js';
import type { RecipesYaml } from '../src/ai/schemas/recipe.schema.js';

const ROOT = resolve(import.meta.dirname ?? '.', '..');

/* ── Paths ────────────────────────────────────────────────────────────────── */

const CAPABILITIES_YAML = resolve(ROOT, 'capabilities.yaml');
const RECIPES_YAML = resolve(ROOT, 'recipes.yaml');
const CAPABILITY_REGISTRY_TS = resolve(ROOT, 'src/ai/capability-registry.generated.ts');
const RECIPE_REGISTRY_TS = resolve(ROOT, 'src/ai/recipe-registry.generated.ts');
const CAPABILITIES_MD = resolve(ROOT, 'docs/capabilities.md');
const CAPABILITIES_SKILL_MD = resolve(
  ROOT,
  'skills/playwright-praman-sap-testing/capabilities-reference.md',
);

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const today = new Date().toISOString().split('T')[0];

/**
 * Trim trailing whitespace from `usageExample` values.
 *
 * @remarks
 * YAML block scalars (`|` or `>`) append a trailing newline that must be
 * removed before embedding in TypeScript source.
 */
function trimExamples(entries: readonly CapabilityEntry[]): CapabilityEntry[] {
  return entries.map((entry) => ({
    ...entry,
    usageExample: entry.usageExample.trim(),
  }));
}

/**
 * Trim trailing whitespace from recipe `pattern` values.
 */
function trimPatterns(entries: readonly RecipeEntry[]): RecipeEntry[] {
  return entries.map((entry) => ({
    ...entry,
    description: entry.description.trim(),
    pattern: entry.pattern.trim(),
  }));
}

/**
 * Serialize a capability entry to JSON, omitting undefined optional fields.
 */
function serializeEntry(entry: CapabilityEntry): string {
  const ordered: Record<string, unknown> = {
    id: entry.id,
    qualifiedName: entry.qualifiedName,
    name: entry.name,
    description: entry.description,
    category: entry.category,
    priority: entry.priority,
    usageExample: entry.usageExample,
    registryVersion: entry.registryVersion,
  };
  if (entry.intent !== undefined) ordered['intent'] = entry.intent;
  if (entry.sapModule !== undefined) ordered['sapModule'] = entry.sapModule;
  if (entry.controlTypes !== undefined) ordered['controlTypes'] = entry.controlTypes;
  if (entry.async !== undefined) ordered['async'] = entry.async;
  return JSON.stringify(ordered, null, 2);
}

/**
 * Ensure the parent directory of a file path exists.
 */
async function ensureDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

/* ── Generators ───────────────────────────────────────────────────────────── */

/**
 * Generate `capability-registry.generated.ts`.
 */
function generateCapabilityRegistryTs(entries: readonly CapabilityEntry[]): string {
  const serialized = entries.map((entry) => serializeEntry(entry));
  const arrayBody = serialized.map((json) => {
    // Indent each line of JSON by 2 spaces
    const indented = json
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    return indented;
  });

  return `/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/* eslint-disable max-lines, sonarjs/no-duplicate-string */
/**
 * AUTO-GENERATED — do not edit manually.
 *
 * @remarks
 * This file is overwritten by \`npm run generate:capabilities\`.
 * Edit \`capabilities.yaml\` to add or modify capabilities, then re-run the generator.
 *
 * @module ai
 */

import type { CapabilityEntry } from './schemas/capability.schema.js';

/**
 * Static list of generated capability entries.
 *
 * @remarks
 * Generated on ${today} with ${String(entries.length)} entries.
 */
export const GENERATED_CAPABILITIES: readonly CapabilityEntry[] = [
${arrayBody.join(',\n')},
] as const;
`;
}

/**
 * Generate `recipe-registry.generated.ts`.
 */
function generateRecipeRegistryTs(entries: readonly RecipeEntry[]): string {
  const serialized = entries.map((entry) => {
    const json = JSON.stringify(entry, null, 2);
    return json
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
  });

  return `/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/* eslint-disable sonarjs/no-duplicate-string */
/**
 * AUTO-GENERATED — do not edit manually.
 *
 * @remarks
 * This file is overwritten by \`npm run generate:capabilities\`.
 * Edit \`recipes.yaml\` to add or modify recipes, then re-run the generator.
 *
 * @module ai
 */

import type { RecipeEntry } from './schemas/recipe.schema.js';

/**
 * Static list of generated recipe entries.
 *
 * @remarks
 * Generated on ${today} with ${String(entries.length)} entries.
 */
export const GENERATED_RECIPES: readonly RecipeEntry[] = [
${serialized.join(',\n')},
] as const;
`;
}

/**
 * Generate `docs/capabilities.md`.
 */
function generateCapabilitiesMd(
  entries: readonly CapabilityEntry[],
  yamlData: CapabilitiesYaml,
): string {
  const lines: string[] = [];

  lines.push('# Praman Capabilities Reference');
  lines.push('');
  lines.push(
    `> **Generated**: ${today} — do not edit manually, run \`npm run generate:capabilities\``,
  );
  lines.push(
    `> **Total**: ${String(entries.length)} capabilities across ${String(Object.keys(yamlData.categories).length)} categories`,
  );
  lines.push('');
  lines.push('---');
  lines.push('');

  // Category summary table
  lines.push('## Categories');
  lines.push('');
  lines.push('| Category | Prefix | Description | Count |');
  lines.push('|----------|--------|-------------|-------|');

  const categoryCounts = new Map<string, number>();
  for (const entry of entries) {
    categoryCounts.set(entry.category, (categoryCounts.get(entry.category) ?? 0) + 1);
  }

  for (const [catKey, catInfo] of Object.entries(yamlData.categories)) {
    const count = categoryCounts.get(catKey) ?? 0;
    lines.push(
      `| ${catKey} | \`UI5-${catInfo.prefix}\` | ${catInfo.description} | ${String(count)} |`,
    );
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // Per-category sections
  const grouped = new Map<string, CapabilityEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
  }

  for (const [catKey, catInfo] of Object.entries(yamlData.categories)) {
    const catEntries = grouped.get(catKey);
    if (!catEntries || catEntries.length === 0) continue;

    lines.push(`## ${catKey} — ${catInfo.description}`);
    lines.push('');
    lines.push('| ID | Name | Description | Usage Example |');
    lines.push('|-----|------|-------------|---------------|');

    for (const entry of catEntries) {
      const example = entry.usageExample.split('\n')[0] ?? '';
      lines.push(`| \`${entry.id}\` | ${entry.name} | ${entry.description} | \`${example}\` |`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate `skills/playwright-praman-sap-testing/capabilities-reference.md`.
 */
function generateSkillCapabilitiesMd(
  entries: readonly CapabilityEntry[],
  yamlData: CapabilitiesYaml,
): string {
  const lines: string[] = [];

  lines.push('# Praman Capabilities Reference (Agent)');
  lines.push('');
  lines.push(`> Generated: ${today} — do not edit manually, run \`npm run generate:capabilities\``);
  lines.push(`> Total: ${String(entries.length)} capabilities`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Per-category sections
  const grouped = new Map<string, CapabilityEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
  }

  for (const [catKey, catInfo] of Object.entries(yamlData.categories)) {
    const catEntries = grouped.get(catKey);
    if (!catEntries || catEntries.length === 0) continue;

    lines.push(`## ${catKey} — ${catInfo.description}`);
    lines.push('');

    for (const entry of catEntries) {
      lines.push(`- **${entry.qualifiedName}** — ${entry.description}`);
    }

    lines.push('');
  }

  return lines.join('\n');
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  console.log('Scanning YAML master data...');

  // 1. Read YAML files
  console.log(`  Reading ${CAPABILITIES_YAML}`);
  const capabilitiesRaw = await readFile(CAPABILITIES_YAML, 'utf-8');
  console.log(`  Reading ${RECIPES_YAML}`);
  const recipesRaw = await readFile(RECIPES_YAML, 'utf-8');

  // 2. Parse YAML
  const capabilitiesParsed: unknown = parseYaml(capabilitiesRaw);
  const recipesParsed: unknown = parseYaml(recipesRaw);

  // 3. Validate with Zod schemas
  console.log('Validating capabilities.yaml...');
  let capabilitiesYaml: CapabilitiesYaml;
  try {
    capabilitiesYaml = CapabilitiesYamlSchema.parse(capabilitiesParsed);
  } catch (error: unknown) {
    console.error('Validation failed for capabilities.yaml:');
    console.error(error);
    process.exitCode = 1;
    return;
  }

  console.log('Validating recipes.yaml...');
  let recipesYaml: RecipesYaml;
  try {
    recipesYaml = RecipesYamlSchema.parse(recipesParsed);
  } catch (error: unknown) {
    console.error('Validation failed for recipes.yaml:');
    console.error(error);
    process.exitCode = 1;
    return;
  }

  // 4. Trim trailing whitespace from usage examples and patterns
  const capabilities = trimExamples(capabilitiesYaml.capabilities);
  const recipes = trimPatterns(recipesYaml.recipes);

  console.log(`  Found ${String(capabilities.length)} capabilities`);
  console.log(`  Found ${String(recipes.length)} recipes`);

  // 5. Generate and write output files
  console.log('Writing output files...');

  // Output 1: capability-registry.generated.ts
  await ensureDir(CAPABILITY_REGISTRY_TS);
  const capRegistryContent = generateCapabilityRegistryTs(capabilities);
  await writeFile(CAPABILITY_REGISTRY_TS, capRegistryContent, 'utf-8');
  console.log(`  Written: ${CAPABILITY_REGISTRY_TS} (${String(capabilities.length)} entries)`);

  // Output 2: recipe-registry.generated.ts
  await ensureDir(RECIPE_REGISTRY_TS);
  const recipeRegistryContent = generateRecipeRegistryTs(recipes);
  await writeFile(RECIPE_REGISTRY_TS, recipeRegistryContent, 'utf-8');
  console.log(`  Written: ${RECIPE_REGISTRY_TS} (${String(recipes.length)} entries)`);

  // Output 3: docs/capabilities.md
  await ensureDir(CAPABILITIES_MD);
  const capsMdContent = generateCapabilitiesMd(capabilities, capabilitiesYaml);
  await writeFile(CAPABILITIES_MD, capsMdContent, 'utf-8');
  console.log(`  Written: ${CAPABILITIES_MD}`);

  // Output 4: skills capabilities-reference.md
  await ensureDir(CAPABILITIES_SKILL_MD);
  const skillMdContent = generateSkillCapabilitiesMd(capabilities, capabilitiesYaml);
  await writeFile(CAPABILITIES_SKILL_MD, skillMdContent, 'utf-8');
  console.log(`  Written: ${CAPABILITIES_SKILL_MD}`);

  console.log('Done.');
}

main().catch((err: unknown) => {
  console.error('generate-capabilities failed:', err);
  process.exitCode = 1;
});
