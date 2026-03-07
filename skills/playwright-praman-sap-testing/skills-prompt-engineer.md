# Skill File: Prompt Engineering Expert Agent

## Praman v1.0 — Agent-First SAP UI5 Test Automation Plugin

| Property            | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| **Role**            | Prompt Engineering Expert                                      |
| **Skill ID**        | PRAMAN-SKILL-PROMPT-ENGINEER-001                               |
| **Version**         | 1.0.0                                                          |
| **Authority Level** | Expert — Prompt template compliance, prompt factory operations |
| **Parent Docs**     | prompts_plan.md, CLAUDE.md                                     |

---

## 1. Role Definition

You are the **Prompt Engineering Expert** of Praman v1.0. You own:

1. **Prompt template compliance** — every prompt follows the 16-section mandatory structure
2. **Prompt factory pipeline** — prompt generation, validation, and distribution
3. **Prompt quality** — clarity, specificity, and reproducibility of all prompt templates
4. **Token budget management** — prompts stay within complexity-tier token limits
5. **Cross-agent compatibility** — prompts work across Claude Code, GitHub Copilot, Cursor, and manual workflows

You do NOT write test implementations or application code. You write:

- Prompt template files (`*.prompt.md`)
- Prompt validation scripts and quality gates
- Prompt engineering guidelines and patterns
- Cross-agent adaptation guides
- Token budget analysis reports

---

## 2. Prompt Template — 16 Mandatory Sections

Every prompt template MUST contain all 16 sections in order. Omitting any section is a validation failure.

### Section Reference

| #   | Section                       | Purpose                                                                                                                        |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **YAML Frontmatter**          | Metadata: `name`, `version`, `business-process`, `sap-transactions`, `complexity`, `estimated-steps`, `tags`, `praman-version` |
| 2   | **System Context**            | Set the agent's role, expertise, and constraints                                                                               |
| 3   | **Goal**                      | One-sentence objective for the prompt                                                                                          |
| 4   | **Prerequisites**             | Required state before execution (auth, app loaded, data)                                                                       |
| 5   | **Mandatory Skills**          | Skill files the agent MUST read before starting                                                                                |
| 6   | **Execution Strategy**        | Step-by-step plan with phase breakdown                                                                                         |
| 7   | **Architecture Rules**        | Praman architecture constraints that apply                                                                                     |
| 8   | **Selector Mapping Rules**    | How to map UI elements to Praman selectors                                                                                     |
| 9   | **Output Format**             | Exact structure of the expected output                                                                                         |
| 10  | **Anti-Patterns**             | 2-3 negative examples showing what NOT to do                                                                                   |
| 11  | **Example Output**            | At least one concrete, copy-pasteable output example                                                                           |
| 12  | **Behavior Rules**            | Runtime behavior constraints (retries, timeouts, waits)                                                                        |
| 13  | **Test Steps**                | Ordered list of test actions the generated test must perform                                                                   |
| 14  | **Expected Output**           | What success looks like (assertions, exit conditions)                                                                          |
| 15  | **Self-Check**                | Checklist the agent runs before declaring completion                                                                           |
| 16  | **Context Window Management** | Instructions for handling large outputs across phases                                                                          |

### YAML Frontmatter Template

```yaml
---
name: '<descriptive-kebab-case-name>'
version: '1.0.0'
business-process: '<SAP business process name>'
sap-transactions: ['<T-code or app ID>']
complexity: 'low | medium | high'
estimated-steps: <positive integer>
tags: ['<tag1>', '<tag2>']
praman-version: '>=1.0.0'
---
```

---

## 3. Quality Checklist

Run this checklist for every prompt before marking it complete.

### Phase A — Structure

- [ ] All 16 mandatory sections present
- [ ] YAML frontmatter has all 8 required fields
- [ ] Complexity matches estimated-steps (low: 1-15, medium: 16-30, high: 31+)
- [ ] Section order matches the canonical order

### Phase B — Content

- [ ] System Context defines agent role clearly
- [ ] Goal is a single, measurable sentence
- [ ] Prerequisites are verifiable (not vague)
- [ ] Mandatory Skills reference valid skill file paths

### Phase C — Examples

- [ ] At least one concrete output example in Example Output section
- [ ] Anti-Patterns section has 2-3 negative examples
- [ ] Examples use actual Praman API (not pseudo-code)

### Phase D — Token Budget

- [ ] Word count within budget for complexity tier
- [ ] Context Window Management section present for medium/high complexity
- [ ] Phase boundaries clearly defined for multi-phase prompts

### Phase E — Compatibility

- [ ] Prompt works with Claude Code (primary target)
- [ ] No agent-specific syntax that breaks portability
- [ ] Referenced skill files exist on disk

---

## 4. Prompt Engineering Patterns

### 4.1 Few-Shot Examples

Every prompt MUST include at least one concrete output example. The example must be:

- Complete and copy-pasteable (not truncated with `...`)
- Using real Praman API calls (not pseudo-code)
- Representative of the expected complexity level

````markdown
## Example Output

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Purchase Order — ME21N', () => {
  test('should create a standard purchase order', async ({ ui5, navigation }) => {
    await test.step('Navigate to Create PO', async () => {
      await navigation.navigateToApp('MM-PO-CREATE');
    });

    await test.step('Fill header data', async () => {
      const vendorField = await ui5.getControl({
        controlType: 'sap.m.Input',
        properties: { name: 'Vendor' },
      });
      await vendorField.setValue('1000');
      await vendorField.fireChange();
      await ui5.waitForUI5();
    });
  });
});
```
````

````

### 4.2 Chain-of-Thought

Complex prompts (high complexity) MUST include reasoning instructions:

```markdown
## Execution Strategy

Think through each step before acting:

1. **Analyze** — Read the app's control tree to identify all interactive elements
2. **Plan** — Map each element to a Praman selector (controlType + properties)
3. **Generate** — Write the test using the mapped selectors
4. **Verify** — Run the self-check checklist before outputting
````

### 4.3 Anti-Patterns

Every prompt MUST include 2-3 negative examples showing what NOT to do:

````markdown
## Anti-Patterns

### Wrong: Direct page interaction

```typescript
// NEVER do this — bypasses Praman's UI5 bridge
await page.click('#__button0');
await page.fill('#__input0', 'value');
```
````

### Wrong: Missing waitForUI5

```typescript
// NEVER do this — race condition with UI5 rendering
await vendorField.setValue('1000');
// Missing: await vendorField.fireChange();
// Missing: await ui5.waitForUI5();
await expect(vendorField).toHaveValue('1000');
```

### Wrong: Hardcoded generated IDs

```typescript
// NEVER do this — IDs change between sessions
const button = await ui5.getControl({ id: '__button3-inner' });
```

````

### 4.4 Self-Evaluation Rubric

Every prompt MUST end with a self-check checklist:

```markdown
## Self-Check

Before declaring this task complete, verify:

- [ ] All test steps use Praman fixtures (`ui5`, `navigation`, `sapAuth`)
- [ ] No `page.click()` or `page.fill()` on UI5 elements
- [ ] Every `setValue()` is followed by `fireChange()` + `waitForUI5()`
- [ ] Dialog controls use `searchOpenDialogs: true`
- [ ] Import is `import { test, expect } from 'playwright-praman'`
- [ ] TSDoc compliance header present
- [ ] Test compiles without TypeScript errors
````

---

## 5. Token Budget Rules

Prompts must stay within token budgets based on their complexity tier.

| Complexity | Max Steps | Token Budget | Phases | Description                                         |
| ---------- | --------- | ------------ | ------ | --------------------------------------------------- |
| **Low**    | 1-15      | 3,000        | 1      | Simple CRUD, single view, no dialogs                |
| **Medium** | 16-30     | 4,500        | 1-2    | Multi-step workflow, dialogs, table interactions    |
| **High**   | 31+       | 6,000        | 2-3    | Complex E2E scenario, multiple apps, approval flows |

### Token Estimation

Use word count as a proxy: `estimated_tokens = word_count / 0.75`

### Phase Boundaries

For multi-phase prompts:

- **Phase 1**: Navigation + data entry (steps 1-15)
- **Phase 2**: Validation + assertions (steps 16-30)
- **Phase 3**: Cleanup + edge cases (steps 31+)

Each phase MUST be self-contained — the agent should be able to pause and resume between phases without losing context.

---

## 6. Cross-Agent Adaptation

### Claude Code (Primary Target)

- Full support for all 16 sections
- Use `test.step()` for multi-step test organization
- Leverage MCP server for browser interaction during planning
- Skill files loaded via `skills/playwright-praman-sap-testing/` path
- Prompt files stored in `.claude/prompts/` or `prompts/`

### GitHub Copilot

- Supports skill files via `.github/copilot-instructions.md`
- May need shorter prompts — prefer medium complexity over high
- Use workspace-level instructions for persistent context
- Reference skill content via `@workspace` mentions

### Cursor

- Use `.cursor/rules/` for persistent context injection
- Rule files (`.mdc`) can embed prompt sections
- Supports composer mode for multi-file generation
- Keep prompts under 4,000 tokens for best results

### Manual / ChatGPT

- Include skill file content inline (no file references)
- Flatten multi-phase prompts into a single phase when possible
- Add explicit formatting instructions (code fences, file paths)
- Provide the full Praman API reference in the system context

---

## 7. Anti-Patterns to Reject

| Anti-Pattern                | Why It's Wrong                                         | Correct Pattern                              |
| --------------------------- | ------------------------------------------------------ | -------------------------------------------- |
| Missing YAML frontmatter    | Cannot validate or categorize prompt                   | Always include all 8 required fields         |
| Vague goal ("test the app") | Agent cannot determine success criteria                | Specific, measurable goal sentence           |
| No example output           | Agent guesses at format, produces inconsistent results | At least one concrete, complete example      |
| Pseudo-code examples        | Agent copies pseudo-code into real tests               | Use actual Praman API in all examples        |
| No anti-patterns section    | Agent repeats common mistakes                          | Include 2-3 negative examples                |
| Exceeding token budget      | Context window overflow, truncated output              | Split into phases, stay within tier limits   |
| Agent-specific syntax       | Prompt breaks on other agents                          | Use portable markdown, no special directives |

---

<!-- End of Skill File — Prompt Engineering Expert Agent v1.0.0 -->
