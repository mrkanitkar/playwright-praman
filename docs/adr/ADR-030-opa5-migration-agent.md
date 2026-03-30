# ADR-030: OPA5-to-Playwright-Praman Migration Agent

**Status:** Proposed
**Date:** 2026-03-29
**Deciders:** Maheshwar Kanitkar (Architect), Praman Core Team
**Extends:** D1–D29 (plan.md), ADR series

---

## Context

### Problem Statement

Enterprise SAP teams have years of investment in OPA5 test suites — the
SAP-native integration testing framework based on QUnit. These tests
follow the Given-When-Then (GWT) pattern with page objects, journeys,
and `waitFor` matchers. Teams want to migrate to Playwright-Praman for
superior cross-browser support, parallel execution, AI-powered healing,
and modern DX — but they need a clear, automated migration path.

User feedback on the Praman article specifically requested: _"throw in a clear migration strategy from OPA5 — auto-convert, refactor into fixtures, kill the old stuff."_

### What is OPA5?

OPA5 (One Page Acceptance) is SAP's built-in integration test framework that:

- Runs **inline** in the same browser context as the UI5 application (shared runtime)
- Uses **Given-When-Then** pattern via `opaTest("description", function(Given, When, Then) {...})`
- Structures tests as **Journeys** (test scenarios) with **Page Objects** (UI abstractions)
- Uses **`waitFor`** with declarative matchers (`controlType`, `id`, `properties`, `bindingPath`) and custom matcher functions
- Relies on QUnit as the test harness
- Has **no cross-browser support** (same-origin only), **no parallel execution**, **no screenshot capture**

### OPA5 Test Structure (Typical)

```text
webapp/test/integration/
├── AllJourneys.js          ← Test suite entry point
├── journeys/
│   ├── CreateJourney.js    ← Given-When-Then scenarios
│   ├── EditJourney.js
│   └── DeleteJourney.js
└── pages/
    ├── ListPage.js          ← Page object with actions + assertions
    └── ObjectPage.js
```

**Journey Example:**

```javascript
opaTest('Should create a purchase order', function (Given, When, Then) {
  Given.iStartMyApp();
  When.onTheListPage.iPressCreate();
  When.onTheObjectPage.iFillSupplier('VENDOR-001');
  When.onTheObjectPage.iPressSave();
  Then.onTheObjectPage.iShouldSeeMessageToast('Created');
  Then.iTeardownMyApp();
});
```

**Page Object Example:**

```javascript
Opa5.createPageObjects({
  onTheListPage: {
    actions: {
      iPressCreate: function () {
        return this.waitFor({
          controlType: 'sap.m.Button',
          properties: { text: 'Create' },
          actions: new Press(),
          errorMessage: 'Create button not found',
        });
      },
    },
    assertions: {
      iShouldSeeTheTable: function () {
        return this.waitFor({
          id: 'purchaseOrderTable',
          viewName: 'sap.demo.purchaseorder.view.List',
          success: function (oTable) {
            Opa5.assert.ok(oTable.getItems().length > 0, 'Table has items');
          },
        });
      },
    },
  },
});
```

### What We Learned from wdi5

wdi5 (WebDriverIO + UI5) attempted OPA5 compatibility and revealed critical lessons:

| Aspect              | wdi5 Approach                                  | Outcome                             | Lesson for Praman                    |
| ------------------- | ---------------------------------------------- | ----------------------------------- | ------------------------------------ |
| Selector syntax     | Reused OPA5 selectors directly                 | Successful — 1:1 mapping works      | Reuse selector mapping               |
| Custom matchers     | Never implemented (Issue #643 closed as stale) | **Gap** — enterprise tests blocked  | Must handle custom matchers          |
| Suffix clause       | Not supported                                  | **Gap** — workaround via CSS chain  | Use Praman's `interaction.idSuffix`  |
| waitFor → wait      | Implicit auto-wait on every interaction        | Mostly works, fragile under stress  | Use Praman's explicit `waitForUI5()` |
| Automated converter | **Does not exist**                             | Teams must rewrite manually         | Major opportunity for Praman         |
| Recording tool      | UI5 Journey Recorder exports OPA5 or wdi5      | Useful for new tests, not migration | Can inform parser design             |

### Key Insight: Praman Already Speaks OPA5 Internally

Praman's **Strategy 2 (RecordReplay)** uses the exact same SAP
`RecordReplay` API that powers OPA5 matchers. The
`PRAMAN_INTERACTION_STRATEGY=opa5` mode already delegates to
`RecordReplay.interactWithControl()`. This means the semantic bridge
between OPA5 and Praman is already built at the infrastructure
level — what's missing is the **test-level migration layer**.

### Forces

1. **Enterprise investment**: Teams have 100s-1000s of OPA5 tests representing years of domain knowledge
2. **Architectural mismatch**: OPA5 is inline (shared runtime), Praman is remote (Playwright process). This is fundamental and affects every pattern
3. **Custom matcher complexity**: Enterprise OPA5 tests use custom matchers that have no direct equivalent anywhere
4. **Confidence requirement**: SAP teams need to know migration accuracy per step, not just pass/fail
5. **CI/CD integration**: Migrated tests must run in existing pipelines without manual intervention
6. **Existing agent architecture**: Praman already has Planner/Generator/Healer agents — new agent must coexist cleanly

---

## Decision

Introduce a **standalone `praman-sap-opa5-migrator` agent** with its
own 5-phase pipeline: **Parse → Analyze → Plan → Generate → Verify**.
The agent handles all OPA5 variants (standard GWT, custom matchers,
Journey Recorder output), produces per-step confidence scores, and
uses approval gates before code generation.

This is Design Decision **D30** in the Praman architecture.

---

## Options Considered

### Option A: AST-First Static Migration Agent

**Approach:** Parse OPA5 JavaScript files using an AST parser
(Babel/Acorn), extract the semantic structure (journeys, page objects,
waitFor matchers, custom matchers), build an intermediate
representation (IR), then generate Praman gold-standard TypeScript
from the IR. No live browser needed for the migration itself.

**Architecture Placement:**

```text
New Files (Agent Layer — outside src/):
  .claude/agents/praman-sap-opa5-migrator.md     ← Agent definition
  .claude/prompts/praman-sap-opa5-migrate.md      ← Entry prompt
  skills/playwright-praman-sap-testing/skills-opa5-migration-expert.md  ← Skill file

New Module (Layer 4: AI & Intent):
  src/ai/migration/
    ├── opa5-parser.ts              ← AST parser for OPA5 files (Babel traverse)
    ├── opa5-ir.ts                  ← Intermediate Representation types
    ├── opa5-mapper.ts              ← OPA5 IR → Praman API mapping rules
    ├── opa5-confidence-scorer.ts   ← Per-step confidence scoring engine
    ├── opa5-generator.ts           ← IR → gold-standard .spec.ts emitter
    ├── opa5-custom-matcher-handler.ts ← Custom matcher → property assertion converter
    └── index.ts                    ← Sub-path export: playwright-praman/migration
```

**Pipeline:**

```text
Phase 1: PARSE
  Input: OPA5 directory (journeys/, pages/)
  Tool: Babel AST parser (babel-parser + @babel/traverse)
  Output: OPA5-IR (typed intermediate representation)
    {
      journeys: [{ name, steps: [{ type: 'action'|'assertion', pageObject, method, waitFor }] }],
      pageObjects: [{ name, actions: [...], assertions: [...] }],
      customMatchers: [{ name, implementation, paramTypes }],
      appConfig: { viewNames, componentId, routePattern }
    }

Phase 2: ANALYZE (with approval gate)
  Input: OPA5-IR
  Tool: Mapping rules engine
  Output: Migration Plan with per-step confidence
    For each journey step:
      - Map waitFor.controlType → UI5Selector.controlType
      - Map waitFor.id + viewName → UI5Selector.id (drop viewName)
      - Map waitFor.properties → UI5Selector.properties
      - Map waitFor.bindingPath → UI5Selector.bindingPath
      - Map actions (Press, EnterText) → proxy methods (press, setValue+fireChange)
      - Score: HIGH (1:1 mapping) / MEDIUM (semantic approx) / LOW (custom matcher)

  ⛔ APPROVAL GATE: Present plan to user with confidence breakdown

Phase 3: PLAN
  Input: Approved migration plan
  Output: Praman test plan (same format as praman-sap-planner output)
    specs/{app}.opa5-migration-plan.md

Phase 4: GENERATE
  Input: Migration plan
  Output: Gold-standard .spec.ts files
    tests/e2e/{app}/{journey-name}.spec.ts

Phase 5: VERIFY
  Input: Generated test files + live SAP app
  Tool: Playwright test runner
  Output: Verification report with pass/fail per step + confidence accuracy
```

| Dimension               | Assessment                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Complexity              | **High** — AST parsing of arbitrary JavaScript is hard; OPA5 patterns vary wildly    |
| Accuracy                | **Highest** — full semantic understanding of the source code                         |
| Live SAP needed         | Only for Phase 5 (verify) — Phases 1-4 work offline                                  |
| Custom matcher handling | **Best** — can inspect matcher implementation AST and convert to property assertions |
| Confidence scoring      | **Most granular** — can score at the AST node level                                  |
| Effort                  | ~3-4 weeks for parser + mapper + generator                                           |
| Risk                    | Babel parser may struggle with non-standard OPA5 patterns (eval, dynamic require)    |

**Pros:**

- Works offline — doesn't need a running SAP system until verification
- Highest accuracy because it understands the source code semantically
- Best custom matcher handling — can analyze matcher function bodies
- Produces the most detailed confidence scores
- Can handle bulk migration (100s of files) efficiently
- Reusable parser can power other tools (lint, audit, documentation)

**Cons:**

- Highest implementation complexity
- AST parsing of JavaScript is fragile for edge cases (eval, dynamic patterns)
- Requires Babel as a dependency (adds ~2MB to node_modules)
- Cannot discover runtime behavior that isn't in the source (dynamic page objects, programmatic journey construction)

---

### Option B: Live-Discovery Hybrid Migration Agent

**Approach:** Combine OPA5 source analysis (lightweight regex/pattern
matching, not full AST) with live SAP application discovery. The agent
reads OPA5 files to understand intent, then uses the MCP browser
connection to replay each journey step on the live app, discovers the
actual UI5 control structure, and generates Praman tests from the live
state rather than the OPA5 source alone.

**Architecture Placement:**

```text
New Files (Agent Layer):
  .claude/agents/praman-sap-opa5-migrator.md     ← Agent definition
  .claude/prompts/praman-sap-opa5-migrate.md      ← Entry prompt
  skills/playwright-praman-sap-testing/skills-opa5-migration-expert.md

New Module (Layer 4: AI & Intent):
  src/ai/migration/
    ├── opa5-source-reader.ts       ← Regex-based OPA5 pattern extractor
    ├── opa5-journey-mapper.ts      ← Journey steps → navigation sequence
    ├── opa5-confidence-scorer.ts   ← Per-step confidence scoring
    ├── opa5-live-verifier.ts       ← Live browser verification scripts
    └── index.ts
```

**Pipeline:**

```text
Phase 1: READ
  Input: OPA5 directory
  Tool: Regex pattern matching + file structure analysis
  Output: Journey map (ordered list of user actions + expected outcomes)
    Not a full AST — just extracts the Given/When/Then method names,
    page object references, and waitFor selector objects

Phase 2: DISCOVER (live SAP app required)
  Input: Journey map + live SAP application (MCP browser)
  Tool: Praman's existing discovery engine (Registry → ID → RecordReplay)
  Process:
    For each journey step:
      1. Navigate to the relevant view
      2. Run full control discovery (reuse praman-sap-planner scripts)
      3. Match OPA5 selector to discovered controls
      4. Record actual control IDs, types, properties, binding paths
  Output: Enriched journey map with live control metadata

  ⛔ APPROVAL GATE: Present enriched plan with discovered vs. expected controls

Phase 3: GENERATE
  Input: Enriched journey map
  Output: Gold-standard .spec.ts (uses live-discovered IDs, not OPA5 source IDs)

Phase 4: EXECUTE + HEAL
  Input: Generated tests + live app
  Process: Run tests, use existing Healer patterns for auto-fix
  Output: Passing tests + migration report
```

| Dimension               | Assessment                                                                          |
| ----------------------- | ----------------------------------------------------------------------------------- |
| Complexity              | **Medium** — regex parsing is simpler; leverages existing discovery                 |
| Accuracy                | **High** — live discovery catches runtime control changes                           |
| Live SAP needed         | **Yes, throughout** — from Phase 2 onwards                                          |
| Custom matcher handling | **Medium** — can match by observed behavior but can't analyze matcher source        |
| Confidence scoring      | **Good** — based on live match success rate                                         |
| Effort                  | ~2-3 weeks                                                                          |
| Risk                    | Requires live SAP system; some OPA5 steps may be hard to replay without app context |

**Pros:**

- Live discovery catches controls that changed since OPA5 tests were written
  (V2→V4 migration, control refactoring)
- Simpler parser — doesn't need full AST, just enough to understand journey structure
- Leverages existing Praman discovery infrastructure (70%+ code reuse from Planner agent)
- Generated tests use real, verified control IDs — higher first-run pass rate
- Natural alignment with Praman's "discover before you test" philosophy

**Cons:**

- Requires a running SAP system for every migration run
- Cannot migrate offline (e.g., before SAP system is available)
- Regex parser is less precise — may misinterpret complex OPA5 patterns
- Custom matchers are handled by observation, not source analysis — may miss edge cases
- Sequential processing (must navigate to each view) — slower for large test suites

---

### Option C: LLM-Powered Semantic Migration Agent (AI-Native)

**Approach:** Use the LLM (Claude) as the primary migration engine.
Feed OPA5 source files directly to the agent with comprehensive
mapping rules embedded in the skill file. The LLM understands the
OPA5 patterns semantically (not just syntactically), applies the
mapping rules, generates Praman tests, and assigns confidence scores
based on its understanding of the mapping quality.

**Architecture Placement:**

```text
New Files (Agent Layer — primary implementation is in agent/prompt/skill):
  .claude/agents/praman-sap-opa5-migrator.md     ← Agent definition (MAIN LOGIC HERE)
  .claude/prompts/praman-sap-opa5-migrate.md      ← Entry prompt
  skills/playwright-praman-sap-testing/skills-opa5-migration-expert.md  ← Mapping rules

Minimal New Module (Layer 4):
  src/ai/migration/
    ├── opa5-confidence-scorer.ts   ← Programmatic confidence validation
    ├── opa5-mapping-rules.ts       ← Typed mapping rule definitions (for validation)
    └── index.ts
```

**Pipeline:**

```text
Phase 1: INGEST
  Input: OPA5 directory
  Tool: Agent reads all files via Read tool
  Output: LLM has full OPA5 codebase in context window

Phase 2: UNDERSTAND + PLAN (with approval gate)
  Input: OPA5 code in context + mapping rules from skill file
  Tool: LLM reasoning
  Process:
    1. Identify all journeys, page objects, custom matchers
    2. For each journey step, apply mapping rules
    3. Assign confidence score per step based on:
       - HIGH: Direct 1:1 mapping exists (controlType, id, properties)
       - MEDIUM: Semantic approximation needed (viewName dropped, bindingPath reformatted)
       - LOW: Custom matcher, complex waitFor check function, or ambiguous selector
    4. Flag any custom matchers with proposed property-assertion conversion
  Output: Structured migration plan in markdown

  ⛔ APPROVAL GATE: Present migration plan with confidence breakdown per journey

Phase 3: GENERATE
  Input: Approved plan
  Tool: LLM code generation
  Output: Gold-standard .spec.ts files following all 7 mandatory rules + 19 anti-pattern checks

  For each generated file, include:
    - TSDoc header with MIGRATION metadata (source OPA5 file, migration date, overall confidence)
    - Per-step confidence comments: // Confidence: HIGH — direct controlType mapping
    - Control ID constants extracted into `const IDS = {...} as const`
    - Single test() with test.step() pattern

Phase 4: VERIFY (live SAP app)
  Input: Generated tests
  Tool: Playwright test runner via MCP
  Process: Run each test, collect results
  Output: Pass/fail report + confidence calibration (was HIGH actually HIGH?)

Phase 5: HEAL (if needed)
  Input: Failing tests
  Tool: Agent applies Healer patterns (19 forbidden pattern scan + fix)
  Output: Fixed tests + updated confidence scores
```

| Dimension               | Assessment                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Complexity              | **Low** — most logic lives in prompt/skill, minimal code                             |
| Accuracy                | **High** — LLM understands intent, not just syntax                                   |
| Live SAP needed         | Only for Phase 4-5 (verify + heal)                                                   |
| Custom matcher handling | **Good** — LLM can read matcher function body and reason about equivalent assertions |
| Confidence scoring      | **Good** — LLM-assigned scores, validated programmatically in Phase 4                |
| Effort                  | ~1-2 weeks (agent definition + skill file + thin validation module)                  |
| Risk                    | LLM context window limits for very large OPA5 codebases; non-deterministic output    |

**Pros:**

- Fastest to implement — leverages LLM's existing JavaScript/TypeScript understanding
- Handles custom matchers through reasoning, not rigid rules
- Understands business intent from OPA5 test names and comments — produces better test names
- Naturally handles all OPA5 variants (standard, custom matchers, recorder output)
  without separate parser modes
- Can explain migration decisions in natural language (useful for approval gate)
- Easiest to maintain — mapping rules update via skill file, not code changes
- Consistent with Praman's "Agent-First" branding

**Cons:**

- Non-deterministic — same input may produce slightly different output across runs
- Context window limits: very large OPA5 suites (50+ files) may need batching
- Confidence scores are LLM-estimated, not computed — may drift
- Requires programmatic validation layer to catch LLM errors (anti-pattern scanner)
- Cannot run in CI without LLM API access

---

## Trade-off Analysis

| Dimension                  | Option A: AST-First   | Option B: Live-Discovery | Option C: LLM-Native         |
| -------------------------- | --------------------- | ------------------------ | ---------------------------- |
| **Implementation effort**  | 3-4 weeks             | 2-3 weeks                | 1-2 weeks                    |
| **Offline capability**     | Full (except verify)  | None                     | Partial (except verify)      |
| **Custom matcher support** | Best (AST analysis)   | Medium (observation)     | Good (LLM reasoning)         |
| **Large suite handling**   | Excellent (batch)     | Slow (sequential nav)    | Limited (context window)     |
| **First-run pass rate**    | Medium (static IDs)   | Highest (live IDs)       | Medium-High                  |
| **Maintenance burden**     | High (parser updates) | Medium (discovery reuse) | Low (prompt updates)         |
| **Determinism**            | Deterministic         | Deterministic            | Non-deterministic            |
| **SAP system dependency**  | Verify only           | Full pipeline            | Verify only                  |
| **Alignment with Praman**  | Good (new module)     | Best (reuses discovery)  | Best (agent-first)           |
| **Confidence accuracy**    | Computed (reliable)   | Observed (reliable)      | Estimated (needs validation) |

### Recommendation: **Option C (LLM-Native) as primary, with Option A elements for validation**

**Rationale:**

1. **Agent-First Architecture**: Praman's core identity is
   "Agent-First SAP UI5 Test Automation." An LLM-powered migration
   agent is the most natural extension of this philosophy. The existing
   Planner/Generator/Healer agents are all LLM-powered — the migration
   agent should be too.

2. **Fastest to market**: 1-2 weeks vs 3-4 weeks. The user feedback is recent; shipping quickly demonstrates responsiveness.

3. **Custom matcher handling**: The LLM can read a custom matcher function body and reason about what it's checking — something an AST mapper would need extensive rule engineering to match.

4. **Hybrid validation**: Borrow the `opa5-confidence-scorer.ts`
   module from Option A to programmatically validate the LLM's output.
   This gives deterministic validation over non-deterministic generation.

5. **Existing precedent**: The `wdi5-to-praman-migrate.md` prompt already proves the mapping-rules-in-prompt pattern works for Praman migration. OPA5 migration is an evolution of the same approach.

---

## Detailed Design: Option C (Recommended) with Validation Layer

### D30 — OPA5 Migration Agent

| Property          | Value                                                        |
| ----------------- | ------------------------------------------------------------ |
| **Status**        | Proposed                                                     |
| **Context**       | Enterprise teams need automated OPA5 → Praman migration      |
| **Decision**      | Standalone LLM agent with programmatic validation            |
| **Alternatives**  | AST-first (A), Live-discovery (B)                            |
| **Consequences**  | New agent, new skill file, thin validation module in Layer 4 |
| **Best Practice** | BP-ANTHROPIC: Agent-first, agentic handler pattern           |

### New Files

```text
.claude/agents/praman-sap-opa5-migrator.md        ← Agent definition
.claude/prompts/praman-sap-opa5-migrate.md         ← Entry prompt
.claude/prompts/praman-sap-opa5-coverage.md        ← Full pipeline: migrate + verify + heal

skills/playwright-praman-sap-testing/
  skills-opa5-migration-expert.md                   ← Skill file with mapping rules

src/ai/migration/                                   ← Layer 4: AI
  opa5-confidence-scorer.ts                          ← Programmatic confidence validation
  opa5-mapping-rules.ts                              ← Typed mapping rule definitions
  opa5-anti-pattern-scanner.ts                       ← Post-generation compliance checker
  index.ts                                           ← Barrel export
```

### Agent Pipeline (5 Phases)

```text
┌─────────────────────────────────────────────────────────┐
│  Phase 1: INGEST                                        │
│  Read OPA5 files → Build mental model                   │
│  Input: OPA5 directory path                             │
│  Output: Structured understanding in LLM context        │
│  Tools: Read, Glob, Grep                                │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│  Phase 2: ANALYZE + PLAN                                │
│  Apply mapping rules → Generate migration plan          │
│  Per-step confidence scoring (HIGH/MEDIUM/LOW)          │
│  Custom matcher analysis → property assertion proposals │
│  Output: specs/{app}.opa5-migration-plan.md             │
│                                                         │
│  ⛔ APPROVAL GATE — User reviews plan                   │
└─────────────┬───────────────────────────────────────────┘
              │ (user approves)
┌─────────────▼───────────────────────────────────────────┐
│  Phase 3: GENERATE                                      │
│  Produce gold-standard .spec.ts files                   │
│  Apply all 7 mandatory rules + 19 anti-pattern checks   │
│  Include migration metadata in TSDoc header              │
│  Output: tests/e2e/{app}/{journey}.spec.ts              │
│  Tools: Write                                            │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│  Phase 4: VALIDATE (programmatic)                       │
│  Run opa5-anti-pattern-scanner.ts on generated files    │
│  Check: 19 forbidden patterns, import compliance,       │
│         TSDoc header, confidence comment format          │
│  Output: Validation report (pass/fail per file)         │
│  Tools: Bash (npx tsx src/ai/migration/validate.ts)     │
└─────────────┬───────────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────────┐
│  Phase 5: VERIFY + HEAL (live SAP app)                  │
│  Run tests against live SAP system                      │
│  Auto-heal failures using Healer patterns               │
│  Calibrate confidence scores (was HIGH actually HIGH?)  │
│  Output: Final migration report                         │
│  Tools: MCP playwright-test (test_run, test_debug)      │
└─────────────────────────────────────────────────────────┘
```

### OPA5 → Praman Mapping Rules (Embedded in Skill File)

#### Selector Mapping

| OPA5 waitFor Field                          | Praman UI5Selector                              | Confidence | Notes                        |
| ------------------------------------------- | ----------------------------------------------- | ---------- | ---------------------------- |
| `id: "controlId"`                           | `{ id: "controlId" }`                           | HIGH       | Direct 1:1                   |
| `controlType: "sap.m.Button"`               | `{ controlType: "sap.m.Button" }`               | HIGH       | Direct 1:1                   |
| `properties: { text: "Save" }`              | `{ properties: { text: "Save" } }`              | HIGH       | Direct 1:1                   |
| `viewName: "sap.demo.View"`                 | _(drop)_                                        | HIGH       | Praman finds app-wide        |
| `viewId: "app--view"`                       | _(drop or use ancestor)_                        | MEDIUM     | Rarely needed                |
| `bindingPath: { path: "/Name" }`            | `{ bindingPath: { path: "/Name" } }`            | HIGH       | Pass-through to RecordReplay |
| `searchOpenDialogs: true`                   | `{ searchOpenDialogs: true }`                   | HIGH       | Direct 1:1                   |
| `ancestor: { controlType: "..." }`          | `{ ancestor: { controlType: "..." } }`          | HIGH       | Direct 1:1                   |
| `matchers: [new PropertyStrictEquals(...)]` | `{ properties: { key: value } }`                | MEDIUM     | Standard matcher → property  |
| `matchers: [customMatcher()]`               | Property assertion + `// Confidence: LOW`       | LOW        | Needs manual review          |
| `check: function(oControl) {...}`           | Custom assertion in test + `// Confidence: LOW` | LOW        | Needs manual review          |

#### Action Mapping

| OPA5 Action                      | Praman Equivalent                                         | Confidence |
| -------------------------------- | --------------------------------------------------------- | ---------- |
| `new Press()`                    | `await control.press()` or `await ui5.press(selector)`    | HIGH       |
| `new EnterText({ text: "..." })` | `await ui5.fill(selector, "..."); await ui5.waitForUI5()` | HIGH       |
| `new Scroll({ x: 0, y: 100 })`   | `await page.mouse.wheel(0, 100)` (non-UI5)                | MEDIUM     |
| Custom action function           | Inline implementation + `// Confidence: LOW`              | LOW        |

#### Lifecycle Mapping

| OPA5 Lifecycle                        | Praman Equivalent                                          | Notes                      |
| ------------------------------------- | ---------------------------------------------------------- | -------------------------- |
| `Given.iStartMyApp()`                 | `page.goto(url) + ui5.waitForUI5()` in first `test.step()` | Auth handled by seed       |
| `Then.iTeardownMyApp()`               | _(remove)_ — Playwright handles cleanup                    | No equivalent needed       |
| `Given.iStartMyAppInAFrame()`         | `page.frameLocator() + ui5.waitForUI5()`                   | Rare; needs iFrame support |
| `Opa5.extendConfig({ arrangements })` | Test-level config via `test.use({})`                       | Config adaptation          |

#### Assertion Mapping

| OPA5 Assertion                              | Praman Equivalent                                            | Confidence |
| ------------------------------------------- | ------------------------------------------------------------ | ---------- |
| `Opa5.assert.ok(condition)`                 | `expect(condition).toBeTruthy()`                             | HIGH       |
| `Opa5.assert.equal(a, b)`                   | `expect(a).toBe(b)`                                          | HIGH       |
| `Opa5.assert.strictEqual(a, b)`             | `expect(a).toBe(b)`                                          | HIGH       |
| `success: function(oControl) { check }`     | `const ctrl = await ui5.control(sel); expect(...)`           | MEDIUM     |
| `aggregationLengthEquals: { name, length }` | `expect(await ui5.table.getRowCount(id)).toBe(length)`       | HIGH       |
| `aggregationFilled: { name }`               | `expect(await ui5.table.getRowCount(id)).toBeGreaterThan(0)` | HIGH       |

### Confidence Scoring System

Each migrated `test.step()` receives a confidence annotation:

```typescript
await test.step('Step 3: Fill Supplier Field', async () => {
  // Migration: OPA5 → Praman | Source: ObjectPage.iFillSupplier
  // Confidence: HIGH — direct controlType + properties mapping
  await ui5.fill({ controlType: 'sap.m.Input', properties: { name: 'Supplier' } }, 'VENDOR-001');
  await ui5.waitForUI5();
});

await test.step('Step 5: Verify Custom Validation', async () => {
  // Migration: OPA5 → Praman | Source: ObjectPage.iShouldSeeValidStatus
  // Confidence: LOW — custom matcher 'statusValidator' converted to property check
  // ⚠️ REVIEW: Original OPA5 used custom matcher with business logic; verify assertion covers all cases
  const status = await ui5.control({ id: IDS.statusField });
  const value = await status.getValue();
  expect(value).toBe('Valid');
});
```

**Scoring Rules:**

- **HIGH (90-100%)**: Direct 1:1 mapping exists. Standard OPA5
  matchers (controlType, id, properties, Press, EnterText). Standard
  assertions (ok, equal, strictEqual).
- **MEDIUM (60-89%)**: Semantic approximation needed. viewName
  dropped, bindingPath reformatted, success callback decomposed into
  control + assertion, Scroll action.
- **LOW (0-59%)**: Custom matcher function, check function with
  business logic, dynamic selector construction, programmatic journey
  generation.

**Overall File Score:**

```text
Overall Confidence: 85% (17 HIGH, 3 MEDIUM, 2 LOW out of 22 steps)
```

### Migration Report Format

```markdown
# OPA5 Migration Report: Purchase Order App

**Date:** 2026-03-29
**Source:** webapp/test/integration/
**Target:** tests/e2e/purchase-order/

## Summary

| Metric                | Value                    |
| --------------------- | ------------------------ |
| Journeys migrated     | 5                        |
| Total steps           | 47                       |
| HIGH confidence       | 38 (81%)                 |
| MEDIUM confidence     | 6 (13%)                  |
| LOW confidence        | 3 (6%)                   |
| Custom matchers found | 2                        |
| Tests passing         | 45/47 (96%)              |
| Auto-healed           | 2                        |
| Manual review needed  | 2 (LOW confidence steps) |

## Per-Journey Breakdown

### CreateJourney → create-purchase-order.spec.ts

- Steps: 12 | HIGH: 10 | MEDIUM: 2 | LOW: 0
- Status: ✅ All passing
- Custom matchers: None

### EditJourney → edit-purchase-order.spec.ts

- Steps: 15 | HIGH: 12 | MEDIUM: 1 | LOW: 2
- Status: ⚠️ 2 steps need review
- Custom matchers: `statusValidator` → converted to property check (LOW)
- Custom matchers: `bindingContextEquals` → converted to bindingPath assertion (LOW)

## Custom Matcher Conversions

| OPA5 Matcher                        | Praman Conversion                                            | Confidence | Action                                     |
| ----------------------------------- | ------------------------------------------------------------ | ---------- | ------------------------------------------ |
| `statusValidator(status)`           | `expect(await ctrl.getValue()).toBe(status)`                 | LOW        | Review: original checked ValueState + text |
| `bindingContextEquals(path, value)` | `expect(await ui5.odata.getModelProperty(path)).toBe(value)` | LOW        | Review: binding context vs model property  |

## Files Generated

1. `tests/e2e/purchase-order/create-purchase-order.spec.ts`
2. `tests/e2e/purchase-order/edit-purchase-order.spec.ts`
3. `tests/e2e/purchase-order/delete-purchase-order.spec.ts`
4. `tests/e2e/purchase-order/search-purchase-order.spec.ts`
5. `tests/e2e/purchase-order/approval-purchase-order.spec.ts`

## Removed OPA5 Artifacts (safe to delete after verification)

- `webapp/test/integration/journeys/CreateJourney.js`
- `webapp/test/integration/journeys/EditJourney.js`
- `webapp/test/integration/pages/ListPage.js`
- `webapp/test/integration/pages/ObjectPage.js`
- `webapp/test/integration/AllJourneys.js`
```

### Layer Compliance

| New File                                        | Layer        | Imports From            | Compliance |
| ----------------------------------------------- | ------------ | ----------------------- | ---------- |
| `src/ai/migration/opa5-confidence-scorer.ts`    | Layer 4 (AI) | Layer 1 (types, errors) | ✅ Valid   |
| `src/ai/migration/opa5-mapping-rules.ts`        | Layer 4 (AI) | Layer 1 (types)         | ✅ Valid   |
| `src/ai/migration/opa5-anti-pattern-scanner.ts` | Layer 4 (AI) | Layer 1 (types, errors) | ✅ Valid   |
| Agent/prompt/skill files                        | Outside src/ | N/A (agent layer)       | ✅ Valid   |

**No violations**: All new code lives in Layer 4, imports only from Layer 1. No cross-layer violations. No new dependencies on Layer 2 (bridge) or Layer 3 (proxy).

### Error Classes (D8 + D29 Compliance)

All migration-specific errors extend `PramanError` with full error model:

```typescript
import { PramanError } from '#core/errors/base.js';

export class MigrationError extends PramanError {
  constructor(options: {
    code: 'ERR_OPA5_PARSE_FAILED' | 'ERR_OPA5_MAPPING_FAILED' | 'ERR_OPA5_GENERATION_FAILED';
    message: string;
    attempted: string;
    retryable: boolean;
    details?: Record<string, unknown>;
    suggestions: string[];
  }) {
    super(options);
  }
}

export class ConfidenceScoringError extends PramanError {
  constructor(options: {
    code: 'ERR_CONFIDENCE_CALCULATION_FAILED' | 'ERR_CONFIDENCE_THRESHOLD_UNMET';
    message: string;
    attempted: string;
    retryable: boolean;
    details?: { stepName: string; score: number; threshold: number };
    suggestions: string[];
  }) {
    super(options);
  }
}
```

### Module Size (D27 Compliance)

**Documented Exception:** `opa5-anti-pattern-scanner.ts` may exceed
300 LOC due to 19 forbidden pattern checks. This is a documented
exception similar to browser-evaluated scripts (per skills-architect.md
Section 4.2). If it exceeds 400 LOC, split into
`opa5-anti-pattern-scanner.ts` (orchestrator) +
`opa5-pattern-rules.ts` (rule definitions).

### Import Rules (All New Modules)

All new modules in `src/ai/migration/` must follow:

- Path aliases: `import { PramanError } from '#core/errors/base.js'`
- Relative imports with `.js` extension: `import { scorerFn } from './opa5-confidence-scorer.js'`
- Node builtins with `node:` prefix: `import { readFile } from 'node:fs/promises'`
- ESM only: `import`, never `require`
- External imports before internal imports

### Sub-Path Export Rationale (D1 Alignment)

The `./migration` sub-path represents a first-class AI capability
distinct from the generic AI service (`./ai`). It follows the same
pattern as `./fe` (Fiori Elements domain) and `./reporters` (reporting
domain) — each is a domain-specific Layer 4 module with its own clear
boundary. Migration is opt-in: teams that don't migrate from OPA5
never import `playwright-praman/migration`.

---

## Consequences

### What Becomes Easier

- Enterprise teams get a clear, automated migration path from OPA5 to Praman
- Per-step confidence scores address the user's explicit request for transparency
- Custom matcher handling surpasses wdi5's capabilities (which never implemented it)
- The migration report provides a "kill the old stuff" checklist — safe to delete
  OPA5 files after verification

### What Becomes Harder

- LLM context window limits require batching for very large OPA5 suites (50+ files)
- Non-deterministic output means running the same migration twice may produce
  slightly different tests
- Teams need LLM API access for migration (not purely offline)

### What We'll Need to Revisit

- If demand grows for deterministic migration (CI/CD pipeline migration), add
  AST-first parser (Option A) as a complementary tool
- If live-discovery proves essential for accuracy, add Option B's discovery phase
  as an optional enhancement to Phase 5
- Context window scaling strategy for very large codebases (file batching,
  summary caching)

---

## Action Items

1. [ ] Create `skills/playwright-praman-sap-testing/skills-opa5-migration-expert.md` with full mapping rules
2. [ ] Create `.claude/agents/praman-sap-opa5-migrator.md` agent definition
3. [ ] Create `.claude/prompts/praman-sap-opa5-migrate.md` entry prompt
4. [ ] Create `.claude/prompts/praman-sap-opa5-coverage.md` full pipeline prompt
5. [ ] Implement `src/ai/migration/opa5-confidence-scorer.ts` (TDD)
6. [ ] Implement `src/ai/migration/opa5-mapping-rules.ts` (TDD)
7. [ ] Implement `src/ai/migration/opa5-anti-pattern-scanner.ts` (TDD)
8. [ ] Add `./migration` sub-path export to package.json
9. [ ] Write unit tests for confidence scorer and mapping rules
10. [ ] Test migration agent against sample OPA5 test suite
11. [ ] Update SKILL.md with migration capabilities
12. [ ] Update CLAUDE.md agent table with new `praman-sap-opa5-migrator` agent
13. [ ] Add migration section to README.md

---

## Appendix A: Real OPA5 Script Analysis (Verified Against SAP OpenUI5 Shopping Cart Demo)

The conversion approach has been verified against **real OPA5 test
scripts** from SAP's official OpenUI5 Shopping Cart demo app:

- **Source**: <https://github.com/SAP/openui5/tree/master/src/sap.m/test/sap/m/demokit/cart/webapp/test/integration>
- **Local copies**: `docs/adr/opa5-samples/original/` (OPA5 originals)
- **Converted output**:
  `docs/adr/opa5-samples/converted/buy-product-journey.spec.ts`
  (Praman gold-standard)
- **Full analysis**: `docs/adr/opa5-samples/CONVERSION-ANALYSIS.md`

**Results**: 11 real OPA5 patterns analyzed. 88% HIGH confidence,
10% MEDIUM, 2% LOW — confirming the ADR's predicted distribution.

**Key gaps discovered from real scripts**:

1. **i18n text resolution**: OPA5 `i18NText` matcher resolves keys
   at runtime — migration agent must resolve from `i18n.properties`
   or flag as MEDIUM
2. **Chained success callback flattening**: Nested
   `success() { this.waitFor() }` must be flattened to sequential
   `await` calls
3. **RangeSlider / custom fireEvent**: Direct `fireEvent()`
   workarounds need LOW confidence flagging
4. **viewName scoping**: OPA5 `viewName` constrains selectors to a
   view; Praman discovers app-wide — may need `ancestor` selector
   for disambiguation
5. **Fluent `.and` chaining**:
   `Then.onHome.iShouldSeeX().and.iShouldSeeY()` must be split
   into separate assertions
6. **opaTest → test.step merge**: CRITICAL architectural change —
   OPA5's separate `opaTest()` functions sharing state must merge
   into a single `test()` with `test.step()` blocks

## Appendix A-2: OPA5 Pattern Catalog (Parser Must Handle)

### Pattern 1: Standard GWT Journey

```javascript
opaTest('Should create record', function (Given, When, Then) {
  Given.iStartMyApp();
  When.onTheListPage.iPressCreate();
  Then.onTheObjectPage.iShouldSeeNewRecord();
});
```

### Pattern 2: Parameterized waitFor with Properties

```javascript
iPressButton: function (sText) {
    return this.waitFor({
        controlType: "sap.m.Button",
        properties: { text: sText },
        actions: new Press(),
        errorMessage: "Button '" + sText + "' not found"
    });
}
```

### Pattern 3: Custom Matcher Function

```javascript
iShouldSeeFieldWithValue: function (sField, sValue) {
    return this.waitFor({
        controlType: "sap.m.Input",
        matchers: [new PropertyStrictEquals({
            name: "value",
            value: sValue
        })],
        ancestor: { controlType: "sap.ui.layout.form.FormElement" },
        success: function (aInputs) {
            Opa5.assert.strictEqual(aInputs[0].getValue(), sValue);
        }
    });
}
```

### Pattern 4: Complex Check Function

```javascript
iShouldSeeCorrectTotal: function () {
    return this.waitFor({
        id: "totalField",
        check: function (oField) {
            var fValue = parseFloat(oField.getValue());
            return fValue > 0 && fValue < 1000000;
        },
        success: function (oField) {
            Opa5.assert.ok(true, "Total is within valid range");
        }
    });
}
```

### Pattern 5: Aggregation Matchers

```javascript
iShouldSeeTableWithRows: function (iExpectedCount) {
    return this.waitFor({
        id: "productTable",
        matchers: [new AggregationLengthEquals({
            name: "items",
            length: iExpectedCount
        })],
        success: function (oTable) {
            Opa5.assert.strictEqual(oTable.getItems().length, iExpectedCount);
        }
    });
}
```

### Pattern 6: UI5 Journey Recorder Output

```javascript
// Auto-generated by UI5 Journey Recorder
opaTest('Recorded Journey', function (Given, When, Then) {
  When.waitFor({
    controlType: 'sap.m.SearchField',
    actions: new EnterText({ text: 'Laptop' }),
  });
  When.waitFor({
    controlType: 'sap.m.StandardListItem',
    properties: { title: 'Laptop Basic' },
    actions: new Press(),
  });
});
```

## Appendix B: Praman Gold-Standard Output (Migration Target)

```typescript
/**
 * MIGRATED FROM OPA5 — Purchase Order Creation Journey
 *
 * STATUS: MIGRATED FROM OPA5 - 2026-03-29
 * MARKER: opa5-migration-v1
 * SOURCE: webapp/test/integration/journeys/CreateJourney.js
 * OVERALL CONFIDENCE: 85% (10 HIGH, 2 MEDIUM, 0 LOW)
 *
 * MIGRATION REPORT:
 * - OPA5 Page Objects: ListPage.js, ObjectPage.js
 * - Custom Matchers: 0
 * - Actions Migrated: 12/12 (100%)
 * - Assertions Migrated: 8/8 (100%)
 *
 * PRAMAN COMPLIANCE: PASSED (100% UI5 methods for UI5 elements)
 */

import { test, expect } from 'playwright-praman';

const IDS = {
  createBtn: 'listPage--createBtn',
  supplierInput: 'objectPage--supplierInput',
  materialInput: 'objectPage--materialInput',
  quantityInput: 'objectPage--quantityInput',
  saveBtn: 'objectPage--saveBtn',
  messageToast: undefined, // Toast uses controlType lookup
} as const;

test.describe('Purchase Order Creation (migrated from OPA5 CreateJourney)', () => {
  test('Create PO - Full Flow', async ({ page, ui5, ui5Navigation, ui5Footer }) => {
    await test.step('Step 1: Navigate to PO List', async () => {
      // Migration: OPA5 → Praman | Source: Given.iStartMyApp()
      // Confidence: HIGH — standard app navigation
      await page.goto(process.env.SAP_CLOUD_BASE_URL!);
      await ui5.waitForUI5();
      await ui5Navigation.navigateToApp('PurchaseOrder-manage');
      await ui5.waitForUI5();
    });

    await test.step('Step 2: Click Create', async () => {
      // Migration: OPA5 → Praman | Source: ListPage.iPressCreate
      // Confidence: HIGH — direct Button.press() mapping
      await ui5.press({ id: IDS.createBtn });
      await ui5.waitForUI5();
    });

    await test.step('Step 3: Fill Supplier', async () => {
      // Migration: OPA5 → Praman | Source: ObjectPage.iFillSupplier
      // Confidence: HIGH — direct EnterText → fill mapping
      await ui5.fill({ id: IDS.supplierInput }, 'VENDOR-001');
      await ui5.waitForUI5();
    });

    await test.step('Step 4: Fill Material', async () => {
      // Migration: OPA5 → Praman | Source: ObjectPage.iFillMaterial
      // Confidence: HIGH — direct EnterText → fill mapping
      await ui5.fill({ id: IDS.materialInput }, 'MAT-100');
      await ui5.waitForUI5();
    });

    await test.step('Step 5: Fill Quantity', async () => {
      // Migration: OPA5 → Praman | Source: ObjectPage.iFillQuantity
      // Confidence: MEDIUM — numeric input; OPA5 used string, Praman uses string too
      await ui5.fill({ id: IDS.quantityInput }, '10');
      await ui5.waitForUI5();
    });

    await test.step('Step 6: Save', async () => {
      // Migration: OPA5 → Praman | Source: ObjectPage.iPressSave
      // Confidence: HIGH — direct Button.press() mapping
      await ui5Footer.clickSave();
      await ui5.waitForUI5();
    });

    await test.step('Step 7: Verify Success Message', async () => {
      // Migration: OPA5 → Praman | Source: ObjectPage.iShouldSeeMessageToast("Created")
      // Confidence: MEDIUM — OPA5 MessageToast check → Praman dialog confirm
      await ui5.dialog.confirm();
      await ui5.waitForUI5();
    });
  });
});
```

## Appendix C: Registry Scan Performance Advisory

Per the user feedback about Registry Scan performance on bulky pages:

**Impact:** Pages with 5000+ controls can add 5–15 seconds per discovery call when using Strategy 3 (Registry Scan). This is because `registry.all()` iterates every registered control.

**Recommendation for migration agent:**

- Default to `PRAMAN_DISCOVERY_STRATEGIES=direct-id,recordreplay`
  (skip Registry Scan) during migration verification
- Only enable Registry Scan for LOW confidence steps where direct-id
  and RecordReplay fail
- Document in migration report when Registry Scan was needed and its
  performance impact
- For CI/CD pipelines: recommend disabling Registry Scan entirely
  unless specific tests require it

**Configuration:**

```typescript
// praman.config.ts — Optimized for CI/CD
export default defineConfig({
  discoveryStrategies: ['direct-id', 'recordreplay'], // Skip registry-scan for speed
  controlDiscoveryTimeout: 10_000, // 10s default, increase if needed
  registryScan: {
    enabled: false, // Enable per-test with test.use({ registryScan: { enabled: true } })
    maxControls: 5000, // Warning threshold
    timeout: 15_000, // Separate timeout for scan-heavy pages
  },
});
```
