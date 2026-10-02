#!/usr/bin/env tsx
/**
 * Generate api-reference.md and recipes-reference.md from capabilities.yaml and
 * recipes.yaml (validated via Zod schemas).
 *
 * @remarks
 * **Ownership.** This script owns `api-reference.md` and `recipes-reference.md`
 * in `skills/playwright-praman-sap-testing/`, and nothing else.
 *
 * `capabilities-reference.md` belongs to `generate-capabilities.ts`. Both scripts
 * used to write it: `7a583ce` rewrote each of them to be YAML-driven without
 * retiring either path, so whichever ran last decided the committed content, and
 * `build:full` runs this script *after* `generate:capabilities` and silently
 * overwrote it. The owner is the one `capabilities.yaml`'s own header documents,
 * which also renders the YAML's category descriptions and truncates nothing.
 *
 * Run with: `npm run generate:skill-md`
 *
 * Algorithm:
 * 1. Read `capabilities.yaml` and `recipes.yaml` from project root
 * 2. Validate via Zod schemas (CapabilitiesYamlSchema, RecipesYamlSchema)
 * 3. Generate api-reference.md (alphabetical function list)
 * 4. Generate recipes-reference.md (curated test patterns)
 * 5. Validate outputs: frontmatter valid, body reasonable size
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { CapabilitiesYamlSchema } from '../src/ai/schemas/capability.schema.js';
import { RecipesYamlSchema } from '../src/ai/schemas/recipe.schema.js';

// ── Types ──────────────────────────────────────────────────────────────────

interface ExtractedCapability {
  id: string;
  qualifiedName: string;
  name: string;
  description: string;
  category: string;
  usageExample: string;
  intent?: string;
  sapModule?: string;
  controlTypes?: string[];
}

interface ExtractedRecipe {
  id: string;
  name: string;
  description: string;
  domain: string;
  priority: string;
  pattern: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const OUTPUT_DIR = resolve(process.cwd(), 'skills/playwright-praman-sap-testing');

// ── Rendering ──────────────────────────────────────────────────────────────

/**
 * Generate api-reference.md content (alphabetical function index).
 */
function renderApiReference(caps: ExtractedCapability[]): string {
  const date = new Date().toISOString().split('T')[0];

  if (caps.length === 0) {
    return `# Praman API Reference

> **Generated**: ${date} — run \`npm run generate:skill-md\` after populating capabilities.yaml

No capabilities found yet.
`;
  }

  const sorted = [...caps].sort((a, b) => a.name.localeCompare(b.name));
  let md = `# Praman API Reference

> **Generated**: ${date} — do not edit manually, run \`npm run generate:skill-md\`

| Function | Capability | Description |
|---|---|---|
`;

  for (const cap of sorted) {
    md += `| \`${cap.name}()\` | \`${cap.qualifiedName}\` | ${cap.description} |\n`;
  }

  return md;
}

/**
 * Generate recipes-reference.md content (curated test patterns from recipes.yaml).
 */
function renderRecipes(recipes: ExtractedRecipe[]): string {
  const date = new Date().toISOString().split('T')[0];

  if (recipes.length === 0) {
    return `# Praman Recipes Reference

> **Generated**: ${date} — run \`npm run generate:skill-md\` after populating recipes.yaml

No recipes found yet.
`;
  }

  // Deduplicate by recipe id
  const seen = new Set<string>();
  const unique = recipes.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  let md = `# Praman Recipes Reference

> **Generated**: ${date} — do not edit manually, run \`npm run generate:skill-md\`
> ${unique.length} recipes extracted from recipes.yaml

`;

  for (const recipe of unique) {
    md += `## ${recipe.name}\n\n`;
    md += `**Domain**: ${recipe.domain} | **Priority**: ${recipe.priority}\n\n`;
    if (recipe.description) md += `${recipe.description}\n\n`;
    md += `\`\`\`typescript\n${recipe.pattern}\n\`\`\`\n\n---\n\n`;
  }

  return md;
}

// ── Main ──────────────────────────────────────────────────────────────────

function main(): void {
  console.log('Reading capabilities.yaml and recipes.yaml...');

  const capsRaw = readFileSync(resolve(process.cwd(), 'capabilities.yaml'), 'utf-8');
  const recipesRaw = readFileSync(resolve(process.cwd(), 'recipes.yaml'), 'utf-8');

  const capsYaml = CapabilitiesYamlSchema.parse(parseYaml(capsRaw));
  const recipesYaml = RecipesYamlSchema.parse(parseYaml(recipesRaw));

  const capabilities: ExtractedCapability[] = capsYaml.capabilities.map((c) => ({
    id: c.id,
    qualifiedName: c.qualifiedName,
    name: c.name,
    description: c.description,
    category: c.category,
    usageExample: c.usageExample.trim(),
    intent: c.intent,
    sapModule: c.sapModule,
    controlTypes: c.controlTypes,
  }));

  const recipes: ExtractedRecipe[] = recipesYaml.recipes.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description.trim(),
    domain: r.domain,
    priority: r.priority,
    pattern: r.pattern.trim(),
  }));

  console.log(`   Found ${capabilities.length} capabilities`);
  console.log(`   Found ${recipes.length} recipes`);

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write api-reference.md
  const apiPath = resolve(OUTPUT_DIR, 'api-reference.md');
  writeFileSync(apiPath, renderApiReference(capabilities), 'utf-8');
  console.log(`Written: ${relative(process.cwd(), apiPath)}`);

  // Write recipes-reference.md
  const recipesPath = resolve(OUTPUT_DIR, 'recipes-reference.md');
  writeFileSync(recipesPath, renderRecipes(recipes), 'utf-8');
  console.log(`Written: ${relative(process.cwd(), recipesPath)}`);

  console.log('\ngenerate-skill-md complete.');
}

main();
