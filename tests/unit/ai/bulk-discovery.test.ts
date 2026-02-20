/**
 * Unit tests for `src/ai/bulk-discovery.ts`.
 *
 * @remarks
 * `page.evaluate()` is mocked to return pre-built raw control arrays,
 * simulating what the browser-side callback would produce. The tests verify
 * control categorisation, text handling, option forwarding, and error paths.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { discoverPage } from '../../../src/ai/bulk-discovery.js';
import type { DiscoverPageOptions } from '../../../src/ai/bulk-discovery.js';

// ── Type helpers ────────────────────────────────────────────────────────────

interface RawControl {
  id: string;
  controlType: string;
  isInteractive: boolean;
  isContainer: boolean;
  objectCategory: string;
  visible: boolean;
  text: string | undefined;
}

// ── Mock page factory ────────────────────────────────────────────────────────

interface MockPage {
  url: ReturnType<typeof vi.fn>;
  evaluate: ReturnType<typeof vi.fn>;
}

function makeMockPage(rawControls: RawControl[] = [], url = 'https://my.fiori.app/'): MockPage {
  return {
    url: vi.fn().mockReturnValue(url),
    evaluate: vi.fn().mockResolvedValue(rawControls),
  };
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const buttonRaw: RawControl = {
  id: 'submitBtn',
  controlType: 'sap.m.Button',
  isInteractive: true,
  isContainer: false,
  objectCategory: 'unknown',
  visible: true,
  text: 'Submit',
};

const inputRaw: RawControl = {
  id: 'nameInput',
  controlType: 'sap.m.Input',
  isInteractive: true,
  isContainer: false,
  objectCategory: 'unknown',
  visible: true,
  text: undefined,
};

const tableRaw: RawControl = {
  id: 'mainTable',
  controlType: 'sap.m.Table',
  isInteractive: true,
  isContainer: false,
  objectCategory: 'unknown',
  visible: true,
  text: undefined,
};

const linkRaw: RawControl = {
  id: 'homeLink',
  controlType: 'sap.m.Link',
  isInteractive: true,
  isContainer: false,
  objectCategory: 'unknown',
  visible: true,
  text: 'Home',
};

const pageContainerRaw: RawControl = {
  id: 'mainPage',
  controlType: 'sap.m.Page',
  isInteractive: false,
  isContainer: true,
  objectCategory: 'unknown',
  visible: true,
  text: undefined,
};

const modelRaw: RawControl = {
  id: 'someModel',
  controlType: 'sap.ui.model.json.JSONModel',
  isInteractive: false,
  isContainer: false,
  objectCategory: 'model',
  visible: true,
  text: undefined,
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('discoverPage', () => {
  let page: ReturnType<typeof makeMockPage>;

  beforeEach(() => {
    page = makeMockPage();
  });

  // ── 1. Success path with PageContext ──────────────────────────────────────

  it('returns success status with PageContext when controls are returned', async () => {
    page = makeMockPage([buttonRaw, inputRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.url).toBe('https://my.fiori.app/');
      expect(result.data.controls).toHaveLength(2);
      expect(result.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  // ── 2. Correct categorisation ─────────────────────────────────────────────

  it('categorises interactive controls correctly', async () => {
    page = makeMockPage([buttonRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const ctrl = result.data.controls[0];
      expect(ctrl?.category).toBe('interactive');
    }
  });

  it('categorises container controls correctly when not interactive', async () => {
    page = makeMockPage([pageContainerRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const ctrl = result.data.controls[0];
      expect(ctrl?.category).toBe('container');
    }
  });

  it('partitions buttons into the buttons array', async () => {
    page = makeMockPage([buttonRaw, inputRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.buttons).toHaveLength(1);
      expect(result.data.buttons[0]?.id).toBe('submitBtn');
    }
  });

  it('partitions form fields into the formFields array', async () => {
    page = makeMockPage([buttonRaw, inputRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.formFields).toHaveLength(1);
      expect(result.data.formFields[0]?.id).toBe('nameInput');
    }
  });

  it('partitions tables into the tables array', async () => {
    page = makeMockPage([tableRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.tables).toHaveLength(1);
      expect(result.data.tables[0]?.id).toBe('mainTable');
    }
  });

  it('partitions navigation elements into the navigationElements array', async () => {
    page = makeMockPage([linkRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.navigationElements).toHaveLength(1);
      expect(result.data.navigationElements[0]?.id).toBe('homeLink');
    }
  });

  // ── 3. Error path ─────────────────────────────────────────────────────────

  it('returns error status when page.evaluate throws', async () => {
    page.evaluate.mockRejectedValue(new Error('Page not found'));

    const result = await discoverPage(page as never);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.data).toBeUndefined();
      expect(result.error.code).toBe('ERR_AI_CONTEXT_BUILD_FAILED');
      expect(result.error.message).toContain('Page not found');
    }
  });

  it('returns error with retryable=true when evaluate throws', async () => {
    page.evaluate.mockRejectedValue(new Error('timeout'));

    const result = await discoverPage(page as never);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.metadata.retryable).toBe(true);
    }
  });

  // ── 4. Text handling ──────────────────────────────────────────────────────

  it('includes text on DiscoveredControl when text is present', async () => {
    page = makeMockPage([buttonRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const ctrl = result.data.controls[0];
      expect(ctrl?.text).toBe('Submit');
    }
  });

  it('omits text property from DiscoveredControl when text is undefined', async () => {
    page = makeMockPage([inputRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const ctrl = result.data.controls[0];
      expect('text' in (ctrl ?? {})).toBe(false);
    }
  });

  // ── 5. Options forwarded to evaluate ─────────────────────────────────────

  it('passes interactiveOnly and includeHidden args to page.evaluate', async () => {
    const opts: DiscoverPageOptions = { interactiveOnly: true, includeHidden: true };

    await discoverPage(page as never, opts);

    const callArgs = page.evaluate.mock.calls[0] as [
      unknown,
      { interactiveOnly: boolean; includeHidden: boolean },
    ];
    expect(callArgs[1]).toEqual({ interactiveOnly: true, includeHidden: true });
  });

  it('passes interactiveOnly=false and includeHidden=false when not specified', async () => {
    await discoverPage(page as never);

    const callArgs = page.evaluate.mock.calls[0] as [
      unknown,
      { interactiveOnly: boolean; includeHidden: boolean },
    ];
    expect(callArgs[1]).toEqual({ interactiveOnly: false, includeHidden: false });
  });

  // ── 6. Empty page ─────────────────────────────────────────────────────────

  it('returns empty arrays for an empty page', async () => {
    page = makeMockPage([]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls).toHaveLength(0);
      expect(result.data.buttons).toHaveLength(0);
      expect(result.data.formFields).toHaveLength(0);
      expect(result.data.tables).toHaveLength(0);
      expect(result.data.navigationElements).toHaveLength(0);
    }
  });

  // ── 7. Metadata ───────────────────────────────────────────────────────────

  it('metadata has a numeric duration on success', async () => {
    page = makeMockPage([buttonRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(typeof result.metadata.duration).toBe('number');
      expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
    }
  });

  it('metadata has a numeric duration on error', async () => {
    page.evaluate.mockRejectedValue(new Error('boom'));

    const result = await discoverPage(page as never);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(typeof result.metadata.duration).toBe('number');
    }
  });

  it('metadata suggestions is an array of strings on error', async () => {
    page.evaluate.mockRejectedValue(new Error('boom'));

    const result = await discoverPage(page as never);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(Array.isArray(result.metadata.suggestions)).toBe(true);
      expect(result.metadata.suggestions.length).toBeGreaterThan(0);
      for (const s of result.metadata.suggestions) {
        expect(typeof s).toBe('string');
      }
    }
  });

  // ── 8. objectCategory handling ────────────────────────────────────────────

  it('sets objectCategory on DiscoveredControl when category is not unknown', async () => {
    page = makeMockPage([modelRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const ctrl = result.data.controls[0];
      expect(ctrl?.objectCategory).toBe('model');
    }
  });

  it('omits objectCategory when raw objectCategory is unknown', async () => {
    page = makeMockPage([buttonRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const ctrl = result.data.controls[0];
      expect('objectCategory' in (ctrl ?? {})).toBe(false);
    }
  });
});
