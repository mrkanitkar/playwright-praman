/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * IDE detection by marker files.
 *
 * @remarks
 * Checks for IDE-specific configuration files/directories to determine
 * which IDEs are active in the project. Used by init.ts to scaffold
 * IDE-specific configuration files.
 *
 * @module cli
 */

import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import process from 'node:process';

/**
 * Result of scanning a project directory for known IDE marker files.
 */
export interface IDEDetection {
  /** Whether VS Code (`.vscode/` directory or `TERM_PROGRAM=vscode` for current cwd scans) was detected. */
  readonly vscode: boolean;
  /** Whether Claude Code (`CLAUDE.md`) was detected. */
  readonly claude: boolean;
  /** Whether Cursor (`.cursor/` or `.cursorrc`) was detected. */
  readonly cursor: boolean;
  /** Whether OpenCode (`.opencode/`) was detected. */
  readonly opencode: boolean;
  /** Whether Jules (`.jules/`) was detected. */
  readonly jules: boolean;
  /** Whether GitHub Copilot (`.github/copilot-instructions.md` or `.github/agents/`) was detected. */
  readonly copilot: boolean;
}

interface IDERule {
  readonly name: keyof IDEDetection;
  readonly label: string;
  readonly markers: readonly string[];
}

const IDE_RULES: readonly IDERule[] = [
  { name: 'vscode', label: 'VS Code', markers: ['.vscode'] },
  { name: 'claude', label: 'Claude Code', markers: ['CLAUDE.md'] },
  { name: 'cursor', label: 'Cursor', markers: ['.cursor', '.cursorrc'] },
  { name: 'opencode', label: 'OpenCode', markers: ['.opencode'] },
  { name: 'jules', label: 'Jules', markers: ['.jules'] },
  {
    name: 'copilot',
    label: 'GitHub Copilot',
    markers: ['.github/copilot-instructions.md', '.github/agents'],
  },
];

/**
 * Detects IDEs in the target directory by checking for marker files.
 *
 * @param targetDir - The project directory to scan.
 * @returns An object indicating which IDEs were detected.
 *
 * @example
 * ```typescript
 * const ides = detectIDEs('/path/to/project');
 * if (ides.vscode) { console.log('VS Code detected'); }
 * ```
 */
export function detectIDEs(targetDir: string): IDEDetection {
  const hasMarker = (markers: readonly string[]): boolean =>
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths are composed from a trusted targetDir param and hard-coded marker constants
    markers.some((marker) => existsSync(join(targetDir, marker)));

  const vscodeByMarker = hasMarker(['.vscode']);
  const isCurrentWorkingDirectoryScan = resolve(targetDir) === process.cwd();
  const vscodeByEnv = isCurrentWorkingDirectoryScan && process.env['TERM_PROGRAM'] === 'vscode';

  return {
    vscode: vscodeByMarker || vscodeByEnv,
    claude: hasMarker(['CLAUDE.md']),
    cursor: hasMarker(['.cursor', '.cursorrc']),
    opencode: hasMarker(['.opencode']),
    jules: hasMarker(['.jules']),
    copilot: hasMarker(['.github/copilot-instructions.md', '.github/agents']),
  };
}

/**
 * Returns human-readable labels for detected IDEs.
 *
 * @param detection - The IDE detection result.
 * @returns Array of IDE display names that were detected.
 *
 * @example
 * ```typescript
 * const labels = getIDELabels(detectIDEs('/project'));
 * // ['VS Code', 'Claude Code']
 * ```
 */
export function getIDELabels(detection: IDEDetection): readonly string[] {
  return IDE_RULES.filter((rule) => detection[rule.name]).map((rule) => rule.label);
}

/**
 * Checks whether the Playwright CLI (`@playwright/cli`) is available in
 * the project's `node_modules/.bin/`. Informational only — used to print
 * a hint when the CLI is detected but `--cli` was not passed.
 *
 * @param targetDir - The project directory to scan.
 * @returns `true` if `playwright-cli` binary exists in `node_modules/.bin/`.
 *
 * @example
 * ```typescript
 * if (detectPlaywrightCli('/path/to/project')) {
 *   console.log('Playwright CLI detected — consider using --cli flag');
 * }
 * ```
 */
export function detectPlaywrightCli(targetDir: string): boolean {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known constant segments
  return existsSync(join(targetDir, 'node_modules', '.bin', 'playwright-cli'));
}
