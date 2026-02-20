/**
 * Bulk UI5 control discovery via `page.evaluate()`.
 *
 * @remarks
 * Uses Playwright's `page.evaluate()` to enumerate all registered UI5 controls
 * on the current page via `sap.ui.core.ElementRegistry`. The browser-side
 * callback is fully self-contained — all helper logic is inlined as inner
 * function declarations because `page.evaluate()` serializes only the function
 * body; module-level imports and closures are not available in the browser.
 *
 * This file intentionally exceeds 300 LOC because `browserDiscoverControls`
 * must inline all helper functions for `page.evaluate()` serialization.
 * Module-level imports are not available in the browser callback.
 *
 * @module ai
 */
/* eslint-disable max-lines -- browser-side script requires inlined helpers for page.evaluate() serialization */

import type { AiResponse, DiscoveredControl, PageContext } from './types.js';

// ── Minimal page interface ─────────────────────────────────────────────────

/**
 * Minimal subset of Playwright's Page used by discovery functions.
 *
 * @remarks
 * Avoids importing the full `@playwright/test` dependency at module load time.
 * Any Playwright `Page` satisfies this interface structurally.
 */
export interface DiscoveryPage {
  /** Returns the current URL. */
  url(): string;
  /** Evaluates a function in the browser context. */
  evaluate(pageFunction: string | ((...args: never[]) => unknown), arg?: unknown): Promise<unknown>;
}

// ── Options ────────────────────────────────────────────────────────────────

/**
 * Options for the `discoverPage()` function.
 *
 * @example
 * ```typescript
 * const opts: DiscoverPageOptions = { interactiveOnly: true, includeHidden: false };
 * ```
 */
export interface DiscoverPageOptions {
  /** When `true`, only interactive controls are returned. Default: `false`. */
  readonly interactiveOnly?: boolean;
  /** When `true`, hidden controls are included. Default: `false`. */
  readonly includeHidden?: boolean;
  /** Discovery timeout in milliseconds. Default: `30_000`. */
  readonly timeout?: number;
}

// ── Raw control shape returned from the browser ────────────────────────────

/**
 * Raw control data shape returned by the browser-side `page.evaluate()` callback.
 *
 * @remarks
 * Exported so test files can type their mock return values without duplicating
 * this shape. Not part of the public module API — tests import it with
 * `import type`.
 */
export interface RawDiscoveredControl {
  readonly id: string;
  readonly controlType: string;
  readonly isInteractive: boolean;
  readonly isContainer: boolean;
  readonly objectCategory: string;
  readonly visible: boolean;
  readonly text: string | undefined;
}

// ── Browser-side args type ─────────────────────────────────────────────────

interface BrowserArgs {
  readonly interactiveOnly: boolean;
  readonly includeHidden: boolean;
}

// ── Node.js-side partitioning sets ────────────────────────────────────────

const BUTTON_TYPES: ReadonlySet<string> = new Set([
  'sap.m.Button',
  'sap.m.ToggleButton',
  'sap.m.MenuButton',
  'sap.m.SegmentedButton',
]);

const FORM_FIELD_TYPES: ReadonlySet<string> = new Set([
  'sap.m.Input',
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
]);

const TABLE_TYPES: ReadonlySet<string> = new Set([
  'sap.ui.table.Table', // eslint-disable-line sonarjs/no-duplicate-string -- intentionally mirrored in browser-side inner functions for page.evaluate() serialization
  'sap.m.Table',
  'sap.m.List',
  'sap.m.Tree',
  'sap.ui.comp.smarttable.SmartTable',
]);

const NAVIGATION_TYPES: ReadonlySet<string> = new Set([
  'sap.m.Link',
  'sap.m.IconTabBar', // eslint-disable-line sonarjs/no-duplicate-string -- intentionally mirrored in browser-side inner functions for page.evaluate() serialization
]);

// ── Node.js-side helpers ──────────────────────────────────────────────────

/** Derives the `DiscoveredControl.category` from raw browser flags. */
function deriveCategory(
  isInteractive: boolean,
  isContainer: boolean,
): DiscoveredControl['category'] {
  if (isInteractive) return 'interactive';
  if (isContainer) return 'container';
  return 'unknown';
}

/** Transforms one raw browser control record into a `DiscoveredControl`. */
function toDiscoveredControl(raw: RawDiscoveredControl): DiscoveredControl {
  const category = deriveCategory(raw.isInteractive, raw.isContainer);
  const objectCategoryValue = raw.objectCategory !== 'unknown' ? raw.objectCategory : undefined;

  return {
    id: raw.id,
    controlType: raw.controlType,
    category,
    visible: raw.visible,
    ...(objectCategoryValue !== undefined && { objectCategory: objectCategoryValue }),
    ...(raw.text !== undefined && { text: raw.text }),
  };
}

/** Type-narrows and casts an `unknown` browser result to `RawDiscoveredControl[]`. */
function castRawControls(value: unknown): RawDiscoveredControl[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is RawDiscoveredControl =>
      typeof item === 'object' && item !== null && 'id' in item && 'controlType' in item,
  );
}

// ── Error response builder ────────────────────────────────────────────────

function buildErrorResponse(err: unknown, duration: number): AiResponse<PageContext> {
  const message = err instanceof Error ? err.message : String(err);
  return {
    status: 'error',
    data: undefined,
    error: {
      code: 'ERR_AI_CONTEXT_BUILD_FAILED',
      message,
    },
    metadata: {
      duration,
      retryable: true,
      suggestions: [
        'Call waitForUI5Stable() before discoverPage() to ensure the framework is ready',
        'Verify the page has finished loading and UI5 has initialised (sap.ui.getCore())',
        'Check that ElementRegistry is accessible — requires UI5 version 1.106 or later',
      ],
    },
  };
}

// ── Browser-side script ───────────────────────────────────────────────────

/**
 * Self-contained browser-side discovery function.
 *
 * @remarks
 * All helpers are declared as inner function declarations so they are included
 * when `fn.toString()` serializes this function for the browser. Module-level
 * imports, closures, and variables are NOT available inside `page.evaluate()`.
 *
 * @param args - Serializable filter arguments from Node.js.
 * @returns Array of raw control descriptors found in the UI5 element registry.
 */
/* v8 ignore start -- browser-context: entire function executes in Chromium via page.evaluate(), not in Node.js */
// eslint-disable-next-line sonarjs/cognitive-complexity -- inlined helpers required by page.evaluate() serialization inflate complexity
function browserDiscoverControls(args: BrowserArgs): {
  id: string;
  controlType: string;
  isInteractive: boolean;
  isContainer: boolean;
  objectCategory: string;
  visible: boolean;
  text: string | undefined;
}[] {
  // ── Inner: interactive control type set ────────────────────────────────
  function buildInteractiveSet(): Set<string> {
    return new Set([
      'sap.m.Button',
      'sap.m.Input',
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
      'sap.m.SegmentedButton',
      'sap.m.MenuButton',
      'sap.m.ToggleButton',
      'sap.m.Link',
      'sap.m.RatingIndicator',
      'sap.m.ColorPalettePopover',
      'sap.m.MultiInput',
      'sap.m.Token',
      'sap.ui.unified.FileUploader',
      'sap.ui.table.Table',
      'sap.m.Table',
      'sap.m.List',
      'sap.m.Tree',
      'sap.m.IconTabBar',
      'sap.m.upload.UploadSet',
      'sap.ui.comp.smartfield.SmartField',
      'sap.ui.comp.smartfilterbar.SmartFilterBar',
      'sap.ui.comp.smarttable.SmartTable',
    ]);
  }

  // ── Inner: container control type set ────────────────────────────────
  function buildContainerSet(): Set<string> {
    return new Set([
      'sap.m.Page',
      'sap.m.Panel',
      'sap.m.Dialog',
      'sap.m.Popover',
      'sap.m.Shell',
      'sap.m.App',
      'sap.m.SplitApp',
      'sap.m.FlexBox',
      'sap.m.HBox',
      'sap.m.VBox',
      'sap.m.ScrollContainer',
      'sap.m.Carousel',
      'sap.m.Wizard',
      'sap.m.IconTabBar',
      'sap.m.TabContainer',
      'sap.uxap.ObjectPageLayout',
      'sap.uxap.ObjectPageSection',
      'sap.uxap.ObjectPageSubSection',
      'sap.f.DynamicPage',
      'sap.f.FlexibleColumnLayout',
      'sap.ui.layout.form.SimpleForm',
      'sap.ui.layout.form.Form',
      'sap.ui.layout.Grid',
      'sap.ui.layout.VerticalLayout',
      'sap.ui.layout.HorizontalLayout',
      'sap.ui.layout.Splitter',
      'sap.ui.table.Table',
    ]);
  }

  // ── Inner: object category detection ──────────────────────────────────
  function detectCategoryInner(typeName: string): string {
    if (typeName.endsWith('Binding') || typeName.includes('.model.Binding')) return 'binding';
    if (typeName.includes('.model.') && typeName.endsWith('Context')) return 'context';
    if (typeName.includes('.model.type.')) return 'type';
    if (typeName.includes('.routing.Router')) return 'router';
    if (typeName.endsWith('Controller')) return 'controller';
    if (typeName.includes('.base.Event')) return 'event';
    if (typeName.endsWith('Formatter')) return 'formatter';
    if (typeName.endsWith('Validator')) return 'validator';
    if (typeName.includes('UIComponent') || typeName.endsWith('Component')) return 'component';
    if (typeName.includes('Manifest')) return 'manifest';
    if (typeName.includes('ResourceBundle') || typeName.includes('i18n')) return 'i18n';
    if (typeName.includes('.model.')) return 'model';
    return 'unknown';
  }

  // ── Inner: extract text from a control ────────────────────────────────
  function getControlText(control: Record<string, unknown>): string | undefined {
    const textMethods = ['getText', 'getTitle', 'getLabel'] as const;
    for (const method of textMethods) {
      // eslint-disable-next-line security/detect-object-injection -- method is from a fixed const array
      const fn = control[method];
      if (typeof fn === 'function') {
        try {
          const t = (fn as () => unknown).call(control);
          if (typeof t === 'string' && t.length > 0) return t;
        } catch {
          // ignore
        }
      }
    }
    return undefined;
  }

  // ── Inner: extract visibility ─────────────────────────────────────────
  function getVisible(control: Record<string, unknown>): boolean {
    const fn = control['getVisible'];
    if (typeof fn === 'function') {
      try {
        return (fn as () => unknown).call(control) === true;
      } catch {
        return true;
      }
    }
    return true;
  }

  // ── Inner: get control type name ──────────────────────────────────────
  function getControlTypeName(control: Record<string, unknown>): string | undefined {
    const fn = control['getMetadata'];
    if (typeof fn !== 'function') return undefined;
    try {
      const meta = (fn as () => unknown).call(control);
      if (typeof meta !== 'object' || meta === null) return undefined;
      const getName = (meta as Record<string, unknown>)['getName'];
      if (typeof getName !== 'function') return undefined;
      return String((getName as () => unknown).call(meta));
    } catch {
      return undefined;
    }
  }

  // ── Inner: gather elements from the UI5 registry ──────────────────────
  interface SapWindow {
    sap?: {
      ui?: {
        core?: {
          ElementRegistry?: { all?: () => Record<string, unknown> };
          getCore?: () => { mElements?: Record<string, unknown> };
        };
      };
    };
  }

  const sapWindow = window as unknown as SapWindow;
  let elementsMap: Record<string, unknown> = {};
  try {
    const elementRegistry = sapWindow.sap?.ui?.core?.ElementRegistry;
    if (typeof elementRegistry?.all === 'function') {
      elementsMap = elementRegistry.all();
    } else {
      const core = sapWindow.sap?.ui?.core?.getCore?.();
      if (core?.mElements !== undefined) {
        elementsMap = core.mElements;
      }
    }
  } catch {
    return [];
  }

  const interactiveSet = buildInteractiveSet();
  const containerSet = buildContainerSet();

  const results: {
    id: string;
    controlType: string;
    isInteractive: boolean;
    isContainer: boolean;
    objectCategory: string;
    visible: boolean;
    text: string | undefined;
  }[] = [];

  for (const [id, ctrl] of Object.entries(elementsMap)) {
    if (typeof ctrl !== 'object' || ctrl === null) continue;
    const control = ctrl as Record<string, unknown>;

    const controlType = getControlTypeName(control);
    if (controlType === undefined) continue;

    const isInteractive = interactiveSet.has(controlType);
    const isContainer = containerSet.has(controlType);

    if (args.interactiveOnly && !isInteractive) continue;

    const visible = getVisible(control);
    if (!args.includeHidden && !visible) continue;

    results.push({
      id,
      controlType,
      isInteractive,
      isContainer,
      objectCategory: detectCategoryInner(controlType),
      visible,
      text: getControlText(control),
    });
  }

  return results;
}
/* v8 ignore stop */

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Discovers all UI5 controls on the current Playwright page.
 *
 * @remarks
 * Calls `sap.ui.core.ElementRegistry.all()` (UI5 ≥ 1.106) in the browser,
 * falling back to `sap.ui.getCore().mElements` for older runtimes. Each
 * discovered control is classified by interactivity, container membership, and
 * object category. The result is partitioned into `buttons`, `formFields`,
 * `tables`, and `navigationElements` for convenient AI consumption.
 *
 * The browser-side script is serialized via `fn.toString()` — module-level
 * imports are not available in the browser callback.
 *
 * @param page - Playwright `Page` instance (or any structural equivalent).
 * @param options - Optional filtering and timeout options.
 * @returns `AiResponse<PageContext>` — `'success'` with a full snapshot or
 *   `'error'` with a recoverable error payload.
 *
 * @intent Enumerate all UI5 controls for AI-driven selector generation.
 * @capability ui5-bulk-discovery
 * @sapModule All
 *
 * @example
 * ```typescript
 * import { discoverPage } from '#ai/bulk-discovery.js';
 *
 * const response = await discoverPage(page, { interactiveOnly: true });
 * if (response.status === 'success') {
 *   console.log(response.data.controls.length, 'controls found');
 * }
 * ```
 */
export async function discoverPage(
  page: DiscoveryPage,
  options: DiscoverPageOptions = {},
): Promise<AiResponse<PageContext>> {
  const start = Date.now();
  const interactiveOnly = options.interactiveOnly ?? false;
  const includeHidden = options.includeHidden ?? false;

  try {
    const url = page.url();

    const rawResult = await page.evaluate(
      /* v8 ignore start -- browser-context: executed in Chromium, not Node.js */
      browserDiscoverControls as unknown as (...args: never[]) => unknown,
      /* v8 ignore stop */
      { interactiveOnly, includeHidden },
    );

    const rawControls = castRawControls(rawResult);
    const controls = rawControls.map(toDiscoveredControl);

    const buttons = controls.filter((c) => BUTTON_TYPES.has(c.controlType));
    const formFields = controls.filter((c) => FORM_FIELD_TYPES.has(c.controlType));
    const tables = controls.filter((c) => TABLE_TYPES.has(c.controlType));
    const navigationElements = controls.filter((c) => NAVIGATION_TYPES.has(c.controlType));

    const pageContext: PageContext = {
      url,
      controls,
      buttons,
      formFields,
      tables,
      navigationElements,
      timestamp: new Date().toISOString(),
    };

    return {
      status: 'success',
      data: pageContext,
      metadata: {
        duration: Date.now() - start,
        retryable: false,
        suggestions: [],
      },
    };
  } catch (err: unknown) {
    return buildErrorResponse(err, Date.now() - start);
  }
}
