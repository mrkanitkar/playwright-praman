---
sidebar_position: 11
title: Interaction Strategies
---

Praman provides three swappable strategies for how it interacts with UI5 controls: **ui5-native**,
**dom-first**, and **opa5**. Each strategy defines how click, type, and select operations are
executed, with automatic fallback chains for reliability.

## The Three Strategies

### ui5-native (Default)

Fires UI5 control events directly via the control's API. This is the most reliable strategy for
standard SAP Fiori applications.

**Click chain:** `firePress()` -> `fireSelect()` -> `fireTap()` -> DOM click fallback

**enterText chain:** `setValue()` + fire `liveChange` + fire `change`

**select chain:** `setSelectedKey(key)` -> `setSelectedItem(byText)` -> fire `selectionChange`

```typescript
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  interactionStrategy: 'ui5-native',
});
```

### dom-first

Performs DOM-level interactions first (Playwright's native click, type, fill), then falls back to
UI5 events. Best for form controls and custom composite controls that respond to DOM events but
not to `firePress()`.

**Click chain:** DOM click -> `firePress()` fallback

**enterText chain:** Playwright `fill()` -> `setValue()` + events fallback

**select chain:** DOM click to open -> DOM click item -> UI5 API fallback

```typescript
export default defineConfig({
  interactionStrategy: 'dom-first',
});
```

### opa5

Uses SAP's RecordReplay API (part of OPA5 testing framework). Best for teams that need SAP
testing standards compliance or are migrating from OPA5 test suites.

**Click chain:** `RecordReplay.interactWithControl({ press })` -> DOM fallback

**enterText chain:** `RecordReplay.interactWithControl({ enterText })` -> fallback

**select chain:** `RecordReplay.interactWithControl({ select })` -> fallback

```typescript
export default defineConfig({
  interactionStrategy: 'opa5',
});
```

:::note OPA5 Requirement
The opa5 strategy requires UI5 version >= 1.94 for RecordReplay API availability.
:::

## When to Use Each Strategy

| Scenario                  | Recommended Strategy | Reason                                       |
| ------------------------- | -------------------- | -------------------------------------------- |
| Standard Fiori apps       | `ui5-native`         | Most reliable for SAP standard controls      |
| Custom composite controls | `dom-first`          | Custom controls often lack `firePress()`     |
| Form-heavy data entry     | `dom-first`          | DOM events handle focus/blur correctly       |
| OPA5 migration            | `opa5`               | Consistent behavior with existing OPA5 tests |
| SAP compliance audits     | `opa5`               | Uses SAP's official interaction API          |
| Mixed control types       | `ui5-native`         | Broadest fallback chain                      |

## Strategy Factory

Praman selects the strategy at fixture initialization time based on the `interactionStrategy`
config value. The strategy factory creates the appropriate instance:

```typescript
// Internal — you don't call this directly
// The ui5 fixture reads config and creates the strategy:
const strategy = createStrategy(config.interactionStrategy);
// strategy is one of: UI5NativeStrategy | DomFirstStrategy | Opa5Strategy
```

Each strategy implements the same interface:

```typescript
interface InteractionStrategy {
  click(page: Page, controlId: string): Promise<void>;
  enterText(page: Page, controlId: string, text: string): Promise<void>;
  select(page: Page, controlId: string, value: string): Promise<void>;
}
```

## Fallback Chains

Every strategy has a built-in fallback chain. If the primary interaction method fails (throws or
times out), the strategy automatically tries the next method in the chain.

For example, `ui5-native` click:

```
firePress()
  ├── success → done
  └── fail → fireSelect()
               ├── success → done
               └── fail → fireTap()
                            ├── success → done
                            └── fail → DOM click
                                         ├── success → done
                                         └── fail → throw ControlError
```

This means your tests rarely need strategy-specific code. Choose a default strategy and let the
fallback chain handle edge cases.

## Retry Patterns with expect.poll() and toPass()

For assertions that depend on asynchronous UI5 state updates, use Playwright's built-in retry
mechanisms rather than manual loops.

### expect.poll()

Polls a function until the assertion passes. Best for reading values that update asynchronously:

```typescript
import { test, expect } from 'playwright-praman';

test('wait for status update', async ({ ui5 }) => {
  await ui5.click({ id: 'refreshBtn' });

  // Polls getText() until it returns 'Approved'
  await expect
    .poll(async () => ui5.getText({ id: 'statusField' }), {
      timeout: 10_000,
      intervals: [500, 1000, 2000],
    })
    .toBe('Approved');
});
```

### toPass()

Retries an entire assertion block. Best for multi-step checks:

```typescript
test('table loads with data', async ({ ui5 }) => {
  await expect(async () => {
    const count = await ui5.table.getRowCount('poTable');
    expect(count).toBeGreaterThan(0);

    const firstCell = await ui5.table.getCellValue('poTable', 0, 0);
    expect(firstCell).toBeTruthy();
  }).toPass({ timeout: 15_000, intervals: [1000, 2000, 5000] });
});
```

### When to Use Which

| Pattern         | Use Case                                         |
| --------------- | ------------------------------------------------ |
| `expect.poll()` | Single value that changes asynchronously         |
| `toPass()`      | Multiple assertions that must all pass together  |
| Neither         | Values already stable after `waitForUI5Stable()` |

In most cases, Praman's auto-stability wait means values are already settled by the time you
assert. Use `expect.poll()` and `toPass()` only for operations that trigger asynchronous
updates beyond UI5's stability detection (e.g., long-running batch jobs, WebSocket updates).

## Complete Example

```typescript
import { test, expect } from 'playwright-praman';

test('create and verify purchase order', async ({ ui5, ui5Navigation }) => {
  await ui5Navigation.navigateToApp('PurchaseOrder-create');

  // Fill form (ui5-native strategy fires proper change events)
  await ui5.fill({ id: 'vendorInput' }, '100001');
  await ui5.select({ id: 'purchOrgSelect' }, '1000');
  await ui5.fill({ id: 'materialInput' }, 'MAT-001');

  // Save
  await ui5.click({ id: 'saveBtn' });

  // Wait for async status update
  await expect
    .poll(async () => ui5.getText({ id: 'statusText' }), { timeout: 15_000 })
    .toBe('Created');
});
```
