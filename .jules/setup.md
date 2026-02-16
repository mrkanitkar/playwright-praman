# Jules Agent Instructions

## Project: Praman v1.0

AI-First SAP UI5 Test Automation Platform for Playwright.
Single npm package `playwright-praman` with sub-path exports.

## Build Output (Dual ESM + CJS)

- **ESM**: `dist/*.js` + `dist/*.d.ts` (primary)
- **CJS**: `dist/*.cjs` + `dist/*.d.cts` (Node.js compatibility)
- Built by tsup: `format: ['esm', 'cjs']`, `cjsInterop: true`, `shims: true`
- Validated by `@arethetypeswrong/cli` (attw)
- 6 sub-path exports: `.`, `./ai`, `./intents`, `./vocabulary`, `./fe`, `./reporters`

## Cross-Platform Requirements

- Supported OS: Windows 10/11, macOS, Linux (Ubuntu/Debian)
- Always use `node:path` methods — never hardcoded `/` or `\`
- Always use `node:fs/promises` for async file operations
- Use `import.meta.url` + `fileURLToPath` for `__dirname` equivalent
- No bash-only npm scripts — use Node.js built-ins (`fs.rmSync`, not `rm -rf`)
- CI runs on 3-OS matrix: ubuntu-latest, windows-latest, macos-latest

## Workflow

1. Read issue description
2. Read plan.md for architecture context
3. Read CLAUDE.md for coding rules
4. Implement solution following rules
5. Write unit tests (hermetic, Vitest)
6. Run: npm run ci
7. Commit with conventional commit format
8. Create PR with description from issue

## Commands

- `npm run lint` — ESLint (0 errors, 0 warnings)
- `npm run typecheck` — tsc --noEmit
- `npm run test:unit` — Vitest (hermetic)
- `npm run build` — tsup (ESM + CJS)
- `npm run check:exports` — attw export validation
- `npm run ci` — lint + typecheck + test:unit + build

## Key Files

- plan.md — Architecture decisions D1–D29
- setup.md — Tool versions, ESLint config, CI pipeline
- CLAUDE.md — Coding rules (same for all agents)
- AGENTS.md — Universal agent instructions
