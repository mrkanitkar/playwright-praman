/**
 * Report writer for docs verification results.
 * Outputs per-doc JSON reports, summary JSON, and formatted console output.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { DocVerdict, VerificationReport } from './types.js';

const REPORTS_DIR = 'docs-verify-reports';

/**
 * Write the full verification report: per-doc JSON files + summary.
 */
export function writeReport(report: VerificationReport): void {
  // Write per-doc reports
  for (const doc of report.docs) {
    const reportPath = join(REPORTS_DIR, `${doc.shortName.replace(/\.md$/, '')}.json`);
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(doc, null, 2), 'utf-8');
  }

  // Write summary
  const summaryPath = join(REPORTS_DIR, 'summary.json');
  mkdirSync(dirname(summaryPath), { recursive: true });

  const summary = {
    timestamp: report.timestamp,
    mode: report.mode,
    totalDocs: report.totalDocs,
    passed: report.passed,
    failed: report.failed,
    warned: report.warned,
    skipped: report.skipped,
    aiCostUsd: report.aiCostUsd,
    durationMs: report.durationMs,
    docs: report.docs.map((d) => ({
      shortName: d.shortName,
      verdict: d.verdict,
      errors: d.totalErrors,
      warnings: d.totalWarnings,
    })),
  };

  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
}

/**
 * Print a human-readable summary to stdout.
 */
export function printSummary(report: VerificationReport): void {
  const { passed, failed, warned, totalDocs, durationMs } = report;

  console.log('');
  console.log('='.repeat(60));
  console.log('  Docs Accuracy Verification Report');
  console.log('='.repeat(60));
  console.log('');

  if (failed > 0) {
    console.log(`  FAILED: ${failed}`);
  }
  if (warned > 0) {
    console.log(`  Warnings: ${warned}`);
  }
  console.log(`  Passed: ${passed}`);
  console.log(`  Total: ${totalDocs} docs checked in ${(durationMs / 1000).toFixed(1)}s`);
  console.log('');

  // Print failed docs with details
  const failedDocs = report.docs.filter((d) => d.verdict === 'fail');
  for (const doc of failedDocs) {
    console.log(`  FAIL  ${doc.shortName}`);
    for (const check of doc.checks) {
      if (check.status === 'fail') {
        for (const err of check.errors) {
          const loc = err.line ? `:${err.line}` : '';
          console.log(`        [${check.check}] ${err.message}${loc}`);
          if (err.suggestion) {
            console.log(`        -> ${err.suggestion}`);
          }
        }
      }
    }
    console.log('');
  }

  // Print warned docs (brief)
  const warnedDocs = report.docs.filter((d) => d.verdict === 'warn');
  if (warnedDocs.length > 0) {
    console.log(`  Docs with warnings:`);
    for (const doc of warnedDocs) {
      console.log(`    ${doc.shortName} (${doc.totalWarnings} warnings)`);
    }
    console.log('');
  }

  if (report.aiCostUsd !== undefined && report.aiCostUsd > 0) {
    console.log(`  AI review cost: $${report.aiCostUsd.toFixed(2)}`);
    console.log('');
  }

  console.log(`  Reports written to: ${REPORTS_DIR}/`);
  console.log('');
}

/**
 * Build a verification report from an array of doc verdicts.
 */
export function buildReport(
  verdicts: DocVerdict[],
  mode: 'pr' | 'full',
  startTime: number,
  aiCostUsd?: number,
): VerificationReport {
  return {
    timestamp: new Date().toISOString(),
    mode,
    totalDocs: verdicts.length,
    passed: verdicts.filter((v) => v.verdict === 'pass').length,
    failed: verdicts.filter((v) => v.verdict === 'fail').length,
    warned: verdicts.filter((v) => v.verdict === 'warn').length,
    skipped: 0,
    docs: verdicts,
    aiCostUsd,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Format the report as a GitHub PR comment (markdown).
 */
export function formatPrComment(report: VerificationReport): string {
  const { passed, failed, warned, totalDocs } = report;
  const lines: string[] = [];

  lines.push('## Docs Accuracy Report');
  lines.push('');

  const parts: string[] = [];
  if (failed > 0) parts.push(`**${failed} failed**`);
  if (warned > 0) parts.push(`${warned} warning${warned > 1 ? 's' : ''}`);
  parts.push(`${passed} passed`);
  parts.push(`${totalDocs} docs checked`);
  lines.push(parts.join(' | '));
  lines.push('');

  // Failed docs with check-level detail
  const failedDocs = report.docs.filter((d) => d.verdict === 'fail');
  if (failedDocs.length > 0) {
    lines.push('### Failed Docs');
    lines.push('');

    for (const doc of failedDocs) {
      lines.push(
        `#### ${doc.shortName} — FAIL (${doc.totalErrors} error${doc.totalErrors > 1 ? 's' : ''}${doc.totalWarnings > 0 ? `, ${doc.totalWarnings} warning${doc.totalWarnings > 1 ? 's' : ''}` : ''})`,
      );
      lines.push('');
      lines.push('| Check | Status | Details |');
      lines.push('|-------|--------|---------|');

      for (const check of doc.checks) {
        const status = check.status === 'fail' ? '**FAIL**' : check.status;
        let details = '';
        if (check.status === 'fail') {
          details = check.errors.map((e) => e.message).join('; ');
        } else if (check.status === 'skip') {
          details = check.skipReason ?? '';
        }
        lines.push(`| ${formatCheckName(check.check)} | ${status} | ${details} |`);
      }
      lines.push('');
    }
  }

  // Warned docs (collapsed)
  const warnedDocs = report.docs.filter((d) => d.verdict === 'warn');
  if (warnedDocs.length > 0) {
    lines.push('<details>');
    lines.push(
      `<summary>${warnedDocs.length} doc${warnedDocs.length > 1 ? 's' : ''} with warnings (click)</summary>`,
    );
    lines.push('');
    for (const doc of warnedDocs) {
      lines.push(
        `**${doc.shortName}** — ${doc.totalWarnings} warning${doc.totalWarnings > 1 ? 's' : ''}`,
      );
    }
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  // Passing docs (collapsed)
  const passingDocs = report.docs.filter((d) => d.verdict === 'pass');
  if (passingDocs.length > 0) {
    lines.push('<details>');
    lines.push(`<summary>${passingDocs.length} passing docs</summary>`);
    lines.push('');
    lines.push(passingDocs.map((d) => d.shortName).join(', '));
    lines.push('');
    lines.push('</details>');
  }

  return lines.join('\n');
}

/** Human-friendly check names for display */
function formatCheckName(check: string): string {
  const names: Record<string, string> = {
    'typecheck-snippets': 'Code Snippets',
    'api-references': 'API References',
    'config-defaults': 'Config Defaults',
    'import-paths': 'Import Paths',
    'claim-tests': 'Claim Tests',
    'example-test-map': 'Example-Test Map',
    'ai-review': 'AI Review',
    'sap-ui5-api': 'SAP UI5 API',
  };
  return names[check] ?? check;
}
