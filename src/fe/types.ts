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
 * Returned by {@link FE_EMPTY_QUEUE_SCRIPT} after OPA5 queue execution.
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
  readonly navigateToSection: (sectionTitleOrId: string) => Promise<void>;
  readonly getSectionData: (sectionTitleOrId: string) => Promise<Readonly<Record<string, unknown>>>;
  readonly clickButton: (buttonName: string) => Promise<void>;
  readonly clickEdit: () => Promise<void>;
  readonly clickSave: () => Promise<void>;
  readonly getSections: () => Promise<readonly { readonly title: string; readonly id: string }[]>;
  readonly getHeaderTitle: () => Promise<string>;
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
  readonly listReport: {
    readonly getTable: () => Promise<string>;
    readonly getFilterBar: () => Promise<string>;
    readonly setFilter: (fieldName: string, value: string) => Promise<void>;
    readonly search: () => Promise<void>;
    readonly clearFilters: () => Promise<void>;
    readonly navigateToItem: (rowIndex: number) => Promise<void>;
    readonly getVariants: () => Promise<readonly string[]>;
    readonly selectVariant: (name: string) => Promise<void>;
    readonly getFilterValue: (fieldName: string) => Promise<string>;
  };
  readonly objectPage: ObjectPageFixture;
  readonly table: {
    readonly getRowCount: (tableId: string) => Promise<number>;
    readonly getCellValue: (
      tableId: string,
      rowIndex: number,
      columnName: string,
    ) => Promise<string>;
    readonly findRow: (
      tableId: string,
      values: Readonly<Record<string, string>>,
    ) => Promise<number>;
    readonly clickRow: (tableId: string, rowIndex: number) => Promise<void>;
    readonly getColumnNames: (tableId: string) => Promise<readonly string[]>;
  };
  readonly list: {
    readonly getItemCount: (listId: string) => Promise<number>;
    readonly getItemTitle: (listId: string, index: number) => Promise<string>;
    readonly findItemByTitle: (listId: string, title: string) => Promise<number>;
    readonly clickItem: (listId: string, index: number) => Promise<void>;
    readonly selectItem: (listId: string, index: number, selected: boolean) => Promise<void>;
  };
}
