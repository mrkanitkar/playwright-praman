# Praman Capabilities Reference (Agent)

> Generated: 2026-04-08 — do not edit manually, run `npm run generate:capabilities`
> Total: 182 capabilities

---

## ui5 — Core UI5 control interactions

- **ui5.control** — Discovers a single control matching the selector.
- **ui5.controls** — Discovers multiple controls matching the selector.
- **ui5.click** — Clicks a control.
- **ui5.fill** — Fills a control with text.
- **ui5.press** — Presses a control (alias for click).
- **ui5.select** — Selects an item in a selection control.
- **ui5.check** — Checks a checkbox.
- **ui5.uncheck** — Unchecks a checkbox.
- **ui5.clear** — Clears a control's text.
- **ui5.getText** — Gets the text of a control.
- **ui5.getValue** — Gets the value of a control.
- **ui5.waitForUI5** — Waits for UI5 to stabilize.
- **ui5.waitFor** — Waits for a control to appear.
- **ui5.inspect** — Inspects a control and returns full metadata.
- **ui5.clearCache** — Clears the internal proxy cache.
- **ui5.destroy** — Destroys the handler and cleans up resources.
- **control.setValue** — Set value on a control via proxy method forwarding.
- **control.fireChange** — Fire change event on a control via proxy method forwarding.
- **control.open** — Open a control (e.g., ComboBox dropdown) via proxy.
- **control.close** — Close a control via proxy.
- **control.setSelectedKey** — Set selected key on selection control via proxy.
- **selectors.serializeUI5SelectorToCSS** — Serializes a UI5Selector object into a CSS pseudo-class string. Internal selector engine utility.

## table — Table discovery, reading, and manipulation

- **ui5.table.detectType** — Detects the table type and returns metadata.
- **ui5.table.getRows** — Returns all visible row data as string arrays.
- **ui5.table.getRowCount** — Returns the number of rows in the table.
- **ui5.table.getCellValue** — Returns the value of a specific cell by row and column index.
- **ui5.table.getData** — Returns all table data as an array of record objects.
- **ui5.table.selectRow** — Selects a specific row by index.
- **ui5.table.selectAll** — Selects all rows in the table.
- **ui5.table.deselectAll** — Deselects all rows in the table.
- **ui5.table.waitForData** — Waits for table data to load.
- **ui5.table.getSelectedRows** — Returns indices of currently selected rows.
- **ui5.table.getColumnNames** — Returns the column header names of the table.
- **ui5.table.findRowByValues** — Finds the first row matching the given column-value criteria.
- **ui5.table.getCellByColumnName** — Returns the cell value at the given row and column name.
- **ui5.table.clickRow** — Clicks a specific row to trigger navigation or selection.
- **ui5.table.selectRowByValues** — Finds and selects a row matching the given column-value criteria.
- **ui5.table.ensureRowVisible** — Scrolls the table to ensure the given row is visible.
- **ui5.table.setTableCellValue** — Sets the value of a specific cell by row and column index.
- **ui5.table.getRowCountAlt** — Returns the row count using an alternative detection method.
- **ui5.table.filterByColumn** — Applies a filter to a specific column.
- **ui5.table.sortByColumn** — Sorts the table by a specific column.
- **ui5.table.getSortOrder** — Returns the current sort order for a specific column.
- **ui5.table.getFilterValue** — Returns the current filter value for a specific column.
- **ui5.table.exportData** — Exports all table data as an array of record objects with string values.
- **ui5.table.clickSettings** — Opens the table settings/personalization dialog.

## dialog — Dialog lifecycle management

- **ui5.dialog.waitFor** — Waits for a dialog to appear and returns its metadata.
- **ui5.dialog.getOpen** — Returns all currently open dialogs.
- **ui5.dialog.isOpen** — Checks whether a specific dialog is currently open.
- **ui5.dialog.dismiss** — Dismisses (closes) a dialog.
- **ui5.dialog.confirm** — Confirms a dialog by clicking its confirmation button.
- **ui5.dialog.waitForClosed** — Waits for a specific dialog to close.
- **ui5.dialog.getButtons** — Returns the buttons available in a specific dialog.

## date — Date and time picker operations

- **ui5.date.setDatePicker** — Sets a date value on a DatePicker control.
- **ui5.date.getDatePicker** — Gets the current date value from a DatePicker control.
- **ui5.date.setDateRange** — Sets start and end dates on a DateRangeSelection control.
- **ui5.date.getDateRange** — Gets the current start and end dates from a DateRangeSelection control.
- **ui5.date.setTimePicker** — Sets a time value on a TimePicker control.
- **ui5.date.getTimePicker** — Gets the current time value from a TimePicker control.
- **ui5.date.setAndValidate** — Sets a date and validates the input against the control's constraints.

## odata — OData model and HTTP operations

- **ui5.odata.getModelData** — Reads data from the OData model at the given path.
- **ui5.odata.getModelProperty** — Reads a single property value from the OData model.
- **ui5.odata.waitForLoad** — Waits for all pending OData requests to complete.
- **ui5.odata.fetchCSRFToken** — Fetches a CSRF token from the OData service.
- **ui5.odata.getEntityCount** — Returns the $count for an entity set.
- **ui5.odata.hasPendingChanges** — Checks whether the OData model has unsaved changes.
- **ui5.odata.createEntity** — Creates a new entity via OData HTTP POST.
- **ui5.odata.updateEntity** — Updates an existing entity via OData HTTP PATCH/PUT.
- **ui5.odata.deleteEntity** — Deletes an entity via OData HTTP DELETE.
- **ui5.odata.queryEntities** — Queries an entity set with optional OData query parameters.
- **ui5.odata.callFunctionImport** — Calls an OData function import.

## navigate — FLP and in-app navigation

- **ui5Navigation.navigateToApp** — Navigates to a Fiori Launchpad app by its semantic object and action.
- **ui5Navigation.navigateToTile** — Navigates to a Fiori Launchpad tile by its title.
- **ui5Navigation.navigateToIntent** — Navigates to a semantic object intent with optional parameters.
- **ui5Navigation.navigateToHash** — Navigates to a specific URL hash fragment.
- **ui5Navigation.navigateToHome** — Navigates back to the Fiori Launchpad home page.
- **ui5Navigation.navigateBack** — Navigates back one step in the browser history.
- **ui5Navigation.navigateForward** — Navigates forward one step in the browser history.
- **ui5Navigation.searchAndOpenApp** — Searches for an app in the Fiori Launchpad and opens it.
- **ui5Navigation.getCurrentHash** — Returns the current URL hash fragment.

## auth — SAP authentication and session management

- **sapAuth.login** — Authenticates against the SAP system using the provided config.
- **sapAuth.loginFromEnv** — Authenticates using credentials from environment variables.
- **sapAuth.logout** — Logs out of the SAP system.
- **sapAuth.isAuthenticated** — Checks whether the current session is authenticated.
- **sapAuth.isSessionExpired** — Checks whether the current session has expired.
- **sapAuth.getSessionInfo** — Returns the current session metadata, or null if not authenticated.

## fe — Fiori Elements page abstractions

- **fe.listReport.getTable** — Returns the main table ID of the List Report page.
- **fe.listReport.getFilterBar** — Returns the filter bar ID of the List Report page.
- **fe.listReport.setFilter** — Sets a filter field value on the List Report filter bar.
- **fe.listReport.search** — Triggers the Go/Search action on the List Report filter bar.
- **fe.listReport.clearFilters** — Clears all filter values on the List Report filter bar.
- **fe.listReport.navigateToItem** — Navigates to a specific item by clicking its row in the List Report.
- **fe.listReport.getVariants** — Returns the list of available variant names.
- **fe.listReport.selectVariant** — Selects a variant by name.
- **fe.listReport.getFilterValue** — Returns the current value of a filter field.
- **fe.objectPage.navigateToSection** — Navigates to a specific section on the Object Page.
- **fe.objectPage.getSectionData** — Returns the data from a specific section.
- **fe.objectPage.clickButton** — Clicks a button on the Object Page by its label.
- **fe.objectPage.clickEdit** — Clicks the Edit button on the Object Page.
- **fe.objectPage.clickSave** — Clicks the Save button on the Object Page.
- **fe.objectPage.getSections** — Returns all sections on the Object Page.
- **fe.objectPage.getHeaderTitle** — Returns the Object Page header title text.
- **fe.objectPage.isInEditMode** — Checks whether the Object Page is currently in edit mode.
- **fe.table.getRowCount** — Returns the row count for a Fiori Elements table.
- **fe.table.getCellValue** — Returns the cell value at a given row index and column name.
- **fe.table.findRow** — Finds the first row matching the given column-value criteria.
- **fe.table.clickRow** — Clicks a row in a Fiori Elements table.
- **fe.table.getColumnNames** — Returns the column header names for a Fiori Elements table.
- **fe.list.getItemCount** — Returns the number of items in a Fiori Elements list.
- **fe.list.getItemTitle** — Returns the title of a list item at the given index.
- **fe.list.findItemByTitle** — Finds the index of a list item by its title.
- **fe.list.clickItem** — Clicks a list item at the given index.
- **fe.list.selectItem** — Selects or deselects a list item at the given index.

## intent — Business intent operations (SAP domain)

- **intent.core.fillField** — Resolves a field label via vocabulary and fills the matching UI5 control.
- **intent.core.clickButton** — Clicks a sap.m.Button control matching the given button text.
- **intent.core.selectOption** — Resolves a field label via vocabulary and selects an item in the matching control.
- **intent.core.assertField** — Resolves a field label via vocabulary, reads the control's text, and compares it.
- **intent.core.confirmAndWait** — Confirms a dialog and waits for UI5 to stabilize.
- **intent.core.waitForSave** — Waits for all pending UI5 rendering and OData requests to complete.
- **intent.core.navigateAndSearch** — Navigates to a list app and runs a search with the given criteria.
- **intent.procurement.createPurchaseOrder** — Creates a purchase order through the Fiori UI.
- **intent.procurement.approvePurchaseOrder** — Approves a purchase order through the Fiori UI.
- **intent.procurement.searchPurchaseOrders** — Searches for purchase orders using filter criteria.
- **intent.procurement.createPurchaseRequisition** — Creates a purchase requisition through the Fiori UI.
- **intent.procurement.confirmGoodsReceipt** — Confirms a goods receipt for a purchase order.
- **intent.procurement.searchVendors** — Searches for vendors using filter criteria.
- **intent.sales.createSalesOrder** — Creates a sales order through the Fiori UI.
- **intent.sales.createQuotation** — Creates a sales quotation through the Fiori UI.
- **intent.sales.approveQuotation** — Approves a sales quotation through the Fiori UI.
- **intent.sales.searchSalesOrders** — Searches for sales orders using filter criteria.
- **intent.sales.searchCustomers** — Searches for customers using filter criteria.
- **intent.sales.checkDeliveryStatus** — Checks the delivery status for a sales order.
- **intent.finance.createJournalEntry** — Creates a journal entry through the Fiori UI.
- **intent.finance.postVendorInvoice** — Posts a vendor invoice through the Fiori UI.
- **intent.finance.processPayment** — Processes a payment through the Fiori UI.
- **intent.manufacturing.createProductionOrder** — Creates a production order through the Fiori UI.
- **intent.manufacturing.confirmProductionOrder** — Confirms a production order through the Fiori UI.
- **intent.masterData.createVendorMaster** — Creates a vendor master record through the Fiori UI.
- **intent.masterData.createCustomerMaster** — Creates a customer master record through the Fiori UI.
- **intent.masterData.createMaterialMaster** — Creates a material master record through the Fiori UI.

## shell — SAP Shell header interactions

- **ui5Shell.expectShellHeader** — Asserts that the SAP Shell header is visible.
- **ui5Shell.clickHome** — Clicks the home button in the SAP Shell header.
- **ui5Shell.openNotifications** — Opens the notifications panel from the SAP Shell header.
- **ui5Shell.openUserMenu** — Opens the user menu from the SAP Shell header.

## footer — Footer toolbar actions

- **ui5Footer.clickSave** — Clicks the Save button in the footer toolbar.
- **ui5Footer.clickApply** — Clicks the Apply button in the footer toolbar.
- **ui5Footer.clickCancel** — Clicks the Cancel button in the footer toolbar.
- **ui5Footer.clickEdit** — Clicks the Edit button in the footer toolbar.
- **ui5Footer.clickDelete** — Clicks the Delete button in the footer toolbar.
- **ui5Footer.clickCreate** — Clicks the Create button in the footer toolbar.

## flp — Fiori Launchpad services (locks, settings)

- **flpLocks.getLockEntries** — Returns all lock entries for the current or specified user.
- **flpLocks.getNumberOfLockEntries** — Returns the number of lock entries for the current or specified user.
- **flpLocks.deleteAllLockEntries** — Deletes all lock entries for the current or specified user.
- **flpLocks.cleanup** — Cleans up all lock entries created during the test session.
- **flpSettings.getLanguage** — Returns the current FLP user language setting.
- **flpSettings.getDateFormat** — Returns the current FLP user date format setting.
- **flpSettings.getTimeFormat** — Returns the current FLP user time format setting.
- **flpSettings.getTimezone** — Returns the current FLP user timezone setting.
- **flpSettings.getNumberFormat** — Returns the current FLP user number format setting.
- **flpSettings.getAllSettings** — Returns all FLP user settings as a single object.

## ai — AI-powered discovery and context building

- **pramanAI.discoverPage** — Discovers the current page context using AI-powered analysis.
- **pramanAI.buildContext** — Builds a complete AI page context from the current Playwright page state.
- **pramanAI.capabilities** — The CapabilityRegistry instance for querying available capabilities.
- **pramanAI.recipes** — The RecipeRegistry instance for querying available test recipes.
- **pramanAI.agentic** — The AgenticHandler instance for autonomous test operations with checkpoint-based resumability.
- **pramanAI.llm** — The LlmService instance for direct LLM interactions.
- **pramanAI.vocabulary** — The VocabularyService instance for field label resolution.
- **capability-registry.forAI** — Get all capabilities formatted for AI consumption.
- **capability-registry.byCategory** — Get capabilities filtered by category.

## assert — UI5-aware custom matchers for assertions

- **matchers.toHaveUI5Text** — Assert control has expected text.
- **matchers.toBeUI5Visible** — Assert UI5 control is visible.
- **matchers.toBeUI5Enabled** — Assert UI5 control is enabled.
- **matchers.toHaveUI5Property** — Assert control has specific property value.
- **matchers.toHaveUI5ValueState** — Assert control value state (Error, Warning, etc.).
- **matchers.toHaveUI5RowCount** — Assert table has expected row count.
- **matchers.toHaveUI5CellText** — Assert table cell contains expected text.
- **matchers.getControlProperty** — Low-level bridge call to read a single property from a UI5 control by ID. Used internally by matchers.
- **matchers.getControlAggregation** — Low-level bridge call to read an aggregation (child controls) from a UI5 control by ID. Used internally by table matchers.

## data — Test data generation, persistence, and cleanup

- **testData.generate** — Generates test data from a template with randomized values.
- **testData.save** — Saves test data to a JSON file for later reuse.
- **testData.load** — Loads previously saved test data from a JSON file.
- **testData.cleanup** — Cleans up all test data files created during the test session.
