# Claude Code Prompt for Generating Praman Tests

## System Context (from CLAUDE.md + AGENTS.md)

When Claude Code encounters a praman test generation task, it should have
access to the following from the repo's CLAUDE.md and AGENTS.md:

1. **Import**: `import { test, expect } from 'playwright-praman'` (ONLY valid import)
2. **Fixtures available**: ui5, sapAuth, ui5Navigation, ui5Footer, ui5Shell, fe, pramanAI, intent
3. **7 Mandatory Rules** from AGENTS.md
4. **Forbidden Patterns** table

## Sample Prompt

```
Write a Playwright test using praman that performs the following SAP scenario:

1. Navigate to the "Manage Purchase Orders" Fiori app
2. Search for purchase orders with status "Open"
3. Click on the first row in the results table
4. Change the delivery date to next month
5. Save the changes
6. Verify the success message appears

Use praman fixtures for ALL UI5 controls. Use Playwright native ONLY for
non-UI5 elements (if any). Follow the test.step() pattern for each step.
Auth is handled by the seed/setup project — do NOT include login code.
```

## Expected Claude Code Behavior

1. Claude reads CLAUDE.md → understands project rules
2. Claude reads AGENTS.md "For Test Writers" section → gets fixture API, mandatory rules, forbidden patterns
3. Claude generates code using ONLY praman fixtures for UI5 elements
4. Claude uses `test.step()` for each logical step
5. Claude does NOT use `page.click('#__...')` or `page.locator('.sapM...')`
6. Claude includes TSDoc compliance header

## Quality Checks Claude Code Should Perform

After generating the test, Claude Code should:

1. Run `npx playwright test <file> --list` to verify the test is parseable
2. Check for forbidden patterns (scan for `page.click`, `page.fill` with UI5 selectors)
3. Verify all fixtures are destructured from the test function parameter
4. Ensure `await ui5.waitForUI5()` is called after navigation and input changes
5. Verify `setValue()` + `fireChange()` pattern for inputs (not just `setValue()`)

## Verification Command

```bash
npx playwright test tests/e2e/my-test.spec.ts --list
```

If the test lists without errors, the structure is correct.
Running it requires a live SAP system connection.
