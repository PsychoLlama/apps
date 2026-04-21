import { defineAction } from '../action';
import {
  bindRegistry,
  createStore,
  destroyStore,
  useAction as globalUseAction,
  useEffect as globalUseEffect,
  useStore as globalUseStore,
} from '../bindings';
import { defineEffect } from '../effect';
import { createRegistry } from '../registry';
import { defineStore } from '../store';

interface Counter {
  count: number;
}

const counterStore = defineStore<Counter>(() => ({ count: 0 }));

const increment = defineAction([counterStore], (counter) => {
  counter.count += 1;
});

describe('bindRegistry', () => {
  it('returns helpers bound to the provided registry', () => {
    const bound = bindRegistry(createRegistry());
    const counter = bound.createStore(counterStore);
    expect(counter.count).toBe(0);

    bound.useAction(increment)();
    expect(counter.count).toBe(1);
  });

  it('isolates state across registries', () => {
    const a = bindRegistry(createRegistry());
    const b = bindRegistry(createRegistry());
    const counterA = a.createStore(counterStore);
    const counterB = b.createStore(counterStore);

    a.useAction(increment)();
    expect(counterA.count).toBe(1);
    expect(counterB.count).toBe(0);
  });

  it('wraps perform for async effects', async () => {
    const { useEffect } = bindRegistry(createRegistry());

    const effect = defineEffect(
      (x: number): Promise<number> => Promise.resolve(x * 2),
    );
    await expect(useEffect(effect)(3)).resolves.toBeUndefined();
  });

  it('wraps perform for sync effects', () => {
    const { useEffect } = bindRegistry(createRegistry());

    const fn = (x: number): number => x + 1;
    const effect = defineEffect(fn);
    const result: void = useEffect(effect)(1);
    expect(result).toBeUndefined();
  });

  it('exposes raw invoke and perform', async () => {
    const bound = bindRegistry(createRegistry());
    const counter = bound.createStore(counterStore);

    bound.invoke(increment, undefined);
    expect(counter.count).toBe(1);

    const effect = defineEffect(
      (x: number): Promise<number> => Promise.resolve(x),
    );
    await expect(bound.perform(effect, 5)).resolves.toBeUndefined();
  });
});

describe('module-level bindings (global registry)', () => {
  it('read and mutate the global registry', () => {
    const oneOff = defineStore<Counter>(() => ({ count: 0 }));
    const bumpOneOff = defineAction([oneOff], (c) => {
      c.count += 2;
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
      const effect = defineEffect(
        (x: number): Promise<number> => Promise.resolve(x),
      );
      await expect(globalUseEffect(effect)(1)).resolves.toBeUndefined();
    } finally {
      destroyStore(oneOff);
    }
  });
});
