/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Telemetry module — OpenTelemetry wrappers, metrics, and span utilities.
 *
 * @remarks
 * Re-exports tracer/meter initialization, NoOp implementations, and span helpers.
 * When `openTelemetry: true`, the real OTel SDK is dynamically loaded.
 * When disabled (default), all operations use zero-overhead NoOp implementations.
 *
 * @module telemetry
 */

export { getNoOpMeter, getNoOpTracer, initMetrics, initTelemetry } from './otel.js';
export type {
  MeterWrapper,
  MetricCounter,
  MetricHistogram,
  SpanWrapper,
  TracerWrapper,
} from './otel.js';
export { createSpanName, spanAttributes } from './spans.js';
