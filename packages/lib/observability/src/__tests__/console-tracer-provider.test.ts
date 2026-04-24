import {
  context,
  SpanStatusCode,
  trace,
  type Span,
  type Tracer,
} from '@opentelemetry/api';
import { configure } from '../setup';

beforeEach(() => {
  vi.restoreAllMocks();
  trace.disable();
  configure({ traces: 'console' });
});

describe('console tracer', () => {
  it('emits a span on end() with [SPAN] tag and duration', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const tracer = trace.getTracer('app.test');
    const span = tracer.startSpan('do-thing');
    span.setAttribute('user', 'alice');
    span.end();

    expect(spy).toHaveBeenCalledOnce();
    const call = spy.mock.calls[0] as [string, Record<string, unknown>];
    expect(call[0]).toMatch(/^\[SPAN\] app\.test do-thing \(\d+\.\d+ms\)$/);
    expect(call[1]).toMatchObject({
      attributes: { user: 'alice' },
      status: { code: SpanStatusCode.UNSET },
    });
    expect(call[1].traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(call[1].spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it('routes ERROR status to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const span = trace.getTracer('test').startSpan('boom');
    span.setStatus({ code: SpanStatusCode.ERROR, message: 'kaboom' });
    span.end();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('records exceptions as events', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const span = trace.getTracer('test').startSpan('s');
    span.recordException(new Error('whoops'));
    span.end();
    const payload = spy.mock.calls[0]?.[1] as {
      events: Array<{ name: string; attributes?: Record<string, unknown> }>;
    };
    expect(payload.events).toHaveLength(1);
    expect(payload.events[0]?.name).toBe('exception');
    expect(payload.events[0]?.attributes?.['exception.message']).toContain(
      'whoops',
    );
  });

  it('inherits traceId from a parent context', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const tracer = trace.getTracer('test');
    const parent = tracer.startSpan('parent');
    const ctxWithParent = trace.setSpan(context.active(), parent);
    const child = tracer.startSpan('child', undefined, ctxWithParent);
    child.end();
    parent.end();

    const childPayload = spy.mock.calls[0]?.[1] as {
      traceId: string;
      parentSpanId?: string;
    };
    const parentPayload = spy.mock.calls[1]?.[1] as { traceId: string };
    expect(childPayload.traceId).toBe(parentPayload.traceId);
    expect(childPayload.parentSpanId).toBe(parent.spanContext().spanId);
  });

  it('honors options.root by detaching from any parent context', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const tracer = trace.getTracer('test');
    const parent = tracer.startSpan('parent');
    const ctxWithParent = trace.setSpan(context.active(), parent);
    const root = tracer.startSpan('root', { root: true }, ctxWithParent);
    root.end();
    parent.end();

    const rootPayload = spy.mock.calls[0]?.[1] as { parentSpanId?: string };
    expect(rootPayload.parentSpanId).toBeUndefined();
  });

  it('end() is idempotent', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const span = trace.getTracer('test').startSpan('once');
    span.end();
    span.end();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('isRecording reflects end state', () => {
    const span = trace.getTracer('test').startSpan('s');
    expect(span.isRecording()).toBe(true);
    span.end();
    expect(span.isRecording()).toBe(false);
  });
});

describe('startActiveSpan', () => {
  let tracer: Tracer;

  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    tracer = trace.getTracer('test');
  });

  it('passes the span to the callback and returns its result', () => {
    const result = tracer.startActiveSpan('s', (span) => {
      span.end();
      return 42;
    });
    expect(result).toBe(42);
  });

  it('accepts (name, options, callback)', () => {
    const seen: Span[] = [];
    tracer.startActiveSpan('s', { attributes: { k: 'v' } }, (span) => {
      seen.push(span);
      span.end();
    });
    expect(seen).toHaveLength(1);
  });

  it('accepts (name, options, context, callback)', () => {
    const ctx = context.active();
    const seen: Span[] = [];
    tracer.startActiveSpan('s', {}, ctx, (span) => {
      seen.push(span);
      span.end();
    });
    expect(seen).toHaveLength(1);
  });
});
