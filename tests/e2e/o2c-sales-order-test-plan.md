# O2C Sales Order E2E Test Plan

## System Under Test

| Property         | Value                                       |
| ---------------- | ------------------------------------------- |
| System           | SAP S/4HANA Cloud                           |
| Host             | `my403147.s4hana.cloud.sap`                 |
| System ID        | LXG/100 (Partner Demo Customizing)          |
| App Type         | SAP GUI for HTML (ABAP freestyle in iframe) |
| Iframe           | `__container158-iframe`                     |
| Business Process | Order-to-Cash (O2C)                         |
| Scope Item       | BD9 — Sell from Stock                       |

## Validated Test Data (Discovered via OData + Live System)

| Master Data          | Value          | Description                         | Verified      |
| -------------------- | -------------- | ----------------------------------- | ------------- |
| Order Type           | `OR`           | Standard Order                      | ✅            |
| Sales Organization   | `1010`         | Dom. Sales Org                      | ✅            |
| Distribution Channel | `10`           | Direct Sales                        | ✅            |
| Division             | `00`           | Product Division 00                 | ✅            |
| Sold-to Party        | `10100001`     | Inlandskunde DE 1                   | ✅            |
| Material             | `TG11`         | Handelsware 11 (Trading Good, HAWA) | ✅            |
| Order Quantity       | `20`           | Unit: PC                            | ✅            |
| Plant                | `1010`         | Plant 1 DE                          | ✅            |
| Storage Location     | `101A`         | Std. storage 1                      | From template |
| Shipping Point       | `1010`         | Shipping Point 1010                 | ✅            |
| Currency             | `EUR`          | European Euro                       | ✅            |
| Payment Terms        | `0004`         | —                                   | ✅            |
| Incoterms            | `EXW Walldorf` | —                                   | ✅            |
| Net Value            | `351.00 EUR`   | For 20 PC of TG11                   | ✅            |

## OData APIs Verified

| API                    | Version | Status     |
| ---------------------- | ------- | ---------- |
| `API_SALES_ORDER_SRV`  | V2      | ✅ Working |
| `API_BUSINESS_PARTNER` | V2      | ✅ Working |
| `API_PRODUCT_SRV`      | V2      | ✅ Working |

## Required SAP Roles

| Role                          | ID                               | Used In             |
| ----------------------------- | -------------------------------- | ------------------- |
| Internal Sales Representative | `SAP_BR_INTERNAL_SALES_REP`      | VA01, VA02          |
| Warehouse Clerk               | `SAP_BR_WAREHOUSE_CLERK`         | MIGO                |
| Order Fulfillment Specialist  | `SAP_BR_ORDER_FULFILLMNT_SPCLST` | VL01N, VL06O, VL03N |

## Prerequisite: Stock Must Exist

> **BLOCKER DISCOVERED**: Material TG11 has **0 stock** at Plant 1010.
> The availability check in VA01 confirmed 0 of 20 PC.
> VL01N fails with error VL248: "No schedule lines due for delivery."
>
> **Resolution**: Before running the E2E test, post a goods receipt via MIGO
> (movement type 561 — Initial Entry of Stock Balances) for Material TG11,
> Plant 1010, Storage Location 101A, Quantity 50 PC.

---

## Test Steps

### Phase 0: Prerequisites — Post Goods Receipt (MIGO)

| Step | Action   | App        | Field / Element             | Value           | Expected Result                           |
| ---- | -------- | ---------- | --------------------------- | --------------- | ----------------------------------------- |
| 0.1  | Navigate | FLP Search | Search box                  | `MIGO`          | Results show "Post Goods Movement"        |
| 0.2  | Click    | FLP        | Post Goods Movement link    | —               | MIGO app opens in SAP GUI iframe          |
| 0.3  | Select   | MIGO       | Trans./Event dropdown       | `Goods Receipt` | Already default                           |
| 0.4  | Select   | MIGO       | Reference Document dropdown | —               | Change to blank/Other (movement type 561) |
| 0.5  | Fill     | MIGO       | Movement Type               | `561`           | Initial entry of stock balances           |
| 0.6  | Fill     | MIGO       | Material                    | `TG11`          | Material populated                        |
| 0.7  | Fill     | MIGO       | Plant                       | `1010`          | Plant 1 DE                                |
| 0.8  | Fill     | MIGO       | Storage Location            | `101A`          | Std. storage 1                            |
| 0.9  | Fill     | MIGO       | Quantity                    | `50`            | 50 PC                                     |
| 0.10 | Click    | MIGO       | Check button                | —               | Document OK                               |
| 0.11 | Click    | MIGO       | Post button                 | —               | Material document posted                  |
| 0.12 | Verify   | MIGO       | Status bar                  | —               | "Document XXXXXXXXXX posted" message      |

### Phase 1: Create Sales Order (VA01)

| Step | Action         | App            | Field / Element                    | Value                          | Expected Result                                     |
| ---- | -------------- | -------------- | ---------------------------------- | ------------------------------ | --------------------------------------------------- |
| 1.1  | Navigate       | FLP Search     | Search box                         | `VA01`                         | Results show "Create Sales Orders"                  |
| 1.2  | Click          | FLP            | Create Sales Orders link           | —                              | VA01 opens: "Create Standard Order: Initial Screen" |
| 1.3  | Fill           | VA01 Initial   | Order Type                         | `OR`                           | Standard Order                                      |
| 1.4  | Fill           | VA01 Initial   | Sales Organization                 | `1010`                         | —                                                   |
| 1.5  | Fill           | VA01 Initial   | Distribution Channel               | `10`                           | —                                                   |
| 1.6  | Fill           | VA01 Initial   | Division                           | `00`                           | —                                                   |
| 1.7  | Click          | VA01 Initial   | Continue button                    | —                              | "Create Standard Order: Overview" loads             |
| 1.8  | Fill           | VA01 Overview  | Sold-to Party                      | `10100001`                     | Inlandskunde DE 1                                   |
| 1.9  | Fill           | VA01 Overview  | Cust. Reference                    | `PRAMAN-TEST-{timestamp}`      | Unique PO reference                                 |
| 1.10 | Press          | VA01 Overview  | Enter key                          | —                              | Customer data populated (EUR, 0004, EXW)            |
| 1.11 | Navigate       | VA01 Overview  | Item Overview tab                  | —                              | Item grid displayed                                 |
| 1.12 | Click + Fill   | VA01 Item Grid | Material cell (row 1)              | `TG11`                         | Material entered                                    |
| 1.13 | Click + Fill   | VA01 Item Grid | Order Quantity cell (row 1)        | `20`                           | Quantity entered                                    |
| 1.14 | Press          | VA01 Overview  | Enter key                          | —                              | Triggers availability check                         |
| 1.15 | Handle         | VA01           | Availability Check dialog          | —                              | If appears: "Review Availability Check Result"      |
| 1.16 | Click          | VA01           | Apply button (avail. check)        | —                              | Return to overview with confirmed qty               |
| 1.17 | Assert         | VA01 Overview  | Net Value                          | `≈ 351.00 EUR`                 | Pricing calculated                                  |
| 1.18 | Press          | VA01           | Ctrl+S (Save)                      | —                              | Sales order saved                                   |
| 1.19 | Capture        | VA01           | Status bar message                 | —                              | "Standard Order {SO_NUMBER} has been saved"         |
| 1.20 | Verify-Backend | OData          | `API_SALES_ORDER_SRV/A_SalesOrder` | `$filter=SalesOrder eq '{SO}'` | SalesOrderType=OR, SoldToParty=10100001             |

### Phase 2: Create Outbound Delivery (VL01N)

| Step | Action   | App        | Field / Element               | Value               | Expected Result                       |
| ---- | -------- | ---------- | ----------------------------- | ------------------- | ------------------------------------- |
| 2.1  | Navigate | FLP Search | Search box                    | `VL01N`             | Results found                         |
| 2.2  | Click    | FLP        | Create Outbound Delivery link | —                   | VL01N opens                           |
| 2.3  | Fill     | VL01N      | Shipping Point                | `1010`              | —                                     |
| 2.4  | Fill     | VL01N      | Selection Date                | `{today + 30 days}` | Future date for schedule lines        |
| 2.5  | Fill     | VL01N      | Order                         | `{SO_NUMBER}`       | From Phase 1                          |
| 2.6  | Click    | VL01N      | Continue button               | —                   | Delivery document created             |
| 2.7  | Assert   | VL01N      | Delivery overview             | —                   | Material TG11, Qty 20                 |
| 2.8  | Press    | VL01N      | Ctrl+S (Save)                 | —                   | Delivery saved                        |
| 2.9  | Capture  | VL01N      | Status bar message            | —                   | "Delivery {DL_NUMBER} has been saved" |

### Phase 3: Picking (VL06O — Outbound Delivery Monitor)

| Step | Action   | App        | Field / Element                | Value         | Expected Result   |
| ---- | -------- | ---------- | ------------------------------ | ------------- | ----------------- |
| 3.1  | Navigate | FLP Search | Search box                     | `VL06O`       | Results found     |
| 3.2  | Click    | FLP        | Outbound Delivery Monitor link | —             | VL06O opens       |
| 3.3  | Fill     | VL06O      | Shipping Point                 | `1010`        | —                 |
| 3.4  | Fill     | VL06O      | Delivery                       | `{DL_NUMBER}` | From Phase 2      |
| 3.5  | Click    | VL06O      | Execute button                 | —             | Delivery listed   |
| 3.6  | Select   | VL06O      | Delivery row                   | —             | Row selected      |
| 3.7  | Click    | VL06O      | Pick button                    | —             | Picking processed |

### Phase 4: Goods Issue & Delivery Output (VL03N)

| Step | Action   | App        | Field / Element  | Value         | Expected Result               |
| ---- | -------- | ---------- | ---------------- | ------------- | ----------------------------- |
| 4.1  | Navigate | FLP Search | Search box       | `VL02N`       | Change Outbound Delivery      |
| 4.2  | Fill     | VL02N      | Delivery         | `{DL_NUMBER}` | —                             |
| 4.3  | Click    | VL02N      | Post Goods Issue | —             | Goods issue posted            |
| 4.4  | Press    | VL02N      | Ctrl+S (Save)    | —             | GI document created           |
| 4.5  | Navigate | FLP Search | Search box       | `VL03N`       | Display Outbound Delivery     |
| 4.6  | Fill     | VL03N      | Delivery         | `{DL_NUMBER}` | —                             |
| 4.7  | Assert   | VL03N      | Status           | —             | Status = "Goods Issue Posted" |

### Phase 5: Billing (Fiori Elements Apps)

| Step | Action   | App          | Field / Element         | Value                               | Expected Result            |
| ---- | -------- | ------------ | ----------------------- | ----------------------------------- | -------------------------- |
| 5.1  | Navigate | FLP Search   | Search box              | `Create Billing Documents` (F2875)  | Fiori Elements V2 app      |
| 5.2  | Fill     | F2875 Filter | Sales Order             | `{SO_NUMBER}`                       | —                          |
| 5.3  | Click    | F2875        | Go / Search             | —                                   | Deliveries for SO listed   |
| 5.4  | Select   | F2875        | Delivery row            | —                                   | Row selected               |
| 5.5  | Click    | F2875        | Create Billing Document | —                                   | Billing document created   |
| 5.6  | Navigate | FLP Search   | Search box              | `Display Billing Documents` (F0798) | —                          |
| 5.7  | Fill     | F0798 Filter | Billing Document        | `{BILL_NUMBER}`                     | —                          |
| 5.8  | Click    | F0798        | Go                      | —                                   | Billing document displayed |
| 5.9  | Assert   | F0798        | Net Value               | `351.00 EUR`                        | Matches sales order        |

### Phase 6: Backend Verification

| Step | Action | OData Service         | Entity             | Filter                 | Expected                         |
| ---- | ------ | --------------------- | ------------------ | ---------------------- | -------------------------------- |
| 6.1  | GET    | `API_SALES_ORDER_SRV` | `A_SalesOrder`     | `SalesOrder eq '{SO}'` | Type=OR, Org=1010, Cust=10100001 |
| 6.2  | GET    | `API_SALES_ORDER_SRV` | `A_SalesOrderItem` | `SalesOrder eq '{SO}'` | Material=TG11, Qty=20            |

---

## SAP GUI for HTML Interaction Patterns (Discovered)

### Key Findings

1. **Iframe encapsulation**: All SAP GUI screens render inside `iframe[name="__container158-iframe"]`
2. **Grid cell editing**: SAP GUI HTML grids use custom `<span role="textbox">` elements. Must **click cell first** to activate, then fill the activated input.
3. **Dialogs**: Popups use `urPopupWindowBlockLayer` overlay. Must interact with dialog buttons directly.
4. **Enter key**: Required after filling customer/material fields to trigger SAP lookups and determination.
5. **Availability check dialog**: May appear as "Review Availability Check Result" — click "Apply" to accept.
6. **Save/Exit dialogs**: "Do you wish to save your data?" with Yes/No/Cancel buttons.
7. **FLP search**: Use search combobox to find apps by transaction code (VA01, VL01N, etc.).

### Selector Strategy (ABAP Freestyle — SAP GUI for HTML)

| Element Type    | Strategy                                                | Example                          |
| --------------- | ------------------------------------------------------- | -------------------------------- |
| Input fields    | `textbox` role with label                               | `textbox "Order Type"`           |
| Buttons         | `button` role with name                                 | `button "Continue"`              |
| Grid cells      | Click `gridcell` → fill activated `textbox`             | Click empty cell, then type      |
| Tabs            | `tab` role with name                                    | `tab "Item Overview"`            |
| Dropdowns       | `textbox` with adjacent arrow `generic[cursor=pointer]` | Click arrow → select `option`    |
| Status messages | `alert` role                                            | Parse text content               |
| Dialogs         | `dialog` role with title                                | `dialog "Exit Order Processing"` |

---

## Risk Assessment

| Risk                                        | Impact                                        | Mitigation                               |
| ------------------------------------------- | --------------------------------------------- | ---------------------------------------- |
| No stock for TG11 at Plant 1010             | **HIGH** — Blocks delivery creation           | MIGO goods receipt (Phase 0)             |
| Confirmed Qty is ATP-determined (readonly)  | **MEDIUM** — Cannot manually override         | Ensure stock exists before SO creation   |
| SAP GUI control IDs are dynamic             | **HIGH** — Cannot use Fiori stable IDs        | Use aria labels and role-based selectors |
| Availability check popup may/may not appear | **MEDIUM** — Conditional dialog handling      | Add conditional step to handle dialog    |
| VL248 error on VL01N                        | **HIGH** — No delivery without schedule lines | Post goods receipt first                 |
