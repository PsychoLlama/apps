import { defineActivity } from '../activity';
import { createEventBus, subscribe } from '../event-bus';
import type { Topic } from '../topic';
import { defineWorkflow, useWorkflow } from '../workflow';
import { defineStore } from '../store';

describe('defineWorkflow', () => {
  it('exposes started, resolved, and rejected topics', () => {
    const workflow = defineWorkflow(() => 'done');

    expect(typeof workflow.started).toBe('symbol');
    expect(typeof workflow.resolved).toBe('symbol');
    expect(typeof workflow.rejected).toBe('symbol');
  });
});

describe('useWorkflow', () => {
  it('publishes started with the input', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((_, userId: string) => `user-${userId}`);
    const handler = vi.fn();

    subscribe(eventBus, [workflow.started], handler);
    const run = useWorkflow(workflow, eventBus);
    run('abc');

    expect(handler).toHaveBeenCalledWith(workflow.started, 'abc');
  });

  it('publishes resolved with the value on success', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((_, n: number) => n * 2);
    const handler = vi.fn();

    subscribe(eventBus, [workflow.resolved], handler);
    const run = useWorkflow(workflow, eventBus);
    run(5);

    expect(handler).toHaveBeenCalledWith(workflow.resolved, 10);
  });

  it('publishes rejected with error on sync throw', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((): string => {
      throw new Error('boom');
    });
    const handler = vi.fn();

    subscribe(eventBus, [workflow.rejected], handler);
    const run = useWorkflow(workflow, eventBus);
    run();

    expect(handler).toHaveBeenCalledWith(workflow.rejected, new Error('boom'));
  });

  it('publishes resolved with the value on async success', async () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((_, id: string) =>
      Promise.resolve({ id, name: 'test' }),
    );
    const handler = vi.fn();

    subscribe(eventBus, [workflow.resolved], handler);
    const run = useWorkflow(workflow, eventBus);
    await run('abc');

    expect(handler).toHaveBeenCalledWith(workflow.resolved, {
      id: 'abc',
      name: 'test',
    });
  });

  it('publishes rejected with error on async throw', async () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow(async () => {
      await Promise.resolve();
      throw new Error('async boom');
    });
    const handler = vi.fn();

    subscribe(eventBus, [workflow.rejected], handler);
    const run = useWorkflow(workflow, eventBus);
    await run();

    expect(handler).toHaveBeenCalledWith(
      workflow.rejected,
      new Error('async boom'),
    );
  });

  it('wraps non-Error throws in an Error', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((): never => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw 'string error';
    });
    const handler = vi.fn();

    subscribe(eventBus, [workflow.rejected], handler);
    const run = useWorkflow(workflow, eventBus);
    run();

    const error = handler.mock.calls[0][1] as Error;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('string error');
  });

  it('re-throws sync errors when rejected has no subscribers', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((): never => {
      throw new Error('unhandled');
    });

    const run = useWorkflow(workflow, eventBus);

    expect(() => run()).toThrow('unhandled');
  });

  it('rejects the promise when async rejected has no subscribers', async () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow(async () => {
      await Promise.resolve();
      throw new Error('unhandled async');
    });

    const run = useWorkflow(workflow, eventBus);

    await expect(run()).rejects.toThrow('unhandled async');
  });

  it('does not re-throw when rejected has a subscriber', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((): never => {
      throw new Error('handled');
    });

    subscribe(eventBus, [workflow.rejected], vi.fn());
    const run = useWorkflow(workflow, eventBus);

    expect(() => run()).not.toThrow();
  });

  it('runs activities through ctx.run', () => {
    const double = defineActivity({}, (n: number) => n * 2);
    const eventBus = createEventBus();
    const workflow = defineWorkflow((ctx, n: number) => ctx.run(double, n));
    const handler = vi.fn();

    subscribe(eventBus, [workflow.resolved], handler);
    const run = useWorkflow(workflow, eventBus);
    run(5);

    expect(handler).toHaveBeenCalledWith(workflow.resolved, 10);
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

    subscribe(eventBus, [workflow.resolved], handler);
    const run = useWorkflow(workflow, eventBus);
    run();

    expect(handler).toHaveBeenCalledWith(workflow.resolved, 'caught');
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

        on(getUser.resolved, (state, user) => {
          state.loading = false;
          state.user = user;
        });
      },
    );

    const eventBus = createEventBus();
    const [state] = createUsers(eventBus);

    const run = useWorkflow(getUser, eventBus);
    run('user-1');

    expect(state.loading).toBe(false);
    expect(state.user).toEqual({ id: 'user-1', name: 'Alice' });
  });
});

describe('type inference', () => {
  it('sync workflow returns void', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow(() => 42);
    const run = useWorkflow(workflow, eventBus);
    const result = run();

    expectTypeOf(result).toEqualTypeOf<void>();
  });

  it('async workflow returns Promise<void>', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow(() => Promise.resolve(42));
    const run = useWorkflow(workflow, eventBus);
    const result = run();

    expectTypeOf(result).toEqualTypeOf<Promise<void>>();
  });

  it('infers started topic payload from input type', () => {
    const workflow = defineWorkflow((_, userId: string) => userId);

    expectTypeOf(workflow.started).toEqualTypeOf<Topic<string>>();
  });

  it('infers resolved topic payload from return type', () => {
    const workflow = defineWorkflow(() => 42);

    expectTypeOf(workflow.resolved).toEqualTypeOf<Topic<number>>();
  });

  it('infers resolved topic payload from async return type (unwrapped)', () => {
    const workflow = defineWorkflow(() => Promise.resolve(42));

    expectTypeOf(workflow.resolved).toEqualTypeOf<Topic<number>>();
  });

  it('rejected topic is always Topic<Error>', () => {
    const workflow = defineWorkflow(() => 42);

    expectTypeOf(workflow.rejected).toEqualTypeOf<Topic<Error>>();
  });

  it('void input requires no arguments', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow(() => 'done');
    const run = useWorkflow(workflow, eventBus);

    expectTypeOf(run).toEqualTypeOf<() => void>();
  });

  it('typed input requires the argument', () => {
    const eventBus = createEventBus();
    const workflow = defineWorkflow((_, n: number) => n);
    const run = useWorkflow(workflow, eventBus);

    expectTypeOf(run).toEqualTypeOf<(input: number) => void>();
  });
});
