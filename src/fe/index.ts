/**
 * Fiori Elements test helpers barrel.
 *
 * @remarks
 * Re-exports List Report, Object Page, FE table/list helpers,
 * FE Test Library, and browser-side scripts.
 *
 * @module fe
 */

// ── List Report ──────────────────────────────────────────────────────
export {
  clearFilterBar,
  executeSearch,
  getAvailableVariants,
  getFilterBar,
  getFilterBarFieldValue,
  getListReportTable,
  navigateToItem,
  selectVariant,
  setFilterBarField,
} from './list-report.js';
export type { ListReportOptions, ListReportPage } from './list-report.js';

// ── Object Page ──────────────────────────────────────────────────────
export {
  clickEditButton,
  clickObjectPageButton,
  clickSaveButton,
  getHeaderTitle,
  getObjectPageLayout,
  getObjectPageSections,
  getSectionData,
  isInEditMode,
  navigateToSection,
} from './object-page.js';
export type {
  ObjectPageOptions,
  ObjectPagePage,
  ObjectPageSection,
  SectionData,
} from './object-page.js';

// ── FE Table Helpers ─────────────────────────────────────────────────
export {
  feClickRow,
  feGetCellValue,
  feGetColumnNames,
  feGetTableRowCount,
  feFindRowByValues,
} from './fe-table-helpers.js';
export type { FETablePage } from './fe-table-helpers.js';

// ── FE List Helpers ──────────────────────────────────────────────────
export {
  feClickListItem,
  feFindListItemByTitle,
  feGetListItemCount,
  feGetListItemDescription,
  feGetListItemTitle,
  feSelectListItem,
} from './fe-list-helpers.js';
export type { FEListPage } from './fe-list-helpers.js';

// ── FE Test Library ──────────────────────────────────────────────────
export { FETestLibraryInstance, initializeFETestLibrary } from './fe-test-library.js';
export type { FETestLibraryOptions, FETestLibraryPage } from './fe-test-library.js';

// ── FE Browser Scripts ───────────────────────────────────────────────
export {
  FE_ADD_TO_QUEUE_SCRIPT,
  FE_DETECT_WORKZONE_SCRIPT,
  FE_EMPTY_QUEUE_SCRIPT,
  FE_INIT_OPA_SCRIPT,
  FE_LOAD_LIBRARIES_SCRIPT,
} from './fe-browser-scripts.js';

// ── FE Types ─────────────────────────────────────────────────────────
export type {
  FETestLibraryResponse,
  FioriElementsFixture,
  ObjectPageFixture,
  ProxyMethodCall,
  TestLibraryConfig,
} from './types.js';
