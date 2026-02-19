/**
 * BOM Complete End-to-End Test Flow — Praman v1.0
 *
 * @remarks
 * Adapted from dhikraft gold standard (1 Feb 2026) to use playwright-praman.
 * All UI5 interactions use the Praman ui5 fixture (UI5Handler + proxy chain).
 * Smart waits replace page.waitForTimeout() per Praman Principle 8.
 *
 * Steps:
 * 1. Navigate to BOM app
 * 2. Open Create BOM dialog
 * 3. Test Material value help
 * 4. Test Plant value help
 * 5. Test BOM Usage dropdown
 * 6. Fill form with valid data
 * 7. Click Create button (validates and creates)
 * 8. Verify return to BOM list
 */

import { test, expect } from 'playwright-praman';

test.describe('BOM End-to-End Flow', () => {
  test('Complete BOM Flow - Single Session', async ({ page, ui5 }) => {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Navigate to BOM Maintenance App
    // ═══════════════════════════════════════════════════════════════
    await test.step('Step 1: Navigate to BOM Maintenance App', async () => {
      await page.goto(process.env['SAP_CLOUD_BASE_URL']!);
      await page.waitForLoadState('domcontentloaded');
      await ui5.waitForUI5();

      // Verify FLP Home loaded
      await expect(page).toHaveTitle(/Home/);

      // Dismiss "Important News" dialog if present (S/4HANA Cloud system notices)
      const closeDialogBtn = page.getByRole('button', { name: 'Close' }).first();
      if (await closeDialogBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeDialogBtn.click();
        await ui5.waitForUI5();
      }

      // Navigate to Bills Of Material space (FLP shell tab)
      await page.getByRole('tab', { name: 'Bills Of Material', exact: true }).click();
      await ui5.waitForUI5();

      // Click Maintain Bill Of Material tile (tiles lazy-load after tab switch)
      // Use Playwright locator — FLP Spaces/Pages tiles may not be sap.m.GenericTile
      await page
        .getByRole('listitem', { name: /Create, change & display BOMs/i })
        .first()
        .click();

      // Wait for Create BOM button to appear (proves app loaded)
      const createBtn = await ui5.control(
        {
          controlType: 'sap.m.Button',
          properties: { text: 'Create BOM' },
        },
        { timeout: 60000 },
      );

      const btnText = await createBtn.getProperty('text');
      expect(btnText).toBe('Create BOM');
      test.info().annotations.push({
        type: 'info',
        description: 'Step 1: Navigate to BOM Maintenance App - PASSED',
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Open Create BOM Dialog (Using UI5 Methods Only)
    // ═══════════════════════════════════════════════════════════════
    await test.step('Step 2: Open Create BOM Dialog', async () => {
      const createBtn = await ui5.control({
        controlType: 'sap.m.Button',
        properties: { text: 'Create BOM' },
      });
      await createBtn.press();
      await ui5.waitForUI5();

      // Verify dialog opened — Material field is visible (SmartField renders as inner Input)
      const materialField = await ui5.control(
        { id: 'createBOMFragment--material' },
        { timeout: 10000 },
      );
      const materialType = await materialField.getControlType();
      expect(materialType).toBeTruthy();

      // Verify Cancel button exists and is enabled
      const cancelDialogBtn = await ui5.control({ id: 'createBOMFragment--CancelBtn' });
      const cancelBtnEnabled = await cancelDialogBtn.getProperty('enabled');
      expect(cancelBtnEnabled).toBe(true);

      // Verify BOM Usage field exists (SmartField may render as inner ComboBox)
      const bomUsageField = await ui5.control({ id: 'createBOMFragment--variantUsage' });
      const bomUsageType = await bomUsageField.getControlType();
      expect(bomUsageType).toMatch(/sap\.ui\.comp\.smartfield/);

      // Verify Create and Cancel buttons
      const createDialogBtn = await ui5.control({ id: 'createBOMFragment--OkBtn' });
      const createBtnText = await createDialogBtn.getProperty('text');
      const cancelBtnText = await cancelDialogBtn.getProperty('text');
      expect(createBtnText).toBe('Create');
      expect(cancelBtnText).toBe('Cancel');

      test
        .info()
        .annotations.push({ type: 'info', description: 'Step 2: Open Create BOM Dialog - PASSED' });
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Test Material Value Help (Using Praman Proxy Chain)
    // ═══════════════════════════════════════════════════════════════
    await test.step('Step 3: Test Material Value Help', async () => {
      const materialVHIcon = await ui5.control({ id: 'createBOMFragment--material-input-vhi' });
      await materialVHIcon.press();
      await ui5.waitForUI5();

      // Wait for value help dialog to open
      const materialDialog = await ui5.control(
        { id: 'createBOMFragment--material-input-valueHelpDialog' },
        { timeout: 10000 },
      );
      const dialogExists = await materialDialog.isOpen();
      expect(dialogExists).toBe(true);

      // Click Go to trigger OData data load
      const goBtn = page.getByRole('button', { name: 'Go' });
      if (await goBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await goBtn.click();
      }

      // Wait for grid data to appear in DOM
      await expect(page.getByRole('gridcell').first()).toBeVisible({ timeout: 30000 });
      await ui5.waitForUI5();

      // Get inner table via proxy chain: SmartTable → getTable() → sap.ui.table.Table
      const smartTable = await ui5.control({
        id: 'createBOMFragment--material-input-valueHelpDialog-table',
      });
      const innerTable = await smartTable.getTable();

      // Wait for table's row binding to have data (OData response fully processed by UI5 model)
      const innerTableId = await innerTable.getId();
      await page.waitForFunction(
        `(function() {
                var bridge = window.__praman_bridge;
                if (!bridge) return false;
                var table = bridge.getById(${JSON.stringify(innerTableId)});
                if (!table) return false;
                var binding = table.getBinding('rows');
                return !!(binding && binding.getLength() > 0);
            })()`,
        undefined,
        { timeout: 30000 },
      );
      await ui5.waitForUI5();

      // Verify rows have binding contexts via proxy chain
      // Retry if execution context is destroyed (FLP hash navigation can briefly disrupt evaluations)
      let rowCount = 0;
      for (let attempt = 0; attempt < 3 && rowCount === 0; attempt++) {
        try {
          const rows = (await innerTable.getRows()) as unknown[];
          for (const row of rows) {
            const ctx = await (
              row as { getBindingContext: () => Promise<unknown> }
            ).getBindingContext();
            if (ctx) rowCount++;
          }
        } catch (e) {
          if (String(e).includes('Execution context was destroyed') && attempt < 2) {
            await page.waitForLoadState('domcontentloaded');
            await ui5.waitForUI5();
            continue;
          }
          throw e;
        }
      }

      expect(rowCount).toBeGreaterThan(0);
      test.info().annotations.push({
        type: 'info',
        description: `Step 3: Found ${rowCount} materials in value help`,
      });

      await materialDialog.close();
      await ui5.waitForUI5();
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Test Plant Value Help (Using Praman Proxy Chain)
    // ═══════════════════════════════════════════════════════════════
    await test.step('Step 4: Test Plant Value Help', async () => {
      const plantVHIcon = await ui5.control({ id: 'createBOMFragment--plant-input-vhi' });
      await plantVHIcon.press();
      await ui5.waitForUI5();

      const plantDialog = await ui5.control(
        { id: 'createBOMFragment--plant-input-valueHelpDialog' },
        { timeout: 10000 },
      );
      const dialogExists = await plantDialog.isOpen();
      expect(dialogExists).toBe(true);

      // Click Go to trigger OData data load
      const goBtn = page.getByRole('button', { name: 'Go' });
      if (await goBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await goBtn.click();
      }

      // Wait for grid data to appear in DOM
      await expect(page.getByRole('gridcell').first()).toBeVisible({ timeout: 30000 });
      await ui5.waitForUI5();

      const plantSmartTable = await ui5.control({
        id: 'createBOMFragment--plant-input-valueHelpDialog-table',
      });
      const plantInnerTable = await plantSmartTable.getTable();

      // Wait for table's row binding to have data
      const plantTableId = await plantInnerTable.getId();
      await page.waitForFunction(
        `(function() {
                var bridge = window.__praman_bridge;
                if (!bridge) return false;
                var table = bridge.getById(${JSON.stringify(plantTableId)});
                if (!table) return false;
                var binding = table.getBinding('rows');
                return !!(binding && binding.getLength() > 0);
            })()`,
        undefined,
        { timeout: 30000 },
      );
      await ui5.waitForUI5();

      // Verify rows have binding contexts via proxy chain (retry on navigation)
      let rowCount = 0;
      for (let attempt = 0; attempt < 3 && rowCount === 0; attempt++) {
        try {
          const plantRows = (await plantInnerTable.getRows()) as unknown[];
          for (const row of plantRows) {
            const ctx = await (
              row as { getBindingContext: () => Promise<unknown> }
            ).getBindingContext();
            if (ctx) rowCount++;
          }
        } catch (e) {
          if (String(e).includes('Execution context was destroyed') && attempt < 2) {
            await page.waitForLoadState('domcontentloaded');
            await ui5.waitForUI5();
            continue;
          }
          throw e;
        }
      }

      expect(rowCount).toBeGreaterThan(0);
      test.info().annotations.push({
        type: 'info',
        description: `Step 4: Found ${rowCount} plants in value help`,
      });

      await plantDialog.close();
      await ui5.waitForUI5();
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Test BOM Usage Dropdown (Using Praman Proxy Chain)
    // ═══════════════════════════════════════════════════════════════
    await test.step('Step 5: Test BOM Usage Dropdown', async () => {
      const bomUsageCombo = await ui5.control({
        id: 'createBOMFragment--variantUsage-comboBoxEdit',
      });

      // Get items via proxy chain
      const rawItems = await bomUsageCombo.getItems();
      const items: Array<{ key: string; text: string }> = [];
      if (Array.isArray(rawItems)) {
        for (let i = 0; i < rawItems.length; i++) {
          const itemProxy = rawItems[i];
          const key = await itemProxy.getKey();
          const text = await itemProxy.getText();
          items.push({ key: String(key), text: String(text) });
        }
      }

      expect(items.length).toBeGreaterThan(0);
      test.info().annotations.push({
        type: 'info',
        description: `Step 5: Found ${items.length} BOM usage types`,
      });

      // Open, verify, close
      await bomUsageCombo.open();
      await ui5.waitForUI5();
      const isOpen = await bomUsageCombo.isOpen();
      expect(isOpen).toBe(true);

      await bomUsageCombo.close();
      await ui5.waitForUI5();
      const isOpenAfterClose = await bomUsageCombo.isOpen();
      expect(!isOpenAfterClose).toBe(true);
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Fill Form with Valid Data (Using Praman Proxy Chain)
    // ═══════════════════════════════════════════════════════════════
    await test.step('Step 6: Fill Form with Valid Data', async () => {
      // === FILL MATERIAL ===
      const materialVHIcon = await ui5.control({ id: 'createBOMFragment--material-input-vhi' });
      await materialVHIcon.press();
      await ui5.waitForUI5();

      // Wait for value help dialog
      const materialDialogControl = await ui5.control(
        { id: 'createBOMFragment--material-input-valueHelpDialog' },
        { timeout: 15000 },
      );
      expect(await materialDialogControl.isOpen()).toBe(true);

      // Click Go to trigger OData data load
      const matGoBtn = page.getByRole('button', { name: 'Go' });
      if (await matGoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await matGoBtn.click();
      }
      await expect(page.getByRole('gridcell').first()).toBeVisible({ timeout: 30000 });
      await ui5.waitForUI5();

      // Get inner table and wait for row binding data
      const smartTableMat = await ui5.control({
        id: 'createBOMFragment--material-input-valueHelpDialog-table',
      });
      const innerTableMat = await smartTableMat.getTable();
      const matTableId = await innerTableMat.getId();
      await page.waitForFunction(
        `(function() {
                var bridge = window.__praman_bridge;
                if (!bridge) return false;
                var table = bridge.getById(${JSON.stringify(matTableId)});
                if (!table) return false;
                var binding = table.getBinding('rows');
                return !!(binding && binding.getLength() > 0);
            })()`,
        undefined,
        { timeout: 30000 },
      );

      await ui5.waitForUI5();

      // Extract first material value via proxy chain (retry on navigation)
      let materialValue: { success: boolean; material?: string; error?: string } = {
        success: false,
        error: 'No material found',
      };
      for (let attempt = 0; attempt < 3 && !materialValue.success; attempt++) {
        try {
          const matRows = (await innerTableMat.getRows()) as unknown[];
          for (const row of matRows) {
            const ctx = await (
              row as { getBindingContext: () => Promise<unknown> }
            ).getBindingContext();
            if (ctx) {
              const cells = await (row as { getCells: () => Promise<unknown[]> }).getCells();
              if (Array.isArray(cells) && cells.length > 0) {
                const cellText = await (cells[0] as { getText: () => Promise<string> }).getText();
                if (cellText) {
                  materialValue = { success: true, material: String(cellText) };
                  break;
                }
              }
            }
          }
        } catch (e) {
          if (String(e).includes('Execution context was destroyed') && attempt < 2) {
            await page.waitForLoadState('domcontentloaded');
            await ui5.waitForUI5();
            continue;
          }
          throw e;
        }
      }

      test.info().annotations.push({
        type: 'info',
        description: `Material value: ${JSON.stringify(materialValue)}`,
      });

      if (materialValue.success && materialValue.material) {
        await materialDialogControl.close();
        await ui5.waitForUI5();

        const materialInput = await ui5.control({ id: 'createBOMFragment--material-input' });
        await materialInput.setValue(materialValue.material);
        await materialInput.fireChange({ value: materialValue.material });
        await ui5.waitForUI5();
      }

      // === FILL PLANT ===
      const plantVHIcon = await ui5.control({ id: 'createBOMFragment--plant-input-vhi' });
      await plantVHIcon.press();
      await ui5.waitForUI5();

      const plantDialogControl = await ui5.control(
        { id: 'createBOMFragment--plant-input-valueHelpDialog' },
        { timeout: 15000 },
      );
      expect(await plantDialogControl.isOpen()).toBe(true);

      // Click Go to trigger OData data load
      const plantGoBtn = page.getByRole('button', { name: 'Go' });
      if (await plantGoBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await plantGoBtn.click();
      }
      await expect(page.getByRole('gridcell').first()).toBeVisible({ timeout: 30000 });
      await ui5.waitForUI5();

      // Get inner table and wait for row binding data
      const smartTablePlant = await ui5.control({
        id: 'createBOMFragment--plant-input-valueHelpDialog-table',
      });
      const innerTablePlant = await smartTablePlant.getTable();
      const plantTableId6 = await innerTablePlant.getId();
      await page.waitForFunction(
        `(function() {
                var bridge = window.__praman_bridge;
                if (!bridge) return false;
                var table = bridge.getById(${JSON.stringify(plantTableId6)});
                if (!table) return false;
                var binding = table.getBinding('rows');
                return !!(binding && binding.getLength() > 0);
            })()`,
        undefined,
        { timeout: 30000 },
      );

      await ui5.waitForUI5();

      // Extract first plant value via proxy chain (retry on navigation)
      let plantValue: { success: boolean; plant?: string; error?: string } = {
        success: false,
        error: 'No plant found',
      };
      for (let attempt = 0; attempt < 3 && !plantValue.success; attempt++) {
        try {
          const plantRows = (await innerTablePlant.getRows()) as unknown[];
          for (const row of plantRows) {
            const ctx = await (
              row as { getBindingContext: () => Promise<unknown> }
            ).getBindingContext();
            if (ctx) {
              const cells = await (row as { getCells: () => Promise<unknown[]> }).getCells();
              if (Array.isArray(cells) && cells.length > 0) {
                const cellText = await (cells[0] as { getText: () => Promise<string> }).getText();
                if (cellText) {
                  plantValue = { success: true, plant: String(cellText) };
                  break;
                }
              }
            }
          }
        } catch (e) {
          if (String(e).includes('Execution context was destroyed') && attempt < 2) {
            await page.waitForLoadState('domcontentloaded');
            await ui5.waitForUI5();
            continue;
          }
          throw e;
        }
      }

      test.info().annotations.push({
        type: 'info',
        description: `Plant value: ${JSON.stringify(plantValue)}`,
      });

      if (plantValue.success && plantValue.plant) {
        await plantDialogControl.close();
        await ui5.waitForUI5();

        const plantInput = await ui5.control({ id: 'createBOMFragment--plant-input' });
        await plantInput.setValue(plantValue.plant);
        await plantInput.fireChange({ value: plantValue.plant });
        await ui5.waitForUI5();
      }

      // === FILL BOM USAGE ===
      const bomUsageControl = await ui5.control({
        id: 'createBOMFragment--variantUsage-comboBoxEdit',
      });
      await bomUsageControl.open();
      await ui5.waitForUI5();

      await bomUsageControl.setSelectedKey('1');
      await bomUsageControl.fireChange({ value: '1' });
      await bomUsageControl.close();
      await ui5.waitForUI5();

      // Verify selected value
      const selectedKey = await bomUsageControl.getSelectedKey();
      expect(selectedKey).toBe('1');

      // === VERIFY ALL VALUES ===
      const materialInputCtrl = await ui5.control({ id: 'createBOMFragment--material-input' });
      const plantInputCtrl = await ui5.control({ id: 'createBOMFragment--plant-input' });
      const bomUsageCtrl = await ui5.control({
        id: 'createBOMFragment--variantUsage-comboBoxEdit',
      });
      const createBtnCtrl = await ui5.control({ id: 'createBOMFragment--OkBtn' });

      const finalVerification = {
        materialValue: (await materialInputCtrl.getValue()) || '',
        plantValue: (await plantInputCtrl.getValue()) || '',
        bomUsageKey: (await bomUsageCtrl.getSelectedKey()) || '',
        createBtnEnabled: (await createBtnCtrl.getEnabled()) || false,
        createBtnVisible: (await createBtnCtrl.getVisible()) || false,
      };

      test.info().annotations.push({
        type: 'info',
        description: `Final verification: Material=${finalVerification.materialValue}, Plant=${finalVerification.plantValue}, BOMUsage=${finalVerification.bomUsageKey}`,
      });

      expect(finalVerification.materialValue).toBe(materialValue.material);
      expect(finalVerification.plantValue).toBe(plantValue.plant);
      expect(finalVerification.bomUsageKey).toBe('1');

      test.info().annotations.push({
        type: 'info',
        description: 'Step 6: Fill Form with Valid Data - PASSED',
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 7: Click Create Button (Using UI5 Methods Only)
    // ═══════════════════════════════════════════════════════════════
    await test.step('Step 7: Click Create Button', async () => {
      const createBtn = await ui5.control({ id: 'createBOMFragment--OkBtn' });
      const createBtnText = await createBtn.getProperty('text');
      const createBtnEnabled = await createBtn.getProperty('enabled');

      expect(createBtnText).toBe('Create');
      expect(createBtnEnabled).toBe(true);

      await createBtn.press();
      await ui5.waitForUI5();

      // Check if dialog is still open (indicates validation error)
      let dialogStillOpen = false;
      let fieldValues = { material: '', plant: '', bomUsage: '' };
      try {
        const okBtnCheck = await ui5.control({ id: 'createBOMFragment--OkBtn' });
        const isEnabled = await okBtnCheck.getEnabled();
        dialogStillOpen = isEnabled !== undefined;

        if (dialogStillOpen) {
          const materialCtrl = await ui5.control({ id: 'createBOMFragment--material-input' });
          const plantCtrl = await ui5.control({ id: 'createBOMFragment--plant-input' });
          const bomUsageCtrl = await ui5.control({
            id: 'createBOMFragment--variantUsage-comboBoxEdit',
          });
          fieldValues = {
            material: (await materialCtrl.getValue()) || '',
            plant: (await plantCtrl.getValue()) || '',
            bomUsage: (await bomUsageCtrl.getSelectedKey()) || '',
          };
        }
      } catch {
        dialogStillOpen = false;
      }

      // Check for validation messages
      let messageChecks = {
        hasMessagePopover: false,
        hasMessageBox: false,
        errorMessages: [] as string[],
      };
      try {
        const messagePopovers = await ui5
          .control({
            controlType: 'sap.m.MessagePopover',
            properties: { visible: true },
          })
          .catch(() => null);

        if (messagePopovers) {
          const isOpen = await messagePopovers.isOpen().catch(() => false);
          messageChecks.hasMessagePopover = !!isOpen;

          if (isOpen) {
            const items = (await messagePopovers.getItems().catch(() => [])) as unknown[];
            if (Array.isArray(items) && items.length > 0) {
              for (const item of items) {
                const title = await (item as { getTitle?: () => Promise<string> })
                  .getTitle?.()
                  .catch(() => '');
                if (title) messageChecks.errorMessages.push(title);
              }
            }
          }
        }
      } catch {
        // Message checks failed — continue
      }

      const validationResult = { ...messageChecks, dialogStillOpen, fieldValues };
      test.info().annotations.push({
        type: 'info',
        description: `Validation: ${JSON.stringify(validationResult)}`,
      });

      if (validationResult.dialogStillOpen) {
        test.info().annotations.push({
          type: 'error',
          description: 'Dialog still open — validation failed!',
        });
        await page.screenshot({ path: 'bom-create-validation-error.png', fullPage: true });

        const cancelBtn = await ui5.control({ id: 'createBOMFragment--CancelBtn' });
        await cancelBtn.press();
        await ui5.waitForUI5();

        expect(validationResult.dialogStillOpen).toBe(false);
      }

      test
        .info()
        .annotations.push({ type: 'info', description: 'Step 7: Click Create Button - PASSED' });
    });

    // ═══════════════════════════════════════════════════════════════
    // STEP 8: Verify Return to BOM List (Using UI5 Methods Only)
    // ═══════════════════════════════════════════════════════════════
    await test.step('Step 8: Verify Return to BOM List', async () => {
      const createBtn = await ui5.control(
        {
          controlType: 'sap.m.Button',
          properties: { text: 'Create BOM' },
        },
        { timeout: 30000 },
      );
      const btnText = await createBtn.getProperty('text');
      expect(btnText).toBe('Create BOM');

      const btnEnabled = await createBtn.getProperty('enabled');
      expect(btnEnabled).toBe(true);

      test.info().annotations.push({
        type: 'info',
        description: 'Step 8: Verify Return to BOM List - PASSED',
      });
      test.info().annotations.push({
        type: 'info',
        description: 'BOM End-to-End flow completed — all 8 steps passed',
      });
    });
  });
});
