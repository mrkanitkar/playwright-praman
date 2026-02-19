# Phase 4 — Modules + Table + FE: Detailed Implementation Plan

**Version**: 1.1.0 (dhikraft parity gap fix + review fixes)
**Status**: DRAFT
**Parent**: `plan.md` §Phase 4
**Duration**: 5 weeks (Weeks 13–17.5) — extended for fixture wiring + review fixes + FE test library
**Approach**: TDD (RED → GREEN → REFACTOR)
**Prerequisites**: Phase 3 COMPLETE (1,506 tests, 88 files, 99.13% stmt coverage)

---

## Table of Contents

1. [Decision Log](#1-decision-log)
2. [Sub-Phase Breakdown](#2-sub-phase-breakdown)
3. [Dependency Graph](#3-dependency-graph)
4. [Design Flows](#4-design-flows)
5. [Sub-Phase 4.0 — Pre-requisites](#5-sub-phase-40--pre-requisites)
6. [Sub-Phase 4.1 — Table Module](#6-sub-phase-41--table-module)
7. [Sub-Phase 4.2 — Dialog Module](#7-sub-phase-42--dialog-module)
8. [Sub-Phase 4.3 — Date Module](#8-sub-phase-43--date-module)
9. [Sub-Phase 4.4 — OData Module](#9-sub-phase-44--odata-module)
10. [Sub-Phase 4.5 — Fiori Elements](#10-sub-phase-45--fiori-elements)
11. [Sub-Phase 4.6 — Integration + Barrel Updates + Fixture Types + Fixture Wiring](#11-sub-phase-46--integration--barrel-updates--fixture-types)
12. [Complete File Inventory](#12-complete-file-inventory)
13. [Test Plan](#13-test-plan)
14. [Impact Analysis](#14-impact-analysis)
15. [Quality Gates (STRONG — 4 Levels)](#15-quality-gates-strong--4-levels)
16. [Risk Register](#16-risk-register)
17. [Implementation Batching](#17-implementation-batching)
18. [Implementation Readiness Audit](#18-implementation-readiness-audit)
19. [Task Definition with Dependencies](#19-task-definition-with-dependencies)
20. [Parallel Execution Plan](#20-parallel-execution-plan)
21. [Conflict and Duplicate Check](#21-conflict-and-duplicate-check)
22. [Implementation Notes for Agents](#22-implementation-notes-for-agents)

---

## 1. Decision Log

Binding decisions for Phase 4 implementation. References plan.md design decisions and Phase 1–3 conventions.

| ID  | Decision                                                                                                                                                              | Rationale                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | Pure-function modules (no classes), following `navigation.ts` pattern                                                                                                 | Stateless, independently testable, ≤300 LOC. Class pattern reserved for stateful managers.                                                                                                                                                                                                                                                                                                                 |
| P2  | Minimal `XxxPage` interface per module — never import Playwright `Page` directly                                                                                      | Decouples from Playwright version, enables hermetic unit testing with mock objects                                                                                                                                                                                                                                                                                                                         |
| P3  | Table module auto-detects variant (sap.m.Table vs sap.ui.table.Table vs SmartTable)                                                                                   | Users shouldn't need to know the underlying table type; proxy already classifies via bridge                                                                                                                                                                                                                                                                                                                |
| P4  | SmartTable unwrapping via `getTable()` is handled transparently                                                                                                       | SmartTable wraps inner table — module calls `getTable()` when controlType contains `SmartTable`                                                                                                                                                                                                                                                                                                            |
| P5  | OData: model-level in `odata.ts`, HTTP-level in `odata-http.ts` (BOTH needed, split per P15)                                                                          | Model-level for reads (same path as UI5 apps). HTTP-level for CRUD writes/deletes in E2E tests. <!-- GAP FIX: dhikraft uses HTTP at odata-handler.ts:254-510 -->                                                                                                                                                                                                                                           |
| P6  | Dialog module uses `searchOpenDialogs: true` in selector for finding dialogs                                                                                          | UI5 dialogs are not in the view tree; RecordReplay needs this flag to find them                                                                                                                                                                                                                                                                                                                            |
| P7  | Date module accepts `Date` objects and ISO-8601 strings, converts to UI5 `valueFormat`                                                                                | Abstracts away UI5 date formatting; test authors use standard JS Date or ISO strings                                                                                                                                                                                                                                                                                                                       |
| P8  | FE modules use control discovery (not DOM selectors) — consistent with proxy-first architecture                                                                       | Fiori Elements controls have stable IDs and types; no need for fragile CSS selectors                                                                                                                                                                                                                                                                                                                       |
| P9  | Extract `getControlProperty` / `getControlAggregation` into `matchers/matcher-utils.ts`                                                                               | Currently duplicated in `table-matchers.ts` and `ui5-matchers.ts`; Phase 4 would create 3rd copy                                                                                                                                                                                                                                                                                                           |
| P10 | No new error subclasses — use existing `ControlError`, `ODataError`, `TimeoutError`                                                                                   | All necessary error codes already exist; adding new subclasses is unnecessary complexity                                                                                                                                                                                                                                                                                                                   |
| P11 | No config schema extension — module options passed as function parameters                                                                                             | Keeps config stable; per-call options (timeout, format) are more flexible than global config                                                                                                                                                                                                                                                                                                               |
| P12 | All browser-context code uses string scripts or inner function declarations                                                                                           | MEMORY.md: `page.evaluate()` serializes ONLY the function body; module-level functions excluded                                                                                                                                                                                                                                                                                                            |
| P13 | FE ListReport depends on Table module; ObjectPage is independent                                                                                                      | ListReport wraps SmartTable/MDC Table; ObjectPage is layout + sections, no table dependency                                                                                                                                                                                                                                                                                                                |
| P14 | Table module split: `table.ts` (core) + `table-operations.ts` (advanced ops)                                                                                          | Single table.ts would exceed 300 LOC with 20+ functions. Split by core (detect/rows/select) vs operations (find/edit/filter/sort). <!-- GAP FIX: added from dhikraft table.ts — 26 functions total vs plan4's original 9 -->                                                                                                                                                                               |
| P15 | OData module split: `odata.ts` (UI5 model-level) + `odata-http.ts` (HTTP-level CRUD)                                                                                  | Dhikraft uses HTTP-level OData (`page.request.get/post/patch/delete`). BOTH model-level and HTTP-level are needed — model for reads, HTTP for writes/deletes in E2E. <!-- GAP FIX: added from dhikraft odata-handler.ts:254-510 -->                                                                                                                                                                        |
| P16 | FE Test Library (WDI5FE / OPA5 Given/When/Then) INCLUDED in Phase 4 as Sub-Phase 4.5e                                                                                 | Dhikraft's `wdi5-fe.ts` (451 LOC) implements OPA5 test library pattern. Originally deferred to Phase 5, but re-evaluated: OPA5 compatibility is essential for teams migrating from WDI5/OPA5-based test suites AND the stateful class pattern is already proven in `ui5-handler.ts`. Including it in Phase 4 completes the FE layer. <!-- REVISED: was deferred, now included per architectural review --> |
| P17 | Add 2 new matchers: `toHaveUI5Binding` + `toBeUI5ControlType` with browser-side helpers                                                                               | Dhikraft `custom-matchers.ts` has these matchers + helper functions `getUI5BindingInfo` and `getUI5ControlType`. Essential for FE testing assertions. <!-- GAP FIX: added from dhikraft custom-matchers.ts:157-325 -->                                                                                                                                                                                     |
| P18 | Add FE table/list helpers as separate sub-modules under `fe/`                                                                                                         | Dhikraft `fiori-elements-test-library.ts` has FETableHelpers (614-704) and FEListHelpers (722-828). These wrap table/list ops with FE-specific ID conventions. <!-- GAP FIX: added from dhikraft fiori-elements-test-library.ts -->                                                                                                                                                                        |
| P19 | Wire all Phase 4 modules into Playwright fixture system via Sub-Phase 4.6b                                                                                            | Pure-function modules are useless to test authors unless exposed via `{ ui5 }` or `{ fe }` fixture. Add `fe-fixtures.ts` with `fe` fixture, extend `ui5` handler with `.table`, `.dialog`, `.date`, `.odata` sub-namespaces. Each call auto-wrapped in `test.step()` for Trace Viewer. <!-- REVIEW FIX: C1-PW -->                                                                                          |
| P20 | OData HTTP operations use Playwright `page.request.get/post/patch/delete` — NOT `.fetch()`                                                                            | Playwright's `APIRequestContext` has `.get()`, `.post()`, `.patch()`, `.delete()` — NOT a generic `.fetch()` method. The `ODataHttpPage` interface and all odata-http.ts functions must use the correct Playwright API. <!-- REVIEW FIX: C2-PW -->                                                                                                                                                         |
| P21 | Praman matchers are UI5 API matchers (not Playwright native matchers) — type augmentation handled via `expect.extend()` registration in `matcherRegistration` fixture | Matchers use `page.evaluate()` to call UI5 APIs (`getText`, `getBindingInfo`, etc.) and return `MatcherResult`. Type safety is provided by the existing registration pattern. <!-- REVIEW FIX: C3-PW, clarified -->                                                                                                                                                                                        |
| P22 | Polling loops MUST use `page.waitForFunction()` with browser-side scripts, not Node-side loops                                                                        | `waitForTableData`, `waitForDialog`, `waitForODataLoad` must NOT use Node-side `setTimeout` polling. Use `page.waitForFunction()` which runs the polling predicate in the browser context for correct timing and fewer round-trips. <!-- REVIEW FIX: C4-PW -->                                                                                                                                             |
| P23 | Fixture wrappers auto-wrap every call in `test.step()` for Playwright Trace Viewer                                                                                    | Module function calls from fixture context should be wrapped in `test.step('ui5.table.getRows', ...)` so Trace Viewer shows a structured timeline of UI5 operations. This is done at the fixture layer, NOT in each module. <!-- REVIEW FIX: C5-PW -->                                                                                                                                                     |

---

## 2. Sub-Phase Breakdown

```
Phase 4.0 — Pre-requisites (shared utils + new matchers)
  ├── Extract matcher-utils.ts from duplicated code
  ├── Add toHaveUI5Binding matcher + getUI5BindingInfo helper        <!-- GAP FIX: from dhikraft custom-matchers.ts:297-325 -->
  └── Add toBeUI5ControlType matcher + getUI5ControlType helper      <!-- GAP FIX: from dhikraft custom-matchers.ts:281-295 -->

Phase 4.1 — Table Module (split per P14)
  ├── modules/table.ts — core: detect, getRows, getRowCount, getTableData, selectRow, selectAll, deselectAll, waitForTableData, getSelectedRows
  └── modules/table-operations.ts — ops: findRowByValues, setTableValue, clickRow, ensureRowVisible, getCells, getCell, getCellValue, getColumnNames, filterByColumn, sortByColumn

Phase 4.2 — Dialog Module
  └── modules/dialog.ts — dialog discovery, wait, dismiss, confirm, getDialogButtons

Phase 4.3 — Date Module
  └── modules/date.ts — date/time picker value management, format conversion, locale/timezone, date range get, validation

Phase 4.4 — OData Module (split per P15)
  ├── modules/odata.ts — UI5 model-level: getModelData, getModelProperty, waitForODataLoad, getEntityCount, hasPendingChanges, fetchCSRFToken
  └── modules/odata-http.ts — HTTP-level: createEntity, updateEntity, deleteEntity, callFunctionImport, queryEntities

Phase 4.5 — Fiori Elements (expanded per P16, P18)
  ├── fe/object-page.ts — navigateToSection, getSectionData, clickObjectPageButton, clickEditButton, clickSaveButton, getObjectPageSections
  ├── fe/list-report.ts — getListReportTable, executeSearch, clearFilterBar, setFilterValue, getAvailableVariants, selectVariant
  ├── fe/fe-table-helpers.ts — FE table wrappers: feGetTableRowCount, feGetCellValue, feFindRowByValues, feClickRow, feGetColumnNames
  ├── fe/fe-list-helpers.ts — FE list wrappers: feGetListItemCount, feGetListItemTitle, feGetListItemDescription, feFindListItemByTitle, feClickListItem, feSelectListItem
  └── fe/fe-test-library.ts + fe/fe-browser-scripts.ts — OPA5 Given/When/Then facade (P16 — included in Phase 4)
      ├── fe/fe-test-library.ts — Node.js facade: initializeFETestLibrary, FETestLibraryInstance.execute(), WorkZone dual-context
      └── fe/fe-browser-scripts.ts — browser-side string constants: FE_LOAD_LIBRARIES_SCRIPT, FE_INIT_OPA_SCRIPT, FE_ADD_TO_QUEUE_SCRIPT, FE_EMPTY_QUEUE_SCRIPT, FE_DETECT_WORKZONE_SCRIPT

Phase 4.6a — Integration + Barrel Updates + Fixture Types
  ├── modules/index.ts — add table, table-operations, dialog, date, odata, odata-http exports
  ├── fe/index.ts — add list-report, object-page, fe-table-helpers, fe-list-helpers exports
  ├── src/index.ts — update main barrel
  └── Fixture types: ObjectPageFixture, FioriElementsFixture interfaces   <!-- GAP FIX: from dhikraft fixture-composite-types.ts -->

Phase 4.6b — Fixture Wiring Implementation                              <!-- REVIEW FIX: C1-PW (P19), C5-PW (P23) -->
  ├── fixtures/module-fixtures.ts — extend ui5 with .table, .dialog, .date, .odata sub-namespaces
  ├── fixtures/fe-fixtures.ts — fe fixture (listReport, objectPage, table, list)
  ├── fixtures/index.ts — update mergeTests to include moduleTest + feTest
  └── Each fixture call auto-wrapped in test.step() for Playwright Trace Viewer
```

---

## 3. Dependency Graph

```
                    ┌───────────────────────────────────┐
                    │  Phase 4.0                        │
                    │  matcher-utils.ts (extract shared) │
                    │  + toHaveUI5Binding matcher        │  <!-- GAP FIX: from dhikraft custom-matchers.ts -->
                    │  + toBeUI5ControlType matcher      │
                    └──────────────┬────────────────────┘
                                   │
          ┌────────────────────────┼───────────────────────┐
          │                        │                        │
          ▼                        ▼                        ▼
  ┌──────────────────┐  ┌────────────────┐  ┌────────────────┐
  │ Phase 4.1        │  │ Phase 4.2      │  │ Phase 4.3      │
  │ table.ts         │  │ dialog.ts      │  │ date.ts        │
  │ table-ops.ts     │  └────────────────┘  └────────────────┘
  └───────┬──────────┘
          │                                   ┌──────────────────────┐
          │ (table ops needed by FE)          │ Phase 4.4            │
          ▼                                   │ odata.ts             │
  ┌───────────────┐                           │ odata-http.ts        │  <!-- GAP FIX: P15 -->
  │ Phase 4.5a    │                           └──────────────────────┘
  │ list-report.ts│
  └───────────────┘
                     ┌────────────────┐
                     │ Phase 4.5b     │
                     │ object-page.ts │ (independent of table)
                     └────────────────┘
  ┌──────────────────────┐  ┌────────────────────────┐
  │ Phase 4.5c           │  │ Phase 4.5d             │
  │ fe-table-helpers.ts  │  │ fe-list-helpers.ts     │  <!-- GAP FIX: P18 -->
  │ (depends on 4.1)     │  │ (independent)          │
  └──────────────────────┘  └────────────────────────┘

  ┌────────────────────────────────────────────────────────┐
  │ Phase 4.5e — FE Test Library (WDI5FE / OPA5)          │  <!-- P16 INCLUDED -->
  │ fe-browser-scripts.ts (NO deps — pure string consts)  │
  │ fe-test-library.ts (depends on fe-browser-scripts.ts   │
  │                      + fe/types.ts)                    │
  │ STATEFUL class: FETestLibraryInstance (P1 exception)   │
  └────────────────────────────────────────────────────────┘

          All above ──▶ Phase 4.6a (barrel updates + fixture types + CI gate)
                           │
                           ▼
                    Phase 4.6b (fixture wiring — module-fixtures.ts + fe-fixtures.ts)  <!-- REVIEW FIX: C1-PW -->
```

**Parallelization**: 4.1, 4.2, 4.3, 4.4 are all independent of each other and can run in parallel.
4.5a (list-report) depends on 4.1 (table). 4.5b (object-page) is independent.
4.5c (fe-table-helpers) depends on 4.1 (table). 4.5d (fe-list-helpers) is independent.
4.5e (fe-test-library + fe-browser-scripts) is independent of 4.1-4.4 and 4.5a-4.5d. `fe-browser-scripts.ts` has NO dependencies (pure string constants). `fe-test-library.ts` depends on `fe-browser-scripts.ts` and `fe/types.ts`. Can run in parallel with most other batches.

**Phase 1 Infrastructure consumed by ALL modules:**

| Infrastructure  | Import                         | Usage                                           |
| --------------- | ------------------------------ | ----------------------------------------------- |
| Logging         | `#core/logging/logger.js`      | `createLogger('module-name')`                   |
| Telemetry       | `#core/telemetry/spans.js`     | `createSpanName`, `spanAttributes`              |
| Wait helpers    | `#core/utils/wait-helpers.js`  | `waitForUI5Stable`                              |
| Constants       | `#core/utils/constants.js`     | `DEFAULT_TIMEOUTS`                              |
| Error classes   | `#core/errors/*.js`            | `ControlError`, `ODataError`, `TimeoutError`    |
| Error codes     | `#core/errors/codes.js`        | `ERR_CONTROL_*`, `ERR_ODATA_*`, `ERR_TIMEOUT_*` |
| Selector types  | `#core/types/selectors.js`     | `UI5Selector` type                              |
| Config types    | `#core/config/schema.js`       | `PramanConfig` (readonly)                       |
| Control types   | `#core/types/controls.js`      | `UI5ControlBase`, typed interfaces              |
| Bridge types    | `#bridge/bridge-types.js`      | `BridgeControlRef`                              |
| Browser scripts | `#bridge/browser-scripts/*.js` | `createExecuteMethodScript`                     |
| Proxy           | `#proxy/control-proxy.js`      | `createControlProxy`                            |

**Dependency rules (enforced)**:

```
modules/*  → imports from #core/*, #bridge/*, #proxy/*, relative ../matchers/*  (no #matchers/* alias — use relative path)
fe/*       → imports from #core/*, #bridge/*, #proxy/*, relative ../modules/*
modules/*  → NEVER imports from fe/*
fe/*       → NEVER imports from fixtures/*
matchers/* → imports from #core/*, #bridge/*  (NEVER from modules/* or fe/*)
```

---

## 4. Design Flows

### 4.1 Table Row Access Flow

```
Test code                 Table Module                    Proxy/Bridge
─────────                 ────────────                    ────────────
getTableRows(page, id)
  │
  ├─► detectTableType(page, id)
  │     └─► page.evaluate(GET_CONTROL_TYPE_SCRIPT, id)
  │           returns 'sap.m.Table' | 'sap.ui.table.Table' | '...SmartTable'
  │
  ├─► [if SmartTable] unwrapSmartTable(page, id)
  │     └─► page.evaluate(SMART_TABLE_GET_INNER_SCRIPT, id)
  │           returns innerTableId
  │
  ├─► [sap.m.Table]    page.evaluate(GET_ITEMS_SCRIPT, tableId)
  │   [sap.ui.table.*] page.evaluate(GET_ROWS_SCRIPT, tableId)
  │     └─► returns BridgeControlRef[]
  │
  └─► map refs → createControlProxy(ref) for each
        returns readonly UI5ControlBase[]
```

### 4.2 Dialog Discovery Flow

```
Test code                 Dialog Module                   Bridge
─────────                 ─────────────                   ──────
waitForDialog(page, { title: 'Confirm' })
  │                                                                   <!-- REVIEW FIX: C4-PW (P22) — uses page.waitForFunction() NOT Node-side setTimeout loop -->
  ├─► page.waitForFunction(WAIT_FOR_DIALOG_SCRIPT, { title }, { timeout })
  │     └─► Browser-side polling predicate:
  │         sap.ui.getCore().getUIArea('sap-ui-static').getContent()
  │         filter: instanceof sap.m.Dialog && isOpen()
  │         [if title provided] filter by title match
  │         returns { id, controlType, title } when found, null otherwise
  │         (waitForFunction resolves when predicate returns truthy)
  │
  ├─► [if resolved] createControlProxy(ref)
  │     return proxy
  │
  └─► [if timeout] page.waitForFunction throws → catch and re-throw ControlError(ERR_CONTROL_NOT_FOUND)
```

### 4.3 Date Picker Set Value Flow

```
Test code                 Date Module                     Bridge
─────────                 ───────────                     ──────
setDatePickerValue(page, id, new Date('2024-03-15'))
  │
  ├─► getValueFormat(page, id)
  │     └─► page.evaluate(GET_PROPERTY_SCRIPT, { id, prop: 'valueFormat' })
  │           returns 'yyyy-MM-dd' (or custom format)
  │
  ├─► formatDateForUI5(date, valueFormat)
  │     └─► returns '2024-03-15'
  │
  ├─► page.evaluate(SET_VALUE_AND_FIRE_CHANGE_SCRIPT, { id, value: '2024-03-15' })
  │     └─► control.setValue(value); control.fireChange({ value, valid: true })
  │
  └─► waitForUI5Stable(page)
```

### 4.4 OData Model Data Access Flow

```
Test code                 OData Module                    Bridge/UI5
─────────                 ────────────                    ──────────
getModelData(page, controlId, '/Products')
  │
  ├─► page.evaluate(GET_BINDING_MODEL_DATA_SCRIPT, { controlId, path })
  │     └─► var ctrl = sap.ui.getCore().byId(controlId)
  │         var model = ctrl.getModel()
  │         return model.getProperty(path)  // reads from client model cache
  │           returns serializable JSON
  │
  └─► return parsed data (or throw ODataError on failure)


fetchCSRFToken(page, serviceUrl)                                    <!-- REVIEW FIX: C6-PW — uses page.request.head(), NOT synchronous XHR -->
  │
  ├─► page.request.head(serviceUrl, {
  │     headers: { 'X-CSRF-Token': 'Fetch' }
  │   })
  │     └─► Playwright sends HEAD request with browser cookies/auth context
  │         Response headers include 'x-csrf-token' value
  │
  ├─► const token = response.headers()['x-csrf-token']
  │
  ├─► [if token exists] return { token, serviceUrl }
  │
  └─► [if no token or error] throw ODataError(ERR_ODATA_CSRF)
```

### 4.5 Fiori Elements List Report Flow

```
Test code                       ListReport Module            Table Module
─────────                       ─────────────────            ────────────
getListReportTable(page)
  │
  ├─► discoverControl(page, { controlType: 'sap.ui.comp.smarttable.SmartTable' })
  │   OR discoverControl(page, { controlType: 'sap.ui.mdc.Table' })
  │     returns proxy
  │
  └─► return proxy (SmartTable/MDC — caller uses table module for row access)


executeSearch(page)
  │
  ├─► discoverControl(page, { controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar' })
  │   OR discoverControl(page, { controlType: 'sap.ui.mdc.FilterBar' })
  │
  ├─► proxy.search()  // SmartFilterBar.search() or FilterBar.search()
  │
  └─► waitForUI5Stable(page)
```

---

## 5. Sub-Phase 4.0 — Pre-requisites

### 5.1 File: `src/matchers/matcher-utils.ts`

**Purpose**: Extract shared browser-script helpers currently duplicated in `table-matchers.ts` and `ui5-matchers.ts`. Prevents a 3rd copy when Phase 4 modules need the same operations.

**Decision (P9)**: The two private functions `getControlProperty()` and `getControlAggregation()` have identical implementations in both matcher files. Extract to a shared internal module.

**Existing duplication identified:**

- `table-matchers.ts` lines ~20–50: `getControlProperty`, `getControlAggregation`
- `ui5-matchers.ts` lines ~15–40: `getControlProperty` (identical implementation)

````typescript
import type { BridgeControlRef } from '#bridge/bridge-types.js';
import { createExecuteMethodScript } from '#bridge/browser-scripts/execute-method.js';

/**
 * Read a property value from a UI5 control via bridge execution.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID
 * @param propertyName - Property to read (e.g., 'text', 'value', 'visible')
 * @returns The property value
 *
 * @example
 * ```typescript
 * const text = await getControlProperty(page, 'myButton', 'text');
 * ```
 */
export async function getControlProperty(
  page: MatcherPage,
  controlId: string,
  propertyName: string,
): Promise<unknown>;

/**
 * Read an aggregation from a UI5 control via bridge execution.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID
 * @param aggregationName - Aggregation to read (e.g., 'items', 'cells', 'rows')
 * @returns Array of control references with id and controlType
 *
 * @example
 * ```typescript
 * const items = await getControlAggregation(page, 'myTable', 'items');
 * ```
 */
export async function getControlAggregation(
  page: MatcherPage,
  controlId: string,
  aggregationName: string,
): Promise<readonly BridgeControlRef[]>;

/**
 * Minimal page interface for matcher operations.
 */
export interface MatcherPage {
  evaluate<R>(script: string, arg?: unknown): Promise<R>;
}
````

**Estimated LOC**: ~60
**Tests**: 8 test cases

**Unit Tests** (`tests/unit/matchers/matcher-utils.test.ts`):

| #   | Test Case                                                            | Input                                     | Expected                                                                                      |
| --- | -------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | getControlProperty returns string value                              | controlId='btn1', prop='text'             | 'Click Me'                                                                                    |
| 2   | getControlProperty returns boolean value                             | controlId='btn1', prop='visible'          | true                                                                                          |
| 3   | getControlProperty returns number value                              | controlId='input1', prop='maxLength'      | 40                                                                                            |
| 4   | getControlProperty returns undefined for missing                     | controlId='btn1', prop='nonExistent'      | undefined                                                                                     |
| 5   | getControlAggregation returns array of refs                          | controlId='table1', agg='items'           | `[{ id, controlType }]`                                                                       |
| 6   | getControlAggregation returns empty for no items                     | controlId='table1', agg='items'           | `[]`                                                                                          |
| 7   | getControlAggregation handles nested aggregations                    | controlId='row1', agg='cells'             | `[{ id, controlType }]`                                                                       |
| 8   | MatcherPage interface accepts minimal page object                    | `{ evaluate: vi.fn() }`                   | Type-checks successfully                                                                      |
| 9   | getControlProperty throws ControlError when page.evaluate rejects    | page.evaluate rejects (control not found) | throws ControlError with ERR_CONTROL_NOT_FOUND, `retryable: true` <!-- REVIEW FIX: C1-TDD --> |
| 10  | getControlAggregation throws ControlError when page.evaluate rejects | page.evaluate rejects (bridge error)      | throws ControlError with ERR_CONTROL_AGGREGATION <!-- REVIEW FIX: C1-TDD -->                  |
| 11  | getUI5BindingInfo throws ControlError when page.evaluate rejects     | page.evaluate rejects (control not found) | throws ControlError with ERR_CONTROL_NOT_FOUND <!-- REVIEW FIX: C1-TDD -->                    |
| 12  | getUI5ControlType throws ControlError when page.evaluate rejects     | page.evaluate rejects (control not found) | throws ControlError with ERR_CONTROL_NOT_FOUND <!-- REVIEW FIX: C1-TDD -->                    |

**Error handling specification (C1-TDD)**: All `matcher-utils.ts` functions wrap `page.evaluate()` calls in try/catch. On rejection, they throw `ControlError` (NOT raw error propagation). The ControlError includes `retryable: true` and the original error message in `details.cause`. This ensures matcher error messages are actionable (e.g., "Control 'myButton' not found") rather than raw browser exceptions.

**Refactoring**: After `matcher-utils.ts` is created, update `table-matchers.ts` and `ui5-matchers.ts` to import from it. This is a safe refactoring — the public API of both matcher files is unchanged.

### 5.2 New Matchers: `toHaveUI5Binding` + `toBeUI5ControlType` <!-- GAP FIX: added from dhikraft custom-matchers.ts:157-325 -->

**Purpose**: Two matchers identified in dhikraft parity review that are essential for FE testing assertions. Each requires a browser-side helper function extracted to `matcher-utils.ts`.

**Decision (P17)**: Add 2 matchers + 2 helper functions to the matcher-utils extraction.

#### Helper: `getUI5BindingInfo` (in `matcher-utils.ts`)

````typescript
/**
 * Get binding info for a property on a UI5 control.
 *
 * Runs in browser context via page.evaluate(). Returns the binding path,
 * model name, and current value for the specified property.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID
 * @param propertyName - Property to check binding for (e.g., 'value', 'text')
 * @returns Binding info or null if no binding exists
 *
 * @example
 * ```typescript
 * const info = await getUI5BindingInfo(page, 'myInput', 'value');
 * // info?.path === '/ProductName'
 * ```
 */
export async function getUI5BindingInfo(
  page: MatcherPage,
  controlId: string,
  propertyName: string,
): Promise<UI5BindingInfo | null>;

/**
 * Binding info returned from a UI5 control property.
 */
export interface UI5BindingInfo {
  /** The binding path (e.g., '/ProductName', 'Name') */
  readonly path: string;
  /** The model name (empty string for default model) */
  readonly model: string;
  /** The current bound value */
  readonly value: unknown;
}
````

#### Helper: `getUI5ControlType` (in `matcher-utils.ts`)

````typescript
/**
 * Get the full qualified control type name from a UI5 control.
 *
 * Runs in browser context via page.evaluate(). Uses getMetadata().getName().
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID
 * @returns Full control type string (e.g., 'sap.m.Button') or null if not found
 *
 * @example
 * ```typescript
 * const type = await getUI5ControlType(page, 'myButton');
 * // type === 'sap.m.Button'
 * ```
 */
export async function getUI5ControlType(
  page: MatcherPage,
  controlId: string,
): Promise<string | null>;
````

#### Matcher: `toHaveUI5Binding`

````typescript
/**
 * Assert that a UI5 control has a binding on a specified property.
 *
 * Optionally checks that the binding path matches an expected value.
 *
 * @example
 * ```typescript
 * await expect(inputProxy).toHaveUI5Binding('value');
 * await expect(inputProxy).toHaveUI5Binding('value', '/ProductName');
 * ```
 */
toHaveUI5Binding(propertyName: string, expectedPath?: string): Promise<void>;
````

#### Matcher: `toBeUI5ControlType`

````typescript
/**
 * Assert that a UI5 control is of a specific type.
 *
 * @example
 * ```typescript
 * await expect(buttonProxy).toBeUI5ControlType('sap.m.Button');
 * await expect(tableProxy).toBeUI5ControlType('sap.ui.table.Table');
 * ```
 */
toBeUI5ControlType(controlType: string): Promise<void>;
````

**Estimated additional LOC in `matcher-utils.ts`**: ~50 (helpers) + ~40 (matchers in existing matcher files)
**Updated total `matcher-utils.ts` LOC**: ~150

**New Unit Tests** (added to `tests/unit/matchers/matcher-utils.test.ts`):

| #   | Test Case                                           | Input                            | Expected                       |
| --- | --------------------------------------------------- | -------------------------------- | ------------------------------ |
| 9   | getUI5BindingInfo returns binding path and model    | controlId='input1', prop='value' | `{ path: '/Name', model: '' }` |
| 10  | getUI5BindingInfo returns null for unbound property | controlId='btn1', prop='text'    | null                           |
| 11  | getUI5ControlType returns full type string          | controlId='btn1'                 | 'sap.m.Button'                 |
| 12  | getUI5ControlType returns null for missing control  | controlId='nonExistent'          | null                           |

**Matcher Tests** (added to `tests/unit/matchers/ui5-matchers.test.ts`):

| #   | Test Case                                                              | Input                                                         | Expected                                                                                         |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| M1  | toHaveUI5Binding passes when binding exists                            | property='value', bound to '/Name'                            | passes                                                                                           |
| M2  | toHaveUI5Binding fails when no binding                                 | property='value', no binding                                  | fails with helpful message                                                                       |
| M3  | toHaveUI5Binding checks expected path                                  | property='value', expectedPath='/Name'                        | passes when path matches                                                                         |
| M4  | toBeUI5ControlType passes for matching type                            | controlType='sap.m.Button'                                    | passes                                                                                           |
| M5  | toHaveUI5Binding fails with path mismatch and shows expected vs actual | property='value', expectedPath='/Name', actual='/Description' | fails with message showing "Expected: /Name, Received: /Description" <!-- REVIEW FIX: C4-TDD --> |
| M6  | toHaveUI5Binding .not modifier passes when no binding                  | property='text', no binding exists                            | `.not.toHaveUI5Binding('text')` passes <!-- REVIEW FIX: C4-TDD -->                               |
| M7  | toBeUI5ControlType fails with helpful message showing actual type      | expected='sap.m.Button', actual='sap.m.Input'                 | fails with message "Expected: sap.m.Button, Received: sap.m.Input" <!-- REVIEW FIX: C4-TDD -->   |
| M8  | toBeUI5ControlType .not modifier passes for different type             | expected='sap.m.Button', actual='sap.m.Input'                 | `.not.toBeUI5ControlType('sap.m.Button')` passes <!-- REVIEW FIX: C4-TDD -->                     |

### 5.3 Matcher Type Augmentation (Deferred)

**Clarification**: Praman matchers (`toHaveUI5Text`, `toBeUI5Visible`, `toHaveUI5Binding`, etc.) are **UI5 API matchers** — they use `page.evaluate()` to call UI5 control APIs (`getText()`, `getVisible()`, `getBindingInfo()`) and return `MatcherResult` objects. They are NOT Playwright native matchers.

These matchers are registered via `expect.extend()` in the `matcherRegistration` worker fixture. TypeScript type augmentation for the matcher interface will be handled as part of the existing matcher registration in `core-fixtures.ts` — no separate `.d.ts` file is needed in Phase 4. The matcher functions themselves return `{ pass, message(), actual?, expected? }` which is the standard Playwright `expect.extend()` contract.

---

## 6. Sub-Phase 4.1 — Table Module

<!-- GAP FIX: Split into table.ts (~280 LOC core) + table-operations.ts (~250 LOC advanced ops) per P14 -->
<!-- GAP FIX: Plan4 originally had 9 functions. Dhikraft has 26. Added 11 high-priority + 6 medium-priority functions. -->

### 6.1 File: `src/modules/table.ts` (Core Table Operations)

**Purpose**: Provide core table operations that abstract over the three UI5 table variants (`sap.m.Table`, `sap.ui.table.Table`, `sap.ui.comp.smarttable.SmartTable`) and optionally `sap.ui.mdc.Table`. Users call a single function and the module auto-detects the variant.

**Decisions**: P1 (pure functions), P2 (minimal page interface), P3 (auto-detect variant), P4 (SmartTable unwrap), P12 (string scripts for browser context), P14 (table module split)

**Learnings from E2E gold standard**: The `bom-e2e-gold-standard.spec.ts` already proves the proxy chain `smartTable.getTable() → innerTable.getRows() → row.getBindingContext() → ctx.getObject()`. The table module wraps this chain into convenience functions.

**NOTE on binding length (grid tables)**: Dhikraft returns only visible rows for grid tables. Praman uses `getBinding('rows').getLength()` which returns the TOTAL row count including rows outside the viewport. This is the correct behavior for test assertions about data completeness.

**NOTE on SmartTable**: SmartTable unwrap via `getTable()` is handled by `detectTableType()` transparently. Dhikraft MISSES this — praman keeps it.

**Existing infrastructure consumed**:

- `getControlAggregation()` from `matchers/matcher-utils.ts` (Phase 4.0)
- `getControlProperty()` from `matchers/matcher-utils.ts`
- `createExecuteMethodScript()` from `#bridge/browser-scripts/execute-method.js`
- `createControlProxy()` from `#proxy/control-proxy.js`
- `waitForUI5Stable()` from `#core/utils/wait-helpers.js`
- `ControlError` from `#core/errors/control-error.js`
- `TimeoutError` from `#core/errors/timeout-error.js`
- `createLogger()` from `#core/logging/logger.js`
- `createSpanName()` from `#core/telemetry/spans.js`
- `DEFAULT_TIMEOUTS` from `#core/utils/constants.js`
- Typed interfaces: `UI5ControlBase`, `UI5Table`, `UI5GridTable`, `UI5SmartTable`, `UI5ListBase`

````typescript
import type { UI5ControlBase } from '#core/types/controls.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Supported table variant types.
 */
export type TableVariant =
  | 'sap.m.Table'
  | 'sap.ui.table.Table'
  | 'sap.ui.table.TreeTable'
  | 'sap.ui.table.AnalyticalTable'
  | 'sap.ui.comp.smarttable.SmartTable'
  | 'sap.ui.mdc.Table';

/**
 * Options for table operations.
 */
export interface TableOptions {
  /** Timeout in ms for discovery/wait operations. Default: DEFAULT_TIMEOUTS.CONTROL_DISCOVERY */
  readonly timeout?: number;
  /** Skip UI5 stability wait after mutating operations. Default: false */
  readonly skipStabilityWait?: boolean;
}

/**
 * Options for waitForTableData.
 */
export interface WaitForTableDataOptions extends TableOptions {
  /** Minimum number of rows expected. Default: 1 */
  readonly minRows?: number;
  /** Polling interval in ms. Default: DEFAULT_TIMEOUTS.POLLING_INTERVAL */
  readonly polling?: number;
}

/**
 * Result of table type detection.
 */
export interface TableInfo {
  /** The detected table variant */
  readonly variant: TableVariant;
  /** The effective table ID (inner table ID for SmartTable) */
  readonly effectiveId: string;
  /** Whether the table is wrapped in a SmartTable */
  readonly isSmartTable: boolean;
  /** The SmartTable ID (only set when isSmartTable is true) */
  readonly smartTableId?: string;
}

/**
 * Minimal page interface for table operations.
 */
export interface TablePage {
  evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>; // String scripts ONLY (P12)
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

// ─── Public Functions ────────────────────────────────────────────────

/**
 * Detect the table variant and resolve the effective table ID.
 * For SmartTable, returns the inner table's ID.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID of the table (or SmartTable)
 * @returns Table variant info including the effective (inner) table ID
 *
 * @example
 * ```typescript
 * const info = await detectTableType(page, 'app--smartTable');
 * // info.variant === 'sap.ui.table.Table'
 * // info.effectiveId === 'app--smartTable-innerTable'
 * // info.isSmartTable === true
 * ```
 */
export async function detectTableType(page: TablePage, tableId: string): Promise<TableInfo>;

/**
 * Get all rows from a table as control proxies.
 *
 * - `sap.m.Table` → calls `getItems()` (returns ColumnListItem proxies)
 * - `sap.ui.table.*` → calls `getRows()` (returns Row proxies)
 * - SmartTable → unwraps inner table first
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Optional timeout and stability wait settings
 * @returns Array of row control proxies
 *
 * @example
 * ```typescript
 * const rows = await getTableRows(page, 'app--productsTable');
 * expect(rows.length).toBeGreaterThan(0);
 * ```
 */
export async function getTableRows(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<readonly UI5ControlBase[]>;

/**
 * Get the number of rows in a table.
 *
 * For `sap.m.Table`, returns `getItems().length`.
 * For `sap.ui.table.*`, returns the binding length (total rows, not just visible).
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Optional settings
 * @returns Number of rows
 *
 * @example
 * ```typescript
 * const count = await getTableRowCount(page, 'app--ordersTable');
 * expect(count).toBe(25);
 * ```
 */
export async function getTableRowCount(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<number>;

/**
 * Get the text content of a specific table cell.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param rowIndex - Zero-based row index
 * @param columnIndex - Zero-based column index
 * @param options - Optional settings
 * @returns Cell text value
 *
 * @example
 * ```typescript
 * const name = await getTableCellValue(page, 'app--table', 0, 1);
 * expect(name).toBe('Product A');
 * ```
 */
export async function getTableCellValue(
  page: TablePage,
  tableId: string,
  rowIndex: number,
  columnIndex: number,
  options?: TableOptions,
): Promise<string>;

/**
 * Get the OData binding data for all rows as plain objects.
 *
 * Uses `getContextByIndex()` for grid tables, `getBindingContext()` for responsive tables.
 * Returns serializable JSON — no UI5 objects.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Optional settings
 * @returns Array of row data objects
 *
 * @example
 * ```typescript
 * const data = await getTableData(page, 'app--ordersTable');
 * expect(data[0]).toHaveProperty('OrderID');
 * ```
 */
export async function getTableData(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<readonly Record<string, unknown>[]>;

/**
 * Select a table row by index.
 *
 * - `sap.m.Table` → `setSelectedItem()` + fires `selectionChange`
 * - `sap.ui.table.*` → `setSelectionInterval(index, index)`
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param rowIndex - Zero-based row index
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * await selectTableRow(page, 'app--table', 2);
 * ```
 */
export async function selectTableRow(
  page: TablePage,
  tableId: string,
  rowIndex: number,
  options?: TableOptions,
): Promise<void>;

/**
 * Select all table rows.
 *
 * - `sap.m.Table` → `selectAll()` (ListBase method)
 * - `sap.ui.table.*` → `selectAll()`
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * await selectAllTableRows(page, 'app--table');
 * ```
 */
export async function selectAllTableRows(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<void>;

/**
 * Deselect all table rows.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Optional settings
 */
export async function deselectAllTableRows(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<void>;

/**
 * Wait until the table has loaded data (binding contexts exist).
 *
 * Uses `page.waitForFunction()` with a browser-side predicate that checks   <!-- REVIEW FIX: C4-PW (P22) -->
 * the table's row binding until at least `minRows` rows have data.
 * Does NOT use Node-side setTimeout polling loops.
 * Throws `TimeoutError(ERR_TIMEOUT_OPERATION)` if timeout expires.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Timeout, minRows, polling interval
 *
 * @example
 * ```typescript
 * await waitForTableData(page, 'app--table', { minRows: 5, timeout: 15000 });
 * ```
 */
export async function waitForTableData(
  page: TablePage,
  tableId: string,
  options?: WaitForTableDataOptions,
): Promise<void>;

/**
 * Get currently selected rows from a table.                          <!-- GAP FIX: added from dhikraft table.ts:930-975 -->
 *
 * - `sap.m.Table` → `getSelectedItems()`
 * - `sap.ui.table.*` → `getSelectedIndices()` → map to row refs
 *   Supports SelectionPlugin (sap.ui.table.plugins.MultiSelectionPlugin)
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Optional settings
 * @returns Array of selected row control proxies
 *
 * @example
 * ```typescript
 * await selectTableRow(page, 'app--table', 0);
 * await selectTableRow(page, 'app--table', 2);
 * const selected = await getSelectedRows(page, 'app--table');
 * expect(selected).toHaveLength(2);
 * ```
 */
export async function getSelectedRows(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<readonly UI5ControlBase[]>;
````

**Estimated LOC**: ~280
**Tests**: 36 test cases

**Unit Tests** (`tests/unit/modules/table.test.ts`):

| #   | Test Case                                              | Input / Scenario                       | Expected                                  |
| --- | ------------------------------------------------------ | -------------------------------------- | ----------------------------------------- |
| 1   | detectTableType identifies sap.m.Table                 | controlType = 'sap.m.Table'            | variant='sap.m.Table', isSmartTable=false |
| 2   | detectTableType identifies sap.ui.table.Table          | controlType = 'sap.ui.table.Table'     | variant='sap.ui.table.Table'              |
| 3   | detectTableType identifies SmartTable + unwraps        | controlType = '...SmartTable'          | isSmartTable=true, effectiveId=inner ID   |
| 4   | detectTableType identifies sap.ui.mdc.Table            | controlType = 'sap.ui.mdc.Table'       | variant='sap.ui.mdc.Table'                |
| 5   | detectTableType identifies TreeTable                   | controlType = 'sap.ui.table.TreeTable' | variant='sap.ui.table.TreeTable'          |
| 6   | detectTableType throws ControlError for non-table      | controlType = 'sap.m.Button'           | throws ERR_CONTROL_NOT_FOUND              |
| 7   | getTableRows returns items for sap.m.Table             | sap.m.Table with 3 items               | 3 proxy objects                           |
| 8   | getTableRows returns rows for sap.ui.table.Table       | grid table with 5 rows                 | 5 proxy objects                           |
| 9   | getTableRows unwraps SmartTable                        | SmartTable wrapping sap.ui.table.Table | returns inner table's rows                |
| 10  | getTableRows returns empty array for empty table       | table with 0 items                     | `[]`                                      |
| 11  | getTableRowCount returns items length for responsive   | sap.m.Table with 10 items              | 10                                        |
| 12  | getTableRowCount returns binding length for grid       | sap.ui.table.Table with 50 total rows  | 50 (not just visible)                     |
| 13  | getTableRowCount returns 0 for empty table             | no items                               | 0                                         |
| 14  | getTableCellValue returns text for responsive table    | row 0, col 1                           | 'Product A'                               |
| 15  | getTableCellValue returns text for grid table          | row 2, col 0                           | 'Order 123'                               |
| 16  | getTableCellValue throws for out-of-bounds row         | row 999                                | throws ERR_CONTROL_AGGREGATION            |
| 17  | getTableCellValue throws for out-of-bounds column      | col 999                                | throws ERR_CONTROL_AGGREGATION            |
| 18  | getTableData returns binding data for responsive table | 3 rows with OData bindings             | `[{ OrderID: '1', ... }, ...]`            |
| 19  | getTableData returns binding data for grid table       | uses getContextByIndex chain           | serializable JSON array                   |
| 20  | getTableData returns empty array for no data           | no binding contexts                    | `[]`                                      |
| 21  | selectTableRow selects by index (responsive)           | rowIndex=1                             | setSelectedItem called                    |
| 22  | selectTableRow selects by index (grid)                 | rowIndex=2                             | setSelectionInterval called               |
| 23  | selectTableRow throws for invalid index                | rowIndex=-1                            | throws ERR_CONTROL_AGGREGATION            |
| 24  | selectAllTableRows calls selectAll (responsive)        | sap.m.Table                            | selectAll called                          |
| 25  | selectAllTableRows calls selectAll (grid)              | sap.ui.table.Table                     | selectAll called                          |
| 26  | deselectAllTableRows clears selection                  | any variant                            | removeSelections/clearSelection called    |
| 27  | waitForTableData resolves when rows exist              | table has 3 rows immediately           | resolves without timeout                  |
| 28  | waitForTableData waits until minRows met               | starts 0, then 5 rows appear           | resolves after data loads                 |
| 29  | waitForTableData throws TimeoutError                   | never gets data                        | throws ERR_TIMEOUT_OPERATION              |
| 30  | waitForTableData respects custom timeout               | timeout=5000                           | uses 5000ms                               |
| 31  | getSelectedRows returns selected items (responsive)    | sap.m.Table with 2 selected            | 2 proxy objects                           |
| 32  | getSelectedRows returns selected indices (grid)        | sap.ui.table.Table with indices [0,2]  | 2 proxy objects                           |
| 33  | getSelectedRows with SelectionPlugin (grid)            | MultiSelectionPlugin installed         | reads from plugin                         |
| 34  | getSelectedRows returns empty when none selected       | no selection                           | `[]`                                      |
| 35  | all functions call waitForUI5Stable after mutations    | selectTableRow                         | waitForUI5Stable called                   |
| 36  | all functions skip stability wait when configured      | options.skipStabilityWait=true         | waitForUI5Stable NOT called               |

**Type Tests** (`tests/unit/modules/table.types.test.ts`):

| #   | Test Case                               | Assertion                                                |
| --- | --------------------------------------- | -------------------------------------------------------- |
| 1   | TableVariant is a string union          | `expectTypeOf<TableVariant>().toBeString()`              |
| 2   | TableInfo has required fields           | `expectTypeOf<TableInfo>().toHaveProperty('variant')`    |
| 3   | getTableRows returns readonly array     | Return type extends `readonly UI5ControlBase[]`          |
| 4   | TableOptions.timeout is optional number | `expectTypeOf<TableOptions['timeout']>().toBeNullable()` |

### 6.2 File: `src/modules/table-operations.ts` (Advanced Table Operations) <!-- GAP FIX: added from dhikraft table.ts — 11 high-priority + 6 medium-priority functions -->

**Purpose**: Provide advanced table operations: row search by values, cell access, cell editing, row clicking, row visibility scrolling, column filtering, sorting, and export. Split from `table.ts` per P14 to stay under 300 LOC.

**Decisions**: P1, P2, P3, P4, P12, P14 (split from table.ts)

**Imports from `table.ts`**: `detectTableType`, `TablePage`, `TableOptions`, `TableInfo`, `TableVariant`

````typescript
import type { UI5ControlBase } from '#core/types/controls.js';
import type { TablePage, TableOptions, TableInfo } from './table.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Column value criteria for finding rows.
 * Keys are column names (header text), values are expected cell values.
 */
export type ColumnValueCriteria = Readonly<Record<string, string>>;

/**
 * Options for filter operations.
 */
export interface TableFilterOptions extends TableOptions {
  /** Filter operator (e.g., 'EQ', 'Contains', 'BT'). Default: 'EQ' */
  readonly operator?: string;
}

/**
 * Options for sort operations.
 */
export interface TableSortOptions extends TableOptions {
  /** Sort descending. Default: false (ascending) */
  readonly descending?: boolean;
}

/**
 * Sort order info returned by getSortOrder.
 */
export interface SortOrderInfo {
  /** Column index that is sorted */
  readonly columnIndex: number;
  /** Column name/header text */
  readonly columnName: string;
  /** Sort direction */
  readonly descending: boolean;
}

/**
 * Export options for exportTableData.
 */
export interface TableExportOptions extends TableOptions {
  /** Export format. Default: 'csv' */
  readonly format?: 'csv' | 'xlsx';
  /** Include column headers. Default: true */
  readonly includeHeaders?: boolean;
  /** Columns to export (by index). Default: all */
  readonly columns?: readonly number[];
}

// ─── High Priority Functions ─────────────────────────────────────────

/**
 * Find a table row by matching column values.                        <!-- GAP FIX: added from dhikraft table.ts:170-214 -->
 *
 * Iterates visible rows, reads cell text for specified columns,
 * and returns the first row where ALL column values match.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param columnValues - Map of column name → expected value
 * @param options - Optional settings
 * @returns Control proxy for the matching row, or null if not found
 *
 * @example
 * ```typescript
 * const row = await findRowByValues(page, 'app--table', { 'Product': 'Widget A', 'Status': 'Active' });
 * ```
 */
export async function findRowByValues(
  page: TablePage,
  tableId: string,
  columnValues: ColumnValueCriteria,
  options?: TableOptions,
): Promise<UI5ControlBase | null>;

/**
 * Find the Nth matching row by column values.                       <!-- GAP FIX: added from dhikraft table.ts:233-282 -->
 *
 * Like findRowByValues but returns the Nth occurrence (0-indexed).
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param columnValues - Map of column name → expected value
 * @param occurrenceIndex - Zero-based occurrence index
 * @param options - Optional settings
 * @returns Control proxy for the matching row
 *
 * @example
 * ```typescript
 * const secondMatch = await findRowByValuesAtIndex(page, 'app--table', { 'Status': 'Active' }, 1);
 * ```
 */
export async function findRowByValuesAtIndex(
  page: TablePage,
  tableId: string,
  columnValues: ColumnValueCriteria,
  occurrenceIndex: number,
  options?: TableOptions,
): Promise<UI5ControlBase | null>;

/**
 * Get all cells from a table row.                                    <!-- GAP FIX: added from dhikraft table.ts:305-321 -->
 *
 * - `sap.m.Table` → row.getCells()
 * - `sap.ui.table.*` → row.getCells()
 *
 * @param page - Page with evaluate capability
 * @param rowProxy - Control proxy for the row (from getTableRows)
 * @returns Array of cell control proxies
 *
 * @example
 * ```typescript
 * const rows = await getTableRows(page, 'app--table');
 * const cells = await getCells(page, rows[0]);
 * ```
 */
export async function getCells(
  page: TablePage,
  rowProxy: UI5ControlBase,
): Promise<readonly UI5ControlBase[]>;

/**
 * Get a specific cell from a row by column index.                    <!-- GAP FIX: added from dhikraft table.ts:351-366 -->
 *
 * @param page - Page with evaluate capability
 * @param rowProxy - Control proxy for the row
 * @param columnIndex - Zero-based column index
 * @returns Control proxy for the cell
 *
 * @example
 * ```typescript
 * const cell = await getCell(page, rows[0], 2);
 * ```
 */
export async function getCell(
  page: TablePage,
  rowProxy: UI5ControlBase,
  columnIndex: number,
): Promise<UI5ControlBase>;

/**
 * Extract the text value from a table cell.                          <!-- GAP FIX: added from dhikraft table.ts:404-437 -->
 *
 * Reads text from the cell control. Handles common cell controls:
 * sap.m.Text, sap.m.Label, sap.m.Link, sap.m.ObjectIdentifier,
 * sap.m.ObjectNumber, sap.ui.comp.smartfield.SmartField (inner control text).
 *
 * @param page - Page with evaluate capability
 * @param cellProxy - Control proxy for the cell
 * @returns Cell text value
 *
 * @example
 * ```typescript
 * const cell = await getCell(page, rows[0], 1);
 * const value = await getCellValue(page, cell);
 * ```
 */
export async function getCellValue(page: TablePage, cellProxy: UI5ControlBase): Promise<string>;

/**
 * Get column header names from a table.                              <!-- GAP FIX: added from dhikraft table.ts:496-524 -->
 *
 * - `sap.m.Table` → reads from `getColumns()` → column.getHeader().getText()
 * - `sap.ui.table.*` → reads from `getColumns()` → column.getLabel().getText()
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Optional settings
 * @returns Array of column header texts
 *
 * @example
 * ```typescript
 * const columns = await getColumnNames(page, 'app--table');
 * expect(columns).toContain('Product Name');
 * ```
 */
export async function getColumnNames(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<readonly string[]>;

/**
 * Edit a cell value in a table row.                                  <!-- GAP FIX: added from dhikraft table.ts:649-726 -->
 *
 * Finds the cell by row index and column name, determines the inner
 * editable control (Input, DatePicker, Select, etc.), and sets the value.
 * Fires the appropriate change event.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param rowIndex - Zero-based row index
 * @param columnName - Column header text to identify the column
 * @param value - Value to set
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * await setTableValue(page, 'app--table', 0, 'Quantity', '10');
 * ```
 */
export async function setTableValue(
  page: TablePage,
  tableId: string,
  rowIndex: number,
  columnName: string,
  value: string,
  options?: TableOptions,
): Promise<void>;

/**
 * Click/press a table row.                                           <!-- GAP FIX: added from dhikraft table.ts:810-826 -->
 *
 * Fires the press/cellClick event on the row. For sap.m.Table rows
 * (ColumnListItem), fires 'press'. For grid table rows, fires 'cellClick'
 * on the table with rowIndex parameter.
 *
 * @param page - Page with evaluate capability
 * @param rowProxy - Control proxy for the row
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * const rows = await getTableRows(page, 'app--table');
 * await clickRow(page, rows[0]);
 * ```
 */
export async function clickRow(
  page: TablePage,
  rowProxy: UI5ControlBase,
  options?: TableOptions,
): Promise<void>;

/**
 * Select a row by matching column values.                            <!-- GAP FIX: added from dhikraft table.ts:1042-1052 -->
 *
 * Combines findRowByValues + selection. Finds the row matching the
 * criteria and selects it.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param values - Column value criteria
 * @param occurrenceIndex - Zero-based occurrence index. Default: 0
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * await selectRowByValues(page, 'app--table', { 'Status': 'Active' });
 * ```
 */
export async function selectRowByValues(
  page: TablePage,
  tableId: string,
  values: ColumnValueCriteria,
  occurrenceIndex?: number,
  options?: TableOptions,
): Promise<void>;

/**
 * Ensure a row at a given index is visible (scrolled into view).     <!-- GAP FIX: added from dhikraft table.ts:1616-1644 -->
 *
 * For `sap.ui.table.*` (virtualized tables), calls `setFirstVisibleRow()`
 * to scroll the row into the viewport. For `sap.m.Table` (non-virtualized),
 * scrolls the container DOM element.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param index - Zero-based row index to make visible
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * await ensureRowVisible(page, 'app--gridTable', 50);
 * const data = await getTableCellValue(page, 'app--gridTable', 50, 0);
 * ```
 */
export async function ensureRowVisible(
  page: TablePage,
  tableId: string,
  index: number,
  options?: TableOptions,
): Promise<void>;

// ─── Medium Priority Functions ───────────────────────────────────────

/**
 * Filter a table column by value.                                    <!-- GAP FIX: added from dhikraft table.ts:1239-1300 -->
 *
 * For `sap.ui.table.*`, uses the Column's filter mechanism.
 * For `sap.m.Table`, applies a Filter to the binding.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param columnIndex - Zero-based column index
 * @param filterValue - Value to filter by
 * @param options - Optional filter operator and settings
 *
 * @example
 * ```typescript
 * await filterByColumn(page, 'app--table', 2, 'Active', { operator: 'EQ' });
 * ```
 */
export async function filterByColumn(
  page: TablePage,
  tableId: string,
  columnIndex: number,
  filterValue: string,
  options?: TableFilterOptions,
): Promise<void>;

/**
 * Sort a table column.                                               <!-- GAP FIX: added from dhikraft table.ts:1407-1453 -->
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param columnIndex - Zero-based column index
 * @param options - Optional descending flag and settings
 *
 * @example
 * ```typescript
 * await sortByColumn(page, 'app--table', 0, { descending: true });
 * ```
 */
export async function sortByColumn(
  page: TablePage,
  tableId: string,
  columnIndex: number,
  options?: TableSortOptions,
): Promise<void>;

/**
 * Get the current sort order of a table column.                      <!-- GAP FIX: added from dhikraft table.ts:1319-1343 -->
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param columnIndex - Zero-based column index
 * @returns Sort order info, or null if column is not sorted
 */
export async function getSortOrder(
  page: TablePage,
  tableId: string,
  columnIndex: number,
): Promise<SortOrderInfo | null>;

/**
 * Get the current filter value of a table column.                    <!-- GAP FIX: added from dhikraft table.ts:1364-1388 -->
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param columnIndex - Zero-based column index
 * @returns Filter value string, or null if not filtered
 */
export async function getFilterValue(
  page: TablePage,
  tableId: string,
  columnIndex: number,
): Promise<string | null>;

/**
 * Export table data to a structured format.                          <!-- GAP FIX: added from dhikraft table.ts:1507-1590 -->
 *
 * Reads all visible rows and columns, returning data as an array of
 * objects keyed by column header text.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Export format, columns, headers
 * @returns Array of row data objects
 *
 * @example
 * ```typescript
 * const data = await exportTableData(page, 'app--table');
 * // [{ 'Product': 'Widget A', 'Status': 'Active' }, ...]
 * ```
 */
export async function exportTableData(
  page: TablePage,
  tableId: string,
  options?: TableExportOptions,
): Promise<readonly Record<string, string>[]>;

/**
 * Click the Table Settings button (personalization/variant).          <!-- GAP FIX: added from dhikraft table.ts:1665-1732 -->
 *
 * Finds and clicks the settings button (gear icon) on the table toolbar.
 * Works with SmartTable toolbar and sap.ui.table.Table toolbar.
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param options - Optional settings
 */
export async function clickTableSettingsButton(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<void>;
````

**Estimated LOC**: ~250
**Tests**: 34 test cases

**Unit Tests** (`tests/unit/modules/table-operations.test.ts`):

| #   | Test Case                                            | Input / Scenario                              | Expected                                     |
| --- | ---------------------------------------------------- | --------------------------------------------- | -------------------------------------------- |
| 1   | findRowByValues finds matching row                   | { 'Product': 'Widget A' }                     | returns row proxy                            |
| 2   | findRowByValues returns null when no match           | { 'Product': 'NonExistent' }                  | null                                         |
| 3   | findRowByValues matches multiple columns             | { 'Product': 'A', 'Status': 'Active' }        | returns row where both match                 |
| 4   | findRowByValuesAtIndex returns Nth match             | values + occurrenceIndex=1                    | returns 2nd matching row                     |
| 5   | findRowByValuesAtIndex returns null for out-of-range | occurrenceIndex=99                            | null                                         |
| 6   | getCells returns all cells from responsive row       | sap.m.ColumnListItem with 4 cells             | 4 proxy objects                              |
| 7   | getCells returns all cells from grid row             | sap.ui.table.Row with 3 cells                 | 3 proxy objects                              |
| 8   | getCell returns specific cell by index               | columnIndex=2                                 | cell proxy at index 2                        |
| 9   | getCell throws for out-of-bounds                     | columnIndex=99                                | throws ERR_CONTROL_AGGREGATION               |
| 10  | getCellValue reads text from sap.m.Text              | cell is sap.m.Text                            | 'Widget A'                                   |
| 11  | getCellValue reads text from sap.m.Link              | cell is sap.m.Link                            | 'Order 123'                                  |
| 12  | getCellValue reads from SmartField inner control     | cell is SmartField wrapping Input             | inner input value                            |
| 13  | getCellValue reads from ObjectIdentifier             | cell is sap.m.ObjectIdentifier                | title text                                   |
| 14  | getColumnNames returns header texts (responsive)     | sap.m.Table with 3 columns                    | ['Name', 'Status', 'Price']                  |
| 15  | getColumnNames returns label texts (grid)            | sap.ui.table.Table with 3 columns             | ['Name', 'Status', 'Price']                  |
| 16  | getColumnNames returns empty for no columns          | table with 0 columns                          | `[]`                                         |
| 17  | setTableValue sets input value by column name        | rowIndex=0, columnName='Quantity', value='10' | value set on editable control                |
| 18  | setTableValue fires change event                     | valid edit                                    | fireChange called                            |
| 19  | setTableValue throws for read-only cell              | non-editable cell                             | throws ControlError                          |
| 20  | setTableValue throws for invalid column name         | columnName='NonExistent'                      | throws ERR_CONTROL_NOT_FOUND                 |
| 21  | clickRow fires press on ColumnListItem               | responsive table row                          | press event fired                            |
| 22  | clickRow fires cellClick on grid table               | grid table row                                | cellClick event fired                        |
| 23  | selectRowByValues finds and selects row              | { 'Status': 'Active' }                        | row found and selected                       |
| 24  | selectRowByValues with occurrence index              | occurrenceIndex=1                             | selects 2nd match                            |
| 25  | selectRowByValues throws when not found              | no matching row                               | throws ERR_CONTROL_NOT_FOUND                 |
| 26  | ensureRowVisible scrolls grid table                  | index=50 on grid table                        | setFirstVisibleRow called                    |
| 27  | ensureRowVisible scrolls responsive table container  | index=20 on sap.m.Table                       | DOM scroll called                            |
| 28  | filterByColumn applies EQ filter                     | columnIndex=2, filterValue='Active'           | filter applied to binding                    |
| 29  | filterByColumn uses custom operator                  | operator='Contains'                           | Contains filter applied                      |
| 30  | sortByColumn sorts ascending (default)               | columnIndex=0                                 | ascending sort applied                       |
| 31  | sortByColumn sorts descending                        | descending=true                               | descending sort applied                      |
| 32  | getSortOrder returns sort info                       | column 0 sorted ascending                     | `{ columnIndex: 0, descending: false }`      |
| 33  | getSortOrder returns null for unsorted column        | column 1 not sorted                           | null                                         |
| 34  | getFilterValue returns filter string                 | column 2 filtered by 'Active'                 | 'Active'                                     |
| 35  | getFilterValue returns null for unfiltered           | column 0 not filtered                         | null                                         |
| 36  | exportTableData returns all rows as objects          | 3 rows, 2 columns                             | `[{ 'Name': 'A', 'Status': 'Active' }, ...]` |
| 37  | exportTableData respects column selection            | columns=[0,2]                                 | only selected columns in output              |
| 38  | clickTableSettingsButton clicks settings gear        | SmartTable with toolbar                       | settings button pressed                      |

**Type Tests** (`tests/unit/modules/table-operations.types.test.ts`):

| #   | Test Case                                     | Assertion                                                                |
| --- | --------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | ColumnValueCriteria is Record<string, string> | `expectTypeOf<ColumnValueCriteria>().toExtend<Record<string, string>>()` |
| 2   | SortOrderInfo has required fields             | `expectTypeOf<SortOrderInfo>().toHaveProperty('descending')`             |
| 3   | TableFilterOptions extends TableOptions       | `expectTypeOf<TableFilterOptions>().toExtend<TableOptions>()`            |

---

## 7. Sub-Phase 4.2 — Dialog Module

### 7.1 File: `src/modules/dialog.ts`

**Purpose**: Provide dialog discovery, waiting, and interaction functions. Handles `sap.m.Dialog`, `sap.m.Popover`, `sap.ui.comp.valuehelpdialog.ValueHelpDialog`, `sap.m.MessageBox`, and message toast detection.

**Decisions**: P1, P2, P6 (searchOpenDialogs), P12 (string scripts)

**Key insight**: UI5 dialogs are not in the normal view tree. They are added to a special static UI area (`sap-ui-static`). The `searchOpenDialogs: true` selector flag tells RecordReplay to look in this area. The dialog module's browser scripts query `sap.ui.getCore().getUIArea('sap-ui-static').getContent()`.

````typescript
import type { UI5ControlBase } from '#core/types/controls.js';

// ─── Constants ────────────────────────────────────────────────────────

/**
 * Supported dialog control types.                                    <!-- GAP FIX: added from dhikraft dialog-helpers.ts:37-46 -->
 *
 * The dialog module searches for these control types when discovering
 * open dialogs in the static UI area.
 */
export const DIALOG_CONTROL_TYPES = [
  'sap.m.Dialog',
  'sap.m.Popover',
  'sap.m.ResponsivePopover',
  'sap.m.MessageBox',
  'sap.m.BusyDialog',
  'sap.m.SelectDialog',
  'sap.m.TableSelectDialog',
  'sap.m.ViewSettingsDialog',
  'sap.ui.comp.valuehelpdialog.ValueHelpDialog',
  'sap.ui.comp.p13n.P13nDialog',
] as const;

/**
 * Type derived from the DIALOG_CONTROL_TYPES constant.
 */
export type DialogControlType = (typeof DIALOG_CONTROL_TYPES)[number];

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Options for dialog operations.
 */
export interface DialogOptions {
  /** Timeout in ms for waiting operations. Default: DEFAULT_TIMEOUTS.CONTROL_DISCOVERY */
  readonly timeout?: number;
  /** Polling interval in ms. Default: DEFAULT_TIMEOUTS.POLLING_INTERVAL */
  readonly polling?: number;
  /** Skip UI5 stability wait after close/dismiss. Default: false */
  readonly skipStabilityWait?: boolean;
}

/**
 * Options for finding a specific dialog.
 */
export interface FindDialogOptions extends DialogOptions {
  /** Title text to match (exact match). */
  readonly title?: string;
  /** Control type to match. Default: matches any dialog type. */
  readonly controlType?: string;
}

/**
 * Info about an open dialog.
 */
export interface DialogInfo {
  readonly id: string;
  readonly controlType: string;
  readonly title: string;
  readonly isOpen: boolean;
}

/**
 * Minimal page interface for dialog operations.
 */
export interface DialogPage {
  evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>; // String scripts ONLY (P12)
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

// ─── Public Functions ────────────────────────────────────────────────

/**
 * Wait for a dialog to open, optionally matching by title.
 * Returns a control proxy for the dialog.
 *
 * Uses `page.waitForFunction()` with a browser-side predicate (P22).         <!-- REVIEW FIX: C4-PW -->
 * Does NOT use Node-side setTimeout polling loops.
 * Throws `ControlError(ERR_CONTROL_NOT_FOUND)` if no matching dialog opens within timeout.
 *
 * @param page - Page with evaluate capability
 * @param options - Title filter, timeout, polling interval
 * @returns Control proxy for the dialog
 *
 * @example
 * ```typescript
 * const dialog = await waitForDialog(page, { title: 'Confirm Delete' });
 * const title = await dialog.getTitle();
 * ```
 */
export async function waitForDialog(
  page: DialogPage,
  options?: FindDialogOptions,
): Promise<UI5ControlBase>;

/**
 * Get all currently open dialogs.
 *
 * @param page - Page with evaluate capability
 * @returns Array of dialog info objects (not proxies — lightweight discovery)
 *
 * @example
 * ```typescript
 * const dialogs = await getOpenDialogs(page);
 * expect(dialogs).toHaveLength(1);
 * ```
 */
export async function getOpenDialogs(page: DialogPage): Promise<readonly DialogInfo[]>;

/**
 * Check if a specific dialog is currently open.
 *
 * @param page - Page with evaluate capability
 * @param dialogId - UI5 control ID of the dialog
 * @returns true if the dialog exists and isOpen() returns true
 *
 * @example
 * ```typescript
 * const open = await isDialogOpen(page, 'app--confirmDialog');
 * expect(open).toBe(true);
 * ```
 */
export async function isDialogOpen(page: DialogPage, dialogId: string): Promise<boolean>;

/**
 * Dismiss (close) a dialog. If no dialogId provided, closes the topmost open dialog.
 *
 * Calls `close()` on the dialog control. Waits for UI5 stability after close.
 *
 * @param page - Page with evaluate capability
 * @param options - Dialog title or ID filter, stability wait settings
 *
 * @example
 * ```typescript
 * await dismissDialog(page, { title: 'Error' });
 * ```
 */
export async function dismissDialog(page: DialogPage, options?: FindDialogOptions): Promise<void>;

/**
 * Confirm a dialog by clicking the primary action button.
 *
 * Finds the dialog (by title or topmost), then finds and clicks the `beginButton`
 * or first button matching common confirm labels ('OK', 'Yes', 'Confirm', 'Save').
 *
 * @param page - Page with evaluate capability
 * @param options - Dialog filter, optional buttonText override
 *
 * @example
 * ```typescript
 * await confirmDialog(page, { title: 'Save Changes' });
 * ```
 */
export async function confirmDialog(
  page: DialogPage,
  options?: FindDialogOptions & { readonly buttonText?: string },
): Promise<void>;

/**
 * Wait for a dialog to close.
 *
 * Uses `page.waitForFunction()` with a browser-side predicate (P22).         <!-- REVIEW FIX: C4-PW -->
 *
 * @param page - Page with evaluate capability
 * @param dialogId - UI5 control ID of the dialog to watch
 * @param options - Timeout settings
 *
 * @example
 * ```typescript
 * await dismissDialog(page);
 * await waitForDialogClosed(page, 'app--confirmDialog');
 * ```
 */
export async function waitForDialogClosed(
  page: DialogPage,
  dialogId: string,
  options?: DialogOptions,
): Promise<void>;

/**
 * Get all buttons from a dialog.                                     <!-- GAP FIX: added from dhikraft dialog-helpers.ts:288-330 -->
 *
 * Returns info about all buttons in the dialog's footer area
 * (beginButton, endButton, and any buttons in the button aggregation).
 * If no dialogId is provided, uses the topmost open dialog.
 *
 * @param page - Page with evaluate capability
 * @param dialogId - Optional UI5 control ID of a specific dialog
 * @returns Array of dialog button info objects
 *
 * @example
 * ```typescript
 * const buttons = await getDialogButtons(page, 'app--confirmDialog');
 * expect(buttons).toContainEqual(expect.objectContaining({ text: 'OK' }));
 * ```
 */
export async function getDialogButtons(
  page: DialogPage,
  dialogId?: string,
): Promise<readonly DialogButtonInfo[]>;

/**
 * Info about a button in a dialog.
 */
export interface DialogButtonInfo {
  /** Button text label */
  readonly text: string;
  /** UI5 control ID of the button */
  readonly id: string;
  /** Button type (e.g., 'Emphasized', 'Default', 'Accept', 'Reject') */
  readonly type?: string;
  /** Whether the button is enabled */
  readonly enabled: boolean;
}
````

**Estimated LOC**: ~230
**Tests**: 26 test cases

**Unit Tests** (`tests/unit/modules/dialog.test.ts`):

| #   | Test Case                                           | Input / Scenario                   | Expected                                            |
| --- | --------------------------------------------------- | ---------------------------------- | --------------------------------------------------- |
| 1   | waitForDialog returns proxy when dialog is open     | dialog exists immediately          | returns UI5ControlBase proxy                        |
| 2   | waitForDialog waits until dialog opens              | dialog opens after 500ms           | resolves after dialog appears                       |
| 3   | waitForDialog filters by title                      | title='Confirm', 2 dialogs open    | returns matching dialog                             |
| 4   | waitForDialog filters by controlType                | controlType='sap.m.Dialog'         | returns matching dialog                             |
| 5   | waitForDialog throws ControlError on timeout        | no dialog opens                    | throws ERR_CONTROL_NOT_FOUND                        |
| 6   | waitForDialog uses custom timeout                   | timeout=5000                       | uses 5000ms                                         |
| 7   | getOpenDialogs returns empty when none open         | no dialogs                         | `[]`                                                |
| 8   | getOpenDialogs returns all open dialogs             | 2 dialogs open                     | 2 DialogInfo objects                                |
| 9   | getOpenDialogs returns title and controlType        | dialog with title 'Edit'           | title='Edit'                                        |
| 10  | isDialogOpen returns true when open                 | dialog isOpen()=true               | true                                                |
| 11  | isDialogOpen returns false when closed              | dialog isOpen()=false              | false                                               |
| 12  | isDialogOpen returns false when not found           | dialogId doesn't exist             | false                                               |
| 13  | dismissDialog closes topmost dialog                 | one dialog open, no filter         | close() called                                      |
| 14  | dismissDialog closes by title                       | title='Error'                      | correct dialog closed                               |
| 15  | dismissDialog waits for UI5 stability               | default options                    | waitForUI5Stable called                             |
| 16  | dismissDialog throws when no dialog found           | no matching dialog                 | throws ERR_CONTROL_NOT_FOUND                        |
| 17  | confirmDialog clicks beginButton                    | dialog has beginButton             | beginButton.press() called                          |
| 18  | confirmDialog matches button by text                | buttonText='Yes'                   | finds and clicks 'Yes' button                       |
| 19  | confirmDialog uses default confirm labels           | buttons: ['Cancel', 'OK']          | clicks 'OK'                                         |
| 20  | confirmDialog throws when no button found           | no matching button                 | throws ERR_CONTROL_NOT_FOUND                        |
| 21  | waitForDialogClosed resolves when closed            | dialog closes                      | resolves                                            |
| 22  | waitForDialogClosed throws TimeoutError             | dialog stays open                  | throws ERR_TIMEOUT_OPERATION                        |
| 23  | getDialogButtons returns all buttons from dialog    | dialog has beginButton + endButton | 2 DialogButtonInfo objects                          |
| 24  | getDialogButtons includes type and enabled status   | Emphasized OK button               | `{ text: 'OK', type: 'Emphasized', enabled: true }` |
| 25  | getDialogButtons returns empty for no-button dialog | dialog with no buttons             | `[]`                                                |
| 26  | getDialogButtons uses topmost dialog when no ID     | no dialogId, 1 dialog open         | returns buttons from topmost                        |
| 27  | DIALOG_CONTROL_TYPES contains sap.m.Dialog          | constant check                     | includes 'sap.m.Dialog'                             |
| 28  | DIALOG_CONTROL_TYPES contains ValueHelpDialog       | constant check                     | includes VHD type                                   |

---

## 8. Sub-Phase 4.3 — Date Module

### 8.1 File: `src/modules/date.ts`

**Purpose**: Provide date/time picker value management with automatic format conversion. Accepts standard JavaScript `Date` objects and ISO-8601 strings, converts to the control's `valueFormat` before setting.

**Decisions**: P1, P2, P7 (Date + ISO input, auto-format), P12

**Key insight**: `sap.m.DatePicker.setValue()` expects the date string in the control's `valueFormat` (default: `yyyy-MM-dd`). Setting a value in the wrong format causes silent failure — the picker shows an invalid date. The module reads the `valueFormat` property, converts, then sets.

````typescript
// ─── Constants ────────────────────────────────────────────────────────

/**
 * Common date format patterns used in SAP UI5 applications.           <!-- GAP FIX: added from dhikraft date-types.ts:20-31 -->
 */
export const DATE_FORMATS = {
  /** ISO 8601 format: 2024-03-15 */
  ISO: 'yyyy-MM-dd',
  /** SAP internal format: 20240315 */
  SAP_INTERNAL: 'yyyyMMdd',
  /** European format: 15.03.2024 */
  EUROPEAN: 'dd.MM.yyyy',
  /** US format: 03/15/2024 */
  US: 'MM/dd/yyyy',
  /** Japanese format: 2024/03/15 */
  JAPANESE: 'yyyy/MM/dd',
} as const;

/**
 * Type derived from DATE_FORMATS values.
 */
export type DateFormatPattern = (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS];

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Date input accepted by the date module.
 * - `Date` object: converted to the control's valueFormat
 * - `string`: ISO-8601 format ('2024-03-15') or pre-formatted for the control
 */
export type DateInput = Date | string;

/**
 * Options for date operations.
 */
export interface DateOptions {
  /** Timeout in ms. Default: DEFAULT_TIMEOUTS.CONTROL_DISCOVERY */
  readonly timeout?: number;
  /** Skip UI5 stability wait after setting value. Default: false */
  readonly skipStabilityWait?: boolean;
  /** Locale for date formatting (e.g., 'en-US', 'de-DE'). Uses control's locale if not set. */
  readonly locale?: string; // <!-- GAP FIX: added from dhikraft ui5-date-handler.ts:375-378 -->
  /** IANA timezone (e.g., 'Europe/Berlin', 'America/New_York'). Uses browser timezone if not set. */
  readonly timezone?: string; // <!-- GAP FIX: added from dhikraft date-types.ts:50-61 -->
}

/**
 * Result of reading a date range selection.                           <!-- GAP FIX: added from dhikraft ui5-date-handler.ts:452-473 -->
 */
export interface DateRangeResult {
  /** Start date in the control's valueFormat */
  readonly startDate: string;
  /** End date in the control's valueFormat */
  readonly endDate: string;
}

/**
 * Minimal page interface for date operations.
 */
export interface DatePage {
  evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>; // String scripts ONLY (P12)
}

// ─── Public Functions ────────────────────────────────────────────────

/**
 * Set the value of a DatePicker control.
 *
 * Reads the control's `valueFormat`, converts the input date accordingly,
 * then calls `setValue()` and fires `change` event.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID of the DatePicker
 * @param date - Date value (Date object or ISO string)
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * await setDatePickerValue(page, 'app--startDate', new Date('2024-03-15'));
 * await setDatePickerValue(page, 'app--endDate', '2024-12-31');
 * ```
 */
export async function setDatePickerValue(
  page: DatePage,
  controlId: string,
  date: DateInput,
  options?: DateOptions,
): Promise<void>;

/**
 * Get the current value of a DatePicker control.
 *
 * Returns the value in the control's `valueFormat`.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID
 * @returns Date string in the control's valueFormat
 *
 * @example
 * ```typescript
 * const value = await getDatePickerValue(page, 'app--startDate');
 * expect(value).toBe('2024-03-15');
 * ```
 */
export async function getDatePickerValue(page: DatePage, controlId: string): Promise<string>;

/**
 * Set both dates of a DateRangeSelection control.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID
 * @param startDate - Start date
 * @param endDate - End date
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * await setDateRangeSelection(page, 'app--range', '2024-01-01', '2024-12-31');
 * ```
 */
export async function setDateRangeSelection(
  page: DatePage,
  controlId: string,
  startDate: DateInput,
  endDate: DateInput,
  options?: DateOptions,
): Promise<void>;

/**
 * Set the value of a TimePicker control.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID
 * @param time - Time string in HH:mm or HH:mm:ss format
 * @param options - Optional settings
 *
 * @example
 * ```typescript
 * await setTimePickerValue(page, 'app--startTime', '14:30');
 * ```
 */
export async function setTimePickerValue(
  page: DatePage,
  controlId: string,
  time: string,
  options?: DateOptions,
): Promise<void>;

/**
 * Get the current value of a TimePicker control.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID
 * @returns Time string in the control's valueFormat
 */
export async function getTimePickerValue(page: DatePage, controlId: string): Promise<string>;

/**
 * Format a Date object into a UI5 date format string.
 *
 * Supports common UI5 patterns: yyyy-MM-dd, dd.MM.yyyy, MM/dd/yyyy, yyyyMMdd.
 *
 * @param date - JavaScript Date object
 * @param format - UI5 date format pattern
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDateForUI5(new Date('2024-03-15'), 'yyyy-MM-dd'); // '2024-03-15'
 * formatDateForUI5(new Date('2024-03-15'), 'dd.MM.yyyy'); // '15.03.2024'
 * ```
 */
export function formatDateForUI5(date: Date, format: string): string;

/**
 * Get both date values from a DateRangeSelection control.            <!-- GAP FIX: added from dhikraft ui5-date-handler.ts:452-473 -->
 *
 * Reads `getFrom()` and `getTo()` (DateRangeSelection-specific API, not
 * available on DatePicker). Returns both dates in the control's valueFormat.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID of the DateRangeSelection
 * @returns Start and end date strings
 *
 * @example
 * ```typescript
 * const range = await getDateRangeSelection(page, 'app--dateRange');
 * expect(range.startDate).toBe('2024-01-01');
 * expect(range.endDate).toBe('2024-12-31');
 * ```
 */
export async function getDateRangeSelection(
  page: DatePage,
  controlId: string,
): Promise<DateRangeResult>;

/**
 * Set a date and validate it was accepted by the control.            <!-- GAP FIX: added from dhikraft ui5-date-handler.ts:505-512 -->
 *
 * Sets the value and then reads it back to confirm the control accepted
 * the date (not flagged as invalid). Throws ControlError if the control
 * reports the value as invalid (e.g., date outside min/max range).
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID of the DatePicker
 * @param date - Date value to set
 * @param options - Optional settings (locale, timezone)
 *
 * @example
 * ```typescript
 * await setAndValidateDate(page, 'app--startDate', new Date('2024-03-15'));
 * ```
 */
export async function setAndValidateDate(
  page: DatePage,
  controlId: string,
  date: DateInput,
  options?: DateOptions,
): Promise<void>;
````

**Estimated LOC**: ~210
**Tests**: 30 test cases

**Unit Tests** (`tests/unit/modules/date.test.ts`):

| #   | Test Case                                            | Input                                         | Expected                                             |
| --- | ---------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| 1   | setDatePickerValue with Date object                  | new Date('2024-03-15')                        | setValue('2024-03-15') called                        |
| 2   | setDatePickerValue with ISO string                   | '2024-03-15'                                  | setValue('2024-03-15') called                        |
| 3   | setDatePickerValue converts to control's valueFormat | format='dd.MM.yyyy', Date('2024-03-15')       | setValue('15.03.2024')                               |
| 4   | setDatePickerValue fires change event                | any valid date                                | fireChange called with valid:true                    |
| 5   | setDatePickerValue calls waitForUI5Stable            | default options                               | stability wait called                                |
| 6   | setDatePickerValue skips wait when configured        | skipStabilityWait=true                        | stability wait NOT called                            |
| 7   | setDatePickerValue throws for invalid date           | 'not-a-date'                                  | throws ControlError                                  |
| 8   | getDatePickerValue returns value string              | control value='2024-03-15'                    | '2024-03-15'                                         |
| 9   | getDatePickerValue returns empty for unset picker    | no value set                                  | ''                                                   |
| 10  | setDateRangeSelection sets both dates                | start='2024-01-01', end='2024-12-31'          | both values set                                      |
| 11  | setDateRangeSelection fires change                   | valid range                                   | fireChange called                                    |
| 12  | setDateRangeSelection throws if start > end          | start after end                               | throws ControlError                                  |
| 13  | setTimePickerValue sets time string                  | '14:30'                                       | setValue('14:30')                                    |
| 14  | setTimePickerValue with seconds                      | '14:30:00'                                    | setValue('14:30:00')                                 |
| 15  | setTimePickerValue fires change                      | valid time                                    | fireChange called                                    |
| 16  | setTimePickerValue throws for invalid time           | '25:99'                                       | throws ControlError                                  |
| 17  | getTimePickerValue returns value                     | control value='09:00'                         | '09:00'                                              |
| 18  | formatDateForUI5 yyyy-MM-dd                          | Date('2024-03-15'), 'yyyy-MM-dd'              | '2024-03-15'                                         |
| 19  | formatDateForUI5 dd.MM.yyyy                          | Date('2024-03-15'), 'dd.MM.yyyy'              | '15.03.2024'                                         |
| 20  | formatDateForUI5 MM/dd/yyyy                          | Date('2024-03-15'), 'MM/dd/yyyy'              | '03/15/2024'                                         |
| 21  | formatDateForUI5 yyyyMMdd                            | Date('2024-03-15'), 'yyyyMMdd'                | '20240315'                                           |
| 22  | formatDateForUI5 throws for unsupported format       | unknown pattern                               | throws ControlError                                  |
| 23  | getDateRangeSelection returns start and end dates    | range with from='2024-01-01', to='2024-12-31' | `{ startDate: '2024-01-01', endDate: '2024-12-31' }` |
| 24  | getDateRangeSelection returns empty for unset range  | no dates set                                  | `{ startDate: '', endDate: '' }`                     |
| 25  | setAndValidateDate succeeds for valid date           | date within min/max range                     | resolves, no error                                   |
| 26  | setAndValidateDate throws for invalid date           | date rejected by control (invalid flag)       | throws ControlError                                  |
| 27  | setDatePickerValue respects locale option            | locale='de-DE', date in European format       | correct format used                                  |
| 28  | setDatePickerValue respects timezone option          | timezone='Europe/Berlin'                      | timezone-adjusted value set                          |
| 29  | DATE_FORMATS.ISO is 'yyyy-MM-dd'                     | constant check                                | 'yyyy-MM-dd'                                         |
| 30  | DATE_FORMATS.SAP_INTERNAL is 'yyyyMMdd'              | constant check                                | 'yyyyMMdd'                                           |

---

## 9. Sub-Phase 4.4 — OData Module

### 9.1 File: `src/modules/odata.ts`

**Purpose**: Provide OData-specific operations through the UI5 model layer. Includes model data access, CSRF token fetching, binding wait, and entity set operations. All operations go through `page.evaluate()` against the UI5 runtime — NOT HTTP interceptors.

**Decisions**: P1, P2, P5 (UI5 model layer, not HTTP), P10 (use existing ODataError), P12

**Existing infrastructure consumed**:

- `ODataError` with codes `ERR_ODATA_REQUEST_FAILED`, `ERR_ODATA_PARSE`, `ERR_ODATA_CSRF`
- `TimeoutError` with code `ERR_TIMEOUT_OPERATION`
- `waitForUI5Stable` from wait-helpers
- `createLogger('odata')` for structured logging

````typescript
// ─── Types ───────────────────────────────────────────────────────────

/**
 * Options for OData operations.
 */
export interface ODataOptions {
  /** Timeout in ms. Default: DEFAULT_TIMEOUTS.UI5_WAIT */
  readonly timeout?: number;
  /** Named model. Default: undefined (default model). */
  readonly modelName?: string;
}

/**
 * Options for waitForODataLoad.
 */
export interface WaitForODataLoadOptions extends ODataOptions {
  /** Binding path to watch. If not set, watches the control's default binding. */
  readonly bindingPath?: string;
  /** Polling interval in ms. Default: DEFAULT_TIMEOUTS.POLLING_INTERVAL */
  readonly polling?: number;
}

/**
 * CSRF token result.
 */
export interface CSRFTokenResult {
  /** The CSRF token string */
  readonly token: string;
  /** The service URL the token was fetched from */
  readonly serviceUrl: string;
}

/**
 * Minimal page interface for OData operations.
 */
export interface ODataPage {
  evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>; // String scripts ONLY (P12)
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

// ─── Public Functions ────────────────────────────────────────────────

/**
 * Read data from a UI5 OData model at a given path.
 *
 * Accesses the model bound to a control (or the component's default model)
 * and reads data at the specified path.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID to get the model from
 * @param path - OData model path (e.g., '/Products', '/Products(1)')
 * @param options - Model name, timeout
 * @returns The model data (serializable JSON)
 *
 * @example
 * ```typescript
 * const products = await getModelData(page, 'app--table', '/Products');
 * expect(products).toHaveLength(10);
 * ```
 */
export async function getModelData(
  page: ODataPage,
  controlId: string,
  path: string,
  options?: ODataOptions,
): Promise<unknown>;

/**
 * Get a property value from the OData model.
 *
 * Shorthand for reading a single property path.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID
 * @param propertyPath - Model property path (e.g., '/Products(1)/Name')
 * @param options - Model name
 * @returns The property value
 *
 * @example
 * ```typescript
 * const name = await getModelProperty(page, 'app--form', '/Name');
 * ```
 */
export async function getModelProperty(
  page: ODataPage,
  controlId: string,
  propertyPath: string,
  options?: ODataOptions,
): Promise<unknown>;

/**
 * Wait for a control's OData binding to load data.
 *
 * Uses `page.waitForFunction()` with a browser-side predicate that checks    <!-- REVIEW FIX: C4-PW (P22) -->
 * binding data (length > 0 for list bindings, or context exists for
 * context bindings). Does NOT use Node-side setTimeout polling loops.
 *
 * Throws `TimeoutError(ERR_TIMEOUT_OPERATION)` if timeout expires.
 *
 * @param page - Page with evaluate capability
 * @param controlId - UI5 control ID with an OData binding
 * @param options - Binding path, timeout, polling interval
 *
 * @example
 * ```typescript
 * await waitForODataLoad(page, 'app--productsTable', { timeout: 15000 });
 * ```
 */
export async function waitForODataLoad(
  page: ODataPage,
  controlId: string,
  options?: WaitForODataLoadOptions,
): Promise<void>;

/**
 * Fetch a CSRF token from an OData service.                          <!-- REVIEW FIX: C6-PW — uses page.request.head(), NOT synchronous XHR -->
 *
 * Uses Playwright's `page.request.head()` to send a HEAD request with
 * `X-CSRF-Token: Fetch` header. Reads the token from the response headers.
 *
 * **IMPORTANT**: Does NOT use synchronous XHR (`new XMLHttpRequest()`) which is
 * deprecated and blocked in modern browsers. Uses Playwright's HTTP API instead,
 * which runs at the Node.js level with the browser's cookies/auth context.
 *
 * Throws `ODataError(ERR_ODATA_CSRF)` if token fetch fails.
 *
 * @param page - Page with request capability (ODataPage extended with request.head)
 * @param serviceUrl - Base URL of the OData service
 * @returns CSRF token result
 *
 * @example
 * ```typescript
 * const { token } = await fetchCSRFToken(page, '/sap/opu/odata/sap/API_PRODUCT_SRV');
 * ```
 */
export async function fetchCSRFToken(
  page: ODataCSRFPage,
  serviceUrl: string,
): Promise<CSRFTokenResult>;

/**
 * Extended page interface for CSRF token fetching.                   <!-- REVIEW FIX: C6-PW -->
 * Adds `page.request.head()` capability to the base ODataPage.
 */
export interface ODataCSRFPage extends ODataPage {
  request: {
    head(
      url: string,
      options?: { headers?: Record<string, string> },
    ): Promise<{
      status(): number;
      headers(): Record<string, string>;
    }>;
  };
}

/**
 * Get the number of entities in an entity set via the model's binding.
 *
 * For V2 models, reads `$count` or binding length.
 * For V4 models, reads the list binding's `getLength()`.
 *
 * @param page - Page with evaluate capability
 * @param controlId - Control bound to the entity set
 * @param options - Model name
 * @returns Number of entities
 *
 * @example
 * ```typescript
 * const count = await getEntityCount(page, 'app--productsTable');
 * expect(count).toBeGreaterThan(0);
 * ```
 */
export async function getEntityCount(
  page: ODataPage,
  controlId: string,
  options?: ODataOptions,
): Promise<number>;

/**
 * Check if the OData model has pending changes.
 *
 * @param page - Page with evaluate capability
 * @param controlId - Control to get the model from
 * @param options - Model name
 * @returns true if the model has unsaved changes
 *
 * @example
 * ```typescript
 * const dirty = await hasPendingChanges(page, 'app--form');
 * expect(dirty).toBe(false);
 * ```
 */
export async function hasPendingChanges(
  page: ODataPage,
  controlId: string,
  options?: ODataOptions,
): Promise<boolean>;
````

**Estimated LOC**: ~220
**Tests**: 24 test cases

**Unit Tests** (`tests/unit/modules/odata.test.ts`):

| #   | Test Case                                           | Input / Scenario                              | Expected                                                     |
| --- | --------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------ |
| 1   | getModelData reads array from model path            | path='/Products'                              | returns array                                                |
| 2   | getModelData reads single entity                    | path='/Products(1)'                           | returns object                                               |
| 3   | getModelData uses named model                       | modelName='invoice'                           | accesses named model                                         |
| 4   | getModelData uses default model when none specified | no modelName                                  | accesses default model                                       |
| 5   | getModelData throws ODataError on failure           | model.getProperty throws                      | throws ERR_ODATA_REQUEST_FAILED                              |
| 6   | getModelData throws for invalid path                | path='no-leading-slash'                       | throws ERR_ODATA_PARSE                                       |
| 7   | getModelProperty reads single value                 | '/Products(1)/Name'                           | 'Widget A'                                                   |
| 8   | getModelProperty returns undefined for missing path | '/NonExistent'                                | undefined                                                    |
| 9   | waitForODataLoad resolves when data exists          | binding has 5 items                           | resolves                                                     |
| 10  | waitForODataLoad polls until data appears           | starts empty, data after 500ms                | resolves after data loads                                    |
| 11  | waitForODataLoad throws TimeoutError                | never loads                                   | throws ERR_TIMEOUT_OPERATION                                 |
| 12  | waitForODataLoad respects custom timeout            | timeout=5000                                  | uses 5000ms                                                  |
| 13  | waitForODataLoad checks specific bindingPath        | bindingPath='items'                           | checks items binding                                         |
| 14  | fetchCSRFToken returns token string                 | page.request.head returns x-csrf-token header | `{ token: 'abc123', serviceUrl }` <!-- REVIEW FIX: C6-PW --> |
| 15  | fetchCSRFToken throws ODataError on failure         | page.request.head returns status 403          | throws ERR_ODATA_CSRF <!-- REVIEW FIX: C6-PW -->             |
| 16  | fetchCSRFToken throws ODataError on empty token     | x-csrf-token header missing in response       | throws ERR_ODATA_CSRF <!-- REVIEW FIX: C6-PW -->             |
| 17  | fetchCSRFToken includes serviceUrl in error         | serviceUrl='/sap/...'                         | error.requestUrl set                                         |
| 18  | getEntityCount returns binding length               | list binding length=42                        | 42                                                           |
| 19  | getEntityCount returns 0 for empty binding          | no data                                       | 0                                                            |
| 20  | getEntityCount uses named model                     | modelName='odata'                             | accesses named model                                         |
| 21  | hasPendingChanges returns true when dirty           | model.hasPendingChanges()=true                | true                                                         |
| 22  | hasPendingChanges returns false when clean          | model.hasPendingChanges()=false               | false                                                        |
| 23  | all functions log via createLogger('odata')         | any operation                                 | logger.debug/info called                                     |
| 24  | all functions use telemetry spans                   | any operation                                 | createSpanName('odata', op) called                           |

### 9.2 File: `src/modules/odata-http.ts` (HTTP-Level OData Operations) <!-- GAP FIX: added from dhikraft odata-handler.ts:254-510 per P15 -->

**Purpose**: Provide HTTP-level OData CRUD operations using Playwright's `page.request` API. Complements the model-level `odata.ts` for scenarios where direct HTTP interaction is needed (entity creation, update, deletion, function imports).

**Decisions**: P1, P2, P15 (HTTP-level OData as separate module), P12

**Key difference from `odata.ts`**: This module uses Playwright's `page.request` API (`page.request.get()`, `.post()`, `.patch()`, `.delete()`) for HTTP operations. It does NOT go through the UI5 model. This is the correct approach for:

- Creating test data before tests
- Cleaning up entities after tests
- Calling function imports / actions
- Querying with full OData options ($expand, $orderby, $skip, $top)

**IMPORTANT (P20)**: Playwright's `APIRequestContext` does NOT have a `.fetch()` method. The correct methods are `.get()`, `.post()`, `.patch()`, `.delete()`, `.put()`, `.head()`. Each method takes `(url, options?)` where options includes `headers`, `data`, `timeout`, etc. The `ODataHttpPage` interface below reflects the ACTUAL Playwright API.

**CSRF token dependency**: Write operations (POST/PATCH/DELETE) require a CSRF token. Consumers should call `fetchCSRFToken()` from `odata.ts` first, then pass the token to write functions here.

````typescript
import type { ODataPage } from './odata.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Options for HTTP-level OData operations.
 */
export interface ODataHttpOptions {
  /** Timeout in ms for the HTTP request. Default: DEFAULT_TIMEOUTS.UI5_WAIT */
  readonly timeout?: number;
  /** CSRF token for write operations. Required for POST/PATCH/DELETE. */
  readonly csrfToken?: string;
  /** Additional HTTP headers. */
  readonly headers?: Readonly<Record<string, string>>;
}

/**
 * Query options for entity set retrieval.
 */
export interface ODataQueryOptions extends ODataHttpOptions {
  /** OData $filter expression */
  readonly filter?: string;
  /** OData $select — comma-separated property names */
  readonly select?: string;
  /** OData $expand — comma-separated navigation properties */
  readonly expand?: string;
  /** OData $orderby expression */
  readonly orderby?: string;
  /** OData $top — max number of results */
  readonly top?: number;
  /** OData $skip — number of results to skip */
  readonly skip?: number;
}

/**
 * Result of an OData HTTP operation.
 */
export interface ODataHttpResult<T = unknown> {
  /** HTTP status code */
  readonly status: number;
  /** Response data (parsed JSON) */
  readonly data: T;
  /** ETag from response headers (for optimistic concurrency) */
  readonly etag?: string;
}

/**
 * Playwright API response — minimal interface for OData HTTP result parsing.
 */
interface APIResponse {
  status(): number;
  json(): Promise<unknown>;
  headers(): Record<string, string>;
}

/**
 * Request options accepted by Playwright's APIRequestContext methods.
 */
interface RequestOptions {
  headers?: Record<string, string>;
  data?: unknown;
  timeout?: number;
}

/**
 * Minimal page interface for HTTP OData operations.                   <!-- REVIEW FIX: C2-PW (P20) — uses Playwright's actual APIRequestContext API -->
 * Extends ODataPage with Playwright's `page.request` methods.
 *
 * @remarks
 * Playwright's `APIRequestContext` provides `.get()`, `.post()`, `.patch()`,
 * `.delete()`, `.put()`, `.head()` — NOT a generic `.fetch()` method.
 * This interface mirrors the ACTUAL Playwright API to prevent type mismatches.
 */
export interface ODataHttpPage extends ODataPage {
  request: {
    get(url: string, options?: RequestOptions): Promise<APIResponse>;
    post(url: string, options?: RequestOptions): Promise<APIResponse>;
    patch(url: string, options?: RequestOptions): Promise<APIResponse>;
    delete(url: string, options?: RequestOptions): Promise<APIResponse>;
    put(url: string, options?: RequestOptions): Promise<APIResponse>;
    head(url: string, options?: RequestOptions): Promise<APIResponse>;
  };
}

// ─── Public Functions ────────────────────────────────────────────────

/**
 * Create a new entity via HTTP POST.                                 <!-- GAP FIX: added from dhikraft odata-handler.ts:294-314 -->
 *
 * @param page - Page with request capability
 * @param serviceUrl - Base OData service URL (e.g., '/sap/opu/odata/sap/API_PRODUCT_SRV')
 * @param entitySet - Entity set name (e.g., 'Products')
 * @param data - Entity data to create
 * @param options - CSRF token, headers, timeout
 * @returns Created entity data with server-generated fields
 *
 * @example
 * ```typescript
 * const { token } = await fetchCSRFToken(page, serviceUrl);
 * const result = await createEntity(page, serviceUrl, 'Products', {
 *   Name: 'New Product',
 *   Price: 29.99,
 * }, { csrfToken: token });
 * expect(result.data).toHaveProperty('ProductID');
 * ```
 */
export async function createEntity<T = unknown>(
  page: ODataHttpPage,
  serviceUrl: string,
  entitySet: string,
  data: Readonly<Record<string, unknown>>,
  options?: ODataHttpOptions,
): Promise<ODataHttpResult<T>>;

/**
 * Update an entity via HTTP PATCH (or PUT for full replace).         <!-- GAP FIX: added from dhikraft odata-handler.ts:332-352 -->
 *
 * @param page - Page with request capability
 * @param serviceUrl - Base OData service URL
 * @param entitySet - Entity set name
 * @param key - Entity key (e.g., "('123')" or "(ProductID='123')")
 * @param data - Fields to update
 * @param options - CSRF token, headers, timeout
 * @returns Updated entity data
 *
 * @example
 * ```typescript
 * await updateEntity(page, serviceUrl, 'Products', "('123')", {
 *   Price: 39.99,
 * }, { csrfToken: token });
 * ```
 */
export async function updateEntity<T = unknown>(
  page: ODataHttpPage,
  serviceUrl: string,
  entitySet: string,
  key: string,
  data: Readonly<Record<string, unknown>>,
  options?: ODataHttpOptions,
): Promise<ODataHttpResult<T>>;

/**
 * Delete an entity via HTTP DELETE.                                  <!-- GAP FIX: added from dhikraft odata-handler.ts:365-382 -->
 *
 * @param page - Page with request capability
 * @param serviceUrl - Base OData service URL
 * @param entitySet - Entity set name
 * @param key - Entity key
 * @param options - CSRF token, headers, timeout
 *
 * @example
 * ```typescript
 * await deleteEntity(page, serviceUrl, 'Products', "('123')", { csrfToken: token });
 * ```
 */
export async function deleteEntity(
  page: ODataHttpPage,
  serviceUrl: string,
  entitySet: string,
  key: string,
  options?: ODataHttpOptions,
): Promise<void>;

/**
 * Call an OData function import or action.                           <!-- GAP FIX: added from dhikraft odata-handler.ts:487-510 -->
 *
 * @param page - Page with request capability
 * @param serviceUrl - Base OData service URL
 * @param functionName - Function import name (e.g., 'CalculatePrice')
 * @param params - Function parameters as key-value pairs
 * @param method - HTTP method. Default: 'POST' for actions, 'GET' for function imports.
 * @param options - CSRF token, headers, timeout
 * @returns Function result
 *
 * @example
 * ```typescript
 * const result = await callFunctionImport(page, serviceUrl, 'CalculatePrice', {
 *   ProductID: '123',
 *   Quantity: 5,
 * });
 * ```
 */
export async function callFunctionImport<T = unknown>(
  page: ODataHttpPage,
  serviceUrl: string,
  functionName: string,
  params?: Readonly<Record<string, unknown>>,
  method?: 'GET' | 'POST',
  options?: ODataHttpOptions,
): Promise<ODataHttpResult<T>>;

/**
 * Query entities from an entity set with full OData options.         <!-- GAP FIX: added from dhikraft odata-handler.ts:400-435 -->
 *
 * Supports $filter, $select, $expand, $orderby, $top, $skip.
 *
 * @param page - Page with request capability
 * @param serviceUrl - Base OData service URL
 * @param entitySet - Entity set name
 * @param options - Query options ($filter, $select, $expand, $orderby, $top, $skip)
 * @returns Array of entity objects
 *
 * @example
 * ```typescript
 * const result = await queryEntities(page, serviceUrl, 'Products', {
 *   filter: "Price gt 10",
 *   select: 'ProductID,Name,Price',
 *   expand: 'Supplier',
 *   orderby: 'Price desc',
 *   top: 20,
 *   skip: 0,
 * });
 * expect(result.data).toHaveLength(20);
 * ```
 */
export async function queryEntities<T = unknown>(
  page: ODataHttpPage,
  serviceUrl: string,
  entitySet: string,
  options?: ODataQueryOptions,
): Promise<ODataHttpResult<readonly T[]>>;
````

**Estimated LOC**: ~200
**Tests**: 20 test cases

**Unit Tests** (`tests/unit/modules/odata-http.test.ts`):

| #   | Test Case                                           | Input / Scenario                      | Expected                             |
| --- | --------------------------------------------------- | ------------------------------------- | ------------------------------------ |
| 1   | createEntity sends POST with correct URL            | entitySet='Products', data={Name:'A'} | POST to /serviceUrl/Products         |
| 2   | createEntity includes CSRF token header             | csrfToken='abc123'                    | X-CSRF-Token header set              |
| 3   | createEntity returns created entity with status 201 | successful creation                   | `{ status: 201, data: {...} }`       |
| 4   | createEntity throws ODataError on 400               | server returns 400                    | throws ERR_ODATA_REQUEST_FAILED      |
| 5   | createEntity throws ODataError when no CSRF token   | csrfToken not provided for POST       | throws ERR_ODATA_CSRF                |
| 6   | updateEntity sends PATCH with key in URL            | key="('123')"                         | PATCH to /serviceUrl/Products('123') |
| 7   | updateEntity returns updated data                   | successful update                     | `{ status: 200, data: {...} }`       |
| 8   | updateEntity throws ODataError on 404               | entity not found                      | throws ERR_ODATA_REQUEST_FAILED      |
| 9   | deleteEntity sends DELETE request                   | key="('123')"                         | DELETE to correct URL                |
| 10  | deleteEntity succeeds with 204                      | successful deletion                   | resolves without error               |
| 11  | deleteEntity throws ODataError on failure           | server returns 500                    | throws ERR_ODATA_REQUEST_FAILED      |
| 12  | callFunctionImport sends POST by default            | functionName='Calculate'              | POST to /serviceUrl/Calculate        |
| 13  | callFunctionImport sends GET when specified         | method='GET'                          | GET with params in query string      |
| 14  | callFunctionImport includes params                  | params={ProductID:'123'}              | params in URL or body                |
| 15  | callFunctionImport returns result                   | successful call                       | `{ status: 200, data: {...} }`       |
| 16  | queryEntities sends GET with $filter                | filter='Price gt 10'                  | $filter in query string              |
| 17  | queryEntities builds full query string              | filter+select+expand+orderby+top+skip | all OData params in URL              |
| 18  | queryEntities returns array of entities             | 3 products returned                   | `{ data: [...] }`                    |
| 19  | queryEntities handles empty result                  | no matching entities                  | `{ data: [] }`                       |
| 20  | all functions log via createLogger('odata-http')    | any operation                         | logger.debug/info called             |

---

## 10. Sub-Phase 4.5 — Fiori Elements

### 10.1 File: `src/fe/list-report.ts`

**Purpose**: Provide Fiori Elements List Report page operations. Wraps SmartFilterBar/MDC FilterBar, SmartTable/MDC Table, and variant management interactions.

**Decisions**: P1, P2, P8 (control discovery, not DOM), P13 (depends on table module)

**Dependency**: Imports `detectTableType`, `getTableRows`, `waitForTableData` from `../modules/table.js`.

````typescript
import type { UI5ControlBase } from '#core/types/controls.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Options for List Report operations.
 */
export interface ListReportOptions {
  /** Timeout in ms. Default: DEFAULT_TIMEOUTS.CONTROL_DISCOVERY */
  readonly timeout?: number;
  /** Skip UI5 stability wait. Default: false */
  readonly skipStabilityWait?: boolean;
}

/**
 * Minimal page interface for List Report operations.
 */
export interface ListReportPage {
  evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>; // String scripts ONLY (P12)
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

// ─── Public Functions ────────────────────────────────────────────────

/**
 * Get the main table control on a List Report page.
 *
 * Discovers the SmartTable or MDC Table. Returns a proxy that can be
 * passed to table module functions.
 *
 * @param page - Page with evaluate capability
 * @param options - Timeout settings
 * @returns Control proxy for the table (SmartTable or MDC Table)
 *
 * @example
 * ```typescript
 * const table = await getListReportTable(page);
 * const rows = await getTableRows(page, await table.getId());
 * ```
 */
export async function getListReportTable(
  page: ListReportPage,
  options?: ListReportOptions,
): Promise<UI5ControlBase>;

/**
 * Get the filter bar on a List Report page.
 *
 * @param page - Page with evaluate capability
 * @param options - Timeout settings
 * @returns Control proxy for SmartFilterBar or MDC FilterBar
 */
export async function getFilterBar(
  page: ListReportPage,
  options?: ListReportOptions,
): Promise<UI5ControlBase>;

/**
 * Set a filter bar field value.
 *
 * @param page - Page with evaluate capability
 * @param fieldName - The filter field name (technical name, not label)
 * @param value - Value to set
 * @param options - Timeout settings
 *
 * @example
 * ```typescript
 * await setFilterBarField(page, 'ProductName', 'Widget');
 * ```
 */
export async function setFilterBarField(
  page: ListReportPage,
  fieldName: string,
  value: string,
  options?: ListReportOptions,
): Promise<void>;

/**
 * Get the current value of a filter bar field.
 *
 * @param page - Page with evaluate capability
 * @param fieldName - The filter field name
 * @returns The field value as string
 */
export async function getFilterBarFieldValue(
  page: ListReportPage,
  fieldName: string,
): Promise<string>;

/**
 * Execute the search (Go button) on the filter bar.
 * Triggers `search` event on SmartFilterBar or FilterBar.
 *
 * @param page - Page with evaluate capability
 * @param options - Timeout settings
 *
 * @example
 * ```typescript
 * await setFilterBarField(page, 'Status', 'Active');
 * await executeSearch(page);
 * ```
 */
export async function executeSearch(
  page: ListReportPage,
  options?: ListReportOptions,
): Promise<void>;

/**
 * Clear all filter bar values and reset to defaults.
 *
 * @param page - Page with evaluate capability
 * @param options - Timeout settings
 */
export async function clearFilterBar(
  page: ListReportPage,
  options?: ListReportOptions,
): Promise<void>;

/**
 * Navigate to an item in the list report by clicking a row.
 * Typically opens the object page.
 *
 * @param page - Page with evaluate capability
 * @param rowIndex - Zero-based row index to click
 * @param options - Timeout settings
 *
 * @example
 * ```typescript
 * await navigateToItem(page, 0); // Opens first item's object page
 * ```
 */
export async function navigateToItem(
  page: ListReportPage,
  rowIndex: number,
  options?: ListReportOptions,
): Promise<void>;

/**
 * Get available saved variants on the List Report.                   <!-- GAP FIX: added — dhikraft uses FE test library for LR variants -->
 *
 * Reads from the VariantManagement control on the page.
 *
 * @param page - Page with evaluate capability
 * @param options - Timeout settings
 * @returns Array of variant names
 *
 * @example
 * ```typescript
 * const variants = await getAvailableVariants(page);
 * expect(variants).toContain('My Saved View');
 * ```
 */
export async function getAvailableVariants(
  page: ListReportPage,
  options?: ListReportOptions,
): Promise<readonly string[]>;

/**
 * Select (apply) a saved variant by name.                            <!-- GAP FIX: added — dhikraft uses FE test library for LR variants -->
 *
 * Opens the variant popover, finds the variant by name, and selects it.
 * Waits for UI5 stability after selection.
 *
 * @param page - Page with evaluate capability
 * @param variantName - Name of the variant to select
 * @param options - Timeout settings
 *
 * @example
 * ```typescript
 * await selectVariant(page, 'High Value Orders');
 * ```
 */
export async function selectVariant(
  page: ListReportPage,
  variantName: string,
  options?: ListReportOptions,
): Promise<void>;
````

**Estimated LOC**: ~220
**Tests**: 24 test cases

**Unit Tests** (`tests/unit/fe/list-report.test.ts`):

| #   | Test Case                                           | Input / Scenario                   | Expected                         |
| --- | --------------------------------------------------- | ---------------------------------- | -------------------------------- |
| 1   | getListReportTable finds SmartTable                 | SmartTable exists on page          | returns proxy                    |
| 2   | getListReportTable finds MDC Table                  | MDC Table exists, no SmartTable    | returns proxy                    |
| 3   | getListReportTable throws when no table found       | neither SmartTable nor MDC exists  | throws ERR_CONTROL_NOT_FOUND     |
| 4   | getFilterBar finds SmartFilterBar                   | SmartFilterBar exists              | returns proxy                    |
| 5   | getFilterBar finds MDC FilterBar                    | MDC FilterBar exists               | returns proxy                    |
| 6   | getFilterBar throws when not found                  | no filter bar                      | throws ERR_CONTROL_NOT_FOUND     |
| 7   | setFilterBarField sets value by fieldName           | fieldName='Status', value='Active' | field value set                  |
| 8   | setFilterBarField throws for unknown field          | fieldName='NonExistent'            | throws ERR_CONTROL_NOT_FOUND     |
| 9   | getFilterBarFieldValue returns current value        | field has value 'Active'           | 'Active'                         |
| 10  | getFilterBarFieldValue returns empty for unset      | field not set                      | ''                               |
| 11  | executeSearch triggers search event                 | SmartFilterBar present             | search() called                  |
| 12  | executeSearch waits for UI5 stability               | default options                    | waitForUI5Stable called          |
| 13  | clearFilterBar resets all fields                    | filter bar with values             | clear() called                   |
| 14  | navigateToItem clicks the specified row             | rowIndex=0                         | row press/click invoked          |
| 15  | navigateToItem waits for UI5 stability              | default                            | waitForUI5Stable called          |
| 16  | navigateToItem throws for invalid index             | rowIndex=-1                        | throws ERR_CONTROL_AGGREGATION   |
| 17  | getAvailableVariants returns variant names          | VariantManagement with 3 variants  | ['Standard', 'View 1', 'View 2'] |
| 18  | getAvailableVariants returns empty when no variants | no VariantManagement on page       | `[]`                             |
| 19  | selectVariant applies named variant                 | variantName='High Value'           | variant selected                 |
| 20  | selectVariant throws for unknown variant            | variantName='NonExistent'          | throws ERR_CONTROL_NOT_FOUND     |
| 21  | selectVariant waits for UI5 stability               | default options                    | waitForUI5Stable called          |
| 22  | all functions use custom timeout                    | timeout=5000                       | 5000ms used                      |
| 23  | all functions log operations                        | any function                       | logger called                    |
| 24  | clearFilterBar resets variant to Standard           | variant was 'Custom'               | reverts to Standard view         |

### 10.2 File: `src/fe/object-page.ts` <!-- GAP FIX: expanded with complete specs from dhikraft fe-helpers.ts:58-380 -->

**Purpose**: Provide Fiori Elements Object Page operations. Wraps `sap.uxap.ObjectPageLayout` interactions including section navigation, section data access, header button clicks, edit mode toggle, and save.

**Decisions**: P1, P2, P8, P13 (independent of table module)

````typescript
import type { UI5ControlBase } from '#core/types/controls.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Options for Object Page operations.
 */
export interface ObjectPageOptions {
  /** Timeout in ms. Default: DEFAULT_TIMEOUTS.CONTROL_DISCOVERY */
  readonly timeout?: number;
  /** Skip UI5 stability wait. Default: false */
  readonly skipStabilityWait?: boolean;
}

/**
 * Info about an Object Page section.                                 <!-- GAP FIX: expanded from dhikraft fe-helpers.ts:31-40 -->
 */
export interface ObjectPageSection {
  /** Section control ID */
  readonly id: string;
  /** Section title text */
  readonly title: string;
  /** Whether the section is currently visible */
  readonly visible: boolean;
  /** Zero-based index of the section */
  readonly index: number;
  /** Subsections within this section */
  readonly subSections: readonly { readonly id: string; readonly title: string }[];
}

/**
 * Section data — key-value pairs from controls within a section.
 */
export type SectionData = Readonly<Record<string, unknown>>;

/**
 * Minimal page interface for Object Page operations.
 */
export interface ObjectPagePage {
  evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>; // String scripts ONLY (P12)
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

// ─── Public Functions ────────────────────────────────────────────────

/**
 * Get the ObjectPageLayout control.
 *
 * @param page - Page with evaluate capability
 * @param options - Timeout settings
 * @returns Control proxy for the ObjectPageLayout
 */
export async function getObjectPageLayout(
  page: ObjectPagePage,
  options?: ObjectPageOptions,
): Promise<UI5ControlBase>;

/**
 * Navigate to a specific section by title or ID.                     <!-- GAP FIX: added from dhikraft fe-helpers.ts:58-108 -->
 *
 * Finds the section in the ObjectPageLayout and scrolls/navigates to it.
 * Supports both title text match and section ID match.
 *
 * @param page - Page with evaluate capability
 * @param sectionTitleOrId - Section title text or section control ID
 * @param options - Timeout settings
 *
 * @example
 * ```typescript
 * await navigateToSection(page, 'General Information');
 * await navigateToSection(page, 'app--generalSection');
 * ```
 */
export async function navigateToSection(
  page: ObjectPagePage,
  sectionTitleOrId: string,
  options?: ObjectPageOptions,
): Promise<void>;

/**
 * Get data from all controls within a specific section.              <!-- GAP FIX: added from dhikraft fe-helpers.ts:124-196 -->
 *
 * Reads label-value pairs from form fields, display fields, and
 * other data-displaying controls within the section. Returns a
 * flattened key-value map.
 *
 * @param page - Page with evaluate capability
 * @param sectionTitleOrId - Section title text or section control ID
 * @param options - Timeout settings
 * @returns Key-value map of field labels to values
 *
 * @example
 * ```typescript
 * const data = await getSectionData(page, 'General Information');
 * expect(data['Product Name']).toBe('Widget A');
 * expect(data['Status']).toBe('Active');
 * ```
 */
export async function getSectionData(
  page: ObjectPagePage,
  sectionTitleOrId: string,
  options?: ObjectPageOptions,
): Promise<SectionData>;

/**
 * Click a button on the Object Page by button name/text.             <!-- GAP FIX: added from dhikraft fe-helpers.ts:213-295 -->
 *
 * Searches the Object Page header actions and footer bar for a button
 * matching the given name. Handles both header toolbar buttons and
 * footer bar buttons.
 *
 * @param page - Page with evaluate capability
 * @param buttonName - Button text to match (e.g., 'Edit', 'Delete', 'Share')
 * @param options - Timeout settings
 *
 * @example
 * ```typescript
 * await clickObjectPageButton(page, 'Delete');
 * ```
 */
export async function clickObjectPageButton(
  page: ObjectPagePage,
  buttonName: string,
  options?: ObjectPageOptions,
): Promise<void>;

/**
 * Click the Edit button on the Object Page header.                   <!-- GAP FIX: added from dhikraft fe-helpers.ts:310-312 -->
 *
 * Convenience wrapper for `clickObjectPageButton(page, 'Edit')`.
 *
 * @param page - Page with evaluate capability
 * @param options - Timeout settings
 *
 * @example
 * ```typescript
 * await clickEditButton(page);
 * ```
 */
export async function clickEditButton(
  page: ObjectPagePage,
  options?: ObjectPageOptions,
): Promise<void>;

/**
 * Click the Save button on the Object Page footer.                   <!-- GAP FIX: added from dhikraft fe-helpers.ts:327-329 -->
 *
 * Convenience wrapper for `clickObjectPageButton(page, 'Save')`.
 * Waits for UI5 stability after save.
 *
 * @param page - Page with evaluate capability
 * @param options - Timeout settings
 *
 * @example
 * ```typescript
 * await clickSaveButton(page);
 * ```
 */
export async function clickSaveButton(
  page: ObjectPagePage,
  options?: ObjectPageOptions,
): Promise<void>;

/**
 * Get all sections of the Object Page with visibility and index.     <!-- GAP FIX: expanded from dhikraft fe-helpers.ts:344-380 -->
 *
 * @param page - Page with evaluate capability
 * @param options - Timeout settings
 * @returns Array of section info objects with visibility and index
 *
 * @example
 * ```typescript
 * const sections = await getObjectPageSections(page);
 * expect(sections[0].title).toBe('General Information');
 * expect(sections[0].visible).toBe(true);
 * ```
 */
export async function getObjectPageSections(
  page: ObjectPagePage,
  options?: ObjectPageOptions,
): Promise<readonly ObjectPageSection[]>;

/**
 * Get the Object Page header title text.
 *
 * @param page - Page with evaluate capability
 * @returns The header title string
 */
export async function getHeaderTitle(page: ObjectPagePage): Promise<string>;

/**
 * Check if the Object Page is in edit mode.
 *
 * Checks the `showFooter` property or the `ui:edit` model.
 *
 * @param page - Page with evaluate capability
 * @returns true if in edit mode
 */
export async function isInEditMode(page: ObjectPagePage): Promise<boolean>;
````

**Estimated LOC**: ~200
**Tests**: 22 test cases

**Unit Tests** (`tests/unit/fe/object-page.test.ts`):

| #   | Test Case                                               | Input / Scenario                | Expected                       |
| --- | ------------------------------------------------------- | ------------------------------- | ------------------------------ |
| 1   | getObjectPageLayout finds ObjectPageLayout              | layout exists                   | returns proxy                  |
| 2   | getObjectPageLayout throws when not found               | no layout on page               | throws ERR_CONTROL_NOT_FOUND   |
| 3   | navigateToSection scrolls to section by title           | sectionTitle='Pricing'          | setSelectedSection called      |
| 4   | navigateToSection scrolls to section by ID              | sectionId='app--pricingSection' | setSelectedSection called      |
| 5   | navigateToSection throws for unknown section            | sectionTitle='NonExistent'      | throws ERR_NAV_ROUTE_FAILED    |
| 6   | navigateToSection waits for stability                   | default options                 | waitForUI5Stable called        |
| 7   | getSectionData returns field labels and values          | section with 3 form fields      | `{ 'Name': 'Widget', ... }`    |
| 8   | getSectionData returns empty for section with no fields | section has no form fields      | `{}`                           |
| 9   | getSectionData throws for unknown section               | sectionTitle='NonExistent'      | throws ERR_CONTROL_NOT_FOUND   |
| 10  | clickObjectPageButton clicks header action button       | buttonName='Delete'             | button pressed                 |
| 11  | clickObjectPageButton clicks footer bar button          | buttonName='Save'               | button pressed                 |
| 12  | clickObjectPageButton throws when button not found      | buttonName='NonExistent'        | throws ERR_CONTROL_NOT_FOUND   |
| 13  | clickEditButton clicks Edit button                      | Object Page in display mode     | Edit button pressed            |
| 14  | clickSaveButton clicks Save button                      | Object Page in edit mode        | Save button pressed            |
| 15  | clickSaveButton waits for stability                     | default options                 | waitForUI5Stable called        |
| 16  | getObjectPageSections returns sections with visibility  | 3 sections, 1 hidden            | 3 ObjectPageSection objects    |
| 17  | getObjectPageSections includes index property           | 3 sections                      | indices 0, 1, 2                |
| 18  | getObjectPageSections includes subsections              | section with 2 subsections      | subsections array has length 2 |
| 19  | getObjectPageSections returns empty for no sections     | empty object page               | `[]`                           |
| 20  | getHeaderTitle returns title text                       | title='Product Details'         | 'Product Details'              |
| 21  | isInEditMode returns true when editing                  | edit model active               | true                           |
| 22  | isInEditMode returns false when displaying              | display mode                    | false                          |

### 10.3 File: `src/fe/fe-table-helpers.ts` <!-- GAP FIX: added from dhikraft fiori-elements-test-library.ts:614-704 (FETableHelpers) per P18 -->

**Purpose**: Provide Fiori Elements-specific table helper functions. These wrap the generic table module functions with FE-specific ID conventions and behavior.

**Decisions**: P1, P2, P8, P18

**Dependency**: Imports from `../modules/table.js` and `../modules/table-operations.js`.

````typescript
import type { UI5ControlBase } from '#core/types/controls.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Cell reference for FE table operations.
 */
export interface FECellRef {
  /** Zero-based row index */
  readonly rowIndex: number;
  /** Column name (header text) */
  readonly columnName: string;
}

/**
 * Minimal page interface for FE table operations.
 */
export interface FETablePage {
  evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>; // String scripts ONLY (P12)
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

// ─── Public Functions ────────────────────────────────────────────────

/**
 * Get the row count from an FE table.                                <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:628-630 -->
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID (FE table ID)
 * @returns Number of rows
 *
 * @example
 * ```typescript
 * const count = await feGetTableRowCount(page, 'app::ProductsList--fe::table::Products::LineItem::Table');
 * ```
 */
export async function feGetTableRowCount(page: FETablePage, tableId: string): Promise<number>;

/**
 * Get a cell value from an FE table by row index and column name.    <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:648-650 -->
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param cellRef - Cell reference (rowIndex + columnName)
 * @returns Cell text value
 *
 * @example
 * ```typescript
 * const name = await feGetCellValue(page, tableId, { rowIndex: 0, columnName: 'Product' });
 * ```
 */
export async function feGetCellValue(
  page: FETablePage,
  tableId: string,
  cellRef: FECellRef,
): Promise<string>;

/**
 * Find a row in an FE table by matching column values.               <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:668-670 -->
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param values - Column value criteria (column name → expected value)
 * @returns Row index (zero-based) or -1 if not found
 *
 * @example
 * ```typescript
 * const rowIndex = await feFindRowByValues(page, tableId, { 'Product': 'Widget A' });
 * ```
 */
export async function feFindRowByValues(
  page: FETablePage,
  tableId: string,
  values: Readonly<Record<string, string>>,
): Promise<number>;

/**
 * Click a row in an FE table by row index.                           <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:684-686 -->
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @param rowIndex - Zero-based row index
 *
 * @example
 * ```typescript
 * await feClickRow(page, tableId, 0);
 * ```
 */
export async function feClickRow(
  page: FETablePage,
  tableId: string,
  rowIndex: number,
): Promise<void>;

/**
 * Get column names from an FE table.                                 <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:701-703 -->
 *
 * @param page - Page with evaluate capability
 * @param tableId - UI5 control ID
 * @returns Array of column header texts
 */
export async function feGetColumnNames(
  page: FETablePage,
  tableId: string,
): Promise<readonly string[]>;
````

**Estimated LOC**: ~120
**Tests**: 10 test cases

**Unit Tests** (`tests/unit/fe/fe-table-helpers.test.ts`):

| #   | Test Case                                     | Input / Scenario                 | Expected                       |
| --- | --------------------------------------------- | -------------------------------- | ------------------------------ |
| 1   | feGetTableRowCount returns row count          | table with 5 rows                | 5                              |
| 2   | feGetTableRowCount returns 0 for empty table  | no rows                          | 0                              |
| 3   | feGetCellValue returns cell text              | rowIndex=0, columnName='Product' | 'Widget A'                     |
| 4   | feGetCellValue throws for invalid column      | columnName='NonExistent'         | throws ERR_CONTROL_NOT_FOUND   |
| 5   | feFindRowByValues returns row index           | { 'Product': 'Widget A' }        | 0                              |
| 6   | feFindRowByValues returns -1 when not found   | { 'Product': 'NonExistent' }     | -1                             |
| 7   | feClickRow clicks the row                     | rowIndex=0                       | row click triggered            |
| 8   | feClickRow throws for invalid index           | rowIndex=-1                      | throws ERR_CONTROL_AGGREGATION |
| 9   | feGetColumnNames returns column headers       | table with 3 columns             | ['Product', 'Status', 'Price'] |
| 10  | feGetColumnNames returns empty for no columns | table with no columns            | `[]`                           |

### 10.4 File: `src/fe/fe-list-helpers.ts` <!-- GAP FIX: added from dhikraft fiori-elements-test-library.ts:722-828 (FEListHelpers) per P18 -->

**Purpose**: Provide Fiori Elements-specific list helper functions for sap.m.List-based FE views.

**Decisions**: P1, P2, P8, P18

````typescript
import type { UI5ControlBase } from '#core/types/controls.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Minimal page interface for FE list operations.
 */
export interface FEListPage {
  evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>; // String scripts ONLY (P12)
}

// ─── Public Functions ────────────────────────────────────────────────

/**
 * Get the number of items in an FE list.                             <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:736-738 -->
 *
 * @param page - Page with evaluate capability
 * @param listId - UI5 control ID of the list
 * @returns Number of list items
 *
 * @example
 * ```typescript
 * const count = await feGetListItemCount(page, 'app--productList');
 * ```
 */
export async function feGetListItemCount(page: FEListPage, listId: string): Promise<number>;

/**
 * Get the title text of a list item at a given index.                <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:754-756 -->
 *
 * @param page - Page with evaluate capability
 * @param listId - UI5 control ID
 * @param itemIndex - Zero-based item index
 * @returns Title text of the list item
 */
export async function feGetListItemTitle(
  page: FEListPage,
  listId: string,
  itemIndex: number,
): Promise<string>;

/**
 * Get the description text of a list item at a given index.          <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:772-774 -->
 *
 * @param page - Page with evaluate capability
 * @param listId - UI5 control ID
 * @param itemIndex - Zero-based item index
 * @returns Description text of the list item
 */
export async function feGetListItemDescription(
  page: FEListPage,
  listId: string,
  itemIndex: number,
): Promise<string>;

/**
 * Find a list item by title text.                                    <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:792-794 -->
 *
 * @param page - Page with evaluate capability
 * @param listId - UI5 control ID
 * @param title - Title text to search for
 * @returns Zero-based item index, or -1 if not found
 *
 * @example
 * ```typescript
 * const index = await feFindListItemByTitle(page, 'app--list', 'Widget A');
 * ```
 */
export async function feFindListItemByTitle(
  page: FEListPage,
  listId: string,
  title: string,
): Promise<number>;

/**
 * Click a list item at a given index.                                <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:808-810 -->
 *
 * @param page - Page with evaluate capability
 * @param listId - UI5 control ID
 * @param itemIndex - Zero-based item index
 */
export async function feClickListItem(
  page: FEListPage,
  listId: string,
  itemIndex: number,
): Promise<void>;

/**
 * Select or deselect a list item.                                    <!-- GAP FIX: from dhikraft fiori-elements-test-library.ts:825-827 -->
 *
 * @param page - Page with evaluate capability
 * @param listId - UI5 control ID
 * @param itemIndex - Zero-based item index
 * @param selected - Whether to select (true) or deselect (false)
 */
export async function feSelectListItem(
  page: FEListPage,
  listId: string,
  itemIndex: number,
  selected: boolean,
): Promise<void>;
````

**Estimated LOC**: ~120
**Tests**: 12 test cases

**Unit Tests** (`tests/unit/fe/fe-list-helpers.test.ts`):

| #   | Test Case                                         | Input / Scenario            | Expected                       |
| --- | ------------------------------------------------- | --------------------------- | ------------------------------ |
| 1   | feGetListItemCount returns item count             | list with 3 items           | 3                              |
| 2   | feGetListItemCount returns 0 for empty list       | no items                    | 0                              |
| 3   | feGetListItemTitle returns title text             | itemIndex=0                 | 'Widget A'                     |
| 4   | feGetListItemTitle throws for out-of-bounds       | itemIndex=99                | throws ERR_CONTROL_AGGREGATION |
| 5   | feGetListItemDescription returns description text | itemIndex=0                 | 'Active product'               |
| 6   | feGetListItemDescription returns empty when none  | item has no description     | ''                             |
| 7   | feFindListItemByTitle returns index               | title='Widget A'            | 0                              |
| 8   | feFindListItemByTitle returns -1 when not found   | title='NonExistent'         | -1                             |
| 9   | feClickListItem clicks the item                   | itemIndex=0                 | item click triggered           |
| 10  | feClickListItem throws for invalid index          | itemIndex=-1                | throws ERR_CONTROL_AGGREGATION |
| 11  | feSelectListItem selects an item                  | itemIndex=0, selected=true  | item selected                  |
| 12  | feSelectListItem deselects an item                | itemIndex=0, selected=false | item deselected                |

### 10.5 Sub-Phase 4.5e — FE Test Library (WDI5FE / OPA5 Given/When/Then) <!-- P16 INCLUDED in Phase 4 -->

**Dhikraft reference**: `wdi5-fe.ts` (451 LOC) + `fiori-elements-test-library.ts` (478 LOC browser-side string constant).

**Decision (P16 — REVISED)**: Originally deferred to Phase 5, now INCLUDED in Phase 4 as Sub-Phase 4.5e because:

1. OPA5 compatibility is essential for teams migrating from WDI5/OPA5-based test suites — deferral blocks migration path
2. The stateful class pattern is already proven in the codebase (`ui5-handler.ts`, `UI5Handler`)
3. The Proxy + Queue + Deferred Execution pattern is well-understood from the dhikraft reference
4. Browser-side scripts are pure string constants (per P12) — no serialization risk
5. Including it completes the FE layer in a single phase, avoiding cross-phase dependencies
6. LOC impact is modest (+450 source, +300 test) and fits within safe agent limits

**Architecture**: This is a **Proxy + Queue + Deferred Execution** pattern:

1. Node.js test code calls `fe.execute((Given, When, Then) => { When.onTheMainPage.onFilterBar().iChangeSearchField('test'); })`
2. Proxy captures method calls as `ProxyMethodCall[]` (no execution yet)
3. `page.evaluate()` sends calls to browser via `wdi5_addToQueue()`
4. OPA5 queues and executes with UI5-aware waits via `wdi5_emptyQueue()`
5. Returns logs from assertions

**Stateful class justification (P1 exception)**: `FETestLibraryInstance` uses a class because it manages:

- Initialization state (`isInitialized`)
- Configuration state (`config`)
- Method call history (`methodCallHistory`)
- WorkZone dual-context state (`shellInstance`)
- Proxy creation with captured closures
  This matches the P1 exception: "Class pattern reserved for stateful managers."

**Scope note on dhikraft fixtures**: `UI5ShellFixture` (dhikraft `fixture-interfaces.ts:57-129`) and `UI5InteractFixture` (dhikraft `fixture-interfaces.ts:159-197`) are OUT OF SCOPE for Phase 4 — they already exist in praman as `navigation.ts` handlers + `ui5-handler.ts`. No duplication needed.

#### 10.5.1 File: `src/fe/fe-browser-scripts.ts` (~250 LOC)

**Purpose**: Browser-side string constants for OPA5 test library integration. All scripts are string constants injected into the browser context via `page.evaluate()`. Per P12, NO module-level functions are serialized — these are pure string templates.

**Decisions**: P12 (string scripts only), P1 (pure constants — no class, no state)

**No dependencies** — this file is pure string constants with zero imports from the rest of the codebase.

````typescript
// ─── Browser Script Constants ─────────────────────────────────────────

/**
 * Script to load SAP Fiori Elements test libraries.
 *
 * Requires SAP UI5 runtime with FE test library modules available.
 * Loads `sap/fe/test/ListReport`, `sap/fe/test/ObjectPage`, `sap/fe/test/Shell`.
 * Stores classes on `window.fe_bridge` for subsequent scripts.
 *
 * @example
 * ```typescript
 * await page.evaluate(FE_LOAD_LIBRARIES_SCRIPT);
 * ```
 */
export const FE_LOAD_LIBRARIES_SCRIPT: string;

/**
 * Script to initialize OPA5 with page object configuration.
 *
 * Creates page objects from `TestLibraryConfig`, initializes `Opa5.createPageObjects()`,
 * configures OPA5 timeouts, and sets up assertion logging via `Opa5.assert.ok`.
 *
 * @remarks
 * Must be called AFTER `FE_LOAD_LIBRARIES_SCRIPT`.
 * Accepts serialized `TestLibraryConfig` as argument.
 *
 * @example
 * ```typescript
 * await page.evaluate(FE_INIT_OPA_SCRIPT, config);
 * ```
 */
export const FE_INIT_OPA_SCRIPT: string;

/**
 * Script to add method calls to the OPA5 queue.
 *
 * Processes `ProxyMethodCall[]`, resolves each to the correct
 * OPA5 scope (arrangements/actions/assertions), and executes the
 * method chain on the page object.
 *
 * @remarks
 * Must be called AFTER `FE_INIT_OPA_SCRIPT`.
 * Accepts serialized `ProxyMethodCall[]` as argument.
 *
 * @example
 * ```typescript
 * await page.evaluate(FE_ADD_TO_QUEUE_SCRIPT, methodCalls);
 * ```
 */
export const FE_ADD_TO_QUEUE_SCRIPT: string;

/**
 * Script to execute all queued OPA5 actions and collect logs.
 *
 * Calls `Opa.emptyQueue()`, collects assertion logs from
 * `window.fe_bridge.Log`, clears the log, and returns results.
 *
 * @remarks
 * Must be called AFTER `FE_ADD_TO_QUEUE_SCRIPT`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(FE_EMPTY_QUEUE_SCRIPT);
 * ```
 */
export const FE_EMPTY_QUEUE_SCRIPT: string;

/**
 * Script to detect BTP WorkZone environment.
 *
 * Checks for iframe presence and shell indicators
 * (`[id*="shell-"]`, `sap.ushell.Container`).
 * Returns `{ isWorkZone: boolean, hasShell: boolean, hasIframe: boolean }`.
 *
 * @example
 * ```typescript
 * const detection = await page.evaluate(FE_DETECT_WORKZONE_SCRIPT);
 * ```
 */
export const FE_DETECT_WORKZONE_SCRIPT: string;
````

**Estimated LOC**: ~250
**Tests**: 10 test cases

**Unit Tests** (`tests/unit/fe/fe-browser-scripts.test.ts`):

| #   | Test Case                                                  | Input / Scenario   | Expected                                         |
| --- | ---------------------------------------------------------- | ------------------ | ------------------------------------------------ |
| 1   | FE_LOAD_LIBRARIES_SCRIPT is a non-empty string             | constant check     | typeof === 'string', length > 0                  |
| 2   | FE_LOAD_LIBRARIES_SCRIPT contains sap/fe/test module paths | content inspection | includes 'sap/fe/test/ListReport'                |
| 3   | FE_INIT_OPA_SCRIPT is a non-empty string                   | constant check     | typeof === 'string', length > 0                  |
| 4   | FE_INIT_OPA_SCRIPT contains Opa5.createPageObjects         | content inspection | includes 'createPageObjects'                     |
| 5   | FE_ADD_TO_QUEUE_SCRIPT is a non-empty string               | constant check     | typeof === 'string', length > 0                  |
| 6   | FE_ADD_TO_QUEUE_SCRIPT handles Given/When/Then scopes      | content inspection | includes 'arrangements', 'actions', 'assertions' |
| 7   | FE_EMPTY_QUEUE_SCRIPT is a non-empty string                | constant check     | typeof === 'string', length > 0                  |
| 8   | FE_EMPTY_QUEUE_SCRIPT calls emptyQueue                     | content inspection | includes 'emptyQueue'                            |
| 9   | FE_DETECT_WORKZONE_SCRIPT is a non-empty string            | constant check     | typeof === 'string', length > 0                  |
| 10  | FE_DETECT_WORKZONE_SCRIPT checks for shell indicators      | content inspection | includes 'shell' and 'iframe'                    |

#### 10.5.2 File: `src/fe/fe-test-library.ts` (~200 LOC)

**Purpose**: Node.js facade for the OPA5 FE Test Library. Provides `initializeFETestLibrary()` factory function and `FETestLibraryInstance` class for stateful execute/proxy/queue management.

**Decisions**: P1 (class exception for stateful managers), P2 (minimal page interface), P12 (string scripts), P10 (use existing PramanError subclasses)

**Dependencies**:

- `./fe-browser-scripts.js` — browser script string constants
- `./types.js` — `TestLibraryConfig`, `ProxyMethodCall`, `FETestLibraryResponse`
- `#core/logging/logger.js` — `createLogger('fe-test-library')`
- `#core/errors/control-error.js` — `ControlError`
- `#core/errors/codes.js` — `ErrorCode`

````typescript
import type { UI5ControlBase } from '#core/types/controls.js';

// ─── Types ───────────────────────────────────────────────────────────

/**
 * Minimal page interface for FE test library operations.
 */
export interface FETestLibraryPage {
  evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>; // String scripts ONLY (P12)
  locator(selector: string): { count(): Promise<number> };
}

/**
 * Options for FE test library initialization.
 */
export interface FETestLibraryOptions {
  /** Auto-detect and handle BTP WorkZone dual-context. Default: true */
  readonly detectWorkZone?: boolean;
  /** Timeout for OPA5 operations in ms. Default: 15000 */
  readonly timeout?: number;
  /** Polling interval for OPA5 checks in ms. Default: 400 */
  readonly pollingInterval?: number;
}

// ─── Factory Function ────────────────────────────────────────────────

/**
 * Initialize the FE Test Library and return a stateful instance.
 *
 * Injects browser-side OPA5 scripts, loads FE test library modules,
 * initializes page objects, and optionally detects WorkZone dual-context.
 *
 * @param page - Page with evaluate capability
 * @param config - Test library configuration with page objects
 * @param options - Initialization options (WorkZone detection, timeouts)
 * @returns Initialized FETestLibraryInstance
 * @throws ControlError if library loading or OPA5 initialization fails
 *
 * @example
 * ```typescript
 * const feLib = await initializeFETestLibrary(page, {
 *   onTheMainPage: {
 *     ListReport: { appId: 'my.app', componentId: 'container', entitySet: 'Products' }
 *   }
 * });
 * ```
 */
export async function initializeFETestLibrary(
  page: FETestLibraryPage,
  config: Readonly<TestLibraryConfig>,
  options?: FETestLibraryOptions,
): Promise<FETestLibraryInstance>;

// ─── Stateful Class (P1 Exception) ──────────────────────────────────

/**
 * FE Test Library instance for executing OPA5 Given/When/Then patterns.
 *
 * @remarks
 * This is a stateful class (P1 exception for stateful managers).
 * Manages initialization state, configuration, method call history,
 * and WorkZone dual-context switching.
 *
 * Created exclusively via {@link initializeFETestLibrary} — constructor is private.
 *
 * @example
 * ```typescript
 * const feLib = await initializeFETestLibrary(page, config);
 * const logs = await feLib.execute((Given, When, Then) => {
 *   When.onTheMainPage.onFilterBar().iChangeSearchField('test');
 *   Then.onTheMainPage.onTable().iCheckRows(5);
 * });
 * ```
 */
export class FETestLibraryInstance {
  /** Test library configuration (frozen). */
  readonly config: Readonly<TestLibraryConfig>;

  /** Whether the instance has been initialized. */
  readonly isInitialized: boolean;

  /**
   * Execute test steps using the Given/When/Then pattern.
   *
   * Creates proxies that capture method calls, queues them in the browser
   * via OPA5, executes the queue, and returns assertion logs.
   *
   * @param fn - Function receiving (Given, When, Then) proxies
   * @returns Array of assertion log strings from OPA5 execution
   * @throws ControlError if not initialized, queue fails, or execution fails
   *
   * @example
   * ```typescript
   * const logs = await feLib.execute((Given, When, Then) => {
   *   When.onTheMainPage.onFilterBar().iChangeSearchField('test');
   *   Then.onTheMainPage.onTable().iCheckRows(5);
   * });
   * ```
   */
  async execute(
    fn: (Given: unknown, When: unknown, Then: unknown) => void | Promise<void>,
  ): Promise<readonly string[]>;

  /**
   * Get available page object keys from configuration.
   *
   * @returns Array of page object names (e.g., ['onTheMainPage', 'onTheDetailPage'])
   *
   * @example
   * ```typescript
   * const keys = feLib.getPageKeys(); // ['onTheMainPage', 'onTheDetailPage']
   * ```
   */
  getPageKeys(): readonly string[];

  /**
   * Get method call history from the last execution (for debugging).
   *
   * @returns Array of captured method calls from last `execute()` invocation
   *
   * @example
   * ```typescript
   * const history = feLib.getMethodCallHistory();
   * // [{ type: 'When', target: 'onTheMainPage', methods: [...] }]
   * ```
   */
  getMethodCallHistory(): readonly ProxyMethodCall[];

  /**
   * Get shell instance for WorkZone dual-context support.
   *
   * @returns Shell FETestLibraryInstance if WorkZone detected, undefined otherwise
   */
  getShellInstance(): FETestLibraryInstance | undefined;

  /**
   * Switch to WorkZone shell context.
   *
   * @throws ControlError if not in a WorkZone environment
   *
   * @example
   * ```typescript
   * await feLib.toShell();
   * ```
   */
  async toShell(): Promise<void>;

  /**
   * Switch to WorkZone app (iframe) context.
   *
   * @throws ControlError if not in a WorkZone environment
   *
   * @example
   * ```typescript
   * await feLib.toApp();
   * ```
   */
  async toApp(): Promise<void>;
}
````

**Estimated LOC**: ~200
**Tests**: 20 test cases

**Unit Tests** (`tests/unit/fe/fe-test-library.test.ts`):

| #   | Test Case                                                    | Input / Scenario                                         | Expected                                       |
| --- | ------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------- |
| 1   | initializeFETestLibrary returns FETestLibraryInstance        | valid config                                             | instance with isInitialized=true               |
| 2   | initializeFETestLibrary throws for empty config              | config=`{}`                                              | throws ControlError                            |
| 3   | initializeFETestLibrary throws for invalid config            | config=null                                              | throws ControlError                            |
| 4   | initializeFETestLibrary throws when library load fails       | page.evaluate rejects (FE libs missing)                  | throws ControlError with ERR_CONTROL_NOT_FOUND |
| 5   | initializeFETestLibrary throws when OPA5 init fails          | page.evaluate returns error result                       | throws ControlError                            |
| 6   | initializeFETestLibrary calls FE_LOAD_LIBRARIES_SCRIPT       | valid config                                             | page.evaluate called with load script          |
| 7   | initializeFETestLibrary calls FE_INIT_OPA_SCRIPT with config | valid config                                             | page.evaluate called with init script + config |
| 8   | execute captures Given/When/Then method calls                | fn with When.onTheMainPage.onFilterBar()                 | methodCalls array populated                    |
| 9   | execute calls FE_ADD_TO_QUEUE_SCRIPT with captured calls     | fn with 2 method calls                                   | page.evaluate called with add-to-queue + calls |
| 10  | execute calls FE_EMPTY_QUEUE_SCRIPT                          | valid execution                                          | page.evaluate called with empty-queue          |
| 11  | execute returns assertion logs                               | queue returns feLogs=['ok']                              | returns `['ok']`                               |
| 12  | execute throws when not initialized                          | instance not initialized                                 | throws ControlError                            |
| 13  | execute throws when queue add fails                          | addToQueue returns error                                 | throws ControlError                            |
| 14  | execute throws when queue execution fails                    | emptyQueue returns error                                 | throws ControlError                            |
| 15  | getPageKeys returns config keys                              | config with onTheMainPage, onTheDetailPage               | `['onTheMainPage', 'onTheDetailPage']`         |
| 16  | getMethodCallHistory returns last execution calls            | after execute with 3 calls                               | 3 ProxyMethodCall objects                      |
| 17  | getMethodCallHistory returns empty before first execute      | no execute called                                        | `[]`                                           |
| 18  | getShellInstance returns undefined when no WorkZone          | detectWorkZone=false or no WZ detected                   | undefined                                      |
| 19  | proxy captures chained method calls correctly                | When.onTheMainPage.onFilterBar().iChangeSearchField('x') | correct ProxyMethodCall with 2 methods         |
| 20  | proxy captures .and/.when/.then accessor chains              | When.onTheMainPage.onTable().and.iCheckRows(5)           | accessor flag set on 'and' method              |

**Type Tests** (`tests/unit/fe/fe-test-library.types.test.ts`):

| #   | Test Case                                    | Assertion                                                             |
| --- | -------------------------------------------- | --------------------------------------------------------------------- |
| 1   | FETestLibraryInstance has execute method     | `expectTypeOf<FETestLibraryInstance>().toHaveProperty('execute')`     |
| 2   | FETestLibraryInstance has getPageKeys method | `expectTypeOf<FETestLibraryInstance>().toHaveProperty('getPageKeys')` |
| 3   | FETestLibraryPage has evaluate method        | `expectTypeOf<FETestLibraryPage>().toHaveProperty('evaluate')`        |

#### 10.5.3 Types for FE Test Library (in `src/fe/types.ts`)

The following types support the FE Test Library and are added to the existing `src/fe/types.ts` file:

````typescript
/**
 * Test library configuration for OPA5 page objects.
 *
 * @example
 * ```typescript
 * const config: TestLibraryConfig = {
 *   onTheMainPage: {
 *     ListReport: { appId: 'my.app', componentId: 'container', entitySet: 'Products' }
 *   },
 *   onTheDetailPage: {
 *     ObjectPage: { appId: 'my.app', componentId: 'container', entitySet: 'Products' }
 *   }
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
 * Method call captured by the Given/When/Then proxy.
 *
 * @example
 * ```typescript
 * const call: ProxyMethodCall = {
 *   type: 'When',
 *   target: 'onTheMainPage',
 *   methods: [
 *     { name: 'onFilterBar', accessor: false },
 *     { name: 'iChangeSearchField', args: ['test'], accessor: false }
 *   ]
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
 * Response envelope from browser-side FE test library execution.
 */
export interface FETestLibraryResponse {
  readonly type: 'success' | 'error';
  readonly feLogs?: readonly string[];
  readonly message?: string;
}

/**
 * Fixture interface for the FE Test Library.
 *
 * Provides typed access to FE Test Library operations within
 * a Playwright test fixture context.
 */
export interface TestLibraryFixture {
  /** Initialize the FE test library */
  readonly initialize: (
    config: Readonly<TestLibraryConfig>,
  ) => Promise<import('./fe-test-library.js').FETestLibraryInstance>;
  /** Execute Given/When/Then steps on an initialized instance */
  readonly execute: (
    instance: import('./fe-test-library.js').FETestLibraryInstance,
    fn: (Given: unknown, When: unknown, Then: unknown) => void | Promise<void>,
  ) => Promise<readonly string[]>;
}
````

**Estimated additional LOC in `fe/types.ts`**: ~80

#### 10.5.4 Safe Limits Check for 4.5e

| File                         | Est. LOC | Tokens (source) | Tokens (context) | Single Turn? | Notes                                              |
| ---------------------------- | -------- | --------------- | ---------------- | ------------ | -------------------------------------------------- |
| `fe-browser-scripts.ts`      | ~250     | ~1,000          | ~8,000           | YES          | Pure string constants, largest single file in 4.5e |
| `fe-test-library.ts`         | ~200     | ~800            | ~8,000           | YES          | Class + factory, moderate complexity               |
| `fe-browser-scripts.test.ts` | ~100     | ~500            | ~8,000           | YES          | Simple string content checks                       |
| `fe-test-library.test.ts`    | ~200     | ~1,000          | ~9,000           | YES          | 20 tests with mock page                            |
| `fe/types.ts` (additions)    | ~80      | ~320            | —                | YES          | Type-only, merged into B6a                         |

**Context budget**: Each task needs ~8,000-10,000 tokens of context (CLAUDE.md + plan section + exemplar + imports). Well within the 200K context window.

**Output budget**: Largest output is `fe-browser-scripts.ts` at ~250 LOC = ~1,000 tokens. Well within the ~4,000 token response limit.

---

## 11. Sub-Phase 4.6 — Integration + Barrel Updates + Fixture Types

### 11.1 Barrel: `src/modules/index.ts`

Add exports for new modules:

```typescript
// Existing exports (keep)
export * from './navigation.js';
export * from './workzone.js';

// Phase 4 additions
export * from './table.js';
export * from './table-operations.js'; // <!-- GAP FIX: P14 table split -->
export * from './dialog.js';
export * from './date.js';
export * from './odata.js';
export * from './odata-http.js'; // <!-- GAP FIX: P15 odata split -->
```

### 11.2 Barrel: `src/fe/index.ts`

Replace empty stub with real exports:

```typescript
/**
 * Fiori Elements test helpers.
 *
 * @module fe
 */
export * from './list-report.js';
export * from './object-page.js';
export * from './fe-table-helpers.js'; // <!-- GAP FIX: P18 FE helpers -->
export * from './fe-list-helpers.js'; // <!-- GAP FIX: P18 FE helpers -->
export * from './fe-test-library.js'; // <!-- P16 INCLUDED: FE Test Library -->
export * from './fe-browser-scripts.js'; // <!-- P16 INCLUDED: browser-side scripts -->
```

### 11.3 Barrel: `src/index.ts`

Add Phase 4 exports to main barrel. New exports:

```typescript
// Table operations (core)
export {
  detectTableType,
  getTableRows,
  getTableRowCount,
  getTableCellValue,
  getTableData,
  selectTableRow,
  selectAllTableRows,
  deselectAllTableRows,
  waitForTableData,
  getSelectedRows, // <!-- GAP FIX: from dhikraft table.ts:930-975 -->
} from './modules/table.js';
export type {
  TableVariant,
  TableInfo,
  TableOptions,
  WaitForTableDataOptions,
} from './modules/table.js';

// Table operations (advanced)                                        // <!-- GAP FIX: P14 table-operations split -->
export {
  findRowByValues,
  findRowByValuesAtIndex,
  getCells,
  getCell,
  getCellValue,
  getColumnNames,
  setTableValue,
  clickRow,
  selectRowByValues,
  ensureRowVisible,
  filterByColumn,
  sortByColumn,
  getSortOrder,
  getFilterValue,
  exportTableData,
  clickTableSettingsButton,
} from './modules/table-operations.js';
export type {
  ColumnValueCriteria,
  TableFilterOptions,
  TableSortOptions,
  SortOrderInfo,
  TableExportOptions,
} from './modules/table-operations.js';

// Dialog operations
export {
  waitForDialog,
  getOpenDialogs,
  isDialogOpen,
  dismissDialog,
  confirmDialog,
  waitForDialogClosed,
  getDialogButtons, // <!-- GAP FIX: from dhikraft dialog-helpers.ts:288-330 -->
  DIALOG_CONTROL_TYPES, // <!-- GAP FIX: from dhikraft dialog-helpers.ts:37-46 -->
} from './modules/dialog.js';
export type {
  DialogOptions,
  FindDialogOptions,
  DialogInfo,
  DialogButtonInfo, // <!-- GAP FIX -->
  DialogControlType, // <!-- GAP FIX -->
} from './modules/dialog.js';

// Date operations
export {
  setDatePickerValue,
  getDatePickerValue,
  setDateRangeSelection,
  getDateRangeSelection, // <!-- GAP FIX: from dhikraft ui5-date-handler.ts:452-473 -->
  setAndValidateDate, // <!-- GAP FIX: from dhikraft ui5-date-handler.ts:505-512 -->
  setTimePickerValue,
  getTimePickerValue,
  formatDateForUI5,
  DATE_FORMATS, // <!-- GAP FIX: from dhikraft date-types.ts:20-31 -->
} from './modules/date.js';
export type {
  DateInput,
  DateOptions,
  DateRangeResult, // <!-- GAP FIX -->
  DateFormatPattern, // <!-- GAP FIX -->
} from './modules/date.js';

// OData operations (model-level)
export {
  getModelData,
  getModelProperty,
  waitForODataLoad,
  fetchCSRFToken,
  getEntityCount,
  hasPendingChanges,
} from './modules/odata.js';
export type { ODataOptions, WaitForODataLoadOptions, CSRFTokenResult } from './modules/odata.js';

// OData operations (HTTP-level)                                      // <!-- GAP FIX: P15 odata-http -->
export {
  createEntity,
  updateEntity,
  deleteEntity,
  callFunctionImport,
  queryEntities,
} from './modules/odata-http.js';
export type { ODataHttpOptions, ODataQueryOptions, ODataHttpResult } from './modules/odata-http.js';
```

Note: FE exports go through the `./fe` sub-path, NOT the main barrel.

### 11.4 Matcher refactoring verification

After `matcher-utils.ts` extraction, verify:

- `table-matchers.ts` imports from `./matcher-utils.js`
- `ui5-matchers.ts` imports from `./matcher-utils.js`
- All 36 existing matcher tests still pass
- `src/matchers/index.ts` barrel unchanged (does not export matcher-utils — it's internal)
- New matchers `toHaveUI5Binding` and `toBeUI5ControlType` are registered in matcher index

### 11.5 Fixture Types <!-- GAP FIX: added from dhikraft fixture-composite-types.ts per P18 -->

Add fixture type interfaces that compose the new Phase 4 modules:

```typescript
// In src/fe/types.ts (definitive location — see audit resolution A5)

import type { ObjectPagePage } from '../fe/object-page.js';
import type { ListReportPage } from '../fe/list-report.js';
import type { FETablePage } from '../fe/fe-table-helpers.js';
import type { FEListPage } from '../fe/fe-list-helpers.js';

/**
 * Fixture interface for Object Page testing.                         <!-- GAP FIX: from dhikraft fixture-composite-types.ts:40-53 -->
 *
 * Provides typed access to Object Page operations within
 * a Playwright test fixture context.
 */
export interface ObjectPageFixture {
  /** Navigate to a section by title or ID */
  readonly navigateToSection: (sectionTitleOrId: string) => Promise<void>;
  /** Get data from a section */
  readonly getSectionData: (sectionTitleOrId: string) => Promise<Readonly<Record<string, unknown>>>;
  /** Click a button by name */
  readonly clickButton: (buttonName: string) => Promise<void>;
  /** Click the Edit button */
  readonly clickEdit: () => Promise<void>;
  /** Click the Save button */
  readonly clickSave: () => Promise<void>;
  /** Get all sections */
  readonly getSections: () => Promise<readonly import('../fe/object-page.js').ObjectPageSection[]>;
  /** Get header title */
  readonly getHeaderTitle: () => Promise<string>;
  /** Check edit mode */
  readonly isInEditMode: () => Promise<boolean>;
}

/**
 * Fixture interface for Fiori Elements testing.                      <!-- GAP FIX: from dhikraft fixture-composite-types.ts:101-106 -->
 *
 * Composes List Report + Object Page + FE helpers into a single fixture.
 */
export interface FioriElementsFixture {
  /** List Report page operations */
  readonly listReport: {
    readonly getTable: () => Promise<import('#core/types/controls.js').UI5ControlBase>;
    readonly getFilterBar: () => Promise<import('#core/types/controls.js').UI5ControlBase>;
    readonly setFilter: (fieldName: string, value: string) => Promise<void>;
    readonly search: () => Promise<void>;
    readonly clearFilters: () => Promise<void>;
    readonly navigateToItem: (rowIndex: number) => Promise<void>;
    readonly getVariants: () => Promise<readonly string[]>;
    readonly selectVariant: (name: string) => Promise<void>;
  };
  /** Object Page operations */
  readonly objectPage: ObjectPageFixture;
  /** FE table helpers (for FE-specific table IDs) */
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
  /** FE list helpers */
  readonly list: {
    readonly getItemCount: (listId: string) => Promise<number>;
    readonly getItemTitle: (listId: string, index: number) => Promise<string>;
    readonly findItemByTitle: (listId: string, title: string) => Promise<number>;
    readonly clickItem: (listId: string, index: number) => Promise<void>;
    readonly selectItem: (listId: string, index: number, selected: boolean) => Promise<void>;
  };
}
```

**NOTE on existing fixtures**: `UI5ShellFixture` (dhikraft `fixture-interfaces.ts:57-129`) and `UI5InteractFixture` (dhikraft `fixture-interfaces.ts:159-197`) already exist in praman as `navigation.ts` handlers and `ui5-handler.ts`. They are NOT duplicated here.

**Estimated additional LOC**: ~80 (type-only, no runtime code)
**Tests**: 4 type tests

**Type Tests** (`tests/unit/fe/fixture-types.test.ts`):

| #   | Test Case                                            | Assertion                                                                          |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1   | ObjectPageFixture has navigateToSection method       | `expectTypeOf<ObjectPageFixture>().toHaveProperty('navigateToSection')`            |
| 2   | FioriElementsFixture has listReport property         | `expectTypeOf<FioriElementsFixture>().toHaveProperty('listReport')`                |
| 3   | FioriElementsFixture.objectPage is ObjectPageFixture | `expectTypeOf<FioriElementsFixture['objectPage']>().toExtend<ObjectPageFixture>()` |
| 4   | FioriElementsFixture has table and list helpers      | `expectTypeOf<FioriElementsFixture>().toHaveProperty('table')`                     |

### 11.6 Sub-Phase 4.6b — Fixture Wiring Implementation <!-- REVIEW FIX: C1-PW (P19), C5-PW (P23) -->

**Purpose**: Wire all Phase 4 pure-function modules into the Playwright fixture system so test authors can access them via `{ ui5, fe }` destructuring. Without this, Phase 4 modules exist as standalone functions that are NOT discoverable or usable through the standard `test('...', async ({ ui5, fe }) => { ... })` pattern.

**Decision (P19, P23)**: Each fixture call auto-wraps in `test.step()` for Playwright Trace Viewer integration.

**API Design**: Extend `ui5` handler with sub-namespaces, create new `fe` fixture.

```typescript
// End-user API example:
import { test, expect } from 'playwright-praman';

test('table operations via fixture', async ({ ui5 }) => {
  // ui5.table — wraps table.ts and table-operations.ts
  const rows = await ui5.table.getRows('app--productsTable');
  const count = await ui5.table.getRowCount('app--productsTable');
  const row = await ui5.table.findRowByValues('app--table', { Product: 'Widget A' });
  await ui5.table.selectRow('app--table', 0);

  // ui5.dialog — wraps dialog.ts
  const dialog = await ui5.dialog.waitFor({ title: 'Confirm' });
  await ui5.dialog.confirm({ title: 'Confirm' });

  // ui5.date — wraps date.ts
  await ui5.date.setDatePicker('app--startDate', new Date('2024-03-15'));
  const value = await ui5.date.getDatePicker('app--startDate');

  // ui5.odata — wraps odata.ts + odata-http.ts
  const data = await ui5.odata.getModelData('app--table', '/Products');
  const { token } = await ui5.odata.fetchCSRFToken('/sap/opu/odata/sap/API_PRODUCT_SRV');
  const result = await ui5.odata.createEntity(
    '/sap/...',
    'Products',
    { Name: 'New' },
    { csrfToken: token },
  );
});

test('Fiori Elements via fixture', async ({ fe }) => {
  // fe.listReport — wraps list-report.ts
  await fe.listReport.search();
  await fe.listReport.setFilter('ProductName', 'Widget');
  const table = await fe.listReport.getTable();

  // fe.objectPage — wraps object-page.ts
  await fe.objectPage.navigateToSection('General Information');
  const data = await fe.objectPage.getSectionData('General Information');
  await fe.objectPage.clickEdit();
  await fe.objectPage.clickSave();

  // fe.table — wraps fe-table-helpers.ts
  const count = await fe.table.getRowCount('app--feTable');

  // fe.list — wraps fe-list-helpers.ts
  const itemCount = await fe.list.getItemCount('app--feList');
});
```

#### 11.6.1 File: `src/fixtures/module-fixtures.ts`

**Purpose**: Create test-scoped fixture that extends `ui5` with sub-namespace handlers for table, dialog, date, and odata modules. Each method is auto-wrapped in `test.step()`.

````typescript
import { test as base } from '@playwright/test';
import type { Page } from '@playwright/test';

// Table module imports
import {
  detectTableType,
  getTableRows,
  getTableRowCount,
  getTableCellValue,
  getTableData,
  selectTableRow,
  selectAllTableRows,
  deselectAllTableRows,
  waitForTableData,
  getSelectedRows,
} from '../modules/table.js';
import {
  findRowByValues,
  getCells,
  getCell,
  getCellValue,
  getColumnNames,
  setTableValue,
  clickRow,
  ensureRowVisible,
  filterByColumn,
  sortByColumn,
  exportTableData,
  clickTableSettingsButton,
} from '../modules/table-operations.js';
// Dialog module imports
import {
  waitForDialog,
  getOpenDialogs,
  isDialogOpen,
  dismissDialog,
  confirmDialog,
  getDialogButtons,
} from '../modules/dialog.js';
// Date module imports
import {
  setDatePickerValue,
  getDatePickerValue,
  setDateRangeSelection,
  getDateRangeSelection,
  setTimePickerValue,
  getTimePickerValue,
  setAndValidateDate,
} from '../modules/date.js';
// OData module imports
import {
  getModelData,
  getModelProperty,
  waitForODataLoad,
  fetchCSRFToken,
  getEntityCount,
  hasPendingChanges,
} from '../modules/odata.js';
import {
  createEntity,
  updateEntity,
  deleteEntity,
  callFunctionImport,
  queryEntities,
} from '../modules/odata-http.js';

/**
 * Step-wrapped function creator.                                      <!-- REVIEW FIX: C5-PW (P23) -->
 *
 * Wraps a module function call in `test.step()` for Playwright Trace Viewer.
 * The step name includes the namespace and function name for structured traces.
 *
 * @example
 * ```typescript
 * const getRows = wrapInStep('ui5.table.getRows', getTableRows);
 * // When called, Trace Viewer shows: "ui5.table.getRows"
 * ```
 */
function wrapInStep<TArgs extends readonly unknown[], TReturn>(
  stepName: string,
  fn: (page: Page, ...args: TArgs) => TReturn,
): (page: Page, ...args: TArgs) => Promise<Awaited<TReturn>> {
  return (...args) => base.step(stepName, () => fn(...args));
}

/**
 * UI5 table sub-namespace fixture interface.
 */
export interface UI5TableFixture {
  readonly getRows: (
    tableId: string,
    options?: import('../modules/table.js').TableOptions,
  ) => Promise<readonly import('#core/types/controls.js').UI5ControlBase[]>;
  readonly getRowCount: (
    tableId: string,
    options?: import('../modules/table.js').TableOptions,
  ) => Promise<number>;
  readonly getCellValue: (
    tableId: string,
    rowIndex: number,
    columnIndex: number,
  ) => Promise<string>;
  readonly getData: (tableId: string) => Promise<readonly Record<string, unknown>[]>;
  readonly selectRow: (tableId: string, rowIndex: number) => Promise<void>;
  readonly selectAll: (tableId: string) => Promise<void>;
  readonly deselectAll: (tableId: string) => Promise<void>;
  readonly waitForData: (
    tableId: string,
    options?: import('../modules/table.js').WaitForTableDataOptions,
  ) => Promise<void>;
  readonly getSelectedRows: (
    tableId: string,
  ) => Promise<readonly import('#core/types/controls.js').UI5ControlBase[]>;
  readonly findRowByValues: (
    tableId: string,
    values: Readonly<Record<string, string>>,
  ) => Promise<import('#core/types/controls.js').UI5ControlBase | null>;
  readonly getColumnNames: (tableId: string) => Promise<readonly string[]>;
  readonly exportData: (tableId: string) => Promise<readonly Record<string, string>[]>;
  readonly setTableValue: (
    tableId: string,
    rowIndex: number,
    columnName: string,
    value: string,
  ) => Promise<void>;
  readonly clickRow: (tableId: string, rowIndex: number) => Promise<void>;
  readonly selectRowByValues: (
    tableId: string,
    values: Readonly<Record<string, string>>,
  ) => Promise<void>;
  readonly ensureRowVisible: (tableId: string, index: number) => Promise<void>;
  readonly filterByColumn: (tableId: string, columnIndex: number, value: string) => Promise<void>;
  readonly sortByColumn: (
    tableId: string,
    columnIndex: number,
    descending?: boolean,
  ) => Promise<void>;
  readonly getSortOrder: (
    tableId: string,
    columnIndex: number,
  ) => Promise<import('../modules/table-operations.js').SortOrderInfo | null>;
  readonly getFilterValue: (tableId: string, columnIndex: number) => Promise<string | null>;
  readonly clickTableSettings: (tableId: string) => Promise<void>;
}

/**
 * UI5 dialog sub-namespace fixture interface.
 */
export interface UI5DialogFixture {
  readonly waitFor: (
    options?: import('../modules/dialog.js').FindDialogOptions,
  ) => Promise<import('#core/types/controls.js').UI5ControlBase>;
  readonly getOpen: () => Promise<readonly import('../modules/dialog.js').DialogInfo[]>;
  readonly isOpen: (dialogId: string) => Promise<boolean>;
  readonly dismiss: (options?: import('../modules/dialog.js').FindDialogOptions) => Promise<void>;
  readonly confirm: (options?: import('../modules/dialog.js').FindDialogOptions) => Promise<void>;
  readonly getButtons: (
    dialogId?: string,
  ) => Promise<readonly import('../modules/dialog.js').DialogButtonInfo[]>;
}

/**
 * UI5 date sub-namespace fixture interface.
 */
export interface UI5DateFixture {
  readonly setDatePicker: (
    controlId: string,
    date: import('../modules/date.js').DateInput,
    options?: import('../modules/date.js').DateOptions,
  ) => Promise<void>;
  readonly getDatePicker: (controlId: string) => Promise<string>;
  readonly setDateRange: (
    controlId: string,
    start: import('../modules/date.js').DateInput,
    end: import('../modules/date.js').DateInput,
  ) => Promise<void>;
  readonly getDateRange: (
    controlId: string,
  ) => Promise<import('../modules/date.js').DateRangeResult>;
  readonly setTimePicker: (controlId: string, time: string) => Promise<void>;
  readonly getTimePicker: (controlId: string) => Promise<string>;
  readonly setAndValidate: (
    controlId: string,
    date: import('../modules/date.js').DateInput,
  ) => Promise<void>;
}

/**
 * UI5 OData sub-namespace fixture interface.
 * Merges both model-level (odata.ts) and HTTP-level (odata-http.ts) operations.
 */
export interface UI5ODataFixture {
  // Model-level
  readonly getModelData: (controlId: string, path: string) => Promise<unknown>;
  readonly getModelProperty: (controlId: string, propertyPath: string) => Promise<unknown>;
  readonly waitForLoad: (
    controlId: string,
    options?: import('../modules/odata.js').WaitForODataLoadOptions,
  ) => Promise<void>;
  readonly fetchCSRFToken: (
    serviceUrl: string,
  ) => Promise<import('../modules/odata.js').CSRFTokenResult>;
  readonly getEntityCount: (controlId: string) => Promise<number>;
  readonly hasPendingChanges: (controlId: string) => Promise<boolean>;
  // HTTP-level
  readonly createEntity: <T = unknown>(
    serviceUrl: string,
    entitySet: string,
    data: Readonly<Record<string, unknown>>,
    options?: import('../modules/odata-http.js').ODataHttpOptions,
  ) => Promise<import('../modules/odata-http.js').ODataHttpResult<T>>;
  readonly updateEntity: <T = unknown>(
    serviceUrl: string,
    entitySet: string,
    key: string,
    data: Readonly<Record<string, unknown>>,
    options?: import('../modules/odata-http.js').ODataHttpOptions,
  ) => Promise<import('../modules/odata-http.js').ODataHttpResult<T>>;
  readonly deleteEntity: (
    serviceUrl: string,
    entitySet: string,
    key: string,
    options?: import('../modules/odata-http.js').ODataHttpOptions,
  ) => Promise<void>;
  readonly queryEntities: <T = unknown>(
    serviceUrl: string,
    entitySet: string,
    options?: import('../modules/odata-http.js').ODataQueryOptions,
  ) => Promise<import('../modules/odata-http.js').ODataHttpResult<readonly T[]>>;
  readonly callFunctionImport: <T = unknown>(
    serviceUrl: string,
    functionName: string,
    params?: Readonly<Record<string, unknown>>,
    method?: 'GET' | 'POST',
  ) => Promise<import('../modules/odata-http.js').ODataHttpResult<T>>;
}

/**
 * Extended UI5Handler with sub-namespace fixtures.
 *
 * Adds `.table`, `.dialog`, `.date`, `.odata` sub-namespaces to the
 * existing `ui5` fixture. Each call is auto-wrapped in `test.step()`.
 */
export interface ExtendedUI5Fixtures {
  /** UI5 table operations via ui5.table.* */
  readonly table: UI5TableFixture;
  /** UI5 dialog operations via ui5.dialog.* */
  readonly dialog: UI5DialogFixture;
  /** UI5 date picker operations via ui5.date.* */
  readonly date: UI5DateFixture;
  /** UI5 OData operations via ui5.odata.* */
  readonly odata: UI5ODataFixture;
}
````

**Estimated LOC**: ~220

**Implementation pattern**: The `moduleTest` fixture creates the sub-namespace objects, each method curries `page` and wraps in `test.step()`:

```typescript
export const moduleTest = coreTest.extend<{ ui5: UI5Handler & ExtendedUI5Fixtures }>({
  ui5: async ({ page, pramanConfig, rootLogger }, use) => {
    // ... existing UI5Handler creation (same as core-fixtures.ts) ...
    const handler = new UI5Handler({ page, ... });

    // Attach sub-namespaces with test.step() wrapping
    const tableFixture: UI5TableFixture = {
      getRows: (tableId, opts) => base.step('ui5.table.getRows', () => getTableRows(page, tableId, opts)),
      getRowCount: (tableId, opts) => base.step('ui5.table.getRowCount', () => getTableRowCount(page, tableId, opts)),
      // ... etc
    };

    const extended = Object.assign(handler, {
      table: tableFixture,
      dialog: dialogFixture,
      date: dateFixture,
      odata: odataFixture,
    });

    await use(extended);
  },
});
```

#### 11.6.2 File: `src/fixtures/fe-fixtures.ts`

**Purpose**: Create the `fe` fixture providing Fiori Elements operations via `{ fe }` destructuring. Wraps list-report, object-page, fe-table-helpers, and fe-list-helpers modules.

````typescript
import { test as base } from '@playwright/test';
import type { FioriElementsFixture } from '../fe/types.js';

// List Report imports
import {
  getListReportTable,
  getFilterBar,
  setFilterBarField,
  getFilterBarFieldValue,
  executeSearch,
  clearFilterBar,
  navigateToItem,
  getAvailableVariants,
  selectVariant,
} from '../fe/list-report.js';
// Object Page imports
import {
  navigateToSection,
  getSectionData,
  clickObjectPageButton,
  clickEditButton,
  clickSaveButton,
  getObjectPageSections,
  getHeaderTitle,
  isInEditMode,
} from '../fe/object-page.js';
// FE Table Helper imports
import {
  feGetTableRowCount,
  feGetCellValue,
  feFindRowByValues,
  feClickRow,
  feGetColumnNames,
} from '../fe/fe-table-helpers.js';
// FE List Helper imports
import {
  feGetListItemCount,
  feGetListItemTitle,
  feFindListItemByTitle,
  feClickListItem,
  feSelectListItem,
} from '../fe/fe-list-helpers.js';

/**
 * FE test fixture providing Fiori Elements operations.
 *
 * Each call is auto-wrapped in `test.step()` for Trace Viewer.
 *
 * @example
 * ```typescript
 * import { test } from 'playwright-praman';
 *
 * test('FE list report', async ({ fe }) => {
 *   await fe.listReport.search();
 *   const sections = await fe.objectPage.getSections();
 * });
 * ```
 */
export const feTest = base.extend<{ fe: FioriElementsFixture }>({
  fe: async ({ page }, use) => {
    const feFixture: FioriElementsFixture = {
      listReport: {
        getTable: () => base.step('fe.listReport.getTable', () => getListReportTable(page)),
        getFilterBar: () => base.step('fe.listReport.getFilterBar', () => getFilterBar(page)),
        setFilter: (field, value) =>
          base.step(`fe.listReport.setFilter(${field})`, () =>
            setFilterBarField(page, field, value),
          ),
        search: () => base.step('fe.listReport.search', () => executeSearch(page)),
        clearFilters: () => base.step('fe.listReport.clearFilters', () => clearFilterBar(page)),
        navigateToItem: (idx) =>
          base.step(`fe.listReport.navigateToItem(${String(idx)})`, () =>
            navigateToItem(page, idx),
          ),
        getVariants: () => base.step('fe.listReport.getVariants', () => getAvailableVariants(page)),
        selectVariant: (name) =>
          base.step(`fe.listReport.selectVariant(${name})`, () => selectVariant(page, name)),
      },
      objectPage: {
        navigateToSection: (s) =>
          base.step(`fe.objectPage.navigateToSection(${s})`, () => navigateToSection(page, s)),
        getSectionData: (s) =>
          base.step(`fe.objectPage.getSectionData(${s})`, () => getSectionData(page, s)),
        clickButton: (b) =>
          base.step(`fe.objectPage.clickButton(${b})`, () => clickObjectPageButton(page, b)),
        clickEdit: () => base.step('fe.objectPage.clickEdit', () => clickEditButton(page)),
        clickSave: () => base.step('fe.objectPage.clickSave', () => clickSaveButton(page)),
        getSections: () =>
          base.step('fe.objectPage.getSections', () => getObjectPageSections(page)),
        getHeaderTitle: () => base.step('fe.objectPage.getHeaderTitle', () => getHeaderTitle(page)),
        isInEditMode: () => base.step('fe.objectPage.isInEditMode', () => isInEditMode(page)),
      },
      table: {
        getRowCount: (id) => base.step('fe.table.getRowCount', () => feGetTableRowCount(page, id)),
        getCellValue: (id, r, c) =>
          base.step('fe.table.getCellValue', () =>
            feGetCellValue(page, id, { rowIndex: r, columnName: c }),
          ),
        findRow: (id, v) => base.step('fe.table.findRow', () => feFindRowByValues(page, id, v)),
        clickRow: (id, r) => base.step('fe.table.clickRow', () => feClickRow(page, id, r)),
        getColumnNames: (id) =>
          base.step('fe.table.getColumnNames', () => feGetColumnNames(page, id)),
      },
      list: {
        getItemCount: (id) => base.step('fe.list.getItemCount', () => feGetListItemCount(page, id)),
        getItemTitle: (id, i) =>
          base.step('fe.list.getItemTitle', () => feGetListItemTitle(page, id, i)),
        findItemByTitle: (id, t) =>
          base.step('fe.list.findItemByTitle', () => feFindListItemByTitle(page, id, t)),
        clickItem: (id, i) => base.step('fe.list.clickItem', () => feClickListItem(page, id, i)),
        selectItem: (id, i, s) =>
          base.step('fe.list.selectItem', () => feSelectListItem(page, id, i, s)),
      },
    };
    await use(feFixture);
  },
});
````

**Estimated LOC**: ~130

#### 11.6.3 File: `src/fixtures/index.ts` (Update)

Update to merge the new fixtures:

```typescript
import { mergeTests } from '@playwright/test';

import { authTest } from './auth-fixtures.js';
import { coreTest } from './core-fixtures.js';
import { feTest } from './fe-fixtures.js'; // <!-- REVIEW FIX: C1-PW (P19) — NEW -->
import { moduleTest } from './module-fixtures.js'; // <!-- REVIEW FIX: C1-PW (P19) — NEW -->
import { navTest } from './nav-fixtures.js';
import { stabilityTest } from './stability-fixtures.js';

export const test = mergeTests(coreTest, authTest, navTest, stabilityTest, moduleTest, feTest);
```

#### 11.6.4 Fixture Unit Tests (`tests/unit/fixtures/module-fixtures.test.ts`)

| #   | Test Case                                               | Input / Scenario                        | Expected                                                    |
| --- | ------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| 1   | ui5.table.getRows wraps getTableRows with test.step     | call ui5.table.getRows('myTable')       | test.step('ui5.table.getRows') called, getTableRows invoked |
| 2   | ui5.dialog.waitFor wraps waitForDialog with test.step   | call ui5.dialog.waitFor({ title: 'X' }) | test.step('ui5.dialog.waitFor') called                      |
| 3   | ui5.date.setDatePicker wraps setDatePickerValue         | call ui5.date.setDatePicker(...)        | test.step called, setDatePickerValue invoked                |
| 4   | ui5.odata.getModelData wraps getModelData               | call ui5.odata.getModelData(...)        | test.step called, getModelData invoked                      |
| 5   | ui5.odata.createEntity wraps createEntity               | call ui5.odata.createEntity(...)        | test.step called, createEntity invoked                      |
| 6   | fe.listReport.search wraps executeSearch with test.step | call fe.listReport.search()             | test.step('fe.listReport.search') called                    |
| 7   | fe.objectPage.clickEdit wraps clickEditButton           | call fe.objectPage.clickEdit()          | test.step called                                            |
| 8   | fe.table.getRowCount wraps feGetTableRowCount           | call fe.table.getRowCount(id)           | test.step called                                            |
| 9   | fe.list.clickItem wraps feClickListItem                 | call fe.list.clickItem(id, 0)           | test.step called                                            |
| 10  | test.step name includes namespace and operation         | any fixture call                        | step name matches 'ui5.table.getRows' pattern               |

**Estimated tests**: 10

---

## 12. Complete File Inventory

### 12.1 Source Files (New)

| #   | File                                                                          | Est. LOC | Module              | Gap Fix                                                                                                                      |
| --- | ----------------------------------------------------------------------------- | -------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/matchers/matcher-utils.ts`                                               | ~150     | Pre-requisite       | +helpers for toHaveUI5Binding/toBeUI5ControlType                                                                             |
| 2   | `src/modules/table.ts`                                                        | ~280     | Table (core)        | +getSelectedRows                                                                                                             |
| 3   | `src/modules/table-operations.ts`                                             | ~250     | Table (operations)  | NEW: 17 functions from dhikraft                                                                                              |
| 4   | `src/modules/dialog.ts`                                                       | ~230     | Dialog              | +getDialogButtons, DIALOG_CONTROL_TYPES                                                                                      |
| 5   | `src/modules/date.ts`                                                         | ~210     | Date                | +locale/timezone/range/validation/constants                                                                                  |
| 6   | `src/modules/odata.ts`                                                        | ~220     | OData (model-level) | unchanged                                                                                                                    |
| 7   | `src/modules/odata-http.ts`                                                   | ~200     | OData (HTTP-level)  | NEW: 5 CRUD/query functions from dhikraft                                                                                    |
| 8   | `src/fe/list-report.ts`                                                       | ~220     | Fiori Elements      | +getAvailableVariants, selectVariant                                                                                         |
| 9   | `src/fe/object-page.ts`                                                       | ~200     | Fiori Elements      | Expanded: navigateToSection, getSectionData, clickObjectPageButton                                                           |
| 10  | `src/fe/fe-table-helpers.ts`                                                  | ~120     | Fiori Elements      | NEW: 5 FE table wrapper functions                                                                                            |
| 11  | `src/fe/fe-list-helpers.ts`                                                   | ~120     | Fiori Elements      | NEW: 6 FE list wrapper functions                                                                                             |
| 12  | `src/fe/fe-test-library.ts`                                                   | ~200     | FE Test Library     | NEW: OPA5 Given/When/Then facade (P16 INCLUDED)                                                                              |
| 13  | `src/fe/fe-browser-scripts.ts`                                                | ~250     | FE Test Library     | NEW: browser-side OPA5 string constants (P16 INCLUDED)                                                                       |
| 14  | `src/fe/types.ts`                                                             | ~160     | Fixture Types       | NEW: ObjectPageFixture, FioriElementsFixture + TestLibraryConfig, ProxyMethodCall, FETestLibraryResponse, TestLibraryFixture |
| 15  | _(removed — matcher types handled via existing registration pattern per P21)_ | —        | —                   | —                                                                                                                            |
| 16  | `src/fixtures/module-fixtures.ts`                                             | ~220     | Fixture Wiring      | NEW: ui5.table/dialog/date/odata sub-namespaces (P19) <!-- REVIEW FIX: C1-PW -->                                             |
| 17  | `src/fixtures/fe-fixtures.ts`                                                 | ~130     | Fixture Wiring      | NEW: fe fixture (listReport, objectPage, table, list) (P19) <!-- REVIEW FIX: C1-PW -->                                       |

**Total new source LOC**: ~3,080 (was ~2,630, delta +450 from P16 inclusion: fe-test-library.ts ~200 + fe-browser-scripts.ts ~250)

### 12.2 Source Files (Modified)

| #   | File                             | Change                                                                                                                          |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/matchers/table-matchers.ts` | Import from `./matcher-utils.js`, remove duplicated functions                                                                   |
| 2   | `src/matchers/ui5-matchers.ts`   | Import from `./matcher-utils.js`, remove duplicated function + add 2 new matchers                                               |
| 3   | `src/modules/index.ts`           | Add table, table-operations, dialog, date, odata, odata-http exports                                                            |
| 4   | `src/fe/index.ts`                | Replace stub with list-report + object-page + fe-table-helpers + fe-list-helpers + fe-test-library + fe-browser-scripts exports |
| 5   | `src/index.ts`                   | Add Phase 4 module exports (expanded with all new functions/types)                                                              |
| 6   | `src/matchers/index.ts`          | Register toHaveUI5Binding, toBeUI5ControlType matchers                                                                          |
| 7   | `src/fixtures/index.ts`          | Update mergeTests to include moduleTest + feTest <!-- REVIEW FIX: C1-PW -->                                                     |

### 12.3 Test Files (New)

| #   | Test File                                           | Tests Est. | Gap Fix                                                                       |
| --- | --------------------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| 1   | `tests/unit/matchers/matcher-utils.test.ts`         | 16         | +4 binding/type helpers + 4 error paths (C1-TDD)                              |
| 2   | `tests/unit/modules/table.test.ts`                  | 36         | +4 for getSelectedRows                                                        |
| 3   | `tests/unit/modules/table.types.test.ts`            | 4          | unchanged                                                                     |
| 4   | `tests/unit/modules/table-operations.test.ts`       | 42         | NEW: all operation functions + 4 error paths (C5-TDD)                         |
| 5   | `tests/unit/modules/table-operations.types.test.ts` | 3          | NEW: type tests                                                               |
| 6   | `tests/unit/modules/dialog.test.ts`                 | 28         | +6 for getDialogButtons + constants                                           |
| 7   | `tests/unit/modules/date.test.ts`                   | 30         | +8 for range/validate/locale/constants                                        |
| 8   | `tests/unit/modules/odata.test.ts`                  | 24         | unchanged                                                                     |
| 9   | `tests/unit/modules/odata-http.test.ts`             | 29         | NEW: HTTP CRUD tests + CSRF validation (C3-TDD) + error paths (C5-TDD)        |
| 10  | `tests/unit/fe/list-report.test.ts`                 | 24         | +6 for variants                                                               |
| 11  | `tests/unit/fe/object-page.test.ts`                 | 26         | +6 expanded + 4 error paths (C5-TDD)                                          |
| 12  | `tests/unit/fe/fe-table-helpers.test.ts`            | 12         | NEW: FE table helpers + 2 stability verification (C5-TDD)                     |
| 13  | `tests/unit/fe/fe-list-helpers.test.ts`             | 14         | NEW: FE list helpers + 2 stability verification (C5-TDD)                      |
| 14  | `tests/unit/fe/fixture-types.test.ts`               | 4          | NEW: fixture type tests                                                       |
| 15  | `tests/unit/fe/fe-test-library.test.ts`             | 20         | NEW: FE Test Library facade tests (P16 INCLUDED)                              |
| 16  | `tests/unit/fe/fe-browser-scripts.test.ts`          | 10         | NEW: FE browser scripts content tests (P16 INCLUDED)                          |
| 17  | `tests/unit/fe/fe-test-library.types.test.ts`       | 3          | NEW: FE Test Library type tests (P16 INCLUDED)                                |
| 18  | `tests/unit/matchers/ui5-matchers.test.ts` (update) | +8         | Matcher tests for 2 new matchers (+4 from C4-TDD) <!-- REVIEW FIX: C4-TDD --> |
| 19  | `tests/unit/fixtures/module-fixtures.test.ts`       | 10         | NEW: Fixture wiring tests <!-- REVIEW FIX: C1-PW -->                          |

**Total new test files**: 19 (was 16, +3 for FE Test Library tests)
**Total new test cases**: ~358 (was ~325, delta +33 from P16 inclusion: +20 fe-test-library + +10 fe-browser-scripts + +3 fe-test-library types)
**Running total after Phase 4**: ~1,864 tests (1,506 + 358)

---

## 13. Test Plan

### 13.1 Testing Strategy: TDD (P1 from CLAUDE.md)

For each module, the implementation sequence is:

1. Write test file defining expected behavior
2. Run tests — all fail (**RED**)
3. Implement source file to pass tests
4. Run tests — all pass (**GREEN**)
5. Refactor if needed (tests must still pass)
6. Run `npm run ci` — full validation

**Anti-pattern guard**: If RED phase shows test PASSES immediately → test is wrong, rewrite it.

### 13.2 Coverage Targets

Phase 4 modules fall under Tier 3 coverage:

| Metric     | Target | Enforcement     |
| ---------- | ------ | --------------- |
| Statements | 90%    | `perFile: true` |
| Branches   | 85%    | `perFile: true` |
| Functions  | 90%    | `perFile: true` |
| Lines      | 90%    | `perFile: true` |

**Exception**: `matcher-utils.ts` falls under matchers, which should be 90%+ (Tier 3).

### 13.3 Mock Strategy

All Phase 4 unit tests mock `page.evaluate()` to return controlled responses. No real browser, no real UI5. Implementation agents will follow the existing patterns established in Phase 1-3 tests (see `tests/unit/modules/navigation.test.ts` and `tests/unit/modules/workzone.test.ts` for examples).

### 13.4 Missing Test Cases — CSRF Validation for Write Operations <!-- REVIEW FIX: C3-TDD -->

**Addition to `tests/unit/modules/odata-http.test.ts`**:

These test cases verify that write operations (POST/PATCH/DELETE) properly validate CSRF token presence BEFORE sending the request.

| #   | Test Case                                                     | Input / Scenario                         | Expected                                                            |
| --- | ------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| 21  | updateEntity throws ODataError when no CSRF token for PATCH   | csrfToken not provided, PATCH operation  | throws ERR_ODATA_CSRF with message "CSRF token required for PATCH"  |
| 22  | deleteEntity throws ODataError when no CSRF token for DELETE  | csrfToken not provided, DELETE operation | throws ERR_ODATA_CSRF with message "CSRF token required for DELETE" |
| 23  | callFunctionImport throws ODataError when POST without CSRF   | method='POST', csrfToken not provided    | throws ERR_ODATA_CSRF with message "CSRF token required for POST"   |
| 24  | callFunctionImport does NOT throw when GET without CSRF token | method='GET', csrfToken not provided     | succeeds — GET does not require CSRF                                |

**Implementation note**: The CSRF validation happens at the module level (before calling `page.request.post/patch/delete`). If `options.csrfToken` is undefined or empty string for a write operation, throw `ODataError({ code: 'ERR_ODATA_CSRF', message: 'CSRF token required for ${method}', ... })`.

### 13.5 Missing Edge Case / Error Path Tests <!-- REVIEW FIX: C5-TDD -->

**Bulk addition of ~35-40 error path tests across modules**:

#### Table Operations Error Paths (`table-operations.test.ts` additions):

| #   | Test Case                                                 | Input / Scenario                        | Expected                     |
| --- | --------------------------------------------------------- | --------------------------------------- | ---------------------------- |
| 39  | exportTableData throws ControlError when evaluate rejects | page.evaluate rejects with bridge error | throws ControlError          |
| 40  | exportTableData returns empty when table has no columns   | getColumnNames returns `[]`             | returns `[]`                 |
| 41  | clickTableSettingsButton throws when button not found     | no settings button in toolbar           | throws ERR_CONTROL_NOT_FOUND |
| 42  | clickTableSettingsButton throws for non-SmartTable        | plain sap.m.Table (no toolbar)          | throws ERR_CONTROL_NOT_FOUND |

#### Object Page Error Paths (`object-page.test.ts` additions):

| #   | Test Case                                                   | Input / Scenario                     | Expected                     |
| --- | ----------------------------------------------------------- | ------------------------------------ | ---------------------------- |
| 23  | getHeaderTitle throws ControlError when no ObjectPageLayout | no layout on page                    | throws ERR_CONTROL_NOT_FOUND |
| 24  | getHeaderTitle returns empty string when title not set      | layout exists but no title property  | returns ''                   |
| 25  | isInEditMode throws ControlError when no ObjectPageLayout   | no layout on page                    | throws ERR_CONTROL_NOT_FOUND |
| 26  | isInEditMode returns false when showFooter is undefined     | layout exists but showFooter not set | returns false                |

#### FE Table/List Helper Error Paths (`fe-table-helpers.test.ts` and `fe-list-helpers.test.ts` additions):

| #   | Test Case                                                 | Input / Scenario            | Expected                       |
| --- | --------------------------------------------------------- | --------------------------- | ------------------------------ |
| 11  | feGetTableRowCount waits for UI5 stability before reading | page.waitForFunction called | waitForUI5Stable invoked first |
| 12  | feGetCellValue waits for UI5 stability before reading     | page.waitForFunction called | waitForUI5Stable invoked first |
| 13  | feGetListItemCount waits for UI5 stability before reading | page.waitForFunction called | waitForUI5Stable invoked first |
| 14  | feClickListItem waits for UI5 stability after click       | click completes             | waitForUI5Stable invoked after |

#### OData HTTP Error Paths (`odata-http.test.ts` additions):

| #   | Test Case                                                  | Input / Scenario                           | Expected                        |
| --- | ---------------------------------------------------------- | ------------------------------------------ | ------------------------------- |
| 25  | queryEntities throws ODataError on server 500              | page.request.get resolves with status 500  | throws ERR_ODATA_REQUEST_FAILED |
| 26  | queryEntities throws TimeoutError on request timeout       | page.request.get rejects with timeout      | throws ERR_TIMEOUT_OPERATION    |
| 27  | queryEntities throws ODataError on malformed JSON response | response.json() rejects                    | throws ERR_ODATA_PARSE          |
| 28  | createEntity throws ODataError on server 500               | page.request.post resolves with status 500 | throws ERR_ODATA_REQUEST_FAILED |
| 29  | deleteEntity throws ODataError when entity not found (404) | page.request.delete resolves with 404      | throws ERR_ODATA_REQUEST_FAILED |

#### Matcher Utils Error Paths (already added in Section 5.1, tests 9-12)

### 13.6 Type-Level Tests

Type tests use `expectTypeOf` from Vitest:

```typescript
import { expectTypeOf } from 'vitest';
import type { TableVariant, TableInfo } from '../../../src/modules/table.js';

it('TableVariant is a string literal union', () => {
  expectTypeOf<TableVariant>().toExtend<string>();
});
```

---

## 14. Impact Analysis

### 14.1 Files Modified (Existing)

| File                             | Change                                                        | Risk | Mitigation                          |
| -------------------------------- | ------------------------------------------------------------- | ---- | ----------------------------------- |
| `src/matchers/table-matchers.ts` | Extract to shared util                                        | Low  | Tests unchanged, same behavior      |
| `src/matchers/ui5-matchers.ts`   | Extract to shared util + add 2 new matchers                   | Low  | Tests unchanged, new tests added    |
| `src/matchers/index.ts`          | Register 2 new matchers                                       | Low  | Additive only                       |
| `src/modules/index.ts`           | Add table, table-ops, dialog, date, odata, odata-http exports | None | Additive only                       |
| `src/fe/index.ts`                | Replace stub with 4 module exports                            | None | Currently empty                     |
| `src/index.ts`                   | Add Phase 4 module exports (expanded)                         | Low  | Additive; `check:exports` validates |

### 14.2 Files NOT Modified

- All Phase 1–3 source files (core, bridge, proxy, auth, selectors) — except `src/fixtures/index.ts` which gains new mergeTests entries
- All existing test files (no regressions)
- `vitest.config.ts` (coverage thresholds already met)
- `tsup.config.ts` (FE entry point already configured)
- `package.json` (sub-path exports already wired)

### 14.3 Build Impact

| Metric       | Before Phase 4 | After Phase 4 (est.) |
| ------------ | -------------- | -------------------- |
| Source files | ~109           | ~126 (+17)           |
| Test files   | 88             | 107 (+19)            |
| Test count   | 1,506          | ~1,864 (+358)        |
| Source LOC   | ~8,500         | ~11,580 (+3,080)     |
| Bundle (ESM) | ~183 KB        | ~200 KB (+17 KB)     |
| Bundle (CJS) | ~185 KB        | ~202 KB (+17 KB)     |

### 14.4 Breaking Changes

**None.** Phase 4 is purely additive:

- New modules add functions; no existing API changed
- Matcher refactoring is internal (public API unchanged)
- New matchers (`toHaveUI5Binding`, `toBeUI5ControlType`) are additive
- Barrel additions are additive exports
- FE sub-path currently empty; adding exports has no consumers to break

### 14.5 Export Validation

After Phase 4, `npm run check:exports` (attw) must still pass 6/6 sub-paths:

- `.` — gains table, table-operations, dialog, date, odata, odata-http exports
- `./fe` — gains list-report, object-page, fe-table-helpers, fe-list-helpers, fe-test-library, fe-browser-scripts exports
- `./ai`, `./intents`, `./vocabulary`, `./reporters` — unchanged

---

## 15. Quality Gates (STRONG — 4 Levels)

Quality gates are BLOCKING unless explicitly marked `[ADVISORY]`. Failure at any blocking gate means: stop, fix, re-run.

### 15.0 Gate Definitions

| Gate Level | Scope              | When Checked                                | Blocking? |
| ---------- | ------------------ | ------------------------------------------- | --------- |
| **Gate 1** | Per-File           | After completing each source+test file pair | YES       |
| **Gate 2** | Per-Sub-Phase      | Before moving to next sub-phase             | YES       |
| **Gate 3** | Per-Batch          | Before declaring a batch complete           | YES       |
| **Gate 4** | Phase 4 Completion | Before declaring Phase 4 done               | YES       |

### 15.1 Gate 1: Per-File Gate

**When**: After implementing any source file + its test file pair.

| #     | Check                   | Command                                                      | Pass Criteria                                                                                                             | Fail Action                                                  | Blocking? |
| ----- | ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------- |
| G1.1  | TypeScript compiles     | `npm run typecheck`                                          | Exit code 0, zero errors                                                                                                  | Fix type errors immediately                                  | YES       |
| G1.2  | Lint clean              | `npm run lint`                                               | Exit code 0, zero errors, zero warnings                                                                                   | Fix lint issues. No eslint-disable without documented reason | YES       |
| G1.3  | New tests pass          | `npx vitest run tests/unit/<path>/<file>.test.ts`            | All tests in the file pass                                                                                                | Fix source or test until GREEN                               | YES       |
| G1.4  | Existing tests unbroken | `npx vitest run tests/unit/`                                 | All 1,506+ existing tests still pass                                                                                      | Revert changes that broke existing tests                     | YES       |
| G1.5  | Coverage per-file       | `npx vitest run --coverage tests/unit/<path>/<file>.test.ts` | Statements >= 90%, Branches >= 85%, Functions >= 90%, Lines >= 90%                                                        | Add missing test cases for uncovered paths                   | YES       |
| G1.6  | LOC limit               | `wc -l src/<path>/<file>.ts`                                 | <= 300 lines (document exceptions with `max-lines` eslint-disable + comment)                                              | Split into separate files if exceeds                         | YES       |
| G1.7  | TSDoc complete          | Manual review                                                | Every exported function has TSDoc with `@param`, `@returns`, `@example`                                                   | Add missing documentation                                    | YES       |
| G1.8  | Error codes valid       | Manual review                                                | All thrown errors use `ErrorCode.*` from `codes.ts`, not string literals                                                  | Fix to use ErrorCode constants                               | YES       |
| G1.9  | No `any` types          | `npm run typecheck`                                          | Zero `@typescript-eslint/no-explicit-any` violations in new code                                                          | Replace `any` with proper types                              | YES       |
| G1.10 | Browser scripts safe    | Manual review                                                | All `page.evaluate()` calls use string scripts or inner function declarations (P12). No module-level function references. | Refactor to inline functions                                 | YES       |

### 15.2 Gate 2: Per-Sub-Phase Gate

**When**: Before moving from one sub-phase to the next (e.g., 4.0 -> 4.1).

#### 15.2.1 Sub-Phase 4.0 Gate (Pre-requisites)

```bash
# Command sequence — all must pass
npm run typecheck                    # Zero errors
npm run lint                         # Zero errors, zero warnings
npm run test:unit                    # All 1,506+ existing tests + new matcher-utils tests pass
```

**Additional verification checklist**:

- [ ] `table-matchers.ts` imports `getControlProperty` and `getControlAggregation` from `./matcher-utils.js` (no duplication)
- [ ] `ui5-matchers.ts` imports `getControlProperty` from `./matcher-utils.js` (no duplication)
- [ ] All 36 existing matcher tests pass unchanged (regression check)
- [ ] `toHaveUI5Binding` and `toBeUI5ControlType` matchers pass all 8 new tests (M1-M8)
- [ ] `matcher-utils.ts` error path tests pass (tests 9-12)
- [ ] `getUI5BindingInfo` and `getUI5ControlType` helpers pass tests 9-12
- [ ] `matchers/index.ts` barrel updated: exports new matcher registration functions
- [ ] `core-fixtures.ts` `matcherRegistration` updated: registers `toHaveUI5Binding` and `toBeUI5ControlType`

**Pass criteria**: All commands exit 0, all checklist items verified.
**Fail action**: Fix and re-run. Do NOT proceed to 4.1.

#### 15.2.2 Sub-Phase 4.1 Gate (Table Module)

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build                        # Verify ESM+CJS compilation succeeds with new modules
```

**Additional verification checklist**:

- [ ] `table.ts` tests cover all 6 table variants: `sap.m.Table`, `sap.ui.table.Table`, `TreeTable`, `AnalyticalTable`, `SmartTable`, `sap.ui.mdc.Table`
- [ ] `table-operations.ts` tests cover all 17 exported functions
- [ ] SmartTable unwrap path tested (detectTableType with SmartTable returns inner table ID)
- [ ] `waitForTableData` uses `page.waitForFunction()`, NOT Node-side polling (P22)
- [ ] `table.ts` + `table-operations.ts` combined stay under their respective 300 LOC limits

#### 15.2.3 Sub-Phase 4.2 Gate (Dialog Module)

```bash
npm run typecheck
npm run lint
npm run test:unit
```

**Additional verification checklist**:

- [ ] `waitForDialog` uses `page.waitForFunction()`, NOT Node-side polling (P22)
- [ ] `DIALOG_CONTROL_TYPES` constant frozen and exported
- [ ] `getDialogButtons` returns `readonly DialogButtonInfo[]` with `text`, `id`, `type`, `enabled`

#### 15.2.4 Sub-Phase 4.3 Gate (Date Module)

```bash
npm run typecheck
npm run lint
npm run test:unit
```

**Additional verification checklist**:

- [ ] `formatDateForUI5` is a PURE function (no async, no page dependency) — testable without mocks
- [ ] `DATE_FORMATS` constant frozen and exported
- [ ] `setAndValidateDate` reads back value after setting and validates

#### 15.2.5 Sub-Phase 4.4 Gate (OData Module)

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

**Additional verification checklist**:

- [ ] `fetchCSRFToken` uses `page.request.head()`, NOT `page.evaluate()` with XHR (P20, C6-PW)
- [ ] `ODataCSRFPage` interface extends `ODataPage` with `request.head()`
- [ ] `ODataHttpPage` interface uses `.get()/.post()/.patch()/.delete()`, NOT `.fetch()` (P20)
- [ ] Write operations (POST/PATCH/DELETE) validate CSRF token presence before sending (C3-TDD)
- [ ] GET operations do NOT require CSRF token
- [ ] `odata.ts` imports do NOT reference `odata-http.ts` (lower module does not import sibling)

#### 15.2.6 Sub-Phase 4.5 Gate (Fiori Elements)

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run build
```

**Additional verification checklist**:

- [ ] `list-report.ts` imports from `../modules/table.js` (correct dependency direction)
- [ ] `fe-table-helpers.ts` imports from `../modules/table.js` and `../modules/table-operations.js`
- [ ] `fe-list-helpers.ts` does NOT import from `../modules/table.js` (independent)
- [ ] `object-page.ts` does NOT import from `../modules/table.js` (independent per P13)
- [ ] `fe-browser-scripts.ts` has ZERO imports (pure string constants)
- [ ] `fe-test-library.ts` imports from `./fe-browser-scripts.js` and `./types.js` only (plus #core/\* infrastructure)
- [ ] `fe-test-library.ts` uses `createLogger('fe-test-library')`, not `console.log`
- [ ] `FETestLibraryInstance` is a class (P1 exception for stateful managers — documented)
- [ ] All browser-side code in `fe-browser-scripts.ts` is string constants (P12)
- [ ] No FE module imports from `../fixtures/*` (layer violation)
- [ ] Layer rule enforced: `fe/* -> modules/*` is allowed; `modules/* -> fe/*` is forbidden

#### 15.2.7 Sub-Phase 4.6a Gate (Barrel Updates + Fixture Types)

```bash
npm run ci                           # Full pipeline: validate:no-js + lint + typecheck + test:unit + build + lint:ui5-deprecated
npm run check:exports                # attw validates all 6 sub-path exports resolve correctly
```

**Additional verification checklist**:

- [ ] `src/modules/index.ts` exports all 6 new module files
- [ ] `src/fe/index.ts` exports all 6 FE module files (list-report, object-page, fe-table-helpers, fe-list-helpers, fe-test-library, fe-browser-scripts)
- [ ] `src/index.ts` exports all Phase 4 public functions and types from main barrel
- [ ] `src/fe/types.ts` (or wherever fixture types land) exports `ObjectPageFixture` and `FioriElementsFixture`
- [ ] `npm run check:exports` passes 6/6 sub-paths: `.`, `./ai`, `./intents`, `./vocabulary`, `./fe`, `./reporters`
- [ ] No duplicate symbol names across barrel exports (no two different types with the same name)
- [ ] `import type` used for type-only re-exports (verbatimModuleSyntax compliance)

#### 15.2.8 Sub-Phase 4.6b Gate (Fixture Wiring — FINAL)

```bash
npm run ci                           # Full pipeline
npm run check:exports                # attw validates all 6 sub-path exports
```

**Additional verification checklist**:

- [ ] `moduleTest` fixture extends `coreTest` properly (not `base`)
- [ ] `feTest` fixture extends `base` and depends on `page`
- [ ] `mergeTests` in `fixtures/index.ts` includes: `coreTest, authTest, navTest, stabilityTest, moduleTest, feTest`
- [ ] Every fixture sub-namespace method wraps in `test.step()` (spot-check at least 3 methods in tests)
- [ ] `ui5.table.getRows()` auto-curries `page` — test author does NOT pass `page` manually
- [ ] `fe.listReport.search()` auto-curries `page`
- [ ] Step names follow pattern: `'ui5.table.getRows'`, `'fe.listReport.search'` etc.
- [ ] Module function test coverage does NOT decrease (fixture wiring is additive)

### 15.3 Gate 3: Per-Batch Gate

**When**: Before declaring any batch (B0a, B1a, ... B6b) as complete.

| #    | Check              | Command                                                   | Pass Criteria                                                                                   | Fail Action                       | Blocking? |
| ---- | ------------------ | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- | --------- |
| G3.1 | Full type check    | `npm run typecheck`                                       | Exit 0                                                                                          | Fix type errors                   | YES       |
| G3.2 | Full lint          | `npm run lint`                                            | Exit 0, 0 errors, 0 warnings                                                                    | Fix lint issues                   | YES       |
| G3.3 | Full unit tests    | `npm run test:unit`                                       | All tests pass (0 failures)                                                                     | Fix failing tests                 | YES       |
| G3.4 | Coverage threshold | `npm run test:unit:coverage`                              | Per-file: stmts>=90%, branches>=85%, funcs>=90%, lines>=90%                                     | Add tests for uncovered branches  | YES       |
| G3.5 | Build succeeds     | `npm run build`                                           | tsup exits 0, produces ESM+CJS                                                                  | Fix build errors                  | YES       |
| G3.6 | No regressions     | Compare test count: `npx vitest run 2>&1 \| grep 'Tests'` | Test count >= previous batch count (tests never decrease)                                       | Investigate deleted/skipped tests | YES       |
| G3.7 | Commit convention  | Git commit message                                        | Format: `feat(module): description (BatchID)` where BatchID is B0a/B1a/etc. Subject <= 72 chars | Rewrite commit message            | YES       |

### 15.4 Gate 4: Phase 4 Completion Gate

**When**: After ALL batches (B0a through B6b) are complete. Before declaring Phase 4 done.

| #     | Check                       | Command                                                                                                                                                                                                                                                                                                                                                                                                              | Pass Criteria                                                                         | Fail Action                          | Blocking?  |
| ----- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------ | ---------- |
| G4.1  | Full CI pipeline            | `npm run ci`                                                                                                                                                                                                                                                                                                                                                                                                         | Exit 0 (validate:no-js + lint + typecheck + test:unit + build + lint:ui5-deprecated)  | Fix all failures                     | YES        |
| G4.2  | Export validation           | `npm run check:exports`                                                                                                                                                                                                                                                                                                                                                                                              | 6/6 sub-paths pass attw validation                                                    | Fix export map in package.json       | YES        |
| G4.3  | Test count target           | `npx vitest run 2>&1 \| grep 'Tests'`                                                                                                                                                                                                                                                                                                                                                                                | >= 1,864 tests (1,506 existing + 358 new)                                             | Add missing tests                    | YES        |
| G4.4  | Coverage report             | `npm run test:unit:coverage`                                                                                                                                                                                                                                                                                                                                                                                         | Global: stmts>=90%, branches>=85%, funcs>=90%, lines>=90%. Per-file: same thresholds. | Add tests for low-coverage files     | YES        |
| G4.5  | No `TODO`/`FIXME` in source | `grep -r 'TODO\|FIXME' src/modules/ src/fe/ src/matchers/matcher-utils.ts src/fixtures/module-fixtures.ts src/fixtures/fe-fixtures.ts`                                                                                                                                                                                                                                                                               | Zero matches                                                                          | Resolve or convert to GitHub issues  | YES        |
| G4.6  | No `console.log`            | `grep -r 'console\.' src/modules/ src/fe/ src/fixtures/module-fixtures.ts src/fixtures/fe-fixtures.ts` (excluding fe-browser-scripts.ts string constants which use browser console)                                                                                                                                                                                                                                  | Zero matches in Node.js code                                                          | Use `createLogger()` instead         | YES        |
| G4.7  | No `page.waitForTimeout`    | `grep -r 'waitForTimeout' src/modules/ src/fe/`                                                                                                                                                                                                                                                                                                                                                                      | Zero matches                                                                          | Use `page.waitForFunction()` per P22 | YES        |
| G4.8  | Layer dependency check      | `grep -r "from.*fixtures" src/modules/ src/fe/`                                                                                                                                                                                                                                                                                                                                                                      | Zero matches (modules/fe NEVER import from fixtures)                                  | Fix import direction                 | YES        |
| G4.9  | Reverse dependency check    | `grep -r "from.*\.\./fe/" src/modules/`                                                                                                                                                                                                                                                                                                                                                                              | Zero matches (modules NEVER import from fe)                                           | Fix import direction                 | YES        |
| G4.10 | File count verification     | `ls src/modules/table.ts src/modules/table-operations.ts src/modules/dialog.ts src/modules/date.ts src/modules/odata.ts src/modules/odata-http.ts src/fe/list-report.ts src/fe/object-page.ts src/fe/fe-table-helpers.ts src/fe/fe-list-helpers.ts src/fe/fe-test-library.ts src/fe/fe-browser-scripts.ts src/fe/types.ts src/matchers/matcher-utils.ts src/fixtures/module-fixtures.ts src/fixtures/fe-fixtures.ts` | All 16 new files exist                                                                | Identify and create missing files    | YES        |
| G4.11 | Deadcode check              | `npm run deadcode`                                                                                                                                                                                                                                                                                                                                                                                                   | knip reports zero unused exports from Phase 4 files                                   | Remove or export unused code         | [ADVISORY] |
| G4.12 | Spellcheck                  | `npm run spellcheck`                                                                                                                                                                                                                                                                                                                                                                                                 | Zero errors in new files (or words added to cspell dictionary)                        | Fix typos or update dictionary       | [ADVISORY] |
| G4.13 | Bundle size                 | `npm run build && ls -la dist/index.js dist/fe/index.js`                                                                                                                                                                                                                                                                                                                                                             | ESM main bundle < 220 KB, FE bundle < 30 KB                                           | Investigate unexpected growth        | [ADVISORY] |
| G4.14 | Version unchanged           | `node -e "console.log(require('./package.json').version)"`                                                                                                                                                                                                                                                                                                                                                           | Version is 1.0.1 (NOT bumped in Phase 4)                                              | Revert version change                | YES        |

### 15.5 Quality Gate Summary

```
Per-File (Gate 1):     typecheck + lint + file-tests + coverage + LOC + TSDoc + errors + no-any + browser-safe
Per-Sub-Phase (Gate 2): Gate 1 + sub-phase-specific checklists + dependency direction checks
Per-Batch (Gate 3):    full typecheck + lint + all-unit-tests + coverage + build + no-regressions + commit-msg
Phase Completion (Gate 4): full CI + exports + test-count + coverage + no-TODO + no-console + no-waitForTimeout + layer-deps + file-count + deadcode + spellcheck + bundle-size + version-check
```

---

## 16. Risk Register

| ID  | Risk                                                                         | Probability | Impact | Mitigation                                                                                                                                                                                                                                                       |
| --- | ---------------------------------------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | SmartTable inner table ID is unpredictable                                   | Medium      | Medium | Use `getTable()` API to get inner table dynamically                                                                                                                                                                                                              |
| R2  | sap.m.Table vs sap.ui.table.Table API differences                            | Medium      | Medium | Variant detection abstracts differences; tested per variant                                                                                                                                                                                                      |
| R3  | Date format patterns vary by locale/config                                   | Medium      | Low    | Read `valueFormat` from control; test with 4+ patterns                                                                                                                                                                                                           |
| R4  | CSRF token fetch may fail in test environments                               | Low         | Medium | Structured error with `retryable: true`; retry at call site                                                                                                                                                                                                      |
| R5  | FE control IDs vary between app generator versions                           | Medium      | Medium | Use `controlType` discovery, not hardcoded IDs                                                                                                                                                                                                                   |
| R6  | MDC Table vs SmartTable API differences                                      | Medium      | Medium | Discovery tries SmartTable first, falls back to MDC                                                                                                                                                                                                              |
| R7  | Dialog static UI area selector changes in UI5 2.x                            | Low         | Medium | Browser script reads from `sap.ui.getCore()` API, not DOM                                                                                                                                                                                                        |
| R8  | Large table binding length vs visible row count                              | Medium      | Low    | Document distinction; `getTableRowCount` returns total                                                                                                                                                                                                           |
| R9  | OData HTTP operations may hit CORS in dev environments                       | Medium      | Medium | Use browser-context `fetch()` or `page.request` (same-origin)                                                                                                                                                                                                    |
| R10 | Table module split increases import surface                                  | Low         | Low    | Clear naming: `table.ts` (core) vs `table-operations.ts` (ops)                                                                                                                                                                                                   |
| R11 | FE helper functions may diverge from FE test library                         | Medium      | Medium | FE helpers are thin wrappers; real behavior tested in integration                                                                                                                                                                                                |
| R12 | FE Test Library (WDI5FE) OPA5 runtime must be available in browser           | Medium      | Medium | Requires UI5 1.100+ with FE test libraries deployed (`sap/fe/test/*`). Document minimum UI5 version requirement. Fallback: pure-function FE modules (4.5a-4.5d) cover 90%+ of scenarios without OPA5. <!-- REVISED: was deferral risk, now availability risk --> |
| R13 | Fixture sub-namespace API may be verbose for simple cases                    | Low         | Low    | Users can still import pure functions directly; fixture is convenience layer <!-- REVIEW FIX: C1-PW -->                                                                                                                                                          |
| R14 | test.step() wrapping adds overhead per fixture call                          | Low         | Low    | Overhead is negligible (<1ms per step); Trace Viewer benefit outweighs cost <!-- REVIEW FIX: C5-PW -->                                                                                                                                                           |
| R15 | page.request.head() for CSRF may not include browser cookies in all contexts | Medium      | Medium | Playwright's `page.request` inherits the browser context's cookies; documented in API reference <!-- REVIEW FIX: C6-PW -->                                                                                                                                       |
| R16 | FE Test Library Proxy may miss deeply-nested chaining patterns               | Medium      | Low    | Proxy uses recursive get/apply traps. Test with 3+ depth chains (e.g., `When.onTheMainPage.onFilterBar().and.iChangeSearchField().and.iExecuteSearch()`). Add explicit chain-depth tests. <!-- P16 INCLUDED -->                                                  |
| R17 | FE Test Library browser scripts inject into `window` namespace               | Low         | Low    | Scripts use `window.wdi5_*` and `window.fe_bridge` prefixes to avoid collisions with application code. Document reserved window properties. <!-- P16 INCLUDED -->                                                                                                |

---

## 17. Implementation Batching

### 17.1 Batch Table

| Batch | Files                                                                         | Est. Tests | Depends On | Gap Fix                                                                              |
| ----- | ----------------------------------------------------------------------------- | ---------- | ---------- | ------------------------------------------------------------------------------------ |
| B0a   | `matchers/matcher-utils.ts` + test + refactor matchers                        | 12         | None       | +GAP 6: 2 helpers, 2 matchers                                                        |
| B1a   | `modules/table.ts` + test (sap.m.Table variant)                               | 18         | B0a        | +getSelectedRows                                                                     |
| B1b   | `modules/table.ts` + test (grid/Smart/MDC variants)                           | 18         | B1a        | unchanged                                                                            |
| B1c   | `modules/table.types.test.ts`                                                 | 4          | B1b        | unchanged                                                                            |
| B1d   | `modules/table-operations.ts` + test (high-priority)                          | 26         | B1b        | NEW: GAP 1                                                                           |
| B1e   | `modules/table-operations.ts` + test (medium-priority)                        | 12         | B1d        | NEW: GAP 1                                                                           |
| B1f   | `modules/table-operations.types.test.ts`                                      | 3          | B1e        | NEW: GAP 1                                                                           |
| B2a   | `modules/dialog.ts` + test                                                    | 28         | B0a        | +GAP 2: getDialogButtons, DIALOG_CONTROL_TYPES                                       |
| B3a   | `modules/date.ts` + test                                                      | 30         | B0a        | +GAP 3: locale, timezone, range, validate, constants                                 |
| B4a   | `modules/odata.ts` + test                                                     | 24         | B0a        | unchanged                                                                            |
| B4b   | `modules/odata-http.ts` + test                                                | 20         | B4a        | NEW: GAP 4                                                                           |
| B5a   | `fe/list-report.ts` + test                                                    | 24         | B1b        | +GAP 5: getAvailableVariants, selectVariant                                          |
| B5b   | `fe/object-page.ts` + test                                                    | 22         | B0a        | +GAP 5: expanded specs                                                               |
| B5c   | `fe/fe-table-helpers.ts` + test                                               | 10         | B1b        | NEW: GAP 5                                                                           |
| B5d   | `fe/fe-list-helpers.ts` + test                                                | 12         | B0a        | NEW: GAP 5                                                                           |
| B5e   | `fe/fe-test-library.ts` + test                                                | 20         | B0a        | NEW: P16 INCLUDED — OPA5 Given/When/Then facade                                      |
| B5f   | `fe/fe-browser-scripts.ts` + test                                             | 10         | None       | NEW: P16 INCLUDED — browser-side OPA5 string constants (NO deps)                     |
| B6a   | Barrel updates + fixture types + CI gate                                      | 4          | All above  | +GAP 7: ObjectPageFixture, FioriElementsFixture + TestLibraryConfig, ProxyMethodCall |
| B6b   | `fixtures/module-fixtures.ts` + `fixtures/fe-fixtures.ts` + test              | 10         | B6a        | NEW: Fixture wiring (P19, P23) <!-- REVIEW FIX: C1-PW, C5-PW -->                     |
| B0b   | _(removed — matcher types handled via existing registration pattern per P21)_ | —          | —          | —                                                                                    |

**Total: 20 batches, ~358 tests** (was 18 batches, ~325 tests; delta +2 batches, +33 tests from P16 inclusion)

### 17.2 Parallel Agent Delivery Schedule

```
Wave 1 (start):
  ├── Agent A: B0a (matcher-utils extraction + 2 new matchers)
  ├── Agent B: B5f (fe-browser-scripts.ts — NO deps, pure string constants)
  └── (B0b removed — see P21)

Wave 2 (after B0a):
  ├── Agent A: B1a (table — responsive variant)
  ├── Agent B: B2a (dialog + getDialogButtons)
  ├── Agent C: B3a (date + locale/timezone/range)
  ├── Agent D: B4a (odata model-level)
  ├── Agent E: B5b (object-page — expanded, independent of table)
  └── Agent F: B5e (fe-test-library.ts — depends on B0a for types + B5f for browser scripts)

Wave 3 (after B1a):
  ├── Agent A: B1b (table — grid/Smart/MDC)
  └── Agent E: B5d (fe-list-helpers — independent of table)

Wave 4 (after B1b):
  ├── Agent A: B1c (table type tests)
  ├── Agent B: B1d (table-operations — high-priority functions)
  ├── Agent C: B5a (list-report — depends on table)
  ├── Agent D: B5c (fe-table-helpers — depends on table)
  └── Agent E: B4b (odata-http — depends on odata)

Wave 5 (after B1d):
  ├── Agent A: B1e (table-operations — medium-priority)
  └── Agent B: B1f (table-operations type tests)

Wave 6 (after all modules):
  └── Agent A: B6a (barrel updates + fixture types + CI gate)

Wave 7 (after B6a):                                                     <!-- REVIEW FIX: C1-PW, C5-PW (P19, P23) -->
  └── Agent A: B6b (fixture wiring — module-fixtures.ts + fe-fixtures.ts + tests)
```

**Critical Path** (longest sequential chain, 8 steps — unchanged):

```
B0a → B1a → B1b → B1d → B1e → B1f → B6a → B6b
```

**Note**: B5e and B5f do NOT extend the critical path. B5f runs in Wave 1 (parallel with B0a). B5e runs in Wave 2 (parallel with B1a, B2a, etc.).

**Max parallelism**: 6 agents in Wave 2 (was 5, +1 for B5e).

### 17.3 Batching Rules

1. **TDD protocol per batch**: Write tests FIRST → verify RED → implement → verify GREEN
2. **One module per batch** (except B0a which is a refactoring)
3. **Tests and source in same batch** — never ship source without tests
4. **CI gate only at B6a** — intermediate batches run `typecheck` + `lint` + `test:unit`
5. **Each batch verifiable independently**: `npx vitest run tests/unit/modules/table.test.ts`
6. **No breaking changes between batches** — each batch is additive
7. **Browser scripts as string constants** — NEVER use arrow functions in `page.evaluate()`
8. **All new functions consume `createLogger()`** — structured logging in every module
9. **All error throws use PramanError subclasses** — `ControlError`, `ODataError`, `TimeoutError`
10. **All mutation operations call `waitForUI5Stable()`** — unless `skipStabilityWait: true`

---

## Summary

| Metric            | Value                   | Delta from v1.1.0 (gap-fix)                                                                                      |
| ----------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| New source files  | 16                      | +4 (module-fixtures.ts, fe-fixtures.ts, fe-test-library.ts, fe-browser-scripts.ts)                               |
| Modified files    | 7                       | +1 (fixtures/index.ts)                                                                                           |
| New test files    | 19                      | +4 (module-fixtures.test.ts, fe-test-library.test.ts, fe-browser-scripts.test.ts, fe-test-library.types.test.ts) |
| New test cases    | ~358                    | +83 from review fixes + FE test library                                                                          |
| New source LOC    | ~3,080                  | +800 from review fixes + FE test library                                                                         |
| Batches           | 20                      | +4 (B0b, B5e, B5f, B6b)                                                                                          |
| Max parallelism   | 6 agents                | +1 (B5f parallel in Wave 1)                                                                                      |
| Critical path     | 8 batches               | +1 (B6b fixture wiring)                                                                                          |
| Coverage target   | 90% stmts, 85% branches | unchanged                                                                                                        |
| Breaking changes  | None                    | unchanged                                                                                                        |
| New error classes | None (reuse existing)   | unchanged                                                                                                        |
| Config changes    | None (per-call options) | unchanged                                                                                                        |
| New dependencies  | None                    | unchanged                                                                                                        |
| New decisions     | P14–P23                 | +5 (P19-P23 from review)                                                                                         |

### Review Fix Traceability

| Fix ID | Source            | Issue                                                        | Resolution                                                                                                              |
| ------ | ----------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| C1-TDD | TDD Expert        | matcher-utils.ts has zero error path tests                   | Added tests 9-12 with ControlError wrapping spec                                                                        |
| C2-TDD | TDD Expert        | odata-http.ts mock pattern uses wrong page.request API       | Added `createMockODataHttpPage()` factory with `.get/.post/.patch/.delete`                                              |
| C3-TDD | TDD Expert        | Missing CSRF validation tests for write operations           | Added tests 21-24 in odata-http.test.ts                                                                                 |
| C4-TDD | TDD Expert        | New matchers need more tests (only 4 for 2 matchers)         | Added tests M5-M8 (.not modifier, path mismatch, type mismatch)                                                         |
| C5-TDD | TDD Expert        | ~35-40 missing edge case/error tests across modules          | Added error path tests across table-ops, object-page, FE helpers, odata-http                                            |
| C6-TDD | TDD Expert        | Mock strategy section needs concrete factories               | Added Section 13.3.1-13.3.3 with 4 factories + 3 mock patterns                                                          |
| C1-PW  | Playwright Expert | No fixture wiring for new modules (BIGGEST GAP)              | Added Sub-Phase 4.6b with module-fixtures.ts + fe-fixtures.ts                                                           |
| C2-PW  | Playwright Expert | ODataHttpPage uses wrong Playwright API (page.request.fetch) | Fixed interface to use `.get()/.post()/.patch()/.delete()` (P20)                                                        |
| C3-PW  | Playwright Expert | Matcher type clarification needed                            | Clarified: Praman matchers are UI5 API matchers, type augmentation handled via existing `expect.extend()` pattern (P21) |
| C4-PW  | Playwright Expert | Polling loops should use page.waitForFunction()              | Updated all wait functions to mandate page.waitForFunction() (P22)                                                      |
| C5-PW  | Playwright Expert | No test.step() guidance                                      | Fixture wrapper auto-wraps in test.step() (P23)                                                                         |
| C6-PW  | Playwright Expert | fetchCSRFToken should use page.request, not synchronous XHR  | Updated to use `page.request.head()` with ODataCSRFPage interface                                                       |

### Gap Fix Traceability (from v1.0.0 to v1.1.0)

| Gap | Source (dhikraft)                                               | Praman Target                                                                                                | Functions Added                                 |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| 1   | `table.ts` (26 functions)                                       | `table.ts` + `table-operations.ts`                                                                           | +18                                             |
| 2   | `dialog-helpers.ts:288-330,37-46`                               | `dialog.ts`                                                                                                  | +1 fn, +1 const                                 |
| 3   | `ui5-date-handler.ts`, `date-types.ts`                          | `date.ts`                                                                                                    | +2 fn, +1 const, +2 opts                        |
| 4   | `odata-handler.ts:254-510`                                      | `odata-http.ts`                                                                                              | +5                                              |
| 5   | `fe-helpers.ts`, `fiori-elements-test-library.ts`, `wdi5-fe.ts` | `object-page.ts`, `fe-table-helpers.ts`, `fe-list-helpers.ts`, `fe-test-library.ts`, `fe-browser-scripts.ts` | +17 + FE test library (WDI5FE included in 4.5e) |
| 6   | `custom-matchers.ts:157-325`                                    | `matcher-utils.ts` + `ui5-matchers.ts`                                                                       | +2 matchers, +2 helpers                         |
| 7   | `fixture-composite-types.ts`                                    | `fe/types.ts`                                                                                                | +2 interfaces                                   |

---

## 18. Implementation Readiness Audit

### 18.1 Ambiguities Found and Resolved

| #   | Location                             | Ambiguity                                                                                                                                                                                                                                                                                                                                                                                                           | Resolution                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Section 5.1, `matcher-utils.ts`      | `MatcherPage` interface has `evaluate<R>(script: string, arg?: unknown): Promise<R>` but existing `table-matchers.ts` uses `Page` from Playwright which includes `ensureBridgeInjected(page)` before evaluation. Plan does not specify whether `matcher-utils.ts` functions call `ensureBridgeInjected` or assume bridge is already injected.                                                                       | **Resolved**: `matcher-utils.ts` functions MUST call `ensureBridgeInjected(page)` before `page.evaluate()`, matching the existing pattern in `table-matchers.ts` and `ui5-matchers.ts`. The `MatcherPage` interface must be extended to support `ensureBridgeInjected()` or the functions must import it directly. Since `ensureBridgeInjected` takes a Playwright `Page`, but `MatcherPage` is a minimal interface, the functions should accept `Page` from Playwright (matching existing matchers) and the `MatcherPage` type is used only for unit test mocks.                                                                                                                                                                                                          |
| A2  | Section 6.1, `table.ts`              | Plan references `createControlProxy()` for wrapping row references but `createControlProxy` requires `ControlProxyState` which needs `page: Page`, `interactionStrategy: InteractionStrategy`, and `methods: ReadonlySet<string>`. Table module functions receive only a minimal `TablePage` interface, not a full Playwright `Page` + `InteractionStrategy`.                                                       | **Resolved**: Table module functions that return `UI5ControlBase` proxies do NOT call `createControlProxy()` themselves. Instead, they return raw data from `page.evaluate()` (row IDs, cell values, binding data). Functions like `getTableRows` return control references as `readonly { id: string; controlType: string }[]` wrapped in a lightweight object satisfying `UI5ControlBase` interface — OR the function signature should return `readonly BridgeControlRef[]` instead of `readonly UI5ControlBase[]`. The plan must be updated: `getTableRows` returns `readonly BridgeControlRef[]` (bridge control references), NOT full `UI5ControlBase` proxies. The proxy creation is done at the fixture layer where `page` and `interactionStrategy` are available. |
| A3  | Section 6.1, `table.ts`              | `TablePage` has overloaded `evaluate` signatures: `evaluate<R>(pageFunction: string, arg?: unknown)` AND `evaluate<R>(pageFunction: (...args: never[]) => R, arg?: unknown)`. But per P12/MEMORY.md, ALL browser code must use string scripts. The function overload is misleading.                                                                                                                                 | **Resolved**: Keep only the string overload in `TablePage`: `evaluate<R>(pageFunction: string, arg?: unknown): Promise<R>`. Remove function overload since P12 mandates string scripts only. Same applies to `DialogPage`, `DatePage`, `ODataPage`, `ListReportPage`, `ObjectPagePage`, `FETablePage`, `FEListPage`.                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| A4  | Section 9.2, `odata-http.ts`         | Plan uses generic type params `<T = unknown>` on `createEntity`, `updateEntity`, `queryEntities`, `callFunctionImport`. But `@typescript-eslint/no-unnecessary-type-arguments` (from MEMORY.md) flags `<unknown>` when it is the default. Callers would write `createEntity<Product>(...)` or just `createEntity(...)`, both correct. BUT: the plan does not specify how the response JSON is parsed/cast to `T`.   | **Resolved**: Response parsing via `response.json()` returns `unknown`. The generic `T` is the caller's assertion. Implementation: `const data = await response.json() as T;`. This is the one place where `as T` is acceptable (JSON deserialization). Document this as the single permitted type assertion in the module.                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| A5  | Section 11.5, fixture types          | Plan says `"In src/fixtures/types.ts or src/fe/types.ts"` — location is ambiguous ("or").                                                                                                                                                                                                                                                                                                                           | **Resolved**: Use `src/fe/types.ts` since the types describe FE fixture interfaces and belong in the `fe` module. This aligns with the `./fe` sub-path export and keeps fixtures/types separate from runtime fixture wiring code.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| A6  | Section 11.6.1, `module-fixtures.ts` | `wrapInStep` helper function signature uses `TArgs extends readonly unknown[]` and `fn: (page: Page, ...args: TArgs) => TReturn`. But the actual fixture methods curry `page` — they don't pass `page` as the first arg to the wrapped function. The `wrapInStep` generic signature does not match the actual fixture method pattern.                                                                               | **Resolved**: `wrapInStep` is illustrative, not prescriptive. The actual implementation pattern is direct currying as shown in the `feTest` example (line 3684+): `getTable: () => base.step('fe.listReport.getTable', () => getListReportTable(page))`. No generic `wrapInStep` utility needed. Each method explicitly curries `page`.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| A7  | Section 11.6.1, `module-fixtures.ts` | Plan says `moduleTest = coreTest.extend<{ ui5: UI5Handler & ExtendedUI5Fixtures }>()`. This creates a NEW `ui5` fixture that would REPLACE the one from `coreTest`. But `coreTest` already defines `ui5` as `UI5Handler`. Extending with `UI5Handler & ExtendedUI5Fixtures` means the fixture closure must create the UI5Handler AND attach sub-namespaces — duplicating `coreTest`'s `ui5` fixture creation logic. | **Resolved**: This is the correct Playwright pattern. When `moduleTest` extends `coreTest` and overrides `ui5`, it must re-create the full UI5Handler setup (same as coreTest) PLUS attach sub-namespaces. The alternative (merging two fixtures that both define `ui5`) would cause a Playwright error. The `moduleTest` fixture definition MUST include the full UI5Handler creation + navigation listener setup from `core-fixtures.ts`, then attach `.table`, `.dialog`, `.date`, `.odata` properties. This increases `module-fixtures.ts` LOC estimate from ~220 to ~280 (still under 300 with the documented exception for self-contained browser scripts).                                                                                                          |
| A8  | Section 6.1, Table `getTableData`    | Returns `readonly Record<string, unknown>[]` but the browser script to extract binding data via `getContextByIndex().getObject()` is not specified. This is a complex browser script that must handle V2 vs V4 context differences.                                                                                                                                                                                 | **Resolved**: The browser script for `getTableData` iterates rows and calls `getBindingContext().getObject()` for responsive tables or `getContextByIndex(i).getObject()` for grid tables. The script MUST be a string constant (P12). It returns serializable JSON. Implementation agent must write the browser script inline as a string template with the table ID parameter.                                                                                                                                                                                                                                                                                                                                                                                           |
| A9  | Section 11.6, fixture wiring         | No `#matchers/*` path alias exists in `tsconfig.json`. Plan references `#matchers/*` in the dependency rules (line 176: `modules/* → imports from #core/*, #bridge/*, #proxy/*, #matchers/*`).                                                                                                                                                                                                                      | **Resolved**: There is no `#matchers/*` path alias. Modules that need matcher utilities must use relative imports: `import { getControlProperty } from '../matchers/matcher-utils.js'`. The dependency rule should read: `modules/* → imports from #core/*, #bridge/*, #proxy/*, relative ../matchers/*`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| A10 | Section 5.1, matcher-utils tests     | Test #8 says "MatcherPage interface accepts minimal page object" with `{ evaluate: vi.fn() }` and expects "Type-checks successfully". This is a runtime test asserting type compatibility — but type-only tests should use `expectTypeOf`, not runtime assertions.                                                                                                                                                  | **Resolved**: Remove test #8 from the runtime test list. Add it as a type test: `expectTypeOf<{ evaluate: (...args: unknown[]) => Promise<unknown> }>().toExtend<MatcherPage>()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

### 18.2 Vague Language Found

| #   | Location                          | Vague Text                                                                                                  | Fix                                                                                                                                                                                                                      |
| --- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| V1  | Section 11.6.1, line 3553         | `// ... additional operations` comment in `UI5TableFixture`                                                 | Replace with explicit list of remaining operations: `setTableValue`, `clickRow`, `selectRowByValues`, `ensureRowVisible`, `filterByColumn`, `sortByColumn`, `getSortOrder`, `getFilterValue`, `clickTableSettingsButton` |
| V2  | Section 10.2, `navigateToSection` | "Finds the section in the ObjectPageLayout and scrolls/navigates to it" — does not specify the UI5 API used | Replace with: "Calls `objectPageLayout.setSelectedSection(sectionId)` to scroll the section into view"                                                                                                                   |
| V3  | Section 10.2, `getSectionData`    | "Reads label-value pairs from form fields" — vague on which UI5 APIs are used                               | Replace with: "Iterates `section.getSubSections()[].getBlocks()[]`, finds SimpleForm/Form content, reads label-value pairs via `getContent()` aggregation on each form container"                                        |
| V4  | Section 10.2, `isInEditMode`      | "Checks the `showFooter` property or the `ui:edit` model" — which takes precedence?                         | Replace with: "First checks `objectPageLayout.getShowFooter()`. If false, checks the `ui` model for an `editMode` property. Returns true if either indicates edit mode."                                                 |
| V5  | Section 8.1, `setDatePickerValue` | "fires change event" but does not specify exactly which event and with what parameters                      | Replace with: "Calls `control.fireChange({ value: formattedValue, valid: true, id: controlId })` after `control.setValue(formattedValue)`"                                                                               |

### 18.3 LOC Estimates Verification

| File                    | Plan Est. | Realistic Est. | Fits 300 LOC? | Notes                                                                                                                                                        |
| ----------------------- | --------- | -------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `matcher-utils.ts`      | 150       | 140            | YES           | 4 functions + 3 types + TSDoc                                                                                                                                |
| `table.ts`              | 280       | 290            | YES (tight)   | 10 functions + 5 types + browser scripts. May need careful TSDoc trimming.                                                                                   |
| `table-operations.ts`   | 250       | 270            | YES (tight)   | 17 functions but many are thin wrappers. Browser scripts add bulk.                                                                                           |
| `dialog.ts`             | 230       | 240            | YES           | 8 functions + 4 types + 1 constant                                                                                                                           |
| `date.ts`               | 210       | 200            | YES           | 9 functions + 4 types. `formatDateForUI5` is pure (no async).                                                                                                |
| `odata.ts`              | 220       | 210            | YES           | 6 functions + 4 types                                                                                                                                        |
| `odata-http.ts`         | 200       | 220            | YES           | 5 functions + 5 types. URL building adds LOC.                                                                                                                |
| `list-report.ts`        | 220       | 230            | YES           | 9 functions + 2 types                                                                                                                                        |
| `object-page.ts`        | 200       | 220            | YES           | 9 functions + 4 types                                                                                                                                        |
| `fe-table-helpers.ts`   | 120       | 110            | YES           | 5 thin wrapper functions                                                                                                                                     |
| `fe-list-helpers.ts`    | 120       | 110            | YES           | 6 thin wrapper functions                                                                                                                                     |
| `fe/types.ts`           | 160       | 150            | YES           | Type-only, no runtime. Includes original fixture types + test library types (TestLibraryConfig, ProxyMethodCall, FETestLibraryResponse, TestLibraryFixture). |
| `module-fixtures.ts`    | 220       | 280            | YES (tight)   | Must duplicate UI5Handler setup from core-fixtures.ts + attach 4 sub-namespaces. See A7.                                                                     |
| `fe-fixtures.ts`        | 130       | 140            | YES           | Straightforward currying pattern                                                                                                                             |
| `fe-test-library.ts`    | 200       | 200            | YES           | 1 factory + 1 class + proxy creation. Stateful (P1 exception).                                                                                               |
| `fe-browser-scripts.ts` | 250       | 250            | YES           | 5 string constants. Pure browser-side scripts (P12). Zero imports.                                                                                           |

**Total new source LOC**: ~3,180 (revised from ~2,730 per A7 + 4.5e FE test library)

---

## 19. Task Definition with Dependencies

### 19.1 Complete Task List

```
TASK: B0a-1 | File: src/matchers/matcher-utils.ts | Type: source | Depends: none | Est LOC: 140 | Est Tokens: 560
TASK: B0a-2 | File: tests/unit/matchers/matcher-utils.test.ts | Type: test | Depends: B0a-1 (TDD: write test FIRST) | Est LOC: 250 | Est Tokens: 1250
TASK: B0a-3 | File: src/matchers/table-matchers.ts (refactor) | Type: source-mod | Depends: B0a-1 | Est LOC: -30 (removal) | Est Tokens: 200
TASK: B0a-4 | File: src/matchers/ui5-matchers.ts (refactor + 2 new matchers) | Type: source-mod | Depends: B0a-1 | Est LOC: +40 | Est Tokens: 300
TASK: B0a-5 | File: tests/unit/matchers/ui5-matchers.test.ts (update) | Type: test-mod | Depends: B0a-4 | Est LOC: +80 | Est Tokens: 400
TASK: B0a-6 | File: src/matchers/index.ts (update) | Type: source-mod | Depends: B0a-4 | Est LOC: +5 | Est Tokens: 50
TASK: B0a-7 | File: src/fixtures/core-fixtures.ts (update matcherRegistration) | Type: source-mod | Depends: B0a-4 | Est LOC: +4 | Est Tokens: 50

TASK: B1a   | File: src/modules/table.ts + tests/unit/modules/table.test.ts (responsive variant) | Type: source+test | Depends: B0a | Est LOC: 290+360 | Est Tokens: 2960
TASK: B1b   | File: src/modules/table.ts + tests/unit/modules/table.test.ts (grid/Smart/MDC variants) | Type: source+test | Depends: B1a | Est LOC: (included in B1a) | Est Tokens: 1500
TASK: B1c   | File: tests/unit/modules/table.types.test.ts | Type: test | Depends: B1b | Est LOC: 30 | Est Tokens: 150
TASK: B1d   | File: src/modules/table-operations.ts + tests/unit/modules/table-operations.test.ts (high-priority) | Type: source+test | Depends: B1b | Est LOC: 270+420 | Est Tokens: 3180
TASK: B1e   | File: src/modules/table-operations.ts + tests (medium-priority) | Type: source+test | Depends: B1d | Est LOC: (included in B1d) | Est Tokens: 1200
TASK: B1f   | File: tests/unit/modules/table-operations.types.test.ts | Type: test | Depends: B1e | Est LOC: 25 | Est Tokens: 125

TASK: B2a   | File: src/modules/dialog.ts + tests/unit/modules/dialog.test.ts | Type: source+test | Depends: B0a | Est LOC: 240+350 | Est Tokens: 2710
TASK: B3a   | File: src/modules/date.ts + tests/unit/modules/date.test.ts | Type: source+test | Depends: B0a | Est LOC: 200+380 | Est Tokens: 2700
TASK: B4a   | File: src/modules/odata.ts + tests/unit/modules/odata.test.ts | Type: source+test | Depends: B0a | Est LOC: 210+300 | Est Tokens: 2340
TASK: B4b   | File: src/modules/odata-http.ts + tests/unit/modules/odata-http.test.ts | Type: source+test | Depends: B4a | Est LOC: 220+370 | Est Tokens: 2690

TASK: B5a   | File: src/fe/list-report.ts + tests/unit/fe/list-report.test.ts | Type: source+test | Depends: B1b | Est LOC: 230+300 | Est Tokens: 2420
TASK: B5b   | File: src/fe/object-page.ts + tests/unit/fe/object-page.test.ts | Type: source+test | Depends: B0a | Est LOC: 220+280 | Est Tokens: 2280
TASK: B5c   | File: src/fe/fe-table-helpers.ts + tests/unit/fe/fe-table-helpers.test.ts | Type: source+test | Depends: B1b | Est LOC: 110+120 | Est Tokens: 1050
TASK: B5d   | File: src/fe/fe-list-helpers.ts + tests/unit/fe/fe-list-helpers.test.ts | Type: source+test | Depends: B0a | Est LOC: 110+140 | Est Tokens: 1130

TASK: B5e   | File: src/fe/fe-test-library.ts + tests/unit/fe/fe-test-library.test.ts + tests/unit/fe/fe-test-library.types.test.ts | Type: source+test | Depends: B0a,B5f | Est LOC: 200+200+25 | Est Tokens: 1930
TASK: B5f   | File: src/fe/fe-browser-scripts.ts + tests/unit/fe/fe-browser-scripts.test.ts | Type: source+test | Depends: None | Est LOC: 250+100 | Est Tokens: 1550

TASK: B6a-1 | File: src/modules/index.ts (update barrel) | Type: source-mod | Depends: B1f,B2a,B3a,B4b | Est LOC: +20 | Est Tokens: 100
TASK: B6a-2 | File: src/fe/index.ts (update barrel) | Type: source-mod | Depends: B5a,B5b,B5c,B5d,B5e,B5f | Est LOC: +10 | Est Tokens: 60
TASK: B6a-3 | File: src/index.ts (update main barrel) | Type: source-mod | Depends: B6a-1,B6a-2 | Est LOC: +80 | Est Tokens: 350
TASK: B6a-4 | File: src/fe/types.ts (fixture types + test library types) | Type: source | Depends: B5a,B5b,B5c,B5d,B5e | Est LOC: 160 | Est Tokens: 640
TASK: B6a-5 | File: tests/unit/fe/fixture-types.test.ts | Type: test | Depends: B6a-4 | Est LOC: 30 | Est Tokens: 150

TASK: B6b-1 | File: src/fixtures/module-fixtures.ts | Type: source | Depends: B6a | Est LOC: 280 | Est Tokens: 1120
TASK: B6b-2 | File: src/fixtures/fe-fixtures.ts | Type: source | Depends: B6a | Est LOC: 140 | Est Tokens: 560
TASK: B6b-3 | File: src/fixtures/index.ts (update mergeTests) | Type: source-mod | Depends: B6b-1,B6b-2 | Est LOC: +5 | Est Tokens: 50
TASK: B6b-4 | File: tests/unit/fixtures/module-fixtures.test.ts | Type: test | Depends: B6b-1,B6b-2 | Est LOC: 120 | Est Tokens: 600
```

### 19.2 Token/Context Budget Per Task

Each agent turn has ~200K context window and ~4,000 output tokens per code generation response.

**Context needed per task**:

- CLAUDE.md: ~2,500 tokens (always loaded)
- Plan4 relevant section: ~1,500-3,000 tokens (varies by module)
- Existing exemplar (navigation.ts + test): ~2,500 tokens
- Import targets (error classes, types, etc.): ~1,000 tokens
- **Total context per turn**: ~8,000-10,000 tokens (well within 200K)

**Output budget per task**:

- Source file (200 LOC): ~800 tokens of code
- Test file (300 LOC): ~1,500 tokens of code
- **Fits single turn?** YES for most tasks. Only B1a/B1d may need 2 turns each (source + test separately).

| Batch | Single Turn? | Reason                                                                   |
| ----- | ------------ | ------------------------------------------------------------------------ |
| B0a   | 2 turns      | Source (140 LOC) + refactoring + tests (250 LOC) exceeds single output   |
| B1a   | 2 turns      | Source (290 LOC) needs separate turn from tests (360 LOC)                |
| B1b   | 1 turn       | Extending existing file with variant tests                               |
| B1c   | 1 turn       | Small type test file (30 LOC)                                            |
| B1d   | 2 turns      | Source (270 LOC) + tests (420 LOC)                                       |
| B1e   | 1 turn       | Extending existing file with medium-priority functions                   |
| B1f   | 1 turn       | Small type test file (25 LOC)                                            |
| B2a   | 2 turns      | Source + tests                                                           |
| B3a   | 2 turns      | Source + tests                                                           |
| B4a   | 2 turns      | Source + tests                                                           |
| B4b   | 2 turns      | Source + tests                                                           |
| B5a   | 2 turns      | Source + tests                                                           |
| B5b   | 2 turns      | Source + tests                                                           |
| B5c   | 1 turn       | Small source (110 LOC) + small tests (120 LOC)                           |
| B5d   | 1 turn       | Small source (110 LOC) + small tests (140 LOC)                           |
| B5e   | 2 turns      | Source (200 LOC) + tests (200 LOC) + type tests (25 LOC)                 |
| B5f   | 1 turn       | String constants (250 LOC) + simple content tests (100 LOC)              |
| B6a   | 2 turns      | Multiple barrel updates + fixture types + type tests                     |
| B6b   | 2 turns      | Module fixtures (280 LOC) + FE fixtures (140 LOC) + index update + tests |

**Total agent turns**: ~31 turns across all batches (was ~28, +3 from B5e/B5f)

---

## 20. Parallel Execution Plan

### 20.1 Agent Capacity (20x Claude Plan)

With a 20x Claude plan, the constraint is NOT API rate limits but file dependency conflicts. Two agents CANNOT modify the same file simultaneously. Analysis:

**Files with write conflicts**: None between independent batches. Each batch writes to unique source files and unique test files. Barrel files (index.ts) are only modified in B6a (after all modules complete).

**Maximum safe parallelism**: 5 agents (limited by Wave 2 dependency structure, not API limits).

### 20.2 Gantt-Style Execution Plan

```
Turn 1: B0a (Agent A) + B5f (Agent B) — matcher-utils + fe-browser-scripts (independent)
         [2 agents in parallel]
         B0a: matcher-utils extraction + new matchers + refactoring
         B5f: fe-browser-scripts.ts (pure string constants, NO deps)
         [GATE 2.1: Sub-Phase 4.0 Gate]

Turn 2: B1a (Agent A) + B2a (Agent B) + B3a (Agent C) + B4a (Agent D) + B5b (Agent E) + B5e (Agent F)
         [6 agents in parallel]
         B1a: table.ts (responsive variant tests first, then source)
         B2a: dialog.ts (full TDD cycle)
         B3a: date.ts (full TDD cycle)
         B4a: odata.ts (full TDD cycle)
         B5b: object-page.ts (full TDD cycle, independent of table)
         B5e: fe-test-library.ts (depends on B0a + B5f, full TDD cycle)

Turn 3: B1b (Agent A) + B5d (Agent B) + B4b (Agent C)
         [3 agents in parallel]
         B1b: table.ts grid/Smart/MDC variant tests (extends B1a)
         B5d: fe-list-helpers.ts (independent, full TDD)
         B4b: odata-http.ts (depends on B4a, full TDD)
         [GATE 2.2-2.5: Sub-Phase 4.1-4.4 Gates for completed modules]

Turn 4: B1c (Agent A) + B1d (Agent B) + B5a (Agent C) + B5c (Agent D)
         [4 agents in parallel]
         B1c: table type tests (trivial)
         B1d: table-operations.ts high-priority functions (full TDD)
         B5a: list-report.ts (depends on B1b)
         B5c: fe-table-helpers.ts (depends on B1b)

Turn 5: B1e (Agent A) + B1f (Agent B)
         [2 agents in parallel]
         B1e: table-operations.ts medium-priority functions
         B1f: table-operations type tests
         [GATE 2.6: Sub-Phase 4.5 Gate]

Turn 6: B6a (Agent A)
         [1 agent — must be sequential: touches all barrels]
         B6a: barrel updates + fixture types + CI gate
         [GATE 2.7: Sub-Phase 4.6a Gate — full `npm run ci` + `npm run check:exports`]

Turn 7: B6b (Agent A)
         [1 agent — must be sequential: touches fixtures/index.ts]
         B6b: module-fixtures.ts + fe-fixtures.ts + tests + index.ts update
         [GATE 2.8: Sub-Phase 4.6b Gate (FINAL)]
         [GATE 4: Phase 4 Completion Gate]
```

### 20.3 Critical Path

```
B0a (Turn 1) → B1a (Turn 2) → B1b (Turn 3) → B1d (Turn 4) → B1e (Turn 5) → B6a (Turn 6) → B6b (Turn 7)
```

**Critical path length**: 7 turns
**Minimum wall-clock time**: 7 agent turns (assuming ~15-30 min per turn = ~2-3.5 hours)

### 20.4 Parallelism Summary

| Turn | Agents | Batches                      | Cumulative Tests               |
| ---- | ------ | ---------------------------- | ------------------------------ |
| 1    | 2      | B0a, B5f                     | ~28 + 10 = ~38                 |
| 2    | 6      | B1a, B2a, B3a, B4a, B5b, B5e | ~38 + 18+28+30+24+22+23 = ~183 |
| 3    | 3      | B1b, B5d, B4b                | ~183 + 18+12+29 = ~242         |
| 4    | 4      | B1c, B1d, B5a, B5c           | ~242 + 4+26+24+10 = ~306       |
| 5    | 2      | B1e, B1f                     | ~306 + 12+3 = ~321             |
| 6    | 1      | B6a                          | ~321 + 4 = ~325                |
| 7    | 1      | B6b                          | ~325 + 10 = ~335               |

**Note**: Remaining ~23 tests come from edge case/error path additions (C5-TDD) distributed across existing test files. Total target: ~358 tests.

---

## 21. Conflict and Duplicate Check

### 21.1 Functions with Same Name in Different Files

| Function Name           | File 1                            | File 2                                           | Conflict?         | Resolution                                                                                  |
| ----------------------- | --------------------------------- | ------------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------- |
| `getControlProperty`    | `matchers/matcher-utils.ts` (NEW) | `matchers/table-matchers.ts` (EXISTING, private) | YES — intentional | After B0a, `table-matchers.ts` REMOVES its private copy and imports from `matcher-utils.ts` |
| `getControlAggregation` | `matchers/matcher-utils.ts` (NEW) | `matchers/table-matchers.ts` (EXISTING, private) | YES — intentional | Same as above                                                                               |
| `getControlProperty`    | `matchers/matcher-utils.ts` (NEW) | `matchers/ui5-matchers.ts` (EXISTING, private)   | YES — intentional | `ui5-matchers.ts` REMOVES its private copy                                                  |

**No unintended duplicates found.** All three cases are the explicit P9 refactoring target.

### 21.2 Types with Same Name in Different Files

| Type Name           | File 1                                | File 2 | Conflict?   | Resolution                     |
| ------------------- | ------------------------------------- | ------ | ----------- | ------------------------------ |
| `TableOptions`      | `modules/table.ts`                    | —      | No conflict | Unique                         |
| `DialogOptions`     | `modules/dialog.ts`                   | —      | No conflict | Unique                         |
| `DateOptions`       | `modules/date.ts`                     | —      | No conflict | Unique                         |
| `ODataOptions`      | `modules/odata.ts`                    | —      | No conflict | Unique                         |
| `ODataHttpOptions`  | `modules/odata-http.ts`               | —      | No conflict | Unique                         |
| `ListReportOptions` | `fe/list-report.ts`                   | —      | No conflict | Unique                         |
| `ObjectPageOptions` | `fe/object-page.ts`                   | —      | No conflict | Unique                         |
| `MatcherResult`     | `matchers/ui5-matchers.ts` (EXISTING) | —      | No conflict | Already exists, not duplicated |

**No type name conflicts found across new files.**

### 21.3 Imports Pointing to Not-Yet-Created Files

All imports in plan4 source files reference either:

1. Existing Phase 1-3 infrastructure (`#core/*`, `#bridge/*`, `#proxy/*`) — VERIFIED EXISTS
2. New Phase 4 files that will be created in the SAME or EARLIER batch

**Dependency order verification**:

- `table-operations.ts` imports from `table.ts` — B1d depends on B1b (correct)
- `odata-http.ts` imports from `odata.ts` — B4b depends on B4a (correct)
- `list-report.ts` imports from `modules/table.js` — B5a depends on B1b (correct)
- `fe-table-helpers.ts` imports from `modules/table.js` and `modules/table-operations.js` — B5c depends on B1b (correct)
- `fe-fixtures.ts` imports from `fe/types.js` — B6b depends on B6a (correct)
- `module-fixtures.ts` imports from all module files — B6b depends on B6a which depends on all modules (correct)

**No forward-reference imports found.**

### 21.4 Barrel Export Duplication Check

**`src/modules/index.ts`** (after Phase 4):

- `navigation.js` exports: 9 functions + 3 types
- `workzone.js` exports: 1 function + 5 types
- `table.js` exports: 10 functions + 5 types
- `table-operations.js` exports: 17 functions + 5 types
- `dialog.js` exports: 8 functions + 5 types + 1 constant
- `date.js` exports: 9 functions + 4 types + 1 constant
- `odata.js` exports: 6 functions + 4 types
- `odata-http.js` exports: 5 functions + 4 types

Cross-checked: No duplicate symbol names across these modules.

**`src/fe/index.ts`** (after Phase 4):

- `list-report.js`: 9 functions + 2 types
- `object-page.js`: 9 functions + 4 types
- `fe-table-helpers.js`: 5 functions + 2 types
- `fe-list-helpers.js`: 6 functions + 1 type
- `fe-test-library.js`: 1 factory function + 1 class + 2 types (`FETestLibraryInstance`, `initializeFETestLibrary`)
- `fe-browser-scripts.js`: 5 string constants (`LOAD_FE_LIBRARIES_SCRIPT`, `INIT_OPA_SCRIPT`, `ADD_TO_QUEUE_SCRIPT`, `EMPTY_QUEUE_SCRIPT`, `CHECK_OPA_READY_SCRIPT`)

Cross-checked: No duplicate symbol names. `FETestLibraryInstance` class is the single stateful export (P1 exception, documented).

**`src/index.ts` main barrel**: Re-exports from `./modules/index.js`. FE exports go through `./fe` sub-path only. No double-export via main barrel.

### 21.5 Test Files Testing Wrong Source

All test file paths match their source counterparts:

| Test File                                     | Tests Source File                                                 | Correct? |
| --------------------------------------------- | ----------------------------------------------------------------- | -------- |
| `tests/unit/matchers/matcher-utils.test.ts`   | `src/matchers/matcher-utils.ts`                                   | YES      |
| `tests/unit/modules/table.test.ts`            | `src/modules/table.ts`                                            | YES      |
| `tests/unit/modules/table-operations.test.ts` | `src/modules/table-operations.ts`                                 | YES      |
| `tests/unit/modules/dialog.test.ts`           | `src/modules/dialog.ts`                                           | YES      |
| `tests/unit/modules/date.test.ts`             | `src/modules/date.ts`                                             | YES      |
| `tests/unit/modules/odata.test.ts`            | `src/modules/odata.ts`                                            | YES      |
| `tests/unit/modules/odata-http.test.ts`       | `src/modules/odata-http.ts`                                       | YES      |
| `tests/unit/fe/list-report.test.ts`           | `src/fe/list-report.ts`                                           | YES      |
| `tests/unit/fe/object-page.test.ts`           | `src/fe/object-page.ts`                                           | YES      |
| `tests/unit/fe/fe-table-helpers.test.ts`      | `src/fe/fe-table-helpers.ts`                                      | YES      |
| `tests/unit/fe/fe-list-helpers.test.ts`       | `src/fe/fe-list-helpers.ts`                                       | YES      |
| `tests/unit/fe/fixture-types.test.ts`         | `src/fe/types.ts`                                                 | YES      |
| `tests/unit/fe/fe-test-library.test.ts`       | `src/fe/fe-test-library.ts`                                       | YES      |
| `tests/unit/fe/fe-browser-scripts.test.ts`    | `src/fe/fe-browser-scripts.ts`                                    | YES      |
| `tests/unit/fe/fe-test-library.types.test.ts` | `src/fe/fe-test-library.ts` (type tests)                          | YES      |
| `tests/unit/fixtures/module-fixtures.test.ts` | `src/fixtures/module-fixtures.ts` + `src/fixtures/fe-fixtures.ts` | YES      |

**No mismatches found.**

---

## 22. Implementation Notes for Agents

### 22.1 Critical Patterns to Follow

1. **Mock pattern** (from `navigation.test.ts`): Use `vi.mock('#core/utils/wait-helpers.js')` at module level, then `const { waitForUI5Stable } = await import(...)` to get the mock reference. Create `createMockPage()` factory returning typed mock objects. Cast to module's page interface via `as unknown as TablePage`.

2. **Error pattern** (from `navigation.ts`): Always use `ErrorCode.ERR_*` constants, never string literals. Include `attempted`, `suggestions[]`, and contextual `details`.

3. **Browser script pattern** (from MEMORY.md): All `page.evaluate()` calls MUST use string scripts or IIFE strings. No module-level function references. Inner function declarations are OK inside the evaluated function body.

4. **Import pattern**: Use `#core/*`, `#bridge/*`, `#proxy/*` path aliases for infrastructure. Use relative imports with `.js` extension for sibling modules (e.g., `import { detectTableType } from './table.js'`).

5. **Page interface pattern**: Each module defines its own minimal `XxxPage` interface (e.g., `TablePage`, `DialogPage`). Only include the Playwright methods actually used by that module. This enables hermetic unit testing with simple mock objects.

### 22.2 Error Codes Consumed Per Module

| Module                  | Error Class                                         | Error Codes Used                                                |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| `table.ts`              | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`, `ERR_CONTROL_AGGREGATION`              |
| `table.ts`              | `TimeoutError`                                      | `ERR_TIMEOUT_OPERATION`                                         |
| `table-operations.ts`   | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`, `ERR_CONTROL_AGGREGATION`              |
| `dialog.ts`             | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`                                         |
| `dialog.ts`             | `TimeoutError`                                      | `ERR_TIMEOUT_OPERATION`                                         |
| `date.ts`               | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`, `ERR_CONTROL_PROPERTY`                 |
| `odata.ts`              | `ODataError`                                        | `ERR_ODATA_REQUEST_FAILED`, `ERR_ODATA_PARSE`, `ERR_ODATA_CSRF` |
| `odata.ts`              | `TimeoutError`                                      | `ERR_TIMEOUT_OPERATION`                                         |
| `odata-http.ts`         | `ODataError`                                        | `ERR_ODATA_REQUEST_FAILED`, `ERR_ODATA_PARSE`, `ERR_ODATA_CSRF` |
| `odata-http.ts`         | `TimeoutError`                                      | `ERR_TIMEOUT_OPERATION`                                         |
| `list-report.ts`        | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`, `ERR_CONTROL_AGGREGATION`              |
| `object-page.ts`        | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`                                         |
| `object-page.ts`        | `NavigationError`                                   | `ERR_NAV_ROUTE_FAILED`                                          |
| `fe-table-helpers.ts`   | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`, `ERR_CONTROL_AGGREGATION`              |
| `fe-list-helpers.ts`    | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`, `ERR_CONTROL_AGGREGATION`              |
| `matcher-utils.ts`      | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`, `ERR_CONTROL_AGGREGATION`              |
| `fe-test-library.ts`    | `ControlError`                                      | `ERR_CONTROL_NOT_FOUND`                                         |
| `fe-test-library.ts`    | `TimeoutError`                                      | `ERR_TIMEOUT_OPERATION`                                         |
| `fe-browser-scripts.ts` | _(none — pure string constants, no error throwing)_ | _(none)_                                                        |

All error codes verified against `src/core/errors/codes.ts` — all exist.

### 22.3 Constants Reference

From `src/core/utils/constants.ts` (`DEFAULT_TIMEOUTS`):

- `UI5_WAIT`: 15,000 ms — used by OData wait functions
- `CONTROL_DISCOVERY`: 10,000 ms — used by table/dialog/date discovery
- `POLLING_INTERVAL`: 100 ms — used by `page.waitForFunction()` polling option
- `DOM_SETTLE`: 500 ms — NOT used by Phase 4 modules
- `UI5_BOOTSTRAP`: 60,000 ms — NOT used by Phase 4 modules
- `CACHE_TTL`: 5,000 ms — NOT used by Phase 4 modules
