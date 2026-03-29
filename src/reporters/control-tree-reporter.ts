/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Playwright reporter that aggregates UI5 control tree snapshots from test attachments.
 *
 * @ai
 * @aiContext Reads `ui5-control-tree` attachments from failed test results and produces
 * two report files: `control-tree-report.json` (raw data) and `control-tree-report.html`
 * (standalone collapsible tree viewer with color-coded controls).
 *
 * @remarks
 * The reporter is an AGGREGATOR, not a capturer: it has no access to `page` or
 * browser context and relies entirely on data attached during test execution via
 * `testInfo.attach()` in the `controlTreeCapture` fixture.
 *
 * Only failed tests are included in the report. Passing test attachments are ignored.
 *
 * @example
 * ```typescript
 * // playwright.config.ts
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   reporter: [
 *     ['playwright-praman/reporters', { outputDir: 'test-results/praman-reports' }],
 *   ],
 * });
 * ```
 *
 * @module reporters
 */

import type { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

import type { ControlTreeNode, ControlTreeSnapshot } from '#bridge/control-tree-types.js';
import {
  CONTROL_TREE_ATTACHMENT_NAME,
  CONTROL_TREE_CONTENT_TYPE,
} from '#bridge/control-tree-types.js';
import { createLogger } from '#core/logging/index.js';

// ── Exported types ───────────────────────────────────────────────────

/**
 * Options for the ControlTreeReporter.
 *
 * @example
 * ```typescript
 * const options: ControlTreeReporterOptions = {
 *   outputDir: 'test-results/praman-reports',
 * };
 * ```
 */
export interface ControlTreeReporterOptions {
  /** Output directory for report files. Defaults to `'test-results/praman-reports'`. */
  readonly outputDir?: string;
}

/**
 * A single failed test entry with its captured control tree snapshot.
 *
 * @example
 * ```typescript
 * const entry: ControlTreeTestEntry = {
 *   testTitle: 'should create purchase order',
 *   testFile: 'tests/po-create.spec.ts',
 *   snapshot: { ... },
 * };
 * ```
 */
export interface ControlTreeTestEntry {
  /** Title of the failed test. */
  readonly testTitle: string;
  /** File path of the test. */
  readonly testFile: string;
  /** The captured control tree snapshot. */
  readonly snapshot: ControlTreeSnapshot;
}

/**
 * Complete control tree report structure.
 *
 * @example
 * ```typescript
 * const report: ControlTreeReport = {
 *   timestamp: '2026-03-29T10:30:00.000Z',
 *   failedTests: [entry1, entry2],
 * };
 * ```
 */
export interface ControlTreeReport {
  /** ISO 8601 timestamp when the report was generated. */
  readonly timestamp: string;
  /** Failed test entries with their control tree snapshots. */
  readonly failedTests: readonly ControlTreeTestEntry[];
}

// ── Reporter implementation ──────────────────────────────────────────

/**
 * Aggregates UI5 control tree snapshots from failed test attachments and generates
 * JSON and HTML reports.
 *
 * @remarks
 * In `onTestEnd()`, the reporter reads attachments named `'ui5-control-tree'` with
 * `application/json` content type from failed tests only. In `onEnd()`, it writes:
 * - `control-tree-report.json` — raw collected data
 * - `control-tree-report.html` — standalone collapsible tree viewer
 *
 * @example
 * ```typescript
 * // playwright.config.ts
 * export default defineConfig({
 *   reporter: [
 *     ['playwright-praman/reporters', { outputDir: 'reports' }],
 *   ],
 * });
 * ```
 */
export class ControlTreeReporter implements Reporter {
  private readonly entries: ControlTreeTestEntry[] = [];
  private readonly outputDir: string;

  constructor(options?: ControlTreeReporterOptions) {
    this.outputDir = options?.outputDir ?? 'test-results/praman-reports';
  }

  /**
   * Collects control tree snapshots from failed test attachments.
   *
   * @param test - The completed test case.
   * @param result - The test result containing attachments.
   *
   * @example
   * ```typescript
   * reporter.onTestEnd(testCase, testResult);
   * ```
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    // Only collect from failed tests
    if (result.status === 'passed' || result.status === 'skipped') {
      return;
    }

    for (const attachment of result.attachments) {
      if (
        attachment.contentType !== CONTROL_TREE_CONTENT_TYPE ||
        attachment.name !== CONTROL_TREE_ATTACHMENT_NAME
      ) {
        continue;
      }

      if (attachment.body !== undefined) {
        this.parseAndAddSnapshot(test, attachment.body);
      }
    }
  }

  /**
   * Writes the control tree report files (JSON + HTML).
   *
   * @param _result - The full test run result (unused).
   *
   * @example
   * ```typescript
   * await reporter.onEnd(fullResult);
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Reporter interface
  async onEnd(_result: FullResult): Promise<void> {
    if (this.entries.length === 0) {
      return;
    }

    const report: ControlTreeReport = {
      timestamp: new Date().toISOString(),
      failedTests: this.entries,
    };

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted outputDir option
    await mkdir(this.outputDir, { recursive: true });

    // Write JSON report
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted outputDir option + literal filename
    await writeFile(
      join(this.outputDir, 'control-tree-report.json'),
      JSON.stringify(report, undefined, 2),
      'utf8',
    );

    // Write HTML report
    const html = generateHtmlReport(report);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted outputDir option + literal filename
    await writeFile(join(this.outputDir, 'control-tree-report.html'), html, 'utf8');
  }

  /**
   * Indicates this reporter does not write to stdout/stderr.
   *
   * @returns Always `false`.
   *
   * @example
   * ```typescript
   * reporter.printsToStdio(); // false
   * ```
   */
  printsToStdio(): boolean {
    return false;
  }

  /** Parses a Buffer attachment body and adds a snapshot entry. */
  private parseAndAddSnapshot(test: TestCase, body: Buffer): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body.toString('utf8')) as unknown;
    } catch (error: unknown) {
      const log = createLogger('control-tree-reporter');
      log.debug({ err: error }, 'Malformed JSON in control tree attachment — skipping');
      return;
    }

    if (!isControlTreeSnapshot(parsed)) {
      return;
    }

    this.entries.push({
      testTitle: test.title,
      testFile: test.location.file,
      snapshot: parsed,
    });
  }
}

// ── Type guard ───────────────────────────────────────────────────────

/** Type guard for raw control tree snapshot data from attachments. */
function isControlTreeSnapshot(value: unknown): value is ControlTreeSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record['capturedAt'] === 'string' &&
    typeof record['ui5Version'] === 'string' &&
    typeof record['totalControlCount'] === 'number' &&
    Array.isArray(record['roots'])
  );
}

// ── HTML report generation ───────────────────────────────────────────

/** CSS styles for the HTML report. */
const REPORT_CSS = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
           background: #1e1e2e; color: #cdd6f4; padding: 24px; }
    h1 { color: #89b4fa; margin-bottom: 8px; font-size: 1.5rem; }
    .meta { color: #6c7086; font-size: 0.85rem; margin-bottom: 24px; }
    .test-section { margin-bottom: 32px; border: 1px solid #313244;
                    border-radius: 8px; overflow: hidden; }
    .test-header { background: #313244; padding: 12px 16px; cursor: pointer;
                   display: flex; justify-content: space-between; align-items: center; }
    .test-header:hover { background: #45475a; }
    .test-title { color: #f38ba8; font-weight: 600; }
    .test-file { color: #6c7086; font-size: 0.8rem; }
    .test-meta { color: #a6adc8; font-size: 0.8rem; }
    .tree-container { padding: 8px 16px; }
    details { margin-left: 20px; }
    details > summary { cursor: pointer; padding: 3px 6px; border-radius: 4px;
                        list-style: none; user-select: none; }
    details > summary::-webkit-details-marker { display: none; }
    details > summary::before { content: '\\25B6 '; font-size: 0.7rem; color: #6c7086; }
    details[open] > summary::before { content: '\\25BC '; }
    summary:hover { background: #313244; }
    .node-id { color: #89dceb; font-weight: 500; }
    .node-type { color: #a6adc8; font-size: 0.85rem; }
    .node-invisible { opacity: 0.4; }
    .node-disabled { color: #f38ba8; }
    .node-visible { color: #a6e3a1; }
    .props { margin: 4px 0 8px 24px; font-size: 0.8rem; color: #bac2de; }
    .prop-key { color: #fab387; }
    .prop-val { color: #a6e3a1; }
    .binding { color: #74c7ec; font-style: italic; }
    .badge { display: inline-block; padding: 1px 6px; border-radius: 3px;
             font-size: 0.7rem; margin-left: 6px; }
    .badge-invisible { background: #45475a; color: #6c7086; }
    .badge-disabled { background: #45475a; color: #f38ba8; }
    .badge-truncated { background: #f9e2af; color: #1e1e2e; }
    .search-box { width: 100%; padding: 8px 12px; margin-bottom: 16px;
                  background: #313244; color: #cdd6f4; border: 1px solid #45475a;
                  border-radius: 6px; font-size: 0.9rem; outline: none; }
    .search-box:focus { border-color: #89b4fa; }
    .leaf { margin-left: 20px; padding: 3px 6px; }
    .stats { display: flex; gap: 16px; flex-wrap: wrap; }
    .stat { background: #313244; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; }
`;

/** JavaScript for search/filter functionality in the HTML report. */
const REPORT_JS = `
    function filterTree(query) {
      var q = query.toLowerCase();
      var nodes = document.querySelectorAll('[data-control-id]');
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        var id = (el.getAttribute('data-control-id') || '').toLowerCase();
        var type = (el.getAttribute('data-control-type') || '').toLowerCase();
        if (!q || id.indexOf(q) !== -1 || type.indexOf(q) !== -1) {
          el.style.display = '';
          // Open parent details
          var parent = el.closest('details');
          while (parent) {
            parent.open = true;
            parent = parent.parentElement ? parent.parentElement.closest('details') : null;
          }
        } else {
          el.style.display = 'none';
        }
      }
    }
`;

/**
 * Generates a standalone HTML report with collapsible control tree viewer.
 *
 * @param report - The aggregated control tree report data.
 * @returns Complete HTML string.
 *
 * @example
 * ```typescript
 * const html = generateHtmlReport(report);
 * await writeFile('report.html', html, 'utf8');
 * ```
 */
function generateHtmlReport(report: ControlTreeReport): string {
  const testSections = report.failedTests.map((entry) => generateTestSection(entry)).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI5 Control Tree Report — Praman</title>
  <style>${REPORT_CSS}</style>
</head>
<body>
  <h1>UI5 Control Tree Report</h1>
  <p class="meta">Generated: ${escapeHtml(report.timestamp)} | Failed tests: ${String(report.failedTests.length)}</p>
  <input class="search-box" type="text" placeholder="Search by control ID or type..."
         oninput="filterTree(this.value)">
  ${testSections}
  <script>${REPORT_JS}</script>
</body>
</html>`;
}

/** Generates the HTML section for a single failed test. */
function generateTestSection(entry: ControlTreeTestEntry): string {
  const { snapshot } = entry;
  const treeHtml = snapshot.roots.map((root) => renderNode(root)).join('\n');

  return `<div class="test-section">
  <div class="test-header" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none'">
    <div>
      <span class="test-title">${escapeHtml(entry.testTitle)}</span>
      <div class="test-file">${escapeHtml(entry.testFile)}</div>
    </div>
    <div class="stats">
      <span class="stat">UI5 ${escapeHtml(snapshot.ui5Version)}</span>
      <span class="stat">${String(snapshot.totalControlCount)} controls</span>
      ${snapshot.truncated ? '<span class="stat badge-truncated">Truncated</span>' : ''}
    </div>
  </div>
  <div class="tree-container">
    ${treeHtml}
  </div>
</div>`;
}

/** Recursively renders a control tree node as collapsible HTML. */
function renderNode(node: ControlTreeNode): string {
  let visClass = 'node-visible';
  if (!node.visible) {
    visClass = 'node-invisible';
  } else if (!node.enabled) {
    visClass = 'node-disabled';
  }
  const badges: string[] = [];
  if (!node.visible) badges.push('<span class="badge badge-invisible">hidden</span>');
  if (!node.enabled) badges.push('<span class="badge badge-disabled">disabled</span>');
  if (node._truncated === true) badges.push('<span class="badge badge-truncated">truncated</span>');

  const propsHtml = renderProperties(node);
  const idDisplay = escapeHtml(node.id);
  const typeDisplay = escapeHtml(node.controlType);

  if (node.children.length === 0 && node._truncated !== true) {
    // Leaf node — no expand/collapse needed
    return `<div class="leaf ${visClass}" data-control-id="${escapeAttr(node.id)}" data-control-type="${escapeAttr(node.controlType)}">
  <span class="node-id">${idDisplay}</span> <span class="node-type">${typeDisplay}</span>${badges.join('')}
  ${propsHtml}
</div>`;
  }

  const childrenHtml = node.children.map((child) => renderNode(child)).join('\n');

  return `<details data-control-id="${escapeAttr(node.id)}" data-control-type="${escapeAttr(node.controlType)}">
  <summary class="${visClass}">
    <span class="node-id">${idDisplay}</span> <span class="node-type">${typeDisplay}</span>${badges.join('')}
  </summary>
  ${propsHtml}
  ${childrenHtml}
</details>`;
}

/** Renders properties and bindings for a node. */
function renderProperties(node: ControlTreeNode): string {
  const propEntries = Object.entries(node.properties);
  const bindingEntries = Object.entries(node.bindingPaths);

  if (propEntries.length === 0 && bindingEntries.length === 0) {
    return '';
  }

  const lines: string[] = [];

  const bindingMap = new Map(bindingEntries);
  const propertyKeys = new Set<string>();

  for (const [key, value] of propEntries) {
    propertyKeys.add(key);
    const binding = bindingMap.get(key);
    const bindingTag =
      binding !== undefined ? ` <span class="binding">\u2190 ${escapeHtml(binding)}</span>` : '';
    lines.push(
      `<span class="prop-key">${escapeHtml(key)}</span>: <span class="prop-val">${escapeHtml(String(value))}</span>${bindingTag}`,
    );
  }

  // Bindings without a corresponding property
  for (const [key, path] of bindingEntries) {
    if (!propertyKeys.has(key)) {
      lines.push(
        `<span class="prop-key">${escapeHtml(key)}</span>: <span class="binding">${escapeHtml(path)}</span>`,
      );
    }
  }

  return `<div class="props">${lines.join('<br>')}</div>`;
}

/** Escapes HTML special characters in text content. */
function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/** Escapes a string for safe use in HTML attribute values. */
function escapeAttr(text: string): string {
  return escapeHtml(text).replaceAll("'", '&#39;');
}
