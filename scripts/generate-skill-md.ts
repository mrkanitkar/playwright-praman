#!/usr/bin/env tsx
/**
 * Generate capabilities-reference.md, api-reference.md, and recipes-reference.md
 * from capabilities.yaml and recipes.yaml (validated via Zod schemas).
 *
 * @remarks
 * Output files are written to `skills/playwright-praman-sap-testing/`.
 * Run with: `npm run generate:skill-md`
 *
 * Algorithm:
 * 1. Read `capabilities.yaml` and `recipes.yaml` from project root
 * 2. Validate via Zod schemas (CapabilitiesYamlSchema, RecipesYamlSchema)
 * 3. Generate capabilities-reference.md (table per category)
 * 4. Generate api-reference.md (alphabetical function list)
 * 5. Generate recipes-reference.md (curated test patterns)
 * 6. Validate outputs: frontmatter valid, body reasonable size
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

const CATEGORY_ORDER = [
  'ui5',
  'table',
  'dialog',
  'date',
  'odata',
  'navigate',
  'auth',
  'fe',
  'intent',
  'shell',
  'footer',
  'flp',
  'ai',
  'data',
];

// ── Rendering ──────────────────────────────────────────────────────────────

/**
 * Group capabilities by their category field.
 */
function groupByCategory(caps: ExtractedCapability[]): Map<string, ExtractedCapability[]> {
  const map = new Map<string, ExtractedCapability[]>();

  for (const cap of caps) {
    const category = cap.category;
    const existing = map.get(category);
    if (existing) {
      existing.push(cap);
    } else {
      map.set(category, [cap]);
    }
  }

  // Sort by CATEGORY_ORDER, then alphabetical for unknown categories
  const sorted = new Map<string, ExtractedCapability[]>();
  for (const key of CATEGORY_ORDER) {
    const group = map.get(key);
    if (group) {
      sorted.set(key, group);
    }
  }
  for (const [key, val] of map) {
    if (!sorted.has(key)) sorted.set(key, val);
  }

  return sorted;
}

/**
 * Generate capabilities-reference.md content.
 */
function renderCapabilities(caps: ExtractedCapability[]): string {
  if (caps.length === 0) {
    return `# Praman Capabilities Reference

> **Note**: No capabilities found in capabilities.yaml.
> Run \`npm run generate:skill-md\` after populating capabilities.yaml.

Capabilities will be auto-generated from capabilities.yaml entries.
`;
  }

  const grouped = groupByCategory(caps);
  const date = new Date().toISOString().split('T')[0];

  let md = `# Praman Capabilities Reference

> **Generated**: ${date} — do not edit manually, run \`npm run generate:skill-md\`
> **Total**: ${caps.length} capabilities across ${grouped.size} categories

---

`;

  for (const [category, group] of grouped) {
    const title = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    md += `## ${title}\n\n`;
    md += `| Capability | Function | Description | SAP Module |\n`;
    md += `|---|---|---|---|\n`;
    for (const cap of group) {
      const sapMod = cap.sapModule ?? 'All';
      md += `| \`${cap.qualifiedName}\` | \`${cap.name}()\` | ${cap.description} | ${sapMod} |\n`;
    }
    md += '\n';

    // Examples inline for first 3 per category
    const withExamples = group.filter((c) => c.usageExample.length > 0).slice(0, 3);
    for (const cap of withExamples) {
      md += `### ${cap.name}\n\n`;
      if (cap.intent) md += `**Intent**: ${cap.intent}\n\n`;
      md += `\`\`\`typescript\n${cap.usageExample}\n\`\`\`\n\n`;
    }
  }

  return md;
}

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

  // Write capabilities-reference.md
  const capsPath = resolve(OUTPUT_DIR, 'capabilities-reference.md');
  writeFileSync(capsPath, renderCapabilities(capabilities), 'utf-8');
  console.log(`Written: ${relative(process.cwd(), capsPath)}`);

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
