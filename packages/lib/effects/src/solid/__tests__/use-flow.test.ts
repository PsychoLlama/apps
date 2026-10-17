import {
  createComponent,
  createEffect,
  createRoot,
  type Resource,
} from 'solid-js';
import { concurrent, pipe } from '../../combinators';
import type { Manager } from '../../manager';
import { source } from '../../source';
import { resource } from '../../task';
import { createTestController } from '../../testing';
import { ManagerContext, useController, useManager } from '../context';
import { useFlow } from '../use-flow';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Run `setup` as if inside a component under the given manager. */
const mount = <Result>(manager: Manager, setup: () => Result) =>
  createRoot((dispose) => {
    let result!: Result;
    createComponent(ManagerContext.Provider, {
      value: manager,
      get children() {
        result = setup();
        return null;
      },
    });

    return { result, dispose };
  });

describe('useFlow', () => {
  it('reads unresolved until mounted, then tracks the computation', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();
    const one = () => gate.promise;
    const two = () => 'two';
    const states: string[] = [];

    const { result, dispose } = mount(controller.manager, () => {
      const outputs = useFlow(concurrent([one, two]));
      createEffect(() => {
        states.push(outputs[0].state);
      });

      return outputs;
    });

    expectTypeOf(result[0]).toEqualTypeOf<Resource<number>>();
    expectTypeOf(result[1]).toEqualTypeOf<Resource<string>>();
    expect(states).toEqual(['unresolved']);

    await settle();
    expect(states).toEqual(['unresolved', 'pending']);

    gate.resolve(1);
    await settle();

    expect(states).toEqual(['unresolved', 'pending', 'ready']);
    expect(result[0]()).toBe(1);
    expect(result[1]()).toBe('two');
    dispose();
  });

  it('releases the flow when the owner disposes', async () => {
    await using controller = createTestController();
    const dispose = vi.fn();
    const open = () => resource('stream', dispose);

    const owner = mount(controller.manager, () => useFlow(pipe([open])));
    await settle();
    expect(dispose).not.toHaveBeenCalled();

    owner.dispose();
    await settle();

    expect(dispose).toHaveBeenCalledTimes(1);
    expect(controller.manager.handles.size).toBe(0);
  });

  it('errors the resource when the task fails', async () => {
    await using controller = createTestController();
    const fail = () => Promise.reject(new Error('nope'));

    const { result, dispose } = mount(controller.manager, () =>
      useFlow(pipe([fail])),
    );
    await settle();

    expect(result[0].state).toBe('errored');
    expect(result[0].error).toEqual(new Error('nope'));
    dispose();
  });

  it('refreshes on a source change, keeping the latest value', async () => {
    await using controller = createTestController();
    const count = source(1);
    const gate = Promise.withResolvers<void>();
    const double = async (value: number) => {
      if (value > 1) await gate.promise;
      return value * 2;
    };

    const { result, dispose } = mount(controller.manager, () => ({
      outputs: useFlow(pipe([count, double])),
      controller: useController(),
    }));
    await settle();
    expect(result.outputs[0]()).toBe(2);

    const changing = result.controller.setSource(count, 3);
    await settle();
    expect(result.outputs[0].state).toBe('refreshing');
    expect(result.outputs[0].latest).toBe(2);

    gate.resolve();
    await changing;
    await settle();

    expect(result.outputs[0]()).toBe(6);
    dispose();
  });

  it('tolerates disposal before mount', async () => {
    await using controller = createTestController();
    const open = vi.fn(() => 1);

    createRoot((dispose) => {
      createComponent(ManagerContext.Provider, {
        value: controller.manager,
        get children() {
          useFlow(pipe([open]));
          dispose();
          return null;
        },
      });
    });

    await settle();

    expect(open).not.toHaveBeenCalled();
  });
});

describe('useManager', () => {
  it('falls back to the default manager', () => {
    const [provided, fallback] = createRoot(() => {
      const outer = useManager();
      let inner!: Manager;
      createComponent(ManagerContext.Provider, {
        value: createTestController().manager,
        get children() {
          inner = useManager();
          return null;
        },
      });

      return [inner, outer];
    });

    expect(provided).not.toBe(fallback);
    expect(fallback).toBe(createRoot(useManager));
  });
});
