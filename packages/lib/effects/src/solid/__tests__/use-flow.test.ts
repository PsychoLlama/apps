import {
  createComponent,
  createEffect,
  createRoot,
  type Resource,
} from 'solid-js';
import { concurrent, pipe } from '../../combinators';
import { source } from '../../source';
import { resource } from '../../task';
import { createTestController } from '../../testing';
import type { Controller } from '../../controller/controller';
import { DEFAULT_CONTROLLER } from '../../controller/default';
import { ControllerContext, useController } from '../context';
import { useFlow } from '../use-flow';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Run `setup` as if inside a component under the given controller. */
const mount = <Result>(controller: Controller, setup: () => Result) =>
  createRoot((dispose) => {
    let result!: Result;
    createComponent(ControllerContext.Provider, {
      value: controller,
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

    const { result, dispose } = mount(controller.controller, () => {
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

    const owner = mount(controller.controller, () => useFlow(pipe([open])));
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

    const { result, dispose } = mount(controller.controller, () =>
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

    const { result, dispose } = mount(controller.controller, () => ({
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
      createComponent(ControllerContext.Provider, {
        value: controller.controller,
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

describe('useController', () => {
  it('falls back to the default controller', () => {
    const [provided, fallback] = createRoot(() => {
      const outer = useController();
      let inner!: Controller;
      createComponent(ControllerContext.Provider, {
        value: createTestController().controller,
        get children() {
          inner = useController();
          return null;
        },
      });

      return [inner, outer];
    });

    expect(provided).not.toBe(fallback);
    expect(fallback).toBe(DEFAULT_CONTROLLER);
  });
});
