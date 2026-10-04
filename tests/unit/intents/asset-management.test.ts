/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/intents/domains/asset-management.ts` (AM module).
 *
 * @module intents
 */

import { describe, expect, it, vi } from 'vitest';

import type { UI5Selector } from '#core/types/selectors.js';
import type { UI5HandlerSlice, VocabLookup } from '#intents/core-wrappers.js';
import * as assetManagement from '#intents/domains/asset-management.js';

// ── Test helpers ──────────────────────────────────────────────────────────────

type UI5Mock = UI5HandlerSlice & {
  click: ReturnType<typeof vi.fn>;
  fill: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  getText: ReturnType<typeof vi.fn>;
  waitForUI5: ReturnType<typeof vi.fn>;
  control: ReturnType<typeof vi.fn>;
};

function makeUI5(): UI5Mock {
  return {
    control: vi.fn().mockResolvedValue({}),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockResolvedValue(undefined),
    getText: vi.fn().mockResolvedValue(''),
    waitForUI5: vi.fn().mockResolvedValue(undefined),
  };
}

function makeNav(): {
  navigateToApp: ReturnType<typeof vi.fn<(appId: string, options?: unknown) => Promise<void>>>;
  navigateToHash: ReturnType<typeof vi.fn<(hash: string, options?: unknown) => Promise<void>>>;
} {
  return {
    navigateToApp: vi
      .fn<(appId: string, options?: unknown) => Promise<void>>()
      .mockResolvedValue(undefined),
    navigateToHash: vi
      .fn<(hash: string, options?: unknown) => Promise<void>>()
      .mockResolvedValue(undefined),
  };
}

function makeVocab(selector: UI5Selector = { id: 'field' }): VocabLookup {
  return {
    getFieldSelector: vi.fn().mockResolvedValue(selector),
  };
}

// ── acquireAsset ────────────────────────────────────────────────────────────

describe('assetManagement.acquireAsset', () => {
  it('navigates to Asset-acquire and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await assetManagement.acquireAsset(ui5, ui5Nav, vocab, {
      assetClass: '1000',
      description: 'CNC Machine',
      acquisitionValue: 150_000,
      capitalizationDate: '2026-04-01',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('AM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Asset-acquire');
  });

  it('fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.acquireAsset(ui5, ui5Nav, vocab, {
      assetClass: '1000',
      description: 'CNC Machine',
      acquisitionValue: 150_000,
      capitalizationDate: '2026-04-01',
    });

    // assetClass + description + acquisitionValue + capitalizationDate = 4 fills
    expect(ui5.fill).toHaveBeenCalledTimes(4);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.acquireAsset(ui5, ui5Nav, vocab, {
      assetClass: '1000',
      description: 'CNC Machine',
      acquisitionValue: 150_000,
      capitalizationDate: '2026-04-01',
    });

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
  });

  it('returns result with correct sapModule', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await assetManagement.acquireAsset(ui5, ui5Nav, vocab, {
      assetClass: '1000',
      description: 'CNC Machine',
      acquisitionValue: 150_000,
      capitalizationDate: '2026-04-01',
    });

    expect(result.metadata.sapModule).toBe('AM');
    expect(result.metadata.intentName).toBe('acquireAsset');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.acquireAsset(
      ui5,
      ui5Nav,
      vocab,
      {
        assetClass: '1000',
        description: 'CNC Machine',
        acquisitionValue: 150_000,
        capitalizationDate: '2026-04-01',
      },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await assetManagement.acquireAsset(
      ui5,
      ui5Nav,
      vocab,
      {
        assetClass: '1000',
        description: 'CNC Machine',
        acquisitionValue: 150_000,
        capitalizationDate: '2026-04-01',
      },
      { timeout: 30_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(30_000);
  });

  it('returns error when asset class term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await assetManagement.acquireAsset(ui5, ui5Nav, vocab, {
      assetClass: '1000',
      description: 'CNC Machine',
      acquisitionValue: 150_000,
      capitalizationDate: '2026-04-01',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.acquireAsset(
      ui5,
      ui5Nav,
      vocab,
      {
        assetClass: '1000',
        description: 'CNC Machine',
        acquisitionValue: 150_000,
        capitalizationDate: '2026-04-01',
      },
      { overrides: { appId: 'ZAsset-acquire' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZAsset-acquire');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.acquireAsset(
      ui5,
      ui5Nav,
      vocab,
      {
        assetClass: '1000',
        description: 'CNC Machine',
        acquisitionValue: 150_000,
        capitalizationDate: '2026-04-01',
      },
      { overrides: { saveButtonText: 'Capitalize' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Capitalize' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.acquireAsset(
      ui5,
      ui5Nav,
      vocab,
      {
        assetClass: '1000',
        description: 'CNC Machine',
        acquisitionValue: 150_000,
        capitalizationDate: '2026-04-01',
      },
      { overrides: { fields: { 'Asset Class': 'Class' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Class');
  });

  it('uses all field overrides simultaneously', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.acquireAsset(
      ui5,
      ui5Nav,
      vocab,
      {
        assetClass: '1000',
        description: 'CNC Machine',
        acquisitionValue: 150_000,
        capitalizationDate: '2026-04-01',
      },
      {
        overrides: {
          appId: 'ZAsset-acquire',
          saveButtonText: 'Capitalize',
          fields: {
            'Asset Class': 'Class',
            Description: 'Asset Desc.',
            'Acquisition Value': 'Acq. Value',
            'Capitalization Date': 'Cap. Date',
          },
        },
      },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZAsset-acquire');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Capitalize' },
    });
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Class');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Asset Desc.');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Acq. Value');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Cap. Date');
  });

  it('returns error when description term is not found (assetClass succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await assetManagement.acquireAsset(ui5, ui5Nav, vocab, {
      assetClass: '1000',
      description: 'CNC Machine',
      acquisitionValue: 150_000,
      capitalizationDate: '2026-04-01',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillAssetClass');
  });

  it('returns error when acquisitionValue term is not found (class + desc succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await assetManagement.acquireAsset(ui5, ui5Nav, vocab, {
      assetClass: '1000',
      description: 'CNC Machine',
      acquisitionValue: 150_000,
      capitalizationDate: '2026-04-01',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillAssetClass');
    expect(result.metadata.stepsExecuted).toContain('fillDescription');
  });

  it('returns error when capitalizationDate term is not found (class + desc + val succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 3 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await assetManagement.acquireAsset(ui5, ui5Nav, vocab, {
      assetClass: '1000',
      description: 'CNC Machine',
      acquisitionValue: 150_000,
      capitalizationDate: '2026-04-01',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillAssetClass');
    expect(result.metadata.stepsExecuted).toContain('fillDescription');
    expect(result.metadata.stepsExecuted).toContain('fillAcquisitionValue');
  });
});

// ── retireAsset ─────────────────────────────────────────────────────────────

describe('assetManagement.retireAsset', () => {
  it('navigates to Asset-retire and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await assetManagement.retireAsset(ui5, ui5Nav, vocab, {
      assetNumber: '000000001000',
      retirementDate: '2026-06-30',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('AM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Asset-retire');
  });

  it('fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.retireAsset(ui5, ui5Nav, vocab, {
      assetNumber: '000000001000',
      retirementDate: '2026-06-30',
    });

    // assetNumber + retirementDate = 2 fills
    expect(ui5.fill).toHaveBeenCalledTimes(2);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.retireAsset(ui5, ui5Nav, vocab, {
      assetNumber: '000000001000',
      retirementDate: '2026-06-30',
    });

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
  });

  it('returns result with correct sapModule', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await assetManagement.retireAsset(ui5, ui5Nav, vocab, {
      assetNumber: '000000001000',
      retirementDate: '2026-06-30',
    });

    expect(result.metadata.sapModule).toBe('AM');
    expect(result.metadata.intentName).toBe('retireAsset');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.retireAsset(
      ui5,
      ui5Nav,
      vocab,
      { assetNumber: '000000001000', retirementDate: '2026-06-30' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await assetManagement.retireAsset(
      ui5,
      ui5Nav,
      vocab,
      { assetNumber: '000000001000', retirementDate: '2026-06-30' },
      { timeout: 20_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(20_000);
  });

  it('returns error when asset number term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await assetManagement.retireAsset(ui5, ui5Nav, vocab, {
      assetNumber: '000000001000',
      retirementDate: '2026-06-30',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.retireAsset(
      ui5,
      ui5Nav,
      vocab,
      { assetNumber: '000000001000', retirementDate: '2026-06-30' },
      { overrides: { appId: 'ZAsset-scrap' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZAsset-scrap');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.retireAsset(
      ui5,
      ui5Nav,
      vocab,
      { assetNumber: '000000001000', retirementDate: '2026-06-30' },
      { overrides: { saveButtonText: 'Retire' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Retire' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.retireAsset(
      ui5,
      ui5Nav,
      vocab,
      { assetNumber: '000000001000', retirementDate: '2026-06-30' },
      { overrides: { fields: { 'Asset Number': 'Main Asset No.' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Main Asset No.');
  });

  it('uses all field overrides simultaneously', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.retireAsset(
      ui5,
      ui5Nav,
      vocab,
      { assetNumber: '000000001000', retirementDate: '2026-06-30' },
      {
        overrides: {
          appId: 'ZAsset-scrap',
          saveButtonText: 'Retire',
          fields: {
            'Asset Number': 'Main Asset No.',
            'Retirement Date': 'Scrap Date',
          },
        },
      },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZAsset-scrap');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Retire' },
    });
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Main Asset No.');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Scrap Date');
  });

  it('returns error when retirementDate term is not found (assetNumber succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await assetManagement.retireAsset(ui5, ui5Nav, vocab, {
      assetNumber: '000000001000',
      retirementDate: '2026-06-30',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillAssetNumber');
  });
});

// ── transferAsset ───────────────────────────────────────────────────────────

describe('assetManagement.transferAsset', () => {
  it('navigates to Asset-transfer and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await assetManagement.transferAsset(ui5, ui5Nav, vocab, {
      sourceAsset: '000000001000',
      targetAsset: '000000002000',
      transferDate: '2026-07-01',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('AM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Asset-transfer');
  });

  it('fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.transferAsset(ui5, ui5Nav, vocab, {
      sourceAsset: '000000001000',
      targetAsset: '000000002000',
      transferDate: '2026-07-01',
    });

    // sourceAsset + targetAsset + transferDate = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.transferAsset(ui5, ui5Nav, vocab, {
      sourceAsset: '000000001000',
      targetAsset: '000000002000',
      transferDate: '2026-07-01',
    });

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
  });

  it('returns result with correct sapModule', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await assetManagement.transferAsset(ui5, ui5Nav, vocab, {
      sourceAsset: '000000001000',
      targetAsset: '000000002000',
      transferDate: '2026-07-01',
    });

    expect(result.metadata.sapModule).toBe('AM');
    expect(result.metadata.intentName).toBe('transferAsset');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.transferAsset(
      ui5,
      ui5Nav,
      vocab,
      { sourceAsset: '000000001000', targetAsset: '000000002000', transferDate: '2026-07-01' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await assetManagement.transferAsset(
      ui5,
      ui5Nav,
      vocab,
      { sourceAsset: '000000001000', targetAsset: '000000002000', transferDate: '2026-07-01' },
      { timeout: 25_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(25_000);
  });

  it('returns error when source asset term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await assetManagement.transferAsset(ui5, ui5Nav, vocab, {
      sourceAsset: '000000001000',
      targetAsset: '000000002000',
      transferDate: '2026-07-01',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.transferAsset(
      ui5,
      ui5Nav,
      vocab,
      { sourceAsset: '000000001000', targetAsset: '000000002000', transferDate: '2026-07-01' },
      { overrides: { appId: 'ZAsset-move' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZAsset-move');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.transferAsset(
      ui5,
      ui5Nav,
      vocab,
      { sourceAsset: '000000001000', targetAsset: '000000002000', transferDate: '2026-07-01' },
      { overrides: { saveButtonText: 'Transfer' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Transfer' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.transferAsset(
      ui5,
      ui5Nav,
      vocab,
      { sourceAsset: '000000001000', targetAsset: '000000002000', transferDate: '2026-07-01' },
      { overrides: { fields: { 'Source Asset': 'From Asset' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('From Asset');
  });

  it('uses all field overrides simultaneously', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await assetManagement.transferAsset(
      ui5,
      ui5Nav,
      vocab,
      { sourceAsset: '000000001000', targetAsset: '000000002000', transferDate: '2026-07-01' },
      {
        overrides: {
          appId: 'ZAsset-move',
          saveButtonText: 'Transfer',
          fields: {
            'Source Asset': 'From Asset',
            'Target Asset': 'To Asset',
            'Transfer Date': 'Posting Date',
          },
        },
      },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZAsset-move');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Transfer' },
    });
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('From Asset');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('To Asset');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Posting Date');
  });

  it('returns error when targetAsset term is not found (sourceAsset succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await assetManagement.transferAsset(ui5, ui5Nav, vocab, {
      sourceAsset: '000000001000',
      targetAsset: '000000002000',
      transferDate: '2026-07-01',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillSourceAsset');
  });

  it('returns error when transferDate term is not found (source + target succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await assetManagement.transferAsset(ui5, ui5Nav, vocab, {
      sourceAsset: '000000001000',
      targetAsset: '000000002000',
      transferDate: '2026-07-01',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillSourceAsset');
    expect(result.metadata.stepsExecuted).toContain('fillTargetAsset');
  });
});
