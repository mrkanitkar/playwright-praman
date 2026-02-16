/**
 * Type-level tests for `src/core/types/config.ts`.
 *
 * @remarks
 * These tests verify that literal union types accept valid values and
 * that TypeScript rejects invalid values at compile time. Runtime assertions
 * confirm the types exist and are usable.
 */
import { describe, expectTypeOf, it } from 'vitest';

import type {
  AIProvider,
  AuthStrategy,
  InteractionStrategy,
  LogLevel,
  TelemetryExporter,
} from '#core/types/config.js';

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

describe('InteractionStrategy', () => {
  it('accepts all valid strategies', () => {
    expectTypeOf<'playwright'>().toExtend<InteractionStrategy>();
    expectTypeOf<'dom-first'>().toExtend<InteractionStrategy>();
    expectTypeOf<'opa5'>().toExtend<InteractionStrategy>();
    expectTypeOf<'hybrid'>().toExtend<InteractionStrategy>();
  });

  it('rejects invalid strategies', () => {
    expectTypeOf<'selenium'>().not.toExtend<InteractionStrategy>();
    expectTypeOf<'cypress'>().not.toExtend<InteractionStrategy>();
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
