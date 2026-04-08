---
title: Iframe Handling via Playwright CLI
description: Handle SAP iframes in Playwright CLI sessions — auto-injection via initScript, frame listing, cross-origin limitations, and common SAP iframe patterns.
sidebar_label: CLI Iframe Handling
---

# Iframe Handling via Playwright CLI

SAP Fiori Launchpad (FLP), SAP Build WorkZone, and many custom Fiori apps run
application content inside iframes. This guide covers how the Praman bridge
interacts with iframes and how to discover and target controls within them.

## How `initScript` Auto-Injects into Frames

The Praman bridge is injected via Playwright's CDP `addScriptToEvaluateOnNewDocument`
mechanism. This operates at the browser level, not the page level, which means:

- The bridge script executes **before any page JavaScript** on every new document load.
- It injects into **all same-origin frames** automatically — not just the top-level page.
- Dynamically created iframes (e.g., FLP loading an app tile) receive the bridge
  as soon as their document loads.
- After a full page navigation or hard refresh, the bridge re-injects and
  re-initializes in every frame.

### Configuration

The `initScript` is configured in your CLI config file:

```json
{
  "browser": {
    "initScript": ["./path/to/praman-bridge.js"]
  }
}
```

**Config file location**: `.playwright-cli.json` (project root) or `~/.playwright-cli.json` (global).

No per-frame configuration is needed. Once `initScript` is set, every same-origin
frame gets the bridge.

## Frame Listing

List all frames in the current page and check which ones have the bridge injected
and UI5 loaded:

```bash
playwright-cli run-code "async page => {
  const frames = page.frames();
  const results = [];
  for (const frame of frames) {
    try {
      const info = await frame.evaluate(() => ({
        url: window.location.href,
        hasBridge: !!(window.__praman_bridge),
        bridgeReady: !!(window.__praman_bridge?.ready),
        hasUI5: typeof sap !== 'undefined'
      }));
      results.push({ name: frame.name(), ...info });
    } catch (e) {
      results.push({ name: frame.name(), error: 'cross-origin or detached' });
    }
  }
  return results;
}"
```

### Interpreting results

| Field combination                     | Meaning                                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| `hasBridge: true, bridgeReady: true`  | Bridge injected and ready — this frame can be queried for controls    |
| `hasBridge: true, bridgeReady: false` | Bridge injected but UI5 not yet initialized — wait and retry          |
| `hasUI5: true, hasBridge: false`      | UI5 app frame but bridge was not injected — check `initScript` config |
| `error: 'cross-origin or detached'`   | Frame is cross-origin or has been removed from the DOM                |

### Common SAP frame URL patterns

| Frame URL Pattern  | Description                      |
| ------------------ | -------------------------------- |
| `/sap/bc/ui5_ui5/` | ABAP-hosted Fiori app            |
| `/sap/bc/ui2/flp`  | Fiori Launchpad shell            |
| `/cp.portal/`      | SAP Build WorkZone shell         |
| `about:blank`      | Empty placeholder frame (ignore) |

## Discovering Controls in a Specific Frame

Once you identify which frame contains your SAP app (from the frame listing above),
target it directly for control discovery:

```bash
playwright-cli run-code "async page => {
  const appFrame = page.frames().find(f => f.url().includes('/sap/'));
  if (!appFrame) return { error: 'SAP app frame not found' };
  return await appFrame.evaluate(() => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { bridgeReady: false };
    const controls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl?.getVisible?.()) controls.push({
        id: ctrl.getId(),
        type: ctrl.getMetadata().getName(),
        text: ctrl.getText?.()
      });
    });
    return { bridgeReady: true, count: controls.length, controls: controls.slice(0, 30) };
  });
}"
```

**Tips**:

- Replace `'/sap/'` with a more specific URL fragment if multiple SAP frames exist
  (e.g., `'/sap/bc/ui5_ui5/sap/mm_pur_po_maint/'`).
- Use `frame.name()` instead of URL matching if the frame has a known `name` attribute.
- All discovery and interaction patterns from the
  [CLI Control Discovery](./playwright-cli-discovery.md) guide work identically on a
  frame — replace `page.evaluate(...)` with `appFrame.evaluate(...)`.

## Cross-Origin Frame Limitations

Browser security enforces the **same-origin policy** on iframes. This has two
consequences for Praman CLI usage:

1. **Bridge injection**: CDP `addScriptToEvaluateOnNewDocument` **does** inject into
   cross-origin frames, but the bridge cannot access the parent frame's UI5 runtime
   or vice versa. Each frame gets its own independent bridge instance.

2. **Frame evaluation**: Playwright's `frame.evaluate()` **cannot** access cross-origin
   frames. The `try/catch` in the frame listing pattern catches this as
   `'cross-origin or detached'`.

### Common cross-origin scenarios in SAP

| Scenario                        | Origin Difference                           | Impact                                       |
| ------------------------------- | ------------------------------------------- | -------------------------------------------- |
| IAS/IDP login page              | `accounts.sap.com` vs `your-system.sap.com` | Cannot evaluate login frame from app context |
| Embedded analytics (SAC)        | `analytics.cloud.sap` vs app domain         | SAC iframe is not queryable                  |
| Third-party payment integration | External payment provider domain            | Completely isolated                          |
| BTP subaccount cross-domain     | Different BTP subaccount domains            | Separate bridge instances                    |

### Workaround for cross-origin frames

Navigate directly to the cross-origin URL instead of trying to access the iframe:

```bash
playwright-cli run-code "async page => {
  const frames = page.frames();
  const crossOrigin = [];
  for (const frame of frames) {
    try {
      await frame.evaluate(() => true);
    } catch {
      crossOrigin.push({ name: frame.name(), url: frame.url() });
    }
  }
  return crossOrigin;
}"
```

If you need to interact with a cross-origin frame's content, navigate to its URL
directly in a new browser context or tab.

## Common SAP Iframe Patterns

### SAP Fiori Launchpad (FLP)

FLP renders a shell page and loads each Fiori app inside an iframe. The typical
frame structure is:

```text
Top-level: /sap/bc/ui2/flp  (FLP shell — has UI5, bridge injects here)
  └── iframe: /sap/bc/ui5_ui5/sap/<app>/  (Fiori app — has UI5, bridge injects here)
```

Both frames are same-origin. Target the inner app frame for control discovery:

```bash
playwright-cli run-code "async page => {
  const appFrame = page.frames().find(f =>
    f.url().includes('/sap/bc/ui5_ui5/')
  );
  if (!appFrame) return { error: 'No Fiori app frame found' };
  return await appFrame.evaluate(() => ({
    bridgeReady: !!(window.__praman_bridge?.ready),
    title: document.title,
    ui5Version: typeof sap !== 'undefined' ? sap.ui.version : 'N/A'
  }));
}"
```

### SAP Build WorkZone

WorkZone uses a portal shell with apps in iframes:

```text
Top-level: /cp.portal/site/  (WorkZone shell)
  └── iframe: /sap/bc/ui5_ui5/sap/<app>/  (Fiori app)
```

The shell and app may be on different subdomains. Check the frame listing to
determine which frames are accessible.

### Transaction containers (SAP GUI HTML)

SAP GUI for HTML renders transactions in nested iframes:

```text
Top-level: /sap/bc/gui/sap/its/webgui
  └── iframe: transaction content (same-origin, but NOT UI5)
```

These frames contain classic Dynpro screens, not UI5 controls. The Praman bridge
will inject but `ready` will remain `false` because there is no UI5 runtime.
Use standard Playwright DOM selectors for these frames.

### Embedded custom apps

Custom Fiori apps sometimes embed other apps or content via iframes:

```bash
playwright-cli run-code "async page => {
  const frames = page.frames();
  return frames.map(f => ({
    name: f.name(),
    url: f.url().substring(0, 80),
    isMain: f === page.mainFrame()
  }));
}"
```

## Waiting for Bridge Readiness in a Frame

After navigation or when an app frame loads dynamically, wait for the bridge
to become ready in that specific frame:

```bash
playwright-cli run-code "async page => {
  const appFrame = page.frames().find(f => f.url().includes('/sap/'));
  if (!appFrame) return { error: 'SAP app frame not found' };
  await appFrame.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 120000 }
  );
  return await appFrame.evaluate(() => ({
    ready: true,
    ui5Version: sap.ui.version,
    controlCount: document.querySelectorAll('[data-sap-ui]').length
  }));
}"
```

## Troubleshooting

| Symptom                              | Cause                             | Solution                                              |
| ------------------------------------ | --------------------------------- | ----------------------------------------------------- |
| Frame listing shows no frames        | App is not using iframes          | Query controls on `page` directly                     |
| `hasBridge: false` in app frame      | `initScript` not configured       | Add bridge path to `.playwright-cli.json`             |
| `bridgeReady: false` after long wait | Frame content is not a UI5 app    | Verify the frame URL points to a UI5 application      |
| `error: 'cross-origin or detached'`  | Different origin or removed frame | Check frame URL; navigate directly if needed          |
| Controls found in wrong frame        | Multiple SAP frames present       | Use a more specific URL fragment in `frames().find()` |

## Related Guides

- [CLI Control Discovery](./playwright-cli-discovery.md) — full discovery patterns
- [Agent & IDE Setup](./agent-setup.md) — initial project and bridge setup
- [Bridge Internals](./bridge-internals.md) — how the Praman bridge works under the hood
