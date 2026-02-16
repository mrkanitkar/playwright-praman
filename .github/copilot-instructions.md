# Praman v1.0 Copilot Instructions

## Project

AI-First SAP UI5 Test Automation Platform for Playwright.
Single npm package `playwright-praman` with sub-path exports.
Ground-up rewrite — NO copy-paste from v2.5.0.

## Architecture

- 5-layer architecture: Core → Bridge → Proxy → Fixtures → AI
- All modules ≤ 300 LOC (warning, not blocking)
- Layer dependency: lower layers NEVER import from higher layers

## Agent Skills (Read Before Working)

Load the appropriate skill file based on the task:

| Task | Skill File |
|------|-----------|
| Architecture decisions, module boundaries | `skills/playwright-praman-sap-testing/skills-architect.md` |
| TypeScript implementation, proxy, bridge | `skills/playwright-praman-sap-testing/skills-implementer.md` |
| Playwright fixtures, selectors, matchers | `skills/playwright-praman-sap-testing/skills-playwright-expert.md` |
| SAP UI5 controls, FLP, OData, RecordReplay | `skills/playwright-praman-sap-testing/skills-sap-ui5-expert.md` |
| Unit/integration tests, coverage | `skills/playwright-praman-sap-testing/skills-tester.md` |
| PR review, quality gates | `skills/playwright-praman-sap-testing/skills-reviewer.md` |
| CI/CD, security, build, release | `skills/playwright-praman-sap-testing/skills-security-build.md` |
| Team overview, collaboration model | `skills/playwright-praman-sap-testing/skills-team-overview.md` |

## Code Standards

- TypeScript strict mode, no `any`, no `as unknown as T`
- ESM only (`import`, not `require`)
- All public APIs MUST have TSDoc with `@example` (TSDoc only, NOT JSDoc)
- Use pino logger, NEVER `console.log`
- Prefer `readonly` for properties that shouldn't change
- Use `Readonly<T>` for config objects
- All relative imports must include `.js` extension
- Node builtins must use `node:` prefix

## Documentation Standard: TSDoc

- This project uses Microsoft TSDoc exclusively
- TSDoc config: `tsdoc.json` extends `@microsoft/api-extractor`
- Validated by: `eslint-plugin-tsdoc` with `tsdoc/syntax: 'error'`
- Reference: `docs/documentation-standards.md`
- Every public function: `@param`, `@returns`, `@throws`, `@example`

## ESLint Configuration (9 Plugins)

- `typescript-eslint` — strict type-checked rules
- `eslint-plugin-tsdoc` — TSDoc syntax enforcement
- `eslint-plugin-playwright` — Playwright best practices
- `eslint-plugin-security` — security vulnerability detection
- `@microsoft/eslint-plugin-sdl` — Microsoft SDL compliance
- `eslint-plugin-sonarjs` — code smell detection
- `eslint-plugin-n` — Node.js best practices
- `eslint-plugin-promise` — async/Promise patterns
- `eslint-plugin-import-x` + `eslint-plugin-unicorn` — import hygiene & modernization

## Testing Standards

- Unit tests: Vitest, hermetic (no network, no SAP system)
- Integration tests: Playwright against SAP demo apps
- All integration tests must use `test.step()` for readability
- NEVER use `page.waitForTimeout()` — use waitForUI5Stable()
- Coverage threshold: 90% statements, 85% branches
- Test files: `*.test.ts` (unit), `*.spec.ts` (integration)
- Use typed mock factories (mock-page.ts, mock-adapter.ts, mock-config.ts)

## Error Handling

- All errors extend `PramanError`
- Include: code (ERR_*), message, attempted, retryable, details, suggestions[]
- ControlError adds: lastKnownSelector, availableControls[], suggestedSelector
- NEVER use raw `throw new Error()` — always use typed error subclass

## Naming Conventions

- Files: kebab-case (e.g., `bridge-error.ts`)
- Interfaces/Types: PascalCase (e.g., `BridgeAdapter`) — no `I` prefix
- Functions/methods: camelCase (e.g., `findControl`)
- Constants: UPPER_CASE (e.g., `MAX_RETRY_COUNT`)
- Error codes: ERR_SCOPE_DESCRIPTION (e.g., `ERR_BRIDGE_TIMEOUT`)
- Booleans: `is/has/can/should` prefix (e.g., `isVisible`, `hasError`)

## Import Order

1. Node built-ins (`node:path`, `node:fs`)
2. External packages (`zod`, `pino`)
3. Internal (`#core/`, `#bridge/`, `#proxy/`)
4. Parent (`../`)
5. Sibling (`./`)

## Commit Messages

- Conventional Commits: `feat(scope): description`
- Scopes: core, config, errors, logging, bridge, adapter, proxy, fixtures, auth, ai, intents, vocabulary, fe, reporters, cli, docs, ci, deps, release

## Build Output (Dual ESM + CJS)

- **ESM**: `dist/*.js` + `dist/*.d.ts` (primary)
- **CJS**: `dist/*.cjs` + `dist/*.d.cts` (Node.js compatibility)
- Built by tsup with `format: ['esm', 'cjs']`, `cjsInterop: true`, `shims: true`
- Validated by `@arethetypeswrong/cli` (attw)
- 6 sub-path exports: `.`, `./ai`, `./intents`, `./vocabulary`, `./fe`, `./reporters`

## Cross-Platform Requirements

- Supported OS: Windows 10/11, macOS, Linux (Ubuntu/Debian)
- Always use `node:path` methods — never hardcoded `/` or `\`
- Always use `node:fs/promises` for async file operations
- Use `import.meta.url` + `fileURLToPath` for `__dirname` equivalent
- No bash-only npm scripts — use Node.js built-ins (`fs.rmSync`, not `rm -rf`)
- CI runs on 3-OS matrix: ubuntu-latest, windows-latest, macos-latest

## Build & CI

- `npm run lint` — ESLint (0 errors, 0 warnings)
- `npm run typecheck` — tsc --noEmit
- `npm run test:unit` — Vitest (hermetic)
- `npm run build` — tsup (ESM + CJS)
- `npm run check:exports` — attw export validation
- `npm run ci` — lint + typecheck + test:unit + build

## Best Practice Alignment

- **Playwright**: Web-first assertions, fixture DI, project dependencies for auth
- **Microsoft**: TSDoc, API Extractor, SDL security, OTel, SHA-pinned Actions, cross-platform CI
- **Google TS Style**: Readonly config, no barrel re-exports of internals
- **Google SRE**: Exponential backoff + jitter, structured error codes
- **Node.js**: ESM-first with CJS fallback, `node:` prefix, engines field, dual package exports
- **npm**: Dual ESM+CJS via conditional exports, validated with attw
- **Claude/Anthropic**: retryable + suggestions[] on errors, AI envelope
