---
agent: praman-sap-planner
description: Plan SAP UI5 test scenarios with deep control discovery and gold-standard output
---

Plan test scenarios for the SAP Fiori application described below.

**Seed file**: `tests/seeds/sap-seed.spec.ts`
**Skill reference**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

Before starting, read:

- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md` (mandatory rules)
- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/ai-quick-reference.md` (patterns)

Outputs expected:

1. `specs/{app}.plan.md` — structured test plan
2. `tests/e2e/{app}/{app}-gold.spec.ts` — gold-standard test (100% Praman)
