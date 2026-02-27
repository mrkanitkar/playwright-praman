# MCP Server Wrapper Implementation Roadmap

## Overview

Praman is a Playwright PLUGIN — a library imported into test files. This roadmap covers building a thin MCP server wrapper (`praman-mcp-server`) that exposes Playwright+praman as a SAP test execution service for agentic frameworks.

## 1. Architecture

```
┌─────────────────────────────────────────────────────┐
│  Agentic Framework (ADK / LangGraph / AutoGen / etc.)│
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ Test Planner │  │ Test Executor│  │ Result     │  │
│  │ Agent        │  │ Agent        │  │ Analyzer   │  │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  │
│         │                │                  │         │
│         └────────┬───────┘──────────────────┘         │
│                  │                                     │
│            MCP Client                                  │
└──────────────────┬──────────────────────────────────┘
                   │  MCP Protocol (stdio / SSE)
┌──────────────────┴──────────────────────────────────┐
│            praman-mcp-server                          │
│                                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │         Session Manager                        │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │    │
│  │  │ Session 1 │  │ Session 2 │  │ Session N │   │    │
│  │  │ Browser   │  │ Browser   │  │ Browser   │   │    │
│  │  │ Context   │  │ Context   │  │ Context   │   │    │
│  │  │ Page      │  │ Page      │  │ Page      │   │    │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘   │    │
│  └───────┼──────────────┼──────────────┼─────────┘    │
│          │              │              │               │
│  ┌───────┴──────────────┴──────────────┴─────────┐    │
│  │     Praman Fixture Layer                        │    │
│  │  UI5Handler + Bridge + Proxy + Modules          │    │
│  └──────────────────────┬────────────────────────┘    │
└─────────────────────────┼────────────────────────────┘
                          │  HTTP / WebSocket
               ┌──────────┴──────────┐
               │   SAP S/4HANA       │
               │   (FLP + OData)     │
               └─────────────────────┘
```

## 2. Browser Lifecycle Management — The Critical Challenge

### Problem

Playwright requires a persistent browser context across multiple operations. MCP tools are stateless request/response. The wrapper MUST manage browser lifecycle.

### Recommended Approach: Session-per-Connection

```typescript
// One browser context per MCP transport connection
// Connection lifecycle = browser lifecycle

interface Session {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  bridgeInjected: boolean;
  storageState: string | null;
  lastActivity: number;
}

// Map: connectionId → Session
const sessions = new Map<string, Session>();
```

**Why session-per-connection?**

- Natural mapping: MCP connection = test session = browser
- StorageState persists within connection (auth survives across tools)
- Connection close triggers browser cleanup
- No shared state between sessions (parallel safe)

**Session timeout**: 5 minutes of inactivity → auto-close browser

### Alternative Approaches Considered

| Approach                 | Pros                       | Cons                     | Verdict           |
| ------------------------ | -------------------------- | ------------------------ | ----------------- |
| Session-per-connection   | Natural lifecycle, simple  | One session per client   | **Recommended**   |
| Browser pool             | Shared browsers, efficient | Complex state management | Over-engineered   |
| Singleton context        | Simplest code              | No parallelism           | Too limiting      |
| Session token in request | Most flexible              | Tool signatures polluted | Wrong abstraction |

## 3. Tools to Expose (Curated for LLM Consumption)

**Principle**: High-level SAP operations only. NOT every fixture method.

### Recommended Tool Set (~12 tools)

| #   | Tool Name           | Description                       | Input                                | Output            |
| --- | ------------------- | --------------------------------- | ------------------------------------ | ----------------- |
| 1   | `authenticate`      | Login to SAP system               | baseUrl, username?, password?        | Session status    |
| 2   | `navigate_to_app`   | Open a Fiori app                  | semanticObject, action, params?      | Current URL       |
| 3   | `navigate_home`     | Return to FLP home                | (none)                               | Current URL       |
| 4   | `discover_controls` | List interactive controls on page | controlType?, interactiveOnly?       | Control list JSON |
| 5   | `click_button`      | Click a UI5 button by text        | text                                 | Result            |
| 6   | `fill_input`        | Set input value and fire change   | label, value                         | Result            |
| 7   | `read_table`        | Read table rows as JSON           | tableId?, maxRows?                   | Row data JSON     |
| 8   | `wait_for_ui5`      | Wait for UI5 stability            | timeout?                             | Status            |
| 9   | `odata_query`       | Execute OData read query          | serviceUrl, entitySet, filter?, top? | Entity data JSON  |
| 10  | `take_screenshot`   | Capture page screenshot           | fullPage?                            | Base64 PNG image  |
| 11  | `get_page_info`     | Get current URL, title, hash      | (none)                               | Page metadata     |
| 12  | `close_session`     | Clean up browser resources        | (none)                               | Confirmation      |

### Tools NOT Exposed (internal complexity)

- Individual proxy methods (`getProperty`, `fireChange`, etc.)
- Bridge injection/readiness checks
- Selector parsing internals
- Config schema manipulation
- Reporter configuration

## 4. Tool Schema Design

```json
{
  "name": "fill_input",
  "description": "Fill a SAP UI5 input field by its label and fire the change event. The label is the visible text next to the input, not a CSS selector.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "label": {
        "type": "string",
        "description": "The visible label text for the input field, e.g., 'Vendor', 'Material Number'"
      },
      "value": {
        "type": "string",
        "description": "The value to enter into the field"
      }
    },
    "required": ["label", "value"]
  }
}
```

## 5. SAP Authentication Integration

```
Connection established
  ↓
authenticate(baseUrl, username, password)
  ↓
Navigate to SAP login page
  ↓
Fill credentials (Playwright native — login pages are HTML, not UI5)
  ↓
Wait for redirect to FLP home
  ↓
Save storageState to session
  ↓
All subsequent tool calls use the saved storageState
  ↓
Connection close: browser context destroyed (session cookies gone)
```

**Key**: Auth state lives in the BrowserContext's cookies/storage. No need to pass tokens between tool calls.

## 6. MCP Resources

| Resource URI            | Content                           | Purpose         |
| ----------------------- | --------------------------------- | --------------- |
| `praman://capabilities` | JSON list of tools + SAP modules  | Agent discovery |
| `praman://controls`     | List of UI5 control types         | Control lookup  |
| `praman://error-codes`  | All 58 error codes + descriptions | Error handling  |

## 7. MCP Prompts

| Prompt Name         | Description                            |
| ------------------- | -------------------------------------- |
| `sap-test-scenario` | Template for common SAP test workflows |
| `order-to-cash`     | Pre-built Order-to-Cash test flow      |
| `procure-to-pay`    | Pre-built Procure-to-Pay test flow     |

## 8. Transport Selection

| Transport           | Use Case                        | Rationale                           |
| ------------------- | ------------------------------- | ----------------------------------- |
| **stdio**           | Local development, CLI usage    | Simple, reliable, no network setup  |
| **Streamable HTTP** | Remote CI/CD, shared SAP access | Multiple clients, firewall-friendly |

**Recommendation**: Start with stdio, add Streamable HTTP in v2.

## 9. Implementation Effort Estimate

| Component               | Lines of Code | Effort          |
| ----------------------- | ------------- | --------------- |
| MCP server scaffold     | ~100          | Trivial (1hr)   |
| Session manager         | ~150          | Small (4hrs)    |
| 12 tool implementations | ~600          | Medium (2 days) |
| SAP auth integration    | ~200          | Small (1 day)   |
| Error wrapping          | ~100          | Trivial (2hrs)  |
| Resources + Prompts     | ~150          | Small (4hrs)    |
| Tests                   | ~400          | Medium (1 day)  |
| Documentation           | ~200          | Small (4hrs)    |
| **Total**               | **~1,900**    | **~5 days**     |

**Dependencies**: `@modelcontextprotocol/sdk`, `@playwright/test`, `playwright-praman`

**Verdict**: This is a **weekend-to-week project**, not a major initiative. The hardest part is browser lifecycle management, which session-per-connection solves elegantly.

## 10. Testing Strategy

1. **Unit tests**: Mock Playwright Page/Browser, verify tool handlers
2. **Integration tests**: Real browser against a mock SAP app (static HTML)
3. **MCP protocol tests**: Verify tool schema, request/response format
4. **E2E tests**: Real browser against SAP system (CI with credentials)

## 11. Documentation Needed

- README with installation and usage
- Tool reference (name, description, input, output per tool)
- Architecture diagram
- Authentication guide
- Framework integration examples (ADK, LangGraph, AutoGen, OpenAI)
- Troubleshooting (browser launch, auth failures, timeouts)
