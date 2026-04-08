/**
 * Shared types for the documentation accuracy verification pipeline.
 *
 * Each doc file is treated as a "unit under test" — run through all checks
 * and given a single pass/fail verdict.
 */

/** One doc file = one unit under test */
export interface DocUnderTest {
  /** Relative path from repo root, e.g. 'docs/docs/guides/fixtures.md' */
  filePath: string;
  /** Short name for display, e.g. 'guides/fixtures.md' */
  shortName: string;
  /** Raw markdown content */
  content: string;
  /** Frontmatter metadata */
  frontmatter: Record<string, unknown>;
  /** Source files mapped via doc-source-map.yaml */
  mappedSourceFiles: string[];
}

/** All check names */
export type CheckName =
  | 'typecheck-snippets'
  | 'api-references'
  | 'config-defaults'
  | 'import-paths'
  | 'claim-tests'
  | 'example-test-map'
  | 'ai-review'
  | 'sap-ui5-api';

/** Result of a single check against a single doc */
export interface CheckResult {
  check: CheckName;
  status: 'pass' | 'fail' | 'skip' | 'warn';
  errors: CheckFinding[];
  warnings: CheckFinding[];
  /** Why this check was skipped (e.g., "no code blocks found") */
  skipReason?: string | undefined;
  /** Milliseconds taken */
  durationMs: number;
}

/** A single finding (error or warning) from a check */
export interface CheckFinding {
  severity: 'error' | 'warning';
  line?: number | undefined;
  message: string;
  details?: string | undefined;
  suggestion?: string | undefined;
}

/** Aggregated result for one doc file */
export interface DocVerdict {
  filePath: string;
  shortName: string;
  verdict: 'pass' | 'fail' | 'warn';
  checks: CheckResult[];
  totalErrors: number;
  totalWarnings: number;
  durationMs: number;
}

/** Top-level report */
export interface VerificationReport {
  timestamp: string;
  mode: 'pr' | 'full';
  totalDocs: number;
  passed: number;
  failed: number;
  warned: number;
  skipped: number;
  docs: DocVerdict[];
  aiCostUsd?: number | undefined;
  durationMs: number;
}

/** Interface every check must implement */
export interface DocCheck {
  name: CheckName;
  /** Run this check against a single doc. Return CheckResult. */
  run(doc: DocUnderTest, context: SharedContext): Promise<CheckResult>;
}

/** Expensive data computed once, shared across all docs and checks */
export interface SharedContext {
  /** All actual exports from 6 entry points (ts-morph) */
  apiSurface: Map<string, ApiSymbol>;
  /** All config keys and their Zod defaults */
  configDefaults: Map<string, ConfigDefault>;
  /** Claim test results (vitest run once, shared) */
  claimTestResults: Map<string, 'pass' | 'fail'>;
  /** All test files indexed */
  testIndex: TestIndex;
  /** Mapping from doc code block → test file + test name */
  exampleTestMap: ExampleTestMapping[];
  /** All vitest results by test name */
  vitestResults: Map<string, 'pass' | 'fail' | 'skip'>;
  /** SAP UI5 API metadata cache */
  ui5ApiCache: Map<string, UI5ControlMetadata | undefined>;
  /** Changed files in this PR (empty in full mode) */
  changedFiles: string[];
}

/** A symbol found in the package's public API surface */
export interface ApiSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'enum';
  entryPoint: string;
}

/** A config key with its actual default value */
export interface ConfigDefault {
  type: string;
  defaultValue: unknown;
}

/** Extracted code block from markdown */
export interface CodeBlock {
  /** The code content */
  code: string;
  /** Language tag (typescript, ts, tsx, bash, etc.) */
  language: string;
  /** Line number in the source doc where the block starts */
  startLine: number;
  /** Content of the HTML comment immediately before this block */
  precedingComment?: string | undefined;
  /** Meta string after the language tag (e.g., title="pseudo-code") */
  meta?: string | undefined;
}

/** A symbol mentioned in a doc */
export interface MentionedSymbol {
  name: string;
  line: number;
}

/** An import statement extracted from a doc */
export interface ImportStatement {
  source: string;
  specifiers: string[];
  line: number;
}

/** A documented config default value */
export interface DocumentedDefault {
  key: string;
  documentedDefault: string;
  line: number;
}

/** A claim tag found in a doc */
export interface ClaimTag {
  testId: string;
  line: number;
}

/** Explicit mapping: doc code block → backing test */
export interface ExampleTestMapping {
  docFile: string;
  blockId: string;
  testFile: string;
  testName?: string | undefined;
}

/** Index of all test files and their contents */
export interface TestIndex {
  files: Map<string, TestFileInfo>;
}

/** Parsed info about a single test file */
export interface TestFileInfo {
  filePath: string;
  testNames: string[];
  /** Normalized code patterns for fuzzy matching */
  codePatterns: string[];
  /** Raw content for exact matching */
  content: string;
}

/** Cached metadata from ui5.sap.com API for a single control */
export interface UI5ControlMetadata {
  name: string;
  kind: 'class' | 'enum' | 'namespace' | 'interface';
  deprecated?: { since: string; text?: string | undefined } | undefined;
  properties: Map<string, UI5Property>;
  methods: Map<string, UI5Method>;
  events: Map<string, UI5Event>;
  aggregations: Map<string, UI5Aggregation>;
}

export interface UI5Property {
  name: string;
  type: string;
  deprecated?: { since: string } | undefined;
}

export interface UI5Method {
  name: string;
  returnType?: string | undefined;
  deprecated?: { since: string } | undefined;
}

export interface UI5Event {
  name: string;
  deprecated?: { since: string } | undefined;
}

export interface UI5Aggregation {
  name: string;
  type: string;
  deprecated?: { since: string } | undefined;
}

/** SAP UI5 references extracted from a doc */
export interface SapUi5References {
  controlTypes: Array<{ name: string; line: number }>;
  propertyUsages: Array<{ controlType: string; properties: string[]; line: number }>;
  methodCalls: Array<{ controlType: string; methodName: string; line: number }>;
  eventNames: Array<{ controlType: string; eventName: string; line: number }>;
}

/** API call pattern for test matching */
export interface ApiCallPattern {
  /** e.g., 'ui5.control', 'sapAuth.login' */
  method: string;
  /** Signature of args for search */
  argsSignature: string;
  /** Regex to search test files */
  searchRegex: string;
}

/** CLI options */
export interface VerifyOptions {
  mode: 'pr' | 'full';
  doc?: string | undefined;
  failOn: 'error' | 'warning';
  checks?: number[] | undefined;
  verbose: boolean;
}
