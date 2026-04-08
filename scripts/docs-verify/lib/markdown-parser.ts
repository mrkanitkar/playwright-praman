/**
 * Markdown parser for extracting code blocks, symbols, imports, claims,
 * config defaults, and SAP UI5 references from documentation files.
 */

import type {
  CodeBlock,
  MentionedSymbol,
  ImportStatement,
  DocumentedDefault,
  ClaimTag,
  SapUi5References,
  ApiCallPattern,
} from './types.js';

/**
 * Extract fenced code blocks from markdown content.
 * Optionally filter to specific languages.
 */
export function extractCodeBlocks(content: string, languages?: string[]): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');

  let inBlock = false;
  let blockCode = '';
  let blockLang = '';
  let blockMeta = '';
  let blockStart = 0;
  let precedingComment: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Track HTML comments for directive parsing
    const commentMatch = line.match(/<!--\s*(.*?)\s*-->/);
    if (commentMatch && !inBlock) {
      precedingComment = commentMatch[1]!;
      continue;
    }

    // Start of fenced block
    const openMatch = line.match(/^```(\w+)?\s*(.*)?$/);
    if (openMatch !== null && !inBlock) {
      inBlock = true;
      blockLang = openMatch[1] ?? '';
      blockMeta = openMatch[2] ?? '';
      blockStart = i + 1; // 1-indexed line number
      blockCode = '';
      continue;
    }

    // End of fenced block
    if (line.startsWith('```') && inBlock) {
      inBlock = false;

      // Filter by language if specified
      if (!languages || languages.includes(blockLang)) {
        blocks.push({
          code: blockCode,
          language: blockLang,
          startLine: blockStart,
          precedingComment,
          meta: blockMeta || undefined,
        });
      }

      precedingComment = undefined;
      continue;
    }

    if (inBlock) {
      blockCode += (blockCode ? '\n' : '') + line;
    } else if (!commentMatch) {
      // Reset preceding comment if we hit a non-comment, non-block line
      precedingComment = undefined;
    }
  }

  return blocks;
}

/**
 * Extract import statements for playwright-praman from markdown content.
 */
export function extractImportStatements(content: string): ImportStatement[] {
  const imports: ImportStatement[] = [];
  const lines = content.split('\n');

  const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]((playwright-praman)[^'"]*)['"]/g;

  for (let i = 0; i < lines.length; i++) {
    let match;
    while ((match = importRegex.exec(lines[i]!)) !== null) {
      const specifiers = match[1]!
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      imports.push({
        source: match[2]!,
        specifiers,
        line: i + 1,
      });
    }
    importRegex.lastIndex = 0;
  }

  return imports;
}

/** Known external symbols that should not be flagged as missing from Praman API */
const KNOWN_EXTERNALS = new Set([
  // Playwright
  'Page',
  'BrowserContext',
  'Browser',
  'Locator',
  'Frame',
  'test',
  'expect',
  'devices',
  'chromium',
  'firefox',
  'webkit',
  // Node.js
  'Buffer',
  'process',
  'console',
  'setTimeout',
  // Common types
  'Promise',
  'Record',
  'Partial',
  'Readonly',
  'Map',
  'Set',
  // Test utilities
  'describe',
  'it',
  'beforeAll',
  'afterAll',
  'vi',
]);

/**
 * Extract API symbols mentioned in markdown content.
 * Looks for inline code references, import specifiers, and table cells.
 */
export function extractMentionedSymbols(content: string): MentionedSymbol[] {
  const symbols: MentionedSymbol[] = [];
  const seen = new Set<string>();
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;

    // Import specifiers: import { X, Y } from 'playwright-praman'
    const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]playwright-praman[^'"]*['"]/g;
    let match;
    while ((match = importRegex.exec(line)) !== null) {
      for (const spec of match[1]!.split(',')) {
        const name = spec.trim();
        if (name && !seen.has(name) && !KNOWN_EXTERNALS.has(name)) {
          seen.add(name);
          symbols.push({ name, line: lineNum });
        }
      }
    }

    // Inline code: function calls like `functionName()`
    const callRegex = /`(\w+(?:\.\w+)*)\(`/g;
    while ((match = callRegex.exec(line)) !== null) {
      const name = match[1]!;
      if (!seen.has(name) && !KNOWN_EXTERNALS.has(name)) {
        seen.add(name);
        symbols.push({ name, line: lineNum });
      }
    }

    // Type references: PascalCase names in backticks that look like Praman types
    const typeRegex =
      /`((?:Praman|Sap|UI5|Ai|Fe|OData|Bridge|Control|Auth|Navigation|Config|Intent|FLP)\w+)`/g;
    while ((match = typeRegex.exec(line)) !== null) {
      const name = match[1]!;
      if (!seen.has(name) && !KNOWN_EXTERNALS.has(name)) {
        seen.add(name);
        symbols.push({ name, line: lineNum });
      }
    }

    // Table cells with backtick-wrapped identifiers
    const tableCellRegex = /\|\s*`(\w+)`\s*\|/g;
    while ((match = tableCellRegex.exec(line)) !== null) {
      const name = match[1]!;
      if (
        !seen.has(name) &&
        !KNOWN_EXTERNALS.has(name) &&
        /^[A-Z]/.test(name) // Only PascalCase (likely types/classes)
      ) {
        seen.add(name);
        symbols.push({ name, line: lineNum });
      }
    }
  }

  return symbols;
}

/**
 * Check if a symbol name is a known external (not from playwright-praman).
 */
export function isKnownExternal(name: string): boolean {
  return KNOWN_EXTERNALS.has(name);
}

/**
 * Extract `<!-- @claim testId="..." -->` tags from markdown content.
 */
export function extractClaims(content: string): ClaimTag[] {
  const claims: ClaimTag[] = [];
  const lines = content.split('\n');

  const claimRegex = /<!--\s*@claim\s+testId="([^"]+)"\s*-->/;

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i]!.match(claimRegex);
    if (match) {
      claims.push({ testId: match[1]!, line: i + 1 });
    }
  }

  return claims;
}

/** Patterns that indicate a verifiable numerical claim */
const CLAIM_PATTERNS = [
  /supports?\s+(\d+)\s+/gi,
  /provides?\s+(\d+)\s+/gi,
  /defaults?\s+(?:to|is)\s+(\S+)/gi,
  /retries?\s+(?:up\s+to\s+)?(\d+)/gi,
  /(\d+)\s+(?:strategies|methods|types)/gi,
  /requires?\s+Node\.js\s*>=?\s*(\d+)/gi,
  /(\d+)\s+(?:dependencies|matchers|fixtures|reporters)/gi,
  /version\s+(\d+\.\d+)/gi,
];

/**
 * Detect potential untagged verifiable claims in prose.
 * Returns lines that look like they make numerical assertions.
 */
export function detectUntaggedClaims(content: string): Array<{ line: number; text: string }> {
  const results: Array<{ line: number; text: string }> = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    // Skip lines inside code blocks, HTML comments, or frontmatter
    if (line.startsWith('```') || line.startsWith('<!--') || line.startsWith('---')) {
      continue;
    }

    for (const pattern of CLAIM_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        results.push({ line: i + 1, text: line.trim() });
        break; // One match per line is enough
      }
    }
  }

  return results;
}

/**
 * Extract documented config default values from markdown content.
 * Looks for patterns like "defaults to X", table rows with Default column, etc.
 */
export function extractDocumentedDefaults(content: string): DocumentedDefault[] {
  const defaults: DocumentedDefault[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // Pattern 1: "X defaults to Y" / "default: Y" / "default value is Y"
    const proseRegex =
      /[`']?(\w+)[`']?\s*(?:defaults?\s+(?:to|is|value(?:\s+is)?)\s*[:=]?\s*)[`']?([\w.]+)[`']?/gi;
    let match;
    while ((match = proseRegex.exec(line)) !== null) {
      defaults.push({
        key: match[1]!,
        documentedDefault: match[2]!,
        line: i + 1,
      });
    }

    // Pattern 2: Markdown table rows — | key | type | default | description |
    // Only match if we're in a table (line starts with |) and there's a header with "Default"
    if (line.startsWith('|')) {
      const cells = line
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      // Check if this row has 3+ cells and looks like a config row
      if (cells.length >= 3) {
        const key = cells[0]!.replace(/`/g, '');
        const defaultVal = cells[2]?.replace(/`/g, '');
        if (
          key &&
          defaultVal &&
          /^[a-z]\w*$/i.test(key) &&
          defaultVal !== 'Default' &&
          defaultVal !== '---'
        ) {
          defaults.push({
            key,
            documentedDefault: defaultVal,
            line: i + 1,
          });
        }
      }
    }
  }

  return defaults;
}

/**
 * Extract SAP UI5 references from markdown content.
 */
export function extractSapUi5References(content: string): SapUi5References {
  const refs: SapUi5References = {
    controlTypes: [],
    propertyUsages: [],
    methodCalls: [],
    eventNames: [],
  };

  const lines = content.split('\n');
  const seenControls = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNum = i + 1;
    let match;

    // Pattern 1: controlType strings — 'sap.m.Button', "sap.ui.comp.smarttable.SmartTable"
    const controlTypeRegex = /['"`](sap\.[\w.]+)['"`]/g;
    while ((match = controlTypeRegex.exec(line)) !== null) {
      const name = match[1]!;
      // Must have at least 3 segments: sap.X.Y
      if (name.split('.').length >= 3 && !seenControls.has(name)) {
        seenControls.add(name);
        refs.controlTypes.push({ name, line: lineNum });
      }
    }

    // Pattern 2: properties object with nearby controlType
    const propsMatch = line.match(/properties:\s*\{([^}]+)\}/);
    if (propsMatch) {
      const propKeys = extractObjectKeys(propsMatch[1]!);
      const controlType = findNearestControlType(lines, i);
      if (controlType && propKeys.length > 0) {
        refs.propertyUsages.push({
          controlType,
          properties: propKeys,
          line: lineNum,
        });
      }
    }

    // Pattern 3: Method calls — .getXxx(), .setXxx(), .fireXxx(), etc.
    const methodRegex = /\.(get|set|fire|attach|detach|is|has)([A-Z]\w*)\s*\(/g;
    while ((match = methodRegex.exec(line)) !== null) {
      const methodName = match[1]! + match[2]!;
      const controlType = findNearestControlType(lines, i);
      if (controlType) {
        refs.methodCalls.push({ controlType, methodName, line: lineNum });
      }
    }

    // Pattern 4: Event names
    const eventRegex = /(?:events?:\s*\[?['"`](\w+)['"`]|fires?\s+[`'](\w+)[`']\s+event)/g;
    while ((match = eventRegex.exec(line)) !== null) {
      const eventName: string | undefined = match[1] ?? match[2];
      const controlType = findNearestControlType(lines, i);
      if (controlType && eventName) {
        refs.eventNames.push({ controlType, eventName, line: lineNum });
      }
    }
  }

  return refs;
}

/** Extract keys from an object literal string like "header: 'My App', enabled: true" */
function extractObjectKeys(objectStr: string): string[] {
  const keys: string[] = [];
  const keyRegex = /(\w+)\s*:/g;
  let match;
  while ((match = keyRegex.exec(objectStr)) !== null) {
    keys.push(match[1]!);
  }
  return keys;
}

/** Scan backwards up to 15 lines to find the nearest controlType: 'sap.x.Y' */
function findNearestControlType(lines: string[], fromLine: number): string | undefined {
  for (let i = fromLine; i >= Math.max(0, fromLine - 15); i--) {
    const match = lines[i]!.match(/controlType:\s*['"`](sap\.[\w.]+)['"`]/);
    if (match) return match[1]!;
  }
  return undefined;
}

/** All Praman fixture names — used for detecting browser-dependent snippets */
const FIXTURE_NAMES = [
  'ui5',
  'sapAuth',
  'ui5Navigation',
  'btpWorkZone',
  'fe',
  'pramanAI',
  'intent',
  'ui5Shell',
  'ui5Footer',
  'flpLocks',
  'flpSettings',
  'testData',
  'odata',
  'controlTree',
  'screencast',
  'browserBind',
  'odataTrace',
];

/** Regex matching all fixture method calls */
const FIXTURE_CALL_REGEX = new RegExp(
  `\\b(${FIXTURE_NAMES.join('|')})\\.(\\w+(?:\\.\\w+)*)\\s*\\(`,
  'g',
);

/**
 * Check if a code block requires a browser/Playwright context.
 * Browser-dependent blocks should NOT be executed in Check 1.
 */
export function needsBrowserContext(code: string): boolean {
  const browserPattern = new RegExp(`\\b(page|context|browser|${FIXTURE_NAMES.join('|')})\\b`);
  return browserPattern.test(code);
}

/**
 * Extract API call patterns from a code block for test-index matching (Check 6).
 */
export function extractApiCallPatterns(code: string): ApiCallPattern[] {
  const patterns: ApiCallPattern[] = [];
  const seen = new Set<string>();

  let match;
  const regex = new RegExp(FIXTURE_CALL_REGEX.source, 'g');
  while ((match = regex.exec(code)) !== null) {
    const fixture = match[1]!;
    const method = match[2]!;
    const fullMethod = `${fixture}.${method}`;

    if (seen.has(fullMethod)) continue;
    seen.add(fullMethod);

    // Extract the argument shape
    const argsStart = match.index + match[0].length;
    const argSnippet = extractBalancedArg(code, argsStart);
    const argKeys = extractObjectKeys(argSnippet);

    const searchRegex = buildSearchRegex(fixture, method, argKeys);

    patterns.push({
      method: fullMethod,
      argsSignature: argKeys.length > 0 ? `{ ${argKeys.join(', ')} }` : argSnippet.slice(0, 40),
      searchRegex,
    });
  }

  return patterns;
}

/** Extract balanced parenthesized argument (simplified — first arg object) */
function extractBalancedArg(code: string, start: number): string {
  let depth = 0;
  let result = '';
  for (let i = start; i < Math.min(code.length, start + 200); i++) {
    const ch = code[i];
    if (ch === '(' || ch === '{') depth++;
    if (ch === ')' || ch === '}') {
      if (depth === 0) break;
      depth--;
    }
    result += ch;
  }
  return result;
}

/** Build a regex to search test files for the same API call pattern */
function buildSearchRegex(fixture: string, method: string, argKeys: string[]): string {
  const escaped = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const argPart = argKeys.map((k) => `(?=.*${escaped(k)})`).join('');
  return `${escaped(fixture)}\\.${escaped(method)}\\s*\\(${argPart}`;
}

/**
 * Parse an `@example` tag from a preceding HTML comment.
 * Returns null if no tag found.
 */
export function parseExampleTag(
  comment: string | undefined,
): { testFile: string; testName?: string } | null {
  if (!comment) return null;
  const match = comment.match(/@example\s+testFile="([^"]+)"(?:\s+testName="([^"]+)")?/);
  if (!match) return null;
  const result: { testFile: string; testName?: string } = { testFile: match[1]! };
  if (match[2] !== undefined) result.testName = match[2];
  return result;
}

/**
 * Find the closest matching name in a set (for rename/typo detection).
 */
export function findClosestMatch(
  name: string,
  candidates: Map<string, unknown>,
): string | undefined {
  const lower = name.toLowerCase();
  let best: string | undefined;
  let bestScore = Infinity;

  for (const candidate of candidates.keys()) {
    const distance = levenshtein(lower, candidate.toLowerCase());
    if (distance < bestScore && distance <= Math.ceil(name.length / 3)) {
      bestScore = distance;
      best = candidate;
    }
  }

  return best;
}

/** Simple Levenshtein distance for fuzzy matching */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }

  return matrix[a.length]![b.length]!;
}
