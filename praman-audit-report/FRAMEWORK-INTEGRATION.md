# Part 4: Framework Integration Audit Report

**Package:** `playwright-praman` v1.0.1
**Audit Date:** 2026-02-27
**Auditor:** Claude Opus 4.6 (Automated Deep Audit)
**Scope:** All major agentic AI framework integration paths

---

## Executive Summary

Praman is a **Playwright plugin** (library), not a standalone agent. Two integration models exist for every framework:

- **Path A (Code Generation):** AI agents WRITE Playwright+Praman test code that is then executed by Playwright's test runner. The agent never calls Praman APIs at runtime -- it generates `.spec.ts` files.
- **Path B (MCP Wrapper):** A hypothetical `praman-mcp-server` would expose Praman fixture capabilities as MCP tools, enabling agents to drive SAP UI5 tests via tool calls at runtime.

Praman's architecture strongly favours Path A. It already ships with extensive agent instruction files (CLAUDE.md, AGENTS.md, llms.txt, llms-full.txt, SKILL.md, 6 example files, 179 capabilities, 3 Claude Code agents). Path B is feasible but requires a new MCP server package -- currently unimplemented.

---

## 4.1 MCP Server Wrapper Feasibility (15 Checks)

An MCP wrapper would expose Praman's 14 fixtures as callable tools so that any MCP-compatible agent can drive SAP UI5 tests without writing code.

### 4.1.1 Tool Surface Mapping

| #   | Check                                                    | Status     | Finding                                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Can each fixture be mapped to an MCP tool?               | Partial    | 14 fixtures map to ~40-50 tools. Sub-fixtures (ui5.table, ui5.dialog, ui5.date, ui5.odata) need individual tool definitions. The `pramanAI` fixture with its 179 capabilities is too broad for a single tool.                                         |
| 2   | Are fixture methods stateless or stateful?               | Stateful   | All fixtures require a live Playwright `page` and browser context. The MCP server must manage a persistent browser session across tool calls. This is the primary architectural challenge.                                                            |
| 3   | Can fixture return values be serialized to JSON?         | Yes        | Control proxy return values are primitives (`string`, `boolean`, `number`) or serializable objects. `DiscoveredControl[]`, `PageContext`, `AiResponse<T>` are all JSON-safe.                                                                          |
| 4   | Are tool input schemas expressible in JSON Schema?       | Yes        | `UI5Selector` is a well-defined object (`{ id?, controlType?, properties?, bindingPath?, ancestor?, descendant?, searchOpenDialogs? }`). Zod schemas in `src/ai/schemas/` can auto-generate JSON schemas via `zod-to-json-schema` (already a devDep). |
| 5   | Can error responses be structured for agent consumption? | Excellent  | Every `PramanError` has `toAIContext()` returning `{ code, message, attempted, retryable, severity, details, suggestions[] }`. This maps perfectly to MCP error responses.                                                                            |
| 6   | Is browser lifecycle manageable?                         | Complex    | An MCP server must start a Playwright browser, manage page lifecycle, handle authentication (storageState), and clean up. This is substantial infrastructure not currently built.                                                                     |
| 7   | Can authentication be handled?                           | Yes        | `sapAuth.login()` and `sapAuth.loginFromEnv()` work standalone. StorageState can be saved/loaded. The seed-file pattern translates to an MCP "setup" tool.                                                                                            |
| 8   | Is the control proxy serializable?                       | No         | The `ControlProxy` uses a JavaScript `Proxy` pattern that intercepts method calls dynamically. An MCP tool cannot return a "proxy" -- it must return data. Each proxy method call needs its own MCP tool invocation.                                  |
| 9   | Can `waitForUI5()` be exposed?                           | Yes        | Simple async function that resolves when UI5 is stable. Maps to a tool with no parameters.                                                                                                                                                            |
| 10  | Can `page.evaluate()` calls be wrapped?                  | Yes        | BulkDiscovery and ContextBuilder already wrap `page.evaluate()` in Node.js functions. These map cleanly to MCP tools.                                                                                                                                 |
| 11  | Is there a session management model?                     | No         | No session manager exists. An MCP server needs: session creation, session listing, session teardown. Must be built.                                                                                                                                   |
| 12  | Can parallel test execution be supported?                | Difficult  | Each session needs its own browser context. MCP servers are typically single-session. Multi-session would require a session ID parameter on every tool call.                                                                                          |
| 13  | Are there security concerns?                             | Yes        | An MCP server exposing `page.evaluate()` or arbitrary browser control is a security surface. The server should restrict to Praman fixture methods only -- never expose raw `page.evaluate()`.                                                         |
| 14  | What is the latency model?                               | Acceptable | Each MCP tool call involves Node.js-to-browser IPC (Playwright CDP). Typical latency: 50-200ms per call. Acceptable for agentic workflows.                                                                                                            |
| 15  | Is there prior art?                                      | Yes        | The `@playwright/test` MCP server (`playwright run-test-mcp-server`) already exists in `.mcp.json`. A praman-mcp-server could extend or complement it by adding SAP-aware tools.                                                                      |

### MCP Wrapper Feasibility Verdict

| Aspect                | Rating                  | Notes                                                                                        |
| --------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| Technical feasibility | **Feasible**            | All primitives exist. Main work is session management and tool schema definition.            |
| Effort estimate       | **4-6 weeks**           | ~30 tool definitions, session manager, auth flow, error mapping, tests.                      |
| Primary blocker       | **Session lifecycle**   | No existing session management infrastructure. Must build browser pool, auth state, cleanup. |
| Secondary blocker     | **Proxy serialization** | ControlProxy cannot be returned as data. Must decompose into per-method tools.               |
| Risk                  | **Medium**              | Security surface of exposing browser control. Latency accumulation across many tool calls.   |

---

## 4.2 Google ADK Integration (12 Checks)

Google Agent Development Kit (ADK) supports tool definitions, multi-agent orchestration, and session management.

### Path A: Code Generation

| #   | Check                                           | Status  | Finding                                                                                                                                                                 |
| --- | ----------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Can ADK agents read Praman documentation?       | Yes     | `llms.txt` (52 lines) and `llms-full.txt` (generated from all docs) provide structured documentation. ADK agents can ingest these via grounding data or tool retrieval. |
| 2   | Are capability descriptions agent-compatible?   | Yes     | `CapabilityRegistry.forProvider('gemini')` outputs JSON-structured capability listings optimized for Gemini models.                                                     |
| 3   | Are examples sufficient for code generation?    | Yes     | 6 runnable examples in `examples/`, gold-standard BOM test, fixture reference table in AGENTS.md, and 179 capabilities with `usageExample` fields.                      |
| 4   | Can ADK validate generated code?                | Partial | No JSON schema for generated test files exists. ADK agents would need to run `npm run lint` and `npm run typecheck` as tools to validate.                               |
| 5   | Is the forbidden pattern list machine-readable? | Partial | 7 mandatory rules and 19 forbidden patterns are documented in AGENTS.md and agent `.md` files, but not as a structured schema. An ADK agent must parse markdown.        |
| 6   | Can ADK run generated tests?                    | Yes     | ADK can invoke `npx playwright test <file>` as a subprocess tool. Test results are in standard Playwright reporter format.                                              |

### Path B: MCP Wrapper

| #   | Check                                      | Status   | Finding                                                                                                                                      |
| --- | ------------------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Does ADK support MCP tools?                | Yes      | ADK supports MCP tool integration. A praman-mcp-server would be consumable by ADK agents as an MCP tool source.                              |
| 8   | Can ADK manage browser sessions?           | Via MCP  | ADK itself does not manage browsers. It would delegate to the MCP server for session lifecycle.                                              |
| 9   | Is multi-step orchestration supported?     | Yes      | ADK's agent orchestration supports sequential tool calls with state. Compatible with Praman's checkpoint/resume model (`AgenticCheckpoint`). |
| 10  | Can ADK handle Praman errors?              | Yes      | `toAIContext()` outputs are JSON-structured. ADK agents can parse `retryable` and `suggestions[]` for self-healing.                          |
| 11  | Is there a Gemini-specific context format? | Yes      | `CapabilityRegistry.forProvider('gemini')` exists and outputs JSON. Currently same as `toJSON()` but extensible.                             |
| 12  | What is the integration effort?            | Moderate | Path A: 1-2 weeks (ADK agent config + grounding docs). Path B: 4-6 weeks (MCP server first, then ADK config).                                |

### Google ADK Scorecard

| Dimension | Code Gen (A) |  MCP Wrapper (B)   |
| --------- | :----------: | :----------------: |
| Readiness |    Green     |       Yellow       |
| Blockers  |     None     | MCP server unbuilt |
| Effort    |  1-2 weeks   |     5-7 weeks      |

---

## 4.3 LangGraph/LangChain Integration (12 Checks)

LangChain provides tool abstractions, prompt templates, and chains. LangGraph adds stateful graph-based agent workflows.

### Path A: Code Generation

| #   | Check                                             | Status    | Finding                                                                                                                                                                    |
| --- | ------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Can LangChain tools invoke Playwright?            | Yes       | LangChain `StructuredTool` or `DynamicTool` can wrap `npx playwright test` subprocess calls. Generated test code is the output artifact, not a tool call.                  |
| 2   | Can capabilities be loaded as tool descriptions?  | Yes       | `capabilities.forAI()` returns `CapabilitiesJSON` -- directly usable as LangChain tool metadata. The 179 entries can seed a retrieval-augmented generation (RAG) pipeline. |
| 3   | Are recipes usable as few-shot examples?          | Excellent | `RecipeRegistry` provides curated patterns with domain, priority, and code patterns. `recipes.forAI()` returns all entries -- ideal for few-shot prompting in LangChain.   |
| 4   | Can LangChain validate generated tests?           | Yes       | LangChain output parsers can validate against the forbidden pattern list. A custom `PydanticOutputParser` could enforce the test template structure.                       |
| 5   | Is the prompt engineering compatible?             | Yes       | `buildSystemPrompt()` and `buildUserPrompt()` in `agentic-prompts.ts` demonstrate the prompt pattern. LangChain `ChatPromptTemplate` can replicate this.                   |
| 6   | Can LCEL chains replicate the generate-test flow? | Yes       | The two-phase workflow (generateTest -> interpretStep) maps to a LangGraph state machine with PageContext as state.                                                        |

### Path B: MCP Wrapper

| #   | Check                                          | Status    | Finding                                                                                                                                                                           |
| --- | ---------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Does LangChain support MCP?                    | Yes       | LangChain has MCP tool adapters. A praman-mcp-server would be consumable as a LangChain `MCPToolkit`.                                                                             |
| 8   | Can LangGraph manage multi-step SAP workflows? | Excellent | LangGraph's stateful graphs are ideal for SAP E2E flows: navigate -> fill form -> save -> verify. Each step is a graph node with conditional edges for error handling.            |
| 9   | Is checkpoint/resume compatible?               | Excellent | LangGraph has native checkpointing. Praman's `AgenticCheckpoint` (sessionId, currentStep, completedSteps, remainingSteps, state, timestamp) maps directly to LangGraph state.     |
| 10  | Can error self-healing be implemented?         | Excellent | LangGraph conditional edges can route on `error.retryable`. `error.suggestions[]` feeds back into the LLM for self-correction. `error.toAIContext()` provides structured context. |
| 11  | Is the context builder compatible?             | Yes       | `buildPageContext()` returns `AiResponse<PageContext>` -- a discriminated union. LangChain agents can narrow on `status` for type-safe state transitions.                         |
| 12  | What is the integration effort?                | Moderate  | Path A: 2-3 weeks (LangChain agent + RAG over capabilities). Path B: 5-7 weeks (MCP server + LangGraph state machine).                                                            |

### LangGraph/LangChain Scorecard

| Dimension | Code Gen (A) |  MCP Wrapper (B)   |
| --------- | :----------: | :----------------: |
| Readiness |    Green     |       Yellow       |
| Blockers  |     None     | MCP server unbuilt |
| Effort    |  2-3 weeks   |     5-7 weeks      |

---

## 4.4 Microsoft AutoGen Integration (12 Checks)

AutoGen provides multi-agent conversation patterns, tool integration, and code execution capabilities.

### Path A: Code Generation

| #   | Check                                                   | Status    | Finding                                                                                                                                                                                |
| --- | ------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Can AutoGen agents generate Praman test code?           | Yes       | AutoGen's `AssistantAgent` with tool definitions can generate TypeScript code. AGENTS.md (211 lines) provides structured instructions compatible with AutoGen's system message format. |
| 2   | Can AutoGen validate code before execution?             | Yes       | AutoGen's `UserProxyAgent` with `code_execution_config` can run `npm run lint` and `npm run typecheck` to validate generated code.                                                     |
| 3   | Is multi-agent collaboration possible?                  | Excellent | The 3-agent pattern (planner/generator/healer) maps directly to AutoGen's multi-agent conversation: PlannerAgent -> GeneratorAgent -> HealerAgent with GroupChat.                      |
| 4   | Can AutoGen use the forbidden pattern scanner?          | Yes       | A custom AutoGen tool can scan generated code against the 19 forbidden patterns listed in the healer agent definition.                                                                 |
| 5   | Is the test template compatible with code execution?    | Yes       | Generated `.spec.ts` files are executable via `npx playwright test`. AutoGen can run this as a subprocess and parse results.                                                           |
| 6   | Can AutoGen use Praman's error system for self-healing? | Yes       | `PramanError.toAIContext()` returns structured JSON. AutoGen agents can parse `retryable` and `suggestions[]` to self-correct.                                                         |

### Path B: MCP Wrapper

| #   | Check                                                 | Status    | Finding                                                                                                                          |
| --- | ----------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Does AutoGen support MCP tools?                       | Yes       | AutoGen v0.4+ supports MCP tool servers. A praman-mcp-server would be directly consumable.                                       |
| 8   | Can AutoGen manage browser state?                     | Via MCP   | AutoGen delegates to the MCP server for browser lifecycle. No native browser management.                                         |
| 9   | Is the planner/generator/healer pattern reproducible? | Excellent | AutoGen's `GroupChat` with `GroupChatManager` can orchestrate the three agents. Speaker selection can route based on task phase. |
| 10  | Can AutoGen handle SAP authentication?                | Via MCP   | Auth would be an MCP tool (setup-session). AutoGen orchestrates the call sequence.                                               |
| 11  | Is cost tracking available?                           | Partial   | AutoGen tracks token usage per agent. Praman's `AiResponseMetadata.tokens` provides per-call tracking. No unified dashboard.     |
| 12  | What is the integration effort?                       | Moderate  | Path A: 2-3 weeks (3 AutoGen agents + tools). Path B: 5-7 weeks (MCP server + AutoGen config).                                   |

### Microsoft AutoGen Scorecard

| Dimension | Code Gen (A) |  MCP Wrapper (B)   |
| --------- | :----------: | :----------------: |
| Readiness |    Green     |       Yellow       |
| Blockers  |     None     | MCP server unbuilt |
| Effort    |  2-3 weeks   |     5-7 weeks      |

---

## 4.5 OpenAI Agents SDK / Codex Integration (12 Checks)

OpenAI's Agents SDK and Codex provide function-calling agents and autonomous code generation/execution.

### Path A: Code Generation

| #   | Check                                   | Status    | Finding                                                                                                                                                                                                                                         |
| --- | --------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Can Codex generate Praman test code?    | Excellent | `AGENTS.md` (211 lines) is the primary instruction file for OpenAI agents. `.jules/setup.md` provides project setup. `llms.txt` and `llms-full.txt` provide complete documentation context.                                                     |
| 2   | Are function-calling schemas available? | Partial   | `CapabilityRegistry.forProvider('openai')` outputs JSON -- usable as function definitions. However, no OpenAI-format tool schemas (with `parameters` JSON Schema) are pre-generated. Zod schemas could generate these via `zod-to-json-schema`. |
| 3   | Can Codex use the skill file?           | Yes       | `skills/playwright-praman-sap-testing/SKILL.md` ships in the npm package (`"files": ["skills/"]`). Codex can read `node_modules/playwright-praman/skills/...`.                                                                                  |
| 4   | Is structured output compatible?        | Excellent | Praman's LLM service uses `response_format: { type: 'json_object' }` for OpenAI calls. `AiGeneratedTestSchema` (Zod) validates structured responses. Compatible with OpenAI's structured output mode.                                           |
| 5   | Can Codex validate generated code?      | Yes       | Codex can execute `npm run lint`, `npm run typecheck`, `npx playwright test <file>` to validate. `.jules/setup.md` documents the CI pipeline.                                                                                                   |
| 6   | Is the Copilot Coding Agent compatible? | Yes       | `.github/agents/` contains 6 agent definitions (`praman-sap-planner.agent.md`, `praman-sap-generator.agent.md`, `praman-sap-healer.agent.md` + 3 generic playwright agents) for GitHub Copilot Coding Agents with Playwright MCP.               |

### Path B: MCP Wrapper

| #   | Check                                  | Status       | Finding                                                                                                                                                                                                     |
| --- | -------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7   | Does OpenAI Agents SDK support MCP?    | Yes          | OpenAI Agents SDK supports MCP tool servers natively. A praman-mcp-server would integrate directly.                                                                                                         |
| 8   | Can function-calling drive SAP tests?  | Yes          | Each Praman fixture method maps to an OpenAI function definition. `ui5.control()` -> `{ name: "ui5_control", parameters: { id?, controlType?, ... } }`.                                                     |
| 9   | Is the provider integration complete?  | Excellent    | `callOpenAI()` in `llm-providers.ts` is fully implemented with the `openai` SDK (optional dep). Temperature, maxTokens, JSON mode all supported.                                                            |
| 10  | Can Codex handle the 3-agent workflow? | Partial      | OpenAI Agents SDK supports handoffs between agents. The planner/generator/healer workflow can be modeled as agent-to-agent handoffs with structured state. However, no pre-built Swarm-style config exists. |
| 11  | Is token budget management available?  | Yes          | `buildUserPrompt()` enforces `MAX_CONTEXT_CHARS = 50_000` and `MAX_CONTEXT_CONTROLS = 200` to prevent token overflows. `AiResponseMetadata.tokens` tracks usage.                                            |
| 12  | What is the integration effort?        | Low-Moderate | Path A: 1-2 weeks (already has AGENTS.md, .jules/setup.md, .github/agents/). Path B: 4-6 weeks (MCP server + OpenAI function schemas).                                                                      |

### OpenAI Agents SDK / Codex Scorecard

| Dimension | Code Gen (A) |                  MCP Wrapper (B)                  |
| --------- | :----------: | :-----------------------------------------------: |
| Readiness |    Green     |                      Yellow                       |
| Blockers  |     None     | MCP server unbuilt, no pre-built function schemas |
| Effort    |  1-2 weeks   |                     5-7 weeks                     |

---

## 4.6 Claude Code Integration (12 Checks)

Claude Code is the **primary integration model** for Praman. The deepest instrumentation exists here.

### Path A: Code Generation (PRIMARY)

| #   | Check                                              | Status    | Finding                                                                                                                                                                                                                                                                                                                                                                            |
| --- | -------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Is CLAUDE.md comprehensive?                        | Excellent | 280 lines covering: 5-layer architecture, 14 rules, 12 skill files, agent skills matrix, IDE support table, testing strategy, error patterns, build configuration, cross-platform requirements, and 7 mandatory SAP test generation rules. This is the most thorough agent instruction file across all supported frameworks.                                                       |
| 2   | Are Claude Code agents defined?                    | Excellent | 3 dedicated agents in `.claude/agents/`: `praman-sap-planner` (orange, 997 lines), `praman-sap-generator` (blue, 446 lines), `praman-sap-healer` (red, 701 lines). Each has tool ACLs, model specification (sonnet), and comprehensive SAP-specific instruction.                                                                                                                   |
| 3   | Are prompts defined?                               | Yes       | 4 prompts in `.claude/prompts/`: `praman-sap-plan`, `praman-sap-generate`, `praman-sap-heal`, `praman-sap-coverage` (full pipeline). Invocable as slash commands.                                                                                                                                                                                                                  |
| 4   | Is capability context optimized for Claude?        | Excellent | `CapabilityRegistry.forProvider('claude')` outputs XML-structured `<capability>` elements with `name`, `category`, `intent` attributes and `<description>` + `<example>` child elements. This is the most sophisticated provider-specific formatting in the codebase.                                                                                                              |
| 5   | Is the MCP toolchain integrated?                   | Yes       | `.mcp.json` configures `playwright-test` MCP server. All 3 agents have MCP tool ACLs (browser_click, browser_snapshot, browser_run_code, etc.). The `agent-seed-test` Playwright project with `pauseAtEnd` keeps the browser open for agent exploration.                                                                                                                           |
| 6   | Is the skill file comprehensive?                   | Excellent | `skills/playwright-praman-sap-testing/SKILL.md` ships in the npm package. It is the canonical reference for all agents. Contains fixture maps, selector guides, auth strategies, FLP navigation patterns, V2/V4 control mappings, and SmartField/MDC inner control patterns.                                                                                                       |
| 7   | Are examples agent-consumable?                     | Excellent | 6 runnable examples: `basic-test.spec.ts`, `auth-setup.ts`, `dialog-handling.spec.ts`, `table-operations.spec.ts`, `bom-e2e-praman-gold-standard.spec.ts`, `hybrid-login.spec.ts`. The gold-standard BOM test is the canonical template agents replicate.                                                                                                                          |
| 8   | Is error self-healing supported?                   | Excellent | `PramanError.toAIContext()` returns `{ code, message, attempted, retryable, severity, details, suggestions[], timestamp }`. The healer agent reads `error.suggestions[]` and `error.availableControls` to self-correct selectors. 14 error classes with 58 codes provide granular diagnosis.                                                                                       |
| 9   | Is the Anthropic provider implemented?             | Yes       | `callAnthropic()` in `llm-providers.ts` uses `@anthropic-ai/sdk` (optional dep). System messages extracted and sent via Anthropic's `system` parameter. Default model: `claude-opus-4-6`.                                                                                                                                                                                          |
| 10  | Is the planner/generator/healer pipeline complete? | Excellent | Full pipeline: planner explores live SAP app via MCP browser tools -> generates `.plan.md` + gold-standard `.spec.ts` -> generator produces additional tests from plan -> healer debugs and fixes failing tests. The `praman-sap-coverage` prompt runs all 3 phases sequentially.                                                                                                  |
| 11  | Is compliance enforcement automated?               | Yes       | ComplianceReporter validates generated tests at runtime. 19 forbidden patterns documented. Compliance header template enforced. Step title prefix matching (`PRAMAN_STEP_PREFIXES`) calculates Praman vs raw Playwright step ratio.                                                                                                                                                |
| 12  | Are there any gaps?                                | Minor     | (a) No `praman-mcp-server` for Path B -- but this is by design since Path A is superior for Claude Code. (b) The `forProvider('claude')` XML format is good but does not include `usageExample` in the output -- only `description` and `name`. (c) Agent definitions use `model: sonnet` -- no configuration for claude-opus-4-6 in agent headers (though the user can override). |

### Path B: MCP Wrapper

Claude Code already uses Playwright's MCP server for browser interaction during the planning phase. A praman-mcp-server would add SAP-aware tools on top.

| Assessment            | Details                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feasibility           | High -- Claude Code natively supports MCP servers via `.mcp.json`.                                                                                                        |
| Value-add over Path A | Low -- Path A (code generation) is the primary integration model and is deeply optimized. Path B would only add value for runtime test execution without code generation. |
| Effort                | 4-6 weeks for the MCP server itself. < 1 day to add it to `.mcp.json`.                                                                                                    |

### Claude Code Scorecard

| Dimension |       Code Gen (A)       |          MCP Wrapper (B)          |
| --------- | :----------------------: | :-------------------------------: |
| Readiness |          Green           |              Yellow               |
| Blockers  | None (fully operational) | MCP server unbuilt (low priority) |
| Effort    |   0 (already complete)   |             4-6 weeks             |

### Claude Code Integration Depth Assessment

| Feature                                  | Present | Quality                                         |
| ---------------------------------------- | :-----: | ----------------------------------------------- |
| CLAUDE.md instruction file               |   Yes   | 280 lines, comprehensive                        |
| Dedicated agents (.claude/agents/)       |   Yes   | 3 agents, 2144 combined lines                   |
| Slash command prompts (.claude/prompts/) |   Yes   | 4 prompts including full pipeline               |
| Skill file (SKILL.md)                    |   Yes   | Ships in npm package                            |
| Provider-specific formatting             |   Yes   | XML `<capability>` elements for Claude          |
| LLM provider implementation              |   Yes   | `callAnthropic()` with @anthropic-ai/sdk        |
| MCP browser toolchain                    |   Yes   | playwright-test MCP in .mcp.json                |
| Error self-healing context               |   Yes   | `toAIContext()` on all 14 error classes         |
| Examples (runnable)                      |   Yes   | 6 examples including gold standard              |
| Documentation (llms.txt)                 |   Yes   | llms.txt + llms-full.txt                        |
| Agent orchestration types                |   Yes   | AgentPlan, AgentPlanStep, AgentComplianceReport |
| Checkpoint/resume                        |   Yes   | AgenticCheckpoint with session persistence      |

---

## 4.7 Praman's Own Agentic Layer Assessment (15 Checks)

Praman includes a built-in AI layer (`playwright-praman/ai` sub-path export) with its own agentic capabilities.

| #   | Check                             | Status    | Finding                                                                                                                                                                                                                                                                                                                                                                                                 |
| --- | --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | **AgenticHandler completeness**   | Good      | `AgenticHandler` implements `generateTest()`, `interpretStep()`, `suggestActions()`, `saveCheckpoint()`, `resumeFromCheckpoint()`. The generate-then-execute two-phase design enables checkpoint/resume.                                                                                                                                                                                                |
| 2   | **LLM provider coverage**         | Good      | 3 providers: `azure-openai`, `openai`, `anthropic`. All via dynamic `import()` so SDKs remain optional. Provider selection via `config.ai.provider`.                                                                                                                                                                                                                                                    |
| 3   | **Response envelope consistency** | Excellent | Every AI operation returns `AiResponse<T>` -- a discriminated union on `status: 'success'                                                                                                                                                                                                                                                                                                               | 'error' | 'partial'`. Metadata includes `duration`, `retryable`, `suggestions[]`, `model`, `tokens`. No raw throws from LLM calls. |
| 4   | **CapabilityRegistry richness**   | Excellent | 179 capabilities across 15 categories. Query methods: `list()`, `byCategory()`, `byNamespace()`, `listByPriority()`, `find()`, `findByName()`, `get()`, `has()`, `getStatistics()`, `toJSON()`, `forAI()`, `forProvider()`. Provider-specific formatters for Claude (XML), OpenAI (JSON), Gemini (JSON).                                                                                                |
| 5   | **RecipeRegistry usefulness**     | Good      | Recipes provide curated test patterns with domain, priority, and code. Methods: `select()`, `selectByDomain()`, `selectByPriority()`, `search()`, `forAI()`, `getTopRecipes()`. Seeded from `recipes.yaml` via code generation.                                                                                                                                                                         |
| 6   | **BulkDiscovery robustness**      | Excellent | `discoverPage()` uses `page.evaluate()` with fully self-contained browser-side code (all helpers inlined for serialization safety). Supports `interactiveOnly`, `includeHidden`, `limit`, `offset` options. Falls back from `ElementRegistry.all()` to `sap.ui.getCore().mElements` for older UI5. Result partitioned into `controls`, `buttons`, `formFields`, `tables`, `navigationElements`.         |
| 7   | **ContextBuilder completeness**   | Good      | `buildPageContext()` enriches bulk discovery with UI5 version detection and canonical object category enrichment. Best-effort version detection (handles non-UI5 pages gracefully).                                                                                                                                                                                                                     |
| 8   | **Prompt engineering quality**    | Good      | `buildSystemPrompt()` groups capabilities by namespace, includes top 5 recipes as examples, enforces strict rules (TypeScript, Praman import, async/await). `buildUserPrompt()` bounds context to `MAX_CONTEXT_CHARS=50,000` and `MAX_CONTEXT_CONTROLS=200` to prevent token overflow.                                                                                                                  |
| 9   | **Checkpoint/resume design**      | Adequate  | `AgenticCheckpoint` captures `sessionId`, `currentStep`, `completedSteps`, `remainingSteps`, `state`, `timestamp`. Stored in-memory Map (not persistent). Sufficient for single-session workflows but does not survive process restart.                                                                                                                                                                 |
| 10  | **Schema validation**             | Excellent | All LLM responses validated via Zod schemas (`AiGeneratedTestSchema`, `SuggestActionsSchema`, `InterpretStepSchema`). Input messages validated against `ChatMessageSchema`. Completion responses validated against `LlmCompletionSchema`. Three layers of validation: input, provider response, domain schema.                                                                                          |
| 11  | **Error specificity**             | Excellent | 11 AI-specific error codes: `ERR_AI_PROVIDER_UNAVAILABLE`, `ERR_AI_RESPONSE_INVALID`, `ERR_AI_TOKEN_LIMIT`, `ERR_AI_RATE_LIMITED`, `ERR_AI_NOT_CONFIGURED`, `ERR_AI_LLM_CALL_FAILED`, `ERR_AI_RESPONSE_PARSE_FAILED`, `ERR_AI_CONTEXT_BUILD_FAILED`, `ERR_AI_STEP_INTERPRET_FAILED`, `ERR_AI_INVALID_REQUEST`, `ERR_AI_CAPABILITY_NOT_FOUND`. Each error includes `retryable` flag and `suggestions[]`. |
| 12  | **Agent orchestration types**     | Good      | `AgentPlan`, `AgentPlanStep`, `AgentPlanScenario`, `AgentPlanControlRef`, `AgentComplianceReport` -- all defined in `agent-types.ts`. These types enable structured agent-to-agent handoff (planner -> generator -> healer).                                                                                                                                                                            |
| 13  | **Token budget management**       | Adequate  | Context truncation at 50K chars and 200 controls. No dynamic budget allocation based on model context window. No per-provider budget tuning. Improvement opportunity: use model-specific context windows (e.g., 128K for GPT-4o, 200K for Claude).                                                                                                                                                      |
| 14  | **Observability**                 | Good      | Structured logging via pino (`createLogger('agentic')`). Duration tracked on every operation. Token usage reported in metadata. OpenTelemetry optional dependency for distributed tracing.                                                                                                                                                                                                              |
| 15  | **Extensibility**                 | Good      | `CapabilityRegistry.register()` allows runtime capability addition. `RecipeRegistry.fromEntries()` factory for custom recipe sets. `LlmService` interface enables custom provider implementations. Plugin-based error architecture supports extension.                                                                                                                                                  |

### Agentic Layer Gaps

| Gap                              | Severity | Description                                                                                                                                                            |
| -------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No persistent checkpoints        | Medium   | `AgenticCheckpoint` stored in in-memory Map. Process restart loses state. Should support file-based or database persistence.                                           |
| No streaming support             | Medium   | LLM calls wait for complete responses. No streaming for real-time progress feedback. OpenAI and Anthropic SDKs support streaming but Praman does not use it.           |
| No retry logic in LLM calls      | Medium   | `callAzureOpenAI`, `callOpenAI`, `callAnthropic` do not implement exponential backoff despite the project rule (Google SRE best practice). Retries left to the caller. |
| No token budget per model        | Low      | Fixed 50K char limit regardless of model context window. GPT-4o (128K) and Claude (200K) could accept larger contexts.                                                 |
| No cost estimation               | Low      | Token usage tracked after the fact but no pre-call estimation or budget enforcement.                                                                                   |
| `interpretStep` does not execute | Low      | Maps step to capability name but does not actually execute the capability. Returns the mapping result only. Execution is left to the caller.                           |

---

## Framework Integration Scorecard

| Framework                     | Code Gen Readiness | MCP Wrapper Readiness | Code Gen Blockers         | MCP Blockers                                      | Code Gen Effort | MCP Effort |
| ----------------------------- | :----------------: | :-------------------: | ------------------------- | ------------------------------------------------- | :-------------: | :--------: |
| **Claude Code**               |   :green_circle:   |    :yellow_circle:    | None -- fully operational | MCP server unbuilt (low priority)                 |  0 (complete)   |   4-6 wk   |
| **OpenAI Agents SDK / Codex** |   :green_circle:   |    :yellow_circle:    | None                      | MCP server unbuilt, no pre-built function schemas |     1-2 wk      |   5-7 wk   |
| **Google ADK**                |   :green_circle:   |    :yellow_circle:    | None                      | MCP server unbuilt                                |     1-2 wk      |   5-7 wk   |
| **LangGraph / LangChain**     |   :green_circle:   |    :yellow_circle:    | None                      | MCP server unbuilt                                |     2-3 wk      |   5-7 wk   |
| **Microsoft AutoGen**         |   :green_circle:   |    :yellow_circle:    | None                      | MCP server unbuilt                                |     2-3 wk      |   5-7 wk   |
| **Praman Agentic Layer**      |   :green_circle:   |          N/A          | None                      | N/A                                               |  0 (built-in)   |    N/A     |

### Legend

- :green_circle: **Green** -- Production-ready or near-production with minimal effort
- :yellow_circle: **Yellow** -- Feasible but requires new infrastructure (the MCP server)
- :red_circle: **Red** -- Significant blockers or architectural incompatibilities

---

## Detailed Readiness Matrix

| Asset                     |      Claude Code       |         OpenAI / Codex          |      Google ADK       |  LangChain   |   AutoGen    |
| ------------------------- | :--------------------: | :-----------------------------: | :-------------------: | :----------: | :----------: |
| Agent instruction file    | CLAUDE.md (280 lines)  |      AGENTS.md (211 lines)      |       AGENTS.md       |  AGENTS.md   |  AGENTS.md   |
| Dedicated agents          | 3 (planner/gen/healer) |       6 (.github/agents/)       |          --           |      --      |      --      |
| Slash command prompts     |  4 (.claude/prompts/)  |               --                |          --           |      --      |      --      |
| IDE/agent config          |        .claude/        |         .jules/setup.md         | .antigravity/rules.md |      --      |      --      |
| Provider-specific format  |   XML (forProvider)    |       JSON (forProvider)        |  JSON (forProvider)   | JSON (forAI) | JSON (forAI) |
| LLM provider code         |    callAnthropic()     | callOpenAI(), callAzureOpenAI() |          --           |      --      |      --      |
| Skill file in npm package |          Yes           |               Yes               |          Yes          |     Yes      |     Yes      |
| llms.txt                  |          Yes           |               Yes               |          Yes          |     Yes      |     Yes      |
| llms-full.txt             |          Yes           |               Yes               |          Yes          |     Yes      |     Yes      |
| Examples                  |       6 runnable       |           6 runnable            |      6 runnable       |  6 runnable  |  6 runnable  |
| Error toAIContext()       |          Yes           |               Yes               |          Yes          |     Yes      |     Yes      |
| Capabilities (179)        |          Yes           |               Yes               |          Yes          |     Yes      |     Yes      |
| Recipes                   |          Yes           |               Yes               |          Yes          |     Yes      |     Yes      |
| MCP tool config           |       .mcp.json        |         .github/agents/         |          --           |      --      |      --      |

---

## Recommendations

### Priority 1: Ship What Works (Claude Code + OpenAI)

Claude Code integration is **production-ready** with zero additional work. OpenAI/Codex integration needs only documentation alignment (1-2 weeks). These two cover the majority of current agent users.

### Priority 2: MCP Server (Enables All Path B Integrations)

Building `praman-mcp-server` is a **one-time investment** that unlocks Path B for all 5 frameworks simultaneously. Recommended scope:

1. **Core tools (~20):** `ui5_control`, `ui5_click`, `ui5_fill`, `ui5_waitForUI5`, `ui5_table_getRows`, `ui5_table_clickRow`, `ui5_dialog_confirm`, `ui5_dialog_dismiss`, `ui5_dialog_waitFor`, `ui5Navigation_navigateToTile`, `ui5Navigation_navigateToApp`, `ui5Navigation_navigateBack`, `ui5Footer_clickSave`, `ui5Footer_clickEdit`, `sapAuth_login`, `discover_page`, `build_context`, `setup_session`, `teardown_session`, `get_session_info`
2. **Session manager:** Browser pool, auth state, page lifecycle
3. **Error mapping:** `PramanError.toAIContext()` -> MCP error responses
4. **JSON schemas:** Auto-generate from Zod schemas via `zod-to-json-schema`

### Priority 3: Agentic Layer Hardening

1. **Persistent checkpoints:** File-based `AgenticCheckpoint` storage for process resilience
2. **LLM retry logic:** Exponential backoff + jitter in provider call functions (aligns with project's Google SRE principle)
3. **Streaming support:** For real-time progress feedback in long-running generations
4. **Dynamic token budgets:** Model-specific context window awareness

### Priority 4: Function Schema Generation

Auto-generate OpenAI function-calling schemas from Zod schemas. This bridges the gap between Praman's rich type system and OpenAI Agents SDK's function definitions. Estimated effort: 1 week.

---

## Appendix A: Asset Inventory

| Asset                           | Location                                         | Lines  | Purpose                                   |
| ------------------------------- | ------------------------------------------------ | :----: | ----------------------------------------- |
| CLAUDE.md                       | `/CLAUDE.md`                                     |  280   | Claude Code agent instructions            |
| AGENTS.md                       | `/AGENTS.md`                                     |  211   | Universal agent instructions              |
| llms.txt                        | `/llms.txt`                                      |   52   | LLM-friendly documentation index          |
| llms-full.txt                   | `/llms-full.txt`                                 | ~3000+ | Complete inline documentation             |
| SKILL.md                        | `/skills/playwright-praman-sap-testing/SKILL.md` | ~2000+ | Canonical fixture/selector/auth reference |
| praman-sap-planner              | `/.claude/agents/praman-sap-planner.md`          |  997   | SAP test planner agent (Claude Code)      |
| praman-sap-generator            | `/.claude/agents/praman-sap-generator.md`        |  446   | SAP test generator agent (Claude Code)    |
| praman-sap-healer               | `/.claude/agents/praman-sap-healer.md`           |  701   | SAP test healer agent (Claude Code)       |
| .github/agents (6)              | `/.github/agents/*.agent.md`                     | ~2000+ | Copilot Coding Agents (GitHub)            |
| .jules/setup.md                 | `/.jules/setup.md`                               |  ~100  | OpenAI Jules setup                        |
| .antigravity/rules.md           | `/.antigravity/rules.md`                         |  ~100  | Google Antigravity rules                  |
| .cursor/rules (2)               | `/.cursor/rules/*.mdc`                           |  ~200  | Cursor IDE rules                          |
| .github/copilot-instructions.md | `/.github/copilot-instructions.md`               |  ~200  | VS Code Copilot instructions              |
| capabilities.yaml               | `/capabilities.yaml`                             | ~1500+ | 179 capabilities source of truth          |
| recipes.yaml                    | `/recipes.yaml`                                  | ~500+  | Test recipe patterns                      |
| examples (6)                    | `/examples/*.ts`                                 |  ~600  | Runnable test examples                    |
| AI layer (20 files)             | `/src/ai/**/*.ts`                                | ~3000+ | Built-in agentic capabilities             |
| Error system (16 files)         | `/src/core/errors/**/*.ts`                       | ~1500+ | 14 classes, 58 codes, toAIContext()       |
| Fixtures (20 files)             | `/src/fixtures/**/*.ts`                          | ~3000+ | 14 Playwright fixtures                    |

## Appendix B: Error Code to Framework Mapping

| Error Code                   | Agent Action                                       | Retryable |
| ---------------------------- | -------------------------------------------------- | :-------: |
| ERR_AI_NOT_CONFIGURED        | Check config.ai block, suggest provider setup      |    No     |
| ERR_AI_LLM_CALL_FAILED       | Retry with backoff, check API key/endpoint         |    Yes    |
| ERR_AI_RESPONSE_PARSE_FAILED | Retry with stricter JSON instructions              |    Yes    |
| ERR_AI_CONTEXT_BUILD_FAILED  | Wait for UI5 stable, retry discovery               |    Yes    |
| ERR_AI_CAPABILITY_NOT_FOUND  | List available capabilities, suggest closest match |    No     |
| ERR_AI_TOKEN_LIMIT           | Reduce context, truncate controls                  |    Yes    |
| ERR_AI_RATE_LIMITED          | Backoff and retry                                  |    Yes    |
| ERR_CONTROL_NOT_FOUND        | Read error.suggestedSelector, try alternative      |    Yes    |
| ERR_BRIDGE_TIMEOUT           | Wait for UI5 bootstrap, retry                      |    Yes    |
| ERR_AUTH_FAILED              | Regenerate storageState, check credentials         |    No     |
| ERR_NAV_TILE_NOT_FOUND       | List available tiles, check FLP space/tab          |    No     |
| ERR_ODATA_CSRF               | Refresh CSRF token, retry                          |    Yes    |

---

_End of Part 4: Framework Integration Audit Report_
