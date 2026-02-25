/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Logging module — pino logger factory with secret redaction.
 *
 * @example
 * ```typescript
 * import { createRootLogger, createLogger } from '#core/logging/index.js';
 * ```
 *
 * @module logging
 */

export { createLogger, createRootLogger, resetDefaultLogger } from './logger.js';
export { createRedactConfig, REDACTION_PATHS } from './redaction.js';
export type { RedactConfig } from './redaction.js';
