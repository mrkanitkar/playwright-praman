/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for the Control Tree Reporter.
 *
 * @module test-reporters
 */

import { Buffer } from 'node:buffer';

import type { Reporter } from '@playwright/test/reporter';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ControlTreeReport } from '../../../src/reporters/control-tree-reporter.js';
import { ControlTreeReporter } from '../../../src/reporters/control-tree-reporter.js';
import {
  createMockFullResult,
  createMockTestCase,
  createMockTestResult,
} from '../../helpers/mock-playwright-reporter.js';

// ── Mock node:fs/promises ────────────────────────────────────────────────────

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

/** Creates a Buffer from a JSON value, simulating an attachment body. */
function toAttachmentBody(data: unknown): Buffer {
  return Buffer.from(JSON.stringify(data), 'utf8');
}

/** Creates a minimal valid control tree snapshot for testing. */
function createMockSnapshot(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    capturedAt: '2026-03-29T10:30:00.000Z',
    ui5Version: '1.120.4',
    totalControlCount: 3,
    roots: [
      {
        id: '__button0',
        controlType: 'sap.m.Button',
        visible: true,
        enabled: true,
        domId: '__button0',
        properties: { text: 'Save' },
        bindingPaths: {},
        children: [],
      },
    ],
    pageUrl: 'https://host/app#PurchaseOrder-manage',
    truncated: false,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ControlTreeReporter', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('implements the Playwright Reporter interface', () => {
    const reporter = new ControlTreeReporter();
    const asReporter: Reporter = reporter;
    expect(typeof asReporter.onTestEnd).toBe('function');
    expect(typeof asReporter.onEnd).toBe('function');
    expect(typeof asReporter.printsToStdio).toBe('function');
  });

  it('printsToStdio returns false', () => {
    const reporter = new ControlTreeReporter();
    expect(reporter.printsToStdio()).toBe(false);
  });

  it('collects snapshots from failed test attachments', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter({ outputDir: './reports/tree' });
    const testCase = createMockTestCase({ title: 'should create PO' });
    const result = createMockTestResult({ status: 'failed' });
    result.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: toAttachmentBody(createMockSnapshot()),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    // Should write both JSON and HTML reports
    expect(writeFile).toHaveBeenCalledTimes(2);

    // Verify JSON report content
    const jsonCall = vi
      .mocked(writeFile)
      .mock.calls.find((call) => typeof call[0] === 'string' && call[0].endsWith('.json'));
    expect(jsonCall).toBeDefined();
    const report = JSON.parse((jsonCall?.[1] ?? '') as string) as ControlTreeReport;
    expect(report.failedTests).toHaveLength(1);
    expect(report.failedTests[0]?.testTitle).toBe('should create PO');
    expect(report.failedTests[0]?.snapshot.ui5Version).toBe('1.120.4');
    expect(report.failedTests[0]?.snapshot.totalControlCount).toBe(3);
  });

  it('ignores attachments from passed tests', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter();
    const testCase = createMockTestCase({ title: 'passing test' });
    const result = createMockTestResult({ status: 'passed' });
    result.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: toAttachmentBody(createMockSnapshot()),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    // Should NOT write any reports (no failed tests)
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('ignores attachments from skipped tests', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter();
    const testCase = createMockTestCase({ title: 'skipped test' });
    const result = createMockTestResult({ status: 'skipped' });
    result.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: toAttachmentBody(createMockSnapshot()),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    expect(writeFile).not.toHaveBeenCalled();
  });

  it('ignores non-control-tree attachments', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter();
    const testCase = createMockTestCase({ title: 'failing test' });
    const result = createMockTestResult({ status: 'failed' });
    result.attachments.push({
      name: 'odata-trace',
      contentType: 'application/json',
      body: toAttachmentBody({ some: 'data' }),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    expect(writeFile).not.toHaveBeenCalled();
  });

  it('skips malformed JSON attachments gracefully', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter();
    const testCase = createMockTestCase({ title: 'bad json test' });
    const result = createMockTestResult({ status: 'failed' });
    result.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: Buffer.from('not valid json{{{', 'utf8'),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    // No valid entries → no report written
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('skips attachments that fail type guard (missing required fields)', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter();
    const testCase = createMockTestCase({ title: 'invalid snapshot' });
    const result = createMockTestResult({ status: 'failed' });
    result.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: toAttachmentBody({ someOther: 'data' }),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    expect(writeFile).not.toHaveBeenCalled();
  });

  it('generates HTML report with collapsible tree structure', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter({ outputDir: './reports' });
    const testCase = createMockTestCase({ title: 'html test' });
    const result = createMockTestResult({ status: 'failed' });
    result.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: toAttachmentBody(createMockSnapshot()),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const htmlCall = vi
      .mocked(writeFile)
      .mock.calls.find((call) => typeof call[0] === 'string' && call[0].endsWith('.html'));
    expect(htmlCall).toBeDefined();
    const html = (htmlCall?.[1] ?? '') as string;

    // Verify HTML structure
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('UI5 Control Tree Report');
    expect(html).toContain('__button0');
    expect(html).toContain('sap.m.Button');
    expect(html).toContain('Save');
    expect(html).toContain('filterTree');
    expect(html).toContain('search-box');
  });

  it('HTML report includes color coding classes', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter();
    const testCase = createMockTestCase({ title: 'color test' });
    const result = createMockTestResult({ status: 'failed' });
    const snapshot = createMockSnapshot({
      roots: [
        {
          id: 'visibleBtn',
          controlType: 'sap.m.Button',
          visible: true,
          enabled: true,
          domId: 'visibleBtn',
          properties: {},
          bindingPaths: {},
          children: [
            {
              id: 'hiddenLabel',
              controlType: 'sap.m.Label',
              visible: false,
              enabled: true,
              domId: null,
              properties: {},
              bindingPaths: {},
              children: [],
            },
            {
              id: 'disabledInput',
              controlType: 'sap.m.Input',
              visible: true,
              enabled: false,
              domId: 'disabledInput',
              properties: {},
              bindingPaths: {},
              children: [],
            },
          ],
        },
      ],
    });
    result.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: toAttachmentBody(snapshot),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    const htmlCall = vi
      .mocked(writeFile)
      .mock.calls.find((call) => typeof call[0] === 'string' && call[0].endsWith('.html'));
    const html = (htmlCall?.[1] ?? '') as string;

    expect(html).toContain('node-visible');
    expect(html).toContain('node-invisible');
    expect(html).toContain('node-disabled');
    expect(html).toContain('badge-invisible');
    expect(html).toContain('badge-disabled');
  });

  it('uses default outputDir when not specified', async () => {
    const { mkdir } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter();
    const testCase = createMockTestCase({ title: 'default dir' });
    const result = createMockTestResult({ status: 'failed' });
    result.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: toAttachmentBody(createMockSnapshot()),
    });

    reporter.onTestEnd(testCase, result);
    await reporter.onEnd(createMockFullResult());

    expect(mkdir).toHaveBeenCalledWith('test-results/praman-reports', { recursive: true });
  });

  it('collects multiple failed tests', async () => {
    const { writeFile } = await import('node:fs/promises');

    const reporter = new ControlTreeReporter();

    // First failed test
    const test1 = createMockTestCase({ title: 'test 1' });
    const result1 = createMockTestResult({ status: 'failed' });
    result1.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: toAttachmentBody(createMockSnapshot({ ui5Version: '1.120.0' })),
    });
    reporter.onTestEnd(test1, result1);

    // Second failed test
    const test2 = createMockTestCase({ title: 'test 2' });
    const result2 = createMockTestResult({ status: 'failed' });
    result2.attachments.push({
      name: 'ui5-control-tree',
      contentType: 'application/json',
      body: toAttachmentBody(createMockSnapshot({ ui5Version: '1.108.0' })),
    });
    reporter.onTestEnd(test2, result2);

    await reporter.onEnd(createMockFullResult());

    const jsonCall = vi
      .mocked(writeFile)
      .mock.calls.find((call) => typeof call[0] === 'string' && call[0].endsWith('.json'));
    const report = JSON.parse((jsonCall?.[1] ?? '') as string) as ControlTreeReport;
    expect(report.failedTests).toHaveLength(2);
  });
});
