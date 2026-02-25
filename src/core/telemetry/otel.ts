/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * OpenTelemetry tracer wrapper with lazy loading and NoOp implementation.
 *
 * @remarks
 * Provides a zero-overhead abstraction over OpenTelemetry. When telemetry is
 * disabled (default), all operations are no-ops with no performance impact.
 *
 * Phase 1 implements only the NoOpTracer. Real OTel SDK integration
 * (including exporter-specific validation such as Jaeger endpoint) is
 * deferred to Phase 2 (tracked as M2).
 *
 * @example
 * ```typescript
 * import { initTelemetry } from '#core/telemetry/otel.js';
 *
 * const tracer = await initTelemetry(config);
 * const span = tracer.startSpan('my-operation');
 * span.setAttribute('key', 'value');
 * span.end();
 * ```
 *
 * @module telemetry
 */

import type { PramanConfig } from '#core/config/schema.js';

/**
 * Wrapper around an OpenTelemetry span for instrumented operations.
 *
 * @remarks
 * Provides a simplified API surface that abstracts over the full OTel Span.
 * The NoOp implementation makes all methods safe to call without side effects.
 *
 * @example
 * ```typescript
 * const span = tracer.startSpan('operation');
 * span.setAttribute('ui5.controlType', 'sap.m.Button');
 * span.setStatus('ok');
 * span.end();
 * ```
 */
export interface SpanWrapper {
  /** Ends the span, recording its duration. */
  end(): void;
  /** Sets a key-value attribute on the span. */
  setAttribute(key: string, value: string | number | boolean): void;
  /** Sets the span status to 'ok' or 'error' with optional message. */
  setStatus(code: 'ok' | 'error', message?: string): void;
  /** Adds a timestamped event to the span. */
  addEvent(name: string, attributes?: Record<string, string>): void;
}

/**
 * Wrapper around an OpenTelemetry tracer for creating and managing spans.
 *
 * @remarks
 * All implementations must be safe to call regardless of whether telemetry
 * is enabled. The NoOp implementation provides zero-overhead passthrough.
 *
 * @example
 * ```typescript
 * const tracer = getNoOpTracer();
 * const result = await tracer.withSpan('load-config', async () => {
 *   return loadConfig(raw);
 * });
 * ```
 */
export interface TracerWrapper {
  /** Creates and starts a new span with optional attributes. */
  startSpan(name: string, attributes?: Record<string, string>): SpanWrapper;
  /** Executes an async function within a new span, ending the span on completion. */
  withSpan<T>(name: string, fn: () => Promise<T>): Promise<T>;
  /** Records an exception on the given span. */
  recordException(span: SpanWrapper, error: Error): void;
  /** Shuts down the tracer, flushing any pending data. */
  shutdown(): Promise<void>;
}

/** No-op span: all methods are safe to call but do nothing. */
const NO_OP_SPAN: SpanWrapper = {
  end(): void {
    // No-op: span tracking disabled
  },
  setAttribute(): void {
    // No-op: attribute recording disabled
  },
  setStatus(): void {
    // No-op: status recording disabled
  },
  addEvent(): void {
    // No-op: event recording disabled
  },
};

/**
 * Creates a frozen no-op SpanWrapper.
 *
 * @remarks
 * Returns the same singleton object on every call. All methods are safe
 * no-ops with zero overhead.
 *
 * @returns A SpanWrapper where all methods do nothing
 */
function createNoOpSpan(): SpanWrapper {
  return NO_OP_SPAN;
}

/**
 * Singleton NoOpTracer: all methods are safe to call but do nothing.
 *
 * @remarks
 * Used when telemetry is disabled. `withSpan` executes the function
 * directly, preserving both return values and error propagation.
 */
const NO_OP_TRACER: TracerWrapper = {
  startSpan(): SpanWrapper {
    return createNoOpSpan();
  },
  async withSpan<T>(_name: string, fn: () => Promise<T>): Promise<T> {
    return fn();
  },
  recordException(): void {
    // No-op: exception recording disabled
  },
  async shutdown(): Promise<void> {
    // No-op: nothing to flush
    await Promise.resolve();
  },
};

/**
 * Initializes telemetry based on the provided configuration.
 *
 * @remarks
 * If `config.telemetry?.openTelemetry` is not `true`, returns a NoOpTracer
 * immediately with zero overhead.
 *
 * Phase 1: Always returns NoOpTracer. Real OTel SDK initialization
 * (including exporter-specific validation such as Jaeger endpoint URL)
 * is deferred to Phase 2 (tracked as issue M2).
 *
 * @param config - The validated Praman configuration
 * @returns A TracerWrapper instance (NoOpTracer in Phase 1)
 *
 * @example
 * ```typescript
 * import { initTelemetry } from '#core/telemetry/otel.js';
 * import { PramanConfigSchema } from '#core/config/schema.js';
 *
 * const config = PramanConfigSchema.parse({});
 * const tracer = await initTelemetry(config);
 * ```
 */
export async function initTelemetry(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Phase 2 (M2) will use config for real OTel SDK init
  config: Readonly<PramanConfig>,
): Promise<TracerWrapper> {
  // Phase 1: Always return NoOpTracer regardless of config.
  // Phase 2 (M2): Check config.telemetry?.openTelemetry and initialize real OTel SDK.
  await Promise.resolve();
  return NO_OP_TRACER;
}

/**
 * Returns a shared NoOpTracer instance.
 *
 * @remarks
 * Useful for contexts where configuration is not available or telemetry
 * is known to be disabled. The returned tracer is a singleton.
 *
 * @returns A TracerWrapper that performs no operations
 *
 * @example
 * ```typescript
 * import { getNoOpTracer } from '#core/telemetry/otel.js';
 *
 * const tracer = getNoOpTracer();
 * const span = tracer.startSpan('fallback-operation');
 * span.end();
 * ```
 */
export function getNoOpTracer(): TracerWrapper {
  return NO_OP_TRACER;
}
