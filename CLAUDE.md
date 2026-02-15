# CLAUDE.md — Claude Code Agent Instructions

## Project: Praman v1.0
AI-First SAP UI5 Test Automation Platform for Playwright.

## Architecture (read plan.md for full details)
- Single npm package with sub-path exports
- 5-layer: Core Infrastructure → Bridge Adapters → Typed Proxy → Fixtures → AI
- Ground-up rewrite — NO copy-paste from v2.5.0

## Rules
1. TypeScript strict mode — no `any`, no `as unknown as T` shortcuts
2. Every public function: TSDoc + `@example` tag
3. Every module ≤ 300 LOC (document exceptions)
4. Every error: `extends PramanError`, includes `code`, `attempted`, `retryable`, `suggestions[]`
5. No `console.log` — use pino: `import { logger } from '#core/logging';`
6. No `page.waitForTimeout()` — banned (Principle 8)
7. Unit tests: hermetic, use Vitest, mock bridge interactions
8. Config is `Readonly<PramanConfig>` — never mutate
9. Imports: use `#core/*`, `#bridge/*`, `#proxy/*` path aliases
10. Files: kebab-case. Types: PascalCase. Functions: camelCase. Constants: UPPER_CASE.

## When Writing Tests
- Use `describe` / `it` pattern
- Use `test.step()` for multi-step integration tests
- Mock bridge with typed test doubles for unit tests
- Coverage ≥ 90% statements
- Name test files: `*.test.ts` (unit) or `*.spec.ts` (integration)

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

## Commands
- `npm run lint` — ESLint (0 errors, 0 warnings)
- `npm run typecheck` — tsc --noEmit
- `npm run test:unit` — Vitest
- `npm run build` — tsup
- `npm run ci` — lint + typecheck + test:unit + build
