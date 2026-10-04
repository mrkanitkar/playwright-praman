/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `scripts/llms-facts.ts` — the facts behind `llms.txt`.
 *
 * @remarks
 * `llms.txt` is the first file an AI agent reads, and every number in it was
 * hand-maintained. All five that could drift had: 179 capabilities against 198
 * real ones, 14 categories against 15, 14 error classes against 15, 58 error
 * codes against 78, 14 fixtures against 20. It also linked to a
 * `guides/interaction-strategies` page that does not exist — invisible to
 * Docusaurus, whose `onBrokenLinks: 'throw'` only inspects *internal* links,
 * while the index uses absolute `https://praman.dev/...` URLs.
 *
 * These tests therefore assert the two properties that keep it honest:
 * derivations track their real source, and a dead link is caught.
 *
 * Deliberately **not** asserted: today's exact totals. A test reading
 * `capabilities === 198` would fail the moment someone adds a capability,
 * teaching the next person to edit the number rather than trust the
 * derivation — reintroducing by hand exactly what this replaced. The
 * assertions below compare each count against its own source instead.
 */

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { deriveFacts, findBrokenDocLinks } from '../../../scripts/llms-facts.js';

// eslint-disable-next-line n/no-unsupported-features/node-builtins -- vitest provides import.meta.dirname
const ROOT = resolve(import.meta.dirname, '../../..');

describe('deriveFacts', () => {
  it('counts capabilities and categories from capabilities.yaml', async () => {
    const facts = await deriveFacts(ROOT);
    const manifest = parseYaml(await readFile(resolve(ROOT, 'capabilities.yaml'), 'utf8')) as {
      capabilities: readonly { category: string }[];
    };

    expect(facts.capabilities).toBe(manifest.capabilities.length);
    expect(facts.capabilityCategories).toBe(
      new Set(manifest.capabilities.map((entry) => entry.category)).size,
    );
  });

  it('counts error codes from the frozen ErrorCode map', async () => {
    const facts = await deriveFacts(ROOT);
    const { ErrorCode } = await import('../../../src/core/errors/codes.js');

    expect(facts.errorCodes).toBe(Object.keys(ErrorCode).length);
  });

  it('counts exported error classes from the errors barrel', async () => {
    const facts = await deriveFacts(ROOT);
    const barrel: Record<string, unknown> = await import('../../../src/core/errors/index.js');
    const classes = Object.keys(barrel).filter(
      (name) => name.endsWith('Error') && typeof barrel[name] === 'function',
    );

    expect(facts.errorClasses).toBe(classes.length);
  });

  it('counts the two fixture tables separately', async () => {
    // Conflating the back-to-back Fixture Summary and Auto-Fixtures tables is
    // how "20 fixtures" was once measured as 25.
    const facts = await deriveFacts(ROOT);

    expect(facts.fixtures).toBeGreaterThan(facts.autoFixtures);
    expect(facts.fixtures + facts.autoFixtures).toBeGreaterThan(20);
  });

  it('counts navigation methods from the interface, not the capability registry', async () => {
    // These disagree: the registry holds 9 navigate capabilities while
    // UI5NavigationAPI declares 11 methods. llms.txt quoted the 9 as though it
    // were the method count.
    const facts = await deriveFacts(ROOT);
    const source = await readFile(resolve(ROOT, 'src/fixtures/nav-fixtures.ts'), 'utf8');
    const declared = [...source.matchAll(/^\s{2,}(navigate|search|get)[A-Za-z0-9]*\s*\(/gmu)];

    expect(facts.navMethods).toBeGreaterThan(0);
    expect(facts.navMethods).toBeLessThanOrEqual(declared.length);
  });

  it('ignores an interface quoted inside a doc comment', async () => {
    // src/matchers/types.d.ts documents the augmentation pattern with a worked
    // `interface Matchers<R>` example ABOVE the real declaration. A plain
    // indexOf lands in the comment; the example's lone matcher escaped the
    // count only by luck of indentation.
    const facts = await deriveFacts(ROOT);
    const source = await readFile(resolve(ROOT, 'src/matchers/types.d.ts'), 'utf8');
    const realMatchers = new Set(
      [...source.matchAll(/^\s{4}(to[A-Z][A-Za-z0-9]*)\s*\(/gmu)].map((match) => match[1]),
    );

    expect(facts.matchers).toBe(realMatchers.size);
    // The commented example declares toHaveUI5Icon; it must not be counted.
    expect(realMatchers.has('toHaveUI5Icon')).toBe(false);
  });

  it('excludes ./package.json from the sub-path export count', async () => {
    const facts = await deriveFacts(ROOT);
    const pkg = JSON.parse(await readFile(resolve(ROOT, 'package.json'), 'utf8')) as {
      exports: Record<string, unknown>;
    };

    expect(facts.subpathExports).toBe(Object.keys(pkg.exports).length - 1);
  });
});

describe('findBrokenDocLinks', () => {
  it('reports a link with no page behind it', async () => {
    const text = '- [Gone](https://praman.dev/docs/guides/interaction-strategies): missing';

    const broken = await findBrokenDocLinks(text, ROOT);

    expect(broken).toHaveLength(1);
    expect(broken[0]?.expected).toBe('docs/docs/guides/interaction-strategies.md');
  });

  it('accepts a link that resolves to a real page', async () => {
    const text = '- [Fixtures](https://praman.dev/docs/guides/fixtures): real';

    await expect(findBrokenDocLinks(text, ROOT)).resolves.toEqual([]);
  });

  it('skips docs/api, which only exists after the docs build', async () => {
    // docusaurus-plugin-typedoc writes docs/docs/api/** at build time, so it is
    // legitimately absent from a clean checkout.
    const text = '- [API](https://praman.dev/docs/api/): generated';

    await expect(findBrokenDocLinks(text, ROOT)).resolves.toEqual([]);
  });

  it('ignores non-docs URLs such as llms-full.txt', async () => {
    const text = '- [full](https://praman.dev/llms-full.txt): sibling artifact';

    await expect(findBrokenDocLinks(text, ROOT)).resolves.toEqual([]);
  });

  it('finds every dead link, not just the first', async () => {
    const text = [
      '- [a](https://praman.dev/docs/guides/nope-one): x',
      '- [b](https://praman.dev/docs/guides/fixtures): ok',
      '- [c](https://praman.dev/docs/examples/nope-two): y',
    ].join('\n');

    const broken = await findBrokenDocLinks(text, ROOT);

    expect(broken.map((link) => link.expected)).toEqual([
      'docs/docs/guides/nope-one.md',
      'docs/docs/examples/nope-two.md',
    ]);
  });
});

describe('the shipped llms.txt', () => {
  it('has no dead documentation links', async () => {
    // The committed artifact itself, not a synthetic sample: this is the
    // assertion that would have caught the interaction-strategies link.
    const index = await readFile(resolve(ROOT, 'llms.txt'), 'utf8');

    await expect(findBrokenDocLinks(index, ROOT)).resolves.toEqual([]);
  });

  it('quotes the derived counts rather than stale ones', async () => {
    const [index, facts] = await Promise.all([
      readFile(resolve(ROOT, 'llms.txt'), 'utf8'),
      deriveFacts(ROOT),
    ]);

    expect(index).toContain(`${String(facts.capabilities)} capabilities`);
    expect(index).toContain(`${String(facts.errorCodes)} error codes`);
    expect(index).toContain(`${String(facts.errorClasses)} error classes`);
  });

  it('carries no version stamp, so publishing cannot invalidate it', async () => {
    // Regression guard for a canary publish that failed outright. `canary.yml`
    // runs `npm version <next>-alpha.N` and then publishes; `prepublishOnly`
    // runs `npm run ci`; and the committed bytes no longer matched the stamped
    // version, so the gate failed and nothing shipped. Any value that
    // publishing rewrites must stay out of a checked-in, byte-gated artifact.
    const [index, full] = await Promise.all([
      readFile(resolve(ROOT, 'llms.txt'), 'utf8'),
      readFile(resolve(ROOT, 'llms-full.txt'), 'utf8'),
    ]);

    for (const [name, content] of [
      ['llms.txt', index],
      ['llms-full.txt', full],
    ] as const) {
      // The generated header only; the API report body legitimately mentions
      // version numbers in TSDoc (e.g. "Added in v1.62").
      const header = content.slice(0, 600);
      expect(header, `${name} header must not stamp a version`).not.toMatch(
        /Version:\s*\d+\.\d+\.\d+/u,
      );
    }
  });
});
