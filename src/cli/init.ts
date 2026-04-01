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

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { IDEDetection } from './ide-detector.js';
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
 * const opts: InitOptions = {
 *   targetDir: '/tmp/project',
 *   force: true,
 *   skipInstall: false,
 * };
 * ```
 */
export interface InitOptions {
  /** Absolute path to the target directory for scaffolding. */
  readonly targetDir: string;
  /** When `true`, overwrite existing files. */
  readonly force: boolean;
  /** When `true`, skip npm install step. */
  readonly skipInstall: boolean;
  /** When `true`, install CLI-based agents (Playwright CLI) alongside MCP agents. */
  readonly cli?: boolean;
}

/** Total number of init steps displayed to the user. */
const TOTAL_STEPS = 5;

/**
 * Prints IDE-specific post-init instructions for each detected IDE.
 *
 * @param detection - The IDE detection result from {@link detectIDEs}.
 */
function printIDESetupInstructions(detection: IDEDetection): void {
  if (detection.claude) {
    logSection('Claude Code Setup');
    logWarn('Append the Praman SAP agent section to your CLAUDE.md:');
    logSuccess(
      'cat node_modules/playwright-praman/docs/user-integration/claude-md-appendable.md >> CLAUDE.md',
    );
  }

  if (detection.cursor) {
    logSection('Cursor Setup');
    logWarn('Append Praman rules to your Cursor config:');
    logSuccess(
      'cat node_modules/playwright-praman/docs/user-integration/cursor-rules-appendable.mdc >> .cursorrules',
    );
  }

  if (detection.jules) {
    logSection('Jules Setup');
    logWarn('Append Praman setup to your Jules config:');
    logSuccess(
      'cat node_modules/playwright-praman/docs/user-integration/jules-setup-appendable.md >> .jules/setup.md',
    );
  }

  if (detection.copilot || detection.vscode) {
    logSection('GitHub Copilot Setup');
    logSuccess('Copilot agents and instructions installed automatically');
  }
}

/**
 * Installs required packages and Chromium browser.
 *
 * @remarks
 * Checks each dependency independently so partial installs are completed.
 * Always ensures Chromium browser is installed, even when packages already exist.
 *
 * @returns `true` if all critical packages are available, `false` on failure.
 */
function installPackageIfNeeded(options: InitOptions): boolean {
  if (options.skipInstall) {
    logWarn('Skipped package install (--skip-install)');
    return true;
  }

  // Check which packages are missing
  const modules = join(options.targetDir, 'node_modules');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- composed from targetDir + known constant segments
  const hasPlaywright = existsSync(join(modules, '@playwright', 'test'));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- composed from targetDir + known constant segments
  const hasPlaywrightCli = existsSync(join(modules, '@playwright', 'cli'));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- composed from targetDir + known constant segments
  const hasPraman = existsSync(join(modules, 'playwright-praman'));
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- composed from targetDir + known constant segments
  const hasDotenv = existsSync(join(modules, 'dotenv'));

  const missing: string[] = [];
  if (!hasPlaywright) missing.push('@playwright/test');
  if (!hasPlaywrightCli) missing.push('@playwright/cli');
  if (!hasPraman) missing.push('playwright-praman');
  if (!hasDotenv) missing.push('dotenv');

  if (missing.length > 0) {
    try {
      // eslint-disable-next-line sonarjs/os-command -- intentional: missing[] contains only hardcoded package names
      execSync(`npm install ${missing.join(' ')}`, {
        cwd: options.targetDir,
        stdio: 'inherit',
      });
      logSuccess(`Installed: ${missing.join(', ')}`);
    } catch {
      logError('Failed to install packages. Run npm install manually.');
      return false;
    }
  } else {
    logSuccess('All packages already installed');
  }

  // Always ensure Chromium browser is installed
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- intentional: Playwright CLI browser install via npx
    execSync('npx playwright install chromium', { cwd: options.targetDir, stdio: 'inherit' });
    logSuccess('Chromium browser ready');
  } catch {
    logWarn('Failed to install Chromium. Run: npx playwright install chromium');
  }

  return true;
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
 * 2. Install package (if not already installed)
 * 3. Detect IDE (VS Code, Cursor, Claude Code, JetBrains)
 * 4. Generate configuration files
 * 5. Print next steps
 *
 * @param options - Parsed init options from the Commander action handler.
 *
 * @example
 * ```typescript
 * await runInit({ targetDir: process.cwd(), force: false, skipInstall: false });
 * await runInit({ targetDir: '/tmp/project', force: true, skipInstall: true });
 * ```
 */
export async function runInit(options: InitOptions): Promise<void> {
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

  // ── Step 2: Install package ───────────────────────────────────────────────
  logStep(2, TOTAL_STEPS, 'Installing package');
  if (!installPackageIfNeeded(options)) {
    return;
  }

  // ── Step 3: Detect IDEs ──────────────────────────────────────────────────
  logStep(3, TOTAL_STEPS, 'Detecting IDEs');
  const detection = detectIDEs(options.targetDir);
  const labels = getIDELabels(detection);

  if (labels.length > 0) {
    for (const label of labels) {
      logSuccess(`Detected: ${label}`);
    }
  } else {
    logWarn('No IDEs detected');
  }

  // ── Step 4: Scaffold project ─────────────────────────────────────────────
  logStep(4, TOTAL_STEPS, 'Scaffolding project');
  const result = await scaffoldProject({
    targetDir: options.targetDir,
    force: options.force,
    detection,
    cli: options.cli ?? true,
  });

  if (result.success) {
    for (const filePath of result.filesCreated) {
      logSuccess(`Created: ${filePath}`);
    }
  } else {
    logError(`Scaffold failed: ${result.reason}`);
    return;
  }

  // ── Step 5: Next steps ───────────────────────────────────────────────────
  logStep(5, TOTAL_STEPS, 'Done!');
  logSection('Next Steps');
  logSuccess('1. Copy .env.example to .env and fill in SAP credentials');
  logSuccess('2. Run tests: npx playwright test --project=chromium --headed');
  logSuccess('3. Browse readymade prompts in praman-prompts/ folder');
  logWarn('Auth setup (tests/auth.setup.ts) runs automatically before tests');

  // IDE-specific appendable instructions
  printIDESetupInstructions(detection);
}
