/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Argument hints for capabilities, derived from the source rather than by hand.
 *
 * @remarks
 * `capabilities.yaml` carries no signature field, so the hints agents read have
 * to come from the code. The `@capability` tags make that possible: each sits on
 * a declaration, linking a manifest entry to a real signature.
 *
 * Tag placement is loose by design — it means "participates in this capability",
 * not "is its implementation". `ui5.control` is tagged in three places, none of
 * them the `control()` method; `control.setValue` is tagged on
 * `createControlProxy` because the method is forwarded dynamically.
 *
 * So the rule is conservative: emit a signature **only** when a tag sits on a
 * declaration whose name matches the manifest's `name`, and otherwise emit
 * `name(...)`. This can never print a wrong signature, and coverage rises on its
 * own as tags are tightened. A plausible-but-wrong signature in the file agents
 * read would be worse than none at all.
 *
 * @module scripts
 */

import { Node, Project } from 'ts-morph';

/** Rendered when no tagged declaration proves the parameter list. */
const UNKNOWN_ARGS = '(...)';

/**
 * A declaration carrying an `@capability` tag, with its parameter names.
 *
 * @example
 * ```typescript
 * const tagged: TaggedDeclaration = {
 *   qualifiedName: 'ui5.fill',
 *   declarationName: 'fill',
 *   parameters: ['selector', 'value'],
 * };
 * ```
 */
export interface TaggedDeclaration {
  /** Qualified name from the `@capability` tag. */
  readonly qualifiedName: string;
  /** Name of the declaration the tag documents. */
  readonly declarationName: string;
  /** Parameter names, with `?` already appended to optional ones. */
  readonly parameters: readonly string[];
}

/** The subset of a manifest entry needed to render a hint. */
interface CapabilityRef {
  readonly qualifiedName: string;
  readonly name: string;
}

/**
 * Renders the argument hint for one capability.
 *
 * @param capability - Manifest entry being rendered.
 * @param tagged - All tagged declarations found in source.
 * @returns `name(a, b)` when provable, otherwise `name(...)`.
 *
 * @example
 * ```typescript
 * renderCapabilitySignature({ qualifiedName: 'ui5.fill', name: 'fill' }, tagged);
 * // 'fill(selector, value)'
 * ```
 */
export function renderCapabilitySignature(
  capability: CapabilityRef,
  tagged: readonly TaggedDeclaration[],
): string {
  const match = tagged.find(
    (t) => t.qualifiedName === capability.qualifiedName && t.declarationName === capability.name,
  );

  if (match === undefined) {
    return `${capability.name}${UNKNOWN_ARGS}`;
  }

  return `${capability.name}(${match.parameters.join(', ')})`;
}

/**
 * Reads the parameter names of a declaration, marking optional ones.
 *
 * @remarks
 * A real parser is required here rather than a line scan: 116 of the tagged
 * declarations in `src/` spread their parameters across multiple lines.
 */
function parametersOf(node: Node): readonly string[] | undefined {
  if (
    !Node.isFunctionDeclaration(node) &&
    !Node.isMethodDeclaration(node) &&
    !Node.isMethodSignature(node)
  ) {
    return undefined;
  }
  return node
    .getParameters()
    .map((p) => `${p.getName()}${p.isOptional() || p.hasInitializer() ? '?' : ''}`);
}

/** Reads the name of any declaration kind that can carry a tag. */
function declarationNameOf(node: Node): string | undefined {
  if (Node.isVariableStatement(node)) return node.getDeclarations()[0]?.getName();
  if (
    Node.isFunctionDeclaration(node) ||
    Node.isMethodDeclaration(node) ||
    Node.isMethodSignature(node) ||
    Node.isClassDeclaration(node) ||
    Node.isInterfaceDeclaration(node) ||
    Node.isPropertySignature(node)
  ) {
    return node.getName() ?? undefined;
  }
  return undefined;
}

/**
 * Collects every `@capability`-tagged declaration in the given sources.
 *
 * @remarks
 * Reads `src/`, not `dist/`. The emitted declarations carry the tags too, but
 * depending on them would make generation require a prior build — and
 * `build:full` runs the generators *before* `build`, so `dist/` may be stale or
 * absent. Parsing 226 source files costs about 240ms.
 *
 * @param globs - Source globs to scan.
 * @returns Every tagged declaration, including repeats for one capability.
 *
 * @example
 * ```typescript
 * const tagged = collectTaggedDeclarations(['src/**\/*.ts', '!src/**\/*.generated.ts']);
 * ```
 */
export function collectTaggedDeclarations(globs: readonly string[]): TaggedDeclaration[] {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  project.addSourceFilesAtPaths([...globs]);

  const found: TaggedDeclaration[] = [];

  for (const sourceFile of project.getSourceFiles()) {
    sourceFile.forEachDescendant((node) => {
      if (!Node.isJSDocable(node)) return;
      for (const doc of node.getJsDocs()) {
        for (const tag of doc.getTags()) {
          if (tag.getTagName() !== 'capability') continue;
          const qualifiedName = (tag.getCommentText() ?? '').trim().split(/\s+/)[0];
          const declarationName = declarationNameOf(node);
          if (qualifiedName === undefined || qualifiedName === '') continue;
          if (declarationName === undefined) continue;
          found.push({
            qualifiedName,
            declarationName,
            parameters: parametersOf(node) ?? [],
          });
        }
      }
    });
  }

  return found;
}
