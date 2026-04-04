/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, expect, it } from 'vitest';

import { BRIDGE_STATUS_SCRIPT } from '../../../src/scripts/bridge-status.js';

describe('bridge-status script', () => {
  it('exports a non-empty string', () => {
    expect(BRIDGE_STATUS_SCRIPT).toBeTruthy();
    expect(typeof BRIDGE_STATUS_SCRIPT).toBe('string');
  });

  it('starts with async page =>', () => {
    expect(BRIDGE_STATUS_SCRIPT.trimStart()).toMatch(/^async\s+page\s*=>/);
  });

  it('checks bridge readiness', () => {
    expect(BRIDGE_STATUS_SCRIPT).toContain('bridge.ready');
  });

  it('returns ui5Version', () => {
    expect(BRIDGE_STATUS_SCRIPT).toContain('ui5Version');
  });

  it('returns controlCount', () => {
    expect(BRIDGE_STATUS_SCRIPT).toContain('controlCount');
  });

  it('returns timestamp', () => {
    expect(BRIDGE_STATUS_SCRIPT).toContain('timestamp');
  });
});
