import { pipe } from '../../combinators';
import { source } from '../../source';
import { DEFAULT_CONTROLLER } from '../default';
import { acquire, compute, inspect, release, setSource } from '../index';

describe('controller entry point', () => {
  it('exposes the default controller as plain functions', async () => {
    const count = source(1);
    const double = (value: number) => value * 2;
    const handle = acquire(pipe([count, double]));

    await compute(handle);
    expect(inspect(handle, handle.outputs[0])).toMatchObject({ value: 2 });
    expect(DEFAULT_CONTROLLER.inspect(handle, handle.outputs[0])).toBe(
      inspect(handle, handle.outputs[0]),
    );

    await setSource(count, 2);
    expect(inspect(handle, handle.outputs[0])).toMatchObject({ value: 4 });

    await release(handle);
    expect(inspect(handle, handle.outputs[0])).toEqual({ step: 'pending' });
  });
});
