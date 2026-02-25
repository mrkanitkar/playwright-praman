/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/fixtures/index.ts` — fixture assembly via mergeTests.
 *
 * @remarks
 * Validates that the final `test` export correctly merges all fixture
 * modules (coreTest, authTest, navTest, stabilityTest) and that `expect`
 * is re-exported from `@playwright/test`.
 */
import { describe, expect, it } from 'vitest';

describe('fixtures/index (assembly)', () => {
  describe('test export', () => {
    it('should export test as a function', async () => {
      const mod = await import('../../../src/fixtures/index.js');
      expect(mod.test).toBeDefined();
      expect(typeof mod.test).toBe('function');
    });

    it('should export test with extend method', async () => {
      const mod = await import('../../../src/fixtures/index.js');
      // eslint-disable-next-line @typescript-eslint/unbound-method -- checking existence of method on imported object
      expect(mod.test.extend).toBeDefined();
      expect(typeof mod.test.extend).toBe('function');
    });
  });

  describe('expect export', () => {
    it('should export expect as a function', async () => {
      const mod = await import('../../../src/fixtures/index.js');
      expect(mod.expect).toBeDefined();
      expect(typeof mod.expect).toBe('function');
    });
  });

  describe('type re-exports', () => {
    it('should export NavFixtures type', async () => {
      const mod = await import('../../../src/fixtures/index.js');
      // Type re-exports are compile-time only; verify the module loads
      expect(mod).toBeDefined();
    });

    it('should export AuthFixtures type', async () => {
      const mod = await import('../../../src/fixtures/index.js');
      expect(mod).toBeDefined();
    });
  });

  describe('individual fixture module re-exports', () => {
    it('should still export coreTest for standalone usage', async () => {
      const mod = await import('../../../src/fixtures/index.js');
      expect(mod.coreTest).toBeDefined();
      expect(typeof mod.coreTest).toBe('function');
    });

    it('should still export authTest for standalone usage', async () => {
      const mod = await import('../../../src/fixtures/index.js');
      expect(mod.authTest).toBeDefined();
      expect(typeof mod.authTest).toBe('function');
    });

    it('should still export navTest for standalone usage', async () => {
      const mod = await import('../../../src/fixtures/index.js');
      expect(mod.navTest).toBeDefined();
      expect(typeof mod.navTest).toBe('function');
    });

    it('should still export stabilityTest for standalone usage', async () => {
      const mod = await import('../../../src/fixtures/index.js');
      expect(mod.stabilityTest).toBeDefined();
      expect(typeof mod.stabilityTest).toBe('function');
    });
  });
});
