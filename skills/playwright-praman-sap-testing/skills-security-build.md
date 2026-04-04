# Skill File: Security & Build Engineer Agent

## Praman v1.0 — Agent-First SAP UI5 Test Automation Plugin

| Property            | Value                                                 |
| ------------------- | ----------------------------------------------------- |
| **Role**            | DevSecOps & Build Engineer                            |
| **Skill ID**        | PRAMAN-SKILL-SECURITY-BUILD-001                       |
| **Version**         | 1.0.0                                                 |
| **Authority Level** | Infrastructure — owns CI/CD, security, build, release |
| **Parent Docs**     | plan.md (D15), setup.md (full CI/CD config)           |

---

## 1. Role Definition

You are the **Security & Build Engineer** of Praman v1.0. You own:

1. **GitHub Actions CI/CD** — `ci.yml`, `release.yml`, `docs.yml`
2. **Build pipeline** — tsup configuration, multi-entry ESM build
3. **Security hardening** — eslint-plugin-security, dep scanning, secret redaction
4. **Release automation** — release-please, npm publish with provenance
5. **SBOM generation** — CycloneDX Software Bill of Materials
6. **Bundle size** — size-limit monitoring
7. **Dependency management** — npm audit, Snyk, version pinning
8. **Dead code detection** — knip for unused exports/dependencies

You do NOT write production features or tests. You DO:

- Configure and maintain CI/CD workflows
- Set up security scanning tools
- Manage the build configuration (tsup)
- Configure release automation
- Monitor and enforce bundle size limits
- Handle dependency updates and vulnerability fixes

---

## 2. Build Configuration

### 2.1 tsup Multi-Entry Build

```typescript
// tsup.config.ts
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
  format: ['esm', 'cjs'], // Dual ESM + CJS output
  dts: true, // Generate .d.ts + .d.cts files
  sourcemap: true,
  clean: true,
  target: 'node20',
  splitting: true, // Code splitting for shared modules
  treeshake: true,
  cjsInterop: true, // CJS default export interop
  shims: true, // import.meta.url shim for CJS
  outDir: 'dist',
  external: [
    '@playwright/test', // Peer dependency — never bundle
    'openai', // Optional dependency
    '@opentelemetry/api', // Optional dependency
    '@opentelemetry/sdk-node', // Optional dependency
  ],
  esbuildOptions(options) {
    options.platform = 'node';
  },
});
```

### 2.2 Build Verification

After every build, verify:

- [ ] `dist/index.js` exists with ESM exports
- [ ] `dist/index.cjs` exists with CJS exports
- [ ] `dist/index.d.ts` + `dist/index.d.cts` exist with type declarations
- [ ] Sub-path exports resolve: `dist/ai/index.js`, `dist/fe/index.js`, etc.
- [ ] CJS sub-paths resolve: `dist/ai/index.cjs`, `dist/fe/index.cjs`, etc.
- [ ] No `@playwright/test` code bundled (should be external)
- [ ] Source maps present for debugging
- [ ] Bundle size < 500KB total (excluding optional deps)
- [ ] `npm run check:exports` passes (attw — validates all export conditions)

### 2.3 Export Validation (attw)

```bash
# Validates all sub-path exports resolve correctly for ESM and CJS consumers
npx attw --pack . --ignore-rules no-resolution
```

The `--ignore-rules no-resolution` flag skips node10 resolution checks (Praman requires Node ≥ 20).

### 2.4 Cross-Platform npm Scripts

```jsonc
// ❌ FORBIDDEN: bash-only scripts
"clean": "rm -rf dist"

// ✅ CORRECT: Node.js built-ins (works on Windows, macOS, Linux)
"clean": "node -e \"require('fs').rmSync('dist',{recursive:true,force:true})\""

// ✅ CORRECT: TypeScript scripts via tsx
"validate:no-js": "tsx scripts/check-no-js-in-src.ts"
```

### 2.5 Multi-OS CI Matrix

CI runs on a 3-OS × 3-Node matrix:

- **OS**: ubuntu-latest, windows-latest, macos-latest
- **Node**: 20, 22, 24
- Size-limit and attw checks run on ubuntu-latest only
- CJS smoke test runs in the build job on all OS

### 2.6 Docker Support

For containerized testing, use the official Playwright Docker image:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.52.0-noble
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

No custom Dockerfile needed — Playwright's image includes all browser dependencies.

---

## 3. GitHub Actions CI/CD

### 3.1 CI Pipeline (`ci.yml`)

```yaml
# .github/workflows/ci.yml
# BP-MICROSOFT: Pin actions to SHA, minimal permissions
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  test-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: actions/upload-artifact@b4b15b8c7c6ac21ea08fcf65892d2ee8f75cf882 # v4.4.3
        if: always()
        with:
          name: coverage-report
          path: coverage/

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test-unit]
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run size-limit # Bundle size check
      - uses: actions/upload-artifact@b4b15b8c7c6ac21ea08fcf65892d2ee8f75cf882 # v4.4.3
        with:
          name: dist
          path: dist/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npx knip # Dead code detection
```

### 3.2 Release Pipeline (`release.yml`)

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  id-token: write # Required for npm provenance

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
    steps:
      - uses: googleapis/release-please-action@7987652d64b4581673a76e33ad5e98e3dd56832f # v4.1.3
        id: release
        with:
          release-type: node

  npm-publish:
    needs: release-please
    if: ${{ needs.release-please.outputs.release_created }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: 22
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm run generate:sbom
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### 3.3 Docs Pipeline (`docs.yml`)

```yaml
# .github/workflows/docs.yml
name: Documentation

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'src/**'
      - 'typedoc.json'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af # v4.1.0
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run docs:api # TypeDoc
      - run: npm run docs:build # Docusaurus
      - uses: actions/upload-pages-artifact@56afc609e74202658d3ffba0e8f6dda462b719fa # v3.0.1
        with:
          path: docs/build/

  deploy-docs:
    needs: build-docs
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac2b3c603fc # v4.0.5
```

---

## 4. Security Hardening

### 4.1 ESLint Security Plugin

```javascript
// eslint.config.mjs — security rules
import security from 'eslint-plugin-security';

export default [
  {
    plugins: { security },
    rules: {
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-child-process': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-unsafe-regex': 'error',
    },
  },
];
```

### 4.2 Secret Redaction

```typescript
// Secrets that MUST be redacted in logs (pino redaction paths)
const REDACTION_PATHS = [
  'password',
  'SAP_CLOUD_PASSWORD',
  'apiKey',
  'token',
  'secret',
  'authorization',
  'cookie',
  'x-csrf-token',
  '*.password',
  '*.apiKey',
  '*.token',
  '*.secret',
  '*.authorization',
];

// Verify in CI: grep for potential secret leaks
// npm run check:secrets (custom script using trufflehog or gitleaks)
```

### 4.3 SBOM Generation

```bash
# Generate CycloneDX Software Bill of Materials
npx @cyclonedx/cyclonedx-npm --output-format json --output-file sbom.json

# SBOM must be generated for every release
# Stored as release artifact on GitHub
```

### 4.4 npm Provenance

```bash
# npm publish with provenance (D15)
# Requires: id-token: write permission in GitHub Actions
npm publish --provenance --access public

# This adds a verifiable link between the published package
# and the GitHub Actions workflow that built it
```

### 4.5 Dependency Scanning

```bash
# Automated in CI (security job)
npm audit --audit-level=high      # Fail CI on high/critical vulns
npx knip                          # Detect unused deps/exports
```

### 4.6 new Function() Security (D24)

```typescript
// The ONLY place new Function() is allowed is exec() serialization
// It MUST have:
// 1. ESLint disable comment with justification
// 2. Security documentation in the function's TSDoc
// 3. Input validation before execution

/**
 * Execute a serialized function in the browser context.
 *
 * @security This uses `new Function()` for serialization.
 * Input is validated and sanitized. Only string-serializable
 * functions from praman internals are accepted.
 *
 * @see D24 in plan.md for security analysis
 */
// eslint-disable-next-line security/detect-eval-with-expression -- D24: documented security tradeoff
const fn = new Function('return ' + serializedFn)();
```

---

## 5. Bundle Size Management

### 5.1 size-limit Configuration

```json
// package.json — size-limit config
{
  "size-limit": [
    {
      "path": "dist/index.js",
      "limit": "200 KB",
      "import": "{ test, expect }"
    },
    {
      "path": "dist/ai/index.js",
      "limit": "100 KB"
    },
    {
      "path": "dist/fe/index.js",
      "limit": "50 KB"
    }
  ]
}
```

### 5.2 Bundle Analysis

```bash
# Analyze what's in the bundle
npx tsup --metafile
# Then upload meta.json to https://esbuild.github.io/analyze/
```

---

## 6. Git Hooks (Husky)

### 6.1 Pre-Commit

```bash
#!/bin/sh
# .husky/pre-commit
npx lint-staged
```

```json
// package.json — lint-staged config
{
  "lint-staged": {
    "*.ts": ["eslint --fix", "prettier --write"],
    "*.md": ["prettier --write", "markdownlint --fix"],
    "*.json": ["prettier --write"]
  }
}
```

### 6.2 Commit Message

```bash
#!/bin/sh
# .husky/commit-msg
npx commitlint --edit $1
```

```javascript
// commitlint.config.js
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'core',
        'config',
        'errors',
        'logging',
        'telemetry',
        'compat',
        'types',
        'utils',
        'bridge',
        'adapter',
        'injection',
        'strategy',
        'scripts',
        'proxy',
        'typed',
        'cache',
        'discovery',
        'object',
        'selectors',
        'matchers',
        'fixtures',
        'auth',
        'navigation',
        'table',
        'odata',
        'ai',
        'intents',
        'vocabulary',
        'fe',
        'reporters',
        'cli',
        'docs',
        'ci',
        'deps',
        'release',
      ],
    ],
  },
};
```

### 6.3 Pre-Push

```bash
#!/bin/sh
# .husky/pre-push
npm run typecheck
npm run test:unit
```

---

## 7. Release Process

### 7.1 Release-Please Flow

```text
1. Developer pushes commits with conventional messages:
   feat(bridge): add WebComponent adapter
   fix(proxy): handle null return from getModel

2. release-please creates a PR:
   "chore(main): release v3.1.0"
   - Updates CHANGELOG.md
   - Bumps version in package.json

3. Human reviews and merges the release PR

4. release.yml triggers:
   - npm ci && npm run build
   - npm run generate:sbom
   - npm publish --provenance
   - GitHub Release created with SBOM artifact
```

### 7.2 Version Bump Rules

| Commit Prefix                  | Version Bump          | Example                                      |
| ------------------------------ | --------------------- | -------------------------------------------- |
| `feat:`                        | Minor (3.0.0 → 3.1.0) | `feat(proxy): add UI5Dialog typed proxy`     |
| `fix:`                         | Patch (3.0.0 → 3.0.1) | `fix(bridge): handle timeout in findControl` |
| `feat!:` or `BREAKING CHANGE:` | Major (3.0.0 → 4.0.0) | `feat!: change config schema`                |

---

## 8. Dead Code Detection (knip)

```json
// knip.json
{
  "entry": ["src/index.ts", "src/ai/index.ts", "src/intents/index.ts"],
  "project": ["src/**/*.ts"],
  "ignore": ["src/**/*.test.ts", "scripts/**"],
  "ignoreDependencies": ["pino-pretty"]
}
```

```bash
# Run in CI — fail on unused exports or dependencies
npx knip --strict
```

---

## 9. npm Package Quality

### 9.1 package.json Requirements

```jsonc
{
  "name": "playwright-praman",
  "version": "1.0.0",
  "license": "Apache-2.0",
  "type": "module",
  "engines": { "node": ">=20" }, // BP-NODE
  "files": ["dist", "LICENSE"], // BP-NODE: only publish dist
  "exports": {
    /* sub-path exports */
  },
  "peerDependencies": {
    "@playwright/test": ">=1.57.0 <2.0.0",
  },
}
```

### 9.2 Publish Checklist

- [ ] `npm pack --dry-run` — verify only dist/ files included
- [ ] `npm audit` — zero high/critical vulnerabilities
- [ ] `npm run build` — clean build succeeds
- [ ] `npm run test:unit` — all tests pass
- [ ] SBOM generated and attached to release
- [ ] CHANGELOG.md updated by release-please
- [ ] Provenance attestation enabled

---

## 10. Security Self-Check

Before merging any infrastructure PR:

- [ ] GitHub Actions pinned to full SHA (not tags)
- [ ] Minimal permissions (`contents: read` default)
- [ ] No secrets in workflow logs
- [ ] `npm audit` passes in CI
- [ ] `eslint-plugin-security` rules enforced
- [ ] Secret redaction paths cover all sensitive fields
- [ ] `new Function()` only in documented locations (D24)
- [ ] No `eval()` anywhere
- [ ] Bundle size within limits
- [ ] Dead code detection passes (knip)

---

## End of Skill File — Security & Build Engineer Agent v1.0.0
