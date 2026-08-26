---
agent: praman-sap-planner-cli
description: Plan SAP UI5 test scenarios via Playwright CLI (token-efficient)
---

Plan test scenarios for the SAP Fiori application described below.

**Skill reference**: `skills/praman-sap-cli/SKILL.md`
**Config**: `.playwright/praman-cli.config.json`

Before starting, read:

- `skills/praman-sap-cli/SKILL.md` (CLI commands, bridge patterns, mandatory rules)
- `skills/praman-sap-cli/claude-SKILL.md` (Claude-specific patterns, if available)

Outputs expected:

1. `specs/{app}.plan.md` -- structured test plan
2. `tests/e2e/{app}/{app}-gold.spec.ts` -- gold-standard test (100% Praman)
