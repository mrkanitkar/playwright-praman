/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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
  UI5FSemanticPage,
  UI5Input,
  UI5MdcFilterField,
  UI5SmartChart,
  UI5Table,
  UI5VariantManagement,
} from '#core/types/controls.js';

describe('UI5ControlBase', () => {
  it('has required base fields', () => {
    expectTypeOf<UI5ControlBase>().toHaveProperty('controlType');
    expectTypeOf<UI5ControlBase>().toHaveProperty('id');
  });

  it('has base methods returning promises', () => {
    expectTypeOf<UI5ControlBase['getId']>().returns.toExtend<Promise<string>>();
    expectTypeOf<UI5ControlBase['getVisible']>().returns.toExtend<Promise<boolean>>();
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

  it('narrows to UI5VariantManagement via controlType', () => {
    const control = {} as UI5Control;
    if (control.controlType === 'sap.m.VariantManagement') {
      expectTypeOf(control).toExtend<UI5VariantManagement>();
    }
  });

  it('narrows to UI5SmartChart via controlType', () => {
    const control = {} as UI5Control;
    if (control.controlType === 'sap.ui.comp.smartchart.SmartChart') {
      expectTypeOf(control).toExtend<UI5SmartChart>();
    }
  });

  it('narrows to UI5MdcFilterField via controlType', () => {
    const control = {} as UI5Control;
    if (control.controlType === 'sap.ui.mdc.FilterField') {
      expectTypeOf(control).toExtend<UI5MdcFilterField>();
    }
  });

  it('narrows to UI5FSemanticPage via controlType', () => {
    const control = {} as UI5Control;
    if (control.controlType === 'sap.f.semantic.SemanticPage') {
      expectTypeOf(control).toExtend<UI5FSemanticPage>();
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

  it('maps gap expansion controls correctly', () => {
    expectTypeOf<UI5ControlMap['sap.m.VariantManagement']>().toEqualTypeOf<UI5VariantManagement>();
    expectTypeOf<
      UI5ControlMap['sap.ui.comp.smartchart.SmartChart']
    >().toEqualTypeOf<UI5SmartChart>();
    expectTypeOf<UI5ControlMap['sap.ui.mdc.FilterField']>().toEqualTypeOf<UI5MdcFilterField>();
    expectTypeOf<UI5ControlMap['sap.f.semantic.SemanticPage']>().toEqualTypeOf<UI5FSemanticPage>();
  });
});

describe('InteractiveControlType', () => {
  it('accepts known interactive control types', () => {
    expectTypeOf<'sap.m.Button'>().toExtend<InteractiveControlType>();
    expectTypeOf<'sap.m.Input'>().toExtend<InteractiveControlType>();
    expectTypeOf<'sap.m.CheckBox'>().toExtend<InteractiveControlType>();
  });

  it('accepts gap expansion interactive controls', () => {
    expectTypeOf<'sap.m.VariantManagement'>().toExtend<InteractiveControlType>();
    expectTypeOf<'sap.m.DynamicDateRange'>().toExtend<InteractiveControlType>();
    expectTypeOf<'sap.ui.mdc.FilterField'>().toExtend<InteractiveControlType>();
  });

  it('rejects non-interactive control types', () => {
    expectTypeOf<'sap.m.Text'>().not.toExtend<InteractiveControlType>();
    expectTypeOf<'sap.m.Label'>().not.toExtend<InteractiveControlType>();
    expectTypeOf<'sap.m.ToolbarSpacer'>().not.toExtend<InteractiveControlType>();
    expectTypeOf<'sap.m.IllustratedMessage'>().not.toExtend<InteractiveControlType>();
  });
});

describe('Generic control<K>() overload type inference', () => {
  it('narrows return type when controlType is a known literal', () => {
    // Simulates: ui5.control({ controlType: 'sap.m.Button' }) → UI5Button
    type Result = UI5ControlMap['sap.m.Button'];
    expectTypeOf<Result>().toExtend<UI5Button>();
    expectTypeOf<Result>().toExtend<UI5ControlBase>();
  });

  it('all map values extend UI5ControlBase', () => {
    // Every key in the map produces a type extending UI5ControlBase
    type AllValues = UI5ControlMap[keyof UI5ControlMap];
    expectTypeOf<AllValues>().toExtend<UI5ControlBase>();
  });

  it('selector controlType accepts known literals and arbitrary strings', () => {
    // Known literal narrows
    const known: keyof UI5ControlMap | (string & {}) = 'sap.m.Button';
    expectTypeOf(known).toExtend<string>();

    // Arbitrary string also accepted (backwards compat)
    const arbitrary: keyof UI5ControlMap | (string & {}) = 'sap.custom.MyControl';
    expectTypeOf(arbitrary).toExtend<string>();
  });
});

describe('ContainerControlType', () => {
  it('accepts known container control types', () => {
    expectTypeOf<'sap.m.Page'>().toExtend<ContainerControlType>();
    expectTypeOf<'sap.m.Dialog'>().toExtend<ContainerControlType>();
    expectTypeOf<'sap.m.Table'>().toExtend<ContainerControlType>();
  });

  it('accepts gap expansion container controls', () => {
    expectTypeOf<'sap.m.NotificationListGroup'>().toExtend<ContainerControlType>();
    expectTypeOf<'sap.f.semantic.SemanticPage'>().toExtend<ContainerControlType>();
    expectTypeOf<'sap.tnt.NavigationList'>().toExtend<ContainerControlType>();
  });

  it('rejects non-container control types', () => {
    expectTypeOf<'sap.m.Button'>().not.toExtend<ContainerControlType>();
    expectTypeOf<'sap.m.Input'>().not.toExtend<ContainerControlType>();
    expectTypeOf<'sap.m.ColorPalette'>().not.toExtend<ContainerControlType>();
    expectTypeOf<'sap.tnt.InfoLabel'>().not.toExtend<ContainerControlType>();
  });
});
