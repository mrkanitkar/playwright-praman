/**
 * Check 8: SAP UI5 API Validation
 *
 * Validates that SAP UI5 control types, properties, methods, and events
 * referenced in documentation actually exist in the UI5 API.
 * Uses ui5.sap.com API with local file caching.
 */

import type {
  DocCheck,
  CheckResult,
  CheckFinding,
  DocUnderTest,
  SharedContext,
  UI5ControlMetadata,
} from '../lib/types.js';
import { extractSapUi5References, findClosestMatch } from '../lib/markdown-parser.js';
import { fetchUi5ControlMetadata } from '../lib/ui5-api-fetcher.js';

/**
 * Resolve control metadata, checking context cache first.
 */
async function resolveMetadata(
  controlType: string,
  context: SharedContext,
): Promise<UI5ControlMetadata | undefined> {
  if (context.ui5ApiCache.has(controlType)) {
    return context.ui5ApiCache.get(controlType);
  }

  const metadata = await fetchUi5ControlMetadata(controlType);
  context.ui5ApiCache.set(controlType, metadata);
  return metadata;
}

/**
 * Check 8: Verify SAP UI5 API references in documentation.
 */
export const check8SapUi5Api: DocCheck = {
  name: 'sap-ui5-api',

  async run(doc: DocUnderTest, context: SharedContext): Promise<CheckResult> {
    const start = Date.now();
    const errors: CheckFinding[] = [];
    const warnings: CheckFinding[] = [];

    const refs = extractSapUi5References(doc.content);

    // Skip if no SAP UI5 references
    const totalRefs =
      refs.controlTypes.length +
      refs.propertyUsages.length +
      refs.methodCalls.length +
      refs.eventNames.length;

    if (totalRefs === 0) {
      return {
        check: 'sap-ui5-api',
        status: 'skip',
        errors: [],
        warnings: [],
        skipReason: 'No SAP UI5 references found',
        durationMs: Date.now() - start,
      };
    }

    // Check control types
    for (const ref of refs.controlTypes) {
      let metadata: UI5ControlMetadata | undefined;
      try {
        metadata = await resolveMetadata(ref.name, context);
      } catch {
        // Network error — skip this control
        continue;
      }

      if (!metadata) {
        errors.push({
          severity: 'error',
          line: ref.line,
          message: `Unknown SAP UI5 control type: ${ref.name}`,
          suggestion: 'Verify the control type exists in the UI5 SDK documentation',
        });
        continue;
      }

      if (metadata.deprecated) {
        warnings.push({
          severity: 'warning',
          line: ref.line,
          message: `Deprecated control: ${ref.name} (since ${metadata.deprecated.since})`,
          suggestion: metadata.deprecated.text ?? 'Consider using a non-deprecated alternative',
        });
      }
    }

    // Check property usages
    for (const usage of refs.propertyUsages) {
      let metadata: UI5ControlMetadata | undefined;
      try {
        metadata = await resolveMetadata(usage.controlType, context);
      } catch {
        continue;
      }

      if (!metadata) continue; // control not found — already reported above

      for (const propName of usage.properties) {
        const prop = metadata.properties.get(propName);
        if (prop) {
          if (prop.deprecated) {
            warnings.push({
              severity: 'warning',
              line: usage.line,
              message: `Deprecated property: ${usage.controlType}#${propName} (since ${prop.deprecated.since})`,
            });
          }
          continue;
        }

        // Check if it's actually an aggregation (common confusion)
        const agg = metadata.aggregations.get(propName);
        if (agg) {
          warnings.push({
            severity: 'warning',
            line: usage.line,
            message: `'${propName}' on ${usage.controlType} is an aggregation, not a property`,
            suggestion: 'Use aggregation binding syntax instead of property binding',
          });
          continue;
        }

        // Property not found — suggest closest match
        const suggestion = findClosestMatch(propName, metadata.properties);
        errors.push({
          severity: 'error',
          line: usage.line,
          message: `Unknown property '${propName}' on ${usage.controlType}`,
          suggestion: suggestion
            ? `Did you mean '${suggestion}'?`
            : `Available properties: ${[...metadata.properties.keys()].slice(0, 5).join(', ')}`,
        });
      }
    }

    // Check method calls
    for (const call of refs.methodCalls) {
      let metadata: UI5ControlMetadata | undefined;
      try {
        metadata = await resolveMetadata(call.controlType, context);
      } catch {
        continue;
      }

      if (!metadata) continue;

      const method = metadata.methods.get(call.methodName);
      if (method) {
        if (method.deprecated) {
          warnings.push({
            severity: 'warning',
            line: call.line,
            message: `Deprecated method: ${call.controlType}#${call.methodName} (since ${method.deprecated.since})`,
          });
        }
        continue;
      }

      const closestMethod = findClosestMatch(call.methodName, metadata.methods);
      const methodFinding: CheckFinding = {
        severity: 'error',
        line: call.line,
        message: `Unknown method '${call.methodName}' on ${call.controlType}`,
      };
      if (closestMethod) {
        methodFinding.suggestion = `Did you mean '${closestMethod}'?`;
      }
      errors.push(methodFinding);
    }

    // Check event names
    for (const evt of refs.eventNames) {
      let metadata: UI5ControlMetadata | undefined;
      try {
        metadata = await resolveMetadata(evt.controlType, context);
      } catch {
        continue;
      }

      if (!metadata) continue;

      const event = metadata.events.get(evt.eventName);
      if (event) {
        if (event.deprecated) {
          warnings.push({
            severity: 'warning',
            line: evt.line,
            message: `Deprecated event: ${evt.controlType}#${evt.eventName} (since ${event.deprecated.since})`,
          });
        }
        continue;
      }

      const closestEvent = findClosestMatch(evt.eventName, metadata.events);
      const eventFinding: CheckFinding = {
        severity: 'error',
        line: evt.line,
        message: `Unknown event '${evt.eventName}' on ${evt.controlType}`,
      };
      if (closestEvent) {
        eventFinding.suggestion = `Did you mean '${closestEvent}'?`;
      }
      errors.push(eventFinding);
    }

    const status = errors.length > 0 ? 'fail' : warnings.length > 0 ? 'warn' : 'pass';

    return {
      check: 'sap-ui5-api',
      status,
      errors,
      warnings,
      durationMs: Date.now() - start,
    };
  },
};
