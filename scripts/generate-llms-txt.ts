#!/usr/bin/env tsx
/**
 * Generate llms-full.txt from source documentation and API reports.
 *
 * @remarks
 * Reads guide markdown files, API Extractor report, and example docs,
 * then assembles a curated llms-full.txt optimized for coding agents.
 * Output ships in the npm package alongside the hand-curated llms.txt.
 *
 * Run: `npx tsx scripts/generate-llms-txt.ts`
 *
 * @see https://llmstxt.org — the llms.txt specification
 */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname ?? '.', '..');

/* ── Source file paths ─────────────────────────────────────────────────── */

const SOURCES = {
  packageJson: resolve(ROOT, 'package.json'),
  gettingStarted: resolve(ROOT, 'GETTING-STARTED.md'),
  apiReport: resolve(ROOT, 'api-reports/playwright-praman.api.md'),
  selectors: resolve(ROOT, 'docs/docs/guides/selectors.md'),
  fixtures: resolve(ROOT, 'docs/docs/guides/fixtures.md'),
  controlInteractions: resolve(ROOT, 'docs/docs/guides/control-interactions.md'),
  customMatchers: resolve(ROOT, 'docs/docs/guides/custom-matchers.md'),
  navigation: resolve(ROOT, 'docs/docs/guides/navigation.md'),
  authentication: resolve(ROOT, 'docs/docs/guides/authentication.md'),
  configuration: resolve(ROOT, 'docs/docs/guides/configuration.md'),
  errors: resolve(ROOT, 'docs/docs/guides/errors.md'),
  fioriElements: resolve(ROOT, 'docs/docs/guides/fiori-elements.md'),
  odata: resolve(ROOT, 'docs/docs/guides/odata-operations.md'),
  exBasicTest: resolve(ROOT, 'docs/docs/examples/basic-test.md'),
  exDialogHandling: resolve(ROOT, 'docs/docs/examples/dialog-handling.md'),
  exTableOperations: resolve(ROOT, 'docs/docs/examples/table-operations.md'),
} as const;

const OUTPUT = resolve(ROOT, 'llms-full.txt');

/* ── Transform helpers ─────────────────────────────────────────────────── */

/** Remove Docusaurus YAML frontmatter delimited by --- */
function stripFrontmatter(content: string): string {
  const match = /^---\n[\s\S]*?\n---\n/.exec(content);
  return match ? content.slice(match[0].length) : content;
}

/** Remove markdown badge images [![...](...)(...)] and trailing blank lines */
function stripBadges(content: string): string {
  return content.replaceAll(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)\n*/g, '');
}

/** Collapse 3+ consecutive blank lines into 2 */
function collapseBlankLines(content: string): string {
  return content.replaceAll(/\n{3,}/g, '\n\n');
}

/**
 * Clean API Extractor report for LLM consumption.
 *
 * Removes header lines, warning comments, undocumented markers,
 * and the wrapping ```ts fences.
 */
function cleanApiReport(content: string): string {
  const lines = content.split('\n');
  const cleaned: string[] = [];
  let insideFence = false;

  for (const line of lines) {
    // Skip the report header and blockquote
    if (line.startsWith('## API Report File') || line.startsWith('> Do not edit')) {
      continue;
    }
    // Track fences but don't include them
    if (line.startsWith('```')) {
      insideFence = !insideFence;
      continue;
    }
    // Skip warning comments
    if (line.includes('// Warning: (ae-forgotten-export)')) {
      continue;
    }
    // Skip undocumented markers
    if (line.trim() === '// (undocumented)') {
      continue;
    }
    // Skip packageDocumentation comment
    if (line.includes('(No @packageDocumentation comment')) {
      continue;
    }
    cleaned.push(line);
  }

  return collapseBlankLines(cleaned.join('\n').trim());
}

/** Prepare a guide file: strip frontmatter, badges, and collapse blanks */
function prepareGuide(content: string): string {
  return collapseBlankLines(stripBadges(stripFrontmatter(content)).trim());
}

/* ── Main ──────────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  console.log('Generating llms-full.txt...');

  // Read all source files in parallel
  const [
    packageJsonRaw,
    gettingStarted,
    apiReport,
    selectors,
    fixtures,
    controlInteractions,
    customMatchers,
    navigation,
    authentication,
    configuration,
    errors,
    fioriElements,
    odata,
    exBasicTest,
    exDialogHandling,
    exTableOperations,
  ] = await Promise.all([
    readFile(SOURCES.packageJson, 'utf-8'),
    readFile(SOURCES.gettingStarted, 'utf-8'),
    readFile(SOURCES.apiReport, 'utf-8'),
    readFile(SOURCES.selectors, 'utf-8'),
    readFile(SOURCES.fixtures, 'utf-8'),
    readFile(SOURCES.controlInteractions, 'utf-8'),
    readFile(SOURCES.customMatchers, 'utf-8'),
    readFile(SOURCES.navigation, 'utf-8'),
    readFile(SOURCES.authentication, 'utf-8'),
    readFile(SOURCES.configuration, 'utf-8'),
    readFile(SOURCES.errors, 'utf-8'),
    readFile(SOURCES.fioriElements, 'utf-8'),
    readFile(SOURCES.odata, 'utf-8'),
    readFile(SOURCES.exBasicTest, 'utf-8'),
    readFile(SOURCES.exDialogHandling, 'utf-8'),
    readFile(SOURCES.exTableOperations, 'utf-8'),
  ]);

  const pkg = JSON.parse(packageJsonRaw) as { version: string };
  const today = new Date().toISOString().split('T')[0];

  // Assemble sections
  const sections = [
    // Header
    `# playwright-praman`,
    ``,
    `> Agent-First SAP UI5 Test Automation Plugin for Playwright.`,
    `> Version: ${pkg.version} | License: Apache-2.0`,
    `> Install: npm install playwright-praman @playwright/test`,
    `> Import: import { test, expect } from 'playwright-praman'`,
    `> Generated: ${today} from source docs and API reports`,
    ``,

    // Quick Start
    `## Quick Start`,
    ``,
    prepareGuide(gettingStarted),
    ``,

    // Selectors
    `## Selector Reference`,
    ``,
    prepareGuide(selectors),
    ``,

    // Fixtures
    `## Fixtures`,
    ``,
    prepareGuide(fixtures),
    ``,

    // Control Interactions
    `## Control Interactions`,
    ``,
    prepareGuide(controlInteractions),
    ``,

    // Custom Matchers
    `## Custom Matchers`,
    ``,
    prepareGuide(customMatchers),
    ``,

    // Navigation
    `## Navigation`,
    ``,
    prepareGuide(navigation),
    ``,

    // Authentication
    `## Authentication`,
    ``,
    prepareGuide(authentication),
    ``,

    // Configuration
    `## Configuration`,
    ``,
    prepareGuide(configuration),
    ``,

    // Error Codes
    `## Error Codes`,
    ``,
    prepareGuide(errors),
    ``,

    // Fiori Elements
    `## Fiori Elements`,
    ``,
    prepareGuide(fioriElements),
    ``,

    // OData Operations
    `## OData Operations`,
    ``,
    prepareGuide(odata),
    ``,

    // API Signatures
    `## API Signatures`,
    ``,
    `> Public API surface from API Extractor report. TypeScript declaration signatures.`,
    ``,
    '```ts',
    cleanApiReport(apiReport),
    '```',
    ``,

    // Code Examples
    `## Code Examples`,
    ``,
    `### Basic Test`,
    ``,
    prepareGuide(exBasicTest),
    ``,
    `### Dialog Handling`,
    ``,
    prepareGuide(exDialogHandling),
    ``,
    `### Table Operations`,
    ``,
    prepareGuide(exTableOperations),
  ];

  const output = collapseBlankLines(sections.join('\n')).trim() + '\n';
  const lineCount = output.split('\n').length;

  // Self-validation
  const expectedSections = [
    'Quick Start',
    'Selector Reference',
    'Fixtures',
    'Control Interactions',
    'Custom Matchers',
    'Navigation',
    'Authentication',
    'Configuration',
    'Error Codes',
    'Fiori Elements',
    'OData Operations',
    'API Signatures',
    'Code Examples',
  ];

  const missingSections = expectedSections.filter((section) => !output.includes(`## ${section}`));

  if (missingSections.length > 0) {
    console.error(`Missing sections: ${missingSections.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  if (!output.startsWith('# playwright-praman')) {
    console.error('Output must start with "# playwright-praman"');
    process.exitCode = 1;
    return;
  }

  if (lineCount < 600) {
    console.error(`Output too short: ${lineCount} lines (minimum 600)`);
    process.exitCode = 1;
    return;
  }

  if (lineCount > 5000) {
    console.error(`Output too long: ${lineCount} lines (maximum 5000)`);
    process.exitCode = 1;
    return;
  }

  // Write output
  await writeFile(OUTPUT, output, 'utf-8');

  console.log(`llms-full.txt generated: ${OUTPUT}`);
  console.log(`  Lines: ${lineCount}`);
  console.log(`  Size: ${(output.length / 1024).toFixed(1)} KB`);
  console.log(`  Sections: ${expectedSections.length}`);
}

main().catch((error: unknown) => {
  console.error('Failed to generate llms-full.txt:', error);
  process.exitCode = 1;
});
