/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Project scaffolding logic for the Praman CLI.
 *
 * @remarks
 * Creates the directory structure and template files for a new Praman
 * project. Supports `basic` and `fiori` templates with a `force` option
 * to overwrite existing directories.
 *
 * @module cli/scaffolder
 */

import { access, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { IDEDetection } from './ide-detector.js';
import { scaffoldIDEFiles } from './ide-installer.js';

/**
 * Options for scaffolding a new Praman project.
 *
 * @example
 * ```typescript
 * const options: ScaffoldOptions = {
 *   targetDir: '/home/user/my-sap-tests',
 *   force: false,
 *   template: 'basic',
 * };
 * ```
 */
export interface ScaffoldOptions {
  /** Absolute path to the target directory for the new project. */
  readonly targetDir: string;
  /** When `true`, overwrite an existing directory. Defaults to `false`. */
  readonly force?: boolean;
  /** Template variant to scaffold. Defaults to `'basic'`. */
  readonly template?: 'basic' | 'fiori';
  /**
   * IDE detection result from {@link detectIDEs}.
   * When provided, installs IDE-specific agent, seed, and config files.
   */
  readonly detection?: IDEDetection;
  /** When `true`, install CLI-based agents (Playwright CLI) alongside MCP agents. */
  readonly cli?: boolean;
}

/**
 * Discriminated union result of a scaffold operation.
 *
 * @example
 * ```typescript
 * const result: ScaffoldResult = await scaffoldProject({ targetDir: '/tmp/project' });
 * if (result.success) {
 *   console.log('Created:', result.filesCreated);
 * } else {
 *   console.error('Failed:', result.reason);
 * }
 * ```
 */
export type ScaffoldResult =
  | { readonly success: true; readonly filesCreated: readonly string[] }
  | { readonly success: false; readonly reason: string };

/** Checks whether a directory exists at the given path. */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    await access(dirPath);
    return true;
  } catch {
    return false;
  }
}

// ── Template content ──────────────────────────────────────────────────────────

const GITIGNORE_TEMPLATE = `.env
.auth/
test-results/
playwright-report/
node_modules/
praman-prompts/
`;

const PRAMAN_CONFIG_TEMPLATE = `import type { PramanConfig } from 'playwright-praman';

const config: PramanConfig = {
  logLevel: 'info',
  ui5WaitTimeout: 30_000,
  controlDiscoveryTimeout: 10_000,
  interactionStrategy: 'ui5-native',
};

export default config;
`;

const TSCONFIG_TEMPLATE = `{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
`;

/** File template definitions: relative path from targetDir to content. */
const TEMPLATE_FILES: readonly (readonly [string, string])[] = [
  ['praman.config.ts', PRAMAN_CONFIG_TEMPLATE],
  ['tsconfig.json', TSCONFIG_TEMPLATE],
  ['.gitignore', GITIGNORE_TEMPLATE],
];

/** Subdirectories to create inside the target directory. */
const SUBDIRECTORIES: readonly string[] = ['tests', '.auth'];

/**
 * Scaffolds a new Praman project at the specified target directory.
 *
 * @remarks
 * Creates the directory structure (`tests/`, `.auth/`), writes template
 * config files (`praman.config.ts`, `tsconfig.json`, `.gitignore`), and
 * returns the list of created file paths.
 *
 * If the target directory already exists and `force` is not `true`, the
 * function returns a failure result with reason `'directory-exists'`.
 *
 * @param options - Scaffold configuration including target directory and template.
 * @returns A {@link ScaffoldResult} indicating success or failure.
 *
 * @example
 * ```typescript
 * import { scaffoldProject } from './scaffolder.js';
 *
 * const result = await scaffoldProject({
 *   targetDir: '/home/user/my-sap-tests',
 *   template: 'basic',
 * });
 *
 * if (result.success) {
 *   for (const file of result.filesCreated) {
 *     console.log('Created:', file);
 *   }
 * }
 * ```
 */
export async function scaffoldProject(options: ScaffoldOptions): Promise<ScaffoldResult> {
  const { targetDir, force = false, detection, cli = false } = options;

  // Guard: check if directory already exists
  const exists = await directoryExists(targetDir);
  if (exists && !force) {
    // Even in an existing project, install IDE-specific files when detected
    if (detection !== undefined) {
      const ideFiles = await scaffoldIDEFiles(targetDir, detection, force, cli);
      if (ideFiles.length > 0) {
        return { success: true, filesCreated: ideFiles };
      }
    }
    return { success: false, reason: 'directory-exists' };
  }

  // Create target directory (recursive handles both new and existing)
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is caller-controlled targetDir
  await mkdir(targetDir, { recursive: true });

  // Create subdirectories
  for (const subdir of SUBDIRECTORIES) {
    const fullPath = join(targetDir, subdir);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known subdirectory names
    await mkdir(fullPath, { recursive: true });
  }

  // Write template files
  const filesCreated: string[] = [];
  for (const [fileName, content] of TEMPLATE_FILES) {
    const filePath = join(targetDir, fileName);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from targetDir + known template file names
    await writeFile(filePath, content, 'utf8');
    filesCreated.push(filePath);
  }

  // Install IDE-specific agent, seed, and config files
  if (detection !== undefined) {
    const ideFiles = await scaffoldIDEFiles(targetDir, detection, force);
    filesCreated.push(...ideFiles);
  }

  return { success: true, filesCreated };
}
