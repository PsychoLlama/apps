import { createCache, insert, lookup, remove } from '../cache';

const task = () => 1;
const other = () => 2;

describe('cache', () => {
  describe('entries', () => {
    it('stores and retrieves by kind, node, and input', () => {
      const cache = createCache<string>();
      const input = 1;

      expect(lookup(cache, 'task', task, input)).toBeUndefined();
      insert(cache, 'task', task, input, 'value');

      expect(lookup(cache, 'task', task, input)).toBe('value');
      expect(lookup(cache, 'task', other, input)).toBeUndefined();
      expect(lookup(cache, 'join', task, input)).toBeUndefined();
    });

    it('keys by value with SameValueZero', () => {
      const cache = createCache<string>();
      insert(cache, 'task', task, Number.NaN, 'nan');
      insert(cache, 'task', task, 0, 'zero');
      insert(cache, 'task', task, { a: 1 }, 'object');

      expect(lookup(cache, 'task', task, Number.NaN)).toBe('nan');
      expect(lookup(cache, 'task', task, -0)).toBe('zero');
      expect(lookup(cache, 'task', task, { a: 1 })).toBeUndefined();
    });

    it('drops a node once its last value is removed', () => {
      const cache = createCache<string>();
      const first = 1;
      const second = 2;
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
      const input = 1;
      insert(cache, 'task', task, input, 'value');

      expect(() => remove(cache, 'task', other, input)).not.toThrow();
      expect(() => remove(cache, 'task', task, 2)).not.toThrow();
      expect(lookup(cache, 'task', task, input)).toBe('value');
    });
  });
});
