---
sidebar_position: 2
title: Basic Test
---

# Basic UI5 Control Discovery

The simplest possible Praman test. Demonstrates control discovery by type and property, property verification, and `ui5.press()`.

## Source

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Basic UI5 Control Discovery', () => {
  test('find a GenericTile by header text', async ({ page, ui5 }) => {
    await test.step('Navigate to Fiori Launchpad', async () => {
      await page.goto(process.env['SAP_CLOUD_BASE_URL']!);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveTitle(/Home/, { timeout: 60_000 });
    });

    await test.step('Discover tile control', async () => {
      // Use ui5.control() to find a GenericTile by its header property.
      // Praman injects the UI5 bridge automatically on first call.
      const tile = await ui5.control({
        controlType: 'sap.m.GenericTile',
        properties: { header: 'My App' },
      });

      // Verify the control type returned by the bridge
      const controlType = await tile.getControlType();
      expect(controlType).toBe('sap.m.GenericTile');

      // Read a property via the typed proxy
      const header = await tile.getProperty('header');
      expect(header).toBe('My App');
    });

    await test.step('Press the tile to navigate', async () => {
      // ui5.press() calls firePress() on the control and waits for UI5 stability
      await ui5.press({
        controlType: 'sap.m.GenericTile',
        properties: { header: 'My App' },
      });

      // Wait for the target app to finish loading
      await ui5.waitForUI5();
    });
  });
});
```

## Key Concepts

- **`ui5.control()`** discovers controls through the UI5 runtime's control registry -- not the DOM
- **`controlType` + `properties`** is the most common selector pattern
- **`ui5.press()`** fires the UI5 press event and automatically calls `waitForUI5()`
- **`test.step()`** groups actions for clear Playwright HTML reports
