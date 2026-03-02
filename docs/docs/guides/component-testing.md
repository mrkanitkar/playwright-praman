---
title: Component Testing
---

How to test individual UI5 components in isolation using Playwright's `webServer` option with
`ui5 serve`. Covers setup, component bootstrapping, and isolated testing patterns.

## What Is Component Testing?

Component testing runs a single UI5 component (a view, fragment, or reusable control) outside
the full Fiori Launchpad. This approach provides:

- **Speed**: No FLP shell, no authentication, no full app bootstrap
- **Isolation**: Test one component without side effects from others
- **Reliability**: No backend dependency when combined with OData mocks
- **Parallelism**: Multiple workers can test different components simultaneously

## Prerequisites

- UI5 Tooling CLI: `npm install --save-dev @ui5/cli`
- A UI5 app with `ui5.yaml` configuration
- Playwright with Praman

## Project Setup

### UI5 App Structure

```
my-ui5-app/
  webapp/
    Component.js
    manifest.json
    view/
      Main.view.xml
    controller/
      Main.controller.js
    test/
      component/
        index.html        # Component test harness
  ui5.yaml
  playwright.config.ts
```

### Component Test Harness

Create a minimal HTML page that bootstraps just the component under test:

```html
<!-- webapp/test/component/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Component Test</title>
    <script
      id="sap-ui-bootstrap"
      src="https://sdk.openui5.org/resources/sap-ui-core.js"
      data-sap-ui-theme="sap_horizon"
      data-sap-ui-libs="sap.m, sap.ui.comp"
      data-sap-ui-compatVersion="edge"
      data-sap-ui-resourceroots='{ "my.app": "../../" }'
      data-sap-ui-async="true"
    ></script>
    <script>
      sap.ui.require(['sap/ui/core/ComponentContainer'], function (ComponentContainer) {
        new ComponentContainer({
          name: 'my.app',
          async: true,
          settings: {},
          height: '100%',
        }).placeAt('content');
      });
    </script>
  </head>
  <body>
    <div id="content"></div>
  </body>
</html>
```

### Playwright Config with ui5 serve

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/component',
  timeout: 30_000,

  webServer: {
    command: 'npx ui5 serve --port 8080',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },

  use: {
    baseURL: 'http://localhost:8080',
  },

  projects: [
    {
      name: 'component-tests',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

## Writing Component Tests

### Basic Component Render Test

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Main View Component', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the component test harness
    await page.goto('/test/component/index.html');

    // Wait for UI5 to fully bootstrap
    await page.waitForFunction(() => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return window.sap?.ui?.getCore()?.isInitialized() === true;
    });
  });

  test('main view renders correctly', async ({ ui5 }) => {
    await test.step('page title is displayed', async () => {
      const title = await ui5.control({
        controlType: 'sap.m.Title',
        properties: { text: 'Purchase Orders' },
      });
      expect(title).toBeTruthy();
    });

    await test.step('table is present', async () => {
      const table = await ui5.control({
        controlType: 'sap.m.Table',
      });
      expect(table).toBeTruthy();
    });

    await test.step('create button exists', async () => {
      const btn = await ui5.control({
        controlType: 'sap.m.Button',
        properties: { text: 'Create' },
      });
      expect(btn).toBeTruthy();
    });
  });
});
```

### Component with Mocked OData

Combine component testing with OData mocking for fully offline tests:

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Purchase Order List Component (Offline)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock OData before loading the component
    await page.route('**/odata/**', async (route) => {
      const url = route.request().url();

      if (url.includes('$metadata')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/xml',
          body: '<edmx:Edmx Version="1.0"></edmx:Edmx>',
        });
      } else if (url.includes('PurchaseOrders')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            d: {
              results: [
                { PurchaseOrder: '4500000001', Supplier: '100001', Status: 'Approved' },
                { PurchaseOrder: '4500000002', Supplier: '100002', Status: 'Pending' },
              ],
            },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/test/component/index.html');
  });

  test('displays purchase orders from mock data', async ({ ui5, ui5Matchers }) => {
    const table = await ui5.control({ controlType: 'sap.m.Table' });
    await ui5Matchers.toHaveRowCount(table, 2);
  });
});
```

### Testing Individual Views

Test a single view without the full Component bootstrap:

```html
<!-- webapp/test/component/view-test.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script
      id="sap-ui-bootstrap"
      src="https://sdk.openui5.org/resources/sap-ui-core.js"
      data-sap-ui-theme="sap_horizon"
      data-sap-ui-libs="sap.m"
      data-sap-ui-resourceroots='{ "my.app": "../../" }'
      data-sap-ui-async="true"
    ></script>
    <script>
      sap.ui.require(['sap/ui/core/mvc/XMLView'], function (XMLView) {
        XMLView.create({
          viewName: 'my.app.view.Detail',
        }).then(function (view) {
          view.placeAt('content');
        });
      });
    </script>
  </head>
  <body>
    <div id="content"></div>
  </body>
</html>
```

```typescript
test.describe('Detail View (Isolated)', () => {
  test('detail view renders form fields', async ({ page, ui5 }) => {
    await page.goto('/test/component/view-test.html');

    const inputs = await ui5.controls({
      controlType: 'sap.m.Input',
    });
    expect(inputs.length).toBeGreaterThan(0);
  });
});
```

### Testing Fragments

```html
<!-- webapp/test/component/fragment-test.html -->
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <script
      id="sap-ui-bootstrap"
      src="https://sdk.openui5.org/resources/sap-ui-core.js"
      data-sap-ui-theme="sap_horizon"
      data-sap-ui-libs="sap.m"
      data-sap-ui-resourceroots='{ "my.app": "../../" }'
      data-sap-ui-async="true"
    ></script>
    <script>
      sap.ui.require(['sap/ui/core/Fragment'], function (Fragment) {
        Fragment.load({
          name: 'my.app.view.AddressForm',
          type: 'XML',
        }).then(function (fragment) {
          fragment.placeAt('content');
        });
      });
    </script>
  </head>
  <body>
    <div id="content"></div>
  </body>
</html>
```

## Testing Controller Logic

Use component tests to validate controller behavior in a real browser:

```typescript
test('controller handles form validation', async ({ page, ui5 }) => {
  await page.goto('/test/component/index.html');

  await test.step('submit empty form triggers validation', async () => {
    await ui5.click({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });

    // Check for validation error state on required fields
    const errorInputs = await ui5.controls({
      controlType: 'sap.m.Input',
      properties: { valueState: 'Error' },
    });
    expect(errorInputs.length).toBeGreaterThan(0);
  });

  await test.step('filling required fields clears errors', async () => {
    await ui5.fill({ controlType: 'sap.m.Input', id: /nameInput/ }, 'Test Value');

    const nameInput = await ui5.control({
      controlType: 'sap.m.Input',
      id: /nameInput/,
    });
    const valueState = await nameInput.getProperty('valueState');
    expect(valueState).toBe('None');
  });
});
```

## CI Integration

### Component Test Workflow

```yaml
# .github/workflows/component-tests.yml
name: Component Tests
on: [push, pull_request]

jobs:
  component-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install chromium
      - run: npx playwright test --project=component-tests
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: component-test-report
          path: playwright-report/
```

## Component Testing vs E2E Testing

| Aspect      | Component Test        | E2E Test                    |
| ----------- | --------------------- | --------------------------- |
| Scope       | Single view/component | Full app + backend          |
| Speed       | Fast (seconds)        | Slow (minutes)              |
| Auth        | None needed           | Setup project required      |
| Data        | Mocked (page.route)   | Real SAP backend            |
| CI          | Every push            | Nightly or pre-release      |
| Parallelism | High (4+ workers)     | Low (1 worker for stateful) |
| Failures    | Logic/rendering bugs  | Integration issues          |

## Best Practices

- **One harness per component**: Keep test HTML files focused on a single component.
- **Mock at the OData level**: Let the UI5 model parse mock data for realistic behavior.
- **Reuse mock factories**: Share mock data creation across component and E2E tests.
- **Test interactions, not DOM**: Use Praman selectors and matchers, not CSS selectors.
- **Run in CI on every push**: Component tests are fast enough for PR gates.
