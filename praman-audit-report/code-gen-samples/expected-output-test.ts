/**
 * Purchase Order E2E Test — Expected AI Agent Output
 *
 * This is what a correctly-generated Playwright+praman test should look like
 * when an AI agent (Claude Code, Codex, Copilot) is given the prompt:
 *
 *   "Write a Playwright test using praman that creates a purchase order
 *    for vendor 100001 with material MAT-001 and verifies it was saved."
 *
 * COMPLIANCE: 100% Praman fixture-only
 * Forbidden Pattern Scan: PASSED
 */
import { test, expect } from 'playwright-praman';

test.describe('Purchase Order Creation', () => {
  test('Create PO for vendor 100001 with material MAT-001', async ({
    page,
    ui5,
    ui5Navigation,
    ui5Footer,
    intent,
  }) => {
    await test.step('Navigate to Create Purchase Order', async () => {
      await ui5Navigation.navigateToIntent('PurchaseOrder', 'create');
      await ui5.waitForUI5();
    });

    await test.step('Fill vendor field', async () => {
      const vendorInput = await ui5.control({
        controlType: 'sap.m.Input',
        properties: { name: 'Vendor' },
      });
      await vendorInput.setValue('100001');
      await vendorInput.fireChange({ value: '100001' });
      await ui5.waitForUI5();
    });

    await test.step('Add line item with material', async () => {
      // Click "Add Item" button
      await ui5.press({
        controlType: 'sap.m.Button',
        properties: { text: 'Add Item' },
      });
      await ui5.waitForUI5();

      // Fill material number
      const materialInput = await ui5.control({
        controlType: 'sap.m.Input',
        properties: { name: 'Material' },
      });
      await materialInput.setValue('MAT-001');
      await materialInput.fireChange({ value: 'MAT-001' });
      await ui5.waitForUI5();
    });

    await test.step('Save and verify', async () => {
      await ui5Footer.clickSave();
      await ui5.waitForUI5();

      // Verify success message
      await ui5.dialog.waitFor();
      await ui5.dialog.confirm();

      // Verify the PO was created
      await intent.core.assertField('Status', 'Created');
    });

    await test.step('Verify OData backend', async () => {
      const vendor = await ui5.odata.getModelProperty('/PurchaseOrder/Vendor');
      expect(vendor).toBe('100001');
    });
  });
});
