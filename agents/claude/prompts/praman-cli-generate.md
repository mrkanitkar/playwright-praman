---
agent: praman-sap-generator-cli
description: Generate Praman tests from plan via Playwright CLI
---

Generate Praman-compliant tests from the test plan provided, using the Playwright CLI for live
browser validation.

**Skill reference**: `skills/praman-sap-cli/SKILL.md`

Before starting, read:

- `skills/praman-sap-cli/SKILL.md` (CLI command reference, bridge patterns, session management)
- `skills/playwright-praman-sap-testing/SKILL.md` (fixture map, selector guide, mandatory rules)
- The test plan file provided (e.g., `specs/{app}.plan.md`)

Workflow:

1. Read the plan file to understand all steps and verifications
2. Open a CLI browser session: `playwright-cli -s=gen open <url> --persistent`
3. Authenticate via `state-load` or fill/click login form
4. For each plan step: navigate, discover controls via `run-code`, verify actions work
5. Write the `.spec.ts` file with Praman fixture code
6. Validate: `npx tsc --noEmit` + `npx eslint` on the generated file
7. Close browser: `playwright-cli -s=gen close`

All generated tests MUST:

- Import from `playwright-praman` ONLY
- Use Praman fixtures exclusively for UI5 elements
- Use single `test()` with `test.step()` for E2E flows
- Include TSDoc compliance header (gold-standard format)
- Pass the 16+ forbidden pattern scan
