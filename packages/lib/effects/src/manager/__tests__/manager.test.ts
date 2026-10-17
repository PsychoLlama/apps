import { createEffect, createRoot } from 'solid-js';
import { collect, concurrent, pipe } from '../../combinators';
import { resource } from '../../task';
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

const output = (handle: Handle) =>
  handle.outputs.map((node) => {
    const state = inspect(handle, node);
    return state.step === 'succeeded' ? state.value : state;
  });

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
        value: 1,
      });
      expect(inspect(handle, handle.nodes[1])).toEqual({
        step: 'succeeded',
        inputs: [1],
        value: 2,
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
    });

    it('awaits async tasks and unwraps resources', async () => {
      const manager = createManager();
      const open = async () => resource('stream', () => {});
      const handle = acquire(pipe([open]));

      await compute(manager, handle);

      expect(output(handle)).toEqual(['stream']);
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

    it('releases a failed flow without disposing anything', async () => {
      const manager = createManager();
      const dispose = vi.fn();
      const open = () => resource('stream', dispose);
      const observe = () => {
        throw new Error('observer');
      };
      const handle = acquire(pipe([open, observe]));

      await expect(compute(manager, handle)).rejects.toBeInstanceOf(
        AggregateError,
      );
      await release(manager, handle);

      expect(dispose).toHaveBeenCalledTimes(1);
      expect(inspect(handle, handle.nodes[1])).toEqual({
        step: 'failed',
        inputs: ['stream'],
        error: new Error('observer'),
      });
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
