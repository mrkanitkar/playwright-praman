# Contributing to Praman

Thank you for your interest in contributing to Praman!

## Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env` and fill in credentials
4. Run `npm run ci` to verify your setup

## Code Standards

All code must follow the rules in [CLAUDE.md](CLAUDE.md):

- TypeScript strict mode, no `any`
- ESM only (`import`, not `require`)
- All public APIs MUST have TSDoc with `@example`
- Use pino logger, NEVER `console.log`
- Module size ≤ 300 LOC (documented exceptions allowed)
- All errors extend `PramanError`

### ⚠️ Strict TypeScript Project

**JavaScript files are NOT allowed in `src/` directory.**

This is enforced by pre-commit and pre-push hooks. Any attempt to commit `.js`, `.jsx`, `.mjs`, or `.cjs` files to `src/` will be automatically rejected.

**Allowed locations for JavaScript:**

- Configuration files in project root (e.g., `eslint.config.mjs`)
- Build output in `dist/` (generated)
- Test fixtures (when absolutely necessary)

**Why:** Praman is a strict TypeScript project. All source code must be TypeScript to ensure type safety, better tooling support, and adherence to architectural principles.

## Cross-Platform Development

Praman supports Windows 10/11, macOS, and Linux. All code must work on all three platforms.

### Path Handling

- Always use `node:path` methods (`path.join`, `path.resolve`, `path.sep`) — **never** string concatenation with `/` or `\`
- Always use `node:fs/promises` for async file operations
- Use `import.meta.url` + `fileURLToPath` from `node:url` for `__dirname` equivalent
- Use `os.homedir()` for user home directory — never `~` expansion
- Use `os.tmpdir()` for temp directory — returns `%TEMP%` on Windows, `/tmp` on Unix
- For user app data: `process.env.LOCALAPPDATA` or `process.env.APPDATA` on Windows, XDG paths on Linux

### npm Scripts

- No bash-only commands (`rm -rf`, `grep`, `sed`) — use Node.js built-ins
- Use `node:fs` `rmSync({recursive: true, force: true})` for cross-platform cleanup
- Scripts must be written in TypeScript (`.ts` executed via `tsx`) — not bash (`.sh`)

### Dual ESM + CJS Build

- The package ships both ESM (`.js`) and CJS (`.cjs`) formats
- Run `npm run check:exports` after build to validate the export map via `attw`
- Test both formats: CJS and ESM smoke tests are in `tests/unit/core/`

### Supported IDEs

VS Code (primary), JetBrains (WebStorm/IntelliJ), Cursor, Google Antigravity. See respective config directories (`.vscode/`, `.idea/`, `.cursor/`, `.antigravity/`).

### Supported AI Agents

GitHub Copilot, Claude Code, Google Jules, OpenAI Codex, Cursor AI, Google Antigravity Agent, GitHub Copilot Coding Agents. See `CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`, `.github/agents/`.

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(proxy): add bidirectional conversion
fix(bridge): handle stale control reference
docs(auth): add Office365 strategy example
test(core): add config validation edge cases
```

**Scopes**: core, bridge, proxy, fixtures, auth, selectors, matchers, modules, fe, ai, intents, vocabulary, reporters, cli, docs, ci, config, errors, logging, telemetry, types, security

## Testing

- Unit tests: `npm run test:unit` (Vitest, hermetic — no network)
- Integration tests: `npm run test:integration` (Playwright, requires SAP credentials)
- Coverage threshold: 90% statements

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes following the code standards
3. Ensure `npm run ci` passes locally
4. Submit a PR with a clear description
5. Wait for CI checks and code review

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
