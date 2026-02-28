---
sidebar_position: 24
title: 'Capabilities & Recipes Guide'
---

Praman ships with a capability registry and a recipe registry that describe what the framework
can do and how to do it. These registries serve two audiences: human testers browsing the API
surface, and AI agents that need structured context for test generation.

## Capabilities

A **capability** is a single API method or fixture function that Praman exposes. Each capability
has a name, description, category, usage example, and priority tier.

### Listing All Capabilities

```typescript
import { capabilities } from 'playwright-praman';

// List every registered capability
const all = capabilities.list();
console.log(`Total capabilities: ${all.length}`);

for (const cap of all) {
  console.log(`${cap.name} (${cap.category}): ${cap.description}`);
}
```

### Filtering by Priority

Capabilities are organized into three priority tiers:

| Priority         | Meaning                                                    | Example                                          |
| ---------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| `fixture`        | Primary Playwright fixture API (recommended for consumers) | `ui5.control()`, `ui5Navigation.navigateToApp()` |
| `namespace`      | Secondary utility or handler export                        | `SAPAuthHandler`, `buildPageContext()`           |
| `implementation` | Internal implementation detail                             | Bridge adapters, serializers                     |

```typescript
import { capabilities } from 'playwright-praman';

// Only the fixture-level APIs (what most testers need)
const fixtures = capabilities.listFixtures();
console.log(`Fixture-level capabilities: ${fixtures.length}`);

// Or by any priority
const namespaceLevel = capabilities.listByPriority('namespace');
```

### Searching Capabilities

```typescript
import { capabilities } from 'playwright-praman';

// Search by substring in name or description
const tableOps = capabilities.find('table');
for (const cap of tableOps) {
  console.log(`${cap.name}: ${cap.usageExample}`);
}

// Look up a specific capability by name
const clickCap = capabilities.findByName('clickButton');
if (clickCap) {
  console.log(clickCap.usageExample);
  // => await ui5.click({ id: 'submitBtn' })
}
```

### Browsing by Category

```typescript
import { capabilities } from 'playwright-praman';

// List all categories
const categories = capabilities.getCategories();
console.log(categories);
// => ['ui5', 'auth', 'navigate', 'table', 'dialog', 'date', ...]

// Get capabilities in a specific category (CapabilityCategory enum value)
const navCaps = capabilities.byCategory('navigate');
for (const cap of navCaps) {
  console.log(`${cap.name}: ${cap.description}`);
}
```

### Looking Up by ID

Each capability has a unique kebab-case ID.

```typescript
import { capabilities } from 'playwright-praman';

const cap = capabilities.get('click-button');
if (cap) {
  console.log(cap.name); // 'clickButton'
  console.log(cap.description); // 'Clicks a UI5 button by selector'
  console.log(cap.usageExample); // "await ui5.click({ id: 'submitBtn' })"
  console.log(cap.category); // 'ui5' (CapabilityCategory enum value)
  console.log(cap.priority); // 'fixture'
  console.log(cap.qualifiedName); // 'ui5.clickButton'
}
```

### Statistics

```typescript
import { capabilities } from 'playwright-praman';

const stats = capabilities.getStatistics();
console.log(`Total methods: ${stats.totalMethods}`);
console.log(`Categories: ${stats.categories.join(', ')}`);
console.log(`Fixtures: ${stats.byPriority.fixture}`);
console.log(`Namespace: ${stats.byPriority.namespace}`);
console.log(`Implementation: ${stats.byPriority.implementation}`);
```

## Recipes

A **recipe** is a reusable test pattern -- a curated code snippet that demonstrates how to
accomplish a specific testing task. Recipes have a name, description, domain, priority,
capabilities, and a ready-to-use pattern.

### Recipe Metadata

| Field          | Type             | Description                                                                |
| -------------- | ---------------- | -------------------------------------------------------------------------- |
| `id`           | `string`         | Unique kebab-case identifier (e.g. `'recipe-ui5-button-click'`)            |
| `name`         | `string`         | Short descriptive title                                                    |
| `description`  | `string`         | What this recipe demonstrates                                              |
| `domain`       | `string`         | Domain grouping (`'ui5'`, `'auth'`, `'navigation'`, etc.)                  |
| `priority`     | `RecipePriority` | `'essential'`, `'recommended'`, `'optional'`, `'advanced'`, `'deprecated'` |
| `capabilities` | `string[]`       | Capability IDs this recipe uses (e.g. `['UI5-UI5-003']`)                   |
| `pattern`      | `string`         | Ready-to-use TypeScript code pattern                                       |

### Selecting by Priority

```typescript
import { recipes } from 'playwright-praman';

// Must-know patterns for any SAP Fiori test suite
const essential = recipes.selectByPriority('essential');

// Best-practice patterns for common scenarios
const recommended = recipes.selectByPriority('recommended');

// Specialized patterns for complex edge cases
const advanced = recipes.selectByPriority('advanced');
```

### Selecting by Domain

```typescript
import { recipes } from 'playwright-praman';

// All authentication recipes
const authRecipes = recipes.selectByDomain('auth');

// All navigation recipes
const navRecipes = recipes.selectByDomain('navigation');

// List all available domains
const domains = recipes.getDomains();
console.log(domains);
```

### Combined Filtering

Use `recipes.select()` with multiple criteria.

```typescript
import { recipes } from 'playwright-praman';

// Essential recipes in the auth domain
const filtered = recipes.select({
  domain: 'auth',
  priority: 'essential',
});
```

### Searching Recipes

```typescript
import { recipes } from 'playwright-praman';

// Free-text search across name, description, and capabilities
const poRecipes = recipes.search('purchase order');
for (const r of poRecipes) {
  console.log(`${r.name}: ${r.description}`);
  console.log(r.pattern);
}

// Check if a recipe exists
if (recipes.has('Login to SAP BTP via SAML')) {
  const steps = recipes.getSteps('Login to SAP BTP via SAML');
  console.log(steps);
}
```

### Finding Recipes for a Capability

```typescript
import { recipes } from 'playwright-praman';

// Find recipes that use a specific capability
const clickRecipes = recipes.forCapability('click');
for (const r of clickRecipes) {
  console.log(`${r.name} [${r.priority}]`);
}
```

### Finding Recipes for a Business Process

```typescript
import { recipes } from 'playwright-praman';

// Recipes for procurement workflows
const procRecipes = recipes.forProcess('procurement');

// Recipes for a specific SAP domain
const finRecipes = recipes.forDomain('finance');
```

### Top Recipes

```typescript
import { recipes } from 'playwright-praman';

// Get the top 5 recipes (by insertion order)
const topFive = recipes.getTopRecipes(5);
for (const r of topFive) {
  console.log(`[${r.priority}] ${r.name}`);
}
```

## AI Agent Usage

Both registries are designed to be consumed by AI agents (Claude, GPT, Gemini) as structured
context for test generation.

### capabilities.forAI()

Returns the full registry as structured JSON optimized for AI consumption.

```typescript
import { capabilities } from 'playwright-praman';

const aiContext = capabilities.forAI();
// Returns CapabilitiesJSON:
// {
//   name: 'playwright-praman',
//   version: '1.0.0',
//   totalMethods: 120,
//   byPriority: { fixture: 40, namespace: 50, implementation: 30 },
//   fixtures: [...],  // Fixture-level entries listed first
//   methods: [...],   // All entries
// }
```

### Provider-Specific Formatting

Each AI provider has an output format optimized for its consumption model.

```typescript
import { capabilities } from 'playwright-praman';

// XML-structured for Claude
const claudeContext = capabilities.forProvider('claude');

// JSON registry snapshot for OpenAI
const openaiContext = capabilities.forProvider('openai');

// JSON registry snapshot for Gemini
const geminiContext = capabilities.forProvider('gemini');
```

### recipes.forAI()

Returns all recipes in a flat array suitable for injection into an AI prompt.

```typescript
import { recipes } from 'playwright-praman';

const allRecipes = recipes.forAI();
// Returns RecipeEntry[] with full pattern, capabilities, and metadata
```

### Building an AI Prompt with Capabilities and Recipes

```typescript
import { capabilities, recipes } from 'playwright-praman';

// Build a context string for an AI agent
const capabilityContext = JSON.stringify(capabilities.forAI(), null, 2);
const relevantRecipes = recipes.select({ domain: 'navigation' });

const prompt = `
You are a test automation agent for SAP Fiori applications.

Available capabilities:
${capabilityContext}

Relevant recipes:
${JSON.stringify(relevantRecipes, null, 2)}

Generate a Playwright test that navigates to the Purchase Order app and verifies
the table has at least one row.
`;
```

### Using with the Agentic Handler

The `pramanAI` fixture integrates capabilities and recipes automatically.

```typescript
import { test, expect } from 'playwright-praman';

test('AI-generated test', async ({ page, pramanAI }) => {
  // Discover the current page (builds PageContext)
  const context = await pramanAI.discoverPage({ interactiveOnly: true });

  // Generate a test from a natural language description
  // The agentic handler automatically uses capabilities + recipes as context
  const result = await pramanAI.agentic.generateTest(
    'Create a purchase order for vendor 100001 with material MAT-001',
    page,
  );

  console.log(result.steps); // ['Navigate to app', 'Fill vendor', ...]
  console.log(result.code); // Generated TypeScript test code
  console.log(result.metadata); // Model, tokens, duration, capabilities used
});
```

## Advanced: Registering Custom Capabilities

If your project extends Praman with custom helpers, register them so AI agents can discover them.

```typescript
import { capabilities } from 'playwright-praman';

capabilities.registry.register({
  id: 'UI5-CUSTOM-001',
  qualifiedName: 'custom.approveWorkflow',
  name: 'approveWorkflow',
  description: 'Approves a workflow item in the SAP Fiori inbox',
  category: 'ui5',
  intent: 'approve',
  sapModule: 'cross.fnd.fiori.inbox',
  usageExample: "await customHelpers.approveWorkflow({ workitemId: '000123' })",
  registryVersion: 1,
  priority: 'fixture',
});

// Now AI agents can discover it
const workflowCaps = capabilities.find('workflow');
```

## Validating Recipes

Check that a recipe exists and inspect its metadata.

```typescript
import { recipes } from 'playwright-praman';

const result = recipes.validate('Login to SAP BTP via SAML');
if (result.valid) {
  console.log('Recipe found');
} else {
  console.log('Recipe not found');
}
```

## JSON Export

Export the full registries for external tools, dashboards, or documentation generators.

```typescript
import { capabilities, recipes } from 'playwright-praman';

// Capabilities as JSON
const capJson = capabilities.toJSON();

// Recipes as JSON
const recipeJson = recipes.toJSON();

// Write to file for external consumption
import { writeFile } from 'node:fs/promises';
await writeFile('capabilities.json', JSON.stringify(capJson, null, 2));
await writeFile('recipes.json', JSON.stringify(recipeJson, null, 2));
```
