# Praman Test Debugging via Playwright CLI

Debug failing Praman tests interactively using Playwright 1.59's `--debug=cli` feature.

---

## Table of Contents

- [Overview](#overview)
- [Debug Workflow](#debug-workflow)
- [Inspect Page State at Failure](#inspect-page-state-at-failure)
- [Step Through Test](#step-through-test)
- [Common Debugging Patterns](#common-debugging-patterns)
- [Troubleshooting](#troubleshooting)

---

> **Warning**: `console.log()` inside `run-code` is silently swallowed.
> Always use `return` to get data out.

> **Warning**: When using `snapshot` during debugging, always use `--filename`
> to avoid flooding your context with inline YAML.

---

## Overview

Playwright 1.59 introduces `--debug=cli`, which pauses a running test and exposes a CLI session
you can attach to. This lets the healer agent (or a human) inspect page state, run bridge queries,
and step through test actions — all from the terminal.

---

## Debug Workflow

### Step 1: Run the Failing Test with CLI Debug

```bash
PLAYWRIGHT_HTML_OPEN=never npx playwright test tests/e2e/po-create.spec.ts --debug=cli &
```

The test starts, hits the first `test.step()`, and pauses. The output includes a session name
(e.g., `tw-abc123`).

### Step 2: Attach to the Paused Session

```bash
playwright-cli attach tw-abc123
```

You now have full CLI access to the browser at the exact point the test paused.

### Step 3: Inspect and Diagnose

Use `snapshot`, `run-code`, and bridge queries to understand the page state (see patterns below).

### Step 4: Step Through the Test

```bash
# Advance to the next test action
playwright-cli -s=tw-abc123 step-over

# Resume the test (run to next pause point or completion)
playwright-cli -s=tw-abc123 resume
```

### Step 5: Fix and Re-run

After identifying the root cause, edit the `.spec.ts` file and re-run:

```bash
npx playwright test tests/e2e/po-create.spec.ts
```

---

## Inspect Page State at Failure

### Take a Snapshot

```bash
playwright-cli -s=tw-abc123 snapshot --filename=debug-snap.yml
```

### Check Bridge Status

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => ({
    hasBridge: !!(window.__praman_bridge),
    bridgeReady: !!(window.__praman_bridge?.ready),
    hasUI5: typeof sap !== 'undefined',
    ui5Version: typeof sap !== 'undefined' ? sap.ui?.version : null,
    url: window.location.href
  }));
}"
```

### Discover All Visible Controls

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not injected' };
    const ctrls = [];
    document.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = b.getById(el.getAttribute('data-sap-ui'));
      if (ctrl?.getVisible?.()) ctrls.push({
        id: ctrl.getId(),
        type: ctrl.getMetadata().getName(),
        text: ctrl.getText?.() ?? ctrl.getValue?.()
      });
    });
    return ctrls.slice(0, 30);
  });
}"
```

### Check a Specific Control (from failing selector)

```bash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate((id) => {
    const b = window.__praman_bridge;
    if (!b?.ready) return { error: 'Bridge not ready' };
    const ctrl = b.getById(id);
    if (!ctrl) return { error: 'Control not found', id };
    return {
      id: ctrl.getId(),
      type: ctrl.getMetadata().getName(),
      visible: ctrl.getVisible?.(),
      enabled: ctrl.getEnabled?.(),
      busy: ctrl.getBusy?.(),
      value: ctrl.getValue?.(),
      text: ctrl.getText?.()
    };
  }, 'THE_FAILING_CONTROL_ID');
}"
```

---

## Step Through Test

### Step Over (Advance One Action)

```bash
playwright-cli -s=tw-abc123 step-over
```

After each step, take a snapshot to see the new page state:

```bash
playwright-cli -s=tw-abc123 snapshot --filename=after-step.yml
```

### Resume (Run to Completion or Next Breakpoint)

```bash
playwright-cli -s=tw-abc123 resume
```

---

## Common Debugging Patterns

### Pattern: Control Not Found

The test fails with "Control not found". Diagnose:

```bash
# 1. Check if the control ID exists at all
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate((id) => {
    const el = document.querySelector('[data-sap-ui=\"' + id + '\"]');
    if (el) return { found: true, visible: el.offsetParent !== null };
    // Search all IDs for similar matches
    const all = [];
    document.querySelectorAll('[data-sap-ui]').forEach(e => {
      const uid = e.getAttribute('data-sap-ui');
      if (uid && uid.includes(id.split('--').pop())) all.push(uid);
    });
    return { found: false, similar: all.slice(0, 10) };
  }, 'THE_FAILING_CONTROL_ID');
}"
```

### Pattern: Control Exists but Not Interactable

```bash
# Check enabled/busy/visible state
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate((id) => {
    const ctrl = window.__praman_bridge.getById(id);
    if (!ctrl) return { error: 'not found' };
    return {
      visible: ctrl.getVisible?.(),
      enabled: ctrl.getEnabled?.(),
      busy: ctrl.getBusy?.(),
      editable: ctrl.getEditable?.(),
      parentVisible: ctrl.getParent?.()?.getVisible?.()
    };
  }, 'THE_CONTROL_ID');
}"
```

### Pattern: Dialog Expected but Not Open

```bash
# Check the static area for open dialogs
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => {
    const staticArea = document.getElementById('sap-ui-static');
    if (!staticArea) return { error: 'No static area' };
    const dialogs = [];
    staticArea.querySelectorAll('[data-sap-ui]').forEach(el => {
      const ctrl = window.__praman_bridge.getById(el.getAttribute('data-sap-ui'));
      if (ctrl?.getMetadata?.().getName()?.includes('Dialog')) {
        dialogs.push({
          id: ctrl.getId(),
          type: ctrl.getMetadata().getName(),
          title: ctrl.getTitle?.(),
          open: ctrl.isOpen?.()
        });
      }
    });
    return dialogs;
  });
}"
```

### Pattern: Wrong Page / Navigation Issue

```bash
# Check current URL and FLP hash
playwright-cli -s=tw-abc123 run-code "async page => {
  return await page.evaluate(() => ({
    url: window.location.href,
    hash: window.location.hash,
    title: document.title,
    hasShell: !!(window.sap?.ushell?.Container)
  }));
}"
```

---

## Troubleshooting

| Issue                                   | Cause                                        | Fix                                                  |
| --------------------------------------- | -------------------------------------------- | ---------------------------------------------------- |
| `attach` fails with "session not found" | Test finished or crashed before attach       | Re-run with `--debug=cli`, attach faster             |
| Bridge not ready after attach           | Test paused before UI5 loaded                | Use `step-over` to advance past login/load steps     |
| `step-over` does nothing                | Test is between steps or at assertion        | Use `resume` instead                                 |
| Controls not found after stepping       | Page changed during step, controls refreshed | Re-run discovery after each `step-over`              |
| Session name not visible in output      | Output scrolled past                         | Run `playwright-cli list` to see all active sessions |
