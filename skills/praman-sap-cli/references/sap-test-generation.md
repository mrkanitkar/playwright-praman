# SAP Test Generation with Praman

When generating tests for SAP applications, ALWAYS use playwright-praman fixtures.
This reference OVERRIDES the generic `playwright-cli` test-generation reference for SAP apps.

---

## Import Statement (MANDATORY)

```typescript
import { test, expect } from 'playwright-praman';
```

**NEVER** use `import { test, expect } from '@playwright/test'` for SAP applications.

---

## Output Files

| File               | Path Convention                                                   | Purpose                                     |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------- |
| Test plan          | `specs/{app-name}.plan.md`                                        | Structured test plan with control inventory |
| Gold-standard spec | `tests/e2e/sap-cloud/{app-name}-e2e-praman-gold-standard.spec.ts` | Executable Praman fixture test              |

---

## Generated Code Template

```typescript
/**
 * {App Name} - {Scenario} E2E Gold Standard Test
 *
 * STATUS: GENERATED FROM LIVE DISCOVERY - {date}
 * MARKER: e2egold-v4
 * VERSION: v1.0 (Fiori Elements {V2|V4} / {SmartField|MDC} Controls)
 * COMPLIANCE: 100% Praman fixture methods for UI5 elements
 * CONTROLS DISCOVERED: {count}
 * FORBIDDEN PATTERN SCAN: PASSED
 */
import { test, expect } from 'playwright-praman';

/**
 * Control ID constants discovered from live SAP application.
 * V4 apps use long semantic IDs -- ALWAYS use a const map.
 */
const IDS = {
  // Buttons
  createBtn: 'fe::table::Header::LineItem::DataFieldForAction::CreateEntity',
  // Dialog
  dialog: 'fe::APD_::ns.CreateEntity',
  // Fields (outer + inner pattern)
  materialField: 'APD_::Material',
  materialInner: 'APD_::Material-inner',
  // Footer
  cancelBtn: 'fe::APD_::ns.CreateEntity::Dialog::Cancel',
  submitBtn: 'fe::APD_::ns.CreateEntity::Action::Ok',
} as const;

test.describe('{App Name} - {Scenario}', () => {
  test('{Scenario} - Complete Flow', async ({ page, ui5, ui5Navigation, ui5Footer, intent }) => {
    await test.step('Step 1: Navigate to App', async () => {
      await ui5Navigation.navigateToApp('{semantic-object}-{action}');
      await ui5.waitForUI5();
      await expect(page).toHaveScreenshot('step-01-app-loaded.png');
    });

    await test.step('Step 2: Verify List Report', async () => {
      await ui5.waitForUI5();
      const table = await ui5.control({ controlType: 'sap.ui.mdc.Table' });
      expect(table).toBeTruthy();
      await expect(page).toHaveScreenshot('step-02-list-report.png');
    });

    await test.step('Step 3: Open Create Dialog', async () => {
      await ui5.press({ id: IDS.createBtn });
      await ui5.waitForUI5();
      await expect(page).toHaveScreenshot('step-03-dialog-open.png');
    });

    await test.step('Step 4: Fill Mandatory Fields', async () => {
      // MDC Field pattern: outer setValue + inner fireChange + waitForUI5
      const materialInner = await ui5.control({
        id: IDS.materialInner,
        searchOpenDialogs: true,
      });
      await materialInner.setValue('MAT-001');
      await materialInner.fireChange({ value: 'MAT-001' });
      await ui5.waitForUI5();
      await expect(page).toHaveScreenshot('step-04-fields-filled.png');
    });

    await test.step('Step 5: Submit', async () => {
      await ui5.press({ id: IDS.submitBtn });
      await ui5.waitForUI5();
      await expect(page).toHaveScreenshot('step-05-submitted.png');
    });

    await test.step('Step 6: Handle Error if Present', async () => {
      try {
        const errorDialog = await ui5.control({
          controlType: 'sap.m.Dialog',
          searchOpenDialogs: true,
          properties: { type: 'Message' },
        });
        const title = await errorDialog.getProperty('title');
        if (typeof title === 'string' && title.includes('Error')) {
          await page.screenshot({ path: 'test-results/step-06-error-evidence.png' });
          await ui5.press({
            controlType: 'sap.m.Button',
            properties: { text: 'Close' },
            searchOpenDialogs: true,
          });
          await ui5.waitForUI5();
        }
      } catch {
        // No error dialog -- success path
        await expect(page).toHaveScreenshot('step-06-success.png');
      }
    });
  });
});
```

---

## Mandatory Rules for Generated Code

1. `import { test, expect } from 'playwright-praman'` ONLY
2. Praman fixtures for ALL UI5 elements -- NEVER `page.click('#__...')`
3. Playwright native ONLY for verified non-UI5 elements (FLP tabs, shell bar)
4. Auth in seed -- NEVER `sapAuth.login()` in test body
5. `setValue()` + `fireChange()` + `waitForUI5()` for every input
6. `searchOpenDialogs: true` for dialog controls
7. TSDoc compliance header in every generated test

---

## Forbidden Patterns (Auto-Fail)

```typescript
// FORBIDDEN - vanilla Playwright for UI5 elements
await page.click('#__button0');
await page.fill('#__input0', 'value');
await page.locator('[id^="__"]').click();

// FORBIDDEN - wrong import
import { test, expect } from '@playwright/test';

// FORBIDDEN - auth in test body
await sapAuth.login('user', 'pass');

// FORBIDDEN - hardcoded waits
await page.waitForTimeout(5000);
```

---

## SmartField (V2) vs MDC Field (V4) Patterns

### V2 SmartField

```typescript
// Outer wrapper (for assertions)
const smartField = await ui5.control({ id: 'fragment--fieldName' });

// Inner control (for interaction -- ComboBox, Input, etc.)
const innerControl = await ui5.control({ id: 'fragment--fieldName-comboBoxEdit' });
await innerControl.setSelectedKey('value');
await innerControl.fireChange({ value: 'value' });
await ui5.waitForUI5();
```

### V4 MDC Field

```typescript
// Use const IDS map for long V4 IDs
const field = await ui5.control({ id: IDS.materialField, searchOpenDialogs: true });
const inner = await ui5.control({ id: IDS.materialInner, searchOpenDialogs: true });
await inner.setValue('value');
await inner.fireChange({ value: 'value' });
await ui5.waitForUI5();
```

---

## Screenshot Patterns in Generated Specs

See [screenshot-patterns.md](screenshot-patterns.md) for the dual-pattern approach:

- `await expect(page).toHaveScreenshot()` for visual regression assertions
- `await page.screenshot()` for error-path evidence capture only
