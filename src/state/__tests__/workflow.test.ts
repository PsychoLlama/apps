import { defineActivity } from '../activity';
import { createEventBus, subscribe } from '../event-bus';
import { REJECTED, RESOLVED, type Result } from '../result';
import type { Topic } from '../topic';
import { defineWorkflow, run } from '../workflow';
import { defineStore } from '../store';

describe('defineWorkflow', () => {
  it('exposes started and settled topics', () => {
    const workflow = defineWorkflow(() => 'done');

    expect(typeof workflow.started).toBe('symbol');
    expect(typeof workflow.settled).toBe('symbol');
    expect(workflow.started).not.toBe(workflow.settled);
  });
});

describe('run', () => {
  it('publishes started with the input', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((_, userId: string) => `user-${userId}`);
    const handler = vi.fn();

    subscribe(eventBus, [workflow.started], handler);
    run(eventBus, workflow, 'abc');

    expect(handler).toHaveBeenCalledWith(workflow.started, 'abc');
  });

  it('publishes settled with resolved value on success', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((_, n: number) => n * 2);
    const handler = vi.fn();

    subscribe(eventBus, [workflow.settled], handler);
    run(eventBus, workflow, 5);

    expect(handler).toHaveBeenCalledWith(workflow.settled, {
      type: RESOLVED,
      value: 10,
    });
  });

  it('publishes settled with rejected value on sync throw', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((): string => {
      throw new Error('boom');
    });
    const handler = vi.fn();

    subscribe(eventBus, [workflow.settled], handler);
    run(eventBus, workflow);

    expect(handler).toHaveBeenCalledWith(workflow.settled, {
      type: REJECTED,
      value: new Error('boom'),
    });
  });

  it('publishes settled with resolved value on async success', async () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((_, id: string) =>
      Promise.resolve({ id, name: 'test' }),
    );
    const handler = vi.fn();

    subscribe(eventBus, [workflow.settled], handler);
    await run(eventBus, workflow, 'abc');

    expect(handler).toHaveBeenCalledWith(workflow.settled, {
      type: RESOLVED,
      value: { id: 'abc', name: 'test' },
    });
  });

  it('publishes settled with rejected value on async throw', async () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow(async () => {
      await Promise.resolve();
      throw new Error('async boom');
    });
    const handler = vi.fn();

    subscribe(eventBus, [workflow.settled], handler);
    await run(eventBus, workflow);

    expect(handler).toHaveBeenCalledWith(workflow.settled, {
      type: REJECTED,
      value: new Error('async boom'),
    });
  });

  it('wraps non-Error throws in an Error', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((): never => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'string error';
    });
    const handler = vi.fn();

    subscribe(eventBus, [workflow.settled], handler);
    run(eventBus, workflow);

    const result = handler.mock.calls[0][1] as Result<never>;
    expect(result.type).toBe(REJECTED);
    expect(result.value).toBeInstanceOf(Error);
    expect(result.value.message).toBe('string error');
  });

  it('runs activities through ctx.run', () => {
    const double = defineActivity({}, (n: number) => n * 2);
    const eventBus = createEventBus();
    const workflow = defineWorkflow((ctx, n: number) => ctx.run(double, n));
    const handler = vi.fn();

    subscribe(eventBus, [workflow.settled], handler);
    run(eventBus, workflow, 5);

    expect(handler).toHaveBeenCalledWith(workflow.settled, {
      type: RESOLVED,
      value: 10,
    });
  });

  it('propagates activity errors to the workflow', () => {
    const failing = defineActivity({}, () => {
      throw new Error('activity failed');
    });

    const eventBus = createEventBus();
    const workflow = defineWorkflow((ctx) => {
      try {
        ctx.run(failing);
        return 'unreachable';
      } catch {
        return 'caught';
      }
    });
    const handler = vi.fn();

    subscribe(eventBus, [workflow.settled], handler);
    run(eventBus, workflow);

    expect(handler).toHaveBeenCalledWith(workflow.settled, {
      type: RESOLVED,
      value: 'caught',
    });
  });

  it('integrates with stores via lifecycle topics', () => {
    const fetchUser = defineActivity({}, (id: string) => ({
      id,
      name: 'Alice',
    }));

    const getUser = defineWorkflow((ctx, userId: string) =>
      ctx.run(fetchUser, userId),
    );

    const createUsers = defineStore<{
      loading: boolean;
      user: { id: string; name: string } | null;
    }>(
      () => ({ loading: false, user: null }),
      (on) => {
        on(getUser.started, (state) => {
          state.loading = true;
        });

        on(getUser.settled, (state, result) => {
          state.loading = false;
          if (result.type === RESOLVED) {
            state.user = result.value;
          }
        });
      },
    );

    const eventBus = createEventBus();
    const [state] = createUsers(eventBus);

    run(eventBus, getUser, 'user-1');

    expect(state.loading).toBe(false);
    expect(state.user).toEqual({ id: 'user-1', name: 'Alice' });
  });
});

describe('type inference', () => {
  it('sync workflow returns void', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow(() => 42);
    const result = run(eventBus, workflow);

    expectTypeOf(result).toEqualTypeOf<void>();
  });

  it('async workflow returns Promise<void>', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow(() => Promise.resolve(42));
    const result = run(eventBus, workflow);

    expectTypeOf(result).toEqualTypeOf<Promise<void>>();
  });

  it('infers started topic payload from input type', () => {
    const workflow = defineWorkflow((_, userId: string) => userId);

    expectTypeOf(workflow.started).toEqualTypeOf<Topic<string>>();
  });

  it('infers settled topic payload from return type', () => {
    const workflow = defineWorkflow(() => 42);

    expectTypeOf(workflow.settled).toEqualTypeOf<Topic<Result<number>>>();
  });

  it('infers settled topic payload from async return type (unwrapped)', () => {
    const workflow = defineWorkflow(() => Promise.resolve(42));

    expectTypeOf(workflow.settled).toEqualTypeOf<Topic<Result<number>>>();
  });

  it('void input workflow requires no args', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow(() => 'done');

    // @ts-expect-error — should not accept an argument
    run(eventBus, workflow, 'extra');
  });
});
