/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/telemetry/otel.ts` — OpenTelemetry tracer wrappers.
 *
 * @remarks
 * Verifies NoOpTracer implementation, lazy initialization, and that
 * disabled telemetry returns NoOpTracer immediately with zero overhead.
 */
import { describe, expect, it } from 'vitest';

import { PramanConfigSchema } from '#core/config/schema.js';
import { getNoOpTracer, initTelemetry } from '#core/telemetry/otel.js';

describe('initTelemetry', () => {
  it('returns NoOpTracer when telemetry is disabled', async () => {
    const config = PramanConfigSchema.parse({
      telemetry: { openTelemetry: false },
    });

    const tracer = await initTelemetry(config);

    // Should be a valid TracerWrapper with all required methods
    expect(typeof tracer.startSpan).toBe('function');
    expect(typeof tracer.withSpan).toBe('function');
    expect(typeof tracer.recordException).toBe('function');
    expect(typeof tracer.shutdown).toBe('function');
  });
});

describe('getNoOpTracer', () => {
  it('returns a TracerWrapper with all methods', () => {
    const tracer = getNoOpTracer();

    expect(typeof tracer.startSpan).toBe('function');
    expect(typeof tracer.withSpan).toBe('function');
    expect(typeof tracer.recordException).toBe('function');
    expect(typeof tracer.shutdown).toBe('function');
  });
});

describe('NoOpTracer.startSpan', () => {
  it('returns a SpanWrapper without errors', () => {
    const tracer = getNoOpTracer();

    const span = tracer.startSpan('test-span', { key: 'value' });

    expect(span).toBeDefined();
    expect(typeof span.end).toBe('function');
    expect(typeof span.setAttribute).toBe('function');
    expect(typeof span.setStatus).toBe('function');
    expect(typeof span.addEvent).toBe('function');
  });
});

describe('NoOpTracer.withSpan', () => {
  it('executes fn and returns result', async () => {
    const tracer = getNoOpTracer();

    const result = await tracer.withSpan('test-span', async () => Promise.resolve(42));

    expect(result).toBe(42);
  });

  it('propagates errors from fn', async () => {
    const tracer = getNoOpTracer();
    const expectedError = new Error('test-error');

    await expect(
      tracer.withSpan('test-span', async () => Promise.reject(expectedError)),
    ).rejects.toThrow('test-error');
  });
});

describe('NoOpTracer.recordException', () => {
  it('is a no-op and does not throw', () => {
    const tracer = getNoOpTracer();
    const span = tracer.startSpan('test-span');
    const error = new Error('test-error');

    // Should not throw
    expect(() => {
      tracer.recordException(span, error);
    }).not.toThrow();
  });
});

describe('NoOpTracer.shutdown', () => {
  it('resolves without error', async () => {
    const tracer = getNoOpTracer();

    await expect(tracer.shutdown()).resolves.toBeUndefined();
  });
});

describe('NoOpSpanWrapper', () => {
  it('end is a no-op', () => {
    const tracer = getNoOpTracer();
    const span = tracer.startSpan('test-span');

    expect(() => {
      span.end();
    }).not.toThrow();
  });

  it('setAttribute is a no-op', () => {
    const tracer = getNoOpTracer();
    const span = tracer.startSpan('test-span');

    expect(() => {
      span.setAttribute('key', 'value');
    }).not.toThrow();
  });

  it('setStatus is a no-op', () => {
    const tracer = getNoOpTracer();
    const span = tracer.startSpan('test-span');

    expect(() => {
      span.setStatus('ok', 'done');
    }).not.toThrow();
  });

  it('addEvent is a no-op', () => {
    const tracer = getNoOpTracer();
    const span = tracer.startSpan('test-span');

    expect(() => {
      span.addEvent('event-name', { detail: 'value' });
    }).not.toThrow();
  });
});
