/**
 * Pre-flight validation checks for the Praman CLI.
 *
 * @remarks
 * Runs environment checks before init/doctor commands execute.
 * Returns a structured report with pass/fail/warn status per check.
 *
 * @module cli/validator
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

/**
 * The result status of a single pre-flight check.
 *
 * @remarks
 * - `pass` — the check passed with no issues
 * - `fail` — a required condition is not met
 * - `warn` — an optional condition is not met but execution can continue
 */
export type CheckStatus = 'pass' | 'fail' | 'warn';

/**
 * Result of a single pre-flight validation check.
 *
 * @example
 * ```typescript
 * const result: CheckResult = {
 *   name: 'Node.js version',
 *   status: 'pass',
 *   message: 'v20.11.0',
 * };
 * ```
 */
export interface CheckResult {
  readonly name: string;
  readonly status: CheckStatus;
  readonly message: string;
  readonly suggestion?: string;
}

/**
 * Aggregated report from all pre-flight validation checks.
 *
 * @example
 * ```typescript
 * const report = validate();
 * if (report.failed \> 0) {
 *   process.exitCode = 1;
 * }
 * ```
 */
export interface ValidationReport {
  readonly checks: readonly CheckResult[];
  readonly passed: number;
  readonly failed: number;
  readonly warnings: number;
}

/**
 * Checks that the running Node.js version meets the minimum requirement (`>=20`).
 */
function checkNodeVersion(): CheckResult {
  const version = process.versions.node;
  const [majorStr] = version.split('.');
  const major = Number(majorStr);
  if (major >= 20) {
    return { name: 'Node.js version', status: 'pass', message: `v${version}` };
  }
  return {
    name: 'Node.js version',
    status: 'fail',
    message: `v${version} (requires >=20)`,
    suggestion: 'Upgrade Node.js to v20 or later',
  };
}

/**
 * Checks that `npm` is available on the PATH by running `npm --version`.
 */
function checkNpmAvailable(): CheckResult {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- npm is a well-known tool; command is a fixed string with no user input
    const version = execSync('npm --version', { encoding: 'utf8', stdio: 'pipe' }).trim();
    return { name: 'npm available', status: 'pass', message: `v${version}` };
  } catch {
    return {
      name: 'npm available',
      status: 'fail',
      message: 'npm not found',
      suggestion: 'Install Node.js which includes npm',
    };
  }
}

/**
 * Checks that `@playwright/test` is installed in the project's `node_modules`.
 *
 * @remarks
 * Uses an ESM-compatible directory existence check instead of `require.resolve`,
 * which is unavailable in pure ESM modules.
 */
function checkPlaywrightInstalled(): CheckResult {
  const playwrightPath = join(process.cwd(), 'node_modules', '@playwright', 'test');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is constructed from cwd() + fixed segments
  if (existsSync(playwrightPath)) {
    return { name: '@playwright/test', status: 'pass', message: 'installed' };
  }
  return {
    name: '@playwright/test',
    status: 'fail',
    message: 'not installed',
    suggestion: 'npm install -D @playwright/test',
  };
}

/**
 * Checks that the `SAP_CLOUD_BASE_URL` environment variable is configured.
 */
function checkSapBaseUrl(): CheckResult {
  const value = process.env['SAP_CLOUD_BASE_URL'];
  if (value !== undefined && value.length > 0) {
    return { name: 'SAP_CLOUD_BASE_URL', status: 'pass', message: 'set' };
  }
  return {
    name: 'SAP_CLOUD_BASE_URL',
    status: 'warn',
    message: 'not set',
    suggestion: 'Set SAP_CLOUD_BASE_URL to your SAP BTP or on-premise base URL',
  };
}

/**
 * Checks that the `SAP_CLOUD_USERNAME` environment variable is configured.
 */
function checkSapUsername(): CheckResult {
  const value = process.env['SAP_CLOUD_USERNAME'];
  if (value !== undefined && value.length > 0) {
    return { name: 'SAP_CLOUD_USERNAME', status: 'pass', message: 'set' };
  }
  return {
    name: 'SAP_CLOUD_USERNAME',
    status: 'warn',
    message: 'not set',
    suggestion: 'Set SAP_CLOUD_USERNAME to your SAP login username',
  };
}

const PLAYWRIGHT_CONFIG_FILE = 'playwright.config.ts';
const PRAMAN_CONFIG_FILE = 'praman.config.ts';

/**
 * Checks that a `playwright.config.ts` file exists in the current working directory.
 */
function checkPlaywrightConfig(): CheckResult {
  const configPath = join(process.cwd(), PLAYWRIGHT_CONFIG_FILE);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is constructed from cwd() + fixed filename
  if (existsSync(configPath)) {
    return { name: PLAYWRIGHT_CONFIG_FILE, status: 'pass', message: 'found' };
  }
  return {
    name: PLAYWRIGHT_CONFIG_FILE,
    status: 'warn',
    message: 'not found',
    suggestion: `Create a ${PLAYWRIGHT_CONFIG_FILE} in your project root`,
  };
}

/**
 * Checks that a `praman.config.ts` file exists in the current working directory.
 */
function checkPramanConfig(): CheckResult {
  const configPath = join(process.cwd(), PRAMAN_CONFIG_FILE);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is constructed from cwd() + fixed filename
  if (existsSync(configPath)) {
    return { name: PRAMAN_CONFIG_FILE, status: 'pass', message: 'found' };
  }
  return {
    name: PRAMAN_CONFIG_FILE,
    status: 'warn',
    message: 'not found',
    suggestion: `Create a ${PRAMAN_CONFIG_FILE} in your project root`,
  };
}

/**
 * Runs all pre-flight environment checks and returns a structured report.
 *
 * @remarks
 * Checks include: Node.js version, npm availability, Playwright installation,
 * SAP environment variables, and project configuration files. Intended to be
 * called by the `init` and `doctor` CLI commands before performing any actions.
 *
 * @returns A {@link ValidationReport} containing all check results and counts.
 *
 * @example
 * ```typescript
 * import { validate } from './validator.js';
 *
 * const report = validate();
 * if (report.failed \> 0) {
 *   process.exitCode = 1;
 * }
 * ```
 */
export function validate(): ValidationReport {
  const checks: CheckResult[] = [
    checkNodeVersion(),
    checkNpmAvailable(),
    checkPlaywrightInstalled(),
    checkSapBaseUrl(),
    checkSapUsername(),
    checkPlaywrightConfig(),
    checkPramanConfig(),
  ];
  return {
    checks,
    passed: checks.filter((c) => c.status === 'pass').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    warnings: checks.filter((c) => c.status === 'warn').length,
  };
}
