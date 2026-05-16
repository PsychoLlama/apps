import baseLogger from '@holz/logger';
import type { Logger } from '@holz/core';

declare global {
  interface ImportMeta {
    /**
     * Build-time scope tag injected by the `instrumentationScope`
     * Vite plugin. Head is the importing module's
     * `package.json#name`; remaining elements are the extensionless
     * path relative to that package's `src/` directory, one segment
     * per array entry.
     *
     * @example `['@app/main', 'entry-client']`
     */
    readonly INSTRUMENTATION_SCOPE: readonly string[];
  }
}

/**
 * Create a namespaced logger. Pass `import.meta.INSTRUMENTATION_SCOPE`
 * — the build plugin fills it with `[packageName, ...modulePath]`,
 * matching otel's instrumentation-scope shape. Each element becomes
 * a segment of `log.origin`. Call `.namespace(...)` on the result to
 * add finer-grained tags (subsystem, class name, etc).
 *
 * Logs flow through the default `@holz/logger` pipeline, which is
 * silent unless the `debug` localStorage key (browser) or `DEBUG`
 * env var (server) selects a matching pattern. Use
 * `setGlobalLogCollector` to intercept logs without touching the
 * env.
 */
export const createLogger = (scope: readonly string[]): Logger =>
  scope.reduce<Logger>(
    (logger, segment) => logger.namespace(segment),
    baseLogger,
  );
