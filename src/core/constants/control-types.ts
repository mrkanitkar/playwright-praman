/**
 * Interactive and container UI5 control type constants for bulk discovery filtering.
 *
 * @remarks
 * Source: dhikraft v2.5.0 control classification lists, field-tested across
 * 50+ SAP BTP tenants. These sets are used by the proxy layer to classify
 * discovered controls for AI context and user-facing filtering.
 *
 * Some control types (e.g. `sap.m.IconTabBar`, `sap.ui.table.Table`) appear
 * in both sets because they are both interactive (user can interact with them)
 * and act as containers for child controls.
 *
 * @example
 * ```typescript
 * import {
 *   INTERACTIVE_CONTROL_TYPES,
 *   CONTAINER_CONTROL_TYPES,
 *   isInteractiveControl,
 *   isContainerControl,
 * } from '#core/constants/control-types.js';
 *
 * // Check if a discovered control is interactive
 * if (isInteractiveControl(controlMetadata.type)) {
 *   // Include in actionable controls list
 * }
 *
 * // Filter containers for layout analysis
 * const containers = controls.filter((c) => isContainerControl(c.type));
 * ```
 *
 * @module constants
 */

/**
 * UI5 control types that are interactive (buttons, inputs, selects, etc.).
 *
 * @remarks
 * Contains approximately 34 control types from `sap.m`, `sap.ui.unified`,
 * `sap.ui.table`, `sap.ui.comp`, and `sap.m.upload` libraries.
 *
 * @example
 * ```typescript
 * import { INTERACTIVE_CONTROL_TYPES } from '#core/constants/control-types.js';
 *
 * const isInteractive = INTERACTIVE_CONTROL_TYPES.has('sap.m.Button'); // true
 * ```
 */
export const INTERACTIVE_CONTROL_TYPES: ReadonlySet<string> = new Set([
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

/**
 * UI5 control types that are containers (panels, pages, dialogs, etc.).
 *
 * @remarks
 * Contains approximately 27 control types from `sap.m`, `sap.uxap`, `sap.f`,
 * `sap.ui.layout`, and `sap.ui.table` libraries.
 *
 * @example
 * ```typescript
 * import { CONTAINER_CONTROL_TYPES } from '#core/constants/control-types.js';
 *
 * const isContainer = CONTAINER_CONTROL_TYPES.has('sap.m.Page'); // true
 * ```
 */
export const CONTAINER_CONTROL_TYPES: ReadonlySet<string> = new Set([
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

/**
 * Checks whether a UI5 control type is interactive.
 *
 * @param controlType - Fully qualified UI5 control type name (e.g. `'sap.m.Button'`)
 * @returns `true` if the control type is in the interactive controls set
 *
 * @example
 * ```typescript
 * import { isInteractiveControl } from '#core/constants/control-types.js';
 *
 * isInteractiveControl('sap.m.Button');  // true
 * isInteractiveControl('sap.m.Text');    // false
 * ```
 */
export function isInteractiveControl(controlType: string): boolean {
  return INTERACTIVE_CONTROL_TYPES.has(controlType);
}

/**
 * Checks whether a UI5 control type is a container.
 *
 * @param controlType - Fully qualified UI5 control type name (e.g. `'sap.m.Page'`)
 * @returns `true` if the control type is in the container controls set
 *
 * @example
 * ```typescript
 * import { isContainerControl } from '#core/constants/control-types.js';
 *
 * isContainerControl('sap.m.Page');    // true
 * isContainerControl('sap.m.Button');  // false
 * ```
 */
export function isContainerControl(controlType: string): boolean {
  return CONTAINER_CONTROL_TYPES.has(controlType);
}
