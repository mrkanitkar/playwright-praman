/**
 * Tests for `src/bridge/api-resolver.ts`.
 *
 * @remarks
 * Validates the 3-tier API resolution chain (D19) and version-aware
 * priority ordering for UI5 control lookup.
 */
import { describe, expect, it } from 'vitest';

import { assertValidScript } from '../../helpers/browser-script-tester.js';

import { createApiResolverScript, getApiResolverPriority } from '#bridge/api-resolver.js';

describe('createApiResolverScript', () => {
  const script = createApiResolverScript();

  it('returns a non-empty string', () => {
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('contains Element.getElementById (tier 1)', () => {
    expect(script).toContain('getElementById');
  });

  it('contains ElementRegistry.get (tier 2)', () => {
    expect(script).toContain('ElementRegistry');
  });

  it('contains Core.byId (tier 3 legacy)', () => {
    expect(script).toContain('byId');
  });

  it('contains try-catch fallback logic', () => {
    expect(script).toContain('try');
    expect(script).toContain('catch');
  });

  it('handles missing sap namespace', () => {
    expect(script).toContain('sap');
  });
});

describe('getApiResolverPriority', () => {
  it('returns all 3 tiers for UI5 >= 1.119', () => {
    const priority = getApiResolverPriority('1.136.0');
    expect(priority).toContain('Element.getElementById');
    expect(priority).toContain('ElementRegistry.get');
    expect(priority).toContain('Core.byId');
    expect(priority).toHaveLength(3);
  });

  it('returns 2 tiers for UI5 1.108-1.118', () => {
    const priority = getApiResolverPriority('1.110.0');
    expect(priority).toContain('ElementRegistry.get');
    expect(priority).toContain('Core.byId');
    expect(priority).not.toContain('Element.getElementById');
    expect(priority).toHaveLength(2);
  });

  it('returns only Core.byId for UI5 < 1.108', () => {
    const priority = getApiResolverPriority('1.71.0');
    expect(priority).toEqual(['Core.byId']);
  });

  it('returns all 3 tiers for latest version', () => {
    const priority = getApiResolverPriority('2.0.0');
    expect(priority).toHaveLength(3);
  });

  it('returns readonly array', () => {
    const priority = getApiResolverPriority('1.136.0');
    expect(Object.isFrozen(priority)).toBe(true);
  });
});
