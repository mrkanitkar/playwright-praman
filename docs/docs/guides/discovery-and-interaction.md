---
sidebar_position: 13
title: Discovery and Interaction Strategies
---

# Discovery and Interaction Strategies

Praman uses two configurable strategy systems to find and interact with UI5 controls.
**Discovery strategies** determine _how controls are located_ in the browser.
**Interaction strategies** determine _how actions are performed_ on those controls.
Both are independently configurable via environment variables.

## Part 1: Control Discovery Strategies

Discovery is the process of finding a UI5 control on the page given a `UI5Selector`. Praman runs
a **priority chain** — it tries each configured strategy in order and stops at the first match.

### The Discovery Flow

```
                        ┌──────────────────────┐
                        │  ui5.control(selector)│
                        └──────────┬───────────┘
                                   │
                                   v
                        ┌──────────────────────┐
                        │  Tier 0: CACHE       │  In-memory proxy cache
                        │  (always first)      │  Zero cost on repeat lookups
                        └──────────┬───────────┘
                                   │ miss
                                   v
                        ┌──────────────────────┐
                        │  ensureBridgeInjected │  Inject Praman bridge into
                        │  (idempotent)        │  the browser if not present
                        └──────────┬───────────┘
                                   │
                                   v
                ┌──────────────────────────────────────┐
                │  getDiscoveryPriorities(selector,    │
                │    configuredStrategies)              │
                │                                      │
                │  If ID-only selector AND direct-id   │
                │  is configured: promote direct-id    │
                │  to first position after cache       │
                └──────────────────┬───────────────────┘
                                   │
                                   v
              ┌────────────────────────────────────────────┐
              │  For each strategy in priority order:      │
              │                                            │
              │  ┌─ direct-id ──────────────────────────┐  │
              │  │ Strips selector to { id } only       │  │
              │  │ Calls bridge.getById(id)             │  │
              │  │ Fastest: single lookup, no scanning  │  │
              │  └──────────────────────────────────────┘  │
              │          │ null                             │
              │          v                                 │
              │  ┌─ recordreplay ───────────────────────┐  │
              │  │ Passes full selector                 │  │
              │  │ Tries Tier 1 (getById) first         │  │
              │  │ Then Tier 2 (registry scan)          │  │
              │  │ Then Tier 3 (RecordReplay API)       │  │
              │  └──────────────────────────────────────┘  │
              │          │ null                             │
              │          v                                 │
              │  ┌─ registry ───────────────────────────┐  │
              │  │ Forces full registry scan (Tier 2)   │  │
              │  │ Skips Tier 1 entirely                 │  │
              │  │ Matches by type, properties, bindings│  │
              │  └──────────────────────────────────────┘  │
              │          │ null                             │
              │          v                                 │
              │   throw ControlError                       │
              │   ERR_CONTROL_NOT_FOUND                    │
              └────────────────────────────────────────────┘
```

_Source: [discovery.ts](https://github.com/nicheui/praman/blob/main/src/proxy/discovery.ts) lines 145–201,
[discovery-factory.ts](https://github.com/nicheui/praman/blob/main/src/proxy/discovery-factory.ts) lines 74–101_

### Strategy Details

#### `direct-id` — Direct ID Lookup (Tier 1)

The fastest discovery path. Strips the selector to `{ id }` only and calls the bridge's
`getById()` accessor, which resolves the control in a single call.

**SAP UI5 APIs used:**

| API                               | What It Does                                            | Reference                                                                                             |
| --------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `sap.ui.core.Element.registry`    | Access the global element registry (UI5 >= 1.84)        | [API Reference](https://ui5.sap.com/#/api/sap.ui.core.Element%23methods/sap.ui.core.Element.registry) |
| `sap.ui.core.ElementRegistry`     | Legacy registry accessor (UI5 < 1.84)                   | [API Reference](https://ui5.sap.com/#/api/sap.ui.core.ElementRegistry)                                |
| `control.getId()`                 | Returns the control's stable ID                         | [API Reference](https://ui5.sap.com/#/api/sap.ui.core.Element%23methods/getId)                        |
| `control.getMetadata().getName()` | Returns the fully qualified type (e.g., `sap.m.Button`) | [API Reference](https://ui5.sap.com/#/api/sap.ui.base.ManagedObject%23methods/getMetadata)            |

**When it works:** The selector has an `id` field and that ID exists in the UI5 registry.

**When it skips:** The selector has no `id` field, or the ID is not found.

**Behavior in code** — `tryStrategy('direct-id', ...)` at
[discovery.ts:79–89](https://github.com/nicheui/praman/blob/main/src/proxy/discovery.ts#L79-L89):

```typescript
// Passes id-only selector for fastest getById() path
const result = await page.evaluate(browserFindControl, {
  selector: { id: selector.id },
  bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
  preferVisibleControls,
});
```

#### `recordreplay` — SAP RecordReplay API (Tier 3)

Uses SAP's `RecordReplay.findDOMElementByControlSelector()` to resolve the full selector
(including `controlType`, `properties`, `bindingPath`, `ancestor`, etc.) to a DOM element,
then bridges the DOM element back to a UI5 control via `Element.closestTo()`.

**SAP UI5 APIs used:**

| API                                              | What It Does                                                     | Reference                                                                                                                              |
| ------------------------------------------------ | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `RecordReplay.findDOMElementByControlSelector()` | Resolves a UI5 selector to a DOM element                         | [API Reference](https://ui5.sap.com/#/api/sap.ui.test.RecordReplay%23methods/sap.ui.test.RecordReplay.findDOMElementByControlSelector) |
| `sap.ui.core.Element.closestTo(domElement)`      | Finds the UI5 control that owns a DOM element (UI5 >= 1.106)     | [API Reference](https://ui5.sap.com/#/api/sap.ui.core.Element%23methods/sap.ui.core.Element.closestTo)                                 |
| `jQuery(domElement).control(0)`                  | Legacy fallback: jQuery UI5 plugin for DOM-to-control resolution | —                                                                                                                                      |

**When it works:** UI5 >= 1.94 with the `sap.ui.test.RecordReplay` module loaded.

**When it skips:** RecordReplay is not available (older UI5 versions or module not loaded).

**Internal sub-chain:** When `recordreplay` is configured, the browser script actually tries
Tier 1 (getById) first, then Tier 2 (registry scan), then Tier 3 (RecordReplay API) — this is
an internal optimization, not visible to the user.

**Behavior in code** — `tryStrategy('recordreplay', ...)` at
[discovery.ts:92–101](https://github.com/nicheui/praman/blob/main/src/proxy/discovery.ts#L92-L101):

```typescript
// Passes full selector for RecordReplay.findDOMElementByControlSelector()
const result = await page.evaluate(browserFindControl, {
  selector: { ...selector },
  bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
  preferVisibleControls,
});
```

#### `registry` — Full Registry Scan (Tier 2)

Scans all instantiated UI5 controls via `registry.all()` and matches by `controlType`,
`properties`, `bindingPath`, `viewName`, and visibility. The most thorough but slowest
strategy.

**SAP UI5 APIs used:**

| API                             | What It Does                                               | Reference                                                                                                 |
| ------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `registry.all()`                | Returns all instantiated UI5 controls as a map             | [API Reference](https://ui5.sap.com/#/api/sap.ui.core.ElementRegistry%23methods/all)                      |
| `control.getVisible()`          | Check visibility (used when `preferVisibleControls` is on) | [API Reference](https://ui5.sap.com/#/api/sap.ui.core.Control%23methods/getVisible)                       |
| `control.getProperty(name)`     | Read any property by name for matching                     | [API Reference](https://ui5.sap.com/#/api/sap.ui.base.ManagedObject%23methods/getProperty)                |
| `control.getBinding(name)`      | Get data binding for a property                            | [API Reference](https://ui5.sap.com/#/api/sap.ui.base.ManagedObject%23methods/getBinding)                 |
| `binding.getPath()`             | Read the OData binding path (e.g., `/Products/0/Name`)     | [API Reference](https://ui5.sap.com/#/api/sap.ui.model.Binding%23methods/getPath)                         |
| `control.getParent()`           | Walk the control tree for ancestor/view matching           | [API Reference](https://ui5.sap.com/#/api/sap.ui.base.ManagedObject%23methods/getParent)                  |
| `metadata.getAllProperties()`   | Get all property definitions for a control type            | [API Reference](https://ui5.sap.com/#/api/sap.ui.base.ManagedObjectMetadata%23methods/getAllProperties)   |
| `metadata.getAllAggregations()` | Get all aggregation definitions                            | [API Reference](https://ui5.sap.com/#/api/sap.ui.base.ManagedObjectMetadata%23methods/getAllAggregations) |

**When it works:** Always — the element registry is available in all UI5 versions.

**When it's slow:** Pages with thousands of controls (large List Reports, complex Object Pages).

**Behavior in code** — `tryStrategy('registry', ...)` at
[discovery.ts:103–114](https://github.com/nicheui/praman/blob/main/src/proxy/discovery.ts#L103-L114):

```typescript
// Forces Tier 2 registry scan, skipping Tier 1 direct-id
const result = await page.evaluate(browserFindControl, {
  selector: { ...selector },
  bridgeNs: BRIDGE_GLOBALS.NAMESPACE,
  preferVisibleControls,
  forceRegistryScan: true,
});
```

### Smart Priority Promotion

The discovery factory at
[discovery-factory.ts:84–93](https://github.com/nicheui/praman/blob/main/src/proxy/discovery-factory.ts#L84-L93)
automatically promotes `direct-id` to first position for ID-only selectors, regardless of the
configured order:

```
Config:   discoveryStrategies: ['recordreplay', 'direct-id']
Selector: { id: 'btn1' }                    ← ID-only
Actual:   ['cache', 'direct-id', 'recordreplay']  ← direct-id promoted

Selector: { controlType: 'sap.m.Button', properties: { text: 'Save' } }  ← complex
Actual:   ['cache', 'recordreplay', 'direct-id']  ← config order preserved
```

### Comparison Table

|                      | `direct-id`                      | `recordreplay`                                       | `registry`                 |
| -------------------- | -------------------------------- | ---------------------------------------------------- | -------------------------- |
| **Speed**            | Fastest (single lookup)          | Medium (API call + DOM bridge)                       | Slowest (full scan)        |
| **Selector support** | `id` only                        | Full selector (type, properties, bindings, ancestor) | Full selector              |
| **UI5 version**      | All versions                     | >= 1.94                                              | All versions               |
| **Best for**         | Known stable IDs                 | Complex selectors, SAP standard apps                 | Dynamic controls, fallback |
| **Risk**             | Fails if ID changes across views | Requires RecordReplay module loaded                  | Slow on large pages        |

### UI5 Version Compatibility for Discovery

```
┌─────────────────────────────────────────────────────────────────────┐
│ UI5 Version    │ direct-id  │ registry   │ recordreplay             │
│────────────────┼────────────┼────────────┼──────────────────────────│
│ < 1.84         │ ✓ (legacy  │ ✓ (Element │ ✗                       │
│                │  registry) │  Registry) │                          │
│ 1.84 – 1.93   │ ✓          │ ✓ (Element.│ ✗                       │
│                │            │  registry) │                          │
│ >= 1.94        │ ✓          │ ✓          │ ✓                       │
│ >= 1.106       │ ✓          │ ✓          │ ✓ (uses closestTo)      │
└─────────────────────────────────────────────────────────────────────┘
```

_Source: Registry fallback at
[find-control-fn.ts:189–198](https://github.com/nicheui/praman/blob/main/src/bridge/browser-scripts/find-control-fn.ts#L189-L198),
closestTo vs jQuery at
[find-control-fn.ts:315–326](https://github.com/nicheui/praman/blob/main/src/bridge/browser-scripts/find-control-fn.ts#L315-L326)_

---

## Part 2: Interaction Strategies

Interaction strategies define how Praman performs `press()`, `enterText()`, and `select()`
operations on discovered controls. Each strategy uses different SAP UI5 and DOM APIs with its
own internal fallback chain.

### The Interaction Flow

```
                    ┌─────────────────────────────┐
                    │  ui5.click({ id: 'btn1' })  │
                    └──────────────┬──────────────┘
                                   │
                                   v
                    ┌─────────────────────────────┐
                    │  Discovery (Part 1 above)   │
                    │  Returns: control proxy     │
                    │  with controlId              │
                    └──────────────┬──────────────┘
                                   │
                                   v
                    ┌─────────────────────────────┐
                    │  strategy.press(page, id)   │
                    │                             │
                    │  Configured at worker start │
                    │  via pramanConfig fixture    │
                    └──────────────┬──────────────┘
                                   │
                  ┌────────────────┼────────────────┐
                  │                │                │
                  v                v                v
         ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
         │  ui5-native   │ │  dom-first   │ │    opa5      │
         │  (default)    │ │              │ │              │
         │ firePress()   │ │ dom.click()  │ │ RecordReplay │
         │ fireSelect()  │ │ firePress()  │ │ .interact..()│
         │ fireTap()     │ │ fireSelect() │ │ firePress()  │
         │ dom.click()   │ │ fireTap()    │ │ fireSelect() │
         └──────────────┘ └──────────────┘ └──────────────┘
```

_Source: [strategy-factory.ts](https://github.com/nicheui/praman/blob/main/src/bridge/interaction-strategies/strategy-factory.ts) lines 38–51,
[module-fixtures.ts](https://github.com/nicheui/praman/blob/main/src/fixtures/module-fixtures.ts) line 324_

### Strategy Interface

All three strategies implement the same contract defined in
[strategy.ts](https://github.com/nicheui/praman/blob/main/src/bridge/interaction-strategies/strategy.ts):

```typescript
interface InteractionStrategy {
  readonly name: string;
  press(page: Page, controlId: string): Promise<void>;
  enterText(page: Page, controlId: string, text: string): Promise<void>;
  select(page: Page, controlId: string, itemId: string): Promise<void>;
}
```

### `ui5-native` — Default Strategy

Uses direct UI5 control event firing. The most reliable strategy for standard SAP Fiori
applications because it triggers the same code paths that real user interactions would.

**SAP UI5 APIs used:**

| API                                 | Operation | What It Does                                  | Reference                                                                          |
| ----------------------------------- | --------- | --------------------------------------------- | ---------------------------------------------------------------------------------- |
| `control.firePress()`               | press     | Fires the press event on buttons, links       | [API Reference](https://ui5.sap.com/#/api/sap.m.Button%23events/press)             |
| `control.fireSelect()`              | press     | Fires the select event on selectable controls | [API Reference](https://ui5.sap.com/#/api/sap.m.Select%23events/change)            |
| `control.fireTap()`                 | press     | Fires tap event (legacy, pre-1.50 controls)   | —                                                                                  |
| `control.getDomRef()`               | press     | Gets the DOM element for DOM click fallback   | [API Reference](https://ui5.sap.com/#/api/sap.ui.core.Element%23methods/getDomRef) |
| `control.setValue(text)`            | enterText | Sets text value on input controls             | [API Reference](https://ui5.sap.com/#/api/sap.m.InputBase%23methods/setValue)      |
| `control.fireLiveChange({ value })` | enterText | Fires live change as user types               | [API Reference](https://ui5.sap.com/#/api/sap.m.Input%23events/liveChange)         |
| `control.fireChange({ value })`     | enterText | Fires change when input loses focus           | [API Reference](https://ui5.sap.com/#/api/sap.m.InputBase%23events/change)         |
| `control.setSelectedKey(key)`       | select    | Sets the selected key on dropdowns            | [API Reference](https://ui5.sap.com/#/api/sap.m.Select%23methods/setSelectedKey)   |
| `control.fireSelectionChange()`     | select    | Fires selection change event                  | [API Reference](https://ui5.sap.com/#/api/sap.m.Select%23events/change)            |

**Fallback chains in code:**

```
press() — ui5-native-strategy.ts lines 65–97
  ├── firePress()     ─┐
  ├── fireSelect()    ─┤ both fire if available
  │   └── success ──────→ done
  ├── fireTap()        → done
  └── getDomRef().click() → done
       └── fail → throw ControlError

enterText() — ui5-native-strategy.ts lines 100–128
  Sequential (all called, not fallback):
  ├── setValue(text)
  ├── fireLiveChange({ value: text })
  └── fireChange({ value: text })

select() — ui5-native-strategy.ts lines 131–161
  ├── setSelectedKey(itemId)
  ├── fireSelectionChange({ selectedItem })  → done
  └── fireChange({ selectedItem })           → done (fallback)
```

:::info Why firePress and fireSelect both fire
The ui5-native strategy fires both `firePress()` and `fireSelect()` on the same control
(lines 74–76). This is intentional — some controls like `SegmentedButton` items respond to
`fireSelect()` but not `firePress()`, while standard buttons respond to `firePress()` only.
Firing both covers both cases.
:::

### `dom-first` — DOM Events First

Performs DOM-level interactions first, then falls back to UI5 events. This strategy uses
Playwright's `page.evaluate(fn, args)` with typed argument objects — no string interpolation —
which eliminates script injection risks.

Best for form controls and custom composite controls that respond to DOM events but don't
expose `firePress()`.

**SAP UI5 and DOM APIs used:**

| API                                      | Operation | Type | Reference                                                                                   |
| ---------------------------------------- | --------- | ---- | ------------------------------------------------------------------------------------------- |
| `control.getDomRef()`                    | press     | UI5  | [API Reference](https://ui5.sap.com/#/api/sap.ui.core.Element%23methods/getDomRef)          |
| `dom.click()`                            | press     | DOM  | [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/click)         |
| `control.getFocusDomRef()`               | enterText | UI5  | [API Reference](https://ui5.sap.com/#/api/sap.ui.core.Element%23methods/getFocusDomRef)     |
| `HTMLInputElement.value = text`          | enterText | DOM  | [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/value)    |
| `dom.dispatchEvent(new Event('input'))`  | enterText | DOM  | [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent) |
| `dom.dispatchEvent(new Event('change'))` | enterText | DOM  | [MDN Reference](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent) |
| `control.setValue(text)`                 | enterText | UI5  | [API Reference](https://ui5.sap.com/#/api/sap.m.InputBase%23methods/setValue)               |
| `control.fireChange({ value })`          | enterText | UI5  | [API Reference](https://ui5.sap.com/#/api/sap.m.InputBase%23events/change)                  |
| `control.firePress()`                    | press     | UI5  | [API Reference](https://ui5.sap.com/#/api/sap.m.Button%23events/press)                      |

**Fallback chains in code:**

```
press() — dom-first-strategy.ts lines 79–135
  ├── getDomRef() → dom.click()     → done  (DOM first)
  ├── firePress()                   ─┐
  ├── fireSelect()                  ─┤ both fire if available
  │   └── success ──────────────────→ done
  ├── fireTap()                      → done
  └── fail → throw ControlError

enterText() — dom-first-strategy.ts lines 138–193
  ├── getFocusDomRef() or getDomRef()
  │   └── if tagName === 'INPUT':
  │       ├── input.value = text          (DOM property set)
  │       ├── dispatchEvent('input')      (synthetic DOM event)
  │       └── dispatchEvent('change')     → done (early return)
  └── UI5 fallback:
      ├── setValue(text)
      └── fireChange({ value: text })    → done

select() — dom-first-strategy.ts lines 196–243
  Same as ui5-native (no DOM shortcut for select):
  ├── setSelectedKey(itemId)
  ├── fireSelectionChange({ selectedItem })  → done
  └── fireChange({ selectedItem })           → done
```

### `opa5` — SAP RecordReplay API

Uses SAP's official `RecordReplay.interactWithControl()` API from the OPA5 testing framework.
Most compatible with SAP testing standards. Includes an optional **auto-waiter** that polls
for UI5 stability before each interaction.

Falls back to native UI5 fire\* methods if RecordReplay is not available.

:::warning UI5 Version Requirement
The opa5 strategy requires UI5 >= 1.94 for the `sap.ui.test.RecordReplay` API. On older
versions, it falls back to `firePress()` / `setValue()` — effectively behaving like
ui5-native with reduced coverage.
:::

**SAP UI5 APIs used:**

| API                                  | Operation | What It Does                                    | Reference                                                                                                                  |
| ------------------------------------ | --------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `RecordReplay.interactWithControl()` | all       | SAP's official control interaction API          | [API Reference](https://ui5.sap.com/#/api/sap.ui.test.RecordReplay%23methods/sap.ui.test.RecordReplay.interactWithControl) |
| `RecordReplay.getAutoWaiter()`       | all       | Gets the OPA5 auto-waiter instance              | [API Reference](https://ui5.sap.com/#/api/sap.ui.test.RecordReplay%23methods/sap.ui.test.RecordReplay.getAutoWaiter)       |
| `autoWaiter.hasToWait()`             | all       | Returns `true` while UI5 has pending async work | [API Reference](https://ui5.sap.com/#/api/sap.ui.test.autowaiter.autoWaiter%23methods/hasToWait)                           |
| `control.firePress()`                | press     | Fallback if RecordReplay unavailable            | [API Reference](https://ui5.sap.com/#/api/sap.m.Button%23events/press)                                                     |
| `control.fireSelect()`               | press     | Fallback if RecordReplay unavailable            | —                                                                                                                          |
| `control.setValue(text)`             | enterText | Fallback if RecordReplay unavailable            | [API Reference](https://ui5.sap.com/#/api/sap.m.InputBase%23methods/setValue)                                              |
| `control.setSelectedKey(key)`        | select    | Fallback if RecordReplay unavailable            | [API Reference](https://ui5.sap.com/#/api/sap.m.Select%23methods/setSelectedKey)                                           |

**OPA5-specific configuration** — defined in
[schema.ts:119–123](https://github.com/nicheui/praman/blob/main/src/core/config/schema.ts#L119-L123):

| Field                | Default | Description                                            |
| -------------------- | ------- | ------------------------------------------------------ |
| `interactionTimeout` | `5000`  | Timeout in ms for `RecordReplay.interactWithControl()` |
| `autoWait`           | `true`  | Poll `hasToWait()` before each interaction             |
| `debug`              | `false` | Log `[praman:opa5]` messages to browser console        |

**Fallback chains in code:**

```
press() — opa5-strategy.ts lines 82–140
  if RecordReplay available:
  │ ├── autoWaiter.hasToWait() polling loop (100ms interval)
  │ └── RecordReplay.interactWithControl({
  │       selector: { id },
  │       interactionType: 'PRESS',
  │       interactionTimeout
  │     })                                  → done
  │
  if RecordReplay NOT available (fallback):
    ├── firePress()                        ─┐
    └── fireSelect()                       ─┤ → done
         └── fail → throw ControlError

enterText() — opa5-strategy.ts lines 143–194
  if RecordReplay available:
  │ ├── autoWaiter polling
  │ └── RecordReplay.interactWithControl({
  │       interactionType: 'ENTER_TEXT',
  │       enterText: text
  │     })                                  → done
  │
  if RecordReplay NOT available:
    └── setValue(text)                       → done

select() — opa5-strategy.ts lines 197–246
  if RecordReplay available:
  │ ├── autoWaiter polling
  │ └── RecordReplay.interactWithControl({
  │       interactionType: 'PRESS'          ← uses PRESS, not SELECT
  │     })                                  → done
  │
  if RecordReplay NOT available:
    └── setSelectedKey(itemId)              → done
```

### Understanding SAP Pages: DOM, UI5, and Web Components Together

Real SAP Fiori applications often render a mix of control types on the same page:

```
┌─ SAP Fiori Launchpad (FLP) ────────────────────────────────┐
│                                                             │
│  ┌─ Shell Bar ──────────────────────────────────────────┐   │
│  │  Pure DOM elements (custom CSS, no UI5 control)      │   │
│  │  Example: logo image, custom toolbar buttons         │   │
│  │  → Only dom-first can interact with these            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ App Container ──────────────────────────────────────┐   │
│  │                                                       │   │
│  │  ┌─ Standard UI5 Controls ──────────────────────┐     │   │
│  │  │  sap.m.Button, sap.m.Input, sap.m.Table      │     │   │
│  │  │  → All strategies work (ui5-native best)      │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  │                                                       │   │
│  │  ┌─ Smart Controls (sap.ui.comp) ───────────────┐     │   │
│  │  │  SmartField wraps inner Input/ComboBox/etc.   │     │   │
│  │  │  → ui5-native works on outer SmartField       │     │   │
│  │  │  → dom-first can reach inner <input> element  │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  │                                                       │   │
│  │  ┌─ UI5 Web Components ─────────────────────────┐     │   │
│  │  │  ui5-button, ui5-input (Shadow DOM)           │     │   │
│  │  │  → dom-first required (shadow DOM piercing)   │     │   │
│  │  │  → ui5-native cannot fire events on WC        │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  │                                                       │   │
│  │  ┌─ Third-Party / Custom Controls ──────────────┐     │   │
│  │  │  Custom composite controls, chart libraries   │     │   │
│  │  │  → dom-first often the only option            │     │   │
│  │  │  → ui5-native works if they extend ManagedObj │     │   │
│  │  └──────────────────────────────────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

This is why choosing the right strategy matters. No single strategy handles every control type
on every page. The built-in fallback chains in each strategy are designed to cover the most
common combinations.

### Comparison Table

|                           | `ui5-native`              | `dom-first`                  | `opa5`                       |
| ------------------------- | ------------------------- | ---------------------------- | ---------------------------- |
| **Speed**                 | Fast                      | Fast                         | Medium (auto-waiter polling) |
| **Standard UI5 controls** | Best                      | Good (via fallback)          | Best (SAP official)          |
| **Custom composites**     | May fail (no `firePress`) | Best                         | May fail                     |
| **UI5 Web Components**    | Does not work             | Works (DOM events)           | Does not work                |
| **Plain DOM elements**    | Falls back to DOM click   | Works natively               | Does not work                |
| **OData model updates**   | `setValue` + events       | DOM events may miss bindings | RecordReplay handles         |
| **UI5 version**           | All                       | All                          | >= 1.94                      |
| **SAP compliance**        | No official API           | No official API              | Yes (`RecordReplay`)         |
| **Fallback chain depth**  | 4 levels                  | 4 levels                     | 2 levels + RecordReplay      |

---

## Part 3: Configuring Strategies — A Practical Guide

### How Configuration Flows Through the Code

```
  Environment Variable                    Zod Schema Defaults
  PRAMAN_INTERACTION_STRATEGY=dom-first   interactionStrategy: 'ui5-native'
  PRAMAN_DISCOVERY_STRATEGIES=...         discoveryStrategies: ['direct-id','recordreplay']
           │                                          │
           v                                          v
  ┌──────────────────────────────────────────────────────────┐
  │  loadConfig()  — src/core/config/loader.ts:142           │
  │  Merges: schema defaults ← env vars (env wins)          │
  │  Validates with Zod, returns Readonly<PramanConfig>      │
  └────────────────────────┬─────────────────────────────────┘
                           │
                           v
  ┌──────────────────────────────────────────────────────────┐
  │  pramanConfig fixture — src/fixtures/core-fixtures.ts:164│
  │  Worker-scoped: loaded ONCE per Playwright worker        │
  │  Frozen: Object.freeze(config)                           │
  └────────────────────────┬─────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              v                         v
  ┌───────────────────────┐  ┌────────────────────────────────┐
  │ createInteraction     │  │ new UI5Handler({               │
  │  Strategy(            │  │   discoveryStrategies:         │
  │   config.interaction  │  │     config.discoveryStrategies │
  │   Strategy,           │  │ })                             │
  │   config.opa5         │  │                                │
  │ )                     │  │ src/fixtures/module-fixtures.ts│
  │                       │  │   line 337                     │
  │ src/fixtures/         │  └────────────────────────────────┘
  │   module-fixtures.ts  │
  │   line 324            │
  └───────────────────────┘
```

_Source: [loader.ts:62–78](https://github.com/nicheui/praman/blob/main/src/core/config/loader.ts#L62-L78)
defines the env var mappings,
[module-fixtures.ts:322–347](https://github.com/nicheui/praman/blob/main/src/fixtures/module-fixtures.ts#L322-L347)
wires config to strategy and handler_

### Setting Strategies via Environment Variables

The most direct way to configure strategies without changing code.

#### Interaction Strategy

```bash
# Use DOM-first for a test run
PRAMAN_INTERACTION_STRATEGY=dom-first npx playwright test

# Use OPA5 RecordReplay
PRAMAN_INTERACTION_STRATEGY=opa5 npx playwright test

# Use the default (ui5-native) — no env var needed
npx playwright test
```

Valid values: `ui5-native`, `dom-first`, `opa5`

_Source: env var mapping at [loader.ts:70](https://github.com/nicheui/praman/blob/main/src/core/config/loader.ts#L70)_

#### Discovery Strategies

```bash
# ID lookup first, then RecordReplay, then full registry scan
PRAMAN_DISCOVERY_STRATEGIES=direct-id,recordreplay,registry npx playwright test

# Only use RecordReplay (skip ID lookup)
PRAMAN_DISCOVERY_STRATEGIES=recordreplay npx playwright test

# Only registry scan (thorough but slow)
PRAMAN_DISCOVERY_STRATEGIES=registry npx playwright test
```

Valid values (comma-separated): `direct-id`, `recordreplay`, `registry`

_Source: env var mapping at [loader.ts:72–75](https://github.com/nicheui/praman/blob/main/src/core/config/loader.ts#L72-L75),
parsed as comma-separated array at [loader.ts:106–113](https://github.com/nicheui/praman/blob/main/src/core/config/loader.ts#L106-L113)_

#### OPA5 Tuning (when using `opa5` interaction strategy)

```bash
PRAMAN_INTERACTION_STRATEGY=opa5 npx playwright test
```

The OPA5 sub-config (`interactionTimeout`, `autoWait`, `debug`) does not have env var mappings.
These are set via inline overrides or config file only.

#### Combining Both

```bash
# DOM-first interaction + registry-based discovery with all 3 tiers
PRAMAN_INTERACTION_STRATEGY=dom-first \
PRAMAN_DISCOVERY_STRATEGIES=direct-id,recordreplay,registry \
npx playwright test
```

#### In CI/CD Pipelines

```yaml
# GitHub Actions
- name: Run SAP E2E Tests
  run: npx playwright test
  env:
    PRAMAN_INTERACTION_STRATEGY: opa5
    PRAMAN_DISCOVERY_STRATEGIES: direct-id,recordreplay
    SAP_CLOUD_BASE_URL: ${{ secrets.SAP_URL }}
```

```yaml
# Azure Pipelines
- script: npx playwright test
  env:
    PRAMAN_INTERACTION_STRATEGY: dom-first
    PRAMAN_DISCOVERY_STRATEGIES: direct-id,recordreplay,registry
```

:::danger Typo in env var values discards ALL env vars
If any single env var fails Zod validation, the loader discards **all** env var overrides
and falls back to defaults. A typo like `PRAMAN_DISCOVERY_STRATEGIES=direct-id,recordreply`
(missing `a` in replay) causes both the discovery and interaction env vars to be silently
ignored. Only a `warn`-level pino log is emitted.

This is implemented at
[loader.ts:159–171](https://github.com/nicheui/praman/blob/main/src/core/config/loader.ts#L159-L171).

Verify your values match exactly: `direct-id`, `recordreplay`, `registry`, `ui5-native`,
`dom-first`, `opa5`.
:::

### Decision Matrix: Choosing Your Strategy

#### Step 1: Choose Your Interaction Strategy

```
Is your app standard SAP Fiori (SAPUI5 controls only)?
  ├── YES → Does your team require SAP compliance audits?
  │          ├── YES → Use opa5 (SAP's official API)
  │          └── NO  → Use ui5-native (default, broadest fallback)
  │
  └── NO  → Does your app have any of these?
             ├── UI5 Web Components (Shadow DOM)    → Use dom-first
             ├── Custom composite controls          → Use dom-first
             ├── Plain DOM elements mixed with UI5  → Use dom-first
             └── Standard UI5 only in older version → Use ui5-native
```

#### Step 2: Choose Your Discovery Priorities

```
Do your selectors use stable IDs (e.g., { id: 'saveBtn' })?
  ├── YES → Include direct-id first: ['direct-id', 'recordreplay']
  │         (direct-id is auto-promoted for ID-only selectors anyway)
  │
  └── NO  → Do you use complex selectors (controlType + properties)?
             ├── YES → Is UI5 >= 1.94?
             │          ├── YES → ['recordreplay', 'direct-id']
             │          └── NO  → ['registry', 'direct-id']
             │
             └── Mostly binding paths or ancestor matching?
                  └── ['registry', 'recordreplay']
```

#### Step 3: Apply the Configuration

```bash
# Scenario A: Standard Fiori, stable IDs (most common)
# Just use defaults — no env vars needed
npx playwright test

# Scenario B: Mixed controls, need DOM access
PRAMAN_INTERACTION_STRATEGY=dom-first npx playwright test

# Scenario C: SAP compliance, complex selectors
PRAMAN_INTERACTION_STRATEGY=opa5 \
PRAMAN_DISCOVERY_STRATEGIES=recordreplay,direct-id,registry \
npx playwright test

# Scenario D: Legacy app (UI5 < 1.94), dynamic controls
PRAMAN_DISCOVERY_STRATEGIES=direct-id,registry npx playwright test
```

### Recommended Configurations by App Type

| Application Type              | Interaction  | Discovery                                   | Why                              |
| ----------------------------- | ------------ | ------------------------------------------- | -------------------------------- |
| Standard Fiori (S/4HANA)      | `ui5-native` | `['direct-id', 'recordreplay']`             | Stable IDs, standard controls    |
| Fiori Elements List Report    | `ui5-native` | `['recordreplay', 'direct-id']`             | Generated IDs, complex selectors |
| Custom Fiori App              | `dom-first`  | `['direct-id', 'recordreplay', 'registry']` | Custom controls may lack fire\*  |
| Hybrid (UI5 + Web Components) | `dom-first`  | `['direct-id', 'registry']`                 | Shadow DOM needs DOM events      |
| Migration from OPA5           | `opa5`       | `['recordreplay', 'direct-id']`             | Behavioral parity with OPA5      |
| Legacy (UI5 < 1.94)           | `ui5-native` | `['direct-id', 'registry']`                 | No RecordReplay available        |

### Verifying Your Configuration

To confirm which strategies are active, enable debug logging:

```bash
PRAMAN_LOG_LEVEL=debug \
PRAMAN_INTERACTION_STRATEGY=dom-first \
PRAMAN_DISCOVERY_STRATEGIES=direct-id,recordreplay \
npx playwright test --headed
```

The pino logger will output which strategy was created and which discovery chain is active.

### Pros and Cons of Environment Variables

| Pros                                          | Cons                                           |
| --------------------------------------------- | ---------------------------------------------- |
| Works today, no code changes                  | Not version-controlled (ephemeral)             |
| Easy CI/CD override per pipeline              | No IDE autocomplete or type checking           |
| Switch strategies per test run                | One typo silently discards ALL env vars        |
| No file to maintain                           | Team must document in CI config or README      |
| Highest priority (overrides all other config) | Cannot set OPA5 sub-config (timeout, autoWait) |

## See Also

- [Selector Reference](./selectors.md) — How to write `UI5Selector` objects
- [Configuration Reference](./configuration.md) — Full config schema
- [Control Interactions](./control-interactions.md) — `ui5.click()`, `ui5.fill()`, etc.
- [Bridge Internals](./bridge-internals.md) — How the bridge injects into the browser
- [Control Proxy](./control-proxy.md) — How discovered controls become proxy objects
