---
sidebar_position: 3
title: Dialog Handling
---

# Dialog Handling

Demonstrates how to open, interact with, and close SAP UI5 dialogs using Praman.

## Critical Pattern: `searchOpenDialogs`

```typescript
// Without searchOpenDialogs -- ONLY searches main view
const btn = await ui5.control({ id: 'myBtn' }); // Won't find dialog controls!

// With searchOpenDialogs -- searches dialogs too
const btn = await ui5.control({ id: 'myBtn', searchOpenDialogs: true }); // Correct
```

:::warning
Always use `searchOpenDialogs: true` when finding controls inside an `sap.m.Dialog`. Without it, `ui5.control()` only searches the main view and will throw `ERR_CONTROL_NOT_FOUND`.
:::

## Source

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Dialog Handling', () => {
  test('open dialog, fill fields, and dismiss', async ({ page, ui5 }) => {
    await test.step('Navigate to app', async () => {
      await page.goto(process.env['SAP_CLOUD_BASE_URL']!);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveTitle(/Home/, { timeout: 60_000 });

      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: 'My App' },
        });
      }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

      await ui5.waitForUI5();
    });

    await test.step('Open Create dialog', async () => {
      await ui5.press({
        controlType: 'sap.m.Button',
        properties: { text: 'Create' },
      });
      await ui5.waitForUI5();
    });

    await test.step('Verify dialog structure', async () => {
      // searchOpenDialogs: true is REQUIRED for dialog controls
      const nameField = await ui5.control({
        id: 'createDialog--nameField',
        searchOpenDialogs: true,
      });

      const controlType = await nameField.getControlType();
      expect(controlType).toBe('sap.ui.comp.smartfield.SmartField');

      const isRequired = await nameField.getRequired();
      expect(isRequired).toBe(true);
    });

    await test.step('Fill dialog fields', async () => {
      // ui5.fill() = atomic setValue + fireChange + waitForUI5
      await ui5.fill({ id: 'createDialog--nameInput', searchOpenDialogs: true }, 'Test Entry');
      await ui5.waitForUI5();

      const value = await ui5.getValue({
        id: 'createDialog--nameInput',
        searchOpenDialogs: true,
      });
      expect(value).toBe('Test Entry');
    });

    await test.step('Dismiss dialog with Cancel', async () => {
      await ui5.press({
        id: 'createDialog--cancelBtn',
        searchOpenDialogs: true,
      });
      await ui5.waitForUI5();

      // Verify dialog closed
      let dialogClosed = false;
      try {
        await ui5.control({
          id: 'createDialog--cancelBtn',
          searchOpenDialogs: true,
        });
      } catch {
        dialogClosed = true;
      }
      expect(dialogClosed).toBe(true);
    });
  });

  test('confirm dialog with value help', async ({ page, ui5 }) => {
    await test.step('Open value help dialog', async () => {
      await ui5.press({
        id: 'myField-input-vhi',
        searchOpenDialogs: true,
      });

      const vhDialog = await ui5.control({
        id: 'myField-input-valueHelpDialog',
        searchOpenDialogs: true,
      });
      const isOpen = await vhDialog.isOpen();
      expect(isOpen).toBe(true);
    });

    await test.step('Close value help dialog', async () => {
      const vhDialog = await ui5.control({
        id: 'myField-input-valueHelpDialog',
        searchOpenDialogs: true,
      });
      // close() calls the UI5 Dialog.close() method directly
      await vhDialog.close();
      await ui5.waitForUI5();
    });
  });
});
```

## Key Concepts

- **`searchOpenDialogs: true`** -- mandatory for any control inside a dialog
- **`ui5.fill()`** -- atomic `setValue()` + `fireChange()` + `waitForUI5()`
- **`isOpen()` / `close()`** -- UI5 Dialog lifecycle methods via proxy
- **Value help dialogs** are secondary dialogs that open from SmartField icons
