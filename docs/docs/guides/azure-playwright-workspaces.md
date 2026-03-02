---
sidebar_position: 32
title: 'Azure Playwright Workspaces'
---

# Azure Playwright Workspaces

Run Praman SAP UI5 tests at scale using cloud-hosted browsers with **Azure Playwright Workspaces** — no local machine required. GitHub Actions runs your test code, Azure runs the browsers, and your SAP system is tested end-to-end.

## Overview

Azure Playwright Workspaces is a Microsoft-managed service that provides cloud-hosted browsers for Playwright tests. Combined with GitHub Actions, it creates a **fully automated, zero-local-machine** testing pipeline for SAP applications.

```
┌───────────┐   push/PR/cron   ┌──────────────────────┐   WebSocket    ┌───────────────┐
│  GitHub   │ ───────────────► │  GitHub Actions       │ ◄════════════► │  Azure Cloud  │
│  Repo     │                  │  Runner (ubuntu)      │  Playwright    │  Browsers     │
│           │                  │                       │  Protocol      │               │
│  • tests/ │                  │  Runs:                │                │  Runs:        │
│  • src/   │                  │  • Node.js workers    │                │  • Chromium   │
│  • config │                  │  • playwright-praman  │                │  • Firefox    │
│           │                  │  • fixtures/proxies   │  page.eval()   │  • WebKit     │
│           │                  │  • assertions         │ ──────────────►│               │
│  YOU DO   │                  │                       │                │  Reaches SAP  │
│  NOTHING  │                  │  YOU DO NOTHING       │  ◄──results──  │  Cloud direct │
└───────────┘                  └──────────────────────┘                └───────────────┘
                                        │
                                        ▼
                               ┌──────────────────┐
                               │  GitHub Artifacts │
                               │  • HTML report    │
                               │  • Traces         │
                               │  • Screenshots    │
                               └──────────────────┘
```

### What runs where

| Component                  | Runs On               | Details                                                       |
| -------------------------- | --------------------- | ------------------------------------------------------------- |
| **Test code (`.spec.ts`)** | GitHub Actions runner | Node.js worker processes execute your test files              |
| **playwright-praman**      | GitHub Actions runner | Fixtures, proxy, bridge setup, matchers — all Node.js code    |
| **Browser instances**      | Azure cloud           | Chromium, Firefox, or WebKit — managed by Microsoft           |
| **`page.evaluate()`**      | Azure cloud browser   | UI5 bridge scripts execute in the remote browser's JS context |
| **SAP application**        | SAP Cloud (BTP/S4)    | Cloud browsers access your SAP system over the internet       |
| **Your local machine**     | Not involved          | Push to GitHub and review results — that's it                 |

:::info Key insight
Playwright Workspaces uses `browserType.connect()` (full Playwright protocol over WebSocket). This means **all Playwright APIs work identically** — `page.evaluate()`, `addInitScript()`, `selectors.register()`, custom fixtures. Only the browser runs remotely; your test logic stays on the runner.
:::

## Architecture

### Split Execution Model

Playwright Workspaces does **not** run your tests entirely in Azure. It's a split model:

1. **Client side** (GitHub Actions runner): Playwright Test runner, worker processes, your test code, npm packages, fixtures, assertions
2. **Cloud side** (Azure): Browser instances only — DOM rendering, JavaScript execution in browser context, network requests from the browser

This split is transparent to your tests. When your test calls `page.goto()` or `page.evaluate()`, the Playwright protocol serializes the command over WebSocket to the remote browser.

### Data Flow: SAP E2E Test Execution

```
Step 1: GitHub Actions trigger (push / PR / cron / manual)
   │
   ▼
Step 2: Runner installs deps (npm ci, playwright install)
   │
   ▼
Step 3: @azure/playwright sets connectOptions → WebSocket to Azure
   │
   ▼
Step 4: playwright-praman fixtures initialize
   │  ├── Config loaded (Zod validation)
   │  ├── UI5 bridge scripts prepared
   │  └── Selector engine registered
   │
   ▼
Step 5: Auth setup project runs
   │  ├── page.goto(SAP_CLOUD_BASE_URL) → remote browser navigates to SAP
   │  ├── page.evaluate() detects login form → fills credentials
   │  ├── storageState saved → .auth/sap-session.json on runner
   │  └── Session cookies captured for reuse
   │
   ▼
Step 6: Test projects run (depend on auth setup)
   │  ├── storageState loaded → authenticated session
   │  ├── page.addInitScript() injects __praman_bridge into remote browser
   │  ├── ui5.control() → page.evaluate() → bridge resolves UI5 control
   │  ├── proxy.setValue() → page.evaluate() → bridge calls control method
   │  ├── waitForUI5Stable() → page.evaluate() → polls getUIPending()
   │  └── expect(proxy).toHaveUI5Text() → web-first retry assertion
   │
   ▼
Step 7: Results collected
   ├── HTML report uploaded as GitHub artifact
   ├── Trace files (on failure) uploaded
   ├── Screenshots (on failure) uploaded
   └── Test results visible in GitHub Actions UI
```

### Praman Compatibility

Every Praman feature works with remote browsers because the split is at the browser boundary:

| Praman Feature                              | How It Works Remotely                                                                               |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **`test.extend()` fixtures**                | Fixture setup/teardown runs on the runner. `page` object points to remote browser transparently.    |
| **`page.evaluate()` bridge scripts**        | Function body serialized over WebSocket, executed in remote browser's JS context. Results returned. |
| **`page.addInitScript()` bridge injection** | Script sent via Playwright protocol. Executes in remote browser on every navigation.                |
| **`selectors.register()` (`ui5=` engine)**  | Selector engine script sent to remote browser via protocol. Works like local.                       |
| **Custom matchers (`toHaveUI5Text`)**       | Use `page.evaluate()` internally — same serialization path.                                         |
| **`waitForUI5Stable()`**                    | Polls via `page.evaluate()` in remote browser. Works identically.                                   |
| **`storageState` auth**                     | JSON file on runner filesystem. Playwright sends cookies to remote browser context.                 |
| **Pino logging**                            | Runs Node.js side on the runner. No browser dependency.                                             |
| **Traces and screenshots**                  | Captured by Playwright protocol from remote browser. Transferred to runner.                         |

## Prerequisites

- **Azure subscription** with Owner or Contributor role
- **SAP Cloud system** (BTP, S/4HANA Cloud) accessible over the internet
- **GitHub repository** with your Praman test code
- **Azure CLI** installed locally (for initial setup only)

## Setup Guide

### Step 1: Create Azure Playwright Workspace

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Select **Create a resource** → search for **Playwright Workspaces**
3. Configure:

| Field              | Value                                                            |
| ------------------ | ---------------------------------------------------------------- |
| **Subscription**   | Your Azure subscription                                          |
| **Resource group** | Create new or use existing                                       |
| **Name**           | e.g., `praman-sap-testing`                                       |
| **Location**       | Choose closest to your SAP system (e.g., West Europe for EU BTP) |

4. Select **Review + Create** → **Create**
5. Once deployed, go to the resource → **Get Started** → copy the **endpoint URL**

### Step 2: Install Azure Packages

```bash
npm install --save-dev @azure/playwright @azure/identity dotenv
```

### Step 3: Create Service Config

Create `playwright.service.config.ts` in your project root:

```typescript
import { createAzurePlaywrightConfig, ServiceOS } from '@azure/playwright';
import { defineConfig } from '@playwright/test';
import { DefaultAzureCredential } from '@azure/identity';
import config from './playwright.config';

export default defineConfig(
  config,
  createAzurePlaywrightConfig(config, {
    os: ServiceOS.LINUX,
    credential: new DefaultAzureCredential(),
    // Increase connect timeout for initial browser allocation
    connectTimeout: 30_000,
  }),
);
```

:::tip SAP on-premise systems
If your SAP system is behind a VPN or corporate firewall (not publicly accessible), add `exposeNetwork` to tunnel traffic through the runner:

```typescript
createAzurePlaywrightConfig(config, {
  os: ServiceOS.LINUX,
  credential: new DefaultAzureCredential(),
  exposeNetwork: '*.your-sap-domain.internal',
});
```

For SAP BTP / S/4HANA Cloud (publicly accessible), no `exposeNetwork` is needed.
:::

### Step 4: Configure Environment

Add to your `.env` file:

```bash
PLAYWRIGHT_SERVICE_URL=wss://eastus.api.playwright.microsoft.com/accounts/YOUR_WORKSPACE_ID/browsers
```

### Step 5: Configure GitHub Secrets

In your GitHub repository → **Settings** → **Secrets and variables** → **Actions**, add:

| Secret                   | Value                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `PLAYWRIGHT_SERVICE_URL` | The endpoint URL from Step 1                                                            |
| `SAP_CLOUD_BASE_URL`     | Your SAP system URL (e.g., `https://my-system.launchpad.cfapps.eu10.hana.ondemand.com`) |
| `SAP_CLOUD_USERNAME`     | SAP test user username                                                                  |
| `SAP_CLOUD_PASSWORD`     | SAP test user password                                                                  |
| `SAP_CLIENT`             | SAP client number (e.g., `100`)                                                         |
| `AZURE_TENANT_ID`        | Azure AD tenant ID (for service principal auth)                                         |
| `AZURE_CLIENT_ID`        | Service principal client ID                                                             |
| `AZURE_CLIENT_SECRET`    | Service principal secret                                                                |

:::warning Test user best practices

- Use a **dedicated technical test user** — never personal credentials
- Disable MFA/2FA for the test user (or use certificate-based auth)
- Grant minimum required SAP roles for your test scenarios
- Rotate credentials regularly via GitHub secret rotation
  :::

### Step 6: GitHub Actions Workflow

The CI workflow already includes an Azure Playwright Workspaces job. It runs on `workflow_dispatch` (manual) or when a PR is labeled `azure-test`:

```yaml
azure-playwright:
  name: Azure Playwright Workspaces
  runs-on: ubuntu-latest
  timeout-minutes: 30
  if: github.event_name == 'workflow_dispatch' || contains(github.event.pull_request.labels.*.name, 'azure-test')
  needs: [quality, build]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version-file: '.nvmrc'
        cache: 'npm'
    - run: npm ci
    - uses: actions/download-artifact@v4
      with:
        name: dist
        path: dist/
    - run: npx playwright install --with-deps chromium
    - name: Run tests on Azure Playwright Workspaces
      run: npx playwright test --config=playwright.service.config.ts --workers=20
      env:
        PLAYWRIGHT_SERVICE_URL: ${{ secrets.PLAYWRIGHT_SERVICE_URL }}
        SAP_CLOUD_BASE_URL: ${{ secrets.SAP_CLOUD_BASE_URL }}
        SAP_CLOUD_USERNAME: ${{ secrets.SAP_CLOUD_USERNAME }}
        SAP_CLOUD_PASSWORD: ${{ secrets.SAP_CLOUD_PASSWORD }}
        SAP_CLIENT: ${{ secrets.SAP_CLIENT }}
        AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
        AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
        AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
    - uses: actions/upload-artifact@v4
      if: ${{ !cancelled() }}
      with:
        name: azure-playwright-report
        path: playwright-report/
        retention-days: 14
```

To enable additional triggers (nightly, every push to main), add:

```yaml
on:
  schedule:
    - cron: '0 2 * * *' # Nightly at 2 AM UTC
  push:
    branches: [main]
```

## Running Tests

### Local Development (with Cloud Browsers)

```bash
# Authenticate with Azure CLI
az login

# Run a single test against cloud browsers
npx playwright test tests/e2e/my-test.spec.ts --config=playwright.service.config.ts

# Run full suite with 20 parallel workers
npx playwright test --config=playwright.service.config.ts --workers=20
```

### CI (Fully Automated)

1. Push your code to GitHub (or create a PR)
2. Apply the `azure-test` label, or trigger manually via **Actions** → **Run workflow**
3. Review results in the GitHub Actions UI
4. Download HTML report and traces from the **Artifacts** section

### VS Code Integration

1. Install the [Playwright Test extension](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)
2. Open **Test Explorer** → **Select Default Profile**
3. Choose projects from `playwright.service.config.ts`
4. Run or debug tests — browsers run in Azure, debugging works locally

## Configuration Tuning

### Timeouts

Remote browsers add network latency. Adjust timeouts in your service config:

```typescript
export default defineConfig(
  config,
  createAzurePlaywrightConfig(config, {
    os: ServiceOS.LINUX,
    credential: new DefaultAzureCredential(),
    connectTimeout: 30_000,
  }),
  {
    // Override timeouts for cloud execution
    timeout: 120_000, // Test timeout (SAP tests are slow)
    expect: { timeout: 15_000 }, // Assertion retry timeout
    use: {
      actionTimeout: 30_000,
      navigationTimeout: 120_000,
      // Set timezone explicitly — cloud browser may differ
      timezoneId: 'Europe/Berlin',
    },
  },
);
```

### Trace Configuration

Traces are transferred from Azure to the runner over the network. For large test suites, tune tracing:

```typescript
use: {
  trace: 'retain-on-failure',    // Only capture when tests fail
  screenshot: 'only-on-failure',  // Minimize data transfer
  video: 'off',                   // Video is expensive over network
}
```

### Parallel Workers

SAP tests can run in parallel if they don't share state:

| Scenario                           | Workers | Notes                                         |
| ---------------------------------- | ------- | --------------------------------------------- |
| Sequential SAP tests (shared data) | `1`     | Current default — safe                        |
| Independent SAP apps               | `5-10`  | Each test targets a different app             |
| Read-only SAP tests                | `10-20` | No write conflicts                            |
| Cross-browser matrix               | `20-50` | Same tests across Chromium + Firefox + WebKit |

```bash
npx playwright test --config=playwright.service.config.ts --workers=20
```

## Network Access Patterns

### SAP BTP / S/4HANA Cloud (Public)

```
GitHub Runner ──WebSocket──► Azure Browsers ──HTTPS──► SAP BTP (public URL)
```

No special configuration needed. Cloud browsers have standard internet access.

### SAP On-Premise (Behind Firewall)

```
GitHub Runner ──WebSocket──► Azure Browsers ──tunnel──► GitHub Runner ──VPN──► SAP On-Prem
```

Use `exposeNetwork` to route SAP traffic through the runner:

```typescript
createAzurePlaywrightConfig(config, {
  exposeNetwork: '*.sap-corp.internal,10.0.0.0/8',
});
```

The runner must have network access to the SAP system (e.g., via a self-hosted GitHub runner on your corporate network).

### SAP on localhost (Development)

```
GitHub Runner ──WebSocket──► Azure Browsers ──tunnel──► GitHub Runner ──localhost──► SAP proxy
```

```typescript
createAzurePlaywrightConfig(config, {
  exposeNetwork: '<loopback>',
});
```

## Limitations

| Limitation                        | Impact                                                   | Mitigation                                                  |
| --------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| **Headed mode not available**     | Cannot use `headless: false` on cloud browsers           | Use local browsers for interactive debugging                |
| **Network latency**               | `page.evaluate()` round-trips are ~10-50ms vs ~1ms local | Increase timeouts; reduce unnecessary evaluate calls        |
| **`download.path()` unavailable** | Cannot read download file path directly                  | Use `download.saveAs()` instead                             |
| **Timezone mismatch**             | Cloud browser timezone may differ from SAP system        | Set `timezoneId` explicitly                                 |
| **Max 100 workers**               | Hard limit per workspace                                 | Sufficient for SAP testing (SAP itself is the bottleneck)   |
| **Playwright version matching**   | Client major.minor must match cloud service              | Praman supports `>=1.57.0` — Azure supports recent versions |
| **No macOS cloud browsers**       | Only Linux and Windows available                         | macOS rarely needed for SAP Fiori (web-based)               |

## Cost

Azure Playwright Workspaces bills per **test minute** (browser time):

| Scenario                 | Est. Monthly Minutes          | Cost                      |
| ------------------------ | ----------------------------- | ------------------------- |
| 10 SAP tests, 3 runs/day | ~450 min                      | Free tier or minimal      |
| 50 SAP tests, nightly    | ~7,500 min                    | Moderate                  |
| 100 tests, 20 workers    | Same total, faster wall-clock | Same cost, faster results |

Free trial includes **100 test minutes/month**.

:::tip Cost optimization

- Use `trace: 'retain-on-failure'` to avoid capturing traces for passing tests
- Run only changed test files on PRs; full suite on nightly schedule
- Use `workers: 1` for sequential SAP tests to avoid billing for idle browser wait time
  :::

## Troubleshooting

### Connection Timeout

```
Error: browserType.connect: Timeout 30000ms exceeded.
```

Increase `connectTimeout` in the service config. Check that `PLAYWRIGHT_SERVICE_URL` is correct.

### SAP System Unreachable

```
Error: page.goto: net::ERR_CONNECTION_REFUSED
```

For public SAP systems, verify the URL is accessible from Azure's network. For private systems, configure `exposeNetwork`.

### Auth Failures in CI

Ensure all SAP secrets are configured in GitHub. Check that `DefaultAzureCredential` can authenticate — in CI, this requires `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, and `AZURE_CLIENT_SECRET`.

### Flaky Tests (Timing)

Cloud browsers add latency. If tests pass locally but fail in Azure:

- Increase `actionTimeout` and `navigationTimeout`
- Add explicit `timezoneId` if date assertions fail
- Use `waitForUI5Stable()` (Praman handles this automatically)
