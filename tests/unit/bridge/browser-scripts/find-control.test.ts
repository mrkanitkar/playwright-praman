/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/browser-scripts/find-control.ts`.
 *
 * @remarks
 * Validates the control discovery browser scripts contain correct
 * 3-tier discovery logic (getById → RecordReplay → fallback), method filtering,
 * and result extraction.
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

  it('uses getById as primary discovery for ID selectors', () => {
    // getById should appear before RecordReplay in the script for correct priority
    const getByIdPos = script.indexOf('getById');
    const recordReplayPos = script.indexOf('RecordReplay');
    expect(getByIdPos).toBeLessThan(recordReplayPos);
  });

  it('uses RecordReplay for controlType + properties discovery', () => {
    expect(script).toContain('RecordReplay');
  });

  it('verifies controlType match when specified in getById tier', () => {
    expect(script).toContain('selector.controlType');
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

  it('scans registry for partial ID match (composite control resolution)', () => {
    expect(script).toContain('registry');
  });

  it('contains try-catch error handling', () => {
    expect(script).toContain('try');
    expect(script).toContain('catch');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });

  // ── GAP-02: Enhanced registry matching ──────────────────────────────

  it('includes property matching helper (matchesProperties)', () => {
    expect(script).toContain('matchesProperties');
  });

  it('includes viewName matching helper (isInView)', () => {
    expect(script).toContain('isInView');
  });

  it('includes bindingPath matching helper (matchesBindingPath)', () => {
    expect(script).toContain('matchesBindingPath');
  });

  it('includes full selector matching helper (matchesFullSelector)', () => {
    expect(script).toContain('matchesFullSelector');
  });

  it('supports RegExp ID matching via new RegExp()', () => {
    expect(script).toContain('RegExp');
  });

  // ── GAP-21: Visibility preference ───────────────────────────────────

  it('tracks visibleMatch for preferring visible controls', () => {
    expect(script).toContain('visibleMatch');
  });

  it('tracks firstMatch as fallback when no visible match found', () => {
    expect(script).toContain('firstMatch');
  });

  it('uses bestMatch to pick visible over first match', () => {
    expect(script).toContain('bestMatch');
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
