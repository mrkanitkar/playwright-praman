/**
 * Check 2: API Reference Verification
 *
 * Verifies that API symbols mentioned in docs actually exist in the
 * package's public API surface. Reports typos with fuzzy-match suggestions.
 */

import type {
  CheckFinding,
  CheckResult,
  DocCheck,
  DocUnderTest,
  SharedContext,
} from '../lib/types.js';

import {
  extractMentionedSymbols,
  findClosestMatch,
  isKnownExternal,
} from '../lib/markdown-parser.js';

export const check2ApiReferences: DocCheck = {
  name: 'api-references',

  async run(doc: DocUnderTest, context: SharedContext): Promise<CheckResult> {
    const start = performance.now();

    const symbols = extractMentionedSymbols(doc.content);

    if (symbols.length === 0) {
      return {
        check: 'api-references',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'No API symbols found in document',
        durationMs: performance.now() - start,
      };
    }

    const errors: CheckFinding[] = [];
    const warnings: CheckFinding[] = [];

    for (const symbol of symbols) {
      // Skip known externals (Playwright, Node, etc.)
      if (isKnownExternal(symbol.name)) continue;

      // Check if symbol exists in the API surface
      if (context.apiSurface.has(symbol.name)) continue;

      // Not found — try fuzzy match for a suggestion
      const closest = findClosestMatch(symbol.name, context.apiSurface);

      const finding: CheckFinding = {
        severity: 'error',
        line: symbol.line,
        message: `API symbol '${symbol.name}' not found in public API surface`,
      };
      if (closest) {
        finding.suggestion = `Did you mean '${closest}'?`;
      }
      errors.push(finding);
    }

    const status = errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass';

    return {
      check: 'api-references',
      status,
      errors,
      warnings,
      durationMs: performance.now() - start,
    };
  },
};
