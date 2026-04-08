---
title: POST Upgrade Testing
---

How to use Praman for validating SAP system upgrades, support pack stacks, and Fiori
library updates. Covers regression strategies, comparison testing, and upgrade-specific
failure patterns.

## Why Upgrade Testing Matters

SAP upgrades (S/4HANA feature packs, support pack stacks, UI5 library updates) can introduce:

- **UI changes**: New controls, removed controls, changed layouts
- **Behavior changes**: Different default values, changed validation rules
- **API changes**: New OData properties, deprecated fields, changed entity types
- **Performance changes**: Slower/faster rendering, different loading patterns

Praman tests catch these regressions before they reach end users.

## Upgrade Testing Strategy

### Three-Phase Approach

```text
Phase 1: Pre-Upgrade Baseline    → Run full regression, save results
Phase 2: Post-Upgrade Validation → Run same suite on upgraded system
Phase 3: Comparison              → Diff results, investigate failures
```

### Phase 1: Pre-Upgrade Baseline

Run the full regression suite and save artifacts:

```bash
# Run tests and save baseline results
npx playwright test \
  --project=regression \
  --reporter=json \
  --output=baseline-results/ \
  2>&1 | tee baseline-output.log

# Save screenshots for visual comparison
npx playwright test \
  --project=regression \
  --update-snapshots
```

### Phase 2: Post-Upgrade Validation

Run the identical test suite against the upgraded system:

```bash
# Run same tests against upgraded system
SAP_BASE_URL=https://upgraded-system.example.com \
npx playwright test \
  --project=regression \
  --reporter=json \
  --output=upgrade-results/
```

### Phase 3: Comparison

Compare test results between pre and post:

```typescript
// scripts/compare-results.ts
import { readFileSync } from 'node:fs';

interface TestResult {
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
}

const baseline: TestResult[] = JSON.parse(readFileSync('baseline-results/results.json', 'utf-8'));
const upgrade: TestResult[] = JSON.parse(readFileSync('upgrade-results/results.json', 'utf-8'));

// Find regressions: tests that passed before but fail now
const regressions = upgrade.filter((u) => {
  const base = baseline.find((b) => b.title === u.title);
  return base?.status === 'passed' && u.status === 'failed';
});

console.log(`Regressions: ${regressions.length}`);
regressions.forEach((r) => console.log(`  REGRESSION: ${r.title}`));
```

## Upgrade-Specific Test Patterns

### UI5 Version Check

Verify the UI5 version after upgrade:

```typescript
test('verify UI5 version after upgrade', async ({ ui5, page }) => {
  await test.step('check UI5 version', async () => {
    const version = await page.evaluate(() => sap.ui.version);
    expect(version).toMatch(/^1\.\d+\.\d+$/);

    // Verify minimum expected version after upgrade
    const [major, minor] = version.split('.').map(Number);
    expect(major).toBe(1);
    expect(minor).toBeGreaterThanOrEqual(120); // Expected post-upgrade version
  });
});
```

### Control Existence Validation

After major upgrades, controls may be replaced or removed:

```typescript
test.describe('Post-Upgrade Control Validation', () => {
  test('verify critical controls still exist', async ({ ui5, ui5Navigation }) => {
    await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });

    await test.step('SmartFilterBar exists', async () => {
      const filterBar = await ui5.control({
        controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar',
      });
      expect(filterBar).toBeTruthy();
    });

    await test.step('SmartTable exists', async () => {
      const table = await ui5.control({
        controlType: 'sap.ui.comp.smarttable.SmartTable',
      });
      expect(table).toBeTruthy();
    });

    await test.step('toolbar actions exist', async () => {
      const createBtn = await ui5.control({
        controlType: 'sap.m.Button',
        properties: { text: 'Create' },
      });
      expect(createBtn).toBeTruthy();
    });
  });
});
```

### Field Value Comparison

Compare default values and field behavior pre/post upgrade:

```typescript
test('verify default values unchanged after upgrade', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'create' });

  await test.step('company code defaults correctly', async () => {
    const field = await ui5.control({
      controlType: 'sap.ui.comp.smartfield.SmartField',
      bindingPath: { path: '/CompanyCode' },
    });
    const value = await field.getProperty('value');
    expect(value).toBe('1000');
  });

  await test.step('currency defaults correctly', async () => {
    const field = await ui5.control({
      controlType: 'sap.ui.comp.smartfield.SmartField',
      bindingPath: { path: '/DocumentCurrency' },
    });
    const value = await field.getProperty('value');
    expect(value).toBe('USD');
  });
});
```

### Performance Regression Detection

```typescript
test('page load time within acceptable range post-upgrade', async ({ ui5Navigation, page }) => {
  const measurements: number[] = [];

  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    await ui5Navigation.navigateToIntent({ semanticObject: 'PurchaseOrder', action: 'manage' });
    measurements.push(Date.now() - start);

    // Navigate away before next measurement
    await ui5Navigation.navigateToIntent({ semanticObject: 'Shell', action: 'home' });
  }

  const avgLoadTime = measurements.reduce((a, b) => a + b, 0) / measurements.length;

  await test.info().attach('performance-post-upgrade', {
    body: JSON.stringify({
      measurements,
      average: avgLoadTime,
      threshold: 8000,
    }),
    contentType: 'application/json',
  });

  // Allow 20% degradation from 5s baseline
  expect(avgLoadTime).toBeLessThan(8000);
});
```

## Playwright Config for Upgrade Testing

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // Auth setup
    {
      name: 'setup',
      testMatch: /auth-setup\.ts/,
    },

    // Smoke tests — run first, fail fast
    {
      name: 'upgrade-smoke',
      testDir: './tests/smoke',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
      },
    },

    // Full regression — only if smoke passes
    {
      name: 'upgrade-regression',
      testDir: './tests/regression',
      dependencies: ['upgrade-smoke'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/sap-session.json',
        trace: 'on', // Full trace for upgrade analysis
        screenshot: 'on', // Screenshot every test for comparison
      },
      retries: 1,
    },
  ],
});
```

## Common Upgrade Failure Patterns

| Failure Pattern     | Symptom                             | Root Cause                       | Fix                              |
| ------------------- | ----------------------------------- | -------------------------------- | -------------------------------- |
| Control not found   | `ERR_CONTROL_NOT_FOUND`             | Control type renamed or replaced | Update `controlType` in selector |
| Property removed    | `getProperty()` returns `undefined` | OData annotation change          | Update property name             |
| Layout change       | Screenshot diff                     | New Fiori design guidelines      | Update visual baselines          |
| New mandatory field | Save fails with validation error    | New field added by upgrade       | Add field fill to test           |
| Deprecation         | Console warnings                    | API deprecated in new version    | Use replacement API              |
| Auth flow change    | Login fails                         | New SSO redirect                 | Update auth strategy             |

## Upgrade Testing Checklist

- [ ] Save pre-upgrade baseline (test results + screenshots)
- [ ] Document current UI5 version: `await page.evaluate(() => sap.ui.version)`
- [ ] Run smoke tests first (auth, navigation, basic CRUD)
- [ ] Run full regression suite
- [ ] Compare visual snapshots (see [Visual Regression](./visual-regression.md))
- [ ] Check OData responses for schema changes
- [ ] Verify performance within acceptable thresholds
- [ ] Check browser console for new deprecation warnings
- [ ] Update selectors for any renamed/replaced controls
- [ ] Update visual baselines after intentional UI changes
- [ ] Document all upgrade-related test changes for future reference
