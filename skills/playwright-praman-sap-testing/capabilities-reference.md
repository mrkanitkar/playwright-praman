# Praman Capabilities Reference

> **Generated**: 2026-02-25 — do not edit manually, run `npm run generate:skill-md`
> **Total**: 165 capabilities across 14 categories

---

## Ui5

| Capability       | Function       | Description                                        | SAP Module |
| ---------------- | -------------- | -------------------------------------------------- | ---------- |
| `ui5.control`    | `control()`    | Discovers a single control matching the selector.  | All        |
| `ui5.controls`   | `controls()`   | Discovers multiple controls matching the selector. | All        |
| `ui5.click`      | `click()`      | Clicks a control.                                  | All        |
| `ui5.fill`       | `fill()`       | Fills a control with text.                         | All        |
| `ui5.press`      | `press()`      | Presses a control (alias for click).               | All        |
| `ui5.select`     | `select()`     | Selects an item in a selection control.            | All        |
| `ui5.check`      | `check()`      | Checks a checkbox.                                 | All        |
| `ui5.uncheck`    | `uncheck()`    | Unchecks a checkbox.                               | All        |
| `ui5.clear`      | `clear()`      | Clears a control's text.                           | All        |
| `ui5.getText`    | `getText()`    | Gets the text of a control.                        | All        |
| `ui5.getValue`   | `getValue()`   | Gets the value of a control.                       | All        |
| `ui5.waitForUI5` | `waitForUI5()` | Waits for UI5 to stabilize.                        | All        |
| `ui5.waitFor`    | `waitFor()`    | Waits for a control to appear.                     | All        |
| `ui5.inspect`    | `inspect()`    | Inspects a control and returns full metadata.      | All        |
| `ui5.clearCache` | `clearCache()` | Clears the internal proxy cache.                   | All        |
| `ui5.destroy`    | `destroy()`    | Destroys the handler and cleans up resources.      | All        |

### control

```typescript
const btn = await ui5.control({ id: 'submitBtn' });
```

### controls

```typescript
const buttons = await ui5.controls({ controlType: 'sap.m.Button' });
```

### click

```typescript
await ui5.click({ id: 'submitBtn' });
```

## Table

| Capability                      | Function                | Description                                                              | SAP Module |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------ | ---------- |
| `ui5.table.detectType`          | `detectType()`          | Detects the table type and returns metadata.                             | All        |
| `ui5.table.getRows`             | `getRows()`             | Returns all visible row data as string arrays.                           | All        |
| `ui5.table.getRowCount`         | `getRowCount()`         | Returns the number of rows in the table.                                 | All        |
| `ui5.table.getCellValue`        | `getCellValue()`        | Returns the value of a specific cell by row and column index.            | All        |
| `ui5.table.getData`             | `getData()`             | Returns all table data as an array of record objects.                    | All        |
| `ui5.table.selectRow`           | `selectRow()`           | Selects a specific row by index.                                         | All        |
| `ui5.table.selectAll`           | `selectAll()`           | Selects all rows in the table.                                           | All        |
| `ui5.table.deselectAll`         | `deselectAll()`         | Deselects all rows in the table.                                         | All        |
| `ui5.table.waitForData`         | `waitForData()`         | Waits for table data to load.                                            | All        |
| `ui5.table.getSelectedRows`     | `getSelectedRows()`     | Returns indices of currently selected rows.                              | All        |
| `ui5.table.getColumnNames`      | `getColumnNames()`      | Returns the column header names of the table.                            | All        |
| `ui5.table.findRowByValues`     | `findRowByValues()`     | Finds the first row matching the given column-value criteria.            | All        |
| `ui5.table.getCellByColumnName` | `getCellByColumnName()` | Returns the cell value at the given row and column name.                 | All        |
| `ui5.table.clickRow`            | `clickRow()`            | Clicks a specific row to trigger navigation or selection.                | All        |
| `ui5.table.selectRowByValues`   | `selectRowByValues()`   | Finds and selects a row matching the given column-value criteria.        | All        |
| `ui5.table.ensureRowVisible`    | `ensureRowVisible()`    | Scrolls the table to ensure the given row is visible.                    | All        |
| `ui5.table.setTableCellValue`   | `setTableCellValue()`   | Sets the value of a specific cell by row and column index.               | All        |
| `ui5.table.getRowCountAlt`      | `getRowCountAlt()`      | Returns the row count using an alternative detection method.             | All        |
| `ui5.table.filterByColumn`      | `filterByColumn()`      | Applies a filter to a specific column.                                   | All        |
| `ui5.table.sortByColumn`        | `sortByColumn()`        | Sorts the table by a specific column.                                    | All        |
| `ui5.table.getSortOrder`        | `getSortOrder()`        | Returns the current sort order for a specific column.                    | All        |
| `ui5.table.getFilterValue`      | `getFilterValue()`      | Returns the current filter value for a specific column.                  | All        |
| `ui5.table.exportData`          | `exportData()`          | Exports all table data as an array of record objects with string values. | All        |
| `ui5.table.clickSettings`       | `clickSettings()`       | Opens the table settings/personalization dialog.                         | All        |

### detectType

```typescript
const info = await ui5.table.detectType('orderTable');
```

### getRows

```typescript
const rows = await ui5.table.getRows('orderTable');
```

### getRowCount

```typescript
const count = await ui5.table.getRowCount('orderTable');
```

## Dialog

| Capability                 | Function          | Description                                            | SAP Module |
| -------------------------- | ----------------- | ------------------------------------------------------ | ---------- |
| `ui5.dialog.waitFor`       | `waitFor()`       | Waits for a dialog to appear and returns its metadata. | All        |
| `ui5.dialog.getOpen`       | `getOpen()`       | Returns all currently open dialogs.                    | All        |
| `ui5.dialog.isOpen`        | `isOpen()`        | Checks whether a specific dialog is currently open.    | All        |
| `ui5.dialog.dismiss`       | `dismiss()`       | Dismisses (closes) a dialog.                           | All        |
| `ui5.dialog.confirm`       | `confirm()`       | Confirms a dialog by clicking its confirmation button. | All        |
| `ui5.dialog.waitForClosed` | `waitForClosed()` | Waits for a specific dialog to close.                  | All        |
| `ui5.dialog.getButtons`    | `getButtons()`    | Returns the buttons available in a specific dialog.    | All        |

### waitFor

```typescript
const dlg = await ui5.dialog.waitFor({ title: 'Confirm' });
```

### getOpen

```typescript
const dialogs = await ui5.dialog.getOpen();
```

### isOpen

```typescript
const open = await ui5.dialog.isOpen('confirmDialog');
```

## Date

| Capability                | Function           | Description                                                             | SAP Module |
| ------------------------- | ------------------ | ----------------------------------------------------------------------- | ---------- |
| `ui5.date.setDatePicker`  | `setDatePicker()`  | Sets a date value on a DatePicker control.                              | All        |
| `ui5.date.getDatePicker`  | `getDatePicker()`  | Gets the current date value from a DatePicker control.                  | All        |
| `ui5.date.setDateRange`   | `setDateRange()`   | Sets start and end dates on a DateRangeSelection control.               | All        |
| `ui5.date.getDateRange`   | `getDateRange()`   | Gets the current start and end dates from a DateRangeSelection control. | All        |
| `ui5.date.setTimePicker`  | `setTimePicker()`  | Sets a time value on a TimePicker control.                              | All        |
| `ui5.date.getTimePicker`  | `getTimePicker()`  | Gets the current time value from a TimePicker control.                  | All        |
| `ui5.date.setAndValidate` | `setAndValidate()` | Sets a date and validates the input against the control's constraints.  | All        |

### setDatePicker

```typescript
await ui5.date.setDatePicker('deliveryDate', '2026-03-15');
```

### getDatePicker

```typescript
const date = await ui5.date.getDatePicker('deliveryDate');
```

### setDateRange

```typescript
await ui5.date.setDateRange('reportRange', '2026-01-01', '2026-03-31');
```

## Odata

| Capability                     | Function               | Description                                                 | SAP Module |
| ------------------------------ | ---------------------- | ----------------------------------------------------------- | ---------- |
| `ui5.odata.getModelData`       | `getModelData()`       | Reads data from the OData model at the given path.          | All        |
| `ui5.odata.getModelProperty`   | `getModelProperty()`   | Reads a single property value from the OData model.         | All        |
| `ui5.odata.waitForLoad`        | `waitForLoad()`        | Waits for all pending OData requests to complete.           | All        |
| `ui5.odata.fetchCSRFToken`     | `fetchCSRFToken()`     | Fetches a CSRF token from the OData service.                | All        |
| `ui5.odata.getEntityCount`     | `getEntityCount()`     | Returns the $count for an entity set.                       | All        |
| `ui5.odata.hasPendingChanges`  | `hasPendingChanges()`  | Checks whether the OData model has unsaved changes.         | All        |
| `ui5.odata.createEntity`       | `createEntity()`       | Creates a new entity via OData HTTP POST.                   | All        |
| `ui5.odata.updateEntity`       | `updateEntity()`       | Updates an existing entity via OData HTTP PATCH/PUT.        | All        |
| `ui5.odata.deleteEntity`       | `deleteEntity()`       | Deletes an entity via OData HTTP DELETE.                    | All        |
| `ui5.odata.queryEntities`      | `queryEntities()`      | Queries an entity set with optional OData query parameters. | All        |
| `ui5.odata.callFunctionImport` | `callFunctionImport()` | Calls an OData function import.                             | All        |

### getModelData

```typescript
const data = await ui5.odata.getModelData('/PurchaseOrders');
```

### getModelProperty

```typescript
const vendor = await ui5.odata.getModelProperty("/PurchaseOrders('4500001234')/Vendor");
```

### waitForLoad

```typescript
await ui5.odata.waitForLoad({ timeout: 30000 });
```

## Navigate

| Capability                       | Function             | Description                                                           | SAP Module |
| -------------------------------- | -------------------- | --------------------------------------------------------------------- | ---------- |
| `ui5Navigation.navigateToApp`    | `navigateToApp()`    | Navigates to a Fiori Launchpad app by its semantic object and action. | All        |
| `ui5Navigation.navigateToTile`   | `navigateToTile()`   | Navigates to a Fiori Launchpad tile by its title.                     | All        |
| `ui5Navigation.navigateToIntent` | `navigateToIntent()` | Navigates to a semantic object intent with optional parameters.       | All        |
| `ui5Navigation.navigateToHash`   | `navigateToHash()`   | Navigates to a specific URL hash fragment.                            | All        |
| `ui5Navigation.navigateToHome`   | `navigateToHome()`   | Navigates back to the Fiori Launchpad home page.                      | All        |
| `ui5Navigation.navigateBack`     | `navigateBack()`     | Navigates back one step in the browser history.                       | All        |
| `ui5Navigation.navigateForward`  | `navigateForward()`  | Navigates forward one step in the browser history.                    | All        |
| `ui5Navigation.searchAndOpenApp` | `searchAndOpenApp()` | Searches for an app in the Fiori Launchpad and opens it.              | All        |
| `ui5Navigation.getCurrentHash`   | `getCurrentHash()`   | Returns the current URL hash fragment.                                | All        |

### navigateToApp

```typescript
await ui5Navigation.navigateToApp('PurchaseOrder-manage');
```

### navigateToTile

```typescript
await ui5Navigation.navigateToTile('Manage Purchase Orders');
```

### navigateToIntent

```typescript
await ui5Navigation.navigateToIntent(
  { semanticObject: 'PurchaseOrder', action: 'display' },
  { PurchaseOrder: '4500001234' },
);
```

## Auth

| Capability                 | Function             | Description                                                         | SAP Module |
| -------------------------- | -------------------- | ------------------------------------------------------------------- | ---------- |
| `sapAuth.login`            | `login()`            | Authenticates against the SAP system using the provided config.     | All        |
| `sapAuth.loginFromEnv`     | `loginFromEnv()`     | Authenticates using credentials from environment variables.         | All        |
| `sapAuth.logout`           | `logout()`           | Logs out of the SAP system.                                         | All        |
| `sapAuth.isAuthenticated`  | `isAuthenticated()`  | Checks whether the current session is authenticated.                | All        |
| `sapAuth.isSessionExpired` | `isSessionExpired()` | Checks whether the current session has expired.                     | All        |
| `sapAuth.getSessionInfo`   | `getSessionInfo()`   | Returns the current session metadata, or null if not authenticated. | All        |

### login

```typescript
await sapAuth.login(page, {
  baseUrl: 'https://my-sap.example.com',
  username: 'TESTUSER',
  password: 'secret',
  authStrategy: 'fiori-form',
});
```

### loginFromEnv

```typescript
await sapAuth.loginFromEnv(page);
```

### logout

```typescript
await sapAuth.logout(page);
```

## Fe

| Capability                        | Function              | Description                                                          | SAP Module |
| --------------------------------- | --------------------- | -------------------------------------------------------------------- | ---------- |
| `fe.listReport.getTable`          | `getTable()`          | Returns the main table ID of the List Report page.                   | All        |
| `fe.listReport.getFilterBar`      | `getFilterBar()`      | Returns the filter bar ID of the List Report page.                   | All        |
| `fe.listReport.setFilter`         | `setFilter()`         | Sets a filter field value on the List Report filter bar.             | All        |
| `fe.listReport.search`            | `search()`            | Triggers the Go/Search action on the List Report filter bar.         | All        |
| `fe.listReport.clearFilters`      | `clearFilters()`      | Clears all filter values on the List Report filter bar.              | All        |
| `fe.listReport.navigateToItem`    | `navigateToItem()`    | Navigates to a specific item by clicking its row in the List Report. | All        |
| `fe.listReport.getVariants`       | `getVariants()`       | Returns the list of available variant names.                         | All        |
| `fe.listReport.selectVariant`     | `selectVariant()`     | Selects a variant by name.                                           | All        |
| `fe.listReport.getFilterValue`    | `getFilterValue()`    | Returns the current value of a filter field.                         | All        |
| `fe.objectPage.navigateToSection` | `navigateToSection()` | Navigates to a specific section on the Object Page.                  | All        |
| `fe.objectPage.getSectionData`    | `getSectionData()`    | Returns the data from a specific section.                            | All        |
| `fe.objectPage.clickButton`       | `clickButton()`       | Clicks a button on the Object Page by its label.                     | All        |
| `fe.objectPage.clickEdit`         | `clickEdit()`         | Clicks the Edit button on the Object Page.                           | All        |
| `fe.objectPage.clickSave`         | `clickSave()`         | Clicks the Save button on the Object Page.                           | All        |
| `fe.objectPage.getSections`       | `getSections()`       | Returns all sections on the Object Page.                             | All        |
| `fe.objectPage.getHeaderTitle`    | `getHeaderTitle()`    | Returns the Object Page header title text.                           | All        |
| `fe.objectPage.isInEditMode`      | `isInEditMode()`      | Checks whether the Object Page is currently in edit mode.            | All        |
| `fe.table.getRowCount`            | `getRowCount()`       | Returns the row count for a Fiori Elements table.                    | All        |
| `fe.table.getCellValue`           | `getCellValue()`      | Returns the cell value at a given row index and column name.         | All        |
| `fe.table.findRow`                | `findRow()`           | Finds the first row matching the given column-value criteria.        | All        |
| `fe.table.clickRow`               | `clickRow()`          | Clicks a row in a Fiori Elements table.                              | All        |
| `fe.table.getColumnNames`         | `getColumnNames()`    | Returns the column header names for a Fiori Elements table.          | All        |
| `fe.list.getItemCount`            | `getItemCount()`      | Returns the number of items in a Fiori Elements list.                | All        |
| `fe.list.getItemTitle`            | `getItemTitle()`      | Returns the title of a list item at the given index.                 | All        |
| `fe.list.findItemByTitle`         | `findItemByTitle()`   | Finds the index of a list item by its title.                         | All        |
| `fe.list.clickItem`               | `clickItem()`         | Clicks a list item at the given index.                               | All        |
| `fe.list.selectItem`              | `selectItem()`        | Selects or deselects a list item at the given index.                 | All        |

### getTable

```typescript
const tableId = await fe.listReport.getTable();
```

### getFilterBar

```typescript
const filterBarId = await fe.listReport.getFilterBar();
```

### setFilter

```typescript
await fe.listReport.setFilter('CompanyCode', '1000');
```

## Intent

| Capability                                     | Function                      | Description                                                                        | SAP Module |
| ---------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------- | ---------- |
| `intent.core.fillField`                        | `fillField()`                 | Resolves a field label via vocabulary and fills the matching UI5 control.          | All        |
| `intent.core.clickButton`                      | `clickButton()`               | Clicks a sap.m.Button control matching the given button text.                      | All        |
| `intent.core.selectOption`                     | `selectOption()`              | Resolves a field label via vocabulary and selects an item in the matching control. | All        |
| `intent.core.assertField`                      | `assertField()`               | Resolves a field label via vocabulary, reads the control's text, and compares it.  | All        |
| `intent.core.confirmAndWait`                   | `confirmAndWait()`            | Confirms a dialog and waits for UI5 to stabilize.                                  | All        |
| `intent.core.waitForSave`                      | `waitForSave()`               | Waits for all pending UI5 rendering and OData requests to complete.                | All        |
| `intent.core.navigateAndSearch`                | `navigateAndSearch()`         | Navigates to a list app and runs a search with the given criteria.                 | All        |
| `intent.procurement.createPurchaseOrder`       | `createPurchaseOrder()`       | Creates a purchase order through the Fiori UI.                                     | MM         |
| `intent.procurement.approvePurchaseOrder`      | `approvePurchaseOrder()`      | Approves a purchase order through the Fiori UI.                                    | MM         |
| `intent.procurement.searchPurchaseOrders`      | `searchPurchaseOrders()`      | Searches for purchase orders using filter criteria.                                | MM         |
| `intent.procurement.createPurchaseRequisition` | `createPurchaseRequisition()` | Creates a purchase requisition through the Fiori UI.                               | MM         |
| `intent.procurement.confirmGoodsReceipt`       | `confirmGoodsReceipt()`       | Confirms a goods receipt for a purchase order.                                     | MM         |
| `intent.procurement.searchVendors`             | `searchVendors()`             | Searches for vendors using filter criteria.                                        | MM         |
| `intent.sales.createSalesOrder`                | `createSalesOrder()`          | Creates a sales order through the Fiori UI.                                        | SD         |
| `intent.sales.createQuotation`                 | `createQuotation()`           | Creates a sales quotation through the Fiori UI.                                    | SD         |
| `intent.sales.approveQuotation`                | `approveQuotation()`          | Approves a sales quotation through the Fiori UI.                                   | SD         |
| `intent.sales.searchSalesOrders`               | `searchSalesOrders()`         | Searches for sales orders using filter criteria.                                   | SD         |
| `intent.sales.searchCustomers`                 | `searchCustomers()`           | Searches for customers using filter criteria.                                      | SD         |
| `intent.sales.checkDeliveryStatus`             | `checkDeliveryStatus()`       | Checks the delivery status for a sales order.                                      | SD         |
| `intent.finance.createJournalEntry`            | `createJournalEntry()`        | Creates a journal entry through the Fiori UI.                                      | FI         |
| `intent.finance.postVendorInvoice`             | `postVendorInvoice()`         | Posts a vendor invoice through the Fiori UI.                                       | FI         |
| `intent.finance.processPayment`                | `processPayment()`            | Processes a payment through the Fiori UI.                                          | FI         |
| `intent.manufacturing.createProductionOrder`   | `createProductionOrder()`     | Creates a production order through the Fiori UI.                                   | PP         |
| `intent.manufacturing.confirmProductionOrder`  | `confirmProductionOrder()`    | Confirms a production order through the Fiori UI.                                  | PP         |
| `intent.masterData.createVendorMaster`         | `createVendorMaster()`        | Creates a vendor master record through the Fiori UI.                               | MD         |
| `intent.masterData.createCustomerMaster`       | `createCustomerMaster()`      | Creates a customer master record through the Fiori UI.                             | MD         |
| `intent.masterData.createMaterialMaster`       | `createMaterialMaster()`      | Creates a material master record through the Fiori UI.                             | MD         |

### fillField

**Intent**: Fill a form field by business-readable label.

```typescript
await intent.core.fillField('Vendor', '100001');
```

### clickButton

**Intent**: Click a button by its visible label.

```typescript
await intent.core.clickButton('Save');
```

### selectOption

**Intent**: Select a dropdown option by business field label.

```typescript
await intent.core.selectOption('Purchasing Org', '1000');
```

## Shell

| Capability                   | Function              | Description                                              | SAP Module |
| ---------------------------- | --------------------- | -------------------------------------------------------- | ---------- |
| `ui5Shell.expectShellHeader` | `expectShellHeader()` | Asserts that the SAP Shell header is visible.            | All        |
| `ui5Shell.clickHome`         | `clickHome()`         | Clicks the home button in the SAP Shell header.          | All        |
| `ui5Shell.openNotifications` | `openNotifications()` | Opens the notifications panel from the SAP Shell header. | All        |
| `ui5Shell.openUserMenu`      | `openUserMenu()`      | Opens the user menu from the SAP Shell header.           | All        |

### expectShellHeader

```typescript
await ui5Shell.expectShellHeader();
```

### clickHome

```typescript
await ui5Shell.clickHome();
```

### openNotifications

```typescript
await ui5Shell.openNotifications();
```

## Footer

| Capability              | Function        | Description                                     | SAP Module |
| ----------------------- | --------------- | ----------------------------------------------- | ---------- |
| `ui5Footer.clickSave`   | `clickSave()`   | Clicks the Save button in the footer toolbar.   | All        |
| `ui5Footer.clickApply`  | `clickApply()`  | Clicks the Apply button in the footer toolbar.  | All        |
| `ui5Footer.clickCancel` | `clickCancel()` | Clicks the Cancel button in the footer toolbar. | All        |
| `ui5Footer.clickEdit`   | `clickEdit()`   | Clicks the Edit button in the footer toolbar.   | All        |
| `ui5Footer.clickDelete` | `clickDelete()` | Clicks the Delete button in the footer toolbar. | All        |
| `ui5Footer.clickCreate` | `clickCreate()` | Clicks the Create button in the footer toolbar. | All        |

### clickSave

```typescript
await ui5Footer.clickSave();
```

### clickApply

```typescript
await ui5Footer.clickApply();
```

### clickCancel

```typescript
await ui5Footer.clickCancel();
```

## Flp

| Capability                        | Function                   | Description                                                           | SAP Module |
| --------------------------------- | -------------------------- | --------------------------------------------------------------------- | ---------- |
| `flpLocks.getLockEntries`         | `getLockEntries()`         | Returns all lock entries for the current or specified user.           | All        |
| `flpLocks.getNumberOfLockEntries` | `getNumberOfLockEntries()` | Returns the number of lock entries for the current or specified user. | All        |
| `flpLocks.deleteAllLockEntries`   | `deleteAllLockEntries()`   | Deletes all lock entries for the current or specified user.           | All        |
| `flpLocks.cleanup`                | `cleanup()`                | Cleans up all lock entries created during the test session.           | All        |
| `flpSettings.getLanguage`         | `getLanguage()`            | Returns the current FLP user language setting.                        | All        |
| `flpSettings.getDateFormat`       | `getDateFormat()`          | Returns the current FLP user date format setting.                     | All        |
| `flpSettings.getTimeFormat`       | `getTimeFormat()`          | Returns the current FLP user time format setting.                     | All        |
| `flpSettings.getTimezone`         | `getTimezone()`            | Returns the current FLP user timezone setting.                        | All        |
| `flpSettings.getNumberFormat`     | `getNumberFormat()`        | Returns the current FLP user number format setting.                   | All        |
| `flpSettings.getAllSettings`      | `getAllSettings()`         | Returns all FLP user settings as a single object.                     | All        |

### getLockEntries

```typescript
const locks = await flpLocks.getLockEntries('TESTUSER');
```

### getNumberOfLockEntries

```typescript
const count = await flpLocks.getNumberOfLockEntries();
```

### deleteAllLockEntries

```typescript
const deleted = await flpLocks.deleteAllLockEntries('TESTUSER');
```

## Ai

| Capability              | Function         | Description                                                                                    | SAP Module |
| ----------------------- | ---------------- | ---------------------------------------------------------------------------------------------- | ---------- |
| `pramanAI.discoverPage` | `discoverPage()` | Discovers the current page context using AI-powered analysis.                                  | All        |
| `pramanAI.buildContext` | `buildContext()` | Builds a complete AI page context from the current Playwright page state.                      | All        |
| `pramanAI.capabilities` | `capabilities()` | The CapabilityRegistry instance for querying available capabilities.                           | All        |
| `pramanAI.recipes`      | `recipes()`      | The RecipeRegistry instance for querying available test recipes.                               | All        |
| `pramanAI.agentic`      | `agentic()`      | The AgenticHandler instance for autonomous test operations with checkpoint-based resumability. | All        |
| `pramanAI.llm`          | `llm()`          | The LlmService instance for direct LLM interactions.                                           | All        |
| `pramanAI.vocabulary`   | `vocabulary()`   | The VocabularyService instance for field label resolution.                                     | All        |

### discoverPage

```typescript
const context = await pramanAI.discoverPage();
```

### buildContext

```typescript
const context = await pramanAI.buildContext();
```

### capabilities

```typescript
const allCaps = pramanAI.capabilities.getAll();
```

## Data

| Capability          | Function     | Description                                                    | SAP Module |
| ------------------- | ------------ | -------------------------------------------------------------- | ---------- |
| `testData.generate` | `generate()` | Generates test data from a template with randomized values.    | All        |
| `testData.save`     | `save()`     | Saves test data to a JSON file for later reuse.                | All        |
| `testData.load`     | `load()`     | Loads previously saved test data from a JSON file.             | All        |
| `testData.cleanup`  | `cleanup()`  | Cleans up all test data files created during the test session. | All        |

### generate

```typescript
const po = testData.generate({ Vendor: '', Material: '', Quantity: '' });
```

### save

```typescript
await testData.save('po-data.json', { Vendor: '100001', Material: 'MAT-001' });
```

### load

```typescript
const data = await testData.load('po-data.json');
```
