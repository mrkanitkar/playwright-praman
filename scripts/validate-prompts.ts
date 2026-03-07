#!/usr/bin/env tsx
/**
 * Validate prompt template files against the 16-section mandatory structure.
 *
 * @remarks
 * Reads all `*.prompt.md` files from the `prompts/` directory and validates:
 * - YAML frontmatter with 8 required fields
 * - All 16 mandatory section headings
 * - Token budget compliance per complexity tier
 * - Referenced skill file existence
 *
 * Run: `npx tsx scripts/validate-prompts.ts`
 *
 * @license Apache-2.0
 */

import { readdir, readFile, access } from 'node:fs/promises';
import { resolve, join, basename } from 'node:path';
import process from 'node:process';

const ROOT = resolve(import.meta.dirname ?? '.', '..');
const PROMPTS_DIR = resolve(ROOT, 'prompts');
const SKILLS_DIR = resolve(ROOT, 'skills', 'playwright-praman-sap-testing');
const BLOG_DIR = resolve(ROOT, 'docs', 'blog');

/* ── Constants ─────────────────────────────────────────────────────────── */

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

/** Token budgets by complexity tier */
const TOKEN_BUDGETS: Record<string, number> = {
  low: 3000,
  medium: 4500,
  high: 6000,
};

/* ── Helpers ───────────────────────────────────────────────────────────── */

interface FrontmatterResult {
  fields: Record<string, unknown>;
  errors: string[];
}

/**
 * Parse YAML frontmatter from a markdown file.
 * Uses simple regex splitting on `---` delimiters (no external deps).
 */
function parseFrontmatter(content: string): FrontmatterResult {
  const errors: string[] = [];
  const fields: Record<string, unknown> = {};

  const match = /^---\n([\s\S]*?)\n---/.exec(content);
  if (!match) {
    errors.push('Missing YAML frontmatter (delimited by ---)');
    return { fields, errors };
  }

  const yamlBlock = match[1];
  if (!yamlBlock) {
    errors.push('YAML frontmatter is empty');
    return { fields, errors };
  }

  for (const line of yamlBlock.split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, colonIndex).trim();
    const rawValue = trimmed.slice(colonIndex + 1).trim();

    // Strip surrounding quotes
    let value: unknown = rawValue.replace(/^["']|["']$/g, '');

    // Detect array syntax [...]
    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      value = rawValue
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^["']|["']$/g, ''));
    }

    fields[key] = value;
  }

  return { fields, errors };
}

/**
 * Extract all markdown headings (## level) from content.
 */
function extractHeadings(content: string): string[] {
  const headings: string[] = [];
  for (const line of content.split('\n')) {
    const match = /^#{1,6}\s+(.+)$/.exec(line);
    if (match?.[1]) {
      headings.push(match[1].trim());
    }
  }
  return headings;
}

/**
 * Estimate token count from word count.
 * Approximation: tokens = words / 0.75
 */
function estimateTokens(content: string): number {
  const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
  return Math.ceil(wordCount / 0.75);
}

/**
 * Extract referenced skill file names from the content.
 */
function extractSkillReferences(content: string): string[] {
  const skills: string[] = [];
  const pattern = /skills-[\w-]+\.md/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    if (!skills.includes(match[0])) {
      skills.push(match[0]);
    }
  }

  return skills;
}

/**
 * Check if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

/* ── Validation ────────────────────────────────────────────────────────── */

interface ValidationResult {
  file: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
}

async function validatePromptFile(filePath: string, fileName: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const content = await readFile(filePath, 'utf-8');

  // (a) Parse and validate YAML frontmatter
  const { fields, errors: fmErrors } = parseFrontmatter(content);
  errors.push(...fmErrors);

  // (b) Check required frontmatter fields
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (!(field in fields) || fields[field] === undefined || fields[field] === '') {
      errors.push(`Missing required frontmatter field: ${field}`);
    }
  }

  // (c) Validate complexity
  const complexity = typeof fields['complexity'] === 'string' ? fields['complexity'] : '';
  if (
    complexity &&
    !VALID_COMPLEXITIES.includes(complexity as (typeof VALID_COMPLEXITIES)[number])
  ) {
    errors.push(
      `Invalid complexity "${complexity}" — must be one of: ${VALID_COMPLEXITIES.join(', ')}`,
    );
  }

  // (d) Validate estimated-steps is a positive integer
  const estimatedSteps = fields['estimated-steps'];
  if (estimatedSteps !== undefined) {
    const parsed = Number(estimatedSteps);
    if (!Number.isInteger(parsed) || parsed < 1) {
      errors.push(`estimated-steps must be a positive integer, got: "${String(estimatedSteps)}"`);
    }
  }

  // (e) Check all 16 mandatory section headings (frontmatter counts as section 1)
  const headings = extractHeadings(content);
  for (const section of MANDATORY_SECTIONS) {
    const found = headings.some((heading) => heading.toLowerCase().includes(section.toLowerCase()));
    if (!found) {
      errors.push(`Missing mandatory section: "${section}"`);
    }
  }

  // (f) Token budget check
  const estimatedTokenCount = estimateTokens(content);
  if (complexity && complexity in TOKEN_BUDGETS) {
    const budget = TOKEN_BUDGETS[complexity];
    if (budget !== undefined && estimatedTokenCount > budget) {
      warnings.push(
        `Token estimate (${estimatedTokenCount}) exceeds budget (${budget}) for complexity "${complexity}"`,
      );
    }
  }

  // (g) Check referenced skill files exist
  const skillRefs = extractSkillReferences(content);
  for (const skillFile of skillRefs) {
    const skillPath = join(SKILLS_DIR, skillFile);
    const exists = await fileExists(skillPath);
    if (!exists) {
      errors.push(`Referenced skill file not found: ${skillFile} (expected at ${skillPath})`);
    }
  }

  // (h) Check corresponding blog post exists
  const promptName = basename(fileName, '.prompt.md');
  const blogDirExists = await fileExists(BLOG_DIR);
  if (blogDirExists) {
    const blogFiles = await readdir(BLOG_DIR);
    const hasBlogPost = blogFiles.some(
      (f) => f.includes(`prompt-${promptName}`) && f.endsWith('.md') && !f.startsWith('TEMPLATE'),
    );
    if (!hasBlogPost) {
      warnings.push(
        `No corresponding blog post found for "${promptName}" in docs/blog/ (expected *prompt-${promptName}.md)`,
      );
    }
  }

  return {
    file: fileName,
    passed: errors.length === 0,
    errors,
    warnings,
  };
}

/* ── Main ──────────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  console.log('Validating prompt templates...\n');

  // Check if prompts directory exists
  const promptsDirExists = await fileExists(PROMPTS_DIR);
  if (!promptsDirExists) {
    console.log(`No prompts/ directory found at ${PROMPTS_DIR}`);
    console.log('Nothing to validate.\n');
    return;
  }

  // Read all *.prompt.md files
  const allFiles = await readdir(PROMPTS_DIR);
  const promptFiles = allFiles.filter(
    (file) => file.endsWith('.prompt.md') && file !== 'TEMPLATE.prompt.md',
  );

  if (promptFiles.length === 0) {
    console.log('No *.prompt.md files found in prompts/ directory.');
    console.log('Nothing to validate.\n');
    return;
  }

  console.log(`Found ${promptFiles.length} prompt file(s):\n`);

  const results: ValidationResult[] = [];
  let hasFailures = false;

  for (const fileName of promptFiles) {
    const filePath = join(PROMPTS_DIR, fileName);
    const result = await validatePromptFile(filePath, fileName);
    results.push(result);

    if (!result.passed) {
      hasFailures = true;
    }
  }

  // Print results
  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    const icon = result.passed ? '[PASS]' : '[FAIL]';
    console.log(`${icon} ${result.file} — ${status}`);

    for (const error of result.errors) {
      console.log(`  ERROR: ${error}`);
    }

    for (const warning of result.warnings) {
      console.log(`  WARN:  ${warning}`);
    }

    if (result.errors.length > 0 || result.warnings.length > 0) {
      console.log('');
    }
  }

  // Summary
  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.filter((r) => !r.passed).length;
  console.log(
    `\nSummary: ${passCount} passed, ${failCount} failed out of ${results.length} file(s)`,
  );

  if (hasFailures) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error('Failed to validate prompts:', error);
  process.exitCode = 1;
});
