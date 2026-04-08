/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Example Praman config with OpenTelemetry tracing and metrics enabled.
 *
 * @remarks
 * Copy this to your project root as `praman.config.ts` and adjust values.
 *
 * Usage:
 * ```bash
 * cp examples/praman.config.telemetry.ts praman.config.ts
 * ```
 *
 * See: https://praman.dev/docs/guides/telemetry
 */

import { defineConfig } from 'playwright-praman';

export default defineConfig({
  logLevel: 'info',
  ui5WaitTimeout: 30_000,
  controlDiscoveryTimeout: 10_000,
  interactionStrategy: 'ui5-native',

  telemetry: {
    // Set to true to enable OpenTelemetry tracing
    openTelemetry: false,

    // OTLP collector endpoint (Jaeger, Grafana Tempo, Honeycomb, etc.)
    endpoint: 'http://localhost:4318',

    // Exporter type: 'otlp' | 'jaeger' | 'azure-monitor'
    exporter: 'otlp',

    // Service name shown in Jaeger/Grafana
    serviceName: 'my-sap-tests',

    // Transport protocol: 'http' | 'grpc'
    protocol: 'http',

    // Set to true to enable metric counters and histograms
    metrics: false,

    // Batch export settings (tune for large suites)
    batchTimeout: 5000,
    maxQueueSize: 2048,

    // Additional OTel resource attributes
    resourceAttributes: {
      'deployment.environment': 'dev',
    },
  },
});
