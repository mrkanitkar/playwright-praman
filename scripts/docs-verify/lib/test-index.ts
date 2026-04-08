/**
 * Test Index Builder
 *
 * Scans the test directory and builds an index of test files,
 * extracting test names and code patterns for fuzzy matching
 * in Check 6 (example-test-map).
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { TestIndex, TestFileInfo } from './types.js';

/** Regex patterns that capture test names from it/test calls */
const TEST_NAME_PATTERNS = [/(?:it|test)(?:\.skip|\.only)?\s*\(\s*['"`]([^'"`]+)['"`]/g];

/**
 * Build a TestIndex by scanning the tests directory for test/spec files.
 *
 * @returns A TestIndex with all discovered test files indexed.
 */
export async function buildTestIndex(): Promise<TestIndex> {
  const rootDir = process.cwd();
  const testsDir = join(rootDir, 'tests');
  const files = new Map<string, TestFileInfo>();

  const testFiles = await findTestFiles(testsDir);

  for (const absPath of testFiles) {
    const relPath = relative(rootDir, absPath);
    const content = await readFile(absPath, 'utf-8');
    const testNames = extractTestNames(content);
    const codePatterns = normalizeCodePatterns(content);

    files.set(relPath, {
      filePath: relPath,
      testNames,
      codePatterns,
      content,
    });
  }

  return { files };
}

/**
 * Recursively find all test/spec .ts files under a directory.
 */
async function findTestFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const info = await stat(fullPath);

    if (info.isDirectory()) {
      const subResults = await findTestFiles(fullPath);
      results.push(...subResults);
    } else if (/\.(test|spec)\.ts$/.test(entry)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Extract test names from test file content.
 * Matches it('name'), test('name'), it.skip('name'), test.only('name'), etc.
 */
export function extractTestNames(content: string): string[] {
  const names: string[] = [];

  for (const pattern of TEST_NAME_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1];
      if (name) {
        names.push(name);
      }
    }
  }

  return names;
}

/**
 * Normalize code content into searchable patterns.
 * Strips comments, collapses whitespace, and extracts method call patterns.
 */
export function normalizeCodePatterns(content: string): string[] {
  const patterns: string[] = [];

  // Strip single-line comments
  const noComments = content.replace(/\/\/.*$/gm, '');
  // Strip multi-line comments
  const clean = noComments.replace(/\/\*[\s\S]*?\*\//g, '');

  // Extract fixture/API method calls
  const callRegex = /\b(\w+\.\w+(?:\.\w+)*)\s*\(/g;
  let match;
  while ((match = callRegex.exec(clean)) !== null) {
    const call = match[1];
    if (call) {
      patterns.push(call);
    }
  }

  return [...new Set(patterns)];
}
