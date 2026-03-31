---
title: Finding Controls with Locators
description: 'How to find UI5 controls using CSS-style and XPath selectors with page.locator("ui5=...").'
keywords:
  - playwright ui5 locator
  - sap ui5 css selector
  - find ui5 control by text
  - praman page locator
  - sap ui5 test automation
---

# Finding Controls with Locators

Praman registers a `ui5=` custom selector engine with Playwright. You can use it with
`page.locator()` to find UI5 controls using CSS-like syntax. No setup is needed — the engine
is registered automatically when you import from `playwright-praman`.

```typescript
import { test, expect } from 'playwright-praman';

test('quick start', async ({ page }) => {
  // Find a button by its text property and click it
  await page.locator("ui5=sap.m.Button[text='Save']").click();

  // Find an input by its associated label
  await page.locator('ui5=sap.m.Input:labeled("Vendor")').click();

  // Find a button by ID
  await page.locator('ui5=sap.m.Button#saveBtn').click();
});
```

:::tip Standard Playwright Locator
`page.locator('ui5=...')` returns a standard Playwright `Locator`. You can chain
`.click()`, `.fill()`, `.isVisible()`, use it with `expect()`, and combine it with
other Playwright locator methods like `.first()`, `.nth()`, or `.filter()`.
:::

## Common Tasks

### Find a control by property value

Use attribute syntax `[property='value']` to match a UI5 control property:

```typescript
// Button with text "Save"
page.locator("ui5=sap.m.Button[text='Save']");

// Input with a specific placeholder
page.locator("ui5=sap.m.Input[placeholder='Enter vendor']");

// Enabled button (string comparison)
page.locator("ui5=sap.m.Button[enabled='true']");
```

The property name maps to the UI5 control's `getProperty()` method. For example,
`[text='Save']` calls `control.getProperty('text')` and compares the result.

### Find a control by ID

Use the `#` syntax to match a control's ID:

```typescript
page.locator('ui5=sap.m.Button#saveBtn');

// ID without specifying type (matches any control type)
page.locator('ui5=*#saveBtn');
```

### Find a control by its label

The `:labeled()` pseudo-class finds controls associated with a `sap.m.Label`. It checks
two associations: the label's `labelFor` pointing to the control, and the control's
`ariaLabelledBy` association pointing to the label.

```typescript
// Find the input associated with a "Username" label
page.locator("ui5=sap.m.Input:labeled('Username')");

// Double quotes also work
page.locator('ui5=sap.m.Input:labeled("Email Address")');

// Combine with property matching
page.locator("ui5=sap.m.Input:labeled('Username')[required='true']");
```

### Find controls inside a container

Use combinators to scope your search within a parent control:

```typescript
// Any Button that is a descendant of a Panel (any depth)
page.locator('ui5=sap.m.Panel sap.m.Button');

// Button that is a direct child of a Panel
page.locator('ui5=sap.m.Panel > sap.m.Button');
```

### Find a control next to another control

Sibling combinators find controls that are siblings in the UI5 control tree:

```typescript
// The Input immediately after a Label
page.locator('ui5=sap.m.Label + sap.m.Input');

// Any Input that follows a Label (not necessarily immediately)
page.locator('ui5=sap.m.Label ~ sap.m.Input');

// Combine with properties
page.locator("ui5=sap.m.Label + sap.m.Input[required='true']");
```

### Find a control by position

Positional pseudo-classes select controls based on their position among siblings:

```typescript
// Third item in a list
page.locator('ui5=sap.m.StandardListItem:nth-child(3)');

// First child
page.locator('ui5=sap.m.Button:first-child');

// Last child
page.locator('ui5=sap.m.Button:last-child');

// Only child (no siblings)
page.locator('ui5=sap.m.Button:only-child');

// Odd-numbered children
page.locator('ui5=sap.m.StandardListItem:nth-child(2n+1)');

// Even-numbered children
page.locator('ui5=sap.m.StandardListItem:nth-child(2n)');

// First 3 children
page.locator('ui5=sap.m.StandardListItem:nth-child(-n+3)');
```

### Exclude controls

Use `:not()` to exclude controls that match a condition:

```typescript
// All controls except Buttons
page.locator('ui5=*:not(sap.m.Button)');

// Buttons that are not disabled
page.locator("ui5=sap.m.Button:not([enabled='false'])");

// Exclude multiple types
page.locator('ui5=*:not(sap.m.Button, sap.m.Link)');

// Exclude a subclass family
page.locator('ui5=*:not(sap.m.InputBase::subclass)');
```

### Match all subclasses of a type

The `::subclass` pseudo-element uses the UI5 `control.isA()` method to match any control
that extends the given type:

```typescript
// Matches sap.m.Input, sap.m.ComboBox, sap.m.DatePicker, etc.
page.locator('ui5=sap.m.InputBase::subclass');

// Combine with property matching
page.locator("ui5=sap.m.InputBase::subclass[enabled='true']");
```

### Find controls containing a descendant

The `:has()` pseudo-class selects controls that contain a matching descendant:

```typescript
// Panels that contain at least one Button
page.locator('ui5=sap.m.Panel:has(sap.m.Button)');
```

### Partial text matching

Use substring operators to match part of a property value:

```typescript
// Text starts with "Save"
page.locator("ui5=sap.m.Button[text^='Save']");

// Text ends with "Draft"
page.locator("ui5=sap.m.Button[text$='Draft']");

// Text contains "Order"
page.locator("ui5=sap.m.Button[text*='Order']");
```

### Match multiple control types

Use comma-separated selectors to match any of several types:

```typescript
// Buttons or Links
page.locator('ui5=sap.m.Button, sap.m.Link');

// Three types
page.locator('ui5=sap.m.Button, sap.m.Input, sap.m.Link');
```

### Check if a property is present (truthy)

Omit the operator and value to check if a property has a truthy value
(Effective Boolean Value — non-empty string, non-zero number, `true`):

```typescript
// Controls where "enabled" property is truthy
page.locator('ui5=sap.m.Button[enabled]');
```

This is different from `[enabled='true']` which does a string comparison.
`[enabled]` checks that the property exists and has a non-empty/non-false value.

## Choosing Between `ui5.control()` and `page.locator()`

Praman offers two ways to find controls. Use whichever fits your task:

**Use `ui5.control()` when you need:**

- View-scoped lookups (`viewName`, `viewId`)
- OData binding path matching (`bindingPath`)
- i18n text matching (`i18NText`)
- Typed control proxy with methods like `setValue()`, `getProperty()`
- Dialog-scoped search (`searchOpenDialogs`)
- Sub-control targeting (`interaction.idSuffix`)

**Use `page.locator('ui5=...')` when you need:**

- CSS-like selector syntax
- Structural queries (descendants, children, siblings)
- Label-based matching (`:labeled()`)
- Inheritance matching (`::subclass`)
- Positional selection (`:nth-child()`, `:first-child`)
- Standard Playwright `Locator` methods and chaining

Both work in the same test — mix and match as needed:

```typescript
test('mixed approach', async ({ ui5, page }) => {
  // Use ui5.control() for view-scoped lookup with typed proxy
  const input = await ui5.control({
    controlType: 'sap.m.Input',
    viewName: 'myApp.view.Detail',
    properties: { placeholder: 'Vendor' },
  });
  await input.setValue('100001');

  // Use page.locator() for structural query
  await page.locator('ui5=sap.m.Panel > sap.m.Button:first-child').click();
});
```

## CSS Selector Reference

### Type and ID

| Selector               | What it matches               |
| ---------------------- | ----------------------------- |
| `sap.m.Button`         | All `sap.m.Button` controls   |
| `sap.m.Button#saveBtn` | Button with ID `saveBtn`      |
| `*`                    | Any control type              |
| `*#saveBtn`            | Any control with ID `saveBtn` |

### Property Operators

| Operator | Selector            | Meaning                                      |
| -------- | ------------------- | -------------------------------------------- |
| `=`      | `[text='Save']`     | Exact string match                           |
| `^=`     | `[text^='Save']`    | Starts with                                  |
| `$=`     | `[text$='Draft']`   | Ends with                                    |
| `*=`     | `[text*='Order']`   | Contains substring                           |
| `~=`     | `[class~='active']` | Word in whitespace-separated list            |
| `\|=`    | `[lang\|='en']`     | Exact match or dash-prefix match             |
| _(none)_ | `[enabled]`         | Property is truthy (Effective Boolean Value) |

### Combinators

| Syntax    | Selector         | Meaning                                         |
| --------- | ---------------- | ----------------------------------------------- |
| _(space)_ | `Panel Button`   | Button is a descendant of Panel (any depth)     |
| `>`       | `Panel > Button` | Button is a direct child of Panel               |
| `+`       | `Label + Input`  | Input immediately follows Label as a sibling    |
| `~`       | `Label ~ Input`  | Input follows Label as a sibling (any distance) |

### Pseudo-Classes

| Pseudo-class       | Example                   | What it does                              |
| ------------------ | ------------------------- | ----------------------------------------- |
| `:labeled('text')` | `Input:labeled('Vendor')` | Control has a label with matching text    |
| `:has(selector)`   | `Panel:has(Button)`       | Control contains a matching descendant    |
| `:not(selector)`   | `*:not(Button)`           | Control does NOT match the inner selector |
| `:first-child`     | `Button:first-child`      | First child among siblings                |
| `:last-child`      | `Button:last-child`       | Last child among siblings                 |
| `:only-child`      | `Button:only-child`       | Only child (no siblings)                  |
| `:nth-child(An+B)` | `Item:nth-child(3)`       | Matches by position formula               |

### Pseudo-Element

| Pseudo-element | Example               | What it does                                            |
| -------------- | --------------------- | ------------------------------------------------------- |
| `::subclass`   | `InputBase::subclass` | Matches any control that extends the type (via `isA()`) |

### Union (Comma-Separated)

```typescript
// Matches either type
page.locator('ui5=sap.m.Button, sap.m.Link');
```

## XPath Selectors

If a selector starts with `/`, `//`, or `.`, the engine treats it as XPath and passes it
directly to the XPath evaluator instead of parsing it as CSS.

```typescript
// Absolute XPath
page.locator("ui5=//sap.m.Button[ui5:property(.,'text')='Save']");

// Relative XPath (when scoped to a sub-root)
page.locator("ui5=.//sap.m.Input[ui5:property(.,'value')='Hello']");
```

### Custom XPath Functions

Four custom functions are available in the `ui5:` namespace:

| Function                           | Returns        | What it does                                              |
| ---------------------------------- | -------------- | --------------------------------------------------------- |
| `ui5:property(element, 'name')`    | Property value | Reads a UI5 control property via `getProperty()`          |
| `ui5:subclass-of(element, 'type')` | Boolean        | Checks `control.isA(type)` via the metadata chain         |
| `ui5:labeled-by(element, 'text')`  | Boolean        | Checks `labelFor` and `ariaLabelledBy` associations       |
| `ui5:debug-xml(element)`           | _(throws)_     | Throws an error showing the element's XML — for debugging |

**Examples:**

```typescript
// Find button by text property
page.locator("ui5=//sap.m.Button[ui5:property(.,'text')='Save']");

// Find any InputBase subclass
page.locator("ui5=//*[ui5:subclass-of(.,'sap.m.InputBase')]");

// Find input by label association
page.locator("ui5=//sap.m.Input[ui5:labeled-by(.,'Vendor')]");

// Use string() for comparison operators
page.locator("ui5=//sap.m.Button[starts-with(string(ui5:property(.,'text')),'Save')]");
```

:::caution ui5:property() returns a sequence
`ui5:property()` returns the raw value as an XPath sequence. For string comparisons
(`=`, `starts-with`, `contains`, `ends-with`), wrap it in `string()`:
`string(ui5:property(.,'text'))='Save'`.
Without `string()`, the comparison uses XPath's Effective Boolean Value rules, which
may produce unexpected results for non-string properties.
:::

## Troubleshooting

### "No controls found"

The engine queries the UI5 control registry, not the DOM. If UI5 hasn't finished loading,
the registry is empty. Ensure the page has loaded before using `ui5=` locators:

```typescript
// Wait for UI5 to be ready before querying
await page.waitForFunction(
  () => typeof (globalThis as any).sap?.ui?.core?.Element?.registry?.all === 'function',
);
await page.locator("ui5=sap.m.Button[text='Save']").click();
```

If you're using the `ui5` fixture, it handles stability waits automatically.

### Syntax errors

CSS parse errors surface as `ParserError` and XPath syntax errors as `XPST` errors.
Common causes:

- Missing quotes around values with spaces: `[text=Save Draft]` → `[text='Save Draft']`
- Unknown pseudo-class: the engine rejects any pseudo-class not listed above
- Unknown pseudo-element: only `::subclass` is supported

### Debugging with `ui5:debug-xml()`

To see what the engine's XML tree looks like for a specific control, use `ui5:debug-xml()`
in an XPath selector. It throws an error that shows the element's XML representation:

```typescript
// This will throw — use it in DevTools or to inspect the tree
page.locator('ui5=//sap.m.Button[ui5:debug-xml(.)]');
```

### Control exists but doesn't match

- **Wrong type name**: UI5 type names are case-sensitive and fully qualified.
  `sap.m.button` won't match — use `sap.m.Button`.
- **Inheritance**: `sap.m.Input` won't match a `sap.m.ComboBox`. Use `::subclass`:
  `sap.m.InputBase::subclass` matches all input types.
- **Property name casing**: Property names must match the UI5 API exactly.
  `[Text='Save']` won't work if the property is `text` (lowercase).

<details>
<summary>How it works internally</summary>

The engine runs a 5-phase pipeline inside the browser:

1. **Detection** — Determines if the selector is XPath (starts with `/` or `.`) or CSS.
2. **CSS → XPath** — Parses CSS via `css-selector-parser`, converts the AST to XPath.
3. **Tree building** — Walks the DOM, finds elements with `data-sap-ui` attributes, looks up
   each control in `sap.ui.core.Element.registry`, and builds an in-memory XML document where
   each control is an element named after its type (e.g., `<sap.m.Button id="btn1">`).
   Controls in the registry but not in the DOM (like dialog controls) are appended as orphans.
4. **XPath evaluation** — Evaluates the XPath against the XML document using `fontoxpath`,
   with 4 custom functions registered in the `urn:praman:ui5` namespace.
5. **Resolution** — Maps matching XML elements back to their HTML DOM elements via
   `control.getDomRef()`, scoped to the query root.

The engine is bundled by esbuild as a self-contained browser script and injected via
Playwright's `selectors.register('ui5', { content })` API as a worker-scoped auto-fixture.

</details>
