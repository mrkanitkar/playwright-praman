/**
 * Type-level and runtime tests for `src/core/types/selectors.ts`.
 *
 * @remarks
 * Verifies UI5Selector interface structure, SerializedUI5Selector shape,
 * and RegExp round-trip serialization via `serializeSelectorForBrowser`
 * and `deserializeRegExpId`.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  SerializedUI5Selector,
  UI5Interaction,
  UI5Selector,
  UI5SelectorString,
} from '#core/types/selectors.js';
import { deserializeRegExpId, serializeSelectorForBrowser } from '#core/types/selectors.js';

describe('UI5Selector type', () => {
  it('accepts a minimal selector with controlType only', () => {
    const selector: UI5Selector = { controlType: 'sap.m.Button' };
    expectTypeOf(selector).toExtend<UI5Selector>();
  });

  it('accepts a full selector with all fields', () => {
    const selector: UI5Selector = {
      controlType: 'sap.m.Input',
      id: 'vendorInput',
      viewName: 'sap.demo.View1',
      viewId: 'container-demo---View1',
      properties: { value: 'test' },
      bindingPath: { value: '/Vendor/Name' },
      i18NText: { text: 'Vendor' },
      ancestor: { controlType: 'sap.m.Page' },
      descendant: { controlType: 'sap.ui.core.Icon' },
      interaction: { idSuffix: 'inner' },
      searchOpenDialogs: true,
    };
    expectTypeOf(selector).toExtend<UI5Selector>();
  });

  it('accepts RegExp as id field', () => {
    const selector: UI5Selector = { id: /^submit/i };
    expectTypeOf(selector).toExtend<UI5Selector>();
  });
});

describe('UI5Interaction type', () => {
  it('accepts idSuffix-based interaction', () => {
    const interaction: UI5Interaction = { idSuffix: 'arrow' };
    expectTypeOf(interaction).toExtend<UI5Interaction>();
  });

  it('accepts domChildWith-based interaction', () => {
    const interaction: UI5Interaction = {
      domChildWith: { 'data-sap-ui': 'true' },
    };
    expectTypeOf(interaction).toExtend<UI5Interaction>();
  });
});

describe('UI5SelectorString type', () => {
  it('accepts valid ui5= prefixed strings', () => {
    const str: UI5SelectorString = 'ui5=sap.m.Button#submitBtn[text=Save]';
    expectTypeOf(str).toExtend<UI5SelectorString>();
  });
});

describe('SerializedUI5Selector type', () => {
  it('accepts serialized RegExp id as object', () => {
    const serialized: SerializedUI5Selector = {
      controlType: 'sap.m.Button',
      id: { source: '^submit', flags: 'i' },
    };
    expectTypeOf(serialized).toExtend<SerializedUI5Selector>();
  });

  it('accepts string id', () => {
    const serialized: SerializedUI5Selector = {
      id: 'submitBtn',
    };
    expectTypeOf(serialized).toExtend<SerializedUI5Selector>();
  });
});

describe('serializeSelectorForBrowser', () => {
  it('serializes a selector with string id', () => {
    const selector: UI5Selector = {
      controlType: 'sap.m.Button',
      id: 'submitBtn',
    };
    const result = serializeSelectorForBrowser(selector);
    expect(result).toEqual({
      controlType: 'sap.m.Button',
      id: 'submitBtn',
    });
  });

  it('serializes a selector with RegExp id', () => {
    const selector: UI5Selector = {
      controlType: 'sap.m.Button',
      id: /^submit/i,
    };
    const result = serializeSelectorForBrowser(selector);
    expect(result).toEqual({
      controlType: 'sap.m.Button',
      id: { source: '^submit', flags: 'i' },
    });
  });

  it('omits undefined fields from serialized output', () => {
    const selector: UI5Selector = { controlType: 'sap.m.Button' };
    const result = serializeSelectorForBrowser(selector);
    expect(result).toEqual({ controlType: 'sap.m.Button' });
    expect(result).not.toHaveProperty('id');
    expect(result).not.toHaveProperty('viewName');
  });

  it('preserves searchOpenDialogs flag', () => {
    const selector: UI5Selector = {
      controlType: 'sap.m.Dialog',
      searchOpenDialogs: true,
    };
    const result = serializeSelectorForBrowser(selector);
    expect(result).toEqual({
      controlType: 'sap.m.Dialog',
      searchOpenDialogs: true,
    });
  });
});

describe('deserializeRegExpId', () => {
  it('returns string id unchanged', () => {
    const result = deserializeRegExpId('submitBtn');
    expect(result).toBe('submitBtn');
  });

  it('reconstructs RegExp from serialized object', () => {
    const result = deserializeRegExpId({ source: '^submit', flags: 'i' });
    expect(result).toBeInstanceOf(RegExp);
    expect((result as RegExp).source).toBe('^submit');
    expect((result as RegExp).flags).toBe('i');
  });

  it('round-trips RegExp through serialize/deserialize', () => {
    const original = /^vendor\d+$/gi;
    const serialized = serializeSelectorForBrowser({ id: original });
    const deserialized = deserializeRegExpId(serialized.id as { source: string; flags: string });
    expect(deserialized).toBeInstanceOf(RegExp);
    expect((deserialized as RegExp).source).toBe(original.source);
    expect((deserialized as RegExp).flags).toBe(original.flags);
  });
});
