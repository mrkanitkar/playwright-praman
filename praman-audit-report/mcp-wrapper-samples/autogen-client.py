"""
AutoGen Client — Using praman-mcp-server for SAP test automation.

Architecture:
  AutoGen AssistantAgent → McpWorkbench → praman-mcp-server → Playwright → SAP

Prerequisites:
  pip install autogen-agentchat autogen-ext[mcp]
  npm install -g praman-mcp-server  # hypothetical package

Two paths:
  Path A: AutoGen agent generates Playwright+praman test code
  Path B: AutoGen agent executes tests via praman MCP wrapper
"""

import asyncio
from autogen_agentchat.agents import AssistantAgent
from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.conditions import TextMentionTermination
from autogen_ext.tools.mcp import McpWorkbench, StdioMcpServerConfig


# ── Path B: Test Orchestration via MCP ──────────────────────────────

async def run_sap_test_via_mcp():
    """Execute SAP tests using praman MCP wrapper with AutoGen."""

    # Configure MCP server connection
    server_config = StdioMcpServerConfig(
        command="npx",
        args=["praman-mcp-server"],
        env={
            "SAP_BASE_URL": "https://my-sap-system.example.com",
            "SAP_USERNAME": "testuser",
            "SAP_PASSWORD": "testpass",
        },
    )

    # Create McpWorkbench to discover and wrap tools
    async with McpWorkbench(server_config) as workbench:
        tools = await workbench.list_tools()
        print(f"Discovered {len(tools)} praman tools")

        # Create an agent with praman tools
        executor = AssistantAgent(
            name="sap_test_executor",
            model_client=None,  # Configure with your model client
            system_message="""You are an SAP test automation agent.
            Use the praman tools to:
            1. Authenticate to SAP systems
            2. Navigate Fiori apps
            3. Interact with UI5 controls
            4. Read and verify table data
            5. Execute OData queries

            Always call wait_for_ui5 after navigation and input changes.
            Use discover_controls to explore the page if unsure.""",
            tools=tools,
        )

        # Run a test scenario (in practice, use with a model client)
        print("AutoGen agent ready with praman tools")
        print(f"Available tools: {[t.name for t in tools]}")


# ── Path A: Multi-Agent Code Generation ──────────────────────────────

async def generate_tests_multi_agent():
    """
    Multi-agent AutoGen conversation to produce high-quality praman tests.

    Agents:
    - test_designer: Plans test scenarios from requirements
    - test_coder: Writes Playwright+praman code following rules
    - test_reviewer: Reviews code for compliance with 7 mandatory rules
    """

    test_designer = AssistantAgent(
        name="test_designer",
        model_client=None,  # Configure with your model client
        system_message="""You are a SAP test designer. Given a business requirement,
        you produce detailed test scenarios with:
        - Pre-conditions (auth state, navigation target)
        - Test steps (user actions)
        - Expected outcomes (assertions)
        - Edge cases to cover

        Format as a numbered list of test steps.""",
    )

    test_coder = AssistantAgent(
        name="test_coder",
        model_client=None,
        system_message="""You are a Playwright+praman test code writer.
        Given test scenarios, you produce TypeScript test code following these rules:

        1. import { test, expect } from 'playwright-praman' — ONLY valid import
        2. Use ui5.control() for ALL UI5 elements
        3. NEVER use page.click('#__...') or page.locator('.sapM...')
        4. Use test.step() for each logical step
        5. Call ui5.waitForUI5() after navigation and input changes
        6. Use setValue() + fireChange() + waitForUI5() for inputs

        Available fixtures: ui5, ui5Navigation, ui5Footer, intent.core, fe""",
    )

    test_reviewer = AssistantAgent(
        name="test_reviewer",
        model_client=None,
        system_message="""You are a praman test compliance reviewer.
        Check generated tests against the 7 Mandatory Rules:

        1. EVERY UI5 element → ui5.control() + proxy methods ONLY
        2. NEVER Playwright native selectors for UI5 elements
        3. Non-UI5 elements → Playwright native OK (verify not UI5 first)
        4. import from 'playwright-praman' ONLY
        5. Auth via seed — NEVER sapAuth.login() in test body
        6. Scan for 16+ forbidden patterns
        7. TSDoc compliance header

        If violations found, list them and say REVISE.
        If compliant, say APPROVED.""",
    )

    # Create a multi-agent conversation
    termination = TextMentionTermination("APPROVED")
    team = RoundRobinGroupChat(
        [test_designer, test_coder, test_reviewer],
        termination_condition=termination,
        max_turns=6,
    )

    # Run the team (requires configured model clients)
    print("AutoGen multi-agent team ready:")
    print("  1. test_designer → Plans scenarios")
    print("  2. test_coder → Writes praman code")
    print("  3. test_reviewer → Checks compliance")


# ── WorkbenchAgent for Complex Workflows ─────────────────────────────

async def run_workbench_agent():
    """
    Use AutoGen's WorkbenchAgent for multi-step SAP test workflows.
    The agent can chain praman operations across a complete business process.
    """

    server_config = StdioMcpServerConfig(
        command="npx",
        args=["praman-mcp-server"],
    )

    async with McpWorkbench(server_config) as workbench:
        # WorkbenchAgent handles tool discovery and execution
        tools = await workbench.list_tools()

        # Tool descriptions can be overridden for specific LLMs
        for tool in tools:
            print(f"  {tool.name}: {tool.description[:80]}")


if __name__ == "__main__":
    asyncio.run(run_sap_test_via_mcp())
