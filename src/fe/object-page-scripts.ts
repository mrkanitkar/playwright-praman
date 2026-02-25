/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser-side string constants for Object Page operations.
 *
 * @remarks
 * All scripts are self-contained IIFEs intended for injection via `page.evaluate()`.
 * Scripts accepting arguments are non-self-executing IIFEs (no trailing `()`).
 * This file has ZERO runtime imports from the rest of the codebase.
 *
 * @module fe
 */

/**
 * Script to find the ObjectPageLayout control on the current page.
 *
 * @remarks
 * Self-executing IIFE. Returns `{ found: boolean; id: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(OP_FIND_LAYOUT_SCRIPT);
 * ```
 */
export const OP_FIND_LAYOUT_SCRIPT = `(function() {
  try {
    var core = sap.ui.getCore();
    var allElements = core.byFieldGroupId('');
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (el.getMetadata && el.getMetadata().getName() === 'sap.uxap.ObjectPageLayout') {
        return { found: true, id: el.getId() };
      }
    }
    return { found: false, id: '' };
  } catch (e) {
    return { found: false, id: '', error: e && e.message ? e.message : String(e) };
  }
})()`;

/**
 * Script to navigate to a section by title or ID.
 *
 * @remarks
 * Non-self-executing IIFE. Accepts the section identifier as argument.
 * Returns `{ success: boolean; reason?: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(OP_NAVIGATE_SECTION_SCRIPT, 'General');
 * ```
 */
export const OP_NAVIGATE_SECTION_SCRIPT = `(function(identifier) {
  try {
    var core = sap.ui.getCore();
    var allElements = core.byFieldGroupId('');
    var layout = null;
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (el.getMetadata && el.getMetadata().getName() === 'sap.uxap.ObjectPageLayout') {
        layout = el;
        break;
      }
    }
    if (!layout) return { success: false, reason: 'layout_not_found' };
    var sections = layout.getSections();
    for (var s = 0; s < sections.length; s++) {
      var sec = sections[s];
      if (sec.getId() === identifier || sec.getTitle() === identifier) {
        layout.setSelectedSection(sec.getId());
        return { success: true };
      }
    }
    return { success: false, reason: 'section_not_found' };
  } catch (e) {
    return { success: false, reason: 'error', error: e && e.message ? e.message : String(e) };
  }
})`;

/**
 * Script to read form field data from a section.
 *
 * @remarks
 * Non-self-executing IIFE. Accepts the section identifier as argument.
 * Returns `{ found: boolean; data: Record<string, unknown> }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(OP_GET_SECTION_DATA_SCRIPT, 'General');
 * ```
 */
export const OP_GET_SECTION_DATA_SCRIPT = `(function(identifier) {
  try {
    var core = sap.ui.getCore();
    var allElements = core.byFieldGroupId('');
    var layout = null;
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (el.getMetadata && el.getMetadata().getName() === 'sap.uxap.ObjectPageLayout') {
        layout = el;
        break;
      }
    }
    if (!layout) return { found: false, data: {} };
    var sections = layout.getSections();
    var targetSection = null;
    for (var s = 0; s < sections.length; s++) {
      var sec = sections[s];
      if (sec.getId() === identifier || sec.getTitle() === identifier) {
        targetSection = sec;
        break;
      }
    }
    if (!targetSection) return { found: false, data: {} };
    var data = {};
    var subSections = targetSection.getSubSections();
    for (var ss = 0; ss < subSections.length; ss++) {
      var blocks = subSections[ss].getBlocks();
      for (var b = 0; b < blocks.length; b++) {
        var block = blocks[b];
        if (block.getFormContainers) {
          var containers = block.getFormContainers();
          for (var c = 0; c < containers.length; c++) {
            var formElements = containers[c].getFormElements();
            for (var fe = 0; fe < formElements.length; fe++) {
              var label = formElements[fe].getLabel();
              var labelText = typeof label === 'string' ? label : (label && label.getText ? label.getText() : '');
              var fields = formElements[fe].getFields();
              if (fields.length > 0 && labelText) {
                var field = fields[0];
                var value = field.getText ? field.getText() : (field.getValue ? field.getValue() : '');
                data[labelText] = value;
              }
            }
          }
        }
      }
    }
    return { found: true, data: data };
  } catch (e) {
    return { found: false, data: {}, error: e && e.message ? e.message : String(e) };
  }
})`;

/**
 * Script to click a button by name in header actions or footer bar.
 *
 * @remarks
 * Non-self-executing IIFE. Accepts the button name as argument.
 * Returns `{ clicked: boolean; location?: string; reason?: string }`.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(OP_CLICK_BUTTON_SCRIPT, 'Edit');
 * ```
 */
export const OP_CLICK_BUTTON_SCRIPT = `(function(name) {
  try {
    var core = sap.ui.getCore();
    var allElements = core.byFieldGroupId('');
    var layout = null;
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (el.getMetadata && el.getMetadata().getName() === 'sap.uxap.ObjectPageLayout') {
        layout = el;
        break;
      }
    }
    if (!layout) return { clicked: false, reason: 'layout_not_found' };
    var headerContent = layout.getHeaderContent();
    if (headerContent) {
      for (var h = 0; h < headerContent.length; h++) {
        var ctrl = headerContent[h];
        if (ctrl.getText && ctrl.getText() === name && ctrl.firePress) {
          ctrl.firePress();
          return { clicked: true, location: 'header' };
        }
      }
    }
    for (var j = 0; j < allElements.length; j++) {
      var btn = allElements[j];
      if (btn.getMetadata && btn.getMetadata().getName() === 'sap.m.Button') {
        if (btn.getText && btn.getText() === name) {
          btn.firePress();
          return { clicked: true, location: 'footer' };
        }
      }
    }
    return { clicked: false, reason: 'button_not_found' };
  } catch (e) {
    return { clicked: false, reason: 'error', error: e && e.message ? e.message : String(e) };
  }
})`;

/**
 * Script to get all sections with metadata.
 *
 * @remarks
 * Self-executing IIFE. Returns an array of section descriptors.
 *
 * @example
 * ```typescript
 * const sections = await page.evaluate(OP_GET_SECTIONS_SCRIPT);
 * ```
 */
export const OP_GET_SECTIONS_SCRIPT = `(function() {
  try {
    var core = sap.ui.getCore();
    var allElements = core.byFieldGroupId('');
    var layout = null;
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (el.getMetadata && el.getMetadata().getName() === 'sap.uxap.ObjectPageLayout') {
        layout = el;
        break;
      }
    }
    if (!layout) return [];
    var sections = layout.getSections();
    var result = [];
    for (var s = 0; s < sections.length; s++) {
      var sec = sections[s];
      var subSections = sec.getSubSections();
      var subs = [];
      for (var ss = 0; ss < subSections.length; ss++) {
        subs.push({ id: subSections[ss].getId(), title: subSections[ss].getTitle() });
      }
      result.push({
        id: sec.getId(),
        title: sec.getTitle(),
        visible: sec.getVisible(),
        index: s,
        subSections: subs
      });
    }
    return result;
  } catch (e) {
    return [];
  }
})()`;

/**
 * Script to get the Object Page header title.
 *
 * @remarks
 * Self-executing IIFE. Returns the title string or empty string.
 *
 * @example
 * ```typescript
 * const title = await page.evaluate(OP_GET_HEADER_TITLE_SCRIPT);
 * ```
 */
export const OP_GET_HEADER_TITLE_SCRIPT = `(function() {
  try {
    var core = sap.ui.getCore();
    var allElements = core.byFieldGroupId('');
    var layout = null;
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (el.getMetadata && el.getMetadata().getName() === 'sap.uxap.ObjectPageLayout') {
        layout = el;
        break;
      }
    }
    if (!layout) return '';
    var headerTitle = layout.getHeaderTitle();
    if (!headerTitle) return '';
    return headerTitle.getObjectTitle ? headerTitle.getObjectTitle() : '';
  } catch (e) {
    return '';
  }
})()`;

/**
 * Script to check if the Object Page is in edit mode.
 *
 * @remarks
 * Self-executing IIFE. Checks `showFooter` and `ui` model properties.
 * Returns boolean.
 *
 * @example
 * ```typescript
 * const editing = await page.evaluate(OP_IS_EDIT_MODE_SCRIPT);
 * ```
 */
export const OP_IS_EDIT_MODE_SCRIPT = `(function() {
  try {
    var core = sap.ui.getCore();
    var allElements = core.byFieldGroupId('');
    var layout = null;
    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      if (el.getMetadata && el.getMetadata().getName() === 'sap.uxap.ObjectPageLayout') {
        layout = el;
        break;
      }
    }
    if (!layout) return false;
    if (layout.getShowFooter && layout.getShowFooter()) return true;
    var uiModel = layout.getModel('ui');
    if (uiModel) {
      var editable = uiModel.getProperty('/editable');
      if (editable === true) return true;
      var editMode = uiModel.getProperty('/editMode');
      if (editMode === 'Editable' || editMode === true) return true;
    }
    return false;
  } catch (e) {
    return false;
  }
})()`;

/**
 * Script to wait for UI5 stability (non-dirty state).
 *
 * @remarks
 * Self-executing IIFE. Returns boolean indicating stability.
 *
 * @example
 * ```typescript
 * await page.waitForFunction(OP_STABILITY_SCRIPT);
 * ```
 */
export const OP_STABILITY_SCRIPT = `(function() {
  try {
    return !sap.ui.getCore().getUIDirty();
  } catch (e) {
    return true;
  }
})()`;
