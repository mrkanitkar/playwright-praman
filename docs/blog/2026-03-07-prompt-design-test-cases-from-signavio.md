---
title: 'Prompt: Design Test Cases from Signavio — BPMN-to-Test-Case Generation'
authors: [maheshwar]
tags: [example-prompts, prompts, signavio, bpmn, test-design, cloud-alm, csv]
description: >
  A production-ready AI prompt for generating SAP Cloud ALM test cases from
  Signavio BPMN 2.0 XML files using four test design techniques.
keywords:
  - praman
  - playwright
  - sap
  - signavio
  - bpmn
  - test design
  - cloud alm
  - test cases
  - csv
---

# Design Test Cases from Signavio — BPMN-to-Test-Case Generation Prompt

A structured, prompt-engineered template for AI agents to parse SAP Signavio
BPMN 2.0 XML files and generate comprehensive test cases in SAP Cloud ALM CSV
format — applying Happy Path, Negative Path, Boundary Value, and End-to-End
test design techniques.

{/_ truncate _/}

## Overview

| Property             | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| **Business Process** | Cross-Process (BPMN-based Test Design)                 |
| **Input**            | Signavio BPMN 2.0 XML file                             |
| **Output**           | SAP Cloud ALM CSV (21-column format, SAP Note 3217691) |
| **Complexity**       | Medium                                                 |
| **Estimated Steps**  | 12                                                     |
| **Test Techniques**  | Happy Path, Negative Path, Boundary Value, End-to-End  |
| **Praman Version**   | >= 1.1.0                                               |

## How to Use This Prompt

### Option 1: Via CLI (Recommended)

```bash
npm install playwright-praman @playwright/test
npx playwright-praman init
```

Find the prompt in `praman-prompts/design-test-cases-from-signavio.prompt.md` in your project.

### Option 2: Copy from Below

Copy the prompt content below and paste into your AI agent
(Claude Code, GitHub Copilot, Cursor, or any LLM).

## The Prompt

<details>
<summary>Click to expand the prompt (condensed — full 380-line version via CLI)</summary>

````markdown
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
  (see: SAP Signavio > File > Export > BPMN 2.0 XML)
- Output CSV must conform to SAP Cloud ALM test case upload format (SAP Note 3217691)
- Reference CSV template: `sap_template_tc.csv` in the project root
- Output folder: `specs/signavio_test_plan/`
- No SAP system access is required — this is a design-time activity

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

1. **BPMN file**: "Please provide the Signavio BPMN 2.0 XML file."
2. **Process summary**: Display pool/lane/task/gateway/event counts. "Is this correct?"
3. **Scope item mapping**: "What is the SAP Cloud ALM Scope Item ID?"
4. **Happy path confirmation**: Show default flow. "Is this the correct happy path?"
5. **Negative scenarios**: "Which gateways should I generate negative test cases for?"
6. **Boundary values**: "Which input fields have boundary conditions?"
7. **Test data**: "What master data values should I use?"
8. **Roles**: "Confirm the lane-to-role mapping."
9. **Output scope**: "All four test types or a subset?"

**Rules for Phase 1:**

- Ask ONE question at a time — wait for user response before proceeding
- NEVER assume a value is correct — always confirm with the user
- Display the parsed BPMN structure so the user can verify
- Build a confirmed test design map before entering Phase 2

### Phase 2: Execution (Only after Phase 1 is confirmed)

1. Generate test cases for each confirmed test design technique
2. Map BPMN tasks to Activity Titles and Actions in the CSV
3. Map BPMN lanes to SAP roles for Log On actions
4. Generate one CSV file per test type, plus a combined CSV
5. Validate CSV structure against the SAP Cloud ALM template
6. Save all output to `specs/signavio_test_plan/`

## Architecture Rules (Non-Negotiable)

1. Output CSV MUST match the SAP Cloud ALM 21-column format exactly
2. Columns marked `[---]` in the template: leave empty
3. Required columns (`*`): Test Case Name, Activity Title, Action Title, Action Instructions
4. Action Instructions MUST use HTML formatting
5. Test Case Name pattern: `{ScopeItem}_{TestType}_{Sequence}`
6. Every test case MUST start with a "Log On" action
7. Every test case MUST end with a "Log Off" action
8. BPMN gateway logic MUST be preserved
9. Do NOT invent steps not in the BPMN
10. Every action MUST reference the SAP app or screen from the BPMN task

## Selector Mapping Rules

### BPMN Element to CSV Mapping

| BPMN Element      | CSV Column              | Mapping Rule               |
| ----------------- | ----------------------- | -------------------------- |
| Pool              | Test Case Name (prefix) | Process identifier         |
| Lane              | Log On action           | SAP business role          |
| Task              | Activity Title + Action | Task name and details      |
| Exclusive Gateway | Multiple test paths     | Separate test per branch   |
| Parallel Gateway  | Activity sequence       | All branches sequential    |
| Start/End Event   | First/Last Activity     | Log On / Log Off           |
| Sequence Flow     | Action order            | Determines action sequence |

## Output Format

CSV with 21 columns matching SAP Cloud ALM header (SAP Note 3217691).

### Test Design Techniques

- **Happy Path**: Default flow, success branches at all gateways
- **Negative Path**: Non-default branches at each exclusive gateway
- **Boundary Value**: Min, max, below-min, above-max, empty for input fields
- **End-to-End**: Full cross-role scenario with verification

## Anti-Patterns (NEVER Produce These)

- Plain text instructions (must be HTML)
- Steps not in the BPMN XML
- Missing Log On action
- Generic verification ("check it works")

## Example Output (Single Step — For Reference)

BPMN task "Create Sales Order" in lane "Internal Sales Representative":

```csv
,BD9_HappyPath_001,,,,,,,,,,,In Preparation,,Create Sales Order,,,,"Enter Sales Order Data","<p>Enter:</p><ul><li>Order Type: OR</li><li>Sales Org: 1010</li></ul>","<p>Fields populated.</p>"
```

## Backend Data Verification (OData)

For each state-changing BPMN task, add a verification action row with
Action Title starting with "Verify" and HTML-formatted expected results.

## Behavior Rules

- **NEVER assume** — if a BPMN element is ambiguous, ASK the user
- Parse the BPMN XML programmatically — do not guess
- Use exact task names from the BPMN as Activity Titles
- Map BPMN lanes to SAP roles — confirm with user
- The BPMN XML is the source of truth

## Test Steps

> **IMPORTANT**: These are the **agent's workflow steps**, not SAP test steps.

| Step | Name                     | Instruction                           | Expected Result  |
| ---- | ------------------------ | ------------------------------------- | ---------------- |
| 1    | Receive BPMN XML         | User provides file                    | XML received     |
| 2    | Parse XML                | Extract pools, lanes, tasks, gateways | Structure parsed |
| 3    | Display Summary          | Show counts to user                   | User confirms    |
| 4    | Identify Happy Path      | Trace default flow                    | Path confirmed   |
| 5    | Identify Negative Paths  | List gateway branches                 | Paths confirmed  |
| 6    | Identify Boundary Fields | List input fields                     | Fields confirmed |
| 7    | Confirm Test Data        | Ask for master data values            | Data confirmed   |
| 8    | Confirm Roles            | Map lanes to roles                    | Roles confirmed  |
| 9-12 | Generate CSVs            | Create all test type CSVs             | Files saved      |

## Expected Output

1. Create folder `specs/signavio_test_plan/` and save all CSV files
2. Generate summary `specs/signavio_test_plan/README.md`

## Self-Check (Before Submitting Output)

- [ ] Phase 1 wizard completed — all BPMN elements confirmed
- [ ] CSV has exactly 21 columns matching SAP Cloud ALM header
- [ ] All `[---]` columns are empty
- [ ] Every test case has unique name following convention
- [ ] Every test case starts with Log On
- [ ] Activity Titles match BPMN task names
- [ ] HTML formatting in Action Instructions
- [ ] No invented steps
- [ ] Verification after every state-changing action
- [ ] All gateway branches covered in negative tests
- [ ] Boundary values cover min/max/below/above/empty

## Context Window Management

If this prompt exceeds its token budget:

1. Split by test type: Phase 1 (Happy + Negative), Phase 2 (Boundary + E2E)
2. Each phase is self-contained
3. Test case numbering continuous across phases
````

</details>

## Test Design Techniques

This prompt applies four professional test design techniques to the BPMN flow:

### Happy Path

Traces the main success flow from Start Event to End Event, taking the default
branch at every gateway. Produces one comprehensive test case covering the
normal business scenario.

### Negative Path

For each Exclusive Gateway in the BPMN, generates a test case that follows each
non-default branch. This covers error handling, exception flows, and rejection
scenarios defined in the process model.

### Boundary Value

For each User Task with input fields, generates test cases with minimum, maximum,
below-minimum, above-maximum, and empty values. Catches edge cases in field
validation and business rules.

### End-to-End

Combines the full process flow including cross-role handoffs (lane changes in BPMN)
into a single comprehensive test. Includes setup, execution, verification, and
teardown across all SAP roles involved in the process.

## Output Format

The generated CSV files are directly uploadable to SAP Cloud ALM via the test case
import feature (SAP Note 3217691). The 21-column format includes:

- **Test Case Name**: `{ScopeItem}_{TestType}_{Sequence}` (e.g., `BD9_HappyPath_001`)
- **Activity Title**: Maps to BPMN task names
- **Action Title**: Specific user actions within each activity
- **Action Instructions**: HTML-formatted step-by-step instructions
- **Action Expected Result**: HTML-formatted expected outcomes

## Key Rules Enforced

- **Two-Phase Wizard** — Phase 1 parses BPMN and confirms everything with user before Phase 2 generates CSVs
- **NEVER assume** — all BPMN elements, test data, and role mappings must be confirmed
- **BPMN is source of truth** — no test steps are invented outside the process model
- **SAP Cloud ALM format** — exact 21-column CSV, HTML-formatted instructions
- **Four test techniques** — Happy Path, Negative Path, Boundary Value, End-to-End
- **Verification after state changes** — every Create/Update/Delete/Post gets a verification action
- **Self-check checklist** — 11-point validation before submitting output

## Known Limitations

- The BPMN XML must be exported from SAP Signavio in BPMN 2.0 format — other BPMN tools may produce slightly different XML structures.
- Sub-processes are expanded into flat action sequences — deeply nested sub-processes may lose some visual hierarchy.
- Boundary value analysis requires the user to specify which fields have boundary conditions, as BPMN tasks don't inherently define field-level constraints.
- The CSV output targets SAP Cloud ALM specifically — other test management tools may require format conversion.

## Related Resources

- [Getting Started Guide](/docs/guides/getting-started)
- [SAP Control Cookbook](/docs/guides/sap-control-cookbook)
- [Gold Standard Test Pattern](/docs/guides/gold-standard-test)
- [Praman Fixtures Reference](/docs/guides/fixtures)
