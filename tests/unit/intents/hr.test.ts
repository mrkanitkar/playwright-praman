/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/intents/domains/hr.ts` (HR module).
 *
 * @module intents
 */

import { describe, expect, it, vi } from 'vitest';

import type { UI5Selector } from '#core/types/selectors.js';
import type { UI5HandlerSlice, VocabLookup } from '#intents/core-wrappers.js';
import * as hr from '#intents/domains/hr.js';

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

// ── createEmployee ──────────────────────────────────────────────────────────

describe('hr.createEmployee', () => {
  it('navigates to Employee-create and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await hr.createEmployee(ui5, ui5Nav, vocab, {
      firstName: 'Max',
      lastName: 'Mustermann',
      personnelArea: '1000',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('HR');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('Employee-create');
  });

  it('fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.createEmployee(ui5, ui5Nav, vocab, {
      firstName: 'Max',
      lastName: 'Mustermann',
      personnelArea: '1000',
    });

    // firstName + lastName + personnelArea = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.createEmployee(ui5, ui5Nav, vocab, {
      firstName: 'Max',
      lastName: 'Mustermann',
      personnelArea: '1000',
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

    const result = await hr.createEmployee(ui5, ui5Nav, vocab, {
      firstName: 'Max',
      lastName: 'Mustermann',
      personnelArea: '1000',
    });

    expect(result.metadata.sapModule).toBe('HR');
    expect(result.metadata.intentName).toBe('createEmployee');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.createEmployee(
      ui5,
      ui5Nav,
      vocab,
      { firstName: 'Max', lastName: 'Mustermann', personnelArea: '1000' },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await hr.createEmployee(
      ui5,
      ui5Nav,
      vocab,
      { firstName: 'Max', lastName: 'Mustermann', personnelArea: '1000' },
      { timeout: 30_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(30_000);
  });

  it('returns error when first name term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await hr.createEmployee(ui5, ui5Nav, vocab, {
      firstName: 'Max',
      lastName: 'Mustermann',
      personnelArea: '1000',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.createEmployee(
      ui5,
      ui5Nav,
      vocab,
      { firstName: 'Max', lastName: 'Mustermann', personnelArea: '1000' },
      { overrides: { appId: 'ZEmployee-hire' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZEmployee-hire');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.createEmployee(
      ui5,
      ui5Nav,
      vocab,
      { firstName: 'Max', lastName: 'Mustermann', personnelArea: '1000' },
      { overrides: { saveButtonText: 'Hire' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Hire' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.createEmployee(
      ui5,
      ui5Nav,
      vocab,
      { firstName: 'Max', lastName: 'Mustermann', personnelArea: '1000' },
      { overrides: { fields: { 'First Name': 'Given Name' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Given Name');
  });
});

// ── recordTime ──────────────────────────────────────────────────────────────

describe('hr.recordTime', () => {
  it('navigates to TimeEntry-create and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await hr.recordTime(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      date: '2026-04-15',
      hours: 8,
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('HR');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('TimeEntry-create');
  });

  it('fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.recordTime(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      date: '2026-04-15',
      hours: 8,
    });

    // employeeId + date + hours = 3 fills
    expect(ui5.fill).toHaveBeenCalledTimes(3);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.recordTime(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      date: '2026-04-15',
      hours: 8,
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

    const result = await hr.recordTime(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      date: '2026-04-15',
      hours: 8,
    });

    expect(result.metadata.sapModule).toBe('HR');
    expect(result.metadata.intentName).toBe('recordTime');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.recordTime(
      ui5,
      ui5Nav,
      vocab,
      { employeeId: '00001234', date: '2026-04-15', hours: 8 },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await hr.recordTime(
      ui5,
      ui5Nav,
      vocab,
      { employeeId: '00001234', date: '2026-04-15', hours: 8 },
      { timeout: 20_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(20_000);
  });

  it('returns error when employee ID term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await hr.recordTime(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      date: '2026-04-15',
      hours: 8,
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.recordTime(
      ui5,
      ui5Nav,
      vocab,
      { employeeId: '00001234', date: '2026-04-15', hours: 8 },
      { overrides: { appId: 'ZCAT2-record' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZCAT2-record');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.recordTime(
      ui5,
      ui5Nav,
      vocab,
      { employeeId: '00001234', date: '2026-04-15', hours: 8 },
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

    await hr.recordTime(
      ui5,
      ui5Nav,
      vocab,
      { employeeId: '00001234', date: '2026-04-15', hours: 8 },
      { overrides: { fields: { 'Employee ID': 'Personnel No.' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Personnel No.');
  });
});

// ── requestAbsence ──────────────────────────────────────────────────────────

describe('hr.requestAbsence', () => {
  it('navigates to LeaveRequest-create and saves', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await hr.requestAbsence(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      absenceType: '0100',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
    });

    expect(result.status).toBe('success');
    expect(result.metadata.sapModule).toBe('HR');
    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('LeaveRequest-create');
  });

  it('fills required fields', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.requestAbsence(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      absenceType: '0100',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
    });

    // employeeId + absenceType + startDate + endDate = 4 fills
    expect(ui5.fill).toHaveBeenCalledTimes(4);
  });

  it('clicks Save button', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.requestAbsence(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      absenceType: '0100',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
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

    const result = await hr.requestAbsence(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      absenceType: '0100',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
    });

    expect(result.metadata.sapModule).toBe('HR');
    expect(result.metadata.intentName).toBe('requestAbsence');
  });

  it('skips navigation when skipNavigation is true', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.requestAbsence(
      ui5,
      ui5Nav,
      vocab,
      {
        employeeId: '00001234',
        absenceType: '0100',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
      },
      { skipNavigation: true },
    );

    expect(ui5Nav.navigateToApp).not.toHaveBeenCalled();
  });

  it('passes timeout option to waitForSave', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    const result = await hr.requestAbsence(
      ui5,
      ui5Nav,
      vocab,
      {
        employeeId: '00001234',
        absenceType: '0100',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
      },
      { timeout: 25_000 },
    );

    expect(result.status).toBe('success');
    expect(ui5.waitForUI5).toHaveBeenCalledWith(25_000);
  });

  it('returns error when employee ID term is not found', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab: VocabLookup = {
      getFieldSelector: vi.fn().mockResolvedValue(undefined),
    };

    const result = await hr.requestAbsence(ui5, ui5Nav, vocab, {
      employeeId: '00001234',
      absenceType: '0100',
      startDate: '2026-05-01',
      endDate: '2026-05-05',
    });

    expect(result.status).toBe('error');
    expect(result.error?.code).toBe('ERR_VOCAB_TERM_NOT_FOUND');
  });

  it('uses custom appId from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.requestAbsence(
      ui5,
      ui5Nav,
      vocab,
      {
        employeeId: '00001234',
        absenceType: '0100',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
      },
      { overrides: { appId: 'ZLeave-apply' } },
    );

    expect(ui5Nav.navigateToApp).toHaveBeenCalledWith('ZLeave-apply');
  });

  it('uses custom saveButtonText from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.requestAbsence(
      ui5,
      ui5Nav,
      vocab,
      {
        employeeId: '00001234',
        absenceType: '0100',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
      },
      { overrides: { saveButtonText: 'Submit Request' } },
    );

    expect(ui5.click).toHaveBeenCalledWith({
      controlType: 'sap.m.Button',
      properties: { text: 'Submit Request' },
    });
  });

  it('uses custom field label from overrides', async () => {
    const ui5 = makeUI5();
    const ui5Nav = makeNav();
    const vocab = makeVocab();

    await hr.requestAbsence(
      ui5,
      ui5Nav,
      vocab,
      {
        employeeId: '00001234',
        absenceType: '0100',
        startDate: '2026-05-01',
        endDate: '2026-05-05',
      },
      { overrides: { fields: { 'Employee ID': 'Pernr' } } },
    );

    expect(vocab.getFieldSelector).toHaveBeenCalledWith('Pernr');
  });
});
