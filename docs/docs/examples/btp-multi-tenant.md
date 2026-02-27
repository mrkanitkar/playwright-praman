---
sidebar_position: 7
title: BTP Multi-Tenant Auth
---

# BTP Multi-Tenant Auth

Demonstrates how to handle multi-tenant authentication on SAP BTP Work Zone, including tenant switching, session isolation, and tenant-scoped data verification.

## When to Use

- ISV applications deployed to multiple BTP tenants
- Multi-tenant SaaS testing where each tenant has its own data context
- Verifying session cookies are properly scoped per tenant
- Testing tenant-specific FLP tile catalogs and content

## Source

```typescript
import { test, expect } from 'playwright-praman';

test.describe('BTP Work Zone Multi-Tenant Auth', () => {
  test('authenticate and verify tenant context', async ({ page, ui5, btpWorkZone }) => {
    await test.step('Login to BTP Work Zone via IDP', async () => {
      // btpWorkZone fixture handles the full SAML redirect flow
      await btpWorkZone.login({
        url: process.env['BTP_WORKZONE_URL']!,
        username: process.env['SAP_USERNAME']!,
        password: process.env['SAP_PASSWORD']!,
        tenant: process.env['BTP_TENANT_1']!,
      });

      await ui5.waitForUI5();
      await expect(page).toHaveURL(/site#/);
    });

    await test.step('Verify tenant-specific FLP content', async () => {
      await expect(async () => {
        const tile = await ui5.control({
          controlType: 'sap.ushell.ui.launchpad.Tile',
        });
        expect(tile).toBeTruthy();
      }).toPass({ timeout: 30_000, intervals: [2000, 5000] });
    });

    await test.step('Navigate to tenant-specific app', async () => {
      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: 'Manage Purchase Orders' },
        });
      }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

      await ui5.waitForUI5();
    });

    await test.step('Verify tenant data context via OData', async () => {
      await ui5.odata.waitForODataLoad('/PurchaseOrders');
      const orders = await ui5.odata.getModelData('/PurchaseOrders');
      expect(orders).toBeTruthy();
    });
  });

  test('switch tenant and verify session isolation', async ({ page, ui5, btpWorkZone }) => {
    await test.step('Login to first tenant', async () => {
      await btpWorkZone.login({
        url: process.env['BTP_WORKZONE_URL']!,
        username: process.env['SAP_USERNAME']!,
        password: process.env['SAP_PASSWORD']!,
        tenant: process.env['BTP_TENANT_1']!,
      });
      await ui5.waitForUI5();
    });

    await test.step('Switch to second tenant', async () => {
      // switchTenant handles logout and re-auth to new tenant
      await btpWorkZone.switchTenant({
        tenant: process.env['BTP_TENANT_2']!,
        username: process.env['SAP_USERNAME']!,
        password: process.env['SAP_PASSWORD']!,
      });

      await ui5.waitForUI5();
      await expect(page).toHaveURL(/site#/);
    });

    await test.step('Verify second tenant has different data', async () => {
      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: 'Manage Purchase Orders' },
        });
      }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

      await ui5.waitForUI5();
      await ui5.odata.waitForODataLoad('/PurchaseOrders');
    });
  });

  test('verify session cookies are tenant-scoped', async ({ page, btpWorkZone }) => {
    await test.step('Login to tenant', async () => {
      await btpWorkZone.login({
        url: process.env['BTP_WORKZONE_URL']!,
        username: process.env['SAP_USERNAME']!,
        password: process.env['SAP_PASSWORD']!,
        tenant: process.env['BTP_TENANT_1']!,
      });
    });

    await test.step('Verify session cookies contain tenant subdomain', async () => {
      const cookies = await page.context().cookies();
      const sessionCookies = cookies.filter(
        (c) => c.name.includes('JSESSIONID') || c.name.includes('SAP_SESSIONID'),
      );
      expect(sessionCookies.length).toBeGreaterThan(0);

      for (const cookie of sessionCookies) {
        expect(cookie.domain).toContain(process.env['BTP_TENANT_1']!);
      }
    });

    await test.step('Logout and verify session cleanup', async () => {
      await btpWorkZone.logout();
      const cookies = await page.context().cookies();
      const remainingSessions = cookies.filter(
        (c) => c.name.includes('JSESSIONID') || c.name.includes('SAP_SESSIONID'),
      );
      expect(remainingSessions.length).toBe(0);
    });
  });
});
```

## Key Concepts

- **`btpWorkZone` fixture** -- handles the full BTP Work Zone SAML authentication flow, including IDP redirects
- **`btpWorkZone.login()`** -- authenticates to a specific tenant subdomain
- **`btpWorkZone.switchTenant()`** -- logs out of the current tenant and re-authenticates to a different one
- **`btpWorkZone.logout()`** -- cleans up session cookies and logs out
- **Tenant isolation** -- each tenant has its own FLP catalog, data context, and session cookies
- **Cookie scoping** -- session cookies (`JSESSIONID`, `SAP_SESSIONID`) are scoped to the tenant subdomain

## Environment Variables

| Variable           | Description                | Example                                                 |
| ------------------ | -------------------------- | ------------------------------------------------------- |
| `BTP_WORKZONE_URL` | BTP Work Zone base URL     | `https://myapp.launchpad.cfapps.eu10.hana.ondemand.com` |
| `BTP_TENANT_1`     | First tenant subdomain     | `acme-dev`                                              |
| `BTP_TENANT_2`     | Second tenant subdomain    | `globex-dev`                                            |
| `SAP_USERNAME`     | IDP credentials (username) | `testuser@acme.com`                                     |
| `SAP_PASSWORD`     | IDP credentials (password) | (stored in CI vault)                                    |
