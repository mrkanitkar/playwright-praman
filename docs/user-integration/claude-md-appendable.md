# Praman SAP Test Automation — Claude Code Integration

Append this to your project's `CLAUDE.md` to enable SAP UI5 test generation with Praman.

---

## Praman SAP Agent Setup

**Package**: `playwright-praman`
**Primary skill reference**: `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`

### Setup Steps

```bash
# 1. Initialize Playwright agents for Claude Code
npx playwright init-agents --loop=claude --prompts

# 2. Copy Praman SAP agents
cp node_modules/playwright-praman/agents/claude/*.md .claude/agents/
cp node_modules/playwright-praman/agents/claude/prompts/*.md .claude/prompts/

# 3. Copy seed file
cp node_modules/playwright-praman/seeds/sap-seed.spec.ts tests/seeds/

# 4. Set environment variables
export SAP_CLOUD_BASE_URL=https://your-system.s4hana.cloud.sap/
export SAP_CLOUD_USERNAME=your-user
export SAP_CLOUD_PASSWORD=your-password
```

### Available Agents

After setup, you have 6 agents in `.claude/agents/`:

| Agent                       | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `playwright-test-planner`   | Generic web test planning                  |
| `playwright-test-generator` | Generic test generation                    |
| `playwright-test-healer`    | Generic test healing                       |
| `praman-sap-planner`        | SAP UI5 test planning with Praman fixtures |
| `praman-sap-generator`      | SAP UI5 test generation (100% Praman)      |
| `praman-sap-healer`         | SAP UI5 test healing and compliance fixing |

### The 7 Mandatory Rules (All Praman Agents)

1. EVERY UI5 element → `ui5.control()` + proxy methods ONLY
2. NEVER use Playwright native selectors for UI5 elements
3. Non-UI5 elements → Playwright native permitted (verify first)
4. `import { test, expect } from 'playwright-praman'` ONLY
5. Auth via seed — `sapAuth.login()` in seed, never in test body
6. Post-generation: scan 16+ forbidden patterns
7. TSDoc compliance header in every generated test

### Import Pattern

```typescript
// ✅ ONLY valid import
import { test, expect } from 'playwright-praman';
```

### Using Praman Agents

```text
# Plan tests for your SAP app
Select agent: praman-sap-planner
"Plan tests for the Purchase Order Fiori application"

# Generate tests from plan
Select agent: praman-sap-generator
"Generate tests from specs/purchase-order.plan.md"

# Fix failing tests
Select agent: praman-sap-healer
"Fix failing test tests/e2e/purchase-order/create.spec.ts"

# Full coverage (plan → generate → heal)
Use /praman-sap-coverage prompt
```

### Skill Reference

All agents read skill files from:

- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/SKILL.md`
- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/ai-quick-reference.md`
- `node_modules/playwright-praman/skills/playwright-praman-sap-testing/test-template.ts`
