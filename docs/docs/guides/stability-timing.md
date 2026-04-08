---
title: Stability & Timing
description: How Praman manages UI5 stability waits with a 3-tier strategy so your tests never need page.waitForTimeout().
keywords:
  - sap ui5 stability wait
  - playwright waitForTimeout alternative
  - praman wait strategy
  - ui5 pending operations
---

# Stability & Timing

Praman uses a 3-tier wait strategy so your tests never need `page.waitForTimeout()`.

## Tier 1: waitForUI5Stable (default)

Polls `sap.ui.getCore().getUIPending() === 0` at a configurable interval
(default 100ms). This waits until all pending UI5 async operations (XHR
requests, Promises, setTimeout callbacks tracked by UI5) have completed.

Used automatically after every UI5 interaction (button press, input fill, etc.)
unless you set `skipStabilityWait: true` in config.

```typescript
// Explicit call (rarely needed — fixtures call this automatically)
await ui5.waitForUI5();
```

**Default timeout**: 15,000ms (`DEFAULT_TIMEOUTS.UI5_WAIT`), overridden by the
`ui5WaitTimeout` config option.

## Tier 2: briefDOMSettle

A short DOM-level settle using `page.evaluate(() => new Promise(r => setTimeout(r, ms)))`.
This runs a `setTimeout` inside the browser context — it is **not**
`page.waitForTimeout()` (which is banned per Principle 8).

Used after non-UI5 DOM operations and as the fallback when `skipStabilityWait`
is enabled.

**Default duration**: 500ms (`DEFAULT_TIMEOUTS.DOM_SETTLE`).

## Tier 3: waitForUI5Bootstrap

Detects whether the UI5 framework has loaded at all by polling for
`window.sap?.ui?.getCore` existence. Used during bridge injection to confirm
UI5 is available before injecting the Praman bridge scripts.

**Default timeout**: 60,000ms (`DEFAULT_TIMEOUTS.UI5_BOOTSTRAP`) to accommodate
slow first-load scenarios on SAP BTP.

## When Each Tier Runs

| Tier | Triggered by                                | Default timeout / duration  |
| ---- | ------------------------------------------- | --------------------------- |
| 1    | Any `ui5.*` method call                     | 15,000ms (`ui5WaitTimeout`) |
| 2    | Bridge injection, `skipStabilityWait: true` | 500ms                       |
| 3    | First bridge injection per page             | 60,000ms                    |

You rarely need to call these directly — Praman manages timing automatically.

## skipStabilityWait

When `skipStabilityWait` is `true`, Tier 1 (`waitForUI5Stable`) is replaced
by Tier 2 (`briefDOMSettle`). This is useful for:

- Pages that never reach `getUIPending() === 0` due to background polling
- Performance-sensitive scenarios where full stability is not required
- Non-UI5 pages loaded within a UI5 shell

<!-- docs-verify:no-run -->

```typescript
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  skipStabilityWait: true, // Global: use briefDOMSettle instead of full UI5 wait
});
```

You can also control this per-call via the `selectors` config section or via
per-call options passed to individual fixture methods.

## Timeout Errors

If a stability wait times out, Praman throws a `TimeoutError` with code
`ERR_TIMEOUT_OPERATION`. The error includes actionable suggestions:

- Increase the timeout value if the application is slow to load
- Check for long-running OData requests blocking stability
- Use `skipStabilityWait: true` if stability detection is not needed

See the [Errors Guide](./errors.md) for the full error reference.
