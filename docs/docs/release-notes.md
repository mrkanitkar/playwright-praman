---
sidebar_label: 'Release Notes'
sidebar_position: 99
title: Release Notes
description: "What's new in playwright-praman — version history, new features, breaking changes, and upgrade guidance."
keywords:
  - playwright praman release notes
  - sap ui5 test automation changelog
  - playwright 1.60 support
  - typescript 7 playwright
  - typescript 6 playwright
---

# Release Notes

## Version 1.3.0

_Released: May 2026 · [npm](https://www.npmjs.com/package/playwright-praman) · [GitHub](https://github.com/mrkanitkar/playwright-praman/releases)_

### 🎭 Playwright 1.60 Support

Praman now ships with **Playwright 1.60** as its peer dependency (up from 1.59). The compat layer adds **8 new feature flags** gated behind version detection so you can adopt 1.60 APIs at your own pace:

| Feature flag               | API gated                      | What it enables                                               |
| -------------------------- | ------------------------------ | ------------------------------------------------------------- |
| `hasTestAbort`             | `test.abort()`                 | Programmatic test abort from within a test body               |
| `hasGetByRoleDescription`  | `getByRole({ description })`   | Filter ARIA roles by `aria-description` attribute             |
| `hasPageAriaSnapshot`      | `page.ariaSnapshot()`          | Full-page accessibility tree capture for AI grounding         |
| `hasAriaSnapshotBoxes`     | `ariaSnapshot({ boxes })`      | Bounding-box coordinates in accessibility snapshots           |
| `hasTracingHAR`            | Tracing HAR capture            | HAR network archive alongside trace recordings                |
| `hasLocatorDrop`           | `locator.drop()`               | Native drag-and-drop target for file upload and DnD scenarios |
| `hasLocatorHighlightStyle` | `locator.highlight({ style })` | Custom highlight styling for visual debugging                 |
| `hasBrowserContextEvent`   | `browserContext.on('event')`   | New browser context event subscriptions                       |

All eight flags are auto-detected — no configuration required. Existing tests on Playwright 1.57–1.59 continue to work unchanged.

**Browser engine updates:** Chromium 136 → 148, Firefox 139 → 150, WebKit 18.4 → 26.4.

**Removed APIs (zero impact):** Playwright 1.60 removed `Locator.ariaRef()`, `exposeBinding` handle option, `connect`/`connectOverCDP` logger option, and `videosPath`/`videoSize`. None were used by Praman — no breaking changes.

### 🔷 TypeScript 7.x and 6.x Support

Praman source and published types are now compiled with **TypeScript 6.0.3**. The CI matrix validates against both TS 6.x and TS 7.x on every push.

What this means for you:

- If you compile your tests with **TypeScript 7.x**, Praman types work out of the box with full inference.
- If you compile with **TypeScript 6.x**, nothing changes from v1.2.0 — full support continues.
- If you compile with **TypeScript ≥ 5.5**, all Praman APIs remain compatible.
- The `strict: true` tsconfig is enforced throughout — all generics, narrowing, and inference behave correctly under TS 7 semantics.

### 🧠 AI Grounding with ARIA Snapshots

Praman's AI context builder now captures the **full-page ARIA accessibility snapshot** and includes it in the `PageContext` envelope sent to LLM agents. This gives AI test generators a structural map of the page — control roles, names, states, and hierarchy — alongside the existing UI5 control tree.

```typescript
// Enable in config
export default defineConfig({
  use: {
    pramanConfig: {
      includeAriaSnapshot: true, // opt-in: page.ariaSnapshot() in AI context
    },
  },
});
```

The `PageContext.ariaSnapshot` field is populated automatically during bulk discovery when the flag is enabled. Requires Playwright 1.60+ (`hasPageAriaSnapshot` compat flag).

### 🔦 Screencast Control Highlighting

New `screencast.highlightControls()` fixture that draws a visible overlay on UI5 controls as they are interacted with during screencast recording. Every `ui5.press()`, `ui5.fill()`, and proxy method call highlights the target control with a configurable border style.

```typescript
test('demo with highlights', async ({ screencast, ui5 }) => {
  // Enable highlighting — controls flash on interaction
  screencast.highlightControls(true);

  // Custom highlight style
  screencast.highlightControls(true, {
    border: '3px solid red',
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  });

  await ui5.press({ id: 'myButton' }); // button highlighted during press
});
```

The highlight controller is **page-keyed** — each page in a multi-tab test gets its own highlight state. Highlighting is a no-op on Playwright versions below 1.60.

### 📊 OData Trace Reporter — `onError` Hook

The OData trace reporter now implements the `onError(error, workerInfo)` Playwright reporter hook, capturing worker-level errors (crashes, timeouts, unhandled exceptions) alongside OData trace data. Previously, worker errors were silently dropped from OData trace reports.

### ⬆️ ESLint 10 Ecosystem

The linting toolchain has been upgraded from ESLint 9.x to **ESLint 10.x**:

| Package                  | From    | To     |
| ------------------------ | ------- | ------ |
| `eslint`                 | 9.39.2  | 10.4.0 |
| `@eslint/js`             | 9.39.3  | 10.0.1 |
| `eslint-plugin-n`        | 17.24.0 | 18.0.1 |
| `eslint-plugin-security` | 3.0.1   | 4.0.0  |
| `eslint-plugin-promise`  | 7.2.1   | 7.3.0  |

The `@microsoft/eslint-plugin-sdl` plugin (peerDep on `eslint ^9`) works correctly at runtime with ESLint 10 — resolved via npm `overrides` until Microsoft publishes an update. Zero config changes needed for existing setups.

### 📦 Dependency Updates

**Runtime:**

- `zod` 4.3.6 → 4.4.3
- `dotenv` 16.x → 17.4.2

**LLM SDKs & Telemetry:**

- `@anthropic-ai/sdk` 0.82.0 → 0.98.0
- `openai` SDK updated
- OpenTelemetry suite updated

**CI Actions:**

- `actions/github-script` 7.0.1 → 9.0.0
- `actions/setup-node` 6.3.0 → 6.4.0
- `actions/upload-artifact` 4.6.2 → 7.0.1
- `googleapis/release-please-action` 4.4.0 → 5.0.0
- `github/codeql-action` 4.35.1 → 4.35.3

**Dev tooling:**

- `ts-morph` 24.0.0 → 28.0.0
- `cspell` 9.7.0 → 10.0.0
- `commitlint` 20 → 21, `lint-staged` 16 → 17
- `postcss` 8.5.8 → 8.5.15, `protobufjs` 7.5.4 → 7.6.1

### 📋 Docs Verification Pipeline — 8 Checks

The documentation accuracy pipeline now runs **8 automated checks** on every PR:

1. TypeScript snippet type-checking
2. API reference accuracy
3. Config default validation
4. Import path verification
5. AI-assisted review
6. SAP UI5 API verification
7. Code example execution
8. Cross-reference link validation

### Other Improvements

- **Claude Code Plugin docs**: New documentation for Claude Code and Cowork plugin integration.
- **Plugin install instructions**: Fixed to match official Claude Code documentation format.
- **Capabilities registry**: `screencast.highlightControls` and ARIA grounding capabilities registered in `capabilities.yaml`.
- **Security**: `protobufjs`, `postcss`, `@xmldom/xmldom` bumped to resolve advisories.

---

## Version 1.2.0

_Released: April 2026 · [npm](https://www.npmjs.com/package/playwright-praman) · [GitHub](https://github.com/mrkanitkar/playwright-praman/releases)_

### 🎭 Playwright 1.59 Support

Praman now ships with **Playwright 1.59** as its peer dependency, validated against both the stable channel and the Playwright `canary` (next) build in CI.

Five new Playwright 1.59 APIs are gated behind **feature flags** in `PramanConfig` so you can opt in as soon as your SAP environment is ready:

| Feature flag                           | API gated                          | What it enables                                                          |
| -------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------ |
| `playwrightFeatures.screencast`        | `page.screencast`                  | Programmatic video recording with start/stop control and action overlays |
| `playwrightFeatures.ariaSnapshotDepth` | `locator.ariaSnapshot({ depth })`  | Scoped accessibility tree capture for deep UI5 component trees           |
| `playwrightFeatures.setStorageState`   | `browserContext.setStorageState()` | Clear and replace storage state in-place without creating a new context  |
| `playwrightFeatures.locatorNormalize`  | `locator.normalize()`              | Convert ad-hoc locators to best-practice test-id / aria-role equivalents |
| `playwrightFeatures.urlPatternMatcher` | `expect(page).toHaveURL(pattern)`  | URL Pattern API matching in URL assertions                               |

All five flags default to `false` and have zero impact on existing tests.

```typescript
// playwright.config.ts
import { defineConfig } from 'playwright-praman';

export default defineConfig({
  use: {
    pramanConfig: {
      playwrightFeatures: {
        screencast: true, // opt-in: page.screencast API
        ariaSnapshotDepth: true, // opt-in: depth option on ariaSnapshot
      },
    },
  },
});
```

CI now runs a **three-channel integration matrix**: Playwright stable, Playwright `next` (canary), and the bundled
Chromium baseline — so Praman validates against upcoming Playwright changes before they ship.

### 🤖 Praman CLI Agents for Playwright

Praman now supports [Playwright CLI Agents](/docs/guides/playwright-cli-agents) — plan, generate, and heal SAP UI5 tests directly from the command line using Claude Code's `playwright-cli` skill. No MCP server required.

### 🔷 TypeScript 6.x Support

Praman source and its published types are now compiled with **TypeScript 6.0.2**. The CI matrix validates against both TS 5.9 and TS 6.0 on every push.

What this means for you:

- If you compile your test files with TypeScript ≥ 5.5, nothing changes.
- If you use TypeScript 6.0, you get full type inference on all Praman APIs with no extra configuration.
- The `strict: true` tsconfig is enforced throughout — all generics, narrowing, and inference behave correctly under TS 6 semantics.

See the [TypeScript 6.0 Compatibility Report](https://github.com/mrkanitkar/playwright-praman/blob/main/docs/typescript-6.0-compatibility-report.md) in the repository for the detailed analysis.

### 🔍 Unified `ui5=` Selector Engine

The three separate selector parsers (CSS engine, XPath engine, legacy ui5-selector-engine) have been
**replaced by a single unified engine** powered by [`fontoxpath`](https://github.com/nicktindall/fontoxpath)
(XPath 3.1) and [`css-selector-parser`](https://github.com/nicktindall/css-selector-parser).

CSS-style selectors like `sap.m.Button[text=Save]` are now parsed to an AST, converted to XPath 3.1, and evaluated
against an in-memory XML DOM built from the live UI5 control tree. This is the same proven approach used by
[`playwright-ui5`](https://github.com/SAP/ui5-tooling-transitive-dependencies/tree/main).

**New pseudo-classes and combinators:**

```typescript
// :labeled() — find controls by associated sap.m.Label text
page.locator("ui5=sap.m.Input:labeled('Vendor')");

// :not() — exclude specific control types
page.locator('ui5=sap.m.Button:not([type=Back])');

// Descendant combinator (space)
page.locator('ui5=sap.m.Panel sap.m.Button[text=Save]');

// Child combinator (>)
page.locator('ui5=sap.m.Panel > sap.m.Button');

// Adjacent sibling (+)
page.locator('ui5=sap.m.Label + sap.m.Input');

// General sibling (~)
page.locator('ui5=sap.m.Label ~ sap.m.Input');

// Positional selectors
page.locator('ui5=sap.m.ColumnListItem:nth-child(2)');
page.locator('ui5=sap.m.ColumnListItem:first-child');
page.locator('ui5=sap.m.ColumnListItem:last-child');
```

**Migration note:** The `enableXpathEngine` configuration field has been removed. The unified engine handles all selector styles automatically — no config change required for existing tests.

For a full reference of the selector syntax, see the [Locator Selector Syntax guide](/docs/guides/locator-selector-syntax).

### 🔬 `npx praman inspect` — Interactive Control Inspector

New CLI command that opens a live SAP application in a headed Chromium window and captures click events to print UI5 control metadata and ready-to-paste selectors in the terminal.

```bash
# Inspect any SAP Fiori Launchpad
npx praman inspect https://my-sap.example.com/sap/bc/ui5_ui5/...

# With stored auth (Playwright storageState JSON)
npx praman inspect https://my-sap.example.com --auth .auth/user.json
```

Click any element in the browser to see:

```text
━━━ Clicked: sap.m.Button ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ID:      __button0--orderCreateBtn
  Type:    sap.m.Button
  Visible: true  Enabled: true

  Properties:
    text = "Create Order"
    type = "Emphasized"

  Bindings:
    text → {i18n>CREATE_ORDER}

━━━ Selectors (best → worst) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ① ui5=sap.m.Button[text=Create Order]
  ② ui5=sap.m.Button#orderCreateBtn
  ③ ui5=sap.m.Button[text=Create Order][type=Emphasized]

  Fixture:
    await ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create Order' } });
```

Selectors are **ranked by stability** — stable semantic properties before IDs, IDs before composite selectors.
The inspector highlights the matched control with a blue border overlay so you can confirm the selection.

Read more in the [Interactive Inspector guide](/docs/guides/inspect-command).

### ⚙️ `npx praman config` — Display Resolved Configuration

New CLI command that prints the fully resolved `PramanConfig` to the terminal — including values sourced from
environment variables, `playwright.config.ts`, and defaults. Useful for debugging authentication and AI
configuration on CI without adding debug logging to tests.

```bash
npx praman config
```

Output (example):

```text
Praman Resolved Configuration
──────────────────────────────
baseUrl:         https://my-sap.example.com
auth.strategy:   storageState
auth.storageStatePath: .auth/user.json
ai.provider:     openai
ai.model:        gpt-4o
telemetry.openTelemetry: false
odataTracing:    false
```

### 🌿 Nested Environment Variable Support

Configuration can now be injected at any nesting level via environment variables, removing the need to edit `playwright.config.ts` in CI pipelines:

| Env variable                   | Config path               |
| ------------------------------ | ------------------------- |
| `PRAMAN_AI_PROVIDER`           | `ai.provider`             |
| `PRAMAN_AI_MODEL`              | `ai.model`                |
| `PRAMAN_AI_API_KEY`            | `ai.apiKey`               |
| `PRAMAN_TELEMETRY_ENABLED`     | `telemetry.openTelemetry` |
| `PRAMAN_ODATA_TRACING_ENABLED` | `odataTracing.enabled`    |

See the [Configuration guide](/docs/guides/configuration) for the full reference.

### 🔌 Extension System & Custom Matcher Registry

Praman now exposes a **plugin API** for registering custom control matchers and fixture extensions at initialization
time. This enables shared testing libraries to ship Praman extensions without modifying the core:

```typescript
// my-extension.ts
import { defineExtension } from 'playwright-praman';

export const myExtension = defineExtension({
  name: 'my-company-controls',
  matchers: {
    toHaveApprovalStatus: async (controlProxy, expected) => {
      const status = await controlProxy.getProperty('approvalStatus');
      return {
        pass: status === expected,
        message: () => `Expected approval status ${expected}, got ${status}`,
      };
    },
  },
});
```

```typescript
// playwright.config.ts
import { defineConfig } from 'playwright-praman';
import { myExtension } from './my-extension';

export default defineConfig({
  use: {
    pramanConfig: {
      extensions: [myExtension],
    },
  },
});
```

### 📋 Error Messages Now Include Docs URLs

All typed `PramanError` subclasses now include a `docsUrl` field that links directly to the relevant documentation page. The URL appears in:

- The terminal error message
- The serialized JSON (for reporting and AI context)
- The AI-envelope when Praman errors are surfaced to LLM agents

```text
ControlError: Control not found: sap.m.Button[text=Save]
  code: ERR_CONTROL_NOT_FOUND
  docsUrl: https://praman.dev/docs/guides/errors#err-control-not-found
  suggestions:
    - Verify the control type and property value
    - Check if the page has fully loaded (waitForUI5)
    - Try using the inspect command: npx praman inspect <url>
```

### 🤖 Playwright CLI Agents — Now the Default

**Playwright CLI agents are now installed by default** by both `npx playwright-praman init` and
`npx playwright-praman init-agents`. Previously they required an explicit `--cli` opt-in flag.

**What changed:**

| Before                               | After                                                         |
| ------------------------------------ | ------------------------------------------------------------- |
| `init` installs MCP agents only      | `init` installs MCP **and** CLI agents                        |
| `--cli` required to add CLI agents   | `--no-cli` to skip CLI agents                                 |
| `@playwright/cli` not auto-installed | `@playwright/cli` auto-installed alongside `@playwright/test` |

**`init` now auto-installs four packages** when any are missing:

| Package             | Role                                     |
| ------------------- | ---------------------------------------- |
| `@playwright/test`  | Playwright test runner                   |
| `@playwright/cli`   | Playwright CLI for agent browser control |
| `playwright-praman` | The plugin itself                        |
| `dotenv`            | Environment variable loading             |

This means `npm install playwright-praman && npx playwright-praman init` is the complete
setup sequence — no separate `npm install @playwright/test @playwright/cli` step required.
Chromium is still installed unconditionally via `npx playwright install chromium`.

**Command reference:**

```bash
# Default — installs MCP + CLI agents, auto-installs all peer deps
npx playwright-praman init

# Opt out of CLI agents
npx playwright-praman init --no-cli

# init-agents also defaults to CLI-on
npx playwright-praman init-agents --loop=claude
npx playwright-praman init-agents --loop=copilot --no-cli
```

When CLI agents are being installed but `@playwright/cli` is absent from `node_modules`,
the installer prints a warning with the exact install command.

### ⬆️ Node.js 22 Minimum

The minimum supported Node.js version has been raised to **22** (from 20). Node.js 20 reached End-of-Life in April 2026.

If you are running CI on Node.js 20, update your workflow:

```yaml
# .github/workflows/test.yml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
```

### 🔒 Zero npm Vulnerabilities

All npm audit vulnerabilities — in both the main package and the `docs/` workspace — have been resolved to **0 remaining** (0 critical, 0 high, 0 moderate). Security dependency bumps included:

- `picomatch` 4.0.3 → 4.0.4
- `tar` 7.5.10 → 7.5.11
- `path-to-regexp` 0.1.12 → 0.1.13 (docs)
- `handlebars` 4.7.8 → 4.7.9 (dev)
- `flatted` 3.3.3 → 3.4.2 (dev)

### 📚 100% TSDoc Coverage

TypeDoc now reports **zero warnings** across all public exports. Every exported function, class, interface, and type has:

- `@param` annotations for all parameters
- `@returns` describing the return value
- `@throws` listing typed error classes
- `@example` with a working code snippet

### 📡 OpenTelemetry Tracing & Metrics

Praman now ships with **full OpenTelemetry integration** for distributed observability. Telemetry is disabled by default with zero overhead — enable it when you need end-to-end visibility into test execution.

| Feature              | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| **Tracing**          | Spans for control discovery, bridge evaluation, test lifecycle            |
| **Metrics**          | Counters (pass/fail/skip, discovery, injection) and histograms (duration) |
| **OTel Reporter**    | Playwright reporter emitting nested spans per test step                   |
| **Live correlation** | OTel traceId embedded in Playwright trace titles                          |

**Three exporters supported:**

- **OTLP** (default) — works with Jaeger, Grafana Tempo, any OTLP collector
- **Jaeger** — via OTLP protocol (Jaeger accepts OTLP natively)
- **Azure Monitor** — via connection string from Application Insights

**Quick start:**

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http
docker compose -f docs/docker-compose.otel.yml up -d
PRAMAN_TELEMETRY_ENABLED=true PRAMAN_TELEMETRY_ENDPOINT=http://localhost:4318 npx playwright test
# Open Jaeger UI at http://localhost:16686
```

Dependencies are **optional peer deps** — not installed unless you opt in. When disabled, all telemetry calls are no-ops with negligible overhead. `TelemetryError` with 5 error codes provides actionable messages when OTel initialization fails (e.g., missing peer dependencies, unreachable endpoints).

See the [Telemetry Setup Guide](./guides/telemetry) for detailed configuration, Azure Monitor setup, and troubleshooting.

### Other Improvements

- **Playwright Canary CI**: Integration tests now run against `@playwright/test@next` in a separate matrix job, catching regressions before Playwright stable releases.
- **ADR-030 added**: Architecture Decision Record for OPA5 migration strategy with code samples for hybrid OPA5 + Praman test suites.
- **100% documentation accuracy**: Eliminated fictional APIs and mismatched examples across 42 documentation files in the accuracy audit.
- **Locator Selector Syntax guide**: New comprehensive guide for the `ui5=` custom engine covering all selector forms, pseudo-classes, and combinators.
- **Docs verification pipeline**: 6 automated checks (typecheck snippets, API references, config defaults, import paths, AI review, SAP UI5 API) validate documentation accuracy on every PR.

---

## Version 1.1.2

Released: March 7, 2026

### Bug Fixes

- **build:** disable chunk splitting to resolve Socket.dev obfuscation alert.

---

## Version 1.1.1

Released: March 7, 2026

### Features

- **docs:** simplify onboarding to 2 commands, elevate AI agent pipeline.
- **prompts:** add prompt factory with two SAP prompts and disclaimers.

### Bug Fixes

- **ci:** add SAP domain words to cspell dictionary.
- **ci:** inline upload-pages-artifact for SHA-pinning compliance.

---

## Version 1.1.0

Released: March 7, 2026

### Features

- **docs:** add SEO badges, keywords, FAQ schema, config.

### Bug Fixes

- **docs:** resolve Bing SEO scan issues and update footer copyright.

---

## Version 1.0.4

Released: March 7, 2026

### Bug Fixes

- **ci:** ignore auto-generated CHANGELOG.md in markdownlint.
- **security:** harden regex anchoring, XSS escaping, and hostname checks.

---

## Version 1.0.0

Released: February 16, 2026

Initial release of `playwright-praman` — Agent-First SAP UI5 Test Automation Plugin for Playwright.

### Features

- 199 typed control proxies for SAP UI5 controls.
- `ui5`, `ui5Navigation`, `ui5Footer`, `fe`, `intent`, `pramanAI` fixtures.
- OData V2/V4 interception and mocking.
- Fiori Elements List Report and Object Page testing.
- 6 authentication strategies (storageState, basic, SAML, OAuth2, BTP, S/4HANA Cloud).
- AI test generation, healing, and compliance enforcement agents.
- Dual ESM + CJS build with validated sub-path exports.
- 11-plugin ESLint configuration with zero-tolerance quality gates.
