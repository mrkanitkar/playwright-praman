#!/usr/bin/env npx tsx
/**
 * Auto-generates typed UI5 control interfaces from SAP UI5 API metadata.
 *
 * Fetches api.json per library from SAP UI5 CDN, caches locally,
 * and generates src/core/types/controls.ts.
 *
 * Usage:
 *   npx tsx scripts/generate-typed-proxies.ts           # Generate (fetch if not cached)
 *   npx tsx scripts/generate-typed-proxies.ts --fresh    # Force re-fetch from CDN
 *   npx tsx scripts/generate-typed-proxies.ts --dry-run  # Print to stdout, don't write
 *   npx tsx scripts/generate-typed-proxies.ts --version 1.144.1
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const CACHE_DIR = join(__dirname, 'data', 'api-cache');
const OUTPUT_FILE = join(PROJECT_ROOT, 'src', 'core', 'types', 'controls.ts');
const DEPRECATION_REPORT = join(__dirname, 'data', 'deprecated-ui5-apis.json');

// ─── CLI ─────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const DRY_RUN = args.includes('--dry-run');
const vIdx = args.indexOf('--version');
const UI5_VERSION = vIdx >= 0 && args[vIdx + 1] ? args[vIdx + 1] : '1.136.0';

function cdnUrl(lib: string): string {
  return `https://ui5.sap.com/${UI5_VERSION}/test-resources/${lib.replace(/\./g, '/')}/designtime/api.json`;
}

// ═══════════════════════════════════════════════════════════════════════
// Target controls by library
// ═══════════════════════════════════════════════════════════════════════
const TARGET_CONTROLS: Record<string, readonly string[]> = {
  'sap.m': [
    // Input controls
    'sap.m.Button',
    'sap.m.Input',
    'sap.m.CheckBox',
    'sap.m.RadioButton',
    'sap.m.ComboBox',
    'sap.m.MultiComboBox',
    'sap.m.Select',
    'sap.m.TextArea',
    'sap.m.DatePicker',
    'sap.m.DateTimePicker',
    'sap.m.SearchField',
    'sap.m.MultiInput',
    'sap.m.Switch',
    'sap.m.StepInput',
    'sap.m.SegmentedButton',
    'sap.m.Slider',
    'sap.m.ToggleButton',
    'sap.m.MenuButton',
    'sap.m.SplitButton',
    'sap.m.TimePicker',
    'sap.m.RangeSlider',
    'sap.m.Token',
    'sap.m.MaskInput',
    'sap.m.upload.UploadSet',
    'sap.m.RadioButtonGroup',
    // Display
    'sap.m.Text',
    'sap.m.Label',
    'sap.m.Title',
    'sap.m.Link',
    'sap.m.Image',
    'sap.m.FormattedText',
    'sap.m.Avatar',
    // Indicators
    'sap.m.ObjectStatus',
    'sap.m.ObjectNumber',
    'sap.m.ProgressIndicator',
    'sap.m.RatingIndicator',
    'sap.m.BusyIndicator',
    'sap.m.MessageStrip',
    // Tiles
    'sap.m.GenericTile',
    'sap.m.NumericContent',
    'sap.m.FeedListItem',
    'sap.m.ObjectIdentifier',
    'sap.m.ObjectAttribute',
    // Lists
    'sap.m.List',
    'sap.m.Table',
    'sap.m.ColumnListItem',
    'sap.m.StandardListItem',
    'sap.m.ObjectListItem',
    'sap.m.Tree',
    'sap.m.SelectList',
    'sap.m.ListBase',
    // Dialogs
    'sap.m.Dialog',
    'sap.m.Popover',
    'sap.m.ResponsivePopover',
    'sap.m.MessagePopover',
    'sap.m.ActionSheet',
    'sap.m.ViewSettingsDialog',
    // Navigation
    'sap.m.IconTabBar',
    'sap.m.IconTabFilter',
    'sap.m.TabContainer',
    'sap.m.Breadcrumbs',
    'sap.m.OverflowToolbar',
    'sap.m.Toolbar',
    'sap.m.Bar',
    'sap.m.Wizard',
    'sap.m.WizardStep',
    'sap.m.Menu',
    'sap.m.MenuItem',
    // Containers
    'sap.m.Page',
    'sap.m.Panel',
    'sap.m.ScrollContainer',
    'sap.m.FlexBox',
    'sap.m.HBox',
    'sap.m.VBox',
    'sap.m.Carousel',
    'sap.m.SplitContainer',
    // Additional sap.m
    'sap.m.DateRangeSelection',
    'sap.m.NotificationListItem',
    'sap.m.PlanningCalendar',
    'sap.m.SinglePlanningCalendar',
    'sap.m.MessageItem',
    'sap.m.MessageView',
    'sap.m.NavContainer',
    'sap.m.SplitApp',
    'sap.m.Shell',
    'sap.m.App',
    'sap.m.Column',
    'sap.m.StandardTreeItem',
    'sap.m.CustomListItem',
    'sap.m.GroupHeaderListItem',
    'sap.m.InputListItem',
    'sap.m.DisplayListItem',
    'sap.m.ActionListItem',
    'sap.m.Tokenizer',
    'sap.m.SelectDialog',
    'sap.m.TableSelectDialog',
    'sap.m.BusyDialog',
    'sap.m.UploadCollection',
    'sap.m.ObjectHeader',
    'sap.m.ObjectMarker',
    'sap.m.DraftIndicator',
    'sap.m.HeaderContainer',
    'sap.m.IconTabSeparator',
    'sap.m.TabContainerItem',
    'sap.m.FacetFilter',
    'sap.m.FacetFilterList',
    'sap.m.PDFViewer',
    'sap.m.ColorPalettePopover',
    'sap.m.SlideTile',
    'sap.m.LightBox',
    // Gap expansion — Top 70 + interactive + display + container
    'sap.m.VariantManagement',
    'sap.m.ColorPalette',
    'sap.m.DynamicDateRange',
    'sap.m.FeedInput',
    'sap.m.ExpandableText',
    'sap.m.QuickView',
    'sap.m.QuickViewCard',
    'sap.m.QuickViewPage',
    'sap.m.IllustratedMessage',
    'sap.m.ToolbarSpacer',
    'sap.m.ToolbarSeparator',
    'sap.m.TileContent',
    'sap.m.NotificationListGroup',
    'sap.m.SelectionDetails',
    'sap.m.IconTabHeader',
    // Gap expansion — p13n sub-namespace
    'sap.m.p13n.Popup',
    'sap.m.p13n.SelectionPanel',
    'sap.m.p13n.SortPanel',
    'sap.m.p13n.GroupPanel',
    // Gap expansion — table.columnmenu sub-namespace
    'sap.m.table.columnmenu.Menu',
  ],
  'sap.ui.table': [
    'sap.ui.table.Table',
    'sap.ui.table.TreeTable',
    'sap.ui.table.AnalyticalTable',
    'sap.ui.table.Column',
    'sap.ui.table.Row',
  ],
  'sap.f': [
    'sap.f.DynamicPage',
    'sap.f.DynamicPageTitle',
    'sap.f.DynamicPageHeader',
    'sap.f.FlexibleColumnLayout',
    'sap.f.Card',
    'sap.f.Avatar',
    'sap.f.GridContainer',
    'sap.f.ShellBar',
    // Gap expansion
    'sap.f.ProductSwitch',
    'sap.f.semantic.SemanticPage',
  ],
  'sap.uxap': [
    'sap.uxap.ObjectPageLayout',
    'sap.uxap.ObjectPageSection',
    'sap.uxap.ObjectPageSubSection',
    'sap.uxap.ObjectPageHeader',
    'sap.uxap.ObjectPageDynamicHeaderTitle',
    'sap.uxap.AnchorBar',
  ],
  'sap.ui.layout': [
    'sap.ui.layout.form.SimpleForm',
    'sap.ui.layout.Grid',
    'sap.ui.layout.Splitter',
    'sap.ui.layout.ResponsiveSplitter',
    'sap.ui.layout.form.Form',
    'sap.ui.layout.form.FormContainer',
    'sap.ui.layout.form.FormElement',
    'sap.ui.layout.VerticalLayout',
    'sap.ui.layout.HorizontalLayout',
    'sap.ui.layout.BlockLayout',
    'sap.ui.layout.BlockLayoutRow',
    'sap.ui.layout.BlockLayoutCell',
    'sap.ui.layout.DynamicSideContent',
  ],
  'sap.ui.core': [
    'sap.ui.core.Icon',
    'sap.ui.core.Item',
    'sap.ui.core.ListItem',
    'sap.ui.core.HTML',
    'sap.ui.core.ComponentContainer',
  ],
  'sap.ui.comp': [
    'sap.ui.comp.smarttable.SmartTable',
    'sap.ui.comp.smartfield.SmartField',
    'sap.ui.comp.smartfilterbar.SmartFilterBar',
    'sap.ui.comp.smartform.SmartForm',
    'sap.ui.comp.smartform.Group',
    'sap.ui.comp.smartform.GroupElement',
    'sap.ui.comp.valuehelpdialog.ValueHelpDialog',
    'sap.ui.comp.smartvariants.SmartVariantManagement',
    'sap.ui.comp.filterbar.FilterBar',
    'sap.ui.comp.navpopover.SmartLink',
    // Gap expansion
    'sap.ui.comp.smartchart.SmartChart',
    'sap.ui.comp.smartmultiinput.SmartMultiInput',
  ],
  'sap.ui.mdc': [
    'sap.ui.mdc.Table',
    'sap.ui.mdc.FilterBar',
    'sap.ui.mdc.Field',
    'sap.ui.mdc.ValueHelp',
    'sap.ui.mdc.Chart',
    'sap.ui.mdc.MultiValueField',
    // Gap expansion
    'sap.ui.mdc.FilterField',
  ],
  'sap.tnt': [
    'sap.tnt.SideNavigation',
    'sap.tnt.NavigationListItem',
    'sap.tnt.ToolPage',
    'sap.tnt.ToolHeader',
    // Gap expansion
    'sap.tnt.NavigationList',
    'sap.tnt.InfoLabel',
  ],
  'sap.ui.unified': [
    'sap.ui.unified.Calendar',
    'sap.ui.unified.FileUploader',
    'sap.ui.unified.ShellHeadItem',
    // Gap expansion
    'sap.ui.unified.Menu',
    'sap.ui.unified.MenuItem',
  ],
};

// ═══════════════════════════════════════════════════════════════════════
// Interface name overrides (to avoid naming collisions)
// ═══════════════════════════════════════════════════════════════════════
const NAME_OVERRIDES: Record<string, string> = {
  'sap.ui.table.Table': 'UI5GridTable',
  'sap.ui.table.TreeTable': 'UI5TreeTable',
  'sap.ui.table.AnalyticalTable': 'UI5AnalyticalTable',
  'sap.ui.table.Column': 'UI5TableColumn',
  'sap.ui.table.Row': 'UI5TableRow',
  'sap.ui.mdc.Table': 'UI5MdcTable',
  'sap.ui.mdc.FilterBar': 'UI5MdcFilterBar',
  'sap.ui.mdc.Field': 'UI5MdcField',
  'sap.ui.mdc.ValueHelp': 'UI5MdcValueHelp',
  'sap.ui.mdc.Chart': 'UI5MdcChart',
  'sap.ui.mdc.MultiValueField': 'UI5MdcMultiValueField',
  'sap.f.Avatar': 'UI5FAvatar',
  'sap.f.Card': 'UI5FCard',
  'sap.ui.layout.form.SimpleForm': 'UI5SimpleForm',
  'sap.ui.layout.form.Form': 'UI5Form',
  'sap.ui.layout.form.FormContainer': 'UI5FormContainer',
  'sap.ui.layout.form.FormElement': 'UI5FormElement',
  'sap.ui.comp.smarttable.SmartTable': 'UI5SmartTable',
  'sap.ui.comp.smartfield.SmartField': 'UI5SmartField',
  'sap.ui.comp.smartfilterbar.SmartFilterBar': 'UI5SmartFilterBar',
  'sap.ui.comp.smartform.SmartForm': 'UI5SmartForm',
  'sap.ui.comp.smartform.Group': 'UI5SmartFormGroup',
  'sap.ui.comp.smartform.GroupElement': 'UI5SmartFormGroupElement',
  'sap.ui.comp.valuehelpdialog.ValueHelpDialog': 'UI5ValueHelpDialog',
  'sap.ui.comp.smartvariants.SmartVariantManagement': 'UI5SmartVariantManagement',
  'sap.ui.comp.filterbar.FilterBar': 'UI5FilterBar',
  'sap.ui.comp.navpopover.SmartLink': 'UI5SmartLink',
  // Gap expansion — collision resolution (mandatory)
  'sap.m.table.columnmenu.Menu': 'UI5ColumnMenu',
  'sap.ui.unified.Menu': 'UI5UnifiedMenu',
  'sap.ui.unified.MenuItem': 'UI5UnifiedMenuItem',
  // Gap expansion — sub-namespace disambiguation
  'sap.m.p13n.Popup': 'UI5P13nPopup',
  'sap.m.p13n.SelectionPanel': 'UI5P13nSelectionPanel',
  'sap.m.p13n.SortPanel': 'UI5P13nSortPanel',
  'sap.m.p13n.GroupPanel': 'UI5P13nGroupPanel',
  'sap.f.semantic.SemanticPage': 'UI5FSemanticPage',
  // Gap expansion — MDC/Comp disambiguation
  'sap.ui.mdc.FilterField': 'UI5MdcFilterField',
  'sap.ui.comp.smartchart.SmartChart': 'UI5SmartChart',
  'sap.ui.comp.smartmultiinput.SmartMultiInput': 'UI5SmartMultiInput',
};

function getInterfaceName(controlName: string): string {
  if (NAME_OVERRIDES[controlName]) return NAME_OVERRIDES[controlName];
  const parts = controlName.split('.');
  return `UI5${parts[parts.length - 1]}`;
}

// ═══════════════════════════════════════════════════════════════════════
// Method blacklist — framework internals irrelevant for test automation
// ═══════════════════════════════════════════════════════════════════════
const METHOD_BLACKLIST = new Set([
  // Framework lifecycle
  'getMetadata',
  'extend',
  'destroy',
  'clone',
  'invalidate',
  'rerender',
  'placeAt',
  'init',
  'exit',
  'onBeforeRendering',
  'onAfterRendering',
  'applyFocusInfo',
  'getFocusInfo',
  'getFocusDomRef',
  'getAccessibilityInfo',
  'getPopupAnchorDomRef',
  'enhanceAccessibilityState',
  'getRenderer',
  // Style classes
  'addStyleClass',
  'removeStyleClass',
  'toggleStyleClass',
  'hasStyleClass',
  // Delegates
  'addDelegate',
  'removeDelegate',
  'addEventDelegate',
  'removeEventDelegate',
  // Busy state
  'setBusy',
  'getBusy',
  'setBusyIndicatorDelay',
  'getBusyIndicatorDelay',
  // Tooltip
  'setTooltip',
  'getTooltip',
  'getTooltip_AsString',
  'getTooltip_Text',
  // Layout
  'setLayoutData',
  'getLayoutData',
  'setFieldGroupIds',
  'getFieldGroupIds',
  // Labels
  'getIdForLabel',
  // Binding
  'bindProperty',
  'unbindProperty',
  'bindAggregation',
  'unbindAggregation',
  'bindElement',
  'unbindElement',
  'bindObject',
  'unbindObject',
  // Model (covered by UI5ControlBase)
  'setModel',
  'propagateProperties',
  // DOM (covered by UI5ControlBase or not safe in test)
  'getDomRef',
  '$',
  // Parent/owner (covered by UI5ControlBase)
  'getParent',
  'setParent',
  'getOwnerComponent',
  // Browser events
  'attachBrowserEvent',
  'detachBrowserEvent',
  // Covered by UI5ControlBase
  'getId',
  'getVisible',
  'setVisible',
  'isBound',
  'getModel',
  'getProperty',
  'setProperty',
  'getAggregation',
  'getBindingInfo',
  'getControlType',
  'getBindingContext',
  'setBindingContext',
  // CustomData, Dependents, DnD (boilerplate)
  'addCustomData',
  'removeCustomData',
  'removeAllCustomData',
  'getCustomData',
  'insertCustomData',
  'indexOfCustomData',
  'destroyCustomData',
  'addDependent',
  'removeDependent',
  'removeAllDependents',
  'getDependents',
  'insertDependent',
  'indexOfDependent',
  'destroyDependents',
  'addDragDropConfig',
  'removeDragDropConfig',
  'removeAllDragDropConfig',
  'getDragDropConfig',
  'insertDragDropConfig',
  'indexOfDragDropConfig',
  'destroyDragDropConfig',
  // Aria associations
  'addAriaDescribedBy',
  'removeAriaDescribedBy',
  'removeAllAriaDescribedBy',
  'getAriaDescribedBy',
  'addAriaLabelledBy',
  'removeAriaLabelledBy',
  'removeAllAriaLabelledBy',
  'getAriaLabelledBy',
]);

/** Properties to skip (noise for test automation) */
const PROPERTY_SKIP = new Set([
  'textDirection',
  'iconDensityAware',
  'highlightAccKeysRef',
  'accesskey',
  'ariaHasPopup',
  'accessibleRole',
  'badgeStyle',
]);

/** Pattern-based method exclusion */
function isExcludedByPattern(name: string): boolean {
  if (/^(attach|detach|fire)[A-Z]/.test(name)) return true;
  if (/^(add|insert|remove|removeAll|indexOf|destroy)[A-Z]/.test(name)) return true;
  if (/^(bind|unbind)[A-Z]/.test(name)) return true;
  if (/^on[a-z]/.test(name)) return true; // DOM event handlers like ontap
  if (name.startsWith('_')) return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════════════
// Framework convenience methods (NOT in the UI5 API — added by Praman)
// ═══════════════════════════════════════════════════════════════════════
const FRAMEWORK_METHODS: Record<string, string[]> = {
  'sap.m.Button': ['press(): Promise<void>;'],
  'sap.m.ToggleButton': ['press(): Promise<void>;'],
  'sap.m.Link': ['press(): Promise<void>;'],
  'sap.m.GenericTile': ['press(): Promise<void>;'],
  'sap.m.Dialog': ['isOpen(): Promise<boolean>;', 'close(): Promise<void>;'],
  'sap.m.Popover': ['isOpen(): Promise<boolean>;', 'close(): Promise<void>;'],
  'sap.m.ResponsivePopover': ['isOpen(): Promise<boolean>;', 'close(): Promise<void>;'],
  'sap.m.MessagePopover': ['isOpen(): Promise<boolean>;'],
  'sap.m.ActionSheet': ['isOpen(): Promise<boolean>;'],
  'sap.m.BusyDialog': ['isOpen(): Promise<boolean>;', 'close(): Promise<void>;'],
  'sap.m.LightBox': ['isOpen(): Promise<boolean>;', 'close(): Promise<void>;'],
  'sap.m.SelectDialog': ['isOpen(): Promise<boolean>;'],
  'sap.m.TableSelectDialog': ['isOpen(): Promise<boolean>;'],
  // Gap expansion — popup-like controls
  'sap.m.QuickView': ['isOpen(): Promise<boolean>;', 'close(): Promise<void>;'],
  'sap.m.VariantManagement': ['press(): Promise<void>;'],
  'sap.m.p13n.Popup': ['isOpen(): Promise<boolean>;', 'close(): Promise<void>;'],
  'sap.m.table.columnmenu.Menu': ['isOpen(): Promise<boolean>;', 'close(): Promise<void>;'],
  'sap.ui.unified.Menu': ['isOpen(): Promise<boolean>;', 'close(): Promise<void>;'],
};

// ═══════════════════════════════════════════════════════════════════════
// Control classifications
// ═══════════════════════════════════════════════════════════════════════
const INTERACTIVE_CONTROLS = new Set([
  'sap.m.Button',
  'sap.m.Input',
  'sap.m.CheckBox',
  'sap.m.RadioButton',
  'sap.m.ComboBox',
  'sap.m.MultiComboBox',
  'sap.m.Select',
  'sap.m.TextArea',
  'sap.m.DatePicker',
  'sap.m.DateTimePicker',
  'sap.m.SearchField',
  'sap.m.MultiInput',
  'sap.m.Switch',
  'sap.m.StepInput',
  'sap.m.SegmentedButton',
  'sap.m.Slider',
  'sap.m.ToggleButton',
  'sap.m.MenuButton',
  'sap.m.TimePicker',
  'sap.m.RangeSlider',
  'sap.m.MaskInput',
  'sap.m.Link',
  'sap.m.RatingIndicator',
  'sap.m.GenericTile',
  'sap.m.DateRangeSelection',
  'sap.m.ColorPalettePopover',
  'sap.m.PlanningCalendar',
  'sap.m.SinglePlanningCalendar',
  'sap.m.FacetFilter',
  'sap.m.FacetFilterList',
  'sap.ui.unified.Calendar',
  'sap.ui.unified.FileUploader',
  'sap.ui.comp.smartfield.SmartField',
  'sap.ui.comp.smartfilterbar.SmartFilterBar',
  'sap.ui.comp.filterbar.FilterBar',
  'sap.ui.mdc.Field',
  'sap.ui.mdc.FilterBar',
  'sap.ui.mdc.MultiValueField',
  // Gap expansion
  'sap.m.VariantManagement',
  'sap.m.ColorPalette',
  'sap.m.DynamicDateRange',
  'sap.m.FeedInput',
  'sap.m.SelectionDetails',
  'sap.m.QuickView',
  'sap.ui.comp.smartchart.SmartChart',
  'sap.ui.comp.smartmultiinput.SmartMultiInput',
  'sap.ui.mdc.FilterField',
  'sap.ui.unified.Menu',
  'sap.tnt.NavigationList',
]);

const CONTAINER_CONTROLS = new Set([
  'sap.m.Page',
  'sap.m.Panel',
  'sap.m.ScrollContainer',
  'sap.m.FlexBox',
  'sap.m.HBox',
  'sap.m.VBox',
  'sap.m.Dialog',
  'sap.m.Popover',
  'sap.m.List',
  'sap.m.Table',
  'sap.m.Tree',
  'sap.f.DynamicPage',
  'sap.f.FlexibleColumnLayout',
  'sap.uxap.ObjectPageLayout',
  'sap.ui.layout.form.SimpleForm',
  'sap.m.NavContainer',
  'sap.m.SplitApp',
  'sap.m.App',
  'sap.m.Carousel',
  'sap.m.SplitContainer',
  'sap.m.HeaderContainer',
  'sap.f.GridContainer',
  'sap.m.ResponsivePopover',
  'sap.ui.layout.form.Form',
  'sap.ui.layout.VerticalLayout',
  'sap.ui.layout.HorizontalLayout',
  'sap.ui.layout.BlockLayout',
  // Gap expansion
  'sap.m.NotificationListGroup',
  'sap.m.QuickView',
  'sap.m.QuickViewPage',
  'sap.m.IconTabHeader',
  'sap.m.TileContent',
  'sap.m.p13n.Popup',
  'sap.f.semantic.SemanticPage',
  'sap.tnt.NavigationList',
]);

// ═══════════════════════════════════════════════════════════════════════
// Deprecation tracking
// ═══════════════════════════════════════════════════════════════════════
interface DeprecatedInfo {
  since?: string;
  text?: string;
}

interface DeprecatedEntry {
  control: string;
  kind: 'method' | 'property' | 'aggregation' | 'event';
  name: string;
  since?: string;
  text?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// API JSON types
// ═══════════════════════════════════════════════════════════════════════
interface ApiJson {
  version: string;
  library: string;
  symbols: ApiSymbol[];
}

interface ApiSymbol {
  kind: string;
  name: string;
  extends?: string;
  'ui5-metadata'?: {
    properties?: ApiProperty[];
    aggregations?: ApiAggregation[];
    events?: ApiEvent[];
    associations?: ApiAssociation[];
  };
  methods?: ApiMethod[];
}

interface ApiProperty {
  name: string;
  type: string;
  visibility: string;
  deprecated?: DeprecatedInfo;
  methods?: string[];
}

interface ApiAggregation {
  name: string;
  type: string;
  cardinality: string;
  visibility: string;
  deprecated?: DeprecatedInfo;
  methods?: string[];
}

interface ApiEvent {
  name: string;
  visibility: string;
  deprecated?: DeprecatedInfo;
  methods?: string[];
}

interface ApiAssociation {
  name: string;
  type: string;
  cardinality: string;
  visibility: string;
  methods?: string[];
}

interface ApiMethod {
  name: string;
  visibility: string;
  static?: boolean;
  deprecated?: DeprecatedInfo;
  returnValue?: { type: string };
  parameters?: Array<{ name: string; type: string; optional?: boolean }>;
}

// ═══════════════════════════════════════════════════════════════════════
// Type mapping: UI5 → TypeScript
// ═══════════════════════════════════════════════════════════════════════
const aggregationTypeCache = new Set<string>();

function mapUI5Type(ui5Type: string): string {
  if (!ui5Type) return 'unknown';

  // Union types — flatten, deduplicate, collapse
  if (ui5Type.includes('|')) {
    const rawParts = ui5Type.split('|').map((p) => mapUI5Type(p.trim()));

    // Flatten nested unions (e.g., "Date | null" split further)
    const flat = new Set<string>();
    for (const part of rawParts) {
      if (part.includes(' | ')) {
        for (const sub of part.split(' | ')) flat.add(sub.trim());
      } else {
        flat.add(part);
      }
    }

    // If unknown present, collapse to unknown
    if (flat.has('unknown')) return 'unknown';

    // Remove void from unions (void is only valid as standalone return type)
    flat.delete('void');
    if (flat.size === 0) return 'void';

    const unique = [...flat];
    return unique.length === 1 ? unique[0] : unique.join(' | ');
  }

  // Array types
  if (ui5Type.endsWith('[]')) {
    const inner = ui5Type.slice(0, -2);
    if (isControlType(inner)) return 'readonly UI5ControlBase[]';
    if (inner === 'string' || inner === 'sap.ui.core.ID') return 'readonly string[]';
    if (inner === 'int' || inner === 'number') return 'readonly number[]';
    return `readonly ${mapUI5Type(inner)}[]`;
  }

  // Primitives
  switch (ui5Type) {
    case 'string':
      return 'string';
    case 'boolean':
      return 'boolean';
    case 'int':
    case 'float':
    case 'number':
      return 'number';
    case 'object':
      return 'unknown';
    case 'any':
      return 'unknown';
    case 'void':
    case 'undefined':
      return 'void';
    case 'this':
      return 'void';
    case 'Date':
      return 'Date';
    case 'Element':
      return 'Element';
    case 'HTMLElement':
      return 'HTMLElement';
    case 'function':
      return 'unknown';
    case 'null':
      return 'null';
  }

  // Control/element types → base type only (null added by caller for 0..1 aggs)
  if (isControlType(ui5Type)) return 'UI5ControlBase';

  // SAP type aliases
  if (ui5Type === 'sap.ui.core.CSSSize') return 'string';
  if (ui5Type === 'sap.ui.core.URI') return 'string';
  if (ui5Type === 'sap.ui.core.ID') return 'string';
  if (ui5Type === 'sap.ui.core.Percentage') return 'string';

  // Most sap.* enum types → string
  if (ui5Type.startsWith('sap.')) return 'string';

  return 'unknown';
}

function isControlType(type: string): boolean {
  if (type === 'sap.ui.core.Control') return true;
  if (type === 'sap.ui.core.Element') return true;
  if (type === 'sap.ui.base.ManagedObject') return true;
  if (aggregationTypeCache.has(type)) return true;
  return false;
}

// ═══════════════════════════════════════════════════════════════════════
// Fetching + caching
// ═══════════════════════════════════════════════════════════════════════
async function fetchLibraryApi(lib: string): Promise<ApiJson | null> {
  const cacheFile = join(CACHE_DIR, `${lib.replace(/\./g, '-')}-${UI5_VERSION}.json`);

  if (!FRESH && existsSync(cacheFile)) {
    console.log(`  [cache] ${lib}`);
    return JSON.parse(readFileSync(cacheFile, 'utf-8')) as ApiJson;
  }

  const url = cdnUrl(lib);
  console.log(`  [fetch] ${lib} → ${url}`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  [warn]  ${lib}: HTTP ${response.status} — skipping`);
      return null;
    }
    const data = (await response.json()) as ApiJson;
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cacheFile, JSON.stringify(data));
    return data;
  } catch (err) {
    console.warn(`  [warn]  ${lib}: ${(err as Error).message} — skipping`);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// Method extraction from a single control symbol
// ═══════════════════════════════════════════════════════════════════════
interface MethodSig {
  name: string;
  line: string; // e.g., "getText(): Promise<string>;"
}

function extractMethods(
  symbol: ApiSymbol,
  controlName: string,
  deprecatedCollector: DeprecatedEntry[],
): MethodSig[] {
  const results: MethodSig[] = [];
  const meta = symbol['ui5-metadata'];

  // Build lookup maps from metadata for precise type resolution
  const propGetters = new Map<string, string>(); // methodName → ui5Type
  const propSetters = new Map<string, string>();
  const aggGetters = new Map<string, { type: string; card: string }>();
  const skippedMethods = new Set<string>(); // methods from PROPERTY_SKIP properties

  if (meta) {
    for (const prop of meta.properties ?? []) {
      if (prop.visibility !== 'public') continue;
      if (prop.deprecated) {
        deprecatedCollector.push({
          control: controlName,
          kind: 'property',
          name: prop.name,
          since: prop.deprecated.since,
          text: prop.deprecated.text,
        });
        continue;
      }
      if (PROPERTY_SKIP.has(prop.name)) {
        for (const m of prop.methods ?? []) skippedMethods.add(m);
        continue;
      }
      for (const m of prop.methods ?? []) {
        if (m.startsWith('get')) propGetters.set(m, prop.type);
        if (m.startsWith('set')) propSetters.set(m, prop.type);
      }
    }
    for (const agg of meta.aggregations ?? []) {
      if (agg.visibility !== 'public') continue;
      if (agg.deprecated) {
        deprecatedCollector.push({
          control: controlName,
          kind: 'aggregation',
          name: agg.name,
          since: agg.deprecated.since,
          text: agg.deprecated.text,
        });
        continue;
      }
      aggregationTypeCache.add(agg.type);
      for (const m of agg.methods ?? []) {
        if (m.startsWith('get')) aggGetters.set(m, { type: agg.type, card: agg.cardinality });
      }
    }
    for (const evt of meta.events ?? []) {
      if (evt.visibility !== 'public') continue;
      if (evt.deprecated) {
        deprecatedCollector.push({
          control: controlName,
          kind: 'event',
          name: evt.name,
          since: evt.deprecated.since,
          text: evt.deprecated.text,
        });
      }
    }
  }

  const seen = new Set<string>();
  for (const method of symbol.methods ?? []) {
    if (method.visibility !== 'public') continue;
    if (method.static) continue;
    if (method.deprecated) {
      deprecatedCollector.push({
        control: controlName,
        kind: 'method',
        name: method.name,
        since: method.deprecated.since,
        text: method.deprecated.text,
      });
      continue;
    }
    if (METHOD_BLACKLIST.has(method.name)) continue;
    if (skippedMethods.has(method.name)) continue;
    if (isExcludedByPattern(method.name)) continue;
    if (seen.has(method.name)) continue;
    seen.add(method.name);

    // Determine return type
    let returnType: string;
    if (propGetters.has(method.name)) {
      returnType = mapUI5Type(propGetters.get(method.name)!);
    } else if (aggGetters.has(method.name)) {
      const a = aggGetters.get(method.name)!;
      returnType = a.card === '0..n' ? 'readonly UI5ControlBase[]' : 'UI5ControlBase | null';
    } else if (propSetters.has(method.name)) {
      returnType = 'void';
    } else {
      const raw = method.returnValue?.type ?? 'void';
      returnType = raw === 'this' ? 'void' : mapUI5Type(raw);
    }

    // Build params
    let params = '';
    if (propSetters.has(method.name) && method.parameters?.length) {
      const pType = mapUI5Type(propSetters.get(method.name)!);
      params = `${method.parameters[0].name}: ${pType}`;
    } else if (method.parameters?.length) {
      const pStrs: string[] = [];
      for (const p of method.parameters) {
        const mapped = mapUI5Type(p.type);
        if (mapped === 'unknown' && !p.optional) continue; // skip complex params
        pStrs.push(p.optional ? `${p.name}?: ${mapped}` : `${p.name}: ${mapped}`);
      }
      params = pStrs.join(', ');
    }

    results.push({ name: method.name, line: `${method.name}(${params}): Promise<${returnType}>;` });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// Interface generation
// ═══════════════════════════════════════════════════════════════════════
function generateInterface(
  controlName: string,
  symbol: ApiSymbol,
  deprecatedCollector: DeprecatedEntry[],
): string {
  const ifName = getInterfaceName(controlName);
  const methods = extractMethods(symbol, controlName, deprecatedCollector);

  // Framework overrides
  const overrides = FRAMEWORK_METHODS[controlName] ?? [];
  const overrideNames = new Set(overrides.map((o) => o.split('(')[0]));

  const lines: string[] = [];
  lines.push(`/**`);
  lines.push(` * Typed proxy interface for \`${controlName}\` controls.`);
  lines.push(` *`);
  lines.push(
    ` * @see {@link https://ui5.sap.com/#/api/${controlName} | ${controlName} API Reference}`,
  );
  lines.push(` */`);
  lines.push(`export interface ${ifName} extends UI5ControlBase {`);
  lines.push(`  readonly controlType: '${controlName}';`);

  for (const m of methods) {
    if (!overrideNames.has(m.name)) {
      lines.push(`  ${m.line}`);
    }
  }
  for (const o of overrides) {
    lines.push(`  ${o}`);
  }

  lines.push('}');
  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════
// Full file assembly
// ═══════════════════════════════════════════════════════════════════════
function assembleFile(
  interfaces: Array<{ controlName: string; code: string; lib: string }>,
): string {
  const allControlNames = interfaces.map((i) => i.controlName);
  const sections: string[] = [];

  // File header
  sections.push(`/**`);
  sections.push(` * @license`);
  sections.push(` * Copyright (c) ZesTest 2025-2030. All Rights Reserved.`);
  sections.push(` * SPDX-License-Identifier: Apache-2.0`);
  sections.push(` *`);
  sections.push(` * This file may contain AI-assisted code.`);
  sections.push(` * See LICENSE and NOTICE files for details.`);
  sections.push(` */`);
  sections.push(``);
  sections.push(
    `/* eslint-disable max-lines, sonarjs/use-type-alias -- Auto-generated: ${interfaces.length}+ control interfaces */`,
  );
  sections.push(`/**`);
  sections.push(` * Auto-generated typed UI5 control interfaces for SAP Fiori test automation.`);
  sections.push(` *`);
  sections.push(` * DO NOT EDIT MANUALLY — regenerate with:`);
  sections.push(` *   npx tsx scripts/generate-typed-proxies.ts`);
  sections.push(` *`);
  sections.push(` * Source: SAP UI5 API (v${UI5_VERSION})`);
  sections.push(` * Generated: ${new Date().toISOString().split('T')[0]}`);
  sections.push(` * Controls: ${interfaces.length}`);
  sections.push(` *`);
  sections.push(` * All control methods return \`Promise<T>\` — resolved via bridge adapter.`);
  sections.push(` *`);
  sections.push(` * @module types`);
  sections.push(` */`);
  sections.push('');

  // UI5ControlBase (hand-written, always the same)
  sections.push(UI5_CONTROL_BASE);
  sections.push('');

  // Group by library
  const byLib = new Map<string, typeof interfaces>();
  for (const iface of interfaces) {
    const arr = byLib.get(iface.lib) ?? [];
    arr.push(iface);
    byLib.set(iface.lib, arr);
  }

  for (const [lib, items] of byLib) {
    sections.push(`// ${'═'.repeat(71)}`);
    sections.push(`// ${lib}`);
    sections.push(`// ${'═'.repeat(71)}`);
    sections.push('');
    for (const item of items) {
      sections.push(item.code);
      sections.push('');
    }
  }

  // UI5Control discriminated union
  sections.push(`// ${'═'.repeat(71)}`);
  sections.push('// Discriminated Union — Control Type Map');
  sections.push(`// ${'═'.repeat(71)}`);
  sections.push('');
  sections.push('/**');
  sections.push(' * Discriminated union of all known UI5 control interfaces.');
  sections.push(' *');
  sections.push(' * @remarks');
  sections.push(' * Used by the proxy layer to narrow control types based on `controlType`.');
  sections.push(' *');
  sections.push(' * @example');
  sections.push(' * ```typescript');
  sections.push(" * import type { UI5Control } from '#core/types/controls.js';");
  sections.push(' *');
  sections.push(' * function handleControl(control: UI5Control): void {');
  sections.push(' *   switch (control.controlType) {');
  sections.push(" *     case 'sap.m.Button': control.press(); break;");
  sections.push(" *     case 'sap.m.Input': control.setValue(''); break;");
  sections.push(' *   }');
  sections.push(' * }');
  sections.push(' * ```');
  sections.push(' */');
  sections.push('export type UI5Control =');
  for (let i = 0; i < allControlNames.length; i++) {
    const sep = i === allControlNames.length - 1 ? ';' : '';
    sections.push(`  | ${getInterfaceName(allControlNames[i])}${sep}`);
  }
  sections.push('');

  // UI5ControlMap
  sections.push('/**');
  sections.push(' * Maps control type strings to their typed interfaces.');
  sections.push(' *');
  sections.push(' * @remarks');
  sections.push(" * Used by the proxy layer's generic `control<T>()` method.");
  sections.push(' *');
  sections.push(' * @example');
  sections.push(' * ```typescript');
  sections.push(" * type ButtonType = UI5ControlMap['sap.m.Button']; // UI5Button");
  sections.push(' * ```');
  sections.push(' */');
  sections.push('export interface UI5ControlMap {');
  for (const name of allControlNames) {
    sections.push(`  '${name}': ${getInterfaceName(name)};`);
  }
  sections.push('}');
  sections.push('');

  // InteractiveControlType
  const interactiveList = allControlNames.filter((n) => INTERACTIVE_CONTROLS.has(n));
  sections.push('/**');
  sections.push(' * String literal union of interactive control types.');
  sections.push(' *');
  sections.push(' * @remarks');
  sections.push(' * Controls that accept user input and fire events.');
  sections.push(' */');
  sections.push('export type InteractiveControlType =');
  for (let i = 0; i < interactiveList.length; i++) {
    const sep = i === interactiveList.length - 1 ? ';' : '';
    sections.push(`  | '${interactiveList[i]}'${sep}`);
  }
  sections.push('');

  // ContainerControlType
  const containerList = allControlNames.filter((n) => CONTAINER_CONTROLS.has(n));
  sections.push('/**');
  sections.push(' * String literal union of container control types.');
  sections.push(' *');
  sections.push(' * @remarks');
  sections.push(' * Controls that hold child controls in aggregations.');
  sections.push(' */');
  sections.push('export type ContainerControlType =');
  for (let i = 0; i < containerList.length; i++) {
    const sep = i === containerList.length - 1 ? ';' : '';
    sections.push(`  | '${containerList[i]}'${sep}`);
  }
  sections.push('');

  return sections.join('\n');
}

// ═══════════════════════════════════════════════════════════════════════
// UI5ControlBase — hand-written, preserved exactly
// ═══════════════════════════════════════════════════════════════════════
const UI5_CONTROL_BASE = `/**
 * Base interface all UI5 controls extend.
 *
 * @remarks
 * Maps to \`sap.ui.core.Element\` / \`sap.ui.core.Control\` base methods.
 * All methods return \`Promise<T>\` because they execute via the bridge
 * adapter in the browser context.
 *
 * @example
 * \`\`\`typescript
 * import type { UI5ControlBase } from '#core/types/controls.js';
 *
 * async function logControl(control: UI5ControlBase): Promise<void> {
 *   const id = await control.getId();
 *   const type = await control.getControlType();
 *   console.log(\`\${type}#\${id}\`);
 * }
 * \`\`\`
 */
export interface UI5ControlBase {
  /** Fully qualified control type, e.g., \`'sap.m.Button'\`. */
  readonly controlType: string;
  /** Control ID assigned in the UI5 view or generated. */
  readonly id: string;

  /** Returns the control's ID. */
  getId(): Promise<string>;
  /**
   * Returns the fully qualified control type name.
   *
   * @remarks
   * Praman proxy convenience — equivalent to \`getMetadata().getName()\` in native UI5.
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
  /** Returns whether the control is visible (\`getVisible()\` on \`sap.ui.core.Control\`). */
  getVisible(): Promise<boolean>;
  /** Returns whether a property is data-bound. */
  isBound(propertyName: string): Promise<boolean>;
  /** Returns the named model, or the default model if no name given. */
  getModel(name?: string): Promise<unknown>;
}`;

// ═══════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════
async function main(): Promise<void> {
  console.log(`\nUI5 Typed Proxy Generator — v${UI5_VERSION}`);
  console.log('─'.repeat(50));

  // Collect all target control names (in order)
  const allTargetNames: string[] = [];
  for (const controls of Object.values(TARGET_CONTROLS)) {
    for (const c of controls) allTargetNames.push(c);
  }

  // Detect naming collisions
  const nameMap = new Map<string, string>();
  for (const c of allTargetNames) {
    const ifName = getInterfaceName(c);
    if (nameMap.has(ifName) && nameMap.get(ifName) !== c) {
      console.error(`  [ERROR] Name collision: ${ifName} ← ${nameMap.get(ifName)} AND ${c}`);
      console.error('  Add an entry to NAME_OVERRIDES to resolve.');
      process.exit(1);
    }
    nameMap.set(ifName, c);
  }

  console.log(
    `\nTargets: ${allTargetNames.length} controls across ${Object.keys(TARGET_CONTROLS).length} libraries`,
  );
  console.log('\nFetching API data...');

  // Fetch all libraries
  const libraryData = new Map<string, ApiJson>();
  for (const lib of Object.keys(TARGET_CONTROLS)) {
    const data = await fetchLibraryApi(lib);
    if (data) libraryData.set(lib, data);
  }

  console.log('\nProcessing controls...');

  // Build symbol lookup per library
  const symbolLookup = new Map<string, ApiSymbol>();
  for (const [, data] of libraryData) {
    for (const sym of data.symbols) {
      if (sym.kind === 'class') {
        symbolLookup.set(sym.name, sym);
      }
    }
  }

  // Generate interfaces
  const interfaces: Array<{ controlName: string; code: string; lib: string }> = [];
  const allDeprecated: DeprecatedEntry[] = [];
  let found = 0;
  let missing = 0;

  for (const [lib, controls] of Object.entries(TARGET_CONTROLS)) {
    for (const controlName of controls) {
      const symbol = symbolLookup.get(controlName);
      if (!symbol) {
        console.warn(`  [miss]  ${controlName} — not found in api.json`);
        missing++;
        continue;
      }
      const code = generateInterface(controlName, symbol, allDeprecated);
      interfaces.push({ controlName, code, lib });
      found++;
    }
  }

  console.log(`\n  Found: ${found}  |  Missing: ${missing}  |  Total: ${found + missing}`);

  // Assemble
  const output = assembleFile(interfaces);
  const lineCount = output.split('\n').length;

  if (DRY_RUN) {
    console.log('\n--- DRY RUN (first 100 lines) ---\n');
    console.log(output.split('\n').slice(0, 100).join('\n'));
    console.log(`\n... (${lineCount} total lines)`);
  } else {
    writeFileSync(OUTPUT_FILE, output + '\n', 'utf-8');
    console.log(`\nWrote ${OUTPUT_FILE}`);
    console.log(`  ${interfaces.length} interfaces  |  ${lineCount} lines`);
  }

  // Emit deprecation report
  const reportByControl: Record<string, Omit<DeprecatedEntry, 'control'>[]> = {};
  for (const entry of allDeprecated) {
    (reportByControl[entry.control] ??= []).push({
      kind: entry.kind,
      name: entry.name,
      since: entry.since,
      text: entry.text,
    });
  }
  const deprecatedNames = [...new Set(allDeprecated.map((e) => e.name))].sort();
  const report = {
    version: UI5_VERSION,
    generated: new Date().toISOString(),
    totalDeprecated: allDeprecated.length,
    deprecatedNames,
    controls: reportByControl,
  };
  writeFileSync(DEPRECATION_REPORT, JSON.stringify(report, null, 2) + '\n', 'utf-8');
  console.log(
    `  Deprecation report: ${allDeprecated.length} items (${deprecatedNames.length} unique names) → ${DEPRECATION_REPORT}`,
  );

  // Summary
  const interactiveCount = interfaces.filter((i) => INTERACTIVE_CONTROLS.has(i.controlName)).length;
  const containerCount = interfaces.filter((i) => CONTAINER_CONTROLS.has(i.controlName)).length;
  console.log(`\n  Interactive: ${interactiveCount}  |  Container: ${containerCount}`);
  console.log('  Done.\n');
}

main().catch((err: unknown) => {
  console.error('Fatal:', err);
  process.exit(1);
});
