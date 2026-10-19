import { render } from '@solidjs/testing-library';
import { createEffect, createRoot, type Resource } from 'solid-js';
import { concurrent, pipe } from '../../combinators';
import { resource } from '../../task';
import { createTestController } from '../../testing';
import type { Controller } from '../../controller/controller';
import { EffectsRoot } from '../context';
import { useFlow } from '../use-flow';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Run `setup` as a component's body under the given controller. */
const mount = <Result,>(controller: Controller, setup: () => Result) => {
  let result!: Result;
  const Probe = () => {
    result = setup();
    return null;
  };

  const { unmount } = render(() => (
    <EffectsRoot controller={controller}>
      <Probe />
    </EffectsRoot>
  ));

  return { result, dispose: unmount };
};

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

  it('tolerates disposal before mount', async () => {
    await using controller = createTestController();
    const open = vi.fn(() => 1);

    createRoot((dispose) => {
      const Probe = () => {
        useFlow(pipe([open]));
        dispose();
        return null;
      };

      return (
        <EffectsRoot controller={controller.controller}>
          <Probe />
        </EffectsRoot>
      );
    });

    await settle();

    expect(open).not.toHaveBeenCalled();
  });
});
