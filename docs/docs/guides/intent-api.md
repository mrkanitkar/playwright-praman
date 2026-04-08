---
title: 'Intent API'
---

# Intent API

The `playwright-praman/intents` sub-path provides high-level, business-oriented test operations for SAP S/4HANA modules. Instead of interacting
with individual UI5 controls, intent APIs express test steps in business terms.

## Overview

```typescript
import {
  fillField,
  clickButton,
  selectOption,
  assertField,
  navigateAndSearch,
} from 'playwright-praman/intents';

import { procurement } from 'playwright-praman/intents';
```

The intent layer is built on two foundations:

1. **Core wrappers** -- low-level building blocks that accept a UI5Handler slice and optional vocabulary lookup.
2. **Domain namespaces** -- 5 SAP module-specific APIs that compose the core wrappers into business flows.

## Core Wrappers

Core wrappers are the shared building blocks used by all domain intent functions. They accept a minimal `UI5HandlerSlice` interface, making them easy to unit test with mocks:

```typescript
interface UI5HandlerSlice {
  control(selector: UI5Selector, options?: { timeout?: number }): Promise<unknown>;
  click(selector: UI5Selector): Promise<void>;
  fill(selector: UI5Selector, value: string): Promise<void>;
  select(selector: UI5Selector, key: string): Promise<void>;
  getText(selector: UI5Selector): Promise<string>;
  waitForUI5(timeout?: number): Promise<void>;
}
```

### Available Core Wrappers

| Wrapper             | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| `fillField`         | Fill a UI5 input control, with optional vocabulary term resolution |
| `clickButton`       | Click a button by text label or selector                           |
| `selectOption`      | Select an option in a dropdown/ComboBox                            |
| `assertField`       | Assert the value of a field matches expected text                  |
| `navigateAndSearch` | Navigate to an app via FLP and execute a search                    |
| `confirmAndWait`    | Click a confirmation button and wait for UI5 stability             |
| `waitForSave`       | Wait for a save operation to complete (message toast)              |

### Vocabulary Integration

Core wrappers accept an optional `VocabLookup` to resolve business terms to UI5 selectors:

```typescript
interface VocabLookup {
  getFieldSelector(term: string, domain?: string): Promise<UI5Selector | undefined>;
}

// With vocabulary: "Vendor" resolves to { id: 'vendorInput' }
await fillField(ui5, vocab, 'Vendor', '100001', { domain: 'procurement' });

// Without vocabulary: pass a selector directly
await fillField(ui5, undefined, { id: 'vendorInput' }, '100001');
```

When a vocabulary term cannot be resolved, the wrapper returns an `IntentResult` with `status: 'error'` and helpful suggestions.

## IntentResult Envelope

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

Example usage:

```typescript
const result = await procurement.createPurchaseOrder(ui5, vocab, {
  vendor: '100001',
  material: 'RAW-0001',
  quantity: 100,
  plant: '1000',
});

if (result.status === 'success') {
  console.log(`PO created: ${result.data}`);
  console.log(`Steps: ${result.metadata.stepsExecuted.join(' -> ')}`);
  // Steps: navigate -> fillVendor -> fillMaterial -> fillQuantity -> save
}
```

## IntentOptions

All domain functions accept optional `IntentOptions`:

```typescript
interface IntentOptions {
  skipNavigation?: boolean; // Skip FLP navigation (app already open)
  timeout?: number; // Override default timeout (ms)
  validateViaOData?: boolean; // Validate result via OData GET after save
}

// Skip navigation when already on the correct page
const result = await procurement.createPurchaseOrder(ui5, vocab, poData, {
  skipNavigation: true,
  timeout: 60_000,
});
```

## Domain Namespaces

### Procurement (MM -- Materials Management)

```typescript
import { procurement } from 'playwright-praman/intents';

// Create a purchase order
await procurement.createPurchaseOrder(ui5, vocab, {
  vendor: '100001',
  material: 'RAW-0001',
  quantity: 100,
  plant: '1000',
});

// Search purchase orders
await procurement.searchPurchaseOrders(ui5, vocab, { vendor: '100001' });

// Display purchase order details
await procurement.displayPurchaseOrder(ui5, vocab, '4500012345');
```

### Sales (SD -- Sales and Distribution)

```typescript
import { sales } from 'playwright-praman/intents';

// Create a sales order
await sales.createSalesOrder(ui5, vocab, {
  customer: '200001',
  material: 'FG-1000',
  quantity: 50,
  salesOrganization: '1000',
});

// Search sales orders
await sales.searchSalesOrders(ui5, vocab, { customer: '200001' });
```

### Finance (FI -- Financial Accounting)

```typescript
import { finance } from 'playwright-praman/intents';

// Post a journal entry
await finance.postJournalEntry(ui5, vocab, {
  documentDate: '2026-02-20',
  postingDate: '2026-02-20',
  lineItems: [
    { glAccount: '400000', debitCredit: 'S', amount: 1000 },
    { glAccount: '110000', debitCredit: 'H', amount: 1000 },
  ],
});

// Post a vendor invoice
await finance.postVendorInvoice(ui5, vocab, {
  vendor: '100001',
  invoiceDate: '2026-02-20',
  amount: 5000,
  currency: 'EUR',
});

// Process a vendor payment
await finance.processPayment(ui5, vocab, {
  vendor: '100001',
  amount: 5000,
  paymentDate: '2026-02-28',
});
```

### Manufacturing (PP -- Production Planning)

```typescript
import { manufacturing } from 'playwright-praman/intents';

// Create a production order
await manufacturing.createProductionOrder(ui5, vocab, {
  material: 'FG-1000',
  plant: '1000',
  quantity: 50,
});

// Confirm a production order
await manufacturing.confirmProductionOrder(ui5, vocab, {
  orderNumber: '1000012',
  quantity: 50,
});
```

### Master Data (MD -- Cross-Module)

```typescript
import { masterData } from 'playwright-praman/intents';

// Create a vendor master
await masterData.createVendor(ui5, vocab, {
  name: 'Acme GmbH',
  country: 'DE',
  taxId: 'DE123456789',
});

// Create a customer master
await masterData.createCustomer(ui5, vocab, {
  name: 'Globex Corp',
  country: 'US',
  salesOrganization: '1000',
});

// Create a material master
await masterData.createMaterial(ui5, vocab, {
  materialNumber: 'RAW-0001',
  description: 'Raw material A',
  materialType: 'ROH',
  baseUnit: 'KG',
});
```

## Data Shapes

Each domain defines typed data interfaces:

| Type                         | Domain | Purpose                              |
| ---------------------------- | ------ | ------------------------------------ |
| `JournalEntryData`           | FI     | General-ledger journal entry posting |
| `VendorInvoiceData`          | FI     | Accounts-payable vendor invoice      |
| `PaymentData`                | FI     | Outgoing payment processing          |
| `ProductionOrderData`        | PP     | Shop-floor order creation            |
| `ProductionConfirmationData` | PP     | Production order confirmation        |
| `VendorMasterData`           | MD     | Vendor master data creation          |
| `CustomerMasterData`         | MD     | Customer master data creation        |
| `MaterialMasterData`         | MD     | Material master data creation        |

## Architecture

The intent layer follows strict dependency rules:

```text
Domain functions (procurement.ts, sales.ts, etc.)
    |
    v
Core wrappers (core-wrappers.ts)
    |
    v
UI5HandlerSlice (structural interface) + VocabLookup (optional)
```

- Core wrappers do NOT import from any domain file (no circular dependencies).
- Domain functions compose core wrappers into SAP business flows.
- The `UI5HandlerSlice` is a structural sub-type -- it does not import the full `UI5Handler` class.
- The `VocabLookup` interface is declared inline to avoid hard dependencies on the vocabulary module.
