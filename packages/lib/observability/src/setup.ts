/*
 * # Why we ship our own providers
 *
 * The OTel JS API surface (`@opentelemetry/api`, `@opentelemetry/api-logs`)
 * is small and stable. The corresponding SDKs (`@opentelemetry/sdk-trace-web`,
 * `@opentelemetry/sdk-logs`) bundle full processors, batchers, propagators,
 * and exporters — useful in production, but ~15-20 KB gzip combined for what
 * is currently dev-only console output. The hand-rolled providers in
 * `internal/` deliver the same OTel shape for ~1 KB.
 *
 * ## Risks
 *
 * - `@opentelemetry/api-logs` is on the `0.x` channel and is slated to fold
 *   into `@opentelemetry/api` once the Logs API stabilizes. Pin both packages
 *   to the same minor and expect a small migration when that happens.
 * - The console tracer's context manager is sync-only. Sync nesting works
 *   (`tracer.span('outer', () => tracer.span('inner', ...))` produces a real
 *   parent/child tree). Spans created across `await` boundaries do NOT
 *   inherit context — pass spans explicitly into nested async work.
 * - No batching, sampling, retry, or backpressure. `end()` writes
 *   synchronously to `console.*`. Fine for dev, hostile to any real
 *   export pipeline.
 *
 * ## When to swap
 *
 * Replace these factories with the official SDK providers when:
 *   - you wire up a real exporter (OTLP, Sentry, vendor SDK), or
 *   - you need correct parent/child spans across `await` boundaries (the
 *     `sdk-trace-web` `WebTracerProvider` ships a real context manager), or
 *   - the Logs SDK leaves experimental status and `sdk-logs` is the
 *     canonical thing to depend on.
 *
 * Because callers only see the canonical OTel API surface, the swap is a
 * one-line change in this file — no caller migration needed.
 */
import { context, trace, type TracerProvider } from '@opentelemetry/api';
import { logs, type LoggerProvider } from '@opentelemetry/api-logs';
import { createConsoleLoggerProvider } from './internal/console-provider';
import { createConsoleTracerProvider } from './internal/console-tracer-provider';
import { createSyncContextManager } from './internal/sync-context-manager';

/** Options for {@link configure}. */
export interface ConfigureOptions {
  /**
   * Where log records go. Pass `'console'` to print to the host console
   * (the dev default), or any `LoggerProvider` to wire an exporter-backed
   * implementation. Defaults to `'console'`.
   */
  logs?: LoggerProvider | 'console';

  /**
   * Where completed spans go. Pass `'console'` to print to the host console
   * (the dev default), or any `TracerProvider` to wire an exporter-backed
   * implementation. Defaults to `'console'`.
   */
  traces?: TracerProvider | 'console';
}

/**
 * Wire observability providers for the current runtime. Call once per
 * entry point (e.g. `entry-client.tsx`) before any module emits telemetry.
 *
 * Idempotent within a runtime: the underlying OTel API ignores subsequent
 * calls. Use `logs.disable()`, `trace.disable()`, and `context.disable()`
 * to reset in tests.
 */
export const configure = (options: ConfigureOptions = {}): void => {
  const logsSink = options.logs ?? 'console';
  const tracesSink = options.traces ?? 'console';
  logs.setGlobalLoggerProvider(
    logsSink === 'console' ? createConsoleLoggerProvider() : logsSink,
  );
  trace.setGlobalTracerProvider(
    tracesSink === 'console' ? createConsoleTracerProvider() : tracesSink,
  );
  context.setGlobalContextManager(createSyncContextManager());
};
