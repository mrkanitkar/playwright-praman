# Praman Recipes Reference

> **Generated**: 2026-02-20 — do not edit manually, run `npm run generate:skill-md`
> Top 20 recipes extracted from @example TSDoc blocks

## VERSION

Package version — kept in sync with package.json via build script.

```typescript
import { VERSION, PACKAGE_NAME } from './version.js';
console.log(`${PACKAGE_NAME}@${VERSION}`);
```

---

## PACKAGE_NAME

Package name — used in telemetry and error reporting.

```typescript
import { PACKAGE_NAME } from './version.js';
```

---

## createUI5SelectorEngineScript

Creates a UI5 selector engine script for Playwright registration.

```typescript
import { createUI5SelectorEngineScript } from './ui5-selector-engine.js';

const engine = createUI5SelectorEngineScript();
// Later: selectors.register('ui5', engine);
```

---

## coercePropertyValue

Coerces a raw string property value to its typed equivalent.

```typescript
coercePropertyValue('true'); // true
coercePropertyValue('42'); // 42
coercePropertyValue('hello'); // 'hello'
```

---

## parseProperties

Parses property blocks from a selector body string.

```typescript
parseProperties('[text=Save][enabled=true]');
// { text: 'Save', enabled: true }
```

---

## parseUI5Selector

Parses a `ui5=...` selector string into a structured {@link UI5Selector} object.

```typescript
import { parseUI5Selector } from './selector-parser.js';

const selector = parseUI5Selector('ui5=sap.m.Button#saveBtn[text=Save]');
// { controlType: 'sap.m.Button', id: 'saveBtn', properties: { text: 'Save' } }
```

---

## serializeUI5Selector

Serializes a {@link UI5Selector} object into a `ui5=...` selector string.

```typescript
import { serializeUI5Selector } from './selector-parser.js';

const str = serializeUI5Selector({
  controlType: 'sap.m.Button',
  id: 'saveBtn',
  properties: { text: 'Save' },
});
// 'ui5=sap.m.Button#saveBtn[text=Save]'
```

---

## validateUI5Selector

Validates a {@link UI5Selector} and returns an array of error messages.

```typescript
import { validateUI5Selector } from './selector-parser.js';

const errors = validateUI5Selector({ controlType: 'Button' });
// ['controlType must be a dot-separated namespace (e.g., sap.m.Button)']
```

---

## isUI5SelectorString

Checks whether a string is a `ui5=...` selector string.

```typescript
import { isUI5SelectorString } from './selector-parser.js';

isUI5SelectorString('ui5=sap.m.Button'); // true
isUI5SelectorString('sap.m.Button'); // false
```

---

## create

Async factory method for creating a UI5Object with loaded methods.

```typescript
const obj = await UI5Object.create({ uuid: 'uuid-1', type: 'ModelType', page });
```

---

## executeMethod

Executes a method on the stored browser-side object.

```typescript
const result = await obj.executeMethod('getData', []);
```

---

## getBindingContext

Returns the binding context for the given model name.

```typescript
const ctx = await obj.getBindingContext();
```

---

## getProperty

Gets a property value from the browser-side object.

```typescript
const name = await obj.getProperty('/name');
```

---

## setProperty

Sets a property value on the browser-side object.

```typescript
await obj.setProperty('/name', 'NewValue');
```

---

## toProxy

Creates a Proxy that forwards arbitrary method calls to `executeMethod()`.

```typescript
const proxy = obj.toProxy();
const data = await proxy.getData();
```

---

## toString

Returns a string representation of this UI5Object.

```typescript
String(obj); // '[UI5Object sap.ui.model.json.JSONModel uuid-1]'
```

---

## get

Gets a cached UI5Object by UUID.

```typescript
const obj = cache.get('uuid-1');
```

---

## set

Stores a UI5Object by UUID.

```typescript
cache.set('uuid-1', object);
```

---

## delete

Deletes a cached entry by UUID.

```typescript
cache.delete('uuid-1');
```

---

## cleanup

Removes all expired entries.

```typescript
const removed = cache.cleanup();
```

---
