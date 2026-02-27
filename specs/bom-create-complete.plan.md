# BOM Create Complete Flow — Test Plan

## Application Overview

- **App**: SAP S/4HANA Cloud - Maintain Bill of Material (Version 2)
- **Type**: Fiori Elements V4 List Report with Create BOM Action Parameter Dialog
- **URL**: `https://my403147.s4hana.cloud.sap/ui#MaterialBOM-maintainMaterialBOM`
- **UI5 Version**: 1.142.4
- **System**: Partner Demo Customizing LXG/100
- **OData Version**: V4
- **Control Framework**: MDC (sap.ui.mdc) — NOT SmartField (sap.ui.comp)

## Discovery Date

27 February 2026 — Live discovery via Playwright MCP + browser_run_code

## UI5 Control Map (Discovered)

### Service Namespace

```
com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001
```

### App Component

```
pise.mi.plm.bom.core::BOMHeaderList
```

### List Report — Toolbar

| Control       | ID                                                                                                                                                                                                                                          | Type           | Text          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------- |
| Create BOM    | `pise.mi.plm.bom.core::BOMHeaderList--fe::table::BOMHeader::LineItem::DataFieldForAction::com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::Collection::com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.BOMHeaderType` | `sap.m.Button` | Create BOM    |
| Go            | `pise.mi.plm.bom.core::BOMHeaderList--fe::FilterBar::BOMHeader-btnSearch`                                                                                                                                                                   | `sap.m.Button` | Go            |
| Adapt Filters | `pise.mi.plm.bom.core::BOMHeaderList--fe::FilterBar::BOMHeader-btnAdapt`                                                                                                                                                                    | `sap.m.Button` | Adapt Filters |

### List Report — Filter Bar (MDC FilterFields)

| Field           | Type                                                          |
| --------------- | ------------------------------------------------------------- |
| Editing Status  | `sap.ui.mdc.FilterField` → `sap.m.Select`                     |
| Material        | `sap.ui.mdc.FilterField` → `sap.ui.mdc.field.FieldMultiInput` |
| Plant           | `sap.ui.mdc.FilterField` → `sap.ui.mdc.field.FieldMultiInput` |
| BOM Usage       | `sap.ui.mdc.FilterField` → `sap.ui.mdc.field.FieldMultiInput` |
| Alternative BOM | `sap.ui.mdc.FilterField` → `sap.ui.mdc.field.FieldMultiInput` |

### Create BOM Dialog (sap.m.Dialog)

| Control                 | ID                                                                                          | Type                          | Required | Value Help                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| Dialog                  | `fe::APD_::com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM`                 | `sap.m.Dialog`                | —        | —                                                                                                             |
| Material (outer)        | `APD_::Material`                                                                            | `sap.ui.mdc.Field`            | true     | `com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::Material::FieldValueHelp`                   |
| Material (inner)        | `APD_::Material-inner`                                                                      | `sap.ui.mdc.field.FieldInput` | true     | —                                                                                                             |
| Material VH Icon        | `APD_::Material-inner-vhi`                                                                  | `sap.ui.core.Icon`            | —        | —                                                                                                             |
| Plant (outer)           | `APD_::Plant`                                                                               | `sap.ui.mdc.Field`            | false    | `com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::Plant::FieldValueHelp`                      |
| Plant (inner)           | `APD_::Plant-inner`                                                                         | `sap.ui.mdc.field.FieldInput` | false    | —                                                                                                             |
| Plant VH Icon           | `APD_::Plant-inner-vhi`                                                                     | `sap.ui.core.Icon`            | —        | —                                                                                                             |
| BOM Usage (outer)       | `APD_::BillOfMaterialVariantUsage`                                                          | `sap.ui.mdc.Field`            | true     | `com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::BillOfMaterialVariantUsage::FieldValueHelp` |
| BOM Usage (inner)       | `APD_::BillOfMaterialVariantUsage-inner`                                                    | `sap.ui.mdc.field.FieldInput` | true     | —                                                                                                             |
| BOM Usage VH Icon       | `APD_::BillOfMaterialVariantUsage-inner-vhi`                                                | `sap.ui.core.Icon`            | —        | —                                                                                                             |
| Alternative BOM (outer) | `APD_::BillOfMaterialVariant`                                                               | `sap.ui.mdc.Field`            | false    | —                                                                                                             |
| Alternative BOM (inner) | `APD_::BillOfMaterialVariant-inner`                                                         | `sap.ui.mdc.field.FieldInput` | false    | —                                                                                                             |
| Change Number (outer)   | `APD_::ChangeNumber`                                                                        | `sap.ui.mdc.Field`            | false    | VH available                                                                                                  |
| Change Number (inner)   | `APD_::ChangeNumber-inner`                                                                  | `sap.ui.mdc.field.FieldInput` | false    | —                                                                                                             |
| Valid From (outer)      | `APD_::ValidityStartDate`                                                                   | `sap.ui.mdc.Field`            | false    | —                                                                                                             |
| Valid From (inner)      | `APD_::ValidityStartDate-inner`                                                             | `sap.m.DatePicker`            | false    | —                                                                                                             |
| Create BOM (submit)     | `fe::APD_::com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::Action::Ok`     | `sap.m.Button`                | —        | —                                                                                                             |
| Cancel                  | `fe::APD_::com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::Action::Cancel` | `sap.m.Button`                | —        | —                                                                                                             |

### Value Help: Material

| Property         | Value                                                                                                                              |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| VH Control       | `com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::Material::FieldValueHelp`                                        |
| VH Type          | `sap.ui.mdc.ValueHelp`                                                                                                             |
| Inner Table      | `com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::Material::FieldValueHelp::Dialog::qualifier::::Table-innerTable` |
| Inner Table Type | `sap.ui.table.Table`                                                                                                               |
| Columns          | Material, Material Description                                                                                                     |
| Items Count      | 549                                                                                                                                |
| Sample Data      | `{ Material: "2", MaterialDescription: "Civil Works" }`, `{ Material: "42", MaterialDescription: "Capgemini ltd" }`                |

### Value Help: Plant

| Property         | Value                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| VH Control       | `com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::Plant::FieldValueHelp`                                        |
| VH Type          | `sap.ui.mdc.ValueHelp`                                                                                                          |
| Inner Table      | `com.sap.gateway.srvd.ui_billofmaterial_maintain.v0001.CreateBOM::Plant::FieldValueHelp::Dialog::qualifier::::Table-innerTable` |
| Inner Table Type | `sap.ui.table.Table`                                                                                                            |
| Columns          | Plant, Plant Name, Valuation Area, ... (12 columns)                                                                             |
| Items Count      | 7                                                                                                                               |
| Plants           | 1010 (DE Plant), 1110 (GB Plant), 1210 (FR Plant), THDO (Thalès Dourdan), Z1PL, Z2PL, Z3PL                                      |

### Value Help: BOM Usage

| Property      | Value                                                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type          | `sap.ui.mdc.ValueHelp` — Suggest popover (dropdown)                                                                                                  |
| Options Count | 7                                                                                                                                                    |
| Options       | Production (1), Engineering/Design (2), Universal (3), Plant Maintenance (4), Sales and Distribution (5), Predictive MRP (P), Service Management (S) |

### Error Dialog (Validation Error)

| Property      | Value                                                      |
| ------------- | ---------------------------------------------------------- |
| Type          | `sap.m.Dialog` (alertdialog)                               |
| Title         | "Navigate Back Error"                                      |
| Error Message | "Material 000000000000000042 not maintained in plant 1010" |
| Diagnosis     | Explains missing plant data for material                   |
| Procedure     | "Make sure your entries are correct."                      |
| Message No.   | M3351                                                      |
| Close Button  | `sap.m.Button` text "Close"                                |

## UI5 Methods Used (Praman Proxy)

| Method                                   | Used For                                     |
| ---------------------------------------- | -------------------------------------------- |
| `ui5.control({ id })`                    | Find MDC Field, Button, Dialog by stable ID  |
| `ui5.press({ id })`                      | Click buttons (Create BOM, VH icons, Cancel) |
| `ui5.press({ controlType, properties })` | Click GenericTile by header text             |
| `ui5.fill({ id }, value)`                | Set field value (setValue + fireChange)      |
| `ui5.waitForUI5()`                       | Wait for UI5 busyIndicator / OData calls     |
| `ui5.getValue({ id })`                   | Read MDC FieldInput display value            |
| `control.setValue(key)`                  | Set MDC Field key programmatically           |
| `control.getValue()`                     | Read MDC Field key value                     |
| `control.getProperty(prop)`              | Read text, enabled, title                    |
| `control.getRequired()`                  | Check required fields                        |
| `control.getEnabled()`                   | Check button enabled state                   |
| `control.getControlType()`               | Verify control type                          |
| `control.isOpen()`                       | Check ValueHelp/Dialog open state            |
| `control.close()`                        | Close ValueHelp dialog                       |
| `innerTable.getContextByIndex(n)`        | Get OData binding context from VH table row  |
| `ctx.getObject()`                        | Extract entity data from binding context     |

## Test Scenarios

### Scenario 1: Complete BOM Creation Flow (Happy + Error Path)

**File**: `tests/e2e/sap-cloud/bom-create-flow-gold.spec.ts`

**Seed**: `seeds/sap-seed.spec.ts` (inline auth via raw Playwright)

**Steps**:

1. **Navigate to BOM App** — FLP Home → Bills Of Material tab → Maintain Bill Of Material (Version 2) tile
   - UI5: `page.getByText('Bills Of Material')` (FLP tab - DOM click required), `ui5.press({ controlType: 'sap.m.GenericTile', properties: { header: 'Maintain Bill Of Material (Version 2)' } })`
   - expect: Page title = "Maintain Bill of Material", Create BOM button visible and enabled

2. **Open Create BOM Dialog** — Click Create BOM toolbar button
   - UI5: `ui5.press({ id: IDS.createBOMToolbarBtn })`
   - expect: Dialog opens with title "Create BOM", Material field (required), BOM Usage (required), Valid From pre-filled

3. **Select Material via Value Help** — Open Material VH, select a material
   - UI5: `ui5.press({ id: IDS.materialVHIcon })`, poll `materialVH.isOpen()`, `innerTable.getContextByIndex(0).getObject()`, click cell
   - expect: Material field populated (e.g., "Capgemini ltd (42)")

4. **Select Plant via Value Help** — Open Plant VH, select plant 1010
   - UI5: `ui5.press({ id: IDS.plantVHIcon })`, poll `plantVH.isOpen()`, click plant cell
   - expect: Plant field populated (e.g., "DE Plant (1010)")

5. **Select BOM Usage** — Set BOM Usage to Production (1)
   - UI5: `bomUsageField.setValue('1')` (MDC Field — setValue with key)
   - expect: BOM Usage = "1" (Production)

6. **Verify Form Values** — Check all required fields filled
   - UI5: `ui5.getValue()` on each inner field, `okBtn.getEnabled()`
   - expect: Material has value, BOM Usage = "1", Valid From set, Create BOM button enabled

7. **Submit Create BOM** — Click Create BOM submit button
   - UI5: `ui5.press({ id: IDS.dialogOkBtn })`
   - expect: Either success (dialog closes) or error dialog with validation message

8. **Handle Error (if any)** — Close error dialog, cancel Create BOM dialog
   - UI5: `ui5.press({ controlType: 'sap.m.Button', properties: { text: 'Close' } })`, `ui5.press({ id: IDS.dialogCancelBtn })`
   - expect: Back on List Report, Create BOM button visible

### Scenario 2: Validation Error for Invalid Material-Plant Combination

**File**: `tests/e2e/sap-cloud/bom-validation-error-gold.spec.ts`

**Seed**: `seeds/sap-seed.spec.ts`

**Steps**:

1. **Navigate & Open Dialog** — Same as Scenario 1, Steps 1-2

2. **Select Material "42" (Capgemini ltd)** — Known invalid combination with Plant 1010
   - UI5: Open Material VH, find and select Material 42
   - expect: Material = "Capgemini ltd (42)"

3. **Select Plant "1010" (DE Plant)** — Invalid for Material 42
   - UI5: Open Plant VH, select Plant 1010
   - expect: Plant = "DE Plant (1010)"

4. **Set BOM Usage to Production (1)**
   - UI5: `bomUsageField.setValue('1')`
   - expect: BOM Usage = "1"

5. **Submit and Verify Error**
   - UI5: `ui5.press({ id: IDS.dialogOkBtn })`
   - expect: Error dialog with title "Navigate Back Error"
   - expect: Error message: "Material 000000000000000042 not maintained in plant 1010"
   - expect: Diagnosis section explains missing plant data
   - expect: Procedure: "Make sure your entries are correct."
   - expect: Message no. M3351

6. **Close Error Dialog**
   - UI5: Click "Close" button on error dialog
   - expect: Error dialog closes, Create BOM dialog remains open with values preserved

7. **Cancel Create BOM Dialog**
   - UI5: `ui5.press({ id: IDS.dialogCancelBtn })`
   - expect: Dialog closes, List Report visible with Create BOM button
