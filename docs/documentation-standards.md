# Praman Documentation Standards

> **Version**: 1.0
> **Standard**: Microsoft TSDoc (TypeScript Documentation Standard)
> **Purpose**: AI-First API Documentation for Playwright + SAP UI5
> **Note**: This project uses TSDoc exclusively, not JSDoc

---

## Overview

This guide defines documentation standards for the Praman project using **Microsoft TSDoc**, the official TypeScript documentation standard. Our documentation serves **three audiences**:

1. **AI Agents** — LLMs using the API via natural language
2. **Human Developers** — Test authors using Playwright + TypeScript
3. **API Consumers** — Libraries integrating Praman

### Guiding Principles

- **AI-First**: Every function must be usable by an AI agent without additional context
- **Example-Driven**: Show, don't just tell
- **Guarantee-Based**: State what the function promises to do
- **Failure-Aware**: Document what can go wrong and why

---

## Required Documentation Elements

### 1. Description (Required)

**Rule**: Every public API must have a complete sentence description.

```typescript
/**
 * Locate a UI5 control using RecordReplay selector syntax.
 *
 * @remarks
 * This method uses SAP's RecordReplay API for stable, CSS-independent selection.
 * Controls are cached for performance but can be force-reloaded.
 */
```

**Standards**:

- Start with capital letter
- End with period
- Complete sentence, not fragment
- First sentence = summary (appears in intellisense)
- Additional context in `@remarks`

---

### 2. Examples (Required for Public APIs)

**Rule**: All public functions must include at least one working example.

````typescript
/**
 * Locate a UI5 control by ID.
 *
 * @example Basic usage
 * ```typescript
 * const button = await ui5.control({ id: 'submitButton' });
 * await button.press();
 * ```
 *
 * @example With view context
 * ```typescript
 * const input = await ui5.control({
 *   id: 'nameInput',
 *   viewName: 'sap.ui.demo.app.view.Main'
 * });
 * ```
 */
````

**Standards**:

- Runnable code (copy-paste works)
- Show imports if non-obvious
- Include expected behavior/output
- Multiple examples for complex APIs

---

### 3. Intent (Required for Domain Methods)

**Tag**: `@intent`
**Purpose**: Describe the business/test goal this method achieves.

````typescript
/**
 * Create a purchase order in SAP MM module.
 *
 * @intent
 * Enables test scenarios requiring procurement documents:
 * - End-to-end purchase order creation
 * - Testing approval workflows
 * - Verifying vendor master data
 * - Testing goods receipt against PO
 *
 * @example
 * ```typescript
 * test('create PO for vendor', async ({ procurementAPI }) => {
 *   await procurementAPI.createPurchaseOrder({
 *     vendor: 'V001',
 *     material: 'MAT-12345',
 *     quantity: 100
 *   });
 * });
 * ```
 */
````

**When to use**:

- High-level domain methods (Intent API)
- Business process functions
- Multi-step workflows

---

### 4. Guarantee (Required for Public APIs)

**Tag**: `@guarantee`
**Purpose**: State what the function **promises** to do.

```typescript
/**
 * Wait for UI5 framework to be fully loaded.
 *
 * @guarantee
 * - UI5 core is initialized
 * - All preloaded libraries are loaded
 * - No pending rendering tasks
 * - OData models (if configured) are loaded
 *
 * @failureMode Timeout if UI5 never initializes (default: 30s)
 * @failureMode Throws if not a UI5 page
 */
```

**Standards**:

- Use bullet points
- Be specific, not vague
- State observable outcomes
- Avoid "should" or "may" — promise or don't claim

---

### 5. Failure Modes (Required for Public APIs)

**Tag**: `@failureMode`
**Purpose**: Document known failure scenarios.

```typescript
/**
 * @failureMode Control not found — Selector doesn't match any UI5 control
 * @failureMode Stale element — Control was removed after retrieval
 * @failureMode UI5 not loaded — Called before UI5 initialization complete
 * @failureMode Invalid selector — Selector syntax error
 */
```

**Standards**:

- One tag per failure mode
- Format: `Condition — Explanation`
- Include workarounds if available
- Link to related errors

---

### 6. Parameters (Required for All)

**Tags**: `@param`, `@returns`, `@throws`

```typescript
/**
 * Locate UI5 control by selector.
 *
 * @param selector - UI5 RecordReplay selector object
 * @param options - Optional control location settings
 * @param options.forceSelect - Skip cache, re-fetch control
 * @param options.timeout - Max wait time in milliseconds
 *
 * @returns Promise resolving to WDI5Control proxy object
 *
 * @throws {ControlNotFoundError} If selector matches no controls
 * @throws {TimeoutError} If control not found within timeout
 */
```

**Standards**:

- Describe purpose, not just type
- Document object properties
- Use `@throws` for expected errors
- Prefer descriptive names over abbreviations

---

## AI-Specific Tags

### @aiContext

**Purpose**: Provide context for AI interpretation.

```typescript
/**
 * @aiContext
 * This method operates on SAP UI5 controls, not standard HTML elements.
 * UI5 controls are JavaScript objects with methods like `press()`, `getText()`.
 * Do not confuse with Playwright's native `locator()` API.
 */
```

### @aiHint

**Purpose**: Guide AI agents on usage patterns.

```typescript
/**
 * @aiHint Use this for standard buttons, links, and clickable items
 * @aiHint For custom controls, check control type first
 * @aiHint Always await async operations
 */
```

### @aiRequired / @aiOptional

**Purpose**: Mark parameters as required/optional for AI understanding.

```typescript
/**
 * @param vendor - Vendor code
 * @aiRequired vendor must be a valid SAP vendor master record
 *
 * @param paymentTerms - Payment terms code
 * @aiOptional Defaults to vendor master data if omitted
 */
```

---

## SAP/UI5 Specific Tags

### @sapModule

```typescript
/**
 * @sapModule MM (Materials Management)
 */
```

### @businessContext

```typescript
/**
 * @businessContext
 * Purchase orders represent formal procurement documents in SAP.
 * They are legally binding and trigger goods movement and invoice verification.
 */
```

### @ui5Version

```typescript
/**
 * @ui5Version >= 1.84 (requires RecordReplay API)
 */
```

### @fioriElement

```typescript
/**
 * @fioriElement ListReport
 */
```

---

## Testing-Specific Tags

### @prerequisite

```typescript
/**
 * @prerequisite User must be logged into SAP Fiori Launchpad
 * @prerequisite Vendor V001 must exist in system
 */
```

### @postcondition

```typescript
/**
 * @postcondition Purchase order created in SAP MM module
 * @postcondition PO number returned for verification
 */
```

### @alternative

```typescript
/**
 * @alternative For simpler cases, use `quickCreatePO()`
 * @alternative For headless creation, use OData API directly
 */
```

---

## Complete Example

````typescript
/**
 * Create a purchase order in the SAP MM module via Fiori UI.
 *
 * This method navigates through the Create PO app, fills all required fields,
 * and saves the document. It returns the generated PO number for verification.
 *
 * @remarks
 * This is a high-level intent method that abstracts the multi-step UI interaction.
 * For more control, use the low-level `ui5.control()` API directly.
 *
 * @intent
 * Enables procurement test scenarios:
 * - End-to-end purchase order creation
 * - Testing approval workflows
 * - Verifying vendor master data integration
 * - Testing goods receipt against PO
 *
 * @guarantee
 * - Navigates to Create PO app
 * - Fills all mandatory fields
 * - Saves the purchase order
 * - Returns valid PO number
 * - PO is in "Draft" or "Approved" status
 *
 * @param data - Purchase order creation data
 * @param data.vendor - SAP vendor code (e.g., "V001")
 * @param data.material - Material number
 * @param data.quantity - Order quantity
 * @param data.plant - Plant code (optional, defaults to user default)
 * @param data.deliveryDate - Requested delivery date (optional)
 *
 * @returns Promise resolving to created PO number (e.g., "4500012345")
 *
 * @throws {AuthenticationError} If user not logged in
 * @throws {MasterDataError} If vendor or material doesn't exist
 * @throws {ValidationError} If quantity is invalid
 * @throws {TimeoutError} If UI takes too long to respond
 *
 * @failureMode Not authorized — User lacks MM_PO_CREATE authorization
 * @failureMode Vendor blocked — Vendor is blocked for purchasing
 * @failureMode Invalid quantity — Quantity exceeds material limits
 * @failureMode Network error — OData service unavailable
 *
 * @prerequisite User logged into SAP Fiori Launchpad
 * @prerequisite User has MM_PO_CREATE authorization
 * @prerequisite Vendor master data exists and is active
 * @prerequisite Material master data exists
 *
 * @postcondition Purchase order created in SAP database
 * @postcondition PO number assigned and returned
 * @postcondition PO visible in "Manage Purchase Orders" app
 *
 * @alternative For simpler cases without validation, use `quickCreatePO()`
 * @alternative For headless creation, use OData API via `odata.create()`
 *
 * @sapModule MM (Materials Management)
 * @businessContext Purchase orders are legally binding procurement documents
 * @ui5Version >= 1.84
 * @fioriElement ObjectPage
 *
 * @aiContext
 * This method represents a high-level business process, not a low-level UI interaction.
 * It encapsulates multiple UI steps into a single intent-based call.
 *
 * @aiHint Always provide vendor and material — these are mandatory
 * @aiHint Use actual SAP master data codes, not placeholders
 * @aiHint Await the result to get the PO number for later verification
 *
 * @category MM
 * @public
 * @async
 *
 * @example Basic usage
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('create purchase order', async ({ procurementAPI }) => {
 *   const poNumber = await procurementAPI.createPurchaseOrder({
 *     vendor: 'V001',
 *     material: 'MAT-12345',
 *     quantity: 100
 *   });
 *
 *   expect(poNumber).toMatch(/^\d{10}$/);
 * });
 * ```
 *
 * @example With optional fields
 * ```typescript
 * const poNumber = await procurementAPI.createPurchaseOrder({
 *   vendor: 'V001',
 *   material: 'MAT-12345',
 *   quantity: 100,
 *   plant: 'P001',
 *   deliveryDate: new Date('2026-03-01')
 * });
 * ```
 *
 * @example With error handling
 * ```typescript
 * try {
 *   const poNumber = await procurementAPI.createPurchaseOrder({
 *     vendor: 'V999', // Non-existent vendor
 *     material: 'MAT-12345',
 *     quantity: 100
 *   });
 * } catch (error) {
 *   if (error instanceof MasterDataError) {
 *     console.log('Vendor does not exist');
 *   }
 * }
 * ```
 */
export async function createPurchaseOrder(data: PurchaseOrderData): Promise<string> {
  // Implementation
}
````

---

## Enforcement

### ESLint Rules

- `tsdoc/syntax` — Microsoft TSDoc syntax validation (error)
- `jsdoc/require-description` — All public APIs (error)
- `jsdoc/require-example` — All public functions (error)
- `jsdoc/require-param-description` — All parameters (error)
- `jsdoc/require-returns-description` — All return values (error)
- `jsdoc/check-tag-names` — Validate custom tags (error)

### TypeDoc Validation

- `notDocumented: true` — Fail build if undocumented
- `treatWarningsAsErrors: true` — No warnings allowed
- `invalidLink: true` — All `@link` tags must resolve

### Pre-commit Hooks

```bash
npm run lint        # ESLint validation
npm run docs:api    # TypeDoc generation
```

---

## Tools

### Generate Capabilities

```bash
npm run generate:capabilities
```

Generates `docs/capabilities.md` from TSDoc comments.

### Validate Documentation

```bash
npm run docs:api           # Generate TypeDoc
npm run lint               # Validate TSDoc syntax
npm run typecheck          # Validate TypeScript
```

---

## References

- [Microsoft TSDoc](https://tsdoc.org/)
- [Google Developer Documentation Style Guide](https://developers.google.com/style)
- [Playwright Documentation Patterns](https://playwright.dev/docs/api/class-playwright)
- [SAP UI5 SDK Documentation](https://ui5.sap.com/)
- [TypeDoc Custom Tags](https://typedoc.org/guides/tags/)

---

## Questions?

Slack: `#praman-dev`
GitHub Discussions: [playwright-praman/discussions](https://github.com/mrkanitkar/playwright-praman/discussions)
