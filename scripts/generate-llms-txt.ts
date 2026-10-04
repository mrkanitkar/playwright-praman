#!/usr/bin/env tsx
/**
 * Generate `llms.txt` and `llms-full.txt` — the two files agents read first.
 *
 * @remarks
 * These are the npm-package copies, shipped via `package.json#files`. The
 * website's `/llms.txt` and `/llms-full.txt` are different files, produced at
 * docs-build time by `docusaurus-plugin-llms` from the rendered docs tree.
 * Same names, different provenance; do not conflate them.
 *
 * `llms.txt` is the short index (link list, per llmstxt.org). It used to be
 * maintained by hand and had drifted on every count it quoted — see
 * {@link ./llms-facts.ts} for the measurements. It is now assembled here:
 * editorial content (which pages matter, how to describe them, the interaction
 * flowchart) lives in `INDEX` below, while every *number* is derived and every
 * link is resolved against the filesystem.
 *
 * `llms-full.txt` is the whole corpus inlined for agents that can take it.
 *
 * Both are byte-stable: the output is a pure function of the inputs, with no
 * wall-clock stamp. That is what makes `--check` possible, and the same
 * reasoning as `generate-capabilities.ts`, which had to drop `new Date()` for
 * exactly this reason.
 *
 * Run: `npm run generate:llms-txt` (or `-- --check` to verify, as CI does).
 *
 * @see https://llmstxt.org — the llms.txt specification
 * @module scripts
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { emitGenerated } from './generated-file.js';
import type { EmitMode } from './generated-file.js';
import { deriveFacts, findBrokenDocLinks } from './llms-facts.js';
import type { PramanFacts } from './llms-facts.js';

const ROOT = resolve(import.meta.dirname ?? '.', '..');

/** `--check` verifies the artifacts are current without writing anything. */
const IS_CHECK = process.argv.includes('--check');

/* ── llms-full.txt sources ─────────────────────────────────────────────── */

/**
 * Guides inlined into `llms-full.txt`, in reading order.
 *
 * @remarks
 * This list is the file's entire reach: a guide absent from it can never
 * appear, no matter how often it is regenerated. `parallel-execution.md` was
 * missing, which is why the Playwright 1.63 test-lock helpers (`SAP_LOCKS`,
 * `requireTestLocks`) were documented yet unreachable to any agent reading
 * this file. `compatibility.md` was missing for the same reason, taking the
 * supported-version matrix with it.
 */
const GUIDES: readonly { readonly heading: string; readonly file: string }[] = [
  { heading: 'Quick Start', file: 'GETTING-STARTED.md' },
  { heading: 'Selector Reference', file: 'docs/docs/guides/selectors.md' },
  { heading: 'Fixtures', file: 'docs/docs/guides/fixtures.md' },
  { heading: 'Control Interactions', file: 'docs/docs/guides/control-interactions.md' },
  { heading: 'Custom Matchers', file: 'docs/docs/guides/custom-matchers.md' },
  { heading: 'Navigation', file: 'docs/docs/guides/navigation.md' },
  { heading: 'Authentication', file: 'docs/docs/guides/authentication.md' },
  { heading: 'Configuration', file: 'docs/docs/guides/configuration.md' },
  { heading: 'Error Codes', file: 'docs/docs/guides/errors.md' },
  { heading: 'Fiori Elements', file: 'docs/docs/guides/fiori-elements.md' },
  { heading: 'OData Operations', file: 'docs/docs/guides/odata-operations.md' },
  { heading: 'Parallel Execution', file: 'docs/docs/guides/parallel-execution.md' },
  { heading: 'Version Compatibility', file: 'docs/docs/guides/compatibility.md' },
];

/** Examples appended under `## Code Examples`. */
const EXAMPLES: readonly { readonly heading: string; readonly file: string }[] = [
  { heading: 'Basic Test', file: 'docs/docs/examples/basic-test.md' },
  { heading: 'Dialog Handling', file: 'docs/docs/examples/dialog-handling.md' },
  { heading: 'Table Operations', file: 'docs/docs/examples/table-operations.md' },
];

const API_REPORT = 'api-reports/playwright-praman.api.md';

/* ── Transform helpers ─────────────────────────────────────────────────── */

/** Remove Docusaurus YAML frontmatter delimited by `---`. */
function stripFrontmatter(content: string): string {
  const match = /^---\n[\s\S]*?\n---\n/u.exec(content);
  return match ? content.slice(match[0].length) : content;
}

/** Remove markdown badge images and the blank lines they leave behind. */
function stripBadges(content: string): string {
  return content.replaceAll(/\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)\n*/gu, '');
}

/** Collapse 3+ consecutive blank lines into 2. */
function collapseBlankLines(content: string): string {
  return content.replaceAll(/\n{3,}/gu, '\n\n');
}

/** Prepare a guide: strip frontmatter, badges, and collapse blanks. */
function prepareGuide(content: string): string {
  return collapseBlankLines(stripBadges(stripFrontmatter(content)).trim());
}

/**
 * Clean the API Extractor report for LLM consumption.
 *
 * Drops the report header, warning comments, undocumented markers and the
 * wrapping fences, leaving bare declaration signatures.
 */
function cleanApiReport(content: string): string {
  const cleaned: string[] = [];

  for (const line of content.split('\n')) {
    if (line.startsWith('## API Report File') || line.startsWith('> Do not edit')) continue;
    if (line.startsWith('```')) continue;
    if (line.includes('// Warning: (ae-forgotten-export)')) continue;
    if (line.trim() === '// (undocumented)') continue;
    if (line.includes('(No @packageDocumentation comment')) continue;
    cleaned.push(line);
  }

  return collapseBlankLines(cleaned.join('\n').trim());
}

/* ── llms.txt index ────────────────────────────────────────────────────── */

interface IndexEntry {
  readonly title: string;
  readonly url: string;
  /** Written for an agent deciding whether to open the page. */
  readonly description: string;
}

/**
 * The curated index, grouped exactly as llmstxt.org prescribes.
 *
 * @remarks
 * Descriptions stay hand-written on purpose. Each page's own frontmatter
 * `description` is SEO copy aimed at search engines; these are routing hints
 * aimed at an agent choosing what to read. Generating them from frontmatter
 * would be more automatic and distinctly less useful.
 *
 * Every `url` here is resolved against the docs tree before anything is
 * written, so a renamed page fails the build.
 */
const INDEX: readonly { readonly section: string; readonly entries: readonly IndexEntry[] }[] = [
  {
    section: 'Docs',
    entries: [
      {
        title: 'Getting Started',
        url: 'docs/guides/getting-started',
        description: 'Installation, project setup, first test in under 5 minutes',
      },
      {
        title: 'Configuration Reference',
        url: 'docs/guides/configuration',
        description: 'Zod-validated config schema with defaults — empty `{}` is valid',
      },
      {
        title: 'Fixture Reference',
        url: 'docs/guides/fixtures',
        description:
          '{{fixtures}} fixtures plus {{autoFixtures}} auto-fixtures — ui5, sapAuth, ' +
          'ui5Navigation, fe, pramanAI, intent, and more',
      },
      {
        title: 'Selector Reference',
        url: 'docs/guides/selectors',
        description:
          'UI5Selector fields — controlType, id, properties, bindingPath, ancestor, descendant',
      },
      {
        title: 'Control Interactions',
        url: 'docs/guides/control-interactions',
        description: 'click, fill, press, select, check, clear, getText, getProperty, enterText',
      },
      {
        title: 'Discovery and Interaction Strategies',
        url: 'docs/guides/discovery-and-interaction',
        description:
          'ui5-native, dom-first, opa5 — swappable interaction modes and discovery strategies',
      },
      {
        title: 'Custom Matchers',
        url: 'docs/guides/custom-matchers',
        description:
          '{{matchers}} UI5-specific expect matchers — toHaveUI5Text, toBeUI5Visible, ' +
          'toBeUI5Enabled',
      },
      {
        title: 'Authentication Guide',
        url: 'docs/guides/authentication',
        description:
          '{{authStrategies}} auth strategies — on-prem, BTP SAML, Office 365, API, ' +
          'certificate, multi-tenant',
      },
      {
        title: 'Navigation',
        url: 'docs/guides/navigation',
        description: '{{navMethods}} FLP navigation methods plus BTP WorkZone dual-frame support',
      },
      {
        title: 'Error Reference',
        url: 'docs/guides/errors',
        description:
          '{{errorClasses}} error classes, {{errorCodes}} error codes with retryable flags ' +
          'and suggestions[]',
      },
      {
        title: 'OData Operations',
        url: 'docs/guides/odata-operations',
        description: 'Model operations (browser-side) and HTTP CRUD (node-side)',
      },
      {
        title: 'Fiori Elements Testing',
        url: 'docs/guides/fiori-elements',
        description: 'List Report, Object Page, FE Table, FE List helpers',
      },
      {
        title: 'Parallel Execution',
        url: 'docs/guides/parallel-execution',
        description:
          'Worker isolation, SM12 lock contention, and Playwright test locks (1.63+) for ' +
          'shared SAP state',
      },
      {
        title: 'Compatibility',
        url: 'docs/guides/compatibility',
        description:
          'Supported Playwright (>=1.57 <2.0), Node, and UI5 versions, plus feature gating',
      },
      {
        title: 'SAP Control Cookbook',
        url: 'docs/guides/sap-control-cookbook',
        description: 'Recipes for common SAP UI5 controls in Praman tests',
      },
      {
        title: 'AI Integration',
        url: 'docs/guides/ai-integration',
        description: 'LLM service, page discovery, agentic handler, capability registry',
      },
    ],
  },
  {
    section: 'Examples',
    entries: [
      {
        title: 'Basic Test',
        url: 'docs/examples/basic-test',
        description: 'Control discovery by type and property, verification, press',
      },
      {
        title: 'Auth Setup',
        url: 'docs/examples/auth-setup',
        description: 'OnPrem, BTP Cloud SAML, and Office 365 authentication examples',
      },
      {
        title: 'Dialog Handling',
        url: 'docs/examples/dialog-handling',
        description: 'Open, interact with, and close SAP UI5 dialogs',
      },
      {
        title: 'Table Operations',
        url: 'docs/examples/table-operations',
        description: 'SmartTable discovery, row reading, OData binding data',
      },
      {
        title: 'Gold Standard BOM',
        url: 'docs/examples/gold-standard-bom',
        description: 'Complete BOM maintenance E2E test — the Praman gold standard',
      },
      {
        title: 'Hybrid Login',
        url: 'docs/examples/hybrid-login',
        description: 'Playwright native for login + Praman for UI5 — auto-fallback pattern',
      },
    ],
  },
  {
    section: 'API',
    entries: [
      {
        title: 'Full API Reference',
        url: 'docs/api/',
        description:
          'TypeDoc-generated API documentation for all {{subpathExports}} sub-path exports',
      },
      {
        title: 'llms-full.txt',
        url: 'llms-full.txt',
        description: 'Complete documentation with inline API signatures',
      },
    ],
  },
  {
    section: 'Optional',
    entries: [
      {
        title: 'Architecture Overview',
        url: 'docs/guides/architecture-overview',
        description: '5-layer architecture — Core, Bridge, Proxy, Fixtures, AI',
      },
      {
        title: 'Bridge Internals',
        url: 'docs/guides/bridge-internals',
        description: 'UI5 bridge injection and browser-side script details',
      },
      {
        title: 'Control Proxy',
        url: 'docs/guides/control-proxy',
        description: 'JavaScript Proxy pattern for UI5 control method forwarding',
      },
      {
        title: 'Intent API',
        url: 'docs/guides/intent-api',
        description: 'Business-oriented test operations for SAP S/4HANA modules',
      },
      {
        title: 'Vocabulary System',
        url: 'docs/guides/vocabulary-system',
        description: 'SAP business term resolution with fuzzy matching',
      },
      {
        title: 'Capabilities & Recipes',
        url: 'docs/guides/capabilities-recipes',
        description:
          '{{capabilities}} capabilities across {{capabilityCategories}} categories for AI ' +
          'agent introspection',
      },
      {
        title: 'Reporters',
        url: 'docs/guides/reporters',
        description: 'ComplianceReporter and ODataTraceReporter',
      },
      {
        title: 'Docker & CI/CD',
        url: 'docs/guides/docker-cicd',
        description: 'Container setup, 3-OS CI matrix, quality gates',
      },
      {
        title: 'Migration from wdi5',
        url: 'docs/guides/migration-from-wdi5',
        description: 'wdi5 to Praman API mapping and migration checklist',
      },
      {
        title: 'Migration from Playwright',
        url: 'docs/guides/migration-from-playwright',
        description: 'Layer Praman on top of existing Playwright tests',
      },
      {
        title: 'Migration from Tosca',
        url: 'docs/guides/migration-from-tosca',
        description: 'Tosca to Praman migration guide',
      },
    ],
  },
];

/**
 * Hand-written routing guidance kept verbatim in the index.
 *
 * @remarks
 * Earns its place in a file this short because it is the decision agents get
 * wrong most often — reaching for `page.click()` on a UI5 control, or for a
 * Praman fixture on a non-UI5 login page.
 */
const FLOWCHART = `## Interaction Decision Flowchart

When clicking / pressing a control, choose the right method:

\`\`\`
Is the element a UI5 control? (check: sap.ui.getCore().byId(id) !== undefined)
│
├─ YES → Use Praman fixture
│  │
│  ├─ Standard sap.m.* / sap.ui.comp.* / sap.uxap.*
│  │  └─ await ui5.click({ id }) or await ui5.press({ id })
│  │     Default strategy (ui5-native) fires: firePress → fireSelect → fireTap → DOM click
│  │
│  ├─ sap.m.IconTabFilter (FLP space/section tabs)
│  │  └─ ⚠ firePress() is a NO-OP on this control
│  │     Use: await page.getByText('Tab Label', { exact: true }).click()
│  │     Or switch to: PRAMAN_INTERACTION_STRATEGY=dom-first
│  │
│  ├─ Custom composite controls (missing firePress)
│  │  └─ Try ui5.click() first — ui5-native falls back to DOM click
│  │     If that fails → switch to PRAMAN_INTERACTION_STRATEGY=dom-first
│  │
│  └─ UI5 Web Components (Shadow DOM: ui5-button, ui5-input)
│     └─ Use page.getByRole() / page.getByText() + .click()
│        Or switch to: PRAMAN_INTERACTION_STRATEGY=dom-first
│
└─ NO → Not a UI5 control (plain HTML, login pages, iframes)
   └─ Use Playwright native: page.getByRole() / page.locator() + .click()
      Praman fixtures do NOT apply here
\`\`\`

Strategy summary (set via \`PRAMAN_INTERACTION_STRATEGY\` env var or config):

| Strategy     | Fallback chain                                            | Best for                        |
|------------- |---------------------------------------------------------- |-------------------------------- |
| \`ui5-native\` | firePress → fireSelect → fireTap → DOM click (default)   | Standard Fiori apps             |
| \`dom-first\`  | DOM click → firePress → fireSelect → fireTap             | Web Components, IconTabFilter   |
| \`opa5\`       | RecordReplay.interactWithControl → firePress/fireSelect   | SAP compliance, UI5 >= 1.94     |

Key rules:
- \`ui5.click()\` and \`ui5.press()\` are **identical** (press delegates to click)
- NEVER use \`page.click('#__xmlview0--myBtn')\` — raw UI5 IDs are banned (compliance check fails)
- Auth/login pages are NOT UI5 — always use Playwright native there
- For inputs: \`setValue()\` + \`fireChange()\` + \`waitForUI5()\` — never just \`page.fill()\``;

/** Substitute `{{fact}}` placeholders, failing loudly on an unknown name. */
function interpolate(text: string, facts: PramanFacts): string {
  return text.replaceAll(/\{\{(\w+)\}\}/gu, (_match, name: string) => {
    const value = (facts as unknown as Record<string, unknown>)[name];
    if (value === undefined) {
      throw new Error(
        `Unknown fact "{{${name}}}" in the llms.txt index. ` +
          `Add it to PramanFacts in scripts/llms-facts.ts, or fix the placeholder.`,
      );
    }
    return String(value);
  });
}

/** Assemble the short index. */
function buildIndex(facts: PramanFacts): string {
  const lines: string[] = [
    '# playwright-praman',
    '',
    '> Agent-First SAP UI5 Test Automation Plugin for Playwright. Typed UI5 control proxies,',
    `> AI-powered test generation, ${String(facts.fixtures)} Playwright fixtures, ` +
      `${String(facts.capabilities)} capabilities across ` +
      `${String(facts.capabilityCategories)} categories.`,
    '> Supports SAP S/4HANA, BTP, Fiori Elements. Cross-platform: Windows, macOS, Linux.',
    '> License: Apache-2.0',
    '> npm: `npm install playwright-praman` | ' +
      "Import: `import { test, expect } from 'playwright-praman'`",
    '',
  ];

  const [docs, ...rest] = INDEX;
  if (docs === undefined) throw new Error('INDEX must define at least the Docs section.');

  const renderSection = (section: {
    readonly section: string;
    readonly entries: readonly IndexEntry[];
  }): void => {
    lines.push(`## ${section.section}`, '');
    for (const entry of section.entries) {
      lines.push(
        `- [${entry.title}](https://praman.dev/${entry.url}): ` +
          `${interpolate(entry.description, facts)}`,
      );
    }
    lines.push('');
  };

  // Docs, then the flowchart, then everything else — the flowchart is routing
  // guidance, so it belongs immediately after the pages it routes between.
  renderSection(docs);
  lines.push(FLOWCHART, '');
  for (const section of rest) renderSection(section);

  return `${collapseBlankLines(lines.join('\n')).trim()}\n`;
}

/* ── Main ──────────────────────────────────────────────────────────────── */

const MIN_FULL_LINES = 600;

/**
 * Upper bound on `llms-full.txt`.
 *
 * @remarks
 * Raised from 5000 when `parallel-execution.md` and `compatibility.md` were
 * added: the corpus was already at 4619 lines, so the old ceiling would have
 * rejected the very content that was missing. The bound exists to catch a
 * runaway include, not to cap the documentation.
 */
const MAX_FULL_LINES = 7000;

async function main(): Promise<void> {
  const mode: EmitMode = IS_CHECK ? 'check' : 'write';
  const read = async (file: string): Promise<string> => readFile(resolve(ROOT, file), 'utf8');

  const facts = await deriveFacts(ROOT);

  /* llms.txt — the short index */
  const index = buildIndex(facts);

  const broken = await findBrokenDocLinks(index, ROOT);
  if (broken.length > 0) {
    for (const link of broken) {
      console.error(`Dead link: ${link.url} (expected ${link.expected})`);
    }
    throw new Error(
      `${String(broken.length)} llms.txt link(s) point at pages that do not exist. ` +
        `Fix the url in INDEX, or restore the page.`,
    );
  }

  /* llms-full.txt — the whole corpus */
  const [guides, examples, apiReport] = await Promise.all([
    Promise.all(GUIDES.map(async (g) => ({ ...g, body: prepareGuide(await read(g.file)) }))),
    Promise.all(EXAMPLES.map(async (e) => ({ ...e, body: prepareGuide(await read(e.file)) }))),
    read(API_REPORT),
  ]);

  const fullSections: string[] = [
    '# playwright-praman',
    '',
    '> Agent-First SAP UI5 Test Automation Plugin for Playwright.',
    '> License: Apache-2.0',
    '> Install: npm install playwright-praman @playwright/test',
    "> Import: import { test, expect } from 'playwright-praman'",
    '> Generated from source docs and API reports — do not edit by hand.',
    '',
  ];

  for (const guide of guides) {
    fullSections.push(`## ${guide.heading}`, '', guide.body, '');
  }

  fullSections.push(
    '## API Signatures',
    '',
    '> Public API surface from API Extractor report. TypeScript declaration signatures.',
    '',
    '```ts',
    cleanApiReport(apiReport),
    '```',
    '',
    '## Code Examples',
    '',
  );

  for (const example of examples) {
    fullSections.push(`### ${example.heading}`, '', example.body, '');
  }

  const full = `${collapseBlankLines(fullSections.join('\n')).trim()}\n`;
  const fullLines = full.split('\n').length;

  /* Self-validation */
  const expectedHeadings = [...GUIDES.map((g) => g.heading), 'API Signatures', 'Code Examples'];
  const missing = expectedHeadings.filter((heading) => !full.includes(`## ${heading}`));
  if (missing.length > 0) {
    throw new Error(`llms-full.txt is missing sections: ${missing.join(', ')}`);
  }
  if (fullLines < MIN_FULL_LINES || fullLines > MAX_FULL_LINES) {
    throw new Error(
      `llms-full.txt is ${String(fullLines)} lines, outside ` +
        `${String(MIN_FULL_LINES)}..${String(MAX_FULL_LINES)}.`,
    );
  }

  /* Emit */
  const results = await Promise.all([
    emitGenerated(resolve(ROOT, 'llms.txt'), index, mode),
    emitGenerated(resolve(ROOT, 'llms-full.txt'), full, mode),
  ]);

  const stale = results.filter((result) => result.changed);

  if (IS_CHECK) {
    if (stale.length > 0) {
      for (const result of stale) console.error(`Stale: ${result.path}`);
      console.error('Run `npm run generate:llms-txt` and commit the result.');
      process.exitCode = 1;
      return;
    }
    console.log('llms.txt and llms-full.txt are current.');
    return;
  }

  console.log(`llms.txt         ${String(index.split('\n').length)} lines`);
  console.log(`llms-full.txt    ${String(fullLines)} lines, ${(full.length / 1024).toFixed(1)} KB`);
  console.log(
    `derived: ${String(facts.fixtures)} fixtures, ${String(facts.capabilities)} capabilities, ` +
      `${String(facts.errorCodes)} error codes, ${String(facts.navMethods)} nav methods`,
  );
}

main().catch((error: unknown) => {
  console.error('Failed to generate llms files:', error);
  process.exitCode = 1;
});
