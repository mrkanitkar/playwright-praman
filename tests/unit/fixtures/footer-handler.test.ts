/**
 * Tests for `src/fixtures/footer-handler.ts` -- FooterHandler class.
 *
 * @remarks
 * Strict TDD RED phase: all 8 tests written before production code.
 * FooterHandler provides footer bar button operations for Fiori apps:
 * Save, Apply, Cancel, Edit, Delete, Create.
 *
 * Mock strategy: vi.mock() for logger module, vi.fn() for adapter/page.
 *
 * @module fixtures
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockBridgeAdapter } from '../../helpers/mock-bridge-adapter.js';
import { createMockBridgePage } from '../../helpers/mock-page.js';

import { ControlError } from '#core/errors/control-error.js';

// ── Mock logger ────────────────────────────────────────────────────────
const mockChildLogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

const mockCreateLogger = vi.fn().mockReturnValue(mockChildLogger);

vi.mock('#core/logging/logger.js', () => ({
  createLogger: mockCreateLogger,
}));

// ── Import after mocks ─────────────────────────────────────────────────
const { FooterHandler } = await import('#fixtures/footer-handler.js');

// ── Tests ───────────────────────────────────────────────────────────────

describe('FooterHandler', () => {
  let adapter: ReturnType<typeof createMockBridgeAdapter>;
  let page: ReturnType<typeof createMockBridgePage>;
  let handler: InstanceType<typeof FooterHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = createMockBridgeAdapter();
    page = createMockBridgePage();

    handler = new FooterHandler({ adapter, page });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 1: Button click methods (tests 1-6)
  // ═══════════════════════════════════════════════════════════════════════

  describe('footer button click methods', () => {
    it('clickSave() clicks the Save button with correct text', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.clickSave();

      expect(page.evaluate).toHaveBeenCalledOnce();
      // Verify the button text argument passed to evaluate
      const evaluateCall = page.evaluate.mock.calls[0];
      expect(evaluateCall?.[1]).toBe('Save');
    });

    it('clickApply() clicks the Apply button with correct text', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.clickApply();

      expect(page.evaluate).toHaveBeenCalledOnce();
      const evaluateCall = page.evaluate.mock.calls[0];
      expect(evaluateCall?.[1]).toBe('Apply');
    });

    it('clickCancel() clicks the Cancel button with correct text', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.clickCancel();

      expect(page.evaluate).toHaveBeenCalledOnce();
      const evaluateCall = page.evaluate.mock.calls[0];
      expect(evaluateCall?.[1]).toBe('Cancel');
    });

    it('clickEdit() clicks the Edit button with correct text', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.clickEdit();

      expect(page.evaluate).toHaveBeenCalledOnce();
      const evaluateCall = page.evaluate.mock.calls[0];
      expect(evaluateCall?.[1]).toBe('Edit');
    });

    it('clickDelete() clicks the Delete button with correct text', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.clickDelete();

      expect(page.evaluate).toHaveBeenCalledOnce();
      const evaluateCall = page.evaluate.mock.calls[0];
      expect(evaluateCall?.[1]).toBe('Delete');
    });

    it('clickCreate() clicks the Create button with correct text', async () => {
      page.evaluate.mockResolvedValue(true);

      await handler.clickCreate();

      expect(page.evaluate).toHaveBeenCalledOnce();
      const evaluateCall = page.evaluate.mock.calls[0];
      expect(evaluateCall?.[1]).toBe('Create');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 2: Error handling (test 7)
  // ═══════════════════════════════════════════════════════════════════════

  describe('error handling', () => {
    it('throws ControlError with ERR_CONTROL_NOT_FOUND when button not found', async () => {
      page.evaluate.mockResolvedValue(false);

      await expect(handler.clickSave()).rejects.toThrow(ControlError);

      try {
        await handler.clickSave();
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(ControlError);
        const controlError = error as ControlError;
        expect(controlError.code).toBe('ERR_CONTROL_NOT_FOUND');
        expect(controlError.retryable).toBe(true);
        expect(controlError.suggestions.length).toBeGreaterThan(0);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 3: Logger (test 8)
  // ═══════════════════════════════════════════════════════════════════════

  describe('logging', () => {
    it('creates a child logger with module name "footer-handler"', () => {
      expect(mockCreateLogger).toHaveBeenCalledWith('footer-handler');
    });
  });
});
