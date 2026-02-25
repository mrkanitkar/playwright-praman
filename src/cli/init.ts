/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Praman project initializer — the `npx playwright-praman init` command.
 *
 * @remarks
 * Scaffolds a new Praman project by validating the environment, detecting
 * the user's IDE, calling the scaffolder, and printing next steps.
 * Uses the CLI logger (not pino) for human-readable coloured output.
 *
 * @module cli/init
 */

import process from 'node:process';

import { detectIDEs, getIDELabels } from './ide-detector.js';
import { logBanner, logError, logSection, logStep, logSuccess, logWarn } from './logger.js';
import { scaffoldProject } from './scaffolder.js';
import { validate } from './validator.js';
import { getVersion } from './version.js';

/**
 * Parsed options for the `init` command.
 *
 * @example
 * ```typescript
 * const opts: InitOptions = parseInitArgs(['--force', '--target', '/tmp/project']);
 * // { targetDir: '/tmp/project', force: true, skipInstall: false }
 * ```
 */
export interface InitOptions {
  /** Absolute path to the target directory for scaffolding. */
  readonly targetDir: string;
  /** When `true`, overwrite existing files. */
  readonly force: boolean;
  /** When `true`, skip npm install step. */
  readonly skipInstall: boolean;
}

/** Total number of init steps displayed to the user. */
const TOTAL_STEPS = 4;

/**
 * Parses CLI arguments for the `init` command.
 *
 * @param argv - The raw argument array (after the `init` subcommand).
 * @returns Parsed {@link InitOptions} with defaults applied.
 *
 * @example
 * ```typescript
 * const opts = parseInitArgs(['--force', '--target', '/tmp/my-project']);
 * // { targetDir: '/tmp/my-project', force: true, skipInstall: false }
 * ```
 */
export function parseInitArgs(argv: readonly string[]): InitOptions {
  let targetDir = process.cwd();
  let force = false;
  let skipInstall = false;

  for (let index = 0; index < argv.length; index++) {
    // eslint-disable-next-line security/detect-object-injection -- index is a controlled loop variable
    const arg = argv[index];
    if (arg === '--force') {
      force = true;
    } else if (arg === '--skip-install') {
      skipInstall = true;
    } else if (arg === '--target') {
      const next = argv[index + 1];
      if (next !== undefined && !next.startsWith('--')) {
        targetDir = next;
        index++;
      }
    }
  }

  return { targetDir, force, skipInstall };
}

/**
 * Runs the Praman project initializer.
 *
 * @remarks
 * Creates configuration files, example test, and IDE-specific configs.
 * Detects the user's IDE and generates appropriate config files.
 *
 * Steps:
 * 1. Validate environment (Node.js, npm)
 * 2. Detect IDE (VS Code, Cursor, Claude Code, JetBrains)
 * 3. Generate configuration files
 * 4. Print next steps
 *
 * @param args - Raw CLI arguments (after the `init` subcommand).
 *
 * @example
 * ```typescript
 * // npx playwright-praman init
 * await runInit([]);
 *
 * // npx playwright-praman init --skip-install --target /tmp/project
 * await runInit(['--skip-install', '--target', '/tmp/project']);
 * ```
 */
export async function runInit(args: readonly string[]): Promise<void> {
  const options = parseInitArgs(args);

  // ── Banner ──────────────────────────────────────────────────────────────────
  logBanner('Praman Init', getVersion());

  // ── Step 1: Validate environment ─────────────────────────────────────────
  logStep(1, TOTAL_STEPS, 'Validating environment');
  const report = validate();

  for (const check of report.checks) {
    const text = `${check.name}: ${check.message}`;
    if (check.status === 'pass') {
      logSuccess(text);
    } else if (check.status === 'warn') {
      logWarn(text);
    } else {
      logError(text);
    }
  }

  // Check for critical failures (Node.js or npm)
  const hasCriticalFailure = report.checks.some(
    (check) =>
      check.status === 'fail' &&
      (check.name === 'Node.js version' || check.name === 'npm available'),
  );

  if (hasCriticalFailure) {
    logError('Critical environment check failed. Cannot continue.');
    return;
  }

  // ── Step 2: Detect IDEs ──────────────────────────────────────────────────
  logStep(2, TOTAL_STEPS, 'Detecting IDEs');
  const detection = detectIDEs(options.targetDir);
  const labels = getIDELabels(detection);

  if (labels.length > 0) {
    for (const label of labels) {
      logSuccess(`Detected: ${label}`);
    }
  } else {
    logWarn('No IDEs detected');
  }

  // ── Step 3: Scaffold project ─────────────────────────────────────────────
  logStep(3, TOTAL_STEPS, 'Scaffolding project');
  const result = await scaffoldProject({
    targetDir: options.targetDir,
    force: options.force,
  });

  if (result.success) {
    for (const filePath of result.filesCreated) {
      logSuccess(`Created: ${filePath}`);
    }
  } else {
    logError(`Scaffold failed: ${result.reason}`);
    return;
  }

  // ── Step 4: Next steps ───────────────────────────────────────────────────
  logStep(4, TOTAL_STEPS, 'Done!');
  logSection('Next Steps');

  if (!options.skipInstall) {
    logSuccess('Run: npm install');
  }

  logSuccess('Run: npx playwright install');
  logSuccess('Run: npx playwright test --ui');
}
