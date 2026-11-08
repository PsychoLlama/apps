import { createContext, type TracerConfig } from '../config';
import { SpanAlreadyEnteredError, SpanAlreadyExitedError } from '../errors';
import type { Action } from '../processor/processor';
import type { Span } from '../processor/span-data';
import { createSpan } from '../span';

describe('span', () => {
  const traceId = new Uint8Array(16).fill(1);

  const setup = (overrides?: Partial<TracerConfig>) => {
    const spans: Span[] = [];
    const actions: Action[] = [];
    const context = createContext({
      getCurrentTime: () => 1_000,
      processor: (span) => {
        spans.push(span);
        return (action) => {
          actions.push(action);
        };
      },
      holz: { processor: vi.fn() },
      ...overrides,
    });

    return {
      context: { ...context, parent: null, trace: { id: traceId } },
      spans,
      actions,
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
        },
      ]);
    });
  });

  describe('enter', () => {
    it('sends only the entered span to the handler', () => {
      const { context, spans, actions } = setup({
        getCurrentTime: () => 1_000.5,
      });

      createSpan('load-page', context).enter();

      expect(actions).toEqual([
        { type: 'enter', span: { ...spans[0], time: { started: 1_000.5 } } },
      ]);
    });

    it('returns a function that exits the span', () => {
      const getCurrentTime = vi
        .fn<() => number>()
        .mockReturnValueOnce(1_000.5)
        .mockReturnValueOnce(2_000.25);
      const { context, spans, actions } = setup({ getCurrentTime });

      const exit = createSpan('load-page', context).enter();
      exit();

      expect(actions).toEqual([
        { type: 'enter', span: { ...spans[0], time: { started: 1_000.5 } } },
        {
          type: 'exit',
          span: {
            ...spans[0],
            time: { started: 1_000.5, ended: 2_000.25 },
            status: { code: 'ok' },
          },
        },
      ]);
    });

    it('reports a failure with the original error', () => {
      const { context, actions } = setup();
      const error = new TypeError('Request failed.');

      const exit = createSpan('load-page', context).enter();
      exit({ error });

      const action = actions.at(-1);
      assert(action?.type === 'exit' && action.span.status.code === 'error');

      expect(action.span.status.error).toBe(error);
    });

    it('throws when entered twice', () => {
      const { context, actions } = setup();
      const span = createSpan('load-page', context);

      span.enter();

      expect(() => span.enter()).toThrow(SpanAlreadyEnteredError);
      expect(actions).toHaveLength(1);
    });

    it('throws when exited twice', () => {
      const { context, actions } = setup();
      const exit = createSpan('load-page', context).enter();

      exit();

      expect(exit).toThrow(SpanAlreadyExitedError);
      expect(actions).toHaveLength(2);
    });
  });

  describe('child', () => {
    it('sends actions to its own handler, not its parent', () => {
      const handlers = [vi.fn(), vi.fn()];
      const remaining = [...handlers];
      const { context } = setup({
        processor: () => remaining.shift() ?? vi.fn(),
      });

      createSpan('parent', context).child('child').enter();

      expect(handlers[0]).not.toHaveBeenCalled();
      expect(handlers[1]).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ type: 'enter' }),
      );
    });

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
