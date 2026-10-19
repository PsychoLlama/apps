import { render, screen } from '@solidjs/testing-library';
import {
  createEffect,
  createSignal,
  ErrorBoundary,
  Show,
  type Component,
  type Resource,
} from 'solid-js';
import { collect, concurrent, pipe } from '../../combinators';
import { reactive, resource } from '../../task';
import { createTestController } from '../../testing';
import type { Controller } from '../../controller/controller';
import { EffectsContext } from '../context';
import { useFlow } from '../use-flow';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Run `setup` as a component's body, under a context whose `mounted` flag
 * the test flips by hand. `wrap` places the probe, which it must render
 * itself so the probe is owned by whatever it's placed in.
 */
const renderUnmounted = <Result,>(
  controller: Controller,
  setup: () => Result,
  wrap = (Probe: Component) => <Probe />,
) => {
  const [mounted, setMounted] = createSignal(false);
  const effects = { controller, mounted };

  let result!: Result;
  const Probe = () => {
    result = setup();
    return null;
  };

  const { unmount } = render(() => (
    <EffectsContext.Provider value={effects}>
      {wrap(Probe)}
    </EffectsContext.Provider>
  ));

  return { result, mount: () => setMounted(true), unmount };
};

describe('useFlow', () => {
  it('computes on mount and resolves to the final output', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();
    const load = vi.fn(() => gate.promise);
    const double = (value: number) => value * 2;

    const tree = renderUnmounted(controller.controller, () =>
      useFlow(pipe([load, double])),
    );

    expectTypeOf(tree.result).toEqualTypeOf<Resource<number>>();
    expect(tree.result.state).toBe('unresolved');
    expect(load).not.toHaveBeenCalled();

    tree.mount();

    expect(tree.result.state).toBe('pending');
    expect(load).toHaveBeenCalledOnce();

    gate.resolve(1);
    await settle();

    expect(tree.result.state).toBe('ready');
    expect(tree.result()).toBe(2);
    tree.unmount();
  });

  it('takes one output; several join through `collect`', async () => {
    await using controller = createTestController();
    const one = () => 1;
    const two = () => 'two';

    const tree = renderUnmounted(controller.controller, () => {
      // @ts-expect-error -- Two outputs.
      useFlow(concurrent([one, two]));
      return useFlow(collect([one, two]));
    });

    tree.mount();
    await settle();

    expectTypeOf(tree.result).toEqualTypeOf<Resource<[number, string]>>();
    expect(tree.result()).toEqual([1, 'two']);
    tree.unmount();
  });

  it('reads a resource as its value', async () => {
    await using controller = createTestController();
    const open = () => resource('stream', () => {});

    const tree = renderUnmounted(controller.controller, () =>
      useFlow(pipe([open])),
    );

    tree.mount();
    await settle();

    expectTypeOf(tree.result).toEqualTypeOf<Resource<string>>();
    expect(tree.result()).toBe('stream');
    expect(tree.result.latest).toBe('stream');
    expect(tree.result.loading).toBe(false);
    expect(tree.result.error).toBeUndefined();
    tree.unmount();
  });

  it('reads reactive state through, tracked', async () => {
    await using controller = createTestController();
    const [muted, setMuted] = createSignal(false);
    const observe = () => reactive(muted);
    const seen = vi.fn();

    const tree = renderUnmounted(controller.controller, () => {
      const output = useFlow(pipe([observe]));
      createEffect(() => {
        seen(output());
      });
      return output;
    });

    tree.mount();
    await settle();

    expectTypeOf(tree.result).toEqualTypeOf<Resource<boolean>>();
    expect(tree.result()).toBe(false);

    setMuted(true);

    expect(tree.result()).toBe(true);
    expect(seen).toHaveBeenLastCalledWith(true);
    tree.unmount();
  });

  it('reduces every item of a collected output', async () => {
    await using controller = createTestController();
    const [muted] = createSignal(true);
    const open = () => resource('stream', () => {});
    const observe = () => reactive(muted);

    const tree = renderUnmounted(controller.controller, () =>
      useFlow(collect([open, observe, collect([() => 1, observe])])),
    );

    tree.mount();
    await settle();

    expectTypeOf(tree.result).toEqualTypeOf<
      Resource<[string, boolean, [number, boolean]]>
    >();
    expect(tree.result()).toEqual(['stream', true, [1, true]]);
    tree.unmount();
  });

  it('leaves functions returned by tasks alone', async () => {
    await using controller = createTestController();
    const format = (value: number) => `#${value}`;

    const tree = renderUnmounted(controller.controller, () =>
      useFlow(pipe([() => format])),
    );

    tree.mount();
    await settle();

    expect(tree.result()).toBe(format);
    tree.unmount();
  });

  it('throws failures to the nearest error boundary', async () => {
    await using controller = createTestController();
    const failure = new Error('nope');
    const fail = () => Promise.reject(failure);
    const caught = vi.fn();

    const tree = renderUnmounted(
      controller.controller,
      () => {
        const output = useFlow(pipe([fail]));
        // Read it so the failure has somewhere to throw.
        createEffect(output);
      },
      (Probe) => (
        // Solid only passes the error to a fallback that declares it.
        <ErrorBoundary
          fallback={(error: unknown) => {
            caught(error);
            return <p>failed</p>;
          }}
        >
          <Probe />
        </ErrorBoundary>
      ),
    );

    tree.mount();

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(caught).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ errors: [failure] }),
    );
    tree.unmount();
  });

  it('releases the flow on cleanup', async () => {
    await using controller = createTestController();
    const dispose = vi.fn();
    const open = () => resource('stream', dispose);

    const tree = renderUnmounted(controller.controller, () =>
      useFlow(pipe([open])),
    );

    tree.mount();
    await settle();
    expect(dispose).not.toHaveBeenCalled();

    tree.unmount();
    await settle();

    expect(dispose).toHaveBeenCalledOnce();
    expect(controller.manager.handles.size).toBe(0);
  });

  it('throws cleanup failures to the error boundary that outlives it', async () => {
    await using controller = createTestController();
    const failure = new Error('stuck');
    const open = () =>
      resource('stream', () => {
        throw failure;
      });
    const [shown, setShown] = createSignal(true);
    const caught = vi.fn();

    const tree = renderUnmounted(
      controller.controller,
      () => useFlow(pipe([open])),
      (Probe) => (
        // Solid only passes the error to a fallback that declares it.
        <ErrorBoundary
          fallback={(error: unknown) => {
            caught(error);
            return <p>failed</p>;
          }}
        >
          <Show when={shown()}>
            <Probe />
          </Show>
        </ErrorBoundary>
      ),
    );

    tree.mount();
    await settle();
    setShown(false);

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(caught).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ errors: [failure] }),
    );
    tree.unmount();
  });

  it('never runs when cleaned up before mount', async () => {
    await using controller = createTestController();
    const open = vi.fn(() => 1);

    const tree = renderUnmounted(controller.controller, () =>
      useFlow(pipe([open])),
    );

    tree.unmount();
    tree.mount();
    await settle();

    expect(open).not.toHaveBeenCalled();
  });
});
