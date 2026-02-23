---
sidebar_position: 36
title: OData Mocking
---

Strategies for mocking OData services in Praman tests. Covers Playwright `page.route()`
interception, SAP CAP mock server integration, and offline test patterns.

## When to Mock OData

| Scenario             | Approach                    | When to Use                                   |
| -------------------- | --------------------------- | --------------------------------------------- |
| Unit/component tests | `page.route()` interception | No backend needed, fast, deterministic        |
| Integration tests    | CAP mock server             | Realistic service behavior, schema validation |
| E2E tests            | Real SAP backend            | Full system validation, production-like       |
| CI/CD pipeline       | `page.route()` or CAP mock  | Reliable, no SAP system dependency            |

## Playwright page.route() Interception

### Basic OData Response Mock

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Purchase Order List (Mocked)', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept OData requests and return mock data
    await page.route('**/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/**', async (route) => {
      const url = route.request().url();

      if (url.includes('PurchaseOrderSet')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            d: {
              results: [
                {
                  PurchaseOrder: '4500000001',
                  Supplier: '100001',
                  CompanyCode: '1000',
                  PurchasingOrganization: '1000',
                  NetAmount: '5000.00',
                  Currency: 'USD',
                  Status: 'Approved',
                },
                {
                  PurchaseOrder: '4500000002',
                  Supplier: '100002',
                  CompanyCode: '2000',
                  PurchasingOrganization: '2000',
                  NetAmount: '12000.00',
                  Currency: 'EUR',
                  Status: 'Pending',
                },
              ],
            },
          }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('display purchase orders from mock', async ({ ui5, ui5Navigation, ui5Matchers }) => {
    await ui5Navigation.navigateToIntent('#PurchaseOrder-manage');

    const table = await ui5.control({
      controlType: 'sap.ui.comp.smarttable.SmartTable',
    });
    await ui5Matchers.toHaveRowCount(table, 2);
  });
});
```

### OData V4 Mock

```typescript
test.beforeEach(async ({ page }) => {
  await page.route('**/odata/v4/PurchaseOrderService/**', async (route) => {
    const url = route.request().url();

    if (url.includes('PurchaseOrders') && route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          '@odata.context': '$metadata#PurchaseOrders',
          value: [
            {
              PurchaseOrder: '4500000001',
              Supplier: '100001',
              NetAmount: 5000,
              Currency: 'USD',
            },
          ],
        }),
      });
    } else {
      await route.continue();
    }
  });
});
```

### Mock OData $metadata

Some UI5 apps require `$metadata` to render controls correctly:

```typescript
const metadata = `<?xml version="1.0" encoding="utf-8"?>
<edmx:Edmx Version="1.0" xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx">
  <edmx:DataServices m:DataServiceVersion="2.0"
    xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">
    <Schema Namespace="API_PURCHASEORDER" xmlns="http://schemas.microsoft.com/ado/2008/09/edm">
      <EntityType Name="PurchaseOrderType">
        <Key>
          <PropertyRef Name="PurchaseOrder"/>
        </Key>
        <Property Name="PurchaseOrder" Type="Edm.String" MaxLength="10"/>
        <Property Name="Supplier" Type="Edm.String" MaxLength="10"/>
        <Property Name="CompanyCode" Type="Edm.String" MaxLength="4"/>
        <Property Name="NetAmount" Type="Edm.Decimal" Precision="16" Scale="3"/>
        <Property Name="Currency" Type="Edm.String" MaxLength="5"/>
      </EntityType>
      <EntityContainer Name="API_PURCHASEORDER_SRV" m:IsDefaultEntityContainer="true">
        <EntitySet Name="PurchaseOrderSet" EntityType="API_PURCHASEORDER.PurchaseOrderType"/>
      </EntityContainer>
    </Schema>
  </edmx:DataServices>
</edmx:Edmx>`;

await page.route('**/$metadata', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/xml',
    body: metadata,
  });
});
```

### Mock Error Responses

Test how the app handles OData errors:

```typescript
test('handles OData error gracefully', async ({ ui5, ui5Navigation, page }) => {
  await page.route('**/PurchaseOrderSet**', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        error: {
          code: 'SY/530',
          message: {
            lang: 'en',
            value: 'Internal server error during data retrieval',
          },
          innererror: {
            errordetails: [
              {
                code: 'SY/530',
                message: 'Database connection timeout',
                severity: 'error',
              },
            ],
          },
        },
      }),
    });
  });

  await ui5Navigation.navigateToIntent('#PurchaseOrder-manage');

  // Verify the app shows an error message
  const errorDialog = await ui5.control({
    controlType: 'sap.m.Dialog',
    properties: { type: 'Message' },
    searchOpenDialogs: true,
  });
  expect(errorDialog).toBeTruthy();
});
```

### Conditional Mocking (First Call vs Subsequent)

```typescript
let callCount = 0;

await page.route('**/PurchaseOrderSet**', async (route) => {
  callCount++;

  if (callCount === 1) {
    // First call: return empty list
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ d: { results: [] } }),
    });
  } else {
    // Subsequent calls: return data (simulates data creation)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        d: {
          results: [{ PurchaseOrder: '4500000001', Supplier: '100001' }],
        },
      }),
    });
  }
});
```

## Mock Factory Pattern

Create reusable mock factories for consistent test data:

```typescript
// tests/mocks/odata-mocks.ts

interface PurchaseOrderMock {
  PurchaseOrder: string;
  Supplier: string;
  CompanyCode: string;
  NetAmount: string;
  Currency: string;
  Status: string;
}

export function createPurchaseOrderMock(
  overrides: Partial<PurchaseOrderMock> = {},
): PurchaseOrderMock {
  return {
    PurchaseOrder: '4500000001',
    Supplier: '100001',
    CompanyCode: '1000',
    NetAmount: '5000.00',
    Currency: 'USD',
    Status: 'Approved',
    ...overrides,
  };
}

export function createODataV2Response<T>(results: T[]) {
  return { d: { results } };
}

export function createODataV4Response<T>(value: T[], context: string) {
  return { '@odata.context': context, value };
}
```

Usage:

```typescript
import { createPurchaseOrderMock, createODataV2Response } from './mocks/odata-mocks';

await page.route('**/PurchaseOrderSet**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(
      createODataV2Response([
        createPurchaseOrderMock(),
        createPurchaseOrderMock({ PurchaseOrder: '4500000002', Status: 'Pending' }),
      ]),
    ),
  });
});
```

## SAP CAP Mock Server

For more realistic OData mocking, use SAP CAP (Cloud Application Programming Model) to run
a local OData service with schema validation.

### Setup

```bash
# Install CAP CLI
npm install --save-dev @sap/cds-dk

# Initialize mock project
mkdir tests/mock-server && cd tests/mock-server
cds init --add hana
```

### Define Service Schema

```cds
// tests/mock-server/srv/purchase-order-service.cds
using { cuid, managed } from '@sap/cds/common';

entity PurchaseOrders : cuid, managed {
  PurchaseOrder           : String(10);
  Supplier                : String(10);
  CompanyCode             : String(4);
  PurchasingOrganization  : String(4);
  NetAmount               : Decimal(16,3);
  Currency                : String(5);
  Status                  : String(20);
  Items                   : Composition of many PurchaseOrderItems on Items.parent = $self;
}

entity PurchaseOrderItems : cuid {
  parent    : Association to PurchaseOrders;
  ItemNo    : String(5);
  Material  : String(40);
  Quantity  : Decimal(13,3);
  Plant     : String(4);
  NetPrice  : Decimal(16,3);
}

service PurchaseOrderService {
  entity PurchaseOrderSet as projection on PurchaseOrders;
}
```

### Seed Test Data

```json
// tests/mock-server/db/data/PurchaseOrders.csv
PurchaseOrder;Supplier;CompanyCode;PurchasingOrganization;NetAmount;Currency;Status
4500000001;100001;1000;1000;5000.000;USD;Approved
4500000002;100002;2000;2000;12000.000;EUR;Pending
4500000003;100003;1000;1000;800.000;USD;Draft
```

### Playwright Config with CAP Server

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: [
    {
      command: 'npx cds serve --project tests/mock-server --port 4004',
      port: 4004,
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
  ],

  use: {
    baseURL: 'http://localhost:8080', // UI5 app server
  },

  projects: [
    {
      name: 'with-mock-server',
      testDir: './tests/integration',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Proxy OData Requests to CAP

```typescript
// In your UI5 app's xs-app.json or proxy config, route OData to CAP:
// /sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV → http://localhost:4004/odata/v4/PurchaseOrderService

// Or use page.route() to redirect:
await page.route('**/sap/opu/odata/**', async (route) => {
  const url = new URL(route.request().url());
  url.hostname = 'localhost';
  url.port = '4004';
  url.pathname = url.pathname.replace(
    '/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV',
    '/odata/v4/PurchaseOrderService',
  );
  await route.continue({ url: url.toString() });
});
```

## HAR File Replay

Record and replay real OData traffic for deterministic tests:

```typescript
// Record: run test once with HAR recording
test.use({
  // @ts-expect-error -- Playwright context option
  recordHar: {
    path: 'tests/fixtures/odata-traffic.har',
    urlFilter: '**/odata/**',
  },
});

// Replay: use recorded HAR in subsequent test runs
test('replay recorded OData traffic', async ({ page }) => {
  await page.routeFromHAR('tests/fixtures/odata-traffic.har', {
    url: '**/odata/**',
    update: false,
  });

  // Test runs against recorded responses — fast, deterministic
});
```

## Best Practices

| Practice                         | Why                                                                     |
| -------------------------------- | ----------------------------------------------------------------------- |
| Mock at the OData level, not DOM | UI5 models parse OData responses — mock the data, not the rendered HTML |
| Include `$metadata` mocks        | SmartFields/SmartTables need metadata to render correctly               |
| Use mock factories               | Consistent, type-safe test data across tests                            |
| Test error responses too         | Validate your app handles 400, 403, 500 gracefully                      |
| Reset mocks between tests        | Use `beforeEach` to set up fresh routes                                 |
| Match `$filter` and `$expand`    | Mock responses should respect OData query options when possible         |
