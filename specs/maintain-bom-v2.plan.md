# Maintain Bill of Material (Version 2) — Test Plan

## Application Overview

| Property          | Value                                                                  |
| ----------------- | ---------------------------------------------------------------------- |
| System            | SAP S/4HANA Cloud — Partner Demo Customizing LXG/100, Client 100       |
| URL               | `https://my403147.s4hana.cloud.sap/ui#MaterialBOM-maintainMaterialBOM` |
| UI5 Version       | 1.142.6                                                                |
| OData Version     | V4                                                                     |
| Control Framework | MDC (`sap.ui.mdc.*`) — NOT Smart controls                              |
| Service Namespace | `com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001`                |
| Fiori Floorplan   | List Report + Object Page (Fiori Elements V4)                          |
| App Component     | `pise.mi.plm.bom.core::BOMHeaderList`                                  |
| FLP Space Tab     | Bills Of Material                                                      |
| Tile Header       | Maintain Bill Of Material (Version 2)                                  |
| Seed File         | `tests/seeds/sap-seed.spec.ts`                                         |
| Discovery Date    | Live exploration session                                               |

### Control IDs Discovered

| Control              | ID                                                                                      | Type                          |
| -------------------- | --------------------------------------------------------------------------------------- | ----------------------------- |
| Create BOM Button    | `...fe::table::BOMHeader::LineItem::DataFieldForAction::...CreateBOM::...BOMHeaderType` | `sap.m.Button`                |
| Create BOM Dialog    | `fe::APD_::...CreateBOM`                                                                | `sap.m.Dialog`                |
| Dialog OK Button     | `fe::APD_::...CreateBOM::Action::Ok`                                                    | `sap.m.Button` (Emphasized)   |
| Dialog Cancel Button | `fe::APD_::...CreateBOM::Action::Cancel`                                                | `sap.m.Button`                |
| Material Field       | `APD_::Material`                                                                        | `sap.ui.mdc.Field` (required) |
| Material Inner       | `APD_::Material-inner`                                                                  | `sap.ui.mdc.field.FieldInput` |
| Plant Field          | `APD_::Plant`                                                                           | `sap.ui.mdc.Field`            |
| Plant Inner          | `APD_::Plant-inner`                                                                     | `sap.ui.mdc.field.FieldInput` |
| BOM Usage Field      | `APD_::BillOfMaterialVariantUsage`                                                      | `sap.ui.mdc.Field` (required) |
| BOM Usage Inner      | `APD_::BillOfMaterialVariantUsage-inner`                                                | `sap.ui.mdc.field.FieldInput` |
| Alternative BOM      | `APD_::BillOfMaterialVariant`                                                           | `sap.ui.mdc.Field`            |
| Change Number        | `APD_::ChangeNumber`                                                                    | `sap.ui.mdc.Field`            |
| Valid From Field     | `APD_::ValidityStartDate`                                                               | `sap.ui.mdc.Field`            |
| Valid From Inner     | `APD_::ValidityStartDate-inner`                                                         | `sap.m.DatePicker`            |

### Value Help Reference

| Field     | VH Type                        | Items | Columns                                | Example Values                                                                                                                                       |
| --------- | ------------------------------ | ----- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Material  | MDC ValueHelp → MDCTable       | 549   | Material, Material Description         | 41 (CG PVT LTD), 31 (Steel rod), 2 (Civil Works)                                                                                                     |
| Plant     | MDC ValueHelp → MDCTable       | 7     | Plant, Plant Name, Valuation Area, ... | 1010 (DE Plant), 1110 (GB Plant), 1210 (FR Plant)                                                                                                    |
| BOM Usage | MDC ValueHelp → Suggest MTable | 7     | Key, Description                       | 1 (Production), 2 (Engineering/Design), 3 (Universal), 4 (Plant Maintenance), 5 (Sales and Distribution), P (Predictive MRP), S (Service Management) |

### V4 MDC Interaction Patterns (from live discovery)

1. **MDC Field setValue**: Use `setValue(key)` on the outer `sap.ui.mdc.Field` control for key-based assignment, then `fireChange({ value: key })` + `waitForUI5()`.
2. **MDC FieldInput**: The inner `sap.ui.mdc.field.FieldInput` (`-inner`) holds the display value. Use `getValue()` on inner for display text.
3. **Value Help Selection**: Open VH via press on VH icon (`-inner-vhi`), wait for VH `isOpen()`, read data via `getContextByIndex().getObject()`, close VH, then `setValue` on field.
4. **BOM Usage (Suggest Popover)**: Use `setValue(key)` on the MDC Field directly. `setSelectedKey()` is NOT available on MDC Fields — causes validation error.
5. **Date Field**: Inner control is `sap.m.DatePicker`. Pre-filled with today's date. Read via `getValue()` on inner.

---

## Test Scenarios

### 1. Navigation to BOM Application

**Seed:** `tests/seeds/sap-seed.spec.ts`

#### 1.1. Navigate from FLP Home to Maintain BOM V2 app

**File:** `tests/e2e/sap-cloud/maintain-bom-v2-gold-standard.spec.ts`

**Steps:**

1. Verify FLP Home page loaded after authentication
   - expect: Page title contains 'Home'
   - expect: Shell bar visible

2. Click 'Bills Of Material' space tab in FLP navigation
   - expect: FLP space switches to Bills Of Material section
   - expect: BOM-related tiles become visible

3. Click 'Maintain Bill Of Material (Version 2)' tile (`sap.m.GenericTile`)
   - expect: URL hash changes to `#MaterialBOM-maintainMaterialBOM`
   - expect: List Report page loads

4. Wait for V4 List Report to fully load
   - expect: Create BOM button is visible and enabled (text = 'Create BOM')
   - expect: Filter bar with Editing Status, Material, Plant, BOM Usage, Alternative BOM is visible

---

### 2. Create BOM Dialog Interactions

#### 2.1. Open Create BOM dialog and verify field structure

**Steps:**

1. Click 'Create BOM' button in table toolbar
   - expect: `sap.m.Dialog` opens with title 'Create BOM'
   - expect: Material field exists (`APD_::Material`, type: `sap.ui.mdc.Field`, required: true)
   - expect: BOM Usage field exists (`APD_::BillOfMaterialVariantUsage`, type: `sap.ui.mdc.Field`, required: true)

2. Verify all six dialog fields are present
   - expect: Material* (required), Plant, BOM Usage* (required), Alternative BOM, Change Number, Valid From
   - expect: Valid From date is pre-filled with today's date

3. Verify dialog footer buttons
   - expect: 'Create BOM' submit button (Emphasized) — text: 'Create BOM', enabled: true
   - expect: 'Cancel' button — text: 'Cancel', enabled: true

#### 2.2. Test Material Value Help selection

**Steps:**

1. Press Material VH icon (`APD_::Material-inner-vhi`)
   - expect: ValueHelp dialog opens (`isOpen() === true`)
   - expect: Inner table is `sap.ui.table.Table` with Material and Description columns

2. Poll for OData data load via `getContextByIndex(0).getObject()`
   - expect: At least one row with `Material` property loaded
   - expect: Items include material '41' (CG PVT LTD)

3. Close ValueHelp, set Material value on inner FieldInput
   - expect: Material field displays selected material (e.g., 'CG PVT LTD (41)')

#### 2.3. Test Plant Value Help selection

**Steps:**

1. Press Plant VH icon (`APD_::Plant-inner-vhi`)
   - expect: ValueHelp dialog opens
   - expect: Inner table shows 7 plants

2. Poll for OData data load
   - expect: Row data includes Plant '1110' (GB Plant)

3. Close ValueHelp, set Plant value on inner FieldInput
   - expect: Plant field displays selected plant (e.g., 'GB Plant (1110)')

#### 2.4. Test BOM Usage field (MDC suggest popover)

**Steps:**

1. Set BOM Usage via `setValue(key)` on MDC Field (NOT setSelectedKey — unsupported)
   - Use key '3' for Universal, or '1' for Production
   - expect: BOM Usage field value equals the set key
   - expect: Display text shows corresponding description (e.g., 'Universal (3)')

---

### 3. Complete BOM Creation Flow (Happy Path)

#### 3.1. Fill all mandatory fields and submit

**Steps:**

1. Open Create BOM dialog via toolbar button press
   - expect: Dialog opens

2. Fill Material via Value Help — select material '41' (CG PVT LTD)
   - Open VH → read first valid material from binding context → close VH → setValue on FieldInput
   - expect: Material field populated with 'CG PVT LTD (41)'

3. Fill Plant via Value Help — select plant '1110' (GB Plant)
   - Open VH → read valid plant from binding context → close VH → setValue on FieldInput
   - expect: Plant field populated with 'GB Plant (1110)'

4. Fill BOM Usage — set key '3' (Universal)
   - setValue('3') on MDC Field + fireChange + waitForUI5
   - expect: BOM Usage field value = '3'

5. Verify all required fields filled before submission
   - expect: Material inner value is truthy
   - expect: BOM Usage key is '3'
   - expect: Valid From date is set
   - expect: Create BOM button is enabled

6. Press 'Create BOM' submit button (`fe::APD_::...CreateBOM::Action::Ok`)
   - expect: V4 bound action triggers
   - expect (success): Dialog closes → returns to List Report
   - expect (draft conflict): Error message 'Bill Of Material already exists in draft mode by {user}'
   - expect (validation error): SAP error dialog with M3351 or similar

7. Handle outcome:
   - If success: Verify Create BOM button visible in toolbar (back on List Report)
   - If error dialog: Close error dialog → Cancel Create BOM dialog → verify return to List Report

---

### 4. Negative / Edge Case Scenarios

#### 4.1. Verify required field validation

**Steps:**

1. Open Create BOM dialog
   - expect: Dialog opens

2. Leave Material and BOM Usage empty, click 'Create BOM'
   - expect: Validation error — required fields highlighted
   - expect: Dialog remains open

3. Cancel dialog
   - expect: Dialog closes cleanly

#### 4.2. Handle duplicate BOM draft conflict

**Steps:**

1. Fill valid data: Material=41, Plant=1110, BOM Usage=3
   - expect: All fields populated

2. Click 'Create BOM'
   - expect: Error message containing 'already exists in draft mode'
   - expect: Error dialog / message strip visible

3. Close error and cancel dialog
   - expect: Return to List Report

#### 4.3. Verify dialog cancel preserves no state

**Steps:**

1. Open dialog, fill Material=41
   - expect: Material populated

2. Click Cancel
   - expect: Dialog closes

3. Open dialog again
   - expect: Material field is empty (no state persistence from cancelled dialog)

---

## Praman Fixtures Used

| Fixture             | Method                | Usage                                          |
| ------------------- | --------------------- | ---------------------------------------------- |
| `ui5`               | `control()`           | Find MDC Field, Button, Dialog controls        |
| `ui5`               | `press()`             | Button press, VH icon press                    |
| `ui5`               | `fill()`              | FieldInput value fill (setValue + events)      |
| `ui5`               | `getValue()`          | Read FieldInput display / MDC Field key        |
| `ui5`               | `waitForUI5()`        | Wait for UI5 rendering stability               |
| Control proxy       | `setValue()`          | Set MDC Field key value                        |
| Control proxy       | `fireChange()`        | Fire change event after setValue               |
| Control proxy       | `getProperty()`       | Read control properties (text, enabled)        |
| Control proxy       | `getControlType()`    | Verify control type                            |
| Control proxy       | `getRequired()`       | Check required field status                    |
| Control proxy       | `getEnabled()`        | Check button enabled state                     |
| Control proxy       | `isOpen()`            | Check ValueHelp/Dialog open state              |
| Control proxy       | `close()`             | Close ValueHelp                                |
| Control proxy       | `getContextByIndex()` | Read OData binding data from VH table          |
| `page` (Playwright) | `goto()`              | Initial navigation (non-UI5)                   |
| `page` (Playwright) | `getByText()`         | FLP space tab click (IconTabFilter workaround) |
| `page` (Playwright) | `waitForLoadState()`  | Page load verification                         |
