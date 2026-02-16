# Praman v1.0 — AI Agent Team: Roles, Skills & Collaboration Model

## Development Team Blueprint for 100% AI-Authored Code

| Property             | Value                                                       |
| -------------------- | ----------------------------------------------------------- |
| **Document ID**      | PRAMAN-SKILLS-TEAM-001                                      |
| **Version**          | 1.0.0                                                       |
| **Parent Documents** | plan.md (PRAMAN-ARCH-PLAN-001), setup.md (PRAMAN-SETUP-001) |
| **Created**          | 2025-02-15                                                  |

---

## 1. Team Philosophy

**100% of code is written by AI agents. Humans architect, review, and approve.**

The Praman v1.0 development model uses specialized AI agents as a virtual engineering team. Each agent has a focused skill file that defines its expertise, behavioral rules, and interaction patterns. Agents are tool-agnostic — the same skill can be loaded into GitHub Copilot, Claude Code, Google Jules, or any future AI coding agent.

### Core Principles

1. **Specialization over generalization** — Each agent excels at one domain. No agent does everything.
2. **Skill files are executable knowledge** — Not documentation for humans. Instructions for machines.
3. **Agents collaborate via artifacts** — Code, tests, PRs, issues. Never via chat between agents.
4. **Human is the orchestrator** — Assigns tasks, resolves conflicts between agent outputs, approves PRs.
5. **Every output is verifiable** — Agents produce outputs that can be mechanically validated (lint, typecheck, test, coverage).

---

## 2. Team Roster

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PRAMAN v1.0 AI AGENT TEAM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🏗️  ARCHITECT AGENT (skills-architect.md)                                  │
│  │   Owns: Architecture decisions, module boundaries, API design,           │
│  │         interface contracts, layer compliance                            │
│  │                                                                          │
│  ├── 💻 IMPLEMENTER AGENT (skills-implementer.md)                           │
│  │   │   Owns: TypeScript implementation, proxy patterns, bridge adapters,  │
│  │   │         error handling, config, logging                              │
│  │   │                                                                      │
│  │   ├── 🎭 PLAYWRIGHT EXPERT (skills-playwright-expert.md)                 │
│  │   │       Owns: Fixtures, selectors, assertions, browser automation,     │
│  │   │             test.step(), expect.extend(), project dependencies       │
│  │   │                                                                      │
│  │   └── 🔷 SAP UI5 EXPERT (skills-sap-ui5-expert.md)                      │
│  │           Owns: UI5 control types, FLP, OData, RecordReplay API,         │
│  │                 bridge scripts, SAP authentication                       │
│  │                                                                          │
│  ├── 🧪 TEST ENGINEER AGENT (skills-tester.md)                              │
│  │       Owns: Unit tests (Vitest), integration tests (Playwright),         │
│  │             behavioral equivalence, coverage, hermetic mocks             │
│  │                                                                          │
│  ├── 🔍 CODE REVIEWER AGENT (skills-reviewer.md)                            │
│  │       Owns: PR review, D1–D29 compliance, quality gates, best practice   │
│  │             verification, architecture drift detection                   │
│  │                                                                          │
│  └── 🔒 SECURITY & BUILD AGENT (skills-security-build.md)                   │
│          Owns: CI/CD, GitHub Actions, npm publish, SBOM, provenance,        │
│                dependency scanning, secret redaction, bundle size            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Agent Collaboration Model

### 3.1 Workflow Per Feature

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────┐
│  HUMAN   │────▶│ ARCHITECT │────▶│ IMPLEMENTER  │────▶│  TESTER  │
│  (Issue) │     │ (Design)  │     │ (Code)       │     │ (Tests)  │
└──────────┘     └───────────┘     └──────────────┘     └──────────┘
                                          │                    │
                                   ┌──────┴──────┐            │
                                   │   PW Expert │            │
                                   │  UI5 Expert │            │
                                   └─────────────┘            │
                                                              ▼
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────┐
│  HUMAN   │◀────│  REVIEWER │◀────│   SEC/BUILD  │◀────│  (PR)    │
│ (Approve)│     │ (Review)  │     │ (CI passes)  │     │          │
└──────────┘     └───────────┘     └──────────────┘     └──────────┘
```

### 3.2 When to Use Which Agent

| Task                                               | Primary Agent    | Supporting Agent(s)                 |
| -------------------------------------------------- | ---------------- | ----------------------------------- |
| New module design                                  | Architect        | —                                   |
| Interface/type definition                          | Architect        | Implementer                         |
| Core infrastructure code (config, errors, logging) | Implementer      | —                                   |
| Bridge adapter implementation                      | Implementer      | SAP UI5 Expert                      |
| Proxy handler implementation                       | Implementer      | SAP UI5 Expert, Playwright Expert   |
| Fixture implementation                             | Implementer      | Playwright Expert                   |
| Custom matchers (`expect.extend`)                  | Implementer      | Playwright Expert                   |
| Browser-evaluated scripts                          | Implementer      | SAP UI5 Expert                      |
| Unit tests                                         | Tester           | —                                   |
| Integration tests                                  | Tester           | Playwright Expert, SAP UI5 Expert   |
| Behavioral equivalence tests                       | Tester           | SAP UI5 Expert                      |
| PR review                                          | Reviewer         | —                                   |
| CI pipeline changes                                | Security & Build | —                                   |
| Dependency updates                                 | Security & Build | —                                   |
| Security audit                                     | Security & Build | Reviewer                            |
| Documentation (TSDoc)                              | Implementer      | —                                   |
| Documentation (Docusaurus)                         | Architect        | —                                   |
| SKILL.md generation                                | Architect        | SAP UI5 Expert                      |
| Bug diagnosis                                      | Implementer      | Playwright Expert or SAP UI5 Expert |
| Performance optimization                           | Implementer      | SAP UI5 Expert                      |

### 3.3 Conflict Resolution

When two agents produce conflicting outputs:

1. **Architecture conflicts** → Architect agent's output wins; escalate to human if it contradicts plan.md D1–D29
2. **Implementation style** → Reviewer agent's judgment wins; it has the broadest quality perspective
3. **Test strategy** → Tester agent's output wins for test code; Implementer for production code
4. **SAP-specific behavior** → SAP UI5 Expert's output wins; they have domain authority
5. **Playwright patterns** → Playwright Expert's output wins; they know the framework idioms

---

## 4. Skill File Index

| File                                                       | Role                      | Key Expertise                                                                             |
| ---------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------- |
| [skills-architect.md](skills-architect.md)                 | Principal Architect       | 5-layer architecture, D1–D29, module boundaries, API design, architectural review         |
| [skills-implementer.md](skills-implementer.md)             | TypeScript Implementer    | Proxy patterns, bridge adapters, error hierarchy, config, logging, ESM, Zod               |
| [skills-reviewer.md](skills-reviewer.md)                   | Code Reviewer             | PR review, 29-decision compliance, quality gates, anti-pattern detection                  |
| [skills-tester.md](skills-tester.md)                       | Test Engineer             | Vitest (hermetic), Playwright (integration), golden master, coverage, mocking             |
| [skills-sap-ui5-expert.md](skills-sap-ui5-expert.md)       | SAP UI5 Domain Expert     | 500+ control types, FLP, OData V2/V4, RecordReplay, ElementRegistry, bridge scripts       |
| [skills-playwright-expert.md](skills-playwright-expert.md) | Playwright Expert         | Fixtures, selectors, assertions, expect.extend(), project dependencies, trace             |
| [skills-security-build.md](skills-security-build.md)       | Security & Build Engineer | GitHub Actions, npm provenance, SBOM, eslint-plugin-security, bundle size, release-please |

---

## 5. Shared Knowledge (All Agents Must Know)

Every agent skill file includes a reference to these shared foundations:

### 5.1 Reference Documents

- **Architecture**: `plan.md` — Decisions D1–D29, Principles 1–10, Gaps G1–G22
- **Agent Config**: `.github/copilot-instructions.md` — Copilot agent config
- **Claude Config**: `CLAUDE.md` — Claude Code agent instructions
- **ESLint**: `eslint.config.mjs` — Flat config with tsdoc, playwright, security, sonarjs, Microsoft SDL, node, promise, import-x, unicorn
- **TSDoc**: `tsdoc.json` — Microsoft TSDoc config extending @microsoft/api-extractor
- **Build**: `tsup.config.ts` — Multi-entry ESM build
- **Vitest**: `vitest.config.ts` — Unit test configuration
- **TypeDoc**: `typedoc.json` — API documentation generation
- **Documentation Standards**: `docs/documentation-standards.md` — TSDoc-only documentation guide

### 5.2 Non-Negotiable Rules (All Agents)

1. TypeScript strict mode — no `any`, no `as unknown as T` shortcuts
2. ESM only — `import`, never `require`
3. All public APIs must have TSDoc with `@example`
4. Use pino logger — NEVER `console.log`
5. NEVER use `page.waitForTimeout()` — use `waitForUI5Stable()` or auto-retry assertions
6. Every error extends `PramanError` with `code`, `attempted`, `retryable`, `details`, `suggestions[]`
7. Files: kebab-case. Types: PascalCase. Functions: camelCase. Constants: UPPER_CASE.
8. Modules ≤ 300 LOC (warning, document exceptions)
9. Conventional Commits: `feat(scope): description`
10. Config is `Readonly<PramanConfig>` — never mutate

### 5.3 Import Order (All Agents)

```typescript
// 1. Node built-ins
import { resolve } from 'node:path';

// 2. External packages
import { z } from 'zod';
import pino from 'pino';

// 3. Internal (path aliases)
import { PramanError } from '#core/errors';
import { logger } from '#core/logging';

// 4. Parent
import { BridgeAdapter } from '../adapter.js';

// 5. Sibling
import { parseSelector } from './selector-parser.js';
```

### 5.4 Error Pattern (All Agents)

```typescript
throw new ControlError({
  code: 'ERR_CONTROL_NOT_FOUND',
  message: `Control not found: ${selector.id}`,
  attempted: `Find control with selector: ${JSON.stringify(selector)}`,
  retryable: true,
  severity: 'error',
  details: { selector, timeout: config.controlDiscoveryTimeout, strategy: 'registry' },
  suggestions: [
    'Verify the control ID exists in the UI5 view',
    'Check if the page has fully loaded (waitForUI5Stable)',
    'Try using controlType + properties instead of ID',
  ],
  lastKnownSelector: previousSelector,
  availableControls: discoveredControls,
  suggestedSelector: bestMatch,
});
```

---

## 5.5 Quality Toolchain (All Agents Must Comply)

| Tool                             | Purpose                          | Command                | Gate                       |
| -------------------------------- | -------------------------------- | ---------------------- | -------------------------- |
| **ESLint 9** (flat config)       | Code quality + security          | `npm run lint`         | 0 errors, 0 warnings       |
| **eslint-plugin-tsdoc**          | TSDoc syntax validation          | Included in lint       | `tsdoc/syntax: 'error'`    |
| **eslint-plugin-playwright**     | Playwright best practices        | Included in lint       | Blocking                   |
| **eslint-plugin-security**       | Security vulnerability detection | Included in lint       | Blocking                   |
| **@microsoft/eslint-plugin-sdl** | Microsoft SDL compliance         | Included in lint       | Blocking                   |
| **eslint-plugin-sonarjs**        | Code smell detection             | Included in lint       | Blocking                   |
| **eslint-plugin-n**              | Node.js best practices           | Included in lint       | Blocking                   |
| **eslint-plugin-promise**        | Promise/async best practices     | Included in lint       | Blocking                   |
| **eslint-plugin-import-x**       | Import hygiene                   | Included in lint       | Blocking                   |
| **eslint-plugin-unicorn**        | Modernization rules              | Included in lint       | Blocking                   |
| **TypeScript 5.9**               | Type checking (strict)           | `npm run typecheck`    | 0 errors                   |
| **Vitest**                       | Unit tests (hermetic)            | `npm run test:unit`    | 90% coverage               |
| **tsup**                         | ESM bundle build                 | `npm run build`        | Clean build                |
| **@microsoft/api-extractor**     | API report generation            | Part of build pipeline | No regressions             |
| **TypeDoc**                      | API documentation                | `npm run docs:api`     | All public APIs documented |
| **Husky + lint-staged**          | Pre-commit/pre-push gates        | Automatic              | Blocks bad commits         |
| **knip**                         | Dead code detection              | `npx knip`             | No unused exports          |

### Documentation Standard: TSDoc Only

- This project uses **Microsoft TSDoc exclusively** — NOT JSDoc
- TSDoc config: `tsdoc.json` extends `@microsoft/api-extractor/extends/tsdoc-base.json`
- Custom tags: `@intent`, `@guarantee`, `@capability`, `@recipe`, `@ai`, `@aiContext`, `@aiHint`, `@sapModule`, `@businessContext`
- Every public API MUST have: `@param`, `@returns`, `@throws`, `@example`
- Reference: `docs/documentation-standards.md`

### Best Practice Sources (Mandatory Alignment)

| Source               | Key Standards                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| **Playwright**       | Web-first assertions, no `waitForTimeout`, fixture-based DI, project dependencies for auth, `test.step()` |
| **Microsoft**        | TSDoc, API Extractor, SDL security, OpenTelemetry, GitHub Actions pinned to SHA                           |
| **Google TS Style**  | `Readonly<>` config, no barrel re-exports of internals, `@example` in docs                                |
| **Google SRE**       | Exponential backoff + jitter, structured error codes, observability                                       |
| **Node.js**          | ESM-first, `node:` prefix, `engines` field, `files` field                                                 |
| **Claude/Anthropic** | `retryable` + `suggestions[]` on errors, AI response envelope, checkpoint serialization                   |

---

## 6. Agent Loading Instructions

### For GitHub Copilot

Configured in `.github/copilot-instructions.md` — references skill files in `skills/playwright-praman-sap-testing/`:

```markdown
When working on [LAYER], load the following skill:

- Architecture decisions: Read `skills/playwright-praman-sap-testing/skills-architect.md`
- Implementation: Read `skills/playwright-praman-sap-testing/skills-implementer.md`
- Testing: Read `skills/playwright-praman-sap-testing/skills-tester.md`
```

### For Claude Code

Configured in `CLAUDE.md` — references skill files:

```markdown
## Skills

Before starting work, read the appropriate skill file:

- `skills/playwright-praman-sap-testing/skills-{role}.md`
```

### For Google Jules

Reference in issue description:

```markdown
**Agent skill**: `skills/playwright-praman-sap-testing/skills-implementer.md` + `skills/playwright-praman-sap-testing/skills-sap-ui5-expert.md`
```

---

_End of Document — Praman v1.0 AI Agent Team Overview v1.0.0_
