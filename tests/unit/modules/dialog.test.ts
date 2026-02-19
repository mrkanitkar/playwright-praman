/**
 * Tests for `src/modules/dialog.ts` -- UI5 dialog discovery, waiting, and interaction.
 *
 * @remarks
 * Verifies all dialog functions: waitForDialog, getOpenDialogs, isDialogOpen,
 * dismissDialog, confirmDialog, waitForDialogClosed, getDialogButtons, and
 * the DIALOG_CONTROL_TYPES constant.
 *
 * Mock strategy: lightweight DialogPage mock with evaluate and waitForFunction
 * that simulate browser-context dialog behavior.
 *
 * @module modules
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  DialogInfo,
  DialogButtonInfo,
  DialogPage,
  FindDialogOptions,
} from '../../../src/modules/dialog.js';

import { ControlError } from '#core/errors/control-error.js';

// Import module under test
const {
  DIALOG_CONTROL_TYPES,
  waitForDialog,
  getOpenDialogs,
  isDialogOpen,
  dismissDialog,
  confirmDialog,
  waitForDialogClosed,
  getDialogButtons,
} = await import('../../../src/modules/dialog.js');

/** Standard dialog info returned by mock page evaluations. */
const MOCK_DIALOG: DialogInfo = {
  id: 'dlg1',
  controlType: 'sap.m.Dialog',
  title: 'Confirm Delete',
  isOpen: true,
};

/** Secondary dialog for multi-dialog scenarios. */
const MOCK_DIALOG_2: DialogInfo = {
  id: 'dlg2',
  controlType: 'sap.m.SelectDialog',
  title: 'Select Item',
  isOpen: true,
};

/** Standard button info returned by mock page evaluations. */
const MOCK_BUTTON_OK: DialogButtonInfo = {
  text: 'OK',
  id: 'btn-ok',
  type: 'Emphasized',
  enabled: true,
};

const MOCK_BUTTON_CANCEL: DialogButtonInfo = {
  text: 'Cancel',
  id: 'btn-cancel',
  type: 'Default',
  enabled: true,
};

const MOCK_BUTTON_DISABLED: DialogButtonInfo = {
  text: 'Save',
  id: 'btn-save',
  type: 'Emphasized',
  enabled: false,
};

/**
 * Creates a mock DialogPage object for testing.
 *
 * The evaluate mock is configured to return sensible defaults for dialog scripts.
 * Override specific return values using `page.evaluate.mockResolvedValueOnce(...)`.
 */
function createMockPage(): {
  evaluate: ReturnType<typeof vi.fn>;
  waitForFunction: ReturnType<typeof vi.fn>;
} {
  return {
    evaluate: vi.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue(undefined),
    waitForFunction: vi.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue(undefined),
  };
}

/** Casts a mock page to DialogPage. */
function asPage(mock: ReturnType<typeof createMockPage>): DialogPage {
  return mock as unknown as DialogPage;
}

describe('dialog module', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('waitForDialog', () => {
    it('returns dialog info when a dialog is found', async () => {
      const page = createMockPage();
      // waitForFunction succeeds (dialog found), then evaluate returns the dialog info
      page.waitForFunction.mockResolvedValue(undefined);
      page.evaluate.mockResolvedValue(MOCK_DIALOG);

      const result = await waitForDialog(asPage(page));

      expect(result).toEqual(MOCK_DIALOG);
      expect(page.waitForFunction).toHaveBeenCalledTimes(1);
      expect(page.evaluate).toHaveBeenCalledTimes(1);
    });

    it('waits with default timeout and polling interval', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue(MOCK_DIALOG);

      await waitForDialog(asPage(page));

      const waitCall = page.waitForFunction.mock.calls[0] as unknown[];
      const options = waitCall[2] as { timeout: number; polling: number };
      expect(options.timeout).toBe(10_000);
      expect(options.polling).toBe(100);
    });

    it('filters by title when specified', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue(MOCK_DIALOG);

      await waitForDialog(asPage(page), { title: 'Confirm Delete' });

      // The predicate script should contain the title filter
      const predicateScript = (page.waitForFunction.mock.calls[0] as unknown[])[0] as string;
      expect(predicateScript).toContain('Confirm Delete');
    });

    it('filters by controlType when specified', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue(MOCK_DIALOG);

      await waitForDialog(asPage(page), { controlType: 'sap.m.Dialog' });

      const predicateScript = (page.waitForFunction.mock.calls[0] as unknown[])[0] as string;
      expect(predicateScript).toContain('sap.m.Dialog');
    });

    it('throws ControlError when no dialog appears within timeout', async () => {
      const page = createMockPage();
      page.waitForFunction.mockRejectedValue(new Error('Timeout'));

      await expect(waitForDialog(asPage(page), { timeout: 500 })).rejects.toThrow(ControlError);
    });

    it('uses custom timeout and polling from options', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue(MOCK_DIALOG);

      await waitForDialog(asPage(page), { timeout: 20_000, polling: 500 });

      const waitCall = page.waitForFunction.mock.calls[0] as unknown[];
      const options = waitCall[2] as { timeout: number; polling: number };
      expect(options.timeout).toBe(20_000);
      expect(options.polling).toBe(500);
    });
  });

  describe('getOpenDialogs', () => {
    it('returns empty array when no dialogs are open', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue([]);

      const result = await getOpenDialogs(asPage(page));

      expect(result).toEqual([]);
    });

    it('returns all open dialogs', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue([MOCK_DIALOG, MOCK_DIALOG_2]);

      const result = await getOpenDialogs(asPage(page));

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(MOCK_DIALOG);
      expect(result[1]).toEqual(MOCK_DIALOG_2);
    });

    it('returns correct properties for each dialog', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue([MOCK_DIALOG]);

      const result = await getOpenDialogs(asPage(page));

      expect(result[0]).toHaveProperty('id', 'dlg1');
      expect(result[0]).toHaveProperty('controlType', 'sap.m.Dialog');
      expect(result[0]).toHaveProperty('title', 'Confirm Delete');
      expect(result[0]).toHaveProperty('isOpen', true);
    });
  });

  describe('isDialogOpen', () => {
    it('returns true when the dialog is open', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue(true);

      const result = await isDialogOpen(asPage(page), 'dlg1');

      expect(result).toBe(true);
    });

    it('returns false when the dialog is closed', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue(false);

      const result = await isDialogOpen(asPage(page), 'dlg1');

      expect(result).toBe(false);
    });

    it('returns false when the dialog does not exist', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue(false);

      const result = await isDialogOpen(asPage(page), 'nonexistent');

      expect(result).toBe(false);
      expect(page.evaluate).toHaveBeenCalledTimes(1);
    });
  });

  describe('dismissDialog', () => {
    it('closes the topmost dialog', async () => {
      const page = createMockPage();
      // getOpenDialogs returns one dialog, close succeeds, stability succeeds
      page.evaluate
        .mockResolvedValueOnce([MOCK_DIALOG]) // getOpenDialogs
        .mockResolvedValueOnce(true); // close script
      page.waitForFunction.mockResolvedValue(undefined); // stability wait

      await dismissDialog(asPage(page));

      expect(page.evaluate).toHaveBeenCalledTimes(2);
    });

    it('dismisses a dialog filtered by title', async () => {
      const page = createMockPage();
      page.evaluate
        .mockResolvedValueOnce([MOCK_DIALOG, MOCK_DIALOG_2]) // getOpenDialogs
        .mockResolvedValueOnce(true); // close
      page.waitForFunction.mockResolvedValue(undefined);

      await dismissDialog(asPage(page), { title: 'Select Item' });

      // Close script should target dlg2 (filtered by title)
      const closeScript = (page.evaluate.mock.calls[1] as unknown[])[0] as string;
      expect(closeScript).toContain('dlg2');
    });

    it('waits for UI5 stability after closing', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValueOnce([MOCK_DIALOG]).mockResolvedValueOnce(true);
      page.waitForFunction.mockResolvedValue(undefined);

      await dismissDialog(asPage(page));

      expect(page.waitForFunction).toHaveBeenCalledTimes(1);
    });

    it('throws ControlError when no dialog is open', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue([]); // no dialogs

      await expect(dismissDialog(asPage(page))).rejects.toThrow(ControlError);
    });
  });

  describe('confirmDialog', () => {
    it('presses the beginButton when available', async () => {
      const page = createMockPage();
      page.evaluate
        .mockResolvedValueOnce([MOCK_DIALOG]) // getOpenDialogs
        .mockResolvedValueOnce(true); // press script succeeds

      await confirmDialog(asPage(page));

      expect(page.evaluate).toHaveBeenCalledTimes(2);
      // The press script should target the dialog
      const pressScript = (page.evaluate.mock.calls[1] as unknown[])[0] as string;
      expect(pressScript).toContain('dlg1');
    });

    it('presses button with custom text when buttonText is specified', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValueOnce([MOCK_DIALOG]).mockResolvedValueOnce(true);

      await confirmDialog(asPage(page), { buttonText: 'Delete' } as FindDialogOptions & {
        readonly buttonText?: string;
      });

      const pressScript = (page.evaluate.mock.calls[1] as unknown[])[0] as string;
      expect(pressScript).toContain('Delete');
    });

    it('falls back to common confirm labels when no beginButton', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValueOnce([MOCK_DIALOG]).mockResolvedValueOnce(true); // default path succeeds

      await confirmDialog(asPage(page));

      // The default path script includes confirm labels
      const pressScript = (page.evaluate.mock.calls[1] as unknown[])[0] as string;
      expect(pressScript).toContain('OK');
      expect(pressScript).toContain('Confirm');
      expect(pressScript).toContain('Save');
    });

    it('throws ControlError when no confirm button is found', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValueOnce([MOCK_DIALOG]).mockResolvedValueOnce(false); // no button found

      await expect(confirmDialog(asPage(page))).rejects.toThrow(ControlError);
    });
  });

  describe('waitForDialogClosed', () => {
    it('resolves when dialog is closed', async () => {
      const page = createMockPage();
      page.waitForFunction.mockResolvedValue(undefined);

      await expect(waitForDialogClosed(asPage(page), 'dlg1')).resolves.toBeUndefined();
      expect(page.waitForFunction).toHaveBeenCalledTimes(1);
    });

    it('throws ControlError when dialog remains open after timeout', async () => {
      const page = createMockPage();
      page.waitForFunction.mockRejectedValue(new Error('Timeout'));

      await expect(waitForDialogClosed(asPage(page), 'dlg1', { timeout: 500 })).rejects.toThrow(
        ControlError,
      );
    });
  });

  describe('getDialogButtons', () => {
    it('returns all buttons from a dialog by ID', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue([MOCK_BUTTON_OK, MOCK_BUTTON_CANCEL]);

      const result = await getDialogButtons(asPage(page), 'dlg1');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(MOCK_BUTTON_OK);
      expect(result[1]).toEqual(MOCK_BUTTON_CANCEL);
    });

    it('includes type and enabled properties for each button', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue([MOCK_BUTTON_OK, MOCK_BUTTON_DISABLED]);

      const result = await getDialogButtons(asPage(page), 'dlg1');

      expect(result[0]).toHaveProperty('type', 'Emphasized');
      expect(result[0]).toHaveProperty('enabled', true);
      expect(result[1]).toHaveProperty('enabled', false);
    });

    it('returns empty array when dialog has no buttons', async () => {
      const page = createMockPage();
      page.evaluate.mockResolvedValue([]);

      const result = await getDialogButtons(asPage(page), 'dlg1');

      expect(result).toEqual([]);
    });

    it('uses topmost dialog when no dialogId is provided', async () => {
      const page = createMockPage();
      // First evaluate: getOpenDialogs returns dialogs
      page.evaluate
        .mockResolvedValueOnce([MOCK_DIALOG, MOCK_DIALOG_2]) // getOpenDialogs
        .mockResolvedValueOnce([MOCK_BUTTON_OK]); // getDialogButtons for topmost

      const result = await getDialogButtons(asPage(page));

      expect(result).toHaveLength(1);
      // The buttons script should target the topmost dialog (dlg2)
      const buttonsScript = (page.evaluate.mock.calls[1] as unknown[])[0] as string;
      expect(buttonsScript).toContain('dlg2');
    });
  });

  describe('DIALOG_CONTROL_TYPES', () => {
    it('contains sap.m.Dialog', () => {
      expect(DIALOG_CONTROL_TYPES).toContain('sap.m.Dialog');
    });

    it('contains all expected dialog types', () => {
      const expectedTypes = [
        'sap.m.Dialog',
        'sap.m.Popover',
        'sap.m.ResponsivePopover',
        'sap.m.MessageBox',
        'sap.m.BusyDialog',
        'sap.m.SelectDialog',
        'sap.m.TableSelectDialog',
        'sap.m.ViewSettingsDialog',
        'sap.ui.comp.valuehelpdialog.ValueHelpDialog',
        'sap.ui.comp.p13n.P13nDialog',
      ];

      for (const type of expectedTypes) {
        expect(DIALOG_CONTROL_TYPES).toContain(type);
      }
      expect(DIALOG_CONTROL_TYPES).toHaveLength(expectedTypes.length);
    });
  });
});
