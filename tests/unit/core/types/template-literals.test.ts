/**
 * Type-level tests for template literal types in `src/core/types/index.ts`.
 *
 * @remarks
 * Verifies that valid strings match each template literal type and that
 * invalid strings are correctly rejected at the type level.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type {
  IntentString,
  ODataBindingPath,
  ODataEntityPath,
  UI5ControlTypeName,
} from '#core/types/index.js';

describe('ODataEntityPath type', () => {
  it('accepts paths starting with /', () => {
    const path: ODataEntityPath = '/Products';
    expectTypeOf(path).toExtend<ODataEntityPath>();
  });

  it('accepts paths with key predicates', () => {
    const path: ODataEntityPath = '/Products(1)/Name';
    expectTypeOf(path).toExtend<ODataEntityPath>();
  });

  it('accepts deeply nested paths', () => {
    const path: ODataEntityPath = '/SalesOrders(123)/Items(10)/Material';
    expectTypeOf(path).toExtend<ODataEntityPath>();
  });

  it('rejects strings not starting with /', () => {
    expectTypeOf<'Products'>().not.toExtend<ODataEntityPath>();
  });

  it('rejects empty strings', () => {
    expectTypeOf<''>().not.toExtend<ODataEntityPath>();
  });
});

describe('ODataBindingPath type', () => {
  it('accepts absolute paths starting with /', () => {
    const path: ODataBindingPath = '/Products(1)/Name';
    expectTypeOf(path).toExtend<ODataBindingPath>();
  });

  it('accepts binding expression syntax with curly braces', () => {
    const path: ODataBindingPath = '{myModel>/Products}';
    expectTypeOf(path).toExtend<ODataBindingPath>();
  });

  it('accepts simple binding expressions', () => {
    const path: ODataBindingPath = '{/Products}';
    expectTypeOf(path).toExtend<ODataBindingPath>();
  });

  it('rejects plain strings without / or { prefix', () => {
    expectTypeOf<'Products'>().not.toExtend<ODataBindingPath>();
  });
});

describe('IntentString type', () => {
  it('accepts SemanticObject-action format', () => {
    const intent: IntentString = 'PurchaseOrder-manage';
    expectTypeOf(intent).toExtend<IntentString>();
  });

  it('accepts Shell-home format', () => {
    const intent: IntentString = 'Shell-home';
    expectTypeOf(intent).toExtend<IntentString>();
  });

  it('accepts multi-word semantic objects with action', () => {
    const intent: IntentString = 'GoodsMovement-post';
    expectTypeOf(intent).toExtend<IntentString>();
  });

  it('rejects strings without a hyphen', () => {
    expectTypeOf<'PurchaseOrder'>().not.toExtend<IntentString>();
  });

  it('rejects empty strings', () => {
    expectTypeOf<''>().not.toExtend<IntentString>();
  });
});

describe('UI5ControlTypeName type', () => {
  it('accepts sap.m.Button', () => {
    const name: UI5ControlTypeName = 'sap.m.Button';
    expectTypeOf(name).toExtend<UI5ControlTypeName>();
  });

  it('accepts sap.ui.core.Control', () => {
    const name: UI5ControlTypeName = 'sap.ui.core.Control';
    expectTypeOf(name).toExtend<UI5ControlTypeName>();
  });

  it('accepts deeply nested namespaces', () => {
    const name: UI5ControlTypeName = 'sap.ui.comp.smartfield.SmartField';
    expectTypeOf(name).toExtend<UI5ControlTypeName>();
  });

  it('rejects strings not starting with sap.', () => {
    expectTypeOf<'m.Button'>().not.toExtend<UI5ControlTypeName>();
  });

  it('rejects empty strings', () => {
    expectTypeOf<''>().not.toExtend<UI5ControlTypeName>();
  });

  it('rejects strings with wrong prefix', () => {
    expectTypeOf<'custom.Button'>().not.toExtend<UI5ControlTypeName>();
  });
});

describe('template literal type relationships', () => {
  it('ODataEntityPath is a subtype of ODataBindingPath', () => {
    expectTypeOf<ODataEntityPath>().toExtend<ODataBindingPath>();
  });

  it('ODataBindingPath is NOT a subtype of ODataEntityPath (binding expressions)', () => {
    expectTypeOf<ODataBindingPath>().not.toExtend<ODataEntityPath>();
  });

  it('IntentString extends string', () => {
    expectTypeOf<IntentString>().toExtend<string>();
  });

  it('UI5ControlTypeName extends string', () => {
    expectTypeOf<UI5ControlTypeName>().toExtend<string>();
  });

  it('plain string does not extend UI5ControlTypeName', () => {
    expectTypeOf<string>().not.toExtend<UI5ControlTypeName>();
  });

  it('plain string does not extend ODataEntityPath', () => {
    expectTypeOf<string>().not.toExtend<ODataEntityPath>();
  });

  it('plain string does not extend IntentString', () => {
    expectTypeOf<string>().not.toExtend<IntentString>();
  });
});
