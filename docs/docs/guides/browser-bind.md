---
title: 'Browser Bind & Screencast Fixtures'
description: 'Expose the test browser to Playwright CLI agents with browserBind, and record structured video with screencast — opt-in fixtures for agentic SAP UI5 test workflows.'
sidebar_label: 'Browser Bind & Screencast'
keywords:
  - praman browser bind
  - playwright browser bind
  - PRAMAN_BIND
  - playwright cli agent
  - screencast fixture
  - playwright 1.59
  - agentic testing
  - sap ui5 video recording
  - screencast highlight controls
  - playwright control highlighting
---

# Browser Bind & Screencast Fixtures

Praman ships two opt-in fixtures that unlock **agentic workflows** — where a running test
exposes its live browser to external Playwright CLI agents, and video frames stream to AI
vision pipelines in real time.

## Overview

The agentic workflow follows three phases:

```text
┌──────────────────────────────────────────────────────────┐
│  1. TEST STARTS        2. AGENT CONNECTS    3. TEST ENDS │
│                                                          │
│  Test runs with        CLI agent attaches   browser.     │
│  PRAMAN_BIND=1         via endpoint URL     unbind()     │
│  → browser.bind()      → inspects live UI   called in    │
│  → logs endpoint       → discovers controls finally block│
│                                                          │
│  screencast records    frame handlers       screencast   │
│  chapters + actions    feed AI vision       .stop()      │
└──────────────────────────────────────────────────────────┘
```

| Fixture       | Scope | Opt-in via          | Playwright version |
| ------------- | ----- | ------------------- | ------------------ |
| `browserBind` | Test  | `PRAMAN_BIND=1` env | 1.59+              |
| `screencast`  | Test  | Always available    | 1.59+ (degrades)   |

---

## Prerequisites

- **Playwright 1.59 or later** — `browser.bind()` and `page.screencast` were introduced in 1.59.
- **`PRAMAN_BIND` environment variable** — set to `1` or `true` to enable browser binding.
- **Praman installed** — `npm install playwright-praman`.

:::warning Playwright version
Both fixtures require Playwright 1.59+. On older versions, `browserBind` throws
`ERR_BIND_NOT_SUPPORTED` when enabled, while `screencast` methods silently no-op
(except `onFrame`, which throws `ERR_SCREENCAST_NOT_STARTED`).
:::

---

## Quick Start

```typescript
import { browserBindTest } from 'playwright-praman';

// Run with: PRAMAN_BIND=1 npx playwright test
browserBindTest('agent-assisted SAP test', async ({ browserBind }) => {
  if (browserBind.bound) {
    // A Playwright CLI agent can now connect at browserBind.endpointUrl
    // and inspect the live browser while the test runs.
  }
});
```

:::tip Zero overhead when disabled
When `PRAMAN_BIND` is not set (or is `'0'`), the fixture returns
`{ bound: false, endpointUrl: undefined, bindTitle: undefined }` with no runtime cost.
:::

---

## Configuration

### Environment Variables

| Variable            | Required | Default          | Description                                        |
| ------------------- | -------- | ---------------- | -------------------------------------------------- |
| `PRAMAN_BIND`       | No       | _(unset)_        | Set to `1` or `true` to enable browser binding     |
| `PRAMAN_BIND_TITLE` | No       | `'praman-agent'` | Override the bind title passed to `browser.bind()` |

```bash
# Enable binding with a custom title
PRAMAN_BIND=1 PRAMAN_BIND_TITLE=my-sap-agent npx playwright test
```

### BrowserBindResult

The `browserBind` fixture provides a `BrowserBindResult` to the test body:

```typescript
interface BrowserBindResult {
  /** Whether the browser is currently bound. */
  readonly bound: boolean;
  /** The endpoint URL for Playwright CLI. undefined when bound is false. */
  readonly endpointUrl: string | undefined;
  /** The bind title used. undefined when bound is false. */
  readonly bindTitle: string | undefined;
}
```

---

## How It Works with CLI Agents

When `PRAMAN_BIND=1`, the fixture calls `browser.bind(title)` at the start of the test,
which opens an ephemeral endpoint. The endpoint URL is logged at `info` level so that a
Playwright CLI agent can connect without polling:

```text
INFO  browser-bind: Browser bound — Playwright CLI agent can connect
  endpointUrl: "ws://127.0.0.1:43657/xyz"
  title: "praman-agent"
```

A CLI agent attaches to this endpoint to inspect the live UI, discover controls, or take
snapshots — while the test continues running. On teardown, `browser.unbind()` is called
in a `finally` block regardless of test outcome.

```bash
# Terminal 1: Run the test with binding enabled
PRAMAN_BIND=1 npx playwright test tests/e2e/purchase-order.spec.ts

# Terminal 2: CLI agent connects to the bound browser
playwright-cli attach praman-agent
playwright-cli snapshot --filename=live-state.yml
```

---

## Screencast Fixture

The `screencast` fixture wraps `page.screencast` (Playwright 1.59+) to provide structured
video recording with chapter markers, action annotations, and real-time frame streaming.

### Chapter Markers

Use `showChapter(title)` inside `test.step()` to label logical sections of the video:

```typescript
import { screencastTest } from 'playwright-praman';

screencastTest('purchase order workflow', async ({ page, screencast }) => {
  await screencast.showChapter('Navigate to PO list');
  await page.goto('/fiori#PurchaseOrder-manage');

  await screencast.showChapter('Create new PO');
  await page.getByRole('button', { name: 'Create' }).click();
});
```

### Action Annotations

`showActions(options?)` enables DOM-level overlays for click, fill, and keyboard events:

```typescript
await screencast.showActions({
  position: 'bottom-right',
  duration: 800,
  fontSize: 20,
});

// Subsequent actions are annotated in the video
await page.getByRole('button', { name: 'Save' }).click();
```

| Option     | Type     | Default       | Description                            |
| ---------- | -------- | ------------- | -------------------------------------- |
| `duration` | `number` | `500`         | How long each annotation displays (ms) |
| `fontSize` | `number` | `24`          | Font size of the action title (px)     |
| `position` | `string` | `'top-right'` | Overlay position on the video frame    |

### UI5 Control Tree Overlay

Toggle a visual overlay of the current UI5 control tree on video frames:

```typescript
screencast.showUI5ControlTree(true);
// Frame handlers can now use the enabled flag for annotation
```

:::info Phase 1
The UI5 overlay is currently state-only — it sets a flag that downstream frame handlers
or a bridge extension can use to annotate each frame. Visual overlay injection will be
added in a future release.
:::

### Frame Streaming

Register handlers for every raw video frame with `onFrame(handler)`. Frames are JPEG
buffers with a monotonic timestamp. The screencast starts lazily when the first handler
is registered.

```typescript
screencast.onFrame(async ({ buffer, timestamp }) => {
  // Send frame to an AI vision pipeline for anomaly detection
  const analysis = await aiVision.analyze(buffer);
  if (analysis.anomaly) {
    throw new Error(analysis.reason);
  }
});
```

:::tip Multiple handlers
You can register multiple frame handlers. They are called in registration order.
Errors from handlers are caught and logged at `debug` level (non-fatal to the test).
:::

### Control Highlighting

:::note Added in v1.3.0
:::

`highlightControls(enabled, style?)` draws a visible overlay on UI5 controls as they
are interacted with — useful for video recordings, demos, and AI vision pipelines that
need to see which control is active.

```typescript
import { screencastTest } from 'playwright-praman';

screencastTest('highlighted workflow', async ({ screencast, ui5 }) => {
  // Enable highlighting with the default Praman accent outline
  screencast.highlightControls(true);

  // Every press(), enterText(), and select() now highlights the control
  const saveBtn = await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Save' } });
  await saveBtn.press(); // Control is highlighted before the press

  // Disable when done
  screencast.highlightControls(false);
});
```

#### Custom Highlight Styles

Pass a CSS string or property map as the second argument:

```typescript
// CSS string
screencast.highlightControls(true, 'outline: 3px solid blue; background: rgba(0,0,255,0.1)');

// CSS property map
screencast.highlightControls(true, {
  outline: '3px solid #e8482b',
  outlineOffset: '2px',
  background: 'rgba(232, 72, 43, 0.05)',
});
```

The default style is `outline: 3px solid #e8482b; outline-offset: 2px` (Praman accent
red outline). Each interaction clears the previous highlight before applying the new one.

#### How It Works

When highlighting is enabled, Praman's control proxy calls `locator.highlight({ style })`
before every `press()`, `enterText()`, and `select()` interaction. The highlight is:

- **Page-scoped** — each page tracks its own highlight state independently
- **Best-effort** — highlighting never breaks an interaction; failures are silently caught
- **Automatic cleanup** — `page.hideHighlight()` is called before each new highlight

:::warning Playwright 1.60+ required
`highlightControls()` requires Playwright 1.60+ (which introduced `locator.highlight({ style })`).
On older versions, the method is a silent no-op.
:::

---

## Fixture Composition with mergeTests

Both fixtures can be composed with `coreTest` and each other using Playwright's
`mergeTests()`:

```typescript
import { mergeTests } from '@playwright/test';
import { coreTest } from 'playwright-praman';
import { browserBindTest } from 'playwright-praman';
import { screencastTest } from 'playwright-praman';

const test = mergeTests(coreTest, browserBindTest, screencastTest);

test('full agentic workflow', async ({ browserBind, screencast, page }) => {
  // browserBind: CLI agent connects to the live browser
  if (browserBind.bound) {
    console.info('Agent endpoint:', browserBind.endpointUrl);
  }

  // screencast: structured video with chapter markers
  await screencast.showChapter('Navigate to app');
  await page.goto('/fiori#PurchaseOrder-manage');

  await screencast.showActions({ position: 'bottom' });

  screencast.onFrame(async ({ buffer }) => {
    // Real-time AI vision analysis
  });
});
```

:::info Cross-fixture dependencies
The `screencast` fixture declares `rootLogger` as a `{ option: true }` placeholder
(PW-MERGE-1 pattern). When composed with `coreTest` via `mergeTests()`, it receives
the shared pino logger. Without `coreTest`, it falls back to its own logger instance.
:::

---

## Error Handling

Both fixtures throw structured `PramanError` instances with error codes, suggestions,
and retry information:

### browserBind Errors

| Error Code               | When                                         | Retryable |
| ------------------------ | -------------------------------------------- | --------- |
| `ERR_BIND_NOT_SUPPORTED` | `browser.bind()` missing (Playwright < 1.59) | No        |
| `ERR_BIND_FAILED`        | `browser.bind()` rejects at runtime          | No        |

```typescript
// Example error shape
PramanError {
  code: 'ERR_BIND_NOT_SUPPORTED',
  message: 'browser.bind() is not available — requires Playwright 1.59 or later',
  attempted: 'Bind browser for Playwright CLI agent access (PRAMAN_BIND=1)',
  retryable: false,
  suggestions: [
    'Upgrade Playwright to 1.59 or later: npm install -D @playwright/test@latest',
    'Remove PRAMAN_BIND=1 to disable browser binding',
  ],
}
```

### screencast Errors

| Error Code                      | When                                    | Retryable |
| ------------------------------- | --------------------------------------- | --------- |
| `ERR_SCREENCAST_CHAPTER_FAILED` | `showChapter()` rejects                 | No        |
| `ERR_SCREENCAST_NOT_STARTED`    | `onFrame()` called on Playwright < 1.59 | No        |
| `ERR_SCREENCAST_FRAME_HANDLER`  | `page.screencast.start()` rejects       | No        |

---

## Troubleshooting

| Problem                               | Solution                                                                |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `ERR_BIND_NOT_SUPPORTED` thrown       | Upgrade Playwright to 1.59+: `npm install -D @playwright/test@latest`   |
| `ERR_BIND_FAILED` thrown              | Check that no other process has already bound this browser instance     |
| `browserBind.bound` is always `false` | Set `PRAMAN_BIND=1` in the environment before running the test          |
| Endpoint URL not visible in logs      | Set log level to `info` or lower in your Praman config                  |
| `showChapter()` has no effect         | Verify Playwright 1.59+ and that video recording is enabled in config   |
| `onFrame()` throws on registration    | `page.screencast` is unavailable — upgrade Playwright to 1.59+          |
| Frame handlers never fire             | Ensure the screencast has time to start — avoid immediate test teardown |
| `unbind()` warning in teardown logs   | Non-fatal — the browser may have already been closed by the test        |
| Custom bind title not applied         | Set `PRAMAN_BIND_TITLE` env var _before_ the test process starts        |

## Next Steps

- [CLI Agents](./playwright-cli-agents.md) -- Praman CLI Agent definitions for Claude Code, Copilot, and Cursor
- [Running Your Agent](./running-your-agent.md) -- the MCP-based agent workflow
- [Agent & IDE Setup](./agent-setup.md) -- full installation and IDE configuration
