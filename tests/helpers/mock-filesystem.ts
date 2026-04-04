/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Mock `node:fs/promises` for CLI init/doctor unit tests.
 *
 * @remarks
 * Provides an in-memory file system that tracks all read, write, mkdir,
 * access, rm, readdir, stat, and copyFile operations. Designed for use
 * with `vi.mock('node:fs/promises', () => createMockFileSystem().mocks)`.
 *
 * @example
 * ```typescript
 * import { createMockFileSystem } from '../../helpers/mock-filesystem.js';
 *
 * const fs = createMockFileSystem({ '/project/package.json': '{"name":"test"}' });
 * vi.mock('node:fs/promises', () => fs.mocks);
 *
 * // After calling code under test:
 * expect(fs.written.get('/project/praman.config.ts')).toContain('PramanConfig');
 * ```
 *
 * @module test-helpers
 */

import { vi } from 'vitest';

/** The shape returned by {@link createMockFileSystem}. */
export interface MockFileSystem {
  /** Files that "exist" in the mock filesystem, keyed by absolute path. */
  readonly files: Map<string, string>;
  /** Directories that "exist" in the mock filesystem. */
  readonly dirs: Set<string>;
  /** Files written during the test, keyed by absolute path. */
  readonly written: Map<string, string>;
  /** Absolute paths of files deleted via `rm()`. */
  readonly deleted: string[];
  /** Drop-in `node:fs/promises` mock implementations. */
  readonly mocks: {
    readonly readFile: ReturnType<typeof vi.fn>;
    readonly writeFile: ReturnType<typeof vi.fn>;
    readonly mkdir: ReturnType<typeof vi.fn>;
    readonly access: ReturnType<typeof vi.fn>;
    readonly rm: ReturnType<typeof vi.fn>;
    readonly readdir: ReturnType<typeof vi.fn>;
    readonly stat: ReturnType<typeof vi.fn>;
    readonly copyFile: ReturnType<typeof vi.fn>;
  };
}

/** ENOENT error factory used by mock implementations. */
function enoent(op: string, path: string): NodeJS.ErrnoException {
  return Object.assign(new Error(`ENOENT: no such file or directory, ${op} '${path}'`), {
    code: 'ENOENT',
  });
}

/**
 * Creates an in-memory mock of `node:fs/promises` for unit testing file I/O.
 *
 * @param initialFiles - Optional map of `{ absolutePath: fileContent }` to
 *   pre-populate the virtual filesystem.
 * @returns A {@link MockFileSystem} with recording mocks and state accessors.
 *
 * @example
 * ```typescript
 * const fs = createMockFileSystem({ '/app/ui5.yaml': 'specVersion: "4.0"' });
 * vi.mock('node:fs/promises', () => fs.mocks);
 * // ...exercise code under test...
 * expect(fs.written.has('/app/praman.config.ts')).toBe(true);
 * expect(fs.deleted).toContain('/app/old-config.ts');
 * ```
 */
export function createMockFileSystem(initialFiles?: Record<string, string>): MockFileSystem {
  const files = new Map<string, string>(Object.entries(initialFiles ?? {}));
  const dirs = new Set<string>();
  const written = new Map<string, string>();
  const deleted: string[] = [];

  /* eslint-disable @typescript-eslint/promise-function-async -- mock stubs use Promise.resolve */
  const readFile = vi.fn().mockImplementation((path: string) => {
    const content = files.get(path) ?? written.get(path);
    if (content === undefined) return Promise.reject(enoent('open', path));
    return Promise.resolve(content);
  });

  const writeFile = vi.fn().mockImplementation((path: string, data: string) => {
    written.set(path, data);
    files.set(path, data);
    return Promise.resolve();
  });

  const mkdir = vi.fn().mockImplementation((path: string) => {
    dirs.add(path);
    return Promise.resolve(undefined);
  });

  const access = vi.fn().mockImplementation((path: string) => {
    if (files.has(path) || dirs.has(path)) return Promise.resolve();
    return Promise.reject(enoent('access', path));
  });

  const rm = vi.fn().mockImplementation((path: string) => {
    deleted.push(path);
    files.delete(path);
    dirs.delete(path);
    return Promise.resolve();
  });

  const readdir = vi.fn().mockImplementation((dirPath: string) => {
    const entries: string[] = [];
    const prefix = dirPath.endsWith('/') || dirPath.endsWith('\\') ? dirPath : `${dirPath}/`;
    const prefixLen = prefix.length;
    for (const filePath of files.keys()) {
      // Normalize separators for cross-platform compatibility (Windows uses \)
      const normalizedFile = filePath.replaceAll('\\', '/');
      const normalizedPrefix = prefix.replaceAll('\\', '/');
      if (
        normalizedFile.startsWith(normalizedPrefix) &&
        !normalizedFile.slice(prefixLen).includes('/')
      ) {
        entries.push(normalizedFile.slice(prefixLen));
      }
    }
    return Promise.resolve(entries);
  });

  const stat = vi.fn().mockImplementation((path: string) => {
    if (dirs.has(path)) {
      return Promise.resolve({ isDirectory: () => true, isFile: () => false, size: 0 });
    }
    if (files.has(path)) {
      const content = files.get(path) ?? '';
      return Promise.resolve({
        isDirectory: () => false,
        isFile: () => true,
        size: content.length,
      });
    }
    return Promise.reject(enoent('stat', path));
  });

  const copyFile = vi.fn().mockImplementation((src: string, dest: string) => {
    const content = files.get(src);
    if (content === undefined) return Promise.reject(enoent('copyfile', src));
    files.set(dest, content);
    written.set(dest, content);
    return Promise.resolve();
  });
  /* eslint-enable @typescript-eslint/promise-function-async */

  return {
    files,
    dirs,
    written,
    deleted,
    mocks: { readFile, writeFile, mkdir, access, rm, readdir, stat, copyFile },
  };
}
