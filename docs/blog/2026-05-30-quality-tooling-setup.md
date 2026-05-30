---
title: 'Quality tooling setup guide: every tool, every config, one install command'
authors: [maheshwar]
tags: [praman, open-source, typescript-6, eslint-10]
date: 2026-05-30T12:00:00
description: 'Step-by-step guide to install and configure all 22 quality tools used in Praman — TypeScript strict mode, ESLint with 13 plugins, Vitest coverage tiers, security scanning, SBOM generation, and CI pipeline scripts. Includes a one-shot install command.'
keywords:
  - praman quality tooling setup
  - ESLint 10 flat config SAP
  - TypeScript strict mode project setup
  - Vitest coverage thresholds
  - enterprise open source CI pipeline
  - playwright-praman devops
  - npm package quality setup guide
  - SAP test automation CI CD
---

# Quality Tooling Setup Guide

Complete guide to install and configure every code quality, documentation, security, and standards enforcement tool used in Praman — TypeScript strict mode, ESLint with 13 plugins, Vitest tiered coverage, security scanning, SBOM generation, and CI pipeline scripts. Includes a one-shot install command.

**Prerequisites:** Node.js >= 22, npm >= 10, Git.

<!--truncate-->

---

## Table of Contents

1. [TypeScript (Strict Mode)](#1-typescript-strict-mode)
2. [ESLint (11 Plugins — Zero Tolerance)](#2-eslint-11-plugins--zero-tolerance)
3. [Prettier (Code Formatting)](#3-prettier-code-formatting)
4. [Husky (Git Hooks)](#4-husky-git-hooks)
5. [lint-staged (Pre-commit File Filtering)](#5-lint-staged-pre-commit-file-filtering)
6. [Commitlint (Conventional Commits)](#6-commitlint-conventional-commits)
7. [Vitest + Coverage (Unit Testing)](#7-vitest--coverage-unit-testing)
8. [Playwright (Integration / E2E Testing)](#8-playwright-integration--e2e-testing)
9. [TSDoc + eslint-plugin-tsdoc (Documentation Standard)](#9-tsdoc--eslint-plugin-tsdoc-documentation-standard)
10. [TypeDoc (API Docs Generation)](#10-typedoc-api-docs-generation)
11. [Microsoft API Extractor (API Surface Review)](#11-microsoft-api-extractor-api-surface-review)
12. [cspell (Spell Checking)](#12-cspell-spell-checking)
13. [markdownlint-cli2 (Markdown Linting)](#13-markdownlint-cli2-markdown-linting)
14. [eslint-plugin-security + Microsoft SDL (Security)](#14-eslint-plugin-security--microsoft-sdl-security)
15. [npm audit (Dependency Vulnerability Scanning)](#15-npm-audit-dependency-vulnerability-scanning)
16. [CycloneDX (SBOM Generation)](#16-cyclonedx-sbom-generation)
17. [Knip (Dead Code Detection)](#17-knip-dead-code-detection)
18. [size-limit (Bundle Size Budgets)](#18-size-limit-bundle-size-budgets)
19. [@arethetypeswrong/cli (Export Validation)](#19-arethetypeswrongcli-export-validation)
20. [tsup (Build — Dual ESM + CJS)](#20-tsup-build--dual-esm--cjs)
21. [.gitattributes (Cross-Platform Line Endings)](#21-gitattributes-cross-platform-line-endings)
22. [CI Pipeline Scripts](#22-ci-pipeline-scripts)
23. [Full package.json Scripts Reference](#23-full-packagejson-scripts-reference)

---

## 1. TypeScript (Strict Mode)

### Install

```bash
npm install --save-dev typescript@^6.0
```

### Configure — `tsconfig.json`

```jsonc
{
  "compilerOptions": {
    // ── Strict checks (all on) ───────────────────────────
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedSideEffectImports": true,

    // ── Module system ────────────────────────────────────
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "types": ["node"],
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,

    // ── Output ───────────────────────────────────────────
    "outDir": "dist",
    "rootDir": ".",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,

    // ── Path aliases (optional) ──────────────────────────
    "paths": {
      "#core/*": ["./src/core/*"],
      "#bridge/*": ["./src/bridge/*"],
    },
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"],
}
```

### npm script

```jsonc
// package.json → scripts
"typecheck": "tsc --noEmit"
```

### Run

```bash
npm run typecheck
```

---

## 2. ESLint (11 Plugins — Zero Tolerance)

### Install (all plugins in one command)

```bash
npm install --save-dev \
  eslint@^10 \
  @eslint/js@^10 \
  typescript-eslint@^8 \
  eslint-plugin-tsdoc@^0.5 \
  eslint-plugin-playwright@^2 \
  eslint-plugin-security@^4 \
  @microsoft/eslint-plugin-sdl@^1 \
  eslint-plugin-sonarjs@^4 \
  eslint-plugin-n@^18 \
  eslint-plugin-promise@^7 \
  eslint-plugin-import-x@^4 \
  eslint-plugin-unicorn@^64 \
  eslint-plugin-headers@^1 \
  eslint-config-prettier@^10
```

### Configure — `eslint.config.mjs`

```js
// eslint.config.mjs — ESLint 10 flat config
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
import headers from 'eslint-plugin-headers';

export default tseslint.config(
  // ── Global ignores ────────────────────────────────────────────────
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

  // ── Base ESLint recommended ───────────────────────────────────────
  eslint.configs.recommended,

  // ── TypeScript strict + stylistic (type-checked) ──────────────────
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Security (OWASP + Microsoft SDL) ──────────────────────────────
  {
    plugins: {
      security,
      '@microsoft/sdl': microsoftSdl,
    },
    rules: {
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-unsafe-regex': 'error',

      '@microsoft/sdl/no-insecure-url': 'error',
      '@microsoft/sdl/no-cookies': 'warn',
      '@microsoft/sdl/no-document-write': 'error',
      '@microsoft/sdl/no-inner-html': 'error',
      '@microsoft/sdl/no-msapp-exec-unsafe': 'error',
      '@microsoft/sdl/no-postmessage-star-origin': 'error',
      '@microsoft/sdl/no-winjs-html-unsafe': 'error',
      '@microsoft/sdl/no-html-method': 'error',
      '@microsoft/sdl/no-angular-bypass-sanitizer': 'error',
    },
  },

  // ── Node.js best practices ────────────────────────────────────────
  nodePlugin.configs['flat/recommended'],
  {
    rules: {
      'n/no-missing-import': 'off',
      'n/no-unpublished-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',
      'n/file-extension-in-import': 'off',
      'n/prefer-global/buffer': ['error', 'never'],
      'n/prefer-global/process': ['error', 'never'],
      'n/prefer-promises/dns': 'error',
      'n/prefer-promises/fs': 'error',
      'n/no-process-exit': 'error',
    },
  },

  // ── Promise best practices ────────────────────────────────────────
  promisePlugin.configs['flat/recommended'],
  {
    rules: {
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'warn',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/no-new-statics': 'error',
      'promise/valid-params': 'error',
      'promise/prefer-await-to-then': 'error',
    },
  },

  // ── SonarJS (code quality / cognitive complexity) ──────────────────
  sonarjs.configs.recommended,
  {
    rules: {
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      'sonarjs/todo-tag': 'warn',
      'sonarjs/no-commented-code': 'warn',
    },
  },

  // ── TSDoc enforcement ─────────────────────────────────────────────
  {
    plugins: { tsdoc },
    rules: {
      'tsdoc/syntax': 'error',
    },
  },

  // ── Import rules ──────────────────────────────────────────────────
  {
    plugins: { 'import-x': importX },
    rules: {
      'import-x/no-cycle': 'error',
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

  // ── Unicorn (modern JS/TS) ────────────────────────────────────────
  {
    plugins: { unicorn },
    rules: {
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/prefer-top-level-await': 'error',
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/prefer-string-replace-all': 'error',
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
    },
  },

  // ── Strict TypeScript rules ───────────────────────────────────────
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'error',
        {
          allowString: false,
          allowNumber: false,
          allowNullableObject: false,
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        { allowExpressions: true, allowHigherOrderFunctions: true },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
        { selector: 'class', format: ['PascalCase'] },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
        { selector: 'function', format: ['camelCase'] },
        { selector: 'method', format: ['camelCase'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'typeParameter', format: ['PascalCase'], prefix: ['T'] },
      ],

      'no-console': 'error',
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-throw-literal': 'error',
      'prefer-promise-reject-errors': 'error',
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },

  // ── Playwright test file overrides ────────────────────────────────
  {
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
      'security/detect-object-injection': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'playwright/no-wait-for-timeout': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/no-element-handle': 'error',
      'playwright/no-eval': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-skipped-test': 'warn',
      'playwright/no-useless-await': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/prefer-to-be': 'error',
      'playwright/prefer-to-have-length': 'error',
      'playwright/require-top-level-describe': 'error',
      'playwright/expect-expect': 'warn',
      'playwright/no-conditional-in-test': 'warn',
      'playwright/no-networkidle': 'error',
      'playwright/no-page-pause': 'error',
    },
  },

  // ── License header enforcement ────────────────────────────────────
  {
    plugins: { headers },
    rules: {
      'headers/header-format': [
        'error',
        {
          source: 'string',
          content:
            '@license\n' +
            'Copyright (c) YourCompany 2025. All Rights Reserved.\n' +
            'SPDX-License-Identifier: Apache-2.0',
        },
      ],
    },
  },

  // ── Prettier compatibility (MUST be last) ─────────────────────────
  prettier,
);
```

### npm scripts

```jsonc
// package.json → scripts
"lint": "eslint src/ tests/ --max-warnings=0",
"lint:fix": "eslint src/ tests/ --fix --max-warnings=0"
```

### Run

```bash
npm run lint          # Check (zero warnings allowed)
npm run lint:fix      # Auto-fix what it can
```

---

## 3. Prettier (Code Formatting)

### Install

```bash
npm install --save-dev prettier@^3 eslint-config-prettier@^10
```

### Configure — `.prettierrc.json`

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

### Configure — `.prettierignore`

```text
dist/
coverage/
node_modules/
docs/.docusaurus/
docs/build/
*.json
!.prettierrc.json
CHANGELOG.md
```

### npm scripts

```jsonc
// package.json → scripts
"format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\" \"docs/**/*.md\"",
"format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\""
```

### Run

```bash
npm run format         # Fix formatting
npm run format:check   # CI check (no writes)
```

---

## 4. Husky (Git Hooks)

### Install

```bash
npm install --save-dev husky@^9
```

### Initialize

```bash
npx husky init
```

This creates the `.husky/` directory and adds `"prepare": "husky"` to `package.json`.

### Create hooks

**pre-commit** — `.husky/pre-commit`:

```bash
#!/bin/bash
npx lint-staged
```

**pre-push** — `.husky/pre-push`:

```bash
#!/bin/bash

# Block direct pushes to main — require PRs
protected_branch="main"
current_branch=$(git symbolic-ref --short HEAD 2>/dev/null)

while read local_ref local_oid remote_ref remote_oid; do
  if echo "$remote_ref" | grep -q "refs/heads/${protected_branch}$"; then
    if [ "$current_branch" = "$protected_branch" ]; then
      echo "ERROR: Direct push to '$protected_branch' is not allowed."
      echo "Create a feature branch and open a pull request instead."
      exit 1
    fi
  fi
done

# Run full validation with coverage
npm run typecheck && npm run test:unit -- --coverage && npm run build
```

**commit-msg** — `.husky/commit-msg`:

```bash
npx --no -- commitlint --edit "$1"
```

### Make hooks executable

```bash
chmod +x .husky/pre-commit .husky/pre-push .husky/commit-msg
```

### npm script (auto-setup on `npm install`)

```jsonc
// package.json → scripts
"prepare": "husky"
```

---

## 5. lint-staged (Pre-commit File Filtering)

### Install

```bash
npm install --save-dev lint-staged@^17
```

### Configure — `.lintstagedrc.cjs`

```js
module.exports = {
  '*.ts': ['eslint --fix --max-warnings=0 --no-warn-ignored', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.md': ['markdownlint-cli2'],
};
```

lint-staged is invoked by the pre-commit hook — no npm script needed.

---

## 6. Commitlint (Conventional Commits)

### Install

```bash
npm install --save-dev @commitlint/cli@^21 @commitlint/config-conventional@^21
```

### Configure — `.commitlintrc.json`

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
      ["core", "bridge", "proxy", "fixtures", "auth", "cli", "docs", "ci", "deps"]
    ],
    "subject-max-length": [2, "always", 72],
    "body-max-line-length": [2, "always", 200],
    "header-max-length": [2, "always", 100]
  }
}
```

### How it works

The `.husky/commit-msg` hook runs `commitlint --edit` on every commit. Invalid messages are rejected:

```text
# Valid
feat(core): add retry logic for bridge timeouts
fix(auth): handle expired SAML tokens gracefully

# Invalid (rejected)
added stuff          ← no type prefix
feat: this is a very long commit message that exceeds the seventy-two character subject limit
```

---

## 7. Vitest + Coverage (Unit Testing)

### Install

```bash
npm install --save-dev vitest@^4 @vitest/coverage-v8@^4 @vitest/ui@^4
```

### Configure — `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    exclude: ['tests/integration/**', 'tests/e2e/**'],
    globals: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary', 'json', 'html'],
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/index.ts', // barrel files
        'src/**/*.d.ts', // type-only
      ],
      // ── Tiered coverage thresholds ────────────────────────
      thresholds: {
        // Global minimum
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
        perFile: true, // no single file hides behind averages

        // Tier 1: Error classes (100%)
        'src/core/errors/**/*.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        // Tier 2: Core infrastructure (95%)
        'src/core/config/**/*.ts': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
      },
      watermarks: {
        statements: [80, 95],
        branches: [75, 90],
        functions: [80, 95],
        lines: [80, 95],
      },
    },
    typecheck: {
      enabled: true,
    },
  },
});
```

### npm scripts

```jsonc
// package.json → scripts
"test:unit": "vitest run",
"test:unit:watch": "vitest",
"test:unit:ui": "vitest --ui",
"test:unit:coverage": "vitest run --coverage"
```

### Run

```bash
npm run test:unit              # Single run
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage report
npm run test:unit:ui           # Browser UI
```

---

## 8. Playwright (Integration / E2E Testing)

### Install

```bash
npm install --save-dev @playwright/test@^1.60
npx playwright install          # Download browser binaries
```

### npm scripts

```jsonc
// package.json → scripts
"test:integration": "playwright test",
"test:integration:ui": "playwright test --ui"
```

### Run

```bash
npm run test:integration       # Headless
npm run test:integration:ui    # Interactive UI mode
```

---

## 9. TSDoc + eslint-plugin-tsdoc (Documentation Standard)

### Install

```bash
npm install --save-dev eslint-plugin-tsdoc@^0.5
```

(Already included in ESLint config above as `'tsdoc/syntax': 'error'`.)

### Configure — `tsdoc.json`

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json",
  "extends": ["@microsoft/api-extractor/extends/tsdoc-base.json"],
  "tagDefinitions": [
    { "tagName": "@license", "syntaxKind": "block", "allowMultiple": false },
    { "tagName": "@module", "syntaxKind": "block", "allowMultiple": false },
    { "tagName": "@category", "syntaxKind": "block", "allowMultiple": false },
    { "tagName": "@intent", "syntaxKind": "block", "allowMultiple": false },
    { "tagName": "@guarantee", "syntaxKind": "block", "allowMultiple": false },
    { "tagName": "@capability", "syntaxKind": "block", "allowMultiple": false }
  ],
  "supportForTags": {
    "@license": true,
    "@module": true,
    "@remarks": true,
    "@example": true,
    "@param": true,
    "@returns": true,
    "@throws": true,
    "@see": true,
    "@deprecated": true,
    "@internal": true,
    "@public": true,
    "@category": true,
    "@intent": true,
    "@guarantee": true,
    "@capability": true
  },
  "reportUnsupportedHtmlElements": true
}
```

---

## 10. TypeDoc (API Docs Generation)

### Install

```bash
npm install --save-dev typedoc@^0.28 typedoc-plugin-markdown@^4
```

### Configure — `typedoc.json`

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "name": "Your Project",
  "entryPoints": ["src/index.ts"],
  "entryPointStrategy": "resolve",
  "out": "docs/api",
  "readme": "README.md",
  "includeVersion": true,
  "plugin": ["typedoc-plugin-markdown"],
  "validation": {
    "notExported": false,
    "invalidLink": true,
    "notDocumented": true
  },
  "excludePrivate": true,
  "excludeInternal": true,
  "requiredToBeDocumented": [
    "Enum",
    "EnumMember",
    "Variable",
    "Function",
    "Class",
    "Interface",
    "Method",
    "Accessor",
    "TypeAlias"
  ],
  "sort": ["static-first", "visibility", "kind", "alphabetical"]
}
```

### npm scripts

```jsonc
// package.json → scripts
"docs:api": "typedoc"
```

### Run

```bash
npm run docs:api     # Generate markdown API docs to docs/api/
```

---

## 11. Microsoft API Extractor (API Surface Review)

### Install

```bash
npm install --save-dev @microsoft/api-extractor@^7
```

### Configure — `api-extractor.json`

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/api-extractor/v7/api-extractor.schema.json",
  "mainEntryPointFilePath": "<projectFolder>/dist/index.d.ts",
  "compiler": {
    "tsconfigFilePath": "<projectFolder>/tsconfig.build.json"
  },
  "apiReport": {
    "enabled": true,
    "reportFolder": "<projectFolder>/api-reports/",
    "reportFileName": "<unscopedPackageName>.api.md"
  },
  "docModel": {
    "enabled": true,
    "apiJsonFilePath": "<projectFolder>/temp/<unscopedPackageName>.api.json"
  },
  "dtsRollup": { "enabled": false },
  "tsdocMetadata": {
    "enabled": true,
    "tsdocMetadataFilePath": "<projectFolder>/dist/tsdoc-metadata.json"
  },
  "messages": {
    "extractorMessageReporting": {
      "default": { "logLevel": "warning" },
      "ae-missing-release-tag": { "logLevel": "none" }
    },
    "tsdocMessageReporting": {
      "default": { "logLevel": "warning" },
      "tsdoc-undefined-tag": { "logLevel": "none" }
    }
  }
}
```

### npm script

```jsonc
// package.json → scripts
"docs:api-review": "api-extractor run --local --verbose"
```

### Run

```bash
npm run build                  # Must build .d.ts first
npm run docs:api-review        # Generates api-reports/*.api.md
```

Review the generated `api-reports/` file and commit it. API Extractor will fail CI if the public API surface changes without updating this report.

---

## 12. cspell (Spell Checking)

### Install

```bash
npm install --save-dev cspell@^10
```

### Configure — `cspell.json`

<!-- cspell:disable -->

```json
{
  "$schema": "https://raw.githubusercontent.com/streetsidesoftware/cspell/main/cspell.schema.json",
  "version": "0.2",
  "language": "en",
  "useGitignore": true,
  "cache": {
    "useCache": true,
    "cacheLocation": ".cspell/.cspellcache",
    "cacheStrategy": "content"
  },
  "dictionaryDefinitions": [
    {
      "name": "project-words",
      "path": "./.cspell/project-words.txt",
      "description": "Project-specific terms",
      "addWords": true
    }
  ],
  "dictionaries": ["project-words"],
  "ignorePaths": ["node_modules", "dist", "coverage", "*.lock", "playwright-report", "docs/build"],
  "flagWords": ["whitelist", "slave"],
  "suggestWords": ["allowlist", "denylist", "main", "replica"]
}
```

<!-- cspell:enable -->

### Create dictionary file

```bash
mkdir -p .cspell
touch .cspell/project-words.txt
```

Add project-specific words (one per line) to `.cspell/project-words.txt`:

```text
# Project terms
vitest
tsup
commitlint
typedoc
```

### npm script

```jsonc
// package.json → scripts
"spellcheck": "cspell \"src/**/*.ts\" \"docs/**/*.md\" --no-progress"
```

### Run

```bash
npm run spellcheck
```

---

## 13. markdownlint-cli2 (Markdown Linting)

### Install

```bash
npm install --save-dev markdownlint-cli2@^0.22
```

### Configure — `.markdownlint.jsonc`

```jsonc
{
  "default": true,
  "MD013": { "line_length": 300 },
  "MD033": false, // Allow inline HTML
  "MD041": false, // Don't require first line to be H1
  "MD024": { "siblings_only": true },
  "MD060": false,
  "MD012": false, // Allow multiple blank lines
}
```

### Configure — `.markdownlint-cli2.jsonc`

```jsonc
{
  "config": {
    "extends": ".markdownlint.jsonc",
  },
  "ignores": ["node_modules/", "CHANGELOG.md"],
}
```

### npm script

```jsonc
// package.json → scripts
"mdlint": "markdownlint-cli2 \"**/*.md\" \"#node_modules\""
```

### Run

```bash
npm run mdlint
```

---

## 14. eslint-plugin-security + Microsoft SDL (Security)

These are already installed and configured as part of the ESLint setup in [section 2](#2-eslint-11-plugins--zero-tolerance). The security rules are split into two plugins:

**OWASP rules** (`eslint-plugin-security`):

- `detect-eval-with-expression` — blocks dynamic `eval()`
- `detect-child-process` — flags `child_process` usage
- `detect-unsafe-regex` — catches ReDoS-vulnerable patterns
- `detect-non-literal-require` — blocks dynamic `require()`
- `detect-possible-timing-attacks` — warns on string comparison timing
- `detect-pseudoRandomBytes` — blocks insecure random
- `detect-buffer-noassert` — blocks unchecked buffer reads
- `detect-object-injection` — warns on bracket notation with variables
- `detect-non-literal-fs-filename` — warns on dynamic file paths
- `detect-non-literal-regexp` — warns on user-supplied regex

**Microsoft SDL rules** (`@microsoft/eslint-plugin-sdl`):

- `no-insecure-url` — blocks `http://` URLs
- `no-document-write` — blocks `document.write()`
- `no-inner-html` — blocks `.innerHTML` assignment
- `no-postmessage-star-origin` — blocks `postMessage('*')`
- `no-cookies` — warns on `document.cookie`
- `no-html-method` — blocks jQuery `.html()`

No separate install needed — included in the ESLint install command.

---

## 15. npm audit (Dependency Vulnerability Scanning)

### No install needed (built into npm)

### npm scripts

```jsonc
// package.json → scripts
"audit": "npm audit --audit-level=high",
"audit:fix": "npm audit fix"
```

### Run

```bash
npm run audit          # Report high+ severity vulnerabilities
npm run audit:fix      # Auto-fix where possible
```

### Pin vulnerable transitive dependencies

Use `overrides` in `package.json` to force-upgrade vulnerable transitive deps:

```jsonc
// package.json
"overrides": {
  "picomatch@2.3.1": "2.3.2",
  "smol-toml@<1.6.1": "1.6.1"
}
```

---

## 16. CycloneDX (SBOM Generation)

### Install

```bash
npm install --save-dev @cyclonedx/cyclonedx-npm@^4
```

### npm script

```jsonc
// package.json → scripts
"generate:sbom": "cyclonedx-npm --output-file project.sbom.json --spec-version 1.5 --ignore-npm-errors"
```

### Run

```bash
npm run generate:sbom
```

This generates a CycloneDX 1.5 Software Bill of Materials in JSON format — required by many enterprise security policies and compliance frameworks.

---

## 17. Knip (Dead Code Detection)

### Install

```bash
npm install --save-dev knip@^6
```

### npm script

```jsonc
// package.json → scripts
"deadcode": "knip"
```

### Run

```bash
npm run deadcode
```

Knip finds:

- Unused files
- Unused exports
- Unused dependencies in `package.json`
- Unused devDependencies
- Unlisted binaries in scripts

---

## 18. size-limit (Bundle Size Budgets)

### Install

```bash
npm install --save-dev size-limit@^12 @size-limit/file@^12
```

### Configure — `.size-limit.json`

```json
[
  {
    "path": "dist/index.js",
    "limit": "200 KB"
  },
  {
    "path": "dist/index.cjs",
    "limit": "200 KB"
  }
]
```

### Run

```bash
npx size-limit
```

---

## 19. @arethetypeswrong/cli (Export Validation)

### Install

```bash
npm install --save-dev @arethetypeswrong/cli@^0.18
```

### npm script

```jsonc
// package.json → scripts
"check:exports": "attw --pack ."
```

### Run

```bash
npm run build          # Must build first
npm run check:exports  # Validates all package.json exports resolve
```

This verifies that every sub-path export in your `package.json` `"exports"` field resolves correctly for both ESM (`import`) and CJS (`require`) consumers — catches the "works on my machine" type resolution bugs.

---

## 20. tsup (Build — Dual ESM + CJS)

### Install

```bash
npm install --save-dev tsup@^8
```

### Configure — `tsup.config.ts`

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node22',
  splitting: false,
  treeshake: true,
  cjsInterop: true,
  shims: true,
});
```

### npm scripts

```jsonc
// package.json → scripts
"build": "tsup",
"dev": "tsup --watch",
"clean": "node -e \"['dist','coverage'].forEach(d=>require('fs').rmSync(d,{recursive:true,force:true}))\""
```

### Run

```bash
npm run build    # Produces dist/*.js + dist/*.cjs + dist/*.d.ts + dist/*.d.cts
npm run dev      # Watch mode
```

---

## 21. .gitattributes (Cross-Platform Line Endings)

### Create — `.gitattributes`

```text
* text=auto eol=lf
*.ts linguist-language=TypeScript
*.md diff=markdown
*.json diff=json

# Ensure LF for shell scripts (Husky hooks)
*.sh text eol=lf
.husky/* text eol=lf
```

No install needed — Git reads this automatically.

---

## 22. CI Pipeline Scripts

### Combine everything into pipeline scripts

```jsonc
// package.json → scripts

// Fast CI (runs on every PR)
"ci": "npm run lint && npm run typecheck && npm run test:unit && npm run build",

// Full CI (runs on main / release)
"ci:full": "npm run ci && npm run test:integration && npm run spellcheck && npm run deadcode && npm run mdlint",

// Pre-publish safety net
"prepublishOnly": "npm run ci"
```

### Run

```bash
npm run ci           # ~30s — lint + types + tests + build
npm run ci:full      # ~2min — everything including integration tests
```

---

## 23. Full package.json Scripts Reference

```jsonc
{
  "scripts": {
    // ── Build ─────────────────────────────────────────────
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "node -e \"['dist','coverage'].forEach(d=>require('fs').rmSync(d,{recursive:true,force:true}))\"",

    // ── Lint & Format ─────────────────────────────────────
    "lint": "eslint src/ tests/ --max-warnings=0",
    "lint:fix": "eslint src/ tests/ --fix --max-warnings=0",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\" \"docs/**/*.md\"",
    "format:check": "prettier --check \"src/**/*.ts\" \"tests/**/*.ts\"",

    // ── Type Safety ───────────────────────────────────────
    "typecheck": "tsc --noEmit",
    "check:exports": "attw --pack .",

    // ── Testing ───────────────────────────────────────────
    "test:unit": "vitest run",
    "test:unit:watch": "vitest",
    "test:unit:ui": "vitest --ui",
    "test:unit:coverage": "vitest run --coverage",
    "test:integration": "playwright test",
    "test:integration:ui": "playwright test --ui",

    // ── Documentation ─────────────────────────────────────
    "docs:api": "typedoc",
    "docs:api-review": "api-extractor run --local --verbose",
    "spellcheck": "cspell \"src/**/*.ts\" \"docs/**/*.md\" --no-progress",
    "mdlint": "markdownlint-cli2 \"**/*.md\" \"#node_modules\"",

    // ── Security ──────────────────────────────────────────
    "audit": "npm audit --audit-level=high",
    "audit:fix": "npm audit fix",
    "generate:sbom": "cyclonedx-npm --output-file project.sbom.json --spec-version 1.5 --ignore-npm-errors",

    // ── Quality ───────────────────────────────────────────
    "deadcode": "knip",

    // ── CI Pipelines ──────────────────────────────────────
    "ci": "npm run lint && npm run typecheck && npm run test:unit && npm run build",
    "ci:full": "npm run ci && npm run test:integration && npm run spellcheck && npm run deadcode && npm run mdlint",
    "prepublishOnly": "npm run ci",

    // ── Git hooks ─────────────────────────────────────────
    "prepare": "husky",
  },
}
```

---

## One-Shot Install (All Tools)

Copy-paste to install everything at once:

```bash
npm install --save-dev \
  typescript@^6 \
  eslint@^10 \
  @eslint/js@^10 \
  typescript-eslint@^8 \
  eslint-plugin-tsdoc@^0.5 \
  eslint-plugin-playwright@^2 \
  eslint-plugin-security@^4 \
  @microsoft/eslint-plugin-sdl@^1 \
  eslint-plugin-sonarjs@^4 \
  eslint-plugin-n@^18 \
  eslint-plugin-promise@^7 \
  eslint-plugin-import-x@^4 \
  eslint-plugin-unicorn@^64 \
  eslint-plugin-headers@^1 \
  eslint-config-prettier@^10 \
  prettier@^3 \
  husky@^9 \
  lint-staged@^17 \
  @commitlint/cli@^21 \
  @commitlint/config-conventional@^21 \
  vitest@^4 \
  @vitest/coverage-v8@^4 \
  @vitest/ui@^4 \
  @playwright/test@^1.60 \
  typedoc@^0.28 \
  typedoc-plugin-markdown@^4 \
  @microsoft/api-extractor@^7 \
  cspell@^10 \
  markdownlint-cli2@^0.22 \
  knip@^6 \
  size-limit@^12 \
  @size-limit/file@^12 \
  @arethetypeswrong/cli@^0.18 \
  tsup@^8 \
  @cyclonedx/cyclonedx-npm@^4
```

Then initialize Husky and Playwright:

```bash
npx husky init
npx playwright install
```

---

## Quality Gate Summary

| When                      | What runs                                                      | Blocks on failure    |
| ------------------------- | -------------------------------------------------------------- | -------------------- |
| **Every file save** (IDE) | ESLint + Prettier (via IDE extensions)                         | No (editor warnings) |
| **Every commit**          | lint-staged (ESLint fix + Prettier + markdownlint)             | Yes                  |
| **Every commit message**  | commitlint (conventional commits)                              | Yes                  |
| **Every push**            | typecheck + unit tests with coverage + build                   | Yes                  |
| **Every push to main**    | Blocked — must use PR                                          | Yes                  |
| **CI (every PR)**         | lint + typecheck + test:unit + build                           | Yes                  |
| **CI (full / release)**   | All above + integration tests + spellcheck + deadcode + mdlint | Yes                  |
| **Pre-publish**           | Full CI pipeline                                               | Yes                  |
