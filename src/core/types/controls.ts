/* eslint-disable max-lines -- Type-only file: 60+ control interfaces. Plan allows up to 2000 LOC. */
/**
 * Typed UI5 control interfaces for SAP Fiori test automation.
 *
 * @remarks
 * LOC Exception: Type-only files allowed up to 2000 LOC. This file contains
 * 60+ tightly related control interfaces. Splitting across files creates
 * circular import risk and hurts IDE discoverability.
 *
 * Source: dhikraft 2.5 (142 controls, field-tested in SAP BTP) + wdi5 (50+).
 * Covers 95%+ of real SAP Fiori applications.
 *
 * All control methods return `Promise<T>` — resolved via bridge adapter.
 *
 * @module types
 */

// ═══════════════════════════════════════════════════════════════════════
// Base interface all UI5 controls share
// ═══════════════════════════════════════════════════════════════════════

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
  /** Returns the fully qualified control type name. */
  getControlType(): Promise<string>;
  /** Gets a named property value. */
  getProperty(name: string): Promise<unknown>;
  /** Sets a named property value. */
  setProperty(name: string, value: unknown): Promise<void>;
  /** Returns controls in a named aggregation. */
  getAggregation(name: string): Promise<readonly UI5ControlBase[]>;
  /** Returns binding info for a named property. */
  getBindingInfo(name: string): Promise<unknown>;
  /** Returns the DOM reference ID, or null if not rendered. */
  getDomRef(): Promise<string | null>;
  /** Returns whether the control is visible. */
  isVisible(): Promise<boolean>;
  /** Returns whether the control is enabled. */
  isEnabled(): Promise<boolean>;
  /** Returns whether a property is data-bound. */
  isBound(propertyName: string): Promise<boolean>;
  /** Returns the named model, or the default model if no name given. */
  getModel(name?: string): Promise<unknown>;
  /** Returns the owning view. */
  getView(): Promise<unknown>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.m — Mobile/Core Library (~89 controls)
// Source: dhikraft INTERACTIVE_CONTROL_TYPES + field-tested controls
// ═══════════════════════════════════════════════════════════════════════

// ── Input Controls (B1c: 25 interfaces) ─────────────────────────────

/**
 * sap.m.Button — Standard action button.
 *
 * @example
 * ```typescript
 * const btn: UI5Button = await ui5.control({ controlType: 'sap.m.Button' });
 * await btn.press();
 * ```
 */
export interface UI5Button extends UI5ControlBase {
  readonly controlType: 'sap.m.Button';
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getIcon(): Promise<string>;
  getType(): Promise<string>;
  press(): Promise<void>;
}

/**
 * sap.m.Input — Single-line text input.
 *
 * @example
 * ```typescript
 * const input: UI5Input = await ui5.control({ controlType: 'sap.m.Input' });
 * await input.setValue('V001');
 * ```
 */
export interface UI5Input extends UI5ControlBase {
  readonly controlType: 'sap.m.Input';
  getValue(): Promise<string>;
  getPlaceholder(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getEditable(): Promise<boolean>;
  getValueState(): Promise<string>;
  getValueStateText(): Promise<string>;
  getDescription(): Promise<string>;
  setValue(value: string): Promise<void>;
}

/**
 * sap.m.CheckBox — Boolean toggle with label.
 *
 * @example
 * ```typescript
 * const cb: UI5CheckBox = await ui5.control({ controlType: 'sap.m.CheckBox' });
 * await cb.setSelected(true);
 * ```
 */
export interface UI5CheckBox extends UI5ControlBase {
  readonly controlType: 'sap.m.CheckBox';
  getSelected(): Promise<boolean>;
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setSelected(selected: boolean): Promise<void>;
}

/** sap.m.RadioButton — Single selection within a group. */
export interface UI5RadioButton extends UI5ControlBase {
  readonly controlType: 'sap.m.RadioButton';
  getSelected(): Promise<boolean>;
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
}

/** sap.m.ComboBox — Editable dropdown with type-ahead. */
export interface UI5ComboBox extends UI5ControlBase {
  readonly controlType: 'sap.m.ComboBox';
  getValue(): Promise<string>;
  getSelectedKey(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
  setSelectedKey(key: string): Promise<void>;
}

/** sap.m.MultiComboBox — Multi-select dropdown with tokens. */
export interface UI5MultiComboBox extends UI5ControlBase {
  readonly controlType: 'sap.m.MultiComboBox';
  getSelectedKeys(): Promise<readonly string[]>;
  getEnabled(): Promise<boolean>;
  setSelectedKeys(keys: readonly string[]): Promise<void>;
}

/** sap.m.Select — Non-editable dropdown. */
export interface UI5Select extends UI5ControlBase {
  readonly controlType: 'sap.m.Select';
  getSelectedKey(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setSelectedKey(key: string): Promise<void>;
}

/** sap.m.TextArea — Multi-line text input. */
export interface UI5TextArea extends UI5ControlBase {
  readonly controlType: 'sap.m.TextArea';
  getValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getEditable(): Promise<boolean>;
  getRows(): Promise<number>;
  setValue(value: string): Promise<void>;
}

/** sap.m.DatePicker — Date input with calendar popup. */
export interface UI5DatePicker extends UI5ControlBase {
  readonly controlType: 'sap.m.DatePicker';
  getValue(): Promise<string>;
  getDateValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

/** sap.m.DateTimePicker — Combined date and time input. */
export interface UI5DateTimePicker extends UI5ControlBase {
  readonly controlType: 'sap.m.DateTimePicker';
  getValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

/** sap.m.SearchField — Search input with search button. */
export interface UI5SearchField extends UI5ControlBase {
  readonly controlType: 'sap.m.SearchField';
  getValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

/** sap.m.MultiInput — Input with token-based multi-value. */
export interface UI5MultiInput extends UI5ControlBase {
  readonly controlType: 'sap.m.MultiInput';
  getValue(): Promise<string>;
  getTokens(): Promise<readonly UI5ControlBase[]>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

/** sap.m.Switch — Binary on/off toggle. */
export interface UI5Switch extends UI5ControlBase {
  readonly controlType: 'sap.m.Switch';
  getState(): Promise<boolean>;
  getEnabled(): Promise<boolean>;
  setState(state: boolean): Promise<void>;
}

/** sap.m.StepInput — Numeric input with +/- buttons. */
export interface UI5StepInput extends UI5ControlBase {
  readonly controlType: 'sap.m.StepInput';
  getValue(): Promise<number>;
  getMin(): Promise<number>;
  getMax(): Promise<number>;
  getEnabled(): Promise<boolean>;
  setValue(value: number): Promise<void>;
}

/** sap.m.SegmentedButton — Mutually exclusive button group. */
export interface UI5SegmentedButton extends UI5ControlBase {
  readonly controlType: 'sap.m.SegmentedButton';
  getSelectedKey(): Promise<string>;
  setSelectedKey(key: string): Promise<void>;
}

/** sap.m.Slider — Continuous value selection slider. */
export interface UI5Slider extends UI5ControlBase {
  readonly controlType: 'sap.m.Slider';
  getValue(): Promise<number>;
  getMin(): Promise<number>;
  getMax(): Promise<number>;
  setValue(value: number): Promise<void>;
}

/** sap.m.ToggleButton — Button with pressed/unpressed state. */
export interface UI5ToggleButton extends UI5ControlBase {
  readonly controlType: 'sap.m.ToggleButton';
  getPressed(): Promise<boolean>;
  getText(): Promise<string>;
  press(): Promise<void>;
}

/** sap.m.MenuButton — Button that opens a menu. */
export interface UI5MenuButton extends UI5ControlBase {
  readonly controlType: 'sap.m.MenuButton';
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
}

/** sap.m.SplitButton — Button with default and menu actions. */
export interface UI5SplitButton extends UI5ControlBase {
  readonly controlType: 'sap.m.SplitButton';
  getText(): Promise<string>;
  getEnabled(): Promise<boolean>;
  getIcon(): Promise<string>;
}

/** sap.m.TimePicker — Time input with time picker popup. */
export interface UI5TimePicker extends UI5ControlBase {
  readonly controlType: 'sap.m.TimePicker';
  getValue(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

/** sap.m.RangeSlider — Dual-handle slider for range selection. */
export interface UI5RangeSlider extends UI5ControlBase {
  readonly controlType: 'sap.m.RangeSlider';
  getValue(): Promise<number>;
  getValue2(): Promise<number>;
  getMin(): Promise<number>;
  getMax(): Promise<number>;
  setValue(value: number): Promise<void>;
  setValue2(value: number): Promise<void>;
}

/** sap.m.Token — Token chip inside MultiInput/MultiComboBox. */
export interface UI5Token extends UI5ControlBase {
  readonly controlType: 'sap.m.Token';
  getText(): Promise<string>;
  getKey(): Promise<string>;
  getEditable(): Promise<boolean>;
}

/** sap.m.MaskInput — Input with format mask. */
export interface UI5MaskInput extends UI5ControlBase {
  readonly controlType: 'sap.m.MaskInput';
  getValue(): Promise<string>;
  getMask(): Promise<string>;
  getEnabled(): Promise<boolean>;
  setValue(value: string): Promise<void>;
}

/** sap.m.upload.UploadSet — File upload control. */
export interface UI5UploadSet extends UI5ControlBase {
  readonly controlType: 'sap.m.upload.UploadSet';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getInstantUpload(): Promise<boolean>;
}

/** sap.m.RadioButtonGroup — Group container for radio buttons. */
export interface UI5RadioButtonGroup extends UI5ControlBase {
  readonly controlType: 'sap.m.RadioButtonGroup';
  getSelectedIndex(): Promise<number>;
  getColumns(): Promise<number>;
  getEnabled(): Promise<boolean>;
  setSelectedIndex(index: number): Promise<void>;
}

// ── Display Controls (B1d: 19 interfaces) ───────────────────────────

/** sap.m.Text — Read-only text display. */
export interface UI5Text extends UI5ControlBase {
  readonly controlType: 'sap.m.Text';
  getText(): Promise<string>;
  getMaxLines(): Promise<number>;
  getWrapping(): Promise<boolean>;
}

/** sap.m.Label — Form field label. */
export interface UI5Label extends UI5ControlBase {
  readonly controlType: 'sap.m.Label';
  getText(): Promise<string>;
  getRequired(): Promise<boolean>;
}

/** sap.m.Title — Section/page title. */
export interface UI5Title extends UI5ControlBase {
  readonly controlType: 'sap.m.Title';
  getText(): Promise<string>;
  getLevel(): Promise<string>;
}

/** sap.m.Link — Clickable hyperlink. */
export interface UI5Link extends UI5ControlBase {
  readonly controlType: 'sap.m.Link';
  getText(): Promise<string>;
  getHref(): Promise<string>;
  getEnabled(): Promise<boolean>;
  press(): Promise<void>;
}

/** sap.m.Image — Image display. */
export interface UI5Image extends UI5ControlBase {
  readonly controlType: 'sap.m.Image';
  getSrc(): Promise<string>;
  getAlt(): Promise<string>;
}

/** sap.m.FormattedText — Rich text display with HTML subset. */
export interface UI5FormattedText extends UI5ControlBase {
  readonly controlType: 'sap.m.FormattedText';
  getHtmlText(): Promise<string>;
}

/** sap.m.Avatar — User avatar / initials display. */
export interface UI5Avatar extends UI5ControlBase {
  readonly controlType: 'sap.m.Avatar';
  getSrc(): Promise<string>;
  getInitials(): Promise<string>;
  getDisplaySize(): Promise<string>;
}

// ── Indicator Controls ──────────────────────────────────────────────

/** sap.m.ObjectStatus — Status indicator with text and icon. */
export interface UI5ObjectStatus extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectStatus';
  getText(): Promise<string>;
  getState(): Promise<string>;
  getIcon(): Promise<string>;
}

/** sap.m.ObjectNumber — Formatted number with unit. */
export interface UI5ObjectNumber extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectNumber';
  getNumber(): Promise<string>;
  getUnit(): Promise<string>;
  getState(): Promise<string>;
}

/** sap.m.ProgressIndicator — Progress bar. */
export interface UI5ProgressIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.ProgressIndicator';
  getPercentValue(): Promise<number>;
  getDisplayValue(): Promise<string>;
  getState(): Promise<string>;
}

/** sap.m.RatingIndicator — Star rating. */
export interface UI5RatingIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.RatingIndicator';
  getValue(): Promise<number>;
  getMaxValue(): Promise<number>;
  getEnabled(): Promise<boolean>;
  setValue(value: number): Promise<void>;
}

/** sap.m.BusyIndicator — Loading spinner. */
export interface UI5BusyIndicator extends UI5ControlBase {
  readonly controlType: 'sap.m.BusyIndicator';
  getText(): Promise<string>;
  getSize(): Promise<string>;
}

/** sap.m.MessageStrip — Inline notification banner. */
export interface UI5MessageStrip extends UI5ControlBase {
  readonly controlType: 'sap.m.MessageStrip';
  getText(): Promise<string>;
  getType(): Promise<string>;
  getShowCloseButton(): Promise<boolean>;
}

// ── Tile Controls ───────────────────────────────────────────────────

/** sap.m.GenericTile — Fiori Launchpad tile. */
export interface UI5GenericTile extends UI5ControlBase {
  readonly controlType: 'sap.m.GenericTile';
  getHeader(): Promise<string>;
  getSubheader(): Promise<string>;
  getState(): Promise<string>;
  getFrameType(): Promise<string>;
  press(): Promise<void>;
}

/** sap.m.NumericContent — Numeric KPI display inside tiles. */
export interface UI5NumericContent extends UI5ControlBase {
  readonly controlType: 'sap.m.NumericContent';
  getValue(): Promise<string>;
  getScale(): Promise<string>;
  getIndicator(): Promise<string>;
  getValueColor(): Promise<string>;
}

/** sap.m.FeedListItem — Social feed item. */
export interface UI5FeedListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.FeedListItem';
  getText(): Promise<string>;
  getSender(): Promise<string>;
  getTimestamp(): Promise<string>;
  getIcon(): Promise<string>;
}

/** sap.m.ObjectIdentifier — Business object title + subtitle. */
export interface UI5ObjectIdentifier extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectIdentifier';
  getTitle(): Promise<string>;
  getText(): Promise<string>;
  getTitleActive(): Promise<boolean>;
}

/** sap.m.ObjectAttribute — Key-value display in ObjectListItem. */
export interface UI5ObjectAttribute extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectAttribute';
  getTitle(): Promise<string>;
  getText(): Promise<string>;
  getActive(): Promise<boolean>;
}

// ── List Controls (B1e) ─────────────────────────────────────────────

/** sap.m.List — Vertical list container. */
export interface UI5List extends UI5ControlBase {
  readonly controlType: 'sap.m.List';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
  getHeaderText(): Promise<string>;
  getGrowing(): Promise<boolean>;
}

/** sap.m.Table — Responsive table (extends List). */
export interface UI5Table extends UI5ControlBase {
  readonly controlType: 'sap.m.Table';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
  getHeaderText(): Promise<string>;
  getGrowing(): Promise<boolean>;
}

/** sap.m.ColumnListItem — Row inside sap.m.Table. */
export interface UI5ColumnListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.ColumnListItem';
  getCells(): Promise<readonly UI5ControlBase[]>;
  getSelected(): Promise<boolean>;
  getType(): Promise<string>;
}

/** sap.m.StandardListItem — Standard list row with title/description. */
export interface UI5StandardListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.StandardListItem';
  getTitle(): Promise<string>;
  getDescription(): Promise<string>;
  getIcon(): Promise<string>;
  getInfo(): Promise<string>;
  getType(): Promise<string>;
}

/** sap.m.ObjectListItem — Rich list item with attributes/statuses. */
export interface UI5ObjectListItem extends UI5ControlBase {
  readonly controlType: 'sap.m.ObjectListItem';
  getTitle(): Promise<string>;
  getNumber(): Promise<string>;
  getNumberUnit(): Promise<string>;
  getIntro(): Promise<string>;
  getAttributes(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.Tree — Hierarchical tree list. */
export interface UI5Tree extends UI5ControlBase {
  readonly controlType: 'sap.m.Tree';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
}

/** sap.m.SelectList — Simple dropdown list. */
export interface UI5SelectList extends UI5ControlBase {
  readonly controlType: 'sap.m.SelectList';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getSelectedKey(): Promise<string>;
  setSelectedKey(key: string): Promise<void>;
}

/** sap.m.ListBase — Abstract base for List/Table. */
export interface UI5ListBase extends UI5ControlBase {
  readonly controlType: 'sap.m.ListBase';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getMode(): Promise<string>;
}

// ── Dialog Controls (B1e) ───────────────────────────────────────────

/** sap.m.Dialog — Modal dialog. */
export interface UI5Dialog extends UI5ControlBase {
  readonly controlType: 'sap.m.Dialog';
  getTitle(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  getButtons(): Promise<readonly UI5ControlBase[]>;
  getState(): Promise<string>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.Popover — Non-modal popover anchored to a control. */
export interface UI5Popover extends UI5ControlBase {
  readonly controlType: 'sap.m.Popover';
  getTitle(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.ResponsivePopover — Dialog on phone, Popover on desktop. */
export interface UI5ResponsivePopover extends UI5ControlBase {
  readonly controlType: 'sap.m.ResponsivePopover';
  getTitle(): Promise<string>;
  getContent(): Promise<readonly UI5ControlBase[]>;
  isOpen(): Promise<boolean>;
  close(): Promise<void>;
}

/** sap.m.MessageBox — Standard alert/confirm dialog. */
export interface UI5MessageBox extends UI5ControlBase {
  readonly controlType: 'sap.m.MessageBox';
  getTitle(): Promise<string>;
  getDetails(): Promise<string>;
}

/** sap.m.MessagePopover — Message collection popover. */
export interface UI5MessagePopover extends UI5ControlBase {
  readonly controlType: 'sap.m.MessagePopover';
  getItems(): Promise<readonly UI5ControlBase[]>;
  isOpen(): Promise<boolean>;
}

/** sap.m.MessageToast — Transient toast notification (no DOM after timeout). */
export interface UI5MessageToast extends UI5ControlBase {
  readonly controlType: 'sap.m.MessageToast';
}

/** sap.m.ActionSheet — Bottom action sheet with buttons. */
export interface UI5ActionSheet extends UI5ControlBase {
  readonly controlType: 'sap.m.ActionSheet';
  getTitle(): Promise<string>;
  getButtons(): Promise<readonly UI5ControlBase[]>;
  isOpen(): Promise<boolean>;
}

/** sap.m.ViewSettingsDialog — Sort/filter/group dialog. */
export interface UI5ViewSettingsDialog extends UI5ControlBase {
  readonly controlType: 'sap.m.ViewSettingsDialog';
  getTitle(): Promise<string>;
  isOpen(): Promise<boolean>;
}

// ── Navigation Controls (B1e) ───────────────────────────────────────

/** sap.m.IconTabBar — Tab-based navigation bar. */
export interface UI5IconTabBar extends UI5ControlBase {
  readonly controlType: 'sap.m.IconTabBar';
  getSelectedKey(): Promise<string>;
  getItems(): Promise<readonly UI5ControlBase[]>;
  setSelectedKey(key: string): Promise<void>;
}

/** sap.m.IconTabFilter — Individual tab inside IconTabBar. */
export interface UI5IconTabFilter extends UI5ControlBase {
  readonly controlType: 'sap.m.IconTabFilter';
  getText(): Promise<string>;
  getIcon(): Promise<string>;
  getCount(): Promise<string>;
  getKey(): Promise<string>;
}

/** sap.m.TabContainer — Tab container for full pages. */
export interface UI5TabContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.TabContainer';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.Breadcrumbs — Navigation breadcrumb trail. */
export interface UI5Breadcrumbs extends UI5ControlBase {
  readonly controlType: 'sap.m.Breadcrumbs';
  getLinks(): Promise<readonly UI5ControlBase[]>;
  getCurrentLocationText(): Promise<string>;
}

/** sap.m.OverflowToolbar — Toolbar with overflow menu. */
export interface UI5OverflowToolbar extends UI5ControlBase {
  readonly controlType: 'sap.m.OverflowToolbar';
  getContent(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.Toolbar — Horizontal action bar. */
export interface UI5Toolbar extends UI5ControlBase {
  readonly controlType: 'sap.m.Toolbar';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getActive(): Promise<boolean>;
}

/** sap.m.Bar — Header/footer bar for Page. */
export interface UI5Bar extends UI5ControlBase {
  readonly controlType: 'sap.m.Bar';
  getContentLeft(): Promise<readonly UI5ControlBase[]>;
  getContentMiddle(): Promise<readonly UI5ControlBase[]>;
  getContentRight(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.Wizard — Step-by-step guided workflow. */
export interface UI5Wizard extends UI5ControlBase {
  readonly controlType: 'sap.m.Wizard';
  getSteps(): Promise<readonly UI5ControlBase[]>;
  getCurrentStep(): Promise<string>;
}

/** sap.m.WizardStep — Individual step in a Wizard. */
export interface UI5WizardStep extends UI5ControlBase {
  readonly controlType: 'sap.m.WizardStep';
  getTitle(): Promise<string>;
  getValidated(): Promise<boolean>;
}

/** sap.m.Menu — Context menu or button menu. */
export interface UI5Menu extends UI5ControlBase {
  readonly controlType: 'sap.m.Menu';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.MenuItem — Item inside a Menu. */
export interface UI5MenuItem extends UI5ControlBase {
  readonly controlType: 'sap.m.MenuItem';
  getText(): Promise<string>;
  getIcon(): Promise<string>;
  getEnabled(): Promise<boolean>;
}

// ── Container Controls (B1f) ────────────────────────────────────────

/** sap.m.Page — Full-page container with header/footer. */
export interface UI5Page extends UI5ControlBase {
  readonly controlType: 'sap.m.Page';
  getTitle(): Promise<string>;
  getShowNavButton(): Promise<boolean>;
  getContent(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.Panel — Collapsible content panel. */
export interface UI5Panel extends UI5ControlBase {
  readonly controlType: 'sap.m.Panel';
  getHeaderText(): Promise<string>;
  getExpanded(): Promise<boolean>;
  getContent(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.ScrollContainer — Scrollable container. */
export interface UI5ScrollContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.ScrollContainer';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getHorizontal(): Promise<boolean>;
  getVertical(): Promise<boolean>;
}

/** sap.m.FlexBox — CSS flexbox container. */
export interface UI5FlexBox extends UI5ControlBase {
  readonly controlType: 'sap.m.FlexBox';
  getItems(): Promise<readonly UI5ControlBase[]>;
  getDirection(): Promise<string>;
  getJustifyContent(): Promise<string>;
}

/** sap.m.HBox — Horizontal flexbox shorthand. */
export interface UI5HBox extends UI5ControlBase {
  readonly controlType: 'sap.m.HBox';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.VBox — Vertical flexbox shorthand. */
export interface UI5VBox extends UI5ControlBase {
  readonly controlType: 'sap.m.VBox';
  getItems(): Promise<readonly UI5ControlBase[]>;
}

/** sap.m.Carousel — Swipeable content carousel. */
export interface UI5Carousel extends UI5ControlBase {
  readonly controlType: 'sap.m.Carousel';
  getPages(): Promise<readonly UI5ControlBase[]>;
  getActivePage(): Promise<string>;
}

/** sap.m.SplitContainer — Master-detail split view. */
export interface UI5SplitContainer extends UI5ControlBase {
  readonly controlType: 'sap.m.SplitContainer';
  getMasterPages(): Promise<readonly UI5ControlBase[]>;
  getDetailPages(): Promise<readonly UI5ControlBase[]>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.ui.layout — Layout Library
// ═══════════════════════════════════════════════════════════════════════

/** sap.ui.layout.form.SimpleForm — Auto-layout form. */
export interface UI5SimpleForm extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.form.SimpleForm';
  getContent(): Promise<readonly UI5ControlBase[]>;
  getTitle(): Promise<string>;
  getEditable(): Promise<boolean>;
}

/** sap.ui.layout.Grid — CSS grid layout. */
export interface UI5Grid extends UI5ControlBase {
  readonly controlType: 'sap.ui.layout.Grid';
  getContent(): Promise<readonly UI5ControlBase[]>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.ui.table — Desktop Table Library
// ═══════════════════════════════════════════════════════════════════════

/** sap.ui.table.Table — High-performance desktop table. */
export interface UI5GridTable extends UI5ControlBase {
  readonly controlType: 'sap.ui.table.Table';
  getRows(): Promise<readonly UI5ControlBase[]>;
  getColumns(): Promise<readonly UI5ControlBase[]>;
  getVisibleRowCount(): Promise<number>;
  getSelectedIndices(): Promise<readonly number[]>;
  getFirstVisibleRow(): Promise<number>;
  setFirstVisibleRow(index: number): Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.f — Fiori Library
// ═══════════════════════════════════════════════════════════════════════

/** sap.f.DynamicPage — Fiori ObjectPage-style page with collapsing header. */
export interface UI5DynamicPage extends UI5ControlBase {
  readonly controlType: 'sap.f.DynamicPage';
  getTitle(): Promise<unknown>;
  getHeader(): Promise<unknown>;
  getContent(): Promise<readonly UI5ControlBase[]>;
}

/** sap.f.FlexibleColumnLayout — Master-detail-detail responsive layout. */
export interface UI5FlexibleColumnLayout extends UI5ControlBase {
  readonly controlType: 'sap.f.FlexibleColumnLayout';
  getLayout(): Promise<string>;
  getBeginColumnPages(): Promise<readonly UI5ControlBase[]>;
  getMidColumnPages(): Promise<readonly UI5ControlBase[]>;
  getEndColumnPages(): Promise<readonly UI5ControlBase[]>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.uxap — UX Patterns Library
// ═══════════════════════════════════════════════════════════════════════

/** sap.uxap.ObjectPageLayout — Fiori Object Page. */
export interface UI5ObjectPageLayout extends UI5ControlBase {
  readonly controlType: 'sap.uxap.ObjectPageLayout';
  getHeaderTitle(): Promise<unknown>;
  getSections(): Promise<readonly UI5ControlBase[]>;
  getSelectedSection(): Promise<string>;
}

/** sap.uxap.ObjectPageSection — Section within ObjectPageLayout. */
export interface UI5ObjectPageSection extends UI5ControlBase {
  readonly controlType: 'sap.uxap.ObjectPageSection';
  getTitle(): Promise<string>;
  getSubSections(): Promise<readonly UI5ControlBase[]>;
}

// ═══════════════════════════════════════════════════════════════════════
// sap.ui.core — Core Library
// ═══════════════════════════════════════════════════════════════════════

/** sap.ui.core.Icon — Icon display. */
export interface UI5Icon extends UI5ControlBase {
  readonly controlType: 'sap.ui.core.Icon';
  getSrc(): Promise<string>;
  getColor(): Promise<string>;
}

// ═══════════════════════════════════════════════════════════════════════
// Discriminated Union — Control Type Map
// ═══════════════════════════════════════════════════════════════════════

/**
 * Discriminated union of all known UI5 control interfaces.
 *
 * @remarks
 * Used by the proxy layer to narrow control types based on `controlType`.
 * Supports exhaustive `switch` statements for type-safe control handling.
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
  // Input controls
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
  // Display controls
  | UI5Text
  | UI5Label
  | UI5Title
  | UI5Link
  | UI5Image
  | UI5FormattedText
  | UI5Avatar
  // Indicator controls
  | UI5ObjectStatus
  | UI5ObjectNumber
  | UI5ProgressIndicator
  | UI5RatingIndicator
  | UI5BusyIndicator
  | UI5MessageStrip
  // Tile controls
  | UI5GenericTile
  | UI5NumericContent
  | UI5FeedListItem
  | UI5ObjectIdentifier
  | UI5ObjectAttribute
  // List controls
  | UI5List
  | UI5Table
  | UI5ColumnListItem
  | UI5StandardListItem
  | UI5ObjectListItem
  | UI5Tree
  | UI5SelectList
  | UI5ListBase
  // Dialog controls
  | UI5Dialog
  | UI5Popover
  | UI5ResponsivePopover
  | UI5MessageBox
  | UI5MessagePopover
  | UI5MessageToast
  | UI5ActionSheet
  | UI5ViewSettingsDialog
  // Navigation controls
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
  // Container controls
  | UI5Page
  | UI5Panel
  | UI5ScrollContainer
  | UI5FlexBox
  | UI5HBox
  | UI5VBox
  | UI5Carousel
  | UI5SplitContainer
  // Layout library
  | UI5SimpleForm
  | UI5Grid
  // Desktop table
  | UI5GridTable
  // Fiori library
  | UI5DynamicPage
  | UI5FlexibleColumnLayout
  // UX patterns
  | UI5ObjectPageLayout
  | UI5ObjectPageSection
  // Core
  | UI5Icon;

/**
 * Maps control type strings to their typed interfaces.
 *
 * @remarks
 * Used by the proxy layer's generic `control<T>()` method to return
 * correctly typed control instances based on the `controlType` string.
 *
 * @example
 * ```typescript
 * import type { UI5ControlMap } from '#core/types/controls.js';
 *
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
  'sap.m.MessageBox': UI5MessageBox;
  'sap.m.MessagePopover': UI5MessagePopover;
  'sap.m.MessageToast': UI5MessageToast;
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
  'sap.ui.layout.form.SimpleForm': UI5SimpleForm;
  'sap.ui.layout.Grid': UI5Grid;
  'sap.ui.table.Table': UI5GridTable;
  'sap.f.DynamicPage': UI5DynamicPage;
  'sap.f.FlexibleColumnLayout': UI5FlexibleColumnLayout;
  'sap.uxap.ObjectPageLayout': UI5ObjectPageLayout;
  'sap.uxap.ObjectPageSection': UI5ObjectPageSection;
  'sap.ui.core.Icon': UI5Icon;
}

/**
 * String literal union of all interactive control types.
 *
 * @remarks
 * Derived from dhikraft 2.5 `INTERACTIVE_CONTROL_TYPES` constant.
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
  | 'sap.m.GenericTile';

/**
 * String literal union of container control types.
 *
 * @remarks
 * Controls that hold child controls in aggregations.
 */
export type ContainerControlType =
  | 'sap.m.Page'
  | 'sap.m.Panel'
  | 'sap.m.ScrollContainer'
  | 'sap.m.FlexBox'
  | 'sap.m.HBox'
  | 'sap.m.VBox'
  | 'sap.m.Dialog'
  | 'sap.m.Popover'
  | 'sap.m.List'
  | 'sap.m.Table'
  | 'sap.m.Tree'
  | 'sap.f.DynamicPage'
  | 'sap.f.FlexibleColumnLayout'
  | 'sap.uxap.ObjectPageLayout'
  | 'sap.ui.layout.form.SimpleForm';
