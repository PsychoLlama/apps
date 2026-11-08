import { createContext, type TracerConfig } from '../config';
import { createSpan, type Span } from '../span';

const setup = (overrides?: Partial<TracerConfig>) => {
  const spans: Span[] = [];
  const context = createContext({
    getCurrentTime: () => 1_000,
    processor: (span) => {
      spans.push(span);
      return vi.fn();
    },
    holz: { processor: vi.fn() },
    ...overrides,
  });

  return { context, spans };
};

describe('createSpan', () => {
  it('gives the processor only plain span data', () => {
    const getRandomBytes = (count: number) => new Uint8Array(count).fill(count);
    const { context, spans } = setup({ getRandomBytes });

    createSpan('load-page', context);

    expect(spans).toEqual([
      {
        name: 'load-page',
        traceId: new Uint8Array(16).fill(16),
        spanId: new Uint8Array(8).fill(8),
      },
    ]);
  });

  it('starts a new trace for each root span', () => {
    const { context, spans } = setup();

    createSpan('first', context);
    createSpan('second', context);

    const traceIds = spans.map((span) => span.traceId);

    expect(traceIds[1]).not.toEqual(traceIds[0]);
  });
});

describe('span.child', () => {
  it('announces each descendant to the processor', () => {
    const { context, spans } = setup();

    createSpan('a', context).child('b').child('c');

    expect(spans.map((span) => span.name)).toEqual(['a', 'b', 'c']);
  });

  it('inherits the trace ID', () => {
    const { context, spans } = setup();

    createSpan('parent', context).child('child');

    const traceIds = spans.map((span) => span.traceId);

    expect(traceIds).toHaveLength(2);
    expect(traceIds[1]).toEqual(traceIds[0]);
  });

  it('gets its own span ID', () => {
    const { context, spans } = setup();

    createSpan('parent', context).child('child');

    const spanIds = spans.map((span) => span.spanId);

    expect(spanIds[1]).not.toEqual(spanIds[0]);
  });
});
