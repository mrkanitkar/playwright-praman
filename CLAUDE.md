# CLAUDE.md — Claude Code Agent Instructions

## Project: Praman v1.0

AI-First SAP UI5 Test Automation Platform for Playwright.
Single npm package `playwright-praman` with sub-path exports.
Ground-up rewrite — NO copy-paste from v2.5.0.

## Architecture (read plan.md for full details)

- Single npm package with sub-path exports
- 5-layer: Core Infrastructure → Bridge Adapters → Typed Proxy → Fixtures → AI
- Layer dependency: lower layers NEVER import from higher layers

## Agent Skills

Before starting work, read the appropriate skill file from `skills/playwright-praman-sap-testing/`:

| Task                                              | Skill File                               |
| ------------------------------------------------- | ---------------------------------------- |
| Architecture decisions, module boundaries         | `skills-architect.md`                    |
| TypeScript implementation, proxy, bridge          | `skills-implementer.md`                  |
| Test-driven development (TDD), RED-GREEN-REFACTOR | `skills-tdd.md`                          |
| Unit/integration tests, coverage                  | `skills-tester.md`                       |
| Playwright fixtures, selectors, matchers          | `skills-playwright-expert.md`            |
| SAP UI5 controls, FLP, OData, RecordReplay        | `skills-sap-ui5-expert.md`               |
| SAP Fiori consulting, E2E scenarios, auth testing | `skills-sap-fiori-consultant.md`         |
| OData V2/V4 protocol, Gateway, mock strategies    | `skills-sap-odata-expert.md`             |
| SAP UI5 Web Components, Shadow DOM, hybrid apps   | `skills-sap-ui5-webcomponents-expert.md` |
| PR review, quality gates                          | `skills-reviewer.md`                     |
| CI/CD, security, build, release                   | `skills-security-build.md`               |
| Team overview, collaboration model                | `skills-team-overview.md`                |

For multi-skill tasks, load primary + supporting skill(s). Example:

- Bridge adapter implementation → `skills-tdd.md` + `skills-implementer.md` + `skills-sap-ui5-expert.md`
- Fixture implementation → `skills-tdd.md` + `skills-implementer.md` + `skills-playwright-expert.md`
- Integration tests → `skills-tdd.md` + `skills-tester.md` + `skills-playwright-expert.md` + `skills-sap-ui5-expert.md`
- SAP E2E test design → `skills-sap-fiori-consultant.md` + `skills-sap-odata-expert.md` + `skills-tester.md`
- OData service testing → `skills-sap-odata-expert.md` + `skills-tester.md` + `skills-playwright-expert.md`
- Web Component testing → `skills-sap-ui5-webcomponents-expert.md` + `skills-playwright-expert.md` + `skills-tester.md`
- Hybrid app testing → `skills-sap-ui5-webcomponents-expert.md` + `skills-sap-ui5-expert.md` + `skills-playwright-expert.md`
- WC adapter implementation → `skills-tdd.md` + `skills-implementer.md` + `skills-sap-ui5-webcomponents-expert.md`
- Bug fixes → `skills-tdd.md` + `skills-implementer.md`

## Rules

1. TypeScript strict mode — no `any`, no `as unknown as T` shortcuts
2. Every public function: TSDoc + `@example` tag (TSDoc only, NOT JSDoc)
3. Every module ≤ 300 LOC (document exceptions)
4. Every error: `extends PramanError`, includes `code`, `attempted`, `retryable`, `suggestions[]`
5. No `console.log` — use pino: `import { logger } from '#core/logging';`
6. No `page.waitForTimeout()` — banned (Principle 8)
7. Unit tests: hermetic, use Vitest, mock bridge interactions
8. Config is `Readonly<PramanConfig>` — never mutate
9. Imports: use `#core/*`, `#bridge/*`, `#proxy/*` path aliases
10. Files: kebab-case. Types: PascalCase. Functions: camelCase. Constants: UPPER_CASE.
11. All relative imports must include `.js` extension
12. Node builtins must use `node:` prefix (e.g., `node:path`, `node:fs`)
13. ESM only — `import`, never `require`
14. No `I` prefix on interfaces — `BridgeAdapter` not `IBridgeAdapter`

## LSP Workflow Rules

- Before modifying any function you didn't write: use goToDefinition first
- Before renaming or changing a signature: use findReferences to assess impact
- Before claiming a change is complete: check LSP diagnostics for errors
- Use hover to read TSDoc before calling unfamiliar functions
- Use documentSymbol to understand file structure instead of reading entire files
- Prefer LSP operations over grep/glob for navigating code — they're faster and semantic

## Documentation Standard: TSDoc

- This project uses **Microsoft TSDoc exclusively** — NOT JSDoc
- TSDoc config: `tsdoc.json` (extends `@microsoft/api-extractor/extends/tsdoc-base.json`)
- Validated by: `eslint-plugin-tsdoc` with `tsdoc/syntax: 'error'`
- Custom tags: `@intent`, `@guarantee`, `@capability`, `@recipe`, `@ai`, `@aiContext`, `@sapModule`, `@businessContext`
- Reference: `docs/documentation-standards.md`

## ESLint (10 Plugins — Zero Tolerance)

- typescript-eslint (strict type-checked), eslint-plugin-tsdoc, eslint-plugin-playwright
- eslint-plugin-security, @microsoft/eslint-plugin-sdl, eslint-plugin-sonarjs
- eslint-plugin-n, eslint-plugin-promise, eslint-plugin-import-x, eslint-plugin-unicorn
- Target: 0 errors, 0 warnings

## When Writing Tests

- Use `describe` / `it` pattern
- Use `test.step()` for multi-step integration tests
- Mock bridge with typed test doubles for unit tests
- Name test files: `*.test.ts` (unit) or `*.spec.ts` (integration)
- Use typed mock factories from `tests/helpers/`

### Coverage Strategy (Tiered — Google/Microsoft Best Practice)

| Tier       | Scope                                          | Statements | Branches | Functions | Lines |
| ---------- | ---------------------------------------------- | ---------- | -------- | --------- | ----- |
| **Tier 1** | Error classes, public API (`src/core/errors/`) | 100%       | 100%     | 100%      | 100%  |
| **Tier 2** | Core infrastructure (`src/core/`)              | 95%        | 90%      | 95%       | 95%   |
| **Tier 3** | All other modules (global)                     | 90%        | 85%      | 90%       | 90%   |

- **Tool**: `@vitest/coverage-v8` (V8 engine, AST-based remapping — same accuracy as Istanbul)
- **Per-file enforcement**: `perFile: true` — no single file can hide behind project averages
- **Reporters**: text, lcov, json-summary, json, html — `json` enables CI PR comments
- **Pre-push hook**: `npm run test:unit -- --coverage` runs on every push
- **Watermarks**: Yellow 80-95%, Green 95%+ (visible in HTML reports)

## When Writing Errors

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
  lastKnownSelector: previousSelector,
  availableControls: discoveredControls,
  suggestedSelector: bestMatch,
});
```

## Build Output (Dual ESM + CJS)

- **ESM**: `dist/*.js` + `dist/*.d.ts` (primary)
- **CJS**: `dist/*.cjs` + `dist/*.d.cts` (Node.js compatibility)
- Built by tsup with `format: ['esm', 'cjs']`, `cjsInterop: true`, `shims: true`
- Validated by `@arethetypeswrong/cli` (attw) — every export must resolve correctly
- 6 sub-path exports: `.`, `./ai`, `./intents`, `./vocabulary`, `./fe`, `./reporters`

## Cross-Platform Requirements

- **Supported OS**: Windows 10/11, macOS, Linux (Ubuntu/Debian)
- Always use `node:path` methods — never hardcoded `/` or `\` separators
- Always use `node:fs/promises` for async file operations
- Use `import.meta.url` + `fileURLToPath` for `__dirname` equivalent (see `src/core/compat/path-helpers.ts`)
- No bash-only npm scripts — use Node.js built-ins (`fs.rmSync`, not `rm -rf`)
- Use `.gitattributes` with `* text=auto eol=lf` for consistent line endings
- CI runs on 3-OS matrix: ubuntu-latest, windows-latest, macos-latest

## Supported IDEs & AI Agents

| IDE / Agent           | Config Location                                                              |
| --------------------- | ---------------------------------------------------------------------------- |
| VS Code + Copilot     | `.github/copilot-instructions.md`, `.vscode/`                                |
| JetBrains / IntelliJ  | `.idea/runConfigurations/`, `.idea/codeStyles/`, `.idea/inspectionProfiles/` |
| Cursor                | `.cursor/rules/praman.mdc`, `.cursor/rules/tests.mdc`                        |
| Google Antigravity    | `.antigravity/rules.md`                                                      |
| Claude Code           | `CLAUDE.md` (this file)                                                      |
| OpenAI Codex / Jules  | `AGENTS.md`, `.jules/setup.md`                                               |
| Copilot Coding Agents | `.github/agents/` (Playwright MCP)                                           |

## Commands

- `npm run lint` — ESLint (0 errors, 0 warnings)
- `npm run typecheck` — tsc --noEmit
- `npm run test:unit` — Vitest
- `npm run build` — tsup (ESM + CJS)
- `npm run check:exports` — attw export validation
- `npm run ci` — lint + typecheck + test:unit + build

## Best Practice Alignment

- **Playwright**: Web-first assertions, fixture DI, project dependencies for auth, `test.step()`
- **Microsoft**: TSDoc, API Extractor, SDL security, OTel, SHA-pinned Actions, cross-platform CI
- **Google TS Style**: `Readonly<>` config, no barrel re-exports of internals
- **Google SRE**: Exponential backoff + jitter, structured error codes
- **Google Testing**: Tiered coverage (100% errors, 95% core, 90% global), per-file enforcement
- **Node.js**: ESM-first with CJS fallback, `node:` prefix, engines field, files field, dual package exports
- **Claude/Anthropic**: `retryable` + `suggestions[]` on errors, AI response envelope, checkpoint serialization
- **npm**: Dual ESM+CJS via conditional exports, validated with attw
