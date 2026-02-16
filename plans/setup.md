# Praman v1.0 — Workspace Setup & Tooling Guide

## Complete Developer Environment, CI/CD, and AI-First Configuration

| Property            | Value                                    |
| ------------------- | ---------------------------------------- |
| **Document ID**     | PRAMAN-SETUP-001                         |
| **Version**         | 1.0.0                                    |
| **Parent Document** | PRAMAN-ARCH-PLAN-001 (plan.md v2.0.0)    |
| **Status**          | 🟢 Baseline Complete — Phase 0 Delivered |
| **Created**         | 2025-02-15                               |

---

## Table of Contents

1. [Prerequisites & System Requirements](#1-prerequisites--system-requirements)
2. [Package Inventory — Complete Dependency Map](#2-package-inventory--complete-dependency-map)
3. [Workspace Configuration Files](#3-workspace-configuration-files)
4. [ESLint Configuration — Full Ruleset](#4-eslint-configuration--full-ruleset)
5. [Git Hooks & Check-in Rules](#5-git-hooks--check-in-rules)
6. [GitHub Actions — CI/CD Pipeline](#6-github-actions--cicd-pipeline)
7. [AI Agent Configuration — AI-First Development](#7-ai-agent-configuration--ai-first-development)
8. [VS Code Workspace Settings](#8-vs-code-workspace-settings)
9. [Documentation Enforcement](#9-documentation-enforcement)
10. [Security Configuration](#10-security-configuration)
11. [Scaffold Bootstrap Script](#11-scaffold-bootstrap-script)

---

## 1. Prerequisites & System Requirements

### 1.1 Required System Tools

| Tool                    | Minimum Version | Recommended                | Purpose                                  | Install                       |
| ----------------------- | --------------- | -------------------------- | ---------------------------------------- | ----------------------------- |
| **Node.js**             | 20.0.0          | 22.x LTS (or 24.x Current) | Runtime — ESM, `node:test`, native fetch | `nvm install 22`              |
| **npm**                 | 10.0.0          | 11.x (ships with Node 24+) | Package manager                          | Ships with Node               |
| **Git**                 | 2.40.0          | 2.47+                      | Version control, hooks                   | `brew install git`            |
| **VS Code**             | 1.96.0          | Latest                     | IDE                                      | https://code.visualstudio.com |
| **Playwright browsers** | —               | Match @playwright/test     | Chromium, Firefox, WebKit                | `npx playwright install`      |
| **Docker** (optional)   | 24.0+           | 27.x                       | CI parity, local container testing       | `brew install docker`         |

### 1.2 Required VS Code Extensions

| Extension           | ID                                      | Purpose                      | Required    |
| ------------------- | --------------------------------------- | ---------------------------- | ----------- |
| ESLint              | `dbaeumer.vscode-eslint`                | Lint feedback in editor      | Yes         |
| Prettier            | `esbenp.prettier-vscode`                | Auto-format on save          | Yes         |
| GitHub Copilot      | `GitHub.copilot`                        | AI code generation           | Yes         |
| GitHub Copilot Chat | `GitHub.copilot-chat`                   | AI chat, `/fix`, `/tests`    | Yes         |
| Playwright Test     | `ms-playwright.playwright`              | Test runner UI, debugging    | Yes         |
| TypeScript Nightly  | `ms-vscode.vscode-typescript-next`      | Latest TS language features  | Recommended |
| Error Lens          | `usernamehw.errorlens`                  | Inline error/warning display | Recommended |
| Code Spell Checker  | `streetsidesoftware.code-spell-checker` | Spelling in code/comments    | Recommended |
| GitLens             | `eamodio.gitlens`                       | Git blame, history           | Recommended |
| Markdown All in One | `yzhang.markdown-all-in-one`            | Markdown editing, TOC        | Recommended |
| markdownlint        | `DavidAnson.vscode-markdownlint`        | Markdown lint in editor      | Recommended |
| Todo Tree           | `Gruntfuggly.todo-tree`                 | Track TODOs, FIXMEs          | Recommended |

### 1.3 AI Agent Tools (Development Agents)

These are the AI coding agents that will write 100% of the code:

| Agent                        | Purpose                                                   | Configuration Needed              |
| ---------------------------- | --------------------------------------------------------- | --------------------------------- |
| **GitHub Copilot**           | Primary in-editor code generation, `/fix`, `/tests`, chat | `.github/copilot-instructions.md` |
| **Claude Code** (Anthropic)  | Autonomous multi-file implementation, deep refactors      | `CLAUDE.md` at repo root          |
| **Google Jules**             | Async background tasks, issue-to-PR automation            | `.jules/setup.md` (if supported)  |
| **GitHub Copilot Workspace** | Issue → plan → PR workflow                                | Native GitHub integration         |

---

## 2. Package Inventory — Complete Dependency Map

### 2.1 Production Dependencies

```jsonc
{
  "dependencies": {
    "dotenv": "^17.3.1", // .env file loading for SAP credentials
    "pino": "^10.3.1", // Structured JSON logging (always-on)
    "zod": "^4.3.6", // Runtime validation at boundaries (D6, D7)
    "zod-to-json-schema": "^3.25.1", // Config JSON Schema for IDE IntelliSense
  },
}
```

### 2.2 Peer Dependencies

```jsonc
{
  "peerDependencies": {
    "@playwright/test": ">=1.50.0 <2.0.0", // Test framework — user installs (D14)
  },
}
```

### 2.3 Optional Dependencies (User Opt-In)

```jsonc
{
  "optionalDependencies": {
    "openai": "^6.22.0", // AI provider for agentic fixture (D9)
    "@opentelemetry/api": "^1.9.0", // Distributed tracing (D5 L3)
    "@opentelemetry/sdk-node": "^0.212.0", // OTel SDK — zero overhead when not installed
  },
}
```

### 2.4 Development Dependencies — Complete List

```jsonc
{
  "devDependencies": {
    // ── Build ──────────────────────────────────────────────────────────────
    "typescript": "^5.9.3", // Language compiler — strict mode
    "tsup": "^8.5.1", // Multi-entry ESM build (esbuild)
    "tsx": "4.21.0", // TS execution for scripts (generate-*, etc.)

    // ── Testing ────────────────────────────────────────────────────────────
    "vitest": "^4.0.18", // Unit tests — fast, TS-native
    "@vitest/coverage-v8": "^4.0.18", // Coverage via V8 (tiered: 100%/95%/90%)
    "@vitest/ui": "^4.0.18", // Browser UI for test results
    "@playwright/test": "^1.58.2", // Integration tests (also peer dep)

    // ── Linting (10 plugins — zero tolerance) ────────────────────────────
    "eslint": "9.39.2", // ESLint 9 — flat config
    "typescript-eslint": "8.55.0", // TS-aware ESLint parser + rules
    "eslint-plugin-security": "3.0.1", // OWASP security static analysis
    "eslint-plugin-tsdoc": "0.5.0", // Microsoft TSDoc syntax enforcement
    "eslint-plugin-import-x": "4.16.1", // Import order, no circular deps
    "eslint-plugin-unicorn": "63.0.0", // Modern JS/TS best practices
    "eslint-plugin-n": "17.24.0", // Node.js best practices
    "eslint-plugin-promise": "7.2.1", // Promise/async best practices
    "eslint-plugin-sonarjs": "3.0.7", // SonarJS code quality rules
    "@microsoft/eslint-plugin-sdl": "1.1.0", // Microsoft SDL security
    "eslint-plugin-playwright": "2.5.1", // Playwright test best practices

    // ── Formatting ─────────────────────────────────────────────────────────
    "prettier": "^3.8.1", // Code formatter
    "eslint-config-prettier": "10.1.8", // Disable ESLint rules that conflict with Prettier

    // ── Git Hooks & Commit Quality ─────────────────────────────────────────
    "husky": "^9.1.7", // Git hooks manager
    "lint-staged": "^16.2.7", // Run linters on staged files only
    "@commitlint/cli": "^20.4.1", // Conventional Commits enforcement
    "@commitlint/config-conventional": "^20.4.1", // Conventional Commits preset

    // ── Documentation ──────────────────────────────────────────────────────
    "typedoc": "^0.28.17", // API docs from TSDoc
    "typedoc-plugin-markdown": "4.10.0", // Markdown output for Docusaurus
    // Note: @docusaurus/core and @docusaurus/preset-classic are in docs/package.json (separate workspace)
    "markdownlint-cli2": "^0.20.0", // Markdown lint CLI

    // ── Code Quality ───────────────────────────────────────────────────────
    "knip": "^5.83.1", // Dead code/dependency detection
    "cspell": "^9.6.4", // Spell checking in code and docs
    "@size-limit/file": "^12.0.0", // Bundle size monitoring
    "size-limit": "^12.0.0", // Bundle size runner

    // ── Logging (dev only) ─────────────────────────────────────────────────
    "pino-pretty": "^13.1.3", // Human-readable log output (dev only — BP-NODE)

    // ── Security & Validation ─────────────────────────────────────────────
    "@cyclonedx/cyclonedx-npm": "4.1.2", // SBOM generation (CycloneDX)
    "@arethetypeswrong/cli": "0.18.2", // Export map validation (attw)
    "@microsoft/api-extractor": "7.56.3", // API surface extraction + TSDoc base

    // ── Utilities ─────────────────────────────────────────────────────────
    "glob": "13.0.3", // File pattern matching for scripts

    // ── Release ────────────────────────────────────────────────────────────
    "release-please": "17.2.1", // Automated releases from conventional commits (BP-GOOGLE)
  },
}
```

### 2.5 Package Count Summary

| Category          | Count      | Total Size Impact         |
| ----------------- | ---------- | ------------------------- |
| Production deps   | 4          | ~2 MB                     |
| Peer deps         | 1          | ~0 (user provides)        |
| Optional deps     | 3          | ~0 (only if user opts in) |
| Dev deps          | 34         | ~150 MB (not shipped)     |
| **Total in dist** | **4 deps** | **< 500 KB**              |

---

## 3. Workspace Configuration Files

### 3.1 Configuration File Map

Every config file in the repo root, with its purpose:

```
playwright-praman/
├── package.json                    # Package metadata, scripts, deps, exports
├── tsconfig.json                   # TypeScript — strict mode, ESM, node16
├── tsconfig.build.json             # TypeScript — build-only (excludes tests)
├── tsup.config.ts                  # Build — multi-entry ESM output
├── eslint.config.mjs               # ESLint 9 — flat config, 10 lint plugins
├── .prettierrc.json                # Prettier — formatting rules
├── .prettierignore                 # Prettier — skip dist/, coverage/, etc.
├── vitest.config.ts                # Vitest — unit test config
├── playwright.config.ts            # Playwright — integration test config
├── .commitlintrc.json              # Commitlint — conventional commits
├── .husky/
│   ├── pre-commit                  # lint-staged (lint + format + typecheck)
│   ├── commit-msg                  # commitlint
│   └── pre-push                    # full test suite
├── .lintstagedrc.json              # lint-staged — per-extension commands
├── .size-limit.json                # Bundle size limits
├── .cspell.json                    # Spell checker dictionary + config
├── .markdownlint.jsonc             # Markdown lint rules
├── knip.config.ts                  # Dead code detection config
├── .env.example                    # SAP credential template
├── .gitignore                      # Standard ignores
├── .gitattributes                  # Line endings, diff drivers
├── .editorconfig                   # Cross-editor formatting baseline
├── .nvmrc                          # Node version for nvm users
├── .node-version                   # Node version for fnm/asdf users
├── .npmrc                          # npm config (save-exact, engine-strict)
└── CLAUDE.md                       # Claude Code agent instructions
```

### 3.2 tsconfig.json

```jsonc
{
  "compilerOptions": {
    // ── Strictness (BP-GOOGLE: maximum type safety) ────────────────────────
    "strict": true,
    "noUncheckedIndexedAccess": true, // Array/record access returns T | undefined
    "noImplicitOverride": true, // Override keyword required
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true, // Distinguish undefined from missing

    // ── Module System (BP-MICROSOFT: ESM + node16) ─────────────────────────
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16", // Correct for ESM + Node.js (BP-TS)
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true, // Required for esbuild/tsup
    "verbatimModuleSyntax": true, // Explicit import type

    // ── Output ─────────────────────────────────────────────────────────────
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true, // Speed — check own types only

    // ── Paths ──────────────────────────────────────────────────────────────
    "baseUrl": ".",
    "paths": {
      "#core/*": ["src/core/*"],
      "#bridge/*": ["src/bridge/*"],
      "#proxy/*": ["src/proxy/*"],
      "#fixtures/*": ["src/fixtures/*"],
    },
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "docs", "scripts"],
}
```

### 3.3 tsconfig.build.json

```jsonc
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "docs", "scripts", "tests", "**/*.test.ts", "**/*.spec.ts"],
}
```

### 3.4 tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'ai/index': 'src/ai/index.ts',
    'intents/index': 'src/intents/index.ts',
    'vocabulary/index': 'src/vocabulary/index.ts',
    'fe/index': 'src/fe/index.ts',
    'reporters/index': 'src/reporters/index.ts',
  },
  format: ['esm', 'cjs'],
  tsconfig: 'tsconfig.build.json',
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  splitting: true, // Code splitting for shared chunks
  treeshake: true, // Remove dead code
  cjsInterop: true, // CJS interop for dual format
  shims: true, // Shims for import.meta.url in CJS
  external: [
    '@playwright/test', // Peer dep — user provides
    'openai', // Optional
    '@opentelemetry/api', // Optional
    '@opentelemetry/sdk-node', // Optional
  ],
});
```

### 3.5 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/integration/**', 'tests/e2e/**'],
    globals: false, // Explicit imports — no magic globals
    environment: 'node',
    coverage: {
      provider: 'v8', // V8 engine — AST-based remapping (Vitest 4.x)
      reporter: ['text', 'lcov', 'json-summary', 'json', 'html'],
      reportOnFailure: true, // Generate report even when tests fail
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/index.ts', // Barrel files
        'src/**/*.d.ts',
        'src/cli/**', // CLI tested separately
        'src/bridge/browser-scripts/**', // Tested via integration
      ],
      // ── Tiered coverage thresholds (Google/Microsoft best practice) ──────
      // Phase 0: Global thresholds at 0 in actual config (scaffold, no real code).
      // Phase 1+: Enforced per-file with glob-based tiers:
      //   Tier 1 (100%): Error classes, public API — zero tolerance
      //   Tier 2 (95%):  Core infrastructure — config, logging, utils
      //   Tier 3 (90%):  All other modules — Google "exemplary" level
      thresholds: {
        statements: 90, // Global minimum
        branches: 85,
        functions: 90,
        lines: 90,
        perFile: true, // No file can hide behind project average
        // Glob-based overrides (Phase 1+):
        // 'src/core/errors/**/*.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        // 'src/core/**/*.ts': { statements: 95, branches: 90, functions: 95, lines: 95 },
      },
      watermarks: {
        statements: [80, 95], // Yellow 80-95%, Green 95%+
        branches: [75, 90],
        functions: [80, 95],
        lines: [80, 95],
      },
    },
    typecheck: {
      enabled: true, // Type-check test files too
    },
  },
});
```

### 3.6 .prettierrc.json

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true
}
```

### 3.7 .prettierignore

```
dist/
coverage/
node_modules/
docs/.docusaurus/
docs/build/
*.json
!.prettierrc.json
!.commitlintrc.json
CHANGELOG.md
```

### 3.8 .editorconfig

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[Makefile]
indent_style = tab
```

### 3.9 .nvmrc / .node-version

```
24
```

### 3.10 .npmrc

```ini
save-exact=true
engine-strict=true
fund=false
audit=true
```

> **`save-exact=true`** — Pins exact versions (no `^`). Ensures reproducible installs across all AI agents and CI. Prevents phantom version drift.  
> **`engine-strict=true`** — Fails `npm install` if Node version doesn't match `engines` field.

### 3.11 .gitignore

```gitignore
# Build output
dist/
*.tsbuildinfo

# Dependencies
node_modules/

# Test output
coverage/
test-results/
playwright-report/
blob-report/
.auth/

# IDE
.vscode/settings.json
.vscode/launch.json
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Docs build
docs/.docusaurus/
docs/build/
docs/api/

# Generated
skills/playwright-praman-sap-testing/SKILL.md
src/proxy/typed/*.generated.ts
*.sbom.json
```

### 3.12 .gitattributes

```
* text=auto eol=lf
*.ts linguist-language=TypeScript
*.md diff=markdown
*.json diff=json
```

---

## 4. ESLint Configuration — Full Ruleset

### 4.1 eslint.config.mjs

```javascript
// eslint.config.mjs — ESLint 9 flat config
// Single source of truth for all lint rules. No .eslintrc files.
// 10 plugins: TypeScript, TSDoc, Playwright, Security, SDL, SonarJS, Node, Promise, Import-X, Unicorn
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import tsdoc from 'eslint-plugin-tsdoc';
import importX from 'eslint-plugin-import-x';
import unicorn from 'eslint-plugin-unicorn';
import playwright from 'eslint-plugin-playwright';
import nodePlugin from 'eslint-plugin-n';
import promisePlugin from 'eslint-plugin-promise';
import sonarjs from 'eslint-plugin-sonarjs';
import microsoftSdl from '@microsoft/eslint-plugin-sdl';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  // ── Global ignores ───────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'docs/**',
      '*.config.{js,mjs,ts}',
      'scripts/**',
    ],
  },

  // ── Base ESLint recommended ──────────────────────────────────────────────
  eslint.configs.recommended,

  // ── TypeScript strict + stylistic ────────────────────────────────────────
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true, // Auto-detect tsconfig
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Security (OWASP + Microsoft SDL) ─────────────────────────────────────
  {
    plugins: { security, '@microsoft/sdl': microsoftSdl },
    rules: {
      'security/detect-eval-with-expression': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-unsafe-regex': 'error',
      '@microsoft/sdl/no-insecure-url': 'error',
      '@microsoft/sdl/no-document-write': 'error',
      '@microsoft/sdl/no-inner-html': 'error',
    },
  },

  // ── Node.js best practices ──────────────────────────────────────────────
  nodePlugin.configs['flat/recommended'],

  // ── Promise best practices ──────────────────────────────────────────────
  promisePlugin.configs['flat/recommended'],

  // ── SonarJS quality rules ───────────────────────────────────────────────
  sonarjs.configs.recommended,

  // ── TSDoc enforcement (Microsoft TypeScript Documentation Standard) ─────
  {
    plugins: { tsdoc },
    rules: {
      'tsdoc/syntax': 'error', // Validate TSDoc syntax (custom tags in tsdoc.json)
    },
  },

  // ── Import rules (BP-GOOGLE: no circular deps, ordered imports) ──────────
  {
    plugins: { 'import-x': importX },
    rules: {
      'import-x/no-cycle': 'error', // No circular dependencies
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-duplicates': 'error',
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
    },
  },

  // ── Unicorn (modern JS/TS best practices) ────────────────────────────────
  {
    plugins: { unicorn },
    rules: {
      'unicorn/prefer-node-protocol': 'error', // import node:fs not fs
      'unicorn/no-array-for-each': 'error', // for-of over .forEach()
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/no-abusive-eslint-disable': 'error', // Must specify rule in disable
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/no-null': 'off', // null is valid in SAP APIs
      'unicorn/prevent-abbreviations': 'off', // Allow btn, cfg, etc.
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
    },
  },

  // ── Praman-specific rules ────────────────────────────────────────────────
  {
    rules: {
      // ── No `any` escape hatches (Quality Gate) ───────────────────────────
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',

      // ── Immutable patterns (BP-GOOGLE: readonly) ─────────────────────────
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off', // Too noisy for Playwright

      // ── Async safety ─────────────────────────────────────────────────────
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',

      // ── Code quality ─────────────────────────────────────────────────────
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
        { selector: 'function', format: ['camelCase'] },
        { selector: 'method', format: ['camelCase'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
      ],
      'no-console': 'error', // Use pino logger, never console.*
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
    },
  },

  // ── Module size warning (D27: ≤300 LOC guideline) ────────────────────────
  {
    rules: {
      'max-lines': [
        'warn',
        {
          max: 300,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
    },
  },

  // ── No page.waitForTimeout() (Principle 8: banned) ───────────────────────
  {
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'page',
          property: 'waitForTimeout',
          message:
            'page.waitForTimeout() is banned (Principle 8). Use waitForUI5Stable() or auto-retry assertions.',
        },
      ],
    },
  },

  // ── Test file overrides ──────────────────────────────────────────────────
  {
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Tests may use any for mocks
      'max-lines': 'off', // Test files can be longer
      'security/detect-object-injection': 'off', // Test data access
      'sonarjs/no-duplicate-string': 'off', // Test strings often repeat
      // Playwright best practices (enforced)
      'playwright/no-wait-for-timeout': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/no-networkidle': 'error',
    },
  },

  // ── Browser-evaluated scripts override ───────────────────────────────────
  {
    files: ['src/bridge/browser-scripts/**/*.ts'],
    rules: {
      'max-lines': 'off', // Browser scripts need inline
      'security/detect-new-buffer': 'off',
      'no-eval': 'off', // D24: new Function() accepted
    },
  },

  // ── Prettier compatibility (must be last) ────────────────────────────────
  prettier,
);
```

### 4.2 ESLint Rule Categories Summary

| Category              | Plugin / Rule Source           | Key Rules                                               | Severity   |
| --------------------- | ------------------------------ | ------------------------------------------------------- | ---------- |
| **TypeScript Safety** | `typescript-eslint`            | `no-explicit-any`, `no-unsafe-*`, `strict-type-checked` | Error      |
| **Security**          | `eslint-plugin-security`       | `detect-eval-with-expression`, `detect-unsafe-regex`    | Error      |
| **Microsoft SDL**     | `@microsoft/eslint-plugin-sdl` | `no-insecure-url`, `no-inner-html`, `no-document-write` | Error      |
| **Documentation**     | `eslint-plugin-tsdoc`          | `tsdoc/syntax` (validates Microsoft TSDoc standard)     | Error      |
| **SonarJS**           | `eslint-plugin-sonarjs`        | `cognitive-complexity`, `no-identical-functions`        | Warn/Error |
| **Node.js**           | `eslint-plugin-n`              | `prefer-promises/fs`, `no-process-exit`                 | Error      |
| **Promise**           | `eslint-plugin-promise`        | `prefer-await-to-then`, `catch-or-return`               | Error      |
| **Playwright**        | `eslint-plugin-playwright`     | `no-wait-for-timeout`, `prefer-web-first-assertions`    | Error      |
| **Import Hygiene**    | `eslint-plugin-import-x`       | `no-cycle`, `order`, `no-duplicates`                    | Error      |
| **Modern JS**         | `eslint-plugin-unicorn`        | `prefer-node-protocol`, `filename-case`                 | Error      |
| **Naming**            | `typescript-eslint`            | `naming-convention` (PascalCase types, camelCase vars)  | Error      |
| **Async**             | `typescript-eslint`            | `no-floating-promises`, `no-misused-promises`           | Error      |
| **Module Size**       | Built-in `max-lines`           | ≤ 300 LOC per file (D27)                                | Warning    |
| **Anti-patterns**     | Built-in                       | `no-console`, `no-eval`, banned `page.waitForTimeout()` | Error      |
| **Formatting**        | `eslint-config-prettier`       | Disables style rules that conflict with Prettier        | —          |

---

## 5. Git Hooks & Check-in Rules

### 5.1 Husky Setup

```bash
# Initialized via: npx husky init
# Creates .husky/ directory with hook scripts
```

### 5.2 .husky/pre-commit

```bash
#!/bin/sh
# Pre-commit: run lint-staged on staged files only
# Fast — only checks files being committed
npx lint-staged
```

### 5.3 .husky/commit-msg

```bash
#!/bin/sh
# Commit message: enforce Conventional Commits format
# Rejects: "fixed stuff", "wip", "update"
# Accepts: "feat(proxy): add bidirectional conversion", "fix(bridge): handle stale control"
npx --no -- commitlint --edit "$1"
```

### 5.4 .husky/pre-push

```bash
#!/bin/bash
# Check for JavaScript files in src/ (strict TypeScript project)
npx tsx scripts/check-no-js-in-src.ts

# Run full validation with coverage
npm run typecheck && npm run test:unit -- --coverage && npm run build
```

### 5.5 .lintstagedrc.json

```json
{
  "*.ts": ["eslint --fix --max-warnings=0", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "*.md": ["markdownlint-cli2"]
}
```

### 5.6 .commitlintrc.json

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"]
    ],
    "scope-enum": [
      1,
      "always",
      [
        "core",
        "bridge",
        "proxy",
        "fixtures",
        "auth",
        "selectors",
        "matchers",
        "modules",
        "fe",
        "ai",
        "intents",
        "vocabulary",
        "reporters",
        "cli",
        "docs",
        "ci",
        "config",
        "errors",
        "logging",
        "telemetry",
        "types",
        "security"
      ]
    ],
    "subject-max-length": [2, "always", 72],
    "body-max-line-length": [2, "always", 200],
    "header-max-length": [2, "always", 100]
  }
}
```

> **Why Conventional Commits?** `release-please` reads commit messages to auto-generate CHANGELOG.md and determine semver bump. `feat:` → minor, `fix:` → patch, `feat!:` / `BREAKING CHANGE:` → major. AI agents (Copilot, Claude Code) are trained on this format and produce valid commits natively.

### 5.7 Check-in Rules Matrix

| Stage          | What Runs                                                                                             | Blocks? | Time   |
| -------------- | ----------------------------------------------------------------------------------------------------- | ------- | ------ |
| **Pre-commit** | ESLint (staged files) + Prettier (staged files) + markdownlint                                        | Yes     | ~3s    |
| **Commit-msg** | commitlint (conventional commits)                                                                     | Yes     | <1s    |
| **Pre-push**   | `tsc --noEmit` + Vitest (unit) + tsup build                                                           | Yes     | ~30s   |
| **CI (push)**  | Full pipeline (lint + typecheck + unit + integration + build + bundle size + spell check + dead code) | Yes     | ~5 min |
| **CI (PR)**    | All of above + coverage delta + doc validation + security audit                                       | Yes     | ~8 min |

---

## 6. GitHub Actions — CI/CD Pipeline

### 6.1 ci.yml — Main CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

# BP-MICROSOFT: minimal permissions
permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  # ── Quality Gates ─────────────────────────────────────────────────────────
  quality:
    name: Lint + Typecheck + Spell
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4 — BP-MICROSOFT: pinned SHA
      - uses: actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e # v4
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npx cspell "src/**/*.ts" "docs/**/*.md" --no-progress
      - run: npx knip # Dead code/dependency detection
      - run: npx markdownlint-cli2 "**/*.md" "#node_modules" "#docs/build"

  # ── Unit Tests ────────────────────────────────────────────────────────────
  unit-tests:
    name: Unit Tests (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    timeout-minutes: 10
    strategy:
      matrix:
        node-version: [20, 22, 24] # Oldest supported, LTS, Current
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
        # Coverage thresholds enforced by vitest.config.ts (tiered: 100%/95%/90%)
        # Fails CI if any per-file threshold is missed
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
        if: always()
        with:
          name: coverage-node-${{ matrix.node-version }}
          path: coverage/

  # ── Build ─────────────────────────────────────────────────────────────────
  build:
    name: Build + Bundle Size
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npx size-limit # Check bundle size (< 500 KB)
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        with:
          name: dist
          path: dist/

  # ── Integration Tests (Playwright) ────────────────────────────────────────
  integration-tests:
    name: Integration Tests (PW ${{ matrix.playwright-version }})
    runs-on: ubuntu-latest
    timeout-minutes: 30
    needs: [quality, build]
    strategy:
      matrix:
        playwright-version: ['1.50.0', '1.58.2'] # Oldest supported + latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm install @playwright/test@${{ matrix.playwright-version }}
      - run: npx playwright install --with-deps chromium
      - run: npm run test:integration
        env:
          SAP_CLOUD_BASE_URL: ${{ secrets.SAP_CLOUD_BASE_URL }}
          SAP_CLOUD_USERNAME: ${{ secrets.SAP_CLOUD_USERNAME }}
          SAP_CLOUD_PASSWORD: ${{ secrets.SAP_CLOUD_PASSWORD }}
          SAP_CLIENT: ${{ secrets.SAP_CLIENT }}
      - uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02
        if: always()
        with:
          name: playwright-report-pw-${{ matrix.playwright-version }}
          path: playwright-report/

  # ── Security Audit ────────────────────────────────────────────────────────
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npx eslint --no-warn-ignored --rule 'security/*:error' src/

  # ── Documentation Validation ──────────────────────────────────────────────
  docs-check:
    name: Documentation Validation
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npx typedoc --validation # Ensure all public APIs have TSDoc + @example
      - run: npm run docs:build -- --no-minify # Docusaurus build check
```

### 6.2 release.yml — Automated Releases

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  id-token: write # npm provenance

jobs:
  release-please:
    name: Release Please
    runs-on: ubuntu-latest
    timeout-minutes: 10
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
    steps:
      - uses: googleapis/release-please-action@a02a34c4d625f9be7cb89f4291f2343dd2a0e1da # v4
        id: release
        with:
          release-type: node

  publish:
    name: Publish to npm
    runs-on: ubuntu-latest
    needs: release-please
    if: ${{ needs.release-please.outputs.release_created }}
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm run generate:sbom # CycloneDX SBOM
      - run: npm publish --provenance # BP-MICROSOFT: npm provenance attestation
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 6.3 docs.yml — Documentation Deploy

```yaml
# .github/workflows/docs.yml
name: Deploy Docs

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'src/**/*.ts' # Rebuild API docs on source changes

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    name: Build & Deploy Docs
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment:
      name: github-pages
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - uses: actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run docs:api # TypeDoc → docs/api/
      - run: npm run generate:skill # SKILL.md from TypeDoc
      - run: npm run docs:build # Docusaurus build
      - uses: actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa # v3
        with:
          path: docs/build
      - uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac553fd0d28 # v4
```

### 6.4 GitHub Actions — Required Secrets

| Secret               | Purpose                              | Where to Set                      |
| -------------------- | ------------------------------------ | --------------------------------- |
| `SAP_CLOUD_BASE_URL` | SAP system URL for integration tests | Repo Settings → Secrets → Actions |
| `SAP_CLOUD_USERNAME` | SAP auth username                    | Repo Settings → Secrets → Actions |
| `SAP_CLOUD_PASSWORD` | SAP auth password                    | Repo Settings → Secrets → Actions |
| `SAP_CLIENT`         | SAP client number                    | Repo Settings → Secrets → Actions |
| `NPM_TOKEN`          | npm publish token                    | Repo Settings → Secrets → Actions |

### 6.5 Branch Protection Rules

Configure in **Settings → Branches → main**:

| Rule                              | Value                                                            |
| --------------------------------- | ---------------------------------------------------------------- |
| Require pull request reviews      | 1 approval (AI agent PRs can be self-approved by human reviewer) |
| Require status checks to pass     | `quality`, `unit-tests`, `build`, `security`, `docs-check`       |
| Require branches to be up to date | Yes                                                              |
| Require conversation resolution   | Yes                                                              |
| Require signed commits            | Recommended                                                      |
| Include administrators            | Yes                                                              |
| Allow force pushes                | No                                                               |
| Allow deletions                   | No                                                               |

---

## 7. AI Agent Configuration — AI-First Development

> **100% of code written by AI agents. Humans review and approve.**

### 7.1 GitHub Copilot — `.github/copilot-instructions.md`

```markdown
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
- Coverage: Tiered thresholds — 100% errors/API, 95% core, 90% global (per-file enforced)

## Error Handling

- All errors extend `PramanError`
- Include: code (ERR\_\*), message, attempted, retryable, details, suggestions[]
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
```

### 7.2 Claude Code — `CLAUDE.md`

````markdown
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
- Coverage: Tiered (100% errors/API, 95% core, 90% global), per-file enforced
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
````

## Commands

- `npm run lint` — ESLint (0 errors, 0 warnings)
- `npm run typecheck` — tsc --noEmit
- `npm run test:unit` — Vitest
- `npm run build` — tsup
- `npm run ci` — lint + typecheck + test:unit + build

## Reference Documents

- Architecture: `docsfor mk/wdi5_analysis/plan.md`
- Setup: `docsfor mk/wdi5_analysis/setup.md`

````

### 7.3 Google Jules — `.jules/setup.md` (if applicable)

```markdown
# Jules Agent Instructions

## Project: Praman v1.0

## Workflow
1. Read issue description
2. Read plan.md for architecture context
3. Read CLAUDE.md for coding rules
4. Implement solution following rules
5. Write unit tests (hermetic, Vitest)
6. Run: npm run ci
7. Commit with conventional commit format
8. Create PR with description from issue

## Key Files
- plan.md — Architecture decisions D1–D29
- setup.md — Tool versions, ESLint config, CI pipeline
- CLAUDE.md — Coding rules (same for all agents)
````

### 7.4 AI Agent Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI-First Development Workflow                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. ISSUE CREATION (Human)                                       │
│     └─ GitHub Issue with acceptance criteria                     │
│                                                                  │
│  2. IMPLEMENTATION (AI Agent)                                    │
│     ├─ GitHub Copilot (in-editor, interactive)                   │
│     ├─ Claude Code (autonomous, multi-file)                      │
│     └─ Google Jules (async, background)                          │
│                                                                  │
│  3. LOCAL QUALITY GATES (Automated)                              │
│     ├─ pre-commit: ESLint + Prettier (staged files)              │
│     ├─ commit-msg: Conventional Commits validation               │
│     └─ pre-push: typecheck + unit tests + build                  │
│                                                                  │
│  4. CI QUALITY GATES (GitHub Actions)                            │
│     ├─ quality: lint + typecheck + spell + dead code             │
│     ├─ unit-tests: Vitest × 3 Node versions                     │
│     ├─ build: tsup + bundle size check                           │
│     ├─ integration-tests: Playwright × 2 PW versions            │
│     ├─ security: npm audit + eslint-plugin-security              │
│     └─ docs-check: TypeDoc validation + Docusaurus build         │
│                                                                  │
│  5. REVIEW (Human)                                               │
│     └─ PR review → approve → merge to main                      │
│                                                                  │
│  6. RELEASE (Automated)                                          │
│     ├─ release-please: changelog + version bump PR               │
│     ├─ npm publish --provenance                                  │
│     ├─ SBOM generation (CycloneDX)                               │
│     └─ Docs deploy (GitHub Pages)                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.5 AI Agent Guardrails

| Guardrail                    | Enforcement | What It Catches                       |
| ---------------------------- | ----------- | ------------------------------------- |
| ESLint `no-explicit-any`     | Error       | AI agents using `any` shortcuts       |
| ESLint `no-console`          | Error       | AI agents using `console.log`         |
| ESLint `no-cycle` (import-x) | Error       | AI agents creating circular imports   |
| ESLint `max-lines: 300`      | Warning     | AI agents generating monolithic files |
| commitlint                   | Error       | Malformed commit messages             |
| Coverage ≥ 90%               | Blocking CI | AI agents skipping tests              |
| TypeDoc `--validation`       | Blocking CI | AI agents missing TSDoc / `@example`  |
| knip                         | CI check    | AI agents adding unused exports/deps  |
| cspell                       | CI check    | AI agents introducing typos           |
| `page.waitForTimeout` ban    | Error       | AI agents using anti-patterns         |
| Bundle size-limit            | Warning     | AI agents adding heavy deps           |
| `npm audit`                  | Blocking CI | AI agents adding vulnerable deps      |

---

## 8. VS Code Workspace Settings

### 8.1 .vscode/settings.json (committed to repo)

```jsonc
{
  // ── Editor ───────────────────────────────────────────────────────────────
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never", // Let eslint-plugin-import-x handle order
  },
  "editor.rulers": [100],
  "editor.tabSize": 2,
  "editor.insertSpaces": true,

  // ── TypeScript ───────────────────────────────────────────────────────────
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.importModuleSpecifier": "non-relative", // Use #core/, #bridge/
  "typescript.preferences.preferTypeOnlyAutoImports": true,

  // ── ESLint ───────────────────────────────────────────────────────────────
  "eslint.useFlatConfig": true,
  "eslint.validate": ["typescript"],
  "eslint.codeActionsOnSave.rules": null, // Fix all rules

  // ── Prettier ─────────────────────────────────────────────────────────────
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
  },
  "[json]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
  },
  "[markdown]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
  },

  // ── Testing ──────────────────────────────────────────────────────────────
  "playwright.reuseBrowser": true,
  "testing.defaultGutterClickAction": "debug",

  // ── Files ────────────────────────────────────────────────────────────────
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.exclude": {
    "**/dist": true,
    "**/coverage": true,
    "**/.auth": true,
  },

  // ── Search ───────────────────────────────────────────────────────────────
  "search.exclude": {
    "**/dist": true,
    "**/coverage": true,
    "**/node_modules": true,
    "**/playwright-report": true,
  },

  // ── Spell Checker ────────────────────────────────────────────────────────
  "cSpell.words": [
    "praman",
    "playwright",
    "dhikraft",
    "tsup",
    "vitest",
    "docusaurus",
    "pino",
    "commitlint",
    "fiori",
    "sapui",
    "odata",
    "flp",
    "combobox",
    "walkme",
    "webcomponent",
    "thenable",
  ],
}
```

### 8.2 .vscode/extensions.json (committed to repo)

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "GitHub.copilot",
    "GitHub.copilot-chat",
    "ms-playwright.playwright",
    "streetsidesoftware.code-spell-checker",
    "usernamehw.errorlens",
    "eamodio.gitlens",
    "DavidAnson.vscode-markdownlint",
    "Gruntfuggly.todo-tree"
  ]
}
```

---

## 9. Documentation Enforcement

### 9.1 TypeDoc Configuration

TSDoc requirements enforced at build time via `typedoc.json`:

```json
{
  "entryPoints": [
    "src/index.ts",
    "src/ai/index.ts",
    "src/intents/index.ts",
    "src/vocabulary/index.ts",
    "src/fe/index.ts",
    "src/reporters/index.ts"
  ],
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": true
  },
  "treatWarningsAsErrors": true,
  "excludePrivate": true,
  "excludeProtected": true,
  "readme": "none"
}
```

### 9.2 TSDoc Standards

Every public API must include:

````typescript
/**
 * Finds a UI5 control on the page by selector.
 *
 * @param selector - The UI5 selector to find the control.
 *   Supports ID, controlType, properties, and ancestor selectors.
 * @returns A typed proxy for the found UI5 control.
 * @throws {ControlError} If the control is not found within the configured timeout.
 *   Includes `suggestedSelector` for AI self-healing.
 *
 * @example
 * ```typescript
 * // Find by ID
 * const input = await ui5.control({ id: 'vendorInput' });
 *
 * // Find by type + properties
 * const btn = await ui5.control({
 *   controlType: 'sap.m.Button',
 *   properties: { text: 'Save' },
 * });
 * ```
 *
 * @ai This method is the primary entry point for AI agents to locate UI5 controls.
 */
export async function findControl(selector: UI5Selector): Promise<UI5ControlProxy> {
  // ...
}
````

### 9.3 .markdownlint.jsonc

```jsonc
{
  "default": true,
  "MD013": { "line_length": 200 }, // Allow longer lines (code blocks, tables)
  "MD033": false, // Allow inline HTML (diagrams, badges)
  "MD041": false, // First line doesn't have to be h1
  "MD024": { "siblings_only": true }, // Allow same heading in different sections
}
```

### 9.4 .cspell.json

```json
{
  "version": "0.2",
  "language": "en",
  "words": [
    "praman",
    "playwright-praman",
    "tsup",
    "vitest",
    "docusaurus",
    "pino",
    "commitlint",
    "fiori",
    "sapui",
    "odata",
    "btp",
    "saml",
    "flp",
    "walkme",
    "combobox",
    "thenable",
    "webcomponent",
    "webcomponents",
    "cyclonedx",
    "sbom",
    "provenance",
    "commitizen",
    "redaction",
    "hermetic",
    "serializable",
    "introspectable",
    "wdi5",
    "opentelemetry",
    "otel",
    "otlp",
    "camelcase",
    "semver",
    "pageobject",
    "kebabcase",
    "nodenext"
  ],
  "ignorePaths": [
    "node_modules",
    "dist",
    "coverage",
    "*.lock",
    "playwright-report",
    ".auth",
    "docs/build"
  ],
  "flagWords": ["blacklist", "whitelist", "master", "slave"],
  "suggestWords": ["allowlist", "denylist", "main", "replica"]
}
```

---

## 10. Security Configuration

### 10.1 .size-limit.json

```json
[
  {
    "path": "dist/index.js",
    "limit": "200 KB"
  },
  {
    "path": "dist/ai/index.js",
    "limit": "100 KB"
  },
  {
    "path": "dist/intents/index.js",
    "limit": "50 KB"
  },
  {
    "path": "dist/vocabulary/index.js",
    "limit": "50 KB"
  },
  {
    "path": "dist/fe/index.js",
    "limit": "50 KB"
  },
  {
    "path": "dist/reporters/index.js",
    "limit": "50 KB"
  }
]
```

### 10.2 knip.config.ts

```typescript
import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/index.ts',
    'src/ai/index.ts',
    'src/intents/index.ts',
    'src/vocabulary/index.ts',
    'src/fe/index.ts',
    'src/reporters/index.ts',
    'src/cli/index.ts',
  ],
  project: ['src/**/*.ts'],
  ignore: [
    'src/**/*.d.ts',
    'src/proxy/typed/*.generated.ts', // Auto-generated
  ],
  ignoreDependencies: [
    'pino-pretty', // Used at runtime via CLI pipe, not imported
  ],
};

export default config;
```

### 10.3 SBOM Generation

```bash
# Generate CycloneDX SBOM (run in CI before publish)
npx @cyclonedx/cyclonedx-npm --output-file playwright-praman.sbom.json --spec-version 1.5
```

---

## 11. Scaffold Bootstrap Script

### 11.1 package.json Scripts (Complete)

```jsonc
{
  "scripts": {
    // ── Core ───────────────────────────────────────────────────────────────
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist coverage playwright-report test-results .auth",

    // ── Quality ────────────────────────────────────────────────────────────
    "lint": "eslint src/ tests/ --max-warnings=0",
    "lint:fix": "eslint src/ tests/ --fix --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\" \"docs/**/*.md\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\"",
    "spellcheck": "cspell \"src/**/*.ts\" \"docs/**/*.md\" --no-progress",
    "deadcode": "knip",
    "mdlint": "markdownlint-cli2 \"**/*.md\" \"#node_modules\" \"#docs/build\"",

    // ── Testing ────────────────────────────────────────────────────────────
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest run --coverage",
    "test:integration": "playwright test",
    "test:integration:ui": "playwright test --ui",

    // ── CI (composite) ────────────────────────────────────────────────────
    "ci": "npm run lint && npm run typecheck && npm run test:unit && npm run build",
    "ci:full": "npm run ci && npm run test:integration && npm run spellcheck && npm run deadcode && npm run mdlint",

    // ── Documentation ──────────────────────────────────────────────────────
    "docs:dev": "cd docs && npx docusaurus start",
    "docs:build": "cd docs && npx docusaurus build",
    "docs:api": "typedoc",

    // ── Code Generation ────────────────────────────────────────────────────
    "generate:proxies": "tsx scripts/generate-typed-proxies.ts",
    "generate:skill": "tsx scripts/generate-skill-md.ts",
    "generate:sbom": "cyclonedx-npm --output-file playwright-praman.sbom.json --spec-version 1.5",
    "generate:schema": "tsx scripts/generate-json-schema.ts",

    // ── Security ───────────────────────────────────────────────────────────
    "audit": "npm audit --audit-level=high",
    "audit:fix": "npm audit fix",

    // ── Release ────────────────────────────────────────────────────────────
    "prepublishOnly": "npm run ci",

    // ── Git Hooks ──────────────────────────────────────────────────────────
    "prepare": "husky",
  },
}
```

### 11.2 Bootstrap Sequence (Phase 0)

Execute these steps in order to scaffold the workspace:

````bash
#!/bin/bash
# ── Praman v1.0 Workspace Bootstrap ────────────────────────────────
set -euo pipefail

echo "🚀 Bootstrapping Praman v1.0 workspace..."

# 1. Initialize repo
mkdir playwright-praman && cd playwright-praman
git init
echo "22" > .nvmrc
echo "22" > .node-version

# 2. Initialize package.json
npm init -y
# Then manually edit package.json with full config from Section 2

# 3. Install all dependencies
npm install dotenv pino zod zod-to-json-schema
npm install -D typescript tsup tsx \
  vitest @vitest/coverage-v8 @vitest/ui @playwright/test \
  eslint typescript-eslint eslint-plugin-security eslint-plugin-tsdoc \
  eslint-plugin-import-x eslint-plugin-unicorn eslint-config-prettier \
  eslint-plugin-n eslint-plugin-promise eslint-plugin-sonarjs \
  @microsoft/eslint-plugin-sdl eslint-plugin-playwright \
  @microsoft/api-extractor @arethetypeswrong/cli glob \
  prettier husky lint-staged @commitlint/cli @commitlint/config-conventional \
  typedoc typedoc-plugin-markdown @docusaurus/core @docusaurus/preset-classic \
  markdownlint-cli2 knip cspell @size-limit/file size-limit \
  pino-pretty @cyclonedx/cyclonedx-npm release-please

# 4. Install Playwright browsers
npx playwright install --with-deps chromium

# 5. Initialize git hooks
npx husky init
echo 'npx lint-staged' > .husky/pre-commit
echo 'npx --no -- commitlint --edit "$1"' > .husky/commit-msg
echo 'npm run typecheck && npm run test:unit -- --coverage && npm run build' > .husky/pre-push

# 6. Create directory structure
mkdir -p src/{core/{config,errors,logging,telemetry,compat,types,utils},bridge/{interaction-strategies,browser-scripts},proxy/typed,selectors,matchers,fixtures,auth/strategies,modules,fe,ai/{capabilities,recipes,schemas},intents/domains,vocabulary/domains,reporters,cli}
mkdir -p tests/{unit/{core,bridge,proxy,selectors,auth,modules,ai,intents,vocabulary},integration/{bridge,proxy,auth,table,navigation,behavioral},e2e/sap-cloud}
mkdir -p scripts docs/{docs,blog} skills/playwright-praman-sap-testing .github/workflows .vscode

# 7. Create barrel files
for dir in $(find src -type d); do
  if [ "$dir" != "src" ] && [ "$dir" != "src/proxy/typed" ]; then
    touch "$dir/index.ts"
  fi
done

# 8. Create config files
# (Copy contents from Sections 3.2–3.12 of this document)

# 9. Create initial entry point
cat > src/index.ts << 'EOF'
/**
 * Praman v1.0 — AI-First SAP UI5 Test Automation Platform for Playwright.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('create purchase order', async ({ page, ui5, navigation }) => {
 *   await navigation.openTileByTitle('Create Purchase Order');
 *   const input = await ui5.control({ id: 'vendorInput' });
 *   await input.setValue('V001');
 * });
 * ```
 */
export { test, expect } from '@playwright/test';
export { defineConfig } from './core/config/index.js';
EOF

# 10. Initial commit
git add -A
git commit -m "chore: scaffold praman v1.0 workspace

- Directory structure per plan.md Section 6.1
- All config files: tsconfig, tsup, eslint, prettier, vitest, playwright
- Git hooks: pre-commit, commit-msg, pre-push
- CI/CD: ci.yml, release.yml, docs.yml
- AI agent configs: copilot-instructions.md, CLAUDE.md
- 28 devDependencies, 4 production deps"

echo "✅ Workspace bootstrapped. Run 'npm run ci' to verify."
````

---

## Appendix A — Version Pinning Strategy

| Package Type    | Strategy                         | Rationale                                   |
| --------------- | -------------------------------- | ------------------------------------------- |
| Production deps | `save-exact` via `.npmrc`        | Reproducible builds, no phantom drift       |
| Dev deps        | `save-exact` via `.npmrc`        | Same — AI agents must see identical tooling |
| Peer deps       | Range (`>=1.50.0 <2.0.0`)        | Users install their own Playwright version  |
| CI actions      | Pinned to commit SHA             | BP-MICROSOFT: prevents supply chain attacks |
| Node.js         | `.nvmrc` + `engines` + CI matrix | Tests on 20/22/24 — ensures broad compat    |

## Appendix B — Tool Selection Rationale

| Category          | Chosen                             | Alternatives Considered       | Why Chosen                                                      |
| ----------------- | ---------------------------------- | ----------------------------- | --------------------------------------------------------------- |
| **Build**         | tsup                               | tsc, rollup, webpack, unbuild | Fastest ESM build, multi-entry native, esbuild-powered          |
| **Lint**          | ESLint 9.x                         | Biome, deno lint              | TS-eslint ecosystem maturity, plugin ecosystem                  |
| **Format**        | Prettier                           | Biome, dprint                 | Universal standard, Copilot/Claude trained on it                |
| **Unit Test**     | Vitest                             | Jest, node:test               | TS-native, fast, v8 coverage, Playwright-assertion compatible   |
| **Docs**          | Docusaurus                         | VitePress, Nextra, Starlight  | React ecosystem, versioned docs, proven at SAP scale            |
| **API Docs**      | TypeDoc                            | API Extractor, TSDoc CLI      | Markdown output, Docusaurus integration                         |
| **Release**       | release-please                     | semantic-release, changesets  | Google-backed, conventional commits, simple config              |
| **Dead Code**     | knip                               | ts-prune, madge               | All-in-one: unused exports, deps, types, files                  |
| **Spell Check**   | cspell                             | typos-cli, codespell          | VS Code integration, custom dictionary, CI support              |
| **Hooks**         | husky                              | simple-git-hooks, lefthook    | Most AI-agent-compatible, widely known pattern                  |
| **Commit Lint**   | commitlint                         | none                          | Standard for conventional commits; release-please depends on it |
| **Bundle Size**   | size-limit                         | bundlesize                    | Per-export limits, CI integration                               |
| **Markdown Lint** | markdownlint-cli2                  | remark-lint                   | VS Code extension parity, simple config                         |
| **Security**      | eslint-plugin-security + npm audit | Snyk (also used)              | Free tier covers needs; Snyk for deeper analysis                |

## Appendix C — Future-Proofing Checklist

| Risk                        | Mitigation                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------- |
| ESLint v11 breaking changes | Flat config already adopted; minimal migration                                          |
| TypeScript 6.x              | `verbatimModuleSyntax` + `isolatedModules` future-safe                                  |
| Node.js 26/28               | CI matrix tests on current + LTS; `engines` enforced                                    |
| Playwright 2.0              | `PlaywrightCompat` abstraction layer + version range peer dep                           |
| AI agent API changes        | Agent-agnostic instructions (CLAUDE.md, copilot-instructions.md) + Conventional Commits |
| Zod 5.x                     | Zod 4.x is latest; schema patterns are forward-compatible                               |
| npm → alternative PM        | `.npmrc` config is npm-specific but package.json is universal                           |
| GitHub Actions pricing      | All jobs have timeout-minutes; concurrency cancels redundant runs                       |

---

_End of Document — Praman v1.0 Workspace Setup & Tooling Guide v1.0.0_
