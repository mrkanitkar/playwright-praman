/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/compat/path-helpers.ts` — cross-platform path utilities.
 *
 * @module compat
 */
import { sep } from 'node:path';
import process from 'node:process';

import { describe, expect, it } from 'vitest';

import {
  getModuleDirname,
  getModuleFilename,
  joinPath,
  PATH_SEPARATOR,
  resolveFromPackageRoot,
} from '#core/compat/path-helpers.js';

describe('getModuleDirname', () => {
  it('returns a directory path for a valid file URL', () => {
    const result = getModuleDirname(import.meta.url);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Should be a directory path (not end with .ts)
    expect(result.endsWith('.ts')).toBe(false);
  });

  it('falls back to process.cwd() for invalid URL', () => {
    const result = getModuleDirname('not-a-valid-url');
    expect(result).toBe(process.cwd());
  });
});

describe('getModuleFilename', () => {
  it('returns a file path for a valid file URL', () => {
    const result = getModuleFilename(import.meta.url);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Should end with the test file name
    expect(result).toContain('path-helpers.test.ts');
  });

  it('returns empty string for invalid URL', () => {
    const result = getModuleFilename('not-a-valid-url');
    expect(result).toBe('');
  });
});

describe('resolveFromPackageRoot', () => {
  it('returns a resolved absolute path', () => {
    const result = resolveFromPackageRoot(import.meta.url, 'dist', 'index.js');
    expect(typeof result).toBe('string');
    expect(result).toContain('dist');
    expect(result).toContain('index.js');
  });

  it('returns directory path with no extra segments', () => {
    const result = resolveFromPackageRoot(import.meta.url);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('joinPath', () => {
  it('joins path segments correctly', () => {
    const result = joinPath('foo', 'bar', 'baz.ts');
    expect(result).toContain('foo');
    expect(result).toContain('bar');
    expect(result).toContain('baz.ts');
  });

  it('uses OS separator', () => {
    const result = joinPath('a', 'b');
    expect(result).toBe(`a${sep}b`);
  });
});

describe('PATH_SEPARATOR', () => {
  it('matches the OS separator', () => {
    expect(PATH_SEPARATOR).toBe(sep);
  });

  it('is a single character', () => {
    expect(PATH_SEPARATOR).toHaveLength(1);
  });
});
