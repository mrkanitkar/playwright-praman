# Praman SAP Test Automation — GitHub Copilot Integration

Append this to your project's `.github/copilot-instructions.md` to enable SAP UI5 test generation.

---

## Praman SAP Testing with GitHub Copilot

**Primary entry point**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

### Setup

```bash
# 1. Initialize Playwright agents for Copilot
npx playwright init-agents --loop=copilot

# 2. Copy Praman SAP agents
cp node_modules/playwright-praman/agents/copilot/*.agent.md .github/agents/

# 3. Copy seed file
mkdir -p tests/seeds
cp node_modules/playwright-praman/seeds/sap-seed.spec.ts tests/seeds/
```

### Available SAP Agents

| Agent                  | File                                           | Purpose                                                  |
| ---------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| `praman-sap-planner`   | `.github/agents/praman-sap-planner.agent.md`   | Explore SAP app + produce test plan + gold-standard spec |
| `praman-sap-generator` | `.github/agents/praman-sap-generator.agent.md` | Generate compliant tests from plan                       |
| `praman-sap-healer`    | `.github/agents/praman-sap-healer.agent.md`    | Fix failing tests, enforce compliance                    |

### The 7 Mandatory Rules

When generating SAP tests, ALWAYS:

1. Import ONLY from `playwright-praman`: `import { test, expect } from 'playwright-praman'`
2. Use Praman fixtures for ALL UI5 elements — NEVER `page.click('#__...')`, `page.locator('[data-sap-ui]')`
3. Use Playwright native ONLY for verified non-UI5 elements
4. Keep auth in seed file — NEVER `sapAuth.login()` in test body
5. Use `setValue()` + `fireChange()` + `waitForUI5()` for every input
6. Use `searchOpenDialogs: true` for dialog controls
7. Include TSDoc compliance header in every generated test

### Fixture Quick Reference

```typescript
import { test, expect } from 'playwright-praman';

test('scenario', async ({ ui5, ui5Navigation, ui5Footer, sapAuth, intent, fe, pramanAI }) => {
  // Navigation
  await ui5Navigation.navigateToTile('My App');

  // Control interaction
  const btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create' } });
  await btn.press();

  // Input (ALWAYS setValue + fireChange + waitForUI5)
  const input = await ui5.control({ id: 'myInput' });
  await input.setValue('value');
  await input.fireChange({ value: 'value' });
  await ui5.waitForUI5();

  // Table
  const rows = await ui5.table.getRows('myTable');
  await ui5.table.clickRow('myTable', 0);

  // Dialog
  await ui5.dialog.waitFor();
  await ui5.dialog.confirm();

  // Footer
  await ui5Footer.clickSave();
});
```

### Forbidden Patterns (Never Use for UI5)

```text
page.click('#__...')         → ui5.control().press()
page.fill('#__...')          → ui5.control().setValue()
page.locator('[data-sap-ui]') → ui5.control()
page.locator('.sapM...')     → ui5.control({ controlType })
from '@playwright/test'      → 'playwright-praman'
from 'dhikraft'              → 'playwright-praman'
page.waitForTimeout(...)     → ui5.waitForUI5() or polling
```

### Post-Generation Checklist

After every generated test, verify:

- [ ] Import from `playwright-praman` only
- [ ] Zero Playwright native for UI5 elements
- [ ] Zero forbidden patterns
- [ ] Compliance header present
- [ ] `npm run typecheck` passes
