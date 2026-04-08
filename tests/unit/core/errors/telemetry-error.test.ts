/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/errors/telemetry-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { TelemetryError } from '#core/errors/telemetry-error.js';

describe('TelemetryError', () => {
  runBaseErrorTests(
    TelemetryError,
    {
      message: 'OTel SDK init failed',
      attempted: 'Initialize OpenTelemetry',
    },
    {
      expectedName: 'TelemetryError',
      expectedDefaultCode: ErrorCode.ERR_TELEMETRY_INIT_FAILED,
      expectedDefaultRetryable: false,
    },
  );

  it('extends PramanError', () => {
    const error = new TelemetryError({
      message: 'Telemetry failed',
      attempted: 'Init tracing',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new TelemetryError({
      code: ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING,
      message: 'Package not installed',
      attempted: 'Import @opentelemetry/sdk-node',
    });
    expect(error.code).toBe(ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING);
  });

  it('accepts all telemetry error codes', () => {
    const codes = [
      ErrorCode.ERR_TELEMETRY_INIT_FAILED,
      ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING,
      ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED,
      ErrorCode.ERR_TELEMETRY_SHUTDOWN_FAILED,
      ErrorCode.ERR_TELEMETRY_METRICS_INIT_FAILED,
    ] as const;

    for (const code of codes) {
      const error = new TelemetryError({
        code,
        message: `Error with code ${code}`,
        attempted: 'test',
      });
      expect(error.code).toBe(code);
    }
  });

  it('stores exporterType from options', () => {
    const error = new TelemetryError({
      message: 'Exporter failed',
      attempted: 'Create OTLP exporter',
      exporterType: 'otlp',
    });
    expect(error.exporterType).toBe('otlp');
  });

  it('stores packageName from options', () => {
    const error = new TelemetryError({
      message: 'Package missing',
      attempted: 'Dynamic import',
      packageName: '@opentelemetry/sdk-node',
    });
    expect(error.packageName).toBe('@opentelemetry/sdk-node');
  });

  it('defaults exporterType and packageName to undefined', () => {
    const error = new TelemetryError({
      message: 'Init failed',
      attempted: 'Init',
    });
    expect(error.exporterType).toBeUndefined();
    expect(error.packageName).toBeUndefined();
  });

  it('includes subclass fields in toJSON()', () => {
    const error = new TelemetryError({
      message: 'Exporter failed',
      attempted: 'Create exporter',
      exporterType: 'azure-monitor',
      packageName: '@azure/monitor-opentelemetry-exporter',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('exporterType', 'azure-monitor');
    expect(json).toHaveProperty('packageName', '@azure/monitor-opentelemetry-exporter');
  });

  it('includes subclass fields in toAIContext()', () => {
    const error = new TelemetryError({
      message: 'Exporter failed',
      attempted: 'Create exporter',
      exporterType: 'jaeger',
      packageName: '@opentelemetry/exporter-trace-otlp-http',
    });
    const ctx = error.toAIContext();
    expect(ctx).toHaveProperty('exporterType', 'jaeger');
    expect(ctx).toHaveProperty('packageName', '@opentelemetry/exporter-trace-otlp-http');
  });

  it('exporterType is readonly', () => {
    const error = new TelemetryError({
      message: 'test',
      attempted: 'test',
      exporterType: 'otlp',
    });
    expect(() => {
      // @ts-expect-error -- testing runtime immutability
      error.exporterType = 'jaeger';
    }).toThrow();
  });

  it('packageName is readonly', () => {
    const error = new TelemetryError({
      message: 'test',
      attempted: 'test',
      packageName: '@opentelemetry/api',
    });
    expect(() => {
      // @ts-expect-error -- testing runtime immutability
      error.packageName = 'other';
    }).toThrow();
  });
});
