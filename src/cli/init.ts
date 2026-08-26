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
 * Detects the project's IDEs, falling back to the documented default set.
 *
 * @remarks
 * IDEs are detected by marker files (`.vscode/`, `CLAUDE.md`, `.github/agents/`
 * ...) which by definition cannot exist in a fresh project. Without a fallback,
 * the agent and skill files promised by the Getting Started guide were never
 * installed (issue #224). Every scaffold write is skip-if-exists, so defaulting
 * cannot clobber an existing project.
 *
 * @param targetDir - The project directory to inspect.
 * @returns Detected IDEs, or the documented defaults when none were found.
 */
function resolveDetection(targetDir: string): IDEDetection {
  const detected = detectIDEs(targetDir);
  const labels = getIDELabels(detected);

  if (labels.length > 0) {
    for (const label of labels) {
      logSuccess(`Detected: ${label}`);
    }
    return detected;
  }

  logWarn('No IDEs detected — installing the default agent set');
  logWarn('  GitHub Copilot (.github/) and Claude Code (.claude/)');
  return { ...detected, copilot: true, claude: true };
}

/**
 * Prints the post-init "Next Steps" list, including only steps whose files
 * actually exist.
 *
 * @remarks
 * The list used to be hard-coded, so it happily told users to copy a
 * `.env.example` and browse a `praman-prompts/` folder that had never been
 * created (issue #224). Each step is now gated on the artefact it refers to.
 *
 * @param targetDir - The project directory that was scaffolded.
 */
function printNextSteps(targetDir: string): void {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths composed from the caller-supplied targetDir + hard-coded names
  const has = (...segments: string[]): boolean => existsSync(join(targetDir, ...segments));

  const steps: string[] = [];
  // The scaffolded playwright.config.ts imports 'dotenv/config' and
  // tests/auth.setup.ts imports from 'node:fs', so a fresh project needs both
  // before those files typecheck (issue #224).
  const needsDeps = ['dotenv', join('@types', 'node')].some(
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is targetDir + fixed package names
    (pkg) => !existsSync(join(targetDir, 'node_modules', pkg)),
  );
  if (needsDeps) {
    steps.push('Install template dependencies: npm install -D dotenv @types/node');
  }
  if (has('.env.example')) {
    steps.push('Copy .env.example to .env and fill in SAP credentials');
  }
  steps.push('Run tests: npx playwright test --project=chromium --headed');
  if (has('praman-prompts')) {
    steps.push('Browse readymade prompts in praman-prompts/ folder');
  }

  for (const [index, step] of steps.entries()) {
    logSuccess(`${String(index + 1)}. ${step}`);
  }

  if (has('tests', 'auth.setup.ts')) {
    logWarn('Auth setup (tests/auth.setup.ts) runs automatically before tests');
  }
}

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
  const detection = resolveDetection(options.targetDir);

  // ── Step 3: Scaffold project ─────────────────────────────────────────────
  logStep(3, TOTAL_STEPS, 'Scaffolding project');
  const result = await scaffoldProject({
    targetDir: options.targetDir,
    force: options.force,
    detection,
    cli: options.cli ?? true,
  });

  if (!result.success) {
    // Throwing (rather than returning) is what makes the process exit non-zero
    // — program.ts maps a thrown error to process.exitCode = 1.
    throw new Error(`Scaffold failed: ${result.reason}`);
  }

  for (const filePath of result.filesCreated) {
    logSuccess(`Created: ${filePath}`);
  }
  for (const filePath of result.filesSkipped) {
    logWarn(`Exists, left unchanged: ${filePath}`);
  }

  if (result.filesCreated.length === 0 && result.filesSkipped.length === 0) {
    throw new Error(
      'Scaffold produced no files. This usually means the installed package is ' +
        'missing its bundled assets — please report it at ' +
        'https://github.com/mrkanitkar/playwright-praman/issues',
    );
  }

  // ── Step 4: Next steps ───────────────────────────────────────────────────
  logStep(4, TOTAL_STEPS, 'Done!');
  logSection('Next Steps');
  printNextSteps(options.targetDir);

  // IDE-specific appendable instructions
  printIDESetupInstructions(detection);
}
