import { pipe } from '../../combinators';
import { DEFAULT_CONTROLLER } from '../default';
import { acquire, compute, inspect, release } from '../index';

describe('controller entry point', () => {
  it('exposes the default controller as plain functions', async () => {
    const one = () => 1;
    const double = (value: number) => value * 2;
    const handle = acquire(pipe([one, double]));

    await compute(handle);
    expect(inspect(handle, handle.outputs[0])).toMatchObject({ value: 2 });
    expect(DEFAULT_CONTROLLER.inspect(handle, handle.outputs[0])).toBe(
      inspect(handle, handle.outputs[0]),
    );

    await release(handle);
    expect(inspect(handle, handle.outputs[0])).toEqual({ step: 'pending' });
  });
});
