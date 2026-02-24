# Praman SAP Test Automation — Google Antigravity Rules

Append to `.antigravity/rules.md` for Google Antigravity agent support.

---

## SAP UI5 Testing with Praman

**Skill file**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

Read this file before generating any SAP UI5 test.

## Import

```typescript
import { test, expect } from 'playwright-praman';
```

## Rules

1. ALL UI5 elements via `ui5.control()` — never Playwright native
2. Input: `setValue()` + `fireChange()` + `waitForUI5()` always together
3. Auth in seed: `sapAuth.login()` in `tests/seeds/sap-seed.spec.ts` only
4. TSDoc compliance header in every generated test
5. No forbidden patterns (`page.click('#__...')`, `from 'dhikraft'`, etc.)

## References

- Quick patterns: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/ai-quick-reference.md`
- Examples: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/test-template.ts`
