/**
 * Type-level tests for `src/core/types/controls.ts`.
 *
 * @remarks
 * Verifies UI5ControlBase, discriminated union narrowing, UI5ControlMap
 * type lookups, and literal union types for control categories.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type {
  ContainerControlType,
  InteractiveControlType,
  UI5Button,
  UI5Control,
  UI5ControlBase,
  UI5ControlMap,
  UI5Dialog,
  UI5Input,
  UI5Table,
} from '#core/types/controls.js';

describe('UI5ControlBase', () => {
  it('has required base fields', () => {
    expectTypeOf<UI5ControlBase>().toHaveProperty('controlType');
    expectTypeOf<UI5ControlBase>().toHaveProperty('id');
  });

  it('has base methods returning promises', () => {
    expectTypeOf<UI5ControlBase['getId']>().returns.toExtend<Promise<string>>();
    expectTypeOf<UI5ControlBase['isVisible']>().returns.toExtend<Promise<boolean>>();
    expectTypeOf<UI5ControlBase['getProperty']>().returns.toExtend<Promise<unknown>>();
  });
});

describe('UI5Control discriminated union', () => {
  it('narrows to UI5Button via controlType', () => {
    const control = {} as UI5Control;
    if (control.controlType === 'sap.m.Button') {
      expectTypeOf(control).toExtend<UI5Button>();
    }
  });

  it('narrows to UI5Input via controlType', () => {
    const control = {} as UI5Control;
    if (control.controlType === 'sap.m.Input') {
      expectTypeOf(control).toExtend<UI5Input>();
    }
  });

  it('narrows to UI5Table via controlType', () => {
    const control = {} as UI5Control;
    if (control.controlType === 'sap.m.Table') {
      expectTypeOf(control).toExtend<UI5Table>();
    }
  });

  it('narrows to UI5Dialog via controlType', () => {
    const control = {} as UI5Control;
    if (control.controlType === 'sap.m.Dialog') {
      expectTypeOf(control).toExtend<UI5Dialog>();
    }
  });
});

describe('UI5ControlMap', () => {
  it('maps sap.m.Button to UI5Button', () => {
    expectTypeOf<UI5ControlMap['sap.m.Button']>().toEqualTypeOf<UI5Button>();
  });

  it('maps sap.m.Input to UI5Input', () => {
    expectTypeOf<UI5ControlMap['sap.m.Input']>().toEqualTypeOf<UI5Input>();
  });

  it('maps sap.m.Table to UI5Table', () => {
    expectTypeOf<UI5ControlMap['sap.m.Table']>().toEqualTypeOf<UI5Table>();
  });
});

describe('InteractiveControlType', () => {
  it('accepts known interactive control types', () => {
    expectTypeOf<'sap.m.Button'>().toExtend<InteractiveControlType>();
    expectTypeOf<'sap.m.Input'>().toExtend<InteractiveControlType>();
    expectTypeOf<'sap.m.CheckBox'>().toExtend<InteractiveControlType>();
  });

  it('rejects non-interactive control types', () => {
    expectTypeOf<'sap.m.Text'>().not.toExtend<InteractiveControlType>();
    expectTypeOf<'sap.m.Label'>().not.toExtend<InteractiveControlType>();
  });
});

describe('ContainerControlType', () => {
  it('accepts known container control types', () => {
    expectTypeOf<'sap.m.Page'>().toExtend<ContainerControlType>();
    expectTypeOf<'sap.m.Dialog'>().toExtend<ContainerControlType>();
    expectTypeOf<'sap.m.Table'>().toExtend<ContainerControlType>();
  });

  it('rejects non-container control types', () => {
    expectTypeOf<'sap.m.Button'>().not.toExtend<ContainerControlType>();
    expectTypeOf<'sap.m.Input'>().not.toExtend<ContainerControlType>();
  });
});
