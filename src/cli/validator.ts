/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Pre-flight validation checks for the Praman CLI.
 *
 * @remarks
 * Runs environment checks before init/doctor commands execute.
 * Returns a structured report with pass/fail/warn status per check.
 *
 * This file exceeds 300 LOC due to thirteen self-contained check functions with
 * individual TSDoc. A follow-up decomposition is planned.
 *
 * @module cli/validator
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
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
 * Checks that the running Node.js version meets the minimum requirement (`>=22`).
 */
function checkNodeVersion(): CheckResult {
  const version = process.versions.node;
  const [majorStr] = version.split('.');
  const major = Number(majorStr);
  if (major >= 22) {
    return { name: 'Node.js version', status: 'pass', message: `v${version}` };
  }
  return {
    name: 'Node.js version',
    status: 'fail',
    message: `v${version} (requires >=22)`,
    suggestion: 'Upgrade Node.js to v22 or later',
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

/** Minimum Playwright version required by Praman. Must match peerDependencies. */
const MIN_PLAYWRIGHT_VERSION = '1.57.0';
const PW_VERSION_CHECK_NAME = 'Playwright version';
const PW_SCOPE = '@playwright';

/**
 * Compares two semantic version strings numerically.
 *
 * @remarks
 * Self-contained in CLI module. Does not import from `#core/utils`
 * because CLI runs independently before project configuration.
 *
 * @param version - The version to check.
 * @param minimum - The minimum required version.
 * @returns `true` if version is greater than or equal to minimum.
 *
 * @example
 * ```typescript
 * isVersionAtLeast('1.58.2', '1.57.0'); // true
 * isVersionAtLeast('1.56.0', '1.57.0'); // false
 * ```
 */
function isVersionAtLeast(version: string, minimum: string): boolean {
  const parse = (v: string): readonly [number, number, number] => {
    const parts = v.split('.').map(Number);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  };
  const [vMajor, vMinor, vPatch] = parse(version);
  const [mMajor, mMinor, mPatch] = parse(minimum);
  if (vMajor !== mMajor) return vMajor > mMajor;
  if (vMinor !== mMinor) return vMinor > mMinor;
  return vPatch >= mPatch;
}

/**
 * Checks for packages that the scaffolded templates import at build time.
 *
 * @remarks
 * `playwright.config.ts` does `import 'dotenv/config'` and `tests/auth.setup.ts`
 * imports from `node:fs`. Neither `dotenv` nor `@types/node` is a runtime
 * dependency of this package, so a fresh project resolves neither and the
 * scaffolded files show import errors in the editor (issue #224). Surfacing a
 * single install command is friendlier than shipping both as dependencies of
 * every consumer.
 *
 * @example
 * ```typescript
 * const result = checkTemplatePeerPackages();
 * // { name: 'Template dependencies', status: 'warn', message: 'missing: dotenv' }
 * ```
 */
function checkTemplatePeerPackages(): CheckResult {
  const required = ['dotenv', join('@types', 'node')];
  const missing = required.filter(
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is cwd() + fixed package names
    (pkg) => !existsSync(join(process.cwd(), 'node_modules', pkg)),
  );

  if (missing.length === 0) {
    return { name: 'Template dependencies', status: 'pass', message: 'dotenv, @types/node' };
  }

  const names = missing.map((m) => m.replaceAll('\\', '/')).join(', ');
  return {
    name: 'Template dependencies',
    status: 'warn',
    message: `not installed: ${names}`,
    suggestion: 'npm install -D dotenv @types/node',
  };
}

/**
 * Checks that `@playwright/test` is installed in the project's `node_modules`.
 *
 * @remarks
 * Uses an ESM-compatible directory existence check instead of `require.resolve`,
 * which is unavailable in pure ESM modules.
 */
function checkPlaywrightInstalled(): CheckResult {
  const playwrightPath = join(process.cwd(), 'node_modules', PW_SCOPE, 'test');
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
 * Checks the installed `@playwright/test` version meets the minimum requirement.
 *
 * @remarks
 * Reads `node_modules/@playwright/test/package.json` from disk and validates
 * the version string against {@link MIN_PLAYWRIGHT_VERSION}.
 * Returns `warn` (not `fail`) when the version cannot be read, to avoid
 * blocking users when the package.json is temporarily inaccessible.
 *
 * @example
 * ```typescript
 * const result = checkPlaywrightVersion();
 * // { name: 'Playwright version', status: 'pass', message: 'v1.58.2' }
 * ```
 */
function checkPlaywrightVersion(): CheckResult {
  const pkgPath = join(process.cwd(), 'node_modules', PW_SCOPE, 'test', 'package.json');
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path constructed from cwd() + fixed segments
    const content = readFileSync(pkgPath, 'utf8');
    const pkg: { version?: string } = JSON.parse(content) as { version?: string };
    const version = pkg.version;
    if (version === undefined || version.length === 0) {
      return {
        name: PW_VERSION_CHECK_NAME,
        status: 'warn',
        message: 'Could not determine @playwright/test version',
        suggestion: 'Run: npm install @playwright/test@latest',
      };
    }
    if (isVersionAtLeast(version, MIN_PLAYWRIGHT_VERSION)) {
      return {
        name: PW_VERSION_CHECK_NAME,
        status: 'pass',
        message: `v${version}`,
      };
    }
    return {
      name: PW_VERSION_CHECK_NAME,
      status: 'fail',
      message: `v${version} (requires >=${MIN_PLAYWRIGHT_VERSION})`,
      suggestion: 'Run: npm install @playwright/test@latest',
    };
  } catch {
    return {
      name: PW_VERSION_CHECK_NAME,
      status: 'warn',
      message: 'Could not read @playwright/test version',
      suggestion: 'Run: npm install @playwright/test',
    };
  }
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

const PLAYWRIGHT_CLI_PKG = '@playwright/cli';
const PRAMAN_CLI_CONFIG_FILE = '.playwright/praman-cli.config.json';
const CLAUDE_AGENT_FILE = '.claude/agents/praman-sap-planner-cli.md';
const PLAYWRIGHT_CONFIG_FILE = 'playwright.config.ts';
const PRAMAN_CONFIG_FILE = 'praman.config.ts';

/**
 * Checks that `@playwright/cli` is installed in the project's `node_modules`.
 *
 * @remarks
 * Uses directory existence check, consistent with {@link checkPlaywrightInstalled}.
 *
 * @example
 * ```typescript
 * const result = checkPlaywrightCliInstalled();
 * // { name: '@playwright/cli', status: 'pass', message: 'installed' }
 * ```
 */
function checkPlaywrightCliInstalled(): CheckResult {
  const pkgPath = join(process.cwd(), 'node_modules', PW_SCOPE, 'cli');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is constructed from cwd() + fixed segments
  if (existsSync(pkgPath)) {
    return { name: PLAYWRIGHT_CLI_PKG, status: 'pass', message: 'installed' };
  }
  return {
    name: PLAYWRIGHT_CLI_PKG,
    status: 'warn',
    message: 'not installed (optional — for AI agent CLI mode)',
    suggestion:
      "npm install -D @playwright/cli — reuses Playwright's bundled browsers (no separate download)",
  };
}

/**
 * Checks that `.playwright/praman-cli.config.json` exists in the project root.
 *
 * @remarks
 * This config file is required for the Playwright CLI agent integration.
 *
 * @example
 * ```typescript
 * const result = checkPramanCliConfig();
 * // { name: '.playwright/praman-cli.config.json', status: 'pass', message: 'found' }
 * ```
 */
function checkPramanCliConfig(): CheckResult {
  const configPath = join(process.cwd(), PRAMAN_CLI_CONFIG_FILE);
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is constructed from cwd() + fixed filename
  if (existsSync(configPath)) {
    return { name: PRAMAN_CLI_CONFIG_FILE, status: 'pass', message: 'found' };
  }
  return {
    name: PRAMAN_CLI_CONFIG_FILE,
    status: 'warn',
    message: 'not found',
    suggestion: `Run: npx playwright-praman init to generate ${PRAMAN_CLI_CONFIG_FILE}`,
  };
}

/**
 * Checks that the Claude agent definition file for the SAP planner agent exists.
 *
 * @remarks
 * The CLI agent files are optional but recommended for AI-assisted SAP test generation.
 * Returns `pass` if the file exists and `warn` if it is absent.
 *
 * @example
 * ```typescript
 * const result = checkCliAgentFiles();
 * // { name: 'CLI agent files', status: 'pass', message: 'found' }
 * ```
 */
function checkCliAgentFiles(): CheckResult {
  const agentPath = join(process.cwd(), CLAUDE_AGENT_FILE);
  const CHECK_NAME = 'CLI agent files';
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path constructed from cwd() + fixed filename
  if (existsSync(agentPath)) {
    return { name: CHECK_NAME, status: 'pass', message: 'found' };
  }
  return {
    name: CHECK_NAME,
    status: 'warn',
    message: 'not found (optional)',
    suggestion: 'Run: npx playwright-praman init-agents --loop=claude to install agent files',
  };
}

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
 * SAP environment variables, project configuration files, `@playwright/cli`
 * installation, Praman CLI config presence, and Claude agent file presence.
 * Intended to be called by the `init` and `doctor`
 * CLI commands before performing any actions.
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
    checkPlaywrightVersion(),
    checkTemplatePeerPackages(),
    checkSapBaseUrl(),
    checkSapUsername(),
    checkPlaywrightConfig(),
    checkPramanConfig(),
    checkPlaywrightCliInstalled(),
    checkPramanCliConfig(),
    checkCliAgentFiles(),
  ];
  return {
    checks,
    passed: checks.filter((c) => c.status === 'pass').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    warnings: checks.filter((c) => c.status === 'warn').length,
  };
}
