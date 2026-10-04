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

import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { collectTaggedDeclarations, renderCapabilitySignature } from './capability-signatures.js';
import { emitGenerated } from './generated-file.js';
import type { EmitMode } from './generated-file.js';
import { REGION_MARKERS, replaceRegion } from './skill-md-regions.js';

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
const SKILL_MD = resolve(OUTPUT_DIR, 'SKILL.md');
const SRC_GLOBS = ['src/**/*.ts', '!src/**/*.generated.ts'] as const;

/** `--check` verifies the artifacts are current without writing anything. */
const IS_CHECK = process.argv.includes('--check');

/** Width at which the compact capability listing wraps. */
const LIST_WIDTH = 96;

// ── Rendering ──────────────────────────────────────────────────────────────

/**
 * Generate api-reference.md content (alphabetical function index).
 */
function renderApiReference(caps: ExtractedCapability[], date: string): string {
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
function renderRecipes(recipes: ExtractedRecipe[], date: string): string {
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

/**
 * Renders the compact capability listing agents read in place of runtime APIs.
 *
 * @remarks
 * Keeps the hand-written shape — a namespace, then its methods wrapped across
 * indented lines — because that form is far cheaper in an agent's context than a
 * 198-row table would be. The content is now complete and code-derived: the
 * previous hand-maintained listing covered 135 of 198 capabilities, omitted all
 * five `control.*` entries (two of which CLAUDE.md rule 5 makes mandatory for
 * every input), and misnamed parameters — `fill(selector, text)` where the real
 * one is `value`.
 *
 * Signatures come from {@link renderCapabilitySignature}, which prints real
 * parameter names only where a tagged declaration proves them and `name(...)`
 * otherwise, so this can never state a signature the code does not have.
 */
function renderCapabilityListing(
  caps: readonly ExtractedCapability[],
  tagged: readonly {
    qualifiedName: string;
    declarationName: string;
    parameters: readonly string[];
  }[],
): string {
  const byNamespace = new Map<string, string[]>();
  for (const cap of caps) {
    const parts = cap.qualifiedName.split('.');
    const namespace = parts.length > 1 ? parts.slice(0, -1).join('.') : cap.qualifiedName;
    const rendered = renderCapabilitySignature(cap, tagged);
    byNamespace.set(namespace, [...(byNamespace.get(namespace) ?? []), rendered]);
  }

  const blocks: string[] = [];
  for (const [namespace, entries] of byNamespace) {
    const wrapped: string[] = [];
    let line = '';
    for (const entry of entries) {
      const candidate = line === '' ? entry : `${line}, ${entry}`;
      if (`  ${candidate}`.length > LIST_WIDTH && line !== '') {
        wrapped.push(`  ${line},`);
        line = entry;
      } else {
        line = candidate;
      }
    }
    if (line !== '') wrapped.push(`  ${line}`);
    blocks.push([namespace, ...wrapped].join('\n'));
  }

  return ['```text', blocks.join('\n\n'), '```'].join('\n');
}

/**
 * Renders the package/import facts.
 *
 * @remarks
 * Deliberately carries no version. It used to stamp `package.json`'s, which
 * made SKILL.md unpublishable: `canary.yml` runs `npm version <x>-alpha.N`
 * and then publishes, `prepublishOnly` runs `npm run ci`, and this file no
 * longer matched the stamped version — so `validate:generated` failed and the
 * canary aborted. Both the stamp and the gate arrived together in #264, and
 * the next canary attempt (the first since) failed outright.
 *
 * The same trap applies to the real release: release-please bumps
 * `package.json` with no `extra-files` configured, so a version here would go
 * stale on `main` the moment a release PR merged. A checked-in, byte-gated
 * artifact must not contain a value that releasing rewrites.
 */
function renderMeta(): string {
  return [
    '**Package**: `playwright-praman`',
    "**Import**: `import { test, expect } from 'playwright-praman'`",
    '**Purpose**: Primary instruction set for Praman AI agents (planner, generator, healer)',
  ].join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
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

  // Signatures are read from src/, not dist/: build:full runs the generators
  // before build, so dist/ may be stale or absent.
  const tagged = collectTaggedDeclarations(SRC_GLOBS);

  const skillMd = replaceRegion(
    replaceRegion(readFileSync(SKILL_MD, 'utf-8'), REGION_MARKERS.meta, renderMeta(), 'SKILL.md'),
    REGION_MARKERS.capabilities,
    renderCapabilityListing(capabilities, tagged),
    'SKILL.md',
  );

  const mode: EmitMode = IS_CHECK ? 'check' : 'write';
  const artifacts: readonly { path: string; content: string }[] = [
    {
      path: resolve(OUTPUT_DIR, 'api-reference.md'),
      content: renderApiReference(capabilities, capsYaml.generatedAt),
    },
    {
      path: resolve(OUTPUT_DIR, 'recipes-reference.md'),
      content: renderRecipes(recipes, capsYaml.generatedAt),
    },
    { path: SKILL_MD, content: skillMd },
  ];

  const stale: string[] = [];
  for (const artifact of artifacts) {
    const result = await emitGenerated(artifact.path, artifact.content, mode);
    if (result.changed) stale.push(relative(process.cwd(), artifact.path));
    const label = result.changed ? (IS_CHECK ? 'STALE' : 'Written') : 'current';
    console.log(`  ${label}: ${relative(process.cwd(), artifact.path)}`);
  }

  if (IS_CHECK && stale.length > 0) {
    console.error('\nThese artifacts are out of date — run `npm run generate:skill-md`:');
    for (const p of stale) console.error(`  ${p}`);
    process.exitCode = 1;
    return;
  }

  console.log(IS_CHECK ? 'All skill artifacts are current.' : '\ngenerate-skill-md complete.');
}

await main();
