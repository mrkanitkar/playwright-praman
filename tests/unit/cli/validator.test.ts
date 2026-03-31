/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/validator.ts` — pre-flight environment validation.
 *
 * @remarks
 * Mocks `node:child_process` (execSync), `node:fs` (existsSync), and
 * `node:process` (env, versions) to cover all pass/fail/warn paths
 * without side effects on the host environment.
 *
 * @module cli/validator
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CheckResult } from '../../../src/cli/validator.js';
import { validate } from '../../../src/cli/validator.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

const { execSync } = await import('node:child_process');
const { existsSync, readFileSync } = await import('node:fs');
const { default: process } = await import('node:process');

const mockedExecSync = vi.mocked(execSync);
const mockedExistsSync = vi.mocked(existsSync);
const mockedReadFileSync = vi.mocked(readFileSync);

/**
 * Retrieves a named check from the report's check list.
 * Asserts the check exists before returning it.
 */
function getCheck(checks: readonly CheckResult[], name: string): CheckResult | undefined {
  const check = checks.find((c) => c.name === name);
  expect(check).toBeDefined();
  return check;
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('cli/validator', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: all fs checks return false (not found)
    mockedExistsSync.mockReturnValue(false);
    // Default: execSync returns a valid npm version string
    mockedExecSync.mockReturnValue('10.5.0\n');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  // ── checkNodeVersion ────────────────────────────────────────────────────────

  describe('Node.js version check', () => {
    it('passes when Node.js major version is exactly 22', () => {
      vi.spyOn(process.versions, 'node', 'get').mockReturnValue('22.0.0');

      const report = validate();
      const check = getCheck(report.checks, 'Node.js version');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('v22.0.0');
    });

    it('passes when Node.js major version is greater than 22', () => {
      vi.spyOn(process.versions, 'node', 'get').mockReturnValue('24.11.0');

      const report = validate();
      const check = getCheck(report.checks, 'Node.js version');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('v24.11.0');
    });

    it('fails when Node.js major version is 18', () => {
      vi.spyOn(process.versions, 'node', 'get').mockReturnValue('18.20.4');

      const report = validate();
      const check = getCheck(report.checks, 'Node.js version');

      expect(check?.status).toBe('fail');
      expect(check?.message).toContain('18.20.4');
      expect(check?.message).toContain('requires >=22');
      expect(check?.suggestion).toBeTruthy();
    });

    it('fails when Node.js major version is 16', () => {
      vi.spyOn(process.versions, 'node', 'get').mockReturnValue('16.14.0');

      const report = validate();
      const check = getCheck(report.checks, 'Node.js version');

      expect(check?.status).toBe('fail');
      expect(check?.suggestion).toContain('v22');
    });
  });

  // ── checkNpmAvailable ───────────────────────────────────────────────────────

  describe('npm available check', () => {
    it('passes when npm --version succeeds', () => {
      mockedExecSync.mockReturnValue('10.5.0\n');

      const report = validate();
      const check = getCheck(report.checks, 'npm available');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('v10.5.0');
    });

    it('passes when npm returns a version string with only major', () => {
      mockedExecSync.mockReturnValue('9\n');

      const report = validate();
      const check = getCheck(report.checks, 'npm available');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('v9');
    });

    it('fails when npm throws (not found on PATH)', () => {
      mockedExecSync.mockImplementation(() => {
        throw new Error('command not found: npm');
      });

      const report = validate();
      const check = getCheck(report.checks, 'npm available');

      expect(check?.status).toBe('fail');
      expect(check?.message).toBe('npm not found');
      expect(check?.suggestion).toContain('npm');
    });
  });

  // ── checkPlaywrightInstalled ────────────────────────────────────────────────

  describe('@playwright/test check', () => {
    it('passes when node_modules/@playwright/test exists', () => {
      mockedExistsSync.mockImplementation((filePath) => {
        const pathStr = String(filePath);
        return pathStr.includes('@playwright') && pathStr.includes('test');
      });

      const report = validate();
      const check = getCheck(report.checks, '@playwright/test');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('installed');
    });

    it('fails when node_modules/@playwright/test does not exist', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, '@playwright/test');

      expect(check?.status).toBe('fail');
      expect(check?.message).toBe('not installed');
      expect(check?.suggestion).toContain('@playwright/test');
    });
  });

  // ── checkPlaywrightVersion ──────────────────────────────────────────────────

  describe('Playwright version check', () => {
    it('passes when @playwright/test version is exactly 1.57.0', () => {
      mockedExistsSync.mockImplementation((filePath) => {
        return String(filePath).includes('@playwright');
      });
      mockedReadFileSync.mockReturnValue(JSON.stringify({ version: '1.57.0' }));

      const report = validate();
      const check = getCheck(report.checks, 'Playwright version');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('v1.57.0');
    });

    it('passes when @playwright/test version is above minimum (1.58.2)', () => {
      mockedReadFileSync.mockReturnValue(JSON.stringify({ version: '1.58.2' }));

      const report = validate();
      const check = getCheck(report.checks, 'Playwright version');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('v1.58.2');
    });

    it('fails when @playwright/test version is below minimum (1.56.0)', () => {
      mockedReadFileSync.mockReturnValue(JSON.stringify({ version: '1.56.0' }));

      const report = validate();
      const check = getCheck(report.checks, 'Playwright version');

      expect(check?.status).toBe('fail');
      expect(check?.message).toContain('requires >=1.57.0');
      expect(check?.suggestion).toContain('npm install');
    });

    it('fails when @playwright/test version is very old (1.20.0)', () => {
      mockedReadFileSync.mockReturnValue(JSON.stringify({ version: '1.20.0' }));

      const report = validate();
      const check = getCheck(report.checks, 'Playwright version');

      expect(check?.status).toBe('fail');
    });

    it('warns when @playwright/test package.json cannot be read', () => {
      mockedReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT');
      });

      const report = validate();
      const check = getCheck(report.checks, 'Playwright version');

      expect(check?.status).toBe('warn');
      expect(check?.message).toContain('Could not read');
    });

    it('warns when @playwright/test package.json has no version field', () => {
      mockedReadFileSync.mockReturnValue(JSON.stringify({}));

      const report = validate();
      const check = getCheck(report.checks, 'Playwright version');

      expect(check?.status).toBe('warn');
      expect(check?.message).toContain('Could not determine');
    });

    it('warns when @playwright/test package.json has empty version', () => {
      mockedReadFileSync.mockReturnValue(JSON.stringify({ version: '' }));

      const report = validate();
      const check = getCheck(report.checks, 'Playwright version');

      expect(check?.status).toBe('warn');
    });

    it('handles malformed version string gracefully', () => {
      mockedReadFileSync.mockReturnValue(JSON.stringify({ version: 'not-a-version' }));

      const report = validate();
      const check = getCheck(report.checks, 'Playwright version');

      // parse('not-a-version') => [NaN, NaN, NaN], comparison returns false => fail
      expect(check?.status).toBe('fail');
    });
  });

  // ── checkSapBaseUrl ─────────────────────────────────────────────────────────

  describe('SAP_CLOUD_BASE_URL check', () => {
    it('passes when SAP_CLOUD_BASE_URL is set to a non-empty value', () => {
      vi.stubEnv('SAP_CLOUD_BASE_URL', 'https://my-system.example.com');

      const report = validate();
      const check = getCheck(report.checks, 'SAP_CLOUD_BASE_URL');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('set');
    });

    it('warns when SAP_CLOUD_BASE_URL is not set', () => {
      vi.stubEnv('SAP_CLOUD_BASE_URL', '');

      const report = validate();
      const check = getCheck(report.checks, 'SAP_CLOUD_BASE_URL');

      expect(check?.status).toBe('warn');
      expect(check?.message).toBe('not set');
      expect(check?.suggestion).toContain('SAP_CLOUD_BASE_URL');
    });
  });

  // ── checkSapUsername ────────────────────────────────────────────────────────

  describe('SAP_CLOUD_USERNAME check', () => {
    it('passes when SAP_CLOUD_USERNAME is set to a non-empty value', () => {
      vi.stubEnv('SAP_CLOUD_USERNAME', 'myuser@example.com');

      const report = validate();
      const check = getCheck(report.checks, 'SAP_CLOUD_USERNAME');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('set');
    });

    it('warns when SAP_CLOUD_USERNAME is not set', () => {
      vi.stubEnv('SAP_CLOUD_USERNAME', '');

      const report = validate();
      const check = getCheck(report.checks, 'SAP_CLOUD_USERNAME');

      expect(check?.status).toBe('warn');
      expect(check?.message).toBe('not set');
      expect(check?.suggestion).toContain('SAP_CLOUD_USERNAME');
    });
  });

  // ── checkPlaywrightConfig ───────────────────────────────────────────────────

  describe('playwright.config.ts check', () => {
    it('passes when playwright.config.ts exists in cwd', () => {
      mockedExistsSync.mockImplementation((filePath) => {
        return String(filePath).endsWith('playwright.config.ts');
      });

      const report = validate();
      const check = getCheck(report.checks, 'playwright.config.ts');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('found');
    });

    it('warns when playwright.config.ts is missing', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, 'playwright.config.ts');

      expect(check?.status).toBe('warn');
      expect(check?.message).toBe('not found');
      expect(check?.suggestion).toContain('playwright.config.ts');
    });
  });

  // ── checkPramanConfig ───────────────────────────────────────────────────────

  describe('praman.config.ts check', () => {
    it('passes when praman.config.ts exists in cwd', () => {
      mockedExistsSync.mockImplementation((filePath) => {
        return String(filePath).endsWith('praman.config.ts');
      });

      const report = validate();
      const check = getCheck(report.checks, 'praman.config.ts');

      expect(check?.status).toBe('pass');
      expect(check?.message).toBe('found');
    });

    it('warns when praman.config.ts is missing', () => {
      mockedExistsSync.mockReturnValue(false);

      const report = validate();
      const check = getCheck(report.checks, 'praman.config.ts');

      expect(check?.status).toBe('warn');
      expect(check?.message).toBe('not found');
      expect(check?.suggestion).toContain('praman.config.ts');
    });
  });

  // ── validate() — structured report ─────────────────────────────────────────

  describe('validate() structured report', () => {
    it('returns a report with exactly 8 checks', () => {
      const report = validate();

      expect(report.checks).toHaveLength(8);
    });

    it('report contains passed, failed, and warnings counts', () => {
      const report = validate();

      expect(typeof report.passed).toBe('number');
      expect(typeof report.failed).toBe('number');
      expect(typeof report.warnings).toBe('number');
    });

    it('passed + failed + warnings equals total number of checks', () => {
      const report = validate();

      expect(report.passed + report.failed + report.warnings).toBe(report.checks.length);
    });

    it('counts pass status correctly when all checks succeed', () => {
      vi.spyOn(process.versions, 'node', 'get').mockReturnValue('22.0.0');
      mockedExecSync.mockReturnValue('10.0.0\n');
      mockedExistsSync.mockReturnValue(true);
      mockedReadFileSync.mockReturnValue(JSON.stringify({ version: '1.58.2' }));
      vi.stubEnv('SAP_CLOUD_BASE_URL', 'https://example.com');
      vi.stubEnv('SAP_CLOUD_USERNAME', 'admin');

      const report = validate();

      expect(report.passed).toBe(8);
      expect(report.failed).toBe(0);
      expect(report.warnings).toBe(0);
    });

    it('counts fail status correctly when node version is too old and npm is missing', () => {
      vi.spyOn(process.versions, 'node', 'get').mockReturnValue('16.0.0');
      mockedExecSync.mockImplementation(() => {
        throw new Error('npm not found');
      });
      mockedExistsSync.mockReturnValue(false);
      vi.stubEnv('SAP_CLOUD_BASE_URL', '');
      vi.stubEnv('SAP_CLOUD_USERNAME', '');

      const report = validate();

      expect(report.failed).toBeGreaterThan(0);
      expect(report.warnings).toBeGreaterThan(0);
    });

    it('all checks have required name, status, and message fields', () => {
      const report = validate();

      for (const check of report.checks) {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('status');
        expect(check).toHaveProperty('message');
        expect(['pass', 'fail', 'warn']).toContain(check.status);
      }
    });

    it('first check is the Node.js version check', () => {
      const report = validate();
      const firstCheck: CheckResult | undefined = report.checks[0];

      expect(firstCheck?.name).toBe('Node.js version');
    });
  });
});
