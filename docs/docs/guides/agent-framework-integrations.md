---
sidebar_position: 40
title: Integrating with AI Agent Frameworks
---

# Integrating with AI Agent Frameworks

:::info Roadmap
Native integrations with the frameworks below are **on the Praman roadmap**. The architecture and adapter contracts described on this page reflect the planned design. Community contributions and early feedback are welcome — open a discussion on [GitHub](https://github.com/mrkanitkar/playwright-praman/discussions).
:::

Praman is designed from the ground up as an AI-first plugin. Its structured outputs — `AiResponse<T>` envelopes, `IntentDescriptor` payloads, capability manifests, and vocabulary graphs — map naturally onto the tool-call and agent-step patterns used by modern AI orchestration frameworks.

This page describes the planned integration model for five major frameworks, explains what each integration will look like in practice, and lists the capabilities each adapter will expose.

---

## Integration Architecture

All framework adapters will follow the same two-layer model:

```text
┌──────────────────────────────────────────────────────────────┐
│  AI Agent Framework (LangGraph / AutoGen / OpenAI Agents…)   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Praman Adapter (playwright-praman/ai)                 │  │
│  │                                                        │  │
│  │  Tool: navigateTo(intent)  →  ui5.press / page.goto    │  │
│  │  Tool: fillField(id, val)  →  ui5.fill + waitForUI5    │  │
│  │  Tool: readControl(id)     →  ui5.getValue / getProperty│  │
│  │  Tool: waitForStable()     →  ui5.waitForUI5           │  │
│  │  Tool: getCapabilities()   →  CapabilityRegistry.list  │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Playwright Browser  ←  Praman Fixtures + Bridge       │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

Each adapter will expose Praman's SAP operations as **typed tool definitions** that the framework's orchestrator can call, chain, and retry. The browser state (Playwright `Page`) is kept alive across agent steps using the same fixture injection model Praman already uses.

---

## LangGraph

[LangGraph](https://www.langchain.com/langgraph) (LangChain) models multi-step agent workflows as typed state machines where each node is a callable tool or sub-graph. Praman maps directly onto this model — each UI5 operation is a node with clearly typed inputs and outputs.

### Planned Capabilities

| LangGraph Concept  | Praman Mapping                                                  |
| ------------------ | --------------------------------------------------------------- |
| State node         | One `test.step()` → one SAP UI interaction                      |
| Tool node          | `navigateTo`, `fillField`, `selectOption`, `assertControl`      |
| Conditional edge   | Branch on `AiResponse.status` (`success` / `error` / `partial`) |
| Interrupt + resume | Checkpoint serialization via Praman's `CheckpointState` type    |
| Human-in-the-loop  | Pause on SAP validation error, surface to operator, resume      |

### What the Adapter Will Provide

```typescript
// Planned API — not yet available
import { createLangGraphAdapter } from 'playwright-praman/ai/langgraph';

const tools = createLangGraphAdapter(page, ui5);

// tools exposes: navigateTo, fillField, readControl,
//                waitForStable, openValueHelp, selectFromTable,
//                assertFieldValue, getCapabilities
```

### Example Agent Flow (Planned)

```typescript
import { StateGraph } from '@langchain/langgraph';
import { createLangGraphAdapter } from 'playwright-praman/ai/langgraph';

const graph = new StateGraph({ channels: { messages: { value: [] } } })
  .addNode('navigate', tools.navigateTo)
  .addNode('openDialog', tools.press)
  .addNode('fillMaterial', tools.fillField)
  .addNode('fillPlant', tools.fillField)
  .addNode('submit', tools.press)
  .addConditionalEdges('submit', (state) =>
    state.lastResult.status === 'success' ? 'verify' : 'handleError',
  )
  .addNode('verify', tools.assertControl)
  .addNode('handleError', tools.gracefulCancel)
  .compile();
```

:::tip Why LangGraph fits SAP workflows
SAP processes are inherently stateful and branching — a BOM creation may succeed, fail with a validation error, or require a different plant/material combination. LangGraph's conditional edges and interrupt/resume model handles this naturally without hard-coded `if/else` chains in test scripts.
:::

---

## AutoGen (Microsoft)

[AutoGen](https://microsoft.github.io/autogen/) is Microsoft's open-source framework for building multi-agent systems where specialized agents collaborate to complete complex tasks. Its conversational agent model aligns with Praman's planner → generator → healer pipeline.

### Planned Capabilities

| AutoGen Concept   | Praman Mapping                                             |
| ----------------- | ---------------------------------------------------------- |
| `AssistantAgent`  | Praman planner — discovers SAP UI, produces test plan      |
| `UserProxyAgent`  | Praman executor — runs Playwright actions, reports results |
| `GroupChat`       | Planner + Generator + Healer collaborate on a test suite   |
| Tool registration | SAP UI tools registered on the executor agent              |
| Code execution    | Generated `.spec.ts` runs via `npx playwright test`        |

### What the Adapter Will Provide

```typescript
// Planned API — not yet available
import { createAutoGenTools } from 'playwright-praman/ai/autogen';

const sapTools = createAutoGenTools(page, ui5);
// Register on your AutoGen UserProxyAgent's function map
```

### Planned Agent Topology

```text
┌─────────────────┐     instructions      ┌──────────────────┐
│  PlannerAgent   │ ──────────────────►   │  ExecutorAgent   │
│  (AssistantAgent│     test steps        │  (UserProxyAgent) │
│   + SAP skills) │                       │  + Praman tools  │
└─────────────────┘                       └────────┬─────────┘
        ▲                                          │
        │          result + errors                 │
        └──────────────────────────────────────────┘
              HealerAgent joins on failure
```

---

## Microsoft Agent Framework (Semantic Kernel)

[Semantic Kernel](https://learn.microsoft.com/en-us/semantic-kernel/overview/) is Microsoft's SDK for building AI-powered applications with plugins, planners, and memory. Praman's capability registry and vocabulary system are designed to expose as Semantic Kernel plugins.

### Planned Capabilities

| Semantic Kernel Concept | Praman Mapping                                                          |
| ----------------------- | ----------------------------------------------------------------------- |
| Native plugin           | `SapUi5Plugin` — exposes all `ui5.*` fixtures as SK functions           |
| Planner                 | Auto-plans multi-step SAP workflows from a natural language goal        |
| Memory                  | Stores discovered control maps between agent sessions                   |
| Function calling        | Each Praman tool becomes a describable SK kernel function               |
| Filters                 | Pre/post hooks map to Praman's `BeforeAction` / `AfterAction` lifecycle |

### What the Adapter Will Provide

```typescript
// Planned API — not yet available
import { SapUi5Plugin } from 'playwright-praman/ai/semantic-kernel';
import { Kernel } from '@microsoft/semantic-kernel';

const kernel = new Kernel();
kernel.addPlugin(new SapUi5Plugin(page, ui5), 'SapUI5');

// Kernel can now plan: "Fill the BOM creation form and submit"
// and call SapUI5.fillField, SapUI5.press, SapUI5.waitForStable
```

### Plugin Functions (Planned)

| Function                      | Description                         |
| ----------------------------- | ----------------------------------- |
| `navigateToApp(appName)`      | FLP navigation to a named Fiori app |
| `fillField(controlId, value)` | `ui5.fill()` with SAP field binding |
| `pressButton(controlId)`      | `ui5.press()` with stability wait   |
| `readFieldValue(controlId)`   | `ui5.getValue()`                    |
| `openValueHelp(controlId)`    | Open and enumerate value help table |
| `selectFromValueHelp(index)`  | Pick row by OData binding index     |
| `waitForStableUI()`           | `ui5.waitForUI5()`                  |
| `getAvailableApps()`          | Queries FLP tile catalog            |

---

## OpenAI Agents SDK

The [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) (previously Swarm) provides a lightweight framework for building agents that hand off between each other and call registered tools. Praman tools map directly onto the SDK's function-tool model.

### Planned Capabilities

| OpenAI Agents SDK Concept | Praman Mapping                                                        |
| ------------------------- | --------------------------------------------------------------------- |
| `Agent`                   | One agent per Praman role (planner, executor, healer)                 |
| `function_tool`           | Every `ui5.*` fixture becomes a callable tool definition              |
| Handoffs                  | Planner → Generator → Healer pipeline with structured handoff context |
| Structured output         | `AiResponse<T>` maps to Pydantic / Zod response schemas               |
| Tracing                   | Playwright `test.info().annotations` surface in OpenAI trace UI       |

### What the Adapter Will Provide

```typescript
// Planned API — not yet available
import { createOpenAITools } from 'playwright-praman/ai/openai-agents';

const tools = createOpenAITools(page, ui5);
// tools: array of OpenAI function_tool definitions
// ready to pass to new Agent({ tools })
```

### Planned Tool Schema Example

```json
{
  "name": "fill_sap_field",
  "description": "Fill a SAP UI5 input field and fire the change event. Use for SmartField, MDC Field, and sap.m.Input controls.",
  "parameters": {
    "type": "object",
    "properties": {
      "controlId": { "type": "string", "description": "Stable SAP UI5 control ID from discovery" },
      "value": { "type": "string", "description": "Value to set" },
      "searchOpenDialogs": { "type": "boolean", "default": true }
    },
    "required": ["controlId", "value"]
  }
}
```

---

## Google Agent Development Kit (ADK)

[Google's Agent Development Kit](https://google.github.io/adk-docs/) (ADK) is Google's open-source framework for building and deploying multi-agent systems, with first-class support for tool use, multi-agent pipelines, and Vertex AI integration. The ADK's `BaseTool` interface is a natural fit for Praman's typed SAP tools.

### Planned Capabilities

| Google ADK Concept | Praman Mapping                                             |
| ------------------ | ---------------------------------------------------------- |
| `BaseTool`         | Each `ui5.*` fixture becomes an ADK tool with typed schema |
| `LlmAgent`         | SAP planner, generator, and healer as ADK agents           |
| `SequentialAgent`  | Plan → Generate → Heal pipeline                            |
| `ParallelAgent`    | Concurrent discovery of multiple Fiori apps                |
| Vertex AI backend  | Cloud-hosted planning with Gemini models                   |
| Session state      | Shared control map and vocabulary across agent steps       |

### What the Adapter Will Provide

```typescript
// Planned API — not yet available
import { createADKTools } from 'playwright-praman/ai/google-adk';
import { LlmAgent } from '@google/adk';

const sapTools = createADKTools(page, ui5);

const plannerAgent = new LlmAgent({
  name: 'SapTestPlanner',
  model: 'gemini-2.0-flash',
  tools: sapTools,
  instruction: 'Discover the SAP UI5 app and produce a structured test plan.',
});
```

### ADK Pipeline (Planned)

```text
SequentialAgent
├── SapPlannerAgent   → discovers UI5 controls, writes test plan
├── SapGeneratorAgent → converts plan to playwright-praman spec
└── SapHealerAgent    → runs test, reads failure, iterates
```

:::tip Vertex AI + SAP
The ADK integration will support Vertex AI backends, enabling teams to run the planning and generation pipeline entirely within Google Cloud — useful for enterprises with data residency requirements.
:::

---

## Comparison

| Framework             | Best For                                           | Orchestration Model        | Praman Fit                             |
| --------------------- | -------------------------------------------------- | -------------------------- | -------------------------------------- |
| **LangGraph**         | Complex branching SAP workflows, human-in-the-loop | State machine graph        | Excellent — maps to test.step()        |
| **AutoGen**           | Multi-agent collaboration (planner + healer)       | Conversational agents      | Excellent — mirrors Praman pipeline    |
| **Semantic Kernel**   | Microsoft ecosystem, enterprise .NET/Python        | Plugin + planner           | Good — capability registry as plugin   |
| **OpenAI Agents SDK** | Lightweight, fast iteration, OpenAI models         | Function tools + handoffs  | Good — clean tool schema mapping       |
| **Google ADK**        | Vertex AI, Gemini models, GCP-native pipelines     | Sequential/parallel agents | Good — structured ADK tool definitions |

---

## Current Workaround: Use Praman Agents Directly

While framework-native adapters are in development, you can orchestrate Praman's three agents today using **Claude Code MCP** or **GitHub Copilot Agent Mode** with the included agent definitions:

```text
.github/agents/praman-sap-planner.agent.md
.github/agents/praman-sap-generator.agent.md
.github/agents/praman-sap-healer.agent.md
```

See [Running Your Agent for the First Time](./running-your-agent.md) for the complete pipeline.

---

## Contribute or Follow Progress

- **GitHub Discussions**: Share your framework preference and use case
- **Issues**: Track individual adapter issues under the `ai-adapters` label
- **Roadmap**: The order of delivery will reflect community demand — upvote your framework

```text
Planned delivery order (subject to change):
  1. OpenAI Agents SDK adapter   ← lightest surface area
  2. LangGraph adapter           ← most requested for SAP workflows
  3. Google ADK adapter          ← Vertex AI enterprise demand
  4. AutoGen adapter             ← multi-agent collaboration
  5. Semantic Kernel plugin      ← Microsoft ecosystem
```
