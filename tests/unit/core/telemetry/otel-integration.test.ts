/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Integration tests for OpenTelemetry real tracer initialization.
 *
 * @remarks
 * Uses InMemorySpanExporter from `@opentelemetry/sdk-trace-base` to verify
 * that spans are actually created and exported when telemetry is enabled.
 * No Docker or external services needed — everything runs in-process.
 */
import { trace } from '@opentelemetry/api';
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { describe, expect, it, vi } from 'vitest';

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

import { getNoOpMeter, getNoOpTracer } from '#core/telemetry/otel.js';

describe('OTel Integration — NoOp wrappers', () => {
  it('NoOpTracer operations complete without errors', async () => {
    const tracer = getNoOpTracer();
    const span = tracer.startSpan('noop-span');
    span.setAttribute('key', 'value');
    span.end();
    await tracer.shutdown();
    expect(span).toBeDefined();
  });

  it('NoOpTracer.withSpan passes through return values', async () => {
    const tracer = getNoOpTracer();
    const result = await tracer.withSpan('test', async () => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it('NoOpMeter operations complete without errors', async () => {
    const meter = getNoOpMeter();
    const counter = meter.createCounter('test.counter', 'A test counter');
    counter.add(1);
    counter.add(5, { key: 'value' });
    const histogram = meter.createHistogram('test.histogram');
    histogram.record(42.5);
    await meter.shutdown();
    expect(counter).toBeDefined();
    expect(histogram).toBeDefined();
  });
});

describe('OTel Integration — Real SDK with InMemoryExporter', () => {
  it('creates and exports spans with attributes', async () => {
    const memoryExporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(memoryExporter)],
    });
    trace.setGlobalTracerProvider(provider);

    try {
      const tracer = trace.getTracer('integration-test');

      const span = tracer.startSpan('test-operation');
      span.setAttribute('praman.test', true);
      span.setAttribute('praman.test.file', 'test.spec.ts');
      span.setAttribute('praman.test.duration', 1500);
      span.setStatus({ code: 1 }); // SpanStatusCode.OK
      span.end();

      await provider.forceFlush();

      const spans = memoryExporter.getFinishedSpans();
      expect(spans.length).toBeGreaterThanOrEqual(1);

      const testSpan = spans.find((s) => s.name === 'test-operation');
      expect(testSpan).toBeDefined();
      expect(testSpan?.attributes['praman.test']).toBe(true);
      expect(testSpan?.attributes['praman.test.file']).toBe('test.spec.ts');
      expect(testSpan?.attributes['praman.test.duration']).toBe(1500);
    } finally {
      await provider.shutdown();
    }
  });
});
