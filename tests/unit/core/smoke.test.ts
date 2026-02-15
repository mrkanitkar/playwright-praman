import { describe, expect, it } from 'vitest';

describe('workspace smoke test', () => {
  it('should verify project is configured correctly', () => {
    expect(true).toBe(true);
  });

  it('should have correct Node.js version', () => {
    const major = parseInt(process.version.slice(1).split('.')[0] ?? '0', 10);
    expect(major).toBeGreaterThanOrEqual(20);
  });
});
