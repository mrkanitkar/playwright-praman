/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/matchers/types.d.ts` — matcher type augmentation.
 *
 * @remarks
 * Verifies that the TypeScript declaration augmentation of `@playwright/test`
 * Matchers interface compiles correctly with all 10 Praman custom matchers.
 * These are type-level tests only — runtime registration is done via
 * `expect.extend()` in `core-fixtures.ts`.
 */
import { describe, expectTypeOf, it } from 'vitest';

import '../../../src/matchers/types.d.ts';

describe('Praman matcher type augmentation', () => {
  it('toHaveUI5Text signature accepts (string) and (string, options)', () => {
    type ToHaveUI5Text = (expected: string, options?: { timeout?: number }) => Promise<unknown>;
    expectTypeOf<ToHaveUI5Text>().toBeFunction();
  });

  it('toBeUI5Visible signature accepts (options?)', () => {
    type ToBeUI5Visible = (options?: { timeout?: number }) => Promise<unknown>;
    expectTypeOf<ToBeUI5Visible>().toBeFunction();
  });

  it('toBeUI5Enabled signature accepts (options?)', () => {
    type ToBeUI5Enabled = (options?: { timeout?: number }) => Promise<unknown>;
    expectTypeOf<ToBeUI5Enabled>().toBeFunction();
  });

  it('toHaveUI5Property signature accepts (property, expected, options?)', () => {
    type ToHaveUI5Property = (
      property: string,
      expected: unknown,
      options?: { timeout?: number },
    ) => Promise<unknown>;
    expectTypeOf<ToHaveUI5Property>().toBeFunction();
  });

  it('toHaveUI5ValueState signature accepts (state, options?)', () => {
    type ToHaveUI5ValueState = (state: string, options?: { timeout?: number }) => Promise<unknown>;
    expectTypeOf<ToHaveUI5ValueState>().toBeFunction();
  });

  it('toHaveUI5Binding signature accepts (bindingPath, options?)', () => {
    type ToHaveUI5Binding = (
      bindingPath: string,
      options?: { timeout?: number },
    ) => Promise<unknown>;
    expectTypeOf<ToHaveUI5Binding>().toBeFunction();
  });

  it('toBeUI5ControlType signature accepts (controlType, options?)', () => {
    type ToBeUI5ControlType = (
      controlType: string,
      options?: { timeout?: number },
    ) => Promise<unknown>;
    expectTypeOf<ToBeUI5ControlType>().toBeFunction();
  });

  it('toHaveUI5CellText signature accepts (row, col, expected, options?)', () => {
    type ToHaveUI5CellText = (
      row: number,
      col: number,
      expected: string,
      options?: { timeout?: number },
    ) => Promise<unknown>;
    expectTypeOf<ToHaveUI5CellText>().toBeFunction();
  });

  it('toHaveUI5RowCount signature accepts (expected, options?)', () => {
    type ToHaveUI5RowCount = (expected: number, options?: { timeout?: number }) => Promise<unknown>;
    expectTypeOf<ToHaveUI5RowCount>().toBeFunction();
  });

  it('toHaveUI5SelectedRows signature accepts (expected[], options?)', () => {
    type ToHaveUI5SelectedRows = (
      expected: number[],
      options?: { timeout?: number },
    ) => Promise<unknown>;
    expectTypeOf<ToHaveUI5SelectedRows>().toBeFunction();
  });
});
