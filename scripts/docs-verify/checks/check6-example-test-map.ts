/**
 * Check 6: Example-Test Map Verification
 *
 * Verifies that TypeScript code blocks in documentation have corresponding
 * backing tests. Supports explicit @example tags and fuzzy API-pattern matching.
 */

import type {
  DocCheck,
  CheckResult,
  CheckFinding,
  DocUnderTest,
  SharedContext,
} from '../lib/types.js';
import {
  extractCodeBlocks,
  parseExampleTag,
  extractApiCallPatterns,
} from '../lib/markdown-parser.js';

/**
 * Check 6: Verify example code blocks are backed by real tests.
 */
export const check6ExampleTestMap: DocCheck = {
  name: 'example-test-map',

  async run(doc: DocUnderTest, context: SharedContext): Promise<CheckResult> {
    const start = Date.now();
    const errors: CheckFinding[] = [];
    const warnings: CheckFinding[] = [];

    const blocks = extractCodeBlocks(doc.content, ['typescript', 'ts']);

    if (blocks.length === 0) {
      return {
        check: 'example-test-map',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'No TypeScript code blocks found',
        durationMs: Date.now() - start,
      };
    }

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      const blockId = `block-${i + 1}-line-${block.startLine}`;

      // Check for explicit @example tag
      const exampleTag = parseExampleTag(block.precedingComment);

      if (exampleTag) {
        // Validate explicit mapping
        const testFileInfo = context.testIndex.files.get(exampleTag.testFile);

        if (!testFileInfo) {
          errors.push({
            severity: 'error',
            line: block.startLine,
            message: `@example references non-existent test file: ${exampleTag.testFile}`,
            details: `Block ${blockId} has @example testFile="${exampleTag.testFile}" but the file was not found in the test index`,
            suggestion: 'Verify the test file path is correct and the file exists',
          });
          continue;
        }

        if (exampleTag.testName && !testFileInfo.testNames.includes(exampleTag.testName)) {
          errors.push({
            severity: 'error',
            line: block.startLine,
            message: `@example references non-existent test name: "${exampleTag.testName}"`,
            details: `Test file "${exampleTag.testFile}" does not contain a test named "${exampleTag.testName}". Available tests: ${testFileInfo.testNames.join(', ') || '(none)'}`,
            suggestion: 'Check the test name for typos or update the @example tag',
          });
          continue;
        }

        // Valid explicit mapping — record it
        context.exampleTestMap.push({
          docFile: doc.filePath,
          blockId,
          testFile: exampleTag.testFile,
          testName: exampleTag.testName,
        });
        continue;
      }

      // No explicit tag — try fuzzy matching via API call patterns
      const apiPatterns = extractApiCallPatterns(block.code);

      if (apiPatterns.length === 0) {
        // No API patterns to match — warn about unmatched block
        warnings.push({
          severity: 'warning',
          line: block.startLine,
          message: `Code block has no backing test (no @example tag and no API patterns found)`,
          details: `Block ${blockId} could not be matched to any test file`,
          suggestion: `Add <!-- @example testFile="tests/..." testName="..." --> before this code block`,
        });
        continue;
      }

      // Search test index for matching patterns
      const matchedFile = findFuzzyMatch(apiPatterns, context);

      if (matchedFile) {
        // Fuzzy match found — suggest adding explicit tag
        warnings.push({
          severity: 'warning',
          line: block.startLine,
          message: `Code block matched to test via fuzzy search: ${matchedFile}`,
          details: `Block ${blockId} appears to be tested in "${matchedFile}" based on API patterns: ${apiPatterns.map((p) => p.method).join(', ')}`,
          suggestion: `Add <!-- @example testFile="${matchedFile}" --> before this code block to make the link explicit`,
        });
        continue;
      }

      // No match at all
      warnings.push({
        severity: 'warning',
        line: block.startLine,
        message: `Code block has no backing test`,
        details: `Block ${blockId} uses API patterns (${apiPatterns.map((p) => p.method).join(', ')}) but no matching test was found`,
        suggestion: `Add <!-- @example testFile="tests/..." testName="..." --> before this code block`,
      });
    }

    return {
      check: 'example-test-map',
      status: errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass',
      errors,
      warnings,
      durationMs: Date.now() - start,
    };
  },
};

/**
 * Search the test index for a file whose patterns match the given API patterns.
 * Returns the first matching test file path, or undefined if none found.
 */
function findFuzzyMatch(
  apiPatterns: Array<{ method: string; searchRegex: string }>,
  context: SharedContext,
): string | undefined {
  for (const [filePath, fileInfo] of context.testIndex.files) {
    for (const pattern of apiPatterns) {
      try {
        const regex = new RegExp(pattern.searchRegex);
        if (regex.test(fileInfo.content)) {
          return filePath;
        }
      } catch {
        // Invalid regex — try simple string match
        if (fileInfo.content.includes(pattern.method)) {
          return filePath;
        }
      }
    }
  }
  return undefined;
}

export default check6ExampleTestMap;
