/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Prompt structure validation tests.
 *
 * @remarks
 * Validates that all `.prompt.md` files in the `prompts/` directory conform to
 * the mandatory 16-section template, YAML frontmatter requirements, and
 * token budget constraints. Mirrors the logic of `scripts/validate-prompts.ts`
 * but runs as part of `npm run test:unit`.
 *
 * @module prompts/prompt-structure
 */

import { readdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

import { describe, expect, it } from 'vitest';

// eslint-disable-next-line n/no-unsupported-features/node-builtins -- vitest provides import.meta.dirname
const ROOT = resolve(import.meta.dirname, '../../..');
const PROMPTS_DIR = resolve(ROOT, 'prompts');

const REQUIRED_FRONTMATTER_FIELDS = [
  'name',
  'version',
  'business-process',
  'sap-transactions',
  'complexity',
  'estimated-steps',
  'tags',
  'praman-version',
] as const;

const VALID_COMPLEXITIES = ['low', 'medium', 'high'] as const;

const MANDATORY_SECTIONS = [
  'System Context',
  'Goal',
  'Prerequisites',
  'Mandatory Skills',
  'Execution Strategy',
  'Architecture Rules',
  'Selector Mapping Rules',
  'Output Format',
  'Anti-Patterns',
  'Example Output',
  'Behavior Rules',
  'Test Steps',
  'Expected Output',
  'Self-Check',
  'Context Window Management',
] as const;

const TOKEN_BUDGETS: Record<string, number> = {
  low: 3000,
  medium: 4500,
  high: 6000,
};

function parseFrontmatter(content: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const match = /^---\n([\s\S]*?)\n---/.exec(content);
  if (match?.[1] === undefined) return fields;

  for (const line of match[1].split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith('#')) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const rawValue = trimmed.slice(colonIndex + 1).trim();
    let value: unknown = rawValue.replaceAll(/^["']|["']$/g, '');

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      value = rawValue
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replaceAll(/^["']|["']$/g, ''));
    }
    fields[key] = value;
  }
  return fields;
}

function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  for (const line of content.split('\n')) {
    // Match markdown headings (# to ######)
    const headingMatch = /^(#{1,6})\s+([^\n]+)$/.exec(line);
    if (headingMatch?.[2] !== undefined) headings.push(headingMatch[2].trim());
  }
  return headings;
}

function estimateTokens(content: string): number {
  const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;
  return Math.ceil(wordCount / 0.75);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('prompts/ — prompt file structure validation', () => {
  let promptFiles: string[] = [];
  const fileContents = new Map<string, string>();

  // Load all prompt files once before tests
  it('should find at least one prompt file', async () => {
    const allFiles = await readdir(PROMPTS_DIR);
    promptFiles = allFiles.filter((f) => f.endsWith('.prompt.md') && f !== 'TEMPLATE.prompt.md');
    expect(promptFiles.length).toBeGreaterThan(0);

    for (const file of promptFiles) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      const content = await readFile(join(PROMPTS_DIR, file), 'utf-8');
      fileContents.set(file, content);
    }
  });

  it('every prompt has valid YAML frontmatter with all required fields', () => {
    for (const [file, content] of fileContents) {
      const fields = parseFrontmatter(content);
      for (const field of REQUIRED_FRONTMATTER_FIELDS) {
        expect(fields[field], `${file}: missing frontmatter field "${field}"`).toBeDefined();
        expect(
          String(fields[field]).length,
          `${file}: empty frontmatter field "${field}"`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it('complexity field is low, medium, or high', () => {
    for (const [file, content] of fileContents) {
      const fields = parseFrontmatter(content);
      const complexity = typeof fields['complexity'] === 'string' ? fields['complexity'] : '';
      expect(
        VALID_COMPLEXITIES.includes(complexity as (typeof VALID_COMPLEXITIES)[number]),
        `${file}: invalid complexity "${complexity}"`,
      ).toBe(true);
    }
  });

  it('estimated-steps is a positive integer', () => {
    for (const [file, content] of fileContents) {
      const fields = parseFrontmatter(content);
      const steps = Number(fields['estimated-steps']);
      expect(Number.isInteger(steps), `${file}: estimated-steps is not an integer`).toBe(true);
      expect(steps, `${file}: estimated-steps must be positive`).toBeGreaterThan(0);
    }
  });

  it('every prompt contains all mandatory section headings', () => {
    for (const [file, content] of fileContents) {
      const headings = extractHeadings(content);
      for (const section of MANDATORY_SECTIONS) {
        const found = headings.some((h) => h.toLowerCase().includes(section.toLowerCase()));
        expect(found, `${file}: missing mandatory section "${section}"`).toBe(true);
      }
    }
  });

  it('token count is within complexity-tier budget', () => {
    for (const [file, content] of fileContents) {
      const fields = parseFrontmatter(content);
      const complexity = typeof fields['complexity'] === 'string' ? fields['complexity'] : '';
      const budget = TOKEN_BUDGETS[complexity];
      if (budget === undefined) continue;

      const tokens = estimateTokens(content);
      expect(
        tokens,
        `${file}: ${String(tokens)} tokens exceeds ${complexity}-tier budget of ${String(budget)}`,
      ).toBeLessThanOrEqual(budget);
    }
  });

  it('every prompt contains Backend Data Verification section', () => {
    for (const [file, content] of fileContents) {
      const headings = extractHeadings(content);
      const found = headings.some((h) => h.toLowerCase().includes('backend data verification'));
      expect(found, `${file}: missing Backend Data Verification section`).toBe(true);
    }
  });

  it('every prompt contains Two-Phase Wizard execution strategy', () => {
    for (const [file, content] of fileContents) {
      expect(
        content.includes('Phase 1') && content.includes('Phase 2'),
        `${file}: missing Two-Phase Wizard execution strategy`,
      ).toBe(true);
    }
  });

  it('every prompt warns against assuming test data', () => {
    for (const [file, content] of fileContents) {
      expect(
        content.toLowerCase().includes('never assume') ||
          content.toLowerCase().includes('do not assume'),
        `${file}: missing "NEVER assume" behavior rule`,
      ).toBe(true);
    }
  });
});
