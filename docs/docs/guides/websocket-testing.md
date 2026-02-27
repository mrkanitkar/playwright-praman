---
sidebar_position: 53
title: 'WebSocket & Real-Time Testing'
---

# WebSocket & Real-Time Testing

Some SAP applications use WebSocket connections for real-time features such as collaborative editing, live notifications, and push-based data updates. This guide covers how to monitor, intercept, and test WebSocket communication alongside Praman's UI5 bridge.

## SAP WebSocket Scenarios

WebSockets appear in several SAP contexts:

- **SAP Fiori Notifications**: The notification channel uses a WebSocket or long-polling connection to push alerts to the FLP shell.
- **Collaborative editing**: SAP applications like S/4HANA journals or SAP Build may use WebSockets for multi-user editing.
- **OData V4 with server-sent events**: Some OData V4 services push change notifications via WebSocket channels.
- **Custom real-time dashboards**: Business applications that display live KPIs or process monitoring data.

## Monitoring WebSocket Frames

Playwright provides built-in WebSocket monitoring through the `page.on('websocket')` event:

```typescript
import { test, expect } from 'playwright-praman';

test('monitor WebSocket messages', async ({ page, ui5 }) => {
  const wsMessages: { type: 'sent' | 'received'; data: string }[] = [];

  page.on('websocket', (ws) => {
    ws.on('framesent', (frame) => {
      wsMessages.push({ type: 'sent', data: frame.payload.toString() });
    });
    ws.on('framereceived', (frame) => {
      wsMessages.push({ type: 'received', data: frame.payload.toString() });
    });
  });

  await page.goto('/app#/dashboard');
  await ui5.waitForUI5();

  await test.step('Trigger an action that sends a WebSocket message', async () => {
    await ui5.click({ id: 'subscribeBtn' });
    await ui5.waitForUI5();
  });

  await test.step('Verify WebSocket communication occurred', async () => {
    expect(wsMessages.length).toBeGreaterThan(0);
    const sentMessages = wsMessages.filter((m) => m.type === 'sent');
    expect(sentMessages.length).toBeGreaterThan(0);
  });
});
```

## Waiting for WebSocket Events

Combine Playwright's WebSocket monitoring with Praman's `waitForUI5()` to wait for both the WebSocket message and the resulting UI update:

```typescript
test('data refreshes after WebSocket push', async ({ page, ui5 }) => {
  await page.goto('/app#/orders');
  await ui5.waitForUI5();

  await test.step('Wait for real-time update', async () => {
    // Create a promise that resolves when a specific WS message arrives
    const wsUpdate = new Promise<string>((resolve) => {
      page.on('websocket', (ws) => {
        ws.on('framereceived', (frame) => {
          const payload = frame.payload.toString();
          if (payload.includes('orderStatusChanged')) {
            resolve(payload);
          }
        });
      });
    });

    // Trigger the update from another source (API call, another user action, etc.)
    await page.request.post('/api/orders/123/status', {
      data: { status: 'Shipped' },
    });

    // Wait for the WebSocket message
    const message = await wsUpdate;
    expect(message).toContain('orderStatusChanged');

    // Wait for UI5 to process the update
    await ui5.waitForUI5();
  });

  await test.step('Verify UI reflects the update', async () => {
    const status = await ui5.getText({ id: 'orderStatusField' });
    expect(status).toBe('Shipped');
  });
});
```

## Intercepting WebSocket Connections

Use Playwright's route API to intercept WebSocket upgrade requests for testing error scenarios:

```typescript
test('app handles WebSocket connection failure gracefully', async ({ page, ui5 }) => {
  // Block WebSocket connections
  await page.route('**/ws/**', (route) => {
    route.abort('connectionfailed');
  });

  await page.goto('/app#/dashboard');
  await ui5.waitForUI5();

  await test.step('Verify fallback behavior', async () => {
    // App should fall back to polling or show a connection warning
    const warning = ui5.control({
      controlType: 'sap.m.MessageStrip',
      properties: { type: 'Warning' },
    });
    await expect(warning).toBeDefined();
  });
});
```

## Combining WebSocket Testing with ui5.waitForUI5()

The Praman bridge's `waitForUI5()` monitors the UI5 framework's internal pending request counter, but WebSocket messages are not tracked as pending requests by default. This means `waitForUI5()` may resolve before a WebSocket-triggered model update has been processed.

To handle this, add an explicit wait for the expected UI change after `waitForUI5()`:

```typescript
test('wait for WS-driven model update', async ({ page, ui5 }) => {
  await ui5.waitForUI5();

  // waitForUI5 ensures HTTP requests are done, but WS updates may still be pending
  // Use Playwright's built-in waiting for the expected text change
  await expect(page.getByText('Live: Connected')).toBeVisible({ timeout: 10_000 });

  // Now the WS-driven update is reflected in the DOM
  const status = await ui5.getText({ id: 'connectionStatus' });
  expect(status).toBe('Connected');
});
```

## Common Pitfalls

- **waitForUI5() does not wait for WebSocket updates**: The UI5 stability check monitors XHR/fetch requests and setTimeout callbacks, not WebSocket frames. Always add an explicit wait for the expected DOM or model change after a WebSocket event.
- **WebSocket timing in CI**: WebSocket connections may take longer to establish in CI environments. Use generous timeouts (10-15 seconds) for WebSocket-related waits.
- **Binary WebSocket frames**: Some SAP services send binary WebSocket frames (e.g., for file collaboration). Use `frame.payload` as a `Buffer` instead of calling `.toString()`.
- **Multiple WebSocket connections**: An SAP FLP page may open several WebSocket connections (notifications, collaboration, analytics). Filter by URL pattern to isolate the one you are testing.
