/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Real OpenTelemetry implementations — loaded only when telemetry is enabled.
 *
 * @remarks
 * Contains the Real wrapper classes (RealSpanWrapper, RealTracerWrapper,
 * RealMeterWrapper) and the `initTelemetry` / `initMetrics` factory functions.
 * OTel SDK types are imported via `import type` (erased at compile time) and
 * packages are loaded dynamically at runtime via `requireOTel`.
 *
 * @internal
 * @module telemetry
 */

import type { Meter, Span, Tracer } from '@opentelemetry/api';
import type * as OtelApi from '@opentelemetry/api';
import type * as OtelResources from '@opentelemetry/resources';
import type * as OtelSdkMetrics from '@opentelemetry/sdk-metrics';
import type { PushMetricExporter } from '@opentelemetry/sdk-metrics';
import type * as OtelSdkNode from '@opentelemetry/sdk-node';
import type { SpanExporter } from '@opentelemetry/sdk-trace-base';

import { requireOTel } from './dynamic-loader.js';
import { createTraceExporter, createMetricsExporter } from './exporters.js';
import type {
  MeterWrapper,
  MetricCounter,
  MetricHistogram,
  SpanWrapper,
  TracerWrapper,
} from './otel.js';
import { getNoOpMeter, getNoOpTracer } from './otel.js';

import type { PramanConfig } from '#core/config/schema.js';
import { ErrorCode } from '#core/errors/codes.js';
import { TelemetryError } from '#core/errors/telemetry-error.js';
import { createLogger } from '#core/logging/index.js';

/** Package name constant for `@opentelemetry/api` (used in multiple requireOTel calls). */
const OTEL_API_PACKAGE = '@opentelemetry/api';

/** Package name constant for `@opentelemetry/resources`. */
const OTEL_RESOURCES_PACKAGE = '@opentelemetry/resources';

/**
 * Adapts a real OTel Span to the SpanWrapper interface.
 *
 * @remarks
 * Private class — not exported. Maps SpanWrapper methods to the
 * `@opentelemetry/api` Span API.
 */
class RealSpanWrapper implements SpanWrapper {
  readonly #span: Span;

  constructor(span: Span) {
    this.#span = span;
  }

  end(): void {
    this.#span.end();
  }

  setAttribute(key: string, value: string | number | boolean): void {
    this.#span.setAttribute(key, value);
  }

  setStatus(code: 'ok' | 'error', message?: string): void {
    const otelCode = code === 'ok' ? 1 : 2; // SpanStatusCode.OK = 1, ERROR = 2
    this.#span.setStatus(message !== undefined ? { code: otelCode, message } : { code: otelCode });
  }

  addEvent(name: string, attributes?: Record<string, string>): void {
    this.#span.addEvent(name, attributes);
  }

  /** Provides access to the underlying OTel span for context propagation. */
  get otelSpan(): Span {
    return this.#span;
  }
}

/**
 * Adapts a real OTel Tracer + NodeSDK to the TracerWrapper interface.
 *
 * @remarks
 * Private class — not exported. Uses `context.with()` for parent-child
 * span nesting in `withSpan()`.
 */
class RealTracerWrapper implements TracerWrapper {
  readonly #tracer: Tracer;
  readonly #sdk: { shutdown(): Promise<void> };
  readonly #otelApi: typeof OtelApi;

  constructor(tracer: Tracer, sdk: { shutdown(): Promise<void> }, otelApi: typeof OtelApi) {
    this.#tracer = tracer;
    this.#sdk = sdk;
    this.#otelApi = otelApi;
  }

  startSpan(name: string, attributes?: Record<string, string>): SpanWrapper {
    const span = this.#tracer.startSpan(name, attributes !== undefined ? { attributes } : {});
    return new RealSpanWrapper(span);
  }

  async withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const span = this.#tracer.startSpan(name);
    const ctx = this.#otelApi.trace.setSpan(this.#otelApi.context.active(), span);
    try {
      const result = await this.#otelApi.context.with(ctx, fn);
      span.setStatus({ code: 1 }); // SpanStatusCode.OK
      return result;
    } catch (error: unknown) {
      span.setStatus({
        code: 2, // SpanStatusCode.ERROR
        message: error instanceof Error ? error.message : String(error),
      });
      if (error instanceof Error) {
        span.recordException(error);
      }
      throw error;
    } finally {
      span.end();
    }
  }

  recordException(span: SpanWrapper, error: Error): void {
    if (span instanceof RealSpanWrapper) {
      span.otelSpan.recordException(error);
    }
  }

  getActiveTraceId(): string | undefined {
    const span = this.#otelApi.trace.getActiveSpan();
    if (span === undefined) return undefined;
    const traceId = span.spanContext().traceId;
    // OTel returns '00000000000000000000000000000000' for invalid/no-op spans
    const invalidTraceId = '00000000000000000000000000000000';
    return traceId === invalidTraceId ? undefined : traceId;
  }

  async shutdown(): Promise<void> {
    try {
      await this.#sdk.shutdown();
    } catch (error: unknown) {
      throw new TelemetryError({
        code: ErrorCode.ERR_TELEMETRY_SHUTDOWN_FAILED,
        message: `OTel SDK shutdown failed: ${error instanceof Error ? error.message : String(error)}`,
        attempted: 'Shutdown OpenTelemetry SDK',
        ...(error instanceof Error ? { cause: error } : {}),
        suggestions: ['Check if there are pending exports that timed out'],
      });
    }
  }
}

/**
 * Initializes telemetry based on the provided configuration.
 *
 * @remarks
 * If `config.telemetry?.openTelemetry` is not `true`, returns a NoOpTracer
 * immediately with zero overhead. When enabled, dynamically loads the OTel SDK
 * and initializes a real tracer with the configured exporter.
 *
 * @param config - The validated Praman configuration
 * @returns A TracerWrapper instance (NoOp when disabled, real OTel when enabled)
 *
 * @example
 * ```typescript
 * import { initTelemetry } from '#core/telemetry/otel.js';
 * import { PramanConfigSchema } from '#core/config/schema.js';
 *
 * const config = PramanConfigSchema.parse({
 *   telemetry: { openTelemetry: true, endpoint: 'http://localhost:4318' },
 * });
 * const tracer = await initTelemetry(config);
 * ```
 */
export async function initTelemetry(config: Readonly<PramanConfig>): Promise<TracerWrapper> {
  if (config.telemetry?.openTelemetry !== true) {
    return getNoOpTracer();
  }

  const telemetryConfig = config.telemetry;
  const log = createLogger('telemetry');

  try {
    const otelApi = await requireOTel<typeof OtelApi>(OTEL_API_PACKAGE);
    const { NodeSDK } = await requireOTel<typeof OtelSdkNode>('@opentelemetry/sdk-node');
    const { resourceFromAttributes } =
      await requireOTel<typeof OtelResources>(OTEL_RESOURCES_PACKAGE);

    const traceExporter = await createTraceExporter(telemetryConfig);

    const resource = resourceFromAttributes({
      'service.name': telemetryConfig.serviceName,
      ...telemetryConfig.resourceAttributes,
    });

    const sdk = new NodeSDK({
      resource,
      traceExporter: traceExporter as SpanExporter,
    });

    // API-3: sdk.start() is synchronous — returns void, do NOT await
    sdk.start();

    const tracer = otelApi.trace.getTracer('playwright-praman', config.telemetry.serviceName);

    log.info(
      { exporter: telemetryConfig.exporter, endpoint: telemetryConfig.endpoint },
      'OpenTelemetry tracing initialized',
    );

    return new RealTracerWrapper(tracer, sdk, otelApi);
  } catch (error: unknown) {
    if (error instanceof TelemetryError) throw error;
    throw new TelemetryError({
      code: ErrorCode.ERR_TELEMETRY_INIT_FAILED,
      message: `Failed to initialize OpenTelemetry: ${error instanceof Error ? error.message : String(error)}`,
      attempted: 'Initialize OTel NodeSDK',
      ...(error instanceof Error ? { cause: error } : {}),
      suggestions: [
        'Install required packages: npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http',
        'Verify telemetry.endpoint URL is valid and reachable',
      ],
    });
  }
}

/**
 * Initializes metrics collection based on the provided configuration.
 *
 * @remarks
 * If `config.telemetry?.metrics` is not `true`, returns a NoOpMeter.
 * When enabled, dynamically loads the OTel metrics SDK and configures
 * periodic metric export.
 *
 * @param config - The validated Praman configuration
 * @returns A MeterWrapper instance (NoOp when disabled, real OTel when enabled)
 *
 * @example
 * ```typescript
 * const meter = await initMetrics(config);
 * const counter = meter.createCounter('praman.test.pass');
 * counter.add(1);
 * ```
 */
export async function initMetrics(config: Readonly<PramanConfig>): Promise<MeterWrapper> {
  if (config.telemetry?.metrics !== true) {
    return getNoOpMeter();
  }

  const telemetryConfig = config.telemetry;
  const log = createLogger('telemetry:metrics');

  try {
    const otelApi = await requireOTel<typeof OtelApi>(OTEL_API_PACKAGE);
    const { MeterProvider, PeriodicExportingMetricReader } = await requireOTel<
      typeof OtelSdkMetrics
    >('@opentelemetry/sdk-metrics');
    const { resourceFromAttributes } =
      await requireOTel<typeof OtelResources>(OTEL_RESOURCES_PACKAGE);

    const metricsExporter = await createMetricsExporter(telemetryConfig);
    if (metricsExporter === undefined) {
      log.info('Metrics exporter not available for this backend; using NoOpMeter');
      return getNoOpMeter();
    }

    const resource = resourceFromAttributes({
      'service.name': telemetryConfig.serviceName,
      ...telemetryConfig.resourceAttributes,
    });

    const metricReader = new PeriodicExportingMetricReader({
      exporter: metricsExporter as PushMetricExporter,
      exportIntervalMillis: telemetryConfig.batchTimeout,
    });

    const meterProvider = new MeterProvider({
      resource,
      readers: [metricReader],
    });

    otelApi.metrics.setGlobalMeterProvider(meterProvider);
    const meter = meterProvider.getMeter('playwright-praman');

    log.info({ exporter: telemetryConfig.exporter }, 'OpenTelemetry metrics initialized');

    return new RealMeterWrapper(meter, meterProvider);
  } catch (error: unknown) {
    if (error instanceof TelemetryError) throw error;
    throw new TelemetryError({
      code: ErrorCode.ERR_TELEMETRY_METRICS_INIT_FAILED,
      message: `Failed to initialize OTel metrics: ${error instanceof Error ? error.message : String(error)}`,
      attempted: 'Initialize OTel metrics SDK',
      ...(error instanceof Error ? { cause: error } : {}),
      suggestions: [
        'Install required packages: npm install @opentelemetry/sdk-metrics @opentelemetry/exporter-metrics-otlp-http',
        'Verify telemetry configuration is correct',
      ],
    });
  }
}

/**
 * Adapts a real OTel Meter + MeterProvider to the MeterWrapper interface.
 *
 * @remarks
 * Private class — not exported. Wraps OTel Counter/Histogram instruments.
 */
class RealMeterWrapper implements MeterWrapper {
  readonly #meter: Meter;
  readonly #provider: { shutdown(): Promise<void> };

  constructor(meter: Meter, provider: { shutdown(): Promise<void> }) {
    this.#meter = meter;
    this.#provider = provider;
  }

  createCounter(name: string, description?: string): MetricCounter {
    const counter = this.#meter.createCounter(
      name,
      description !== undefined ? { description } : {},
    );
    return {
      add(value: number, attributes?: Record<string, string>): void {
        counter.add(value, attributes);
      },
    };
  }

  createHistogram(name: string, description?: string): MetricHistogram {
    const histogram = this.#meter.createHistogram(
      name,
      description !== undefined ? { description } : {},
    );
    return {
      record(value: number, attributes?: Record<string, string>): void {
        histogram.record(value, attributes);
      },
    };
  }

  async shutdown(): Promise<void> {
    try {
      await this.#provider.shutdown();
    } catch (error: unknown) {
      throw new TelemetryError({
        code: ErrorCode.ERR_TELEMETRY_SHUTDOWN_FAILED,
        message: `OTel metrics shutdown failed: ${error instanceof Error ? error.message : String(error)}`,
        attempted: 'Shutdown OpenTelemetry metrics',
        ...(error instanceof Error ? { cause: error } : {}),
        suggestions: ['Check if there are pending metric exports that timed out'],
      });
    }
  }
}
