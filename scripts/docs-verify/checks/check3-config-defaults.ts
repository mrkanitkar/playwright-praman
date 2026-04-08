/**
 * Check 3: Config Default Verification
 *
 * Verifies that config defaults documented in prose/tables match
 * the actual Zod schema defaults from PramanConfigSchema.
 */

import type {
  CheckFinding,
  CheckResult,
  DocCheck,
  DocUnderTest,
  SharedContext,
} from '../lib/types.js';

import { extractDocumentedDefaults } from '../lib/markdown-parser.js';

/**
 * Normalize a value to a comparable string representation.
 * Handles booleans, numbers, and quoted strings uniformly.
 */
function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return 'undefined';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

export const check3ConfigDefaults: DocCheck = {
  name: 'config-defaults',

  async run(doc: DocUnderTest, context: SharedContext): Promise<CheckResult> {
    const start = performance.now();

    const documented = extractDocumentedDefaults(doc.content);

    if (documented.length === 0) {
      return {
        check: 'config-defaults',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'No config defaults mentioned in document',
        durationMs: performance.now() - start,
      };
    }

    const errors: CheckFinding[] = [];
    const warnings: CheckFinding[] = [];

    for (const claim of documented) {
      // Try exact key match first, then search all keys for a suffix match
      let actual = context.configDefaults.get(claim.key);

      if (!actual) {
        // Search for dotted key ending with the claim key
        for (const [fullKey, value] of context.configDefaults) {
          if (fullKey.endsWith(`.${claim.key}`) || fullKey === claim.key) {
            actual = value;
            break;
          }
        }
      }

      if (!actual) {
        warnings.push({
          severity: 'warning',
          line: claim.line,
          message: `Config key '${claim.key}' not found in schema — may have been renamed or removed`,
        });
        continue;
      }

      // Compare string representations
      const actualStr = normalizeValue(actual.defaultValue);
      const documentedStr = claim.documentedDefault;

      if (actualStr !== documentedStr) {
        errors.push({
          severity: 'error',
          line: claim.line,
          message: `Config '${claim.key}' default is documented as '${documentedStr}' but actual default is '${actualStr}'`,
          suggestion: `Update documentation to: ${actualStr}`,
        });
      }
    }

    const status = errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass';

    return {
      check: 'config-defaults',
      status,
      errors,
      warnings,
      durationMs: performance.now() - start,
    };
  },
};
