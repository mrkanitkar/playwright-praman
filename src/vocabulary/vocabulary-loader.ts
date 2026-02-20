/**
 * Vocabulary loader — reads domain JSON files from disk and parses them
 * into {@link VocabularyTerm} maps.
 *
 * @remarks
 * JSON files follow the Praman vocabulary domain schema:
 * `{ domain, ui5Selectors: { [section]: { [subsection]: { [fieldKey]: FieldDef } } } }`
 *
 * Each field definition has:
 * - `labelFor.text` — human-readable label (used as selector)
 * - `aliases` — synonym array
 * - `sapFieldName` — ABAP field name
 * - `hasValueHelp` — boolean F4 flag
 * - `intentApiMethod` — preferred interaction method
 *
 * No external dependencies beyond `node:fs/promises` and `node:path`.
 *
 * @module vocabulary
 */

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import type { SAPDomain, VocabularyTerm } from './types.js';

import { ErrorCode } from '#core/errors/codes.js';
import { VocabularyError } from '#core/errors/index.js';
import type { UI5Selector } from '#core/types/selectors.js';

/** Raw field definition shape from the domain JSON files. */
interface RawFieldDef {
  readonly labelFor?: { readonly text?: string };
  readonly intentApiMethod?: string;
  readonly hasValueHelp?: boolean;
  readonly sapFieldName?: string;
  readonly businessContext?: string;
  readonly aliases?: readonly string[];
  readonly controlType?: string;
  readonly properties?: Readonly<Record<string, unknown>>;
}

/** Raw section (header / item / actions / etc.) within a document type. */
type RawSection = Readonly<Record<string, RawFieldDef>>;

/** Raw document-type node (e.g. purchaseOrder) containing sections. */
type RawDocumentType = Readonly<Record<string, RawSection>>;

/** Root shape of a domain JSON file. */
interface RawDomainFile {
  readonly domain?: string;
  readonly ui5Selectors?: Readonly<Record<string, RawDocumentType>>;
}

/**
 * Build a {@link UI5Selector} from a raw field definition.
 *
 * @param fieldDef - Raw field definition from the domain JSON.
 * @returns A UI5Selector or `undefined` if not enough data.
 *
 * @example
 * ```typescript
 * const sel = buildSelector({ labelFor: { text: 'Supplier' }, controlType: 'sap.m.Input' });
 * ```
 */
function buildSelector(fieldDef: RawFieldDef): UI5Selector | undefined {
  if (fieldDef.controlType !== undefined) {
    const selector: UI5Selector = { controlType: fieldDef.controlType };
    if (fieldDef.properties !== undefined) {
      return { ...selector, properties: fieldDef.properties };
    }
    return selector;
  }

  if (fieldDef.labelFor?.text !== undefined) {
    return {
      controlType: 'sap.m.Input',
      properties: { labelFor: fieldDef.labelFor.text },
    };
  }

  return undefined;
}

/**
 * Index a single field definition into the terms map.
 *
 * @param fieldKey - The canonical name for the field.
 * @param fieldDef - Raw field definition.
 * @param domain - SAP domain identifier.
 * @param terms - Mutable map to update.
 *
 * @example
 * ```typescript
 * indexField('supplier', rawDef, 'procurement', termsMap);
 * ```
 */
function indexField(
  fieldKey: string,
  fieldDef: RawFieldDef,
  domain: SAPDomain,
  terms: Map<string, VocabularyTerm>,
): void {
  const synonyms: string[] = fieldDef.aliases !== undefined ? [...fieldDef.aliases] : [];
  const selector = buildSelector(fieldDef);

  const term: VocabularyTerm = {
    name: fieldKey,
    synonyms,
    domain,
    ...(fieldDef.sapFieldName !== undefined && { sapField: fieldDef.sapFieldName }),
    ...(selector !== undefined && { selector }),
  };

  // Always overwrite canonical key — later definition wins for same name
  terms.set(fieldKey, term);

  // Index aliases so synonym searches hit the canonical term
  for (const alias of synonyms) {
    if (!terms.has(alias)) {
      terms.set(alias, term);
    }
  }
}

/**
 * Process a single section (header / item / actions etc.) of a document type.
 *
 * @param section - Key-value map of field key → raw field definition.
 * @param domain - SAP domain identifier.
 * @param terms - Mutable map to update.
 *
 * @example
 * ```typescript
 * indexSection(rawHeader, 'procurement', termsMap);
 * ```
 */
function indexSection(
  section: RawSection,
  domain: SAPDomain,
  terms: Map<string, VocabularyTerm>,
): void {
  for (const [fieldKey, fieldDef] of Object.entries(section)) {
    indexField(fieldKey, fieldDef, domain, terms);
  }
}

/**
 * Extract all {@link VocabularyTerm} entries from a raw domain JSON file.
 *
 * @remarks
 * Traverses the `ui5Selectors` tree (up to 2 levels deep) to collect all
 * leaf field definitions and convert them into flat `VocabularyTerm` objects.
 *
 * @param raw - Parsed JSON content of a domain file.
 * @param domain - Domain identifier for the resulting terms.
 * @returns Map of canonical term name to {@link VocabularyTerm}.
 *
 * @example
 * ```typescript
 * const terms = extractTerms(parsed, 'procurement');
 * ```
 */
function extractTerms(raw: RawDomainFile, domain: SAPDomain): Map<string, VocabularyTerm> {
  const terms = new Map<string, VocabularyTerm>();

  if (raw.ui5Selectors === undefined) {
    return terms;
  }

  for (const documentType of Object.values(raw.ui5Selectors)) {
    for (const section of Object.values(documentType)) {
      indexSection(section, domain, terms);
    }
  }

  return terms;
}

/**
 * Resolve the absolute path to the `domains/` directory bundled with the package.
 *
 * @remarks
 * Uses `import.meta.url` to locate the source file at build time, then
 * navigates to the sibling `domains/` directory. This is the same technique
 * used by `path-helpers.ts`.
 *
 * @param metaUrl - Value of `import.meta.url` in the calling module.
 * @returns Absolute path to the `domains/` directory.
 *
 * @example
 * ```typescript
 * const domainsDir = resolveDomainsDir(import.meta.url);
 * ```
 */
export function resolveDomainsDir(metaUrl: string): string {
  try {
    const thisFile = fileURLToPath(metaUrl);
    return join(dirname(thisFile), 'domains');
  } catch {
    // Fallback for environments where fileURLToPath is unavailable
    return join(process.cwd(), 'src', 'vocabulary', 'domains');
  }
}

/**
 * Load and parse a domain JSON file into a map of {@link VocabularyTerm} objects.
 *
 * @remarks
 * Reads `<domainsDir>/<domain>.json` asynchronously, parses it, and extracts
 * all field definitions as vocabulary terms.
 *
 * Throws {@link VocabularyError} if the file cannot be read or parsed.
 *
 * @param domain - The SAP domain to load (e.g. `'procurement'`).
 * @param domainsDir - Absolute path to the directory containing domain JSON files.
 * @returns Map of canonical term name → {@link VocabularyTerm}.
 *
 * @example
 * ```typescript
 * const terms = await loadDomainFile('procurement', resolveDomainsDir(import.meta.url));
 * ```
 */
export async function loadDomainFile(
  domain: SAPDomain,
  domainsDir: string,
): Promise<Map<string, VocabularyTerm>> {
  const filePath = join(domainsDir, `${domain}.json`);

  let content: string;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted domain enum + domainsDir
    content = await readFile(filePath, 'utf-8');
  } catch (cause) {
    throw new VocabularyError({
      code: ErrorCode.ERR_VOCAB_DOMAIN_LOAD_FAILED,
      message: `Failed to read vocabulary domain file: ${domain}.json`,
      attempted: `Read domain file at: ${filePath}`,
      retryable: false,
      domain,
      cause: cause instanceof Error ? cause : new Error(String(cause)),
      suggestions: [
        `Verify that ${filePath} exists and is readable.`,
        'Check that the domain name is one of: procurement, sales, finance, manufacturing, warehouse, quality.',
      ],
    });
  }

  let raw: RawDomainFile;
  try {
    raw = JSON.parse(content) as RawDomainFile;
  } catch (cause) {
    throw new VocabularyError({
      code: ErrorCode.ERR_VOCAB_JSON_INVALID,
      message: `Failed to parse vocabulary domain JSON: ${domain}.json`,
      attempted: `Parse JSON content of domain file: ${filePath}`,
      retryable: false,
      domain,
      cause: cause instanceof Error ? cause : new Error(String(cause)),
      suggestions: [
        'Validate the JSON file using a JSON validator.',
        'Ensure the file is valid UTF-8 encoded JSON.',
      ],
    });
  }

  return extractTerms(raw, domain);
}
