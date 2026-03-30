---
title: Glossary
---

Definitions of key terms used throughout Praman documentation. Each term includes a definition,
the equivalent concept in SAP Tosca, and the equivalent in wdi5.

## A

### Assertion

A verification that checks whether the application state matches expectations. Praman uses
Playwright's `expect()` and custom SAP-specific matchers.

| Framework  | Term / API                        |
| ---------- | --------------------------------- |
| **Praman** | `expect(control).toHaveUI5Text()` |
| **Tosca**  | Verify module, TBox verification  |
| **wdi5**   | `expect()` (Jasmine/Mocha)        |

### Auto-Waiting

Playwright automatically waits for elements to be actionable (visible, enabled, stable) before
performing actions. Praman extends this with UI5-specific waiting (pending requests, framework
busy).

| Framework  | Term / API                     |
| ---------- | ------------------------------ |
| **Praman** | Built-in, `waitForUI5Stable()` |
| **Tosca**  | Implicit synchronization       |
| **wdi5**   | `wdi5.waitForUI5()`            |

## B

### Bridge

The communication layer between Node.js (Playwright) and the browser's UI5 runtime. Praman
sends commands via `page.evaluate()` to interact with the UI5 control tree.

| Framework  | Term / API                     |
| ---------- | ------------------------------ |
| **Praman** | `BridgeAdapter`, `#bridge/*`   |
| **Tosca**  | Engine / Scan                  |
| **wdi5**   | `wdi5` bridge (WebSocket/HTTP) |

### Browser Context

A Playwright concept representing an isolated browser session with its own cookies, storage,
and cache. Used for parallel test isolation.

| Framework  | Term / API                    |
| ---------- | ----------------------------- |
| **Praman** | `BrowserContext` (Playwright) |
| **Tosca**  | Browser instance              |
| **wdi5**   | Browser session (WebDriverIO) |

## C

### Capability

A named feature that Praman exposes, combining multiple low-level operations into a high-level
business action. Capabilities are discoverable by AI agents.

| Framework  | Term / API                                   |
| ---------- | -------------------------------------------- |
| **Praman** | `@capability` TSDoc tag, capability registry |
| **Tosca**  | Module                                       |
| **wdi5**   | Not available                                |

### Control

A UI5 widget (button, input, table, etc.) managed by the UI5 framework. Controls have
properties, events, and aggregations. Praman interacts with controls via their UI5 identity,
not their DOM representation.

| Framework  | Term / API                      |
| ---------- | ------------------------------- |
| **Praman** | `ui5.control()`, `ControlProxy` |
| **Tosca**  | Control / TBox                  |
| **wdi5**   | `browser.asControl()`           |

## F

### Fixture

A Playwright concept for dependency injection in tests. Fixtures provide reusable setup/teardown
logic and are declared in the test function signature.

| Framework  | Term / API                                  |
| ---------- | ------------------------------------------- |
| **Praman** | `ui5`, `ui5Navigation`, `fe`, etc.          |
| **Tosca**  | Test Configuration Parameters               |
| **wdi5**   | Not available (uses `before`/`after` hooks) |

## H

### Hook

A function that runs before or after tests/suites. Used for setup (auth, navigation) and
teardown (data cleanup).

| Framework  | Term / API                                                                     |
| ---------- | ------------------------------------------------------------------------------ |
| **Praman** | `test.beforeAll()`, `test.beforeEach()`, `test.afterAll()`, `test.afterEach()` |
| **Tosca**  | SetUp / TearDown test steps                                                    |
| **wdi5**   | `before()`, `beforeEach()`, `after()`, `afterEach()`                           |

## I

### Intent

A semantic navigation target in SAP Fiori Launchpad, composed of a semantic object and action
(e.g., `#PurchaseOrder-create`). In Praman's AI layer, intents also describe what the user
wants to accomplish.

| Framework  | Term / API                                              |
| ---------- | ------------------------------------------------------- |
| **Praman** | `ui5Navigation.navigateToIntent()`, `@intent` TSDoc tag |
| **Tosca**  | Navigation module                                       |
| **wdi5**   | `wdi5.goTo()` (URL-based)                               |

## L

### Locator

A Playwright object that represents a way to find element(s) on the page. Locators are lazy
and auto-waiting. Praman converts UI5 selectors to locators internally.

| Framework  | Term / API                                 |
| ---------- | ------------------------------------------ |
| **Praman** | `page.locator('#controlId')`, internal use |
| **Tosca**  | Scan result reference                      |
| **wdi5**   | WebDriverIO element                        |

## M

### mergeTests()

A Playwright utility that combines multiple test fixture sets into one. Used to compose
Praman fixtures with custom project fixtures.

| Framework  | Term / API                           |
| ---------- | ------------------------------------ |
| **Praman** | `mergeTests(pramanTest, customTest)` |
| **Tosca**  | Module composition                   |
| **wdi5**   | Not available                        |

## P

### Page Object

A design pattern that encapsulates page-specific selectors and interactions behind a clean API.
Praman's fixtures serve a similar role without requiring explicit page object classes.

| Framework  | Term / API                                            |
| ---------- | ----------------------------------------------------- |
| **Praman** | Fixtures (implicit page objects), or explicit classes |
| **Tosca**  | Module                                                |
| **wdi5**   | Page object classes                                   |

### Proxy

A typed wrapper around a remote UI5 control. The proxy provides a type-safe API for reading
properties and invoking methods, while internally communicating via the bridge.

| Framework  | Term / API                 |
| ---------- | -------------------------- |
| **Praman** | `ControlProxy`, `#proxy/*` |
| **Tosca**  | Control wrapper            |
| **wdi5**   | `WDI5Control`              |

## R

### Recipe

A pre-built sequence of Praman operations for common SAP tasks. Recipes combine navigation,
interaction, and verification into a single reusable function.

| Framework  | Term / API                           |
| ---------- | ------------------------------------ |
| **Praman** | `@recipe` TSDoc tag, recipe registry |
| **Tosca**  | Reusable test step block             |
| **wdi5**   | Not available                        |

### Reporter

A Playwright plugin that processes test results and generates reports. Praman ships
`ComplianceReporter` and `ODataTraceReporter`.

| Framework  | Term / API                                 |
| ---------- | ------------------------------------------ |
| **Praman** | `ComplianceReporter`, `ODataTraceReporter` |
| **Tosca**  | Execution log                              |
| **wdi5**   | Allure / spec reporter                     |

## S

### Selector

An object describing how to find a UI5 control. Unlike CSS selectors, Praman selectors query
the UI5 control tree using control type, properties, binding paths, and ancestry.

| Framework  | Term / API             |
| ---------- | ---------------------- |
| **Praman** | `UI5Selector` object   |
| **Tosca**  | TBox properties / Scan |
| **wdi5**   | `wdi5Selector` object  |

### storageState

A Playwright mechanism for persisting browser session data (cookies, localStorage) to a JSON
file. Used for sharing authentication across tests.

| Framework  | Term / API                       |
| ---------- | -------------------------------- |
| **Praman** | `context.storageState({ path })` |
| **Tosca**  | Session management               |
| **wdi5**   | Cookie injection                 |

## T

### test.step()

A Playwright method that groups related actions into a named step. Steps appear in traces
and reports, making failures easy to locate.

| Framework  | Term / API                                            |
| ---------- | ----------------------------------------------------- |
| **Praman** | `await test.step('description', async () => { ... })` |
| **Tosca**  | Test step                                             |
| **wdi5**   | `it()` / custom logging                               |

### Trace

A Playwright recording that captures screenshots, network activity, console logs, and action
timelines for post-mortem debugging.

| Framework  | Term / API                          |
| ---------- | ----------------------------------- |
| **Praman** | `trace: 'on-first-retry'` in config |
| **Tosca**  | Execution log with screenshots      |
| **wdi5**   | Not built-in (manual screenshots)   |

## W

### Worker

A Playwright process that runs tests in parallel. Each worker gets its own browser instance
and isolated state. SAP tests typically use `workers: 1` for stateful processes.

| Framework  | Term / API                          |
| ---------- | ----------------------------------- |
| **Praman** | `workers` in `playwright.config.ts` |
| **Tosca**  | Distributed execution agent         |
| **wdi5**   | WebDriverIO `maxInstances`          |

## Quick Reference Table

| Term         | Praman                             | Tosca              | wdi5                    |
| ------------ | ---------------------------------- | ------------------ | ----------------------- |
| Find control | `ui5.control()`                    | TBox Scan          | `browser.asControl()`   |
| Click        | `ui5.click()`                      | Click module       | `element.click()`       |
| Fill input   | `ui5.fill()`                       | Set module         | `element.setValue()`    |
| Navigate     | `ui5Navigation.navigateToIntent()` | Navigation module  | `wdi5.goTo()`           |
| Wait for UI5 | Automatic                          | Implicit sync      | `wdi5.waitForUI5()`     |
| Verify text  | `expect(ctrl).toHaveUI5Text()`     | Verify module      | `expect().toHaveText()` |
| Auth setup   | Setup project + `storageState`     | Session management | Cookie injection        |
| Run tests    | `npx playwright test`              | Tosca Commander    | `npx wdio run`          |
| Debug        | `PWDEBUG=1`, trace viewer          | Tosca debug mode   | `--inspect` flag        |
| Report       | HTML + ComplianceReporter          | Execution log      | Allure / spec           |
