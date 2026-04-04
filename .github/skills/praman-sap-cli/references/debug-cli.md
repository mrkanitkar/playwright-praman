# Debug Mode via `--debug=cli` (Playwright 1.59)

Run Praman tests interactively, pause at every `test.step()`, inspect UI5 state,
and step through actions from the terminal.

---

## Table of Contents

1. [Overview](#overview)
2. [Launch Test in Debug Mode](#launch-test-in-debug-mode)
3. [Attach to the Paused Session](#attach-to-the-paused-session)
4. [Step Through test.step() Blocks](#step-through-teststep-blocks)
5. [Inspect UI5 State While Paused](#inspect-ui5-state-while-paused)
6. [SAP-Specific Diagnostics](#sap-specific-diagnostics)
7. [Monitor Bound Browsers (Dashboard)](#monitor-bound-browsers-dashboard)
8. [Workflow: Praman Gold-Standard Spec](#workflow-praman-gold-standard-spec)
9. [Troubleshooting](#troubleshooting)

---

> **Warning**: `console.log()` inside `run-code` is silently swallowed.
> Always use `return` to get data out.

> **Warning**: Use `--filename` with `snapshot` to avoid flooding your
> context with inline YAML.

---

## Overview

Playwright 1.59 introduces `--debug=cli`, which pauses a running test at the
start of each `test.step()` and exposes a named CLI session. The Praman healer
agent (or a human operator) can attach to that session to inspect the live
browser state, run bridge queries, and advance the test one step at a time.

This replaces `--debug` (headed UI) for headless CI-compatible debugging.

---

## Launch Test in Debug Mode

### Standard Praman spec

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test \
  tests/e2e/sap-cloud/bom-e2e-praman-gold-standard.spec.ts \
  --debug=cli &
```

The test starts, pauses before the first `test.step()`, and prints the session
name in the terminal output, for example:

```text
[playwright-cli] Session bound: tw-abc123
Paused before: "Navigate to BOM app"
```

### Run a single failing step only

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test \
  tests/e2e/sap-cloud/bom-e2e-praman-gold-standard.spec.ts \
  --debug=cli \
  --grep "Submit BOM" &
```

---

## Attach to the Paused Session

```bash
playwright-cli attach tw-abc123
```

You now have full interactive CLI access to the paused browser.

### List all active sessions (when session name scrolled off)

```bash
playwright-cli list
```

---

## Step Through test.step() Blocks

### Advance one test action

```bash
playwright-cli -s=tw-abc123 step-over
```

After each `step-over`, take a snapshot to confirm the page changed as expected:

```bash
playwright-cli -s=tw-abc123 snapshot --filename=after-step.yml
```

### Resume to next pause point (or test completion)

```bash
playwright-cli -s=tw-abc123 resume
```

### Step-over + snapshot loop (manual)

```bash
playwright-cli -s=tw-abc123 step-over && \
playwright-cli -s=tw-abc123 snapshot --filename=step-1.yml

playwright-cli -s=tw-abc123 step-over && \
playwright-cli -s=tw-abc123 snapshot --filename=step-2.yml
```

---

## Inspect UI5 State While Paused

### Check bridge readiness

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => ({
    hasBridge:   !!(window.__praman_bridge),
    bridgeReady: !!(window.__praman_bridge?.ready),
    hasUI5:      typeof sap !== 'undefined',
    ui5Version:  typeof sap !== 'undefined' ? sap.ui?.version : null,
    url:         window.location.href,
    hash:        window.location.hash
  }));
}"
```

### Discover all visible controls

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not injected' };
    const ctrls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl?.getVisible?.()) ctrls.push({
        id:   ctrl.getId(),
        type: ctrl.getMetadata().getName(),
        text: ctrl.getText?.() ?? ctrl.getValue?.()
      });
    });
    return ctrls.slice(0, 30);
  });
}"
```

### Inspect a specific control

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate((id) => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const ctrl = b.getById(id);
    if (!ctrl) return { error: 'Control not found', id };
    return {
      id:       ctrl.getId(),
      type:     ctrl.getMetadata().getName(),
      visible:  ctrl.getVisible?.(),
      enabled:  ctrl.getEnabled?.(),
      busy:     ctrl.getBusy?.(),
      editable: ctrl.getEditable?.(),
      value:    ctrl.getValue?.(),
      text:     ctrl.getText?.()
    };
  }, 'THE_CONTROL_ID');
}"
```

### Check for open dialogs

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => {
    const staticArea = document.getElementById('sap-ui-static');
    if (!staticArea) return { error: 'No static area' };
    const dialogs = [];
    staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = window.__praman_bridge.getById(el.getAttribute('data-sap-ui'));
      if (ctrl?.getMetadata?.().getName()?.includes('Dialog')) {
        dialogs.push({
          id:    ctrl.getId(),
          type:  ctrl.getMetadata().getName(),
          title: ctrl.getTitle?.(),
          open:  ctrl.isOpen?.()
        });
      }
    });
    return dialogs;
  });
}"
```

---

## SAP-Specific Diagnostics

### Check OData model state while paused

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    const views = b.getByType('sap.ui.core.mvc.View');
    if (!views.length) return { error: 'No views found' };
    const model = b.getById(views[0].id).getModel();
    if (!model) return { error: 'No default model' };
    return {
      modelClass:         model.getMetadata().getName(),
      hasPendingRequests: model.hasPendingRequests?.(),
      hasPendingChanges:  model.hasPendingChanges?.(),
      serviceUrl:         model.sServiceUrl || model.getServiceUrl?.() || 'N/A'
    };
  });
}"
```

### Verify bridge injection timing

Check whether the bridge was injected before or after UI5 bootstrapped:

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => ({
    bridgeTs:   window.__praman_bridge?._injectedAt ?? 'N/A',
    ui5CoreTs:  window.__ui5_bootstrap_ts ?? 'N/A',
    nowTs:      Date.now(),
    deltaMs:    window.__praman_bridge?._injectedAt
                  ? Date.now() - window.__praman_bridge._injectedAt
                  : 'N/A'
  }));
}"
```

### Check FLP shell and current app hash

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => ({
    url:      window.location.href,
    hash:     window.location.hash,
    title:    document.title,
    hasShell: !!(window.sap?.ushell?.Container),
    appState: window.sap?.ushell?.Container?.getService('AppState') ? 'available' : 'N/A'
  }));
}"
```

### Check OData binding on a specific control

Use this when a Table or List shows no rows despite data being expected:

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate((id) => {
    const b = window.__praman_bridge;
    const ctrl = b.getById(id);
    if (!ctrl) return { error: 'Control not found' };
    const binding = ctrl.getBinding('items') || ctrl.getBinding('rows');
    if (!binding) return { error: 'No items/rows binding', type: ctrl.getMetadata().getName() };
    return {
      path:           binding.getPath(),
      length:         binding.getLength(),
      isResolved:     binding.isResolved?.(),
      hasPendingReq:  binding.hasPendingRequests?.(),
      filters:        binding.aFilters?.map(f => f.sPath + ' ' + f.sOperator + ' ' + f.oValue1)
    };
  }, 'THE_TABLE_CONTROL_ID');
}"
```

---

## Monitor Bound Browsers (Dashboard)

The `playwright-cli show` dashboard lists every browser currently bound to a
CLI session, including its URL, session name, and test step.

```bash
playwright-cli show
```

Example output:

```text
┌─────────────┬─────────────────────────────────────────────────────────┬─────────────────────────────────┐
│ Session     │ URL                                                     │ Current step                    │
├─────────────┼─────────────────────────────────────────────────────────┼─────────────────────────────────┤
│ tw-abc123   │ https://my.s4hana.cloud/sap/bc/ui5_ui5/...#BOM-display  │ "Verify BOM header data"        │
│ tw-def456   │ https://my.s4hana.cloud/sap/bc/ui5_ui5/...#Shell-home   │ "Navigate to BOM app"           │
└─────────────┴─────────────────────────────────────────────────────────┴─────────────────────────────────┘
```

Refresh the dashboard on a fixed interval during long test runs:

```bash
watch -n 5 playwright-cli show
```

---

## Workflow: Praman Gold-Standard Spec

Full end-to-end debug cycle for the BOM gold-standard spec:

```bash
# 1. Run in CLI debug mode (background)
PLAYWRIGHT_HTML_OPEN=never npx playwright test \
  tests/e2e/sap-cloud/bom-e2e-praman-gold-standard.spec.ts \
  --debug=cli &

# 2. Get the session name from terminal output, then attach
playwright-cli attach tw-abc123

# 3. Confirm bridge is ready at the first pause point
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => ({
    bridgeReady: !!(window.__praman_bridge?.ready),
    url: window.location.href
  }));
}"

# 4. Step through each test.step() block
playwright-cli -s=tw-abc123 step-over
playwright-cli -s=tw-abc123 snapshot --filename=step-nav.yml

playwright-cli -s=tw-abc123 step-over
playwright-cli -s=tw-abc123 snapshot --filename=step-header.yml

# 5. At a failing step, inspect the problematic control
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'not found' };
    return {
      visible: ctrl.getVisible?.(),
      enabled: ctrl.getEnabled?.(),
      busy:    ctrl.getBusy?.(),
      value:   ctrl.getValue?.()
    };
  }, 'BomHeader--material');
}"

# 6. Resume and let the test finish (or fail with a clean error)
playwright-cli -s=tw-abc123 resume
```

---

## Troubleshooting

| Issue                                   | Cause                                    | Fix                                              |
| --------------------------------------- | ---------------------------------------- | ------------------------------------------------ |
| `attach` fails with "session not found" | Test finished or crashed before attach   | Re-run with `--debug=cli`, attach faster         |
| Bridge not ready after attach           | Test paused before UI5 bootstrapped      | `step-over` past login and FLP load steps        |
| `step-over` does nothing                | Test is between steps or at an assertion | Use `resume` instead                             |
| Controls not found after stepping       | Page navigated, control IDs regenerated  | Re-run discovery snippet after each step         |
| Session name not visible in terminal    | Output scrolled past                     | Run `playwright-cli list`                        |
| `run-code` returns `undefined`          | Missing `return` in the function body    | Always `return` the value from `page.evaluate()` |
| Snapshot YAML floods context            | `snapshot` used without `--filename`     | Always pass `--filename=snap.yml`                |
