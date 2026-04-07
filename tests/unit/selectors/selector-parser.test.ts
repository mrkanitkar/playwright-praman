/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/selectors/selector-parser.ts`.
 *
 * @remarks
 * Covers parsing, serialization, validation, and type-guard for UI5 selector strings.
 */
import { describe, expect, it } from 'vitest';

import {
  isUI5SelectorString,
  parseUI5Selector,
  serializeUI5Selector,
  serializeUI5SelectorToCSS,
  validateUI5Selector,
} from '../../../src/selectors/selector-parser.js';

import { ErrorCode } from '#core/errors/codes.js';
import { SelectorError } from '#core/errors/selector-error.js';
import type { UI5Selector } from '#core/types/selectors.js';

describe('parseUI5Selector', () => {
  it('parses controlType only', () => {
    const result = parseUI5Selector('ui5=sap.m.Button');
    expect(result.controlType).toBe('sap.m.Button');
    expect(result.id).toBeUndefined();
    expect(result.properties).toBeUndefined();
  });

  it('parses ID only', () => {
    const result = parseUI5Selector('ui5=#myId');
    expect(result.id).toBe('myId');
    expect(result.controlType).toBeUndefined();
  });

  it('parses controlType + ID', () => {
    const result = parseUI5Selector('ui5=sap.m.Button#saveBtn');
    expect(result.controlType).toBe('sap.m.Button');
    expect(result.id).toBe('saveBtn');
  });

  it('parses single property', () => {
    const result = parseUI5Selector('ui5=sap.m.Input[placeholder=Name]');
    expect(result.controlType).toBe('sap.m.Input');
    expect(result.properties).toEqual({ placeholder: 'Name' });
  });

  it('parses multiple properties', () => {
    const result = parseUI5Selector('ui5=sap.m.Button[text=Save][enabled=true]');
    expect(result.controlType).toBe('sap.m.Button');
    expect(result.properties).toEqual({ text: 'Save', enabled: true });
  });

  it('coerces boolean true', () => {
    const result = parseUI5Selector('ui5=sap.m.Button[enabled=true]');
    expect(result.properties).toEqual({ enabled: true });
  });

  it('coerces boolean false', () => {
    const result = parseUI5Selector('ui5=sap.m.Button[visible=false]');
    expect(result.properties).toEqual({ visible: false });
  });

  it('handles = in property value by splitting on first =', () => {
    const result = parseUI5Selector('ui5=sap.m.Link[href=https://sap.com]');
    expect(result.controlType).toBe('sap.m.Link');
    expect(result.properties).toEqual({ href: 'https://sap.com' });
  });

  it('handles empty property value', () => {
    const result = parseUI5Selector('ui5=sap.m.Input[placeholder=]');
    expect(result.controlType).toBe('sap.m.Input');
    expect(result.properties).toEqual({ placeholder: '' });
  });

  it('handles escaped ] in property value', () => {
    const result = parseUI5Selector('ui5=sap.m.Input[text=foo\\]bar]');
    expect(result.controlType).toBe('sap.m.Input');
    expect(result.properties).toEqual({ text: 'foo]bar' });
  });

  it('handles escaped [ in property value', () => {
    const result = parseUI5Selector('ui5=sap.m.Input[text=foo\\[bar]');
    expect(result.controlType).toBe('sap.m.Input');
    expect(result.properties).toEqual({ text: 'foo[bar' });
  });

  it('handles multiple escaped brackets in property value', () => {
    const result = parseUI5Selector('ui5=sap.m.Input[text=a\\]b\\[c]');
    expect(result.controlType).toBe('sap.m.Input');
    expect(result.properties).toEqual({ text: 'a]b[c' });
  });

  it('round-trips property value containing brackets', () => {
    const selector = parseUI5Selector('ui5=sap.m.Input[text=foo\\]bar]');
    const serialized = serializeUI5Selector(selector);
    const reparsed = parseUI5Selector(serialized);
    expect(reparsed.properties).toEqual({ text: 'foo]bar' });
  });

  it('throws SelectorError on empty string', () => {
    expect(() => parseUI5Selector('')).toThrow(SelectorError);
    try {
      parseUI5Selector('');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(SelectorError);
      expect((error as SelectorError).code).toBe(ErrorCode.ERR_SELECTOR_PARSE);
    }
  });

  it('throws SelectorError on missing prefix', () => {
    expect(() => parseUI5Selector('sap.m.Button')).toThrow(SelectorError);
    try {
      parseUI5Selector('sap.m.Button');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(SelectorError);
      expect((error as SelectorError).code).toBe(ErrorCode.ERR_SELECTOR_PARSE);
    }
  });

  it('throws SelectorError on empty content after prefix', () => {
    expect(() => parseUI5Selector('ui5=')).toThrow(SelectorError);
    try {
      parseUI5Selector('ui5=');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(SelectorError);
      expect((error as SelectorError).code).toBe(ErrorCode.ERR_SELECTOR_INVALID);
    }
  });

  it('throws SelectorError on oversized selector', () => {
    const oversized = `ui5=${'a'.repeat(10_001)}`;
    expect(() => parseUI5Selector(oversized)).toThrow(SelectorError);
    try {
      parseUI5Selector(oversized);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(SelectorError);
      expect((error as SelectorError).code).toBe(ErrorCode.ERR_SELECTOR_PARSE);
    }
  });
});

describe('serializeUI5Selector', () => {
  it('serializes controlType only', () => {
    const selector: UI5Selector = { controlType: 'sap.m.Button' };
    expect(serializeUI5Selector(selector)).toBe('ui5=sap.m.Button');
  });

  it('serializes with ID', () => {
    const selector: UI5Selector = { controlType: 'sap.m.Button', id: 'btn1' };
    expect(serializeUI5Selector(selector)).toBe('ui5=sap.m.Button#btn1');
  });

  it('serializes with properties', () => {
    const selector: UI5Selector = {
      controlType: 'sap.m.Button',
      properties: { text: 'Save', enabled: true },
    };
    const result = serializeUI5Selector(selector);
    expect(result).toContain('ui5=sap.m.Button');
    expect(result).toContain('[text=Save]');
    expect(result).toContain('[enabled=true]');
  });

  it('round-trips: parse then serialize produces equivalent output', () => {
    const original = 'ui5=sap.m.Button#saveBtn[text=Save][enabled=true]';
    const parsed = parseUI5Selector(original);
    const serialized = serializeUI5Selector(parsed);
    expect(serialized).toBe(original);
  });

  it('escapes brackets in property values during serialization', () => {
    const selector: UI5Selector = {
      controlType: 'sap.m.Input',
      properties: { text: 'foo]bar' },
    };
    expect(serializeUI5Selector(selector)).toBe('ui5=sap.m.Input[text=foo\\]bar]');
  });
});

describe('validateUI5Selector', () => {
  it('returns empty array for a valid selector', () => {
    const selector: UI5Selector = { controlType: 'sap.m.Button', id: 'btn1' };
    const errors = validateUI5Selector(selector);
    expect(errors).toEqual([]);
  });

  it('returns error when all fields are missing', () => {
    const selector: UI5Selector = {};
    const errors = validateUI5Selector(selector);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('at least one');
  });

  it('returns error for invalid controlType format', () => {
    const selector: UI5Selector = { controlType: 'Button' };
    const errors = validateUI5Selector(selector);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('controlType');
  });
});

describe('isUI5SelectorString', () => {
  it('returns true for valid ui5= prefixed string', () => {
    expect(isUI5SelectorString('ui5=sap.m.Button')).toBe(true);
  });

  it('returns false for string without prefix', () => {
    expect(isUI5SelectorString('sap.m.Button')).toBe(false);
  });
});

// ── serializeUI5SelectorToCSS ──────────────────────────────────────────

describe('serializeUI5SelectorToCSS', () => {
  it('serializes controlType as :type() pseudo-class', () => {
    expect(serializeUI5SelectorToCSS({ controlType: 'sap.m.Button' })).toBe(':type(sap.m.Button)');
  });

  it('serializes id with # prefix', () => {
    expect(serializeUI5SelectorToCSS({ id: 'saveBtn' })).toBe('#saveBtn');
  });

  it('serializes RegExp id using .source', () => {
    expect(serializeUI5SelectorToCSS({ id: /^submit/i })).toBe('#^submit');
  });

  it('serializes controlType + id together', () => {
    expect(serializeUI5SelectorToCSS({ controlType: 'sap.m.Button', id: 'btn1' })).toBe(
      ':type(sap.m.Button)#btn1',
    );
  });

  it('serializes matchSubclasses as :subclass', () => {
    expect(serializeUI5SelectorToCSS({ controlType: 'sap.m.Button', matchSubclasses: true })).toBe(
      ':type(sap.m.Button):subclass',
    );
  });

  it('omits :subclass when matchSubclasses is false', () => {
    expect(serializeUI5SelectorToCSS({ controlType: 'sap.m.Button', matchSubclasses: false })).toBe(
      ':type(sap.m.Button)',
    );
  });

  it('serializes string property as :prop()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Button',
        properties: { text: 'Save' },
      }),
    ).toBe(':type(sap.m.Button):prop(text, "Save")');
  });

  it('serializes numeric property as :prop()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Input',
        properties: { maxLength: 100 },
      }),
    ).toBe(':type(sap.m.Input):prop(maxLength, "100")');
  });

  it('serializes boolean property as :prop()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Button',
        properties: { enabled: true },
      }),
    ).toBe(':type(sap.m.Button):prop(enabled, "true")');
  });

  it('serializes RegExp property as :prop-regex()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Input',
        properties: { value: /^test/ },
      }),
    ).toBe(':type(sap.m.Input):prop-regex(value, "^test")');
  });

  it('serializes PropertyMatcher with equals operator as :prop()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Button',
        properties: { text: { value: 'Save', operator: 'equals' } },
      }),
    ).toBe(':type(sap.m.Button):prop(text, "Save")');
  });

  it('serializes PropertyMatcher with contains operator as :prop-contains()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Input',
        properties: { value: { value: 'partial', operator: 'contains' } },
      }),
    ).toBe(':type(sap.m.Input):prop-contains(value, "partial")');
  });

  it('serializes PropertyMatcher with startsWith operator', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Input',
        properties: { value: { value: 'prefix', operator: 'startsWith' } },
      }),
    ).toBe(':type(sap.m.Input):prop-starts-with(value, "prefix")');
  });

  it('serializes PropertyMatcher with endsWith operator', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Input',
        properties: { value: { value: 'suffix', operator: 'endsWith' } },
      }),
    ).toBe(':type(sap.m.Input):prop-ends-with(value, "suffix")');
  });

  it('serializes PropertyMatcher with regex operator', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Input',
        properties: { value: { value: '^test$', operator: 'regex' } },
      }),
    ).toBe(':type(sap.m.Input):prop-regex(value, "^test$")');
  });

  it('serializes PropertyMatcher without operator via operatorToPseudo default', () => {
    // When operator is present, isPropertyMatcherObject matches and operatorToPseudo is used
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Button',
        properties: { text: { value: 'OK', operator: 'equals' } },
      }),
    ).toBe(':type(sap.m.Button):prop(text, "OK")');
  });

  it('serializes viewName as :view()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Button',
        viewName: 'myApp.view.Main',
      }),
    ).toBe(':type(sap.m.Button):view(myApp.view.Main)');
  });

  it('serializes bindingPath entries as :binding()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Text',
        bindingPath: { text: '/ProductName' },
      }),
    ).toBe(':type(sap.m.Text):binding(text, "/ProductName")');
  });

  it('serializes i18NText entries as :i18n()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Button',
        i18NText: { text: 'SAVE_BUTTON' },
      }),
    ).toBe(':type(sap.m.Button):i18n(text, "SAVE_BUTTON")');
  });

  it('serializes ancestor recursively as :ancestor()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Button',
        ancestor: { controlType: 'sap.m.Panel' },
      }),
    ).toBe(':type(sap.m.Button):ancestor(:type(sap.m.Panel))');
  });

  it('serializes descendant recursively as :descendant()', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Panel',
        descendant: { controlType: 'sap.m.Button', properties: { text: 'OK' } },
      }),
    ).toBe(':type(sap.m.Panel):descendant(:type(sap.m.Button):prop(text, "OK"))');
  });

  it('serializes searchOpenDialogs as :open-dialog', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Button',
        searchOpenDialogs: true,
      }),
    ).toBe(':type(sap.m.Button):open-dialog');
  });

  it('omits :open-dialog when searchOpenDialogs is false', () => {
    expect(
      serializeUI5SelectorToCSS({
        controlType: 'sap.m.Button',
        searchOpenDialogs: false,
      }),
    ).toBe(':type(sap.m.Button)');
  });

  it('serializes a complex selector with all fields', () => {
    const result = serializeUI5SelectorToCSS({
      controlType: 'sap.m.Button',
      id: 'confirmBtn',
      matchSubclasses: true,
      properties: { text: 'Confirm', enabled: true },
      viewName: 'myApp.view.Detail',
      bindingPath: { text: '/ConfirmLabel' },
      i18NText: { tooltip: 'CONFIRM_TOOLTIP' },
      ancestor: { controlType: 'sap.m.Dialog' },
      descendant: { controlType: 'sap.ui.core.Icon' },
      searchOpenDialogs: true,
    });

    expect(result).toBe(
      ':type(sap.m.Button)#confirmBtn:subclass' +
        ':prop(text, "Confirm"):prop(enabled, "true")' +
        ':view(myApp.view.Detail)' +
        ':binding(text, "/ConfirmLabel")' +
        ':i18n(tooltip, "CONFIRM_TOOLTIP")' +
        ':ancestor(:type(sap.m.Dialog))' +
        ':descendant(:type(sap.ui.core.Icon))' +
        ':open-dialog',
    );
  });

  it('returns empty string for empty selector', () => {
    expect(serializeUI5SelectorToCSS({})).toBe('');
  });

  it('serializes multiple properties in order', () => {
    const result = serializeUI5SelectorToCSS({
      properties: { text: 'A', enabled: true, visible: false },
    });
    expect(result).toContain(':prop(text, "A")');
    expect(result).toContain(':prop(enabled, "true")');
    expect(result).toContain(':prop(visible, "false")');
  });

  it('serializes multiple binding paths', () => {
    const result = serializeUI5SelectorToCSS({
      bindingPath: { text: '/Name', value: '/Value' },
    });
    expect(result).toContain(':binding(text, "/Name")');
    expect(result).toContain(':binding(value, "/Value")');
  });
});

// ── Additional edge cases for existing functions ───────────────────────

describe('serializeUI5Selector — edge cases', () => {
  it('serializes RegExp id using .source', () => {
    expect(serializeUI5Selector({ controlType: 'sap.m.Button', id: /^save/ })).toBe(
      'ui5=sap.m.Button#^save',
    );
  });

  it('serializes RegExp property value using .source', () => {
    expect(
      serializeUI5Selector({
        controlType: 'sap.m.Input',
        properties: { value: /test\d+/ },
      }),
    ).toContain('[value=test\\d+]');
  });
});

describe('validateUI5Selector — edge cases', () => {
  it('returns error for empty string id', () => {
    const errors = validateUI5Selector({ id: '' });
    expect(errors.length).toBeGreaterThan(0);
    expect(errors).toContain('id must not be an empty string');
  });

  it('accepts RegExp id without error', () => {
    const errors = validateUI5Selector({ id: /^submit/ });
    expect(errors).toEqual([]);
  });

  it('accepts properties-only selector', () => {
    const errors = validateUI5Selector({ properties: { text: 'Save' } });
    expect(errors).toEqual([]);
  });
});

describe('parseUI5Selector — edge cases', () => {
  it('coerces numeric string to number', () => {
    const result = parseUI5Selector('ui5=sap.m.Input[maxLength=42]');
    expect(result.properties).toEqual({ maxLength: 42 });
  });

  it('does not coerce non-round-tripping numeric string', () => {
    const result = parseUI5Selector('ui5=sap.m.Input[value=007]');
    expect(result.properties).toEqual({ value: '007' });
  });

  it('handles property block with no = sign', () => {
    const result = parseUI5Selector('ui5=sap.m.Button[noequals]');
    // No key=value pair, so no properties extracted
    expect(result.properties).toBeUndefined();
  });

  it('handles property block with empty key', () => {
    const result = parseUI5Selector('ui5=sap.m.Button[=value]');
    // Empty key should be skipped
    expect(result.properties).toBeUndefined();
  });

  it('parses id-only with properties', () => {
    const result = parseUI5Selector('ui5=#myId[text=Save]');
    expect(result.id).toBe('myId');
    expect(result.properties).toEqual({ text: 'Save' });
    expect(result.controlType).toBeUndefined();
  });
});
