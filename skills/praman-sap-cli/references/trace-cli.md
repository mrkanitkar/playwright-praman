# Trace Analysis via `npx playwright trace` (Playwright 1.59)

Record, open, and analyse Playwright traces to diagnose failed Praman tests
without re-running them. Essential for post-mortem debugging of SAP Fiori
test failures in CI.

---

## Table of Contents

1. [Overview](#overview)
2. [Record a Trace](#record-a-trace)
3. [Open and Inspect a Trace](#open-and-inspect-a-trace)
4. [Filter Trace Actions](#filter-trace-actions)
5. [Extract Snapshots from a Trace](#extract-snapshots-from-a-trace)
6. [SAP-Specific Trace Analysis](#sap-specific-trace-analysis)
7. [CI Integration](#ci-integration)
8. [Trace Options Reference](#trace-options-reference)
9. [Troubleshooting](#troubleshooting)

---

> **Note**: Traces are ZIP archives containing a network HAR, DOM snapshots,
> screenshots, and a structured action log. The `npx playwright trace` CLI
> works on the ZIP — no browser required.

---

## Overview

Playwright 1.59's `npx playwright trace` CLI provides subcommands for
inspecting recorded traces without launching the full Trace Viewer UI.
This is useful for agents and CI pipelines that need to extract failure data
programmatically.

| Subcommand   | Purpose                                         |
| ------------ | ----------------------------------------------- |
| `open`       | Launch the Trace Viewer UI for a trace file     |
| `actions`    | Print all recorded actions as structured text   |
| `snapshot`   | Extract DOM snapshot at a specific action index |
| `show-trace` | Alias for `open` (backwards-compatible)         |

---

## Record a Trace

### Record on all tests (recommended for SAP E2E)

```bash
npx playwright test \
  tests/e2e/sap-cloud/bom-e2e-praman-gold-standard.spec.ts \
  --trace=on
```

### Record only on first retry (fail-fast in CI)

```bash
npx playwright test \
  tests/e2e/sap-cloud/bom-e2e-praman-gold-standard.spec.ts \
  --trace=on-first-retry
```

### Record with full network capture (HAR)

Add to `playwright.config.ts` for persistent projects:

```typescript
use: {
  trace: {
    mode: 'on',
    snapshots: true,
    screenshots: true,
    sources: true
  }
}
```

Trace files are written to:

```text
test-results/<spec-file>-<test-name>-<browser>/trace.zip
```

Example path for the BOM gold-standard spec:

```text
test-results/bom-e2e-praman-gold-standard-Verify-BOM-header-chromium/trace.zip
```

---

## Open and Inspect a Trace

### Launch the Trace Viewer UI

```bash
npx playwright trace open \
  test-results/bom-e2e-praman-gold-standard-Verify-BOM-header-chromium/trace.zip
```

Opens an interactive browser-based viewer at `http://localhost:9323` with:

- Timeline of all actions and network requests
- Before/after DOM snapshots for every action
- Console log output per step
- Network waterfall (timings, status codes, payloads)

### Open the latest trace in the current directory

```bash
npx playwright trace open $(ls -t test-results/**/trace.zip | head -1)
```

---

## Filter Trace Actions

Print all actions recorded in a trace as structured text. Useful for scanning
large traces programmatically or piping into further processing.

### List all actions

```bash
npx playwright trace actions \
  test-results/bom-e2e-praman-gold-standard-Verify-BOM-header-chromium/trace.zip
```

Example output:

```text
[0]  page.goto                  https://my.s4hana.cloud/...     112ms
[1]  page.waitForFunction       UI5 bootstrap ready             4823ms
[2]  page.evaluate              bridge inject                     38ms
[3]  test.step                  "Navigate to BOM app"            ---
[4]  page.evaluate              hasher.setHash                    12ms
[5]  page.waitForFunction       bridge ready after nav          2104ms
[6]  test.step                  "Verify BOM header data"         ---
[7]  page.evaluate              getById BomHeader--material       9ms
[8]  expect                     toHaveValue '100-100'             4ms
```

### Filter actions by keyword (using standard shell tools)

```bash
npx playwright trace actions \
  test-results/.../trace.zip | grep -i "odata\|evaluate\|waitFor"
```

### Count actions per step

```bash
npx playwright trace actions test-results/.../trace.zip | grep "test.step"
```

---

## Extract Snapshots from a Trace

Get the DOM snapshot at a specific action index for post-mortem inspection.

### Snapshot at a specific action index

```bash
npx playwright trace snapshot \
  test-results/.../trace.zip \
  --action=7 \
  --output=snapshot-action-7.html
```

Opens the snapshot at action index 7 in the Trace Viewer, or writes an HTML
file when `--output` is provided.

### Snapshot at the last action (failure point)

```bash
# Get total action count first
ACTION_COUNT=$(npx playwright trace actions test-results/.../trace.zip | wc -l)
LAST_INDEX=$((ACTION_COUNT - 1))

npx playwright trace snapshot \
  test-results/.../trace.zip \
  --action=$LAST_INDEX \
  --output=failure-snapshot.html
```

---

## SAP-Specific Trace Analysis

### Identify slow OData requests

OData calls are recorded in the network HAR inside the trace ZIP. Extract them:

```bash
# Unzip the trace and inspect the network log
unzip -p test-results/.../trace.zip network.har | \
  python3 -c "
import json, sys
har = json.load(sys.stdin)
entries = har['log']['entries']
odata = [
  { 'url': e['request']['url'], 'status': e['response']['status'], 'timeMs': e['time'] }
  for e in entries
  if 'odata' in e['request']['url'].lower() or 'opu' in e['request']['url']
]
odata.sort(key=lambda x: x['timeMs'], reverse=True)
for e in odata[:20]:
    print(f\"{e['timeMs']:>8.0f}ms  {e['status']}  {e['url'][-80:]}\")
"
```

Look for:

| Threshold    | Interpretation                                                     |
| ------------ | ------------------------------------------------------------------ |
| < 500 ms     | Normal for cached/simple reads                                     |
| 500 ms – 2 s | Acceptable for complex queries                                     |
| 2 s – 5 s    | Investigate: missing `$select`, large result set                   |
| > 5 s        | Critical: likely missing index, Batch not used, or gateway timeout |

### Identify long UI5 rendering pauses

In the Trace Viewer timeline, look for:

- Long gaps between `page.evaluate` calls with no network activity — these are
  synchronous rendering cycles where UI5 is re-rendering the DOM.
- `waitForFunction` blocks that take > 3 s — indicates the bridge or UI5 took
  longer than expected to initialise.

From the `actions` output, flag slow `waitForFunction` calls:

```bash
npx playwright trace actions test-results/.../trace.zip | \
  awk '/waitForFunction/ { match($0, /[0-9]+ms/, m); if (m[0]+0 > 3000) print $0 }'
```

### Diagnose bridge injection timing

The bridge injection latency is visible in the trace as the gap between:

1. `page.goto` completing
2. `page.evaluate` returning `{ bridgeReady: true }`

In the `actions` output, these appear sequentially. A gap > 10 s indicates
the SAP backend was slow to serve the UI5 bootstrap or the FLP shell.

```bash
npx playwright trace actions test-results/.../trace.zip | \
  grep -E "goto|evaluate.*bridge|waitForFunction.*bridge"
```

### Post-mortem: failed test.step() analysis

1. Open the trace in the viewer:

   ```bash
   npx playwright trace open test-results/.../trace.zip
   ```

2. In the timeline, click the failing `test.step()` block.

3. Expand the step in the action list to see which child action threw.

4. Click the failing action to see:
   - The before/after DOM snapshot (did the control exist?)
   - The error message and stack trace
   - Any pending network requests at the moment of failure

5. Check the network tab for the timeframe around the failure:
   - Was an OData request still pending when the assertion ran?
   - Did a CSRF token fetch fail (403/CSRF_FAILURE)?
   - Did the backend return an error payload (200 with `error` in the body)?

### Detect SAP session expiry in traces

A session expiry shows up as:

- A `page.evaluate` returning the FLP login page URL instead of the app URL
- A network request to `/sap/bc/adt/sap-ui5-sdk/` returning 302 to `/sap/bc/ui2/logon/`

```bash
unzip -p test-results/.../trace.zip network.har | \
  python3 -c "
import json, sys
har = json.load(sys.stdin)
for e in har['log']['entries']:
    r = e['response']
    if r['status'] in (302, 401) or 'logon' in r.get('redirectURL', ''):
        print(r['status'], e['request']['url'][:100])
"
```

---

## CI Integration

### Attach traces as artifacts (GitHub Actions)

```yaml
- name: Run Praman SAP E2E tests
  run: |
    npx playwright test \
      tests/e2e/sap-cloud/ \
      --trace=on-first-retry

- name: Upload traces on failure
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-traces
    path: test-results/**/*.zip
    retention-days: 14
```

### Download and inspect a CI trace locally

```bash
# After downloading the artifact ZIP from GitHub Actions
unzip playwright-traces.zip -d traces/
npx playwright trace open traces/bom-e2e-praman-gold-standard-*/trace.zip
```

---

## Trace Options Reference

| CLI flag  | Values                    | Effect                                 |
| --------- | ------------------------- | -------------------------------------- |
| `--trace` | `on`                      | Record on every test                   |
| `--trace` | `off`                     | Disable tracing (default)              |
| `--trace` | `on-first-retry`          | Record only when a test is retried     |
| `--trace` | `retain-on-failure`       | Record all, keep only on failure       |
| `--trace` | `retain-on-first-failure` | Record all, keep on first failure only |

In `playwright.config.ts`:

```typescript
use: {
  trace: {
    mode: 'on-first-retry',  // same values as CLI
    snapshots: true,          // capture DOM snapshots (increases size)
    screenshots: true,        // capture screenshots at each action
    sources: true             // embed test source in the trace
  }
}
```

> **Note**: `snapshots: true` increases trace file size significantly for SAP
> apps (heavy DOM). Use `on-first-retry` in CI to limit storage impact.

---

## Troubleshooting

| Issue                                   | Cause                                          | Fix                                                            |
| --------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------- |
| `trace.zip` not found after test run    | `--trace` not set or test passed without retry | Re-run with `--trace=on`                                       |
| Trace Viewer blank / fails to open      | Port 9323 already in use                       | Pass `--port=9324` to `trace open`                             |
| OData requests missing from network HAR | Service worker intercepted requests            | Disable SW in config: `serviceWorkers: 'block'`                |
| Snapshots not in trace                  | `snapshots: false` in config                   | Set `snapshots: true` in trace config                          |
| Trace too large to open (> 200 MB)      | Long test with full snapshot recording         | Switch to `on-first-retry`, or use `--trace=retain-on-failure` |
| `actions` subcommand not recognised     | Playwright < 1.59 installed                    | Run `npm install @playwright/test@1.59`                        |
| Bridge `evaluate` timing invisible      | Bridge call grouped under a `test.step`        | Expand the step in Trace Viewer to see child actions           |
