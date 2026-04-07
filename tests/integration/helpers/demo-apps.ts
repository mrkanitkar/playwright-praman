/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Public SAP UI5 demo app URLs pinned to version 1.146.0.
 *
 * These apps run against local mock servers — no auth required.
 * Safe for CI: always available, deterministic data.
 */

export const UI5_VERSION = '1.146.0';
const CDN_BASE = `https://ui5.sap.com/${UI5_VERSION}/test-resources`;

/** Standalone demo apps with bundled mock OData server. */
export const APPS = {
  /** Shopping Cart — sap.m.List, sap.m.Table, cart dialog, search, navigation. */
  CART: `${CDN_BASE}/sap/m/demokit/cart/webapp/index.html`,
  /** Browse Orders — master-detail, sap.m.Table with mock data rows. */
  BROWSE_ORDERS: `${CDN_BASE}/sap/m/demokit/orderbrowser/webapp/test/mockServer.html`,
  /** Worklist — sap.m.Table with sorting/filtering, simple layout. */
  WORKLIST: `${CDN_BASE}/sap/m/demokit/worklist/webapp/test/mockServer.html`,
  /** Bulletin Board — simple CRUD table app. Reserved for future tests. */
  BULLETIN_BOARD: `${CDN_BASE}/sap/m/demokit/bulletinboard/webapp/test/mockServer.html`,
} as const;
