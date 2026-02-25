/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Package version and template path resolver.
 *
 * @remarks
 * Resolves the package root from `import.meta.url` using `fileURLToPath`
 * for Windows `file:///C:/...` compatibility. Caches results for performance.
 *
 * @module cli/version
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

let cachedRoot: string | undefined;
let cachedVersion: string | undefined;

/**
 * Resolves the package root directory from `import.meta.url`.
 *
 * @remarks
 * Uses `fileURLToPath` for cross-platform Windows compatibility.
 * Result is cached after first call.
 *
 * @returns Absolute path to the package root directory.
 *
 * @example
 * ```typescript
 * const root = getPackageRoot();
 * // '/path/to/node_modules/playwright-praman'
 * ```
 */
export function getPackageRoot(): string {
  if (cachedRoot !== undefined) return cachedRoot;
  // This file is at src/cli/version.ts → package root is ../../
  const currentDir = dirname(fileURLToPath(import.meta.url));
  cachedRoot = resolve(currentDir, '..', '..');
  return cachedRoot;
}

/**
 * Reads the package version from package.json.
 *
 * @remarks
 * Caches the result. Returns '0.0.0' if package.json cannot be read.
 *
 * @returns Semantic version string.
 *
 * @example
 * ```typescript
 * const version = getVersion();
 * // '1.0.1'
 * ```
 */
export function getVersion(): string {
  if (cachedVersion !== undefined) return cachedVersion;
  try {
    const pkgPath = join(getPackageRoot(), 'package.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted package root + literal 'package.json'
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    cachedVersion = pkg.version ?? '0.0.0';
  } catch {
    cachedVersion = '0.0.0';
  }
  return cachedVersion;
}

/**
 * Resolves the templates directory path.
 *
 * @returns Absolute path to the templates directory.
 *
 * @example
 * ```typescript
 * const tplRoot = getTemplateRoot();
 * // '/path/to/playwright-praman/templates'
 * ```
 */
export function getTemplateRoot(): string {
  return join(getPackageRoot(), 'templates');
}

/**
 * Resets the module-level cache for `getPackageRoot` and `getVersion`.
 *
 * @remarks
 * This function exists solely to enable deterministic unit tests. It must
 * not be called from production code. The `@internal` tag prevents it from
 * appearing in the public API documentation.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- underscore prefix marks test-only helper; not public API
export function _resetCache(): void {
  cachedRoot = undefined;
  cachedVersion = undefined;
}
