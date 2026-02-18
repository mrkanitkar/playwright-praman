/**
 * Tests for `src/index.ts` — root barrel Phase 3 additions.
 *
 * @remarks
 * Validates that `test` and `expect` (from fixture assembly),
 * auth module re-exports, and navigation re-exports are
 * accessible from the root barrel.
 */
import { describe, expect, it } from 'vitest';

describe('root barrel (src/index.ts)', () => {
  describe('fixture assembly re-exports', () => {
    it('should export test as a function', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.test).toBeDefined();
      expect(typeof mod.test).toBe('function');
    });

    it('should export expect as a function', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.expect).toBeDefined();
      expect(typeof mod.expect).toBe('function');
    });
  });

  describe('auth re-exports', () => {
    it('should export SAPAuthHandler class', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.SAPAuthHandler).toBeDefined();
    });

    it('should export createAuthStrategy factory', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.createAuthStrategy).toBeDefined();
      expect(typeof mod.createAuthStrategy).toBe('function');
    });
  });

  describe('navigation re-exports', () => {
    it('should export navigateToApp', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.navigateToApp).toBeDefined();
      expect(typeof mod.navigateToApp).toBe('function');
    });

    it('should export navigateToHome', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.navigateToHome).toBeDefined();
      expect(typeof mod.navigateToHome).toBe('function');
    });

    it('should export navigateToTile', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.navigateToTile).toBeDefined();
      expect(typeof mod.navigateToTile).toBe('function');
    });

    it('should export navigateBack', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.navigateBack).toBeDefined();
      expect(typeof mod.navigateBack).toBe('function');
    });

    it('should export navigateForward', async () => {
      const mod = await import('../../src/index.js');
      expect(mod.navigateForward).toBeDefined();
      expect(typeof mod.navigateForward).toBe('function');
    });
  });
});
