# FLP & In-App Navigation via CLI

## Table of Contents

1. [Navigate via FLP Hash](#navigate-via-flp-hash)
2. [Wait for Navigation + Bridge Ready](#wait-for-navigation--bridge-ready)
3. [Navigate via Tile Click](#navigate-via-tile-click)
4. [Intent-Based Navigation](#intent-based-navigation)
5. [Back Navigation](#back-navigation)
6. [Get Current Hash](#get-current-hash)
7. [Full Navigation Flow Example](#full-navigation-flow-example)

---

## Navigate via FLP Hash

The fastest way to navigate in SAP Fiori Launchpad is setting the hash directly.
This bypasses tile rendering and goes straight to the target app.

```bash
playwright-cli -s=sap run-code "async page => {
  await page.evaluate(() => {
    window.hasher.setHash('PurchaseOrder-manage');
  });
  return 'Navigating to PurchaseOrder-manage';
}"
```

**Common hash patterns**:

```text
PurchaseOrder-manage                          — Manage Purchase Orders (ME23N)
PurchaseOrder-create                          — Create Purchase Order (ME21N)
SalesOrder-manage                             — Manage Sales Orders (VA03)
SalesOrder-create                             — Create Sales Order (VA01)
Material-display                              — Display Material (MM60)
BusinessPartner-manage                        — Manage Business Partners (XK03)
SupplierInvoice-create                        — Create Supplier Invoice (MIRO)
Shell-home                                    — FLP Home Page
```

**Deep-link with parameters**:

```bash
playwright-cli -s=sap run-code "async page => {
  await page.evaluate(() => {
    window.hasher.setHash(\"PurchaseOrder-manage&/PurchaseOrder('4500001234')\");
  });
  return 'Deep-linking to PO 4500001234';
}"
```

---

## Wait for Navigation + Bridge Ready

After any navigation, always wait for the bridge to become ready before
interacting with UI5 controls. The target app needs time to load and render.

**Standard post-navigation wait**:

```bash
playwright-cli -s=sap run-code "async page => {
  await page.evaluate(() => {
    window.hasher.setHash('PurchaseOrder-manage');
  });
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Navigation complete, bridge ready';
}"
```

**Wait for a specific control to appear** (more precise):

```bash
playwright-cli -s=sap run-code "async page => {
  await page.evaluate(() => {
    window.hasher.setHash('PurchaseOrder-manage');
  });
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  await page.waitForFunction(() => {
    const bridge = window.__praman_bridge;
    return bridge.getByType('sap.m.Table').length > 0;
  }, { timeout: 60000 });
  return 'Table loaded in PurchaseOrder-manage';
}"
```

---

## Navigate via Tile Click

When the hash is not known or you need to simulate user behavior, navigate by
clicking the FLP tile directly.

**Step 1**: Discover tile controls on the FLP home page.

```bash
playwright-cli -s=sap run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  const tiles = await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    return bridge.getByType('sap.ushell.ui.launchpad.Tile').map(t => ({
      id: t.id,
      title: bridge.getById(t.id).getProperty('title')
    }));
  });
  return tiles;
}"
```

**Step 2**: Click the target tile by ID.

```bash
playwright-cli -s=sap run-code "async page => {
  await page.evaluate((tileId) => {
    const bridge = window.__praman_bridge;
    bridge.getById(tileId).firePress();
  }, 'tile-id-from-step-1');
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Tile clicked, app loaded';
}"
```

> **NOTE**: Tile control types vary by FLP version. On newer systems, tiles may
> be `sap.m.GenericTile` instead of `sap.ushell.ui.launchpad.Tile`. Snapshot the
> FLP home page first to confirm the control type.

---

## Intent-Based Navigation

Use SAP's `CrossApplicationNavigation` service for programmatic intent-based
navigation. This is the most robust method for complex navigation scenarios.

```bash
playwright-cli -s=sap run-code "async page => {
  const result = await page.evaluate(async () => {
    const service = await sap.ushell.Container.getServiceAsync(
      'CrossApplicationNavigation'
    );
    service.toExternal({
      target: {
        semanticObject: 'PurchaseOrder',
        action: 'manage'
      },
      params: {
        PurchaseOrder: '4500001234'
      }
    });
    return 'Navigation triggered';
  });
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return result + ', app loaded';
}"
```

**Checking if an intent is supported**:

```bash
playwright-cli -s=sap run-code "async page => {
  const supported = await page.evaluate(async () => {
    const service = await sap.ushell.Container.getServiceAsync(
      'CrossApplicationNavigation'
    );
    return service.isIntentSupported([
      '#PurchaseOrder-manage',
      '#SalesOrder-create',
      '#Material-display'
    ]);
  });
  return supported;
}"
```

---

## Back Navigation

Use the CLI `go-back` command for browser-level back navigation:

```bash
playwright-cli -s=sap go-back
```

After going back, wait for the bridge to stabilize:

```bash
playwright-cli -s=sap go-back
playwright-cli -s=sap run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Back navigation complete. Current hash: ' + window.location.hash;
}"
```

**App-level back button** (SAP shell back button, not browser back):

```bash
playwright-cli -s=sap run-code "async page => {
  await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const backBtn = bridge.getByType('sap.ushell.ui.shell.ShellHeadItem')
      .find(b => bridge.getById(b.id).getProperty('icon') === 'sap-icon://nav-back');
    if (backBtn) {
      bridge.getById(backBtn.id).firePress();
    }
  });
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Shell back navigation complete';
}"
```

---

## Get Current Hash

Retrieve the current FLP hash to understand where you are:

```bash
playwright-cli -s=sap run-code "async page => {
  return window.location.hash;
}"
```

**Detailed navigation state**:

```bash
playwright-cli -s=sap run-code "async page => {
  return {
    hash: window.location.hash,
    fullUrl: window.location.href,
    title: document.title
  };
}"
```

---

## Full Navigation Flow Example

Complete example: FLP home, navigate to app, open detail, go back.

```bash
# 1. Start on FLP home (assumes auth state is already loaded)
playwright-cli -s=sap state-load sap-auth.json
playwright-cli -s=sap navigate https://erp.mycompany.com/sap/bc/ui2/flp

# 2. Wait for FLP to load
playwright-cli -s=sap run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'FLP loaded. Hash: ' + window.location.hash;
}"

# 3. Navigate to Manage Purchase Orders
playwright-cli -s=sap run-code "async page => {
  await page.evaluate(() => {
    window.hasher.setHash('PurchaseOrder-manage');
  });
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'PO list loaded. Hash: ' + window.location.hash;
}"

# 4. Snapshot the list page to discover controls
playwright-cli -s=sap snapshot --filename=po-list.yml

# 5. Click on a specific PO row to navigate to detail
playwright-cli -s=sap run-code "async page => {
  await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    const rows = bridge.getByType('sap.m.ColumnListItem');
    if (rows.length > 0) {
      bridge.getById(rows[0].id).firePress();
    }
  });
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Detail page loaded. Hash: ' + window.location.hash;
}"

# 6. Snapshot the detail page
playwright-cli -s=sap snapshot --filename=po-detail.yml

# 7. Navigate back to the list
playwright-cli -s=sap go-back
playwright-cli -s=sap run-code "async page => {
  await page.waitForFunction(
    '!!(window.__praman_bridge && window.__praman_bridge.ready)',
    { timeout: 300000 }
  );
  return 'Back to list. Hash: ' + window.location.hash;
}"
```

> **WARNING**: `console.log()` inside `run-code` is silently swallowed. Always
> use `return` to produce output from `run-code` commands.

> **WARNING**: When using `snapshot` in agent workflows, always use the
> `--filename` flag (e.g., `snapshot --filename=snap.yml`) to get a file
> reference (~200 tokens) instead of inlined YAML.
