/**
 * Core type definitions barrel — re-exports for `#core/types`.
 *
 * @module types
 */

// ── Literal union types (config.ts) ─────────────────────────────────
export type {
  AIProvider,
  AuthStrategy,
  InteractionStrategy,
  LogLevel,
  TelemetryExporter,
} from './config.js';

// NOTE: PramanConfig is NOT re-exported from here.
// It lives in core/config/schema.ts to avoid circular dependency.
// Import it from '#core/config/schema.js' or '#core/config/index.js'.

// ── Selector types (selectors.ts) ───────────────────────────────────
export type {
  SerializedUI5Selector,
  UI5Interaction,
  UI5Selector,
  UI5SelectorString,
} from './selectors.js';
export { deserializeRegExpId, serializeSelectorForBrowser } from './selectors.js';

// ── Bridge types (bridge.ts) ────────────────────────────────────────
export type { BridgeMethodDescriptor, BridgeResult, BridgeReturnType } from './bridge.js';

// ── Validation types (validation.ts) ────────────────────────────────
export type { ValidationIssue } from './validation.js';

// ── Control types (controls.ts) ─────────────────────────────────────
export type {
  ContainerControlType,
  InteractiveControlType,
  UI5Control,
  UI5ControlBase,
  UI5ControlMap,
  // Input controls
  UI5Button,
  UI5CheckBox,
  UI5ComboBox,
  UI5DatePicker,
  UI5DateTimePicker,
  UI5Input,
  UI5MaskInput,
  UI5MenuButton,
  UI5MultiComboBox,
  UI5MultiInput,
  UI5RadioButton,
  UI5RadioButtonGroup,
  UI5RangeSlider,
  UI5SearchField,
  UI5SegmentedButton,
  UI5Select,
  UI5Slider,
  UI5SplitButton,
  UI5StepInput,
  UI5Switch,
  UI5TextArea,
  UI5TimePicker,
  UI5ToggleButton,
  UI5Token,
  UI5UploadSet,
  // Display controls
  UI5Avatar,
  UI5FormattedText,
  UI5Image,
  UI5Label,
  UI5Link,
  UI5Text,
  UI5Title,
  // Indicator controls
  UI5BusyIndicator,
  UI5MessageStrip,
  UI5ObjectNumber,
  UI5ObjectStatus,
  UI5ProgressIndicator,
  UI5RatingIndicator,
  // Tile controls
  UI5FeedListItem,
  UI5GenericTile,
  UI5NumericContent,
  UI5ObjectAttribute,
  UI5ObjectIdentifier,
  // List controls
  UI5ColumnListItem,
  UI5List,
  UI5ListBase,
  UI5ObjectListItem,
  UI5SelectList,
  UI5StandardListItem,
  UI5Table,
  UI5Tree,
  // Dialog controls
  UI5ActionSheet,
  UI5Dialog,
  UI5MessageBox,
  UI5MessagePopover,
  UI5MessageToast,
  UI5Popover,
  UI5ResponsivePopover,
  UI5ViewSettingsDialog,
  // Navigation controls
  UI5Bar,
  UI5Breadcrumbs,
  UI5IconTabBar,
  UI5IconTabFilter,
  UI5Menu,
  UI5MenuItem,
  UI5OverflowToolbar,
  UI5TabContainer,
  UI5Toolbar,
  UI5Wizard,
  UI5WizardStep,
  // Container controls
  UI5Carousel,
  UI5FlexBox,
  UI5HBox,
  UI5Page,
  UI5Panel,
  UI5ScrollContainer,
  UI5SplitContainer,
  UI5VBox,
  // Layout library
  UI5Grid,
  UI5SimpleForm,
  // Desktop table
  UI5GridTable,
  // Fiori library
  UI5DynamicPage,
  UI5FlexibleColumnLayout,
  // UX patterns
  UI5ObjectPageLayout,
  UI5ObjectPageSection,
  // Core
  UI5Icon,
} from './controls.js';
