# Praman SAP Test Automation — Universal Agent Integration (AGENTS.md)

Append this to your project's `AGENTS.md` for universal AI agent support.

---

## SAP UI5 Test Generation with Praman

**Package**: `playwright-praman`
**Skill file**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

### Mandatory: Read Skill File First

Before generating any SAP UI5 test, read:

```text
node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md
```

This file contains the 7 mandatory rules that ALL generated tests must follow.

### Import Pattern

```typescript
// The ONLY valid import
import { test, expect } from 'playwright-praman';
```

### Key Rules

1. **Fixture-only**: No class imports. All UI5 interaction via fixtures.
2. **No native selectors for UI5**: Never `page.click('#__...')` for UI5 controls.
3. **Auth in seed**: Raw Playwright auth in `tests/seeds/sap-seed.spec.ts` (no Praman fixtures).
4. **Gold pattern**: `setValue()` + `fireChange()` + `waitForUI5()` for inputs.
5. **Compliance header**: Every generated test needs a TSDoc compliance report.

### Quick Reference

```text
node_modules/playwright-praman/skills/playwright-praman-sap-testing/ai-quick-reference.md
```

### Examples

```text
node_modules/playwright-praman/skills/playwright-praman-sap-testing/test-template.ts
```
