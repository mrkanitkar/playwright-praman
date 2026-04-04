/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, expect, it } from 'vitest';

import { DISCOVER_ALL_SCRIPT } from '../../../src/scripts/discover-all.js';

describe('discover-all script', () => {
  it('exports a non-empty string', () => {
    expect(DISCOVER_ALL_SCRIPT).toBeTruthy();
    expect(typeof DISCOVER_ALL_SCRIPT).toBe('string');
  });

  it('starts with async page =>', () => {
    expect(DISCOVER_ALL_SCRIPT.trimStart()).toMatch(/^async\s+page\s*=>/);
  });

  it('contains bridge readiness guard', () => {
    expect(DISCOVER_ALL_SCRIPT).toContain('bridge.ready');
  });

  it('limits results with slice', () => {
    expect(DISCOVER_ALL_SCRIPT).toContain('.slice(0,');
  });

  it('calls retrieveControlMethods', () => {
    expect(DISCOVER_ALL_SCRIPT).toContain('retrieveControlMethods');
  });

  it('uses ElementRegistry.all()', () => {
    expect(DISCOVER_ALL_SCRIPT).toContain('ElementRegistry.all()');
  });

  it('does not use optional chaining inside script body', () => {
    expect(DISCOVER_ALL_SCRIPT).not.toContain('?.');
  });
});
