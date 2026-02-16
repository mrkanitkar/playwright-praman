/**
 * Cross-format path helpers for ESM and CJS compatibility.
 *
 * @remarks
 * With tsup `shims: true`, `import.meta.url` is polyfilled in CJS output
 * and `__dirname` is polyfilled in ESM output. This module provides clean
 * wrappers that work identically in both module formats without fragile
 * stack-trace introspection.
 *
 * All path operations use `node:path` — never hardcoded separators.
 * This ensures correct behavior on Windows, macOS, and Linux.
 *
 * @module compat
 */

import { dirname, join, resolve, sep } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

/**
 * Gets the directory name of the current module.
 *
 * @remarks
 * Uses `import.meta.url` (shimmed by tsup in CJS) to resolve
 * the current file's directory. Falls back to `process.cwd()`
 * if resolution fails.
 *
 * @returns The absolute directory path of the calling module
 *
 * @example
 * ```typescript
 * import { getModuleDirname } from '#core/compat/path-helpers.js';
 *
 * const dir = getModuleDirname(import.meta.url);
 * // '/Users/dev/project/src/core/compat'
 * ```
 */
export function getModuleDirname(metaUrl: string): string {
  try {
    return dirname(fileURLToPath(metaUrl));
  } catch {
    return process.cwd();
  }
}

/**
 * Gets the file path of the current module.
 *
 * @remarks
 * Converts a `file://` URL (from `import.meta.url`) to an OS-native
 * file path. Returns empty string if resolution fails.
 *
 * @returns The absolute file path of the calling module
 *
 * @example
 * ```typescript
 * import { getModuleFilename } from '#core/compat/path-helpers.js';
 *
 * const file = getModuleFilename(import.meta.url);
 * // '/Users/dev/project/src/core/compat/path-helpers.ts'
 * ```
 */
export function getModuleFilename(metaUrl: string): string {
  try {
    return fileURLToPath(metaUrl);
  } catch {
    return '';
  }
}

/**
 * Resolves a path relative to the package root directory.
 *
 * @remarks
 * Navigates upward from the given module URL to find the package root.
 * Uses `node:path.resolve` for cross-platform path construction.
 *
 * @param metaUrl - The `import.meta.url` of the calling module
 * @param segments - Additional path segments to resolve from the package root
 * @returns The resolved absolute path
 *
 * @example
 * ```typescript
 * import { resolveFromPackageRoot } from '#core/compat/path-helpers.js';
 *
 * const configPath = resolveFromPackageRoot(import.meta.url, 'dist', 'config.js');
 * ```
 */
export function resolveFromPackageRoot(metaUrl: string, ...segments: readonly string[]): string {
  const moduleDir = getModuleDirname(metaUrl);
  return resolve(moduleDir, '..', '..', '..', ...segments);
}

/**
 * Joins path segments using the OS-specific separator.
 *
 * @remarks
 * Thin wrapper over `node:path.join` to discourage string concatenation
 * with hardcoded separators. Enforces cross-platform path construction.
 *
 * @param segments - Path segments to join
 * @returns The joined path string
 *
 * @example
 * ```typescript
 * import { joinPath } from '#core/compat/path-helpers.js';
 *
 * const authDir = joinPath(process.cwd(), '.auth', 'session.json');
 * // Windows: 'C:\\Users\\dev\\.auth\\session.json'
 * // Unix:    '/home/dev/.auth/session.json'
 * ```
 */
export function joinPath(...segments: readonly string[]): string {
  return join(...segments);
}

/**
 * The OS-specific path separator.
 *
 * @remarks
 * Exposed for cases where consumers need to split or inspect path strings.
 * Prefer `joinPath()` and `node:path.resolve()` over manual separator use.
 *
 * @example
 * ```typescript
 * import { PATH_SEPARATOR } from '#core/compat/path-helpers.js';
 *
 * const parts = somePath.split(PATH_SEPARATOR);
 * ```
 */
export const PATH_SEPARATOR: string = sep;
