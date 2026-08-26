---
description: Full SAP test pipeline via Playwright CLI (plan + generate + heal)
---

Provide full SAP UI5 test coverage for the application described, using the Playwright CLI toolchain.

## Orchestration Flow

### Phase 1: Plan

Call `/praman-cli-plan`:

```text
Plan test scenarios for: {describe the SAP application and key business flows}
Seed file: tests/seeds/sap-seed.spec.ts
Read node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md first.
```

Wait for the planner to complete. It will produce:
- `specs/{app}.plan.md` -- structured test plan
- `tests/e2e/{app}/{app}-gold.spec.ts` -- gold-standard test

### Phase 2: Generate

For each test scenario in the plan, call `/praman-cli-generate`:

```text
Generate tests from: specs/{app}.plan.md
Seed file: tests/seeds/sap-seed.spec.ts
Read node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md first.
```

Wait for the generator to complete. It will produce `.spec.ts` files in `tests/e2e/{app}/`.

### Phase 3: Heal

Run all generated tests and fix any failures via `/praman-cli-heal`:

```text
Fix failing tests in: tests/e2e/{app}/
Read node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md first.
```

The healer will:
1. Run tests with `--debug=cli` to pause at failures
2. Attach and inspect page state via CLI
3. Diagnose root causes (selector, timing, dialog, V2/V4)
4. Edit `.spec.ts` files directly to apply fixes
5. Re-run until all tests pass or are marked `test.fixme()`

### Phase 4: Verify and Report

After all phases complete, run verify-spec on each generated file:

```bash
npx playwright-praman verify-spec tests/e2e/{app}/*.spec.ts
```

Then verify overall compliance:

- [ ] All tests pass `verify-spec` checks
- [ ] Zero forbidden patterns in any test file
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

Summarize results:
- Total scenarios planned
- Total tests generated
- Tests passing on first run
- Tests healed (with summary of fixes)
- Tests marked `fixme` (with reasons)
- Overall compliance percentage
