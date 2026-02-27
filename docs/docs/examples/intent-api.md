---
sidebar_position: 10
title: Intent API
---

# Intent API

Demonstrates Praman's intent-based testing layer from `playwright-praman/intents`: core wrappers (`fillField`, `clickButton`, `assertField`, `selectOption`), domain functions (`procurement.createPurchaseOrder`), vocabulary integration, and the `IntentResult` envelope.

## Core Wrappers vs Domain Functions

| Layer                | Granularity   | Example                                             |
| -------------------- | ------------- | --------------------------------------------------- |
| **Core wrappers**    | Single action | `fillField(ui5, vocab, 'Vendor', '100001')`         |
| **Domain functions** | Business flow | `procurement.createPurchaseOrder(ui5, vocab, data)` |

Core wrappers are low-level building blocks. Domain functions compose them into multi-step SAP business flows.

## Source

```typescript
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

    await test.step('Fill fields using direct selectors', async () => {
      // Without vocabulary -- pass UI5 selectors directly
      const vendorResult = await fillField(ui5, undefined, { id: 'vendorInput' }, '100001');
      expect(vendorResult.status).toBe('success');

      const orgResult = await fillField(ui5, undefined, { id: 'purchOrgInput' }, '1000');
      expect(orgResult.status).toBe('success');
    });

    await test.step('Select option and assert values', async () => {
      const result = await selectOption(ui5, undefined, { id: 'currencySelect' }, 'EUR');
      expect(result.status).toBe('success');

      const check = await assertField(ui5, undefined, { id: 'vendorInput' }, '100001');
      expect(check.status).toBe('success');
    });

    await test.step('Click save button', async () => {
      const result = await clickButton(ui5, undefined, 'Save');
      expect(result.status).toBe('success');

      const saveResult = await waitForSave(ui5);
      expect(saveResult.status).toBe('success');
    });
  });

  test('core wrappers with vocabulary: resolve business terms', async ({ ui5, ui5Navigation }) => {
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

      const orgResult = await fillField(ui5, vocab, 'Purchasing Organization', '1000', {
        domain: 'procurement',
      });
      expect(orgResult.status).toBe('success');

      const matResult = await fillField(ui5, vocab, 'Material', 'RAW-0001', {
        domain: 'procurement',
      });
      expect(matResult.status).toBe('success');
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
      // Composes: navigate -> fillVendor -> fillMaterial -> fillQuantity -> save
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
          skipNavigation: true,
          timeout: 60_000,
        },
      );

      expect(result.status).toBe('success');
      expect(result.data).toBeTruthy();
      expect(result.metadata.sapModule).toBe('MM');
      expect(result.metadata.intentName).toBe('createPurchaseOrder');
      expect(result.metadata.stepsExecuted.length).toBeGreaterThan(0);
    });
  });

  test('handle intent errors gracefully', async ({ ui5, ui5Navigation }) => {
    const vocab = createVocabularyService();
    await vocab.loadDomain('procurement');

    await test.step('Navigate to PO creation', async () => {
      await ui5Navigation.navigateToApp('PurchaseOrder-create');
      await ui5.waitForUI5();
    });

    await test.step('Unknown vocabulary term returns error result', async () => {
      const result = await fillField(ui5, vocab, 'NonExistentField', 'value', {
        domain: 'procurement',
      });

      // Error result -- not an exception
      expect(result.status).toBe('error');
      expect(result.error).toBeTruthy();
      expect(result.metadata.suggestions.length).toBeGreaterThan(0);
    });
  });
});
```

## Key Concepts

### IntentResult Envelope

All intent functions return a typed `IntentResult<T>`:

```typescript
interface IntentResult<T = void> {
  readonly status: 'success' | 'error' | 'partial';
  readonly data?: T;
  readonly error?: { readonly code: string; readonly message: string };
  readonly metadata: {
    readonly duration: number;
    readonly retryable: boolean;
    readonly suggestions: string[];
    readonly intentName: string;
    readonly sapModule: string;
    readonly stepsExecuted: string[];
  };
}
```

### Core Wrappers

| Wrapper             | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `fillField`         | Fill a UI5 input, with optional vocab term |
| `clickButton`       | Click a button by text label or selector   |
| `selectOption`      | Select a dropdown/ComboBox option          |
| `assertField`       | Assert field value matches expected text   |
| `navigateAndSearch` | Navigate to an app and execute a search    |
| `confirmAndWait`    | Click confirmation and wait for stability  |
| `waitForSave`       | Wait for save operation (message toast)    |

### Domain Functions

- **`procurement.createPurchaseOrder()`** -- fill vendor, material, quantity, plant, and save
- **`procurement.searchPurchaseOrders()`** -- navigate and filter by vendor, date, etc.
- **`procurement.displayPurchaseOrder()`** -- navigate to a specific PO detail page

### Vocabulary Integration

Core wrappers accept an optional `VocabLookup` to resolve business terms:

```typescript
// With vocabulary: "Vendor" resolves to { id: 'vendorInput' }
await fillField(ui5, vocab, 'Vendor', '100001', { domain: 'procurement' });

// Without vocabulary: pass a selector directly
await fillField(ui5, undefined, { id: 'vendorInput' }, '100001');
```

### IntentOptions

```typescript
interface IntentOptions {
  skipNavigation?: boolean; // Skip FLP navigation (app already open)
  timeout?: number; // Override default timeout (ms)
  validateViaOData?: boolean; // Validate result via OData GET after save
}
```
