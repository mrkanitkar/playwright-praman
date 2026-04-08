---
title: UI5 Control Interactions
description: 'Click, fill, select, check, and read UI5 controls with Praman. Auto-waiting, typed returns, and SAP event firing built in.'
keywords:
  - playwright ui5 click button
  - sap ui5 fill input field
  - praman control interactions
  - sap ui5 test automation
---

# UI5 Control Interactions

:::info[In this guide]

- Click buttons, fill inputs, and select dropdown values using the `ui5` fixture
- Understand auto-waiting behavior and how it differs from Playwright's native auto-wait
- Read control properties and text for assertions
- Learn the three-tier wait sequence that runs during navigation
- Skip stability waits for performance-critical paths

:::

The `ui5` fixture provides high-level methods for interacting with UI5 controls. Each method
discovers the control, waits for UI5 stability, and performs the action through the configured
interaction strategy.

:::warning[Common mistake]
Do not use Playwright's native `page.click()` with DOM selectors to interact with UI5 controls.
UI5 controls manage their own event lifecycle, and DOM-level clicks can bypass OData model
updates, validation handlers, and change events.

```typescript
// Wrong — bypasses UI5 event system
await page.click('#__xmlview0--saveBtn');

// Correct — fires UI5 events, waits for stability
await ui5.click({ id: 'saveBtn' });
```

:::


:::tip Typed Control Returns
When you use `controlType` in your selector, the returned control is typed to the specific interface
(e.g., `UI5Button`, `UI5Input`). This gives you autocomplete for control-specific methods. See
[Typed Control Returns](/docs/guides/typed-controls) for details.
:::

## Interaction Methods

### click

Clicks a UI5 control. Uses the configured interaction strategy (UI5-native `firePress()` by
default, with DOM click fallback).

```typescript
await ui5.click({ id: 'submitBtn' });
await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
```

### fill

Sets the value of an input control. Fires both `liveChange` and `change` events to ensure
OData model bindings update.

```typescript
await ui5.fill({ id: 'vendorInput' }, '100001');
await ui5.fill({ controlType: 'sap.m.Input', viewName: 'myApp.view.Detail' }, 'New Value');
```

### press

Triggers a press action on a control. Equivalent to `click` but semantically clearer for
buttons, links, and tiles.

```typescript
await ui5.press({ id: 'confirmBtn' });
```

### select

Selects an item in a dropdown (Select, ComboBox, MultiComboBox). Accepts selection by key or
display text.

```typescript
await ui5.select({ id: 'countrySelect' }, 'US');
await ui5.select({ id: 'statusComboBox' }, 'Active');
```

### check / uncheck

Toggles checkbox and switch controls.

```typescript
await ui5.check({ id: 'agreeCheckbox' });
await ui5.uncheck({ id: 'optionalCheckbox' });
```

### clear

Clears the value of an input control and fires change events.

```typescript
await ui5.clear({ id: 'searchField' });
```

### getText

Reads the text property of a control.

```typescript
const label = await ui5.getText({ id: 'headerTitle' });
expect(label).toBe('Purchase Order Details');
```

### getProperty

Reads any property from a UI5 control by name.

```typescript
const btn = await ui5.control({ id: 'saveBtn' });
const enabled = await btn.getProperty('enabled');

const status = await ui5.control({ id: 'statusText' });
const visible = await status.getProperty('visible');
```

### waitForUI5

Manually triggers a UI5 stability wait. Normally called automatically, but useful after custom
browser-side operations.

```typescript
await ui5.click({ id: 'triggerLongLoad' });
await ui5.waitForUI5(30_000); // Custom timeout in milliseconds
```

## Auto-Waiting Behavior

Every `ui5.*` method calls `waitForUI5Stable()` before executing. This differs from Playwright's
native auto-waiting in a critical way:

| Aspect                | Playwright Auto-Wait                         | Praman Auto-Wait                                         |
| --------------------- | -------------------------------------------- | -------------------------------------------------------- |
| **What it waits for** | DOM actionability (visible, enabled, stable) | UI5 runtime pending operations (XHR, promises, bindings) |
| **Scope**             | Single element                               | Entire UI5 application                                   |
| **Source of truth**   | DOM state                                    | `sap.ui.getCore().getUIDirty()` + pending request count  |
| **When it fires**     | Before each locator action                   | Before each `ui5.*` call                                 |

Playwright's auto-wait checks whether a specific DOM element is visible and enabled. Praman's
auto-wait checks whether the entire UI5 framework has finished all asynchronous operations —
this includes OData requests triggered by other controls, model binding updates, and view
rendering.

### The Three-Tier Wait

When a page navigation occurs, Praman executes a three-tier wait:

1. **waitForUI5Bootstrap** (60s) — waits for `window.sap.ui.getCore` to exist
2. **waitForUI5Stable** (15s) — waits for zero pending async operations
3. **briefDOMSettle** (500ms) — brief pause for final DOM rendering

For subsequent interactions (not navigation), only `waitForUI5Stable` is called.

### Skipping the Stability Wait

For performance-critical paths where you know UI5 is already stable:

```typescript
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  skipStabilityWait: true, // Uses briefDOMSettle (500ms) instead
});
```

## Complete Example

```typescript
import { test, expect } from 'playwright-praman';

test('edit and save a purchase order', async ({ ui5, ui5Navigation }) => {
  // Navigate to the app
  await ui5Navigation.navigateToApp('PurchaseOrder-manage');

  // Click the first row to open details
  await ui5.click({
    controlType: 'sap.m.ColumnListItem',
    ancestor: { id: 'poTable' },
  });

  // Edit mode
  await ui5.click({ id: 'editBtn' });

  // Fill fields
  await ui5.fill({ id: 'vendorInput' }, '100002');
  await ui5.select({ id: 'purchOrgSelect' }, '1000');
  await ui5.check({ id: 'urgentCheckbox' });

  // Clear and refill
  await ui5.clear({ id: 'noteField' });
  await ui5.fill({ id: 'noteField' }, 'Updated via automated test');

  // Read values back
  const vendor = await ui5.getText({ id: 'vendorInput' });
  expect(vendor).toBe('100002');

  // Save
  await ui5.click({ id: 'saveBtn' });
});
```

## Interaction Under the Hood

Each interaction method follows this sequence:

1. **Stability guard** — `waitForUI5Stable()` ensures no pending async operations
2. **Control discovery** — finds the control via the multi-strategy chain (cache, direct-ID,
   RecordReplay, registry scan)
3. **Strategy execution** — delegates to the configured interaction strategy (ui5-native,
   dom-first, or opa5)
4. **Step decoration** — wraps the entire operation in a Playwright `test.step()` for HTML
   report visibility

If the primary strategy method fails (e.g., `firePress()` not available), the strategy
automatically falls back to its secondary method (e.g., DOM click).

## FAQ

<details>
<summary>Can I use page.click() instead of ui5.click()?</summary>

You can, but you should not for UI5 controls. `page.click()` performs a DOM-level click that
bypasses the UI5 event system. This means OData model bindings may not update, `liveChange`
and `change` events may not fire, and validation logic may be skipped. Use `ui5.click()` for
all UI5 controls. Reserve `page.click()` for verified non-UI5 DOM elements (e.g., custom
shell header buttons).

</details>

<details>
<summary>How do I interact with controls inside a dialog?</summary>

Pass `searchOpenDialogs: true` in your selector:

```typescript
await ui5.click({
  controlType: 'sap.m.Button',
  properties: { text: 'OK' },
  searchOpenDialogs: true,
});
```

Without this flag, Praman only searches the main view's control tree and will not find
controls rendered inside dialog overlays.

</details>

<details>
<summary>Why does ui5.fill() fire both liveChange and change events?</summary>

SAP UI5 input controls use `liveChange` for character-by-character updates (e.g., search
suggestions) and `change` for final value commits (e.g., OData model updates). Praman fires
both to match real user behavior. Skipping either event can cause missing suggestions,
incomplete validation, or stale OData bindings.

</details>

<details>
<summary>What happens if waitForUI5Stable times out?</summary>

A `TimeoutError` is thrown with details about which async operations were still pending
(e.g., open XHR requests, unresolved promises). Check for long-running OData calls, infinite
polling, or background model refresh timers. You can increase the timeout via
`controlDiscoveryTimeout` in your Praman config.

</details>

:::tip[Next steps]

- **[Selector Reference →](./selectors.md)** — Learn all UI5Selector fields for finding controls
- **[Typed Control Returns →](./typed-controls.md)** — Get full autocomplete for control-specific methods
- **[Custom Matchers →](./custom-matchers.md)** — Assert UI5 control state with 10 built-in matchers
- **[Discovery and Interaction Strategies →](./discovery-and-interaction.md)** — Configure how controls are found and acted on

:::
