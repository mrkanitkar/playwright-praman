#!/usr/bin/env node
/**
 * fix-api-descriptions.mjs
 *
 * Post-processes TypeDoc-generated markdown files to add proper SEO descriptions.
 *
 * Problem: TypeDoc puts "Defined in: [src/...ts:NN]" as the first paragraph,
 * and Docusaurus uses the first paragraph as the meta description.
 * This results in garbage descriptions like "Defined in107" in Google search results.
 *
 * Solution: Extract the first meaningful paragraph (skipping "Defined in:" lines)
 * and add it as a `description` field in the front matter.
 *
 * Run: node scripts/fix-api-descriptions.mjs
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const API_DOCS_DIR = join(import.meta.dirname, '..', 'docs', 'api');
const SKIP_PATTERNS = [
  /^Defined in:/i,
  /^Re-?exports/i,
  /^\[.*\]\(.*\)$/, // bare links
  /^#+\s/, // headings
  /^\s*$/, // empty lines
  /^>\s/, // blockquotes (TypeDoc function signatures)
  /^`\*\*/, // bold code blocks
  /^\*\*`/, // bold inline code
  /^[|]/, // table rows
  /^---/, // horizontal rules
  /^```/, // code fences
  /^\*\*`[A-Z]/, // TypeDoc tag annotations like **`Ai`**
  /^Optional$/, // bare "Optional" text
  /^Readonly$/, // bare "Readonly" text
];

/**
 * Extract a meaningful description from TypeDoc markdown content.
 * Skips "Defined in:", headings, and empty lines.
 * Returns the first real paragraph, truncated to 160 chars for SEO.
 */
function extractDescription(content, filePath) {
  // Strip existing front matter
  let body = content;
  if (content.startsWith('---')) {
    const endIdx = content.indexOf('---', 3);
    if (endIdx !== -1) {
      body = content.slice(endIdx + 3).trim();
    }
  }

  const lines = body.split('\n');
  const paragraphs = [];
  let currentParagraph = '';

  for (const line of lines) {
    const trimmed = line.trim();

    // Empty line = end of paragraph
    if (trimmed === '') {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
      continue;
    }

    // Skip headings
    if (trimmed.startsWith('#')) {
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
      continue;
    }

    currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
  }
  if (currentParagraph) {
    paragraphs.push(currentParagraph.trim());
  }

  // Find first meaningful paragraph
  for (const para of paragraphs) {
    const isSkippable = SKIP_PATTERNS.some((pattern) => pattern.test(para));
    if (isSkippable) continue;

    // Strip markdown links but keep text
    let clean = para.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
    // Strip inline code backticks
    clean = clean.replace(/`([^`]*)`/g, '$1');
    // Strip bold/italic
    clean = clean.replace(/\*\*([^*]*)\*\*/g, '$1');
    clean = clean.replace(/\*([^*]*)\*/g, '$1');
    // Collapse whitespace
    clean = clean.replace(/\s+/g, ' ').trim();

    if (clean.length < 10) continue;

    // Truncate to 155 chars for SEO (Google shows ~155-160)
    if (clean.length > 155) {
      clean = clean.slice(0, 152) + '...';
    }
    return clean;
  }

  // Fallback: generate from file path
  const rel = relative(API_DOCS_DIR, filePath);
  const parts = rel.replace(/\.md$/, '').split('/');

  if (parts.length >= 3) {
    // e.g., index/classes/PramanError -> "PramanError class — Praman API reference"
    const name = parts[parts.length - 1];
    const kind = parts[parts.length - 2].replace(/s$/, ''); // "classes" -> "class"
    const module = parts[0] === 'index' ? 'core' : parts[0];
    return `${name} ${kind} from the ${module} module — playwright-praman API reference.`;
  }

  return `playwright-praman API reference — Agent-First SAP UI5 Test Automation Plugin for Playwright.`;
}

/**
 * Check if file already has a GOOD description in front matter.
 * Returns false if description is garbage (e.g., starts with ">", "Defined in", etc.)
 */
function hasGoodDescription(content) {
  if (!content.startsWith('---')) return false;
  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) return false;
  const frontMatter = content.slice(3, endIdx);
  const match = frontMatter.match(/^description:\s*"?([^"\n]*)"?/m);
  if (!match) return false;
  const desc = match[1].trim();
  // Reject garbage descriptions
  if (desc.startsWith('>')) return false;
  if (/^Defined in/i.test(desc)) return false;
  if (desc.length < 15) return false;
  return true;
}

/**
 * Add or update description in front matter.
 */
function addDescription(content, description) {
  // Escape quotes in description for YAML
  const escaped = description.replace(/"/g, '\\"');

  if (content.startsWith('---')) {
    const endIdx = content.indexOf('---', 3);
    if (endIdx !== -1) {
      let frontMatter = content.slice(3, endIdx).trim();
      // Replace existing description or add new one
      if (/^description:/m.test(frontMatter)) {
        frontMatter = frontMatter.replace(/^description:.*$/m, `description: "${escaped}"`);
      } else {
        frontMatter += `\ndescription: "${escaped}"`;
      }
      return `---\n${frontMatter}\n---${content.slice(endIdx + 3)}`;
    }
  }

  // No front matter exists — add one
  return `---\ndescription: "${escaped}"\n---\n\n${content}`;
}

/**
 * Recursively process all .md files in a directory.
 */
async function processDirectory(dir) {
  let fixed = 0;
  let skipped = 0;
  let errors = 0;

  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip duplicate directories (ai 2, fe 2, etc.)
    if (entry.name.includes(' ')) {
      continue;
    }

    if (entry.isDirectory()) {
      const result = await processDirectory(fullPath);
      fixed += result.fixed;
      skipped += result.skipped;
      errors += result.errors;
      continue;
    }

    if (!entry.name.endsWith('.md')) continue;

    try {
      const content = await readFile(fullPath, 'utf-8');

      if (hasGoodDescription(content)) {
        skipped++;
        continue;
      }

      const description = extractDescription(content, fullPath);
      if (!description) {
        skipped++;
        continue;
      }

      const updated = addDescription(content, description);
      await writeFile(fullPath, updated, 'utf-8');
      fixed++;

      const rel = relative(API_DOCS_DIR, fullPath);
      console.log(`  + ${rel}: "${description.slice(0, 60)}..."`);
    } catch (err) {
      errors++;
      console.error(`  ! Error processing ${fullPath}: ${err.message}`);
    }
  }

  return { fixed, skipped, errors };
}

// ── Main ──
console.log('fix-api-descriptions: Adding SEO descriptions to TypeDoc pages...\n');

try {
  await stat(API_DOCS_DIR);
} catch {
  console.error(`API docs directory not found: ${API_DOCS_DIR}`);
  console.error('Run TypeDoc first, then run this script.');
  process.exit(1);
}

const { fixed, skipped, errors } = await processDirectory(API_DOCS_DIR);

console.log(`\nDone: ${fixed} fixed, ${skipped} skipped, ${errors} errors.`);
