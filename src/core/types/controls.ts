/* eslint-disable max-lines, sonarjs/use-type-alias -- Auto-generated: 199+ control interfaces */
/**
 * Auto-generated typed UI5 control interfaces for SAP Fiori test automation.
 *
 * DO NOT EDIT MANUALLY — regenerate with:
 *   npx tsx scripts/generate-typed-proxies.ts
 *
 * Source: SAP UI5 API (v1.136.0)
 * Generated: 2026-02-17
 * Controls: 199
 *
 * All control methods return `Promise<T>` — resolved via bridge adapter.
 *
 * @module types
 */

/**
 * Base interface all UI5 controls extend.
 *
 * @remarks
 * Maps to `sap.ui.core.Element` / `sap.ui.core.Control` base methods.
 * All methods return `Promise<T>` because they execute via the bridge
 * adapter in the browser context.
 *
 * @example
 * ```typescript
 * import type { UI5ControlBase } from '#core/types/controls.js';
 *
 * async function logControl(control: UI5ControlBase): Promise<void> {
 *   const id = await control.getId();
 *   const type = await control.getControlType();
 *   console.log(`${type}#${id}`);
 * }
 * ```
 */
export interface UI5ControlBase {
  /** Fully qualified control type, e.g., `'sap.m.Button'`. */
  readonly controlType: string;
  /** Control ID assigned in the UI5 view or generated. */
  readonly id: string;

  /** Returns the control's ID. */
  getId(): Promise<string>;
  /**
   * Returns the fully qualified control type name.
   *
   * @remarks
   * Praman proxy convenience — equivalent to `getMetadata().getName()` in native UI5.
   */
  getControlType(): Promise<string>;
  /** Gets a named property value. */
  getProperty(name: string): Promise<unknown>;
  /** Sets a named property value. */
  setProperty(name: string, value: unknown): Promise<void>;
  /** Returns controls in a named aggregation. */
  getAggregation(name: string): Promise<readonly UI5ControlBase[]>;
  /** Returns binding info for a named property. */
  getBindingInfo(name: string): Promise<unknown>;
  /** Returns the DOM reference element, or null if not rendered. */
  getDomRef(): Promise<Element | null>;
  /** Returns whether the control is visible (`getVisible()` on `sap.ui.core.Control`). */
  getVisible(): Promise<boolean>;
  /** Returns whether a property is data-bound. */
  isBound(propertyName: string): Promise<boolean>;
  /** Returns the named model, or the default model if no name given. */
  getModel(name?: string): Promise<unknown>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.m
// ═══════════════════════════════════════════════════════════════════════

/** sap.m.Button */
export interface UI5Button extends UI5ControlBase {
  readonly controlType: 'sap.m.Button';
  getActiveIcon(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getIcon(): Promise<string>;
  getIconFirst(): Promise<boolean>;
  getText(): Promise<string>;
  getType(): Promise<string>;
  getWidth(): Promise<string>;
  setActiveIcon(sActiveIcon: string): Promise<void>;
  setBadgeMaxValue(iMax: number): Promise<void>;
  setBadgeMinValue(iMin: number): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIconFirst(bIconFirst: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
  setType(sType: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  press(): Promise<void>;
}

/** sap.m.Input */
export interface UI5Input extends UI5ControlBase {
  readonly controlType: 'sap.m.Input';
  cancelPendingSuggest(): Promise<void>;
  closeSuggestions(): Promise<void>;
  getAutocomplete(): Promise<boolean>;
  getDescription(): Promise<string>;
  getEnableSuggestionsHighlighting(): Promise<boolean>;
  getEnableTableAutoPopinMode(): Promise<boolean>;
  getFieldWidth(): Promise<string>;
  getFilterSuggests(): Promise<boolean>;
  getMaxLength(): Promise<number>;
  getMaxSuggestionWidth(): Promise<string>;
  getSelectedItem(): Promise<string | null>;
  getSelectedKey(): Promise<string>;
  getSelectedRow(): Promise<string | null>;
  getShowClearIcon(): Promise<boolean>;
  getShowSuggestion(): Promise<boolean>;
  getShowTableSuggestionValueHelp(): Promise<boolean>;
  getShowValueHelp(): Promise<boolean>;
  getShowValueStateMessage(): Promise<boolean>;
  getStartSuggestion(): Promise<number>;
  getSuggestionColumns(): Promise<readonly UI5ControlBase[]>;
  getSuggestionItemByKey(sKey: string): Promise<UI5ControlBase>;
  getSuggestionItems(): Promise<readonly UI5ControlBase[]>;
  getSuggestionRows(): Promise<readonly UI5ControlBase[]>;
  getSuggestionRowValidator(): Promise<unknown>;
  getTextFormatMode(): Promise<string>;
  getTextFormatter(): Promise<unknown>;
  getType(): Promise<string>;
  getValue(): Promise<string>;
  getValueHelpIconSrc(): Promise<string>;
  getValueLiveUpdate(): Promise<boolean>;
  getValueStateText(): Promise<string>;
  setAutocomplete(bAutocomplete: boolean): Promise<void>;
  setDescription(sDescription: string): Promise<void>;
  setEnableSuggestionsHighlighting(bEnableSuggestionsHighlighting: boolean): Promise<void>;
  setEnableTableAutoPopinMode(bEnableTableAutoPopinMode: boolean): Promise<void>;
  setFieldWidth(sFieldWidth: string): Promise<void>;
  setFilterFunction(): Promise<void>;
  setFilterSuggests(bFilterSuggests: boolean): Promise<void>;
  setMaxLength(iMaxLength: number): Promise<void>;
  setMaxSuggestionWidth(sMaxSuggestionWidth: string): Promise<void>;
  setRowResultFunction(): Promise<void>;
  setSelectedItem(oItem?: string | UI5ControlBase | null): Promise<void>;
  setSelectedKey(sKey: string): Promise<void>;
  setSelectedRow(oListItem: string | null): Promise<void>;
  setShowClearIcon(bShowClearIcon: boolean): Promise<void>;
  setShowSuggestion(bShowSuggestion: boolean): Promise<void>;
  setShowTableSuggestionValueHelp(bShowTableSuggestionValueHelp: boolean): Promise<void>;
  setShowValueHelp(bShowValueHelp: boolean): Promise<void>;
  setShowValueStateMessage(bShowValueStateMessage: boolean): Promise<void>;
  setStartSuggestion(iStartSuggestion: number): Promise<void>;
  setSuggestionRowValidator(fnSuggestionRowValidator: unknown): Promise<void>;
  setTextFormatMode(sTextFormatMode: string): Promise<void>;
  setTextFormatter(fnTextFormatter: unknown): Promise<void>;
  setType(sType: string): Promise<void>;
  setValue(sValue: string): Promise<void>;
  setValueHelpIconSrc(sValueHelpIconSrc: string): Promise<void>;
  setValueLiveUpdate(bValueLiveUpdate: boolean): Promise<void>;
  setValueStateText(sValueStateText: string): Promise<void>;
  showItems(): Promise<void>;
  updateSuggestionItems(): Promise<void>;
}

/** sap.m.CheckBox */
export interface UI5CheckBox extends UI5ControlBase {
  readonly controlType: 'sap.m.CheckBox';
  getActiveHandling(): Promise<boolean>;
  getDisplayOnly(): Promise<boolean>;
  getEditable(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getName(): Promise<string>;
  getPartiallySelected(): Promise<boolean>;
  getRequired(): Promise<boolean>;
  getSelected(): Promise<boolean>;
  getText(): Promise<string>;
  getTextAlign(): Promise<string>;
  getUseEntireWidth(): Promise<boolean>;
  getValueState(): Promise<string>;
  getWidth(): Promise<string>;
  getWrapping(): Promise<boolean>;
  setActiveHandling(bActiveHandling: boolean): Promise<void>;
  setDisplayOnly(bDisplayOnly: boolean): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setName(sName: string): Promise<void>;
  setPartiallySelected(bPartiallySelected: boolean): Promise<void>;
  setRequired(bRequired: boolean): Promise<void>;
  setSelected(bSelected: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setUseEntireWidth(bUseEntireWidth: boolean): Promise<void>;
  setValueState(sValueState: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrapping(bWrapping: boolean): Promise<void>;
}

/** sap.m.RadioButton */
export interface UI5RadioButton extends UI5ControlBase {
  readonly controlType: 'sap.m.RadioButton';
  getActiveHandling(): Promise<boolean>;
  getEditable(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getGroupName(): Promise<string>;
  getSelected(): Promise<boolean>;
  getText(): Promise<string>;
  getTextAlign(): Promise<string>;
  getUseEntireWidth(): Promise<boolean>;
  getValueState(): Promise<string>;
  getWidth(): Promise<string>;
  getWrapping(): Promise<boolean>;
  getWrappingType(): Promise<string>;
  setActiveHandling(bActiveHandling: boolean): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setGroupName(sGroupName: string): Promise<void>;
  setSelected(bSelected: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setUseEntireWidth(bUseEntireWidth: boolean): Promise<void>;
  setValueState(sValueState: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrapping(bWrapping: boolean): Promise<void>;
  setWrappingType(sWrappingType: string): Promise<void>;
}

/** sap.m.ComboBox */
export interface UI5ComboBox extends UI5ControlBase {
  readonly controlType: 'sap.m.ComboBox';
  getFilterSecondaryValues(): Promise<boolean>;
  getSelectedItem(): Promise<UI5ControlBase | null>;
  getSelectedItemId(): Promise<string>;
  getSelectedKey(): Promise<string>;
  setFilterSecondaryValues(bFilterSecondaryValues: boolean): Promise<void>;
  setSelectedItem(vItem: string | UI5ControlBase | null): Promise<void>;
  setSelectedItemId(vItem: string): Promise<void>;
  setSelectedKey(sKey: string): Promise<void>;
}

/** sap.m.MultiComboBox */
export interface UI5MultiComboBox extends UI5ControlBase {
  readonly controlType: 'sap.m.MultiComboBox';
  getSelectedItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedKeys(): Promise<readonly string[]>;
  getShowSelectAll(): Promise<boolean>;
  isItemSelected(oItem: UI5ControlBase): Promise<boolean>;
  setSelectedItems(aItems: readonly string[] | readonly UI5ControlBase[] | null): Promise<void>;
  setSelectedKeys(aKeys: readonly string[]): Promise<void>;
  setShowSelectAll(bShowSelectAll: boolean): Promise<void>;
}

/** sap.m.Select */
export interface UI5Select extends UI5ControlBase {
  readonly controlType: 'sap.m.Select';
  close(): Promise<void>;
  getAutoAdjustWidth(): Promise<boolean>;
  getColumnRatio(): Promise<string>;
  getEditable(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getEnabledItems(aItems?: readonly UI5ControlBase[]): Promise<readonly UI5ControlBase[]>;
  getFirstItem(): Promise<UI5ControlBase | null>;
  getForceSelection(): Promise<boolean>;
  getIcon(): Promise<string>;
  getItemAt(iIndex: number): Promise<UI5ControlBase | null>;
  getItemByKey(sKey: string): Promise<UI5ControlBase | null>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getLastItem(): Promise<UI5ControlBase | null>;
  getMaxWidth(): Promise<string>;
  getName(): Promise<string>;
  getOverflowToolbarConfig(): Promise<string>;
  getRequired(): Promise<boolean>;
  getResetOnMissingKey(): Promise<boolean>;
  getSelectedItem(): Promise<UI5ControlBase | null>;
  getSelectedItemId(): Promise<string>;
  getSelectedKey(): Promise<string>;
  getShowSecondaryValues(): Promise<boolean>;
  getTextAlign(): Promise<string>;
  getType(): Promise<string>;
  getValueState(): Promise<string>;
  getValueStateText(): Promise<string>;
  getWidth(): Promise<string>;
  getWrapItemsText(): Promise<boolean>;
  hasLabelableHTMLElement(): Promise<boolean>;
  isOpen(): Promise<boolean>;
  selectNextSelectableItem(): Promise<UI5ControlBase>;
  setAutoAdjustWidth(bAutoAdjustWidth: boolean): Promise<void>;
  setColumnRatio(sColumnRatio: string): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setForceSelection(bForceSelection: boolean): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setMaxWidth(sMaxWidth: string): Promise<void>;
  setName(sName: string): Promise<void>;
  setRequired(bRequired: boolean): Promise<void>;
  setResetOnMissingKey(bResetOnMissingKey: boolean): Promise<void>;
  setSelectedItem(vItem: string | UI5ControlBase | null): Promise<void>;
  setSelectedItemId(vItem: string): Promise<void>;
  setSelectedKey(sKey: string): Promise<void>;
  setShowSecondaryValues(bShowSecondaryValues: boolean): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setType(sType: string): Promise<void>;
  setValueState(sValueState: string): Promise<void>;
  setValueStateText(sValueStateText: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrapItemsText(bWrap: boolean): Promise<void>;
}

/** sap.m.TextArea */
export interface UI5TextArea extends UI5ControlBase {
  readonly controlType: 'sap.m.TextArea';
  getCols(): Promise<number>;
  getGrowing(): Promise<boolean>;
  getGrowingMaxLines(): Promise<number>;
  getHeight(): Promise<string>;
  getMaxLength(): Promise<number>;
  getRows(): Promise<number>;
  getShowExceededText(): Promise<boolean>;
  getValueLiveUpdate(): Promise<boolean>;
  getWrapping(): Promise<string>;
  setCols(iCols: number): Promise<void>;
  setGrowing(bGrowing: boolean): Promise<void>;
  setGrowingMaxLines(iGrowingMaxLines: number): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setMaxLength(iMaxLength: number): Promise<void>;
  setRows(iRows: number): Promise<void>;
  setShowExceededText(bShowExceededText: boolean): Promise<void>;
  setValueLiveUpdate(bValueLiveUpdate: boolean): Promise<void>;
  setWrapping(sWrapping: string): Promise<void>;
}

/** sap.m.DatePicker */
export interface UI5DatePicker extends UI5ControlBase {
  readonly controlType: 'sap.m.DatePicker';
  getCalendarWeekNumbering(): Promise<unknown>;
  getDateValue(): Promise<unknown>;
  getDisplayFormat(): Promise<string>;
  getDisplayFormatType(): Promise<string>;
  getHideInput(): Promise<boolean>;
  getLegend(): Promise<string | null>;
  getMaxDate(): Promise<unknown>;
  getMinDate(): Promise<unknown>;
  getSecondaryCalendarType(): Promise<unknown>;
  getShowCurrentDateButton(): Promise<boolean>;
  getShowFooter(): Promise<boolean>;
  getSpecialDates(): Promise<readonly UI5ControlBase[]>;
  getValue(): Promise<string>;
  getValueFormat(): Promise<string>;
  isValidValue(): Promise<boolean>;
  openBy(oDomRef: HTMLElement): Promise<void>;
  setCalendarWeekNumbering(sCalendarWeekNumbering: unknown): Promise<void>;
  setDisplayFormat(sDisplayFormat: string): Promise<void>;
  setDisplayFormatType(sDisplayFormatType: string): Promise<void>;
  setHideInput(bHideInput: boolean): Promise<void>;
  setLegend(oLegend: string): Promise<void>;
  setMaxDate(oDate: unknown): Promise<void>;
  setMinDate(oDate: unknown): Promise<void>;
  setSecondaryCalendarType(sSecondaryCalendarType: unknown): Promise<void>;
  setShowCurrentDateButton(bShowCurrentDateButton: boolean): Promise<void>;
  setShowFooter(bFlag: boolean): Promise<void>;
  setValue(sValue: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.DateTimePicker */
export interface UI5DateTimePicker extends UI5ControlBase {
  readonly controlType: 'sap.m.DateTimePicker';
  getDateValue(): Promise<unknown>;
  getMinutesStep(): Promise<number>;
  getSecondsStep(): Promise<number>;
  getShowCurrentTimeButton(): Promise<boolean>;
  getShowFooter(): Promise<boolean>;
  getShowTimezone(): Promise<boolean>;
  getTimezone(): Promise<string>;
  setMaxDate(): Promise<void>;
  setMinDate(): Promise<void>;
  setMinutesStep(iMinutesStep: number): Promise<void>;
  setSecondsStep(iSecondsStep: number): Promise<void>;
  setShowCurrentTimeButton(bShowCurrentTimeButton: boolean): Promise<void>;
  setShowTimezone(bShowTimezone: boolean): Promise<void>;
  setTimezone(sTimezone: string): Promise<void>;
}

/** sap.m.SearchField */
export interface UI5SearchField extends UI5ControlBase {
  readonly controlType: 'sap.m.SearchField';
  getEnabled(): Promise<boolean>;
  getEnableSuggestions(): Promise<boolean>;
  getMaxLength(): Promise<number>;
  getPlaceholder(): Promise<string>;
  getShowRefreshButton(): Promise<boolean>;
  getShowSearchButton(): Promise<boolean>;
  getSuggestionItems(): Promise<readonly UI5ControlBase[]>;
  getValue(): Promise<string>;
  getWidth(): Promise<string>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setEnableSuggestions(bEnableSuggestions: boolean): Promise<void>;
  setMaxLength(iMaxLength: number): Promise<void>;
  setPlaceholder(sPlaceholder: string): Promise<void>;
  setShowRefreshButton(bShowRefreshButton: boolean): Promise<void>;
  setShowSearchButton(bShowSearchButton: boolean): Promise<void>;
  setValue(sValue: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  suggest(bShow?: boolean): Promise<void>;
}

/** sap.m.MultiInput */
export interface UI5MultiInput extends UI5ControlBase {
  readonly controlType: 'sap.m.MultiInput';
  getMaxTokens(): Promise<number>;
  getShowSuggestion(): Promise<boolean>;
  getTokens(): Promise<readonly UI5ControlBase[]>;
  getValidators(): Promise<readonly unknown[]>;
  getWaitForAsyncValidation(): Promise<string>;
  setMaxTokens(iMaxTokens: number): Promise<void>;
  setShowSuggestion(bShowSuggestion: boolean): Promise<void>;
  setTokens(aTokens: readonly UI5ControlBase[]): Promise<void>;
}

/** sap.m.Switch */
export interface UI5Switch extends UI5ControlBase {
  readonly controlType: 'sap.m.Switch';
  getCustomTextOff(): Promise<string>;
  getCustomTextOn(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getName(): Promise<string>;
  getState(): Promise<boolean>;
  getType(): Promise<string>;
  setCustomTextOff(sCustomTextOff: string): Promise<void>;
  setCustomTextOn(sCustomTextOn: string): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setName(sName: string): Promise<void>;
  setState(bState: boolean): Promise<void>;
  setType(sType: string): Promise<void>;
}

/** sap.m.StepInput */
export interface UI5StepInput extends UI5ControlBase {
  readonly controlType: 'sap.m.StepInput';
  getDescription(): Promise<string>;
  getDisplayValuePrecision(): Promise<number>;
  getEditable(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getFieldWidth(): Promise<string>;
  getLargerStep(): Promise<number>;
  getMax(): Promise<number>;
  getMin(): Promise<number>;
  getName(): Promise<string>;
  getPlaceholder(): Promise<string>;
  getRequired(): Promise<boolean>;
  getStep(): Promise<number>;
  getStepMode(): Promise<string>;
  getTextAlign(): Promise<string>;
  getValidationMode(): Promise<string>;
  getValue(): Promise<number>;
  getValueState(): Promise<string>;
  getValueStateText(): Promise<string>;
  getWidth(): Promise<string>;
  setDescription(sDescription: string): Promise<void>;
  setDisplayValuePrecision(iDisplayValuePrecision: number): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setFieldWidth(sFieldWidth: string): Promise<void>;
  setLargerStep(fLargerStep: number): Promise<void>;
  setName(sName: string): Promise<void>;
  setPlaceholder(sPlaceholder: string): Promise<void>;
  setRequired(bRequired: boolean): Promise<void>;
  setStep(fStep: number): Promise<void>;
  setStepMode(sStepMode: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setValue(fValue: number): Promise<void>;
  setValueState(sValueState: string): Promise<void>;
  setValueStateText(sValueStateText: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.SegmentedButton */
export interface UI5SegmentedButton extends UI5ControlBase {
  readonly controlType: 'sap.m.SegmentedButton';
  createButton(
    sText: string,
    sURI?: string,
    bEnabled?: boolean,
    sTextDirection?: string,
  ): Promise<string>;
  getEnabled(): Promise<boolean>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedItem(): Promise<string | null>;
  getSelectedKey(): Promise<string>;
  getWidth(): Promise<string>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setSelectedButton(vButton: string | null): Promise<void>;
  setSelectedItem(vItem: string | UI5ControlBase | null): Promise<void>;
  setSelectedKey(sKey: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.Slider */
export interface UI5Slider extends UI5ControlBase {
  readonly controlType: 'sap.m.Slider';
  getCustomTooltips(): Promise<readonly UI5ControlBase[]>;
  getEnabled(): Promise<boolean>;
  getEnableTickmarks(): Promise<boolean>;
  getInputsAsTooltips(): Promise<boolean>;
  getMax(): Promise<number>;
  getMin(): Promise<number>;
  getName(): Promise<string>;
  getProgress(): Promise<boolean>;
  getScale(): Promise<UI5ControlBase | null>;
  getShowAdvancedTooltip(): Promise<boolean>;
  getShowHandleTooltip(): Promise<boolean>;
  getStep(): Promise<number>;
  getValue(): Promise<number>;
  getWidth(): Promise<string>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setEnableTickmarks(bEnableTickmarks: boolean): Promise<void>;
  setInputsAsTooltips(bInputsAsTooltips: boolean): Promise<void>;
  setMax(fMax: number): Promise<void>;
  setMin(fMin: number): Promise<void>;
  setName(sName: string): Promise<void>;
  setProgress(bProgress: boolean): Promise<void>;
  setScale(oScale: UI5ControlBase): Promise<void>;
  setShowAdvancedTooltip(bShowAdvancedTooltip: boolean): Promise<void>;
  setShowHandleTooltip(bShowHandleTooltip: boolean): Promise<void>;
  setStep(fStep: number): Promise<void>;
  setValue(fNewValue: number): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  stepDown(iStep?: number): Promise<void>;
  stepUp(iStep?: number): Promise<void>;
}

/** sap.m.ToggleButton */
export interface UI5ToggleButton extends UI5ControlBase {
  readonly controlType: 'sap.m.ToggleButton';
  getPressed(): Promise<boolean>;
  setPressed(bPressed: boolean): Promise<void>;
  press(): Promise<void>;
}

/** sap.m.MenuButton */
export interface UI5MenuButton extends UI5ControlBase {
  readonly controlType: 'sap.m.MenuButton';
  getActiveIcon(): Promise<string>;
  getButtonMode(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getIcon(): Promise<string>;
  getMenu(): Promise<UI5ControlBase | null>;
  getMenuPosition(): Promise<string>;
  getText(): Promise<string>;
  getType(): Promise<string>;
  getUseDefaultActionOnly(): Promise<boolean>;
  getWidth(): Promise<string>;
  setActiveIcon(sActiveIcon: string): Promise<void>;
  setButtonMode(sMode: string): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setMenu(oMenu: UI5ControlBase): Promise<void>;
  setMenuPosition(sMenuPosition: string): Promise<void>;
  setText(sText: string): Promise<void>;
  setType(sType: string): Promise<void>;
  setUseDefaultActionOnly(bUseDefaultActionOnly: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.SplitButton */
export interface UI5SplitButton extends UI5ControlBase {
  readonly controlType: 'sap.m.SplitButton';
  setArrowState(bIsDown: boolean): Promise<void>;
}

/** sap.m.TimePicker */
export interface UI5TimePicker extends UI5ControlBase {
  readonly controlType: 'sap.m.TimePicker';
  getDateValue(): Promise<unknown>;
  getDisplayFormat(): Promise<string>;
  getHideInput(): Promise<boolean>;
  getLocaleId(): Promise<string>;
  getMask(): Promise<string>;
  getMaskMode(): Promise<string>;
  getMinutesStep(): Promise<number>;
  getPlaceholderSymbol(): Promise<string>;
  getRules(): Promise<readonly UI5ControlBase[]>;
  getSecondsStep(): Promise<number>;
  getShowCurrentTimeButton(): Promise<boolean>;
  getSupport2400(): Promise<boolean>;
  getTitle(): Promise<string>;
  getValueFormat(): Promise<string>;
  onAfterClose(): Promise<void>;
  onAfterOpen(): Promise<void>;
  onBeforeOpen(): Promise<void>;
  openBy(oDomRef: HTMLElement): Promise<void>;
  setDateValue(): Promise<void>;
  setDisplayFormat(sDisplayFormat: string): Promise<void>;
  setHideInput(bHideInput: boolean): Promise<void>;
  setLocaleId(sLocaleId: string): Promise<void>;
  setMask(sMask: string): Promise<void>;
  setMaskMode(sMaskMode: string): Promise<void>;
  setMinutesStep(step: number): Promise<void>;
  setPlaceholderSymbol(sPlaceholderSymbol: string): Promise<void>;
  setSecondsStep(step: number): Promise<void>;
  setShowCurrentTimeButton(bShowCurrentTimeButton: boolean): Promise<void>;
  setSupport2400(bSupport2400: boolean): Promise<void>;
}

/** sap.m.RangeSlider */
export interface UI5RangeSlider extends UI5ControlBase {
  readonly controlType: 'sap.m.RangeSlider';
  getRange(): Promise<readonly number[]>;
  getValue2(): Promise<number>;
  setRange(sRange: readonly number[]): Promise<void>;
  setValue2(fValue2: number): Promise<void>;
}

/** sap.m.Token */
export interface UI5Token extends UI5ControlBase {
  readonly controlType: 'sap.m.Token';
  getEditable(): Promise<boolean>;
  getKey(): Promise<string>;
  getSelected(): Promise<boolean>;
  getText(): Promise<string>;
  setEditable(bEditable: boolean): Promise<void>;
  setKey(sKey: string): Promise<void>;
  setSelected(bSelected: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
}

/** sap.m.MaskInput */
export interface UI5MaskInput extends UI5ControlBase {
  readonly controlType: 'sap.m.MaskInput';
  getMask(): Promise<string>;
  getPlaceholderSymbol(): Promise<string>;
  getRules(): Promise<readonly UI5ControlBase[]>;
  getShowClearIcon(): Promise<boolean>;
  setMask(sMask: string): Promise<void>;
  setPlaceholderSymbol(sPlaceholderSymbol: string): Promise<void>;
  setShowClearIcon(bShowClearIcon: boolean): Promise<void>;
}

/** sap.m.upload.UploadSet */
export interface UI5UploadSet extends UI5ControlBase {
  readonly controlType: 'sap.m.upload.UploadSet';
  getCloudFilePickerButtonText(): Promise<string>;
  getCloudFilePickerEnabled(): Promise<boolean>;
  getCloudFilePickerServiceUrl(): Promise<string>;
  getDefaultFileUploader(): Promise<string>;
  getDirectory(): Promise<boolean>;
  getDragDropDescription(): Promise<string>;
  getDragDropText(): Promise<string>;
  getFileTypes(): Promise<readonly string[]>;
  getHeaderFields(): Promise<readonly UI5ControlBase[]>;
  getHttpRequestMethod(): Promise<string>;
  getIllustratedMessage(): Promise<UI5ControlBase | null>;
  getIncompleteItems(): Promise<readonly UI5ControlBase[]>;
  getInstantUpload(): Promise<boolean>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getList(): Promise<string>;
  getMaxFileNameLength(): Promise<number>;
  getMaxFileSize(): Promise<number>;
  getMediaTypes(): Promise<readonly string[]>;
  getMode(): Promise<string>;
  getMultiple(): Promise<boolean>;
  getSameFilenameAllowed(): Promise<boolean>;
  getSelectedItem(): Promise<UI5ControlBase | null>;
  getSelectedItems(): Promise<readonly UI5ControlBase[]>;
  getShowIcons(): Promise<boolean>;
  getTerminationEnabled(): Promise<boolean>;
  getToolbar(): Promise<UI5ControlBase | null>;
  getUploadButtonInvisible(): Promise<boolean>;
  getUploadEnabled(): Promise<boolean>;
  getUploader(): Promise<UI5ControlBase | null>;
  getUploadUrl(): Promise<string>;
  openFileDialog(item: UI5ControlBase): Promise<void>;
  registerUploaderEvents(oUploader: UI5ControlBase): Promise<void>;
  selectAll(): Promise<void>;
  setCloudFilePickerButtonText(sCloudFilePickerButtonText: string): Promise<void>;
  setCloudFilePickerEnabled(bCloudFilePickerEnabled: boolean): Promise<void>;
  setCloudFilePickerServiceUrl(sCloudFilePickerServiceUrl: string): Promise<void>;
  setDirectory(bDirectory: boolean): Promise<void>;
  setDragDropDescription(sDragDropDescription: string): Promise<void>;
  setDragDropText(sDragDropText: string): Promise<void>;
  setFileTypes(sFileTypes: readonly string[]): Promise<void>;
  setHttpRequestMethod(sHttpRequestMethod: string): Promise<void>;
  setIllustratedMessage(oIllustratedMessage: UI5ControlBase): Promise<void>;
  setInstantUpload(bInstantUpload: boolean): Promise<void>;
  setMaxFileNameLength(iMaxFileNameLength: number): Promise<void>;
  setMaxFileSize(fMaxFileSize: number): Promise<void>;
  setMediaTypes(sMediaTypes: readonly string[]): Promise<void>;
  setMode(sMode: string): Promise<void>;
  setMultiple(bMultiple: boolean): Promise<void>;
  setSameFilenameAllowed(bSameFilenameAllowed: boolean): Promise<void>;
  setSelectedItem(uploadSetItem: UI5ControlBase, select?: boolean): Promise<void>;
  setSelectedItemById(id: string, select?: boolean): Promise<void>;
  setShowIcons(bShowIcons: boolean): Promise<void>;
  setTerminationEnabled(bTerminationEnabled: boolean): Promise<void>;
  setToolbar(oToolbar: UI5ControlBase): Promise<void>;
  setUploadButtonInvisible(bUploadButtonInvisible: boolean): Promise<void>;
  setUploadEnabled(bUploadEnabled: boolean): Promise<void>;
  setUploader(oUploader: UI5ControlBase): Promise<void>;
  setUploadUrl(sUploadUrl: string): Promise<void>;
  upload(): Promise<void>;
  uploadItem(): Promise<void>;
}

/** sap.m.RadioButtonGroup */
export interface UI5RadioButtonGroup extends UI5ControlBase {
  readonly controlType: 'sap.m.RadioButtonGroup';
  getButtons(): Promise<readonly UI5ControlBase[]>;
  getColumns(): Promise<number>;
  getEditable(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getSelectedButton(): Promise<UI5ControlBase>;
  getSelectedIndex(): Promise<number>;
  getValueState(): Promise<string>;
  getWidth(): Promise<string>;
  setColumns(iColumns: number): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setSelectedButton(oSelectedButton: UI5ControlBase): Promise<void>;
  setSelectedIndex(iSelectedIndex: number): Promise<void>;
  setValueState(sValueState: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  updateButtons(): Promise<void>;
}

/** sap.m.Text */
export interface UI5Text extends UI5ControlBase {
  readonly controlType: 'sap.m.Text';
  getEmptyIndicatorMode(): Promise<string>;
  getMaxLines(): Promise<number>;
  getRenderWhitespace(): Promise<boolean>;
  getText(bNormalize?: boolean): Promise<string>;
  getTextAlign(): Promise<string>;
  getWidth(): Promise<string>;
  getWrapping(): Promise<boolean>;
  getWrappingType(): Promise<string>;
  hasLabelableHTMLElement(): Promise<boolean>;
  setEmptyIndicatorMode(sEmptyIndicatorMode: string): Promise<void>;
  setMaxLines(iMaxLines: number): Promise<void>;
  setRenderWhitespace(bRenderWhitespace: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrapping(bWrapping: boolean): Promise<void>;
  setWrappingType(sWrappingType: string): Promise<void>;
}

/** sap.m.Label */
export interface UI5Label extends UI5ControlBase {
  readonly controlType: 'sap.m.Label';
  getDesign(): Promise<string>;
  getDisplayOnly(): Promise<boolean>;
  getLabelFor(): Promise<string | null>;
  getOverflowToolbarConfig(): Promise<string>;
  getRequired(): Promise<boolean>;
  getShowColon(): Promise<boolean>;
  getText(): Promise<string>;
  getTextAlign(): Promise<string>;
  getVAlign(): Promise<string>;
  getWidth(): Promise<string>;
  getWrapping(): Promise<boolean>;
  getWrappingType(): Promise<string>;
  hasLabelableHTMLElement(): Promise<boolean>;
  setDesign(sDesign: string): Promise<void>;
  setDisplayOnly(bDisplayOnly: boolean): Promise<void>;
  setLabelFor(oLabelFor: string | UI5ControlBase): Promise<void>;
  setRequired(bRequired: boolean): Promise<void>;
  setShowColon(bShowColon: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setVAlign(sVAlign: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrapping(bWrapping: boolean): Promise<void>;
  setWrappingType(sWrappingType: string): Promise<void>;
}

/** sap.m.Title */
export interface UI5Title extends UI5ControlBase {
  readonly controlType: 'sap.m.Title';
  getContent(): Promise<UI5ControlBase | null>;
  getLevel(): Promise<string>;
  getText(): Promise<string>;
  getTextAlign(): Promise<string>;
  getTitle(): Promise<string | null>;
  getTitleStyle(): Promise<string>;
  getWidth(): Promise<string>;
  getWrapping(): Promise<boolean>;
  getWrappingType(): Promise<string>;
  setContent(oContent: UI5ControlBase): Promise<void>;
  setLevel(sLevel: string): Promise<void>;
  setText(sText: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setTitle(vTitle: string): Promise<void>;
  setTitleStyle(sTitleStyle: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrapping(bWrapping: boolean): Promise<void>;
  setWrappingType(sWrappingType: string): Promise<void>;
}

/** sap.m.Link */
export interface UI5Link extends UI5ControlBase {
  readonly controlType: 'sap.m.Link';
  getEmphasized(): Promise<boolean>;
  getEmptyIndicatorMode(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getEndIcon(): Promise<string>;
  getHref(): Promise<string>;
  getIcon(): Promise<string>;
  getReactiveAreaMode(): Promise<string>;
  getRel(): Promise<string>;
  getSubtle(): Promise<boolean>;
  getTarget(): Promise<string>;
  getText(): Promise<string>;
  getTextAlign(): Promise<string>;
  getValidateUrl(): Promise<boolean>;
  getWidth(): Promise<string>;
  getWrapping(): Promise<boolean>;
  hasLabelableHTMLElement(): Promise<boolean>;
  setEmphasized(bEmphasized: boolean): Promise<void>;
  setEmptyIndicatorMode(sEmptyIndicatorMode: string): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setEndIcon(sEndIcon: string): Promise<void>;
  setHref(sHref: string): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setReactiveAreaMode(sReactiveAreaMode: string): Promise<void>;
  setRel(sRel: string): Promise<void>;
  setSubtle(bSubtle: boolean): Promise<void>;
  setTarget(sTarget: string): Promise<void>;
  setText(sText: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setValidateUrl(bValidateUrl: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrapping(bWrapping: boolean): Promise<void>;
  press(): Promise<void>;
}

/** sap.m.Image */
export interface UI5Image extends UI5ControlBase {
  readonly controlType: 'sap.m.Image';
  getActiveSrc(): Promise<string>;
  getAlt(): Promise<string>;
  getAriaDetails(): Promise<readonly string[]>;
  getBackgroundPosition(): Promise<string>;
  getBackgroundRepeat(): Promise<string>;
  getBackgroundSize(): Promise<string>;
  getDecorative(): Promise<boolean>;
  getDensityAware(): Promise<boolean>;
  getDetailBox(): Promise<UI5ControlBase | null>;
  getHeight(): Promise<string>;
  getLazyLoading(): Promise<boolean>;
  getMode(): Promise<string>;
  getSrc(): Promise<string>;
  getUseMap(): Promise<string>;
  getWidth(): Promise<string>;
  setActiveSrc(sActiveSrc: string): Promise<void>;
  setAlt(sAlt: string): Promise<void>;
  setBackgroundPosition(sBackgroundPosition: string): Promise<void>;
  setBackgroundRepeat(sBackgroundRepeat: string): Promise<void>;
  setBackgroundSize(sBackgroundSize: string): Promise<void>;
  setDecorative(bDecorative: boolean): Promise<void>;
  setDensityAware(bDensityAware: boolean): Promise<void>;
  setDetailBox(oLightBox: UI5ControlBase): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setLazyLoading(bLazyLoading: boolean): Promise<void>;
  setMode(sMode: string): Promise<void>;
  setSrc(sSrc: string): Promise<void>;
  setUseMap(sUseMap: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.FormattedText */
export interface UI5FormattedText extends UI5ControlBase {
  readonly controlType: 'sap.m.FormattedText';
  getControls(): Promise<readonly UI5ControlBase[]>;
  getConvertedLinksDefaultTarget(): Promise<string>;
  getConvertLinksToAnchorTags(): Promise<string>;
  getDisableStyleAttribute(): Promise<boolean>;
  getHeight(): Promise<string>;
  getHtmlText(): Promise<string>;
  getTextAlign(): Promise<string>;
  getWidth(): Promise<string>;
  setConvertedLinksDefaultTarget(sConvertedLinksDefaultTarget: string): Promise<void>;
  setConvertLinksToAnchorTags(sConvertLinksToAnchorTags: string): Promise<void>;
  setDisableStyleAttribute(bDisableStyleAttribute: boolean): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setHtmlText(sText: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.Avatar */
export interface UI5Avatar extends UI5ControlBase {
  readonly controlType: 'sap.m.Avatar';
  getActive(): Promise<boolean>;
  getBackgroundColor(): Promise<string>;
  getBadgeIcon(): Promise<string>;
  getBadgeIconColor(): Promise<string>;
  getBadgeTooltip(): Promise<string>;
  getBadgeValueState(): Promise<string>;
  getCustomDisplaySize(): Promise<string>;
  getCustomFontSize(): Promise<string>;
  getDecorative(): Promise<boolean>;
  getDetailBox(): Promise<UI5ControlBase | null>;
  getDisplayShape(): Promise<string>;
  getDisplaySize(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getFallbackIcon(): Promise<string>;
  getImageFitType(): Promise<string>;
  getInitials(): Promise<string>;
  getShowBorder(): Promise<boolean>;
  getSrc(): Promise<string>;
  setActive(bActive: boolean): Promise<void>;
  setBackgroundColor(sBackgroundColor: string): Promise<void>;
  setBadgeIcon(sBadgeIcon: string): Promise<void>;
  setBadgeIconColor(sBadgeIconColor: string): Promise<void>;
  setBadgeTooltip(sBadgeTooltip: string): Promise<void>;
  setBadgeValueState(sBadgeValueState: string): Promise<void>;
  setCustomDisplaySize(sCustomDisplaySize: string): Promise<void>;
  setCustomFontSize(sCustomFontSize: string): Promise<void>;
  setDecorative(bDecorative: boolean): Promise<void>;
  setDetailBox(oLightBox: UI5ControlBase): Promise<void>;
  setDisplayShape(sDisplayShape: string): Promise<void>;
  setDisplaySize(sDisplaySize: string): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setFallbackIcon(sFallbackIcon: string): Promise<void>;
  setImageFitType(sImageFitType: string): Promise<void>;
  setInitials(sInitials: string): Promise<void>;
  setShowBorder(bShowBorder: boolean): Promise<void>;
  setSrc(sSrc: string): Promise<void>;
}

/** sap.m.ObjectStatus */
export interface UI5ObjectStatus extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectStatus';
  getActive(): Promise<boolean>;
  getEmptyIndicatorMode(): Promise<string>;
  getIcon(): Promise<string>;
  getInverted(): Promise<boolean>;
  getReactiveAreaMode(): Promise<string>;
  getState(): Promise<string>;
  getStateAnnouncementText(): Promise<string>;
  getText(): Promise<string>;
  getTitle(): Promise<string>;
  setActive(bActive: boolean): Promise<void>;
  setEmptyIndicatorMode(sEmptyIndicatorMode: string): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setInverted(bInverted: boolean): Promise<void>;
  setReactiveAreaMode(sReactiveAreaMode: string): Promise<void>;
  setState(sValue: string): Promise<void>;
  setStateAnnouncementText(sStateAnnouncementText: string): Promise<void>;
  setText(sText: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.m.ObjectNumber */
export interface UI5ObjectNumber extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectNumber';
  getActive(): Promise<boolean>;
  getEmphasized(): Promise<boolean>;
  getEmptyIndicatorMode(): Promise<string>;
  getInverted(): Promise<boolean>;
  getNumber(): Promise<string>;
  getReactiveAreaMode(): Promise<string>;
  getState(): Promise<string>;
  getTextAlign(): Promise<string>;
  getUnit(): Promise<string>;
  setActive(bActive: boolean): Promise<void>;
  setEmphasized(bEmphasized: boolean): Promise<void>;
  setEmptyIndicatorMode(sEmptyIndicatorMode: string): Promise<void>;
  setInverted(bInverted: boolean): Promise<void>;
  setNumber(sNumber: string): Promise<void>;
  setReactiveAreaMode(sReactiveAreaMode: string): Promise<void>;
  setState(sState: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setUnit(sUnit: string): Promise<void>;
}

/** sap.m.ProgressIndicator */
export interface UI5ProgressIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.ProgressIndicator';
  getDisplayAnimation(): Promise<boolean>;
  getDisplayOnly(): Promise<boolean>;
  getDisplayValue(): Promise<string>;
  getHeight(): Promise<string>;
  getPercentValue(): Promise<number>;
  getShowValue(): Promise<boolean>;
  getState(): Promise<string>;
  getWidth(): Promise<string>;
  setDisplayAnimation(bDisplayAnimation: boolean): Promise<void>;
  setDisplayOnly(bDisplayOnly: boolean): Promise<void>;
  setDisplayValue(sDisplayValue: string): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setPercentValue(fPercentValue: number): Promise<void>;
  setShowValue(bShowValue: boolean): Promise<void>;
  setState(sState: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.RatingIndicator */
export interface UI5RatingIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.RatingIndicator';
  getDisplayOnly(): Promise<boolean>;
  getEditable(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getIconHovered(): Promise<string>;
  getIconSelected(): Promise<string>;
  getIconSize(): Promise<string>;
  getIconUnselected(): Promise<string>;
  getMaxValue(): Promise<number>;
  getRequired(): Promise<boolean>;
  getValue(): Promise<number>;
  getVisualMode(): Promise<string>;
  setDisplayOnly(bDisplayOnly: boolean): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setIconHovered(sIconHovered: string): Promise<void>;
  setIconSelected(sIconSelected: string): Promise<void>;
  setIconSize(sIconSize: string): Promise<void>;
  setIconUnselected(sIconUnselected: string): Promise<void>;
  setMaxValue(iMaxValue: number): Promise<void>;
  setRequired(bRequired: boolean): Promise<void>;
  setValue(vValue: number): Promise<void>;
  setVisualMode(sVisualMode: string): Promise<void>;
}

/** sap.m.BusyIndicator */
export interface UI5BusyIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.BusyIndicator';
  getCustomIcon(): Promise<string>;
  getCustomIconDensityAware(): Promise<boolean>;
  getCustomIconHeight(): Promise<string>;
  getCustomIconRotationSpeed(): Promise<number>;
  getCustomIconWidth(): Promise<string>;
  getSize(): Promise<string>;
  getText(): Promise<string>;
  setCustomIcon(sCustomIcon: string): Promise<void>;
  setCustomIconDensityAware(bCustomIconDensityAware: boolean): Promise<void>;
  setCustomIconHeight(sCustomIconHeight: string): Promise<void>;
  setCustomIconRotationSpeed(iCustomIconRotationSpeed: number): Promise<void>;
  setCustomIconWidth(sCustomIconWidth: string): Promise<void>;
  setSize(sSize: string): Promise<void>;
  setText(sText: string): Promise<void>;
}

/** sap.m.MessageStrip */
export interface UI5MessageStrip extends UI5ControlBase {
  readonly controlType: 'sap.m.MessageStrip';
  close(): Promise<void>;
  getControls(): Promise<readonly UI5ControlBase[]>;
  getCustomIcon(): Promise<string>;
  getEnableFormattedText(): Promise<boolean>;
  getLink(): Promise<UI5ControlBase | null>;
  getShowCloseButton(): Promise<boolean>;
  getShowIcon(): Promise<boolean>;
  getText(): Promise<string>;
  getType(): Promise<unknown>;
  setCustomIcon(sCustomIcon: string): Promise<void>;
  setEnableFormattedText(bEnableFormattedText: boolean): Promise<void>;
  setLink(oLink: UI5ControlBase): Promise<void>;
  setShowCloseButton(bShowCloseButton: boolean): Promise<void>;
  setShowIcon(bShowIcon: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
  setType(sType: unknown): Promise<void>;
}

/** sap.m.GenericTile */
export interface UI5GenericTile extends UI5ControlBase {
  readonly controlType: 'sap.m.GenericTile';
  getActionButtons(): Promise<readonly UI5ControlBase[]>;
  getAdditionalTooltip(): Promise<string>;
  getAppShortcut(): Promise<string>;
  getAriaLabel(): Promise<string>;
  getAriaRole(): Promise<string>;
  getAriaRoleDescription(): Promise<string>;
  getBackgroundColor(): Promise<string>;
  getBackgroundImage(): Promise<string>;
  getBadge(): Promise<UI5ControlBase | null>;
  getEnableNavigationButton(): Promise<boolean>;
  getFailedText(): Promise<string>;
  getFrameType(): Promise<string>;
  getGridItemRole(): Promise<string>;
  getHeader(): Promise<string>;
  getHeaderImage(): Promise<string>;
  getIconLoaded(): Promise<boolean>;
  getImageDescription(): Promise<string>;
  getLinkTileContents(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
  getNavigationButtonText(): Promise<string>;
  getPressEnabled(): Promise<boolean>;
  getRenderOnThemeChange(): Promise<boolean>;
  getScope(): Promise<string>;
  getSizeBehavior(): Promise<string>;
  getState(): Promise<string>;
  getSubheader(): Promise<string>;
  getSystemInfo(): Promise<string>;
  getTileBadge(): Promise<string>;
  getTileContent(): Promise<readonly UI5ControlBase[]>;
  getTileIcon(): Promise<string>;
  getUrl(): Promise<string>;
  getValueColor(): Promise<string>;
  getWidth(): Promise<string>;
  getWrappingType(): Promise<string>;
  setAdditionalTooltip(sAdditionalTooltip: string): Promise<void>;
  setAppShortcut(sAppShortcut: string): Promise<void>;
  setAriaLabel(sAriaLabel: string): Promise<void>;
  setAriaRole(sAriaRole: string): Promise<void>;
  setAriaRoleDescription(sAriaRoleDescription: string): Promise<void>;
  setBackgroundColor(sBackgroundColor: string): Promise<void>;
  setBackgroundImage(sBackgroundImage: string): Promise<void>;
  setBadge(oBadge: UI5ControlBase): Promise<void>;
  setEnableNavigationButton(bEnableNavigationButton: boolean): Promise<void>;
  setFailedText(sFailedText: string): Promise<void>;
  setFrameType(sFrameType: string): Promise<void>;
  setHeader(sHeader: string): Promise<void>;
  setHeaderImage(sHeaderImage: string): Promise<void>;
  setIconLoaded(bIconLoaded: boolean): Promise<void>;
  setImageDescription(sImageDescription: string): Promise<void>;
  setMode(sMode: string): Promise<void>;
  setNavigationButtonText(sNavigationButtonText: string): Promise<void>;
  setRenderOnThemeChange(bRenderOnThemeChange: boolean): Promise<void>;
  setScope(sScope: string): Promise<void>;
  setSizeBehavior(sSizeBehavior: string): Promise<void>;
  setState(sState: string): Promise<void>;
  setSubheader(sSubheader: string): Promise<void>;
  setSystemInfo(sSystemInfo: string): Promise<void>;
  setTileBadge(sTileBadge: string): Promise<void>;
  setTileIcon(sTileIcon: string): Promise<void>;
  setUrl(sUrl: string): Promise<void>;
  setValueColor(sValueColor: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrappingType(sWrappingType: string): Promise<void>;
  press(): Promise<void>;
}

/** sap.m.NumericContent */
export interface UI5NumericContent extends UI5ControlBase {
  readonly controlType: 'sap.m.NumericContent';
  getAdaptiveFontSize(): Promise<boolean>;
  getAnimateTextChange(): Promise<boolean>;
  getFormatterValue(): Promise<boolean>;
  getIcon(): Promise<string>;
  getIconDescription(): Promise<string>;
  getIndicator(): Promise<string>;
  getNullifyValue(): Promise<boolean>;
  getScale(): Promise<string>;
  getState(): Promise<string>;
  getTruncateValueTo(): Promise<number>;
  getValue(): Promise<string>;
  getValueColor(): Promise<string>;
  getWidth(): Promise<string>;
  getWithMargin(): Promise<boolean>;
  setAdaptiveFontSize(bAdaptiveFontSize: boolean): Promise<void>;
  setAnimateTextChange(bAnimateTextChange: boolean): Promise<void>;
  setFormatterValue(bFormatterValue: boolean): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIconDescription(sIconDescription: string): Promise<void>;
  setIndicator(sIndicator: string): Promise<void>;
  setNullifyValue(bNullifyValue: boolean): Promise<void>;
  setScale(sScale: string): Promise<void>;
  setState(sState: string): Promise<void>;
  setTruncateValueTo(iTruncateValueTo: number): Promise<void>;
  setValue(sValue: string): Promise<void>;
  setValueColor(sValueColor: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWithMargin(bWithMargin: boolean): Promise<void>;
}

/** sap.m.FeedListItem */
export interface UI5FeedListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.FeedListItem';
  getActions(): Promise<readonly UI5ControlBase[]>;
  getActiveIcon(): Promise<string>;
  getConvertedLinksDefaultTarget(): Promise<string>;
  getConvertLinksToAnchorTags(): Promise<string>;
  getDisableStyleAttribute(): Promise<boolean>;
  getIcon(): Promise<string>;
  getIconActive(): Promise<boolean>;
  getIconDisplayShape(): Promise<string>;
  getIconInitials(): Promise<string>;
  getIconSize(): Promise<string>;
  getInfo(): Promise<string>;
  getLessLabel(): Promise<string>;
  getMaxCharacters(): Promise<number>;
  getMoreLabel(): Promise<string>;
  getSender(): Promise<string>;
  getSenderActive(): Promise<boolean>;
  getShowIcon(): Promise<boolean>;
  getText(): Promise<string>;
  getTimestamp(): Promise<string>;
  setActiveIcon(sActiveIcon: string): Promise<void>;
  setConvertedLinksDefaultTarget(sConvertedLinksDefaultTarget: string): Promise<void>;
  setConvertLinksToAnchorTags(sConvertLinksToAnchorTags: string): Promise<void>;
  setDisableStyleAttribute(bDisableStyleAttribute: boolean): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIconActive(bIconActive: boolean): Promise<void>;
  setIconDisplayShape(sIconDisplayShape: string): Promise<void>;
  setIconInitials(sIconInitials: string): Promise<void>;
  setIconSize(sIconSize: string): Promise<void>;
  setInfo(sInfo: string): Promise<void>;
  setLessLabel(sLessLabel: string): Promise<void>;
  setMaxCharacters(iMaxCharacters: number): Promise<void>;
  setMoreLabel(sMoreLabel: string): Promise<void>;
  setSender(sSender: string): Promise<void>;
  setSenderActive(bSenderActive: boolean): Promise<void>;
  setShowIcon(bShowIcon: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
  setTimestamp(sTimestamp: string): Promise<void>;
  setType(type: string): Promise<void>;
}

/** sap.m.ObjectIdentifier */
export interface UI5ObjectIdentifier extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectIdentifier';
  getEmptyIndicatorMode(): Promise<string>;
  getReactiveAreaMode(): Promise<string>;
  getText(): Promise<string>;
  getTitle(): Promise<string>;
  getTitleActive(): Promise<boolean>;
  setEmptyIndicatorMode(sEmptyIndicatorMode: string): Promise<void>;
  setReactiveAreaMode(sReactiveAreaMode: string): Promise<void>;
  setText(sText: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleActive(bValue: boolean): Promise<void>;
}

/** sap.m.ObjectAttribute */
export interface UI5ObjectAttribute extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectAttribute';
  getActive(): Promise<boolean>;
  getCustomContent(): Promise<UI5ControlBase | null>;
  getReactiveAreaMode(): Promise<string>;
  getText(): Promise<string>;
  getTitle(): Promise<string>;
  setActive(bActive: boolean): Promise<void>;
  setCustomContent(oCustomContent: UI5ControlBase): Promise<void>;
  setReactiveAreaMode(sReactiveAreaMode: string): Promise<void>;
  setText(sText: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.m.List */
export interface UI5List extends UI5ControlBase {
  readonly controlType: 'sap.m.List';
  getBackgroundDesign(): Promise<string>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
}

/** sap.m.Table */
export interface UI5Table extends UI5ControlBase {
  readonly controlType: 'sap.m.Table';
  focus(oFocusInfo?: unknown): Promise<void>;
  getAlternateRowColors(): Promise<boolean>;
  getAutoPopinMode(): Promise<boolean>;
  getBackgroundDesign(): Promise<string>;
  getColumns(bSort?: boolean): Promise<readonly UI5ControlBase[]>;
  getContextualWidth(): Promise<string>;
  getFixedLayout(): Promise<unknown>;
  getHiddenInPopin(): Promise<readonly string[]>;
  getPopinLayout(): Promise<string>;
  getShowOverlay(): Promise<boolean>;
  setAlternateRowColors(bAlternateRowColors: boolean): Promise<void>;
  setAutoPopinMode(bAutoPopinMode: boolean): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setContextualWidth(sContextualWidth: string): Promise<void>;
  setFixedLayout(oFixedLayout: unknown): Promise<void>;
  setHiddenInPopin(sHiddenInPopin: readonly string[]): Promise<void>;
  setPopinLayout(sPopinLayout: string): Promise<void>;
  setShowOverlay(bShowOverlay: boolean): Promise<void>;
}

/** sap.m.ColumnListItem */
export interface UI5ColumnListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.ColumnListItem';
  getCells(): Promise<readonly UI5ControlBase[]>;
  getVAlign(): Promise<string>;
  setVAlign(sVAlign: string): Promise<void>;
}

/** sap.m.StandardListItem */
export interface UI5StandardListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.StandardListItem';
  getActiveIcon(): Promise<string>;
  getAdaptTitleSize(): Promise<boolean>;
  getAvatar(): Promise<UI5ControlBase | null>;
  getDescription(): Promise<string>;
  getIcon(): Promise<string>;
  getIconInset(): Promise<boolean>;
  getInfo(): Promise<string>;
  getInfoState(): Promise<string>;
  getInfoStateInverted(): Promise<boolean>;
  getInfoTextDirection(): Promise<string>;
  getTitle(): Promise<string>;
  getTitleTextDirection(): Promise<string>;
  getWrapCharLimit(): Promise<number>;
  getWrapping(): Promise<boolean>;
  setActiveIcon(sActiveIcon: string): Promise<void>;
  setAdaptTitleSize(bAdaptTitleSize: boolean): Promise<void>;
  setAvatar(oAvatar: UI5ControlBase): Promise<void>;
  setDescription(sDescription: string): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIconInset(bIconInset: boolean): Promise<void>;
  setInfo(sInfo: string): Promise<void>;
  setInfoState(sInfoState: string): Promise<void>;
  setInfoStateInverted(bInfoStateInverted: boolean): Promise<void>;
  setInfoTextDirection(sInfoTextDirection: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleTextDirection(sTitleTextDirection: string): Promise<void>;
  setWrapCharLimit(iWrapCharLimit: number): Promise<void>;
  setWrapping(bWrapping: boolean): Promise<void>;
}

/** sap.m.ObjectListItem */
export interface UI5ObjectListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectListItem';
  getActiveIcon(): Promise<string>;
  getAttributes(): Promise<readonly UI5ControlBase[]>;
  getFirstStatus(): Promise<UI5ControlBase | null>;
  getIcon(): Promise<string>;
  getIntro(): Promise<string>;
  getIntroTextDirection(): Promise<string>;
  getMarkers(): Promise<readonly UI5ControlBase[]>;
  getNumber(): Promise<string>;
  getNumberState(): Promise<string>;
  getNumberTextDirection(): Promise<string>;
  getNumberUnit(): Promise<string>;
  getSecondStatus(): Promise<UI5ControlBase | null>;
  getTitle(): Promise<string>;
  getTitleTextDirection(): Promise<string>;
  setActiveIcon(sActiveIcon: string): Promise<void>;
  setFirstStatus(oFirstStatus: UI5ControlBase): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIntro(sIntro: string): Promise<void>;
  setIntroTextDirection(sIntroTextDirection: string): Promise<void>;
  setNumber(sNumber: string): Promise<void>;
  setNumberState(sNumberState: string): Promise<void>;
  setNumberTextDirection(sNumberTextDirection: string): Promise<void>;
  setNumberUnit(sNumberUnit: string): Promise<void>;
  setSecondStatus(oSecondStatus: UI5ControlBase): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleTextDirection(sTitleTextDirection: string): Promise<void>;
}

/** sap.m.Tree */
export interface UI5Tree extends UI5ControlBase {
  readonly controlType: 'sap.m.Tree';
  collapse(vParam: number | readonly number[]): Promise<void>;
  collapseAll(): Promise<void>;
  expand(vParam: number | readonly number[]): Promise<void>;
  expandToLevel(iLevel: number): Promise<void>;
}

/** sap.m.SelectList */
export interface UI5SelectList extends UI5ControlBase {
  readonly controlType: 'sap.m.SelectList';
  getEnabled(): Promise<boolean>;
  getEnabledItems(aItems?: readonly UI5ControlBase[]): Promise<readonly UI5ControlBase[]>;
  getFirstItem(): Promise<UI5ControlBase | null>;
  getItemAt(iIndex: number): Promise<UI5ControlBase | null>;
  getItemByKey(sKey: string): Promise<UI5ControlBase | null>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getLastItem(): Promise<UI5ControlBase | null>;
  getMaxWidth(): Promise<string>;
  getSelectedItem(): Promise<UI5ControlBase | null>;
  getSelectedItemId(): Promise<string>;
  getSelectedKey(): Promise<string>;
  getShowSecondaryValues(): Promise<boolean>;
  getWidth(): Promise<string>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setMaxWidth(sMaxWidth: string): Promise<void>;
  setSelectedItem(vItem: string | UI5ControlBase | null): Promise<void>;
  setSelectedItemId(vItem: string): Promise<void>;
  setSelectedKey(sKey: string): Promise<void>;
  setShowSecondaryValues(bShowSecondaryValues: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.ListBase */
export interface UI5ListBase extends UI5ControlBase {
  readonly controlType: 'sap.m.ListBase';
  getContextMenu(): Promise<UI5ControlBase | null>;
  getEnableBusyIndicator(): Promise<boolean>;
  getFooterText(): Promise<string>;
  getGrowing(): Promise<boolean>;
  getGrowingDirection(): Promise<string>;
  getGrowingInfo(): Promise<unknown>;
  getGrowingScrollToLoad(): Promise<boolean>;
  getGrowingThreshold(): Promise<number>;
  getGrowingTriggerText(): Promise<string>;
  getHeaderLevel(): Promise<string>;
  getHeaderText(): Promise<string>;
  getHeaderToolbar(): Promise<UI5ControlBase | null>;
  getIncludeItemInSelection(): Promise<boolean>;
  getInfoToolbar(): Promise<UI5ControlBase | null>;
  getInset(): Promise<boolean>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getKeyboardMode(): Promise<string>;
  getMode(): Promise<string>;
  getModeAnimationOn(): Promise<boolean>;
  getMultiSelectMode(): Promise<string>;
  getNoData(): Promise<UI5ControlBase | null>;
  getNoDataText(): Promise<string>;
  getRememberSelections(): Promise<boolean>;
  getSelectedContexts(bAll?: boolean): Promise<readonly string[]>;
  getSelectedItem(): Promise<UI5ControlBase>;
  getSelectedItems(): Promise<readonly UI5ControlBase[]>;
  getShowNoData(): Promise<boolean>;
  getShowSeparators(): Promise<string>;
  getShowUnread(): Promise<boolean>;
  getSticky(): Promise<readonly string[]>;
  getSwipeContent(): Promise<UI5ControlBase | null>;
  getSwipeDirection(): Promise<string>;
  getSwipedItem(): Promise<UI5ControlBase>;
  getWidth(): Promise<string>;
  requestItems(iItems?: number): Promise<void>;
  scrollToIndex(iIndex: number): Promise<unknown>;
  selectAll(bFireEvent?: boolean): Promise<void>;
  setContextMenu(oContextMenu: UI5ControlBase): Promise<void>;
  setEnableBusyIndicator(bEnableBusyIndicator: boolean): Promise<void>;
  setFooterText(sFooterText: string): Promise<void>;
  setGrowing(bGrowing: boolean): Promise<void>;
  setGrowingDirection(sGrowingDirection: string): Promise<void>;
  setGrowingScrollToLoad(bGrowingScrollToLoad: boolean): Promise<void>;
  setGrowingThreshold(iGrowingThreshold: number): Promise<void>;
  setGrowingTriggerText(sGrowingTriggerText: string): Promise<void>;
  setHeaderLevel(sHeaderLevel: string): Promise<void>;
  setHeaderText(sHeaderText: string): Promise<void>;
  setHeaderToolbar(oHeaderToolbar: UI5ControlBase): Promise<void>;
  setIncludeItemInSelection(bIncludeItemInSelection: boolean): Promise<void>;
  setInfoToolbar(oInfoToolbar: UI5ControlBase): Promise<void>;
  setInset(bInset: boolean): Promise<void>;
  setKeyboardMode(sKeyboardMode: string): Promise<void>;
  setMode(sMode: string): Promise<void>;
  setModeAnimationOn(bModeAnimationOn: boolean): Promise<void>;
  setMultiSelectMode(sMultiSelectMode: string): Promise<void>;
  setNoData(vNoData: UI5ControlBase | string): Promise<void>;
  setNoDataText(sNoDataText: string): Promise<void>;
  setRememberSelections(bRememberSelections: boolean): Promise<void>;
  setSelectedItem(
    oListItem: UI5ControlBase,
    bSelect?: boolean,
    bFireEvent?: boolean,
  ): Promise<void>;
  setSelectedItemById(sId: string, bSelect?: boolean): Promise<void>;
  setShowNoData(bShowNoData: boolean): Promise<void>;
  setShowSeparators(sShowSeparators: string): Promise<void>;
  setShowUnread(bShowUnread: boolean): Promise<void>;
  setSticky(sSticky: readonly string[]): Promise<void>;
  setSwipeContent(oSwipeContent: UI5ControlBase): Promise<void>;
  setSwipeDirection(sSwipeDirection: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  swipeOut(): Promise<void>;
}

/** sap.m.Dialog */
export interface UI5Dialog extends UI5ControlBase {
  readonly controlType: 'sap.m.Dialog';
  getBeginButton(): Promise<UI5ControlBase | null>;
  getButtons(): Promise<readonly UI5ControlBase[]>;
  getCloseOnNavigation(): Promise<boolean>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getContentHeight(): Promise<string>;
  getContentWidth(): Promise<string>;
  getCustomHeader(): Promise<UI5ControlBase | null>;
  getDraggable(): Promise<boolean>;
  getEndButton(): Promise<UI5ControlBase | null>;
  getEscapeHandler(): Promise<string>;
  getFooter(): Promise<UI5ControlBase | null>;
  getHorizontalScrolling(): Promise<boolean>;
  getIcon(): Promise<string>;
  getInitialFocus(): Promise<string | null>;
  getResizable(): Promise<boolean>;
  getShowHeader(): Promise<boolean>;
  getState(): Promise<string>;
  getStretch(): Promise<boolean>;
  getSubHeader(): Promise<UI5ControlBase | null>;
  getTitle(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  getType(): Promise<string>;
  getVerticalScrolling(): Promise<boolean>;
  open(): Promise<void>;
  setBeginButton(oBeginButton: UI5ControlBase): Promise<void>;
  setCloseOnNavigation(bCloseOnNavigation: boolean): Promise<void>;
  setContentHeight(sContentHeight: string): Promise<void>;
  setContentWidth(sContentWidth: string): Promise<void>;
  setCustomHeader(oCustomHeader: UI5ControlBase): Promise<void>;
  setDraggable(bDraggable: boolean): Promise<void>;
  setEndButton(oEndButton: UI5ControlBase): Promise<void>;
  setEscapeHandler(sEscapeHandler: string): Promise<void>;
  setFooter(oFooter: UI5ControlBase): Promise<void>;
  setHorizontalScrolling(bHorizontalScrolling: boolean): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setInitialFocus(oInitialFocus: string | UI5ControlBase): Promise<void>;
  setResizable(bResizable: boolean): Promise<void>;
  setShowHeader(bShowHeader: boolean): Promise<void>;
  setState(sState: string): Promise<void>;
  setStretch(bStretch: boolean): Promise<void>;
  setSubHeader(oSubHeader: UI5ControlBase): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
  setType(sType: string): Promise<void>;
  setVerticalScrolling(bVerticalScrolling: boolean): Promise<void>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.Popover */
export interface UI5Popover extends UI5ControlBase {
  readonly controlType: 'sap.m.Popover';
  getBeginButton(): Promise<UI5ControlBase | null>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getContentHeight(): Promise<string>;
  getContentMinWidth(): Promise<string>;
  getContentWidth(): Promise<string>;
  getCustomHeader(): Promise<UI5ControlBase | null>;
  getEndButton(): Promise<UI5ControlBase | null>;
  getFooter(): Promise<UI5ControlBase | null>;
  getHorizontalScrolling(): Promise<boolean>;
  getInitialFocus(): Promise<string | null>;
  getModal(): Promise<boolean>;
  getOffsetX(): Promise<number>;
  getOffsetY(): Promise<number>;
  getPlacement(): Promise<string>;
  getResizable(): Promise<boolean>;
  getShowArrow(): Promise<boolean>;
  getShowHeader(): Promise<boolean>;
  getSubHeader(): Promise<UI5ControlBase | null>;
  getTitle(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  getVerticalScrolling(): Promise<boolean>;
  openBy(oControl: UI5ControlBase | HTMLElement, bSkipInstanceManager?: boolean): Promise<void>;
  setBeginButton(oBeginButton: UI5ControlBase): Promise<void>;
  setContentHeight(sContentHeight: string): Promise<void>;
  setContentMinWidth(sContentMinWidth: string): Promise<void>;
  setContentWidth(sContentWidth: string): Promise<void>;
  setCustomHeader(oCustomHeader: UI5ControlBase): Promise<void>;
  setEndButton(oEndButton: UI5ControlBase): Promise<void>;
  setFooter(oFooter: UI5ControlBase): Promise<void>;
  setHorizontalScrolling(bHorizontalScrolling: boolean): Promise<void>;
  setInitialFocus(oInitialFocus: string | UI5ControlBase): Promise<void>;
  setModal(bModal: boolean): Promise<void>;
  setOffsetX(iOffsetX: number): Promise<void>;
  setOffsetY(iOffsetY: number): Promise<void>;
  setPlacement(sPlacement: string): Promise<void>;
  setResizable(bResizable: boolean): Promise<void>;
  setShowArrow(bShowArrow: boolean): Promise<void>;
  setShowHeader(bShowHeader: boolean): Promise<void>;
  setSubHeader(oSubHeader: UI5ControlBase): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
  setVerticalScrolling(bVerticalScrolling: boolean): Promise<void>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.ResponsivePopover */
export interface UI5ResponsivePopover extends UI5ControlBase {
  readonly controlType: 'sap.m.ResponsivePopover';
  getBeginButton(): Promise<UI5ControlBase | null>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getContentHeight(): Promise<string>;
  getContentWidth(): Promise<string>;
  getCustomHeader(): Promise<UI5ControlBase | null>;
  getEndButton(): Promise<UI5ControlBase | null>;
  getFooter(): Promise<UI5ControlBase | null>;
  getHorizontalScrolling(): Promise<boolean>;
  getIcon(): Promise<string>;
  getInitialFocus(): Promise<string | null>;
  getModal(): Promise<boolean>;
  getOffsetX(): Promise<number>;
  getOffsetY(): Promise<number>;
  getPlacement(): Promise<string>;
  getResizable(): Promise<boolean>;
  getShowArrow(): Promise<boolean>;
  getShowCloseButton(): Promise<boolean>;
  getShowHeader(): Promise<boolean>;
  getSubHeader(): Promise<UI5ControlBase | null>;
  getTitle(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  getVerticalScrolling(): Promise<boolean>;
  openBy(oParent: UI5ControlBase | HTMLElement): Promise<string>;
  setBeginButton(oButton: UI5ControlBase): Promise<void>;
  setContentHeight(sContentHeight: string): Promise<void>;
  setContentWidth(sContentWidth: string): Promise<void>;
  setCustomHeader(oCustomHeader: UI5ControlBase): Promise<void>;
  setEndButton(oButton: UI5ControlBase): Promise<void>;
  setFooter(oFooter: UI5ControlBase): Promise<void>;
  setHorizontalScrolling(bHorizontalScrolling: boolean): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setInitialFocus(oInitialFocus: string | UI5ControlBase): Promise<void>;
  setModal(bModal: boolean): Promise<void>;
  setOffsetX(iOffsetX: number): Promise<void>;
  setOffsetY(iOffsetY: number): Promise<void>;
  setPlacement(sPlacement: string): Promise<void>;
  setResizable(bResizable: boolean): Promise<void>;
  setShowArrow(bShowArrow: boolean): Promise<void>;
  setShowCloseButton(bShowCloseButton: boolean): Promise<void>;
  setShowHeader(bShowHeader: boolean): Promise<void>;
  setSubHeader(oSubHeader: UI5ControlBase): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
  setVerticalScrolling(bVerticalScrolling: boolean): Promise<void>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.MessagePopover */
export interface UI5MessagePopover extends UI5ControlBase {
  readonly controlType: 'sap.m.MessagePopover';
  close(): Promise<void>;
  getAsyncDescriptionHandler(): Promise<unknown>;
  getAsyncURLHandler(): Promise<unknown>;
  getGroupItems(): Promise<boolean>;
  getHeaderButton(): Promise<UI5ControlBase | null>;
  getInitiallyExpanded(): Promise<boolean>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getPlacement(): Promise<string>;
  navigateBack(): Promise<void>;
  openBy(oControl: UI5ControlBase): Promise<void>;
  setAsyncDescriptionHandler(fnAsyncDescriptionHandler: unknown): Promise<void>;
  setAsyncURLHandler(fnAsyncURLHandler: unknown): Promise<void>;
  setGroupItems(bGroupItems: boolean): Promise<void>;
  setHeaderButton(oHeaderButton: UI5ControlBase): Promise<void>;
  setInitiallyExpanded(bInitiallyExpanded: boolean): Promise<void>;
  setPlacement(sPlacement: string): Promise<void>;
  toggle(oControl: UI5ControlBase): Promise<void>;
  isOpen(): Promise<boolean>;
}

/** sap.m.ActionSheet */
export interface UI5ActionSheet extends UI5ControlBase {
  readonly controlType: 'sap.m.ActionSheet';
  close(): Promise<void>;
  getButtons(): Promise<readonly UI5ControlBase[]>;
  getCancelButtonText(): Promise<string>;
  getPlacement(): Promise<string>;
  getShowCancelButton(): Promise<boolean>;
  getTitle(): Promise<string>;
  openBy(oControl: UI5ControlBase | HTMLElement): Promise<void>;
  setCancelButtonText(sCancelButtonText: string): Promise<void>;
  setPlacement(sPlacement: string): Promise<void>;
  setShowCancelButton(bShowCancelButton: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  isOpen(): Promise<boolean>;
}

/** sap.m.ViewSettingsDialog */
export interface UI5ViewSettingsDialog extends UI5ControlBase {
  readonly controlType: 'sap.m.ViewSettingsDialog';
  clearFilters(): Promise<void>;
  getCustomTabs(): Promise<readonly UI5ControlBase[]>;
  getFilterItems(): Promise<readonly UI5ControlBase[]>;
  getFilterSearchOperator(): Promise<string>;
  getGroupDescending(): Promise<boolean>;
  getGroupItems(): Promise<readonly UI5ControlBase[]>;
  getPresetFilterItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedFilterCompoundKeys(): Promise<unknown>;
  getSelectedFilterItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedFilterString(): Promise<string>;
  getSelectedGroupItem(): Promise<string | null>;
  getSelectedPresetFilterItem(): Promise<string | null>;
  getSelectedSortItem(): Promise<string | null>;
  getSortDescending(): Promise<boolean>;
  getSortItems(): Promise<readonly UI5ControlBase[]>;
  getTitle(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  open(sPageId?: string): Promise<void>;
  setFilterSearchCallback(): Promise<void>;
  setFilterSearchOperator(sFilterSearchOperator: string): Promise<void>;
  setGroupDescending(bGroupDescending: boolean): Promise<void>;
  setSelectedFilterCompoundKeys(): Promise<void>;
  setSelectedGroupItem(vItemOrKey: UI5ControlBase | string): Promise<void>;
  setSelectedPresetFilterItem(vItemOrKey: UI5ControlBase | string | null): Promise<void>;
  setSelectedSortItem(vItemOrKey: UI5ControlBase | string): Promise<void>;
  setSortDescending(bSortDescending: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
}

/** sap.m.IconTabBar */
export interface UI5IconTabBar extends UI5ControlBase {
  readonly controlType: 'sap.m.IconTabBar';
  getApplyContentPadding(): Promise<boolean>;
  getAriaTexts(): Promise<unknown>;
  getBackgroundDesign(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getEnableTabReordering(): Promise<boolean>;
  getExpandable(): Promise<boolean>;
  getExpanded(): Promise<boolean>;
  getHeaderBackgroundDesign(): Promise<string>;
  getHeaderMode(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMaxNestingLevel(): Promise<number>;
  getSelectedKey(): Promise<string>;
  getStretchContentHeight(): Promise<boolean>;
  getTabDensityMode(): Promise<string>;
  getTabsOverflowMode(): Promise<string>;
  getUpperCase(): Promise<boolean>;
  setApplyContentPadding(bApplyContentPadding: boolean): Promise<void>;
  setAriaTexts(oAriaTexts: unknown): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setEnableTabReordering(value: boolean): Promise<void>;
  setExpandable(bExpandable: boolean): Promise<void>;
  setExpanded(bExpanded: boolean): Promise<void>;
  setHeaderBackgroundDesign(headerBackgroundDesign: string): Promise<void>;
  setHeaderMode(mode: string): Promise<void>;
  setMaxNestingLevel(iMaxNestingLevel: number): Promise<void>;
  setSelectedKey(sValue: string): Promise<void>;
  setStretchContentHeight(bStretchContentHeight: boolean): Promise<void>;
  setTabDensityMode(mode: string): Promise<void>;
  setTabsOverflowMode(sTabsOverflowMode: string): Promise<void>;
  setUpperCase(bUpperCase: boolean): Promise<void>;
}

/** sap.m.IconTabFilter */
export interface UI5IconTabFilter extends UI5ControlBase {
  readonly controlType: 'sap.m.IconTabFilter';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getCount(): Promise<string>;
  getDesign(): Promise<string>;
  getIcon(): Promise<string>;
  getIconColor(): Promise<string>;
  getInteractionMode(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getShowAll(): Promise<boolean>;
  setCount(sCount: string): Promise<void>;
  setDesign(sDesign: string): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIconColor(sIconColor: string): Promise<void>;
  setInteractionMode(sInteractionMode: string): Promise<void>;
  setShowAll(bShowAll: boolean): Promise<void>;
}

/** sap.m.TabContainer */
export interface UI5TabContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.TabContainer';
  getAddButton(): Promise<UI5ControlBase>;
  getBackgroundDesign(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedItem(): Promise<string | null>;
  getShowAddNewButton(): Promise<boolean>;
  setAddButton(oButton: UI5ControlBase): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setSelectedItem(oSelectedItem: string | UI5ControlBase): Promise<void>;
  setShowAddNewButton(bShowAddNewButton: boolean): Promise<void>;
}

/** sap.m.Breadcrumbs */
export interface UI5Breadcrumbs extends UI5ControlBase {
  readonly controlType: 'sap.m.Breadcrumbs';
  getCurrentLocation(): Promise<UI5ControlBase | null>;
  getCurrentLocationText(): Promise<string>;
  getLinks(): Promise<readonly UI5ControlBase[]>;
  getSeparatorStyle(): Promise<string>;
  setCurrentLocation(oCurrentLocation: UI5ControlBase): Promise<void>;
  setCurrentLocationText(sCurrentLocationText: string): Promise<void>;
  setSeparatorStyle(sSeparatorStyle: string): Promise<void>;
}

/** sap.m.OverflowToolbar */
export interface UI5OverflowToolbar extends UI5ControlBase {
  readonly controlType: 'sap.m.OverflowToolbar';
  closeOverflow(): Promise<void>;
  getAsyncMode(): Promise<boolean>;
  setAsyncMode(bValue: boolean): Promise<void>;
}

/** sap.m.Toolbar */
export interface UI5Toolbar extends UI5ControlBase {
  readonly controlType: 'sap.m.Toolbar';
  getActive(): Promise<boolean>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getDesign(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getHeight(): Promise<string>;
  getStyle(): Promise<string>;
  getWidth(): Promise<string>;
  setActive(bActive: boolean): Promise<void>;
  setDesign(sDesign: string): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setStyle(sStyle: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.Bar */
export interface UI5Bar extends UI5ControlBase {
  readonly controlType: 'sap.m.Bar';
  getContentLeft(): Promise<readonly UI5ControlBase[]>;
  getContentMiddle(): Promise<readonly UI5ControlBase[]>;
  getContentRight(): Promise<readonly UI5ControlBase[]>;
  getDesign(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  setDesign(sDesign: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
}

/** sap.m.Wizard */
export interface UI5Wizard extends UI5ControlBase {
  readonly controlType: 'sap.m.Wizard';
  discardProgress(oStep: UI5ControlBase, bPreserveNextStep: boolean): Promise<void>;
  getBackgroundDesign(): Promise<string>;
  getCurrentStep(): Promise<string | null>;
  getEnableBranching(): Promise<boolean>;
  getFinishButtonText(): Promise<string>;
  getHeight(): Promise<string>;
  getProgress(): Promise<number>;
  getProgressStep(): Promise<UI5ControlBase>;
  getRenderMode(): Promise<string>;
  getShowNextButton(): Promise<boolean>;
  getSteps(): Promise<readonly UI5ControlBase[]>;
  getStepTitleLevel(): Promise<string>;
  getWidth(): Promise<string>;
  goToStep(oStep: UI5ControlBase, bFocusFirstStepElement: boolean): Promise<void>;
  invalidateStep(oStep: UI5ControlBase): Promise<void>;
  nextStep(): Promise<void>;
  previousStep(): Promise<void>;
  setCurrentStep(vStepId: UI5ControlBase | string): Promise<void>;
  setEnableBranching(bEnableBranching: boolean): Promise<void>;
  setFinishButtonText(sFinishButtonText: string): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setRenderMode(sRenderMode: string): Promise<void>;
  setShowNextButton(bValue: boolean): Promise<void>;
  setStepTitleLevel(sStepTitleLevel: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  validateStep(oStep: UI5ControlBase): Promise<void>;
}

/** sap.m.WizardStep */
export interface UI5WizardStep extends UI5ControlBase {
  readonly controlType: 'sap.m.WizardStep';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getIcon(): Promise<string>;
  getNextStep(): Promise<string | null>;
  getOptional(): Promise<boolean>;
  getSubsequentSteps(): Promise<readonly string[]>;
  getTitle(): Promise<string>;
  getValidated(): Promise<boolean>;
  setIcon(sIcon: string): Promise<void>;
  setNextStep(oNextStep: string | UI5ControlBase): Promise<void>;
  setOptional(bOptional: boolean): Promise<void>;
  setTitle(sNewTitle: string): Promise<void>;
  setValidated(bValidated: boolean): Promise<void>;
}

/** sap.m.Menu */
export interface UI5Menu extends UI5ControlBase {
  readonly controlType: 'sap.m.Menu';
  close(): Promise<void>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedItems(): Promise<unknown>;
  getTitle(): Promise<string>;
  isOpen(): Promise<boolean>;
  openAsContextMenu(oOpenerRef: UI5ControlBase | HTMLElement): Promise<void>;
  openBy(
    oControl: UI5ControlBase,
    bWithKeyboard: boolean,
    sDockMy?: string,
    sDockAt?: string,
    sOffset?: string,
  ): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.m.MenuItem */
export interface UI5MenuItem extends UI5ControlBase {
  readonly controlType: 'sap.m.MenuItem';
  getEndContent(): Promise<readonly UI5ControlBase[]>;
  getIcon(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelected(): Promise<boolean>;
  getShortcutText(): Promise<string>;
  getStartsSection(): Promise<boolean>;
  setIcon(sIcon: string): Promise<void>;
  setShortcutText(sShortcutText: string): Promise<void>;
  setStartsSection(bStartsSection: boolean): Promise<void>;
}

/** sap.m.Page */
export interface UI5Page extends UI5ControlBase {
  readonly controlType: 'sap.m.Page';
  getBackgroundDesign(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getContentOnlyBusy(): Promise<boolean>;
  getCustomHeader(): Promise<UI5ControlBase | null>;
  getEnableScrolling(): Promise<boolean>;
  getFloatingFooter(): Promise<boolean>;
  getFooter(): Promise<UI5ControlBase | null>;
  getHeaderContent(): Promise<readonly UI5ControlBase[]>;
  getLandmarkInfo(): Promise<UI5ControlBase | null>;
  getNavButtonTooltip(): Promise<string>;
  getShowFooter(): Promise<boolean>;
  getShowHeader(): Promise<boolean>;
  getShowNavButton(): Promise<boolean>;
  getShowSubHeader(): Promise<boolean>;
  getSubHeader(): Promise<UI5ControlBase | null>;
  getTitle(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  getTitleLevel(): Promise<string>;
  scrollTo(y: number, time?: number): Promise<void>;
  scrollToElement(
    oElement: HTMLElement | UI5ControlBase,
    iTime?: number,
    aOffset?: readonly number[],
  ): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setContentOnlyBusy(bContentOnlyBusy: boolean): Promise<void>;
  setCustomHeader(oCustomHeader: UI5ControlBase): Promise<void>;
  setEnableScrolling(bEnableScrolling: boolean): Promise<void>;
  setFloatingFooter(bFloatingFooter: boolean): Promise<void>;
  setFooter(oFooter: UI5ControlBase): Promise<void>;
  setLandmarkInfo(oLandmarkInfo: UI5ControlBase): Promise<void>;
  setNavButtonTooltip(sNavButtonTooltip: string): Promise<void>;
  setShowFooter(bShowFooter: boolean): Promise<void>;
  setShowHeader(bShowHeader: boolean): Promise<void>;
  setShowNavButton(bShowNavButton: boolean): Promise<void>;
  setShowSubHeader(bShowSubHeader: boolean): Promise<void>;
  setSubHeader(oSubHeader: UI5ControlBase): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
  setTitleLevel(sTitleLevel: string): Promise<void>;
}

/** sap.m.Panel */
export interface UI5Panel extends UI5ControlBase {
  readonly controlType: 'sap.m.Panel';
  getBackgroundDesign(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getExpandable(): Promise<boolean>;
  getExpandAnimation(): Promise<boolean>;
  getExpanded(): Promise<boolean>;
  getHeaderText(): Promise<string>;
  getHeaderToolbar(): Promise<UI5ControlBase | null>;
  getHeight(): Promise<string>;
  getInfoToolbar(): Promise<UI5ControlBase | null>;
  getStickyHeader(): Promise<boolean>;
  getWidth(): Promise<string>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setExpandable(bExpandable: boolean): Promise<void>;
  setExpandAnimation(bExpandAnimation: boolean): Promise<void>;
  setExpanded(bExpanded: boolean): Promise<void>;
  setHeaderText(sHeaderText: string): Promise<void>;
  setHeaderToolbar(oHeaderToolbar: UI5ControlBase): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setInfoToolbar(oInfoToolbar: UI5ControlBase): Promise<void>;
  setStickyHeader(bStickyHeader: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.ScrollContainer */
export interface UI5ScrollContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.ScrollContainer';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getFocusable(): Promise<boolean>;
  getHeight(): Promise<string>;
  getHorizontal(): Promise<boolean>;
  getVertical(): Promise<boolean>;
  getWidth(): Promise<string>;
  scrollTo(x: number, y: number, time?: number): Promise<void>;
  scrollToElement(element: HTMLElement | UI5ControlBase, time?: number): Promise<void>;
  setFocusable(bFocusable: boolean): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setHorizontal(bHorizontal: boolean): Promise<void>;
  setVertical(bVertical: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.FlexBox */
export interface UI5FlexBox extends UI5ControlBase {
  readonly controlType: 'sap.m.FlexBox';
  getAlignContent(): Promise<string>;
  getAlignItems(): Promise<string>;
  getBackgroundDesign(): Promise<string>;
  getColumnGap(): Promise<string>;
  getDirection(): Promise<string>;
  getDisplayInline(): Promise<boolean>;
  getFitContainer(): Promise<boolean>;
  getGap(): Promise<string>;
  getHeight(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getJustifyContent(): Promise<string>;
  getRenderType(): Promise<string>;
  getRowGap(): Promise<string>;
  getWidth(): Promise<string>;
  getWrap(): Promise<string>;
  setAlignContent(sAlignContent: string): Promise<void>;
  setAlignItems(sAlignItems: string): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setColumnGap(sColumnGap: string): Promise<void>;
  setDirection(sDirection: string): Promise<void>;
  setDisplayInline(bDisplayInline: boolean): Promise<void>;
  setFitContainer(bFitContainer: boolean): Promise<void>;
  setGap(sGap: string): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setJustifyContent(sJustifyContent: string): Promise<void>;
  setRenderType(sValue: string): Promise<void>;
  setRowGap(sRowGap: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrap(sWrap: string): Promise<void>;
}

/** sap.m.HBox */
export interface UI5HBox extends UI5ControlBase {
  readonly controlType: 'sap.m.HBox';
}

/** sap.m.VBox */
export interface UI5VBox extends UI5ControlBase {
  readonly controlType: 'sap.m.VBox';
  getDirection(): Promise<string>;
  setDirection(sDirection: string): Promise<void>;
}

/** sap.m.Carousel */
export interface UI5Carousel extends UI5ControlBase {
  readonly controlType: 'sap.m.Carousel';
  getActivePage(): Promise<string | null>;
  getArrowsPlacement(): Promise<string>;
  getBackgroundDesign(): Promise<string>;
  getCustomLayout(): Promise<UI5ControlBase | null>;
  getHeight(): Promise<string>;
  getLoop(): Promise<boolean>;
  getPageIndicatorBackgroundDesign(): Promise<string>;
  getPageIndicatorBorderDesign(): Promise<string>;
  getPageIndicatorPlacement(): Promise<string>;
  getPages(): Promise<readonly UI5ControlBase[]>;
  getShowPageIndicator(): Promise<boolean>;
  getWidth(): Promise<string>;
  next(): Promise<void>;
  previous(): Promise<void>;
  setActivePage(oActivePage: string | UI5ControlBase): Promise<void>;
  setArrowsPlacement(sArrowsPlacement: string): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setCustomLayout(oCustomLayout: UI5ControlBase): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setLoop(bLoop: boolean): Promise<void>;
  setPageIndicatorBackgroundDesign(sPageIndicatorBackgroundDesign: string): Promise<void>;
  setPageIndicatorBorderDesign(sPageIndicatorBorderDesign: string): Promise<void>;
  setPageIndicatorPlacement(sPageIndicatorPlacement: string): Promise<void>;
  setShowPageIndicator(bShowPageIndicator: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.SplitContainer */
export interface UI5SplitContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.SplitContainer';
  backDetail(backData?: unknown, transitionParameters?: unknown): Promise<void>;
  backMaster(backData?: unknown, transitionParameters?: unknown): Promise<void>;
  backToPage(pageId: string, backData?: unknown, transitionParameters?: unknown): Promise<void>;
  backToTopDetail(backData?: unknown, transitionParameters?: unknown): Promise<void>;
  backToTopMaster(backData?: unknown, transitionParameters?: unknown): Promise<void>;
  getBackgroundColor(): Promise<string>;
  getBackgroundImage(): Promise<string>;
  getBackgroundOpacity(): Promise<number>;
  getBackgroundRepeat(): Promise<boolean>;
  getCurrentDetailPage(): Promise<UI5ControlBase>;
  getCurrentMasterPage(): Promise<UI5ControlBase>;
  getCurrentPage(bMaster: boolean): Promise<UI5ControlBase>;
  getDefaultTransitionNameDetail(): Promise<string>;
  getDefaultTransitionNameMaster(): Promise<string>;
  getDetailPage(pageId: string): Promise<UI5ControlBase | null>;
  getDetailPages(): Promise<readonly UI5ControlBase[]>;
  getInitialDetail(): Promise<string | null>;
  getInitialMaster(): Promise<string | null>;
  getMasterButtonText(): Promise<string>;
  getMasterButtonTooltip(): Promise<string>;
  getMasterPage(pageId: string): Promise<UI5ControlBase | null>;
  getMasterPages(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
  getPage(pageId: string, bMaster: boolean): Promise<UI5ControlBase | null>;
  getPreviousPage(bMaster: boolean): Promise<UI5ControlBase>;
  hideMaster(): Promise<void>;
  isMasterShown(): Promise<boolean>;
  setBackgroundColor(sBackgroundColor: string): Promise<void>;
  setBackgroundImage(sBackgroundImage: string): Promise<void>;
  setBackgroundOpacity(fBackgroundOpacity: number): Promise<void>;
  setBackgroundRepeat(bBackgroundRepeat: boolean): Promise<void>;
  setDefaultTransitionNameDetail(sDefaultTransitionNameDetail: string): Promise<void>;
  setDefaultTransitionNameMaster(sDefaultTransitionNameMaster: string): Promise<void>;
  setInitialDetail(oInitialDetail: string | UI5ControlBase): Promise<void>;
  setInitialMaster(oInitialMaster: string | UI5ControlBase): Promise<void>;
  setMasterButtonText(sMasterButtonText: string): Promise<void>;
  setMasterButtonTooltip(sMasterButtonTooltip: string): Promise<void>;
  setMode(sMode: string): Promise<void>;
  showMaster(): Promise<void>;
  to(
    pageId: string,
    transitionName?: string,
    data?: unknown,
    transitionParameters?: unknown,
  ): Promise<void>;
  toDetail(
    pageId: string,
    transitionName: string,
    data?: unknown,
    transitionParameters?: unknown,
  ): Promise<void>;
  toMaster(
    pageId: string,
    transitionName: string,
    data?: unknown,
    transitionParameters?: unknown,
  ): Promise<void>;
}

/** sap.m.DateRangeSelection */
export interface UI5DateRangeSelection extends UI5ControlBase {
  readonly controlType: 'sap.m.DateRangeSelection';
  getDateValue(): Promise<unknown>;
  getDelimiter(): Promise<string>;
  getSecondDateValue(): Promise<unknown>;
  getValue(): Promise<string>;
  getValueFormat(): Promise<string>;
  setDateValue(): Promise<void>;
  setDelimiter(sDelimiter: string): Promise<void>;
  setDisplayFormat(sDisplayFormat: string): Promise<void>;
  setMaxDate(): Promise<void>;
  setMinDate(): Promise<void>;
  setSecondDateValue(oSecondDateValue: unknown): Promise<void>;
  setValue(sValue: string): Promise<void>;
  setValueFormat(sValueFormat: string): Promise<void>;
}

/** sap.m.NotificationListItem */
export interface UI5NotificationListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.NotificationListItem';
  getAuthorAvatarColor(): Promise<string>;
  getAuthorInitials(): Promise<string>;
  getAuthorName(): Promise<string>;
  getAuthorPicture(): Promise<string>;
  getDatetime(): Promise<string>;
  getDescription(): Promise<string>;
  getHideShowMoreButton(): Promise<boolean>;
  getProcessingMessage(): Promise<UI5ControlBase | null>;
  getTruncate(): Promise<boolean>;
  setAuthorAvatarColor(sAuthorAvatarColor: string): Promise<void>;
  setAuthorInitials(sAuthorInitials: string): Promise<void>;
  setAuthorName(sAuthorName: string): Promise<void>;
  setAuthorPicture(sAuthorPicture: string): Promise<void>;
  setDatetime(sDatetime: string): Promise<void>;
  setDescription(sDescription: string): Promise<void>;
  setHideShowMoreButton(bHideShowMoreButton: boolean): Promise<void>;
  setProcessingMessage(oProcessingMessage: UI5ControlBase): Promise<void>;
  setTruncate(bTruncate: boolean): Promise<void>;
}

/** sap.m.PlanningCalendar */
export interface UI5PlanningCalendar extends UI5ControlBase {
  readonly controlType: 'sap.m.PlanningCalendar';
  getAppointmentHeight(): Promise<string>;
  getAppointmentRoundWidth(): Promise<string>;
  getAppointmentsVisualization(): Promise<string>;
  getBuiltInViews(): Promise<readonly string[]>;
  getCalendarWeekNumbering(): Promise<unknown>;
  getCustomAppointmentsSorterCallback(): Promise<string>;
  getEndDate(): Promise<unknown>;
  getFirstDayOfWeek(): Promise<number>;
  getGroupAppointmentsMode(): Promise<string>;
  getHeight(): Promise<string>;
  getIconShape(): Promise<string>;
  getLegend(): Promise<string | null>;
  getMaxDate(): Promise<unknown>;
  getMinDate(): Promise<unknown>;
  getMultipleAppointmentsSelection(): Promise<boolean>;
  getNoData(): Promise<UI5ControlBase | null>;
  getNoDataText(): Promise<string>;
  getPrimaryCalendarType(): Promise<unknown>;
  getRows(): Promise<readonly UI5ControlBase[]>;
  getSecondaryCalendarType(): Promise<unknown>;
  getSelectedAppointments(): Promise<readonly string[]>;
  getSelectedRows(): Promise<readonly UI5ControlBase[]>;
  getShowDayNamesLine(): Promise<boolean>;
  getShowEmptyIntervalHeaders(): Promise<boolean>;
  getShowIntervalHeaders(): Promise<boolean>;
  getShowRowHeaders(): Promise<boolean>;
  getShowWeekNumbers(): Promise<boolean>;
  getSingleSelection(): Promise<boolean>;
  getSpecialDates(): Promise<readonly UI5ControlBase[]>;
  getStartDate(): Promise<unknown>;
  getStickyHeader(): Promise<boolean>;
  getToolbarContent(): Promise<readonly UI5ControlBase[]>;
  getViewKey(): Promise<string>;
  getViews(): Promise<readonly UI5ControlBase[]>;
  getVisibleIntervalsCount(): Promise<number>;
  getWidth(): Promise<string>;
  selectAllRows(bSelect: boolean): Promise<void>;
  setAppointmentHeight(sAppointmentHeight: string): Promise<void>;
  setAppointmentRoundWidth(sAppointmentRoundWidth: string): Promise<void>;
  setAppointmentsVisualization(sAppointmentsVisualization: string): Promise<void>;
  setBuiltInViews(sBuiltInViews: readonly string[]): Promise<void>;
  setCalendarWeekNumbering(sCalendarWeekNumbering: unknown): Promise<void>;
  setCustomAppointmentsSorterCallback(fnSorter: string): Promise<void>;
  setFirstDayOfWeek(iFirstDayOfWeek: number): Promise<void>;
  setGroupAppointmentsMode(sGroupAppointmentsMode: string): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setIconShape(sIconShape: string): Promise<void>;
  setLegend(oLegend: string): Promise<void>;
  setMaxDate(oDate: unknown): Promise<void>;
  setMinDate(oDate: unknown): Promise<void>;
  setMultipleAppointmentsSelection(bMultipleAppointmentsSelection: boolean): Promise<void>;
  setNoData(vNoData: UI5ControlBase | string): Promise<void>;
  setNoDataText(sNoDataText: string): Promise<void>;
  setPrimaryCalendarType(sPrimaryCalendarType: unknown): Promise<void>;
  setSecondaryCalendarType(sSecondaryCalendarType: unknown): Promise<void>;
  setShowDayNamesLine(bShowDayNamesLine: boolean): Promise<void>;
  setShowEmptyIntervalHeaders(bShowEmptyIntervalHeaders: boolean): Promise<void>;
  setShowIntervalHeaders(bShowIntervalHeaders: boolean): Promise<void>;
  setShowRowHeaders(bShowRowHeaders: boolean): Promise<void>;
  setShowWeekNumbers(bShowWeekNumbers: boolean): Promise<void>;
  setSingleSelection(bSingleSelection: boolean): Promise<void>;
  setStartDate(oDate: unknown): Promise<void>;
  setStickyHeader(bStick: boolean): Promise<void>;
  setViewKey(sViewKey: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.SinglePlanningCalendar */
export interface UI5SinglePlanningCalendar extends UI5ControlBase {
  readonly controlType: 'sap.m.SinglePlanningCalendar';
  getActions(): Promise<readonly UI5ControlBase[]>;
  getAppointments(): Promise<readonly UI5ControlBase[]>;
  getCalendarWeekNumbering(): Promise<unknown>;
  getDateSelectionMode(): Promise<string>;
  getEnableAppointmentsCreate(): Promise<boolean>;
  getEnableAppointmentsDragAndDrop(): Promise<boolean>;
  getEnableAppointmentsResize(): Promise<boolean>;
  getEndHour(): Promise<number>;
  getFirstAndLastVisibleDates(): Promise<unknown>;
  getFirstDayOfWeek(): Promise<number>;
  getFullDay(): Promise<boolean>;
  getLegend(): Promise<string | null>;
  getNonWorkingPeriods(): Promise<readonly UI5ControlBase[]>;
  getScaleFactor(): Promise<number>;
  getSelectedAppointments(): Promise<readonly UI5ControlBase[]>;
  getSelectedDates(): Promise<readonly UI5ControlBase[]>;
  getSelectedView(): Promise<string | null>;
  getSpecialDates(): Promise<readonly UI5ControlBase[]>;
  getStartDate(): Promise<unknown>;
  getStartHour(): Promise<number>;
  getStickyMode(): Promise<string>;
  getTitle(): Promise<string>;
  getViewByKey(sKey: string): Promise<UI5ControlBase | null>;
  getViews(): Promise<readonly UI5ControlBase[]>;
  setCalendarWeekNumbering(sCalendarWeekNumbering: unknown): Promise<void>;
  setDateSelectionMode(sDateSelectionMode: string): Promise<void>;
  setEnableAppointmentsCreate(bEnableAppointmentsCreate: boolean): Promise<void>;
  setEnableAppointmentsDragAndDrop(bEnableAppointmentsDragAndDrop: boolean): Promise<void>;
  setEnableAppointmentsResize(bEnableAppointmentsResize: boolean): Promise<void>;
  setEndHour(iEndHour: number): Promise<void>;
  setFirstDayOfWeek(iFirstDayOfWeek: number): Promise<void>;
  setFullDay(bFullDay: boolean): Promise<void>;
  setLegend(oLegend: string): Promise<void>;
  setScaleFactor(fScaleFactor: number): Promise<void>;
  setSelectedView(oSelectedView: string | UI5ControlBase): Promise<void>;
  setStartDate(oDate: unknown): Promise<void>;
  setStartHour(iStartHour: number): Promise<void>;
  setStickyMode(sStickyMode: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.m.MessageItem */
export interface UI5MessageItem extends UI5ControlBase {
  readonly controlType: 'sap.m.MessageItem';
  getActiveTitle(): Promise<boolean>;
  getCounter(): Promise<number>;
  getDescription(): Promise<string>;
  getGroupName(): Promise<string>;
  getLink(): Promise<UI5ControlBase | null>;
  getLongtextUrl(): Promise<string>;
  getMarkupDescription(): Promise<boolean>;
  getSubtitle(): Promise<string>;
  getTitle(): Promise<string>;
  getType(): Promise<unknown>;
  setActiveTitle(bActiveTitle: boolean): Promise<void>;
  setCounter(iCounter: number): Promise<void>;
  setDescription(sDescription: string): Promise<void>;
  setGroupName(sGroupName: string): Promise<void>;
  setLink(oLink: UI5ControlBase): Promise<void>;
  setLongtextUrl(sLongtextUrl: string): Promise<void>;
  setMarkupDescription(bMarkupDescription: boolean): Promise<void>;
  setSubtitle(sSubtitle: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setType(sType: unknown): Promise<void>;
}

/** sap.m.MessageView */
export interface UI5MessageView extends UI5ControlBase {
  readonly controlType: 'sap.m.MessageView';
  getAsyncDescriptionHandler(): Promise<unknown>;
  getAsyncURLHandler(): Promise<unknown>;
  getGroupItems(): Promise<boolean>;
  getHeaderButton(): Promise<UI5ControlBase | null>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getShowDetailsPageHeader(): Promise<boolean>;
  navigateBack(): Promise<void>;
  setAsyncDescriptionHandler(fnAsyncDescriptionHandler: unknown): Promise<void>;
  setAsyncURLHandler(fnAsyncURLHandler: unknown): Promise<void>;
  setGroupItems(bGroupItems: boolean): Promise<void>;
  setHeaderButton(oHeaderButton: UI5ControlBase): Promise<void>;
  setShowDetailsPageHeader(bShowDetailsPageHeader: boolean): Promise<void>;
}

/** sap.m.NavContainer */
export interface UI5NavContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.NavContainer';
  back(backData?: unknown, oTransitionParameters?: unknown): Promise<void>;
  backToPage(pageId: string, backData?: unknown, oTransitionParameters?: unknown): Promise<void>;
  backToTop(backData?: unknown, oTransitionParameters?: unknown): Promise<void>;
  currentPageIsTopPage(): Promise<boolean>;
  getAutoFocus(): Promise<boolean>;
  getCurrentPage(): Promise<UI5ControlBase>;
  getDefaultTransitionName(): Promise<string>;
  getHeight(): Promise<string>;
  getInitialPage(): Promise<string | null>;
  getPage(pageId: string): Promise<UI5ControlBase | null>;
  getPages(): Promise<readonly UI5ControlBase[]>;
  getPreviousPage(): Promise<UI5ControlBase>;
  getWidth(): Promise<string>;
  setAutoFocus(bAutoFocus: boolean): Promise<void>;
  setDefaultTransitionName(sDefaultTransitionName: string): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setInitialPage(oInitialPage: string | UI5ControlBase): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  to(
    vPageIdOrControl: string | UI5ControlBase,
    sTransitionName?: string,
    oData?: unknown,
    oTransitionParameters?: unknown,
  ): Promise<void>;
}

/** sap.m.SplitApp */
export interface UI5SplitApp extends UI5ControlBase {
  readonly controlType: 'sap.m.SplitApp';
  getHomeIcon(): Promise<unknown>;
  setHomeIcon(oHomeIcon: unknown): Promise<void>;
}

/** sap.m.Shell */
export interface UI5Shell extends UI5ControlBase {
  readonly controlType: 'sap.m.Shell';
  getApp(): Promise<UI5ControlBase | null>;
  getAppWidthLimited(): Promise<boolean>;
  getBackgroundColor(): Promise<string>;
  getBackgroundImage(): Promise<string>;
  getBackgroundOpacity(): Promise<number>;
  getBackgroundRepeat(): Promise<boolean>;
  getHeaderRightText(): Promise<string>;
  getHomeIcon(): Promise<unknown>;
  getLogo(): Promise<string>;
  getShowLogout(): Promise<boolean>;
  getTitle(): Promise<string>;
  getTitleLevel(): Promise<string>;
  setApp(oApp: UI5ControlBase): Promise<void>;
  setAppWidthLimited(bAppWidthLimited: boolean): Promise<void>;
  setBackgroundColor(sBackgroundColor: string): Promise<void>;
  setBackgroundImage(sBackgroundImage: string): Promise<void>;
  setBackgroundOpacity(fBackgroundOpacity: number): Promise<void>;
  setBackgroundRepeat(bBackgroundRepeat: boolean): Promise<void>;
  setHeaderRightText(sHeaderRightText: string): Promise<void>;
  setLogo(sLogo: string): Promise<void>;
  setShowLogout(bShowLogout: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleLevel(sTitleLevel: string): Promise<void>;
}

/** sap.m.App */
export interface UI5App extends UI5ControlBase {
  readonly controlType: 'sap.m.App';
  getBackgroundColor(): Promise<string>;
  getBackgroundImage(): Promise<string>;
  getBackgroundOpacity(): Promise<number>;
  getBackgroundRepeat(): Promise<boolean>;
  getHomeIcon(): Promise<unknown>;
  getIsTopLevel(): Promise<boolean>;
  getMobileWebAppCapable(): Promise<boolean>;
  setBackgroundColor(sBackgroundColor: string): Promise<void>;
  setBackgroundImage(sBackgroundImage: string): Promise<void>;
  setBackgroundOpacity(fBackgroundOpacity: number): Promise<void>;
  setBackgroundRepeat(bBackgroundRepeat: boolean): Promise<void>;
  setHomeIcon(oHomeIcon: unknown): Promise<void>;
  setIsTopLevel(bIsTopLevel: boolean): Promise<void>;
  setMobileWebAppCapable(bMobileWebAppCapable: boolean): Promise<void>;
}

/** sap.m.Column */
export interface UI5Column extends UI5ControlBase {
  readonly controlType: 'sap.m.Column';
  getAutoPopinWidth(): Promise<number>;
  getDemandPopin(): Promise<boolean>;
  getFooter(): Promise<UI5ControlBase | null>;
  getHAlign(): Promise<string>;
  getHeader(): Promise<UI5ControlBase | null>;
  getHeaderMenu(): Promise<string | null>;
  getImportance(): Promise<string>;
  getMergeDuplicates(): Promise<boolean>;
  getMergeFunctionName(): Promise<string>;
  getMinScreenWidth(): Promise<string>;
  getPopinDisplay(): Promise<string>;
  getSortIndicator(): Promise<string>;
  getStyleClass(): Promise<string>;
  getVAlign(): Promise<string>;
  getWidth(): Promise<string>;
  setAutoPopinWidth(fAutoPopinWidth: number): Promise<void>;
  setDemandPopin(bDemandPopin: boolean): Promise<void>;
  setFooter(oFooter: UI5ControlBase): Promise<void>;
  setHAlign(sHAlign: string): Promise<void>;
  setHeader(oHeader: UI5ControlBase): Promise<void>;
  setHeaderMenu(oHeaderMenu: string): Promise<void>;
  setImportance(sImportance: string): Promise<void>;
  setMergeDuplicates(bMergeDuplicates: boolean): Promise<void>;
  setMergeFunctionName(sMergeFunctionName: string): Promise<void>;
  setMinScreenWidth(sMinScreenWidth: string): Promise<void>;
  setPopinDisplay(sPopinDisplay: string): Promise<void>;
  setSortIndicator(sSortIndicator: string): Promise<void>;
  setStyleClass(sStyleClass: string): Promise<void>;
  setVAlign(sVAlign: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.StandardTreeItem */
export interface UI5StandardTreeItem extends UI5ControlBase {
  readonly controlType: 'sap.m.StandardTreeItem';
  getIcon(): Promise<string>;
  getTitle(): Promise<string>;
  setIcon(sIcon: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.m.CustomListItem */
export interface UI5CustomListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.CustomListItem';
  getAccDescription(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  setAccDescription(sAccDescription: string): Promise<void>;
}

/** sap.m.GroupHeaderListItem */
export interface UI5GroupHeaderListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.GroupHeaderListItem';
  getCount(): Promise<string>;
  getTitle(): Promise<string>;
  getTitleTextDirection(): Promise<string>;
  setCount(sCount: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleTextDirection(sTitleTextDirection: string): Promise<void>;
}

/** sap.m.InputListItem */
export interface UI5InputListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.InputListItem';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getContentSize(): Promise<string>;
  getLabel(): Promise<string>;
  getLabelTextDirection(): Promise<string>;
  setContentSize(sContentSize: string): Promise<void>;
  setLabel(sLabel: string): Promise<void>;
  setLabelTextDirection(sLabelTextDirection: string): Promise<void>;
}

/** sap.m.DisplayListItem */
export interface UI5DisplayListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.DisplayListItem';
  getLabel(): Promise<string>;
  getValue(): Promise<string>;
  getValueTextDirection(): Promise<string>;
  setLabel(sLabel: string): Promise<void>;
  setValue(sValue: string): Promise<void>;
  setValueTextDirection(sValueTextDirection: string): Promise<void>;
}

/** sap.m.ActionListItem */
export interface UI5ActionListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.ActionListItem';
  getText(): Promise<string>;
  setText(sText: string): Promise<void>;
}

/** sap.m.Tokenizer */
export interface UI5Tokenizer extends UI5ControlBase {
  readonly controlType: 'sap.m.Tokenizer';
  getEditable(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getHiddenTokensCount(): Promise<number>;
  getMaxWidth(): Promise<string>;
  getRenderMode(): Promise<string>;
  getScrollDelegate(): Promise<string>;
  getScrollWidth(): Promise<number>;
  getSelectedTokens(): Promise<readonly UI5ControlBase[]>;
  getTokens(): Promise<readonly UI5ControlBase[]>;
  getWidth(): Promise<string>;
  scrollToEnd(): Promise<void>;
  scrollToStart(): Promise<void>;
  selectAllTokens(bSelect: boolean): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setMaxWidth(sMaxWidth: string): Promise<void>;
  setPixelWidth(nWidth: number): Promise<void>;
  setRenderMode(sRenderMode: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.SelectDialog */
export interface UI5SelectDialog extends UI5ControlBase {
  readonly controlType: 'sap.m.SelectDialog';
  clearSelection(): Promise<void>;
  getConfirmButtonText(): Promise<string>;
  getContentHeight(): Promise<string>;
  getContentWidth(): Promise<string>;
  getDraggable(): Promise<boolean>;
  getGrowing(): Promise<boolean>;
  getGrowingThreshold(): Promise<number>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMultiSelect(): Promise<boolean>;
  getNoDataText(): Promise<string>;
  getRememberSelections(): Promise<boolean>;
  getResizable(): Promise<boolean>;
  getSearchPlaceholder(): Promise<string>;
  getShowClearButton(): Promise<boolean>;
  getTitle(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  open(sSearchValue: string): Promise<void>;
  setConfirmButtonText(sText: string): Promise<void>;
  setContentHeight(sHeight: string): Promise<void>;
  setContentWidth(sWidth: string): Promise<void>;
  setDraggable(bValue: boolean): Promise<void>;
  setGrowing(bValue: boolean): Promise<void>;
  setGrowingThreshold(iValue: number): Promise<void>;
  setMultiSelect(bMulti: boolean): Promise<void>;
  setNoDataText(sNoDataText: string): Promise<void>;
  setRememberSelections(bRememberSelections: boolean): Promise<void>;
  setResizable(bValue: boolean): Promise<void>;
  setSearchPlaceholder(sSearchPlaceholder: string): Promise<void>;
  setShowClearButton(bVisible: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
  isOpen(): Promise<boolean>;
}

/** sap.m.TableSelectDialog */
export interface UI5TableSelectDialog extends UI5ControlBase {
  readonly controlType: 'sap.m.TableSelectDialog';
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getConfirmButtonText(): Promise<string>;
  getContentHeight(): Promise<string>;
  getContentWidth(): Promise<string>;
  getDraggable(): Promise<boolean>;
  getGrowing(): Promise<boolean>;
  getGrowingThreshold(): Promise<number>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMultiSelect(): Promise<boolean>;
  getNoDataText(): Promise<string>;
  getRememberSelections(): Promise<boolean>;
  getResizable(): Promise<boolean>;
  getSearchPlaceholder(): Promise<string>;
  getShowClearButton(): Promise<boolean>;
  getTitle(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  open(sSearchValue: string): Promise<void>;
  setConfirmButtonText(sText: string): Promise<void>;
  setContentHeight(sHeight: string): Promise<void>;
  setContentWidth(sWidth: string): Promise<void>;
  setDraggable(bValue: boolean): Promise<void>;
  setGrowing(bValue: boolean): Promise<void>;
  setGrowingThreshold(iValue: number): Promise<void>;
  setMultiSelect(bMulti: boolean): Promise<void>;
  setNoDataText(sNoDataText: string): Promise<void>;
  setRememberSelections(bRememberSelections: boolean): Promise<void>;
  setResizable(bValue: boolean): Promise<void>;
  setSearchPlaceholder(sSearchPlaceholder: string): Promise<void>;
  setShowClearButton(bVisible: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
  isOpen(): Promise<boolean>;
}

/** sap.m.BusyDialog */
export interface UI5BusyDialog extends UI5ControlBase {
  readonly controlType: 'sap.m.BusyDialog';
  getCancelButtonText(): Promise<string>;
  getCustomIcon(): Promise<string>;
  getCustomIconDensityAware(): Promise<boolean>;
  getCustomIconHeight(): Promise<string>;
  getCustomIconRotationSpeed(): Promise<number>;
  getCustomIconWidth(): Promise<string>;
  getShowCancelButton(): Promise<boolean>;
  getText(): Promise<string>;
  getTitle(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  open(): Promise<void>;
  setCancelButtonText(sText: string): Promise<void>;
  setCustomIcon(sIcon: string): Promise<void>;
  setCustomIconDensityAware(bIsDensityAware: boolean): Promise<void>;
  setCustomIconHeight(sHeight: string): Promise<void>;
  setCustomIconRotationSpeed(iSpeed: number): Promise<void>;
  setCustomIconWidth(sWidth: string): Promise<void>;
  setShowCancelButton(bIsCancelButtonShown: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.UploadCollection */
export interface UI5UploadCollection extends UI5ControlBase {
  readonly controlType: 'sap.m.UploadCollection';
  downloadItem(uploadCollectionItem: UI5ControlBase, askForLocation: boolean): Promise<boolean>;
  getFileType(): Promise<readonly string[]>;
  getHeaderParameters(): Promise<readonly UI5ControlBase[]>;
  getInfoToolbar(): Promise<UI5ControlBase | null>;
  getInstantUpload(): Promise<boolean>;
  getInternalRequestHeaderNames(): Promise<readonly string[]>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMaximumFilenameLength(): Promise<number>;
  getMaximumFileSize(): Promise<number>;
  getMimeType(): Promise<readonly string[]>;
  getMode(): Promise<string>;
  getMultiple(): Promise<boolean>;
  getNoDataDescription(): Promise<string>;
  getNoDataText(): Promise<string>;
  getNumberOfAttachmentsText(): Promise<string>;
  getParameters(): Promise<readonly UI5ControlBase[]>;
  getSameFilenameAllowed(): Promise<boolean>;
  getSelectedItem(): Promise<UI5ControlBase | null>;
  getSelectedItems(): Promise<readonly UI5ControlBase[]>;
  getShowSeparators(): Promise<string>;
  getTerminationEnabled(): Promise<boolean>;
  getToolbar(): Promise<UI5ControlBase | null>;
  getUploadButtonInvisible(): Promise<boolean>;
  getUploadEnabled(): Promise<boolean>;
  getUploadUrl(): Promise<string>;
  openFileDialog(item: UI5ControlBase): Promise<void>;
  selectAll(): Promise<void>;
  setFileType(sFileType: readonly string[]): Promise<void>;
  setInfoToolbar(oInfoToolbar: UI5ControlBase): Promise<void>;
  setInstantUpload(bInstantUpload: boolean): Promise<void>;
  setMaximumFilenameLength(iMaximumFilenameLength: number): Promise<void>;
  setMaximumFileSize(fMaximumFileSize: number): Promise<void>;
  setMimeType(sMimeType: readonly string[]): Promise<void>;
  setMode(sMode: string): Promise<void>;
  setMultiple(bMultiple: boolean): Promise<void>;
  setNoDataDescription(sNoDataDescription: string): Promise<void>;
  setNoDataText(sNoDataText: string): Promise<void>;
  setNumberOfAttachmentsText(sNumberOfAttachmentsText: string): Promise<void>;
  setSameFilenameAllowed(bSameFilenameAllowed: boolean): Promise<void>;
  setSelectedItem(uploadCollectionItem: UI5ControlBase, select?: boolean): Promise<void>;
  setSelectedItemById(id: string, select?: boolean): Promise<void>;
  setShowSeparators(sShowSeparators: string): Promise<void>;
  setTerminationEnabled(bTerminationEnabled: boolean): Promise<void>;
  setToolbar(oToolbar: UI5ControlBase): Promise<void>;
  setUploadButtonInvisible(bUploadButtonInvisible: boolean): Promise<void>;
  setUploadEnabled(bUploadEnabled: boolean): Promise<void>;
  setUploadUrl(sUploadUrl: string): Promise<void>;
  upload(): Promise<void>;
}

/** sap.m.ObjectHeader */
export interface UI5ObjectHeader extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectHeader';
  getAdditionalNumbers(): Promise<readonly UI5ControlBase[]>;
  getAttributes(): Promise<readonly UI5ControlBase[]>;
  getBackgroundDesign(): Promise<string>;
  getCondensed(): Promise<boolean>;
  getFullScreenOptimized(): Promise<boolean>;
  getHeaderContainer(): Promise<UI5ControlBase | null>;
  getIcon(): Promise<string>;
  getIconActive(): Promise<boolean>;
  getIconAlt(): Promise<string>;
  getIconTooltip(): Promise<string>;
  getImageShape(): Promise<string>;
  getIntro(): Promise<string>;
  getIntroActive(): Promise<boolean>;
  getIntroHref(): Promise<string>;
  getIntroTarget(): Promise<string>;
  getIntroTextDirection(): Promise<string>;
  getMarkers(): Promise<readonly UI5ControlBase[]>;
  getNumber(): Promise<string>;
  getNumberState(): Promise<string>;
  getNumberTextDirection(): Promise<string>;
  getNumberUnit(): Promise<string>;
  getResponsive(): Promise<boolean>;
  getShowTitleSelector(): Promise<boolean>;
  getStatuses(): Promise<readonly UI5ControlBase[]>;
  getTitle(): Promise<string>;
  getTitleActive(): Promise<boolean>;
  getTitleHref(): Promise<string>;
  getTitleLevel(): Promise<string>;
  getTitleSelectorTooltip(): Promise<string>;
  getTitleTarget(): Promise<string>;
  getTitleTextDirection(): Promise<string>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setCondensed(bCondensed: boolean): Promise<void>;
  setFullScreenOptimized(bFullScreenOptimized: boolean): Promise<void>;
  setHeaderContainer(oHeaderContainer: UI5ControlBase): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIconActive(bIconActive: boolean): Promise<void>;
  setIconAlt(sIconAlt: string): Promise<void>;
  setIconTooltip(sIconTooltip: string): Promise<void>;
  setImageShape(sImageShape: string): Promise<void>;
  setIntro(sIntro: string): Promise<void>;
  setIntroActive(bIntroActive: boolean): Promise<void>;
  setIntroHref(sIntroHref: string): Promise<void>;
  setIntroTarget(sIntroTarget: string): Promise<void>;
  setIntroTextDirection(sIntroTextDirection: string): Promise<void>;
  setNumber(sNumber: string): Promise<void>;
  setNumberState(sState: string): Promise<void>;
  setNumberTextDirection(sNumberTextDirection: string): Promise<void>;
  setNumberUnit(sUnit: string): Promise<void>;
  setResponsive(bResponsive: boolean): Promise<void>;
  setShowTitleSelector(bShowTitleSelector: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleActive(bTitleActive: boolean): Promise<void>;
  setTitleHref(sTitleHref: string): Promise<void>;
  setTitleLevel(sTitleLevel: string): Promise<void>;
  setTitleSelectorTooltip(sTooltip: string): Promise<void>;
  setTitleTarget(sTitleTarget: string): Promise<void>;
  setTitleTextDirection(sTitleTextDirection: string): Promise<void>;
}

/** sap.m.ObjectMarker */
export interface UI5ObjectMarker extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectMarker';
  getAdditionalInfo(): Promise<string>;
  getReactiveAreaMode(): Promise<string>;
  getType(): Promise<string>;
  getVisibility(): Promise<string>;
  setAdditionalInfo(sAdditionalInfo: string): Promise<void>;
  setReactiveAreaMode(sReactiveAreaMode: string): Promise<void>;
  setType(sType: string): Promise<void>;
  setVisibility(sVisibility: string): Promise<void>;
}

/** sap.m.DraftIndicator */
export interface UI5DraftIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.DraftIndicator';
  clearDraftState(): Promise<void>;
  getMinDisplayTime(): Promise<number>;
  getState(): Promise<string>;
  setMinDisplayTime(iMinDisplayTime: number): Promise<void>;
  setState(sState: string): Promise<void>;
  showDraftSaved(): Promise<void>;
  showDraftSaving(): Promise<void>;
}

/** sap.m.HeaderContainer */
export interface UI5HeaderContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.HeaderContainer';
  getBackgroundDesign(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getGridLayout(): Promise<boolean>;
  getHeight(): Promise<string>;
  getOrientation(): Promise<string>;
  getScrollStep(): Promise<number>;
  getScrollStepByItem(): Promise<number>;
  getScrollTime(): Promise<number>;
  getShowDividers(): Promise<boolean>;
  getShowOverflowItem(): Promise<boolean>;
  getSnapToRow(): Promise<boolean>;
  getWidth(): Promise<string>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setGridLayout(bGridLayout: boolean): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setOrientation(sOrientation: string): Promise<void>;
  setScrollStep(iScrollStep: number): Promise<void>;
  setScrollStepByItem(iScrollStepByItem: number): Promise<void>;
  setScrollTime(iScrollTime: number): Promise<void>;
  setShowDividers(bShowDividers: boolean): Promise<void>;
  setShowOverflowItem(bShowOverflowItem: boolean): Promise<void>;
  setSnapToRow(bSnapToRow: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.IconTabSeparator */
export interface UI5IconTabSeparator extends UI5ControlBase {
  readonly controlType: 'sap.m.IconTabSeparator';
  getIcon(): Promise<string>;
  setIcon(sIcon: string): Promise<void>;
}

/** sap.m.TabContainerItem */
export interface UI5TabContainerItem extends UI5ControlBase {
  readonly controlType: 'sap.m.TabContainerItem';
  getAdditionalText(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getIcon(): Promise<string>;
  getIconTooltip(): Promise<string>;
  getKey(): Promise<string>;
  getModified(): Promise<boolean>;
  getName(): Promise<string>;
  setAdditionalText(sAdditionalText: string): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIconTooltip(sIconTooltip: string): Promise<void>;
  setKey(sKey: string): Promise<void>;
  setModified(bModified: boolean): Promise<void>;
  setName(sName: string): Promise<void>;
}

/** sap.m.FacetFilter */
export interface UI5FacetFilter extends UI5ControlBase {
  readonly controlType: 'sap.m.FacetFilter';
  getLists(): Promise<readonly UI5ControlBase[]>;
  getLiveSearch(): Promise<boolean>;
  getShowPersonalization(): Promise<boolean>;
  getShowPopoverOKButton(): Promise<boolean>;
  getShowReset(): Promise<boolean>;
  getShowSummaryBar(): Promise<boolean>;
  getType(): Promise<string>;
  openFilterDialog(): Promise<void>;
  setLiveSearch(bLiveSearch: boolean): Promise<void>;
  setShowPersonalization(bShowPersonalization: boolean): Promise<void>;
  setShowPopoverOKButton(bShowPopoverOKButton: boolean): Promise<void>;
  setShowReset(bShowReset: boolean): Promise<void>;
  setShowSummaryBar(bShowSummaryBar: boolean): Promise<void>;
  setType(sType: string): Promise<void>;
}

/** sap.m.FacetFilterList */
export interface UI5FacetFilterList extends UI5ControlBase {
  readonly controlType: 'sap.m.FacetFilterList';
  getActive(): Promise<boolean>;
  getAllCount(): Promise<number>;
  getDataType(): Promise<string>;
  getEnableCaseInsensitiveSearch(): Promise<boolean>;
  getKey(): Promise<string>;
  getRetainListSequence(): Promise<boolean>;
  getSelectedKeys(): Promise<unknown>;
  getSequence(): Promise<number>;
  getShowRemoveFacetIcon(): Promise<boolean>;
  getTitle(): Promise<string>;
  getWordWrap(): Promise<boolean>;
  setActive(bActive: boolean): Promise<void>;
  setAllCount(iAllCount: number): Promise<void>;
  setDataType(sDataType: string): Promise<void>;
  setEnableCaseInsensitiveSearch(bEnableCaseInsensitiveSearch: boolean): Promise<void>;
  setKey(sKey: string): Promise<void>;
  setMode(mode: string): Promise<void>;
  setRetainListSequence(bRetainListSequence: boolean): Promise<void>;
  setSelectedKeys(oKeys?: unknown): Promise<void>;
  setSequence(iSequence: number): Promise<void>;
  setShowRemoveFacetIcon(bShowRemoveFacetIcon: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setWordWrap(bWordWrap: boolean): Promise<void>;
}

/** sap.m.PDFViewer */
export interface UI5PDFViewer extends UI5ControlBase {
  readonly controlType: 'sap.m.PDFViewer';
  downloadPDF(): Promise<void>;
  getDisplayType(): Promise<string>;
  getErrorPlaceholder(): Promise<UI5ControlBase | null>;
  getErrorPlaceholderMessage(): Promise<string>;
  getHeight(): Promise<string>;
  getIsTrustedSource(): Promise<boolean>;
  getPopupButtons(): Promise<readonly UI5ControlBase[]>;
  getShowDownloadButton(): Promise<boolean>;
  getSource(): Promise<string>;
  getTitle(): Promise<string>;
  getWidth(): Promise<string>;
  open(): Promise<void>;
  setDisplayType(sDisplayType: string): Promise<void>;
  setErrorPlaceholder(oErrorPlaceholder: UI5ControlBase): Promise<void>;
  setErrorPlaceholderMessage(sErrorPlaceholderMessage: string): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setIsTrustedSource(bIsTrustedSource: boolean): Promise<void>;
  setShowDownloadButton(bShowDownloadButton: boolean): Promise<void>;
  setSource(sSource: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.ColorPalettePopover */
export interface UI5ColorPalettePopover extends UI5ControlBase {
  readonly controlType: 'sap.m.ColorPalettePopover';
  close(): Promise<UI5ControlBase>;
  getColors(): Promise<readonly string[]>;
  getDefaultColor(): Promise<string>;
  getDisplayMode(): Promise<string>;
  getSelectedColor(): Promise<string>;
  getShowDefaultColorButton(): Promise<boolean>;
  getShowMoreColorsButton(): Promise<boolean>;
  getShowRecentColorsSection(): Promise<boolean>;
  openBy(oControl: UI5ControlBase): Promise<UI5ControlBase>;
  setColorPickerSelectedColor(color: string): Promise<void>;
  setColors(sColors: readonly string[]): Promise<void>;
  setDefaultColor(sDefaultColor: string): Promise<void>;
  setDisplayMode(sDisplayMode: string): Promise<void>;
  setSelectedColor(sSelectedColor: string): Promise<void>;
  setShowDefaultColorButton(bShowDefaultColorButton: boolean): Promise<void>;
  setShowMoreColorsButton(bShowMoreColorsButton: boolean): Promise<void>;
  setShowRecentColorsSection(bShowRecentColorsSection: boolean): Promise<void>;
}

/** sap.m.SlideTile */
export interface UI5SlideTile extends UI5ControlBase {
  readonly controlType: 'sap.m.SlideTile';
  getDisplayTime(): Promise<number>;
  getHeight(): Promise<string>;
  getScope(): Promise<string>;
  getSizeBehavior(): Promise<string>;
  getTiles(): Promise<readonly UI5ControlBase[]>;
  getTransitionTime(): Promise<number>;
  getWidth(): Promise<string>;
  setDisplayTime(iDisplayTime: number): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setScope(sScope: string): Promise<void>;
  setSizeBehavior(sSizeBehavior: string): Promise<void>;
  setTransitionTime(iTransitionTime: number): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.LightBox */
export interface UI5LightBox extends UI5ControlBase {
  readonly controlType: 'sap.m.LightBox';
  getImageContent(): Promise<readonly UI5ControlBase[]>;
  open(): Promise<void>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.VariantManagement */
export interface UI5VariantManagement extends UI5ControlBase {
  readonly controlType: 'sap.m.VariantManagement';
  getCreationAllowed(): Promise<boolean>;
  getDefaultKey(): Promise<string>;
  getInErrorState(): Promise<boolean>;
  getItemByKey(sKey: string): Promise<UI5ControlBase | null>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getLevel(): Promise<string>;
  getMaxWidth(): Promise<string>;
  getModified(): Promise<boolean>;
  getPopoverTitle(): Promise<string>;
  getSelectedKey(): Promise<string>;
  getShowFooter(): Promise<boolean>;
  getShowSaveAs(): Promise<boolean>;
  getStandardVariantKey(): Promise<string | null>;
  getSupportApplyAutomatically(): Promise<boolean>;
  getSupportContexts(): Promise<boolean>;
  getSupportDefault(): Promise<boolean>;
  getSupportFavorites(): Promise<boolean>;
  getSupportPublic(): Promise<boolean>;
  getTitleStyle(): Promise<string>;
  setCreationAllowed(bCreationAllowed: boolean): Promise<void>;
  setCurrentVariantKey(sKey: string): Promise<void>;
  setDefaultKey(sDefaultKey: string): Promise<void>;
  setInErrorState(bInErrorState: boolean): Promise<void>;
  setLevel(sLevel: string): Promise<void>;
  setMaxWidth(sMaxWidth: string): Promise<void>;
  setModified(bModified: boolean): Promise<void>;
  setPopoverTitle(sPopoverTitle: string): Promise<void>;
  setSelectedKey(sSelectedKey: string): Promise<void>;
  setShowFooter(bShowFooter: boolean): Promise<void>;
  setShowSaveAs(bShowSaveAs: boolean): Promise<void>;
  setSupportApplyAutomatically(bSupportApplyAutomatically: boolean): Promise<void>;
  setSupportContexts(bSupportContexts: boolean): Promise<void>;
  setSupportDefault(bSupportDefault: boolean): Promise<void>;
  setSupportFavorites(bSupportFavorites: boolean): Promise<void>;
  setSupportPublic(bSupportPublic: boolean): Promise<void>;
  setTitleStyle(sTitleStyle: string): Promise<void>;
  press(): Promise<void>;
}

/** sap.m.ColorPalette */
export interface UI5ColorPalette extends UI5ControlBase {
  readonly controlType: 'sap.m.ColorPalette';
  getColors(): Promise<readonly string[]>;
  getSelectedColor(): Promise<string>;
  setColorPickerSelectedColor(sColor: string): Promise<void>;
  setColors(sColors: readonly string[]): Promise<void>;
  setSelectedColor(sSelectedColor: string): Promise<void>;
}

/** sap.m.DynamicDateRange */
export interface UI5DynamicDateRange extends UI5ControlBase {
  readonly controlType: 'sap.m.DynamicDateRange';
  getCalendarWeekNumbering(): Promise<unknown>;
  getCustomOptions(): Promise<readonly UI5ControlBase[]>;
  getEditable(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getEnableGroupHeaders(): Promise<boolean>;
  getFormatter(): Promise<string>;
  getGroupHeader(): Promise<string>;
  getHideInput(): Promise<boolean>;
  getName(): Promise<string>;
  getOption(sKey: string): Promise<UI5ControlBase>;
  getPlaceholder(): Promise<string>;
  getRequired(): Promise<boolean>;
  getShowClearIcon(): Promise<boolean>;
  getStandardOptions(): Promise<readonly string[]>;
  getValue(): Promise<string>;
  getValueState(): Promise<string>;
  getValueStateText(): Promise<string>;
  getWidth(): Promise<string>;
  open(oDomRef: HTMLElement): Promise<void>;
  openBy(oDomRef: HTMLElement): Promise<void>;
  setCalendarWeekNumbering(sCalendarWeekNumbering: unknown): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setEnableGroupHeaders(bEnableGroupHeaders: boolean): Promise<void>;
  setFormatter(oFormatter: string): Promise<string>;
  setGroupHeader(sGroupName: string, sGroupHeader: string): Promise<void>;
  setHideInput(bHideInput: boolean): Promise<void>;
  setName(sName: string): Promise<void>;
  setPlaceholder(sPlaceholder: string): Promise<void>;
  setRequired(bRequired: boolean): Promise<void>;
  setShowClearIcon(bShowClearIcon: boolean): Promise<void>;
  setStandardOptions(sStandardOptions: readonly string[]): Promise<void>;
  setValue(oValue: string): Promise<void>;
  setValueState(sValueState: string): Promise<void>;
  setValueStateText(sValueStateText: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  toDates(oValue: string): Promise<readonly string[]>;
}

/** sap.m.FeedInput */
export interface UI5FeedInput extends UI5ControlBase {
  readonly controlType: 'sap.m.FeedInput';
  getButtonTooltip(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getGrowing(): Promise<boolean>;
  getGrowingMaxLines(): Promise<number>;
  getIcon(): Promise<string>;
  getIconDisplayShape(): Promise<string>;
  getIconInitials(): Promise<string>;
  getIconSize(): Promise<string>;
  getMaxLength(): Promise<number>;
  getPlaceholder(): Promise<string>;
  getRows(): Promise<number>;
  getShowExceededText(): Promise<boolean>;
  getShowIcon(): Promise<boolean>;
  getValue(): Promise<string>;
  setButtonTooltip(sButtonTooltip: string): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setGrowing(bGrowing: boolean): Promise<void>;
  setGrowingMaxLines(iGrowingMaxLines: number): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIconDisplayShape(sIconDisplayShape: string): Promise<void>;
  setIconInitials(sIconInitials: string): Promise<void>;
  setIconSize(sIconSize: string): Promise<void>;
  setMaxLength(iMaxLength: number): Promise<void>;
  setPlaceholder(sPlaceholder: string): Promise<void>;
  setRows(iRows: number): Promise<void>;
  setShowExceededText(bShowExceededText: boolean): Promise<void>;
  setShowIcon(bShowIcon: boolean): Promise<void>;
  setValue(sValue: string): Promise<void>;
}

/** sap.m.ExpandableText */
export interface UI5ExpandableText extends UI5ControlBase {
  readonly controlType: 'sap.m.ExpandableText';
  getEmptyIndicatorMode(): Promise<string>;
  getMaxCharacters(): Promise<number>;
  getOverflowMode(): Promise<string>;
  getRenderWhitespace(): Promise<boolean>;
  getText(bNormalize?: boolean): Promise<string>;
  getTextAlign(): Promise<string>;
  getWrappingType(): Promise<string>;
  hasLabelableHTMLElement(): Promise<boolean>;
  setEmptyIndicatorMode(sEmptyIndicatorMode: string): Promise<void>;
  setMaxCharacters(iMaxCharacters: number): Promise<void>;
  setOverflowMode(sOverflowMode: string): Promise<void>;
  setRenderWhitespace(bRenderWhitespace: boolean): Promise<void>;
  setText(sText: string): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setWrappingType(sWrappingType: string): Promise<void>;
}

/** sap.m.QuickView */
export interface UI5QuickView extends UI5ControlBase {
  readonly controlType: 'sap.m.QuickView';
  getPlacement(): Promise<string>;
  getWidth(): Promise<string>;
  openBy(oControl: UI5ControlBase | HTMLElement): Promise<void>;
  setPlacement(sPlacement: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.QuickViewCard */
export interface UI5QuickViewCard extends UI5ControlBase {
  readonly controlType: 'sap.m.QuickViewCard';
  getShowVerticalScrollBar(): Promise<boolean>;
  setShowVerticalScrollBar(bShowVerticalScrollBar: boolean): Promise<void>;
}

/** sap.m.QuickViewPage */
export interface UI5QuickViewPage extends UI5ControlBase {
  readonly controlType: 'sap.m.QuickViewPage';
  getAvatar(): Promise<UI5ControlBase | null>;
  getDescription(): Promise<string>;
  getGroups(): Promise<readonly UI5ControlBase[]>;
  getHeader(): Promise<string>;
  getPageId(): Promise<string>;
  getTitle(): Promise<string>;
  getTitleUrl(): Promise<string>;
  setAvatar(oAvatar: UI5ControlBase): Promise<void>;
  setDescription(sDescription: string): Promise<void>;
  setHeader(sHeader: string): Promise<void>;
  setPageId(sPageId: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleUrl(sTitleUrl: string): Promise<void>;
}

/** sap.m.IllustratedMessage */
export interface UI5IllustratedMessage extends UI5ControlBase {
  readonly controlType: 'sap.m.IllustratedMessage';
  getAdditionalContent(): Promise<readonly UI5ControlBase[]>;
  getAriaTitleLevel(): Promise<string>;
  getDescription(): Promise<string>;
  getEnableDefaultTitleAndDescription(): Promise<boolean>;
  getEnableFormattedText(): Promise<boolean>;
  getEnableVerticalResponsiveness(): Promise<boolean>;
  getIllustrationAriaDescribedBy(): Promise<readonly string[]>;
  getIllustrationAriaLabelledBy(): Promise<readonly string[]>;
  getIllustrationSize(): Promise<string>;
  getIllustrationType(): Promise<string>;
  getSrc(): Promise<string>;
  getTitle(): Promise<string>;
  setAriaTitleLevel(sAriaTitleLevel: string): Promise<void>;
  setDescription(sDescription: string): Promise<void>;
  setEnableDefaultTitleAndDescription(bEnableDefaultTitleAndDescription: boolean): Promise<void>;
  setEnableFormattedText(bEnableFormattedText: boolean): Promise<void>;
  setEnableVerticalResponsiveness(bEnableVerticalResponsiveness: boolean): Promise<void>;
  setIllustrationSize(sIllustrationSize: string): Promise<void>;
  setIllustrationType(sIllustrationType: string): Promise<void>;
  setSrc(sSrc: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.m.ToolbarSpacer */
export interface UI5ToolbarSpacer extends UI5ControlBase {
  readonly controlType: 'sap.m.ToolbarSpacer';
  getWidth(): Promise<string>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.m.ToolbarSeparator */
export interface UI5ToolbarSeparator extends UI5ControlBase {
  readonly controlType: 'sap.m.ToolbarSeparator';
  getOverflowToolbarConfig(): Promise<string>;
}

/** sap.m.TileContent */
export interface UI5TileContent extends UI5ControlBase {
  readonly controlType: 'sap.m.TileContent';
  getContent(): Promise<UI5ControlBase | null>;
  getDisabled(): Promise<boolean>;
  getFooter(): Promise<string>;
  getFooterColor(): Promise<string>;
  getFrameType(): Promise<string>;
  getPriority(): Promise<string>;
  getPriorityText(): Promise<string>;
  getState(): Promise<string>;
  getUnit(): Promise<string>;
  setContent(oContent: UI5ControlBase): Promise<void>;
  setDisabled(bDisabled: boolean): Promise<void>;
  setFooter(sFooter: string): Promise<void>;
  setFooterColor(sFooterColor: string): Promise<void>;
  setFrameType(sFrameType: string): Promise<void>;
  setPriority(sPriority: string): Promise<void>;
  setPriorityText(sPriorityText: string): Promise<void>;
  setState(sState: string): Promise<void>;
  setUnit(sUnit: string): Promise<void>;
}

/** sap.m.NotificationListGroup */
export interface UI5NotificationListGroup extends UI5ControlBase {
  readonly controlType: 'sap.m.NotificationListGroup';
  getAutoPriority(): Promise<boolean>;
  getCollapsed(): Promise<boolean>;
  getEnableCollapseButtonWhenEmpty(): Promise<boolean>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getShowEmptyGroup(): Promise<boolean>;
  getShowItemsCounter(): Promise<boolean>;
  setAutoPriority(bAutoPriority: boolean): Promise<void>;
  setCollapsed(bCollapsed: boolean): Promise<void>;
  setEnableCollapseButtonWhenEmpty(bEnableCollapseButtonWhenEmpty: boolean): Promise<void>;
  setShowEmptyGroup(bShowEmptyGroup: boolean): Promise<void>;
  setShowItemsCounter(bShowItemsCounter: boolean): Promise<void>;
}

/** sap.m.SelectionDetails */
export interface UI5SelectionDetails extends UI5ControlBase {
  readonly controlType: 'sap.m.SelectionDetails';
  getActionGroups(): Promise<readonly UI5ControlBase[]>;
  getActions(): Promise<readonly UI5ControlBase[]>;
  getItems(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.IconTabHeader */
export interface UI5IconTabHeader extends UI5ControlBase {
  readonly controlType: 'sap.m.IconTabHeader';
  getAriaTexts(): Promise<unknown>;
  getBackgroundDesign(): Promise<string>;
  getEnableTabReordering(): Promise<boolean>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMaxNestingLevel(): Promise<number>;
  getMode(): Promise<string>;
  getSelectedKey(): Promise<string>;
  getTabDensityMode(): Promise<string>;
  getTabsOverflowMode(): Promise<string>;
  setAriaTexts(oAriaTexts: unknown): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setEnableTabReordering(bEnableTabReordering: boolean): Promise<void>;
  setMaxNestingLevel(iMaxNestingLevel: number): Promise<void>;
  setMode(sMode: string): Promise<void>;
  setSelectedKey(sKey: string): Promise<void>;
  setTabDensityMode(sTabDensityMode: string): Promise<void>;
  setTabsOverflowMode(sTabsOverflowMode: string): Promise<void>;
}

/** sap.m.p13n.Popup */
export interface UI5P13nPopup extends UI5ControlBase {
  readonly controlType: 'sap.m.p13n.Popup';
  getAdditionalButtons(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
  getPanels(): Promise<readonly UI5ControlBase[]>;
  getReset(): Promise<unknown>;
  getTitle(): Promise<string>;
  getWarningText(): Promise<string>;
  open(oSource: UI5ControlBase, mSettings?: unknown): Promise<void>;
  setMode(sMode: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setWarningText(sWarningText: string): Promise<void>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.p13n.SelectionPanel */
export interface UI5P13nSelectionPanel extends UI5ControlBase {
  readonly controlType: 'sap.m.p13n.SelectionPanel';
  getActiveColumn(): Promise<string>;
  getEnableCount(): Promise<boolean>;
  getFieldColumn(): Promise<string>;
  getItemFactory(): Promise<unknown>;
  getMultiSelectMode(): Promise<string>;
  getShowHeader(): Promise<boolean>;
  getTitle(): Promise<string>;
  setActiveColumn(sActiveColumn: string): Promise<void>;
  setEnableCount(bEnableCount: boolean): Promise<void>;
  setFieldColumn(sFieldColumn: string): Promise<void>;
  setItemFactory(fnItemFactory: unknown): Promise<void>;
  setMultiSelectMode(sMultiSelectMode: string): Promise<void>;
  setP13nData(aP13nData: readonly string[]): Promise<void>;
  setShowHeader(bShowHeader: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.m.p13n.SortPanel */
export interface UI5P13nSortPanel extends UI5ControlBase {
  readonly controlType: 'sap.m.p13n.SortPanel';
  getTitle(): Promise<string>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.m.p13n.GroupPanel */
export interface UI5P13nGroupPanel extends UI5ControlBase {
  readonly controlType: 'sap.m.p13n.GroupPanel';
  getEnableShowField(): Promise<boolean>;
  getTitle(): Promise<string>;
  setEnableShowField(bEnableShowField: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.m.table.columnmenu.Menu */
export interface UI5ColumnMenu extends UI5ControlBase {
  readonly controlType: 'sap.m.table.columnmenu.Menu';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getQuickActions(): Promise<readonly UI5ControlBase[]>;
  getShowTableSettingsButton(): Promise<boolean>;
  openBy(oAnchor: UI5ControlBase | HTMLElement, bSuppressEvent?: boolean): Promise<void>;
  setShowTableSettingsButton(bShowTableSettingsButton: boolean): Promise<void>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.ui.table
// ═══════════════════════════════════════════════════════════════════════

/** sap.ui.table.Table */
export interface UI5GridTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.table.Table';
  clearSelection(): Promise<void>;
  filter(oColumn: UI5ControlBase, sValue?: string): Promise<void>;
  focus(oFocusInfo?: unknown): Promise<void>;
  getAlternateRowColors(): Promise<boolean>;
  getBinding(sName?: string): Promise<string>;
  getColumnHeaderHeight(): Promise<number>;
  getColumnHeaderVisible(): Promise<boolean>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getContextByIndex(iIndex: number): Promise<string | null>;
  getContextMenu(): Promise<UI5ControlBase | null>;
  getEnableBusyIndicator(): Promise<boolean>;
  getEnableCellFilter(): Promise<boolean>;
  getEnableColumnFreeze(): Promise<boolean>;
  getEnableColumnReordering(): Promise<boolean>;
  getEnableCustomFilter(): Promise<boolean>;
  getEnableSelectAll(): Promise<boolean>;
  getExtension(): Promise<readonly UI5ControlBase[]>;
  getFirstVisibleRow(): Promise<number>;
  getFixedColumnCount(): Promise<number>;
  getFooter(): Promise<UI5ControlBase | null>;
  getNoData(): Promise<UI5ControlBase | null>;
  getRowActionCount(): Promise<number>;
  getRowActionTemplate(): Promise<UI5ControlBase | null>;
  getRowMode(): Promise<UI5ControlBase | null>;
  getRows(): Promise<readonly UI5ControlBase[]>;
  getRowSettingsTemplate(): Promise<UI5ControlBase | null>;
  getScrollThreshold(): Promise<number>;
  getSelectedIndices(): Promise<readonly number[]>;
  getSelectionBehavior(): Promise<string>;
  getSelectionMode(): Promise<string>;
  getShowNoData(): Promise<boolean>;
  getShowOverlay(): Promise<boolean>;
  getSortedColumns(): Promise<readonly UI5ControlBase[]>;
  getThreshold(): Promise<number>;
  getWidth(): Promise<string>;
  isIndexSelected(iIndex: number): Promise<boolean>;
  selectAll(): Promise<void>;
  setAlternateRowColors(bAlternateRowColors: boolean): Promise<void>;
  setColumnHeaderHeight(iColumnHeaderHeight: number): Promise<void>;
  setColumnHeaderVisible(bColumnHeaderVisible: boolean): Promise<void>;
  setContextMenu(oContextMenu: UI5ControlBase): Promise<void>;
  setEnableBusyIndicator(bEnableBusyIndicator: boolean): Promise<void>;
  setEnableCellFilter(bEnableCellFilter: boolean): Promise<void>;
  setEnableColumnFreeze(bEnableColumnFreeze: boolean): Promise<void>;
  setEnableColumnReordering(bEnableColumnReordering: boolean): Promise<void>;
  setEnableCustomFilter(bEnableCustomFilter: boolean): Promise<void>;
  setEnableSelectAll(bEnableSelectAll: boolean): Promise<void>;
  setFirstVisibleRow(iFirstVisibleRow: number): Promise<void>;
  setFixedColumnCount(iFixedColumnCount: number): Promise<void>;
  setFooter(vFooter: UI5ControlBase | string): Promise<void>;
  setNoData(vNoData: UI5ControlBase | string): Promise<void>;
  setRowActionCount(iRowActionCount: number): Promise<void>;
  setRowActionTemplate(oRowActionTemplate: UI5ControlBase): Promise<void>;
  setRowMode(vRowMode: UI5ControlBase | string): Promise<void>;
  setRowSettingsTemplate(oRowSettingsTemplate: UI5ControlBase): Promise<void>;
  setScrollThreshold(iThreshold: number): Promise<void>;
  setSelectedIndex(iIndex: number): Promise<void>;
  setSelectionBehavior(sSelectionBehavior: string): Promise<void>;
  setSelectionInterval(iIndexFrom: number, iIndexTo: number): Promise<void>;
  setSelectionMode(sSelectionMode: string): Promise<void>;
  setShowNoData(bShowNoData: boolean): Promise<void>;
  setShowOverlay(bShowOverlay: boolean): Promise<void>;
  setThreshold(iThreshold: number): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  sort(oColumn?: UI5ControlBase, sSortOrder?: string, bAdd?: boolean): Promise<void>;
}

/** sap.ui.table.TreeTable */
export interface UI5TreeTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.table.TreeTable';
  collapse(vRowIndex: number | readonly number[]): Promise<void>;
  collapseAll(): Promise<void>;
  expand(vRowIndex: number | readonly number[]): Promise<void>;
  expandToLevel(iLevel: number): Promise<void>;
  getGroupHeaderProperty(): Promise<string>;
  getSelectedIndices(): Promise<readonly number[]>;
  getUseGroupMode(): Promise<boolean>;
  isExpanded(iRowIndex: number): Promise<boolean>;
  selectAll(): Promise<void>;
  setFixedRowCount(iRowCount: number): Promise<void>;
  setGroupHeaderProperty(sGroupHeaderProperty: string): Promise<void>;
  setSelectedIndex(iRowIndex: number): Promise<void>;
  setSelectionInterval(iFromIndex: number, iToIndex: number): Promise<void>;
  setUseGroupMode(bUseGroupMode: boolean): Promise<void>;
}

/** sap.ui.table.AnalyticalTable */
export interface UI5AnalyticalTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.table.AnalyticalTable';
  collapse(vRowIndex: number | readonly number[]): Promise<void>;
  collapseAll(): Promise<void>;
  expand(vRowIndex: number | readonly number[]): Promise<void>;
  expandAll(): Promise<void>;
  getSelectedIndex(): Promise<number>;
  getSelectedIndices(): Promise<readonly number[]>;
  getTotalSize(): Promise<number>;
  isExpanded(iRowIndex: number): Promise<boolean>;
  isIndexSelected(iRowIndex: number): Promise<boolean>;
  selectAll(): Promise<void>;
  setSelectedIndex(iRowIndex: number): Promise<void>;
  setSelectionInterval(iFromIndex: number, iToIndex: number): Promise<void>;
}

/** sap.ui.table.Column */
export interface UI5TableColumn extends UI5ControlBase {
  readonly controlType: 'sap.ui.table.Column';
  autoResize(): Promise<void>;
  getAutoResizable(): Promise<boolean>;
  getDefaultFilterOperator(): Promise<string>;
  getFiltered(): Promise<boolean>;
  getFilterOperator(): Promise<string>;
  getFilterProperty(): Promise<string>;
  getFilterType(): Promise<unknown>;
  getFilterValue(): Promise<string>;
  getHAlign(): Promise<string>;
  getHeaderMenu(): Promise<string | null>;
  getHeaderSpan(): Promise<unknown>;
  getLabel(): Promise<UI5ControlBase | null>;
  getMinWidth(): Promise<number>;
  getMultiLabels(): Promise<readonly UI5ControlBase[]>;
  getName(): Promise<string>;
  getResizable(): Promise<boolean>;
  getShowFilterMenuEntry(): Promise<boolean>;
  getShowSortMenuEntry(): Promise<boolean>;
  getSortOrder(): Promise<string>;
  getSortProperty(): Promise<string>;
  getTemplate(): Promise<UI5ControlBase | null>;
  getWidth(): Promise<string>;
  setAutoResizable(bAutoResizable: boolean): Promise<void>;
  setDefaultFilterOperator(sDefaultFilterOperator: string): Promise<void>;
  setFiltered(bFiltered: boolean): Promise<void>;
  setFilterOperator(sFilterOperator: string): Promise<void>;
  setFilterProperty(sFilterProperty: string): Promise<void>;
  setFilterType(vType: unknown): Promise<void>;
  setFilterValue(sFilterValue: string): Promise<void>;
  setHAlign(sHAlign: string): Promise<void>;
  setHeaderMenu(oHeaderMenu: string): Promise<void>;
  setHeaderSpan(oHeaderSpan: unknown): Promise<void>;
  setLabel(vLabel: UI5ControlBase | string): Promise<void>;
  setMinWidth(iMinWidth: number): Promise<void>;
  setName(sName: string): Promise<void>;
  setResizable(bResizable: boolean): Promise<void>;
  setShowFilterMenuEntry(bShowFilterMenuEntry: boolean): Promise<void>;
  setShowSortMenuEntry(bShowSortMenuEntry: boolean): Promise<void>;
  setSortOrder(sSortOrder: string): Promise<void>;
  setSortProperty(sSortProperty: string): Promise<void>;
  setTemplate(vTemplate: UI5ControlBase | string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.table.Row */
export interface UI5TableRow extends UI5ControlBase {
  readonly controlType: 'sap.ui.table.Row';
  getCells(): Promise<readonly UI5ControlBase[]>;
  getIndex(): Promise<number>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.f
// ═══════════════════════════════════════════════════════════════════════

/** sap.f.DynamicPage */
export interface UI5DynamicPage extends UI5ControlBase {
  readonly controlType: 'sap.f.DynamicPage';
  getBackgroundDesign(): Promise<string>;
  getContent(): Promise<UI5ControlBase | null>;
  getFitContent(): Promise<boolean>;
  getFooter(): Promise<UI5ControlBase | null>;
  getHeader(): Promise<UI5ControlBase | null>;
  getHeaderExpanded(): Promise<boolean>;
  getHeaderPinned(): Promise<boolean>;
  getLandmarkInfo(): Promise<UI5ControlBase | null>;
  getPreserveHeaderStateOnScroll(): Promise<boolean>;
  getScrollDelegate(): Promise<string>;
  getShowFooter(): Promise<boolean>;
  getStickySubheaderProvider(): Promise<string | null>;
  getTitle(): Promise<UI5ControlBase | null>;
  getToggleHeaderOnTitleClick(): Promise<boolean>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setContent(oContent: UI5ControlBase): Promise<void>;
  setFitContent(bFitContent: boolean): Promise<void>;
  setFooter(oFooter: UI5ControlBase): Promise<void>;
  setHeader(oHeader: UI5ControlBase): Promise<void>;
  setHeaderExpanded(bHeaderExpanded: boolean): Promise<void>;
  setHeaderPinned(bHeaderPinned: boolean): Promise<void>;
  setLandmarkInfo(oLandmarkInfo: UI5ControlBase): Promise<void>;
  setPreserveHeaderStateOnScroll(bPreserveHeaderStateOnScroll: boolean): Promise<void>;
  setShowFooter(bShowFooter: boolean): Promise<void>;
  setStickySubheaderProvider(oStickySubheaderProvider: string): Promise<void>;
  setTitle(oTitle: UI5ControlBase): Promise<void>;
  setToggleHeaderOnTitleClick(bToggleHeaderOnTitleClick: boolean): Promise<void>;
}

/** sap.f.DynamicPageTitle */
export interface UI5DynamicPageTitle extends UI5ControlBase {
  readonly controlType: 'sap.f.DynamicPageTitle';
  getActions(): Promise<readonly UI5ControlBase[]>;
  getAreaShrinkRatio(): Promise<string>;
  getBackgroundDesign(): Promise<string>;
  getBreadcrumbs(): Promise<UI5ControlBase | null>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getExpandedContent(): Promise<readonly UI5ControlBase[]>;
  getExpandedHeading(): Promise<UI5ControlBase | null>;
  getHeading(): Promise<UI5ControlBase | null>;
  getNavigationActions(): Promise<readonly UI5ControlBase[]>;
  getSnappedContent(): Promise<readonly UI5ControlBase[]>;
  getSnappedHeading(): Promise<UI5ControlBase | null>;
  getSnappedTitleOnMobile(): Promise<UI5ControlBase | null>;
  setAreaShrinkRatio(sAreaShrinkRatio: string): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setBreadcrumbs(oBreadcrumbs: UI5ControlBase): Promise<void>;
  setExpandedHeading(oExpandedHeading: UI5ControlBase): Promise<void>;
  setHeading(oHeading: UI5ControlBase): Promise<void>;
  setSnappedHeading(oSnappedHeading: UI5ControlBase): Promise<void>;
  setSnappedTitleOnMobile(oSnappedTitleOnMobile: UI5ControlBase): Promise<void>;
}

/** sap.f.DynamicPageHeader */
export interface UI5DynamicPageHeader extends UI5ControlBase {
  readonly controlType: 'sap.f.DynamicPageHeader';
  getBackgroundDesign(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getPinnable(): Promise<boolean>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setPinnable(bPinnable: boolean): Promise<void>;
}

/** sap.f.FlexibleColumnLayout */
export interface UI5FlexibleColumnLayout extends UI5ControlBase {
  readonly controlType: 'sap.f.FlexibleColumnLayout';
  backToPage(sPageId: string): Promise<void>;
  backToTopBeginColumn(): Promise<void>;
  backToTopEndColumn(): Promise<void>;
  backToTopMidColumn(): Promise<void>;
  getAutoFocus(): Promise<boolean>;
  getBackgroundDesign(): Promise<string>;
  getBeginColumnPages(): Promise<readonly UI5ControlBase[]>;
  getCurrentBeginColumnPage(): Promise<UI5ControlBase>;
  getCurrentEndColumnPage(): Promise<UI5ControlBase>;
  getCurrentMidColumnPage(): Promise<UI5ControlBase>;
  getDefaultTransitionNameBeginColumn(): Promise<string>;
  getDefaultTransitionNameEndColumn(): Promise<string>;
  getDefaultTransitionNameMidColumn(): Promise<string>;
  getEndColumnPages(): Promise<readonly UI5ControlBase[]>;
  getInitialBeginColumnPage(): Promise<string | null>;
  getInitialEndColumnPage(): Promise<string | null>;
  getInitialMidColumnPage(): Promise<string | null>;
  getLandmarkInfo(): Promise<UI5ControlBase | null>;
  getLayout(): Promise<string>;
  getMaxColumnsCount(): Promise<number>;
  getMidColumnPages(): Promise<readonly UI5ControlBase[]>;
  getRestoreFocusOnBackNavigation(): Promise<boolean>;
  setAutoFocus(bAutoFocus: boolean): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setDefaultTransitionNameBeginColumn(sDefaultTransitionNameBeginColumn: string): Promise<void>;
  setDefaultTransitionNameEndColumn(sDefaultTransitionNameEndColumn: string): Promise<void>;
  setDefaultTransitionNameMidColumn(sDefaultTransitionNameMidColumn: string): Promise<void>;
  setInitialBeginColumnPage(oInitialBeginColumnPage: string | UI5ControlBase): Promise<void>;
  setInitialEndColumnPage(oInitialEndColumnPage: string | UI5ControlBase): Promise<void>;
  setInitialMidColumnPage(oInitialMidColumnPage: string | UI5ControlBase): Promise<void>;
  setLandmarkInfo(oLandmarkInfo: UI5ControlBase): Promise<void>;
  setLayout(sLayout: string): Promise<void>;
  setRestoreFocusOnBackNavigation(bRestoreFocusOnBackNavigation: boolean): Promise<void>;
  to(sPageId: string, sTransitionName?: string): Promise<void>;
  toBeginColumnPage(sPageId: string, sTransitionName?: string): Promise<void>;
  toEndColumnPage(sPageId: string, sTransitionName?: string): Promise<void>;
  toMidColumnPage(sPageId: string, sTransitionName?: string): Promise<void>;
}

/** sap.f.Card */
export interface UI5FCard extends UI5ControlBase {
  readonly controlType: 'sap.f.Card';
  getContent(): Promise<UI5ControlBase | null>;
  getHeader(): Promise<UI5ControlBase | null>;
  getHeaderPosition(): Promise<string>;
  setContent(oContent: UI5ControlBase): Promise<void>;
  setHeader(oHeader: UI5ControlBase): Promise<void>;
  setHeaderPosition(sHeaderPosition: string): Promise<void>;
}

/** sap.f.Avatar */
export interface UI5FAvatar extends UI5ControlBase {
  readonly controlType: 'sap.f.Avatar';
}

/** sap.f.GridContainer */
export interface UI5GridContainer extends UI5ControlBase {
  readonly controlType: 'sap.f.GridContainer';
  focusItem(iIndex: number): Promise<void>;
  focusItemByDirection(sDirection: string, iRow: number, iColumn: number): Promise<void>;
  getActiveLayoutSettings(): Promise<UI5ControlBase>;
  getAllowDenseFill(): Promise<boolean>;
  getContainerQuery(): Promise<boolean>;
  getInlineBlockLayout(): Promise<boolean>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getLayout(): Promise<UI5ControlBase | null>;
  getLayoutL(): Promise<UI5ControlBase | null>;
  getLayoutM(): Promise<UI5ControlBase | null>;
  getLayoutS(): Promise<UI5ControlBase | null>;
  getLayoutXL(): Promise<UI5ControlBase | null>;
  getLayoutXS(): Promise<UI5ControlBase | null>;
  getMinHeight(): Promise<string>;
  getSnapToRow(): Promise<boolean>;
  getWidth(): Promise<string>;
  setAllowDenseFill(bAllowDenseFill: boolean): Promise<void>;
  setContainerQuery(bContainerQuery: boolean): Promise<void>;
  setInlineBlockLayout(bInlineBlockLayout: boolean): Promise<void>;
  setLayout(oLayout: UI5ControlBase): Promise<void>;
  setLayoutL(oLayoutL: UI5ControlBase): Promise<void>;
  setLayoutM(oLayoutM: UI5ControlBase): Promise<void>;
  setLayoutS(oLayoutS: UI5ControlBase): Promise<void>;
  setLayoutXL(oLayoutXL: UI5ControlBase): Promise<void>;
  setLayoutXS(oLayoutXS: UI5ControlBase): Promise<void>;
  setMinHeight(sMinHeight: string): Promise<void>;
  setSnapToRow(bSnapToRow: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.f.ShellBar */
export interface UI5ShellBar extends UI5ControlBase {
  readonly controlType: 'sap.f.ShellBar';
  getAdditionalContent(): Promise<readonly UI5ControlBase[]>;
  getHomeIcon(): Promise<string>;
  getHomeIconTooltip(): Promise<string>;
  getMenu(): Promise<UI5ControlBase | null>;
  getNotificationsNumber(): Promise<string>;
  getProfile(): Promise<UI5ControlBase | null>;
  getSearchManager(): Promise<UI5ControlBase | null>;
  getSecondTitle(): Promise<string>;
  getShowCopilot(): Promise<boolean>;
  getShowMenuButton(): Promise<boolean>;
  getShowNavButton(): Promise<boolean>;
  getShowNotifications(): Promise<boolean>;
  getShowProductSwitcher(): Promise<boolean>;
  getShowSearch(): Promise<boolean>;
  getTitle(): Promise<string>;
  setHomeIcon(sHomeIcon: string): Promise<void>;
  setHomeIconTooltip(sHomeIconTooltip: string): Promise<void>;
  setMenu(oMenu: UI5ControlBase): Promise<void>;
  setNotificationsNumber(sNotificationsNumber: string): Promise<void>;
  setProfile(oProfile: UI5ControlBase): Promise<void>;
  setSearchManager(oSearchManager: UI5ControlBase): Promise<void>;
  setSecondTitle(sSecondTitle: string): Promise<void>;
  setShowCopilot(bShowCopilot: boolean): Promise<void>;
  setShowMenuButton(bShowMenuButton: boolean): Promise<void>;
  setShowNavButton(bShowNavButton: boolean): Promise<void>;
  setShowNotifications(bShowNotifications: boolean): Promise<void>;
  setShowProductSwitcher(bShowProductSwitcher: boolean): Promise<void>;
  setShowSearch(bShowSearch: boolean): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
}

/** sap.f.ProductSwitch */
export interface UI5ProductSwitch extends UI5ControlBase {
  readonly controlType: 'sap.f.ProductSwitch';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedItem(): Promise<string | null>;
  setSelectedItem(vItem: string | UI5ControlBase | null): Promise<void>;
}

/** sap.f.semantic.SemanticPage */
export interface UI5FSemanticPage extends UI5ControlBase {
  readonly controlType: 'sap.f.semantic.SemanticPage';
  getAddAction(): Promise<UI5ControlBase | null>;
  getCloseAction(): Promise<UI5ControlBase | null>;
  getContent(): Promise<UI5ControlBase | null>;
  getCopyAction(): Promise<UI5ControlBase | null>;
  getCustomShareActions(): Promise<readonly UI5ControlBase[]>;
  getDeleteAction(): Promise<UI5ControlBase | null>;
  getDiscussInJamAction(): Promise<UI5ControlBase | null>;
  getDraftIndicator(): Promise<UI5ControlBase | null>;
  getEditAction(): Promise<UI5ControlBase | null>;
  getExitFullScreenAction(): Promise<UI5ControlBase | null>;
  getFavoriteAction(): Promise<UI5ControlBase | null>;
  getFitContent(): Promise<boolean>;
  getFlagAction(): Promise<UI5ControlBase | null>;
  getFooterCustomActions(): Promise<readonly UI5ControlBase[]>;
  getFooterMainAction(): Promise<UI5ControlBase | null>;
  getFullScreenAction(): Promise<UI5ControlBase | null>;
  getHeaderContent(): Promise<readonly UI5ControlBase[]>;
  getHeaderExpanded(): Promise<boolean>;
  getHeaderPinnable(): Promise<boolean>;
  getLandmarkInfo(): Promise<UI5ControlBase | null>;
  getMessagesIndicator(): Promise<UI5ControlBase | null>;
  getNegativeAction(): Promise<UI5ControlBase | null>;
  getPositiveAction(): Promise<UI5ControlBase | null>;
  getPreserveHeaderStateOnScroll(): Promise<boolean>;
  getPrintAction(): Promise<UI5ControlBase | null>;
  getSaveAsTileAction(): Promise<UI5ControlBase | null>;
  getSendEmailAction(): Promise<UI5ControlBase | null>;
  getSendMessageAction(): Promise<UI5ControlBase | null>;
  getShareInJamAction(): Promise<UI5ControlBase | null>;
  getShowFooter(): Promise<boolean>;
  getTitleAreaShrinkRatio(): Promise<string>;
  getTitleBreadcrumbs(): Promise<UI5ControlBase | null>;
  getTitleContent(): Promise<readonly UI5ControlBase[]>;
  getTitleCustomIconActions(): Promise<readonly UI5ControlBase[]>;
  getTitleCustomTextActions(): Promise<readonly UI5ControlBase[]>;
  getTitleExpandedContent(): Promise<readonly UI5ControlBase[]>;
  getTitleExpandedHeading(): Promise<UI5ControlBase | null>;
  getTitleHeading(): Promise<UI5ControlBase | null>;
  getTitleMainAction(): Promise<UI5ControlBase | null>;
  getTitleSnappedContent(): Promise<readonly UI5ControlBase[]>;
  getTitleSnappedHeading(): Promise<UI5ControlBase | null>;
  getTitleSnappedOnMobile(): Promise<UI5ControlBase | null>;
  getToggleHeaderOnTitleClick(): Promise<boolean>;
  setAddAction(oAddAction: UI5ControlBase): Promise<void>;
  setCloseAction(oCloseAction: UI5ControlBase): Promise<void>;
  setContent(oContent: UI5ControlBase): Promise<void>;
  setCopyAction(oCopyAction: UI5ControlBase): Promise<void>;
  setDeleteAction(oDeleteAction: UI5ControlBase): Promise<void>;
  setDiscussInJamAction(oDiscussInJamAction: UI5ControlBase): Promise<void>;
  setDraftIndicator(oDraftIndicator: UI5ControlBase): Promise<void>;
  setEditAction(oEditAction: UI5ControlBase): Promise<void>;
  setExitFullScreenAction(oExitFullScreenAction: UI5ControlBase): Promise<void>;
  setFavoriteAction(oFavoriteAction: UI5ControlBase): Promise<void>;
  setFitContent(bFitContent: boolean): Promise<void>;
  setFlagAction(oFlagAction: UI5ControlBase): Promise<void>;
  setFooterMainAction(oFooterMainAction: UI5ControlBase): Promise<void>;
  setFullScreenAction(oFullScreenAction: UI5ControlBase): Promise<void>;
  setHeaderExpanded(bHeaderExpanded: boolean): Promise<void>;
  setHeaderPinnable(bHeaderPinnable: boolean): Promise<void>;
  setLandmarkInfo(oLandmarkInfo: UI5ControlBase): Promise<void>;
  setMessagesIndicator(oMessagesIndicator: UI5ControlBase): Promise<void>;
  setNegativeAction(oNegativeAction: UI5ControlBase): Promise<void>;
  setPositiveAction(oPositiveAction: UI5ControlBase): Promise<void>;
  setPreserveHeaderStateOnScroll(bPreserveHeaderStateOnScroll: boolean): Promise<void>;
  setPrintAction(oPrintAction: UI5ControlBase): Promise<void>;
  setSaveAsTileAction(oSaveAsTileAction: UI5ControlBase): Promise<void>;
  setSendEmailAction(oSendEmailAction: UI5ControlBase): Promise<void>;
  setSendMessageAction(oSendMessageAction: UI5ControlBase): Promise<void>;
  setShareInJamAction(oShareInJamAction: UI5ControlBase): Promise<void>;
  setShowFooter(bShowFooter: boolean): Promise<void>;
  setTitleAreaShrinkRatio(sTitleAreaShrinkRatio: string): Promise<void>;
  setTitleBreadcrumbs(oTitleBreadcrumbs: UI5ControlBase): Promise<void>;
  setTitleExpandedHeading(oTitleExpandedHeading: UI5ControlBase): Promise<void>;
  setTitleHeading(oTitleHeading: UI5ControlBase): Promise<void>;
  setTitleMainAction(oTitleMainAction: UI5ControlBase): Promise<void>;
  setTitleSnappedHeading(oTitleSnappedHeading: UI5ControlBase): Promise<void>;
  setTitleSnappedOnMobile(oTitleSnappedOnMobile: UI5ControlBase): Promise<void>;
  setToggleHeaderOnTitleClick(bToggleHeaderOnTitleClick: boolean): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.uxap
// ═══════════════════════════════════════════════════════════════════════

/** sap.uxap.ObjectPageLayout */
export interface UI5ObjectPageLayout extends UI5ControlBase {
  readonly controlType: 'sap.uxap.ObjectPageLayout';
  getAlwaysShowContentHeader(): Promise<boolean>;
  getBackgroundDesignAnchorBar(): Promise<string>;
  getEnableLazyLoading(): Promise<boolean>;
  getFlexEnabled(): Promise<boolean>;
  getFooter(): Promise<UI5ControlBase | null>;
  getHeaderContent(): Promise<readonly UI5ControlBase[]>;
  getHeaderContentPinnable(): Promise<boolean>;
  getHeaderContentPinned(): Promise<boolean>;
  getHeaderTitle(): Promise<UI5ControlBase | null>;
  getHeight(): Promise<string>;
  getIsChildPage(): Promise<boolean>;
  getLandmarkInfo(): Promise<UI5ControlBase | null>;
  getPreserveHeaderStateOnScroll(): Promise<boolean>;
  getScrollDelegate(): Promise<string>;
  getScrollingSectionId(): Promise<string>;
  getSections(): Promise<readonly UI5ControlBase[]>;
  getSectionTitleLevel(): Promise<string>;
  getSelectedSection(): Promise<string | null>;
  getShowAnchorBar(): Promise<boolean>;
  getShowAnchorBarPopover(): Promise<boolean>;
  getShowEditHeaderButton(): Promise<boolean>;
  getShowFooter(): Promise<boolean>;
  getShowHeaderContent(): Promise<boolean>;
  getShowOnlyHighImportance(): Promise<boolean>;
  getShowTitleInHeaderContent(): Promise<boolean>;
  getSubSectionLayout(): Promise<string>;
  getToggleHeaderOnTitleClick(): Promise<boolean>;
  getUpperCaseAnchorBar(): Promise<boolean>;
  getUseIconTabBar(): Promise<boolean>;
  getUseTwoColumnsForLargeScreen(): Promise<boolean>;
  scrollToSection(sId: string, iDuration?: number, iOffset?: number): Promise<void>;
  setAlwaysShowContentHeader(bAlwaysShowContentHeader: boolean): Promise<void>;
  setBackgroundDesignAnchorBar(sBackgroundDesignAnchorBar: string): Promise<void>;
  setEnableLazyLoading(bEnableLazyLoading: boolean): Promise<void>;
  setFlexEnabled(bFlexEnabled: boolean): Promise<void>;
  setFooter(oFooter: UI5ControlBase): Promise<void>;
  setHeaderContentPinnable(bHeaderContentPinnable: boolean): Promise<void>;
  setHeaderContentPinned(bHeaderContentPinned: boolean): Promise<void>;
  setHeaderTitle(oHeaderTitle: UI5ControlBase): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setIsChildPage(bIsChildPage: boolean): Promise<void>;
  setLandmarkInfo(oLandmarkInfo: UI5ControlBase): Promise<void>;
  setPreserveHeaderStateOnScroll(bPreserveHeaderStateOnScroll: boolean): Promise<void>;
  setSectionTitleLevel(sSectionTitleLevel: string): Promise<void>;
  setSelectedSection(sId: string | UI5ControlBase): Promise<void>;
  setShowAnchorBar(bShowAnchorBar: boolean): Promise<void>;
  setShowAnchorBarPopover(bShowAnchorBarPopover: boolean): Promise<void>;
  setShowEditHeaderButton(bShowEditHeaderButton: boolean): Promise<void>;
  setShowFooter(bShowFooter: boolean): Promise<void>;
  setShowHeaderContent(bShowHeaderContent: boolean): Promise<void>;
  setShowOnlyHighImportance(bShowOnlyHighImportance: boolean): Promise<void>;
  setShowTitleInHeaderContent(bShowTitleInHeaderContent: boolean): Promise<void>;
  setSubSectionLayout(sSubSectionLayout: string): Promise<void>;
  setToggleHeaderOnTitleClick(bToggleHeaderOnTitleClick: boolean): Promise<void>;
  setUpperCaseAnchorBar(bUpperCaseAnchorBar: boolean): Promise<void>;
  setUseIconTabBar(bUseIconTabBar: boolean): Promise<void>;
  setUseTwoColumnsForLargeScreen(bUseTwoColumnsForLargeScreen: boolean): Promise<void>;
}

/** sap.uxap.ObjectPageSection */
export interface UI5ObjectPageSection extends UI5ControlBase {
  readonly controlType: 'sap.uxap.ObjectPageSection';
  getAnchorBarButtonColor(): Promise<string>;
  getHeading(): Promise<UI5ControlBase | null>;
  getSelectedSubSection(): Promise<string | null>;
  getShowTitle(): Promise<boolean>;
  getSubSections(): Promise<readonly UI5ControlBase[]>;
  getTitleUppercase(): Promise<boolean>;
  getWrapTitle(): Promise<boolean>;
  setAnchorBarButtonColor(sAnchorBarButtonColor: string): Promise<void>;
  setHeading(oHeading: UI5ControlBase): Promise<void>;
  setSelectedSubSection(oSelectedSubSection: string | UI5ControlBase): Promise<void>;
  setShowTitle(bShowTitle: boolean): Promise<void>;
  setTitleUppercase(bTitleUppercase: boolean): Promise<void>;
  setWrapTitle(bWrapTitle: boolean): Promise<void>;
}

/** sap.uxap.ObjectPageSubSection */
export interface UI5ObjectPageSubSection extends UI5ControlBase {
  readonly controlType: 'sap.uxap.ObjectPageSubSection';
  getActions(): Promise<readonly UI5ControlBase[]>;
  getBlocks(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
  getMoreBlocks(): Promise<readonly UI5ControlBase[]>;
  getShowTitle(): Promise<boolean>;
  getTitleUppercase(): Promise<boolean>;
  setMode(sMode: string): Promise<void>;
  setShowTitle(bShowTitle: boolean): Promise<void>;
  setTitleUppercase(bTitleUppercase: boolean): Promise<void>;
}

/** sap.uxap.ObjectPageHeader */
export interface UI5ObjectPageHeader extends UI5ControlBase {
  readonly controlType: 'sap.uxap.ObjectPageHeader';
  getActions(): Promise<readonly UI5ControlBase[]>;
  getBreadcrumbs(): Promise<UI5ControlBase | null>;
  getIsActionAreaAlwaysVisible(): Promise<boolean>;
  getIsObjectIconAlwaysVisible(): Promise<boolean>;
  getIsObjectSubtitleAlwaysVisible(): Promise<boolean>;
  getIsObjectTitleAlwaysVisible(): Promise<boolean>;
  getMarkChanges(): Promise<boolean>;
  getMarkFavorite(): Promise<boolean>;
  getMarkFlagged(): Promise<boolean>;
  getMarkLocked(): Promise<boolean>;
  getNavigationBar(): Promise<UI5ControlBase | null>;
  getObjectImageAlt(): Promise<string>;
  getObjectImageBackgroundColor(): Promise<string>;
  getObjectImageDensityAware(): Promise<boolean>;
  getObjectImageShape(): Promise<string>;
  getObjectImageURI(): Promise<string>;
  getObjectSubtitle(): Promise<string>;
  getObjectTitle(): Promise<string>;
  getShowMarkers(): Promise<boolean>;
  getShowPlaceholder(): Promise<boolean>;
  getShowTitleSelector(): Promise<boolean>;
  getSideContentButton(): Promise<UI5ControlBase | null>;
  getTitleSelectorTooltip(): Promise<UI5ControlBase | null>;
  setBreadcrumbs(oBreadcrumbs: UI5ControlBase): Promise<void>;
  setIsActionAreaAlwaysVisible(bIsActionAreaAlwaysVisible: boolean): Promise<void>;
  setIsObjectIconAlwaysVisible(bIsObjectIconAlwaysVisible: boolean): Promise<void>;
  setIsObjectSubtitleAlwaysVisible(bIsObjectSubtitleAlwaysVisible: boolean): Promise<void>;
  setIsObjectTitleAlwaysVisible(bIsObjectTitleAlwaysVisible: boolean): Promise<void>;
  setMarkChanges(bMarkChanges: boolean): Promise<void>;
  setMarkFavorite(bMarkFavorite: boolean): Promise<void>;
  setMarkFlagged(bMarkFlagged: boolean): Promise<void>;
  setMarkLocked(bMarkLocked: boolean): Promise<void>;
  setNavigationBar(oNavigationBar: UI5ControlBase): Promise<void>;
  setObjectImageAlt(sObjectImageAlt: string): Promise<void>;
  setObjectImageBackgroundColor(sObjectImageBackgroundColor: string): Promise<void>;
  setObjectImageDensityAware(bObjectImageDensityAware: boolean): Promise<void>;
  setObjectImageShape(sObjectImageShape: string): Promise<void>;
  setObjectImageURI(sObjectImageURI: string): Promise<void>;
  setObjectSubtitle(sObjectSubtitle: string): Promise<void>;
  setObjectTitle(sObjectTitle: string): Promise<void>;
  setShowMarkers(bShowMarkers: boolean): Promise<void>;
  setShowPlaceholder(bShowPlaceholder: boolean): Promise<void>;
  setShowTitleSelector(bShowTitleSelector: boolean): Promise<void>;
  setSideContentButton(oSideContentButton: UI5ControlBase): Promise<void>;
  setTitleSelectorTooltip(vTitleSelectorTooltip: UI5ControlBase | string): Promise<void>;
}

/** sap.uxap.ObjectPageDynamicHeaderTitle */
export interface UI5ObjectPageDynamicHeaderTitle extends UI5ControlBase {
  readonly controlType: 'sap.uxap.ObjectPageDynamicHeaderTitle';
}

/** sap.uxap.AnchorBar */
export interface UI5AnchorBar extends UI5ControlBase {
  readonly controlType: 'sap.uxap.AnchorBar';
  getBackgroundDesign(): Promise<string>;
  getScrollDelegate(): Promise<string>;
  getSelectedButton(): Promise<string | null>;
  getShowPopover(): Promise<boolean>;
  getUpperCase(): Promise<boolean>;
  scrollToCurrentlySelectedSection(): Promise<void>;
  scrollToSection(sId: string, iDuration?: number): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setSelectedButton(oSelectedButton: string | UI5ControlBase): Promise<void>;
  setShowPopover(bShowPopover: boolean): Promise<void>;
  setUpperCase(bUpperCase: boolean): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.ui.layout
// ═══════════════════════════════════════════════════════════════════════

/** sap.ui.layout.form.SimpleForm */
export interface UI5SimpleForm extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.form.SimpleForm';
  getAdjustLabelSpan(): Promise<boolean>;
  getBackgroundDesign(): Promise<string>;
  getBreakpointL(): Promise<number>;
  getBreakpointM(): Promise<number>;
  getBreakpointXL(): Promise<number>;
  getColumnsL(): Promise<number>;
  getColumnsM(): Promise<number>;
  getColumnsXL(): Promise<number>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getEditable(): Promise<boolean>;
  getEmptySpanL(): Promise<number>;
  getEmptySpanM(): Promise<number>;
  getEmptySpanS(): Promise<number>;
  getEmptySpanXL(): Promise<number>;
  getLabelSpanL(): Promise<number>;
  getLabelSpanM(): Promise<number>;
  getLabelSpanS(): Promise<number>;
  getLabelSpanXL(): Promise<number>;
  getLayout(): Promise<string>;
  getMaxContainerCols(): Promise<number>;
  getSingleContainerFullSize(): Promise<boolean>;
  getTitle(): Promise<UI5ControlBase | null>;
  getToolbar(): Promise<UI5ControlBase | null>;
  getWidth(): Promise<string>;
  setAdjustLabelSpan(bAdjustLabelSpan: boolean): Promise<void>;
  setBackgroundDesign(sBackgroundDesign: string): Promise<void>;
  setBreakpointL(iBreakpointL: number): Promise<void>;
  setBreakpointM(iBreakpointM: number): Promise<void>;
  setBreakpointXL(iBreakpointXL: number): Promise<void>;
  setColumnsL(iColumnsL: number): Promise<void>;
  setColumnsM(iColumnsM: number): Promise<void>;
  setColumnsXL(iColumnsXL: number): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEmptySpanL(iEmptySpanL: number): Promise<void>;
  setEmptySpanM(iEmptySpanM: number): Promise<void>;
  setEmptySpanS(iEmptySpanS: number): Promise<void>;
  setEmptySpanXL(iEmptySpanXL: number): Promise<void>;
  setLabelSpanL(iLabelSpanL: number): Promise<void>;
  setLabelSpanM(iLabelSpanM: number): Promise<void>;
  setLabelSpanS(iLabelSpanS: number): Promise<void>;
  setLabelSpanXL(iLabelSpanXL: number): Promise<void>;
  setLayout(sLayout: string): Promise<void>;
  setMaxContainerCols(iMaxContainerCols: number): Promise<void>;
  setSingleContainerFullSize(bSingleContainerFullSize: boolean): Promise<void>;
  setTitle(vTitle: UI5ControlBase | string): Promise<void>;
  setToolbar(oToolbar: UI5ControlBase): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.layout.Grid */
export interface UI5Grid extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.Grid';
  getContainerQuery(): Promise<boolean>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getDefaultIndent(): Promise<string>;
  getDefaultSpan(): Promise<string>;
  getHSpacing(): Promise<number>;
  getPosition(): Promise<string>;
  getVSpacing(): Promise<number>;
  getWidth(): Promise<string>;
  setContainerQuery(bContainerQuery: boolean): Promise<void>;
  setDefaultIndent(sDefaultIndent: string): Promise<void>;
  setDefaultSpan(sDefaultSpan: string): Promise<void>;
  setHSpacing(fHSpacing: number): Promise<void>;
  setPosition(sPosition: string): Promise<void>;
  setVSpacing(fVSpacing: number): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.layout.Splitter */
export interface UI5Splitter extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.Splitter';
  getContentAreas(): Promise<readonly UI5ControlBase[]>;
  getHeight(): Promise<string>;
  getOrientation(): Promise<string>;
  getWidth(): Promise<string>;
  resetContentAreasSizes(): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setOrientation(sOrientation: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  triggerResize(forceDirectly?: boolean): Promise<void>;
}

/** sap.ui.layout.ResponsiveSplitter */
export interface UI5ResponsiveSplitter extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.ResponsiveSplitter';
  getDefaultPane(): Promise<string | null>;
  getHeight(): Promise<string>;
  getRootPaneContainer(): Promise<UI5ControlBase | null>;
  getWidth(): Promise<string>;
  setDefaultPane(oDefaultPane: string): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setRootPaneContainer(oRootPaneContainer: UI5ControlBase): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.layout.form.Form */
export interface UI5Form extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.form.Form';
  getEditable(): Promise<boolean>;
  getFormContainers(): Promise<readonly UI5ControlBase[]>;
  getLayout(): Promise<UI5ControlBase | null>;
  getTitle(): Promise<UI5ControlBase | null>;
  getToolbar(): Promise<UI5ControlBase | null>;
  getWidth(): Promise<string>;
  setEditable(bEditable: boolean): Promise<void>;
  setLayout(oLayout: UI5ControlBase): Promise<void>;
  setTitle(vTitle: UI5ControlBase | string): Promise<void>;
  setToolbar(oToolbar: UI5ControlBase): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.layout.form.FormContainer */
export interface UI5FormContainer extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.form.FormContainer';
  getExpandable(): Promise<boolean>;
  getExpanded(): Promise<boolean>;
  getFormElements(): Promise<readonly UI5ControlBase[]>;
  getTitle(): Promise<UI5ControlBase | null>;
  getToolbar(): Promise<UI5ControlBase | null>;
  isVisible(): Promise<boolean>;
  setExpandable(bExpandable: boolean): Promise<void>;
  setExpanded(bExpanded: boolean): Promise<void>;
  setTitle(vTitle: UI5ControlBase | string): Promise<void>;
  setToolbar(oToolbar: UI5ControlBase): Promise<void>;
}

/** sap.ui.layout.form.FormElement */
export interface UI5FormElement extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.form.FormElement';
  getFields(): Promise<readonly UI5ControlBase[]>;
  getLabel(): Promise<UI5ControlBase | null>;
  getLabelControl(): Promise<UI5ControlBase>;
  isVisible(): Promise<boolean>;
  setLabel(vLabel: UI5ControlBase | string): Promise<void>;
}

/** sap.ui.layout.VerticalLayout */
export interface UI5VerticalLayout extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.VerticalLayout';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getEnabled(): Promise<boolean>;
  getWidth(): Promise<string>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.layout.HorizontalLayout */
export interface UI5HorizontalLayout extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.HorizontalLayout';
  getAllowWrapping(): Promise<boolean>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  setAllowWrapping(bAllowWrapping: boolean): Promise<void>;
}

/** sap.ui.layout.BlockLayout */
export interface UI5BlockLayout extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.BlockLayout';
  getBackground(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getKeepFontSize(): Promise<boolean>;
  setBackground(sBackground: string): Promise<void>;
  setKeepFontSize(bKeepFontSize: boolean): Promise<void>;
}

/** sap.ui.layout.BlockLayoutRow */
export interface UI5BlockLayoutRow extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.BlockLayoutRow';
  getAccentCells(): Promise<readonly string[]>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getRowColorSet(): Promise<string>;
  getScrollable(): Promise<boolean>;
  setRowColorSet(sType: string): Promise<void>;
  setScrollable(bScrollable: boolean): Promise<void>;
}

/** sap.ui.layout.BlockLayoutCell */
export interface UI5BlockLayoutCell extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.BlockLayoutCell';
  getBackgroundColorSet(): Promise<string>;
  getBackgroundColorShade(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getTitle(): Promise<string>;
  getTitleAlignment(): Promise<string>;
  getTitleLevel(): Promise<string>;
  getTitleLink(): Promise<UI5ControlBase | null>;
  getWidth(): Promise<number>;
  setBackgroundColorSet(sBackgroundColorSet: string): Promise<void>;
  setBackgroundColorShade(sBackgroundColorShade: string): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setTitleAlignment(sTitleAlignment: string): Promise<void>;
  setTitleLevel(sTitleLevel: string): Promise<void>;
  setTitleLink(oTitleLink: UI5ControlBase): Promise<void>;
  setWidth(iWidth: number): Promise<void>;
}

/** sap.ui.layout.DynamicSideContent */
export interface UI5DynamicSideContent extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.DynamicSideContent';
  getContainerQuery(): Promise<boolean>;
  getCurrentBreakpoint(): Promise<string>;
  getEqualSplit(): Promise<boolean>;
  getMainContent(): Promise<readonly UI5ControlBase[]>;
  getScrollDelegate(oControl: UI5ControlBase): Promise<string>;
  getShowMainContent(): Promise<boolean>;
  getShowSideContent(): Promise<boolean>;
  getSideContent(): Promise<readonly UI5ControlBase[]>;
  getSideContentFallDown(): Promise<string>;
  getSideContentPosition(): Promise<string>;
  getSideContentVisibility(): Promise<string>;
  getSideContentWidthL(): Promise<string>;
  getSideContentWidthM(): Promise<string>;
  getSideContentWidthXL(): Promise<string>;
  isMainContentVisible(): Promise<boolean>;
  isSideContentVisible(): Promise<boolean>;
  setContainerQuery(bContainerQuery: boolean): Promise<void>;
  setEqualSplit(bState: boolean): Promise<void>;
  setShowMainContent(bVisible: boolean): Promise<void>;
  setShowSideContent(bVisible: boolean): Promise<void>;
  setSideContentFallDown(sSideContentFallDown: string): Promise<void>;
  setSideContentPosition(sSideContentPosition: string): Promise<void>;
  setSideContentVisibility(sVisibility: string): Promise<void>;
  setSideContentWidthL(sSideContentWidthL: string): Promise<void>;
  setSideContentWidthM(sSideContentWidthM: string): Promise<void>;
  setSideContentWidthXL(sSideContentWidthXL: string): Promise<void>;
  toggle(): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.ui.core
// ═══════════════════════════════════════════════════════════════════════

/** sap.ui.core.Icon */
export interface UI5Icon extends UI5ControlBase {
  readonly controlType: 'sap.ui.core.Icon';
  getActiveBackgroundColor(): Promise<string>;
  getActiveColor(): Promise<string>;
  getAlt(): Promise<string>;
  getBackgroundColor(): Promise<string>;
  getColor(): Promise<string>;
  getDecorative(): Promise<boolean>;
  getHeight(): Promise<string>;
  getHoverBackgroundColor(): Promise<string>;
  getHoverColor(): Promise<string>;
  getNoTabStop(): Promise<boolean>;
  getSize(): Promise<string>;
  getSrc(): Promise<string>;
  getUseIconTooltip(): Promise<boolean>;
  getWidth(): Promise<string>;
  setActiveBackgroundColor(sActiveBackgroundColor: string): Promise<void>;
  setActiveColor(sActiveColor: string): Promise<void>;
  setAlt(sAlt: string): Promise<void>;
  setBackgroundColor(sBackgroundColor: string): Promise<void>;
  setColor(sColor: string): Promise<void>;
  setDecorative(bDecorative: boolean): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setHoverBackgroundColor(sHoverBackgroundColor: string): Promise<void>;
  setHoverColor(sHoverColor: string): Promise<void>;
  setNoTabStop(bNoTabStop: boolean): Promise<void>;
  setSize(sSize: string): Promise<void>;
  setSrc(sSrc: string): Promise<void>;
  setUseIconTooltip(bUseIconTooltip: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.core.Item */
export interface UI5Item extends UI5ControlBase {
  readonly controlType: 'sap.ui.core.Item';
  getEnabled(): Promise<boolean>;
  getKey(): Promise<string>;
  getText(): Promise<string>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setKey(sKey: string): Promise<void>;
  setText(sText: string): Promise<void>;
}

/** sap.ui.core.ListItem */
export interface UI5ListItem extends UI5ControlBase {
  readonly controlType: 'sap.ui.core.ListItem';
  getAdditionalText(): Promise<string>;
  getIcon(): Promise<string>;
  setAdditionalText(sAdditionalText: string): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
}

/** sap.ui.core.HTML */
export interface UI5HTML extends UI5ControlBase {
  readonly controlType: 'sap.ui.core.HTML';
  getContent(): Promise<string>;
  getPreferDOM(): Promise<boolean>;
  getSanitizeContent(): Promise<boolean>;
  setContent(sContent: string): Promise<void>;
  setDOMContent(oDom: Element): Promise<void>;
  setPreferDOM(bPreferDOM: boolean): Promise<void>;
  setSanitizeContent(bSanitizeContent: boolean): Promise<void>;
}

/** sap.ui.core.ComponentContainer */
export interface UI5ComponentContainer extends UI5ControlBase {
  readonly controlType: 'sap.ui.core.ComponentContainer';
  getAsync(): Promise<boolean>;
  getAutoPrefixId(): Promise<boolean>;
  getComponent(): Promise<string | null>;
  getHandleValidation(): Promise<boolean>;
  getHeight(): Promise<string>;
  getLifecycle(): Promise<string>;
  getManifest(): Promise<unknown>;
  getName(): Promise<string>;
  getPropagateModel(): Promise<boolean>;
  getSettings(): Promise<unknown>;
  getUrl(): Promise<string>;
  getUsage(): Promise<string>;
  getWidth(): Promise<string>;
  setAsync(bAsync: boolean): Promise<void>;
  setAutoPrefixId(bAutoPrefixId: boolean): Promise<void>;
  setComponent(vComponent: string): Promise<void>;
  setHandleValidation(bHandleValidation: boolean): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setLifecycle(sLifecycle: string): Promise<void>;
  setManifest(oManifest: unknown): Promise<void>;
  setName(sName: string): Promise<void>;
  setPropagateModel(bPropagateModel: boolean): Promise<void>;
  setSettings(oSettings: unknown): Promise<void>;
  setUrl(sUrl: string): Promise<void>;
  setUsage(sUsage: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.ui.comp
// ═══════════════════════════════════════════════════════════════════════

/** sap.ui.comp.smarttable.SmartTable */
export interface UI5SmartTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smarttable.SmartTable';
  applyVariant(sContext: string): Promise<void>;
  deactivateColumns(aColumnKeys: readonly string[] | null): Promise<void>;
  fetchVariant(): Promise<unknown>;
  getCopyProvider(): Promise<UI5ControlBase | null>;
  getCurrentVariantId(): Promise<string>;
  getCustomizeConfig(): Promise<unknown>;
  getCustomToolbar(): Promise<UI5ControlBase | null>;
  getDataStateIndicator(): Promise<UI5ControlBase | null>;
  getDeactivatedColumns(): Promise<readonly string[]>;
  getDemandPopin(): Promise<boolean>;
  getDetailsButtonSetting(): Promise<readonly string[]>;
  getEditable(): Promise<boolean>;
  getEditTogglable(): Promise<boolean>;
  getEnableAutoBinding(): Promise<boolean>;
  getEnableAutoColumnWidth(): Promise<boolean>;
  getEnableCopy(): Promise<boolean>;
  getEnableExport(): Promise<boolean>;
  getEnablePaste(): Promise<boolean>;
  getEntitySet(): Promise<string>;
  getExportType(): Promise<string>;
  getFilterControlConfiguration(): Promise<readonly UI5ControlBase[]>;
  getHeader(): Promise<string>;
  getHeaderLevel(): Promise<string>;
  getIgnoredFields(): Promise<string>;
  getIgnoreFromPersonalisation(): Promise<string>;
  getInitiallyVisibleFields(): Promise<string>;
  getInitialNoDataText(): Promise<string>;
  getNoData(): Promise<UI5ControlBase | null>;
  getPersistencyKey(): Promise<string>;
  getPlaceToolbarInTable(): Promise<boolean>;
  getRequestAtLeastFields(): Promise<string>;
  getSemanticKeyAdditionalControl(): Promise<UI5ControlBase | null>;
  getSemanticObjectController(): Promise<UI5ControlBase | null>;
  getShowDetailsButton(): Promise<boolean>;
  getShowFullScreenButton(): Promise<boolean>;
  getShowPasteButton(): Promise<boolean>;
  getShowRowCount(): Promise<boolean>;
  getShowTablePersonalisation(): Promise<boolean>;
  getShowVariantManagement(): Promise<boolean>;
  getSmartFilterId(): Promise<string>;
  getSmartVariant(): Promise<string | null>;
  getTable(): Promise<UI5ControlBase>;
  getTableBindingPath(): Promise<string>;
  getTableType(): Promise<string>;
  getToolbar(): Promise<UI5ControlBase>;
  getToolbarStyleClass(): Promise<string>;
  getUiState(): Promise<string>;
  getUseColumnLabelsAsTooltips(): Promise<boolean>;
  getUseDateRangeType(): Promise<boolean>;
  getUseInfoToolbar(): Promise<string>;
  getUseTablePersonalisation(): Promise<boolean>;
  getUseVariantManagement(): Promise<boolean>;
  isInitialised(): Promise<boolean>;
  openPersonalisationDialog(sPanel: string): Promise<void>;
  rebindTable(bForceRebind: boolean): Promise<void>;
  setCopyProvider(oCopyProvider: UI5ControlBase): Promise<void>;
  setCurrentVariantId(sVariantId: string): Promise<void>;
  setCustomizeConfig(oCustomizeConfig: unknown): Promise<void>;
  setCustomToolbar(oCustomToolbar: UI5ControlBase): Promise<void>;
  setDataStateIndicator(oDataStateIndicator: UI5ControlBase): Promise<void>;
  setDemandPopin(bDemandPopin: boolean): Promise<void>;
  setDetailsButtonSetting(sDetailsButtonSetting: readonly string[]): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEditTogglable(bEditTogglable: boolean): Promise<void>;
  setEnableAutoBinding(bEnableAutoBinding: boolean): Promise<void>;
  setEnableAutoColumnWidth(bEnableAutoColumnWidth: boolean): Promise<void>;
  setEnableCopy(bEnableCopy: boolean): Promise<void>;
  setEnableExport(bValue: boolean): Promise<void>;
  setEnablePaste(bValue: boolean): Promise<void>;
  setEntitySet(sEntitySetName: string): Promise<void>;
  setExportType(sExportType: string): Promise<void>;
  setHeader(sHeader: string): Promise<void>;
  setHeaderLevel(sLevel: string): Promise<void>;
  setHeaderStyle(sStyle: string): Promise<string>;
  setIgnoredFields(sIgnoredFields: string): Promise<void>;
  setIgnoreFromPersonalisation(sIgnoreFromPersonalisation: string): Promise<void>;
  setInitiallyVisibleFields(sInitiallyVisibleFields: string): Promise<void>;
  setInitialNoDataText(sInitialNoDataText: string): Promise<void>;
  setNoData(vNoData: UI5ControlBase | string): Promise<void>;
  setPersistencyKey(sPersistencyKey: string): Promise<void>;
  setPlaceToolbarInTable(bPlaceToolbarInTable: boolean): Promise<void>;
  setRequestAtLeastFields(sRequestAtLeastFields: string): Promise<void>;
  setSemanticKeyAdditionalControl(oSemanticKeyAdditionalControl: UI5ControlBase): Promise<void>;
  setSemanticObjectController(oSemanticObjectController: UI5ControlBase): Promise<void>;
  setShowDetailsButton(bShowDetailsButton: boolean): Promise<void>;
  setShowFullScreenButton(bShowFullScreenButton: boolean): Promise<void>;
  setShowPasteButton(bShowPasteButton: boolean): Promise<void>;
  setShowRowCount(bShowRowCount: boolean): Promise<void>;
  setShowTablePersonalisation(bShowTablePersonalisation: boolean): Promise<void>;
  setShowVariantManagement(bShowVariantManagement: boolean): Promise<void>;
  setSmartFilterId(sSmartFilterId: string): Promise<void>;
  setSmartVariant(oSmartVariant: string | UI5ControlBase): Promise<void>;
  setTableBindingPath(sTableBindingPath: string): Promise<void>;
  setTableType(sTableType: string): Promise<void>;
  setToolbarStyleClass(sToolbarStyleClass: string): Promise<void>;
  setUiState(oUIState: string): Promise<void>;
  setUseColumnLabelsAsTooltips(bUseColumnLabelsAsTooltips: boolean): Promise<void>;
  setUseDateRangeType(bUseDateRangeType: boolean): Promise<void>;
  setUseInfoToolbar(sUseInfoToolbar: string): Promise<void>;
  setUseTablePersonalisation(bUseTablePersonalisation: boolean): Promise<void>;
  setUseVariantManagement(bUseVariantManagement: boolean): Promise<void>;
  updateTableHeaderState(): Promise<void>;
}

/** sap.ui.comp.smartfield.SmartField */
export interface UI5SmartField extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartfield.SmartField';
  checkValuesValidity(oSettings?: unknown): Promise<unknown>;
  getClientSideMandatoryCheck(): Promise<boolean>;
  getConfiguration(): Promise<UI5ControlBase | null>;
  getContextEditable(): Promise<boolean>;
  getControlContext(): Promise<string>;
  getDataProperty(): Promise<unknown>;
  getDataType(): Promise<string>;
  getEditable(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getEntitySet(): Promise<string>;
  getFetchValueListReadOnly(): Promise<boolean>;
  getFixedValueListValidationEnabled(): Promise<boolean>;
  getFormFormattedValue(): Promise<unknown>;
  getFormValueProperty(): Promise<string>;
  getHistoryEnabled(): Promise<boolean>;
  getImportance(): Promise<string>;
  getMandatory(): Promise<boolean>;
  getMaxLength(): Promise<number>;
  getName(): Promise<string>;
  getPlaceholder(): Promise<string>;
  getSemanticObjectController(): Promise<UI5ControlBase | null>;
  getShowLabel(): Promise<boolean>;
  getShowSuggestion(): Promise<boolean>;
  getShowValueHelp(): Promise<boolean>;
  getShowValueStateMessage(): Promise<boolean>;
  getSuppressEmptyStringRequest(): Promise<boolean>;
  getTextAlign(): Promise<string>;
  getTextInEditModeSource(): Promise<string>;
  getTextLabel(): Promise<string>;
  getTooltipLabel(): Promise<string>;
  getUnitOfMeasure(): Promise<unknown>;
  getUomEditable(): Promise<boolean>;
  getUomEnabled(): Promise<boolean>;
  getUomVisible(): Promise<boolean>;
  getUrl(): Promise<string>;
  getValue(): Promise<unknown>;
  getValueHelpTitleSource(): Promise<string>;
  getValueState(): Promise<string>;
  getValueStateText(): Promise<string>;
  getWidth(): Promise<string>;
  getWrapping(): Promise<boolean>;
  setClientSideMandatoryCheck(bClientSideMandatoryCheck: boolean): Promise<void>;
  setConfiguration(oConfiguration: UI5ControlBase): Promise<void>;
  setContextEditable(bContextEditable: boolean): Promise<void>;
  setControlContext(sControlContext: string): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setEntitySet(sEntitySet: string): Promise<void>;
  setFetchValueListReadOnly(bFetchValueListReadOnly: boolean): Promise<void>;
  setFixedValueListValidationEnabled(bFixedValueListValidationEnabled: boolean): Promise<void>;
  setHistoryEnabled(bHistoryEnabled: boolean): Promise<void>;
  setImportance(sImportance: string): Promise<void>;
  setMandatory(bMandatory: boolean): Promise<void>;
  setMaxLength(iMaxLength: number): Promise<void>;
  setName(sName: string): Promise<void>;
  setPlaceholder(sPlaceholder: string): Promise<void>;
  setSemanticObjectController(oSemanticObjectController: UI5ControlBase): Promise<void>;
  setShowLabel(bShowLabel: boolean): Promise<void>;
  setShowSuggestion(bShowSuggestion: boolean): Promise<void>;
  setShowValueHelp(bShowValueHelp: boolean): Promise<void>;
  setShowValueStateMessage(bShowValueStateMessage: boolean): Promise<void>;
  setSuppressEmptyStringRequest(bSuppressEmptyStringRequest: boolean): Promise<void>;
  setTextAlign(sTextAlign: string): Promise<void>;
  setTextInEditModeSource(sTextInEditModeSource: string): Promise<void>;
  setTextLabel(sTextLabel: string): Promise<void>;
  setTooltipLabel(sTooltipLabel: string): Promise<void>;
  setUnitOfMeasure(sUnit: string): Promise<void>;
  setUomEditable(bUomEditable: boolean): Promise<void>;
  setUomEnabled(bUomEnabled: boolean): Promise<void>;
  setUomVisible(bUomVisible: boolean): Promise<void>;
  setUrl(sUrl: string): Promise<void>;
  setValue(oValue: unknown): Promise<void>;
  setValueHelpTitleSource(sValueHelpTitleSource: string): Promise<void>;
  setValueState(sValueState: string): Promise<void>;
  setValueStateText(sText: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setWrapping(bWrapping: boolean): Promise<void>;
}

/** sap.ui.comp.smartfilterbar.SmartFilterBar */
export interface UI5SmartFilterBar extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartfilterbar.SmartFilterBar';
  applyVariant(): Promise<void>;
  ensureLoadedValueHelp(sFieldName: string): Promise<void>;
  fetchVariant(): Promise<string>;
  getAnalyticBindingPath(): Promise<string>;
  getBasicSearchControl(): Promise<unknown>;
  getBasicSearchFieldName(): Promise<string>;
  getConsiderAnalyticalParameters(): Promise<boolean>;
  getConsiderPresentationVariant(): Promise<boolean>;
  getControlConfiguration(): Promise<readonly UI5ControlBase[]>;
  getEnableBasicSearch(): Promise<boolean>;
  getEntitySet(): Promise<string>;
  getFilterData(bAllFilterData?: boolean, bIgnoreErrorState?: boolean): Promise<unknown>;
  getFilterDataAsString(bAllFilterData: boolean): Promise<string | null>;
  getFilters(aFieldNames?: readonly string[]): Promise<readonly string[]>;
  getFiltersWithValues(): Promise<readonly string[]>;
  getGroupConfiguration(): Promise<readonly UI5ControlBase[]>;
  getLiveMode(): Promise<boolean>;
  getNavigationProperties(): Promise<string>;
  getParameterBindingPath(): Promise<string>;
  getParameters(): Promise<unknown>;
  getShowMessages(): Promise<boolean>;
  getSmartVariant(): Promise<string | null>;
  getSuppressSelection(): Promise<boolean>;
  getUseDateRangeType(): Promise<boolean>;
  getUseProvidedNavigationProperties(): Promise<boolean>;
  isPending(): Promise<boolean>;
  resumeSelection(): Promise<void>;
  search(bSync?: boolean): Promise<boolean>;
  setBasicSearchFieldName(sBasicSearchFieldName: string): Promise<void>;
  setConsiderAnalyticalParameters(bConsiderAnalyticalParameters: boolean): Promise<void>;
  setConsiderPresentationVariant(bConsiderPresentationVariant: boolean): Promise<void>;
  setEnableBasicSearch(bEnableBasicSearch: boolean): Promise<void>;
  setFilterData(bReplace: boolean): Promise<void>;
  setFilterDataAsString(sJson: string, bReplace: boolean): Promise<void>;
  setLiveMode(bLiveMode: boolean): Promise<void>;
  setNavigationProperties(sNavigationProperties: string): Promise<void>;
  setShowMessages(bShowMessages: boolean): Promise<void>;
  setSmartVariant(oSmartVariant: string): Promise<void>;
  setSuppressSelection(bSuppressSelection: boolean): Promise<void>;
  setUseDateRangeType(bUseDateRangeType: boolean): Promise<void>;
  setUseProvidedNavigationProperties(bUseProvidedNavigationProperties: boolean): Promise<void>;
  suspendSelection(): Promise<void>;
  validateMandatoryFields(): Promise<boolean>;
  verifySearchAllowed(): Promise<string>;
}

/** sap.ui.comp.smartform.SmartForm */
export interface UI5SmartForm extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartform.SmartForm';
  check(vSettings?: unknown): Promise<unknown>;
  getCheckButton(): Promise<boolean>;
  getCustomToolbar(): Promise<UI5ControlBase | null>;
  getEditable(): Promise<boolean>;
  getEditTogglable(): Promise<boolean>;
  getEntityType(): Promise<string>;
  getExpandable(): Promise<boolean>;
  getExpanded(): Promise<boolean>;
  getFlexEnabled(): Promise<boolean>;
  getGroups(): Promise<readonly UI5ControlBase[]>;
  getIgnoredFields(): Promise<string>;
  getImportance(): Promise<string>;
  getLayout(): Promise<UI5ControlBase | null>;
  getSemanticObjectController(): Promise<UI5ControlBase | null>;
  getSmartFields(
    bConsiderOnlyVisibleGroups?: boolean,
    bConsiderOnlyVisibleGroupElements?: boolean,
  ): Promise<readonly string[]>;
  getTitle(): Promise<string>;
  getValidationMode(): Promise<string>;
  getVisibleProperties(): Promise<readonly string[]>;
  propagateGridDataSpan(): Promise<void>;
  setCheckButton(bCheckButton: boolean): Promise<void>;
  setCustomToolbar(oCustomToolbar: UI5ControlBase): Promise<void>;
  setEditable(bEditable: boolean): Promise<void>;
  setEditTogglable(bEditTogglable: boolean): Promise<void>;
  setEntityType(sEntityType: string): Promise<void>;
  setExpandable(bExpandable: boolean): Promise<void>;
  setExpanded(bExpanded: boolean): Promise<void>;
  setFlexEnabled(bFlexEnabled: boolean): Promise<void>;
  setFocusOnEditableControl(): Promise<void>;
  setIgnoredFields(sIgnoredFields: string): Promise<void>;
  setImportance(sImportance: string): Promise<void>;
  setLayout(oLayout: UI5ControlBase): Promise<void>;
  setSemanticObjectController(oSemanticObjectController: UI5ControlBase): Promise<void>;
  setTitle(sTitle: string): Promise<void>;
  setValidationMode(sValidationMode: string): Promise<void>;
}

/** sap.ui.comp.smartform.Group */
export interface UI5SmartFormGroup extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartform.Group';
  getGroupElements(): Promise<readonly UI5ControlBase[]>;
  getTitle(): Promise<UI5ControlBase | string>;
  setTitle(vTitle: UI5ControlBase | string): Promise<void>;
}

/** sap.ui.comp.smartform.GroupElement */
export interface UI5SmartFormGroupElement extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartform.GroupElement';
  getElementForLabel(): Promise<number>;
  getElements(): Promise<readonly UI5ControlBase[]>;
  getFormElement(): Promise<UI5ControlBase>;
  getLabelText(): Promise<string>;
  getVisibleBasedOnElements(): Promise<boolean>;
  setElementForLabel(iElementForLabel: number): Promise<void>;
}

/** sap.ui.comp.valuehelpdialog.ValueHelpDialog */
export interface UI5ValueHelpDialog extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.valuehelpdialog.ValueHelpDialog';
  getBasicSearchText(): Promise<string>;
  getDescriptionKey(): Promise<string>;
  getDisplayFormat(): Promise<string>;
  getEnabledMultiSelectionPlugin(): Promise<boolean>;
  getFilterBar(): Promise<UI5ControlBase | null>;
  getFilterMode(): Promise<boolean>;
  getKey(): Promise<string>;
  getKeys(): Promise<readonly string[]>;
  getMaxConditions(): Promise<string>;
  getSupportMultiselect(): Promise<boolean>;
  getSupportRanges(): Promise<boolean>;
  getSupportRangesOnly(): Promise<boolean>;
  getTableAsync(): Promise<unknown>;
  getTokenDisplayBehaviour(): Promise<string>;
  setBasicSearchText(sBasicSearchText: string): Promise<void>;
  setDescriptionKey(sDescriptionKey: string): Promise<void>;
  setDisplayFormat(sDisplayFormat: string): Promise<void>;
  setEnabledMultiSelectionPlugin(bEnabledMultiSelectionPlugin: boolean): Promise<void>;
  setExcludeRangeOperations(aOperation: readonly string[], sType: string): Promise<void>;
  setFilterBar(oFilterBar: UI5ControlBase): Promise<void>;
  setFilterMode(bFilterMode: boolean): Promise<void>;
  setIncludeRangeOperations(aOperation: readonly string[], sType: string): Promise<void>;
  setKey(sKey: string): Promise<void>;
  setKeys(sKeys: readonly string[]): Promise<void>;
  setMaxConditions(sMaxConditions: string): Promise<void>;
  setRangeKeyFields(): Promise<void>;
  setSupportMultiselect(bSupportMultiselect: boolean): Promise<void>;
  setSupportRanges(bSupportRanges: boolean): Promise<void>;
  setSupportRangesOnly(bSupportRangesOnly: boolean): Promise<void>;
  setTable(oTable: string): Promise<void>;
  setTokenDisplayBehaviour(sTokenDisplayBehaviour: string): Promise<void>;
  setTokens(aTokens: readonly UI5ControlBase[]): Promise<void>;
  update(): Promise<void>;
}

/** sap.ui.comp.smartvariants.SmartVariantManagement */
export interface UI5SmartVariantManagement extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartvariants.SmartVariantManagement';
  clearVariantSelection(): Promise<void>;
  currentVariantSetModified(bFlag: boolean): Promise<void>;
  getCurrentVariantId(): Promise<string>;
  getEntitySet(): Promise<string>;
  getPersistencyKey(): Promise<string>;
  getPersonalizableControls(): Promise<readonly UI5ControlBase[]>;
  getStandardVariant(oCurrentControl: UI5ControlBase): Promise<unknown>;
  getVariantContent(oControl: UI5ControlBase, sKey: string): Promise<unknown>;
  initialise(oPersoControl: UI5ControlBase): Promise<void>;
  isPageVariant(): Promise<boolean>;
  setCurrentVariantId(sVariantId: string, bDoNotApplyVariant: boolean): Promise<void>;
  setEntitySet(sEntitySetName: string): Promise<void>;
  setPersistencyKey(sPersistencyKey: string): Promise<void>;
}

/** sap.ui.comp.filterbar.FilterBar */
export interface UI5FilterBar extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.filterbar.FilterBar';
  applyVariant(sContext: string, bInitial: boolean): Promise<void>;
  clearVariantSelection(): Promise<void>;
  determineControlByFilterItem(
    oFilterItem: string,
    bConsiderParameters: boolean,
  ): Promise<UI5ControlBase>;
  determineControlByName(sName: string, sGroupName?: string): Promise<UI5ControlBase>;
  determineFilterItemByName(sName: string, sGroupName: string): Promise<UI5ControlBase>;
  determineLabelByName(sName: string, sGroupName: string): Promise<string>;
  determineMandatoryFilterItems(): Promise<unknown>;
  fetchVariant(): Promise<string>;
  getAdvancedMode(): Promise<boolean>;
  getAllFilterItems(bConsiderOnlyVisibleFields: boolean): Promise<unknown>;
  getBasicSearch(): Promise<string | null>;
  getConsiderGroupTitle(): Promise<boolean>;
  getCurrentVariantId(): Promise<string>;
  getDeltaVariantMode(): Promise<boolean>;
  getDisableSearchMatchesPatternWarning(): Promise<boolean>;
  getFilterBarExpanded(): Promise<boolean>;
  getFilterContainerWidth(): Promise<string>;
  getFilterGroupItems(): Promise<readonly UI5ControlBase[]>;
  getHeader(): Promise<string>;
  getHeaderLevel(): Promise<string>;
  getInitializedPromise(): Promise<unknown>;
  getIsRunningInValueHelpDialog(): Promise<boolean>;
  getPersistencyKey(): Promise<string>;
  getShowAllFilters(): Promise<boolean>;
  getShowClearOnFB(): Promise<boolean>;
  getShowFilterConfiguration(): Promise<boolean>;
  getShowGoOnFB(): Promise<boolean>;
  getShowRestoreButton(): Promise<boolean>;
  getShowRestoreOnFB(): Promise<boolean>;
  getUiState(): Promise<string>;
  getUseSnapshot(): Promise<boolean>;
  getUseToolbar(): Promise<boolean>;
  getVariantManagement(): Promise<null | string>;
  isCurrentVariantExecuteOnSelectEnabled(): Promise<boolean>;
  isCurrentVariantStandard(): Promise<boolean>;
  registerApplyData(): Promise<void>;
  registerFetchData(): Promise<void>;
  registerGetFiltersWithValues(fCallBack: string): Promise<void>;
  retrieveFiltersWithValues(): Promise<unknown>;
  retrieveFiltersWithValuesAsText(): Promise<string>;
  retrieveFiltersWithValuesAsTextExpanded(): Promise<string>;
  search(): Promise<boolean>;
  setAdvancedMode(bAdvancedMode: boolean): Promise<void>;
  setBasicSearch(oBasicSearch: string): Promise<void>;
  setConsiderGroupTitle(bConsiderGroupTitle: boolean): Promise<void>;
  setContentHeight(fHeight: number): Promise<void>;
  setContentWidth(fWidth: number): Promise<void>;
  setCurrentVariantId(sVariantId: string, bDoNotApplyVariant: boolean): Promise<void>;
  setDeltaVariantMode(bDeltaVariantMode: boolean): Promise<void>;
  setDisableSearchMatchesPatternWarning(
    bDisableSearchMatchesPatternWarning: boolean,
  ): Promise<void>;
  setFilterBarExpanded(bFilterBarExpanded: boolean): Promise<void>;
  setFilterContainerWidth(sFilterContainerWidth: string): Promise<void>;
  setHeader(sHeader: string): Promise<void>;
  setHeaderLevel(sHeaderLevel: string): Promise<void>;
  setIsRunningInValueHelpDialog(bIsRunningInValueHelpDialog: boolean): Promise<void>;
  setPersistencyKey(sPersistencyKey: string): Promise<void>;
  setShowAllFilters(bShowAllFilters: boolean): Promise<void>;
  setShowClearOnFB(bShowClearOnFB: boolean): Promise<void>;
  setShowFilterConfiguration(bShowFilterConfiguration: boolean): Promise<void>;
  setShowGoOnFB(bShowGoOnFB: boolean): Promise<void>;
  setShowRestoreButton(bShowRestoreButton: boolean): Promise<void>;
  setShowRestoreOnFB(bShowRestoreOnFB: boolean): Promise<void>;
  setUiState(oUiState: string): Promise<void>;
  setUiStateAsVariant(oUiState: string, sContext: string): Promise<void>;
  setUseSnapshot(bUseSnapshot: boolean): Promise<void>;
  setUseToolbar(bUseToolbar: boolean): Promise<void>;
  showFilterDialog(): Promise<void>;
}

/** sap.ui.comp.navpopover.SmartLink */
export interface UI5SmartLink extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.navpopover.SmartLink';
  getAdditionalSemanticObjects(): Promise<readonly string[]>;
  getBeforeNavigationCallback(): Promise<unknown>;
  getContactAnnotationPath(): Promise<string>;
  getCreateControlCallback(): Promise<unknown>;
  getEnableAvailableActionsPersonalization(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getFieldName(): Promise<string>;
  getForceLinkRendering(): Promise<boolean>;
  getIgnoreLinkRendering(): Promise<boolean>;
  getInnerControl(): Promise<UI5ControlBase | null>;
  getInnerControlValue(): Promise<unknown>;
  getMapFieldToSemanticObject(): Promise<boolean>;
  getNavigationTargetsObtainedCallback(): Promise<unknown>;
  getSemanticObject(): Promise<string>;
  getSemanticObjectController(): Promise<unknown>;
  getUom(): Promise<string>;
  getWrapping(): Promise<boolean>;
  setAdditionalSemanticObjects(sAdditionalSemanticObjects: readonly string[]): Promise<void>;
  setBeforeNavigationCallback(fnBeforeNavigationCallback: unknown): Promise<void>;
  setContactAnnotationPath(sContactAnnotationPath: string): Promise<void>;
  setCreateControlCallback(fnCreateControlCallback: unknown): Promise<void>;
  setEnableAvailableActionsPersonalization(
    bEnableAvailableActionsPersonalization: boolean,
  ): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setFieldName(sFieldName: string): Promise<void>;
  setForceLinkRendering(bForceLinkRendering: boolean): Promise<void>;
  setIgnoreLinkRendering(bIgnoreLinkRendering: boolean): Promise<void>;
  setInnerControl(oInnerControl: UI5ControlBase): Promise<void>;
  setMapFieldToSemanticObject(bMapFieldToSemanticObject: boolean): Promise<void>;
  setNavigationTargetsObtainedCallback(fnNavigationTargetsObtainedCallback: unknown): Promise<void>;
  setSemanticObject(sSemanticObject: string): Promise<void>;
  setSemanticObjectController(oSemanticObjectController: unknown): Promise<void>;
  setUom(sUom: string): Promise<void>;
  setWrapping(bWrapping: boolean): Promise<void>;
}

/** sap.ui.comp.smartchart.SmartChart */
export interface UI5SmartChart extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartchart.SmartChart';
  applyVariant(oVariantJSON: string, sContext: string): Promise<void>;
  getActivateTimeSeries(): Promise<boolean>;
  getChartAsync(): Promise<unknown>;
  getChartBindingPath(): Promise<string>;
  getChartType(): Promise<string>;
  getCurrentVariantId(): Promise<string>;
  getEnableAutoBinding(): Promise<boolean>;
  getEntitySet(): Promise<string>;
  getHeader(): Promise<string>;
  getHeaderLevel(): Promise<string>;
  getHeaderStyle(): Promise<string>;
  getIgnoredChartTypes(): Promise<string>;
  getIgnoredFields(): Promise<string>;
  getIgnoreFromPersonalisation(): Promise<string>;
  getLegendVisible(): Promise<boolean>;
  getNoData(): Promise<string>;
  getNotAssignedText(): Promise<string>;
  getPersistencyKey(): Promise<string>;
  getRequestAtLeastFields(): Promise<string>;
  getSelectionDetailsActionGroups(): Promise<readonly UI5ControlBase[]>;
  getSelectionDetailsActions(): Promise<readonly UI5ControlBase[]>;
  getSelectionDetailsItemActions(): Promise<readonly UI5ControlBase[]>;
  getSelectionMode(): Promise<string>;
  getSemanticObjectController(): Promise<UI5ControlBase | null>;
  getShowChartTooltip(): Promise<boolean>;
  getShowChartTypeSelectionButton(): Promise<boolean>;
  getShowDetailsButton(): Promise<boolean>;
  getShowDimensionsTitle(): Promise<boolean>;
  getShowDownloadButton(): Promise<boolean>;
  getShowDrillBreadcrumbs(): Promise<boolean>;
  getShowDrillButtons(): Promise<boolean>;
  getShowFullScreenButton(): Promise<boolean>;
  getShowLegendButton(): Promise<boolean>;
  getShowMeasuresTitle(): Promise<boolean>;
  getShowSemanticNavigationButton(): Promise<boolean>;
  getShowToolbar(): Promise<boolean>;
  getShowVariantManagement(): Promise<boolean>;
  getShowZoomButtons(): Promise<boolean>;
  getSmartFilterId(): Promise<string>;
  getSmartVariant(): Promise<string | null>;
  getToolbar(): Promise<UI5ControlBase | null>;
  getToolbarStyle(): Promise<string>;
  getUiState(): Promise<string>;
  getUseChartPersonalisation(): Promise<boolean>;
  getUseTooltip(): Promise<boolean>;
  getUseVariantManagement(): Promise<boolean>;
  setActivateTimeSeries(bActivateTimeSeries: boolean): Promise<void>;
  setChartBindingPath(sChartBindingPath: string): Promise<void>;
  setChartType(sChartType: string): Promise<void>;
  setCurrentVariantId(sVariantId: string): Promise<void>;
  setEnableAutoBinding(bEnableAutoBinding: boolean): Promise<void>;
  setEntitySet(sEntitySetName: string): Promise<void>;
  setHeader(sHeader: string): Promise<void>;
  setHeaderLevel(sHeaderLevel: string): Promise<void>;
  setHeaderStyle(sHeaderStyle: string): Promise<void>;
  setIgnoredChartTypes(sIgnoredChartTypes: string): Promise<void>;
  setIgnoredFields(sIgnoredFields: string): Promise<void>;
  setIgnoreFromPersonalisation(sIgnoreFromPersonalisation: string): Promise<void>;
  setNoData(sNoData: string): Promise<void>;
  setNotAssignedText(sNotAssignedText: string): Promise<void>;
  setPersistencyKey(sPersistencyKey: string): Promise<void>;
  setRequestAtLeastFields(sRequestAtLeastFields: string): Promise<void>;
  setSemanticObjectController(oSemanticObjectController: UI5ControlBase): Promise<void>;
  setShowChartTooltip(bShowChartTooltip: boolean): Promise<void>;
  setShowChartTypeSelectionButton(bShowChartTypeSelectionButton: boolean): Promise<void>;
  setShowDetailsButton(bShowDetailsButton: boolean): Promise<void>;
  setShowDownloadButton(bShowDownloadButton: boolean): Promise<void>;
  setShowDrillBreadcrumbs(bShowDrillBreadcrumbs: boolean): Promise<void>;
  setShowToolbar(bShowToolbar: boolean): Promise<void>;
  setShowVariantManagement(bShowVariantManagement: boolean): Promise<void>;
  setSmartFilterId(sSmartFilterId: string): Promise<void>;
  setSmartVariant(oSmartVariant: string | UI5ControlBase): Promise<void>;
  setToolbarStyle(sStyle: string): Promise<void>;
  setUiState(oUiState: string): Promise<void>;
  setUseChartPersonalisation(bUseChartPersonalisation: boolean): Promise<void>;
  setUseTooltip(bUseTooltip: boolean): Promise<void>;
  setUseVariantManagement(bUseVariantManagement: boolean): Promise<void>;
}

/** sap.ui.comp.smartmultiinput.SmartMultiInput */
export interface UI5SmartMultiInput extends UI5ControlBase {
  readonly controlType: 'sap.ui.comp.smartmultiinput.SmartMultiInput';
  checkClientError(): Promise<boolean>;
  getEnableODataSelect(): Promise<boolean>;
  getFilter(): Promise<string>;
  getInitialTokens(): Promise<readonly UI5ControlBase[]>;
  getRangeData(): Promise<unknown>;
  getRequestAtLeastFields(): Promise<string>;
  getSingleTokenMode(): Promise<boolean>;
  getSupportMultiSelect(): Promise<boolean>;
  getSupportRanges(): Promise<boolean>;
  getTokens(): Promise<readonly UI5ControlBase[]>;
  getValue(): Promise<readonly UI5ControlBase[]>;
  setEnableODataSelect(bEnableODataSelect: boolean): Promise<void>;
  setRangeData(): Promise<void>;
  setRequestAtLeastFields(sRequestAtLeastFields: string): Promise<void>;
  setSingleTokenMode(bSingleTokenMode: boolean): Promise<void>;
  setSupportMultiSelect(bSupportMultiSelect: boolean): Promise<void>;
  setSupportRanges(bSupportRanges: boolean): Promise<void>;
  setTextSeparator(sTextSeparator: string): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.ui.mdc
// ═══════════════════════════════════════════════════════════════════════

/** sap.ui.mdc.Table */
export interface UI5MdcTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.mdc.Table';
  clearSelection(): Promise<void>;
  focusRow(iIndex: number, bFirstInteractiveElement?: boolean): Promise<unknown>;
  getActions(): Promise<readonly UI5ControlBase[]>;
  getAutoBindOnInit(): Promise<boolean>;
  getCellSelector(): Promise<UI5ControlBase | null>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getContextMenu(): Promise<UI5ControlBase | null>;
  getCopyProvider(): Promise<UI5ControlBase | null>;
  getDataStateIndicator(): Promise<UI5ControlBase | null>;
  getDelegate(): Promise<unknown>;
  getEnableAutoColumnWidth(): Promise<boolean>;
  getEnableColumnResize(): Promise<boolean>;
  getEnableExport(): Promise<boolean>;
  getEnablePaste(): Promise<boolean>;
  getFilter(): Promise<string | null>;
  getHeader(): Promise<string>;
  getHeaderLevel(): Promise<string>;
  getHeaderVisible(): Promise<boolean>;
  getHideToolbar(): Promise<boolean>;
  getMultiSelectMode(): Promise<string>;
  getNoData(): Promise<UI5ControlBase | null>;
  getP13nMode(): Promise<readonly string[]>;
  getQuickFilter(): Promise<UI5ControlBase | null>;
  getRowSettings(): Promise<UI5ControlBase | null>;
  getSelectedContexts(): Promise<readonly string[]>;
  getSelectionMode(): Promise<string>;
  getShowPasteButton(): Promise<boolean>;
  getShowRowCount(): Promise<boolean>;
  getThreshold(): Promise<number>;
  getType(): Promise<UI5ControlBase | null>;
  getUseColumnLabelsAsTooltips(): Promise<boolean>;
  getVariant(): Promise<UI5ControlBase | null>;
  getWidth(): Promise<string>;
  initialized(): Promise<unknown>;
  isTableBound(): Promise<boolean>;
  rebind(): Promise<unknown>;
  scrollToIndex(iIndex: number): Promise<unknown>;
  setAutoBindOnInit(bAutoBindOnInit: boolean): Promise<void>;
  setCellSelector(oCellSelector: UI5ControlBase): Promise<void>;
  setContextMenu(oContextMenu: UI5ControlBase): Promise<void>;
  setCopyProvider(oCopyProvider: UI5ControlBase): Promise<void>;
  setDataStateIndicator(oDataStateIndicator: UI5ControlBase): Promise<void>;
  setDelegate(oDelegate: unknown): Promise<void>;
  setEnableAutoColumnWidth(bEnableAutoColumnWidth: boolean): Promise<void>;
  setEnableColumnResize(bEnableColumnResize: boolean): Promise<void>;
  setEnableExport(bEnableExport: boolean): Promise<void>;
  setEnablePaste(bEnablePaste: boolean): Promise<void>;
  setFilter(oFilter: string): Promise<void>;
  setHeader(sHeader: string): Promise<void>;
  setHeaderLevel(sHeaderLevel: string): Promise<void>;
  setHeaderVisible(bHeaderVisible: boolean): Promise<void>;
  setHideToolbar(bHideToolbar: boolean): Promise<void>;
  setMultiSelectMode(sMultiSelectMode: string): Promise<void>;
  setNoData(vNoData: UI5ControlBase | string): Promise<void>;
  setP13nMode(sP13nMode: readonly string[]): Promise<void>;
  setQuickFilter(oQuickFilter: UI5ControlBase): Promise<void>;
  setRowSettings(oRowSettings: UI5ControlBase): Promise<void>;
  setSelectionMode(sSelectionMode: string): Promise<void>;
  setShowPasteButton(bShowPasteButton: boolean): Promise<void>;
  setShowRowCount(bShowRowCount: boolean): Promise<void>;
  setThreshold(iThreshold: number): Promise<void>;
  setType(vType: UI5ControlBase | string): Promise<void>;
  setUseColumnLabelsAsTooltips(bUseColumnLabelsAsTooltips: boolean): Promise<void>;
  setVariant(oVariant: UI5ControlBase): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.mdc.FilterBar */
export interface UI5MdcFilterBar extends UI5ControlBase {
  readonly controlType: 'sap.ui.mdc.FilterBar';
  getCurrentState(): Promise<string>;
  getP13nMode(): Promise<readonly string[]>;
  getShowAdaptFiltersButton(): Promise<boolean>;
  getShowClearButton(): Promise<boolean>;
  setP13nMode(sP13nMode: readonly string[]): Promise<void>;
  setShowAdaptFiltersButton(bShowAdaptFiltersButton: boolean): Promise<void>;
  setShowClearButton(bShowClearButton: boolean): Promise<void>;
}

/** sap.ui.mdc.Field */
export interface UI5MdcField extends UI5ControlBase {
  readonly controlType: 'sap.ui.mdc.Field';
  getAdditionalValue(): Promise<unknown>;
  getValue(): Promise<unknown>;
  setAdditionalValue(oAdditionalValue: unknown): Promise<void>;
  setValue(oValue: unknown): Promise<void>;
}

/** sap.ui.mdc.ValueHelp */
export interface UI5MdcValueHelp extends UI5ControlBase {
  readonly controlType: 'sap.ui.mdc.ValueHelp';
  getDelegate(): Promise<unknown>;
  getDialog(): Promise<UI5ControlBase | null>;
  getTypeahead(): Promise<UI5ControlBase | null>;
  getValidateInput(): Promise<boolean>;
  setDelegate(oDelegate: unknown): Promise<void>;
  setDialog(oDialog: UI5ControlBase): Promise<void>;
  setTypeahead(oTypeahead: UI5ControlBase): Promise<void>;
  setValidateInput(bValidateInput: boolean): Promise<void>;
}

/** sap.ui.mdc.Chart */
export interface UI5MdcChart extends UI5ControlBase {
  readonly controlType: 'sap.ui.mdc.Chart';
  getActions(): Promise<readonly UI5ControlBase[]>;
  getAutoBindOnInit(): Promise<boolean>;
  getChartType(): Promise<string>;
  getConditions(): Promise<unknown>;
  getDelegate(): Promise<unknown>;
  getFilter(): Promise<string | null>;
  getHeader(): Promise<string>;
  getHeaderLevel(): Promise<string>;
  getHeaderStyle(): Promise<string>;
  getHeaderVisible(): Promise<boolean>;
  getHeight(): Promise<string>;
  getIgnoreToolbarActions(): Promise<readonly string[]>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getLegendVisible(): Promise<boolean>;
  getMinHeight(): Promise<string>;
  getMinWidth(): Promise<string>;
  getNoData(): Promise<UI5ControlBase | null>;
  getNoDataText(): Promise<string>;
  getP13nMode(): Promise<readonly string[]>;
  getSelectionDetailsActions(): Promise<UI5ControlBase | null>;
  getShowChartTooltip(): Promise<boolean>;
  getShowSelectionDetails(): Promise<boolean>;
  getWidth(): Promise<string>;
  rebind(): Promise<unknown>;
  setAutoBindOnInit(bAutoBindOnInit: boolean): Promise<void>;
  setDelegate(oDelegate: unknown): Promise<void>;
  setFilter(oFilter: string): Promise<void>;
  setHeader(sHeader: string): Promise<void>;
  setHeaderLevel(sHeaderLevel: string): Promise<void>;
  setHeaderStyle(sHeaderStyle: string): Promise<void>;
  setHeaderVisible(bHeaderVisible: boolean): Promise<void>;
  setHeight(sHeight: string): Promise<void>;
  setIgnoreToolbarActions(sIgnoreToolbarActions: readonly string[]): Promise<void>;
  setLegendVisible(bLegendVisible: boolean): Promise<void>;
  setMinHeight(sMinHeight: string): Promise<void>;
  setMinWidth(sMinWidth: string): Promise<void>;
  setNoData(oNoData: UI5ControlBase): Promise<void>;
  setP13nMode(sP13nMode: readonly string[]): Promise<void>;
  setSelectionDetailsActions(oSelectionDetailsActions: UI5ControlBase): Promise<void>;
  setShowChartTooltip(bShowChartTooltip: boolean): Promise<void>;
  setShowSelectionDetails(bShowSelectionDetails: boolean): Promise<void>;
  setVariant(oVariant: UI5ControlBase): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.mdc.MultiValueField */
export interface UI5MdcMultiValueField extends UI5ControlBase {
  readonly controlType: 'sap.ui.mdc.MultiValueField';
  getDelegate(): Promise<unknown>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  setDelegate(oDelegate: unknown): Promise<void>;
}

/** sap.ui.mdc.FilterField */
export interface UI5MdcFilterField extends UI5ControlBase {
  readonly controlType: 'sap.ui.mdc.FilterField';
  getAdditionalDataType(): Promise<unknown>;
  getDefaultOperator(): Promise<string>;
  getOperators(): Promise<readonly string[]>;
  getPropertyKey(): Promise<string>;
  setAdditionalDataType(oAdditionalDataType: unknown): Promise<void>;
  setDefaultOperator(sDefaultOperator: string): Promise<void>;
  setOperators(sOperators: readonly string[]): Promise<void>;
  setPropertyKey(sPropertyKey: string): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.tnt
// ═══════════════════════════════════════════════════════════════════════

/** sap.tnt.SideNavigation */
export interface UI5SideNavigation extends UI5ControlBase {
  readonly controlType: 'sap.tnt.SideNavigation';
  getAriaLabel(): Promise<string>;
  getDesign(): Promise<string>;
  getExpanded(): Promise<boolean>;
  getFixedItem(): Promise<UI5ControlBase | null>;
  getItem(): Promise<UI5ControlBase | null>;
  getSelectedItem(): Promise<string | null>;
  getSelectedKey(): Promise<string>;
  getWidth(): Promise<string>;
  setAriaLabel(sAriaLabel: string): Promise<void>;
  setDesign(sDesign: string): Promise<void>;
  setExpanded(bExpanded: boolean): Promise<void>;
  setFixedItem(oFixedItem: UI5ControlBase): Promise<void>;
  setItem(oItem: UI5ControlBase): Promise<void>;
  setSelectedItem(vSelectedItem: string): Promise<string | null>;
  setSelectedKey(sSelectedKey: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.tnt.NavigationListItem */
export interface UI5NavigationListItem extends UI5ControlBase {
  readonly controlType: 'sap.tnt.NavigationListItem';
  getDesign(): Promise<string>;
  getHref(): Promise<string>;
  getIcon(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelectable(): Promise<boolean>;
  getTarget(): Promise<string>;
  setDesign(sDesign: string): Promise<void>;
  setHref(sHref: string): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setSelectable(bSelectable: boolean): Promise<void>;
  setTarget(sTarget: string): Promise<void>;
}

/** sap.tnt.ToolPage */
export interface UI5ToolPage extends UI5ControlBase {
  readonly controlType: 'sap.tnt.ToolPage';
  getContentBackgroundDesign(): Promise<string>;
  getHeader(): Promise<UI5ControlBase | null>;
  getMainContents(): Promise<readonly UI5ControlBase[]>;
  getSideContent(): Promise<UI5ControlBase | null>;
  getSideExpanded(): Promise<boolean>;
  getSubHeader(): Promise<UI5ControlBase | null>;
  setContentBackgroundDesign(sContentBackgroundDesign: string): Promise<void>;
  setHeader(oHeader: UI5ControlBase): Promise<void>;
  setSideContent(oSideContent: UI5ControlBase): Promise<void>;
  setSideExpanded(bSideExpanded: boolean): Promise<void>;
  setSubHeader(oSubHeader: UI5ControlBase): Promise<void>;
  toggleSideContentMode(): Promise<void>;
}

/** sap.tnt.ToolHeader */
export interface UI5ToolHeader extends UI5ControlBase {
  readonly controlType: 'sap.tnt.ToolHeader';
}

/** sap.tnt.NavigationList */
export interface UI5NavigationList extends UI5ControlBase {
  readonly controlType: 'sap.tnt.NavigationList';
  getExpanded(): Promise<boolean>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedItem(): Promise<UI5ControlBase | null>;
  getSelectedKey(): Promise<string>;
  getWidth(): Promise<string>;
  setExpanded(bExpanded: boolean): Promise<void>;
  setSelectedItem(oItem: string | UI5ControlBase): Promise<UI5ControlBase | null>;
  setSelectedKey(sSelectedKey: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.tnt.InfoLabel */
export interface UI5InfoLabel extends UI5ControlBase {
  readonly controlType: 'sap.tnt.InfoLabel';
  getColorScheme(): Promise<number>;
  getDisplayOnly(): Promise<boolean>;
  getIcon(): Promise<string>;
  getRenderMode(): Promise<string>;
  getText(): Promise<string>;
  getWidth(): Promise<string>;
  setColorScheme(iColorScheme: number): Promise<void>;
  setDisplayOnly(bDisplayOnly: boolean): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setRenderMode(sRenderMode: string): Promise<void>;
  setText(sText: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.ui.unified
// ═══════════════════════════════════════════════════════════════════════

/** sap.ui.unified.Calendar */
export interface UI5Calendar extends UI5ControlBase {
  readonly controlType: 'sap.ui.unified.Calendar';
  displayDate(): Promise<void>;
  focusDate(): Promise<void>;
  getCalendarWeekNumbering(): Promise<unknown>;
  getDisabledDates(): Promise<readonly UI5ControlBase[]>;
  getFirstDayOfWeek(): Promise<number>;
  getInitialFocusedDate(): Promise<unknown>;
  getIntervalSelection(): Promise<boolean>;
  getLegend(): Promise<string | null>;
  getMaxDate(): Promise<unknown>;
  getMinDate(): Promise<unknown>;
  getMonths(): Promise<number>;
  getNonWorkingDays(): Promise<readonly number[]>;
  getPrimaryCalendarType(): Promise<unknown>;
  getSecondaryCalendarType(): Promise<unknown>;
  getSelectedDates(): Promise<readonly UI5ControlBase[]>;
  getShowCurrentDateButton(): Promise<boolean>;
  getShowWeekNumbers(): Promise<boolean>;
  getSingleSelection(): Promise<boolean>;
  getStartDate(): Promise<unknown>;
  getWidth(): Promise<string>;
  setCalendarWeekNumbering(sCalendarWeekNumbering: unknown): Promise<void>;
  setFirstDayOfWeek(iFirstDayOfWeek: number): Promise<void>;
  setInitialFocusedDate(oInitialFocusedDate: unknown): Promise<void>;
  setIntervalSelection(bEnabled: boolean): Promise<void>;
  setLegend(oLegend: string): Promise<void>;
  setMaxDate(oDate: unknown): Promise<void>;
  setMinDate(oDate: unknown): Promise<void>;
  setMonths(iMonths: number): Promise<void>;
  setNonWorkingDays(sNonWorkingDays: readonly number[]): Promise<void>;
  setPrimaryCalendarType(sPrimaryCalendarType: unknown): Promise<void>;
  setSecondaryCalendarType(sSecondaryCalendarType: unknown): Promise<void>;
  setShowCurrentDateButton(bShow: boolean): Promise<void>;
  setShowWeekNumbers(bShowWeekNumbers: boolean): Promise<void>;
  setSingleSelection(bEnabled: boolean): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
}

/** sap.ui.unified.FileUploader */
export interface UI5FileUploader extends UI5ControlBase {
  readonly controlType: 'sap.ui.unified.FileUploader';
  abort(sHeaderParameterName: string, sHeaderParameterValue: string): Promise<void>;
  checkFileReadable(): Promise<unknown>;
  clear(): Promise<void>;
  getAdditionalData(): Promise<string>;
  getButtonOnly(): Promise<boolean>;
  getButtonText(): Promise<string>;
  getDirectory(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  getFileType(): Promise<readonly string[]>;
  getHeaderParameters(): Promise<readonly UI5ControlBase[]>;
  getHttpRequestMethod(): Promise<string>;
  getIcon(): Promise<string>;
  getIconFirst(): Promise<boolean>;
  getIconHovered(): Promise<string>;
  getIconOnly(): Promise<boolean>;
  getIconSelected(): Promise<string>;
  getMaximumFilenameLength(): Promise<number>;
  getMaximumFileSize(): Promise<number>;
  getMimeType(): Promise<readonly string[]>;
  getMultiple(): Promise<boolean>;
  getName(): Promise<string>;
  getParameters(): Promise<readonly UI5ControlBase[]>;
  getPlaceholder(): Promise<string>;
  getProcessedBlobsFromArray(aBlobs: readonly unknown[]): Promise<unknown>;
  getSameFilenameAllowed(): Promise<boolean>;
  getSendXHR(): Promise<boolean>;
  getStyle(): Promise<string>;
  getUploadOnChange(): Promise<boolean>;
  getUploadUrl(): Promise<string>;
  getUseMultipart(): Promise<boolean>;
  getValue(): Promise<string>;
  getValueState(): Promise<string>;
  getValueStateText(): Promise<string>;
  getWidth(): Promise<string>;
  getXhrSettings(): Promise<UI5ControlBase | null>;
  setAdditionalData(sAdditionalData: string): Promise<void>;
  setButtonOnly(bButtonOnly: boolean): Promise<void>;
  setButtonText(sButtonText: string): Promise<void>;
  setDirectory(bDirectory: boolean): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setFileType(sFileType: readonly string[]): Promise<void>;
  setHttpRequestMethod(sHttpRequestMethod: string): Promise<void>;
  setIcon(sIcon: string): Promise<void>;
  setIconFirst(bIconFirst: boolean): Promise<void>;
  setIconHovered(sIconHovered: string): Promise<void>;
  setIconOnly(bIconOnly: boolean): Promise<void>;
  setIconSelected(sIconSelected: string): Promise<void>;
  setMaximumFilenameLength(iMaximumFilenameLength: number): Promise<void>;
  setMaximumFileSize(fMaximumFileSize: number): Promise<void>;
  setMimeType(sMimeType: readonly string[]): Promise<void>;
  setMultiple(bMultiple: boolean): Promise<void>;
  setName(sName: string): Promise<void>;
  setPlaceholder(sPlaceholder: string): Promise<void>;
  setSameFilenameAllowed(bSameFilenameAllowed: boolean): Promise<void>;
  setSendXHR(bSendXHR: boolean): Promise<void>;
  setStyle(sStyle: string): Promise<void>;
  setUploadOnChange(bUploadOnChange: boolean): Promise<void>;
  setUploadUrl(sUploadUrl: string): Promise<void>;
  setUseMultipart(bUseMultipart: boolean): Promise<void>;
  setValue(sValue: string): Promise<void>;
  setValueState(sValueState: string): Promise<void>;
  setValueStateText(sValueStateText: string): Promise<void>;
  setWidth(sWidth: string): Promise<void>;
  setXhrSettings(oXhrSettings: UI5ControlBase): Promise<void>;
  upload(bPreProcessFiles?: boolean): Promise<void>;
}

/** sap.ui.unified.ShellHeadItem */
export interface UI5ShellHeadItem extends UI5ControlBase {
  readonly controlType: 'sap.ui.unified.ShellHeadItem';
  getIcon(): Promise<string>;
  getSelected(): Promise<boolean>;
  getShowSeparator(): Promise<boolean>;
  getToggleEnabled(): Promise<boolean>;
  setIcon(sIcon: string): Promise<void>;
  setSelected(bSelected: boolean): Promise<void>;
  setShowSeparator(bShowSeparator: boolean): Promise<void>;
  setToggleEnabled(bToggleEnabled: boolean): Promise<void>;
}

/** sap.ui.unified.Menu */
export interface UI5UnifiedMenu extends UI5ControlBase {
  readonly controlType: 'sap.ui.unified.Menu';
  getEnabled(): Promise<boolean>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMaxVisibleItems(): Promise<number>;
  getPageSize(): Promise<number>;
  getSelectedItems(): Promise<unknown>;
  open(
    bWithKeyboard: boolean,
    oOpenerRef: UI5ControlBase | Element,
    my: string,
    at: string,
    of: UI5ControlBase | Element,
    offset?: string,
    collision?: string,
  ): Promise<void>;
  openAsContextMenu(oOpenerRef: UI5ControlBase | HTMLElement): Promise<void>;
  setEnabled(bEnabled: boolean): Promise<void>;
  setMaxVisibleItems(iMaxVisibleItems: number): Promise<void>;
  setPageSize(iPageSize: number): Promise<void>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.ui.unified.MenuItem */
export interface UI5UnifiedMenuItem extends UI5ControlBase {
  readonly controlType: 'sap.ui.unified.MenuItem';
  getEndContent(): Promise<readonly UI5ControlBase[]>;
  getIcon(): Promise<string>;
  getSelected(): Promise<boolean>;
  getShortcutText(): Promise<string>;
  getText(): Promise<string>;
  setIcon(sIcon: string): Promise<void>;
  setSelected(bState: boolean): Promise<void>;
  setShortcutText(sShortcutText: string): Promise<void>;
  setText(sText: string): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// Discriminated Union — Control Type Map
// ═══════════════════════════════════════════════════════════════════════

/**
 * Discriminated union of all known UI5 control interfaces.
 *
 * @remarks
 * Used by the proxy layer to narrow control types based on `controlType`.
 *
 * @example
 * ```typescript
 * import type { UI5Control } from '#core/types/controls.js';
 *
 * function handleControl(control: UI5Control): void {
 *   switch (control.controlType) {
 *     case 'sap.m.Button': control.press(); break;
 *     case 'sap.m.Input': control.setValue(''); break;
 *   }
 * }
 * ```
 */
export type UI5Control =
  | UI5Button
  | UI5Input
  | UI5CheckBox
  | UI5RadioButton
  | UI5ComboBox
  | UI5MultiComboBox
  | UI5Select
  | UI5TextArea
  | UI5DatePicker
  | UI5DateTimePicker
  | UI5SearchField
  | UI5MultiInput
  | UI5Switch
  | UI5StepInput
  | UI5SegmentedButton
  | UI5Slider
  | UI5ToggleButton
  | UI5MenuButton
  | UI5SplitButton
  | UI5TimePicker
  | UI5RangeSlider
  | UI5Token
  | UI5MaskInput
  | UI5UploadSet
  | UI5RadioButtonGroup
  | UI5Text
  | UI5Label
  | UI5Title
  | UI5Link
  | UI5Image
  | UI5FormattedText
  | UI5Avatar
  | UI5ObjectStatus
  | UI5ObjectNumber
  | UI5ProgressIndicator
  | UI5RatingIndicator
  | UI5BusyIndicator
  | UI5MessageStrip
  | UI5GenericTile
  | UI5NumericContent
  | UI5FeedListItem
  | UI5ObjectIdentifier
  | UI5ObjectAttribute
  | UI5List
  | UI5Table
  | UI5ColumnListItem
  | UI5StandardListItem
  | UI5ObjectListItem
  | UI5Tree
  | UI5SelectList
  | UI5ListBase
  | UI5Dialog
  | UI5Popover
  | UI5ResponsivePopover
  | UI5MessagePopover
  | UI5ActionSheet
  | UI5ViewSettingsDialog
  | UI5IconTabBar
  | UI5IconTabFilter
  | UI5TabContainer
  | UI5Breadcrumbs
  | UI5OverflowToolbar
  | UI5Toolbar
  | UI5Bar
  | UI5Wizard
  | UI5WizardStep
  | UI5Menu
  | UI5MenuItem
  | UI5Page
  | UI5Panel
  | UI5ScrollContainer
  | UI5FlexBox
  | UI5HBox
  | UI5VBox
  | UI5Carousel
  | UI5SplitContainer
  | UI5DateRangeSelection
  | UI5NotificationListItem
  | UI5PlanningCalendar
  | UI5SinglePlanningCalendar
  | UI5MessageItem
  | UI5MessageView
  | UI5NavContainer
  | UI5SplitApp
  | UI5Shell
  | UI5App
  | UI5Column
  | UI5StandardTreeItem
  | UI5CustomListItem
  | UI5GroupHeaderListItem
  | UI5InputListItem
  | UI5DisplayListItem
  | UI5ActionListItem
  | UI5Tokenizer
  | UI5SelectDialog
  | UI5TableSelectDialog
  | UI5BusyDialog
  | UI5UploadCollection
  | UI5ObjectHeader
  | UI5ObjectMarker
  | UI5DraftIndicator
  | UI5HeaderContainer
  | UI5IconTabSeparator
  | UI5TabContainerItem
  | UI5FacetFilter
  | UI5FacetFilterList
  | UI5PDFViewer
  | UI5ColorPalettePopover
  | UI5SlideTile
  | UI5LightBox
  | UI5VariantManagement
  | UI5ColorPalette
  | UI5DynamicDateRange
  | UI5FeedInput
  | UI5ExpandableText
  | UI5QuickView
  | UI5QuickViewCard
  | UI5QuickViewPage
  | UI5IllustratedMessage
  | UI5ToolbarSpacer
  | UI5ToolbarSeparator
  | UI5TileContent
  | UI5NotificationListGroup
  | UI5SelectionDetails
  | UI5IconTabHeader
  | UI5P13nPopup
  | UI5P13nSelectionPanel
  | UI5P13nSortPanel
  | UI5P13nGroupPanel
  | UI5ColumnMenu
  | UI5GridTable
  | UI5TreeTable
  | UI5AnalyticalTable
  | UI5TableColumn
  | UI5TableRow
  | UI5DynamicPage
  | UI5DynamicPageTitle
  | UI5DynamicPageHeader
  | UI5FlexibleColumnLayout
  | UI5FCard
  | UI5FAvatar
  | UI5GridContainer
  | UI5ShellBar
  | UI5ProductSwitch
  | UI5FSemanticPage
  | UI5ObjectPageLayout
  | UI5ObjectPageSection
  | UI5ObjectPageSubSection
  | UI5ObjectPageHeader
  | UI5ObjectPageDynamicHeaderTitle
  | UI5AnchorBar
  | UI5SimpleForm
  | UI5Grid
  | UI5Splitter
  | UI5ResponsiveSplitter
  | UI5Form
  | UI5FormContainer
  | UI5FormElement
  | UI5VerticalLayout
  | UI5HorizontalLayout
  | UI5BlockLayout
  | UI5BlockLayoutRow
  | UI5BlockLayoutCell
  | UI5DynamicSideContent
  | UI5Icon
  | UI5Item
  | UI5ListItem
  | UI5HTML
  | UI5ComponentContainer
  | UI5SmartTable
  | UI5SmartField
  | UI5SmartFilterBar
  | UI5SmartForm
  | UI5SmartFormGroup
  | UI5SmartFormGroupElement
  | UI5ValueHelpDialog
  | UI5SmartVariantManagement
  | UI5FilterBar
  | UI5SmartLink
  | UI5SmartChart
  | UI5SmartMultiInput
  | UI5MdcTable
  | UI5MdcFilterBar
  | UI5MdcField
  | UI5MdcValueHelp
  | UI5MdcChart
  | UI5MdcMultiValueField
  | UI5MdcFilterField
  | UI5SideNavigation
  | UI5NavigationListItem
  | UI5ToolPage
  | UI5ToolHeader
  | UI5NavigationList
  | UI5InfoLabel
  | UI5Calendar
  | UI5FileUploader
  | UI5ShellHeadItem
  | UI5UnifiedMenu
  | UI5UnifiedMenuItem;

/**
 * Maps control type strings to their typed interfaces.
 *
 * @remarks
 * Used by the proxy layer's generic `control<T>()` method.
 *
 * @example
 * ```typescript
 * type ButtonType = UI5ControlMap['sap.m.Button']; // UI5Button
 * ```
 */
export interface UI5ControlMap {
  'sap.m.Button': UI5Button;
  'sap.m.Input': UI5Input;
  'sap.m.CheckBox': UI5CheckBox;
  'sap.m.RadioButton': UI5RadioButton;
  'sap.m.ComboBox': UI5ComboBox;
  'sap.m.MultiComboBox': UI5MultiComboBox;
  'sap.m.Select': UI5Select;
  'sap.m.TextArea': UI5TextArea;
  'sap.m.DatePicker': UI5DatePicker;
  'sap.m.DateTimePicker': UI5DateTimePicker;
  'sap.m.SearchField': UI5SearchField;
  'sap.m.MultiInput': UI5MultiInput;
  'sap.m.Switch': UI5Switch;
  'sap.m.StepInput': UI5StepInput;
  'sap.m.SegmentedButton': UI5SegmentedButton;
  'sap.m.Slider': UI5Slider;
  'sap.m.ToggleButton': UI5ToggleButton;
  'sap.m.MenuButton': UI5MenuButton;
  'sap.m.SplitButton': UI5SplitButton;
  'sap.m.TimePicker': UI5TimePicker;
  'sap.m.RangeSlider': UI5RangeSlider;
  'sap.m.Token': UI5Token;
  'sap.m.MaskInput': UI5MaskInput;
  'sap.m.upload.UploadSet': UI5UploadSet;
  'sap.m.RadioButtonGroup': UI5RadioButtonGroup;
  'sap.m.Text': UI5Text;
  'sap.m.Label': UI5Label;
  'sap.m.Title': UI5Title;
  'sap.m.Link': UI5Link;
  'sap.m.Image': UI5Image;
  'sap.m.FormattedText': UI5FormattedText;
  'sap.m.Avatar': UI5Avatar;
  'sap.m.ObjectStatus': UI5ObjectStatus;
  'sap.m.ObjectNumber': UI5ObjectNumber;
  'sap.m.ProgressIndicator': UI5ProgressIndicator;
  'sap.m.RatingIndicator': UI5RatingIndicator;
  'sap.m.BusyIndicator': UI5BusyIndicator;
  'sap.m.MessageStrip': UI5MessageStrip;
  'sap.m.GenericTile': UI5GenericTile;
  'sap.m.NumericContent': UI5NumericContent;
  'sap.m.FeedListItem': UI5FeedListItem;
  'sap.m.ObjectIdentifier': UI5ObjectIdentifier;
  'sap.m.ObjectAttribute': UI5ObjectAttribute;
  'sap.m.List': UI5List;
  'sap.m.Table': UI5Table;
  'sap.m.ColumnListItem': UI5ColumnListItem;
  'sap.m.StandardListItem': UI5StandardListItem;
  'sap.m.ObjectListItem': UI5ObjectListItem;
  'sap.m.Tree': UI5Tree;
  'sap.m.SelectList': UI5SelectList;
  'sap.m.ListBase': UI5ListBase;
  'sap.m.Dialog': UI5Dialog;
  'sap.m.Popover': UI5Popover;
  'sap.m.ResponsivePopover': UI5ResponsivePopover;
  'sap.m.MessagePopover': UI5MessagePopover;
  'sap.m.ActionSheet': UI5ActionSheet;
  'sap.m.ViewSettingsDialog': UI5ViewSettingsDialog;
  'sap.m.IconTabBar': UI5IconTabBar;
  'sap.m.IconTabFilter': UI5IconTabFilter;
  'sap.m.TabContainer': UI5TabContainer;
  'sap.m.Breadcrumbs': UI5Breadcrumbs;
  'sap.m.OverflowToolbar': UI5OverflowToolbar;
  'sap.m.Toolbar': UI5Toolbar;
  'sap.m.Bar': UI5Bar;
  'sap.m.Wizard': UI5Wizard;
  'sap.m.WizardStep': UI5WizardStep;
  'sap.m.Menu': UI5Menu;
  'sap.m.MenuItem': UI5MenuItem;
  'sap.m.Page': UI5Page;
  'sap.m.Panel': UI5Panel;
  'sap.m.ScrollContainer': UI5ScrollContainer;
  'sap.m.FlexBox': UI5FlexBox;
  'sap.m.HBox': UI5HBox;
  'sap.m.VBox': UI5VBox;
  'sap.m.Carousel': UI5Carousel;
  'sap.m.SplitContainer': UI5SplitContainer;
  'sap.m.DateRangeSelection': UI5DateRangeSelection;
  'sap.m.NotificationListItem': UI5NotificationListItem;
  'sap.m.PlanningCalendar': UI5PlanningCalendar;
  'sap.m.SinglePlanningCalendar': UI5SinglePlanningCalendar;
  'sap.m.MessageItem': UI5MessageItem;
  'sap.m.MessageView': UI5MessageView;
  'sap.m.NavContainer': UI5NavContainer;
  'sap.m.SplitApp': UI5SplitApp;
  'sap.m.Shell': UI5Shell;
  'sap.m.App': UI5App;
  'sap.m.Column': UI5Column;
  'sap.m.StandardTreeItem': UI5StandardTreeItem;
  'sap.m.CustomListItem': UI5CustomListItem;
  'sap.m.GroupHeaderListItem': UI5GroupHeaderListItem;
  'sap.m.InputListItem': UI5InputListItem;
  'sap.m.DisplayListItem': UI5DisplayListItem;
  'sap.m.ActionListItem': UI5ActionListItem;
  'sap.m.Tokenizer': UI5Tokenizer;
  'sap.m.SelectDialog': UI5SelectDialog;
  'sap.m.TableSelectDialog': UI5TableSelectDialog;
  'sap.m.BusyDialog': UI5BusyDialog;
  'sap.m.UploadCollection': UI5UploadCollection;
  'sap.m.ObjectHeader': UI5ObjectHeader;
  'sap.m.ObjectMarker': UI5ObjectMarker;
  'sap.m.DraftIndicator': UI5DraftIndicator;
  'sap.m.HeaderContainer': UI5HeaderContainer;
  'sap.m.IconTabSeparator': UI5IconTabSeparator;
  'sap.m.TabContainerItem': UI5TabContainerItem;
  'sap.m.FacetFilter': UI5FacetFilter;
  'sap.m.FacetFilterList': UI5FacetFilterList;
  'sap.m.PDFViewer': UI5PDFViewer;
  'sap.m.ColorPalettePopover': UI5ColorPalettePopover;
  'sap.m.SlideTile': UI5SlideTile;
  'sap.m.LightBox': UI5LightBox;
  'sap.m.VariantManagement': UI5VariantManagement;
  'sap.m.ColorPalette': UI5ColorPalette;
  'sap.m.DynamicDateRange': UI5DynamicDateRange;
  'sap.m.FeedInput': UI5FeedInput;
  'sap.m.ExpandableText': UI5ExpandableText;
  'sap.m.QuickView': UI5QuickView;
  'sap.m.QuickViewCard': UI5QuickViewCard;
  'sap.m.QuickViewPage': UI5QuickViewPage;
  'sap.m.IllustratedMessage': UI5IllustratedMessage;
  'sap.m.ToolbarSpacer': UI5ToolbarSpacer;
  'sap.m.ToolbarSeparator': UI5ToolbarSeparator;
  'sap.m.TileContent': UI5TileContent;
  'sap.m.NotificationListGroup': UI5NotificationListGroup;
  'sap.m.SelectionDetails': UI5SelectionDetails;
  'sap.m.IconTabHeader': UI5IconTabHeader;
  'sap.m.p13n.Popup': UI5P13nPopup;
  'sap.m.p13n.SelectionPanel': UI5P13nSelectionPanel;
  'sap.m.p13n.SortPanel': UI5P13nSortPanel;
  'sap.m.p13n.GroupPanel': UI5P13nGroupPanel;
  'sap.m.table.columnmenu.Menu': UI5ColumnMenu;
  'sap.ui.table.Table': UI5GridTable;
  'sap.ui.table.TreeTable': UI5TreeTable;
  'sap.ui.table.AnalyticalTable': UI5AnalyticalTable;
  'sap.ui.table.Column': UI5TableColumn;
  'sap.ui.table.Row': UI5TableRow;
  'sap.f.DynamicPage': UI5DynamicPage;
  'sap.f.DynamicPageTitle': UI5DynamicPageTitle;
  'sap.f.DynamicPageHeader': UI5DynamicPageHeader;
  'sap.f.FlexibleColumnLayout': UI5FlexibleColumnLayout;
  'sap.f.Card': UI5FCard;
  'sap.f.Avatar': UI5FAvatar;
  'sap.f.GridContainer': UI5GridContainer;
  'sap.f.ShellBar': UI5ShellBar;
  'sap.f.ProductSwitch': UI5ProductSwitch;
  'sap.f.semantic.SemanticPage': UI5FSemanticPage;
  'sap.uxap.ObjectPageLayout': UI5ObjectPageLayout;
  'sap.uxap.ObjectPageSection': UI5ObjectPageSection;
  'sap.uxap.ObjectPageSubSection': UI5ObjectPageSubSection;
  'sap.uxap.ObjectPageHeader': UI5ObjectPageHeader;
  'sap.uxap.ObjectPageDynamicHeaderTitle': UI5ObjectPageDynamicHeaderTitle;
  'sap.uxap.AnchorBar': UI5AnchorBar;
  'sap.ui.layout.form.SimpleForm': UI5SimpleForm;
  'sap.ui.layout.Grid': UI5Grid;
  'sap.ui.layout.Splitter': UI5Splitter;
  'sap.ui.layout.ResponsiveSplitter': UI5ResponsiveSplitter;
  'sap.ui.layout.form.Form': UI5Form;
  'sap.ui.layout.form.FormContainer': UI5FormContainer;
  'sap.ui.layout.form.FormElement': UI5FormElement;
  'sap.ui.layout.VerticalLayout': UI5VerticalLayout;
  'sap.ui.layout.HorizontalLayout': UI5HorizontalLayout;
  'sap.ui.layout.BlockLayout': UI5BlockLayout;
  'sap.ui.layout.BlockLayoutRow': UI5BlockLayoutRow;
  'sap.ui.layout.BlockLayoutCell': UI5BlockLayoutCell;
  'sap.ui.layout.DynamicSideContent': UI5DynamicSideContent;
  'sap.ui.core.Icon': UI5Icon;
  'sap.ui.core.Item': UI5Item;
  'sap.ui.core.ListItem': UI5ListItem;
  'sap.ui.core.HTML': UI5HTML;
  'sap.ui.core.ComponentContainer': UI5ComponentContainer;
  'sap.ui.comp.smarttable.SmartTable': UI5SmartTable;
  'sap.ui.comp.smartfield.SmartField': UI5SmartField;
  'sap.ui.comp.smartfilterbar.SmartFilterBar': UI5SmartFilterBar;
  'sap.ui.comp.smartform.SmartForm': UI5SmartForm;
  'sap.ui.comp.smartform.Group': UI5SmartFormGroup;
  'sap.ui.comp.smartform.GroupElement': UI5SmartFormGroupElement;
  'sap.ui.comp.valuehelpdialog.ValueHelpDialog': UI5ValueHelpDialog;
  'sap.ui.comp.smartvariants.SmartVariantManagement': UI5SmartVariantManagement;
  'sap.ui.comp.filterbar.FilterBar': UI5FilterBar;
  'sap.ui.comp.navpopover.SmartLink': UI5SmartLink;
  'sap.ui.comp.smartchart.SmartChart': UI5SmartChart;
  'sap.ui.comp.smartmultiinput.SmartMultiInput': UI5SmartMultiInput;
  'sap.ui.mdc.Table': UI5MdcTable;
  'sap.ui.mdc.FilterBar': UI5MdcFilterBar;
  'sap.ui.mdc.Field': UI5MdcField;
  'sap.ui.mdc.ValueHelp': UI5MdcValueHelp;
  'sap.ui.mdc.Chart': UI5MdcChart;
  'sap.ui.mdc.MultiValueField': UI5MdcMultiValueField;
  'sap.ui.mdc.FilterField': UI5MdcFilterField;
  'sap.tnt.SideNavigation': UI5SideNavigation;
  'sap.tnt.NavigationListItem': UI5NavigationListItem;
  'sap.tnt.ToolPage': UI5ToolPage;
  'sap.tnt.ToolHeader': UI5ToolHeader;
  'sap.tnt.NavigationList': UI5NavigationList;
  'sap.tnt.InfoLabel': UI5InfoLabel;
  'sap.ui.unified.Calendar': UI5Calendar;
  'sap.ui.unified.FileUploader': UI5FileUploader;
  'sap.ui.unified.ShellHeadItem': UI5ShellHeadItem;
  'sap.ui.unified.Menu': UI5UnifiedMenu;
  'sap.ui.unified.MenuItem': UI5UnifiedMenuItem;
}

/**
 * String literal union of interactive control types.
 *
 * @remarks
 * Controls that accept user input and fire events.
 */
export type InteractiveControlType =
  | 'sap.m.Button'
  | 'sap.m.Input'
  | 'sap.m.CheckBox'
  | 'sap.m.RadioButton'
  | 'sap.m.ComboBox'
  | 'sap.m.MultiComboBox'
  | 'sap.m.Select'
  | 'sap.m.TextArea'
  | 'sap.m.DatePicker'
  | 'sap.m.DateTimePicker'
  | 'sap.m.SearchField'
  | 'sap.m.MultiInput'
  | 'sap.m.Switch'
  | 'sap.m.StepInput'
  | 'sap.m.SegmentedButton'
  | 'sap.m.Slider'
  | 'sap.m.ToggleButton'
  | 'sap.m.MenuButton'
  | 'sap.m.TimePicker'
  | 'sap.m.RangeSlider'
  | 'sap.m.MaskInput'
  | 'sap.m.Link'
  | 'sap.m.RatingIndicator'
  | 'sap.m.GenericTile'
  | 'sap.m.DateRangeSelection'
  | 'sap.m.PlanningCalendar'
  | 'sap.m.SinglePlanningCalendar'
  | 'sap.m.FacetFilter'
  | 'sap.m.FacetFilterList'
  | 'sap.m.ColorPalettePopover'
  | 'sap.m.VariantManagement'
  | 'sap.m.ColorPalette'
  | 'sap.m.DynamicDateRange'
  | 'sap.m.FeedInput'
  | 'sap.m.QuickView'
  | 'sap.m.SelectionDetails'
  | 'sap.ui.comp.smartfield.SmartField'
  | 'sap.ui.comp.smartfilterbar.SmartFilterBar'
  | 'sap.ui.comp.filterbar.FilterBar'
  | 'sap.ui.comp.smartchart.SmartChart'
  | 'sap.ui.comp.smartmultiinput.SmartMultiInput'
  | 'sap.ui.mdc.FilterBar'
  | 'sap.ui.mdc.Field'
  | 'sap.ui.mdc.MultiValueField'
  | 'sap.ui.mdc.FilterField'
  | 'sap.tnt.NavigationList'
  | 'sap.ui.unified.Calendar'
  | 'sap.ui.unified.FileUploader'
  | 'sap.ui.unified.Menu';

/**
 * String literal union of container control types.
 *
 * @remarks
 * Controls that hold child controls in aggregations.
 */
export type ContainerControlType =
  | 'sap.m.List'
  | 'sap.m.Table'
  | 'sap.m.Tree'
  | 'sap.m.Dialog'
  | 'sap.m.Popover'
  | 'sap.m.ResponsivePopover'
  | 'sap.m.Page'
  | 'sap.m.Panel'
  | 'sap.m.ScrollContainer'
  | 'sap.m.FlexBox'
  | 'sap.m.HBox'
  | 'sap.m.VBox'
  | 'sap.m.Carousel'
  | 'sap.m.SplitContainer'
  | 'sap.m.NavContainer'
  | 'sap.m.SplitApp'
  | 'sap.m.App'
  | 'sap.m.HeaderContainer'
  | 'sap.m.QuickView'
  | 'sap.m.QuickViewPage'
  | 'sap.m.TileContent'
  | 'sap.m.NotificationListGroup'
  | 'sap.m.IconTabHeader'
  | 'sap.m.p13n.Popup'
  | 'sap.f.DynamicPage'
  | 'sap.f.FlexibleColumnLayout'
  | 'sap.f.GridContainer'
  | 'sap.f.semantic.SemanticPage'
  | 'sap.uxap.ObjectPageLayout'
  | 'sap.ui.layout.form.SimpleForm'
  | 'sap.ui.layout.form.Form'
  | 'sap.ui.layout.VerticalLayout'
  | 'sap.ui.layout.HorizontalLayout'
  | 'sap.ui.layout.BlockLayout'
  | 'sap.tnt.NavigationList';
