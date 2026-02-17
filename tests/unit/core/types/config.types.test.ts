/**
 * Type-level tests for config types.
 *
 * @remarks
 * These tests verify that literal union types accept valid values and
 * that TypeScript rejects invalid values at compile time. Runtime assertions
 * confirm the types exist and are usable.
 *
 * `InteractionStrategyName` and `DiscoveryStrategyName` are derived from Zod
 * (D11) and re-exported via the types barrel from `config/schema.ts`.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type {
  AIProvider,
  AuthStrategy,
  DiscoveryStrategyName,
  InteractionStrategyName,
  LogLevel,
  TelemetryExporter,
} from '#core/types/index.js';

describe('LogLevel', () => {
  it('accepts all valid log levels', () => {
    expectTypeOf<'error'>().toExtend<LogLevel>();
    expectTypeOf<'warn'>().toExtend<LogLevel>();
    expectTypeOf<'info'>().toExtend<LogLevel>();
    expectTypeOf<'debug'>().toExtend<LogLevel>();
    expectTypeOf<'verbose'>().toExtend<LogLevel>();
  });

  it('rejects invalid log levels', () => {
    expectTypeOf<'trace'>().not.toExtend<LogLevel>();
    expectTypeOf<'fatal'>().not.toExtend<LogLevel>();
    expectTypeOf<number>().not.toExtend<LogLevel>();
  });
});

describe('InteractionStrategyName', () => {
  it('accepts all valid strategies', () => {
    expectTypeOf<'ui5-native'>().toExtend<InteractionStrategyName>();
    expectTypeOf<'dom-first'>().toExtend<InteractionStrategyName>();
    expectTypeOf<'opa5'>().toExtend<InteractionStrategyName>();
  });

  it('rejects removed values', () => {
    expectTypeOf<'hybrid'>().not.toExtend<InteractionStrategyName>();
    expectTypeOf<'playwright'>().not.toExtend<InteractionStrategyName>();
  });

  it('rejects invalid values', () => {
    expectTypeOf<'selenium'>().not.toExtend<InteractionStrategyName>();
    expectTypeOf<'cypress'>().not.toExtend<InteractionStrategyName>();
    expectTypeOf<number>().not.toExtend<InteractionStrategyName>();
  });
});

describe('DiscoveryStrategyName', () => {
  it('accepts all valid strategies', () => {
    expectTypeOf<'direct-id'>().toExtend<DiscoveryStrategyName>();
    expectTypeOf<'recordreplay'>().toExtend<DiscoveryStrategyName>();
    expectTypeOf<'registry'>().toExtend<DiscoveryStrategyName>();
  });

  it('rejects internal-only strategies', () => {
    expectTypeOf<'cache'>().not.toExtend<DiscoveryStrategyName>();
  });

  it('rejects invalid values', () => {
    expectTypeOf<'property-match'>().not.toExtend<DiscoveryStrategyName>();
    expectTypeOf<'xpath'>().not.toExtend<DiscoveryStrategyName>();
    expectTypeOf<number>().not.toExtend<DiscoveryStrategyName>();
  });

  it('works as array element type', () => {
    expectTypeOf<DiscoveryStrategyName[]>().toExtend<string[]>();
    expectTypeOf<['direct-id', 'recordreplay']>().toExtend<readonly DiscoveryStrategyName[]>();
  });
});

describe('AuthStrategy', () => {
  it('accepts all valid auth strategies', () => {
    expectTypeOf<'btp-saml'>().toExtend<AuthStrategy>();
    expectTypeOf<'basic'>().toExtend<AuthStrategy>();
    expectTypeOf<'office365'>().toExtend<AuthStrategy>();
    expectTypeOf<'custom'>().toExtend<AuthStrategy>();
  });

  it('rejects invalid auth strategies', () => {
    expectTypeOf<'oauth2'>().not.toExtend<AuthStrategy>();
    expectTypeOf<'kerberos'>().not.toExtend<AuthStrategy>();
  });
});

describe('AIProvider', () => {
  it('accepts all valid AI providers', () => {
    expectTypeOf<'azure-openai'>().toExtend<AIProvider>();
    expectTypeOf<'openai'>().toExtend<AIProvider>();
  });

  it('rejects invalid AI providers', () => {
    expectTypeOf<'anthropic'>().not.toExtend<AIProvider>();
    expectTypeOf<'google'>().not.toExtend<AIProvider>();
  });
});

describe('TelemetryExporter', () => {
  it('accepts all valid telemetry exporters', () => {
    expectTypeOf<'otlp'>().toExtend<TelemetryExporter>();
    expectTypeOf<'azure-monitor'>().toExtend<TelemetryExporter>();
    expectTypeOf<'jaeger'>().toExtend<TelemetryExporter>();
  });

  it('rejects invalid telemetry exporters', () => {
    expectTypeOf<'prometheus'>().not.toExtend<TelemetryExporter>();
    expectTypeOf<'datadog'>().not.toExtend<TelemetryExporter>();
  });
});
