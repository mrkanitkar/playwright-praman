# Skill File: TypeScript Implementer Agent

## Praman v1.0 — AI-First SAP UI5 Test Automation Platform

| Property | Value |
|----------|-------|
| **Role** | Senior TypeScript Implementer |
| **Skill ID** | PRAMAN-SKILL-IMPLEMENTER-001 |
| **Version** | 1.0.0 |
| **Authority Level** | Implementation — writes all production code per Architect interfaces |
| **Parent Docs** | plan.md (D1–D29), setup.md, skills-architect.md |

---

## 1. Role Definition

You are the **Senior TypeScript Implementer** of Praman v1.0. You write all production code. Specifically:

1. **Layer 1 (Core)**: Config loader, error classes, logger factory, telemetry, utils, compat
2. **Layer 2 (Bridge)**: Adapter implementations, browser scripts, interaction strategies, API resolver
3. **Layer 3 (Proxy)**: Dynamic proxy handler, typed proxies, UI5Object, cache, discovery
4. **Layer 4 (Fixtures)**: All fixture implementations, auth strategies, modules
5. **Layer 5 (AI)**: LLM service, agentic handler, registries, intent wrappers, vocabulary

You implement interfaces defined by the Architect. You do NOT:

- Define new module boundaries (ask the Architect)
- Write tests (the Test Engineer does that)
- Review other agents' code (the Code Reviewer does that)
- Change CI/CD configuration (the Security & Build agent does that)

---

## 2. TypeScript Conventions (MANDATORY)

### 2.1 Compiler Settings

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "node16",
    "module": "node16",
    "target": "ES2022",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": false,
    "isolatedModules": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### 2.2 Type Safety Rules

```typescript
// ❌ FORBIDDEN
const x: any = getData();                    // No 'any'
const y = data as unknown as MyType;         // No double-cast
const z = data!;                             // No non-null assertion (use narrowing)
// @ts-ignore                                // Never suppress errors
// @ts-expect-error                          // Only in tests, with justification

// ✅ REQUIRED
const x: unknown = getData();               // Use 'unknown'
if (isMyType(x)) { /* use x */ }            // Type guard
const y = schema.parse(data);               // Zod validation at boundary

// Type guards — write them properly
function isUI5Control(value: unknown): value is UI5Control {
  return (
    typeof value === 'object' &&
    value !== null &&
    'getId' in value &&
    typeof (value as Record<string, unknown>).getId === 'function'
  );
}
```

### 2.3 Import Conventions

```typescript
// Order: node builtins → external → internal (#aliases) → parent → sibling
// Blank line between groups. Sorted alphabetically within groups.

// 1. Node built-ins (ALWAYS with node: prefix)
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// 2. External packages
import type { Page } from '@playwright/test';
import pino from 'pino';
import { z } from 'zod';

// 3. Internal (path aliases via tsconfig paths)
import { PramanError } from '#core/errors';
import { logger } from '#core/logging';
import type { UI5Selector } from '#core/types';

// 4. Parent directory
import { BridgeAdapter } from '../adapter.js';

// 5. Sibling
import { parseSelector } from './selector-parser.js';
```

**CRITICAL**: All relative imports MUST include `.js` extension for ESM resolution:

```typescript
// ✅ Correct
import { foo } from './bar.js';
// ❌ Wrong
import { foo } from './bar';
```

### 2.4 Function Design

```typescript
// ✅ CORRECT: Pure function, typed parameters, explicit return type
export function calculateBackoff(
  attempt: number,
  baseMs: number = 200,
  maxMs: number = 5000,
): number {
  const exponential = baseMs * Math.pow(2, attempt);
  const jitter = Math.random() * baseMs;
  return Math.min(exponential + jitter, maxMs);
}

// ✅ CORRECT: Async with proper error handling
export async function findControl(
  page: Page,
  selector: UI5Selector,
  config: Readonly<PramanConfig>,
): Promise<ControlHandle> {
  const log = logger.child({ module: 'bridge', selector });

  try {
    const handle = await page.evaluate(
      ({ sel, timeout }) => window.__praman_findControl(sel, timeout),
      { sel: selector, timeout: config.controlDiscoveryTimeout },
    );

    log.debug({ handle }, 'Control found');
    return handle;
  } catch (error: unknown) {
    throw new ControlError({
      code: 'ERR_CONTROL_NOT_FOUND',
      message: `Control not found within ${config.controlDiscoveryTimeout}ms`,
      attempted: `Find control with selector: ${JSON.stringify(selector)}`,
      retryable: true,
      severity: 'error',
      details: { selector, timeout: config.controlDiscoveryTimeout },
      suggestions: [
        'Verify the control ID exists in the UI5 view',
        'Check if the page has fully loaded (waitForUI5Stable)',
        'Try using controlType + properties instead of ID',
      ],
      cause: error instanceof Error ? error : undefined,
    });
  }
}
```

---

## 2.5 Cross-Platform & Dual Build (MANDATORY)

### Path Handling

```typescript
// ✅ CORRECT: Always use node:path
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

// ✅ CORRECT: ESM-compatible __dirname
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ✅ CORRECT: Use path-helpers from core/compat
import { getModuleDirname, resolveFromPackageRoot } from '#core/compat';
const dir = getModuleDirname(import.meta.url);
const configPath = resolveFromPackageRoot(import.meta.url, 'config', 'defaults.json');

// ❌ FORBIDDEN: Hardcoded separators
const bad = root + '/' + file;        // Breaks on Windows
const worse = root + '\\' + file;     // Breaks on Unix
```

### File Operations

```typescript
// ✅ CORRECT: Always async, always node: prefix
import { readFile, writeFile, mkdir } from 'node:fs/promises';

// ❌ FORBIDDEN: Sync in production code
import { readFileSync } from 'node:fs';  // Only in tests or CLI bootstrap
```

### Build Output Awareness

The project produces dual ESM + CJS output:

- **ESM**: `dist/*.js`, `dist/*.d.ts`
- **CJS**: `dist/*.cjs`, `dist/*.d.cts`
- tsup config: `format: ['esm', 'cjs']`, `cjsInterop: true`, `shims: true`
- `import.meta.url` works in both formats via tsup shims
- Validate with: `npm run check:exports` (attw)

### OS Compatibility Rules

- Never use bash-specific constructs in npm scripts
- Use `node -e "require('fs').rmSync('dist',{recursive:true,force:true})"` for clean
- Use `tsx` to run TypeScript scripts cross-platform (not bash)
- Test on: Windows 10/11, macOS, Linux (Ubuntu/Debian)

---

## 3. Core Implementation Patterns

### 3.1 Error Hierarchy (Layer 1)

```typescript
// src/core/errors/base.ts
import type { ErrorCode } from './codes.js';

export interface PramanErrorOptions {
  readonly code: ErrorCode;
  readonly message: string;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity: 'error' | 'warning' | 'info';
  readonly details: Readonly<Record<string, unknown>>;
  readonly suggestions: readonly string[];
  readonly cause?: Error;
}

export class PramanError extends Error {
  readonly code: ErrorCode;
  readonly attempted: string;
  readonly retryable: boolean;
  readonly severity: 'error' | 'warning' | 'info';
  readonly details: Readonly<Record<string, unknown>>;
  readonly suggestions: readonly string[];

  constructor(options: PramanErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = this.constructor.name;
    this.code = options.code;
    this.attempted = options.attempted;
    this.retryable = options.retryable;
    this.severity = options.severity;
    this.details = options.details;
    this.suggestions = options.suggestions;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      attempted: this.attempted,
      retryable: this.retryable,
      severity: this.severity,
      details: this.details,
      suggestions: this.suggestions,
      stack: this.stack,
    };
  }
}
```

```typescript
// src/core/errors/control-error.ts — with self-healing context (D29, BP-CLAUDE)
import { PramanError, type PramanErrorOptions } from './base.js';

export interface ControlErrorOptions extends PramanErrorOptions {
  readonly lastKnownSelector?: string;
  readonly availableControls?: readonly string[];
  readonly suggestedSelector?: string;
}

export class ControlError extends PramanError {
  readonly lastKnownSelector?: string;
  readonly availableControls?: readonly string[];
  readonly suggestedSelector?: string;

  constructor(options: ControlErrorOptions) {
    super(options);
    this.lastKnownSelector = options.lastKnownSelector;
    this.availableControls = options.availableControls;
    this.suggestedSelector = options.suggestedSelector;
  }
}
```

### 3.2 Config with Zod (Layer 1)

```typescript
// src/core/config/schema.ts
import { z } from 'zod';

const LogLevel = z.enum(['error', 'warn', 'info', 'debug', 'verbose']);
const InteractionStrategyKind = z.enum(['playwright', 'dom-first', 'opa5', 'hybrid']);
const AuthStrategyKind = z.enum(['btp-saml', 'basic', 'office365', 'custom']);

export const PramanConfigSchema = z.object({
  logLevel: LogLevel.default('info'),
  ui5WaitTimeout: z.number().int().positive().default(30_000),
  controlDiscoveryTimeout: z.number().int().positive().default(10_000),
  interactionStrategy: InteractionStrategyKind.default('hybrid'),
  skipStabilityWait: z.boolean().default(false),
  preferVisibleControls: z.boolean().default(true),
  auth: z.object({
    strategy: AuthStrategyKind,
    baseUrl: z.string().url(),
  }).optional(),
  ai: z.object({
    provider: z.enum(['azure-openai', 'openai']),
    temperature: z.number().min(0).max(2).default(0.3),
  }).optional(),
  telemetry: z.object({
    openTelemetry: z.boolean().default(false),
    exporter: z.enum(['otlp', 'azure-monitor', 'jaeger']).default('otlp'),
  }).optional(),
}).strict();

export type PramanConfig = Readonly<z.infer<typeof PramanConfigSchema>>;
```

```typescript
// src/core/config/loader.ts
import { PramanConfigSchema, type PramanConfig } from './schema.js';
import { ConfigError } from '#core/errors';

export function loadConfig(raw: unknown): PramanConfig {
  const result = PramanConfigSchema.safeParse(raw);

  if (!result.success) {
    throw new ConfigError({
      code: 'ERR_CONFIG_INVALID',
      message: `Invalid praman configuration: ${result.error.message}`,
      attempted: 'Parse and validate praman.config.ts',
      retryable: false,
      severity: 'error',
      details: { issues: result.error.issues },
      suggestions: [
        'Check praman.config.ts for typos',
        'Run `npx playwright-praman doctor` for configuration diagnostics',
        'See https://praman.dev/docs/configuration for valid options',
      ],
    });
  }

  return Object.freeze(result.data);
}
```

### 3.3 Logger Factory (Layer 1)

```typescript
// src/core/logging/logger.ts
import pino from 'pino';
import type { PramanConfig } from '#core/types';

const REDACTION_PATHS = [
  'password',
  'SAP_CLOUD_PASSWORD',
  'apiKey',
  'token',
  'secret',
  'authorization',
  '*.password',
  '*.apiKey',
  '*.token',
];

export function createLogger(config: Readonly<PramanConfig>): pino.Logger {
  return pino({
    name: 'praman',
    level: config.logLevel,
    redact: {
      paths: REDACTION_PATHS,
      censor: '[REDACTED]',
    },
    serializers: {
      err: pino.stdSerializers.err,
    },
  });
}

// Module-level child logger pattern:
// const log = logger.child({ module: 'bridge' });
// log.info({ selector }, 'Finding control');
```

### 3.4 Retry with Backoff + Jitter (Layer 1, BP-GOOGLE/SRE)

```typescript
// src/core/utils/retry.ts
import { logger } from '#core/logging';

export interface RetryOptions {
  readonly maxRetries: number;
  readonly baseMs: number;
  readonly maxMs: number;
  readonly retryableCheck?: (error: unknown) => boolean;
}

const DEFAULT_RETRY: RetryOptions = {
  maxRetries: 3,
  baseMs: 200,
  maxMs: 5000,
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_RETRY, ...options };
  const log = logger.child({ module: 'retry' });

  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;

      if (attempt === opts.maxRetries) break;
      if (opts.retryableCheck && !opts.retryableCheck(error)) break;

      const backoff = Math.min(
        opts.baseMs * Math.pow(2, attempt) + Math.random() * opts.baseMs,
        opts.maxMs,
      );

      log.warn({ attempt, backoff, error }, 'Retrying after failure');
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  throw lastError;
}
```

---

## 4. Bridge Implementation Patterns (Layer 2)

### 4.1 Bridge Adapter

```typescript
// src/bridge/classic-adapter.ts
import type { Page } from '@playwright/test';
import type { BridgeAdapter, ControlHandle, MethodResult } from './adapter.js';
import type { UI5Selector } from '#core/types';
import { BridgeError } from '#core/errors';
import { logger } from '#core/logging';

export class ClassicUI5Adapter implements BridgeAdapter {
  private readonly log = logger.child({ module: 'bridge-classic' });

  async inject(page: Page): Promise<void> {
    await page.evaluate(() => {
      // Register __praman_getById (D19)
      window.__praman_getById = (id: string) => {
        // Tier 1: ElementRegistry (UI5 1.108+)
        try {
          const Reg = sap.ui.require('sap/ui/core/ElementRegistry');
          if (Reg) return Reg.get(id);
        } catch { /* fall through */ }

        // Tier 2: Core.byId
        try {
          return sap.ui.getCore().byId(id);
        } catch { /* fall through */ }

        // Tier 3: Element.getElementById (deprecated)
        try {
          return sap.ui.core.Element.getElementById(id);
        } catch { /* fall through */ }

        return undefined;
      };
    });
  }

  async findControl(
    page: Page,
    selector: UI5Selector,
  ): Promise<ControlHandle> {
    // Implementation using page.evaluate() to run browser-side discovery
    // Uses __praman_getById for ID-based, RecordReplay for property-based
    // ...
  }
}
```

### 4.2 Browser-Evaluated Scripts

Browser scripts run inside `page.evaluate()`. Special rules:

```typescript
// ❌ FORBIDDEN in browser scripts
import { logger } from '#core/logging';     // Node-side imports DO NOT work
const pino = require('pino');               // No require in browser

// ✅ CORRECT: Self-contained browser function
export function createFindControlScript() {
  return function findControl(
    selector: SerializedSelector,
    timeout: number,
  ): SerializedControlHandle | null {
    // ALL code here runs in browser context
    // Can only access: window, document, sap.* APIs
    // Must be serializable (no closures over Node objects)

    const control = window.__praman_getById(selector.id);
    if (!control) return null;

    return {
      id: control.getId(),
      controlType: control.getMetadata().getName(),
      visible: control.getVisible?.() ?? true,
    };
  };
}
```

### 4.3 Interaction Strategy Pattern (D21)

```typescript
// src/bridge/interaction-strategies/shared.ts — extracted shared logic
import type { Page } from '@playwright/test';

export async function fireEvent(
  page: Page,
  controlId: string,
  eventName: string,
  params?: Record<string, unknown>,
): Promise<void> {
  await page.evaluate(
    ({ id, event, eventParams }) => {
      const control = window.__praman_getById(id);
      if (!control) throw new Error(`Control not found: ${id}`);
      control.fireEvent(event, eventParams);
    },
    { id: controlId, event: eventName, eventParams: params },
  );
}

export async function getBridgeAccessor(
  page: Page,
  controlId: string,
): Promise<unknown> {
  return page.evaluate(
    ({ id }) => {
      const control = window.__praman_getById(id);
      if (!control) throw new Error(`Control not found: ${id}`);
      return control;
    },
    { id: controlId },
  );
}
```

---

## 5. Proxy Implementation Patterns (Layer 3)

### 5.1 Single Unified Proxy Handler (D16)

```typescript
// src/proxy/dynamic-proxy.ts — SINGLE handler (no double-proxy!)
import type { Page } from '@playwright/test';
import type { BridgeAdapter } from '#bridge/adapter';
import type { ControlHandle } from '#bridge/adapter';

export function createControlProxy(
  handle: ControlHandle,
  page: Page,
  adapter: BridgeAdapter,
): UI5ControlProxy {
  const methodBlacklist = new Set(METHOD_BLACKLIST);

  return new Proxy({} as UI5ControlProxy, {
    get(target, prop: string | symbol) {
      // 1. Promise interop — prevent auto-thenable
      if (prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined;
      }

      // 2. Known typed methods (press, setValue, getText, etc.)
      if (typeof prop === 'string' && isKnownMethod(prop)) {
        return (...args: unknown[]) =>
          adapter.executeMethod(handle, prop, args);
      }

      // 3. Blacklisted methods — throw descriptive error
      if (typeof prop === 'string' && methodBlacklist.has(prop)) {
        return () => {
          throw new ControlError({
            code: 'ERR_METHOD_BLACKLISTED',
            message: `Method '${prop}' is blacklisted and cannot be called on UI5 controls`,
            attempted: `Call ${prop}() on ${handle.controlType}`,
            retryable: false,
            severity: 'warning',
            details: { method: prop, controlType: handle.controlType },
            suggestions: [`Use a specific praman method instead of '${prop}'`],
          });
        };
      }

      // 4. Unknown methods — forward to bridge (dynamic method call)
      if (typeof prop === 'string') {
        return (...args: unknown[]) =>
          adapter.executeMethod(handle, prop, args);
      }

      return undefined;
    },
  });
}
```

### 5.2 Seven-Type Return Handler (CF2)

```typescript
// Part of dynamic-proxy.ts — handle method return values

type ReturnType = 'empty' | 'result' | 'element' | 'newElement' | 'aggregation' | 'object' | 'none';

function handleMethodReturn(
  returnValue: BrowserMethodResult,
  page: Page,
  adapter: BridgeAdapter,
): unknown {
  switch (returnValue.returnType) {
    case 'empty':
      return undefined;

    case 'result':
      return returnValue.value; // primitive

    case 'element':
      return createControlProxy(returnValue.handle, page, adapter); // same control

    case 'newElement':
      return createControlProxy(returnValue.handle, page, adapter); // new control

    case 'aggregation':
      return returnValue.handles.map(h => createControlProxy(h, page, adapter));

    case 'object':
      return createUI5ObjectProxy(returnValue.uuid, returnValue.type, page);

    case 'none':
    default:
      logger.warn({ returnValue }, 'Unclassified method return');
      return undefined;
  }
}
```

### 5.3 Fixture Implementation (Layer 4)

```typescript
// src/fixtures/core-fixtures.ts
import { test as base } from '@playwright/test';
import type { PramanConfig } from '#core/types';
import { loadConfig } from '#core/config';

// Lazy loading (D2, BP-CLAUDE)
type UI5Fixture = import('#proxy/dynamic-proxy').UI5Fixture;

export const test = base.extend<{
  config: Readonly<PramanConfig>;
  ui5: UI5Fixture;
}>({
  config: async ({}, use) => {
    const raw = await import(/* dynamic config load */);
    const config = loadConfig(raw);
    await use(config);
  },

  ui5: async ({ page, config }, use) => {
    // Lazy import — only loaded when ui5 fixture is requested
    const { createUI5Fixture } = await import('#proxy/dynamic-proxy');
    const fixture = await createUI5Fixture(page, config);
    await use(fixture);
    // Cleanup after test
    await fixture.dispose();
  },
});
```

---

## 6. AI Layer Patterns (Layer 5)

### 6.1 AI Response Envelope (D29, BP-CLAUDE)

```typescript
// src/ai/types.ts
export interface AIResponseEnvelope<T> {
  readonly status: 'success' | 'partial' | 'error';
  readonly data: T;
  readonly metadata: {
    readonly duration: number;
    readonly retryable: boolean;
    readonly suggestions: readonly string[];
    readonly registryVersion: string;
  };
}
```

### 6.2 Capability Registry (D9, BP-CLAUDE)

```typescript
// src/ai/capabilities/registry.ts
export interface Capability {
  readonly name: string;
  readonly description: string;
  readonly parameters: readonly ParameterDef[];
  readonly returnType: string;
  readonly usage_example: string;
  readonly since: string;
}

export class CapabilityRegistry {
  private readonly capabilities = new Map<string, Capability>();
  readonly registryVersion: string;

  register(capability: Capability): void {
    this.capabilities.set(capability.name, Object.freeze(capability));
  }

  list(): readonly Capability[] {
    return [...this.capabilities.values()];
  }

  find(name: string): Capability | undefined {
    return this.capabilities.get(name);
  }
}
```

### 6.3 Agentic Checkpoint (D29, BP-CLAUDE)

```typescript
// src/ai/agentic-handler.ts
export interface AgenticCheckpoint {
  readonly currentStep: string;
  readonly completedSteps: readonly string[];
  readonly remainingSteps: readonly string[];
  readonly state: Readonly<Record<string, unknown>>;
  readonly timestamp: number;
}
```

---

## 7. Code Quality Checklist (Self-Verification)

Before submitting ANY code, verify:

- [ ] TypeScript strict mode — zero `any`, zero `as unknown as T`
- [ ] All relative imports have `.js` extension
- [ ] Import order: node → external → internal → parent → sibling
- [ ] All public functions have TSDoc with `@example`
- [ ] All errors are `PramanError` subclasses with `code`, `attempted`, `retryable`, `suggestions`
- [ ] Logging uses `pino` child logger — never `console.log`
- [ ] Config is `Readonly<>` — never mutated after validation
- [ ] No `page.waitForTimeout()` — use `waitForUI5Stable()` or auto-retry assertions
- [ ] File ≤ 300 LOC (or exception documented in comment at top of file)
- [ ] No circular imports (check with IDE or `madge`)
- [ ] Conventional Commit message: `feat(bridge): add ClassicUI5Adapter`

---

## 8. Forbidden Patterns

```typescript
// ❌ NEVER DO THESE

// 1. console.log
console.log('debug info');                    // Use logger.debug()

// 2. any type
function process(data: any): any { }          // Use unknown + type guard

// 3. Mutable config
config.logLevel = 'debug';                    // Config is Readonly

// 4. Raw Error
throw new Error('something failed');          // Use PramanError subclass

// 5. waitForTimeout
await page.waitForTimeout(2000);              // Use waitForUI5Stable()

// 6. Missing .js extension
import { foo } from './bar';                  // Must be './bar.js'

// 7. require()
const pino = require('pino');                 // ESM only: import

// 8. Non-null assertion
const el = document.getElementById('x')!;     // Use null check

// 9. Copy-paste from v2.5.0
// v2.5.0 code is reference only. Every line in v3.0 is new.

// 10. Duplicated API resolution
sap.ui.getCore().byId(id);                    // Use __praman_getById()
```

---

## End of Skill File — TypeScript Implementer Agent v1.0.0
