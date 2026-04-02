/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/snapshot-command.ts` — SAP UI5 control tree snapshot command.
 *
 * @remarks
 * Mocks `node:child_process` (`execSync`) to simulate Playwright CLI responses.
 * Tests cover:
 * - JSON / YAML / table output formatters
 * - `filterByType` and `limitDepth` helpers
 * - `executeEnricherScript` success and error paths
 * - `runSnapshot` orchestration (banner, filter, depth, output routing)
 * - `buildEnricherScript` returns a non-empty string
 * - `SnapshotError` is a proper `PramanError` subclass
 *
 * @module cli/snapshot-command.test
 */

import process from 'node:process';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ControlSnapshot } from '../../../src/cli/snapshot-command.js';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  writeFileSync: vi.fn(),
}));

vi.mock('../../../src/cli/logger.js', () => ({
  logBanner: vi.fn(),
  logSuccess: vi.fn(),
  logWarn: vi.fn(),
  logError: vi.fn(),
  logSection: vi.fn(),
  logStep: vi.fn(),
  logRaw: vi.fn(),
  logDivider: vi.fn(),
  logTable: vi.fn(),
}));

vi.mock('../../../src/cli/version.js', () => ({
  getVersion: vi.fn(() => '1.0.0'),
}));

// Import mocked modules after vi.mock declarations
const { execSync } = await import('node:child_process');
const { writeFileSync } = await import('node:fs');
const { logBanner, logSuccess, logWarn, logError } = await import('../../../src/cli/logger.js');

const mockedExecSync = vi.mocked(execSync);
const mockedWriteFileSync = vi.mocked(writeFileSync);
const mockedLogBanner = vi.mocked(logBanner);
const mockedLogSuccess = vi.mocked(logSuccess);
const mockedLogWarn = vi.mocked(logWarn);
const mockedLogError = vi.mocked(logError);

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_OUT_PATH = '/home/testuser/snapshots/snap.json';
const TEST_OUT_PATH2 = '/home/testuser/snapshots/test-snapshot.json';

/** Minimal valid ControlSnapshot for test use. */
function makeControl(overrides: Partial<ControlSnapshot> = {}): ControlSnapshot {
  return {
    id: '__button0',
    type: 'sap.m.Button',
    visible: true,
    properties: { text: 'Save', enabled: true },
    bindings: [],
    ...overrides,
  };
}

// ── Import subject under test ─────────────────────────────────────────────────

const {
  buildEnricherScript,
  executeEnricherScript,
  filterByType,
  formatJson,
  formatTable,
  formatYaml,
  limitDepth,
  runSnapshot,
  SnapshotError,
  writeOutput,
} = await import('../../../src/cli/snapshot-command.js');

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('cli/snapshot-command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = undefined;
  });

  // ── buildEnricherScript ──────────────────────────────────────────────────

  describe('buildEnricherScript()', () => {
    it('returns a non-empty IIFE string', () => {
      const script = buildEnricherScript();
      expect(typeof script).toBe('string');
      expect(script.length).toBeGreaterThan(100);
    });

    it('contains ElementRegistry reference', () => {
      const script = buildEnricherScript();
      expect(script).toContain('ElementRegistry');
    });

    it('returns JSON.stringify in the script body', () => {
      const script = buildEnricherScript();
      expect(script).toContain('JSON.stringify');
    });
  });

  // ── SnapshotError ────────────────────────────────────────────────────────

  describe('SnapshotError', () => {
    it('is an instance of PramanError', async () => {
      const { PramanError } = await import('../../../src/core/errors/base.js');
      const err = new SnapshotError({
        message: 'test error',
        attempted: 'test operation',
      });
      expect(err).toBeInstanceOf(PramanError);
    });

    it('has name SnapshotError', () => {
      const err = new SnapshotError({
        message: 'test error',
        attempted: 'test operation',
      });
      expect(err.name).toBe('SnapshotError');
    });

    it('uses ERR_BRIDGE_EXECUTION code', () => {
      const err = new SnapshotError({
        message: 'test error',
        attempted: 'test operation',
      });
      expect(err.code).toBe('ERR_BRIDGE_EXECUTION');
    });

    it('sets retryable to false', () => {
      const err = new SnapshotError({
        message: 'test error',
        attempted: 'test operation',
      });
      expect(err.retryable).toBe(false);
    });
  });

  // ── filterByType ──────────────────────────────────────────────────────────

  describe('filterByType()', () => {
    const controls: ControlSnapshot[] = [
      makeControl({ id: 'btn1', type: 'sap.m.Button' }),
      makeControl({ id: 'input1', type: 'sap.m.Input' }),
      makeControl({ id: 'btn2', type: 'sap.m.Button' }),
      makeControl({ id: 'label1', type: 'sap.m.Label' }),
      makeControl({ id: 'table1', type: 'sap.ui.table.Table' }),
    ];

    it('filters to exact type match', () => {
      const result = filterByType(controls, 'sap.m.Button');
      expect(result).toHaveLength(2);
      expect(result.every((c) => c.type === 'sap.m.Button')).toBe(true);
    });

    it('filters by namespace prefix', () => {
      const result = filterByType(controls, 'sap.m');
      expect(result).toHaveLength(4);
    });

    it('returns empty array when no match', () => {
      const result = filterByType(controls, 'sap.uxap');
      expect(result).toHaveLength(0);
    });

    it('returns all controls when filter is empty string', () => {
      const result = filterByType(controls, '');
      expect(result).toHaveLength(controls.length);
    });

    it('preserves order of matching controls', () => {
      const result = filterByType(controls, 'sap.m.Button');
      expect(result[0]?.id).toBe('btn1');
      expect(result[1]?.id).toBe('btn2');
    });
  });

  // ── limitDepth ────────────────────────────────────────────────────────────

  describe('limitDepth()', () => {
    const controls: ControlSnapshot[] = Array.from({ length: 10 }, (_, i) =>
      makeControl({ id: `ctrl${String(i)}`, type: 'sap.m.Button' }),
    );

    it('limits to specified count', () => {
      expect(limitDepth(controls, 3)).toHaveLength(3);
    });

    it('returns all when depth is 0', () => {
      expect(limitDepth(controls, 0)).toHaveLength(10);
    });

    it('returns all when depth exceeds array length', () => {
      expect(limitDepth(controls, 100)).toHaveLength(10);
    });

    it('preserves order (first N elements)', () => {
      const result = limitDepth(controls, 2);
      expect(result[0]?.id).toBe('ctrl0');
      expect(result[1]?.id).toBe('ctrl1');
    });

    it('does not mutate the input array', () => {
      const original = [...controls];
      limitDepth(controls, 3);
      expect(controls).toHaveLength(original.length);
    });
  });

  // ── formatJson ────────────────────────────────────────────────────────────

  describe('formatJson()', () => {
    it('returns valid JSON string', () => {
      const controls = [makeControl()];
      const json = formatJson(controls);
      const parsed = JSON.parse(json) as unknown;
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('serialises all fields', () => {
      const ctrl = makeControl({
        id: 'myBtn',
        type: 'sap.m.Button',
        visible: false,
        properties: { text: 'Click me', enabled: true },
        bindings: [{ property: 'text', path: '/i18n>BTN', model: '' }],
      });
      const parsed = JSON.parse(formatJson([ctrl])) as ControlSnapshot[];
      expect(parsed[0]).toMatchObject({
        id: 'myBtn',
        type: 'sap.m.Button',
        visible: false,
        properties: { text: 'Click me', enabled: true },
        bindings: [{ property: 'text', path: '/i18n>BTN', model: '' }],
      });
    });

    it('returns empty JSON array for empty input', () => {
      expect(formatJson([])).toBe('[]');
    });
  });

  // ── formatYaml ────────────────────────────────────────────────────────────

  describe('formatYaml()', () => {
    it('starts with "controls:" key', () => {
      const yaml = formatYaml([makeControl()]);
      expect(yaml).toMatch(/^controls:/);
    });

    it('includes control id and type', () => {
      const ctrl = makeControl({ id: '__btn0', type: 'sap.m.Button' });
      const yaml = formatYaml([ctrl]);
      expect(yaml).toContain('"__btn0"');
      expect(yaml).toContain('"sap.m.Button"');
    });

    it('includes binding information when present', () => {
      const ctrl = makeControl({
        bindings: [{ property: 'value', path: '/Name', model: 'odata' }],
      });
      const yaml = formatYaml([ctrl]);
      expect(yaml).toContain('bindings:');
      expect(yaml).toContain('/Name');
    });

    it('produces output ending with newline', () => {
      const yaml = formatYaml([makeControl()]);
      expect(yaml.endsWith('\n')).toBe(true);
    });

    it('handles empty array gracefully', () => {
      const yaml = formatYaml([]);
      expect(yaml).toContain('controls:');
    });
  });

  // ── formatTable ───────────────────────────────────────────────────────────

  describe('formatTable()', () => {
    it('returns "(no controls found)" for empty input', () => {
      expect(formatTable([])).toContain('no controls found');
    });

    it('includes column headers ID, TYPE, VIS', () => {
      const table = formatTable([makeControl()]);
      expect(table).toContain('ID');
      expect(table).toContain('TYPE');
      expect(table).toContain('VIS');
    });

    it('includes control id and type in rows', () => {
      const ctrl = makeControl({ id: '__btn0', type: 'sap.m.Button' });
      const table = formatTable([ctrl]);
      expect(table).toContain('__btn0');
      expect(table).toContain('sap.m.Button');
    });

    it('shows "yes" for visible and "no" for invisible', () => {
      const controls = [
        makeControl({ id: 'v', visible: true }),
        makeControl({ id: 'h', visible: false }),
      ];
      const table = formatTable(controls);
      expect(table).toContain('yes');
      expect(table).toContain('no');
    });

    it('shows text property in the TEXT/VALUE column', () => {
      const ctrl = makeControl({ properties: { text: 'Save Order' } });
      const table = formatTable([ctrl]);
      expect(table).toContain('Save Order');
    });

    it('falls back to value property when text is absent', () => {
      const ctrl = makeControl({ properties: { value: 'John Doe' } });
      const table = formatTable([ctrl]);
      expect(table).toContain('John Doe');
    });
  });

  // ── writeOutput ───────────────────────────────────────────────────────────

  describe('writeOutput()', () => {
    it('writes to file when outputPath is provided', () => {
      writeOutput('{"controls":[]}', TEST_OUT_PATH);
      expect(mockedWriteFileSync).toHaveBeenCalledWith(TEST_OUT_PATH, '{"controls":[]}', 'utf8');
    });

    it('calls logSuccess when writing to file', () => {
      writeOutput('{}', TEST_OUT_PATH);
      expect(mockedLogSuccess).toHaveBeenCalled();
    });

    it('writes to stdout when outputPath is undefined', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      writeOutput('hello', undefined);
      expect(stdoutSpy).toHaveBeenCalledWith('hello');
      stdoutSpy.mockRestore();
    });
  });

  // ── executeEnricherScript ─────────────────────────────────────────────────

  describe('executeEnricherScript()', () => {
    it('returns parsed ControlSnapshot array on success', () => {
      const controls = [makeControl()];
      mockedExecSync.mockReturnValue(JSON.stringify(controls));

      const result = executeEnricherScript('pwtest');
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('__button0');
    });

    it('passes session name to playwright cli run-code command', () => {
      mockedExecSync.mockReturnValue(JSON.stringify([]));
      executeEnricherScript('my-session');
      const callArg = mockedExecSync.mock.calls[0]?.[0];
      expect(callArg).toContain('--session my-session');
    });

    it('throws SnapshotError when execSync throws', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('CLI exited with code 1');
      });

      expect(() => executeEnricherScript('pwtest')).toThrow(SnapshotError);
    });

    it('throws SnapshotError when output is non-JSON', () => {
      mockedExecSync.mockReturnValue('not json at all');

      expect(() => executeEnricherScript('pwtest')).toThrow(SnapshotError);
    });

    it('throws SnapshotError when enricher returns error sentinel', () => {
      mockedExecSync.mockReturnValue(JSON.stringify({ __error: 'sap is not defined' }));

      expect(() => executeEnricherScript('pwtest')).toThrow(SnapshotError);
    });

    it('throws SnapshotError when output is not an array', () => {
      mockedExecSync.mockReturnValue(JSON.stringify({ foo: 'bar' }));

      expect(() => executeEnricherScript('pwtest')).toThrow(SnapshotError);
    });

    it('returns empty array when ElementRegistry has no controls', () => {
      mockedExecSync.mockReturnValue(JSON.stringify([]));
      expect(executeEnricherScript('pwtest')).toHaveLength(0);
    });

    it('SnapshotError details include session name on CLI failure', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('spawn failed');
      });

      let caught: unknown;
      try {
        executeEnricherScript('my-session');
      } catch (e) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(SnapshotError);
      const err = caught as { details: Record<string, unknown> };
      expect(err.details['session']).toBe('my-session');
    });
  });

  // ── runSnapshot ───────────────────────────────────────────────────────────

  describe('runSnapshot()', () => {
    beforeEach(() => {
      const controls: ControlSnapshot[] = [
        makeControl({ id: 'btn1', type: 'sap.m.Button', properties: { text: 'Save' } }),
        makeControl({ id: 'input1', type: 'sap.m.Input', properties: { value: 'John' } }),
        makeControl({ id: 'label1', type: 'sap.m.Label', properties: { text: 'Name' } }),
      ];
      mockedExecSync.mockReturnValue(JSON.stringify(controls));
    });

    it('logs the Praman banner', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      runSnapshot({});
      expect(mockedLogBanner).toHaveBeenCalledWith('Praman Snapshot', '1.0.0');
      stdoutSpy.mockRestore();
    });

    it('writes JSON to stdout by default', () => {
      const chunks: string[] = [];
      const stdoutSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation((chunk: string | Uint8Array) => {
          chunks.push(typeof chunk === 'string' ? chunk : '');
          return true;
        });
      runSnapshot({});
      const output = chunks.join('');
      const parsed = JSON.parse(output) as ControlSnapshot[];
      expect(parsed).toHaveLength(3);
      stdoutSpy.mockRestore();
    });

    it('writes YAML when format is yaml', () => {
      const chunks: string[] = [];
      const stdoutSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation((chunk: string | Uint8Array) => {
          chunks.push(typeof chunk === 'string' ? chunk : '');
          return true;
        });
      runSnapshot({ format: 'yaml' });
      const output = chunks.join('');
      expect(output).toMatch(/^controls:/);
      stdoutSpy.mockRestore();
    });

    it('writes table when format is table', () => {
      const chunks: string[] = [];
      const stdoutSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation((chunk: string | Uint8Array) => {
          chunks.push(typeof chunk === 'string' ? chunk : '');
          return true;
        });
      runSnapshot({ format: 'table' });
      const output = chunks.join('');
      expect(output).toContain('ID');
      expect(output).toContain('TYPE');
      stdoutSpy.mockRestore();
    });

    it('filters controls by type when --filter is set', () => {
      const chunks: string[] = [];
      const stdoutSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation((chunk: string | Uint8Array) => {
          chunks.push(typeof chunk === 'string' ? chunk : '');
          return true;
        });
      runSnapshot({ filter: 'sap.m.Button' });
      const output = chunks.join('');
      const parsed = JSON.parse(output) as ControlSnapshot[];
      expect(parsed).toHaveLength(1);
      expect(parsed[0]?.type).toBe('sap.m.Button');
      stdoutSpy.mockRestore();
    });

    it('logs a warning when filter yields no controls', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      runSnapshot({ filter: 'sap.uxap.ObjectPage' });
      expect(mockedLogWarn).toHaveBeenCalled();
      stdoutSpy.mockRestore();
    });

    it('applies depth limit when --depth is set', () => {
      const chunks: string[] = [];
      const stdoutSpy = vi
        .spyOn(process.stdout, 'write')
        .mockImplementation((chunk: string | Uint8Array) => {
          chunks.push(typeof chunk === 'string' ? chunk : '');
          return true;
        });
      runSnapshot({ depth: 1 });
      const output = chunks.join('');
      const parsed = JSON.parse(output) as ControlSnapshot[];
      expect(parsed).toHaveLength(1);
      stdoutSpy.mockRestore();
    });

    it('writes to file when --output is specified', () => {
      runSnapshot({ output: TEST_OUT_PATH2 });
      expect(mockedWriteFileSync).toHaveBeenCalledWith(TEST_OUT_PATH2, expect.any(String), 'utf8');
    });

    it('sets process.exitCode = 1 and calls logError on SnapshotError', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('session not found');
      });
      runSnapshot({});
      expect(process.exitCode).toBe(1);
      expect(mockedLogError).toHaveBeenCalled();
    });

    it('uses default session "pwtest" when session not specified', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      runSnapshot({});
      const callArg = mockedExecSync.mock.calls[0]?.[0];
      expect(callArg).toContain('--session pwtest');
      stdoutSpy.mockRestore();
    });

    it('passes custom session name to execSync', () => {
      const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      runSnapshot({ session: 'my-session' });
      const callArg = mockedExecSync.mock.calls[0]?.[0];
      expect(callArg).toContain('--session my-session');
      stdoutSpy.mockRestore();
    });
  });
});
