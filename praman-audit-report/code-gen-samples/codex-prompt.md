# OpenAI Codex / Copilot Prompt for Generating Praman Tests

## Context: AGENTS.md

Codex reads AGENTS.md before every task. Praman's AGENTS.md provides:

1. **Architecture**: 5-layer, ≤300 LOC per module
2. **14 Rules** for contributors
3. **7 Mandatory Rules** for test writers
4. **Fixture Quick Reference** table with key methods per fixture
5. **Forbidden Patterns** table with replacements
6. **Error Self-Correction** guide

## Sample Codex Prompt

```
# Task: Generate SAP UI5 test with praman

Using the playwright-praman plugin, write a test that:
- Opens the Fiori Launchpad and clicks the "Manage Sales Orders" tile
- Filters the list by status "Completed"
- Reads the table data and verifies at least 5 rows exist
- Opens the first sales order and checks the customer name

## Rules
- Import ONLY from 'playwright-praman'
- Use ui5.control() for ALL UI5 elements
- Use page.locator() ONLY for verified non-UI5 elements
- Use test.step() for each logical step
- Call ui5.waitForUI5() after navigation and input changes

## Available Fixtures
- ui5: control(), controls(), click(), fill(), waitForUI5()
- ui5.table: getRows(id), clickRow(id, row), getCellValue(id, row, col)
- ui5Navigation: navigateToTile(title), navigateToApp(intent)
- intent.core: assertField(label, expected)
- fe.listReport: setFilter(field, value), search()
```

## Expected Codex Output Quality

Codex should produce code that:

1. Uses `import { test, expect } from 'playwright-praman'` as first line
2. Destructures required fixtures in the test function parameter
3. Uses praman fixture methods (NOT page.click/page.fill for UI5)
4. Follows test.step() pattern
5. Includes proper assertions using expect()

## Copilot Autocomplete

With praman installed in a project, Copilot should autocomplete:

- `ui5.` → shows control(), controls(), click(), fill(), waitForUI5()
- `ui5.table.` → shows getRows(), clickRow(), getCellValue()
- `ui5Navigation.` → shows navigateToTile(), navigateToApp()
- `await ui5.control({` → suggests controlType, id, properties, viewName

TypeScript types provide full IntelliSense for all fixture methods.
