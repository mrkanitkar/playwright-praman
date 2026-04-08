/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Exporter factory for OpenTelemetry trace and metrics exporters.
 *
 * @remarks
 * Creates the appropriate exporter based on `config.telemetry.exporter`.
 * All OTel types are loaded dynamically — no OTel types leak past this module.
 *
 * API-1: OTLP exporter uses `{ url }`, NOT `{ endpoint }`.
 * API-2: Azure Monitor uses `{ connectionString }`, NOT a URL.
 *
 * @internal
 * @module telemetry
 */

import type * as OtelExporterMetrics from '@opentelemetry/exporter-metrics-otlp-http';
import type * as OtelExporterTrace from '@opentelemetry/exporter-trace-otlp-http';

import { requireOTel } from './dynamic-loader.js';

import type { PramanConfig } from '#core/config/schema.js';
import { ErrorCode } from '#core/errors/codes.js';
import { TelemetryError } from '#core/errors/telemetry-error.js';
import { createLogger } from '#core/logging/index.js';

type TelemetryConfig = NonNullable<PramanConfig['telemetry']>;

/** Azure Monitor exporter module shape (beta package — no published types). */
interface AzureMonitorExporterModule {
  AzureMonitorTraceExporter: new (options: { connectionString?: string }) => unknown;
  AzureMonitorMetricExporter: new (options: { connectionString?: string }) => unknown;
}

/** Lazy logger — created on first use to avoid module-scope side effects in tests. */
function getLog(): ReturnType<typeof createLogger> {
  return createLogger('telemetry:exporters');
}

/**
 * Creates a trace exporter for the configured backend.
 *
 * @param config - The resolved telemetry configuration section
 * @returns An OTel SpanExporter instance (typed as `unknown` to avoid leaking OTel types)
 * @throws TelemetryError if the exporter package is missing or creation fails
 *
 * @example
 * ```typescript
 * const exporter = await createTraceExporter(config.telemetry);
 * ```
 */
export async function createTraceExporter(config: TelemetryConfig): Promise<unknown> {
  try {
    switch (config.exporter) {
      case 'otlp':
      case 'jaeger': {
        // API-1: OTLPTraceExporter constructor takes `url`, NOT `endpoint`
        const { OTLPTraceExporter } = await requireOTel<typeof OtelExporterTrace>(
          '@opentelemetry/exporter-trace-otlp-http',
        );
        getLog().info(
          { exporter: config.exporter, url: config.endpoint },
          'Creating OTLP trace exporter',
        );
        // endpoint is guaranteed present by schema refine when openTelemetry is true
        const endpoint = config.endpoint ?? '';
        return new OTLPTraceExporter({ url: endpoint });
      }
      case 'azure-monitor': {
        // API-2: Azure Monitor uses connectionString, NOT a URL
        const { AzureMonitorTraceExporter } = await requireOTel<AzureMonitorExporterModule>(
          '@azure/monitor-opentelemetry-exporter',
        );
        getLog().info('Creating Azure Monitor trace exporter');
        const connStr = config.connectionString ?? '';
        return new AzureMonitorTraceExporter({
          connectionString: connStr,
        });
      }
      default: {
        // Exhaustive check — TypeScript ensures all enum values are handled
        const exhaustiveCheck: never = config.exporter;
        throw new TelemetryError({
          code: ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED,
          message: `Unknown exporter type: ${String(exhaustiveCheck)}`,
          attempted: 'Create trace exporter',
          exporterType: String(exhaustiveCheck),
        });
      }
    }
  } catch (error: unknown) {
    if (error instanceof TelemetryError) throw error;
    throw new TelemetryError({
      code: ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED,
      message: `Failed to create trace exporter (${config.exporter}): ${error instanceof Error ? error.message : String(error)}`,
      attempted: `Create ${config.exporter} trace exporter`,
      exporterType: config.exporter,
      ...(error instanceof Error ? { cause: error } : {}),
      suggestions: [
        `Install the exporter package for ${config.exporter}`,
        'Verify the endpoint URL or connection string is correct',
      ],
    });
  }
}

/**
 * Creates a metrics exporter for the configured backend.
 *
 * @param config - The resolved telemetry configuration section
 * @returns An OTel MetricExporter instance (typed as `unknown` to avoid leaking OTel types)
 * @throws TelemetryError if the exporter package is missing or creation fails
 *
 * @example
 * ```typescript
 * const exporter = await createMetricsExporter(config.telemetry);
 * ```
 */
export async function createMetricsExporter(config: TelemetryConfig): Promise<unknown> {
  try {
    switch (config.exporter) {
      case 'otlp': {
        const { OTLPMetricExporter } = await requireOTel<typeof OtelExporterMetrics>(
          '@opentelemetry/exporter-metrics-otlp-http',
        );
        const metricEndpoint = config.endpoint ?? '';
        getLog().info({ url: metricEndpoint }, 'Creating OTLP metric exporter');
        return new OTLPMetricExporter({ url: metricEndpoint });
      }
      case 'jaeger': {
        // Jaeger does not support metrics — return undefined
        getLog().info('Jaeger does not support metrics export; metrics will be disabled');
        return undefined;
      }
      case 'azure-monitor': {
        const { AzureMonitorMetricExporter } = await requireOTel<AzureMonitorExporterModule>(
          '@azure/monitor-opentelemetry-exporter',
        );
        getLog().info('Creating Azure Monitor metric exporter');
        const metricConnStr = config.connectionString ?? '';
        return new AzureMonitorMetricExporter({
          connectionString: metricConnStr,
        });
      }
      default: {
        const exhaustiveCheck: never = config.exporter;
        throw new TelemetryError({
          code: ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED,
          message: `Unknown exporter type: ${String(exhaustiveCheck)}`,
          attempted: 'Create metrics exporter',
          exporterType: String(exhaustiveCheck),
        });
      }
    }
  } catch (error: unknown) {
    if (error instanceof TelemetryError) throw error;
    throw new TelemetryError({
      code: ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED,
      message: `Failed to create metrics exporter (${config.exporter}): ${error instanceof Error ? error.message : String(error)}`,
      attempted: `Create ${config.exporter} metrics exporter`,
      exporterType: config.exporter,
      ...(error instanceof Error ? { cause: error } : {}),
      suggestions: [
        `Install the exporter package for ${config.exporter}`,
        'Verify the endpoint URL or connection string is correct',
      ],
    });
  }
}
