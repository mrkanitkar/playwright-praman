/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Type-level tests for FE fixture interfaces.
 *
 * @remarks
 * Validates ObjectPageFixture and FioriElementsFixture shapes from `src/fe/types.ts`.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type { FioriElementsFixture, ObjectPageFixture } from '../../../src/fe/types.js';

describe('ObjectPageFixture', () => {
  it('has navigateToSection method', () => {
    expectTypeOf<ObjectPageFixture>().toHaveProperty('navigateToSection');
  });

  it('has clickEdit method', () => {
    expectTypeOf<ObjectPageFixture>().toHaveProperty('clickEdit');
  });

  it('has getHeaderTitle method returning Promise<string>', () => {
    expectTypeOf<ObjectPageFixture['getHeaderTitle']>().returns.toExtend<Promise<string>>();
  });

  it('has isInEditMode method returning Promise<boolean>', () => {
    expectTypeOf<ObjectPageFixture['isInEditMode']>().returns.toExtend<Promise<boolean>>();
  });
});

describe('FioriElementsFixture', () => {
  it('has listReport property', () => {
    expectTypeOf<FioriElementsFixture>().toHaveProperty('listReport');
  });

  it('has objectPage extending ObjectPageFixture', () => {
    expectTypeOf<FioriElementsFixture['objectPage']>().toExtend<ObjectPageFixture>();
  });

  it('has table property', () => {
    expectTypeOf<FioriElementsFixture>().toHaveProperty('table');
  });

  it('has list property', () => {
    expectTypeOf<FioriElementsFixture>().toHaveProperty('list');
  });

  it('listReport.search returns Promise<void>', () => {
    expectTypeOf<FioriElementsFixture['listReport']['search']>().returns.toExtend<Promise<void>>();
  });

  it('table.getRowCount returns Promise<number>', () => {
    expectTypeOf<FioriElementsFixture['table']['getRowCount']>().returns.toExtend<
      Promise<number>
    >();
  });
});
