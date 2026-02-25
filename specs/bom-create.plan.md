# BOM Create Flow — Test Plan

## Application Overview

SAP S/4HANA Cloud - Maintain Bill of Material (Version 2) application. Fiori Elements V4 List Report with Create BOM dialog. URL: https://<your-system>.s4hana.cloud.sap/ui#MaterialBOM-maintainMaterialBOM. UI5 Version: 1.142.4. System: Partner Demo Customizing LXG/100. Controls use MDC field types (sap.ui.mdc.field.FieldInput), not classic SmartFields.

## Test Scenarios

### 1. BOM Navigation and App Loading

**Seed:** `tests/integration/sap-planner-seed.spec.ts`

#### 1.1. Navigate to Maintain BOM app from FLP

**File:** `tests/e2e/bom-create/navigate-to-bom-app.spec.ts`

**Steps:**

1. Verify FLP Home page loaded after login
   - expect: Page title should contain 'Home'
   - expect: Shell Bar should be visible with 'S/4HANA Cloud' text

2. Click on 'Bills Of Material' tab in the FLP space navigation
   - expect: 'Bills Of Material' tab becomes selected/active
   - expect: BOM Management section with tiles becomes visible

3. Click on 'Maintain Bill Of Material (Version 2)' tile
   - expect: Page navigates to #MaterialBOM-maintainMaterialBOM
   - expect: Page title changes to 'Maintain Bill of Material - S/4HANA Cloud'

4. Wait for List Report to fully load
   - expect: Filter bar is visible with fields: Editing Status, Material, Plant, BOM Usage, Alternative BOM
   - expect: 'Go' and 'Adapt Filters' buttons are visible
   - expect: 'Create BOM' button is visible and enabled in table toolbar
   - expect: Table shows 'Let's get some results' empty state message

### 2. Create BOM Dialog Interactions

**Seed:** `tests/integration/sap-planner-seed.spec.ts`

#### 2.1. Open Create BOM dialog and verify fields

**File:** `tests/e2e/bom-create/open-create-bom-dialog.spec.ts`

**Steps:**

1. Click 'Create BOM' button in the table toolbar
   - expect: Create BOM dialog opens
   - expect: Dialog has heading 'Create BOM'

2. Verify all dialog fields are present
   - expect: Material field is visible (required, marked with \*)
   - expect: Plant field is visible
   - expect: BOM Usage field is visible (required, marked with \*)
   - expect: Alternative BOM field is visible
   - expect: Change Number field is visible
   - expect: Valid From field is visible with today's date pre-filled (24.02.2026)

3. Verify dialog footer buttons
   - expect: 'Create BOM' submit button is visible and enabled
   - expect: 'Cancel' button is visible and enabled

4. Click 'Cancel' button to close dialog
   - expect: Dialog closes
   - expect: List Report page is visible again

#### 2.2. Test Material Value Help in Create BOM dialog

**File:** `tests/e2e/bom-create/material-value-help.spec.ts`

**Steps:**

1. Click 'Create BOM' button to open dialog
   - expect: Create BOM dialog opens

2. Click 'Show Value Help' button next to Material field
   - expect: 'Select: Material' dialog opens
   - expect: Grid shows columns: Material, Material Description
   - expect: Items count header shows total (e.g. 'Items (549)')

3. Verify material data is loaded in value help table
   - expect: At least one row with Material number and description is visible
   - expect: Example rows: '2 - Civil Works', '31 - Steel rod', '42 - Capgemini ltd'

4. Click on a material row (e.g. '31 - Steel rod')
   - expect: Value help dialog closes
   - expect: Material field is populated with 'Steel rod (31)'

5. Click 'Cancel' to close Create BOM dialog
   - expect: Dialog closes cleanly

#### 2.3. Test Plant Value Help in Create BOM dialog

**File:** `tests/e2e/bom-create/plant-value-help.spec.ts`

**Steps:**

1. Click 'Create BOM' button to open dialog
   - expect: Create BOM dialog opens

2. Click 'Show Value Help' button next to Plant field
   - expect: 'Select: Plant' dialog opens
   - expect: Grid shows columns: Plant, Plant Name, Valuation Area, and more
   - expect: Items count shows total (e.g. 'Items (7)')

3. Verify plant data is loaded
   - expect: Plants listed include: 1010 (DE Plant), 1110 (GB Plant), 1210 (FR Plant), THDO (Thalès Dourdan), Z1PL, Z2PL, Z3PL

4. Click on plant row '1010 - DE Plant'
   - expect: Value help dialog closes
   - expect: Plant field is populated with 'DE Plant (1010)'

5. Click 'Cancel' to close Create BOM dialog
   - expect: Dialog closes cleanly

#### 2.4. Test BOM Usage dropdown in Create BOM dialog

**File:** `tests/e2e/bom-create/bom-usage-dropdown.spec.ts`

**Steps:**

1. Click 'Create BOM' button to open dialog
   - expect: Create BOM dialog opens

2. Click 'Show Value Help' button next to BOM Usage field
   - expect: Dropdown/dialog opens with available BOM usage types

3. Verify BOM Usage options are available
   - expect: Options include: Production (1), Engineering/Design (2), Universal (3), Plant Maintenance (4), Sales and Distribution (5), Predictive MRP (P), Service Management (S)

4. Select 'Production (1)' from the dropdown
   - expect: BOM Usage field shows 'Production (1)'

5. Click 'Cancel' to close Create BOM dialog
   - expect: Dialog closes cleanly

### 3. Complete BOM Creation Flow

**Seed:** `tests/integration/sap-planner-seed.spec.ts`

#### 3.1. Fill all fields and submit Create BOM form

**File:** `tests/e2e/bom-create/complete-bom-creation.spec.ts`

**Steps:**

1. Navigate to Maintain Bill of Material app and click Create BOM
   - expect: Create BOM dialog opens with all fields visible

2. Select Material via Value Help - pick a valid material with plant data
   - expect: Material field is populated with selected material

3. Select Plant via Value Help - pick plant matching the material
   - expect: Plant field is populated with selected plant

4. Select BOM Usage 'Production (1)' from dropdown
   - expect: BOM Usage field shows 'Production (1)'

5. Verify all required fields are filled before submission
   - expect: Material field has a value
   - expect: BOM Usage field has value 'Production (1)'
   - expect: Valid From date is set
   - expect: Create BOM button is enabled

6. Click 'Create BOM' submit button in dialog footer
   - expect: If valid combination: dialog closes and BOM is created, user returns to list report
   - expect: If invalid combination: error message dialog appears with SAP diagnosis (e.g. 'Material not maintained in plant')

7. If error occurs, close error dialog and cancel Create BOM dialog
   - expect: Error dialog closes
   - expect: Create BOM dialog closes
   - expect: User returns to list report

#### 3.2. Verify validation errors for invalid material-plant combination

**File:** `tests/e2e/bom-create/validation-error-handling.spec.ts`

**Steps:**

1. Open Create BOM dialog
   - expect: Dialog opens

2. Select Material '31 - Steel rod' and Plant '1010 - DE Plant' (known invalid combination)
   - expect: Both fields are populated

3. Select BOM Usage 'Production (1)'
   - expect: BOM Usage is set

4. Click 'Create BOM' submit button
   - expect: Error dialog appears with title 'Navigate Back Error'
   - expect: Error message: 'Material 000000000000000031 not maintained in plant 1010'
   - expect: Diagnosis section explains the issue
   - expect: Procedure section says 'Make sure your entries are correct' with Message no. M3351

5. Click 'Close' button on error dialog
   - expect: Error dialog closes
   - expect: Create BOM dialog remains open with values preserved

6. Click 'Cancel' to close Create BOM dialog
   - expect: Dialog closes
   - expect: User returns to list report
