/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/extensions/extension-types.ts`.
 *
 * @remarks
 * Validates the RESERVED_NAMESPACES constant and type exports.
 */
import { describe, expect, it } from 'vitest';

import { RESERVED_NAMESPACES } from '#extensions/extension-types.js';

describe('RESERVED_NAMESPACES', () => {
  it('is a ReadonlySet', () => {
    expect(RESERVED_NAMESPACES).toBeInstanceOf(Set);
  });

  it('contains built-in sub-namespaces', () => {
    expect(RESERVED_NAMESPACES.has('table')).toBe(true);
    expect(RESERVED_NAMESPACES.has('dialog')).toBe(true);
    expect(RESERVED_NAMESPACES.has('date')).toBe(true);
    expect(RESERVED_NAMESPACES.has('odata')).toBe(true);
  });

  it('contains UI5Handler public method names', () => {
    const handlerMethods = [
      'control',
      'controls',
      'click',
      'fill',
      'press',
      'select',
      'check',
      'uncheck',
      'clear',
      'getText',
      'getValue',
      'waitForUI5',
      'waitFor',
      'inspect',
      'clearCache',
      'destroy',
    ];

    for (const method of handlerMethods) {
      expect(RESERVED_NAMESPACES.has(method)).toBe(true);
    }
  });

  it('does not contain arbitrary names', () => {
    expect(RESERVED_NAMESPACES.has('myCustomExtension')).toBe(false);
    expect(RESERVED_NAMESPACES.has('approval')).toBe(false);
    expect(RESERVED_NAMESPACES.has('workflow')).toBe(false);
  });

  it('has expected size', () => {
    // 4 sub-namespaces + 16 handler methods = 20
    expect(RESERVED_NAMESPACES.size).toBe(20);
  });
});
