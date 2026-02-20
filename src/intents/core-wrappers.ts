/**
 * Core intent wrappers — low-level building blocks for SAP intent domain functions.
 *
 * @remarks
 * These functions accept a minimal `UI5HandlerSlice` (structural sub-type of
 * `UI5Handler`) and an optional `VocabLookup` to decouple the intent layer from
 * fixture internals. Each wrapper returns a typed `IntentResult<T>` envelope.
 *
 * Design principles:
 * - No circular imports: core-wrappers does NOT import from any domain file.
 * - Vocabulary term resolution is done here; callers receive `IntentResult` with
 *   `status: 'error'` when a term cannot be resolved.
 * - `navigateAndSearch` is a convenience wrapper used by domain search functions.
 *
 * @module intents
 */

import type { IntentOptions, IntentResult } from './types.js';

import type { UI5Selector } from '#core/types/selectors.js';

// ── Shared constants ───────────────────────────────────────────────────────

/** Common module identifier used in core-wrapper IntentResult metadata. */
const CORE_MODULE = 'CORE';

/** Error code string for vocabulary term not found. */
const VOCAB_NOT_FOUND_CODE = 'ERR_VOCAB_TERM_NOT_FOUND';

/** Suffix appended to suggestions for vocabulary lookup failures. */
const VOCAB_SUGGESTION_SUFFIX = 'Use getBusinessTermSuggestions() to find available terms';

/** SAP Button control type string — used in all button selectors. */
const SAP_BUTTON_TYPE = 'sap.m.Button';

// ── Structural interfaces ──────────────────────────────────────────────────

/**
 * Minimal UI5 interaction API required by core-wrappers.
 *
 * @remarks
 * Declared as a structural interface so the wrappers can be unit-tested
 * with simple mock objects without importing the full `UI5Handler` class.
 *
 * @example
 * ```typescript
 * const ui5: UI5HandlerSlice = {
 *   control: vi.fn(),
 *   click: vi.fn(),
 *   fill: vi.fn(),
 *   select: vi.fn(),
 *   getText: vi.fn(),
 *   waitForUI5: vi.fn(),
 * };
 * ```
 */
export interface UI5HandlerSlice {
  /** Discovers a single UI5 control matching the selector. */
  control(selector: UI5Selector, options?: { readonly timeout?: number }): Promise<unknown>;
  /** Clicks the UI5 control matching the selector. */
  click(selector: UI5Selector): Promise<void>;
  /** Fills the UI5 control matching the selector with the given text. */
  fill(selector: UI5Selector, value: string): Promise<void>;
  /** Selects an item in a selection control. */
  select(selector: UI5Selector, key: string): Promise<void>;
  /** Gets the visible text of the UI5 control matching the selector. */
  getText(selector: UI5Selector): Promise<string>;
  /** Waits for UI5 to reach a stable (idle) state. */
  waitForUI5(timeout?: number): Promise<void>;
}

/**
 * Minimal vocabulary lookup interface required by core-wrappers.
 *
 * @remarks
 * Compatible with the full `VocabularyService` from the vocabulary module.
 * Declared inline to avoid a hard dependency on the (potentially unimplemented)
 * vocabulary barrel.
 *
 * @example
 * ```typescript
 * const vocab: VocabLookup = {
 *   getFieldSelector: vi.fn().mockResolvedValue({ id: 'vendorInput' }),
 * };
 * ```
 */
export interface VocabLookup {
  /**
   * Resolves a human-readable business term to a UI5 selector.
   *
   * @param term - Business field name (e.g. `'Vendor'`, `'Material'`).
   * @param domain - Optional SAP domain scope (e.g. `'procurement'`).
   * @returns The matching `UI5Selector`, or `undefined` when the term is unknown.
   */
  getFieldSelector(term: string, domain?: string): Promise<UI5Selector | undefined>;
}

// ── Internal helper ────────────────────────────────────────────────────────

/**
 * Builds a typed `IntentResult<T>` from the provided parts.
 *
 * @typeParam T - Payload type.
 * @param params - All fields required to compose the result.
 * @returns A frozen `IntentResult<T>` envelope.
 *
 * @example
 * ```typescript
 * return makeIntentResult({
 *   status: 'success',
 *   intentName: 'fillField',
 *   sapModule: 'CORE',
 *   startTime,
 *   stepsExecuted: ['resolveSelector', 'fill'],
 * });
 * ```
 */
function makeIntentResult<T>(params: {
  status: 'success' | 'error' | 'partial';
  intentName: string;
  sapModule: string;
  startTime: number;
  stepsExecuted: string[];
  data?: T;
  error?: { readonly code: string; readonly message: string };
  retryable?: boolean;
  suggestions?: string[];
}): IntentResult<T> {
  return {
    status: params.status,
    ...(params.data !== undefined && { data: params.data }),
    ...(params.error !== undefined && { error: params.error }),
    metadata: {
      duration: Date.now() - params.startTime,
      retryable: params.retryable ?? false,
      suggestions: params.suggestions ?? [],
      intentName: params.intentName,
      sapModule: params.sapModule,
      stepsExecuted: params.stepsExecuted,
    },
  } as IntentResult<T>;
}

// ── Public core wrappers ───────────────────────────────────────────────────

/**
 * Resolves a field label via vocabulary and fills the matching UI5 control.
 *
 * @remarks
 * Returns `status: 'error'` (code `ERR_VOCAB_TERM_NOT_FOUND`) when the
 * vocabulary cannot resolve `label` to a selector. No exception is thrown —
 * the error is surfaced in the `IntentResult` envelope.
 *
 * @param ui5 - UI5 interaction handler (structural sub-type of `UI5Handler`).
 * @param vocabulary - Vocabulary lookup service.
 * @param label - Human-readable field label (e.g. `'Vendor'`).
 * @param value - Text value to enter.
 * @returns An `IntentResult<void>` describing the outcome.
 *
 * @intent Fill a form field by business-readable label.
 * @capability Decouples tests from hard-coded control IDs.
 *
 * @example
 * ```typescript
 * import { fillField } from '#intents/core-wrappers.js';
 *
 * const result = await fillField(ui5, vocabulary, 'Vendor', '100001');
 * if (result.status === 'error') throw new Error(result.error?.message);
 * ```
 */
export async function fillField(
  ui5: UI5HandlerSlice,
  vocabulary: VocabLookup,
  label: string,
  value: string,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = ['resolveSelector'];

  const selector = await vocabulary.getFieldSelector(label);

  if (selector === undefined) {
    return makeIntentResult({
      status: 'error',
      intentName: 'fillField',
      sapModule: CORE_MODULE,
      startTime,
      stepsExecuted: steps,
      error: {
        code: VOCAB_NOT_FOUND_CODE,
        message: `Vocabulary term not found: ${label}`,
      },
      retryable: false,
      suggestions: [
        `Verify that '${label}' is defined in the vocabulary domain file`,
        VOCAB_SUGGESTION_SUFFIX,
      ],
    });
  }

  steps.push('fill');
  await ui5.fill(selector, value);

  return makeIntentResult({
    status: 'success',
    intentName: 'fillField',
    sapModule: CORE_MODULE,
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Clicks a `sap.m.Button` control matching the given button text.
 *
 * @param ui5 - UI5 interaction handler.
 * @param text - Visible button text (e.g. `'Save'`, `'Submit'`).
 * @returns An `IntentResult<void>` describing the outcome.
 *
 * @intent Click a button by its visible label, not by ID.
 * @capability Works across locales when button text is locale-stable.
 *
 * @example
 * ```typescript
 * import { clickButton } from '#intents/core-wrappers.js';
 *
 * await clickButton(ui5, 'Save');
 * ```
 */
export async function clickButton(ui5: UI5HandlerSlice, text: string): Promise<IntentResult> {
  const startTime = Date.now();

  await ui5.click({ controlType: SAP_BUTTON_TYPE, properties: { text } });

  return makeIntentResult({
    status: 'success',
    intentName: 'clickButton',
    sapModule: CORE_MODULE,
    startTime,
    stepsExecuted: ['click'],
  });
}

/**
 * Resolves a field label via vocabulary and selects an item in the matching control.
 *
 * @param ui5 - UI5 interaction handler.
 * @param vocabulary - Vocabulary lookup service.
 * @param label - Human-readable field label (e.g. `'Purchasing Org'`).
 * @param option - Key or visible text of the item to select.
 * @returns An `IntentResult<void>` describing the outcome.
 *
 * @intent Select a dropdown option by business field label.
 * @capability Avoids hard-coded control IDs in test code.
 *
 * @example
 * ```typescript
 * import { selectOption } from '#intents/core-wrappers.js';
 *
 * await selectOption(ui5, vocab, 'Purchasing Org', '1000');
 * ```
 */
export async function selectOption(
  ui5: UI5HandlerSlice,
  vocabulary: VocabLookup,
  label: string,
  option: string,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = ['resolveSelector'];

  const selector = await vocabulary.getFieldSelector(label);

  if (selector === undefined) {
    return makeIntentResult({
      status: 'error',
      intentName: 'selectOption',
      sapModule: CORE_MODULE,
      startTime,
      stepsExecuted: steps,
      error: {
        code: VOCAB_NOT_FOUND_CODE,
        message: `Vocabulary term not found: ${label}`,
      },
      retryable: false,
      suggestions: [
        `Verify that '${label}' is defined in the vocabulary domain file`,
        VOCAB_SUGGESTION_SUFFIX,
      ],
    });
  }

  steps.push('select');
  await ui5.select(selector, option);

  return makeIntentResult({
    status: 'success',
    intentName: 'selectOption',
    sapModule: CORE_MODULE,
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Resolves a field label via vocabulary, reads the control's text, and compares it.
 *
 * @param ui5 - UI5 interaction handler.
 * @param vocabulary - Vocabulary lookup service.
 * @param label - Human-readable field label (e.g. `'Status'`).
 * @param expected - Expected text value.
 * @returns An `IntentResult<void>` describing the outcome.
 *   `status` is `'error'` when the term is not found or the value does not match.
 *
 * @intent Assert a field value by business label without knowing the control ID.
 * @capability Enables readable, maintainable assertions in E2E tests.
 *
 * @example
 * ```typescript
 * import { assertField } from '#intents/core-wrappers.js';
 *
 * const result = await assertField(ui5, vocab, 'Status', 'In Process');
 * expect(result.status).toBe('success');
 * ```
 */
export async function assertField(
  ui5: UI5HandlerSlice,
  vocabulary: VocabLookup,
  label: string,
  expected: string,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = ['resolveSelector'];

  const selector = await vocabulary.getFieldSelector(label);

  if (selector === undefined) {
    return makeIntentResult({
      status: 'error',
      intentName: 'assertField',
      sapModule: CORE_MODULE,
      startTime,
      stepsExecuted: steps,
      error: {
        code: VOCAB_NOT_FOUND_CODE,
        message: `Vocabulary term not found: ${label}`,
      },
      retryable: false,
      suggestions: [`Verify that '${label}' is defined in the vocabulary domain file`],
    });
  }

  steps.push('getText');
  const actual = await ui5.getText(selector);

  if (actual !== expected) {
    return makeIntentResult({
      status: 'error',
      intentName: 'assertField',
      sapModule: CORE_MODULE,
      startTime,
      stepsExecuted: steps,
      error: {
        code: 'ERR_INTENT_VALIDATION_FAILED',
        message: `Field '${label}' expected '${expected}' but got '${actual}'`,
      },
      retryable: false,
      suggestions: [
        `Expected value: '${expected}'`,
        `Actual value: '${actual}'`,
        'Check if the field has finished loading before asserting',
      ],
    });
  }

  return makeIntentResult({
    status: 'success',
    intentName: 'assertField',
    sapModule: CORE_MODULE,
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Clicks the confirmation button (OK or Confirm) then waits for UI5 to stabilise.
 *
 * @remarks
 * Attempts to click `OK` first; falls back to `Confirm` if the first click throws.
 * Always calls `waitForUI5` after the confirmation click.
 *
 * @param ui5 - UI5 interaction handler.
 * @returns An `IntentResult<void>` describing the outcome.
 *
 * @intent Confirm a dialog or message box and wait for the UI to settle.
 * @capability Handles both SAP standard 'OK' and custom 'Confirm' button labels.
 *
 * @example
 * ```typescript
 * import { confirmAndWait } from '#intents/core-wrappers.js';
 *
 * await confirmAndWait(ui5);
 * ```
 */
export async function confirmAndWait(ui5: UI5HandlerSlice): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  try {
    await ui5.click({ controlType: SAP_BUTTON_TYPE, properties: { text: 'OK' } });
    steps.push('clickOK');
  } catch {
    await ui5.click({ controlType: SAP_BUTTON_TYPE, properties: { text: 'Confirm' } });
    steps.push('clickConfirm');
  }

  steps.push('waitForUI5');
  await ui5.waitForUI5();

  return makeIntentResult({
    status: 'success',
    intentName: 'confirmAndWait',
    sapModule: CORE_MODULE,
    startTime,
    stepsExecuted: steps,
  });
}

/**
 * Waits for UI5 to reach a stable (idle) state after a save or navigation.
 *
 * @param ui5 - UI5 interaction handler.
 * @param options - Optional `timeout` override (ms).
 * @returns An `IntentResult<void>` describing the outcome.
 *
 * @intent Wait for all pending UI5 rendering and data-binding to complete.
 * @capability Replaces brittle `page.waitForTimeout()` calls.
 *
 * @example
 * ```typescript
 * import { waitForSave } from '#intents/core-wrappers.js';
 *
 * await waitForSave(ui5, { timeout: 15_000 });
 * ```
 */
export async function waitForSave(
  ui5: UI5HandlerSlice,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();

  await ui5.waitForUI5(options?.timeout);

  return makeIntentResult({
    status: 'success',
    intentName: 'waitForSave',
    sapModule: CORE_MODULE,
    startTime,
    stepsExecuted: ['waitForUI5'],
  });
}

/**
 * Navigates to an SAP app, applies search criteria, then clicks the Go / Search button.
 *
 * @remarks
 * `ui5Nav.navigateToApp()` is called unless `options.skipNavigation` is `true`.
 * Fields in `criteria` are resolved via `vocabulary.getFieldSelector()` and filled.
 * The Go button is clicked to trigger the search.
 *
 * @param ui5 - UI5 interaction handler.
 * @param ui5Nav - Navigation API (structural sub-type of `UI5NavigationAPI`).
 * @param vocabulary - Vocabulary lookup service.
 * @param appId - FLP semantic-object hash (e.g. `'PurchaseOrder-manage'`).
 * @param criteria - Key/value map of field label → search value.
 * @param options - Optional intent options.
 * @returns An `IntentResult<void>` describing the outcome.
 *
 * @intent Navigate to a list app and run a search with the given criteria.
 * @capability Reusable across all SAP domain search intents.
 *
 * @example
 * ```typescript
 * import { navigateAndSearch } from '#intents/core-wrappers.js';
 *
 * await navigateAndSearch(ui5, ui5Nav, vocab, 'PurchaseOrder-manage', { Vendor: '100001' });
 * ```
 */
export async function navigateAndSearch(
  ui5: UI5HandlerSlice,
  ui5Nav: { navigateToApp(appId: string, options?: unknown): Promise<void> },
  vocabulary: VocabLookup,
  appId: string,
  criteria: Readonly<Record<string, string>>,
  options?: IntentOptions,
): Promise<IntentResult> {
  const startTime = Date.now();
  const steps: string[] = [];

  if (options?.skipNavigation !== true) {
    await ui5Nav.navigateToApp(appId);
    steps.push('navigate');
  }

  for (const [label, value] of Object.entries(criteria)) {
    const selector = await vocabulary.getFieldSelector(label);
    if (selector === undefined) {
      return makeIntentResult({
        status: 'error',
        intentName: 'navigateAndSearch',
        sapModule: CORE_MODULE,
        startTime,
        stepsExecuted: steps,
        error: {
          code: VOCAB_NOT_FOUND_CODE,
          message: `Vocabulary term not found: ${label}`,
        },
        retryable: false,
        suggestions: [`Verify that '${label}' is defined in the vocabulary domain file`],
      });
    }
    await ui5.fill(selector, value);
    steps.push(`fill:${label}`);
  }

  await ui5.click({ controlType: SAP_BUTTON_TYPE, properties: { text: 'Go' } });
  steps.push('clickGo');

  return makeIntentResult({
    status: 'success',
    intentName: 'navigateAndSearch',
    sapModule: CORE_MODULE,
    startTime,
    stepsExecuted: steps,
  });
}
