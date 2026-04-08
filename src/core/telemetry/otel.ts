/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * OpenTelemetry tracer and meter wrappers with NoOp fallback.
 *
 * @remarks
 * Provides a zero-overhead abstraction over OpenTelemetry. When telemetry is
 * disabled (default), all operations use NoOp implementations with no
 * performance impact. Real OTel implementations live in `otel-real.ts` and
 * are loaded dynamically when telemetry is enabled.
 *
 * @example
 * ```typescript
 * import { initTelemetry, initMetrics } from '#core/telemetry/otel.js';
 *
 * const tracer = await initTelemetry(config);
 * const meter = await initMetrics(config);
 * const span = tracer.startSpan('my-operation');
 * span.setAttribute('key', 'value');
 * span.end();
 * ```
 *
 * @module telemetry
 */

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
  /** Returns the active OTel trace ID, or `undefined` when telemetry is disabled. */
  getActiveTraceId(): string | undefined;
  /** Shuts down the tracer, flushing any pending data. */
  shutdown(): Promise<void>;
}

/**
 * Counter metric wrapper for recording monotonically increasing values.
 *
 * @remarks
 * Wraps the OTel Counter API. The NoOp implementation is a safe no-op.
 *
 * @example
 * ```typescript
 * const counter = meter.createCounter('praman.test.pass');
 * counter.add(1, { 'test.suite': 'smoke' });
 * ```
 */
export interface MetricCounter {
  /** Adds a value to the counter with optional attributes. */
  add(value: number, attributes?: Record<string, string>): void;
}

/**
 * Histogram metric wrapper for recording value distributions.
 *
 * @remarks
 * Wraps the OTel Histogram API. The NoOp implementation is a safe no-op.
 *
 * @example
 * ```typescript
 * const histogram = meter.createHistogram('praman.control.discovery.duration');
 * histogram.record(42.5, { 'control.type': 'sap.m.Button' });
 * ```
 */
export interface MetricHistogram {
  /** Records a value in the histogram with optional attributes. */
  record(value: number, attributes?: Record<string, string>): void;
}

/**
 * Wrapper around an OpenTelemetry meter for creating metric instruments.
 *
 * @remarks
 * Provides a simplified API surface that abstracts over the full OTel Meter.
 * The NoOp implementation makes all methods safe to call without side effects.
 *
 * @example
 * ```typescript
 * const meter = getNoOpMeter();
 * const counter = meter.createCounter('praman.test.pass', 'Test pass count');
 * counter.add(1);
 * ```
 */
export interface MeterWrapper {
  /** Creates a counter instrument with a name and optional description. */
  createCounter(name: string, description?: string): MetricCounter;
  /** Creates a histogram instrument with a name and optional description. */
  createHistogram(name: string, description?: string): MetricHistogram;
  /** Shuts down the meter, flushing any pending metric data. */
  shutdown(): Promise<void>;
}

/** No-op counter: `add()` does nothing. */
const NO_OP_COUNTER: MetricCounter = {
  add(): void {
    // No-op: counter recording disabled
  },
};

/** No-op histogram: `record()` does nothing. */
const NO_OP_HISTOGRAM: MetricHistogram = {
  record(): void {
    // No-op: histogram recording disabled
  },
};

/**
 * Singleton NoOpMeter: all methods are safe to call but do nothing.
 *
 * @remarks
 * Used when metrics are disabled. All instrument creation returns
 * no-op singletons with zero overhead.
 */
const NO_OP_METER: MeterWrapper = {
  createCounter(): MetricCounter {
    return NO_OP_COUNTER;
  },
  createHistogram(): MetricHistogram {
    return NO_OP_HISTOGRAM;
  },
  async shutdown(): Promise<void> {
    await Promise.resolve();
  },
};

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
  getActiveTraceId(): string | undefined {
    return undefined;
  },
  async shutdown(): Promise<void> {
    // No-op: nothing to flush
    await Promise.resolve();
  },
};

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

/**
 * Returns a shared NoOpMeter instance.
 *
 * @remarks
 * Useful for contexts where configuration is not available or metrics
 * are known to be disabled. The returned meter is a singleton.
 *
 * @returns A MeterWrapper that performs no operations
 *
 * @example
 * ```typescript
 * import { getNoOpMeter } from '#core/telemetry/otel.js';
 *
 * const meter = getNoOpMeter();
 * const counter = meter.createCounter('praman.test.pass');
 * counter.add(1); // no-op
 * ```
 */
export function getNoOpMeter(): MeterWrapper {
  return NO_OP_METER;
}

// Re-export init functions from otel-real.ts (loaded dynamically when telemetry enabled)
export { initTelemetry, initMetrics } from './otel-real.js';
