/**
 * Type-level tests for `src/modules/table.ts`.
 *
 * @remarks
 * Verifies TableVariant literal union, TableInfo required fields,
 * optional fields on TableOptions and WaitForTableDataOptions,
 * interface extension, function return types, and TablePage shape.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type {
  TableInfo,
  TableOptions,
  TablePage,
  TableVariant,
  WaitForTableDataOptions,
  getTableRows,
} from '../../../src/modules/table.js';

describe('TableVariant', () => {
  it('extends string', () => {
    expectTypeOf<TableVariant>().toExtend<string>();
  });

  it('accepts all six valid SAP UI5 table variant strings', () => {
    expectTypeOf<'sap.m.Table'>().toExtend<TableVariant>();
    expectTypeOf<'sap.ui.table.Table'>().toExtend<TableVariant>();
    expectTypeOf<'sap.ui.table.TreeTable'>().toExtend<TableVariant>();
    expectTypeOf<'sap.ui.table.AnalyticalTable'>().toExtend<TableVariant>();
    expectTypeOf<'sap.ui.comp.smarttable.SmartTable'>().toExtend<TableVariant>();
    expectTypeOf<'sap.ui.mdc.Table'>().toExtend<TableVariant>();
  });

  it('rejects non-table control type strings', () => {
    expectTypeOf<'sap.m.Button'>().not.toExtend<TableVariant>();
    expectTypeOf<'sap.m.Input'>().not.toExtend<TableVariant>();
    expectTypeOf<string>().not.toExtend<TableVariant>();
  });
});

describe('TableInfo', () => {
  it('has required fields variant, effectiveId, and isSmartTable', () => {
    expectTypeOf<TableInfo>().toHaveProperty('variant');
    expectTypeOf<TableInfo>().toHaveProperty('effectiveId');
    expectTypeOf<TableInfo>().toHaveProperty('isSmartTable');
  });

  it('variant field is typed as TableVariant', () => {
    expectTypeOf<TableInfo['variant']>().toEqualTypeOf<TableVariant>();
  });

  it('effectiveId field is typed as string', () => {
    expectTypeOf<TableInfo['effectiveId']>().toEqualTypeOf<string>();
  });

  it('isSmartTable field is typed as boolean', () => {
    expectTypeOf<TableInfo['isSmartTable']>().toEqualTypeOf<boolean>();
  });

  it('smartTableId is an optional string field', () => {
    expectTypeOf<TableInfo['smartTableId']>().toEqualTypeOf<string | undefined>();
  });
});

describe('TableOptions', () => {
  it('timeout is an optional number', () => {
    expectTypeOf<TableOptions['timeout']>().toEqualTypeOf<number | undefined>();
  });

  it('skipStabilityWait is an optional boolean', () => {
    expectTypeOf<TableOptions['skipStabilityWait']>().toEqualTypeOf<boolean | undefined>();
  });
});

describe('WaitForTableDataOptions', () => {
  it('extends TableOptions', () => {
    expectTypeOf<WaitForTableDataOptions>().toExtend<TableOptions>();
  });

  it('has optional minRows number field', () => {
    expectTypeOf<WaitForTableDataOptions['minRows']>().toEqualTypeOf<number | undefined>();
  });

  it('has optional polling number field', () => {
    expectTypeOf<WaitForTableDataOptions['polling']>().toEqualTypeOf<number | undefined>();
  });

  it('inherits optional timeout from TableOptions', () => {
    expectTypeOf<WaitForTableDataOptions['timeout']>().toEqualTypeOf<number | undefined>();
  });
});

describe('getTableRows return type', () => {
  it('returns Promise<readonly string[]>', () => {
    expectTypeOf<typeof getTableRows>().returns.toExtend<Promise<readonly string[]>>();
  });
});

describe('TablePage', () => {
  it('has an evaluate method', () => {
    expectTypeOf<TablePage>().toHaveProperty('evaluate');
  });

  it('has a waitForFunction method', () => {
    expectTypeOf<TablePage>().toHaveProperty('waitForFunction');
  });

  it('evaluate returns a Promise', () => {
    expectTypeOf<TablePage['evaluate']>().returns.toExtend<Promise<unknown>>();
  });

  it('waitForFunction returns a Promise', () => {
    expectTypeOf<TablePage['waitForFunction']>().returns.toExtend<Promise<unknown>>();
  });
});
