/**
 * Tests for `src/core/config/schema.ts` — PramanConfigSchema (Zod).
 *
 * @remarks
 * Verifies schema validation, defaults, type narrowing, and rejection
 * of invalid values. Uses safeParse for non-throwing validation.
 */
import { describe, expect, it } from 'vitest';

import { PramanConfigSchema } from '#core/config/schema.js';

describe('PramanConfigSchema', () => {
  // ── Valid inputs ─────────────────────────────────────────────────────
  describe('valid inputs', () => {
    it('accepts empty object and applies all defaults', () => {
      const result = PramanConfigSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logLevel).toBe('info');
        expect(result.data.ui5WaitTimeout).toBe(30_000);
        expect(result.data.controlDiscoveryTimeout).toBe(10_000);
        expect(result.data.interactionStrategy).toBe('hybrid');
        expect(result.data.skipStabilityWait).toBe(false);
        expect(result.data.preferVisibleControls).toBe(true);
        expect(result.data.ignoreAutoWaitUrls).toEqual([]);
      }
    });

    it('accepts valid minimal config with overrides', () => {
      const result = PramanConfigSchema.safeParse({
        logLevel: 'debug',
        ui5WaitTimeout: 5000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.logLevel).toBe('debug');
        expect(result.data.ui5WaitTimeout).toBe(5000);
      }
    });

    it('accepts full config with all sections', () => {
      const fullConfig = {
        logLevel: 'verbose',
        ui5WaitTimeout: 60_000,
        controlDiscoveryTimeout: 15_000,
        interactionStrategy: 'playwright',
        skipStabilityWait: true,
        preferVisibleControls: false,
        ignoreAutoWaitUrls: ['**/walkme/**', '**/analytics/**'],
        auth: {
          strategy: 'btp-saml',
          baseUrl: 'https://sap.example.com',
          username: 'user',
          // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- test fixture
          password: 'test-credential',
          client: '200',
          language: 'DE',
        },
        ai: {
          provider: 'openai',
          apiKey: 'sk-test',
          model: 'gpt-4o',
          temperature: 0.5,
          maxTokens: 4000,
        },
        telemetry: {
          openTelemetry: true,
          exporter: 'jaeger',
          endpoint: 'https://jaeger.example.com/v1/traces',
          serviceName: 'my-tests',
        },
        selectors: {
          defaultTimeout: 5000,
          preferVisibleControls: false,
          skipStabilityWait: true,
        },
      };
      const result = PramanConfigSchema.safeParse(fullConfig);
      expect(result.success).toBe(true);
    });

    it('applies auth section defaults', () => {
      const result = PramanConfigSchema.safeParse({
        auth: { baseUrl: 'https://sap.example.com' },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.auth?.strategy).toBe('basic');
        expect(result.data.auth?.client).toBe('100');
        expect(result.data.auth?.language).toBe('EN');
      }
    });

    it('applies telemetry section defaults', () => {
      const result = PramanConfigSchema.safeParse({
        telemetry: {},
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.telemetry?.openTelemetry).toBe(false);
        expect(result.data.telemetry?.exporter).toBe('otlp');
        expect(result.data.telemetry?.serviceName).toBe('playwright-praman');
      }
    });

    it('applies ai section defaults', () => {
      const result = PramanConfigSchema.safeParse({
        ai: {},
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ai?.provider).toBe('azure-openai');
        expect(result.data.ai?.temperature).toBe(0.3);
      }
    });

    it('applies selectors section defaults', () => {
      const result = PramanConfigSchema.safeParse({
        selectors: {},
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.selectors?.defaultTimeout).toBe(10_000);
        expect(result.data.selectors?.preferVisibleControls).toBe(true);
        expect(result.data.selectors?.skipStabilityWait).toBe(false);
      }
    });
  });

  // ── Invalid inputs ───────────────────────────────────────────────────
  describe('invalid inputs', () => {
    it('rejects invalid logLevel', () => {
      const result = PramanConfigSchema.safeParse({ logLevel: 'trace' });
      expect(result.success).toBe(false);
    });

    it('rejects NaN timeout', () => {
      const result = PramanConfigSchema.safeParse({ ui5WaitTimeout: Number.NaN });
      expect(result.success).toBe(false);
    });

    it('rejects negative timeout', () => {
      const result = PramanConfigSchema.safeParse({ ui5WaitTimeout: -1 });
      expect(result.success).toBe(false);
    });

    it('rejects float timeout', () => {
      const result = PramanConfigSchema.safeParse({ ui5WaitTimeout: 1.5 });
      expect(result.success).toBe(false);
    });

    it('rejects zero timeout', () => {
      const result = PramanConfigSchema.safeParse({ controlDiscoveryTimeout: 0 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid auth baseUrl', () => {
      const result = PramanConfigSchema.safeParse({
        auth: { baseUrl: 'not-a-url' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects unknown top-level fields (strict mode)', () => {
      const result = PramanConfigSchema.safeParse({ unknownField: true });
      expect(result.success).toBe(false);
    });

    it('rejects ai temperature above 2', () => {
      const result = PramanConfigSchema.safeParse({
        ai: { temperature: 3 },
      });
      expect(result.success).toBe(false);
    });

    it('rejects ai temperature below 0', () => {
      const result = PramanConfigSchema.safeParse({
        ai: { temperature: -0.1 },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid interactionStrategy', () => {
      const result = PramanConfigSchema.safeParse({
        interactionStrategy: 'selenium',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid auth strategy', () => {
      const result = PramanConfigSchema.safeParse({
        auth: { baseUrl: 'https://sap.example.com', strategy: 'oauth2' },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid telemetry exporter', () => {
      const result = PramanConfigSchema.safeParse({
        telemetry: { exporter: 'prometheus' },
      });
      expect(result.success).toBe(false);
    });
  });

  // ── Validation error structure ───────────────────────────────────────
  describe('error structure', () => {
    it('provides path information in validation errors', () => {
      const result = PramanConfigSchema.safeParse({
        auth: { baseUrl: 'not-url' },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map((issue) => issue.path.join('.'));
        expect(paths).toContain('auth.baseUrl');
      }
    });

    it('provides error code in validation errors', () => {
      const result = PramanConfigSchema.safeParse({ logLevel: 'invalid' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const firstIssue = result.error.issues[0];
        expect(firstIssue).toBeDefined();
        expect(firstIssue?.code).toBeDefined();
      }
    });
  });
});
