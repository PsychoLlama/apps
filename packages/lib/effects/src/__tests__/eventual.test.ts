import {
  all,
  chain,
  from,
  lastly,
  later,
  now,
  rescue,
  sequence,
  toPromise,
} from '../eventual';

describe('eventual', () => {
  it('tells a promise from a value', () => {
    expect(from(1)).toEqual({ type: 'sync', value: 1 });
    expect(from(Promise.resolve(1)).type).toBe('async');
  });

  it('chains synchronously until something waits', async () => {
    const double = (value: number) => now(value * 2);

    expect(chain(now(1), double)).toEqual({ type: 'sync', value: 2 });

    const waited = chain(later(Promise.resolve(1)), double);
    assert(waited.type === 'async');
    await expect(waited.value).resolves.toBe(2);
  });

  it('throws from a synchronous chain, and rejects from one that waits', async () => {
    const fail = () => {
      throw new Error('nope');
    };

    expect(() => chain(now(1), fail)).toThrow('nope');
    await expect(
      toPromise(chain(later(Promise.resolve(1)), fail)),
    ).rejects.toThrow('nope');
  });

  it('gathers values, waiting only if one does', async () => {
    expect(all([now(1), now(2)])).toEqual({ type: 'sync', value: [1, 2] });

    const waited = all([now(1), later(Promise.resolve(2))]);
    assert(waited.type === 'async');
    await expect(waited.value).resolves.toEqual([1, 2]);
  });

  it('runs steps in order, switching to waiting partway', async () => {
    const order: number[] = [];
    const step = (item: number) => {
      order.push(item);
      return item === 2 ? later(Promise.resolve(item)) : now(item);
    };

    const result = sequence([1, 2, 3], step);
    expect(order).toEqual([1, 2]);

    await expect(toPromise(result)).resolves.toEqual([1, 2, 3]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('cleans up after a step, synchronous or not', async () => {
    const cleanup = vi.fn();

    lastly(() => now(1), cleanup);
    expect(cleanup).toHaveBeenCalledOnce();

    expect(() =>
      lastly(() => {
        throw new Error('nope');
      }, cleanup),
    ).toThrow('nope');
    expect(cleanup).toHaveBeenCalledTimes(2);

    const waited = lastly(() => later(Promise.resolve(1)), cleanup);
    expect(cleanup).toHaveBeenCalledTimes(2);
    await toPromise(waited);
    expect(cleanup).toHaveBeenCalledTimes(3);
  });

  it('hands failures to a handler, synchronous or not', async () => {
    const handle = vi.fn();
    const failure = new Error('nope');

    const thrown = rescue(() => {
      throw failure;
    }, handle);
    expect(thrown).toEqual({ type: 'sync', value: undefined });

    await toPromise(rescue(() => later(Promise.reject(failure)), handle));
    expect(handle.mock.calls).toEqual([[failure], [failure]]);
  });
});
