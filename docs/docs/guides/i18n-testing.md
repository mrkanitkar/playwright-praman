---
sidebar_position: 51
title: 'Localization & i18n Testing'
---

# Localization & i18n Testing

SAP applications serve a global user base. Testing across languages, locales, and text directions ensures that UI elements render correctly regardless of the user's language settings. This guide covers language-independent selectors, locale switching, RTL testing, and format validation.

## Language-Independent Selectors with i18NText

Hardcoded text selectors like `{ text: 'Save' }` break when the app runs in German (`Sichern`) or Japanese. Praman's `i18NText` selector matches controls by their i18n resource bundle key instead of the displayed text:

```typescript
import { test, expect } from 'playwright-praman';

test('click save button regardless of language', async ({ ui5 }) => {
  await ui5.click({
    controlType: 'sap.m.Button',
    i18NText: { propertyName: 'text', key: 'SAVE_BUTTON' },
  });
});
```

The `i18NText` selector resolves the resource bundle key at runtime, matching the control whose bound text property points to that key. This makes tests language-agnostic.

### How i18NText Resolution Works

1. Praman reads the control's binding info for the specified property (`text`).
2. It checks whether the binding references a resource bundle model (typically `i18n`).
3. It compares the bound key against the `key` parameter you provided.
4. If they match, the control is selected -- regardless of what the displayed text says.

```typescript
// Match by specific resource bundle model name
await ui5.click({
  controlType: 'sap.m.Button',
  i18NText: {
    propertyName: 'text',
    key: 'SUBMIT_ORDER',
    modelName: 'i18n', // optional, defaults to 'i18n'
  },
});
```

## Switching Languages via SAP User Settings

To test a specific locale, set the `sap-language` URL parameter before navigating:

```typescript
test('verify German labels', async ({ ui5, page }) => {
  await page.goto('/app?sap-language=DE');
  await ui5.waitForUI5();

  await test.step('Verify German text on save button', async () => {
    const buttonText = await ui5.getText({
      controlType: 'sap.m.Button',
      i18NText: { propertyName: 'text', key: 'SAVE_BUTTON' },
    });
    expect(buttonText).toBe('Sichern');
  });
});
```

### Testing Multiple Languages

Use parameterized tests to verify translations across locales:

```typescript
const locales = [
  { lang: 'EN', expected: 'Save' },
  { lang: 'DE', expected: 'Sichern' },
  { lang: 'FR', expected: 'Enregistrer' },
];

for (const { lang, expected } of locales) {
  test(`save button label in ${lang}`, async ({ ui5, page }) => {
    await page.goto(`/app?sap-language=${lang}`);
    await ui5.waitForUI5();
    const text = await ui5.getText({
      controlType: 'sap.m.Button',
      i18NText: { propertyName: 'text', key: 'SAVE_BUTTON' },
    });
    expect(text).toBe(expected);
  });
}
```

## FLP Language Parameter

When testing inside the SAP Fiori Launchpad, set the language via the FLP URL hash parameter:

```typescript
test('open FLP in French', async ({ page, ui5 }) => {
  await page.goto('/sap/bc/ui2/flp?sap-language=FR#Shell-home');
  await ui5.waitForUI5();
});
```

The `sap-language` parameter must appear before the `#` hash. It affects all apps launched from the FLP during that session.

## RTL Layout Testing

Arabic, Hebrew, and other right-to-left (RTL) languages require layout verification. SAP UI5 automatically mirrors the layout when an RTL locale is active:

```typescript
test('verify RTL layout for Arabic', async ({ ui5, page }) => {
  await page.goto('/app?sap-language=AR');
  await ui5.waitForUI5();

  await test.step('Check document direction', async () => {
    const dir = await page.evaluate(() => document.documentElement.dir);
    expect(dir).toBe('rtl');
  });

  await test.step('Verify toolbar alignment', async () => {
    const toolbar = page.locator('.sapMTB');
    await expect(toolbar).toHaveCSS('direction', 'rtl');
  });
});
```

## Date and Number Format Validation

SAP formats dates and numbers according to the user's locale. Validate that formatted values match locale expectations:

```typescript
test('date format matches German locale', async ({ ui5, page }) => {
  await page.goto('/app?sap-language=DE');
  await ui5.waitForUI5();

  const dateValue = await ui5.getText({ id: 'createdAtField' });
  // German date format: DD.MM.YYYY
  expect(dateValue).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
});

test('number format matches French locale', async ({ ui5, page }) => {
  await page.goto('/app?sap-language=FR');
  await ui5.waitForUI5();

  const amount = await ui5.getText({ id: 'totalAmount' });
  // French uses comma as decimal separator and space as thousands separator
  expect(amount).toMatch(/[\d\s]+,\d{2}/);
});
```

## Common Pitfalls

- **Hardcoded text assertions**: Never assert against hardcoded display text in multi-locale tests. Use `i18NText` for selectors and verify the text only when explicitly testing a specific locale.
- **Missing translations**: If an i18n key is missing from a locale's `.properties` file, UI5 falls back to the default (usually English). Your test might pass even though the translation is absent.
- **RTL pseudo-mirrors**: Some CSS properties (like `margin-left`) are automatically mirrored by UI5's RTL support, but custom CSS may not be. Test RTL with actual RTL locales.
- **sap-language vs. browser locale**: The `sap-language` URL parameter overrides the browser's `Accept-Language` header. If you need browser-locale-based behavior, set the locale in the Playwright browser context instead.
- **Session stickiness**: Once the FLP establishes a language, navigating to a different app preserves it. Close and reopen the browser context to reset the language cleanly.
