# SAP Authentication Reference

## Table of Contents

1. [Strategy Selection](#strategy-selection)
2. [Auth Setup Pattern](#auth-setup-pattern)
3. [Strategy Details](#strategy-details)
4. [Config Reference](#config-reference)

---

## Strategy Selection

```text
SAP Deployment Type                 → Recommended Strategy
──────────────────────────────────────────────────────────────
OnPrem + LDAP / Active Directory    → 'basic'
OnPrem + SAP GUI SSO                → 'basic' with domain user
OnPrem + SAML2 IDP redirect         → 'btp-saml'
BTP Cloud Foundry (IAS)             → 'btp-saml'
SAP WorkZone (BTP standard plan)    → 'btp-saml'
Office 365 / Azure AD SSO           → 'office365'
API / technical user / CI pipeline  → custom (APIAuthStrategy)
Multi-tenant with tenant URL        → custom (MultiTenantAuthStrategy)
Certificate / mTLS client cert      → custom (CertificateAuthStrategy)
```

---

## Auth Setup Pattern

Always use Playwright's **project dependencies** pattern to perform auth once and
reuse the storage state across all tests.

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { defineConfig as definePramanConfig } from 'playwright-praman';

export default defineConfig({
  projects: [
    {
      name: 'auth',
      testMatch: '**/auth-setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/session.json',
        praman: definePramanConfig({
          auth: {
            strategy: 'basic',
            baseUrl: process.env['BASE_URL'] ?? '',
            username: process.env['SAP_USER'],
            password: process.env['SAP_PASSWORD'],
          },
        }),
      },
      dependencies: ['auth'],
    },
  ],
});
```

```typescript
// tests/auth-setup.ts
import { test as setup } from 'playwright-praman';

setup('authenticate', async ({ page, pramanConfig }) => {
  const { SAPAuthHandler } = await import('playwright-praman/auth');
  const handler = new SAPAuthHandler(page, pramanConfig.auth!);
  await handler.login();
  await page.context().storageState({ path: '.auth/session.json' });
});
```

---

## Strategy Details

### 'basic' — Username/Password Form

For SAP systems using a standard username/password login form.

```typescript
auth: {
  strategy: 'basic',
  baseUrl: 'https://erp.mycompany.com',
  username: process.env['SAP_USER'],    // e.g. 'TESTUSER'
  password: process.env['SAP_PASSWORD'],
  client: '100',                         // SAP client (Mandant), default '100'
  language: 'EN',                        // Logon language, default 'EN'
}
```

**OnPremAuthStrategy**: Handles SAP NetWeaver logon form (fields: `sap-user`, `sap-password`, `sap-client`, `sap-language`).

### 'btp-saml' — BTP SAML2 / IAS

For BTP Cloud Foundry apps and SAP WorkZone using IAS SAML2 redirect.

```typescript
auth: {
  strategy: 'btp-saml',
  baseUrl: 'https://myapp.cfapps.eu10.hana.ondemand.com',
  username: process.env['IAS_USER'],    // IAS user email
  password: process.env['IAS_PASSWORD'],
}
```

**CloudSAMLAuthStrategy**: Follows SAML2 redirect chain, fills IAS login form, handles RelayState.

### 'office365' — Azure AD / Office 365

For apps integrated with Microsoft Entra ID (formerly Azure AD).

```typescript
auth: {
  strategy: 'office365',
  baseUrl: 'https://myapp.azurewebsites.net',
  username: process.env['O365_USER'],   // UPN: user@company.com
  password: process.env['O365_PASSWORD'],
}
```

**Office365AuthStrategy**: Handles Microsoft SSO redirect, MFA prompts (if configured for test accounts), and token acquisition.

### Custom: APIAuthStrategy

For technical users, CI pipelines, or systems with API-based auth (Basic auth header, JWT).

```typescript
import { APIAuthStrategy } from 'playwright-praman/auth';

// In auth-setup.ts:
const strategy = new APIAuthStrategy(page, {
  baseUrl: 'https://api.mycompany.com',
  apiKey: process.env['API_KEY'],
  headerName: 'Authorization',
  headerValue: `Bearer ${process.env['API_TOKEN']}`,
});
await strategy.login();
```

### Custom: MultiTenantAuthStrategy

For multi-tenant SaaS apps where auth URL includes a tenant identifier.

```typescript
import { MultiTenantAuthStrategy, buildTenantUrl } from 'playwright-praman';

const tenantUrl = buildTenantUrl('https://app.example.com', process.env['TENANT_ID']!);
const strategy = new MultiTenantAuthStrategy(page, { baseUrl: tenantUrl, ... });
```

### Custom: CertificateAuthStrategy

For mTLS / client certificate authentication.

```typescript
import { CertificateAuthStrategy } from 'playwright-praman/auth';

// Playwright context must be configured with clientCertificates:
const strategy = new CertificateAuthStrategy(page, {
  baseUrl: 'https://secure.mycompany.com',
  certPath: process.env['CLIENT_CERT_PATH']!,
  keyPath: process.env['CLIENT_KEY_PATH']!,
});
```

---

## Config Reference

```typescript
interface AuthConfig {
  strategy: 'btp-saml' | 'basic' | 'office365' | 'custom';
  baseUrl: string; // Required: the app base URL
  username?: string; // Required for most strategies
  password?: string; // Required for most strategies
  client?: string; // SAP client (Mandant) — default '100' (OnPrem only)
  language?: string; // Logon language — default 'EN' (OnPrem only)
}
```

### Environment Variables (recommended pattern)

```bash
# .env.test (gitignored)
BASE_URL=https://erp.mycompany.com
SAP_USER=TEST_AUTOMATION
SAP_PASSWORD=SecretPass123
SAP_CLIENT=100
```

```typescript
// playwright.config.ts
import 'dotenv/config';  // Load .env.test in development

auth: {
  strategy: 'basic',
  baseUrl: process.env['BASE_URL'] ?? '',
  username: process.env['SAP_USER'],
  password: process.env['SAP_PASSWORD'],
  client: process.env['SAP_CLIENT'] ?? '100',
}
```

### Auth Teardown

```typescript
// tests/auth-teardown.ts — optional cleanup
import { test as teardown } from 'playwright-praman';

teardown('logout', async ({ page }) => {
  await page.goto('/sap/bc/bsp/sap/it00/default.htm?sap-client=100&sap-language=EN');
  // Or simply clear storage state:
  await page.context().clearCookies();
});
```
