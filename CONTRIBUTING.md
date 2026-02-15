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

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
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
