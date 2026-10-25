import { render } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { collect, pipe } from '../../combinators';
import { useMounted, useValue } from '../../solid';
import { resource } from '../../task';
import { createTestController } from '../controller';

describe('createTestController', () => {
  it('runs a plan and returns what it yields, typed', async () => {
    await using controller = createTestController();
    const one = () => 1;
    const open = () => resource('two', () => {});

    const output = await controller.run(collect([one, open]));
    const stream = await controller.run(pipe([open]));

    expectTypeOf(output).toEqualTypeOf<[number, string]>();
    expect(output).toEqual([1, 'two']);
    expectTypeOf(stream).toEqualTypeOf<string>();
    expect(stream).toBe('two');
  });

  it('rejects when the plan fails', async () => {
    await using controller = createTestController();
    const fail = () => Promise.reject(new Error('nope'));

    await expect(controller.run(pipe([fail]))).rejects.toBeInstanceOf(
      AggregateError,
    );
  });

  it('releases every live handle on dispose', async () => {
    const dispose = vi.fn();
    const open = () => resource('stream', dispose);

    {
      await using controller = createTestController();
      await controller.run(pipe([open]));
      await controller.run(pipe([open]));
      expect(dispose).not.toHaveBeenCalled();
    }

    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('reports cleanups that threw on dispose', async () => {
    const open = () =>
      resource('stream', () => {
        throw new Error('close');
      });

    const scope = async () => {
      await using controller = createTestController();
      await controller.run(pipe([open]));
    };

    await expect(scope()).rejects.toSatisfy((failure: AggregateError) => {
      expect(failure.message).toBe('Teardown failed.');
      expect(failure.errors).toEqual([new Error('close')]);
      return true;
    });
  });

  it('counts live holds', async () => {
    await using controller = createTestController();
    expect(controller.holds).toBe(0);

    await controller.run(pipe([() => 1]));
    await controller.run(pipe([() => 2]));

    expect(controller.holds).toBe(2);
  });

  describe('use', () => {
    it('holds the plan for its scope', async () => {
      await using controller = createTestController();
      const dispose = vi.fn();
      const $stream = pipe([() => resource('stream', dispose)]);

      {
        await using compute = controller.use($stream);
        const stream = await compute();

        expectTypeOf(stream).toEqualTypeOf<string>();
        expect(stream).toBe('stream');
        expect(controller.holds).toBe(1);
        expect(dispose).not.toHaveBeenCalled();
      }

      expect(dispose).toHaveBeenCalledOnce();
      expect(controller.holds).toBe(0);
    });

    it('runs nothing until called', async () => {
      await using controller = createTestController();
      const load = vi.fn(() => 1);
      await using compute = controller.use(pipe([load]));

      expect(load).not.toHaveBeenCalled();
      await compute();
      await compute();
      expect(load).toHaveBeenCalledOnce();
    });

    it('abandons a compute still in flight when the scope ends', async () => {
      await using controller = createTestController();
      const { promise, resolve } = Promise.withResolvers<number>();

      let computed;
      {
        await using compute = controller.use(pipe([() => promise]));
        computed = compute();
      }

      resolve(1);
      await expect(computed).rejects.toThrow('released');
    });

    it('reports teardown of a late landing on dispose', async () => {
      const { promise, resolve } = Promise.withResolvers<void>();
      const open = async () => {
        await promise;
        return resource('stream', () => {
          throw new Error('close');
        });
      };

      const scope = async () => {
        await using controller = createTestController();
        await using compute = controller.use(pipe([open]));
        void compute().catch(() => {});
        // Lands after the hold's scope ends, but before the controller's.
        setTimeout(resolve);
      };

      await expect(scope()).rejects.toSatisfy((failure: AggregateError) => {
        expect(failure.errors).toEqual([new Error('close')]);
        return true;
      });
    });
  });

  describe('createRenderContext', () => {
    it('renders components against the controller', async () => {
      await using controller = createTestController();
      const Effects = controller.createRenderContext();
      const Probe = () => (
        <>
          {useValue(pipe([() => 'held']))()} {useMounted()() ? 'on' : 'off'}
        </>
      );

      const { container, unmount } = render(() => (
        <Effects>
          <Probe />
        </Effects>
      ));

      expect(container).toHaveTextContent('held on');
      expect(controller.holds).toBe(1);
      unmount();
      expect(controller.holds).toBe(0);
    });

    it('reads mount state from the given accessor', async () => {
      await using controller = createTestController();
      const [mounted, setMounted] = createSignal(false);
      const Effects = controller.createRenderContext({ mounted });
      const Probe = () => <>{useMounted()() ? 'on' : 'off'}</>;

      const { container, unmount } = render(() => (
        <Effects>
          <Probe />
        </Effects>
      ));

      expect(container).toHaveTextContent('off');
      setMounted(true);
      expect(container).toHaveTextContent('on');
      unmount();
    });
  });
});
