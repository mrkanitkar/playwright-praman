# Praman SAP Test Automation — OpenAI Jules Setup

Append to `.jules/setup.md` for OpenAI Jules agent support.

---

## SAP UI5 Test Generation

**Primary reference**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

Read before generating SAP UI5 tests.

## Import

```typescript
import { test, expect } from 'playwright-praman';
```

## Key Rules

1. Fixture-only for UI5 — `ui5.control()` + proxy methods
2. Input: `setValue()` + `fireChange()` + `waitForUI5()`
3. Auth in seed only
4. TSDoc compliance header required
