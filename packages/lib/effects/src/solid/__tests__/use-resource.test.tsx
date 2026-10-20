import { render, screen } from '@solidjs/testing-library';
import {
  createSignal,
  Suspense,
  type Component,
  type Resource,
} from 'solid-js';
import { collect, pipe } from '../../combinators';
import { reactive, resource } from '../../task';
import { createTestController } from '../../testing';
import type { Controller } from '../../controller/controller';
import { EffectsContext } from '../context';
import { useResource } from '../use-resource';

// An interface, not a type alias: those get no implicit index signature.
interface Profile {
  readonly name: string;
}

const profile: Profile = { name: 'stream' };

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Run `setup` as a component's body under a context whose `mounted` flag
 * the test flips by hand, so anything that resolves before `mount` did
 * so without waiting for it. `wrap` places the probe, which it must
 * render itself so the probe is owned by whatever it's placed in.
 */
const renderUnmounted = <Result,>(
  controller: Controller,
  setup: () => Result,
  wrap = (Probe: Component) => <Probe />,
) => {
  const [mounted, setMounted] = createSignal(false);

  let result!: Result;
  const Probe = () => {
    result = setup();
    return null;
  };

  const { unmount } = render(() => (
    <EffectsContext.Provider value={{ controller, mounted }}>
      {wrap(Probe)}
    </EffectsContext.Provider>
  ));

  return { result, mount: () => setMounted(true), unmount };
};

describe('useResource', () => {
  it('computes without waiting for mount', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();
    const load = vi.fn(() => gate.promise);
    const double = (value: number) => value * 2;

    const tree = renderUnmounted(controller.controller, () =>
      useResource(pipe([load, double])),
    );

    expectTypeOf(tree.result).toEqualTypeOf<Resource<number>>();
    expect(tree.result.state).toBe('pending');
    expect(load).toHaveBeenCalledOnce();

    gate.resolve(1);
    await settle();

    expect(tree.result.state).toBe('ready');
    expect(tree.result()).toBe(2);
    tree.unmount();
  });

  it('reads reactive state through, tracked', async () => {
    await using controller = createTestController();
    const [muted, setMuted] = createSignal(false);
    const observe = () => reactive(muted);

    const tree = renderUnmounted(controller.controller, () =>
      useResource(pipe([observe])),
    );

    await settle();
    expect(tree.result()).toBe(false);

    setMuted(true);

    expect(tree.result()).toBe(true);
    tree.unmount();
  });

  it('takes only serializable outputs', async () => {
    await using controller = createTestController();
    const data = () => ({
      name: 'stream',
      tags: new Set(['live']),
      at: new Date(0),
    });
    const action = () => () => 'done';
    const nested = () => ({ items: [{ run: () => {} }] });
    const branded = () => ({ [Symbol.iterator]: 1 });
    const live = () => reactive(() => ({ count: 1 }));
    const held = () => resource(profile, () => {});
    const both = collect([data, live]);
    const mixed = collect([data, action]);

    const tree = renderUnmounted(controller.controller, () => {
      // @ts-expect-error -- A function.
      useResource(pipe([action]));
      // @ts-expect-error -- A function, nested.
      useResource(pipe([nested]));
      // @ts-expect-error -- A symbol key.
      useResource(pipe([branded]));
      // @ts-expect-error -- A function, collected.
      useResource(mixed);
      // Wrapped outputs are judged by what they read as.
      useResource(pipe([live]));
      useResource(pipe([held]));
      useResource(both);
      return useResource(pipe([data]));
    });

    await settle();
    expect(tree.result()?.name).toBe('stream');
    tree.unmount();
  });

  it('computes again on mount without suspending', async () => {
    await using controller = createTestController();
    const [count, setCount] = createSignal(1);
    const observe = vi.fn(() => reactive(count));
    const Count = (props: { read: () => number | undefined }) => (
      <p>count {props.read()}</p>
    );

    let read!: Resource<number>;
    const tree = renderUnmounted(
      controller.controller,
      () => (read = useResource(pipe([observe]))),
      (Probe) => (
        <Suspense fallback={<p>loading</p>}>
          <Probe />
          <Count read={() => read()} />
        </Suspense>
      ),
    );

    await settle();
    expect(screen.getByText('count 1')).toBeInTheDocument();

    tree.mount();

    expect(tree.result.state).toBe('refreshing');
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
    expect(screen.getByText('count 1')).toBeInTheDocument();

    await settle();
    setCount(2);

    expect(tree.result.state).toBe('ready');
    expect(screen.getByText('count 2')).toBeInTheDocument();
    tree.unmount();
  });

  it('releases the flow on cleanup', async () => {
    await using controller = createTestController();
    const dispose = vi.fn();
    const open = () => resource('stream', dispose);

    const tree = renderUnmounted(controller.controller, () =>
      useResource(pipe([open])),
    );

    await settle();
    tree.unmount();
    await settle();

    expect(dispose).toHaveBeenCalledOnce();
    expect(controller.manager.handles.size).toBe(0);
  });
});
