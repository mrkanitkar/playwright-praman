/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser-context string scripts for table-operations module.
 *
 * @remarks
 * Extracted to keep `table-operations.ts` under 300 LOC.
 * Each exported function returns a self-contained IIFE string for `page.evaluate()`.
 * All dynamic values are pre-serialized via `JSON.stringify()` before interpolation.
 *
 * @module modules
 */

/** Wraps body in try/catch IIFE returning fallback on error. */
function iife(body: string, fallback: string): string {
  return `(function(){try{${body}}catch(e){console.warn("[praman] Table operation error:",e.message);return ${fallback};}})()`;
}

/** Generates `sap.ui.getCore().byId(id)` guard with fallback. */
function ctrl(id: string, fb: string): string {
  return `var c=sap.ui.getCore().byId(${JSON.stringify(id)});if(!c)return ${fb};`;
}

/** Selects grid or responsive branch. */
function br(isGrid: boolean, g: string, r: string): string {
  return isGrid ? g : r;
}

/**
 * Script: read column header names from a UI5 table.
 *
 * @param effectiveId - Resolved table control ID.
 * @param isGrid - Whether the table is a grid variant.
 * @returns IIFE string that evaluates to `string[]`.
 *
 * @example
 * ```typescript
 * const script = columnNamesScript('myTable', false);
 * const names = await page.evaluate<string[]>(script);
 * ```
 */
export function columnNamesScript(effectiveId: string, isGrid: boolean): string {
  const gridBody =
    'var cols=c.getColumns();var names=[];for(var i=0;i<cols.length;i++){' +
    'var lbl=cols[i].getLabel();names.push(typeof lbl==="string"?lbl:' +
    '(lbl&&typeof lbl.getText==="function"?lbl.getText():""));}return names;';
  const responsiveBody =
    'var cols=c.getColumns();var names=[];for(var i=0;i<cols.length;i++){' +
    'var hdr=cols[i].getHeader();names.push(hdr&&typeof hdr.getText==="function"?hdr.getText():"");}return names;';
  return iife(ctrl(effectiveId, '[]') + br(isGrid, gridBody, responsiveBody), '[]');
}

/**
 * Script: find first row matching column-value criteria.
 *
 * @param effectiveId - Resolved table control ID.
 * @param isGrid - Whether the table is a grid variant.
 * @param colNames - Serialized column names array.
 * @param criteria - Serialized column-value criteria object.
 * @returns IIFE string that evaluates to `number` (-1 if not found).
 *
 * @example
 * ```typescript
 * const script = findRowScript('t1', false, '["Name","Age"]', '{"Name":"Alice"}');
 * const idx = await page.evaluate<number>(script);
 * ```
 */
export function findRowScript(
  effectiveId: string,
  isGrid: boolean,
  colNames: string,
  criteria: string,
): string {
  const matchLogic =
    `var cn=${colNames};var crit=${criteria};` +
    'var rows=' +
    br(isGrid, 'c.getRows()', 'c.getItems()') +
    ';' +
    'for(var ri=0;ri<rows.length;ri++){var row=rows[ri];var cells=row.getCells();var match=true;' +
    'var keys=Object.keys(crit);for(var ki=0;ki<keys.length;ki++){var k=keys[ki];' +
    'var ci=cn.indexOf(k);if(ci<0){match=false;break;}var cell=cells[ci];' +
    'if(!cell){match=false;break;}' +
    'var v=typeof cell.getText==="function"?cell.getText():' +
    '(typeof cell.getValue==="function"?String(cell.getValue()):"");' +
    'if(v!==crit[k]){match=false;break;}}if(match)return ri;}return -1;';
  return iife(ctrl(effectiveId, '-1') + matchLogic, '-1');
}

/**
 * Script: fire press/tap on a table row.
 *
 * @param effectiveId - Resolved table control ID.
 * @param isGrid - Whether the table is a grid variant.
 * @param rowIndex - Zero-based row index.
 * @returns IIFE string that evaluates to `boolean`.
 *
 * @example
 * ```typescript
 * const script = clickRowScript('t1', false, 0);
 * const ok = await page.evaluate<boolean>(script);
 * ```
 */
export function clickRowScript(effectiveId: string, isGrid: boolean, rowIndex: number): string {
  const ri = JSON.stringify(rowIndex);
  const gridBody =
    `var rows=c.getRows();var row=rows[${ri}];if(!row)return false;` +
    'c.fireRowSelectionChange({rowIndex:' +
    ri +
    ',userInteraction:true});return true;';
  const responsiveBody =
    `var items=c.getItems();var item=items[${ri}];if(!item)return false;` +
    'if(typeof item.firePress==="function"){item.firePress();return true;}' +
    'if(typeof item.fireSelect==="function"){item.fireSelect();return true;}' +
    'if(item.$){item.$().trigger("tap");return true;}return false;';
  return iife(ctrl(effectiveId, 'false') + br(isGrid, gridBody, responsiveBody), 'false');
}

/**
 * Script: scroll grid table to make a row visible.
 *
 * @param effectiveId - Resolved table control ID.
 * @param rowIndex - Zero-based row index.
 * @returns IIFE string that evaluates to `boolean`.
 *
 * @example
 * ```typescript
 * const script = ensureRowVisibleScript('gridTable', 25);
 * await page.evaluate(script);
 * ```
 */
export function ensureRowVisibleScript(effectiveId: string, rowIndex: number): string {
  const ri = JSON.stringify(rowIndex);
  return iife(ctrl(effectiveId, 'false') + `c.setFirstVisibleRow(${ri});return true;`, 'false');
}

/**
 * Script: set a cell value via inner control interaction.
 *
 * @param effectiveId - Resolved table control ID.
 * @param isGrid - Whether the table is a grid variant.
 * @param rowIndex - Zero-based row index.
 * @param colIndex - Zero-based column index.
 * @param value - The value to set.
 * @returns IIFE string that evaluates to `boolean`.
 *
 * @example
 * ```typescript
 * const script = setCellValueScript('t1', false, 0, 1, 'hello');
 * const ok = await page.evaluate<boolean>(script);
 * ```
 */
export function setCellValueScript(
  effectiveId: string,
  isGrid: boolean,
  rowIndex: number,
  colIndex: number,
  value: string,
): string {
  const ri = JSON.stringify(rowIndex);
  const ci = JSON.stringify(colIndex);
  const val = JSON.stringify(value);
  const cellAccess =
    'var cells=row.getCells();var cell=cells[' +
    ci +
    '];if(!cell)return false;' +
    'if(typeof cell.setValue==="function"){cell.setValue(' +
    val +
    ');return true;}' +
    'if(typeof cell.setText==="function"){cell.setText(' +
    val +
    ');return true;}return false;';
  const gridBody = `var rows=c.getRows();var row=rows[${ri}];if(!row)return false;${cellAccess}`;
  const responsiveBody = `var items=c.getItems();var row=items[${ri}];if(!row)return false;${cellAccess}`;
  return iife(ctrl(effectiveId, 'false') + br(isGrid, gridBody, responsiveBody), 'false');
}

/**
 * Script: apply a filter to a table column.
 *
 * @param effectiveId - Resolved table control ID.
 * @param isGrid - Whether the table is a grid variant.
 * @param colIndex - Zero-based column index.
 * @param filterValue - The value to filter by.
 * @param operator - Filter operator (default: 'Contains').
 * @returns IIFE string that evaluates to `boolean`.
 *
 * @example
 * ```typescript
 * const script = filterByColumnScript('t1', true, 0, 'Active', 'EQ');
 * ```
 */
export function filterByColumnScript(
  effectiveId: string,
  isGrid: boolean,
  colIndex: number,
  filterValue: string,
  operator: string,
): string {
  const ci = JSON.stringify(colIndex);
  const fv = JSON.stringify(filterValue);
  const op = JSON.stringify(operator);
  const gridBody =
    `var cols=c.getColumns();var col=cols[${ci}];if(!col)return false;` +
    `if(typeof col.filter==="function"){col.filter(${fv},${op});return true;}return false;`;
  const responsiveBody =
    `var cols=c.getColumns();if(!cols[${ci}])return false;` +
    'var b=c.getBinding("items");if(!b)return false;' +
    `var path=b.getModel().getProperty("/");` +
    `var col=cols[${ci}];var bp=col.getHeader&&col.getHeader()&&typeof col.getHeader().getText==="function"?col.getHeader().getText():"";` +
    `var f=new sap.ui.model.Filter({path:bp,operator:${op},value1:${fv}});b.filter([f]);return true;`;
  return iife(ctrl(effectiveId, 'false') + br(isGrid, gridBody, responsiveBody), 'false');
}

/**
 * Script: apply a sort to a table column.
 *
 * @param effectiveId - Resolved table control ID.
 * @param isGrid - Whether the table is a grid variant.
 * @param colIndex - Zero-based column index.
 * @param descending - Sort descending if true.
 * @returns IIFE string that evaluates to `boolean`.
 *
 * @example
 * ```typescript
 * const script = sortByColumnScript('t1', true, 0, false);
 * ```
 */
export function sortByColumnScript(
  effectiveId: string,
  isGrid: boolean,
  colIndex: number,
  descending: boolean,
): string {
  const ci = JSON.stringify(colIndex);
  const desc = JSON.stringify(descending);
  const gridBody =
    `var cols=c.getColumns();var col=cols[${ci}];if(!col)return false;` +
    `if(typeof col.sort==="function"){col.sort(${desc});return true;}` +
    `var b=c.getBinding("rows");if(!b)return false;` +
    `var path=col.getSortProperty?col.getSortProperty():col.getLeadingProperty?col.getLeadingProperty():"";` +
    `var s=new sap.ui.model.Sorter(path,${desc});b.sort(s);return true;`;
  const responsiveBody =
    `var cols=c.getColumns();if(!cols[${ci}])return false;` +
    'var b=c.getBinding("items");if(!b)return false;' +
    `var col=cols[${ci}];var bp=col.getHeader&&col.getHeader()&&typeof col.getHeader().getText==="function"?col.getHeader().getText():"";` +
    `var s=new sap.ui.model.Sorter(bp,${desc});b.sort(s);return true;`;
  return iife(ctrl(effectiveId, 'false') + br(isGrid, gridBody, responsiveBody), 'false');
}

/**
 * Script: read current sort state from a table column.
 *
 * @param effectiveId - Resolved table control ID.
 * @param isGrid - Whether the table is a grid variant.
 * @param colIndex - Zero-based column index.
 * @returns IIFE string that evaluates to `SortOrderInfo | null`.
 *
 * @example
 * ```typescript
 * const script = getSortOrderScript('t1', true, 0);
 * ```
 */
export function getSortOrderScript(effectiveId: string, isGrid: boolean, colIndex: number): string {
  const ci = JSON.stringify(colIndex);
  const gridBody =
    `var cols=c.getColumns();var col=cols[${ci}];if(!col)return null;` +
    'var sorted=col.getSorted?col.getSorted():false;if(!sorted)return null;' +
    'var desc=col.getSortOrder?col.getSortOrder()==="Descending":false;' +
    `var lbl=col.getLabel();var name=typeof lbl==="string"?lbl:(lbl&&typeof lbl.getText==="function"?lbl.getText():"");` +
    `return{columnIndex:${ci},columnName:name,descending:desc};`;
  const responsiveBody =
    `var cols=c.getColumns();var col=cols[${ci}];if(!col)return null;` +
    'var so=col.getSortIndicator?col.getSortIndicator():"None";if(so==="None")return null;' +
    'var hdr=col.getHeader();var name=hdr&&typeof hdr.getText==="function"?hdr.getText():"";' +
    `return{columnIndex:${ci},columnName:name,descending:so==="Descending"};`;
  return iife(ctrl(effectiveId, 'null') + br(isGrid, gridBody, responsiveBody), 'null');
}

/**
 * Script: read current filter value from a table column.
 *
 * @param effectiveId - Resolved table control ID.
 * @param isGrid - Whether the table is a grid variant.
 * @param colIndex - Zero-based column index.
 * @returns IIFE string that evaluates to `string | null`.
 *
 * @example
 * ```typescript
 * const script = getFilterValueScript('t1', true, 0);
 * ```
 */
export function getFilterValueScript(
  effectiveId: string,
  isGrid: boolean,
  colIndex: number,
): string {
  const ci = JSON.stringify(colIndex);
  const gridBody =
    `var cols=c.getColumns();var col=cols[${ci}];if(!col)return null;` +
    'var fv=col.getFiltered?col.getFiltered():false;if(!fv)return null;' +
    'var val=col.getFilterValue?col.getFilterValue():"";return val||null;';
  const responsiveBody =
    `var cols=c.getColumns();var col=cols[${ci}];if(!col)return null;` +
    'var b=c.getBinding("items");if(!b)return null;' +
    'var filters=b.aFilters||[];if(filters.length===0)return null;' +
    'for(var i=0;i<filters.length;i++){if(filters[i].sPath){return filters[i].oValue1||null;}}return null;';
  return iife(ctrl(effectiveId, 'null') + br(isGrid, gridBody, responsiveBody), 'null');
}

/**
 * Script: export visible table data as array of objects keyed by column header.
 *
 * @param effectiveId - Resolved table control ID.
 * @param isGrid - Whether the table is a grid variant.
 * @param colNamesJson - Serialized column names array.
 * @param columnsJson - Serialized column indices to include (null for all).
 * @param includeHeaders - Whether headers are included (always true for data shape).
 * @returns IIFE string that evaluates to `Record<string, string>[]`.
 *
 * @example
 * ```typescript
 * const script = exportTableDataScript('t1', false, '["Name","Age"]', 'null', true);
 * ```
 */
export function exportTableDataScript(
  effectiveId: string,
  isGrid: boolean,
  colNamesJson: string,
  columnsJson: string,
): string {
  const rowAccess = br(isGrid, 'c.getRows()', 'c.getItems()');
  const body =
    `var cn=${colNamesJson};var cols=${columnsJson};` +
    `var rows=${rowAccess};var result=[];` +
    'for(var ri=0;ri<rows.length;ri++){var row=rows[ri];var cells=row.getCells();' +
    'var obj={};var indices=cols||[];if(indices.length===0){for(var j=0;j<cn.length;j++)indices.push(j);}' +
    'for(var k=0;k<indices.length;k++){var idx=indices[k];var cell=cells[idx];' +
    'var v=cell&&typeof cell.getText==="function"?cell.getText():' +
    '(cell&&typeof cell.getValue==="function"?String(cell.getValue()):"");' +
    'obj[cn[idx]||""]=v;}result.push(obj);}return result;';
  return iife(ctrl(effectiveId, '[]') + body, '[]');
}

/**
 * Script: click a settings/personalization button in the table toolbar.
 *
 * @param effectiveId - Resolved table control ID.
 * @returns IIFE string that evaluates to `boolean`.
 *
 * @example
 * ```typescript
 * const script = clickTableSettingsButtonScript('t1');
 * ```
 */
export function clickTableSettingsButtonScript(effectiveId: string): string {
  const body =
    'var tb=null;' +
    'if(typeof c.getToolbar==="function"){tb=c.getToolbar();}' +
    'if(!tb&&typeof c.getHeaderToolbar==="function"){tb=c.getHeaderToolbar();}' +
    'if(!tb)return false;' +
    'var items=tb.getContent?tb.getContent():[];' +
    'for(var i=0;i<items.length;i++){var it=items[i];' +
    'var icon=it.getIcon?it.getIcon():"";' +
    'if(icon.indexOf("settings")>=0||icon.indexOf("action-settings")>=0||icon.indexOf("personalization")>=0){' +
    'if(typeof it.firePress==="function"){it.firePress();return true;}}}return false;';
  return iife(ctrl(effectiveId, 'false') + body, 'false');
}
