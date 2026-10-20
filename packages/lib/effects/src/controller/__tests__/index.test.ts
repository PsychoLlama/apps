import { pipe } from '../../combinators';
import { DEFAULT_CONTROLLER } from '../default';
import { acquire, compute, inspect, release } from '../index';

describe('controller entry point', () => {
  it('exposes the default controller as plain functions', async () => {
    const one = () => 1;
    const double = (value: number) => value * 2;
    const handle = acquire(pipe([one, double]));

    expect(compute(handle)).toEqual({ type: 'sync', value: [2] });
    expect(inspect(handle, handle.output)).toMatchObject({ outputs: [2] });
    expect(DEFAULT_CONTROLLER.inspect(handle, handle.output)).toBe(
      inspect(handle, handle.output),
    );

    await release(handle);
    expect(inspect(handle, handle.output)).toEqual({ step: 'pending' });
  });
});
