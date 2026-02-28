---
sidebar_position: 31
title: 'Docker & CI/CD'
---

# Docker & CI/CD

Praman's CI/CD pipeline runs on GitHub Actions with a 3-OS matrix, Docker support for containerized test execution, and comprehensive quality gates.

## GitHub Actions CI Pipeline

The CI workflow (`.github/workflows/ci.yml`) runs on every push to `main` and every pull request. It consists of 6 parallel jobs:

### Job Overview

```
+--------------------+     +-------------------------+     +-----------------+
| quality            |     | unit-tests              |     | build           |
| (lint, typecheck,  |     | (3 OS x 3 Node)         |     | (3 OS)          |
|  spell, deadcode,  |     | ubuntu/windows/macos    |     | ESM + CJS + DTS |
|  markdown lint)    |     | Node 20/22/24           |     | attw, size-limit|
+--------------------+     +-------------------------+     +-----------------+
         |                                                         |
         +-------------------------+-------------------------------+
                                   |
                    +--------------v--------------+
                    | integration-tests           |
                    | (PW 1.57.0, PW 1.58.2)      |
                    | SAP cloud auth via secrets   |
                    +-----------------------------+

+--------------------+     +-------------------------+
| security           |     | docs-check              |
| (npm audit)        |     | (TypeDoc + Docusaurus)  |
+--------------------+     +-------------------------+
```

### 3-OS Matrix (Unit Tests)

Unit tests run across a full OS and Node.js matrix:

```yaml
strategy:
  matrix:
    os: [ubuntu-latest, windows-latest, macos-latest]
    node-version: [20, 22, 24]
```

This produces 9 test runs (3 OS x 3 Node versions) to catch platform-specific issues early.

### Quality Job

```yaml
- run: npm run lint # ESLint with 11 plugins, 0 errors/warnings
- run: npm run typecheck # tsc --noEmit (strict mode)
- run: npx cspell "src/**/*.ts" "docs/**/*.md" --no-progress # Spell check
- run: npx knip # Dead code detection
- run: npx markdownlint-cli2 "**/*.md" # Markdown lint
```

### Build Job

```yaml
- run: npm run build # tsup: ESM + CJS + DTS
- run: node -e "const m = require('./dist/index.cjs'); ..." # CJS smoke test
- run: npx size-limit # Bundle size check
- run: npm run check:exports # attw: validate all 6 export maps
```

### Integration Tests

Integration tests run against SAP cloud systems with Playwright version matrix:

```yaml
strategy:
  matrix:
    playwright-version: ['1.57.0', '1.58.2']
env:
  SAP_CLOUD_BASE_URL: ${{ secrets.SAP_CLOUD_BASE_URL }}
  SAP_CLOUD_USERNAME: ${{ secrets.SAP_CLOUD_USERNAME }}
  SAP_CLOUD_PASSWORD: ${{ secrets.SAP_CLOUD_PASSWORD }}
```

### Security Scan

```yaml
- run: npm audit --audit-level=high
```

### Documentation Validation

```yaml
- run: npx typedoc --validation # TypeDoc API docs
- run: npm run build -- --no-minify # Docusaurus site build (in docs/)
```

### Azure Playwright Workspaces (Optional)

Triggered manually or by adding the `azure-test` label to a PR:

```yaml
- run: npx playwright test --config=playwright.service.config.ts --workers=20
  env:
    PLAYWRIGHT_SERVICE_URL: ${{ secrets.PLAYWRIGHT_SERVICE_URL }}
```

## npm run ci Breakdown

The local `npm run ci` command chains all quality gates:

```bash
npm run ci
# Equivalent to:
# npm run lint && npm run typecheck && npm run test:unit && npm run build
```

| Step       | Command                               | Purpose                                      |
| ---------- | ------------------------------------- | -------------------------------------------- |
| Lint       | `eslint src/ tests/ --max-warnings=0` | 11 ESLint plugins, zero tolerance            |
| Typecheck  | `tsc --noEmit`                        | TypeScript strict mode validation            |
| Unit tests | `vitest run`                          | Hermetic unit tests with Vitest              |
| Build      | `tsup`                                | Dual ESM + CJS output with type declarations |

Additional quality commands available:

| Command                           | Purpose                                   |
| --------------------------------- | ----------------------------------------- |
| `npm run test:unit -- --coverage` | Unit tests with V8 coverage               |
| `npm run check:exports`           | Validate all 6 sub-path exports with attw |
| `npm run format:check`            | Prettier formatting check                 |
| `npm run spellcheck`              | CSpell spell checking                     |
| `npm run deadcode`                | Knip dead code detection                  |
| `npm run mdlint`                  | Markdown lint                             |

## Docker for Running Tests

### Dockerfile for Test Execution

Create a `Dockerfile` for running Praman tests in a container:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app

# Copy package files and install
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and test files
COPY . .

# Build the project
RUN npm run build

# Install Playwright browsers
RUN npx playwright install --with-deps chromium

# Default: run all tests
CMD ["npm", "run", "test:integration"]
```

### Running Tests in Docker

```bash
# Build the test image
docker build -t praman-tests .

# Run integration tests
docker run --rm \
  -e SAP_CLOUD_BASE_URL="https://your-sap-system.example.com" \
  -e SAP_CLOUD_USERNAME="testuser" \
  -e SAP_CLOUD_PASSWORD="secret" \
  praman-tests

# Run only unit tests
docker run --rm praman-tests npm run test:unit

# Run with coverage
docker run --rm -v $(pwd)/coverage:/app/coverage \
  praman-tests npm run test:unit -- --coverage
```

### Docker Compose for Local SAP Mock

For local development with a mock SAP backend:

```yaml
# docker-compose.yml
services:
  sap-mock:
    image: node:20-slim
    working_dir: /app
    volumes:
      - ./tests/mocks/odata-server:/app
    command: node server.js
    ports:
      - '4004:4004'
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:4004/health']
      interval: 5s
      timeout: 3s
      retries: 5

  tests:
    build: .
    depends_on:
      sap-mock:
        condition: service_healthy
    environment:
      - SAP_CLOUD_BASE_URL=http://sap-mock:4004
      - SAP_CLOUD_USERNAME=mock-user
      - SAP_CLOUD_PASSWORD=mock-pass
    volumes:
      - ./playwright-report:/app/playwright-report
      - ./test-results:/app/test-results
```

Run the full stack:

```bash
# Start mock server and run tests
docker compose up --build --abort-on-container-exit

# View test results
open playwright-report/index.html
```

## Security Practices in CI

All GitHub Actions use SHA-pinned action references:

```yaml
- uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4
- uses: actions/setup-node@cdca7365b2dadb8aad0a33bc7601856ffabcc48e # v4
- uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4
```

Additional security measures:

- `permissions: contents: read` (minimal permissions)
- `concurrency` groups prevent duplicate runs
- `cancel-in-progress: true` for PRs
- SAP credentials stored as GitHub Secrets, never in code
- `npm audit --audit-level=high` in every CI run

## Coverage Reporting

Coverage artifacts are uploaded per-matrix entry for comparison:

```yaml
- uses: actions/upload-artifact
  with:
    name: coverage-${{ matrix.os }}-node-${{ matrix.node-version }}
    path: coverage/
```

Coverage thresholds are enforced per-file (not just project-wide):

| Tier   | Scope               | Statements | Branches |
| ------ | ------------------- | ---------- | -------- |
| Tier 1 | Error classes       | 100%       | 100%     |
| Tier 2 | Core infrastructure | 95%        | 90%      |
| Tier 3 | All other modules   | 90%        | 85%      |

## Praman-Specific Azure Playwright Configuration

When running Praman tests with [Azure Playwright Testing](https://learn.microsoft.com/en-us/azure/playwright-testing/), the bridge must communicate with cloud-hosted browsers. This works out of the box because the bridge uses standard `page.evaluate()` calls that serialize across remote browser connections.

### Service Configuration

Create a `playwright.service.config.ts` that extends your base config:

```typescript
import { defineConfig } from '@playwright/test';
import { getServiceConfig } from '@azure/microsoft-playwright-testing';
import baseConfig from './playwright.config';

export default defineConfig(baseConfig, getServiceConfig(baseConfig), {
  workers: 20,
  use: {
    // Increase timeouts for cloud browser latency
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  expect: {
    timeout: 10_000,
  },
});
```

### Environment Variables

Set these in your CI pipeline or `.env` file:

```bash
PLAYWRIGHT_SERVICE_URL=wss://eastus.api.playwright.microsoft.com/...
PLAYWRIGHT_SERVICE_ACCESS_TOKEN=<your-token>
# Praman bridge timeout (higher for cloud latency)
PRAMAN_CONTROL_DISCOVERY_TIMEOUT=45000
```

### Worker and Timeout Considerations

Azure Playwright Testing supports up to 50 parallel workers. Keep these points in mind:

- **SAP session limits**: Your SAP system may restrict concurrent sessions per user. Use separate test accounts per worker shard, or reduce `workers` to match your license.
- **Bridge injection latency**: Cloud browsers add 50-200ms round-trip overhead per `page.evaluate()` call. Increase `controlDiscoveryTimeout` to 45 seconds or higher.
- **Auth state reuse**: Use Playwright's `storageState` to persist authentication and avoid re-login on every worker. This is especially important at scale because SAP IdP rate-limits login attempts.

### Running in CI

```yaml
- name: Run Praman tests on Azure Playwright
  run: npx playwright test --config=playwright.service.config.ts
  env:
    PLAYWRIGHT_SERVICE_URL: ${{ secrets.PLAYWRIGHT_SERVICE_URL }}
    PLAYWRIGHT_SERVICE_ACCESS_TOKEN: ${{ secrets.PLAYWRIGHT_SERVICE_ACCESS_TOKEN }}
    SAP_CLOUD_BASE_URL: ${{ secrets.SAP_CLOUD_BASE_URL }}
    PRAMAN_CONTROL_DISCOVERY_TIMEOUT: '45000'
```
