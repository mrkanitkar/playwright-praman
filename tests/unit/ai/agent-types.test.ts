/**
 * Type-level tests for `src/ai/agent-types.ts`.
 *
 * @remarks
 * Verifies AgentPlanControlRef, AgentPlanStep, AgentPlanScenario, AgentPlan,
 * and ComplianceReport interface shapes and field types. Also verifies that
 * all types are exported from the `playwright-praman/ai` sub-path.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type {
  AgentPlan,
  AgentPlanControlRef,
  AgentPlanScenario,
  AgentPlanStep,
  ComplianceReport,
} from '#ai/agent-types.js';
import type { DiscoveredControl } from '#ai/types.js';

// ── AgentPlanControlRef ─────────────────────────────────────────────────────

describe('AgentPlanControlRef', () => {
  it('has controlId as readonly string', () => {
    expectTypeOf<AgentPlanControlRef['controlId']>().toEqualTypeOf<string>();
  });

  it('has controlType as readonly string', () => {
    expectTypeOf<AgentPlanControlRef['controlType']>().toEqualTypeOf<string>();
  });

  it('has pramanMethod as readonly string', () => {
    expectTypeOf<AgentPlanControlRef['pramanMethod']>().toEqualTypeOf<string>();
  });

  it('accepts valid control ref object', () => {
    const ref: AgentPlanControlRef = {
      controlId: 'createBtn',
      controlType: 'sap.m.Button',
      pramanMethod: "ui5.control({ controlType: 'sap.m.Button' }).press()",
    };
    expectTypeOf(ref).toExtend<AgentPlanControlRef>();
  });
});

// ── AgentPlanStep ───────────────────────────────────────────────────────────

describe('AgentPlanStep', () => {
  it('has index as readonly number', () => {
    expectTypeOf<AgentPlanStep['index']>().toEqualTypeOf<number>();
  });

  it('has description as readonly string', () => {
    expectTypeOf<AgentPlanStep['description']>().toEqualTypeOf<string>();
  });

  it('has action as readonly string', () => {
    expectTypeOf<AgentPlanStep['action']>().toEqualTypeOf<string>();
  });

  it('controlId is optional string', () => {
    expectTypeOf<AgentPlanStep['controlId']>().toEqualTypeOf<string | undefined>();
  });

  it('controlType is optional string', () => {
    expectTypeOf<AgentPlanStep['controlType']>().toEqualTypeOf<string | undefined>();
  });

  it('pramanMethod is optional string', () => {
    expectTypeOf<AgentPlanStep['pramanMethod']>().toEqualTypeOf<string | undefined>();
  });

  it('accepts step with required fields only', () => {
    const step: AgentPlanStep = {
      index: 1,
      description: 'Click the Create button',
      action: 'press',
    };
    expectTypeOf(step).toExtend<AgentPlanStep>();
  });

  it('accepts step with all optional fields', () => {
    const step: AgentPlanStep = {
      index: 1,
      description: 'Click the Create button',
      action: 'press',
      controlId: 'createBtn',
      controlType: 'sap.m.Button',
      pramanMethod: "ui5.control({ id: 'createBtn' }).press()",
    };
    expectTypeOf(step).toExtend<AgentPlanStep>();
  });
});

// ── AgentPlanScenario ────────────────────────────────────────────────────────

describe('AgentPlanScenario', () => {
  it('has name as readonly string', () => {
    expectTypeOf<AgentPlanScenario['name']>().toEqualTypeOf<string>();
  });

  it('has steps as readonly AgentPlanStep array', () => {
    expectTypeOf<AgentPlanScenario['steps']>().toEqualTypeOf<AgentPlanStep[]>();
  });

  it('has assertions as readonly string array', () => {
    expectTypeOf<AgentPlanScenario['assertions']>().toEqualTypeOf<string[]>();
  });

  it('has controlsUsed as readonly AgentPlanControlRef array', () => {
    expectTypeOf<AgentPlanScenario['controlsUsed']>().toEqualTypeOf<AgentPlanControlRef[]>();
  });

  it('accepts valid scenario object', () => {
    const scenario: AgentPlanScenario = {
      name: 'Create BOM with Material and Plant',
      steps: [{ index: 1, description: 'Click Create', action: 'press' }],
      assertions: ['Success message displayed'],
      controlsUsed: [
        {
          controlId: 'createBtn',
          controlType: 'sap.m.Button',
          pramanMethod: "ui5.control({ id: 'createBtn' }).press()",
        },
      ],
    };
    expectTypeOf(scenario).toExtend<AgentPlanScenario>();
  });
});

// ── AgentPlan ───────────────────────────────────────────────────────────────

describe('AgentPlan', () => {
  it('has appName as readonly string', () => {
    expectTypeOf<AgentPlan['appName']>().toEqualTypeOf<string>();
  });

  it('has systemUrl as readonly string', () => {
    expectTypeOf<AgentPlan['systemUrl']>().toEqualTypeOf<string>();
  });

  it('has ui5Version as readonly string', () => {
    expectTypeOf<AgentPlan['ui5Version']>().toEqualTypeOf<string>();
  });

  it('has scenarios as readonly AgentPlanScenario array', () => {
    expectTypeOf<AgentPlan['scenarios']>().toEqualTypeOf<AgentPlanScenario[]>();
  });

  it('has controlInventory as readonly DiscoveredControl array', () => {
    expectTypeOf<AgentPlan['controlInventory']>().toEqualTypeOf<DiscoveredControl[]>();
  });

  it('has generatedAt as readonly string', () => {
    expectTypeOf<AgentPlan['generatedAt']>().toEqualTypeOf<string>();
  });

  it('has generatorVersion as readonly string', () => {
    expectTypeOf<AgentPlan['generatorVersion']>().toEqualTypeOf<string>();
  });

  it('seedFile is optional string', () => {
    expectTypeOf<AgentPlan['seedFile']>().toEqualTypeOf<string | undefined>();
  });

  it('accepts plan without optional seedFile', () => {
    const plan: AgentPlan = {
      appName: 'Bill of Materials',
      systemUrl: 'https://my403147.s4hana.cloud.sap/',
      ui5Version: '1.142.4',
      scenarios: [],
      controlInventory: [],
      generatedAt: '2026-02-24T00:00:00.000Z',
      generatorVersion: '1.0.0',
    };
    expectTypeOf(plan).toExtend<AgentPlan>();
  });

  it('accepts plan with seedFile', () => {
    const plan: AgentPlan = {
      appName: 'Bill of Materials',
      systemUrl: 'https://my403147.s4hana.cloud.sap/',
      ui5Version: '1.142.4',
      scenarios: [],
      controlInventory: [],
      generatedAt: '2026-02-24T00:00:00.000Z',
      generatorVersion: '1.0.0',
      seedFile: 'tests/seeds/sap-seed.spec.ts',
    };
    expectTypeOf(plan).toExtend<AgentPlan>();
  });
});

// ── ComplianceReport ─────────────────────────────────────────────────────────

describe('ComplianceReport', () => {
  it('has version as readonly string', () => {
    expectTypeOf<ComplianceReport['version']>().toEqualTypeOf<string>();
  });

  it('has ui5ElementsInteracted as readonly number', () => {
    expectTypeOf<ComplianceReport['ui5ElementsInteracted']>().toEqualTypeOf<number>();
  });

  it('has usingPramanFixtures as readonly number', () => {
    expectTypeOf<ComplianceReport['usingPramanFixtures']>().toEqualTypeOf<number>();
  });

  it('has usingPlaywrightNative as readonly number', () => {
    expectTypeOf<ComplianceReport['usingPlaywrightNative']>().toEqualTypeOf<number>();
  });

  it('has fixturesUsed as readonly Record<string, number>', () => {
    expectTypeOf<ComplianceReport['fixturesUsed']>().toEqualTypeOf<Record<string, number>>();
  });

  it('authMethod is seed-inline or setup-project union', () => {
    expectTypeOf<ComplianceReport['authMethod']>().toEqualTypeOf<'seed-inline' | 'setup-project'>();
  });

  it('forbiddenPatternScan is PASSED or FAILED union', () => {
    expectTypeOf<ComplianceReport['forbiddenPatternScan']>().toEqualTypeOf<'PASSED' | 'FAILED'>();
  });

  it('violations is readonly string array', () => {
    expectTypeOf<ComplianceReport['violations']>().toEqualTypeOf<readonly string[]>();
  });

  it('complianceStatus is PASSED or FAILED union', () => {
    expectTypeOf<ComplianceReport['complianceStatus']>().toEqualTypeOf<'PASSED' | 'FAILED'>();
  });

  it('accepts fully compliant report', () => {
    const report: ComplianceReport = {
      version: '1.0.0',
      ui5ElementsInteracted: 12,
      usingPramanFixtures: 12,
      usingPlaywrightNative: 0,
      fixturesUsed: {
        'ui5.control': 8,
        'ui5.table.getRows': 2,
        'ui5Navigation.navigateToTile': 1,
        'ui5Footer.clickSave': 1,
      },
      authMethod: 'seed-inline',
      forbiddenPatternScan: 'PASSED',
      violations: [],
      complianceStatus: 'PASSED',
    };
    expectTypeOf(report).toExtend<ComplianceReport>();
  });

  it('accepts failed report with violations', () => {
    const report: ComplianceReport = {
      version: '1.0.0',
      ui5ElementsInteracted: 5,
      usingPramanFixtures: 3,
      usingPlaywrightNative: 2,
      fixturesUsed: { 'ui5.control': 3 },
      authMethod: 'setup-project',
      forbiddenPatternScan: 'FAILED',
      violations: [
        "page.click('#__button0') — use ui5.control().press()",
        "from '@playwright/test' — use 'playwright-praman'",
      ],
      complianceStatus: 'FAILED',
    };
    expectTypeOf(report).toExtend<ComplianceReport>();
  });
});

// ── Export verification (compile-time) ──────────────────────────────────────
// These are type-only exports — verified by successful TypeScript compilation.

describe('compile-time export checks', () => {
  it('AgentPlan is assignable from its required fields', () => {
    // Compile-time check — if this file compiles, the type is exported correctly
    type Check = AgentPlan extends { appName: string; systemUrl: string } ? true : false;
    expectTypeOf<Check>().toEqualTypeOf<true>();
  });

  it('ComplianceReport complianceStatus narrows correctly', () => {
    const report = {} as ComplianceReport;
    if (report.complianceStatus === 'PASSED') {
      expectTypeOf(report.complianceStatus).toEqualTypeOf<'PASSED'>();
    }
    if (report.complianceStatus === 'FAILED') {
      expectTypeOf(report.complianceStatus).toEqualTypeOf<'FAILED'>();
    }
  });

  it('AgentPlanStep optional fields narrow to undefined when absent', () => {
    const minimalStep: AgentPlanStep = { index: 1, description: 'step', action: 'press' };
    expectTypeOf(minimalStep.controlId).toEqualTypeOf<string | undefined>();
    expectTypeOf(minimalStep.controlType).toEqualTypeOf<string | undefined>();
    expectTypeOf(minimalStep.pramanMethod).toEqualTypeOf<string | undefined>();
  });

  it('AgentPlan seedFile narrows to undefined when absent', () => {
    const plan: AgentPlan = {
      appName: 'App',
      systemUrl: 'https://example.com',
      ui5Version: '1.142.0',
      scenarios: [],
      controlInventory: [],
      generatedAt: '2026-02-24T00:00:00.000Z',
      generatorVersion: '1.0.0',
    };
    expectTypeOf(plan.seedFile).toEqualTypeOf<string | undefined>();
  });
});
