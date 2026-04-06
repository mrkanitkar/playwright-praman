/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/errors/base.ts` — PramanError base class.
 *
 * @remarks
 * Verifies constructor, inheritance, serialization (toJSON), user-friendly
 * output (toUserMessage), AI context (toAIContext), defaults, and immutability.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PramanError } from '#core/errors/base.js';
import type { PramanErrorOptions } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';

const SAMPLE_OPTIONS: PramanErrorOptions = {
  code: ErrorCode.ERR_CONFIG_INVALID,
  message: 'Config file contains invalid values',
  attempted: 'Load config from praman.config.ts',
  retryable: false,
};

describe('PramanError', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ── Constructor & Inheritance ────────────────────────────────────────
  describe('constructor', () => {
    it('creates an instance of PramanError', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error).toBeInstanceOf(PramanError);
    });

    it('extends Error', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error).toBeInstanceOf(Error);
    });

    it('sets name to PramanError', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error.name).toBe('PramanError');
    });

    it('sets message from options', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error.message).toBe('Config file contains invalid values');
    });

    it('sets code from options', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error.code).toBe(ErrorCode.ERR_CONFIG_INVALID);
    });

    it('sets attempted from options', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error.attempted).toBe('Load config from praman.config.ts');
    });

    it('sets retryable from options', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error.retryable).toBe(false);
    });

    it('captures stack trace', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('PramanError');
    });

    it('still creates error when captureStackTrace is unavailable', () => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const original = Error.captureStackTrace;
      // Temporarily remove captureStackTrace to exercise the guard branch
      Object.defineProperty(Error, 'captureStackTrace', { value: undefined, configurable: true });
      try {
        const error = new PramanError(SAMPLE_OPTIONS);
        expect(error).toBeInstanceOf(PramanError);
        expect(error.code).toBe(SAMPLE_OPTIONS.code);
        expect(error.stack).toBeDefined();
      } finally {
        Object.defineProperty(Error, 'captureStackTrace', { value: original, configurable: true });
      }
    });

    it('sets timestamp as ISO 8601 string', () => {
      const before = new Date().toISOString();
      const error = new PramanError(SAMPLE_OPTIONS);
      const after = new Date().toISOString();
      expect(error.timestamp).toBeDefined();
      expect(error.timestamp >= before).toBe(true);
      expect(error.timestamp <= after).toBe(true);
    });

    it('preserves cause when provided', () => {
      const cause = new Error('underlying issue');
      const error = new PramanError({ ...SAMPLE_OPTIONS, cause });
      expect(error.cause).toBe(cause);
    });
  });

  // ── Defaults ─────────────────────────────────────────────────────────
  describe('defaults', () => {
    it('defaults severity to error', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error.severity).toBe('error');
    });

    it('defaults details to empty object', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error.details).toEqual({});
    });

    it('defaults suggestions to empty array', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(error.suggestions).toEqual([]);
    });

    it('accepts custom severity', () => {
      const error = new PramanError({ ...SAMPLE_OPTIONS, severity: 'warning' });
      expect(error.severity).toBe('warning');
    });

    it('accepts custom details', () => {
      const details = { configPath: '/app/praman.config.ts' };
      const error = new PramanError({ ...SAMPLE_OPTIONS, details });
      expect(error.details).toEqual(details);
    });

    it('accepts custom suggestions', () => {
      const suggestions = ['Check syntax', 'Run validate-config'];
      const error = new PramanError({ ...SAMPLE_OPTIONS, suggestions });
      expect(error.suggestions).toEqual(suggestions);
    });
  });

  // ── toJSON() ─────────────────────────────────────────────────────────
  describe('toJSON', () => {
    it('returns an object with all base fields', () => {
      const error = new PramanError({
        ...SAMPLE_OPTIONS,
        severity: 'warning',
        details: { configPath: '/app/config.ts' },
        suggestions: ['Fix syntax'],
      });

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'PramanError',
        code: 'ERR_CONFIG_INVALID',
        message: 'Config file contains invalid values',
        attempted: 'Load config from praman.config.ts',
        retryable: false,
        severity: 'warning',
        details: { configPath: '/app/config.ts' },
        suggestions: ['Fix syntax'],
        timestamp: error.timestamp,
        stack: error.stack,
        docsUrl: 'https://praman.dev/docs/guides/errors#config-errors',
      });
    });

    it('is JSON.stringify-safe (round-trips)', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const json = JSON.stringify(error);
      const parsed: unknown = JSON.parse(json);
      expect(parsed).toHaveProperty('code', 'ERR_CONFIG_INVALID');
      expect(parsed).toHaveProperty('name', 'PramanError');
    });

    it('includes stack in JSON output', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const json = error.toJSON();
      expect(json.stack).toBeDefined();
      expect(typeof json.stack).toBe('string');
    });
  });

  // ── toUserMessage() ──────────────────────────────────────────────────
  describe('toUserMessage', () => {
    it('formats error code and message on first line', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const msg = error.toUserMessage();
      expect(msg).toContain('[ERR_CONFIG_INVALID] Config file contains invalid values');
    });

    it('includes attempted action', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const msg = error.toUserMessage();
      expect(msg).toContain('Attempted: Load config from praman.config.ts');
    });

    it('shows retryable as yes/no (not true/false)', () => {
      const retryableError = new PramanError({ ...SAMPLE_OPTIONS, retryable: true });
      expect(retryableError.toUserMessage()).toContain('Retryable: yes');

      const nonRetryableError = new PramanError({ ...SAMPLE_OPTIONS, retryable: false });
      expect(nonRetryableError.toUserMessage()).toContain('Retryable: no');
    });

    it('includes severity', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const msg = error.toUserMessage();
      expect(msg).toContain('Severity:  error');
    });

    it('includes numbered suggestions when provided', () => {
      const error = new PramanError({
        ...SAMPLE_OPTIONS,
        suggestions: ['Check syntax', 'Run validate'],
      });
      const msg = error.toUserMessage();
      expect(msg).toContain('Suggestions:');
      expect(msg).toContain('1. Check syntax');
      expect(msg).toContain('2. Run validate');
    });

    it('omits suggestions section when empty', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const msg = error.toUserMessage();
      expect(msg).not.toContain('Suggestions:');
    });

    it('includes details section when non-empty', () => {
      const error = new PramanError({
        ...SAMPLE_OPTIONS,
        details: { configPath: '/app/config.ts' },
      });
      const msg = error.toUserMessage();
      expect(msg).toContain('Details:');
      expect(msg).toContain('configPath: /app/config.ts');
    });

    it('omits details section when empty', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const msg = error.toUserMessage();
      expect(msg).not.toContain('Details:');
    });

    it('includes docs URL derived from error code category', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const msg = error.toUserMessage();
      expect(msg).toContain('Docs: https://praman.dev/docs/guides/errors#config-errors');
    });

    it('includes local docs fallback when PRAMAN_DEBUG is true', () => {
      vi.stubEnv('PRAMAN_DEBUG', 'true');
      const error = new PramanError(SAMPLE_OPTIONS);
      const msg = error.toUserMessage();
      expect(msg).toContain('Local: node_modules/playwright-praman/docs/docs/guides/errors.md');
    });

    it('omits local docs fallback when PRAMAN_DEBUG is not set', () => {
      vi.stubEnv('PRAMAN_DEBUG', '');
      const error = new PramanError(SAMPLE_OPTIONS);
      const msg = error.toUserMessage();
      expect(msg).not.toContain('Local:');
    });

    it('derives correct docs URL for different error categories', () => {
      const controlError = new PramanError({
        ...SAMPLE_OPTIONS,
        code: 'ERR_CONTROL_NOT_FOUND' as ErrorCode,
      });
      expect(controlError.toUserMessage()).toContain('#control-errors');

      const bridgeError = new PramanError({
        ...SAMPLE_OPTIONS,
        code: 'ERR_BRIDGE_TIMEOUT' as ErrorCode,
      });
      expect(bridgeError.toUserMessage()).toContain('#bridge-errors');
    });
  });

  // ── toAIContext() ────────────────────────────────────────────────────
  describe('toAIContext', () => {
    it('returns structured context without stack or name', () => {
      const error = new PramanError({
        ...SAMPLE_OPTIONS,
        details: { configPath: '/app/config.ts' },
        suggestions: ['Fix it'],
      });

      const ctx = error.toAIContext();

      expect(ctx).toEqual({
        code: 'ERR_CONFIG_INVALID',
        message: 'Config file contains invalid values',
        attempted: 'Load config from praman.config.ts',
        retryable: false,
        severity: 'error',
        details: { configPath: '/app/config.ts' },
        suggestions: ['Fix it'],
        timestamp: error.timestamp,
        docsUrl: 'https://praman.dev/docs/guides/errors#config-errors',
      });
    });

    it('does not include stack property', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const ctx = error.toAIContext();
      expect(ctx).not.toHaveProperty('stack');
    });

    it('does not include name property', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      const ctx = error.toAIContext();
      expect(ctx).not.toHaveProperty('name');
    });
  });

  // ── Immutability ─────────────────────────────────────────────────────
  describe('immutability', () => {
    it('code property is readonly', () => {
      const error = new PramanError(SAMPLE_OPTIONS);
      expect(() => {
        // @ts-expect-error -- testing runtime immutability
        error.code = 'ERR_BRIDGE_TIMEOUT';
      }).toThrow();
    });

    it('suggestions array is frozen', () => {
      const error = new PramanError({
        ...SAMPLE_OPTIONS,
        suggestions: ['Check syntax'],
      });
      expect(Object.isFrozen(error.suggestions)).toBe(true);
    });

    it('details object is frozen', () => {
      const error = new PramanError({
        ...SAMPLE_OPTIONS,
        details: { key: 'value' },
      });
      expect(Object.isFrozen(error.details)).toBe(true);
    });
  });
});
