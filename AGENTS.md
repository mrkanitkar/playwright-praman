# AGENTS.md — Universal Agent Instructions for Praman v1.0

## Project

AI-First SAP UI5 Test Automation Platform for Playwright.
Single npm package `playwright-praman` with sub-path exports.
Ground-up rewrite — NO copy-paste from v2.5.0.

## Architecture

- 5-layer: Core Infrastructure → Bridge Adapters → Typed Proxy → Fixtures → AI
- Layer dependency: lower layers NEVER import from higher layers
- All modules ≤ 300 LOC (document exceptions)

## Rules

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

## Cross-Platform Requirements

- Always use `node:path` methods — never hardcoded `/` or `\`
- Always use `node:fs/promises` for async file operations
- Use `import.meta.url` + `fileURLToPath` for `__dirname` equivalent
- No bash-only npm scripts — use Node.js built-ins (`fs.rmSync`, not `rm -rf`)
- Dual ESM+CJS build: validate with `npm run check:exports`

## Import Order

1. Node built-ins (`node:path`, `node:fs`)
2. External packages (`zod`, `pino`)
3. Internal (`#core/`, `#bridge/`, `#proxy/`)
4. Parent (`../`)
5. Sibling (`./`)

## Error Pattern

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

## Testing

- Unit tests: Vitest, hermetic, `*.test.ts`
- Integration tests: Playwright, `*.spec.ts`, use `test.step()`
- Coverage: Tiered (100% errors/API, 95% core, 90% global), per-file enforced via @vitest/coverage-v8
- Mock bridge with typed test doubles from `tests/helpers/`

## Commands

- `npm run lint` — ESLint (0 errors, 0 warnings)
- `npm run typecheck` — tsc --noEmit
- `npm run test:unit` — Vitest (hermetic)
- `npm run build` — tsup (ESM + CJS)
- `npm run check:exports` — attw export validation
- `npm run ci` — lint + typecheck + test:unit + build

## Commit Messages

Conventional Commits: `feat(scope): description`

Scopes: core, config, errors, logging, bridge, adapter, proxy, fixtures, auth, ai, intents, vocabulary, fe, reporters, cli, docs, ci, deps, release

## Skill Files

For detailed domain knowledge, see `skills/playwright-praman-sap-testing/`:

| Task                           | Skill File                    |
| ------------------------------ | ----------------------------- |
| Architecture decisions         | `skills-architect.md`         |
| TypeScript implementation      | `skills-implementer.md`       |
| TDD, RED-GREEN-REFACTOR cycle  | `skills-tdd.md`               |
| Unit/integration tests         | `skills-tester.md`            |
| Playwright fixtures, selectors | `skills-playwright-expert.md` |
| SAP UI5 controls, FLP, OData   | `skills-sap-ui5-expert.md`    |
| PR review, quality gates       | `skills-reviewer.md`          |
| CI/CD, security, build         | `skills-security-build.md`    |
