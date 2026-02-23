---
sidebar_position: 23
title: 'AI Integration'
---

# AI Integration

Praman is an AI-first test automation platform. The `playwright-praman/ai` sub-path provides structured interfaces for LLM-driven test generation, page analysis, and autonomous agent workflows.

## AiResponse Envelope

All AI operations return an `AiResponse<T>` discriminated union, providing type-safe handling without casting:

```typescript
import type { AiResponse } from 'playwright-praman/ai';

type AiResponse<T> =
  | { status: 'success'; data: T; metadata: AiResponseMetadata }
  | { status: 'error'; data: undefined; error: AiResponseError; metadata: AiResponseMetadata }
  | { status: 'partial'; data: Partial<T>; error?: AiResponseError; metadata: AiResponseMetadata };
```

Narrow on `status` to get type-safe access:

```typescript
function handle<T>(response: AiResponse<T>): T | undefined {
  if (response.status === 'success') {
    return response.data; // TypeScript knows this is T
  }
  if (response.status === 'error') {
    console.error(response.error.code, response.error.message);
    if (response.metadata.retryable) {
      // Agent can retry this operation
    }
  }
  return undefined;
}
```

### AiResponseMetadata

Every response carries metadata for performance tracking and self-healing:

```typescript
interface AiResponseMetadata {
  readonly duration: number; // Elapsed time in ms
  readonly retryable: boolean; // Can the caller retry?
  readonly suggestions: string[]; // Recovery hints for agents/testers
  readonly model?: string; // Model identifier (e.g., 'gpt-4o')
  readonly tokens?: number; // Total tokens consumed
}
```

## Provider Abstraction

Praman supports three LLM providers through a unified `LlmService` interface:

| Provider         | SDK                 | Config Key                 |
| ---------------- | ------------------- | -------------------------- |
| Azure OpenAI     | `openai`            | `provider: 'azure-openai'` |
| OpenAI           | `openai`            | `provider: 'openai'`       |
| Anthropic Claude | `@anthropic-ai/sdk` | `provider: 'anthropic'`    |

Provider SDKs are loaded via dynamic `import()` and remain optional dependencies. If the SDK is not installed, a clear `AIError` with installation instructions is thrown.

### Configuration

```typescript
// praman.config.ts
export default {
  ai: {
    provider: 'azure-openai',
    model: 'gpt-4o',
    endpoint: 'https://my-resource.openai.azure.com/',
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    temperature: 0.2,
    maxTokens: 4096,
    apiVersion: '2024-02-15-preview',
    deployment: 'my-gpt4o-deployment',
  },
};
```

### Creating an LLM Service

```typescript
import { createLlmService } from 'playwright-praman/ai';

const llm = createLlmService(config);
const response = await llm.complete([
  { role: 'system', content: 'You are a test generator...' },
  { role: 'user', content: 'Generate a test for the login page' },
]);
```

## AgenticCheckpoint

For long-running multi-step AI workflows, Praman provides checkpoint serialization. The `AgenticCheckpoint` allows AI agents to resume from the last successful step on failure:

```typescript
import type { AgenticCheckpoint } from 'playwright-praman/ai';

const checkpoint: AgenticCheckpoint = {
  sessionId: 'sess-001',
  currentStep: 2,
  completedSteps: ['discover', 'plan'],
  remainingSteps: ['generate', 'validate'],
  state: { pageUrl: 'https://my.app/launchpad' },
  timestamp: new Date().toISOString(),
};
```

The `AgenticHandler` serializes progress automatically:

```typescript
import { AgenticHandler } from 'playwright-praman/ai';

const handler = new AgenticHandler(llmService, capabilityRegistry, recipeRegistry, page);

// generateTest returns AiResponse<AiGeneratedTest> with checkpoint data
const result = await handler.generateTest('Test the purchase order creation flow');
```

## Page Context and toAIContext()

### buildPageContext()

Discovers all UI5 controls on the page and builds a structured context for LLM prompts:

```typescript
import { buildPageContext } from 'playwright-praman/ai';

const context = await buildPageContext(page, config);
if (context.status === 'success') {
  const { controls, formFields, buttons, tables } = context.data;
  // Feed to LLM as structured context
}
```

The returned `PageContext` partitions controls by semantic category:

```typescript
interface PageContext {
  readonly url: string;
  readonly ui5Version?: string;
  readonly controls: DiscoveredControl[]; // All controls
  readonly formFields: DiscoveredControl[]; // Inputs, selects, etc.
  readonly buttons: DiscoveredControl[]; // Buttons, clickable triggers
  readonly tables: DiscoveredControl[]; // Data tables and lists
  readonly navigationElements: DiscoveredControl[];
  readonly timestamp: string;
}
```

### toAIContext() on Errors

Every `PramanError` provides `toAIContext()` for machine-readable error introspection:

```typescript
try {
  await ui5.click({ id: 'submitBtn' });
} catch (error) {
  if (error instanceof PramanError) {
    const context = error.toAIContext();
    // {
    //   code: 'ERR_CONTROL_NOT_FOUND',
    //   message: 'Control not found: submitBtn',
    //   attempted: 'Find control with selector: {"id":"submitBtn"}',
    //   retryable: true,
    //   suggestions: ['Verify the control ID exists in the UI5 view', ...]
    // }
  }
}
```

## Token-Aware Metadata

All AI responses include token usage information when the provider reports it:

```typescript
const result = await handler.generateTest('Create a PO test');
if (result.status === 'success') {
  console.log(result.data.metadata.tokens);
  // { input: 1200, output: 340 }
  console.log(result.data.metadata.model);
  // 'gpt-4o'
  console.log(result.data.metadata.duration);
  // 1850 (ms)
}
```

This enables cost tracking and prompt optimization in CI pipelines.

## Capability Registry

The `CapabilityRegistry` exposes Praman's API surface to AI agents for test generation:

```typescript
import { CapabilityRegistry } from 'playwright-praman/ai';

const registry = new CapabilityRegistry();

// Query by category
const interactionCaps = registry.byCategory('interaction');

// Get all capabilities for AI prompt context
const aiContext = registry.forAI();

// Provider-specific formatting
const claudeFormat = registry.forProvider('claude'); // XML-structured
const openaiFormat = registry.forProvider('openai'); // JSON function schemas
```

Each capability entry includes:

```typescript
interface CapabilityEntry {
  readonly id: string; // 'click-button'
  readonly name: string; // 'clickButton'
  readonly description: string; // 'Clicks a UI5 button by selector'
  readonly category: string; // 'interaction'
  readonly usage_example: string; // "await ui5.click({ id: 'submitBtn' })"
  readonly registryVersion: number; // For cache invalidation
  readonly priority?: 'fixture' | 'namespace' | 'implementation';
}
```

Capabilities are auto-generated from TSDoc annotations via `npm run generate:capabilities`. The `registryVersion` field enables AI agents to detect stale cached data.

## Recipe Registry

The `RecipeRegistry` provides curated test patterns that AI agents can emit verbatim or adapt:

```typescript
import { RecipeRegistry } from 'playwright-praman/ai';

const registry = new RecipeRegistry();

// Filter by category and audience
const authRecipes = registry.select({ category: 'auth', role: 'ai-agent' });

// Get the top N essential recipes for prompt context
const topFive = registry.getTopRecipes(5);

// Get all recipes formatted for AI consumption
const aiRecipes = registry.forAI();
```

Each recipe entry:

```typescript
interface RecipeEntry {
  readonly id: string; // 'login-sap-cloud'
  readonly title: string; // 'Login to SAP BTP via SAML'
  readonly description: string;
  readonly category: string; // 'auth'
  readonly role: 'ai-agent' | 'human-tester' | 'both';
  readonly priority: 'essential' | 'recommended' | 'advanced' | 'deprecated';
  readonly code: string; // Ready-to-use TypeScript code
  readonly tags: string[]; // ['auth', 'saml', 'btp']
}
```

## AI Surface Modes

Praman supports two AI modes (Decision D9):

**Mode A -- SKILL.md for code-gen agents**: A strengthened skill file with typed API surface, capability/recipe registries, and usage examples. Agents like GitHub Copilot, Claude Code, and Cursor consume this to generate test code.

**Mode C -- Agentic fixture for in-test agents**: The `AgenticHandler` fixture with Zod-validated LLM output for autonomous test generation during test execution. The handler builds page context, generates test code, and validates the output against schemas.

There is no MCP server -- Praman remains a Playwright plugin and does not duplicate browser management.
