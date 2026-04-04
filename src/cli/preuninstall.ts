/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * npm preuninstall lifecycle script.
 *
 * @remarks
 * Runs automatically when `npm remove playwright-praman` is executed.
 * Detects and moves scaffolded project files to `deleted-praman-files/`
 * before the package is deleted from `node_modules`. Always exits with
 * code 0 to avoid blocking package removal.
 *
 * @module cli/preuninstall
 */

import { join } from 'node:path';
import process from 'node:process';

import { logSuccess, logWarn } from './logger.js';
import { TRASH_DIR_NAME, getScaffoldedFiles, moveFilesToTrash } from './uninstall.js';

/**
 * Resolves the project root directory from the current working directory.
 *
 * @remarks
 * During `npm remove`, CWD is the package directory inside `node_modules`
 * (e.g., `/path/to/project/node_modules/playwright-praman`). This function
 * walks up past `node_modules/playwright-praman` to find the project root.
 *
 * @returns The project root path, or `undefined` if resolution fails.
 *
 * @example
 * ```typescript
 * const root = resolveProjectRoot();
 * // '/path/to/project' when CWD is '/path/to/project/node_modules/playwright-praman'
 * ```
 */
export function resolveProjectRoot(): string | undefined {
  const cwd = process.cwd();
  const marker = join('node_modules', 'playwright-praman');
  const index = cwd.lastIndexOf(marker);
  if (index === -1) return undefined;
  const root = cwd.slice(0, index);
  // Remove trailing separator if present
  return root.endsWith('/') || root.endsWith('\\') ? root.slice(0, -1) : root;
}

/**
 * Main preuninstall entry point.
 *
 * @remarks
 * Non-interactive — lifecycle scripts may lack a TTY. Moves all scaffolded
 * files to `deleted-praman-files/` and logs what was moved. Wrapped in
 * try/catch to ensure exit code 0.
 */
async function main(): Promise<void> {
  const projectRoot = resolveProjectRoot();
  if (projectRoot === undefined) return;

  const files = getScaffoldedFiles(projectRoot, {
    targetDir: projectRoot,
    confirm: true,
    keepConfig: false,
    keepAgents: false,
    removeBrowsers: false,
  });

  if (files.length === 0) return;

  logWarn(`Moving ${String(files.length)} Praman scaffolded file(s) to ${TRASH_DIR_NAME}/...`);

  for (const file of files) {
    logWarn(`  ${file.relativePath}`);
  }

  const moved = await moveFilesToTrash(files, projectRoot);

  logSuccess(`Moved ${String(moved)} of ${String(files.length)} file(s) to ${TRASH_DIR_NAME}/.`);
  logWarn(`Files preserved in ${TRASH_DIR_NAME}/ — delete manually when ready.`);
}

// Always exit 0 — a failing preuninstall must never block package removal.
try {
  await main();
} catch {
  // Intentionally swallow errors to avoid blocking npm remove.
}
