import { createCache, insert, lookup, remove } from '../cache';

const task = () => 1;
const other = () => 2;

describe('cache', () => {
  it('stores and retrieves by task and inputs', () => {
    const cache = createCache<string>();
    const key = {};

    expect(lookup(cache, task, [key, 1])).toBeUndefined();
    insert(cache, task, [key, 1], 'value');
    expect(lookup(cache, task, [key, 1])).toBe('value');
    expect(lookup(cache, task, [key])).toBeUndefined();
    expect(lookup(cache, task, [key, 1, 2])).toBeUndefined();
  });

  it('keys by input identity', () => {
    const cache = createCache<string>();
    insert(cache, task, [{ video: true }], 'first');

    expect(lookup(cache, task, [{ video: true }])).toBeUndefined();
    expect(lookup(cache, other, [])).toBeUndefined();
  });

  it('deletes values and the branches left empty', () => {
    const cache = createCache<string>();
    insert(cache, task, ['a'], 'shared');
    insert(cache, task, ['a', 'b', 'c'], 'deep');

    remove(cache, task, ['a', 'b', 'c']);
    expect(lookup(cache, task, ['a', 'b', 'c'])).toBeUndefined();
    expect(lookup(cache, task, ['a'])).toBe('shared');

    remove(cache, task, ['a']);
    expect(lookup(cache, task, ['a'])).toBeUndefined();
  });

  it('keeps the root while its zero-input value is alive', () => {
    const cache = createCache<string>();
    insert(cache, task, [], 'bare');
    insert(cache, task, ['a'], 'deep');

    remove(cache, task, ['a']);

    expect(lookup(cache, task, [])).toBe('bare');
  });

  it('tolerates deleting paths that do not exist', () => {
    const cache = createCache<string>();
    insert(cache, task, ['a'], 'value');

    expect(() => remove(cache, other, [])).not.toThrow();
    expect(() => remove(cache, task, ['z'])).not.toThrow();
    expect(() => remove(cache, task, ['a', 'z'])).not.toThrow();
    expect(lookup(cache, task, ['a'])).toBe('value');
  });
});
