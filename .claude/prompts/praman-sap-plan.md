---
agent: praman-sap-planner
description: Plan SAP UI5 test scenarios with deep control discovery and gold-standard output
---

Plan test scenarios for the SAP Fiori application described below.

**Seed file**: `tests/seeds/sap-seed.spec.ts`
**Skill reference**: `.github/skills/sap-test-automation/SKILL.md` (or `skills/playwright-praman-sap-testing/SKILL.md`)

Before starting, read:

- `.github/skills/sap-test-automation/SKILL.md` (mandatory rules, fixture lookup)
- `skills/playwright-praman-sap-testing/ai-quick-reference.md` (patterns)
- `skills/playwright-praman-sap-testing/test-template.ts` (gold-standard examples)

Outputs expected:

1. `specs/{app}.plan.md` — structured test plan
2. `tests/e2e/{app}/{app}-gold.spec.ts` — gold-standard test (100% Praman)
