---
title: Interactive Inspector
description: 'Use npx praman inspect to discover UI5 controls, properties, bindings, and selectors interactively in a live SAP application.'
keywords:
  - praman inspect
  - ui5 control inspector
  - sap ui5 devtools
  - playwright sap selector discovery
  - praman cli
---

# Interactive Inspector

The `inspect` command opens a live SAP application in a headed browser and lets you click any element to see its UI5 control metadata, bindings, and the best `ui5=...` selector — ready to paste into your test.

## Quick Start

```bash
npx praman inspect https://my-sap-system.example.com/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html
```

This launches a Chromium window, waits for UI5 to load, injects the Praman bridge, and activates the click-capture overlay. You now click elements in the browser and see their metadata in your terminal.

## Authentication

The inspector supports the same auth strategies as your tests. There are three ways to authenticate:

### Reuse existing storageState

If you have already run your Playwright auth setup project and have a `storageState` file:

```bash
npx praman inspect https://my-sap-system.example.com --auth .auth/user.json
```

### Use environment variables

Set the standard SAP credentials and the inspector will run your configured auth strategy automatically:

```bash
SAP_BASE_URL=https://host SAP_CLOUD_USERNAME=user SAP_CLOUD_PASSWORD=pw npx praman inspect
```

### Use praman.config.ts

If your project has a config file with `baseUrl` and `auth` settings, the inspector uses them and the URL argument becomes optional:

```bash
# Reads baseUrl + auth from praman.config.ts
npx praman inspect
```

## Clicking Elements

When you click an element in the browser, the inspector captures the click (preventing the actual button/link action), resolves the DOM element to its UI5 control, and prints a full report in the terminal:

```
━━━ Clicked: sap.m.Button ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ID:          __button0--orderCreateBtn
  Type:        sap.m.Button
  Visible:     true
  Enabled:     true

  Properties:
    text       = "Create Order"
    type       = "Emphasized"
    icon       = "sap-icon://add"
    enabled    = true

  Bindings:
    text       → {i18n>CREATE_ORDER}

  Control Tree Path:
    Shell → App → NavContainer → Page → Footer → Toolbar → Button

━━━ Selectors (best → worst) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ① ui5=sap.m.Button[text=Create Order]
  ② ui5=sap.m.Button#__button0--orderCreateBtn
  ③ ui5=sap.m.Button[icon=sap-icon://add][type=Emphasized]

  Fixture code:
    await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create Order' } });

  Locator code:
    page.locator("ui5=sap.m.Button[text='Create Order']")
```

The browser also highlights the inspected control with a colored border so you can confirm you clicked the right element.

## Selector Ranking

The inspector generates multiple selector candidates for each control and ranks them by stability:

| Rank | Strategy            | Example                                              | When used                                |
| ---- | ------------------- | ---------------------------------------------------- | ---------------------------------------- |
| 1    | Unique property     | `sap.m.Button[text=Save]`                            | The property value is unique on the page |
| 2    | Stable ID           | `sap.m.Button#orderCreateBtn`                        | ID does not contain `__` (generated)     |
| 3    | Multiple properties | `sap.m.Button[icon=sap-icon://add][type=Emphasized]` | Single property is not unique            |
| 4    | Ancestor scoping    | `sap.m.Button[text=Save]{ancestor: sap.m.Dialog}`    | Control is inside a dialog or popover    |
| 5    | Binding path        | `sap.m.Input{bindingPath: {value: '/PO/Vendor'}}`    | For data-bound input fields              |

Each candidate is evaluated against the live page to verify it matches exactly one element. Only verified-unique selectors are shown.

## Keyboard Shortcuts

While the inspector is running, use these keys in the terminal:

| Key | Action                                                                   |
| --- | ------------------------------------------------------------------------ |
| `t` | Show the full UI5 control tree                                           |
| `s` | Show all selector candidates for the last clicked control                |
| `c` | Copy the best selector to your system clipboard                          |
| `f` | Copy fixture code to clipboard: `await ui5.control({ ... })`             |
| `l` | Copy locator code to clipboard: `page.locator('ui5=...')`                |
| `p` | Toggle property display (compact shows 5 key properties, full shows all) |
| `b` | Show OData binding paths for the last clicked control                    |
| `r` | Re-inject bridge (after page navigation or reload)                       |
| `h` | Show help                                                                |
| `q` | Quit the inspector                                                       |

## Control Tree View

Press `t` to see the full UI5 control tree for the current page. The tree shows every registered control with its type, key properties, and a suggested selector:

```
━━━ Control Tree (847 controls) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Shell (sap.ushell.ui.Shell)
  └─ App (sap.ushell.ui.AppContainer)
     └─ Component (sap.ui.core.ComponentContainer)
        └─ NavContainer (sap.m.NavContainer)
           ├─ ListReportPage (sap.uxap.ObjectPageLayout)
           │  ├─ FilterBar (sap.ui.comp.filterbar.FilterBar)
           │  │  ├─ Input "Company Code" [1000]
           │  │  ├─ Input "Plant" []
           │  │  └─ Button "Go" [Emphasized]
           │  └─ Table (sap.ui.table.Table) — 248 rows
           └─ DetailPage (not navigated)
```

This is useful for understanding the page structure before writing tests. You can identify which controls exist, what their hierarchy looks like, and plan your selector strategy.

## Binding Path Inspector

Press `b` after clicking a control to see its OData and model bindings:

```
━━━ Bindings: sap.m.Input#companyCodeInput ━━━━━━━━━━━━━━━━━━

  Property Bindings:
    value       → {/PurchaseOrder/CompanyCode}    Model: default (OData V2)
    placeholder → {i18n>COMPANY_CODE_PLACEHOLDER}  Model: i18n (ResourceModel)

  Aggregation Bindings:
    suggestionItems → {/CompanyCodeSet}            Model: default (OData V2)
```

Binding paths are the most stable selectors for data-bound controls because they survive UI5 theme changes, language switches, and minor version upgrades.

## Command Options

```
Usage: praman inspect [url] [options]

Options:
  --auth <path>       Playwright storageState JSON file for authentication
  --browser <name>    Browser to use: chromium, firefox, webkit (default: chromium)
  --timeout <ms>      UI5 bootstrap timeout in milliseconds (default: 30000)
  --viewport <WxH>    Browser viewport size (default: 1920x1080)
  -h, --help          Display help
```

## Typical Workflow

A typical test authoring session with the inspector looks like this:

1. **Launch**: `npx praman inspect --auth .auth/user.json`
2. **Navigate**: Use the browser to navigate to the page you want to test (click tiles, follow links)
3. **Click**: Click the first element you want to interact with in your test
4. **Copy**: Press `f` to copy the fixture code to clipboard
5. **Paste**: Switch to your IDE, paste `await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create Order' } })` into your test
6. **Repeat**: Click the next element, press `f`, paste
7. **Tree**: Press `t` to see the full control tree if you need to understand the page structure
8. **Bindings**: Press `b` when writing assertions about input field values — binding paths tell you what OData property the field is bound to
9. **Quit**: Press `q` when done

This replaces the trial-and-error cycle of guessing selectors, running tests, reading error messages, and adjusting. One inspect session typically produces all the selectors needed for a test file.

## Comparison with UI5 Diagnostics

SAP UI5 includes a built-in diagnostics tool (press `Ctrl+Alt+Shift+S` in any UI5 app). Here is how the Praman inspector differs:

| Aspect          | UI5 Diagnostics                                | Praman Inspector                                              |
| --------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| Output          | Raw UI5 metadata (control tree, properties)    | Praman selectors ready to paste into tests                    |
| Selector format | Control IDs (often generated, not test-stable) | `ui5=...` selectors ranked by stability                       |
| Clipboard       | Manual copy of individual values               | Press `c`/`f`/`l` for selector, fixture code, or locator code |
| Bindings        | Shown in control detail panel                  | Shown with model name and OData entity context                |
| Auth            | Must log in manually in the browser            | Reuses Playwright storageState or env var auth                |
| Availability    | Always available (built into UI5 framework)    | Requires Praman installed (`npx praman inspect`)              |

:::tip
The UI5 Diagnostics tool and Praman inspector complement each other. Use UI5 Diagnostics for deep framework debugging (XML views, routing, OData model state). Use Praman inspector for test authoring (finding the right selectors quickly).
:::

## How It Works

The inspector builds on APIs that already exist in Praman:

1. **Bridge injection** (`src/bridge/injection.ts`): The same `injectBridge()` function used by the test fixtures injects `window.__praman_bridge` into the page.

2. **Control inspection** (`src/bridge/browser-scripts/inspect-control.ts`): The `createInspectControlScript()` function retrieves full metadata (properties, aggregations, bindings) for any control by ID.

3. **Control tree** (`src/bridge/browser-scripts/control-tree.ts`): The `createControlTreeScript()` function serializes the entire UI5 control registry into a hierarchical tree.

4. **Selector parsing** (`src/selectors/selector-parser.ts`): The `serializeUI5Selector()` function formats selectors into the `ui5=...` string syntax.

The inspector adds a click-capture overlay and a terminal UI on top of these existing capabilities. No new browser-side introspection code is needed — it reuses what the test runtime already provides.
