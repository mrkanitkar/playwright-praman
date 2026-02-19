/**
 * Tests for `src/fixtures/fe-fixtures.ts` — Fiori Elements Playwright fixtures.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test` and FE module dependencies.
 * Fixture definitions are captured via `createMockTestExtend()` and executed
 * directly to verify behavior without requiring a Playwright test runner.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FioriElementsFixture } from '../../../src/fe/types.js';
import {
  createMockTestExtend,
  createMockExpectExtend,
} from '../../helpers/mock-playwright-test.js';

// ── Mock list-report module ─────────────────────────────────────────
const mockGetListReportTable = vi.fn().mockResolvedValue('tableId');
const mockGetFilterBar = vi.fn().mockResolvedValue('filterBarId');
const mockSetFilterBarField = vi.fn().mockResolvedValue(undefined);
const mockExecuteSearch = vi.fn().mockResolvedValue(undefined);
const mockClearFilterBar = vi.fn().mockResolvedValue(undefined);
const mockNavigateToItem = vi.fn().mockResolvedValue(undefined);
const mockGetAvailableVariants = vi.fn().mockResolvedValue(['Standard', 'Custom']);
const mockSelectVariant = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/fe/list-report.js', () => ({
  getListReportTable: mockGetListReportTable,
  getFilterBar: mockGetFilterBar,
  setFilterBarField: mockSetFilterBarField,
  executeSearch: mockExecuteSearch,
  clearFilterBar: mockClearFilterBar,
  navigateToItem: mockNavigateToItem,
  getAvailableVariants: mockGetAvailableVariants,
  selectVariant: mockSelectVariant,
}));

// ── Mock object-page module ─────────────────────────────────────────
const mockNavigateToSection = vi.fn().mockResolvedValue(undefined);
const mockGetSectionData = vi.fn().mockResolvedValue({ title: 'General' });
const mockClickObjectPageButton = vi.fn().mockResolvedValue(undefined);
const mockClickEditButton = vi.fn().mockResolvedValue(undefined);
const mockClickSaveButton = vi.fn().mockResolvedValue(undefined);
const mockGetObjectPageSections = vi.fn().mockResolvedValue([{ title: 'General', id: 'sec1' }]);
const mockGetHeaderTitle = vi.fn().mockResolvedValue('Product Details');
const mockIsInEditMode = vi.fn().mockResolvedValue(false);

vi.mock('../../../src/fe/object-page.js', () => ({
  navigateToSection: mockNavigateToSection,
  getSectionData: mockGetSectionData,
  clickObjectPageButton: mockClickObjectPageButton,
  clickEditButton: mockClickEditButton,
  clickSaveButton: mockClickSaveButton,
  getObjectPageSections: mockGetObjectPageSections,
  getHeaderTitle: mockGetHeaderTitle,
  isInEditMode: mockIsInEditMode,
}));

// ── Mock fe-table-helpers module ────────────────────────────────────
const mockFeGetTableRowCount = vi.fn().mockResolvedValue(5);
const mockFeGetCellValue = vi.fn().mockResolvedValue('CellValue');
const mockFeFindRowByValues = vi.fn().mockResolvedValue(2);
const mockFeClickRow = vi.fn().mockResolvedValue(undefined);
const mockFeGetColumnNames = vi.fn().mockResolvedValue(['Name', 'Status']);

vi.mock('../../../src/fe/fe-table-helpers.js', () => ({
  feGetTableRowCount: mockFeGetTableRowCount,
  feGetCellValue: mockFeGetCellValue,
  feFindRowByValues: mockFeFindRowByValues,
  feClickRow: mockFeClickRow,
  feGetColumnNames: mockFeGetColumnNames,
}));

// ── Mock fe-list-helpers module ─────────────────────────────────────
const mockFeGetListItemCount = vi.fn().mockResolvedValue(3);
const mockFeGetListItemTitle = vi.fn().mockResolvedValue('Item Title');
const mockFeFindListItemByTitle = vi.fn().mockResolvedValue(1);
const mockFeClickListItem = vi.fn().mockResolvedValue(undefined);
const mockFeSelectListItem = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/fe/fe-list-helpers.js', () => ({
  feGetListItemCount: mockFeGetListItemCount,
  feGetListItemTitle: mockFeGetListItemTitle,
  feFindListItemByTitle: mockFeFindListItemByTitle,
  feClickListItem: mockFeClickListItem,
  feSelectListItem: mockFeSelectListItem,
}));

// ── Mock Playwright ─────────────────────────────────────────────────
const mockTestExtend = createMockTestExtend();
const mockExpectExtend = createMockExpectExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
    step: vi.fn().mockImplementation(async (_title: string, fn: () => Promise<unknown>) => fn()),
  },
  expect: {
    extend: mockExpectExtend,
  },
}));

// ── Mock Playwright page ────────────────────────────────────────────
const mockPage = {
  evaluate: vi.fn().mockResolvedValue(undefined),
  waitForFunction: vi.fn().mockResolvedValue(undefined),
};

// ── Import after mocks ──────────────────────────────────────────────
const { feTest, createFEFixture } = await import('#fixtures/fe-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures['fe']);
 * ```
 */
function extractFixtureFn(definition: unknown): (...args: any[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: any[]) => Promise<void>;
  }
  return definition as (...args: any[]) => Promise<void>;
}

/**
 * Simulates Playwright's `use()` callback for fixture testing.
 *
 * @param fn - The fixture function to execute
 * @param deps - Dependencies to pass as the first argument
 * @returns The value passed to `use()`
 *
 * @example
 * ```typescript
 * const fe = await runFixture<FioriElementsFixture>(fixtureFn, { page: mockPage });
 * ```
 */
async function runFixture<T>(
  fn: (deps: Record<string, unknown>, use: (value: T) => Promise<void>) => Promise<void>,
  deps: Record<string, unknown>,
): Promise<T> {
  let captured: T | undefined;
  const useFn = async (value: T): Promise<void> => {
    captured = value;
    await Promise.resolve();
  };
  await fn(deps, useFn);
  return captured as T;
}

// ── Fixture definitions reference ───────────────────────────────────
const fixtures = (feTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Reset helper ────────────────────────────────────────────────────

/**
 * Resets all mock defaults between tests.
 *
 * @example
 * ```typescript
 * beforeEach(() => { resetAllMockDefaults(); });
 * ```
 */
function resetAllMockDefaults(): void {
  vi.clearAllMocks();
  mockGetListReportTable.mockResolvedValue('tableId');
  mockGetFilterBar.mockResolvedValue('filterBarId');
  mockSetFilterBarField.mockResolvedValue(undefined);
  mockExecuteSearch.mockResolvedValue(undefined);
  mockClearFilterBar.mockResolvedValue(undefined);
  mockNavigateToItem.mockResolvedValue(undefined);
  mockGetAvailableVariants.mockResolvedValue(['Standard', 'Custom']);
  mockSelectVariant.mockResolvedValue(undefined);
  mockNavigateToSection.mockResolvedValue(undefined);
  mockGetSectionData.mockResolvedValue({ title: 'General' });
  mockClickObjectPageButton.mockResolvedValue(undefined);
  mockClickEditButton.mockResolvedValue(undefined);
  mockClickSaveButton.mockResolvedValue(undefined);
  mockGetObjectPageSections.mockResolvedValue([{ title: 'General', id: 'sec1' }]);
  mockGetHeaderTitle.mockResolvedValue('Product Details');
  mockIsInEditMode.mockResolvedValue(false);
  mockFeGetTableRowCount.mockResolvedValue(5);
  mockFeGetCellValue.mockResolvedValue('CellValue');
  mockFeFindRowByValues.mockResolvedValue(2);
  mockFeClickRow.mockResolvedValue(undefined);
  mockFeGetColumnNames.mockResolvedValue(['Name', 'Status']);
  mockFeGetListItemCount.mockResolvedValue(3);
  mockFeGetListItemTitle.mockResolvedValue('Item Title');
  mockFeFindListItemByTitle.mockResolvedValue(1);
  mockFeClickListItem.mockResolvedValue(undefined);
  mockFeSelectListItem.mockResolvedValue(undefined);
}

// ── Tests ───────────────────────────────────────────────────────────

describe('fe-fixtures fixture definitions', () => {
  beforeEach(() => {
    resetAllMockDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createFEFixture', () => {
    it('returns object with listReport, objectPage, table, list sub-namespaces', () => {
      const fe = createFEFixture(mockPage as never);

      expect(fe).toBeDefined();
      expect(fe.listReport).toBeDefined();
      expect(fe.objectPage).toBeDefined();
      expect(fe.table).toBeDefined();
      expect(fe.list).toBeDefined();
    });

    it('listReport.search delegates to executeSearch(page, "")', async () => {
      const fe = createFEFixture(mockPage as never);

      await fe.listReport.search();

      expect(mockExecuteSearch).toHaveBeenCalledOnce();
      expect(mockExecuteSearch).toHaveBeenCalledWith(mockPage, '');
    });

    it('listReport.setFilter delegates to setFilterBarField(page, "", fieldName, value)', async () => {
      const fe = createFEFixture(mockPage as never);

      await fe.listReport.setFilter('Status', 'Active');

      expect(mockSetFilterBarField).toHaveBeenCalledOnce();
      expect(mockSetFilterBarField).toHaveBeenCalledWith(mockPage, '', 'Status', 'Active');
    });

    it('listReport.navigateToItem delegates to navigateToItem(page, "", rowIndex)', async () => {
      const fe = createFEFixture(mockPage as never);

      await fe.listReport.navigateToItem(2);

      expect(mockNavigateToItem).toHaveBeenCalledOnce();
      expect(mockNavigateToItem).toHaveBeenCalledWith(mockPage, '', 2);
    });

    it('objectPage.clickEdit delegates to clickEditButton(page)', async () => {
      const fe = createFEFixture(mockPage as never);

      await fe.objectPage.clickEdit();

      expect(mockClickEditButton).toHaveBeenCalledOnce();
      expect(mockClickEditButton).toHaveBeenCalledWith(mockPage);
    });

    it('objectPage.getHeaderTitle delegates to getHeaderTitle(page)', async () => {
      const fe = createFEFixture(mockPage as never);

      const title = await fe.objectPage.getHeaderTitle();

      expect(title).toBe('Product Details');
      expect(mockGetHeaderTitle).toHaveBeenCalledOnce();
      expect(mockGetHeaderTitle).toHaveBeenCalledWith(mockPage);
    });

    it('objectPage.navigateToSection delegates to navigateToSection(page, sectionId)', async () => {
      const fe = createFEFixture(mockPage as never);

      await fe.objectPage.navigateToSection('GeneralInfo');

      expect(mockNavigateToSection).toHaveBeenCalledOnce();
      expect(mockNavigateToSection).toHaveBeenCalledWith(mockPage, 'GeneralInfo');
    });

    it('table.getRowCount delegates to feGetTableRowCount(page, tableId)', async () => {
      const fe = createFEFixture(mockPage as never);

      const count = await fe.table.getRowCount('productsTable');

      expect(count).toBe(5);
      expect(mockFeGetTableRowCount).toHaveBeenCalledOnce();
      expect(mockFeGetTableRowCount).toHaveBeenCalledWith(mockPage, 'productsTable');
    });

    it('table.getCellValue delegates to feGetCellValue(page, tableId, rowIndex, columnName)', async () => {
      const fe = createFEFixture(mockPage as never);

      const value = await fe.table.getCellValue('productsTable', 0, 'Name');

      expect(value).toBe('CellValue');
      expect(mockFeGetCellValue).toHaveBeenCalledOnce();
      expect(mockFeGetCellValue).toHaveBeenCalledWith(mockPage, 'productsTable', 0, 'Name');
    });

    it('list.getItemCount delegates to feGetListItemCount(page, listId)', async () => {
      const fe = createFEFixture(mockPage as never);

      const count = await fe.list.getItemCount('ordersList');

      expect(count).toBe(3);
      expect(mockFeGetListItemCount).toHaveBeenCalledOnce();
      expect(mockFeGetListItemCount).toHaveBeenCalledWith(mockPage, 'ordersList');
    });

    it('list.clickItem delegates to feClickListItem(page, listId, index)', async () => {
      const fe = createFEFixture(mockPage as never);

      await fe.list.clickItem('ordersList', 1);

      expect(mockFeClickListItem).toHaveBeenCalledOnce();
      expect(mockFeClickListItem).toHaveBeenCalledWith(mockPage, 'ordersList', 1);
    });
  });

  describe('feTest fixture definition', () => {
    it('provides fe fixture via createFEFixture(page)', async () => {
      const fn = extractFixtureFn(fixtures['fe']);
      const fe = await runFixture<FioriElementsFixture>(fn, { page: mockPage });

      expect(fe).toBeDefined();
      expect(fe.listReport).toBeDefined();
      expect(fe.objectPage).toBeDefined();
      expect(fe.table).toBeDefined();
      expect(fe.list).toBeDefined();

      // Verify the fixture delegates correctly by calling a method
      await fe.listReport.search();
      expect(mockExecuteSearch).toHaveBeenCalledOnce();
      expect(mockExecuteSearch).toHaveBeenCalledWith(mockPage, '');
    });
  });
});
