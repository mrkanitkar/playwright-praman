# Failure Artifacts

When a Praman test fails, the `failureArtifactsCapture` fixture automatically
attaches diagnostic artifacts to the test result. These artifacts appear in the
Playwright HTML reporter and trace viewer, giving you immediate context for
debugging without re-running the test.

## Attached Artifacts

| Artifact Name                | Content Type       | Description                                                             |
| ---------------------------- | ------------------ | ----------------------------------------------------------------------- |
| `failure-screenshot`         | `image/png`        | Full-page screenshot of the browser at the moment of failure            |
| `failure-control-tree`       | `application/json` | UI5 control tree snapshot (IDs, types, properties, up to 5000 controls) |
| `failure-context`            | `application/json` | Page URL, title, and timestamp when the failure was captured            |
| `praman-failure-suggestions` | `text/plain`       | Fix suggestions extracted from PramanError messages (when available)    |

### Screenshot

A full-page PNG screenshot captured immediately after the test fails. Useful for
seeing the visual state of the application, including dialogs, busy indicators,
and unexpected navigation.

### Control Tree

A JSON snapshot of the entire UI5 control tree (up to `maxDepth: 10` and
`maxControls: 5000`). Includes control IDs, types, and key properties. Use this
to verify that expected controls exist and are in the correct hierarchy.

### Page Context

A small JSON object containing:

```json
{
  "url": "https://sap.example.com/fiori#PurchaseOrder-manage",
  "title": "Manage Purchase Orders",
  "capturedAt": "2026-04-06T12:34:56.789Z"
}
```

### Failure Suggestions

When a test fails with a `PramanError` that includes a `suggestions[]` array,
those suggestions are serialized into the error message with this format:

```text
Suggestions:
* Verify the control ID exists in the UI5 view
* Check if the page has fully loaded (waitForUI5Stable)
* Try using controlType + properties instead of ID
```

The fixture extracts these suggestions from `testInfo.errors` and attaches them
as a plain-text artifact named `praman-failure-suggestions`. If multiple errors
contain suggestions, they are joined with a `---` separator.

This makes fix guidance immediately visible in the Playwright HTML report without
needing to scroll through stack traces.

## Viewing Artifacts

### HTML Reporter

Run your tests with the HTML reporter:

```bash
npx playwright test --reporter=html
```

Open the report and click on a failed test. Artifacts appear in the
**Attachments** section below the error message.

### Trace Viewer

If tracing is enabled, artifacts are also available in the trace viewer:

```bash
npx playwright show-trace trace.zip
```

## Disabling Failure Artifacts

Set `captureFailureArtifacts: false` in your Praman configuration:

```typescript
// playwright.config.ts
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  captureFailureArtifacts: false,
});
```

Or via environment variable:

```bash
PRAMAN_CAPTURE_FAILURE_ARTIFACTS=false npx playwright test
```

When disabled, none of the four artifacts are captured on failure.

## Error Resilience

All artifact capture is wrapped in individual `try/catch` blocks. If one capture
fails (e.g., the page was already closed before the screenshot could be taken),
the others still execute. Capture failures are logged at `debug` level and never
cause secondary test failures.
