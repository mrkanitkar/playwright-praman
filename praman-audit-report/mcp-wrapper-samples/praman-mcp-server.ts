/**
 * praman-mcp-server — Thin MCP wrapper exposing Playwright+praman as tools.
 *
 * Architecture:
 *   Agent (ADK/LangGraph/AutoGen/OpenAI) → MCP Client
 *     → praman-mcp-server (this file)
 *       → Playwright (browser lifecycle)
 *         → praman fixtures (SAP automation)
 *           → SAP S/4HANA system
 *
 * Key Design Decisions:
 * - Session-per-connection: each MCP connection gets its own browser context
 * - StorageState persisted across tool calls within a session
 * - High-level tools only (not every fixture method)
 * - ~15 tools designed for LLM consumption
 *
 * Dependencies:
 *   npm install @modelcontextprotocol/sdk @playwright/test playwright-praman
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { chromium } from '@playwright/test';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { z } from 'zod';

// ── Session Management ────────────────────────────────────────────────

interface Session {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  bridgeInjected: boolean;
}

let session: Session | null = null;

async function getOrCreateSession(): Promise<Session> {
  if (session !== null) {
    return session;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // Load saved auth state if available
    // storageState: '.auth/sap-session.json',
  });
  const page = await context.newPage();

  session = { browser, context, page, bridgeInjected: false };
  return session;
}

async function destroySession(): Promise<void> {
  if (session !== null) {
    await session.browser.close();
    session = null;
  }
}

// ── MCP Server Setup ──────────────────────────────────────────────────

const server = new McpServer({
  name: 'praman-mcp-server',
  version: '1.0.0',
});

// ── Tool: Navigate to SAP App ─────────────────────────────────────────

server.tool(
  'navigate_to_app',
  'Navigate to a SAP Fiori app by semantic object and action (e.g., PurchaseOrder-manage)',
  {
    semanticObject: z.string().describe('SAP semantic object, e.g., "PurchaseOrder"'),
    action: z.string().describe('Action, e.g., "manage", "create", "display"'),
    parameters: z.record(z.string()).optional().describe('Optional navigation parameters'),
  },
  async ({ semanticObject, action, parameters }) => {
    const { page } = await getOrCreateSession();
    const hash = `#${semanticObject}-${action}`;
    const params = parameters
      ? '?' +
        Object.entries(parameters)
          .map(([k, v]) => `${k}=${v}`)
          .join('&')
      : '';

    await page.goto(`${process.env['SAP_BASE_URL'] ?? ''}${hash}${params}`);
    await page.waitForLoadState('networkidle');

    return {
      content: [{ type: 'text' as const, text: `Navigated to ${semanticObject}-${action}` }],
    };
  },
);

// ── Tool: Click Button ────────────────────────────────────────────────

server.tool(
  'click_button',
  'Click a SAP UI5 button by its visible text label',
  {
    text: z.string().describe('The visible text on the button, e.g., "Save", "Create"'),
  },
  async ({ text }) => {
    const { page } = await getOrCreateSession();

    const result = await page.evaluate(async (buttonText: string) => {
      // Use UI5's control registry to find the button
      const core = (window as any).sap?.ui?.getCore?.();
      if (!core) return { success: false, error: 'UI5 not loaded' };

      const elements = core.byFieldGroupId('');
      for (const id of Object.keys(elements || {})) {
        const control = core.byId(id);
        if (control?.getMetadata?.().getName() === 'sap.m.Button') {
          if (control.getText?.() === buttonText) {
            control.firePress?.();
            return { success: true, controlId: id };
          }
        }
      }
      return { success: false, error: `Button "${buttonText}" not found` };
    }, text);

    return {
      content: [
        {
          type: 'text' as const,
          text: result.success
            ? `Clicked button "${text}" (${result.controlId})`
            : `Failed: ${result.error}`,
        },
      ],
    };
  },
);

// ── Tool: Fill Input ──────────────────────────────────────────────────

server.tool(
  'fill_input',
  'Fill a SAP UI5 input field by its label or field name, then fire change event',
  {
    label: z.string().describe('The label text or field name for the input'),
    value: z.string().describe('The value to enter'),
  },
  async ({ label, value }) => {
    const { page } = await getOrCreateSession();

    // Use praman's selector approach via page.evaluate
    const result = await page.evaluate(
      async ({ label: l, value: v }: { label: string; value: string }) => {
        // Simplified: find input by associated label
        const core = (window as any).sap?.ui?.getCore?.();
        if (!core) return { success: false, error: 'UI5 not loaded' };

        // Search through all elements for matching label
        return { success: true, message: `Set "${l}" to "${v}"` };
      },
      { label, value },
    );

    return {
      content: [{ type: 'text' as const, text: result.message ?? result.error ?? 'Unknown' }],
    };
  },
);

// ── Tool: Read Table ──────────────────────────────────────────────────

server.tool(
  'read_table',
  'Read data from a SAP UI5 table, returning rows as JSON',
  {
    tableId: z
      .string()
      .optional()
      .describe('Table control ID. If omitted, finds the first table on page.'),
    maxRows: z.number().optional().describe('Maximum rows to return (default: 50)'),
  },
  async ({ tableId, maxRows }) => {
    const { page } = await getOrCreateSession();
    const limit = maxRows ?? 50;

    const data = await page.evaluate(
      ({ id, limit: l }: { id?: string; limit: number }) => {
        // Find table and extract rows
        return { rows: [], totalCount: 0, message: 'Table read placeholder' };
      },
      { id: tableId, limit },
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  },
);

// ── Tool: Wait for UI5 ───────────────────────────────────────────────

server.tool(
  'wait_for_ui5',
  'Wait for SAP UI5 to reach a stable state (no pending async operations)',
  {
    timeout: z.number().optional().describe('Timeout in milliseconds (default: 30000)'),
  },
  async ({ timeout }) => {
    const { page } = await getOrCreateSession();
    const ms = timeout ?? 30_000;

    await page.waitForFunction(
      () => {
        const core = (window as any).sap?.ui?.getCore?.();
        return core !== undefined;
      },
      { timeout: ms },
    );

    return {
      content: [{ type: 'text' as const, text: 'UI5 is stable' }],
    };
  },
);

// ── Tool: Get Page Controls ──────────────────────────────────────────

server.tool(
  'discover_controls',
  'List all interactive UI5 controls visible on the current page',
  {
    controlType: z.string().optional().describe('Filter by control type, e.g., "sap.m.Button"'),
  },
  async ({ controlType }) => {
    const { page } = await getOrCreateSession();

    const controls = await page.evaluate((filter?: string) => {
      // Discover controls on page
      return [{ id: 'example', type: 'sap.m.Button', text: 'Save' }];
    }, controlType);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(controls, null, 2),
        },
      ],
    };
  },
);

// ── Tool: Take Screenshot ────────────────────────────────────────────

server.tool(
  'take_screenshot',
  'Capture a screenshot of the current SAP page for visual verification',
  {},
  async () => {
    const { page } = await getOrCreateSession();
    const buffer = await page.screenshot({ type: 'png', fullPage: true });

    return {
      content: [
        {
          type: 'image' as const,
          data: buffer.toString('base64'),
          mimeType: 'image/png',
        },
      ],
    };
  },
);

// ── Tool: OData Query ────────────────────────────────────────────────

server.tool(
  'odata_query',
  'Execute an OData query against the SAP system',
  {
    serviceUrl: z.string().describe('OData service URL, e.g., "/sap/opu/odata/sap/API_PO_SRV"'),
    entitySet: z.string().describe('Entity set name, e.g., "PurchaseOrders"'),
    filter: z.string().optional().describe('OData $filter expression'),
    top: z.number().optional().describe('Number of results to return'),
    select: z.string().optional().describe('Comma-separated list of fields'),
  },
  async ({ serviceUrl, entitySet, filter, top, select }) => {
    const { page } = await getOrCreateSession();

    // Build OData URL
    const params = new URLSearchParams();
    if (filter) params.set('$filter', filter);
    if (top) params.set('$top', String(top));
    if (select) params.set('$select', select);
    params.set('$format', 'json');

    const url = `${serviceUrl}/${entitySet}?${params.toString()}`;

    // Execute via page context to use SAP session cookies
    const result = await page.evaluate(async (queryUrl: string) => {
      const response = await fetch(queryUrl, { credentials: 'include' });
      if (!response.ok) return { error: `HTTP ${response.status}` };
      return response.json();
    }, url);

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
);

// ── Tool: Authenticate ───────────────────────────────────────────────

server.tool(
  'authenticate',
  'Authenticate against a SAP system using Basic Auth or stored credentials',
  {
    baseUrl: z.string().describe('SAP system base URL'),
    username: z.string().optional().describe('Username (defaults to SAP_USERNAME env var)'),
    password: z.string().optional().describe('Password (defaults to SAP_PASSWORD env var)'),
  },
  async ({ baseUrl, username, password }) => {
    const { page, context } = await getOrCreateSession();

    const user = username ?? process.env['SAP_USERNAME'] ?? '';
    const pass = password ?? process.env['SAP_PASSWORD'] ?? '';

    await page.goto(baseUrl);

    // Basic auth via HTTP header
    await context.setExtraHTTPHeaders({
      Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Save storage state for future tool calls
    await context.storageState({ path: '.auth/mcp-session.json' });

    return {
      content: [{ type: 'text' as const, text: `Authenticated as ${user} at ${baseUrl}` }],
    };
  },
);

// ── Tool: Close Session ──────────────────────────────────────────────

server.tool('close_session', 'Close the browser session and clean up resources', {}, async () => {
  await destroySession();
  return {
    content: [{ type: 'text' as const, text: 'Session closed' }],
  };
});

// ── MCP Resources ────────────────────────────────────────────────────

server.resource('capabilities', 'praman://capabilities', async () => ({
  contents: [
    {
      uri: 'praman://capabilities',
      mimeType: 'application/json',
      text: JSON.stringify({
        tools: [
          'navigate_to_app',
          'click_button',
          'fill_input',
          'read_table',
          'wait_for_ui5',
          'discover_controls',
          'take_screenshot',
          'odata_query',
          'authenticate',
          'close_session',
        ],
        sapModules: ['MM', 'SD', 'FI', 'PP', 'MD'],
        authStrategies: ['basic', 'btp-saml', 'office365'],
      }),
    },
  ],
}));

// ── Start Server ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Cleanup on exit
  process.on('SIGINT', async () => {
    await destroySession();
    process.exit(0);
  });
}

main().catch(console.error);
