/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Example Praman config with Azure Monitor telemetry.
 *
 * @remarks
 * Copy this to your project root as `praman.config.ts` and set the
 * `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable.
 *
 * Find your connection string in:
 * Azure Portal → Application Insights → your resource → Properties → Connection String
 *
 * Usage:
 * ```bash
 * cp examples/praman.config.azure-monitor.ts praman.config.ts
 * ```
 *
 * See: https://praman.dev/docs/guides/telemetry#azure-monitor
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
    exporter: 'azure-monitor',

    // Read connection string from environment (do NOT hardcode secrets)
    connectionString: process.env['APPLICATIONINSIGHTS_CONNECTION_STRING'],

    serviceName: 'my-sap-tests',

    // Set to true to enable metric counters and histograms
    metrics: false,
  },
});
