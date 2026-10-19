import { createCache, drop, insert, intern, lookup, remove } from '../cache';

const task = () => 1;
const other = () => 2;

describe('cache', () => {
  describe('entries', () => {
    it('stores and retrieves by kind, node, and input tuple', () => {
      const cache = createCache<string>();
      const inputs = [1];

      expect(lookup(cache, 'task', task, inputs)).toBeUndefined();
      insert(cache, 'task', task, inputs, 'value');

      expect(lookup(cache, 'task', task, inputs)).toBe('value');
      expect(lookup(cache, 'task', other, inputs)).toBeUndefined();
      expect(lookup(cache, 'join', task, inputs)).toBeUndefined();
    });

    it('keys by tuple identity, not contents', () => {
      const cache = createCache<string>();
      insert(cache, 'task', task, [1], 'first');

      expect(lookup(cache, 'task', task, [1])).toBeUndefined();
    });

    it('drops a node once its last value is removed', () => {
      const cache = createCache<string>();
      const first = [1];
      const second = [2];
      insert(cache, 'task', task, first, 'first');
      insert(cache, 'task', task, second, 'second');

      remove(cache, 'task', task, first);
      expect(lookup(cache, 'task', task, first)).toBeUndefined();
      expect(lookup(cache, 'task', task, second)).toBe('second');

      remove(cache, 'task', task, second);
      expect(cache.entries.task.has(task)).toBe(false);
    });

    it('tolerates removing values that do not exist', () => {
      const cache = createCache<string>();
      const inputs = [1];
      insert(cache, 'task', task, inputs, 'value');

      expect(() => remove(cache, 'task', other, inputs)).not.toThrow();
      expect(() => remove(cache, 'task', task, [1])).not.toThrow();
      expect(lookup(cache, 'task', task, inputs)).toBe('value');
    });
  });

  describe('interned', () => {
    it('shares one tuple across equal values', () => {
      const cache = createCache();
      const tuple = intern(cache, 1);

      expect(tuple).toEqual([1]);
      expect(intern(cache, 1)).toBe(tuple);
      expect(intern(cache, 2)).not.toBe(tuple);
    });

    it('compares with SameValueZero', () => {
      const cache = createCache();

      expect(intern(cache, Number.NaN)).toBe(intern(cache, Number.NaN));
      expect(intern(cache, { a: 1 })).not.toBe(intern(cache, { a: 1 }));
    });

    it('keeps the tuple until its last reference is dropped', () => {
      const cache = createCache();
      const tuple = intern(cache, 1);
      intern(cache, 1);

      drop(cache, 1);
      expect(intern(cache, 1)).toBe(tuple);

      drop(cache, 1);
      drop(cache, 1);
      expect(cache.interned.has(1)).toBe(false);
      expect(intern(cache, 1)).not.toBe(tuple);
    });

    it('tolerates dropping values never interned', () => {
      const cache = createCache();

      expect(() => drop(cache, 1)).not.toThrow();
    });
  });
});
