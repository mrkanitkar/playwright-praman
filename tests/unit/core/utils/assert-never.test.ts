/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/utils/assert-never.ts` — exhaustive type narrowing.
 *
 * @remarks
 * Validates that `assertNever()` throws with a descriptive message when
 * called at runtime (should never happen in well-typed code).
 *
 * @module utils
 */

import { describe, expect, it } from 'vitest';

import { assertNever } from '#core/utils/assert-never.js';

describe('assertNever', () => {
  it('throws an error with the unexpected value stringified', () => {
    expect(() => assertNever('oops' as never)).toThrow('Unexpected value: oops');
  });

  it('throws an error for numeric values', () => {
    expect(() => assertNever(42 as never)).toThrow('Unexpected value: 42');
  });

  it('throws an Error instance', () => {
    expect(() => assertNever(null as never)).toThrow(Error);
  });
});
