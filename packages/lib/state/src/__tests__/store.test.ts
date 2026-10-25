import { createComputed, createRoot } from 'solid-js';
import { pipe } from '@lib/effects';
import { createTestController } from '@lib/effects/testing';
import { defineStore } from '../store';

interface State {
  count: number;
}

describe('defineStore', () => {
  it('seeds the state from init', async () => {
    const $store = defineStore<State>(() => ({ count: 1 }));
    await using effects = createTestController();

    const store = await effects.run($store);

    expect(store.count).toBe(1);
  });

  it('shares one store per seed', async () => {
    const $store = defineStore((count: number) => ({ count }));
    await using effects = createTestController();

    const first = await effects.run(pipe([() => 1, $store]));
    const again = await effects.run(pipe([() => 1, $store]));
    const other = await effects.run(pipe([() => 2, $store]));

    expect(again).toBe(first);
    expect(other).not.toBe(first);
    expect(other.count).toBe(2);
  });

  it('starts fresh once released', async () => {
    const init = vi.fn(() => ({ count: 0 }));
    const $store = defineStore<State>(init);
    const effects = createTestController();
    await effects.run($store);

    await effects[Symbol.asyncDispose]();
    await using again = createTestController();
    await again.run($store);

    expect(init).toHaveBeenCalledTimes(2);
  });

  it('notifies readers of writes', async () => {
    const $store = defineStore<State>(() => ({ count: 0 }));
    await using effects = createTestController();
    const store = await effects.run($store);

    const seen: number[] = [];
    const dispose = createRoot((dispose) => {
      createComputed(() => seen.push(store.count));
      return dispose;
    });

    // Commits write through the same proxy, typed writable.
    (store as State).count = 1;
    dispose();

    expect(seen).toEqual([0, 1]);
  });
});
