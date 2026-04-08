/**
 * Docs Accuracy Verification Pipeline — Orchestrator
 *
 * Iterates all hand-written documentation files, runs all registered checks
 * per doc, and produces a per-doc pass/fail verdict.
 *
 * Usage:
 *   tsx scripts/docs-verify/index.ts --mode=full
 *   tsx scripts/docs-verify/index.ts --mode=pr
 *   tsx scripts/docs-verify/index.ts --doc fixtures.md
 */

import { parseArgs } from 'node:util';
import type {
  CheckName,
  CheckResult,
  DocCheck,
  DocUnderTest,
  DocVerdict,
  SharedContext,
  VerifyOptions,
} from './lib/types.js';
import { buildReport, printSummary, writeReport } from './lib/report-writer.js';
import { discoverDocs } from './lib/doc-registry.js';
import { getChangedFiles } from './lib/git-diff.js';
import { buildApiSurface } from './lib/api-surface.js';
import { check1TypecheckSnippets } from './checks/check1-typecheck-snippets.js';
import { check4ImportPaths } from './checks/check4-import-paths.js';

/** Map check numbers to CheckName for --checks=1,4 CLI flag */
const CHECK_NUMBER_MAP: Record<number, CheckName> = {
  1: 'typecheck-snippets',
  2: 'api-references',
  3: 'config-defaults',
  4: 'import-paths',
  5: 'claim-tests',
  6: 'example-test-map',
  7: 'ai-review',
  8: 'sap-ui5-api',
};

/** All registered checks */
const ALL_CHECKS: DocCheck[] = [check1TypecheckSnippets, check4ImportPaths];

/**
 * Parse CLI arguments using Node.js built-in parseArgs.
 */
export function parseCli(argv: string[]): VerifyOptions {
  const { values } = parseArgs({
    args: argv,
    options: {
      mode: { type: 'string', default: 'full' },
      doc: { type: 'string' },
      failOn: { type: 'string', default: 'error' },
      checks: { type: 'string' },
      verbose: { type: 'boolean', default: false },
    },
    strict: false,
    allowPositionals: true,
  });

  const mode = values.mode === 'pr' ? 'pr' : 'full';
  const failOn = values.failOn === 'warning' ? 'warning' : 'error';
  const checks = values.checks ? String(values.checks).split(',').map(Number) : undefined;

  return {
    mode: mode as 'pr' | 'full',
    doc: values.doc as string | undefined,
    failOn: failOn as 'error' | 'warning',
    checks,
    verbose: Boolean(values.verbose),
  };
}

/**
 * Build a minimal SharedContext (populated incrementally as checks are added).
 */
export function buildSharedContext(): SharedContext {
  return {
    apiSurface: new Map(),
    configDefaults: new Map(),
    claimTestResults: new Map(),
    testIndex: { files: new Map() },
    exampleTestMap: [],
    vitestResults: new Map(),
    ui5ApiCache: new Map(),
    changedFiles: [],
  };
}

/**
 * Filter checks based on --checks=1,4 CLI flag.
 */
function filterChecks(allChecks: DocCheck[], options: VerifyOptions): DocCheck[] {
  if (!options.checks || options.checks.length === 0) {
    return allChecks;
  }

  const requestedNames = new Set(
    options.checks
      .map((n) => CHECK_NUMBER_MAP[n])
      .filter((name): name is CheckName => name !== undefined),
  );

  return allChecks.filter((check) => requestedNames.has(check.name));
}

/**
 * Filter docs based on --doc=<pattern> and PR mode.
 */
function filterDocs(
  docs: DocUnderTest[],
  options: VerifyOptions,
  changedFiles: string[],
): DocUnderTest[] {
  let filtered = docs;

  // Filter by --doc pattern
  if (options.doc) {
    const pattern = options.doc.toLowerCase();
    filtered = filtered.filter(
      (doc) =>
        doc.shortName.toLowerCase().includes(pattern) ||
        doc.filePath.toLowerCase().includes(pattern),
    );
  }

  // In PR mode, only include docs that changed or whose sources changed
  if (options.mode === 'pr' && changedFiles.length > 0) {
    const changedSet = new Set(changedFiles);
    filtered = filtered.filter((doc) => {
      // Doc itself changed
      if (changedSet.has(doc.filePath)) return true;
      // Any mapped source file changed
      return doc.mappedSourceFiles.some((src) => changedSet.has(src));
    });
  }

  return filtered;
}

/**
 * Run all checks against a single doc and produce a verdict.
 */
export async function verifyDoc(
  doc: DocUnderTest,
  checks: DocCheck[],
  context: SharedContext,
): Promise<DocVerdict> {
  const results: CheckResult[] = [];
  const docStart = Date.now();

  for (const check of checks) {
    const result = await check.run(doc, context);
    results.push(result);
  }

  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);

  return {
    filePath: doc.filePath,
    shortName: doc.shortName,
    verdict: totalErrors > 0 ? 'fail' : totalWarnings > 0 ? 'warn' : 'pass',
    checks: results,
    totalErrors,
    totalWarnings,
    durationMs: Date.now() - docStart,
  };
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  const startTime = Date.now();

  if (options.verbose) {
    console.log('Options:', options);
  }

  // Build shared context
  const context = buildSharedContext();

  // Populate API surface for import-paths check
  context.apiSurface = await buildApiSurface();

  // Get changed files for PR mode
  if (options.mode === 'pr') {
    context.changedFiles = getChangedFiles();
    if (options.verbose) {
      console.log(`Changed files: ${context.changedFiles.length}`);
    }
  }

  // Select checks to run
  const checks = filterChecks(ALL_CHECKS, options);

  if (checks.length === 0) {
    console.log('No checks selected. Use --checks=1,4 to specify checks.');
    process.exit(0);
  }

  console.log(`Running ${checks.length} check(s): ${checks.map((c) => c.name).join(', ')}`);

  // Discover docs
  const allDocs = await discoverDocs();

  if (allDocs.length === 0) {
    console.log('No documentation files found to verify.');
    process.exit(0);
  }

  // Filter docs
  const docs = filterDocs(allDocs, options, context.changedFiles);

  if (docs.length === 0) {
    console.log('No documentation files matched the filter criteria.');
    process.exit(0);
  }

  console.log(`Verifying ${docs.length} doc(s)...`);

  // Run checks per doc
  const verdicts: DocVerdict[] = [];
  for (const doc of docs) {
    if (options.verbose) {
      console.log(`  Checking: ${doc.shortName}`);
    }
    const verdict = await verifyDoc(doc, checks, context);
    verdicts.push(verdict);
  }

  // Build and write report
  const report = buildReport(verdicts, options.mode, startTime);
  writeReport(report);
  printSummary(report);

  const hasFailed = report.docs.some((d) => d.verdict === 'fail');
  const hasWarned = report.docs.some((d) => d.verdict === 'warn');
  const shouldFail = hasFailed || (options.failOn === 'warning' && hasWarned);

  process.exit(shouldFail ? 1 : 0);
}

main().catch((err: unknown) => {
  console.error('docs-verify failed:', err);
  process.exit(2);
});
