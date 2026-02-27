# AGENTS.md — playwright-praman

> AI-First SAP UI5 Test Automation Platform for Playwright

## Quick Start

```bash
npm install playwright-praman @playwright/test
npx playwright-praman init
```

```typescript
import { test, expect } from 'playwright-praman';

test('SAP app test', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5.waitForUI5();
  const btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create' } });
  await btn.press();
});
```

## Architecture

5-layer plugin: Core → Bridge → Proxy → Fixtures → AI. Import `{ test, expect }` from `playwright-praman`. All UI5 interactions go through typed fixtures — never use raw `page.click()` on UI5 elements.

## Build & Test

```bash
npm run ci          # lint + typecheck + test:unit + build
npm run test:unit   # Vitest (hermetic, 98%+ coverage)
npm run build       # tsup → dist/ (ESM + CJS)
npm run lint        # ESLint 11 plugins, zero warnings
npm run typecheck   # tsc --noEmit (strict mode)
```

## Coding Conventions

- TypeScript strict — no `any`, no `as unknown as T`
- ESM only — `import`, never `require`
- Node builtins: `node:` prefix required
- Files: kebab-case. Types: PascalCase. Functions: camelCase
- Module limit: 300 LOC (exceptions documented)
- Imports: path aliases `#core/*`, `#bridge/*`, `#proxy/*`
- Errors: extend `PramanError` with `code`, `attempted`, `retryable`, `suggestions[]`
- Logging: pino only — `no-console` enforced
- Docs: TSDoc (not JSDoc) with `@example` on every public function
- Commits: Conventional Commits (`feat(scope): description`)

## Test Writing Rules

When generating tests that USE playwright-praman:

1. `import { test, expect } from 'playwright-praman'` — only valid import
2. UI5 elements → `ui5.control()` + proxy methods (NEVER `page.click('#__...')`)
3. Non-UI5 elements → Playwright native OK (verify not UI5 first)
4. Auth in seed/setup project — never `sapAuth.login()` in test body
5. Inputs: `setValue()` + `fireChange()` + `waitForUI5()` pattern
6. Dialogs: `searchOpenDialogs: true` for controls inside dialogs

## Fixtures

| Fixture         | Key Methods                                                    |
| --------------- | -------------------------------------------------------------- |
| `ui5`           | `control()`, `controls()`, `press()`, `fill()`, `waitForUI5()` |
| `ui5.table`     | `getRows()`, `clickRow()`, `getCellValue()`                    |
| `ui5.dialog`    | `waitFor()`, `confirm()`, `dismiss()`                          |
| `ui5.odata`     | `getModelProperty()`, `queryEntities()`                        |
| `ui5Navigation` | `navigateToTile()`, `navigateToIntent()`, `navigateToHome()`   |
| `ui5Footer`     | `clickSave()`, `clickEdit()`, `clickCancel()`                  |
| `fe.listReport` | `setFilter()`, `search()`, `navigateToItem()`                  |
| `intent.core`   | `fillField()`, `assertField()`, `clickButton()`                |

## Errors

All errors extend `PramanError` with: `code` (ERR\_\*), `message`, `attempted`, `retryable`, `suggestions[]`. Read `error.suggestions` for fix advice. Never fall back to `page.locator()` on `ControlError`.

## Gotchas

- `page.waitForTimeout()` is BANNED — use `ui5.waitForUI5()`
- SmartField wraps inner controls — `getControlType()` returns the wrapper
- FLP continuous polling may prevent `waitForUI5()` from settling — use `expect().toPass()`
- Browser scripts (page.evaluate) can't access module-level functions

## Deep Reference

- Full docs: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`
- LLM docs: https://mrkanitkar.github.io/playwright-praman/llms-full.txt
- Examples: `node_modules/playwright-praman/examples/`
