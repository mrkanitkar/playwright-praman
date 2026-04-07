/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Zod schemas for capability registry entries.
 *
 * @remarks
 * These schemas are the single source of truth for the `CapabilityEntry` type.
 * The TypeScript type is derived via `z.infer<>` — never define the interface
 * manually elsewhere.
 *
 * @module ai
 */

import { z } from 'zod';

/**
 * Valid capability categories.
 *
 * @remarks
 * Maps 1:1 to the `categories` section in `capabilities.yaml`.
 *
 * @example
 * ```typescript
 * const cat: CapabilityCategory = 'table';
 * ```
 */
export const CapabilityCategorySchema = z.enum([
  'ui5',
  'auth',
  'navigate',
  'table',
  'dialog',
  'date',
  'odata',
  'fe',
  'intent',
  'flp',
  'shell',
  'footer',
  'ai',
  'data',
  'assert',
]);
export type CapabilityCategory = z.infer<typeof CapabilityCategorySchema>;

/**
 * Priority tier for API surface stratification.
 *
 * @remarks
 * - `'fixture'` — Primary Playwright fixture (recommended for consumers)
 * - `'namespace'` — Secondary utility / handler export
 * - `'implementation'` — Internal implementation detail
 *
 * @example
 * ```typescript
 * const priority: CapabilityPriority = 'fixture';
 * ```
 */
export const CapabilityPrioritySchema = z.enum(['fixture', 'namespace', 'implementation']);
export type CapabilityPriority = z.infer<typeof CapabilityPrioritySchema>;

/**
 * A single entry in the capability registry exposed to AI agents.
 *
 * @remarks
 * Generated entries are produced by `npm run generate:capabilities` from
 * `capabilities.yaml`. This Zod schema is the single source of truth —
 * the TypeScript type is derived via `z.infer<>`.
 *
 * @intent Describe a Praman API capability for AI-driven test generation.
 * @capability AI agent context, test scaffolding.
 *
 * @example
 * ```typescript
 * const entry: CapabilityEntry = {
 *   id: 'UI5-TABLE-001',
 *   qualifiedName: 'ui5.table.detectType',
 *   name: 'detectType',
 *   description: 'Detects the table type and returns metadata.',
 *   category: 'table',
 *   priority: 'fixture',
 *   usageExample: "const info = await ui5.table.detectType('orderTable');",
 *   registryVersion: 1,
 * };
 * ```
 */
export const CapabilityEntrySchema = z.object({
  /** Unique identifier in `UI5-PREFIX-NNN` format. */
  id: z.string().regex(/^UI5-[A-Z0-9]+-\d{3}$/),
  /** Dot-separated agent-friendly name, e.g. 'ui5.table.getRows'. */
  qualifiedName: z.string().min(1),
  /** Human-readable function or method name. */
  name: z.string().min(1),
  /** One-sentence description of what this capability does. */
  description: z.string().min(10),
  /** Logical grouping for filtering. */
  category: CapabilityCategorySchema,
  /** Optional intent tag. */
  intent: z.string().optional(),
  /** Optional SAP UI5 module tag. */
  sapModule: z.string().optional(),
  /** Ready-to-run usage example string. */
  usageExample: z.string().min(1),
  /** Registry schema version for forward compatibility. */
  registryVersion: z.literal(1),
  /** REQUIRED priority tier. */
  priority: CapabilityPrioritySchema,
  /** UI5 control types this capability works with. */
  controlTypes: z.array(z.string()).optional(),
  /** Whether this is an async method. */
  async: z.boolean().optional(),
  /** AI agent steering — tells agents to prefer a higher-level alternative. */
  aiSteering: z.string().optional(),
});
/** A single capability entry inferred from `CapabilityEntrySchema`. */
export type CapabilityEntry = z.infer<typeof CapabilityEntrySchema>;

/**
 * Schema for validating the full capabilities.yaml file structure.
 *
 * @example
 * ```typescript
 * const parsed = CapabilitiesYamlSchema.parse(yamlData);
 * ```
 */
export const CapabilitiesYamlSchema = z.object({
  registryVersion: z.literal(1),
  generatedAt: z.string(),
  categories: z.record(
    z.string(),
    z.object({
      prefix: z.string(),
      description: z.string(),
    }),
  ),
  capabilities: z.array(CapabilityEntrySchema).min(100),
});
export type CapabilitiesYaml = z.infer<typeof CapabilitiesYamlSchema>;
