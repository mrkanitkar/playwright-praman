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

---

## CLI-Based Test Automation (Playwright CLI)

For agent-driven test generation using the Playwright CLI (`@playwright/cli`), read the CLI skill:

**CLI skill reference**: `skills/praman-sap-cli/SKILL.md`

### Quick Start

```bash
# Open SAP app with praman bridge injection
playwright-cli -s=sap open https://sap-system.example.com --persistent --config=.playwright/praman-cli.config.json

# Authenticate
playwright-cli -s=sap fill e3 "SAP_USERNAME"
playwright-cli -s=sap fill e5 "SAP_PASSWORD"
playwright-cli -s=sap click e7
playwright-cli -s=sap state-save sap-auth.json

# Discover UI5 controls via bridge
playwright-cli -s=sap run-code "async page => {
  return await page.evaluate(() => {
    const registry = sap.ui.require('sap/ui/core/ElementRegistry').all();
    return Object.keys(registry).slice(0, 20).map(id => ({
      id, type: registry[id].getMetadata().getName()
    }));
  });
}"
```

### Key CLI Rules

- `--config=.playwright/praman-cli.config.json` is MANDATORY on `open` command
- `run-code` requires `return` — `console.log()` is invisible
- Use `--filename` with `snapshot` to avoid token-heavy inline YAML
- Output: `specs/{app}.plan.md` + `tests/e2e/sap-cloud/{app}-e2e-praman-gold-standard.spec.ts`
