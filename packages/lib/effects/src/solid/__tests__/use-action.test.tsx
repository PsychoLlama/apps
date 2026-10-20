import { render } from '@solidjs/testing-library';
import { createSignal, ErrorBoundary } from 'solid-js';
import { pipe } from '../../combinators';
import { reactive, resource } from '../../task';
import { createTestController } from '../../testing';
import type { Controller } from '../../controller/controller';
import { EffectsContext } from '../context';
import { useAction, type Action } from '../use-action';

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

    expectTypeOf(measure).toEqualTypeOf<Action<[name: string], number>>();
    expect(load).not.toHaveBeenCalled();

    measure('stream');
    await settle();

    expect(load).toHaveBeenCalledOnce();
    expect(measure.latest).toBe(6);
    unmount();
  });

  it('calls straight through once computed', async () => {
    await using controller = createTestController();
    const send = vi.fn();

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([() => send])),
    );

    action('first');
    await settle();
    action('second');

    expect(send).toHaveBeenLastCalledWith('second');
    await settle();
    unmount();
  });

  it('is pending until its calls settle', async () => {
    await using controller = createTestController();
    const gate = Promise.withResolvers<number>();
    const scale = (factor: number) => (value: number) => value * factor;

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([() => gate.promise, scale])),
    );

    expect(action.pending).toBe(false);
    action(2);
    expect(action.pending).toBe(true);

    gate.resolve(3);
    await settle();

    expect(action.pending).toBe(false);
    expect(action.latest).toBe(6);
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

    action('loud');
    await settle();

    expect(action.latest).toBe('LOUD');
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

  it('reports what the action throws', async () => {
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

    action();
    await settle();

    expect(action.error).toBe(failure);
    expect(action.pending).toBe(false);
    expect(errors).toEqual([failure]);
    unmount();
  });

  it('reports when the flow fails', async () => {
    await using controller = createTestController();
    const fail = (): (() => void) => {
      throw new Error('nope');
    };

    const {
      result: action,
      errors,
      unmount,
    } = renderHook(controller.controller, () => useAction(pipe([fail])));

    action();
    await settle();

    expect(action.error).toBeInstanceOf(Error);
    expect(errors).toEqual([action.error]);
    unmount();
  });

  it('keeps the latest value through a failure', async () => {
    await using controller = createTestController();
    const failure = new Error('nope');
    const check = () => (ok: boolean) => {
      if (!ok) throw failure;
      return ok;
    };

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([check])),
    );

    action(true);
    await settle();
    expect(action.latest).toBe(true);
    expect(action.error).toBeUndefined();

    action(false);
    await settle();
    expect(action.error).toBe(failure);
    expect(action.latest).toBe(true);
    unmount();
  });

  it('refuses calls after unmount', async () => {
    await using controller = createTestController();
    const send = vi.fn();

    const { result: action, unmount } = renderHook(controller.controller, () =>
      useAction(pipe([() => send])),
    );

    action('mounted');
    await settle();
    unmount();
    await settle();

    action('unmounted');
    await settle();

    expect(action.error).toBeInstanceOf(Error);
    expect(String(action.error)).toMatch(/released/);
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

    action();
    unmount();
    await settle();
    expect(dispose).not.toHaveBeenCalled();

    gate.resolve('done');
    await settle();

    expect(action.latest).toBe('done');
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

    action();
    await settle();
    unmount();
    await settle();

    expect(dispose).toHaveBeenCalledOnce();
    expect(controller.manager.handles.size).toBe(0);
  });
});
