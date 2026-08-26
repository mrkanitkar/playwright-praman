---
agent: praman-sap-healer-cli
description: Fix failing Praman tests via Playwright CLI debugging
---

Debug and fix the failing SAP Praman test using Playwright CLI.

**Skill reference**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

Before starting, read:

- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md` (forbidden patterns, transformation rules)
- The failing test file

Healing steps:

1. Read the failing test file
2. Run with `--debug=cli` to pause at failure: `PLAYWRIGHT_HTML_OPEN=never npx playwright test <file> --debug=cli &`
3. Attach to debug session: `playwright-cli attach tw-<session>`
4. Inspect page state: `snapshot --filename=/tmp/healer-snapshot.txt` + `run-code` with bridge diagnostics
5. Step through with `step-over` to locate exact failure point
6. Scan for all 19 forbidden patterns
7. Apply transformations (Gold -> Silver -> Bronze priority)
8. Fix SAP-specific issues (timing, dialog, V4 MDC migration)
9. Edit the `.spec.ts` directly to apply fixes
10. Re-run test: `PLAYWRIGHT_HTML_OPEN=never npx playwright test <file>`
11. Verify pass and update compliance report header
