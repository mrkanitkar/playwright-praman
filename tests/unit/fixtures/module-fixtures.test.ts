/**
 * Tests for `src/fixtures/module-fixtures.ts` — Module Playwright fixtures.
 *
 * @remarks
 * Uses vitest with mocked `@playwright/test` and module dependencies.
 * Fixture definitions are captured via `createMockTestExtend()` and executed
 * directly to verify behavior without requiring a Playwright test runner.
 *
 * @module fixtures
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createMockTestExtend,
  createMockExpectExtend,
} from '../../helpers/mock-playwright-test.js';

import type { PramanConfig } from '#core/config/schema.js';
import { PramanConfigSchema } from '#core/config/schema.js';

// ── Test-local type for the extended UI5 fixture result ──────────────
/** Shape of the extended UI5Handler with sub-namespaces returned by the ui5 fixture. */
interface TestExtendedUI5Handler {
  readonly table: {
    readonly getRows: (...args: unknown[]) => Promise<unknown>;
    readonly clickRow: (...args: unknown[]) => Promise<unknown>;
    readonly findRowByValues: (...args: unknown[]) => Promise<unknown>;
    readonly getColumnNames: (...args: unknown[]) => Promise<unknown>;
    readonly filterByColumn: (...args: unknown[]) => Promise<unknown>;
    readonly sortByColumn: (...args: unknown[]) => Promise<unknown>;
    readonly [key: string]: (...args: unknown[]) => Promise<unknown>;
  };
  readonly dialog: {
    readonly waitFor: (...args: unknown[]) => Promise<unknown>;
    readonly confirm: (...args: unknown[]) => Promise<unknown>;
    readonly dismiss: (...args: unknown[]) => Promise<unknown>;
    readonly getOpen: (...args: unknown[]) => Promise<unknown>;
    readonly isOpen: (...args: unknown[]) => Promise<unknown>;
    readonly [key: string]: (...args: unknown[]) => Promise<unknown>;
  };
  readonly date: {
    readonly setDatePicker: (...args: unknown[]) => Promise<unknown>;
    readonly getDatePicker: (...args: unknown[]) => Promise<unknown>;
    readonly setDateRange: (...args: unknown[]) => Promise<unknown>;
    readonly getDateRange: (...args: unknown[]) => Promise<unknown>;
    readonly setTimePicker: (...args: unknown[]) => Promise<unknown>;
    readonly getTimePicker: (...args: unknown[]) => Promise<unknown>;
    readonly [key: string]: (...args: unknown[]) => Promise<unknown>;
  };
  readonly odata: {
    readonly getModelData: (...args: unknown[]) => Promise<unknown>;
    readonly createEntity: (...args: unknown[]) => Promise<unknown>;
    readonly updateEntity: (...args: unknown[]) => Promise<unknown>;
    readonly deleteEntity: (...args: unknown[]) => Promise<unknown>;
    readonly queryEntities: (...args: unknown[]) => Promise<unknown>;
    readonly fetchCSRFToken: (...args: unknown[]) => Promise<unknown>;
    readonly [key: string]: (...args: unknown[]) => Promise<unknown>;
  };
}

// ── Mock table module ────────────────────────────────────────────────
const mockGetTableRows = vi.fn().mockResolvedValue([]);
const mockGetTableRowCount = vi.fn().mockResolvedValue(0);
const mockGetTableCellValue = vi.fn().mockResolvedValue('');
const mockGetTableData = vi.fn().mockResolvedValue([]);
const mockSelectTableRow = vi.fn().mockResolvedValue(undefined);
const mockSelectAllTableRows = vi.fn().mockResolvedValue(undefined);
const mockDeselectAllTableRows = vi.fn().mockResolvedValue(undefined);
const mockWaitForTableData = vi.fn().mockResolvedValue(undefined);
const mockGetSelectedRows = vi.fn().mockResolvedValue([]);
const mockDetectTableType = vi.fn().mockResolvedValue('responsive');

vi.mock('../../../src/modules/table.js', () => ({
  getTableRows: mockGetTableRows,
  getTableRowCount: mockGetTableRowCount,
  getTableCellValue: mockGetTableCellValue,
  getTableData: mockGetTableData,
  selectTableRow: mockSelectTableRow,
  selectAllTableRows: mockSelectAllTableRows,
  deselectAllTableRows: mockDeselectAllTableRows,
  waitForTableData: mockWaitForTableData,
  getSelectedRows: mockGetSelectedRows,
  detectTableType: mockDetectTableType,
}));

// ── Mock table-operations module ─────────────────────────────────────
const mockGetColumnNames = vi.fn().mockResolvedValue([]);
const mockFindRowByValues = vi.fn().mockResolvedValue(0);
const mockGetCellByColumnName = vi.fn().mockResolvedValue('');
const mockClickRow = vi.fn().mockResolvedValue(undefined);
const mockSelectRowByValues = vi.fn().mockResolvedValue(undefined);
const mockEnsureRowVisible = vi.fn().mockResolvedValue(undefined);
const mockSetTableCellValue = vi.fn().mockResolvedValue(undefined);
const mockGetRowCount = vi.fn().mockResolvedValue(0);

vi.mock('../../../src/modules/table-operations.js', () => ({
  getColumnNames: mockGetColumnNames,
  findRowByValues: mockFindRowByValues,
  getCellByColumnName: mockGetCellByColumnName,
  clickRow: mockClickRow,
  selectRowByValues: mockSelectRowByValues,
  ensureRowVisible: mockEnsureRowVisible,
  setTableCellValue: mockSetTableCellValue,
  getRowCount: mockGetRowCount,
}));

// ── Mock table-filter-sort module ────────────────────────────────────
const mockFilterByColumn = vi.fn().mockResolvedValue(undefined);
const mockSortByColumn = vi.fn().mockResolvedValue(undefined);
const mockGetSortOrder = vi.fn().mockResolvedValue('ascending');
const mockGetFilterValue = vi.fn().mockResolvedValue('');
const mockExportTableData = vi.fn().mockResolvedValue(undefined);
const mockClickTableSettingsButton = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/modules/table-filter-sort.js', () => ({
  filterByColumn: mockFilterByColumn,
  sortByColumn: mockSortByColumn,
  getSortOrder: mockGetSortOrder,
  getFilterValue: mockGetFilterValue,
  exportTableData: mockExportTableData,
  clickTableSettingsButton: mockClickTableSettingsButton,
}));

// ── Mock dialog module ───────────────────────────────────────────────
const mockWaitForDialog = vi.fn().mockResolvedValue(undefined);
const mockGetOpenDialogs = vi.fn().mockResolvedValue([]);
const mockIsDialogOpen = vi.fn().mockResolvedValue(false);
const mockDismissDialog = vi.fn().mockResolvedValue(undefined);
const mockConfirmDialog = vi.fn().mockResolvedValue(undefined);
const mockWaitForDialogClosed = vi.fn().mockResolvedValue(undefined);
const mockGetDialogButtons = vi.fn().mockResolvedValue([]);

vi.mock('../../../src/modules/dialog.js', () => ({
  waitForDialog: mockWaitForDialog,
  getOpenDialogs: mockGetOpenDialogs,
  isDialogOpen: mockIsDialogOpen,
  dismissDialog: mockDismissDialog,
  confirmDialog: mockConfirmDialog,
  waitForDialogClosed: mockWaitForDialogClosed,
  getDialogButtons: mockGetDialogButtons,
}));

// ── Mock date module ─────────────────────────────────────────────────
const mockSetDatePickerValue = vi.fn().mockResolvedValue(undefined);
const mockGetDatePickerValue = vi.fn().mockResolvedValue('2024-01-15');
const mockSetDateRangeSelection = vi.fn().mockResolvedValue(undefined);
const mockGetDateRangeSelection = vi.fn().mockResolvedValue({ start: '', end: '' });
const mockSetTimePickerValue = vi.fn().mockResolvedValue(undefined);
const mockGetTimePickerValue = vi.fn().mockResolvedValue('10:30');
const mockSetAndValidateDate = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/modules/date.js', () => ({
  setDatePickerValue: mockSetDatePickerValue,
  getDatePickerValue: mockGetDatePickerValue,
  setDateRangeSelection: mockSetDateRangeSelection,
  getDateRangeSelection: mockGetDateRangeSelection,
  setTimePickerValue: mockSetTimePickerValue,
  getTimePickerValue: mockGetTimePickerValue,
  setAndValidateDate: mockSetAndValidateDate,
}));

// ── Mock odata module ────────────────────────────────────────────────
const mockGetModelData = vi.fn().mockResolvedValue({});
const mockGetModelProperty = vi.fn().mockResolvedValue(null);
const mockWaitForODataLoad = vi.fn().mockResolvedValue(undefined);
const mockFetchCSRFToken = vi.fn().mockResolvedValue('token-123');
const mockGetEntityCount = vi.fn().mockResolvedValue(0);
const mockHasPendingChanges = vi.fn().mockResolvedValue(false);

vi.mock('../../../src/modules/odata.js', () => ({
  getModelData: mockGetModelData,
  getModelProperty: mockGetModelProperty,
  waitForODataLoad: mockWaitForODataLoad,
  fetchCSRFToken: mockFetchCSRFToken,
  getEntityCount: mockGetEntityCount,
  hasPendingChanges: mockHasPendingChanges,
}));

// ── Mock odata-http module ───────────────────────────────────────────
const mockCreateEntity = vi.fn().mockResolvedValue({ id: '1' });
const mockUpdateEntity = vi.fn().mockResolvedValue(undefined);
const mockDeleteEntity = vi.fn().mockResolvedValue(undefined);
const mockQueryEntities = vi.fn().mockResolvedValue([]);
const mockCallFunctionImport = vi.fn().mockResolvedValue(undefined);

vi.mock('../../../src/modules/odata-http.js', () => ({
  createEntity: mockCreateEntity,
  updateEntity: mockUpdateEntity,
  deleteEntity: mockDeleteEntity,
  queryEntities: mockQueryEntities,
  callFunctionImport: mockCallFunctionImport,
}));

// ── Mock UI5Handler ──────────────────────────────────────────────────
const mockUI5HandlerInstance = {
  control: vi.fn(),
  controls: vi.fn(),
  click: vi.fn(),
  fill: vi.fn(),
  press: vi.fn(),
  select: vi.fn(),
  check: vi.fn(),
  uncheck: vi.fn(),
  clear: vi.fn(),
  getText: vi.fn(),
  getValue: vi.fn(),
  waitForUI5: vi.fn(),
  waitFor: vi.fn(),
  clearCache: vi.fn(),
  destroy: vi.fn(),
};

vi.mock('../../../src/fixtures/ui5-handler.js', () => ({
  UI5Handler: vi.fn().mockImplementation(function mockUI5Handler(this: Record<string, unknown>) {
    Object.assign(this, mockUI5HandlerInstance);
  }),
}));

// ── Mock logging ─────────────────────────────────────────────────────
const mockChildLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(),
  level: 'info',
};
const mockCreateLogger = vi.fn().mockReturnValue(mockChildLogger);

vi.mock('#core/logging/index.js', () => ({
  createLogger: mockCreateLogger,
}));

// ── Mock bridge injection ────────────────────────────────────────────
const mockResetPageInjection = vi.fn();

vi.mock('#bridge/injection.js', () => ({
  resetPageInjection: mockResetPageInjection,
}));

// ── Mock interaction strategy factory ────────────────────────────────
const mockStrategy = { name: 'opa5', press: vi.fn(), enterText: vi.fn(), select: vi.fn() };
const mockCreateInteractionStrategy = vi.fn().mockReturnValue(mockStrategy);

vi.mock('#bridge/interaction-strategies/strategy-factory.js', () => ({
  createInteractionStrategy: mockCreateInteractionStrategy,
}));

// ── Mock core-fixtures (coreTest) ────────────────────────────────────
const mockCoreTestExtend = createMockTestExtend();

vi.mock('../../../src/fixtures/core-fixtures.js', () => ({
  coreTest: {
    extend: mockCoreTestExtend,
  },
}));

// ── Mock Playwright ──────────────────────────────────────────────────
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

// ── Mock Playwright page ─────────────────────────────────────────────
const mockPage = {
  evaluate: vi.fn().mockResolvedValue(undefined),
  waitForFunction: vi.fn().mockResolvedValue(undefined),
  locator: vi.fn().mockReturnValue({
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    isVisible: vi.fn().mockResolvedValue(true),
  }),
  on: vi.fn(),
  off: vi.fn(),
  mainFrame: vi.fn(),
};

// ── Mock config ──────────────────────────────────────────────────────
const mockConfig: Readonly<PramanConfig> = Object.freeze(
  PramanConfigSchema.parse({ logLevel: 'info' }),
);

// ── Import after mocks ──────────────────────────────────────────────
const { moduleTest } = await import('#fixtures/module-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

/**
 * Extracts the fixture function from a fixture definition.
 *
 * @param definition - The fixture definition from `_fixtureDefinitions`
 * @returns The fixture function
 *
 * @example
 * ```typescript
 * const fn = extractFixtureFn(fixtures.ui5);
 * ```
 */
function extractFixtureFn(
  definition: unknown,
): (
  deps: Record<string, unknown>,
  use: (value: TestExtendedUI5Handler) => Promise<void>,
) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (
      deps: Record<string, unknown>,
      use: (value: TestExtendedUI5Handler) => Promise<void>,
    ) => Promise<void>;
  }
  return definition as (
    deps: Record<string, unknown>,
    use: (value: TestExtendedUI5Handler) => Promise<void>,
  ) => Promise<void>;
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
 * const ui5 = await runFixture(fixtureFn, { page: mockPage, pramanConfig: mockConfig });
 * ```
 */
async function runFixture(
  fn: (
    deps: Record<string, unknown>,
    use: (value: TestExtendedUI5Handler) => Promise<void>,
  ) => Promise<void>,
  deps: Record<string, unknown>,
): Promise<TestExtendedUI5Handler> {
  let captured: TestExtendedUI5Handler | undefined;
  const useFn = async (value: TestExtendedUI5Handler): Promise<void> => {
    captured = value;
    await Promise.resolve();
  };
  await fn(deps, useFn);
  if (captured === undefined) {
    throw new Error('Fixture did not call use()');
  }
  return captured;
}

// ── Fixture definitions reference ────────────────────────────────────
const fixtures = (moduleTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

// ── Reset helper ─────────────────────────────────────────────────────

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
  mockGetTableRows.mockResolvedValue([]);
  mockClickRow.mockResolvedValue(undefined);
  mockFindRowByValues.mockResolvedValue(0);
  mockWaitForDialog.mockResolvedValue(undefined);
  mockConfirmDialog.mockResolvedValue(undefined);
  mockSetDatePickerValue.mockResolvedValue(undefined);
  mockGetDatePickerValue.mockResolvedValue('2024-01-15');
  mockGetModelData.mockResolvedValue({});
  mockCreateEntity.mockResolvedValue({ id: '1' });
  mockCreateLogger.mockReturnValue(mockChildLogger);
  mockCreateInteractionStrategy.mockReturnValue(mockStrategy);
  mockResetPageInjection.mockReturnValue(undefined);
}

// ── Tests ────────────────────────────────────────────────────────────

describe('module-fixtures fixture definitions', () => {
  beforeEach(() => {
    resetAllMockDefaults();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ui5 fixture sub-namespaces', () => {
    it('provides table, dialog, date, odata sub-namespaces', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(ui5).toBeDefined();
      expect(ui5.table).toBeDefined();
      expect(ui5.dialog).toBeDefined();
      expect(ui5.date).toBeDefined();
      expect(ui5.odata).toBeDefined();
    });

    it('table namespace has expected methods', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(typeof ui5.table.getRows).toBe('function');
      expect(typeof ui5.table.clickRow).toBe('function');
      expect(typeof ui5.table.findRowByValues).toBe('function');
      expect(typeof ui5.table.getColumnNames).toBe('function');
      expect(typeof ui5.table.filterByColumn).toBe('function');
      expect(typeof ui5.table.sortByColumn).toBe('function');
    });

    it('dialog namespace has expected methods', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(typeof ui5.dialog.waitFor).toBe('function');
      expect(typeof ui5.dialog.confirm).toBe('function');
      expect(typeof ui5.dialog.dismiss).toBe('function');
      expect(typeof ui5.dialog.getOpen).toBe('function');
      expect(typeof ui5.dialog.isOpen).toBe('function');
    });

    it('date namespace has expected methods', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(typeof ui5.date.setDatePicker).toBe('function');
      expect(typeof ui5.date.getDatePicker).toBe('function');
      expect(typeof ui5.date.setDateRange).toBe('function');
      expect(typeof ui5.date.getDateRange).toBe('function');
      expect(typeof ui5.date.setTimePicker).toBe('function');
      expect(typeof ui5.date.getTimePicker).toBe('function');
    });

    it('odata namespace has expected methods', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(typeof ui5.odata.getModelData).toBe('function');
      expect(typeof ui5.odata.createEntity).toBe('function');
      expect(typeof ui5.odata.updateEntity).toBe('function');
      expect(typeof ui5.odata.deleteEntity).toBe('function');
      expect(typeof ui5.odata.queryEntities).toBe('function');
      expect(typeof ui5.odata.fetchCSRFToken).toBe('function');
    });
  });

  describe('table delegation', () => {
    it('getRows delegates to getTableRows with page and tableId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.getRows('myTable', { timeout: 5000 });

      expect(mockGetTableRows).toHaveBeenCalledOnce();
      expect(mockGetTableRows).toHaveBeenCalledWith(mockPage, 'myTable', { timeout: 5000 });
    });

    it('clickRow delegates to clickRow with page, tableId, and row', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.table.clickRow('ordersTable', 2);

      expect(mockClickRow).toHaveBeenCalledOnce();
      expect(mockClickRow).toHaveBeenCalledWith(mockPage, 'ordersTable', 2);
    });

    it('findRowByValues delegates to findRowByValues with page, tableId, and values', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const values = { Name: 'Widget', Status: 'Active' };
      await ui5.table.findRowByValues('productsTable', values);

      expect(mockFindRowByValues).toHaveBeenCalledOnce();
      expect(mockFindRowByValues).toHaveBeenCalledWith(mockPage, 'productsTable', values);
    });
  });

  describe('dialog delegation', () => {
    it('waitFor delegates to waitForDialog with page and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.dialog.waitFor({ title: 'Confirm' });

      expect(mockWaitForDialog).toHaveBeenCalledOnce();
      expect(mockWaitForDialog).toHaveBeenCalledWith(mockPage, { title: 'Confirm' });
    });

    it('confirm delegates to confirmDialog with page and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.dialog.confirm();

      expect(mockConfirmDialog).toHaveBeenCalledOnce();
      expect(mockConfirmDialog).toHaveBeenCalledWith(mockPage, undefined);
    });
  });

  describe('date delegation', () => {
    it('setDatePicker delegates to setDatePickerValue with page, controlId, date, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.date.setDatePicker('dp1', '2024-06-15', { format: 'yyyy-MM-dd' });

      expect(mockSetDatePickerValue).toHaveBeenCalledOnce();
      expect(mockSetDatePickerValue).toHaveBeenCalledWith(mockPage, 'dp1', '2024-06-15', {
        format: 'yyyy-MM-dd',
      });
    });

    it('getDatePicker delegates to getDatePickerValue with page and controlId', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const value = await ui5.date.getDatePicker('dp1');

      expect(value).toBe('2024-01-15');
      expect(mockGetDatePickerValue).toHaveBeenCalledOnce();
      expect(mockGetDatePickerValue).toHaveBeenCalledWith(mockPage, 'dp1');
    });
  });

  describe('odata delegation', () => {
    it('getModelData delegates to getModelData with page, path, and opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      await ui5.odata.getModelData('/Products', { modelName: 'main' });

      expect(mockGetModelData).toHaveBeenCalledOnce();
      expect(mockGetModelData).toHaveBeenCalledWith(mockPage, '/Products', { modelName: 'main' });
    });

    it('createEntity delegates to createEntity with page, serviceUrl, entitySet, data, opts', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      const ui5 = await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      const entityData = { Name: 'Test', Price: 100 };
      await ui5.odata.createEntity('/sap/opu/odata/svc', 'Products', entityData);

      expect(mockCreateEntity).toHaveBeenCalledOnce();
      expect(mockCreateEntity).toHaveBeenCalledWith(
        mockPage,
        '/sap/opu/odata/svc',
        'Products',
        entityData,
        undefined,
      );
    });
  });

  describe('fixture setup and teardown', () => {
    it('creates child logger with "bridge" module name', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);
      await runFixture(fn, {
        page: mockPage,
        pramanConfig: mockConfig,
        rootLogger: mockChildLogger,
      });

      expect(mockCreateLogger).toHaveBeenCalledWith('bridge', mockChildLogger);
    });

    it('attaches framenavigated listener on setup and removes on teardown', async () => {
      const fn = extractFixtureFn(fixtures['ui5']);

      const useFn = async (value: TestExtendedUI5Handler): Promise<void> => {
        // Verify listener was attached before use() is called
        expect(mockPage.on).toHaveBeenCalledWith('framenavigated', expect.any(Function));
        expect(value).toBeDefined();
        await Promise.resolve();
      };

      // The fixture function calls use(), then runs teardown after use() resolves
      await fn({ page: mockPage, pramanConfig: mockConfig, rootLogger: mockChildLogger }, useFn);

      // After use() completes, teardown should have removed the listener
      expect(mockPage.off).toHaveBeenCalledWith('framenavigated', expect.any(Function));
    });
  });
});
