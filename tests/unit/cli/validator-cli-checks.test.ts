/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for the 4 new CLI-related doctor checks added to `src/cli/validator.ts`.
 *
 * @remarks
 * Covers:
 * 1. `@playwright/cli` installed check
 * 2. `.playwright/praman-cli.config.json` exists check
 * 3. CLI agent files presence check
 *
 * Mocks `node:fs` (existsSync, readFileSync) to avoid filesystem side effects.
 *
 * @module cli/validator-cli-checks
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CheckResult } from '../../../src/cli/validator.js';
import { validate } from '../../../src/cli/validator.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn().mockReturnValue('10.5.0\n'),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const { existsSync, readFileSync } = await import('node:fs');
const { default: process } = await import('node:process');

const mockedExistsSync = vi.mocked(existsSync);
const mockedReadFileSync = vi.mocked(readFileSync);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Retrieves a named check from the report's check list.
 * Asserts the check exists before returning it.
 */
function getCheck(checks: readonly CheckResult[], name: string): CheckResult {
  const check = checks.find((c) => c.name === name);
  expect(check).toBeDefined();
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by expect(check).toBeDefined() above
  return check!;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('cli/validator — CLI checks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: all fs checks return false (not found)
    mockedExistsSync.mockReturnValue(false);
    // Default: readFileSync throws (config not found)
    mockedReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT');
    });
    // Stub node versions to pass the Node.js check
    vi.spyOn(process.versions, 'node', 'get').mockReturnValue('24.0.0');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // ── @playwright/cli installed ─────────────────────────────────────────────

  describe('@playwright/cli installed check', () => {
    it('passes when node_modules/@playwright/cli exists', () => {
      mockedExistsSync.mockImplementation((filePath) => {
        const p = String(filePath);
        return p.includes('@playwright') && p.includes('cli') && !p.includes('test');
      });

      const report = validate();
      const check = getCheck(report.checks, '@playwright/cli');

      expect(check.status).toBe('pass');
      expect(check.message).toBe('installed');
    });

    it('warns when node_modules/@playwright/cli does not exist', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, '@playwright/cli');

      expect(check.status).toBe('warn');
      expect(check.message).toBe('not installed (optional — for AI agent CLI mode)');
      expect(check.suggestion).toContain('@playwright/cli');
    });

    it('includes npm install suggestion when missing', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, '@playwright/cli');

      expect(check.suggestion).toContain('npm install');
    });
  });

  // ── .playwright/praman-cli.config.json exists ─────────────────────────────

  describe('.playwright/praman-cli.config.json check', () => {
    it('passes when .playwright/praman-cli.config.json exists', () => {
      mockedExistsSync.mockImplementation((filePath) => {
        return String(filePath).includes('praman-cli.config.json');
      });

      const report = validate();
      const check = getCheck(report.checks, '.playwright/praman-cli.config.json');

      expect(check.status).toBe('pass');
      expect(check.message).toBe('found');
    });

    it('warns when .playwright/praman-cli.config.json is missing', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, '.playwright/praman-cli.config.json');

      expect(check.status).toBe('warn');
      expect(check.message).toBe('not found');
      expect(check.suggestion).toBeTruthy();
    });

    it('includes init suggestion when config is missing', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, '.playwright/praman-cli.config.json');

      expect(check.suggestion).toContain('playwright-praman init');
    });
  });

  // ── CLI agent files present ───────────────────────────────────────────────

  describe('CLI agent files check', () => {
    it('passes when .claude/agents/praman-sap-planner-cli.md exists', () => {
      mockedExistsSync.mockImplementation((filePath) => {
        return String(filePath).includes('praman-sap-planner-cli.md');
      });

      const report = validate();
      const check = getCheck(report.checks, 'CLI agent files');

      expect(check.status).toBe('pass');
      expect(check.message).toBe('found');
    });

    it('warns when .claude/agents/praman-sap-planner-cli.md is missing', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, 'CLI agent files');

      expect(check.status).toBe('warn');
      expect(check.message).toContain('not found');
    });

    it('includes init-agents suggestion when agent files are missing', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, 'CLI agent files');

      expect(check.suggestion).toContain('init-agents');
    });

    it('marks missing agent files as optional in the message', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, 'CLI agent files');

      expect(check.message).toContain('optional');
    });
  });

  // ── validate() total check count ─────────────────────────────────────────

  describe('validate() with new checks registered', () => {
    it('returns a report with exactly 11 checks', () => {
      const report = validate();

      expect(report.checks).toHaveLength(11);
    });

    it('all 3 CLI checks have required name, status, and message fields', () => {
      const report = validate();
      const newCheckNames = [
        '@playwright/cli',
        '.playwright/praman-cli.config.json',
        'CLI agent files',
      ];

      for (const name of newCheckNames) {
        const check = report.checks.find((c) => c.name === name);
        expect(check, `Check "${name}" should be present`).toBeDefined();
        expect(check?.name).toBeTruthy();
        expect(check?.message).toBeTruthy();
        expect(['pass', 'fail', 'warn']).toContain(check?.status);
      }
    });

    it('passed + failed + warnings equals 11 with new checks', () => {
      const report = validate();

      expect(report.passed + report.failed + report.warnings).toBe(11);
    });
  });
});
