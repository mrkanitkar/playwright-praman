# Praman v1.0 — Rules for Google Antigravity

## Project

AI-First SAP UI5 Test Automation Platform for Playwright.
Single npm package `playwright-praman` with sub-path exports.
Ground-up rewrite — NO copy-paste from v2.5.0.

## Architecture

- 5-layer: Core Infrastructure → Bridge Adapters → Typed Proxy → Fixtures → AI
- Layer dependency: lower layers NEVER import from higher layers
- All modules ≤ 300 LOC

## Code Rules

1. TypeScript strict mode — no `any`, no `as unknown as T`
2. ESM only in source (`import`, not `require`)
3. All public APIs: TSDoc with `@example` tag (TSDoc only, NOT JSDoc)
4. Use pino logger — NEVER `console.log`
5. All errors extend `PramanError` with `code`, `attempted`, `retryable`, `suggestions[]`
6. All relative imports include `.js` extension
7. Node builtins use `node:` prefix (`node:path`, `node:fs`)
8. Config is `Readonly<PramanConfig>` — never mutate
9. Path aliases: `#core/*`, `#bridge/*`, `#proxy/*`, `#fixtures/*`
10. Prefer `readonly` for properties that shouldn't change
11. No `I` prefix on interfaces — `BridgeAdapter` not `IBridgeAdapter`
12. Files: kebab-case. Types: PascalCase. Functions: camelCase. Constants: UPPER_CASE.
13. Error codes: `ERR_SCOPE_DESCRIPTION` (e.g., `ERR_BRIDGE_TIMEOUT`)
14. Booleans: `is/has/can/should` prefix

## Cross-Platform Requirements

- Always use `node:path` methods — never hardcoded `/` or `\` separators
- Always use `node:fs/promises` for async file operations
- Use `import.meta.url` + `fileURLToPath` for `__dirname` equivalent
- No bash-only npm scripts — use Node.js built-ins
- Dual ESM+CJS build output

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

- Unit: Vitest, hermetic (no network), `*.test.ts`, tiered coverage (100%/95%/90% per-file)
- Integration: Playwright, `*.spec.ts`, use `test.step()`
- NEVER use `page.waitForTimeout()` — use `waitForUI5Stable()`

## Commands

- `npm run lint` — ESLint (0 errors, 0 warnings)
- `npm run typecheck` — tsc --noEmit
- `npm run test:unit` — Vitest (hermetic)
- `npm run build` — tsup (ESM + CJS)
- `npm run check:exports` — attw export validation
- `npm run ci` — lint + typecheck + test:unit + build

## Skill Files

For detailed domain knowledge, see `skills/playwright-praman-sap-testing/`:

- `skills-architect.md` — Architecture decisions
- `skills-implementer.md` — TypeScript implementation
- `skills-playwright-expert.md` — Playwright fixtures, selectors
- `skills-sap-ui5-expert.md` — SAP UI5 controls, FLP, OData
- `skills-tester.md` — Unit/integration tests
- `skills-reviewer.md` — PR review, quality gates
- `skills-security-build.md` — CI/CD, security, build

## Commit Messages

Conventional Commits: `feat(scope): description`
Scopes: core, config, errors, logging, bridge, adapter, proxy, fixtures, auth, ai, intents, vocabulary, fe, reporters, cli, docs, ci, deps, release
