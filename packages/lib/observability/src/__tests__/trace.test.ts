import { context, SpanStatusCode, trace } from '@opentelemetry/api';
import { configure } from '../setup';
import { createTracer } from '../trace';

beforeEach(() => {
  vi.restoreAllMocks();
  trace.disable();
  context.disable();
  configure({ traces: 'console' });
});

describe('createTracer', () => {
  it('runs a sync callback and ends the span on completion', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const tracer = createTracer('test');
    const result = tracer.span('do', () => 42);
    expect(result).toBe(42);
    expect(info).toHaveBeenCalledOnce();
  });

  it('returns the awaited result from an async callback', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const tracer = createTracer('test');
    const result = await tracer.span('do', () => Promise.resolve(42));
    expect(result).toBe(42);
    expect(info).toHaveBeenCalledOnce();
  });

  it('passes the span to the callback so attributes can be set', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    createTracer('test').span('do', (span) => {
      span.setAttribute('user', 'alice');
    });
    const payload = info.mock.calls[0]?.[1] as {
      attributes: Record<string, unknown>;
    };
    expect(payload.attributes).toEqual({ user: 'alice' });
  });

  it('records exceptions and sets ERROR status on sync throw', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const tracer = createTracer('test');
    expect(() =>
      tracer.span('do', () => {
        throw new Error('boom');
      }),
    ).toThrow('boom');

    expect(error).toHaveBeenCalledOnce();
    const payload = error.mock.calls[0]?.[1] as {
      status: { code: SpanStatusCode };
      events: Array<{ name: string }>;
    };
    expect(payload.status.code).toBe(SpanStatusCode.ERROR);
    expect(payload.events[0]?.name).toBe('exception');
  });

  it('propagates parent context to nested span() calls', () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const tracer = createTracer('test');

    tracer.span('outer', () => {
      tracer.span('inner', () => {});
    });

    // Inner ends first (LIFO via try/finally), outer second.
    expect(info).toHaveBeenCalledTimes(2);
    const inner = info.mock.calls[0] as [
      string,
      { traceId: string; parentSpanId?: string },
    ];
    const outer = info.mock.calls[1] as [
      string,
      { traceId: string; spanId: string },
    ];
    expect(inner[1].traceId).toBe(outer[1].traceId);
    expect(inner[1].parentSpanId).toBe(outer[1].spanId);
  });

  it('exposes the active span via trace.getActiveSpan inside the callback', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const tracer = createTracer('test');

    tracer.span('outer', (outer) => {
      expect(trace.getActiveSpan()?.spanContext().spanId).toBe(
        outer.spanContext().spanId,
      );
    });
  });

  it('records exceptions and sets ERROR status on async reject', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const tracer = createTracer('test');
    await expect(
      tracer.span('do', () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');

    expect(error).toHaveBeenCalledOnce();
    const payload = error.mock.calls[0]?.[1] as {
      status: { code: SpanStatusCode };
    };
    expect(payload.status.code).toBe(SpanStatusCode.ERROR);
  });
});
