---
agent: praman-sap-generator
description: Generate 100% Praman-compliant SAP UI5 test scripts from a test plan
---

Generate Praman-compliant tests from the test plan provided.

**Seed file**: `tests/seeds/sap-seed.spec.ts`
**Skill reference**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

Before starting, read:

- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md` (mandatory rules)
- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/ai-quick-reference.md` (patterns)
- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/test-template.ts` (examples)
- The test plan file provided

All generated tests MUST:

- Import from `playwright-praman` ONLY
- Use Praman fixtures exclusively for UI5 elements
- Include TSDoc compliance header
- Pass the 16+ forbidden pattern scan
