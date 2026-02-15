// eslint.config.mjs — ESLint 9 flat config
// Single source of truth for all lint rules. No .eslintrc files.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import security from 'eslint-plugin-security';
import jsdoc from 'eslint-plugin-jsdoc';
import importX from 'eslint-plugin-import-x';
import unicorn from 'eslint-plugin-unicorn';
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
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── Security ─────────────────────────────────────────────────────────────
  security.configs.recommended,

  // ── JSDoc/TSDoc enforcement ──────────────────────────────────────────────
  jsdoc.configs['flat/recommended-typescript-error'],
  {
    rules: {
      'jsdoc/require-description': ['error', {
        contexts: ['TSMethodSignature', 'FunctionDeclaration', 'MethodDefinition'],
      }],
      'jsdoc/require-example': ['warn', {
        contexts: ['FunctionDeclaration', 'MethodDefinition'],
      }],
      'jsdoc/require-param-description': 'error',
      'jsdoc/require-returns-description': 'error',
      'jsdoc/check-tag-names': ['error', {
        definedTags: ['internal', 'ai', 'capability', 'recipe'],
      }],
      'jsdoc/tag-lines': ['error', 'any', { startLines: 1 }],
    },
  },

  // ── Import rules ─────────────────────────────────────────────────────────
  {
    plugins: { 'import-x': importX },
    rules: {
      'import-x/no-cycle': 'error',
      'import-x/no-self-import': 'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
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

  // ── Praman-specific rules ────────────────────────────────────────────────
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowHigherOrderFunctions: true,
      }],
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
      'no-console': 'error',
      'no-debugger': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
    },
  },

  // ── Module size warning (D27: ≤300 LOC guideline) ────────────────────────
  {
    rules: {
      'max-lines': ['warn', {
        max: 300,
        skipBlankLines: true,
        skipComments: true,
      }],
    },
  },

  // ── No page.waitForTimeout() (Principle 8: banned) ───────────────────────
  {
    rules: {
      'no-restricted-properties': ['error', {
        object: 'page',
        property: 'waitForTimeout',
        message: 'page.waitForTimeout() is banned (Principle 8). Use waitForUI5Stable() or auto-retry assertions.',
      }],
    },
  },

  // ── Test file overrides ──────────────────────────────────────────────────
  {
    files: ['tests/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'max-lines': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-example': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'security/detect-object-injection': 'off',
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

  // ── Prettier compatibility (must be last) ────────────────────────────────
  prettier,
);
