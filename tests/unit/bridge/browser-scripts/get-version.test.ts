/**
 * Tests for `src/bridge/browser-scripts/get-version.ts`.
 *
 * @remarks
 * Validates that the generated get-version browser script is syntactically
 * valid JavaScript containing the expected UI5 version detection logic.
 */
import { describe, expect, it } from 'vitest';

import { assertValidScript } from '../../../helpers/browser-script-tester.js';

import { createGetVersionScript } from '#bridge/browser-scripts/get-version.js';

describe('createGetVersionScript', () => {
  const script = createGetVersionScript();

  it('returns a non-empty string', () => {
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('contains sap.ui version detection', () => {
    expect(script).toContain('sap.ui');
  });

  it('contains try-catch error handling', () => {
    expect(script).toContain('try');
    expect(script).toContain('catch');
  });

  it('contains a fallback version string', () => {
    expect(script).toContain('0.0.0');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });

  it('returns version in the result', () => {
    expect(script).toContain('return');
  });
});
