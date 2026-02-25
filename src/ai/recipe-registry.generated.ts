/* eslint-disable sonarjs/no-duplicate-string */
/**
 * AUTO-GENERATED — do not edit manually.
 *
 * @remarks
 * This file is overwritten by `npm run generate:capabilities`.
 * Edit `recipes.yaml` to add or modify recipes, then re-run the generator.
 *
 * @module ai
 */

import type { RecipeEntry } from './schemas/recipe.schema.js';

/**
 * Static list of generated recipe entries.
 *
 * @remarks
 * Generated on 2026-02-25 with 14 entries.
 */
export const GENERATED_RECIPES: readonly RecipeEntry[] = [
  {
    id: 'recipe-ui5-button-click',
    name: 'Button Click',
    description:
      'Press a UI5 button by matching its text property. Supports both explicit control acquisition with press() and the shorthand click() helper.',
    domain: 'ui5',
    priority: 'essential',
    capabilities: ['cap-control-locate', 'cap-control-press', 'cap-control-click'],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\n// Explicit: acquire the control, then press\nconst btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } });\nawait btn.press();\n\n// Shorthand\nawait ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });",
  },
  {
    id: 'recipe-ui5-input-fill',
    name: 'Input Fill',
    description:
      'Fill a UI5 input field by ID. Always call setValue(), fireChange(), and waitForUI5() to ensure the model binding is updated. The shorthand fill() helper bundles all three steps.',
    domain: 'ui5',
    priority: 'essential',
    capabilities: [
      'cap-control-locate',
      'cap-control-set-value',
      'cap-control-fire-change',
      'cap-wait-for-ui5',
    ],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\n// Explicit: setValue + fireChange + waitForUI5\nconst input = await ui5.control({ id: 'materialInput' });\nawait input.setValue('MAT-001');\nawait input.fireChange({ value: 'MAT-001' });\nawait ui5.waitForUI5();\n\n// Shorthand\nawait ui5.fill({ id: 'materialInput' }, 'MAT-001');",
  },
  {
    id: 'recipe-ui5-dropdown-select',
    name: 'Dropdown Select (ComboBox)',
    description:
      'Select an item in a sap.m.ComboBox by opening the dropdown, setting the selected key, firing the change event, then closing and waiting for UI5 to stabilize.',
    domain: 'ui5',
    priority: 'essential',
    capabilities: [
      'cap-control-locate',
      'cap-control-open',
      'cap-control-set-selected-key',
      'cap-control-fire-change',
      'cap-control-close',
      'cap-wait-for-ui5',
    ],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nconst combo = await ui5.control({ id: 'variantUsage-comboBoxEdit' });\nawait combo.open();\nawait combo.setSelectedKey('1');\nawait combo.fireChange({ value: '1' });\nawait combo.close();\nawait ui5.waitForUI5();",
  },
  {
    id: 'recipe-table-read-data',
    name: 'Table Read Data',
    description:
      'Read rows, row count, and full data from a UI5 table by its ID. Use these helpers to inspect table contents in assertions or to drive data-dependent test logic.',
    domain: 'table',
    priority: 'essential',
    capabilities: ['cap-table-get-rows', 'cap-table-get-row-count', 'cap-table-get-data'],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nconst rows = await ui5.table.getRows('myTableId');\nconst count = await ui5.table.getRowCount('myTableId');\nconst data = await ui5.table.getData('myTableId');",
  },
  {
    id: 'recipe-table-click-row',
    name: 'Table Click Row',
    description:
      'Click a specific row in a UI5 table by its zero-based index. Triggers navigation or selection depending on the table mode.',
    domain: 'table',
    priority: 'essential',
    capabilities: ['cap-table-click-row'],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nawait ui5.table.clickRow('myTableId', 0);",
  },
  {
    id: 'recipe-table-find-row',
    name: 'Table Find Row',
    description:
      'Locate a table row by matching column values. Returns the zero-based row index that can be passed to clickRow() or used in assertions.',
    domain: 'table',
    priority: 'essential',
    capabilities: ['cap-table-find-row-by-values'],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nconst rowIndex = await ui5.table.findRowByValues('myTableId', {\n  Material: 'MAT-001',\n  Plant: '1000',\n});",
  },
  {
    id: 'recipe-dialog-handling',
    name: 'Dialog Handling',
    description:
      'Wait for, confirm, or dismiss UI5 dialogs. Controls inside dialogs REQUIRE the searchOpenDialogs option to be found by the bridge.',
    domain: 'dialog',
    priority: 'essential',
    capabilities: [
      'cap-dialog-wait-for',
      'cap-dialog-confirm',
      'cap-dialog-dismiss',
      'cap-control-locate',
    ],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nawait ui5.dialog.waitFor();\nawait ui5.dialog.confirm();\nawait ui5.dialog.dismiss();\n\n// Controls inside dialogs REQUIRE searchOpenDialogs\nconst dialogInput = await ui5.control({ id: 'inputInsideDialog', searchOpenDialogs: true });",
  },
  {
    id: 'recipe-navigate-flp-tile',
    name: 'FLP Navigation',
    description:
      'Navigate to a Fiori Launchpad tile by its visible title. Waits for UI5 to stabilize after navigation.',
    domain: 'navigate',
    priority: 'essential',
    capabilities: ['cap-navigate-to-tile', 'cap-wait-for-ui5'],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nawait ui5Navigation.navigateToTile('My App Title');\nawait ui5.waitForUI5();",
  },
  {
    id: 'recipe-navigate-app-direct',
    name: 'App Navigation (Direct)',
    description:
      'Navigate directly to a Fiori app via semantic object, intent hash, or search. Bypasses the tile-click workflow when the target hash is known.',
    domain: 'navigate',
    priority: 'essential',
    capabilities: ['cap-navigate-to-app', 'cap-navigate-to-intent', 'cap-navigate-search-open-app'],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nawait ui5Navigation.navigateToApp('PurchaseOrder-manage');\nawait ui5Navigation.navigateToIntent('PurchaseOrder', { action: 'manage' });\nawait ui5Navigation.searchAndOpenApp('Purchase Order');",
  },
  {
    id: 'recipe-date-picker',
    name: 'Date Picker',
    description:
      'Set and read date values from sap.m.DatePicker and sap.m.DateRangeSelection controls. Dates use ISO 8601 format (YYYY-MM-DD).',
    domain: 'date',
    priority: 'recommended',
    capabilities: ['cap-date-set-picker', 'cap-date-get-picker', 'cap-date-set-range'],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nawait ui5.date.setDatePicker('deliveryDateField', '2026-01-15');\nconst dateValue = await ui5.date.getDatePicker('deliveryDateField');\nawait ui5.date.setDateRange('dateRangeField', '2026-01-01', '2026-12-31');",
  },
  {
    id: 'recipe-odata-query',
    name: 'OData Query',
    description:
      'Query an OData service for entities, wait for pending requests, and check for unsaved changes. Supports standard OData system query options ($filter, $top, $select, etc.).',
    domain: 'odata',
    priority: 'recommended',
    capabilities: [
      'cap-odata-query-entities',
      'cap-odata-wait-for-load',
      'cap-odata-has-pending-changes',
    ],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nconst serviceUrl = '/sap/opu/odata/sap/API_MATERIAL_SRV/';\nconst data = await ui5.odata.queryEntities(serviceUrl, 'A_Material', {\n  $filter: \"Material eq 'MAT-001'\",\n  $top: 10,\n});\nawait ui5.odata.waitForLoad();\nconst hasPending = await ui5.odata.hasPendingChanges();",
  },
  {
    id: 'recipe-assert-custom-matchers',
    name: 'Custom Matchers',
    description:
      'Playwright expect() extended with UI5-aware matchers for text, visibility, enabled state, properties, value state, row count, and cell text.',
    domain: 'assert',
    priority: 'recommended',
    capabilities: [
      'cap-assert-ui5-text',
      'cap-assert-ui5-visible',
      'cap-assert-ui5-enabled',
      'cap-assert-ui5-property',
      'cap-assert-ui5-value-state',
      'cap-assert-ui5-row-count',
      'cap-assert-ui5-cell-text',
    ],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nawait expect(locator).toHaveUI5Text('Expected text');\nawait expect(locator).toBeUI5Visible();\nawait expect(locator).toBeUI5Enabled();\nawait expect(locator).toHaveUI5Property('enabled', true);\nawait expect(locator).toHaveUI5ValueState('Success');\nawait expect(locator).toHaveUI5RowCount(5);\nawait expect(locator).toHaveUI5CellText(0, 2, 'MAT-001');",
  },
  {
    id: 'recipe-intent-operation',
    name: 'Intent Operation',
    description:
      'High-level intent API for business operations. Core intents map to individual UI actions; domain intents compose multiple steps into a single business operation.',
    domain: 'intent',
    priority: 'recommended',
    capabilities: [
      'cap-intent-fill-field',
      'cap-intent-click-button',
      'cap-intent-assert-field',
      'cap-intent-procurement-create-po',
    ],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\n// Core intents — single UI actions\nawait intent.core.fillField('Material', 'MAT-001');\nawait intent.core.clickButton('Save');\nawait intent.core.assertField('Status', 'Created');\n\n// Domain intents — composed business operations\nawait intent.procurement.createPurchaseOrder({\n  vendor: 'V001', material: 'MAT-001', quantity: 10, plant: '1000',\n});",
  },
  {
    id: 'recipe-ai-page-discovery',
    name: 'Page Discovery',
    description:
      'Use the AI fixture to discover the current page structure, list all available capabilities, or filter capabilities by category. Useful for dynamic test generation and self-healing agents.',
    domain: 'ai',
    priority: 'optional',
    capabilities: [
      'cap-ai-discover-page',
      'cap-ai-capabilities-for-ai',
      'cap-ai-capabilities-by-category',
    ],
    pattern:
      "import { test, expect } from 'playwright-praman';\n\nconst context = await pramanAI.discoverPage({ interactiveOnly: true });\nconst caps = pramanAI.capabilities.forAI();\nconst tableCaps = pramanAI.capabilities.byCategory('table');",
  },
] as const;
