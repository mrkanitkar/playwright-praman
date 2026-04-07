/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Shared utilities for capability validation scripts.
 *
 * Extracted from validate-capabilities.ts to keep both files under 300 LOC.
 */

import { readFileSync } from 'node:fs';
import { relative, dirname } from 'node:path';
import { globSync } from 'glob';

/* ── Constants ───────────────────────────────────────────────────────────── */

/**
 * Regex to capture @capability tag content on a single line in a TSDoc comment.
 */
export const CAPABILITY_TAG_REGEX = /@capability\s+(.+)/g;

/**
 * Regex to detect exported functions, classes, and const declarations.
 * Matches: export function, export async function, export class, export const
 */
const EXPORT_REGEX =
  /^export\s+(?:async\s+)?(?:function|class|const)\s+(\w+)/;

/* ── ANSI colors ─────────────────────────────────────────────────────────── */

export const GREEN = '\u001B[32m';
export const YELLOW = '\u001B[33m';
export const CYAN = '\u001B[36m';
export const RED = '\u001B[31m';
export const DIM = '\u001B[2m';
export const RESET = '\u001B[0m';
export const BOLD = '\u001B[1m';

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface SourceCapability {
  /** The raw text after @capability tag */
  readonly tagText: string;
  /** Relative file path from project root */
  readonly file: string;
  /** Line number where the tag appears */
  readonly line: number;
}

export interface ExportInfo {
  /** Name of the exported symbol */
  readonly name: string;
  /** Relative file path from project root */
  readonly file: string;
  /** Line number of the export */
  readonly line: number;
  /** Whether this export has an @capability tag in its preceding TSDoc block */
  readonly hasCapabilityTag: boolean;
}

export interface DirectoryCoverage {
  readonly directory: string;
  readonly totalExports: number;
  readonly taggedExports: number;
  readonly coveragePercent: number;
}

/* ── Glob patterns for files to EXCLUDE from export scanning ─────────── */

const EXCLUDED_PATTERNS = [
  '**/index.ts',
  '**/*.generated.ts',
  '**/browser-scripts/**',
  '**/cli/**',
  '**/version.ts',
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/*.d.ts',
];

/* ── Functions ───────────────────────────────────────────────────────────── */

/**
 * Scan source files for @capability TSDoc tags.
 */
export function scanSourceForCapabilityTags(
  root: string,
  srcGlob: string,
): SourceCapability[] {
  const sourceFiles = globSync(srcGlob, { cwd: root, absolute: true });
  const capabilities: SourceCapability[] = [];

  for (const filePath of sourceFiles) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex] ?? '';
      CAPABILITY_TAG_REGEX.lastIndex = 0;
      const match = CAPABILITY_TAG_REGEX.exec(line);
      if (match !== null) {
        const tagText = match[1]?.trim() ?? '';
        capabilities.push({
          tagText,
          file: relative(root, filePath),
          line: lineIndex + 1,
        });
      }
    }
  }

  return capabilities;
}

/**
 * Scan source files for exported symbols and check if they have @capability tags.
 *
 * Excludes: index.ts, generated files, browser-scripts, CLI, tests, version.ts.
 */
export function scanExportsForCapabilityTags(
  root: string,
  srcGlob: string,
): ExportInfo[] {
  const sourceFiles = globSync(srcGlob, {
    cwd: root,
    absolute: true,
    ignore: EXCLUDED_PATTERNS.map((p) => `${dirname(srcGlob.replace('**/', ''))}/${p}`),
  });

  // Filter out excluded files manually for robustness
  const filtered = sourceFiles.filter((f) => {
    const rel = relative(root, f);
    return (
      !rel.endsWith('index.ts') &&
      !rel.includes('.generated.') &&
      !rel.includes('browser-scripts') &&
      !rel.includes('src/cli/') &&
      !rel.endsWith('version.ts') &&
      !rel.endsWith('.test.ts') &&
      !rel.endsWith('.spec.ts') &&
      !rel.endsWith('.d.ts')
    );
  });

  const exports: ExportInfo[] = [];

  for (const filePath of filtered) {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Collect all @capability tag line numbers in this file
    const capabilityLines = new Set<number>();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      CAPABILITY_TAG_REGEX.lastIndex = 0;
      if (CAPABILITY_TAG_REGEX.test(line)) {
        capabilityLines.add(i);
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const exportMatch = EXPORT_REGEX.exec(line);
      if (exportMatch === null) continue;

      const name = exportMatch[1] ?? '';

      // Look backwards from the export line to find a preceding TSDoc block
      let hasTag = false;
      for (let j = i - 1; j >= 0 && j >= i - 80; j--) {
        const prevLine = lines[j] ?? '';
        if (capabilityLines.has(j)) {
          hasTag = true;
          break;
        }
        // Stop if we hit a non-comment, non-empty line (end of preceding TSDoc)
        if (
          prevLine.trim() !== '' &&
          !prevLine.trim().startsWith('*') &&
          !prevLine.trim().startsWith('/**') &&
          !prevLine.trim().startsWith('//') &&
          !prevLine.trim().startsWith('*/') &&
          !prevLine.trim().startsWith('@')
        ) {
          break;
        }
      }

      exports.push({
        name,
        file: relative(root, filePath),
        line: i + 1,
        hasCapabilityTag: hasTag,
      });
    }
  }

  return exports;
}

/**
 * Compute per-directory coverage statistics from export info.
 */
export function computeDirectoryCoverage(
  exports: readonly ExportInfo[],
): DirectoryCoverage[] {
  const dirMap = new Map<string, { total: number; tagged: number }>();

  for (const exp of exports) {
    // Extract first two path segments (e.g., "src/modules")
    const parts = exp.file.split('/');
    const dir = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0] ?? '';

    const entry = dirMap.get(dir) ?? { total: 0, tagged: 0 };
    entry.total++;
    if (exp.hasCapabilityTag) entry.tagged++;
    dirMap.set(dir, entry);
  }

  return [...dirMap.entries()]
    .map(([directory, { total, tagged }]) => ({
      directory,
      totalExports: total,
      taggedExports: tagged,
      coveragePercent: total > 0 ? Math.round((tagged / total) * 100) : 0,
    }))
    .sort((a, b) => a.coveragePercent - b.coveragePercent);
}

/**
 * Validate that every @capability tag value matches a qualifiedName from YAML.
 *
 * @returns Array of tags that do NOT match any qualifiedName.
 */
export function validateTagFormat(
  sourceTags: readonly SourceCapability[],
  qualifiedNames: ReadonlySet<string>,
): SourceCapability[] {
  return sourceTags.filter((tag) => !qualifiedNames.has(tag.tagText));
}
