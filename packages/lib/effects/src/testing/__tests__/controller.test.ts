import { concurrent, pipe } from '../../combinators';
import { resource } from '../../task';
import { createTestController } from '../controller';

describe('createTestController', () => {
  it('runs a flow and returns its typed outputs', async () => {
    await using controller = createTestController();
    const one = () => 1;
    const two = () => 'two';

    const outputs = await controller.run(concurrent([one, two]));

    expectTypeOf(outputs).toEqualTypeOf<[number, string]>();
    expect(outputs).toEqual([1, 'two']);
  });

  it('rejects when the flow fails', async () => {
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
});
