/**
 * TypeScript declaration augmentation for Praman custom matchers.
 *
 * @remarks
 * These matchers are registered via `expect.extend()` in `core-fixtures.ts`.
 * This file provides the type signatures so `expect(control).toHaveUI5Text('Save')`
 * compiles without TypeScript errors.
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('verify button text', async ({ ui5 }) => {
 *   const btn = await ui5.control({ id: 'saveBtn' });
 *   await expect(btn).toHaveUI5Text('Save');
 *   await expect(btn).toBeUI5Enabled();
 *   await expect(btn).toHaveUI5Property('type', 'Emphasized');
 * });
 * ```
 *
 * @module matchers
 */

declare module '@playwright/test' {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- R matches @playwright/test Matchers<R> generic parameter
  interface Matchers<R> {
    toHaveUI5Text(expected: string, options?: { timeout?: number }): Promise<R>;
    toBeUI5Visible(options?: { timeout?: number }): Promise<R>;
    toBeUI5Enabled(options?: { timeout?: number }): Promise<R>;
    toHaveUI5Property(
      property: string,
      expected: unknown,
      options?: { timeout?: number },
    ): Promise<R>;
    toHaveUI5ValueState(state: string, options?: { timeout?: number }): Promise<R>;
    toHaveUI5Binding(bindingPath: string, options?: { timeout?: number }): Promise<R>;
    toBeUI5ControlType(controlType: string, options?: { timeout?: number }): Promise<R>;
    toHaveUI5CellText(
      row: number,
      col: number,
      expected: string,
      options?: { timeout?: number },
    ): Promise<R>;
    toHaveUI5RowCount(expected: number, options?: { timeout?: number }): Promise<R>;
    toHaveUI5SelectedRows(expected: number[], options?: { timeout?: number }): Promise<R>;
  }
}
