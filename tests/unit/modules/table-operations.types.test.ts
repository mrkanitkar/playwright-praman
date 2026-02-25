/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Type-level tests for table-operations and table-filter-sort modules.
 *
 * @remarks
 * Verifies ColumnValueCriteria alias compatibility, TableOperationsPage interface
 * shape, filter/sort option types, and SortOrderInfo fields.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type {
  SortOrderInfo,
  TableExportOptions,
  TableFilterOptions,
  TableSortOptions,
} from '../../../src/modules/table-filter-sort.js';
import type {
  ColumnValueCriteria,
  TableOperationsPage,
} from '../../../src/modules/table-operations.js';
import type { TableOptions } from '../../../src/modules/table.js';

describe('ColumnValueCriteria', () => {
  it('extends Readonly<Record<string, string>>', () => {
    expectTypeOf<ColumnValueCriteria>().toExtend<Readonly<Record<string, string>>>();
  });

  it('is assignable from a plain string-to-string object literal', () => {
    expectTypeOf<{ Name: string; Status: string }>().toExtend<ColumnValueCriteria>();
  });
});

describe('TableOperationsPage', () => {
  it('has an evaluate method', () => {
    expectTypeOf<TableOperationsPage>().toHaveProperty('evaluate');
  });

  it('has a waitForFunction method', () => {
    expectTypeOf<TableOperationsPage>().toHaveProperty('waitForFunction');
  });

  it('evaluate returns a Promise', () => {
    expectTypeOf<TableOperationsPage['evaluate']>().returns.toExtend<Promise<unknown>>();
  });

  it('waitForFunction returns a Promise', () => {
    expectTypeOf<TableOperationsPage['waitForFunction']>().returns.toExtend<Promise<unknown>>();
  });
});

describe('TableFilterOptions', () => {
  it('extends TableOptions', () => {
    expectTypeOf<TableFilterOptions>().toExtend<TableOptions>();
  });
  it('has optional operator property', () => {
    expectTypeOf<TableFilterOptions['operator']>().not.toEqualTypeOf<never>();
  });
});

describe('TableSortOptions', () => {
  it('extends TableOptions', () => {
    expectTypeOf<TableSortOptions>().toExtend<TableOptions>();
  });
  it('has optional descending property', () => {
    expectTypeOf<TableSortOptions['descending']>().not.toEqualTypeOf<never>();
  });
});

describe('SortOrderInfo', () => {
  it('has required columnIndex number field', () => {
    expectTypeOf<SortOrderInfo['columnIndex']>().toEqualTypeOf<number>();
  });
  it('has required columnName string field', () => {
    expectTypeOf<SortOrderInfo['columnName']>().toEqualTypeOf<string>();
  });
  it('has required descending boolean field', () => {
    expectTypeOf<SortOrderInfo['descending']>().toEqualTypeOf<boolean>();
  });
});

describe('TableExportOptions', () => {
  it('extends TableOptions', () => {
    expectTypeOf<TableExportOptions>().toExtend<TableOptions>();
  });
  it('has optional format property', () => {
    expectTypeOf<TableExportOptions['format']>().not.toEqualTypeOf<never>();
  });
  it('has optional includeHeaders property', () => {
    expectTypeOf<TableExportOptions['includeHeaders']>().not.toEqualTypeOf<never>();
  });
  it('has optional columns property', () => {
    expectTypeOf<TableExportOptions['columns']>().not.toEqualTypeOf<never>();
  });
});
