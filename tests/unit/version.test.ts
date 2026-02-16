/**
 * Tests for `src/version.ts` — package version and name constants.
 *
 * @module version
 */
import { describe, expect, it } from 'vitest';

import { PACKAGE_NAME, VERSION } from '../../src/version.js';

describe('version constants', () => {
  it('VERSION is a valid semver string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('PACKAGE_NAME is playwright-praman', () => {
    expect(PACKAGE_NAME).toBe('playwright-praman');
  });

  it('VERSION is a string literal type', () => {
    const version: string = VERSION;
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });
});
