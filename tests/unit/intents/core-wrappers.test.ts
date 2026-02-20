/**
 * Tests for `src/intents/core-wrappers.ts`.
 *
 * @remarks
 * All tests are hermetic: ui5, ui5Nav, and vocabulary mocks are plain
 * object literals or `vi.fn()` stubs — no real UI5 bridge is invoked.
 *
 * @module intents
 */

import { describe, expect, it, vi } from 'vitest';

import type { UI5Selector } from '#core/types/selectors.js';
import type { UI5HandlerSlice, VocabLookup } from '#intents/core-wrappers.js';
import {
  assertField,
  clickButton,
  confirmAndWait,
  fillField,
  navigateAndSearch,
  selectOption,
  waitForSave,
} from '#intents/core-wrappers.js';

// ── Test helpers ──────────────────────────────────────────────────────────────

/** Creates a minimal UI5HandlerSlice mock with all methods stubbed to resolve void. */
function makeUI5(): UI5HandlerSlice & {
  click: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  getText: ReturnType<typeof vi.fn>;
  waitForUI5: ReturnType<typeof vi.fn>;
  control: ReturnType<typeof vi.fn>;
} {
  return {
    control: vi.fn().mockResolvedValue({}),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockResolvedValue(undefined),
    getText: vi.fn().mockResolvedValue(''),
    waitForUI5: vi.fn().mockResolvedValue(undefined),
  };
}

/** Creates a VocabLookup mock that resolves the given selector. */
function makeVocab(selector: UI5Selector | undefined): VocabLookup {
  return {
    getFieldSelector: vi.fn().mockResolvedValue(selector),
  };
}

// ── fillField ─────────────────────────────────────────────────────────────────

describe('fillField', () => {
  it('calls ui5.fill with the resolved selector on success', async () => {
    const ui5 = makeUI5();
    const selector: UI5Selector = { id: 'vendorInput' };
    const vocab = makeVocab(selector);

    const result = await fillField(ui5, vocab, 'Vendor', '100001');

    expect(result.status).toBe('success');
    expect(ui5.fill).toHaveBeenCalledOnce();
    expect(ui5.fill).toHaveBeenCalledWith(selector, '100001');
  });

  it('returns status error with ERR_VOCAB_TERM_NOT_FOUND when term is unknown', async () => {
    const ui5 = makeUI5();
    const vocab = makeVocab(undefined);

    const result = await fillField(ui5, vocab, 'UnknownField', 'value');

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
    expect(result.error?.message).toContain('UnknownField');
    expect(ui5.fill).not.toHaveBeenCalled();
  });

  it('populates IntentResult metadata envelope correctly on success', async () => {
    const ui5 = makeUI5();
    const vocab = makeVocab({ controlType: 'sap.m.Input' });

    const result = await fillField(ui5, vocab, 'Material', 'MAT-001');

    expect(result.metadata.intentName).toBe('fillField');
    expect(result.metadata.sapModule).toBe('CORE');
    expect(result.metadata.stepsExecuted).toContain('fill');
    expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
  });

  it('includes stepsExecuted resolveSelector even on error', async () => {
    const ui5 = makeUI5();
    const vocab = makeVocab(undefined);

    const result = await fillField(ui5, vocab, 'Ghost', 'x');

    expect(result.metadata.stepsExecuted).toContain('resolveSelector');
  });
});

// ── clickButton ───────────────────────────────────────────────────────────────

describe('clickButton', () => {
  it('calls ui5.click with sap.m.Button + text selector', async () => {
    const ui5 = makeUI5();

    const result = await clickButton(ui5, 'Save');

    expect(result.status).toBe('success');
    expect(ui5.click).toHaveBeenCalledOnce();
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
  });

  it('returns intentName clickButton and sapModule CORE', async () => {
    const ui5 = makeUI5();
    const result = await clickButton(ui5, 'Post');

    expect(result.metadata.intentName).toBe('clickButton');
    expect(result.metadata.sapModule).toBe('CORE');
  });
});

// ── selectOption ──────────────────────────────────────────────────────────────

describe('selectOption', () => {
  it('calls ui5.select with the resolved selector and option key', async () => {
    const ui5 = makeUI5();
    const selector: UI5Selector = { id: 'purchOrgSelect' };
    const vocab = makeVocab(selector);

    const result = await selectOption(ui5, vocab, 'Purchasing Org', '1000');

    expect(result.status).toBe('success');
    expect(ui5.select).toHaveBeenCalledOnce();
    expect(ui5.select).toHaveBeenCalledWith(selector, '1000');
  });

  it('returns error when term is not found', async () => {
    const ui5 = makeUI5();
    const vocab = makeVocab(undefined);

    const result = await selectOption(ui5, vocab, 'Missing', 'val');

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
    expect(ui5.select).not.toHaveBeenCalled();
  });
});

// ── assertField ───────────────────────────────────────────────────────────────

describe('assertField', () => {
  it('returns success when actual text matches expected', async () => {
    const ui5 = makeUI5();
    (ui5.getText as ReturnType<typeof vi.fn>).mockResolvedValue('In Process');
    const vocab = makeVocab({ id: 'statusLabel' });

    const result = await assertField(ui5, vocab, 'Status', 'In Process');

    expect(result.status).toBe('success');
  });

  it('returns error when actual text does not match expected', async () => {
    const ui5 = makeUI5();
    (ui5.getText as ReturnType<typeof vi.fn>).mockResolvedValue('Completed');
    const vocab = makeVocab({ id: 'statusLabel' });

    const result = await assertField(ui5, vocab, 'Status', 'In Process');

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_INTENT_VALIDATION_FAILED');
    expect(result.error?.message).toContain('Status');
  });

  it('returns error when term is not found', async () => {
    const ui5 = makeUI5();
    const vocab = makeVocab(undefined);

    const result = await assertField(ui5, vocab, 'Ghost', 'value');

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });
});

// ── confirmAndWait ────────────────────────────────────────────────────────────

describe('confirmAndWait', () => {
  it('clicks OK and then calls waitForUI5', async () => {
    const ui5 = makeUI5();

    const result = await confirmAndWait(ui5);

    expect(result.status).toBe('success');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'OK' },
    });
    expect(ui5.waitForUI5).toHaveBeenCalledOnce();
    expect(result.metadata.stepsExecuted).toContain('waitForUI5');
  });

  it('falls back to Confirm button when OK click throws', async () => {
    const ui5 = makeUI5();
    (ui5.click as ReturnType<typeof vi.fn>)
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValue(undefined);

    const result = await confirmAndWait(ui5);

    expect(result.status).toBe('success');
    expect(ui5.click).toHaveBeenCalledTimes(2);
    expect(ui5.click).toHaveBeenNthCalledWith(2, {
      controlType: 'sap.m.Button',
      properties: { text: 'Confirm' },
    });
    expect(result.metadata.stepsExecuted).toContain('clickConfirm');
  });

  it('populates intentName and sapModule correctly', async () => {
    const ui5 = makeUI5();
    const result = await confirmAndWait(ui5);

    expect(result.metadata.intentName).toBe('confirmAndWait');
    expect(result.metadata.sapModule).toBe('CORE');
  });
});

// ── waitForSave ───────────────────────────────────────────────────────────────

describe('waitForSave', () => {
  it('calls ui5.waitForUI5 and returns success', async () => {
    const ui5 = makeUI5();

    const result = await waitForSave(ui5);

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledOnce();
    expect(result.metadata.stepsExecuted).toContain('waitForUI5');
  });

  it('passes timeout option to waitForUI5', async () => {
    const ui5 = makeUI5();

    await waitForSave(ui5, { timeout: 15_000 });

    expect(ui5.waitForUI5).toHaveBeenCalledWith(15_000);
  });
});

// ── navigateAndSearch ─────────────────────────────────────────────────────────

describe('navigateAndSearch', () => {
  it('navigates, fills criteria fields, then clicks Go', async () => {
    const ui5 = makeUI5();
    const ui5Nav = { navigateToApp: vi.fn().mockResolvedValue(undefined) };
    const selector: UI5Selector = { id: 'vendorFilter' };
    const vocab = makeVocab(selector);

    const result = await navigateAndSearch(ui5, ui5Nav, vocab, 'PurchaseOrder-manage', {
      Vendor: '100001',
    });

    expect(result.status).toBe('success');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('PurchaseOrder-manage');
    expect(ui5.fill).toHaveBeenCalledWith(selector, '100001');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Go' },
    });
    expect(result.metadata.stepsExecuted).toContain('navigate');
    expect(result.metadata.stepsExecuted).toContain('clickGo');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = { navigateToApp: vi.fn().mockResolvedValue(undefined) };
    const vocab = makeVocab({ id: 'f' });

    await navigateAndSearch(
      ui5,
      ui5Nav,
      vocab,
      'SalesOrder-manage',
      {},
      {
        skipNavigation: true,
      },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('returns error when a criterion term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = { navigateToApp: vi.fn().mockResolvedValue(undefined) };
    const vocab = makeVocab(undefined);

    const result = await navigateAndSearch(ui5, ui5Nav, vocab, 'PurchaseOrder-manage', {
      UnknownField: 'val',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });
});
