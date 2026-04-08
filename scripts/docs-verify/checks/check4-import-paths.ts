/**
 * Check 4: Import Path Verification
 *
 * Validates that all `import { X } from 'playwright-praman/...'` statements
 * reference valid sub-path exports and valid named specifiers.
 */

import type {
  DocCheck,
  CheckResult,
  CheckFinding,
  DocUnderTest,
  SharedContext,
} from '../lib/types.js';
import { extractImportStatements, findClosestMatch } from '../lib/markdown-parser.js';

/** Valid import sources (the 6 sub-path exports) */
const VALID_SOURCES = new Set([
  'playwright-praman',
  'playwright-praman/ai',
  'playwright-praman/intents',
  'playwright-praman/vocabulary',
  'playwright-praman/fe',
  'playwright-praman/reporters',
]);

/**
 * Check 4: Verify import paths and specifiers in documentation code blocks.
 */
export const check4ImportPaths: DocCheck = {
  name: 'import-paths',

  async run(doc: DocUnderTest, context: SharedContext): Promise<CheckResult> {
    const start = Date.now();
    const errors: CheckFinding[] = [];
    const warnings: CheckFinding[] = [];

    const imports = extractImportStatements(doc.content);

    if (imports.length === 0) {
      return {
        check: 'import-paths',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'No playwright-praman imports found',
        durationMs: Date.now() - start,
      };
    }

    for (const imp of imports) {
      // Validate source path
      if (!VALID_SOURCES.has(imp.source)) {
        errors.push({
          severity: 'error',
          line: imp.line,
          message: `Invalid import source: '${imp.source}'`,
          details: `Valid sources: ${[...VALID_SOURCES].join(', ')}`,
          suggestion: `Did you mean one of: ${[...VALID_SOURCES].join(', ')}?`,
        });
        continue;
      }

      // Validate each named specifier against the API surface
      for (const specifier of imp.specifiers) {
        // Handle 'type' keyword in specifiers like 'type PramanConfig'
        const cleanSpecifier = specifier.replace(/^type\s+/, '');

        if (!context.apiSurface.has(cleanSpecifier)) {
          const closest = findClosestMatch(cleanSpecifier, context.apiSurface);

          const finding: CheckFinding = {
            severity: 'error',
            line: imp.line,
            message: `Unknown specifier '${cleanSpecifier}' from '${imp.source}'`,
            details: `'${cleanSpecifier}' is not exported from the playwright-praman API surface`,
          };
          if (closest) {
            finding.suggestion = `Did you mean '${closest}'?`;
          }
          errors.push(finding);
        }
      }
    }

    return {
      check: 'import-paths',
      status: errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass',
      errors,
      warnings,
      durationMs: Date.now() - start,
    };
  },
};

export default check4ImportPaths;
