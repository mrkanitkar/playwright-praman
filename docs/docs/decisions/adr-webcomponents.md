---
sidebar_position: 5
title: 'ADR: WebComponent Support'
---

# ADR: WebComponent Support (WC-EVAL)

| Property     | Value                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Decision** | Use Playwright `>>` shadow DOM combinator for piercing Shadow DOM, with `ui5wc=` selector prefix for future extension |
| **Status**   | DECIDED                                                                                                               |
| **Date**     | 2026-02-23                                                                                                            |

## Context

SAP UI5 Web Components (`@ui5/webcomponents`) use Shadow DOM for encapsulation. Unlike
classic UI5 controls (which render to the light DOM and are accessible via `sap.ui.getCore().byId()`),
Web Components hide their internal structure behind shadow roots. This makes standard CSS
selectors unable to reach internal elements.

Three approaches were evaluated for testing SAP UI5 Web Components:

| Option | Approach                                          | Playwright Support | Maintenance |
| ------ | ------------------------------------------------- | ------------------ | ----------- |
| (a)    | `element.shadowRoot.querySelector()` via evaluate | Native JS          | High        |
| (b)    | Custom engine via `selectors.register()`          | Playwright API     | Medium      |
| (c)    | Playwright `>>` shadow-piercing combinator        | Built-in           | Low         |

**Option (a)** uses `page.evaluate()` to manually traverse shadow roots. This is verbose,
does not compose with Playwright's auto-waiting and web-first assertions, and requires
manual chaining for deeply nested shadow DOMs (common in UI5 WC composite controls).

**Option (b)** registers a custom selector engine (e.g., `ui5wc=`) that knows how to
traverse UI5 Web Component shadow trees. While flexible, this requires maintaining a custom
engine that must stay synchronized with UI5 Web Component DOM structure changes across versions.

**Option (c)** uses Playwright's built-in `>>` combinator, which pierces shadow DOM boundaries.
For example, `page.locator('ui5-input >> input')` selects the inner `<input>` element inside
a `<ui5-input>` Web Component. This works with auto-waiting, web-first assertions, and
requires no custom code.

## Decision

Use Playwright's `>>` shadow DOM combinator as the primary mechanism for interacting with
SAP UI5 Web Components. Reserve the `ui5wc=` selector prefix as a namespace for future
custom selector engines if the `>>` combinator proves insufficient for advanced scenarios.

### Examples

```typescript
// Click a UI5 Web Component button
await page.locator('ui5-button >> [slot="default"]').click();

// Type into a UI5 Input's inner <input>
await page.locator('ui5-input >> input').fill('Purchase Order 4500012345');

// Select from a UI5 Select component
await page.locator('ui5-select').click();
await page.locator('ui5-option >> text=Approved').click();

// Deeply nested: Table row cell
await page.locator('ui5-table >> ui5-table-row >> ui5-table-cell >> span').first();
```

## Rationale

- **Built-in support**: The `>>` combinator is a stable, documented Playwright feature since v1.27
- **Auto-waiting**: Locators using `>>` inherit Playwright's auto-waiting behavior, eliminating
  manual `waitForSelector` calls
- **Web-first assertions**: `expect(locator).toHaveText()` and similar assertions work with
  shadow-piercing locators
- **No custom code**: Zero maintenance burden for shadow DOM traversal logic
- **Composable**: The `>>` combinator works with other selectors -- role, text, CSS, and test ID
- **Future-proof**: If `>>` proves insufficient, the `ui5wc=` prefix provides a clean namespace
  for a custom engine without breaking existing tests

## Consequences

### Positive

- Immediate support for UI5 Web Components with no Praman-specific implementation
- Tests read naturally and follow standard Playwright patterns
- No version coupling between Praman's selector engine and UI5 Web Component internals
- Works for any Web Component library, not just UI5 (future-proofs for mixed-technology apps)

### Negative

- The `>>` combinator requires knowledge of the Web Component's internal DOM structure, which
  may change between UI5 WC versions
- Complex interactions (e.g., opening a popover, selecting a date from a calendar) may require
  multiple locator steps rather than a single semantic action
- No built-in semantic awareness of UI5 WC control types (unlike classic UI5 bridge controls)

### Mitigations

- Provide a UI5 Web Component cheat sheet mapping common controls to their `>>` locator patterns
- Implement semantic helper functions for complex interactions (e.g., `selectDate(locator, date)`)
  as convenience utilities, not core framework features
- The `ui5wc=` prefix can be activated later if community demand justifies a custom engine
- Monitor UI5 Web Component releases for DOM structure changes in CI via snapshot tests
