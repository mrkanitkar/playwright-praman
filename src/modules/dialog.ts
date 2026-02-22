/* eslint-disable max-lines -- 7 public functions with TSDoc + browser scripts exceed 300 LOC */
/**
 * Dialog discovery, waiting, and interaction for UI5 dialogs in the static UI area.
 *
 * @remarks
 * UI5 dialogs live in the static UI area (`sap-ui-static`), not the normal view tree.
 * Browser scripts query `sap.ui.getCore().getUIArea('sap-ui-static').getContent()`
 * to find open dialogs. All browser-context code uses string scripts via `page.evaluate()`.
 *
 * @example
 * ```typescript
 * import { waitForDialog, getOpenDialogs, dismissDialog } from '../modules/dialog.js';
 *
 * await waitForDialog(page, { title: 'Confirm' });
 * const dialogs = await getOpenDialogs(page);
 * await dismissDialog(page);
 * ```
 *
 * @module modules
 */

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

/**
 * UI5 control types recognized as dialogs in the static UI area.
 *
 * @example
 * ```typescript
 * import { DIALOG_CONTROL_TYPES } from '../modules/dialog.js';
 * ```
 */
export const DIALOG_CONTROL_TYPES = [
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
] as const;

/** Union of all recognized dialog control type strings. */
export type DialogControlType = (typeof DIALOG_CONTROL_TYPES)[number];

/**
 * Base options for dialog operations.
 *
 * @example
 * ```typescript
 * const opts: DialogOptions = { timeout: 5000, polling: 200 };
 * ```
 */
export interface DialogOptions {
  readonly timeout?: number;
  readonly polling?: number;
  readonly skipStabilityWait?: boolean;
}

/**
 * Options for finding a specific dialog.
 *
 * @example
 * ```typescript
 * const opts: FindDialogOptions = { title: 'Confirm Delete' };
 * ```
 */
export interface FindDialogOptions extends DialogOptions {
  readonly title?: string;
  readonly controlType?: string;
}

/**
 * Information about a discovered dialog in the static UI area.
 *
 * @example
 * ```typescript
 * const info: DialogInfo = { id: 'dlg1', controlType: 'sap.m.Dialog', title: 'Confirm', isOpen: true };
 * ```
 */
export interface DialogInfo {
  readonly id: string;
  readonly controlType: string;
  readonly title: string;
  readonly isOpen: boolean;
}

/**
 * Information about a button within a dialog.
 *
 * @example
 * ```typescript
 * const btn: DialogButtonInfo = { text: 'OK', id: 'btn1', type: 'Emphasized', enabled: true };
 * ```
 */
export interface DialogButtonInfo {
  readonly text: string;
  readonly id: string;
  readonly type?: string;
  readonly enabled: boolean;
}

/**
 * Minimal page interface for dialog operations.
 *
 * @example
 * ```typescript
 * const page: DialogPage = { evaluate: async (s) => ({}), waitForFunction: async (s) => ({}) };
 * ```
 */
export interface DialogPage {
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { readonly timeout?: number; readonly polling?: number },
  ): Promise<unknown>;
}

const CONFIRM_LABELS = ['OK', 'Yes', 'Confirm', 'Save', 'Accept', 'Submit'] as const;
const DT_JSON = JSON.stringify([...DIALOG_CONTROL_TYPES]);
const BY_ID_TRY = '(function(){try{var c=sap.ui.getCore().byId(';
const BY_ID_BARE = '(function(){var c=sap.ui.getCore().byId(';

// Shared browser script fragments (reduces duplication)
const STATIC_AREA_OPEN = 'var core=sap.ui.getCore();var area=core.getUIArea("sap-ui-static");';
const CTRL_INFO =
  'var dlgTitle=typeof c.getTitle==="function"?c.getTitle():"";' +
  'var isOpen=typeof c.isOpen==="function"?c.isOpen():true;if(!isOpen)continue;';
const TYPE_CHECK =
  'var tn=c.getMetadata().getName();var isD=false;' +
  'for(var t=0;t<ts.length;t++){if(tn===ts[t]){isD=true;break;}}if(!isD)continue;';

function dialogScanScript(titleFilter: string, typeFilter: string, returnAll: boolean): string {
  const push = returnAll
    ? 'r.push({id:c.getId(),controlType:tn,title:dlgTitle,isOpen:true});'
    : 'return{id:c.getId(),controlType:tn,title:dlgTitle,isOpen:true};';
  const dir = returnAll ? 'var i=0;i<ct.length;i++' : 'var i=ct.length-1;i>=0;i--';
  return (
    '(function(){try{' +
    STATIC_AREA_OPEN +
    'if(!area)return ' +
    (returnAll ? '[]' : 'null') +
    ';' +
    'var ct=area.getContent();var ts=' +
    DT_JSON +
    ';' +
    (returnAll ? 'var r=[];' : '') +
    'for(' +
    dir +
    '){var c=ct[i];' +
    TYPE_CHECK +
    CTRL_INFO +
    titleFilter +
    typeFilter +
    push +
    '}' +
    'return ' +
    (returnAll ? 'r' : 'null') +
    ';' +
    '}catch(e){return ' +
    (returnAll ? '[]' : 'null') +
    ';}})()'
  );
}

// ── Dialog Discovery & Query ────────────────────────────────────────────────

/**
 * Waits for a dialog to appear in the UI5 static UI area.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Options to filter by title or control type.
 * @returns Information about the discovered dialog.
 * @throws ControlError if no matching dialog appears within the timeout.
 *
 * @example
 * ```typescript
 * const info = await waitForDialog(page, { title: 'Confirm Delete' });
 * ```
 */
export async function waitForDialog(
  page: DialogPage,
  options?: FindDialogOptions,
): Promise<DialogInfo> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY;
  const polling = options?.polling ?? DEFAULT_TIMEOUTS.POLLING_INTERVAL;
  const tf =
    options?.title !== undefined
      ? 'if(dlgTitle!==' + JSON.stringify(options.title) + ')continue;'
      : '';
  const cf =
    options?.controlType !== undefined
      ? 'if(tn!==' + JSON.stringify(options.controlType) + ')continue;'
      : '';
  const predicate = dialogScanScript(tf, cf, false);
  try {
    await page.waitForFunction('!!(' + predicate + ')', undefined, { timeout, polling });
  } catch {
    const titleLabel = options?.title;
    const base = 'No dialog found within ' + String(timeout) + 'ms';
    const msg = titleLabel !== undefined ? base + ' with title "' + titleLabel + '"' : base;
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: msg,
      attempted: 'Wait for UI5 dialog in static UI area',
      retryable: true,
      details: { title: titleLabel, controlType: options?.controlType, timeout },
      suggestions: [
        'Verify the action that triggers the dialog has been executed',
        'Increase the timeout if the dialog takes longer to appear',
        'Check if the dialog type is included in DIALOG_CONTROL_TYPES',
      ],
    });
  }
  return page.evaluate<DialogInfo>(predicate);
}

/**
 * Returns all currently open dialogs in the UI5 static UI area.
 *
 * @param page - Playwright Page (or compatible subset).
 * @returns Array of dialog information objects (may be empty).
 *
 * @example
 * ```typescript
 * const dialogs = await getOpenDialogs(page);
 * ```
 */
export async function getOpenDialogs(page: DialogPage): Promise<readonly DialogInfo[]> {
  return page.evaluate<readonly DialogInfo[]>(dialogScanScript('', '', true));
}

/**
 * Checks whether a specific dialog (by ID) is currently open.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param dialogId - The UI5 control ID of the dialog.
 * @returns `true` if the dialog exists and is open, `false` otherwise.
 *
 * @example
 * ```typescript
 * const open = await isDialogOpen(page, 'confirmDialog');
 * ```
 */
export async function isDialogOpen(page: DialogPage, dialogId: string): Promise<boolean> {
  return page.evaluate<boolean>(
    BY_ID_TRY +
      JSON.stringify(dialogId) +
      ');if(!c)return false;return typeof c.isOpen==="function"?c.isOpen():false;}catch(e){return false;}})()',
  );
}

// ── Dialog Actions ──────────────────────────────────────────────────────────

/**
 * Dismisses (closes) the topmost dialog, or a dialog matching the given title.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Options to target a specific dialog by title.
 * @throws ControlError if no open dialog is found to dismiss.
 *
 * @example
 * ```typescript
 * await dismissDialog(page);
 * ```
 */
export async function dismissDialog(page: DialogPage, options?: FindDialogOptions): Promise<void> {
  const dialog = await findTopmostDialog(page, options);
  await page.evaluate<boolean>(
    BY_ID_BARE +
      JSON.stringify(dialog.id) +
      ');if(c&&typeof c.close==="function"){c.close();return true;}return false;})()',
  );
  if (options?.skipStabilityWait !== true) {
    const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_WAIT;
    const polling = options?.polling ?? DEFAULT_TIMEOUTS.POLLING_INTERVAL;
    await page.waitForFunction(
      '(function(){try{return sap.ui.getCore().getUIPending()===0;}catch(e){return true;}})()',
      undefined,
      { timeout, polling },
    );
  }
}

/**
 * Confirms a dialog by pressing its begin button or a button matching common confirm labels.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Options to filter which dialog and optionally specify a custom button text.
 * @throws ControlError if no open dialog or confirm button is found.
 *
 * @example
 * ```typescript
 * await confirmDialog(page);
 * ```
 */
export async function confirmDialog(
  page: DialogPage,
  options?: FindDialogOptions & { readonly buttonText?: string },
): Promise<void> {
  const dialog = await findTopmostDialog(page, options);
  const btnText = options?.buttonText;
  const script =
    btnText !== undefined
      ? buildCustomBtnScript(dialog.id, btnText)
      : buildDefaultBtnScript(dialog.id);
  const pressed = await page.evaluate<boolean>(script);
  if (!pressed) {
    const base = 'No confirm button found in dialog "' + dialog.title + '" (' + dialog.id + ')';
    const attempted =
      'Confirm dialog "' +
      dialog.title +
      '"' +
      (btnText !== undefined ? ' with button "' + btnText + '"' : '');
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: base,
      attempted,
      retryable: false,
      details: { dialogId: dialog.id, buttonText: btnText },
      suggestions: [
        'Check the dialog has a beginButton or buttons aggregation',
        'Specify a custom buttonText matching the desired button label',
        'Use getDialogButtons() to inspect available buttons',
      ],
    });
  }
}

function buildCustomBtnScript(id: string, btnText: string): string {
  const idJ = JSON.stringify(id);
  const txtJ = JSON.stringify(btnText);
  return (
    BY_ID_BARE +
    idJ +
    ');if(!c)return false;' +
    'var bs=typeof c.getButtons==="function"?c.getButtons():[];' +
    'var bb=typeof c.getBeginButton==="function"?c.getBeginButton():null;' +
    'var eb=typeof c.getEndButton==="function"?c.getEndButton():null;' +
    'var a=[];if(bb)a.push(bb);if(eb)a.push(eb);' +
    'for(var b=0;b<bs.length;b++)a.push(bs[b]);' +
    'for(var i=0;i<a.length;i++){if(typeof a[i].getText==="function"&&a[i].getText()===' +
    txtJ +
    ')' +
    '{a[i].firePress();return true;}}return false;})()'
  );
}

function buildDefaultBtnScript(id: string): string {
  const idJ = JSON.stringify(id);
  const labels = JSON.stringify([...CONFIRM_LABELS]);
  return (
    BY_ID_BARE +
    idJ +
    ');if(!c)return false;' +
    'var bb=typeof c.getBeginButton==="function"?c.getBeginButton():null;' +
    'if(bb){bb.firePress();return true;}' +
    'var bs=typeof c.getButtons==="function"?c.getButtons():[];var ls=' +
    labels +
    ';' +
    'for(var i=0;i<bs.length;i++){var t=typeof bs[i].getText==="function"?bs[i].getText():"";' +
    'for(var l=0;l<ls.length;l++){if(t===ls[l]){bs[i].firePress();return true;}}}return false;})()'
  );
}

// ── Dialog Assertions & Helpers ─────────────────────────────────────────────

/**
 * Waits for a specific dialog to be closed.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param dialogId - The UI5 control ID of the dialog.
 * @param options - Timeout and polling options.
 * @throws ControlError if the dialog is still open after the timeout.
 *
 * @example
 * ```typescript
 * await waitForDialogClosed(page, 'confirmDialog');
 * ```
 */
export async function waitForDialogClosed(
  page: DialogPage,
  dialogId: string,
  options?: DialogOptions,
): Promise<void> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY;
  const polling = options?.polling ?? DEFAULT_TIMEOUTS.POLLING_INTERVAL;
  const pred =
    BY_ID_TRY +
    JSON.stringify(dialogId) +
    ');if(!c)return true;return typeof c.isOpen==="function"?!c.isOpen():true;}catch(e){return true;}})()';
  try {
    await page.waitForFunction(pred, undefined, { timeout, polling });
  } catch {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: 'Dialog "' + dialogId + '" still open after ' + String(timeout) + 'ms',
      attempted: 'Wait for dialog "' + dialogId + '" to close',
      retryable: true,
      details: { dialogId, timeout },
      suggestions: [
        'Verify the dismiss or confirm action was executed',
        'Increase the timeout for slow-closing dialogs',
        'Check if another dialog is blocking closure',
      ],
    });
  }
}

/**
 * Returns all buttons within a dialog (beginButton, endButton, and buttons aggregation).
 *
 * @param page - Playwright Page (or compatible subset).
 * @param dialogId - The UI5 control ID of the dialog. If omitted, uses the topmost open dialog.
 * @returns Array of button information objects.
 *
 * @example
 * ```typescript
 * const buttons = await getDialogButtons(page, 'confirmDialog');
 * ```
 */
export async function getDialogButtons(
  page: DialogPage,
  dialogId?: string,
): Promise<readonly DialogButtonInfo[]> {
  let targetId = dialogId;
  if (targetId === undefined) {
    const dlgs = await getOpenDialogs(page);
    const top = dlgs[dlgs.length - 1];
    if (top === undefined) {
      return [];
    }
    targetId = top.id;
  }
  const idJ = JSON.stringify(targetId);
  const script =
    BY_ID_TRY +
    idJ +
    ');if(!c)return [];var r=[];' +
    'function ab(b){if(!b)return;r.push({text:typeof b.getText==="function"?b.getText():"",id:b.getId(),' +
    'type:typeof b.getType==="function"?b.getType():undefined,' +
    'enabled:typeof b.getEnabled==="function"?b.getEnabled():true});}' +
    'if(typeof c.getBeginButton==="function")ab(c.getBeginButton());' +
    'if(typeof c.getEndButton==="function")ab(c.getEndButton());' +
    'var bs=typeof c.getButtons==="function"?c.getButtons():[];' +
    'for(var i=0;i<bs.length;i++)ab(bs[i]);return r;}catch(e){return [];}})()';
  return page.evaluate<readonly DialogButtonInfo[]>(script);
}

async function findTopmostDialog(
  page: DialogPage,
  options?: FindDialogOptions,
): Promise<DialogInfo> {
  const dialogs = await getOpenDialogs(page);
  let candidates = [...dialogs];
  if (options?.title !== undefined) {
    candidates = candidates.filter((d) => d.title === options.title);
  }
  if (options?.controlType !== undefined) {
    candidates = candidates.filter((d) => d.controlType === options.controlType);
  }
  const topmost = candidates[candidates.length - 1];
  if (topmost === undefined) {
    const title = options?.title;
    const msg =
      title !== undefined
        ? 'No open dialog found with title "' + title + '"'
        : 'No open dialog found';
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: msg,
      attempted: 'Find topmost open dialog in static UI area',
      retryable: true,
      details: { title, controlType: options?.controlType },
      suggestions: [
        'Verify a dialog is currently open',
        'Use waitForDialog() before attempting to interact',
        'Check that the dialog title matches exactly (case-sensitive)',
      ],
    });
  }
  return topmost;
}
