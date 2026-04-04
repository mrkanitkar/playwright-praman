# Capability Query Implementation Proposal

**Purpose:** Enable agents to programmatically discover what Praman can do at runtime.

**Effort Estimate:** 4 hours total

---

## Design Goals

1. **Discoverable:** Agent can query capabilities without reading docs
2. **Actionable:** Response includes `agent_hint`, `example`, and available APIs
3. **Cacheable:** Can be called once, cached, and used for skill selection
4. **Extensible:** New capabilities added to `capabilities.yaml` auto-appear in query response
5. **IDE-friendly:** Works in VS Code, Cursor, JetBrains, and CLI environments

---

## Implementation Phases

### Phase 1: CLI Command (2 hours)

#### 1.1 New File: `src/cli/commands/capabilities.ts`

```typescript
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'js-yaml';

export interface CapabilityQueryOptions {
  format?: 'json' | 'yaml';
  category?: string;
  agent?: boolean;
}

interface CapabilityEntry {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: string;
  apis: string[];
  guarantees?: string[];
  failures?: string[];
  controlTypes?: string[];
  usageExample?: string;
  agentHint?: string;
  registryVersion: number;
}

interface CapabilityRegistry {
  registryVersion: number;
  generatedAt: string;
  capabilities: CapabilityEntry[];
  preBuiltScripts?: Record<string, string>;
}

export async function capabilities(opts: CapabilityQueryOptions): Promise<void> {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const yamlPath = resolve(__dirname, '../../../capabilities.yaml');

    const yamlContent = readFileSync(yamlPath, 'utf-8');
    const registry = YAML.load(yamlContent) as CapabilityRegistry;

    // Filter by category if specified
    let filtered = registry.capabilities;
    if (opts.category) {
      filtered = filtered.filter(c => c.category === opts.category);
    }

    // Agent-optimized output: include only essential fields
    if (opts.agent) {
      const agentView = {
        registryVersion: registry.registryVersion,
        generatedAt: registry.generatedAt,
        totalCapabilities: filtered.length,
        capabilities: filtered.map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          apis: c.apis,
          agentHint: c.agentHint,
          usageExample: c.usageExample,
          controlTypes: c.controlTypes,
        })),
        preBuiltScripts: registry.preBuiltScripts || {},
      };

      if (opts.format === 'json' || !opts.format) {
        console.log(JSON.stringify(agentView, null, 2));
      } else {
        console.log(YAML.dump(agentView));
      }
    } else {
      // Full output with guarantees, failures, etc.
      if (opts.format === 'json' || !opts.format) {
        console.log(JSON.stringify(registry, null, 2));
      } else {
        console.log(YAML.dump(registry));
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Capability query failed: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}
```

#### 1.2 Update: `src/cli/program.ts` (Register Command)

```typescript
import { capabilities } from './commands/capabilities.js';

// Add to command registration
program
  .command('capabilities')
  .description('Query available Praman capabilities for agents and developers')
  .option('--format <format>', 'Output format: json or yaml', 'json')
  .option('--category <category>', 'Filter by capability category', '')
  .option('--agent', 'Optimized output for AI agents (only essential fields)')
  .action(async (opts) => {
    await capabilities({
      format: opts.format as 'json' | 'yaml',
      category: opts.category || undefined,
      agent: opts.agent || false,
    });
  });
```

#### 1.3 Output Format (with `--agent` flag)

```json
{
  "registryVersion": 1,
  "generatedAt": "2026-04-02T15:30:00Z",
  "totalCapabilities": 28,
  "capabilities": [
    {
      "id": "UI5-LOC-001",
      "name": "Locate controls by metadata",
      "category": "discovery",
      "apis": ["ui5.control(selector)", "ui5.controls(selector)", "ui5.inspect(selector)"],
      "agentHint": "Use when finding UI5 controls. Stable across rerenders; no CSS dependency.",
      "usageExample": "const btn = await ui5.control({ id: 'submitBtn' });",
      "controlTypes": ["sap.m.Button", "sap.m.Input", "sap.m.Select"]
    },
    {
      "id": "UI5-ACT-001",
      "name": "Control interactions",
      "category": "interact",
      "apis": ["ui5.click(selector)", "ui5.fill(selector, value)", "ui5.select(selector, key)"],
      "agentHint": "Use for clicking, filling, selecting. Waits for UI5 stability before/after.",
      "usageExample": "await ui5.click({ controlType: 'sap.m.Button', properties: { text: 'Save' } });"
    },
    ...
  ],
  "preBuiltScripts": {
    "discover-all.js": "Enumerate all controls with types, properties, methods",
    "bridge-status.js": "Check bridge readiness and UI5 version",
    "dialog-controls.js": "Find open dialogs and their contents"
  }
}
```

**Usage:**
```bash
# Full query
npx playwright-praman capabilities --format=json

# Agent-optimized (smaller, essential fields only)
npx playwright-praman capabilities --format=json --agent

# Filter by category
npx playwright-praman capabilities --agent --category=discover

# YAML output
npx playwright-praman capabilities --format=yaml --agent
```

---

### Phase 2: Skill Frontmatter Enhancement (1 hour)

#### 2.1 Update: `skills/praman-sap-cli/claude-SKILL.md`

```yaml
---
name: praman-sap-cli
description: >
  SAP UI5 test automation via Playwright CLI. Use when testing SAP Fiori apps,
  discovering UI5 controls, debugging Praman tests, or automating SAP workflows.
  Extends playwright-cli with SAP/UI5 awareness.

# NEW: Agent-facing tags
skill_type: cli-discovery
execution_mode: live-browser
tool_integration: playwright-cli
execution_scope: session-oriented

# NEW: Help skill selection
best_for:
  - "Live discovery of UI5 controls"
  - "Debugging Praman test failures"
  - "Interactive SAP workflows"
  - "Learning Praman bridge APIs"

not_best_for:
  - "Offline test code generation"
  - "CI/CD pipeline integration"
  - "Fixture-based test writing"

# NEW: Capability tags
supported_capabilities:
  - UI5-LOC-001  # Locate controls
  - UI5-LOC-003  # Inspect metadata
  - UI5-ACT-001  # Control interactions
  - WAIT-001     # UI5 stability
  - NAV-001      # FLP navigation
  - AUTH-001     # SAP authentication

recommended_secondary_skills:
  - skills-sap-ui5-expert.md      # Control types, SAP domain
  - skills-playwright-expert.md   # CLI patterns, trace viewer
  - skills-tester.md              # Test structure

allowed-tools: Bash(playwright-cli:*) Bash(npx:*) Bash(npm:*)
---
```

#### 2.2 Update: `skills/playwright-praman-sap-testing/SKILL.md`

```yaml
---
name: playwright-praman-sap-testing
description: >
  SAP UI5 test automation using Playwright fixtures. Use when writing end-to-end
  Praman tests, creating reusable fixtures, and building maintainable test suites.

# NEW: Agent-facing tags
skill_type: fixture-generation
execution_mode: fixture-api
tool_integration: playwright-test
execution_scope: test-code-oriented

best_for:
  - "Writing production Praman tests"
  - "Creating reusable fixtures"
  - "Building test utilities"
  - "Test suite architecture"

not_best_for:
  - "Live browser discovery"
  - "Debugging individual controls"
  - "Interactive SAP workflows"

supported_capabilities:
  - UI5-LOC-001  # Locate controls
  - UI5-ACT-001  # Control interactions
  - FIX-001      # Fixtures
  - FLP-001      # FLP navigation fixture
  - TABLE-001    # Table fixture
  - INTENT-001   # Intent fixture

recommended_secondary_skills:
  - skills-sap-ui5-expert.md
  - skills-tdd.md              # Test structure
  - skills-playwright-expert.md

allowed-tools: Glob, Grep, Read, Write, Bash(npm:*), Bash(npx:*)
---
```

---

### Phase 3: Agent Helper Functions (1 hour)

#### 3.1 New File: `src/ai/capability-query-helper.ts`

```typescript
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

export interface CapabilityMatch {
  id: string;
  name: string;
  relevanceScore: number; // 0-100
  matchReason: string;
  example: string;
  apis: string[];
}

/**
 * Query Praman capabilities and filter by agent intent.
 *
 * @example
 * ```typescript
 * const matches = await queryCapabilities('discover UI5 controls', 'activity');
 * // Returns: [{ id: 'UI5-LOC-001', name: 'Locate controls', ... }]
 * ```
 */
export async function queryCapabilities(
  intent: string,
  context: 'discovery' | 'interaction' | 'assertion' | 'activity'
): Promise<CapabilityMatch[]> {
  try {
    // Call CLI command
    const output = execSync(
      'npx playwright-praman capabilities --format=json --agent',
      { encoding: 'utf-8' }
    );

    const registry = JSON.parse(output);
    const intentLower = intent.toLowerCase();

    // Score each capability by relevance to intent
    const scored = registry.capabilities.map(cap => {
      let score = 0;

      // Exact category match
      if (cap.category === context) score += 40;

      // Keyword match in name, description, agent hint
      const searchText = `${cap.name} ${cap.description || ''} ${cap.agentHint || ''}`.toLowerCase();
      const keywords = intentLower.split(/\s+/);
      keywords.forEach(kw => {
        if (searchText.includes(kw)) score += 10;
      });

      // API relevance
      const relevantApi = cap.apis.find(api =>
        api.toLowerCase().includes(intentLower.split(/\s+/)[0])
      );
      if (relevantApi) score += 20;

      return {
        id: cap.id,
        name: cap.name,
        relevanceScore: Math.min(100, score),
        matchReason: `${cap.category} capability`,
        example: cap.usageExample || '',
        apis: cap.apis,
      } as CapabilityMatch;
    });

    // Return top 5 by score
    return scored.filter(s => s.relevanceScore > 20).sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 5);
  } catch (error) {
    console.error('Capability query failed:', error);
    return [];
  }
}

/**
 * Get recommended secondary skills based on capability.
 *
 * @example
 * ```typescript
 * const skills = getRecommendedSkills('praman-sap-cli');
 * // Returns: ['skills-sap-ui5-expert.md', 'skills-playwright-expert.md']
 * ```
 */
export function getRecommendedSkills(skillName: string): string[] {
  const skillMap: Record<string, string[]> = {
    'praman-sap-cli': [
      'skills-sap-ui5-expert.md',
      'skills-playwright-expert.md',
      'skills-tester.md',
    ],
    'playwright-praman-sap-testing': [
      'skills-sap-ui5-expert.md',
      'skills-tdd.md',
      'skills-playwright-expert.md',
    ],
  };

  return skillMap[skillName] || [];
}
```

---

### Phase 4: Agent Integration Guide (30 minutes)

#### 4.1 New File: `.claude/guides/capability-discovery.md`

```markdown
# Capability Discovery Guide for Claude Code Agents

This guide shows how to programmatically discover Praman capabilities.

## Quick Start

```typescript
// 1. Query capabilities once at session start
const output = await Bash.run('npx playwright-praman capabilities --format=json --agent');
const registry = JSON.parse(output);

// 2. Cache in session memory
const caps = new Map(registry.capabilities.map(c => [c.id, c]));

// 3. Search by keyword
const locateCaps = registry.capabilities.filter(c =>
  c.agentHint?.includes('locate') || c.name?.includes('locate')
);
// Returns: [{ id: 'UI5-LOC-001', name: 'Locate controls', ... }]
```

## Use Cases

### Discovering Available Commands

```bash
$ npx playwright-praman capabilities --format=json --agent
```

Output:
```json
{
  "registryVersion": 1,
  "capabilities": [
    {
      "id": "UI5-LOC-001",
      "name": "Locate controls by metadata",
      "apis": ["ui5.control()", "ui5.controls()", "ui5.inspect()"],
      "agentHint": "Use when finding UI5 controls on screen"
    }
  ]
}
```

### Filtering by Category

```bash
$ npx playwright-praman capabilities --format=json --agent --category=discover
```

Returns only discovery-related capabilities.

### Skill Selection

When user says "test my SAP app", agent workflow:

```
1. Query capabilities --agent
2. Load skill frontmatter (contains supported_capabilities list)
3. Match user intent to capability IDs
4. Select skill that supports those capabilities
5. Load recommended_secondary_skills automatically
```

### Error Recovery

When error occurs:

```typescript
const error = {
  code: 'ERR_CONTROL_NOT_FOUND',
  controlId: 'vendorInput',
  attempted: 'ui5.control({ id: "vendorInput" })'
};

// Search for related capabilities
const related = registry.capabilities.filter(c =>
  c.agentHint?.includes('not found') ||
  c.agentHint?.includes('locate')
);
// Use related capabilities to suggest recovery
```

## Cached Capability Model

Store once per session:

```typescript
interface CachedCapabilities {
  version: string;
  lastQueried: Date;
  capabilities: Map<string, Capability>;
  byCategory: Map<string, Capability[]>;
}

// Initialize
const caps = new CachedCapabilities();
caps.capabilities = new Map(
  registry.capabilities.map(c => [c.id, c])
);
caps.byCategory = new Map();
registry.capabilities.forEach(c => {
  if (!caps.byCategory.has(c.category)) {
    caps.byCategory.set(c.category, []);
  }
  caps.byCategory.get(c.category)!.push(c);
});
```

Then use throughout session:
```typescript
const discoveryCaps = caps.byCategory.get('discovery');
const controlById = caps.capabilities.get('UI5-LOC-001');
```
```

---

## Testing & Validation

### 4.1 Unit Test: `tests/unit/cli/commands/capabilities.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { capabilities } from '#cli/commands/capabilities.js';

describe('capabilities command', () => {
  it('returns JSON output with agent option', async () => {
    // Mock stdout capture
    const output = await runCommand('npx playwright-praman capabilities --agent');
    const parsed = JSON.parse(output);

    expect(parsed.registryVersion).toBe(1);
    expect(Array.isArray(parsed.capabilities)).toBe(true);
    expect(parsed.capabilities[0]).toHaveProperty('id');
    expect(parsed.capabilities[0]).toHaveProperty('agentHint');
  });

  it('filters by category', async () => {
    const output = await runCommand(
      'npx playwright-praman capabilities --agent --category=discovery'
    );
    const parsed = JSON.parse(output);

    parsed.capabilities.forEach(cap => {
      expect(cap.category).toBe('discovery');
    });
  });

  it('includes pre-built scripts in registry', async () => {
    const output = await runCommand('npx playwright-praman capabilities --agent');
    const parsed = JSON.parse(output);

    expect(parsed.preBuiltScripts).toBeDefined();
    expect(parsed.preBuiltScripts['discover-all.js']).toBeDefined();
  });
});
```

---

## Integration with Existing Workflows

### 5.1 Planner Agent Enhancement

In `.claude/agents/praman-sap-planner-cli.md`:

```markdown
## MANDATORY PREFLIGHT

Before starting, query capabilities to ensure bridge is available:

\`\`\`bash
npx playwright-praman capabilities --agent --category=discovery
\`\`\`

This validates that:
1. Praman is installed
2. Bridge APIs are available
3. Discovery capabilities match your version
```

### 5.2 Skill Selection Helper

In `CLAUDE.md`:

```markdown
## Agent Capability Discovery

When starting a Praman task:

1. Query capabilities once per session:
   \`\`\`bash
   npx playwright-praman capabilities --format=json --agent > /tmp/praman-caps.json
   \`\`\`

2. Match user intent to capabilities:
   - "discover controls" → filter by `category: discovery`
   - "fill form" → filter by `category: interact`
   - "wait for load" → filter by `category: wait`

3. Select appropriate skill:
   - Live discovery → `praman-sap-cli` skill
   - Test writing → `playwright-praman-sap-testing` skill
```

---

## Success Criteria

- [ ] `npx playwright-praman capabilities` returns valid JSON
- [ ] Capability query completes in <1 second
- [ ] Agent can parse response and use `agentHint` field
- [ ] Skill frontmatter tags match capability IDs
- [ ] Zero agent human intervention needed for skill selection
- [ ] Error recovery can query related capabilities
- [ ] Capability cache reduces token consumption by 30%

---

## Future Enhancements

1. **OpenAPI schema export** — For IDE integration
2. **Capability versioning** — Track deprecations
3. **Agent evaluation metrics** — Track which capabilities agents use most
4. **Capability recipes** — Common patterns (e.g., "fill and verify" = ui5.fill + assertion)
5. **Dynamic skill recommendation** — AI suggests secondary skills based on capability mix

