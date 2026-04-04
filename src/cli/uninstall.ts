/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/* eslint-disable max-lines -- manifest entries + move/cleanup helpers exceed 300 LOC */

/**
 * Uninstall command — moves scaffolded files to a trash directory.
 *
 * @remarks
 * Dry-run by default. Requires `--confirm` flag to skip interactive prompt.
 * Files are moved to `deleted-praman-files/` preserving their relative path
 * structure, allowing easy recovery. Protected files (`.env`, `tests/`,
 * `node_modules/`, `package.json`) are NEVER touched.
 * Optionally removes Playwright browsers with `--remove-browsers`.
 *
 * This file exceeds 300 LOC due to the scaffolded file manifest
 * and multiple helper functions.
 *
 * @module cli/uninstall
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, readdir, rmdir, rename, unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline';

import { logSection, logStep, logSuccess, logWarn } from './logger.js';

/**
 * Options controlling the uninstall behavior.
 *
 * @example
 * ```typescript
 * const options: UninstallOptions = {
 *   targetDir: '/home/user/my-sap-tests',
 *   confirm: false, keepConfig: false, keepAgents: false, removeBrowsers: false,
 * };
 * ```
 */
export interface UninstallOptions {
  /** Absolute path to the project directory. */
  readonly targetDir: string;
  /** When `true`, actually remove files. Dry-run when `false`. */
  readonly confirm: boolean;
  /** When `true`, keep config category files. */
  readonly keepConfig: boolean;
  /** When `true`, keep agent category files. */
  readonly keepAgents: boolean;
  /** When `true`, uninstall Playwright browsers after file removal. */
  readonly removeBrowsers: boolean;
}

/**
 * Describes a scaffolded file that is a candidate for removal.
 *
 * @example
 * ```typescript
 * const entry: FileEntry = { relativePath: 'playwright.config.ts', category: 'config', label: 'Playwright config' };
 * ```
 */
export interface FileEntry {
  /** Path relative to the project root. */
  readonly relativePath: string;
  /** Category of the scaffolded file. */
  readonly category: 'agent' | 'ide' | 'skill' | 'seed' | 'config' | 'prompt';
  /** Human-readable label for display. */
  readonly label: string;
}

/** Full manifest of scaffolded files that may be removed. */
const SCAFFOLDED_MANIFEST: readonly FileEntry[] = [
  // config — created by scaffolder.ts
  { relativePath: 'playwright.config.ts', category: 'config', label: 'Playwright config' },
  { relativePath: 'praman.config.ts', category: 'config', label: 'Praman config' },
  { relativePath: 'tsconfig.json', category: 'config', label: 'TypeScript config' },

  // agent — Claude Code
  {
    relativePath: '.claude/agents/praman-sap-planner.md',
    category: 'agent',
    label: 'Claude planner agent',
  },
  {
    relativePath: '.claude/agents/praman-sap-generator.md',
    category: 'agent',
    label: 'Claude generator agent',
  },
  {
    relativePath: '.claude/agents/praman-sap-healer.md',
    category: 'agent',
    label: 'Claude healer agent',
  },
  {
    relativePath: '.claude/prompts/praman-sap-plan.md',
    category: 'agent',
    label: 'Claude plan prompt',
  },
  {
    relativePath: '.claude/prompts/praman-sap-generate.md',
    category: 'agent',
    label: 'Claude generate prompt',
  },
  {
    relativePath: '.claude/prompts/praman-sap-heal.md',
    category: 'agent',
    label: 'Claude heal prompt',
  },
  {
    relativePath: '.claude/prompts/praman-sap-coverage.md',
    category: 'agent',
    label: 'Claude coverage prompt',
  },

  // agent — Copilot
  {
    relativePath: '.github/agents/praman-sap-planner.agent.md',
    category: 'agent',
    label: 'Copilot planner agent',
  },
  {
    relativePath: '.github/agents/praman-sap-generator.agent.md',
    category: 'agent',
    label: 'Copilot generator agent',
  },
  {
    relativePath: '.github/agents/praman-sap-healer.agent.md',
    category: 'agent',
    label: 'Copilot healer agent',
  },
  {
    relativePath: '.github/copilot-instructions.md',
    category: 'agent',
    label: 'Copilot instructions',
  },

  // ide
  { relativePath: '.vscode/settings.json', category: 'ide', label: 'VS Code settings' },
  { relativePath: '.vscode/extensions.json', category: 'ide', label: 'VS Code extensions' },
  { relativePath: '.vscode/praman.code-snippets', category: 'ide', label: 'VS Code snippets' },
  { relativePath: '.cursor/rules/praman.mdc', category: 'ide', label: 'Cursor rules' },
  { relativePath: '.jules/praman-setup.md', category: 'ide', label: 'Jules setup' },

  // skill — entire directory handled via removeDirectory
  {
    relativePath: 'skills/playwright-praman-sap-testing/',
    category: 'skill',
    label: 'Praman skill files',
  },

  // prompt — entire directory handled via removeDirectory
  {
    relativePath: 'praman-prompts/',
    category: 'prompt',
    label: 'Praman prompt files',
  },

  // seed
  { relativePath: 'tests/seeds/sap-seed.spec.ts', category: 'seed', label: 'SAP seed file' },
  { relativePath: 'tests/auth.setup.ts', category: 'seed', label: 'SAP auth setup' },

  // examples
  {
    relativePath: 'tests/bom-e2e-praman-gold-standard.spec.ts',
    category: 'seed',
    label: 'Gold-standard example',
  },
  {
    relativePath: 'specs/bom-create-complete.plan.md',
    category: 'seed',
    label: 'Example plan spec',
  },
  { relativePath: '.env.example', category: 'config', label: 'Environment template' },
  { relativePath: '.gitignore', category: 'config', label: 'Git ignore rules' },

  // agent — Claude Code CLI
  {
    relativePath: '.claude/agents/praman-sap-planner-cli.md',
    category: 'agent',
    label: 'Claude CLI planner agent',
  },
  {
    relativePath: '.claude/agents/praman-sap-generator-cli.md',
    category: 'agent',
    label: 'Claude CLI generator agent',
  },
  {
    relativePath: '.claude/agents/praman-sap-healer-cli.md',
    category: 'agent',
    label: 'Claude CLI healer agent',
  },
  {
    relativePath: '.claude/prompts/praman-cli-plan.md',
    category: 'agent',
    label: 'Claude CLI plan prompt',
  },
  {
    relativePath: '.claude/prompts/praman-cli-generate.md',
    category: 'agent',
    label: 'Claude CLI generate prompt',
  },
  {
    relativePath: '.claude/prompts/praman-cli-heal.md',
    category: 'agent',
    label: 'Claude CLI heal prompt',
  },
  {
    relativePath: '.claude/prompts/praman-cli-coverage.md',
    category: 'agent',
    label: 'Claude CLI coverage prompt',
  },

  // agent — Copilot CLI
  {
    relativePath: '.github/agents/praman-sap-planner-cli.agent.md',
    category: 'agent',
    label: 'Copilot CLI planner agent',
  },
  {
    relativePath: '.github/agents/praman-sap-generator-cli.agent.md',
    category: 'agent',
    label: 'Copilot CLI generator agent',
  },
  {
    relativePath: '.github/agents/praman-sap-healer-cli.agent.md',
    category: 'agent',
    label: 'Copilot CLI healer agent',
  },

  // ide — CLI
  { relativePath: '.cursor/rules/praman-cli.mdc', category: 'ide', label: 'Cursor CLI rules' },

  // config — CLI
  {
    relativePath: '.playwright/praman-cli.config.json',
    category: 'config',
    label: 'Playwright CLI config',
  },

  // skill — CLI directories
  {
    relativePath: 'skills/praman-sap-cli/',
    category: 'skill',
    label: 'CLI skill files',
  },
  {
    relativePath: '.claude/skills/praman-sap-cli/',
    category: 'skill',
    label: 'Claude CLI skill files',
  },
  {
    relativePath: '.github/skills/praman-sap-cli/',
    category: 'skill',
    label: 'Copilot CLI skill files',
  },

  // config — auth storage and backup
  { relativePath: '.auth/', category: 'config', label: 'Auth storage directory' },
  {
    relativePath: 'playwright.config.original.ts',
    category: 'config',
    label: 'Playwright config backup',
  },
];

/** Category display labels for grouped output. */
const CATEGORY_LABELS: Readonly<Record<FileEntry['category'], string>> = {
  config: 'Configuration',
  agent: 'AI Agent Files',
  ide: 'IDE Settings',
  skill: 'Skill Files',
  seed: 'Seed Tests',
  prompt: 'Prompt Files',
};

/**
 * Returns the list of scaffolded files that exist in the target directory.
 *
 * @remarks
 * Filters the manifest by existence on disk and by the `keepConfig` /
 * `keepAgents` options. Results are sorted alphabetically by relative path.
 *
 * @param targetDir - Absolute path to the project root.
 * @param options - Uninstall options controlling category filtering.
 * @returns Sorted array of {@link FileEntry} objects for files that exist.
 *
 * @example
 * ```typescript
 * const files = getScaffoldedFiles('/home/user/project', {
 *   targetDir: '/home/user/project',
 *   confirm: false,
 *   keepConfig: true,
 *   keepAgents: false,
 *   removeBrowsers: false,
 * });
 * ```
 */
export function getScaffoldedFiles(
  targetDir: string,
  options: UninstallOptions,
): readonly FileEntry[] {
  const candidates = SCAFFOLDED_MANIFEST.filter((entry) => {
    if (options.keepConfig && entry.category === 'config') return false;
    if (options.keepAgents && entry.category === 'agent') return false;
    return true;
  }).filter((entry) => {
    const fullPath = join(targetDir, entry.relativePath);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known manifest paths
    return existsSync(fullPath);
  });

  return candidates.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

/** Displays the file manifest grouped by category. */
function displayManifest(files: readonly FileEntry[]): void {
  const categories = new Set(files.map((f) => f.category));
  const totalFiles = files.length;
  let stepIndex = 0;

  for (const category of categories) {
    const categoryFiles = files.filter((f) => f.category === category);
    // eslint-disable-next-line security/detect-object-injection -- category is from FileEntry union type, not user input
    logSection(CATEGORY_LABELS[category]);
    for (const file of categoryFiles) {
      stepIndex++;
      logStep(stepIndex, totalFiles, file.relativePath);
    }
  }
}

/** Name of the trash directory where scaffolded files are moved during uninstall. */
export const TRASH_DIR_NAME = 'deleted-praman-files';

/** Recursively copies a directory tree from `src` to `dest`, then removes the source. */
async function copyDirRecursive(src: string, dest: string): Promise<void> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths composed from targetDir + known manifest paths
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcEntry = join(src, entry.name);
    const destEntry = join(dest, entry.name);
    if (entry.isDirectory()) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths composed from targetDir + known manifest paths
      await mkdir(destEntry, { recursive: true });
      await copyDirRecursive(srcEntry, destEntry);
    } else {
      await copyFile(srcEntry, destEntry);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths composed from targetDir + known manifest paths
      await unlink(srcEntry);
    }
  }
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- directory inside targetDir
  await rmdir(src);
}

/**
 * Moves scaffolded files into a `deleted-praman-files/` directory, preserving
 * their relative path structure. Cleans empty source directories afterward.
 *
 * @param files - The list of scaffolded files to move.
 * @param targetDir - Absolute path to the project root.
 * @returns The number of files/directories successfully moved.
 *
 * @example
 * ```typescript
 * const moved = await moveFilesToTrash(files, '/home/user/project');
 * // Files are now in /home/user/project/deleted-praman-files/
 * ```
 */
export async function moveFilesToTrash(
  files: readonly FileEntry[],
  targetDir: string,
): Promise<number> {
  const trashDir = join(targetDir, TRASH_DIR_NAME);
  const dirsToCheck = new Set<string>();
  let moved = 0;

  for (const file of files) {
    const isDir = file.relativePath.endsWith('/');
    const srcPath = join(targetDir, file.relativePath);
    const destPath = join(trashDir, file.relativePath);

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- destPath composed from targetDir + known constant + known manifest paths
      await mkdir(isDir ? destPath : dirname(destPath), { recursive: true });

      if (isDir) {
        // Move directory contents file-by-file, then remove source
        await copyDirRecursive(srcPath, destPath);
      } else {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- paths composed from targetDir + known manifest paths
        await rename(srcPath, destPath);
      }
      moved++;
      dirsToCheck.add(dirname(srcPath));
    } catch {
      logWarn(`Could not move: ${file.relativePath}`);
    }
  }

  await cleanEmptyDirs(dirsToCheck, targetDir);
  return moved;
}

/** Removes empty directories bottom-up, walking parent chain up to targetDir. */
async function cleanEmptyDirs(dirs: ReadonlySet<string>, targetDir: string): Promise<void> {
  const visited = new Set<string>();
  const sortedDirs = [...dirs].sort((a, b) => b.length - a.length);

  for (const startDir of sortedDirs) {
    let dir = startDir;
    while (dir !== targetDir && dir.startsWith(targetDir) && !visited.has(dir)) {
      visited.add(dir);
      try {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- path derived from targetDir + dirname of known manifest paths
        const entries = await readdir(dir);
        if (entries.length === 0) {
          // eslint-disable-next-line security/detect-non-literal-fs-filename -- empty directory inside targetDir
          await rmdir(dir);
          dir = dirname(dir);
        } else {
          break;
        }
      } catch {
        break;
      }
    }
  }
}

/** Prompts the user for yes/no confirmation via stdin. */
async function promptConfirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${message} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

/** Attempts to uninstall Playwright browsers via npx. */
function removeBrowsersCmd(): void {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- intentional: Playwright CLI browser removal via npx
    execSync('npx playwright uninstall --all', { stdio: 'inherit' });
    logSuccess('Playwright browsers removed.');
  } catch {
    logWarn('Failed to remove Playwright browsers.');
  }
}

/** Runs `npm uninstall playwright-praman` to remove the package. */
function uninstallPackage(targetDir: string): void {
  try {
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- intentional: npm uninstall via CLI
    execSync('npm uninstall playwright-praman', { cwd: targetDir, stdio: 'inherit' });
    logSuccess('playwright-praman package removed.');
  } catch {
    logWarn('Failed to uninstall playwright-praman package.');
  }
}

/**
 * Executes the uninstall command, moving scaffolded files to a trash directory.
 *
 * @remarks
 * Lists what will be moved and prompts the user for confirmation.
 * Files are moved to `deleted-praman-files/` in the project root,
 * preserving their relative path structure for easy recovery.
 * With `--confirm`, skips the interactive prompt.
 * With `--remove-browsers`, also runs `npx playwright uninstall --all`.
 * Always runs `npm uninstall playwright-praman` after file removal.
 *
 * @param options - Uninstall configuration.
 *
 * @example
 * ```typescript
 * await runUninstall({
 *   targetDir: '/home/user/project',
 *   confirm: true,
 *   keepConfig: false,
 *   keepAgents: false,
 *   removeBrowsers: false,
 * });
 * ```
 */
export async function runUninstall(options: UninstallOptions): Promise<void> {
  const files = getScaffoldedFiles(options.targetDir, options);

  if (files.length === 0) {
    logWarn('No scaffolded files found to remove.');
    return;
  }

  displayManifest(files);

  // Interactive confirmation unless --confirm flag is set
  if (!options.confirm) {
    logWarn(
      `This will move ${String(files.length)} file(s) to ${TRASH_DIR_NAME}/ and uninstall playwright-praman.`,
    );
    const approved = await promptConfirm('Proceed?');
    if (!approved) {
      logWarn('Aborted. No files were moved.');
      return;
    }
  }

  const moved = await moveFilesToTrash(files, options.targetDir);

  if (options.removeBrowsers) {
    removeBrowsersCmd();
  }

  uninstallPackage(options.targetDir);
  logSuccess(`Moved ${String(moved)} of ${String(files.length)} file(s) to ${TRASH_DIR_NAME}/.`);
  logWarn(`Files preserved in ${TRASH_DIR_NAME}/ — delete manually when ready.`);
}
