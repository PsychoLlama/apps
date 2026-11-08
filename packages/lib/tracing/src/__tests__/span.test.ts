import { createContext, type TracerConfig } from '../config';
import { createSpan, type Span } from '../span';

describe('span', () => {
  const traceId = new Uint8Array(16).fill(1);

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

    return {
      context: { ...context, parent: null, trace: { id: traceId } },
      spans,
    };
  };

  describe('createSpan', () => {
    it('gives the processor only plain span data', () => {
      const getRandomBytes = (count: number) =>
        new Uint8Array(count).fill(count);
      const { context, spans } = setup({ getRandomBytes });

      createSpan('load-page', context);

      expect(spans).toEqual([
        {
          name: 'load-page',
          id: new Uint8Array(8).fill(8),
          parent: null,
          trace: { id: traceId },
          attrs: {},
        },
      ]);
    });
  });

  describe('child', () => {
    it('announces each descendant to the processor', () => {
      const { context, spans } = setup();

      createSpan('a', context).child('b').child('c');

      expect(spans.map((span) => span.name)).toEqual(['a', 'b', 'c']);
    });

    it('inherits the trace ID', () => {
      const { context, spans } = setup();

      createSpan('parent', context).child('child');

      expect(spans.map((span) => span.trace.id)).toEqual([traceId, traceId]);
    });

    it('gets its own span ID', () => {
      const { context, spans } = setup();

      createSpan('parent', context).child('child');

      const spanIds = spans.map((span) => span.id);

      expect(spanIds[1]).not.toEqual(spanIds[0]);
    });

    it('links each span to its immediate parent', () => {
      const { context, spans } = setup();

      createSpan('a', context).child('b').child('c');

      const [root, child, grandchild] = spans;

      expect(child?.parent).toEqual({ id: root?.id });
      expect(grandchild?.parent).toEqual({ id: child?.id });
    });
  });
});
