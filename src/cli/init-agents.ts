/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Lightweight agent installer — the `npx playwright-praman init-agents` command.
 *
 * @remarks
 * Installs only AI agent definitions for a specific IDE (or auto-detects).
 * Unlike `init`, this skips environment validation, npm install, and config
 * scaffolding. Mirrors Playwright's `npx playwright init-agents --loop=<ide>`.
 *
 * @module cli/init-agents
 */

import type { IDEDetection } from './ide-detector.js';
import { detectIDEs, getIDELabels } from './ide-detector.js';
import { scaffoldIDEFiles } from './ide-installer.js';
import { logBanner, logSection, logStep, logSuccess, logWarn } from './logger.js';
import { getVersion } from './version.js';

/** Valid values for the `--loop` flag. */
const VALID_LOOPS = ['vscode', 'claude', 'cursor', 'jules', 'opencode', 'copilot'] as const;

/** Union type of valid `--loop` values. */
type LoopTarget = (typeof VALID_LOOPS)[number];

/**
 * Parsed options for the `init-agents` command.
 *
 * @example
 * ```typescript
 * const opts: InitAgentsOptions = {
 *   targetDir: process.cwd(),
 *   loop: 'claude',
 *   force: false,
 * };
 * ```
 */
export interface InitAgentsOptions {
  /** Absolute path to the target directory. */
  readonly targetDir: string;
  /** IDE to install agents for. `'detect'` triggers auto-detection. */
  readonly loop: LoopTarget | 'detect';
  /** When `true`, overwrite existing agent files. */
  readonly force: boolean;
}

/**
 * Builds an {@link IDEDetection} object for a single IDE target.
 *
 * @param loop - The IDE to enable.
 * @returns An `IDEDetection` with only the specified IDE set to `true`.
 *
 * @example
 * ```typescript
 * const detection = buildDetection('claude');
 * // { claude: true, vscode: false, cursor: false, ... }
 * ```
 */
export function buildDetection(loop: LoopTarget): IDEDetection {
  return {
    vscode: loop === 'vscode',
    claude: loop === 'claude',
    cursor: loop === 'cursor',
    opencode: loop === 'opencode',
    jules: loop === 'jules',
    copilot: loop === 'copilot',
  };
}

/**
 * Validates the `--loop` flag value.
 *
 * @param value - Raw string from the CLI.
 * @returns `true` if the value is a valid loop target or `'detect'`.
 *
 * @example
 * ```typescript
 * isValidLoop('claude');  // true
 * isValidLoop('detect');  // true
 * isValidLoop('emacs');   // false
 * ```
 */
export function isValidLoop(value: string): value is LoopTarget | 'detect' {
  return value === 'detect' || (VALID_LOOPS as readonly string[]).includes(value);
}

/**
 * Runs the `init-agents` command — installs AI agent definitions for one or
 * more IDEs without running full project scaffolding.
 *
 * @param options - Parsed CLI options.
 *
 * @example
 * ```typescript
 * await runInitAgents({ targetDir: '.', loop: 'vscode', force: false });
 * ```
 */
export async function runInitAgents(options: InitAgentsOptions): Promise<void> {
  const version = getVersion();
  logBanner('Praman Agent Installer', version);

  const totalSteps = 3;

  // ── Step 1: Resolve IDE target ──
  logStep(1, totalSteps, 'Resolving IDE target');

  let detection: IDEDetection;

  if (options.loop === 'detect') {
    detection = detectIDEs(options.targetDir);
    const labels = getIDELabels(detection);
    if (labels.length === 0) {
      logWarn('No IDE markers found. Use --loop=<ide> to specify one explicitly.');
      logWarn(`Valid options: ${VALID_LOOPS.join(', ')}`);
      return;
    }
    logSuccess(`Detected: ${labels.join(', ')}`);
  } else {
    detection = buildDetection(options.loop);
    logSuccess(`Target: ${options.loop}`);
  }

  // ── Step 2: Install agent files ──
  logStep(2, totalSteps, 'Installing agent files');

  const created = await scaffoldIDEFiles(options.targetDir, detection, options.force);

  if (created.length === 0) {
    logWarn('No new files created (agents may already be installed). Use --force to overwrite.');
    return;
  }

  logSuccess(`Installed ${String(created.length)} file(s)`);

  // ── Step 3: Print summary ──
  logStep(3, totalSteps, 'Summary');

  logSection('Created files');
  for (const filePath of created) {
    logSuccess(filePath.replace(options.targetDir, '.'));
  }

  logSuccess('Agent installation complete. Run your AI agent to start generating SAP tests.');
}
