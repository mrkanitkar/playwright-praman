/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/bridge/browser-scripts/control-tree.ts`.
 *
 * @remarks
 * Validates that the generated control tree browser script is syntactically
 * valid JavaScript containing the expected UI5 registry serialization logic.
 */
import { describe, expect, it } from 'vitest';

import { assertValidScript } from '../../../helpers/browser-script-tester.js';

import { createControlTreeScript } from '#bridge/browser-scripts/control-tree.js';

describe('createControlTreeScript', () => {
  it('returns a non-empty string', () => {
    const script = createControlTreeScript();
    expect(typeof script).toBe('string');
    expect(script.trim().length).toBeGreaterThan(0);
  });

  it('is syntactically valid JavaScript', () => {
    const script = createControlTreeScript();
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('is syntactically valid with custom params', () => {
    const script = createControlTreeScript({ maxDepth: 5, maxControls: 1000 });
    expect(() => {
      assertValidScript(script);
    }).not.toThrow();
  });

  it('contains UI5 registry resolution logic', () => {
    const script = createControlTreeScript();
    expect(script).toContain('sap.ui.core.Element');
    expect(script).toContain('ElementRegistry');
    expect(script).toContain('registry');
  });

  it('contains version detection fallback chain', () => {
    const script = createControlTreeScript();
    expect(script).toContain('sap.ui.version');
    expect(script).toContain('getVersionInfo');
    expect(script).toContain('0.0.0');
  });

  it('contains parent-child tree assembly logic', () => {
    const script = createControlTreeScript();
    expect(script).toContain('getParent');
    expect(script).toContain('children');
    expect(script).toContain('rootIds');
  });

  it('contains cycle protection via visited Set', () => {
    const script = createControlTreeScript();
    expect(script).toContain('visited');
    expect(script).toContain('new Set');
  });

  it('contains curated property extraction', () => {
    const script = createControlTreeScript();
    expect(script).toContain('CURATED_PROPS');
    expect(script).toContain('text');
    expect(script).toContain('value');
    expect(script).toContain('valueState');
    expect(script).toContain('editable');
  });

  it('contains binding path extraction', () => {
    const script = createControlTreeScript();
    expect(script).toContain('getBindingInfo');
    expect(script).toContain('bindingPaths');
  });

  it('contains truncation logic', () => {
    const script = createControlTreeScript();
    expect(script).toContain('_truncated');
    expect(script).toContain('effectiveMaxDepth');
  });

  it('injects maxDepth parameter into the script', () => {
    const script = createControlTreeScript({ maxDepth: 15 });
    expect(script).toContain('15');
  });

  it('injects maxControls parameter into the script', () => {
    const script = createControlTreeScript({ maxControls: 3000 });
    expect(script).toContain('3000');
  });

  it('uses default parameters when none provided', () => {
    const script = createControlTreeScript();
    // Default maxDepth is 10, maxControls is 5000
    expect(script).toContain('10');
    expect(script).toContain('5000');
  });

  it('contains try-catch error handling at top level', () => {
    const script = createControlTreeScript();
    expect(script).toContain('try');
    expect(script).toContain('catch');
    expect(script).toContain('return null');
  });

  it('does not reference __praman_bridge (bridge-independent)', () => {
    const script = createControlTreeScript();
    expect(script).not.toContain('__praman_bridge');
    expect(script).not.toContain('__praman_ready');
  });

  it('does not contain console.log', () => {
    const script = createControlTreeScript();
    expect(script).not.toContain('console.log');
  });

  it('returns snapshot structure with expected fields', () => {
    const script = createControlTreeScript();
    expect(script).toContain('capturedAt');
    expect(script).toContain('ui5Version');
    expect(script).toContain('totalControlCount');
    expect(script).toContain('roots');
    expect(script).toContain('pageUrl');
    expect(script).toContain('truncated');
  });

  it('builds node data with expected fields', () => {
    const script = createControlTreeScript();
    expect(script).toContain('controlType');
    expect(script).toContain('visible');
    expect(script).toContain('enabled');
    expect(script).toContain('domId');
    expect(script).toContain('properties');
    expect(script).toContain('bindingPaths');
  });

  it('contains safe method call utility', () => {
    const script = createControlTreeScript();
    expect(script).toContain('safeCall');
    expect(script).toContain('typeof');
  });

  it('wraps in an IIFE', () => {
    const script = createControlTreeScript();
    expect(script.trim()).toMatch(/^\(function\(\)/);
    expect(script.trim()).toMatch(/\)\(\)$/);
  });
});
