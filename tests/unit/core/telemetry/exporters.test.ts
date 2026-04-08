/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/telemetry/exporters.ts`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Hoisted mock function and a holder for the real `requireOTel` reference.
 *
 * `vi.hoisted` ensures these are available when the hoisted `vi.mock` factory
 * executes (before any `const` declarations). `realRequireOTelHolder` captures
 * the genuine function pointer so the default passthrough avoids infinite recursion.
 */
const { mockRequireOTel, realRequireOTelHolder } = vi.hoisted(() => ({
  mockRequireOTel: vi.fn(),
  realRequireOTelHolder: {
    fn: undefined as (<T>(packageName: string) => Promise<T>) | undefined,
  },
}));

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

vi.mock('#core/telemetry/dynamic-loader.js', async (importOriginal) => {
  const original = await importOriginal<Record<string, unknown>>();
  // Capture the real function once to avoid infinite recursion when the mock
  // delegates to it (since the module now exports the mock, not the original).
  realRequireOTelHolder.fn = original['requireOTel'] as typeof realRequireOTelHolder.fn;

  // Default: delegate to the captured real function.
  mockRequireOTel.mockImplementation(async <T>(packageName: string): Promise<T> => {
    if (realRequireOTelHolder.fn === undefined) {
      throw new Error('realRequireOTel not yet captured');
    }
    return realRequireOTelHolder.fn<T>(packageName);
  });
  return {
    ...original,
    requireOTel: mockRequireOTel,
  };
});

import { ErrorCode } from '#core/errors/codes.js';
import { TelemetryError } from '#core/errors/telemetry-error.js';
import { createTraceExporter, createMetricsExporter } from '#core/telemetry/exporters.js';

/** Minimal telemetry config for OTLP tests. */
const otlpConfig = {
  openTelemetry: true as const,
  exporter: 'otlp' as const,
  endpoint: 'http://localhost:4318',
  serviceName: 'test-service',
  protocol: 'http' as const,
  metrics: false,
  batchTimeout: 5_000,
  maxQueueSize: 2_048,
  resourceAttributes: {},
};

/** Minimal telemetry config for Jaeger tests. */
const jaegerConfig = {
  ...otlpConfig,
  exporter: 'jaeger' as const,
};

/** Minimal telemetry config for Azure Monitor tests. */
const azureConfig = {
  ...otlpConfig,
  exporter: 'azure-monitor' as const,
  endpoint: undefined,
  connectionString: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
};

/** OTLP config with endpoint omitted to exercise the `?? ''` fallback. */
const otlpNoEndpointConfig = {
  ...otlpConfig,
  endpoint: undefined,
};

/**
 * Config with an unknown exporter type to exercise the `default` exhaustive
 * check branch at runtime. TypeScript prevents this at compile time, so the
 * cast is necessary.
 */
const unknownExporterConfig = {
  ...otlpConfig,
  exporter: 'unknown-backend' as 'otlp',
};

/** Restores `mockRequireOTel` to its default passthrough implementation. */
function restoreMockPassthrough(): void {
  mockRequireOTel.mockImplementation(async <T>(packageName: string): Promise<T> => {
    if (realRequireOTelHolder.fn === undefined) {
      throw new Error('realRequireOTel not yet captured');
    }
    return realRequireOTelHolder.fn<T>(packageName);
  });
}

// ---------------------------------------------------------------------------
// createTraceExporter
// ---------------------------------------------------------------------------

describe('exporters', () => {
  afterEach(() => {
    mockRequireOTel.mockReset();
    restoreMockPassthrough();
  });

  describe('createTraceExporter', () => {
    it('creates OTLP trace exporter', async () => {
      const exporter = await createTraceExporter(otlpConfig);
      expect(exporter).toBeDefined();
    });

    it('creates Jaeger trace exporter (via OTLP)', async () => {
      const exporter = await createTraceExporter(jaegerConfig);
      expect(exporter).toBeDefined();
    });

    it('throws TelemetryError for Azure Monitor (beta, not installed)', async () => {
      await expect(createTraceExporter(azureConfig)).rejects.toThrow(TelemetryError);
    });

    it('creates OTLP trace exporter with undefined endpoint (fallback to empty string)', async () => {
      const FakeExporter = vi.fn();
      mockRequireOTel.mockResolvedValueOnce({ OTLPTraceExporter: FakeExporter });

      const exporter = await createTraceExporter(otlpNoEndpointConfig);
      expect(exporter).toBeDefined();
      expect(FakeExporter).toHaveBeenCalledWith({ url: '' });
    });

    it('wraps generic Error in TelemetryError for OTLP', async () => {
      mockRequireOTel.mockRejectedValueOnce(new Error('import failed'));

      const error = await createTraceExporter(otlpConfig).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TelemetryError);

      const telError = error as TelemetryError;
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED);
      expect(telError.exporterType).toBe('otlp');
      expect(telError.message).toContain('import failed');
      expect(telError.message).toContain('Failed to create trace exporter');
      expect(telError.cause).toBeInstanceOf(Error);
    });

    it('wraps generic Error in TelemetryError for Jaeger', async () => {
      mockRequireOTel.mockRejectedValueOnce(new Error('jaeger import failed'));

      const error = await createTraceExporter(jaegerConfig).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TelemetryError);

      const telError = error as TelemetryError;
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED);
      expect(telError.exporterType).toBe('jaeger');
      expect(telError.message).toContain('jaeger import failed');
    });

    it('re-throws TelemetryError unchanged', async () => {
      const originalError = new TelemetryError({
        code: ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING,
        message: 'Package not found',
        attempted: 'Import trace exporter',
        packageName: '@opentelemetry/exporter-trace-otlp-http',
      });
      mockRequireOTel.mockRejectedValueOnce(originalError);

      const error = await createTraceExporter(otlpConfig).catch((e: unknown) => e);
      // Must be the exact same instance — not wrapped again
      expect(error).toBe(originalError);
    });

    it('includes suggestions in wrapped error', async () => {
      mockRequireOTel.mockRejectedValueOnce(new Error('module not found'));

      const error = await createTraceExporter(otlpConfig).catch((e: unknown) => e);
      const telError = error as TelemetryError;

      expect(telError.suggestions).toBeDefined();
      expect(telError.suggestions.length).toBeGreaterThanOrEqual(2);
      expect(telError.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Install the exporter package'),
          expect.stringContaining('Verify the endpoint URL'),
        ]),
      );
    });

    it('wraps non-Error thrown value in TelemetryError', async () => {
      mockRequireOTel.mockRejectedValueOnce('string-error');

      const error = await createTraceExporter(otlpConfig).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TelemetryError);

      const telError = error as TelemetryError;
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED);
      expect(telError.message).toContain('string-error');
      // Non-Error values should not set cause
      expect(telError.cause).toBeUndefined();
    });

    it('Azure Monitor trace error includes exporterType and code', async () => {
      const error = await createTraceExporter(azureConfig).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(TelemetryError);
      const telError = error as TelemetryError;
      // requireOTel throws TelemetryError with ERR_TELEMETRY_PEER_DEP_MISSING;
      // the catch block re-throws it unchanged via the `instanceof TelemetryError` path.
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING);
      expect(telError.packageName).toBe('@azure/monitor-opentelemetry-exporter');
    });

    it('Azure Monitor trace error wraps generic Error with exporterType', async () => {
      // Force a generic Error for Azure Monitor path (not a TelemetryError)
      mockRequireOTel.mockRejectedValueOnce(new Error('azure import kaboom'));

      const error = await createTraceExporter(azureConfig).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TelemetryError);

      const telError = error as TelemetryError;
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED);
      expect(telError.exporterType).toBe('azure-monitor');
      expect(telError.message).toContain('azure import kaboom');
      expect(telError.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Install the exporter package for azure-monitor'),
        ]),
      );
    });

    it('creates Azure Monitor trace exporter when package is available', async () => {
      const FakeAzureTraceExporter = vi.fn();
      mockRequireOTel.mockResolvedValueOnce({
        AzureMonitorTraceExporter: FakeAzureTraceExporter,
      });

      const exporter = await createTraceExporter(azureConfig);
      expect(exporter).toBeDefined();
      expect(FakeAzureTraceExporter).toHaveBeenCalledWith({
        connectionString: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });
    });

    it('throws TelemetryError for unknown exporter type (exhaustive default)', async () => {
      const error = await createTraceExporter(unknownExporterConfig).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TelemetryError);

      const telError = error as TelemetryError;
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED);
      expect(telError.message).toContain('Unknown exporter type');
      expect(telError.message).toContain('unknown-backend');
      expect(telError.exporterType).toBe('unknown-backend');
    });

    it('creates Azure Monitor trace exporter with undefined connectionString (fallback to empty string)', async () => {
      const FakeAzureTraceExporter = vi.fn();
      mockRequireOTel.mockResolvedValueOnce({
        AzureMonitorTraceExporter: FakeAzureTraceExporter,
      });

      const azureNoConnStr = {
        ...azureConfig,
        connectionString: undefined,
      };

      const exporter = await createTraceExporter(azureNoConnStr);
      expect(exporter).toBeDefined();
      expect(FakeAzureTraceExporter).toHaveBeenCalledWith({
        connectionString: '',
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createMetricsExporter
  // ---------------------------------------------------------------------------

  describe('createMetricsExporter', () => {
    it('creates OTLP metrics exporter', async () => {
      const exporter = await createMetricsExporter(otlpConfig);
      expect(exporter).toBeDefined();
    });

    it('returns undefined for Jaeger (no metrics support)', async () => {
      const exporter = await createMetricsExporter(jaegerConfig);
      expect(exporter).toBeUndefined();
    });

    it('throws TelemetryError for Azure Monitor (beta, not installed)', async () => {
      await expect(createMetricsExporter(azureConfig)).rejects.toThrow(TelemetryError);
    });

    it('creates OTLP metrics exporter with undefined endpoint (fallback to empty string)', async () => {
      const FakeExporter = vi.fn();
      mockRequireOTel.mockResolvedValueOnce({ OTLPMetricExporter: FakeExporter });

      const exporter = await createMetricsExporter(otlpNoEndpointConfig);
      expect(exporter).toBeDefined();
      expect(FakeExporter).toHaveBeenCalledWith({ url: '' });
    });

    it('wraps generic Error in TelemetryError for OTLP metrics', async () => {
      mockRequireOTel.mockRejectedValueOnce(new Error('metrics import failed'));

      const error = await createMetricsExporter(otlpConfig).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TelemetryError);

      const telError = error as TelemetryError;
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED);
      expect(telError.exporterType).toBe('otlp');
      expect(telError.message).toContain('metrics import failed');
      expect(telError.message).toContain('Failed to create metrics exporter');
      expect(telError.cause).toBeInstanceOf(Error);
    });

    it('re-throws TelemetryError unchanged for metrics', async () => {
      const originalError = new TelemetryError({
        code: ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING,
        message: 'Metrics package not found',
        attempted: 'Import metrics exporter',
        packageName: '@opentelemetry/exporter-metrics-otlp-http',
      });
      mockRequireOTel.mockRejectedValueOnce(originalError);

      const error = await createMetricsExporter(otlpConfig).catch((e: unknown) => e);
      expect(error).toBe(originalError);
    });

    it('includes suggestions in wrapped metrics error', async () => {
      mockRequireOTel.mockRejectedValueOnce(new Error('module not found'));

      const error = await createMetricsExporter(otlpConfig).catch((e: unknown) => e);
      const telError = error as TelemetryError;

      expect(telError.suggestions).toBeDefined();
      expect(telError.suggestions.length).toBeGreaterThanOrEqual(2);
      expect(telError.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Install the exporter package'),
          expect.stringContaining('Verify the endpoint URL'),
        ]),
      );
    });

    it('wraps non-Error thrown value in TelemetryError for metrics', async () => {
      mockRequireOTel.mockRejectedValueOnce(42);

      const error = await createMetricsExporter(otlpConfig).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TelemetryError);

      const telError = error as TelemetryError;
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED);
      expect(telError.message).toContain('42');
      expect(telError.cause).toBeUndefined();
    });

    it('Azure Monitor metrics error includes exporterType and code', async () => {
      const error = await createMetricsExporter(azureConfig).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(TelemetryError);
      const telError = error as TelemetryError;
      // requireOTel throws TelemetryError with ERR_TELEMETRY_PEER_DEP_MISSING;
      // the catch block re-throws it unchanged.
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING);
      expect(telError.packageName).toBe('@azure/monitor-opentelemetry-exporter');
    });

    it('Azure Monitor metrics error wraps generic Error with exporterType', async () => {
      mockRequireOTel.mockRejectedValueOnce(new Error('azure metrics kaboom'));

      const error = await createMetricsExporter(azureConfig).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TelemetryError);

      const telError = error as TelemetryError;
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED);
      expect(telError.exporterType).toBe('azure-monitor');
      expect(telError.message).toContain('azure metrics kaboom');
      expect(telError.suggestions).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Install the exporter package for azure-monitor'),
        ]),
      );
    });

    it('throws TelemetryError for unknown exporter type (exhaustive default)', async () => {
      const error = await createMetricsExporter(unknownExporterConfig).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(TelemetryError);

      const telError = error as TelemetryError;
      expect(telError.code).toBe(ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED);
      expect(telError.message).toContain('Unknown exporter type');
      expect(telError.message).toContain('unknown-backend');
      expect(telError.exporterType).toBe('unknown-backend');
    });

    it('creates Azure Monitor metrics exporter when package is available', async () => {
      const FakeAzureMetricExporter = vi.fn();
      mockRequireOTel.mockResolvedValueOnce({
        AzureMonitorMetricExporter: FakeAzureMetricExporter,
      });

      const exporter = await createMetricsExporter(azureConfig);
      expect(exporter).toBeDefined();
      expect(FakeAzureMetricExporter).toHaveBeenCalledWith({
        connectionString: 'InstrumentationKey=00000000-0000-0000-0000-000000000000',
      });
    });

    it('creates Azure Monitor metrics exporter with undefined connectionString (fallback to empty string)', async () => {
      const FakeAzureMetricExporter = vi.fn();
      mockRequireOTel.mockResolvedValueOnce({
        AzureMonitorMetricExporter: FakeAzureMetricExporter,
      });

      const azureNoConnStr = {
        ...azureConfig,
        connectionString: undefined,
      };

      const exporter = await createMetricsExporter(azureNoConnStr);
      expect(exporter).toBeDefined();
      expect(FakeAzureMetricExporter).toHaveBeenCalledWith({
        connectionString: '',
      });
    });
  });
}); // end describe('exporters')
