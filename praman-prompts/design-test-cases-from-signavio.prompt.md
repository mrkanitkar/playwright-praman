---
name: Design Test Cases from Signavio
version: 1.0.0
business-process: 'Cross-Process (BPMN-based Test Design)'
sap-transactions: 'N/A — input is Signavio BPMN 2.0 XML, not transaction-specific'
complexity: 'medium'
estimated-steps: 12
tags: ['signavio', 'bpmn', 'test-design', 'test-cases', 'cloud-alm', 'csv']
praman-version: '>=1.1.0'
---

# Design Test Cases from Signavio — BPMN-to-Test-Case Generation

> **Disclaimer**: This prompt is provided as an **example template** and must be
> fine-tuned based on your actual SAP system configuration, BPMN process model,
> and the LLM/AI agent you are using. CSV column mappings, role assignments, and
> test design techniques referenced here are illustrative — always validate
> against your target SAP Cloud ALM environment during Phase 1 (Wizard Mode).

## System Context

You are an SAP test design architect. Your task is to analyze BPMN 2.0 XML files
exported from SAP Signavio Process Manager and produce structured test cases in
SAP Cloud ALM CSV format, applying professional test design techniques.

## Goal

Parse a Signavio BPMN 2.0 XML file, extract the business process flow (tasks,
gateways, events, sequence flows, lanes), and generate a comprehensive test case
CSV that is directly uploadable to SAP Cloud ALM. Apply four test design
techniques: Happy Path, Negative Path, Boundary Value, and End-to-End.

## Prerequisites

- User provides a BPMN 2.0 XML file exported from SAP Signavio Process Manager
  (Export: Toolbar > Import / Export > Export BPMN 2.0 XML — saved as `.bpmn` or `.xml`)
- The XML follows the OMG BPMN 2.0 standard (namespace: `http://www.omg.org/spec/BPMN/20100524/MODEL`)
- Signavio exports include `bpmndi` (BPMN Diagram Interchange) graphical information —
  ignore `bpmndi` elements, focus only on the `<process>` semantic elements
- Output CSV must conform to SAP Cloud ALM test case upload format (SAP Note 3217691)
- SAP Cloud ALM accepts XLSX (Office Open XML) up to 5 MB / 10,000 rows — CSV is
  converted to XLSX before upload. Do not add extra sheets or columns.
- Reference CSV template: `sap_template_tc.csv` in the project root
- Output folder: `specs/signavio_test_plan/`
- No SAP system access is required — this is a design-time activity

### Signavio BPMN 2.0 XML Element Reference

The exported XML contains these key elements to parse:

| XML Element                              | BPMN Concept                             | Test Relevance                    |
| ---------------------------------------- | ---------------------------------------- | --------------------------------- |
| `<definitions>`                          | Root element with namespace declarations | Entry point for parsing           |
| `<collaboration>`                        | Pools and message flows                  | Process scope                     |
| `<participant>`                          | Pool (organizational unit)               | Test case grouping                |
| `<process>`                              | Process flow container                   | Main parsing target               |
| `<laneSet>` / `<lane>`                   | Swimlanes (roles/departments)            | SAP role mapping for Log On       |
| `<startEvent>`                           | Process start                            | First test action (Log On)        |
| `<endEvent>`                             | Process end                              | Last test action (Log Off/Verify) |
| `<task>` / `<userTask>`                  | Manual/user activity                     | Activity + Action rows in CSV     |
| `<serviceTask>`                          | Automated/system activity                | Background process step           |
| `<exclusiveGateway>`                     | XOR decision point                       | Branching for negative tests      |
| `<parallelGateway>`                      | AND fork/join                            | All branches in same test case    |
| `<inclusiveGateway>`                     | OR decision point                        | Combination test cases            |
| `<sequenceFlow>`                         | Connection between elements              | Action ordering                   |
| `<textAnnotation>`                       | Notes/comments                           | Context in Action Instructions    |
| `<dataObject>` / `<dataObjectReference>` | Process data                             | Input/output field identification |

> **Note**: SAP Signavio Process Governance may remove unsupported elements
> (e.g., message events) during sync. Parse what is present, flag missing elements.

## Mandatory Skills

Before starting, read these skill files:

- `skills/playwright-praman-sap-testing/SKILL.md`
- `skills/playwright-praman-sap-testing/skills-sap-fiori-consultant.md`
- `skills/playwright-praman-sap-testing/skills-tester.md`

## Execution Strategy — Two-Phase Wizard

This prompt operates in TWO mandatory phases. Do NOT skip Phase 1.

### Phase 1: Planning (Wizard Mode — MUST complete before Phase 2)

The agent MUST enter planning mode and ask the user questions **one at a time**
before generating any test cases. Do NOT assume process details or test data.

**Wizard question flow** (ask each, wait for answer, then next):

1. **BPMN file**: "Please provide the Signavio BPMN 2.0 XML file. I will parse it and show you the extracted process flow."
2. **Process summary**: After parsing, display: pool/lane names, task count, gateway count, event count. "Is this the correct process? Are there any tasks I misidentified?"
3. **Scope item mapping**: "What is the SAP Cloud ALM Scope Item ID and name for this process? (e.g., BD9 - Sell from Stock)"
4. **Happy path confirmation**: Show the main happy path (start event → tasks → end event, taking the default branch at each gateway). "Is this the correct happy path? Should any branch be the default?"
5. **Negative scenarios**: "Which gateways or decision points should I generate negative test cases for? Should I cover all exclusive gateways or only specific ones?"
6. **Boundary values**: "Which input fields or data elements in the process have boundary conditions? (e.g., quantity min/max, date ranges, amounts)"
7. **Test data**: "What master data values should I use in the test cases? (e.g., Material: TG11, Sold-to: 10100004, Plant: 1010)"
8. **Roles**: "Which SAP business roles are involved? I see these lanes in the BPMN: [list]. Please confirm the role-to-lane mapping."
9. **Output scope**: "Should I generate all four test types (Happy Path, Negative, Boundary Value, End-to-End) or a subset?"

**Rules for Phase 1:**

- Ask ONE question at a time — wait for user response before proceeding
- NEVER assume a value is correct — always confirm with the user
- Display the parsed BPMN structure visually (task list, gateway logic) so the user can verify
- Build a confirmed test design map before entering Phase 2
- If the BPMN XML is malformed or incomplete, STOP and ask the user

### Phase 2: Execution (Only after Phase 1 is confirmed)

1. Generate test cases for each confirmed test design technique
2. Map BPMN tasks to Activity Titles and Actions in the CSV
3. Map BPMN lanes to SAP roles for Log On actions
4. Generate one CSV file per test type, plus a combined CSV
5. Validate CSV structure against the SAP Cloud ALM template
6. Save all output to `specs/signavio_test_plan/`
7. If any BPMN element cannot be mapped to a test action, STOP and ask the user

## Architecture Rules (Non-Negotiable)

1. Output CSV MUST match the SAP Cloud ALM 21-column format exactly (SAP Note 3217691)
2. Columns marked `[---]` in the template header are read-only — leave them empty in generated output
3. Required columns (marked with `*`): Test Case Name, Activity Title, Action Title, Action Instructions
4. Action Instructions MUST use HTML formatting (same as SAP Cloud ALM expects)
5. Each test case MUST have a unique Test Case Name with the pattern: `{ScopeItem}_{TestType}_{Sequence}` (e.g., `BD9_HappyPath_001`)
6. Every test case MUST start with a "Log On" action specifying the SAP role
7. Every test case MUST end with a "Log Off" or navigation-to-home action
8. BPMN gateway logic MUST be preserved — exclusive gateways become decision points in test steps
9. Do NOT invent test steps that do not correspond to BPMN elements
10. Every action instruction MUST reference the specific SAP app, transaction, or screen from the BPMN task

## Selector Mapping Rules

### BPMN Element to CSV Mapping

| BPMN Element       | CSV Column                    | Mapping Rule                                                             |
| ------------------ | ----------------------------- | ------------------------------------------------------------------------ |
| Pool               | Test Case Name (prefix)       | Use pool name as process identifier                                      |
| Lane               | Action (Log On step)          | Map lane to SAP business role                                            |
| Start Event        | First Activity                | "Log On" action with role from lane                                      |
| Task               | Activity Title + Action Title | Task name becomes Activity, task details become Action Instructions      |
| User Task          | Activity Title + Action Title | Same as Task, but include user interaction details                       |
| Service Task       | Activity Title + Action Title | Map to background process / batch job step                               |
| Exclusive Gateway  | Multiple test paths           | Generate separate test cases for each outgoing branch                    |
| Parallel Gateway   | Activity sequence             | All parallel branches become sequential activities in the same test case |
| Intermediate Event | Action step                   | Map to wait/check/timer step                                             |
| End Event          | Last Activity                 | "Log Off" or verification action                                         |
| Sequence Flow      | Action order                  | Determines the sequence of Actions within an Activity                    |
| Text Annotation    | Action Instructions           | Include as additional context in HTML instructions                       |

### Unmapped Elements

If a BPMN element has no clear test action mapping (e.g., abstract data objects,
message flows without task context), mark it as `<!-- UNMAPPED: {element} -->` in
the Action Instructions and flag it for user review.

## Output Format

### 1. CSV File Structure (SAP Cloud ALM Upload Format)

The output CSV MUST have exactly 21 columns matching this header:

```
Test Case GUID,Test Case Name*,[Scope GUID],[Scope Name],[Solution Process GUID],[Solution Process Name],[Solution Process Flow GUID],[Solution Process Flow Name],[Solution Process Flow Diagram GUID],[Solution Process Flow Diagram Name],[Test Case Priority],[Test Case Owner],Test Case Status,Activity GUID,Activity Title*,Activity Target Name,Activity Target URL,Action GUID,Action Title*,Action Instructions*,Action Expected Result
```

**Column rules (21 columns, A-U):**

| Col | Header                                 | Editable     | Rule                                                     |
| --- | -------------------------------------- | ------------ | -------------------------------------------------------- |
| A   | Test Case GUID                         | Yes          | Leave empty — auto-generated on upload                   |
| B   | Test Case Name\*                       | **Required** | `{ScopeItem}_{TestType}_{Seq}` e.g., `BD9_HappyPath_001` |
| C-L | [Scope GUID] through [Test Case Owner] | No `[---]`   | Leave empty — Cloud ALM ignores                          |
| M   | Test Case Status                       | Yes          | Set to `In Preparation`                                  |
| N   | Activity GUID                          | Yes          | Leave empty — auto-generated                             |
| O   | Activity Title\*                       | **Required** | Maps to BPMN task name                                   |
| P   | Activity Target Name                   | Yes          | SAP app/transaction name (optional)                      |
| Q   | Activity Target URL                    | Yes          | Deep link to SAP app (optional)                          |
| R   | Action GUID                            | Yes          | Leave empty — auto-generated                             |
| S   | Action Title\*                         | **Required** | Specific user action within activity                     |
| T   | Action Instructions\*                  | **Required** | HTML-formatted step instructions                         |
| U   | Action Expected Result                 | Yes          | HTML-formatted expected outcome                          |

- To add multiple Actions under one Activity: repeat Activity Title (col O) for each Action row, leave Test Case Name (col B) empty on continuation rows
- To add multiple Activities under one Test Case: set new Activity Title, leave Test Case Name empty
- HTML tags for Instructions/Results: `<p>`, `<span style="font-weight: bold;">`, `<span style="font-family:Courier New;">`, `<ul>`, `<li>`, `<table>`
- File must be saved as XLSX (Office Open XML) for upload — max 5 MB, 10,000 rows

### 2. Test Design Techniques

#### Happy Path

- Traces the main success flow from Start Event to End Event
- At each Exclusive Gateway, takes the "normal" or "success" branch
- One test case covering the entire default flow

#### Negative Path

- For each Exclusive Gateway, generate a test case that takes each non-default branch
- Include error handling and exception flows shown in the BPMN
- Each negative path is a separate test case

#### Boundary Value

- For each User Task with input fields, generate test cases with:
  - Minimum valid value
  - Maximum valid value
  - Just below minimum (invalid)
  - Just above maximum (invalid)
  - Empty/null value
- Each boundary condition is a separate test case

#### End-to-End

- Combines multiple process variants into a single comprehensive flow
- Includes setup, execution, verification, and teardown
- Tests the full business scenario including cross-role handoffs (lane changes in BPMN)

### 3. File Naming Convention

```
specs/signavio_test_plan/{process-name}_happy-path.csv
specs/signavio_test_plan/{process-name}_negative-path.csv
specs/signavio_test_plan/{process-name}_boundary-value.csv
specs/signavio_test_plan/{process-name}_end-to-end.csv
specs/signavio_test_plan/{process-name}_all-tests.csv
```

### 4. Backend Verification Calls

For each state-changing BPMN task (Create, Update, Delete, Post), include a
verification action in the test case that checks the expected outcome:

```html
<p>Verify the result:</p>
<ul>
  <li>Check status field shows expected value</li>
  <li>Check document number is generated</li>
  <li>Check relevant fields are populated correctly</li>
</ul>
```

### 5. Suggested Test Case Methods

After generating all CSV files, provide a summary table:

| Test Type      | Count | Coverage                     |
| -------------- | ----- | ---------------------------- |
| Happy Path     | N     | Main flow tasks covered      |
| Negative Path  | N     | Gateway branches covered     |
| Boundary Value | N     | Input fields covered         |
| End-to-End     | N     | Cross-role scenarios covered |

## Anti-Patterns (NEVER Produce These)

**BAD** — Missing HTML formatting in instructions:

```csv
,,,,,,,,,,,,,,"Step 1",,,,,"Click the button","Result shows"
```

WHY: SAP Cloud ALM expects HTML-formatted instructions. Plain text renders poorly.

**BAD** — Invented steps not in BPMN:

```csv
,,,,,,,,,,,,,,Check Email Notification,,,,,"Check that email was sent",
```

WHY: If "Check Email Notification" is not a task in the BPMN XML, do not create test steps for it.

**BAD** — Missing Log On action:

```csv
,BD9_HappyPath_001,,,,,,,,,,,In Preparation,,Create Sales Order,,,,,"Create a new sales order","Order created"
```

WHY: Every test case must start with a Log On action specifying the SAP role.

## Example Output (Single Step — For Reference)

Given a BPMN task: "Create Sales Order" in lane "Internal Sales Representative"

Expected CSV row:

```csv
,BD9_HappyPath_001,,,,,,,,,,,In Preparation,,Create Sales Order,,,,"Enter Sales Order Data","<p>Enter the following data:</p><ul><li><span style=""font-weight: bold;"">Order Type</span>: <span style=""font-family:Courier New;"">OR</span></li><li><span style=""font-weight: bold;"">Sales Organization</span>: <span style=""font-family:Courier New;"">1010</span></li><li><span style=""font-weight: bold;"">Distribution Channel</span>: <span style=""font-family:Courier New;"">10</span></li></ul>","<p>Fields are populated correctly.</p>"
```

> **Note**: The `[---]` columns (3-12) are left empty. Action Instructions use
> HTML formatting matching SAP Cloud ALM conventions. Field values are confirmed
> by the user during Phase 1 wizard, not assumed from the BPMN.

## Backend Data Verification (OData)

For test cases generated from BPMN flows, backend verification is expressed as
test actions within the CSV (not as live OData calls, since this is design-time).

### Verification Pattern

For each state-changing BPMN task, add a verification action row:

```csv
,BD9_HappyPath_001,,,,,,,,,,,In Preparation,,Create Sales Order,,,,"Verify Sales Order Created","<p>Check the following:</p><ul><li>Sales order number is displayed in the confirmation message</li><li>Order status shows <span style=""font-family:Courier New;"">Open</span></li><li>All line items are saved correctly</li></ul>","<p>Sales order is created successfully with correct data.</p>"
```

### Required Verification Points

Every BPMN task that changes state (Create, Update, Delete, Post, Approve,
Reject) MUST be followed by a verification action that asserts:

1. The expected status or document number
2. Key field values match the input
3. No error messages are displayed

### Verification Rules

1. NEVER skip verification after a state-changing task
2. Verification actions use the same Activity Title as the task they verify
3. Verification Action Title starts with "Verify" (e.g., "Verify Sales Order Created")
4. Include specific field values to check — do not use generic "check it works"
5. For Exclusive Gateway outcomes, verify the branch condition result
6. For End Events, verify the final process state
7. Map verification to the BPMN task — do not invent verification for non-existent tasks

## Behavior Rules

- **NEVER assume** — if a BPMN element is ambiguous, a field value is unknown, or a gateway condition is unclear, ASK the user before proceeding
- Parse the BPMN XML programmatically — do not guess the process structure
- Preserve the BPMN task ordering in the CSV action sequence
- Use the exact task names from the BPMN XML as Activity Titles
- Map BPMN lanes to SAP roles — confirm the mapping with the user
- The BPMN XML is the **source of truth** — do NOT add tasks not present in the XML
- If the BPMN has sub-processes, expand them into flat action sequences
- Handle BPMN error events as Negative Path test cases
- If a gateway has no label or condition, STOP and ask the user what the branches mean
- Check for errors or missing elements at each step and flag them for the user

## Test Steps

> **IMPORTANT**: The steps below are the **agent's workflow** for processing the BPMN XML.
> These are NOT test steps to execute in SAP. During Phase 1 (Wizard Mode), confirm each
> detail with the user before generating output.

| Step | Name                        | Instruction                                                        | Expected Result           |
| ---- | --------------------------- | ------------------------------------------------------------------ | ------------------------- |
| 1    | Receive BPMN XML            | User provides the Signavio BPMN 2.0 XML file                       | XML file received         |
| 2    | Parse XML                   | Extract pools, lanes, tasks, gateways, events, sequence flows      | Process structure parsed  |
| 3    | Display Summary             | Show the user: pool name, lane count, task count, gateway count    | User confirms structure   |
| 4    | Identify Happy Path         | Trace default flow from start to end event                         | Happy path confirmed      |
| 5    | Identify Negative Paths     | List all exclusive gateway branches that diverge from happy path   | Negative paths confirmed  |
| 6    | Identify Boundary Fields    | List all user task input fields with potential boundary conditions | Boundary fields confirmed |
| 7    | Confirm Test Data           | Ask user for master data values (materials, customers, orgs)       | Test data confirmed       |
| 8    | Confirm Roles               | Map BPMN lanes to SAP roles, confirm with user                     | Role mapping confirmed    |
| 9    | Generate Happy Path CSV     | Create CSV with default flow test case                             | CSV generated             |
| 10   | Generate Negative Path CSV  | Create CSV with gateway-branch test cases                          | CSV generated             |
| 11   | Generate Boundary Value CSV | Create CSV with boundary condition test cases                      | CSV generated             |
| 12   | Generate End-to-End CSV     | Create CSV with full cross-role scenario                           | CSV generated             |

## Expected Output

1. Create folder `specs/signavio_test_plan/` and save all CSV files
2. Generate a summary markdown file `specs/signavio_test_plan/README.md` with test coverage stats

## Self-Check (Before Submitting Output)

Before finalizing, verify ALL of the following:

- [ ] Phase 1 wizard completed — all BPMN elements confirmed by user
- [ ] CSV has exactly 21 columns matching SAP Cloud ALM header
- [ ] All `[---]` columns are empty in generated rows
- [ ] Every test case has a unique Test Case Name following the naming convention
- [ ] Every test case starts with a Log On action
- [ ] All Activity Titles correspond to BPMN tasks from the XML
- [ ] Action Instructions use HTML formatting (`<p>`, `<ul>`, `<li>`, `<span>`)
- [ ] No test steps were invented that do not exist in the BPMN XML
- [ ] Every state-changing action is followed by a verification action
- [ ] Negative path test cases cover all exclusive gateway branches
- [ ] Boundary value test cases cover min, max, below-min, above-max, empty for each identified field

## Context Window Management

If this prompt exceeds its token budget (see complexity tier):

1. Split into Phase 1 (Happy Path + Negative Path) and Phase 2 (Boundary Value + End-to-End)
2. Phase 1 file: `design-test-cases-from-signavio-phase1.prompt.md`; Phase 2: `design-test-cases-from-signavio-phase2.prompt.md`
3. Phase 2 MUST repeat: Output Format section in full
4. Phase 2 MUST reference Phase 1 output: `specs/signavio_test_plan/{name}_happy-path.csv`
5. Each phase MUST be self-contained — no dependency on conversation history
6. Test case numbering is continuous across phases
