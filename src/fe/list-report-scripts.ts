/**
 * Browser-side string constants for Fiori Elements List Report operations.
 *
 * @remarks
 * All scripts are self-contained IIFEs intended for injection via `page.evaluate()`.
 * Scripts accepting arguments are non-self-executing IIFEs (no trailing `()`).
 * This file has ZERO runtime imports from the rest of the codebase.
 *
 * @module fe
 */

/**
 * Script to find the main table control on a List Report page.
 *
 * @remarks
 * Self-executing IIFE. Searches for SmartTable first, then MDC Table.
 * Returns `{ found: boolean; id: string; type: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(LR_FIND_TABLE_SCRIPT);
 * ```
 */
export const LR_FIND_TABLE_SCRIPT = `(function() {
  try {
    var core = sap.ui.getCore();
    var all = core.byFieldGroupId('');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.getMetadata && el.getMetadata().getName() === 'sap.ui.comp.smarttable.SmartTable') {
        return { found: true, id: el.getId(), type: 'SmartTable' };
      }
    }
    for (var j = 0; j < all.length; j++) {
      var el2 = all[j];
      if (el2.getMetadata && el2.getMetadata().getName() === 'sap.ui.mdc.Table') {
        return { found: true, id: el2.getId(), type: 'MDCTable' };
      }
    }
    return { found: false, id: '', type: '' };
  } catch (e) {
    return { found: false, id: '', type: '', error: e && e.message ? e.message : String(e) };
  }
})()`;

/**
 * Script to find the filter bar control on a List Report page.
 *
 * @remarks
 * Self-executing IIFE. Searches for SmartFilterBar first, then MDC FilterBar.
 * Returns `{ found: boolean; id: string; type: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(LR_FIND_FILTER_BAR_SCRIPT);
 * ```
 */
export const LR_FIND_FILTER_BAR_SCRIPT = `(function() {
  try {
    var core = sap.ui.getCore();
    var all = core.byFieldGroupId('');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.getMetadata && el.getMetadata().getName() === 'sap.ui.comp.smartfilterbar.SmartFilterBar') {
        return { found: true, id: el.getId(), type: 'SmartFilterBar' };
      }
    }
    for (var j = 0; j < all.length; j++) {
      var el2 = all[j];
      if (el2.getMetadata && el2.getMetadata().getName() === 'sap.ui.mdc.FilterBar') {
        return { found: true, id: el2.getId(), type: 'MDCFilterBar' };
      }
    }
    return { found: false, id: '', type: '' };
  } catch (e) {
    return { found: false, id: '', type: '', error: e && e.message ? e.message : String(e) };
  }
})()`;

/**
 * Script to set a filter field value. Non-self-executing IIFE.
 *
 * @remarks
 * Accepts `{ filterBarId: string; fieldName: string; value: string }` as argument.
 * Returns `{ success: boolean; reason?: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(LR_SET_FILTER_FIELD_SCRIPT, { filterBarId, fieldName, value });
 * ```
 */
export const LR_SET_FILTER_FIELD_SCRIPT = `(function(arg) {
  try {
    var core = sap.ui.getCore();
    var c = core.byId(arg.filterBarId);
    if (!c) return { success: false, reason: 'filter_bar_not_found' };
    if (typeof c.getControlByKey === 'function') {
      var ctrl = c.getControlByKey(arg.fieldName);
      if (ctrl) {
        if (typeof ctrl.setValue === 'function') { ctrl.setValue(arg.value); return { success: true }; }
        if (typeof ctrl.setSelectedKey === 'function') { ctrl.setSelectedKey(arg.value); return { success: true }; }
      }
    }
    var filterItems = [];
    if (typeof c.getFilterGroupItems === 'function') { filterItems = c.getFilterGroupItems(); }
    else if (typeof c.getFilterItems === 'function') { filterItems = c.getFilterItems(); }
    for (var i = 0; i < filterItems.length; i++) {
      var item = filterItems[i];
      var name = item.getName ? item.getName() : (item.getLabel ? item.getLabel() : '');
      if (name === arg.fieldName) {
        var control = item.getControl ? item.getControl() : null;
        if (control && typeof control.setValue === 'function') { control.setValue(arg.value); return { success: true }; }
        if (control && typeof control.setSelectedKey === 'function') { control.setSelectedKey(arg.value); return { success: true }; }
      }
    }
    return { success: false, reason: 'field_not_found' };
  } catch (e) {
    return { success: false, reason: e && e.message ? e.message : String(e) };
  }
})`;

/**
 * Script to get a filter field value. Non-self-executing IIFE.
 *
 * @remarks
 * Accepts `{ filterBarId: string; fieldName: string }` as argument.
 * Returns `{ found: boolean; value: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(LR_GET_FILTER_FIELD_SCRIPT, { filterBarId, fieldName });
 * ```
 */
export const LR_GET_FILTER_FIELD_SCRIPT = `(function(arg) {
  try {
    var core = sap.ui.getCore();
    var c = core.byId(arg.filterBarId);
    if (!c) return { found: false, value: '' };
    if (typeof c.getControlByKey === 'function') {
      var ctrl = c.getControlByKey(arg.fieldName);
      if (ctrl) {
        var v = ctrl.getValue ? ctrl.getValue() : (ctrl.getSelectedKey ? ctrl.getSelectedKey() : '');
        return { found: true, value: String(v) };
      }
    }
    var filterItems = [];
    if (typeof c.getFilterGroupItems === 'function') { filterItems = c.getFilterGroupItems(); }
    else if (typeof c.getFilterItems === 'function') { filterItems = c.getFilterItems(); }
    for (var i = 0; i < filterItems.length; i++) {
      var item = filterItems[i];
      var name = item.getName ? item.getName() : (item.getLabel ? item.getLabel() : '');
      if (name === arg.fieldName) {
        var control = item.getControl ? item.getControl() : null;
        if (control) {
          var val = control.getValue ? control.getValue() : (control.getSelectedKey ? control.getSelectedKey() : '');
          return { found: true, value: String(val) };
        }
      }
    }
    return { found: false, value: '' };
  } catch (e) {
    return { found: false, value: '' };
  }
})`;

/**
 * Script to execute search on a filter bar. Non-self-executing IIFE.
 *
 * @remarks
 * Accepts the filter bar ID as argument.
 * Returns `{ success: boolean; reason?: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(LR_EXECUTE_SEARCH_SCRIPT, filterBarId);
 * ```
 */
export const LR_EXECUTE_SEARCH_SCRIPT = `(function(filterBarId) {
  try {
    var c = sap.ui.getCore().byId(filterBarId);
    if (!c) return { success: false, reason: 'filter_bar_not_found' };
    if (typeof c.search === 'function') { c.search(); return { success: true }; }
    if (typeof c.triggerSearch === 'function') { c.triggerSearch(); return { success: true }; }
    if (typeof c.fireSearch === 'function') { c.fireSearch(); return { success: true }; }
    return { success: false, reason: 'no_search_method' };
  } catch (e) {
    return { success: false, reason: e && e.message ? e.message : String(e) };
  }
})`;

/**
 * Script to clear all filter bar fields. Non-self-executing IIFE.
 *
 * @remarks
 * Accepts the filter bar ID as argument.
 * Returns `{ success: boolean; reason?: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(LR_CLEAR_FILTER_BAR_SCRIPT, filterBarId);
 * ```
 */
export const LR_CLEAR_FILTER_BAR_SCRIPT = `(function(filterBarId) {
  try {
    var c = sap.ui.getCore().byId(filterBarId);
    if (!c) return { success: false, reason: 'filter_bar_not_found' };
    if (typeof c.clear === 'function') { c.clear(); return { success: true }; }
    if (typeof c.getFilterGroupItems === 'function') {
      var items = c.getFilterGroupItems();
      for (var i = 0; i < items.length; i++) {
        var ctrl = items[i].getControl ? items[i].getControl() : null;
        if (ctrl && typeof ctrl.setValue === 'function') { ctrl.setValue(''); }
      }
      return { success: true };
    }
    if (typeof c.getFilterItems === 'function') {
      var fitems = c.getFilterItems();
      for (var j = 0; j < fitems.length; j++) {
        var fctrl = fitems[j].getControl ? fitems[j].getControl() : null;
        if (fctrl && typeof fctrl.setValue === 'function') { fctrl.setValue(''); }
      }
      return { success: true };
    }
    return { success: false, reason: 'no_clear_method' };
  } catch (e) {
    return { success: false, reason: e && e.message ? e.message : String(e) };
  }
})`;

/**
 * Script to navigate to a table item by row index. Non-self-executing IIFE.
 *
 * @remarks
 * Accepts `{ tableId: string; rowIndex: number }` as argument.
 * Returns `{ success: boolean; reason?: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(LR_NAVIGATE_TO_ITEM_SCRIPT, { tableId, rowIndex });
 * ```
 */
export const LR_NAVIGATE_TO_ITEM_SCRIPT = `(function(arg) {
  try {
    var c = sap.ui.getCore().byId(arg.tableId);
    if (!c) return { success: false, reason: 'table_not_found' };
    var inner = c;
    if (typeof c.getTable === 'function') { var t = c.getTable(); if (t) inner = t; }
    var items = [];
    if (typeof inner.getItems === 'function') { items = inner.getItems(); }
    else if (typeof inner.getRows === 'function') { items = inner.getRows(); }
    if (arg.rowIndex < 0 || arg.rowIndex >= items.length) {
      return { success: false, reason: 'index_out_of_bounds' };
    }
    var row = items[arg.rowIndex];
    if (typeof row.firePress === 'function') { row.firePress(); return { success: true }; }
    if (typeof row.fireTap === 'function') { row.fireTap(); return { success: true }; }
    var cells = row.getCells ? row.getCells() : [];
    if (cells.length > 0 && typeof cells[0].firePress === 'function') {
      cells[0].firePress(); return { success: true };
    }
    var domRef = row.getDomRef ? row.getDomRef() : null;
    if (domRef) { domRef.click(); return { success: true }; }
    return { success: false, reason: 'no_press_method' };
  } catch (e) {
    return { success: false, reason: e && e.message ? e.message : String(e) };
  }
})`;

/**
 * Script to get available variant names. Self-executing IIFE.
 *
 * @remarks
 * Returns `{ found: boolean; variants: string[] }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(LR_GET_VARIANTS_SCRIPT);
 * ```
 */
export const LR_GET_VARIANTS_SCRIPT = `(function() {
  try {
    var core = sap.ui.getCore();
    var all = core.byFieldGroupId('');
    var vmControl = null;
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.getMetadata) {
        var name = el.getMetadata().getName();
        if (name === 'sap.ui.fl.variants.VariantManagement' || name === 'sap.ui.comp.variants.VariantManagement') {
          vmControl = el;
          break;
        }
      }
    }
    if (!vmControl) return { found: false, variants: [] };
    var variants = [];
    if (typeof vmControl.getVariants === 'function') {
      var items = vmControl.getVariants();
      for (var j = 0; j < items.length; j++) {
        var title = items[j].title || items[j].getText && items[j].getText() || '';
        if (title) variants.push(title);
      }
    } else if (typeof vmControl.getVariantItems === 'function') {
      var vitems = vmControl.getVariantItems();
      for (var k = 0; k < vitems.length; k++) {
        var vtext = vitems[k].getText ? vitems[k].getText() : '';
        if (vtext) variants.push(vtext);
      }
    }
    return { found: true, variants: variants };
  } catch (e) {
    return { found: false, variants: [] };
  }
})()`;

/**
 * Script to select a variant by name. Non-self-executing IIFE.
 *
 * @remarks
 * Accepts the variant name as argument.
 * Returns `{ success: boolean; reason?: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(LR_SELECT_VARIANT_SCRIPT, 'My Variant');
 * ```
 */
export const LR_SELECT_VARIANT_SCRIPT = `(function(variantName) {
  try {
    var core = sap.ui.getCore();
    var all = core.byFieldGroupId('');
    var vmControl = null;
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.getMetadata) {
        var name = el.getMetadata().getName();
        if (name === 'sap.ui.fl.variants.VariantManagement' || name === 'sap.ui.comp.variants.VariantManagement') {
          vmControl = el;
          break;
        }
      }
    }
    if (!vmControl) return { success: false, reason: 'variant_management_not_found' };
    if (typeof vmControl.getVariants === 'function') {
      var items = vmControl.getVariants();
      for (var j = 0; j < items.length; j++) {
        var title = items[j].title || '';
        var key = items[j].key || '';
        if (title === variantName) {
          if (typeof vmControl.setCurrentVariantKey === 'function') {
            vmControl.setCurrentVariantKey(key);
            return { success: true };
          }
        }
      }
    }
    if (typeof vmControl.getVariantItems === 'function') {
      var vitems = vmControl.getVariantItems();
      for (var k = 0; k < vitems.length; k++) {
        var vtext = vitems[k].getText ? vitems[k].getText() : '';
        var vkey = vitems[k].getKey ? vitems[k].getKey() : '';
        if (vtext === variantName) {
          if (typeof vmControl.setSelectedKey === 'function') {
            vmControl.setSelectedKey(vkey);
            return { success: true };
          }
          if (typeof vmControl.setCurrentVariantKey === 'function') {
            vmControl.setCurrentVariantKey(vkey);
            return { success: true };
          }
        }
      }
    }
    return { success: false, reason: 'variant_not_found' };
  } catch (e) {
    return { success: false, reason: e && e.message ? e.message : String(e) };
  }
})`;

/**
 * Script to wait for UI5 stability (non-pending state).
 *
 * @remarks
 * Self-executing IIFE. Returns boolean indicating stability.
 *
 * @example
 * ```typescript
 * await page.waitForFunction(LR_STABILITY_SCRIPT);
 * ```
 */
export const LR_STABILITY_SCRIPT = `(function() {
  try {
    return !sap.ui.getCore().getUIDirty();
  } catch (e) {
    return true;
  }
})()`;
