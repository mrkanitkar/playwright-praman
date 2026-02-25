/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/browser-scripts/get-selector.ts`.
 *
 * @remarks
 * Validates the reverse-selector browser script for generating UI5-compatible
 * selectors from DOM elements (G5 carry-forward).
 */
import { describe, expect, it } from 'vitest';

import { assertValidScript } from '../../../helpers/browser-script-tester.js';

import { createGetSelectorScript } from '#bridge/browser-scripts/get-selector.js';

describe('createGetSelectorScript', () => {
  const script = createGetSelectorScript();

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

  it('uses control ID when available', () => {
    expect(script).toContain('getId');
  });

  it('falls back to property-based selector via metadata', () => {
    expect(script).toContain('getMetadata');
  });

  it('contains try-catch error handling', () => {
    expect(script).toContain('try');
    expect(script).toContain('catch');
  });

  it('does not contain console.log', () => {
    expect(script).not.toContain('console.log');
  });
});
