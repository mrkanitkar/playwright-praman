/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/cli/version.ts` — package root, version, and template resolver.
 *
 * @remarks
 * Verifies that `getPackageRoot` resolves correctly from `import.meta.url`,
 * that `getVersion` reads and caches the version from package.json,
 * and that `getTemplateRoot` appends the expected segment.
 *
 * @module cli/version
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  _resetCache,
  getPackageRoot,
  getTemplateRoot,
  getVersion,
} from '../../../src/cli/version.js';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
}));

const { readFileSync } = await import('node:fs');
const mockReadFileSync = vi.mocked(readFileSync);

describe('cli/version', () => {
  beforeEach(() => {
    _resetCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    _resetCache();
  });

  describe('getPackageRoot', () => {
    it('returns a non-empty string', () => {
      const root = getPackageRoot();
      expect(typeof root).toBe('string');
      expect(root.length).toBeGreaterThan(0);
    });

    it('resolves to the project root (ends with mk1 or playwright-praman)', () => {
      const root = getPackageRoot();
      // The project root is two directories up from src/cli/version.ts
      // In the test environment this resolves to the actual project root
      expect(root).toMatch(/mk1$|playwright-praman$/);
    });

    it('caches the result on subsequent calls', () => {
      const first = getPackageRoot();
      const second = getPackageRoot();
      expect(first).toBe(second);
    });
  });

  describe('getVersion', () => {
    it('reads and returns the version from package.json', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({ version: '2.3.4' }));

      const version = getVersion();

      expect(version).toBe('2.3.4');
      expect(mockReadFileSync).toHaveBeenCalledOnce();
    });

    it('returns fallback "0.0.0" when readFileSync throws', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT: file not found');
      });

      const version = getVersion();

      expect(version).toBe('0.0.0');
    });

    it('returns fallback "0.0.0" when package.json has no version field', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({}));

      const version = getVersion();

      expect(version).toBe('0.0.0');
    });

    it('caches the result on subsequent calls', () => {
      mockReadFileSync.mockReturnValue(JSON.stringify({ version: '1.2.3' }));

      const first = getVersion();
      const second = getVersion();

      expect(first).toBe('1.2.3');
      expect(second).toBe('1.2.3');
      // readFileSync should only have been called once
      expect(mockReadFileSync).toHaveBeenCalledOnce();
    });
  });

  describe('getTemplateRoot', () => {
    it('appends "templates" to the package root', () => {
      const root = getPackageRoot();
      const tplRoot = getTemplateRoot();
      expect(tplRoot).toContain('templates');
      expect(tplRoot.startsWith(root)).toBe(true);
    });

    it('returns a string that ends with "templates"', () => {
      const tplRoot = getTemplateRoot();
      // On all platforms the last segment should be "templates"
      const parts = tplRoot.split(/[\\/]/);
      expect(parts.at(-1)).toBe('templates');
    });
  });
});
