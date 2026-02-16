/**
 * Telemetry module — OpenTelemetry wrappers and span utilities.
 *
 * @remarks
 * Re-exports tracer initialization, NoOp implementation, and span helpers.
 * Phase 1 provides only NoOp tracer; real OTel SDK integration is Phase 2.
 *
 * @module telemetry
 */

export { getNoOpTracer, initTelemetry } from './otel.js';
export type { SpanWrapper, TracerWrapper } from './otel.js';
export { createSpanName, spanAttributes } from './spans.js';
