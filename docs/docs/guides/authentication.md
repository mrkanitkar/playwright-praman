---
title: Authentication Guide
description: '6 SAP authentication strategies for Playwright tests: BTP SAML, Basic Auth, Office 365, Client Certificate, Custom IDP, and Manual login.'
keywords:
  - sap authentication playwright
  - sap btp saml authentication playwright
  - sap btp test automation
  - sap fiori login automation
---

Praman supports 6 pluggable authentication strategies for SAP systems.

## Strategies

| Strategy         | Use Case                                      | Config Value     |
| ---------------- | --------------------------------------------- | ---------------- |
| **On-Premise**   | On-premise SAP NetWeaver / S/4HANA            | `'onprem'`       |
| **Cloud SAML**   | SAP BTP with SAML IdP (IAS, Azure AD)         | `'cloud-saml'`   |
| **Office 365**   | Microsoft SSO for SAP connected to Azure      | `'office365'`    |
| **Multi-Tenant** | SAP BTP multi-tenant apps with subdomain auth | `'multi-tenant'` |
| **API**          | API key or OAuth bearer token (headless)      | `'api'`          |
| **Certificate**  | Client certificate authentication             | `'certificate'`  |

## Setup Project Pattern

The recommended pattern uses Playwright's **setup projects** to authenticate once and share the session across all tests.

### 1. Auth Setup File

Create `tests/auth-setup.ts` using the `sapAuth` fixture (provided by `playwright-praman`):

```typescript
import { join } from 'node:path';
import { test as setup } from 'playwright-praman';

const authFile = join(process.cwd(), '.auth', 'sap-session.json');

setup('SAP authentication', async ({ sapAuth, page, context }) => {
  // sapAuth is auto-configured from praman config and environment variables.
  // The fixture resolves the correct strategy based on SAP_ACTIVE_SYSTEM
  // and SAP_AUTH_STRATEGY env vars.
  await sapAuth.login(page);

  await context.storageState({ path: authFile });
});
```

:::info[No direct auth imports]
`SAPAuthHandler` and `createAuthStrategy` are **not** public exports.
The `playwright-praman/auth` sub-path does **not** exist.
All authentication is done through the `sapAuth` fixture, which reads
credentials and strategy from the Praman config / environment variables.
:::

### 2. Playwright Config

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'setup',
      testMatch: /auth-setup\.ts/,
      teardown: 'teardown',
    },
    {
      name: 'teardown',
      testMatch: /auth-teardown\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
      },
    },
  ],
});
```

### 3. Tests Use Saved Session

```typescript
import { test, expect } from 'playwright-praman';

// No login code needed — storageState handles it
test('navigate after auth', async ({ ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
});
```

## Strategy Examples

### On-Premise (`onprem`)

```bash
# .env
SAP_ACTIVE_SYSTEM=onprem
SAP_ONPREM_BASE_URL=https://sapserver.example.com:8443/sap/bc/ui5_ui5/
SAP_ONPREM_USERNAME=TESTUSER
SAP_ONPREM_PASSWORD=secret
SAP_CLIENT=100
SAP_LANGUAGE=EN
```

### Cloud SAML (`cloud-saml`)

```bash
# .env
SAP_ACTIVE_SYSTEM=cloud
SAP_CLOUD_BASE_URL=https://tenant.launchpad.cfapps.eu10.hana.ondemand.com
SAP_CLOUD_USERNAME=user@company.com
SAP_CLOUD_PASSWORD=secret
```

### Office 365 SSO

```bash
# .env
SAP_ACTIVE_SYSTEM=cloud
SAP_AUTH_STRATEGY=office365
SAP_CLOUD_BASE_URL=https://tenant.launchpad.cfapps.eu10.hana.ondemand.com
SAP_CLOUD_USERNAME=user@company.onmicrosoft.com
SAP_CLOUD_PASSWORD=secret
```

## Using the `sapAuth` Fixture

For tests that need explicit auth control:

```typescript
import { test, expect } from 'playwright-praman';

test('explicit auth', async ({ sapAuth, page }) => {
  // sapAuth.login() uses credentials from praman config / env vars.
  // Pass overrides only when needed:
  await sapAuth.login(page, {
    url: 'https://sapserver.example.com',
    username: 'TESTUSER',
    password: 'secret',
    strategy: 'onprem',
  });

  // isAuthenticated() requires the page parameter
  expect(await sapAuth.isAuthenticated(page)).toBe(true);

  const session = sapAuth.getSessionInfo();
  // SessionInfo has: authenticatedAt, strategyName, isValid
  expect(session.isValid).toBe(true);
  expect(session.strategyName).toBe('onprem');

  // Auto-logout on fixture teardown
});
```

:::tip[Strategy name mapping]
The config schema names map to runtime strategy names as follows:

| Config Value  | Runtime `strategyName` |
| ------------- | ---------------------- |
| `'basic'`     | `'onprem'`             |
| `'btp-saml'`  | `'cloud-saml'`         |
| `'office365'` | `'office365'`          |
| `'custom'`    | User-provided name     |

When checking `session.strategyName`, use the **runtime** name (right column).
:::

## Session Expiry

The default session timeout is 1800 seconds (30 minutes), matching SAP ICM defaults.
The 30-minute default matches SAP ICM session timeout defaults.

## BTP WorkZone Authentication

BTP WorkZone renders apps inside nested iframes. The `btpWorkZone` fixture handles frame context automatically:

```typescript
test('WorkZone app', async ({ btpWorkZone, ui5 }) => {
  const appFrame = btpWorkZone.getAppFrameForEval();
  // All operations route through the correct frame
});
```
