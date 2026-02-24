---
agent: default
description: Full SAP test coverage - plan, generate, and heal in sequence
---

Provide full SAP UI5 test coverage for the application described.

## Orchestration Flow

### Phase 1: Plan

Call the `#praman-sap-planner` subagent:

```text
Plan test scenarios for: {describe the SAP application and key business flows}
Seed file: tests/seeds/sap-seed.spec.ts
Read node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md first.
```

### Phase 2: Generate

For each test scenario in the plan, call `#praman-sap-generator`:

```text
Generate tests from: specs/{app}.plan.md
Seed file: tests/seeds/sap-seed.spec.ts
Read node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md first.
```

### Phase 3: Heal

Run generated tests and fix any failures via `#praman-sap-healer`:

```text
Fix failing tests in: tests/e2e/{app}/
Read node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md first.
```

## Quality Gates

After all phases complete, verify:

- [ ] All tests import from `playwright-praman`
- [ ] Zero forbidden patterns in any test file
- [ ] All tests have TSDoc compliance header
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
