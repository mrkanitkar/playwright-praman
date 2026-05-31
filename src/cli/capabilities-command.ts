/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Praman capability manifest for AI agents.
 *
 * @remarks
 * Exposes a machine-readable manifest of all discovery, introspection,
 * interaction, stability, and generation capabilities available via the
 * Playwright CLI and Praman bridge. Agents call
 * `npx playwright-praman capabilities` to learn what they can do
 * before starting a session.
 *
 * @module cli/capabilities-command
 */

import process from 'node:process';

import { logBanner } from './logger.js';
import { getVersion } from './version.js';

/**
 * A single Praman capability descriptor.
 *
 * @example
 * ```typescript
 * const cap: Capability = {
 *   id: 'UI5-DISC-001',
 *   name: 'discover-all-controls',
 *   category: 'discovery',
 *   mechanism: 'run-code',
 *   parameterized: false,
 *   prebuiltScript: 'discover-all.js',
 *   agentHint: 'Use to enumerate all UI5 controls on the page',
 *   usageExample: 'playwright-cli -s=sap run-code "$(cat dist/scripts/discover-all.js)"',
 * };
 * ```
 */
export interface Capability {
  readonly id: string;
  readonly name: string;
  readonly category:
    | 'discovery'
    | 'introspection'
    | 'interaction'
    | 'navigation'
    | 'stability'
    | 'generation';
  readonly mechanism: 'run-code' | 'eval' | 'offline';
  readonly parameterized: boolean;
  readonly parameters?: readonly string[];
  readonly prebuiltScript?: string;
  readonly agentHint: string;
  readonly usageExample: string;
}

/**
 * Full capability manifest returned by {@link buildCapabilityManifest}.
 *
 * @example
 * ```typescript
 * const manifest = buildCapabilityManifest();
 * console.log(manifest.capabilities.length); // 13
 * ```
 */
export interface CapabilityManifest {
  readonly version: string;
  readonly cliVersion: string;
  readonly capabilities: readonly Capability[];
  readonly bridgeAPIs: readonly string[];
  readonly offlineCommands: readonly string[];
  readonly skillFiles: readonly string[];
}

/**
 * Options for the `capabilities` CLI command.
 *
 * @example
 * ```typescript
 * runCapabilities({ format: 'table' });
 * ```
 */
export interface CapabilitiesOptions {
  readonly format?: 'json' | 'table' | 'agent';
  readonly agent?: boolean;
}

/** Default usage example for offline generation capabilities. */
const CAPS_AGENT_EXAMPLE = 'npx playwright-praman capabilities --agent';

/** The 13 capabilities exposed by Praman + Playwright CLI. */
const CAPABILITY_REGISTRY: readonly Capability[] = [
  // ── Discovery (3) ──
  {
    id: 'UI5-DISC-001',
    name: 'discover-all-controls',
    category: 'discovery',
    mechanism: 'run-code',
    parameterized: false,
    prebuiltScript: 'discover-all.js',
    agentHint: 'Enumerate all UI5 controls with types, properties, and methods (max 100)',
    usageExample:
      'playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/discover-all.js)"',
  },
  {
    id: 'UI5-DISC-002',
    name: 'discover-by-type',
    category: 'discovery',
    mechanism: 'run-code',
    parameterized: true,
    parameters: ['controlType'],
    agentHint: 'Filter controls by sap.ui type name (e.g. sap.m.Input)',
    usageExample:
      'playwright-cli -s=sap run-code "async page => { return await page.evaluate(() => sap.ui.core.Element.registry.filter(e => e.getMetadata().getName() === \'sap.m.Input\').map(c => c.getId())); }"',
  },
  {
    id: 'UI5-DISC-003',
    name: 'discover-dialog-controls',
    category: 'discovery',
    mechanism: 'run-code',
    parameterized: false,
    prebuiltScript: 'dialog-controls.js',
    agentHint: 'Find controls inside open SAP dialogs, grouped by dialog',
    usageExample:
      'playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/dialog-controls.js)"',
  },
  // ── Introspection (1) ──
  {
    id: 'UI5-INSP-001',
    name: 'inspect-single-control',
    category: 'introspection',
    mechanism: 'run-code',
    parameterized: true,
    parameters: ['controlId'],
    agentHint: 'Get full metadata, methods, bindings for one control by ID',
    usageExample:
      'playwright-cli -s=sap run-code "async page => { return await page.evaluate(id => { const b = window.__praman_bridge; const c = b.getById(id); return { id: c.getId(), type: c.getMetadata().getName(), methods: b.utils.retrieveControlMethods(id) }; }, \'CONTROL_ID\'); }"',
  },
  // ── Interaction (2) ──
  {
    id: 'UI5-ACT-001',
    name: 'set-value-fire-change',
    category: 'interaction',
    mechanism: 'run-code',
    parameterized: true,
    parameters: ['controlId', 'value'],
    agentHint: 'Mandatory three-step pattern: setValue + fireChange + waitForUI5',
    usageExample:
      "playwright-cli -s=sap run-code \"async page => { return await page.evaluate(([id, val]) => { const c = sap.ui.getCore().byId(id); c.setValue(val); c.fireChange({ value: val }); return 'done'; }, ['CONTROL_ID', 'VALUE']); }\"",
  },
  {
    id: 'UI5-ACT-002',
    name: 'press-button',
    category: 'interaction',
    mechanism: 'run-code',
    parameterized: true,
    parameters: ['controlId'],
    agentHint: 'Trigger firePress on a sap.m.Button control',
    usageExample:
      "playwright-cli -s=sap run-code \"async page => { return await page.evaluate(id => { const b = sap.ui.getCore().byId(id); b.firePress(); return 'pressed'; }, 'BUTTON_ID'); }\"",
  },
  // ── Navigation (1) ──
  {
    id: 'UI5-NAV-001',
    name: 'navigate-flp-tile',
    category: 'navigation',
    mechanism: 'run-code',
    parameterized: true,
    parameters: ['semanticObject', 'action'],
    agentHint: 'Navigate via Fiori Launchpad cross-app navigation',
    usageExample:
      "playwright-cli -s=sap run-code \"async page => { return await page.evaluate(hash => { window.location.hash = hash; return 'navigated'; }, '#PurchaseOrder-manage'); }\"",
  },
  // ── Stability (2) ──
  {
    id: 'UI5-STB-001',
    name: 'wait-for-ui5',
    category: 'stability',
    mechanism: 'run-code',
    parameterized: false,
    prebuiltScript: 'wait-for-ui5.js',
    agentHint: 'Poll for UI5 stability (bridge ready, BusyIndicator inactive, no pending XHR)',
    usageExample:
      'playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/wait-for-ui5.js)"',
  },
  {
    id: 'UI5-STB-002',
    name: 'bridge-status',
    category: 'stability',
    mechanism: 'run-code',
    parameterized: false,
    prebuiltScript: 'bridge-status.js',
    agentHint: 'Quick bridge diagnostics: version, readiness, control count',
    usageExample:
      'playwright-cli -s=sap run-code "$(cat node_modules/playwright-praman/dist/scripts/bridge-status.js)"',
  },
  // ── Generation (4) ──
  {
    id: 'UI5-GEN-001',
    name: 'generate-test-step',
    category: 'generation',
    mechanism: 'offline',
    parameterized: true,
    parameters: ['action', 'controlId', 'value'],
    agentHint: 'Generate a Praman test.step() block from discovered control info',
    usageExample: CAPS_AGENT_EXAMPLE,
  },
  {
    id: 'UI5-GEN-002',
    name: 'generate-ids-constant',
    category: 'generation',
    mechanism: 'offline',
    parameterized: true,
    parameters: ['controlIds'],
    agentHint: 'Generate the IDS constant object from discovered control IDs',
    usageExample: CAPS_AGENT_EXAMPLE,
  },
  {
    id: 'UI5-GEN-003',
    name: 'verify-spec-compliance',
    category: 'generation',
    mechanism: 'offline',
    parameterized: true,
    parameters: ['filePath'],
    agentHint: 'Validate a generated .spec.ts against gold-standard rules',
    usageExample: 'npx playwright-praman verify-spec tests/e2e/my-app.spec.ts',
  },
  {
    id: 'UI5-GEN-004',
    name: 'capabilities-manifest',
    category: 'generation',
    mechanism: 'offline',
    parameterized: false,
    agentHint: 'Retrieve the full capability manifest (this command)',
    usageExample: CAPS_AGENT_EXAMPLE,
  },
] as const;

/**
 * Builds the full capability manifest.
 *
 * @returns A frozen {@link CapabilityManifest} with all 13 capabilities.
 *
 * @example
 * ```typescript
 * const manifest = buildCapabilityManifest();
 * console.log(manifest.capabilities.length); // 13
 * ```
 */
export function buildCapabilityManifest(): CapabilityManifest {
  return {
    version: '1.0.0',
    cliVersion: getVersion(),
    capabilities: CAPABILITY_REGISTRY,
    bridgeAPIs: [
      'window.__praman_bridge.ready',
      'window.__praman_bridge.utils.retrieveControlMethods(id)',
      'window.__praman_bridge.getById(id)',
      'sap.ui.require("sap/ui/core/ElementRegistry").all()',
      'sap.ui.core.BusyIndicator.isActive()',
    ],
    offlineCommands: [
      'npx playwright-praman capabilities',
      'npx playwright-praman verify-spec <file>',
      'npx playwright-praman doctor',
      'npx playwright-praman snapshot',
    ],
    skillFiles: [
      'skills/praman-sap-cli/SKILL.md',
      '.claude/skills/praman-sap-cli/SKILL.md',
      '.github/skills/praman-sap-cli/SKILL.md',
    ],
  };
}

/**
 * Formats the manifest as indented JSON.
 *
 * @param manifest - The capability manifest to format.
 * @returns Pretty-printed JSON string.
 *
 * @example
 * ```typescript
 * const json = formatManifestJson(buildCapabilityManifest());
 * ```
 */
export function formatManifestJson(manifest: CapabilityManifest): string {
  return JSON.stringify(manifest, null, 2);
}

/**
 * Formats the manifest as a human-readable table.
 *
 * @param manifest - The capability manifest to format.
 * @returns Table string with columns: ID, Name, Category, Mechanism.
 *
 * @example
 * ```typescript
 * const table = formatManifestTable(buildCapabilityManifest());
 * ```
 */
export function formatManifestTable(manifest: CapabilityManifest): string {
  const header = 'ID             | Name                       | Category       | Mechanism';
  const divider = '---------------|----------------------------|----------------|----------';
  const rows = manifest.capabilities.map(
    (c) => `${c.id.padEnd(15)}| ${c.name.padEnd(27)}| ${c.category.padEnd(15)}| ${c.mechanism}`,
  );
  return [header, divider, ...rows].join('\n');
}

/**
 * Formats the manifest in a compact agent-friendly format.
 *
 * @param manifest - The capability manifest to format.
 * @returns Compact string with one line per capability.
 *
 * @example
 * ```typescript
 * const compact = formatManifestAgent(buildCapabilityManifest());
 * ```
 */
export function formatManifestAgent(manifest: CapabilityManifest): string {
  const lines = manifest.capabilities.map((c) => {
    const scriptSuffix =
      c.prebuiltScript !== undefined ? ' (script: ' + c.prebuiltScript + ')' : '';
    return c.id + ' [' + c.mechanism + '] ' + c.agentHint + scriptSuffix;
  });
  const header =
    'Praman v' +
    manifest.cliVersion +
    ' — ' +
    String(manifest.capabilities.length) +
    ' capabilities';
  return [header, '', ...lines].join('\n');
}

/**
 * Runs the `capabilities` CLI command.
 *
 * @param opts - Output format options.
 *
 * @example
 * ```typescript
 * runCapabilities({ format: 'json' });
 * runCapabilities({ agent: true });
 * ```
 */
export function runCapabilities(opts: CapabilitiesOptions): void {
  const manifest = buildCapabilityManifest();
  const format = opts.agent === true ? 'agent' : (opts.format ?? 'json');

  if (format === 'table') {
    logBanner('Praman Capabilities', manifest.cliVersion);
    process.stdout.write(formatManifestTable(manifest) + '\n');
  } else if (format === 'agent') {
    process.stdout.write(formatManifestAgent(manifest) + '\n');
  } else {
    process.stdout.write(formatManifestJson(manifest) + '\n');
  }
}
