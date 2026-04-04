# Praman Bridge Setup & Verification

## Table of Contents

1. [How initScript Auto-Injects the Bridge](#how-initscript-auto-injects-the-bridge)
2. [Fallback: Manual Injection](#fallback-manual-injection)
3. [Bridge Readiness Verification](#bridge-readiness-verification)
4. [Troubleshooting](#troubleshooting)
5. [SPA Navigation Survival](#spa-navigation-survival)
6. [Iframe Support](#iframe-support)

---

## How initScript Auto-Injects the Bridge

The Praman bridge (`window.__praman_bridge`) is injected into the browser via
Playwright's CDP `addScriptToEvaluateOnNewDocument` mechanism. Configuration lives
in the CLI config file.

**Config file location**: `.playwright-cli.json` (project root) or `~/.playwright-cli.json` (global)

**Config format** (nested under `browser`):

```json
{
  "browser": {
    "initScript": ["./path/to/praman-bridge.js"]
  }
}
```

- `initScript` accepts an array of file paths relative to the config file location.
- Scripts execute before any page JavaScript runs, on every navigation.
- The bridge script registers the `window.__praman_bridge` namespace with
  control discovery, property access, and event-firing methods.

**How it works internally**:

1. CLI reads `browser.initScript` from config on session start.
2. Each script path is resolved and read from disk.
3. CLI calls CDP `Page.addScriptToEvaluateOnNewDocument({ source })`.
4. The browser evaluates the script before any page JS on every new document load.

---

## Fallback: Manual Injection

If `initScript` is not configured or the bridge fails to auto-inject, inject
the bridge manually using `run-code --filename`:

```bash
playwright-cli run-code --filename=./path/to/praman-bridge.js
```

This evaluates the bridge script in the current page context. Unlike `initScript`,
manual injection does NOT survive navigation. You must re-inject after every
page load or navigation event.

For one-off verification without a file:

```bash
playwright-cli run-code "async page => {
  return typeof window.__praman_bridge !== 'undefined'
    ? 'Bridge already loaded'
    : 'Bridge NOT loaded';
}"
```

> **WARNING**: `console.log()` inside `run-code` is silently swallowed. Always
> use `return` to produce output.

---

## Bridge Readiness Verification

After injection, the bridge initializes asynchronously by discovering the UI5
runtime. The readiness signal is `window.__praman_bridge.ready`.

**Standard verification pattern**:

```bash
playwright-cli run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Bridge ready: UI5 v' + await page.evaluate(() => sap.ui.version);
}"
```

**What this does**:

1. Polls `window.__praman_bridge.ready` until it becomes truthy (bridge finished
   discovering UI5 controls and registering adapters).
2. Returns the UI5 version as confirmation that both bridge and UI5 runtime are live.
3. The 300-second timeout accounts for slow SAP systems that take time to load UI5.

**Quick check (no wait)**:

```bash
playwright-cli run-code "async page => {
  return {
    bridgeExists: typeof window.__praman_bridge !== 'undefined',
    bridgeReady: !!(window.__praman_bridge && window.__praman_bridge.ready),
    ui5Version: typeof sap !== 'undefined' ? sap.ui.version : 'UI5 not loaded'
  };
}"
```

---

## Troubleshooting

### Bridge not injecting

| Symptom                                                 | Cause                         | Fix                                                                                           |
| ------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| `window.__praman_bridge` is `undefined` after page load | Config path wrong             | Verify `.playwright-cli.json` exists in project root and `browser.initScript` path is correct |
| Bridge exists but `ready` is `false`                    | Page is not a UI5 app         | Bridge waits for `sap.ui.getCore()`. On non-UI5 pages, `ready` stays `false`                  |
| Bridge exists but `ready` is `false` after long wait    | UI5 is loading asynchronously | Increase timeout in `waitForFunction`. Some SAP systems take 2-5 minutes for initial load     |
| `initScript` format error                               | Wrong config nesting          | Must be `{ "browser": { "initScript": [...] } }`, NOT `{ "initScript": [...] }`               |
| Bridge loads but methods throw errors                   | UI5 version mismatch          | Check UI5 version with `sap.ui.version`. Bridge supports UI5 1.71+                            |

### Verifying the config file

```bash
playwright-cli run-code "async page => {
  return document.title;
}"
```

If this works but bridge is missing, the issue is specifically with `initScript` config.

### Verifying initScript paths

Ensure paths in `initScript` are relative to the config file, not the current
working directory. Use `./` prefix for files in the same directory as the config.

---

## SPA Navigation Survival

Because `initScript` uses CDP `addScriptToEvaluateOnNewDocument`, the bridge
automatically re-injects on every new document load. This covers:

- **Full page navigations**: Browser navigates to a new URL (e.g., FLP redirects).
- **Hard refreshes**: User or test triggers `page.reload()`.
- **Cross-origin redirects**: After SAML/SSO redirect chains, bridge re-injects
  on the final SAP domain page.

**SPA hash navigations** (e.g., `#PurchaseOrder-manage` to `#SalesOrder-display`)
do NOT trigger a new document load. The bridge survives these because the page
context is preserved. No re-injection needed.

**When bridge re-injects on navigation**:

1. New document loads.
2. CDP evaluates `initScript` before any page JS.
3. Bridge re-initializes, waits for UI5 runtime.
4. `window.__praman_bridge.ready` becomes truthy when UI5 is discovered.

Always re-verify bridge readiness after a full page navigation:

```bash
playwright-cli run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Bridge re-initialized successfully';
}"
```

---

## Iframe Support

The bridge auto-injects into ALL same-origin frames, not just the top-level page.
This is critical for SAP scenarios:

- **SAP WorkZone**: Apps run inside iframes within the WorkZone shell.
- **SAP GUI HTML**: Transaction screens may embed iframes.
- **Custom Fiori apps**: Some apps use iframes for embedded content.

**How it works**: CDP `addScriptToEvaluateOnNewDocument` applies to all frames
in the page, including dynamically created iframes, as long as they share the
same origin as the parent.

**Cross-origin limitation**: If an iframe has a different origin (e.g., IAS login
page inside an SAP domain frame), the bridge will NOT inject into the cross-origin
frame. This is a browser security restriction.

**Verifying bridge in an iframe**:

```bash
playwright-cli run-code "async page => {
  const frames = page.frames();
  const results = [];
  for (const frame of frames) {
    const hasBridge = await frame.evaluate(
      () => typeof window.__praman_bridge !== 'undefined'
    ).catch(() => false);
    results.push({ url: frame.url(), hasBridge });
  }
  return results;
}"
```

> **WARNING**: When using `snapshot` in agent workflows, always use the
> `--filename` flag (e.g., `snapshot --filename=snap.yml`) to get a file
> reference (~200 tokens) instead of inlined YAML.
