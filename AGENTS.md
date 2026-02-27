# AGENTS.md — Universal Agent Instructions for Praman v1.0

## For Plugin Contributors

If you are an AI agent working on the `playwright-praman` **source code**, follow these rules.

### Architecture

- 5-layer: Core Infrastructure → Bridge Adapters → Typed Proxy → Fixtures → AI
- Layer dependency: lower layers NEVER import from higher layers
- All modules ≤ 300 LOC (document exceptions)

### Rules

1. TypeScript strict mode — no `any`, no `as unknown as T`
2. Every public function: TSDoc + `@example` tag (TSDoc only, NOT JSDoc)
3. Every module ≤ 300 LOC
4. Every error: `extends PramanError`, includes `code`, `attempted`, `retryable`, `suggestions[]`
5. No `console.log` — use pino: `import { logger } from '#core/logging';`
6. No `page.waitForTimeout()` — banned
7. Unit tests: hermetic, use Vitest, mock bridge interactions
8. Config is `Readonly<PramanConfig>` — never mutate
9. Imports: use `#core/*`, `#bridge/*`, `#proxy/*` path aliases
10. Files: kebab-case. Types: PascalCase. Functions: camelCase. Constants: UPPER_CASE.
11. All relative imports must include `.js` extension
12. Node builtins must use `node:` prefix (`node:path`, `node:fs`)
13. ESM only in source — `import`, never `require`
14. No `I` prefix on interfaces — `BridgeAdapter` not `IBridgeAdapter`

### Cross-Platform Requirements

- Always use `node:path` methods — never hardcoded `/` or `\`
- Always use `node:fs/promises` for async file operations
- Use `import.meta.url` + `fileURLToPath` for `__dirname` equivalent
- No bash-only npm scripts — use Node.js built-ins (`fs.rmSync`, not `rm -rf`)
- Dual ESM+CJS build: validate with `npm run check:exports`

### Import Order

1. Node built-ins (`node:path`, `node:fs`)
2. External packages (`zod`, `pino`)
3. Internal (`#core/`, `#bridge/`, `#proxy/`)
4. Parent (`../`)
5. Sibling (`./`)

### Error Pattern

```typescript
throw new ControlError({
  code: 'ERR_CONTROL_NOT_FOUND',
  message: `Control not found: ${selector}`,
  attempted: `Find control with selector: ${JSON.stringify(selector)}`,
  retryable: true,
  details: { selector, timeout: config.controlDiscoveryTimeout },
  suggestions: [
    'Verify the control ID exists in the UI5 view',
    'Check if the page has fully loaded (waitForUI5Stable)',
    'Try using controlType + properties instead of ID',
  ],
});
```

### Testing

- Unit tests: Vitest, hermetic, `*.test.ts`
- Integration tests: Playwright, `*.spec.ts`, use `test.step()`
- Coverage: Tiered (100% errors/API, 95% core, 90% global), per-file enforced via @vitest/coverage-v8
- Mock bridge with typed test doubles from `tests/helpers/`

### Commands

- `npm run lint` — ESLint (0 errors, 0 warnings)
- `npm run typecheck` — tsc --noEmit
- `npm run test:unit` — Vitest (hermetic)
- `npm run build` — tsup (ESM + CJS)
- `npm run check:exports` — attw export validation
- `npm run ci` — lint + typecheck + test:unit + build

### Commit Messages

Conventional Commits: `feat(scope): description`

Scopes: core, config, errors, logging, bridge, adapter, proxy, fixtures, auth, ai, intents, vocabulary, fe, reporters, cli, docs, ci, deps, release

### Skill Files

For detailed domain knowledge, see `skills/playwright-praman-sap-testing/`:

| Task                               | Skill File                               |
| ---------------------------------- | ---------------------------------------- |
| Architecture decisions             | `skills-architect.md`                    |
| TypeScript implementation          | `skills-implementer.md`                  |
| TDD, RED-GREEN-REFACTOR cycle      | `skills-tdd.md`                          |
| Unit/integration tests             | `skills-tester.md`                       |
| Playwright fixtures, selectors     | `skills-playwright-expert.md`            |
| SAP UI5 controls, FLP, OData       | `skills-sap-ui5-expert.md`               |
| SAP UI5 Web Components, Shadow DOM | `skills-sap-ui5-webcomponents-expert.md` |
| SAP Fiori E2E scenarios, auth      | `skills-sap-fiori-consultant.md`         |
| OData V2/V4, Gateway, mocks        | `skills-sap-odata-expert.md`             |
| PR review, quality gates           | `skills-reviewer.md`                     |
| CI/CD, security, build             | `skills-security-build.md`               |

---

## For Test Writers (Users of playwright-praman)

If you are an AI agent helping a user **write SAP UI5 tests** with `playwright-praman`, this section is for you.

### What is Praman?

An AI-First SAP UI5 Test Automation Platform for Playwright.
Install: `npm i -D playwright-praman`
Import: `import { test, expect } from 'playwright-praman'`

### The 7 Mandatory Rules

1. EVERY UI5 element → `ui5.control()` + proxy methods ONLY
2. NEVER use Playwright native selectors for UI5 elements (`page.click('#__...')`, `page.locator('.sapM...')`)
3. Non-UI5 elements → Playwright native permitted (verify element is NOT UI5 first)
4. `import { test, expect } from 'playwright-praman'` — the ONLY valid import
5. Auth via seed — raw Playwright auth in seed file, NEVER `sapAuth.login()` in test body
6. Post-generation: scan against 16+ forbidden patterns before writing test
7. TSDoc compliance header in every generated test

### Test Template

```typescript
/**
 * {App Name} E2E Test
 *
 * COMPLIANCE: 100% Praman fixture-only
 * Forbidden Pattern Scan: PASSED
 */
import { test, expect } from 'playwright-praman';

test.describe('{App Name} Tests', () => {
  test('Complete scenario - single session', async ({
    page,
    ui5,
    ui5Navigation,
    ui5Footer,
    intent,
    fe,
  }) => {
    await test.step('Step 1: Navigate', async () => {
      await ui5Navigation.navigateToTile('App Name');
      await ui5.waitForUI5();
    });

    await test.step('Step 2: Fill form (gold pattern)', async () => {
      const input = await ui5.control({ id: 'materialInput' });
      await input.setValue('MAT-001');
      await input.fireChange({ value: 'MAT-001' });
      await ui5.waitForUI5();
    });

    await test.step('Step 3: Save and verify', async () => {
      await ui5Footer.clickSave();
      await ui5.dialog.confirm();
      await intent.core.assertField('Status', 'Created');
    });
  });
});
```

### Fixture Quick Reference

| Fixture         | Key Methods                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `ui5`           | `control()`, `controls()`, `click()`, `fill()`, `waitForUI5()`, `waitFor()`                                |
| `ui5.table`     | `getRows(id)`, `clickRow(id, row)`, `getCellValue(id, row, col)`, `findRowByValues(id, values)`            |
| `ui5.dialog`    | `waitFor()`, `confirm()`, `dismiss()`, `getOpen()`                                                         |
| `ui5.date`      | `setDatePicker(id, date)`, `getDatePicker(id)`, `setDateRange(id, start, end)`                             |
| `ui5.odata`     | `getModelData(path)`, `createEntity(url, set, data)`, `queryEntities(url, set)`                            |
| `ui5Navigation` | `navigateToTile(title)`, `navigateToIntent(intent)`, `navigateBack()`, `navigateToHome()`                  |
| `ui5Footer`     | `clickSave()`, `clickEdit()`, `clickCancel()`, `clickCreate()`, `clickDelete()`                            |
| `fe.listReport` | `setFilter(field, value)`, `search()`, `clearFilters()`, `navigateToItem(row)`                             |
| `fe.objectPage` | `clickEdit()`, `clickSave()`, `navigateToSection(id)`, `getSections()`                                     |
| `intent.core`   | `fillField(label, value)`, `clickButton(text)`, `selectOption(label, opt)`, `assertField(label, expected)` |
| `sapAuth`       | `login(page, config)`, `loginFromEnv(page)` — **seed file only, NEVER in tests**                           |
| `pramanAI`      | `discoverPage()`, `buildContext()`, `capabilities`, `recipes`                                              |

### Forbidden Patterns

| Forbidden                       | Replacement                    |
| ------------------------------- | ------------------------------ |
| `page.click('#__...')`          | `ui5.control().press()`        |
| `page.fill('#__...')`           | `ui5.control().setValue()`     |
| `page.locator('[data-sap-ui]')` | `ui5.control()`                |
| `page.locator('.sapM...')`      | `ui5.control({ controlType })` |
| `from '@playwright/test'`       | `from 'playwright-praman'`     |
| `page.waitForTimeout(...)`      | `ui5.waitForUI5()`             |
| `new UI5Handler(...)`           | Use fixture `ui5` directly     |

### Error Self-Correction

Praman throws typed `PramanError` subclasses. On `ControlError`:

- Read `error.suggestions[]` for specific fix advice
- Read `error.availableControls` for what is on screen
- Read `error.suggestedSelector` for Praman's best guess
- Adjust your selector — do NOT fall back to `page.locator()`

### Deep Reference

For complete fixture maps, V2/V4 patterns, control type lookups, and selector shapes, read the full skill file:

```text
node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md
```
