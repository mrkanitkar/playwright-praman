/**
 * Tests for `src/core/telemetry/spans.ts` — span name and attribute helpers.
 *
 * @remarks
 * Verifies `createSpanName` formatting and `spanAttributes` extraction
 * from UI5Selector objects, including edge cases like undefined selectors,
 * partial selectors, and RegExp id fields.
 */
import { describe, expect, it } from 'vitest';

import { createSpanName, spanAttributes } from '#core/telemetry/spans.js';

describe('createSpanName', () => {
  it('formats correctly with module and operation', () => {
    const result = createSpanName('config', 'load');

    expect(result).toBe('praman.config.load');
  });

  it('formats correctly with different module and operation', () => {
    const result = createSpanName('selector', 'parse');

    expect(result).toBe('praman.selector.parse');
  });
});

describe('spanAttributes', () => {
  it('extracts all attributes from a full selector', () => {
    const result = spanAttributes({
      controlType: 'sap.m.Button',
      id: 'btn1',
      viewName: 'Main',
    });

    expect(result).toEqual({
      'ui5.controlType': 'sap.m.Button',
      'ui5.id': 'btn1',
      'ui5.viewName': 'Main',
    });
  });

  it('returns empty object for empty selector', () => {
    const result = spanAttributes({});

    expect(result).toEqual({});
  });

  it('returns empty object for undefined selector', () => {
    const result = spanAttributes();

    expect(result).toEqual({});
  });

  it('skips undefined fields in partial selector', () => {
    const result = spanAttributes({
      controlType: 'sap.m.Button',
    });

    expect(result).toEqual({
      'ui5.controlType': 'sap.m.Button',
    });
    expect(result).not.toHaveProperty('ui5.id');
    expect(result).not.toHaveProperty('ui5.viewName');
  });

  it('handles RegExp id by converting to string', () => {
    const result = spanAttributes({
      id: /btn\d+/,
    });

    expect(result).toEqual({
      'ui5.id': '/btn\\d+/',
    });
  });
});
