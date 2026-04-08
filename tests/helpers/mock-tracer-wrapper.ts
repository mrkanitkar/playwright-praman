/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Mock `TracerWrapper` for telemetry unit tests.
 *
 * @remarks
 * Records all spans, attributes, events, and exceptions so tests can make
 * assertions against telemetry behavior without running a real OTel backend.
 * Implements the {@link TracerWrapper} and {@link SpanWrapper} interfaces from
 * `src/core/telemetry/otel.ts`.
 *
 * @example
 * ```typescript
 * import { createMockTracer } from '../../helpers/mock-tracer-wrapper.js';
 *
 * const { tracer, spans, exceptions } = createMockTracer();
 * await tracer.withSpan('my-op', async () => 'result');
 * expect(spans[0].name).toBe('my-op');
 * expect(spans[0].ended).toBe(true);
 * ```
 *
 * @module test-helpers
 */

import { vi } from 'vitest';

import type { SpanWrapper, TracerWrapper } from '#core/telemetry/otel.js';

/** A recorded span with all attributes, events, and status captured during the test. */
export interface MockSpan {
  /** Name passed to `startSpan()` or `withSpan()`. */
  readonly name: string;
  /** Attributes set via `setAttribute()`. */
  readonly attributes: Record<string, string | number | boolean>;
  /** Current span status — `'unset'` until `setStatus()` is called. */
  status: 'ok' | 'error' | 'unset';
  /** Status message provided to `setStatus()`, if any. */
  statusMessage?: string;
  /** Events added via `addEvent()`. */
  readonly events: { name: string; attributes?: Record<string, string> }[];
  /** Whether `end()` has been called on this span. */
  ended: boolean;
}

/** A recorded exception passed to `recordException()`. */
export interface MockException {
  /** The span on which the exception was recorded. */
  readonly span: SpanWrapper;
  /** The error that was recorded. */
  readonly error: Error;
}

/** Return type of {@link createMockTracer}. */
export interface MockTracerResult {
  /** The `TracerWrapper` mock to inject in place of a real tracer. */
  readonly tracer: TracerWrapper;
  /** All spans started during the test (in creation order). */
  readonly spans: MockSpan[];
  /** All exceptions passed to `recordException()`. */
  readonly exceptions: MockException[];
  /** vi.fn() stub for `shutdown()` — assert it was called on teardown. */
  readonly shutdownFn: ReturnType<typeof vi.fn>;
}

/**
 * Creates a mock {@link TracerWrapper} that records all telemetry activity.
 *
 * @returns A `TracerWrapper` implementation backed by in-memory recording plus
 *   accessor arrays for spans and exceptions.
 *
 * @example
 * ```typescript
 * const { tracer, spans } = createMockTracer();
 * const span = tracer.startSpan('op', { 'db.system': 'sap-odata' });
 * span.setAttribute('http.status_code', 200);
 * span.setStatus('ok');
 * span.end();
 * expect(spans[0].attributes['db.system']).toBe('sap-odata');
 * expect(spans[0].status).toBe('ok');
 * expect(spans[0].ended).toBe(true);
 * ```
 */
export function createMockTracer(): MockTracerResult {
  const spans: MockSpan[] = [];
  const exceptions: MockException[] = [];
  const shutdownFn = vi.fn().mockResolvedValue(undefined);

  function createMockSpan(
    name: string,
    initialAttrs?: Record<string, string>,
  ): SpanWrapper & { _record: MockSpan } {
    const record: MockSpan = {
      name,
      attributes: { ...initialAttrs },
      status: 'unset',
      events: [],
      ended: false,
    };
    spans.push(record);

    const span: SpanWrapper & { _record: MockSpan } = {
      _record: record,
      end(): void {
        record.ended = true;
      },
      setAttribute(key: string, value: string | number | boolean): void {
        record.attributes[key] = value;
      },
      setStatus(code: 'ok' | 'error', message?: string): void {
        record.status = code;
        if (message !== undefined) {
          record.statusMessage = message;
        }
      },
      addEvent(eventName: string, attributes?: Record<string, string>): void {
        if (attributes !== undefined) {
          record.events.push({ name: eventName, attributes });
        } else {
          record.events.push({ name: eventName });
        }
      },
    };
    return span;
  }

  const tracer: TracerWrapper = {
    startSpan(name: string, attributes?: Record<string, string>): SpanWrapper {
      return createMockSpan(name, attributes);
    },
    async withSpan<T>(name: string, fn: () => Promise<T>): Promise<T> {
      const span = createMockSpan(name);
      try {
        const result = await fn();
        span.setStatus('ok');
        span.end();
        return result;
      } catch (err) {
        span.setStatus('error', err instanceof Error ? err.message : String(err));
        span.end();
        throw err;
      }
    },
    recordException(span: SpanWrapper, error: Error): void {
      exceptions.push({ span, error });
    },
    getActiveTraceId(): string | undefined {
      return undefined;
    },
    shutdown: shutdownFn as () => Promise<void>,
  };

  return { tracer, spans, exceptions, shutdownFn };
}
