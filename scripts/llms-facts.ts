/**
 * Facts about the package, derived from source rather than restated by hand.
 *
 * @remarks
 * `llms.txt` is the first file an AI agent reads, and every number in it was
 * previously typed in by hand. All five that could drift had: it advertised 179
 * capabilities (198), 14 categories (15), 14 error classes (15), 58 error codes
 * (78) and 14 fixtures (20), and pointed at a `guides/interaction-strategies`
 * page that does not exist. Docusaurus could not catch that last one because
 * `onBrokenLinks: 'throw'` only inspects internal links, and the index uses
 * absolute `https://praman.dev/...` URLs.
 *
 * So every count here is read from the one place that defines it, and the link
 * targets are resolved against the filesystem. A wrong number becomes a failed
 * build instead of a confidently wrong statement to an agent.
 *
 * Counts parsed with a regex assert a plausible floor. A silently-zero count
 * would otherwise ship as "0 fixtures" — fail loudly instead.
 *
 * @module scripts
 */

import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

import { parse as parseYaml } from 'yaml';

/** A count that came out implausibly low, meaning its source moved. */
export class DerivationError extends Error {
  public constructor(what: string, got: number, floor: number) {
    super(
      `Derived ${what} = ${String(got)}, below the plausible floor of ${String(floor)}. ` +
        `Its source file almost certainly moved or changed shape — fix the derivation ` +
        `in scripts/llms-facts.ts rather than hard-coding the number.`,
    );
    this.name = 'DerivationError';
  }
}

/** Numbers quoted in `llms.txt`, each derived from its defining source. */
export interface PramanFacts {
  /** Package version from `package.json`. */
  readonly version: string;
  /** Rows in the `fixtures.md` Fixture Summary table. */
  readonly fixtures: number;
  /** Rows in the `fixtures.md` Auto-Fixtures table. */
  readonly autoFixtures: number;
  /** Entries in `capabilities.yaml`. */
  readonly capabilities: number;
  /** Distinct `category` values across those entries. */
  readonly capabilityCategories: number;
  /** Exported `*Error` classes in the errors barrel. */
  readonly errorClasses: number;
  /** Keys of the frozen `ErrorCode` map. */
  readonly errorCodes: number;
  /** Strategy modules under `src/auth/strategies/`. */
  readonly authStrategies: number;
  /** Methods on the `UI5NavigationAPI` interface. */
  readonly navMethods: number;
  /** Matchers declared on the `expect` interface augmentation. */
  readonly matchers: number;
  /** Code sub-path exports, excluding `./package.json`. */
  readonly subpathExports: number;
}

/**
 * Counts rows of the first markdown table following a heading.
 *
 * @remarks
 * Stops at the next heading so adjacent tables cannot bleed into the count —
 * `fixtures.md` has Fixture Summary and Auto-Fixtures back to back, and
 * conflating them is how "20 fixtures" became "25".
 */
function countTableRows(markdown: string, heading: string): number {
  const start = markdown.indexOf(heading);
  if (start === -1) return 0;

  const rest = markdown.slice(start + heading.length);
  const nextHeading = /^#{1,6} /mu.exec(rest);
  const section = nextHeading ? rest.slice(0, nextHeading.index) : rest;

  return section.split('\n').filter((line) => /^\|\s*`[A-Za-z]/u.test(line)).length;
}

/**
 * Removes comments so a declaration quoted in TSDoc cannot be parsed as real.
 *
 * @remarks
 * Not cosmetic. `src/matchers/types.d.ts` documents the augmentation pattern
 * with a worked `interface Matchers<R>` example *above* the real declaration,
 * so a plain `indexOf` lands in the comment. The example's matcher escaped the
 * count only because the ` * ` prefix happened to break the indent pattern —
 * luck, not design.
 */
function stripComments(source: string): string {
  return source.replaceAll(/\/\*[\s\S]*?\*\//gu, '').replaceAll(/^\s*\/\/.*$/gmu, '');
}

/**
 * Counts method members declared on a TypeScript interface.
 *
 * @remarks
 * Deliberately matches only `name(` — call signatures — so properties are not
 * counted. This resolved a live disagreement: the guide said 11 navigation
 * methods and `llms.txt` said 9, and the interface settles it at 11. The 9 was
 * the number of *registered capabilities*, a different thing that happened to
 * look like the same number.
 */
function countInterfaceMethods(rawSource: string, interfaceName: string): number {
  const source = stripComments(rawSource);
  const start = source.indexOf(`interface ${interfaceName}`);
  if (start === -1) return 0;

  const body = source.slice(start);
  const end = body.indexOf('\n}');
  const section = end === -1 ? body : body.slice(0, end);

  const names = new Set(
    [...section.matchAll(/^\s{2,}([a-z][A-Za-z0-9]*)\s*(?:<[^>]*>)?\(/gmu)].map(
      (match) => match[1] ?? '',
    ),
  );
  return names.size;
}

interface CapabilitiesManifest {
  readonly capabilities?: readonly { readonly category?: string }[];
}

interface PackageManifest {
  readonly version: string;
  readonly exports: Readonly<Record<string, unknown>>;
}

/**
 * Reads every fact `llms.txt` quotes from the source that defines it.
 *
 * @param root - Repository root.
 * @returns The derived counts.
 *
 * @example
 * ```typescript
 * const facts = await deriveFacts(process.cwd());
 * console.log(facts.capabilities); // 198
 * ```
 */
export async function deriveFacts(root: string): Promise<PramanFacts> {
  const read = async (...segments: string[]): Promise<string> =>
    readFile(resolve(root, ...segments), 'utf8');

  const [pkgRaw, capsRaw, fixturesDoc, navSource, matcherTypes, strategyFiles] = await Promise.all([
    read('package.json'),
    read('capabilities.yaml'),
    read('docs/docs/guides/fixtures.md'),
    read('src/fixtures/nav-fixtures.ts'),
    read('src/matchers/types.d.ts'),
    readdir(resolve(root, 'src/auth/strategies')),
  ]);

  // Imported rather than parsed: these are plain frozen data, and the compiler
  // guarantees the shape that a regex could only guess at.
  const [{ ErrorCode }, errorsBarrel] = await Promise.all([
    import('../src/core/errors/codes.js'),
    import('../src/core/errors/index.js'),
  ]);

  const pkg = JSON.parse(pkgRaw) as PackageManifest;
  const caps = parseYaml(capsRaw) as CapabilitiesManifest;
  const entries = caps.capabilities ?? [];

  const facts: PramanFacts = {
    version: pkg.version,
    fixtures: countTableRows(fixturesDoc, '## Fixture Summary'),
    autoFixtures: countTableRows(fixturesDoc, '## Auto-Fixtures'),
    capabilities: entries.length,
    capabilityCategories: new Set(entries.map((entry) => entry.category)).size,
    errorClasses: Object.keys(errorsBarrel).filter(
      (name) =>
        name.endsWith('Error') &&
        typeof (errorsBarrel as Readonly<Record<string, unknown>>)[name] === 'function',
    ).length,
    errorCodes: Object.keys(ErrorCode).length,
    authStrategies: strategyFiles.filter((file) => file.endsWith('-strategy.ts')).length,
    navMethods: countInterfaceMethods(navSource, 'UI5NavigationAPI'),
    matchers: countInterfaceMethods(matcherTypes, 'Matchers'),
    subpathExports: Object.keys(pkg.exports).filter((key) => key !== './package.json').length,
  };

  // Floors are "obviously broken" markers, not assertions about today's totals,
  // so they do not need updating when a fixture or capability is added.
  const floors: readonly [keyof PramanFacts, number][] = [
    ['fixtures', 10],
    ['autoFixtures', 3],
    ['capabilities', 100],
    ['capabilityCategories', 10],
    ['errorClasses', 10],
    ['errorCodes', 40],
    ['authStrategies', 4],
    ['navMethods', 6],
    ['matchers', 6],
    ['subpathExports', 5],
  ];

  for (const [key, floor] of floors) {
    const value = facts[key];
    if (typeof value === 'number' && value < floor) {
      throw new DerivationError(key, value, floor);
    }
  }

  return facts;
}

/** A documentation link whose target file is missing. */
export interface BrokenLink {
  /** The absolute URL as written in the index. */
  readonly url: string;
  /** The repo-relative path that was looked for. */
  readonly expected: string;
}

/** Generated at docs-build time by `docusaurus-plugin-typedoc`, so never on disk here. */
const GENERATED_URL_PREFIXES = ['docs/api'] as const;

/**
 * Resolves every `praman.dev/docs/...` link in the index against the filesystem.
 *
 * @remarks
 * Catches the class of bug Docusaurus structurally cannot: these are absolute
 * URLs, which `onBrokenLinks: 'throw'` does not inspect. That is how a link to
 * a non-existent `guides/interaction-strategies` survived in a file whose whole
 * job is telling agents where to look.
 *
 * @param indexText - The assembled `llms.txt` content.
 * @param root - Repository root.
 * @returns Every link with no file behind it.
 *
 * @example
 * ```typescript
 * const broken = await findBrokenDocLinks(index, process.cwd());
 * if (broken.length > 0) throw new Error('dead links in llms.txt');
 * ```
 */
export async function findBrokenDocLinks(
  indexText: string,
  root: string,
): Promise<readonly BrokenLink[]> {
  const urls = [...indexText.matchAll(/https:\/\/praman\.dev\/([^)\s]*)/gu)].map(
    (match) => match[1] ?? '',
  );

  const broken: BrokenLink[] = [];

  for (const url of urls) {
    const path = url.replace(/\/$/u, '');
    if (!path.startsWith('docs/')) continue;
    if (GENERATED_URL_PREFIXES.some((prefix) => path.startsWith(prefix))) continue;

    const base = `docs/docs/${path.slice('docs/'.length)}`;
    const candidates = [`${base}.md`, `${base}.mdx`, `${base}/index.md`];

    const found = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          await readFile(resolve(root, candidate), 'utf8');
          return true;
        } catch {
          return false;
        }
      }),
    );

    if (!found.includes(true)) {
      broken.push({ url: `https://praman.dev/${url}`, expected: `${base}.md` });
    }
  }

  return broken;
}
