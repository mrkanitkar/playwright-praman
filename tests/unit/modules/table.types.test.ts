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
  SmartTableInfo,
  StandardTableInfo,
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
  it('is a discriminated union of StandardTableInfo and SmartTableInfo', () => {
    expectTypeOf<TableInfo>().toEqualTypeOf<StandardTableInfo | SmartTableInfo>();
  });

  it('has required fields variant, effectiveId, and kind', () => {
    expectTypeOf<TableInfo>().toHaveProperty('variant');
    expectTypeOf<TableInfo>().toHaveProperty('effectiveId');
    expectTypeOf<TableInfo>().toHaveProperty('kind');
  });

  it('variant field is typed as TableVariant', () => {
    expectTypeOf<TableInfo['variant']>().toEqualTypeOf<TableVariant>();
  });

  it('effectiveId field is typed as string', () => {
    expectTypeOf<TableInfo['effectiveId']>().toEqualTypeOf<string>();
  });

  it('kind field is a union of standard and smart', () => {
    expectTypeOf<TableInfo['kind']>().toEqualTypeOf<'standard' | 'smart'>();
  });
});

describe('StandardTableInfo', () => {
  it('has kind discriminant set to standard', () => {
    expectTypeOf<StandardTableInfo['kind']>().toEqualTypeOf<'standard'>();
  });

  it('has variant typed as TableVariant', () => {
    expectTypeOf<StandardTableInfo['variant']>().toEqualTypeOf<TableVariant>();
  });

  it('has effectiveId typed as string', () => {
    expectTypeOf<StandardTableInfo['effectiveId']>().toEqualTypeOf<string>();
  });

  it('does not have a smartTableId property', () => {
    expectTypeOf<StandardTableInfo>().not.toHaveProperty('smartTableId');
  });

  it('extends TableInfo', () => {
    expectTypeOf<StandardTableInfo>().toExtend<TableInfo>();
  });
});

describe('SmartTableInfo', () => {
  it('has kind discriminant set to smart', () => {
    expectTypeOf<SmartTableInfo['kind']>().toEqualTypeOf<'smart'>();
  });

  it('has variant typed as TableVariant', () => {
    expectTypeOf<SmartTableInfo['variant']>().toEqualTypeOf<TableVariant>();
  });

  it('has effectiveId typed as string', () => {
    expectTypeOf<SmartTableInfo['effectiveId']>().toEqualTypeOf<string>();
  });

  it('has smartTableId typed as string (required)', () => {
    expectTypeOf<SmartTableInfo['smartTableId']>().toEqualTypeOf<string>();
  });

  it('extends TableInfo', () => {
    expectTypeOf<SmartTableInfo>().toExtend<TableInfo>();
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
