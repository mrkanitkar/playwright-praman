/**
 * Tests for `src/bridge/browser-scripts/execute-method.ts`.
 *
 * @remarks
 * Validates the method execution browser scripts contain correct return type
 * detection (A.4), aggregation special cases (A.6), and error handling.
 */
import { describe, expect, it } from 'vitest';

import { assertValidScript } from '../../../helpers/browser-script-tester.js';

import {
  createExecuteMethodScript,
  createExecuteObjectMethodScript,
} from '#bridge/browser-scripts/execute-method.js';

describe('createExecuteMethodScript', () => {
  const script = createExecuteMethodScript();

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

  it('retrieves control by ID', () => {
    expect(script).toContain('getById');
  });

  it('uses apply for method execution', () => {
    expect(script).toContain('apply');
  });

  it('detects empty return type (array length 0)', () => {
    expect(script).toContain('empty');
  });

  it('detects aggregation return type', () => {
    expect(script).toContain('aggregation');
  });

  it('detects element return type (same control)', () => {
    expect(script).toContain('element');
  });

  it('detects newElement return type (different control)', () => {
    expect(script).toContain('newElement');
  });

  it('detects object return type (non-control UI5 object)', () => {
    expect(script).toContain('object');
  });

  it('handles ComboBox aggregation special case (A.6)', () => {
    expect(script).toContain('InputWithSuggestionsListItem');
  });

  it('handles PlanningCalendar special case (A.6)', () => {
    expect(script).toContain('-CLI');
  });

  it('tracks execution duration', () => {
    expect(script).toContain('duration');
  });

  it('contains try-catch error handling', () => {
    expect(script).toContain('try');
    expect(script).toContain('catch');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });
});

describe('createExecuteObjectMethodScript', () => {
  const script = createExecuteObjectMethodScript();

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

  it('retrieves object from map by UUID', () => {
    expect(script).toContain('getObject');
  });

  it('uses apply for method execution', () => {
    expect(script).toContain('apply');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });
});
