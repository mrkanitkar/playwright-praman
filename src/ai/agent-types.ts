/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Agent orchestration types for Praman AI planner, generator, and healer agents.
 *
 * @remarks
 * These types define the structured output formats used by the three Praman
 * agents (planner, generator, healer). They are serializable to JSON and
 * designed for both agent-to-agent communication and CI/CD reporting.
 *
 * @module ai
 */

import type { DiscoveredControl } from './types.js';

// ── Agent Plan ──────────────────────────────────────────────────────────────

/**
 * Reference to a specific control used in a test plan step.
 *
 * @intent Map discovered controls to their Praman API methods for code generation.
 *
 * @example
 * ```typescript
 * const ref: AgentPlanControlRef = {
 *   controlId: 'createBtn',
 *   controlType: 'sap.m.Button',
 *   pramanMethod: "ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create' } }).press()",
 * };
 * ```
 */
export interface AgentPlanControlRef {
  /** UI5 control ID discovered on the page. */
  readonly controlId: string;
  /** Fully-qualified UI5 control type (e.g. `sap.m.Button`). */
  readonly controlType: string;
  /** Praman fixture method call to interact with this control. */
  readonly pramanMethod: string;
}

/**
 * A single step in an agent test plan scenario.
 *
 * @intent Describe one atomic user action for test generation.
 *
 * @example
 * ```typescript
 * const step: AgentPlanStep = {
 *   index: 1,
 *   description: 'Click the Create BOM button in the toolbar',
 *   action: 'press',
 *   controlId: 'createBtn',
 *   controlType: 'sap.m.Button',
 *   pramanMethod: "ui5.control({ controlType: 'sap.m.Button', properties: { text: 'Create BOM' } }).press()",
 * };
 * ```
 */
export interface AgentPlanStep {
  /** 1-based step index within the scenario. */
  readonly index: number;
  /** Human-readable description of this step. */
  readonly description: string;
  /** Action verb (e.g. `'press'`, `'setValue'`, `'navigate'`). */
  readonly action: string;
  /** UI5 control ID targeted by this step, if applicable. */
  readonly controlId?: string;
  /** Fully-qualified UI5 control type, if applicable. */
  readonly controlType?: string;
  /** Praman fixture method call for this step, if applicable. */
  readonly pramanMethod?: string;
}

/**
 * A test scenario within an agent plan, containing ordered steps and assertions.
 *
 * @intent Group related test steps into a cohesive scenario for code generation.
 *
 * @example
 * ```typescript
 * const scenario: AgentPlanScenario = {
 *   name: 'Create BOM with Material and Plant',
 *   steps: [step1, step2, step3],
 *   assertions: ['Success message displayed', 'Record visible in table'],
 *   controlsUsed: [createBtnRef, materialFieldRef],
 * };
 * ```
 */
export interface AgentPlanScenario {
  /** Human-readable scenario name (used as `test.step()` label). */
  readonly name: string;
  /** Ordered list of steps in this scenario. */
  readonly steps: AgentPlanStep[];
  /** Expected outcomes to verify after all steps complete. */
  readonly assertions: string[];
  /** Controls referenced by steps in this scenario. */
  readonly controlsUsed: AgentPlanControlRef[];
}

/**
 * Structured output of the Praman SAP Planner agent.
 *
 * @remarks
 * Serializable to JSON. The planner generates this alongside the `.plan.md`
 * and gold-standard `.spec.ts` files. The generator agent can consume this
 * to produce additional test scenarios.
 *
 * @intent Provide a machine-readable test plan for agent-to-agent handoff.
 *
 * @example
 * ```typescript
 * const plan: AgentPlan = {
 *   appName: 'Bill of Materials',
 *   systemUrl: 'https://<your-system>.s4hana.cloud.sap/',
 *   ui5Version: '1.142.4',
 *   scenarios: [scenario1, scenario2],
 *   controlInventory: discoveredControls,
 *   generatedAt: new Date().toISOString(),
 *   generatorVersion: '1.0.0',
 *   seedFile: 'tests/seeds/sap-seed.spec.ts',
 * };
 * ```
 */
export interface AgentPlan {
  /** Display name of the SAP application under test. */
  readonly appName: string;
  /** Base URL of the SAP system where discovery was performed. */
  readonly systemUrl: string;
  /** UI5 framework version detected on the page. */
  readonly ui5Version: string;
  /** Ordered list of test scenarios discovered by the planner. */
  readonly scenarios: AgentPlanScenario[];
  /** All controls discovered during page analysis. */
  readonly controlInventory: DiscoveredControl[];
  /** ISO 8601 timestamp when this plan was generated. */
  readonly generatedAt: string;
  /** Version of the planner agent that generated this plan. */
  readonly generatorVersion: string;
  /** Path to the seed file used for authentication, if applicable. */
  readonly seedFile?: string;
}

// ── Compliance Report ───────────────────────────────────────────────────────

/**
 * Compliance report for generated or healed test code.
 *
 * @remarks
 * Tracks how many UI5 element interactions use Praman fixtures vs
 * Playwright native methods. A compliant test has 100% Praman fixture
 * usage for UI5 elements and zero forbidden pattern violations.
 *
 * `compliancePercentage` is computed as:
 * `usingPramanFixtures / ui5ElementsInteracted * 100`
 *
 * @intent Verify and report Praman compliance of generated test code.
 *
 * @example
 * ```typescript
 * const report: AgentComplianceReport = {
 *   version: '1.0.0',
 *   ui5ElementsInteracted: 12,
 *   usingPramanFixtures: 12,
 *   usingPlaywrightNative: 0,
 *   fixturesUsed: { 'ui5.control': 8, 'ui5.table.getRows': 2, 'ui5Navigation.navigateToTile': 1, 'ui5Footer.clickSave': 1 },
 *   authMethod: 'seed-inline',
 *   forbiddenPatternScan: 'PASSED',
 *   violations: [],
 *   complianceStatus: 'PASSED',
 * };
 * ```
 */
export interface AgentComplianceReport {
  /** Version of the compliance report format. */
  readonly version: string;
  /** Total number of UI5 element interactions in the test. */
  readonly ui5ElementsInteracted: number;
  /** Number of interactions using Praman fixtures. */
  readonly usingPramanFixtures: number;
  /** Number of interactions using Playwright native methods (should be 0). */
  readonly usingPlaywrightNative: number;
  /** Praman fixture method usage counts (method name to invocation count). */
  readonly fixturesUsed: Record<string, number>;
  /** Authentication method used in the test. */
  readonly authMethod: 'seed-inline' | 'setup-project';
  /** Result of forbidden pattern scan. */
  readonly forbiddenPatternScan: 'PASSED' | 'FAILED';
  /** List of compliance violations found (empty if PASSED). */
  readonly violations: readonly string[];
  /** Overall compliance status. */
  readonly complianceStatus: 'PASSED' | 'FAILED';
}
