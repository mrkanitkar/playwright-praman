"""
Google ADK Client — Using praman-mcp-server for SAP test automation.

Architecture:
  ADK LlmAgent (Gemini) → McpToolset → praman-mcp-server → Playwright → SAP

Prerequisites:
  pip install google-adk
  npm install -g praman-mcp-server  # hypothetical package

Two integration paths demonstrated:
  1. Path A (Code Generation): ADK agent generates Playwright+praman test code
  2. Path B (Test Orchestration): ADK agent executes via MCP wrapper
"""

import asyncio
from google.adk.agents import LlmAgent
from google.adk.tools import McpToolset
from google.adk.tools.mcp import StdioConnectionParams

# ── Path B: Test Orchestration via MCP ──────────────────────────────

async def create_sap_test_agent():
    """Create an ADK agent that orchestrates SAP tests via praman MCP."""

    # Connect to praman-mcp-server
    tools, cleanup = await McpToolset.from_server(
        connection_params=StdioConnectionParams(
            command="npx",
            args=["praman-mcp-server"],
            env={
                "SAP_BASE_URL": "https://my-sap-system.example.com",
                "SAP_USERNAME": "testuser",
                "SAP_PASSWORD": "testpass",
            },
        )
    )

    agent = LlmAgent(
        model="gemini-2.0-flash",
        name="sap_test_executor",
        instruction="""You are an SAP test automation agent. You have access to tools
        that control a Playwright browser connected to an SAP S/4HANA system.

        When asked to test a SAP scenario:
        1. First authenticate using the authenticate tool
        2. Navigate to the appropriate Fiori app
        3. Interact with controls (buttons, inputs, tables)
        4. Verify expected outcomes
        5. Close the session when done

        Always wait_for_ui5 after navigation and input changes.
        Use discover_controls to explore the current page if unsure what's available.
        """,
        tools=tools,
    )

    return agent, cleanup


# ── Path A: Code Generation ─────────────────────────────────────────

async def create_code_gen_agent():
    """Create an ADK agent that generates Playwright+praman test code."""

    agent = LlmAgent(
        model="gemini-2.0-flash",
        name="sap_test_generator",
        instruction="""You are a test code generator for SAP UI5 applications.
        You generate Playwright tests using the playwright-praman plugin.

        Rules:
        1. Always import from 'playwright-praman': import { test, expect } from 'playwright-praman'
        2. Use praman fixtures (ui5, ui5Navigation, ui5Footer, intent) for ALL UI5 controls
        3. NEVER use page.click('#__...') or page.locator('.sapM...') for UI5 elements
        4. Use test.step() for each logical step
        5. Call ui5.waitForUI5() after navigation and input changes
        6. Use setValue() + fireChange() pattern for inputs

        Available fixtures:
        - ui5: control(), controls(), click(), fill(), waitForUI5()
        - ui5.table: getRows(id), clickRow(id, row), getCellValue(id, row, col)
        - ui5.dialog: waitFor(), confirm(), dismiss()
        - ui5Navigation: navigateToTile(title), navigateToIntent(obj, action)
        - ui5Footer: clickSave(), clickEdit(), clickCancel()
        - intent.core: fillField(label, value), assertField(label, expected)
        - fe.listReport: setFilter(field, value), search()
        """,
        tools=[],  # No tools needed — agent generates code as text output
    )

    return agent


# ── Multi-Agent Pipeline ────────────────────────────────────────────

async def run_sap_test_pipeline():
    """
    Multi-agent pipeline:
      1. Code gen agent produces a test plan
      2. Executor agent runs the test via MCP wrapper
      3. Results analyzed
    """
    code_gen = await create_code_gen_agent()
    executor, cleanup = await create_sap_test_agent()

    try:
        # Step 1: Generate test scenario
        # (In practice, use ADK's Runner to execute the agent)
        print("Pipeline: Code gen → Execute → Analyze")
        print("See ADK documentation for full Runner usage")
    finally:
        await cleanup()


if __name__ == "__main__":
    asyncio.run(run_sap_test_pipeline())
