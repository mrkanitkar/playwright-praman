# Praman SAP Test Automation — Universal Agent Integration (AGENTS.md)

Append this to your project's `AGENTS.md` for universal AI agent support.

---

## SAP UI5 Test Generation with Praman

**Package**: `playwright-praman`
**Full skill reference**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

### The 7 Mandatory Rules

1. EVERY UI5 element → `ui5.control()` + proxy methods ONLY
2. NEVER use Playwright native selectors for UI5 elements (`page.click('#__...')`, `page.locator('.sapM...')`)
3. Non-UI5 elements → Playwright native permitted (verify element is NOT UI5 first)
4. `import { test, expect } from 'playwright-praman'` — the ONLY valid import
5. Auth via seed — raw Playwright auth in `tests/seeds/sap-seed.spec.ts`, NEVER `sapAuth.login()` in test body
6. Post-generation: scan against 16+ forbidden patterns before writing test
7. TSDoc compliance header in every generated test

### Test Template

```typescript
/**
 * {App Name} E2E Test
 *
 * COMPLIANCE: 100% Praman fixture-only
 * Forbidden Pattern Scan: PASSED
 */
import { test, expect } from 'playwright-praman';

test.describe('{App Name} Tests', () => {
  test('Complete scenario - single session', async ({
    page,
    ui5,
    ui5Navigation,
    ui5Footer,
    intent,
    fe,
  }) => {
    await test.step('Step 1: Navigate', async () => {
      await ui5Navigation.navigateToTile('App Name');
      await ui5.waitForUI5();
    });

    await test.step('Step 2: Fill form (gold pattern)', async () => {
      const input = await ui5.control({ id: 'materialInput' });
      await input.setValue('MAT-001');
      await input.fireChange({ value: 'MAT-001' });
      await ui5.waitForUI5();
    });

    await test.step('Step 3: Save and verify', async () => {
      await ui5Footer.clickSave();
      await ui5.dialog.confirm();
      await intent.core.assertField('Status', 'Created');
    });
  });
});
```

### Top Fixtures Quick Reference

```typescript
test('scenario', async ({ ui5, ui5Navigation, ui5Footer, sapAuth, intent, fe, pramanAI }) => {
  // Navigation
  await ui5Navigation.navigateToTile('My App');
  await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'create' });

  // Control interaction
  const btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create' } });
  await btn.press();

  // Input (ALWAYS: setValue + fireChange + waitForUI5)
  const input = await ui5.control({ id: 'myInput' });
  await input.setValue('value');
  await input.fireChange({ value: 'value' });
  await ui5.waitForUI5();

  // Table
  const rows = await ui5.table.getRows('myTable');
  await ui5.table.clickRow('myTable', 0);

  // Dialog
  await ui5.dialog.waitFor();
  await ui5.dialog.confirm();

  // Footer actions
  await ui5Footer.clickSave();
  await ui5Footer.clickEdit();

  // Fiori Elements
  await fe.listReport.setFilter('Status', 'Open');
  await fe.listReport.search();
  await fe.objectPage.clickEdit();
  await fe.objectPage.clickSave();
});
```

### Forbidden Patterns (Never Use for UI5)

| Forbidden                       | Replacement                    |
| ------------------------------- | ------------------------------ |
| `page.click('#__...')`          | `ui5.control().press()`        |
| `page.fill('#__...')`           | `ui5.control().setValue()`     |
| `page.locator('[data-sap-ui]')` | `ui5.control()`                |
| `page.locator('.sapM...')`      | `ui5.control({ controlType })` |
| `from '@playwright/test'`       | `from 'playwright-praman'`     |
| `from 'dhikraft'`               | `from 'playwright-praman'`     |
| `page.waitForTimeout(...)`      | `ui5.waitForUI5()` or polling  |
| `new UI5Handler(...)`           | Use fixture `ui5` directly     |
| `sapAuth.login()` in test       | Auth belongs in seed file only |

### Control Type → Method Lookup

| Control             | Method                                                            |
| ------------------- | ----------------------------------------------------------------- |
| `sap.m.Button`      | `.press()`                                                        |
| `sap.m.Input`       | `.setValue(v)` + `.fireChange({ value: v })` + `ui5.waitForUI5()` |
| `sap.m.Select`      | `.setSelectedKey(key)`                                            |
| `sap.m.ComboBox`    | `.open()` → `.setSelectedKey(key)` → `.close()`                   |
| `sap.m.CheckBox`    | `.press()`                                                        |
| `sap.m.DatePicker`  | `ui5.date.setDatePicker(id, '2026-01-15')`                        |
| `sap.m.Table`       | `ui5.table.getRows(id)` / `ui5.table.clickRow(id, row)`           |
| `sap.m.Dialog`      | `ui5.dialog.waitFor()` / `ui5.dialog.confirm()`                   |
| `sap.m.GenericTile` | `.press()` (FLP tile: `ui5Navigation.navigateToTile()`)           |

### Error Self-Correction

Praman throws typed `PramanError` subclasses. When you get a `ControlError`:

1. Read `error.suggestions[]` — contains specific fix advice
2. Read `error.availableControls` — shows what was actually on screen
3. Read `error.suggestedSelector` — Praman's best guess for the correct selector
4. Adjust your selector and retry — do NOT fall back to `page.locator()`

### Deep Reference

For complete fixture maps, V2/V4 patterns, and selector shapes:

```text
node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md
node_modules/playwright-praman/skills/playwright-praman-sap-testing/ai-quick-reference.md
node_modules/playwright-praman/skills/playwright-praman-sap-testing/test-template.ts
```
