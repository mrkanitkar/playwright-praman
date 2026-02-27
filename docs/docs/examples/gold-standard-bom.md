---
sidebar_position: 6
title: Gold Standard BOM E2E
---

# Gold Standard: BOM End-to-End Flow

A complete end-to-end test for SAP Bill of Material (BOM) maintenance using V1 SmartField controls (`sap.ui.comp`). This is the Praman **gold standard** -- demonstrating every major pattern in a single, realistic test.

## What This Example Covers

1. **FLP navigation** -- space tabs, tile press with auto-retry
2. **Create dialog** -- open, verify structure, check required fields
3. **Value help dialogs** -- open, read OData data, close
4. **ComboBox dropdown** -- get items, open/close, set selected key
5. **Form filling** -- `ui5.fill()` for inputs, `setSelectedKey()` for dropdowns
6. **Verification** -- read back all values before submission
7. **Error handling** -- graceful recovery from SAP validation errors
8. **Navigation confirmation** -- verify return to list report

## Discovery Results

- **UI5 Version**: 1.142.x
- **App**: Maintain Bill of Material (Fiori Elements V2 List Report)
- **System**: SAP S/4HANA Cloud
- **OData**: V2 with SmartField controls (`sap.ui.comp.smartfield.SmartField`)

## Source (Abbreviated)

The full source is available at `examples/bom-e2e-praman-gold-standard.spec.ts` (720+ lines). Key excerpts below.

### Control ID Constants

```typescript
const IDS = {
  materialField: 'createBOMFragment--material',
  materialInput: 'createBOMFragment--material-input',
  materialVHIcon: 'createBOMFragment--material-input-vhi',
  materialVHDialog: 'createBOMFragment--material-input-valueHelpDialog',
  materialVHTable: 'createBOMFragment--material-input-valueHelpDialog-table',
  plantField: 'createBOMFragment--plant',
  plantInput: 'createBOMFragment--plant-input',
  plantVHIcon: 'createBOMFragment--plant-input-vhi',
  plantVHDialog: 'createBOMFragment--plant-input-valueHelpDialog',
  plantVHTable: 'createBOMFragment--plant-input-valueHelpDialog-table',
  bomUsageField: 'createBOMFragment--variantUsage',
  bomUsageCombo: 'createBOMFragment--variantUsage-comboBoxEdit',
  okBtn: 'createBOMFragment--OkBtn',
  cancelBtn: 'createBOMFragment--CancelBtn',
} as const;
```

### Step 1: Navigate to App

```typescript
await test.step('Step 1: Navigate to BOM Maintenance App', async () => {
  await page.goto(process.env.SAP_CLOUD_BASE_URL!);
  await page.waitForLoadState('domcontentloaded');
  await expect(page).toHaveTitle(/Home/, { timeout: 60_000 });

  // FLP space tabs -- DOM click is the only reliable method
  await page.getByText('Bills Of Material', { exact: true }).click();

  // Tile press with auto-retry (waitForUI5 can time out on slow systems)
  await expect(async () => {
    await ui5.press({
      controlType: 'sap.m.GenericTile',
      properties: { header: 'Maintain Bill Of Material' },
    });
  }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

  // Wait for Create BOM button to prove app loaded
  await expect(async () => {
    const createBtn = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'Create BOM' },
    });
    expect(await createBtn.getProperty('text')).toBe('Create BOM');
  }).toPass({ timeout: 120_000, intervals: [5000, 10_000] });
});
```

### Step 3: Value Help Pattern

```typescript
await test.step('Step 3: Test Material Value Help', async () => {
  // Open value help via icon
  await ui5.press({ id: IDS.materialVHIcon, searchOpenDialogs: true });

  // Verify dialog opened
  const dialog = await ui5.control({ id: IDS.materialVHDialog, searchOpenDialogs: true });
  expect(await dialog.isOpen()).toBe(true);

  // Get inner table via SmartTable.getTable()
  const smartTable = await ui5.control({ id: IDS.materialVHTable, searchOpenDialogs: true });
  const innerTable = await smartTable.getTable();
  const rows = await innerTable.getRows();
  expect(rows.length).toBeGreaterThan(0);

  // Wait for OData data with Playwright auto-retry
  await expect(async () => {
    let count = 0;
    for (const row of rows) {
      if (await row.getBindingContext()) count++;
    }
    expect(count).toBeGreaterThan(0);
  }).toPass({ timeout: 60_000, intervals: [1000, 2000, 5000] });

  await dialog.close();
  await ui5.waitForUI5();
});
```

### Step 6: Form Fill with Verification

```typescript
await test.step('Step 6: Fill Form with Valid Data', async () => {
  // Get material value from value help OData
  const smartTable = await ui5.control({ id: IDS.materialVHTable, searchOpenDialogs: true });
  const innerTable = await smartTable.getTable();
  const ctx = await innerTable.getContextByIndex(0);
  const entity = await ctx.getObject();
  const materialValue = entity.Material;

  // Fill using ui5.fill() -- atomic setValue + fireChange + waitForUI5
  await ui5.fill({ id: IDS.materialInput, searchOpenDialogs: true }, materialValue);

  // Set ComboBox by key (localization-safe)
  const bomUsageCombo = await ui5.control({ id: IDS.bomUsageCombo, searchOpenDialogs: true });
  await bomUsageCombo.setSelectedKey('1');
  await bomUsageCombo.fireChange({ value: '1' });

  // Verify all values before submission
  expect(await ui5.getValue({ id: IDS.materialInput, searchOpenDialogs: true })).toBe(
    materialValue,
  );
});
```

## Compliance Report

| Metric                      | Value                                                 |
| --------------------------- | ----------------------------------------------------- |
| Controls discovered         | 15+                                                   |
| UI5 elements interacted     | 15+                                                   |
| Praman fixture usage        | 100%                                                  |
| Playwright native usage     | 0% (except `page.goto`, `page.getByText` for FLP tab) |
| Forbidden patterns detected | 0                                                     |

## Key Patterns Demonstrated

- **`expect().toPass()`** -- auto-retry for slow SAP systems
- **`getTable()` on SmartTable** -- access the inner table for row operations
- **`getContextByIndex().getObject()`** -- data-driven testing via OData binding
- **`setSelectedKey()` for ComboBox** -- localization-safe (no text matching)
- **`ui5.fill()`** -- atomic `setValue()` + `fireChange()` + `waitForUI5()`
- **Graceful error recovery** -- check for MessagePopover and MessageBox after actions
