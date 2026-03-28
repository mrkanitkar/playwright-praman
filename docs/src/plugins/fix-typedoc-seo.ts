/**
 * fix-typedoc-seo — Docusaurus plugin that fixes TypeDoc-generated meta descriptions.
 *
 * Problem: TypeDoc puts function signatures or "Defined in:" as the first paragraph.
 * Docusaurus uses the first paragraph as <meta name="description">, producing
 * garbage descriptions in Google search results.
 *
 * Solution: This plugin uses the `postBuild` hook to rewrite meta description tags
 * in the final HTML files. This runs AFTER all content is generated and built,
 * guaranteeing TypeDoc has already produced its output.
 *
 * Two-phase approach:
 * 1. Factory phase: patches markdown files (helps dev server / loadContent)
 * 2. postBuild phase: patches built HTML files (guarantees production correctness)
 */

import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { LoadContext, Plugin } from '@docusaurus/types';

const SKIP_PATTERNS = [
  /^Defined in:/i,
  /^Re-?exports/i,
  /^\[.*\]\(.*\)$/,
  /^#+\s/,
  /^\s*$/,
  /^>\s/,
  /^\*\*`[A-Z]/,
  /^[|]/,
  /^---/,
  /^```/,
  /^Optional$/,
  /^Readonly$/,
  /^-\s*\[/, // markdown list of links (e.g., "- [TypeName](link)")
  /^-\s+\w+$/, // single bare list item
];

function extractDescriptionFromMarkdown(
  content: string,
  filePath: string,
  apiDocsDir: string,
): string | null {
  let body = content;
  if (content.startsWith('---')) {
    const endIdx = content.indexOf('---', 3);
    if (endIdx !== -1) body = content.slice(endIdx + 3).trim();
  }

  const paragraphs: string[] = [];
  let cur = '';
  let inCodeBlock = false;
  for (const line of body.split('\n')) {
    const t = line.trim();
    if (t.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;
    if (t === '') {
      if (cur) {
        paragraphs.push(cur.trim());
        cur = '';
      }
      continue;
    }
    if (t.startsWith('#')) {
      if (cur) {
        paragraphs.push(cur.trim());
        cur = '';
      }
      continue;
    }
    cur += (cur ? ' ' : '') + t;
  }
  if (cur) paragraphs.push(cur.trim());

  for (const para of paragraphs) {
    if (SKIP_PATTERNS.some((p) => p.test(para))) continue;
    let clean = para
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/\*\*([^*]*)\*\*/g, '$1')
      .replace(/\*([^*]*)\*/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
    if (clean.length < 10) continue;
    return clean.length > 155 ? clean.slice(0, 152) + '...' : clean;
  }

  // Fallback from file path
  const rel = relative(apiDocsDir, filePath);
  const parts = rel.replace(/\.md$/, '').split('/');
  if (parts.length >= 3) {
    const name = parts[parts.length - 1];
    const kind = parts[parts.length - 2].replace(/s$/, '');
    const mod = parts[0] === 'index' ? 'core' : parts[0];
    return `${name} ${kind} — playwright-praman ${mod} module API reference.`;
  }
  return `playwright-praman API reference — SAP UI5 Test Automation Plugin for Playwright.`;
}

function patchMarkdownDescription(content: string, description: string): string {
  const escaped = description.replace(/"/g, '\\"');
  if (content.startsWith('---')) {
    const endIdx = content.indexOf('---', 3);
    if (endIdx !== -1) {
      let fm = content.slice(3, endIdx).trim();
      if (/^description:/m.test(fm)) {
        fm = fm.replace(/^description:.*$/m, `description: "${escaped}"`);
      } else {
        fm += `\ndescription: "${escaped}"`;
      }
      return `---\n${fm}\n---${content.slice(endIdx + 3)}`;
    }
  }
  return `---\ndescription: "${escaped}"\n---\n\n${content}`;
}

/** Checks if a description looks like garbage (signature, "Defined in", too short) */
function isBadDescription(desc: string): boolean {
  if (desc.length < 15) return true;
  if (/^Defined in/i.test(desc)) return true;
  // Function signatures: name(...): Type or name\(...\): Type (escaped)
  if (/^\w+[\w<>]*\\?\(.*\\?\)/.test(desc) && /[):]/.test(desc)) return true;
  if (desc.startsWith('>')) return true;
  if (desc.startsWith('- ')) return true; // list items
  if (/^(Example|Remarks|Extends|Extended by)$/i.test(desc.trim())) return true;
  // HTML-escaped function signatures
  if (/^\w+.*\\?\(.*&(amp|lt|gt);/.test(desc)) return true;
  return false;
}

/** Phase 1: Patch markdown source files (best-effort, helps dev server) */
function patchMarkdownFiles(apiDocsDir: string): number {
  let fixed = 0;

  function processDir(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.includes(' ')) continue;
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        processDir(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;

      const content = readFileSync(fullPath, 'utf-8');

      // Check existing description quality
      if (content.startsWith('---')) {
        const endIdx = content.indexOf('---', 3);
        if (endIdx !== -1) {
          const match = content.slice(3, endIdx).match(/^description:\s*"?([^"\n]*)"?/m);
          if (match && !isBadDescription(match[1].trim())) {
            continue;
          }
        }
      }

      const description = extractDescriptionFromMarkdown(content, fullPath, apiDocsDir);
      if (!description) continue;

      writeFileSync(fullPath, patchMarkdownDescription(content, description), 'utf-8');
      fixed++;
    }
  }

  processDir(apiDocsDir);
  return fixed;
}

/** Phase 2: Patch built HTML files (guaranteed correctness for production) */
function patchHtmlFiles(buildDir: string, apiDocsDir: string): number {
  const apiHtmlDir = join(buildDir, 'docs', 'api');
  if (!existsSync(apiHtmlDir)) return 0;

  let fixed = 0;

  // Build a map of markdown descriptions keyed by relative path
  const descMap = new Map<string, string>();

  function collectDescriptions(dir: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.includes(' ')) continue;
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        collectDescriptions(fullPath);
        continue;
      }
      if (!entry.name.endsWith('.md')) continue;

      const content = readFileSync(fullPath, 'utf-8');
      const desc = extractDescriptionFromMarkdown(content, fullPath, apiDocsDir);
      if (desc) {
        const rel = relative(apiDocsDir, fullPath).replace(/\.md$/, '');
        descMap.set(rel, desc);
      }
    }
  }

  collectDescriptions(apiDocsDir);

  // Now patch all HTML files that have bad descriptions
  function patchDir(dir: string, relBase: string): void {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      const rel = relBase ? `${relBase}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        patchDir(fullPath, rel);
        continue;
      }
      if (!entry.name.endsWith('.html')) continue;

      let html = readFileSync(fullPath, 'utf-8');

      // Extract current description
      const descMatch = html.match(/name="description"\s+content="([^"]*)"/);
      if (!descMatch) continue;

      const currentDesc = descMatch[1];
      if (!isBadDescription(currentDesc)) continue;

      // Find the matching markdown description
      // HTML path: index/classes/PramanError.html or index/classes/PramanError/index.html
      let lookupKey = rel.replace(/\.html$/, '').replace(/\/index$/, '');
      let newDesc = descMap.get(lookupKey);

      if (!newDesc) {
        // Try parent directory name as the key
        const parts = lookupKey.split('/');
        if (parts.length > 0) {
          newDesc = descMap.get(lookupKey);
        }
      }

      if (!newDesc) continue;

      // Escape for HTML attribute
      const escaped = newDesc
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      // Replace all instances of the bad description
      const oldPattern = currentDesc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(`content="${oldPattern}"`, 'g'), `content="${escaped}"`);

      writeFileSync(fullPath, html, 'utf-8');
      fixed++;
    }
  }

  patchDir(apiHtmlDir, '');
  return fixed;
}

export default async function fixTypedocSeoPlugin(context: LoadContext): Promise<Plugin> {
  const apiDocsDir = join(context.siteDir, 'docs', 'api');

  // Phase 1: Best-effort markdown patching (may be overwritten by TypeDoc)
  if (existsSync(apiDocsDir)) {
    const mdFixed = patchMarkdownFiles(apiDocsDir);
    if (mdFixed > 0) {
      console.log(`[fix-typedoc-seo] Phase 1: Patched ${mdFixed} markdown files.`);
    }
  }

  return {
    name: 'fix-typedoc-seo',

    async postBuild({ outDir }) {
      // Phase 2: Guaranteed HTML patching after build completes
      if (!existsSync(apiDocsDir)) return;

      const htmlFixed = patchHtmlFiles(outDir, apiDocsDir);
      if (htmlFixed > 0) {
        console.log(`[fix-typedoc-seo] Phase 2: Fixed ${htmlFixed} HTML page descriptions.`);
      }
    },
  };
}
