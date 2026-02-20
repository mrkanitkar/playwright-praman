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

  // ── 9. castRawControls — non-array browser result ──────────────────────

  it('returns empty controls when page.evaluate returns a non-array value', async () => {
    page.evaluate.mockResolvedValue('not-an-array');

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls).toHaveLength(0);
    }
  });

  it('returns empty controls when page.evaluate returns null', async () => {
    page.evaluate.mockResolvedValue(null);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls).toHaveLength(0);
    }
  });

  it('returns empty controls when page.evaluate returns undefined', async () => {
    page.evaluate.mockResolvedValue(undefined);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls).toHaveLength(0);
    }
  });

  // ── 10. castRawControls — filtering invalid items ──────────────────────

  it('filters out array items that are not objects', async () => {
    page.evaluate.mockResolvedValue([buttonRaw, 'invalid-string', 42, null, true]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls).toHaveLength(1);
      expect(result.data.controls[0]?.id).toBe('submitBtn');
    }
  });

  it('filters out objects missing the id property', async () => {
    page.evaluate.mockResolvedValue([
      buttonRaw,
      {
        controlType: 'sap.m.Button',
        isInteractive: true,
        isContainer: false,
        objectCategory: 'unknown',
        visible: true,
        text: undefined,
      },
    ]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls).toHaveLength(1);
    }
  });

  it('filters out objects missing the controlType property', async () => {
    page.evaluate.mockResolvedValue([
      buttonRaw,
      {
        id: 'orphan',
        isInteractive: true,
        isContainer: false,
        objectCategory: 'unknown',
        visible: true,
        text: undefined,
      },
    ]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls).toHaveLength(1);
    }
  });

  // ── 11. buildErrorResponse — non-Error thrown ──────────────────────────

  it('handles a thrown string value (non-Error) with String() coercion', async () => {
    page.evaluate.mockRejectedValue('connection refused');

    const result = await discoverPage(page as never);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.message).toBe('connection refused');
      expect(result.error.code).toBe('ERR_AI_CONTEXT_BUILD_FAILED');
      expect(result.metadata.retryable).toBe(true);
    }
  });

  it('handles a thrown number value (non-Error) with String() coercion', async () => {
    page.evaluate.mockRejectedValue(404);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.message).toBe('404');
    }
  });

  it('handles a thrown null value (non-Error) with String() coercion', async () => {
    page.evaluate.mockRejectedValue(null);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.message).toBe('null');
    }
  });

  // ── 12. deriveCategory — unknown category ──────────────────────────────

  it('assigns unknown category when control is neither interactive nor container', async () => {
    const unknownRaw: RawControl = {
      id: 'staticText',
      controlType: 'sap.m.Text',
      isInteractive: false,
      isContainer: false,
      objectCategory: 'unknown',
      visible: true,
      text: 'Hello',
    };
    page = makeMockPage([unknownRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      const ctrl = result.data.controls[0];
      expect(ctrl?.category).toBe('unknown');
    }
  });

  // ── 13. Additional button types partitioning ───────────────────────────

  it('partitions ToggleButton into the buttons array', async () => {
    const toggleRaw: RawControl = {
      id: 'toggleBtn',
      controlType: 'sap.m.ToggleButton',
      isInteractive: true,
      isContainer: false,
      objectCategory: 'unknown',
      visible: true,
      text: 'Toggle',
    };
    page = makeMockPage([toggleRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.buttons).toHaveLength(1);
      expect(result.data.buttons[0]?.controlType).toBe('sap.m.ToggleButton');
    }
  });

  it('partitions MenuButton into the buttons array', async () => {
    const menuBtnRaw: RawControl = {
      id: 'menuBtn',
      controlType: 'sap.m.MenuButton',
      isInteractive: true,
      isContainer: false,
      objectCategory: 'unknown',
      visible: true,
      text: 'Menu',
    };
    page = makeMockPage([menuBtnRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.buttons).toHaveLength(1);
      expect(result.data.buttons[0]?.controlType).toBe('sap.m.MenuButton');
    }
  });

  it('partitions SegmentedButton into the buttons array', async () => {
    const segBtnRaw: RawControl = {
      id: 'segBtn',
      controlType: 'sap.m.SegmentedButton',
      isInteractive: true,
      isContainer: false,
      objectCategory: 'unknown',
      visible: true,
      text: undefined,
    };
    page = makeMockPage([segBtnRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.buttons).toHaveLength(1);
      expect(result.data.buttons[0]?.controlType).toBe('sap.m.SegmentedButton');
    }
  });

  // ── 14. Additional form field types partitioning ───────────────────────

  it('partitions various form field types correctly', async () => {
    const formFieldTypes = [
      'sap.m.Select',
      'sap.m.ComboBox',
      'sap.m.MultiComboBox',
      'sap.m.CheckBox',
      'sap.m.RadioButton',
      'sap.m.Switch',
      'sap.m.DatePicker',
      'sap.m.TimePicker',
      'sap.m.DateTimePicker',
      'sap.m.SearchField',
      'sap.m.TextArea',
      'sap.m.Slider',
      'sap.m.RangeSlider',
      'sap.m.StepInput',
      'sap.m.MultiInput',
      'sap.ui.comp.smartfield.SmartField',
      'sap.ui.comp.smartfilterbar.SmartFilterBar',
    ] as const;

    const rawControls: RawControl[] = formFieldTypes.map((ct, idx) => ({
      id: `formField${String(idx)}`,
      controlType: ct,
      isInteractive: true,
      isContainer: false,
      objectCategory: 'unknown',
      visible: true,
      text: undefined,
    }));
    page = makeMockPage(rawControls);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.formFields).toHaveLength(formFieldTypes.length);
    }
  });

  // ── 15. Additional table types partitioning ────────────────────────────

  it('partitions all table types correctly', async () => {
    const tableTypes = [
      'sap.ui.table.Table',
      'sap.m.Table',
      'sap.m.List',
      'sap.m.Tree',
      'sap.ui.comp.smarttable.SmartTable',
    ] as const;

    const rawControls: RawControl[] = tableTypes.map((ct, idx) => ({
      id: `table${String(idx)}`,
      controlType: ct,
      isInteractive: true,
      isContainer: false,
      objectCategory: 'unknown',
      visible: true,
      text: undefined,
    }));
    page = makeMockPage(rawControls);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.tables).toHaveLength(tableTypes.length);
    }
  });

  // ── 16. Additional navigation types partitioning ───────────────────────

  it('partitions IconTabBar into the navigationElements array', async () => {
    const iconTabRaw: RawControl = {
      id: 'iconTab',
      controlType: 'sap.m.IconTabBar',
      isInteractive: true,
      isContainer: false,
      objectCategory: 'unknown',
      visible: true,
      text: undefined,
    };
    page = makeMockPage([iconTabRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.navigationElements).toHaveLength(1);
      expect(result.data.navigationElements[0]?.controlType).toBe('sap.m.IconTabBar');
    }
  });

  // ── 17. Controls not in any partition category ─────────────────────────

  it('does not include non-button/non-field/non-table/non-nav controls in partition arrays', async () => {
    const labelRaw: RawControl = {
      id: 'myLabel',
      controlType: 'sap.m.Label',
      isInteractive: false,
      isContainer: false,
      objectCategory: 'unknown',
      visible: true,
      text: 'Name:',
    };
    page = makeMockPage([labelRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls).toHaveLength(1);
      expect(result.data.buttons).toHaveLength(0);
      expect(result.data.formFields).toHaveLength(0);
      expect(result.data.tables).toHaveLength(0);
      expect(result.data.navigationElements).toHaveLength(0);
    }
  });

  // ── 18. page.url() is called and used ──────────────────────────────────

  it('uses the URL returned by page.url()', async () => {
    page = makeMockPage([], 'https://custom.app/path#hash');

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.url).toBe('https://custom.app/path#hash');
    }
  });

  // ── 19. Success metadata has empty suggestions and retryable=false ─────

  it('success metadata has retryable=false and empty suggestions', async () => {
    page = makeMockPage([buttonRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.metadata.retryable).toBe(false);
      expect(result.metadata.suggestions).toEqual([]);
    }
  });

  // ── 20. page.url() throwing triggers error path ────────────────────────

  it('returns error when page.url() throws', async () => {
    page.url.mockImplementation(() => {
      throw new Error('detached frame');
    });

    const result = await discoverPage(page as never);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.error.message).toContain('detached frame');
    }
  });

  // ── 21. Mixed controls — comprehensive partitioning ────────────────────

  it('correctly partitions a mix of all control categories', async () => {
    page = makeMockPage([buttonRaw, inputRaw, tableRaw, linkRaw, pageContainerRaw, modelRaw]);

    const result = await discoverPage(page as never);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.controls).toHaveLength(6);
      expect(result.data.buttons).toHaveLength(1);
      expect(result.data.formFields).toHaveLength(1);
      expect(result.data.tables).toHaveLength(1);
      expect(result.data.navigationElements).toHaveLength(1);
    }
  });
});
