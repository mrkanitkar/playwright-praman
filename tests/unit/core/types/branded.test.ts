/**
 * Tests for `src/core/types/branded.ts`.
 *
 * @remarks
 * Verifies branded types prevent accidental mixing at the type level
 * and factory functions produce correctly branded values.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';

import type {
  AppId,
  BindingPath,
  ControlId,
  CSSSelector,
  EntitySetName,
  ODataUrl,
  SemanticObject,
  ViewName,
  XPathSelector,
} from '#core/types/branded.js';
import {
  appId,
  bindingPath,
  controlId,
  cssSelector,
  entitySetName,
  odataUrl,
  semanticObject,
  viewName,
  xpathSelector,
} from '#core/types/branded.js';

describe('Branded types', () => {
  // ── Factory functions ─────────────────────────────────────────────

  describe('controlId()', () => {
    it('creates a ControlId from a string', () => {
      const id = controlId('myButton');
      expect(id).toBe('myButton');
    });

    it('returns a value typed as ControlId', () => {
      const id = controlId('btn1');
      expectTypeOf(id).toExtend<ControlId>();
    });
  });

  describe('viewName()', () => {
    it('creates a ViewName from a string', () => {
      const name = viewName('my.app.View1');
      expect(name).toBe('my.app.View1');
    });

    it('returns a value typed as ViewName', () => {
      const name = viewName('my.app.Main');
      expectTypeOf(name).toExtend<ViewName>();
    });
  });

  describe('bindingPath()', () => {
    it('creates a BindingPath from a string', () => {
      const path = bindingPath('/Products(1)/Name');
      expect(path).toBe('/Products(1)/Name');
    });

    it('returns a value typed as BindingPath', () => {
      const path = bindingPath('/SalesOrders');
      expectTypeOf(path).toExtend<BindingPath>();
    });
  });

  describe('semanticObject()', () => {
    it('creates a SemanticObject from a string', () => {
      const obj = semanticObject('PurchaseOrder');
      expect(obj).toBe('PurchaseOrder');
    });

    it('returns a value typed as SemanticObject', () => {
      const obj = semanticObject('SalesOrder');
      expectTypeOf(obj).toExtend<SemanticObject>();
    });
  });

  describe('entitySetName()', () => {
    it('creates an EntitySetName from a string', () => {
      const es = entitySetName('Products');
      expect(es).toBe('Products');
    });

    it('returns a value typed as EntitySetName', () => {
      const es = entitySetName('PurchaseOrders');
      expectTypeOf(es).toExtend<EntitySetName>();
    });
  });

  describe('cssSelector()', () => {
    it('creates a CSSSelector from a string', () => {
      const sel = cssSelector('.sapMBtn');
      expect(sel).toBe('.sapMBtn');
    });

    it('returns a value typed as CSSSelector', () => {
      const sel = cssSelector('#myControl');
      expectTypeOf(sel).toExtend<CSSSelector>();
    });
  });

  describe('xpathSelector()', () => {
    it('creates an XPathSelector from a string', () => {
      const xpath = xpathSelector('//button[@id="submit"]');
      expect(xpath).toBe('//button[@id="submit"]');
    });

    it('returns a value typed as XPathSelector', () => {
      const xpath = xpathSelector('//div[@class="content"]');
      expectTypeOf(xpath).toExtend<XPathSelector>();
    });
  });

  describe('odataUrl()', () => {
    it('creates an ODataUrl from a string', () => {
      const url = odataUrl('/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV');
      expect(url).toBe('/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV');
    });

    it('returns a value typed as ODataUrl', () => {
      const url = odataUrl('/sap/opu/odata/sap/API_SALESORDER_SRV');
      expectTypeOf(url).toExtend<ODataUrl>();
    });
  });

  describe('appId()', () => {
    it('creates an AppId from a string', () => {
      const app = appId('PurchaseOrder-manage');
      expect(app).toBe('PurchaseOrder-manage');
    });

    it('returns a value typed as AppId', () => {
      const app = appId('SalesOrder-display');
      expectTypeOf(app).toExtend<AppId>();
    });
  });

  // ── Type-level discrimination tests ──────────────────────────────

  describe('type discrimination', () => {
    it('ControlId extends string', () => {
      expectTypeOf<ControlId>().toExtend<string>();
    });

    it('ViewName extends string', () => {
      expectTypeOf<ViewName>().toExtend<string>();
    });

    it('BindingPath extends string', () => {
      expectTypeOf<BindingPath>().toExtend<string>();
    });

    it('SemanticObject extends string', () => {
      expectTypeOf<SemanticObject>().toExtend<string>();
    });

    it('EntitySetName extends string', () => {
      expectTypeOf<EntitySetName>().toExtend<string>();
    });

    it('ControlId is not assignable to ViewName', () => {
      expectTypeOf<ControlId>().not.toExtend<ViewName>();
    });

    it('ViewName is not assignable to BindingPath', () => {
      expectTypeOf<ViewName>().not.toExtend<BindingPath>();
    });

    it('BindingPath is not assignable to SemanticObject', () => {
      expectTypeOf<BindingPath>().not.toExtend<SemanticObject>();
    });

    it('SemanticObject is not assignable to EntitySetName', () => {
      expectTypeOf<SemanticObject>().not.toExtend<EntitySetName>();
    });

    it('CSSSelector extends string', () => {
      expectTypeOf<CSSSelector>().toExtend<string>();
    });

    it('XPathSelector extends string', () => {
      expectTypeOf<XPathSelector>().toExtend<string>();
    });

    it('ODataUrl extends string', () => {
      expectTypeOf<ODataUrl>().toExtend<string>();
    });

    it('AppId extends string', () => {
      expectTypeOf<AppId>().toExtend<string>();
    });

    it('CSSSelector is not assignable to XPathSelector', () => {
      expectTypeOf<CSSSelector>().not.toExtend<XPathSelector>();
    });

    it('XPathSelector is not assignable to ODataUrl', () => {
      expectTypeOf<XPathSelector>().not.toExtend<ODataUrl>();
    });

    it('ODataUrl is not assignable to AppId', () => {
      expectTypeOf<ODataUrl>().not.toExtend<AppId>();
    });

    it('AppId is not assignable to CSSSelector', () => {
      expectTypeOf<AppId>().not.toExtend<CSSSelector>();
    });

    it('CSSSelector is not assignable to ControlId', () => {
      expectTypeOf<CSSSelector>().not.toExtend<ControlId>();
    });

    it('plain string is not assignable to ControlId', () => {
      expectTypeOf<string>().not.toExtend<ControlId>();
    });
  });

  // ── Runtime behavior ────────────────────────────────────────────

  describe('runtime behavior', () => {
    it('branded values work as plain strings at runtime', () => {
      const id = controlId('myControl');
      expect(id.startsWith('my')).toBe(true);
      expect(id).toHaveLength(9);
      expect(id.toUpperCase()).toBe('MYCONTROL');
    });

    it('branded values are strictly equal to their source string', () => {
      const raw = 'testId';
      const branded = controlId(raw);
      expect(branded).toBe(raw);
    });
  });
});
