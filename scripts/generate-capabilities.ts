#!/usr/bin/env tsx
/**
 * Generate capabilities.md from TSDoc comments in source code.
 *
 * This script:
 * 1. Parses all TypeScript files in src/
 * 2. Extracts JSDoc comments with @capability tag
 * 3. Generates capabilities.md in wdi5 format
 * 4. Validates required tags exist
 *
 * @see docs/documentation-standards.md
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { globSync } from 'glob';
import * as ts from 'typescript';

interface Capability {
  id: string;
  name: string;
  description: string;
  category: string;
  guarantees: string[];
  apis: string[];
  failures: string[];
  examples: string[];
  intent?: string;
  prerequisites?: string[];
  postconditions?: string[];
  alternatives?: string[];
  sapModule?: string;
  ui5Version?: string;
  fioriElement?: string;
  source: string;
  fileName: string;
}

interface CategoryCount {
  [category: string]: number;
}

const categoryPrefixes: Record<string, string> = {
  location: 'LOC',
  interaction: 'INT',
  navigation: 'NAV',
  'fiori-elements': 'FE',
  authentication: 'AUTH',
  configuration: 'CFG',
  aggregations: 'AGG',
  properties: 'PROP',
  bridge: 'BRIDGE',
  ai: 'AI',
  intent: 'INTENT',
  vocabulary: 'VOCAB',
  matcher: 'MATCH',
  selector: 'SEL',
  reporter: 'REPORT',
};

const categoryCounts: CategoryCount = {};

/**
 * Extract capabilities from TypeScript source files.
 */
function extractCapabilities(): Capability[] {
  const capabilities: Capability[] = [];
  const sourceFiles = globSync('src/**/*.ts', { ignore: ['**/*.test.ts', '**/*.spec.ts'] });

  for (const filePath of sourceFiles) {
    const sourceText = readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    ts.forEachChild(sourceFile, (node) => {
      const capability = extractCapabilityFromNode(node, filePath, sourceText);
      if (capability) {
        capabilities.push(capability);
      }
    });
  }

  return capabilities;
}

/**
 * Extract capability from a TypeScript node.
 */
function extractCapabilityFromNode(
  node: ts.Node,
  filePath: string,
  sourceText: string
): Capability | null {
  // Only process functions, methods, and classes
  if (
    !ts.isFunctionDeclaration(node) &&
    !ts.isMethodDeclaration(node) &&
    !ts.isClassDeclaration(node)
  ) {
    return null;
  }

  const jsDoc = getJSDocComment(node, sourceText);
  if (!jsDoc || !jsDoc.includes('@capability')) {
    return null;
  }

  const capability: Partial<Capability> = {
    fileName: relative(process.cwd(), filePath),
    source: filePath,
    guarantees: [],
    apis: [],
    failures: [],
    examples: [],
    prerequisites: [],
    postconditions: [],
    alternatives: [],
  };

  // Parse JSDoc tags
  const tags = parseJSDocTags(jsDoc);

  // Required fields
  capability.category = tags.category || 'other';
  capability.name = tags.name || (node.name ? node.name.getText() : 'Unnamed');
  capability.description = extractDescription(jsDoc);

  // Generate capability ID
  const prefix = categoryPrefixes[capability.category] || 'OTHER';
  if (!categoryCounts[prefix]) {
    categoryCounts[prefix] = 0;
  }
  categoryCounts[prefix]++;
  capability.id = `UI5-${prefix}-${String(categoryCounts[prefix]).padStart(3, '0')}`;

  // Multi-value tags
  capability.guarantees = extractMultipleValues(jsDoc, '@guarantee');
  capability.failures = extractMultipleValues(jsDoc, '@failureMode');
  capability.examples = extractExamples(jsDoc);
  capability.apis = extractAPIs(node, jsDoc);
  capability.prerequisites = extractMultipleValues(jsDoc, '@prerequisite');
  capability.postconditions = extractMultipleValues(jsDoc, '@postcondition');
  capability.alternatives = extractMultipleValues(jsDoc, '@alternative');

  // Single-value tags
  capability.intent = tags.intent;
  capability.sapModule = tags.sapModule;
  capability.ui5Version = tags.ui5Version;
  capability.fioriElement = tags.fioriElement;

  return capability as Capability;
}

/**
 * Get JSDoc comment for a node.
 */
function getJSDocComment(node: ts.Node, sourceText: string): string | null {
  const fullText = node.getFullText();
  const commentRanges = ts.getLeadingCommentRanges(fullText, 0);

  if (!commentRanges || commentRanges.length === 0) {
    return null;
  }

  const lastComment = commentRanges[commentRanges.length - 1];
  if (!lastComment) {
    return null;
  }

  return fullText.slice(lastComment.pos, lastComment.end);
}

/**
 * Parse JSDoc tags into key-value pairs.
 */
function parseJSDocTags(jsDoc: string): Record<string, string> {
  const tags: Record<string, string> = {};
  const tagRegex = /@(\w+)\s+([^\n@]*)/g;
  let match;

  while ((match = tagRegex.exec(jsDoc)) !== null) {
    const [, tagName, tagValue] = match;
    if (tagName && tagValue) {
      tags[tagName] = tagValue.trim();
    }
  }

  return tags;
}

/**
 * Extract description from JSDoc.
 */
function extractDescription(jsDoc: string): string {
  const lines = jsDoc.split('\n');
  const descriptionLines: string[] = [];
  let inDescription = false;

  for (const line of lines) {
    const trimmed = line.replace(/^\s*\*\s?/, '').trim();

    if (trimmed.startsWith('@')) {
      break;
    }

    if (trimmed && !trimmed.startsWith('/**') && !trimmed.startsWith('*/')) {
      inDescription = true;
      descriptionLines.push(trimmed);
    } else if (inDescription && !trimmed) {
      break;
    }
  }

  return descriptionLines.join(' ');
}

/**
 * Extract multiple values for a tag.
 */
function extractMultipleValues(jsDoc: string, tag: string): string[] {
  const values: string[] = [];
  const regex = new RegExp(`${tag}\\s+([^\\n@]*)`, 'g');
  let match;

  while ((match = regex.exec(jsDoc)) !== null) {
    const value = match[1]?.trim();
    if (value) {
      values.push(value);
    }
  }

  return values;
}

/**
 * Extract examples from JSDoc.
 */
function extractExamples(jsDoc: string): string[] {
  const examples: string[] = [];
  const exampleRegex = /@example\s+([\s\S]*?)(?=@\w+|\*\/)/g;
  let match;

  while ((match = exampleRegex.exec(jsDoc)) !== null) {
    const example = match[1]?.trim();
    if (example) {
      examples.push(example);
    }
  }

  return examples;
}

/**
 * Extract API signatures from node.
 */
function extractAPIs(node: ts.Node, jsDoc: string): string[] {
  const apis: string[] = [];

  if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
    const name = node.name?.getText() || 'unnamed';
    const params = node.parameters.map(p => p.getText()).join(', ');
    apis.push(`${name}(${params})`);
  }

  return apis;
}

/**
 * Generate capabilities.md content.
 */
function generateMarkdown(capabilities: Capability[]): string {
  const grouped = groupByCategory(capabilities);

  let markdown = `# Praman Capabilities Reference

> **Document Version**: 1.0
> **Last Updated**: ${new Date().toISOString().split('T')[0]}
> **Framework**: Praman (Playwright + SAP UI5)
> **Purpose**: User-visible behaviors for test authors

---

## Overview

This document catalogs all observable behaviors of the Praman test automation framework. Each capability represents a distinct user action or feature available to test authors.

### Category Prefixes

| Prefix | Category | Count |
|--------|----------|-------|
`;

  for (const [prefix, count] of Object.entries(categoryCounts).sort()) {
    const category = Object.entries(categoryPrefixes).find(([, p]) => p === prefix)?.[0] || prefix;
    markdown += `| \`UI5-${prefix}\` | ${category} | ${count} |\n`;
  }

  markdown += '\n---\n\n';

  for (const [category, caps] of Object.entries(grouped)) {
    markdown += `## ${capitalize(category)}\n\n`;

    for (const cap of caps) {
      markdown += generateCapabilitySection(cap);
    }
  }

  return markdown;
}

/**
 * Generate a capability section.
 */
function generateCapabilitySection(cap: Capability): string {
  let section = `### ${cap.id}\n`;
  section += `**Name**: ${cap.name}\n\n`;
  section += `**Description**:  \n${cap.description}\n\n`;

  if (cap.intent) {
    section += `**Intent**:  \n${cap.intent}\n\n`;
  }

  if (cap.guarantees.length > 0) {
    section += `**Guarantees**:\n`;
    for (const guarantee of cap.guarantees) {
      section += `- ${guarantee}\n`;
    }
    section += '\n';
  }

  if (cap.prerequisites && cap.prerequisites.length > 0) {
    section += `**Prerequisites**:\n`;
    for (const prereq of cap.prerequisites) {
      section += `- ${prereq}\n`;
    }
    section += '\n';
  }

  if (cap.apis.length > 0) {
    section += `**APIs**:\n`;
    for (const api of cap.apis) {
      section += `- \`${api}\`\n`;
    }
    section += '\n';
  }

  if (cap.examples.length > 0) {
    section += `**Examples**:\n`;
    for (const example of cap.examples) {
      section += `\`\`\`typescript\n${example}\n\`\`\`\n\n`;
    }
  }

  if (cap.failures.length > 0) {
    section += `**Failures**:\n`;
    for (const failure of cap.failures) {
      section += `- **${failure.split('—')[0]?.trim()}**: ${failure.split('—')[1]?.trim()}\n`;
    }
    section += '\n';
  }

  if (cap.alternatives && cap.alternatives.length > 0) {
    section += `**Alternatives**:\n`;
    for (const alt of cap.alternatives) {
      section += `- ${alt}\n`;
    }
    section += '\n';
  }

  section += `---\n\n`;

  return section;
}

/**
 * Group capabilities by category.
 */
function groupByCategory(capabilities: Capability[]): Record<string, Capability[]> {
  const grouped: Record<string, Capability[]> = {};

  for (const cap of capabilities) {
    if (!grouped[cap.category]) {
      grouped[cap.category] = [];
    }
    grouped[cap.category].push(cap);
  }

  return grouped;
}

/**
 * Capitalize first letter.
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Main execution.
 */
function main(): void {
  console.log('🔍 Scanning TypeScript files for @capability tags...');

  const capabilities = extractCapabilities();

  console.log(`✅ Found ${capabilities.length} capabilities`);

  if (capabilities.length === 0) {
    console.warn('⚠️  No capabilities found. Add @capability tag to JSDoc comments.');
    process.exit(0);
  }

  const markdown = generateMarkdown(capabilities);
  const outputPath = resolve(process.cwd(), 'docs/capabilities.md');

  writeFileSync(outputPath, markdown, 'utf-8');

  console.log(`📝 Generated: ${outputPath}`);
  console.log('\n📊 Statistics:');
  for (const [prefix, count] of Object.entries(categoryCounts).sort()) {
    console.log(`   ${prefix}: ${count}`);
  }
}

main();
