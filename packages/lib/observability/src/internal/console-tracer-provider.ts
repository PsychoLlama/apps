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

const HEX = '0123456789abcdef';

const randomHex = (bytes: number): string => {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let out = '';
  for (const byte of buf) {
    out += HEX[byte >> 4] + HEX[byte & 0x0f];
  }
  return out;
};

interface RecordedEvent {
  name: string;
  attributes?: Attributes;
  time: number;
}

const isAttributes = (
  value: Attributes | TimeInput | undefined,
): value is Attributes => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !(value instanceof Date) &&
    !Array.isArray(value)
  );
};

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

class ConsoleSpan implements Span {
  readonly #context: SpanContext;
  readonly #parentSpanId: string | undefined;
  readonly #attributes: Record<string, AttributeValue> = {};
  readonly #events: RecordedEvent[] = [];
  readonly #scope: string;
  readonly #start: number;
  #name: string;
  #status: SpanStatus = { code: SpanStatusCode.UNSET };
  #end: number | undefined;

  constructor(scope: string, name: string, parent: SpanContext | undefined) {
    this.#scope = scope;
    this.#name = name;
    this.#context = {
      traceId: parent?.traceId ?? randomHex(16),
      spanId: randomHex(8),
      traceFlags: TraceFlags.SAMPLED,
    };
    this.#parentSpanId = parent?.spanId;
    this.#start = performance.now();
  }

  spanContext(): SpanContext {
    return this.#context;
  }

  setAttribute(key: string, value: AttributeValue): this {
    this.#attributes[key] = value;
    return this;
  }

  setAttributes(attributes: Attributes): this {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) this.#attributes[key] = value;
    }
    return this;
  }

  addEvent(name: string, attributesOrStartTime?: Attributes | TimeInput): this {
    this.#events.push({
      name,
      attributes: isAttributes(attributesOrStartTime)
        ? attributesOrStartTime
        : undefined,
      time: performance.now(),
    });
    return this;
  }

  addLink(): this {
    return this;
  }

  addLinks(): this {
    return this;
  }

  setStatus(status: SpanStatus): this {
    this.#status = status;
    return this;
  }

  updateName(name: string): this {
    this.#name = name;
    return this;
  }

  recordException(exception: Exception): void {
    this.#events.push({
      name: 'exception',
      attributes: { 'exception.message': exceptionMessage(exception) },
      time: performance.now(),
    });
  }

  isRecording(): boolean {
    return this.#end === undefined;
  }

  end(): void {
    if (this.#end !== undefined) return;
    this.#end = performance.now();
    const duration = (this.#end - this.#start).toFixed(1);
    const fn =
      this.#status.code === SpanStatusCode.ERROR ? console.error : console.info;
    fn(`[SPAN] ${this.#scope} ${this.#name} (${duration}ms)`, {
      traceId: this.#context.traceId,
      spanId: this.#context.spanId,
      parentSpanId: this.#parentSpanId,
      attributes: this.#attributes,
      events: this.#events,
      status: this.#status,
    });
  }
}

const createConsoleTracer = (scope: string): Tracer => {
  const startSpan = (
    name: string,
    options?: SpanOptions,
    ctx?: Context,
  ): Span => {
    const parent = options?.root
      ? undefined
      : trace.getSpan(ctx ?? context.active())?.spanContext();
    const span = new ConsoleSpan(scope, name, parent);
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
