# P4-023: Stack Trace Filtering Verification

## What Playwright Does Natively

Playwright has **three layers** of automatic stack trace filtering:

1. **`node_modules` filtering** (`parseErrorStack` in `stackTrace.js`): The `belongsToNodeModules()` function skips any frame whose path contains `/node_modules/`. Since praman is consumed as `playwright-praman` from `node_modules`, **all praman frames are automatically excluded** from error location reporting.

2. **`boxedStackPrefixes` filtering** (`captureLibraryStackTrace` in `clientStackTrace.js`): Playwright registers its own `playwright-core/` and `@playwright/test/` directories as prefixes. Frames from these paths are stripped from user-visible stacks. Third-party libraries in `node_modules` are already handled by layer 1.

3. **`{ box: true }` on `test.step()`**: When a step is boxed, errors thrown inside it point to the **call site** of the step, not the internals. Praman already uses this in both `ui5Step` decorator and `withStep()` helper (`src/core/utils/step-decorator.ts` lines 98 and 126).

## Praman's Current State

- **`{ box: true }`**: Already applied to all `test.step()` calls via the `@ui5Step` decorator and `withStep()` function. Errors in handler methods (click, fill, etc.) point to the user's test code, not praman internals.
- **Fixture definitions**: Praman's fixtures in `core-fixtures.ts` do NOT use `box: true` on fixture options. However, this is a **cosmetic choice** -- adding `box: true` to fixtures like `ui5`, `pramanConfig`, etc. would hide their setup steps from trace viewer and reports. This is optional and low priority.
- **No custom stack manipulation**: Praman does not do any manual `Error.stack` rewriting or filtering. The `PramanError` base class stores `this.stack` but does not modify it.

## Conclusion: VERIFIED (no action needed)

Playwright's built-in `node_modules` filtering + praman's existing `{ box: true }` on all `test.step()` calls already ensure that praman's internal frames are hidden from users in error stacks, HTML reports, and trace viewer. No additional work is required.

**Optional enhancement** (not blocking): Add `box: true` to worker-scoped fixture definitions in `core-fixtures.ts` to hide setup noise from trace viewer. This is purely cosmetic.
