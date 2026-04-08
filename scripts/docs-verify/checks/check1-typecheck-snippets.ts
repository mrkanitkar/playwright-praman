/**
 * Check 1: Code Snippet Type-Checking + Execution
 *
 * Phase A: Compile each TypeScript code block from docs using the TS compiler API.
 * Phase B: Execute self-contained runnable snippets via tsx with a 10s timeout.
 */

import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import type {
  DocCheck,
  CheckResult,
  CheckFinding,
  DocUnderTest,
  SharedContext,
  CodeBlock,
} from '../lib/types.js';
import { extractCodeBlocks, needsBrowserContext } from '../lib/markdown-parser.js';

const TMP_DIR = resolve('.docs-verify-tmp');
const TSCONFIG_PATH = resolve('scripts/docs-verify/fixtures/snippet-tsconfig.json');
const EXECUTION_TIMEOUT_MS = 10_000;

/** Import rewrite map: package specifier -> relative dist path */
const IMPORT_REWRITES: Record<string, string> = {
  'playwright-praman': './dist/index',
  'playwright-praman/ai': './dist/ai/index',
  'playwright-praman/intents': './dist/intents/index',
  'playwright-praman/vocabulary': './dist/vocabulary/index',
  'playwright-praman/fe': './dist/fe/index',
  'playwright-praman/reporters': './dist/reporters/index',
};

/**
 * Rewrite `playwright-praman` imports to relative dist paths.
 */
export function rewriteImports(code: string): string {
  let result = code;
  for (const [pkg, distPath] of Object.entries(IMPORT_REWRITES)) {
    // Match both single and double quoted imports
    const escaped = pkg.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
    const regex = new RegExp(`(from\\s+)(['"])${escaped}\\2`, 'g');
    result = result.replace(regex, `$1$2${distPath}$2`);
  }
  return result;
}

/**
 * Check if a code block should be skipped.
 */
function shouldSkip(block: CodeBlock): { skip: boolean; reason?: string } {
  // Check for docs-verify:ignore directive
  if (block.precedingComment?.includes('docs-verify:ignore')) {
    return { skip: true, reason: 'docs-verify:ignore directive' };
  }

  // Check for pseudo-code meta
  if (block.meta?.includes('title="pseudo-code"')) {
    return { skip: true, reason: 'pseudo-code block' };
  }

  return { skip: false };
}

/**
 * Check if a code block should be executed (Phase B).
 */
function shouldExecute(block: CodeBlock): boolean {
  // Force execute
  if (block.precedingComment?.includes('docs-verify:run')) {
    return true;
  }

  // Force skip execution
  if (block.precedingComment?.includes('docs-verify:no-run')) {
    return false;
  }

  // Skip browser-dependent blocks
  if (needsBrowserContext(block.code)) {
    return false;
  }

  // Only execute blocks that look self-contained (have a top-level expression or function call)
  const hasTopLevelCall =
    /^(?:const|let|var|async|function|class|import|export|\/\/|\/\*|console)\b/m.test(block.code);
  return hasTopLevelCall;
}

/**
 * Write a code block to a temp file and compile it.
 * Returns diagnostics as CheckFinding[].
 */
function typecheckBlock(block: CodeBlock, index: number): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const fileName = `snippet-${index}-${randomUUID().slice(0, 8)}.ts`;
  const filePath = join(TMP_DIR, fileName);

  try {
    mkdirSync(TMP_DIR, { recursive: true });
    const rewritten = rewriteImports(block.code);
    writeFileSync(filePath, rewritten, 'utf-8');

    // Run tsc with the snippet tsconfig
    try {
      execFileSync('npx', ['tsc', '--project', TSCONFIG_PATH, '--noEmit'], {
        encoding: 'utf-8',
        timeout: 30_000,
        cwd: resolve('.'),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err: unknown) {
      const error = err as { stdout?: string; stderr?: string };
      const output = (error.stdout ?? '') + (error.stderr ?? '');
      // Filter diagnostics for this specific file
      const relevantLines = output
        .split('\n')
        .filter((line) => line.includes(fileName))
        .map((line) => line.replace(new RegExp(`.*${fileName}`), fileName));

      if (relevantLines.length > 0) {
        findings.push({
          severity: 'error',
          line: block.startLine,
          message: `TypeScript compilation error in code block at line ${block.startLine}`,
          details: relevantLines.join('\n'),
        });
      }
    }
  } finally {
    // Clean up temp file
    try {
      if (existsSync(filePath)) {
        rmSync(filePath);
      }
    } catch {
      // ignore cleanup errors
    }
  }

  return findings;
}

/**
 * Execute a code block via tsx and return any runtime errors.
 */
function executeBlock(block: CodeBlock, index: number): CheckFinding[] {
  const findings: CheckFinding[] = [];
  const fileName = `run-${index}-${randomUUID().slice(0, 8)}.ts`;
  const filePath = join(TMP_DIR, fileName);

  try {
    mkdirSync(TMP_DIR, { recursive: true });
    const rewritten = rewriteImports(block.code);
    writeFileSync(filePath, rewritten, 'utf-8');

    execFileSync('npx', ['tsx', filePath], {
      encoding: 'utf-8',
      timeout: EXECUTION_TIMEOUT_MS,
      cwd: resolve('.'),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string; status?: number };
    const errorMsg = error.stderr ?? error.message ?? 'Unknown execution error';

    findings.push({
      severity: 'error',
      line: block.startLine,
      message: `Runtime error in code block at line ${block.startLine}`,
      details: errorMsg.slice(0, 500),
    });
  } finally {
    try {
      if (existsSync(filePath)) {
        rmSync(filePath);
      }
    } catch {
      // ignore cleanup errors
    }
  }

  return findings;
}

/**
 * Check 1: Type-check and optionally execute TypeScript code blocks from docs.
 */
export const check1TypecheckSnippets: DocCheck = {
  name: 'typecheck-snippets',

  async run(doc: DocUnderTest, _context: SharedContext): Promise<CheckResult> {
    const start = Date.now();
    const errors: CheckFinding[] = [];
    const warnings: CheckFinding[] = [];

    const blocks = extractCodeBlocks(doc.content, ['typescript', 'ts', 'tsx']);

    if (blocks.length === 0) {
      return {
        check: 'typecheck-snippets',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'No TypeScript code blocks found',
        durationMs: Date.now() - start,
      };
    }

    try {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]!;
        const skipCheck = shouldSkip(block);

        if (skipCheck.skip) {
          continue;
        }

        // Phase A: Type-check
        const typecheckFindings = typecheckBlock(block, i);
        errors.push(...typecheckFindings.filter((f) => f.severity === 'error'));
        warnings.push(...typecheckFindings.filter((f) => f.severity === 'warning'));

        // Phase B: Execute if appropriate and no type errors
        if (typecheckFindings.length === 0 && shouldExecute(block)) {
          const execFindings = executeBlock(block, i);
          errors.push(...execFindings.filter((f) => f.severity === 'error'));
          warnings.push(...execFindings.filter((f) => f.severity === 'warning'));
        }
      }
    } finally {
      // Clean up tmp dir
      try {
        if (existsSync(TMP_DIR)) {
          rmSync(TMP_DIR, { recursive: true, force: true });
        }
      } catch {
        // ignore cleanup errors
      }
    }

    return {
      check: 'typecheck-snippets',
      status: errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass',
      errors,
      warnings,
      durationMs: Date.now() - start,
    };
  },
};

export default check1TypecheckSnippets;
