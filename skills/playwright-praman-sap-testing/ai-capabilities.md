# AI Capabilities Reference

## Table of Contents

1. [Overview](#overview)
2. [pramanAI Fixture](#pramanai-fixture)
3. [Intent APIs](#intent-apis)
4. [Business Vocabulary](#business-vocabulary)
5. [Bulk Control Discovery](#bulk-control-discovery)
6. [AI Configuration](#ai-configuration)

---

## Overview

Phase 5 of Praman adds AI-powered test generation and business intent APIs.
These features are available from the `aiTest` and `intentTest` fixtures.

> **Status**: Phase 5 — available in Praman v1.0.0+

```typescript
import { test, expect } from 'playwright-praman';
```

### Fixture Hierarchy

```text
coreTest    → ui5
navTest     → coreTest + ui5Navigation
moduleTest  → navTest + ui5.table + ui5.dialog + ui5.date + ui5.odata
aiTest      → moduleTest + pramanAI
intentTest  → aiTest + intent
```

---

## pramanAI Fixture

The `pramanAI` fixture provides AI-powered test generation using LLM providers
(Azure OpenAI, OpenAI, or Anthropic Claude).

```typescript
import { test, expect } from 'playwright-praman';

test('AI-generated test steps', async ({ page, ui5Navigation, pramanAI }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // Generate test steps from a natural language description
  const result = await pramanAI.agentic.generateTest(
    'Create a purchase order for supplier SUP-001 with 3 line items for material MAT001',
    page,
  );

  // result.steps: string[] — human-readable steps
  // result.code: string — TypeScript test code
  // result.metadata: { model, tokens, duration }
});
```

### Discovering All Controls on a Page

```typescript
test('discover all UI5 controls', async ({ pramanAI, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // Get inventory of all interactive controls
  const inventory = await pramanAI.discoverPage({ interactiveOnly: true });
  // Returns: { controls: [{ id, controlType, properties, isInteractive, category }], url, ... }

  const buttons = inventory.controls.filter((c) => c.controlType === 'sap.m.Button');
  const inputs = inventory.controls.filter((c) => c.category === 'input');
});
```

### Querying Capabilities

```typescript
// Query capabilities via the registry
const caps = await pramanAI.capabilities.forAI();
// Returns structured capability data for AI consumption

// Query by category
const tableCaps = await pramanAI.capabilities.byCategory('table');
```

---

## Intent APIs

Intent APIs provide high-level business operations for SAP module workflows.
They use vocabulary mapping to find the right controls without knowing exact IDs.

### Procurement

```typescript
import { test, expect } from 'playwright-praman';

test('create purchase order', async ({ intent, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  await intent.procurement.createPurchaseOrder({
    vendor: 'SUP-001',
    material: 'MAT001',
    quantity: 10,
    plant: '1000',
    companyCode: '1000',
    purchasingOrg: '1000',
  });
});
```

### Sales

```typescript
test('create sales order', async ({ intent, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('SalesOrder-create');

  await intent.sales.createSalesOrder({
    soldToParty: 'CUST-001',
    salesOrg: '1000',
    material: 'MAT001',
    quantity: 5,
    price: 99.99,
  });
});
```

### Finance

```typescript
test('post journal entry', async ({ intent, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('GLAccountLineItems-manage');

  await intent.finance.createJournalEntry({
    documentDate: '2024-03-15',
    postingDate: '2024-03-15',
    glAccount: '400000',
    debitCredit: 'S', // S = Debit, H = Credit
    amount: 1000,
    costCenter: '1000',
  });
});
```

### Manufacturing

```typescript
test('create production order', async ({ intent, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('ManufacturingOrder-manage');

  await intent.manufacturing.createProductionOrder({
    material: 'FG-001',
    plant: '1000',
    quantity: 100,
    scheduledStart: '2024-04-01',
  });
});
```

### Master Data

```typescript
test('maintain business partner', async ({ intent, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('BusinessPartner-manage');

  await intent.masterData.createVendorMaster({
    name: 'New Supplier GmbH',
    country: 'DE',
    taxId: 'DE123456789',
  });
});
```

---

## Business Vocabulary

The vocabulary service maps business terms to SAP field names and control IDs.
It enables intent APIs to find the right controls by business name rather than
technical ID.

```typescript
import { test, expect } from 'playwright-praman';

test('use vocabulary for field resolution', async ({ intent }) => {
  // Vocabulary maps 'Vendor' → various SAP field names
  // 'Vendor', 'Supplier', 'Creditor', 'LIFNR', 'BusinessPartner'
  // all resolve to the same SAP field

  // Fill by business term (vocabulary-resolved)
  await intent.core.fillField('Vendor', 'SUP-001');

  // Get business term suggestions for a field
  const suggestions = await intent.vocabulary.getSuggestions('supplier');
  // ['Supplier', 'Vendor', 'Creditor', 'VendorAccount']
});
```

### Vocabulary Domains

| Domain             | File                                    | Coverage                              |
| ------------------ | --------------------------------------- | ------------------------------------- |
| Procurement (MM)   | `vocabulary/domains/procurement.json`   | PO, GR, Invoice, Vendor fields        |
| Sales (SD)         | `vocabulary/domains/sales.json`         | Sales order, billing, customer fields |
| Finance (FI)       | `vocabulary/domains/finance.json`       | GL accounts, postings, cost center    |
| Manufacturing (PP) | `vocabulary/domains/manufacturing.json` | Production orders, BOMs, routings     |
| Warehouse (WM/EWM) | `vocabulary/domains/warehouse.json`    | Storage, picking, goods movement      |
| Quality (QM)       | `vocabulary/domains/quality.json`       | Inspections, lots, quality orders     |

---

## Bulk Control Discovery

Bulk discovery scans the entire page and returns a structured inventory
of all UI5 controls, categorized by type and interactivity.

```typescript
import { test, expect } from 'playwright-praman';

test('discover page structure', async ({ pramanAI, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  const inventory = await pramanAI.discoverPage({
    interactiveOnly: true, // Only interactive controls
  });

  for (const control of inventory.controls) {
    test.info().annotations.push({
      type: 'info',
      description: `${control.controlType} id=${control.id} category=${control.category}`,
    });
  }
});
```

**Control categories**:

- `input` — sap.m.Input, sap.m.TextArea, sap.m.DatePicker, sap.m.Select, etc.
- `button` — sap.m.Button, sap.m.ToggleButton, sap.m.MenuButton
- `container` — sap.m.Panel, sap.m.Dialog, sap.f.DynamicPage
- `display` — sap.m.Text, sap.m.Label, sap.m.ObjectStatus
- `table` — sap.m.Table, sap.ui.table.Table, sap.ui.comp.smarttable.SmartTable

---

## AI Configuration

Configure the AI provider in `praman.config.ts`:

```typescript
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  ai: {
    // Azure OpenAI (default)
    provider: 'azure-openai',
    endpoint: process.env['AZURE_OPENAI_ENDPOINT'], // e.g. 'https://myresource.openai.azure.com'
    apiKey: process.env['AZURE_OPENAI_API_KEY'],
    deployment: process.env['AZURE_OPENAI_DEPLOYMENT'], // e.g. 'gpt-4o'
    apiVersion: '2024-02-01',

    // OpenAI
    // provider: 'openai',
    // apiKey: process.env['OPENAI_API_KEY'],
    // model: 'gpt-4o',

    // Anthropic Claude
    // provider: 'anthropic',
    // anthropicApiKey: process.env['ANTHROPIC_API_KEY'],
    // model: 'claude-opus-4-6',

    temperature: 0.3, // Lower = more deterministic (recommended for test gen)
    maxTokens: 4096, // Optional cap
  },
});
```
