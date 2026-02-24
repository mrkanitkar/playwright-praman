---
agent: praman-sap-healer
description: Debug and fix a failing SAP Praman test
---

Debug and fix the failing SAP Praman test.

**Skill reference**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

Before starting, read:

- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md` (forbidden patterns, transformation rules)
- The failing test file

Healing steps:

1. Run the test to capture the error
2. Scan for all 16+ forbidden patterns
3. Apply transformations (Gold → Silver → Bronze priority)
4. Fix SAP-specific issues (timing, dialog, V4 MDC migration)
5. Re-run and verify pass
6. Update compliance report header
