// eslint.config.mjs — ESLint 9 flat config
// Single source of truth for all lint rules. No .eslintrc files.
// Configured for: TypeScript, Playwright, Node.js, Security (Microsoft SDL + OWASP)
// Best practices: Microsoft, Node.js, Google, SonarJS quality rules
// Documentation: Microsoft TSDoc (TypeScript Documentation Standard)
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
import pramanPlugin from './eslint-rules/index.js';

export default tseslint.config(
  // ── Global ignores ───────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'node_modules/**',
      'docs/**',
      '*.config.{js,mjs,ts}',
      'eslint-rules/**',
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
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Security ─────────────────────────────────────────────────────────────
  {
    plugins: {
      security,
      '@microsoft/sdl': microsoftSdl,
    },
    rules: {
      // OWASP Security plugin rules
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

      // Microsoft Security Development Lifecycle (SDL) rules
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

  // ── Node.js best practices (aligned with Node.js LTS) ────────────────────
  nodePlugin.configs['flat/recommended'],
  {
    rules: {
      'n/no-missing-import': 'off', // TypeScript handles this
      'n/no-unpublished-import': 'off', // TypeScript handles this
      'n/no-unsupported-features/es-syntax': 'off', // We use ESM
      'n/file-extension-in-import': 'off',
      'n/prefer-global/buffer': ['error', 'never'],
      'n/prefer-global/process': ['error', 'never'],
      'n/prefer-promises/dns': 'error',
      'n/prefer-promises/fs': 'error',
      'n/no-process-exit': 'error',
    },
  },

  // ── Promise best practices ───────────────────────────────────────────────
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

  // ── SonarJS (Google/industry code quality rules) ─────────────────────────
  sonarjs.configs.recommended,
  {
    rules: {
      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      'sonarjs/todo-tag': 'warn', // TODOs are acceptable during development
      'sonarjs/no-commented-code': 'warn', // Warn but don't block
    },
  },

  // ── TSDoc enforcement (Microsoft TypeScript Documentation Standard) ───────
  {
    plugins: {
      tsdoc,
    },
    rules: {
      // ═══════════════════════════════════════════════════════════════════════
      // Microsoft TSDoc Standard (Official TypeScript Documentation)
      // @see https://tsdoc.org/
      // ═══════════════════════════════════════════════════════════════════════
      'tsdoc/syntax': 'error', // Validate TSDoc syntax

      // Note: TSDoc is minimalist by design. It validates syntax and structure
      // but does not enforce documentation completeness. For stricter enforcement,
      // consider using TypeDoc's validation during the docs build step.
      //
      // TSDoc standard tags:
      // - @remarks - Additional context
      // - @example - Code examples
      // - @param - Parameter documentation (no types, use TypeScript)
      // - @returns - Return value documentation
      // - @throws - Exception documentation (no types)
      // - @see - Cross-references
      // - @deprecated - Deprecation notices
      // - @public/@internal/@private - API visibility
      //
      // Custom tags defined in tsdoc.json:
      // - @intent, @guarantee, @capability - AI-first design
      // - @sapModule, @ui5Version, @fioriElement - SAP domain
      // - @failureMode, @prerequisite, @postcondition - Testing
    },
  },

  // ── Import rules ─────────────────────────────────────────────────────────
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

  // ── Unicorn (modern JS/TS best practices) ────────────────────────────────
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

  // ── Praman-specific rules (TypeScript + Microsoft best practices) ─────────
  {
    rules: {
      // TypeScript strict rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
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
        {
          allowExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-confusing-void-expression': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',

      // Naming conventions (Microsoft/TypeScript official style)
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

      // JavaScript/ECMAScript best practices
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
      'require-atomic-updates': 'error',
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
      // Relax strict rules for tests
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
      'jsdoc/require-jsdoc': 'off',
      'security/detect-object-injection': 'off',
      'sonarjs/no-duplicate-string': 'off',

      // Playwright best practices (enforced)
      'playwright/no-wait-for-timeout': 'error', // Aligns with Principle 8
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

      // Async/await enforcement for Playwright API
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/promise-function-async': 'error',
      'promise/catch-or-return': 'error',
      'promise/always-return': 'error',
    },
  },

  // ── Browser-evaluated scripts override ───────────────────────────────────
  {
    files: ['src/bridge/browser-scripts/**/*.ts'],
    rules: {
      'max-lines': 'off',
      'security/detect-new-buffer': 'off',
      'no-eval': 'off',
    },
  },

  // ── UI5 deprecated API detection (warn, non-blocking in CI) ─────────────
  {
    plugins: { praman: pramanPlugin },
    rules: {
      'praman/no-deprecated-ui5-globals': 'warn',
      'praman/no-deprecated-ui5-api': 'warn',
    },
  },

  // ── Prettier compatibility (must be last) ────────────────────────────────
  prettier,
);
