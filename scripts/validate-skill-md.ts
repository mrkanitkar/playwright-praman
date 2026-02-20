#!/usr/bin/env tsx
/**
 * Validate SKILL.md format compliance.
 *
 * @remarks
 * Checks:
 * - YAML frontmatter exists and is well-formed
 * - `name` field is present, lowercase+hyphens, ≤64 chars
 * - `description` field is present, ≤1024 chars
 * - Body (after frontmatter) is ≤500 lines
 *
 * Exits with code 1 if any check fails.
 * Used in `npm run validate:skill-md` and optionally in `npm run ci`.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SKILL_MD_PATH = resolve(process.cwd(), 'SKILL.md');
const MAX_NAME_CHARS = 64;
const MAX_DESCRIPTION_CHARS = 1024;
const MAX_BODY_LINES = 500;
const NAME_PATTERN = /^[a-z0-9-]+$/;

interface ValidationResult {
  pass: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Parse YAML frontmatter from a markdown file.
 *
 * @remarks
 * Supports the `---` fence format only. Returns null if no frontmatter found.
 */
function parseFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} | null {
  if (!content.startsWith('---')) {
    return null;
  }

  const endFence = content.indexOf('\n---', 3);
  if (endFence === -1) {
    return null;
  }

  const fenceContent = content.slice(3, endFence).trim();
  const bodyStart = endFence + 4; // skip '\n---'
  const body = content.slice(bodyStart).trim();

  const frontmatter: Record<string, string> = {};

  // Simple key: value parsing (handles multi-line values with >, |)
  const lines = fenceContent.split('\n');
  let currentKey: string | null = null;
  let currentValue: string[] = [];
  let inMultiLine = false;

  for (const line of lines) {
    const keyMatch = /^(\w+):\s*(.*)$/.exec(line);
    if (keyMatch) {
      if (currentKey !== null) {
        frontmatter[currentKey] = currentValue.join(' ').trim().replace(/\s+/g, ' ');
      }
      currentKey = keyMatch[1] ?? null;
      const val = keyMatch[2] ?? '';
      inMultiLine = val === '>' || val === '|';
      currentValue = inMultiLine ? [] : [val];
    } else if (inMultiLine && currentKey !== null) {
      currentValue.push(line.trim());
    }
  }

  if (currentKey !== null) {
    frontmatter[currentKey] = currentValue.join(' ').trim().replace(/\s+/g, ' ');
  }

  return { frontmatter, body };
}

/**
 * Validate SKILL.md content.
 */
function validate(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Check frontmatter exists
  const parsed = parseFrontmatter(content);
  if (parsed === null) {
    errors.push('SKILL.md must begin with YAML frontmatter (--- ... ---)');
    return { pass: false, errors, warnings };
  }

  const { frontmatter, body } = parsed;

  // 2. Check name field
  const name = frontmatter['name'];
  if (!name) {
    errors.push('Frontmatter missing required field: name');
  } else {
    if (!NAME_PATTERN.test(name)) {
      errors.push(`name "${name}" must match pattern: lowercase letters, digits, and hyphens only`);
    }
    if (name.length > MAX_NAME_CHARS) {
      errors.push(`name "${name}" is ${name.length} chars — must be ≤${MAX_NAME_CHARS}`);
    }
    if (name.includes('anthropic') || name.includes('claude')) {
      errors.push(`name must not contain "anthropic" or "claude" per Claude Agent Skills spec`);
    }
  }

  // 3. Check description field
  const description = frontmatter['description'];
  if (!description) {
    errors.push('Frontmatter missing required field: description');
  } else if (description.length > MAX_DESCRIPTION_CHARS) {
    errors.push(`description is ${description.length} chars — must be ≤${MAX_DESCRIPTION_CHARS}`);
  }

  // 4. Check body line count
  const bodyLines = body.split('\n').length;
  if (bodyLines > MAX_BODY_LINES) {
    errors.push(`Body is ${bodyLines} lines — must be ≤${MAX_BODY_LINES}`);
  } else if (bodyLines > MAX_BODY_LINES * 0.9) {
    warnings.push(`Body is ${bodyLines} lines — approaching the ${MAX_BODY_LINES}-line limit`);
  }

  return { pass: errors.length === 0, errors, warnings };
}

/**
 * Main execution.
 */
function main(): void {
  if (!existsSync(SKILL_MD_PATH)) {
    console.error(`❌ SKILL.md not found at ${SKILL_MD_PATH}`);
    process.exit(1);
  }

  const content = readFileSync(SKILL_MD_PATH, 'utf-8');
  const result = validate(content);

  if (result.warnings.length > 0) {
    for (const warning of result.warnings) {
      console.warn(`⚠️  ${warning}`);
    }
  }

  if (result.pass) {
    const parsed = parseFrontmatter(content);
    const bodyLines = parsed ? parsed.body.split('\n').length : 0;
    console.log(`✅ SKILL.md is valid`);
    console.log(`   name: ${parsed?.frontmatter['name'] ?? '(missing)'}`);
    console.log(`   description: ${(parsed?.frontmatter['description'] ?? '').length} chars`);
    console.log(`   body: ${bodyLines} lines`);
  } else {
    for (const error of result.errors) {
      console.error(`❌ ${error}`);
    }
    process.exit(1);
  }
}

main();
