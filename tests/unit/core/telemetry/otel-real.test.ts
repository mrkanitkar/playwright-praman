/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/telemetry/otel-real.ts` — Real OpenTelemetry implementations.
 *
 * @remarks
 * Verifies RealSpanWrapper, RealTracerWrapper, RealMeterWrapper, initTelemetry,
 * and initMetrics with fully mocked OTel SDK dependencies. All OTel packages are
 * mocked via the `requireOTel` dynamic loader to avoid actual SDK initialization.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PramanConfig } from '#core/config/schema.js';
import { PramanConfigSchema } from '#core/config/schema.js';
import { ErrorCode } from '#core/errors/codes.js';
import { TelemetryError } from '#core/errors/telemetry-error.js';
import { requireOTel } from '#core/telemetry/dynamic-loader.js';
import { createTraceExporter, createMetricsExporter } from '#core/telemetry/exporters.js';
import { initTelemetry, initMetrics } from '#core/telemetry/otel-real.js';
import type { MeterWrapper, SpanWrapper, TracerWrapper } from '#core/telemetry/otel.js';
// ── Logger mock ─────────────────────────────────────────────────────────────
vi.mock('#core/logging/index.js', () => ({
  createLogger: vi.fn(() => ({
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  })),
  createRootLogger: vi.fn(),
  resetDefaultLogger: vi.fn(),
}));

// ── Mock OTel objects ───────────────────────────────────────────────────────
const mockSpan = {
  end: vi.fn(),
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  addEvent: vi.fn(),
  recordException: vi.fn(),
  spanContext: vi.fn().mockReturnValue({ traceId: 'abc123def456abc123def456abc123de' }),
};

const mockTracer = {
  startSpan: vi.fn().mockReturnValue(mockSpan),
};

const mockOtelApi = {
  trace: {
    getTracer: vi.fn().mockReturnValue(mockTracer),
    setSpan: vi.fn().mockReturnValue('mock-context'),
    getActiveSpan: vi.fn().mockReturnValue(undefined),
  },
  context: {
    active: vi.fn().mockReturnValue('active-context'),
    with: vi.fn().mockImplementation((_ctx: unknown, fn: () => unknown) => fn()),
  },
  metrics: {
    setGlobalMeterProvider: vi.fn(),
  },
};

const mockSdkInstance = {
  start: vi.fn(),
  shutdown: vi.fn().mockResolvedValue(undefined),
};

// Must use function() (not arrow) so it's valid as a constructor with `new`
const mockNodeSDK = vi.fn().mockImplementation(function () {
  return mockSdkInstance;
});

const mockResourceFromAttributes = vi.fn().mockReturnValue({ attributes: {} });

const mockCounter = {
  add: vi.fn(),
};

const mockHistogram = {
  record: vi.fn(),
};

const mockMeter = {
  createCounter: vi.fn().mockReturnValue(mockCounter),
  createHistogram: vi.fn().mockReturnValue(mockHistogram),
};

const mockMeterProviderInstance = {
  getMeter: vi.fn().mockReturnValue(mockMeter),
  shutdown: vi.fn().mockResolvedValue(undefined),
};

const mockMeterProvider = vi.fn().mockImplementation(function () {
  return mockMeterProviderInstance;
});
const mockPeriodicExportingMetricReader = vi.fn().mockImplementation(function () {
  return {};
});

const mockTraceExporter = { export: vi.fn(), shutdown: vi.fn() };
const mockMetricsExporter = { export: vi.fn(), shutdown: vi.fn() };

// ── Mock dynamic-loader ─────────────────────────────────────────────────────
vi.mock('#core/telemetry/dynamic-loader.js', () => ({
  requireOTel: vi.fn(),
}));

// ── Mock exporters ──────────────────────────────────────────────────────────
vi.mock('#core/telemetry/exporters.js', () => ({
  createTraceExporter: vi.fn(),
  createMetricsExporter: vi.fn(),
}));

// ── Typed mock references (vi.mock is hoisted, so imports above resolve mocked modules) ──

const mockRequireOTel = vi.mocked(requireOTel);
const mockCreateTraceExporter = vi.mocked(createTraceExporter);
const mockCreateMetricsExporter = vi.mocked(createMetricsExporter);

// ── Helper: build enabled telemetry config ──────────────────────────────────
function buildTelemetryEnabledConfig(
  overrides?: Partial<{ metrics: boolean; exporter: string }>,
): PramanConfig {
  return PramanConfigSchema.parse({
    telemetry: {
      openTelemetry: true,
      exporter: overrides?.exporter ?? 'otlp',
      endpoint: 'http://localhost:4318',
      metrics: overrides?.metrics ?? false,
    },
  });
}

function buildDisabledConfig(): PramanConfig {
  return PramanConfigSchema.parse({
    telemetry: { openTelemetry: false },
  });
}

function buildMetricsEnabledConfig(): PramanConfig {
  return PramanConfigSchema.parse({
    telemetry: {
      openTelemetry: true,
      metrics: true,
      exporter: 'otlp',
      endpoint: 'http://localhost:4318',
    },
  });
}

// ── Setup mock return values ────────────────────────────────────────────────
function setupRequireOTelMocks(): void {
  mockRequireOTel.mockImplementation(async (packageName: string) => {
    await Promise.resolve();
    switch (packageName) {
      case '@opentelemetry/api':
        return mockOtelApi;
      case '@opentelemetry/sdk-node':
        return { NodeSDK: mockNodeSDK };
      case '@opentelemetry/resources':
        return { resourceFromAttributes: mockResourceFromAttributes };
      case '@opentelemetry/sdk-metrics':
        return {
          MeterProvider: mockMeterProvider,
          PeriodicExportingMetricReader: mockPeriodicExportingMetricReader,
        };
      default:
        throw new Error(`Unexpected package: ${packageName}`);
    }
  });
}

// ── Reset all mocks ─────────────────────────────────────────────────────────
describe('otel-real', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Restore default mock implementations
    mockSpan.spanContext.mockReturnValue({ traceId: 'abc123def456abc123def456abc123de' });
    mockTracer.startSpan.mockReturnValue(mockSpan);
    mockOtelApi.trace.getTracer.mockReturnValue(mockTracer);
    mockOtelApi.trace.setSpan.mockReturnValue('mock-context');
    mockOtelApi.trace.getActiveSpan.mockReturnValue(undefined);
    mockOtelApi.context.active.mockReturnValue('active-context');
    mockOtelApi.context.with.mockImplementation((_ctx: unknown, fn: () => unknown) => fn());
    mockSdkInstance.shutdown.mockResolvedValue(undefined);
    mockMeterProviderInstance.shutdown.mockResolvedValue(undefined);
    mockMeterProviderInstance.getMeter.mockReturnValue(mockMeter);
    mockMeter.createCounter.mockReturnValue(mockCounter);
    mockMeter.createHistogram.mockReturnValue(mockHistogram);
    mockCreateTraceExporter.mockResolvedValue(mockTraceExporter);
    mockCreateMetricsExporter.mockResolvedValue(mockMetricsExporter);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // initTelemetry
  // ═══════════════════════════════════════════════════════════════════════════

  describe('initTelemetry', () => {
    it('returns NoOpTracer when openTelemetry is not true', async () => {
      const config = buildDisabledConfig();
      const tracer = await initTelemetry(config);

      expect(typeof tracer.startSpan).toBe('function');
      expect(typeof tracer.withSpan).toBe('function');
      expect(typeof tracer.recordException).toBe('function');
      expect(typeof tracer.shutdown).toBe('function');
      expect(typeof tracer.getActiveTraceId).toBe('function');

      // Should NOT have called requireOTel — no SDK loading
      expect(mockRequireOTel).not.toHaveBeenCalled();
    });

    it('returns NoOpTracer when telemetry section is absent', async () => {
      const config = PramanConfigSchema.parse({});
      const tracer = await initTelemetry(config);

      expect(typeof tracer.startSpan).toBe('function');
      expect(mockRequireOTel).not.toHaveBeenCalled();
    });

    it('returns a real TracerWrapper when enabled', async () => {
      setupRequireOTelMocks();
      const config = buildTelemetryEnabledConfig();

      const tracer = await initTelemetry(config);

      // Should have loaded OTel packages
      expect(mockRequireOTel).toHaveBeenCalledWith('@opentelemetry/api');
      expect(mockRequireOTel).toHaveBeenCalledWith('@opentelemetry/sdk-node');
      expect(mockRequireOTel).toHaveBeenCalledWith('@opentelemetry/resources');

      // Should have created trace exporter
      expect(mockCreateTraceExporter).toHaveBeenCalled();

      // Should have started the SDK
      expect(mockSdkInstance.start).toHaveBeenCalledOnce();

      // Should have created a tracer
      expect(mockOtelApi.trace.getTracer).toHaveBeenCalledWith(
        'playwright-praman',
        expect.any(String),
      );

      // The returned tracer should be a RealTracerWrapper with real methods
      expect(typeof tracer.startSpan).toBe('function');
      expect(typeof tracer.withSpan).toBe('function');
      expect(typeof tracer.recordException).toBe('function');
      expect(typeof tracer.getActiveTraceId).toBe('function');
      expect(typeof tracer.shutdown).toBe('function');
    });

    it('passes resource attributes to resourceFromAttributes', async () => {
      setupRequireOTelMocks();
      const config = PramanConfigSchema.parse({
        telemetry: {
          openTelemetry: true,
          exporter: 'otlp',
          endpoint: 'http://localhost:4318',
          resourceAttributes: { 'deployment.environment': 'test' },
        },
      });

      await initTelemetry(config);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.any() returns any */
      expect(mockResourceFromAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          'service.name': expect.any(String),
          'deployment.environment': 'test',
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('rethrows TelemetryError from inner code', async () => {
      const telemetryError = new TelemetryError({
        code: ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING,
        message: 'Missing peer dep',
        attempted: 'Load OTel SDK',
        suggestions: ['Install packages'],
      });

      mockRequireOTel.mockRejectedValue(telemetryError);
      const config = buildTelemetryEnabledConfig();

      await expect(initTelemetry(config)).rejects.toThrow(telemetryError);
      await expect(initTelemetry(config)).rejects.toThrow(TelemetryError);
    });

    it('wraps non-TelemetryError in ERR_TELEMETRY_INIT_FAILED', async () => {
      mockRequireOTel.mockRejectedValue(new Error('unexpected failure'));
      const config = buildTelemetryEnabledConfig();

      await expect(initTelemetry(config)).rejects.toThrow(TelemetryError);

      try {
        await initTelemetry(config);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(TelemetryError);
        const telError = error as TelemetryError;
        expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_INIT_FAILED);
        expect(telError.message).toContain('unexpected failure');
        expect(telError.attempted).toBe('Initialize OTel NodeSDK');
      }
    });

    it('wraps non-Error thrown value in ERR_TELEMETRY_INIT_FAILED', async () => {
      mockRequireOTel.mockRejectedValue('string error');
      const config = buildTelemetryEnabledConfig();

      try {
        await initTelemetry(config);
        expect.unreachable('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(TelemetryError);
        const telError = error as TelemetryError;
        expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_INIT_FAILED);
        expect(telError.message).toContain('string error');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RealTracerWrapper (accessed via initTelemetry)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('RealTracerWrapper', () => {
    async function createRealTracer(): Promise<TracerWrapper> {
      setupRequireOTelMocks();
      const config = buildTelemetryEnabledConfig();
      return initTelemetry(config);
    }

    describe('startSpan', () => {
      it('creates a span with the given name', async () => {
        const tracer = await createRealTracer();

        const span = tracer.startSpan('test-operation');

        expect(mockTracer.startSpan).toHaveBeenCalledWith('test-operation', {});
        expect(span).toBeDefined();
      });

      it('creates a span with attributes', async () => {
        const tracer = await createRealTracer();

        const span = tracer.startSpan('test-op', { 'ui5.control': 'sap.m.Button' });

        expect(mockTracer.startSpan).toHaveBeenCalledWith('test-op', {
          attributes: { 'ui5.control': 'sap.m.Button' },
        });
        expect(span).toBeDefined();
      });
    });

    describe('withSpan', () => {
      it('succeeds and sets OK status', async () => {
        const tracer = await createRealTracer();

        const result = await tracer.withSpan('test-span', async () => Promise.resolve(42));

        expect(result).toBe(42);
        expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1 });
        expect(mockSpan.end).toHaveBeenCalledOnce();
      });

      it('sets span context with parent context', async () => {
        const tracer = await createRealTracer();

        await tracer.withSpan('nested-span', async () => Promise.resolve('ok'));

        expect(mockOtelApi.context.active).toHaveBeenCalled();
        expect(mockOtelApi.trace.setSpan).toHaveBeenCalledWith('active-context', mockSpan);
        expect(mockOtelApi.context.with).toHaveBeenCalledWith('mock-context', expect.any(Function));
      });

      it('catches errors, sets ERROR status, records exception, re-throws', async () => {
        const tracer = await createRealTracer();
        const testError = new Error('test-failure');

        await expect(
          tracer.withSpan('error-span', async () => Promise.reject(testError)),
        ).rejects.toThrow('test-failure');

        expect(mockSpan.setStatus).toHaveBeenCalledWith({
          code: 2,
          message: 'test-failure',
        });
        expect(mockSpan.recordException).toHaveBeenCalledWith(testError);
        expect(mockSpan.end).toHaveBeenCalledOnce();
      });

      it('handles non-Error thrown values in withSpan', async () => {
        const tracer = await createRealTracer();

        await expect(
          // eslint-disable-next-line @typescript-eslint/require-await -- intentionally testing synchronous throw inside async callback
          tracer.withSpan('error-span', async () => {
            // eslint-disable-next-line no-throw-literal, @typescript-eslint/only-throw-error -- intentionally testing non-Error thrown value
            throw 'string-error';
          }),
        ).rejects.toBe('string-error');

        expect(mockSpan.setStatus).toHaveBeenCalledWith({
          code: 2,
          message: 'string-error',
        });
        // recordException should NOT be called for non-Error values
        expect(mockSpan.recordException).not.toHaveBeenCalled();
        expect(mockSpan.end).toHaveBeenCalledOnce();
      });

      it('always ends the span even on error', async () => {
        const tracer = await createRealTracer();

        await expect(
          // eslint-disable-next-line @typescript-eslint/require-await -- intentionally testing synchronous throw inside async callback
          tracer.withSpan('fail-span', async () => {
            throw new Error('boom');
          }),
        ).rejects.toThrow('boom');

        expect(mockSpan.end).toHaveBeenCalledOnce();
      });
    });

    describe('recordException', () => {
      it('delegates to the underlying OTel span', async () => {
        const tracer = await createRealTracer();
        const span = tracer.startSpan('test-span');
        const error = new Error('recorded-error');

        tracer.recordException(span, error);

        expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      });

      it('does nothing when span is not a RealSpanWrapper', async () => {
        const tracer = await createRealTracer();
        // Create a fake non-RealSpanWrapper span (e.g., NoOp)
        const fakeSpan = {
          end: vi.fn(),
          setAttribute: vi.fn(),
          setStatus: vi.fn(),
          addEvent: vi.fn(),
        };
        const error = new Error('should-not-delegate');

        // Should not throw, and should not call mockSpan.recordException
        mockSpan.recordException.mockClear();
        tracer.recordException(fakeSpan, error);

        expect(mockSpan.recordException).not.toHaveBeenCalled();
      });
    });

    describe('getActiveTraceId', () => {
      it('returns undefined when no active span', async () => {
        const tracer = await createRealTracer();
        mockOtelApi.trace.getActiveSpan.mockReturnValue(undefined);

        const traceId = tracer.getActiveTraceId();

        expect(traceId).toBeUndefined();
      });

      it('returns undefined for invalid traceId (all zeros)', async () => {
        const tracer = await createRealTracer();
        const invalidSpan = {
          spanContext: vi.fn().mockReturnValue({
            traceId: '00000000000000000000000000000000',
          }),
        };
        mockOtelApi.trace.getActiveSpan.mockReturnValue(invalidSpan);

        const traceId = tracer.getActiveTraceId();

        expect(traceId).toBeUndefined();
      });

      it('returns real traceId from active span', async () => {
        const tracer = await createRealTracer();
        const validSpan = {
          spanContext: vi.fn().mockReturnValue({
            traceId: 'abc123def456abc123def456abc123de',
          }),
        };
        mockOtelApi.trace.getActiveSpan.mockReturnValue(validSpan);

        const traceId = tracer.getActiveTraceId();

        expect(traceId).toBe('abc123def456abc123def456abc123de');
      });
    });

    describe('shutdown', () => {
      it('delegates to sdk.shutdown()', async () => {
        const tracer = await createRealTracer();

        await tracer.shutdown();

        expect(mockSdkInstance.shutdown).toHaveBeenCalledOnce();
      });

      it('wraps errors in TelemetryError with ERR_TELEMETRY_SHUTDOWN_FAILED', async () => {
        const tracer = await createRealTracer();
        const shutdownError = new Error('shutdown timeout');
        mockSdkInstance.shutdown.mockRejectedValue(shutdownError);

        try {
          await tracer.shutdown();
          expect.unreachable('Should have thrown');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(TelemetryError);
          const telError = error as TelemetryError;
          expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_SHUTDOWN_FAILED);
          expect(telError.message).toContain('shutdown timeout');
          expect(telError.attempted).toBe('Shutdown OpenTelemetry SDK');
          expect(telError.cause).toBe(shutdownError);
        }
      });

      it('wraps non-Error shutdown failure in TelemetryError', async () => {
        const tracer = await createRealTracer();
        mockSdkInstance.shutdown.mockRejectedValue('string-failure');

        try {
          await tracer.shutdown();
          expect.unreachable('Should have thrown');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(TelemetryError);
          const telError = error as TelemetryError;
          expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_SHUTDOWN_FAILED);
          expect(telError.message).toContain('string-failure');
          // Non-Error values should not set cause
          expect(telError.cause).toBeUndefined();
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RealSpanWrapper (accessed via RealTracerWrapper.startSpan)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('RealSpanWrapper', () => {
    async function createRealSpan(): Promise<SpanWrapper> {
      setupRequireOTelMocks();
      const config = buildTelemetryEnabledConfig();
      const tracer = await initTelemetry(config);
      return tracer.startSpan('wrapper-test-span');
    }

    it('end() delegates to the real span', async () => {
      const span = await createRealSpan();

      span.end();

      expect(mockSpan.end).toHaveBeenCalledOnce();
    });

    it('setAttribute() delegates to the real span', async () => {
      const span = await createRealSpan();

      span.setAttribute('key', 'value');

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('key', 'value');
    });

    it('setAttribute() supports numeric values', async () => {
      const span = await createRealSpan();

      span.setAttribute('duration', 1500);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('duration', 1500);
    });

    it('setAttribute() supports boolean values', async () => {
      const span = await createRealSpan();

      span.setAttribute('success', true);

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('success', true);
    });

    it('setStatus("ok") sets SpanStatusCode.OK (1)', async () => {
      const span = await createRealSpan();

      span.setStatus('ok');

      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1 });
    });

    it('setStatus("ok", message) sets SpanStatusCode.OK with message', async () => {
      const span = await createRealSpan();

      span.setStatus('ok', 'completed');

      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 1, message: 'completed' });
    });

    it('setStatus("error") sets SpanStatusCode.ERROR (2)', async () => {
      const span = await createRealSpan();

      span.setStatus('error');

      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: 2 });
    });

    it('setStatus("error", message) sets SpanStatusCode.ERROR with message', async () => {
      const span = await createRealSpan();

      span.setStatus('error', 'something failed');

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: 2,
        message: 'something failed',
      });
    });

    it('addEvent() delegates to the real span', async () => {
      const span = await createRealSpan();

      span.addEvent('ui5.stable');

      expect(mockSpan.addEvent).toHaveBeenCalledWith('ui5.stable', undefined);
    });

    it('addEvent() with attributes delegates correctly', async () => {
      const span = await createRealSpan();
      const attrs = { 'control.type': 'sap.m.Button' };

      span.addEvent('control.found', attrs);

      expect(mockSpan.addEvent).toHaveBeenCalledWith('control.found', attrs);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // initMetrics
  // ═══════════════════════════════════════════════════════════════════════════

  describe('initMetrics', () => {
    it('returns NoOpMeter when metrics is not true', async () => {
      const config = buildDisabledConfig();
      const meter = await initMetrics(config);

      expect(typeof meter.createCounter).toBe('function');
      expect(typeof meter.createHistogram).toBe('function');
      expect(typeof meter.shutdown).toBe('function');
      expect(mockRequireOTel).not.toHaveBeenCalled();
    });

    it('returns NoOpMeter when telemetry section is absent', async () => {
      const config = PramanConfigSchema.parse({});
      const meter = await initMetrics(config);

      expect(typeof meter.createCounter).toBe('function');
      expect(mockRequireOTel).not.toHaveBeenCalled();
    });

    it('returns NoOpMeter when openTelemetry is true but metrics is false', async () => {
      const config = buildTelemetryEnabledConfig({ metrics: false });
      const meter = await initMetrics(config);

      expect(typeof meter.createCounter).toBe('function');
      expect(mockRequireOTel).not.toHaveBeenCalled();
    });

    it('returns a real MeterWrapper when enabled', async () => {
      setupRequireOTelMocks();
      const config = buildMetricsEnabledConfig();

      const meter = await initMetrics(config);

      // Should have loaded OTel packages
      expect(mockRequireOTel).toHaveBeenCalledWith('@opentelemetry/api');
      expect(mockRequireOTel).toHaveBeenCalledWith('@opentelemetry/sdk-metrics');
      expect(mockRequireOTel).toHaveBeenCalledWith('@opentelemetry/resources');

      // Should have created metrics exporter
      expect(mockCreateMetricsExporter).toHaveBeenCalled();

      // Should have set global meter provider
      expect(mockOtelApi.metrics.setGlobalMeterProvider).toHaveBeenCalledWith(
        mockMeterProviderInstance,
      );

      // Returned meter should be a real MeterWrapper
      expect(typeof meter.createCounter).toBe('function');
      expect(typeof meter.createHistogram).toBe('function');
      expect(typeof meter.shutdown).toBe('function');
    });

    it('returns NoOpMeter when metricsExporter is undefined (e.g., Jaeger)', async () => {
      setupRequireOTelMocks();
      mockCreateMetricsExporter.mockResolvedValue(undefined);
      const config = buildMetricsEnabledConfig();

      const meter = await initMetrics(config);

      // Should still be a valid MeterWrapper (NoOp)
      expect(typeof meter.createCounter).toBe('function');
      expect(typeof meter.createHistogram).toBe('function');
      expect(typeof meter.shutdown).toBe('function');

      // Should NOT have created a MeterProvider
      expect(mockMeterProvider).not.toHaveBeenCalled();
    });

    it('passes resource attributes to resourceFromAttributes', async () => {
      setupRequireOTelMocks();
      const config = PramanConfigSchema.parse({
        telemetry: {
          openTelemetry: true,
          metrics: true,
          exporter: 'otlp',
          endpoint: 'http://localhost:4318',
          resourceAttributes: { 'deployment.environment': 'staging' },
        },
      });

      await initMetrics(config);

      /* eslint-disable @typescript-eslint/no-unsafe-assignment -- expect.any() returns any */
      expect(mockResourceFromAttributes).toHaveBeenCalledWith(
        expect.objectContaining({
          'service.name': expect.any(String),
          'deployment.environment': 'staging',
        }),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-assignment */
    });

    it('rethrows TelemetryError from inner code', async () => {
      const telemetryError = new TelemetryError({
        code: ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING,
        message: 'Missing metrics peer dep',
        attempted: 'Load OTel metrics SDK',
        suggestions: ['Install packages'],
      });

      mockRequireOTel.mockRejectedValue(telemetryError);
      const config = buildMetricsEnabledConfig();

      await expect(initMetrics(config)).rejects.toThrow(telemetryError);
      await expect(initMetrics(config)).rejects.toThrow(TelemetryError);
    });

    it('wraps non-TelemetryError in ERR_TELEMETRY_METRICS_INIT_FAILED', async () => {
      mockRequireOTel.mockRejectedValue(new Error('metrics init boom'));
      const config = buildMetricsEnabledConfig();

      try {
        await initMetrics(config);
        expect.unreachable('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(TelemetryError);
        const telError = error as TelemetryError;
        expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_METRICS_INIT_FAILED);
        expect(telError.message).toContain('metrics init boom');
        expect(telError.attempted).toBe('Initialize OTel metrics SDK');
      }
    });

    it('wraps non-Error thrown value in ERR_TELEMETRY_METRICS_INIT_FAILED', async () => {
      mockRequireOTel.mockRejectedValue('string metrics error');
      const config = buildMetricsEnabledConfig();

      try {
        await initMetrics(config);
        expect.unreachable('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(TelemetryError);
        const telError = error as TelemetryError;
        expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_METRICS_INIT_FAILED);
        expect(telError.message).toContain('string metrics error');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RealMeterWrapper (accessed via initMetrics)
  // ═══════════════════════════════════════════════════════════════════════════

  describe('RealMeterWrapper', () => {
    async function createRealMeter(): Promise<MeterWrapper> {
      setupRequireOTelMocks();
      const config = buildMetricsEnabledConfig();
      return initMetrics(config);
    }

    describe('createCounter', () => {
      it('creates a counter and delegates add()', async () => {
        const meter = await createRealMeter();

        const counter = meter.createCounter('praman.test.pass');
        counter.add(1);

        expect(mockMeter.createCounter).toHaveBeenCalledWith('praman.test.pass', {});
        expect(mockCounter.add).toHaveBeenCalledWith(1, undefined);
      });

      it('creates a counter with description', async () => {
        const meter = await createRealMeter();

        meter.createCounter('praman.test.count', 'Test pass counter');

        expect(mockMeter.createCounter).toHaveBeenCalledWith('praman.test.count', {
          description: 'Test pass counter',
        });
      });

      it('passes attributes to counter.add()', async () => {
        const meter = await createRealMeter();

        const counter = meter.createCounter('praman.spans');
        counter.add(5, { 'test.suite': 'smoke' });

        expect(mockCounter.add).toHaveBeenCalledWith(5, { 'test.suite': 'smoke' });
      });
    });

    describe('createHistogram', () => {
      it('creates a histogram and delegates record()', async () => {
        const meter = await createRealMeter();

        const histogram = meter.createHistogram('praman.duration');
        histogram.record(42.5);

        expect(mockMeter.createHistogram).toHaveBeenCalledWith('praman.duration', {});
        expect(mockHistogram.record).toHaveBeenCalledWith(42.5, undefined);
      });

      it('creates a histogram with description', async () => {
        const meter = await createRealMeter();

        meter.createHistogram('praman.latency', 'Control discovery latency');

        expect(mockMeter.createHistogram).toHaveBeenCalledWith('praman.latency', {
          description: 'Control discovery latency',
        });
      });

      it('passes attributes to histogram.record()', async () => {
        const meter = await createRealMeter();

        const histogram = meter.createHistogram('praman.time');
        histogram.record(100, { unit: 'ms' });

        expect(mockHistogram.record).toHaveBeenCalledWith(100, { unit: 'ms' });
      });
    });

    describe('shutdown', () => {
      it('delegates to provider.shutdown()', async () => {
        const meter = await createRealMeter();

        await meter.shutdown();

        expect(mockMeterProviderInstance.shutdown).toHaveBeenCalledOnce();
      });

      it('wraps errors in TelemetryError with ERR_TELEMETRY_SHUTDOWN_FAILED', async () => {
        const meter = await createRealMeter();
        const shutdownError = new Error('metrics shutdown timeout');
        mockMeterProviderInstance.shutdown.mockRejectedValue(shutdownError);

        try {
          await meter.shutdown();
          expect.unreachable('Should have thrown');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(TelemetryError);
          const telError = error as TelemetryError;
          expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_SHUTDOWN_FAILED);
          expect(telError.message).toContain('metrics shutdown timeout');
          expect(telError.attempted).toBe('Shutdown OpenTelemetry metrics');
          expect(telError.cause).toBe(shutdownError);
        }
      });

      it('wraps non-Error shutdown failure in TelemetryError', async () => {
        const meter = await createRealMeter();
        mockMeterProviderInstance.shutdown.mockRejectedValue('shutdown string error');

        try {
          await meter.shutdown();
          expect.unreachable('Should have thrown');
        } catch (error: unknown) {
          expect(error).toBeInstanceOf(TelemetryError);
          const telError = error as TelemetryError;
          expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_SHUTDOWN_FAILED);
          expect(telError.message).toContain('shutdown string error');
          expect(telError.cause).toBeUndefined();
        }
      });
    });
  });
}); // describe('otel-real')
