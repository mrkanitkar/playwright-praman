---
title: 'Security Testing Patterns'
---

# Security Testing Patterns

SAP applications handle sensitive business data and must enforce strict security boundaries. This guide covers automated security testing patterns
with Praman, including CSRF validation, XSS input testing, authorization boundaries, and session handling.

## CSRF Token Validation

SAP UI5 applications use CSRF (Cross-Site Request Forgery) tokens for write operations. Verify that the application correctly fetches and sends CSRF tokens:

```typescript
import { test, expect } from 'playwright-praman';

test('CSRF token is sent with POST requests', async ({ page, ui5 }) => {
  await ui5.waitForUI5();

  const csrfRequests: { url: string; token: string | null }[] = [];

  page.on('request', (request) => {
    if (request.method() === 'POST') {
      csrfRequests.push({
        url: request.url(),
        token: request.headers()['x-csrf-token'] ?? null,
      });
    }
  });

  await test.step('Perform a write operation', async () => {
    await ui5.fill({ id: 'nameInput' }, 'Test Value');
    await ui5.click({ id: 'saveBtn' });
    await ui5.waitForUI5();
  });

  await test.step('Verify CSRF token was included', async () => {
    const postRequests = csrfRequests.filter((r) => r.url.includes('/odata/'));
    expect(postRequests.length).toBeGreaterThan(0);
    for (const req of postRequests) {
      expect(req.token).not.toBeNull();
    }
  });
});
```

## XSS Input Testing

Test that the application properly sanitizes user input to prevent cross-site scripting:

```typescript
test('XSS payloads are sanitized in input fields', async ({ ui5, page }) => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    "javascript:alert('xss')",
  ];

  for (const payload of xssPayloads) {
    await test.step(`Test payload: ${payload.slice(0, 30)}...`, async () => {
      await ui5.fill({ id: 'descriptionInput' }, payload);
      await ui5.waitForUI5();

      const innerHTML = await page.locator('#descriptionInput').innerHTML();
      expect(innerHTML).not.toContain('<script>');
      expect(innerHTML).not.toContain('onerror=');
    });
  }
});
```

## Authorization Boundary Testing

Verify that users can only access resources permitted by their SAP role assignments. Use multiple auth states for different roles:

```typescript
import { test, expect } from 'playwright-praman';

test.describe('Admin-only features', () => {
  test.use({ storageState: '.auth/viewer.json' });

  test('viewer cannot access admin settings', async ({ page, ui5 }) => {
    await page.goto('/app#/admin/settings');
    await ui5.waitForUI5();

    // Should be redirected or shown an access denied message
    const errorMessage = ui5.control({
      controlType: 'sap.m.MessagePage',
      properties: { showHeader: false },
    });
    await expect(errorMessage).toBeDefined();
  });

  test('viewer cannot see delete button', async ({ page, ui5 }) => {
    await page.goto('/app#/orders/12345');
    await ui5.waitForUI5();

    const deleteButtons = await ui5.controls({
      controlType: 'sap.m.Button',
      properties: { text: 'Delete' },
    });
    expect(deleteButtons).toHaveLength(0);
  });
});

test.describe('Admin features', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('admin can see delete button', async ({ page, ui5 }) => {
    await page.goto('/app#/orders/12345');
    await ui5.waitForUI5();

    await expect(
      ui5.control({
        controlType: 'sap.m.Button',
        properties: { text: 'Delete' },
      }),
    ).toBeDefined();
  });
});
```

## Session Timeout Handling

SAP systems enforce session timeouts. Test that the application handles expired sessions gracefully:

```typescript
test('session timeout redirects to login', async ({ page, ui5, context }) => {
  await ui5.waitForUI5();

  await test.step('Clear session cookies to simulate timeout', async () => {
    await context.clearCookies();
  });

  await test.step('Trigger a server call and verify redirect', async () => {
    await ui5.click({ id: 'refreshBtn' });
    await page.waitForURL(/.*login.*/);
  });
});
```

## Common Pitfalls

- **Testing with admin-only accounts**: Always test authorization boundaries from both sides -- verify that permitted actions work AND that forbidden actions are blocked.
- **CSRF token caching**: SAP caches CSRF tokens per session. If your test clears cookies mid-test, the cached token becomes invalid. Re-fetch the token after any session manipulation.
- **XSS in rich text editors**: SAP UI5's `RichTextEditor` intentionally allows HTML input. Do not flag this as an XSS vulnerability. Focus XSS tests on plain input fields.
- **Session timeout values**: SAP session timeouts are server-configured (typically 30-60 minutes). Do not rely on waiting for actual timeout
  in tests. Simulate it by clearing cookies or manipulating session state.
