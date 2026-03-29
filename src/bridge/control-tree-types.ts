/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Type definitions for serialized UI5 control tree snapshots.
 *
 * @ai
 * @aiContext Used by the control tree capture fixture and reporter.
 * The browser script serializes the entire UI5 control registry into
 * a hierarchical tree of {@link ControlTreeNode} objects rooted in a
 * {@link ControlTreeSnapshot}. Attached as a Playwright test artifact
 * on teardown via `testInfo.attach()`.
 *
 * @remarks
 * These types describe the shape of the JSON artifact that appears in
 * the Playwright trace viewer and HTML report. They are consumed by:
 * - `control-tree.ts` browser script (produces the data)
 * - `control-tree-fixtures.ts` (attaches the data)
 * - `control-tree-reporter.ts` (reads and aggregates the data)
 *
 * @module bridge
 */

// ── Node types ───────────────────────────────────────────────────────

/**
 * A single node in the serialized UI5 control tree.
 *
 * @remarks
 * Each node represents one UI5 control from the element registry.
 * Parent-child relationships are derived from `ctrl.getParent()` calls
 * during serialization. Properties are a curated subset of the most
 * common debugging-relevant fields.
 *
 * @example
 * ```typescript
 * const node: ControlTreeNode = {
 *   id: '__button0',
 *   controlType: 'sap.m.Button',
 *   visible: true,
 *   enabled: true,
 *   domId: '__button0',
 *   properties: { text: 'Save', type: 'Emphasized' },
 *   bindingPaths: { text: '/SaveButtonText' },
 *   children: [],
 * };
 * ```
 */
export interface ControlTreeNode {
  /** UI5 control ID (e.g., `'__button0'`, `'app--list--searchField'`). */
  readonly id: string;

  /** Fully qualified control type (e.g., `'sap.m.Button'`). */
  readonly controlType: string;

  /** Whether the control is currently visible. */
  readonly visible: boolean;

  /** Whether the control is currently enabled (defaults to `true` if no `getEnabled`). */
  readonly enabled: boolean;

  /** DOM element ID, or `null` if the control is not rendered. */
  readonly domId: string | null;

  /**
   * Curated subset of control properties for debugging.
   *
   * @remarks
   * Includes: text, value, selected, title, placeholder, icon, type,
   * valueState, editable, busy, blocked. Only serializable values are
   * captured (strings, numbers, booleans, null).
   */
  readonly properties: Readonly<Record<string, unknown>>;

  /** Binding paths for data-bound properties (property name to model path). */
  readonly bindingPaths: Readonly<Record<string, string>>;

  /** Child controls discovered via parent-child traversal. */
  readonly children: readonly ControlTreeNode[];

  /** Present and `true` when this node's subtree was truncated due to depth/size limits. */
  readonly _truncated?: boolean;
}

// ── Snapshot types ───────────────────────────────────────────────────

/**
 * Top-level serialized control tree artifact attached to test results.
 *
 * @remarks
 * Produced by the browser script and attached via `testInfo.attach()`.
 * Contains all root-level controls (those with no UI5 parent in the
 * registry) and their complete subtrees.
 *
 * @example
 * ```typescript
 * const snapshot: ControlTreeSnapshot = {
 *   capturedAt: '2026-03-29T10:30:00.000Z',
 *   ui5Version: '1.120.4',
 *   totalControlCount: 342,
 *   roots: [rootNode1, rootNode2],
 *   pageUrl: 'https://host/app#PurchaseOrder-manage',
 *   truncated: false,
 * };
 * ```
 */
export interface ControlTreeSnapshot {
  /** ISO 8601 timestamp of capture. */
  readonly capturedAt: string;

  /** UI5 framework version detected on the page (e.g., `'1.120.4'`). */
  readonly ui5Version: string;

  /** Total number of controls found in the element registry. */
  readonly totalControlCount: number;

  /** Root-level controls (controls with no parent in the registry). */
  readonly roots: readonly ControlTreeNode[];

  /** Page URL at time of capture. */
  readonly pageUrl: string;

  /** `true` if the tree was truncated due to `maxControls` or `maxDepth` limits. */
  readonly truncated: boolean;
}

// ── Constants ────────────────────────────────────────────────────────

/** Playwright attachment name for control tree artifacts. */
export const CONTROL_TREE_ATTACHMENT_NAME = 'ui5-control-tree' as const;

/** Content type for control tree attachments. */
export const CONTROL_TREE_CONTENT_TYPE = 'application/json' as const;

/**
 * Curated property names extracted from each control during tree serialization.
 *
 * @remarks
 * These are the most common debugging-relevant UI5 control properties.
 * Only serializable values (string, number, boolean, null) are captured.
 */
export const CONTROL_TREE_PROPERTIES = Object.freeze([
  'text',
  'value',
  'selected',
  'title',
  'placeholder',
  'icon',
  'type',
  'valueState',
  'editable',
  'busy',
  'blocked',
  'required',
  'description',
] as const);
