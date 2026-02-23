# Praman v1.0 — Complete Feature Inventory

> **playwright-praman** — AI-First SAP UI5 Test Automation Platform for Playwright
>
> Generated: 2026-02-23 | Source: Full codebase scan of 180+ TypeScript files
>
> Audience: Testers, Node.js Developers, SAP Business Analysts, AI Agents

---

## Core Playwright Extensions

### UI5 Control Discovery

**What it does**
Discovers SAP UI5 controls on a page using a multi-strategy chain (cache, direct-ID, RecordReplay, registry scan) and returns a typed proxy for interaction.

**Why it matters**
Eliminates brittle CSS/XPath selectors by targeting controls through UI5's own object registry — tests survive DOM restructuring, theme changes, and UI5 version upgrades.

**Capabilities**

- Discover single or multiple controls via `UI5Selector` (controlType, id, viewName, properties, bindingPath, i18n text, ancestor/descendant)
- Three discovery tiers: LRU cache (200 entries, 5s TTL) → direct-ID → RecordReplay → full registry scan
- Regex-based ID matching (`id: /partial/`)
- Interaction sub-targeting (e.g., target inner input of SmartField)
- Configurable strategy order via `discoveryStrategies` config
- Optional preference for visible controls over hidden ones

**API**

```ts
import { test, expect } from 'playwright-praman';

test('discover controls', async ({ ui5 }) => {
  // Single control by ID
  const btn = await ui5.control({ id: 'saveBtn' });

  // By type + properties
  const input = await ui5.control({
    controlType: 'sap.m.Input',
    properties: { placeholder: 'Enter vendor' },
    viewName: 'myApp.view.Main',
  });

  // Multiple controls
  const buttons = await ui5.controls({ controlType: 'sap.m.Button' });

  // With binding path
  const field = await ui5.control({
    controlType: 'sap.m.Input',
    bindingPath: { value: '/PurchaseOrder/Vendor' },
  });
});
```

**Target Users:** Tester, Node.js Developer, AI Agent

**Implicit Behaviors**

- Auto-waits for UI5 stability before every discovery
- Caches discovered proxies for repeat lookups (LRU eviction)
- Falls back through strategy chain automatically
- Wraps each call in a Playwright test step for HTML report visibility

**Source Files**

- `src/proxy/discovery.ts`
- `src/proxy/discovery-factory.ts`
- `src/proxy/cache.ts`
- `src/core/types/selectors.ts`

---

### Control Proxy (Typed Method Forwarding)

**What it does**
Wraps every discovered UI5 control in a JavaScript Proxy that routes method calls through Playwright's `page.evaluate()` to the actual browser-side control, with automatic type detection and method blacklisting.

**Why it matters**
Lets testers call any UI5 control method (e.g., `getText()`, `getProperty('value')`, `press()`) directly from Node.js without writing browser-side scripts — while preventing dangerous operations.

**Capabilities**

- Call any public UI5 control method via proxy (e.g., `proxy.getValue()`, `proxy.getItems()`)
- Built-in safe methods: `press()`, `enterText()`, `select()`, `getAggregation()`, `exec()`
- Full control introspection: `getControlMetadata()`, `getControlInfoFull()`, `retrieveMembers()`
- Method blacklist (71 static + 2 dynamic rules) prevents internal/lifecycle calls
- Chainable proxy results — navigate parent/child relationships fluently
- Custom function execution via `exec(fn, ...args)` for edge cases

**API**

```ts
test('proxy methods', async ({ ui5 }) => {
  const control = await ui5.control({ id: 'myInput' });

  // Built-in shortcuts
  await control.press();
  await control.enterText('Hello');

  // Any UI5 getter
  const value = await control.getValue();
  const tooltip = await control.getTooltip();

  // Introspection
  const meta = await control.getControlMetadata();
  const members = await control.retrieveMembers();

  // Custom function execution
  const result = await control.exec((ctrl) => ctrl.getCustomData());
});
```

**Target Users:** Node.js Developer, Tester

**Implicit Behaviors**

- Anti-thenable guard prevents accidental `await` consumption
- Method results auto-detect return type (element, aggregation, primitive, object)
- Blacklisted methods throw `ControlError` with suggestions
- Method forwarder results are cached for repeat calls

**Source Files**

- `src/proxy/control-proxy.ts`
- `src/bridge/method-blacklist.ts`
- `src/bridge/browser-scripts/execute-method.ts`

---

### Three Interaction Strategies

**What it does**
Provides three swappable strategies for how Praman interacts with UI5 controls (click, type, select): UI5-native events, DOM-first events, or OPA5 RecordReplay.

**Why it matters**
Different SAP applications and control types respond to events differently — a strategy that works for a standard Button may not work for a custom composite control. Swappable strategies guarantee reliability across all scenarios.

**Capabilities**

- **UI5NativeStrategy** (default): `firePress()` → `fireSelect()` → `fireTap()` → DOM click fallback
- **DomFirstStrategy**: DOM click first → UI5 event fallback (best for form controls)
- **Opa5Strategy**: Uses SAP RecordReplay API (best for SAP testing standards compliance)
- Configurable globally via `interactionStrategy` config or per-call
- Each strategy has its own enterText and select implementations with fallback chains

**API**

```ts
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  interactionStrategy: 'ui5-native', // or 'dom-first' | 'opa5'
});
```

```ts
test('interact with controls', async ({ ui5 }) => {
  await ui5.click({ id: 'submitBtn' });
  await ui5.fill({ id: 'nameInput' }, 'John Doe');
  await ui5.select({ id: 'countrySelect' }, 'US');
  await ui5.check({ id: 'agreeCheckbox' });
  await ui5.uncheck({ id: 'optionalCheckbox' });
  await ui5.clear({ id: 'searchField' });
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Each strategy has a fallback chain — if primary method fails, secondary is attempted
- `enterText` fires both `liveChange` and `change` events for proper binding update
- `select` handles both key-based and index-based item selection

**Source Files**

- `src/bridge/interaction-strategies/strategy.ts`
- `src/bridge/interaction-strategies/strategy-factory.ts`
- `src/bridge/interaction-strategies/index.ts`

---

### Custom UI5 Selector Engine

**What it does**
Registers a `ui5=` custom selector engine with Playwright, enabling UI5 control selection directly in Playwright locators.

**Why it matters**
Allows mixing Praman selectors with Playwright's native locator API for maximum flexibility.

**Capabilities**

- Auto-registered as a worker-scoped fixture (idempotent)
- Custom selector format: `ui5={"controlType":"sap.m.Button","properties":{"text":"Save"}}`
- Compatible with Playwright's `page.locator()` API

**API**

```ts
test('custom selector engine', async ({ page }) => {
  // Uses the registered ui5= engine
  const locator = page.locator('ui5={"controlType":"sap.m.Button","properties":{"text":"Save"}}');
  await locator.click();
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Registered once per worker process, idempotent
- Registration happens automatically via `selectorRegistration` auto-fixture

**Source Files**

- `src/selectors/ui5-selector-engine.ts`
- `src/selectors/selector-parser.ts`
- `src/fixtures/core-fixtures.ts`

---

### 10 Custom UI5 Matchers

**What it does**
Extends Playwright's `expect()` with 10 UI5-specific assertions that query control state directly from the UI5 runtime.

**Why it matters**
Standard Playwright assertions check DOM state — these matchers check the **UI5 model/control state**, which is the source of truth in SAP applications. A control may appear enabled in the DOM but be disabled in the UI5 model.

**Capabilities**

- `toHaveUI5Text(controlId, expected)` — text property match (string or RegExp)
- `toBeUI5Visible(controlId)` — control visibility
- `toBeUI5Enabled(controlId)` — control enabled state
- `toHaveUI5Property(controlId, propertyName, expected)` — arbitrary property check
- `toHaveUI5ValueState(controlId, state)` — value state (Success, Warning, Error, None)
- `toHaveUI5Binding(controlId, path)` — data binding path check
- `toBeUI5ControlType(controlId, type)` — control type assertion
- `toHaveUI5RowCount(tableId, expected)` — table row count
- `toHaveUI5CellText(tableId, row, column, expected)` — table cell text
- `toHaveUI5SelectedRows(tableId, expected)` — selected row indices

**API**

```ts
test('UI5 assertions', async ({ page }) => {
  await expect(page).toHaveUI5Text('headerTitle', 'Purchase Order');
  await expect(page).toBeUI5Visible('saveBtn');
  await expect(page).toBeUI5Enabled('submitBtn');
  await expect(page).toHaveUI5ValueState('vendorInput', 'Error');
  await expect(page).toHaveUI5Binding('priceField', '/PO/NetAmount');
  await expect(page).toHaveUI5RowCount('poTable', 5);
  await expect(page).toHaveUI5CellText('poTable', 0, 2, 'Active');
  await expect(page).toHaveUI5SelectedRows('poTable', [0, 2]);
});
```

**Target Users:** Tester, SAP Business Analyst, AI Agent

**Implicit Behaviors**

- Auto-registered via `matcherRegistration` worker-scoped auto-fixture
- Each matcher returns structured pass/fail with actual vs expected in HTML report
- Supports RegExp matching for text-based matchers

**Source Files**

- `src/matchers/ui5-matchers.ts`
- `src/matchers/index.ts`
- `src/matchers/types.d.ts`

---

### Branded Type System

**What it does**
Provides compile-time type safety for SAP domain values (control IDs, view names, binding paths, entity sets, semantic objects) via TypeScript branded types.

**Why it matters**
Prevents accidental mixing of string values — e.g., passing a view name where a control ID is expected — catching errors at compile time instead of runtime.

**Capabilities**

- `ControlId` — branded string for UI5 control IDs
- `ViewName` — branded string for UI5 view names
- `BindingPath` — branded string for OData binding paths
- `EntitySetName` — branded string for OData entity sets
- `SemanticObject` — branded string for FLP semantic objects
- Factory functions: `controlId()`, `viewName()`, `bindingPath()`, `entitySetName()`, `semanticObject()`

**API**

```ts
import { controlId, viewName, bindingPath } from 'playwright-praman';

const id = controlId('btnSave');
const view = viewName('myApp.view.Main');
const path = bindingPath('/PurchaseOrder/Vendor');
```

**Target Users:** Node.js Developer

**Implicit Behaviors**

- Zero runtime cost — branded types are erased at compile time
- TypeScript strict mode enforces brand checks at call sites

**Source Files**

- `src/core/types/branded.ts`

---

## SAP UI5 Control Support

### 199 Typed UI5 Control Definitions

**What it does**
Defines TypeScript interfaces for 199 distinct SAP UI5 control types covering all major control categories: input, selection, display, table, list, dialog, form, smart, MDC, container, layout, Fiori semantic, toolbar, navigation, tile/card, tree, and specialized controls.

**Why it matters**
Full type coverage means every control method call is validated at compile time — typos in method names, wrong argument types, and missing properties are caught before tests run.

**Capabilities**

- Input controls: Button, Input, TextArea, SearchField, MaskInput, MultiInput, StepInput, DatePicker, TimePicker, DateRangeSelection, FileUploader, UploadSet
- Selection controls: ComboBox, MultiComboBox, Select, RadioButton, CheckBox, Switch, Slider, SegmentedButton, ToggleButton, MenuButton
- Display controls: Text, Label, Title, Link, Image, Avatar, Icon, FormattedText, ObjectStatus, ObjectNumber, ProgressIndicator, MessageStrip
- Table controls: sap.m.Table, sap.ui.table.Table, TreeTable, AnalyticalTable, SmartTable, mdc.Table
- Dialog controls: Dialog, Popover, ResponsivePopover, MessagePopover, ActionSheet, SelectDialog, TableSelectDialog, BusyDialog, ViewSettingsDialog, ValueHelpDialog, P13nDialog
- Smart controls: SmartField, SmartForm, SmartFilterBar, SmartTable, SmartLink, SmartChart, SmartMultiInput
- MDC controls: mdc.Table, mdc.FilterBar, mdc.Field, mdc.ValueHelp, mdc.Chart
- Fiori semantic: DynamicPage, ObjectPageLayout, FlexibleColumnLayout
- And 100+ more

**API**

```ts
import type { UI5ControlBase } from 'playwright-praman';

// Type-safe control usage
const button = await ui5.control({ controlType: 'sap.m.Button', id: 'save' });
const text = await button.getText(); // TypeScript knows getText() exists
```

**Target Users:** Node.js Developer, AI Agent

**Implicit Behaviors**

- `UI5ControlMap` maps string type names to TypeScript interfaces for generic control access
- Type hierarchy uses intersection types — specialized controls inherit base methods

**Source Files**

- `src/core/types/controls.ts` (5,489 lines)

---

### Table Operations (6 Variants)

**What it does**
Provides a unified API for reading, selecting, filtering, sorting, and exporting data from all 6 SAP UI5 table variants: sap.m.Table, sap.ui.table.Table, TreeTable, AnalyticalTable, SmartTable, and mdc.Table.

**Why it matters**
SAP applications use different table controls depending on the use case — SmartTable for metadata-driven apps, responsive tables for mobile, grid tables for high-density data. This API normalizes all variants into one consistent interface.

**Capabilities**

- Auto-detect table type via `detectType()`
- Read operations: `getRows()`, `getRowCount()`, `getCellValue()`, `getData()`, `getColumnNames()`
- Selection: `selectRow()`, `selectAll()`, `deselectAll()`, `getSelectedRows()`, `selectRowByValues()`
- Search: `findRowByValues()`, `getCellByColumnName()`
- Navigation: `clickRow()`, `ensureRowVisible()` (auto-scroll)
- Editing: `setTableCellValue()`
- Filter/Sort: `filterByColumn()`, `sortByColumn()`, `getFilterValue()`, `getSortOrder()`
- Settings: `clickSettings()` (opens ViewSettingsDialog)
- Export: `exportData()` (CSV/Excel)
- Wait: `waitForData()` (poll until table loads)

**API**

```ts
test('table operations', async ({ ui5 }) => {
  // Detect table type
  const info = await ui5.table.detectType('poTable');

  // Read all rows
  const rows = await ui5.table.getRows('poTable');
  const count = await ui5.table.getRowCount('poTable');

  // Find and select a row
  const rowIndex = await ui5.table.findRowByValues('poTable', { Vendor: '100001' });
  await ui5.table.selectRow('poTable', rowIndex);

  // Filter and sort
  await ui5.table.filterByColumn('poTable', 0, 'Active');
  await ui5.table.sortByColumn('poTable', 1);

  // Export
  await ui5.table.exportData('poTable', { format: 'csv' });
});
```

**Target Users:** Tester, SAP Business Analyst, AI Agent

**Implicit Behaviors**

- Auto-waits for UI5 stability before each operation (stability guard)
- Each method is wrapped in a Playwright test step
- SmartTable detection unwraps to inner table automatically
- `waitForData()` polls until row count > 0

**Source Files**

- `src/modules/table.ts`
- `src/modules/table-operations.ts`
- `src/modules/table-filter-sort.ts`
- `src/modules/table-operations-scripts.ts`

---

### Dialog Management (10 Dialog Types)

**What it does**
Detects, waits for, and interacts with all 10 SAP UI5 dialog/popover types by querying the UI5 static UI area — no hardcoded selectors needed.

**Why it matters**
SAP dialogs render in a special static DOM area outside the normal view tree. Standard Playwright locators cannot reliably find them. Praman queries the UI5 runtime directly.

**Capabilities**

- Wait for any dialog to appear: `waitFor()`
- Enumerate open dialogs: `getOpen()`
- Check dialog state: `isOpen()`
- Smart button matching: `confirm()` finds OK/Yes/Confirm/Save/Accept/Submit automatically
- Dismiss: `dismiss()` finds Cancel/Close/No automatically
- List buttons: `getButtons()` returns text, enabled state, and emphasis
- Wait for close: `waitForClosed()`
- Supports: Dialog, Popover, ResponsivePopover, MessagePopover, ActionSheet, SelectDialog, TableSelectDialog, BusyDialog, ViewSettingsDialog, ValueHelpDialog, P13nDialog

**API**

```ts
test('dialog handling', async ({ ui5 }) => {
  // Wait for any dialog
  await ui5.dialog.waitFor();

  // Get dialog info
  const dialogs = await ui5.dialog.getOpen();
  const buttons = await ui5.dialog.getButtons(dialogs[0].id);

  // Smart confirm (finds OK/Yes/Confirm automatically)
  await ui5.dialog.confirm();

  // Wait for close
  await ui5.dialog.waitForClosed(dialogs[0].id);
});
```

**Target Users:** Tester, AI Agent

**Implicit Behaviors**

- Queries `sap.ui.getCore().getUIArea('sap-ui-static')` for dialog detection
- Smart button matching supports multilingual labels
- Default timeout: 10,000ms

**Source Files**

- `src/modules/dialog.ts`

---

### Date & Time Picker Operations

**What it does**
Provides read/write operations for all SAP UI5 date and time controls: DatePicker, DateTimePicker, DateRangeSelection, and TimePicker.

**Why it matters**
Date controls in UI5 are complex composite controls with locale-dependent formatting. Direct DOM manipulation breaks them. Praman interacts through the UI5 API to respect locale settings.

**Capabilities**

- `setDatePicker()` / `getDatePicker()` — single date
- `setDateRange()` / `getDateRange()` — date range (start + end)
- `setTimePicker()` / `getTimePicker()` — time value
- `setAndValidate()` — set date and verify it was accepted
- `formatDateForUI5()` — convert Date to locale-specific string
- Supports multiple patterns: DD.MM.YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.

**API**

```ts
test('date operations', async ({ ui5 }) => {
  await ui5.date.setDatePicker('startDate', new Date('2026-01-15'));
  const date = await ui5.date.getDatePicker('startDate');

  await ui5.date.setDateRange('dateRange', new Date('2026-01-01'), new Date('2026-01-31'));
  const range = await ui5.date.getDateRange('dateRange');

  await ui5.date.setTimePicker('startTime', '14:30');
  await ui5.date.setAndValidate('deliveryDate', new Date('2026-02-28'));
});
```

**Target Users:** Tester, SAP Business Analyst

**Implicit Behaviors**

- Respects user locale settings from FLP (date format, time format)
- Fires both `change` and `dateChange` events for proper binding updates
- Auto-waits for UI5 stability before each operation

**Source Files**

- `src/modules/date.ts`

---

## UI5 Lifecycle & Synchronization

### Automatic UI5 Stability Wait

**What it does**
Automatically waits for the SAP UI5 framework to report zero pending asynchronous operations (XHR, Promises, bindings) after every page navigation.

**Why it matters**
UI5 applications load data asynchronously — clicking a button may trigger OData requests, model updates, and re-renders. Without stability waiting, tests act on stale UI state and fail intermittently.

**Capabilities**

- Three-tier waiting: `waitForUI5Bootstrap` (60s) → `waitForUI5Stable` (15s) → `briefDOMSettle` (500ms)
- Auto-enabled via `ui5Stability` auto-fixture (no test code needed)
- Configurable timeout via `ui5WaitTimeout` config
- Skippable via `skipStabilityWait: true` for performance-critical paths
- Explicit manual call: `await ui5.waitForUI5()`

**API**

```ts
// Automatic — no code needed, stability wait fires on navigation

// Manual override
test('manual stability', async ({ ui5 }) => {
  await ui5.click({ id: 'triggerLongLoad' });
  await ui5.waitForUI5(30_000); // Custom timeout
});
```

```ts
// Skip for performance
export default defineConfig({
  skipStabilityWait: true, // Use briefDOMSettle instead
});
```

**Target Users:** Tester, Node.js Developer, AI Agent

**Implicit Behaviors**

- All module methods (table, dialog, date, OData) auto-call stability guard before execution
- Navigation functions call `waitForUI5Stable()` after hash change (unless `waitForStable: false`)
- Frame navigation listener filters to main frame only (ignores iframes)
- Failures in auto-stability are non-fatal (fire-and-forget)

**Source Files**

- `src/core/utils/wait-helpers.ts`
- `src/fixtures/stability-fixtures.ts`
- `src/core/utils/constants.ts`

---

### Request Interception (WalkMe/Analytics Blocking)

**What it does**
Automatically blocks third-party analytics and overlay scripts (WalkMe, Google Analytics, Qualtrics, LaunchDarkly) that interfere with UI5 stability detection.

**Why it matters**
WalkMe and analytics scripts inject DOM overlays and async requests that make UI5 report "pending" indefinitely. Blocking these requests eliminates a major source of test flakiness in enterprise SAP systems.

**Capabilities**

- Pre-configured block list: WalkMe (5 domains), Google Analytics, Google Tag Manager, Qualtrics, LaunchDarkly
- Custom patterns via `ignoreAutoWaitUrls` config array
- Uses Playwright's `page.route()` for zero-overhead interception
- Auto-enabled via `requestInterceptor` auto-fixture

**API**

```ts
export default defineConfig({
  ignoreAutoWaitUrls: ['**/my-custom-analytics/**', '**/company-overlay.js'],
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Blocks requests before they reach the network — no latency impact
- Matched routes are aborted silently (no error in browser console)
- Patterns merged with defaults, not replaced

**Source Files**

- `src/fixtures/stability-fixtures.ts`
- `src/core/utils/constants.ts`

---

### UI5 Bootstrap Detection

**What it does**
Waits for the SAP UI5 core library to finish loading and initializing before any test operations.

**Why it matters**
SAP BTP applications can take 30-60 seconds for the initial UI5 library load from CDN. Without bootstrap detection, tests fail with "sap is not defined" errors.

**Capabilities**

- Polls for `window.sap?.ui?.getCore` availability
- 60-second default timeout (configurable)
- Called automatically before first control discovery
- Throws `TimeoutError` with recovery suggestions if UI5 fails to load

**API**

```ts
import { waitForUI5Bootstrap } from 'playwright-praman';

// Usually automatic — called by UI5Handler
// Manual usage for custom scenarios:
await waitForUI5Bootstrap(page, { timeout: 90_000 });
```

**Target Users:** Node.js Developer

**Implicit Behaviors**

- Called once per page, then cached (idempotent)
- Bridge injection waits for bootstrap before executing

**Source Files**

- `src/core/utils/wait-helpers.ts`

---

### Retry with Exponential Backoff

**What it does**
Provides infrastructure-level retry logic with exponential backoff and jitter for operations like config loading, bridge injection, and OTel initialization.

**Why it matters**
Network-dependent initialization (CDN, OData metadata) can transiently fail. Exponential backoff with jitter prevents thundering herd problems in parallel test workers.

**Capabilities**

- Formula: `delay = min(baseDelay * 2^attempt + jitter, maxDelay)`
- Configurable: maxRetries (default 3), baseDelay (100ms), maxDelay (5000ms)
- Jitter enabled by default
- AbortSignal support for cancellation
- Custom retry predicate via `shouldRetry(error)`
- NOT for UI interactions — use Playwright's built-in auto-retry

**API**

```ts
import { retry } from 'playwright-praman';

const data = await retry(() => fetchMetadata(serviceUrl), {
  maxRetries: 5,
  baseDelay: 200,
  shouldRetry: (e) => e.code === 'ECONNREFUSED',
});
```

**Target Users:** Node.js Developer

**Implicit Behaviors**

- Used internally by bridge injection, config loading, telemetry init
- Google SRE-aligned backoff formula

**Source Files**

- `src/core/utils/retry.ts`

---

## Fixtures & Test Abstractions

### Merged Test Object (12 Fixture Modules)

**What it does**
Provides a single `test` object that includes all 12 Praman fixture modules merged via Playwright's `mergeTests()` — users import one object and get everything.

**Why it matters**
SAP test automation requires many cross-cutting concerns (auth, navigation, stability, AI). A single merged fixture tree means zero boilerplate setup and consistent behavior across all tests.

**Capabilities**

- `ui5` — Core control discovery and interaction + `.table`, `.dialog`, `.date`, `.odata` sub-namespaces
- `ui5Navigation` — 9 FLP navigation methods
- `btpWorkZone` — Dual-frame BTP WorkZone manager
- `sapAuth` — SAP authentication (6 strategies)
- `fe` — Fiori Elements helpers (`.listReport`, `.objectPage`, `.table`, `.list`)
- `pramanAI` — AI page discovery, agentic handler, LLM, vocabulary
- `intent` — SAP domain intents (`.procurement`, `.sales`, `.finance`, `.manufacturing`, `.masterData`)
- `ui5Shell` / `ui5Footer` — FLP shell header and footer bar
- `flpLocks` — SM12 lock management with auto-cleanup
- `flpSettings` — FLP user settings reader
- `testData` — Template-based data generation with auto-cleanup
- `pramanConfig` / `pramanLogger` / `rootLogger` / `tracer` — Infrastructure

**API**

```ts
import { test, expect } from 'playwright-praman';

test('full fixture access', async ({
  ui5,
  ui5Navigation,
  sapAuth,
  fe,
  pramanAI,
  intent,
  ui5Shell,
  ui5Footer,
  flpLocks,
  flpSettings,
  testData,
  pramanLogger,
}) => {
  // Everything available via destructuring
});
```

**Target Users:** Tester, Node.js Developer, SAP Business Analyst, AI Agent

**Implicit Behaviors**

- 5 auto-fixtures fire without being requested: `playwrightCompat`, `selectorRegistration`, `matcherRegistration`, `requestInterceptor`, `ui5Stability`
- Worker-scoped fixtures (config, logger, tracer) created once per worker
- Test-scoped fixtures (ui5, navigation, auth) created fresh per test
- Fixtures with cleanup (flpLocks, testData, sapAuth) auto-teardown

**Source Files**

- `src/fixtures/index.ts`
- `src/fixtures/core-fixtures.ts`
- `src/fixtures/module-fixtures.ts`
- `src/fixtures/stability-fixtures.ts`
- `src/fixtures/nav-fixtures.ts`
- `src/fixtures/fe-fixtures.ts`
- `src/fixtures/auth-fixtures.ts`
- `src/fixtures/ai-fixtures.ts`
- `src/fixtures/intent-fixtures.ts`
- `src/fixtures/shell-footer-fixtures.ts`
- `src/fixtures/flp-locks-fixtures.ts`
- `src/fixtures/flp-settings-fixtures.ts`
- `src/fixtures/test-data-fixtures.ts`

---

### SAP Authentication (6 Strategies)

**What it does**
Handles SAP system authentication with 6 pluggable strategies: on-premise basic auth, Cloud SAML/IdP, Office 365 SSO, API key/OAuth bearer, client certificate, and multi-tenant routing.

**Why it matters**
SAP systems use diverse authentication mechanisms depending on deployment (on-premise S/4HANA, BTP Cloud, Azure-hosted). A strategy pattern ensures tests work across all environments without code changes.

**Capabilities**

- **OnPrem**: HTTP basic auth for SAP NetWeaver/S4HANA on-premise
- **Cloud SAML**: BTP SAML IdP flow (IAS, Azure AD)
- **Office365**: Microsoft SSO for SAP connected to Azure
- **API**: API key or OAuth bearer token
- **Certificate**: Client certificate authentication
- **Multi-Tenant**: Tenant-aware routing + delegated auth
- Auto-detection via `detectSystemType(url)` (OnPrem vs Cloud vs Custom)
- Custom strategy registration via `registerAuthStrategy()`
- Auto-logout on test teardown
- Session info tracking (user, sessionId, issuedAt, expiresAt)

**API**

```ts
export default defineConfig({
  auth: {
    strategy: 'cloud-saml',
    baseUrl: 'https://my-btp.launchpad.cfapps.eu10.hana.ondemand.com',
    username: process.env.SAP_USER!,
    password: process.env.SAP_PASS!,
  },
});
```

```ts
test('authenticated test', async ({ sapAuth, page }) => {
  await sapAuth.login(page, sapAuthConfig);
  expect(sapAuth.isAuthenticated()).toBe(true);

  const session = sapAuth.getSessionInfo();
  console.log(session.user, session.expiresAt);
  // Auto-logout on teardown
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Auto-logout on fixture teardown (non-fatal)
- Setup projects pattern: call `login()` in `globalSetup` or auth project
- `isLoginPageVisible()` detects SAP login page automatically

**Source Files**

- `src/auth/auth-factory.ts`
- `src/auth/auth-handler.ts`
- `src/auth/auth-checks.ts`
- `src/auth/strategies/onprem-strategy.ts`
- `src/auth/strategies/cloud-saml-strategy.ts`
- `src/auth/strategies/office365-strategy.ts`
- `src/auth/strategies/api-strategy.ts`
- `src/auth/strategies/certificate-strategy.ts`
- `src/auth/strategies/multi-tenant-strategy.ts`

---

### FLP Navigation (9 Functions)

**What it does**
Provides 9 navigation functions for SAP Fiori Launchpad: app by semantic hash, tile by title, intent-based navigation with parameters, direct hash navigation, home, back, forward, search, and hash reading.

**Why it matters**
FLP navigation uses hash-based routing with semantic objects/actions — standard `page.goto()` doesn't work. These functions use the FLP's own `hasher` API for reliable navigation without full page reloads.

**Capabilities**

- `navigateToApp(appId)` — e.g., `'PurchaseOrder-manage'`
- `navigateToTile(title)` — click FLP tile by visible text
- `navigateToIntent(intent, params)` — semantic object + action + parameters
- `navigateToHash(hash)` — direct hash fragment
- `navigateToHome()` — FLP homepage
- `navigateBack()` / `navigateForward()` — browser history
- `searchAndOpenApp(query)` — shell search bar + open result
- `getCurrentHash()` — read current URL hash

**API**

```ts
test('FLP navigation', async ({ ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5Navigation.navigateToTile('Create Purchase Order');
  await ui5Navigation.navigateToIntent('PurchaseOrder', 'create', { plant: '1000' });
  await ui5Navigation.navigateBack();

  const hash = await ui5Navigation.getCurrentHash();
  expect(hash).toContain('PurchaseOrder');
});
```

**Target Users:** Tester, SAP Business Analyst, AI Agent

**Implicit Behaviors**

- Auto-calls `waitForUI5Stable()` after each navigation (unless `waitForStable: false`)
- Each call wrapped in Playwright test step (e.g., `ui5Navigation.navigateToApp: PO-manage`)
- Uses `window.hasher.setHash()` via `page.evaluate()` — no full page reload

**Source Files**

- `src/modules/navigation.ts`
- `src/fixtures/nav-fixtures.ts`

---

### BTP WorkZone Manager

**What it does**
Manages dual-frame environments in SAP BTP WorkZone, handling the outer shell frame and inner workspace frame transparently.

**Why it matters**
BTP WorkZone renders applications inside nested iframes. Without frame management, Playwright tests target the wrong frame and fail silently.

**Capabilities**

- Frame switching between outer shell and inner workspace
- Adapter pattern for transparent frame targeting
- Child page access for cross-frame operations

**API**

```ts
test('WorkZone multi-frame', async ({ btpWorkZone, page }) => {
  // Manager handles frame context automatically
  const workspace = btpWorkZone.getWorkspaceFrame();
  await workspace.click('#innerButton');
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Automatically detects WorkZone frame structure
- All navigation functions route through correct frame

**Source Files**

- `src/modules/workzone.ts`
- `src/fixtures/nav-fixtures.ts`

---

### FLP Shell & Footer Bar

**What it does**
Provides fixture methods for interacting with the Fiori Launchpad shell header (home, user menu) and page footer bar (Save, Apply, Cancel, Edit, Delete, Create).

**Why it matters**
FLP shell and footer controls are rendered outside the application view — they require specific selectors targeting the shell container. These fixtures abstract the selectors.

**Capabilities**

- **Shell**: `expectShellHeader()`, `clickHome()`, `openUserMenu()`
- **Footer**: `clickSave()`, `clickApply()`, `clickCancel()`, `clickEdit()`, `clickDelete()`, `clickCreate()`

**API**

```ts
test('shell and footer', async ({ ui5Shell, ui5Footer }) => {
  await ui5Shell.expectShellHeader();
  await ui5Footer.clickEdit();
  // ... edit form fields ...
  await ui5Footer.clickSave();
  await ui5Shell.clickHome();
});
```

**Target Users:** Tester, SAP Business Analyst

**Implicit Behaviors**

- Uses stable FLP selectors: `#shell-header`, `#shell-header-logo`, `#meAreaHeaderButton`
- Footer buttons found by SAP standard button text

**Source Files**

- `src/fixtures/shell-footer-fixtures.ts`

---

### FLP Lock Management (SM12)

**What it does**
Queries and releases SAP table lock entries (SM12) via OData service during tests, with automatic cleanup on teardown.

**Why it matters**
SAP enqueue locks prevent concurrent editing. Tests that create or modify business objects acquire locks — if tests fail without cleanup, subsequent test runs are blocked.

**Capabilities**

- `getLockEntries(username?)` — query current locks
- `getNumberOfLockEntries(username?)` — count locks
- `deleteAllLockEntries(username?)` — release all locks for user
- `deleteLockEntry(entry)` — release specific lock
- Auto-cleanup on test teardown

**API**

```ts
test('lock management', async ({ flpLocks }) => {
  const count = await flpLocks.getNumberOfLockEntries('TESTUSER');
  expect(count).toBe(0);

  // ... test that creates locks ...

  // Explicit cleanup (also happens automatically on teardown)
  await flpLocks.deleteAllLockEntries('TESTUSER');
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- OData service: `/sap/opu/odata/sap/SM12_SRV`
- Tracks locks during test, releases in reverse order
- Teardown cleanup is non-fatal (warnings only)

**Source Files**

- `src/fixtures/flp-locks-fixtures.ts`

---

### FLP User Settings Reader

**What it does**
Reads FLP user preferences (language, date format, time format, number format, timezone) from the UShell Container API.

**Why it matters**
SAP date/number formatting depends on user locale settings. Tests must know the user's format to assert values correctly. Hardcoding formats breaks when running across different user profiles.

**Capabilities**

- `getLanguage()` — e.g., 'EN', 'DE'
- `getDateFormat()` — e.g., 'DD.MM.YYYY'
- `getTimeFormat()` — e.g., 'HH:MM:SS'
- `getNumberFormat()` — e.g., '1.234,56'
- `getTimezone()` — e.g., 'UTC'
- `getAllSettings()` — all settings in one object

**API**

```ts
test('locale-aware assertions', async ({ flpSettings, ui5 }) => {
  const { dateFormat, language } = await flpSettings.getAllSettings();
  const dateValue = await ui5.date.getDatePicker('startDate');

  if (dateFormat === 'DD.MM.YYYY') {
    expect(dateValue).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  }
});
```

**Target Users:** Tester, SAP Business Analyst

**Implicit Behaviors**

- Reads from `sap.ushell.Container.getUser()` via `page.evaluate()`
- Stateless — no teardown needed
- Available immediately after FLP load

**Source Files**

- `src/fixtures/flp-settings-fixtures.ts`

---

### Test Data Generation & Persistence

**What it does**
Generates test data from templates with placeholder substitution (UUID, timestamps), persists data as JSON files, and auto-cleans up on teardown.

**Why it matters**
SAP test data often requires unique identifiers (document numbers, vendor codes) per test run. Template-based generation ensures uniqueness while cleanup prevents test data accumulation.

**Capabilities**

- `generate(template)` — deep clone with `{{uuid}}` and `{{timestamp}}` substitution
- `save(filename, data)` — persist as JSON file
- `load(filename)` — load previously saved data
- `cleanup()` — auto-delete all tracked files on teardown

**API**

```ts
test('test data', async ({ testData }) => {
  const po = testData.generate({
    documentNumber: '{{uuid}}',
    createdAt: '{{timestamp}}',
    vendor: '100001',
    items: [{ material: 'MAT-{{uuid}}', quantity: 10 }],
  });

  await testData.save('po-input.json', po);
  const loaded = await testData.load<typeof po>('po-input.json');
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Each `{{uuid}}` occurrence generates a unique value
- `{{timestamp}}` uses ISO-8601 at generation time
- Placeholder substitution is recursive (nested objects/arrays)
- Auto-cleanup on test teardown

**Source Files**

- `src/fixtures/test-data-fixtures.ts`

---

## OData / API Automation

### OData Model Access (Browser-Side)

**What it does**
Reads data directly from UI5 OData models in the browser, bypassing UI controls entirely — useful for asserting backend state or reading hidden model properties.

**Why it matters**
Some data in SAP applications is in the model but not displayed on screen (calculated fields, pending changes, metadata). Model access lets tests verify the full data state.

**Capabilities**

- `getModelData(path)` — read data at any model path
- `getModelProperty(path)` — read single property
- `getEntityCount(entitySet)` — count entities in set
- `waitForODataLoad(path)` — poll until data is available
- `hasPendingChanges()` — check for unsaved model changes
- `fetchCSRFToken(serviceUrl)` — get CSRF token for write operations
- Named model support via `modelName` parameter

**API**

```ts
test('model access', async ({ ui5 }) => {
  const data = await ui5.odata.getModelData('/PurchaseOrders');
  const vendor = await ui5.odata.getModelProperty('/PurchaseOrders(0)/Vendor');
  const count = await ui5.odata.getEntityCount('/PurchaseOrders');
  const dirty = await ui5.odata.hasPendingChanges();
  const token = await ui5.odata.fetchCSRFToken('/sap/opu/odata/sap/API_PO_SRV');
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Queries component model first, falls back to default model
- `waitForODataLoad()` polls at 100ms intervals, default 15s timeout

**Source Files**

- `src/modules/odata.ts`

---

### OData HTTP CRUD Operations

**What it does**
Performs direct HTTP-level OData operations (query, create, update, delete, function import) using Playwright's request context, with CSRF token management.

**Why it matters**
Sometimes tests need to set up or tear down backend data without going through the UI — seeding test data, cleaning up after tests, or verifying server-side state via direct API calls.

**Capabilities**

- `queryEntities(entitySet, options)` — GET with $filter, $select, $expand, $orderby, $top, $skip
- `createEntity(entitySet, data)` — POST with auto CSRF
- `updateEntity(entitySet, key, data)` — PATCH with auto CSRF
- `deleteEntity(entitySet, key)` — DELETE with auto CSRF
- `callFunctionImport(functionName, params)` — OData function import
- ETag support for optimistic concurrency
- Custom headers per request

**API**

```ts
test('OData HTTP operations', async ({ ui5 }) => {
  // Query with filters
  const orders = await ui5.odata.queryEntities('/sap/opu/odata/sap/API_PO_SRV', 'PurchaseOrders', {
    filter: "Status eq 'A'",
    top: 10,
    select: 'PONumber,Vendor,Amount',
  });

  // Create entity
  await ui5.odata.createEntity('/sap/opu/odata/sap/API_PO_SRV', 'PurchaseOrders', {
    Vendor: '100001',
    Material: 'MAT-001',
  });

  // Call function import
  await ui5.odata.callFunctionImport('/sap/opu/odata/sap/API_PO_SRV', 'ApprovePO', {
    PONumber: '4500000001',
  });
});
```

**Target Users:** Node.js Developer, Tester

**Implicit Behaviors**

- CSRF token auto-fetched before write operations
- ETag returned from responses for subsequent updates
- Request context uses authenticated session from `sapAuth`

**Source Files**

- `src/modules/odata-http.ts`

---

## AI & Agent Enablement

### Page Discovery (AI-Powered Control Scan)

**What it does**
Scans the current page to discover all UI5 controls, categorizes them (interactive, container, navigation), and returns a structured `PageContext` that AI agents can use to understand the page.

**Why it matters**
AI agents need to "see" the page before they can generate test steps. Page discovery provides a structured snapshot that replaces visual screenshots with semantically rich control metadata.

**Capabilities**

- `discoverPage(options)` — enumerate all UI5 controls on page
- `buildContext()` — enriched context with UI5 version info
- Control categorization: interactive, container, navigation, display
- Filter options: `interactiveOnly`, `includeHidden`, `limit`, `offset`
- Returns: `PageContext` with controls[], formFields[], buttons[], tables[], navigationElements[]

**API**

```ts
import { test } from 'playwright-praman';

test('AI page discovery', async ({ pramanAI }) => {
  const context = await pramanAI.discoverPage({ interactiveOnly: true });
  if (context.status === 'success') {
    console.log(`Found ${context.data.controls.length} controls`);
    console.log(`Forms: ${context.data.formFields.length}`);
    console.log(`Buttons: ${context.data.buttons.length}`);
    console.log(`Tables: ${context.data.tables.length}`);
  }
});
```

**Target Users:** AI Agent, Node.js Developer

**Implicit Behaviors**

- Uses `sap.ui.core.ElementRegistry` for exhaustive enumeration
- All helper functions inlined for `page.evaluate()` serialization
- Returns `AiResponse<PageContext>` discriminated union (success | error | partial)

**Source Files**

- `src/ai/bulk-discovery.ts`
- `src/ai/context-builder.ts`

---

### Capability Registry (AI Prompt Templates)

**What it does**
A queryable registry of all Praman API capabilities with metadata for AI prompt engineering — each entry includes intent, description, usage example, SAP module, and target audience.

**Why it matters**
AI agents need to know what Praman can do before they can generate test code. The capability registry serves as a machine-readable API catalog that agents include in their system prompts.

**Capabilities**

- `list()` — all capabilities
- `byCategory(category)` — filter by logical group
- `listByPriority(priority)` — filter by tier (fixture, namespace, implementation)
- `find(query)`, `findByName(name)`, `has(name)` — search
- `forAI()` — optimized JSON for AI context windows
- `forProvider(provider)` — format for Claude/OpenAI/Gemini
- `getStatistics()` — registry stats (total methods, categories, breakdowns)
- `toJSON()` — full export

**API**

```ts
import { capabilities } from 'playwright-praman';
// or: import { CapabilityRegistry, capabilities } from 'playwright-praman/ai';

// For AI system prompt
const aiContext = capabilities.forAI();

// Search
const tableCaps = capabilities.byCategory('table');
const navCaps = capabilities.find('navigation');

// Stats
const stats = capabilities.getStatistics();
```

**Target Users:** AI Agent, Node.js Developer

**Implicit Behaviors**

- Generated at build time from source code annotations
- Registry is immutable at runtime

**Source Files**

- `src/ai/capability-registry.ts`
- `src/ai/capability-registry.generated.ts`
- `src/ai/capabilities.ts`

---

### Recipe Registry (Test Pattern Library)

**What it does**
A queryable library of reusable test recipes — complete code snippets for common SAP testing scenarios, organized by category, audience role, and priority.

**Why it matters**
AI agents and new testers need examples of how to test SAP patterns (list report search, object page edit-save, dialog confirmation). Recipes provide ready-to-use patterns instead of requiring every test to be written from scratch.

**Capabilities**

- `select(filter)` — query by category, role, priority
- `selectByRole(role)` — filter for 'ai-agent' | 'human-tester' | 'both'
- `selectByCategory(category)`, `selectByPriority(priority)`
- `search(query)` — text search across title, description, tags
- `forAI()` — AI-optimized export
- `getTopRecipes(n)` — top N recipes
- Each recipe includes: title, description, code, tags, priority

**API**

```ts
import { recipes } from 'playwright-praman';
// or: import { RecipeRegistry, recipes } from 'playwright-praman/ai';

const aiRecipes = recipes.selectByRole('ai-agent');
const tableRecipes = recipes.selectByCategory('table');
const allForAI = recipes.forAI();
```

**Target Users:** AI Agent, Tester

**Implicit Behaviors**

- Generated at build time from annotated source examples
- Priority tiers: essential, recommended, advanced, deprecated

**Source Files**

- `src/ai/recipe-registry.ts`
- `src/ai/recipe-registry.generated.ts`
- `src/ai/recipes.ts`

---

### Agentic Handler (Autonomous Test Generation)

**What it does**
An AI-powered orchestrator that generates complete test code from natural language descriptions, interprets individual test steps, suggests next actions, and supports checkpoint-based session resumability.

**Why it matters**
Enables AI agents (Claude, Copilot, Cursor) to autonomously write and refine SAP UI5 tests without human intervention — the agent describes what to test, and the handler produces executable Playwright code.

**Capabilities**

- `generateTest(scenario, page)` — two-phase: generate steps + generate code from page context
- `interpretStep(description)` — parse English step → capability mapping
- `suggestActions(pageContext)` — recommend next test actions based on page state
- `saveCheckpoint(checkpoint)` / `resumeFromCheckpoint(id)` — session persistence
- Output includes: steps[], code (TypeScript), metadata (model, tokens, duration, capabilities)

**API**

```ts
test('agentic test generation', async ({ pramanAI, page }) => {
  const result = await pramanAI.agentic.generateTest(
    'Create a purchase order for vendor 100001 with material MAT-001',
    page,
  );

  if (result.status === 'success') {
    console.log(result.data.steps); // ['Navigate to ME21N', 'Fill vendor', ...]
    console.log(result.data.code); // Full TypeScript test code
  }

  // Suggest next actions
  const context = await pramanAI.buildContext();
  if (context.status === 'success') {
    const suggestions = await pramanAI.agentic.suggestActions(context.data);
  }
});
```

**Target Users:** AI Agent

**Implicit Behaviors**

- System prompt includes capability registry + recipe registry
- Page context discovery runs before generation
- Checkpoint supports session resumability across test runs
- All responses wrapped in `AiResponse` envelope

**Source Files**

- `src/ai/agentic-handler.ts`
- `src/fixtures/ai-fixtures.ts`

---

### LLM Service Abstraction

**What it does**
A provider-agnostic interface for calling large language models (Claude, OpenAI, Azure OpenAI) with structured output validation via Zod schemas.

**Why it matters**
Decouples test generation logic from specific LLM providers — teams can switch between Claude, OpenAI, or Azure without changing test code.

**Capabilities**

- `complete(prompt, schema)` — single prompt with Zod-validated output
- `chat(messages, schema)` — multi-turn conversation
- `isConfigured()` — check if provider is available
- Providers: `'claude'`, `'openai'`, `'azure-openai'`
- Dynamic imports of optional dependencies (openai, @anthropic-ai/sdk)

**API**

```ts
export default defineConfig({
  ai: {
    provider: 'claude',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    model: 'claude-sonnet-4-6',
    maxTokens: 4096,
  },
});
```

```ts
import { createLlmService } from 'playwright-praman/ai';

const llm = createLlmService(config);
const response = await llm.complete('Generate a test for vendor creation');
```

**Target Users:** AI Agent, Node.js Developer

**Implicit Behaviors**

- Optional dependencies loaded dynamically — no error if not installed
- All responses include token usage metadata
- Throws `AIError` with `ERR_AI_NOT_CONFIGURED` if provider missing

**Source Files**

- `src/ai/llm-service.ts`
- `src/ai/llm-providers.ts`

---

### Vocabulary Service (Business Term Resolution)

**What it does**
Resolves SAP business terms (e.g., "vendor field", "purchase order number") to UI5 control selectors using fuzzy matching across 6 SAP domains.

**Why it matters**
Business analysts describe tests in domain language ("fill the vendor field"), not technical selectors. The vocabulary service bridges this gap by mapping business terms to UI5 control selectors automatically.

**Capabilities**

- `search(query, domain?)` — fuzzy match with confidence scoring
- `getFieldSelector(term, domain?)` — resolve to UI5 selector (0.85 high-confidence, 0.7 ambiguous threshold)
- `getSuggestions(partial, maxResults?)` — autocomplete
- `loadDomain(domain)` — lazy-load domain vocabulary
- 6 domains: procurement, sales, finance, manufacturing, warehouse, quality
- Fuzzy matching via Levenshtein distance and soundex

**API**

```ts
import { createVocabularyService } from 'playwright-praman/vocabulary';

const vocab = createVocabularyService();
await vocab.loadDomain('procurement');

const results = await vocab.search('vendor number');
// → [{ term: 'Vendor', confidence: 0.92, selector: { ... } }]

const selector = await vocab.getFieldSelector('vendor number', 'procurement');
// → { controlType: 'sap.m.Input', properties: { label: 'Vendor' } }
```

**Target Users:** AI Agent, SAP Business Analyst

**Implicit Behaviors**

- Lazy domain loading — only loaded when needed
- In-memory caching of loaded domains
- Stats tracking: cache hits/misses, total terms

**Source Files**

- `src/vocabulary/vocabulary-service.ts`
- `src/vocabulary/vocabulary-matcher.ts`
- `src/vocabulary/vocabulary-loader.ts`
- `src/vocabulary/types.ts`

---

## Configuration & Extensibility

### Typed Configuration System

**What it does**
Provides a Zod-validated, environment-variable-aware configuration system with frozen (immutable) output — supporting auth, AI, telemetry, selectors, and OPA5 sub-schemas.

**Why it matters**
Configuration errors in SAP test automation (wrong timeout, missing auth, invalid provider) cause cryptic runtime failures. Schema validation catches them at startup with actionable error messages.

**Capabilities**

- `defineConfig(input)` — type-safe config helper for `praman.config.ts`
- `loadConfig(options?)` — load, validate, merge env vars, freeze
- **Top-level**: logLevel, ui5WaitTimeout, controlDiscoveryTimeout, interactionStrategy, discoveryStrategies, skipStabilityWait, preferVisibleControls, ignoreAutoWaitUrls
- **Auth sub-schema**: strategy, baseUrl, username, password, client, language
- **AI sub-schema**: provider, apiKey, model, temperature, maxTokens, endpoint
- **Telemetry sub-schema**: openTelemetry, exporter, endpoint, serviceName
- **Selectors sub-schema**: defaultTimeout, preferVisibleControls, skipStabilityWait
- **OPA5 sub-schema**: interactionTimeout, autoWait, debug
- Environment variable overrides: `PRAMAN_LOG_LEVEL`, `PRAMAN_UI5_WAIT_TIMEOUT`, etc.
- Precedence: per-call options > selectors config > top-level config > env vars > defaults

**API**

```ts
// praman.config.ts
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  logLevel: 'debug',
  ui5WaitTimeout: 45_000,
  interactionStrategy: 'ui5-native',
  discoveryStrategies: ['direct-id', 'recordreplay'],
  auth: {
    strategy: 'cloud-saml',
    baseUrl: process.env.SAP_URL!,
    username: process.env.SAP_USER!,
    password: process.env.SAP_PASS!,
  },
  ai: {
    provider: 'claude',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  },
  telemetry: {
    openTelemetry: true,
    exporter: 'otlp',
    endpoint: 'http://localhost:4318',
  },
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Config is deeply frozen (`Readonly<PramanConfig>`) — mutation throws at runtime
- Zod validation runs at load time — invalid config fails fast with clear messages
- Worker-scoped in fixtures — loaded once per Playwright worker

**Source Files**

- `src/core/config/schema.ts`
- `src/core/config/loader.ts`
- `src/core/config/index.ts`

---

### 14 Typed Error Classes (56 Error Codes)

**What it does**
Provides a hierarchy of 14 error classes with 56 machine-readable error codes, each including attempted operation, retryable flag, severity, recovery suggestions, and AI context serialization.

**Why it matters**
SAP test failures are complex — a "control not found" error could mean the page hasn't loaded, the ID changed, or the view isn't active. Rich error context with suggestions dramatically reduces debugging time for both humans and AI agents.

**Capabilities**

- Base class: `PramanError` with code, attempted, retryable, severity, suggestions[], details, timestamp
- Subclasses: AIError, AuthError, BridgeError, ConfigError, ControlError, FLPError, IntentError, NavigationError, ODataError, PluginError, SelectorError, TimeoutError, VocabularyError
- Serialization: `toJSON()` for logging, `toUserMessage()` for humans, `toAIContext()` for agents
- Error codes grouped by domain: Config (3), Bridge (5), Control (8), Auth (4), Navigation (3), OData (3), Selector (3), Timeout (3), AI (9), Plugin (3), Vocabulary (4), Intent (4), FLP (5)

**API**

```ts
import { ControlError, ErrorCode } from 'playwright-praman';

try {
  await ui5.control({ id: 'nonExistent' });
} catch (error) {
  if (error instanceof ControlError) {
    console.log(error.code); // 'ERR_CONTROL_NOT_FOUND'
    console.log(error.retryable); // true
    console.log(error.suggestions); // ['Verify the control ID...', ...]
    console.log(error.toAIContext()); // Machine-readable context
  }
}
```

**Target Users:** Node.js Developer, AI Agent

**Implicit Behaviors**

- All errors include ISO-8601 timestamp
- `retryable` flag enables programmatic retry decisions
- `suggestions[]` provides 2-4 actionable recovery steps per error
- `toAIContext()` formats error for LLM consumption

**Source Files**

- `src/core/errors/base.ts`
- `src/core/errors/codes.ts`
- `src/core/errors/ai-error.ts`
- `src/core/errors/auth-error.ts`
- `src/core/errors/bridge-error.ts`
- `src/core/errors/config-error.ts`
- `src/core/errors/control-error.ts`
- `src/core/errors/flp-error.ts`
- `src/core/errors/intent-error.ts`
- `src/core/errors/navigation-error.ts`
- `src/core/errors/odata-error.ts`
- `src/core/errors/plugin-error.ts`
- `src/core/errors/selector-error.ts`
- `src/core/errors/timeout-error.ts`
- `src/core/errors/vocabulary-error.ts`

---

### Structured Logging with Secret Redaction

**What it does**
Provides pino-based structured logging with automatic secret redaction (passwords, API keys, tokens) and test-scoped child loggers.

**Why it matters**
SAP test logs often contain sensitive credentials in error payloads. Automatic redaction prevents secrets from leaking into CI logs, HTML reports, or shared artifacts.

**Capabilities**

- Root logger with configurable log level (error, warn, info, debug, verbose)
- Pre-configured redaction paths: password, apiKey, token, secret, authorization, etc.
- Custom redaction paths via `createRedactConfig()`
- Test-scoped child loggers (scoped to current test title)
- Singleton pattern with `resetDefaultLogger()` for testing

**API**

```ts
test('logging', async ({ pramanLogger }) => {
  pramanLogger.info('Navigating to app');
  pramanLogger.debug({ vendor: '100001' }, 'Filling vendor field');
  pramanLogger.error({ error }, 'Failed to create PO');
  // Secrets in log objects are automatically redacted to '[REDACTED]'
});
```

**Target Users:** Node.js Developer, Tester

**Implicit Behaviors**

- `rootLogger` is worker-scoped (shared across tests in same worker)
- `pramanLogger` is test-scoped (includes test title as context)
- Redaction happens at serialization time — no performance impact on log calls that aren't emitted

**Source Files**

- `src/core/logging/logger.ts`
- `src/core/logging/index.ts`

---

### OpenTelemetry Integration

**What it does**
Optional distributed tracing via OpenTelemetry — creates spans for control discovery, interaction, navigation, and OData operations.

**Why it matters**
Enables teams to visualize test execution timelines in tools like Jaeger or Azure Monitor, identifying performance bottlenecks and flaky operation patterns.

**Capabilities**

- Optional — no overhead if not configured
- Exporters: OTLP, Azure Monitor, Jaeger
- Span creation for all major operations
- Context propagation across async boundaries
- NoOp tracer in Phase 1 (ready for activation)

**API**

```ts
export default defineConfig({
  telemetry: {
    openTelemetry: true,
    exporter: 'otlp',
    endpoint: 'http://localhost:4318',
    serviceName: 'sap-e2e-tests',
  },
});
```

**Target Users:** Node.js Developer

**Implicit Behaviors**

- `tracer` fixture provides NoOp wrapper when telemetry is disabled
- Spans auto-closed on operation completion

**Source Files**

- `src/core/telemetry/otel.ts`
- `src/core/telemetry/spans.ts`
- `src/core/telemetry/index.ts`

---

### Playwright Step Decoration

**What it does**
Automatically wraps all Praman operations in Playwright `test.step()` calls, creating a rich execution timeline in the HTML report and trace viewer.

**Why it matters**
Without step decoration, test reports show a flat list of browser actions. With it, reports show named operations like "ui5.table.getRows: poTable" — making failures easy to locate and understand.

**Capabilities**

- `@ui5Step` decorator — auto-wraps class methods
- `withStep(name, fn)` — manual step wrapping
- 30+ action name mappings (click → 'Click', waitForUI5 → 'Wait for UI5', etc.)
- Graceful degradation: works as no-op outside Playwright test context (Vitest, scripts)
- Nesting support for composite operations

**API**

```ts
// Automatic — all fixture methods are already decorated
test('step visibility', async ({ ui5 }) => {
  // Each call appears as a named step in HTML report:
  // "UI5Handler > click: id: submitBtn"
  await ui5.click({ id: 'submitBtn' });

  // "ui5.table.getRows: poTable"
  const rows = await ui5.table.getRows('poTable');
});
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- All handler public methods auto-decorated
- Step names include class name + method + first argument
- `isInsideTestContext()` detects test runner environment

**Source Files**

- `src/core/utils/step-decorator.ts`

---

## User-Visible Utilities

### Fiori Elements Helpers (List Report + Object Page)

**What it does**
Provides dedicated APIs for the two most common SAP Fiori Elements page types: List Report (search/filter/table) and Object Page (header/sections/edit-save), plus FE table and list helpers.

**Why it matters**
Fiori Elements applications follow strict page patterns — writing tests with generic control selectors is verbose and fragile. FE helpers encode the patterns so tests read like business workflows.

**Capabilities**

- **List Report**: `getTable()`, `getFilterBar()`, `setFilter()`, `search()`, `clearFilters()`, `navigateToItem()`, `getVariants()`, `selectVariant()`, `getFilterValue()`
- **Object Page**: `navigateToSection()`, `getSectionData()`, `clickButton()`, `clickEdit()`, `clickSave()`, `getSections()`, `getHeaderTitle()`, `isInEditMode()`, `getObjectPageLayout()`
- **FE Table**: `getRowCount()`, `getCellValue()`, `findRow()`, `clickRow()`, `getColumnNames()`
- **FE List**: `getItemCount()`, `getItemTitle()`, `findItemByTitle()`, `clickItem()`, `selectItem()`
- **FE Test Library**: `initializeFETestLibrary()` for SAP's official FE testing API

**API**

```ts
test('Fiori Elements list report → object page', async ({ fe }) => {
  // List Report operations
  await fe.listReport.setFilter('Status', 'Active');
  await fe.listReport.search();
  const table = await fe.listReport.getTable();
  await fe.listReport.navigateToItem(0);

  // Object Page operations
  const title = await fe.objectPage.getHeaderTitle();
  await fe.objectPage.clickEdit();
  await fe.objectPage.navigateToSection('Items');
  const sectionData = await fe.objectPage.getSectionData('Items');
  await fe.objectPage.clickSave();
});
```

**Target Users:** Tester, SAP Business Analyst, AI Agent

**Implicit Behaviors**

- FE helpers auto-resolve FE-specific control IDs
- List Report table detection handles SmartTable wrapper
- Object Page section navigation uses anchor bar

**Source Files**

- `src/fe/list-report.ts`
- `src/fe/object-page.ts`
- `src/fe/fe-table-helpers.ts`
- `src/fe/fe-list-helpers.ts`
- `src/fe/fe-test-library.ts`
- `src/fe/types.ts`
- `src/fe/index.ts`

---

### SAP Domain Intents (5 Domains, 20+ Operations)

**What it does**
Provides high-level, business-language functions for common SAP transactions organized by module: Procurement (MM), Sales (SD), Finance (FI), Manufacturing (PP), and Master Data (MD).

**Why it matters**
SAP business analysts think in transactions (ME21N, VA01, FB50), not UI5 control IDs. Domain intents let analysts write tests in language they understand while the framework handles the UI automation.

**Capabilities**

- **Procurement**: `createPurchaseOrder()`, `approvePurchaseOrder()`, `searchPurchaseOrders()`, `createPurchaseRequisition()`, `confirmGoodsReceipt()`, `searchVendors()`
- **Sales**: `createSalesOrder()`, `createQuotation()`, `approveQuotation()`, `searchSalesOrders()`, `searchCustomers()`, `checkDeliveryStatus()`
- **Finance**: `createJournalEntry()`, `postVendorInvoice()`, `processPayment()`
- **Manufacturing**: `createProductionOrder()`, `confirmProductionOrder()`
- **Master Data**: `createVendorMaster()`, `createCustomerMaster()`, `createMaterialMaster()`
- Core wrappers: `fillField()`, `clickButton()`, `selectOption()`, `assertField()`, `confirmAndWait()`, `waitForSave()`

**API**

```ts
test('create purchase order', async ({ intent }) => {
  const result = await intent.procurement.createPurchaseOrder({
    vendor: '100001',
    material: 'MAT-001',
    quantity: 10,
    plant: '1000',
  });
  expect(result.status).toBe('success');
});

test('post vendor invoice', async ({ intent }) => {
  await intent.finance.postVendorInvoice({
    vendor: '100001',
    invoiceDate: new Date(),
    amount: 5000,
    currency: 'EUR',
    poNumber: '4500000001',
  });
});

test('create material master', async ({ intent }) => {
  await intent.masterData.createMaterialMaster({
    materialNumber: 'MAT-NEW-001',
    description: 'Test Material',
    materialType: 'FERT',
    baseUnit: 'EA',
  });
});
```

**Target Users:** SAP Business Analyst, Tester, AI Agent

**Implicit Behaviors**

- Vocabulary domains preloaded before intent execution
- Navigation to correct SAP transaction automatic (unless `skipNavigation: true`)
- Each intent returns `IntentResult<T>` with status, data, error, metadata
- Field labels resolved via vocabulary service

**Source Files**

- `src/intents/domains/procurement.ts`
- `src/intents/domains/sales.ts`
- `src/intents/domains/finance.ts`
- `src/intents/domains/manufacturing.ts`
- `src/intents/domains/master-data.ts`
- `src/intents/core-wrappers.ts`
- `src/intents/types.ts`
- `src/intents/index.ts`

---

### Compliance Reporter

**What it does**
A Playwright reporter that tracks whether test steps use Praman abstractions versus raw Playwright calls, generating a compliance report with per-test and aggregate statistics.

**Why it matters**
Teams adopting Praman need to measure migration progress. The compliance reporter shows which tests still use raw `page.click()` instead of `ui5.click()`, enabling targeted migration efforts.

**Capabilities**

- Per-test status: compliant, raw-playwright, or mixed
- Step categorization: recognizes 50+ Praman step prefixes
- Aggregate metrics: compliance percentage, total/compliant/raw counts
- Output: `compliance-report.json`
- `isPramanStep()` utility for custom analysis

**API**

```ts
// playwright.config.ts
import { ComplianceReporter } from 'playwright-praman/reporters';

export default {
  reporter: [['html'], [ComplianceReporter, { outputDir: 'reports' }]],
};
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Runs as a standard Playwright reporter (no test code changes needed)
- Outputs JSON alongside Playwright's native reports

**Source Files**

- `src/reporters/compliance-reporter.ts`

---

### OData Trace Reporter

**What it does**
A Playwright reporter that captures and aggregates OData HTTP request traces from test runs, providing per-entity-set statistics (call counts, durations, error rates).

**Why it matters**
SAP performance issues often stem from excessive OData calls. The trace reporter identifies which entity sets are called most frequently, which are slowest, and where errors occur.

**Capabilities**

- Capture per-request: method, URL, entity set, query params, status, duration, size, batch flag
- Aggregate per-entity-set: total calls by method, avg/max duration, error count
- URL parsing: `extractEntitySet()`, `parseODataQueryParams()`
- Output: `odata-trace.json`

**API**

```ts
// playwright.config.ts
import { ODataTraceReporter } from 'playwright-praman/reporters';

export default {
  reporter: [['html'], [ODataTraceReporter, { outputDir: 'reports' }]],
};
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- Reads OData data from test attachments
- Parses standard OData URL patterns ($filter, $expand, $top, etc.)

**Source Files**

- `src/reporters/odata-trace-reporter.ts`

---

### CLI Tools (init, doctor, uninstall)

**What it does**
Provides three command-line tools for project scaffolding, environment diagnostics, and cleanup.

**Why it matters**
Getting started with SAP test automation requires specific configuration (config files, auth setup, fixture imports). The CLI automates scaffolding and validates the environment before first test run.

**Capabilities**

- `npx playwright-praman init` — scaffold config files, fixture imports, sample tests
- `npx playwright-praman doctor` — check Node.js, npm, Playwright, UI5 versions + connectivity
- `npx playwright-praman uninstall` — remove scaffolded files
- IDE detection (VS Code, IntelliJ, Cursor)
- Config validation before scaffolding

**API**

```bash
# Scaffold a new project
npx playwright-praman init

# Check environment
npx playwright-praman doctor

# Remove scaffolded files
npx playwright-praman uninstall

# Version
npx playwright-praman --version
```

**Target Users:** Tester, Node.js Developer

**Implicit Behaviors**

- `init` detects existing config and skips already-scaffolded files
- `doctor` exits with non-zero code on failures (CI-friendly)
- IDE-specific config files generated based on detected IDE

**Source Files**

- `src/cli/index.ts`
- `src/cli/init.ts`
- `src/cli/doctor.ts`
- `src/cli/uninstall.ts`
- `src/cli/scaffolder.ts`
- `src/cli/validator.ts`
- `src/cli/ide-detector.ts`

---

### Version Utilities

**What it does**
Provides semantic version parsing, comparison, and range checking for UI5 framework version compatibility.

**Why it matters**
Praman features depend on UI5 version (e.g., RecordReplay requires >= 1.94). Version utilities enable runtime feature detection without hardcoded version checks.

**Capabilities**

- `parseSemVer(version)` — parse "1.120.0" to structured object
- `compareSemVer(v1, v2)` — compare two versions (-1, 0, 1)
- `isAtLeast(version, minimum)` — minimum version check
- `satisfiesRange(version, range)` — range check (^1.2.0)

**API**

```ts
import { isAtLeast } from 'playwright-praman';

if (isAtLeast(ui5Version, '1.94.0')) {
  // Use RecordReplay API
} else {
  // Fall back to registry scan
}
```

**Target Users:** Node.js Developer

**Implicit Behaviors**

- Used internally by discovery strategy selection
- Used by `playwrightCompat` fixture for Playwright version features

**Source Files**

- `src/core/utils/version-compare.ts`
- `src/core/compat/path-helpers.ts`

---

## Summary Statistics

| Metric                       | Count |
| ---------------------------- | ----- |
| **Total Public Functions**   | 120+  |
| **Total Public Types**       | 100+  |
| **Total Public Classes**     | 15+   |
| **Total Error Codes**        | 56    |
| **Error Classes**            | 14    |
| **Fixture Modules**          | 12    |
| **Custom Matchers**          | 10    |
| **Navigation Functions**     | 9     |
| **UI5 Control Types**        | 199   |
| **Table Variants Supported** | 6     |
| **Dialog Types Supported**   | 10+   |
| **Auth Strategies**          | 6     |
| **SAP Business Domains**     | 5     |
| **Domain Intent Functions**  | 20+   |
| **Vocabulary Domains**       | 6     |
| **Sub-Path Exports**         | 6     |
| **CLI Commands**             | 3     |
| **Reporters**                | 2     |
| **Interaction Strategies**   | 3     |
| **Discovery Strategies**     | 3     |
| **LLM Providers**            | 3     |
| **Source Files**             | 180+  |
