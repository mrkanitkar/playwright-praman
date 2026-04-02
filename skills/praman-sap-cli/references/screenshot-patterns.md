# Screenshot Patterns for SAP Test Automation

Two patterns serve different purposes in generated specs. Use the right one for each context.

---

## Pattern 1: Visual Regression (Default for Assertions)

Use `expect(page).toHaveScreenshot()` for verifying UI state at each test step.
Playwright 1.59 web-first assertion: auto-manages baseline images, fails on visual diff.

```typescript
await test.step('Step 1: Verify FLP Home', async () => {
  await ui5.waitForUI5();
  await expect(page).toHaveScreenshot('step-01-flp-home.png');
});

await test.step('Step 3: Dialog Open', async () => {
  await ui5.press({ id: IDS.createBtn });
  await ui5.waitForUI5();
  await expect(page).toHaveScreenshot('step-03-dialog-open.png');
});
```

**When to use:**

- After each `test.step()` completes successfully
- For verifying page layout, control visibility, dialog state
- For regression detection across test runs

**Naming convention:** `step-{NN}-{description}.png`

---

## Pattern 2: Evidence Capture (For Errors/Debug)

Use `page.screenshot()` inside try/catch blocks for capturing error state before cleanup.
This is manual capture -- no baseline comparison, no auto-fail on diff.

```typescript
await test.step('Step 12: Handle Error', async () => {
  try {
    const errorDialog = await ui5.control({
      controlType: 'sap.m.Dialog',
      searchOpenDialogs: true,
      properties: { type: 'Message' },
    });
    // Capture error state BEFORE closing dialog
    await page.screenshot({ path: 'test-results/step-12-error-evidence.png' });

    await ui5.press({
      controlType: 'sap.m.Button',
      properties: { text: 'Close' },
      searchOpenDialogs: true,
    });
    await ui5.waitForUI5();
  } catch {
    // No error dialog -- success path
    await expect(page).toHaveScreenshot('step-12-success.png');
  }
});
```

**When to use:**

- Inside try/catch error-handling blocks
- Before closing error dialogs (capture evidence before it disappears)
- For on-failure debug screenshots
- When you need to save to a specific path in `test-results/`

---

## During CLI Discovery (Agent Workflow)

When the agent is exploring the SAP app via `playwright-cli`, take screenshots at every checkpoint:

```bash
# After login
playwright-cli -s=sap screenshot --filename=step-01-after-login.png

# After navigation
playwright-cli -s=sap screenshot --filename=step-02-after-nav.png

# After dialog open
playwright-cli -s=sap screenshot --filename=step-03-dialog-open.png

# After fill
playwright-cli -s=sap screenshot --filename=step-04-after-fill.png
```

These screenshots serve as evidence for the test plan and help identify control layout.

---

## Summary

| Context                 | Pattern           | Method                                                     |
| ----------------------- | ----------------- | ---------------------------------------------------------- |
| Happy path verification | Visual regression | `await expect(page).toHaveScreenshot('name.png')`          |
| Error state evidence    | Manual capture    | `await page.screenshot({ path: 'test-results/name.png' })` |
| CLI discovery workflow  | Agent checkpoint  | `playwright-cli screenshot --filename=name.png`            |
