# Praman API Reference

> **Generated**: 2026-02-27 — do not edit manually, run `npm run generate:skill-md`

| Function                      | Capability                                     | Description                                                                                    |
| ----------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `agentic()`                   | `pramanAI.agentic`                             | The AgenticHandler instance for autonomous test operations with checkpoint-based resumability. |
| `approvePurchaseOrder()`      | `intent.procurement.approvePurchaseOrder`      | Approves a purchase order through the Fiori UI.                                                |
| `approveQuotation()`          | `intent.sales.approveQuotation`                | Approves a sales quotation through the Fiori UI.                                               |
| `assertField()`               | `intent.core.assertField`                      | Resolves a field label via vocabulary, reads the control's text, and compares it.              |
| `buildContext()`              | `pramanAI.buildContext`                        | Builds a complete AI page context from the current Playwright page state.                      |
| `byCategory()`                | `capability-registry.byCategory`               | Get capabilities filtered by category.                                                         |
| `callFunctionImport()`        | `ui5.odata.callFunctionImport`                 | Calls an OData function import.                                                                |
| `capabilities()`              | `pramanAI.capabilities`                        | The CapabilityRegistry instance for querying available capabilities.                           |
| `check()`                     | `ui5.check`                                    | Checks a checkbox.                                                                             |
| `checkDeliveryStatus()`       | `intent.sales.checkDeliveryStatus`             | Checks the delivery status for a sales order.                                                  |
| `cleanup()`                   | `flpLocks.cleanup`                             | Cleans up all lock entries created during the test session.                                    |
| `cleanup()`                   | `testData.cleanup`                             | Cleans up all test data files created during the test session.                                 |
| `clear()`                     | `ui5.clear`                                    | Clears a control's text.                                                                       |
| `clearCache()`                | `ui5.clearCache`                               | Clears the internal proxy cache.                                                               |
| `clearFilters()`              | `fe.listReport.clearFilters`                   | Clears all filter values on the List Report filter bar.                                        |
| `click()`                     | `ui5.click`                                    | Clicks a control.                                                                              |
| `clickApply()`                | `ui5Footer.clickApply`                         | Clicks the Apply button in the footer toolbar.                                                 |
| `clickButton()`               | `fe.objectPage.clickButton`                    | Clicks a button on the Object Page by its label.                                               |
| `clickButton()`               | `intent.core.clickButton`                      | Clicks a sap.m.Button control matching the given button text.                                  |
| `clickCancel()`               | `ui5Footer.clickCancel`                        | Clicks the Cancel button in the footer toolbar.                                                |
| `clickCreate()`               | `ui5Footer.clickCreate`                        | Clicks the Create button in the footer toolbar.                                                |
| `clickDelete()`               | `ui5Footer.clickDelete`                        | Clicks the Delete button in the footer toolbar.                                                |
| `clickEdit()`                 | `fe.objectPage.clickEdit`                      | Clicks the Edit button on the Object Page.                                                     |
| `clickEdit()`                 | `ui5Footer.clickEdit`                          | Clicks the Edit button in the footer toolbar.                                                  |
| `clickHome()`                 | `ui5Shell.clickHome`                           | Clicks the home button in the SAP Shell header.                                                |
| `clickItem()`                 | `fe.list.clickItem`                            | Clicks a list item at the given index.                                                         |
| `clickRow()`                  | `ui5.table.clickRow`                           | Clicks a specific row to trigger navigation or selection.                                      |
| `clickRow()`                  | `fe.table.clickRow`                            | Clicks a row in a Fiori Elements table.                                                        |
| `clickSave()`                 | `fe.objectPage.clickSave`                      | Clicks the Save button on the Object Page.                                                     |
| `clickSave()`                 | `ui5Footer.clickSave`                          | Clicks the Save button in the footer toolbar.                                                  |
| `clickSettings()`             | `ui5.table.clickSettings`                      | Opens the table settings/personalization dialog.                                               |
| `close()`                     | `control.close`                                | Close a control via proxy.                                                                     |
| `confirm()`                   | `ui5.dialog.confirm`                           | Confirms a dialog by clicking its confirmation button.                                         |
| `confirmAndWait()`            | `intent.core.confirmAndWait`                   | Confirms a dialog and waits for UI5 to stabilize.                                              |
| `confirmGoodsReceipt()`       | `intent.procurement.confirmGoodsReceipt`       | Confirms a goods receipt for a purchase order.                                                 |
| `confirmProductionOrder()`    | `intent.manufacturing.confirmProductionOrder`  | Confirms a production order through the Fiori UI.                                              |
| `control()`                   | `ui5.control`                                  | Discovers a single control matching the selector.                                              |
| `controls()`                  | `ui5.controls`                                 | Discovers multiple controls matching the selector.                                             |
| `createCustomerMaster()`      | `intent.masterData.createCustomerMaster`       | Creates a customer master record through the Fiori UI.                                         |
| `createEntity()`              | `ui5.odata.createEntity`                       | Creates a new entity via OData HTTP POST.                                                      |
| `createJournalEntry()`        | `intent.finance.createJournalEntry`            | Creates a journal entry through the Fiori UI.                                                  |
| `createMaterialMaster()`      | `intent.masterData.createMaterialMaster`       | Creates a material master record through the Fiori UI.                                         |
| `createProductionOrder()`     | `intent.manufacturing.createProductionOrder`   | Creates a production order through the Fiori UI.                                               |
| `createPurchaseOrder()`       | `intent.procurement.createPurchaseOrder`       | Creates a purchase order through the Fiori UI.                                                 |
| `createPurchaseRequisition()` | `intent.procurement.createPurchaseRequisition` | Creates a purchase requisition through the Fiori UI.                                           |
| `createQuotation()`           | `intent.sales.createQuotation`                 | Creates a sales quotation through the Fiori UI.                                                |
| `createSalesOrder()`          | `intent.sales.createSalesOrder`                | Creates a sales order through the Fiori UI.                                                    |
| `createVendorMaster()`        | `intent.masterData.createVendorMaster`         | Creates a vendor master record through the Fiori UI.                                           |
| `deleteAllLockEntries()`      | `flpLocks.deleteAllLockEntries`                | Deletes all lock entries for the current or specified user.                                    |
| `deleteEntity()`              | `ui5.odata.deleteEntity`                       | Deletes an entity via OData HTTP DELETE.                                                       |
| `deselectAll()`               | `ui5.table.deselectAll`                        | Deselects all rows in the table.                                                               |
| `destroy()`                   | `ui5.destroy`                                  | Destroys the handler and cleans up resources.                                                  |
| `detectType()`                | `ui5.table.detectType`                         | Detects the table type and returns metadata.                                                   |
| `discoverPage()`              | `pramanAI.discoverPage`                        | Discovers the current page context using AI-powered analysis.                                  |
| `dismiss()`                   | `ui5.dialog.dismiss`                           | Dismisses (closes) a dialog.                                                                   |
| `ensureRowVisible()`          | `ui5.table.ensureRowVisible`                   | Scrolls the table to ensure the given row is visible.                                          |
| `expectShellHeader()`         | `ui5Shell.expectShellHeader`                   | Asserts that the SAP Shell header is visible.                                                  |
| `exportData()`                | `ui5.table.exportData`                         | Exports all table data as an array of record objects with string values.                       |
| `fetchCSRFToken()`            | `ui5.odata.fetchCSRFToken`                     | Fetches a CSRF token from the OData service.                                                   |
| `fill()`                      | `ui5.fill`                                     | Fills a control with text.                                                                     |
| `fillField()`                 | `intent.core.fillField`                        | Resolves a field label via vocabulary and fills the matching UI5 control.                      |
| `filterByColumn()`            | `ui5.table.filterByColumn`                     | Applies a filter to a specific column.                                                         |
| `findItemByTitle()`           | `fe.list.findItemByTitle`                      | Finds the index of a list item by its title.                                                   |
| `findRow()`                   | `fe.table.findRow`                             | Finds the first row matching the given column-value criteria.                                  |
| `findRowByValues()`           | `ui5.table.findRowByValues`                    | Finds the first row matching the given column-value criteria.                                  |
| `fireChange()`                | `control.fireChange`                           | Fire change event on a control via proxy method forwarding.                                    |
| `forAI()`                     | `capability-registry.forAI`                    | Get all capabilities formatted for AI consumption.                                             |
| `generate()`                  | `testData.generate`                            | Generates test data from a template with randomized values.                                    |
| `getAllSettings()`            | `flpSettings.getAllSettings`                   | Returns all FLP user settings as a single object.                                              |
| `getButtons()`                | `ui5.dialog.getButtons`                        | Returns the buttons available in a specific dialog.                                            |
| `getCellByColumnName()`       | `ui5.table.getCellByColumnName`                | Returns the cell value at the given row and column name.                                       |
| `getCellValue()`              | `ui5.table.getCellValue`                       | Returns the value of a specific cell by row and column index.                                  |
| `getCellValue()`              | `fe.table.getCellValue`                        | Returns the cell value at a given row index and column name.                                   |
| `getColumnNames()`            | `ui5.table.getColumnNames`                     | Returns the column header names of the table.                                                  |
| `getColumnNames()`            | `fe.table.getColumnNames`                      | Returns the column header names for a Fiori Elements table.                                    |
| `getCurrentHash()`            | `ui5Navigation.getCurrentHash`                 | Returns the current URL hash fragment.                                                         |
| `getData()`                   | `ui5.table.getData`                            | Returns all table data as an array of record objects.                                          |
| `getDateFormat()`             | `flpSettings.getDateFormat`                    | Returns the current FLP user date format setting.                                              |
| `getDatePicker()`             | `ui5.date.getDatePicker`                       | Gets the current date value from a DatePicker control.                                         |
| `getDateRange()`              | `ui5.date.getDateRange`                        | Gets the current start and end dates from a DateRangeSelection control.                        |
| `getEntityCount()`            | `ui5.odata.getEntityCount`                     | Returns the $count for an entity set.                                                          |
| `getFilterBar()`              | `fe.listReport.getFilterBar`                   | Returns the filter bar ID of the List Report page.                                             |
| `getFilterValue()`            | `ui5.table.getFilterValue`                     | Returns the current filter value for a specific column.                                        |
| `getFilterValue()`            | `fe.listReport.getFilterValue`                 | Returns the current value of a filter field.                                                   |
| `getHeaderTitle()`            | `fe.objectPage.getHeaderTitle`                 | Returns the Object Page header title text.                                                     |
| `getItemCount()`              | `fe.list.getItemCount`                         | Returns the number of items in a Fiori Elements list.                                          |
| `getItemTitle()`              | `fe.list.getItemTitle`                         | Returns the title of a list item at the given index.                                           |
| `getLanguage()`               | `flpSettings.getLanguage`                      | Returns the current FLP user language setting.                                                 |
| `getLockEntries()`            | `flpLocks.getLockEntries`                      | Returns all lock entries for the current or specified user.                                    |
| `getModelData()`              | `ui5.odata.getModelData`                       | Reads data from the OData model at the given path.                                             |
| `getModelProperty()`          | `ui5.odata.getModelProperty`                   | Reads a single property value from the OData model.                                            |
| `getNumberFormat()`           | `flpSettings.getNumberFormat`                  | Returns the current FLP user number format setting.                                            |
| `getNumberOfLockEntries()`    | `flpLocks.getNumberOfLockEntries`              | Returns the number of lock entries for the current or specified user.                          |
| `getOpen()`                   | `ui5.dialog.getOpen`                           | Returns all currently open dialogs.                                                            |
| `getRowCount()`               | `ui5.table.getRowCount`                        | Returns the number of rows in the table.                                                       |
| `getRowCount()`               | `fe.table.getRowCount`                         | Returns the row count for a Fiori Elements table.                                              |
| `getRowCountAlt()`            | `ui5.table.getRowCountAlt`                     | Returns the row count using an alternative detection method.                                   |
| `getRows()`                   | `ui5.table.getRows`                            | Returns all visible row data as string arrays.                                                 |
| `getSectionData()`            | `fe.objectPage.getSectionData`                 | Returns the data from a specific section.                                                      |
| `getSections()`               | `fe.objectPage.getSections`                    | Returns all sections on the Object Page.                                                       |
| `getSelectedRows()`           | `ui5.table.getSelectedRows`                    | Returns indices of currently selected rows.                                                    |
| `getSessionInfo()`            | `sapAuth.getSessionInfo`                       | Returns the current session metadata, or null if not authenticated.                            |
| `getSortOrder()`              | `ui5.table.getSortOrder`                       | Returns the current sort order for a specific column.                                          |
| `getTable()`                  | `fe.listReport.getTable`                       | Returns the main table ID of the List Report page.                                             |
| `getText()`                   | `ui5.getText`                                  | Gets the text of a control.                                                                    |
| `getTimeFormat()`             | `flpSettings.getTimeFormat`                    | Returns the current FLP user time format setting.                                              |
| `getTimePicker()`             | `ui5.date.getTimePicker`                       | Gets the current time value from a TimePicker control.                                         |
| `getTimezone()`               | `flpSettings.getTimezone`                      | Returns the current FLP user timezone setting.                                                 |
| `getValue()`                  | `ui5.getValue`                                 | Gets the value of a control.                                                                   |
| `getVariants()`               | `fe.listReport.getVariants`                    | Returns the list of available variant names.                                                   |
| `hasPendingChanges()`         | `ui5.odata.hasPendingChanges`                  | Checks whether the OData model has unsaved changes.                                            |
| `inspect()`                   | `ui5.inspect`                                  | Inspects a control and returns full metadata.                                                  |
| `isAuthenticated()`           | `sapAuth.isAuthenticated`                      | Checks whether the current session is authenticated.                                           |
| `isInEditMode()`              | `fe.objectPage.isInEditMode`                   | Checks whether the Object Page is currently in edit mode.                                      |
| `isOpen()`                    | `ui5.dialog.isOpen`                            | Checks whether a specific dialog is currently open.                                            |
| `isSessionExpired()`          | `sapAuth.isSessionExpired`                     | Checks whether the current session has expired.                                                |
| `llm()`                       | `pramanAI.llm`                                 | The LlmService instance for direct LLM interactions.                                           |
| `load()`                      | `testData.load`                                | Loads previously saved test data from a JSON file.                                             |
| `login()`                     | `sapAuth.login`                                | Authenticates against the SAP system using the provided config.                                |
| `loginFromEnv()`              | `sapAuth.loginFromEnv`                         | Authenticates using credentials from environment variables.                                    |
| `logout()`                    | `sapAuth.logout`                               | Logs out of the SAP system.                                                                    |
| `navigateAndSearch()`         | `intent.core.navigateAndSearch`                | Navigates to a list app and runs a search with the given criteria.                             |
| `navigateBack()`              | `ui5Navigation.navigateBack`                   | Navigates back one step in the browser history.                                                |
| `navigateForward()`           | `ui5Navigation.navigateForward`                | Navigates forward one step in the browser history.                                             |
| `navigateToApp()`             | `ui5Navigation.navigateToApp`                  | Navigates to a Fiori Launchpad app by its semantic object and action.                          |
| `navigateToHash()`            | `ui5Navigation.navigateToHash`                 | Navigates to a specific URL hash fragment.                                                     |
| `navigateToHome()`            | `ui5Navigation.navigateToHome`                 | Navigates back to the Fiori Launchpad home page.                                               |
| `navigateToIntent()`          | `ui5Navigation.navigateToIntent`               | Navigates to a semantic object intent with optional parameters.                                |
| `navigateToItem()`            | `fe.listReport.navigateToItem`                 | Navigates to a specific item by clicking its row in the List Report.                           |
| `navigateToSection()`         | `fe.objectPage.navigateToSection`              | Navigates to a specific section on the Object Page.                                            |
| `navigateToTile()`            | `ui5Navigation.navigateToTile`                 | Navigates to a Fiori Launchpad tile by its title.                                              |
| `open()`                      | `control.open`                                 | Open a control (e.g., ComboBox dropdown) via proxy.                                            |
| `openNotifications()`         | `ui5Shell.openNotifications`                   | Opens the notifications panel from the SAP Shell header.                                       |
| `openUserMenu()`              | `ui5Shell.openUserMenu`                        | Opens the user menu from the SAP Shell header.                                                 |
| `postVendorInvoice()`         | `intent.finance.postVendorInvoice`             | Posts a vendor invoice through the Fiori UI.                                                   |
| `press()`                     | `ui5.press`                                    | Presses a control (alias for click).                                                           |
| `processPayment()`            | `intent.finance.processPayment`                | Processes a payment through the Fiori UI.                                                      |
| `queryEntities()`             | `ui5.odata.queryEntities`                      | Queries an entity set with optional OData query parameters.                                    |
| `recipes()`                   | `pramanAI.recipes`                             | The RecipeRegistry instance for querying available test recipes.                               |
| `save()`                      | `testData.save`                                | Saves test data to a JSON file for later reuse.                                                |
| `search()`                    | `fe.listReport.search`                         | Triggers the Go/Search action on the List Report filter bar.                                   |
| `searchAndOpenApp()`          | `ui5Navigation.searchAndOpenApp`               | Searches for an app in the Fiori Launchpad and opens it.                                       |
| `searchCustomers()`           | `intent.sales.searchCustomers`                 | Searches for customers using filter criteria.                                                  |
| `searchPurchaseOrders()`      | `intent.procurement.searchPurchaseOrders`      | Searches for purchase orders using filter criteria.                                            |
| `searchSalesOrders()`         | `intent.sales.searchSalesOrders`               | Searches for sales orders using filter criteria.                                               |
| `searchVendors()`             | `intent.procurement.searchVendors`             | Searches for vendors using filter criteria.                                                    |
| `select()`                    | `ui5.select`                                   | Selects an item in a selection control.                                                        |
| `selectAll()`                 | `ui5.table.selectAll`                          | Selects all rows in the table.                                                                 |
| `selectItem()`                | `fe.list.selectItem`                           | Selects or deselects a list item at the given index.                                           |
| `selectOption()`              | `intent.core.selectOption`                     | Resolves a field label via vocabulary and selects an item in the matching control.             |
| `selectRow()`                 | `ui5.table.selectRow`                          | Selects a specific row by index.                                                               |
| `selectRowByValues()`         | `ui5.table.selectRowByValues`                  | Finds and selects a row matching the given column-value criteria.                              |
| `selectVariant()`             | `fe.listReport.selectVariant`                  | Selects a variant by name.                                                                     |
| `setAndValidate()`            | `ui5.date.setAndValidate`                      | Sets a date and validates the input against the control's constraints.                         |
| `setDatePicker()`             | `ui5.date.setDatePicker`                       | Sets a date value on a DatePicker control.                                                     |
| `setDateRange()`              | `ui5.date.setDateRange`                        | Sets start and end dates on a DateRangeSelection control.                                      |
| `setFilter()`                 | `fe.listReport.setFilter`                      | Sets a filter field value on the List Report filter bar.                                       |
| `setSelectedKey()`            | `control.setSelectedKey`                       | Set selected key on selection control via proxy.                                               |
| `setTableCellValue()`         | `ui5.table.setTableCellValue`                  | Sets the value of a specific cell by row and column index.                                     |
| `setTimePicker()`             | `ui5.date.setTimePicker`                       | Sets a time value on a TimePicker control.                                                     |
| `setValue()`                  | `control.setValue`                             | Set value on a control via proxy method forwarding.                                            |
| `sortByColumn()`              | `ui5.table.sortByColumn`                       | Sorts the table by a specific column.                                                          |
| `toBeUI5Enabled()`            | `matchers.toBeUI5Enabled`                      | Assert UI5 control is enabled.                                                                 |
| `toBeUI5Visible()`            | `matchers.toBeUI5Visible`                      | Assert UI5 control is visible.                                                                 |
| `toHaveUI5CellText()`         | `matchers.toHaveUI5CellText`                   | Assert table cell contains expected text.                                                      |
| `toHaveUI5Property()`         | `matchers.toHaveUI5Property`                   | Assert control has specific property value.                                                    |
| `toHaveUI5RowCount()`         | `matchers.toHaveUI5RowCount`                   | Assert table has expected row count.                                                           |
| `toHaveUI5Text()`             | `matchers.toHaveUI5Text`                       | Assert control has expected text.                                                              |
| `toHaveUI5ValueState()`       | `matchers.toHaveUI5ValueState`                 | Assert control value state (Error, Warning, etc.).                                             |
| `uncheck()`                   | `ui5.uncheck`                                  | Unchecks a checkbox.                                                                           |
| `updateEntity()`              | `ui5.odata.updateEntity`                       | Updates an existing entity via OData HTTP PATCH/PUT.                                           |
| `vocabulary()`                | `pramanAI.vocabulary`                          | The VocabularyService instance for field label resolution.                                     |
| `waitFor()`                   | `ui5.waitFor`                                  | Waits for a control to appear.                                                                 |
| `waitFor()`                   | `ui5.dialog.waitFor`                           | Waits for a dialog to appear and returns its metadata.                                         |
| `waitForClosed()`             | `ui5.dialog.waitForClosed`                     | Waits for a specific dialog to close.                                                          |
| `waitForData()`               | `ui5.table.waitForData`                        | Waits for table data to load.                                                                  |
| `waitForLoad()`               | `ui5.odata.waitForLoad`                        | Waits for all pending OData requests to complete.                                              |
| `waitForSave()`               | `intent.core.waitForSave`                      | Waits for all pending UI5 rendering and OData requests to complete.                            |
| `waitForUI5()`                | `ui5.waitForUI5`                               | Waits for UI5 to stabilize.                                                                    |
