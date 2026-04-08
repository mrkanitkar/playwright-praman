---
title: Cross-Browser Testing
---

How to configure Playwright projects for multi-browser SAP UI5 testing. Covers browser-specific
differences in UI5 rendering, project configuration, and CI matrix strategies.

## Playwright Browser Projects

Playwright supports Chromium, Firefox, and WebKit. SAP UI5 officially supports Chrome, Firefox,
Safari, and Edge (Chromium-based).

### Basic Multi-Browser Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,

  projects: [
    // Auth setup per browser
    {
      name: 'chromium-setup',
      testMatch: /auth-setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox-setup',
      testMatch: /auth-setup\.ts/,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit-setup',
      testMatch: /auth-setup\.ts/,
      use: { ...devices['Desktop Safari'] },
    },

    // Tests per browser
    {
      name: 'chromium',
      dependencies: ['chromium-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/chromium-session.json',
      },
    },
    {
      name: 'firefox',
      dependencies: ['firefox-setup'],
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/firefox-session.json',
      },
    },
    {
      name: 'webkit',
      dependencies: ['webkit-setup'],
      use: {
        ...devices['Desktop Safari'],
        storageState: '.auth/webkit-session.json',
      },
    },
  ],
});
```

### Browser-Specific Auth Setup

Each browser needs its own storage state file because session cookies are browser-specific:

```typescript
// tests/auth-setup.ts
import { join } from 'node:path';
import { test as setup } from '@playwright/test';

setup('SAP authentication', async ({ page, context, browserName }) => {
  const authFile = join(process.cwd(), '.auth', `${browserName}-session.json`);

  // ... perform login ...

  await context.storageState({ path: authFile });
});
```

## SAP UI5 Cross-Browser Differences

UI5 controls render slightly differently across browsers. These are the most common differences
that affect test stability.

### Rendering Differences

| Control              | Chrome                      | Firefox                           | Safari/WebKit                       |
| -------------------- | --------------------------- | --------------------------------- | ----------------------------------- |
| `sap.m.Table`        | Standard rendering          | Minor scrollbar width differences | Touch-optimized rendering           |
| `sap.m.DatePicker`   | Native date popup available | Custom UI5 popup only             | Native date popup available         |
| `sap.ui.table.Table` | Smooth scrolling            | Row height may vary by 1-2px      | Momentum scrolling                  |
| `sap.m.Dialog`       | Standard animation          | Animation timing differs          | Backdrop rendering differs          |
| `sap.m.Popover`      | Standard positioning        | Same                              | May position differently near edges |

### Event Handling Differences

```typescript
// Some interactions behave differently across browsers.
// Use Praman's ui5.click() and ui5.fill() — they normalize behavior.

// Avoid browser-specific workarounds like:
// await page.mouse.click(x, y);  // Coordinates vary by browser
// await page.keyboard.press('Tab');  // Focus order may differ

// Instead, use semantic selectors:
await ui5.click({
  controlType: 'sap.m.Button',
  properties: { text: 'Save' },
});
```

### Scroll Behavior

```typescript
// Scrolling can differ across browsers. Use the control proxy method:
const inputField = await ui5.control({
  controlType: 'sap.m.Input',
  id: /lastFieldOnPage/,
});
await inputField.scrollIntoView();

// For tables with virtual scrolling:
const table = await ui5.control({
  controlType: 'sap.ui.table.Table',
  id: /mainTable/,
});
await table.scrollToRow(50);
```

## Selective Browser Testing

### Tag Tests by Browser Compatibility

```typescript
// Run specific tests only on certain browsers
test('drag and drop in table (Chromium only)', async ({ ui5, browserName }) => {
  test.skip(browserName !== 'chromium', 'Drag and drop is Chromium-only');

  // ... drag and drop test ...
});

test('touch gestures (WebKit only)', async ({ ui5, browserName }) => {
  test.skip(browserName !== 'webkit', 'Touch-specific test');

  // ... touch gesture test ...
});
```

### Browser-Specific Assertions

```typescript
test('table rendering across browsers', async ({ ui5, browserName }) => {
  const table = await ui5.control({ controlType: 'sap.m.Table' });

  // Common assertion — works on all browsers
  await expect(table).toHaveUI5RowCount(10);

  // Browser-specific screenshot comparison using page.locator()
  const tableId = await table.getProperty('id');
  const locator = page.locator(`#${tableId}`);
  await expect(locator).toHaveScreenshot(`table-${browserName}.png`, {
    maxDiffPixelRatio: browserName === 'webkit' ? 0.02 : 0.01,
  });
});
```

## Mobile Browser Testing

SAP Fiori apps are responsive. Test mobile viewports:

<!-- docs-verify:no-run -->

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // Desktop
    {
      name: 'desktop-chrome',
      use: { ...devices['Desktop Chrome'] },
    },

    // Tablet
    {
      name: 'ipad',
      use: { ...devices['iPad Pro 11'] },
    },

    // Mobile
    {
      name: 'iphone',
      use: { ...devices['iPhone 14'] },
    },

    // Android
    {
      name: 'android',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
```

### Responsive Layout Tests

```typescript
test('list report adapts to mobile viewport', async ({ ui5, page, isMobile }) => {
  await test.step('verify responsive table mode', async () => {
    if (isMobile) {
      // On mobile, SmartTable switches to responsive mode
      const mTable = await ui5.control({
        controlType: 'sap.m.Table',
      });
      expect(mTable).toBeTruthy();
    } else {
      // On desktop, SmartTable may use grid table
      const gridTable = await ui5.control({
        controlType: 'sap.ui.table.Table',
      });
      // Grid table OR responsive table depending on config
      expect(gridTable).toBeTruthy();
    }
  });
});
```

## CI Matrix Strategy

### GitHub Actions Multi-Browser Matrix

```yaml
# .github/workflows/cross-browser.yml
name: Cross-Browser Tests
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
        os: [ubuntu-latest, windows-latest, macos-latest]
        exclude:
          # WebKit on Windows is not officially supported by Playwright
          - browser: webkit
            os: windows-latest
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx playwright install ${{ matrix.browser }}
      - run: npx playwright test --project=${{ matrix.browser }}
        env:
          SAP_CLOUD_BASE_URL: ${{ secrets.SAP_QA_URL }}
          SAP_CLOUD_USERNAME: ${{ secrets.SAP_QA_USER }}
          SAP_CLOUD_PASSWORD: ${{ secrets.SAP_QA_PASS }}
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: report-${{ matrix.browser }}-${{ matrix.os }}
          path: playwright-report/
```

### Tiered Browser Strategy

Not all tests need to run on all browsers. Use a tiered approach:

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // Tier 1: Full suite on Chrome (primary browser)
    {
      name: 'chromium-full',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'] },
    },

    // Tier 2: Smoke tests on Firefox
    {
      name: 'firefox-smoke',
      testDir: './tests/smoke',
      use: { ...devices['Desktop Firefox'] },
    },

    // Tier 3: Critical path on WebKit
    {
      name: 'webkit-critical',
      testDir: './tests/critical',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

## Best Practices

| Practice                                | Why                                                                 |
| --------------------------------------- | ------------------------------------------------------------------- |
| Use Praman fixtures, not raw Playwright | Praman normalizes cross-browser differences in UI5 interactions     |
| Separate auth state per browser         | Session cookies are browser-specific                                |
| Use `maxDiffPixelRatio` for screenshots | Rendering differs slightly per browser                              |
| Run Chrome as primary, others as smoke  | Chrome covers most users; other browsers catch critical regressions |
| Skip known browser limitations          | Use `test.skip()` with clear reason, not silent failures            |
| Use `fail-fast: false` in CI matrix     | One browser failure should not block others from completing         |
