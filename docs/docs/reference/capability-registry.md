---
title: Capability Registry
description: Machine-readable registry of all Praman capabilities, APIs, guarantees, and failure modes for SAP test engineers, QA leads, and AI agents.
---

# Capability Registry

Machine-readable registry of every Praman capability. Each entry documents **what** the capability does,
**what it guarantees**, which **APIs** it exposes, how it can **fail**, and an **agent hint** for AI-driven
test generation.

:::info Audiences
This registry serves three audiences:

- **SAP Test Engineers** — find the right API for a task, understand guarantees and failure modes
- **QA Leads & Evaluators** — audit coverage, map capabilities to business processes
- **AI Agents** — use `agent_hint` fields to select capabilities and avoid anti-patterns
  :::

## Overview

| Metric                 | Count                                          |
| ---------------------- | ---------------------------------------------- |
| **Total Capabilities** | 36                                             |
| **Total Public APIs**  | 231                                            |
| **Category Codes**     | 18                                             |
| **Source of Truth**    | `playwright-praman/src/**/*.ts` (exports only) |
| **Version**            | 1.0.1                                          |

### Category Codes

| Code  | Domain                         |
| ----- | ------------------------------ |
| LOC   | Control Discovery & Locators   |
| ACT   | Interactions & Actions         |
| WAIT  | Waiting & Synchronization      |
| ASRT  | Assertions & Matchers          |
| NAV   | Navigation & Routing           |
| AUTH  | Authentication & Session Setup |
| DATA  | Data & Model Inspection        |
| TBL   | Tables & Lists                 |
| DLG   | Dialogs, Popovers & Overlays   |
| DTP   | Date & Time Controls           |
| FE    | Fiori Elements Helpers         |
| FLP   | FLP Platform Services          |
| VOCAB | Business Vocabulary            |
| INT   | SAP Business Intents           |
| FIX   | Fixtures & Test Configuration  |
| AI    | AI Agent Operability           |
| DX    | Developer Experience & Tooling |
| MIG   | Migration & Compatibility      |

---

## LOC: Control Discovery & Locators

### UI5-LOC-001 — Locate controls by metadata

Find UI5 controls using type, properties, binding path, or ID without CSS selectors.

**Guarantees:**

- Stable across UI rerenders, theme changes, and view recreations
- No dependency on generated DOM IDs or CSS classes
- Falls back to Playwright locator for non-UI5 DOM elements automatically
- Cached per-selector within a test to avoid redundant browser roundtrips

**APIs:**

| API                           | Description                                                     |
| ----------------------------- | --------------------------------------------------------------- |
| `ui5.control(selector)`       | Find single control by UI5Selector — `sap.ui.test.RecordReplay` |
| `ui5.controls(selector)`      | Find all matching controls — `sap.ui.core.Element.registry`     |
| `ui5.waitFor(selector, opts)` | Poll until control appears — custom polling loop                |
| `ui5.inspect(selector)`       | Return full metadata without proxy — `sap.ui.core.Element`      |

**Failures:**

- Control not rendered — throws `ControlError` if called before UI5 bootstraps
- Ambiguous match — returns first match; use `controlType` + `properties` to narrow
- Stale ID after navigation — cache is invalidated on frame navigation events
- Timeout waiting for control — throws `TimeoutError` after configurable deadline

:::tip Agent Hint
Use when user needs to find, locate, or select a UI5 control on screen.
Do not use for raw DOM queries, non-UI5 web elements, or CSS/XPath selectors.
:::

### UI5-LOC-002 — Custom selector engine (ui5=)

Use Playwright's native selector syntax with `ui5=` prefix for control queries.

**Guarantees:**

- Registered once per worker via Playwright `selectors.register()`
- Supports `controlType` and `ID` via `data-sap-ui` attributes
- Compatible with all Playwright locator methods (`click`, `fill`, `waitFor`)

**APIs:**

| API                                   | Description                         |
| ------------------------------------- | ----------------------------------- |
| `page.locator('ui5=sap.m.Button#id')` | Playwright selector with ui5 engine |
| `createUI5SelectorEngineScript()`     | Factory for engine registration     |

**Failures:**

- Engine not registered — if worker fixture not loaded, `ui5=` prefix throws
- Attribute missing — pre-bootstrap elements lack `data-sap-ui` attributes

:::tip Agent Hint
Use when integrating UI5 control selection with Playwright's native locator API.
Do not use when full UI5Selector object with properties/bindings is needed.
:::

### UI5-LOC-003 — Inspect control metadata

Read full control properties, bindings, aggregations, and type without interaction.

**Guarantees:**

- Returns `controlType`, all properties with current values, aggregation names
- Includes binding paths for data-bound properties
- Does not create interactive proxy — read-only introspection

**APIs:**

| API                     | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `ui5.inspect(selector)` | Full metadata including properties, bindings, aggregations |

**Failures:**

- Control destroyed between discovery and inspection — throws `ControlError`
- Bridge not injected — auto-injects on first call

:::tip Agent Hint
Use when user needs to debug, assert metadata, or analyze a control's state.
Do not use for clicking/filling — use `control()` for interactive proxies.
:::

---

## ACT: Interactions & Actions

### UI5-ACT-001 — Control interactions

Click, fill, select, check, and clear UI5 controls via pluggable interaction strategies.

**Guarantees:**

- Waits for UI5 stability before every action
- Executes via configurable strategy (DOM-first, OPA5, or UI5-native)
- Each action appears as a named step in Playwright trace viewer
- Method blacklist prevents calling destructive SAP API methods

**APIs:**

| API                         | Description                                                     |
| --------------------------- | --------------------------------------------------------------- |
| `ui5.click(selector)`       | Click a button, link, or control — `InteractionStrategy.press`  |
| `ui5.fill(selector, value)` | Type text into input/textarea — `InteractionStrategy.enterText` |
| `ui5.press(selector)`       | Alias for click                                                 |
| `ui5.select(selector, key)` | Pick option in dropdown/combo — `InteractionStrategy.select`    |
| `ui5.check(selector)`       | Enable a checkbox — `setSelected(true)`                         |
| `ui5.uncheck(selector)`     | Disable a checkbox — `setSelected(false)`                       |
| `ui5.clear(selector)`       | Clear text from input — `enterText('')`                         |

**Failures:**

- Control not found — throws `ControlError` with selector details
- Control not interactable — strategy-level error if control is disabled/invisible
- Input validation rejection — `fireChange` may trigger UI5 server-side validation

:::tip Agent Hint
Use when user needs to click, type, select, check, or clear a UI5 control.
Do not use for reading values — use `getText`/`getValue` instead.
:::

### UI5-ACT-002 — Read control values

Read displayed text or current value from UI5 controls.

**Guarantees:**

- Waits for UI5 stability before reading
- Reads via `page.evaluate()` bridge to SAP API `getText()`/`getValue()`

**APIs:**

| API                      | Description                                |
| ------------------------ | ------------------------------------------ |
| `ui5.getText(selector)`  | Read text property — `control.getText()`   |
| `ui5.getValue(selector)` | Read value property — `control.getValue()` |

**Failures:**

- Control has no text/value method — returns undefined or throws
- Value is stale — read may return old value if called during async model update

:::tip Agent Hint
Use when user needs to read or assert the text/value displayed in a UI5 control.
Do not use for metadata inspection — use `inspect()` instead.
:::

### UI5-ACT-003 — Footer bar actions

Click standard Fiori footer bar buttons (Save, Edit, Cancel, Delete, Create, Apply).

**Guarantees:**

- Targets buttons by visible text in the `.sapMBarChild` footer area
- Each click appears as a named step in Playwright trace viewer

**APIs:**

| API                       | Description         |
| ------------------------- | ------------------- |
| `ui5Footer.clickSave()`   | Click Save button   |
| `ui5Footer.clickEdit()`   | Click Edit button   |
| `ui5Footer.clickCancel()` | Click Cancel button |
| `ui5Footer.clickDelete()` | Click Delete button |
| `ui5Footer.clickCreate()` | Click Create button |
| `ui5Footer.clickApply()`  | Click Apply button  |

**Failures:**

- Button not in footer — throws `ControlError` if button text not found
- Wrong view mode — Edit button only appears in display mode, Save in edit mode

:::tip Agent Hint
Use when user needs to click Save, Edit, Cancel, or other standard footer buttons.
Do not use for custom buttons — use `ui5.click()` with a selector instead.
:::

---

## WAIT: Waiting & Synchronization

### UI5-WAIT-001 — UI5 framework synchronization

Wait for the UI5 rendering pipeline to complete before acting on controls.

**Guarantees:**

- Checks `sap.ui.getCore().getUIDirty()` for pending renders
- Auto-wait runs before every module method call (table, dialog, date, odata)
- Configurable timeout with per-operation override
- Auto-stability fixture waits after every main frame navigation

**APIs:**

| API                               | Description                          |
| --------------------------------- | ------------------------------------ |
| `ui5.waitForUI5(timeout)`         | Explicit wait for UI5 stability      |
| `waitForUI5Stable(page, opts)`    | Standalone utility function          |
| `waitForUI5Bootstrap(page, opts)` | Wait for `sap.ui.getCore()` to exist |

**Failures:**

- UI5 not loaded — returns immediately if `sap.ui` is undefined (non-UI5 page)
- Infinite pending — times out if UI5 keeps scheduling micro-tasks

:::tip Agent Hint
Use when user needs to wait for UI5 to finish rendering after navigation or data load.
Do not use for waiting for a specific control — use `ui5.waitFor(selector)` instead.
:::

### UI5-WAIT-002 — Request interception

Auto-block WalkMe, analytics, and tracking scripts during test execution.

**Guarantees:**

- Auto-enabled via stability fixture — no manual activation needed
- Blocks patterns from `DEFAULT_IGNORE_PATTERNS` plus custom `ignoreAutoWaitUrls`
- Routes are cleaned up in teardown to avoid handler leaks

**APIs:**

| API                                 | Description                                       |
| ----------------------------------- | ------------------------------------------------- |
| `requestInterceptor` (auto fixture) | Blocks configured URL patterns via `page.route()` |

**Failures:**

- Pattern too broad — may accidentally block legitimate app requests
- WalkMe loaded before intercept — first-load scripts may already execute

:::tip Agent Hint
Use when user reports WalkMe/analytics interference during test execution.
Do not use for custom request mocking — use Playwright's `page.route()` directly.
:::

---

## ASRT: Assertions & Matchers

### UI5-ASRT-001 — UI5 control matchers

Assert UI5 control properties, visibility, enabled state, and value state with auto-retry.

**Guarantees:**

- All matchers auto-retry via polling until timeout (web-first assertion pattern)
- Registered automatically via worker fixture — no manual setup
- Descriptive failure messages include control ID, expected, and actual values
- Support both exact match and RegExp patterns for text assertions

**APIs:**

| API                                            | Description                                    |
| ---------------------------------------------- | ---------------------------------------------- |
| `expect(proxy).toHaveUI5Text(expected)`        | Assert text property                           |
| `expect(proxy).toBeUI5Visible()`               | Assert `visible === true`                      |
| `expect(proxy).toBeUI5Enabled()`               | Assert `enabled === true`                      |
| `expect(proxy).toHaveUI5Property(name, value)` | Assert any property                            |
| `expect(proxy).toHaveUI5ValueState(state)`     | Assert valueState (None/Error/Warning/Success) |
| `expect(proxy).toHaveUI5Binding(prop, path?)`  | Assert data binding exists                     |
| `expect(proxy).toBeUI5ControlType(type)`       | Assert fully qualified control type            |

**Failures:**

- Control destroyed mid-assertion — polling stops, last error surfaces
- Property does not exist — returns undefined, assertion fails with clear message

:::tip Agent Hint
Use when user needs to assert properties, visibility, or state of a UI5 control.
Do not use for non-UI5 DOM elements — use Playwright's built-in `expect` instead.
:::

### UI5-ASRT-002 — UI5 table matchers

Assert table row count, cell text, and selected row count with auto-retry.

**Guarantees:**

- Navigates table structure via items/cells aggregations
- Supports string and RegExp matching for cell text
- Auto-retry via polling until timeout

**APIs:**

| API                                               | Description                            |
| ------------------------------------------------- | -------------------------------------- |
| `expect(proxy).toHaveUI5RowCount(n)`              | Assert row count via items aggregation |
| `expect(proxy).toHaveUI5CellText(row, col, text)` | Assert cell text at position           |
| `expect(proxy).toHaveUI5SelectedRows(n)`          | Assert selected row count              |

**Failures:**

- Row/column out of bounds — returns descriptive error with actual dimensions
- Table not loaded — empty items aggregation until OData load completes

:::tip Agent Hint
Use when user needs to verify table row count, cell content, or selection state.
Do not use for table interactions (click row, sort) — use `ui5.table` methods instead.
:::

---

## NAV: Navigation & Routing

### UI5-NAV-001 — FLP navigation

Navigate between SAP Fiori Launchpad apps by hash, tile, intent, or search.

**Guarantees:**

- Each navigation appears as a named step in Playwright trace viewer
- Bridge injection state auto-resets on frame navigation
- Supports semantic object intents with query parameters
- Configurable base URL injection from auth config

**APIs:**

| API                                               | Description                                                     |
| ------------------------------------------------- | --------------------------------------------------------------- |
| `ui5Navigation.navigateToApp(appId)`              | Navigate by semantic hash                                       |
| `ui5Navigation.navigateToTile(title)`             | Click FLP tile by title                                         |
| `ui5Navigation.navigateToIntent(intent, params?)` | Semantic object + action (`intent: { semanticObject, action }`) |
| `ui5Navigation.navigateToHash(hash)`              | Direct hash navigation                                          |
| `ui5Navigation.navigateToHome()`                  | Return to FLP home                                              |
| `ui5Navigation.navigateBack()`                    | Browser history back                                            |
| `ui5Navigation.navigateForward()`                 | Browser history forward                                         |
| `ui5Navigation.searchAndOpenApp(title)`           | Shell search bar + open                                         |
| `ui5Navigation.getCurrentHash()`                  | Read current URL hash                                           |

**Failures:**

- App not found — tile or search may not find the target app
- Shell not loaded — navigation fails before FLP bootstrap completes
- Hash collision — multiple apps may respond to the same semantic object

:::tip Agent Hint
Use when user needs to navigate to a Fiori app, tile, or FLP home page.
Do not use for in-app routing (sections, tabs) — use objectPage helpers instead.
:::

### UI5-NAV-002 — Shell header operations

Interact with the Fiori Launchpad shell header (home, user menu, notifications).

**Guarantees:**

- Targets well-known FLP shell DOM IDs (`#shell-header`, `#meAreaHeaderButton`)
- Works across Fiori 2.0 and 3.0 shell layouts

**APIs:**

| API                            | Description                    |
| ------------------------------ | ------------------------------ |
| `ui5Shell.expectShellHeader()` | Assert shell header is visible |
| `ui5Shell.clickHome()`         | Navigate to FLP home via logo  |
| `ui5Shell.openUserMenu()`      | Open user avatar menu          |
| `ui5Shell.openNotifications()` | Open notifications panel       |

**Failures:**

- Shell not rendered — throws `NavigationError` if `#shell-header` is missing
- Custom shell — non-standard FLP shells may use different selectors

:::tip Agent Hint
Use when user needs to interact with FLP shell header (home, user menu, notifications).
Do not use for in-app navigation — use `ui5Navigation` instead.
:::

---

## AUTH: Authentication & Session Setup

### UI5-AUTH-001 — SAP authentication strategies

Authenticate to SAP systems using pluggable strategies (on-prem, Cloud SAML, O365, API, cert).

**Guarantees:**

- Strategy auto-detected from URL pattern or explicit config
- Custom strategies can be registered via `registerAuthStrategy()`
- Session tracked with `authenticatedAt` timestamp
- Auto-logout during fixture teardown if session is active

**APIs:**

| API                                   | Description                     |
| ------------------------------------- | ------------------------------- |
| `sapAuth.login(page, config)`         | Execute auth flow via strategy  |
| `sapAuth.logout(page)`                | Server-side logout              |
| `sapAuth.getSessionInfo()`            | Read session metadata           |
| `createAuthStrategy(config)`          | Factory for built-in strategies |
| `registerAuthStrategy(name, factory)` | Register custom strategy        |
| `detectSystemType(config)`            | Auto-detect on-prem vs cloud    |

**Failures:**

- Invalid credentials — strategy-specific error after login page interaction
- SAML redirect timeout — Cloud SAML IdP may be slow to respond
- Session expired — re-authentication needed mid-test
- Multi-tenant URL construction — incorrect subdomain causes 404

:::tip Agent Hint
Use when user needs to log in/out of an SAP system or configure auth strategies.
Do not use for non-SAP authentication — use Playwright's built-in auth instead.
:::

### UI5-AUTH-002 — Authentication state checks

Verify authentication state without performing login/logout.

**Guarantees:**

- Page-level checks via `page.evaluate()` — no server roundtrip
- Checks multiple indicators (UI5 loaded, shell visible, login page, user menu)

**APIs:**

| API                        | Description                         |
| -------------------------- | ----------------------------------- |
| `isAuthenticated(page)`    | Composite check for logged-in state |
| `isLoginPageVisible(page)` | Detect login form on screen         |
| `isShellVisible(page)`     | Detect FLP shell header             |
| `isUI5Loaded(page)`        | Detect `sap.ui.getCore()`           |
| `isUserMenuVisible(page)`  | Detect user avatar button           |

**Failures:**

- Partial load — shell visible but UI5 not fully bootstrapped
- Custom login page — non-standard login forms may not be detected

:::tip Agent Hint
Use when user needs to check if the current page is authenticated.
Do not use to perform login — use `sapAuth.login()` instead.
:::

---

## DATA: Data & Model Inspection

### UI5-DATA-001 — OData model queries

Read OData model data, properties, and pending changes from the UI5 model layer.

**Guarantees:**

- Reads via `page.evaluate()` from the UI5 OData model (not HTTP)
- Supports custom model names for multi-model apps
- CSRF token fetched via HEAD request for write operations

**APIs:**

| API                                | Description                                                  |
| ---------------------------------- | ------------------------------------------------------------ |
| `ui5.odata.getModelData(path)`     | Read entity or collection — `ODataModel.getData()`           |
| `ui5.odata.getModelProperty(path)` | Read single property — `ODataModel.getProperty()`            |
| `ui5.odata.waitForLoad(opts)`      | Wait for OData requests to complete                          |
| `ui5.odata.fetchCSRFToken(url)`    | Fetch token for write operations                             |
| `ui5.odata.getEntityCount(path)`   | Count entities at model path                                 |
| `ui5.odata.hasPendingChanges()`    | Check for unsaved changes — `ODataModel.hasPendingChanges()` |

**Failures:**

- Model not found — default model may not be OData type
- Path not bound — model path has no data if view hasn't loaded it
- CSRF token expired — token has limited lifetime

:::tip Agent Hint
Use when user needs to read OData model data or check for pending changes.
Do not use for HTTP CRUD — use OData HTTP methods for direct service calls.
:::

### UI5-DATA-002 — OData HTTP operations

Execute CRUD operations and function imports against OData services via HTTP.

**Guarantees:**

- Uses Playwright's `page.request` API (not the UI5 model layer)
- Supports OData V2 and V4 URL conventions
- CSRF token handled automatically for mutating operations

**APIs:**

| API                                             | Description                            |
| ----------------------------------------------- | -------------------------------------- |
| `ui5.odata.createEntity(url, set, data)`        | POST new entity                        |
| `ui5.odata.updateEntity(url, set, key, data)`   | PUT/PATCH entity                       |
| `ui5.odata.deleteEntity(url, set, key)`         | DELETE entity                          |
| `ui5.odata.queryEntities(url, set, opts)`       | GET with `$filter`/`$select`/`$expand` |
| `ui5.odata.callFunctionImport(url, fn, params)` | Invoke function import                 |

**Failures:**

- Service unavailable — 404 if OData service not activated in SAP
- Authorization error — 403 for missing SAP roles
- Entity not found — 404 on update/delete of non-existent key

:::tip Agent Hint
Use when user needs to create, update, delete, or query OData entities via HTTP.
Do not use for reading model-layer data — use `getModelData()` instead.
:::

---

## TBL: Tables & Lists

### UI5-TBL-001 — Table operations

Read, select, filter, sort, and export rows in `sap.m.Table` and `sap.ui.table.Table`.

**Guarantees:**

- Auto-detects table type (responsive vs grid vs analytical) via `detectTableType()`
- Pre-action UI5 stability wait on every method call
- Each operation wrapped in `test.step()` for trace viewer
- Supports Smart Table variants

**APIs:**

| API                                                | Description                  |
| -------------------------------------------------- | ---------------------------- |
| `ui5.table.getRows(id)`                            | Get all row data             |
| `ui5.table.getRowCount(id)`                        | Count visible rows           |
| `ui5.table.getCellValue(id, row, col)`             | Read cell text               |
| `ui5.table.getData(id)`                            | Get full table data as array |
| `ui5.table.selectRow(id, row)`                     | Select a row by index        |
| `ui5.table.selectAll(id)`                          | Select all rows              |
| `ui5.table.deselectAll(id)`                        | Deselect all rows            |
| `ui5.table.getSelectedRows(id)`                    | Get selected row indices     |
| `ui5.table.waitForData(id)`                        | Wait for rows to load        |
| `ui5.table.findRowByValues(id, criteria)`          | Find row by column values    |
| `ui5.table.clickRow(id, row)`                      | Click a row                  |
| `ui5.table.selectRowByValues(id, values)`          | Select by column match       |
| `ui5.table.ensureRowVisible(id, row)`              | Scroll to row                |
| `ui5.table.setTableCellValue(id, row, col, value)` | Write cell value             |
| `ui5.table.getColumnNames(id)`                     | List column headers          |
| `ui5.table.getCellByColumnName(id, row, col)`      | Read by column name          |
| `ui5.table.filterByColumn(id, col, value)`         | Apply column filter          |
| `ui5.table.sortByColumn(id, col)`                  | Toggle column sort           |
| `ui5.table.getSortOrder(id, col)`                  | Read sort direction          |
| `ui5.table.getFilterValue(id, col)`                | Read active filter value     |
| `ui5.table.exportData(id)`                         | Trigger table export         |
| `ui5.table.clickSettings(id)`                      | Open table settings dialog   |

**Failures:**

- Table not found — throws if control ID doesn't match a table
- Row index out of bounds — error if `row >= table length`
- Data not loaded — empty rows before OData response arrives

:::tip Agent Hint
Use when user needs to interact with a UI5 table (read, select, filter, sort rows).
Do not use for Fiori Elements table helpers — use `fe.table` instead.
:::

---

## DLG: Dialogs, Popovers & Overlays

### UI5-DLG-001 — Dialog management

Wait for, confirm, dismiss, and inspect open UI5 dialogs and popovers.

**Guarantees:**

- `searchOpenDialogs: true` selector flag searches the UI5 static area
- Pre-action UI5 stability wait on every method call
- Each operation wrapped in `test.step()` for trace viewer

**APIs:**

| API                                  | Description                          |
| ------------------------------------ | ------------------------------------ |
| `ui5.dialog.waitFor(opts)`           | Wait for any dialog to appear        |
| `ui5.dialog.confirm(opts)`           | Click positive (OK/Confirm) button   |
| `ui5.dialog.dismiss(opts)`           | Click negative (Cancel/Close) button |
| `ui5.dialog.isOpen(dialogId)`        | Check if specific dialog is open     |
| `ui5.dialog.getOpen()`               | List all currently open dialogs      |
| `ui5.dialog.getButtons(dialogId)`    | List available dialog buttons        |
| `ui5.dialog.waitForClosed(dialogId)` | Wait for dialog to close             |

**Failures:**

- No dialog open — `waitFor` times out if no dialog appears
- Button text mismatch — `confirm`/`dismiss` assumes standard button texts
- Popover vs Dialog — some overlays use `Popover`, not `Dialog`

:::tip Agent Hint
Use when user needs to interact with UI5 dialogs, message boxes, or popovers.
Do not use for in-page sections or panels — use objectPage helpers.
:::

---

## DTP: Date & Time Controls

### UI5-DTP-001 — Date and time picker controls

Set and read DatePicker, DateRangeSelection, and TimePicker control values.

**Guarantees:**

- Handles SAP date format conversion via `formatDateForUI5()`
- Supports `Date` objects, ISO strings, and epoch numbers as input
- `setAndValidate` combines set + read-back assertion

**APIs:**

| API                                      | Description              |
| ---------------------------------------- | ------------------------ |
| `ui5.date.setDatePicker(id, date, opts)` | Set date value           |
| `ui5.date.getDatePicker(id)`             | Read current date value  |
| `ui5.date.setDateRange(id, start, end)`  | Set date range selection |
| `ui5.date.getDateRange(id)`              | Read date range values   |
| `ui5.date.setTimePicker(id, time)`       | Set time value           |
| `ui5.date.getTimePicker(id)`             | Read current time value  |
| `ui5.date.setAndValidate(id, date)`      | Set and verify roundtrip |

**Failures:**

- Invalid date format — format mismatch between input and UI5 locale
- Date picker closed — value may not persist if picker not properly focused

:::tip Agent Hint
Use when user needs to set or read date/time picker controls in SAP UI5 forms.
Do not use for non-date inputs — use `ui5.fill()` for regular text fields.
:::

---

## FE: Fiori Elements Helpers

### UI5-FE-001 — List Report operations

Filter, search, navigate, and manage variants in Fiori Elements List Report pages.

**Guarantees:**

- Works with standard FE-generated List Report templates
- Targets FE-specific DOM structure (FilterBar, SmartTable)

**APIs:**

| API                                      | Description                         |
| ---------------------------------------- | ----------------------------------- |
| `fe.listReport.getTable()`               | Get the main List Report table info |
| `fe.listReport.getFilterBar()`           | Get the FilterBar control info      |
| `fe.listReport.setFilter(field, value)`  | Set a filter bar field value        |
| `fe.listReport.search()`                 | Execute the Go/Search button        |
| `fe.listReport.clearFilters()`           | Reset all filter bar fields         |
| `fe.listReport.navigateToItem(rowIndex)` | Navigate to detail page             |
| `fe.listReport.getVariants()`            | List available view variants        |
| `fe.listReport.selectVariant(name)`      | Activate a variant                  |
| `fe.listReport.getFilterValue(field)`    | Read a filter field's value         |

**Failures:**

- No FilterBar — page may not use standard FE FilterBar component
- Variant not found — variant name doesn't match available options

:::tip Agent Hint
Use when user needs to operate on a Fiori Elements List Report page.
Do not use for custom-built list pages — use `ui5.table` and `ui5.control` instead.
:::

### UI5-FE-002 — Object Page operations

Edit, save, navigate sections, and inspect headers in Fiori Elements Object Pages.

**Guarantees:**

- Works with standard FE-generated Object Page templates
- Supports section navigation by title or ID

**APIs:**

| API                                      | Description                  |
| ---------------------------------------- | ---------------------------- |
| `fe.objectPage.clickEdit()`              | Enter edit mode              |
| `fe.objectPage.clickSave()`              | Save changes                 |
| `fe.objectPage.clickButton(name)`        | Click any Object Page button |
| `fe.objectPage.navigateToSection(title)` | Scroll to section            |
| `fe.objectPage.getSections()`            | List all sections            |
| `fe.objectPage.getSectionData(title)`    | Read section content         |
| `fe.objectPage.getHeaderTitle()`         | Read header title            |
| `fe.objectPage.isInEditMode()`           | Check edit/display mode      |

**Failures:**

- Section not found — title doesn't match any rendered section
- Not in edit mode — save fails if not switched to edit first

:::tip Agent Hint
Use when user needs to operate on a Fiori Elements Object Page.
Do not use for custom detail pages — use `ui5.control` and `ui5.click` instead.
:::

### UI5-FE-003 — FE table and list helpers

Read rows, cells, and interact with Fiori Elements tables and lists.

**Guarantees:**

- FE-specific helpers that understand FE table/list DOM structure
- Separate from core table module — optimized for FE templates

**APIs:**

| API                                       | Description                       |
| ----------------------------------------- | --------------------------------- |
| `fe.table.getRowCount(id)`                | Count FE table rows               |
| `fe.table.getCellValue(id, row, col)`     | Read FE cell value by column name |
| `fe.table.findRow(id, values)`            | Find row matching column values   |
| `fe.table.clickRow(id, row)`              | Click an FE table row             |
| `fe.table.getColumnNames(id)`             | List FE table column names        |
| `fe.list.getItemCount(id)`                | Count list items                  |
| `fe.list.getItemTitle(id, index)`         | Read list item title              |
| `fe.list.findItemByTitle(id, title)`      | Find item by title text           |
| `fe.list.clickItem(id, index)`            | Click a list item                 |
| `fe.list.selectItem(id, index, selected)` | Toggle list item selection        |

**Failures:**

- Not a FE table — helpers assume FE-generated table structure
- Column name mismatch — column names are case-sensitive

:::tip Agent Hint
Use when user needs to read or interact with Fiori Elements tables or lists.
Do not use for core `sap.m.Table` — use `ui5.table` methods instead.
:::

---

## FIX: Fixtures & Test Configuration

### UI5-FIX-001 — Merged test fixtures

Single import provides all Praman fixtures (ui5, navigation, auth, AI, FE, etc.).

**Guarantees:**

- `import { test, expect } from 'playwright-praman'` gives everything
- Fixtures composed via Playwright's `mergeTests()` — no import conflicts
- Worker fixtures (config, logger, tracer) created once per worker
- Test fixtures (ui5, sapAuth) created per test with proper teardown

**APIs:**

| API               | Description                                                 |
| ----------------- | ----------------------------------------------------------- |
| `test`            | Merged Playwright test with all fixtures                    |
| `expect`          | Playwright expect with UI5 matchers registered              |
| `coreTest`        | Standalone core fixtures (config, logger, ui5)              |
| `authTest`        | Standalone auth fixtures (sapAuth)                          |
| `navTest`         | Standalone navigation fixtures (ui5Navigation, btpWorkZone) |
| `stabilityTest`   | Standalone stability fixtures (auto-wait, interception)     |
| `feTest`          | Standalone Fiori Elements fixtures (fe)                     |
| `aiTest`          | Standalone AI fixtures (pramanAI)                           |
| `intentTest`      | Standalone intent fixtures (intent)                         |
| `moduleTest`      | Core + table/dialog/date/odata sub-namespaces               |
| `shellFooterTest` | Shell + footer fixtures (ui5Shell, ui5Footer)               |
| `flpLocksTest`    | FLP lock management fixtures (flpLocks)                     |
| `flpSettingsTest` | FLP user settings fixtures (flpSettings)                    |
| `testDataTest`    | Test data generation fixtures (testData)                    |

**Failures:**

- Missing Playwright version — requires `>=1.57.0`, asserted at worker init
- Config file not found — `loadConfig()` uses defaults with warning

:::tip Agent Hint
Use when user needs to understand which fixtures are available or how to import.
Do not use for specific fixture usage — refer to the relevant capability.
:::

### UI5-FIX-002 — Configuration management

Define and load validated, frozen Praman configuration with Zod schema.

**Guarantees:**

- Zod-validated with detailed error messages on invalid config
- Configuration is `Readonly<PramanConfig>` — never mutated at runtime
- Loaded once per worker via `loadConfig()`
- Supports `praman.config.ts` file discovery

**APIs:**

| API                   | Description                               |
| --------------------- | ----------------------------------------- |
| `defineConfig(input)` | Create typed config with defaults applied |
| `loadConfig(opts?)`   | Load and validate config from file or env |

**Failures:**

- Invalid config — throws `ConfigError` with field-level validation details
- File not found — falls back to defaults with structured warning

:::tip Agent Hint
Use when user needs to configure Praman timeouts, strategies, or auth settings.
Do not use for Playwright config — this is Praman-specific configuration.
:::

---

## AI: AI Agent Operability

### UI5-AI-001 — Page discovery for AI agents

Discover all UI5 controls on a page and build structured context for LLM prompts.

**Guarantees:**

- Returns `AiResponse` envelope with status, data, and metadata
- Discovers control types, IDs, properties, and aggregations
- Context includes UI5 version detection

**APIs:**

| API                              | Description                            |
| -------------------------------- | -------------------------------------- |
| `pramanAI.discoverPage(opts?)`   | Find all controls on current page      |
| `pramanAI.buildContext()`        | Enriched page context with UI5 version |
| `discoverPage(page, opts)`       | Standalone discovery function          |
| `buildPageContext(page, config)` | Standalone context builder             |

**Failures:**

- Non-UI5 page — returns empty context with status indicating no UI5
- Too many controls — large pages may hit `evaluate()` payload limits

:::tip Agent Hint
Use when an AI agent needs to understand the current page structure.
Do not use for manual test authoring — use `ui5.control`/`inspect` instead.
:::

### UI5-AI-002 — Capability and recipe registries

Machine-readable registries mapping Praman capabilities and test recipes for AI agents.

**Guarantees:**

- Capabilities indexed by category code for agent tool selection
- Recipes provide step-by-step patterns for common SAP test scenarios
- Both registries loadable from generated YAML or programmatic API

**APIs:**

| API                  | Description                               |
| -------------------- | ----------------------------------------- |
| `CapabilityRegistry` | Query capabilities by ID or category      |
| `RecipeRegistry`     | Query recipes by name, domain, or pattern |
| `capabilities`       | Pre-loaded capability data                |
| `recipes`            | Pre-loaded recipe data                    |

**Failures:**

- Registry empty — capabilities/recipes not generated yet
- Version mismatch — registry from different plugin version

:::tip Agent Hint
Use when an AI agent needs to select which Praman methods to call for a task.
Do not use for human test authoring — read the documentation instead.
:::

### UI5-AI-003 — LLM service and agentic handler

Connect to LLM providers and execute agentic test generation workflows.

**Guarantees:**

- Supports Anthropic and OpenAI via optional peer dependencies
- Dynamic import — AI deps only loaded when `pramanAI` fixture is used
- LLM connection cleaned up on fixture teardown

**APIs:**

| API                        | Description                                     |
| -------------------------- | ----------------------------------------------- |
| `pramanAI.llm`             | Raw LLM service for direct prompting            |
| `pramanAI.agentic`         | AgenticHandler for autonomous test generation   |
| `createLlmService(config)` | Factory for LLM provider connection             |
| `AgenticHandler`           | Orchestrates discovery + prompting + generation |

**Failures:**

- No API key — throws `AIError` if provider key not configured
- Provider unreachable — network timeout on LLM call
- Token limit — large page context may exceed provider token window

:::tip Agent Hint
Use when user needs AI-powered test generation or LLM integration.
Do not use for manual test writing — use fixtures and intents instead.
:::

---

## VOCAB: Business Vocabulary

### UI5-VOCAB-001 — SAP business vocabulary resolution

Resolve natural-language business terms to UI5 selectors across SAP domains.

**Guarantees:**

- Fuzzy matching with configurable threshold
- Synonym resolution across 6 SAP domains (procurement, sales, finance, manufacturing, warehouse, quality)
- Vocabulary loaded per-domain for token efficiency

**APIs:**

| API                             | Description                        |
| ------------------------------- | ---------------------------------- |
| `pramanAI.vocabulary`           | VocabularyService instance         |
| `createVocabularyService()`     | Factory for vocabulary service     |
| `vocabulary.loadDomain(domain)` | Load domain-specific terms         |
| `vocabulary.search(term)`       | Fuzzy search across loaded domains |

**Failures:**

- Domain not loaded — search returns empty if domain not preloaded
- Term ambiguous — multiple matches across domains
- Vocabulary file missing — throws `VocabularyError`

:::tip Agent Hint
Use when user mentions SAP business terms (vendor, PO, material) and needs selector mapping.
Do not use for technical UI5 control names — use `ui5.control` with `controlType`.
:::

---

## INT: SAP Business Intents

### UI5-INT-001 — SAP domain intent operations

Execute high-level SAP business operations across 5 modules via typed intent functions.

**Guarantees:**

- Vocabulary domains auto-preloaded before `use()` — ready immediately
- Typed input data for each operation (PO, SO, journal entry, etc.)
- Returns `IntentResult` with status, message, and operation details
- All intent functions use `test.step()` for Playwright trace integration

**APIs:**

| API                                                  | SAP Transaction                   |
| ---------------------------------------------------- | --------------------------------- |
| `intent.core.fillField(label, value)`                | Fill form field by business label |
| `intent.core.clickButton(text)`                      | Click button by label             |
| `intent.core.selectOption(label, option)`            | Select from dropdown by label     |
| `intent.core.assertField(label, expected)`           | Assert field value                |
| `intent.core.confirmAndWait()`                       | Click Confirm and wait for close  |
| `intent.core.waitForSave()`                          | Wait for save completion          |
| `intent.procurement.createPurchaseOrder(data)`       | ME21N                             |
| `intent.procurement.approvePurchaseOrder(data)`      | PO approval                       |
| `intent.procurement.searchPurchaseOrders(criteria)`  | PO search                         |
| `intent.procurement.createPurchaseRequisition(data)` | ME51N                             |
| `intent.procurement.confirmGoodsReceipt(data)`       | MIGO                              |
| `intent.procurement.searchVendors()`                 | Vendor master search              |
| `intent.sales.createSalesOrder(data)`                | VA01                              |
| `intent.sales.createQuotation(data)`                 | VA21                              |
| `intent.sales.approveQuotation(data)`                | Quotation approval                |
| `intent.sales.searchSalesOrders(criteria)`           | SO search                         |
| `intent.sales.searchCustomers()`                     | Customer master search            |
| `intent.sales.checkDeliveryStatus(data)`             | Delivery status check             |
| `intent.finance.createJournalEntry(data)`            | FB50                              |
| `intent.finance.postVendorInvoice(data)`             | FB60                              |
| `intent.finance.processPayment(data)`                | F-53                              |
| `intent.manufacturing.createProductionOrder(data)`   | CO01                              |
| `intent.manufacturing.confirmProductionOrder(data)`  | CO11N                             |
| `intent.masterData.createVendorMaster(data)`         | XK01/BP                           |
| `intent.masterData.createCustomerMaster(data)`       | XD01/BP                           |
| `intent.masterData.createMaterialMaster(data)`       | MM01                              |

**Failures:**

- App not found — intent navigates to wrong app if hash mapping fails
- Field label not resolved — vocabulary miss for custom field labels
- Mandatory field missing — SAP validation rejects incomplete data

:::tip Agent Hint
Use when user describes a SAP business operation (create PO, post invoice, etc.).
Do not use for low-level control interactions — use `ui5.click`/`fill` instead.
:::

---

## FLP: FLP Platform Services

### UI5-FLP-001 — FLP lock management

Query, count, and delete SAP SM12 lock entries via OData for test isolation.

**Guarantees:**

- Auto-cleanup of tracked locks during fixture teardown
- CSRF token fetched automatically for delete operations
- Non-fatal cleanup — failures logged as warnings, not thrown

**APIs:**

| API                                          | Description                           |
| -------------------------------------------- | ------------------------------------- |
| `flpLocks.getLockEntries(username?)`         | Query SM12 lock entries               |
| `flpLocks.getNumberOfLockEntries(username?)` | Count lock entries                    |
| `flpLocks.deleteAllLockEntries(username?)`   | Delete all matching locks             |
| `flpLocks.cleanup()`                         | Auto-release tracked locks (teardown) |

**Failures:**

- `SM12_SRV` not activated — throws `FLPError` with `ERR_FLP_API_UNAVAILABLE`
- Permission denied — 403 if user lacks SM12 authorization
- Lock already released — delete returns 404 (handled gracefully)

:::tip Agent Hint
Use when user needs to manage SAP lock entries during test setup/teardown.
Do not use for application-level locking — this is system-level SM12 locks.
:::

### UI5-FLP-002 — FLP user settings

Read SAP Fiori Launchpad user settings (language, date/time format, timezone).

**Guarantees:**

- Reads from `sap.ushell.Container.getUser()` — no HTTP roundtrip
- `getAllSettings()` returns all 5 settings in a single evaluate call

**APIs:**

| API                             | Description              |
| ------------------------------- | ------------------------ |
| `flpSettings.getLanguage()`     | User language code       |
| `flpSettings.getDateFormat()`   | Date format identifier   |
| `flpSettings.getTimeFormat()`   | Time format identifier   |
| `flpSettings.getTimezone()`     | Timezone identifier      |
| `flpSettings.getNumberFormat()` | Number format identifier |
| `flpSettings.getAllSettings()`  | All settings in one call |

**Failures:**

- UShell not available — page is not an FLP application
- Container not loaded — called before FLP shell bootstrap

:::tip Agent Hint
Use when user needs to read or verify FLP user locale settings.
Do not use for changing settings — this is read-only.
:::

---

## DX: Developer Experience & Tooling

### UI5-DX-001 — Test data generation

Generate test data from templates with UUID/timestamp placeholders and auto-cleanup.

**Guarantees:**

- `{{uuid}}` generates unique value per occurrence
- `{{timestamp}}` generates ISO-8601 at generation time
- Recursive template substitution for nested objects/arrays
- Auto-cleanup removes all persisted files on test teardown

**APIs:**

| API                             | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `testData.generate(template)`   | Substitute placeholders in template         |
| `testData.save(filename, data)` | Persist as JSON file                        |
| `testData.load(filename)`       | Load and parse JSON file                    |
| `testData.cleanup()`            | Remove all tracked files (auto on teardown) |

**Failures:**

- File write permission — test output directory may not be writable
- JSON parse error — corrupted file on load

:::tip Agent Hint
Use when user needs to generate unique test data or persist data between test steps.
Do not use for production data — this is ephemeral test data only.
:::

### UI5-DX-002 — CLI tooling

Scaffold projects, diagnose environments, and manage plugin installation.

**Guarantees:**

- No external CLI framework — minimal Node.js argv parsing
- Cross-platform compatible (Windows/macOS/Linux)

**APIs:**

| API                               | Description                 |
| --------------------------------- | --------------------------- |
| `npx playwright-praman init`      | Scaffold new Praman project |
| `npx playwright-praman doctor`    | Run environment diagnostics |
| `npx playwright-praman uninstall` | Remove scaffolded files     |
| `npx playwright-praman --version` | Print package version       |

**Failures:**

- Wrong Node.js version — requires `>=22`
- Missing Playwright — init fails without `@playwright/test` peer

:::tip Agent Hint
Use when user needs to set up a new Praman project or diagnose environment issues.
Do not use for test execution — use `npx playwright test` instead.
:::

### UI5-DX-003 — Compliance and OData trace reporters

Generate structured compliance reports and OData trace logs from test runs.

**Guarantees:**

- `ComplianceReporter` tracks Praman step usage per test
- `ODataTraceReporter` captures all OData requests with entity stats
- Both implement Playwright's `Reporter` interface for config integration

**APIs:**

| API                  | Description                                   |
| -------------------- | --------------------------------------------- |
| `ComplianceReporter` | Tracks `isPramanStep()` usage per test        |
| `ODataTraceReporter` | Captures OData HTTP requests and entity stats |

**Failures:**

- Reporter not configured — must be added to `playwright.config.ts`
- Output directory missing — reporter creates output dir if needed

:::tip Agent Hint
Use when user needs compliance reports or OData request traces from test runs.
Do not use for test assertions — these are post-run reporting tools.
:::

### UI5-DX-004 — Structured error hierarchy

Rich error classes with error codes, suggestions, and retry hints for debugging.

**Guarantees:**

- All errors extend `PramanError` with `code`, `attempted`, `retryable`, `suggestions[]`
- 14 error classes covering every failure domain (control, auth, nav, OData, etc.)
- Machine-readable `ErrorCode` enum for programmatic error handling

**APIs:**

| API               | Description                                 |
| ----------------- | ------------------------------------------- |
| `PramanError`     | Base class with structured fields           |
| `ControlError`    | Control not found / interaction failed      |
| `AuthError`       | Authentication flow failures                |
| `NavigationError` | FLP navigation failures                     |
| `BridgeError`     | Browser bridge injection/execution failures |
| `ConfigError`     | Configuration validation failures           |
| `TimeoutError`    | Operation timeout with `timeoutMs` field    |
| `ODataError`      | OData service/model errors                  |
| `FLPError`        | FLP platform service errors                 |
| `SelectorError`   | Invalid selector construction               |
| `AIError`         | AI/LLM service errors                       |
| `IntentError`     | SAP business intent failures                |
| `VocabularyError` | Vocabulary resolution failures              |
| `PluginError`     | Plugin lifecycle errors                     |

**Failures:**

- Untyped catch — always check `instanceof` for proper error handling

:::tip Agent Hint
Use when handling or diagnosing errors from any Praman operation.
Do not use to throw custom errors — use the appropriate error subclass.
:::

---

## MIG: Migration & Compatibility

### UI5-MIG-001 — Branded types and type safety

Opaque branded types prevent mixing incompatible string identifiers.

**Guarantees:**

- `AppId`, `ControlId`, `ViewName`, `BindingPath`, `CSSSelector` are distinct types
- Constructor functions validate and brand at creation time
- TypeScript compiler prevents passing `AppId` where `ControlId` is expected

**APIs:**

| API                | Description                     |
| ------------------ | ------------------------------- |
| `appId(raw)`       | Brand a string as `AppId`       |
| `controlId(raw)`   | Brand a string as `ControlId`   |
| `viewName(raw)`    | Brand a string as `ViewName`    |
| `bindingPath(raw)` | Brand a string as `BindingPath` |
| `cssSelector(raw)` | Brand a string as `CSSSelector` |

**Failures:**

- Raw string passed — TypeScript error at compile time (not runtime)

:::tip Agent Hint
Use when constructing typed identifiers for Praman API calls.
Do not use for runtime validation — branded types are compile-time only.
:::

---

## Roadmap (Not Yet Shipped)

:::caution Planned — Not Available Yet
These capabilities are on the roadmap and not yet available in the current release.
:::

| ID           | Name                                                                                 | Target |
| ------------ | ------------------------------------------------------------------------------------ | ------ |
| UI5-ROAD-001 | Web Components adapter — Shadow DOM traversal for SAP UI5 Web Components hybrid apps | v1.1.0 |
| UI5-ROAD-002 | Visual regression testing — Screenshot comparison with UI5-aware masking             | v1.2.0 |
| UI5-ROAD-003 | Record and replay — Record user interactions and generate Praman test code           | v1.2.0 |

---

## Appendix A: API Cross-Reference

Alphabetical list of every public API mapped to its capability ID. AI agents use this to map a method name to its behavioral context.

<details>
<summary>Full API → Capability mapping (140+ entries)</summary>

| API                        | Capability    |
| -------------------------- | ------------- |
| `AgenticHandler`           | UI5-AI-003    |
| `AIError`                  | UI5-DX-004    |
| `APIAuthStrategy`          | UI5-AUTH-001  |
| `appId`                    | UI5-MIG-001   |
| `assertField`              | UI5-INT-001   |
| `AuthError`                | UI5-DX-004    |
| `bindingPath`              | UI5-MIG-001   |
| `BridgeError`              | UI5-DX-004    |
| `buildPageContext`         | UI5-AI-001    |
| `callFunctionImport`       | UI5-DATA-002  |
| `capabilities`             | UI5-AI-002    |
| `CapabilityRegistry`       | UI5-AI-002    |
| `CertificateAuthStrategy`  | UI5-AUTH-001  |
| `checkDeliveryStatus`      | UI5-INT-001   |
| `clearCustomStrategies`    | UI5-AUTH-001  |
| `clearFilterBar`           | UI5-FE-001    |
| `clickButton`              | UI5-INT-001   |
| `clickRow`                 | UI5-TBL-001   |
| `clickTableSettingsButton` | UI5-TBL-001   |
| `CloudSAMLAuthStrategy`    | UI5-AUTH-001  |
| `ComplianceReporter`       | UI5-DX-003    |
| `ConfigError`              | UI5-DX-004    |
| `confirmAndWait`           | UI5-INT-001   |
| `confirmDialog`            | UI5-DLG-001   |
| `ControlError`             | UI5-DX-004    |
| `controlId`                | UI5-MIG-001   |
| `createAuthStrategy`       | UI5-AUTH-001  |
| `createEntity`             | UI5-DATA-002  |
| `createLlmService`         | UI5-AI-003    |
| `createVocabularyService`  | UI5-VOCAB-001 |
| `createWorkZoneManager`    | UI5-NAV-001   |
| `cssSelector`              | UI5-MIG-001   |
| `DATE_FORMATS`             | UI5-DTP-001   |
| `DEFAULT_TIMEOUTS`         | UI5-WAIT-001  |
| `defineConfig`             | UI5-FIX-002   |
| `deleteEntity`             | UI5-DATA-002  |
| `deselectAllTableRows`     | UI5-TBL-001   |
| `detectSystemType`         | UI5-AUTH-001  |
| `detectTableType`          | UI5-TBL-001   |
| `discoverPage`             | UI5-AI-001    |
| `dismissDialog`            | UI5-DLG-001   |
| `DomFirstStrategy`         | UI5-ACT-001   |
| `ensureRowVisible`         | UI5-TBL-001   |
| `ErrorCode`                | UI5-DX-004    |
| `executeSearch`            | UI5-FE-001    |
| `exportTableData`          | UI5-TBL-001   |
| `feClickListItem`          | UI5-FE-003    |
| `feClickRow`               | UI5-FE-003    |
| `feFindListItemByTitle`    | UI5-FE-003    |
| `feFindRowByValues`        | UI5-FE-003    |
| `feGetCellValue`           | UI5-FE-003    |
| `feGetColumnNames`         | UI5-FE-003    |
| `feGetListItemCount`       | UI5-FE-003    |
| `feGetListItemTitle`       | UI5-FE-003    |
| `feGetTableRowCount`       | UI5-FE-003    |
| `feSelectListItem`         | UI5-FE-003    |
| `FETestLibraryInstance`    | UI5-FE-001    |
| `fetchCSRFToken`           | UI5-DATA-001  |
| `fillField`                | UI5-INT-001   |
| `filterByColumn`           | UI5-TBL-001   |
| `findRowByValues`          | UI5-TBL-001   |
| `FLPError`                 | UI5-DX-004    |
| `formatDateForUI5`         | UI5-DTP-001   |
| `getAvailableVariants`     | UI5-FE-001    |
| `getCellByColumnName`      | UI5-TBL-001   |
| `getColumnNames`           | UI5-TBL-001   |
| `getCurrentHash`           | UI5-NAV-001   |
| `getDatePickerValue`       | UI5-DTP-001   |
| `getDateRangeSelection`    | UI5-DTP-001   |
| `getDialogButtons`         | UI5-DLG-001   |
| `getEntityCount`           | UI5-DATA-001  |
| `getFilterBar`             | UI5-FE-001    |
| `getFilterBarFieldValue`   | UI5-FE-001    |
| `getFilterValue`           | UI5-TBL-001   |
| `getHeaderTitle`           | UI5-FE-002    |
| `getListReportTable`       | UI5-FE-001    |
| `getModelData`             | UI5-DATA-001  |
| `getModelProperty`         | UI5-DATA-001  |
| `getObjectPageSections`    | UI5-FE-002    |
| `getOpenDialogs`           | UI5-DLG-001   |
| `getRowCount`              | UI5-TBL-001   |
| `getSectionData`           | UI5-FE-002    |
| `getSelectedRows`          | UI5-TBL-001   |
| `getSortOrder`             | UI5-TBL-001   |
| `getTableCellValue`        | UI5-TBL-001   |
| `getTableData`             | UI5-TBL-001   |
| `getTableRowCount`         | UI5-TBL-001   |
| `getTableRows`             | UI5-TBL-001   |
| `getTimePickerValue`       | UI5-DTP-001   |
| `hasPendingChanges`        | UI5-DATA-001  |
| `initializeFETestLibrary`  | UI5-FE-001    |
| `IntentError`              | UI5-DX-004    |
| `isAuthenticated`          | UI5-AUTH-002  |
| `isDialogOpen`             | UI5-DLG-001   |
| `isInEditMode`             | UI5-FE-002    |
| `isLoginPageVisible`       | UI5-AUTH-002  |
| `isShellVisible`           | UI5-AUTH-002  |
| `isUI5Loaded`              | UI5-AUTH-002  |
| `isUserMenuVisible`        | UI5-AUTH-002  |
| `loadConfig`               | UI5-FIX-002   |
| `MultiTenantAuthStrategy`  | UI5-AUTH-001  |
| `navigateBack`             | UI5-NAV-001   |
| `navigateForward`          | UI5-NAV-001   |
| `navigateToApp`            | UI5-NAV-001   |
| `navigateToHash`           | UI5-NAV-001   |
| `navigateToHome`           | UI5-NAV-001   |
| `navigateToIntent`         | UI5-NAV-001   |
| `navigateToItem`           | UI5-FE-001    |
| `navigateToSection`        | UI5-FE-002    |
| `navigateToTile`           | UI5-NAV-001   |
| `NavigationError`          | UI5-DX-004    |
| `ODataError`               | UI5-DX-004    |
| `ODataTraceReporter`       | UI5-DX-003    |
| `Office365AuthStrategy`    | UI5-AUTH-001  |
| `OnPremAuthStrategy`       | UI5-AUTH-001  |
| `Opa5Strategy`             | UI5-ACT-001   |
| `PACKAGE_NAME`             | UI5-FIX-001   |
| `PluginError`              | UI5-DX-004    |
| `PramanError`              | UI5-DX-004    |
| `queryEntities`            | UI5-DATA-002  |
| `RecipeRegistry`           | UI5-AI-002    |
| `recipes`                  | UI5-AI-002    |
| `registerAuthStrategy`     | UI5-AUTH-001  |
| `retry`                    | UI5-WAIT-001  |
| `SAPAuthHandler`           | UI5-AUTH-001  |
| `searchAndOpenApp`         | UI5-NAV-001   |
| `selectAllTableRows`       | UI5-TBL-001   |
| `selectOption`             | UI5-INT-001   |
| `selectRowByValues`        | UI5-TBL-001   |
| `selectTableRow`           | UI5-TBL-001   |
| `selectVariant`            | UI5-FE-001    |
| `SelectorError`            | UI5-DX-004    |
| `setAndValidateDate`       | UI5-DTP-001   |
| `setDatePickerValue`       | UI5-DTP-001   |
| `setDateRangeSelection`    | UI5-DTP-001   |
| `setFilterBarField`        | UI5-FE-001    |
| `setTableCellValue`        | UI5-TBL-001   |
| `setTimePickerValue`       | UI5-DTP-001   |
| `sortByColumn`             | UI5-TBL-001   |
| `TimeoutError`             | UI5-DX-004    |
| `UI5NativeStrategy`        | UI5-ACT-001   |
| `updateEntity`             | UI5-DATA-002  |
| `VERSION`                  | UI5-FIX-001   |
| `viewName`                 | UI5-MIG-001   |
| `VocabularyError`          | UI5-DX-004    |
| `waitForDialog`            | UI5-DLG-001   |
| `waitForDialogClosed`      | UI5-DLG-001   |
| `waitForLoad`              | UI5-DATA-001  |
| `waitForSave`              | UI5-INT-001   |
| `waitForTableData`         | UI5-TBL-001   |
| `waitForUI5Bootstrap`      | UI5-WAIT-001  |
| `waitForUI5Stable`         | UI5-WAIT-001  |

</details>

---

## Appendix B: Capability → SKILL.md Mapping

Maps each capability to its corresponding SKILL.md section. AI agents use this for progressive disclosure — load only the skill section relevant to the current task.

<details>
<summary>Full Capability → SKILL.md mapping (36 entries)</summary>

| Capability    | SKILL.md Section                     | When to Load                                                               |
| ------------- | ------------------------------------ | -------------------------------------------------------------------------- |
| UI5-LOC-001   | `## Control Discovery`               | User mentions locating, finding, or selecting UI5 controls                 |
| UI5-LOC-002   | `## Selector Engine`                 | User mentions `ui5=` selector prefix or Playwright locator integration     |
| UI5-LOC-003   | `## Control Inspection`              | User mentions inspecting, debugging, or reading control metadata           |
| UI5-ACT-001   | `## Interactions`                    | User mentions clicking, typing, filling, selecting, or checking controls   |
| UI5-ACT-002   | `## Reading Values`                  | User mentions reading text or values from UI5 controls                     |
| UI5-ACT-003   | `## Footer Actions`                  | User mentions Save, Edit, Cancel, Delete, or Apply buttons                 |
| UI5-WAIT-001  | `## Synchronization`                 | User mentions waiting, stability, or async rendering issues                |
| UI5-WAIT-002  | `## Request Interception`            | User mentions WalkMe, analytics interference, or request blocking          |
| UI5-ASRT-001  | `## Assertions`                      | User mentions asserting or verifying UI5 control properties                |
| UI5-ASRT-002  | `## Table Assertions`                | User mentions asserting table row count, cell text, or selections          |
| UI5-NAV-001   | `## Navigation`                      | User mentions navigating to Fiori apps, tiles, or FLP home                 |
| UI5-NAV-002   | `## Shell Header`                    | User mentions shell header, home button, user menu, or notifications       |
| UI5-AUTH-001  | `## Authentication`                  | User mentions login, logout, SAP auth, or session management               |
| UI5-AUTH-002  | `## Auth State Checks`               | User mentions checking if page is authenticated or login page visible      |
| UI5-DATA-001  | `## OData Model`                     | User mentions reading OData model data, properties, or pending changes     |
| UI5-DATA-002  | `## OData HTTP`                      | User mentions creating, updating, deleting, or querying OData entities     |
| UI5-TBL-001   | `## Table Operations`                | User mentions tables, rows, cells, filtering, sorting, or exporting        |
| UI5-DLG-001   | `## Dialogs`                         | User mentions dialogs, popovers, message boxes, or overlays                |
| UI5-DTP-001   | `## Date Time`                       | User mentions date pickers, time pickers, or date range selection          |
| UI5-FE-001    | `## Fiori Elements List Report`      | User mentions List Report, filter bar, variants, or FE search              |
| UI5-FE-002    | `## Fiori Elements Object Page`      | User mentions Object Page, sections, edit mode, or FE header               |
| UI5-FE-003    | `## Fiori Elements Tables and Lists` | User mentions FE-specific tables or lists                                  |
| UI5-FIX-001   | `## Fixtures`                        | User asks about importing or composing Praman fixtures                     |
| UI5-FIX-002   | `## Configuration`                   | User asks about configuring Praman settings or timeouts                    |
| UI5-AI-001    | `## AI Discovery`                    | User mentions AI page discovery or building page context for LLMs          |
| UI5-AI-002    | `## AI Registries`                   | User mentions capability registry, recipe registry, or AI tool selection   |
| UI5-AI-003    | `## AI LLM Integration`              | User mentions LLM providers, agentic test generation, or AI workflows      |
| UI5-VOCAB-001 | `## Vocabulary`                      | User mentions business terms, synonym resolution, or vocabulary lookup     |
| UI5-INT-001   | `## SAP Business Intents`            | User mentions purchase orders, sales orders, invoices, or SAP transactions |
| UI5-FLP-001   | `## FLP Locks`                       | User mentions SM12 lock entries or test isolation locks                    |
| UI5-FLP-002   | `## FLP Settings`                    | User mentions FLP user settings, language, timezone, or date format        |
| UI5-DX-001    | `## Test Data`                       | User mentions generating test data, UUID placeholders, or data persistence |
| UI5-DX-002    | `## CLI`                             | User mentions project setup, init, doctor, or uninstall commands           |
| UI5-DX-003    | `## Reporters`                       | User mentions compliance reports, OData traces, or test run analytics      |
| UI5-DX-004    | `## Error Handling`                  | User encounters an error or asks about error codes and handling            |
| UI5-MIG-001   | `## Type Safety`                     | User asks about branded types, AppId, ControlId, or type-safe strings      |

</details>

---

## Appendix C: Failure → Resolution Quick Reference

For each common failure, the resolution and associated capability. AI agents use this for self-healing.

| Failure                                      | Capability    | Resolution                                                                                                     |
| -------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| Control not rendered yet                     | UI5-LOC-001   | Add `waitForUI5Bootstrap` before control discovery, or increase timeout                                        |
| Ambiguous selector matches multiple controls | UI5-LOC-001   | Add `viewName`, `controlType`, or `ancestor` constraint to narrow scope                                        |
| Timeout waiting for control                  | UI5-LOC-001   | Increase timeout, verify navigation completed, check if control is in a dialog (add `searchOpenDialogs: true`) |
| Bridge not injected                          | UI5-WAIT-001  | Bridge auto-injects on first use; if page navigated, injection resets automatically                            |
| WalkMe interfering with tests                | UI5-WAIT-002  | Verify stability fixture is active; add WalkMe URL pattern to `ignoreAutoWaitUrls` config                      |
| Dialog button not found                      | UI5-DLG-001   | Check button text matches exactly; use `getButtons()` to list available buttons first                          |
| Table has no rows                            | UI5-TBL-001   | Use `waitForData()` or `waitForLoad()` before reading table; verify filter criteria                            |
| OData model path has no data                 | UI5-DATA-001  | Verify the path matches bound entities; use `waitForLoad()` after navigation                                   |
| CSRF token expired                           | UI5-DATA-002  | Fetch a new token via `fetchCSRFToken()` before the write operation                                            |
| Authentication failed                        | UI5-AUTH-001  | Verify credentials; check if strategy matches system type (on-prem vs cloud)                                   |
| SM12_SRV service unavailable                 | UI5-FLP-001   | Activate the SM12_SRV OData service in SAP (transaction `/IWFND/MAINT_SERVICE`)                                |
| UShell Container not available               | UI5-FLP-002   | Ensure page is a Fiori Launchpad app and shell is fully loaded                                                 |
| Intent navigation wrong app                  | UI5-INT-001   | Verify semantic object hash mapping; check FLP catalog configuration                                           |
| Vocabulary term not found                    | UI5-VOCAB-001 | Load the correct domain via `loadDomain()` before searching; check for typos                                   |
| Date format mismatch                         | UI5-DTP-001   | Use `formatDateForUI5()` to convert dates; check FLP user date format settings                                 |
| Footer button not found                      | UI5-ACT-003   | Verify the page is in the correct mode (edit vs display); check button text exactly                            |
