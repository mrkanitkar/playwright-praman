---
sidebar_position: 1
title: Auth Setup
---

# Authentication Setup Example

Complete SAP authentication setup supporting OnPrem, BTP Cloud SAML, and Office 365 strategies.

Copy this file into your project as `tests/auth-setup.ts` and configure it in `playwright.config.ts` as a setup project.

## Environment Variables

```bash
# Required (set in .env or CI secrets)
SAP_CLOUD_BASE_URL=https://your-sap-system.example.com
SAP_CLOUD_USERNAME=TEST_USER
SAP_CLOUD_PASSWORD=<your-password>

# Optional
SAP_AUTH_STRATEGY=btp-saml  # 'basic' | 'btp-saml' | 'office365'
SAP_CLIENT=100              # OnPrem only
SAP_LANGUAGE=EN             # Default: EN
```

## Playwright Config

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // Auth setup -- runs first, saves session to .auth/sap-session.json
    {
      name: 'auth',
      testMatch: '**/auth-setup.ts',
      teardown: 'auth-teardown', // optional
    },
    // Auth teardown -- runs after all tests (optional)
    {
      name: 'auth-teardown',
      testMatch: '**/auth-teardown.ts',
    },
    // Main test project -- reuses saved session
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
      },
      dependencies: ['auth'],
    },
  ],
});
```

## Full Source

```typescript
import { join } from 'node:path';
import process from 'node:process';
import { test as setup } from '@playwright/test';

const AUTH_STATE_PATH = join(process.cwd(), '.auth', 'sap-session.json');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        'Set it in your .env.test file or CI secrets.',
    );
  }
  return value;
}

setup('SAP authentication', async ({ page, context }) => {
  const baseUrl = requireEnv('SAP_CLOUD_BASE_URL');
  const username = requireEnv('SAP_CLOUD_USERNAME');
  const password = requireEnv('SAP_CLOUD_PASSWORD');
  const strategy = process.env['SAP_AUTH_STRATEGY'] ?? 'btp-saml';
  const client = process.env['SAP_CLIENT'] ?? '100';
  const language = process.env['SAP_LANGUAGE'] ?? 'EN';

  if (strategy === 'basic') {
    // OnPrem SAP NetWeaver login
    const loginUrl =
      `${baseUrl}/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html` +
      `?sap-client=${client}&sap-language=${language}`;
    await page.goto(loginUrl);
    await page.locator('#sap-user, input[name="sap-user"]').fill(username);
    await page.locator('#sap-password, input[name="sap-password"]').fill(password);
    await page.locator('#LOGON_BUTTON, button[type="submit"], input[type="submit"]').click();
    await page.waitForSelector('#shell-header, .sapUshellShellHead', { timeout: 30_000 });
  } else if (strategy === 'btp-saml') {
    // BTP Cloud Foundry / SAP IAS SAML2 redirect
    await page.goto(baseUrl);
    await page.waitForSelector('input[name="j_username"], input[name="email"], #logOnFormEmail', {
      timeout: 30_000,
    });
    await page
      .locator('input[name="j_username"], input[name="email"], #logOnFormEmail')
      .fill(username);
    await page
      .locator('input[name="j_password"], input[name="password"], #logOnFormPassword')
      .fill(password);
    await page.locator('button[type="submit"], #logOnFormSubmit, input[type="submit"]').click();
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60_000 });
    await page.waitForSelector('#shell-header, .sapUshellShellHead', { timeout: 30_000 });
  } else if (strategy === 'office365') {
    // Microsoft Entra ID (Azure AD) / Office 365 SSO
    await page.goto(baseUrl);
    await page.waitForURL('**/login.microsoftonline.com/**', { timeout: 30_000 });
    await page.locator('input[type="email"]').fill(username);
    await page.locator('input[type="submit"], #idSIButton9').click();
    await page.waitForSelector('input[type="password"]', { timeout: 15_000 });
    await page.locator('input[type="password"]').fill(password);
    await page.locator('input[type="submit"], #idSIButton9').click();
    const staySignedIn = page.locator('#idSIButton9, input[type="submit"]');
    if (await staySignedIn.isVisible().catch(() => false)) {
      await staySignedIn.click();
    }
    await page.waitForSelector('#shell-header, .sapUshellShellHead', { timeout: 60_000 });
  } else {
    throw new Error(
      `Unknown auth strategy: "${strategy}". Supported: "basic", "btp-saml", "office365".`,
    );
  }

  // Save authenticated state for reuse by all test projects
  await context.storageState({ path: AUTH_STATE_PATH });
});
```

:::tip Why use a setup project?
Playwright's [project dependencies](https://playwright.dev/docs/auth) run the auth setup once and share the session across all test files. This avoids logging in before every test, saving time and reducing flaky failures from login page changes.
:::
