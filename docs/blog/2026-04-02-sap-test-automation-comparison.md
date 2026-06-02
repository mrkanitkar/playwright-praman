---
title: 'Agentic and Open Source Solutions for SAP Testing: Which One Should You Pick?'
description: 'Side-by-side comparison of playwright-ui5, playwright-sap, wdi5, and playwright-praman across 10 categories — selectors, authentication, OData, Fiori Elements, AI agents, CLI tooling, and operational readiness for SAP S/4HANA and Fiori test automation.'
authors: [maheshwar]
tags: [comparison, praman, playwright, sap-ui5, ai, wdi5, open-source, cli]
date: 2026-04-02
keywords:
  - SAP test automation comparison
  - playwright-praman vs wdi5
  - playwright-sap vs wdi5
  - playwright-ui5 vs wdi5
  - SAP UI5 testing tools
  - SAP Fiori test automation
  - SAP S/4HANA testing
  - open source SAP testing
  - wdi5 alternative
  - playwright SAP plugin
  - SAP E2E testing tools
  - SAP test automation open source
  - agentic SAP testing
  - AI test generation SAP
  - playwright-praman
  - playwright-sap
  - playwright-ui5
  - wdi5
  - SAP OData testing
  - Fiori Elements testing
  - SAP authentication testing
  - Fiori Launchpad testing
  - SAP BTP testing
  - Tricentis alternative SAP
  - Tosca alternative SAP
  - SAP RISE testing
  - playwright CLI SAP
  - SAP test automation tools 2026
  - best SAP testing framework
  - SAP UI5 Playwright plugin comparison
image: /img/praman-social-card.png
---

# Agentic and Open Source Solutions for SAP Testing: Which One Should You Pick?

Testing SAP S/4HANA and Fiori apps at enterprise scale requires more than a browser automation library. You need UI5-aware selectors, authentication handling, OData support, and — increasingly — agentic AI workflows that can plan, generate, and self-heal tests. Four open source solutions tackle this problem from different angles.

This post compares **playwright-ui5**, **playwright-sap**, **wdi5**, and **playwright-praman** side by side. No marketing. Just what each tool actually does, where it falls short, and which one fits your situation.

> **Legend:** ✓ = Full support | ✓+ = Enhanced/extra features | ⚠ = Partial/limited | ✗ = Not supported

<!-- truncate -->

---

## The Four Solutions

| Solution          | npm                                                                                    | GitHub / Website                                                          |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| playwright-ui5    | [npmjs.com/package/playwright-ui5](https://www.npmjs.com/package/playwright-ui5)       | [detachhead/playwright-ui5](https://github.com/detachhead/playwright-ui5) |
| playwright-sap    | [npmjs.com/package/playwright-sap](https://www.npmjs.com/package/playwright-sap)       | [playwright-sap.dev](https://playwright-sap.dev)                          |
| wdi5              | [npmjs.com/package/wdi5](https://www.npmjs.com/package/wdi5)                           | [ui5-community.github.io/wdi5](https://ui5-community.github.io/wdi5/#/)   |
| playwright-praman | [npmjs.com/package/playwright-praman](https://www.npmjs.com/package/playwright-praman) | [praman.dev](https://praman.dev)                                          |

**[playwright-ui5](https://github.com/detachhead/playwright-ui5)** is a lightweight Playwright selector engine. You register it with Playwright, and it lets you find UI5 controls using CSS or XPath 3.1 syntax (`ui5=sap.m.Button[text='Save']`). It focuses on one thing — selectors — with no fixtures, OData helpers, or stability handling.

**[playwright-sap](https://playwright-sap.dev)** extends Playwright via npm package aliasing (3 packages based on the Playwright monorepo) and adds SAP-aware locators (`getByRoleUI5`, `locateUI5`), WebGUI locators (`locateSID`, `getByRoleSID`), a `SAPLogin` helper, and auto-wait synchronized with UI5/WebGUI rendering cycles. It includes strict TypeScript, multi-language support (JS, Python, .NET, Java), and CLI scaffolding via `npm init`.

**[wdi5](https://ui5-community.github.io/wdi5/#/)** is the most established SAP-specific testing tool in this group. It's a WebdriverIO service (not Playwright) that injects client-side scripts to access UI5 controls via 14 OPA5-compatible selector types. It supports Fiori Launchpad, Build Workzone, Docker, 5 auth providers, FioriElementsFacade for OData V4 Fiori Elements apps, and has 14 example apps. The catch: it requires WebdriverIO, not Playwright.

**[playwright-praman](https://praman.dev)** is a Playwright plugin with typed fixtures, a bridge layer for UI5 control access, OData APIs, Fiori Elements page objects, BTP WorkZone support, and an agentic AI workflow (Plan → Generate → Heal) with 6 SAP agents in 2 variants (MCP browser, CLI token-efficient) plus 3 generic Playwright agents for non-SAP testing — letting teams go from a live SAP app to passing tests with minimal hand-coding. Its CLI provides an offline capability manifest, a spec compliance validator, and pre-built discovery scripts that work via Playwright CLI. It has the deepest SAP domain coverage of the four.

---

## Feature Comparison by Category

**Jump to a category:**

1. [Agentic / AI Features](#1-agentic--ai-features) — LLM integration, self-healing, agent workflows, Fiori Elements page objects
2. [CLI, Code Generation & Agent Tooling](#2-cli-code-generation--agent-tooling) — Code recorders, AI agent variants, coverage pipelines, debug CLI
3. [SAP UI5 Specific Features](#3-sap-ui5-specific-features) — Selector engines, property matching, auto-wait, bridge injection
4. [SAP Authentication](#4-sap-authentication) — Cloud OAuth, on-premise, mTLS, session persistence
5. [Fiori Launchpad (FLP)](#5-fiori-launchpad-flp) — Tile navigation, intent routing, WorkZone, lock management
6. [OData / Backend Testing](#6-odata--backend-testing) — Entity CRUD, CSRF tokens, model access, network mocking
7. [Error Handling & Developer Experience](#7-error-handling--developer-experience) — Structured errors, CLI scaffolding, fixtures, reporters
8. [Operational Readiness](#8-operational-readiness) — Platform support, migration paths, CI/CD, Docker, licensing
9. [General Test Automation](#9-general-test-automation) — TypeScript, parallel execution, multi-browser, trace viewer
10. [Project Health & Ecosystem](#10-project-health--ecosystem) — Architecture, documentation, upstream risk

### 1. Agentic / AI Features

| Feature                                            | playwright-ui5 | playwright-sap |                          wdi5                          |                           playwright-praman                           |
| -------------------------------------------------- | :------------: | :------------: | :----------------------------------------------------: | :-------------------------------------------------------------------: |
| AI capability registry                             |       ✗        |       ✗        |                           ✗                            |                ✓ 179 capabilities (generated registry)                |
| Recipe registry (test patterns)                    |       ✗        |       ✗        |                           ✗                            |                             ✓ 14 recipes                              |
| LLM integration (Claude, OpenAI)                   |       ✗        |       ✗        |                           ✗                            |                                   ✓                                   |
| AI error context (toAIContext())                   |       ✗        |       ✗        |                           ✗                            |                           ✓ On every error                            |
| Self-healing selector suggestions                  |       ✗        |       ✗        |                           ✗                            |                     ✓ suggestedSelector in errors                     |
| Agent workflows (Plan → Generate → Heal)           |       ✗        |       ✗        |                           ✗                            |           ✓ 6 SAP agents (2 variants × 3 roles) + 3 generic           |
| Fiori Elements library (ListReport, ObjectPage)    |       ✗        |       ✗        | ✓ FioriElementsFacade (OData V4 only, Given/When/Then) |                   ✓ 2 page objects (OData V2 + V4)                    |
| Table data extraction                              |       ✗        |       ✗        |                           ✗                            |                  ✓ getTableData(), exportTableData()                  |
| Date/time picker handling                          |       ✗        |       ✗        |                           ✗                            |                        ✓ 8 date/time functions                        |
| Dialog / popover management                        |       ✗        |       ✗        |                  ✓ searchOpenDialogs                   | ✓ waitForDialog(), getOpenDialogs(), confirmDialog(), dismissDialog() |
| Value help / search help                           |       ✗        |       ✗        |                           ✗                            |                         ✓ ValueHelp handling                          |
| Intent-level operations (procurement, sales, etc.) |       ✗        |       ✗        |                           ✗                            |                      ✓ ./intents sub-path export                      |
| Business vocabulary service                        |       ✗        |       ✗        |                           ✗                            |                    ✓ ./vocabulary sub-path export                     |

### 2. CLI, Code Generation & Agent Tooling

| Feature                                       |       playwright-ui5       |                playwright-sap                | wdi5 |                                  playwright-praman                                  |
| --------------------------------------------- | :------------------------: | :------------------------------------------: | :--: | :---------------------------------------------------------------------------------: |
| SAP-aware code recorder (codegen)             |             ✗              | ✓ Enhanced codegen (generates SAP selectors) |  ✗   |                                          ✗                                          |
| Login flow recorder                           |             ✗              |              ✓ sapLoginCodegen               |  ✗   |                                          ✗                                          |
| SAP page inspector                            | ✓ Via Playwright inspector |            ✓ SAP-aware inspector             |  ✗   |                             ✓ Via Playwright inspector                              |
| AI agents (MCP — browser tools)               |             ✗              |                      ✗                       |  ✗   |                            ✓ Planner, Generator, Healer                             |
| AI agents (CLI — token-efficient)             |             ✗              |                      ✗                       |  ✗   |                     ✓ CLI variants via playwright-cli commands                      |
| AI agents (vanilla Playwright)                |             ✗              |                      ✗                       |  ✗   |                           ✓ Non-SAP test planning agents                            |
| Full coverage pipeline orchestration          |             ✗              |                      ✗                       |  ✗   |                          ✓ Plan → Generate → Heal → Report                          |
| Orchestration prompts                         |             ✗              |                      ✗                       |  ✗   |                    ✓ 8+ prompts (MCP, CLI, coverage, migration)                     |
| Debug CLI (attach + step-through)             |             ✗              |                      ✗                       |  ✗   |                   ✓ persistent -s=heal session + run-code inspect                   |
| Capability manifest (offline agent discovery) |             ✗              |                      ✗                       |  ✗   |        ✓ `npx playwright-praman capabilities --agent` (13 CLI capabilities)         |
| Spec compliance validator                     |             ✗              |                      ✗                       |  ✗   |             ✓ `npx playwright-praman verify-spec` (6-check validation)              |
| Pre-built discovery scripts                   |             ✗              |                      ✗                       |  ✗   | ✓ 4 shell-safe scripts (discover-all, wait-for-ui5, bridge-status, dialog-controls) |
| Migration tooling                             |             ✗              |                      ✗                       |  ✗   |                        ✓ wdi5, Tosca, OPA5 migration prompts                        |

### 3. SAP UI5 Specific Features

| Feature                                 |                         playwright-ui5                         |            playwright-sap             |                    wdi5                     |                         playwright-praman                          |
| --------------------------------------- | :------------------------------------------------------------: | :-----------------------------------: | :-----------------------------------------: | :----------------------------------------------------------------: |
| UI5 selector engine                     |                       ✓ CSS + XPath 3.1                        | ✓ getByRoleUI5, locateUI5 (SAP-aware) |   ✓+ OPA5-compatible (14 selector types)    |                   ✓+ Typed selectors + operators                   |
| Control type selector                   |                               ✓                                |                   ✓                   |                      ✓                      |                                 ✓                                  |
| View name scoping                       |                               ✗                                |                   ✗                   |                      ✓                      |                                 ✓                                  |
| Property matching                       | ✓ CSS operators ([text='foo'], \*=, ~=) + XPath ui5:property() |                   ✓                   |                      ✓                      | ✓+ Typed operators (equals, contains, startsWith, endsWith, regex) |
| Binding path selector                   |                               ✗                                |                   ✗                   |                      ✓                      |                                 ✓                                  |
| Ancestor / descendant selector          |                          ✓ Via XPath                           |   ✓ Via Playwright locator chaining   |                      ✓                      |                                 ✓                                  |
| RegExp ID matching                      |                               ✗                                |                   ✗                   |                      ✓                      |                                 ✓                                  |
| searchOpenDialogs                       |                               ✗                                |                   ✗                   |                      ✓                      |                                 ✓                                  |
| i18NText / labelFor / sibling selectors |                               ✗                                |                   ✗                   | ✓ i18NText, labelFor, sibling, interactable |                                 ✗                                  |
| Direct control method invocation        |                               ✗                                |                   ✗                   |       ✓ press(), enterText(), exec()        |                ✓+ executeMethod() dynamic dispatch                 |
| Control property reading                |                               ✗                                |       ⚠ Via Playwright evaluate       |               ✓ getProperty()               |                          ✓ getProperty()                           |
| Aggregation access (rows, items)        |                               ✗                                |                   ✗                   |             ✓ getAggregation()              |            ✓ getAggregation(), getItems(), getItemAt()             |
| Control info / metadata                 |                               ✗                                |                   ✗                   |             ✓ getControlInfo()              |                    ✓ controlTreeCapture fixture                    |
| Auto-wait for UI5 stability             |                               ✗                                |    ✓ SAP rendering-aware auto-wait    |             ✓ waitForUI5Timeout             |            ✓+ waitForUI5Stable() + exponential backoff             |
| Bridge injection to browser             |                               ✗                                |                   ✗                   |         ✓ Client-side JS injection          |                     ✓ window.\_\_praman_bridge                     |
| UI5 version compatibility               |                               ✗                                |                   ✗                   |                      ✓                      |                    ✓ Runtime version detection                     |
| Control type constants / registry       |                               ✗                                |                   ✗                   |                      ✗                      |                   ✓ 201 typed control interfaces                   |
| Custom Playwright matchers              |                               ✗                                |                   ✗                   |                      ✗                      |                     ✓ 10 UI5-specific matchers                     |

### 4. SAP Authentication

| Feature                             | playwright-ui5 |       playwright-sap       |         wdi5         |       playwright-praman       |
| ----------------------------------- | :------------: | :------------------------: | :------------------: | :---------------------------: |
| Cloud OAuth / SAML                  |       ✗        |             ✗              | ✓ SAP Cloud IdP, IAS |     ✓ Cloud SAML strategy     |
| On-premise basic auth               |       ✗        | ✓ SAPLogin(user, password) |          ✓           |               ✓               |
| Office 365 / Azure AD               |       ✗        |             ✗              |          ✓           |               ✓               |
| Client certificate (mTLS)           |       ✗        |             ✗              |          ✗           |               ✓               |
| Multi-tenant switching              |       ✗        |             ✗              |          ✗           |               ✓               |
| API / OAuth token auth              |       ✗        |             ✗              |          ✗           |               ✓               |
| Session persistence (storage state) |       ✗        |     ✓ Auth state reuse     |          ✓           |               ✓               |
| Custom IdP support                  |       ✗        |             ✗              |  ✓ Custom selectors  | ✓ Extensible strategy factory |
| Multi-factor authentication         |       ✗        |             ✗              |          ✗           |               ✗               |

### 5. Fiori Launchpad (FLP)

| Feature                        | playwright-ui5 |     playwright-sap     |          wdi5           |                playwright-praman                |
| ------------------------------ | :------------: | :--------------------: | :---------------------: | :---------------------------------------------: |
| Tile navigation                |       ✗        | ✓ getByRoleUI5('Tile') |            ✓            |               ✓ navigateToTile()                |
| Intent-based navigation        |       ✗        |           ✗            |      ⚠ Hash-based       |      ✓ navigateToIntent() semantic object       |
| App search and open            |       ✗        |           ✗            |            ✗            |              ✓ searchAndOpenApp()               |
| Shell bar interaction          |       ✗        |           ✗            |            ⚠            |              ✓ shellFooter fixture              |
| User menu access               |       ✗        |           ✗            |            ⚠            |                        ✓                        |
| SAP Build Workzone integration |       ✗        |           ✗            | ✓ btpWorkZoneEnablement | ✓ btpWorkZone fixture (dual-frame, iframe mgmt) |
| FLP lock management (SM12)     |       ✗        |           ✗            |            ✗            |      ✓ flpLocks fixture with auto-cleanup       |
| Hash navigation                |       ✗        |           ✗            |      ✓ wdi5.goTo()      |               ✓ navigateToHash()                |

### 6. OData / Backend Testing

| Feature                             |      playwright-ui5      |      playwright-sap      |       wdi5        |                         playwright-praman                         |
| ----------------------------------- | :----------------------: | :----------------------: | :---------------: | :---------------------------------------------------------------: |
| OData model access (binding path)   |            ✗             |            ✗             | ⚠ Via asControl() |               ✓ getModelData(), getModelProperty()                |
| OData entity CRUD (HTTP)            |            ✗             |            ✗             |         ✗         | ✓ queryEntities(), createEntity(), updateEntity(), deleteEntity() |
| $filter / $select / $expand queries |            ✗             |            ✗             |         ✗         |                  ✓ Mapped to OData query options                  |
| CSRF token handling                 |            ✗             |            ✗             |         ✗         |                        ✓ fetchCSRFToken()                         |
| OData batch requests                |            ✗             |            ✗             |         ✗         |                                 ✗                                 |
| Function import / action calls      |            ✗             |            ✗             |         ✗         |                      ✓ callFunctionImport()                       |
| Wait for OData load                 |            ✗             |            ✗             |         ✗         |                       ✓ waitForODataLoad()                        |
| Pending changes detection           |            ✗             |            ✗             |         ✗         |                       ✓ hasPendingChanges()                       |
| Network-level OData mocking         | ✓ Via Playwright route() | ✓ Via Playwright route() | ✓ browser.mock()  |                     ✓ Via Playwright route()                      |
| MockServer integration              |            ✗             |            ✗             | ⚠ Via fe-testlib  |                                 ✗                                 |

### 7. Error Handling & Developer Experience

| Feature                           |    playwright-ui5     |        playwright-sap         |           wdi5           |                   playwright-praman                   |
| --------------------------------- | :-------------------: | :---------------------------: | :----------------------: | :---------------------------------------------------: |
| Structured error classes          | ✗ Playwright defaults |     ✗ Playwright defaults     |  ✗ WebdriverIO defaults  |               ✓ 13 typed error classes                |
| Error suggestions[] for debugging |           ✗           |               ✗               |            ✗             |                   ✓ On every error                    |
| Retryable flag on errors          |           ✗           |               ✗               |            ✗             |                           ✓                           |
| Error code system                 |           ✗           |               ✗               |            ✗             |           ✓ ERR*CONTROL*_, ERR*AUTH*_, etc.           |
| Setup wizard / CLI scaffolding    |           ✗           |   ✓ npm init playwright-sap   |            ✗             |             ✓ npx playwright-praman init              |
| TSDoc / JSDoc documentation       |   ✗ Minimal README    |       ⚠ Docusaurus site       |         ⚠ JSDoc          |          ✓+ TSDoc enforced with custom tags           |
| Fixture pattern (test.extend)     |           ✗           |               ✗               | ✗ (WebdriverIO services) |                  ✓ 6+ fixture types                   |
| Example test suites               |           ✗           | ⚠ Generic Playwright examples |    ✓ 14 example apps     |               ✓ 9 SAP-specific examples               |
| Custom reporters                  |           ✗           |               ✗               |            ✗             | ✓ 3 reporters (Compliance, OData Trace, Control Tree) |

### 8. Operational Readiness

These are the criteria that SAP community discussions, enterprise evaluations, and Tricentis/UFT comparison matrices consistently highlight — and that purely technical comparisons often miss.

| Criterion                                       |                playwright-ui5                |               playwright-sap               |                       wdi5                       |                                  playwright-praman                                   |
| ----------------------------------------------- | :------------------------------------------: | :----------------------------------------: | :----------------------------------------------: | :----------------------------------------------------------------------------------: |
| SAP official recommendation                     |                      ✗                       |                     ✗                      |        ✓ Listed in SAPUI5 testing pyramid        |                                          ✗                                           |
| Mobile / hybrid app testing (Cordova, Electron) | ✓ Electron + device emulation via Playwright | ✓ Electron + emulation via Playwright fork | ⚠ Via WebdriverIO + Appium (not wdi5-documented) |                     ✓ Electron + device emulation via Playwright                     |
| SAP UI5 (classic sap.m / sap.f)                 |            ✓ Selector engine only            |       ✓ SAP-aware locators + WebGUI        |          ✓ Full OPA5-style interaction           |                       ✓+ Typed proxy + 201 control interfaces                        |
| SAP UI5 Web Components (Shadow DOM)             |       ✓ Playwright pierces Shadow DOM        |                 ✓ Via fork                 |                        ✗                         |                    ✓ Playwright Shadow DOM + WC testing patterns                     |
| Standard HTML (non-UI5 pages)                   |               ✓ Via Playwright               |                 ✓ Via fork                 |                ✓ Via WebdriverIO                 |                        ✓ Auto-fallback to Playwright locators                        |
| SAP WebGUI (HTML GUI)                           |                      ✗                       |         ✓ locateSID, getByRoleSID          |                        ✗                         |                                          ✗                                           |
| SAP GUI (WinGUI) support                        |                      ✗                       |                     ✗                      |                        ✗                         |                                          ✗                                           |
| Execution speed                                 |           Fast (Playwright engine)           |           Fast (Playwright fork)           |          Moderate (WebDriver protocol)           |                               Fast (Playwright engine)                               |
| Locator stability across UI5 updates            |              ⚠ XPath can break               |      ✓ SAP-aware role-based locators       |           ✓ OPA5-style, binding-aware            |                          ✓+ Typed selectors, binding-aware                           |
| Test maintenance burden                         |            High (no SAP helpers)             | Medium (SAPLogin, auto-wait, SAP locators) |           Medium (OPA5 selectors help)           |                       Low (typed fixtures + error suggestions)                       |
| Learning curve                                  |               Low (thin layer)               |            Medium (fork quirks)            |         Medium (WebdriverIO + wdi5 APIs)         |                 Low (AI planner agents generate tests from live app)                 |
| Codeless / low-code option                      |                      ✗                       |                     ✗                      |                        ✗                         |                   ✓ AI agents plan + generate tests from live app                    |
| Migration path from OPA5                        |                Manual rewrite                |               Manual rewrite               |           ✓ OPA5-compatible selectors            | ✓ OPA5 Given/When/Then via FE lib + OPA5 interaction strategy + wdi5 migration guide |
| Migration path from Tricentis/Tosca             |                 Full rewrite                 |                Full rewrite                |                   Full rewrite                   |                     ✓ Tosca migration guide with concept mapping                     |
| CI/CD depth (Jenkins, Azure DevOps, etc.)       |               ✓ Via Playwright               |              ⚠ Fork-dependent              |        ✓ 12 GH Actions + cloud providers         |                       ✓ 3-OS matrix + CodeQL + release-please                        |
| Docker containerization                         |               ✓ Via Playwright               |               ⚠ Fork images                |        ✓ Standalone images (Chrome only)         |                             ✓ Via Playwright base images                             |
| SAP Cloud ALM integration                       |                      ✗                       |                     ✗                      |                        ✗                         |                   ✓ Integration guide + Cloud ALM CSV test design                    |
| Cost / licensing                                |                  Free (ISC)                  |             Free (Apache-2.0)              |                Free (Apache-2.0)                 |                                  Free (Apache-2.0)                                   |
| BDD / Cucumber support                          |                      ✗                       |                     ✗                      |                ✓ Cucumber example                |                      ✓ OPA5 Given/When/Then via FE test library                      |

### 9. General Test Automation

| Feature                              |      playwright-ui5       |       playwright-sap       |       wdi5        |             playwright-praman             |
| ------------------------------------ | :-----------------------: | :------------------------: | :---------------: | :---------------------------------------: |
| Modern async/await syntax            |             ✓             |             ✓              |         ✓         |                     ✓                     |
| TypeScript support                   |  ✓ Written in TypeScript  |          ✓ Strict          |     ✓ Strict      | ✓+ TS 6.x, max strict (11 ESLint plugins) |
| Parallel execution                   |     ✓ Via Playwright      |         ✓ Via fork         |  ✓ maxInstances   |             ✓ Via Playwright              |
| Auto-wait for elements               | ⚠ Playwright default only |   ✓ SAP rendering-aware    |    ✓ UI5-aware    |  ✓+ UI5-aware + linter ban on hard waits  |
| Network interception                 |     ✓ Via Playwright      |         ✓ Via fork         | ✓ browser.mock()  |             ✓ Via Playwright              |
| Multi-browser (Chromium, FF, WebKit) |     ✓ Via Playwright      |      ⚠ Fork-dependent      | ✓ Via WebdriverIO |             ✓ Via Playwright              |
| Visual regression / screenshots      |     ✓ Via Playwright      |         ✓ Via fork         | ⚠ Via WebdriverIO |             ✓ Via Playwright              |
| Trace viewer debugging               |     ✓ Via Playwright      |         ✓ Via fork         |         ✗         |             ✓ Via Playwright              |
| Cross-platform CI (Win/Mac/Linux)    |     ⚠ Not documented      | ✓ Win/Mac/Linux documented | ⚠ Linux + Docker  |               ✓ 3-OS matrix               |

### 10. Project Health & Ecosystem

| Metric         |      playwright-ui5      |           playwright-sap            |                   wdi5                   |           playwright-praman            |
| -------------- | :----------------------: | :---------------------------------: | :--------------------------------------: | :------------------------------------: |
| Test framework |        Playwright        |  Playwright (fork + npm aliasing)   |               WebdriverIO                |               Playwright               |
| Architecture   | Peer dependency (plugin) | Fork with npm aliasing (3 packages) |           WebdriverIO service            |        Peer dependency (plugin)        |
| Documentation  |          README          |           Docusaurus site           |         Comprehensive (33 docs)          | TSDoc + migration guides + skill files |
| License        |           ISC            |             Apache-2.0              |                Apache-2.0                |               Apache-2.0               |
| Upstream risk  |      Low (peer dep)      |       High (fork divergence)        | Medium (WebdriverIO v9 breaking changes) |             Low (peer dep)             |

---

## Honest Pros and Cons

### playwright-ui5

**Pros:** Lightweight, easy to add to existing Playwright projects, XPath 3.1 support via fontoxpath, CSS attribute operators for property matching. Written in TypeScript. Zero-config — just register the selector engine and go.

**Cons:** Focused solely on selectors — no UI5 stability handling, no SAP authentication, no FLP navigation, no OData, no Fiori Elements support. Teams must build all SAP domain logic themselves.

### playwright-sap

**Pros:** SAP-aware role-based locators (`getByRoleUI5`, `locateUI5`) that avoid brittle XPath. Built-in `SAPLogin` helper with session state reuse. Auto-wait synchronized with UI5/WebGUI rendering cycles. WebGUI support via `locateSID` and `getByRoleSID` — the only Playwright-based tool with SAP WebGUI locators. Multi-language (TS, JS, Python, .NET, Java). CLI scaffolding via `npm init`. Cross-platform (Win/Mac/Linux).

**Cons:** Fork-based architecture (3 packages aliased from the Playwright monorepo) means upstream Playwright updates must be tracked and merged independently. No binding path selectors, no OData APIs, no Fiori Elements page objects, no structured error classes. Single contributor.

### wdi5

**Pros:** Most mature SAP testing tool in this group. 14 selector types including i18NText, labelFor, and sibling — the richest OPA5-compatible selector set available. Supports Fiori Launchpad, Build Workzone, Docker (standalone images), 5 auth providers (SAP Cloud IdP, IAS, Office365, Basic, Custom IdP), and BDD via Cucumber. FioriElementsFacade supports ListReport, ObjectPage, Shell with Given/When/Then (OData V4 only). Listed in SAP's official SAPUI5 testing pyramid. 14 example apps including BTP Cloud ALM and Build Workzone examples.

**Cons:** Requires WebdriverIO, not Playwright — teams committed to Playwright would need to switch frameworks. FE test library limited to OData V4 — no V2 support. Docker images include Chrome only. Mobile/hybrid testing not documented in wdi5 itself (would require WebdriverIO + Appium separately). No Web Components support. MFA not supported.

### playwright-praman

**Pros:** Deepest SAP domain coverage of any Playwright plugin: dedicated OData model and HTTP APIs, Fiori Elements page objects, 6 auth strategies (including mTLS and multi-tenant), 8 FLP navigation functions, BTP WorkZone dual-frame support, 10 custom Playwright matchers, 201 typed control interfaces, 179 AI capabilities in a generated registry, 14 curated recipes, and 13 structured error classes with suggestions[] for debugging. Agentic AI workflow with 6 SAP-specific Claude Code agents — 3 roles (Planner, Generator, Healer) × 2 variants (MCP browser, CLI token-efficient) — plus 3 generic Playwright agents for non-SAP testing — that explore a live SAP app and generate compliant tests — making it the lowest learning curve for teams new to test automation. CLI tooling includes an offline capability manifest (`npx playwright-praman capabilities --agent`), a spec compliance validator (`npx playwright-praman verify-spec`), and 4 pre-built discovery scripts for shell-safe UI5 introspection via Playwright CLI. Cloud ALM integration guide, Tosca migration guide, and wdi5 migration guide included. Strict TypeScript with 11 ESLint plugins. 3-OS CI matrix.

**Cons:** Newer project (v1.x) with a growing community. Requires Node.js 22+. AI agent features depend on external LLM providers. No OData batch request support. No MockServer integration (uses Playwright's native route() instead).

---

## Which One Should You Pick?

**If you just need UI5 selectors in an existing Playwright project** and the app is simple — try **playwright-ui5**. It's thin and low-commitment. Just know you'll be building SAP domain logic yourself.

**If your team is already on WebdriverIO** and you're migrating from OPA5 — **wdi5** is the natural fit. The OPA5-compatible selector syntax saves significant migration effort, and it has the largest community and SAP's official recommendation.

**If you want Playwright with SAP-aware locators, WebGUI support, and auto-login** — **playwright-sap** provides that with multi-language support. Evaluate the fork maintenance model against your team's capacity.

**If you're on Playwright and testing real S/4HANA workflows** — Fiori Launchpad login, Fiori Elements apps, OData-driven data, BTP WorkZone — **playwright-praman** covers the most ground. Its agentic approach (AI agents that explore your live app and generate tests) means teams can get started without deep Playwright expertise.

Whatever you choose, start with a proof of concept on your actual application. A 2-week spike on a real Fiori Elements List Report will tell you more than any comparison blog.

---

## Acknowledgements

We want to express sincere appreciation to the development teams behind every solution covered in this comparison. Building and maintaining open source testing tools for the SAP ecosystem is challenging work — it requires deep knowledge of UI5 internals, SAP authentication protocols, OData specifications, and browser automation frameworks, all of which evolve continuously.

The **[playwright-ui5](https://github.com/detachhead/playwright-ui5)** team brought XPath 3.1 and CSS-based UI5 selectors to Playwright, giving the community a clean, lightweight entry point. The **[playwright-sap](https://playwright-sap.dev)** team tackled the hard problem of SAP-aware locators, WebGUI support, and multi-language bindings — a unique contribution no other Playwright-based tool provides. The **[wdi5](https://ui5-community.github.io/wdi5/#/)** team has built the most mature and well-documented SAP testing tool available, with OPA5 compatibility, extensive examples, and SAP's official recognition — their sustained effort over years has set the standard for what SAP test tooling should look like. And the **[playwright-praman](https://praman.dev)** team is working to push the boundaries with agentic AI workflows and deep SAP domain coverage on the Playwright platform.

Each of these projects makes the SAP testing ecosystem stronger. Competition and collaboration between open source tools ultimately benefits every SAP development team. We encourage you to try these solutions, contribute back, and support the maintainers who make this work possible.

---

## Disclaimer

This comparison is provided **for educational and informational purposes only**. All information is based on publicly available source code, documentation, and npm packages at the time of writing. Despite our best efforts to verify accuracy, this comparison may contain errors, omissions, or information that has become outdated as all projects and the broader SAP ecosystem continuously enhance their solutions.

Feature availability, API surfaces, and project roadmaps change frequently. We recommend verifying current capabilities directly from each project's official documentation and source code before making tooling decisions.

This post is not affiliated with or endorsed by SAP SE, Microsoft, or any of the individual project teams (unless explicitly stated). No representation is made regarding the fitness of any tool for a particular purpose.

For the full Praman disclaimer, see: [praman.dev/disclaimer](https://praman.dev/disclaimer)

---

_Last updated: April 2026. All claims verified against source code. Praman numbers: 179 capabilities, 14 recipes, 13 error classes, 201 control types, 10 matchers, 6 auth strategies, 8 navigation functions, 3 reporters, 13 CLI capabilities._
