# Praman SAP Test Automation — OpenAI Jules Setup

Append to `.jules/setup.md` for OpenAI Jules agent support.

---

## SAP UI5 Test Generation with Praman + Playwright

**Primary reference**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

Read before generating SAP UI5 tests. SAP pages are hybrid — use Praman fixtures for UI5 controls, Playwright native for login forms, Web Components, and plain DOM.

## Import

```typescript
import { test, expect } from 'playwright-praman';
```

## Key Rules

1. UI5 controls → Praman fixtures (`ui5.control()`); non-UI5 → Playwright native
2. Input: `setValue()` + `fireChange()` + `waitForUI5()`
3. Auth in seed only
4. TSDoc compliance header required
