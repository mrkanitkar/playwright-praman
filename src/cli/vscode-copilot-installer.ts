/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * VS Code and Copilot scaffolding for the Praman CLI `init` command.
 *
 * @remarks
 * Extracted from `ide-installer.ts` to keep each module under the 300-line limit.
 * Handles VS Code settings/extensions/snippets and GitHub Copilot agent files
 * plus `.github/copilot-instructions.md` scaffolding.
 *
 * @module cli/vscode-copilot-installer
 */

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { CopyIfMissingFn, PkgPathFn } from './ide-installer.js';
import { logWarn } from './logger.js';

// ── VS Code generated templates ───────────────────────────────────────────────

const VSCODE_SETTINGS = [
  '{',
  '  "playwright.reuseBrowser": false,',
  '  "playwright.showTrace": true,',
  '  "editor.formatOnSave": true,',
  '  "typescript.preferences.importModuleSpecifierEnding": "js",',
  '  "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" }',
  '}\n',
].join('\n');

const VSCODE_EXTENSIONS = [
  '{ "recommendations": [',
  '    "ms-playwright.playwright", "dbaeumer.vscode-eslint",',
  '    "esbenp.prettier-vscode", "ms-vscode.vscode-typescript-next"',
  '] }\n',
].join('\n');

const VSCODE_SNIPPETS = `{
  "Praman UI5 Test": {
    "prefix": "praman-test",
    "scope": "typescript",
    "body": [
      "import { test, expect } from 'playwright-praman';",
      "",
      "test('$1', async ({ ui5 }) => {",
      "  const control = await ui5.control({ $2 });",
      "  $0",
      "});"
    ],
    "description": "Praman SAP UI5 test scaffold"
  },
  "Praman Step": {
    "prefix": "praman-step",
    "scope": "typescript",
    "body": ["await test.step('$1', async () => {", "  $0", "});"],
    "description": "Praman test step"
  }
}
`;

/** Marker string used to detect if Praman copilot instructions are already appended. */
const PRAMAN_COPILOT_MARKER = 'Praman SAP Test Automation';

/** Shared path segment for user-integration docs inside the package. */
const USER_INTEGRATION_DIR = 'user-integration';

// ── Private helpers ───────────────────────────────────────────────────────────

/**
 * Writes `content` to `filePath`, skipping if the file already exists and
 * `force` is `false`.
 */
async function writeIfMissing(
  filePath: string,
  content: string,
  force: boolean,
  created: string[],
): Promise<void> {
  if (!force) {
    try {
      await access(filePath);
      return;
    } catch {
      // file does not exist — proceed to write
    }
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath from targetDir + known constant names
  await writeFile(filePath, content, 'utf8');
  created.push(filePath);
}

// ── VS Code scaffolding ───────────────────────────────────────────────────────

/**
 * Writes the three generated VS Code config files into `.vscode/`.
 *
 * @param targetDir - Absolute path to the user's project root.
 * @param force - When `true`, overwrite existing destination files.
 * @param created - Array to push created file paths into.
 */
export async function scaffoldVSCodeFiles(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const vscodePairs: readonly (readonly [string, string])[] = [
    [join(targetDir, '.vscode', 'settings.json'), VSCODE_SETTINGS],
    [join(targetDir, '.vscode', 'extensions.json'), VSCODE_EXTENSIONS],
    [join(targetDir, '.vscode', 'praman.code-snippets'), VSCODE_SNIPPETS],
  ];
  for (const [filePath, content] of vscodePairs) {
    await writeIfMissing(filePath, content, force, created);
  }
}

// ── Copilot agent files ───────────────────────────────────────────────────────

/**
 * Copies Copilot agent `.agent.md` files into `.github/agents/`.
 *
 * @param targetDir - Absolute path to the user's project root.
 * @param copilotFiles - File copy specs for copilot agents.
 * @param copilotDirs - Directory specs for copilot agents.
 * @param pkgPath - Package root path resolver.
 * @param force - When `true`, overwrite existing destination files.
 * @param created - Array to push created file paths into.
 * @param copyIfMissing - File-copy helper from ide-installer.
 */
export async function scaffoldCopilotAgentFiles(
  targetDir: string,
  copilotFiles: readonly {
    readonly srcSegments: readonly string[];
    readonly destSegments: readonly string[];
  }[],
  copilotDirs: readonly (readonly string[])[],
  pkgPath: PkgPathFn,
  force: boolean,
  created: string[],
  copyIfMissing: CopyIfMissingFn,
): Promise<void> {
  for (const dirSegments of copilotDirs) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known constant directory segments
    await mkdir(join(targetDir, ...dirSegments), { recursive: true });
  }

  for (const copySpec of copilotFiles) {
    const srcPath = pkgPath(...copySpec.srcSegments);
    const destPath = join(targetDir, ...copySpec.destSegments);
    await copyIfMissing(srcPath, destPath, force, created);
  }
}

// ── Copilot instructions ──────────────────────────────────────────────────────

/**
 * Creates or appends to `.github/copilot-instructions.md` with Praman
 * integration content from the package's user-integration docs.
 *
 * @param targetDir - Absolute path to the user's project root.
 * @param pkgPath - Package root path resolver.
 * @param force - When `true`, overwrite even if marker is present.
 * @param created - Array to push created file paths into.
 */
export async function scaffoldCopilotInstructions(
  targetDir: string,
  pkgPath: PkgPathFn,
  force: boolean,
  created: string[],
): Promise<void> {
  const destPath = join(targetDir, '.github', 'copilot-instructions.md');
  const srcPath = pkgPath('docs', USER_INTEGRATION_DIR, 'copilot-instructions-appendable.md');

  let appendContent: string;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- srcPath resolved from package root + known constant path
    appendContent = await readFile(srcPath, 'utf8');
  } catch {
    logWarn(`Copilot instructions source not found: ${srcPath}`);
    return;
  }

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destPath composed from targetDir + known constant path
  await mkdir(join(targetDir, '.github'), { recursive: true });

  let existingContent = '';
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- destPath composed from targetDir + known constant path
    existingContent = await readFile(destPath, 'utf8');
  } catch {
    // File does not exist — will create fresh
  }

  if (existingContent.includes(PRAMAN_COPILOT_MARKER) && !force) {
    return;
  }

  const finalContent =
    existingContent.length > 0 ? `${existingContent.trimEnd()}\n\n${appendContent}` : appendContent;

  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destPath composed from targetDir + known constant path
  await writeFile(destPath, finalContent, 'utf8');
  created.push(destPath);
}
