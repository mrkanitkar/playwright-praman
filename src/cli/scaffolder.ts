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

import { execFile } from 'node:child_process';
import { access, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { IDEDetection } from './ide-detector.js';
import { scaffoldCliAgents, scaffoldIDEFiles } from './ide-installer.js';
import { logWarn } from './logger.js';
import { getPackageRoot } from './version.js';

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
 * Checks whether Docker is available on the system.
 *
 * @remarks
 * Runs `docker --version` in a try/catch so that a missing Docker
 * installation never causes init to fail.
 *
 * @returns `true` when `docker --version` exits successfully.
 *
 * @example
 * ```typescript
 * if (await isDockerAvailable()) {
 *   // copy Docker templates
 * }
 * ```
 */
export async function isDockerAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // eslint-disable-next-line sonarjs/no-os-command-from-path -- Docker binary is expected on PATH; no user-controlled input
      execFile('docker', ['--version'], (error) => {
        resolve(error === null);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Copies Docker reference templates from the package `examples/docker/`
 * into the user's project when Docker is detected.
 *
 * @param targetDir - Absolute path to the user's project root.
 * @param force - When `true`, overwrite existing destination files.
 * @param created - Array to push created file paths into.
 *
 * @example
 * ```typescript
 * await scaffoldDockerFiles('/home/user/project', false, []);
 * ```
 */
export async function scaffoldDockerFiles(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const dockerAvailable = await isDockerAvailable();
  if (!dockerAvailable) {
    return;
  }

  const pkgRoot = getPackageRoot();
  const destDir = join(targetDir, 'examples', 'docker');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destDir composed from targetDir + known constant path
  await mkdir(destDir, { recursive: true });

  const files = ['docker-compose.yml', 'Dockerfile'] as const;
  for (const fileName of files) {
    const srcPath = join(pkgRoot, 'examples', 'docker', fileName);
    const destPath = join(destDir, fileName);

    if (!force) {
      try {
        await access(destPath);
        continue; // file exists — skip
      } catch {
        // file does not exist — proceed to copy
      }
    }

    try {
      await access(srcPath);
    } catch {
      logWarn(`Docker template source not found: ${srcPath}`);
      continue;
    }

    try {
      await copyFile(srcPath, destPath);
      created.push(destPath);
    } catch {
      logWarn(`Failed to copy Docker template: ${srcPath}`);
    }
  }
}

/** Telemetry example files copied from `examples/` into the user's project. */
const TELEMETRY_EXAMPLE_FILES = [
  'praman.config.telemetry.ts',
  'praman.config.azure-monitor.ts',
  'playwright.config.otel-reporter.ts',
] as const;

/**
 * Copies telemetry example configs from the package `examples/` directory
 * into the user's project at `examples/telemetry/`.
 *
 * @param targetDir - Absolute path to the user's project root.
 * @param force - When `true`, overwrite existing destination files.
 * @param created - Array to push created file paths into.
 *
 * @example
 * ```typescript
 * await scaffoldTelemetryExamples('/home/user/project', false, []);
 * ```
 */
export async function scaffoldTelemetryExamples(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const pkgRoot = getPackageRoot();
  const destDir = join(targetDir, 'examples', 'telemetry');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- destDir composed from targetDir + known constant path
  await mkdir(destDir, { recursive: true });

  for (const fileName of TELEMETRY_EXAMPLE_FILES) {
    const srcPath = join(pkgRoot, 'examples', fileName);
    const destPath = join(destDir, fileName);

    if (!force) {
      try {
        await access(destPath);
        continue; // file exists — skip
      } catch {
        // file does not exist — proceed to copy
      }
    }

    try {
      await access(srcPath);
    } catch {
      logWarn(`Telemetry example source not found: ${srcPath}`);
      continue;
    }

    try {
      await copyFile(srcPath, destPath);
      created.push(destPath);
    } catch {
      logWarn(`Failed to copy telemetry example: ${srcPath}`);
    }
  }
}

/**
 * Copies `.env.example` from the package root into the user's project.
 *
 * @param targetDir - Absolute path to the user's project root.
 * @param force - When `true`, overwrite an existing `.env.example`.
 * @param created - Array to push created file paths into.
 *
 * @example
 * ```typescript
 * await scaffoldEnvExample('/home/user/project', false, []);
 * ```
 */
export async function scaffoldEnvExample(
  targetDir: string,
  force: boolean,
  created: string[],
): Promise<void> {
  const pkgRoot = getPackageRoot();
  const srcPath = join(pkgRoot, '.env.example');
  const destPath = join(targetDir, '.env.example');

  if (!force) {
    try {
      await access(destPath);
      return; // file exists — skip
    } catch {
      // file does not exist — proceed to copy
    }
  }

  try {
    await access(srcPath);
  } catch {
    logWarn(`Environment template source not found: ${srcPath}`);
    return;
  }

  try {
    await copyFile(srcPath, destPath);
    created.push(destPath);
  } catch {
    logWarn(`Failed to copy environment template: ${srcPath}`);
  }
}

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
    const earlyFiles: string[] = [];

    // Even in an existing project, install IDE-specific files when detected
    if (detection !== undefined) {
      const ideFiles = await scaffoldIDEFiles(targetDir, detection, force, cli);
      earlyFiles.push(...ideFiles);
    }

    // CLI agents are installed even without IDE detection
    if (cli && detection === undefined) {
      await scaffoldCliAgents(targetDir, undefined, force, earlyFiles);
    }

    if (earlyFiles.length > 0) {
      return { success: true, filesCreated: earlyFiles };
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

  // Copy .env.example from the package into the user's project root
  await scaffoldEnvExample(targetDir, force, filesCreated);

  // Copy Docker reference templates when Docker is available
  await scaffoldDockerFiles(targetDir, force, filesCreated);

  // Copy telemetry example configs
  await scaffoldTelemetryExamples(targetDir, force, filesCreated);

  // Install IDE-specific agent, seed, and config files
  if (detection !== undefined) {
    const ideFiles = await scaffoldIDEFiles(targetDir, detection, force, cli);
    filesCreated.push(...ideFiles);
  }

  // CLI agents are installed even without IDE detection
  if (cli && detection === undefined) {
    await scaffoldCliAgents(targetDir, undefined, force, filesCreated);
  }

  return { success: true, filesCreated };
}
