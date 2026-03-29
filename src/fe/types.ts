/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Type definitions for the FE Test Library facade.
 *
 * @remarks
 * Defines the configuration shape for SAP Fiori Elements OPA5 page objects,
 * the proxy method call capture format, and the browser-side response envelope.
 * All interfaces are readonly for immutability.
 *
 * @module fe
 */

/**
 * Configuration for SAP Fiori Elements OPA5 page objects.
 *
 * @remarks
 * Maps logical page names (e.g., `onTheMainPage`, `onTheDetailPage`) to
 * their FE test library class configuration. Each page can configure one
 * or more FE class types (ListReport, ObjectPage, Shell).
 *
 * @example
 * ```typescript
 * const config: TestLibraryConfig = {
 *   onTheMainPage: {
 *     ListReport: {
 *       appId: 'my.app',
 *       componentId: 'myComponent',
 *       entitySet: 'Products',
 *     },
 *   },
 *   onTheDetailPage: {
 *     ObjectPage: {
 *       appId: 'my.app',
 *       componentId: 'myDetail',
 *       entitySet: 'Products',
 *     },
 *   },
 * };
 * ```
 */
export interface TestLibraryConfig {
  readonly onTheMainPage?: {
    readonly ListReport?: {
      readonly appId: string;
      readonly componentId: string;
      readonly entitySet: string;
    };
  };
  readonly onTheDetailPage?: {
    readonly ObjectPage?: {
      readonly appId: string;
      readonly componentId: string;
      readonly entitySet: string;
    };
  };
  readonly onTheShell?: {
    readonly Shell?: Readonly<Record<string, never>>;
  };
}

/**
 * Captured method call from the Given/When/Then proxy chain.
 *
 * @remarks
 * Each call records the OPA5 scope type, target page, and method chain.
 * The `accessor` flag distinguishes property access from function calls.
 *
 * @example
 * ```typescript
 * // When.onTheMainPage.onFilterBar().iChangeSearchField('x')
 * const call: ProxyMethodCall = {
 *   type: 'When',
 *   target: 'onTheMainPage',
 *   methods: [
 *     { name: 'onFilterBar', accessor: false },
 *     { name: 'iChangeSearchField', args: ['x'], accessor: false },
 *   ],
 * };
 * ```
 */
export interface ProxyMethodCall {
  readonly type: 'Given' | 'When' | 'Then';
  readonly target: string;
  readonly methods: readonly {
    readonly name: string;
    readonly args?: readonly unknown[];
    readonly accessor?: boolean;
  }[];
}

/**
 * Response envelope from browser-side FE script execution.
 *
 * @remarks
 * Returned by `FE_EMPTY_QUEUE_SCRIPT` after OPA5 queue execution.
 * Contains success/error status, optional assertion logs, and a message.
 *
 * @example
 * ```typescript
 * const response: FETestLibraryResponse = {
 *   type: 'success',
 *   feLogs: ['Filter applied: Status = Open'],
 *   message: 'Queue executed successfully',
 * };
 * ```
 */
export interface FETestLibraryResponse {
  readonly type: 'success' | 'error';
  readonly feLogs?: readonly string[];
  readonly message?: string;
}

/**
 * Fixture interface for Object Page testing operations.
 *
 * @remarks
 * Provides a high-level facade for Object Page interactions
 * within a Playwright test fixture context. Each method maps
 * to a corresponding function in `object-page.ts`.
 *
 * @example
 * ```typescript
 * test('edit product', async ({ objectPage }) => {
 *   await objectPage.clickEdit();
 *   const title = await objectPage.getHeaderTitle();
 *   expect(title).toBe('Product Details');
 * });
 * ```
 */
export interface ObjectPageFixture {
  /** Navigates to a section by its title or ID. */
  readonly navigateToSection: (sectionTitleOrId: string) => Promise<void>;
  /** Returns all field key-value pairs from a section. */
  readonly getSectionData: (sectionTitleOrId: string) => Promise<Readonly<Record<string, unknown>>>;
  /** Clicks a button by its display text. */
  readonly clickButton: (buttonName: string) => Promise<void>;
  /** Clicks the Edit button on the Object Page footer. */
  readonly clickEdit: () => Promise<void>;
  /** Clicks the Save button on the Object Page footer. */
  readonly clickSave: () => Promise<void>;
  /** Returns all sections with their title and ID. */
  readonly getSections: () => Promise<readonly { readonly title: string; readonly id: string }[]>;
  /** Returns the Object Page header title text. */
  readonly getHeaderTitle: () => Promise<string>;
  /** Returns whether the Object Page is in edit mode. */
  readonly isInEditMode: () => Promise<boolean>;
}

/**
 * Composite fixture interface for Fiori Elements testing.
 *
 * @remarks
 * Composes List Report, Object Page, FE table helpers, and FE list helpers
 * into a single fixture for end-to-end Fiori Elements test scenarios.
 *
 * @example
 * ```typescript
 * test('filter and navigate', async ({ fe }) => {
 *   await fe.listReport.setFilter('Status', 'Active');
 *   await fe.listReport.search();
 *   await fe.listReport.navigateToItem(0);
 *   const title = await fe.objectPage.getHeaderTitle();
 *   expect(title).toBeDefined();
 * });
 * ```
 */
export interface FioriElementsFixture {
  /** List Report operations — filter bar, search, variant management. */
  readonly listReport: {
    /** Returns the List Report table ID. */
    readonly getTable: () => Promise<string>;
    /** Returns the filter bar ID. */
    readonly getFilterBar: () => Promise<string>;
    /** Sets a filter field to a value and triggers the filter. */
    readonly setFilter: (fieldName: string, value: string) => Promise<void>;
    /** Clicks the Search/Go button on the filter bar. */
    readonly search: () => Promise<void>;
    /** Clears all active filters. */
    readonly clearFilters: () => Promise<void>;
    /** Navigates to a table row by its index. */
    readonly navigateToItem: (rowIndex: number) => Promise<void>;
    /** Returns all available variant names. */
    readonly getVariants: () => Promise<readonly string[]>;
    /** Selects a variant by name. */
    readonly selectVariant: (name: string) => Promise<void>;
    /** Returns the current value of a filter field. */
    readonly getFilterValue: (fieldName: string) => Promise<string>;
  };
  /** Object Page operations. */
  readonly objectPage: ObjectPageFixture;
  /** FE table helper operations. */
  readonly table: {
    /** Returns the number of rows in a table. */
    readonly getRowCount: (tableId: string) => Promise<number>;
    /** Returns a cell value by row index and column name. */
    readonly getCellValue: (
      tableId: string,
      rowIndex: number,
      columnName: string,
    ) => Promise<string>;
    /** Finds a row index matching the given column-value pairs. */
    readonly findRow: (
      tableId: string,
      values: Readonly<Record<string, string>>,
    ) => Promise<number>;
    /** Clicks a table row by index. */
    readonly clickRow: (tableId: string, rowIndex: number) => Promise<void>;
    /** Returns all column names for a table. */
    readonly getColumnNames: (tableId: string) => Promise<readonly string[]>;
  };
  /** FE list helper operations. */
  readonly list: {
    /** Returns the number of items in a list. */
    readonly getItemCount: (listId: string) => Promise<number>;
    /** Returns the title text of a list item by index. */
    readonly getItemTitle: (listId: string, index: number) => Promise<string>;
    /** Finds a list item index by its title text. */
    readonly findItemByTitle: (listId: string, title: string) => Promise<number>;
    /** Clicks a list item by index. */
    readonly clickItem: (listId: string, index: number) => Promise<void>;
    /** Selects or deselects a list item by index. */
    readonly selectItem: (listId: string, index: number, selected: boolean) => Promise<void>;
  };
}
