import { createCache, insert, lookup, remove } from '../cache';

const task = () => 1;
const other = () => 2;

describe('cache', () => {
  it('stores and retrieves by node and input tuple', () => {
    const cache = createCache<string>();
    const inputs = [1];

    expect(lookup(cache, task, inputs)).toBeUndefined();
    insert(cache, task, inputs, 'value');

    expect(lookup(cache, task, inputs)).toBe('value');
    expect(lookup(cache, other, inputs)).toBeUndefined();
  });

  it('keys by tuple identity, not contents', () => {
    const cache = createCache<string>();
    insert(cache, task, [1], 'first');

    expect(lookup(cache, task, [1])).toBeUndefined();
  });

  it('drops a node once its last value is removed', () => {
    const cache = createCache<string>();
    const first = [1];
    const second = [2];
    insert(cache, task, first, 'first');
    insert(cache, task, second, 'second');

    remove(cache, task, first);
    expect(lookup(cache, task, first)).toBeUndefined();
    expect(lookup(cache, task, second)).toBe('second');

    remove(cache, task, second);
    expect(cache.has(task)).toBe(false);
  });

  it('tolerates removing values that do not exist', () => {
    const cache = createCache<string>();
    const inputs = [1];
    insert(cache, task, inputs, 'value');

    expect(() => remove(cache, other, inputs)).not.toThrow();
    expect(() => remove(cache, task, [1])).not.toThrow();
    expect(lookup(cache, task, inputs)).toBe('value');
  });
});
