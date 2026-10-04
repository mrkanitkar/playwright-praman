/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/intents/domains/quality.ts` (QM module).
 *
 * @remarks
 * All tests are hermetic. ui5, ui5Nav, and vocabulary mocks are plain
 * vi.fn() stubs — no real bridge interaction.
 *
 * @module intents
 */

import { describe, expect, it, vi } from 'vitest';

import type { UI5Selector } from '#core/types/selectors.js';
import type { UI5HandlerSlice, VocabLookup } from '#intents/core-wrappers.js';
import * as quality from '#intents/domains/quality.js';

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

// ── createInspectionLot ─────────────────────────────────────────────────────

describe('quality.createInspectionLot', () => {
  it('navigates to InspectionLot-create and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('QM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('InspectionLot-create');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Save' },
    });
  });

  it('fills material and plant fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
    });

    // material + plant = 2 fills
    expect(ui5.fill).toHaveBeenCalledTimes(2);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
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

    const result = await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
    });

    expect(result.metadata.sapModule).toBe('QM');
    expect(result.metadata.intentName).toBe('createInspectionLot');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createInspectionLot(
      ui5,
      ui5Nav,
      vocab,
      { material: 'RAW-0001', plant: '1000' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.createInspectionLot(
      ui5,
      ui5Nav,
      vocab,
      { material: 'RAW-0001', plant: '1000' },
      { timeout: 30_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(30_000);
  });

  it('returns error when material term is not in vocabulary', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createInspectionLot(
      ui5,
      ui5Nav,
      vocab,
      { material: 'RAW-0001', plant: '1000' },
      { overrides: { appId: 'ZInspection-create' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZInspection-create');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createInspectionLot(
      ui5,
      ui5Nav,
      vocab,
      { material: 'RAW-0001', plant: '1000' },
      { overrides: { saveButtonText: 'Submit' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Submit' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createInspectionLot(
      ui5,
      ui5Nav,
      vocab,
      { material: 'RAW-0001', plant: '1000' },
      { overrides: { fields: { Material: 'Product' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Product');
  });

  it('uses all field overrides simultaneously', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createInspectionLot(
      ui5,
      ui5Nav,
      vocab,
      { material: 'RAW-0001', plant: '1000', inspectionType: '01', lotQuantity: '50' },
      {
        overrides: {
          appId: 'ZInspLot-create',
          saveButtonText: 'Submit',
          fields: {
            Material: 'Product',
            Plant: 'Werk',
            'Inspection Type': 'Insp. Type',
            'Lot Quantity': 'Qty',
          },
        },
      },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZInspLot-create');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Submit' },
    });
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Product');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Werk');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Insp. Type');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Qty');
  });

  it('fills optional inspectionType when provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
      inspectionType: '01',
    });

    expect(result.status).toBe('success');
    // material + plant + inspectionType = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
    expect(result.metadata.stepsExecuted).toContain('fillInspectionType');
  });

  it('fills optional lotQuantity when provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
      lotQuantity: '100',
    });

    expect(result.status).toBe('success');
    // material + plant + lotQuantity = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
    expect(result.metadata.stepsExecuted).toContain('fillLotQuantity');
  });

  it('fills both inspectionType and lotQuantity when provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
      inspectionType: '01',
      lotQuantity: '100',
    });

    expect(result.status).toBe('success');
    // material + plant + inspectionType + lotQuantity = 4 fills
    expect(ui5.fill).toHaveBeenCalledTimes(4);
    expect(result.metadata.stepsExecuted).toContain('fillInspectionType');
    expect(result.metadata.stepsExecuted).toContain('fillLotQuantity');
  });

  it('returns error when plant term is not found (material succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
  });

  it('returns error when inspectionType fill fails (material + plant succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
      inspectionType: '01',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
    expect(result.metadata.stepsExecuted).toContain('fillPlant');
  });

  it('returns error when lotQuantity fill fails (material + plant + type succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 3 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await quality.createInspectionLot(ui5, ui5Nav, vocab, {
      material: 'RAW-0001',
      plant: '1000',
      inspectionType: '01',
      lotQuantity: '100',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillMaterial');
    expect(result.metadata.stepsExecuted).toContain('fillPlant');
    expect(result.metadata.stepsExecuted).toContain('fillInspectionType');
  });
});

// ── recordResults ───────────────────────────────────────────────────────────

describe('quality.recordResults', () => {
  it('navigates to InspectionLot-results and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.recordResults(ui5, ui5Nav, vocab, {
      inspectionLot: '000012345678',
      result: '10.5',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('QM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('InspectionLot-results');
  });

  it('fills inspection lot and result fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.recordResults(ui5, ui5Nav, vocab, {
      inspectionLot: '000012345678',
      result: '10.5',
    });

    // inspectionLot + result = 2 fills
    expect(ui5.fill).toHaveBeenCalledTimes(2);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.recordResults(ui5, ui5Nav, vocab, {
      inspectionLot: '000012345678',
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

    const result = await quality.recordResults(ui5, ui5Nav, vocab, {
      inspectionLot: '000012345678',
    });

    expect(result.metadata.sapModule).toBe('QM');
    expect(result.metadata.intentName).toBe('recordResults');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.recordResults(
      ui5,
      ui5Nav,
      vocab,
      { inspectionLot: '000012345678' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.recordResults(
      ui5,
      ui5Nav,
      vocab,
      { inspectionLot: '000012345678' },
      { timeout: 20_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(20_000);
  });

  it('returns error when inspection lot term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await quality.recordResults(ui5, ui5Nav, vocab, {
      inspectionLot: '000012345678',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.recordResults(
      ui5,
      ui5Nav,
      vocab,
      { inspectionLot: '000012345678' },
      { overrides: { appId: 'ZResults-record' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZResults-record');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.recordResults(
      ui5,
      ui5Nav,
      vocab,
      { inspectionLot: '000012345678' },
      { overrides: { saveButtonText: 'Confirm' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Confirm' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.recordResults(
      ui5,
      ui5Nav,
      vocab,
      { inspectionLot: '000012345678' },
      { overrides: { fields: { 'Inspection Lot': 'Lot Number' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Lot Number');
  });

  it('uses all field overrides simultaneously', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.recordResults(
      ui5,
      ui5Nav,
      vocab,
      { inspectionLot: '000012345678', result: '10.5' },
      {
        overrides: {
          appId: 'ZResults-record',
          saveButtonText: 'Confirm',
          fields: {
            'Inspection Lot': 'Lot Number',
            'Mean Value': 'Result Value',
          },
        },
      },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZResults-record');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Confirm' },
    });
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Lot Number');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Result Value');
  });

  it('returns error when result fill fails (inspectionLot succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await quality.recordResults(ui5, ui5Nav, vocab, {
      inspectionLot: '000012345678',
      result: '10.5',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillInspectionLot');
  });
});

// ── createQualityNotification ───────────────────────────────────────────────

describe('quality.createQualityNotification', () => {
  it('navigates to QualityNotification-create and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.createQualityNotification(ui5, ui5Nav, vocab, {
      notificationType: 'Q1',
      description: 'Surface defect',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('QM');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('QualityNotification-create');
  });

  it('fills notification type and description fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createQualityNotification(ui5, ui5Nav, vocab, {
      notificationType: 'Q1',
      description: 'Surface defect',
    });

    // notificationType + description = 2 fills
    expect(ui5.fill).toHaveBeenCalledTimes(2);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createQualityNotification(ui5, ui5Nav, vocab, {
      notificationType: 'Q1',
      description: 'Surface defect',
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

    const result = await quality.createQualityNotification(ui5, ui5Nav, vocab, {
      notificationType: 'Q1',
      description: 'Surface defect',
    });

    expect(result.metadata.sapModule).toBe('QM');
    expect(result.metadata.intentName).toBe('createQualityNotification');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createQualityNotification(
      ui5,
      ui5Nav,
      vocab,
      { notificationType: 'Q1', description: 'Surface defect' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.createQualityNotification(
      ui5,
      ui5Nav,
      vocab,
      { notificationType: 'Q1', description: 'Surface defect' },
      { timeout: 25_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(25_000);
  });

  it('returns error when notification type term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await quality.createQualityNotification(ui5, ui5Nav, vocab, {
      notificationType: 'Q1',
      description: 'Surface defect',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createQualityNotification(
      ui5,
      ui5Nav,
      vocab,
      { notificationType: 'Q1', description: 'Surface defect' },
      { overrides: { appId: 'ZNotification-create' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZNotification-create');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createQualityNotification(
      ui5,
      ui5Nav,
      vocab,
      { notificationType: 'Q1', description: 'Surface defect' },
      { overrides: { saveButtonText: 'Create' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Create' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createQualityNotification(
      ui5,
      ui5Nav,
      vocab,
      { notificationType: 'Q1', description: 'Surface defect' },
      { overrides: { fields: { 'Notification Type': 'QN Type' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('QN Type');
  });

  it('fills optional priority when provided', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await quality.createQualityNotification(ui5, ui5Nav, vocab, {
      notificationType: 'Q1',
      description: 'Surface defect',
      priority: '1',
    });

    expect(result.status).toBe('success');
    // notificationType + description + priority = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
    expect(result.metadata.stepsExecuted).toContain('fillPriority');
  });

  it('uses all field overrides simultaneously', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await quality.createQualityNotification(
      ui5,
      ui5Nav,
      vocab,
      { notificationType: 'Q1', description: 'Surface defect', priority: '1' },
      {
        overrides: {
          appId: 'ZNotification-create',
          saveButtonText: 'Create',
          fields: {
            'Notification Type': 'QN Type',
            'Short Text': 'Description',
            Priority: 'Urgency',
          },
        },
      },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZNotification-create');
    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Create' },
    });
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('QN Type');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Description');
    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Urgency');
  });

  it('returns error when description fill fails (type succeeds)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount === 1 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await quality.createQualityNotification(ui5, ui5Nav, vocab, {
      notificationType: 'Q1',
      description: 'Surface defect',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillNotificationType');
  });

  it('returns error when priority fill fails (type + description succeed)', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    let callCount = 0;
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount <= 2 ? Promise.resolve({ id: 'field' }) : Promise.resolve(undefined);
      }),
    };

    const result = await quality.createQualityNotification(ui5, ui5Nav, vocab, {
      notificationType: 'Q1',
      description: 'Surface defect',
      priority: '1',
    });

    expect(result.status).toBe('error');
    expect(result.metadata.stepsExecuted).toContain('fillNotificationType');
    expect(result.metadata.stepsExecuted).toContain('fillDescription');
  });
});
