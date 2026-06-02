/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Types, enricher script, filter helpers, and output formatters for `praman snapshot`.
 *
 * @remarks
 * Intentionally separated from `snapshot-command.ts` to keep each module under
 * the 300-line limit and give a clear boundary:
 *
 * - `snapshot-formatters.ts` — pure data types + pure transformation functions
 * - `snapshot-command.ts`    — side-effecting CLI runner (spawns processes, writes files)
 *
 * All functions in this module are pure (no I/O, no process side effects).
 *
 * @module cli/snapshot-formatters
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Binding descriptor for a single property binding on a UI5 control.
 *
 * @example
 * ```typescript
 * const binding: BindingDescriptor = {
 *   property: 'value',
 *   path: '/CustomerSet/Name',
 *   model: 'odata',
 * };
 * ```
 */
export interface BindingDescriptor {
  /** The control property name that has an active binding (e.g. `'value'`). */
  readonly property: string;
  /** The binding path expression (e.g. `'/CustomerSet/Name'`). */
  readonly path: string;
  /** The named model (empty string for the default model). */
  readonly model: string;
}

/**
 * Snapshot of a single rendered UI5 control from the `ElementRegistry`.
 *
 * @example
 * ```typescript
 * const snap: ControlSnapshot = {
 *   id: '__button0',
 *   type: 'sap.m.Button',
 *   visible: true,
 *   properties: { text: 'Save', enabled: true },
 *   bindings: [{ property: 'text', path: '/i18n>SAVE', model: '' }],
 * };
 * ```
 */
export interface ControlSnapshot {
  /** Unique UI5 control ID (stable for named controls, generated for anonymous). */
  readonly id: string;
  /** Fully-qualified SAP control type (e.g. `'sap.m.Button'`). */
  readonly type: string;
  /** Whether the control is currently visible in the UI. */
  readonly visible: boolean;
  /** Subset of control properties relevant for test authoring. */
  readonly properties: Readonly<{
    value?: string;
    text?: string;
    selected?: boolean;
    enabled?: boolean;
    placeholder?: string;
    title?: string;
    [key: string]: unknown;
  }>;
  /** Active property bindings on this control. */
  readonly bindings: readonly BindingDescriptor[];
}

/**
 * Options accepted by the `snapshot` CLI command.
 *
 * @example
 * ```typescript
 * const opts: SnapshotOptions = {
 *   session: 'default',
 *   output: './snapshot.json',
 *   format: 'json',
 *   depth: 5,
 *   filter: 'sap.m.Button',
 * };
 * ```
 */
export interface SnapshotOptions {
  /** Playwright session name to connect to. Defaults to `'pwtest'`. */
  readonly session?: string;
  /** File path for output. When omitted, result is written to stdout. */
  readonly output?: string;
  /** Output format. Defaults to `'json'`. */
  readonly format?: 'json' | 'yaml' | 'table';
  /** Maximum tree depth when nesting child controls. `0` means unlimited. */
  readonly depth?: number;
  /** Filter results to controls whose type starts with this prefix. */
  readonly filter?: string;
}

// ── Inline enricher script ────────────────────────────────────────────────────

/**
 * Builds the browser-side enricher script that reads the UI5 ElementRegistry
 * and serialises every control to a {@link ControlSnapshot} record.
 *
 * @remarks
 * The script is designed to be passed to `page.evaluate()`. It returns a
 * JSON string (not a parsed object) so it survives Playwright's serialisation
 * layer without loss of precision for deeply nested objects.
 *
 * @returns An IIFE string that evaluates to a JSON-encoded `ControlSnapshot[]`.
 *
 * @example
 * ```typescript
 * const script = buildEnricherScript();
 * const raw = await page.evaluate(script);
 * const controls = JSON.parse(raw) as ControlSnapshot[];
 * ```
 */
export function buildEnricherScript(): string {
  return `(function() {
  try {
    function getRegistry() {
      if (typeof sap === 'undefined' || !sap.ui) return null;
      if (sap.ui.core) {
        var _ER = sap.ui.require('sap/ui/core/ElementRegistry');
        if (_ER) return _ER;
      }
      if (sap.ui.getCore) {
        var core = sap.ui.getCore();
        if (core && core.getElements) {
          return { all: function() { return core.getElements(); } };
        }
      }
      return null;
    }

    function collectBindings(ctrl) {
      var result = [];
      try {
        var infos = ctrl.mBindingInfos;
        if (!infos || typeof infos !== 'object') return result;
        var keys = Object.keys(infos);
        for (var i = 0; i < keys.length; i++) {
          var prop = keys[i];
          var info = infos[prop];
          if (!info) continue;
          var path = info.path || (info.parts && info.parts[0] && info.parts[0].path) || '';
          var model = info.model || (info.parts && info.parts[0] && info.parts[0].model) || '';
          result.push({ property: prop, path: String(path), model: String(model) });
        }
      } catch (_) {}
      return result;
    }

    function safeGet(ctrl, getter) {
      try {
        return typeof ctrl[getter] === 'function' ? ctrl[getter]() : undefined;
      } catch (_) {
        return undefined;
      }
    }

    function buildSnapshot(ctrl) {
      var id = safeGet(ctrl, 'getId') || '';
      var meta = ctrl.getMetadata && typeof ctrl.getMetadata === 'function'
        ? ctrl.getMetadata() : null;
      var type = meta ? meta.getName() : 'unknown';
      var visible = safeGet(ctrl, 'getVisible');
      if (visible === undefined) visible = true;
      var props = {};
      var value = safeGet(ctrl, 'getValue');
      if (value !== undefined) props.value = String(value);
      var text = safeGet(ctrl, 'getText');
      if (text !== undefined) props.text = String(text);
      var selected = safeGet(ctrl, 'getSelected');
      if (selected !== undefined) props.selected = Boolean(selected);
      var enabled = safeGet(ctrl, 'getEnabled');
      if (enabled !== undefined) props.enabled = Boolean(enabled);
      var placeholder = safeGet(ctrl, 'getPlaceholder');
      if (placeholder !== undefined) props.placeholder = String(placeholder);
      var title = safeGet(ctrl, 'getTitle');
      if (title !== undefined) props.title = String(title);
      return {
        id: String(id), type: String(type), visible: Boolean(visible),
        properties: props, bindings: collectBindings(ctrl)
      };
    }

    var registry = getRegistry();
    if (!registry) { return JSON.stringify([]); }
    var elements = registry.all();
    if (!elements || typeof elements !== 'object') { return JSON.stringify([]); }
    var ids = Object.keys(elements);
    var snapshots = [];
    for (var i = 0; i < ids.length; i++) {
      try { snapshots.push(buildSnapshot(elements[ids[i]])); } catch (_) {}
    }
    return JSON.stringify(snapshots);
  } catch (e) {
    return JSON.stringify({ __error: String(e) });
  }
})()`;
}

// ── Filtering / limiting helpers ──────────────────────────────────────────────

/**
 * Filters a snapshot array by control type prefix.
 *
 * @param snapshots - The full control snapshot array.
 * @param filter - The control type prefix to match (e.g. `'sap.m.Button'`).
 * @returns Controls whose `type` starts with `filter`.
 *
 * @example
 * ```typescript
 * const buttons = filterByType(all, 'sap.m.Button');
 * ```
 */
export function filterByType(
  snapshots: readonly ControlSnapshot[],
  filter: string,
): ControlSnapshot[] {
  return snapshots.filter((s) => s.type.startsWith(filter));
}

/**
 * Limits a flat snapshot array to a maximum count derived from `depth`.
 *
 * @remarks
 * The snapshot list is flat (ElementRegistry does not expose a true tree),
 * so `depth` here limits the total number of controls returned — callers
 * can layer their own tree-building on top. A `depth` of `0` means unlimited.
 *
 * @param snapshots - The snapshot array to limit.
 * @param depth - Maximum number of controls to return. `0` means unlimited.
 * @returns Trimmed snapshot array.
 *
 * @example
 * ```typescript
 * const limited = limitDepth(all, 50);
 * ```
 */
export function limitDepth(
  snapshots: readonly ControlSnapshot[],
  depth: number,
): ControlSnapshot[] {
  if (depth <= 0) return [...snapshots];
  return snapshots.slice(0, depth);
}

// ── Output formatters ─────────────────────────────────────────────────────────

/**
 * Formats a snapshot array as an indented JSON string.
 *
 * @param snapshots - Control snapshots to serialise.
 * @returns JSON string with 2-space indentation.
 *
 * @example
 * ```typescript
 * const json = formatJson(snapshots);
 * process.stdout.write(json + '\n');
 * ```
 */
export function formatJson(snapshots: readonly ControlSnapshot[]): string {
  return JSON.stringify(snapshots, null, 2);
}

/**
 * Formats a snapshot array as a minimal YAML document.
 *
 * @remarks
 * Hand-rolled minimal YAML serialiser for the known {@link ControlSnapshot} shape.
 * Does **not** handle arbitrary objects — only the fixed fields the enricher produces.
 *
 * @param snapshots - Control snapshots to serialise.
 * @returns YAML string.
 *
 * @example
 * ```typescript
 * const yaml = formatYaml(snapshots);
 * process.stdout.write(yaml);
 * ```
 */
export function formatYaml(snapshots: readonly ControlSnapshot[]): string {
  const lines: string[] = ['controls:'];
  for (const snap of snapshots) {
    lines.push(`  - id: ${JSON.stringify(snap.id)}`);
    lines.push(`    type: ${JSON.stringify(snap.type)}`);
    lines.push(`    visible: ${String(snap.visible)}`);
    const propKeys = Object.keys(snap.properties);
    if (propKeys.length > 0) {
      lines.push('    properties:');
      for (const key of propKeys) {
        // eslint-disable-next-line security/detect-object-injection -- key is sourced from Object.keys(snap.properties), safe
        lines.push(`      ${key}: ${JSON.stringify(snap.properties[key])}`);
      }
    }
    if (snap.bindings.length > 0) {
      lines.push('    bindings:');
      for (const b of snap.bindings) {
        lines.push(
          `      - property: ${JSON.stringify(b.property)}, path: ${JSON.stringify(b.path)}, model: ${JSON.stringify(b.model)}`,
        );
      }
    }
  }
  return lines.join('\n') + '\n';
}

/**
 * Formats a snapshot array as a fixed-width ASCII table.
 *
 * @remarks
 * Columns: `ID`, `TYPE`, `VIS`, `TEXT/VALUE`. Column widths are computed
 * dynamically from the actual data, capped at sensible maximums so the
 * table remains readable in a standard 120-column terminal.
 *
 * @param snapshots - Control snapshots to render.
 * @returns Multi-line ASCII table string.
 *
 * @example
 * ```typescript
 * const table = formatTable(snapshots);
 * process.stdout.write(table);
 * ```
 */
export function formatTable(snapshots: readonly ControlSnapshot[]): string {
  if (snapshots.length === 0) {
    return '(no controls found)\n';
  }

  const COL_MAX_ID = 40;
  const COL_MAX_TYPE = 40;
  const COL_MIN = 3;

  const idW = Math.min(
    COL_MAX_ID,
    Math.max(COL_MIN, ...snapshots.map((s) => s.id.length), 'ID'.length),
  );
  const typeW = Math.min(
    COL_MAX_TYPE,
    Math.max(COL_MIN, ...snapshots.map((s) => s.type.length), 'TYPE'.length),
  );

  const truncate = (s: string, max: number): string =>
    s.length > max ? s.slice(0, max - 1) + '…' : s;

  const header = ['ID'.padEnd(idW), 'TYPE'.padEnd(typeW), 'VIS', 'TEXT / VALUE'].join('  ');
  const divider = ['─'.repeat(idW), '─'.repeat(typeW), '───', '─'.repeat(20)].join('  ');

  const rows = snapshots.map((s) => {
    const textVal = s.properties.text ?? s.properties.value ?? '';
    return [
      truncate(s.id, idW).padEnd(idW),
      truncate(s.type, typeW).padEnd(typeW),
      (s.visible ? 'yes' : 'no').padEnd(3),
      truncate(textVal, 40),
    ].join('  ');
  });

  return [header, divider, ...rows].join('\n') + '\n';
}
