/**
 * Fiori Elements fixtures — provides `fe` fixture with list report,
 * object page, table, and list sub-namespaces.
 *
 * @ai
 * @aiContext Use the `fe` fixture for Fiori Elements apps. Provides list report operations
 * (filter, search, navigate), object page operations (edit, save, sections), table helpers
 * (row click, cell read), and list helpers (item click, count).
 *
 * @remarks
 * Each method curries the Playwright `page` into the corresponding
 * FE module function. Dependencies are declared as PW-MERGE-1 placeholders.
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';

import {
  feClickListItem,
  feFindListItemByTitle,
  feGetListItemCount,
  feGetListItemTitle,
  feSelectListItem,
} from '../fe/fe-list-helpers.js';
import {
  feClickRow,
  feGetCellValue,
  feGetColumnNames,
  feGetTableRowCount,
  feFindRowByValues,
} from '../fe/fe-table-helpers.js';
import {
  clearFilterBar,
  executeSearch,
  getAvailableVariants,
  getFilterBar,
  getFilterBarFieldValue,
  getListReportTable,
  navigateToItem,
  selectVariant,
  setFilterBarField,
} from '../fe/list-report.js';
import {
  clickEditButton,
  clickObjectPageButton,
  clickSaveButton,
  getHeaderTitle,
  getObjectPageSections,
  getSectionData,
  isInEditMode,
  navigateToSection,
} from '../fe/object-page.js';
import type { FioriElementsFixture } from '../fe/types.js';

export interface FEFixtures {
  fe: FioriElementsFixture;
}

/**
 * Creates the FE fixture object with all four sub-namespaces.
 *
 * @example `const fe = createFEFixture(page); await fe.listReport.search();`
 */
export function createFEFixture(page: never): FioriElementsFixture {
  return {
    listReport: {
      getTable: async () => getListReportTable(page),
      getFilterBar: async () => getFilterBar(page),
      setFilter: async (fieldName: string, value: string) =>
        setFilterBarField(page, '', fieldName, value),
      search: async () => executeSearch(page, ''),
      clearFilters: async () => clearFilterBar(page, ''),
      navigateToItem: async (rowIndex: number) => navigateToItem(page, '', rowIndex),
      getVariants: async () => getAvailableVariants(page),
      selectVariant: async (name: string) => selectVariant(page, name),
      getFilterValue: async (fieldName: string) => getFilterBarFieldValue(page, '', fieldName),
    },
    objectPage: {
      navigateToSection: async (sectionTitleOrId: string) =>
        navigateToSection(page, sectionTitleOrId),
      getSectionData: async (sectionTitleOrId: string) => getSectionData(page, sectionTitleOrId),
      clickButton: async (buttonName: string) => clickObjectPageButton(page, buttonName),
      clickEdit: async () => clickEditButton(page),
      clickSave: async () => clickSaveButton(page),
      getSections: async () => getObjectPageSections(page),
      getHeaderTitle: async () => getHeaderTitle(page),
      isInEditMode: async () => isInEditMode(page),
    },
    table: {
      getRowCount: async (tableId: string) => feGetTableRowCount(page, tableId),
      getCellValue: async (tableId: string, rowIndex: number, columnName: string) =>
        feGetCellValue(page, tableId, rowIndex, columnName),
      findRow: async (tableId: string, values: Readonly<Record<string, string>>) =>
        feFindRowByValues(page, tableId, values),
      clickRow: async (tableId: string, rowIndex: number) => feClickRow(page, tableId, rowIndex),
      getColumnNames: async (tableId: string) => feGetColumnNames(page, tableId),
    },
    list: {
      getItemCount: async (listId: string) => feGetListItemCount(page, listId),
      getItemTitle: async (listId: string, index: number) =>
        feGetListItemTitle(page, listId, index),
      findItemByTitle: async (listId: string, title: string) =>
        feFindListItemByTitle(page, listId, title),
      clickItem: async (listId: string, index: number) => feClickListItem(page, listId, index),
      selectItem: async (listId: string, index: number, selected: boolean) =>
        feSelectListItem(page, listId, index, selected),
    },
  };
}

/**
 * FE test — provides the `fe` fixture for Fiori Elements testing.
 *
 * @example
 * ```typescript
 * import { feTest } from '#fixtures/fe-fixtures.js';
 * feTest('filter list report', async ({ fe }) => {
 *   await fe.listReport.search();
 * });
 * ```
 */
export const feTest = base.extend<FEFixtures>({
  fe: async ({ page }, use) => {
    // Type assertion: `page as never` prevents factory from depending on concrete Page type
    await use(createFEFixture(page as never));
  },
});
