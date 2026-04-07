#!/usr/bin/env tsx
/**
 * Validate that capabilities.yaml entries reference real source-code methods,
 * and that public exports have @capability TSDoc tags.
 *
 * Cross-references YAML entries against @capability TSDoc tags in source files.
 * Detects exports missing @capability tags and validates tag format.
 *
 * Flags:
 *   --strict   Exit with code 1 if any export is missing @capability or
 *              any tag value does not match a qualifiedName in capabilities.yaml.
 *
 * Run: npm run validate:capabilities
 *      npm run validate:capabilities -- --strict
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

import { CapabilitiesYamlSchema } from '../src/ai/schemas/capability.schema.js';
import type { CapabilitiesYaml } from '../src/ai/schemas/capability.schema.js';
import {
  scanSourceForCapabilityTags,
  scanExportsForCapabilityTags,
  computeDirectoryCoverage,
  validateTagFormat,
  GREEN,
  YELLOW,
  CYAN,
  RED,
  DIM,
  RESET,
  BOLD,
} from './capability-validation-utils.js';
import type { SourceCapability } from './capability-validation-utils.js';

/* ── Constants ───────────────────────────────────────────────────────────── */

const ROOT = resolve(import.meta.dirname ?? '.', '..');
const CAPABILITIES_YAML = resolve(ROOT, 'capabilities.yaml');
const SRC_GLOB = 'src/**/*.ts';
const IS_STRICT = process.argv.includes('--strict');

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

/* ── Step 2: Cross-reference YAML ↔ source tags ─────────────────────────── */

function findMatchingTag(
  qualifiedName: string,
  name: string,
  sourceTags: readonly SourceCapability[],
): SourceCapability | undefined {
  return sourceTags.find((tag) => {
    const tagLower = tag.tagText.toLowerCase();
    return tagLower.includes(qualifiedName.toLowerCase()) || tagLower.includes(name.toLowerCase());
  });
}

function isTagReferencedInYaml(tag: SourceCapability, yamlData: CapabilitiesYaml): boolean {
  const tagLower = tag.tagText.toLowerCase();
  return yamlData.capabilities.some((entry) => {
    return (
      tagLower.includes(entry.qualifiedName.toLowerCase()) ||
      tagLower.includes(entry.name.toLowerCase())
    );
  });
}

interface CrossRefCounts {
  pass: number;
  warn: number;
  info: number;
  total: number;
}

function printCrossRefReport(
  yamlData: CapabilitiesYaml,
  sourceTags: readonly SourceCapability[],
): CrossRefCounts {
  const counts: CrossRefCounts = { pass: 0, warn: 0, info: 0, total: yamlData.capabilities.length };

  console.log(
    `${BOLD}Cross-referencing ${String(counts.total)} YAML entries against ${String(sourceTags.length)} source @capability tags...${RESET}`,
  );
  console.log();

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

/* ── Step 3: Export coverage + format validation ─────────────────────────── */

function printExportCoverageReport(root: string): { missing: number; total: number } {
  console.log(`${BOLD}Scanning exports for @capability tags...${RESET}`);
  const exports = scanExportsForCapabilityTags(root, SRC_GLOB);
  const missing = exports.filter((e) => !e.hasCapabilityTag);

  console.log(`  Found ${String(exports.length)} exports, ${String(missing.length)} missing @capability`);
  console.log();

  if (missing.length > 0) {
    console.log(`${BOLD}Exports missing @capability tag:${RESET}`);
    console.log();
    for (const exp of missing) {
      console.log(`  ${YELLOW}\u26A0${RESET} ${exp.file}:${String(exp.line)} ${DIM}${exp.name}${RESET}`);
    }
    console.log();
  }

  // Per-directory coverage table
  const coverage = computeDirectoryCoverage(exports);
  console.log(`${BOLD}Per-directory coverage:${RESET}`);
  console.log();
  console.log(`  ${'Directory'.padEnd(25)} ${'Tagged'.padStart(7)} ${'Total'.padStart(7)} ${'Coverage'.padStart(9)}`);
  console.log(`  ${'-'.repeat(25)} ${'-'.repeat(7)} ${'-'.repeat(7)} ${'-'.repeat(9)}`);
  for (const dir of coverage) {
    const color = dir.coveragePercent >= 90 ? GREEN : dir.coveragePercent >= 50 ? YELLOW : RED;
    console.log(
      `  ${dir.directory.padEnd(25)} ${String(dir.taggedExports).padStart(7)} ${String(dir.totalExports).padStart(7)} ${color}${String(dir.coveragePercent).padStart(8)}%${RESET}`,
    );
  }
  console.log();

  return { missing: missing.length, total: exports.length };
}

function printFormatValidationReport(
  sourceTags: readonly SourceCapability[],
  yamlData: CapabilitiesYaml,
): number {
  const qualifiedNames = new Set(yamlData.capabilities.map((c) => c.qualifiedName));
  const invalid = validateTagFormat(sourceTags, qualifiedNames);

  if (invalid.length > 0) {
    console.log(`${BOLD}Tags not matching any qualifiedName in capabilities.yaml:${RESET}`);
    console.log();
    for (const tag of invalid) {
      console.log(
        `  ${RED}\u2717${RESET} ${tag.file}:${String(tag.line)} ${DIM}@capability ${tag.tagText}${RESET}`,
      );
    }
    console.log();
  }

  return invalid.length;
}

/* ── Step 4: Summary ─────────────────────────────────────────────────────── */

function printSummary(
  crossRef: CrossRefCounts,
  exportStats: { missing: number; total: number },
  invalidFormat: number,
): void {
  console.log(`${BOLD}${'='.repeat(60)}${RESET}`);
  console.log(`${BOLD}Summary${RESET}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  YAML entries:           ${String(crossRef.total)}`);
  console.log(`  ${GREEN}\u2713 PASS${RESET} (YAML↔source):   ${String(crossRef.pass)}`);
  console.log(`  ${YELLOW}\u26A0 WARN${RESET} (no source tag): ${String(crossRef.warn)}`);
  console.log(`  ${CYAN}i INFO${RESET} (orphan tags):    ${String(crossRef.info)}`);
  console.log();
  console.log(`  Exports scanned:        ${String(exportStats.total)}`);
  console.log(`  Exports missing tag:    ${String(exportStats.missing)}`);
  console.log(`  Invalid tag format:     ${String(invalidFormat)}`);
  console.log(`${'='.repeat(60)}`);
  console.log();

  if (IS_STRICT && (exportStats.missing > 0 || invalidFormat > 0)) {
    console.log(`${RED}STRICT MODE: Validation FAILED.${RESET}`);
    if (exportStats.missing > 0) {
      console.log(`  ${RED}${String(exportStats.missing)} exports missing @capability tag.${RESET}`);
    }
    if (invalidFormat > 0) {
      console.log(`  ${RED}${String(invalidFormat)} tags do not match a qualifiedName.${RESET}`);
    }
    console.log();
    process.exitCode = 1;
    return;
  }

  console.log(`${GREEN}Validation passed.${RESET}`);
  if (IS_STRICT) {
    console.log(`${DIM}(strict mode — all checks passed)${RESET}`);
  }
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

function main(): void {
  if (IS_STRICT) {
    console.log(`${BOLD}${CYAN}Running in --strict mode${RESET}`);
    console.log();
  }

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

  // Step 2: Scan source tags and cross-reference
  console.log(`${BOLD}Scanning source files for @capability tags...${RESET}`);
  const sourceTags = scanSourceForCapabilityTags(ROOT, SRC_GLOB);
  console.log(`  Found ${String(sourceTags.length)} @capability tags in source`);
  console.log();

  const crossRef = printCrossRefReport(yamlData, sourceTags);

  // Step 3: Export coverage
  const exportStats = printExportCoverageReport(ROOT);

  // Step 4: Format validation
  const invalidFormat = printFormatValidationReport(sourceTags, yamlData);

  // Step 5: Summary
  printSummary(crossRef, exportStats, invalidFormat);
}

main();
