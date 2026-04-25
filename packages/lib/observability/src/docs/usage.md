# Observability

- Single entry point: `@lib/observability`.
- The package wraps `@opentelemetry/api` and `@opentelemetry/api-logs` with ergonomic facades. The raw OTel surface is re-exported as an escape hatch.

## Setup

- `configure({ logs, traces })`: Registers providers for the current runtime. Call once per entry point before any module emits telemetry.
- Both `logs` and `traces` default to `'console'`, which prints records to the host console.
- Pass any `LoggerProvider` / `TracerProvider` to swap in an exporter (e.g. OTLP).

## Logging

- `createLogger(name)`: Returns an `AppLogger` for the given instrumentation scope. Names are dot-separated (`app.studio.recorder`, `lib.ui.button`).
- `logger.{debug,info,warn,error}(body, attributes?)`: Emits at the matching severity.

## Tracing

- `createTracer(name)`: Returns an `AppTracer` for the given instrumentation scope.
- `tracer.span(name, fn)`: Runs `fn` inside a span. The span is passed to `fn` as its only argument. `end()` and exception recording are automatic.
- Sync and async callbacks both work — `span()` returns whatever `fn` returns (or a `Promise` of it).
- On thrown or rejected errors: `recordException` is called and status is set to `ERROR` before the span ends and the error re-throws.
- No async context propagation. Pass spans explicitly into nested async work that needs them.

## Console Output

- Logs route by severity: `ERROR+` → `console.error`, `WARN+` → `console.warn`, `INFO+` → `console.info`, lower → `console.debug`. Format: `[<LEVEL>] <name>`, then body and attributes.
- Spans print on `end()`. `ERROR` status → `console.error`, otherwise `console.info`. Format: `[SPAN] <scope> <name> (<duration>ms)`, then a payload with `traceId`, `spanId`, `parentSpanId`, `attributes`, `events`, `status`.

## Escape Hatch

- `logs`, `trace`, `context`, `SeverityNumber`, `SpanStatusCode`, etc. are re-exported from `@opentelemetry/api`/`api-logs` for advanced use (custom providers, raw `Span.startSpan`, manual context propagation).

## Resetting

- `logs.disable()` and `trace.disable()`: Clear the registered providers. Useful in tests; never call from app code.
