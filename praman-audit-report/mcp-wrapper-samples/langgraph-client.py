"""
LangGraph Client — Using praman-mcp-server for SAP test automation.

Architecture:
  LangGraph StateGraph → ToolNode → MCP Client → praman-mcp-server → SAP

Prerequisites:
  pip install langgraph langchain-mcp-adapters langchain-anthropic
  npm install -g praman-mcp-server  # hypothetical package

Two paths:
  Path A: LangGraph agent generates Playwright+praman test code
  Path B: LangGraph agent executes tests via praman MCP wrapper
"""

import asyncio
from typing import Annotated, TypedDict
from langchain_anthropic import ChatAnthropic
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, create_react_agent


# ── Path B: Test Orchestration via MCP ──────────────────────────────

async def run_sap_test_via_mcp():
    """Execute SAP tests using praman MCP wrapper with LangGraph."""

    # Connect to praman-mcp-server via langchain-mcp-adapters
    async with MultiServerMCPClient(
        {
            "praman": {
                "command": "npx",
                "args": ["praman-mcp-server"],
                "env": {
                    "SAP_BASE_URL": "https://my-sap-system.example.com",
                    "SAP_USERNAME": "testuser",
                    "SAP_PASSWORD": "testpass",
                },
            }
        }
    ) as client:
        # Get tools from the MCP server
        tools = client.get_tools()

        # Create a ReAct agent with praman tools
        model = ChatAnthropic(model="claude-sonnet-4-20250514")
        agent = create_react_agent(model, tools)

        # Run a test scenario
        result = await agent.ainvoke({
            "messages": [{
                "role": "user",
                "content": """
                Test the following SAP scenario:
                1. Authenticate to the SAP system
                2. Navigate to the Purchase Order management app
                3. Read the table of purchase orders
                4. Verify there are at least 3 rows
                5. Take a screenshot for evidence
                6. Close the session
                """
            }]
        })

        for message in result["messages"]:
            print(f"{message.type}: {message.content[:200]}")


# ── Path A: Code Generation ─────────────────────────────────────────

async def generate_praman_test_code():
    """Use LangGraph to generate Playwright+praman test code."""

    model = ChatAnthropic(model="claude-sonnet-4-20250514")

    # No tools needed — agent generates code as text
    result = await model.ainvoke([
        {
            "role": "system",
            "content": """You generate Playwright tests using playwright-praman.
            Rules:
            1. import { test, expect } from 'playwright-praman'
            2. Use ui5 fixtures for ALL UI5 controls
            3. NEVER use page.click('#__...') for UI5 elements
            4. Use test.step() for each logical step
            5. Call ui5.waitForUI5() after navigation"""
        },
        {
            "role": "user",
            "content": "Write a test that creates a purchase order for vendor 100001"
        }
    ])

    print("Generated test code:")
    print(result.content)


# ── StateGraph Pipeline ─────────────────────────────────────────────

class TestPipelineState(TypedDict):
    """State for the test pipeline graph."""
    messages: Annotated[list, add_messages]
    test_plan: str
    test_results: str
    phase: str


async def run_pipeline():
    """
    LangGraph pipeline:
      plan_tests → generate_code → execute_tests → analyze_results
    """

    async def plan_tests(state: TestPipelineState) -> TestPipelineState:
        """Plan which tests to run."""
        state["phase"] = "planning"
        state["test_plan"] = "1. Navigate to PO app\n2. Create PO\n3. Verify"
        return state

    async def execute_tests(state: TestPipelineState) -> TestPipelineState:
        """Execute tests via MCP wrapper."""
        state["phase"] = "executing"
        state["test_results"] = "All tests passed"
        return state

    # Build the graph
    graph = StateGraph(TestPipelineState)
    graph.add_node("plan", plan_tests)
    graph.add_node("execute", execute_tests)
    graph.add_edge(START, "plan")
    graph.add_edge("plan", "execute")
    graph.add_edge("execute", END)

    app = graph.compile()

    result = await app.ainvoke({
        "messages": [],
        "test_plan": "",
        "test_results": "",
        "phase": "init",
    })

    print(f"Pipeline complete. Phase: {result['phase']}")
    print(f"Results: {result['test_results']}")


if __name__ == "__main__":
    asyncio.run(run_sap_test_via_mcp())
