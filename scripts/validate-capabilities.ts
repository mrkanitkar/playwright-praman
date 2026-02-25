#!/usr/bin/env tsx
/**
 * Validate that capabilities.yaml entries reference real source-code methods.
 *
 * Cross-references YAML entries against @capability TSDoc tags in source files.
 * Exits with code 1 if YAML validation fails. Exits with code 0 otherwise
 * (WARN entries are acceptable — they just mean no @capability tag yet).
 *
 * Run: npm run validate:capabilities
 */

import { readFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { globSync } from 'glob';

import { CapabilitiesYamlSchema } from '../src/ai/schemas/capability.schema.js';
import type { CapabilitiesYaml } from '../src/ai/schemas/capability.schema.js';

/* ── Constants ───────────────────────────────────────────────────────────── */

const ROOT = resolve(import.meta.dirname ?? '.', '..');
const CAPABILITIES_YAML = resolve(ROOT, 'capabilities.yaml');
const SRC_GLOB = 'src/**/*.ts';

/**
 * Regex to capture @capability tag content on a single line in a TSDoc comment.
 * Captures everything after `@capability ` until end of line.
 */
const CAPABILITY_TAG_REGEX = /@capability\s+(.+)/g;

/* ── ANSI colors ─────────────────────────────────────────────────────────── */

const GREEN = '\u001B[32m';
const YELLOW = '\u001B[33m';
const CYAN = '\u001B[36m';
const RED = '\u001B[31m';
const DIM = '\u001B[2m';
const RESET = '\u001B[0m';
const BOLD = '\u001B[1m';

/* ── Types ───────────────────────────────────────────────────────────────── */

interface SourceCapability {
  /** The raw text after @capability tag */
  readonly tagText: string;
  /** Relative file path from project root */
  readonly file: string;
  /** Line number where the tag appears */
  readonly line: number;
}

interface ValidationCounts {
  pass: number;
  warn: number;
  info: number;
  total: number;
}

/* ── Step 1: Read and validate capabilities.yaml ─────────────────────────── */

function readAndValidateYaml(): CapabilitiesYaml | null {
  console.log(`${BOLD}Validating capabilities.yaml...${RESET}`);
  console.log();

  let rawContent: string;
  try {
    rawContent = readFileSync(CAPABILITIES_YAML, 'utf-8');
  } catch {
    console.error(`${RED}ERROR: Could not read ${CAPABILITIES_YAML}${RESET}`);
    return null;
  }

  const parsed: unknown = parseYaml(rawContent);

  try {
    return CapabilitiesYamlSchema.parse(parsed);
  } catch (error: unknown) {
    console.error(`${RED}ERROR: capabilities.yaml failed Zod validation:${RESET}`);
    console.error(error);
    return null;
  }
}

/* ── Step 2: Scan source files for @capability tags ──────────────────────── */

function scanSourceForCapabilityTags(): SourceCapability[] {
  const sourceFiles = globSync(SRC_GLOB, { cwd: ROOT, absolute: true });
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
          file: relative(ROOT, filePath),
          line: lineIndex + 1,
        });
      }
    }
  }

  return capabilities;
}

/* ── Step 3: Cross-reference ─────────────────────────────────────────────── */

/**
 * Check if a YAML capability's qualifiedName or name appears in any @capability tag.
 */
function findMatchingTag(
  qualifiedName: string,
  name: string,
  sourceTags: readonly SourceCapability[],
): SourceCapability | undefined {
  return sourceTags.find((tag) => {
    const tagLower = tag.tagText.toLowerCase();
    // Check if qualifiedName or name appears in the tag text
    return tagLower.includes(qualifiedName.toLowerCase()) || tagLower.includes(name.toLowerCase());
  });
}

/**
 * Check if a source @capability tag matches any YAML entry.
 */
function isTagReferencedInYaml(tag: SourceCapability, yamlData: CapabilitiesYaml): boolean {
  const tagLower = tag.tagText.toLowerCase();
  return yamlData.capabilities.some((entry) => {
    return (
      tagLower.includes(entry.qualifiedName.toLowerCase()) ||
      tagLower.includes(entry.name.toLowerCase())
    );
  });
}

/* ── Step 4: Print report ────────────────────────────────────────────────── */

function printReport(
  yamlData: CapabilitiesYaml,
  sourceTags: readonly SourceCapability[],
): ValidationCounts {
  const counts: ValidationCounts = {
    pass: 0,
    warn: 0,
    info: 0,
    total: yamlData.capabilities.length,
  };

  console.log(
    `${BOLD}Cross-referencing ${String(yamlData.capabilities.length)} YAML entries against ${String(sourceTags.length)} source @capability tags...${RESET}`,
  );
  console.log();

  // Check each YAML entry against source tags
  for (const entry of yamlData.capabilities) {
    const match = findMatchingTag(entry.qualifiedName, entry.name, sourceTags);
    if (match !== undefined) {
      counts.pass++;
      console.log(
        `  ${GREEN}\u2713${RESET} ${entry.id} ${DIM}${entry.qualifiedName}${RESET} ${DIM}\u2190 ${match.file}:${String(match.line)}${RESET}`,
      );
    } else {
      counts.warn++;
      console.log(
        `  ${YELLOW}\u26A0${RESET} ${entry.id} ${DIM}${entry.qualifiedName}${RESET} ${YELLOW}(no @capability tag in source)${RESET}`,
      );
    }
  }

  console.log();

  // Check for orphaned @capability tags (in source but not in YAML)
  const orphanedTags = sourceTags.filter((tag) => !isTagReferencedInYaml(tag, yamlData));
  if (orphanedTags.length > 0) {
    counts.info = orphanedTags.length;
    console.log(`${BOLD}Source @capability tags without YAML entries:${RESET}`);
    console.log();
    for (const tag of orphanedTags) {
      console.log(
        `  ${CYAN}i${RESET} ${tag.file}:${String(tag.line)} ${DIM}@capability ${tag.tagText}${RESET}`,
      );
    }
    console.log();
  }

  return counts;
}

function printSummary(counts: ValidationCounts): void {
  console.log(`${BOLD}${'='.repeat(60)}${RESET}`);
  console.log(`${BOLD}Summary${RESET}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total YAML entries:  ${String(counts.total)}`);
  console.log(`  ${GREEN}\u2713 PASS${RESET} (matched):     ${String(counts.pass)}`);
  console.log(`  ${YELLOW}\u26A0 WARN${RESET} (no tag):      ${String(counts.warn)}`);
  console.log(`  ${CYAN}i INFO${RESET} (orphan tags):  ${String(counts.info)}`);
  console.log(`${'='.repeat(60)}`);
  console.log();

  if (counts.warn > 0) {
    console.log(
      `${YELLOW}Note: ${String(counts.warn)} YAML entries have no @capability tag in source.${RESET}`,
    );
    console.log(`${DIM}This is OK — add @capability TSDoc tags to improve traceability.${RESET}`);
    console.log();
  }

  if (counts.info > 0) {
    console.log(
      `${CYAN}Note: ${String(counts.info)} source @capability tags have no matching YAML entry.${RESET}`,
    );
    console.log(
      `${DIM}Consider adding these to capabilities.yaml if they represent public API.${RESET}`,
    );
    console.log();
  }

  console.log(`${GREEN}Validation passed.${RESET}`);
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

function main(): void {
  // Step 1: Read and validate YAML
  const yamlData = readAndValidateYaml();
  if (yamlData === null) {
    console.error(`${RED}Validation FAILED — capabilities.yaml is invalid.${RESET}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `  ${GREEN}\u2713${RESET} capabilities.yaml is valid (${String(yamlData.capabilities.length)} entries, ${String(Object.keys(yamlData.categories).length)} categories)`,
  );
  console.log();

  // Step 2: Scan source files
  console.log(`${BOLD}Scanning source files for @capability tags...${RESET}`);
  const sourceTags = scanSourceForCapabilityTags();
  console.log(`  Found ${String(sourceTags.length)} @capability tags in source`);
  console.log();

  // Step 3 & 4: Cross-reference and print report
  const counts = printReport(yamlData, sourceTags);

  // Step 5: Print summary
  printSummary(counts);

  // Exit 0 — YAML is valid. WARN entries are acceptable.
  process.exitCode = 0;
}

main();
