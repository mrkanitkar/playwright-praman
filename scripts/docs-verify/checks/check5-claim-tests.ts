/**
 * Check 5: Claim Test Verification
 *
 * Validates that `<!-- @claim testId="..." -->` tags in documentation
 * have corresponding passing backing tests, and warns about potential
 * untagged numerical claims.
 */

import type {
  DocCheck,
  CheckResult,
  CheckFinding,
  DocUnderTest,
  SharedContext,
} from '../lib/types.js';
import { extractClaims, detectUntaggedClaims } from '../lib/markdown-parser.js';

/**
 * Check 5: Verify claim tags have passing backing tests.
 */
export const check5ClaimTests: DocCheck = {
  name: 'claim-tests',

  async run(doc: DocUnderTest, context: SharedContext): Promise<CheckResult> {
    const start = Date.now();
    const errors: CheckFinding[] = [];
    const warnings: CheckFinding[] = [];

    const claims = extractClaims(doc.content);

    if (claims.length === 0) {
      return {
        check: 'claim-tests',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'no claim tags found',
        durationMs: Date.now() - start,
      };
    }

    // Validate each claim tag against backing test results
    for (const claim of claims) {
      const result = context.claimTestResults.get(claim.testId);

      if (result === undefined) {
        errors.push({
          severity: 'error',
          line: claim.line,
          message: `No backing test found for claim testId='${claim.testId}'`,
          suggestion: `Add a test with testId '${claim.testId}' to the claim test suite`,
        });
      } else if (result === 'fail') {
        errors.push({
          severity: 'error',
          line: claim.line,
          message: `Backing test failed for claim testId='${claim.testId}'`,
          suggestion: `Fix the failing test for claim '${claim.testId}'`,
        });
      }
      // 'pass' → no finding needed
    }

    // Detect untagged numerical claims and add warnings
    const untagged = detectUntaggedClaims(doc.content);
    for (const item of untagged) {
      warnings.push({
        severity: 'warning',
        line: item.line,
        message: `Potential untagged claim on line ${String(item.line)}: '${item.text}'. Consider adding <!-- @claim testId="..." -->`,
      });
    }

    return {
      check: 'claim-tests',
      status: errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass',
      errors,
      warnings,
      durationMs: Date.now() - start,
    };
  },
};

export default check5ClaimTests;
