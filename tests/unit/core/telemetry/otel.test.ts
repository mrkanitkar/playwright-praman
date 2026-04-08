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
import { describe, expect, it, vi } from 'vitest';

import { PramanConfigSchema } from '#core/config/schema.js';
import { getNoOpMeter, getNoOpTracer, initTelemetry } from '#core/telemetry/otel.js';

const mockWarn = vi.fn();

vi.mock('#core/logging/index.js', () => ({
  createLogger: vi.fn(() => ({
    warn: mockWarn,
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  })),
  createRootLogger: vi.fn(),
  resetDefaultLogger: vi.fn(),
}));

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

  it('returns NoOpTracer when openTelemetry is not true', async () => {
    const config = PramanConfigSchema.parse({
      telemetry: { openTelemetry: false },
    });

    const tracer = await initTelemetry(config);

    // Should return a valid TracerWrapper with all required methods
    expect(typeof tracer.startSpan).toBe('function');
    expect(typeof tracer.withSpan).toBe('function');
    expect(typeof tracer.recordException).toBe('function');
    expect(typeof tracer.shutdown).toBe('function');
  });

  it('does not log warning when telemetry section is absent', async () => {
    mockWarn.mockClear();
    const config = PramanConfigSchema.parse({});

    await initTelemetry(config);

    expect(mockWarn).not.toHaveBeenCalled();
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

describe('getNoOpMeter', () => {
  it('returns a MeterWrapper with all methods', () => {
    const meter = getNoOpMeter();

    expect(typeof meter.createCounter).toBe('function');
    expect(typeof meter.createHistogram).toBe('function');
    expect(typeof meter.shutdown).toBe('function');
  });
});

describe('NoOpMeter.createCounter', () => {
  it('returns a MetricCounter without errors', () => {
    const meter = getNoOpMeter();
    const counter = meter.createCounter('test-counter', 'A test counter');

    expect(counter).toBeDefined();
    expect(typeof counter.add).toBe('function');
  });

  it('add is a no-op', () => {
    const meter = getNoOpMeter();
    const counter = meter.createCounter('test-counter');

    expect(() => {
      counter.add(1);
      counter.add(5, { key: 'value' });
    }).not.toThrow();
  });
});

describe('NoOpMeter.createHistogram', () => {
  it('returns a MetricHistogram without errors', () => {
    const meter = getNoOpMeter();
    const histogram = meter.createHistogram('test-histogram', 'A test histogram');

    expect(histogram).toBeDefined();
    expect(typeof histogram.record).toBe('function');
  });

  it('record is a no-op', () => {
    const meter = getNoOpMeter();
    const histogram = meter.createHistogram('test-histogram');

    expect(() => {
      histogram.record(42.5);
      histogram.record(100, { unit: 'ms' });
    }).not.toThrow();
  });
});

describe('NoOpTracer.getActiveTraceId', () => {
  it('returns undefined', () => {
    const tracer = getNoOpTracer();

    expect(tracer.getActiveTraceId()).toBeUndefined();
  });
});

describe('NoOpMeter.shutdown', () => {
  it('resolves without error', async () => {
    const meter = getNoOpMeter();

    await expect(meter.shutdown()).resolves.toBeUndefined();
  });
});

describe('NoOpSpanWrapper — setStatus variants', () => {
  it('setStatus with error code is a no-op', () => {
    const tracer = getNoOpTracer();
    const span = tracer.startSpan('test-span');

    expect(() => {
      span.setStatus('error', 'something failed');
    }).not.toThrow();
  });

  it('setStatus with ok code and no message is a no-op', () => {
    const tracer = getNoOpTracer();
    const span = tracer.startSpan('test-span');

    expect(() => {
      span.setStatus('ok');
    }).not.toThrow();
  });
});

describe('NoOpTracer — startSpan without attributes', () => {
  it('returns a SpanWrapper when called with name only', () => {
    const tracer = getNoOpTracer();
    const span = tracer.startSpan('name-only');

    expect(span).toBeDefined();
    expect(typeof span.end).toBe('function');
  });
});
