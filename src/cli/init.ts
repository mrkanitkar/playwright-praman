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
 * };
 * ```
 */
export interface InitOptions {
  /** Absolute path to the target directory for scaffolding. */
  readonly targetDir: string;
  /** When `true`, overwrite existing files. */
  readonly force: boolean;
  /** When `true`, install CLI-based agents (Playwright CLI) alongside MCP agents. */
  readonly cli?: boolean;
}

/** Total number of init steps displayed to the user. */
const TOTAL_STEPS = 4;

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
 * Runs the Praman project initializer.
 *
 * @remarks
 * Creates configuration files, example test, and IDE-specific configs.
 * Detects the user's IDE and generates appropriate config files.
 *
 * Steps:
 * 1. Validate environment (Node.js, npm, packages)
 * 2. Detect IDE (VS Code, Cursor, Claude Code, JetBrains)
 * 3. Generate configuration files
 * 4. Print next steps
 *
 * @param options - Parsed init options from the Commander action handler.
 *
 * @example
 * ```typescript
 * await runInit({ targetDir: process.cwd(), force: false });
 * await runInit({ targetDir: '/tmp/project', force: true });
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

  // ── Step 4: Next steps ───────────────────────────────────────────────────
  logStep(4, TOTAL_STEPS, 'Done!');
  logSection('Next Steps');
  logSuccess('1. Copy .env.example to .env and fill in SAP credentials');
  logSuccess('2. Run tests: npx playwright test --project=chromium --headed');
  logSuccess('3. Browse readymade prompts in praman-prompts/ folder');
  logWarn('Auth setup (tests/auth.setup.ts) runs automatically before tests');

  // IDE-specific appendable instructions
  printIDESetupInstructions(detection);
}
