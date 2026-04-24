# Observability

- Single entry point: `@lib/observability`.
- Re-exports the canonical `@opentelemetry/api-logs` surface so logs follow OTel shape.

## Setup

- `configure({ logs })`: Registers providers for the current runtime. Call once per entry point before any module emits telemetry.
- `logs` defaults to `'console'`, which prints records to the host console.
- Pass any `LoggerProvider` to swap in an exporter (e.g. OTLP).

## Logging

- `logs.getLogger(name)`: Returns a `Logger` for the given instrumentation scope. Names are dot-separated (`app.router`, `lib.ui.button`).
- `logger.emit({ severityNumber, body, attributes? })`: Records a log entry.
- `SeverityNumber.{TRACE,DEBUG,INFO,WARN,ERROR,FATAL}`: Standard severity levels (with `2`–`4` sub-levels per OTel spec).

## Console Logging

- Default provider routes by severity: `ERROR+` → `console.error`, `WARN+` → `console.warn`, `INFO+` → `console.info`, lower → `console.debug`.
- Output format: `[<LEVEL>] <name>`, then body and attributes.

## Tracing

- `trace.getTracer(name)`: Returns a `Tracer` for the given instrumentation scope.
- `tracer.startSpan(name, options?, context?)`: Creates a span. Pass `{ root: true }` in options to detach from any parent context.
- `tracer.startActiveSpan(name, fn)` (with optional `options` and `context` arguments): Creates a span and runs `fn` with it as the active span.
- `span.setAttribute / setAttributes / addEvent / setStatus / recordException / updateName / end`: Standard OTel span surface.

## Console Tracing

- Default provider prints completed spans on `span.end()`. `ERROR` status → `console.error`, otherwise `console.info`.
- Output format: `[SPAN] <scope> <name> (<duration>ms)`, then a payload with `traceId`, `spanId`, `parentSpanId`, `attributes`, `events`, `status`.
- No async context propagation: spans created across `await` boundaries may appear orphaned. Swap in `sdk-trace-web` when this matters.

## Resetting

- `logs.disable()` and `trace.disable()`: Clear the registered providers. Useful in tests; never call from app code.
