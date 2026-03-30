---
title: SAP Transaction Mapping
---

Maps 50+ SAP transaction codes to their Fiori equivalents and the corresponding Praman
fixtures, intents, and semantic objects used for test navigation.

## How to Use This Reference

In Praman, navigation uses **semantic objects and actions** (the Fiori Launchpad intent model)
rather than transaction codes. This table helps you translate your existing SAP GUI knowledge
into Fiori-native test navigation.

```typescript
// Navigate by app semantic hash
await ui5Navigation.navigateToApp('PurchaseOrder-create');

// Navigate by intent (semantic object + action)
await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'create' });
```

## Materials Management (MM)

| TCode | Description                  | Fiori App ID | Semantic Object       | Action    | Intent Hash                    |
| ----- | ---------------------------- | ------------ | --------------------- | --------- | ------------------------------ |
| ME21N | Create Purchase Order        | F0842        | `PurchaseOrder`       | `create`  | `#PurchaseOrder-create`        |
| ME22N | Change Purchase Order        | F0842        | `PurchaseOrder`       | `change`  | `#PurchaseOrder-change`        |
| ME23N | Display Purchase Order       | F0842        | `PurchaseOrder`       | `display` | `#PurchaseOrder-display`       |
| ME51N | Create Purchase Requisition  | F1130        | `PurchaseRequisition` | `create`  | `#PurchaseRequisition-create`  |
| ME52N | Change Purchase Requisition  | F1130        | `PurchaseRequisition` | `change`  | `#PurchaseRequisition-change`  |
| ME53N | Display Purchase Requisition | F1130        | `PurchaseRequisition` | `display` | `#PurchaseRequisition-display` |
| ME2M  | POs by Material              | F0701        | `PurchaseOrder`       | `manage`  | `#PurchaseOrder-manage`        |
| ME2N  | POs by PO Number             | F0701        | `PurchaseOrder`       | `manage`  | `#PurchaseOrder-manage`        |
| MIGO  | Goods Movement               | F0843        | `GoodsReceipt`        | `create`  | `#GoodsReceipt-create`         |
| MIRO  | Enter Incoming Invoice       | F0859        | `SupplierInvoice`     | `create`  | `#SupplierInvoice-create`      |
| MM01  | Create Material              | F1602        | `Material`            | `create`  | `#Material-create`             |
| MM02  | Change Material              | F1602        | `Material`            | `change`  | `#Material-change`             |
| MM03  | Display Material             | F1602        | `Material`            | `display` | `#Material-display`            |
| MB52  | Warehouse Stocks             | F0842A       | `WarehouseStock`      | `display` | `#WarehouseStock-display`      |
| MMBE  | Stock Overview               | F0842A       | `MaterialStock`       | `display` | `#MaterialStock-display`       |

## Sales & Distribution (SD)

| TCode | Description               | Fiori App ID | Semantic Object    | Action    | Intent Hash                 |
| ----- | ------------------------- | ------------ | ------------------ | --------- | --------------------------- |
| VA01  | Create Sales Order        | F0217        | `SalesOrder`       | `create`  | `#SalesOrder-create`        |
| VA02  | Change Sales Order        | F0217        | `SalesOrder`       | `change`  | `#SalesOrder-change`        |
| VA03  | Display Sales Order       | F0217        | `SalesOrder`       | `display` | `#SalesOrder-display`       |
| VA05  | List of Sales Orders      | F1814        | `SalesOrder`       | `manage`  | `#SalesOrder-manage`        |
| VL01N | Create Outbound Delivery  | F0341        | `OutboundDelivery` | `create`  | `#OutboundDelivery-create`  |
| VL02N | Change Outbound Delivery  | F0341        | `OutboundDelivery` | `change`  | `#OutboundDelivery-change`  |
| VL03N | Display Outbound Delivery | F0341        | `OutboundDelivery` | `display` | `#OutboundDelivery-display` |
| VF01  | Create Billing Document   | F0638        | `BillingDocument`  | `create`  | `#BillingDocument-create`   |
| VF02  | Change Billing Document   | F0638        | `BillingDocument`  | `change`  | `#BillingDocument-change`   |
| VF03  | Display Billing Document  | F0638        | `BillingDocument`  | `display` | `#BillingDocument-display`  |

## Finance (FI)

| TCode | Description               | Fiori App ID | Semantic Object     | Action    | Intent Hash                  |
| ----- | ------------------------- | ------------ | ------------------- | --------- | ---------------------------- |
| FB50  | Post G/L Account Document | F0718        | `JournalEntry`      | `create`  | `#JournalEntry-create`       |
| FB60  | Enter Incoming Invoices   | F0859        | `SupplierInvoice`   | `create`  | `#SupplierInvoice-create`    |
| FB70  | Enter Outgoing Invoices   | F2555        | `CustomerInvoice`   | `create`  | `#CustomerInvoice-create`    |
| FBL1N | Vendor Line Items         | F0996        | `SupplierLineItem`  | `display` | `#SupplierLineItem-display`  |
| FBL3N | G/L Account Line Items    | F0997        | `GLAccountLineItem` | `display` | `#GLAccountLineItem-display` |
| FBL5N | Customer Line Items       | F0998        | `CustomerLineItem`  | `display` | `#CustomerLineItem-display`  |
| F110  | Payment Run               | F1645        | `PaymentRun`        | `manage`  | `#PaymentRun-manage`         |
| FK01  | Create Vendor             | F0794        | `Supplier`          | `create`  | `#Supplier-create`           |
| FK02  | Change Vendor             | F0794        | `Supplier`          | `change`  | `#Supplier-change`           |
| FK03  | Display Vendor            | F0794        | `Supplier`          | `display` | `#Supplier-display`          |
| FS00  | G/L Account Master        | F2217        | `GLAccount`         | `manage`  | `#GLAccount-manage`          |

## Controlling (CO)

| TCode | Description                        | Fiori App ID | Semantic Object  | Action    | Intent Hash              |
| ----- | ---------------------------------- | ------------ | ---------------- | --------- | ------------------------ |
| KS01  | Create Cost Center                 | F1605        | `CostCenter`     | `create`  | `#CostCenter-create`     |
| KS02  | Change Cost Center                 | F1605        | `CostCenter`     | `change`  | `#CostCenter-change`     |
| KS03  | Display Cost Center                | F1605        | `CostCenter`     | `display` | `#CostCenter-display`    |
| KP06  | Plan Cost Elements/Activity Inputs | F2741        | `CostCenterPlan` | `manage`  | `#CostCenterPlan-manage` |
| CJ20N | Project Builder                    | F2107        | `Project`        | `manage`  | `#Project-manage`        |

## Plant Maintenance (PM) / Asset Management

| TCode | Description                | Fiori App ID | Semantic Object           | Action   | Intent Hash                       |
| ----- | -------------------------- | ------------ | ------------------------- | -------- | --------------------------------- |
| IW21  | Create Notification        | F1704        | `MaintenanceNotification` | `create` | `#MaintenanceNotification-create` |
| IW22  | Change Notification        | F1704        | `MaintenanceNotification` | `change` | `#MaintenanceNotification-change` |
| IW31  | Create Maintenance Order   | F1705        | `MaintenanceOrder`        | `create` | `#MaintenanceOrder-create`        |
| IW32  | Change Maintenance Order   | F1705        | `MaintenanceOrder`        | `change` | `#MaintenanceOrder-change`        |
| IE01  | Create Equipment           | F3381        | `Equipment`               | `create` | `#Equipment-create`               |
| IL01  | Create Functional Location | F3382        | `FunctionalLocation`      | `create` | `#FunctionalLocation-create`      |

## Human Capital Management (HCM)

| TCode | Description             | Fiori App ID | Semantic Object | Action    | Intent Hash            |
| ----- | ----------------------- | ------------ | --------------- | --------- | ---------------------- |
| PA20  | Display HR Master Data  | F0711        | `Employee`      | `display` | `#Employee-display`    |
| PA30  | Maintain HR Master Data | F0711        | `Employee`      | `manage`  | `#Employee-manage`     |
| PT01  | Create Work Schedule    | F1560        | `WorkSchedule`  | `manage`  | `#WorkSchedule-manage` |
| CATS  | Time Sheet Entry        | F1286        | `TimeEntry`     | `create`  | `#TimeEntry-create`    |

## Cross-Application

| TCode | Description         | Fiori App ID | Semantic Object   | Action   | Intent Hash               |
| ----- | ------------------- | ------------ | ----------------- | -------- | ------------------------- |
| BP    | Business Partner    | F1757        | `BusinessPartner` | `manage` | `#BusinessPartner-manage` |
| NWBC  | SAP Fiori Launchpad | -            | `Shell`           | `home`   | `#Shell-home`             |
| SM37  | Job Overview        | F1239        | `ApplicationJob`  | `manage` | `#ApplicationJob-manage`  |
| SU01  | User Maintenance    | F1302        | `User`            | `manage` | `#User-manage`            |

## Praman Navigation Patterns

### By App Semantic Hash

```typescript
// Navigate by semantic object-action string
await ui5Navigation.navigateToApp('PurchaseOrder-create');
```

### By Intent (Semantic Object + Action)

```typescript
await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'create' });
```

### By Intent with Parameters

```typescript
await ui5Navigation.navigateToIntent(
  { semanticObject: 'PurchaseOrder', action: 'display' },
  { PurchaseOrder: '4500000001' },
);
```

### By Hash (Deep Link)

```typescript
await ui5Navigation.navigateToHash("PurchaseOrder-display&/PurchaseOrders('4500000001')");
```

## Tips

- **App IDs may differ** between S/4HANA versions. Always verify against your system's FLP
  content catalog.
- **Custom Fiori apps** will have their own semantic objects not listed here. Check your FLP
  admin console for custom intent mappings.
- **Transaction wrappers** (SAP GUI in Fiori) use the TCode directly but are rendered inside
  the FLP shell — same navigation pattern applies.
- Use `ui5Navigation.getCurrentHash()` to verify you landed on the correct app after navigation.
