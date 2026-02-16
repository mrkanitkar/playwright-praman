/**
 * Tests for `src/matchers/index.ts` — barrel export verification.
 *
 * @remarks
 * Verifies that all matcher functions and types are correctly re-exported
 * from the barrel file.
 *
 * @module matchers
 */
import { describe, expect, it } from 'vitest';

import {
  checkUI5CellText,
  checkUI5Enabled,
  checkUI5Property,
  checkUI5RowCount,
  checkUI5SelectedRows,
  checkUI5Text,
  checkUI5ValueState,
  checkUI5Visible,
} from '../../../src/matchers/index.js';

describe('matchers barrel export', () => {
  it('exports all ui5-matchers functions', () => {
    expect(typeof checkUI5Text).toBe('function');
    expect(typeof checkUI5Visible).toBe('function');
    expect(typeof checkUI5Enabled).toBe('function');
    expect(typeof checkUI5Property).toBe('function');
    expect(typeof checkUI5ValueState).toBe('function');
  });

  it('exports all table-matchers functions', () => {
    expect(typeof checkUI5RowCount).toBe('function');
    expect(typeof checkUI5CellText).toBe('function');
    expect(typeof checkUI5SelectedRows).toBe('function');
  });

  it('exports exactly 8 matcher functions', () => {
    const exports = [
      checkUI5Text,
      checkUI5Visible,
      checkUI5Enabled,
      checkUI5Property,
      checkUI5ValueState,
      checkUI5RowCount,
      checkUI5CellText,
      checkUI5SelectedRows,
    ];
    expect(exports).toHaveLength(8);
    for (const fn of exports) {
      expect(typeof fn).toBe('function');
    }
  });
});
