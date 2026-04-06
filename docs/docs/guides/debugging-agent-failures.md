---
title: Debugging Agent Failures
description: Step-by-step guide for diagnosing and fixing failures in AI-agent-generated Praman tests
---

When an AI agent (`praman-sap-generate` or `praman-sap-heal`) generates a test and the test fails at runtime, use this guide to diagnose and fix the issue. For general troubleshooting not specific to agents, see the [Troubleshooting guide](./troubleshooting.md).

## When to Use This Guide

Use this guide when:

- You ran `praman-sap-generate` and the generated test fails on the first run.
- You ran `praman-sap-heal` and the healed test still fails.
- A previously-passing agent-generated test starts failing after an SAP system update.

## Step 1: Read the Error

Every Praman error includes a machine-readable `code`, a human-readable `message`, and actionable `suggestions`. Start by identifying the error category.

| Error prefix    | Category          | Likely agent issue                        |
| --------------- | ----------------- | ----------------------------------------- |
| `ERR_AUTH_*`    | Authentication    | Seed did not run or session expired       |
| `ERR_BRIDGE_*`  | Bridge injection  | Page is not a UI5 app or CSP is blocking  |
| `ERR_CONTROL_*` | Control discovery | Stale selector or wrong control type      |
| `ERR_NAV_*`     | Navigation        | Wrong tile name or app ID                 |
| `ERR_TIMEOUT_*` | Timeout           | Slow system or missing `waitForUI5()`     |
| `ERR_ODATA_*`   | OData operations  | Authorization issue or wrong entity set   |
| `ERR_AI_*`      | AI processing     | Context too large or provider unavailable |

For the full error code catalog, see the [Error Reference](./errors.md).

## Step 2: Check Selector Accuracy

Agent-generated selectors can become stale if the SAP app was updated after the discovery phase.

1. Run the snapshot command to capture the current page state:

   ```bash
   npx playwright-praman snapshot
   ```

2. Compare the selectors in the generated test against the snapshot output.

3. Look for these common selector issues:
   - **Wrong control type**: The agent used `sap.m.Input` but the app uses `sap.ui.mdc.field.FieldInput` (V4).
   - **Stale ID**: The control ID changed after a UI5 version upgrade or app redeployment.
   - **Missing `searchOpenDialogs`**: The control is inside a dialog but the selector does not include `searchOpenDialogs: true`.
   - **Hardcoded generated ID**: The selector uses a UI5-generated ID like `__button0` instead of a stable property-based selector.

4. Fix the selector and re-run, or run `praman-sap-heal` to auto-correct.

## Step 3: Check Auth State

Agent-generated tests rely on a seed script for authentication. If the seed did not run or the session expired, every subsequent test will fail.

1. Verify the session file exists:

   ```bash
   ls -la .auth/sap-session.json
   ```

2. If the file is missing or stale (check the timestamp), re-run the seed:

   ```bash
   npx playwright test --project=agent-seed-test
   ```

3. Verify your `playwright.config.ts` has the correct `storageState` path in the test project's `use` block.

4. If the session keeps expiring quickly, check the SAP system's session timeout settings and consider increasing the auth timeout in your Praman config.

## Step 4: Check Navigation

Navigation failures are common when the agent discovers tile names during planning that do not match at test time.

1. Run in headed mode to visually confirm the FLP tiles:

   ```bash
   npx playwright test --headed --project=your-project
   ```

2. Verify the tile name in the generated test matches the FLP exactly (including capitalization and special characters).

3. If the app uses intent-based navigation (`#SemanticObject-action`), verify the intent is correct:

   ```typescript
   await ui5Navigation.navigateToIntent(
     { semanticObject: 'PurchaseOrder', action: 'display' },
     { PurchaseOrder: '4500000001' },
   );
   ```

4. Check if the user's FLP catalog has changed — the test user may no longer have access to the tile.

## Step 5: Run the Healer

The `praman-sap-heal` agent can auto-fix many common issues.

1. Run the healer on the failing test:

   ```bash
   # Using the Claude Code prompt
   /praman-sap-heal
   ```

2. The healer will:
   - Re-discover the page to find updated selectors.
   - Fix control type mismatches (V2 vs V4).
   - Add missing `searchOpenDialogs: true` flags.
   - Insert missing `waitForUI5()` calls.
   - Update tile names to match the current FLP.

3. Review the healer's changes before committing — always verify that the fix matches your intended behavior.

## Common Agent Mistakes

These are the most frequent issues in agent-generated tests and how to fix them.

### Stale selectors

The agent discovered controls during planning, but the app was updated before the test ran.

**Fix**: Re-run `praman-sap-heal` or manually update selectors using `npx playwright-praman inspect`.

### Wrong control type

The agent used `sap.m.Input` for a V4 app that uses `sap.ui.mdc.Field` or `sap.ui.mdc.field.FieldInput`.

**Fix**: Check the UI5 version (V2 uses `sap.ui.comp.*`, V4 uses `sap.ui.mdc.*`). Update the control type accordingly.

### Missing searchOpenDialogs

The agent forgot to add `searchOpenDialogs: true` when targeting controls inside dialogs or popovers.

**Fix**: Add `searchOpenDialogs: true` to the selector object:

```typescript
await ui5.control({
  controlType: 'sap.m.Button',
  properties: { text: 'OK' },
  searchOpenDialogs: true,
});
```

### Forgotten waitForUI5

The agent omitted `await ui5.waitForUI5()` after navigation or data entry, causing race conditions.

**Fix**: Add `await ui5.waitForUI5()` after every navigation step and after `setValue()` + `fireChange()` sequences.

### Hardcoded values instead of dynamic data

The agent hardcoded test data (e.g., a specific purchase order number) that does not exist on the target system.

**Fix**: Use the `testData` fixture to generate or load test data:

```typescript
const data = await testData.generate('purchaseOrder');
await intent.procurement.createPurchaseOrder(data);
```

### Missing fireChange after setValue

The agent called `setValue()` but forgot the required `fireChange()` call, so UI5 validation and dependent fields do not update.

**Fix**: Always follow the three-step pattern:

```typescript
const input = await ui5.control({ id: 'materialInput' });
await input.setValue('MAT-001');
await input.fireChange({ value: 'MAT-001' });
await ui5.waitForUI5();
```

## Escalation

### When to re-run the planner

- The app UI has changed significantly (new views, restructured navigation).
- Multiple selectors are stale — it is faster to re-plan than to fix individually.
- The healer cannot fix the issue after two attempts.

### When to file an issue

File a GitHub issue on `playwright-praman` if:

- The error message lacks actionable suggestions.
- A valid selector consistently returns `ERR_CONTROL_NOT_FOUND` even though the control is visible.
- The healer introduces regressions.
- You encounter an error code not listed in the [Error Reference](./errors.md).

Include in the issue:

1. The full error output (with `code`, `attempted`, `suggestions`).
2. The generated test file (redact credentials).
3. UI5 version and SAP system type (BTP, on-premise, Work Zone).
4. Praman version (`npx playwright-praman --version`).
