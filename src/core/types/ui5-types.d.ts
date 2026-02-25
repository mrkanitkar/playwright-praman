/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Ambient type declarations for SAP UI5 browser globals.
 *
 * @remarks
 * These declarations type the `sap` global and `window.__praman_*` bridge
 * functions available in the browser context during `page.evaluate()`.
 * They are NOT runtime code — they only provide TypeScript type information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any -- Browser globals use any for untyped SAP APIs */
/* eslint-disable @typescript-eslint/no-extraneous-class -- SAP API classes have only static methods */
/* eslint-disable @typescript-eslint/naming-convention -- Window augmentation requires __praman_* names */

/** SAP UI5 global namespace (minimal subset used by Praman). */
declare namespace sap {
  namespace ui {
    /** UI5 framework version string (e.g. `'1.142.4'`). */
    const version: string;
    function getCore(): {
      byId(id: string): any;
      /** Internal element map — may be `undefined` in UI5 1.142+. */
      mElements?: Record<string, any>;
      /** Returns all controls matching a field-group ID; pass `''` for all. */
      byFieldGroupId(groupId: string): any[];
      /** Global OData models keyed by name. */
      oModels?: Record<string, any>;
    };
    function require(module: string): any;
    namespace core {
      class Element {
        static getElementById(id: string): any;
      }
    }
    namespace test {
      class RecordReplay {
        static findAllDOMElementsByControlSelector(selector: any): Promise<any[]>;
        static findDOMElementByControlSelector(selector: any): Promise<any>;
        static interactWithControl(selector: any): Promise<void>;
      }
    }
  }
  namespace ushell {
    const Container: {
      getUser(): {
        getLanguage(): string;
        getDateFormat(): string;
        getTimeFormat(): string;
        getTimezone(): string;
        getNumberFormat(): string;
      };
    };
  }
}

/** Praman bridge functions injected into the browser context. */
interface Window {
  /** Three-tier control resolution (ElementRegistry → Core.byId → Element.getElementById). */
  __praman_getById?: (id: string) => any;
  /** Bridge adapter presence flag. */
  __praman_bridge?: Record<string, (...args: any[]) => any>;
  /** Find control by selector (bridge method). */
  __praman_findControl?: (selector: any, timeout: number) => any;
}
