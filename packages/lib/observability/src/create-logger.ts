import baseLogger from '@holz/logger';
import type { Logger } from '@holz/core';

/**
 * Create a namespaced logger. The `owner` becomes the first segment
 * of `log.origin` — typically the package or module that produced
 * the log. Call `.namespace(...)` on the result to add finer-grained
 * tags (class name, subsystem, etc).
 *
 * Logs flow through the default `@holz/logger` pipeline, which is
 * silent unless the `debug` localStorage key (browser) or `DEBUG`
 * env var (server) selects a matching pattern. Use
 * `setGlobalLogCollector` to intercept logs without touching the
 * env.
 */
export const createLogger = (owner: string): Logger =>
  baseLogger.namespace(owner);
