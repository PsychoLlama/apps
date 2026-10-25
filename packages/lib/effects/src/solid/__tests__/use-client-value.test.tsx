import { render, screen } from '@solidjs/testing-library';
import {
  createEffect,
  createRenderEffect,
  createSignal,
  ErrorBoundary,
  Show,
  Suspense,
  type Component,
} from 'solid-js';
import { collect, pipe } from '../../combinators';
import { reactive, resource } from '../../task';
import { createTestController, type TestController } from '../../testing';

import { useClientValue, type ClientValue } from '../use-client-value';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Run `setup` as a component's body, under a context whose `mounted` flag
 * the test flips by hand. `wrap` places the probe, which it must render
 * itself so the probe is owned by whatever it's placed in.
 */
const renderUnmounted = <Result,>(
  controller: TestController,
  setup: () => Result,
  wrap = (Probe: Component) => <Probe />,
) => {
  const [mounted, setMounted] = createSignal(false);
  const Effects = controller.createRenderContext({ mounted });

  let result!: Result;
  const Probe = () => {
    result = setup();
    return null;
  };

  const { unmount } = render(() => <Effects>{wrap(Probe)}</Effects>);

  return { result, mount: () => setMounted(true), unmount };
};

/** An error boundary that reports what it catches, for `wrap`. */
const catchInto = (caught: (error: unknown) => void, content: Component) => (
  // Solid only passes the error to a fallback that declares it.
  <ErrorBoundary
    fallback={(error: unknown) => {
      caught(error);
      return <p>failed</p>;
    }}
  >
    {content({})}
  </ErrorBoundary>
);

describe('useClientValue', () => {
  it('computes on mount and resolves to the final output', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();
    const load = vi.fn(() => gate.promise);
    const double = (value: number) => value * 2;

    const tree = renderUnmounted(controller, () =>
      useClientValue(pipe([load, double])),
    );

    expectTypeOf(tree.result).toEqualTypeOf<ClientValue<number | undefined>>();
    expect(tree.result.ready).toBe(false);
    expect(tree.result()).toBeUndefined();
    expect(load).not.toHaveBeenCalled();

    tree.mount();

    expect(tree.result.ready).toBe(false);
    expect(load).toHaveBeenCalledOnce();

    gate.resolve(1);
    await settle();

    expect(tree.result.ready).toBe(true);
    expect(tree.result()).toBe(2);
    tree.unmount();
  });

  it('is ready on mount when the output is already here', async () => {
    await using controller = createTestController();

    const tree = renderUnmounted(controller, () =>
      useClientValue(pipe([() => 1])),
    );

    tree.mount();

    expect(tree.result.ready).toBe(true);
    expect(tree.result()).toBe(1);
    tree.unmount();
  });

  it('reads the initial value until the plan resolves', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();

    const tree = renderUnmounted(controller, () =>
      useClientValue(pipe([() => gate.promise]), { initial: 'none' }),
    );

    expectTypeOf(tree.result).toEqualTypeOf<ClientValue<number | string>>();
    expect(tree.result()).toBe('none');

    tree.mount();
    expect(tree.result()).toBe('none');

    gate.resolve(1);
    await settle();

    expect(tree.result()).toBe(1);
    tree.unmount();
  });

  it('defaults the initial value to `undefined`', async () => {
    await using controller = createTestController();

    const tree = renderUnmounted(controller, () =>
      useClientValue(pipe([() => 1]), {}),
    );

    expectTypeOf(tree.result).toEqualTypeOf<ClientValue<number | undefined>>();
    expect(tree.result()).toBeUndefined();
    tree.unmount();
  });

  it('counts an output of `undefined` as resolved', async () => {
    await using controller = createTestController();

    const tree = renderUnmounted(controller, () =>
      useClientValue(pipe([() => undefined]), { initial: 'none' }),
    );

    tree.mount();
    await settle();

    expect(tree.result.ready).toBe(true);
    expect(tree.result()).toBeUndefined();
    tree.unmount();
  });

  it('tracks `ready` and the value', async () => {
    await using controller = createTestController();
    const seen = vi.fn();

    const tree = renderUnmounted(controller, () => {
      const output = useClientValue(pipe([() => 1]), { initial: 0 });
      createEffect(() => {
        seen(output.ready, output());
      });
      return output;
    });

    tree.mount();
    await settle();

    expect(seen.mock.calls).toEqual([
      [false, 0],
      [true, 1],
    ]);
    tree.unmount();
  });

  it('never suspends', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();

    const tree = renderUnmounted(
      controller,
      () => {
        const output = useClientValue(pipe([() => gate.promise]));
        // A render-phase read, which would suspend a resource.
        createRenderEffect(output);
      },
      (Probe) => (
        <Suspense fallback={<p>loading</p>}>
          <Probe />
          <p>content</p>
        </Suspense>
      ),
    );

    tree.mount();
    await settle();

    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.queryByText('loading')).not.toBeInTheDocument();
    gate.resolve(1);
    await settle();
    tree.unmount();
  });

  it('reads collected outputs as one array', async () => {
    await using controller = createTestController();
    const one = () => 1;
    const two = () => 'two';

    const tree = renderUnmounted(controller, () =>
      useClientValue(collect([one, two])),
    );

    tree.mount();
    await settle();

    expectTypeOf(tree.result).toEqualTypeOf<
      ClientValue<[number, string] | undefined>
    >();
    expect(tree.result()).toEqual([1, 'two']);
    tree.unmount();
  });

  it('reads a resource as its value', async () => {
    await using controller = createTestController();
    const open = () => resource('stream', () => {});

    const tree = renderUnmounted(controller, () =>
      useClientValue(pipe([open])),
    );

    tree.mount();
    await settle();

    expectTypeOf(tree.result).toEqualTypeOf<ClientValue<string | undefined>>();
    expect(tree.result()).toBe('stream');
    tree.unmount();
  });

  it('reads reactive state through, tracked', async () => {
    await using controller = createTestController();
    const [muted, setMuted] = createSignal(false);
    const observe = () => reactive(muted);
    const seen = vi.fn();

    const tree = renderUnmounted(controller, () => {
      const output = useClientValue(pipe([observe]));
      createEffect(() => {
        seen(output());
      });
      return output;
    });

    tree.mount();
    await settle();

    expectTypeOf(tree.result).toEqualTypeOf<ClientValue<boolean | undefined>>();
    expect(tree.result()).toBe(false);

    setMuted(true);

    expect(tree.result()).toBe(true);
    expect(seen).toHaveBeenLastCalledWith(true);
    tree.unmount();
  });

  it('leaves functions returned by tasks alone', async () => {
    await using controller = createTestController();
    const format = (value: number) => `#${value}`;

    const tree = renderUnmounted(controller, () =>
      useClientValue(pipe([() => format])),
    );

    tree.mount();
    await settle();

    expect(tree.result()).toBe(format);
    tree.unmount();
  });

  it('throws failures to the nearest error boundary, unread', async () => {
    await using controller = createTestController();
    const failure = new Error('nope');
    const fail = () => Promise.reject(failure);
    const caught = vi.fn();

    const tree = renderUnmounted(
      controller,
      () => useClientValue(pipe([fail])),
      (Probe) => catchInto(caught, Probe),
    );

    tree.mount();

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(caught).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ errors: [failure] }),
    );
    tree.unmount();
  });

  it('abandons a computation cut short by cleanup, quietly', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();
    const next = vi.fn((value: number) => value);
    const [shown, setShown] = createSignal(true);
    const caught = vi.fn();

    const tree = renderUnmounted(
      controller,
      () => useClientValue(pipe([() => gate.promise, next])),
      (Probe) =>
        catchInto(caught, () => (
          <Show when={shown()}>
            <Probe />
          </Show>
        )),
    );

    tree.mount();
    setShown(false);
    expect(controller.holds).toBe(0);

    gate.resolve(1);
    await settle();

    expect(next).not.toHaveBeenCalled();
    expect(caught).not.toHaveBeenCalled();
    tree.unmount();
  });

  it('throws failures that land after cleanup to the error boundary that outlives it', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();
    const failure = new Error('late');
    const [shown, setShown] = createSignal(true);
    const caught = vi.fn();

    const tree = renderUnmounted(
      controller,
      () => useClientValue(pipe([() => gate.promise])),
      (Probe) =>
        catchInto(caught, () => (
          <Show when={shown()}>
            <Probe />
          </Show>
        )),
    );

    tree.mount();
    setShown(false);
    gate.reject(failure);

    expect(await screen.findByText('failed')).toBeInTheDocument();
    expect(caught).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ errors: [failure] }),
    );
    tree.unmount();
  });

  it('releases the plan on cleanup', async () => {
    await using controller = createTestController();
    const dispose = vi.fn();
    const open = () => resource('stream', dispose);

    const tree = renderUnmounted(controller, () =>
      useClientValue(pipe([open])),
    );

    tree.mount();
    await settle();
    expect(dispose).not.toHaveBeenCalled();

    tree.unmount();
    await settle();

    expect(dispose).toHaveBeenCalledOnce();
    expect(controller.holds).toBe(0);
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
      controller,
      () => useClientValue(pipe([open])),
      (Probe) =>
        catchInto(caught, () => (
          <Show when={shown()}>
            <Probe />
          </Show>
        )),
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

    const tree = renderUnmounted(controller, () =>
      useClientValue(pipe([open])),
    );

    tree.unmount();
    tree.mount();
    await settle();

    expect(open).not.toHaveBeenCalled();
  });
});
