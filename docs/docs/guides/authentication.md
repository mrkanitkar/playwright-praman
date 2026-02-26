---
sidebar_position: 2
title: Authentication Guide
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

Create `tests/auth-setup.ts` (or use Praman's built-in `src/auth/auth-setup.ts`):

```typescript
import { join } from 'node:path';
import { test as setup } from '@playwright/test';

const authFile = join(process.cwd(), '.auth', 'sap-session.json');

setup('SAP authentication', async ({ page, context }) => {
  const { SAPAuthHandler } = await import('playwright-praman/auth');
  const { createAuthStrategy } = await import('playwright-praman/auth');

  const strategy = createAuthStrategy({
    url: process.env.SAP_BASE_URL ?? '',
    username: process.env.SAP_ONPREM_USERNAME ?? '',
    password: process.env.SAP_ONPREM_PASSWORD ?? '',
    strategy: 'onprem',
  });

  const handler = new SAPAuthHandler({ strategy });
  await handler.login(page, {
    url: process.env.SAP_BASE_URL ?? '',
    username: process.env.SAP_ONPREM_USERNAME ?? '',
    password: process.env.SAP_ONPREM_PASSWORD ?? '',
    client: process.env.SAP_CLIENT,
    language: process.env.SAP_LANGUAGE,
  });

  await context.storageState({ path: authFile });
});
```

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
  await sapAuth.login(page, {
    url: 'https://sapserver.example.com',
    username: 'TESTUSER',
    password: 'secret',
    strategy: 'onprem',
  });

  expect(sapAuth.isAuthenticated()).toBe(true);

  const session = sapAuth.getSessionInfo();
  expect(session.user).toBe('TESTUSER');

  // Auto-logout on fixture teardown
});
```

## Session Expiry

The default session timeout is 1800 seconds (30 minutes), matching SAP ICM defaults.
See [Product Decision P5-PD-002](../decisions/product-decisions#p5-pd-002-session-timeout-default) for rationale.

## BTP WorkZone Authentication

BTP WorkZone renders apps inside nested iframes. The `btpWorkZone` fixture handles frame context automatically:

```typescript
test('WorkZone app', async ({ btpWorkZone, ui5 }) => {
  const workspace = btpWorkZone.getWorkspaceFrame();
  // All operations route through the correct frame
});
```
