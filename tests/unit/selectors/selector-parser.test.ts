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
