---
title: 'From Selenium WebDriver'
description: 'Migrate from Selenium WebDriver to Playwright + Praman for SAP testing. Maps every Selenium concept (drivers, waits, locators, POM) to Playwright equivalents.'
---

Migrating from Selenium WebDriver (Java, Python, C#, or JavaScript) to Playwright + Praman for
SAP Fiori and UI5 web application testing. This guide maps every core Selenium concept to its
Praman equivalent, compares configuration, and provides a step-by-step migration path.

## Quick Comparison

| Aspect             | Selenium WebDriver                                 | Praman (Playwright)                                     |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------- |
| Protocol           | WebDriver (W3C) over HTTP                          | Chrome DevTools Protocol (CDP) / BiDi                   |
| Selector model     | `By.id`, `By.xpath`, `By.css`, `By.className`      | `UI5Selector` object (controlType, properties, binding) |
| UI5 awareness      | None (raw DOM only)                                | Native UI5 control registry access                      |
| Auto-waiting       | None (manual `WebDriverWait` + ExpectedConditions) | Built-in `waitForUI5Stable()` + auto-retry              |
| Parallel execution | Selenium Grid / TestNG / pytest-xdist              | Native Playwright workers                               |
| CI/CD integration  | Requires Grid or cloud service                     | Zero infrastructure (`npx playwright test`)             |
| Browser install    | Manual driver management (ChromeDriver)            | `npx playwright install` (auto-managed)                 |
| Language           | Java, Python, C#, JavaScript, Ruby, Kotlin         | TypeScript (first-class)                                |
| Test runner        | JUnit, TestNG, pytest, NUnit, Mocha                | Playwright Test (built-in)                              |
| Auth management    | Manual login scripts                               | 6 built-in strategies + setup projects                  |
| Reporting          | Allure, ExtentReports (third-party)                | Built-in HTML, JSON, JUnit reporters                    |
| AI integration     | None                                               | Built-in capabilities, recipes, agentic handler         |
| OData helpers      | None                                               | Model-level + HTTP-level CRUD                           |
| FLP navigation     | Manual URL construction                            | 9 typed navigation methods                              |
| Trace / debug      | Screenshots only                                   | Full trace (DOM snapshots, network, console, video)     |
| Page Object Model  | Class-based POMs                                   | Playwright fixtures (dependency injection)              |

## Core API Mapping

### Navigation, Discovery, Interaction, and Assertions

```java
// Selenium (Java)
driver.get("https://sap-system.example.com/.../FioriLaunchpad.html#PurchaseOrder-manage");

WebElement button = driver.findElement(By.id("__xmlview0--saveBtn"));
WebElement input  = driver.findElement(By.xpath("//input[@aria-label='Vendor']"));
button.click();
input.sendKeys("100001");

String text = driver.findElement(By.id("__xmlview0--statusText")).getText();
assertEquals("Active", text);
assertTrue(driver.findElement(By.id("__xmlview0--saveBtn")).isDisplayed());
```

```typescript
// Praman
import { test, expect } from 'playwright-praman';

test('PO overview', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
  await ui5.fill({ id: 'vendorInput' }, '100001');

  const status = await ui5.control({ id: 'statusText' });
  await expect(status).toHaveUI5Text('Active');
  await expect(await ui5.control({ id: 'saveBtn' })).toBeUI5Visible();
});
```

### Waiting for Elements

```java
// Selenium (Java) -- manual explicit waits
WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(30));
wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("__xmlview0--poTable")));
Thread.sleep(5000); // common anti-pattern
```

```typescript
// Praman -- no explicit waits needed
// ui5.control() automatically waits for UI5 bootstrap, pending OData requests,
// JS timeouts/intervals, and DOM stabilization before returning
const table = await ui5.control({ controlType: 'sap.m.Table', id: 'poTable' });
await expect(table).toHaveUI5RowCount({ min: 1 });
```

## Selector Mapping

Selenium selectors target raw DOM elements. Praman selectors target the UI5 control registry,
which survives UI5 version upgrades, theme changes, and DOM restructuring.

| Selenium Selector                    | Praman `UI5Selector` Equivalent                                          | Notes                                          |
| ------------------------------------ | ------------------------------------------------------------------------ | ---------------------------------------------- |
| `By.id("__xmlview0--myBtn")`         | `{ id: 'myBtn' }`                                                        | Praman strips view prefixes automatically      |
| `By.xpath("//button[@text='Save']")` | `{ controlType: 'sap.m.Button', properties: { text: 'Save' } }`          | Property matching replaces XPath               |
| `By.cssSelector(".sapMBtn")`         | `{ controlType: 'sap.m.Button' }`                                        | Control type replaces CSS class matching       |
| `By.className("sapMInputBaseInner")` | `{ controlType: 'sap.m.Input', id: 'myInput' }`                          | Target the control, not its inner DOM          |
| `By.linkText("Purchase Orders")`     | `{ controlType: 'sap.m.Link', properties: { text: 'Purchase Orders' } }` | Text property replaces link text               |
| `By.xpath("//div[@data-path]")`      | `{ bindingPath: { value: '/Vendor/Name' } }`                             | OData binding path matching                    |
| `By.xpath` with `contains()`         | `{ id: /partialMatch/ }`                                                 | RegExp ID matching                             |
| `By.xpath` with ancestor axis        | `{ ancestor: { controlType: 'sap.m.Panel', id: 'headerPanel' } }`        | Ancestor selector replaces XPath ancestor axis |
| N/A                                  | `{ searchOpenDialogs: true }`                                            | Dialog-aware search (no Selenium equivalent)   |

:::tip Generated IDs
Selenium tests for SAP UI5 apps commonly break because UI5 generates DOM IDs like
`__xmlview0--__button3`. These IDs change across page reloads, UI5 versions, and theme switches.
Praman's `UI5Selector` bypasses DOM IDs entirely by querying the UI5 control registry.
:::

## Config Mapping

### Selenium Capabilities (Java)

```java
ChromeOptions options = new ChromeOptions();
options.addArguments("--headless", "--window-size=1920,1080");
WebDriver driver = new ChromeDriver(options);
driver.manage().timeouts().implicitlyWait(Duration.ofSeconds(10));
driver.manage().timeouts().pageLoadTimeout(Duration.ofSeconds(60));
```

### Praman Config (playwright.config.ts + praman.config.ts)

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  retries: 1,
  workers: process.env.CI ? 2 : 1,
  use: {
    baseURL: process.env.SAP_BASE_URL,
    headless: true, // --headless
    viewport: { width: 1920, height: 1080 }, // --window-size
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth-setup\.ts/, teardown: 'teardown' },
    { name: 'teardown', testMatch: /auth-teardown\.ts/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'], storageState: '.auth/sap-session.json' },
    },
  ],
});
```

```typescript
// praman.config.ts
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  logLevel: 'info',
  ui5WaitTimeout: 30_000, // Replaces implicitlyWait + WebDriverWait
  controlDiscoveryTimeout: 10_000,
  interactionStrategy: 'ui5-native',
  auth: {
    strategy: 'basic',
    baseUrl: process.env.SAP_BASE_URL!,
    username: process.env.SAP_USER!,
    password: process.env.SAP_PASS!,
  },
});
```

## Page Object Model to Fixtures

Selenium teams almost universally use the Page Object Model. Praman replaces class-based POMs
with Playwright's fixture system -- dependency injection with automatic teardown.

### Selenium Page Object (Java)

```java
public class PurchaseOrderPage {
    @FindBy(id = "__xmlview0--vendorInput-inner") private WebElement vendorInput;
    @FindBy(id = "__xmlview0--saveBtn")           private WebElement saveButton;
    @FindBy(css = ".sapMMsgStrip")                private WebElement messageStrip;

    public PurchaseOrderPage(WebDriver d) { PageFactory.initElements(d, this); }
    public void fillVendor(String v)      { vendorInput.clear(); vendorInput.sendKeys(v); }
    public void save()                    { saveButton.click(); }
    public String getMessage()            { return messageStrip.getText(); }
}

// Test
PurchaseOrderPage po = new PurchaseOrderPage(driver);
po.fillVendor("100001");
po.save();
assertEquals("PO created", po.getMessage());
```

### Praman Fixture Equivalent

```typescript
import { test, expect } from 'playwright-praman';

test('create purchase order', async ({ ui5, ui5Navigation, ui5Footer }) => {
  await test.step('Navigate', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-create');
  });

  await test.step('Fill vendor', async () => {
    await ui5.fill({ id: 'vendorInput' }, '100001');
  });

  await test.step('Save', async () => {
    await ui5Footer.clickSave();
  });

  await test.step('Verify success', async () => {
    const message = await ui5.control({
      controlType: 'sap.m.MessageStrip',
      properties: { type: 'Success' },
      searchOpenDialogs: true,
    });
    await expect(message).toBeUI5Visible();
  });
});
```

For reusable logic across tests, extract helper functions instead of POM classes.

```typescript
// helpers/po-helpers.ts
import type { ExtendedUI5Handler } from 'playwright-praman';

export async function fillPOHeader(
  ui5: ExtendedUI5Handler,
  data: { vendor: string; purchaseOrg: string; companyCode: string },
): Promise<void> {
  await ui5.fill({ id: 'vendorInput' }, data.vendor);
  await ui5.fill({ id: 'purchOrgInput' }, data.purchaseOrg);
  await ui5.fill({ id: 'compCodeInput' }, data.companyCode);
}
```

## Hybrid Approach During Migration

You do not need to rewrite everything at once. Praman's `test` and `expect` are extended versions
of Playwright's -- `page.locator()` works alongside `ui5.control()` in the same test.

```typescript
import { test, expect } from 'playwright-praman';

test('hybrid test', async ({ page, ui5, ui5Navigation }) => {
  // Playwright handles login (before UI5 loads)
  await test.step('Login', async () => {
    await page.goto(process.env.SAP_BASE_URL!);
    await page.locator('#USERNAME_FIELD input').fill('TESTUSER');
    await page.locator('#PASSWORD_FIELD input').fill('secret');
    await page.locator('#LOGIN_LINK').click();
    await page.waitForURL('**/FioriLaunchpad*');
  });

  // Praman takes over once UI5 is loaded
  await test.step('Navigate and verify', async () => {
    await ui5Navigation.navigateToApp('PurchaseOrder-manage');
    await expect(page).toHaveTitle(/Purchase Orders/);

    const table = await ui5.control({ controlType: 'sap.m.Table', id: 'poTable' });
    await expect(table).toHaveUI5RowCount({ min: 1 });
  });
});
```

## New Features Only in Praman

Praman includes capabilities that have no Selenium equivalent. These are worth adopting early.

### 6 Built-In Auth Strategies

No more custom login scripts or cookie injection. Praman supports Basic, BTP SAML, Office 365,
Custom, API, and Certificate authentication out of the box.

```typescript
test('after auth', async ({ ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
});
```

### 9 FLP Navigation Methods

```typescript
test('navigation', async ({ ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');
  await ui5Navigation.navigateToTile('Create Purchase Order');
  await ui5Navigation.navigateToIntent(
    { semanticObject: 'PurchaseOrder', action: 'create' },
    { plant: '1000' },
  );
  await ui5Navigation.navigateToHome();
  await ui5Navigation.navigateBack();
});
```

### Fiori Elements Helpers

Dedicated APIs for List Report and Object Page patterns -- no more fragile XPath chains.

```typescript
test('FE list report', async ({ fe }) => {
  await fe.listReport.setFilter('Status', 'Active');
  await fe.listReport.search();
  await fe.listReport.navigateToItem(0);
  await fe.objectPage.clickEdit();
  await fe.objectPage.clickSave();
});
```

### AI-Powered Test Generation

```typescript
test('AI discovery', async ({ pramanAI }) => {
  const context = await pramanAI.discoverPage({ interactiveOnly: true });
  const result = await pramanAI.agentic.generateTest(
    'Create a purchase order for vendor 100001',
    page,
  );
});
```

### Custom UI5 Matchers

10 UI5-specific Playwright matchers -- replacing verbose Selenium assert chains.

```typescript
const button = await ui5.control({ id: 'saveBtn' });
await expect(button).toBeUI5Enabled();
await expect(button).toHaveUI5Text('Save');
await expect(button).toBeUI5Visible();
```

### OData Model + HTTP Operations

```typescript
test('OData', async ({ ui5 }) => {
  const data = await ui5.odata.getModelData('/PurchaseOrders');
  // HTTP-level CRUD with automatic CSRF handling
});
```

### SM12 Lock Management

```typescript
test('locks', async ({ flpLocks }) => {
  await flpLocks.deleteAllLockEntries('TESTUSER');
  // Auto-cleanup on teardown
});
```

### Structured Error Codes

Every Praman error includes a machine-readable `code`, `retryable` flag, and `suggestions[]`
array for self-healing tests. Selenium errors are raw `WebDriverException` messages with stack
traces but no recovery guidance.

## Step-by-Step Migration Checklist

1. **Install dependencies**: `npm install playwright-praman @playwright/test`
2. **Install browsers**: `npx playwright install`
3. **Create config files**: `praman.config.ts` and `playwright.config.ts` (see Config Mapping)
4. **Set up auth**: Create `tests/auth-setup.ts` using one of the 6 strategies
5. **Convert selectors**: Replace `By.id()` / `By.xpath()` / `By.css()` with `UI5Selector` objects
6. **Remove explicit waits**: Delete all `WebDriverWait`, `Thread.sleep()`, `implicitlyWait` -- Praman auto-waits
7. **Convert Page Objects**: Replace POM classes with fixture destructuring and helper functions
8. **Convert assertions**: Replace JUnit/TestNG `assertEquals` with Playwright `expect` + UI5 matchers
9. **Structure tests**: Convert `@Test` methods to `test()` + `test.step()` blocks
10. **Adopt navigation**: Replace `driver.get()` URL strings with `ui5Navigation` methods
11. **Remove driver management**: Delete ChromeDriver setup, Grid config, and teardown code
12. **Run and verify**: `npx playwright test`

## Team Workflow Transition

### From Java/Maven/Grid to TypeScript/npm/Playwright

| Workflow           | Selenium Stack                        | Praman Stack                                        |
| ------------------ | ------------------------------------- | --------------------------------------------------- |
| Language           | Java (+ Kotlin, Python, C#)           | TypeScript                                          |
| Build tool         | Maven / Gradle                        | npm                                                 |
| Test runner        | JUnit / TestNG                        | Playwright Test (built-in)                          |
| Test structure     | `@Test` annotated methods in classes  | `test()` functions in `.test.ts` files              |
| Page Objects       | Java classes with `@FindBy`           | Playwright fixtures + helper functions              |
| Driver management  | WebDriverManager / ChromeDriver       | `npx playwright install` (fully automatic)          |
| Parallel execution | Selenium Grid + TestNG parallel suite | `workers: 4` in `playwright.config.ts`              |
| CI/CD              | Grid server + nodes + Docker          | `npx playwright test` (zero infrastructure)         |
| Reporting          | Allure / ExtentReports plugin         | Built-in HTML report (`npx playwright show-report`) |
| Environment config | Maven profiles / `testng.xml`         | `.env` files + `playwright.config.ts` projects      |
| Version control    | Git (test code) + driver binaries     | Git (everything, no binaries)                       |
| IDE                | IntelliJ / Eclipse                    | VS Code (recommended) / any IDE                     |

### Suggested Team Transition Plan

**Week 1-2: Foundation**

- Install Node.js, VS Code, and Playwright on developer machines
- Complete the [Playwright Primer](./playwright-primer) (2-3 hours per person)
- Set up a Git repository for the test project

**Week 3-4: First Tests**

- Convert 3-5 Selenium test classes from a single Fiori app to Praman tests
- Set up authentication via setup projects (replaces Selenium login helpers)
- Run tests locally and review the HTML report

**Week 5-6: CI Integration**

- Add `npx playwright test` to your CI/CD pipeline (replaces Grid + Maven Surefire)
- Configure `screenshot: 'only-on-failure'` and `trace: 'on-first-retry'`
- Set up environment variables for SAP credentials in CI secrets

**Week 7-8: Scale**

- Convert remaining Selenium test suites in priority order
- Adopt Fiori Elements helpers (`fe.listReport`, `fe.objectPage`) for standard Fiori apps
- Enable parallel execution with 2-4 workers (replaces Selenium Grid)
- Decommission Selenium Grid infrastructure

### Role Mapping

| Selenium Role              | Praman Equivalent                                       |
| -------------------------- | ------------------------------------------------------- |
| SDET / Automation Engineer | Test Engineer (writes `.test.ts` files)                 |
| Grid Administrator         | Not needed (no infrastructure to manage)                |
| Driver / Browser Manager   | Not needed (`npx playwright install`)                   |
| Test Architect (POMs)      | Same role, designs fixtures and helper modules          |
| QA Lead / Manager          | Reviews PRs, reads Playwright HTML reports, monitors CI |
