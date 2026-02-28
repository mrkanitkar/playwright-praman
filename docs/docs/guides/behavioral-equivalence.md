---
sidebar_position: 48
title: Behavioral Equivalence
---

# Behavioral Equivalence (BEHAV-EQ)

Praman v1.0 is a ground-up rewrite. Behavioral equivalence testing ensures it produces the
same observable results as the reference implementation (wdi5) for core SAP UI5 operations,
while documenting intentional divergences.

## Golden Master Methodology

Golden master testing (also called characterization testing or approval testing) captures the
output of the reference implementation and compares it against the new implementation.

```
┌──────────────────────┐    ┌──────────────────────┐
│  wdi5 (reference)    │    │  Praman (new)         │
│                      │    │                       │
│  Run scenario S      │    │  Run scenario S       │
│  Capture output O_r  │    │  Capture output O_n   │
│                      │    │                       │
└──────────┬───────────┘    └──────────┬────────────┘
           │                           │
           ▼                           ▼
      ┌─────────────────────────────────────┐
      │  Compare O_r vs O_n                 │
      │  ● Match → behavioral equivalence   │
      │  ● Diff → classify as bug or        │
      │           intentional divergence     │
      └─────────────────────────────────────┘
```

### What Is Compared

For each scenario, the comparison covers:

| Aspect               | How Compared                                           |
| -------------------- | ------------------------------------------------------ |
| Control discovery    | Same control found (by ID, type, properties)           |
| Property values      | `getValue()`, `getText()`, `getProperty()` match       |
| Event side effects   | Same UI5 events fired (liveChange, change, press)      |
| OData model state    | Same model data after interaction                      |
| Error behavior       | Same error for invalid selectors / missing controls    |
| Timing (qualitative) | Both complete within reasonable time (not exact match) |

### What Is NOT Compared

- Exact timing (Praman may be faster or slower)
- Internal implementation details (how the bridge communicates)
- Log output format (Praman uses pino structured logging, wdi5 uses console)
- Error message text (Praman uses structured errors with codes, wdi5 uses plain strings)

## The 8 Parity Scenarios

These scenarios cover the core operations that most SAP UI5 test suites rely on.

### Scenario 1: Control Discovery by ID

Find a control using its stable ID.

```typescript
// wdi5 reference
const control = await browser.asControl({ selector: { id: 'container-app---main--saveBtn' } });

// Praman equivalent
const control = await ui5.control({ id: 'saveBtn' });
```

**Comparison**: Both return a proxy wrapping the same DOM element. Verified by comparing
`control.getId()` output.

**Known divergence**: Praman accepts short IDs (`saveBtn`) and resolves the full ID
internally. wdi5 requires the full generated ID including view prefix. This is an intentional
improvement.

### Scenario 2: Control Discovery by Type + Properties

Find a control using its UI5 type and property values.

```typescript
// wdi5 reference
const input = await browser.asControl({
  selector: {
    controlType: 'sap.m.Input',
    properties: { placeholder: 'Enter vendor' },
    viewName: 'myApp.view.Main',
  },
});

// Praman equivalent
const input = await ui5.control({
  controlType: 'sap.m.Input',
  properties: { placeholder: 'Enter vendor' },
  viewName: 'myApp.view.Main',
});
```

**Comparison**: Both discover the same control. Verified by comparing `getId()` and
`getMetadata().getName()`.

**Known divergence**: None -- selectors are semantically identical.

### Scenario 3: Property Read (getValue, getText)

Read a property from a discovered control.

```typescript
// wdi5 reference
const value = await input.getValue();
const text = await button.getText();

// Praman equivalent
const value = await input.getValue();
const text = await button.getText();
```

**Comparison**: Return values are strictly equal (`===`). Tested with string, number, boolean,
and null properties.

**Known divergence**: None -- both call the same UI5 control API methods.

### Scenario 4: Input Fill (enterText + Events)

Fill a value into an input control with proper event firing.

```typescript
// wdi5 reference
await input.enterText('100001');

// Praman equivalent
await ui5.fill({ id: 'vendorInput' }, '100001');
```

**Comparison**: After filling, both produce the same:

- `getValue()` returns `'100001'`
- `liveChange` event was fired (verified by model binding update)
- `change` event was fired (verified by validation trigger)

**Known divergence**: Praman fires events in the order `liveChange` then `change`, matching
SAP's documented event sequence. wdi5's event ordering depends on the WebDriverIO interaction
mode. This is an intentional alignment with SAP documentation.

### Scenario 5: Button Press (firePress / click)

Trigger a press action on a button control.

```typescript
// wdi5 reference
await button.press();

// Praman equivalent
await ui5.press({ id: 'submitBtn' });
```

**Comparison**: Both trigger the button's `press` event, which fires any attached handlers.
Verified by checking the UI state change caused by the handler (e.g., dialog opens, navigation
occurs).

**Known divergence**: Praman uses a three-tier strategy (UI5 firePress -> fireTap -> DOM
click). wdi5 uses WebDriverIO's click action. Both produce the same observable outcome, but
through different mechanisms. If `firePress` is not available on a control, Praman falls back
to DOM click; wdi5 always uses DOM click.

### Scenario 6: Table Row Count and Cell Text

Read table dimensions and cell contents.

```typescript
// wdi5 reference
const rows = await table.getAggregation('items');
const cellText = await rows[0].getCells()[2].getText();

// Praman equivalent
await expect(table).toHaveUI5RowCount(5);
await expect(table).toHaveUI5CellText(0, 2, 'Expected Value');
```

**Comparison**: Same row count and cell text values.

**Known divergence**: Praman provides dedicated matchers (`toHaveUI5RowCount`,
`toHaveUI5CellText`) that are more ergonomic than manual aggregation traversal. The underlying
data is identical, but the API surface differs intentionally for readability.

### Scenario 7: Select Dropdown Item

Select an item in a `sap.m.Select` or `sap.m.ComboBox`.

```typescript
// wdi5 reference
await select.open();
const items = await select.getAggregation('items');
await items[2].press();

// Praman equivalent
await ui5.select({ id: 'countrySelect' }, 'US');
```

**Comparison**: After selection, `getSelectedKey()` returns the same value in both.

**Known divergence**: Praman accepts the key or display text directly, without requiring
manual open/press steps. This is an intentional API simplification. The underlying
`setSelectedKey()` / `fireChange()` calls are equivalent.

### Scenario 8: Error on Missing Control

Attempt to find a control that does not exist.

```typescript
// wdi5 reference
const control = await browser.asControl({
  selector: { id: 'nonExistentControl' },
});
// wdi5: returns a falsy value or throws after timeout

// Praman equivalent
const control = await ui5.control({ id: 'nonExistentControl' });
// Praman: throws ControlError with code ERR_CONTROL_NOT_FOUND
```

**Comparison**: Both fail to find the control within the configured timeout.

**Known divergence (intentional)**: Praman throws a structured `ControlError` with error code
`ERR_CONTROL_NOT_FOUND`, `retryable: true`, and `suggestions[]` array. wdi5 returns a falsy
proxy or throws a generic error. Praman's structured errors are an intentional improvement
for debuggability.

## Running Parity Tests

Parity tests live in a dedicated directory and run both implementations against the same SAP
system.

```
tests/
  parity/
    scenarios/
      01-discovery-by-id.ts
      02-discovery-by-type.ts
      03-property-read.ts
      04-input-fill.ts
      05-button-press.ts
      06-table-operations.ts
      07-select-dropdown.ts
      08-missing-control.ts
    golden-masters/
      01-discovery-by-id.json
      02-discovery-by-type.json
      ...
    compare.ts
```

### Generating Golden Masters (wdi5)

```typescript
// tests/parity/generate-golden-master.ts
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface GoldenMaster {
  scenario: string;
  timestamp: string;
  results: Record<string, unknown>;
}

function saveGoldenMaster(scenario: string, results: Record<string, unknown>): void {
  const master: GoldenMaster = {
    scenario,
    timestamp: new Date().toISOString(),
    results,
  };

  writeFileSync(
    join(__dirname, 'golden-masters', `${scenario}.json`),
    JSON.stringify(master, null, 2),
  );
}

// Example: capture discovery result
const control = await browser.asControl({
  selector: { id: 'container-app---main--saveBtn' },
});

saveGoldenMaster('01-discovery-by-id', {
  controlId: await control.getId(),
  controlType: await control.getMetadata().getName(),
  text: await control.getText(),
  enabled: await control.getEnabled(),
});
```

### Comparing Against Golden Masters (Praman)

```typescript
// tests/parity/scenarios/01-discovery-by-id.ts
import { test, expect } from 'playwright-praman';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface GoldenMaster {
  scenario: string;
  results: {
    controlId: string;
    controlType: string;
    text: string;
    enabled: boolean;
  };
}

test('parity: discovery by ID matches golden master', async ({ ui5 }) => {
  const golden: GoldenMaster = JSON.parse(
    readFileSync(join(__dirname, '../golden-masters/01-discovery-by-id.json'), 'utf-8'),
  );

  const control = await ui5.control({ id: 'saveBtn' });

  await test.step('control type matches', async () => {
    const controlType = await control.getMetadata().getName();
    expect(controlType).toBe(golden.results.controlType);
  });

  await test.step('text matches', async () => {
    const text = await control.getText();
    expect(text).toBe(golden.results.text);
  });

  await test.step('enabled state matches', async () => {
    const enabled = await control.getEnabled();
    expect(enabled).toBe(golden.results.enabled);
  });

  // controlId may differ in prefix -- check suffix only (intentional divergence)
  await test.step('control ID resolves to same element', async () => {
    const id = await control.getId();
    expect(id).toContain('saveBtn');
  });
});
```

## Divergence Classification

Every difference between Praman and wdi5 output must be classified:

| Classification              | Action Required                                 |
| --------------------------- | ----------------------------------------------- |
| **Bug**                     | Fix in Praman to match wdi5 behavior            |
| **Intentional improvement** | Document in this page with rationale            |
| **Behavioral equivalent**   | Same observable outcome via different mechanism |

### Documented Intentional Divergences

| Scenario            | Praman Behavior                          | wdi5 Behavior                     | Rationale                           |
| ------------------- | ---------------------------------------- | --------------------------------- | ----------------------------------- |
| Short ID resolution | Accepts `saveBtn`, resolves full ID      | Requires full generated ID        | Better DX, less brittle             |
| Event ordering      | `liveChange` then `change` (SAP spec)    | Varies by interaction mode        | Aligns with SAP documentation       |
| Press mechanism     | Three-tier: firePress -> fireTap -> DOM  | DOM click via WebDriverIO         | More reliable for UI5 controls      |
| Error structure     | `ControlError` with code + suggestions   | Generic error or falsy return     | Better debuggability                |
| Table assertions    | Dedicated matchers (`toHaveUI5RowCount`) | Manual aggregation traversal      | Ergonomic API for common operations |
| Select API          | `ui5.select(selector, value)` one-liner  | Manual open -> find item -> press | Simplified API, same result         |

### How to Add a New Divergence

When a parity test reveals a difference:

1. Determine if it is a **bug** or **intentional divergence**
2. If intentional, add a row to the divergence table above with rationale
3. If a bug, file an issue and fix Praman to match wdi5's observable behavior
4. Update the golden master if wdi5's behavior was also wrong (rare -- wdi5 is the reference)

## Running the Full Parity Suite

```bash
# Generate golden masters (requires wdi5 + WebDriverIO setup)
npx wdio run wdio.conf.ts --spec tests/parity/generate-golden-master.ts

# Run Praman parity tests against golden masters
npx playwright test tests/parity/scenarios/

# Compare results
npx tsx tests/parity/compare.ts
```

The compare script exits with a non-zero code if any undocumented divergence is found.
Documented divergences (listed in `divergences.json`) are excluded from the comparison.
