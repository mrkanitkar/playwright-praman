/**
 * Doc Registry — discovers and loads documentation files for verification.
 *
 * Globs docs/docs/{guides,examples,reference}/**\/*.md, reads content,
 * parses frontmatter, and maps source files via doc-source-map.yaml.
 */

import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { glob } from 'glob';
import type { DocUnderTest } from './types.js';

const DOCS_ROOT = 'docs/docs';
const DOC_GLOB_PATTERNS = [
  `${DOCS_ROOT}/guides/**/*.md`,
  `${DOCS_ROOT}/examples/**/*.md`,
  `${DOCS_ROOT}/reference/**/*.md`,
];
const SOURCE_MAP_PATH = 'scripts/docs-verify/doc-source-map.yaml';

/**
 * Parse simple YAML frontmatter delimited by `---`.
 * Returns key-value pairs from lines like `key: value`.
 */
export function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  if (!content.startsWith('---')) {
    return { frontmatter: {}, body: content };
  }

  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) {
    return { frontmatter: {}, body: content };
  }

  const fmBlock = content.slice(3, endIndex).trim();
  const frontmatter: Record<string, unknown> = {};

  for (const line of fmBlock.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: unknown = line.slice(colonIndex + 1).trim();

    // Basic type coercion
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (typeof value === 'string' && /^\d+$/.test(value)) value = Number(value);

    if (key) {
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: content.slice(endIndex + 3).trimStart() };
}

/**
 * Parse a simple YAML source map file.
 * Expected format:
 *   guides/fixtures.md:
 *     - src/core/fixtures.ts
 *     - src/core/config.ts
 */
export function parseSourceMap(yamlContent: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  let currentDoc: string | null = null;

  for (const line of yamlContent.split('\n')) {
    // Doc key line: "guides/fixtures.md:"
    const docMatch = line.match(/^(\S.*?):\s*$/);
    if (docMatch) {
      currentDoc = docMatch[1]!;
      map.set(currentDoc, []);
      continue;
    }

    // Source file line: "  - src/core/fixtures.ts"
    const sourceMatch = line.match(/^\s+-\s+(.+)$/);
    if (sourceMatch && currentDoc) {
      const sources = map.get(currentDoc);
      if (sources) {
        sources.push(sourceMatch[1]!.trim());
      }
    }
  }

  return map;
}

/**
 * Load the doc-source-map.yaml if it exists.
 */
async function loadSourceMap(): Promise<Map<string, string[]>> {
  try {
    const content = await readFile(SOURCE_MAP_PATH, 'utf-8');
    return parseSourceMap(content);
  } catch {
    // File doesn't exist — that's OK
    return new Map();
  }
}

/**
 * Discover all documentation files for verification.
 *
 * Scans docs/docs/{guides,examples,reference}/**\/*.md,
 * excludes docs/docs/api/**, reads each file, and returns DocUnderTest[].
 */
export async function discoverDocs(): Promise<DocUnderTest[]> {
  const sourceMap = await loadSourceMap();

  // Glob all patterns
  const filePaths: string[] = [];
  for (const pattern of DOC_GLOB_PATTERNS) {
    const matches = await glob(pattern, { ignore: ['**/api/**'] });
    filePaths.push(...matches);
  }

  // Deduplicate and sort
  const uniquePaths = [...new Set(filePaths)].sort();

  const docs: DocUnderTest[] = [];
  for (const filePath of uniquePaths) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const { frontmatter } = parseFrontmatter(content);

      // Strip docs/docs/ prefix for shortName
      const shortName = filePath.startsWith(`${DOCS_ROOT}/`)
        ? filePath.slice(DOCS_ROOT.length + 1)
        : filePath;

      // Look up mapped source files
      const mappedSourceFiles = sourceMap.get(shortName) ?? [];

      docs.push({
        filePath,
        shortName,
        content,
        frontmatter,
        mappedSourceFiles,
      });
    } catch {
      // Skip files that can't be read
      console.warn(`Warning: Could not read ${filePath}`);
    }
  }

  return docs;
}
