---
title: Visual Regression Testing
---

How to use Playwright's `toHaveScreenshot()` with SAP UI5 apps for visual regression testing.
Covers theme variations, locale-dependent rendering, masking dynamic content, and CI
integration.

## Basic Visual Regression

Playwright's built-in `toHaveScreenshot()` captures and compares page or element screenshots
across test runs.

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Visual Regression - Purchase Order List', () => {
  test('list report matches baseline', async ({ ui5Navigation, page }) => {
    await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });

    await expect(page).toHaveScreenshot('po-list-report.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});
```

### Element-Level Screenshots

Capture just a specific control instead of the full page:

```typescript
test('smart table matches baseline', async ({ ui5, ui5Navigation, page }) => {
  await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });

  const table = await ui5.control({
    controlType: 'sap.ui.comp.smarttable.SmartTable',
  });
  const tableId = await table.getProperty('id');
  const locator = page.locator(`#${tableId}`);

  await expect(locator).toHaveScreenshot('po-smart-table.png', {
    maxDiffPixelRatio: 0.01,
  });
});
```

## Masking Dynamic Content

SAP apps contain dynamic data (timestamps, document numbers, user names) that changes between
test runs. Mask these areas to prevent false positives.

### CSS-Based Masking

```typescript
test('object page with masked dynamic content', async ({ ui5Navigation, page }) => {
  await ui5Navigation.navigateToIntent(
    { semanticObject: 'PurchaseOrder', action: 'display' },
    { PurchaseOrder: '4500000001' },
  );

  await expect(page).toHaveScreenshot('po-object-page.png', {
    mask: [
      page.locator('[id*="createdAt"]'), // Creation timestamp
      page.locator('[id*="changedAt"]'), // Last changed timestamp
      page.locator('[id*="createdBy"]'), // User name
      page.locator('.sapMMessageStrip'), // Dynamic messages
    ],
    maxDiffPixelRatio: 0.01,
  });
});
```

### Masking with Praman Selectors

```typescript
test('form with masked values', async ({ ui5, ui5Navigation, page }) => {
  await ui5Navigation.navigateToIntent(
    { semanticObject: 'PurchaseOrder', action: 'display' },
    { PurchaseOrder: '4500000001' },
  );

  // Get locators for dynamic fields via their DOM IDs
  const dateField = await ui5.control({
    controlType: 'sap.m.DatePicker',
    id: /creationDate/,
  });
  const userField = await ui5.control({
    controlType: 'sap.m.Text',
    id: /createdByText/,
  });
  const dateId = await dateField.getProperty('id');
  const userId = await userField.getProperty('id');

  await expect(page).toHaveScreenshot('po-form.png', {
    mask: [page.locator(`#${dateId}`), page.locator(`#${userId}`)],
  });
});
```

## Theme Variations

SAP UI5 supports multiple themes. Test visual consistency across them.

### Multi-Theme Project Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const themes = ['sap_horizon', 'sap_horizon_dark', 'sap_horizon_hcb', 'sap_horizon_hcw'];

export default defineConfig({
  projects: themes.map((theme) => ({
    name: `visual-${theme}`,
    testDir: './tests/visual',
    use: {
      ...devices['Desktop Chrome'],
      // Pass theme as a custom parameter
      launchOptions: {
        args: [`--theme=${theme}`],
      },
    },
    metadata: { theme },
  })),
});
```

### Applying Themes in Tests

```typescript
test.beforeEach(async ({ page }) => {
  // Apply the UI5 theme via URL parameter
  const theme = test.info().project.metadata.theme ?? 'sap_horizon';
  const baseUrl = process.env.SAP_BASE_URL ?? '';
  await page.goto(`${baseUrl}?sap-ui-theme=${theme}`);
});

test('list report in configured theme', async ({ ui5Navigation, page }) => {
  const theme = test.info().project.metadata.theme ?? 'sap_horizon';
  await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });

  await expect(page).toHaveScreenshot(`po-list-${theme}.png`, {
    maxDiffPixelRatio: 0.01,
  });
});
```

### High Contrast Theme Testing

High contrast themes (`sap_horizon_hcb`, `sap_horizon_hcw`) are required for accessibility
compliance:

```typescript
test('high contrast black theme renders correctly', async ({ ui5Navigation, page }) => {
  // Apply high contrast theme
  await page.goto(`${process.env.SAP_BASE_URL}?sap-ui-theme=sap_horizon_hcb`);
  await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });

  await expect(page).toHaveScreenshot('po-list-hcb.png', {
    maxDiffPixelRatio: 0.02, // Slightly higher tolerance for HC themes
  });
});
```

## Locale-Dependent Rendering

SAP apps render differently based on locale settings: date formats, number formats,
right-to-left (RTL) text direction, and translated labels.

### Multi-Locale Testing

```typescript
const locales = [
  { code: 'en', name: 'English', rtl: false },
  { code: 'de', name: 'German', rtl: false },
  { code: 'ar', name: 'Arabic', rtl: true },
  { code: 'ja', name: 'Japanese', rtl: false },
];

for (const locale of locales) {
  test(`list report renders correctly in ${locale.name}`, async ({ ui5Navigation, page }) => {
    await page.goto(`${process.env.SAP_BASE_URL}?sap-language=${locale.code}`);
    await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });

    await expect(page).toHaveScreenshot(`po-list-${locale.code}.png`, {
      maxDiffPixelRatio: 0.02,
    });
  });
}
```

### RTL Layout Validation

```typescript
test('RTL layout renders correctly for Arabic', async ({ ui5Navigation, page }) => {
  await page.goto(`${process.env.SAP_BASE_URL}?sap-language=ar`);
  await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });

  // Verify RTL direction is applied
  const dir = await page.getAttribute('html', 'dir');
  expect(dir).toBe('rtl');

  await expect(page).toHaveScreenshot('po-list-rtl.png', {
    maxDiffPixelRatio: 0.02,
  });
});
```

## Updating Baselines

When intentional UI changes are made, update the screenshot baselines:

```bash
# Update all visual snapshots
npx playwright test tests/visual/ --update-snapshots

# Update snapshots for a specific theme
npx playwright test tests/visual/ --project=visual-sap_horizon --update-snapshots

# Update a specific test's snapshot
npx playwright test tests/visual/ -g "list report" --update-snapshots
```

## CI Integration

### Storing Snapshots in Git

Screenshot baselines should be committed to version control:

```
tests/
  visual/
    po-list-report.spec.ts
    po-list-report.spec.ts-snapshots/
      po-list-report-chromium-linux.png
      po-list-report-chromium-darwin.png
      po-list-report-chromium-win32.png
```

### Platform-Specific Snapshots

Font rendering differs across operating systems. Playwright automatically generates
platform-specific snapshot names:

```typescript
// Playwright appends -{browserName}-{platform}.png automatically
await expect(page).toHaveScreenshot('my-page.png');
// Generates: my-page-chromium-linux.png, my-page-chromium-darwin.png, etc.
```

### GitHub Actions Workflow

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression
on:
  pull_request:

jobs:
  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx playwright install chromium

      - run: npx playwright test tests/visual/ --project=visual-sap_horizon
        env:
          SAP_BASE_URL: ${{ secrets.SAP_QA_URL }}
          SAP_USERNAME: ${{ secrets.SAP_QA_USER }}
          SAP_PASSWORD: ${{ secrets.SAP_QA_PASS }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: visual-regression-report
          path: |
            playwright-report/
            test-results/
```

## Configuration Options

```typescript
// Global defaults in playwright.config.ts
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01, // 1% pixel difference allowed
      threshold: 0.2, // Per-pixel color threshold (0-1)
      animations: 'disabled', // Disable CSS animations for stability
    },
  },
});
```

| Option              | Default   | Recommended for SAP                            |
| ------------------- | --------- | ---------------------------------------------- |
| `maxDiffPixelRatio` | 0         | 0.01 (1%) — handles anti-aliasing differences  |
| `threshold`         | 0.2       | 0.2 — default works well for UI5               |
| `animations`        | `'allow'` | `'disabled'` — prevents animation-caused diffs |
| `scale`             | `'css'`   | `'css'` — consistent across DPI settings       |

## Best Practices

| Practice                                     | Why                                                       |
| -------------------------------------------- | --------------------------------------------------------- |
| Mask dynamic content (dates, IDs, usernames) | Prevents false positives from changing data               |
| Use element screenshots for components       | Full-page screenshots are brittle and slow to review      |
| Set `animations: 'disabled'`                 | CSS animations cause non-deterministic diffs              |
| Test high contrast themes                    | Required for accessibility compliance (WCAG)              |
| Keep tolerance low (1%)                      | Catches real regressions while tolerating rendering noise |
| Store baselines in Git                       | Track visual changes alongside code changes               |
| Update baselines intentionally               | Run `--update-snapshots` only after verifying changes     |
