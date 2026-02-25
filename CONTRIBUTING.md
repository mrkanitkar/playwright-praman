# Contributing to Praman

Thank you for your interest in contributing to Praman — an AI-first SAP UI5
test automation platform for Playwright.

## Development Setup

### Prerequisites

- Node.js 20+ (see `.nvmrc` for exact version)
- npm (ships with Node.js)
- Git

### Getting Started

```bash
git clone https://github.com/mrkanitkar/playwright-praman.git
cd playwright-praman
npm install
npm run ci  # Validates full setup: lint + typecheck + test + build
```

### Key Commands

| Command                      | Purpose                            |
| ---------------------------- | ---------------------------------- |
| `npm run lint`               | ESLint (0 errors, 0 warnings)      |
| `npm run lint:fix`           | Auto-fix lint issues               |
| `npm run typecheck`          | TypeScript type checking           |
| `npm run format`             | Prettier formatting                |
| `npm run test:unit`          | Unit tests (Vitest)                |
| `npm run test:unit:watch`    | Unit tests in watch mode           |
| `npm run test:unit:coverage` | Unit tests with coverage report    |
| `npm run build`              | Production build (tsup, ESM + CJS) |
| `npm run check:exports`      | Validate export map (attw)         |
| `npm run ci`                 | Full CI pipeline locally           |
| `npm run spellcheck`         | Spell check (cspell)               |
| `npm run deadcode`           | Dead code detection (knip)         |

## Architecture

Praman uses a 5-layer architecture. Lower layers NEVER import from
higher layers.

```text
Layer 5: AI            — LLM-powered test generation
Layer 4: Fixtures      — Playwright fixture DI
Layer 3: Typed Proxy   — TypeScript control wrappers
Layer 2: Bridge        — Browser-based control discovery (page.evaluate)
Layer 1: Core          — Logging, config, errors, utilities
```

**Sub-path exports**: `.`, `./ai`, `./intents`, `./vocabulary`, `./fe`,
`./reporters`

**Path aliases**: Use `#core/*`, `#bridge/*`, `#proxy/*`, `#fixtures/*`
(TypeScript-only, resolved via `vite-tsconfig-paths` in tests).

## Code Standards

### TypeScript Strict Mode

This is a strict TypeScript project. JavaScript files are NOT allowed in
`src/`.

Key compiler settings:

- `strict: true` with `noUncheckedIndexedAccess`
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `exactOptionalPropertyTypes: true` — optional props need explicit
  `undefined`
- ESM only — `import`, never `require`
- Node builtins must use `node:` prefix (e.g., `node:path`, `node:fs`)
- Relative imports must include `.js` extension

### Naming Conventions

| Entity                      | Convention                           | Example               |
| --------------------------- | ------------------------------------ | --------------------- |
| Files                       | kebab-case                           | `method-blacklist.ts` |
| Types, interfaces           | PascalCase                           | `BridgeAdapter`       |
| Functions, methods          | camelCase                            | `filterMethods`       |
| Constants                   | UPPER_CASE                           | `METHOD_BLACKLIST`    |
| No `I` prefix on interfaces | `BridgeAdapter` not `IBridgeAdapter` |                       |

### Module Size

Maximum 300 lines of code per file. Document exceptions when necessary.

### Documentation

This project uses **Microsoft TSDoc** (not JSDoc). Every public function
must have TSDoc with an `@example` tag. Validated by `eslint-plugin-tsdoc`.

### Error Handling

All errors must extend `PramanError` and include: `code`, `attempted`,
`retryable`, `suggestions[]`. Use pino logger — never `console.log`.

### Linting (Zero Tolerance)

11 ESLint plugins enforced with `--max-warnings=0`:

- typescript-eslint (strict type-checked)
- eslint-plugin-tsdoc, eslint-plugin-playwright
- eslint-plugin-security, @microsoft/eslint-plugin-sdl
- eslint-plugin-sonarjs, eslint-plugin-n
- eslint-plugin-promise, eslint-plugin-import-x, eslint-plugin-unicorn
- eslint-plugin-headers (Apache-2.0 `@license` header enforcement)

Target: **0 errors, 0 warnings** in CI.

### Formatting

Prettier with: 100 char width, single quotes, trailing commas, LF line
endings, 2-space indent. Run `npm run format` before committing.

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) enforced
by commitlint:

```text
<type>(<scope>): <subject>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`build`, `ci`, `chore`, `revert`

**Scopes**: `core`, `bridge`, `proxy`, `fixtures`, `auth`, `selectors`,
`matchers`, `modules`, `fe`, `ai`, `intents`, `vocabulary`, `reporters`,
`cli`, `docs`, `ci`, `config`, `errors`, `logging`, `telemetry`, `types`,
`security`

**Limits**: Subject max 72 characters, header max 100 characters.

```text
feat(proxy): add bidirectional type conversion
fix(bridge): handle stale control reference
docs(auth): add Office365 strategy example
test(core): add config validation edge cases
```

## Testing

### Unit Tests

- Framework: **Vitest 4.x** with `describe` / `it` pattern
- File naming: `*.test.ts` in `tests/unit/`
- Hermetic: no network calls, mock bridge interactions
- Use typed mock factories from `tests/helpers/`
- Run: `npm run test:unit`

### Integration Tests

- Framework: **Playwright** with `test.step()` for multi-step flows
- File naming: `*.spec.ts` in `tests/integration/`
- Requires SAP credentials (`.env` file)
- Run: `npm run test:integration`

### Coverage Requirements (Tiered)

| Tier  | Scope                              | Statements | Branches | Functions | Lines |
| ----- | ---------------------------------- | ---------- | -------- | --------- | ----- |
| **1** | Error classes (`src/core/errors/`) | 100%       | 100%     | 100%      | 100%  |
| **2** | Core infrastructure (`src/core/`)  | 95%        | 90%      | 95%       | 95%   |
| **3** | All other modules (global)         | 90%        | 85%      | 90%       | 90%   |

Coverage is enforced **per-file** (`perFile: true`). No single file can
hide behind project averages.

## Cross-Platform

Praman supports Windows 10/11, macOS, and Linux. CI runs on a 3-OS matrix.

- Use `node:path` methods — never hardcoded `/` or `\`
- Use `node:fs/promises` for async file operations
- No bash-only npm scripts — use Node.js built-ins
- Use `.gitattributes` with `* text=auto eol=lf`

## Git Hooks

Husky enforces quality gates locally:

| Hook           | Action                                          |
| -------------- | ----------------------------------------------- |
| **pre-commit** | lint-staged (ESLint + Prettier on staged files) |
| **commit-msg** | commitlint validation                           |
| **pre-push**   | typecheck + unit tests with coverage + build    |

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes following the code standards above
3. Ensure `npm run ci` passes locally
4. Submit a PR with a clear description of what and why
5. Wait for CI checks (3-OS matrix) and code review

### CI Checks

- Lint + Typecheck + Spell check + Dead code detection
- Unit tests on Ubuntu, Windows, and macOS (Node 20, 22, 24)
- Build validation + export map check

## Reporting Issues

- **Bugs**: Open a GitHub issue with steps to reproduce
- **Security vulnerabilities**: Email
  [security@zestest.in](mailto:security@zestest.in) (see
  [SECURITY.md](SECURITY.md))
- **Feature requests**: Open a GitHub issue with use case description

## License

By contributing, you agree that your contributions will be licensed under
the [Apache License 2.0](LICENSE).
