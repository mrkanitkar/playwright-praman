# Praman Capabilities Reference

> **Generated**: 2026-05-25 — do not edit manually, run `npm run generate:capabilities`
> **Total**: 182 capabilities across 15 categories

---

## Categories

| Category | Prefix       | Description                                    | Count |
| -------- | ------------ | ---------------------------------------------- | ----- |
| ui5      | `UI5-UI5`    | Core UI5 control interactions                  | 22    |
| table    | `UI5-TABLE`  | Table discovery, reading, and manipulation     | 24    |
| dialog   | `UI5-DLG`    | Dialog lifecycle management                    | 7     |
| date     | `UI5-DATE`   | Date and time picker operations                | 7     |
| odata    | `UI5-ODATA`  | OData model and HTTP operations                | 11    |
| navigate | `UI5-NAV`    | FLP and in-app navigation                      | 9     |
| auth     | `UI5-AUTH`   | SAP authentication and session management      | 6     |
| fe       | `UI5-FE`     | Fiori Elements page abstractions               | 27    |
| intent   | `UI5-INTENT` | Business intent operations (SAP domain)        | 27    |
| shell    | `UI5-SHELL`  | SAP Shell header interactions                  | 4     |
| footer   | `UI5-FOOTER` | Footer toolbar actions                         | 6     |
| flp      | `UI5-FLP`    | Fiori Launchpad services (locks, settings)     | 10    |
| ai       | `UI5-AI`     | AI-powered discovery and context building      | 9     |
| assert   | `UI5-ASSERT` | UI5-aware custom matchers for assertions       | 9     |
| data     | `UI5-DATA`   | Test data generation, persistence, and cleanup | 4     |

---

## ui5 — Core UI5 control interactions

| ID            | Name                      | Description                                                                                       | Usage Example                                                          |
| ------------- | ------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `UI5-UI5-001` | control                   | Discovers a single control matching the selector.                                                 | `const btn = await ui5.control({ id: 'submitBtn' });`                  |
| `UI5-UI5-002` | controls                  | Discovers multiple controls matching the selector.                                                | `const buttons = await ui5.controls({ controlType: 'sap.m.Button' });` |
| `UI5-UI5-003` | click                     | Clicks a control.                                                                                 | `await ui5.click({ id: 'submitBtn' });`                                |
| `UI5-UI5-004` | fill                      | Fills a control with text.                                                                        | `await ui5.fill({ id: 'vendorInput' }, '100001');`                     |
| `UI5-UI5-005` | press                     | Presses a control (alias for click).                                                              | `await ui5.press({ id: 'saveBtn' });`                                  |
| `UI5-UI5-006` | select                    | Selects an item in a selection control.                                                           | `await ui5.select({ id: 'purchOrgSelect' }, '1000');`                  |
| `UI5-UI5-007` | check                     | Checks a checkbox.                                                                                | `await ui5.check({ id: 'agreeCheckbox' });`                            |
| `UI5-UI5-008` | uncheck                   | Unchecks a checkbox.                                                                              | `await ui5.uncheck({ id: 'agreeCheckbox' });`                          |
| `UI5-UI5-009` | clear                     | Clears a control's text.                                                                          | `await ui5.clear({ id: 'searchField' });`                              |
| `UI5-UI5-010` | getText                   | Gets the text of a control.                                                                       | `const label = await ui5.getText({ id: 'statusLabel' });`              |
| `UI5-UI5-011` | getValue                  | Gets the value of a control.                                                                      | `const val = await ui5.getValue({ id: 'quantityInput' });`             |
| `UI5-UI5-012` | waitForUI5                | Waits for UI5 to stabilize.                                                                       | `await ui5.waitForUI5();`                                              |
| `UI5-UI5-013` | waitFor                   | Waits for a control to appear.                                                                    | `await ui5.waitFor({ id: 'resultTable' }, { timeout: 10000 });`        |
| `UI5-UI5-014` | inspect                   | Inspects a control and returns full metadata.                                                     | `const info = await ui5.inspect({ id: 'vendorInput' });`               |
| `UI5-UI5-015` | clearCache                | Clears the internal proxy cache.                                                                  | `ui5.clearCache();`                                                    |
| `UI5-UI5-016` | destroy                   | Destroys the handler and cleans up resources.                                                     | `await ui5.destroy();`                                                 |
| `UI5-UI5-017` | setValue                  | Set value on a control via proxy method forwarding.                                               | `const input = await ui5.control({ id: 'materialInput' });`            |
| `UI5-UI5-018` | fireChange                | Fire change event on a control via proxy method forwarding.                                       | `const input = await ui5.control({ id: 'materialInput' });`            |
| `UI5-UI5-019` | open                      | Open a control (e.g., ComboBox dropdown) via proxy.                                               | `const combo = await ui5.control({ id: 'variantCombo' });`             |
| `UI5-UI5-020` | close                     | Close a control via proxy.                                                                        | `const combo = await ui5.control({ id: 'variantCombo' });`             |
| `UI5-UI5-021` | setSelectedKey            | Set selected key on selection control via proxy.                                                  | `const combo = await ui5.control({ id: 'variantCombo' });`             |
| `UI5-UI5-022` | serializeUI5SelectorToCSS | Serializes a UI5Selector object into a CSS pseudo-class string. Internal selector engine utility. | `import { serializeUI5SelectorToCSS } from 'playwright-praman';`       |

## table — Table discovery, reading, and manipulation

| ID              | Name                | Description                                                              | Usage Example                                                                                 |
| --------------- | ------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `UI5-TABLE-001` | detectType          | Detects the table type and returns metadata.                             | `const info = await ui5.table.detectType('orderTable');`                                      |
| `UI5-TABLE-002` | getRows             | Returns all visible row data as string arrays.                           | `const rows = await ui5.table.getRows('orderTable');`                                         |
| `UI5-TABLE-003` | getRowCount         | Returns the number of rows in the table.                                 | `const count = await ui5.table.getRowCount('orderTable');`                                    |
| `UI5-TABLE-004` | getCellValue        | Returns the value of a specific cell by row and column index.            | `const value = await ui5.table.getCellValue('orderTable', 0, 2);`                             |
| `UI5-TABLE-005` | getData             | Returns all table data as an array of record objects.                    | `const data = await ui5.table.getData('orderTable');`                                         |
| `UI5-TABLE-006` | selectRow           | Selects a specific row by index.                                         | `await ui5.table.selectRow('orderTable', 0);`                                                 |
| `UI5-TABLE-007` | selectAll           | Selects all rows in the table.                                           | `await ui5.table.selectAll('orderTable');`                                                    |
| `UI5-TABLE-008` | deselectAll         | Deselects all rows in the table.                                         | `await ui5.table.deselectAll('orderTable');`                                                  |
| `UI5-TABLE-009` | waitForData         | Waits for table data to load.                                            | `await ui5.table.waitForData('orderTable', { timeout: 15000 });`                              |
| `UI5-TABLE-010` | getSelectedRows     | Returns indices of currently selected rows.                              | `const selected = await ui5.table.getSelectedRows('orderTable');`                             |
| `UI5-TABLE-011` | getColumnNames      | Returns the column header names of the table.                            | `const columns = await ui5.table.getColumnNames('orderTable');`                               |
| `UI5-TABLE-012` | findRowByValues     | Finds the first row matching the given column-value criteria.            | `const rowIdx = await ui5.table.findRowByValues('orderTable', { 'Order ID': '4500001234' });` |
| `UI5-TABLE-013` | getCellByColumnName | Returns the cell value at the given row and column name.                 | `const status = await ui5.table.getCellByColumnName('orderTable', 0, 'Status');`              |
| `UI5-TABLE-014` | clickRow            | Clicks a specific row to trigger navigation or selection.                | `await ui5.table.clickRow('orderTable', 0);`                                                  |
| `UI5-TABLE-015` | selectRowByValues   | Finds and selects a row matching the given column-value criteria.        | `await ui5.table.selectRowByValues('orderTable', { 'Vendor': '100001' });`                    |
| `UI5-TABLE-016` | ensureRowVisible    | Scrolls the table to ensure the given row is visible.                    | `await ui5.table.ensureRowVisible('orderTable', 25);`                                         |
| `UI5-TABLE-017` | setTableCellValue   | Sets the value of a specific cell by row and column index.               | `await ui5.table.setTableCellValue('orderTable', 0, 2, '500');`                               |
| `UI5-TABLE-018` | getRowCountAlt      | Returns the row count using an alternative detection method.             | `const count = await ui5.table.getRowCountAlt('orderTable');`                                 |
| `UI5-TABLE-019` | filterByColumn      | Applies a filter to a specific column.                                   | `await ui5.table.filterByColumn('orderTable', 1, 'Open');`                                    |
| `UI5-TABLE-020` | sortByColumn        | Sorts the table by a specific column.                                    | `await ui5.table.sortByColumn('orderTable', 0, { direction: 'ascending' });`                  |
| `UI5-TABLE-021` | getSortOrder        | Returns the current sort order for a specific column.                    | `const sort = await ui5.table.getSortOrder('orderTable', 0);`                                 |
| `UI5-TABLE-022` | getFilterValue      | Returns the current filter value for a specific column.                  | `const filter = await ui5.table.getFilterValue('orderTable', 1);`                             |
| `UI5-TABLE-023` | exportData          | Exports all table data as an array of record objects with string values. | `const exported = await ui5.table.exportData('orderTable');`                                  |
| `UI5-TABLE-024` | clickSettings       | Opens the table settings/personalization dialog.                         | `await ui5.table.clickSettings('orderTable');`                                                |

## dialog — Dialog lifecycle management

| ID            | Name          | Description                                            | Usage Example                                                            |
| ------------- | ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ |
| `UI5-DLG-001` | waitFor       | Waits for a dialog to appear and returns its metadata. | `const dlg = await ui5.dialog.waitFor({ title: 'Confirm' });`            |
| `UI5-DLG-002` | getOpen       | Returns all currently open dialogs.                    | `const dialogs = await ui5.dialog.getOpen();`                            |
| `UI5-DLG-003` | isOpen        | Checks whether a specific dialog is currently open.    | `const open = await ui5.dialog.isOpen('confirmDialog');`                 |
| `UI5-DLG-004` | dismiss       | Dismisses (closes) a dialog.                           | `await ui5.dialog.dismiss({ title: 'Warning' });`                        |
| `UI5-DLG-005` | confirm       | Confirms a dialog by clicking its confirmation button. | `await ui5.dialog.confirm({ title: 'Save Changes', buttonText: 'OK' });` |
| `UI5-DLG-006` | waitForClosed | Waits for a specific dialog to close.                  | `await ui5.dialog.waitForClosed('confirmDialog', { timeout: 5000 });`    |
| `UI5-DLG-007` | getButtons    | Returns the buttons available in a specific dialog.    | `const buttons = await ui5.dialog.getButtons('confirmDialog');`          |

## date — Date and time picker operations

| ID             | Name           | Description                                                             | Usage Example                                                             |
| -------------- | -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `UI5-DATE-001` | setDatePicker  | Sets a date value on a DatePicker control.                              | `await ui5.date.setDatePicker('deliveryDate', '2026-03-15');`             |
| `UI5-DATE-002` | getDatePicker  | Gets the current date value from a DatePicker control.                  | `const date = await ui5.date.getDatePicker('deliveryDate');`              |
| `UI5-DATE-003` | setDateRange   | Sets start and end dates on a DateRangeSelection control.               | `await ui5.date.setDateRange('reportRange', '2026-01-01', '2026-03-31');` |
| `UI5-DATE-004` | getDateRange   | Gets the current start and end dates from a DateRangeSelection control. | `const range = await ui5.date.getDateRange('reportRange');`               |
| `UI5-DATE-005` | setTimePicker  | Sets a time value on a TimePicker control.                              | `await ui5.date.setTimePicker('startTime', '14:30:00');`                  |
| `UI5-DATE-006` | getTimePicker  | Gets the current time value from a TimePicker control.                  | `const time = await ui5.date.getTimePicker('startTime');`                 |
| `UI5-DATE-007` | setAndValidate | Sets a date and validates the input against the control's constraints.  | `await ui5.date.setAndValidate('deliveryDate', '2026-03-15');`            |

## odata — OData model and HTTP operations

| ID              | Name               | Description                                                 | Usage Example                                                                                       |
| --------------- | ------------------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `UI5-ODATA-001` | getModelData       | Reads data from the OData model at the given path.          | `const data = await ui5.odata.getModelData('/PurchaseOrders');`                                     |
| `UI5-ODATA-002` | getModelProperty   | Reads a single property value from the OData model.         | `const vendor = await ui5.odata.getModelProperty('/PurchaseOrders(\'4500001234\')/Vendor');`        |
| `UI5-ODATA-003` | waitForLoad        | Waits for all pending OData requests to complete.           | `await ui5.odata.waitForLoad({ timeout: 30000 });`                                                  |
| `UI5-ODATA-004` | fetchCSRFToken     | Fetches a CSRF token from the OData service.                | `const token = await ui5.odata.fetchCSRFToken('/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV');` |
| `UI5-ODATA-005` | getEntityCount     | Returns the $count for an entity set.                       | `const count = await ui5.odata.getEntityCount('/PurchaseOrders/$count');`                           |
| `UI5-ODATA-006` | hasPendingChanges  | Checks whether the OData model has unsaved changes.         | `const pending = await ui5.odata.hasPendingChanges();`                                              |
| `UI5-ODATA-007` | createEntity       | Creates a new entity via OData HTTP POST.                   | `const result = await ui5.odata.createEntity(`                                                      |
| `UI5-ODATA-008` | updateEntity       | Updates an existing entity via OData HTTP PATCH/PUT.        | `const result = await ui5.odata.updateEntity(`                                                      |
| `UI5-ODATA-009` | deleteEntity       | Deletes an entity via OData HTTP DELETE.                    | `await ui5.odata.deleteEntity(`                                                                     |
| `UI5-ODATA-010` | queryEntities      | Queries an entity set with optional OData query parameters. | `const result = await ui5.odata.queryEntities(`                                                     |
| `UI5-ODATA-011` | callFunctionImport | Calls an OData function import.                             | `const result = await ui5.odata.callFunctionImport(`                                                |

## navigate — FLP and in-app navigation

| ID            | Name             | Description                                                           | Usage Example                                                                             |
| ------------- | ---------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `UI5-NAV-001` | navigateToApp    | Navigates to a Fiori Launchpad app by its semantic object and action. | `await ui5Navigation.navigateToApp('PurchaseOrder-manage');`                              |
| `UI5-NAV-002` | navigateToTile   | Navigates to a Fiori Launchpad tile by its title.                     | `await ui5Navigation.navigateToTile('Manage Purchase Orders');`                           |
| `UI5-NAV-003` | navigateToIntent | Navigates to a semantic object intent with optional parameters.       | `await ui5Navigation.navigateToIntent(`                                                   |
| `UI5-NAV-004` | navigateToHash   | Navigates to a specific URL hash fragment.                            | `await ui5Navigation.navigateToHash('#PurchaseOrder-manage&/PurchaseOrders/4500001234');` |
| `UI5-NAV-005` | navigateToHome   | Navigates back to the Fiori Launchpad home page.                      | `await ui5Navigation.navigateToHome();`                                                   |
| `UI5-NAV-006` | navigateBack     | Navigates back one step in the browser history.                       | `await ui5Navigation.navigateBack();`                                                     |
| `UI5-NAV-007` | navigateForward  | Navigates forward one step in the browser history.                    | `await ui5Navigation.navigateForward();`                                                  |
| `UI5-NAV-008` | searchAndOpenApp | Searches for an app in the Fiori Launchpad and opens it.              | `await ui5Navigation.searchAndOpenApp('Manage Purchase Orders');`                         |
| `UI5-NAV-009` | getCurrentHash   | Returns the current URL hash fragment.                                | `const hash = await ui5Navigation.getCurrentHash();`                                      |

## auth — SAP authentication and session management

| ID             | Name             | Description                                                         | Usage Example                                           |
| -------------- | ---------------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| `UI5-AUTH-001` | login            | Authenticates against the SAP system using the provided config.     | `await sapAuth.login(page, {`                           |
| `UI5-AUTH-002` | loginFromEnv     | Authenticates using credentials from environment variables.         | `await sapAuth.loginFromEnv(page);`                     |
| `UI5-AUTH-003` | logout           | Logs out of the SAP system.                                         | `await sapAuth.logout(page);`                           |
| `UI5-AUTH-004` | isAuthenticated  | Checks whether the current session is authenticated.                | `const loggedIn = await sapAuth.isAuthenticated(page);` |
| `UI5-AUTH-005` | isSessionExpired | Checks whether the current session has expired.                     | `const expired = sapAuth.isSessionExpired(300000);`     |
| `UI5-AUTH-006` | getSessionInfo   | Returns the current session metadata, or null if not authenticated. | `const session = sapAuth.getSessionInfo();`             |

## fe — Fiori Elements page abstractions

| ID           | Name              | Description                                                          | Usage Example                                                                              |
| ------------ | ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `UI5-FE-001` | getTable          | Returns the main table ID of the List Report page.                   | `const tableId = await fe.listReport.getTable();`                                          |
| `UI5-FE-002` | getFilterBar      | Returns the filter bar ID of the List Report page.                   | `const filterBarId = await fe.listReport.getFilterBar();`                                  |
| `UI5-FE-003` | setFilter         | Sets a filter field value on the List Report filter bar.             | `await fe.listReport.setFilter('CompanyCode', '1000');`                                    |
| `UI5-FE-004` | search            | Triggers the Go/Search action on the List Report filter bar.         | `await fe.listReport.search();`                                                            |
| `UI5-FE-005` | clearFilters      | Clears all filter values on the List Report filter bar.              | `await fe.listReport.clearFilters();`                                                      |
| `UI5-FE-006` | navigateToItem    | Navigates to a specific item by clicking its row in the List Report. | `await fe.listReport.navigateToItem(0);`                                                   |
| `UI5-FE-007` | getVariants       | Returns the list of available variant names.                         | `const variants = await fe.listReport.getVariants();`                                      |
| `UI5-FE-008` | selectVariant     | Selects a variant by name.                                           | `await fe.listReport.selectVariant('My Open Orders');`                                     |
| `UI5-FE-009` | getFilterValue    | Returns the current value of a filter field.                         | `const value = await fe.listReport.getFilterValue('CompanyCode');`                         |
| `UI5-FE-010` | navigateToSection | Navigates to a specific section on the Object Page.                  | `await fe.objectPage.navigateToSection('Items');`                                          |
| `UI5-FE-011` | getSectionData    | Returns the data from a specific section.                            | `const data = await fe.objectPage.getSectionData('General Information');`                  |
| `UI5-FE-012` | clickButton       | Clicks a button on the Object Page by its label.                     | `await fe.objectPage.clickButton('Edit');`                                                 |
| `UI5-FE-013` | clickEdit         | Clicks the Edit button on the Object Page.                           | `await fe.objectPage.clickEdit();`                                                         |
| `UI5-FE-014` | clickSave         | Clicks the Save button on the Object Page.                           | `await fe.objectPage.clickSave();`                                                         |
| `UI5-FE-015` | getSections       | Returns all sections on the Object Page.                             | `const sections = await fe.objectPage.getSections();`                                      |
| `UI5-FE-016` | getHeaderTitle    | Returns the Object Page header title text.                           | `const title = await fe.objectPage.getHeaderTitle();`                                      |
| `UI5-FE-017` | isInEditMode      | Checks whether the Object Page is currently in edit mode.            | `const editing = await fe.objectPage.isInEditMode();`                                      |
| `UI5-FE-018` | getRowCount       | Returns the row count for a Fiori Elements table.                    | `const count = await fe.table.getRowCount('itemsTable');`                                  |
| `UI5-FE-019` | getCellValue      | Returns the cell value at a given row index and column name.         | `const val = await fe.table.getCellValue('itemsTable', 0, 'Material');`                    |
| `UI5-FE-020` | findRow           | Finds the first row matching the given column-value criteria.        | `const idx = await fe.table.findRow('itemsTable', { Material: 'MAT-001' });`               |
| `UI5-FE-021` | clickRow          | Clicks a row in a Fiori Elements table.                              | `await fe.table.clickRow('itemsTable', 0);`                                                |
| `UI5-FE-022` | getColumnNames    | Returns the column header names for a Fiori Elements table.          | `const cols = await fe.table.getColumnNames('itemsTable');`                                |
| `UI5-FE-023` | getItemCount      | Returns the number of items in a Fiori Elements list.                | `const count = await fe.list.getItemCount('notificationList');`                            |
| `UI5-FE-024` | getItemTitle      | Returns the title of a list item at the given index.                 | `const title = await fe.list.getItemTitle('notificationList', 0);`                         |
| `UI5-FE-025` | findItemByTitle   | Finds the index of a list item by its title.                         | `const idx = await fe.list.findItemByTitle('notificationList', 'PO 4500001234 approved');` |
| `UI5-FE-026` | clickItem         | Clicks a list item at the given index.                               | `await fe.list.clickItem('notificationList', 0);`                                          |
| `UI5-FE-027` | selectItem        | Selects or deselects a list item at the given index.                 | `await fe.list.selectItem('notificationList', 0, true);`                                   |

## intent — Business intent operations (SAP domain)

| ID               | Name                      | Description                                                                        | Usage Example                                                                               |
| ---------------- | ------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `UI5-INTENT-001` | fillField                 | Resolves a field label via vocabulary and fills the matching UI5 control.          | `await intent.core.fillField('Vendor', '100001');`                                          |
| `UI5-INTENT-002` | clickButton               | Clicks a sap.m.Button control matching the given button text.                      | `await intent.core.clickButton('Save');`                                                    |
| `UI5-INTENT-003` | selectOption              | Resolves a field label via vocabulary and selects an item in the matching control. | `await intent.core.selectOption('Purchasing Org', '1000');`                                 |
| `UI5-INTENT-004` | assertField               | Resolves a field label via vocabulary, reads the control's text, and compares it.  | `await intent.core.assertField('Status', 'In Process');`                                    |
| `UI5-INTENT-005` | confirmAndWait            | Confirms a dialog and waits for UI5 to stabilize.                                  | `await intent.core.confirmAndWait();`                                                       |
| `UI5-INTENT-006` | waitForSave               | Waits for all pending UI5 rendering and OData requests to complete.                | `await intent.core.waitForSave();`                                                          |
| `UI5-INTENT-007` | navigateAndSearch         | Navigates to a list app and runs a search with the given criteria.                 | `await intent.core.navigateAndSearch('PurchaseOrder-manage', { Vendor: '100001' });`        |
| `UI5-INTENT-008` | createPurchaseOrder       | Creates a purchase order through the Fiori UI.                                     | `await intent.procurement.createPurchaseOrder({`                                            |
| `UI5-INTENT-009` | approvePurchaseOrder      | Approves a purchase order through the Fiori UI.                                    | `await intent.procurement.approvePurchaseOrder({ PurchaseOrder: '4500001234' });`           |
| `UI5-INTENT-010` | searchPurchaseOrders      | Searches for purchase orders using filter criteria.                                | `await intent.procurement.searchPurchaseOrders({ Vendor: '100001', CompanyCode: '1000' });` |
| `UI5-INTENT-011` | createPurchaseRequisition | Creates a purchase requisition through the Fiori UI.                               | `await intent.procurement.createPurchaseRequisition({`                                      |
| `UI5-INTENT-012` | confirmGoodsReceipt       | Confirms a goods receipt for a purchase order.                                     | `await intent.procurement.confirmGoodsReceipt({ PurchaseOrder: '4500001234' });`            |
| `UI5-INTENT-013` | searchVendors             | Searches for vendors using filter criteria.                                        | `await intent.procurement.searchVendors({ Name: 'Acme Corp' });`                            |
| `UI5-INTENT-014` | createSalesOrder          | Creates a sales order through the Fiori UI.                                        | `await intent.sales.createSalesOrder({`                                                     |
| `UI5-INTENT-015` | createQuotation           | Creates a sales quotation through the Fiori UI.                                    | `await intent.sales.createQuotation({`                                                      |
| `UI5-INTENT-016` | approveQuotation          | Approves a sales quotation through the Fiori UI.                                   | `await intent.sales.approveQuotation({ Quotation: '5000001234' });`                         |
| `UI5-INTENT-017` | searchSalesOrders         | Searches for sales orders using filter criteria.                                   | `await intent.sales.searchSalesOrders({ Customer: '200001' });`                             |
| `UI5-INTENT-018` | searchCustomers           | Searches for customers using filter criteria.                                      | `await intent.sales.searchCustomers({ Name: 'Global Industries' });`                        |
| `UI5-INTENT-019` | checkDeliveryStatus       | Checks the delivery status for a sales order.                                      | `await intent.sales.checkDeliveryStatus({ SalesOrder: '6000001234' });`                     |
| `UI5-INTENT-020` | createJournalEntry        | Creates a journal entry through the Fiori UI.                                      | `await intent.finance.createJournalEntry({`                                                 |
| `UI5-INTENT-021` | postVendorInvoice         | Posts a vendor invoice through the Fiori UI.                                       | `await intent.finance.postVendorInvoice({`                                                  |
| `UI5-INTENT-022` | processPayment            | Processes a payment through the Fiori UI.                                          | `await intent.finance.processPayment({`                                                     |
| `UI5-INTENT-023` | createProductionOrder     | Creates a production order through the Fiori UI.                                   | `await intent.manufacturing.createProductionOrder({`                                        |
| `UI5-INTENT-024` | confirmProductionOrder    | Confirms a production order through the Fiori UI.                                  | `await intent.manufacturing.confirmProductionOrder({`                                       |
| `UI5-INTENT-025` | createVendorMaster        | Creates a vendor master record through the Fiori UI.                               | `await intent.masterData.createVendorMaster({`                                              |
| `UI5-INTENT-026` | createCustomerMaster      | Creates a customer master record through the Fiori UI.                             | `await intent.masterData.createCustomerMaster({`                                            |
| `UI5-INTENT-027` | createMaterialMaster      | Creates a material master record through the Fiori UI.                             | `await intent.masterData.createMaterialMaster({`                                            |

## shell — SAP Shell header interactions

| ID              | Name              | Description                                              | Usage Example                         |
| --------------- | ----------------- | -------------------------------------------------------- | ------------------------------------- |
| `UI5-SHELL-001` | expectShellHeader | Asserts that the SAP Shell header is visible.            | `await ui5Shell.expectShellHeader();` |
| `UI5-SHELL-002` | clickHome         | Clicks the home button in the SAP Shell header.          | `await ui5Shell.clickHome();`         |
| `UI5-SHELL-003` | openNotifications | Opens the notifications panel from the SAP Shell header. | `await ui5Shell.openNotifications();` |
| `UI5-SHELL-004` | openUserMenu      | Opens the user menu from the SAP Shell header.           | `await ui5Shell.openUserMenu();`      |

## footer — Footer toolbar actions

| ID               | Name        | Description                                     | Usage Example                    |
| ---------------- | ----------- | ----------------------------------------------- | -------------------------------- |
| `UI5-FOOTER-001` | clickSave   | Clicks the Save button in the footer toolbar.   | `await ui5Footer.clickSave();`   |
| `UI5-FOOTER-002` | clickApply  | Clicks the Apply button in the footer toolbar.  | `await ui5Footer.clickApply();`  |
| `UI5-FOOTER-003` | clickCancel | Clicks the Cancel button in the footer toolbar. | `await ui5Footer.clickCancel();` |
| `UI5-FOOTER-004` | clickEdit   | Clicks the Edit button in the footer toolbar.   | `await ui5Footer.clickEdit();`   |
| `UI5-FOOTER-005` | clickDelete | Clicks the Delete button in the footer toolbar. | `await ui5Footer.clickDelete();` |
| `UI5-FOOTER-006` | clickCreate | Clicks the Create button in the footer toolbar. | `await ui5Footer.clickCreate();` |

## flp — Fiori Launchpad services (locks, settings)

| ID            | Name                   | Description                                                           | Usage Example                                                      |
| ------------- | ---------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `UI5-FLP-001` | getLockEntries         | Returns all lock entries for the current or specified user.           | `const locks = await flpLocks.getLockEntries('TESTUSER');`         |
| `UI5-FLP-002` | getNumberOfLockEntries | Returns the number of lock entries for the current or specified user. | `const count = await flpLocks.getNumberOfLockEntries();`           |
| `UI5-FLP-003` | deleteAllLockEntries   | Deletes all lock entries for the current or specified user.           | `const deleted = await flpLocks.deleteAllLockEntries('TESTUSER');` |
| `UI5-FLP-004` | cleanup                | Cleans up all lock entries created during the test session.           | `await flpLocks.cleanup();`                                        |
| `UI5-FLP-005` | getLanguage            | Returns the current FLP user language setting.                        | `const lang = await flpSettings.getLanguage();`                    |
| `UI5-FLP-006` | getDateFormat          | Returns the current FLP user date format setting.                     | `const fmt = await flpSettings.getDateFormat();`                   |
| `UI5-FLP-007` | getTimeFormat          | Returns the current FLP user time format setting.                     | `const fmt = await flpSettings.getTimeFormat();`                   |
| `UI5-FLP-008` | getTimezone            | Returns the current FLP user timezone setting.                        | `const tz = await flpSettings.getTimezone();`                      |
| `UI5-FLP-009` | getNumberFormat        | Returns the current FLP user number format setting.                   | `const fmt = await flpSettings.getNumberFormat();`                 |
| `UI5-FLP-010` | getAllSettings         | Returns all FLP user settings as a single object.                     | `const settings = await flpSettings.getAllSettings();`             |

## ai — AI-powered discovery and context building

| ID           | Name         | Description                                                                                    | Usage Example                                                                     |
| ------------ | ------------ | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `UI5-AI-001` | discoverPage | Discovers the current page context using AI-powered analysis.                                  | `const context = await pramanAI.discoverPage();`                                  |
| `UI5-AI-002` | buildContext | Builds a complete AI page context from the current Playwright page state.                      | `const context = await pramanAI.buildContext();`                                  |
| `UI5-AI-003` | capabilities | The CapabilityRegistry instance for querying available capabilities.                           | `const allCaps = pramanAI.capabilities.getAll();`                                 |
| `UI5-AI-004` | recipes      | The RecipeRegistry instance for querying available test recipes.                               | `const recipe = pramanAI.recipes.get('create-purchase-order');`                   |
| `UI5-AI-005` | agentic      | The AgenticHandler instance for autonomous test operations with checkpoint-based resumability. | `const result = await pramanAI.agentic.execute('create PO', page);`               |
| `UI5-AI-006` | llm          | The LlmService instance for direct LLM interactions.                                           | `const response = await pramanAI.llm.complete('Suggest a test for PO creation');` |
| `UI5-AI-007` | vocabulary   | The VocabularyService instance for field label resolution.                                     | `const controlId = await pramanAI.vocabulary.resolve('Vendor');`                  |
| `UI5-AI-008` | forAI        | Get all capabilities formatted for AI consumption.                                             | `const caps = pramanAI.capabilities.forAI();`                                     |
| `UI5-AI-009` | byCategory   | Get capabilities filtered by category.                                                         | `const tableCaps = pramanAI.capabilities.byCategory('table');`                    |

## assert — UI5-aware custom matchers for assertions

| ID               | Name                  | Description                                                                                                                | Usage Example                                                |
| ---------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `UI5-ASSERT-001` | toHaveUI5Text         | Assert control has expected text.                                                                                          | `await expect(locator).toHaveUI5Text('Expected text');`      |
| `UI5-ASSERT-002` | toBeUI5Visible        | Assert UI5 control is visible.                                                                                             | `await expect(locator).toBeUI5Visible();`                    |
| `UI5-ASSERT-003` | toBeUI5Enabled        | Assert UI5 control is enabled.                                                                                             | `await expect(locator).toBeUI5Enabled();`                    |
| `UI5-ASSERT-004` | toHaveUI5Property     | Assert control has specific property value.                                                                                | `await expect(locator).toHaveUI5Property('enabled', true);`  |
| `UI5-ASSERT-005` | toHaveUI5ValueState   | Assert control value state (Error, Warning, etc.).                                                                         | `await expect(locator).toHaveUI5ValueState('Success');`      |
| `UI5-ASSERT-006` | toHaveUI5RowCount     | Assert table has expected row count.                                                                                       | `await expect(table).toHaveUI5RowCount(5);`                  |
| `UI5-ASSERT-007` | toHaveUI5CellText     | Assert table cell contains expected text.                                                                                  | `await expect(table).toHaveUI5CellText(0, 2, 'MAT-001');`    |
| `UI5-ASSERT-008` | getControlProperty    | Low-level bridge call to read a single property from a UI5 control by ID. Used internally by matchers.                     | `import { getControlProperty } from 'playwright-praman';`    |
| `UI5-ASSERT-009` | getControlAggregation | Low-level bridge call to read an aggregation (child controls) from a UI5 control by ID. Used internally by table matchers. | `import { getControlAggregation } from 'playwright-praman';` |

## data — Test data generation, persistence, and cleanup

| ID             | Name     | Description                                                    | Usage Example                                                                     |
| -------------- | -------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `UI5-DATA-001` | generate | Generates test data from a template with randomized values.    | `const po = testData.generate({ Vendor: '', Material: '', Quantity: '' });`       |
| `UI5-DATA-002` | save     | Saves test data to a JSON file for later reuse.                | `await testData.save('po-data.json', { Vendor: '100001', Material: 'MAT-001' });` |
| `UI5-DATA-003` | load     | Loads previously saved test data from a JSON file.             | `const data = await testData.load('po-data.json');`                               |
| `UI5-DATA-004` | cleanup  | Cleans up all test data files created during the test session. | `await testData.cleanup();`                                                       |
