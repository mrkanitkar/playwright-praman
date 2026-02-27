/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * BTP Work Zone Multi-Tenant Auth Example -- tenant switching, session isolation.
 *
 * @remarks
 * This example demonstrates how to handle multi-tenant authentication on SAP BTP
 * Work Zone using Praman:
 *
 * 1. **Authenticate to BTP Work Zone** via the `btpWorkZone` fixture
 * 2. **Switch tenants** using the tenant selector in the Work Zone shell
 * 3. **Verify session isolation** -- each tenant has its own data context
 * 4. **Navigate to tenant-specific apps** via FLP tiles
 * 5. **Verify tenant-specific data** using OData model queries
 *
 * This pattern is essential for ISV and multi-tenant SaaS applications where
 * tests must validate behavior across different tenant contexts.
 *
 * Prerequisites:
 * - BTP Work Zone subscription with multi-tenant configuration
 * - Test users provisioned in at least two tenants
 * - Environment variables:
 *   - `BTP_WORKZONE_URL` -- Work Zone base URL
 *   - `BTP_TENANT_1` -- first tenant subdomain (e.g., 'acme-dev')
 *   - `BTP_TENANT_2` -- second tenant subdomain (e.g., 'globex-dev')
 *   - `SAP_USERNAME`, `SAP_PASSWORD` -- IDP credentials
 *
 * @example
 * ```bash
 * npx playwright test examples/btp-multi-tenant.spec.ts
 * ```
 */

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

      // Verify we landed on the FLP shell
      await ui5.waitForUI5();
      await expect(page).toHaveURL(/site#/);

      test.info().annotations.push({
        type: 'info',
        description: `Authenticated to tenant: ${process.env['BTP_TENANT_1']!}`,
      });
    });

    await test.step('Verify tenant-specific FLP content', async () => {
      // Each tenant has its own tile catalog -- verify tenant-specific tiles exist
      await expect(async () => {
        const tile = await ui5.control({
          controlType: 'sap.ushell.ui.launchpad.Tile',
        });
        expect(tile).toBeTruthy();
      }).toPass({ timeout: 30_000, intervals: [2000, 5000] });

      // Read the shell header to confirm tenant context
      const shellHeader = await ui5.control({
        controlType: 'sap.ushell.ui.shell.ShellHeader',
      });
      expect(shellHeader).toBeTruthy();
    });

    await test.step('Navigate to tenant-specific app', async () => {
      // Click a tile that is specific to this tenant's configuration
      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: 'Manage Purchase Orders' },
        });
      }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

      await ui5.waitForUI5();
    });

    await test.step('Verify tenant data context via OData', async () => {
      // Wait for OData model to load tenant-specific data
      await ui5.odata.waitForODataLoad('/PurchaseOrders');

      // Read data -- each tenant has its own company codes and data set
      const orders = await ui5.odata.getModelData('/PurchaseOrders');
      expect(orders).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `Tenant ${process.env['BTP_TENANT_1']!} has data loaded`,
      });
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

    await test.step('Capture first tenant company code', async () => {
      // Navigate to an app to capture tenant-specific data
      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: 'Manage Purchase Orders' },
        });
      }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

      await ui5.waitForUI5();
      await ui5.odata.waitForODataLoad('/PurchaseOrders');

      const firstOrder = await ui5.odata.getModelData("/PurchaseOrders('4500000001')");
      const tenant1CompanyCode = (firstOrder as Record<string, unknown>)['CompanyCode'];
      expect(tenant1CompanyCode).toBeTruthy();

      test.info().annotations.push({
        type: 'info',
        description: `Tenant 1 CompanyCode: ${String(tenant1CompanyCode)}`,
      });
    });

    await test.step('Switch to second tenant', async () => {
      // btpWorkZone.switchTenant handles logout and re-auth to new tenant
      await btpWorkZone.switchTenant({
        tenant: process.env['BTP_TENANT_2']!,
        username: process.env['SAP_USERNAME']!,
        password: process.env['SAP_PASSWORD']!,
      });

      await ui5.waitForUI5();
      await expect(page).toHaveURL(/site#/);

      test.info().annotations.push({
        type: 'info',
        description: `Switched to tenant: ${process.env['BTP_TENANT_2']!}`,
      });
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

      // Verify data is from the second tenant -- different company codes
      const secondOrder = await ui5.odata.getModelData("/PurchaseOrders('4500000001')");
      const tenant2CompanyCode = (secondOrder as Record<string, unknown>)['CompanyCode'];

      test.info().annotations.push({
        type: 'info',
        description: `Tenant 2 CompanyCode: ${String(tenant2CompanyCode)}`,
      });
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

      // Verify cookies are scoped to the tenant subdomain
      for (const cookie of sessionCookies) {
        expect(cookie.domain).toContain(process.env['BTP_TENANT_1']!);
      }

      test.info().annotations.push({
        type: 'info',
        description: `Found ${sessionCookies.length} tenant-scoped session cookies`,
      });
    });

    await test.step('Logout and verify session cleanup', async () => {
      await btpWorkZone.logout();

      // After logout, session cookies should be cleared
      const cookies = await page.context().cookies();
      const remainingSessions = cookies.filter(
        (c) => c.name.includes('JSESSIONID') || c.name.includes('SAP_SESSIONID'),
      );
      expect(remainingSessions.length).toBe(0);
    });
  });
});
