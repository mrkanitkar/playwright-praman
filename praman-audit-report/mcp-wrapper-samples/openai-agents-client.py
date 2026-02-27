"""
OpenAI Agents SDK Client — Using praman-mcp-server for SAP test automation.

Architecture:
  OpenAI Agent → MCPServerStdio → praman-mcp-server → Playwright → SAP

Prerequisites:
  pip install openai-agents
  npm install -g praman-mcp-server  # hypothetical package

Two paths:
  Path A: Codex/Copilot generates Playwright+praman test code (reads AGENTS.md)
  Path B: OpenAI Agents SDK orchestrates via praman MCP wrapper
"""

import asyncio
from agents import Agent, Runner
from agents.mcp import MCPServerStdio


# ── Path B: Test Orchestration via MCP ──────────────────────────────

async def run_sap_test_via_mcp():
    """Execute SAP tests using praman MCP wrapper with OpenAI Agents SDK."""

    # Connect to praman-mcp-server
    praman_server = MCPServerStdio(
        command="npx",
        args=["praman-mcp-server"],
        env={
            "SAP_BASE_URL": "https://my-sap-system.example.com",
            "SAP_USERNAME": "testuser",
            "SAP_PASSWORD": "testpass",
        },
    )

    async with praman_server:
        # Create agent with praman tools
        agent = Agent(
            name="sap_test_executor",
            instructions="""You are an SAP test automation agent with access to
            praman tools for controlling a Playwright browser connected to SAP.

            Workflow:
            1. authenticate - Login to the SAP system
            2. navigate_to_app - Go to the target Fiori app
            3. wait_for_ui5 - Wait for UI5 to stabilize
            4. discover_controls - See what's on the page
            5. fill_input / click_button - Interact with controls
            6. read_table - Read table data
            7. take_screenshot - Capture evidence
            8. close_session - Clean up

            Always wait_for_ui5 after navigation and input changes.""",
            mcp_servers=[praman_server],
        )

        # Run the agent
        result = await Runner.run(
            agent,
            input="Authenticate, navigate to Purchase Order management, "
                  "read the PO table, and take a screenshot."
        )

        print(f"Agent output: {result.final_output}")


# ── Path B with Handoffs ────────────────────────────────────────────

async def run_with_handoffs():
    """
    Multi-agent workflow with handoffs:
      test_planner → test_executor → result_analyzer
    """

    praman_server = MCPServerStdio(
        command="npx",
        args=["praman-mcp-server"],
    )

    async with praman_server:
        # Result analyzer (no tools needed)
        result_analyzer = Agent(
            name="result_analyzer",
            instructions="""Analyze test execution results and provide:
            1. Pass/fail summary
            2. Any errors encountered
            3. Screenshots captured
            4. Recommendations for improvement""",
        )

        # Test executor (has praman tools)
        test_executor = Agent(
            name="test_executor",
            instructions="""Execute the test plan using praman tools.
            After execution, hand off to result_analyzer with the results.""",
            mcp_servers=[praman_server],
            handoffs=[result_analyzer],
        )

        # Test planner (no tools, generates plan)
        test_planner = Agent(
            name="test_planner",
            instructions="""Given a business requirement, create a step-by-step
            test plan. Then hand off to test_executor to run the tests.

            Plan format:
            1. Authentication step
            2. Navigation steps
            3. Interaction steps (with specific control types and values)
            4. Verification steps (expected outcomes)""",
            handoffs=[test_executor],
        )

        # Run the pipeline
        result = await Runner.run(
            test_planner,
            input="Test that a new purchase order can be created for vendor 100001 "
                  "with material MAT-001 in plant 1000."
        )

        print(f"Pipeline result: {result.final_output}")


# ── Approval Gates for Sensitive Operations ──────────────────────────

async def run_with_approval():
    """
    Use require_approval to gate sensitive SAP operations.
    OData writes and auth require human confirmation.
    """

    praman_server = MCPServerStdio(
        command="npx",
        args=["praman-mcp-server"],
    )

    async with praman_server:
        agent = Agent(
            name="safe_sap_tester",
            instructions="""Test SAP scenarios with caution.
            Read operations are safe.
            Write operations (creating/updating records) need approval.""",
            mcp_servers=[praman_server],
            # In practice, configure tool-level approval via the SDK
        )

        result = await Runner.run(
            agent,
            input="Read the purchase order table and report the count."
        )

        print(f"Result: {result.final_output}")


if __name__ == "__main__":
    asyncio.run(run_sap_test_via_mcp())
