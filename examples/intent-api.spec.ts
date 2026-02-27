/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Intent API Example -- business-oriented test operations for SAP S/4HANA.
 *
 * @remarks
 * This example demonstrates Praman's intent-based testing layer, which expresses
 * test steps in business terms rather than UI control interactions:
 *
 * 1. **Core wrappers** -- `fillField`, `clickButton`, `assertField`, `selectOption`
 * 2. **Domain functions** -- `procurement.createPurchaseOrder()`, `procurement.searchPurchaseOrders()`
 * 3. **IntentResult envelope** -- typed result with status, metadata, and suggestions
 * 4. **Vocabulary integration** -- resolve business terms like "Vendor" to UI5 selectors
 * 5. **IntentOptions** -- skip navigation, custom timeouts, OData validation
 *
 * The intent layer sits above the UI5 fixture layer and provides SAP module-specific
 * business flows (MM, SD, FI, PP, MD).
 *
 * Prerequisites:
 * - Authentication handled via setup project (see {@link auth-setup.ts})
 * - SAP S/4HANA system with Purchase Order app accessible
 * - Vocabulary domain files loaded (bundled with playwright-praman)
 *
 * @example
 * ```bash
 * npx playwright test examples/intent-api.spec.ts
 * ```
 */

import { test, expect } from 'playwright-praman';
import {
  fillField,
  clickButton,
  selectOption,
  assertField,
  navigateAndSearch,
  confirmAndWait,
  waitForSave,
} from 'playwright-praman/intents';
import { procurement } from 'playwright-praman/intents';
import { createVocabularyService } from 'playwright-praman/vocabulary';

test.describe('Intent API -- Procurement Flows', () => {
  test('core wrappers: fill, assert, select, click', async ({ ui5, ui5Navigation }) => {
    await test.step('Navigate to Purchase Order creation', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-create');
      await ui5.waitForUI5();
    });

    await test.step('Fill fields using core wrappers with direct selectors', async () => {
      // fillField without vocabulary -- pass a UI5 selector directly
      const vendorResult = await fillField(ui5, undefined, { id: 'vendorInput' }, '100001');
      expect(vendorResult.status).toBe('success');
      expect(vendorResult.metadata.intentName).toBe('fillField');

      const orgResult = await fillField(ui5, undefined, { id: 'purchOrgInput' }, '1000');
      expect(orgResult.status).toBe('success');

      const groupResult = await fillField(ui5, undefined, { id: 'purchGroupInput' }, '001');
      expect(groupResult.status).toBe('success');

      test.info().annotations.push({
        type: 'info',
        description: `Filled ${vendorResult.metadata.stepsExecuted.length + orgResult.metadata.stepsExecuted.length + groupResult.metadata.stepsExecuted.length} fields`,
      });
    });

    await test.step('Select option using core wrapper', async () => {
      // selectOption for dropdown/ComboBox controls
      const result = await selectOption(ui5, undefined, { id: 'currencySelect' }, 'EUR');
      expect(result.status).toBe('success');
    });

    await test.step('Assert field values', async () => {
      // assertField verifies the displayed value of a field
      const vendorCheck = await assertField(ui5, undefined, { id: 'vendorInput' }, '100001');
      expect(vendorCheck.status).toBe('success');

      const orgCheck = await assertField(ui5, undefined, { id: 'purchOrgInput' }, '1000');
      expect(orgCheck.status).toBe('success');
    });

    await test.step('Click button using core wrapper', async () => {
      // clickButton accepts a text label or a UI5 selector
      const result = await clickButton(ui5, undefined, 'Save');
      expect(result.status).toBe('success');

      // Wait for save operation to complete
      const saveResult = await waitForSave(ui5);
      expect(saveResult.status).toBe('success');
    });
  });

  test('core wrappers with vocabulary: resolve business terms', async ({ ui5, ui5Navigation }) => {
    // Create vocabulary service and load procurement domain
    const vocab = createVocabularyService();
    await vocab.loadDomain('procurement');

    await test.step('Navigate to Purchase Order creation', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-create');
      await ui5.waitForUI5();
    });

    await test.step('Fill fields using vocabulary terms', async () => {
      // With vocabulary: "Vendor" resolves to the appropriate UI5 selector
      const vendorResult = await fillField(ui5, vocab, 'Vendor', '100001', {
        domain: 'procurement',
      });
      expect(vendorResult.status).toBe('success');

      // "Purchasing Organization" resolves via synonym matching
      const orgResult = await fillField(ui5, vocab, 'Purchasing Organization', '1000', {
        domain: 'procurement',
      });
      expect(orgResult.status).toBe('success');

      // "Material" resolves from the procurement domain vocabulary
      const matResult = await fillField(ui5, vocab, 'Material', 'RAW-0001', {
        domain: 'procurement',
      });
      expect(matResult.status).toBe('success');

      test.info().annotations.push({
        type: 'info',
        description: 'All fields resolved via vocabulary lookup',
      });
    });

    await test.step('Assert fields using vocabulary terms', async () => {
      const check = await assertField(ui5, vocab, 'Vendor', '100001', { domain: 'procurement' });
      expect(check.status).toBe('success');
    });
  });

  test('domain function: create purchase order end-to-end', async ({ ui5, ui5Navigation }) => {
    const vocab = createVocabularyService();
    await vocab.loadDomain('procurement');

    await test.step('Navigate to PO creation', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-create');
      await ui5.waitForUI5();
    });

    await test.step('Create PO using domain function', async () => {
      // procurement.createPurchaseOrder composes core wrappers into a full flow:
      // navigate -> fillVendor -> fillMaterial -> fillQuantity -> fillPlant -> save
      const result = await procurement.createPurchaseOrder(
        ui5,
        vocab,
        {
          vendor: '100001',
          material: 'RAW-0001',
          quantity: 50,
          plant: '1000',
          purchasingOrganization: '1000',
          purchasingGroup: '001',
        },
        {
          skipNavigation: true, // Already on the creation page
          timeout: 60_000,
        },
      );

      expect(result.status).toBe('success');
      expect(result.data).toBeTruthy(); // PO number returned

      test.info().annotations.push({
        type: 'info',
        description: `Created PO: ${String(result.data)}`,
      });

      // Inspect the execution steps
      expect(result.metadata.stepsExecuted.length).toBeGreaterThan(0);
      expect(result.metadata.sapModule).toBe('MM');
      expect(result.metadata.intentName).toBe('createPurchaseOrder');

      test.info().annotations.push({
        type: 'info',
        description: `Steps: ${result.metadata.stepsExecuted.join(' -> ')}`,
      });
    });
  });

  test('domain function: search and display purchase orders', async ({ ui5, ui5Navigation }) => {
    const vocab = createVocabularyService();
    await vocab.loadDomain('procurement');

    await test.step('Search purchase orders by vendor', async () => {
      // navigateAndSearch combines FLP navigation with a search operation
      const navResult = await navigateAndSearch(ui5, 'PurchaseOrder-manage', { vendor: '100001' });
      expect(navResult.status).toBe('success');
    });

    await test.step('Search using domain function', async () => {
      const searchResult = await procurement.searchPurchaseOrders(
        ui5,
        vocab,
        {
          vendor: '100001',
        },
        {
          skipNavigation: true,
        },
      );
      expect(searchResult.status).toBe('success');
    });

    await test.step('Display specific purchase order', async () => {
      const displayResult = await procurement.displayPurchaseOrder(ui5, vocab, '4500000001');
      expect(displayResult.status).toBe('success');
      expect(displayResult.metadata.stepsExecuted).toContain('navigate');
    });
  });

  test('handle intent errors gracefully', async ({ ui5, ui5Navigation }) => {
    const vocab = createVocabularyService();
    await vocab.loadDomain('procurement');

    await test.step('Navigate to PO creation', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-create');
      await ui5.waitForUI5();
    });

    await test.step('Attempt to resolve unknown vocabulary term', async () => {
      // Filling with an unknown term returns an error result (not an exception)
      const result = await fillField(ui5, vocab, 'NonExistentField', 'value', {
        domain: 'procurement',
      });

      // IntentResult returns status: 'error' with helpful suggestions
      expect(result.status).toBe('error');
      expect(result.error).toBeTruthy();
      expect(result.error!.code).toBeTruthy();
      expect(result.metadata.suggestions.length).toBeGreaterThan(0);

      test.info().annotations.push({
        type: 'info',
        description: `Error: ${result.error!.message}`,
      });
      test.info().annotations.push({
        type: 'info',
        description: `Suggestions: ${result.metadata.suggestions.join('; ')}`,
      });
    });

    await test.step('Confirm and wait with dialog handling', async () => {
      // confirmAndWait clicks a confirmation button and waits for UI5 stability
      // Useful after save operations that show a confirmation dialog
      await fillField(ui5, vocab, 'Vendor', '100001', { domain: 'procurement' });

      const confirmResult = await confirmAndWait(ui5, 'Save');
      // Result depends on whether a dialog actually appeared
      expect(['success', 'error']).toContain(confirmResult.status);
    });
  });
});
