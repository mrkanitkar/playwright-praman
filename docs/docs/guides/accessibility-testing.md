---
sidebar_position: 33
title: Accessibility Testing
---

How to use `@axe-core/playwright` alongside Praman to validate accessibility (a11y) in SAP
UI5 and Fiori applications. Covers ARIA roles in UI5 controls, common violations, and
integration patterns.

## Setup

Install the axe-core Playwright integration:

```bash
npm install --save-dev @axe-core/playwright
```

## Basic Accessibility Scan

```typescript
import { test, expect } from 'playwright-praman';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility - Purchase Order List', () => {
  test('list report page has no critical a11y violations', async ({ ui5Navigation, page }) => {
    await test.step('navigate to list report', async () => {
      await ui5Navigation.navigateToIntent('#PurchaseOrder-manage');
    });

    await test.step('run axe accessibility scan', async () => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      // Attach full results to the test report for review
      await test.info().attach('a11y-results', {
        body: JSON.stringify(results, null, 2),
        contentType: 'application/json',
      });

      expect(results.violations).toEqual([]);
    });
  });
});
```

## Targeted Scans

### Scan a Specific Region

```typescript
await test.step('scan only the table region', async () => {
  const results = await new AxeBuilder({ page })
    .include('.sapMTable') // CSS selector for the UI5 responsive table
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

### Exclude Known False Positives

SAP UI5 renders some elements that axe may flag incorrectly (e.g., ARIA attributes on custom
controls). Use `disableRules` to suppress known false positives:

```typescript
const results = await new AxeBuilder({ page })
  .disableRules([
    'color-contrast', // UI5 theme handles contrast; may flag themed controls
    'landmark-one-main', // FLP shell provides landmarks outside app scope
  ])
  .analyze();
```

## ARIA Roles in SAP UI5 Controls

UI5 controls emit standard ARIA roles. Understanding these helps you write targeted scans
and verify accessibility attributes.

| UI5 Control          | ARIA Role         | Notes                                                    |
| -------------------- | ----------------- | -------------------------------------------------------- |
| `sap.m.Button`       | `button`          | Includes `aria-pressed` for toggle buttons               |
| `sap.m.Input`        | `textbox`         | `aria-required`, `aria-invalid` from control state       |
| `sap.m.Select`       | `combobox`        | `aria-expanded` toggled on open/close                    |
| `sap.m.ComboBox`     | `combobox`        | `aria-autocomplete="list"`                               |
| `sap.m.Table`        | `grid` or `table` | Depends on responsive table mode                         |
| `sap.m.List`         | `listbox`         | Items have `role="option"`                               |
| `sap.m.Dialog`       | `dialog`          | `aria-modal="true"`, `aria-labelledby`                   |
| `sap.m.MessageStrip` | `alert`           | Auto-announced by screen readers                         |
| `sap.m.Panel`        | `region`          | `aria-labelledby` from header                            |
| `sap.m.IconTabBar`   | `tablist`         | Filters have `role="tab"`, content has `role="tabpanel"` |
| `sap.m.SearchField`  | `searchbox`       | `aria-label` from placeholder                            |
| `sap.m.CheckBox`     | `checkbox`        | `aria-checked` state                                     |
| `sap.m.RadioButton`  | `radio`           | `aria-checked`, grouped via `aria-labelledby`            |

## Testing ARIA Attributes with Praman

```typescript
test('verify input field accessibility attributes', async ({ ui5, page }) => {
  await test.step('check required field ARIA', async () => {
    const companyCode = await ui5.control({
      controlType: 'sap.m.Input',
      id: /companyCodeInput/,
    });

    // Get the DOM element to check ARIA attributes
    const locator = await companyCode.getLocator();
    await expect(locator).toHaveAttribute('aria-required', 'true');
    await expect(locator).toHaveAttribute('role', 'textbox');
  });

  await test.step('check error state ARIA', async () => {
    // Trigger validation by submitting empty required field
    await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });

    const errorInput = await ui5.control({
      controlType: 'sap.m.Input',
      properties: { valueState: 'Error' },
    });

    const locator = await errorInput.getLocator();
    await expect(locator).toHaveAttribute('aria-invalid', 'true');
  });
});
```

## Keyboard Navigation Testing

SAP UI5 supports keyboard navigation. Test common patterns:

```typescript
test('keyboard navigation through form fields', async ({ ui5, page }) => {
  await test.step('tab through form fields', async () => {
    const firstInput = await ui5.control({
      controlType: 'sap.m.Input',
      id: /supplierInput/,
    });
    const locator = await firstInput.getLocator();

    // Focus and tab
    await locator.focus();
    await page.keyboard.press('Tab');

    // Verify focus moved to next field
    const activeId = await page.evaluate(() => document.activeElement?.id);
    expect(activeId).toContain('purchOrgInput');
  });

  await test.step('escape closes dialog', async () => {
    // Open a value help dialog
    await ui5.click({
      controlType: 'sap.ui.core.Icon',
      properties: { src: 'sap-icon://value-help' },
    });

    // Verify dialog is open
    const dialog = await ui5.control({
      controlType: 'sap.m.Dialog',
      searchOpenDialogs: true,
    });
    expect(dialog).toBeTruthy();

    // Press Escape to close
    await page.keyboard.press('Escape');
  });

  await test.step('enter activates buttons', async () => {
    const saveButton = await ui5.control({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
    const locator = await saveButton.getLocator();
    await locator.focus();
    await page.keyboard.press('Enter');
  });
});
```

## Continuous Accessibility Monitoring

### Per-Page Scan in CI

Run axe on every page transition during E2E tests:

```typescript
// tests/helpers/a11y-helper.ts
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export async function assertAccessible(page: Page, context?: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast']) // Managed by UI5 theme
    .analyze();

  if (results.violations.length > 0) {
    const summary = results.violations
      .map((v) => `${v.id}: ${v.description} (${v.nodes.length} instances)`)
      .join('\n');
    throw new Error(`Accessibility violations${context ? ` on ${context}` : ''}:\n${summary}`);
  }
}
```

Usage in tests:

```typescript
import { assertAccessible } from './helpers/a11y-helper';

test('PO creation form is accessible', async ({ ui5Navigation, page }) => {
  await ui5Navigation.navigateToIntent('#PurchaseOrder-create');
  await assertAccessible(page, 'PO creation form');
});
```

### Reporting

Attach axe results to Playwright HTML report for post-test review:

```typescript
await test.info().attach('axe-violations', {
  body: JSON.stringify(results.violations, null, 2),
  contentType: 'application/json',
});
```

## Common UI5 Accessibility Issues

| Issue                                     | Affected Controls                    | Fix                                         |
| ----------------------------------------- | ------------------------------------ | ------------------------------------------- |
| Missing `aria-label` on icon-only buttons | `sap.m.Button` with `icon` only      | Set `tooltip` property in app code          |
| Duplicate IDs                             | Auto-generated fragment IDs          | Use `viewId` scoping in selectors           |
| Missing form labels                       | `sap.m.Input` without `sap.m.Label`  | Ensure labels are associated via `labelFor` |
| Low contrast in custom themes             | Custom CSS overrides                 | Test with default `sap_horizon` theme       |
| Missing heading hierarchy                 | `sap.m.Title` without semantic level | Set `level` property (H1-H6)                |
