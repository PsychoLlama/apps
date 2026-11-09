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
          attrs: {},
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

  describe('updateAttrs', () => {
    it('sends the span with its edited attributes', () => {
      const { context, spans, actions } = setup();
      const span = createSpan('load-page', context, { attrs: { keep: 1 } });

      span.updateAttrs((attrs) => {
        attrs.added = 2;
      });

      expect(actions).toEqual([
        {
          type: 'attributes-updated',
          span: { ...spans[0], attrs: { keep: 1, added: 2 } },
        },
      ]);
    });

    it('includes the start time once entered', () => {
      const { context, spans, actions } = setup();
      const span = createSpan('load-page', context);

      span.enter();
      span.updateAttrs((attrs) => {
        attrs.added = 2;
      });

      expect(actions.at(-1)).toEqual({
        type: 'attributes-updated',
        span: { ...spans[0], attrs: { added: 2 }, time: { started: 1_000 } },
      });
    });

    it('edits the attributes the next action carries', () => {
      const { context, actions } = setup();
      const span = createSpan('load-page', context, { attrs: { keep: 1 } });

      span.updateAttrs((attrs) => {
        attrs.added = 2;
      });
      span.enter();

      expect(actions.at(-1)?.span.attrs).toEqual({ keep: 1, added: 2 });
    });

    it('leaves earlier snapshots unchanged when editing nested values', () => {
      const { context, spans } = setup();

      createSpan('load-page', context, {
        attrs: { http: { status: 200 } },
      }).updateAttrs((attrs) => {
        const { http } = attrs;
        assert(typeof http === 'object' && http !== null);
        assert(!Array.isArray(http));

        http.status = 500;
      });

      expect(spans[0]?.attrs).toEqual({ http: { status: 200 } });
    });

    it('builds on the previous update', () => {
      const { context, actions } = setup();
      const span = createSpan('load-page', context);

      span.updateAttrs((attrs) => {
        attrs.first = true;
      });
      span.updateAttrs((attrs) => {
        attrs.second = true;
      });
      span.enter();

      expect(actions.at(-1)?.span.attrs).toEqual({
        first: true,
        second: true,
      });
    });

    it('carries attributes through enter and exit', () => {
      const { context, actions } = setup();
      const span = createSpan('load-page', context);

      span.updateAttrs((attrs) => {
        attrs.before = true;
      });
      const exit = span.enter();
      span.updateAttrs((attrs) => {
        attrs.during = true;
      });
      exit();

      const [, entered, , exited] = actions;

      expect(entered?.span.attrs).toEqual({ before: true });
      expect(exited?.span.attrs).toEqual({ before: true, during: true });
    });

    it('discards the edit if it throws', () => {
      const { context, actions } = setup();
      const span = createSpan('load-page', context, { attrs: { keep: 1 } });
      const failure = new Error('Edit failed.');

      expect(() => {
        span.updateAttrs((attrs) => {
          attrs.keep = 2;
          throw failure;
        });
      }).toThrow(failure);

      span.enter();

      expect(actions).toHaveLength(1);
      expect(actions.at(-1)?.span.attrs).toEqual({ keep: 1 });
    });

    it('throws once the span has exited', () => {
      const { context, actions } = setup();
      const span = createSpan('load-page', context);

      span.enter()();

      expect(() => span.updateAttrs(vi.fn())).toThrow(SpanAlreadyExitedError);
      expect(actions).toHaveLength(2);
    });
  });

  describe('run', () => {
    const lastStatus = (actions: Action[]) => {
      const action = actions.at(-1);
      assert(action?.type === 'exit');

      return action.span.status;
    };

    it('passes the span to the work', () => {
      const { context } = setup();
      const span = createSpan('load-page', context);
      const work = vi.fn();

      span.run(work);

      expect(work).toHaveBeenCalledExactlyOnceWith(span);
    });

    it('enters before the work and exits after it', () => {
      const { context, actions } = setup();
      const seen: string[] = [];

      createSpan('load-page', context).run(() => {
        seen.push(...actions.map((action) => action.type));
      });

      expect(seen).toEqual(['enter']);
      expect(actions.map((action) => action.type)).toEqual(['enter', 'exit']);
      expect(lastStatus(actions)).toEqual({ code: 'ok' });
    });

    it('returns a synchronous result', () => {
      const { context } = setup();

      expect(createSpan('load-page', context).run(() => 'done')).toBe('done');
    });

    it('fails the span and rethrows a synchronous error', () => {
      const { context, actions } = setup();
      const error = new TypeError('Request failed.');

      expect(() =>
        createSpan('load-page', context).run(() => {
          throw error;
        }),
      ).toThrow(error);

      const status = lastStatus(actions);
      assert(status.code === 'error');

      expect(status.error).toBe(error);
    });

    it('waits for a promise before exiting', async () => {
      const { context, actions } = setup();

      const result = createSpan('load-page', context).run(async () => {
        await Promise.resolve();
        return 'done';
      });

      expect(actions.map((action) => action.type)).toEqual(['enter']);

      await expect(result).resolves.toBe('done');

      expect(lastStatus(actions)).toEqual({ code: 'ok' });
    });

    it('fails the span and passes along a rejection', async () => {
      const { context, actions } = setup();
      const error = new TypeError('Request failed.');

      const result = createSpan('load-page', context).run(() =>
        Promise.reject(error),
      );

      await expect(result).rejects.toBe(error);

      const status = lastStatus(actions);
      assert(status.code === 'error');

      expect(status.error).toBe(error);
    });

    it('wraps thrown values that are not errors', () => {
      const { context, actions } = setup();

      expect(() =>
        createSpan('load-page', context).run(() => {
          // eslint-disable-next-line @typescript-eslint/only-throw-error -- The case under test.
          throw 'Request failed.';
        }),
      ).toThrow('Request failed.');

      const status = lastStatus(actions);
      assert(status.code === 'error');

      expect(status.error).toBeInstanceOf(Error);
      expect(status.error.cause).toBe('Request failed.');
    });

    it('does not start the work if the span was already entered', () => {
      const { context } = setup();
      const span = createSpan('load-page', context);
      const work = vi.fn<() => void>();

      span.enter();

      expect(() => span.run(work)).toThrow(SpanAlreadyEnteredError);
      expect(work).not.toHaveBeenCalled();
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

    it('takes its own attributes instead of inheriting them', () => {
      const { context, spans } = setup();

      createSpan('parent', context, { attrs: { parent: true } })
        .child('with-attrs', { attrs: { child: true } })
        .child('without-attrs');

      expect(spans.map((span) => span.attrs)).toEqual([
        { parent: true },
        { child: true },
        {},
      ]);
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
