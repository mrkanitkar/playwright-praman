/**
 * Tests for `src/fixtures/test-data-handler.ts` -- TestDataHandler class.
 *
 * @remarks
 * TestDataHandler provides template-based test data generation,
 * JSON file persistence, and automatic cleanup on teardown.
 *
 * Mock strategy: vi.mock() for logger, node:fs/promises, and node:crypto.
 *
 * @module fixtures
 */

import { join } from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

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

// ── Mock node:fs/promises ──────────────────────────────────────────────
const mockReadFile = vi.fn();
const mockWriteFile = vi.fn();
const mockMkdir = vi.fn();
const mockRm = vi.fn();

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  rm: mockRm,
}));

// ── Mock node:crypto ───────────────────────────────────────────────────
const mockRandomUUID = vi.fn().mockReturnValue('test-uuid-1234');

vi.mock('node:crypto', () => ({
  randomUUID: mockRandomUUID,
}));

// ── Import after mocks ─────────────────────────────────────────────────
const { TestDataHandler } = await import('#fixtures/test-data-handler.js');

// ── Constants ──────────────────────────────────────────────────────────
/** Safe non-tmp test path to avoid sonarjs/publicly-writable-directories. */
const TEST_BASE_DIR = '/home/testuser/test-output/test-data';

// ── Tests ──────────────────────────────────────────────────────────────

describe('TestDataHandler', () => {
  let handler: InstanceType<typeof TestDataHandler>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRandomUUID.mockReturnValue('test-uuid-1234');
    mockReadFile.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockRm.mockResolvedValue(undefined);
    handler = new TestDataHandler({ baseDir: TEST_BASE_DIR });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 1: generate() — template substitution
  // ═══════════════════════════════════════════════════════════════════════

  describe('generate()', () => {
    it('replaces {{uuid}} placeholder with a UUID', () => {
      const result = handler.generate({ id: '{{uuid}}' });

      expect(result.id).toBe('test-uuid-1234');
      expect(mockRandomUUID).toHaveBeenCalled();
    });

    it('replaces {{timestamp}} placeholder with ISO timestamp', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-15T10:30:00.000Z'));

      const result = handler.generate({ createdAt: '{{timestamp}}' });

      expect(result.createdAt).toBe('2025-06-15T10:30:00.000Z');

      vi.useRealTimers();
    });

    it('handles nested objects recursively', () => {
      const result = handler.generate({
        order: {
          id: '{{uuid}}',
          details: {
            trackingId: '{{uuid}}',
          },
        },
      });

      const order = result.order as Record<string, unknown>;
      expect(order['id']).toBe('test-uuid-1234');
      const details = order['details'] as Record<string, unknown>;
      expect(details['trackingId']).toBe('test-uuid-1234');
    });

    it('handles arrays', () => {
      const result = handler.generate({
        items: ['{{uuid}}', '{{uuid}}'],
      });

      const items = result.items as unknown[];
      expect(items).toHaveLength(2);
      expect(items[0]).toBe('test-uuid-1234');
      expect(items[1]).toBe('test-uuid-1234');
    });

    it('preserves non-template strings', () => {
      const result = handler.generate({ name: 'John Doe' });

      expect(result.name).toBe('John Doe');
    });

    it('preserves numbers and booleans', () => {
      const result = handler.generate({
        count: 42,
        active: true,
        nullable: null,
      });

      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.nullable).toBeNull();
    });

    it('replaces embedded placeholders within longer strings', () => {
      const result = handler.generate({
        label: 'order-{{uuid}}-suffix',
      });

      expect(result.label).toBe('order-test-uuid-1234-suffix');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 2: save() — file persistence
  // ═══════════════════════════════════════════════════════════════════════

  describe('save()', () => {
    it('writes JSON to the correct path and creates the directory', async () => {
      const data = { id: '123', total: 99.99 };

      await handler.save('order.json', data);

      expect(mockMkdir).toHaveBeenCalledWith(TEST_BASE_DIR, { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(
        join(TEST_BASE_DIR, 'order.json'),
        JSON.stringify(data, undefined, 2),
        'utf8',
      );
    });

    it('tracks the file for cleanup', async () => {
      await handler.save('order.json', { id: '1' });
      await handler.save('item.json', { id: '2' });

      // Verify tracking by calling cleanup and checking rm calls
      await handler.cleanup();

      // Should delete both tracked files (in reverse order) + baseDir
      expect(mockRm).toHaveBeenCalledWith(join(TEST_BASE_DIR, 'item.json'), { force: true });
      expect(mockRm).toHaveBeenCalledWith(join(TEST_BASE_DIR, 'order.json'), { force: true });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 3: load() — file reading
  // ═══════════════════════════════════════════════════════════════════════

  describe('load()', () => {
    it('reads and parses JSON from the correct path', async () => {
      const data = { id: '123', total: 99.99 };
      mockReadFile.mockResolvedValue(JSON.stringify(data));

      const result = await handler.load<{ id: string; total: number }>('order.json');

      expect(mockReadFile).toHaveBeenCalledWith(join(TEST_BASE_DIR, 'order.json'), 'utf8');
      expect(result).toStrictEqual(data);
    });

    it('throws a descriptive error when the file is not found', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      await expect(handler.load('missing.json')).rejects.toThrow(
        `Failed to load test data file "missing.json" from ${TEST_BASE_DIR}`,
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 4: cleanup() — file deletion
  // ═══════════════════════════════════════════════════════════════════════

  describe('cleanup()', () => {
    it('deletes tracked files in reverse order', async () => {
      await handler.save('first.json', {});
      await handler.save('second.json', {});
      await handler.save('third.json', {});

      vi.clearAllMocks();
      await handler.cleanup();

      // Verify reverse deletion order
      const rmCalls = mockRm.mock.calls;
      expect(rmCalls[0]?.[0]).toBe(join(TEST_BASE_DIR, 'third.json'));
      expect(rmCalls[1]?.[0]).toBe(join(TEST_BASE_DIR, 'second.json'));
      expect(rmCalls[2]?.[0]).toBe(join(TEST_BASE_DIR, 'first.json'));
    });

    it('continues on individual file deletion failure (non-fatal)', async () => {
      await handler.save('first.json', {});
      await handler.save('second.json', {});

      vi.clearAllMocks();
      mockRm
        .mockRejectedValueOnce(new Error('Permission denied'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Should not throw
      await expect(handler.cleanup()).resolves.toBeUndefined();

      // Should log warning for the failed deletion
      expect(mockChildLogger.warn).toHaveBeenCalled();

      // Should still attempt to delete the second file and baseDir
      expect(mockRm).toHaveBeenCalledTimes(3);
    });

    it('removes the base directory after deleting files', async () => {
      await handler.save('data.json', {});

      vi.clearAllMocks();
      await handler.cleanup();

      // Last rm call should be the baseDir removal
      const lastCall = mockRm.mock.calls.at(-1);
      expect(lastCall?.[0]).toBe(TEST_BASE_DIR);
      expect(lastCall?.[1]).toStrictEqual({ recursive: true, force: true });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════
  // Group 5: Logger
  // ═══════════════════════════════════════════════════════════════════════

  describe('logging', () => {
    it('creates a child logger with module name "test-data"', () => {
      expect(mockCreateLogger).toHaveBeenCalledWith('test-data');
    });
  });
});
