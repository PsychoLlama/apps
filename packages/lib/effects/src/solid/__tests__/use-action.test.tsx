import { render } from '@solidjs/testing-library';
import { createSignal, ErrorBoundary } from 'solid-js';
import { pipe } from '../../combinators';
import { reactive, resource } from '../../task';
import { createTestController } from '../../testing';
import type { Controller } from '../../controller/controller';
import { EffectsContext } from '../context';
import { useAction } from '../use-action';

/** Let queued microtasks run. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/**
 * Run `setup` as a component's body and hand back what it returned, with
 * whatever its error boundary caught.
 */
const renderHook = <Result,>(controller: Controller, setup: () => Result) => {
  const [mounted] = createSignal(true);
  const errors: unknown[] = [];

  let result!: Result;
  const Probe = () => {
    result = setup();
    return null;
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

describe('useAction', () => {
  it('computes on the first call', async () => {
    await using controller = createTestController();
    const load = vi.fn(() => (name: string) => name.length);

    const { result: measure, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([load])),
    );

    expectTypeOf(measure).toEqualTypeOf<(name: string) => Promise<number>>();
    expect(load).not.toHaveBeenCalled();

    await expect(measure('stream')).resolves.toBe(6);
    expect(load).toHaveBeenCalledOnce();
    unmount();
  });

  it('calls straight through once computed', async () => {
    await using controller = createTestController();
    const send = vi.fn();

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([() => send])),
    );

    await action('first');
    const second = action('second');

    expect(send).toHaveBeenLastCalledWith('second');
    await second;
    unmount();
  });

  it('waits on async dependencies', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();
    const scale = (factor: number) => (value: number) => value * factor;

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([() => gate.promise, scale])),
    );

    const pending = action(2);
    gate.resolve(3);

    await expect(pending).resolves.toBe(6);
    unmount();
  });

  it('unwraps resources', async () => {
    await using controller = createTestController();
    const open = () =>
      resource(
        (text: string) => text.toUpperCase(),
        () => {},
      );

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([open])),
    );

    await expect(action('loud')).resolves.toBe('LOUD');
    unmount();
  });

  it('takes only function outputs', async () => {
    await using controller = createTestController();
    const data = () => ({ name: 'stream' });
    const live = () => reactive(() => 1);

    const { unmount } = renderHook(controller.controller, () => {
      // @ts-expect-error -- Not a function.
      useAction(pipe([data]));
      // Downstream tasks receive a reactive output as its accessor.
      return useAction(pipe([live]));
    });

    unmount();
  });

  it('rejects with what the action throws', async () => {
    await using controller = createTestController();
    const failure = new Error('nope');
    const fail = () => () => {
      throw failure;
    };

    const {
      result: action,
      errors,
      unmount,
    } = renderHook(controller.controller, () => useAction(pipe([fail])));

    await expect(action()).rejects.toBe(failure);
    expect(errors).toEqual([failure]);
    unmount();
  });

  it('reaches the error boundary when not awaited', async () => {
    await using controller = createTestController();
    const failure = new Error('nope');
    const fail = () => async () => {
      throw failure;
    };

    const {
      result: action,
      errors,
      unmount,
    } = renderHook(controller.controller, () => useAction(pipe([fail])));

    void action();
    await settle();

    expect(errors).toEqual([failure]);
    unmount();
  });

  it('rejects when the flow fails', async () => {
    await using controller = createTestController();
    const failure = new Error('nope');
    const fail = (): (() => void) => {
      throw failure;
    };

    const {
      result: action,
      errors,
      unmount,
    } = renderHook(controller.controller, () => useAction(pipe([fail])));

    await expect(action()).rejects.toThrow();
    expect(errors).toHaveLength(1);
    unmount();
  });

  it('rejects after unmount', async () => {
    await using controller = createTestController();
    const send = vi.fn();

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([() => send])),
    );

    await action('mounted');
    unmount();
    await settle();

    await expect(action('unmounted')).rejects.toThrow(/released/);
    expect(send).not.toHaveBeenCalledWith('unmounted');
  });

  it('holds the flow until calls settle', async () => {
    await using controller = createTestController();
    const dispose = vi.fn();
    const gate = Promise.withResolvers<string>();
    const open = () => resource(() => gate.promise, dispose);

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([open])),
    );

    const pending = action();
    unmount();
    await settle();
    expect(dispose).not.toHaveBeenCalled();

    gate.resolve('done');
    await expect(pending).resolves.toBe('done');
    await settle();

    expect(dispose).toHaveBeenCalledOnce();
    expect(controller.manager.handles.size).toBe(0);
  });

  it('releases the flow on cleanup', async () => {
    await using controller = createTestController();
    const dispose = vi.fn();
    const open = () => resource(() => {}, dispose);

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([open])),
    );

    await action();
    unmount();
    await settle();

    expect(dispose).toHaveBeenCalledOnce();
    expect(controller.manager.handles.size).toBe(0);
  });
});
