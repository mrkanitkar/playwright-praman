# Praman v1.0 Copilot Instructions

## Architecture
- Single package `playwright-praman` with sub-path exports
- 5-layer architecture: Core → Bridge → Proxy → Fixtures → AI
- All modules ≤ 300 LOC (warning, not blocking)

## Code Standards
- TypeScript strict mode, no `any`
- ESM only (`import`, not `require`)
- All public APIs MUST have TSDoc with `@example`
- Use pino logger, NEVER `console.log`
- Prefer `readonly` for properties that shouldn't change
- Use `Readonly<T>` for config objects

## Testing Standards
- Unit tests: Vitest, hermetic (no network, no SAP system)
- Integration tests: Playwright against SAP demo apps
- All tests must use `test.step()` for readability
- NEVER use `page.waitForTimeout()` — use waitForUI5Stable()
- Coverage threshold: 90% statements

## Error Handling
- All errors extend `PramanError`
- Include: code (ERR_*), message, attempted, retryable, details, suggestions[]
- ControlError adds: lastKnownSelector, availableControls[], suggestedSelector

## Naming Conventions
- Files: kebab-case (e.g., `bridge-error.ts`)
- Interfaces/Types: PascalCase (e.g., `BridgeAdapter`)
- Functions/methods: camelCase (e.g., `findControl`)
- Constants: UPPER_CASE (e.g., `MAX_RETRY_COUNT`)
- Error codes: ERR_SCOPE_DESCRIPTION (e.g., `ERR_BRIDGE_TIMEOUT`)

## Import Order
1. Node built-ins (`node:path`, `node:fs`)
2. External packages (`zod`, `pino`)
3. Internal (`#core/`, `#bridge/`, `#proxy/`)
4. Parent (`../`)
5. Sibling (`./`)

## Commit Messages
- Conventional Commits: `feat(scope): description`
- Scopes: core, bridge, proxy, fixtures, auth, ai, intents, etc.
