---
title: 'Playwright Primer for SAP Testers'
description: 'Learn Playwright from scratch as an SAP tester. Covers TypeScript basics, async/await, fixtures, assertions, and test structure for Fiori apps.'
keywords:
  - playwright tutorial sap testers
  - sap ecatt to playwright migration
  - playwright basics for beginners
  - sap fiori test automation playwright
  - playwright fixtures tutorial
---

:::info[In this guide]

- Understand why Playwright is the right tool for SAP Fiori and UI5 web apps
- Learn the TypeScript and async/await fundamentals needed for writing tests
- Write and run your first Playwright test with Praman fixtures
- Use `test.step()`, assertions, and fixtures to structure SAP test flows
- Map familiar SAP testing concepts (ECATT, Tosca) to Playwright equivalents

:::

A ground-up introduction to Playwright and Praman for testers coming from SAP testing backgrounds
(ECATT, Tosca, QTP/UFT, Solution Manager, CBTA). No prior Playwright or programming experience
is assumed.

## What Is Playwright?

Playwright is an open-source test automation framework from Microsoft. It drives real browsers
(Chrome, Firefox, Safari) to simulate user interactions -- clicking buttons, filling forms,
reading text -- and verifies that applications behave correctly.

Unlike SAP GUI-based tools, Playwright works with **web applications in the browser**. Since
SAP Fiori, SAP UI5, and BTP apps all run in the browser, Playwright is a natural fit.

### Why Not ECATT or Tosca?

| Concern              | ECATT / Tosca              | Playwright + Praman                                 |
| -------------------- | -------------------------- | --------------------------------------------------- |
| SAP GUI support      | Native                     | Not applicable (browser only)                       |
| Fiori / UI5 web apps | Limited or plugin-required | Native + UI5-aware                                  |
| Parallel execution   | Difficult                  | Built-in                                            |
| CI/CD integration    | Complex setup              | First-class (GitHub Actions, Azure DevOps, Jenkins) |
| Cost                 | Licensed                   | Open source                                         |
| Version control      | Limited                    | Git-native (tests are code files)                   |
| AI integration       | None                       | Built-in LLM + agentic support                      |

:::tip When to Keep SAP GUI Tools
If your tests target **SAP GUI transactions** (not Fiori web apps), tools like ECATT or Tosca
remain the right choice. Playwright and Praman target **browser-based** SAP applications only.
:::

## Prerequisite Learning Path

If you are starting from zero programming experience, follow this learning path before writing
Praman tests. Each step builds on the previous one.

### Step 1: Command Line Basics (1 hour)

Learn to navigate directories, run commands, and use a terminal.

- **Windows**: Open PowerShell or Windows Terminal
- **macOS/Linux**: Open Terminal

Key commands to learn:

```bash
# Navigate to a folder
cd Documents/my-project

# List files
ls

# Run a Node.js script
node my-script.js

# Run tests
npx playwright test
```

### Step 2: Node.js and npm (1 hour)

Install Node.js (version 22 or later) from [nodejs.org](https://nodejs.org).

```bash
# Verify installation
node --version   # Should print v22.x.x or later
npm --version    # Should print 10.x.x or later

# Create a new project
mkdir my-sap-tests
cd my-sap-tests
npm init -y

# Install dependencies
npm install playwright-praman @playwright/test
npx playwright install chromium
```

### Step 3: TypeScript Basics (2-3 hours)

Tests are written in TypeScript, a typed version of JavaScript. You need to understand:

- **Variables**: `const name = 'John';` (a value that does not change)
- **Strings**: `'Hello'` or `"Hello"` or `` `Hello ${name}` ``
- **Objects**: `{ vendor: '100001', amount: 500 }` (a group of named values)
- **Arrays**: `['item1', 'item2', 'item3']` (a list of values)
- **Functions**: `function greet(name: string) { return 'Hello ' + name; }`
- **Arrow functions**: `const greet = (name: string) => 'Hello ' + name;`

Free resource: [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

### Step 4: async/await (30 minutes)

Browser operations take time (loading pages, finding elements, clicking buttons). TypeScript
uses `async/await` to handle this waiting gracefully.

```typescript
// BAD: This does NOT wait for the page to load
function badExample() {
  page.goto('https://my-app.com'); // Returns immediately, page not loaded yet
}

// GOOD: This waits for the page to finish loading
async function goodExample() {
  await page.goto('https://my-app.com'); // Pauses here until page loads
}
```

**Rule of thumb**: Every function that interacts with the browser needs `async` in its
declaration and `await` before each browser call.

## Your First Playwright Test

Create a file called `tests/hello.test.ts`:

```typescript
// tests/hello.test.ts
import { test, expect } from 'playwright-praman';

test('my first test', async ({ page }) => {
  // Go to a web page
  await page.goto('https://example.com');

  // Check the page title
  await expect(page).toHaveTitle('Example Domain');
});
```

Run it:

```bash
npx playwright test tests/hello.test.ts
```

### Anatomy of a Test

```typescript
import { test, expect } from 'playwright-praman';
//     ^^^^  ^^^^^^
//     |     Tool for checking results ("assertions")
//     Framework for defining tests

test('description of what this test verifies', async ({ page }) => {
  //   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^       ^^^^^^
  //   Human-readable test name                          "page" = a browser tab

  await page.goto('https://my-app.com');
  //    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //    Navigate the browser to this URL

  const heading = page.locator('h1');
  //                   ^^^^^^^
  //                   Find an element on the page

  await expect(heading).toHaveText('Welcome');
  //    ^^^^^^                     ^^^^^^^^^^
  //    Assert/verify              Expected value
});
```

## Fixtures: Automatic Setup

In ECATT, you might use "variants" to inject test data. In Playwright, **fixtures** provide
pre-configured objects to your tests automatically.

```typescript
// tests/fixtures-demo.spec.ts
import { test, expect } from 'playwright-praman';

test('using fixtures', async ({ ui5, ui5Navigation, sapAuth }) => {
  //                           ^^^  ^^^^^^^^^^^^^^  ^^^^^^^
  //                           |    |               Authentication helper
  //                           |    Navigation helper (9 methods)
  //                           UI5 control finder and interaction API

  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  const btn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create' } });
  await expect(btn).toBeUI5Enabled();
});
```

You request fixtures by name in the test function signature. Praman provides 13 fixture modules:

| Fixture         | What It Does                                          |
| --------------- | ----------------------------------------------------- |
| `ui5`           | Find and interact with UI5 controls                   |
| `ui5Navigation` | Navigate FLP apps, tiles, intents                     |
| `sapAuth`       | Login/logout with 6 strategies                        |
| `fe`            | Fiori Elements List Report + Object Page helpers      |
| `pramanAI`      | AI page discovery and test generation                 |
| `intent`        | Business domain intents (procurement, sales, finance) |
| `ui5Shell`      | FLP shell header (home, user menu)                    |
| `ui5Footer`     | Page footer bar (Save, Edit, Delete)                  |
| `flpLocks`      | SM12 lock management                                  |
| `flpSettings`   | User settings reader                                  |
| `testData`      | Test data generation with auto-cleanup                |

## test.step(): Structured Test Steps

In ECATT, test scripts have numbered steps. In Playwright, use `test.step()` to create the
same structure.

```typescript
// tests/purchase-order.spec.ts
import { test, expect } from 'playwright-praman';

test('create a purchase order', async ({ ui5, ui5Navigation, fe }) => {
  await test.step('Step 1: Navigate to the PO app', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  });

  await test.step('Step 2: Click Create', async () => {
    await ui5.click({
      controlType: 'sap.m.Button',
      properties: { text: 'Create' },
    });
  });

  await test.step('Step 3: Fill the vendor field', async () => {
    await ui5.fill({ id: 'vendorInput' }, '100001');
  });

  await test.step('Step 4: Save', async () => {
    await fe.objectPage.clickSave();
  });

  await test.step('Step 5: Verify success message', async () => {
    const messageStrip = await ui5.control({
      controlType: 'sap.m.MessageStrip',
      properties: { type: 'Success' },
    });
    await expect(messageStrip).toBeUI5Visible();
  });
});
```

Steps appear as collapsible sections in the Playwright HTML report.

## Assertions: Checking Results

Assertions verify that the application behaves correctly. If an assertion fails, the test fails.

### Standard Playwright Assertions

```typescript
// Check page title
await expect(page).toHaveTitle('Purchase Orders');

// Check URL
await expect(page).toHaveURL(/PurchaseOrder/);

// Check text content
await expect(page.locator('#message')).toHaveText('Saved');
```

### Praman UI5 Assertions

```typescript
const button = await ui5.control({ id: 'saveBtn' });

// Is the button enabled?
await expect(button).toBeUI5Enabled();

// Does it have the right text?
await expect(button).toHaveUI5Text('Save');

// Is it visible?
await expect(button).toBeUI5Visible();

// Check a specific property
await expect(button).toHaveUI5Property('type', 'Emphasized');

// Check value state (for inputs)
const input = await ui5.control({ id: 'amountInput' });
await expect(input).toHaveUI5ValueState('Error');
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test tests/purchase-order.test.ts

# Run tests matching a name pattern
npx playwright test --grep "purchase order"

# Run with visible browser (headed mode)
npx playwright test --headed

# Run in debug mode (step through interactively)
npx playwright test --debug
```

### Viewing Reports

```bash
# Open the HTML report after a test run
npx playwright show-report
```

The HTML report shows:

- Pass/fail status for each test
- `test.step()` sections collapsed per step
- Screenshots on failure (automatic)
- Traces on retry (automatic)

## Project Structure

A typical Praman test project looks like this:

```text
my-sap-tests/
  tests/
    auth-setup.ts          # Login once, save session
    auth-teardown.ts       # Logout
    purchase-order.test.ts # Test file
    vendor.test.ts         # Another test file
  .auth/
    sap-session.json       # Saved browser session (auto-generated, git-ignored)
  .env                     # Environment variables (git-ignored)
  praman.config.ts         # Praman configuration
  playwright.config.ts     # Playwright configuration
  package.json             # Dependencies
  tsconfig.json            # TypeScript configuration
```

## Common Patterns

### Finding a UI5 Control

```typescript
// By ID
const btn = await ui5.control({ id: 'saveBtn' });

// By type + property
const input = await ui5.control({
  controlType: 'sap.m.Input',
  properties: { placeholder: 'Enter vendor' },
});

// By binding path
const field = await ui5.control({
  controlType: 'sap.m.Input',
  bindingPath: { value: '/PurchaseOrder/Vendor' },
});
```

### Interacting with Controls

```typescript
// Click
await ui5.click({ id: 'submitBtn' });

// Type text
await ui5.fill({ id: 'nameInput' }, 'John Doe');

// Select from dropdown
await ui5.select({ id: 'countrySelect' }, 'US');

// Toggle checkbox
await ui5.check({ id: 'agreeCheckbox' });

// Clear a field
await ui5.clear({ id: 'searchField' });
```

### Navigating SAP Apps

```typescript
// Navigate to an app by semantic object and action
await ui5Navigation.navigateToApp('PurchaseOrder-manage');

// Navigate to a tile by title
await ui5Navigation.navigateToTile('Create Purchase Order');

// Navigate with parameters
await ui5Navigation.navigateToIntent(
  { semanticObject: 'PurchaseOrder', action: 'create' },
  { plant: '1000' },
);

// Go home
await ui5Navigation.navigateToHome();
```

## Glossary for SAP Testers

| SAP Term                    | Playwright/Praman Equivalent                       |
| --------------------------- | -------------------------------------------------- |
| Test script                 | Test file (`.test.ts`)                             |
| Test step / script line     | `test.step()`                                      |
| Variant / test data set     | `testData.generate()` fixture                      |
| Check / verification        | `expect()` assertion                               |
| Test configuration          | `playwright.config.ts` + `praman.config.ts`        |
| Transaction code            | `ui5Navigation.navigateToIntent()`                 |
| Control ID                  | `UI5Selector.id`                                   |
| Element repository          | UI5 control registry (queried via `ui5.control()`) |
| Test run                    | `npx playwright test`                              |
| Test report                 | `npx playwright show-report` (HTML)                |
| Reusable component / module | Playwright fixture                                 |
| Test suite                  | `describe()` block or test file                    |

:::warning[Common mistake]
Do not forget `await` before browser calls. Every function that interacts with the browser
(clicking, filling, navigating) returns a Promise. Missing `await` causes the operation to fire
without waiting for completion, leading to flaky tests and confusing errors.

```typescript
// Wrong — missing await
ui5.press({ id: 'saveBtn' }); // Returns immediately, button may not be clicked

// Correct — await pauses until the action completes
await ui5.press({ id: 'saveBtn' });
```

:::

## FAQ

<details>
<summary>Do I need to learn TypeScript before using Praman?</summary>

You need basic TypeScript knowledge — variables, strings, objects, and `async/await`. The
[Step 3: TypeScript Basics](#step-3-typescript-basics-2-3-hours) section above covers what you need in
2-3 hours. You do not need advanced TypeScript features like generics, decorators, or type guards.

If you use AI agents to generate tests, you need even less TypeScript knowledge — the agents
write the code for you. You only need to understand enough to review and modify generated tests.

</details>

<details>
<summary>What is the difference between page.locator() and ui5.control()?</summary>

`page.locator()` is Playwright's built-in method that finds elements by CSS selectors, text, or
test IDs in the DOM. It works for any web application.

`ui5.control()` is Praman's method that finds controls through the **UI5 runtime control
registry**. It uses control types (`sap.m.Button`), properties (`{ text: 'Save' }`), and binding
paths — not DOM selectors. This is more stable because UI5 control IDs and DOM structure change
between versions, but the control registry API is the stable contract.

**Rule**: Use `ui5.control()` for all UI5 controls. Use `page.locator()` only for non-UI5 elements
(plain HTML, FLP shell tabs, iframes).

</details>

<details>
<summary>How do I run just one test instead of all tests?</summary>

Use the `--grep` flag or specify the test file directly:

```bash
# Run a specific file
npx playwright test tests/purchase-order.test.ts

# Run tests matching a name pattern
npx playwright test --grep "create purchase order"

# Run in debug mode with visible browser
npx playwright test tests/purchase-order.test.ts --headed --debug
```

</details>

<details>
<summary>What happens if my test fails?</summary>

Playwright automatically captures screenshots on failure and generates an HTML report. View it:

```bash
npx playwright show-report
```

The report shows the exact step that failed, a screenshot of the browser state, and the error
message. If you use `test.step()`, the report shows which step failed within the test.

For SAP-specific failures (`ERR_CONTROL_NOT_FOUND`, `ERR_BRIDGE_TIMEOUT`), Praman errors include
`suggestions[]` with actionable fixes.

</details>

:::tip[Next steps]

- **[Getting Started →](./getting-started)** — Install Praman and generate your first SAP test with AI agents
- **[Selectors Guide →](./selectors)** — Deep dive into `ui5.control()` selector syntax for SAP controls
- **[Authentication Guide →](./authentication)** — Configure SAP login for your test environment

:::
