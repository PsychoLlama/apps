/* eslint-disable no-console -- console output is the entire point of this module. */
import {
  context,
  SpanStatusCode,
  TraceFlags,
  trace,
  type AttributeValue,
  type Attributes,
  type Context,
  type Exception,
  type Span,
  type SpanContext,
  type SpanOptions,
  type SpanStatus,
  type TimeInput,
  type Tracer,
  type TracerProvider,
} from '@opentelemetry/api';

const randomHex = (bytes: number): string =>
  [...crypto.getRandomValues(new Uint8Array(bytes))]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

interface RecordedEvent {
  name: string;
  attributes?: Attributes;
  time: number;
}

const isAttributes = (
  value: Attributes | TimeInput | undefined,
): value is Attributes =>
  typeof value === 'object' &&
  value !== null &&
  !(value instanceof Date) &&
  !Array.isArray(value);

const exceptionMessage = (exception: Exception): string => {
  if (typeof exception === 'string') return exception;
  if ('message' in exception && typeof exception.message === 'string') {
    return exception.message;
  }
  if ('name' in exception && typeof exception.name === 'string') {
    return exception.name;
  }
  return JSON.stringify(exception);
};

const createConsoleSpan = (
  scope: string,
  name: string,
  parent: SpanContext | undefined,
): Span => {
  const ctx: SpanContext = {
    traceId: parent?.traceId ?? randomHex(16),
    spanId: randomHex(8),
    traceFlags: TraceFlags.SAMPLED,
  };
  const parentSpanId = parent?.spanId;
  const attributes: Record<string, AttributeValue> = {};
  const events: RecordedEvent[] = [];
  const start = performance.now();
  let currentName = name;
  let status: SpanStatus = { code: SpanStatusCode.UNSET };
  let endTime: number | undefined;

  const span: Span = {
    spanContext: () => ctx,
    setAttribute: (key, value) => {
      attributes[key] = value;
      return span;
    },
    setAttributes: (next) => {
      for (const [key, value] of Object.entries(next)) {
        if (value !== undefined) attributes[key] = value;
      }
      return span;
    },
    addEvent: (eventName, attributesOrStartTime) => {
      events.push({
        name: eventName,
        attributes: isAttributes(attributesOrStartTime)
          ? attributesOrStartTime
          : undefined,
        time: performance.now(),
      });
      return span;
    },
    addLink: () => span,
    addLinks: () => span,
    setStatus: (next) => {
      status = next;
      return span;
    },
    updateName: (next) => {
      currentName = next;
      return span;
    },
    recordException: (exception) => {
      events.push({
        name: 'exception',
        attributes: { 'exception.message': exceptionMessage(exception) },
        time: performance.now(),
      });
    },
    isRecording: () => endTime === undefined,
    end: () => {
      if (endTime !== undefined) return;
      endTime = performance.now();
      const duration = (endTime - start).toFixed(1);
      const fn =
        status.code === SpanStatusCode.ERROR ? console.error : console.info;
      fn(`[SPAN] ${scope} ${currentName} (${duration}ms)`, {
        traceId: ctx.traceId,
        spanId: ctx.spanId,
        parentSpanId,
        attributes,
        events,
        status,
      });
    },
  };

  return span;
};

const createConsoleTracer = (scope: string): Tracer => {
  const startSpan = (
    name: string,
    options?: SpanOptions,
    ctx?: Context,
  ): Span => {
    const parent = options?.root
      ? undefined
      : trace.getSpan(ctx ?? context.active())?.spanContext();
    const span = createConsoleSpan(scope, name, parent);
    if (options?.attributes) span.setAttributes(options.attributes);
    return span;
  };

  // Tracer.startActiveSpan declares three overloaded signatures. A single
  // permissive implementation can serve them all; the cast localizes the
  // overload erasure to this one method, leaving startSpan type-checked.
  const startActiveSpan = ((
    name: string,
    arg1: SpanOptions | ((span: Span) => unknown),
    arg2?: Context | ((span: Span) => unknown),
    arg3?: (span: Span) => unknown,
  ): unknown => {
    let options: SpanOptions | undefined;
    let parentCtx: Context = context.active();
    let callback: (span: Span) => unknown;
    if (typeof arg1 === 'function') {
      callback = arg1;
    } else if (typeof arg2 === 'function') {
      options = arg1;
      callback = arg2;
    } else {
      options = arg1;
      parentCtx = arg2 ?? parentCtx;
      callback = arg3!;
    }
    const span = startSpan(name, options, parentCtx);
    return context.with(trace.setSpan(parentCtx, span), () => callback(span));
  }) as Tracer['startActiveSpan'];

  return { startSpan, startActiveSpan };
};

/**
 * Builds a `TracerProvider` that prints completed spans to the host console
 * on `span.end()`. Severity routes by status: `ERROR` → `console.error`,
 * everything else → `console.info`.
 *
 * Suitable for development. For real export, swap for `sdk-trace-web` (or a
 * vendor SDK) — see the philosophy note at the top of `setup.ts`.
 */
export const createConsoleTracerProvider = (): TracerProvider => ({
  getTracer: (name: string): Tracer => createConsoleTracer(name),
});
