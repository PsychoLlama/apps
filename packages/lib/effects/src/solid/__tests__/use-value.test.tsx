import { render, screen } from '@solidjs/testing-library';
import {
  createSignal,
  ErrorBoundary,
  type Accessor,
  type Component,
} from 'solid-js';
import { collect, pipe } from '../../combinators';
import { reactive, resource } from '../../task';
import { createTestController } from '../../testing';
import type { Controller } from '../../controller/controller';
import { EffectsContext } from '../context';
import { useValue } from '../use-value';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Run `setup` as a component's body and hand back what it returned, with
 * whatever its error boundary caught. `view` renders from the result.
 */
const renderHook = <Result,>(
  controller: Controller,
  setup: () => Result,
  View: Component<{ result: Result }> = () => null,
) => {
  const [mounted] = createSignal(true);
  const errors: unknown[] = [];

  let result!: Result;
  const Probe = () => {
    result = setup();
    return <View result={result} />;
  };

  const { unmount } = render(() => (
    <EffectsContext.Provider value={{ controller, mounted }}>
      <ErrorBoundary
        fallback={(error) => {
          errors.push(error);
          return null;
        }}
      >
        <Probe />
      </ErrorBoundary>
    </EffectsContext.Provider>
  ));

  return { result, errors, unmount };
};

describe('useValue', () => {
  it('computes during render', async () => {
    await using controller = createTestController();
    const load = vi.fn(() => 1);
    const double = (value: number) => value * 2;

    const tree = renderHook(controller.controller, () =>
      useValue(pipe([load, double])),
    );

    expectTypeOf(tree.result).toEqualTypeOf<Accessor<number>>();
    expect(tree.result()).toBe(2);
    expect(load).toHaveBeenCalledOnce();
    tree.unmount();
  });

  it('reads reactive state through, tracked', async () => {
    await using controller = createTestController();
    const [count, setCount] = createSignal(1);
    const observe = () => reactive(count);

    const tree = renderHook(
      controller.controller,
      () => useValue(pipe([observe])),
      (props) => <p>count {props.result()}</p>,
    );

    expect(screen.getByText('count 1')).toBeInTheDocument();

    setCount(2);

    expect(screen.getByText('count 2')).toBeInTheDocument();
    tree.unmount();
  });

  it('reads resources and collected outputs through', async () => {
    await using controller = createTestController();
    const open = () => resource('stream', () => {});
    const live = () => reactive(() => true);

    const tree = renderHook(controller.controller, () =>
      useValue(collect([open, live], (stream, state) => [stream, state()])),
    );

    expectTypeOf(tree.result).toEqualTypeOf<Accessor<(string | boolean)[]>>();
    expect(tree.result()).toEqual(['stream', true]);
    tree.unmount();
  });

  it('takes only synchronous plans', async () => {
    await using controller = createTestController();
    const later = async () => 1;
    const closing = () => resource(1, async () => {});

    const tree = renderHook(controller.controller, () => {
      // @ts-expect-error -- Returns a promise.
      expect(() => useValue(pipe([later]))).toThrow(/synchronous/);
      const illegal = () => {
        // @ts-expect-error -- Cleans up asynchronously.
        useValue(pipe([closing]));
      };
      void illegal;
      return useValue(pipe([() => 1]));
    });

    expect(tree.result()).toBe(1);
    tree.unmount();
    await settle();
  });

  it('throws failures to the error boundary', async () => {
    await using controller = createTestController();
    const failure = new Error('nope');
    const fail = (): number => {
      throw failure;
    };

    const tree = renderHook(controller.controller, () =>
      useValue(pipe([fail])),
    );

    expect(tree.errors).toHaveLength(1);
    expect((tree.errors[0] as AggregateError).errors).toEqual([failure]);
    tree.unmount();
  });

  it('releases the plan on cleanup', async () => {
    await using controller = createTestController();
    const dispose = vi.fn<() => void>();
    const open = () => resource('stream', dispose);

    const tree = renderHook(controller.controller, () =>
      useValue(pipe([open])),
    );

    tree.unmount();
    await settle();

    expect(dispose).toHaveBeenCalledOnce();
    expect(controller.manager.handles.size).toBe(0);
  });
});
