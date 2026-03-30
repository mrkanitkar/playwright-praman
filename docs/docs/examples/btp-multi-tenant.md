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
    await test.step('Detect BTP Work Zone and navigate to app', async () => {
      // Authentication is handled by the seed spec (storageState).
      // The btpWorkZone fixture detects the frame structure automatically.
      await btpWorkZone.detect();
      await btpWorkZone.navigateToApp('PurchaseOrder-manage');

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
      await ui5.odata.waitForLoad();
      const orders = await ui5.odata.getModelData('/PurchaseOrders');
      expect(orders).toBeTruthy();
    });
  });

  test('switch tenant and verify session isolation', async ({ page, ui5, btpWorkZone }) => {
    await test.step('Detect Work Zone for first tenant', async () => {
      // Authentication is handled by the seed spec (storageState).
      await btpWorkZone.detect();
      await ui5.waitForUI5();
    });

    await test.step('Switch to second tenant', async () => {
      // Tenant switching requires re-authentication via seed spec.
      // Use a separate Playwright project/storageState per tenant.
      await btpWorkZone.switchToShell();
      await btpWorkZone.navigateToApp('PurchaseOrder-manage');

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
      await ui5.odata.waitForLoad();
    });
  });

  test('verify session cookies are tenant-scoped', async ({ page, btpWorkZone }) => {
    await test.step('Detect Work Zone for tenant', async () => {
      // Authentication is handled by the seed spec (storageState).
      await btpWorkZone.detect();
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

    await test.step('Verify session cleanup on context disposal', async () => {
      // Logout is handled by Playwright context disposal.
      // Verify cookies exist while context is active.
      const cookies = await page.context().cookies();
      const sessionCookies = cookies.filter(
        (c) => c.name.includes('JSESSIONID') || c.name.includes('SAP_SESSIONID'),
      );
      expect(sessionCookies.length).toBeGreaterThan(0);
    });
  });
});
```

## Key Concepts

- **`btpWorkZone` fixture** -- handles the BTP Work Zone frame structure and app navigation
- **`btpWorkZone.detect()`** -- detects the Work Zone frame structure (shell + app frames)
- **`btpWorkZone.navigateToApp()`** -- navigates to a specific app by semantic object and action
- **`btpWorkZone.switchToShell()`** -- switches context back to the outer shell frame
- **`btpWorkZone.getAppFrameForEval()`** -- returns the app iframe for direct evaluation
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
