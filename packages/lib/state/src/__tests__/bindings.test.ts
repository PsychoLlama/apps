import { defineAction } from '../action';
import {
  createStore,
  createTestBindings,
  destroyStore,
  useAction as globalUseAction,
  useEffect as globalUseEffect,
  useStore as globalUseStore,
} from '../bindings';
import { defineEffect } from '../effect';
import { defineStore } from '../store';

interface Counter {
  count: number;
}

const counterStore = defineStore<Counter>(() => ({ count: 0 }));

const increment = defineAction([counterStore], (counter) => {
  counter.count += 1;
});

describe('createTestBindings', () => {
  it('returns helpers bound to a fresh registry', () => {
    const bound = createTestBindings();
    const counter = bound.createStore(counterStore);
    expect(counter.count).toBe(0);

    bound.useAction(increment)();
    expect(counter.count).toBe(1);
  });

  it('isolates state across calls', () => {
    const first = createTestBindings();
    const second = createTestBindings();
    const counterA = first.createStore(counterStore);
    const counterB = second.createStore(counterStore);

    first.useAction(increment)();
    expect(counterA.count).toBe(1);
    expect(counterB.count).toBe(0);
  });

  it('wraps perform for async effects', async () => {
    const { useEffect } = createTestBindings();

    const effect = defineEffect([], (value: number): Promise<number> =>
      Promise.resolve(value * 2),
    );
    await expect(useEffect(effect)(3)).resolves.toBeUndefined();
  });

  it('wraps perform for sync effects', () => {
    const { useEffect } = createTestBindings();

    const fn = (value: number): number => value + 1;
    const effect = defineEffect([], fn);
    const result: void = useEffect(effect)(1);
    expect(result).toBeUndefined();
  });

  it('exposes raw invoke and perform', async () => {
    const bound = createTestBindings();
    const counter = bound.createStore(counterStore);

    bound.invoke(increment);
    expect(counter.count).toBe(1);

    const effect = defineEffect([], (value: number): Promise<number> =>
      Promise.resolve(value),
    );
    await expect(bound.perform(effect, 5)).resolves.toBeUndefined();
  });
});

describe('module-level bindings (global registry)', () => {
  it('read and mutate the global registry', () => {
    const oneOff = defineStore<Counter>(() => ({ count: 0 }));
    const bumpOneOff = defineAction([oneOff], (counter) => {
      counter.count += 2;
    });

    createStore(oneOff);
    try {
      const counter = globalUseStore(oneOff);
      expect(counter.count).toBe(0);
      globalUseAction(bumpOneOff)();
      expect(counter.count).toBe(2);
    } finally {
      destroyStore(oneOff);
    }
  });

  it('exposes useEffect bound to the global registry', async () => {
    const oneOff = defineStore<Counter>(() => ({ count: 0 }));
    createStore(oneOff);
    try {
      const effect = defineEffect([], (value: number): Promise<number> =>
        Promise.resolve(value),
      );
      await expect(globalUseEffect(effect)(1)).resolves.toBeUndefined();
    } finally {
      destroyStore(oneOff);
    }
  });
});
