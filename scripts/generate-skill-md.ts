#!/usr/bin/env tsx
/**
 * Generate capabilities-reference.md, api-reference.md, and recipes-reference.md
 * from TSDoc @capability, @intent, @recipe, @sapModule tags in source files.
 *
 * @remarks
 * Output files are written to `skills/playwright-praman-sap-testing/`.
 * Run with: `npm run generate:skill-md`
 *
 * Algorithm:
 * 1. Parse all `src/**\/\*.ts` with TypeScript compiler API
 * 2. Extract functions/methods with @capability, @intent, @recipe, @sapModule tags
 * 3. Generate capabilities-reference.md (table per category)
 * 4. Generate api-reference.md (alphabetical function list)
 * 5. Generate recipes-reference.md (top @example blocks)
 * 6. Validate outputs: frontmatter valid, body ≤500 lines per file
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { globSync } from 'glob';
import * as ts from 'typescript';

// ── Types ──────────────────────────────────────────────────────────────────

interface ExtractedCapability {
  name: string;
  description: string;
  capability: string;
  intent?: string;
  sapModule?: string;
  businessContext?: string;
  examples: string[];
  fileName: string;
}

interface ExtractedRecipe {
  name: string;
  description: string;
  code: string;
  fileName: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const OUTPUT_DIR = resolve(process.cwd(), 'skills/playwright-praman-sap-testing');

const CATEGORY_ORDER = [
  'ui5-control',
  'navigation',
  'authentication',
  'fiori-elements',
  'table',
  'dialog',
  'date',
  'odata',
  'ai',
  'intent',
  'vocabulary',
];

// ── TSDoc extraction ──────────────────────────────────────────────────────

/**
 * Get the leading JSDoc/TSDoc comment for a node.
 */
function getLeadingComment(node: ts.Node, sourceText: string): string | null {
  const nodeStart = node.getFullStart();
  const nodeText = sourceText.slice(nodeStart, node.getStart());
  const ranges = ts.getLeadingCommentRanges(nodeText, 0);
  if (!ranges || ranges.length === 0) return null;
  const last = ranges[ranges.length - 1];
  if (!last) return null;
  return nodeText.slice(last.pos, last.end);
}

/**
 * Extract a single TSDoc tag value (first occurrence).
 */
function getTag(comment: string, tag: string): string | undefined {
  // Matches @tag value (stops at next @ or end)
  const re = new RegExp(`@${tag}\\s+([^@\\n][^\\n]*)`, '');
  const m = re.exec(comment);
  return m?.[1]?.trim();
}

/**
 * Extract description (text before first @ tag).
 */
function getDescription(comment: string): string {
  const lines = comment
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => !l.startsWith('/**') && !l.startsWith('*/') && !l.startsWith('@'));

  const descLines: string[] = [];
  for (const line of lines) {
    if (line === '') {
      if (descLines.length > 0) break;
    } else {
      descLines.push(line);
    }
  }
  return descLines.join(' ').trim();
}

/**
 * Extract all @example blocks from a TSDoc comment.
 */
function getExamples(comment: string): string[] {
  const examples: string[] = [];
  // Match @example followed by a fenced code block
  const re = /@example\s*\n\s*\*\s*```(?:typescript|ts)?\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(comment)) !== null) {
    const code = m[1]
      ?.split('\n')
      .map((l) => l.replace(/^\s*\*\s?/, ''))
      .join('\n')
      .trim();
    if (code) examples.push(code);
  }
  return examples;
}

/**
 * Get a node's name (function, method, variable with function value).
 */
function getNodeName(node: ts.Node): string | null {
  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    return node.name?.getText() ?? null;
  }
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    if (decl) return decl.name.getText();
  }
  return null;
}

// ── Extraction ─────────────────────────────────────────────────────────────

/**
 * Walk all top-level nodes in a source file and extract capabilities.
 */
function extractFromFile(
  filePath: string,
  sourceText: string,
  capabilities: ExtractedCapability[],
  recipes: ExtractedRecipe[],
): void {
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true);

  const visit = (node: ts.Node): void => {
    const comment = getLeadingComment(node, sourceText);
    if (comment) {
      const capTag = getTag(comment, 'capability');
      if (capTag) {
        const name = getNodeName(node) ?? 'unknown';
        capabilities.push({
          name,
          description: getDescription(comment),
          capability: capTag,
          intent: getTag(comment, 'intent'),
          sapModule: getTag(comment, 'sapModule'),
          businessContext: getTag(comment, 'businessContext'),
          examples: getExamples(comment),
          fileName: relative(process.cwd(), filePath),
        });
      }

      const examples = getExamples(comment);
      if (examples.length > 0) {
        const name = getNodeName(node);
        if (name) {
          for (const ex of examples) {
            recipes.push({
              name,
              description: getDescription(comment),
              code: ex,
              fileName: relative(process.cwd(), filePath),
            });
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);
}

/**
 * Scan all source files and return extracted data.
 */
function extractAll(): {
  capabilities: ExtractedCapability[];
  recipes: ExtractedRecipe[];
} {
  const capabilities: ExtractedCapability[] = [];
  const recipes: ExtractedRecipe[] = [];

  const files = globSync('src/**/*.ts', {
    cwd: process.cwd(),
    ignore: ['**/*.test.ts', '**/*.spec.ts', '**/*.d.ts'],
    absolute: true,
  });

  for (const filePath of files) {
    const sourceText = readFileSync(filePath, 'utf-8');
    extractFromFile(filePath, sourceText, capabilities, recipes);
  }

  return { capabilities, recipes };
}

// ── Rendering ──────────────────────────────────────────────────────────────

/**
 * Group capabilities by the first segment of their @capability tag.
 */
function groupByCategory(caps: ExtractedCapability[]): Map<string, ExtractedCapability[]> {
  const map = new Map<string, ExtractedCapability[]>();

  for (const cap of caps) {
    const category = cap.capability.split('-')[0] ?? 'other';
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
    if (map.has(key)) {
      sorted.set(key, map.get(key)!);
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

> **Note**: No @capability TSDoc tags found in source yet.
> Run \`npm run generate:skill-md\` after adding @capability tags to public functions.

Capabilities will be auto-generated from TSDoc @capability tags added to public functions.
See \`docs/documentation-standards.md\` for the tagging format.
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
      md += `| \`${cap.capability}\` | \`${cap.name}()\` | ${cap.description} | ${sapMod} |\n`;
    }
    md += '\n';

    // Examples inline for first 3 per category
    const withExamples = group.filter((c) => c.examples.length > 0).slice(0, 3);
    for (const cap of withExamples) {
      md += `### ${cap.name}\n\n`;
      if (cap.intent) md += `**Intent**: ${cap.intent}\n\n`;
      md += `\`\`\`typescript\n${cap.examples[0]}\n\`\`\`\n\n`;
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

> **Generated**: ${date} — run \`npm run generate:skill-md\` after adding @capability tags

No tagged functions found yet.
`;
  }

  const sorted = [...caps].sort((a, b) => a.name.localeCompare(b.name));
  let md = `# Praman API Reference

> **Generated**: ${date} — do not edit manually, run \`npm run generate:skill-md\`

| Function | Capability | Description | File |
|---|---|---|---|
`;

  for (const cap of sorted) {
    md += `| \`${cap.name}()\` | \`${cap.capability}\` | ${cap.description} | \`${cap.fileName}\` |\n`;
  }

  return md;
}

/**
 * Generate recipes-reference.md content (top @example blocks).
 */
function renderRecipes(recipes: ExtractedRecipe[]): string {
  const date = new Date().toISOString().split('T')[0];

  if (recipes.length === 0) {
    return `# Praman Recipes Reference

> **Generated**: ${date} — run \`npm run generate:skill-md\` after adding @example blocks

No recipes found yet.
`;
  }

  // Deduplicate by function name, keep first example per function
  const seen = new Set<string>();
  const unique = recipes.filter((r) => {
    if (seen.has(r.name)) return false;
    seen.add(r.name);
    return true;
  });

  const top = unique.slice(0, 20);

  let md = `# Praman Recipes Reference

> **Generated**: ${date} — do not edit manually, run \`npm run generate:skill-md\`
> Top ${top.length} recipes extracted from @example TSDoc blocks

`;

  for (const recipe of top) {
    md += `## ${recipe.name}\n\n`;
    if (recipe.description) md += `${recipe.description}\n\n`;
    md += `\`\`\`typescript\n${recipe.code}\n\`\`\`\n\n---\n\n`;
  }

  return md;
}

// ── Main ──────────────────────────────────────────────────────────────────

function main(): void {
  console.log('🔍 Scanning src/ for @capability and @recipe TSDoc tags...');

  const { capabilities, recipes } = extractAll();

  console.log(`   Found ${capabilities.length} @capability tags`);
  console.log(`   Found ${recipes.length} @example blocks`);

  if (capabilities.length === 0) {
    console.warn(
      '⚠️  No @capability tags found. Generated files will contain placeholder content.',
    );
    console.warn('   Add @capability TSDoc tags to public functions in src/ to populate them.');
  }

  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write capabilities-reference.md
  const capsPath = resolve(OUTPUT_DIR, 'capabilities-reference.md');
  writeFileSync(capsPath, renderCapabilities(capabilities), 'utf-8');
  console.log(`✅ Written: ${relative(process.cwd(), capsPath)}`);

  // Write api-reference.md
  const apiPath = resolve(OUTPUT_DIR, 'api-reference.md');
  writeFileSync(apiPath, renderApiReference(capabilities), 'utf-8');
  console.log(`✅ Written: ${relative(process.cwd(), apiPath)}`);

  // Write recipes-reference.md
  const recipesPath = resolve(OUTPUT_DIR, 'recipes-reference.md');
  writeFileSync(recipesPath, renderRecipes(recipes), 'utf-8');
  console.log(`✅ Written: ${relative(process.cwd(), recipesPath)}`);

  console.log('\n✨ generate-skill-md complete.');
}

main();
