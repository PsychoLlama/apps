import {
  createEffect,
  createRoot,
  createSignal,
  type Accessor,
  type Setter,
} from 'solid-js';
import { collect, concurrent, pipe } from '../../combinators';
import { reactive, resource, yieldOf } from '../../task';
import { isWrapped } from '../../task/output';
import {
  acquire,
  compute,
  createManager,
  inspect,
  release,
  type Handle,
} from '../manager';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** The raw output tuple, wrappers included. */
const raw = (handle: Handle) => {
  const state = inspect(handle, handle.output);
  assert(state.step === 'succeeded');
  return state.outputs;
};

/** The output as downstream tasks receive it. */
const output = (handle: Handle) => {
  const state = inspect(handle, handle.output);
  return state.step === 'succeeded' ? state.outputs.map(yieldOf) : state;
};

describe('manager', () => {
  describe('compute', () => {
    it('runs a pipeline and exposes node states', async () => {
      const manager = createManager();
      const one = () => 1;
      const double = (value: number) => value * 2;
      const handle = acquire(pipe([one, double]));

      expect(inspect(handle, handle.nodes[0])).toEqual({
        step: 'pending',
      });

      await compute(manager, handle);

      expect(inspect(handle, handle.nodes[0])).toEqual({
        step: 'succeeded',
        inputs: [],
        outputs: [1],
      });
      expect(inspect(handle, handle.nodes[1])).toEqual({
        step: 'succeeded',
        inputs: [1],
        outputs: [2],
      });
    });

    it('spreads concurrent outputs and boxes collected ones', async () => {
      const manager = createManager();
      const one = () => 1;
      const two = () => 2;
      const add = (left: number, right: number) => left + right;
      const sum = acquire(pipe([concurrent([one, two]), add]));
      const boxed = acquire(collect([one, two]));

      await Promise.all([compute(manager, sum), compute(manager, boxed)]);

      expect(output(sum)).toEqual([3]);
      expect(output(boxed)).toEqual([[1, 2]]);
      expect(isWrapped(raw(boxed)[0], 'collected')).toBe(true);
    });

    it('awaits async tasks and keeps resources whole', async () => {
      const manager = createManager();
      const stream = resource('stream', () => {});
      const open = async () => stream;
      const handle = acquire(pipe([open]));

      await compute(manager, handle);

      expect(raw(handle)).toEqual([stream]);
      expect(output(handle)).toEqual(['stream']);
    });

    it('passes downstream the values inside wrappers', async () => {
      const manager = createManager();
      const open = () => resource('stream', () => {});
      const both = collect([open, () => 1]);
      const seen = vi.fn((values: [string, number]) => values);
      const handle = acquire(pipe([both, seen]));

      await compute(manager, handle);

      expect(seen).toHaveBeenCalledWith(['stream', 1]);
    });

    it('passes a reactive output downstream as its accessor', async () => {
      const manager = createManager();
      let setMuted!: Setter<boolean>;
      const observe = async () => {
        const [muted, set] = createSignal(false);
        setMuted = set;
        return reactive(muted);
      };
      const seen = vi.fn((state: Accessor<boolean>) => state());
      const handle = acquire(pipe([observe, seen]));

      await compute(manager, handle);
      const state = inspect(handle, handle.nodes[0]);
      assert(state.step === 'succeeded');
      expect(isWrapped(state.outputs[0], 'reactive')).toBe(true);
      const muted = yieldOf(state.outputs[0]) as Accessor<boolean>;

      setMuted(true);
      expect(muted()).toBe(true);
      expect(output(handle)).toEqual([false]);
      expect(seen).toHaveBeenCalledOnce();
    });

    it('is idempotent', async () => {
      const manager = createManager();
      const one = vi.fn(() => 1);
      const handle = acquire(pipe([one]));

      await compute(manager, handle);
      await compute(manager, handle);

      expect(one).toHaveBeenCalledTimes(1);
    });

    it('refuses a released handle', async () => {
      const manager = createManager();
      const handle = acquire(pipe([() => 1]));
      await release(manager, handle);

      await expect(compute(manager, handle)).rejects.toThrow(/released/);
      await expect(release(manager, handle)).rejects.toThrow(/released/);
    });
  });

  describe('inspect', () => {
    it('tracks node state under a Solid computation', async () => {
      const manager = createManager();
      const gate = Promise.withResolvers<string>();
      const open = () => gate.promise;
      const handle = acquire(pipe([open]));
      const steps: string[] = [];

      const dispose = createRoot((dispose) => {
        createEffect(() => {
          steps.push(inspect(handle, handle.nodes[0]).step);
        });
        return dispose;
      });

      expect(steps).toEqual(['pending']);

      const computing = compute(manager, handle);
      gate.resolve('stream');
      await computing;

      expect(steps).toEqual(['pending', 'computing', 'succeeded']);
      dispose();
    });

    it('refuses a node from another flow', () => {
      const handle = acquire(pipe([() => 1]));
      const other = acquire(pipe([() => 2]));

      expect(() => inspect(handle, other.nodes[0])).toThrow(/not part/);
    });
  });

  describe('cache', () => {
    it('shares entries across handles by task and input identity', async () => {
      const manager = createManager();
      const config = { video: true };
      const getConfig = () => config;
      const open = vi.fn((options: { video: boolean }) => options.video);
      const first = acquire(pipe([getConfig, open]));
      const second = acquire(pipe([getConfig, open]));

      await compute(manager, first);
      await compute(manager, second);

      expect(open).toHaveBeenCalledTimes(1);
      expect(output(second)).toEqual([true]);
    });

    it('keeps separate entries for inputs that differ by identity', async () => {
      const manager = createManager();
      const open = vi.fn((options: { video: boolean }) => options.video);
      const first = acquire(pipe([() => ({ video: true }), open]));
      const second = acquire(pipe([() => ({ video: true }), open]));

      await compute(manager, first);
      await compute(manager, second);

      expect(open).toHaveBeenCalledTimes(2);
    });

    it('dedupes work that is still in flight', async () => {
      const manager = createManager();
      const gate = Promise.withResolvers<string>();
      const open = vi.fn(() => gate.promise);
      const first = acquire(pipe([open]));
      const second = acquire(pipe([open]));

      const computing = Promise.all([
        compute(manager, first),
        compute(manager, second),
      ]);
      await settle();

      expect(open).toHaveBeenCalledTimes(1);
      expect(inspect(second, second.nodes[0])).toEqual({
        step: 'computing',
        inputs: [],
      });

      gate.resolve('stream');
      await computing;

      expect(output(second)).toEqual(['stream']);
    });

    it('shares one output tuple across handles', async () => {
      const manager = createManager();
      const one = () => 1;
      const first = acquire(pipe([one]));
      const second = acquire(pipe([one]));

      await compute(manager, first);
      await compute(manager, second);

      expect(output(first)).toEqual([1]);
      expect(raw(second)).toBe(raw(first));
    });

    it('shares downstream work across tasks with equal outputs', async () => {
      const manager = createManager();
      const double = vi.fn((value: number) => value * 2);
      const first = acquire(pipe([() => 1, double]));
      const second = acquire(pipe([() => 1, double]));

      await compute(manager, first);
      await compute(manager, second);

      expect(double).toHaveBeenCalledOnce();
      expect(raw(second)).toBe(raw(first));
    });

    it('keeps an equal output shared while any task still holds it', async () => {
      const manager = createManager();
      const double = vi.fn((value: number) => value * 2);
      const first = acquire(pipe([() => 1, double]));
      const second = acquire(pipe([() => 1, double]));
      await compute(manager, first);
      await compute(manager, second);

      await release(manager, first);
      const third = acquire(pipe([() => 1, double]));
      await compute(manager, third);

      expect(double).toHaveBeenCalledOnce();
      expect(raw(third)).toBe(raw(second));
    });

    it('frees an output once no task holds it', async () => {
      const manager = createManager();
      const one = () => 1;
      const first = acquire(pipe([one]));
      await compute(manager, first);

      await release(manager, first);

      expect(manager.cache.interned.size).toBe(0);
    });

    it('shares a join and everything downstream of it', async () => {
      const manager = createManager();
      const one = () => 1;
      const two = () => 2;
      const add = vi.fn((left: number, right: number) => left + right);
      const both = concurrent([one, two]);
      const first = acquire(pipe([both, add]));
      const second = acquire(pipe([both, add]));

      await compute(manager, first);
      await compute(manager, second);

      const joined = inspect(first, first.nodes[2]);
      expect(joined).toEqual({
        step: 'succeeded',
        inputs: [],
        outputs: [1, 2],
      });
      expect(inspect(second, second.nodes[2])).toBe(joined);
      expect(add).toHaveBeenCalledOnce();
    });

    it('shares one collected array while its branches live', async () => {
      const manager = createManager();
      const one = () => 1;
      const two = () => 2;
      const both = collect([one, two]);
      const first = acquire(both);
      const second = acquire(both);

      await compute(manager, first);
      await compute(manager, second);
      const [collected] = output(first) as [number[]];

      expect(collected).toEqual([1, 2]);
      expect(output(second)).toEqual([collected]);
      expect((output(second) as [number[]])[0]).toBe(collected);
    });

    it('keeps a join per input tuple', async () => {
      const manager = createManager();
      const double = (value: number) => value * 2;
      const both = concurrent([double, double]);
      const first = acquire(pipe([() => 1, both]));
      const second = acquire(pipe([() => 2, both]));

      await compute(manager, first);
      await compute(manager, second);

      expect(output(first)).toEqual([2, 2]);
      expect(output(second)).toEqual([4, 4]);
      expect(manager.cache.entries.join.get(both)?.size).toBe(2);
    });

    it('resolves a diamond once per handle', async () => {
      const manager = createManager();
      const one = vi.fn(() => 1);
      const double = (value: number) => value * 2;
      const add = (left: number, right: number) => left + right;
      const handle = acquire(pipe([one, concurrent([double, double]), add]));

      await compute(manager, handle);

      expect(one).toHaveBeenCalledTimes(1);
      expect(output(handle)).toEqual([4]);
    });
  });

  describe('failure', () => {
    it('caches the error and leaves downstream pending', async () => {
      const manager = createManager();
      const error = new Error('denied');
      const open = vi.fn(() => {
        throw error;
      });
      const observe = vi.fn((stream: never) => stream);
      const first = acquire(pipe([open, concurrent([observe, observe])]));
      const second = acquire(pipe([open]));

      await expect(compute(manager, first)).rejects.toSatisfy(
        (failure: AggregateError) => {
          expect(failure.errors).toEqual([error]);
          return true;
        },
      );
      await expect(compute(manager, second)).rejects.toBeInstanceOf(
        AggregateError,
      );

      expect(open).toHaveBeenCalledTimes(1);
      expect(observe).not.toHaveBeenCalled();
      expect(inspect(first, first.nodes[0])).toEqual({
        step: 'failed',
        inputs: [],
        error,
      });
      expect(inspect(first, first.nodes[1])).toEqual({
        step: 'pending',
      });
    });

    it('reports every independent failure', async () => {
      const manager = createManager();
      const left = () => Promise.reject(new Error('left'));
      const right = () => Promise.reject(new Error('right'));
      const handle = acquire(concurrent([left, right]));

      await expect(compute(manager, handle)).rejects.toSatisfy(
        (failure: AggregateError) => {
          expect(failure.errors.map((error: Error) => error.message)).toEqual([
            'left',
            'right',
          ]);
          return true;
        },
      );
    });
  });

  describe('release', () => {
    it('disposes resources once the last handle lets go', async () => {
      const manager = createManager();
      const dispose = vi.fn();
      const open = () => resource('stream', dispose);
      const first = acquire(pipe([open]));
      const second = acquire(pipe([open]));

      await Promise.all([compute(manager, first), compute(manager, second)]);
      await release(manager, first);
      expect(dispose).not.toHaveBeenCalled();

      await release(manager, second);
      expect(dispose).toHaveBeenCalledTimes(1);
    });

    it('disposes reactive outputs, cleanup or not', async () => {
      const manager = createManager();
      const dispose = vi.fn();
      const observe = () => reactive(() => true, dispose);
      const bare = () => reactive(() => true);
      const handle = acquire(concurrent([observe, bare]));

      await compute(manager, handle);
      await release(manager, handle);

      expect(dispose).toHaveBeenCalledOnce();
    });

    it('tears down downstream before upstream', async () => {
      const manager = createManager();
      const order: string[] = [];
      const downstreamGate = Promise.withResolvers<void>();
      const open = () =>
        resource('stream', () => {
          order.push('stream');
        });
      const observe = (stream: string) =>
        resource(stream.length, async () => {
          order.push('observer:start');
          await downstreamGate.promise;
          order.push('observer:end');
        });
      const handle = acquire(pipe([open, observe]));

      await compute(manager, handle);
      const releasing = release(manager, handle);
      await settle();

      expect(order).toEqual(['observer:start']);

      downstreamGate.resolve();
      await releasing;

      expect(order).toEqual(['observer:start', 'observer:end', 'stream']);
    });

    it('recomputes after a full release', async () => {
      const manager = createManager();
      const open = vi.fn(() => resource('stream', () => {}));
      const first = acquire(pipe([open]));
      await compute(manager, first);
      await release(manager, first);

      const second = acquire(pipe([open]));
      await compute(manager, second);

      expect(open).toHaveBeenCalledTimes(2);
    });

    it('waits for a retiring key before starting its next life', async () => {
      const manager = createManager();
      const order: string[] = [];
      const disposeGate = Promise.withResolvers<void>();
      const open = vi.fn(() => {
        order.push('open');
        return resource('stream', async () => {
          order.push('dispose:start');
          await disposeGate.promise;
          order.push('dispose:end');
        });
      });

      const first = acquire(pipe([open]));
      await compute(manager, first);
      const releasing = release(manager, first);
      await settle();
      expect(order).toEqual(['open', 'dispose:start']);

      const second = acquire(pipe([open]));
      const computing = compute(manager, second);
      await settle();

      expect(order).toEqual(['open', 'dispose:start']);

      disposeGate.resolve();
      await Promise.all([releasing, computing]);

      expect(order).toEqual(['open', 'dispose:start', 'dispose:end', 'open']);
      expect(output(second)).toEqual(['stream']);
    });

    it('lets in-flight work settle before disposing it', async () => {
      const manager = createManager();
      const gate = Promise.withResolvers<string>();
      const dispose = vi.fn();
      const open = () => gate.promise.then((value) => resource(value, dispose));
      const handle = acquire(pipe([open]));

      void compute(manager, handle);
      await settle();
      const releasing = release(manager, handle);
      await settle();

      expect(dispose).not.toHaveBeenCalled();

      gate.resolve('stream');
      await releasing;

      expect(dispose).toHaveBeenCalledTimes(1);
    });

    it('releases a failed flow and resets its nodes', async () => {
      const manager = createManager();
      const dispose = vi.fn();
      const stream = resource('stream', dispose);
      const open = () => stream;
      const observe = () => {
        throw new Error('observer');
      };
      const handle = acquire(pipe([open, observe]));

      await expect(compute(manager, handle)).rejects.toBeInstanceOf(
        AggregateError,
      );
      expect(inspect(handle, handle.nodes[1])).toEqual({
        step: 'failed',
        inputs: [stream],
        error: new Error('observer'),
      });

      await release(manager, handle);

      expect(dispose).toHaveBeenCalledTimes(1);
      expect(inspect(handle, handle.nodes[1])).toEqual({ step: 'pending' });
    });

    it('does nothing for a handle that never computed', async () => {
      const manager = createManager();
      const open = vi.fn(() => 1);
      const handle = acquire(pipe([open]));

      await release(manager, handle);

      expect(open).not.toHaveBeenCalled();
    });

    it('runs every cleanup, then reports the ones that threw', async () => {
      const manager = createManager();
      const upstream = vi.fn();
      const open = () => resource('stream', upstream);
      const observe = (stream: string) =>
        resource(stream, () => {
          throw new Error('observer');
        });
      const handle = acquire(pipe([open, observe]));

      await compute(manager, handle);

      await expect(release(manager, handle)).rejects.toSatisfy(
        (failure: AggregateError) => {
          expect(failure.errors.map((error: Error) => error.message)).toEqual([
            'observer',
          ]);
          return true;
        },
      );
      expect(upstream).toHaveBeenCalledTimes(1);
    });
  });
});
