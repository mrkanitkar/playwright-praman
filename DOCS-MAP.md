# Documentation Map

Navigation guide to all Praman documentation. Find the right file for your task.

## Quick Reference: Task to Documentation

| Task | Read This |
| --- | --- |
| Write your first Praman test | `GETTING-STARTED.md` |
| Set up SAP authentication | `examples/auth-setup.ts`, `skills/.../authentication.md` |
| Look up a specific API method | `skills/.../api-reference.md` |
| Work with tables (read, filter, sort) | `docs/docs/guides/control-interactions.md`, `docs/docs/guides/sap-control-cookbook.md` |
| Handle dialogs | `docs/docs/guides/control-interactions.md` |
| Use OData operations | `docs/docs/guides/odata-operations.md`, `docs/docs/guides/odata-mocking.md` |
| Integrate AI test generation | `skills/.../ai-capabilities.md`, `docs/docs/guides/ai-integration.md` |
| Handle errors and debugging | `docs/docs/guides/errors.md`, `docs/docs/guides/debugging.md` |
| Navigate FLP and apps | `docs/docs/guides/navigation.md` |
| Use Fiori Elements helpers | `docs/docs/guides/fiori-elements.md` |
| Use business intents (vocabulary) | `docs/docs/guides/intent-api.md`, `docs/docs/guides/vocabulary-system.md` |
| Configure Praman | `docs/docs/guides/configuration.md` |
| Set up IDE / AI agent | `docs/docs/guides/ide-setup.md`, `docs/docs/guides/agent-setup.md` |
| Understand architecture | `docs/docs/guides/architecture-overview.md` |
| Migrate from wdi5 | `docs/docs/guides/migration-from-wdi5.md` |
| Migrate from Tosca | `docs/docs/guides/migration-from-tosca.md` |
| Migrate from plain Playwright | `docs/docs/guides/migration-from-playwright.md` |
| Run in Docker / CI-CD | `docs/docs/guides/docker-cicd.md` |
| Write custom matchers | `docs/docs/guides/custom-matchers.md` |
| Understand bridge internals | `docs/docs/guides/bridge-internals.md` |
| Set up reporters | `docs/docs/guides/reporters.md` |

## By Audience

### Developer / Test Automation Engineer

Start here, read in order:

1. `GETTING-STARTED.md` -- installation, first test, common patterns
2. `docs/docs/guides/fixtures.md` -- fixture composition and DI
3. `docs/docs/guides/control-interactions.md` -- control discovery and interaction
4. `docs/docs/guides/selectors.md` -- UI5 selector patterns
5. `docs/docs/guides/sap-control-cookbook.md` -- SAP control recipes
6. `docs/docs/guides/navigation.md` -- FLP and in-app navigation
7. `docs/docs/guides/fiori-elements.md` -- Fiori Elements List Report and Object Page
8. `docs/docs/guides/odata-operations.md` -- OData model and HTTP operations
9. `docs/docs/guides/errors.md` -- error handling and codes
10. `docs/docs/guides/debugging.md` -- debugging test failures
11. `docs/docs/guides/custom-matchers.md` -- writing custom assertions
12. `docs/docs/guides/docker-cicd.md` -- CI/CD pipeline setup

### AI Agent (Claude Code, Copilot, Codex, Jules)

Start here, read in order:

1. `GETTING-STARTED.md` -- overview and import pattern
2. `SKILL.md` (project root) -- the 7 mandatory rules
3. `skills/playwright-praman-sap-testing/api-reference.md` -- all 172 functions with signatures
4. `skills/playwright-praman-sap-testing/ai-capabilities.md` -- AI features and vocabulary
5. `skills/playwright-praman-sap-testing/authentication.md` -- auth strategy reference
6. `docs/docs/guides/errors.md` -- error codes for structured handling

IDE-specific integration files:

| IDE / Agent | Appendable File |
| --- | --- |
| Claude Code | `docs/user-integration/claude-md-appendable.md` |
| GitHub Copilot | `docs/user-integration/copilot-instructions-appendable.md` |
| OpenAI Codex / Jules | `docs/user-integration/agents-md-appendable.md`, `docs/user-integration/jules-setup-appendable.md` |
| Google Antigravity | `docs/user-integration/antigravity-rules-appendable.md` |

### SAP Business Analyst

Start here, read in order:

1. `GETTING-STARTED.md` -- the "SAP Business Analyst" section
2. `docs/docs/guides/intent-api.md` -- business intent APIs
3. `docs/docs/guides/vocabulary-system.md` -- business term vocabulary
4. `docs/docs/guides/business-process-examples.md` -- end-to-end business scenarios
5. `docs/docs/guides/transaction-mapping.md` -- SAP transaction to Fiori app mapping

### Maintainer / Contributor

1. `CLAUDE.md` -- project rules, coding standards, architecture
2. `CONTRIBUTING.md` -- contribution guidelines
3. `docs/documentation-standards.md` -- TSDoc standards
4. `docs/docs/guides/architecture-overview.md` -- 5-layer architecture
5. `docs/docs/guides/bridge-internals.md` -- bridge adapter implementation
6. `docs/docs/guides/lifecycle-extensibility.md` -- extension points
7. `docs/docs/decisions/` -- architecture decision records (ADRs)

## All Documentation Files

### Root

| File | Description |
| --- | --- |
| `GETTING-STARTED.md` | Quick-start guide with persona sections |
| `DOCS-MAP.md` | This file -- documentation navigation |
| `CLAUDE.md` | Claude Code agent instructions and project rules |
| `AGENTS.md` | Universal AI agent instructions |
| `README.md` | Project overview and badges |
| `CONTRIBUTING.md` | Contribution guidelines |
| `CHANGELOG.md` | Release history |
| `SECURITY.md` | Security policy |
| `CODE_OF_CONDUCT.md` | Community code of conduct |

### skills/playwright-praman-sap-testing/

| File | Description |
| --- | --- |
| (see root `SKILL.md`) | Master skill file -- 7 mandatory rules, compliance framework |
| `api-reference.md` | All 172 API functions with signatures |
| `ai-capabilities.md` | AI features, intents, vocabulary, configuration |
| `authentication.md` | Auth strategies (OnPrem, BTP, Office365, API, Certificate) |
| `capabilities-reference.md` | Capability registry by category |
| `recipes-reference.md` | Curated test pattern recipes |
| `ai-quick-reference.md` | Condensed AI agent reference card |
| `test-template.ts` | Gold-standard test template |

### docs/docs/guides/

| File | Description |
| --- | --- |
| `getting-started.md` | Docusaurus getting-started page |
| `architecture-overview.md` | 5-layer architecture diagram |
| `fixtures.md` | Fixture composition and DI |
| `fixture-composition.md` | Advanced fixture patterns |
| `control-interactions.md` | Control discovery and interaction |
| `selectors.md` | UI5 selector patterns |
| `sap-control-cookbook.md` | Recipes for specific SAP controls |
| `navigation.md` | FLP and in-app navigation |
| `fiori-elements.md` | Fiori Elements page helpers |
| `authentication.md` | Auth setup guide |
| `configuration.md` | Configuration reference |
| `odata-operations.md` | OData model and HTTP |
| `odata-mocking.md` | OData mock strategies |
| `intent-api.md` | Business intent API |
| `vocabulary-system.md` | Vocabulary term resolution |
| `errors.md` | Error codes and handling |
| `debugging.md` | Debugging test failures |
| `custom-matchers.md` | Writing custom assertions |
| `reporters.md` | Reporter configuration |
| `ai-integration.md` | AI-powered test generation |
| `business-process-examples.md` | E2E business scenarios |
| `transaction-mapping.md` | SAP transaction to Fiori mapping |
| `ide-setup.md` | IDE configuration |
| `agent-setup.md` | AI agent setup |
| `docker-cicd.md` | Docker and CI/CD |
| `bridge-internals.md` | Bridge adapter details |
| `lifecycle-extensibility.md` | Extension points |
| `capabilities.md` | Capability system overview |
| `capabilities-recipes.md` | Capability and recipe queries |
| `control-proxy.md` | Control proxy internals |
| `interaction-strategies.md` | Interaction strategy selection |
| `gold-standard-test.md` | Gold-standard test anatomy |
| `glossary.md` | Terminology glossary |
| `playwright-primer.md` | Playwright basics for SAP testers |
| `component-testing.md` | Component-level testing |
| `visual-regression.md` | Visual regression testing |
| `cross-browser.md` | Cross-browser testing |
| `accessibility-testing.md` | Accessibility testing |
| `upgrade-testing.md` | SAP upgrade testing |
| `performance-benchmarks.md` | Performance benchmarks |
| `multi-tool-integration.md` | Multi-tool integration |
| `migration-from-wdi5.md` | Migration from wdi5 |
| `migration-from-tosca.md` | Migration from Tosca |
| `migration-from-playwright.md` | Migration from plain Playwright |
| `behavioral-equivalence.md` | Behavioral equivalence testing |
| `cloud-alm-integration.md` | SAP Cloud ALM integration |
| `sap-activate-alignment.md` | SAP Activate alignment |

### docs/docs/decisions/

| File | Description |
| --- | --- |
| `product-decisions.md` | Product-level architectural decisions |
| `adr-circuit-breaker.md` | Circuit breaker pattern ADR |
| `adr-csp-compliance.md` | Content Security Policy ADR |
| `adr-dry-run.md` | Dry-run mode ADR |
| `adr-graceful-shutdown.md` | Graceful shutdown ADR |
| `adr-registry-discovery.md` | Registry-based discovery ADR |
| `adr-security-audit.md` | Security audit ADR |
| `adr-webcomponents.md` | Web Components support ADR |

### docs/user-integration/

| File | Description |
| --- | --- |
| `claude-md-appendable.md` | Appendable snippet for Claude Code CLAUDE.md |
| `copilot-instructions-appendable.md` | Appendable snippet for GitHub Copilot |
| `agents-md-appendable.md` | Appendable snippet for AGENTS.md |
| `jules-setup-appendable.md` | Appendable snippet for OpenAI Jules |
| `antigravity-rules-appendable.md` | Appendable snippet for Google Antigravity |

### examples/

| File | Description |
| --- | --- |
| `auth-setup.ts` | Complete, copy-paste SAP authentication setup |

### Other

| File | Description |
| --- | --- |
| `docs/documentation-standards.md` | TSDoc documentation standards |
| `docs/capabilities.md` | Capability system documentation |
| `docs/mcp-sap-docs-setup.md` | MCP server setup for SAP documentation |
