/**
 * Tests for `src/bridge/browser-scripts/find-control.ts`.
 *
 * @remarks
 * Validates the control discovery browser scripts contain correct
 * 2-tier discovery logic (A.3), method filtering, and result extraction.
 */
import { describe, expect, it } from 'vitest';

import { assertValidScript } from '../../../helpers/browser-script-tester.js';

import {
  createFindAllControlsScript,
  createFindControlScript,
} from '#bridge/browser-scripts/find-control.js';

describe('createFindControlScript', () => {
  const script = createFindControlScript();

  it('returns a non-empty string', () => {
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('references the bridge namespace', () => {
    expect(script).toContain('__praman_bridge');
  });

  it('uses RecordReplay for primary discovery', () => {
    expect(script).toContain('RecordReplay');
  });

  it('has getById fallback for ID-only selectors', () => {
    expect(script).toContain('getById');
  });

  it('extracts control ID', () => {
    expect(script).toContain('getId');
  });

  it('extracts control type via metadata', () => {
    expect(script).toContain('getMetadata');
  });

  it('filters methods using underscore prefix rule', () => {
    expect(script).toContain('charAt');
  });

  it('returns visibility status', () => {
    expect(script).toContain('visible');
  });

  it('contains try-catch error handling', () => {
    expect(script).toContain('try');
    expect(script).toContain('catch');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });
});

describe('createFindAllControlsScript', () => {
  const script = createFindAllControlsScript();

  it('returns a non-empty string', () => {
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('references the bridge namespace', () => {
    expect(script).toContain('__praman_bridge');
  });

  it('uses RecordReplay for discovery', () => {
    expect(script).toContain('RecordReplay');
  });

  it('returns an array result via map', () => {
    expect(script).toContain('map');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });
});
